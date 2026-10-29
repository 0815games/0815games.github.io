'use strict';

const assert = require('node:assert/strict');
const { createViewModel } = require('../game/js/coop-view.js');

function session() {
  return {
    schemaVersion:1,
    id:'session-1',
    roomCode:'ABCDEFGH',
    hostUid:'h',
    phase:'preparation',
    players:{
      host:{
        uid:'h', heroClass:'knight', heroName:'Thorin',
        x:120, y:300, online:true
      },
      guest:{
        uid:'g', heroClass:'mage', heroName:'Lyra',
        x:170, y:300, online:true
      }
    }
  };
}

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

test('Host erkennt nur seinen Helden als eigenen', () => {
  const model = createViewModel(session(), 'h');
  assert.equal(model.players[0].isLocal, true);
  assert.equal(model.players[1].isLocal, false);
});

test('Gast erkennt nur seinen Helden als eigenen', () => {
  const model = createViewModel(session(), 'g');
  assert.equal(model.players[0].isLocal, false);
  assert.equal(model.players[1].isLocal, true);
});

test('Beide Namen und Positionen bleiben erhalten', () => {
  const model = createViewModel(session(), 'h');
  assert.equal(model.players[0].heroName, 'Thorin');
  assert.equal(model.players[1].heroName, 'Lyra');
  assert.equal(model.players[1].x, 170);
});

test('Fremder Account wird abgewiesen', () => {
  assert.throws(() => createViewModel(session(), 'fremd'));
});

test('Fehlender Spieler wird abgewiesen', () => {
  const data = session();
  delete data.players.guest;
  assert.throws(() => createViewModel(data, 'h'));
});

test('Doppelte Spieler-ID wird abgewiesen', () => {
  const data = session();
  data.players.guest.uid = 'h';
  assert.throws(() => createViewModel(data, 'h'));
});

test('Falsche Host-Zuordnung wird abgewiesen', () => {
  const data = session();
  data.hostUid = 'g';
  assert.throws(() => createViewModel(data, 'h'));
});

test('Ungültige Koordinaten werden abgewiesen', () => {
  for (const x of [NaN, Infinity, -1, 941]) {
    const data = session();
    data.players.host.x = x;
    assert.throws(() => createViewModel(data, 'h'));
  }
});

test('Nicht verfügbare Klasse wird abgewiesen', () => {
  const data = session();
  data.players.host.heroClass = 'rogue';
  assert.throws(() => createViewModel(data, 'h'));
});

test('Live-Verbindung überschreibt nur die Anzeige', () => {
  const data = session();
  const before = JSON.stringify(data);

  const model = createViewModel(data, 'h', {
    host:{ online:true },
    guest:{ online:false }
  });

  assert.equal(model.players[1].online, false);
  assert.equal(JSON.stringify(data), before);
});

test('Ansichtsänderung verändert die Sitzung nicht', () => {
  const data = session();
  const model = createViewModel(data, 'h');

  model.players[0].heroName = 'Test';
  model.players[0].x = 900;

  assert.equal(data.players.host.heroName, 'Thorin');
  assert.equal(data.players.host.x, 120);
});

test('Ansicht importiert keine Solo- oder Wirtschaftsdaten', () => {
  const data = session();
  data.soloRun = { wave:8 };
  data.economy = { gold:999 };

  const model = createViewModel(data, 'h');
  assert.equal(model.soloRun, undefined);
  assert.equal(model.economy, undefined);
});

console.log(
  '\nErgebnis C1a: ' + passed +
  ' bestanden, ' + failed + ' fehlgeschlagen.'
);
process.exitCode = failed ? 1 : 0;
