// App-Icon: Startbildschirm, Homescreen und Browser-Tab.
//
// Quelle ist assets/app-icon-artwork.png, aus der
// tools/app-icon.mjs alle Groessen erzeugt. Geprueft wird hier, dass die
// Dateien da sind, die richtigen Masse haben und im HTML auch verlinkt
// werden - ein nicht verlinktes Icon ist im Browser unsichtbar und faellt
// niemandem als Fehler auf.
//
// Der zweite Teil prueft das, was beim alten Masken-Icon schiefging: es war
// bei 16 px nur noch ein gruener Fleck. Ein Icon, das man im Browser-Tab
// nicht erkennt, ist kein Icon - und Marcels "das Logo ist haesslich" kam
// genau von dort.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, statSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// PNG-Kopf: Breite und Hoehe stehen als Big-Endian-UInt32 in IHDR (Bytes 16-24).
function pngMasse(datei) {
  const puffer = readFileSync(datei);
  assert.equal(puffer.subarray(1, 4).toString('ascii'), 'PNG', `${datei} ist kein PNG`);
  return {breite: puffer.readUInt32BE(16), hoehe: puffer.readUInt32BE(20)};
}

const ERWARTET = [
  {name: 'icon-192.png', kante: 192},
  {name: 'icon-512.png', kante: 512},
  {name: 'icon-512-maskable.png', kante: 512},
  {name: 'apple-touch-icon.png', kante: 180}
];

test('alle Icon-Dateien liegen in shell/ und im Wurzelverzeichnis', () => {
  const dateien = [...ERWARTET.map(e => e.name), 'favicon.ico', 'icon.svg', 'manifest.webmanifest'];
  for (const name of dateien) {
    for (const ordner of ['shell', '.']) {
      const pfad = join(ROOT, ordner, name);
      assert.ok(existsSync(pfad), `${ordner}/${name} fehlt - node tools/app-icon.mjs ausfuehren`);
    }
    // Die Kopien muessen identisch sein, sonst zeigt der eine Host etwas
    // anderes als der andere.
    assert.deepEqual(
      readFileSync(join(ROOT, name)),
      readFileSync(join(ROOT, 'shell', name)),
      `${name} unterscheidet sich zwischen shell/ und Wurzel`
    );
  }
});

test('die Groessen stimmen und bleiben klein', () => {
  for (const {name, kante} of ERWARTET) {
    const pfad = join(ROOT, name);
    const {breite, hoehe} = pngMasse(pfad);
    assert.equal(breite, kante, `${name}: Breite ${breite}`);
    assert.equal(hoehe, kante, `${name}: Hoehe ${hoehe}`);
    const kb = statSync(pfad).size / 1024;
    // 512er darf groesser sein, alles darunter nicht. Startbildschirme laden
    // das Icon beim Hinzufuegen, nicht bei jedem Start - trotzdem klein halten.
    const grenze = kante >= 512 ? 300 : 80;
    assert.ok(kb < grenze, `${name} ist ${kb.toFixed(1)} kB (Grenze ${grenze})`);
  }
});

test('das Favicon enthaelt mehrere Groessen', () => {
  const puffer = readFileSync(join(ROOT, 'favicon.ico'));
  assert.equal(puffer.readUInt16LE(2), 1, 'kein ICO-Kopf');
  const anzahl = puffer.readUInt16LE(4);
  assert.ok(anzahl >= 3, `nur ${anzahl} Groessen im ICO`);
  // Jeder Eintrag muss auf gueltige PNG-Daten zeigen - sonst zeigt der Tab
  // ein leeres Feld.
  for (let i = 0; i < anzahl; i++) {
    const eintrag = 6 + 16 * i;
    const groesse = puffer.readUInt32LE(eintrag + 8);
    const versatz = puffer.readUInt32LE(eintrag + 12);
    assert.ok(versatz + groesse <= puffer.length, `Eintrag ${i} zeigt ins Leere`);
    assert.equal(puffer.subarray(versatz + 1, versatz + 4).toString('ascii'), 'PNG',
      `Eintrag ${i} ist kein PNG`);
  }
});

test('das Manifest ist gueltig und nennt beide Icon-Arten', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.webmanifest'), 'utf8'));

  assert.equal(manifest.display, 'standalone', 'ohne standalone oeffnet es mit Adressleiste');
  assert.equal(manifest.start_url, './', 'start_url muss relativ bleiben (Pages und Vercel)');
  assert.ok(manifest.name && manifest.short_name, 'Name fehlt');
  assert.equal(manifest.theme_color, '#39ff14');

  const zwecke = manifest.icons.map(i => i.purpose);
  assert.ok(zwecke.includes('any'), 'kein Icon mit purpose "any"');
  assert.ok(zwecke.includes('maskable'), 'kein maskable Icon - Android beschneidet sonst hart');

  // Jede im Manifest genannte Datei muss es geben.
  const version = new URL(manifest.icons[0].src, 'https://example.test/').searchParams.get('v');
  assert.ok(version, 'Icon-Cachekennung fehlt');
  for (const icon of manifest.icons) {
    assert.equal(new URL(icon.src, 'https://example.test/').searchParams.get('v'), version);
    assert.ok(existsSync(join(ROOT, icon.src.split('?')[0])), `${icon.src} fehlt`);
    const {breite} = pngMasse(join(ROOT, icon.src.split('?')[0]));
    assert.equal(`${breite}x${breite}`, icon.sizes, `${icon.src}: Manifest sagt ${icon.sizes}`);
  }
});

test('das HTML verlinkt die Icons und die iOS-Angaben', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

  const erwartet = [
    /<link rel="apple-touch-icon" href="apple-touch-icon\.png\?v=[0-9.]+">/,
    /<link rel="manifest" href="manifest\.webmanifest\?v=[0-9.]+">/,
    /<link rel="icon" href="icon\.svg\?v=[0-9.]+" type="image\/svg\+xml">/,
    /<link rel="icon" href="favicon\.ico\?v=[0-9.]+"/,
    /<meta name="theme-color" content="#39ff14">/,
    /<meta name="apple-mobile-web-app-capable" content="yes">/,
    /<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">/,
    /<meta name="apple-mobile-web-app-title" content="Pip-Boy 3003">/
  ];
  for (const muster of erwartet) {
    assert.match(html, muster, `fehlt im HTML: ${muster}`);
  }

  // Die alten Emoji-Pfade muessen weg sein: das "P" als Text im SVG war ein
  // Platzhalter, kein Icon.
  assert.ok(!html.includes('data:image/svg+xml'),
    'das alte Inline-Favicon steht noch im HTML');
});

test('der Build liefert die Icons mit aus', () => {
  const build = readFileSync(join(ROOT, 'build.mjs'), 'utf8');
  // Ohne Kopie ins Wurzelverzeichnis fehlen die Dateien auf Pages, weil dort
  // nur dieser Ordner ausgeliefert wird.
  assert.match(build, /for \(const name of ICON_NAMEN\)/,
    'build.mjs kopiert die Icons nicht ins Wurzelverzeichnis');
  // Die Quellen in shell/ duerfen nicht als Artefakt geloescht werden. Der
  // Build hat sie sonst beim ersten Lauf mit entfernt.
  const abArtifacts = build.slice(build.indexOf('const ARTIFACTS'));
  const artifacts = abArtifacts.slice(0, abArtifacts.indexOf('];'));
  for (const name of ['icon-192.png', 'apple-touch-icon.png', 'manifest.webmanifest']) {
    assert.ok(!artifacts.includes(`'shell/${name}'`),
      `ARTIFACTS nennt shell/${name} - der Build wuerde seine eigene Quelle loeschen`);
  }
});

// Das neue Artwork muss in allen ausgelieferten Groessen wiederzufinden sein.
test('Artwork, App-Icon und SVG zeigen dasselbe Motiv', async () => {
  const {default: sharp} = await import('sharp');
  const source = await sharp(join(ROOT, 'assets/app-icon-artwork.png'))
    .extract({left: 72, top: 72, width: 880, height: 880})
    .resize(32, 32).removeAlpha().raw().toBuffer();
  const icon = await sharp(join(ROOT, 'icon-512.png'))
    .resize(32, 32).removeAlpha().raw().toBuffer();
  let fehler = 0;
  for (let i = 0; i < source.length; i++) fehler += Math.abs(source[i] - icon[i]);
  assert.ok(fehler / source.length < 12, 'Icon stimmt nicht mit dem Artwork ueberein');
  const svg = readFileSync(join(ROOT, 'icon.svg'), 'utf8');
  assert.match(svg, /data:image\/jpeg;base64,/);
});

test('maskable Icon ist deckend und hat einen sicheren Rand', async () => {
  const {default: sharp} = await import('sharp');
  const {data, info} = await sharp(join(ROOT, 'icon-512-maskable.png'))
    .ensureAlpha().raw().toBuffer({resolveWithObject: true});
  for (const [x, y] of [[0, 0], [511, 0], [0, 511], [511, 511], [256, 20]]) {
    const i = (y * info.width + x) * 4;
    assert.deepEqual([...data.subarray(i, i + 4)], [10, 23, 16, 255]);
  }
});
