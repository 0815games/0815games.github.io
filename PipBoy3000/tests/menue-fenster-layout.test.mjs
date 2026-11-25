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
      {name: 'NAVIGATION', btn: 'btn-navigation', fensterId: 'nav-eingabe'},
      {name: 'VAULT LEGENDS', btn: 'btn-highscores-game', fensterId: 'ui-dialog-overlay'},
      {name: 'HANDBUCH', btn: 'btn-manual-game', fensterId: 'manual-overlay'},
      {name: 'PATCH-NOTIZEN', btn: 'btn-patch-notes', fensterId: 'patch-notes-overlay'},
      {name: 'BUG MELDEN', btn: 'btn-bug-report', fensterId: 'bug-report-overlay'},
      {name: 'SIGNALE (? USER)', btn: 'val-players', fensterId: 'player-list-overlay'}
    ];

    for (const {name, btn, fensterId} of unterfenster) {
      window.UI.toggleMenu();
      assert.equal(istSichtbar(window, nav), true, `${name}: Menue ging nicht auf`);

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

    // 3. TUTORIAL schliesst ebenfalls das Burger-Menue und laesst kein
    //    offenes Unterfenster darunter stehen.
    window.UI.toggleMenu();
    document.getElementById('btn-tutorial-start').click();
    await pause(40);
    assert.equal(istSichtbar(window, nav), false, 'TUTORIAL: Burger-Menue blieb offen');
    for (const {fensterId} of unterfenster) {
      const f = document.getElementById(fensterId);
      assert.equal(istSichtbar(window, f), false, `TUTORIAL: #${fensterId} blieb darunter offen`);
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
