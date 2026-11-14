// Real ordinary game UI and Firebase Web SDK against local Auth/RTDB emulators.
// Only the account config, AFK clock and public probe transport are retargeted
// in memory; production CORS, Pages/CDN and live Rules are NOT tested. Every
// other external browser request is blocked before it can leave the machine.
const {chromium}=require(process.env.PW_PATH||'playwright');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {initializeApp:initializeAdmin,deleteApp:deleteAdmin}=require('firebase-admin/app');
const {getAuth:getAdminAuth}=require('firebase-admin/auth');
const {ref,set}=require('firebase/database');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');

for(const [key,port] of [['FIREBASE_AUTH_EMULATOR_HOST',9099],['FIREBASE_DATABASE_EMULATOR_HOST',9000]]){
 if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(process.env[key]))throw Error(`${key} must explicitly name the local emulator`);
}
const project='demo-ironpath',uid='local-afk-browser',nextBuild='afk-browser-next-1';
const root=path.resolve(__dirname,'../..');
const config={apiKey:'fake',authDomain:'demo-ironpath.firebaseapp.com',databaseURL:'https://demo-ironpath.firebaseio.com',projectId:project,appId:'fake-app'};
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.ico':'image/x-icon'};
const authWrapper=`
export * from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-real.js';
import {getAuth as realGetAuth,connectAuthEmulator,signOut as realSignOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-real.js';
const prepared=new WeakSet();
export function getAuth(app){const auth=realGetAuth(app);if(!prepared.has(auth)){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});prepared.add(auth);}window.__testAuth=auth;return auth;}
export async function signOut(auth){const result=await realSignOut(auth);window.__testSignOutDone=true;return result;}
`;
const databaseWrapper=`
export * from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-real.js';
import {getDatabase as realGetDatabase,connectDatabaseEmulator} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-real.js';
const prepared=new WeakSet();
export function getDatabase(app){const db=realGetDatabase(app);if(!prepared.has(db)){connectDatabaseEmulator(db,'127.0.0.1',9000);prepared.add(db);}return db;}
`;
function replaceOnce(source,pattern,replacement,label){
 const matches=[...source.matchAll(pattern)];if(matches.length!==1)throw Error(`Unexpected ${label} in ordinary game source`);
 return source.replace(pattern,replacement);
}

(async()=>{
 let env,admin,browser,server;
 const contexts=[];
 try{
  const source=await fs.readFile(path.join(root,'firebase/WORKSHOP-RULES-TO-PUBLISH.json'));
  const {buildSocialCleanupCandidate}=await import(pathToFileURL(path.join(root,'firebase/social-cleanup-candidate.mjs')).href);
  const {buildMaintenanceRulesCandidate}=await import(pathToFileURL(path.join(root,'release-tools/maintenance-rules.mjs')).href);
  const rules=buildMaintenanceRulesCandidate(buildSocialCleanupCandidate(source),{adminUid:'local-afk-admin'}).candidate;
  admin=initializeAdmin({projectId:project},'afk-browser-seed');
  await getAdminAuth(admin).createUser({uid,email:'afk-browser@example.test',password:'example-password-123'});
  env=await initializeTestEnvironment({projectId:project,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}});
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async ctx=>{
   const db=ctx.database();
   await set(ref(db,'_ironpathMaintenance'),{format:1,mode:'open',authAfterMs:0});
   await set(ref(db,`players/${uid}`),{name:'Alice',gender:'female',xp:750});
  });
  const [htmlOriginal,accountOriginal,afkOriginal,manifest]=await Promise.all([
   fs.readFile(path.join(root,'index.html'),'utf8'),fs.readFile(path.join(root,'account.js'),'utf8'),
   fs.readFile(path.join(root,'afk-session.mjs'),'utf8'),fs.readFile(path.join(root,'release-version.json'),'utf8')
  ]);
  const build=JSON.parse(manifest).build;
  const html=replaceOnce(htmlOriginal,/<meta name="ironpath-maintenance-database" content="[^"]+">/g,
   `<meta name="ironpath-maintenance-database" content="${config.databaseURL}">`,'maintenance URL');
  let account=replaceOnce(accountOriginal,/^[ \t]*config:\{[^\r\n]*\},[ \t]*\/\/ @ironpath-account-firebase-config[ \t]*$/gm,
   ` config:${JSON.stringify(config)}, // @ironpath-account-firebase-config`,'Firebase config');
  account=replaceOnce(account,/releaseSafety=\(\)=>afkTransition\?'saving':normalReleaseSafety\(\);/g,
   '$&globalThis.__testSafety=()=>normalReleaseSafety();','safety hook');
  // Do not alter Date.now globally: the real Auth SDK still sees real token time.
  const afk=replaceOnce(afkOriginal,/clock=Date\.now,/g,
   'clock=()=>Date.now()+(globalThis.__idleOffset||0),','AFK clock');
  const modules={};for(const name of ['firebase-app.js','firebase-auth.js','firebase-database.js'])modules[name]=await fs.readFile(path.join(__dirname,'node_modules/firebase',name));
  server=http.createServer(async(req,res)=>{
   try{
    let pathname=new URL(req.url,'http://127.0.0.1').pathname;if(pathname==='/IronPath/')pathname+='/index.html'.slice(1);
    if(!pathname.startsWith('/IronPath/'))throw Error('Unknown path');
    const file=path.resolve(root,pathname.slice('/IronPath/'.length));if(!file.startsWith(root+path.sep))throw Error('Invalid path');
    const body=await fs.readFile(file);
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(body);
   }catch{if(!res.headersSent)res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:process.env.CHROMIUM_PATH?['--no-sandbox']:[]});
  async function fixture(){
   const state={published:build,served:build,unavailable:false,documents:0,postLogoutChecks:0,external:[],errors:[]};
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});contexts.push(context);
   await context.addInitScript(id=>{
    globalThis.__idleOffset=0;globalThis.__advanceIdleClock=ms=>{globalThis.__idleOffset+=ms;};
    localStorage.setItem('ironpath:language','en');
    for(const prefix of ['training','tutorial','coach'])localStorage.setItem(`ironpath:${prefix}:v2:${id}`,'done');
   },uid);
   await context.routeWebSocket(url=>url.hostname!=='127.0.0.1'||url.port!=='9000',ws=>{state.external.push(ws.url());return ws.close();});
   await context.route('**/*',async route=>{
    const url=new URL(route.request().url()),name=path.basename(url.pathname);
    if(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/10.14.1/')){
     const body=name==='firebase-auth.js'?authWrapper:name==='firebase-auth-real.js'?modules['firebase-auth.js']:
      name==='firebase-database.js'?databaseWrapper:name==='firebase-database-real.js'?modules['firebase-database.js']:modules[name];
     if(body)return route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body});
    }
    if(url.hostname==='demo-ironpath.firebaseio.com'&&url.pathname==='/_ironpathMaintenance.json'){
     const upstream=await fetch(`http://127.0.0.1:9000/_ironpathMaintenance.json?ns=${project}`,{cache:'no-store',signal:AbortSignal.timeout(5000)});
     return route.fulfill({status:upstream.status,contentType:'application/json',headers:{'access-control-allow-origin':'*','cache-control':'no-store'},body:await upstream.text()});
    }
    if(url.origin===base){
     if(url.pathname==='/IronPath/'||url.pathname==='/IronPath/index.html'){
      state.documents++;return route.fulfill({status:200,contentType:'text/html',headers:{'cache-control':'no-store'},body:html.replaceAll(build,state.served)});
     }
     if(url.pathname==='/IronPath/account.js')return route.fulfill({contentType:'text/javascript',body:account});
     if(url.pathname==='/IronPath/afk-session.mjs')return route.fulfill({contentType:'text/javascript',body:afk});
     if(url.pathname==='/IronPath/release-version.json'){
      if(await route.request().frame().evaluate(()=>globalThis.__testSignOutDone===true).catch(()=>false))state.postLogoutChecks++;
      return route.fulfill(state.unavailable?{status:503,body:'unavailable'}:{status:200,contentType:'application/json',headers:{'cache-control':'no-store'},body:JSON.stringify({format:1,build:state.published})});
     }
     return route.continue();
    }
    if(url.hostname==='127.0.0.1'&&['9000','9099'].includes(url.port))return route.continue();
    state.external.push(url.href);return route.abort();
   });
   async function newPage(){
    const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>state.errors.push(error.stack||String(error)));
    await page.goto(base+'/IronPath/',{waitUntil:'domcontentloaded'});return page;
   }
   return {state,context,newPage,async close(){await context.close();assert.deepEqual(state.external,[],'no live services were contacted');assert.deepEqual(state.errors,[],'no uncaught browser errors');}};
  }
  async function login(page){
   await page.locator('#authView').waitFor({state:'visible'});await page.evaluate(()=>{document.getElementById('introOverlay').hidden=true;});
   await page.locator('#email').fill('afk-browser@example.test');await page.locator('#password').fill('example-password-123');await page.locator('#authSubmit').click();
   await page.locator('#menuMultiplayer').waitFor({state:'visible'});
   await page.waitForFunction(()=>globalThis.__testSafety?.()==='ready');
   assert.equal(await page.evaluate(()=>__testAuth.currentUser?.uid),uid);
  }
  async function advance(page,ms){await page.evaluate(value=>{__advanceIdleClock(value);document.dispatchEvent(new Event('visibilitychange'));},ms);}
  async function waitForLogout(page){
   await page.locator('#authView').waitFor({state:'visible'});
   await page.locator('#afkSessionStatus').waitFor({state:'hidden'});
   assert.equal(await page.evaluate(()=>__testAuth.currentUser),null);
   assert.match(await page.locator('#entryMessage').innerText(),/30 minutes of inactivity/);
  }
  {
   const f=await fixture(),{state}=f;
   try{
    const page=await f.newPage();await login(page);
    await advance(page,29*60_000);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__testAuth.currentUser?.uid),uid);
    await advance(page,2*60_000);await waitForLogout(page);
    assert.ok(state.postLogoutChecks>=1,'the version is freshly checked after actual Firebase sign-out');
    assert.equal(state.documents,1,'the current build is not reloaded after AFK');
    console.log('Real SDK AFK: local sign-out, fresh version probe and no reload for the current build passed.');
   }finally{await f.close();}
  }
  {
   const f=await fixture(),{state}=f;
   try{
    const page=await f.newPage();await login(page);state.published=nextBuild;state.served=nextBuild;
    await advance(page,31*60_000);
    await page.waitForFunction(expected=>document.querySelector('meta[name="ironpath-build"]')?.content===expected,nextBuild,{timeout:20000});
    await page.locator('#authView').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>__testAuth.currentUser),null,'the persisted game account remains signed out after navigation');
    assert.match(await page.locator('#entryMessage').innerText(),/30 minutes of inactivity/);
    assert.ok(state.postLogoutChecks>=1);assert.equal(state.documents,2,'only one automatic reload occurs');
    console.log('Real SDK AFK: a confirmed newer build reloads once after sign-out.');
   }finally{await f.close();}
  }
  {
   const f=await fixture(),{state}=f;
   try{
    const page=await f.newPage();await login(page);state.unavailable=true;await advance(page,31*60_000);await waitForLogout(page);
    assert.ok(state.postLogoutChecks>=1);assert.equal(state.documents,1,'an unavailable version is not evidence of a new build');
    await page.waitForFunction(()=>document.getElementById('versionNoticeText').textContent.includes('could not be checked'));
    console.log('Real SDK AFK: a failed version check leaves the signed-out player at login without a reload.');
   }finally{await f.close();}
  }
  {
   const f=await fixture(),{state}=f;let second;
   try{
    const page=await f.newPage();await login(page);second=await f.newPage();
    await second.locator('#menuMultiplayer').waitFor({state:'visible'});await second.evaluate(()=>{document.getElementById('introOverlay').hidden=true;});
    assert.equal(await second.evaluate(()=>__testAuth.currentUser?.uid),uid,'the real locally persisted game account is shared by tabs');
    await second.locator('#menuEndless').click();await second.locator('#endlessDeploy').click();
    await second.waitForFunction(()=>document.getElementById('message').textContent.includes('Free play ready.'));
    await page.waitForFunction(()=>globalThis.__testSafety?.()==='ready');await advance(page,31*60_000);await page.waitForTimeout(400);
    assert.equal(await page.evaluate(()=>__testAuth.currentUser?.uid),uid);assert.equal(await second.evaluate(()=>__testAuth.currentUser?.uid),uid);
    assert.equal(await second.locator('#gameWorkspace').isVisible(),true,'another tab keeps its deployed operation');
    await second.close();second=null;await advance(page,1000);await waitForLogout(page);
    assert.ok(state.postLogoutChecks>=1);assert.equal(state.documents,2,'neither cooperating tab was reloaded');
    console.log('Real SDK AFK: a second tab protects its shared account and active operation until it closes.');
   }finally{await second?.close();await f.close();}
  }
 }finally{
  for(const context of contexts)await context.close().catch(()=>{});
  await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));if(env)await env.cleanup();if(admin)await deleteAdmin(admin);
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
