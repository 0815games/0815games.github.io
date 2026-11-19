// Real Chromium verification of Block 2 legacy name backfill & conflict-only
// rename modal (`#nameConflictDialog`) against synthetic Auth/RTDB doubles.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const build=JSON.parse(readFileSync(require('node:path').join(__dirname,'../release-version.json'),'utf8')).build;

const alexKey='616c6578';
const mocks={
 'firebase-app.js':`export function initializeApp(){return {}}`,
 'firebase-auth.js':`
  const alice={uid:'mock-user',getIdToken:async()=>'fake'},auth={currentUser:alice},listeners=new Set();
  const notify=()=>{for(const cb of listeners)cb(auth.currentUser)};
  globalThis.__fakeAuth={auth};
  export function getAuth(){return auth}
  export function onAuthStateChanged(_a,cb){listeners.add(cb);queueMicrotask(()=>cb(auth.currentUser));return()=>listeners.delete(cb)}
  export async function signOut(a){globalThis.__signOutCalls=(globalThis.__signOutCalls||0)+1;a.currentUser=null;notify()}
  export async function signInWithEmailAndPassword(){}
  export async function createUserWithEmailAndPassword(){}
  export async function sendPasswordResetEmail(){}
 `,
 'firebase-database.js':`
  const scenario=globalThis.__block2Scenario||'conflict';
  const values=new Map([
   ['_ironpathMaintenance',{format:1,mode:'open',authAfterMs:0}],
   ['players/mock-user',scenario==='free'?{name:'Charlie',gender:'male',xp:750}:{name:'Alex',gender:'female',xp:750,armory:'1;2'}],
   ['players/other-user',{name:'Alex',gender:'male',xp:100}],
   ...(scenario==='conflict'?[['characterNames/${alexKey}',{uid:'other-user',name:'Alex',at:Date.now()}]]:[]),
  ]);
  const listeners=new Map();
  const getAt=(path)=>{
   if(values.has(path))return values.get(path);
   const parts=path.split('/'),last=parts.pop(),parent=parts.join('/');
   if(values.has(parent)&&values.get(parent)&&typeof values.get(parent)==='object')return values.get(parent)[last]??null;
   return null;
  };
  const setAt=(path,val)=>{
   if(values.has(path)||path.split('/').length<=2){values.set(path,val);return;}
   const parts=path.split('/'),last=parts.pop(),parent=parts.join('/');
   if(values.has(parent)&&values.get(parent)&&typeof values.get(parent)==='object'){values.get(parent)[last]=val;return;}
   values.set(path,val);
  };
  const clone=v=>v==null?null:JSON.parse(JSON.stringify(v));
  const snap=path=>{const v=getAt(path);return {val:()=>clone(v),exists:()=>v!=null,forEach(){}};};
  globalThis.__dbValues=values;
  export function getDatabase(){return {}}
  export function goOffline(){}
  export function ref(_db,path){return {path:path||''}}
  export function onValue(r,cb){
   const list=listeners.get(r.path)||new Set();list.add(cb);listeners.set(r.path,list);
   queueMicrotask(()=>{if(list.has(cb))cb(snap(r.path))});
   return ()=>list.delete(cb);
  }
  export async function get(r){return snap(r.path)}
  export async function set(r,v){setAt(r.path,v)}
  export async function remove(r){values.delete(r.path)}
  export async function update(_r,patch){for(const [p,v] of Object.entries(patch))if(v===null)values.delete(p);else setAt(p,v)}
  export async function runTransaction(r,reducer){
   const cur=clone(getAt(r.path));
   const next=reducer(cur);
   if(next===undefined)return {committed:false,snapshot:snap(r.path)};
   if(r.path.startsWith('characterNames/')&&cur&&cur.uid!=='mock-user'){
    throw Object.assign(Error('permission_denied'),{code:'permission_denied'});
   }
   setAt(r.path,next);
   return {committed:true,snapshot:snap(r.path)};
  }
  export function onDisconnect(){return {cancel:async()=>{},remove:async()=>{}}}
  export function serverTimestamp(){return Date.now()}
  export function query(r){return r}export function orderByKey(){return {}}export function startAfter(){return {}}export function limitToFirst(){return {}}export function orderByChild(){return {}}export function limitToLast(){return {}}
 `,
};
const friends=`export function setupFriends(){return {start(){},reset(){},open(){},signOut:async()=>{},prepareForDeletion:async()=>{},hasPending:()=>false}}`;
const panel=`export function createFourPlayerPanel(){return {show(){},hide(){},isActive:()=>false,isBusy:()=>false,hostInvite:()=>null,joinInvite:async()=>false,leaveParty:async()=>true,leaveForLogout:async()=>{}}}`;

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
 try{
  for(const scenario of ['free','conflict']){
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   try{
    await context.addInitScript(scenario=>{
     window.__block2Scenario=scenario;
     localStorage.setItem('ironpath:language','de');
     for(const prefix of ['training','tutorial','coach'])localStorage.setItem(`ironpath:${prefix}:v2:mock-user`,'done');
    },scenario);
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url()),file=url.pathname.split('/').pop();
     if(url.hostname==='iron-path-dc727-default-rtdb.europe-west1.firebasedatabase.app'&&url.pathname==='/_ironpathMaintenance.json'){
      return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({format:1,mode:'open',authAfterMs:0})});
     }
     if(url.hostname==='www.gstatic.com'&&mocks[file])return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:mocks[file]});
     if(url.hostname!=='127.0.0.1')return route.abort();
     if(file==='friends-ui.mjs')return route.fulfill({contentType:'text/javascript',body:friends});
     if(file==='firebase-four-panel.mjs')return route.fulfill({contentType:'text/javascript',body:panel});
     return route.continue();
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',err=>errors.push(String(err)));
    page.on('console',ev=>{if(ev.type()==='error')errors.push('console: '+ev.text());});
    await page.goto('http://127.0.0.1:8765/IronPath/',{waitUntil:'load'});
    await page.evaluate(()=>document.getElementById('introOverlay').hidden=true);
    await page.locator('#menuName').waitFor({state:'visible',timeout:20000});

    if(scenario==='free'){
     await page.waitForFunction(()=>window.__dbValues.has('characterNames/636861726c6965'),null,{timeout:5000});
     assert.equal(await page.evaluate(()=>document.getElementById('nameConflictDialog').open),false,'free name never shows conflict dialog');
     assert.equal(await page.locator('#menuName').textContent(),'Charlie');
    }else{
     await page.locator('#nameConflictDialog[open]').waitFor({state:'visible',timeout:10000});
     assert.equal(await page.locator('#nameConflictCurrentName').textContent(),'Alex');
     assert.equal(await page.locator('#nameConflictTitle').textContent(),'Soldatenname bereits vergeben');
     // Escape cannot dismiss the conflict modal.
     await page.keyboard.press('Escape');
     assert.equal(await page.evaluate(()=>document.getElementById('nameConflictDialog').open),true,'Escape cannot close conflict dialog');
     // Submitting a casefold/sharp-s equivalent variant of a taken name or same duplicate is rejected.
     await page.locator('#nameConflictInput').fill('ALEX');
     await page.locator('#nameConflictSubmit').click();
     await page.waitForFunction(()=>/anderen Namen/i.test(document.getElementById('nameConflictStatus').textContent||''),null,{timeout:5000});
     // Submitting a unique new name renames cleanly and leaves XP/armory intact.
     await page.locator('#nameConflictInput').fill('AlexTwo');
     await page.locator('#nameConflictSubmit').click();
     await page.waitForFunction(()=>!document.getElementById('nameConflictDialog').open,null,{timeout:5000});
     assert.equal(await page.locator('#menuName').textContent(),'AlexTwo');
     assert.equal(await page.evaluate(()=>window.__dbValues.get('players/mock-user').xp),750);
     assert.equal(await page.evaluate(()=>window.__dbValues.get('players/mock-user').armory),'1;2');
     assert.equal(await page.evaluate(k=>window.__dbValues.get(`characterNames/${k}`).uid,alexKey),'other-user');
    }
    assert.deepEqual(errors,[],`${scenario}: no page errors`);
    console.log(`${scenario}: Block 2 backfill & conflict resolution UI verified in Chromium (build ${build})`);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
