// AFK-Schutz: nach fuenf Minuten Stille ein Fenster, kein stiller Logout.
//
// Vorher rief die update()-Schleife nach 300000 ms direkt `logout()`. Der
// Spieler landete im Login, ohne zu wissen warum. Diese Tests halten fest,
// dass jetzt erst gefragt wird - und dass aus dem Fenster heraus weder die
// Uhr weiterlaeuft noch ein zweites Fenster entsteht.

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

// ui_afk.js ist eine Browsermoduldatei ohne Export. Wie bei der Navigation
// laeuft sie im jsdom-Fenster - auf dem Code, der ausgeliefert wird.
function mitAfk({imSpiel = true} = {}) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <div id="login-screen"${imSpiel ? ' style="display:none"' : ''}></div>
    </body></html>`, {url: 'https://example.test/', runScripts: 'outside-only', pretendToBeVisual: true});
  const w = dom.window;
  w.eval(`var Network = { myId: ${imSpiel ? "'spieler'" : 'null'} };
          var Game = { state: ${imSpiel ? "{ view: 'map', inDialog: false }" : 'null'} };
          var UI = { lastInputTime: Date.now(), log: function(){}, logoutGrund: null,
                     logout: function(m){ this.logoutGrund = m; } };`);
  w.eval(read('src/ui', 'ui_afk.js'));
  return {dom, w, document: w.document};
}

test('nach fuenf Minuten kommt ein Fenster, kein Logout', () => {
  const {w, document} = mitAfk();
  w.eval('AFK.start();');
  assert.equal(w.eval('AFK.fensterOffen'), false, 'Das Fenster steht sofort offen');

  // Fuenf Minuten Stille
  w.eval('UI.lastInputTime = Date.now() - 5*60*1000; AFK.pruefen();');
  assert.equal(w.eval('AFK.fensterOffen'), true, 'Nach fuenf Minuten fehlt das Fenster');
  assert.equal(w.eval('UI.logoutGrund'), null, 'Es wurde ausgeloggt, statt zu fragen');

  const feld = document.getElementById('afk-popup');
  assert.ok(feld, 'kein #afk-popup im DOM');
  assert.equal(feld.hidden, false);
  // Mittig: das CSS setzt position:fixed und zentriert per Flex. Im jsdom
  // rechnet getComputedStyle die Utility-Klassen nicht, die Klasse allein
  // reicht als Nachweis - und der Stil steht in shell/style.css.
  assert.ok(feld.classList.contains('popup-mitte'), 'Das Fenster hat nicht die mittige Form');
  const css = readFileSync(join(ROOT, 'shell', 'style.css'), 'utf8');
  assert.match(css, /\.popup-mitte\s*\{[^}]*position:\s*fixed/);
  assert.match(css, /\.popup-mitte\s*\{[^}]*align-items:\s*center/);
  assert.match(css, /\.popup-mitte\s*\{[^}]*justify-content:\s*center/);
  // Und es bewegt sich: die Einrast-Animation.
  assert.match(css, /@keyframes popup-einrasten/);
  assert.match(css, /\.popup-feld\s*\{[^}]*animation:\s*popup-einrasten/);
  // Wer Bewegung abbestellt, bekommt sie nicht aufgezwungen.
  assert.match(css, /prefers-reduced-motion[^{]*\{[^}]*popup-feld/);
});

test('der Countdown zaehlt herunter und der Balken schrumpft', () => {
  const {w, document} = mitAfk();
  w.eval('AFK.start(); UI.lastInputTime = Date.now() - 5*60*1000; AFK.pruefen();');
  const feld = document.getElementById('afk-popup');
  const zaehler = feld.querySelector('[data-afk-zaehler]');
  const balken = feld.querySelector('[data-afk-balken]');

  const erst = zaehler.textContent;
  assert.match(erst, /^\d:\d\d$/, `Zaehler unerwartet: ${erst}`);
  const breit = parseFloat(balken.style.width);
  assert.ok(breit > 90 && breit <= 100, `Balken startet bei ${breit}%`);

  // 40 Sekunden spaeter
  w.eval('UI.lastInputTime = Date.now() - 5*60*1000 - 40000; AFK.pruefen();');
  const spaeter = zaehler.textContent;
  const schmal = parseFloat(balken.style.width);
  assert.notEqual(spaeter, erst, 'Der Zaehler steht still');
  assert.ok(schmal < breit, `Balken schrumpft nicht: ${breit} -> ${schmal}`);
  assert.ok(schmal < 45, `Balken steht nach 40 s noch bei ${schmal}%`);
});

test('ein Klick holt zurueck und schliesst das Fenster', () => {
  const {w, document} = mitAfk();
  w.eval('AFK.start(); UI.lastInputTime = Date.now() - 5*60*1000; AFK.pruefen();');
  const feld = document.getElementById('afk-popup');
  assert.equal(feld.hidden, false);

  feld.querySelector('[data-afk-bleiben]').click();
  assert.equal(feld.hidden, true, 'Das Fenster bleibt nach dem Klick offen');
  assert.equal(w.eval('AFK.fensterOffen'), false);
  // Die Uhr steht wieder auf jetzt - sonst waere der naechste Tick sofort
  // wieder ueber der Grenze.
  assert.ok(w.eval('AFK.stille()') < 1000, 'Die AFK-Uhr wurde nicht zurueckgesetzt');
});

test('erst nach der Nachfrist wird ausgeloggt', () => {
  const {w} = mitAfk();
  w.eval('AFK.start();');
  // 5:30 - Fenster steht, noch kein Logout
  w.eval('UI.lastInputTime = Date.now() - (5*60+30)*1000; AFK.pruefen();');
  assert.equal(w.eval('UI.logoutGrund'), null, 'Nach 5:30 wurde schon ausgeloggt');
  assert.equal(w.eval('AFK.fensterOffen'), true);

  // 6:01 - jetzt
  w.eval('UI.lastInputTime = Date.now() - (6*60+1)*1000; AFK.pruefen();');
  assert.equal(w.eval('UI.logoutGrund'), 'AFK: ZEITUEBERSCHREITUNG',
    `Logout-Grund unerwartet: ${w.eval('UI.logoutGrund')}`);
  // Und das Fenster ist danach zu - ein Logout mit offenem Popup waere Unsinn.
  assert.equal(w.eval('AFK.fensterOffen'), false);
});

test('auf dem Login-Bildschirm schweigt der Schutz', () => {
  const {w} = mitAfk({imSpiel: false});
  w.eval('AFK.start(); UI.lastInputTime = Date.now() - 10*60*1000; AFK.pruefen();');
  assert.equal(w.eval('AFK.fensterOffen'), false, 'Fenster auf dem Login-Bildschirm');
  assert.equal(w.eval('UI.logoutGrund'), null, 'Logout auf dem Login-Bildschirm');
});

test('das Fenster entsteht nur einmal', () => {
  const {w, document} = mitAfk();
  w.eval('AFK.start(); UI.lastInputTime = Date.now() - 5*60*1000;');
  for (let i = 0; i < 20; i++) w.eval('AFK.pruefen();');
  assert.equal(document.querySelectorAll('#afk-popup').length, 1,
    'Bei jedem Tick entsteht ein neues Fenster - dann flackert und springt der Fokus');
});

test('die alte stille Abmeldung ist aus der Update-Schleife raus', () => {
  // Der eigentliche Fehler: in ui_render_core.update() stand ein Aufruf von
  // logout() nach 300000 ms. Ein Popup davor nuetzt nichts, wenn der alte
  // Abbruch daneben stehen bleibt.
  const quelle = read('src/ui', 'ui_render_core.js');
  assert.match(quelle, /AFK\.pruefen\(\)/, 'update() ruft den AFK-Schutz nicht');
  const abAfk = quelle.slice(quelle.indexOf('AFK.pruefen'));
  const naechsteSektion = abAfk.indexOf('// ---');
  const block = naechsteSektion > 0 ? abAfk.slice(0, naechsteSektion) : abAfk.slice(0, 600);
  assert.doesNotMatch(block, /this\.logout\(/, 'In update() steht noch ein direkter Logout');

  // Dasselbe in ui_core.js: dort stand die zweite Fassung.
  const core = read('src/ui', 'ui_core.js');
  assert.doesNotMatch(core, /Date\.now\(\) - this\.lastInputTime > 300000/,
    'Die alte AFK-Pruefung in ui_core.js steht noch');
});
