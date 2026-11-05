import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {createPlayer,applyCommand} from '../match.mjs';import {createMatch,stepMatch} from '../simulation.mjs';import {createWorkshopSoloMatch} from '../workshop-solo.mjs';import {migrateWorkshop} from '../workshop-model.mjs';import {projectCoopMotion} from '../coop-motion.mjs';
const player=item=>createPlayer('p',{name:'Soldier',gender:'male',level:2,skills:'1,0,0,0,0;assault',loadout:`0,0,${item}`},100,130);
function prepare(state,wave=6){state.wave=wave;state.running=true;state.spawnLeft=2;state.spawnTimer=100;state.enemies.push({hp:1000,maxHp:1000,kind:'infantry',segment:1,x:100,y:130,speed:0,reward:0});return state;}
test('actual solo engine applies stacked workshop equipment, mods and ability cooldown',()=>{
 const w=migrateWorkshop(null);w.owned=['marksman','mechanic','radio'];w.equipped={weapon:'marksman',gear:'mechanic',gadget:'radio'};w.mods={marksman:'precision',mechanic:'lightweight',radio:'efficient'};
 const state=prepare(createWorkshopSoloMatch(player(1),w));assert.equal(state.maxHp,110);assert.equal(state.money,135);assert.equal(state.players.p.loadout.equipped,0,'old slot is not stacked');
 state.players.p.direction={x:1,y:0};const predicted=projectCoopMotion(state,1/30);stepMatch(state);assert.equal(state.enemies[0].hp,985);assert.ok(Math.abs(state.players.p.x-predicted.players.p.x)<1e-9);assert.ok(state.players.p.x>105);
 assert.equal(applyCommand(state,'p',{type:'airstrike'}).ok,true);assert.equal(state.players.p.cooldown,25);
 w.equipped.weapon='standard';state.players.p.shotTimer=0;stepMatch(state);assert.equal(state.enemies[0].hp,935,'match retains captured marksman after account changes');
});
test('all migrated legacy items match old solo mechanics at waves five and six',()=>{
 for(let item=1;item<=10;item++)for(const wave of [5,6]){
  const p=player(item),workshop=migrateWorkshop({owned:1<<(item-1),equipped:item}),old=prepare(createMatch([p]),wave),next=prepare(createWorkshopSoloMatch(p,workshop),wave);
  assert.equal(next.hp,old.hp,`item ${item} health`);assert.equal(next.money,old.money,`item ${item} supplies`);
  const before=applyCommand(old,'p',{type:'airstrike'}),after=applyCommand(next,'p',{type:'airstrike'});assert.deepEqual(after,before);assert.equal(next.players.p.cooldown,old.players.p.cooldown);assert.equal(next.enemies[0].hp,old.enemies[0].hp);
  stepMatch(old);stepMatch(next);assert.equal(next.enemies[0].hp,old.enemies[0].hp);assert.equal(next.players.p.shotTimer,old.players.p.shotTimer);
 }
});
test('broken experimental lock fails closed and cannot be used for multiplayer',()=>{
 const state=createWorkshopSoloMatch(player(1),migrateWorkshop({owned:1,equipped:1}));state.experimentalWorkshop.snapshot={version:2};state.players.p.direction={x:1,y:0};assert.throws(()=>stepMatch(state),/Invalid experimental/);
 const other=createWorkshopSoloMatch(player(1),migrateWorkshop({owned:1,equipped:1}));other.individualSupplies=true;other.players.p.direction={x:1,y:0};assert.throws(()=>stepMatch(other),/Invalid experimental/);
});
