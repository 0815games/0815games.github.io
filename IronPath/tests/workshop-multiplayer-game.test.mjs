import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {createPlayer,applyCommand} from '../match.mjs';import {stepMatch} from '../simulation.mjs';import {applyVersus,stepVersus} from '../versus.mjs';import {setFourPresence,stepFour} from '../four-modes.mjs';
import {initializeWireWorkshop} from '../workshop-wire.mjs';import {makeWorkshopOffer,lockWorkshopRoster} from '../workshop-multiplayer.mjs';import {createWorkshopMultiplayerMatch} from '../workshop-multiplayer-game.mjs';
const matchId='0123456789abcdef0123456789abcdef';
function setup(mode,ids){const players=ids.map((id,i)=>createPlayer(id,{name:id,gender:'male',level:2,skills:'1,0,0,0,0;assault',loadout:`0,0,${i?3:1}`},100,130));const offers=Object.fromEntries(ids.map((id,i)=>[id,makeWorkshopOffer(initializeWireWorkshop({armory:{owned:1<<(i?2:0),equipped:i?3:1}}),mode)]));return {players,lock:lockWorkshopRoster({matchId,mode,playerIds:ids,offers})};}
function enemy(lane){lane.wave=1;lane.running=true;lane.spawnLeft=3;lane.spawnTimer=100;lane.enemies.push({hp:1000,maxHp:1000,kind:'infantry',segment:1,x:100,y:130,speed:0,reward:0});}
test('two-player coop applies each locked loadout in the real match engine',()=>{
 const {players,lock}=setup('coop',['a','b']),state=createWorkshopMultiplayerMatch(players,lock,{hostId:'a'});enemy(state);stepMatch(state);
 assert.equal(state.players.a.loadout.equipped,0);assert.equal(state.enemies[0].hp,971); // 16 from scope + 13 from boots
 assert.equal(applyCommand(state,'a',{type:'airstrike'}).ok,true);assert.equal(state.enemies[0].hp,936);
 state.players.b.active=false;const x=state.players.b.x;state.players.b.direction={x:1,y:0};stepMatch(state);assert.equal(state.players.b.x,x);
});
test('versus uses standardized equipment effects in both real lanes',()=>{
 const {players,lock}=setup('versus',['a','b']),state=createWorkshopMultiplayerMatch(players,lock,{hostId:'a'});
 for(const lane of Object.values(state.lanes)){enemy(lane);const p=Object.values(lane.players)[0];p.x=100;p.y=130;}
 stepVersus(state);assert.equal(state.lanes.a.enemies[0].hp,state.lanes.b.enemies[0].hp);assert.equal(state.lanes.a.enemies[0].hp,987);
 assert.equal(applyVersus(state,'a',{type:'airstrike'}).ok,true);
});
test('four-player coop and two-versus-two use valid locks and retain presence behavior',()=>{
 for(const mode of ['four-coop','two-vs-two']){
  const {players,lock}=setup(mode,['a','b','c','d']),state=createWorkshopMultiplayerMatch(players,lock,{hostId:'a',teams:[['a','b'],['c','d']]});
  const lanes=mode==='four-coop'?[state.match]:state.lanes;for(const lane of lanes)enemy(lane);stepFour(state);
  assert.ok(lanes.every(lane=>lane.enemies[0].hp<1000));setFourPresence(state,'b',false);assert.equal(state.members.b.active,false);
  if(mode==='two-vs-two'){const wave=state.lanes[0].enemies[0].hp;stepFour(state);assert.equal(state.lanes[0].enemies[0].hp,wave);}
 }
});
test('rejects mismatched or missing locked participants',()=>{
 const {players,lock}=setup('coop',['a','b']);assert.throws(()=>createWorkshopMultiplayerMatch(players.slice(0,1),lock,{hostId:'a'}));assert.throws(()=>createWorkshopMultiplayerMatch(players,{...lock,mode:'versus'},{hostId:'a'}));
});
