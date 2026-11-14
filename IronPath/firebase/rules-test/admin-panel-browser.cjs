// Real Web SDK + local Auth/RTDB emulators + the real admin UI. Test-only
// bootstrap retargets to demo-ironpath; production CORS, CDN and Pages are not tested.
const {chromium}=require(process.env.PW_PATH||'playwright');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {initializeApp:initializeAdmin,deleteApp:deleteAdmin}=require('firebase-admin/app');
const {getAuth:getAdminAuth}=require('firebase-admin/auth');
const {ref,get,set}=require('firebase/database');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');

for(const [key,port] of [['FIREBASE_AUTH_EMULATOR_HOST',9099],['FIREBASE_DATABASE_EMULATOR_HOST',9000]]){
 if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(process.env[key]))throw Error(`${key} must name the local emulator`);
}
const project='demo-ironpath',adminUid='local-admin-browser',gameUid='local-game-browser';
const root=path.resolve(__dirname,'../..');
const config={apiKey:'fake',authDomain:'demo-ironpath.firebaseapp.com',databaseURL:'https://demo-ironpath.firebaseio.com',projectId:project,appId:'fake-app'};
const bootstrap=`
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {initializeAuth,browserSessionPersistence,connectAuthEmulator,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getDatabase,connectDatabaseEmulator,ref,get,onValue,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import {createAdminPanel} from './admin-panel.mjs';
const config=${JSON.stringify(config)},app=initializeApp(config,'ironpath-maintenance-admin');
const auth=initializeAuth(app,{persistence:browserSessionPersistence});connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
const db=getDatabase(app);connectDatabaseEmulator(db,'127.0.0.1',9000);
window.__adminAuth=auth;
createAdminPanel({document,window,auth,db,databaseUrl:config.databaseURL,
 fetcher:(_url,options)=>fetch('/status',options),
 sdk:{onAuthStateChanged,signInWithEmailAndPassword,signOut,ref,get,onValue,runTransaction,serverTimestamp}});
`;
const gameBootstrap=`
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {initializeAuth,browserLocalPersistence,connectAuthEmulator,signInWithEmailAndPassword} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
const app=initializeApp(${JSON.stringify(config)}),auth=initializeAuth(app,{persistence:browserLocalPersistence});
connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
window.__gameAuth=auth;window.__gameLogin=()=>signInWithEmailAndPassword(auth,'game@example.test','example-password-123');
`;
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};

(async()=>{
 let env,server,browser,admin;
 try{
  const bytes=await fs.readFile(path.join(root,'firebase/WORKSHOP-RULES-TO-PUBLISH.json'));
  const {buildSocialCleanupCandidate}=await import(pathToFileURL(path.join(root,'firebase/social-cleanup-candidate.mjs')).href);
  const {buildMaintenanceRulesCandidate}=await import(pathToFileURL(path.join(root,'release-tools/maintenance-rules.mjs')).href);
  const rules=buildMaintenanceRulesCandidate(buildSocialCleanupCandidate(bytes),{adminUid}).candidate;
  admin=initializeAdmin({projectId:project},'maintenance-admin-browser-seed');
  await getAdminAuth(admin).createUser({uid:adminUid,email:'admin@example.test',password:'example-password-123'});
  await getAdminAuth(admin).createUser({uid:gameUid,email:'game@example.test',password:'example-password-123'});
  env=await initializeTestEnvironment({projectId:project,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}});
  const adminSet=(p,v)=>env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),p),v));
  const adminGet=async p=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),p))).val();});return value;};
  await env.clearDatabase();await adminSet('_ironpathMaintenance',{format:1,mode:'maintenance',authAfterMs:0});
  await adminSet(`players/${gameUid}`,{name:'Game',gender:'female',xp:0});
  const modules={};for(const name of ['firebase-app.js','firebase-auth.js','firebase-database.js'])modules[name]=await fs.readFile(path.join(__dirname,'node_modules/firebase',name));
  server=http.createServer(async(req,res)=>{
   try{
    const pathname=new URL(req.url,'http://127.0.0.1').pathname;
    if(pathname==='/status'){
     const upstream=await fetch(`http://127.0.0.1:9000/_ironpathMaintenance.json?ns=${project}`,{cache:'no-store',signal:AbortSignal.timeout(5000)});
     res.writeHead(upstream.status,{'content-type':'application/json','cache-control':'no-store'}).end(await upstream.text());return;
    }
    if(pathname==='/IronPath/admin-test-bootstrap.mjs'){res.writeHead(200,{'content-type':'text/javascript'}).end(bootstrap);return;}
    if(pathname==='/IronPath/game-test-bootstrap.mjs'){res.writeHead(200,{'content-type':'text/javascript'}).end(gameBootstrap);return;}
    if(pathname==='/IronPath/test-game-auth.html'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>Test auth</title><script type="module" src="game-test-bootstrap.mjs"></script>');return;}
    if(pathname.startsWith('/sdk/')&&modules[path.basename(pathname)]){res.writeHead(200,{'content-type':'text/javascript'}).end(modules[path.basename(pathname)]);return;}
    const relative=pathname.replace(/^\/IronPath\//,'');if(relative===pathname)throw Error('Unknown path');
    const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep))throw Error('Invalid path');
    let body=await fs.readFile(file);
    if(relative==='admin.html')body=Buffer.from(body.toString('utf8').replace('admin-entry.mjs?v=20261031-update2','admin-test-bootstrap.mjs'));
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(body);
   }catch{if(!res.headersSent)res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port,base=`http://127.0.0.1:${port}`;
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:process.env.CHROMIUM_PATH?['--no-sandbox']:[]});
  const context=await browser.newContext({bypassCSP:true,viewport:{width:390,height:844},serviceWorkers:'block'});const external=[],errors=[];
  try{
   await context.routeWebSocket(url=>url.hostname!=='127.0.0.1'||url.port!=='9000',ws=>{external.push(ws.url());return ws.close();});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url()),name=path.basename(url.pathname);
    if(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/10.14.1/')&&modules[name])
     return route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:modules[name]});
    if(url.hostname==='127.0.0.1'&&[String(port),'9000','9099'].includes(url.port))return route.continue();
    external.push(url.origin);return route.abort();
   });
   const game=await context.newPage();game.on('pageerror',e=>errors.push(String(e)));
   await game.goto(base+'/IronPath/test-game-auth.html');await game.waitForFunction(()=>typeof window.__gameLogin==='function');
   await game.evaluate(()=>window.__gameLogin());assert.equal(await game.evaluate(()=>__gameAuth.currentUser?.uid),gameUid);
   const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(base+'/IronPath/admin.html');await page.locator('#adminLoginButton:not([disabled])').waitFor({timeout:20000});
   await page.locator('#adminEmail').fill('admin@example.test');await page.locator('#adminPassword').fill('example-password-123');await page.locator('#adminLoginButton').click();
   await page.waitForFunction(()=>!document.getElementById('adminDisable').disabled,null,{timeout:20000});
   assert.equal(await page.evaluate(()=>__adminAuth.currentUser?.uid),adminUid);
   assert.equal(await game.evaluate(()=>__gameAuth.currentUser?.uid),gameUid,'admin login does not replace the game account');
   await page.locator('#adminDisable').click();await page.locator('#adminConfirmAction').click();
   await page.waitForFunction(()=>document.getElementById('adminMessage').textContent.includes('öffentlich bestätigt'),null,{timeout:20000});
   let record=await adminGet('_ironpathMaintenance');assert.equal(record.mode,'open');assert.ok(record.authAfterMs>0);
   await page.waitForFunction(()=>!document.getElementById('adminEnable').disabled,null,{timeout:20000});
   await page.locator('#adminEnable').click();await page.locator('#adminConfirmAction').click();
   await page.waitForFunction(()=>document.getElementById('adminStatusCard').dataset.state==='maintenance',null,{timeout:20000});
   record=await adminGet('_ironpathMaintenance');assert.equal(record.mode,'maintenance');
   await page.locator('#adminLogout').click();await page.locator('#adminLogin').waitFor({state:'visible'});
   assert.equal(await game.evaluate(()=>__gameAuth.currentUser?.uid),gameUid,'admin logout does not sign out the game');
   await page.locator('#adminEmail').fill('game@example.test');await page.locator('#adminPassword').fill('example-password-123');await page.locator('#adminLoginButton').click();
   await page.waitForFunction(()=>document.getElementById('adminMessage').textContent.includes('Berechtigung oder Verbindung'),null,{timeout:20000});
   assert.equal(await page.locator('#adminEnable').isDisabled(),true);assert.equal(await page.locator('#adminDisable').isDisabled(),true);
   assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
   console.log('Admin browser with local real Auth/RTDB: separate game session, closed-mode login, safe toggles and ordinary-user denial passed.');
  }finally{if(errors.length||external.length)console.error('Browser diagnostics:',{errors,external});await context.close();}
 }finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));if(env)await env.cleanup();if(admin)await deleteAdmin(admin);}
})().catch(error=>{console.error(error);process.exitCode=1;});
