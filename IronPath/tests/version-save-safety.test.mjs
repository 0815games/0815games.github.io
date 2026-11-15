import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createScoreReporter} from '../leaderboards.mjs';
import {createCoopRewardQueue} from '../coop-rewards.mjs';

const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};

test('a high-score retry is unsafe until the server confirms the highest queued wave',async()=>{
 const write=deferred();let call=0;
 const reporter=createScoreReporter({service:{record:(_mode,wave)=>{call++;return call===1?write.promise:Promise.resolve({wave});}},getName:()=> 'Alice'});
 assert.equal(reporter.isSettled(),true);reporter.observe('solo',1);reporter.observe('solo',4);assert.equal(reporter.isSettled(),false);
 write.resolve({wave:1});await tick();assert.equal(call,2);assert.equal(reporter.isSettled(),true);await reporter.close();
});

test('a closing score reporter can confirm its in-flight save, but cannot silently drop a later score',async()=>{
 for(const later of [false,true]){
  const save=deferred(),reporter=createScoreReporter({service:{record:()=>save.promise},getName:()=> 'Alice'});
  reporter.observe('solo',1);if(later)reporter.observe('solo',2);const closed=reporter.close();
  assert.equal(reporter.isSettled(),false);save.resolve({wave:1});await closed;await tick();assert.equal(reporter.isSettled(),!later);
 }
});

test('co-op reward queues remain unsafe during subscription, pending write and retry',async()=>{
 const subscription=deferred(),write=deferred(),auth={currentUser:{uid:'alice'}},profile={name:'Alice',gender:'female',xp:0};
 const sdk={ref:(_db,path)=>path,onValue(_ref,cb){subscription.promise.then(()=>cb({val:()=>profile}));return ()=>{};},runTransaction:()=>write.promise};
 const q=createCoopRewardQueue({db:{},auth,sdk,partyId:'a'.repeat(32)});
 assert.equal(q.isSettled(),true);q.observe(1);assert.equal(q.isSettled(),false,'the subscription itself can still lead to a write');
 subscription.resolve();await tick();assert.equal(q.isSettled(),false,'a pending transaction is not confirmed');
 write.resolve({committed:false,snapshot:{val:()=>({...profile,coopRewards:{['a'.repeat(32)]:1}})}});await tick();assert.equal(q.isSettled(),true,'a previously credited receipt is confirmation');q.close();assert.equal(q.isSettled(),true);
});

test('a co-op reward already being written can still be confirmed after close',async()=>{
 const write=deferred(),auth={currentUser:{uid:'alice'}},profile={name:'Alice',gender:'female',xp:0};
 const q=createCoopRewardQueue({db:{},auth,sdk:{ref:(_db,path)=>path,onValue:(_ref,cb)=>{queueMicrotask(()=>cb({val:()=>profile}));return ()=>{};},runTransaction:()=>write.promise},partyId:'a'.repeat(32)});
 q.observe(1);await tick();q.close();assert.equal(q.isSettled(),false);
 write.resolve({committed:false,snapshot:{val:()=>({...profile,coopRewards:{['a'.repeat(32)]:1}})}});await tick();
 assert.equal(q.isSettled(),true,'the acknowledged in-flight receipt is not abandoned');
});

test('closing an unresolved co-op reward never reports a safe update point',async()=>{
 const subscription=deferred(),auth={currentUser:{uid:'alice'}};
 const q=createCoopRewardQueue({db:{},auth,sdk:{ref:(_db,path)=>path,onValue:(_ref,cb)=>{subscription.promise.then(cb);return ()=>{};},runTransaction:()=>assert.fail('closed queue must not write')},partyId:'a'.repeat(32)});
 q.observe(1);q.close();subscription.resolve({val:()=>({xp:0})});await tick();assert.equal(q.isSettled(),false);
});
