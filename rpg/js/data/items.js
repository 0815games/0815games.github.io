// [2026-10-12 13:15] - js/data/items.js: v0.0.2 Item-Katalog mit Einkauf- und Verkaufswerten
// Änderungen:
// - Neue Items: Jagdgewehr, Metallrüstung und Militär-Stimpak hinzugefügt.
// - Definition einheitlicher An- und Verkaufspreise.

export const ITEM_DATABASE = {
  stimpack: {
    id: 'stimpack',
    name: 'Stimpak',
    type: 'consumable',
    effect: 'heal',
    val: 30,
    price: 25,
    stackable: true,
    desc: 'Heilt 30 Trefferpunkte im Handumdrehen.'
  },
  stimpack_super: {
    id: 'stimpack_super',
    name: 'Militär-Stimpak',
    type: 'consumable',
    effect: 'heal',
    val: 60,
    price: 55,
    stackable: true,
    desc: 'Hochentwickelter Heilinjektor für schwere Blessuren (+60 TP).'
  },
  purified_water: {
    id: 'purified_water',
    name: 'Aufbereitetes Wasser',
    type: 'consumable',
    effect: 'heal',
    val: 15,
    price: 10,
    stackable: true,
    desc: 'Erfrischt und heilt 15 TP ohne Strahlenschäden.'
  },
  pipe_pistol: {
    id: 'pipe_pistol',
    name: '10mm Rohrpistole',
    type: 'weapon',
    val: 8,
    price: 45,
    stackable: false,
    desc: 'Zuverlässige Schusswaffe aus Sanitärrohren (+8 ATK).'
  },
  hunting_rifle: {
    id: 'hunting_rifle',
    name: 'Jagdgewehr .308',
    type: 'weapon',
    val: 16,
    price: 110,
    stackable: false,
    desc: 'Präzises Kalibergewehr mit verheerender Durchschlagskraft (+16 ATK).'
  },
  machete: {
    id: 'machete',
    name: 'Rostige Machete',
    type: 'weapon',
    val: 5,
    price: 25,
    stackable: false,
    desc: 'Scharfe Klinge für den schnellen Nahkampf (+5 ATK).'
  },
  leather_armor: {
    id: 'leather_armor',
    name: 'Ödland-Lederrüstung',
    type: 'armor',
    val: 4,
    price: 40,
    stackable: false,
    desc: 'Gegerbtes Brahmin-Leder für Basisschutz (+4 DEF).'
  },
  metal_armor: {
    id: 'metal_armor',
    name: 'Verstärkte Metallrüstung',
    type: 'armor',
    val: 9,
    price: 95,
    stackable: false,
    desc: 'Zusammengeschweißte Stahlplatten gegen schweres Feuer (+9 DEF).'
  },
  scrap_metal: {
    id: 'scrap_metal',
    name: 'Schrottmetall',
    type: 'material',
    val: 0,
    price: 6,
    stackable: true,
    desc: 'Essentielles Rohmaterial zum Craften und Handeln.'
  }
};
