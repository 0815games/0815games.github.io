// Exercises the actual generated launcher and guarded game artifact, without
// modifying their HTML. All identities and databases are loopback emulators.
// SDK wrappers connect real npm Firebase SDK modules to those emulators; test
// routing proxies status/exchange, so this does NOT prove Vercel CORS, CDN,
// production Firebase, real devices or an actual Pages deployment.
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
const project='demo-ironpath',uid='release-site-browser';
const epochA='e'.repeat(32),epochB='f'.repeat(32);
const root=path.resolve(__dirname,'../..'),tools=path.join(root,'release-tools');
const config={firebase:{apiKey:'fake-public-key',authDomain:'demo-ironpath.firebaseapp.com',
 databaseURL:'https://demo-ironpath.firebaseio.com',projectId:project},sessionEndpoint:'https://release.example/api/session'};
const emulatorStatus=`http://127.0.0.1:9000/_ironpathRelease.json?ns=${project}`;
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript',
 '.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml',
 '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.ico':'image/x-icon'};
const authShim=`import * as raw from './firebase-auth-test-raw.js';
export * from './firebase-auth-test-raw.js';
export function initializeAuth(app,options){const value=raw.initializeAuth(app,options);raw.connectAuthEmulator(value,'http://127.0.0.1:9099',{disableWarnings:true});window.__releaseSite.auths.push(value);return value;}
export function signOut(value){return window.__releaseSite.stallSignOut?new Promise(()=>{}):raw.signOut(value);}`;
const databaseShim=`import * as raw from './firebase-database-test-raw.js';
export * from './firebase-database-test-raw.js';
export function getDatabase(app){const value=raw.getDatabase(app);raw.connectDatabaseEmulator(value,'127.0.0.1',9000);window.__releaseSite.dbs.push(value);return value;}
export function goOffline(value){window.__releaseSite.events.push('offline');return raw.goOffline(value);}`;

(async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ironpath-release-site-'));
 let env,browser,server,admin;
 try{
  const {stageVersion}=await import(pathToFileURL(path.join(tools,'stage-version.mjs')).href);
  const {stageLauncher}=await import(pathToFileURL(path.join(tools,'stage-launcher.mjs')).href);
  const site=path.join(tmp,'IronPath'),releases=path.join(site,'releases');await fs.mkdir(releases,{recursive:true});
  for(const build of ['site-1','site-2'])await stageVersion({sourceDir:root,outputDir:releases,build,guardedConfig:config});
  await stageLauncher({sourceDir:root,outputDir:site,build:'launcher-1',config});
  const source=JSON.parse(await fs.readFile(path.join(root,'firebase/WORKSHOP-RULES-TO-PUBLISH.json'),'utf8'));
  const {buildRulesCandidate}=await import(pathToFileURL(path.join(tools,'rules-candidate.mjs')).href);
  const {createConfiguredSessionExchange}=await import(pathToFileURL(path.join(tools,'session-service.mjs')).href);
  const {createReleaseSessionHttpHandler}=await import(pathToFileURL(path.join(tools,'session-http.mjs')).href);
  const sdkModules={};
  for(const name of ['firebase-app.js','firebase-auth.js','firebase-database.js'])sdkModules[name]=await fs.readFile(path.join(__dirname,'node_modules/firebase',name),'utf8');
  admin=initializeAdmin({projectId:project},'release-site-browser-admin');const adminAuth=getAdminAuth(admin);
  await adminAuth.createUser({uid,email:'release-site@example.test',password:'example-password-123'});
  let sessionRequests=0,serviceReads=0,failStatus=false,breakCritical=false;
  const service=createConfiguredSessionExchange({databaseUrl:config.firebase.databaseURL,adminAuth,
   fetcher:(_url,options)=>{serviceReads++;return fetch(emulatorStatus,options);}});
  const handleSession=createReleaseSessionHttpHandler({exchange:service,allowedOrigins:['https://0815games.github.io'],route:'/api/session'});
  server=http.createServer(async(req,res)=>{
   try{
    const pathname=new URL(req.url,'http://127.0.0.1').pathname;
    if(pathname==='/api/session'){
     // The browser route below proxies to this loopback handler and rewrites
     // Origin only for the synthetic test. Real Vercel CORS is not exercised.
     req.headers.origin='https://0815games.github.io';sessionRequests++;handleSession(req,res);return;
    }
    let requested=pathname;if(requested.endsWith('/'))requested+='index.html';
    const file=path.resolve(tmp,'.'+requested);
    if(!file.startsWith(tmp+path.sep)){res.writeHead(403).end();return;}
    let body=await fs.readFile(file);
    if(breakCritical && pathname==='/IronPath/releases/site-1/account.js')body=Buffer.concat([body,Buffer.from('\n// simulated incomplete upload')]);
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(body);
   }catch{if(!res.headersSent)res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  env=await initializeTestEnvironment({projectId:project,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(buildRulesCandidate(source).candidate)}});
  const adminSet=(p,v)=>env.withSecurityRulesDisabled(ctx=>set(p?ref(ctx.database(),p):ref(ctx.database()),v));
  const adminGet=async p=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),p))).val();});return value;};
  await env.clearDatabase();
  const open={mode:'open',build:'site-1',epoch:epochA,authAfter:Math.floor(Date.now()/1000)-120};
  await adminSet('',{_ironpathRelease:{...open,mode:'maintenance'},players:{[uid]:{name:'Alice',gender:'female',xp:0}}});
  const args=['--host-resolver-rules=MAP * 127.0.0.1'];if(process.env.CHROMIUM_PATH)args.push('--no-sandbox');
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args});
  const base=`http://127.0.0.1:${server.address().port}`;
  const nojs=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});
  try{
   const page=await nojs.newPage();await page.goto(`${base}/IronPath/releases/site-1/`);
   assert.equal(await page.locator('#ironpath-guarded-game').getAttribute('hidden'),'');
   assert.equal(await page.locator('#ironpath-guarded-game').getAttribute('inert'),'');
   assert.equal(await page.locator('#ironpath-guarded-hold').isVisible(),true,'initial HTML stays blocked without JavaScript');
  }finally{await nojs.close();}
  // Direct navigation over a non-loopback HTTP hostname must stay blocked and
  // must not even load the remote Auth SDK. Host resolution is mapped to the
  // same loopback server solely for this negative transport test.
  const insecure=await browser.newContext({serviceWorkers:'block'}),insecureExternal=[];
  try{
   await insecure.route('**/*',route=>{
    if(new URL(route.request().url()).hostname==='ironpath.test')return route.continue();
    insecureExternal.push(new URL(route.request().url()).origin);return route.abort();
   });
   const page=await insecure.newPage(),landing=page.waitForURL(/\/IronPath\/\?from=unavailable$/,{timeout:15000});
   try{await page.goto(`http://ironpath.test:${server.address().port}/IronPath/releases/site-1/`,{waitUntil:'domcontentloaded'});}
   catch(error){if(!String(error).includes('ERR_ABORTED'))throw error;}
   await landing;await page.waitForFunction(()=>document.getElementById('titleText').textContent==='Signal lost');
   assert.equal(await page.locator('#launcherRetry').isHidden(),true);assert.deepEqual(insecureExternal,[]);
  }finally{await insecure.close();}
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
  const errors=[],external=[],accountScripts=[],staticFailures=[];
  try{
   await context.addInitScript(id=>{
    localStorage.setItem('ironpath:language','en');localStorage.setItem('ironpath:training:v2:'+id,'done');
    localStorage.setItem('ironpath:tutorial:v2:'+id,'done');localStorage.setItem('ironpath:coach:v2:'+id,'done');
    window.__releaseSite={auths:[],dbs:[],events:[],stallSignOut:false};
    const original=window.requestAnimationFrame.bind(window);window.__gameFrames=0;
    window.requestAnimationFrame=callback=>original(time=>{if(callback.name==='frame')window.__gameFrames++;callback(time);});
   },uid);
   await context.routeWebSocket(url=>url.hostname!=='127.0.0.1'||url.port!=='9000',ws=>{external.push(new URL(ws.url()).origin);return ws.close();});
   await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url()),name=url.pathname.split('/').pop();
    if(url.hostname==='www.gstatic.com' && url.pathname.startsWith('/firebasejs/10.14.1/')){
     let body=sdkModules[name];
     if(name==='firebase-auth.js')body=authShim;
     if(name==='firebase-database.js')body=databaseShim;
     if(name==='firebase-auth-test-raw.js')body=sdkModules['firebase-auth.js'];
     if(name==='firebase-database-test-raw.js')body=sdkModules['firebase-database.js'];
     if(body)return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body});
    }
    if(url.href==='https://demo-ironpath.firebaseio.com/_ironpathRelease.json'){
     if(failStatus)return route.fulfill({status:503,headers:{'access-control-allow-origin':'*'},body:'unavailable'});
     const response=await fetch(emulatorStatus,{cache:'no-store',signal:AbortSignal.timeout(5000)});
     return route.fulfill({status:response.status,headers:{'access-control-allow-origin':'*','content-type':'application/json','cache-control':'no-store'},body:await response.text()});
    }
    if(url.href===config.sessionEndpoint){
     const cors={'access-control-allow-origin':base,'access-control-allow-methods':'POST, OPTIONS',
      'access-control-allow-headers':'authorization, content-type','cache-control':'no-store'};
     if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:cors,body:''});
     const response=await fetch(`${base}/api/session`,{method:request.method(),headers:{'content-type':'application/json',
      authorization:request.headers().authorization||'',origin:'https://0815games.github.io'},body:request.postDataBuffer()});
     return route.fulfill({status:response.status,headers:{...cors,'content-type':'application/json'},body:await response.text()});
    }
    if(url.hostname==='127.0.0.1' && [String(server.address().port),'9000','9099'].includes(url.port)){
     if(url.pathname.endsWith('/account.js') && request.resourceType()==='script')accountScripts.push(url.pathname);
     return route.continue();
    }
    external.push(url.origin);return route.abort();
   });
   const page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));
   page.on('response',response=>{if(response.url().startsWith(base+'/IronPath/')&&response.status()>=400)staticFailures.push(`${response.status()} ${response.url()}`);});
   const game=build=>`${base}/IronPath/releases/${build}/`;
   const login=async()=>{
    await page.locator('#authView').waitFor({state:'visible',timeout:25000});
    await page.evaluate(()=>{document.getElementById('introOverlay').hidden=true;});
    await page.locator('#email').fill('release-site@example.test');await page.locator('#password').fill('example-password-123');
    await page.locator('#authSubmit').click();await page.locator('#menuMultiplayer').waitFor({state:'visible',timeout:30000});
    assert.equal(await page.locator('#menuName').textContent(),'Alice');
    assert.equal(await page.evaluate(()=>window.__releaseSite.auths[0].currentUser?.uid),uid);
    assert.equal(await page.evaluate(()=>window.__releaseSite.auths[1].currentUser?.uid??null),null);
   };

   await page.goto(`${base}/IronPath/`);
   await page.waitForFunction(()=>document.getElementById('titleText').textContent==='Operation paused');
   assert.deepEqual(accountScripts,[]);assert.equal(sessionRequests,0);
   await page.locator('#launcherLanguage').click();assert.equal(await page.locator('#titleText').textContent(),'Einsatzpause');
   await page.locator('#launcherLanguage').click();assert.equal(await page.locator('#titleText').textContent(),'Operation paused');
   for(const [width,height] of [[320,568],[390,844],[1440,900]]){
    await page.setViewportSize({width,height});
    const fit=await page.evaluate(()=>{
     const card=document.querySelector('.release-card').getBoundingClientRect();
     return {width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,left:card.left,right:card.right,
      brand:document.querySelector('.release-brand').naturalWidth,background:getComputedStyle(document.querySelector('.release-scene'),'::before').backgroundImage,
      pulse:getComputedStyle(document.querySelector('.status-pulse')).animationName};
    });
    assert.ok(fit.scroll<=width+1&&fit.left>=-1&&fit.right<=width+1,`launcher fits ${width}px: ${JSON.stringify(fit)}`);
    assert.ok(fit.brand>0);assert.match(fit.background,/story-outpost\.jpg/);assert.equal(fit.pulse,'none');
   }
   await page.setViewportSize({width:390,height:844});

   // A status marked open is not sufficient: a damaged critical file must be
   // detected before any account script executes, and retry must be explicit.
   breakCritical=true;await adminSet('_ironpathRelease',open);
   await page.evaluate(()=>window.dispatchEvent(new Event('online')));
   await page.waitForFunction(()=>document.getElementById('titleText').textContent==='Signal lost',null,{timeout:20000});
   assert.match(page.url(),/\/IronPath\/$/);assert.deepEqual(accountScripts,[]);
   breakCritical=false;await page.evaluate(()=>window.dispatchEvent(new Event('online')));
   await page.waitForTimeout(200);assert.match(page.url(),/\/IronPath\/$/,'no automatic redirect loop after a broken build');
   await page.locator('#launcherRetry').click();await page.waitForURL('**/IronPath/releases/site-1/',{timeout:30000});
   await login();assert.ok(sessionRequests>=1);assert.ok(serviceReads>=3);

   // Logout freezes the real game immediately even with a stuck sign-out, then
   // goes through the real launcher into a fresh document.
   await page.waitForFunction(()=>window.__gameFrames>=2);
   await page.evaluate(()=>{window.__releaseSite.stallSignOut=true;});
   const launcherAfterLogout=page.waitForURL(/\/IronPath\/$/,{timeout:10000});
   await page.locator('#menuLogout').click();
   await page.waitForFunction(()=>!document.getElementById('ironpath-guarded-hold').hidden);
   assert.equal(await page.locator('#ironpath-guarded-game').getAttribute('inert'),'');
   assert.equal(await page.locator('#password').inputValue(),'');
   const frames=await page.evaluate(()=>window.__gameFrames);await page.waitForTimeout(200);
   assert.equal(await page.evaluate(()=>window.__gameFrames),frames);await launcherAfterLogout;
   await page.waitForURL('**/IronPath/releases/site-1/',{timeout:30000});await login();

   // Close with an actual dialog open and an old RTDB write queued offline.
   await page.locator('#menuSettings').click();await page.locator('#settingsDialog').waitFor({state:'visible'});
   await page.evaluate(async()=>{
    const db=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-database-test-raw.js');
    db.goOffline(window.__releaseSite.dbs[0]);void db.update(db.ref(window.__releaseSite.dbs[0],'players/release-site-browser'),{xp:99}).catch(()=>{});
    window.__releaseSite.stallSignOut=true;
   });
   await adminSet('_ironpathRelease',{...open,mode:'maintenance',epoch:epochB});
   const maintenanceLanding=page.waitForURL(/\/IronPath\/\?from=maintenance$/,{timeout:10000});
   await page.evaluate(()=>window.dispatchEvent(new Event('online')));
   await page.waitForFunction(()=>!document.getElementById('ironpath-guarded-hold').hidden);
   assert.equal(await page.evaluate(()=>document.querySelectorAll('dialog[open]').length),0);
   assert.ok((await page.evaluate(()=>window.__releaseSite.events)).includes('offline'));
   await maintenanceLanding;await page.waitForFunction(()=>document.getElementById('titleText').textContent==='Operation paused');
   assert.equal((await adminGet(`players/${uid}`)).xp,0);

   const cutoff=Math.floor(Date.now()/1000);
   await adminSet('_ironpathRelease',{mode:'open',build:'site-2',epoch:epochB,authAfter:cutoff});
   while(Math.floor(Date.now()/1000)<=cutoff)await new Promise(resolve=>setTimeout(resolve,50));
   await page.evaluate(()=>window.dispatchEvent(new Event('online')));
   await page.waitForURL('**/IronPath/releases/site-2/',{timeout:30000});await login();
   await page.evaluate(async()=>{
    const db=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-database-test-raw.js');
    await db.update(db.ref(window.__releaseSite.dbs[0],'players/release-site-browser'),{xp:3});
   });
   assert.equal((await adminGet(`players/${uid}`)).xp,3,'old queued write was not replayed');

   // A status outage returns to a blocked launcher. Even after the signal
   // recovers, an unavailable return waits for a deliberate retry.
   failStatus=true;const unavailableLanding=page.waitForURL(/\/IronPath\/\?from=unavailable$/,{timeout:10000});
   await page.evaluate(()=>window.dispatchEvent(new Event('online')));await unavailableLanding;
   await page.waitForFunction(()=>document.getElementById('titleText').textContent==='Signal lost');
   failStatus=false;await page.evaluate(()=>window.dispatchEvent(new Event('online')));await page.waitForTimeout(200);
   assert.match(page.url(),/\?from=unavailable$/);await page.locator('#launcherRetry').click();
   await page.waitForURL('**/IronPath/releases/site-2/',{timeout:30000});await login();

   // A restored bfcache document is torn down instead of continuing with its
   // old SDK instance. Dispatching the event is a deterministic simulation;
   // real browser/device cache behavior still needs an independent rehearsal.
   await page.evaluate(()=>{window.__releaseSite.stallSignOut=true;});
   const restoredLanding=page.waitForURL(/\/IronPath\/\?from=unavailable$/,{timeout:10000});
   await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
   await page.waitForFunction(()=>!document.getElementById('ironpath-guarded-hold').hidden);
   assert.equal(await page.locator('#ironpath-guarded-game').getAttribute('inert'),'');await restoredLanding;

   // An old build entered directly checks its own release and routes through
   // the launcher without ever evaluating that old build's account module.
   const oldBefore=accountScripts.filter(p=>p.includes('/site-1/')).length;
   await page.goto(game('site-1'));await page.waitForURL('**/IronPath/releases/site-2/',{timeout:30000});
   assert.equal(accountScripts.filter(p=>p.includes('/site-1/')).length,oldBefore);
   await page.locator('#authView').waitFor({state:'visible',timeout:25000});
   assert.deepEqual(staticFailures,[]);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
   console.log('Packaged launcher + guarded game: blocked first paint, artifact check, login, logout, maintenance, reopen, outage and bfcache simulation passed against loopback emulators.');
  }finally{await context.close();}
 }finally{
  if(browser)await browser.close();if(env)await env.cleanup();if(server)await new Promise(resolve=>server.close(resolve));
  if(admin)await deleteAdmin(admin);await fs.rm(tmp,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
