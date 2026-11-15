import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {isAuthAfterCutoff,parseReleaseControl} from '../release-tools/release-control.mjs';
import {prepareReleaseControlWrite} from '../release-tools/release-control-write.mjs';
import {createReleaseSessionExchange} from '../release-tools/session-exchange.mjs';

const epochA='a'.repeat(32), epochB='b'.repeat(32);
const newEpoch=()=>Buffer.from(epochB,'hex'); // deterministic fixture only

test('a transition prepares one server-timestamped control record for an atomic write',()=>{
 const input={mode:'open',build:'test-2',currentEpoch:epochA};
 const write=prepareReleaseControlWrite(input,newEpoch);
 assert.deepEqual(write,{mode:'open',build:'test-2',epoch:epochB,authAfterMs:{'.sv':'timestamp'}});
 assert.equal(parseReleaseControl(write),null,'the unresolved server sentinel never admits a client');
 assert.deepEqual(input,{mode:'open',build:'test-2',currentEpoch:epochA});
 assert.equal(prepareReleaseControlWrite({mode:'maintenance',build:'test-1',currentEpoch:null}).epoch.length,32);
});

test('transition preparation rejects malformed inputs, bad randomness and reusing the current epoch',()=>{
 const valid={mode:'open',build:'test-2',currentEpoch:epochA};
 for(const bad of [null,[],{}, {...valid,mode:'reopen'}, {...valid,build:'../other'},
  {...valid,currentEpoch:'bad'}, {...valid,extra:true}]) {
  assert.throws(()=>prepareReleaseControlWrite(bad,newEpoch),/Invalid release transition/);
 }
 assert.throws(()=>prepareReleaseControlWrite(valid,()=>null),/Secure release epoch unavailable/);
 assert.throws(()=>prepareReleaseControlWrite(valid,()=>Buffer.alloc(15)),/Secure release epoch unavailable/);
 assert.throws(()=>prepareReleaseControlWrite(valid,()=>Buffer.from(epochA,'hex')),/must change/);
});

test('millisecond cutoff rejects the entire cutoff second and malformed or legacy fields',()=>{
 assert.equal(isAuthAfterCutoff(1000,1000500),false);
 assert.equal(isAuthAfterCutoff(1001,1000500),true);
 assert.equal(isAuthAfterCutoff(1001,1001000),false);
 for(const value of [undefined,null,'1001',1.1,0,-1,Number.MAX_SAFE_INTEGER,Symbol('bad')]) {
  assert.equal(isAuthAfterCutoff(value,1000500),false);
 }
 for(const value of [undefined,null,'1000500',1.1,0,-1,Number.MAX_SAFE_INTEGER+1]) {
  assert.equal(isAuthAfterCutoff(1001,value),false);
 }
 const legacy={mode:'open',build:'test-1',epoch:epochA,authAfter:1000};
 assert.equal(parseReleaseControl(legacy),null,'an old seconds-based control cannot silently open');
});

test('an authentication between an earlier sampled time and actual reopening is not exchanged',async()=>{
 const identity={uid:'alice',auth_time:1001,firebase:{sign_in_provider:'password'}};
 let control={mode:'open',build:'test-2',epoch:epochB,authAfterMs:1001900},signed=0;
 const exchange=createReleaseSessionExchange({readControl:async()=>control,verifyIdToken:async()=>identity,
  mintCustomToken:async()=>{signed++;return 'signed';},now:()=>1003000});
 assert.deepEqual(await exchange.exchange({idToken:'id-token',build:'test-2'}),{status:'unauthorized'});
 assert.equal(signed,0);
 // Characterize the bug: using a sample taken before the opening write would
 // wrongly accept that very same authentication. This is not an actual write.
 control={...control,authAfterMs:1000500};
 assert.deepEqual(await exchange.exchange({idToken:'id-token',build:'test-2'}),{status:'ok',customToken:'signed'});
 assert.equal(signed,1);
});
