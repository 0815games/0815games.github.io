import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {creditSoloWave,legacyWaveReward} from '../workshop-solo-credit.mjs';
import {initializeWireWorkshop,decodeWorkshop} from '../workshop-wire.mjs';
import {rewardWave} from '../armory.mjs';
import {receiptForBlock} from '../workshop-run-receipt.mjs';
const runId='ab'.repeat(16);
const base=()=>initializeWireWorkshop({name:'Alice',gender:'female',xp:0,armory:{scrap:0,fortify:0,plating:0,owned:0,equipped:0}});
// Emulates RTDB. `reject` behaves like undeployed rules: writes that add
// workshop/receipt fields are refused while the legacy save still succeeds.
function fixture({reject=false,offline=false}={}){
 let data=base(),listening=false,stopped=0;
 const sdk={async runTransaction(_ref,update){
  if(offline)throw Error('offline');
  if(reject){const next=update(structuredClone(data));if(next&&(next.workshop!==data.workshop||next.soloWorkshopReceipts))return {committed:false,snapshot:{val:()=>structuredClone(data)}};if(next)data=next;return {committed:!!next,snapshot:{val:()=>structuredClone(data)}};}
  const next=update(structuredClone(data));if(next)data=next;
  return {committed:!!next,snapshot:{val:()=>structuredClone(data)}};
 }};
 return {sdk,get:()=>data,subscribe:async()=>{listening=true;return ()=>{listening=false;stopped++;};},state:()=>({listening,stopped}),setReject:value=>{reject=value;}};
}
const credit=(f,mode='workshop',run=runId)=>creditSoloWave({sdk:f.sdk,profileRef:'players/alice',amount:30,wave:5,runId:run,rewardWave,subscribe:f.subscribe,mode});

test('legacy helper only pays a valid, non-overflowing wave',()=>{
 assert.equal(legacyWaveReward({xp:0},30,5,rewardWave).xp,30);
 assert.equal(legacyWaveReward({xp:9999990},30,5,rewardWave),null);
 assert.equal(legacyWaveReward(null,30,5,rewardWave),null);
 assert.equal(legacyWaveReward({xp:0},30,0,rewardWave),null);
});

test('workshop credit keeps listeners open, then closes them',async()=>{
 const f=fixture(),outcome=await credit(f);
 assert.equal(outcome.status,'workshop');assert.equal(outcome.after.xp,70);assert.equal(outcome.after.armory.scrap,30);
 assert.equal(outcome.after.soloWorkshopReceipts[runId],16);assert.ok(decodeWorkshop(outcome.after.workshop));
 assert.equal(f.state().stopped,1);
});

test('rejected rules save the wave once with the legacy credit',async()=>{
 const f=fixture({reject:true}),workshop=f.get().workshop,outcome=await credit(f);
 assert.equal(outcome.status,'legacy-fallback');assert.equal(outcome.after.xp,30);
 assert.equal(outcome.after.workshop,workshop,'fallback leaves the workshop exactly as it was');
 assert.equal(outcome.after.soloWorkshopReceipts,undefined,'fallback writes no receipt');
 assert.equal(f.state().stopped,2,'both listeners were closed');
});

test('a replayed receipt is reported instead of being paid again',async()=>{
 const f=fixture();await credit(f);const before=f.get().xp;
 const again=await credit(f);assert.equal(again.status,'already-credited');assert.equal(f.get().xp,before);
});

test('legacy mode, including the session fallback, never touches receipts',async()=>{
 const f=fixture(),outcome=await credit(f,'legacy',null);
 assert.equal(outcome.status,'legacy');assert.equal(outcome.after.xp,30);assert.equal(outcome.after.soloWorkshopReceipts,undefined);
 assert.equal(receiptForBlock(null,0),null);
});

test('offline and corrupt input fail closed without double credit',async()=>{
 const f=fixture({offline:true}),outcome=await credit(f);
 assert.equal(outcome.status,'error');assert.equal(f.get().xp,0);
 assert.equal((await credit(fixture(),'workshop','bad')).status,'legacy','an invalid receipt id uses the legacy save');
 await assert.rejects(()=>creditSoloWave({sdk:{},rewardWave,subscribe:()=>()=>{}}),/Invalid solo credit/);
});
