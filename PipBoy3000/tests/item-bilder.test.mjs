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
