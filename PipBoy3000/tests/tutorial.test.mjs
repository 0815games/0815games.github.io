// Tutorial: die ersten Schritte, interaktiv.
//
// Die Tests laufen auf dem ausgelieferten Code (src/ui/ui_tutorial.js) in
// einem jsdom-Fenster. Was sie festhalten:
//
//   1. Ein Schritt mit Handlung gibt NICHT frei, bevor die Handlung getan ist.
//   2. Der Stand liegt im Spielstand - abgebrochen heisst fortsetzen.
//   3. Die Ansicht heisst "inventory" (nicht "inv"), und ein Klick auf die
//      Blase wirft den Spieler nicht aus dem, was er gerade ansieht.

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

function mitTutorial() {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <div id="main-content"></div>
      <button id="btn-menu-toggle"></button>
      <div id="main-nav" class="hidden"></div>
      <button id="btn-inv"></button>
      <button id="btn-quests"></button>
      <canvas id="game-canvas"></canvas>
    </body></html>`, {url: 'https://example.test/', runScripts: 'outside-only', pretendToBeVisual: true});
  const w = dom.window;
  w.eval(`
    var gespeichert = 0;
    var Game = {
      state: { view: 'map', player: {x: 25, y: 25}, kills: 0 },
      saveGame: function(){ gespeichert++; }
    };
    var UI = {
      switchView: function(name){ Game.state.view = name; return Promise.resolve(); },
      toggleMenu: function(){
        var nav = document.getElementById('main-nav');
        var auf = nav.classList.contains('hidden');
        nav.classList.toggle('hidden', !auf);
        return auf;
      }
    };`);
  w.eval(read('src/ui', 'ui_tutorial.js'));
  const feld = () => w.document.getElementById('tutorial-feld');
  return {
    dom, w, document: w.document, feld,
    knopf: () => feld().querySelector('[data-tut-weiter]'),
    warten: () => feld().querySelector('[data-tut-warten]'),
    titel: () => feld().querySelector('[data-tut-titel]').textContent,
    schritt: () => feld().querySelector('[data-tut-schritt]').textContent
  };
}

test('das Tutorial startet beim ersten Schritt und nennt seine Laenge', () => {
  const {w, feld, titel, schritt} = mitTutorial();
  w.eval('Tutorial.start();');
  assert.ok(feld(), 'Das Tutorial-Feld fehlt');
  assert.equal(feld().hidden, false, 'Das Feld ist versteckt');
  assert.equal(schritt(), '1/7');
  assert.match(titel(), /VAULT-TEC/);
  assert.equal(w.eval('Game.state.tutorial'), 'laeuft');
});

test('ein Schritt mit Handlung gibt nicht sofort frei', () => {
  const {w, feld, knopf, warten, titel} = mitTutorial();
  w.eval('Tutorial.start();');
  knopf().click();                       // Schritt 1 -> 2 (Karte, wartet)
  assert.match(titel(), /KARTE/);
  assert.equal(knopf().hidden, true, 'Der Weiter-Knopf steht offen, obwohl nichts getan wurde');
  assert.equal(warten().hidden, false, 'Der Hinweis "WARTE AUF DICH" fehlt');
  w.eval('Game.state.player.x = 26; Tutorial.pruefen();');
  assert.equal(knopf().hidden, false, 'Nach der Bewegung fehlt der Weiter-Knopf');
});

test('ohne Bewegung bleibt der Schritt stehen, auch nach mehreren Pruefungen', () => {
  const {w, knopf} = mitTutorial();
  w.eval('Tutorial.start();');
  knopf().click();
  for (let i = 0; i < 5; i++) w.eval('Tutorial.pruefen();');
  assert.equal(knopf().hidden, true);
});

test('der Menue-Schritt oeffnet das Menue und wartet darauf', () => {
  const {w, document, knopf, titel} = mitTutorial();
  w.eval('Tutorial.start();');
  knopf().click();                        // Karte
  w.eval('Game.state.player.x = 26; Tutorial.pruefen();');
  knopf().click();                        // Menue
  assert.match(titel(), /MENÜ/);
  knopf().click();
  // Das Oeffnen laeuft in einem Timeout (sonst schliesst der Klick-Verteiler
  // es im selben Zug wieder) - hier direkt nachziehen.
  w.eval('UI.toggleMenu();');
  assert.equal(document.getElementById('main-nav').classList.contains('hidden'), false,
    'Das Menue ist zu geblieben');
});

test('der Inventar-Schritt fuehrt in die Ansicht "inventory", nicht "inv"', () => {
  // templates/inventory.html - 'inv' gibt es nicht, das waere ein 404 und der
  // Klick taete sichtbar nichts.
  const quelle = read('src/ui', 'ui_tutorial.js');
  assert.match(quelle, /oeffnetArg: 'inventory'/, 'Der Schritt zeigt auf die falsche Ansicht');
  assert.doesNotMatch(quelle, /oeffnetArg: 'inv'/, "Die Ansicht heisst 'inventory'");
});

test('das Tutorial laeuft bis zum Ende durch und merkt sich das', () => {
  const {w, feld, knopf} = mitTutorial();
  w.eval('Tutorial.start();');
  let schutz = 0;
  while (!feld().hidden && schutz++ < 40) {
    if (knopf().hidden) {
      w.eval(`var t = document.querySelector('[data-tut-titel]').textContent;
        if (/KARTE/.test(t)) Game.state.player.x = 30;
        else if (/MENÜ/.test(t)) UI.toggleMenu();
        else if (/ZEUG/.test(t)) UI.switchView('inventory');
        else if (/AUFGABEN/.test(t)) UI.switchView('quests');
        else if (/GEFAHR/.test(t)) Game.state.view = 'combat';
        Tutorial.pruefen();`);
    } else {
      knopf().click();
    }
  }
  assert.equal(feld().hidden, true, 'Das Feld steht am Ende noch offen');
  assert.equal(w.eval('Game.state.tutorial'), 'fertig');
  w.eval('Tutorial.vielleichtStarten();');
  assert.equal(feld().hidden, true, 'Das Tutorial kommt nach dem Ende wieder');
});

test('Ueberspringen beendet und merkt sich das', () => {
  const {w, feld} = mitTutorial();
  w.eval('Tutorial.start();');
  feld().querySelector('[data-tut-ueberspringen]').click();
  assert.equal(feld().hidden, true);
  assert.equal(w.eval('Game.state.tutorial'), 'fertig');
  assert.ok(w.eval('gespeichert') > 0, 'Der neue Stand wurde nicht gespeichert');
});

test('mitten im Tutorial abgebrochen: es geht dort weiter, nicht bei Schritt 1', () => {
  const {w, feld, knopf, schritt} = mitTutorial();
  w.eval('Tutorial.start();');
  knopf().click();                       // Schritt 2
  feld().hidden = true;                  // Abbruch (z.B. Neuladen)
  w.eval('Tutorial.vielleichtStarten();');
  assert.equal(feld().hidden, false, 'Es kommt nicht zurueck');
  assert.equal(schritt(), '2/7', 'Es faengt wieder bei Schritt 1 an');
});

test('der Kampf-Schritt ist weich - er laesst sich notfalls ueberspringen', () => {
  // Wer im Tutorial keinem Gegner begegnet, soll nicht festsitzen. Der Knopf
  // ist da, heisst aber anders - damit niemand denkt, er habe gekaempft.
  const {w, feld, knopf, titel} = mitTutorial();
  w.eval('Tutorial.zeigen(5);');
  assert.match(titel(), /GEFAHR/);
  assert.equal(knopf().hidden, false, 'Der Kampf-Schritt hat keinen Weiter-Knopf');
  assert.equal(knopf().textContent, 'TROTZDEM WEITER');
  knopf().click();
  assert.equal(feld().hidden, false, 'Es ging nicht weiter');
  assert.match(titel(), /RAUS INS ÖDLAND/);
});

test('steht der Spieler schon in der Ziel-Ansicht, schliesst sich das Menue trotzdem', () => {
  // Randfall: der Schritt gilt als erfuellt, weil die Ansicht schon stimmt -
  // dann bleibt das Menue sonst ueber der Ansicht stehen, die erklaert wird.
  const {w, document, knopf} = mitTutorial();
  w.eval(`Game.state.view = 'inventory'; UI.toggleMenu(); Tutorial.zeigen(3);`);
  assert.equal(document.getElementById('main-nav').classList.contains('hidden'), false);
  knopf().click();
  assert.equal(document.getElementById('main-nav').classList.contains('hidden'), true,
    'Das Menue steht noch ueber der Ansicht');
});

test('die Sprechblase steht ueber der Karte und laesst Klicks durch', () => {
  const css = read('shell', 'style.css');
  const feld = css.slice(css.indexOf('#tutorial-feld'), css.indexOf('#tutorial-feld') + 1200);
  assert.match(feld, /position:\s*absolute/);
  assert.match(feld, /bottom:\s*1rem/);
  assert.match(feld, /margin:\s*0 auto/);
  const umg = mitTutorial();
  umg.w.Tutorial.start();
  assert.equal(umg.feld().parentElement.id, 'main-content');
  umg.dom.window.close();
  assert.match(feld, /z-index:\s*10040/);
  // Der Zeiger darf keine Klicks abfangen - sonst trifft man das Ziel nicht.
  const zeiger = css.slice(css.indexOf('#tutorial-zeiger'), css.indexOf('#tutorial-zeiger') + 600);
  assert.match(zeiger, /pointer-events:\s*none/);
  // Wer Bewegung abbestellt, bekommt keine Animation.
  assert.match(css, /prefers-reduced-motion[^{]*\{[^}]*#tutorial-feld/);
});

test('ein Klick auf die Blase wirft den Spieler nicht aus der Ansicht', () => {
  // ui_input.js schaltet bei Klicks ausserhalb der Ansicht auf die Karte
  // zurueck. Ohne Ausnahme beendet jeder Klick auf "WEITER" das Inventar,
  // das man gerade ansieht.
  const quelle = read('src/ui', 'ui_input.js');
  assert.match(quelle, /closest\('#[^']*#tutorial-feld/,
    'Die Ausnahme fuer das Tutorial fehlt im Klick-Verteiler');
});

test('das Tutorial startet nach der Permadeath-Warnung, nicht auf einer Uhr', () => {
  // leaveDialog() ist der Moment, in dem der Spieler zum ersten Mal wirklich
  // vor der Karte steht. Ein Timer waere geraten - der Spieler liest die
  // Warnung vielleicht laenger.
  const overlays = read('src/ui', 'ui_render_overlays.js');
  const stelle = overlays.indexOf('leaveDialog: function');
  const rumpf = overlays.slice(stelle, stelle + 1600);
  assert.match(rumpf, /tutorialNachWarnung/, 'leaveDialog() gibt das Tutorial nicht frei');
  // Und der Haken existiert wirklich.
  const tut = read('src/ui', 'ui_tutorial.js');
  assert.match(tut, /UI\.tutorialNachWarnung\s*=\s*function/);
  // Ein fertiges Tutorial kommt nicht wieder.
  const {w} = mitTutorial();
  w.eval("Game.state.tutorial = 'fertig';");
  assert.equal(w.eval('UI.tutorialNachWarnung()'), false);
});

test('das Modul ist im Buendel registriert', () => {
  const entries = read('entries.mjs');
  assert.match(entries, /src\/ui\/ui_tutorial\.js/, 'ui_tutorial.js fehlt in entries.mjs');
  const entry = read('entry.js');
  assert.match(entry, /ui_tutorial\.js/, 'ui_tutorial.js fehlt in entry.js');
  // Der Menuepunkt zum Nachholen.
  const html = read('shell', 'index.html');
  assert.match(html, /id="btn-tutorial-start"/, 'Der Menuepunkt TUTORIAL fehlt');
});
