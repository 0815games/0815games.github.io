// App-Icon: Startbildschirm, Homescreen und Browser-Tab.
//
// Quelle ist ein Rohbild (docs/muster/app-icon.png), aus dem
// tools/app-icon.mjs alle Groessen erzeugt. Geprueft wird hier, dass die
// Dateien da sind, die richtigen Masse haben und im HTML auch verlinkt
// werden - ein nicht verlinktes Icon ist im Browser unsichtbar und faellt
// niemandem als Fehler auf.
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
    const grenze = kante >= 512 ? 300 : 60;
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
  for (const icon of manifest.icons) {
    assert.ok(existsSync(join(ROOT, icon.src)), `${icon.src} fehlt`);
    const {breite} = pngMasse(join(ROOT, icon.src));
    assert.equal(`${breite}x${breite}`, icon.sizes, `${icon.src}: Manifest sagt ${icon.sizes}`);
  }
});

test('das HTML verlinkt die Icons und die iOS-Angaben', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

  const erwartet = [
    /<link rel="apple-touch-icon" href="apple-touch-icon\.png">/,
    /<link rel="manifest" href="manifest\.webmanifest">/,
    /<link rel="icon" href="icon\.svg" type="image\/svg\+xml">/,
    /<link rel="icon" href="favicon\.ico"/,
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
