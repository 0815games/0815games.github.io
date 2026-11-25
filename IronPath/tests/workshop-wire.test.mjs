import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {migrateWorkshop} from '../workshop/workshop-model.mjs';
import {encodeWorkshop,decodeWorkshop,initializeWireWorkshop,applyWireWorkshopCommand} from '../workshop/workshop-wire.mjs';
const plain=value=>JSON.parse(JSON.stringify(value));
test('wire format retains empty collections and all legacy equipment',()=>{
 for(const armory of [null,{scrap:10,owned:1023,equipped:10,fortify:3}]){
  const workshop=migrateWorkshop(armory),encoded=encodeWorkshop(workshop);assert.equal(typeof encoded,'string');assert.ok(encoded.length>0);assert.deepEqual(plain(decodeWorkshop(encoded)),workshop);
  // Scalar strings survive an RTDB-style JSON round trip, including empty collections.
  const stored=JSON.parse(JSON.stringify({workshop:encoded}));assert.deepEqual(plain(decodeWorkshop(stored.workshop)),workshop);
 }
});
test('the old three-slot wire migrates to wearing everything and unknown, corrupt and duplicate fields fail closed',()=>{
 const w=migrateWorkshop(null);assert.equal(encodeWorkshop({...w,other:1}),null);assert.equal(encodeWorkshop({...w,equipped:{weapon:'standard'}}),null,'the retired slot object cannot be written');
 // IPL-0137: a v1 save reads back wearing every owned piece at once.
 const migrated=decodeWorkshop('[1,0,["legacy-1","boots"],["gear","none","none"],[]]');assert.deepEqual([...migrated.equipped],['legacy-1','boots']);
 assert.deepEqual([...decodeWorkshop('[2,0,["legacy-1"],["legacy-1"],[]]').equipped],['legacy-1']);
 for(const text of [null,'', '{', 'x'.repeat(2049), '[3,0,[],[],[]]', '[2,0,[],["standard","none","none"],[]]', '[2,0,[],["unknown"],[]]', '[1,0,[],["standard","none","none"],[["boots","lightweight"],["boots","lightweight"]]]', '[1,0,["unknown"],["standard","none","none"],[]]', '[1,0,[],["standard","none","none"],[],"extra"]'])assert.equal(decodeWorkshop(text),null);
});
test('wire transaction reducers preserve profile and reject stale spend and invalid saves',()=>{
 const initial={name:'Soldier',xp:7,armory:{scrap:160,owned:1,equipped:1,fortify:3},coopRewards:{id:7},extra:{keep:true}},before=structuredClone(initial);
 const migrated=initializeWireWorkshop(initial);assert.deepEqual(initial,before);assert.equal(initializeWireWorkshop(migrated),null);assert.deepEqual(migrated.coopRewards,initial.coopRewards);
 const crafted=applyWireWorkshopCommand(migrated,{type:'craft',item:'boots'});assert.equal(crafted.armory.scrap,110);assert.ok(decodeWorkshop(crafted.workshop).owned.includes('boots'));assert.equal(applyWireWorkshopCommand(crafted,{type:'craft',item:'boots'}),null);
 const modified=applyWireWorkshopCommand(crafted,{type:'modify',item:'boots',mod:'lightweight'});assert.equal(modified.armory.scrap,50);assert.equal(decodeWorkshop(modified.workshop).mods.boots,'lightweight');assert.deepEqual(modified.extra,{keep:true});assert.equal(modified.armory.fortify,3);
 assert.equal(applyWireWorkshopCommand({...migrated,workshop:'future'}, {type:'craft',item:'boots'}),null);
});
