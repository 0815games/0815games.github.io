// [2026-10-12 13:30] - js/core/state.js: v0.0.5 Klassen-Spezifikationen & Spielzustand
// Änderungen:
// - Klassen-Profile (Krieger, Magier, Schurke) mit maßgeschneiderten Startwerten und Ausrüstungen definiert.
// - `player.classId` und dynamische Klassenwahl integriert.

export const CLASS_PROFILES = {
  warrior: {
    className: 'Eisenbrecher',
    hp: 75,
    maxHp: 75,
    mp: 15,
    maxMp: 15,
    baseAtk: 9,
    baseDef: 4,
    startWeapon: 'iron_sword',
    startArmor: 'chainmail',
    startItems: [
      { itemId: 'health_potion', count: 3 }
    ]
  },
  mage: {
    className: 'Arkanist',
    hp: 50,
    maxHp: 50,
    mp: 50,
    maxMp: 50,
    baseAtk: 6,
    baseDef: 1,
    startWeapon: 'dagger',
    startArmor: null,
    startItems: [
      { itemId: 'health_potion', count: 2 },
      { itemId: 'mana_potion', count: 4 }
    ]
  },
  rogue: {
    className: 'Schattenläufer',
    hp: 60,
    maxHp: 60,
    mp: 25,
    maxMp: 25,
    baseAtk: 8,
    baseDef: 2,
    startWeapon: 'dagger',
    startArmor: null,
    startItems: [
      { itemId: 'health_potion', count: 3 },
      { itemId: 'mana_potion', count: 2 }
    ]
  }
};

export const INITIAL_PLAYER = {
  name: 'Schattenjäger',
  classId: 'warrior',
  className: 'Eisenbrecher',
  x: 2,
  y: 2,
  level: 1,
  hp: 75,
  maxHp: 75,
  mp: 15,
  maxMp: 15,
  baseAtk: 9,
  baseDef: 4,
  caps: 40,
  exp: 0,
  nextExp: 100,
  tilesVisited: 1,
  equipped: {
    weapon: null,
    armor: null
  },
  inventory: []
};

export const INITIAL_TRADER = {
  name: 'Meister Eldrin (Alchemist)',
  x: 3,
  y: 4,
  caps: 300,
  inventory: [
    { itemId: 'health_potion', count: 6, price: 25 },
    { itemId: 'mana_potion', count: 5, price: 30 },
    { itemId: 'elixir_vitality', count: 2, price: 65 },
    { itemId: 'iron_sword', count: 1, price: 50 },
    { itemId: 'chainmail', count: 1, price: 45 },
    { itemId: 'soul_shard', count: 8, price: 8 }
  ]
};

export const state = {
  isInputLocked: false,
  inCombat: false,
  inShop: false,
  activeMonster: null,

  player: JSON.parse(JSON.stringify(INITIAL_PLAYER)),
  trader: JSON.parse(JSON.stringify(INITIAL_TRADER)),

  quests: {
    active: [],
    completed: []
  },

  world: {
    cols: 20,
    rows: 15,
    tiles: [],
    chests: [],
    monsters: [],
    discovered: []
  }
};
