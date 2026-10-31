import { strict as assert } from 'node:assert';
import { ENEMY_TYPES, WAVES, makeEnemy, towerDamage } from '../combat.mjs';
assert.equal(WAVES.length, 5);
assert.deepEqual([...new Set(WAVES[0])], ['infantry']);
assert.ok(WAVES[1].includes('runner') && WAVES[1].includes('tank'));
assert.ok(!WAVES[1].includes('plane') && WAVES[2].includes('plane'));
for (const [i,wave] of WAVES.entries()) for (const kind of wave) {
  assert.ok(ENEMY_TYPES[kind]);
  const enemy=makeEnemy(kind,i+1);
  assert.ok(enemy.hp>0 && enemy.speed>0 && enemy.reward>0 && enemy.damage>0);
  for(let type=0;type<4;type++) for(let level=1;level<=3;level++) {
    const choices=level===3?[0,1]:[null];
    for(const branch of choices) assert.ok(towerDamage(type,level,branch,kind)>0);
  }
}
assert.ok(towerDamage(0,1,null,'infantry')>towerDamage(0,1,null,'tank'));
assert.ok(towerDamage(1,1,null,'tank')>towerDamage(1,1,null,'plane'));
assert.ok(towerDamage(2,1,null,'plane')>towerDamage(2,1,null,'tank'));
assert.ok(towerDamage(3,3,1,'tank')>towerDamage(3,3,0,'tank'));
assert.ok(makeEnemy('tank',5).hp>makeEnemy('tank',2).hp);
console.log('Combat data and damage tests passed.');
