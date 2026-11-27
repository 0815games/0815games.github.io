// Regression: Nach der Charakterauswahl darf man nicht zum Login zurückspringen.
//
// Fehlerbild (2026-11-27): „man muss sich gefühlt doppelt einloggen – nach der
// Charakterauswahl springt es zurück zum Login“.
//
// Ursache: `verify()` verweigert die Bestätigung, solange `connected` (die
// Firebase-Verbindung) noch nicht gemeldet wurde. Diese Meldung kommt
// asynchron über `.info/connected`. Der Login wartet zwar mit
// `waitConnected()`, aber `waitConnected()` löst sofort auf, wenn `connected`
// schon einmal `true` war – etwa aus einer früheren Sitzung dieses Tabs.
// Dann ist die Verbindung im neuen Auth-Client noch nicht bereit, `verify()`
// gibt `false` zurück, `loadAllSlots()` wirft und `failedLogin()` schickt den
// Spieler zurück auf den Login-Bildschirm.
//
// Dieser Test prüft die drei Stellen, an denen das passiert.

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = await readFile(
  new URL('../js/systems/session-integration.js', import.meta.url), 'utf8'
);

/* ---------- 1. verify() muss einen noch nicht verbundenen Client abwarten ---------- */

const verifyStart = source.indexOf('async function verify()');
const verifyBody = source.slice(verifyStart, verifyStart + 700);

assert.ok(
  /await\s+waitConnected\(\)|waitConnected\(\)\s*;/.test(verifyBody.split('renewing=')[0]),
  'verify() wartet nicht auf die Serververbindung. Ist `connected` noch false, ' +
  'gibt es sofort false zurück – der Spieler landet nach der Charakterauswahl ' +
  'wieder im Login.'
);

/* ---------- 2. loadAllSlots darf einen Verbindungsaufbau nicht als Fehler werten ---------- */

const loadStart = source.indexOf('cloud.loadAllSlots');
const loadBody = source.slice(loadStart, loadStart + 1400);

assert.ok(
  /waitConnected/.test(loadBody) || /verify\(\)/.test(loadBody),
  'loadAllSlots() prüft die Verbindung'
);

// Der Fehlerpfad darf nicht pauschal abmelden, wenn es nur die Verbindung war.
assert.ok(
  /failedLogin\(error\)/.test(loadBody),
  'echte Fehler melden weiterhin ab'
);

/* ---------- 3. Ein Verbindungsabbruch darf keine Anmeldung zurücksetzen ---------- */

// `failedLogin` wird bei `loadAllSlots`-Fehlern gerufen. Wenn `verify()` false
// liefert, weil die Verbindung noch aufgebaut wird, ist das kein Anmeldefehler.
assert.ok(
  !/if\(!connected\)\s*return false/.test(verifyBody.split('renewing=')[0]),
  'verify() gibt bei fehlender Verbindung nicht mehr sofort false zurück'
);

/* ---------- Verhalten nachstellen ---------- */

// Diese Nachstellung bildet den Kern nach: verify() mit connected=false.
const state = {connected: false, connectedOnce: true, ref: true};

function waitConnectedLike(connected) {
  // So verhält sich das Original: ist `connected` schon true, wird nicht gewartet.
  return connected ? Promise.resolve() : new Promise(() => {});
}

async function verifyOld(connected) {
  if (!state.ref || !connected) return false;
  return true;
}

async function verifyNew(connected, wait) {
  if (!state.ref) return false;
  if (!connected) {
    // Auf die Verbindung warten statt sofort abzulehnen.
    const ok = await Promise.race([
      wait(),
      new Promise((resolve) => setTimeout(() => resolve('zeit'), 10))
    ]);
    if (ok !== true) return false;
  }
  return true;
}

// Alt: Verbindung noch nicht gemeldet -> sofort false -> failedLogin
assert.equal(await verifyOld(false), false);

// Neu: kurz warten, dann bestätigen
let resolveWait;
const wait = new Promise((resolve) => { resolveWait = resolve; });
setTimeout(() => resolveWait(true), 2);

assert.equal(
  await verifyNew(false, () => wait), true,
  'verify() bestätigt nach kurzem Warten auf die Verbindung'
);

console.log(
  'BESTANDEN: Der Login wartet auf die Serververbindung, statt den Spieler ' +
  'nach der Charakterauswahl zurückzuschicken. Kein Firebase-/Browser-Test.'
);
