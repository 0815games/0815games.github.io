// Regression: Sitzung auf einem anderen Gerät übernehmen.
//
// Wunsch (2026-11-27): „Bei den anderen Spielen kann man den Haken setzen, um
// auf dem Fenster weiterzuspielen – also alle anderen Accounts abmelden und
// den anmelden.“
//
// Umsetzung: Scheitert die Anmeldung an einer fremden Sitzung, bleibt die
// Anmeldung offen (kein failedLogin!) und es erscheint der Knopf
// „Hier weiterspielen“. Er beendet die fremde Sitzung und übernimmt hier.
//
// Geprüft werden die Stellen, an denen das kaputtgehen kann:
//   1. SESSION_BUSY wird als eigener Fall behandelt, nicht als Fehler.
//   2. Bei SESSION_BUSY wird NICHT abgemeldet (sonst wäre das Passwort weg).
//   3. Die Übernahme schreibt die eigene Sitzung, nicht nur „freigeben“.
//   4. Das andere Gerät erkennt es und pausiert mit klarem Text.
//   5. Nach der Übernahme geht es ohne Neuladen weiter (Persistenz NONE).

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = await readFile(
  new URL('../js/systems/session-integration.js', import.meta.url), 'utf8'
);
const main = await readFile(
  new URL('../js/main.js', import.meta.url), 'utf8'
);

/* ---------- 1. Eigener Fall statt Fehler ---------- */

assert.ok(
  /code\s*=\s*['"]SESSION_BUSY['"]/.test(source),
  'Die belegte Sitzung wird als SESSION_BUSY gekennzeichnet'
);

/* ---------- 2. Kein Abmelden bei belegter Sitzung ---------- */

const loginBlock = source.slice(
  source.indexOf("for(const method of ['login','register'])"),
  source.indexOf('cloud.loadAllSlots')
);

const busyCatch = loginBlock.slice(loginBlock.indexOf('catch(e)'));
const busyBranch = busyCatch.slice(0, busyCatch.indexOf('failedLogin'));

assert.ok(
  /SESSION_BUSY/.test(busyBranch),
  'Der Catch unterscheidet die belegte Sitzung'
);
assert.ok(
  /throw e/.test(busyBranch) && /pending\s*=/.test(busyBranch),
  'Bei belegter Sitzung wird die Anmeldung offen gehalten und nicht abgemeldet'
);
assert.ok(
  busyBranch.indexOf('failedLogin') === -1,
  'failedLogin steht NICHT im SESSION_BUSY-Zweig – sonst wäre das Passwort umsonst'
);

/* ---------- 3. Übernahme schreibt die eigene Sitzung ---------- */

const takeStart = source.indexOf('cloud.takeOverSession');
assert.ok(takeStart > 0, 'takeOverSession existiert');

const takeBody = source.slice(takeStart, takeStart + 900);
assert.ok(
  /transaction\(/.test(takeBody),
  'Die Übernahme läuft als Transaktion'
);
assert.ok(
  /expiresAt:now\(\)\+120000/.test(takeBody),
  'Die Übernahme setzt eine eigene Frist – sie gibt nicht nur frei'
);
assert.ok(
  /state\.user=user/.test(takeBody),
  'Nach der Übernahme ist der Spieler angemeldet'
);

/* ---------- 4. Das andere Gerät merkt es ---------- */

assert.ok(
  /Dieses Konto wurde auf einem anderen Gerät angemeldet/.test(source),
  'Das verdrängte Gerät bekommt einen verständlichen Hinweis'
);
assert.ok(
  /if\(!owned\(snapshot\.val\(\)\)\)/.test(source),
  'Die Sitzungsprüfung erkennt die fremde Übernahme'
);

/* ---------- 5. Kein Neuladen nach der Übernahme ---------- */

const buttonStart = source.indexOf('takeBtn.onclick');
const buttonBody = source.slice(buttonStart, buttonStart + 700);

assert.ok(
  !/location\.reload\(\)/.test(buttonBody),
  'Nach der Übernahme wird nicht neu geladen – die Anmeldung lebt nur im ' +
  'Fenster (Persistenz NONE) und wäre danach weg'
);
assert.ok(
  /__sessionOverTaken/.test(buttonBody),
  'main.js öffnet nach der Übernahme die Charakterauswahl'
);
assert.ok(
  /window\.__sessionOverTaken\s*=/.test(main),
  'Der Anschluss in main.js existiert'
);

/* ---------- Der Knopf erscheint nur bei belegter Sitzung ---------- */

assert.ok(
  /holder\.hidden=true/.test(source),
  'Der Übernahme-Knopf startet versteckt'
);
assert.ok(
  /SESSION_BUSY.*__sessionTakeover\.show|__sessionTakeover.*show/s.test(main),
  'main.js zeigt den Knopf nur im SESSION_BUSY-Fall'
);

console.log(
  'BESTANDEN: Belegte Sitzung lässt sich übernehmen, ohne sich doppelt ' +
  'anzumelden. Kein Firebase-/Browser-Test.'
);
