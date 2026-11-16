import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPartyEndCoordinator} from '../party-end-coordinator.mjs';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
const ids=['alice','bob','cara'];
function fixture(uid='alice'){
 let current=true,settled=false,confirmed=0,sends=[],closes=[],timers=new Map(),nextTimer=0;
 const queues=new Map([[0,{isSettled:()=>settled,hasConfirmed:mask=>(confirmed&mask)===mask}]]);
 const coordinator=createPartyEndCoordinator({uid,hostId:'alice',playerIds:ids,getQueues:()=>queues,isCurrent:()=>current,
  send:async tick=>{sends.push(tick);return {ok:true};},onClose:async tick=>{closes.push(tick);return true;},
  setTimer:fn=>{const id=++nextTimer;timers.set(id,fn);return id;},clearTimer:id=>timers.delete(id)});
 const frame=(acknowledged=[],overrides={})=>({partyEnd:{tick:10,acknowledged},snapshotTick:12,ended:true,reportReady:true,masks:{0:3},...overrides});
 return {coordinator,frame,queues,sends,closes,setReady:(s,c)=>{settled=s;confirmed=c;},changeSession:()=>{current=false;},timer:()=>{const entry=timers.entries().next().value;if(entry){timers.delete(entry[0]);entry[1]();}},get timerCount(){return timers.size;}};
}

test('the host waits for its report, server-confirmed final masks, and every individual acknowledgement',async()=>{
 const f=fixture();f.coordinator.observeReward(0,3);f.coordinator.observe(f.frame([], {reportReady:false}));await flush();assert.deepEqual(f.sends,[]);
 f.coordinator.observe(f.frame());await flush();assert.deepEqual(f.sends,[],'an outstanding transaction is not proof');
 f.setReady(true,1);f.coordinator.refresh();await flush();assert.deepEqual(f.sends,[],'a partial receipt is not proof');
 f.setReady(true,3);f.coordinator.refresh();await flush();assert.deepEqual(f.sends,[10]);assert.deepEqual(f.closes,[],'a successful local send is not a roster acknowledgement');
 f.coordinator.observe(f.frame(['alice','bob']));await flush();assert.deepEqual(f.closes,[],'Cara has not confirmed');
 f.coordinator.observe(f.frame(ids));await flush();assert.deepEqual(f.closes,[10]);
 f.coordinator.stop();assert.equal(f.timerCount,0);
});

test('a guest acknowledges only after saving but never closes the host party',async()=>{
 const f=fixture('bob');f.setReady(true,3);f.coordinator.observeReward(0,3);f.coordinator.observe(f.frame());await flush();assert.deepEqual(f.sends,[10]);
 f.coordinator.observe(f.frame(ids));await flush();assert.deepEqual(f.closes,[]);f.coordinator.stop();
});

test('retries and time alone cannot turn an unknown write into an acknowledgement',async()=>{
 const f=fixture();f.setReady(true,3);f.coordinator.observeReward(0,3);f.coordinator.observe(f.frame());await flush();assert.deepEqual(f.sends,[10]);
 f.timer();await flush();assert.deepEqual(f.sends,[10,10]);assert.deepEqual(f.closes,[]);
 f.changeSession();f.timer();f.coordinator.refresh();await flush();assert.deepEqual(f.sends,[10,10]);assert.deepEqual(f.closes,[]);f.coordinator.stop();
});

test('a missing final reward block, changed final mask or malformed acknowledgement fails closed',async()=>{
 const f=fixture();f.setReady(true,3);f.coordinator.observeReward(0,3);f.coordinator.observeReward(1,1);f.coordinator.observe(f.frame(ids));await flush();
 assert.deepEqual(f.sends,[]);assert.deepEqual(f.closes,[],'previously observed block cannot disappear from the final report');f.coordinator.stop();
 const g=fixture();g.setReady(true,3);g.coordinator.observeReward(0,3);g.coordinator.observe(g.frame(['alice','bob','stranger']));await flush();assert.deepEqual(g.closes,[]);g.coordinator.stop();
 const h=fixture();h.setReady(false,0);h.coordinator.observeReward(0,1);h.coordinator.observe(h.frame([], {masks:{0:1}}));h.coordinator.observeReward(0,3);h.coordinator.observe(h.frame(ids));h.setReady(true,3);h.coordinator.refresh();await flush();assert.deepEqual(h.closes,[],'a final mask must not mutate after the intent');h.coordinator.stop();
});

test('an in-flight close is not duplicated or inferred from a timeout',async()=>{
 let resolve,closeCalls=0;const f=fixture();f.coordinator.stop();
 const queue={isSettled:()=>true,hasConfirmed:()=>true};
 const c=createPartyEndCoordinator({uid:'alice',hostId:'alice',playerIds:ids,getQueues:()=>new Map([[0,queue]]),send:async()=>({ok:true}),onClose:()=>{closeCalls++;return new Promise(r=>{resolve=r;});},setTimer:()=>1,clearTimer:()=>{}});
 c.observeReward(0,3);c.observe(f.frame(ids));await flush();c.observe(f.frame(ids));c.refresh();await flush();assert.equal(closeCalls,1);resolve(false);await flush();assert.equal(closeCalls,1);c.stop();
});
