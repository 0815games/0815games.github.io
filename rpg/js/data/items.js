// [2026-10-12 18:55] - js/data/items.js: v0.0.9 Reliquien- & Ausrüstungskatalog
export const ITEM_DATABASE = {
  health_potion: {
    id: 'health_potion',
    name: 'Rubinroter Heiltrank',
    type: 'consumable',
    effect: 'heal',
    val: 35,
    price: 25,
    stackable: true,
    desc: 'Regeneriert 35 Trefferpunkte durch elbische Kräuter.'
  },
  mana_potion: {
    id: 'mana_potion',
    name: 'Saphirblauer Manatrank',
    type: 'consumable',
    effect: 'mana',
    val: 25,
    price: 30,
    stackable: true,
    desc: 'Stellt 25 Manapunkte für arkane Zauber wieder her.'
  },
  elixir_vitality: {
    id: 'elixir_vitality',
    name: 'Elixier der Vitalität',
    type: 'consumable',
    effect: 'heal_max',
    val: 70,
    price: 65,
    stackable: true,
    desc: 'Mächtiges Gebräu, das 70 Trefferpunkte augenblicklich heilt.'
  },
  iron_sword: {
    id: 'iron_sword',
    name: 'Geschmiedetes Langschwert',
    type: 'weapon',
    val: 9,
    price: 50,
    stackable: false,
    desc: 'Scharfe Stahlklinge eines gefallenen Ritters (+9 Schlagkraft).'
  },
  runic_blade: {
    id: 'runic_blade',
    name: 'Runenklinge des Lichts',
    type: 'weapon',
    val: 18,
    price: 130,
    stackable: false,
    desc: 'Mit heiligen Glyphen graviert; durchdringt dicke Schattenrüstungen (+18 Schlagkraft).'
  },
  dagger: {
    id: 'dagger',
    name: 'Katakomben-Dolch',
    type: 'weapon',
    val: 5,
    price: 20,
    stackable: false,
    desc: 'Leichte Klinge für schnelle Hinterhalte (+5 Schlagkraft).'
  },
  chainmail: {
    id: 'chainmail',
    name: 'Geschwärztes Kettenhemd',
    type: 'armor',
    val: 5,
    price: 45,
    stackable: false,
    desc: 'Schützt vitale Organe vor Klauen und Pfeilen (+5 Rüstungsschutz).'
  },
  knight_armor: {
    id: 'knight_armor',
    name: 'Ritterharnisch der Tempelwache',
    type: 'armor',
    val: 11,
    price: 115,
    stackable: false,
    desc: 'Massiver Plattenpanzer aus gehärtetem Zwergenstahl (+11 Rüstungsschutz).'
  },
  soul_shard: {
    id: 'soul_shard',
    name: 'Schattensplitter',
    type: 'material',
    val: 0,
    price: 8,
    stackable: true,
    desc: 'Glühendes Relikt besiegter Gruftkreaturen; begehrt bei Alchemisten.'
  }
};
