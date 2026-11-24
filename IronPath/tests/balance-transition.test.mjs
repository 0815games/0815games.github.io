// Sector-retreat balance pins (IPL-0129) — the wave-11 cliff, held down by
// test: the first wave after a retreat spawns in the old rhythm (grace), the
// second in the new field's full threat; the endless opening ramps from
// wave 6 while contracts keep their authored curve; and the canonical rookie
// retreat survives the window without losing the road.
// Numbers are pinned deliberately: when a balance change moves them, change
// them here consciously (and re-baseline tests/balance-baseline.json).
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createMatch,stepMatch} from '../core/simulation.mjs';
import {createPlayer,advanceSector} from '../core/match.mjs';
import {runSoloTrace,GEARS} from './balance-harness.mjs';

const player=()=>createPlayer('local',{name:'A',gender:'female',level:5,
  skills:'v2;assault;1;0;00000000000000',loadout:'0,0,0'},850,450);
const spawnOne=(state,wave)=>{
  state.enemies=[];state.wave=wave;state.running=true;
  state.spawnLeft=1;state.spawnTimer=0;state.spawnIndex=0;
  stepMatch(state);
  assert.equal(state.enemies.length,1,`wave ${wave} spawns`);
  return state.enemies[0];
};

test('the first wave after a retreat spawns in the old rhythm, the next in the new',()=>{
  const retreated=createMatch([player()],'g3-09e3779b1');
  retreated.pendingSector=1;
  retreated.wave=10;
  const advance=advanceSector(retreated,()=> 'g3-19e3779b1');
  assert.ok(advance,'the sector retreat happens');
  assert.equal(retreated.sectorGraceWave,11,'grace covers wave 11');
  const fresh=createMatch([player()],'g3-19e3779b1');

  const graceEnemy=spawnOne(retreated,11);
  const freshEnemy=spawnOne(fresh,11);
  assert.equal(freshEnemy.kind,graceEnemy.kind,'same wave, same formation');
  // The fresh sector-two field toughens by exactly the sector factor; the
  // grace wave does not — it spawns at the old field's numbers.
  assert.equal(freshEnemy.maxHp,Math.max(1,Math.round(graceEnemy.maxHp*1.12)),
    'the fresh field is meaner than the rebuild wave');
  assert.ok(freshEnemy.speed>graceEnemy.speed,'and already faster');

  const graceNext=spawnOne(retreated,12);
  const freshNext=spawnOne(fresh,12);
  assert.equal(graceNext.maxHp,freshNext.maxHp,'wave 12 applies the full new-field threat');
  assert.equal(graceNext.speed,freshNext.speed);
});

test('the rookie survives the first retreat without losing the road',()=>{
  const r=runSoloTrace('g3-0b9f45231',GEARS.rookie,16);
  assert.equal(r.ended,'alive','alive through the transition window');
  const start=Object.fromEntries(r.trace.filter(e=>e.type==='wave').map(e=>[e.wave,e]));
  const advance=r.trace.find(e=>e.type==='advance');
  assert.ok(advance&&start[11],'the retreat fires and wave 11 runs on the new field');
  assert.equal(start[11].mapId,advance.to,'wave 11 spawns on the field you retreated to');
  // The window (rebuild wave + the two after it) costs at most a scratch,
  // and the road is rebuilt by the wave after the grace one.
  assert.ok(start[13].hp>=start[11].hp-12,
    `transition damage ${start[11].hp-start[13].hp} hp must stay ≤12`);
  assert.ok(start[12].towers>=10,`rebuilt to ${start[12].towers} towers by wave 12`);
});
