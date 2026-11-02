import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,set,get,update,onValue,runTransaction,remove,serverTimestamp,onDisconnect} from 'firebase/database';
import {createFirebaseFourLobby} from '../../firebase-four-lobby.mjs';
import {createFirebasePartyGame} from '../../firebase-party-game.mjs';
import {createPlayer} from '../../match.mjs';
import {webcrypto} from 'node:crypto';
let env,db;const names={alice:'Alice',bob:'Bob',cara:'Cara',dan:'Dan',eve:'Eve'};
const party='0123456789abcdef0123456789abcdef',code='0123',p=`fourParties/${party}`,c=`fourCodes/${code}`,at=(uid,path)=>ref(db[uid],path);
const profile=uid=>({name:names[uid],gender:'female',level:1});
const manifest=(mode='two-vs-two')=>({hostId:'alice',playerIds:['alice','bob','cara','dan'],mode,teams:[0,1,0,1]});
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../four-player.complete.draft.rules.json',import.meta.url),'utf8')}});db=Object.fromEntries(Object.keys(names).map(id=>[id,env.authenticatedContext(id).database()]));db.anon=env.unauthenticatedContext().database();});
beforeEach(async()=>{await env.clearDatabase();for(const uid of Object.keys(names))await assertSucceeds(set(at(uid,`players/${uid}`),{name:names[uid],gender:'female',xp:0}));});after(async()=>{await env.cleanup();});
async function create(){await assertSucceeds(set(at('alice',`${p}/hostId`),'alice'));await assertSucceeds(set(at('alice',`${c}/hostId`),'alice'));await assertSucceeds(set(at('alice',`${p}/inviteCode`),code));await assertSucceeds(set(at('alice',`${c}/partyId`),party));await assertSucceeds(set(at('alice',`${p}/profiles/alice`),profile('alice')));await assertSucceeds(set(at('alice',`${p}/config`),{mode:'two-vs-two',teams:[0,1,0,1]}));}
async function add(uid,slot){await assertSucceeds(set(at(uid,`${c}/requests/${uid}`),{name:names[uid]}));await assertSucceeds(set(at('alice',`${p}/slots/${slot}`),uid));await assertSucceeds(set(at(uid,`${p}/profiles/${uid}`),profile(uid)));}
async function full(){await create();await add('bob','one');await add('cara','two');await add('dan','three');}
test('requests, slots and profiles enforce identity, capacity and uniqueness',async()=>{
  await assertFails(set(at('anon',`${p}/hostId`),'alice'));await create();
  await assertFails(set(at('bob',`${p}/slots/one`),'bob'));await assertFails(set(at('alice',`${p}/slots/one`),'bob'));
  await assertFails(set(at('bob',`${c}/requests/bob`),{name:'Alice'}));await assertFails(set(at('eve',`${c}/requests/bob`),{name:'Bob'}));
  await add('bob','one');await assertFails(set(at('bob',`${p}/profiles/cara`),profile('cara')));await assertFails(set(at('bob',`${p}/profiles/bob`),{...profile('bob'),name:'Alice'}));await assertFails(set(at('bob',`${p}/profiles/bob`),{...profile('bob'),gender:'male'}));
  await assertFails(set(at('alice',`${p}/slots/two`),'bob'));await assertFails(set(at('alice',`${p}/slots/four`),'bob'));
  await assertSucceeds(set(at('cara',`${c}/requests/cara`),{name:'Cara'}));await assertSucceeds(set(at('dan',`${c}/requests/dan`),{name:'Dan'}));
  await assertSucceeds(set(at('alice',`${p}/slots`),{one:'bob',two:'cara',three:'dan'}));
  await assertFails(set(at('alice',`${p}/slots`),{one:'bob',two:'cara',three:'cara'}));
  await assertFails(set(at('eve',`${p}/slots/one`),null));await assertSucceeds(set(at('bob',`${p}/slots/one`),null));await assertSucceeds(set(at('bob',`${p}/profiles/bob`),null));
});
test('locked manifest must match current roster, profiles and balanced configuration',async()=>{
  await full();await assertFails(set(at('bob',`${p}/config`),{mode:'four-coop',teams:[0,0,1,1]}));await assertFails(set(at('alice',`${p}/config`),{mode:'two-vs-two',teams:[0,0,0,1]}));
  await assertFails(set(at('bob',`${p}/started`),manifest()));await assertFails(set(at('alice',`${p}/started`),{...manifest(),playerIds:['alice','bob','dan','cara']}));
  await assertFails(set(at('alice',`${p}/started`),{...manifest(),teams:[0,0,1,1]}));await assertFails(set(at('alice',`${p}/started`),{...manifest(),rogue:true}));
  await assertSucceeds(set(at('alice',`${p}/started`),manifest()));await assertSucceeds(get(at('bob',`${p}/started`)));await assertFails(get(at('eve',`${p}/started`)));
  await assertFails(set(at('bob',`${p}/slots/one`),null));await assertFails(set(at('alice',`${p}/slots`),{one:'bob',two:'cara',three:'eve'}));await assertFails(set(at('alice',`${p}/config`),{mode:'four-coop',teams:[0,0,1,1]}));await assertFails(set(at('bob',`${p}/profiles/bob`),profile('bob')));await assertFails(set(at('alice',`${p}/started`),null));
});
test('a stale manifest cannot start after a guest leaves',async()=>{
  await full();const stale=manifest();await assertSucceeds(set(at('dan',`${p}/slots/three`),null));await assertFails(set(at('alice',`${p}/started`),stale));
});
test('concurrent start and departure cannot both commit',async()=>{
  await full();const [start,leave]=await Promise.allSettled([set(at('alice',`${p}/started`),manifest()),set(at('dan',`${p}/slots/three`),null)]);
  assert.notEqual(start.status==='fulfilled'&&leave.status==='fulfilled',true,'a stale manifest must never coexist with a removed member');
  if(start.status==='fulfilled')assert.equal((await get(at('alice',`${p}/slots/three`))).val(),'dan');else assert.equal((await get(at('alice',`${p}/started`))).val(),null);
});
test('concurrent duplicate approvals cannot put one account in two slots',async()=>{
  await create();await assertSucceeds(set(at('bob',`${c}/requests/bob`),{name:'Bob'}));const [a,b]=await Promise.allSettled([set(at('alice',`${p}/slots/one`),'bob'),set(at('alice',`${p}/slots/two`),'bob')]);
  assert.equal([a,b].filter(r=>r.status==='fulfilled').length,1);const slots=(await get(at('alice',`${p}/slots`))).val();assert.equal(Object.values(slots).filter(id=>id==='bob').length,1);
});
test('member-only inputs, private views and bounded presence',async()=>{
  await full();await assertFails(set(at('bob',`${p}/inputs/bob`),'{}'));await assertSucceeds(set(at('alice',`${p}/started`),manifest()));
  await assertSucceeds(set(at('bob',`${p}/inputs/bob`),'{}'));await assertSucceeds(get(at('alice',`${p}/inputs/bob`)));await assertFails(get(at('cara',`${p}/inputs/bob`)));await assertFails(set(at('eve',`${p}/inputs/eve`),'{}'));await assertFails(set(at('alice',`${p}/inputs/bob`),'{}'));await assertFails(set(at('bob',`${p}/inputs/bob`),'x'.repeat(4097)));
  await assertSucceeds(update(ref(db.alice,p),{'views/alice':'{}','views/bob':'{}','views/cara':'{}','views/dan':'{}'}));await assertSucceeds(get(at('bob',`${p}/views/bob`)));await assertFails(get(at('cara',`${p}/views/bob`)));await assertFails(set(at('bob',`${p}/views/bob`),'{}'));await assertFails(set(at('alice',`${p}/views/eve`),'{}'));
  const conn='a'.repeat(32);await assertSucceeds(set(at('bob',`${p}/presence/bob/${conn}`),serverTimestamp()));await assertSucceeds(get(at('alice',`${p}/presence/bob`)));await assertFails(get(at('eve',`${p}/presence/bob`)));await assertFails(set(at('eve',`${p}/presence/bob/${conn}`),serverTimestamp()));await assertFails(set(at('bob',`${p}/presence/bob/${conn}`),1));await assertSucceeds(set(at('bob',`${p}/presence/bob/${conn}`),null));
});
test('four-player SDK lobby operations and reconnect work under the combined rules', {timeout:30000},async()=>{
  const sdk={ref,get,set,onValue,runTransaction,remove};let random=0;const crypto={getRandomValues(bytes){bytes.fill(++random);return bytes;}};
  const lobbies=Object.fromEntries(Object.keys(names).map(uid=>[uid,createFirebaseFourLobby({db:db[uid],auth:{currentUser:{uid}},sdk,crypto})]));
  const created=await assertSucceeds(lobbies.alice.create(profile('alice')));for(const uid of ['bob','cara','dan']){await assertSucceeds(lobbies[uid].request(created.inviteCode,names[uid]));await assertSucceeds(lobbies.alice.approve(created.partyId,created.inviteCode,uid));await assertSucceeds(lobbies[uid].publishProfile(created.partyId,profile(uid)));}
  await assertSucceeds(lobbies.alice.configure(created.partyId,{mode:'two-vs-two',teams:[0,1,0,1]}));const started=await assertSucceeds(lobbies.alice.start(created.partyId));assert.deepEqual(started.playerIds,['alice','bob','cara','dan']);assert.deepEqual((await assertSucceeds(lobbies.bob.reconnect(created.partyId,created.inviteCode))).teamRosters,[['alice','cara'],['bob','dan']]);
  await assertFails(lobbies.eve.reconnect(created.partyId,created.inviteCode));await assert.rejects(()=>lobbies.bob.leave(created.partyId),/locked/);await assertSucceeds(lobbies.alice.close(created.partyId,created.inviteCode));
});
test('SDK lobby subscriptions expose only permitted roster information', {timeout:30000},async()=>{
  const sdk={ref,get,set,onValue,runTransaction,remove};let random=0;const crypto={getRandomValues(bytes){bytes.fill(++random);return bytes;}};
  const lobby=Object.fromEntries(['alice','bob','eve'].map(uid=>[uid,createFirebaseFourLobby({db:db[uid],auth:{currentUser:{uid}},sdk,crypto})]));
  const created=await lobby.alice.create(profile('alice'));
  function once(subscribe){return new Promise((resolve,reject)=>{let unwatch;unwatch=subscribe(value=>{queueMicrotask(()=>unwatch?.());resolve(value);},reject);});}
  assert.equal(await once((ok,err)=>lobby.bob.watchHost(created.partyId,ok,err)),'alice');
  await lobby.bob.request(created.inviteCode,'Bob');assert.deepEqual(await once((ok,err)=>lobby.bob.watchOwnRequest(created.inviteCode,ok,err)),{name:'Bob'});
  assert.equal(await once((ok,err)=>lobby.bob.watchSlots(created.partyId,ok,err)),null);
  await lobby.alice.approve(created.partyId,created.inviteCode,'bob');await lobby.bob.publishProfile(created.partyId,profile('bob'));
  assert.equal((await once((ok,err)=>lobby.bob.watchSlots(created.partyId,ok,err))).one,'bob');
  assert.equal((await once((ok,err)=>lobby.bob.watchConfig(created.partyId,ok,err))).mode,'four-coop');
  assert.deepEqual(await once((ok,err)=>lobby.bob.watchProfile(created.partyId,'alice',ok,err)),profile('alice'));
  await assert.rejects(once((ok,err)=>lobby.eve.watchConfig(created.partyId,ok,err)),/permission_denied/i);
  await assert.rejects(once((ok,err)=>lobby.eve.watchProfile(created.partyId,'alice',ok,err)),/permission_denied/i);
  await lobby.bob.leave(created.partyId);await lobby.alice.close(created.partyId,created.inviteCode);
});
for(const mode of ['four-coop','two-vs-two'])test(`four real Firebase SDK clients play ${mode} under draft rules`,{timeout:60000},async()=>{
  await full();if(mode==='four-coop')await set(at('alice',`${p}/config`),{mode,teams:[0,1,0,1]});await set(at('alice',`${p}/started`),manifest(mode));
  const ids=['alice','bob','cara','dan'],sdk={ref,get,set,update,onValue,runTransaction,remove,onDisconnect,serverTimestamp},statuses={},views={},errors=[];
  const players=ids.map((id,i)=>createPlayer(id,profile(id),1220,270+i*60));
  const clients=ids.map(id=>createFirebasePartyGame({db:db[id],auth:{currentUser:{uid:id}},sdk,partyId:party,hostId:'alice',playerIds:ids,mode,crypto:webcrypto,...(id==='alice'?{players,teams:[['alice','cara'],['bob','dan']]}:{}),onStatus:value=>{statuses[id]=value;},onState:value=>{if(value==='error')errors.push(id);},onSnapshot:value=>{views[id]=value;}}));
  async function waitFor(fn,label){const until=Date.now()+20000;while(Date.now()<until){if(errors.length)throw Error(`Client error: ${errors.join(',')}`);if(fn())return;await new Promise(resolve=>setTimeout(resolve,50));}throw Error(`Timed out: ${label}`);}
  try{
    for(const client of clients)client.start();await waitFor(()=>ids.every(id=>statuses[id]),'four clients ready');
    const requested=await clients[0].command({type:'startWave'});assert.equal(requested.ok,true);for(let i=1;i<4;i++){const result=await clients[i].command({type:'approveWave',requestId:requested.requestId});assert.equal(result.ok,true,`${ids[i]} approves`);}
    await waitFor(()=>ids.every(id=>mode==='four-coop'?views[id]?.match?.match?.wave===1:views[id]?.match?.lanes?.every(lane=>lane.wave===1)),'wave visible');
    assert.equal((await clients[3].command({type:'build',pad:15,towerType:0})).ok,true);await waitFor(()=>mode==='four-coop'?views.bob?.match?.match?.towers?.length===1:views.bob?.match?.lanes?.[1]?.towers?.length===1,'tower visible');
    await clients[3].stop();await waitFor(()=>statuses.dan===false,'guest offline');await waitFor(()=>mode==='four-coop'?statuses.alice===true:statuses.alice===false,'disconnect behavior');assert.deepEqual(errors,[]);
  }finally{await Promise.allSettled(clients.map(client=>client.stop()));}
});
test('existing account and two-player code rules remain present',async()=>{
  const old='fedcba9876543210fedcba9876543210';await assertSucceeds(set(at('alice',`parties/${old}/hostId`),'alice'));await assertSucceeds(set(at('alice','partyCodes/0987/hostId'),'alice'));await assertFails(get(at('eve','players/alice')));await assertFails(set(at('bob','players/alice/xp'),500));
});
