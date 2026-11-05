import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {ECONOMY,incomeAfter,wavesUntilAffordable,starterReport} from '../workshop-economy.mjs';
import {RECIPES,MOD_SCRAP,migrateWorkshop,craftWorkshop} from '../workshop-model.mjs';

test('income matches the live reward: ten scrap per wave, a boss every fifth wave',()=>{
 assert.deepEqual(incomeAfter(0),{waves:0,scrap:0,components:0,bosses:0});
 assert.deepEqual(incomeAfter(4),{waves:4,scrap:40,components:0,bosses:0});
 assert.deepEqual(incomeAfter(5),{waves:5,scrap:70,components:1,bosses:1});
 assert.deepEqual(incomeAfter(10),{waves:10,scrap:140,components:2,bosses:2});
 assert.deepEqual(incomeAfter(-3),{waves:0,scrap:0,components:0,bosses:0});
 // An already-owned unlock wave pays duplicate scrap instead of a new item.
 assert.equal(incomeAfter(4,[2]).scrap,50);
});

test('the catalogue price and the economy model agree, so a re-tune cannot drift',()=>{
 for(const [id,recipe] of Object.entries(RECIPES))assert.deepEqual({scrap:recipe.scrap,components:recipe.components},ECONOMY.itemCosts[id],[id]);
 assert.equal(MOD_SCRAP,ECONOMY.modScrap);
});

test('crafting from scratch is a goal, not a single-wave giveaway',()=>{
 const report=starterReport();
 const boots=report.find(row=>row.id==='boots'),gun=report.find(row=>row.id==='marksman');
 assert.equal(boots.wavesFromScratch,5,'50 scrap needs the wave-five boss payout');
 assert.equal(gun.wavesFromScratch,11,'a component item needs a boss wave plus scrap');
 // The reported wave count is exactly when the wallet can pay.
 for(const row of report){
  const income=incomeAfter(row.wavesFromScratch);
  assert.ok(income.scrap>=row.scrap,`${row.id} needs the scrap at wave ${row.wavesFromScratch}`);
  assert.ok(income.components>=row.components,`${row.id} needs the components at wave ${row.wavesFromScratch}`);
  if(row.wavesFromScratch>1){const before=incomeAfter(row.wavesFromScratch-1);assert.ok(before.scrap<row.scrap||before.components<row.components,`${row.id} should not be affordable a wave earlier`);}
 }
});

test('wavesUntilAffordable accounts for a partial wallet',()=>{
 assert.equal(wavesUntilAffordable('boots',{scrap:50,components:0},{scrap:10,components:0}),4);
 assert.equal(wavesUntilAffordable('boots',{scrap:50,components:0},{scrap:50,components:0}),0);
 assert.equal(wavesUntilAffordable('marksman',{scrap:150,components:1},{scrap:200,components:0}),5,'missing component dominates');
 assert.equal(wavesUntilAffordable('marksman',{scrap:150,components:1},{scrap:0,components:1}),11);
});

test('the model agrees with real crafting at the reported price point',()=>{
 for(const row of starterReport()){
  const income=incomeAfter(row.wavesFromScratch);
  // Waves pay in order; give the player that income and craft for real.
  const armory={scrap:income.scrap,owned:0,equipped:0},workshop={...migrateWorkshop(armory),components:income.components};
  const crafted=craftWorkshop(armory,workshop,row.id);
  assert.ok(crafted,`${row.id} must be craftable with ${income.scrap} scrap and ${income.components} components`);
  assert.ok(crafted.armory.scrap>=0);
 }
});
