// Three or four real browser UIs and Firebase SDKs against local Auth/RTDB
// emulators. All accounts are synthetic; this is not a production/device test.
const {chromium}=require(process.env.PW_PATH||'playwright');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {initializeApp:initializeAdmin,deleteApp:deleteAdmin}=require('firebase-admin/app');
const {getAuth:getAdminAuth}=require('firebase-admin/auth');
const {ref,get,set}=require('firebase/database');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
for(const [name,port] of [['FIREBASE_AUTH_EMULATOR_HOST',9099],['FIREBASE_DATABASE_EMULATOR_HOST',9000]]){
 if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(process.env[name]))throw Error(`${name} must explicitly name the local emulator`);
}
const project='demo-ironpath',root=path.resolve(__dirname,'../..'),releaseDir=path.join(root,'release-tools');
const count=Number(process.env.IRONPATH_BROWSER_PLAYERS||3),lastWave=Number(process.env.IRONPATH_BROWSER_WAVES||1),testEnd=process.env.IRONPATH_TEST_END==='1',testSignOut=process.env.IRONPATH_TEST_SIGNOUT==='1',signOutAction=process.env.IRONPATH_TEST_SIGNOUT_ACTION||'wait',testReject=process.env.IRONPATH_TEST_REJECT==='1',testRecovery=process.env.IRONPATH_TEST_RECOVERY==='1',testMaintenance=process.env.IRONPATH_TEST_MAINTENANCE==='1',modeEnd=process.env.IRONPATH_TEST_MODE_END||'',naturalEnd=process.env.IRONPATH_TEST_NATURAL==='1',offlineEnd=process.env.IRONPATH_TEST_OFFLINE_END==='1';
if(![2,3,4].includes(count)||![1,2,3].includes(lastWave)||(testEnd&&(lastWave!==2||count<3))||(testSignOut&&(!testEnd||count!==4))||!['wait','cancel','now'].includes(signOutAction)||(!testSignOut&&signOutAction!=='wait')||(testReject&&!testEnd)||(testRecovery&&(!testEnd||testSignOut||testReject))||(testMaintenance&&(!testEnd||testSignOut||testRecovery||testReject||modeEnd))||(modeEnd&&!['versus','two-vs-two'].includes(modeEnd))||(modeEnd==='versus'&&count!==2)||(modeEnd==='two-vs-two'&&count!==4)||(naturalEnd&&!modeEnd)||(offlineEnd&&(!modeEnd||naturalEnd))||(count===2&&!modeEnd)||(modeEnd&&testEnd))throw Error('Invalid multiplayer browser test configuration');
// In the end scenario, hold one genuine profile transaction before it reaches
// Firebase. For the rejection case only, add an invalid field to the transaction
// result so the *emulator rules* actually reject it; subsequent retries are real.
const databaseWrapper=`
export * from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-real.js';
import {runTransaction as realTransaction} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-real.js';
export async function runTransaction(reference,update,options){
 if(window.__holdPartyReward===true&&reference.key===window.__partyTestUid){
  window.__heldPartyRewardCount=(window.__heldPartyRewardCount||0)+1;
  await new Promise(resolve=>(window.__partyRewardReleases??=[]).push(resolve));
 }
 if(window.__rejectPartyReward===true&&reference.key===window.__partyTestUid){
  try{return await realTransaction(reference,current=>{const next=update(current);return next?{...next,__invalidRewardTest:true}:next;},options);}
  catch(error){window.__partyRewardRejected=String(error?.code||error);throw error;}
 }
 return realTransaction(reference,update,options);
}`;
// The normal Pages build uses password Auth and the Firebase-only maintenance
// gate, not the separate custom-token guard exercised by the other scenarios.
// Test adapters retarget only the public config/probe and SDK endpoints; the
// account entry and game remain the real staged modules.
const maintenanceConfig={apiKey:'fake',authDomain:'demo-ironpath.firebaseapp.com',databaseURL:'https://demo-ironpath.firebaseio.com',projectId:project,appId:'fake-app'};
const maintenanceAuthWrapper=`
export * from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-real.js';
import {getAuth as realGetAuth,connectAuthEmulator} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-real.js';
const prepared=new WeakSet();
export function getAuth(app){const auth=realGetAuth(app);if(!prepared.has(auth)){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});prepared.add(auth);}window.__maintenanceTestAuth=auth;return auth;}
`;
const maintenanceDatabaseWrapper=databaseWrapper+`
import {getDatabase as realGetDatabase,connectDatabaseEmulator,goOffline,goOnline} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-real.js';
const prepared=new WeakSet();
export function getDatabase(app){const db=realGetDatabase(app);if(!prepared.has(db)){connectDatabaseEmulator(db,'127.0.0.1',9000);prepared.add(db);}window.ironPathMultiplayerTest={offline:()=>goOffline(db),online:()=>goOnline(db)};return db;}
`;
function replaceOnce(source,pattern,replacement,label){
 if([...source.matchAll(pattern)].length!==1)throw Error(`Unexpected ${label} in staged ordinary game`);
 return source.replace(pattern,replacement);
}
// Distinct emulator UIDs let both sizes run in one emulators:exec invocation.
const players=[{name:'Alice',viewport:{width:390,height:844},touch:true},
 {name:'Bob',viewport:{width:844,height:390},touch:true},
 {name:'Cara',viewport:{width:1280,height:800},touch:false},
 {name:'Dan',viewport:{width:1024,height:768},touch:false}].slice(0,count).map(p=>({...p,id:`browser-mp-${count}${testSignOut?`-signout-${signOutAction}`:''}-${p.name.toLowerCase()}`}));
const email=p=>`${p.id}@example.test`,password='example-password-123';
const emulatorStatus=`http://127.0.0.1:9000/_ironpathRelease.json?ns=${project}`;
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.ico':'image/x-icon'};
const bootstrap=`
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {initializeAuth,inMemoryPersistence,connectAuthEmulator,beforeAuthStateChanged,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithCustomToken,signOut,sendPasswordResetEmail} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getDatabase,connectDatabaseEmulator,goOffline,goOnline} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import {createGuardedGameBootstrap} from './release-tools/guarded-game-bootstrap.mjs';
import {installGuardedAccountSession} from './core/account-services.mjs?v=20261031-releaseguard1';
const game=document.getElementById('guardedTestGame'),hold=document.getElementById('guardedTestHold');let instances;
const sdk={initializeApp,initializeAuth,inMemoryPersistence,getDatabase,beforeAuthStateChanged,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithCustomToken,signOut,sendPasswordResetEmail,goOffline};
const runtime=createGuardedGameBootstrap({config:{apiKey:'fake',authDomain:'demo-ironpath.firebaseapp.com',projectId:'demo-ironpath',databaseURL:'https://demo-ironpath.firebaseio.com'},sdk,
 configure:value=>{instances=value;connectAuthEmulator(value.auth,'http://127.0.0.1:9099',{disableWarnings:true});connectAuthEmulator(value.passwordAuth,'http://127.0.0.1:9099',{disableWarnings:true});connectDatabaseEmulator(value.db,'127.0.0.1',9000);},
 build:document.documentElement.dataset.ironpathReleaseBuild,sessionEndpoint:'https://release.example/api/session',statusFetcher:(_u,o)=>fetch('/status',o),sessionFetcher:(_u,o)=>fetch('/api/session',o),intervalMs:60000,statusTimeoutMs:5000,
 installSession:installGuardedAccountSession,importGame:()=>import('./account.js'),
 onHold:reason=>{game.hidden=true;game.inert=true;hold.hidden=false;hold.textContent='TEST HOLD: '+reason;},
 showGame:()=>{game.inert=false;game.hidden=false;hold.hidden=true;},replaceDocument:()=>location.replace('/test-landing')});
window.ironPathMultiplayerTest={offline:()=>goOffline(instances.db),online:()=>goOnline(instances.db)};runtime.start();`;
function guardedHtml(html){
 const script=/<script type="module" src="(?:account\.js|account-entry\.mjs)\?v=[^"]+"><\/script>/g;
 if([...html.matchAll(script)].length!==1||!html.includes('<html lang="en"')||!html.includes('<body>')||!html.includes('</body>'))throw Error('Unexpected game entry');
 return html.replace('<html lang="en"','<html lang="en" data-ironpath-guard="required"')
  .replace('<body>','<body><div id="guardedTestHold">TEST HOLD</div><div id="guardedTestGame" hidden inert>')
  .replace(script,'<script type="module" src="multiplayer-test-bootstrap.mjs"></script>')
  .replace('</body>','</div></body>');
}
(async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ironpath-multiplayer-browser-'));
 let env,browser,server,admin;const contexts=[],pages=[],errors=[],external=[];let stage='prepare',recoveryReadRequests=0;
 try{
  const {stageVersion}=await import(pathToFileURL(path.join(releaseDir,'stage-version.mjs')).href);
  const out=path.join(tmp,'IronPath','releases');await fs.mkdir(out,{recursive:true});await stageVersion({sourceDir:root,outputDir:out,build:'mp-browser-1'});
  if(testRecovery){
   // Expose only the redacted error message from the temporary test copy;
   // recovery failures are normally swallowed into the user-facing ERROR state.
   const file=path.join(out,'mp-browser-1','net','firebase-recoverable-game.mjs'),original=await fs.readFile(file,'utf8');
   const patched=original.replaceAll('catch{fail();}',"catch(error){window.__recoveryTestError=String(error?.message||'error');fail();}").replaceAll('onError:fail',"onError:error=>{window.__recoveryTestError=String(error?.message||'error');fail();}");
   assert.notEqual(patched,original);await fs.writeFile(file,patched);
  }
  if(naturalEnd){
   // Test-only initial condition: one team's bunker has 1 HP so an actual
   // enemy can end the match quickly. The host simulation and SDK remain real;
   // this does not claim the normal starting balance was played to defeat.
   const file=path.join(out,'mp-browser-1','net','firebase-party-game.mjs'),original=await fs.readFile(file,'utf8');
   const needle=';const core=createPartyHost(initial,{hostId});';
   assert.equal(original.split(needle).length,2,'the natural-end test patch must have one known target');
   await fs.writeFile(file,original.replace(needle,";if(mode==='versus')initial.lanes[hostId].hp=1;else if(mode==='two-vs-two')initial.lanes[0].hp=1;const core=createPartyHost(initial,{hostId});"));
  }
  const source=await fs.readFile(path.join(root,'firebase/WORKSHOP-RULES-TO-PUBLISH.json'));
  const {buildSocialCleanupCandidate}=await import(pathToFileURL(path.join(root,'firebase/social-cleanup-candidate.mjs')).href);
  const {buildRulesCandidate}=await import(pathToFileURL(path.join(releaseDir,'rules-candidate.mjs')).href);
  const {buildMaintenanceRulesCandidate}=await import(pathToFileURL(path.join(releaseDir,'maintenance-rules.mjs')).href);
  const {createConfiguredSessionExchange}=await import(pathToFileURL(path.join(releaseDir,'session-service.mjs')).href);
  const {createReleaseSessionHttpHandler}=await import(pathToFileURL(path.join(releaseDir,'session-http.mjs')).href);
  const social=buildSocialCleanupCandidate(source);
  const candidate=testMaintenance?buildMaintenanceRulesCandidate(social,{adminUid:'local-multiplayer-admin'}).candidate:buildRulesCandidate(social).candidate;
  const sdkModules={};for(const name of ['firebase-app.js','firebase-auth.js','firebase-database.js'])sdkModules[name]=await fs.readFile(path.join(__dirname,'node_modules/firebase',name),'utf8');
  admin=initializeAdmin({projectId:project},'multiplayer-browser-admin');const adminAuth=getAdminAuth(admin);
  for(const player of players)await adminAuth.createUser({uid:player.id,email:email(player),password});
  const exchange=createConfiguredSessionExchange({databaseUrl:'https://demo-ironpath.firebaseio.com',adminAuth,fetcher:(_url,options)=>fetch(emulatorStatus,options)});
  const handleSession=createReleaseSessionHttpHandler({exchange,allowedOrigins:['https://0815games.github.io'],route:'/api/session'});
  server=http.createServer(async(req,res)=>{
   try{
    const pathname=new URL(req.url,'http://127.0.0.1').pathname;
    if(pathname==='/status'){const upstream=await fetch(emulatorStatus,{cache:'no-store'});res.writeHead(upstream.status,{'content-type':'application/json','cache-control':'no-store'}).end(await upstream.text());return;}
    if(pathname==='/api/session'){req.headers.origin='https://0815games.github.io';handleSession(req,res);return;}
    if(pathname==='/test-landing'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}).end('<!doctype html><title>Local guard test landing</title>');return;}
    if(pathname.endsWith('/multiplayer-test-bootstrap.mjs')){res.writeHead(200,{'content-type':'text/javascript'}).end(bootstrap);return;}
    let requested=pathname;if(requested.endsWith('/'))requested+='index.html';const file=path.resolve(tmp,'.'+requested);
    if(!file.startsWith(tmp+path.sep)){res.writeHead(403).end();return;}let body=await fs.readFile(file);
    if(requested.startsWith('/IronPath/releases/')){
     if(path.basename(file)==='index.html')body=testMaintenance?
      replaceOnce(body.toString('utf8'),/<meta name="ironpath-maintenance-database" content="[^"]+">/g,
       `<meta name="ironpath-maintenance-database" content="${maintenanceConfig.databaseURL}">`,'maintenance URL'):
      guardedHtml(body.toString('utf8'));
     else if(testMaintenance&&path.basename(file)==='account.js')body=replaceOnce(body.toString('utf8'),
      /^[ \t]*config:\{[^\r\n]*\},[ \t]*\/\/ @ironpath-account-firebase-config[ \t]*$/gm,
      ` config:${JSON.stringify(maintenanceConfig)}, // @ironpath-account-firebase-config`,'Firebase config');
    }
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(body);
   }catch{if(!res.headersSent)res.writeHead(404);res.end();}
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  env=await initializeTestEnvironment({projectId:project,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(candidate)}});
  const adminSet=(p,v)=>env.withSecurityRulesDisabled(ctx=>set(p?ref(ctx.database(),p):ref(ctx.database()),v));
  const adminGet=async p=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),p))).val();});return value;};
  const cutoff=(Math.floor(Date.now()/1000)-120)*1000;
  const control=testMaintenance?{_ironpathMaintenance:{format:1,mode:'open',authAfterMs:cutoff}}:
   {_ironpathRelease:{mode:'open',build:'mp-browser-1',epoch:'a'.repeat(32),authAfterMs:cutoff}};
  await env.clearDatabase();await adminSet('',{...control,players:Object.fromEntries(players.map(p=>[p.id,{name:p.name,gender:'female',xp:0}]))});
  const args=['--host-resolver-rules=MAP * 127.0.0.1'];if(process.env.CHROMIUM_PATH)args.push('--no-sandbox');
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args});
  for(const player of players){
   stage=`sign in ${player.name}`;
   const context=await browser.newContext({viewport:player.viewport,isMobile:player.touch,hasTouch:player.touch,reducedMotion:'reduce',serviceWorkers:'block'});contexts.push(context);
   await context.addInitScript(id=>{
    window.__partyTestUid=id;
    try{localStorage.setItem('ironpath:language','en');for(const prefix of ['training','tutorial','coach'])localStorage.setItem(`ironpath:${prefix}:v2:${id}`,'done');}catch{}
    // Throttle rendering only, so several full canvases do not starve input on
    // a small CI worker. Host simulation, network, real DOM and pointer events
    // remain active; this is deliberately not an FPS test.
    const nativeFrame=window.requestAnimationFrame.bind(window),nativeCancel=window.cancelAnimationFrame.bind(window),frames=new Map();let next=0;
    window.requestAnimationFrame=callback=>{const id=++next,entry={timer:null,frame:null};frames.set(id,entry);entry.timer=setTimeout(()=>{if(!frames.has(id))return;entry.frame=nativeFrame(time=>{frames.delete(id);callback(time);});},100);return id;};
    window.cancelAnimationFrame=id=>{const entry=frames.get(id);if(!entry)return;clearTimeout(entry.timer);if(entry.frame!==null)nativeCancel(entry.frame);frames.delete(id);};
   },player.id);
   await context.route('**/*',async route=>{const url=new URL(route.request().url()),name=url.pathname.split('/').pop();
    if(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/10.14.1/')){
     const body=testMaintenance&&name==='firebase-auth.js'?maintenanceAuthWrapper:
      testMaintenance&&name==='firebase-auth-real.js'?sdkModules['firebase-auth.js']:
      testMaintenance&&name==='firebase-database.js'?maintenanceDatabaseWrapper:
      testEnd&&name==='firebase-database.js'?databaseWrapper:name==='firebase-database-real.js'?sdkModules['firebase-database.js']:sdkModules[name];
     if(body)return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body});
    }
    if(testMaintenance&&url.hostname==='demo-ironpath.firebaseio.com'&&url.pathname==='/_ironpathMaintenance.json'){
     const upstream=await fetch(`http://127.0.0.1:9000/_ironpathMaintenance.json?ns=${project}`,{cache:'no-store',signal:AbortSignal.timeout(5000)});
     return route.fulfill({status:upstream.status,contentType:'application/json',headers:{'access-control-allow-origin':'*','cache-control':'no-store'},body:await upstream.text()});
    }
    // Firebase's emulator reference.toString() drops its namespace. Real RTDB
    // URLs carry it in the hostname; inject the local demo namespace only for
    // this server-authoritative REST read, without recording its auth token.
    if(testRecovery&&url.hostname==='127.0.0.1'&&url.port==='9000'&&/^\/fourParties\/[a-f0-9]{32}\/recovery\/sessions\/[a-f0-9]{32}\.json$/.test(url.pathname)){
     assert.equal(url.searchParams.has('ns'),false);url.searchParams.set('ns',project);recoveryReadRequests++;return route.continue({url:url.toString()});
    }
    if(url.hostname==='127.0.0.1'&&[String(server.address().port),'9000','9099'].includes(url.port))return route.continue();
    external.push(url.origin);return route.abort();
   });
   await context.routeWebSocket(()=>true,socket=>{const url=new URL(socket.url());if(url.hostname==='127.0.0.1'&&url.port==='9000')return socket.connectToServer();external.push(url.origin);return socket.close();});
   const page=await context.newPage();pages.push(page);page.setDefaultTimeout(30000);page.on('pageerror',error=>errors.push(`${player.name}: ${String(error)}`));
   // Each browser context represents a separate device. CDP focus emulation
   // prevents switching the test driver's active tab from blurring the host.
   const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});
   await page.goto(`http://127.0.0.1:${server.address().port}/IronPath/releases/mp-browser-1/${testRecovery&&player===players[0]?'?recovery=1':''}`);
   if(testMaintenance)assert.equal(await page.evaluate(()=>document.documentElement.hasAttribute('data-ironpath-guard')),false,'ordinary Pages entry must not use the custom-token guard');
   await page.locator('#authView').waitFor({state:'visible',timeout:30000});await page.evaluate(()=>{document.getElementById('introOverlay').hidden=true;});
   await page.locator('#email').fill(email(player));await page.locator('#password').fill(password);await page.locator('#authSubmit').click();
   await page.locator('#menuMultiplayer').waitFor({state:'visible',timeout:30000});assert.equal(await page.locator('#menuName').textContent(),player.name);
  }
  const [host,bob,cara]=pages;
  stage=`create and join ${count}-player party`;
  await host.locator('#menuMultiplayer').click();
  const {squadMapFor}=await import(pathToFileURL(path.join(root,'core/four-modes.mjs')).href);
  let code,partyId;
  // For a reproducible longer battle, choose the hand-built field by creating
  // ordinary parties until its random party ID selects that map. The ordinary
  // longer cases do not patch game state, clock, enemies, wallets or writes.
  // The separate natural-end case documents its altered initial HP above.
  // Short cases keep the normal map; simulation tests cover all squad roads.
  for(let attempt=0;attempt<40;attempt++){
   await host.locator('#fourPartyCreate').click();await host.locator('#fourPartyActive').waitFor({state:'visible'});
   code=await host.locator('#fourPartyCodeDisplay').textContent();assert.match(code,/^\d{4}$/);
   partyId=await adminGet(`fourCodes/${code}/partyId`);assert.match(partyId||'',/^[a-f0-9]{32}$/);
   if(lastWave===1||squadMapFor(partyId)==='four-front')break;
   await host.locator('#fourPartyLeave').click();await host.locator('#gameConfirmAccept').click();
   await host.locator('#fourPartyEntry').waitFor({state:'visible'});partyId=null;
  }
  assert.ok(partyId,'a suitable ordinary party was created');
  for(let i=1;i<players.length;i++){
   const page=pages[i];await page.locator('#menuMultiplayer').click();await page.locator('#fourPartyCodeInput').fill(code);await page.locator('#fourPartyJoin').click();
   await host.locator('#multiplayerPrompt').waitFor({state:'visible'});assert.match(await host.locator('#multiplayerPromptBody').textContent(),new RegExp(`${players[i].name} wants to join`));
   await host.locator('#multiplayerPromptActions [data-action="view"]').click();
   await host.locator('#fourPartyRequests li').filter({hasText:players[i].name}).getByRole('button',{name:'APPROVE',exact:true}).click();
   await host.locator('#fourPartyRoster').getByText(new RegExp(players[i].name)).waitFor({state:'visible'});
   await page.locator('#fourPartyActive').waitFor({state:'visible'});
  }
  await host.locator('#fourPartyMode').selectOption(modeEnd||'four-coop');await host.locator('#fourPartyStart').click();
  for(const page of pages)await page.waitForFunction(()=>document.getElementById('gameWorkspace').dataset.onlineReady==='true'&&!document.getElementById('start').disabled,null,{timeout:30000});
  if(modeEnd){
   const waitFor=async(read,predicate,label,timeout=30000)=>{const deadline=Date.now()+timeout;let value;do{value=await read();if(predicate(value))return value;await new Promise(resolve=>setTimeout(resolve,100));}while(Date.now()<deadline);throw Error(`Timed out: ${label}: ${JSON.stringify(value)}`);};
   const hostView=async()=>{try{return JSON.parse(await adminGet(`fourParties/${partyId}/views/${players[0].id}`))?.snapshot;}catch{return null;}};
   if(naturalEnd){
    stage=`${modeEnd}: play a wave to natural defeat with the test-only 1 HP bunker`;
    await host.locator('#start').click();
    for(const page of pages.slice(1)){await page.locator('#multiplayerPromptActions [data-action="approve"]').waitFor({state:'visible'});await page.locator('#multiplayerPromptActions [data-action="approve"]').click();}
    await Promise.all(pages.map(page=>page.waitForFunction(()=>document.getElementById('wave').textContent.startsWith('1 /'),null,{timeout:30000})));
    await host.locator('#speed').click();for(const page of pages.slice(1)){await page.locator('#multiplayerPromptActions [data-action="approve"]').waitFor({state:'visible'});await page.locator('#multiplayerPromptActions [data-action="approve"]').click();}
    await Promise.all(pages.map(page=>page.locator('#runResults').waitFor({state:'visible',timeout:150000})));
    const ended=await waitFor(hostView,v=>v?.match?.ended===true,`natural ${modeEnd} outcome`);
    assert.equal(ended.partyEnd,undefined,'natural defeat does not imply host intent to close');
    assert.ok(await adminGet(`fourParties/${partyId}`));
    const outcomes=await Promise.all(pages.map(page=>page.locator('#resultsTitle').textContent()));
    assert.ok(outcomes.some(v=>/Victory/i.test(v))&&outcomes.some(v=>/Defeat/i.test(v)),`both sides see the natural outcome: ${outcomes}`);
    await host.locator('#resultsDone').click();await host.locator('#menuResume').click();
    await host.locator('#endRun').click();await host.locator('#gameConfirmAccept').click();
   }else{
    if(offlineEnd){
     stage=`${modeEnd}: start a real wave and pause on guest disconnect`;
     await host.locator('#start').click();
     for(const page of pages.slice(1)){await page.locator('#multiplayerPromptActions [data-action="approve"]').waitFor({state:'visible'});await page.locator('#multiplayerPromptActions [data-action="approve"]').click();}
     await Promise.all(pages.map(page=>page.waitForFunction(()=>document.getElementById('wave').textContent.startsWith('1 /'),null,{timeout:30000})));
     await pages.at(-1).evaluate(()=>window.ironPathMultiplayerTest.offline());
     await host.waitForFunction(()=>document.getElementById('coopStatus').textContent==='WAITING',null,{timeout:30000});
     await new Promise(resolve=>setTimeout(resolve,500));const paused=await hostView();assert.equal(paused.partyEnd,undefined,'a disconnect is not end intent');
     await new Promise(resolve=>setTimeout(resolve,500));assert.equal((await hostView()).tick,paused.tick,'the active battle stays frozen while the roster is incomplete');
     assert.ok(await adminGet(`fourParties/${partyId}`));
    }
    stage=`${modeEnd}: host intentionally ends${offlineEnd?' with a missing guest':''}`;
    await host.waitForFunction(()=>!document.getElementById('endRun').disabled,null,{timeout:30000});
    await host.locator('#endRun').click();await host.locator('#gameConfirmAccept').click();
    if(offlineEnd){
     await host.locator('#runResults').waitFor({state:'visible',timeout:30000});
     const onlineIds=players.slice(0,-1).map(p=>p.id),absentId=players.at(-1).id;
     const final=await waitFor(hostView,v=>v?.partyEnd&&onlineIds.every(id=>v.partyEnd.acknowledged.includes(id)),`${modeEnd} online final receipts`);
     assert.ok(!final.partyEnd.acknowledged.includes(absentId),'the offline guest has not acknowledged');
     assert.ok(await adminGet(`fourParties/${partyId}`),'the party stays open for the missing receipt');
     await pages.at(-1).evaluate(()=>window.ironPathMultiplayerTest.online());
    }
   }
   await waitFor(()=>adminGet(`fourParties/${partyId}`),value=>value===null,`${modeEnd} party deletion`);
   assert.equal(await adminGet(`fourCodes/${code}`),null);
   if(naturalEnd){await host.locator('#menuResults').waitFor({state:'visible',timeout:30000});await host.locator('#menuResults').click();}
   for(const page of pages){
    await page.locator('#runResults').waitFor({state:'visible',timeout:30000});
    await page.waitForFunction(()=>document.getElementById('resultsSave').textContent.includes('host closed the party'),null,{timeout:30000});
    assert.equal(await page.locator('#runResults').getAttribute('data-save'),'confirmed');
   }
   assert.deepEqual(external,[],'no live network requests');assert.deepEqual(errors,[],'no browser errors');
   console.log(`${modeEnd}: ${naturalEnd?'test-only 1 HP natural defeat and subsequent explicit host close':offlineEnd?'paused wave, intentional host end and missing guest reconnect':'intentional host end'}, reports and confirmed party/code closure passed in ${count} Chromium UIs with local Firebase.`);
   return;
  }
  if(testEnd)await cara.evaluate(()=>{window.__holdPartyReward=true;window.__heldPartyRewardCount=0;window.__partyRewardReleases=[];});

  stage='prepare fitted views';
  for(const page of pages){
   await page.waitForFunction(()=>document.getElementById('game').dataset.fullBattle==='true');
   // FIT is deterministic for coordinate projection. The build and upgrade
   // actions themselves below use real mouse/touch and visible game controls.
   await page.evaluate(()=>{const button=document.getElementById('mapZoom');if(button.getAttribute('aria-pressed')==='true')button.click();});
  }
  const points=await Promise.all(pages.map(page=>page.evaluate(async partyId=>{
   const {squadMapFor}=await import('./core/four-modes.mjs'),{getMap}=await import('./core/maps.mjs'),{createBattleViewport}=await import('./battle/battle-viewport.mjs');
   const map=getMap(squadMapFor(partyId)),canvas=document.getElementById('game'),r=canvas.getBoundingClientRect(),h=Math.round(960*r.height/r.width);
   const view=createBattleViewport(map.width,map.height,960,h);
   return map.pads.map((pad,index)=>{const x=r.left+(pad.x-view.x)*view.scale*r.width/view.width,y=r.top+(pad.y-view.y)*view.scale*r.height/view.height;
    return {index,x,y,visible:x>=12&&x<innerWidth-12&&y>=12&&y<innerHeight-12&&document.elementFromPoint(x,y)===canvas};});
  },partyId)));
  let common=points[0].filter(p=>p.visible&&points.every(items=>items[p.index]?.visible)).map(p=>p.index);
  assert.ok(common.length>=(lastWave>1?4:2),`enough build pads visible on all fitted fields: ${JSON.stringify(points)}`);
  if(lastWave>1){
   // Prefer pads covering a lot of both roads. This is only the test's normal
   // play strategy: all construction still happens through actual UI input.
   const {getMap}=await import(pathToFileURL(path.join(root,'core/maps.mjs')).href),map=getMap(squadMapFor(partyId)),samples=[];
   for(const road of map.paths||[map.path])for(let i=1;i<road.length;i++){
    const a=road[i-1],b=road[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/20));
    for(let j=0;j<steps;j++)samples.push({x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps});
   }
   const score=index=>samples.reduce((n,p)=>n+(Math.hypot(p.x-map.pads[index].x,p.y-map.pads[index].y)<=135?1:0),0);
   common=common.sort((a,b)=>score(b)-score(a)||a-b);
  }
  const [sharedPad,ownPad,extraPad,secondExtraPad]=common;
  const tapPad=async(index,playerIndex)=>{
   const point=points[playerIndex][index],page=pages[playerIndex];
   assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,point),'game','pad is unobscured');
   if(players[playerIndex].touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
   // The radial container deliberately has a zero-sized box; its buttons are
   // visible around it, so Playwright's element visibility is not the state.
   await page.waitForFunction(()=>!document.getElementById('radialMenu').hidden);
  };
  const waitViews=async(predicate,label)=>{
   const deadline=Date.now()+30000;let values;
   while(Date.now()<deadline){
    const lease=testRecovery?await adminGet(`fourParties/${partyId}/recovery/lease`):null;
    values=await Promise.all(players.map(async p=>{const base=testRecovery?`fourParties/${partyId}/recovery/sessions/${lease?.owner}/views`:`fourParties/${partyId}/views`,raw=await adminGet(`${base}/${p.id}`);try{return JSON.parse(raw)?.snapshot;}catch{return null;}}));
    if(values.every(predicate))return values;
    await new Promise(resolve=>setTimeout(resolve,100));
   }
   throw Error(`${label}: timed out`);
  };
  const build=async(index,playerIndex)=>{
   await tapPad(index,playerIndex);assert.match(await pages[playerIndex].locator('#sheetTitle').textContent(),/Build defense/);
   await pages[playerIndex].locator('#radial0').click();await pages[playerIndex].locator('#towerDetailsConfirm').click();
   await pages[playerIndex].waitForFunction(()=>document.getElementById('radialMenu').hidden);
   await waitViews(v=>v?.match?.match?.towers.some(t=>t.pad===index&&t.ownerId===players[playerIndex].id),'built tower reaches each Firebase view');
  };
  const upgrade=async(index,playerIndex)=>{
   await tapPad(index,playerIndex);assert.match(await pages[playerIndex].locator('#sheetTitle').textContent(),/MG Nest/);
   assert.equal(await pages[playerIndex].locator('#menuPrice0').innerText(),'70');await pages[playerIndex].locator('#radial0').click();
   await pages[playerIndex].waitForFunction(()=>document.getElementById('radialMenu').hidden);
   return waitViews(v=>v?.match?.match?.towers.some(t=>t.pad===index&&t.level===2),'upgrade reaches each Firebase view');
  };
  stage='build and upgrade teammate tower';await build(sharedPad,1);let views=await upgrade(sharedPad,0);
  for(const v of views){assert.equal(v.match.match.players[players[0].id].money,55);assert.equal(v.match.match.players[players[1].id].money,75);}
  stage='build and upgrade own tower';await build(ownPad,2);views=await upgrade(ownPad,2);
  for(const v of views)assert.equal(v.match.match.players[players[2].id].money,5);
  for(let i=0;i<pages.length;i++)assert.equal(await pages[i].locator('#money').innerText(),['55','75','5','125'][i]);
  if(lastWave>1){
   stage='add reinforcements for the longer battle';
   await build(extraPad,1);await build(secondExtraPad,count===4?3:0);
  }

  stage='guest request is invalidated by offline and reconnect';
  await cara.locator('#start').click();await host.locator('#multiplayerPrompt').waitFor({state:'visible'});
  assert.match(await host.locator('#multiplayerPromptBody').innerText(),/Cara requests wave 1/);
  await cara.evaluate(()=>window.ironPathMultiplayerTest.offline());
  await host.locator('#multiplayerPrompt').waitFor({state:'hidden',timeout:30000});
  await cara.evaluate(()=>window.ironPathMultiplayerTest.online());
  await cara.waitForFunction(()=>!document.getElementById('start').disabled&&document.getElementById('start').textContent==='REQUEST WAVE',null,{timeout:30000});
  const voters=pages.filter((_page,i)=>i!==2);
  async function requestWave(wave){
   await cara.locator('#start').click();await host.locator('#multiplayerPrompt').waitFor({state:'visible'});
   assert.match(await host.locator('#multiplayerPromptBody').innerText(),new RegExp(`Cara requests wave ${wave}`));
   for(let i=0;i<voters.length;i++){
    await voters[i].locator('#multiplayerPromptActions [data-action="approve"]').waitFor({state:'visible'});
    await voters[i].locator('#multiplayerPromptActions [data-action="approve"]').click();
    if(i<voters.length-1){
     const missing=voters.length-i-1;
     await cara.waitForFunction(n=>document.getElementById('waveRequestText').textContent.includes(`${n} approval${n===1?'':'s'} still needed`),missing,{timeout:30000});
    }
   }
   await Promise.all(pages.map(page=>page.waitForFunction(n=>document.getElementById('wave').textContent.startsWith(`${n} /`),wave,{timeout:30000})));
  }
  async function requestSpeed(wave){
   await cara.locator('#speed').click();await host.locator('#multiplayerPrompt').waitFor({state:'visible'});
   assert.match(await host.locator('#multiplayerPromptBody').innerText(),new RegExp(`Cara requests 2× for wave ${wave}`));
   assert.match(await host.locator('#multiplayerPromptNote').innerText(),/Battle continues/);
   for(let i=0;i<voters.length;i++){
    await voters[i].locator('#multiplayerPromptActions [data-action="approve"]').waitFor({state:'visible'});await voters[i].locator('#multiplayerPromptActions [data-action="approve"]').click();
    if(i<voters.length-1)await cara.waitForFunction(({approved,required})=>document.getElementById('speedRequestText').textContent.includes(`${approved}/${required} approved`),{approved:i+1,required:voters.length},{timeout:30000});
   }
   await Promise.all(pages.map(page=>page.waitForFunction(()=>document.getElementById('speed').textContent.includes('2× ·'),null,{timeout:30000})));
  }
  let priorXp=Object.fromEntries(players.map(p=>[p.id,0]));
  async function waitForClear(wave){
   // Observe the actual battle, including leaks and asynchronous reward writes.
   // Do not inject steps or change a match snapshot to advance the wave.
   await Promise.all(pages.map(page=>page.waitForFunction(n=>{
    const start=document.getElementById('start');return start.textContent==='MATCH ENDED'||document.getElementById('wave').textContent.startsWith(`${n} /`)&&start.textContent==='REQUEST WAVE'&&!start.disabled;
   },wave,{timeout:120000})));
   for(const page of pages)assert.equal(await page.locator('#start').textContent(),'REQUEST WAVE','the battle survived the wave');
   const deadline=Date.now()+20000;let profiles;
   do{
    profiles=await Promise.all(players.map(p=>adminGet(`players/${p.id}`)));
    if(profiles.every((profile,i)=>testEnd&&i===2||profile?.xp>priorXp[players[i].id]))break;
    await new Promise(resolve=>setTimeout(resolve,100));
   }while(Date.now()<deadline);
   for(let i=0;i<players.length;i++){
    if(testEnd&&i===2){assert.equal(profiles[i]?.xp,priorXp[players[i].id],'the held guest reward has not reached the emulator');continue;}
    assert.ok(profiles[i]?.xp>priorXp[players[i].id],`${players[i].name} received additional server-confirmed XP for wave ${wave}`);
    priorXp[players[i].id]=profiles[i].xp;
   }
   if(testEnd)await cara.waitForFunction(()=>window.__heldPartyRewardCount>0,null,{timeout:20000});
  }
  for(let wave=1;wave<=lastWave;wave++){
   stage=`unanimous guest wave ${wave} and 2x`;await requestWave(wave);await requestSpeed(wave);
   if(wave<lastWave){stage=`play wave ${wave} and confirm each server reward`;await waitForClear(wave);}
  }
  if(lastWave>1){
   stage='return to normal speed';await host.locator('#speed').click();
   await Promise.all(pages.map(page=>page.waitForFunction(()=>document.getElementById('speed').textContent==='REQUEST 2×',null,{timeout:30000})));
  }
  if(testEnd){
   const waitFor=async(read,predicate,label,timeout=30000)=>{const deadline=Date.now()+timeout;let value;do{value=await read();if(predicate(value))return value;await new Promise(resolve=>setTimeout(resolve,100));}while(Date.now()<deadline);throw Error(`Timed out: ${label}: ${JSON.stringify(value)}`);};
   const hostView=async()=>{try{
    if(testRecovery){const lease=await adminGet(`fourParties/${partyId}/recovery/lease`);return JSON.parse(await adminGet(`fourParties/${partyId}/recovery/sessions/${lease.owner}/views/${players[0].id}`))?.snapshot;}
    return JSON.parse(await adminGet(`fourParties/${partyId}/views/${players[0].id}`))?.snapshot;
   }catch{return null;}};
   stage='temporary host disconnect must not close the party';
   await host.evaluate(()=>window.ironPathMultiplayerTest.offline());
   await bob.waitForFunction(()=>document.getElementById('coopStatus').textContent==='WAITING',null,{timeout:30000});
   assert.ok(await adminGet(`fourParties/${partyId}`),'a brief host disconnect does not delete the party');
   assert.equal((await hostView())?.partyEnd,undefined,'a disconnect is not an end intent');
   await host.evaluate(()=>window.ironPathMultiplayerTest.online());
   await Promise.all(pages.map(page=>page.waitForFunction(()=>document.getElementById('coopStatus').textContent==='READY',null,{timeout:30000})));
   stage='host intentionally ends while one guest is offline';
   await cara.evaluate(()=>window.ironPathMultiplayerTest.offline());
   await waitFor(hostView,view=>view?.match?.members?.[players[2].id]?.active===false,'host observes offline guest');
   if(testSignOut){
    // Use the real visible field menu while the match is still running. A
    // programmatic click on the legacy or command-center button would not
    // prove that the user can reach sign-out over the full-screen canvas.
    assert.equal((await hostView())?.match?.match?.ended,false,'sign-out starts in a live match');
    assert.equal((await hostView())?.partyEnd,undefined,'the test has not ended the match first');
    await host.locator('#fieldOps > summary').click();await host.locator('#fieldLogout').click();
    assert.match(await host.locator('#gameConfirmText').innerText(),/Signing out now can leave the party open/);
    assert.equal(await host.locator('#gameConfirmAlternate').innerText(),'SIGN OUT NOW');
    if(signOutAction==='now'){
     await host.locator('#gameConfirmAlternate').click();await host.waitForURL('**/test-landing',{timeout:30000});
     await bob.waitForFunction(()=>document.getElementById('coopStatus').textContent==='WAITING',null,{timeout:30000});
     assert.ok(await adminGet(`fourParties/${partyId}`),'an immediate logout must not silently delete an unconfirmed party');
     assert.equal((await hostView())?.partyEnd,undefined,'immediate sign-out does not invent an end intent');
     assert.equal((await adminGet(`players/${players[2].id}`)).xp,0,'the held reward remains unconfirmed');
     assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
     console.log('Immediate host sign-out from the live field fenced the document while the unconfirmed party remained on the local emulator.');return;
    }
    await host.locator('#gameConfirmAccept').click();
    await host.locator('#runResults').waitFor({state:'visible',timeout:30000});
    await host.locator('#resultsDone').click();
    await host.locator('#partySignOutStatus').waitFor({state:'visible',timeout:30000});
    assert.match(await host.locator('#partySignOutStatus').innerText(),/waiting for every report/i);
    assert.notEqual(new URL(host.url()).pathname,'/test-landing','the chosen deferred sign-out must wait for the missing guest and reward');
    if(signOutAction==='cancel'){
     await host.locator('#menuLogout').click();assert.match(await host.locator('#gameConfirmText').innerText(),/cancel the scheduled sign-out/i);
     await host.locator('#gameConfirmAccept').click();await host.locator('#partySignOutStatus').waitFor({state:'hidden'});
    }
   }else{
    await host.locator('#endRun').click();await host.locator('#gameConfirmAccept').click();
    await host.locator('#runResults').waitFor({state:'visible',timeout:30000});
   }
   const onlineIds=players.filter((_p,index)=>index!==2).map(p=>p.id);
   const finalBefore=await waitFor(hostView,view=>view?.partyEnd&&onlineIds.every(id=>view.partyEnd.acknowledged.includes(id))&&!view.partyEnd.acknowledged.includes(players[2].id),'online reports acknowledged');
   assert.ok(await adminGet(`fourParties/${partyId}`),'the offline guest has not confirmed');
   assert.equal((await adminGet(`players/${players[2].id}`)).xp,0,'the held reward is not server-confirmed');
   if(testRecovery){
    stage='host reloads and recovers the same uncompleted end generation';
    const oldLease=await adminGet(`fourParties/${partyId}/recovery/lease`);assert.equal(oldLease.generation,1);
    await host.reload();await host.locator('#authView').waitFor({state:'visible',timeout:30000});
    await host.evaluate(()=>{document.getElementById('introOverlay').hidden=true;});
    await host.locator('#email').fill(email(players[0]));await host.locator('#password').fill(password);await host.locator('#authSubmit').click();
    await host.locator('#menuMultiplayer').waitFor({state:'visible',timeout:30000});await host.locator('#menuMultiplayer').click();
    // After reload the host's wave is already credited, but its new queue must
    // revalidate that receipt with the server before it may close the party.
    await host.evaluate(()=>{window.__holdPartyReward=true;window.__heldPartyRewardCount=0;window.__partyRewardReleases=[];});
    await host.locator('#fourPartyCodeInput').fill(code);await host.locator('#fourPartyResume').click();
    await host.locator('#runResults').waitFor({state:'visible',timeout:60000});
    await host.waitForFunction(()=>window.__heldPartyRewardCount>0,null,{timeout:30000});
    await waitFor(()=>adminGet(`fourParties/${partyId}/recovery/lease`),lease=>lease?.generation===2,'new recovery generation',60000);
    const restored=await waitFor(hostView,view=>view?.partyEnd?.tick===finalBefore.partyEnd.tick&&onlineIds.every(id=>view.partyEnd.acknowledged.includes(id)),'restored finalization',60000);
    assert.ok(recoveryReadRequests>0,'takeover used the server REST checkpoint read');
    assert.ok(!restored.partyEnd.acknowledged.includes(players[2].id));
    assert.ok(await adminGet(`fourParties/${partyId}`),'recovery does not close without the missing guest');
   }
   stage='guest receives the end but still has a held reward transaction';
   await cara.evaluate(()=>window.ironPathMultiplayerTest.online());await cara.locator('#runResults').waitFor({state:'visible',timeout:30000});
   await cara.waitForFunction(()=>document.getElementById('coopStatus').textContent==='READY',null,{timeout:30000});
   const held=await hostView();assert.ok(held?.partyEnd);assert.ok(!held.partyEnd.acknowledged.includes(players[2].id),'a report alone is not a saved reward');
   assert.ok(await adminGet(`fourParties/${partyId}`),'the host does not close while the transaction is held');
   assert.equal((await adminGet(`players/${players[2].id}`)).xp,0);
   stage='release the guest reward and close only after everyone confirms';
   if(testReject)await cara.evaluate(()=>{window.__rejectPartyReward=true;});
   await cara.evaluate(()=>{window.__holdPartyReward=false;for(const release of window.__partyRewardReleases.splice(0))release();});
   if(testReject){
    stage='a real rules-denied reward transaction must keep the party open';
    await cara.waitForFunction(()=>/permission.denied/i.test(window.__partyRewardRejected||''),null,{timeout:30000});
    await cara.waitForFunction(()=>document.getElementById('runResults').dataset.save==='failed',null,{timeout:30000});
    assert.equal((await adminGet(`players/${players[2].id}`)).xp,0,'the rejected transaction saved neither XP nor receipt');
    assert.ok(await adminGet(`fourParties/${partyId}`),'a rejected reward does not close the party');
    assert.ok(!(await hostView()).partyEnd.acknowledged.includes(players[2].id),'the rejected reward cannot be acknowledged');
    await cara.evaluate(()=>{window.__rejectPartyReward=false;});
   }
   const saved=await waitFor(()=>adminGet(`players/${players[2].id}`),p=>p?.xp>0&&!!(p.coopRewards?.[partyId]&1),'guest server reward');assert.ok(saved.xp>0);
   if(testRecovery){
    stage='recovered host must revalidate its existing receipt before closure';
    await waitFor(hostView,view=>view?.partyEnd&&players.every(p=>view.partyEnd.acknowledged.includes(p.id)),'all persisted player acknowledgements');
    assert.ok(await adminGet(`fourParties/${partyId}`),'old host acknowledgement is insufficient while its new receipt check is held');
    assert.equal((await adminGet(`players/${players[0].id}`)).xp,priorXp[players[0].id],'the already credited host wave has not been paid twice');
    await host.evaluate(()=>{window.__holdPartyReward=false;for(const release of window.__partyRewardReleases.splice(0))release();});
   }
   await waitFor(()=>adminGet(`fourParties/${partyId}`),value=>value===null,'party deletion after all acknowledgements');
   assert.equal(await adminGet(`fourCodes/${code}`),null);
   for(const page of testSignOut?pages.slice(1):pages){
    await page.locator('#runResults').waitFor({state:'visible',timeout:30000});
    await page.waitForFunction(()=>document.getElementById('resultsSave').textContent.includes('host closed the party'),null,{timeout:30000});
    assert.equal(await page.locator('#runResults').getAttribute('data-save'),'confirmed');
    // After host reload, the earlier receipt is confirmed again but is not
    // double-counted as XP gained during the new document's session. That
    // session label must be visibly legible, not only in the accessibility tree.
    const rewardLine=page.locator('#resultsRewards');
    assert.match(await rewardLine.innerText(),testRecovery&&page===host?/\+0 XP/:/\+30 XP/);
    const box=await rewardLine.boundingBox();assert.ok(box&&box.width>100&&box.height>5,'the session reward explanation is visible');
    if(testRecovery&&page===host)assert.match(await page.locator('#resultsSave').innerText(),/earlier rewards.*already saved/i);
   }
   if(testSignOut&&signOutAction==='cancel'){
    assert.notEqual(new URL(host.url()).pathname,'/test-landing','cancelled sign-out does not run after the party closes');
    await host.locator('#menuResults').click();await host.locator('#runResults').waitFor({state:'visible'});
    assert.equal(await host.locator('#runResults').getAttribute('data-save'),'confirmed');
   }else if(testSignOut)await host.waitForURL('**/test-landing',{timeout:30000});
   console.log(`${count} browser finalization${testMaintenance?' with ordinary Pages authentication and Firebase maintenance gate':''}: host disconnect, offline guest, held server reward${testReject?', rules-denied reward and retry':''}${testRecovery?', host reload, fenced recovery and held receipt revalidation':''}, report delivery and confirmed automatic party closure${testSignOut?signOutAction==='cancel'?' with cancelled sign-out':' before sign-out':''} passed.`);
  }
  assert.deepEqual(external,[],'no live network requests');assert.deepEqual(errors,[],'no browser errors');
  console.log(`${count} isolated browser UIs and Firebase emulators: own/teammate tower upgrades, payer balances, guest vote, offline/reconnect and unanimous 2× through wave ${lastWave} passed.`);
 }catch(error){
  console.error('Multiplayer browser test stage:',stage);
  for(const page of pages)console.error('Browser state:',await page.evaluate(()=>({...Object.fromEntries(['entryMessage','loading','authView','connectionView','characterView','versionGate','maintenanceGate','saveStatus','fourPartyStatus','coopStatus','wave','money','message','sheetTitle','onlineConnecting'].map(id=>{const e=document.getElementById(id);return [id,{hidden:e?.hidden,text:e?.textContent?.slice(0,180)}];})),authUid:window.__maintenanceTestAuth?.currentUser?.uid,recoveryTestError:window.__recoveryTestError})).catch(()=>({})));
  console.error('Browser errors:',errors,'blocked origins:',external);throw error;
 }finally{
  for(const context of contexts)await context.close();if(browser)await browser.close();if(env)await env.cleanup();if(server)await new Promise(resolve=>server.close(resolve));if(admin)await deleteAdmin(admin);await fs.rm(tmp,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
