// [2026-10-12 13:50] - js/data/monsters.js: v0.0.8 Bestiarium
export const MONSTER_TYPES = {
  goblin: {
    typeId: 'goblin',
    name: 'Goblin-Plünderer',
    maxHp: 22,
    atk: 6,
    def: 1,
    exp: 20,
    minCaps: 5,
    maxCaps: 12,
    color: '#4caf50',
    loot: [
      { id: 'soul_shard', chance: 0.7 }
    ]
  },
  skeleton_warrior: {
    typeId: 'skeleton_warrior',
    name: 'Skelettkrieger',
    maxHp: 38,
    atk: 10,
    def: 3,
    exp: 40,
    minCaps: 12,
    maxCaps: 24,
    color: '#e0e0e0',
    loot: [
      { id: 'health_potion', chance: 0.4 },
      { id: 'soul_shard', chance: 0.8 }
    ]
  },
  crypt_lord: {
    typeId: 'crypt_lord',
    name: 'Dunkler Gruftfürst',
    maxHp: 65,
    atk: 15,
    def: 5,
    exp: 90,
    minCaps: 35,
    maxCaps: 70,
    color: '#9c27b0',
    loot: [
      { id: 'runic_blade', chance: 0.35 },
      { id: 'elixir_vitality', chance: 0.8 }
    ]
  }
};
