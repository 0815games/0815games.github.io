// [2026-10-12 13:15] - js/core/state.js: v0.0.2 Spielzustand mit Händler- und Speicherkontext
// Änderungen:
// - Händler-Status (Position, Budget, Warenbestand) im Weltzustand abgebildet.
// - Initialisierungs-Standardwerte gekapselt für reproduzierbare Resets.

export const INITIAL_PLAYER = {
  name: 'Vault-Bewohner',
  x: 2,
  y: 2,
  level: 1,
  hp: 50,
  maxHp: 50,
  baseAtk: 6,
  baseDef: 1,
  caps: 35,
  exp: 0,
  nextExp: 100,
  tilesVisited: 1,
  equipped: {
    weapon: null,
    armor: null
  },
  inventory: [
    { itemId: 'stimpack', count: 3 },
    { itemId: 'purified_water', count: 2 },
    { itemId: 'machete', count: 1 }
  ]
};

export const INITIAL_TRADER = {
  name: 'Krämer Gus',
  x: 3,
  y: 4,
  caps: 250,
  inventory: [
    { itemId: 'stimpack', count: 5, price: 25 },
    { itemId: 'stimpack_super', count: 2, price: 55 },
    { itemId: 'purified_water', count: 6, price: 10 },
    { itemId: 'hunting_rifle', count: 1, price: 110 },
    { itemId: 'metal_armor', count: 1, price: 95 },
    { itemId: 'scrap_metal', count: 15, price: 6 }
  ]
};

export const state = {
  isInputLocked: false,
  inCombat: false,
  inShop: false,
  activeMonster: null,

  player: JSON.parse(JSON.stringify(INITIAL_PLAYER)),

  trader: JSON.parse(JSON.stringify(INITIAL_TRADER)),

  world: {
    cols: 20,
    rows: 15,
    tiles: [],
    chests: [],
    monsters: [],
    discovered: []
  }
};
