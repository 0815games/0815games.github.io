// The workshop ledger: schema migration, the atomic craft/modify/equip commands
// applied through an account transaction, and the boss-wave receipts. One file,
// because a bug in any of the three spends the same scrap; each part keeps its
// own scope so the three different `armory` fixtures cannot shadow each other.

import {craftWorkshop, equipWorkshop, migrateWorkshop, modifyWorkshop, validateWorkshop} from '../workshop-model.mjs';
import {applyBossRewards} from '../workshop-rewards.mjs';
import {applyWorkshopCommand, initializeWorkshop} from '../workshop-transactions.mjs';
import {strict as assert} from 'node:assert';
import {test} from 'node:test';

// ---- from workshop-model.test.mjs ----
{
test('migration preserves every legacy item and its currently equipped effect without mutating saves',()=>{
 for(let equipped=0;equipped<=10;equipped++){const armory={scrap:99,owned:1023,equipped,fortify:3,plating:2},before=structuredClone(armory),w=migrateWorkshop(armory);assert.ok(validateWorkshop(w));assert.equal(w.owned.length,10);assert.equal(Object.values(w.equipped).includes(`legacy-${equipped}`),equipped>0);assert.deepEqual(armory,before);}
 assert.equal(migrateWorkshop({scrap:-1}),null);assert.equal(migrateWorkshop({owned:0,equipped:3}),null);
});
test('craft, equip and mod are atomic pure operations and reject duplicate, invalid or unaffordable actions',()=>{
 let armory={scrap:300,owned:1,equipped:1},w=migrateWorkshop(armory);w.components=1;const before=structuredClone({armory,w});const result=craftWorkshop(armory,w,'marksman');assert.equal(result.armory.scrap,150,'provisional marksman cost is 150 scrap');assert.equal(result.workshop.components,0);assert.deepEqual({armory,w},before);assert.equal(craftWorkshop(result.armory,result.workshop,'marksman'),null);assert.equal(craftWorkshop(armory,{...w,components:0},'marksman'),null);
 const equipped=equipWorkshop(result.workshop,'weapon','marksman');assert.equal(equipped.equipped.weapon,'marksman');assert.equal(equipWorkshop(equipped,'gear','marksman'),null);const mod=modifyWorkshop(result.armory,equipped,'marksman','precision');assert.equal(mod.armory.scrap,90,'provisional mod cost is 60 scrap');assert.equal(mod.workshop.mods.marksman,'precision');assert.equal(modifyWorkshop({...mod.armory,scrap:0},mod.workshop,'marksman','quick'),null,'an unaffordable modification is rejected');assert.equal(modifyWorkshop(mod.armory,mod.workshop,'marksman','precision'),null,'an owned item that was never crafted cannot be modified');assert.equal(modifyWorkshop(armory,w,'marksman','precision'),null);
});
test('unknown and corrupt future schemas fail closed',()=>{const w=migrateWorkshop(null);assert.equal(validateWorkshop({...w,version:2}),false);assert.equal(validateWorkshop({...w,equipped:{...w.equipped,weapon:'unknown'}}),false);assert.equal(craftWorkshop({scrap:100},{...w,version:2},'boots'),null);});

test('inherited recipe names and non-object legacy saves fail closed',()=>{const w=migrateWorkshop(null);assert.equal(migrateWorkshop('invalid'),null);assert.equal(migrateWorkshop([]),null);assert.equal(validateWorkshop({...w,owned:['toString']}),false);assert.equal(craftWorkshop({scrap:100},w,'constructor'),null);});
}

// ---- from workshop-transactions.test.mjs ----
{
const account=()=>({name:'Example',xp:200,armory:{scrap:160,owned:3,equipped:2,fortify:3,other:'keep'},coopRewards:{a:7},other:{keep:true}});
test('migration preserves account data and refuses to overwrite a workshop',()=>{
 const before=account(),snapshot=structuredClone(before),migrated=initializeWorkshop(before);
 assert.deepEqual(before,snapshot);assert.deepEqual(migrated.armory,before.armory);assert.deepEqual(migrated.coopRewards,before.coopRewards);assert.deepEqual(migrated.other,before.other);
 assert.equal(migrated.workshop.equipped.gear,'legacy-2');assert.equal(initializeWorkshop(migrated),null);assert.equal(initializeWorkshop({...before,workshop:{version:99}}),null);assert.equal(initializeWorkshop({...before,armory:{scrap:-1}}),null);
});
test('transaction retry uses the latest balance and cannot spend the same scrap twice',()=>{
 let p=initializeWorkshop(account());const snapshot=structuredClone(p);
 const first=applyWorkshopCommand(p,{type:'craft',item:'boots'});assert.equal(first.armory.scrap,110,'provisional boots cost is 50 scrap');assert.deepEqual(p,snapshot);
 assert.equal(applyWorkshopCommand(first,{type:'craft',item:'boots'}),null);
 const second=applyWorkshopCommand(first,{type:'modify',item:'boots',mod:'lightweight'});assert.equal(second.armory.scrap,50,'provisional mod cost is 60 scrap');assert.equal(second.workshop.mods.boots,'lightweight');
 assert.equal(applyWorkshopCommand(second,{type:'modify',item:'boots',mod:'lightweight'}),null);assert.equal(applyWorkshopCommand(second,{type:'craft',item:'radio'}),null,'radio still costs 150 scrap and one component');
 assert.equal(second.armory.fortify,3);assert.equal(second.armory.other,'keep');assert.deepEqual(second.coopRewards,{a:7});
});
test('equips owned items in their proper slot, rejects malformed and future commands',()=>{
 const p=initializeWorkshop(account());const equipped=applyWorkshopCommand(p,{type:'equip',slot:'gadget',item:'legacy-1'});assert.equal(equipped.workshop.equipped.gadget,'legacy-1');assert.equal(equipped.workshop.equipped.gear,'legacy-2');
 for(const cmd of [{type:'equip',slot:'weapon',item:'legacy-1'},{type:'equip',slot:'gear',item:'boots'},{type:'modify',item:'legacy-1',mod:'precision'},{type:'delete'},null])assert.equal(applyWorkshopCommand(p,cmd),null);
 assert.equal(applyWorkshopCommand({...p,workshop:{...p.workshop,version:2}},{type:'equip',slot:'gadget',item:'legacy-1'}),null);
});
}

// ---- from workshop-rewards.test.mjs ----
{
const mask=(...waves)=>waves.reduce((n,w)=>n|(1<<(w-1)),0);
function profile(){const armory={scrap:70,owned:3,equipped:1,fortify:2,extra:'retained'};return {name:'Soldier',xp:123,armory,workshop:migrateWorkshop(armory),coopRewards:{existing:3},unrelated:{value:1}};}
test('only newly completed boss waves award bonus, atomically with the receipt',()=>{
 const initial=profile(),copy=structuredClone(initial),result=applyBossRewards(initial,mask(5),mask(5,6,10,15));
 assert.equal(result.bosses,2);assert.equal(result.profile.armory.scrap,110);assert.equal(result.profile.workshop.components,2);assert.equal(result.receipt,mask(5,6,10,15));assert.deepEqual(initial,copy);
 assert.equal(result.profile.armory.extra,'retained');assert.deepEqual(result.profile.coopRewards,initial.coopRewards);assert.deepEqual(result.profile.unrelated,initial.unrelated);
 const replay=applyBossRewards(result.profile,result.receipt,mask(5,6,10,15));assert.equal(replay.bosses,0);assert.deepEqual(replay.profile,result.profile);
});
test('uses actual waves across receipt blocks and does not award incomplete waves',()=>{
 const first=applyBossRewards(profile(),0,mask(4,5),1);assert.equal(first.bosses,1); // wave 25
 const noBoss=applyBossRewards(profile(),0,mask(1,2,3,4),0);assert.equal(noBoss.bosses,0);
});
test('rejects malformed profiles, masks, future schema and balance overflow without mutation',()=>{
 const p=profile();assert.equal(applyBossRewards({...p,armory:{scrap:-1}},0,mask(5)),null);assert.equal(applyBossRewards({...p,workshop:{...p.workshop,version:2}},0,mask(5)),null);
 assert.equal(applyBossRewards(p,-1,mask(5)),null);assert.equal(applyBossRewards(p,0,2**20),null);assert.equal(applyBossRewards(p,0,mask(5),Number.MAX_SAFE_INTEGER),null);
 // At the caps the balance is clamped and the wave is still credited, so the player
 // never loses XP because of a full scrap or component balance.
 const scrapCap=applyBossRewards({...p,armory:{...p.armory,scrap:9999990}},0,mask(5));assert.equal(scrapCap.profile.armory.scrap,10000000);assert.equal(scrapCap.receipt,mask(5));
 const componentCap=applyBossRewards({...p,workshop:{...p.workshop,components:1000000}},0,mask(5));assert.equal(componentCap.profile.workshop.components,1000000);assert.equal(componentCap.bosses,1);
 assert.equal(applyBossRewards({...p,armory:{...p.armory,scrap:'x'}},0,mask(5)),null);
});
}
