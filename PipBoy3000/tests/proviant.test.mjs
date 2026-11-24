// Rohfleisch und Lagerschrank.
//
// Zwei Ergänzungen zu Version 14.0.2, die zusammengehören: Rohfleisch ist
// erstmals essbar (mehr RAD, weniger Heilung als gebraten), und das Lager
// bekommt einen Schrank. Beides betrifft dasselbe Problem — unterwegs ist das
// Inventar eng, und wer Beute sammelt, musste bisher wegwerfen statt einlagern.
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
    inventory: [], caps: 1000, equip: {}, perks: {}, special: {}, playerName: 'Test',
    lvl: 5, saveSlot: 0, maxHp: 100, hp: 100, maxSlots: 50, rads: 0, xp: 0,
    quests: [], activeQuests: [], completedQuests: [], knownRecipes: [],
    explored: {}, discoveredPOIs: {}, sector: {x: 0, y: 0}, player: {x: 0, y: 0},
    dungeonLevel: 0, zone: 'Ödland', view: 'map', isGameOver: false,
    stats: {STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5, CHA: 5},
    ...overrides
  };
  Game.saveGame = () => {};
  UI.log = () => {};
  UI.update = () => {};
  UI.renderInventory = () => {};
  UI.showGameOver = () => {};
  return {window, Game, UI, state: window.Game.state};
}

function camp(overrides = {}) {
  const spiel = freshGame({
    camp: {level: 1, sector: {x: 0, y: 0}, x: 0, y: 0, storage: []},
    ...overrides
  });
  return spiel;
}

// ---------------------------------------------------------------- Rohfleisch

const ROH = ['meat_roach', 'meat_fly', 'meat_mole', 'meat_dog', 'meat_lurk', 'meat_scorp', 'meat_yao'];

test('jedes rohe Fleischstück hat einen Esswert', () => {
  const {Game} = freshGame();
  for (const id of ROH) {
    const def = Game.items[id];
    assert.ok(def, `${id} fehlt im Katalog`);
    assert.ok(def.raw, `${id} ist nicht essbar (kein raw-Feld)`);
    assert.ok(def.raw.heal > 0, `${id} heilt nicht`);
    assert.ok(def.raw.rad > 0, `${id} verstrahlt nicht`);
  }
});

test('roh essen heilt und verstrahlt', () => {
  const {Game, state} = freshGame();
  state.hp = 50;
  state.inventory = [{id: 'meat_roach', count: 2}];

  Game.useItem(0, 1);

  const def = Game.items.meat_roach;
  assert.equal(state.hp, 50 + def.raw.heal, 'Heilung stimmt nicht');
  assert.equal(state.rads, def.raw.rad, 'RAD stimmt nicht');
  assert.equal(state.inventory[0].count, 1, 'es wurde nicht genau ein Stück verbraucht');
});

test('rohes Fleisch verstrahlt deutlich mehr als gebratenes', () => {
  const {Game} = freshGame();
  const paare = [['meat_roach', 'cooked_roach'], ['meat_mole', 'cooked_mole'], ['meat_scorp', 'cooked_scorp']];
  for (const [roh, gebraten] of paare) {
    assert.ok(Game.items[roh].raw.rad > Game.items[gebraten].rad,
      `${roh} verstrahlt nicht mehr als ${gebraten}`);
    assert.ok(Game.items[roh].raw.heal < Game.items[gebraten].val,
      `${roh} heilt nicht weniger als ${gebraten} - dann gäbe es keinen Grund zu braten`);
  }
});

test('roh essen bei vollen HP verstrahlt nicht', () => {
  const {Game, state} = freshGame();
  state.hp = 100;
  state.inventory = [{id: 'meat_roach', count: 1}];

  Game.useItem(0, 1);

  assert.equal(state.rads, 0, 'RAD trotz vollem Leben');
  assert.equal(state.inventory.length, 1, 'Item wurde trotzdem verbraucht');
});

test('rohes Fleisch lässt sich weiterhin zum Braten verwenden', () => {
  const {Game} = freshGame();
  const rezepte = (Game.recipes || []).filter(r => r.type === 'cooking');
  const verbraucht = rezepte.flatMap(r => Object.keys(r.req));
  for (const id of ROH) {
    assert.ok(verbraucht.includes(id), `${id} wird in keinem Kochrezept verwendet - roh essen wäre die einzige Verwendung`);
  }
});

// -------------------------------------------------------------- Lagerschrank

test('der Schrank wächst mit der Lagerstufe', () => {
  const {Game, state} = camp();
  const stufen = [];
  for (let lvl = 1; lvl <= 10; lvl++) {
    state.camp.level = lvl;
    stufen.push(Game.getCampStorageSlots());
  }
  assert.equal(stufen[0], 10, 'Stufe 1 hat nicht 10 Plätze');
  assert.equal(stufen[9], 55, 'Stufe 10 hat nicht 55 Plätze');
  for (let i = 1; i < stufen.length; i++) {
    assert.ok(stufen[i] > stufen[i - 1], `Stufe ${i + 1} bringt keinen Platz dazu`);
  }
});

test('Einlagern nimmt das Item aus dem Rucksack', () => {
  const {Game, state} = camp();
  state.inventory = [{id: 'stimpack', count: 5}];

  const ok = Game.storeInCamp(0, 3);

  assert.equal(ok, true);
  assert.equal(state.inventory[0].count, 2, 'Rucksack wurde nicht geleert');
  assert.equal(Game.getCampStorage()[0].count, 3, 'Schrank hat nicht 3');
});

test('Einlagern ohne Menge nimmt den ganzen Stapel', () => {
  const {Game, state} = camp();
  state.inventory = [{id: 'screws', count: 12}];

  Game.storeInCamp(0);

  assert.equal(state.inventory.length, 0, 'Stapel blieb im Rucksack');
  assert.equal(Game.getCampStorageUsed(), 1);
  assert.equal(Game.getCampStorage()[0].count, 12);
});

test('gleiche Ware landet im selben Schrankfach', () => {
  const {Game, state} = camp();
  state.inventory = [{id: 'stimpack', count: 3}];
  Game.storeInCamp(0);
  state.inventory = [{id: 'stimpack', count: 4}];
  Game.storeInCamp(0);

  assert.equal(Game.getCampStorageUsed(), 1, 'zwei Fächer statt einem');
  assert.equal(Game.getCampStorage()[0].count, 7);
});

test('der Schrank hat eine feste Grenze', () => {
  const {Game, state} = camp();
  const ids = ['stimpack', 'radaway', 'screws', 'gears', 'cloth',
               'duct_tape', 'adhesive', 'springs', 'circuit', 'junk_metal'];
  state.inventory = ids.map(id => ({id, count: 1}));
  for (let i = 0; i < 10; i++) Game.storeInCamp(0);
  assert.equal(Game.getCampStorageUsed(), 10);

  state.inventory = [{id: 'radx', count: 1}];
  const ok = Game.storeInCamp(0);

  assert.equal(ok, false, 'das elfte Teil wurde angenommen');
  assert.equal(Game.getCampStorageUsed(), 10);
  assert.equal(state.inventory.length, 1, 'das abgelehnte Item ist trotzdem verschwunden');
});

test('Entnehmen legt die Ware zurück in den Rucksack', () => {
  const {Game, state} = camp();
  state.inventory = [{id: 'screws', count: 8}];
  Game.storeInCamp(0);

  const ok = Game.takeFromCamp(0, 3);

  assert.equal(ok, true);
  assert.equal(Game.getCampStorage()[0].count, 5, 'Schrank stimmt nicht');
  const imRucksack = state.inventory.find(i => i.id === 'screws');
  assert.equal(imRucksack.count, 3, 'Rucksack stimmt nicht');
});

test('Entnehmen bei vollem Rucksack wird abgelehnt', () => {
  const {Game, state} = camp();
  state.inventory = [{id: 'screws', count: 5}];
  Game.storeInCamp(0);

  // Rucksack künstlich füllen
  state.maxSlots = 1;
  state.stats.STR = 0;
  state.equip = {};
  Game.getMaxSlots = () => 0;

  const ok = Game.takeFromCamp(0);

  assert.equal(ok, false);
  assert.equal(Game.getCampStorage()[0].count, 5, 'Ware verschwand beim abgelehnten Entnehmen');
});

test('ein eingepacktes Lager nimmt den Schrank mit', () => {
  const {Game, state} = camp();
  state.inventory = [{id: 'stimpack', count: 2}];
  Game.storeInCamp(0);

  Game.packCamp();

  assert.equal(state.camp, null, 'Lager wurde nicht abgebaut');
  assert.equal((state.savedCampStorage || []).length, 1, 'Schrankinhalt ging beim Abbauen verloren');
  assert.equal(state.savedCampStorage[0].count, 2);
});

test('ein neu aufgeschlagenes Lager bringt den Schrank zurück', () => {
  const {Game, state} = camp();
  // Zustand wie nach packCamp():
  state.camp = null;
  state.savedCampStorage = [{id: 'gears', count: 4}];
  state.savedCampLevel = 3;
  state.caps = 500;
  state.zone = 'Ödland';
  state.dungeonLevel = 0;

  Game.deployCamp(0, true);

  assert.ok(state.camp, 'Lager wurde nicht aufgeschlagen');
  assert.equal(state.camp.level, 3, 'Stufe ging verloren');
  assert.equal(Game.getCampStorageUsed(), 1, 'Schrank ist leer');
  assert.equal(Game.getCampStorage()[0].count, 4);
});
