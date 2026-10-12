// [2026-10-12 13:15] - js/data/monsters.js: v0.0.2 Bestiarium & Beutetabellen
// Änderungen:
// - Belohnungen an das Händlersystem angepasst (Korken- und Item-Werte synchronisiert).

export const MONSTER_TYPES = {
  rad_roach: {
    typeId: 'rad_roach',
    name: 'Rad-Kakerlake',
    maxHp: 20,
    atk: 5,
    def: 1,
    exp: 18,
    minCaps: 4,
    maxCaps: 10,
    color: '#a36829',
    loot: [
      { id: 'scrap_metal', chance: 0.7 }
    ]
  },
  mutant_dog: {
    typeId: 'mutant_dog',
    name: 'Mutierter Hund',
    maxHp: 35,
    atk: 8,
    def: 2,
    exp: 35,
    minCaps: 10,
    maxCaps: 22,
    color: '#8b4513',
    loot: [
      { id: 'stimpack', chance: 0.35 },
      { id: 'scrap_metal', chance: 0.6 }
    ]
  },
  raider: {
    typeId: 'raider',
    name: 'Raider Plünderer',
    maxHp: 55,
    atk: 12,
    def: 4,
    exp: 65,
    minCaps: 25,
    maxCaps: 50,
    color: '#c0392b',
    loot: [
      { id: 'pipe_pistol', chance: 0.3 },
      { id: 'stimpack', chance: 0.75 }
    ]
  }
};
