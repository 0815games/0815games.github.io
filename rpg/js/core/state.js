// v0.3.8 – Skilltree & Heldenstatus
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
    skillTree: {},
    skillPoints: 0,
    equipped: {
      head: null,
      body: null,
      mainhand: null,
      offhand: null,
      feet: null,
      ring: null
    },
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

// Normalize collections whenever a loaded save replaces state.player.
export function normalizePlayer(player) {
  const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!isRecord(player)) throw new TypeError('Spielstand: Heldendaten fehlen oder sind ungültig.');
  if (player.inventory != null && !Array.isArray(player.inventory)) {
    throw new TypeError('Spielstand: Inventarformat ungültig; Daten wurden nicht ersetzt.');
  }
  for (const key of ['equipped', 'skillTree', 'buffs', 'cooldowns', 'preparationBought']) {
    if (player[key] != null && !isRecord(player[key])) {
      throw new TypeError(`Spielstand: ${key} ist ungültig; Daten wurden nicht ersetzt.`);
    }
  }
  return {
    ...player,
    inventory: player.inventory ?? [],
    equipped: {head: null, body: null, mainhand: null, offhand: null, feet: null, ring: null, ...player.equipped},
    skillTree: {...player.skillTree},
    buffs: {shield: 0, block: false, evade: false, ...player.buffs},
    cooldowns: {...player.cooldowns},
    preparationBought: {...player.preparationBought}
  };
}

let currentPlayer = normalizePlayer(state.player);
Object.defineProperty(state, 'player', {
  enumerable: true,
  configurable: false,
  get() { return currentPlayer; },
  set(player) { currentPlayer = normalizePlayer(player); }
});
