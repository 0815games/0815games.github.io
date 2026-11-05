import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {initializeWorkshop,applyWorkshopCommand} from '../workshop-transactions.mjs';
const account=()=>({name:'Example',xp:200,armory:{scrap:100,owned:3,equipped:2,fortify:3,other:'keep'},coopRewards:{a:7},other:{keep:true}});
test('migration preserves account data and refuses to overwrite a workshop',()=>{
 const before=account(),snapshot=structuredClone(before),migrated=initializeWorkshop(before);
 assert.deepEqual(before,snapshot);assert.deepEqual(migrated.armory,before.armory);assert.deepEqual(migrated.coopRewards,before.coopRewards);assert.deepEqual(migrated.other,before.other);
 assert.equal(migrated.workshop.equipped.gear,'legacy-2');assert.equal(initializeWorkshop(migrated),null);assert.equal(initializeWorkshop({...before,workshop:{version:99}}),null);assert.equal(initializeWorkshop({...before,armory:{scrap:-1}}),null);
});
test('transaction retry uses the latest balance and cannot spend the same scrap twice',()=>{
 let p=initializeWorkshop(account());const snapshot=structuredClone(p);
 const first=applyWorkshopCommand(p,{type:'craft',item:'boots'});assert.equal(first.armory.scrap,50);assert.deepEqual(p,snapshot);
 assert.equal(applyWorkshopCommand(first,{type:'craft',item:'boots'}),null);
 const second=applyWorkshopCommand(first,{type:'modify',item:'boots',mod:'lightweight'});assert.equal(second.armory.scrap,10);assert.equal(second.workshop.mods.boots,'lightweight');
 assert.equal(applyWorkshopCommand(second,{type:'modify',item:'boots',mod:'lightweight'}),null);assert.equal(applyWorkshopCommand(second,{type:'craft',item:'radio'}),null);
 assert.equal(second.armory.fortify,3);assert.equal(second.armory.other,'keep');assert.deepEqual(second.coopRewards,{a:7});
});
test('equips owned items in their proper slot, rejects malformed and future commands',()=>{
 const p=initializeWorkshop(account());const equipped=applyWorkshopCommand(p,{type:'equip',slot:'gadget',item:'legacy-1'});assert.equal(equipped.workshop.equipped.gadget,'legacy-1');assert.equal(equipped.workshop.equipped.gear,'legacy-2');
 for(const cmd of [{type:'equip',slot:'weapon',item:'legacy-1'},{type:'equip',slot:'gear',item:'boots'},{type:'modify',item:'legacy-1',mod:'precision'},{type:'delete'},null])assert.equal(applyWorkshopCommand(p,cmd),null);
 assert.equal(applyWorkshopCommand({...p,workshop:{...p.workshop,version:2}},{type:'equip',slot:'gadget',item:'legacy-1'}),null);
});
