import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {sameMaintenanceControl,transitionMaintenance} from '../admin-maintenance.mjs';

const open={format:1,mode:'open',authAfterMs:1000},closed={...open,mode:'maintenance'};
function fixture(initial=open){
 let state=structuredClone(initial),loggedIn=true,calls=0,now=5000;
 const deps={probe:async()=>structuredClone(state),readCurrent:async()=>structuredClone(state),serverTimestamp:()=>({'.sv':'timestamp'}),isCurrent:()=>loggedIn,
  transact:async reducer=>{calls++;const next=reducer(structuredClone(state));if(next===undefined)return {committed:false,snapshot:{val:()=>structuredClone(state)}};
   state={...next,authAfterMs:typeof next.authAfterMs==='object'?now:next.authAfterMs};return {committed:true,snapshot:{val:()=>structuredClone(state)}};}};
 return {deps,set:value=>{state=structuredClone(value);},logout:()=>{loggedIn=false;},getState:()=>state,get calls(){return calls;}};
}

test('close preserves the cutoff; reopening uses a fresh server timestamp and confirms the public record',async()=>{
 const f=fixture();const close=await transitionMaintenance({...f.deps,expected:open,target:'maintenance'});
 assert.deepEqual(close,{kind:'confirmed',control:closed});assert.deepEqual(f.getState(),closed);
 const reopen=await transitionMaintenance({...f.deps,expected:closed,target:'open'});
 assert.deepEqual(reopen,{kind:'confirmed',control:{...open,authAfterMs:5000}});assert.equal(f.calls,2);
});

test('changed or unavailable public and SDK reads never start a write',async()=>{
 const f=fixture();f.set(closed);
 assert.deepEqual(await transitionMaintenance({...f.deps,expected:open,target:'maintenance'}),{kind:'changed',control:closed});assert.equal(f.calls,0);
 const unavailable=await transitionMaintenance({...f.deps,expected:open,target:'maintenance',probe:async()=>null});
 assert.deepEqual(unavailable,{kind:'unavailable'});assert.equal(f.calls,0);
 f.set(open);const stale=await transitionMaintenance({...f.deps,expected:open,target:'maintenance',readCurrent:async()=>closed});
 assert.deepEqual(stale,{kind:'changed',control:closed});assert.equal(f.calls,0);
});

test('an operator change during a transaction aborts rather than overwriting the new record',async()=>{
 const f=fixture();const newer={...closed,authAfterMs:2000};
 const result=await transitionMaintenance({...f.deps,expected:open,target:'maintenance',transact:async reducer=>{
  f.set(newer);assert.equal(reducer(newer),undefined);return {committed:false,snapshot:{val:()=>newer}};
 }});
 assert.deepEqual(result,{kind:'changed',control:newer});assert.deepEqual(f.getState(),newer);
});

test('account changes cancel before a write; an acknowledgement after logout is not misreported',async()=>{
 const f=fixture();
 const cancelled=await transitionMaintenance({...f.deps,expected:open,target:'maintenance',readCurrent:async()=>{f.logout();return open;}});
 assert.deepEqual(cancelled,{kind:'cancelled'});assert.equal(f.calls,0);
 const g=fixture();const unknown=await transitionMaintenance({...g.deps,expected:open,target:'maintenance',transact:async reducer=>{
  assert.deepEqual(reducer(open),closed);g.logout();return {committed:true};
 }});
 assert.deepEqual(unknown,{kind:'unconfirmed'});
});

test('a confirmed write without a subsequent fresh matching read remains unconfirmed',async()=>{
 const f=fixture();let reads=0;
 const result=await transitionMaintenance({...f.deps,expected:open,target:'maintenance',probe:async()=>++reads===1?open:null});
 assert.deepEqual(result,{kind:'unconfirmed',control:null});assert.deepEqual(f.getState(),closed);assert.equal(f.calls,1);
});

test('invalid records, targets and client-generated timestamps fail closed',async()=>{
 assert.equal(sameMaintenanceControl({...open,extra:true},open),false);
 for(const expected of [null,{...open,authAfterMs:-1},{...open,mode:'bad'}])await assert.rejects(transitionMaintenance({expected,target:'open'}));
 const f=fixture(closed);
 await assert.rejects(transitionMaintenance({...f.deps,expected:closed,target:'open',serverTimestamp:()=>Date.now()}),/timestamp/);assert.equal(f.calls,0);
 await assert.rejects(transitionMaintenance({...f.deps,expected:closed,target:'maintenance'}),/Invalid/);
});

test('an unresolved Firebase transaction is not treated as a timeout or retried',async()=>{
 const f=fixture();let release,attempts=0;const pending=new Promise(resolve=>{release=resolve;});
 let finished=false;
 const work=transitionMaintenance({...f.deps,expected:open,target:'maintenance',transact:async reducer=>{attempts++;await pending;return {committed:!!reducer(open)};}}).then(value=>{finished=true;return value;});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(finished,false);assert.equal(attempts,1);
 release();const result=await work;assert.equal(result.kind,'unconfirmed');assert.equal(attempts,1);
});
