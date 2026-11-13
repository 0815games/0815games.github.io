// End-to-end static packaging smoke with Firebase replaced by local doubles.
// This tests versioned URLs, not the as-yet-unwired maintenance/auth guard.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const fsp=require('node:fs/promises');
const path=require('node:path');const os=require('node:os');const http=require('node:http');
const {pathToFileURL}=require('node:url');
const mocks={
 'firebase-app.js':`export function initializeApp(){return {}}`,
 'firebase-auth.js':`const user={uid:'mock-user',getIdToken:async()=> 'mock'},auth={currentUser:user};export function getAuth(){return auth}export function onAuthStateChanged(a,cb){setTimeout(()=>cb(user),0);return ()=>{}}export async function signOut(a){a.currentUser=null}export async function signInWithEmailAndPassword(){}export async function createUserWithEmailAndPassword(){}export async function sendPasswordResetEmail(){}`,
 'firebase-database.js':`const profile={name:'Test Soldier',gender:'female',xp:750};export function getDatabase(){return {}}export function ref(db,path){return {path}}export function onValue(r,cb){if(r.path==='players/mock-user')queueMicrotask(()=>cb({val:()=>profile}));return ()=>{}}export async function runTransaction(){return {committed:false,snapshot:{val:()=>null,exists:()=>false}}}export async function get(r){return {val:()=>r.path==='players/mock-user'?profile:null,exists:()=>r.path==='players/mock-user',forEach(){}}}export async function remove(){}export async function set(){}export async function update(){}export function onDisconnect(){return {cancel:async()=>{},remove:async()=>{}}}export function serverTimestamp(){return Date.now()}export function query(r){return r}export function orderByKey(){return {}}export function startAfter(){return {}}export function limitToFirst(){return {}}export function orderByChild(){return {}}export function limitToLast(){return {}}`
};
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.ico':'image/x-icon'};

(async()=>{
 const tmp=await fsp.mkdtemp(path.join(os.tmpdir(),'ironpath-staged-browser-'));
 let browser,server;
 try{
  const out=path.join(tmp,'IronPath','releases');await fsp.mkdir(out,{recursive:true});
  const {stageVersion}=await import(pathToFileURL(path.resolve('IronPath/release-tools/stage-version.mjs')).href);
  await stageVersion({sourceDir:path.resolve('IronPath'),outputDir:out,build:'browser-test-1'});
  server=http.createServer(async(req,res)=>{
   try{
    let urlPath=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    if(urlPath.endsWith('/'))urlPath+='index.html';
    const file=path.resolve(tmp,'.'+urlPath);
    if(!file.startsWith(tmp+path.sep)){res.writeHead(403).end();return;}
    const body=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
   }catch{res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const local=`http://127.0.0.1:${server.address().port}`,prefix='/IronPath/releases/browser-test-1/';
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:process.env.CHROMIUM_PATH?['--no-sandbox']:[]});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const errors=[],missing=[],localRequests=[];
  try{
   await context.addInitScript(()=>{localStorage.setItem('ironpath:language','en');localStorage.setItem('ironpath:training:v2:mock-user','done');});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url()),file=url.pathname.split('/').pop();
    if(url.hostname==='www.gstatic.com'&&mocks[file])return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:mocks[file]});
    if(url.origin!==local)return route.abort();
    localRequests.push(url.pathname);return route.continue();
   });
   const page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(local))missing.push(`${response.status()} ${new URL(response.url()).pathname}`);});
   await page.goto(local+prefix,{waitUntil:'load'});
   await page.evaluate(()=>document.getElementById('introOverlay').hidden=true);
   await page.locator('#menuMultiplayer').waitFor({state:'visible',timeout:20000});
   assert.equal(await page.locator('html').getAttribute('data-ironpath-release-build'),'browser-test-1');
   assert.deepEqual(await page.locator('.build-stamp').allTextContents(),['BUILD browser-test-1','BUILD browser-test-1']);
   assert.ok(localRequests.some(p=>p.includes('/account.js')));assert.ok(localRequests.some(p=>p.includes('/game.js')));
   assert.ok(localRequests.some(p=>p.includes('/maps.mjs')));assert.ok(localRequests.some(p=>p.includes('/style.css')));
   assert.ok(localRequests.every(p=>p.startsWith(prefix)),`all local game files use the isolated build path: ${localRequests.filter(p=>!p.startsWith(prefix))}`);
   assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);
   console.log(`staged build: account, game, imports, CSS and assets loaded from one versioned directory (${localRequests.length} requests)`);
  }finally{await context.close();}
 }finally{
  if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));
  await fsp.rm(tmp,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
