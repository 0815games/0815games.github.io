import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {createSoloDeployment} from '../solo-deployment.mjs';import {createPlayer} from '../match.mjs';import {initializeWireWorkshop,applyWireWorkshopCommand} from '../workshop-wire.mjs';import {equipmentForPlayer} from '../workshop-combat.mjs';
const player=()=>createPlayer('local',{name:'Test',gender:'male',level:1,loadout:'0,0,1'});
test('enabled endless deployment uses and freezes the saved workshop loadout instead of old equipment',()=>{
 let profile=initializeWireWorkshop({xp:0,armory:{owned:1,equipped:1,scrap:100}});profile=applyWireWorkshopCommand(profile,{type:'craft',item:'boots'});profile=applyWireWorkshopCommand(profile,{type:'equip',slot:'gear',item:'boots'});
 const state=createSoloDeployment({player:player(),profile,workshopEnabled:true});assert.equal(state.players.local.loadout.equipped,0);assert.equal(equipmentForPlayer(state,state.players.local).damage,3);assert.equal(equipmentForPlayer(state,state.players.local).movement,15);
 profile=applyWireWorkshopCommand(profile,{type:'equip',slot:'gear',item:'none'});assert.equal(equipmentForPlayer(state,state.players.local).movement,15);
});
test('a disabled workshop still plays the old equipment',()=>{
 const state=createSoloDeployment({player:player(),profile:{workshop:'bad'},workshopEnabled:false});
 assert.equal(state.players.local.loadout.equipped,1);assert.equal(equipmentForPlayer(state,state.players.local).damage,3);assert.equal(state.experimentalWorkshop,undefined);
});
test('a story mission deploys its soldier at the first stage marker, not the bunker',()=>{
 // Reported: "Soldier starts every time at the bunker!" - the operation
 // begins where its first objective sits; endless keeps the bunker start.
 const deployed=createSoloDeployment({player:player(),profile:{},campaign:{id:'lost-signal',threat:'standard',spawn:{x:210,y:130}}});
 assert.equal(deployed.players.local.x,210);assert.equal(deployed.players.local.y,130);
 const endless=createSoloDeployment({player:player(),profile:{}});
 assert.equal(endless.players.local.x,850);assert.equal(endless.players.local.y,450);
 const half=createSoloDeployment({player:player(),profile:{},campaign:{id:'lost-signal',threat:'standard',spawn:{x:Number.NaN,y:130}}});
 assert.equal(half.players.local.x,850,'an unreadable spawn point falls back to the bunker');
});
test('a campaign mission now uses the workshop loadout and its contract',()=>{
 // Missions used to be forced onto the legacy path, so no crafted gear mattered.
 let profile=initializeWireWorkshop({xp:0,armory:{scrap:100,owned:1,equipped:1}});
 profile=applyWireWorkshopCommand(profile,{type:'craft',item:'boots'});profile=applyWireWorkshopCommand(profile,{type:'equip',slot:'gear',item:'boots'});
 const state=createSoloDeployment({player:player(),profile,workshopEnabled:true,campaign:{id:'bridge',threat:'elite'}});
 assert.equal(equipmentForPlayer(state,state.players.local).movement,15,'the crafted item applies in a mission');
 assert.equal(state.campaignContract.threat,'elite');assert.equal(state.campaignContract.waves,7);
 assert.ok(state.maxHp<100,'an elite contract shrinks the bunker');
});
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
