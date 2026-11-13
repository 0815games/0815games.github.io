// Exercise the real account -> game handoff and browser layout. The lobby and
// transport are replaced only in this test route; no live Firebase calls occur.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');

const mocks={
 'firebase-app.js':`export function initializeApp(){return {}}`,
 'firebase-auth.js':`const user={uid:'mock-user',getIdToken:async()=> 'mock'},auth={currentUser:user};export function getAuth(){return auth}export function onAuthStateChanged(a,cb){setTimeout(()=>cb(user),0);return ()=>{}}export async function signOut(a){a.currentUser=null}export async function signInWithEmailAndPassword(){}export async function createUserWithEmailAndPassword(){}export async function sendPasswordResetEmail(){}`,
 'firebase-database.js':`const profile={name:'Test Soldier',gender:'female',xp:750};export function getDatabase(){return {}}export function ref(db,path){return {path}}export function onValue(r,cb){if(r.path==='players/mock-user')queueMicrotask(()=>cb({val:()=>profile}));return ()=>{}}export async function runTransaction(){return {committed:false,snapshot:{val:()=>null,exists:()=>false}}}export async function get(r){return {val:()=>r.path==='players/mock-user'?profile:null,exists:()=>r.path==='players/mock-user',forEach(){}}}export async function remove(){}export async function set(){}export async function update(){}export function onDisconnect(){return {cancel:async()=>{},remove:async()=>{}}}export function serverTimestamp(){return Date.now()}export function query(r){return r}export function orderByKey(){return {}}export function startAfter(){return {}}export function limitToFirst(){return {}}export function orderByChild(){return {}}export function limitToLast(){return {}}`,
};
const panel=`export function createFourPlayerPanel({document,onMatch}){
 let active=false;const root=document.getElementById('fourPartyPanel');
 globalThis.__testParty=mode=>{active=true;return onMatch({partyId:'0123456789abcdef0123456789abcdef',hostId:'mock-user',playerIds:['mock-user','bob'],profiles:[{name:'Test Soldier',gender:'female',level:3},{name:'Bob',gender:'male',level:3}],mode,teamRosters:[['mock-user','bob'],[]]});};
 return {show(){root.hidden=false},hide(){root.hidden=true},isActive:()=>active,hostInvite:()=>null,joinInvite:async()=>false,leaveParty:async()=>{active=false;return true},leaveForLogout:async()=>{active=false}};
}`;
const partyGame=`import {createMatch} from './simulation.mjs';import {applyCommand} from './match.mjs';import {createVersus,versusView,applyVersus} from './versus.mjs';
 export function createFirebasePartyGame({players,mapId,mode,hostId,onSnapshot,onStatus}){
  globalThis.__selected={mapId,players:structuredClone(players),mode};const match=mode==='versus'?createVersus(players,mapId,hostId):createMatch(players,mapId);if(mode==='coop')match.hostId=hostId;
  if(mode==='versus')globalThis.__laneStarts=Object.entries(match.lanes).map(([id,lane])=>({x:lane.players[id].x,y:lane.players[id].y}));
  const view=()=>mode==='versus'?versusView(match,hostId):match;
  return {start(){onSnapshot({match:structuredClone(view())});onStatus(true)},stop(){},async command(c){const r=mode==='versus'?applyVersus(match,hostId,c):applyCommand(match,hostId,c);onSnapshot({match:structuredClone(view())});return r}};
 }`;

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
 try{
  for(const mode of ['coop','versus']){
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
   try{
    await context.addInitScript(()=>{localStorage.setItem('ironpath:language','en');localStorage.setItem('ironpath:training:v2:mock-user','done');localStorage.setItem('ironpath:tutorial:v2:mock-user','done');localStorage.setItem('ironpath:coach:v2:mock-user','done');});
    await context.route('**/*',route=>{
     const url=new URL(route.request().url()),file=url.pathname.split('/').pop();
     if(url.hostname==='www.gstatic.com'&&mocks[file])return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:mocks[file]});
     if(url.hostname!=='127.0.0.1')return route.abort();
     if(file==='firebase-four-panel.mjs')return route.fulfill({contentType:'text/javascript',body:panel});
     if(file==='firebase-party-game.mjs')return route.fulfill({contentType:'text/javascript',body:partyGame});
     return route.continue();
    });
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:8765/IronPath/',{waitUntil:'load'});
    await page.evaluate(()=>document.getElementById('introOverlay').hidden=true);
    await page.locator('#menuMultiplayer').waitFor({state:'visible'});
    await page.locator('#menuMultiplayer').click();await page.locator('#fourPartyPanel').waitFor({state:'visible'});
    assert.equal(await page.evaluate(mode=>window.__testParty(mode),mode),true,'account accepts the lobby handoff');
    await page.waitForFunction(()=>document.getElementById('game').dataset.fullBattle==='true');
    const selected=await page.evaluate(async()=>{const {getMap}=await import('./maps.mjs'),{bunkerStart}=await import('./solo-deployment.mjs');const s=window.__selected,m=getMap(s.mapId);return {mapId:s.mapId,mode:s.mode,width:m.width,height:m.height,pads:m.pads.length,players:s.players.map(p=>({x:p.x,y:p.y})),spawns:s.players.map((_,i)=>bunkerStart(s.mapId,i)),laneStarts:window.__laneStarts};});
    assert.equal(selected.mode,mode);
    assert.match(selected.mapId,/^g3-1[0-9a-f]{8}$/,`real account passes ${mode} to the large-map selector`);
    assert.equal(selected.width,1320);assert.equal(selected.height,720);assert.ok(selected.pads>=14);
    assert.deepEqual(selected.players,selected.spawns,'both roster players are created at the selected map bunker');
    if(mode==='versus')assert.deepEqual(selected.laneStarts,[selected.spawns[0],selected.spawns[0]],'both duelists start at the same bunker-relative point');
    assert.deepEqual(errors,[]);console.log(`${mode}: real account handoff selected ${selected.mapId} and opened the full field`);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
