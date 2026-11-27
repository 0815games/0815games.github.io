// Layout- und Fensterpruefung fuer das Burger-Menue.
//
// Anlass: Mehrere Fenster aus dem Burger-Menue lagen entweder vollflaechig
// ueber dem oberen Header (Handbuch, Vault Legends, Bug-Melden), hatten gar
// keine CSS-Positionierung und schoben als statische Flex-Kinder den gesamten
// Spielschirm nach unten (Patch-Notizen, Navigation, Signale), oder liessen
// das Burger-Menue mit z-index 999999 offen ueber dem geoeffneten Fenster
// stehen. Keiner der bisherigen Tests lud das echte Stylesheet samt index.html
// und klickte jeden Menuepunkt durch.
//
// Grundregel:
//   Im laufenden Spiel (#game-screen sichtbar) oeffnet sich JEDES Fenster aus
//   dem Burger-Menue innerhalb von #main-content - also exakt unterhalb von
//   #game-header (TP, KK, MUN, Burger-Knopf bleiben frei). Auf dem Login-
//   Schirm (ohne Header) haengen Anleitung und Patch-Notizen in #pipboy-case.

import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync, existsSync} from 'node:fs';
import {join, dirname, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM, VirtualConsole} from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml'
};

let server;
let baseUrl;

before(async () => {
  server = createServer((req, res) => {
    const clean = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '');
    const file = join(ROOT, rel);
    if (!existsSync(file)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, {'Content-Type': MIME[extname(file)] || 'application/octet-stream'});
    res.end(readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
});

async function starteEchteOberflaeche({imSpiel = true} = {}) {
  // index.html laedt style.css per document.write; damit jsdom sowohl app.css
  // als auch style.css vollstaendig fuer getComputedStyle berechnet, binden
  // wir die gebauten Stylesheets direkt in eine Kopie des ausgelieferten HTML ein.
  let html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const appCss = readFileSync(join(ROOT, 'app.css'), 'utf8');
  const styleCss = readFileSync(join(ROOT, 'style.css'), 'utf8');
  // Die zeitgesteuerte Boot-Animation brauchen wir im Layout-Test nicht; sonst
  // feuert ihr setTimeout nach dom.window.close().
  html = html.replace('runBootSequence(null);', '');
  html = html.replace('</head>', `<style>${appCss}\n${styleCss}</style></head>`);

  const dom = new JSDOM(html, {
    url: `${baseUrl}/index.html`,
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      w.fetch = (u, opts) => fetch(new URL(String(u), `${baseUrl}/`), opts);
      w.HTMLCanvasElement.prototype.getContext = function () {
        return {
          scale() {}, clearRect() {}, fillRect() {}, beginPath() {}, arc() {},
          fill() {}, stroke() {}, save() {}, restore() {}, translate() {},
          rotate() {}, drawImage() {}, fillText() {}, strokeText() {},
          measureText() { return {width: 10}; },
          createLinearGradient() { return {addColorStop() {}}; },
          createRadialGradient() { return {addColorStop() {}}; },
          setTransform() {}, moveTo() {}, lineTo() {}, closePath() {},
          rect() {}, roundRect() {}, clip() {}
        };
      };
    }
  });

  const {window} = dom;
  const {document} = window;

  // Warten bis app.js geladen und UI.init() durchgelaufen ist.
  const frist = Date.now() + 8000;
  while (Date.now() < frist) {
    if (window.UI && window.UI.els && window.Game && typeof window.UI.showPatchNotes === 'function') break;
    await new Promise(r => setTimeout(r, 40));
  }
  assert.ok(window.UI && window.UI.els, 'UI wurde nicht initialisiert');

  // Netzwerk fuer Highscores stummlegen, damit Vault Legends deterministisch rendert.
  window.Network = Object.assign(window.Network || {}, {
    getHighscores: async () => [
      {name: 'VaultDweller', lvl: 12, kills: 40, xp: 1500, status: 'alive'},
      {name: 'Ghost', lvl: 5, kills: 8, xp: 300, status: 'dead'}
    ],
    sendBugReport: async () => true,
    otherPlayers: {},
    myDisplayName: 'SPIELER'
  });

  if (imSpiel) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('login-screen').classList.add('hidden');
    const gs = document.getElementById('game-screen');
    gs.classList.remove('hidden', 'opacity-0');
    gs.style.display = 'flex';

    window.Game.state = {
      view: 'map',
      inDialog: false,
      tutorial: 'fertig',
      player: {x: 25, y: 25},
      sector: {x: 4, y: 4},
      inventory: [{id: 'stimpack', count: 2}],
      hp: 85, maxHp: 100, lvl: 3, xp: 40, caps: 120, ammo: 15, kills: 4, rads: 0,
      stats: {STR: 5, PER: 5, END: 5, CHA: 5, INT: 5, AGI: 5, LCK: 5},
      equip: {weapon: null, body: null, head: null, torso: null, legs: null},
      explored: {'4,4': true},
      currentMap: Array.from({length: 50}, () => Array(50).fill('.')),
      activeQuests: [], completedQuests: [], perks: {}, knownRecipes: []
    };
    await window.UI.switchView('map');
  }

  const schliesse = async () => {
    if (window.UI && window.UI.updateUI && typeof window.UI.updateUI.stop === 'function') {
      window.UI.updateUI.stop();
    }
    if (window.UI && typeof window.UI.stoppeAfkSchutz === 'function') {
      window.UI.stoppeAfkSchutz();
    }
    await new Promise(r => setTimeout(r, 30));
    dom.window.close();
  };

  return {dom, window, document, schliesse};
}

function istSichtbar(window, el) {
  if (!el || el.hidden) return false;
  if (el.classList.contains('hidden')) return false;
  const cs = window.getComputedStyle(el);
  return cs.display !== 'none' && cs.visibility !== 'hidden';
}

test('Aufbau: #game-header steht ueber #main-content, #main-nav haengt direkt unter dem Header', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  try {
    const gameScreen = document.getElementById('game-screen');
    const header = document.getElementById('game-header');
    const mainContent = document.getElementById('main-content');
    const nav = document.getElementById('main-nav');

    assert.ok(header, '#game-header fehlt');
    assert.ok(mainContent, '#main-content fehlt');
    assert.equal(header.parentElement, gameScreen, '#game-header muss direkt in #game-screen liegen');
    assert.equal(mainContent.parentElement, gameScreen, '#main-content muss direkt in #game-screen liegen');

    // Reihenfolge im Flex-Spaltenlayout: erst Header (mit TP), darunter #main-content.
    const kinder = [...gameScreen.children];
    assert.ok(kinder.indexOf(header) < kinder.indexOf(mainContent),
      '#game-header muss vor #main-content stehen');
    assert.ok(header.querySelector('#val-hp'), 'TP-Anzeige liegt nicht im Header');

    // Burger-Menue liegt in #main-content bei top: 0 und ragt mit max-height: 100% nie heraus.
    assert.equal(nav.parentElement, mainContent,
      '#main-nav muss in #main-content liegen, damit es exakt an der Unterkante des Headers beginnt');
    const navStyle = window.getComputedStyle(nav);
    assert.equal(navStyle.position, 'absolute');
    assert.equal(navStyle.top, '0px');
    assert.equal(navStyle.maxHeight, '100%');
  } finally {
    await schliesse();
  }
});

test('jedes Burger-Menue-Fenster oeffnet unter dem Header in #main-content und schliesst das Menue', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  try {
    const mainContent = document.getElementById('main-content');
    const header = document.getElementById('game-header');
    const nav = document.getElementById('main-nav');
    const pause = ms => new Promise(r => setTimeout(r, ms));

    // 1. Alle fuenf Ansichts-Punkte (laden in #view-container innerhalb #main-content)
    const ansichten = [
      {btn: 'btn-inv', view: 'inventory'},
      {btn: 'btn-char', view: 'char'},
      {btn: 'btn-map', view: 'worldmap'},
      {btn: 'btn-quests', view: 'quests'},
      {btn: 'btn-wiki', view: 'wiki'}
    ];
    for (const {btn, view} of ansichten) {
      window.UI.toggleMenu();
      assert.equal(istSichtbar(window, nav), true, `${btn}: Menue liess sich nicht oeffnen`);
      document.getElementById(btn).click();
      await pause(80);

      assert.equal(istSichtbar(window, nav), false, `${btn}: Burger-Menue blieb nach Klick offen`);
      assert.equal(window.Game.state.view, view, `${btn}: falsche Ansicht geladen`);
      const vc = document.getElementById('view-container');
      assert.ok(mainContent.contains(vc), `${btn}: #view-container liegt nicht in #main-content`);
      assert.ok(!vc.contains(header), `${btn}: Header darf nicht in der Ansicht liegen`);
      assert.equal(istSichtbar(window, header), true, `${btn}: Header mit TP nicht mehr sichtbar`);
    }

    await window.UI.switchView('map');

    // 2. Alle Unterfenster-Overlays aus dem Burger-Menue
    const unterfenster = [
      {name: 'VAULT LEGENDS', btn: 'btn-highscores-game', fensterId: 'ui-dialog-overlay'},
      {name: 'PATCH-NOTIZEN', btn: 'btn-patch-notes', fensterId: 'patch-notes-overlay'},
      {name: 'BUG MELDEN', btn: 'btn-bug-report', fensterId: 'bug-report-overlay'},
      {name: 'SIGNALE (? USER)', btn: 'val-players', fensterId: 'player-list-overlay'}
    ];

    for (const {name, btn, fensterId} of unterfenster) {
      window.UI.toggleMenu();
      assert.equal(istSichtbar(window, nav), true, `${name}: Menue ging nicht auf`);
      if (btn !== 'val-players') document.getElementById('btn-menu-system').click();

      document.getElementById(btn).click();
      await pause(120);

      // Burger-Menue MUSS geschlossen sein (sonst liegt z-index 999999 ueber dem Fenster!)
      assert.equal(istSichtbar(window, nav), false,
        `${name}: Burger-Menue blieb ueber dem geoeffneten Fenster stehen`);

      const fenster = document.getElementById(fensterId);
      assert.ok(fenster, `${name}: #${fensterId} existiert nicht`);
      assert.equal(istSichtbar(window, fenster), true, `${name}: #${fensterId} wurde nicht sichtbar`);

      // Entscheidend: das Fenster MUSS in #main-content haengen (unterhalb #game-header),
      // NICHT am body oder #pipboy-case, und MUSS position: absolute (nicht static/fixed!) haben!
      assert.ok(mainContent.contains(fenster),
        `${name}: #${fensterId} liegt ausserhalb von #main-content (ueberdeckt den Header!)`);
      assert.ok(!header.contains(fenster), `${name}: #${fensterId} liegt im Header`);

      const cs = window.getComputedStyle(fenster);
      assert.equal(cs.position, 'absolute',
        `${name}: #${fensterId} hat position=${cs.position} statt 'absolute' (static schiebt Layout weg, fixed ueberdeckt Header)`);
      assert.equal(cs.top, '0px', `${name}: #${fensterId} beginnt nicht an der Oberkante von #main-content`);
      assert.equal(cs.bottom, '0px', `${name}: #${fensterId} fuellt #main-content nach unten nicht aus`);
      assert.equal(istSichtbar(window, header), true, `${name}: Header ist nicht sichtbar`);
    }

    assert.equal(document.getElementById('btn-navigation'), null, 'Navigation ist kein separater Burger-Menuepunkt mehr');

    // 3. Tutorial liegt im Wiki-Handbuch und kehrt vor dem Start zur Karte zurück.
    await window.UI.switchView('wiki');
    document.getElementById('wiki-btn-manual').click();
    document.getElementById('wiki-tutorial-start').click();
    await pause(80);
    assert.equal(window.Game.state.view, 'map');
    assert.equal(window.Tutorial.offen, true);
    for (const {fensterId} of unterfenster) {
      assert.equal(istSichtbar(window, document.getElementById(fensterId)), false, `TUTORIAL: #${fensterId} blieb darunter offen`);
    }
    window.Tutorial.beenden();

    // Der Menuepunkt "NACH UPDATE SUCHEN" ist entfernt (v14.0.24): die
    // Versionspruefung laeuft automatisch (Start, 60-s-Intervall,
    // visibilitychange/pageshow in ui_update.js) und zeigt das
    // #update-banner-Popup von selbst.
    assert.equal(document.getElementById('btn-update-check'), null,
      '#btn-update-check muss entfernt sein - die Update-Pruefung laeuft automatisch');
    assert.ok(document.getElementById('update-banner'),
      '#update-banner (Auto-Update-Popup) fehlt im HTML');
    assert.equal(typeof window.UI.starteUpdatePruefung, 'function',
      'UI.starteUpdatePruefung (Auto-Pruefung) fehlt');
    assert.ok(window.UI.updateUI, 'Die Auto-Update-Pruefung wurde nicht gestartet');
  } finally {
    await schliesse();
  }
});

test('Wechsel zwischen Fenstern stapelt nichts, ESC schliesst, und Klick im Unterfenster wirft nicht aus dem Inventar', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));

    // Im Inventar stehen und ueber das Burger-Menue Patch-Notizen oeffnen:
    await window.UI.switchView('inventory');
    assert.equal(window.Game.state.view, 'inventory');

    window.UI.showPatchNotes();
    await pause(40);
    const patch = document.getElementById('patch-notes-overlay');
    assert.equal(istSichtbar(window, patch), true);

    // Klick auf den Reiter "NOCH OFFEN" in den Patch-Notizen darf NICHT auf 'map' zurueckwerfen!
    const reiterBtn = [...patch.querySelectorAll('button')].find(b => /NOCH OFFEN/.test(b.textContent));
    assert.ok(reiterBtn, 'Reiter NOCH OFFEN fehlt');
    reiterBtn.click();
    await pause(40);
    assert.equal(window.Game.state.view, 'inventory',
      'Klick im Unterfenster hat die darunterliegende Ansicht ungewollt auf map zurueckgesetzt');

    // Direkt weiter ins Handbuch wechseln -> Patch-Notizen muessen sich schliessen (kein Stapel!)
    await window.UI.showManualOverlay();
    await pause(60);
    assert.equal(istSichtbar(window, patch), false, 'Patch-Notizen blieben unter dem Handbuch offen');
    assert.equal(istSichtbar(window, document.getElementById('manual-overlay')), true);

    // ESC schliesst das Handbuch (und ebenso Patch-Notizen / Navigation / Bug-Melden)
    document.dispatchEvent(new window.KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    assert.equal(istSichtbar(window, document.getElementById('manual-overlay')), false,
      'ESC hat das Handbuch nicht geschlossen');

    window.UI.showPatchNotes();
    document.dispatchEvent(new window.KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    assert.equal(istSichtbar(window, patch), false,
      'ESC hat die Patch-Notizen trotz Beschriftung SCHLIESSEN (ESC) nicht geschlossen');

    // Direkt aus einem offenen Unterfenster per Burger-Menue in eine Ansicht wechseln -> Unterfenster schliesst!
    window.UI.oeffneNavigation();
    assert.equal(istSichtbar(window, document.getElementById('nav-eingabe')), true);
    await window.UI.switchView('quests');
    assert.equal(istSichtbar(window, document.getElementById('nav-eingabe')), false,
      'switchView liess ein offenes Unterfenster ueber der neuen Ansicht stehen');
  } finally {
    await schliesse();
  }
});

test('auf dem Login-Schirm funktionieren Anleitung und Patch-Notizen weiterhin sichtbar in #pipboy-case', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: false});
  try {
    const pipboyCase = document.getElementById('pipboy-case');
    const gameScreen = document.getElementById('game-screen');
    assert.equal(istSichtbar(window, gameScreen), false, '#game-screen muss vor Login versteckt sein');

    await window.UI.showManualOverlay();
    const manual = document.getElementById('manual-overlay');
    assert.equal(manual.parentElement, pipboyCase,
      'Auf dem Login-Schirm darf #manual-overlay nicht im versteckten #game-screen haengen');
    assert.equal(istSichtbar(window, manual), true);

    window.UI.showPatchNotes();
    const patch = document.getElementById('patch-notes-overlay');
    assert.equal(patch.parentElement, pipboyCase,
      'Auf dem Login-Schirm darf #patch-notes-overlay nicht im versteckten #game-screen haengen');
    assert.equal(istSichtbar(window, patch), true);
    assert.equal(istSichtbar(window, manual), false, 'Handbuch schloss sich beim Wechsel nicht');
  } finally {
    await schliesse();
  }
});

test('ungebundener Aufruf von showPatchNotes/showManualOverlay haengt das Fenster unter den Header', async () => {
  // Regression: showPatchNotes nutzte this.haengeFensterEin. Als
  // ungebundene Callback-Referenz (z. B. onClick: UI.showPatchNotes) ist
  // `this` undefined/window - das Fenster bliebe dann in #pipboy-case
  // haengen und deckte mit z-index 1000 den Header zu.
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  try {
    const mainContent = document.getElementById('main-content');
    const header = document.getElementById('game-header');
    const pause = ms => new Promise(r => setTimeout(r, ms));

    const patchFn = window.UI.showPatchNotes;
    patchFn(); // absichtlich ungebunden
    await pause(40);
    const patch = document.getElementById('patch-notes-overlay');
    assert.equal(istSichtbar(window, patch), true, 'Patch-Notizen wurden nicht sichtbar');
    assert.equal(patch.parentElement, mainContent,
      'Ungebundener Aufruf: #patch-notes-overlay liegt nicht in #main-content (ueberdeckt den Header!)');
    assert.equal(window.getComputedStyle(patch).zIndex, '80',
      'Ungebundener Aufruf: #patch-notes-overlay hat z-index 1000 statt 80 - es deckt den Header zu');
    assert.equal(istSichtbar(window, header), true, 'Header ist nicht sichtbar');

    const manualFn = window.UI.showManualOverlay;
    await manualFn(); // absichtlich ungebunden
    await pause(60);
    const manual = document.getElementById('manual-overlay');
    assert.equal(istSichtbar(window, manual), true, 'Handbuch wurde nicht sichtbar');
    assert.equal(manual.parentElement, mainContent,
      'Ungebundener Aufruf: #manual-overlay liegt nicht in #main-content (ueberdeckt den Header!)');
    assert.equal(window.getComputedStyle(manual).zIndex, '80',
      'Ungebundener Aufruf: #manual-overlay hat z-index 1000 statt 80 - es deckt den Header zu');
  } finally {
    await schliesse();
  }
});

test('Login -> Spiel: beim Spielstart wandern offene Fenster aus #pipboy-case zurueck unter den Header', async () => {
  // Regression: Wer die Patch-Notizen auf dem Login-Schirm oeffnet (dort
  // haengen sie in #pipboy-case) und dann einsteigt, sah sie nach dem
  // Start weiter UEBER dem Header. startGame() muss sie nach #main-content
  // zurueckholen.
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: false});
  try {
    const pipboyCase = document.getElementById('pipboy-case');
    const mainContent = document.getElementById('main-content');
    const header = document.getElementById('game-header');
    const pause = ms => new Promise(r => setTimeout(r, ms));

    // Auf dem Login-Schirm Patch-Notizen oeffnen -> #pipboy-case.
    window.UI.showPatchNotes();
    await pause(40);
    const patch = document.getElementById('patch-notes-overlay');
    assert.equal(patch.parentElement, pipboyCase,
      'Vor Login muss #patch-notes-overlay in #pipboy-case haengen');
    assert.equal(istSichtbar(window, patch), true);

    // Spielstart nachstellen (schwere Teile stubben, nur die Fenster-Logik
    // von startGame soll laufen).
    window.UI.showLoadingSequence = async () => {};
    window.Game.init = () => {};
    if (window.Network) window.Network.startPresence = () => {};
    await window.UI.startGame(null, 0, 'TESTSPIELER');
    await pause(40);

    const gs = document.getElementById('game-screen');
    assert.equal(gs.classList.contains('hidden'), false, '#game-screen ist nach startGame nicht sichtbar');
    assert.equal(patch.parentElement, mainContent,
      'Nach startGame liegt #patch-notes-overlay nicht in #main-content - es deckt den Header zu');
    assert.equal(window.getComputedStyle(patch).zIndex, '80',
      'Nach startGame hat #patch-notes-overlay z-index 1000 statt 80');
    assert.equal(istSichtbar(window, header), true, 'Header ist nach startGame nicht sichtbar');
    assert.equal(istSichtbar(window, patch), true, 'Patch-Notizen sind nach startGame nicht mehr sichtbar');
  } finally {
    await schliesse();
  }
});

test('Tutorial: ein Klick je Aktion oeffnet Menue, Inventar und Aufgaben und ESC kehrt zur Karte zurueck', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  const wartenAuf = async (bedingung) => {
    const ende = Date.now() + 4000;
    while (!bedingung() && Date.now() < ende) await new Promise(r => setTimeout(r, 20));
    assert.ok(bedingung(), 'Tutorial-Schritt oder Ansicht nicht erreicht');
  };
  try {
    window.Game.saveGame = () => {};
    window.Game.state.tutorial = undefined;
    window.Tutorial.start();
    window.Tutorial.zeigen(2);
    const knopf = () => document.querySelector('[data-tut-weiter]');
    const schritt = () => document.querySelector('[data-tut-schritt]').textContent;
    knopf().click();
    await wartenAuf(() => schritt() === '4/7');
    assert.equal(document.getElementById('main-nav').classList.contains('hidden'), false);
    knopf().click();
    await wartenAuf(() => schritt() === '5/7');
    assert.equal(window.Game.state.view, 'inventory');
    assert.match(document.querySelector('[data-tut-text]').textContent, /ESC/);
    knopf().click();
    await wartenAuf(() => schritt() === '6/7');
    assert.equal(window.Game.state.view, 'quests');
    window.dispatchEvent(new window.KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
    await wartenAuf(() => window.Game.state.view === 'map');
    window.Tutorial.ausblenden();
  } finally { await schliesse(); }
});

test('Vault-Einzug kann uebersprungen werden; Ausruhen und Verlassen bleiben unveraendert', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  try {
    const state = window.Game.state;
    state.hp = 13; state.maxHp = 85; state.rads = 26; state.rad = 9;
    let gespeichert = 0;
    window.Game.saveGame = () => gespeichert++;
    window.UI.enterVault();
    assert.equal(state.inDialog, true);
    assert.ok(document.querySelector('.vault-cinematic-door'));
    assert.ok(document.querySelector('.vault-cinematic-corridor'));
    assert.equal(window.UI.enterVault(), false, 'kein zweiter Einzug');
    const skip = document.querySelector('.vault-cinematic-skip');
    assert.equal(document.activeElement, skip);
    skip.click();
    assert.equal(document.getElementById('vault-anim-layer'), null);
    const overlay = document.getElementById('ui-dialog-overlay');
    const panel = overlay.querySelector('.vault-menu-panel');
    assert.ok(panel);
    assert.equal(panel.closest('#main-content').id, 'main-content');
    assert.match(panel.textContent, /VAULT\s*101/);
    assert.match(panel.textContent, /AUSRUHEN \(GRATIS\)/);
    assert.match(panel.textContent, /ZURÜCK INS ÖDLAND/);
    panel.querySelector('.vault-menu-rest').click();
    assert.equal(state.hp, 85);
    assert.equal(state.rads, 0);
    assert.equal(state.rad, 0);
    assert.equal(gespeichert, 1);
    assert.match(document.getElementById('main-content').textContent, /DEKONTAMINIERT & AUSGERUHT/);
    const bestaetigen = [...document.querySelectorAll('button')].find(b => b.textContent === 'VERSTANDEN');
    assert.ok(bestaetigen);
    bestaetigen.click();
    assert.equal(state.inDialog, true, 'Basismenue bleibt nach Info offen');
    panel.querySelector('.vault-menu-leave').click();
    assert.equal(state.inDialog, false);
    assert.equal(overlay.style.display, 'none');
  } finally { window.UI._cancelVaultCinematic(); await schliesse(); }
});

test('Vault-Einzug oeffnet nach Ablauf einmal das Menue; alte Spielstaende werden nicht wieder geoeffnet', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  const orig = window.setTimeout;
  try {
    window.UI.log = () => {};
    let ablauf;
    window.setTimeout = (fn, ms, ...args) => ms === 5000 ? (ablauf = fn, 4242) : orig(fn, ms, ...args);
    window.UI.enterVault();
    window.setTimeout = orig;
    assert.equal(typeof ablauf, 'function');
    ablauf();
    assert.equal(document.getElementById('vault-anim-layer'), null);
    assert.ok(document.querySelector('.vault-menu-panel'));
    ablauf();
    assert.equal(document.querySelectorAll('.vault-menu-panel').length, 1);
    window.UI.leaveDialog();
    window.setTimeout = (fn, ms, ...args) => ms === 5000 ? (ablauf = fn, 4242) : orig(fn, ms, ...args);
    window.UI.enterVault();
    window.setTimeout = orig;
    window.Game.state = null;
    ablauf();
    assert.equal(document.getElementById('vault-anim-layer'), null);
    assert.equal(document.querySelector('.vault-menu-panel'), null);
  } finally { window.setTimeout = orig; window.UI._cancelVaultCinematic(); await schliesse(); }
});

test('reduzierte Bewegung ueberspringt die Szene ohne das Vault-Menue zu verlieren', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  try {
    window.matchMedia = () => ({matches: true});
    window.UI.enterVault();
    assert.equal(document.getElementById('vault-anim-layer'), null);
    assert.ok(document.querySelector('.vault-menu-panel'));
    assert.equal(window.Game.state.inDialog, true);
    window.UI.leaveDialog();
    assert.equal(window.Game.state.inDialog, false);
  } finally { window.UI._cancelVaultCinematic(); await schliesse(); }
});

test('Statusleiste zeigt Spielwerte, behaelt Char- und Menue-Aktionen und ein responsives Raster', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  try {
    const header = document.getElementById('game-header');
    for (const id of ['val-name', 'val-lvl', 'val-caps', 'val-ammo', 'val-hp', 'bar-hp', 'bar-rads', 'bar-exp-top', 'val-xp-txt', 'btn-menu-toggle']) {
      assert.equal(header.querySelectorAll(`#${id}`).length, 1, `${id} fehlt oder ist doppelt`);
    }
    Object.assign(window.Game.state, {playerName: 'EIN_SEHR_LANGER_SPIELERNAME', lvl: 7, caps: 12345, hp: 30, maxHp: 100, rads: 10, xp: 40});
    window.Game.state.inventory = [{id: 'ammo', count: 87}];
    window.Game.state.equip.weapon = {id: 'pipe_pistol'};
    window.UI.update();
    assert.equal(document.getElementById('val-name').textContent, 'EIN_SEHR_LANGER_SPIELERNAME');
    assert.equal(document.getElementById('val-lvl').textContent, '7');
    assert.equal(document.getElementById('val-caps').textContent, '12345');
    assert.equal(document.getElementById('val-ammo').textContent, '87');
    assert.equal(document.getElementById('val-hp').textContent, 'TP 30/90');
    assert.equal(document.getElementById('bar-hp').style.width, '30%');
    assert.equal(document.getElementById('bar-rads').style.width, '10%');
    assert.ok(document.getElementById('val-hp').classList.contains('justify-center'), 'TP-Text muss mittig bleiben');
    assert.ok(document.getElementById('bar-hp').classList.contains('bg-yellow-500'));
    assert.equal(document.getElementById('bar-hp').style.background, '');
    document.getElementById('btn-menu-toggle').click();
    assert.equal(document.getElementById('main-nav').classList.contains('hidden'), false);
    document.getElementById('btn-menu-toggle').click();
    assert.equal(document.getElementById('main-nav').classList.contains('hidden'), true);
    let ziel = null;
    window.UI.switchView = name => { ziel = name; return Promise.resolve(); };
    document.getElementById('header-char-info').click();
    assert.equal(ziel, 'char');
    const css = readFileSync(join(ROOT, 'shell/style.css'), 'utf8');
    assert.match(css, /grid-template-areas:\s*"char ressourcen leben menu"/);
    assert.match(css, /@media\s*\(max-width:\s*540px\)[\s\S]*?"char ressourcen menu"\s*"leben leben leben"/);
    assert.match(css, /#game-header #btn-menu-toggle\s*\{[^}]*min-width:\s*0/);
    assert.match(css, /#val-name\s*\{[^}]*text-overflow:\s*ellipsis/);
  } finally { await schliesse(); }
});

test('SPECIAL- und Perk-Reiter leuchten nur bei eigenen offenen Punkten und aktualisieren sich nach Vergabe', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  try {
    const state = window.Game.state;
    state.statPoints = 2; state.perkPoints = 1; state.lvl = 3;
    window.Game.saveGame = () => {};
    await window.UI.switchView('char');
    const tab = name => document.querySelector(`[data-char-tab="${name}"]`);
    const istMarkiert = name => tab(name).classList.contains('char-tab-punkte');
    assert.ok(istMarkiert('special'));
    assert.ok(istMarkiert('perks'));
    assert.equal(tab('special').querySelector('[data-punkte]').textContent, '2');
    assert.equal(tab('perks').querySelector('[data-punkte]').textContent, '1');
    assert.match(tab('special').getAttribute('aria-label'), /2 Punkte verfügbar/);
    tab('special').click();
    assert.equal(state.charTab, 'special');
    assert.ok(istMarkiert('special'), 'auch aktiver Reiter zeigt offene Punkte');
    window.Game.upgradeStat('STR');
    assert.equal(state.statPoints, 1);
    assert.equal(tab('special').querySelector('[data-punkte]').textContent, '1');
    window.Game.upgradeStat('STR');
    assert.equal(state.statPoints, 0);
    assert.equal(istMarkiert('special'), false);
    assert.equal(tab('special').querySelector('[data-punkte]').hidden, true);
    assert.equal(istMarkiert('perks'), true);
    tab('perks').click();
    assert.equal(state.charTab, 'perks');
    window.Game.choosePerk('toughness');
    assert.equal(state.perkPoints, 0);
    assert.equal(istMarkiert('perks'), false);
    assert.equal(document.getElementById('header-char-info').classList.contains('lvl-ready-glow'), false);
    // Dynamische Punkte waehrend die Ansicht offen ist.
    state.perkPoints = 3;
    window.UI.update();
    assert.equal(istMarkiert('special'), false);
    assert.equal(istMarkiert('perks'), true);
    assert.equal(tab('perks').querySelector('[data-punkte]').textContent, '3');
    state.perkPoints = 0; state.statPoints = 1;
    window.UI.update();
    assert.equal(istMarkiert('special'), true);
    assert.equal(istMarkiert('perks'), false);
  } finally { await schliesse(); }
});

test('HUD zeigt nur Munition der ausgerüsteten Waffe inklusive aller Stapel', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  try {
    const state = window.Game.state;
    state.inventory = [{id: 'ammo', count: 90}, {id: 'ammo_10mm', count: 10}, {id: 'ammo_10mm', count: 6}, {id: 'ammo_cell', count: 3}];
    state.equip.weapon = {id:'pistol_10mm'};
    window.UI.update();
    const anzeige = document.getElementById('val-ammo');
    assert.equal(anzeige.textContent, '16');
    assert.match(anzeige.getAttribute('aria-label'), /10mm/);
    state.equip.weapon = {id:'laser_pistol'};
    window.UI.update(); assert.equal(anzeige.textContent, '3');
    state.equip.weapon = {id:'shotgun'};
    window.UI.update(); assert.equal(anzeige.textContent, '0');
    state.equip.weapon = {id:'fists'};
    window.UI.update(); assert.equal(anzeige.textContent, '–');
    assert.match(anzeige.getAttribute('aria-label'), /Keine Munition/);
  } finally { await schliesse(); }
});

test('Brunnen-Dialog bestätigt Wasser und Abbrechen bleibt folgenlos', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  try {
    const game = window.Game, state = game.state;
    game.saveGame = () => {};
    state.view = 'map'; state.dungeonLevel = 0; state.inDialog = false;
    state.hp = 40; state.maxHp = 100; state.rads = 0; state.radRest = 0;
    state.player = {x: 5, y: 5};
    state.currentMap = Array.from({length: 10}, () => Array(10).fill('.'));
    state.currentMap[5][6] = 'b';
    window.UI.showWaterSource(6, 5, 'b');
    assert.match(document.getElementById('ui-dialog-overlay').textContent, /5 RAD/);
    document.querySelector('[data-cancel]').click();
    assert.equal(state.hp, 40); assert.equal(state.rads, 0);
    window.UI.showWaterSource(6, 5, 'b');
    document.querySelector('[data-drink]').click();
    assert.equal(state.hp, 60); assert.equal(state.rads, 5);
    assert.equal(state.inDialog, false);
  } finally { await schliesse(); }
});

test('Lagertruhe hat ein Bild und lagert Items per Oberfläche ein und aus', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel: true});
  try {
    const game = window.Game, state = game.state;
    game.saveGame=()=>{};
    state.camp={level:1,sector:{...state.sector},x:25,y:25,storage:[]};
    state.inventory=[{id:'stimpack',count:3}];
    await window.UI.switchView('camp');
    const truhenknopf = [...document.querySelectorAll('#camp-main-actions button')].find(b=>b.textContent.includes('TRUHE'));
    assert.ok(truhenknopf); assert.match(truhenknopf.querySelector('img').getAttribute('src'), /lagertruhe\.png/);
    truhenknopf.click();
    assert.equal(document.getElementById('camp-storage-view').classList.contains('hidden'), false);
    let buttons=[...document.querySelectorAll('#camp-storage-list button')];
    buttons.find(b=>b.textContent==='EINLAGERN').click();
    assert.equal(state.camp.storage[0].count,3);
    buttons=[...document.querySelectorAll('#camp-storage-list button')];
    buttons.find(b=>b.textContent==='ENTNEHMEN').click();
    assert.equal(state.inventory[0].count,3); assert.equal(state.camp.storage.length,0);
  } finally { await schliesse(); }
});

test('Burger-Menü zeigt Hauptseite und System-Untermenü mit Zurück und Escape', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel:true});
  try {
    const nav=document.getElementById('main-nav');
    const main=document.getElementById('menu-main');
    const system=document.getElementById('menu-system');
    const knopf=document.getElementById('btn-menu-system');
    document.getElementById('btn-menu-toggle').click();
    assert.equal(window.getComputedStyle(main).display,'flex');
    assert.equal(window.getComputedStyle(system).display,'none');
    for(const id of ['btn-inv','btn-char','btn-map','btn-quests','btn-wiki','btn-menu-save','btn-menu-system']) assert.ok(main.contains(document.getElementById(id)), id);
    assert.equal(document.getElementById('btn-manual-game'),null);
    knopf.click();
    assert.equal(window.getComputedStyle(main).display,'none');
    assert.equal(window.getComputedStyle(system).display,'flex');
    assert.equal(knopf.getAttribute('aria-expanded'),'true');
    for(const id of ['btn-highscores-game','btn-patch-notes','btn-bug-report','btn-logout']) assert.ok(system.contains(document.getElementById(id)), id);
    document.getElementById('btn-menu-back').click();
    assert.equal(system.hidden,true);
    assert.equal(knopf.getAttribute('aria-expanded'),'false');
    knopf.click();
    document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    assert.equal(system.hidden,true, 'Escape führt zur Hauptseite');
    assert.equal(istSichtbar(window,nav),true);
    knopf.click();
    document.getElementById('btn-menu-toggle').click();
    document.getElementById('btn-menu-toggle').click();
    assert.equal(system.hidden,true,'Menü startet wieder auf Hauptseite');
  } finally { await schliesse(); }
});

test('Wiki integriert das echte Handbuch und behält Bestiarium, Items, Baupläne und Orte', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel:true});
  try {
    await window.UI.switchView('wiki');
    document.getElementById('wiki-btn-manual').click();
    await new Promise(r=>setTimeout(r,100));
    const inhalt=document.getElementById('wiki-handbuch-text');
    assert.ok(inhalt);
    assert.match(inhalt.textContent,/ÖDLAND-ÜBERLEBENSHANDBUCH/);
    assert.equal(document.getElementById('wiki-btn-manual').classList.contains('bg-green-500'),true);
    assert.ok(document.getElementById('wiki-tutorial-start'));
    for(const id of ['monsters','items','crafting','locs','perks','quests']) {
      document.getElementById(`wiki-btn-${id}`).click();
      assert.equal(document.getElementById('wiki-content').dataset.wikiCategory,id);
      assert.equal(document.getElementById(`wiki-btn-${id}`).classList.contains('bg-green-500'),true);
    }
  } finally { await schliesse(); }
});

test('Späte oder gescheiterte Handbuch-Ladevorgänge überschreiben keinen anderen Wiki-Reiter', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel:true});
  try {
    await window.UI.switchView('wiki');
    let resolve;
    window.UI.ladeHandbuch=()=>new Promise(r=>{resolve=r});
    document.getElementById('wiki-btn-manual').click();
    document.getElementById('wiki-btn-monsters').click();
    const vorher=document.getElementById('wiki-content').innerHTML;
    resolve('VERSPÄTET'); await new Promise(r=>setTimeout(r,0));
    assert.equal(document.getElementById('wiki-content').innerHTML,vorher);
    window.UI.ladeHandbuch=()=>Promise.reject(new Error('offline'));
    document.getElementById('wiki-btn-manual').click();
    await new Promise(r=>setTimeout(r,0));
    assert.match(document.getElementById('wiki-handbuch-text').textContent,/nicht geladen/);
    assert.ok(document.getElementById('wiki-tutorial-start'));
  } finally { await schliesse(); }
});

test('Speichern und Logout bleiben nach der Umstrukturierung bedienbar', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel:true});
  try {
    let save=0, logout=0;
    window.UI.handleSaveClick=()=>{save++}; window.UI.logout=()=>{logout++};
    document.getElementById('btn-menu-toggle').click();
    document.getElementById('btn-menu-save').click();
    assert.equal(save,1);
    document.getElementById('btn-menu-system').click();
    document.getElementById('btn-logout').click();
    assert.equal(logout,1);
  } finally { await schliesse(); }
});

test('Tutorial aus dem Wiki setzt bestehenden Fortschritt nach Rückkehr zur Karte fort', async () => {
  const {window, document, schliesse} = await starteEchteOberflaeche({imSpiel:true});
  try {
    window.Game.saveGame=()=>{};
    window.Game.state.tutorial='pausiert';
    window.Game.state.tutorialSchritt=3;
    await window.UI.switchView('wiki');
    document.getElementById('wiki-btn-manual').click();
    document.getElementById('wiki-tutorial-start').click();
    await new Promise(r=>setTimeout(r,80));
    assert.equal(window.Game.state.view,'map');
    assert.equal(window.Game.state.tutorial,'laeuft');
    assert.equal(window.Game.state.tutorialSchritt,3);
    assert.match(document.querySelector('[data-tut-titel]').textContent,/DEIN ZEUG/);
    window.Tutorial.pausieren();
  } finally { await schliesse(); }
});

test('Handbuchtext wird als Text formatiert und kann keine HTML-Skripte einschleusen', async () => {
  const {window, schliesse} = await starteEchteOberflaeche({imSpiel:true});
  try {
    const orig=window.fetch;
    window.fetch=async()=>({ok:true,text:async()=>'## ÜBERSCHRIFT\n<img src=x onerror="evil()">'});
    const html=await window.UI.ladeHandbuch();
    window.fetch=orig;
    assert.match(html,/<h2/);
    assert.match(html,/&lt;img/);
    assert.doesNotMatch(html,/<img/);
  } finally { await schliesse(); }
});
