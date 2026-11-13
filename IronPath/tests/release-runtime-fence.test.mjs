import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createRuntimeFence} from '../release-tools/runtime-fence.mjs';

const open={mode:'open',build:'build-1',epoch:'a'.repeat(32),authAfter:1700000000};
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

test('maintenance synchronously freezes, aborts and disconnects before sign-out and navigation',async()=>{
 const {fence,calls,context}=setup();fence.accept({kind:'open',release:open});
 const done=fence.accept({kind:'maintenance'});
 assert.deepEqual(calls,['ready','hold:maintenance','offline']);assert.equal(context().signal.aborted,true);
 await done;assert.deepEqual(calls,['ready','hold:maintenance','offline','signout',{kind:'maintenance'}]);
 fence.accept({kind:'open',release:open});assert.equal(calls.length,5,'a terminated document cannot restart');
});

test('build, epoch or cutoff changes force a fresh versioned document',async()=>{
 for(const release of [{...open,build:'build-2'},{...open,epoch:'b'.repeat(32)},{...open,authAfter:1700000001}]){
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

test('teardown proceeds despite throwing or hanging callbacks and asynchronous startup failure',async()=>{
 let target;
 const {fence}=setup({onHold:()=>{throw Error('ui');},goOffline:()=>{throw Error('offline');},signOut:()=>new Promise(()=>{}),replaceDocument:t=>{target=t;},signOutTimeoutMs:5});
 await fence.accept({kind:'maintenance'});assert.deepEqual(target,{kind:'maintenance'});
 const failed=setup({onReady:async()=>{throw Error('startup');}});failed.fence.accept({kind:'open',release:open});
 await new Promise(resolve=>setTimeout(resolve,20));
 assert.equal(failed.fence.getPhase(),'terminated');assert.deepEqual(failed.calls.slice(-4),['hold:unavailable','offline','signout',{kind:'maintenance'}]);
});
