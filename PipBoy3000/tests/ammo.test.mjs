// Munition war jahrelang gebaut, aber nie verbunden: keine Waffe hatte ein
// `ammoType`, `usesAmmo` wurde im ganzen Bündel nicht gelesen, und der Zweig
// "WAFFE LEER" in game_combat.js war damit unerreichbar (docs/BEFUNDE.md, 4).
// Diese Tests halten die Verbindung fest.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadBundle} from './helpers/load-bundle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function freshGame() {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const state = {
    inventory: [], caps: 100, equip: {}, perks: {}, special: {},
    playerName: 'Test', lvl: 5, saveSlot: 0, maxHp: 100, maxSlots: 50,
    quests: [], activeQuests: [], completedQuests: [], knownRecipes: [],
    explored: {}, discoveredPOIs: {}, sector: {x: 0, y: 0}, stats: {},
    shop: {nextRestock: 0, stock: {}, merchantCaps: 1000}
  };
  window.Game.state = state;
  return {window, game: window.Game, combat: window.Combat, state};
}

test('jede Feuerwaffe nennt eine Munitionsart', () => {
  const {game} = freshGame();
  const guns = Object.entries(game.items).filter(([, item]) =>
    item.type === 'weapon' && item.usesAmmo === true);
  assert.ok(guns.length >= 15, `nur ${guns.length} Feuerwaffen gefunden`);

  const withoutAmmo = guns.filter(([, item]) => !item.ammoType).map(([id]) => id);
  assert.deepEqual(withoutAmmo, [], `Feuerwaffen ohne ammoType: ${withoutAmmo.join(', ')}`);
});

test('jede genannte Munitionsart existiert als Item', () => {
  const {game} = freshGame();
  const missing = [];
  for (const [id, item] of Object.entries(game.items)) {
    if (!item.ammoType) continue;
    const ammo = game.items[item.ammoType];
    if (!ammo) missing.push(`${id} -> ${item.ammoType}`);
    else if (ammo.type !== 'ammo') missing.push(`${id} -> ${item.ammoType} (kein Munitionstyp)`);
  }
  assert.deepEqual(missing, [], `Unbekannte Munition:\n  ${missing.join('\n  ')}`);
});

test('der Verbrauch ist gestaffelt, nicht überall 1', () => {
  const {game} = freshGame();
  const costs = new Set();
  for (const item of Object.values(game.items)) {
    if (item.ammoType) costs.add(item.ammoCost);
  }
  assert.ok(costs.size >= 3, `nur ${costs.size} verschiedene Verbrauchsmengen: ${[...costs]}`);
  // Die Minigun muss deutlich mehr ziehen als eine Pistole.
  assert.ok(game.items.minigun.ammoCost > game.items.pistol_10mm.ammoCost,
    'Minigun verbraucht nicht mehr als die Pistole');
});

test('ein Schuss entnimmt genau die Menge aus dem Inventar', () => {
  const {game, combat, state} = freshGame();
  state.equip.weapon = {id: 'pistol_10mm'};
  state.inventory = [{id: 'ammo_10mm', count: 10}];

  const stats = combat.getWeaponStats(state.equip.weapon);
  assert.equal(stats.ammoType, 'ammo_10mm');

  const took = game.removeFromInventory(stats.ammoType, stats.ammoCost);
  assert.equal(took, true, 'Munition wurde nicht entnommen');
  assert.equal(state.inventory.find(i => i.id === 'ammo_10mm').count, 9);
});

test('ohne Munition schlägt die Entnahme fehl', () => {
  // Combat.playerAttack prüft genau diesen Rückgabewert und löst dann
  // "* KLICK *" und switchToBestMelee aus.
  const {game, combat, state} = freshGame();
  state.equip.weapon = {id: 'minigun'};
  state.inventory = [];
  const stats = combat.getWeaponStats(state.equip.weapon);
  assert.equal(stats.ammoType, 'ammo_micro');
  assert.equal(game.removeFromInventory(stats.ammoType, stats.ammoCost), false);
});

test('der HUD-Zähler summiert alle Munitionsarten', () => {
  const {game, state} = freshGame();
  state.inventory = [
    {id: 'ammo', count: 5}, {id: 'ammo_10mm', count: 7},
    {id: 'ammo_cell', count: 3}, {id: 'stimpack', count: 2}
  ];
  game.syncAmmo();
  assert.equal(state.ammo, 15, 'syncAmmo zählt nicht alle Sorten');
});

test('der Händler führt jede Munitionsart', () => {
  const {game, state} = freshGame();
  game.checkShopRestock();
  const stock = state.shop.ammoStockByType;
  const ammoTypes = Object.keys(game.items).filter(id => game.items[id].type === 'ammo');
  const missing = ammoTypes.filter(id => !(stock[id] > 0));
  assert.deepEqual(missing, [], `nicht im Sortiment: ${missing.join(', ')}`);
});

test('Munition lässt sich kaufen, auch die teure Sorte', () => {
  const {game, state} = freshGame();
  game.checkShopRestock();
  state.caps = 1000;
  const vorher = state.shop.ammoStockByType.ammo_cell;
  game.buyItem('ammo_cell', 1);
  assert.equal(state.shop.ammoStockByType.ammo_cell, vorher - 10, 'Lager wurde nicht reduziert');
  const gekauft = state.inventory.find(i => i.id === 'ammo_cell');
  assert.ok(gekauft && gekauft.count === 10, 'Munition landete nicht im Inventar');
});

test('ein Schuss mit Munition trifft und verbraucht genau eine Patrone', () => {
  const fig = freshGame();
  const {game, combat, state} = fig;
  state.equip.weapon = {id: 'pistol_10mm'};
  state.inventory = [{id: 'ammo_10mm', count: 10}];
  combat.enemy = {name: 'Rad-Kakerlake', hp: 100, maxHp: 100, dmg: 1, xp: [1, 2], loot: 0, drops: []};
  combat.log = () => {};

  combat.playerAttack(0);

  const uebrig = state.inventory.find(i => i.id === 'ammo_10mm');
  assert.equal(uebrig.count, 9, 'Munition wurde nicht verbraucht');
  assert.ok(combat.enemy.hp < 100, 'dem Gegner wurde kein Schaden zugefügt');
});

test('ohne Munition: KLICK-Meldung und Wechsel auf Nahkampf', () => {
  // Dieser Zweig war vor der Verbindung unerreichbar - er ist der eigentliche
  // Grund, warum das Munitionssystem jetzt existiert.
  const {window, game, combat, state} = freshGame();
  state.equip.weapon = {id: 'minigun'};
  state.inventory = [{id: 'knife', count: 1}];

  const meldungen = [];
  combat.log = (text) => meldungen.push(text);
  window.UI.showCombatEffect = (_a, text) => meldungen.push(text);
  combat.enemy = {name: 'Rad-Kakerlake', hp: 100, maxHp: 100, dmg: 1, xp: [1, 2], loot: 0, drops: []};

  // playerAttack wartet 800 ms auf den Waffenwechsel und 1000 ms auf den
  // nächsten Zug. Für den Test laufen Timer sofort.
  const original = window.setTimeout;
  window.setTimeout = (fn) => { try { fn(); } catch (e) { meldungen.push('FEHLER: ' + e.message); } return 0; };
  try {
    combat.playerAttack(0);
  } finally {
    window.setTimeout = original;
  }

  assert.ok(meldungen.some(t => /KLICK|LEER/i.test(t)), `keine KLICK-Meldung: ${meldungen.join(' | ')}`);
  assert.ok(!meldungen.some(t => t.startsWith('FEHLER:')), `Fehler im Leer-Zweig: ${meldungen.join(' | ')}`);
});

test('die Shop-Liste zeigt jede vorrätige Munitionsart als eigene Zeile', () => {
  // Vorher stand hier genau eine Zeile "10x MUNITION". Fünf der sechs Sorten
  // wären damit unsichtbar geblieben, obwohl sie im Lager liegen.
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const document = window.document;
  document.body.innerHTML = '<div id="liste"></div>';

  window.Game.state = {
    inventory: [], caps: 500, equip: {}, perks: {}, special: {}, playerName: 'Test',
    lvl: 5, saveSlot: 0, maxHp: 100, maxSlots: 50, quests: [], activeQuests: [],
    completedQuests: [], knownRecipes: [], explored: {}, discoveredPOIs: {},
    sector: {x: 0, y: 0}, stats: {},
    shop: {nextRestock: 0, stock: {}, merchantCaps: 1000}
  };
  window.Game.checkShopRestock();
  window.UI.shopQty = 1;
  window.UI.renderShopBuy(document.getElementById('liste'));

  const rows = [...document.querySelectorAll('.shop-item-row')];
  const keys = rows
    .map(r => (r.getAttribute('onclick') || '').match(/buyItem\('([^']+)'/))
    .filter(Boolean)
    .map(m => m[1]);

  const ammoTypes = Object.keys(window.Game.items).filter(id => window.Game.items[id].type === 'ammo');
  const missing = ammoTypes.filter(id => !keys.includes(id));
  assert.deepEqual(missing, [], `nicht im Laden sichtbar: ${missing.join(', ')}`);
});

test('jede Munitionsart hat ein Rezept', () => {
  const {window} = freshGame();
  const produced = new Set(window.GameData.recipes.map(r => String(r.out).toLowerCase()));
  const ammoTypes = Object.keys(window.Game.items).filter(id => window.Game.items[id].type === 'ammo');
  // craft_ammo schreibt historisch 'AMMO' groß - das zählt für 'ammo'.
  const missing = ammoTypes.filter(id => !produced.has(id));
  assert.deepEqual(missing, [], `ohne Rezept: ${missing.join(', ')}`);
});
