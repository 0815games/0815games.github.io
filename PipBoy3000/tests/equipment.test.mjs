// Befunde B1, B3 und B4 aus docs/BALANCE_BEFUNDE.md.
//
// Alle drei sind dasselbe Muster: Die Daten standen im Katalog, aber keine
// Codezeile las sie. Rüstung hatte kein `def`, Buffout & Co. wurden nur
// verbraucht, Strahlungsresistenz kannte nur den Perk.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadBundle} from './helpers/load-bundle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function freshGame(overrides = {}) {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const {Game, Combat, UI} = window;
  window.Game.state = {
    inventory: [], caps: 0, equip: {}, perks: {}, special: {}, playerName: 'Test',
    lvl: 5, saveSlot: 0, maxHp: 100, hp: 100, maxSlots: 50, rads: 0, xp: 0,
    quests: [], activeQuests: [], completedQuests: [], knownRecipes: [],
    explored: {}, discoveredPOIs: {}, sector: {x: 0, y: 0}, isGameOver: false,
    stats: {STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5},
    ...overrides
  };
  Game.saveGame = () => {};
  UI.log = () => {};
  UI.update = () => {};
  UI.showGameOver = () => {};
  return {window, Game, Combat, UI, state: window.Game.state};
}

// Erwarteter Schaden, den ein Gegner pro Treffer anrichtet (Treffer gepinnt).
function schadenProTreffer(window, Equipment) {
  const {Combat} = window;
  const original = window.Math.random;
  let summe = 0;
  const Runden = 30;
  try {
    for (let i = 0; i < Runden; i++) {
      window.Game.state.equip = Equipment;
      window.Game.state.hp = 100;
      Combat.enemy = {name: 'Raider', dmg: 30, hp: 100, maxHp: 100};
      Combat.turn = 'enemy';
      window.Math.random = () => 0; // Treffer und kein Ausweichen
      Combat.enemyTurn();
      summe += 100 - window.Game.state.hp;
    }
  } finally {
    window.Math.random = original;
  }
  return summe / Runden;
}

// ===========================================================================
// B1 — Rüstung schützt
// ===========================================================================
test('jedes Rüstungsteil hat einen Schutzwert', () => {
  const {Game} = freshGame();
  const ohne = [];
  for (const [id, def] of Object.entries(Game.items)) {
    if (!['head', 'body', 'legs', 'arms', 'feet'].includes(def.type)) continue;
    if (typeof def.def !== 'number' || def.def <= 0) ohne.push(id);
  }
  assert.equal(ohne.join(', '), '', `Rüstung ohne Schutz: ${ohne.join(', ')}`);
});

test('Rüstung mindert den erlittenen Schaden', () => {
  const {window, state} = freshGame();
  state.equip = {};

  const nackt = schadenProTreffer(window, {});
  const leicht = schadenProTreffer(window, {body: {id: 'leather_armor', def: 4}});
  const schwer = schadenProTreffer(window, {body: {id: 'power_armor', def: 25}});

  assert.ok(leicht < nackt, `leichte Rüstung hilft nicht (${leicht} vs ${nackt})`);
  assert.ok(schwer < leicht, `schwere Rüstung hilft nicht mehr als leichte (${schwer} vs ${leicht})`);
});

test('alte Spielstände mit bloßer ID bekommen ihren Schutz trotzdem', () => {
  // In manchen Ständen steht im Slot nur {id}. Vorher las der Kampf dann
  // `undefined` und der Schutz fiel weg.
  const {window} = freshGame();
  const mitObjekt = schadenProTreffer(window, {body: {id: 'power_armor', def: 25}});
  const nurId = schadenProTreffer(window, {body: {id: 'power_armor'}});
  assert.equal(nurId, mitObjekt, 'Schutz fällt weg, wenn nur die ID gespeichert ist');
});

test('Rüstung macht nicht unbesiegbar', () => {
  const {window} = freshGame();
  const schaden = schadenProTreffer(window, {
    body: {id: 'power_armor', def: 25},
    head: {id: 'synth_helmet', def: 6},
    legs: {id: 'combat_legs', def: 5},
    arms: {id: 'combat_arms', def: 5},
    feet: {id: 'boots_combat', def: 3}
  });
  assert.ok(schaden >= 1, `voller Schutz macht immun (${schaden} Schaden)`);
});

// ===========================================================================
// B3 — Buff-Items
// ===========================================================================
test('Buffout erhöht STR und END', () => {
  const {Game, state} = freshGame();
  state.inventory = [{id: 'buffout', count: 1}];
  const strVorher = Game.getStat('STR');

  Game.useItem('buffout');

  assert.equal(Game.getStat('STR'), strVorher + 2, 'STR wurde nicht erhöht');
  assert.equal(Game.getStat('END'), 7, 'END wurde nicht erhöht');
});

test('jedes Buff-Item legt seinen Bonus an', () => {
  const {Game, state} = freshGame();
  const buffs = Object.entries(Game.items).filter(([, d]) => d.type === 'consumable' && d.effect === 'buff');
  assert.ok(buffs.length >= 4, `nur ${buffs.length} Buff-Items gefunden`);

  for (const [id, def] of buffs) {
    Game.state = {...state, inventory: [{id, count: 1}], buffs: []};
    Game.useItem(id);
    for (const [key, wert] of Object.entries(def.bonus || {})) {
      assert.equal(Game.buffBonus(key), wert, `${id} legt ${key} nicht an`);
    }
  }
});

test('ein Buff läuft ab', () => {
  const {Game, state} = freshGame();
  state.inventory = [{id: 'buffout', count: 1}];
  Game.useItem('buffout');
  assert.equal(Game.getStat('STR'), 7);

  // Zeit vorspulen statt zu warten.
  state.buffs[0].expires = Date.now() - 1;
  assert.equal(Game.getStat('STR'), 5, 'Buff überlebt seinen Ablauf');
});

test('ein verbrauchtes Buff-Item verschwindet aus dem Inventar', () => {
  const {Game, state} = freshGame();
  state.inventory = [{id: 'buffout', count: 2}];
  Game.useItem('buffout');
  assert.equal(state.inventory[0].count, 1, 'Item wurde nicht verbraucht');
});

// ===========================================================================
// B4 — Strahlungsresistenz
// ===========================================================================
function strahlung(window, equip, {perks = {}, radx = false} = {}) {
  const {Game} = window;
  window.Game.state = {
    ...window.Game.state, equip, perks: {...perks}, rads: 0, maxHp: 100, hp: 100,
    inventory: radx ? [{id: 'radx', count: 1}] : [], buffs: []
  };
  if (radx) Game.useItem('radx');
  Game.addRadiation(50);
  return window.Game.state.rads;
}

test('ohne Schutz kommt alle Strahlung an', () => {
  const {window} = freshGame();
  assert.equal(strahlung(window, {}), 50, 'es gibt eine Grundresistenz, die es nicht geben darf');
});

test('der Strahlenschutzanzug mindert Strahlung', () => {
  const {window} = freshGame();
  const mit = strahlung(window, {body: {id: 'hazmat_suit'}});
  assert.ok(mit < 50, `Anzug wirkt nicht (${mit} von 50)`);
  assert.ok(mit > 0, 'Anzug macht immun — RAD+1000 ist ein Platzhalter');
});

test('Gasmaske und Rad-X mindern Strahlung ebenfalls', () => {
  const {window} = freshGame();
  const ohne = strahlung(window, {});
  const maske = strahlung(window, {head: {id: 'gas_mask'}});
  const radx = strahlung(window, {}, {radx: true});

  assert.ok(maske < ohne, `Gasmaske wirkt nicht (${maske} vs ${ohne})`);
  assert.ok(radx < ohne, `Rad-X wirkt nicht (${radx} vs ${ohne})`);
});

test('Resistenz und Perk addieren sich, bleiben aber gedeckelt', () => {
  const {window} = freshGame();
  const beides = strahlung(window, {body: {id: 'hazmat_suit'}}, {perks: {rad_resistant: 5}});
  assert.ok(beides > 0, 'Perk plus Anzug macht immun');
  assert.ok(beides <= 50, 'Resistenz ist größer als die Ausgangsstrahlung');
});
