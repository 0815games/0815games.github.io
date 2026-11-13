import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {getMap} from '../maps.mjs';
import {bunkerStart} from '../solo-deployment.mjs';
import {createPlayer} from '../match.mjs';
import {createVersus,applyVersus,versusView} from '../versus.mjs';
import {runVersus,GEARS} from './balance-harness.mjs';

const maps=['g3-19e3779b1','g3-17c2a4b8e','g3-100000001','g3-100000009'];
const players=()=>['alice','bob'].map(id=>createPlayer(id,{name:id,gender:'female',level:1}));

test('large duels give both players the same bunker-relative start and isolated fields',()=>{
 for(const id of [...maps,'road']){
  const map=getMap(id),duel=createVersus(players(),id,'alice'),start=bunkerStart(id);
  for(const uid of ['alice','bob']){
   const player=duel.lanes[uid].players[uid];
   assert.deepEqual({x:player.x,y:player.y},start,`${id}: ${uid} starts at the same bunker`);
   assert.equal(duel.lanes[uid].mapId,id);
  }
  const pad=map.pads.length-1;
  assert.equal(applyVersus(duel,'alice',{type:'build',pad,towerType:0}).ok,true);
  assert.equal(duel.lanes.bob.towers.length,0,'opponent cannot see a tower as their own');
  assert.equal(applyVersus(duel,'bob',{type:'build',pad,towerType:1}).ok,true);
  assert.equal(duel.lanes.alice.towers[0].type,0);
  assert.equal(versusView(duel,'bob').rival.towers[0].type,0);
  const move={type:'move',x:(map.width||960)-20,y:(map.height||540)-20};
  assert.equal(applyVersus(duel,'bob',move).ok,true,`${id}: full own field accepts movement`);
  assert.deepEqual(duel.lanes.bob.players.bob.target,{x:move.x,y:move.y});
 }
});

test('both rookie duelists clear ten waves on sample large maps',()=>{
 // runVersus stops as soon as the requested wave begins: wave 11 can only
 // start after both players cleared wave 10. This is not a live balance test.
 for(const id of maps){
  const result=runVersus(id,GEARS.rookie,11);
  assert.deepEqual(result.waves,[11,11],`${id}: ${JSON.stringify(result)}`);
  assert.equal(result.ended,'running');
 }
});
