// Real Iron Path account/UI code under a deliberately local guarded bootstrap.
// Every identity, server, database and user below belongs to loopback emulators.
// The served HTML is modified in memory solely for this test; it is NOT a
// production launcher, Pages artifact, Vercel/CORS test or rollout procedure.
const {chromium}=require(process.env.PW_PATH||'playwright');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {initializeApp:initializeAdmin,deleteApp:deleteAdmin}=require('firebase-admin/app');
const {getAuth:getAdminAuth}=require('firebase-admin/auth');
const {ref,get,set}=require('firebase/database');
const fs=require('node:fs/promises');
const path=require('node:path'),os=require('node:os'),http=require('node:http');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');

for(const [name,port] of [['FIREBASE_AUTH_EMULATOR_HOST',9099],['FIREBASE_DATABASE_EMULATOR_HOST',9000]]){
 if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(process.env[name]))throw Error(`${name} must explicitly name the local emulator`);
}
const project='demo-ironpath',uid='guarded-game-browser';
const epochA='c'.repeat(32),epochB='d'.repeat(32),epochC='e'.repeat(32);
const root=path.resolve(__dirname,'../..'),releaseDir=path.join(root,'release-tools');
const emulatorStatus=`http://127.0.0.1:9000/_ironpathRelease.json?ns=${project}`;
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript',
 '.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml',
 '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.ico':'image/x-icon'};

// These are genuine Web SDK imports, served by the test runner from npm. No
// gstatic/Firebase production request is allowed to escape this browser test.
const bootstrap=`
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {initializeAuth,inMemoryPersistence,connectAuthEmulator,beforeAuthStateChanged,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithCustomToken,signOut,sendPasswordResetEmail} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getDatabase,connectDatabaseEmulator,ref,update,goOffline} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import {createGuardedGameBootstrap} from './release-tools/guarded-game-bootstrap.mjs';
import {installGuardedAccountSession} from './account-services.mjs?v=20261031-releaseguard1';
const game=document.getElementById('guardedTestGame'),hold=document.getElementById('guardedTestHold');
let instances,stallSignOut=false;const events=[];
const sdk={initializeApp,initializeAuth,inMemoryPersistence,getDatabase,beforeAuthStateChanged,onAuthStateChanged,
 signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithCustomToken,sendPasswordResetEmail,
 signOut:auth=>stallSignOut?new Promise(()=>{}):signOut(auth),
 goOffline:db=>{events.push('offline');goOffline(db);}};
const runtime=createGuardedGameBootstrap({
 config:{apiKey:'fake',authDomain:'demo-ironpath.firebaseapp.com',projectId:'demo-ironpath',databaseURL:'https://demo-ironpath.firebaseio.com'},sdk,
 configure:value=>{
  instances=value;
  connectAuthEmulator(value.auth,'http://127.0.0.1:9099',{disableWarnings:true});
  connectAuthEmulator(value.passwordAuth,'http://127.0.0.1:9099',{disableWarnings:true});
  connectDatabaseEmulator(value.db,'127.0.0.1',9000);
 },
 build:document.documentElement.dataset.ironpathReleaseBuild,sessionEndpoint:'https://release.example/api/session',
 statusFetcher:(_url,options)=>fetch('/status',options),sessionFetcher:(_url,options)=>fetch('/api/session',options),
 intervalMs:60000,statusTimeoutMs:5000,signOutTimeoutMs:2000,
 installSession:context=>{context.signal.addEventListener('abort',()=>events.push('abort'),{once:true});installGuardedAccountSession(context);},
 importGame:()=>import('./account.js'),
 onHold:reason=>{events.push('hold:'+reason);game.hidden=true;game.inert=true;hold.hidden=false;hold.textContent='TEST HOLD: '+reason;},
 showGame:()=>{game.inert=false;game.hidden=false;hold.hidden=true;},
 replaceDocument:target=>location.replace('/IronPath/test-hold.html?reason='+encodeURIComponent(target.kind))
});
window.ironPathTest={runtime,events:()=>events,stallSignOut:()=>{stallSignOut=true;},
 currentUid:()=>instances.auth.currentUser?.uid??null,
 passwordUid:()=>instances.passwordAuth.currentUser?.uid??null,
 queueOld:()=>{goOffline(instances.db);void update(ref(instances.db,'players/guarded-game-browser'),{xp:99}).catch(()=>{});},
 write:xp=>update(ref(instances.db,'players/guarded-game-browser'),{xp})
};
runtime.start();`;

function guardedHtml(html){
 const script=/<script type="module" src="(?:account\.js|account-entry\.mjs)\?v=[^"]+"><\/script>/g;
 if([...html.matchAll(script)].length!==1 || !html.includes('<body>') || !html.includes('</body>'))throw Error('Unexpected staged HTML');
 return html.replace('<html lang="en"','<html lang="en" data-ironpath-guard="required"')
  .replace('<body>','<body><div id="guardedTestHold" role="status">TEST HOLD: checking</div><div id="guardedTestGame" hidden inert>')
  .replace(script,'<script type="module" src="test-bootstrap.mjs"></script>')
  .replace('</body>','</div></body>');
}

(async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ironpath-guarded-game-'));
 let env,browser,server,admin;
 try{
  const {stageVersion}=await import(pathToFileURL(path.join(releaseDir,'stage-version.mjs')).href);
  const out=path.join(tmp,'IronPath','releases');await fs.mkdir(out,{recursive:true});
  for(const build of ['game-1','game-2'])await stageVersion({sourceDir:root,outputDir:out,build});
  const source=JSON.parse(await fs.readFile(path.join(root,'firebase/WORKSHOP-RULES-TO-PUBLISH.json'),'utf8'));
  const {buildRulesCandidate}=await import(pathToFileURL(path.join(releaseDir,'rules-candidate.mjs')).href);
  const {prepareReleaseControlWrite}=await import(pathToFileURL(path.join(releaseDir,'release-control-write.mjs')).href);
  const {createConfiguredSessionExchange}=await import(pathToFileURL(path.join(releaseDir,'session-service.mjs')).href);
  const {createReleaseSessionHttpHandler}=await import(pathToFileURL(path.join(releaseDir,'session-http.mjs')).href);
  const rules=buildRulesCandidate(source).candidate;
  const sdkModules={};
  for(const name of ['firebase-app.js','firebase-auth.js','firebase-database.js']){
   sdkModules[name]=await fs.readFile(path.join(__dirname,'node_modules/firebase',name),'utf8');
  }
  admin=initializeAdmin({projectId:project},'guarded-game-browser-admin');const adminAuth=getAdminAuth(admin);
  await adminAuth.createUser({uid,email:'guarded-game@example.test',password:'example-password-123'});
  let sessionRequests=0,serviceReads=0,failStatus=false;
  const service=createConfiguredSessionExchange({databaseUrl:'https://demo-ironpath.firebaseio.com',adminAuth,
   fetcher:(_url,options)=>{serviceReads++;return fetch(emulatorStatus,options);}});
  const handleSession=createReleaseSessionHttpHandler({exchange:service,allowedOrigins:['https://0815games.github.io'],route:'/api/session'});
  server=http.createServer(async(req,res)=>{
   try{
    const pathname=new URL(req.url,'http://127.0.0.1').pathname;
    if(pathname==='/status'){
     if(failStatus){res.writeHead(503).end();return;}
     const upstream=await fetch(emulatorStatus,{cache:'no-store',signal:AbortSignal.timeout(5000)});
     res.writeHead(upstream.status,{'content-type':'application/json','cache-control':'no-store'}).end(await upstream.text());return;
    }
    if(pathname==='/api/session'){
     // Test-only same-origin proxy: CORS against the actual Vercel endpoint is
     // intentionally not claimed here.
     req.headers.origin='https://0815games.github.io';sessionRequests++;handleSession(req,res);return;
    }
    if(pathname==='/IronPath/test-hold.html'){
     res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>Test navigation</title><p id="testLanding">Isolated test landing</p>');return;
    }
    if(pathname.endsWith('/test-bootstrap.mjs')){
     res.writeHead(200,{'content-type':'text/javascript'}).end(bootstrap);return;
    }
    let requested=pathname;if(requested.endsWith('/'))requested+='index.html';
    const file=path.resolve(tmp,'.'+requested);
    if(!file.startsWith(tmp+path.sep)){res.writeHead(403).end();return;}
    let body=await fs.readFile(file);
    if(path.basename(file)==='index.html' && requested.startsWith('/IronPath/releases/'))body=guardedHtml(body.toString('utf8'));
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(body);
   }catch{if(!res.headersSent)res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  env=await initializeTestEnvironment({projectId:project,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}});
  const adminSet=(p,v)=>env.withSecurityRulesDisabled(ctx=>set(p?ref(ctx.database(),p):ref(ctx.database()),v));
  const adminGet=async p=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),p))).val();});return value;};
  await env.clearDatabase();
  const open={mode:'open',build:'game-1',epoch:epochA,authAfterMs:(Math.floor(Date.now()/1000)-120)*1000};
  await adminSet('',{_ironpathRelease:{...open,mode:'maintenance'},players:{[uid]:{name:'Alice',gender:'female',xp:0}}});
  const args=['--host-resolver-rules=MAP * 127.0.0.1'];if(process.env.CHROMIUM_PATH)args.push('--no-sandbox');
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
  const errors=[],external=[],accountRequests=[],guardRequests=[];
  try{
   await context.addInitScript(id=>{
    localStorage.setItem('ironpath:language','en');localStorage.setItem('ironpath:training:v2:'+id,'done');
    localStorage.setItem('ironpath:tutorial:v2:'+id,'done');localStorage.setItem('ironpath:coach:v2:'+id,'done');
    // Count the actual game's named frame callback. No other source module
    // defines a callback named frame; the test verifies it ran before logout.
    const original=window.requestAnimationFrame.bind(window);window.__gameFrames=0;
    window.requestAnimationFrame=callback=>original(time=>{if(callback.name==='frame')window.__gameFrames++;callback(time);});
   },uid);
   await context.routeWebSocket(url=>url.hostname!=='127.0.0.1'||url.port!=='9000',ws=>{external.push(new URL(ws.url()).origin);return ws.close();});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url()),name=url.pathname.split('/').pop();
    if(url.hostname==='www.gstatic.com' && url.pathname.startsWith('/firebasejs/10.14.1/') && sdkModules[name]){
     return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:sdkModules[name]});
    }
    if(url.hostname==='127.0.0.1' && [String(server.address().port),'9000','9099'].includes(url.port)){
     if(url.pathname.endsWith('/account.js'))accountRequests.push(url.pathname);
     if(url.pathname.includes('/release-tools/'))guardRequests.push(url.pathname);
     return route.continue();
    }
    external.push(url.origin);return route.abort();
   });
   const page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));
   const base=`http://127.0.0.1:${server.address().port}`;
   const game=build=>`${base}/IronPath/releases/${build}/`;
   const landing=kind=>new RegExp(`/IronPath/test-hold\\.html\\?reason=${kind}$`);
   const login=async()=>{
    await page.locator('#authView').waitFor({state:'visible',timeout:20000});
    await page.evaluate(()=>{document.getElementById('introOverlay').hidden=true;});
    await page.locator('#email').fill('guarded-game@example.test');
    await page.locator('#password').fill('example-password-123');
    await page.locator('#authSubmit').click();
    await page.locator('#menuMultiplayer').waitFor({state:'visible',timeout:30000});
    assert.equal(await page.locator('#menuName').textContent(),'Alice');
    assert.equal(await page.evaluate(()=>window.ironPathTest.currentUid()),uid);
    assert.equal(await page.evaluate(()=>window.ironPathTest.passwordUid()),null);
   };

   // A page that starts during maintenance never imports the real account code.
   await page.goto(game('game-1'));await page.waitForURL(landing('maintenance'));
   assert.deepEqual(accountRequests,[]);assert.equal(sessionRequests,0);

   await adminSet('_ironpathRelease',open);await page.goto(game('game-1'));
   await page.locator('#authView').waitFor({state:'visible',timeout:20000});
   await page.evaluate(()=>{document.getElementById('introOverlay').hidden=true;});
   assert.equal(await page.evaluate(()=>window.ironPathTest.currentUid()),null);
   await page.locator('#email').fill('guarded-game@example.test');await page.locator('#password').fill('incorrect-password');
   await page.locator('#authSubmit').click();
   await page.waitForFunction(()=>document.getElementById('entryMessage').textContent.includes('Incorrect email or password.'));
   assert.equal(await page.evaluate(()=>window.ironPathTest.currentUid()),null);
   await login();assert.ok(sessionRequests>=1);assert.ok(serviceReads>=3);

   // Guarded logout must freeze the actual game immediately, even if Firebase
   // sign-out hangs. The deadline still triggers a real full navigation.
   await page.waitForFunction(()=>window.__gameFrames>=2);
   await page.evaluate(()=>window.ironPathTest.stallSignOut());
   await page.locator('#menuLogout').click();
   await page.waitForFunction(()=>window.ironPathTest.runtime.getPhase()==='terminated');
   assert.equal(await page.locator('#guardedTestGame').getAttribute('inert'),'');
   assert.equal(await page.locator('#guardedTestGame').getAttribute('hidden'),'');
   assert.equal(await page.locator('#guardedTestHold').textContent(),'TEST HOLD: logout');
   assert.equal(await page.locator('#password').inputValue(),'');
   const framesAfterStop=await page.evaluate(()=>window.__gameFrames);
   await page.waitForTimeout(200);
   assert.equal(await page.evaluate(()=>window.__gameFrames),framesAfterStop,'the real game loop remains stopped while sign-out hangs');
   const events=await page.evaluate(()=>window.ironPathTest.events());
   assert.ok(events.indexOf('hold:logout')<events.indexOf('offline'));
   assert.ok(events.indexOf('offline')<events.indexOf('abort'));
   await page.waitForURL(landing('entry'));
   await page.goto(game('game-1'));await login();
   // A modal must not remain in the browser's top layer and make the blocked
   // screen inert. Also leave a real old write queued offline.
   await page.locator('#menuSettings').click();await page.locator('#settingsDialog').waitFor({state:'visible'});
   await page.evaluate(()=>{window.ironPathTest.queueOld();window.ironPathTest.stallSignOut();});
   await adminSet('_ironpathRelease',{...open,mode:'maintenance',epoch:epochB});
   await page.evaluate(()=>window.ironPathTest.runtime.refresh());
   assert.equal(await page.locator('#guardedTestHold').textContent(),'TEST HOLD: maintenance');
   assert.equal(await page.evaluate(()=>document.querySelectorAll('dialog[open]').length),0,'the blocked screen is not trapped behind a hidden modal');
   await page.waitForURL(landing('maintenance'));
   assert.equal((await adminGet(`players/${uid}`)).xp,0);

   const opening=prepareReleaseControlWrite({mode:'open',build:'game-2',currentEpoch:epochB},()=>Buffer.from(epochC,'hex'));
   await adminSet('_ironpathRelease',opening);
   const reopened=await adminGet('_ironpathRelease'),cutoffMs=reopened.authAfterMs;
   assert.equal(reopened.epoch,epochC);assert.notEqual(reopened.epoch,epochA);assert.notEqual(reopened.epoch,epochB);
   while(Math.floor(Date.now()/1000)*1000<=cutoffMs)await new Promise(resolve=>setTimeout(resolve,50));
   const before=accountRequests.length;
   await page.goto(game('game-1'));await page.waitForURL(landing('update'));
   assert.equal(accountRequests.length,before,'a stale build never imports account.js');
   await page.goto(game('game-2'));await login();
   await page.evaluate(()=>window.ironPathTest.write(3));
   assert.equal((await adminGet(`players/${uid}`)).xp,3,'the old document did not replay its queued write');

   failStatus=true;await page.evaluate(()=>{void window.ironPathTest.runtime.refresh();});
   await page.waitForURL(landing('maintenance'));
   assert.ok(guardRequests.some(name=>name==='/IronPath/releases/game-1/release-tools/guarded-game-bootstrap.mjs'));
   assert.ok(guardRequests.some(name=>name==='/IronPath/releases/game-2/release-tools/guarded-game-bootstrap.mjs'));
   assert.ok(guardRequests.every(name=>/^\/IronPath\/releases\/game-[12]\/release-tools\//.test(name)),
    'the guard modules come from the same isolated builds as the game');
   assert.deepEqual(external,[],'browser test attempted no live services');assert.deepEqual(errors,[]);
   console.log('Guarded staged game: real login/UI, logout, maintenance, old queued write, stale build and reopen passed against local emulators.');
  }finally{await context.close();}
 }finally{
  if(browser)await browser.close();if(env)await env.cleanup();if(server)await new Promise(resolve=>server.close(resolve));
  if(admin)await deleteAdmin(admin);await fs.rm(tmp,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
