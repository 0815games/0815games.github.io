// The face, handed over to the server - in the real account UI, in Chromium,
// with the synthetic Auth/RTDB doubles of character-discharge.cjs. This never
// contacts a real Firebase project and is not a Rules test; the Rules side is
// firebase/rules-test/friend-portrait.test.mjs.
//
// The soldier in these scenarios enlisted BEFORE the avatar field existed: the
// server has {name, gender, xp} and no face, and this browser has been carrying
// the face in its localStorage mirror ever since. That is the state the game is
// in today, and it is why a second device never showed the face.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');

// The mirror this device has been keeping: a layered combination, not the
// gender default, so a hand-over of the wrong face would be visible.
const MIRROR='g:f|face:f2|hair:braid';

const mocks={
 'firebase-app.js':`export function initializeApp(){return {}}`,
 'firebase-auth.js':`
  const alice={uid:'mock-user',getIdToken:async()=> 'fake'},auth={currentUser:alice},listeners=new Set();
  const notify=()=>{for(const cb of listeners)cb(auth.currentUser)};
  globalThis.__fakeAuth={auth,alice,switchToBob(){}};
  export function getAuth(){return auth}export function onAuthStateChanged(_a,cb){listeners.add(cb);queueMicrotask(()=>cb(auth.currentUser));return()=>listeners.delete(cb)}
  export async function signOut(a){a.currentUser=null;notify();}
  export async function signInWithEmailAndPassword(a){a.currentUser=alice;notify();return {user:alice}}
  export async function createUserWithEmailAndPassword(){}export async function sendPasswordResetEmail(){}
 `,
 // A profile with no avatar at all, exactly like a soldier from before the
 // field. Every update is recorded; in the 'refused' scenario the avatar write
 // is rejected the way a ruleset without the field rejects it.
 'firebase-database.js':`
  const values=new Map([['_ironpathMaintenance',{format:1,mode:'open',authAfterMs:0}],['players/mock-user',{name:'Alice',gender:'female',xp:750}]]),listeners=new Map();
  const snap=path=>({val:()=>values.get(path)??null,exists:()=>values.has(path),forEach(){}});
  export function getDatabase(){return {}}export function goOffline(){}export function ref(_db,path){return {path:path||''}}
  export function onValue(r,cb){const list=listeners.get(r.path)||new Set();list.add(cb);listeners.set(r.path,list);queueMicrotask(()=>{if(list.has(cb))cb(snap(r.path))});return ()=>list.delete(cb)}
  export async function get(r){return snap(r.path)}export async function set(r,v){values.set(r.path,v)}export async function remove(r){values.delete(r.path)}
  export async function update(r,patch){
   (globalThis.__updates??(globalThis.__updates=[])).push([r.path,patch]);
   if(globalThis.__refuseAvatar&&Object.hasOwn(patch,'avatar'))throw Error('PERMISSION_DENIED: the rules have no avatar field');
   for(const [key,value] of Object.entries(patch))values.set((r.path?r.path+'/':'')+key,value);
  }
  export async function runTransaction(){return {committed:false,snapshot:{val:()=>null,exists:()=>false}}}
  export function onDisconnect(){return {cancel:async()=>{},remove:async()=>{}}}
  export function serverTimestamp(){return Date.now()}export function query(r){return r}export function orderByKey(){return {}}
  export function startAfter(){return {}}export function limitToFirst(){return {}}export function orderByChild(){return {}}export function limitToLast(){return {}}
 `,
};
const friends=`export function setupFriends(){return {start(){},reset(){},open(){},signOut:async()=>{},prepareForDeletion:async()=>{},hasPending:()=>false}}`;
const panel=`export function createFourPlayerPanel(){return {show(){},hide(){},isActive:()=>false,isBusy:()=>false,hostInvite:()=>null,joinInvite:async()=>false,leaveParty:async()=>true,leaveForLogout:async()=>{}}}`;

// Everything the boot state can say about itself, for the one case that cannot
// be reproduced locally: a Chromium that sits on the loading screen.
async function diagnose(page){
 return page.evaluate(()=>{
  const state=id=>{const node=document.getElementById(id);return node?{hidden:node.hidden,open:!!node.open,text:(node.textContent||'').slice(0,160)}:null;};
  return {ironPathLoaded:window.ironPathLoaded===true,
   views:Object.fromEntries(['loading','releaseCheck','maintenanceGate','connectionView','authView','characterView','gameView'].map(id=>[id,state(id)])),
   step:document.getElementById('loadingStep')?.textContent??null,
   updates:window.__updates??null,refuse:globalThis.__refuseAvatar??null,
   avatar:localStorage.getItem('ironpath:avatar')};
 });
}

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
 try{
  // 'synced'  - the rules accept the field: the face follows the soldier;
  // 'refused' - they do not (today's published rules): the account stays
  //             healthy and the mirror keeps the face on this device.
  for(const scenario of ['synced','refused']){
   const context=await browser.newContext({bypassCSP:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   try{
    await context.addInitScript(({scenario,mirror})=>{
     window.__updates=[];window.__refuseAvatar=scenario==='refused';
     localStorage.setItem('ironpath:language','de');
     localStorage.setItem('ironpath:avatar',mirror);
     localStorage.setItem('ironpath:training:v2:mock-user','done');
     localStorage.setItem('ironpath:tutorial:v2:mock-user','done');
     localStorage.setItem('ironpath:coach:v2:mock-user','done');
    },{scenario,mirror:MIRROR});
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url()),file=url.pathname.split('/').pop();
     if(url.hostname==='iron-path-dc727-default-rtdb.europe-west1.firebasedatabase.app'&&url.pathname==='/_ironpathMaintenance.json')return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({format:1,mode:'open',authAfterMs:0})});
     if(url.hostname==='www.gstatic.com'&&mocks[file])return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:mocks[file]});
     if(url.hostname!=='127.0.0.1')return route.abort();
     if(file==='friends-ui.mjs')return route.fulfill({contentType:'text/javascript',body:friends});
     if(file==='firebase-four-panel.mjs')return route.fulfill({contentType:'text/javascript',body:panel});
     return route.continue();
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    page.on('console',event=>{if(event.type()==='error')errors.push('console: '+event.text());});
    page.on('response',response=>{if(response.status()>=400)errors.push('HTTP '+response.status()+' '+response.url());});
    page.on('requestfailed',request=>errors.push('failed: '+request.url()+' '+(request.failure()?.errorText??'')));
    const requested=[],settled=[];
    page.on('request',request=>requested.push(request.url()));
    page.on('response',response=>settled.push(response.status()+' '+response.url()));
    page.on('requestfinished',request=>{const i=requested.indexOf(request.url());if(i>=0)requested.splice(i,1);});
    page.on('requestfailed',request=>{const i=requested.indexOf(request.url());if(i>=0)requested.splice(i,1);});
    await page.goto('http://127.0.0.1:8765/IronPath/',{waitUntil:'load'});
    await page.evaluate(()=>document.getElementById('introOverlay').hidden=true);
    try{await page.locator('#menuSoldier').waitFor({state:'visible',timeout:45000});}
    catch(error){
     // A rejected dynamic import inside account-entry.mjs is caught there, so
     // Chromium reports nothing. Re-importing the same URL returns the SAME
     // rejected module, which is the only way to name the module that failed.
     const detail=await page.evaluate(async()=>{
      const probe=async url=>{try{await import(url);return 'ok';}catch(e){return String(e&&e.stack||e);}};
      const build=document.querySelector('meta[name="ironpath-build"]')?.content||'20261120-audio2';
      return {account:await probe(`./account.js?v=${build}`),
       sync:await probe('./avatar-sync.mjs?v=20261119-avatar3'),
       avatar:await probe('./avatar.mjs?v=20261119-avatar3'),
       layers:await probe('./avatar-layers.mjs?v=20261119-avatar3'),
       manifest:await probe('./assets/layers/manifest.mjs?v=20261119-avatar3')};
     }).catch(e=>'probe failed: '+e);
     console.error('Boot state',JSON.stringify(await diagnose(page),null,1),'pending:',requested,'errors:',errors,'modules:',JSON.stringify(detail,null,1),'last responses:',settled.slice(-20));
     throw error;
    }
    // 1. The account loads. A refused hand-over is not an error and must never
    //    push the soldier back to the connection screen.
    assert.equal(await page.locator('#connectionView').isVisible(),false,scenario+': a refused avatar write does not break the account');
    // 2. The hand-over is attempted exactly once, with the mirrored face.
    await page.waitForFunction(()=>window.__updates.some(([path,patch])=>path==='players/mock-user'&&Object.hasOwn(patch,'avatar')),null,{timeout:20000});
    const updates=await page.evaluate(()=>window.__updates);
    const writes=updates.filter(([path,patch])=>path==='players/mock-user'&&Object.hasOwn(patch,'avatar'));
    assert.equal(writes.length,1,scenario+': the face is handed over once per session, not on every profile tick');
    assert.equal(writes[0][1].avatar,MIRROR,scenario+': the face this device shows is handed over, not a default');
    assert.equal(updates.filter(([path,patch])=>path==='players/mock-user'&&Object.hasOwn(patch,'name')).length,0,
      scenario+': the hand-over never touches the soldier name');
    // 3. One attempt per session: a second profile tick must not write again.
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(()=>window.__updates.filter(([path,patch])=>path==='players/mock-user'&&Object.hasOwn(patch,'avatar')).length),1,
      scenario+': still exactly one attempt');
    // 4. The dossier shows the mirrored face either way - composed from the
    //    layers, not the gender's stand-in portrait. The composition is async,
    //    so the screen is opened until it has caught up; if it never does the
    //    loop ends and the assertion below says so.
    let src='';
    for(let attempt=0;attempt<8;attempt++){
     await page.locator('#menuSoldier').click();
     await page.locator('#soldierDialog').waitFor({state:'visible'});
     src=await page.locator('#soldierPortrait').getAttribute('src');
     if(String(src).startsWith('data:image/png'))break;
     await page.locator('#soldierClose').click();
     await page.waitForTimeout(500);
    }
    assert.match(src,/^data:image\/png;base64,/,scenario+': the soldier screen composes the layered face: '+String(src).slice(0,40));
    assert.doesNotMatch(src,/soldier-female\.jpg/,scenario+': not the gender placeholder');
    assert.deepEqual(errors,[],scenario+': no page errors');
    console.log(`${scenario}: avatar hand-over passed (${writes.length} write, portrait ${src.slice(0,22)}…)`);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
