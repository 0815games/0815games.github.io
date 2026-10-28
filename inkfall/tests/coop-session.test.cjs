'use strict';

const assert = require('node:assert/strict');
const api = require('../src/coop-session.js');

function room() {
  return {
    status: 'prepared',
    host: {
      uid: 'host-1',
      name: 'Hostspieler',
      heroClass: 'knight',
      heroName: 'Thorin',
      ready: true,
      online: true,
      soloRun: { wave: 8, gold: 999 }
    },
    guest: {
      uid: 'guest-1',
      name: 'Gastspieler',
      heroClass: 'mage',
      heroName: 'Lyra',
      ready: true,
      online: true
    }
  };
}

const options = () => ({
  roomCode: 'ABCDEFGH',
  sessionId: 'session-1',
  actorUid: 'host-1',
  now: 123456
});

const session = () => api.create(room(), options());

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

test('Zwei benannte Helden werden übernommen', () => {
  const s = session();
  assert.equal(s.players.host.heroName, 'Thorin');
  assert.equal(s.players.guest.heroName, 'Lyra');
  assert.equal(s.players.host.target, null);
  assert.equal(s.players.guest.target, null);
});

test('Solo-Fortschritt wird nicht in Coop übernommen', () => {
  const s = session();
  assert.equal(s.wave, 0);
  assert.equal(s.economy.gold, 150);
  assert.equal(s.base.lives, 100);
  assert.equal(s.players.host.soloRun, undefined);
  assert.deepEqual(s.towers, []);
});

test('Raumdaten bleiben unverändert', () => {
  const r = room();
  const before = JSON.stringify(r);
  api.create(r, options());
  assert.equal(JSON.stringify(r), before);
});

test('Fehlender Gast verhindert den Start', () => {
  const r = room();
  delete r.guest;
  assert.throws(() => api.create(r, options()), /Spieler-ID/);
});

test('Derselbe Account kann nicht beide Plätze belegen', () => {
  const r = room();
  r.guest.uid = r.host.uid;
  assert.throws(() => api.create(r, options()), /unterschiedliche/);
});

test('Nicht bereiter Spieler verhindert den Start', () => {
  const r = room();
  r.guest.ready = false;
  assert.throws(() => api.create(r, options()), /bereit/);
});

test('Nur der Host erstellt die Sitzung', () => {
  assert.throws(
    () => api.create(room(), { ...options(), actorUid: 'guest-1' }),
    /Host/
  );
});

test('Ungültige IDs und Zeitwerte werden abgewiesen', () => {
  assert.throws(
    () => api.create(room(), { ...options(), sessionId: '../falsch' }),
    /Sitzungs-ID/
  );
  assert.throws(
    () => api.create(room(), { ...options(), roomCode: 'falsch' }),
    /Raumcode/
  );
  assert.throws(
    () => api.create(room(), { ...options(), now: NaN }),
    /Startzeitpunkt/
  );
});

test('Phasenwechsel erzeugt neuen Zustand mit neuer Revision', () => {
  const s = session();
  const next = api.transition(s, 'running', 'host-1');

  assert.equal(s.phase, 'preparation');
  assert.equal(s.revision, 0);
  assert.equal(next.phase, 'running');
  assert.equal(next.revision, 1);
});

test('Gast kann die Spielphase nicht ändern', () => {
  assert.throws(
    () => api.transition(session(), 'running', 'guest-1'),
    /Host/
  );
});

test('Unzulässige Phasenwechsel werden abgewiesen', () => {
  assert.throws(
    () => api.transition(session(), 'won', 'host-1'),
    /nicht erlaubt/
  );
});

test('Verbindungsabbruch pausiert eine laufende Partie', () => {
  const running = api.transition(session(), 'running', 'host-1');
  const paused = api.connection(running, 'guest-1', false);

  assert.equal(paused.phase, 'paused');
  assert.equal(running.players.guest.online, true);
  assert.equal(paused.players.guest.online, false);
});

test('Doppelte Verbindungsmeldung erhöht Revision nicht', () => {
  const s = session();
  assert.equal(api.connection(s, 'guest-1', true), s);
});

test('Unbekannter Account darf keine Verbindung ändern', () => {
  assert.throws(
    () => api.connection(session(), 'fremd', false),
    /gehört nicht/
  );
});

test('Wiederverbindung startet den Kampf nicht automatisch', () => {
  let s = api.transition(session(), 'running', 'host-1');
  s = api.connection(s, 'guest-1', false);

  assert.throws(
    () => api.transition(s, 'running', 'host-1'),
    /verbunden/
  );

  s = api.connection(s, 'guest-1', true);
  assert.equal(s.phase, 'paused');

  s = api.transition(s, 'running', 'host-1');
  assert.equal(s.phase, 'running');
});

test('Geschlossene Sitzung kann nicht neu gestartet werden', () => {
  const s = api.transition(session(), 'closed', 'host-1');

  assert.throws(
    () => api.transition(s, 'running', 'host-1'),
    /nicht erlaubt/
  );
  assert.throws(
    () => api.connection(s, 'guest-1', false),
    /geschlossen/
  );
});

console.log(
  '\nErgebnis B1: ' + passed +
  ' bestanden, ' + failed + ' fehlgeschlagen.'
);

process.exitCode = failed ? 1 : 0;
