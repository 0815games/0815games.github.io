import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createCoopInput} from '../core/coop-input.mjs';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const calls=[],resolvers=[];
 const input=createCoopInput({command(command){calls.push(command);return new Promise(resolve=>resolvers.push(resolve));}});
 input.setEnabled(true);return {input,calls,resolvers};
}

test('a single vote can wait behind movement, without delaying a queued release or duplicating a tap',async()=>{
 const {input,calls,resolvers}=fixture();let notified=0;
 void input.direction({type:'direction',x:1,y:0});
 void input.direction({type:'direction',x:0,y:0});
 const request=input.execute({type:'requestSpeed'},{waitForDirection:true,isCurrent:()=>true,onQueued:()=>notified++});
 assert.equal(notified,1);assert.deepEqual(calls,[{type:'direction',x:1,y:0}]);
 assert.match((await input.execute({type:'requestSpeed'},{waitForDirection:true,isCurrent:()=>true})).reason,/previous action/i);
 resolvers.shift()({ok:true});await flush();assert.deepEqual(calls[1],{type:'direction',x:0,y:0});
 resolvers.shift()({ok:true});await flush();assert.deepEqual(calls[2],{type:'requestSpeed'});
 assert.match((await input.execute({type:'requestSpeed'},{waitForDirection:true,isCurrent:()=>true})).reason,/previous action/i);
 resolvers.shift()({ok:true});assert.equal((await request).ok,true);assert.equal(calls.length,3);
});

test('a disconnected and reconnected session never sends the previously queued vote',async()=>{
 const {input,calls,resolvers}=fixture();void input.direction({type:'direction',x:1,y:0});
 const request=input.execute({type:'startWave'},{waitForDirection:true,isCurrent:()=>true});
 input.setEnabled(false);input.setEnabled(true);
 assert.match((await request).reason,/cancelled|connection/i);
 void input.direction({type:'direction',x:0,y:0});
 resolvers.shift()({ok:true});await flush();assert.deepEqual(calls[1],{type:'direction',x:0,y:0});
 resolvers.shift()({ok:true});await flush();assert.equal(calls.length,2);
});

test('a roster or request change invalidates a vote waiting behind movement',async()=>{
 const {input,calls,resolvers}=fixture();let current=true;void input.direction({type:'direction',x:1,y:0});
 const request=input.execute({type:'approveWave',requestId:4},{waitForDirection:true,isCurrent:()=>current});
 current=false;resolvers.shift()({ok:true});assert.match((await request).reason,/changed/i);await flush();
 assert.equal(calls.length,1,'a stale approval must never reach the transport');
});

test('a stalled movement times out a queued vote without sending it later',async()=>{
 const {input,calls,resolvers}=fixture();void input.direction({type:'direction',x:1,y:0});
 const request=input.execute({type:'startWave'},{waitForDirection:true,isCurrent:()=>true,maxWaitMs:20});
 assert.match((await request).reason,/wait|previous/i);resolvers.shift()({ok:true});await flush();assert.equal(calls.length,1);
});

test('a vote is not queued behind another discrete action',async()=>{
 const {input,calls,resolvers}=fixture();const build=input.execute({type:'build',pad:0,towerType:0});
 const vote=await input.execute({type:'startWave'},{waitForDirection:true,isCurrent:()=>true});assert.match(vote.reason,/previous action/i);
 resolvers.shift()({ok:true});await build;await flush();assert.equal(calls.length,1);
});

test('only explicitly guarded vote commands may wait behind movement',async()=>{
 const {input,calls,resolvers}=fixture();void input.direction({type:'direction',x:1,y:0});
 assert.match((await input.execute({type:'startWave'},{waitForDirection:true})).reason,/previous action/i);
 assert.match((await input.execute({type:'build',pad:0,towerType:0},{waitForDirection:true,isCurrent:()=>true})).reason,/previous action/i);
 resolvers.shift()({ok:true});await flush();assert.equal(calls.length,1);
});
