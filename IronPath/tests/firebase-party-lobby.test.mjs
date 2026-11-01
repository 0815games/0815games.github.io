import {strict as assert} from 'node:assert';
import {createFirebasePartyLobby} from '../firebase-party-lobby.mjs';
// Firebase-shaped mock. It verifies client behavior, not database security rules.
const values=new Map(),listeners=new Map();
const snapshot=value=>({val:()=>value??null});
const sdk={ref:(_db,path)=>path,async update(path,changes){for(const [key,value] of Object.entries(changes)){const full=path+'/'+key;if(value===null)values.delete(full);else values.set(full,value);for(const cb of listeners.get(full)||[])cb(snapshot(value));}},async remove(path){for(const key of [...values.keys()])if(key===path||key.startsWith(path+'/')){values.delete(key);for(const cb of listeners.get(key)||[])cb(snapshot(null));}},async get(path){return snapshot(values.get(path));},async runTransaction(path,update){const next=update(values.get(path)??null);if(next===undefined)return {committed:false,snapshot:snapshot(values.get(path))};if(next===null)values.delete(path);else values.set(path,next);for(const cb of listeners.get(path)||[])cb(snapshot(next));return {committed:true,snapshot:snapshot(next)};},onValue(path,cb){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add(cb);cb(snapshot(values.get(path)));return ()=>listeners.get(path).delete(cb);}};
let random=0;const crypto={getRandomValues(buffer){buffer.fill(++random);return buffer;}};
const auth=id=>({currentUser:{uid:id}}),base={db:{},sdk,crypto};
const host=createFirebasePartyLobby({...base,auth:auth('alice')}),guest=createFirebasePartyLobby({...base,auth:auth('bob')}),outsider=createFirebasePartyLobby({...base,auth:auth('eve')});
const party=await host.create();assert.match(party.partyId,/^[0-9a-f]{32}$/);assert.equal(party.hostId,'alice');
let seen=[];const unsubscribe=host.watchGuest(party.partyId,id=>seen.push(id));
assert.deepEqual(await guest.join(party.partyId),{partyId:party.partyId,hostId:'alice',guestId:'bob'});assert.deepEqual(seen,[null,'bob']);
await assert.rejects(outsider.join(party.partyId),/unavailable/);await assert.rejects(host.join(party.partyId),/unavailable/);
values.set(`parties/${party.partyId}/profiles/bob`,{name:'Bob'});values.set(`parties/${party.partyId}/inputs/bob`,'stale');
assert.equal(await outsider.leaveGuest(party.partyId),false);assert.equal(await guest.leaveGuest(party.partyId),true);
assert.equal(values.has(`parties/${party.partyId}/profiles/bob`),false);assert.equal(values.has(`parties/${party.partyId}/inputs/bob`),false);
values.set(`parties/${party.partyId}/startedGuest`,'bob');assert.equal((await guest.join(party.partyId)).started,true);assert.equal(await guest.leaveGuest(party.partyId),true);assert.equal(seen.at(-1),null);unsubscribe();
await assert.rejects(guest.join('../other'),/Invalid party code/);await assert.rejects(guest.join('f'.repeat(32)),/unavailable/);
const next=await host.create();assert.notEqual(next.partyId,party.partyId);
const entrants=await Promise.allSettled([guest.join(next.partyId),outsider.join(next.partyId)]);
assert.deepEqual(entrants.map(x=>x.status).sort(),['fulfilled','rejected'],'only one guest may claim the slot');
assert.equal(await guest.close(next.partyId),false);assert.equal(await host.close(next.partyId),true);await assert.rejects(guest.join(next.partyId),/unavailable/);
// Auth changes while an operation is in flight must not return a usable result.
const changing=auth('bob');const slow={...sdk,async get(path){changing.currentUser={uid:'eve'};return sdk.get(path);}};
const stale=createFirebasePartyLobby({...base,sdk:slow,auth:changing});await assert.rejects(stale.join(party.partyId),/identity changed/);
assert.throws(()=>createFirebasePartyLobby({...base,auth:auth('bad/uid')}),/Sign in/);
console.log('Firebase private party lobby client tests passed (mock SDK; rules untested).');
