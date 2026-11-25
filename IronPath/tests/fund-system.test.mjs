// IPL-0138 "Fund-System": every completed wave rolls one find from the ten
// pieces the account is still missing. The old wave 2/4/.../20 anchors are
// gone — the wave is the single source (no chest, no second shop drop) — and a
// find only ever sets `owned`: wearing it stays the player's choice in the
// report (TAKE) or the store (STORE).
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {ITEMS,readArmory,rewardWave,FIND_CHANCE} from '../core/armory.mjs';
import {rewardDelta} from '../core/run-results.mjs';

test('the find rolls on every wave, never on an anchor schedule',()=>{
  // A cold roll pays plain scrap and grants nothing — wave 2 is no longer special.
  const cold=rewardWave(readArmory(null),2,()=>1);
  assert.equal(cold.owned,0,'wave 2 grants nothing without a find');
  assert.equal(cold.scrap,10);
  // A sure roll on a non-anchor wave still finds: the schedule is gone.
  const found=rewardWave(readArmory(null),7,()=>0);
  assert.equal(found.owned,1,'the sure roll takes the first missing piece');
  assert.ok(FIND_CHANCE>0&&FIND_CHANCE<1,'the chance is a real probability');
});
test('finds never duplicate and never touch the worn state',()=>{
  let a=readArmory({owned:0b101,scrap:0});
  for(let wave=1;wave<=30;wave++)a=rewardWave(a,wave,()=>0);
  assert.equal(a.owned,1023,'sure rolls fill the locker exactly once each');
  for(let wave=31;wave<=40;wave++)a=rewardWave(a,wave,()=>0);
  assert.equal(a.owned,1023,'a full locker finds nothing more');
  const worn=readArmory({owned:0,equipped:0,scrap:0});
  const after=rewardWave(worn,3,()=>0);
  assert.equal(after.equipped,0,'the find offers the piece; it never wears it by itself');
});
test('the report delta names found pieces for the TAKE / STORE choice',()=>{
  const before={xp:0,armory:{scrap:0,owned:0b011}},after={xp:0,armory:{scrap:10,owned:0b111}};
  const delta=rewardDelta(before,after);
  assert.deepEqual(delta.items,['Combat Boots']);
  assert.deepEqual(delta.foundIds,['legacy-3'],'the id goes straight to the equip toggle');
  const none=rewardDelta(after,after);
  assert.deepEqual(none.foundIds,[],'nothing found, nothing offered');
});
