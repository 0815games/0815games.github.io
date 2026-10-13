// [2026-10-12 20:45] - js/data/items.js: v0.1.5 Slot-Definitionen für Ausrüstung
export const ITEMS = {
  health_potion: { name: 'Rubinroter Heiltrank', type: 'potion', effect: 'hp', val: 35, price: 25, desc: 'Heilt 35 Lebenspunkte.' },
  mana_potion: { name: 'Saphirblauer Manatrank', type: 'potion', effect: 'mp', val: 25, price: 30, desc: 'Stellt 25 Mana wieder her.' },
  iron_sword: { name: 'Geschmiedetes Langschwert', type: 'weapon', slot: 'mainhand', val: 9, price: 50, desc: '+9 Schlagkraft (Haupthand).' },
  runic_blade: { name: 'Runenklinge des Lichts', type: 'weapon', slot: 'mainhand', val: 18, price: 130, desc: '+18 Schlagkraft (Haupthand).' },
  dagger: { name: 'Katakomben-Dolch', type: 'weapon', slot: 'mainhand', val: 5, price: 20, desc: '+5 Schlagkraft (Haupthand).' },
  chainmail: { name: 'Geschwärztes Kettenhemd', type: 'armor', slot: 'body', val: 5, price: 45, desc: '+5 Schutz (Brust).' },
  knight_armor: { name: 'Ritterharnisch', type: 'armor', slot: 'body', val: 11, price: 115, desc: '+11 Schutz (Brust).' },
  iron_shield: { name: 'Eisenschild des Wächters', type: 'shield', slot: 'offhand', val: 4, price: 40, desc: '+4 Schutz (Nebenhand).' },
  iron_helmet: { name: 'Eisenhelm der Wache', type: 'helmet', slot: 'head', val: 3, price: 35, desc: '+3 Schutz (Kopf).' },
  leather_boots: { name: 'Feste Lederstiefel', type: 'boots', slot: 'feet', val: 2, price: 25, desc: '+2 Schutz (Füße).' },
  ruby_ring: { name: 'Rubinring des Ordens', type: 'ring', slot: 'ring', val: 5, stat: 'atk', price: 60, desc: '+5 Schlagkraft (Reliquie).' },
  soul_shard: { name: 'Schattensplitter', type: 'loot', val: 0, price: 8, desc: 'Glühendes Seelenfragment.' }
};
