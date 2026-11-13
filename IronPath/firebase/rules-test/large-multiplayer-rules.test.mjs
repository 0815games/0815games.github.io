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

// Uses Firebase's SDK and a local database emulator with a checked-in rules
// candidate. This is not an inspection of the deployed production rules.
const ids=['alice','bob'],sdk={ref,get,set,update,onValue,runTransaction,remove,onDisconnect,serverTimestamp};
const profiles=Object.fromEntries(ids.map(id=>[id,{name:id,gender:'female',level:1}]));
const publish=process.env.PUBLISH_RULES==='1';
const rulesFile=publish?'../WORKSHOP-RULES-TO-PUBLISH.json':'../unified.complete.draft.rules.json';
const mapId='g3-19e3779b1';let env,db;
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL(rulesFile,import.meta.url),'utf8')}});
 db=Object.fromEntries(ids.map(id=>[id,env.authenticatedContext(id).database()]));
});
beforeEach(async()=>{
 await env.clearDatabase();
 for(const id of ids)await set(ref(db[id],`players/${id}`),{name:id,gender:'female',xp:0});
 // Fail if the test accidentally reaches an unrestricted database instance.
 await assertFails(set(ref(db.bob,'players/alice/xp'),1));
});
after(async()=>env.cleanup());

for(const mode of ['coop','versus'])test(`${publish?'publish':'unified'} candidate rules admit a large ${mode} lobby, battle and guest reconnect`,{timeout:60000},async()=>{
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
