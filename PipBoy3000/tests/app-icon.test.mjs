// App-Icon: Startbildschirm, Homescreen und Browser-Tab.
//
// Quelle ist die Vektordatei docs/muster/app-icon.svg, aus der
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

// --- Erkennbarkeit in kleiner Groesse ------------------------------------
// Das alte Icon war bei 16 px ein gruener Fleck: duenne Striche, ein
// Strahlensymbol in der Mitte, ein Filter, der zu einem Kuchen verschmolz.
// Ein Icon muss im Browser-Tab erkennbar sein - dort ist es 16 px gross.
// Diese drei Tests pruefen deshalb die kleinen Groessen, nicht die grossen.

// Liest ein PNG ueber sharp als rohe RGB-Werte. sharp wird nur hier geladen,
// damit die uebrigen Tests auch ohne native Abhaengigkeit laufen.
async function roh(datei) {
  const {default: sharp} = await import('sharp');
  const {data, info} = await sharp(readFileSync(datei)).raw().toBuffer({resolveWithObject: true});
  return {data, breite: info.width, hoehe: info.height, kanaele: info.channels};
}

// Zaehlt die Farben. Erlaubt sind genau zwei: Leuchtgruen und Schwarz.
function farbzahlen({data, kanaele}) {
  const gesehen = new Map();
  for (let i = 0; i < data.length; i += kanaele) {
    const schluessel = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    gesehen.set(schluessel, (gesehen.get(schluessel) || 0) + 1);
  }
  return gesehen;
}

test('die kleinen Groessen bestehen nur aus den Farben des Motivs', async () => {
  // 16 und 32 px liegen im ICO, das der Browser-Tab benutzt. Wird dort
  // weichgezeichnet, entstehen hunderte Zwischentoene - und das Motiv
  // verschwindet in Grau. Deshalb: nur #39ff14 und #000000.
  const puffer = readFileSync(join(ROOT, 'favicon.ico'));
  const anzahl = puffer.readUInt16LE(4);
  assert.ok(anzahl >= 3, `nur ${anzahl} Groessen im ICO`);

  for (let i = 0; i < anzahl; i++) {
    const eintrag = 6 + 16 * i;
    const laenge = puffer.readUInt32LE(eintrag + 8);
    const versatz = puffer.readUInt32LE(eintrag + 12);
    const kante = puffer.readUInt8(eintrag);
    const datei = join(ROOT, 'shell', `.ico-pruefung-${kante}.png`);
    // Das PNG aus dem ICO muss ueber sharp lesbar sein; dazu kurz ablegen.
    const {writeFileSync, unlinkSync} = await import('node:fs');
    writeFileSync(datei, puffer.subarray(versatz, versatz + laenge));
    try {
      const farben = farbzahlen(await roh(datei));
      // Das Motiv hat vier Farben: Leuchtgruen, Gelb, das dunkle Gruen der
      // Scheibe und Schwarz. Mehr heisst weichgezeichnet und damit Matsch.
      const erlaubt = new Set(['57,255,20', '234,179,8', '5,15,5', '10,42,10', '0,0,0']);
      const fremd = [...farben.keys()].filter(f => !erlaubt.has(f));
      assert.equal(fremd.length, 0,
        `${kante}px: fremde Farben - das wird beim Verkleinern Matsch (${fremd.slice(0, 6).join(' | ')})`);
    } finally {
      unlinkSync(datei);
    }
  }
});

test('das Motiv ist bei 16 px noch eine Vault-Tuer, kein Fleck', async () => {
  // Drei Merkmale, alle drei muessen bei 16 px messbar sein:
  //  1. in der Mitte liegt ein heller Fleck (das Messingschild)
  //  2. es gibt einen dunklen Ring darum (der Kranz)
  //  3. aussen stehen Zacken ueber den Korpus hinaus (die Zaehne)
  // Die 33 selbst ist bei 16 px nicht lesbar - deshalb prueft der Test die
  // Messingflaeche, nicht die Ziffern.
  const puffer = readFileSync(join(ROOT, 'favicon.ico'));
  const eintrag = 6;                       // erster Eintrag = 16 px
  const laenge = puffer.readUInt32LE(eintrag + 8);
  const versatz = puffer.readUInt32LE(eintrag + 12);
  const {writeFileSync} = await import('node:fs');
  const datei = join(ROOT, 'shell', '.ico-16.png');
  writeFileSync(datei, puffer.subarray(versatz, versatz + laenge));
  const bild = await roh(datei);
  const {unlinkSync} = await import('node:fs');
  unlinkSync(datei);

  const pixel = (x, y) => {
    const i = (y * bild.breite + x) * bild.kanaele;
    return [bild.data[i], bild.data[i + 1], bild.data[i + 2]];
  };
  const mitte = Math.floor(bild.breite / 2);
  const istGruen = ([r, g, b]) => g > 120 && r < 120;
  const istMessing = ([r, g, b]) => r > 120 && g > 90 && b < 120;
  const istDunkel = ([r, g, b]) => r < 60 && g < 70 && b < 60;

  // 1) Messingschild in der Mitte
  assert.equal(istMessing(pixel(mitte, mitte)) || istMessing(pixel(mitte, mitte - 1)),
    true, 'kein Messingschild in der Mitte');

  // 2) dunkler Kranz zwischen Schild und Korpusrand
  let kranz = false;
  for (let d = 3; d <= mitte - 1; d++) {
    if (istDunkel(pixel(mitte, mitte - d))) { kranz = true; break; }
  }
  assert.equal(kranz, true, 'kein dunkler Kranz - das Motiv ist einfarbig');

  // 3) Zaehne: an der Kante des Korpus, aber ausserhalb der Zahnluecken,
  //    muss Gruen ueber den Korpus hinausragen. Ein geschlossener Kreis
  //    haette bei 16 px eine glatte Aussenkante.
  const aussen = [];
  for (let y = 0; y < bild.hoehe; y++) {
    for (let x = 0; x < bild.breite; x++) {
      const r = Math.hypot(x + 0.5 - mitte, y + 0.5 - mitte) / (bild.breite / 100);
      if (r > 36 && r < 49 && istGruen(pixel(x, y))) aussen.push(1);
    }
  }
  assert.ok(aussen.length >= 8, `nur ${aussen.length} gruene Pixel im Zahnkranz - die Zaehne fehlen`);
});

test('die Vektorquelle beschreibt dieselben Maße wie das Werkzeug', async () => {
  // Zwei Beschreibungen desselben Motivs laufen auseinander, sobald eine
  // geaendert wird. Der Test haelt die Zahlen zusammen.
  const roh = readFileSync(join(ROOT, 'docs/muster/app-icon.svg'), 'utf8');
  const svg = roh.replace(/<!--[\s\S]*?-->/g, '');
  const werkzeug = readFileSync(join(ROOT, 'tools', 'app-icon.mjs'), 'utf8');

  const motiv = werkzeug.match(/const MOTIV = \{([\s\S]*?)\};/);
  assert.ok(motiv, 'MOTIV fehlt in tools/app-icon.mjs');
  const zahl = (name) => {
    const treffer = motiv[1].match(new RegExp(`${name}:\\s*([\\d.]+)`));
    assert.ok(treffer, `${name} fehlt in MOTIV`);
    return Number(treffer[1]);
  };

  const mittel = svg.slice(svg.indexOf('<g id="mittel">'));

  // Zahnkranz: die Zaehne sind Trapeze, keine Rechtecke. Ein Rechteck haette
  // vier gerade Kanten und damit keine Zacken.
  const zahnPfade = (mittel.match(/<path d="M[^"]*Z"\/>/g) || []);
  assert.equal(zahnPfade.length, 8, `${zahnPfade.length} Zahn-Pfade - erwartet 8`);
  for (const p of zahnPfade) {
    assert.equal((p.match(/L/g) || []).length, 3, 'ein Zahn hat keine vier Ecken');
  }

  // Acht Speichen im Kranz
  const speichen = (mittel.match(/<rect [^>]*transform="rotate/g) || []).length;
  assert.equal(speichen, zahl('speichen'), `${speichen} Speichen - MOTIV sagt ${zahl('speichen')}`);

  // Messingschild und dunkler Kranz
  assert.ok(mittel.includes(`r="${zahl('rMitte')}" fill="#eab308"`),
    `Messingschild r=${zahl('rMitte')} fehlt`);
  assert.ok(mittel.includes(`r="${zahl('rRing')}" fill="none" stroke="#050f05"`),
    `dunkler Kranz r=${zahl('rRing')} fehlt`);

  // Die grosse Fassung traegt die Nummer 33, die kleine nicht - bei 16 px
  // waeren das vier Pixel.
  const gross = svg.slice(svg.indexOf('<g id="gross">'), svg.indexOf('<g id="mittel">'));
  assert.match(gross, />33</, 'die grosse Fassung traegt die Nummer 33 nicht');
  assert.doesNotMatch(mittel, />33</, 'die kleine Fassung traegt die Nummer 33 - bei 16 px ist das ein Fleck');

  for (const zweig of ['gross', 'mittel']) {
    assert.ok(svg.includes(`<g id="${zweig}">`), `Zweig "${zweig}" fehlt in der SVG`);
  }
});
