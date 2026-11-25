// Item-Bilder im gerenderten DOM, nicht im Katalog.
//
// Der Bruch aus v14.0.9: docs/ITEMBILDER.md meldete 126 Bilder, alle Tests
// waren gruen, und im Rucksack stand trotzdem 💉. Ursache war eine einzelne
// Aufrufstelle - `UI.itemSymbol(itemDef.id, ...)` - und `Game.items` ist nach
// Schluessel organisiert, die Definitionen trugen kein id-Feld. itemSymbol
// bekam also undefined, fand kein Bild und zeigte das Typ-Emoji.
//
// Die Lehre steht in diesem Test: geprueft wird, was nach dem Rendern im DOM
// steht. Ein Katalogtest haette den Fehler nie gefunden.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadBundle} from './helpers/load-bundle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Ein Zustand, der alle drei Inventar-Kategorien und die Ausruestung fuellt.
function spielzustand(window) {
  return {
    inventory: [
      {id: 'stimpack', count: 7},
      {id: 'junk_metal', count: 3},
      {id: 'pipe_pistol', count: 1},
      {id: 'ammo', count: 30},
      {id: 'leather', count: 2}
    ],
    equip: {
      weapon: {id: 'pipe_pistol', name: 'Rohrpistole', type: 'weapon'},
      body: {id: 'vault_suit', name: 'Vault-Anzug', type: 'body'}
    },
    stats: {STR: 5}, caps: 100, perks: {}, rads: 0, camp: null,
    view: 'inventory', playerName: 'X', lvl: 1, xp: 0, hp: 100, maxHp: 100,
    statPoints: 0, perkPoints: 0, critChance: 5, kills: 0,
    knownRecipes: ['craft_ammo'], activeQuests: [], completedQuests: [], quests: [],
    worldPOIs: [], explored: {}, visitedSectors: [], zone: 'Ödland',
    shop: {stock: {}, merchantCaps: 500, nextRestock: 0}
  };
}

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

test('jede Inventarzelle zeigt ein Bild, kein Emoji', () => {
  const {window, dom} = loadBundle(join(ROOT, 'app.js'));
  const {document} = window;

  // Die Vorlage liegt normalerweise in templates/inventory.html und wird zur
  // Laufzeit geladen. Fuer den Test genuegt das Ziel, in das gerendert wird.
  const liste = document.createElement('div');
  liste.id = 'inventory-list';
  document.body.appendChild(liste);

  const {UI, Game} = window;
  Game.state = spielzustand(window);
  UI.renderInventory();

  const zellen = [...liste.querySelectorAll('div.h-16')];
  assert.equal(zellen.length, 7,
    `erwartet 7 Zellen (5 Rucksack + 2 ausgeruestet), gefunden ${zellen.length}`);

  for (const zelle of zellen) {
    const bild = zelle.querySelector('img');
    const name = zelle.textContent.trim().replace(/\s+/g, ' ');
    assert.ok(bild, `Zelle "${name}" hat kein <img> - wieder Emoji statt Bild`);

    // Relativer Pfad, damit GitHub Pages (/PipBoy3000/) und Vercel beide gehen.
    const src = bild.getAttribute('src');
    assert.match(src, /^img\/items\/[a-z0-9_]+\.png$/, `unbrauchbarer Pfad: ${src}`);
    assert.ok(!EMOJI.test(zelle.textContent.trim()),
      `Zelle "${name}" enthaelt noch ein Emoji: ${zelle.textContent.trim()}`);
  }

  dom.window.close();
});

test('das Inventar benutzt die ID aus dem Eintrag, nicht aus der Definition', () => {
  // Der eigentliche Fehler: Game.items ist nach Schluessel organisiert. Wer
  // itemDef.id liest, bekommt undefined - es sei denn, data_items.js traegt
  // die ID nach. Beides wird geprueft, damit keine der beiden Absicherungen
  // unbemerkt verschwindet.
  const {window, dom} = loadBundle(join(ROOT, 'app.js'));

  for (const [schluessel, def] of Object.entries(window.Game.items)) {
    assert.equal(def.id, schluessel,
      `${schluessel} traegt keine eigene ID - itemDef.id waere wieder undefined`);
  }

  // Und die Aufrufstelle darf sich nicht auf die Definition verlassen.
  const quelle = readFileSync(join(ROOT, 'src', 'ui', 'ui_view_inv.js'), 'utf8');
  assert.ok(!/itemBild\(itemDef\.id/.test(quelle),
    'ui_view_inv.js liest die Bild-ID wieder aus der Definition statt aus dem Eintrag');
  assert.ok(/itemBild\(itemDef, entry\)/.test(quelle),
    'der Inventaraufruf uebergibt den Eintrag nicht - dann fehlt die ID erneut');

  dom.window.close();
});

test('Charakterseite, Wiki und Lager zeigen ebenfalls Bilder', () => {
  const {window, dom} = loadBundle(join(ROOT, 'app.js'));
  const {document} = window;
  const {UI, Game} = window;

  Game.state = spielzustand(window);

  // Charakterseite: zwei angelegte Teile, zwei Bilder. Die leeren Slots
  // duerfen ein Typ-Emoji zeigen - dort gibt es kein Item und damit kein Bild.
  const charBox = document.createElement('div');
  document.body.appendChild(charBox);
  UI.renderCharacterVisuals(charBox);
  const charBilder = [...charBox.querySelectorAll('img')].map(i => i.getAttribute('src'));
  assert.ok(charBilder.includes('img/items/pipe_pistol.png'),
    `Charakterseite zeigt die Waffe nicht als Bild (${charBilder.join(', ') || 'keine'})`);
  assert.ok(charBilder.includes('img/items/vault_suit.png'),
    'Charakterseite zeigt die Ruestung nicht als Bild');

  // Lager: Schrankinhalt und Rucksackzeilen.
  Game.state.camp = {level: 1, storage: [{id: 'stimpack', count: 4}, {id: 'junk_metal', count: 9}]};
  const lager = document.createElement('div');
  lager.id = 'camp-storage-list';
  document.body.appendChild(lager);
  UI.renderCampStorage();
  const lagerBilder = [...lager.querySelectorAll('img')].map(i => i.getAttribute('src'));
  assert.ok(lagerBilder.includes('img/items/stimpack.png') && lagerBilder.includes('img/items/junk_metal.png'),
    `Lager zeigt keine Bilder (${lagerBilder.join(', ') || 'keine'})`);

  // Wiki-Items: der Katalog hat 126 Eintraege, also mindestens so viele Bilder.
  const wiki = document.createElement('div');
  wiki.id = 'wiki-content';
  document.body.appendChild(wiki);
  UI.switchView = async () => {};   // Wiki braucht die Vorlage nicht
  UI.renderWiki('items');
  const wikiBilder = wiki.querySelectorAll('img').length;
  assert.equal(wikiBilder, Object.keys(Game.items).length,
    `Wiki zeigt ${wikiBilder} Bilder fuer ${Object.keys(Game.items).length} Items`);

  dom.window.close();
});

test('keine Ansicht bringt eine eigene Emoji-Tabelle mit', () => {
  // Zweiter Teil derselben Lehre: solange eine Ansicht ihre eigene Tabelle
  // hat, laeuft sie beim naechsten Umbau wieder aus dem Ruder. Die Tabelle
  // steht in ui_item_symbol.js, alles andere ruft sie auf.
  const dateien = ['src/ui/ui_view_inv.js', 'src/ui/ui_view_town.js',
                   'src/ui/ui_view_journal.js', 'src/ui/ui_render_views.js',
                   'src/ui/ui_render_overlays.js'];
  for (const datei of dateien) {
    const quelle = readFileSync(join(ROOT, datei), 'utf8');
    const tabellen = [...quelle.matchAll(/case 'weapon':\s*return\s*'🔫'|'weapon':\s*'🔫'/g)];
    assert.equal(tabellen.length, 0,
      `${datei} bringt eine eigene Emoji-Tabelle mit statt UI.itemTypEmoji`);
  }
});

// [2026-11-24] Der Fehler war nicht "Bild fehlt", sondern "falsche ID". Wird
// irgendwo wieder eine Katalogdefinition statt eines Inventareintrags an
// itemSymbol gereicht, faellt das hier auf: die ID muss im Katalog existieren.
test('itemSymbol bekommt nur IDs, die es im Katalog gibt', () => {
  const {window, dom} = loadBundle(join(ROOT, 'app.js'));
  const {Game, UI} = window;

  const aufrufe = [];
  const original = UI.itemSymbol;
  UI.itemSymbol = function (id, type, groesse) {
    aufrufe.push(id);
    return original.call(this, id, type, groesse);
  };

  Game.state = spielzustand(window);
  const liste = window.document.createElement('div');
  liste.id = 'inventory-list';
  window.document.body.appendChild(liste);
  UI.renderInventory();

  assert.ok(aufrufe.length >= 7, `nur ${aufrufe.length} Symbolaufrufe im Inventar`);
  const unbekannt = aufrufe.filter(id => id !== null && !(id in Game.items));
  assert.deepEqual(unbekannt, [],
    `itemSymbol bekam unbekannte IDs (undefined faellt nicht auf): ${unbekannt.join(', ')}`);
  assert.ok(aufrufe.every(id => id !== undefined && id !== null),
    'itemSymbol bekam undefined - dann greift nur noch das Emoji');

  dom.window.close();
});
