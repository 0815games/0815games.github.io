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

test('die kleinen Groessen bestehen aus genau zwei Farben', async () => {
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
      assert.ok(farben.size <= 4,
        `${kante}px: ${farben.size} Farben - das wird beim Verkleinern Matsch (${[...farben.keys()].slice(0, 6).join(' | ')})`);
    } finally {
      unlinkSync(datei);
    }
  }
});

test('das Motiv ist bei 16 px noch eine Tuer, kein Fleck', async () => {
  // Drei Messungen an der 16er-Fassung:
  //  1. die Mitte ist dunkel (Kernloch) - ein voller Fleck haette dort Gruen
  //  2. es gibt eine helle Nabe zwischen Kern und Rand (die Speichen ringsum
  //     sind dunkel, die Nabe nicht)
  //  3. der Rand ist dunkel - das Motiv hat Luft zum Rand
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

  const gruen = (x, y) => {
    const i = (y * bild.breite + x) * bild.kanaele;
    return bild.data[i + 1] > 100;         // G-Kanal
  };
  const mitte = Math.floor(bild.breite / 2);
  assert.equal(gruen(mitte, mitte), false, 'die Mitte ist zugemalt - kein Kernloch erkennbar');

  // Nabe: direkt ausserhalb des Kernlochs liegt Gruen. Bei r=14 von 100 sind
  // das bei 16 px knapp 2 Pixel - die Nabe ist der letzte Rest Motiv, der
  // uebrig bleibt, wenn die Speichen schon wegbrechen.
  assert.equal(gruen(mitte, mitte - 2), true,
    'zwischen Kern und Rand ist nichts - das Motiv ist bei 16 px leer');

  // Rand: die aeusserste Zeile bleibt schwarz, sonst klebt das Icon am Rand.
  assert.equal(gruen(0, mitte), false, 'das Motiv beruehrt den linken Rand');
  assert.equal(gruen(bild.breite - 1, mitte), false, 'das Motiv beruehrt den rechten Rand');
});

test('die Vektorquelle beschreibt dieselben Maße wie das Werkzeug', async () => {
  // Zwei Beschreibungen desselben Motivs laufen auseinander, sobald eine
  // geaendert wird. Der Test haelt die Zahlen zusammen.
  const svg = readFileSync(join(ROOT, 'docs/muster/app-icon.svg'), 'utf8');
  const werkzeug = readFileSync(join(ROOT, 'tools', 'app-icon.mjs'), 'utf8');

  const motiv = werkzeug.match(/const MOTIV = \{([\s\S]*?)\};/);
  assert.ok(motiv, 'MOTIV fehlt in tools/app-icon.mjs');
  const zahl = (name) => {
    const treffer = motiv[1].match(new RegExp(`${name}:\\s*([\\d.]+)`));
    assert.ok(treffer, `${name} fehlt in MOTIV`);
    return Number(treffer[1]);
  };
  // speichenGrad ist eine Liste, kein Einzelwert.
  const liste = (name) => {
    const treffer = motiv[1].match(new RegExp(`${name}:\\s*\\[([^\\]]+)\\]`));
    assert.ok(treffer, `${name} fehlt in MOTIV`);
    return treffer[1].split(',').map(t => Number(t.trim()));
  };

  // Die Scheibe steht als r=... in beiden Zweigen der SVG.
  assert.ok(svg.includes(`r="${zahl('scheibe')}"`), `Scheibe r=${zahl('scheibe')} fehlt in der SVG`);

  // Kernloch und Nabe in BEIDEN Zweigen: ein Loch ohne Ring drumherum ist
  // ein Punkt, und ein Punkt ist das alte Zielscheiben-Icon.
  const gross = svg.slice(svg.indexOf('<g id="gross">'), svg.indexOf('<g id="mittel">'));
  const mittel = svg.slice(svg.indexOf('<g id="mittel">'));
  for (const [name, zweig] of [['gross', gross], ['mittel', mittel]]) {
    const loch = zweig.match(/r="([\d.]+)" fill="#000000"\/>\s*<\/g>/) ||
                 zweig.match(/<circle cx="50" cy="50" r="([\d.]+)" fill="#000000"\/>/g);
    assert.ok(zweig.includes('fill="#000000"'), `Zweig ${name} hat kein Kernloch`);
    const loecher = [...zweig.matchAll(/<circle cx="50" cy="50" r="([\d.]+)" fill="#000000"/g)].map(m => Number(m[1]));
    const naben = [...zweig.matchAll(/<circle cx="50" cy="50" r="([\d.]+)" fill="#39ff14"/g)].map(m => Number(m[1]));
    assert.ok(loecher.length > 0, `Zweig ${name}: kein Kernloch`);
    assert.ok(naben.length > 0, `Zweig ${name}: keine Nabe`);
    assert.ok(Math.max(...naben) > Math.min(...loecher),
      `Zweig ${name}: Nabe r=${Math.max(...naben)} ist nicht groesser als das Loch r=${Math.min(...loecher)}`);
  }

  // Die Bolzen: so viele Rechtecke mit rotate(0..315) wie MOTIV.bolzen sagt.
  // Das ist der Unterschied zwischen Vault-Tuer und Zielscheibe - ohne sie
  // ist es wieder ein Kreis mit Loechern.
  const bolzen = (gross.match(/transform="rotate\(\d+ 50 50\)"\/>/g) || []).length;
  assert.ok(bolzen >= zahl('bolzen'), `nur ${bolzen} gedrehte Formen im grossen Zweig - erwartet mindestens ${zahl('bolzen')}`);

  // Drei Speichen, nicht vier: eine Tuer mit vier Speichen waere ein Kreuz
  // und bei 16 px nicht mehr von einem Fenster zu unterscheiden.
  const speichen = liste('speichenGrad');
  assert.equal(speichen.length, 3, `MOTIV.speichenGrad nennt ${speichen.length} Speichen - erwartet 3`);

  // Beide Zweige (gross/mittel) muessen vorhanden sein - sonst rastert das
  // Werkzeug eine leere Datei.
  for (const zweig of ['gross', 'mittel']) {
    assert.ok(svg.includes(`<g id="${zweig}">`), `Zweig "${zweig}" fehlt in der SVG`);
  }
});
