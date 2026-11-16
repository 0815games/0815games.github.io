// Actual account UI and deletion flow in Chromium with synthetic Auth/RTDB
// doubles. This never contacts a real Firebase project and is not a Rules test.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const build=JSON.parse(readFileSync(require('node:path').join(__dirname,'../release-version.json'),'utf8')).build;
const mocks={
 'firebase-app.js':`export function initializeApp(){return {}}`,
 'firebase-auth.js':`
  const alice={uid:'mock-user',getIdToken:async()=> 'fake'},bob={uid:'other-user',getIdToken:async()=> 'fake'},auth={currentUser:sessionStorage.getItem('synthetic-guard-logout')?null:alice},listeners=new Set();
  const notify=()=>{for(const cb of listeners)cb(auth.currentUser)};
  globalThis.__fakeAuth={auth,alice,bob,switchToBob(){auth.currentUser=bob;notify();}};
  export function getAuth(){return auth}export function onAuthStateChanged(_a,cb){listeners.add(cb);queueMicrotask(()=>cb(auth.currentUser));return()=>listeners.delete(cb)}
  export async function signOut(a){globalThis.__signOutCalls=(globalThis.__signOutCalls||0)+1;if(globalThis.__signOutFails)throw Error('offline');a.currentUser=null;notify()}
  export async function signInWithEmailAndPassword(a){sessionStorage.removeItem('synthetic-guard-logout');a.currentUser=alice;notify();return {user:alice}}
  export async function createUserWithEmailAndPassword(){}export async function sendPasswordResetEmail(){}
 `,
 'firebase-database.js':`
  const values=new Map([['_ironpathMaintenance',{format:1,mode:'open',authAfterMs:0}],['players/mock-user',{name:'Alice',gender:'female',xp:750}],['players/other-user',{name:'Bob',gender:'male',xp:0}]]),listeners=new Map();
  if(sessionStorage.getItem('synthetic-deleted'))values.delete('players/mock-user');
  const snap=path=>({val:()=>values.get(path)??null,exists:()=>values.has(path),forEach(){}});
  export function getDatabase(){return {}}export function goOffline(){}export function ref(_db,path){return {path:path||''}}
  export function onValue(r,cb){const list=listeners.get(r.path)||new Set();list.add(cb);listeners.set(r.path,list);queueMicrotask(()=>{if(list.has(cb))cb(snap(r.path))});return ()=>list.delete(cb)}
  export async function get(r){return snap(r.path)}export async function set(r,v){values.set(r.path,v)}export async function remove(r){values.delete(r.path)}
  export async function update(_r,patch){if(Object.hasOwn(patch,'players/mock-user')){globalThis.__deleteQueued=true;if(globalThis.__holdDeletion)await new Promise(resolve=>{globalThis.__releaseDelete=resolve});if(globalThis.__rejectDeletion)throw Error('permission denied');sessionStorage.setItem('synthetic-deleted','1');}for(const [p,v] of Object.entries(patch))if(v===null)values.delete(p);else values.set(p,v)}
  export async function runTransaction(){return {committed:false,snapshot:{val:()=>null,exists:()=>false}}}export function onDisconnect(){return {cancel:async()=>{},remove:async()=>{}}}
  export function serverTimestamp(){return Date.now()}export function query(r){return r}export function orderByKey(){return {}}export function startAfter(){return {}}export function limitToFirst(){return {}}export function orderByChild(){return {}}export function limitToLast(){return {}}
 `,
};
const friends=`export function setupFriends(){return {start(){},reset(){},open(){},signOut:async()=>{},prepareForDeletion:async()=>{},hasPending:()=>false}}`;
const panel=`export function createFourPlayerPanel(){return {show(){},hide(){},isActive:()=>false,isBusy:()=>false,hostInvite:()=>null,joinInvite:async()=>false,leaveParty:async()=>true,leaveForLogout:async()=>{}}}`;
// The actual account-services guard and document boundary, with a synthetic
// guarded session. As in the real guard, abort precedes sign-out and the old
// document is replaced instead of receiving a signed-out observer callback.
const guardedBootstrap=`
 import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
 import {getAuth,onAuthStateChanged,signOut,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
 import {getDatabase} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
 import {installGuardedAccountSession} from './account-services.mjs?v=20261031-releaseguard1';
 const app=initializeApp({}),auth=getAuth(app),db=getDatabase(app),controller=new AbortController();
 const session={auth,db,onAuthStateChanged:cb=>onAuthStateChanged(auth,cb),signIn:(e,p)=>signInWithEmailAndPassword(auth,e,p),register:(e,p)=>createUserWithEmailAndPassword(auth,e,p),resetPassword:e=>sendPasswordResetEmail(auth,e),
  logout(){controller.abort();sessionStorage.setItem('synthetic-guard-logout','1');void signOut(auth);location.replace('/IronPath/?guarded-return=1');}};
 installGuardedAccountSession({session,signal:controller.signal});await import('./account.js?v=${build}');
`;

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
 try{
  for(const scenario of ['success','signout-failure','deletion-failure','account-switch','guarded-success']){
   const context=await browser.newContext({bypassCSP:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   try{
    await context.addInitScript(scenario=>{
     localStorage.setItem('ironpath:language','de');for(const id of ['mock-user','other-user'])for(const prefix of ['training','tutorial','coach'])localStorage.setItem(`ironpath:${prefix}:v2:${id}`,'done');
     window.__holdDeletion=['success','account-switch','guarded-success'].includes(scenario);window.__rejectDeletion=scenario==='deletion-failure';window.__signOutFails=scenario==='signout-failure';
    },scenario);
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url()),file=url.pathname.split('/').pop();
     if(url.hostname==='iron-path-dc727-default-rtdb.europe-west1.firebasedatabase.app'&&url.pathname==='/_ironpathMaintenance.json')return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({format:1,mode:'open',authAfterMs:0})});
     if(url.hostname==='www.gstatic.com'&&mocks[file])return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:mocks[file]});
     if(url.hostname!=='127.0.0.1')return route.abort();
     if(scenario==='guarded-success'&&url.pathname==='/IronPath/'){
      const response=await route.fetch();let html=await response.text();
      html=html.replace('<html lang="en"','<html lang="en" data-ironpath-guard="required"').replace(/<script type="module" src="account-entry\.mjs\?v=[^"]+"><\/script>/,'<script type="module" src="synthetic-guard-bootstrap.mjs"></script>');
      return route.fulfill({response,body:html});
     }
     if(file==='synthetic-guard-bootstrap.mjs')return route.fulfill({contentType:'text/javascript',body:guardedBootstrap});
     if(file==='friends-ui.mjs')return route.fulfill({contentType:'text/javascript',body:friends});
     if(file==='firebase-four-panel.mjs')return route.fulfill({contentType:'text/javascript',body:panel});
     return route.continue();
    });
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));page.on('console',event=>{if(event.type()==='error')errors.push('console: '+event.text());});page.on('response',response=>{if(response.status()>=400)errors.push('HTTP '+response.status()+' '+response.url());});
    await page.goto('http://127.0.0.1:8765/IronPath/',{waitUntil:'load'});await page.evaluate(()=>document.getElementById('introOverlay').hidden=true);
    try{await page.locator('#menuDeleteCharacter').waitFor({state:'visible',timeout:20000});}catch(error){console.error('Boot state',await page.evaluate(()=>Object.fromEntries(['loading','entry','authView','connectionView','characterView','gameView','entryMessage'].map(id=>[id,{hidden:document.getElementById(id)?.hidden,text:document.getElementById(id)?.textContent?.slice(0,200)}]))),errors);throw error;}
    await page.locator('#menuDeleteCharacter').click();
    await page.locator('#gameConfirm').waitFor({state:'visible'});await page.locator('#gameConfirmAccept').click();
    await page.waitForFunction(()=>window.__deleteQueued===true,null,{timeout:10000});
    if(['success','account-switch','guarded-success'].includes(scenario)){
     assert.equal(await page.locator('#characterView').isVisible(),false,'no recruitment before acknowledgement');assert.equal(await page.evaluate(()=>window.__signOutCalls||0),0);
     if(scenario==='account-switch')await page.evaluate(()=>window.__fakeAuth.switchToBob());
     await page.evaluate(()=>window.__releaseDelete());
    }
    if(scenario==='deletion-failure'){
     await page.locator('#connectionView').waitFor({state:'visible'});assert.match(await page.locator('#entryMessage').textContent(),/nicht bestätigt/i);assert.equal(await page.evaluate(()=>window.__signOutCalls||0),0);
    }else if(scenario==='account-switch'){
     await page.waitForFunction(()=>document.getElementById('menuName').textContent==='Bob');await page.waitForTimeout(100);
     assert.equal(await page.evaluate(()=>window.__fakeAuth.auth.currentUser.uid),'other-user');assert.equal(await page.evaluate(()=>window.__signOutCalls||0),0);assert.equal(await page.evaluate(()=>sessionStorage.getItem('ironpath:discharge-notice:v1')),null);
    }else{
     if(scenario==='signout-failure'){
      await page.locator('#connectionView').waitFor({state:'visible'});assert.match(await page.locator('#entryMessage').textContent(),/Abmeldung ist fehlgeschlagen/);assert.equal(await page.locator('#characterView').isVisible(),false);
      await page.evaluate(()=>{window.__signOutFails=false});await page.locator('#retryProfile').click();
     }
     if(scenario==='guarded-success')await page.waitForURL('**/IronPath/?guarded-return=1',{timeout:20000});
     await page.locator('#authView').waitFor({state:'visible'});
     assert.equal(await page.locator('#entryMessage').textContent(),'Dein Charakter wurde aus dem Dienst entlassen. Bitte melde dich erneut an.');
     assert.equal(await page.evaluate(()=>window.__fakeAuth.auth.currentUser),null);
     await page.locator('#email').fill('synthetic@example.test');await page.locator('#password').fill('fake-password');await page.locator('#authSubmit').click();await page.locator('#characterView').waitFor({state:'visible'});
     assert.notEqual(await page.locator('#entryMessage').textContent(),'Dein Charakter wurde aus dem Dienst entlassen. Bitte melde dich erneut an.');
    }
    assert.deepEqual(errors,[],`${scenario}: no page errors`);console.log(`${scenario}: account deletion and sign-out UI passed with doubles`);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
