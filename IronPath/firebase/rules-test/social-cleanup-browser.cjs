// Real account/UI and SDK against local Auth/RTDB emulators only. This verifies
// the social cleanup candidate, not the production site or production Rules.
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
const project='demo-ironpath',uid='social-browser-user',other='social-browser-friend';
const root=path.resolve(__dirname,'../..'),releaseDir=path.join(root,'release-tools');
const emulatorStatus=`http://127.0.0.1:9000/_ironpathRelease.json?ns=${project}`;
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.ico':'image/x-icon'};
// Exercise the genuine SDK, but take it offline immediately before the one
// multi-location deletion is enqueued. This proves the UI waits for the actual
// server acknowledgement, rather than merely waiting for earlier reads.
const databaseWrapper=`
export * from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-real.js';
import {update as realUpdate} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-real.js';
export function update(reference,values){
 const pause=window.__socialPauseDeletion===true&&values&&Object.hasOwn(values,'players/${uid}')&&values['players/${uid}']===null;
 if(pause){window.__socialPauseDeletion=false;window.ironPathSocialTest.offline();}
 const result=realUpdate(reference,values);
 if(pause)window.__socialDeletionQueued=true;
 return result;
}`;
const bootstrap=`
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {initializeAuth,inMemoryPersistence,connectAuthEmulator,beforeAuthStateChanged,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithCustomToken,signOut,sendPasswordResetEmail} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getDatabase,connectDatabaseEmulator,goOffline,goOnline} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import {createGuardedGameBootstrap} from './release-tools/guarded-game-bootstrap.mjs';
import {installGuardedAccountSession} from './account-services.mjs?v=20261031-releaseguard1';
const game=document.getElementById('guardedTestGame'),hold=document.getElementById('guardedTestHold');let instances;
const sdk={initializeApp,initializeAuth,inMemoryPersistence,getDatabase,beforeAuthStateChanged,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithCustomToken,signOut,sendPasswordResetEmail,goOffline};
const runtime=createGuardedGameBootstrap({config:{apiKey:'fake',authDomain:'demo-ironpath.firebaseapp.com',projectId:'demo-ironpath',databaseURL:'https://demo-ironpath.firebaseio.com'},sdk,
 configure:value=>{instances=value;connectAuthEmulator(value.auth,'http://127.0.0.1:9099',{disableWarnings:true});connectAuthEmulator(value.passwordAuth,'http://127.0.0.1:9099',{disableWarnings:true});connectDatabaseEmulator(value.db,'127.0.0.1',9000);},
 build:document.documentElement.dataset.ironpathReleaseBuild,sessionEndpoint:'https://release.example/api/session',statusFetcher:(_u,o)=>fetch('/status',o),sessionFetcher:(_u,o)=>fetch('/api/session',o),intervalMs:60000,statusTimeoutMs:5000,
 installSession:installGuardedAccountSession,importGame:()=>import('./account.js'),
 onHold:reason=>{game.hidden=true;game.inert=true;hold.hidden=false;hold.textContent='TEST HOLD: '+reason;},
 showGame:()=>{game.inert=false;game.hidden=false;hold.hidden=true;},replaceDocument:()=>location.replace('/test-landing')});
window.ironPathSocialTest={offline:()=>goOffline(instances.db),online:()=>goOnline(instances.db),uid:()=>instances.auth.currentUser?.uid};runtime.start();`;
function guardedHtml(html){
 const script=/<script type="module" src="account\.js\?v=[^"]+"><\/script>/g;
 if([...html.matchAll(script)].length!==1||!html.includes('<html lang="en"')||!html.includes('<body>')||!html.includes('</body>'))throw Error('Unexpected game entry');
 return html.replace('<html lang="en"','<html lang="en" data-ironpath-guard="required"')
  .replace('<body>','<body><div id="guardedTestHold">TEST HOLD</div><div id="guardedTestGame" hidden inert>')
  .replace(script,'<script type="module" src="social-test-bootstrap.mjs"></script>')
  .replace('</body>','</div></body>');
}
(async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ironpath-social-browser-'));
 let env,candidateEnv,browser,server,admin;
 try{
  const {stageVersion}=await import(pathToFileURL(path.join(releaseDir,'stage-version.mjs')).href);
  const out=path.join(tmp,'IronPath','releases');await fs.mkdir(out,{recursive:true});await stageVersion({sourceDir:root,outputDir:out,build:'social-1'});
  const source=await fs.readFile(path.join(root,'firebase/WORKSHOP-RULES-TO-PUBLISH.json'));
  const {buildSocialCleanupCandidate}=await import(pathToFileURL(path.join(root,'firebase/social-cleanup-candidate.mjs')).href);
  const {buildRulesCandidate}=await import(pathToFileURL(path.join(releaseDir,'rules-candidate.mjs')).href);
  const {createConfiguredSessionExchange}=await import(pathToFileURL(path.join(releaseDir,'session-service.mjs')).href);
  const {createReleaseSessionHttpHandler}=await import(pathToFileURL(path.join(releaseDir,'session-http.mjs')).href);
  const baseline=buildRulesCandidate(JSON.parse(source)).candidate,candidate=buildRulesCandidate(buildSocialCleanupCandidate(source)).candidate;
  const sdkModules={};for(const name of ['firebase-app.js','firebase-auth.js','firebase-database.js'])sdkModules[name]=await fs.readFile(path.join(__dirname,'node_modules/firebase',name),'utf8');
  admin=initializeAdmin({projectId:project},'social-cleanup-browser-admin');const adminAuth=getAdminAuth(admin);
  await adminAuth.createUser({uid,email:'social-browser@example.test',password:'example-password-123'});
  const exchange=createConfiguredSessionExchange({databaseUrl:'https://demo-ironpath.firebaseio.com',adminAuth,fetcher:(_url,options)=>fetch(emulatorStatus,options)});
  const handleSession=createReleaseSessionHttpHandler({exchange,allowedOrigins:['https://0815games.github.io'],route:'/api/session'});
  server=http.createServer(async(req,res)=>{
   try{
    const pathname=new URL(req.url,'http://127.0.0.1').pathname;
    if(pathname==='/status'){const upstream=await fetch(emulatorStatus,{cache:'no-store'});res.writeHead(upstream.status,{'content-type':'application/json','cache-control':'no-store'}).end(await upstream.text());return;}
    if(pathname==='/api/session'){req.headers.origin='https://0815games.github.io';handleSession(req,res);return;}
    if(pathname.endsWith('/social-test-bootstrap.mjs')){res.writeHead(200,{'content-type':'text/javascript'}).end(bootstrap);return;}
    let requested=pathname;if(requested.endsWith('/'))requested+='index.html';const file=path.resolve(tmp,'.'+requested);
    if(!file.startsWith(tmp+path.sep)){res.writeHead(403).end();return;}let body=await fs.readFile(file);
    if(path.basename(file)==='index.html'&&requested.startsWith('/IronPath/releases/'))body=guardedHtml(body.toString('utf8'));
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(body);
   }catch{if(!res.headersSent)res.writeHead(404);res.end();}
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  env=await initializeTestEnvironment({projectId:project,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(baseline)}});
  const adminSet=(p,v)=>env.withSecurityRulesDisabled(ctx=>set(p?ref(ctx.database(),p):ref(ctx.database()),v));
  const adminGet=async p=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),p))).val();});return value;};
  await env.clearDatabase();await adminSet('',{_ironpathRelease:{mode:'open',build:'social-1',epoch:'a'.repeat(32),authAfterMs:(Math.floor(Date.now()/1000)-120)*1000},players:{[uid]:{name:'Alice',gender:'female',xp:0},[other]:{name:'Bob',gender:'male',xp:0}}});
  const args=['--host-resolver-rules=MAP * 127.0.0.1'];if(process.env.CHROMIUM_PATH)args.push('--no-sandbox');
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});const errors=[],external=[];let page;
  try{
   await context.addInitScript(id=>{try{localStorage.setItem('ironpath:language','en');for(const prefix of ['training','tutorial','coach'])localStorage.setItem(`ironpath:${prefix}:v2:${id}`,'done');}catch{}},uid);
   await context.route('**/*',route=>{const url=new URL(route.request().url()),name=url.pathname.split('/').pop();
    if(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/10.14.1/')){
     const body=name==='firebase-database.js'?databaseWrapper:name==='firebase-database-real.js'?sdkModules['firebase-database.js']:sdkModules[name];
     if(body)return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body});
    }
    if(url.hostname==='127.0.0.1'&&[String(server.address().port),'9000','9099'].includes(url.port))return route.continue();
    external.push(url.origin);return route.abort();
   });
   await context.routeWebSocket(()=>true,socket=>{const url=new URL(socket.url());if(url.hostname==='127.0.0.1'&&url.port==='9000')return socket.connectToServer();external.push(url.origin);return socket.close();});
   page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));
   await page.goto(`http://127.0.0.1:${server.address().port}/IronPath/releases/social-1/`);
   await page.locator('#authView').waitFor({state:'visible',timeout:20000});await page.evaluate(()=>{document.getElementById('introOverlay').hidden=true;});
   await page.locator('#email').fill('social-browser@example.test');await page.locator('#password').fill('example-password-123');await page.locator('#authSubmit').click();
   await page.locator('#menuMultiplayer').waitFor({state:'visible',timeout:30000});assert.equal(await page.locator('#menuName').textContent(),'Alice');
   let code=null,searchKey=null;const deadline=Date.now()+15000;
   while(Date.now()<deadline){code=await adminGet(`friendPrivate/${uid}/code`);searchKey=await adminGet(`friendPrivate/${uid}/searchKey`);if(code&&searchKey&&await adminGet(`friendNames/${searchKey}/${uid}`))break;await new Promise(resolve=>setTimeout(resolve,50));}
   assert.match(code||'',/^[a-f0-9]{32}$/);assert.ok(await adminGet(`friendNames/${searchKey}/${uid}`));
   await adminSet(`friendships/${uid}/${other}`,{status:'accepted',senderName:'Bob',receiverName:'Alice',code});
   await adminSet(`friendOutgoing/${other}/${uid}`,{code,name:'Alice'});
   await adminSet(`coopInvites/${uid}/${other}`,{partyId:'d'.repeat(32),code:'1234',name:'Bob',createdAt:Date.now()});
   await adminSet(`coopInvites/${other}/${uid}`,{partyId:'e'.repeat(32),code:'5678',name:'Alice',createdAt:Date.now()});
   await adminSet(`friendPresence/${uid}/${'f'.repeat(32)}`,Date.now());
   await adminSet(`leaderboards/solo/${uid}`,{name:'Alice',wave:7});
   const confirmDelete=async()=>{await page.locator('#menuDeleteCharacter').click();await page.locator('#gameConfirm').waitFor({state:'visible'});await page.locator('#gameConfirmAccept').click();};
   // The old Rules deny the entire update. The UI must not announce success or
   // offer recruitment based on an optimistic local profile removal.
   await confirmDelete();await page.locator('#connectionView').waitFor({state:'visible',timeout:20000});
   assert.match(await page.locator('#entryMessage').textContent(),/not confirmed/);assert.equal(await page.locator('#characterView').isVisible(),false);
   assert.equal((await adminGet(`players/${uid}`)).name,'Alice');assert.equal((await adminGet(`leaderboards/solo/${uid}`)).wave,7);assert.ok(await adminGet(`friendships/${uid}/${other}`));
   candidateEnv=await initializeTestEnvironment({projectId:project,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(candidate)}});
   await page.locator('#retryProfile').click();await page.locator('#menuMultiplayer').waitFor({state:'visible',timeout:20000});
   // A locally active host party must be closed before character deletion.
   await page.locator('#menuMultiplayer').click();await page.locator('#fourPartyCreate').click();await page.locator('#fourPartyActive').waitFor({state:'visible',timeout:20000});
   const inviteCode=await page.locator('#fourPartyCodeDisplay').textContent();assert.match(inviteCode,/^\d{4}$/);
   await page.evaluate(()=>document.getElementById('menuDeleteCharacter').click());assert.match(await page.locator('#saveStatus').textContent(),/Leave your party/);assert.equal(await page.locator('#gameConfirm').isVisible(),false);
   await page.locator('#fourPartyLeave').click();await page.locator('#gameConfirmAccept').click();await page.locator('#fourPartyEntry').waitFor({state:'visible',timeout:20000});
   assert.equal(await adminGet(`fourCodes/${inviteCode}`),null);await page.locator('#backToCommand').click();
   // Disconnect exactly when the SDK enqueues the deletion. Its optimistic
   // local profile removal must not reveal recruitment before server response.
   await page.evaluate(()=>{window.__socialPauseDeletion=true;});await confirmDelete();
   await page.waitForFunction(()=>window.__socialDeletionQueued===true,null,{timeout:20000});
   await page.locator('#loading').waitFor({state:'visible'});await page.waitForTimeout(500);
   assert.equal(await page.locator('#characterView').isVisible(),false);assert.equal((await adminGet(`players/${uid}`)).name,'Alice');
   await page.evaluate(()=>window.ironPathSocialTest.online());await page.locator('#characterView').waitFor({state:'visible',timeout:30000});
   for(const p of [`players/${uid}`,`friendPrivate/${uid}`,`friendCodes/${code}`,`friendNames/${searchKey}/${uid}`,`friendships/${uid}/${other}`,`friendOutgoing/${other}/${uid}`,`coopInvites/${uid}/${other}`,`coopInvites/${other}/${uid}`,`friendPresence/${uid}`,`leaderboards/solo/${uid}`])assert.equal(await adminGet(p),null,p);
   await page.locator('#soldierName').fill('Alicia');await page.locator('#characterForm button[type="submit"]').click();
   await page.waitForFunction(()=>document.getElementById('menuName').textContent==='Alicia',null,{timeout:30000});
   assert.equal((await adminGet(`players/${uid}`)).name,'Alicia');
   const indexDeadline=Date.now()+15000;let newCode=null;while(Date.now()<indexDeadline){newCode=await adminGet(`friendPrivate/${uid}/code`);if(newCode&&newCode!==code)break;await new Promise(resolve=>setTimeout(resolve,50));}
   assert.match(newCode||'',/^[a-f0-9]{32}$/);assert.notEqual(newCode,code);
   assert.deepEqual(external,[],'test browser attempted no live service');assert.deepEqual(errors,[]);
   console.log('Character deletion browser: old Rules fail closed; active party blocks deletion; offline wait, candidate cleanup and new enlistment passed.');
  }catch(error){
   if(page)console.error('Browser state:',await page.evaluate(()=>Object.fromEntries(['authView','connectionView','characterView','gameView','loading','entryMessage','loadingStep','guardedTestHold'].map(id=>{const e=document.getElementById(id);return [id,{hidden:e?.hidden,text:e?.textContent?.slice(0,180)}];}))).catch(()=>({})));
   console.error('Browser errors:',errors,'blocked origins:',external);throw error;
  }finally{await context.close();}
 }finally{
  if(browser)await browser.close();if(candidateEnv)await candidateEnv.cleanup();if(env)await env.cleanup();if(server)await new Promise(resolve=>server.close(resolve));if(admin)await deleteAdmin(admin);await fs.rm(tmp,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
