import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPartySignOut} from '../core/party-signout.mjs';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const scope={partyId:'party',session:1},other={partyId:'other',session:1};
 let session=true,party=scope,canSignOut=true,requests=[],signouts=0,states=[],end=async()=>true;
 const controller=createPartySignOut({
  isSessionCurrent:value=>session&&value.session===1,
  isPartyCurrent:value=>party===value,
  canSignOutAfterClose:()=>canSignOut,
  requestEnd:value=>{requests.push(value);return end(value);},
  signOut:async()=>{signouts++;},onState:value=>states.push(value)
 });
 return {scope,other,controller,requests,states,get signouts(){return signouts;},setEnd:fn=>{end=fn;},setSession:value=>{session=value;},setParty:value=>{party=value;},setCanSignOut:value=>{canSignOut=value;}};
}

test('wait means an explicit end request and signs out only after that party really closes',async()=>{
 const f=fixture();assert.equal(await f.controller.choose(f.scope,'wait'),true);
 assert.deepEqual(f.requests,[f.scope]);assert.equal(f.controller.isWaiting(f.scope),true);assert.equal(f.signouts,0);
 assert.equal(await f.controller.completed(f.other),false);assert.equal(f.signouts,0);
 f.setParty(null);assert.equal(await f.controller.completed(f.scope),true);assert.equal(f.signouts,1);assert.equal(f.controller.isWaiting(f.scope),false);
 assert.equal(await f.controller.completed(f.scope),false);assert.equal(f.signouts,1);
});

test('cancelling the pending sign-out keeps the account signed in even if the ended party later closes',async()=>{
 const f=fixture();await f.controller.choose(f.scope,'wait');assert.equal(await f.controller.choose(f.scope,'cancel'),true);
 f.setParty(null);assert.equal(await f.controller.completed(f.scope),false);assert.equal(f.signouts,0);
});

test('a failed end request cannot silently become a delayed sign-out',async()=>{
 const f=fixture();f.setEnd(async()=>false);assert.equal(await f.controller.choose(f.scope,'wait'),false);assert.equal(f.controller.isWaiting(f.scope),false);assert.equal(f.states.at(-1),'failed');
 assert.equal(await f.controller.completed(f.scope),false);assert.equal(f.signouts,0);
 const g=fixture();g.setEnd(async()=>{throw Error('offline');});assert.equal(await g.controller.choose(g.scope,'wait'),false);assert.equal(g.signouts,0);
});

test('sign out now is immediate even with an indefinitely pending end request',async()=>{
 const f=fixture();let release;f.setEnd(()=>new Promise(resolve=>{release=resolve;}));const waiting=f.controller.choose(f.scope,'wait');await flush();
 assert.equal(f.controller.isWaiting(f.scope),true);assert.equal(await f.controller.choose(f.scope,'now'),true);assert.equal(f.signouts,1);
 release(true);await waiting;assert.equal(await f.controller.completed(f.scope),false);assert.equal(f.signouts,1);
});

test('completion racing the end command response signs out once, not after a later retry',async()=>{
 const f=fixture();let release;f.setEnd(()=>new Promise(resolve=>{release=resolve;}));const waiting=f.controller.choose(f.scope,'wait');await flush();
 f.setParty(null);assert.equal(await f.controller.completed(f.scope),true);assert.equal(f.signouts,1);release(false);await waiting;
 assert.equal(f.signouts,1);assert.notEqual(f.states.at(-1),'failed');
});

test('session changes, a replaced party and a new party after closure fence pending callbacks',async()=>{
 const f=fixture();f.setParty(f.other);assert.equal(await f.controller.choose(f.scope,'now'),false);assert.equal(f.signouts,0);
 const g=fixture();await g.controller.choose(g.scope,'wait');g.setSession(false);assert.equal(await g.controller.completed(g.scope),false);assert.equal(g.signouts,0);
 const h=fixture();await h.controller.choose(h.scope,'wait');h.setCanSignOut(false);assert.equal(await h.controller.completed(h.scope),false);assert.equal(h.signouts,0);
 const i=fixture();await i.controller.choose(i.scope,'wait');i.controller.reset();assert.equal(await i.controller.completed(i.scope),false);assert.equal(i.signouts,0);
});
