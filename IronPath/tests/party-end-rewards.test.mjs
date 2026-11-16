import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createCoopRewardQueue} from '../coop-rewards.mjs';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
const partyId='ab'.repeat(16);
function fixture(){
 const profile={name:'Alice',gender:'female',xp:0},auth={currentUser:{uid:'alice'}},pending=[],changes=[],writes=[],statuses=[];
 const sdk={ref:(_db,path)=>path,onValue(_path,fn){fn({val:()=>structuredClone(profile)});return()=>{};},
  runTransaction(_path,update){return new Promise((resolve,reject)=>pending.push({resolve:()=>{const value=update(structuredClone(profile));writes.push(value);if(value)Object.assign(profile,value);resolve({committed:!!value,snapshot:{val:()=>structuredClone(profile)}});},abort:()=>{writes.push(update(structuredClone(profile)));resolve({committed:false,snapshot:{val:()=>structuredClone(profile)}});},reject}));}};
 const queue=createCoopRewardQueue({db:{},auth,sdk,partyId,onStatus:status=>statuses.push(status),onChange:()=>changes.push({settled:queue.isSettled(),confirmed:queue.hasConfirmed(1)})});
 return {queue,pending,auth,profile,changes,writes,statuses};
}

test('a reward is not final until the transaction returns a matching server receipt',async()=>{
 const {queue,pending,profile,changes}=fixture();queue.observe(1);await flush();
 assert.equal(pending.length,1);assert.equal(queue.isSettled(),false);assert.equal(queue.hasConfirmed(1),false);
 pending.shift().resolve();await flush();
 assert.equal(profile.coopRewards[partyId],1);assert.equal(queue.isSettled(),true);assert.equal(queue.hasConfirmed(1),true);
 assert.equal(queue.hasConfirmed(3),false,'an unobserved second wave is not confirmed');
 assert.deepEqual(changes.at(-1),{settled:true,confirmed:true},'the coordinator is notified after the queue becomes idle');
 queue.close();assert.equal(queue.hasConfirmed(1),false,'a closed queue is not a live session proof');
});

test('a failed or abandoned credit cannot justify closing the party',async()=>{
 const {queue,pending,changes}=fixture();queue.observe(1);await flush();pending.shift().reject(Error('offline'));await flush();
 assert.equal(queue.isSettled(),false);assert.equal(queue.hasConfirmed(1),false);assert.equal(changes.at(-1).settled,false);
 queue.close();assert.equal(queue.isSettled(),false);assert.equal(queue.hasConfirmed(1),false);
});

test('account changes invalidate even a completed local queue proof',async()=>{
 const {queue,pending,auth}=fixture();queue.observe(1);await flush();pending.shift().resolve();await flush();assert.equal(queue.hasConfirmed(1),true);
 auth.currentUser={uid:'other'};assert.equal(queue.hasConfirmed(1),false);queue.close();
});

test('a matching snapshot from an aborted transaction is not server confirmation',async()=>{
 const {queue,pending,profile,statuses}=fixture();profile.coopRewards={[partyId]:1};
 queue.observe(1);await flush();assert.equal(pending.length,1);assert.equal(queue.hasConfirmed(1),false);
 // RTDB returns its current local input snapshot with committed:false when the
 // update callback aborts. It can include unsent local writes or stale cache.
 pending.shift().abort();await flush();
 assert.equal(queue.hasConfirmed(1),false,'an aborted transaction never proves a server receipt');
 assert.equal(queue.isSettled(),false);assert.equal(statuses.at(-1),'error');queue.close();
});

test('rechecking a previously credited wave performs a server-confirmed no-op without paying twice',async()=>{
 const {queue,pending,profile,writes,statuses}=fixture();profile.xp=30;profile.coopRewards={[partyId]:1};const before=structuredClone(profile);
 queue.observe(1);await flush();assert.equal(queue.hasConfirmed(1),false,'cached data alone is insufficient');
 pending.shift().resolve();await flush();
 assert.deepEqual(writes.at(-1),before,'the matching receipt must still be sent for a compare-and-set');
 assert.deepEqual(profile,before,'the no-op does not grant XP again');
 assert.equal(queue.hasConfirmed(1),true);assert.equal(statuses.at(-1),'confirmed');queue.close();
});

test('a compare-and-set retry that finds a concurrent receipt does not report a second credit',async()=>{
 const profile={name:'Alice',gender:'female',xp:0},auth={currentUser:{uid:'alice'}},statuses=[];
 const sdk={ref:(_db,path)=>path,onValue(_path,fn){fn({val:()=>structuredClone(profile)});return()=>{};},async runTransaction(_path,update){
  const tentative=update(structuredClone(profile));assert.equal(tentative.xp,30);
  // Another client committed this exact reward before our compare-and-set.
  Object.assign(profile,tentative);const retry=update(structuredClone(profile));assert.deepEqual(retry,profile);
  return {committed:true,snapshot:{val:()=>structuredClone(profile)}};
 }};
 const queue=createCoopRewardQueue({db:{},auth,sdk,partyId,onStatus:status=>statuses.push(status)});
 queue.observe(1);await flush();assert.equal(queue.hasConfirmed(1),true);assert.equal(profile.xp,30);assert.deepEqual(statuses,['confirmed']);queue.close();
});
