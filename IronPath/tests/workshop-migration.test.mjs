import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {planMigration,applyPlannedMigration,rollbackUnchangedMigration} from '../server/workshop-migration.mjs';import {decodeWorkshop,applyWireWorkshopCommand} from '../workshop-wire.mjs';
const uid='alice',base=()=>({name:'Alice',gender:'female',xp:300,armory:{scrap:100,fortify:3,plating:2,repair:1,gun:2,supply:3,safeguard:1,owned:1023,equipped:1},coopRewards:{['a'.repeat(32)]:31},storyProgress:2,other:{keep:true}});
test('dry-run preserves all ten legacy choices, ranks, currency and unrelated data',()=>{
 for(let item=0;item<=10;item++){const profile=base();profile.armory.equipped=item;const before=structuredClone(profile),plan=planMigration(uid,profile);assert.equal(plan.status,'ready');assert.deepEqual(profile,before);assert.deepEqual(plan.after.armory,profile.armory);assert.deepEqual(plan.after.coopRewards,profile.coopRewards);assert.deepEqual(plan.after.other,profile.other);const w=decodeWorkshop(plan.after.workshop);assert.equal(w.owned.length,10);assert.equal(Object.values(w.equipped).includes(`legacy-${item}`),item>0);assert.deepEqual(applyPlannedMigration(uid,profile,plan),plan.after);}
 const empty={name:'B',xp:0},p=planMigration('bob',empty);assert.equal(p.status,'ready');assert.deepEqual(decodeWorkshop(p.after.workshop).owned,[]);
});
test('concurrent account changes and cross-user plans refuse migration',()=>{const p=base(),plan=planMigration(uid,p);assert.equal(applyPlannedMigration(uid,{...p,xp:301},plan),null);assert.equal(applyPlannedMigration(uid,{...p,armory:{...p.armory,scrap:99}},plan),null);assert.equal(applyPlannedMigration('bob',p,plan),null);});
test('rollback deletes only untouched workshop data, never overwrites changed progress',()=>{
 const p=base(),plan=planMigration(uid,p),migrated=applyPlannedMigration(uid,p,plan);assert.deepEqual(rollbackUnchangedMigration(uid,migrated,plan.checkpoint),p);
 const mutated=[{...migrated,xp:400},{...migrated,storyProgress:3},{...migrated,armory:{...migrated.armory,scrap:101}},{...migrated,coopRewards:{...migrated.coopRewards,['b'.repeat(32)]:1}},applyWireWorkshopCommand(migrated,{type:'craft',item:'boots'})];
 for(const state of mutated)assert.equal(rollbackUnchangedMigration(uid,state,plan.checkpoint),null);assert.equal(rollbackUnchangedMigration('bob',migrated,plan.checkpoint),null);
});
test('corrupt and future data fail closed without destructive migration',()=>{
 assert.equal(planMigration(uid,{...base(),armory:{scrap:-1}}).status,'invalid');assert.equal(planMigration(uid,{...base(),workshop:'future'}).status,'unsupported');assert.equal(planMigration(uid,planMigration(uid,base()).after).status,'already-migrated');assert.equal(planMigration('../bob',base()).status,'invalid');assert.equal(planMigration(uid,{...base(),xp:NaN}).status,'invalid');const cyclic=base();cyclic.loop=cyclic;assert.equal(planMigration(uid,cyclic).status,'invalid');
});
test('canonical fingerprints are stable when Firebase returns keys in another order',()=>{
 const p=base(),plan=planMigration(uid,p),reordered=Object.fromEntries(Object.entries(p).reverse());assert.deepEqual(applyPlannedMigration(uid,reordered,plan),{...reordered,workshop:plan.after.workshop});
});
