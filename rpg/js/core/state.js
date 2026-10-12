// [2026-10-12 20:30] - js/core/state.js: v0.1.4 4 Slots & Heldenstatus
export const CLASSES = {
  warrior: {
    title: 'Eisenbrecher',
    hp: 75, mp: 15, atk: 9, def: 4,
    weapon: 'iron_sword', armor: 'chainmail',
    items: [{ id: 'health_potion', count: 3 }]
  },
  mage: {
    title: 'Arkanist',
    hp: 50, mp: 50, atk: 6, def: 1,
    weapon: 'dagger', armor: null,
    items: [{ id: 'health_potion', count: 2 }, { id: 'mana_potion', count: 4 }]
  },
  rogue: {
    title: 'Schattenläufer',
    hp: 60, mp: 25, atk: 8, def: 2,
    weapon: 'dagger', armor: null,
    items: [{ id: 'health_potion', count: 3 }, { id: 'mana_potion', count: 2 }]
  }
};

export const state = {
  user: null,
  isGuest: true,
  currentSlot: 0,
  inCombat: false,
  activeMonster: null,
  player: {
    name: 'Schattenjäger',
    heroClass: 'warrior',
    level: 1,
    hp: 75, maxHp: 75,
    mp: 15, maxMp: 15,
    atk: 9, def: 4,
    gold: 40,
    xp: 0, nextXp: 100,
    x: 2, y: 2,
    equipped: { weapon: null, armor: null },
    inventory: []
  },
  world: {
    depth: 1,
    cols: 20,
    rows: 15,
    tiles: [],
    chests: [],
    monsters: [],
    stairs: { x: 17, y: 12 },
    discovered: []
  },
  meta: {
    gold: 0,
    bestDepth: 1
  }
};
