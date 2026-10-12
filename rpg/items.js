// [2026-10-12 08:13] - js/data/items.js: Zentrales Item-Register
// Änderungen:
// - Definition aller Item-Typen (Konsumgüter, Rüstung, Schrott).
// - Stacking-Limits und Standard-Werte für Wirtschaftssystem hinterlegt.

export const ITEM_DATABASE = {
  stimpack: {
    id: 'stimpack',
    name: 'Stimpak',
    type: 'consumable',
    effect: 'heal',
    power: 30,
    price: 20,
    stackable: true,
    description: 'Heilt Verletzungen im Feldversuch.'
  },
  pipe_pistol: {
    id: 'pipe_pistol',
    name: '10mm Rohrpistole',
    type: 'weapon',
    power: 8,
    price: 45,
    stackable: false,
    description: 'Einfache Schusswaffe aus Altmetall.'
  },
  leather_vest: {
    id: 'leather_vest',
    name: 'Lederrüstung',
    type: 'armor',
    power: 4,
    price: 35,
    stackable: false,
    description: 'Bietet Basisschutz vor Nahkampfangriffen.'
  },
  scrap_metal: {
    id: 'scrap_metal',
    name: 'Schrottmetall',
    type: 'material',
    price: 5,
    stackable: true,
    description: 'Wertvolles Baumaterial für spätere Werkbänke.'
  }
};
