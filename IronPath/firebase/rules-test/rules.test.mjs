import {test, before, after, beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,get,set,update,runTransaction,serverTimestamp} from 'firebase/database';
import {createFirebasePartyLobby} from '../../firebase-party-lobby.mjs';
import {createFirebasePartyChannel} from '../../firebase-party-channel.mjs';
const projectId='demo-ironpath',party='0123456789abcdef0123456789abcdef';
let env,alice,bob,eve,anonymous;
const at=(db,path)=>ref(db,`parties/${party}/${path}`);
before(async()=>{
  env=await initializeTestEnvironment({projectId,database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../party-alpha.draft.rules.json',import.meta.url),'utf8')}});
  alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();eve=env.authenticatedContext('eve').database();anonymous=env.unauthenticatedContext().database();
});
beforeEach(async()=>{await env.clearDatabase();});
after(async()=>{await env?.cleanup();});

test('only the signed-in owner can create an immutable host; guest slot is atomic',async()=>{
  await assertFails(set(at(anonymous,'hostId'),'alice'));
  await assertFails(set(at(alice,'hostId'),'bob'));
  await assertSucceeds(set(at(alice,'hostId'),'alice'));
  await assertFails(set(at(eve,'hostId'),'eve'));await assertFails(set(at(alice,'hostId'),null));
  await assertFails(set(at(alice,'guestId'),'alice'));
  const joined=await assertSucceeds(runTransaction(at(bob,'guestId'),v=>v===null?'bob':undefined));assert.equal(joined.committed,true);
  await assertFails(set(at(eve,'guestId'),'eve'));await assertFails(set(at(eve,'guestId'),null));
  await assertSucceeds(set(at(bob,'guestId'),null));await assertSucceeds(set(at(eve,'guestId'),'eve'));
  await assertFails(set(ref(alice,'parties/not-a-code/hostId'),'alice'));
});

test('non-members cannot read match data or write another player’s input',async()=>{
  await assertSucceeds(set(at(alice,'hostId'),'alice'));await assertSucceeds(set(at(bob,'guestId'),'bob'));
  await assertFails(get(ref(eve,`parties/${party}`)));await assertFails(get(at(eve,'inputs/bob')));
  await assertSucceeds(set(at(bob,'inputs/bob'),'{}'));await assertSucceeds(get(at(alice,'inputs/bob')));
  await assertFails(set(at(alice,'inputs/bob'),'{}'));await assertFails(set(at(eve,'inputs/eve'),'{}'));
  await assertFails(set(at(bob,'inputs/bob'),'x'.repeat(4097)));await assertFails(set(at(bob,'inputs/bob'),{unsafe:true}));
  await assertFails(set(ref(alice,`parties/${party}/unknown`),'anything'));
});

test('only host publishes member views; each member can read only their own',async()=>{
  await assertSucceeds(set(at(alice,'hostId'),'alice'));await assertSucceeds(set(at(bob,'guestId'),'bob'));
  await assertSucceeds(update(ref(alice,`parties/${party}`),{'views/alice':'{"tick":1}','views/bob':'{"tick":1}'}));
  await assertSucceeds(get(at(bob,'views/bob')));await assertFails(get(at(bob,'views/alice')));await assertFails(get(at(eve,'views/bob')));
  await assertFails(set(at(bob,'views/bob'),'{}'));await assertFails(set(at(alice,'views/eve'),'{}'));
  await assertFails(set(at(alice,'views/bob'),'x'.repeat(262145)));
});

test('presence writes belong to each member and use bounded server time',async()=>{
  await assertSucceeds(set(at(alice,'hostId'),'alice'));await assertSucceeds(set(at(bob,'guestId'),'bob'));
  const id='a'.repeat(32);await assertSucceeds(set(at(bob,`presence/bob/${id}`),serverTimestamp()));
  await assertSucceeds(get(at(alice,'presence/bob')));await assertFails(get(at(eve,'presence/bob')));
  await assertFails(set(at(eve,`presence/bob/${id}`),serverTimestamp()));await assertFails(set(at(bob,'presence/bob/not-a-connection'),serverTimestamp()));
  await assertFails(set(at(bob,`presence/bob/${id}`),1));await assertSucceeds(set(at(bob,`presence/bob/${id}`),null));
});

test('profile isolation and real client lobby/channel operations under draft rules',async()=>{
  const sdk={ref,get,set,update,runTransaction,onValue:(await import('firebase/database')).onValue};
  const authA={currentUser:{uid:'alice'}},authB={currentUser:{uid:'bob'}};
  const deterministicCrypto={getRandomValues(bytes){bytes.set(Buffer.from(party,'hex'));return bytes;}};
  const lobbyA=createFirebasePartyLobby({db:alice,auth:authA,sdk,crypto:deterministicCrypto});
  const lobbyB=createFirebasePartyLobby({db:bob,auth:authB,sdk,crypto:deterministicCrypto});
  assert.equal((await lobbyA.create()).partyId,party);assert.equal((await lobbyB.join(party)).hostId,'alice');
  const opts={sdk,partyId:party,hostId:'alice',playerIds:['alice','bob']};
  const host=createFirebasePartyChannel({...opts,db:alice,auth:authA}),guest=createFirebasePartyChannel({...opts,db:bob,auth:authB});
  await assertSucceeds(guest.writeInput({version:1,seq:1,command:{type:'startWave'}}));
  await assertSucceeds(host.publishViews({alice:{tick:1},bob:{tick:1}}));
  await assertFails(get(ref(alice,'players/bob')));await assertFails(set(ref(alice,'players/bob/xp'),999));
  await host.close();await guest.close();
});
