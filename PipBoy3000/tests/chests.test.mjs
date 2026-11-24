// Befund B2 aus docs/BALANCE_BEFUNDE.md: Truhen riefen `startMinigame('bomb')`,
// das Spiel kennt nur `defusal`. `startMinigame` brach bei unbekanntem
// Schlüssel still ab — kein Rückruf, keine Meldung, und `state.inDialog` blieb
// auf `true`. Danach reagierte keine Truhe im Spiel mehr auf einen Klick.
//
// Dieser Test fährt den echten Weg: Truhe anklicken, Minispiel zu Ende
// spielen, Ergebnis prüfen.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadBundle} from './helpers/load-bundle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const warte = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Truhentyp und der Würfelwert, der ihn auslöst (game_map.js).
//   Terminal: Wurf < 0,25 und Dungeon-Ebene >= 2
//   Bombe:    Wurf >= 0,70
//   Dietrich: dazwischen
const TYPEN = {
  terminal: {wurf: 0.10, dungeonLevel: 2},
  bombe: {wurf: 0.80, dungeonLevel: 1},
  dietrich: {wurf: 0.50, dungeonLevel: 1}
};

function truhenSetup({typ = 'bombe'} = {}) {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const {Game, UI, MiniGames} = window;

  const state = {
    currentMap: [['X']],
    inventory: [], caps: 0, equip: {}, perks: {}, special: {}, playerName: 'Test',
    lvl: 5, saveSlot: 0, maxHp: 100, hp: 100, maxSlots: 50, rads: 0, xp: 0,
    quests: [], activeQuests: [], completedQuests: [], knownRecipes: [],
    explored: {}, discoveredPOIs: {}, sector: {x: 0, y: 0},
    stats: {STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5},
    tutorialSeen: {}, tutorialsSeen: {defusal: true, lockpicking: true, hacking: true},
    dungeonLevel: TYPEN[typ].dungeonLevel, inDialog: false
  };
  window.Game.state = state;
  Game.saveGame = () => {};
  UI.log = () => {};
  UI.stopMinigame = () => {};
  UI.showInfoDialog = () => {};
  // Ohne Canvas im Test darf das Neuzeichnen nicht werfen.
  Game.renderStaticMap = () => {};
  Game.draw = () => {};

  return {window, Game, UI, MiniGames, state, wurf: TYPEN[typ].wurf, typ};
}

// isBomb würfelt interactWithChest selbst (30 %). Der Würfel wird gepinnt,
// damit der Test beide Zweige gezielt fahren kann.
function klickTruhe(setup) {
  const {window, Game} = setup;
  const original = window.Math.random;
  window.Math.random = () => setup.wurf;
  try {
    Game.interactWithChest(0, 0);
  } finally {
    window.Math.random = original;
  }
}

test('startMinigame meldet einen unbekannten Schlüssel', () => {
  const {window, UI} = truhenSetup({typ: 'dietrich'});
  assert.equal(UI.hasMinigame('defusal'), true, 'defusal muss bekannt sein');
  assert.equal(UI.hasMinigame('bomb'), false, 'bomb gibt es nicht');

  const warnungen = [];
  const original = window.console.warn;
  window.console.warn = (text) => warnungen.push(text);
  const ergebnis = UI.startMinigame('bomb');
  window.console.warn = original;

  assert.equal(ergebnis, false, 'unbekannter Schlüssel muss false liefern');
  assert.ok(warnungen.some(w => /bomb/.test(w)), 'keine Warnung bei unbekanntem Schlüssel');
});

test('jede Truhe startet ein Minispiel, das es gibt', () => {
  for (const typ of Object.keys(TYPEN)) {
    const setup = truhenSetup({typ});
    let gestartet = null;
    const original = setup.UI.startMinigame;
    setup.UI.startMinigame = (name) => { gestartet = name; };

    klickTruhe(setup);
    setup.UI.startMinigame = original;

    assert.ok(gestartet, `kein Minispiel gestartet (Truhentyp: ${typ})`);
    assert.equal(setup.UI.hasMinigame(gestartet), true,
      `Truhe startet "${gestartet}", das es nicht gibt (Truhentyp: ${typ})`);
  }
});

test('jeder Truhentyp führt zu seinem eigenen Minispiel', () => {
  const erwartet = {terminal: 'hacking', bombe: 'defusal', dietrich: 'lockpicking'};
  for (const [typ, minigame] of Object.entries(erwartet)) {
    const setup = truhenSetup({typ});
    let gestartet = null;
    setup.UI.startMinigame = (name) => { gestartet = name; };
    klickTruhe(setup);
    assert.equal(gestartet, minigame, `Truhentyp ${typ} startet ${gestartet}`);
  }
});

test('eine Bomben-Truhe bekommt Rückrufe für Erfolg und Fehlschlag', async () => {
  const setup = truhenSetup({typ: 'bombe'});
  let uebergeben = null;
  const original = setup.MiniGames.defusal.init;
  setup.MiniGames.defusal.init = function (...args) {
    uebergeben = args.filter(a => typeof a === 'function').length;
  };

  klickTruhe(setup);
  await warte(120); // startMinigame startet erst nach der Tutorial-Prüfung
  setup.MiniGames.defusal.init = original;

  assert.equal(uebergeben, 2,
    'defusal bekommt nicht beide Rückrufe — die Truhe erfährt das Ergebnis nie');
});

test('ein Erfolg öffnet die Truhe und gibt die Beute aus', async () => {
  const setup = truhenSetup({typ: 'bombe'});
  const {MiniGames, state} = setup;

  klickTruhe(setup);
  await warte(120); // startMinigame wartet 50 ms auf die Tutorial-Prüfung

  assert.equal(MiniGames.active, 'defusal', 'Minispiel läuft nicht');

  // Drei Runden treffen: Cursor in die Zone setzen.
  const d = MiniGames.defusal;
  for (let i = 0; i < 3; i++) {
    d.isRunning = true;
    d.cursor = 50;
    d.zoneStart = 40;
    d.zoneWidth = 20;
    d.cutWire();
  }

  await warte(1700); // end() ruft den Rückruf nach 1500 ms

  assert.equal(state.inDialog, false, 'inDialog bleibt hängen — keine Truhe reagiert mehr');
  assert.equal(state.currentMap[0][0], '.', 'Truhe ist nicht verschwunden');
  assert.ok(state.caps > 0 || state.inventory.length > 0, 'keine Beute vergeben');
});

test('ein Fehlschlag räumt inDialog ebenfalls ab', async () => {
  const setup = truhenSetup({typ: 'bombe'});
  const {MiniGames, state} = setup;

  klickTruhe(setup);
  await warte(120);

  const d = MiniGames.defusal;
  d.isRunning = true;
  d.cursor = 0;
  d.zoneStart = 90; // daneben
  d.zoneWidth = 5;
  d.cutWire();

  await warte(1700);

  assert.equal(state.inDialog, false, 'inDialog bleibt nach Fehlschlag hängen');
  assert.equal(state.currentMap[0][0], '.', 'zerstörte Truhe bleibt auf der Karte');
});

test('nach einer Truhe lässt sich die nächste öffnen', async () => {
  // Der eigentliche Schaden von B2: ein hängendes inDialog sperrt alle
  // weiteren Truhen im gesamten Spielstand.
  const setup = truhenSetup({typ: 'bombe'});
  const {Game, MiniGames, state} = setup;
  state.currentMap = [['X', 'X']];

  klickTruhe(setup);
  await warte(120);
  MiniGames.defusal.end(false);
  await warte(1700);

  assert.equal(state.inDialog, false);

  let zweiteGestartet = false;
  const originalStart = setup.UI.startMinigame;
  setup.UI.startMinigame = (typ) => { zweiteGestartet = true; };
  Game.interactWithChest(1, 0);
  setup.UI.startMinigame = originalStart;

  assert.ok(zweiteGestartet, 'die zweite Truhe reagiert nicht mehr — inDialog war gesperrt');
});
