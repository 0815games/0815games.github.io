import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createMatch} from '../core/simulation.mjs';
import {createPlayer} from '../core/match.mjs';
import {createHost, restoreHost, PROTOCOL_VERSION} from '../core/protocol.mjs';
import {createFourCoop} from '../core/four-modes.mjs';
import {makeEnemy, towerMaxHp, SOLDIER_MAX_HP} from '../core/combat.mjs';
import {getMap} from '../core/maps.mjs';

// Block E, Scheibe 2 (E5): Die Lebens-, Angriffs- und Reparaturzustände im
// Mehrspieler-Host. Der Spieler-Host simuliert; Snapshots und Checkpoints
// sind volle Match-Klone, also muss der E-Zustand (Soldaten-/Turmleben,
// Ausfall, Schutz, Vorwarnung, laufende Reparatur) darin mitreisen, bei
// Reconnect und Host-Restore exakt einmal wirken und darf alte
// Checkpoints ohne E-Felder nicht still vergiften.

const profile = {name: 'Soldier', gender: 'female', level: 2};
const msg = (seq, command) => ({version: PROTOCOL_VERSION, seq, command});

function coopHost() {
  const match = createMatch([createPlayer('alice', profile), createPlayer('bob', profile)]);
  match.wave = 5;
  match.running = true;
  match.spawnLeft = 0;
  const host = createHost(match);
  assert.equal(host.receive('alice', msg(1, {type: 'build', pad: 0, towerType: 0})).status, 'queued');
  assert.equal(host.advance().commands[0].result.ok, true, 'tower builds through the protocol');
  return host;
}
function foe(match, kind, x, y) {
  const e = {...makeEnemy(kind, Math.max(1, match.wave)), hp: 100000, maxHp: 100000, x, y, segment: 1, speed: 0};
  match.enemies.push(e);
  return e;
}
function mutate(host, fn) {
  const checkpoint = host.checkpoint();
  // Der Bau-Schritt oben beendet die leere Welle 0 und stoppt die Simulation;
  // der Checkpoint startet sie für die E-Lage neu (Welle 5, laufend).
  checkpoint.match.wave = 5;
  checkpoint.match.running = true;
  checkpoint.match.spawnLeft = 0;
  checkpoint.match.ended = false;
  fn(checkpoint.match);
  return restoreHost(JSON.parse(JSON.stringify(checkpoint)));
}
function advance(host, n) {
  const events = [];
  for (let i = 0; i < n; i++) events.push(...host.advance().events);
  return events;
}

test('snapshots carry the Block E state, detached from the host', () => {
  let host = coopHost();
  host = mutate(host, match => {
    match.players.bob.hp = 41;
    match.players.bob.downed = 0;
    match.players.bob.protect = 2;
    const tower = match.towers[0];
    tower.hp = 40;
    foe(match, 'infantry', match.players.bob.x - 30, match.players.bob.y);
  });
  advance(host, 3);
  const view = host.snapshotFor('bob').match;
  assert.equal(view.players.bob.hp, 41, 'soldier life travels in the snapshot');
  assert.ok(view.enemies.some(e => e.windup?.kind === 'soldier'), 'the telegraph travels, so guests see the warning ring');
  assert.equal(view.towers[0].hp, 40, 'tower life travels');
  view.players.bob.hp = 1;
  assert.equal(host.snapshotFor('bob').match.players.bob.hp, 41, 'the view is a detached clone');
});

test('a duplicated repair command pays once; a second repair while one runs is refused', () => {
  let host = coopHost();
  host = mutate(host, match => { match.towers[0].hp = 40; foe(match, 'infantry', 60, 60); });
  const before = host.snapshotFor('alice').match.players.alice.money;
  const envelope = msg(2, {type: 'repairTower', pad: 0});
  assert.equal(host.receive('alice', envelope).status, 'queued');
  assert.equal(host.receive('alice', envelope).status, 'queued', 'the retry is the same receipt, not a second payment');
  const applied = host.advance();
  assert.equal(applied.commands.filter(c => c.command.type === 'repairTower').length, 1);
  assert.equal(host.receive('alice', envelope).status, 'applied', 'the retry answers from the receipt');
  assert.equal(host.snapshotFor('alice').match.players.alice.money, before - 10, 'paid exactly once by the confirming player');
  assert.equal(host.receive('bob', msg(1, {type: 'repairTower', pad: 0})).status, 'queued');
  const bobBefore = host.snapshotFor('bob').match.players.bob.money;
  assert.equal(host.advance().commands[0].result.ok, false, 'no parallel repair on the same tower');
  assert.equal(host.snapshotFor('bob').match.players.bob.money, bobBefore, 'the refused repair costs the other player nothing');
});

test('a checkpoint restored mid-repair finishes the repair exactly once', () => {
  let host = coopHost();
  host = mutate(host, match => { match.towers[0].hp = 40; foe(match, 'infantry', 60, 60); });
  host.receive('alice', msg(2, {type: 'repairTower', pad: 0}));
  host.advance();
  const mid = host.snapshotFor('alice').match.towers[0];
  assert.ok(mid.repairing > 0, 'the repair is running at checkpoint time');
  const restored = restoreHost(JSON.parse(JSON.stringify(host.checkpoint())));
  const events = advance(restored, 90);
  assert.equal(events.filter(e => e.type === 'towerRepaired').length, 1, 'one repair lands, not two');
  assert.equal(restored.snapshotFor('alice').match.towers[0].hp, 40 + 80, 'the quoted heal lands in full');
});

test('a checkpoint restored mid-telegraph lands the strike exactly once', () => {
  let host = coopHost();
  host = mutate(host, match => foe(match, 'infantry', match.players.bob.x - 30, match.players.bob.y));
  advance(host, 3);
  assert.ok(host.snapshotFor('alice').match.enemies[0].windup, 'the strike is winding up at checkpoint time');
  const restored = restoreHost(JSON.parse(JSON.stringify(host.checkpoint())));
  const events = advance(restored, 30);
  assert.equal(events.filter(e => e.type === 'enemyAttack' && e.playerId === 'bob').length, 1);
  assert.equal(restored.snapshotFor('alice').match.players.bob.hp, SOLDIER_MAX_HP - 3);
});

test('a disconnected soldier is not hit and not targeted; reconnect makes him a target again', () => {
  let host = coopHost();
  host = mutate(host, match => foe(match, 'infantry', match.players.bob.x - 30, match.players.bob.y));
  advance(host, 3);
  assert.equal(host.receive('bob', msg(1, {type: 'direction', x: 1, y: 0})).status, 'queued');
  assert.equal(host.suspendPlayer('bob'), true);
  assert.equal(host.setPlayerActive('bob', false), true);
  assert.equal(host.snapshotFor('bob').match.players.bob.active, false);
  advance(host, 40);
  assert.equal(host.snapshotFor('alice').match.players.bob.hp, SOLDIER_MAX_HP, 'the telegraphed strike does not hit an absent soldier');
  host.setPlayerActive('bob', true);
  const events = advance(host, 150);
  assert.ok(events.some(e => e.type === 'enemyAttack' && e.playerId === 'bob'), 'after reconnect the same enemy may strike again');
});

test('a downed soldier in a restored checkpoint returns protected, not disconnected', () => {
  let host = coopHost();
  host = mutate(host, match => {
    match.players.bob.hp = 0;
    match.players.bob.downed = 8;
    match.enemies = [];
  });
  const events = advance(host, 30 * 9);
  assert.ok(events.some(e => e.type === 'soldierReturn' && e.playerId === 'bob'));
  const bob = host.snapshotFor('alice').match.players.bob;
  assert.equal(bob.hp, SOLDIER_MAX_HP, 'returns with full life');
  assert.notEqual(bob.active, false, 'still a match member, not suspended');
});

test('a legacy checkpoint without Block E fields restores and plays without inventing damage', () => {
  let host = coopHost();
  const checkpoint = host.checkpoint();
  for (const p of Object.values(checkpoint.match.players)) { delete p.hp; delete p.downed; delete p.protect; }
  for (const t of checkpoint.match.towers) { delete t.hp; delete t.maxHp; delete t.repairing; }
  const restored = restoreHost(JSON.parse(JSON.stringify(checkpoint)));
  advance(restored, 5);
  assert.equal(restored.receive('alice', msg(2, {type: 'repairTower', pad: 0})).status, 'queued');
  assert.equal(restored.advance().commands[0].result.ok, false, 'a tower without recorded damage counts as whole, not as broken');
});

test('checkpoint version stays gated and the busy snapshot stays small', () => {
  assert.throws(() => restoreHost({version: 99}), /Unsupported checkpoint version/);
  let host = coopHost();
  host = mutate(host, match => {
    match.towers[0].hp = 40;
    foe(match, 'infantry', match.players.bob.x - 30, match.players.bob.y);
    const pad = getMap(match.mapId).pads[0];
    foe(match, 'tank', pad.x + 50, pad.y);
  });
  advance(host, 3);
  const bytes = Buffer.byteLength(JSON.stringify(host.snapshotFor('alice')));
  assert.ok(bytes < 32768, `a mid-fight snapshot with telegraphs stays lean (saw ${bytes})`);
  assert.ok(host.snapshotFor('alice').match.towers[0].maxHp === towerMaxHp(1) || host.snapshotFor('alice').match.towers[0].hp === 40);
});

test('four-player snapshots carry tower life in the shared field', () => {
  const players = ['alice', 'bob', 'cara', 'dan'].map(id => createPlayer(id, profile));
  const host = createHost(createFourCoop(players, 'alice'));
  const restored = mutate(host, match => {
    match.match.towers.push({id: 1, pad: 0, type: 0, level: 1, ownerId: 'alice', hp: 55, maxHp: towerMaxHp(1)});
  });
  const view = restored.snapshotFor('cara').match;
  assert.equal(view.match.towers[0].hp, 55, 'the shared four-player field shows the same tower life to every member');
});
