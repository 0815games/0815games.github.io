// [2026-10-12 13:25] - js/core/state.js: v0.0.4 Held & Weltzustand
// Änderungen:
// - Held um Manapunkte (MP / MaxMP) und Zauberwerte erweitert.
// - Händler zu Meister Eldrin dem Alchemisten umbenannt und mit Zauberwaren bestückt.

export const INITIAL_PLAYER = {
  name: 'Schattenjäger',
  x: 2,
  y: 2,
  level: 1,
  hp: 60,
  maxHp: 60,
  mp: 30,
  maxMp: 30,
  baseAtk: 7,
  baseDef: 2,
  caps: 40,
  exp: 0,
  nextExp: 100,
  tilesVisited: 1,
  equipped: {
    weapon: null,
    armor: null
  },
  inventory: [
    { itemId: 'health_potion', count: 3 },
    { itemId: 'mana_potion', count: 2 },
    { itemId: 'dagger', count: 1 }
  ]
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
