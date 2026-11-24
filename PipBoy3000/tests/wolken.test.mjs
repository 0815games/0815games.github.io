// Wandernde RAD-Wolken (src/game/world_air.js).
//
// RAD war bis Version 14.0.2 nur ein Getränkewert: Schlafen, gebratenes
// Fleisch, ein Minispiel. Keine Zone und kein Wetter hat gestrahlt. Die Wolke
// macht RAD zu einem Ortsphänomen - man sieht sie kommen, kann sie umgehen,
// und mit Gasmaske, Anzug oder Rad-X kostet der Weg weniger.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadBundle} from './helpers/load-bundle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function freshGame(overrides = {}) {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const {Game, UI} = window;
  window.Game.state = {
    inventory: [], caps: 100, equip: {}, perks: {}, special: {}, playerName: 'Test',
    lvl: 5, maxHp: 100, hp: 100, rads: 0, maxSlots: 50,
    stats: {STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5, CHA: 5},
    camp: null, view: 'map', zone: 'Test', sector: {x: 0, y: 0}, player: {x: 10, y: 10},
    dungeonLevel: 0, currentMap: Array(50).fill().map(() => Array(50).fill('.')),
    radClouds: [], radRest: 0,
    quests: [], activeQuests: [], completedQuests: [], knownRecipes: [],
    ...overrides
  };
  Game.saveGame = () => {};
  UI.log = () => {};
  UI.update = () => {};
  UI.showGameOver = () => {};
  return {window, Game, UI, state: window.Game.state};
}

// --------------------------------------------------------------- Verteilung

test('jedes Biom bekommt die vorgesehene Zahl Wolken', () => {
  const {Game} = freshGame();
  const erwartet = {desert: 5, swamp: 3, forest: 2, jungle: 2, wasteland: 1, mountain: 1, city: 0};
  for (const [biom, zahl] of Object.entries(erwartet)) {
    const {Game: G2} = freshGame();
    G2.baueRadWolken(biom);
    assert.equal(G2.radWolkenImSektor().length, zahl, `${biom} hat ${G2.radWolkenImSektor().length} statt ${zahl} Wolken`);
  }
  // Die Glühende See ist die Heimat der Wolken - dort müssen es die meisten sein.
  assert.equal(Game.RAD_WOLKEN_JE_BIOM.desert, Math.max(...Object.values(Game.RAD_WOLKEN_JE_BIOM)));
  assert.equal(Game.RAD_WOLKEN_JE_BIOM.city, 0, 'in der Stadt sollte es keine Wolken geben');
});

test('ein unbekanntes Biom bekommt eine Wolke statt keiner', () => {
  const {Game} = freshGame();
  Game.baueRadWolken('unbekannt');
  assert.equal(Game.radWolkenImSektor().length, 1);
});

test('keine Wolke startet direkt auf dem Spieler', () => {
  const {Game, state} = freshGame();
  // Viele Sektoren durchspielen, damit ein Ausreisser auffällt.
  for (let s = 0; s < 40; s++) {
    const {Game: G2, state: st2} = freshGame();
    st2.sector = {x: s, y: 0};
    st2.player = {x: 25, y: 25};
    G2.baueRadWolken('desert');
    for (const w of G2.radWolkenImSektor()) {
      const abstand = Math.abs(w.x - 25) + Math.abs(w.y - 25);
      assert.ok(abstand >= 8, `Wolke bei (${w.x},${w.y}) liegt zu nah am Spieler (Abstand ${abstand})`);
    }
  }
  assert.ok(state);
});

test('beim erneuten Betreten bleiben die Wolken stehen', () => {
  const {Game} = freshGame();
  Game.baueRadWolken('desert');
  const vorher = Game.radWolkenImSektor().map(w => `${w.x},${w.y}`);

  Game.baueRadWolken('desert');
  const nachher = Game.radWolkenImSektor().map(w => `${w.x},${w.y}`);

  assert.deepEqual(nachher, vorher, 'die Wolken wurden neu ausgewürfelt');
});

test('Wolken gehören zu ihrem Sektor', () => {
  const {Game, state} = freshGame();
  state.sector = {x: 0, y: 0};
  Game.baueRadWolken('desert');
  const anzahlErsterSektor = Game.radWolkenImSektor().length;

  state.sector = {x: 1, y: 0};
  assert.equal(Game.radWolkenImSektor().length, 0, 'Wolken aus Sektor 0 erscheinen in Sektor 1');

  Game.baueRadWolken('desert');
  assert.equal(Game.radWolkenImSektor().length, anzahlErsterSektor);
  assert.ok(state.radClouds.length >= anzahlErsterSektor * 2, 'Wolken des alten Sektors gingen verloren');
});

// ---------------------------------------------------------------- Bewegung

test('Wolken wandern, aber nicht bei jedem Zug', () => {
  const {Game} = freshGame();
  Game.baueRadWolken('desert');
  const w = Game.radWolkenImSektor()[0];

  w.zug = Date.now();
  const vorher = {x: w.x, y: w.y};
  Game.bewegeRadWolken();
  assert.deepEqual({x: w.x, y: w.y}, vorher, 'Wolke zog ohne Zeitverstreichen');

  w.zug = 0;
  Game.bewegeRadWolken();
  const nachher = {x: w.x, y: w.y};
  assert.ok(nachher.x !== vorher.x || nachher.y !== vorher.y, 'Wolke bewegt sich nicht');
  assert.ok(Math.abs(nachher.x - vorher.x) <= 1 && Math.abs(nachher.y - vorher.y) <= 1,
    'Wolke springt mehr als ein Feld');
});

test('Wolken wandern langsamer als der Spieler', () => {
  const {Game} = freshGame();
  // Ein Zug des Spielers ist ein Tastendruck. Die Wolke soll deutlich
  // langsamer sein, sonst kann man ihr nicht ausweichen.
  assert.ok(Game.RAD_WOLKE_ZUG_MS >= 3000,
    `Wolke zieht alle ${Game.RAD_WOLKE_ZUG_MS} ms - das ist schneller als ein Spieler`);
});

test('Wolken bleiben im Sektor', () => {
  const {Game} = freshGame();
  Game.baueRadWolken('desert');
  const w = Game.radWolkenImSektor()[0];
  w.x = 2; w.y = 2;

  for (let i = 0; i < 200; i++) {
    w.zug = 0;
    Game.bewegeRadWolken();
    assert.ok(w.x >= 2 && w.x <= Game.MAP_W - 3, `x=${w.x} liegt ausserhalb`);
    assert.ok(w.y >= 2 && w.y <= Game.MAP_H - 3, `y=${w.y} liegt ausserhalb`);
  }
});

// ---------------------------------------------------------------- Wirkung

test('in der Wolke stehend bekommt man Strahlung', () => {
  const {Game, state} = freshGame();
  Game.baueRadWolken('desert');
  const w = Game.radWolkenImSektor()[0];
  state.player = {x: w.x, y: w.y};

  Game.tickRadWolken();

  assert.ok(state.rads > 0, 'keine Strahlung in der Wolke');
  assert.equal(state.rads, Game.RAD_PRO_FELD, 'Dosis stimmt nicht');
});

test('ausserhalb der Wolke bekommt man keine Strahlung', () => {
  const {Game, state} = freshGame();
  Game.baueRadWolken('desert');
  const w = Game.radWolkenImSektor()[0];
  // weit weg von jeder Wolke
  state.player = {x: (w.x + 20) % 45 + 2, y: (w.y + 20) % 45 + 2};
  for (const andere of Game.radWolkenImSektor()) {
    assert.ok(!(andere.x === state.player.x && andere.y === state.player.y));
  }

  Game.tickRadWolken();

  assert.equal(state.rads, 0, 'Strahlung ohne Wolke');
});

test('der Rand der Wolke zählt, ein Feld weiter nicht', () => {
  const {Game} = freshGame();
  Game.baueRadWolken('desert');
  const w = Game.radWolkenImSektor()[0];

  // Die Wolken werden zufaellig platziert und koennen sich ueberlappen.
  // Beim ersten Durchlauf lag eine zweite Wolke zufaellig zwei Felder
  // neben der ersten - der Test war dann rot, obwohl der Radius stimmte.
  // Deshalb wird hier eine einzelne Wolke gesetzt statt gewuerfelt.
  Game.state.radClouds = [{sektor: {x: 0, y: 0}, x: 20, y: 20, radius: 2, dichte: 1, zug: 0}];

  assert.ok(Game.radWolkeAufFeld(22, 20), 'Randfeld zählt nicht');
  assert.equal(Game.radWolkeAufFeld(24, 20), null, 'zwei Felder weiter strahlt noch');
  assert.equal(Game.radWolkeAufFeld(20, 23), null, 'ausserhalb des Radius strahlt noch');
});

test('Gasmaske senkt die Dosis einer Wolke', () => {
  const {Game, state} = freshGame();
  Game.baueRadWolken('desert');
  const w = Game.radWolkenImSektor()[0];
  state.player = {x: w.x, y: w.y};

  // Vier Züge ohne Schutz
  for (let i = 0; i < 4; i++) Game.tickRadWolken();
  const ohne = state.rads;

  const {Game: G2, state: st2} = freshGame();
  G2.baueRadWolken('desert');
  const w2 = G2.radWolkenImSektor()[0];
  st2.player = {x: w2.x, y: w2.y};
  st2.equip = {head: {id: 'gas_mask', bonus: {RAD: 20}}};
  for (let i = 0; i < 4; i++) G2.tickRadWolken();
  const mit = st2.rads;

  assert.ok(mit < ohne, `Gasmaske hilft nicht: ${mit} statt weniger als ${ohne}`);
});

test('kleine Dosen verschwinden nicht durch Rundung', () => {
  const {Game, state} = freshGame();
  Game.state.equip = {head: {id: 'gas_mask', bonus: {RAD: 20}}};

  // 4 RAD minus 20 Prozent sind 3,2. Vor der Sammelrechnung wäre daraus
  // Math.ceil(3,2) = 4 geworden - der Schutz hätte bei kleinen Dosen nichts
  // gebracht und wäre unsichtbar geblieben.
  const einzeln = [];
  for (let i = 0; i < 5; i++) {
    const vorher = state.rads;
    Game.addRadiation(4);
    einzeln.push(state.rads - vorher);
  }
  const gesamt = einzeln.reduce((a, b) => a + b, 0);

  assert.ok(gesamt < 20, `fünf Dosen à 4 RAD ergaben ${gesamt} statt weniger als 20`);
  assert.ok(gesamt > 0, 'Strahlung verschwindet vollständig');
  for (const d of einzeln) assert.ok(d === 0 || d === 1 || d === 3 || d === 4, `unerwartete Dosis ${d}`);
});

test('die Wolke ist ein Ortsphänomen, kein Wettereffekt', () => {
  const {Game} = freshGame();
  // Regression: die Glühende See hatte nur Partikel, keine Strahlung.
  // Ohne Strahlungssturm darf ein Sektor ohne Wolken nicht strahlen.
  assert.equal(Game.radWolkenWertAufFeld(1, 1), 0);
  assert.equal(Game.radWolkenImSektor().length, 0);
});
