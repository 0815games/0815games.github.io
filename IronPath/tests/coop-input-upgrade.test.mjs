import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createCoopInput} from '../coop-input.mjs';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
const upgrade={type:'upgrade',pad:0,branch:0,expectedTowerId:7,expectedLevel:1};
function fixture(){
 const calls=[],resolvers=[];
 const input=createCoopInput({command(command){calls.push(command);return new Promise(resolve=>resolvers.push(resolve));}});
 input.setEnabled(true);return {input,calls,resolvers};
}

test('an explicitly guarded upgrade waits behind movement and its release exactly once',async()=>{
 const {input,calls,resolvers}=fixture();let notified=0;
 void input.direction({type:'direction',x:1,y:0});
 void input.direction({type:'direction',x:0,y:0});
 const result=input.execute(upgrade,{waitForTower:true,isCurrent:()=>true,onQueued:()=>notified++});
 assert.equal(notified,1);assert.equal(calls.length,1);
 assert.match((await input.execute(upgrade,{waitForTower:true,isCurrent:()=>true})).reason,/previous action/i);
 resolvers.shift()({ok:true});await flush();assert.deepEqual(calls[1],{type:'direction',x:0,y:0});
 resolvers.shift()({ok:true});await flush();assert.deepEqual(calls[2],upgrade);
 resolvers.shift()({ok:true});assert.equal((await result).ok,true);assert.equal(calls.length,3);
});

test('a guarded upgrade can wait behind reservation cleanup but not another purchase',async()=>{
 const f=fixture();const release=f.input.execute({type:'releaseBuild',pad:1});
 const upgradeResult=f.input.execute(upgrade,{waitForTower:true,isCurrent:()=>true});
 assert.equal(f.calls.length,1);f.resolvers.shift()({ok:true});await release;await flush();
 assert.deepEqual(f.calls[1],upgrade);f.resolvers.shift()({ok:true});assert.equal((await upgradeResult).ok,true);
 const build=f.input.execute({type:'build',pad:2,towerType:0});
 assert.match((await f.input.execute(upgrade,{waitForTower:true,isCurrent:()=>true})).reason,/previous action/i);
 f.resolvers.shift()({ok:true});await build;assert.equal(f.calls.length,3);
});

test('closing the menu, a disconnect, or a timeout prevents a deferred upgrade',async()=>{
 for(const reason of ['changed','disconnect','timeout']){
  const f=fixture();let current=true;void f.input.direction({type:'direction',x:0,y:0});
  const result=f.input.execute(upgrade,{waitForTower:true,isCurrent:()=>current,maxWaitMs:reason==='timeout'?20:2000});
  if(reason==='changed')current=false;
  if(reason==='disconnect'){f.input.setEnabled(false);f.input.setEnabled(true);}
  if(reason==='timeout')await new Promise(resolve=>setTimeout(resolve,35));
  f.resolvers.shift()({ok:true});assert.equal((await result).ok,false,reason);await flush();assert.equal(f.calls.length,1,reason);
 }
});

test('unguarded upgrades and other tower commands are never queued',async()=>{
 const f=fixture();void f.input.direction({type:'direction',x:1,y:0});
 assert.match((await f.input.execute(upgrade,{waitForTower:true})).reason,/previous action/i);
 assert.match((await f.input.execute({type:'sell',pad:0},{waitForTower:true,isCurrent:()=>true})).reason,/previous action/i);
 f.resolvers.shift()({ok:true});await flush();assert.equal(f.calls.length,1);
});
