// Real Iron Path account UI and Firebase Web SDKs in TWO isolated Chromium
// browser contexts (normal browser profile + private/incognito browser context)
// against local Auth and RTDB emulators running BLOCK9D-RULES-TO-PUBLISH.json.
const {chromium}=require(process.env.PW_PATH||'playwright');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {initializeApp:initializeAdmin,deleteApp:deleteAdmin}=require('firebase-admin/app');
const {getAuth:getAdminAuth}=require('firebase-admin/auth');
const {ref,get,set}=require('firebase/database');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');

for(const [key,port] of [['FIREBASE_AUTH_EMULATOR_HOST',9099],['FIREBASE_DATABASE_EMULATOR_HOST',9000]]){
 if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(process.env[key]))throw Error(`${key} must explicitly name the local emulator`);
}

const project='demo-ironpath',uid='block9d-session-browser';
const email='session-browser@example.test',password='example-password-123';
const root=path.resolve(__dirname,'../..');
const config={apiKey:'fake',authDomain:'demo-ironpath.firebaseapp.com',databaseURL:'https://demo-ironpath.firebaseio.com',projectId:project,appId:'fake-app'};
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.ico':'image/x-icon'};

const authWrapper=`
export * from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-real.js';
import {getAuth as realGetAuth,connectAuthEmulator} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-real.js';
const prepared=new WeakSet();
export function getAuth(app){const auth=realGetAuth(app);if(!prepared.has(auth)){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});prepared.add(auth);}window.__testAuth=auth;return auth;}
`;
const databaseWrapper=`
export * from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-real.js';
import {getDatabase as realGetDatabase,connectDatabaseEmulator} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-real.js';
const prepared=new WeakSet();
export function getDatabase(app){const db=realGetDatabase(app);if(!prepared.has(db)){connectDatabaseEmulator(db,'127.0.0.1',9000);prepared.add(db);}return db;}
`;

function replaceOnce(source,pattern,replacement,label){
 const matches=[...source.matchAll(pattern)];
 if(matches.length!==1)throw Error(`Unexpected ${label} in game source`);
 return source.replace(pattern,replacement);
}

(async()=>{
 let env,admin,browser,server;
 const contexts=[];
 try{
  const rules=await fs.readFile(path.join(root,'firebase/BLOCK9D-RULES-TO-PUBLISH.json'),'utf8');
  admin=initializeAdmin({projectId:project},'block9d-browser-seed');
  await getAdminAuth(admin).createUser({uid,email,password});
  env=await initializeTestEnvironment({projectId:project,database:{host:'127.0.0.1',port:9000,rules}});
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async ctx=>{
   await set(ref(ctx.database()),{
    _ironpathMaintenance:{format:1,mode:'open',authAfterMs:0},
    players:{[uid]:{name:'Alice',gender:'female',xp:750}}
   });
  });

  const [htmlOriginal,accountOriginal,manifest]=await Promise.all([
   fs.readFile(path.join(root,'index.html'),'utf8'),
   fs.readFile(path.join(root,'account.js'),'utf8'),
   fs.readFile(path.join(root,'release-version.json'),'utf8')
  ]);
  const build=JSON.parse(manifest).build;
  const html=replaceOnce(htmlOriginal,/<meta name="ironpath-maintenance-database" content="[^"]+">/g,
   `<meta name="ironpath-maintenance-database" content="${config.databaseURL}">`,'maintenance URL');
  const account=replaceOnce(accountOriginal,/^[ \t]*config:\{[^\r\n]*\},[ \t]*\/\/ @ironpath-account-firebase-config[ \t]*$/gm,
   ` config:${JSON.stringify(config)}, // @ironpath-account-firebase-config`,'Firebase config');
  const modules={};
  for(const name of ['firebase-app.js','firebase-auth.js','firebase-database.js']){
   modules[name]=await fs.readFile(path.join(__dirname,'node_modules/firebase',name));
  }

  server=http.createServer(async(req,res)=>{
   try{
    let pathname=new URL(req.url,'http://127.0.0.1').pathname;
    if(pathname==='/IronPath/')pathname='/IronPath/index.html';
    if(!pathname.startsWith('/IronPath/'))throw Error('Unknown path');
    if(pathname==='/IronPath/index.html'){res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'}).end(html);return;}
    if(pathname==='/IronPath/account.js'){res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'}).end(account);return;}
    if(pathname==='/IronPath/release-version.json'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'}).end(JSON.stringify({format:1,build}));return;}
    const file=path.resolve(root,pathname.slice('/IronPath/'.length));
    if(!file.startsWith(root+path.sep))throw Error('Invalid path');
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(await fs.readFile(file));
   }catch{if(!res.headersSent)res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:process.env.CHROMIUM_PATH?['--no-sandbox']:[]});

  async function openIsolatedContext({lang='en'}={}){
   const external=[],errors=[];
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
   contexts.push({context,external,errors});
   await context.addInitScript(({id,language})=>{
    localStorage.setItem('ironpath:language',language);
    for(const prefix of ['training','tutorial','coach'])localStorage.setItem(`ironpath:${prefix}:v2:${id}`,'done');
   },{id:uid,language:lang});
   await context.routeWebSocket(url=>url.hostname!=='127.0.0.1'||url.port!=='9000',ws=>{external.push(ws.url());return ws.close();});
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
    if(url.origin===base||(url.hostname==='127.0.0.1'&&['9000','9099'].includes(url.port)))return route.continue();
    external.push(url.href);return route.abort();
   });
   const page=await context.newPage();
   page.setDefaultTimeout(20000);
   page.on('pageerror',err=>errors.push(err.stack||String(err)));
   await page.goto(base+'/IronPath/',{waitUntil:'domcontentloaded'});
   await page.locator('#authView').waitFor({state:'visible'});
   await page.evaluate(()=>{document.getElementById('introOverlay').hidden=true;});
   return {context,page,external,errors};
  }

  async function adminSession(){
   let val=null;
   await env.withSecurityRulesDisabled(async ctx=>{val=(await get(ref(ctx.database(),`activeSessions/${uid}`))).val();});
   return val;
  }

  // 1. Normal browser window logs in and claims activeSessions/$uid
  const normal=await openIsolatedContext({lang:'en'});
  await normal.page.locator('#email').fill(email);
  await normal.page.locator('#password').fill(password);
  await normal.page.locator('#authSubmit').click();
  await normal.page.locator('#menuMultiplayer').waitFor({state:'visible'});
  const lease1=await adminSession();
  assert.ok(lease1?.clientId,'normal window claimed activeSessions/$uid');

  // 2. Private/incognito browser context cannot log in concurrently with the same account
  const priv=await openIsolatedContext({lang:'en'});
  await priv.page.locator('#email').fill(email);
  await priv.page.locator('#password').fill(password);
  await priv.page.locator('#authSubmit').click();
  await priv.page.waitForFunction(()=>document.getElementById('entryMessage')?.textContent.includes('already active'));
  assert.equal(await priv.page.locator('#authView').isVisible(),true,'private window remains at login');
  assert.equal(await priv.page.locator('#sessionTakeoverField').isVisible(),true,'explicit takeover option is offered after block');
  assert.equal(await priv.page.evaluate(()=>globalThis.__testAuth?.currentUser),null,'private window was signed out immediately');
  assert.equal(await normal.page.locator('#commandCenter').isVisible(),true,'original normal window stays logged in untouched');
  assert.equal((await adminSession())?.clientId,lease1.clientId,'lease remains owned by original normal window');

  // 3. Closing the normal window fires onDisconnect().remove(), allowing clean login in the private window
  await normal.context.close();
  for(let i=0;i<50&&await adminSession()!==null;i++)await new Promise(resolve=>setTimeout(resolve,100));
  assert.equal(await adminSession(),null,'onDisconnect clears activeSessions/$uid on window close');
  await priv.page.locator('#password').fill(password);
  await priv.page.locator('#authSubmit').click();
  await priv.page.locator('#menuMultiplayer').waitFor({state:'visible'});
  const lease2=await adminSession();
  assert.ok(lease2?.clientId&&lease2.clientId!==lease1.clientId,'private window owns fresh active session');

  // 4. Explicit takeover from a third window kicks the active private window immediately
  const third=await openIsolatedContext({lang:'de'});
  await third.page.locator('#email').fill(email);
  await third.page.locator('#password').fill(password);
  await third.page.locator('#authSubmit').click();
  await third.page.waitForFunction(()=>document.getElementById('entryMessage')?.textContent.includes('bereits in einem anderen Browser-Fenster'));
  await third.page.locator('#sessionTakeoverCheck').check();
  await third.page.locator('#password').fill(password);
  await third.page.locator('#authSubmit').click();
  await third.page.locator('#menuMultiplayer').waitFor({state:'visible'});

  await priv.page.waitForFunction(()=>document.getElementById('entryMessage')?.textContent.includes('signed in on another browser window'));
  assert.equal(await priv.page.evaluate(()=>globalThis.__testAuth?.currentUser),null,'kicked window was signed out');
  assert.equal(await priv.page.locator('#commandCenter').isVisible(),false);
  const lease3=await adminSession();
  assert.ok(lease3?.clientId&&lease3.clientId!==lease2.clientId,'third window holds the single active session');

  // 5. Explicit sign-out removes activeSessions/$uid immediately
  await third.page.locator('#menuLogout').click();
  await third.page.locator('#authView').waitFor({state:'visible'});
  assert.equal(await adminSession(),null,'explicit sign-out deletes activeSessions/$uid');

  for(const item of contexts){
   assert.deepEqual(item.external,[],'no live services contacted');
   assert.deepEqual(item.errors,[],'no uncaught browser errors');
  }
  console.log('BLOCK9D single-session browser enforcement (normal + private block, onDisconnect release, live takeover kick) passed.');
 }finally{
  for(const item of contexts)await item.context.close().catch(()=>{});
  await browser?.close();
  if(server)await new Promise(resolve=>server.close(resolve));
  if(env)await env.cleanup();
  if(admin)await deleteAdmin(admin);
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
