// Real account/game UI and navigation with completely local Firebase doubles.
// This exercises client behavior, NOT live Firebase, server Rules or a deploy.
// Every external request is fulfilled here or aborted before it reaches a host.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const base='http://127.0.0.1:8765',html=readFileSync(join(__dirname,'..','index.html'),'utf8');
const accountEntry=readFileSync(join(__dirname,'..','account-entry.mjs'),'utf8');
const build=JSON.parse(readFileSync(join(__dirname,'..','release-version.json'),'utf8')).build;
const nextBuild='browser-next-1',open={format:1,mode:'open',authAfterMs:0};

const app=`export function initializeApp(){globalThis.__events.push('app');return {}}`;
const auth=`
 const config=globalThis.__testConfig;
 const makeUser=(uid,time)=>uid?{uid,getIdToken:async()=> 'synthetic',getIdTokenResult:async()=>({claims:{auth_time:time}})}:null;
 const auth={currentUser:makeUser(sessionStorage.getItem('__testSignedOut')?null:config.user,config.authTime)};let observer=null;
 export function getAuth(){globalThis.__events.push('auth');return auth;}
 export function onAuthStateChanged(a,cb){observer=cb;globalThis.__switchUser=(uid,time=config.authTime)=>{const next=makeUser(uid,time);a.currentUser=next;queueMicrotask(()=>cb(next));};setTimeout(()=>cb(a.currentUser),0);return ()=>{observer=null;};}
 export async function signOut(a){globalThis.__events.push('signout');sessionStorage.setItem('__testSignedOut','1');a.currentUser=null;observer?.(null);}
 export async function signInWithEmailAndPassword(a){sessionStorage.removeItem('__testSignedOut');a.currentUser=makeUser('alice',config.authTime);observer?.(a.currentUser);}
 export async function createUserWithEmailAndPassword(a){return signInWithEmailAndPassword(a);}
 export async function sendPasswordResetEmail(){}
`;
const database=`
 const profiles={alice:{name:'Alice',gender:'female',xp:750,enlisted:'2026-10-01'},bob:{name:'Bob',gender:'male',xp:750,enlisted:'2026-10-01'}};
 const listeners=new Set();
 const snap=value=>({val:()=>value,exists:()=>value!==null&&value!==undefined,forEach(){}});
 globalThis.__emitControl=value=>{globalThis.__mockControl=value;for(const listener of listeners)listener(snap(value));};
 globalThis.__holdStats=false;globalThis.__statsStarted=0;
 export function getDatabase(){return {};}
 export function goOffline(){globalThis.__events.push('offline');}
 export function ref(_db,path){return {path};}
 export function onValue(r,cb){
  if(r.path==='_ironpathMaintenance'){listeners.add(cb);queueMicrotask(()=>{if(listeners.has(cb))cb(snap(globalThis.__mockControl));});return ()=>listeners.delete(cb);}
  if(r.path?.startsWith('players/')){globalThis.__events.push('watch:'+r.path);let active=true;queueMicrotask(()=>{if(active)cb(snap(profiles[r.path.slice(8)]??null));});return ()=>{active=false;};}
  if(r.path==='.info/connected')queueMicrotask(()=>cb(snap(false)));
  return ()=>{};
 }
 export async function get(r){return snap(profiles[r.path?.slice(8)]??null);}
 export function runTransaction(r,mutate){
  const id=r.path?.startsWith('players/')?r.path.slice(8):null,current=id?structuredClone(profiles[id]??null):null;
  const next=mutate(current),committed=next!==undefined;
  if(committed&&id&&next?.endlessRuns>(current?.endlessRuns||0)&&globalThis.__holdStats){
   globalThis.__statsStarted++;return new Promise(resolve=>{globalThis.__settleStats=()=>{profiles[id]=next;resolve({committed:true,snapshot:snap(next)});};});
  }
  if(committed&&id)profiles[id]=next;
  return Promise.resolve({committed,snapshot:snap(committed?next:current)});
 }
 export async function set(){} export async function update(){} export async function remove(){}
 export function onDisconnect(){return {cancel:async()=>{},remove:async()=>{}};}
 export function serverTimestamp(){return Date.now();}
 export function query(r){return r;} export function orderByKey(){return {};} export function startAfter(){return {};}
 export function limitToFirst(){return {};} export function orderByChild(){return {};} export function limitToLast(){return {};}
`;

const partyLobby=`
 export function fourTeamRosters(m){return [m.playerIds,[]];}
 export function createFirebaseFourLobby(){
  const partyId='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',profiles={bob:{name:'Bob',gender:'male',level:3},alice:{name:'Alice',gender:'female',level:3}};
  const watch=(key,value)=>(_id,cb)=>{globalThis[key]=cb;if(value!==undefined)queueMicrotask(()=>cb(value));return ()=>{if(globalThis[key]===cb)globalThis[key]=null;};};
  return {async request(){return {partyId,inviteCode:'0123',hostId:'bob',uid:'alice'};},async reconnect(){return null;},async publishProfile(){},async cancel(){},async leave(){},async close(){},
   watchHost:watch('__partyHost','bob'),watchSlots:watch('__partySlots',{one:'alice'}),watchConfig:watch('__partyConfig',{mode:'coop',teams:[0,0,1,1]}),watchStarted:watch('__partyStarted',null),watchOwnRequest:watch('__partyRequest',{name:'Alice'}),
   watchProfile(_p,id,cb){queueMicrotask(()=>cb(profiles[id]));return ()=>{};}};
 }
`;
const partyGame=`export function createFirebasePartyGame(){globalThis.__partyGameCreated=true;throw Error('A cancelled party must not start');}`;

async function fixture(browser,{control=open,user='alice',authTime=300,served=build,published=build,party=false,sdkUnavailable=false,fakeClock=false,disableLocks=false,instrumentGame=false}={}){
 const state={control,served,published,party,sdkUnavailable,instrumentGame,sdkRequests:[],holdNextVersion:null,unexpected:[],errors:[],documentLoads:0};
 const context=await browser.newContext({bypassCSP:true,viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.addInitScript(({control,user,authTime,fakeClock,disableLocks})=>{
  globalThis.__testConfig={user,authTime};globalThis.__mockControl=control;globalThis.__events=[];
  if(fakeClock){let offset=0;const realNow=Date.now.bind(Date);Date.now=()=>realNow()+offset;globalThis.__advanceIdleClock=ms=>{offset+=ms;};}
  if(disableLocks)Object.defineProperty(navigator,'locks',{value:undefined,configurable:true});
  localStorage.setItem('ironpath:language','en');
  for(const id of ['alice','bob'])for(const key of ['ironpath:training:v2','ironpath:tutorial:v2','ironpath:coach:v2'])localStorage.setItem(`${key}:${id}`,'done');
 },{control,user,authTime,fakeClock,disableLocks});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url()),name=url.pathname.split('/').pop();
  if(url.hostname==='www.gstatic.com'){
   const body={'firebase-app.js':app,'firebase-auth.js':auth,'firebase-database.js':database}[name];
   if(body){state.sdkRequests.push(name);if(state.sdkUnavailable)return route.abort();return route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body});}
  }
  if(url.hostname==='iron-path-dc727-default-rtdb.europe-west1.firebasedatabase.app'&&url.pathname==='/_ironpathMaintenance.json'){
   if(state.control==='unavailable')return route.fulfill({status:503,headers:{'access-control-allow-origin':'*'},body:'offline'});
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','cache-control':'no-store'},body:JSON.stringify(state.control)});
  }
  if(url.origin!==base){state.unexpected.push(url.href);return route.abort();}
  if(state.party&&name==='firebase-four-lobby.mjs')return route.fulfill({contentType:'text/javascript',body:partyLobby});
  if(state.party&&name==='firebase-party-game.mjs')return route.fulfill({contentType:'text/javascript',body:partyGame});
  if(state.instrumentGame&&name==='account.js'){
   const source=readFileSync(join(__dirname,'..','account.js'),'utf8'),needle='gameControl=startGame(account,';
   assert.equal(source.split(needle).length,2,'test-only read access to the game control is unambiguous');
   return route.fulfill({contentType:'text/javascript',body:source.replace(needle,'globalThis.__testGameControl=gameControl=startGame(account,')});
  }
  if(name==='account-entry.mjs')return route.fulfill({status:200,contentType:'text/javascript',headers:{'cache-control':'no-store'},body:accountEntry.replaceAll(build,state.served)});
  if(url.pathname==='/IronPath/'||url.pathname==='/IronPath/index.html'){state.documentLoads++;return route.fulfill({status:200,contentType:'text/html',headers:{'cache-control':'no-store'},body:html.replaceAll(build,state.served)});}
  if(url.pathname==='/IronPath/release-version.json'){
   if(state.holdNextVersion){const hold=state.holdNextVersion;state.holdNextVersion=null;hold.requested();await hold.wait;}
   return route.fulfill({status:200,contentType:'application/json',headers:{'cache-control':'no-store'},body:JSON.stringify({format:1,build:state.published})});
  }
  return route.continue();
 });
 const page=await context.newPage();page.setDefaultTimeout(15000);
 page.on('pageerror',error=>state.errors.push(error.stack||String(error)));
 await page.goto(base+'/IronPath/',{waitUntil:'domcontentloaded'});
 return {state,context,page,async close(){await context.close();assert.deepEqual(state.unexpected,[],'no unmocked external requests');assert.deepEqual(state.errors,[],'no uncaught browser errors');}};
}
const unmask=page=>page.evaluate(()=>{document.getElementById('introOverlay').hidden=true;});
async function waitForMenu(page){await page.locator('#menuMultiplayer').waitFor({state:'visible'});await unmask(page);}
async function prepareEndless(page){
 await page.locator('#menuEndless').click();await page.locator('#endlessLaunch').waitFor({state:'visible'});
 await page.locator('#endlessDeploy').click();await page.locator('#gameWorkspace').waitFor({state:'visible'});
 // The field is displayed before its asynchronous version check completes.
 // Wait for the actual deployment, not just for the workspace to become visible.
 await page.waitForFunction(()=>document.getElementById('message').textContent.includes('Free play ready.'));
}
async function startEndless(page){
 await prepareEndless(page);await page.locator('#start').click();await page.waitForFunction(()=>document.getElementById('start').textContent.includes('WAVE IN PROGRESS'));
}
async function visiblePad(page,index=null){
 await page.locator('#game').scrollIntoViewIfNeeded();
 return page.evaluate(async index=>{
  const {getMap}=await import('./maps.mjs'),id=__testGameControl.getMapId(),map=getMap(id),r=document.getElementById('game').getBoundingClientRect();
  const points=map.pads.map((p,i)=>({index:i,x:r.left+p.x*r.width/960,y:r.top+p.y*r.height/540}));
  const visible=points.filter(p=>p.x>0&&p.x<innerWidth&&p.y>0&&p.y<innerHeight&&document.elementFromPoint(p.x,p.y)?.id==='game');
  if(index!==null)return visible.find(p=>p.index===index)||null;
  return visible.sort((a,b)=>Math.abs(a.x-innerWidth/2)+Math.abs(a.y-innerHeight/2)-Math.abs(b.x-innerWidth/2)-Math.abs(b.y-innerHeight/2))[0]||null;
 },index);
}
async function triggerVersion(page){await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));}
async function advanceAfk(page,ms){await page.evaluate(value=>{__advanceIdleClock(value);document.dispatchEvent(new Event('visibilitychange'));},ms);}
const waitForNewBuild=page=>page.waitForFunction(expected=>document.querySelector('meta[name="ironpath-build"]')?.content===expected,nextBuild,{timeout:15000});

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:process.env.CHROMIUM_PATH?['--no-sandbox']:[]});
 try{
  {
   const f=await fixture(browser,{control:{...open,mode:'maintenance'}});const {page,state}=f;
   try{
    await page.locator('#maintenanceGate').waitFor({state:'visible'});assert.match(await page.locator('#maintenanceTitle').innerText(),/Maintenance/);
    for(const [width,height] of [[320,568],[390,844],[1440,900]]){
     await page.setViewportSize({width,height});
     const layout=await page.evaluate(()=>{const box=document.querySelector('.maintenance-card').getBoundingClientRect(),image=document.querySelector('.maintenance-brand');return {left:box.left,right:box.right,scroll:document.getElementById('maintenanceGate').scrollWidth,logo:image.complete&&image.naturalWidth>0};});
     assert.ok(layout.left>=-1&&layout.right<=width+1&&layout.scroll<=width+1,`maintenance fits ${width}px: ${JSON.stringify(layout)}`);assert.equal(layout.logo,true);
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator('#maintenanceLanguage').click();assert.match(await page.locator('#maintenanceTitle').innerText(),/Wartung/);
    await page.locator('#maintenanceLanguage').click();assert.match(await page.locator('#maintenanceTitle').innerText(),/Maintenance/);
    assert.deepEqual(state.sdkRequests,[],'maintenance UI does not depend on fetching Firebase SDK files');
    assert.deepEqual(await page.evaluate(()=>__events),[],'maintenance blocks Firebase initialization');
    await page.keyboard.press('Escape');assert.equal(await page.locator('#maintenanceGate').evaluate(el=>el.open),true,'escape cannot dismiss the gate');
    state.control=open;await page.evaluate(()=>{globalThis.__mockControl={format:1,mode:'open',authAfterMs:0};});
    await page.locator('#maintenanceRetry').click();await waitForMenu(page);
    assert.deepEqual((await page.evaluate(()=>__events)).slice(0,2),['app','auth']);
    console.log('maintenance at boot: blocks Auth, remains modal and recovers on a fresh check');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser,{control:'unavailable'});const {page,state}=f;
   try{
    await page.locator('#maintenanceGate').waitFor({state:'visible'});assert.match(await page.locator('#maintenanceDetail').innerText(),/could not be checked/);
    assert.deepEqual(await page.evaluate(()=>__events),[]);state.control=open;await page.evaluate(()=>{globalThis.__mockControl={format:1,mode:'open',authAfterMs:0};});
    await page.locator('#maintenanceRetry').click();await waitForMenu(page);
    console.log('unavailable maintenance signal: fails closed and retries');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser,{control:{...open,mode:'maintenance'},sdkUnavailable:true});const {page,state}=f;
   try{
    await page.locator('#maintenanceGate').waitFor({state:'visible'});assert.match(await page.locator('#maintenanceTitle').innerText(),/Maintenance/);
    assert.deepEqual(state.sdkRequests,[],'SDK CDN is not needed to show maintenance');
    state.control=open;await page.locator('#maintenanceRetry').click();
    await page.waitForFunction(()=>document.getElementById('maintenanceTitle').textContent.includes('Game connection unavailable'));
    assert.ok(state.sdkRequests.length>0,'the game module was attempted only after maintenance opened');
    assert.equal(await page.locator('#maintenanceExtra').isHidden(),true);assert.match(await page.locator('#maintenanceRetry').innerText(),/RELOAD/);
    assert.deepEqual(await page.evaluate(()=>__events),[],'a failed SDK load cannot initialize Auth');
    console.log('maintenance and SDK outage: status renders independently and failed imports remain blocked');
   }finally{await f.close();}
  }
  {
   const cutoff={...open,authAfterMs:200000};
   const old=await fixture(browser,{control:cutoff,authTime:199});
   try{
    await old.page.locator('#maintenanceGate').waitFor({state:'visible'});assert.match(await old.page.locator('#maintenanceTitle').innerText(),/Session ended/);
    const events=await old.page.evaluate(()=>__events);assert.ok(events.includes('offline')&&events.includes('signout'));assert.ok(!events.some(e=>e.startsWith('watch:players/')),'old token never loads a profile');
   }finally{await old.close();}
   const fresh=await fixture(browser,{control:cutoff,authTime:201});
   try{await waitForMenu(fresh.page);assert.ok((await fresh.page.evaluate(()=>__events)).includes('watch:players/alice'));}
   finally{await fresh.close();}
   console.log('cutoff: stale session signs out before profile; freshly authenticated session loads');
  }
  {
   const f=await fixture(browser);const {page}=f;
   try{
    await waitForMenu(page);await startEndless(page);
    await page.locator('#fieldOps > summary').click();await page.locator('#fieldSettings').click();assert.equal(await page.locator('#settingsDialog').evaluate(el=>el.open),true);
    await page.evaluate(()=>__emitControl({format:1,mode:'maintenance',authAfterMs:0}));
    await page.locator('#maintenanceGate').waitFor({state:'visible'});
    assert.equal(await page.locator('#gameView').isHidden(),true);assert.equal(await page.locator('#settingsDialog').evaluate(el=>el.open),false);
    assert.match(await page.locator('#maintenanceExtra').innerText(),/not confirmed/);
    const events=await page.evaluate(()=>__events);assert.ok(events.indexOf('offline')>=0&&events.indexOf('offline')<events.indexOf('signout'));
    console.log('live maintenance: stops an active game, closes dialogs and goes offline before sign-out');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser);const {page,state}=f;
   try{
    await waitForMenu(page);await page.locator('#menuEndless').click();await page.locator('#endlessLaunch').waitFor({state:'visible'});
    let release,requested;const wait=new Promise(resolve=>{release=resolve;}),asked=new Promise(resolve=>{requested=resolve;});
    state.holdNextVersion={wait,requested};await page.locator('#endlessDeploy').click();await asked;
    assert.equal(await page.locator('#gameWorkspace').evaluate(el=>el.inert),true,'field input waits for the version check');
    assert.equal(await page.locator('#deploymentCheck').isVisible(),true);
    const box=await page.locator('#start').boundingBox();assert.ok(box);await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
    assert.match(await page.locator('#start').textContent(),/DEPLOY \/ START WAVE/,'a fast extra tap cannot start the unprepared field');
    release();await page.locator('#deploymentCheck').waitFor({state:'hidden'});
    await page.waitForFunction(()=>document.getElementById('message').textContent.includes('Free play ready.'));
    assert.equal(await page.locator('#gameWorkspace').evaluate(el=>el.inert),false);
    await page.locator('#start').click();await page.waitForFunction(()=>document.getElementById('start').textContent.includes('WAVE IN PROGRESS'));
    console.log('new deployment: field input waits for its asynchronous version check');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser,{instrumentGame:true});const {page,state}=f;
   try{
    await waitForMenu(page);await prepareEndless(page);
    assert.match(await page.locator('#start').innerText(),/DEPLOY \/ START WAVE/);
    const pad=await visiblePad(page);assert.ok(pad,'a real empty pad is visible on the field');
    await page.mouse.click(pad.x,pad.y);
    await page.waitForFunction(()=>!document.getElementById('radialMenu').hidden&&document.getElementById('radialMenu').dataset.mode==='build');
    await page.locator('.sheet-option').first().click();await page.locator('#towerDetails').waitFor({state:'visible'});await page.locator('#towerDetailsConfirm').click();
    await page.waitForFunction(()=>/built\. Tap it to upgrade or sell\./.test(document.getElementById('message').textContent));
    state.published=nextBuild;state.served=nextBuild;await triggerVersion(page);
    await page.waitForFunction(()=>document.getElementById('versionNoticeText').textContent.includes('Finish your current operation'));
    await page.waitForTimeout(1300);
    assert.equal(await page.locator('meta[name="ironpath-build"]').getAttribute('content'),build,'a deployed field is already an operation, even before the first wave');
    await page.locator('#fieldOps > summary').click();
    assert.equal(await page.locator('#versionNotice').isVisible(),false,'the update notice does not cover the open field menu');
    await page.locator('#fieldBack').click();
    await page.locator('#menuResume').waitFor({state:'visible'});await page.locator('#menuResume').click();
    const samePad=await visiblePad(page,pad.index);assert.ok(samePad,'the built tower remains on the same field');await page.mouse.click(samePad.x,samePad.y);
    await page.waitForFunction(()=>!document.getElementById('radialMenu').hidden&&document.getElementById('radialMenu').dataset.mode==='actions');
    await page.locator('#radialClose').click();await page.locator('#start').click();
    await page.waitForFunction(()=>document.getElementById('start').textContent.includes('WAVE IN PROGRESS'));
    assert.equal(await page.locator('meta[name="ironpath-build"]').getAttribute('content'),build,'the player can start the first wave of the existing operation');
    await page.locator('#endRun').click();await page.locator('#gameConfirmAccept').click();
    await page.locator('#runResults[open]').waitFor();await page.locator('#resultsDone').click();await waitForNewBuild(page);
    console.log('ordinary update: preserves and resumes a built tower before the first wave');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser);const {page,state}=f;
   try{
    await waitForMenu(page);await startEndless(page);await page.evaluate(()=>{globalThis.__holdStats=true;});
    state.published=nextBuild;state.served=nextBuild;await triggerVersion(page);
    await page.waitForFunction(()=>document.getElementById('versionNoticeText').textContent.includes('Finish your current operation'));
    assert.equal(await page.locator('#game').isVisible(),true,'ordinary updates do not end a live game');
    await page.locator('#endRun').click();await page.locator('#gameConfirmAccept').click();
    await page.waitForFunction(()=>globalThis.__statsStarted===1);await page.locator('#runResults[open]').waitFor();
    await page.waitForFunction(()=>document.getElementById('resultsVersionStatus').textContent.includes('Waiting for saves'));
    await page.locator('#resultsDone').click();await page.waitForTimeout(1300);
    assert.equal(await page.locator('meta[name="ironpath-build"]').getAttribute('content'),build,'an unresolved statistics write blocks reload');
    await page.evaluate(()=>__settleStats());await waitForNewBuild(page);await waitForMenu(page);
    assert.match(await page.locator('#versionNoticeText').innerText(),/New version browser-next-1 loaded/);
    await page.goto(base+'/IronPath/version.html');await page.locator('#r1.ok').waitFor();await page.locator('#r2.ok').waitFor();
    assert.match(await page.locator('#r1d').innerText(),/Einstieg: browser-next-1/);
    console.log('ordinary update: waits for match, report and actual statistics acknowledgement before reload');
    console.log('version diagnostic: delivered manifest, page, bootstrap and styles agree');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser);const {page,state}=f;
   try{
    await waitForMenu(page);await page.locator('#menuSoldier').click();assert.equal(await page.locator('#soldierDialog').evaluate(el=>el.open),true);
    state.published=nextBuild;state.served=nextBuild;await triggerVersion(page);
    await page.waitForFunction(()=>document.getElementById('versionNoticeText').textContent.includes('Close the open report or dialog'));
    await page.waitForTimeout(1200);assert.equal(await page.locator('meta[name="ironpath-build"]').getAttribute('content'),build);
    await page.locator('#soldierClose').click();await waitForNewBuild(page);
    console.log('ordinary update: waits for an open dialog');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser,{user:null});const {page,state}=f;
   try{
    await page.locator('#authView').waitFor({state:'visible'});await unmask(page);await page.locator('#email').fill('soldier@example.test');
    state.published=nextBuild;state.served=nextBuild;await triggerVersion(page);
    await page.waitForFunction(()=>document.getElementById('versionNoticeText').textContent.includes('sign-in or soldier form'));
    await page.waitForTimeout(1200);assert.equal(await page.locator('#email').inputValue(),'soldier@example.test');
    await page.locator('#email').fill('');await waitForNewBuild(page);
    console.log('ordinary update: preserves a partially completed sign-in form');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser);const {page,state}=f;
   try{
    await waitForMenu(page);
    let release,requested;const wait=new Promise(resolve=>{release=resolve;}),asked=new Promise(resolve=>{requested=resolve;});
    state.holdNextVersion={wait,requested};await page.locator('#menuEndless').click();await page.locator('#endlessDeploy').click();await asked;
    await page.evaluate(()=>__switchUser('bob'));await page.waitForFunction(()=>document.getElementById('menuName').textContent==='Bob');
    assert.equal(await page.locator('#gameWorkspace').evaluate(el=>el.inert),false,'the new session is not locked by the old check');
    await prepareEndless(page);release();await page.waitForTimeout(300);
    assert.equal(await page.locator('#gameWorkspace').isVisible(),true,'Alice’s late check cannot hide Bob’s already deployed run');
    console.log('account switch: a late version check cannot deploy or hide another user’s run');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser);const {page,state}=f;
   try{
    await waitForMenu(page);
    let release,requested;const wait=new Promise(resolve=>{release=resolve;}),asked=new Promise(resolve=>{requested=resolve;});
    state.holdNextVersion={wait,requested};await page.locator('#menuEndless').click();await page.locator('#endlessDeploy').click();await asked;
    await page.evaluate(()=>__switchUser(null));await page.locator('#authView').waitFor({state:'visible'});
    await page.evaluate(()=>__switchUser('alice'));await waitForMenu(page);
    release();await page.waitForTimeout(300);
    assert.equal(await page.locator('#gameWorkspace').isHidden(),true,'the old session cannot deploy after the same UID signs back in');
    console.log('same-UID reauthentication: a pending deployment belongs to the old session');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser);const {page}=f;
   try{
    await waitForMenu(page);await page.evaluate(()=>localStorage.removeItem('ironpath:training:v2:alice'));
    await page.locator('#tutorialReplay').evaluate(button=>button.click());await page.locator('#tutorialDialog[open]').waitFor();
    for(let i=0;i<11;i++){
     for(const selector of ['#skillDialog','#armoryDialog'])if(await page.locator(selector).evaluate(el=>el.open))await page.locator(selector).evaluate(el=>el.close());
     const skip=page.locator('#tutorialPracticeSkip');if(await skip.isVisible())await skip.click();
     if(i===10)await page.evaluate(()=>{document.getElementById('tutorialNext').click();__switchUser('bob');});
     else await page.locator('#tutorialNext').click();
    }
    await page.waitForFunction(()=>document.getElementById('menuName').textContent==='Bob');await page.waitForTimeout(700);
    assert.equal(await page.locator('#gameWorkspace').isHidden(),true,'the old tour cannot start a new user’s training');
    assert.equal(await page.evaluate(()=>localStorage.getItem('ironpath:training:v2:alice')),null,'the aborted handoff is not marked completed');
    console.log('training handoff: a delayed tour completion cannot start on a different account');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser,{party:true});const {page,state}=f;
   try{
    await waitForMenu(page);await page.locator('#menuMultiplayer').click();await page.locator('#fourPartyCodeInput').fill('0123');await page.locator('#fourPartyJoin').click();
    await page.waitForFunction(()=>typeof globalThis.__partyStarted==='function'&&typeof globalThis.__partyHost==='function');
    let release,requested;const wait=new Promise(resolve=>{release=resolve;}),asked=new Promise(resolve=>{requested=resolve;});state.holdNextVersion={wait,requested};
    await page.evaluate(()=>__partyStarted({hostId:'bob',playerIds:['bob','alice'],mode:'coop',teams:[0,0,1,1]}));await asked;
    await page.evaluate(()=>__partyHost(null));await page.locator('#fourPartyEntry').waitFor({state:'visible'});release();await page.waitForTimeout(300);
    assert.equal(await page.evaluate(()=>!!globalThis.__partyGameCreated),false,'closing the party invalidates its pending handoff');
    console.log('party handoff: host closure invalidates an in-flight guest version check');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser,{fakeClock:true});const {page,state}=f;
   try{
    await waitForMenu(page);await advanceAfk(page,29*60_000);await page.waitForTimeout(150);
    assert.equal(await page.locator('#commandCenter').isVisible(),true,'29 minutes does not sign out');
    await advanceAfk(page,61_000);await page.locator('#authView').waitFor({state:'visible'});
    assert.ok((await page.evaluate(()=>__events)).includes('signout'));
    assert.match(await page.locator('#entryMessage').innerText(),/30 minutes of inactivity/);
    assert.equal(state.documentLoads,1,'the current build is not reloaded after AFK sign-out');
    console.log('AFK: signs out after 30 idle minutes, checks the version and does not reload the current build');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser,{fakeClock:true});const {page,state}=f;
   try{
    await waitForMenu(page);state.published=nextBuild;state.served=nextBuild;
    await advanceAfk(page,31*60_000);await waitForNewBuild(page);await page.locator('#authView').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('__testSignedOut')),'1');
    assert.match(await page.locator('#entryMessage').innerText(),/30 minutes of inactivity/);
    assert.equal(state.documentLoads,2,'a newer version loads exactly once after sign-out');
    console.log('AFK: a newer build reloads after sign-out and leaves the player at login');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser,{fakeClock:true});const {page}=f;
   try{
    await waitForMenu(page);await startEndless(page);await advanceAfk(page,31*60_000);await page.waitForTimeout(250);
    assert.equal((await page.evaluate(()=>__events)).includes('signout'),false,'an active mission is not abandoned');
    await page.locator('#endRun').click();await page.locator('#gameConfirmAccept').click();
    await page.locator('#runResults[open]').waitFor();await page.locator('#resultsDone').click();await waitForMenu(page);
    await advanceAfk(page,29*60_000);await page.waitForTimeout(150);assert.equal(await page.locator('#commandCenter').isVisible(),true);
    await advanceAfk(page,61_000);await page.locator('#authView').waitFor({state:'visible'});
    console.log('AFK: a long operation survives and a new idle period begins after the report');
   }finally{await f.close();}
  }
  {
   const f=await fixture(browser,{fakeClock:true});const {page,context}=f;let second;
   try{
    await waitForMenu(page);second=await context.newPage();second.setDefaultTimeout(15000);
    await second.goto(base+'/IronPath/',{waitUntil:'domcontentloaded'});await waitForMenu(second);await startEndless(second);
    await advanceAfk(page,31*60_000);await page.waitForTimeout(500);
    assert.equal((await page.evaluate(()=>__events)).includes('signout'),false,'a second participating tab holds the shared session');
    assert.equal(await second.locator('#gameWorkspace').isVisible(),true,'the other tab keeps its active game');
    await second.close();second=null;await advanceAfk(page,1000);await page.locator('#authView').waitFor({state:'visible'});
    console.log('AFK: an active cooperating tab blocks shared Firebase logout until it closes');
   }finally{await second?.close();await f.close();}
  }
  {
   const f=await fixture(browser,{fakeClock:true,disableLocks:true});const {page}=f;
   try{
    await waitForMenu(page);await advanceAfk(page,31*60_000);await page.waitForTimeout(350);
    assert.equal((await page.evaluate(()=>__events)).includes('signout'),false,'missing Web Locks disables AFK sign-out');
    assert.equal(await page.locator('#commandCenter').isVisible(),true);
    console.log('AFK: browsers without Web Locks do not risk signing out another tab');
   }finally{await f.close();}
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
