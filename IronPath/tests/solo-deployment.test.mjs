import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {createSoloDeployment} from '../solo-deployment.mjs';import {createPlayer} from '../match.mjs';import {initializeWireWorkshop,applyWireWorkshopCommand} from '../workshop-wire.mjs';import {equipmentForPlayer} from '../workshop-combat.mjs';
const player=()=>createPlayer('local',{name:'Test',gender:'male',level:1,loadout:'0,0,1'});
test('enabled endless deployment uses and freezes the saved workshop loadout instead of old equipment',()=>{
 let profile=initializeWireWorkshop({xp:0,armory:{owned:1,equipped:1,scrap:100}});profile=applyWireWorkshopCommand(profile,{type:'craft',item:'boots'});profile=applyWireWorkshopCommand(profile,{type:'equip',slot:'gear',item:'boots'});
 const state=createSoloDeployment({player:player(),profile,workshopEnabled:true});assert.equal(state.players.local.loadout.equipped,0);assert.equal(equipmentForPlayer(state,state.players.local).damage,3);assert.equal(equipmentForPlayer(state,state.players.local).movement,15);
 profile=applyWireWorkshopCommand(profile,{type:'equip',slot:'gear',item:'none'});assert.equal(equipmentForPlayer(state,state.players.local).movement,15);
});
test('legacy routing is unchanged for disabled workshop and deferred campaign',()=>{for(const options of [{workshopEnabled:false,campaign:false},{workshopEnabled:true,campaign:true}]){const state=createSoloDeployment({player:player(),profile:{workshop:'bad'},...options});assert.equal(state.players.local.loadout.equipped,1);assert.equal(equipmentForPlayer(state,state.players.local).damage,3);assert.equal(state.experimentalWorkshop,undefined);}});
test('an unreadable saved workshop never silently falls back to old equipment',()=>{
 for(const profile of [{workshop:'future'},{workshop:'[9,0,[],[],[]]'}])assert.throws(()=>createSoloDeployment({player:player(),profile,workshopEnabled:true}),/valid workshop/);
});
test('a save without a workshop yet keeps playing with legacy equipment',()=>{
 // Any live account that never opened the armory has no workshop field. It must
 // still deploy instead of failing the match.
 for(const profile of [{name:'Alice',xp:0},{name:'Alice',xp:0,armory:{scrap:0,owned:0,equipped:0}},undefined,null]){
  const state=createSoloDeployment({player:player(),profile,workshopEnabled:true});
  assert.equal(state.experimentalWorkshop,undefined,'no workshop effects without a workshop');
  assert.equal(equipmentForPlayer(state,state.players.local).damage,3,'legacy loadout still applies');
 }
});
