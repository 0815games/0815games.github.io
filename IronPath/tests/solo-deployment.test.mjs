import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {createSoloDeployment} from '../solo-deployment.mjs';import {createPlayer} from '../match.mjs';import {initializeWireWorkshop,applyWireWorkshopCommand} from '../workshop-wire.mjs';import {equipmentForPlayer} from '../workshop-combat.mjs';
const player=()=>createPlayer('local',{name:'Test',gender:'male',level:1,loadout:'0,0,1'});
test('enabled endless deployment uses and freezes the saved workshop loadout instead of old equipment',()=>{
 let profile=initializeWireWorkshop({xp:0,armory:{owned:1,equipped:1,scrap:100}});profile=applyWireWorkshopCommand(profile,{type:'craft',item:'boots'});profile=applyWireWorkshopCommand(profile,{type:'equip',slot:'gear',item:'boots'});
 const state=createSoloDeployment({player:player(),profile,workshopEnabled:true});assert.equal(state.players.local.loadout.equipped,0);assert.equal(equipmentForPlayer(state,state.players.local).damage,3);assert.equal(equipmentForPlayer(state,state.players.local).movement,15);
 profile=applyWireWorkshopCommand(profile,{type:'equip',slot:'gear',item:'none'});assert.equal(equipmentForPlayer(state,state.players.local).movement,15);
});
test('legacy routing is unchanged for disabled workshop and deferred campaign',()=>{for(const options of [{workshopEnabled:false,campaign:false},{workshopEnabled:true,campaign:true}]){const state=createSoloDeployment({player:player(),profile:{workshop:'bad'},...options});assert.equal(state.players.local.loadout.equipped,1);assert.equal(equipmentForPlayer(state,state.players.local).damage,3);assert.equal(state.experimentalWorkshop,undefined);}});
test('enabled endless rejects missing and unsupported workshop instead of silently falling back',()=>{for(const profile of [{},{workshop:'future'},null])assert.throws(()=>createSoloDeployment({player:player(),profile,workshopEnabled:true}),/valid workshop/);});
