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
      const erlaubt = new Set(['57,255,20', '234,179,8', '0,17,0', '0,0,0']);
      const fremd = [...farben.keys()].filter(f => !erlaubt.has(f));
      assert.equal(fremd.length, 0,
        `${kante}px: fremde Farben - das wird beim Verkleinern Matsch (${fremd.slice(0, 6).join(' | ')})`);
    } finally {
      unlinkSync(datei);
    }
  }
});

test('das Motiv ist bei 16 px noch der Kreisel, kein Fleck', async () => {
  // Der Kreisel hat drei Merkmale, und alle drei muessen bei 16 px messbar
  // sein. Ein gruener Punkt haette keines davon - das war der Fehler des
  // alten Masken-Icons.
  //  1. die Mitte ist hell (der Reaktorkern)
  //  2. zwischen Kern und Rand liegt Gelb (der gegenlaeufige Ring)
  //  3. oben und unten ist es gruen, links und rechts nicht (die Boegen,
  //     also die Luecken des Kreisels)
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
  const istGelb = ([r, g, b]) => r > 120 && g > 90 && b < 120;

  assert.equal(istGruen(pixel(mitte, mitte)), true, 'der Reaktorkern fehlt - die Mitte ist dunkel');

  // Gelb auf halbem Weg zwischen Kern und Rand, an einer Stelle ohne Bogen.
  let gelbGefunden = false;
  for (let d = 2; d <= mitte; d++) {
    if (istGelb(pixel(mitte, mitte - d)) || istGelb(pixel(mitte, mitte + d)) ||
        istGelb(pixel(mitte - d, mitte)) || istGelb(pixel(mitte + d, mitte))) {
      gelbGefunden = true;
      break;
    }
  }
  assert.equal(gelbGefunden, true, 'kein gelber Ring - das Motiv ist bei 16 px einfarbig');

  // Die Boegen oben und unten, die Luecken links und rechts. Genau das
  // unterscheidet den Kreisel von einem geschlossenen Ring.
  const rand = (x, y) => istGruen(pixel(x, y));
  const oben = [1, 2, 3].some(d => rand(mitte, d) || rand(mitte - 1, d) || rand(mitte + 1, d));
  const links = [1, 2, 3].some(d => rand(d, mitte) || rand(d, mitte - 1) || rand(d, mitte + 1));
  assert.equal(oben, true, 'oben ist kein Bogen - das Motiv ist bei 16 px leer');
  assert.equal(links, false, 'links ist zu - das ist ein geschlossener Ring, kein Kreisel');
});

test('die Vektorquelle beschreibt dieselben Maße wie das Werkzeug', async () => {
  // Zwei Beschreibungen desselben Motivs laufen auseinander, sobald eine
  // geaendert wird. Der Test haelt die Zahlen zusammen.
  const roh = readFileSync(join(ROOT, 'docs/muster/app-icon.svg'), 'utf8');
  // Kommentare raus: der Kopfkommentar nennt die Zweige beim Namen
  // (<g id="mittel">), und indexOf wuerde sonst den Kommentar finden statt
  // das Markup.
  const svg = roh.replace(/<!--[\s\S]*?-->/g, '');
  const werkzeug = readFileSync(join(ROOT, 'tools', 'app-icon.mjs'), 'utf8');

  const motiv = werkzeug.match(/const MOTIV = \{([\s\S]*?)\};/);
  assert.ok(motiv, 'MOTIV fehlt in tools/app-icon.mjs');
  const zahl = (name) => {
    const treffer = motiv[1].match(new RegExp(`${name}:\\s*([\\d.]+)`));
    assert.ok(treffer, `${name} fehlt in MOTIV`);
    return Number(treffer[1]);
  };

  // Die Bogenradien und -breiten stehen im mittleren Zweig der SVG, weil die
  // Pixelformel genau diese kraeftige Fassung nachzeichnet.
  const mittel = svg.slice(svg.indexOf('<g id="mittel">'));
  assert.ok(mittel.includes(`A${zahl('bogenR')} ${zahl('bogenR')}`),
    `Bogenradius r=${zahl('bogenR')} fehlt im mittleren Zweig`);
  assert.ok(mittel.includes(`stroke-width="${zahl('bogenBreite')}"`),
    `Bogenbreite ${zahl('bogenBreite')} fehlt im mittleren Zweig`);

  // Beide Boegen: oben und unten. Ein einzelner Bogen waere ein Kreis mit
  // einem Loch, kein Kreisel.
  const boegen = (mittel.match(/A[\d.]+ [\d.]+ 0 [01] 1/g) || []).length;
  assert.equal(boegen, 2, `${boegen} Boegen im mittleren Zweig - erwartet 2`);

  // Gelber Ring: Mitte und Breite muessen zusammenpassen.
  const mitteGelb = (zahl('gelbInnen') + zahl('gelbAussen')) / 2;
  const breiteGelb = zahl('gelbAussen') - zahl('gelbInnen');
  assert.ok(Math.abs(mitteGelb - 27) < 0.01 && Math.abs(breiteGelb - 8) < 0.01,
    `Gelb r=${mitteGelb} / Breite ${breiteGelb} - die SVG zeichnet r=27 mit Breite 8`);
  assert.ok(mittel.includes('stroke="#eab308"'), 'kein gelber Ring im mittleren Zweig');

  // Der Kern muss heller/groesser sein als nichts - sonst ist die Mitte leer.
  assert.ok(zahl('kern') > 8, `Kern r=${zahl('kern')} ist bei 16 px kein Punkt mehr`);

  // Beide Zweige (gross/mittel) muessen vorhanden sein - sonst rastert das
  // Werkzeug eine leere Datei.
  for (const zweig of ['gross', 'mittel']) {
    assert.ok(svg.includes(`<g id="${zweig}">`), `Zweig "${zweig}" fehlt in der SVG`);
  }
});
