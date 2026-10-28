'use strict';

const assert = require('node:assert/strict');
const api = require('../src/coop-movement.js');

const connected = () => ({
  host: { online: true },
  guest: { online: true }
});

const initial = () => api.create({
  schemaVersion: 1,
  id: 'session-1',
  hostUid: 'h',
  players: {
    host: { uid: 'h', x: 120, y: 300 },
    guest: { uid: 'g', x: 170, y: 300 }
  }
});

const command = (slot, seq = 1, x = 500, y = 300) => ({
  sessionId: 'session-1',
  uid: slot === 'host' ? 'h' : 'g',
  seq,
  x,
  y
});

let passed = 0;
let failed = 0;

function test(name, callback) {
  try {
    callback();
    passed++;
    console.log('OK   ' + name);
  } catch (error) {
    failed++;
    console.error('FAIL ' + name);
    console.error(error.stack || error);
  }
}

test('Ohne Klick bleibt jeder Held stehen', () => {
  const state = initial();
  assert.equal(api.step(state, {}, connected(), 0.1), state);
});

test('Host-Befehl bewegt nur den Host-Helden', () => {
  const state = api.step(
    initial(), { host: command('host') }, connected(), 0.1
  );
  assert.equal(state.players.host.x, 135);
  assert.equal(state.players.guest.x, 170);
});

test('Gast-Befehl bewegt nur den Gast-Helden', () => {
  const state = api.step(
    initial(), { guest: command('guest') }, connected(), 0.1
  );
  assert.equal(state.players.host.x, 120);
  assert.equal(state.players.guest.x, 185);
});

test('Fremde UID kann den Partner nicht steuern', () => {
  const state = initial();
  assert.equal(
    api.step(state, { guest: command('host') }, connected(), 0.1),
    state
  );
});

test('Befehl anderer Sitzung wird verworfen', () => {
  const state = initial();
  assert.equal(
    api.step(state, {
      host: { ...command('host'), sessionId: 'alt' }
    }, connected(), 0.1),
    state
  );
});

test('Doppelter Befehl wird nicht erneut angenommen', () => {
  const state = api.step(
    initial(), { host: command('host', 1, 125) }, connected(), 0.1
  );
  assert.equal(state.players.host.target, null);
  assert.equal(
    api.step(state, {
      host: command('host', 1, 900)
    }, connected(), 0.1),
    state
  );
});

test('Veraltete Sequenz wird ignoriert', () => {
  const state = api.step(
    initial(), { host: command('host', 2, 125) }, connected(), 0.1
  );
  assert.equal(
    api.step(state, {
      host: command('host', 1, 900)
    }, connected(), 0.1),
    state
  );
});

test('Ungültige Zielkoordinaten werden ignoriert', () => {
  for (const x of [NaN, Infinity, -1, 941]) {
    const state = initial();
    assert.equal(
      api.step(state, {
        host: command('host', 1, x)
      }, connected(), 0.1),
      state
    );
  }
});

test('Nicht ganzzahlige Sequenz wird ignoriert', () => {
  const state = initial();
  assert.equal(
    api.step(state, {
      host: command('host', 1.5)
    }, connected(), 0.1),
    state
  );
});

test('Diagonale Bewegung bleibt gleich schnell', () => {
  const next = api.step(
    initial(), { host: command('host', 1, 500, 500) },
    connected(), 0.1
  );
  const distance = Math.hypot(
    next.players.host.x - 120,
    next.players.host.y - 300
  );
  assert.ok(Math.abs(distance - 15) < 1e-8);
});

test('Ziel wird ohne Überschwingen erreicht', () => {
  const state = api.step(
    initial(), { host: command('host', 1, 125) },
    connected(), 0.1
  );
  assert.equal(state.players.host.x, 125);
  assert.equal(state.players.host.target, null);
});

test('Disconnect pausiert und löscht Laufziele', () => {
  let state = api.step(
    initial(), { host: command('host') }, connected(), 0.1
  );
  const x = state.players.host.x;

  state = api.step(state, {}, {
    host: { online: true },
    guest: { online: false }
  }, 0.1);

  assert.equal(state.paused, true);
  assert.equal(state.players.host.x, x);
  assert.equal(state.players.host.target, null);
});

test('Wiederverbindung setzt nicht automatisch fort', () => {
  const paused = api.step(initial(), {}, {}, 0.1);
  const next = api.step(
    paused, { host: command('host') }, connected(), 0.1
  );
  assert.equal(next.paused, true);
  assert.equal(next.players.host.x, 120);
  assert.equal(next.players.host.target, null);
});

test('Fortsetzung verwirft wartende alte Ziele', () => {
  let state = api.step(initial(), {}, {}, 0.1);

  state = api.resume(
    state, { host: command('host') }, connected()
  );

  assert.equal(state.paused, false);
  assert.equal(state.players.host.ack, 1);
  assert.equal(state.players.host.target, null);

  assert.equal(
    api.step(state, { host: command('host') }, connected(), 0.1),
    state
  );
});

test('Fortsetzung braucht zwei verbundene Spieler', () => {
  const state = api.step(initial(), {}, {}, 0.1);
  assert.throws(() => api.resume(state, {}, {}), /verbunden/);
});

test('Ungültiger Zeitschritt wird abgewiesen', () => {
  for (const dt of [NaN, Infinity, -1, 1]) {
    assert.throws(
      () => api.step(initial(), {}, connected(), dt),
      /Zeitschritt/
    );
  }
});

test('Eingaben werden nicht verändert', () => {
  const state = initial();
  const commands = { host: command('host') };
  const presence = connected();
  const before = JSON.stringify({ state, commands, presence });

  api.step(state, commands, presence, 0.1);

  assert.equal(
    JSON.stringify({ state, commands, presence }),
    before
  );
});

test('Revision ändert sich nur bei Zustandsänderung', () => {
  const state = initial();
  const next = api.step(
    state, { host: command('host') }, connected(), 0.1
  );
  assert.equal(state.revision, 0);
  assert.equal(next.revision, 1);
  assert.equal(api.step(state, {}, connected(), 0), state);
});

console.log(
  '\nErgebnis C1b-Kern: ' + passed +
  ' bestanden, ' + failed + ' fehlgeschlagen.'
);
process.exitCode = failed ? 1 : 0;
