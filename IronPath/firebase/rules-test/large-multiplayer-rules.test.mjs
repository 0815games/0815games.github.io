import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,get,set,update,onValue,runTransaction,remove,onDisconnect,serverTimestamp} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {createFirebaseFourLobby} from '../../firebase-four-lobby.mjs';
import {createFirebasePartyGame} from '../../firebase-party-game.mjs';
import {createPlayer} from '../../match.mjs';
import {bunkerStart} from '../../solo-deployment.mjs';
import {buildRulesCandidate} from '../../release-tools/rules-candidate.mjs';
import {CONTROL_PATH} from '../../release-tools/release-control.mjs';

// Uses Firebase's SDK and a local database emulator with checked-in rules.
// The optional guarded run tests a generated candidate, not deployed rules.
const ids=['alice','bob'],sdk={ref,get,set,update,onValue,runTransaction,remove,onDisconnect,serverTimestamp};
const profiles=Object.fromEntries(ids.map(id=>[id,{name:id,gender:'female',level:1}]));
const guarded=process.env.IRONPATH_RELEASE_GUARD==='1';
const publish=process.env.PUBLISH_RULES==='1'||guarded;
const rulesFile=publish?'../WORKSHOP-RULES-TO-PUBLISH.json':'../unified.complete.draft.rules.json';
const epochA='a'.repeat(32),epochB='b'.repeat(32),t=Math.floor(Date.now()/1000);
const control={mode:'open',build:'release-1',epoch:epochA,authAfter:t-120};
const claims=(epoch=epochA,authTime=t-30,provider='custom')=>({
 iat:t,auth_time:authTime,ip_release_epoch:epoch,firebase:{sign_in_provider:provider,identities:{}}
});
const mapId='g3-19e3779b1';let env,db;
const adminSet=(path,value)=>env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),path),value));
before(async()=>{
 const source=await readFile(new URL(rulesFile,import.meta.url),'utf8');
 const rules=guarded?JSON.stringify(buildRulesCandidate(JSON.parse(source)).candidate):source;
 env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules}});
 db=Object.fromEntries(ids.map(id=>[id,(guarded?env.authenticatedContext(id,claims()):env.authenticatedContext(id)).database()]));
});
beforeEach(async()=>{
 await env.clearDatabase();
 if(guarded)await adminSet(CONTROL_PATH,control);
 for(const id of ids)await set(ref(db[id],`players/${id}`),{name:id,gender:'female',xp:0});
 // Fail if the test accidentally reaches an unrestricted database instance.
 await assertFails(set(ref(db.bob,'players/alice/xp'),1));
});
after(async()=>env.cleanup());

for(const mode of ['coop','versus'])test(`${guarded?'release-gated publish':publish?'publish':'unified'} candidate rules admit a large ${mode} lobby, battle and guest reconnect`,{timeout:60000},async()=>{
 const auth=id=>({currentUser:{uid:id}});
 const lobbies=Object.fromEntries(ids.map(id=>[id,createFirebaseFourLobby({db:db[id],auth:auth(id),sdk,crypto:webcrypto})]));
 const party=await assertSucceeds(lobbies.alice.create(profiles.alice));let clients=[];
 const ready={},views={},errors=[];
 const wait=async(predicate,label)=>{const deadline=Date.now()+20000;while(!predicate()){if(errors.length)throw Error(`${label}: ${errors}`);if(Date.now()>deadline)throw Error(`${label}: timeout ${JSON.stringify(ready)}`);await new Promise(resolve=>setTimeout(resolve,50));}};
 try{
  await assertSucceeds(lobbies.bob.request(party.inviteCode,'bob'));
  await assertSucceeds(lobbies.alice.approve(party.partyId,party.inviteCode,'bob'));
  await assertSucceeds(lobbies.bob.publishProfile(party.partyId,profiles.bob));
  await assertSucceeds(lobbies.alice.configure(party.partyId,{mode,teams:[0,0,1,1]}));
  const manifest=await assertSucceeds(lobbies.alice.start(party.partyId));
  const players=ids.map((id,index)=>{const start=bunkerStart(mapId,index);return createPlayer(id,profiles[id],start.x,start.y);});
  const make=id=>createFirebasePartyGame({db:db[id],auth:auth(id),sdk,crypto:webcrypto,partyId:party.partyId,partyRoot:'fourParties',hostId:'alice',playerIds:manifest.playerIds,mode,mapId:id==='alice'?mapId:'road',...(id==='alice'?{players}:{}),onStatus:value=>ready[id]=value,onSnapshot:value=>views[id]=value,onState:value=>{if(value==='error'||value==='duplicate')errors.push(`${id}:${value}`);}});
  clients=ids.map(make);clients.forEach(client=>client.start());
  await wait(()=>ids.every(id=>ready[id]&&views[id]?.match?.mapId===mapId),'host seed reaches both players');
  assert.equal((await clients[1].command({type:'build',pad:12,towerType:0})).ok,true);
  assert.equal((await clients[0].command({type:'build',pad:0,towerType:0})).ok,true);
  await wait(()=>mode==='coop'?views.bob?.match.towers.length===2:views.bob?.match.towers.length===1&&views.bob?.match.rival.towers.length===1,'builds are visible');
  assert.equal((await clients[1].command({type:'move',x:1200,y:600})).ok,true,'movement beyond the former field boundary');
  await wait(()=>views.bob?.match?.players?.bob?.target?.x===1200,'large-field movement is replicated');
  const request=await clients[0].command({type:'startWave'});assert.equal(request.waitingForGuest,true);
  await wait(()=>views.bob?.match?.pendingWave===1,'guest sees wave request');
  assert.equal((await clients[1].command({type:'approveWave',requestId:views.bob.match.waveRequestId})).ok,true);
  await wait(()=>ids.every(id=>views[id]?.match?.wave===1),'both views start wave one');
  await clients[1].stop();await wait(()=>ready.bob===false,'guest leaves');
  if(mode==='versus')await wait(()=>ready.alice===false,'duel pauses without the opponent');
  views.bob=null; // A pre-disconnect snapshot must not satisfy the reconnect check.
  clients[1]=make('bob');clients[1].start();
  await wait(()=>ids.every(id=>ready[id])&&views.bob?.match?.mapId===mapId&&views.bob.match.wave===1,'guest receives the same field and wave after reconnect');
  if(mode==='coop')assert.equal(views.bob.match.towers.length,2);
  else {assert.equal(views.bob.match.towers.length,1);assert.equal(views.bob.match.rival.towers.length,1);}
  assert.deepEqual(errors,[]);
 }finally{await Promise.allSettled(clients.map(client=>client.stop()));await lobbies.alice.close(party.partyId,party.inviteCode);}
});

if(guarded){
 test('release-gated multiplayer rules reject stale or unexchanged credentials and client control writes',async()=>{
  const stale=env.authenticatedContext('alice',claims(epochB)).database();
  const password=env.authenticatedContext('alice',claims(epochA,t-30,'password')).database();
  await assertFails(get(ref(stale,'players/alice')));
  await assertFails(get(ref(password,'players/alice')));
  await assertFails(set(ref(db.alice,CONTROL_PATH),{...control,mode:'maintenance'}));
 });

 test('a live multiplayer input listener and writes are fenced on closure and epoch change',{timeout:30000},async()=>{
  // Minimal started lobby: this exercises the real nested multiplayer rules,
  // not an unguarded top-level profile rule. Data here is entirely synthetic.
  const partyId='c'.repeat(32),input=`fourParties/${partyId}/inputs/bob`;
  await adminSet(`fourParties/${partyId}`,{hostId:'alice',slots:{one:'bob'},started:{hostId:'alice'}});
  await assertSucceeds(set(ref(db.bob,input),'before'));
  let firstResolve,cancelResolve;
  const first=new Promise(resolve=>{firstResolve=resolve;});
  const cancelled=new Promise(resolve=>{cancelResolve=resolve;});
  const off=onValue(ref(db.alice,input),snapshot=>firstResolve(snapshot.val()),error=>cancelResolve(error));
  async function within(promise,label){
   let timer;
   try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(`${label} timed out`)),12000);})]);}
   finally{clearTimeout(timer);}
  }
  try{
   assert.equal(await within(first,'initial multiplayer snapshot'),'before');
   await adminSet(CONTROL_PATH,{...control,mode:'maintenance',epoch:epochB});
   await assertFails(set(ref(db.bob,input),'closed'));
   assert.match(String((await within(cancelled,'multiplayer listener cancellation'))?.code),/permission.denied/i);
   await adminSet(CONTROL_PATH,{...control,mode:'open',build:'release-2',epoch:epochB,authAfter:t-10});
   await assertFails(set(ref(db.bob,input),'stale'));
   const fresh=env.authenticatedContext('bob',claims(epochB,t-1)).database();
   await assertSucceeds(set(ref(fresh,input),'new epoch'));
   let saved;await env.withSecurityRulesDisabled(async ctx=>{saved=(await get(ref(ctx.database(),input))).val();});
   assert.equal(saved,'new epoch');
  }finally{off();}
 });
}
