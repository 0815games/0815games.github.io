import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createMatch, stepMatch} from '../core/simulation.mjs';
import {createPlayer, applyCommand, repairOffer} from '../core/match.mjs';
import {makeEnemy, SOLDIER_MAX_HP, towerMaxHp, ENEMY_ATTACKS} from '../core/combat.mjs';
import {getMap} from '../core/maps.mjs';
import {normalizeCommand} from '../core/protocol.mjs';

// Block E, Scheibe 1: Lebens-, Angriffs- und Reparaturregeln im festen
// Simulationskern. Alle Zahlen sind die Startwerte aus dem Blockplan.

function solo(wave = 3) {
  const s = createMatch([createPlayer('solo', {name: 'Solo', gender: 'female'})]);
  s.wave = wave;
  s.running = true;
  s.spawnLeft = 0;
  return s;
}
function foe(s, kind, x, y) {
  const e = {...makeEnemy(kind, Math.max(1, s.wave)), hp: 100000, maxHp: 100000, x, y, segment: 1, speed: 0};
  s.enemies.push(e);
  return e;
}
function steps(s, n) {
  let events = [];
  for (let i = 0; i < n; i++) events = events.concat(stepMatch(s));
  return events;
}
function buildTower(s, pad = 0) {
  const result = applyCommand(s, 'solo', {type: 'build', pad, towerType: 0});
  assert.equal(result.ok, true, 'tower builds');
  return s.towers.find(t => t.pad === pad);
}

test('a soldier starts with full life and towers are built with theirs', () => {
  const s = solo();
  assert.equal(s.players.solo.hp, SOLDIER_MAX_HP);
  const tower = buildTower(s);
  assert.equal(tower.hp, towerMaxHp(1));
  assert.equal(tower.maxHp, towerMaxHp(1));
});

test('infantry telegraphs its attack, then hits the soldier in reach', () => {
  const s = solo();
  const e = foe(s, 'infantry', s.players.solo.x - 30, s.players.solo.y);
  steps(s, 5);
  assert.ok(e.windup, 'the attack is announced before it lands');
  const events = steps(s, 30);
  assert.equal(s.players.solo.hp, SOLDIER_MAX_HP - ENEMY_ATTACKS.infantry.damage);
  assert.ok(events.some(ev => ev.type === 'enemyAttack' && ev.target === 'soldier' && ev.damage === ENEMY_ATTACKS.infantry.damage));
});

test('no enemy attacks during the opening waves', () => {
  const s = solo(2);
  const e = foe(s, 'infantry', s.players.solo.x - 30, s.players.solo.y);
  steps(s, 90);
  assert.equal(e.windup, undefined);
  assert.equal(s.players.solo.hp, SOLDIER_MAX_HP);
});

test('a soldier who leaves reach during the warning is not hit', () => {
  const s = solo();
  const e = foe(s, 'infantry', s.players.solo.x - 30, s.players.solo.y);
  steps(s, 5);
  assert.ok(e.windup);
  s.players.solo.x = 60;
  s.players.solo.y = 60;
  steps(s, 40);
  assert.equal(s.players.solo.hp, SOLDIER_MAX_HP, 'dodging the telegraph avoids the hit');
});

test('only a capped number of attackers winds up on the same soldier', () => {
  const s = solo();
  for (let i = 0; i < 4; i++) foe(s, 'infantry', s.players.solo.x - 30, s.players.solo.y + i * 8);
  steps(s, 5);
  const winding = s.enemies.filter(e => e.windup).length;
  assert.ok(winding > 0 && winding <= 2, `at most two attackers telegraph at once, saw ${winding}`);
});

test('a downed soldier waits, cannot act, and returns protected at the bunker', () => {
  const s = solo();
  const p = s.players.solo;
  p.hp = ENEMY_ATTACKS.infantry.damage;
  p.cooldown = 5;
  foe(s, 'infantry', p.x - 30, p.y);
  const events = steps(s, 40);
  assert.ok(events.some(ev => ev.type === 'soldierDown' && ev.playerId === 'solo'));
  assert.equal(p.hp, 0);
  assert.ok(p.downed > 0, 'the soldier is down, not out of the match');
  assert.ok(p.cooldown <= 5, 'falling does not reset the ability recharge');
  assert.equal(applyCommand(s, 'solo', {type: 'airstrike'}).ok, false, 'no ability while down');
  const downX = p.x;
  p.direction = {x: 1, y: 0};
  steps(s, 30);
  assert.equal(p.x, downX, 'no movement while down');
  s.enemies = [];
  const back = steps(s, 260);
  assert.ok(back.some(ev => ev.type === 'soldierReturn' && ev.playerId === 'solo'));
  assert.equal(p.hp, SOLDIER_MAX_HP, 'returns with full life');
  assert.ok(p.protect > 0, 'returns with a short protection');
  const bunker = getMap(s.mapId).bunker || {x: 900, y: 400};
  assert.equal(p.x, Math.max(90, bunker.x - 90), 'returns near the own bunker');
});

test('tanks damage towers; a tower at zero stays on its pad but stops firing', () => {
  const s = solo();
  const tower = buildTower(s);
  const pad = getMap(s.mapId).pads[0];
  foe(s, 'tank', pad.x + 50, pad.y);
  steps(s, 60);
  assert.equal(tower.hp, towerMaxHp(1) - ENEMY_ATTACKS.tank.damage, 'the telegraphed tank strike lands');
  tower.hp = ENEMY_ATTACKS.tank.damage;
  const events = steps(s, 160);
  assert.equal(tower.hp, 0);
  assert.ok(events.some(ev => ev.type === 'towerDisabled' && ev.pad === 0));
  assert.equal(s.towers.length, 1, 'the tower remains on its pad, repairable');
  s.shots = [];
  steps(s, 10);
  assert.equal(s.shots.filter(shot => shot.kind === 0).length, 0, 'a disabled tower does not fire');
});

test('repair is quoted first, paid by the confirming player, and lands after a short repair', () => {
  const s = solo();
  const tower = buildTower(s);
  tower.hp = towerMaxHp(1) / 2;
  const offer = repairOffer(tower);
  assert.equal(offer.heal, Math.ceil(towerMaxHp(1) * .5), 'up to 50 percent points are offered');
  assert.equal(offer.cost, 10, 'the full offer costs 20% of the 50-supply investment');
  const moneyBefore = s.money;
  const result = applyCommand(s, 'solo', {type: 'repairTower', pad: 0});
  assert.equal(result.ok, true);
  assert.equal(result.cost, 10);
  assert.equal(s.money, moneyBefore - 10);
  assert.equal(applyCommand(s, 'solo', {type: 'repairTower', pad: 0}).ok, false, 'no second repair while one runs');
  s.enemies = [];
  s.running = false; // Reparatur läuft auch in der Bauphase fertig
  const events = steps(s, 70);
  assert.equal(tower.hp, towerMaxHp(1));
  assert.ok(events.some(ev => ev.type === 'towerRepaired' && ev.pad === 0));
  assert.equal(applyCommand(s, 'solo', {type: 'repairTower', pad: 0}).ok, false, 'an undamaged tower cannot be repaired');
});

test('selling a tower mid-repair refunds the reserved repair cost', () => {
  const s = solo();
  const tower = buildTower(s);
  tower.hp = towerMaxHp(1) / 2;
  assert.equal(applyCommand(s, 'solo', {type: 'repairTower', pad: 0}).ok, true);
  const moneyBefore = s.money;
  const sold = applyCommand(s, 'solo', {type: 'sell', pad: 0});
  assert.equal(sold.ok, true);
  assert.equal(s.money, moneyBefore + sold.refund + 10, 'sale refund plus the untouched repair price come back');
});

test('upgrading keeps the damage share instead of healing for free', () => {
  const s = solo();
  const tower = buildTower(s);
  tower.hp = towerMaxHp(1) / 2; // halb beschädigt
  s.money = 500;
  assert.equal(applyCommand(s, 'solo', {type: 'upgrade', pad: 0}).ok, true);
  assert.equal(tower.maxHp, towerMaxHp(2));
  assert.equal(tower.hp, Math.round(towerMaxHp(2) / 2), 'half damaged stays half damaged at the higher maximum');
});

test('after a survived wave every damaged tower regains a quarter of its life', () => {
  const s = solo();
  const tower = buildTower(s, 0);
  const second = buildTower(s, 1);
  tower.hp = 50;
  second.hp = 0; // ausgefallen
  const events = steps(s, 1);
  assert.ok(events.some(ev => ev.type === 'waveCleared'));
  assert.equal(tower.hp, 50 + Math.ceil(towerMaxHp(1) * .25));
  assert.equal(second.hp, Math.ceil(towerMaxHp(1) * .25), 'even a disabled tower rejoins after the wave');
});

test('the multiplayer protocol accepts a repair command and rejects smuggled fields', () => {
  assert.deepEqual(normalizeCommand({type: 'repairTower', pad: 1, expectedTowerId: 2}), {type: 'repairTower', pad: 1, expectedTowerId: 2});
  assert.equal(normalizeCommand({type: 'repairTower', pad: 1, money: 9999}), null);
});
