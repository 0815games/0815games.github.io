import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createMatch, stepMatch, STEP} from '../core/simulation.mjs';
import {createPlayer} from '../core/match.mjs';

// Betreiber-Befund: Die Abklingzeit der Aktionsfähigkeit lief auch zwischen
// den Wellen weiter (nach Wellenende bis zum Start der nächsten Welle).
// Sie darf nur ablaufen, solange aktiv gespielt wird (state.running).

function setup() {
  const state = createMatch([createPlayer('solo', {name: 'Solo', gender: 'female'})]);
  state.wave = 1;
  state.enemies = [];
  state.spawnLeft = 0;
  state.players.solo.cooldown = 20;
  return state;
}

test('the ability cooldown does not tick between waves', () => {
  const state = setup();
  state.running = false;
  for (let i = 0; i < 90; i++) stepMatch(state); // 3 s Bauphase
  assert.equal(state.players.solo.cooldown, 20, 'no recharge while the next wave is not started');
});

test('the soldier still moves between waves while the cooldown waits', () => {
  const state = setup();
  state.running = false;
  const before = state.players.solo.x;
  state.players.solo.direction = {x: 1, y: 0};
  for (let i = 0; i < 30; i++) stepMatch(state);
  assert.ok(state.players.solo.x > before, 'build-phase movement keeps working');
  assert.equal(state.players.solo.cooldown, 20);
});

test('the cooldown ticks while the wave is running and pauses again at wave end', () => {
  const state = setup();
  state.spawnLeft = 1; // Welle bleibt offen, sonst endet sie im ersten Schritt
  state.spawnTimer = 10000;
  state.running = true;
  for (let i = 0; i < 30; i++) stepMatch(state); // 1 s aktive Welle
  assert.ok(Math.abs(state.players.solo.cooldown - (20 - 30 * STEP)) < 1e-9, 'recharge advances during the wave');
  const atWaveEnd = state.players.solo.cooldown;
  state.running = false;
  for (let i = 0; i < 90; i++) stepMatch(state);
  assert.equal(state.players.solo.cooldown, atWaveEnd, 'recharge freezes again once the wave is over');
});

test('the cooldown never drops below zero while running', () => {
  const state = setup();
  state.players.solo.cooldown = 0.01;
  state.running = true;
  for (let i = 0; i < 30; i++) stepMatch(state);
  assert.equal(state.players.solo.cooldown, 0);
});
