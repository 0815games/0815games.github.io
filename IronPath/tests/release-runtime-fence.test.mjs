import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createRuntimeFence} from '../release-tools/runtime-fence.mjs';

const open={mode:'open',build:'build-1',epoch:'a'.repeat(32),authAfterMs:1700000000000};
function setup(overrides={}){
 const calls=[];let readyContext;
 const fence=createRuntimeFence({build:'build-1',onHold:r=>calls.push(`hold:${r}`),onReady:c=>{readyContext=c;calls.push('ready');},goOffline:()=>calls.push('offline'),signOut:()=>calls.push('signout'),replaceDocument:t=>calls.push(t),signOutTimeoutMs:20,...overrides});
 return {fence,calls,context:()=>readyContext};
}

test('remains blocked while checking and only starts once for the current open release',()=>{
 const {fence,calls,context}=setup();
 fence.accept({kind:'checking'});assert.deepEqual(calls,['hold:checking']);
 fence.accept({kind:'open',release:open});fence.accept({kind:'open',release:{...open}});
 assert.deepEqual(calls,['hold:checking','ready']);assert.equal(context().signal.aborted,false);assert.equal(fence.getPhase(),'active');
});

test('maintenance freezes and disconnects before notifying abort listeners, sign-out and navigation',async()=>{
 const {fence,calls,context}=setup();fence.accept({kind:'open',release:open});
 context().signal.addEventListener('abort',()=>calls.push('abort'));
 const done=fence.accept({kind:'maintenance'});
 assert.deepEqual(calls,['ready','hold:maintenance','offline','abort']);assert.equal(context().signal.aborted,true);
 await done;assert.deepEqual(calls,['ready','hold:maintenance','offline','abort','signout',{kind:'maintenance'}]);
 fence.accept({kind:'open',release:open});assert.equal(calls.length,6,'a terminated document cannot restart');
});

test('build, epoch or cutoff changes force a fresh versioned document',async()=>{
 for(const release of [{...open,build:'build-2'},{...open,epoch:'b'.repeat(32)},{...open,authAfterMs:1700000001000}]){
  const {fence,calls}=setup();fence.accept({kind:'open',release:open});await fence.accept({kind:'open',release});
  assert.deepEqual(calls.slice(-4),['hold:updating','offline','signout',{kind:'update',build:release.build}]);
 }
});

test('missing, malformed and unavailable status fail closed, including at startup',async()=>{
 for(const event of [undefined,{kind:'unavailable'},{kind:'open',release:{...open,build:'../bad'}},{kind:'open',release:{...open,mode:'maintenance'}}]){
  const {fence,calls}=setup();await fence.accept(event);
  assert.deepEqual(calls,['hold:unavailable','offline','signout',{kind:'maintenance'}]);
 }
});

test('a failure to show the initial blocked state cannot start the game',async()=>{
 const calls=[];
 const fence=createRuntimeFence({build:'build-1',onHold:reason=>{calls.push(`hold:${reason}`);if(reason==='checking')throw Error('ui');},
  onReady:()=>calls.push('ready'),goOffline:()=>calls.push('offline'),signOut:()=>calls.push('signout'),replaceDocument:target=>calls.push(target)});
 await fence.accept({kind:'checking'});fence.accept({kind:'open',release:open});
 assert.equal(fence.getPhase(),'terminated');
 assert.deepEqual(calls,['hold:checking','hold:unavailable','offline','signout',{kind:'maintenance'}]);
});

test('an asynchronous initial gate is rejected instead of starting unchecked',async()=>{
 const calls=[];
 const fence=createRuntimeFence({build:'build-1',onHold:async reason=>{calls.push(`hold:${reason}`);throw Error('late UI failure');},
  onReady:()=>calls.push('ready'),goOffline:()=>calls.push('offline'),signOut:()=>calls.push('signout'),replaceDocument:target=>calls.push(target)});
 await fence.accept({kind:'checking'});fence.accept({kind:'open',release:open});
 assert.deepEqual(calls,['hold:checking','hold:unavailable','offline','signout',{kind:'maintenance'}]);
});

test('reentrant stop during a synchronous teardown observes the same pending transition',async()=>{
 let fence,reentered;
 fence=createRuntimeFence({build:'build-1',onHold:reason=>{if(reason==='maintenance')reentered=fence.stop('logout');},
  onReady:()=>{},goOffline:()=>{},signOut:()=>{},replaceDocument:()=>{}});
 fence.accept({kind:'open',release:open});const done=fence.stop('maintenance');
 assert.ok(done instanceof Promise);assert.equal(reentered,done);await done;
});

test('explicit logout and fatal errors use the same one-way teardown',async()=>{
 for(const [reason,target] of [['logout',{kind:'entry'}],['maintenance',{kind:'maintenance'}],
  ['updating',{kind:'update'}],['unavailable',{kind:'maintenance'}]]){
  const {fence,calls,context}=setup();fence.accept({kind:'open',release:open});
  const done=fence.stop(reason);assert.equal(context().signal.aborted,true);
  assert.deepEqual(calls,['ready',`hold:${reason}`,'offline']);await done;
  assert.deepEqual(calls.slice(-2),['signout',target]);assert.equal(fence.getPhase(),'terminated');
  assert.equal(fence.stop(reason),done);
 }
 assert.throws(()=>setup().fence.stop('arbitrary-redirect'),/Invalid teardown reason/);
});

test('teardown proceeds despite throwing or hanging callbacks and asynchronous startup failure',async()=>{
 let target;
 const {fence}=setup({onHold:()=>{throw Error('ui');},goOffline:()=>{throw Error('offline');},signOut:()=>new Promise(()=>{}),replaceDocument:t=>{target=t;},signOutTimeoutMs:5});
 await fence.accept({kind:'maintenance'});assert.deepEqual(target,{kind:'maintenance'});
 const failed=setup({onReady:async()=>{throw Error('startup');}});failed.fence.accept({kind:'open',release:open});
 await new Promise(resolve=>setTimeout(resolve,20));
 assert.equal(failed.fence.getPhase(),'terminated');assert.deepEqual(failed.calls.slice(-4),['hold:unavailable','offline','signout',{kind:'maintenance'}]);
});
