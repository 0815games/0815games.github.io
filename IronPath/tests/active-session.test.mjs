import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {
 ACTIVE_SESSIONS_PATH,
 CLIENT_ID_PATTERN,
 CLIENT_SESSION_STORAGE_KEY,
 createActiveSessionManager,
 getOrCreateClientSessionId
} from '../active-session.mjs';
import {applyBlock9dSessionRules,buildBlock9dSessionCandidate} from '../firebase/block9d-session-candidate.mjs';

function makeMemoryStorage(initial={}){
 const map=new Map(Object.entries(initial));
 return {
  getItem:key=>map.has(key)?map.get(key):null,
  setItem:(key,val)=>{map.set(key,String(val));},
  dump:()=>Object.fromEntries(map)
 };
}

function createFakeRtdb({initial=null,serverNow=1_000_000,serverOffset=0,permissionMode='open'}={}){
 let currentNow=serverNow;
 let currentValue=initial?structuredClone(initial):null;
 const sessionListeners=new Set();
 const offsetListeners=new Set();
 const connectedListeners=new Set();
 const disconnects=[];
 let transactionCalls=0;
 let stubWithoutReducer=false;
 const emitSession=()=>{
  const val=currentValue?structuredClone(currentValue):null;
  const snap={val:()=>val,exists:()=>val!==null};
  for(const cb of sessionListeners)cb(snap);
 };
 const sdk={
  ref:(_db,path)=>({path}),
  serverTimestamp:()=>({'.sv':'serverTimestamp'}),
  async get(r){
   if(r.path.startsWith(`${ACTIVE_SESSIONS_PATH}/`)){
    if(permissionMode==='denied-all')throw Object.assign(Error('PERMISSION_DENIED'),{code:'PERMISSION_DENIED'});
    const val=currentValue?structuredClone(currentValue):null;
    return {val:()=>val,exists:()=>val!==null};
   }
   return {val:()=>null,exists:()=>false};
  },
  async remove(r){
   if(permissionMode==='denied-all'||permissionMode==='denied-write')throw Object.assign(Error('PERMISSION_DENIED'),{code:'PERMISSION_DENIED'});
   if(r.path.startsWith(`${ACTIVE_SESSIONS_PATH}/`)){currentValue=null;emitSession();}
  },
  async set(r,val){
   if(permissionMode==='denied-all'||permissionMode==='denied-write')throw Object.assign(Error('PERMISSION_DENIED'),{code:'PERMISSION_DENIED'});
   if(r.path.startsWith(`${ACTIVE_SESSIONS_PATH}/`)){currentValue=structuredClone(val);emitSession();}
  },
  async runTransaction(r,reducer){
   transactionCalls++;
   if(stubWithoutReducer)return {committed:false,snapshot:{val:()=>null,exists:()=>false}};
   if(permissionMode==='denied-all')throw Object.assign(Error('PERMISSION_DENIED'),{code:'PERMISSION_DENIED'});
   if(permissionMode==='denied-write')throw Object.assign(Error('PERMISSION_DENIED'),{code:'PERMISSION_DENIED'});
   const next=reducer(currentValue?structuredClone(currentValue):null);
   if(next===undefined)return {committed:false,snapshot:{val:()=>currentValue?structuredClone(currentValue):null,exists:()=>currentValue!==null}};
   const resolveTs=v=>v&&typeof v==='object'&&v['.sv']==='serverTimestamp'?currentNow:v;
   currentValue=next===null?null:{
    clientId:next.clientId,
    claimedAt:resolveTs(next.claimedAt),
    heartbeatAt:resolveTs(next.heartbeatAt)
   };
   emitSession();
   return {committed:true,snapshot:{val:()=>currentValue?structuredClone(currentValue):null,exists:()=>currentValue!==null}};
  },
  onValue(r,cb){
   if(r.path==='.info/serverTimeOffset'){offsetListeners.add(cb);cb({val:()=>serverOffset});return ()=>offsetListeners.delete(cb);}
   if(r.path==='.info/connected'){connectedListeners.add(cb);cb({val:()=>true});return ()=>connectedListeners.delete(cb);}
   if(r.path.startsWith(`${ACTIVE_SESSIONS_PATH}/`)){
    sessionListeners.add(cb);
    const val=currentValue?structuredClone(currentValue):null;
    cb({val:()=>val,exists:()=>val!==null});
    return ()=>sessionListeners.delete(cb);
   }
   return ()=>{};
  },
  onDisconnect(r){
   const item={path:r.path,cancelled:false,removed:false};
   disconnects.push(item);
   return {remove:async()=>{item.removed=true;},cancel:async()=>{item.cancelled=true;}};
  }
 };
 return {
  db:{},sdk,disconnects,
  get value(){return currentValue;},
  get transactionCalls(){return transactionCalls;},
  setNow(n){currentNow=n;},
  setStubWithoutReducer(v){stubWithoutReducer=v;},
  setPermissionMode(m){permissionMode=m;},
  pushForeign(entry){currentValue=structuredClone(entry);emitSession();},
  pushEmpty(){currentValue=null;emitSession();},
  pushConnected(flag){for(const cb of connectedListeners)cb({val:()=>flag});}
 };
}

test('getOrCreateClientSessionId persists a 32-hex ID per storage profile and isolates private/empty storage',()=>{
 const storeA=makeMemoryStorage();
 const id1=getOrCreateClientSessionId({storage:storeA});
 const id2=getOrCreateClientSessionId({storage:storeA});
 assert.match(id1,CLIENT_ID_PATTERN);
 assert.equal(id1,id2);
 assert.equal(storeA.dump()[CLIENT_SESSION_STORAGE_KEY],id1);

 const privateStore=makeMemoryStorage();
 const idPrivate=getOrCreateClientSessionId({storage:privateStore});
 assert.match(idPrivate,CLIENT_ID_PATTERN);
 assert.notEqual(idPrivate,id1);

 const brokenStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.match(getOrCreateClientSessionId({storage:brokenStorage}),CLIENT_ID_PATTERN);
});

test('single-session lease blocks a second window/private context while permitting same-profile tabs and stale crash recovery',async()=>{
 const clientA='a'.repeat(32),clientB='b'.repeat(32);
 const rtdb=createFakeRtdb({serverNow:100_000});
 const timers=[];
 const fakeSetInterval=fn=>{timers.push(fn);return timers.length;};
 const mgrA=createActiveSessionManager({
  db:rtdb.db,sdk:rtdb.sdk,uid:'alice',clientId:clientA,clock:()=>100_000,
  setInterval:fakeSetInterval,clearInterval:()=>{}
 });
 assert.equal((await mgrA.acquire()).status,'claimed');
 assert.equal(rtdb.value.clientId,clientA);
 assert.equal(rtdb.disconnects.some(d=>d.removed),true);

 // Same-profile tab re-claims cleanly without conflict
 const mgrTab2=createActiveSessionManager({
  db:rtdb.db,sdk:rtdb.sdk,uid:'alice',clientId:clientA,clock:()=>105_000,
  setInterval:fakeSetInterval,clearInterval:()=>{}
 });
 assert.equal((await mgrTab2.acquire()).status,'claimed');

 // Private window / separate browser is strictly blocked while lease is fresh
 let privateTakeovers=0;
 const mgrPrivate=createActiveSessionManager({
  db:rtdb.db,sdk:rtdb.sdk,uid:'alice',clientId:clientB,clock:()=>120_000,
  setInterval:fakeSetInterval,clearInterval:()=>{},onTakeover:()=>{privateTakeovers++;}
 });
 assert.equal((await mgrPrivate.acquire()).status,'occupied');
 assert.equal(rtdb.value.clientId,clientA);
 assert.equal(privateTakeovers,0);

 // After 45s+ without heartbeat (browser crash), second client recovers cleanly
 rtdb.setNow(150_000);
 const mgrRecovered=createActiveSessionManager({
  db:rtdb.db,sdk:rtdb.sdk,uid:'alice',clientId:clientB,clock:()=>150_000,
  setInterval:fakeSetInterval,clearInterval:()=>{}
 });
 assert.equal((await mgrRecovered.acquire()).status,'claimed');
 assert.equal(rtdb.value.clientId,clientB);

 await mgrA.release({removeRemote:false});
 await mgrTab2.release({removeRemote:false});
 await mgrRecovered.release({removeRemote:true});
 assert.equal(rtdb.value,null);
});

test('explicit takeover notifies and kicks the live original session without allowing it to delete the new lease',async()=>{
 const clientA='a'.repeat(32),clientB='b'.repeat(32);
 const rtdb=createFakeRtdb({serverNow:200_000});
 let kicked=0;
 const mgrA=createActiveSessionManager({
  db:rtdb.db,sdk:rtdb.sdk,uid:'alice',clientId:clientA,clock:()=>200_000,
  setInterval:()=>1,clearInterval:()=>{},onTakeover:()=>{kicked++;}
 });
 assert.equal((await mgrA.acquire()).status,'claimed');

 const mgrB=createActiveSessionManager({
  db:rtdb.db,sdk:rtdb.sdk,uid:'alice',clientId:clientB,clock:()=>201_000,
  setInterval:()=>2,clearInterval:()=>{}
 });
 assert.equal((await mgrB.acquire({takeover:true})).status,'claimed');
 assert.equal(kicked,1);
 assert.equal(rtdb.value.clientId,clientB);
 assert.equal(mgrA.isClaimed(),false);

 // Releasing the kicked manager never removes clientB's active lease
 await mgrA.release({removeRemote:true});
 assert.equal(rtdb.value.clientId,clientB);
 await mgrB.release({removeRemote:true});
 assert.equal(rtdb.value,null);
});

test('serverTimeOffset protects clock-skewed clients and permission-denied rules fall back cleanly until published',async()=>{
 const clientA='a'.repeat(32),clientB='b'.repeat(32);
 // Client B clock thinks it is 5 minutes in the future, while serverTimeOffset corrects it back to 101_000
 const rtdb=createFakeRtdb({
  initial:{clientId:clientA,claimedAt:100_000,heartbeatAt:100_000},
  serverNow:101_000,
  serverOffset:-300_000
 });
 const mgrSkewed=createActiveSessionManager({
  db:rtdb.db,sdk:rtdb.sdk,uid:'alice',clientId:clientB,clock:()=>401_000,
  setInterval:()=>1,clearInterval:()=>{}
 });
 assert.equal((await mgrSkewed.acquire()).status,'occupied');

 // Pre-publish rules deny both read and write -> graceful unsupported fallback
 rtdb.setPermissionMode('denied-all');
 const mgrPrePublish=createActiveSessionManager({
  db:rtdb.db,sdk:rtdb.sdk,uid:'alice',clientId:clientB,clock:()=>101_000
 });
 assert.equal((await mgrPrePublish.acquire()).status,'unsupported');
 assert.equal(mgrPrePublish.isUnsupported(),true);

 // Write denied while read sees foreign client -> still reports occupied
 rtdb.setPermissionMode('denied-write');
 const mgrRuleBlock=createActiveSessionManager({
  db:rtdb.db,sdk:rtdb.sdk,uid:'alice',clientId:clientB,clock:()=>101_000
 });
 assert.equal((await mgrRuleBlock.acquire()).status,'occupied');

 // Stubbed test mocks that return committed:false without invoking reducer -> unsupported
 rtdb.setPermissionMode('open');
 rtdb.pushEmpty();
 rtdb.setStubWithoutReducer(true);
 const mgrMock=createActiveSessionManager({
  db:rtdb.db,sdk:rtdb.sdk,uid:'alice',clientId:clientB,clock:()=>101_000
 });
 assert.equal((await mgrMock.acquire()).status,'unsupported');
});

test('block9d-session-candidate builds cleanly over BLOCK5-RULES-TO-PUBLISH.json and rejects already-present activeSessions',async()=>{
 const block5Bytes=await readFile(new URL('../firebase/BLOCK5-RULES-TO-PUBLISH.json',import.meta.url));
 const block9dBytes=await readFile(new URL('../firebase/BLOCK9D-RULES-TO-PUBLISH.json',import.meta.url),'utf8');
 const generated=buildBlock9dSessionCandidate(block5Bytes);
 assert.deepEqual(generated,JSON.parse(block9dBytes));
 assert.ok(generated.rules.activeSessions.$uid['.write'].includes('45000'));
 assert.throws(()=>applyBlock9dSessionRules(structuredClone(generated.rules)),/already exists/);
});

test('account.js, index.html, and localization-account-de.mjs wire single-session lock and takeover UI consistently',async()=>{
 const [account,html,deModule]=await Promise.all([
  readFile(new URL('../account.js',import.meta.url),'utf8'),
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  import('../localization-account-de.mjs')
 ]);
 assert.match(account,/getOrCreateClientSessionId/);
 assert.match(account,/createActiveSessionManager/);
 assert.match(account,/handleSessionTakenOver/);
 assert.match(account,/releaseActiveSession/);
 assert.match(html,/id="sessionTakeoverField"/);
 assert.match(html,/id="sessionTakeoverCheck"/);
 for(const key of [
  'Checking active session…',
  'Verifying single-account access.',
  'This account is already active in another browser window or device. Sign out there or close the other window first.',
  'You were signed out because this account signed in on another browser window or device.',
  'End the active session on the other window or device and sign in here'
 ]){
  assert.ok(Object.hasOwn(deModule.germanAccount,key),`Missing DE translation: ${key}`);
 }
});

