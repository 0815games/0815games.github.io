import { strict as assert } from 'node:assert';
import { createFirebasePartyChannel } from '../firebase-party-channel.mjs';

// Firebase-shaped in-memory mock; it tests transport behavior, NOT database rules.
const values=new Map(),listeners=new Map(),writes=[];
const sdk={ref:(_db,path)=>path,onValue(path,fn){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add(fn);fn({val:()=>values.get(path)??null});return ()=>listeners.get(path).delete(fn);},
  async set(path,value){writes.push(path);values.set(path,value);for(const fn of listeners.get(path)||[])fn({val:()=>value});},
  async update(path,updates){for(const [suffix,value] of Object.entries(updates))values.set(`${path}/${suffix}`,value);for(const suffix of Object.keys(updates)){const full=`${path}/${suffix}`;for(const fn of listeners.get(full)||[])fn({val:()=>values.get(full)});}}
};
const config={db:{},sdk,partyId:'randomPrivateId',hostId:'alice',playerIds:['alice','bob']};
const aliceAuth={currentUser:{uid:'alice'}},bobAuth={currentUser:{uid:'bob'}};
const errors=[];
const host=createFirebasePartyChannel({...config,auth:aliceAuth,onError:error=>errors.push(error.message)});
const guest=createFirebasePartyChannel({...config,auth:bobAuth});
let inputs=[],views=[];host.watchInputs((uid,packet)=>inputs.push({uid,packet}));guest.watchView(view=>views.push(view));
const command={version:1,seq:1,command:{type:'direction',x:1,y:0}};
await guest.writeInput(command);assert.deepEqual(inputs,[{uid:'bob',packet:command}]);assert.equal(writes[0],'parties/randomPrivateId/inputs/bob');
const snapshot={tick:1,match:{players:{},towers:[],shots:[]},receipts:[]};
await host.publishViews({alice:{...snapshot,private:'alice'},bob:snapshot});
assert.deepEqual(views,[snapshot],'empty arrays survive Firebase encoding');
assert.throws(()=>guest.watchInputs(()=>{}),/Host required/);
assert.throws(()=>guest.publishViews({alice:snapshot,bob:snapshot}),/Host required/);
assert.throws(()=>host.publishViews({alice:snapshot}),/Both player views/);
assert.throws(()=>guest.writeInput({data:'x'.repeat(5000)}),/too large/);
await sdk.set('parties/randomPrivateId/inputs/bob','not json');assert.deepEqual(errors,['Invalid party packet']);
await sdk.set('parties/randomPrivateId/inputs/bob','[]');assert.equal(errors.length,2);
assert.throws(()=>createFirebasePartyChannel({...config,auth:{currentUser:{uid:'eve'}}}),/Authenticated/);
assert.throws(()=>createFirebasePartyChannel({...config,partyId:'../escape',auth:aliceAuth}),/Invalid/);
bobAuth.currentUser={uid:'eve'};assert.throws(()=>guest.writeInput(command),/identity changed/);
await guest.close();await host.close();assert.throws(()=>host.watchInputs(()=>{}),/closed/);
console.log('Firebase party packet channel tests passed (mock SDK; no security rules tested).');

// Exercise the real shared host through the channel, still using the mock SDK.
const {createPartyHost}=await import('../party-host.mjs');
const {createMatch}=await import('../simulation.mjs');
const {createPlayer}=await import('../match.mjs');
const runtime=createPartyHost(createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]));
runtime.setPresence('alice',true);runtime.setPresence('bob',true);
const host2=createFirebasePartyChannel({...config,partyId:'anotherParty',auth:aliceAuth});
const guest2=createFirebasePartyChannel({...config,partyId:'anotherParty',auth:{currentUser:{uid:'bob'}}});
host2.watchInputs((id,envelope)=>runtime.receive(id,envelope));let latest;
guest2.watchView(snapshot=>{latest=snapshot;});
await guest2.writeInput({version:1,seq:1,command:{type:'build',pad:0,towerType:0}});
runtime.advance();await host2.publishViews({alice:runtime.snapshotFor('alice'),bob:runtime.snapshotFor('bob')});
assert.equal(latest.match.towers.length,1);assert.equal(latest.receipts[0].result.ok,true);
await guest2.close();await host2.close();

// Out-of-order completion cannot roll back a newer snapshot.
let unblock;const gate=new Promise(resolve=>{unblock=resolve;});const order=[];
const delayed={...sdk,async update(_path,patch){order.push(JSON.parse(patch['views/bob']).tick);if(order.length===1)await gate;}};
const host3=createFirebasePartyChannel({...config,partyId:'orderedParty',sdk:delayed,auth:aliceAuth});
const first=host3.publishViews({alice:{tick:1},bob:{tick:1}});
const second=host3.publishViews({alice:{tick:2},bob:{tick:2}});
await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(order,[1]);
unblock();await Promise.all([first,second]);assert.deepEqual(order,[1,2]);await host3.close();
