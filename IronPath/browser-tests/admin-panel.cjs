// Browser UI with local doubles only: never contacts Firebase, publishes Rules,
// or toggles a production maintenance record. Rules are tested separately.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');
const base='http://127.0.0.1:8765',open={format:1,mode:'open',authAfterMs:0};
const app=`export function initializeApp(config,name){globalThis.__adminApp={config,name};return {name};}`;
const auth=`
 export const browserSessionPersistence={type:'SESSION'};
 const auth={currentUser:null};let observer=()=>{};
 export function initializeAuth(app,options){globalThis.__adminAuth=auth;globalThis.__adminPersistence=options.persistence.type;return auth;}
 export function onAuthStateChanged(_auth,callback){observer=callback;globalThis.__adminSwitchUser=uid=>{auth.currentUser=uid?{uid,email:uid+'@example.test'}:null;observer(auth.currentUser);};queueMicrotask(()=>observer(auth.currentUser));return ()=>{};}
 export async function signInWithEmailAndPassword(a,email,password){if(password!=='example-password')throw Error('invalid');a.currentUser={uid:email.startsWith('admin')?'test-admin':'ordinary-player',email};observer(a.currentUser);}
 export async function signOut(a){a.currentUser=null;observer(null);}
`;
const database=`
 const snap=value=>({val:()=>value});let listener=null;
 export function getDatabase(){return {};}
 export function ref(_db,path){return {path};}
 export async function get(r){if(r.path==='_ironpathMaintenanceAdminAccess'&&globalThis.__adminAuth.currentUser?.uid!=='test-admin')throw Object.assign(Error('permission_denied'),{code:'PERMISSION_DENIED'});return snap(null);}
 export function onValue(r,callback){listener=callback;globalThis.__adminEmit=value=>listener?.(snap(value));fetch('/__admin-control').then(r=>r.json()).then(value=>{if(listener===callback)callback(snap(value));});return ()=>{if(listener===callback)listener=null;};}
 export function serverTimestamp(){return {'.sv':'timestamp'};}
 export async function runTransaction(r,reducer){
  const current=await (await fetch('/__admin-control')).json(),next=reducer(current);
  if(next===undefined)return {committed:false,snapshot:snap(current)};
  if(globalThis.__adminAuth.currentUser?.uid!=='test-admin')throw Object.assign(Error('permission_denied'),{code:'PERMISSION_DENIED'});
  const response=await fetch('/__admin-control',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(next)});
  if(!response.ok)throw Object.assign(Error('permission_denied'),{code:'PERMISSION_DENIED'});
  const saved=await response.json();listener?.(snap(saved));return {committed:true,snapshot:snap(saved)};
 }
`;
async function fixture(browser,{control=open,sdkUnavailable=false,offline=false}={}){
 const state={control:structuredClone(control),sdkUnavailable,offline,errors:[],unexpected:[],writes:0,holdWrite:null};
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url()),name=url.pathname.split('/').pop();
  if(url.hostname==='www.gstatic.com'){
   if(state.sdkUnavailable)return route.abort();
   const body={'firebase-app.js':app,'firebase-auth.js':auth,'firebase-database.js':database}[name];
   if(body)return route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body});
  }
  if(url.hostname==='iron-path-dc727-default-rtdb.europe-west1.firebasedatabase.app'&&url.pathname==='/_ironpathMaintenance.json'){
   if(state.offline)return route.fulfill({status:503,headers:{'access-control-allow-origin':'*'},body:'offline'});
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','cache-control':'no-store'},body:JSON.stringify(state.control)});
  }
  if(url.origin!==base){state.unexpected.push(url.href);return route.abort();}
  if(url.pathname==='/__admin-control'){
   if(route.request().method()==='PUT'){
    state.writes++;if(state.holdWrite){state.holdWrite.requested();await state.holdWrite.wait;state.holdWrite=null;}
    const next=route.request().postDataJSON();state.control={...next,authAfterMs:typeof next.authAfterMs==='object'?Date.now():next.authAfterMs};
   }
   return route.fulfill({status:200,contentType:'application/json',headers:{'cache-control':'no-store'},body:JSON.stringify(state.control)});
  }
  return route.continue();
 });
 const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>state.errors.push(error.stack||String(error)));
 await page.goto(base+'/IronPath/admin.html',{waitUntil:'domcontentloaded'});
 return {page,state,context,async close(){await context.close();assert.deepEqual(state.unexpected,[],'no unmocked external requests');assert.deepEqual(state.errors,[],'no uncaught page errors');}};
}
async function login(page,email='admin@example.test'){
 await page.locator('#adminLoginButton:not([disabled])').waitFor();
 await page.locator('#adminEmail').fill(email);await page.locator('#adminPassword').fill('example-password');await page.locator('#adminLoginButton').click();
 await page.locator('#adminDashboard').waitFor({state:'visible'});
}
async function enabled(page,id){await page.waitForFunction(id=>!document.getElementById(id).disabled,id);}

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:process.env.CHROMIUM_PATH?['--no-sandbox']:[]});
 try{
  {
   const f=await fixture(browser,{control:{...open,mode:'maintenance'}}),{page,state}=f;
   try{
    await login(page);await enabled(page,'adminDisable');
    assert.equal(await page.locator('#adminStatusCard').getAttribute('data-state'),'maintenance');
    for(const [width,height] of [[320,568],[390,844],[1440,900]]){
     await page.setViewportSize({width,height});
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`admin layout fits ${width}px`);
    }
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>__adminApp.name),'ironpath-maintenance-admin');
    assert.equal(await page.evaluate(()=>__adminPersistence),'SESSION','admin authentication is separate and session-only');
    if(process.env.ADMIN_SCREENSHOT)await page.screenshot({path:process.env.ADMIN_SCREENSHOT,fullPage:true});
    await page.locator('#adminDisable').click();assert.match(await page.locator('#adminConfirmDetail').innerText(),/erneut anmelden/);
    await page.locator('#adminConfirmCancel').click();assert.equal(state.writes,0);
    await page.locator('#adminDisable').click();await page.locator('#adminConfirmAction').click();
    await page.waitForFunction(()=>document.getElementById('adminMessage').textContent.includes('öffentlich bestätigt'));
    assert.equal(state.control.mode,'open');assert.ok(state.control.authAfterMs>0);await enabled(page,'adminEnable');
    await page.locator('#adminEnable').click();assert.match(await page.locator('#adminConfirmDetail').innerText(),/Speicherungen können verloren gehen/);
    await page.locator('#adminConfirmAction').click();await page.waitForFunction(()=>document.getElementById('adminStatusCard').dataset.state==='maintenance');
    assert.equal(state.control.mode,'maintenance');assert.equal(state.writes,2);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'phone layout has no horizontal overflow');
    console.log('admin: isolated login works during maintenance; confirmation, reopening and closing work');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser),{page,state}=f;
   try{
    await login(page,'player@example.test');await page.waitForFunction(()=>document.getElementById('adminMessage').textContent.includes('konnte nicht bestätigt'));
    assert.equal(await page.locator('#adminEnable').isDisabled(),true);assert.equal(await page.locator('#adminDisable').isDisabled(),true);assert.equal(state.writes,0);
    await page.locator('#adminLogout').click();await page.locator('#adminLogin').waitFor({state:'visible'});
    await login(page);await enabled(page,'adminEnable');
    console.log('admin: ordinary account cannot access the controls; separate admin can sign in');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser,{offline:true}),{page,state}=f;
   try{
    await login(page);await page.waitForFunction(()=>document.getElementById('adminMessage').textContent.includes('nicht frisch'));
    assert.equal(await page.locator('#adminEnable').isDisabled(),true);assert.equal(state.writes,0);
    state.offline=false;await page.locator('#adminRefresh').click();await enabled(page,'adminEnable');
    console.log('admin: a missing fresh status fails closed and can be retried');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser),{page,state}=f;
   try{
    await login(page);await enabled(page,'adminEnable');await page.locator('#adminEnable').click();
    state.control={...open,mode:'maintenance'};await page.locator('#adminConfirmAction').click();
    await page.waitForFunction(()=>document.getElementById('adminMessage').textContent.includes('inzwischen geändert'));
    assert.equal(state.writes,0,'a fresh pre-write read catches the competing operator');
    console.log('admin: a concurrent operator cannot be overwritten from stale confirmation');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser),{page,state}=f;
   try{
    await login(page);await enabled(page,'adminEnable');let release,requested;
    const wait=new Promise(resolve=>{release=resolve;}),asked=new Promise(resolve=>{requested=resolve;});state.holdWrite={wait,requested};
    await page.locator('#adminEnable').click();await page.locator('#adminConfirmAction').click();await asked;
    assert.equal(await page.locator('#adminLogout').isDisabled(),true);
    await page.evaluate(()=>__adminSwitchUser('test-admin'));await page.waitForTimeout(100);
    assert.equal(await page.locator('#adminEnable').isDisabled(),true,'reauthentication cannot forget an outstanding transaction');
    assert.equal(await page.locator('#adminRefresh').isDisabled(),true);release();
    await page.waitForFunction(()=>document.getElementById('adminMessage').textContent.includes('vorheriger Schaltvorgang'));
    assert.equal(state.writes,1);assert.equal(await page.locator('#adminEnable').isDisabled(),true);
    console.log('admin: reauthentication cannot cause a duplicate while an old write remains unresolved');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser,{sdkUnavailable:true}),{page}=f;
   try{
    await page.waitForFunction(()=>document.getElementById('adminLoginMessage').textContent.includes('nicht geladen'));
    assert.equal(await page.locator('#adminLoginButton').isDisabled(),true);
    console.log('admin: a failed Firebase SDK leaves a clear, blocked login');
   }finally{await f.close();}
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
