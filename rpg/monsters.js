// [2026-10-12 08:13] - js/data/monsters.js: Bestiarium
// Änderungen:
// - Gegner-Templates mit Skalierungswerten, Angriffs- und Beutetabellen.

export const MONSTER_TEMPLATES = {
  rad_roach: {
    name: 'Rad-Kakerlake',
    hp: 18,
    atk: 5,
    def: 1,
    exp: 15,
    goldMin: 2,
    goldMax: 6,
    lootTable: [{ itemId: 'scrap_metal', chance: 0.5 }]
  },
  wild_dog: {
    name: 'Mutierter Hund',
    hp: 32,
    atk: 8,
    def: 2,
    exp: 30,
    goldMin: 5,
    goldMax: 12,
    lootTable: [{ itemId: 'stimpack', chance: 0.3 }]
  },
  raider_scout: {
    name: 'Raider Späher',
    hp: 50,
    atk: 12,
    def: 4,
    exp: 60,
    goldMin: 15,
    goldMax: 30,
    lootTable: [
      { itemId: 'pipe_pistol', chance: 0.2 },
      { itemId: 'stimpack', chance: 0.6 }
    ]
  }
};
