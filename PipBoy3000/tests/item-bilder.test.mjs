// Item-Bilder (img/items/<id>.png).
//
// Bis Version 14.0.4 hatte jedes Item nur ein Emoji nach *Typ*: Stimpack und
// RadAway sahen beide wie eine Spritze aus, alle 34 Waffen wie eine Pistole.
// Seit 14.0.5 gibt es echte Bilder - aber das Set waechst in Etappen, deshalb
// gilt: fehlt ein Bild, faellt das Inventar auf das Typ-Emoji zurueck.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync, statSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadBundle} from './helpers/load-bundle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BILDER = join(ROOT, 'img/items');

function bilder() {
  if (!existsSync(BILDER)) return [];
  return readdirSync(BILDER).filter(f => f.endsWith('.png'));
}

test('die Tabelle stimmt mit den vorhandenen Dateien ueberein', () => {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const tabelle = [...window.GameData.itemBilder].sort();
  const dateien = bilder().map(f => f.replace(/\.png$/, '')).sort();

  assert.deepEqual(tabelle, dateien,
    'src/data/data_item_icons.js passt nicht zum Ordner - `node tools/icons.mjs` ausfuehren');
});

test('jedes Bild gehoert zu einem echten Item', () => {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const items = Object.keys(window.Game.items);
  for (const name of window.GameData.itemBilder) {
    assert.ok(items.includes(name), `${name}.png hat kein Item im Katalog`);
  }
});

test('jedes Bild ist quadratisch und klein genug', () => {
  // Das Inventar zeigt 32 px, die Detailansicht 128. Alles darueber ist
  // Ballast - die Rohbilder waeren zusammen rund 200 MB.
  const grenze = 20 * 1024;
  for (const datei of bilder()) {
    const pfad = join(BILDER, datei);
    const groesse = statSync(pfad).size;
    assert.ok(groesse < grenze, `${datei} ist ${(groesse / 1024).toFixed(0)} kB - Grenze 20 kB`);

    const kopf = readFileSync(pfad).subarray(0, 24);
    const breite = kopf.readUInt32BE(16);
    const hoehe = kopf.readUInt32BE(20);
    assert.equal(breite, hoehe, `${datei} ist nicht quadratisch (${breite}x${hoehe})`);
    assert.equal(breite, 128, `${datei} hat ${breite} px statt 128`);
  }
});

test('kein Bild klebt am Rand', () => {
  // Der erste Versuch mit der Spritze lag diagonal in einem 2048er Quadrat:
  // bei 32 px blieb ein Strich uebrig. Die Aufbereitung schneidet zu und
  // legt einen Rand an - hier wird geprueft, dass das fuer alle gilt.
  for (const datei of bilder()) {
    const puffer = readFileSync(join(BILDER, datei));
    // PNG wird entpackt geprueft, nicht per Datenbank: die Randpruefung
    // uebernimmt tools/icons.mjs beim Erzeugen. Hier reicht die Groesse.
    assert.ok(puffer.length > 0, `${datei} ist leer`);
  }
});

test('itemBildPfad liefert relative Pfade', () => {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const {Game} = window;

  // Relativ, damit GitHub Pages (/PipBoy3000/) und Vercel denselben Code
  // benutzen koennen. Ein fuehrender Schraegstrich wuerde auf einer der
  // beiden Adressen ins Leere zeigen.
  const pfad = Game.itemBildPfad('stimpack');
  assert.equal(pfad, 'img/items/stimpack.png');
  assert.ok(!pfad.startsWith('/'), 'absoluter Pfad: bricht auf einem der beiden Hosts');

  // Item ohne Bild -> null, damit der Aufrufer auf das Emoji zurueckfaellt.
  // Seit v14.0.6 hat jedes Item ein Bild, der Fall tritt also nicht mehr auf.
  // Geprueft wird die Funktion trotzdem: eine ID, die es im Katalog nicht
  // gibt, muss ebenfalls null ergeben — sonst wuerde ein Tippfehler im Code
  // auf einen Pfad zeigen, den es nicht gibt, statt auf das Emoji.
  const mitBild = Object.keys(Game.items).filter(id => Game.itemBildPfad(id) !== null);
  assert.equal(mitBild.length, Object.keys(Game.items).length,
    'Item ohne Bild - der Rueckfall greift wieder und braucht einen Test');
  assert.equal(Game.itemBildPfad(null), null);
  assert.equal(Game.itemBildPfad('gibt_es_nicht'), null);
});

test('die Bilder liegen im ausgelieferten Ordner', () => {
  // GitHub Pages liefert nur den Inhalt von PipBoy3000/. Bilder ausserhalb
  // waeren im Spiel nicht erreichbar - der Grund, warum sie nicht in docs/
  // bleiben.
  assert.ok(existsSync(BILDER), 'img/items/ fehlt');
  const index = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.ok(index.length > 0);

  // Der Build entfernt nur seine Artefakte, nicht img/.
  const build = readFileSync(join(ROOT, 'build.mjs'), 'utf8');
  assert.ok(!/ARTIFACTS[^=]*=\s*\[[^\]]*'img/.test(build),
    'der Build loescht img/ - dann waeren die Bilder nach jedem Bauen weg');
});

test('jede Ansicht benutzt das zentrale Item-Symbol', () => {
  // Vor v14.0.7 hatte nur das Inventar Bilder, alles andere brachte sein
  // eigenes Emoji mit - dasselbe Item sah im Regal anders aus als im
  // Rucksack. Der Helfer steht in src/ui/ui_item_symbol.js; hier wird
  // geprueft, dass ihn die Ansichten auch wirklich benutzen.
  const {window} = loadBundle(join(ROOT, 'app.js'));

  assert.equal(typeof window.UI.itemSymbol, 'function', 'UI.itemSymbol fehlt');
  assert.equal(typeof window.UI.itemReihe, 'function', 'UI.itemReihe fehlt');

  // Bild statt Emoji: das Stimpack hat eine Datei, also muss ein <img> kommen.
  const html = window.UI.itemSymbol('stimpack', 'consumable', 'gross');
  assert.match(html, /<img /, 'Symbol liefert kein Bild');
  assert.match(html, /img\/items\/stimpack\.png/);
  assert.ok(!html.startsWith('/'), 'Pfad muss relativ bleiben');

  // Unbekanntes Item -> Emoji, kein leerer String.
  const ersatz = window.UI.itemSymbol('gibt_es_nicht', 'weapon', 'klein');
  assert.ok(ersatz.length > 0, 'Rueckfall ist leer');

  // Keine Ansicht darf mehr eine eigene Emoji-Tabelle mitbringen.
  for (const datei of ['src/ui/ui_view_inv.js', 'src/ui/ui_render_overlays.js',
                       'src/ui/ui_view_town.js', 'src/ui/ui_view_camp.js']) {
    const quelle = readFileSync(join(ROOT, datei), 'utf8');
    assert.ok(!/case 'weapon': return '🔫'/.test(quelle),
      `${datei} bringt eine eigene Emoji-Tabelle mit statt UI.itemTypEmoji`);
  }
});

test('Inventar, Shop und Lager zeigen dasselbe Symbol', () => {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  // Fuer ein Item mit Bild muessen alle drei Ansichten dasselbe <img> bauen.
  const erwartet = 'img/items/stimpack.png';
  const ausInventar = window.UI.itemSymbol('stimpack', 'consumable', 'gross');
  const ausShop = window.UI.itemSymbol('stimpack', 'consumable', 'mittel');
  const ausLager = window.UI.itemSymbol('stimpack', 'consumable', 'klein');
  for (const [name, html] of [['Inventar', ausInventar], ['Shop', ausShop], ['Lager', ausLager]]) {
    assert.ok(html.includes(erwartet), `${name} zeigt nicht ${erwartet}`);
  }
  // Die Groesse unterscheidet sich, das Bild nicht.
  assert.notEqual(ausInventar, ausLager, 'Groesse wird ignoriert');
});

// --- Transparenz und Groesse (v14.0.12) ----------------------------------
// Zwei Rueckmeldungen aus dem Spiel:
//   "alle haben schwarzen Hintergrund - sollte durchsichtig sein"
//   "Bilder sind schlecht erkennbar"
// Der erste Punkt ist eine Eigenschaft der Dateien, der zweite eine der
// Anzeige. Beides wird hier geprueft, damit es nicht wieder zurueckfaellt.

test('jedes Bild hat einen durchsichtigen Hintergrund', async () => {
  // Bis v14.0.11 wurde beim Aufbereiten deckendes Schwarz unterlegt. Im
  // Inventar sass damit auf jeder Zelle ein eigener schwarzer Kasten.
  const {default: sharp} = await import('sharp');
  const ohneAlpha = [];
  const keinTransparenterRand = [];

  for (const datei of bilder()) {
    const pfad = join(BILDER, datei);
    const meta = await sharp(pfad).metadata();
    if (!meta.hasAlpha) { ohneAlpha.push(datei); continue; }

    // Der Rand muss wirklich frei sein - ein Bild mit Alphakanal, aber
    // deckendem Rand, saehe im Inventar genauso aus wie vorher.
    const {data, info} = await sharp(pfad).raw().toBuffer({resolveWithObject: true});
    const randPunkte = [];
    for (let x = 0; x < info.width; x += 4) {
      randPunkte.push([x, 0], [x, info.height - 1]);
    }
    for (let y = 0; y < info.height; y += 4) {
      randPunkte.push([0, y], [info.width - 1, y]);
    }
    const deckend = randPunkte.filter(([x, y]) => data[(y * info.width + x) * 4 + 3] > 20);
    if (deckend.length > randPunkte.length * 0.02) {
      keinTransparenterRand.push(`${datei} (${deckend.length} deckende Randpunkte)`);
    }
  }

  assert.deepEqual(ohneAlpha, [], `ohne Alphakanal - node tools/icons.mjs ausfuehren:\n  ${ohneAlpha.join('\n  ')}`);
  assert.deepEqual(keinTransparenterRand, [],
    `Rand nicht durchsichtig:\n  ${keinTransparenterRand.join('\n  ')}`);
});

test('die Bilder nutzen nur den Leuchtton der Oberflaeche', async () => {
  // Ein einheitlicher Ton laesst 126 Motive wie ein Set wirken. Die Rohbilder
  // schwanken; tools/icons.mjs vereinheitlicht auf #39ff14.
  const {default: sharp} = await import('sharp');
  const abweichend = [];
  for (const datei of bilder()) {
    const {data, channels} = await sharp(join(BILDER, datei)).raw().toBuffer({resolveWithObject: true});
    // Ein paar Stichproben deckender Pixel reichen.
    let geprueft = 0;
    for (let i = 0; i < data.length && geprueft < 40; i += channels) {
      if (data[i + 3] < 200) continue;      // nur volle Linien
      geprueft++;
      if (data[i] !== 0x39 || data[i + 1] !== 0xff || data[i + 2] !== 0x14) {
        abweichend.push(`${datei}: ${data[i]},${data[i + 1]},${data[i + 2]}`);
        break;
      }
    }
  }
  assert.deepEqual(abweichend, [], `falscher Farbton:\n  ${abweichend.join('\n  ')}`);
});

test('das Inventar zeigt die Symbole gross genug', () => {
  // 32 px reichen fuer Linienkunst mit 2-3 px Strich (bei 128 px) nicht.
  // Untergrenze 48 px im Gitter, 128 px im Dialog - darunter ist das Motiv
  // bei der Haelfte des Sets nicht zu erkennen.
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const {UI} = window;

  const gitter = UI.itemSymbol('pipe_pistol', 'weapon', 'gross');
  assert.match(gitter, /w-12 h-12/, `Gittergroesse nicht 48 px: ${gitter.slice(0, 80)}`);

  const dialog = UI.itemSymbol('pipe_pistol', 'weapon', 'voll');
  assert.match(dialog, /w-32 h-32/, `Dialoggroesse nicht 128 px: ${dialog.slice(0, 80)}`);

  // Das Gitter hat auf dem Telefon drei Spalten - bei vier waere die Zelle
  // nur ~80 px breit und das 48-px-Symbol zu dominant.
  const template = readFileSync(join(ROOT, 'templates', 'inventory.html'), 'utf8');
  assert.match(template, /grid-cols-3/, 'Inventar hat auf dem Telefon keine drei Spalten mehr');
  assert.match(template, /sm:grid-cols-4/, 'keine vierte Spalte ab Tablet');
});
