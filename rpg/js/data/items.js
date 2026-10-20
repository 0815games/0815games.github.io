// [2026-10-14] - js/data/items.js: v0.2.0 Kategorie, Symbol und Stapellimit
export const ITEMS = {
  health_potion: { name: 'Rubinroter Heiltrank', type: 'potion', category: 'Verbrauch', icon: '🧪', effect: 'hp', val: 35, price: 25, stack: 9, desc: 'Heilt 35 Lebenspunkte.' },
  mana_potion: { name: 'Saphirblauer Manatrank', type: 'potion', category: 'Verbrauch', icon: '🔮', effect: 'mp', val: 25, price: 30, stack: 9, desc: 'Stellt 25 Mana wieder her.' },
  iron_sword: { name: 'Geschmiedetes Langschwert', type: 'weapon', category: 'Waffe', icon: '🗡️', slot: 'mainhand', val: 9, price: 50, stack: 1, desc: '+9 Schlagkraft (Haupthand).' },
  runic_blade: { name: 'Runenklinge des Lichts', type: 'weapon', category: 'Waffe', icon: '⚔️', slot: 'mainhand', val: 18, price: 130, stack: 1, desc: '+18 Schlagkraft (Haupthand).' },
  dagger: { name: 'Katakomben-Dolch', type: 'weapon', category: 'Waffe', icon: '🔪', slot: 'mainhand', val: 5, price: 20, stack: 1, desc: '+5 Schlagkraft (Haupthand).' },
  chainmail: { name: 'Geschwärztes Kettenhemd', type: 'armor', category: 'Rüstung', icon: '🛡️', slot: 'body', val: 5, price: 45, stack: 1, desc: '+5 Schutz (Brust).' },
  knight_armor: { name: 'Ritterharnisch', type: 'armor', category: 'Rüstung', icon: '🪖', slot: 'body', val: 11, price: 115, stack: 1, desc: '+11 Schutz (Brust).' },
  iron_shield: { name: 'Eisenschild des Wächters', type: 'shield', category: 'Rüstung', icon: '🛡️', slot: 'offhand', val: 4, price: 40, stack: 1, desc: '+4 Schutz (Nebenhand).' },
  iron_helmet: { name: 'Eisenhelm der Wache', type: 'helmet', category: 'Rüstung', icon: '⛑️', slot: 'head', val: 3, price: 35, stack: 1, desc: '+3 Schutz (Kopf).' },
  leather_boots: { name: 'Feste Lederstiefel', type: 'boots', category: 'Rüstung', icon: '🥾', slot: 'feet', val: 2, price: 25, stack: 1, desc: '+2 Schutz (Füße).' },
  ruby_ring: { name: 'Rubinring des Ordens', type: 'ring', category: 'Reliquie', icon: '💍', slot: 'ring', val: 5, stat: 'atk', price: 60, stack: 1, desc: '+5 Schlagkraft (Reliquie).' },
  soul_shard: { name: 'Schattensplitter', type: 'loot', category: 'Material', icon: '💎', val: 0, price: 8, stack: 99, desc: 'Glühendes Seelenfragment.' }
};

// Einheitliche Grundausrüstung: Anforderungen v0.6.2
// Bestehende IDs und Kampfwerte bleiben erhalten.
const BASE_REQUIREMENTS = {
 iron_sword:{minLevel:3},
 runic_blade:{minLevel:5},
 dagger:{minLevel:1},
 chainmail:{minLevel:1},
 knight_armor:{minLevel:5},
 iron_shield:{minLevel:1},
 iron_helmet:{minLevel:1},
 leather_boots:{minLevel:1},
 ruby_ring:{minLevel:3}
};
for(const [id,requirements] of Object.entries(BASE_REQUIREMENTS)){
 if(ITEMS[id])Object.assign(ITEMS[id],requirements);
}
