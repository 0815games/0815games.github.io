import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {applySoloWaveReward} from '../workshop-solo-reward.mjs';
import {initializeWireWorkshop,decodeWorkshop} from '../workshop-wire.mjs';
import {newRunReceiptId,receiptForBlock,waveCredit} from '../workshop-run-receipt.mjs';
import {WAVE_COUNT} from '../combat.mjs';
const runId='ab'.repeat(16);
const base=()=>({name:'Alice',xp:0,armory:{scrap:0,fortify:2,plating:0,owned:0,equipped:0},campaign:1,storyProgress:2});
const migrated=()=>initializeWireWorkshop(base());

test('solo receipts are random, run-scoped and reject invalid ids',()=>{
 const a=newRunReceiptId(),b=newRunReceiptId();assert.match(a,/^[a-f0-9]{32}$/);assert.match(b,/^[a-f0-9]{32}$/);assert.notEqual(a,b);
 assert.equal(receiptForBlock(runId,0),runId);assert.notEqual(receiptForBlock(runId,1),runId);assert.match(receiptForBlock(runId,3),/^[a-f0-9]{32}$/);
 assert.equal(receiptForBlock('bad',0),null);assert.equal(receiptForBlock(runId,-1),null);assert.equal(waveCredit(0),null);
 assert.deepEqual(waveCredit(1),{block:0,mask:1,receiptId:null});assert.deepEqual(waveCredit(WAVE_COUNT+2),{block:1,mask:2,receiptId:null});
});

test('first solo credit initializes the workshop and preserves legacy progress',()=>{
 const profile=base(),after=applySoloWaveReward(profile,{runId,wave:5});
 assert.ok(after,'credit must commit');assert.equal(profile.workshop,undefined,'input profile is not mutated');
 assert.equal(after.xp,70,'wave five pays 20 + 5 × 10 XP');assert.equal(after.armory.scrap,30);assert.equal(after.campaign,1);assert.equal(after.storyProgress,2);
 assert.equal(after.soloWorkshopReceipts[runId],1<<4);assert.ok(decodeWorkshop(after.workshop));
 assert.equal(applySoloWaveReward(after,{runId,wave:5}),null,'a repeated report is not credited twice');
});

test('later waves and blocks extend the same receipt without duplicate rewards',()=>{
 const profile=base(),five=applySoloWaveReward(profile,{runId,wave:5}),six=applySoloWaveReward(five,{runId,wave:6});
 assert.equal(six.soloWorkshopReceipts[runId],(1<<4)|(1<<5));assert.equal(six.armory.scrap,40,'two waves pay twenty regular scrap plus the one boss bonus');
 // Wave 21 starts a second receipt block; wave 20 is the last wave of the first.
 const block=applySoloWaveReward(six,{runId,wave:WAVE_COUNT+1}),id=receiptForBlock(runId,1);
 assert.equal(block.soloWorkshopReceipts[id],1);assert.notEqual(id,runId);assert.equal(block.soloWorkshopReceipts[runId],(1<<4)|(1<<5));
 const boss=WAVE_COUNT+5,scrap=block.armory.scrap,components=decodeWorkshop(block.workshop).components;
 const cleared=applySoloWaveReward(block,{runId,wave:boss});assert.equal(cleared.armory.scrap,scrap+30,'boss wave pays regular scrap plus the boss bonus');assert.equal(decodeWorkshop(cleared.workshop).components,components+1);
});

test('another run, campaign and corrupt saves do not cross-credit',()=>{
 const profile=base(),first=applySoloWaveReward(profile,{runId,wave:3});assert.ok(first);
 const other=applySoloWaveReward(first,{runId:'cd'.repeat(16),wave:3});assert.equal(other.xp,first.xp+50,'a new run earns its own wave three');
 assert.equal(applySoloWaveReward(profile,{runId,wave:3,campaign:true}),null,'campaign keeps legacy saving');
 assert.equal(applySoloWaveReward({...migrated(),workshop:'future'},{runId,wave:3}),null,'corrupt workshop is never replaced');
 assert.equal(applySoloWaveReward({...profile,xp:-1},{runId,wave:3}),null);
 assert.equal(applySoloWaveReward(profile,{runId:'bad',wave:3}),null);
 assert.equal(applySoloWaveReward(null,{runId,wave:3}),null);
});
