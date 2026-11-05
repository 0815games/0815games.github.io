import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {legacyEquipmentEffects} from '../equipment-effects.mjs';
import {createPlayer,applyCommand} from '../match.mjs';import {createMatch,stepMatch} from '../simulation.mjs';
import {projectCoopMotion} from '../coop-motion.mjs';
const player=(id,item)=>createPlayer(id,{name:id,gender:'male',level:2,skills:'1,0,0,0,0;assault',loadout:`0,0,${item}`},100,130);
test('legacy effects table has neutral invalid items and wave-six thresholds',()=>{
 assert.deepEqual(legacyEquipmentEffects(99,20),legacyEquipmentEffects(0,20));assert.deepEqual(legacyEquipmentEffects('1',20),legacyEquipmentEffects(0,20));
 for(let id=7;id<=10;id++){assert.deepEqual(legacyEquipmentEffects(id,5),legacyEquipmentEffects(0,5));assert.notDeepEqual(legacyEquipmentEffects(id,6),legacyEquipmentEffects(0,6));}
});
test('shared bunker and personal starting supplies preserve old behavior',()=>{
 const state=createMatch([player('a',2),player('b',6)]);assert.equal(state.maxHp,110);assert.equal(state.players.a.money,125);assert.equal(state.players.b.money,150);
});
test('radio cooldown and demolition pouch remain tied to the ability and wave',()=>{
 for(const wave of [5,6])for(const item of [0,5,7]){const state=createMatch([player('a',item)]);state.wave=wave;state.enemies.push({hp:100});assert.equal(applyCommand(state,'a',{type:'airstrike'}).ok,true);assert.equal(state.players.a.cooldown,item===5?26:30);assert.equal(state.enemies[0].hp,item===7&&wave>=6?55:65);}
});
test('boots affect authoritative and projected motion consistently',()=>{
 const state=createMatch([player('a',3)]);state.players.a.direction={x:1,y:0};const projected=projectCoopMotion(state,1/30);stepMatch(state);assert.ok(Math.abs(projected.players.a.x-state.players.a.x)<1e-9);
});
