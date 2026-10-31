import { strict as assert } from 'node:assert';
import { createPlayer, applyCommand } from '../match.mjs';
import { createMatch, stepMatch, getTowerRange } from '../simulation.mjs';
assert.equal(getTowerRange({type:2,level:2}),155);
assert.equal(getTowerRange({type:2,level:3,branch:1}),155*1.45);
assert.equal(getTowerRange({type:2,level:6,branch:1}),155*1.45);
const profile={name:'Soldier',gender:'female',level:3};
function initial(){return createMatch([createPlayer('alice',profile),createPlayer('bob',profile,100,100)]);}
assert.throws(()=>createMatch([]));
assert.throws(()=>createMatch([createPlayer('same',profile),createPlayer('same',profile)]));
function replay(){
  const state=initial(),events=[];
  assert.equal(applyCommand(state,'alice',{type:'build',pad:0,towerType:0}).ok,true);
  assert.equal(applyCommand(state,'bob',{type:'move',x:200,y:200}).ok,true);
  assert.equal(applyCommand(state,'alice',{type:'startWave'}).ok,true);
  assert.equal(applyCommand(state,'bob',{type:'startWave'}).ok,false);
  for(let tick=0;tick<6000 && !state.ended && state.running;tick++)events.push(...stepMatch(state));
  return {state,events};
}
const a=replay(),b=replay();
assert.deepEqual(a,b,'identical commands and ticks must replay identically');
assert.equal(a.state.players.bob.x,200);assert.equal(a.state.players.bob.y,200);
assert.ok(a.events.some(e=>e.type==='waveCleared'||e.type==='defeat'));
// Exercise outcomes and ensure each cleared wave emits the reward exactly once.
const state=initial();assert.ok(applyCommand(state,'alice',{type:'startWave'}).ok);
let clearEvents=[];
for(let i=0;i<10000&&state.running;i++){
  for(const enemy of state.enemies)enemy.hp=0;
  clearEvents.push(...stepMatch(state));
}
assert.equal(clearEvents.filter(e=>e.type==='waveCleared').length,1);
assert.equal(clearEvents.find(e=>e.type==='waveCleared').xp,30);
assert.equal(stepMatch(state).filter(e=>e.type==='waveCleared').length,0);
assert.ok(applyCommand(state,'alice',{type:'direction',x:1,y:0}).ok);
const before=state.players.alice.x;stepMatch(state);assert.ok(state.players.alice.x>before);
assert.equal(applyCommand(state,'bob',{type:'direction',x:2,y:0}).ok,false);
assert.equal(state.players.bob.direction.x,0);
console.log('Fixed-step two-player simulation and replay tests passed.');
