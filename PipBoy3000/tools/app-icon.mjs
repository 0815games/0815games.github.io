// App-Icon fuer Startbildschirm, Homescreen und Browser-Tab.
//
// QUELLE IST DIE VEKTORDATEI docs/muster/app-icon.svg. Aus ihr entstehen alle
// Groessen - nicht umgekehrt. Wer eine Groesse von Hand nachpflegt, hat nach
// der naechsten Aenderung zwei verschiedene Icons im Umlauf.
//
//   node tools/app-icon.mjs
//
// Warum nicht alles aus der SVG: bei 16 px ist ein Strich von 2.4 Einheiten
// 0.38 px. Beim Weichzeichnen wird daraus eine graue Flaeche ohne Kontur -
// genau der Fehler des alten Masken-Icons. Deshalb zwei Wege:
//
//   1. ab 64 px    SVG rastern (density hoch, dann herunterrechnen)
//   2. unter 64 px Pixelformel: pro Pixel entscheidet eine Bedingung, es gibt
//                  nur zwei Farben. Kein Antialiasing, keine Graustufen.
//
// Die Zahlen der Formel sind dieselben wie in der SVG: Scheibe r=44,
// acht Bolzen von r=38 bis 48.5, Speichen 90/210/330 Grad, Nabe r=12,
// Kernloch r=5. Wer eines von beiden aendert, muss das andere mitziehen -
// tests/app-icon.test.mjs prueft, dass die Pixelformel genau zwei Farben
// liefert.
//
// Ausgeliefert wird aus dem Repo-Wurzelverzeichnis (GitHub Pages liefert
// legacy aus), deshalb liegen die Dateien in shell/ und werden von dort
// kopiert - genau wie shell/style.css.
//
// Warum kein Rand wie bei den Item-Bildern: iOS rundet die Ecken selbst und
// erwartet eine randlose Flaeche. Ein eigener Rand wuerde als schwarzer
// Rahmen um das gerundete Icon stehen. Android nutzt das Rohbild als
// "any"-Layer und beschneidet selbst.
import {readFile, writeFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = join(ROOT, 'docs/muster/app-icon.svg');
const SHELL = join(ROOT, 'shell');
const THEME = '#39ff14';          // Leuchtgruen der Oberflaeche
const HINTERGRUND = '#000000';

const {default: sharp} = await import('sharp');

// Ab dieser Kante wird gerastert, darunter gezeichnet.
const RASTER_AB = 64;

// PNG fuer Apple und Browser-Tab, plus maskable-Variante mit Sicherheitsrand.
const PNG = [
  {name: 'icon-192.png', size: 192, typ: 'any'},
  {name: 'icon-512.png', size: 512, typ: 'any'},
  {name: 'icon-512-maskable.png', size: 512, typ: 'maskable'},
  {name: 'apple-touch-icon.png', size: 180, typ: 'any'}
];

// Das Motiv in Zahlen. Die SVG beschreibt dasselbe, nur als Pfade.
// Das Motiv wird etwas eingezoomt gezeichnet, damit bei 16 px ein schwarzer
// Rand bleibt. Ohne das kleben die Bolzen am Bildrand (bei r=47 bleiben 3
// Einheiten = 0.48 px, also nichts).
const SKALA = 0.92;

const MOTIV = {
  skala: SKALA,
  scheibe: 44,           // Aussenkante der Scheibe
  bolzenAussen: 47,      // Bolzen reichen bis hierhin - nicht 50, sonst
                         // klebt das Icon bei 16 px am Rand
  bolzenBreiteGrad: 19, // Winkelbreite eines Bolzens (kraeftiger als die SVG:
                        // bei 16 px ist ein Bolzen von 1.6 px Breite nicht mehr
                        // als Bolzen zu erkennen)
  bolzen: 8,             // Verriegelungsbolzen am Rand
  speichenGrad: [90, 210, 330],  // drei Speichen, keine vier: so ist die
                                 // Tuer auch bei 16 px nicht spiegelsymmetrisch
  // Die kleinen Fassungen brauchen kraeftigere Speichen als die grosse -
  // 10 Einheiten sind bei 16 px 1.6 Pixel und verschwinden. Die Werte hier
  // entsprechen dem Zweig <g id="mittel"> in der SVG.
  speichenBreite: 18,
  speicheBis: 32,
  nabe: 14,
  loch: 6.5              // Kernloch
};

// Ein Bolzen ist ein Rechteck in Polarkoordinaten: zwischen zwei Winkeln und
// zwei Radien. Als Winkelbreite gerechnet, damit aussen und innen gleich breit
// bleibt - ein Rechteck im kartesischen Sinn wuerde nach aussen breiter.
function bolzenTreffer(winkel, radius) {
  const halb = MOTIV.bolzenBreiteGrad / 2;
  for (let i = 0; i < MOTIV.bolzen; i++) {
    let d = Math.abs(winkel - i * 360 / MOTIV.bolzen);
    d = Math.min(d, 360 - d);
    if (d <= halb) return true;
  }
  return false;
}

// Pixelgenaue Zeichnung fuer kleine Kantenlaengen.
// Kein sharp-Resize, keine Interpolation: jeder Pixel ist entweder #39ff14
// oder #000000. Das ist der Unterschied zwischen "erkennbar" und "Matsch".
function zeichneKlein(kante) {
  const puffer = Buffer.alloc(kante * kante * 4);
  const mitte = kante / 2;
  const einheit = kante / 100;   // das 100er-Raster der SVG

  for (let y = 0; y < kante; y++) {
    for (let x = 0; x < kante; x++) {
      const dx = x + 0.5 - mitte;
      const dy = y + 0.5 - mitte;
      // Radius in Motivkoordinaten: SKALA zieht das ganze Bild zum Rand hin
      // zusammen, damit aussen ein schwarzer Rand bleibt.
      const radius = Math.hypot(dx, dy) / einheit / MOTIV.skala;

      let winkel = Math.atan2(dx, -dy) * 180 / Math.PI;
      if (winkel < 0) winkel += 360;

      // Scheibe plus die Bolzen, die ueber sie hinausragen.
      let gruen = radius <= MOTIV.scheibe || (radius <= MOTIV.bolzenAussen && bolzenTreffer(winkel, radius));
      if (radius <= MOTIV.loch) gruen = false;

      // Speichen: tangentiale Breite, nicht Winkelbreite - sonst waeren sie
      // aussen breiter als innen.
      if (radius > MOTIV.nabe - 1 && radius <= MOTIV.speicheBis) {
        for (const s of MOTIV.speichenGrad) {
          let d = Math.abs(winkel - s);
          d = Math.min(d, 360 - d);
          if (d * Math.PI / 180 * radius <= MOTIV.speichenBreite / 2) gruen = false;
        }
      }

      const i = (y * kante + x) * 4;
      puffer[i] = gruen ? 0x39 : 0x00;
      puffer[i + 1] = gruen ? 0xff : 0x00;
      puffer[i + 2] = gruen ? 0x14 : 0x00;
      puffer[i + 3] = 0xff;
    }
  }
  return sharp(puffer, {raw: {width: kante, height: kante, channels: 4}})
    .png({compressionLevel: 9})
    .toBuffer();
}

// SVG rastern. density hoch, damit die Kanten vor dem Herunterrechnen fein
// sind; danach genau einmal auf die Zielkante.
async function rastere(seite, zweig) {
  let svg = (await readFile(QUELLE, 'utf8'))
    .replace('<g id="gross">', `<g id="gross"${zweig === 'gross' ? '' : ' display="none"'}>`)
    .replace('<g id="mittel">', `<g id="mittel"${zweig === 'mittel' ? '' : ' display="none"'}>`);
  return sharp(Buffer.from(svg), {density: 1200})
    .resize(seite, seite, {fit: 'contain', background: HINTERGRUND})
    .png({compressionLevel: 9})
    .toBuffer();
}

async function quadrat(seite) {
  if (seite < RASTER_AB) return zeichneKlein(seite);
  // Ab 120 px traegt der Innenring, darunter wuerde er zu Brei.
  return rastere(seite, seite >= 120 ? 'gross' : 'mittel');
}

// Ab hier wird geschrieben. Vorher nichts: das Modul ist auch als Bibliothek
// importierbar (tools/emblem.mjs holt sich MOTIV und bolzenTreffer von hier).
export {MOTIV, bolzenTreffer, zeichneKlein, RASTER_AB};

for (const {name, size, typ} of PNG) {
  let bild = await quadrat(typ === 'maskable' ? Math.round(size * 0.8) : size);
  if (typ === 'maskable') {
    // Maskable braucht 20 % Sicherheitsrand: Android beschneidet je nach
    // Launcher Kreis, Tropfen oder Quadrat.
    bild = await sharp({
      create: {width: size, height: size, channels: 4, background: HINTERGRUND}
    }).composite([{input: bild, gravity: 'center'}]).png({compressionLevel: 9}).toBuffer();
  }
  await writeFile(join(SHELL, name), bild);
  console.log(`  ${name.padEnd(24)} ${size}x${size}  ${(bild.length / 1024).toFixed(1)} kB`);
}

// Favicon: klein, aber als .ico braucht es mehrere Groessen. sharp kann kein
// ICO, deshalb schreibt das Skript die ICO-Struktur selbst - PNG-Eintraege
// sind seit Vista erlaubt und sparen eine Abhaengigkeit.
//
// Alle drei Groessen kommen aus der Pixelformel: 16 und 32 sind der Grund,
// warum es sie ueberhaupt gibt.
async function ico() {
  const groessen = [16, 32, 48];
  const bilder = [];
  for (const s of groessen) bilder.push(await quadrat(s));

  const kopf = Buffer.alloc(6 + 16 * bilder.length);
  kopf.writeUInt16LE(0, 0);                     // reserviert
  kopf.writeUInt16LE(1, 2);                     // Typ: Icon
  kopf.writeUInt16LE(bilder.length, 4);         // Anzahl Eintraege

  let versatz = kopf.length;
  bilder.forEach((bild, i) => {
    const eintrag = 6 + 16 * i;
    kopf.writeUInt8(groessen[i] >= 256 ? 0 : groessen[i], eintrag);       // Breite
    kopf.writeUInt8(groessen[i] >= 256 ? 0 : groessen[i], eintrag + 1);   // Hoehe
    kopf.writeUInt8(0, eintrag + 2);                                      // Farbpalette
    kopf.writeUInt8(0, eintrag + 3);                                      // reserviert
    kopf.writeUInt16LE(1, eintrag + 4);                                   // Ebenen
    kopf.writeUInt16LE(32, eintrag + 6);                                  // Bit pro Pixel
    kopf.writeUInt32LE(bild.length, eintrag + 8);                         // Groesse
    kopf.writeUInt32LE(versatz, eintrag + 12);                            // Offset
    versatz += bild.length;
  });

  const datei = Buffer.concat([kopf, ...bilder]);
  await writeFile(join(SHELL, 'favicon.ico'), datei);
  console.log(`  ${'favicon.ico'.padEnd(24)} 16/32/48     ${(datei.length / 1024).toFixed(1)} kB`);
}

await ico();

// Die ausgelieferte SVG ist die grosse Fassung ohne den zweiten Zweig: sie
// wird im Browser fuer die Adressleiste und fuer "Zum Startbildschirm" in
// beliebiger Groesse skaliert. Unter 64 px greift ohnehin das ICO.
const voll = await readFile(QUELLE, 'utf8');
const svg = voll
  .replace(/<!--[\s\S]*?-->/g, '')                        // Kommentare raus
  .replace(/\s*<g id="mittel">[\s\S]*?<\/g>\s*(?=<\/svg>)/, '\n')  // zweiter Zweig raus
  .replace(/ id="gross"/, '')
  .replace(/\n\s*\n/g, '\n')
  .trim() + '\n';
await writeFile(join(SHELL, 'icon.svg'), svg);
console.log(`  ${'icon.svg'.padEnd(24)} vektoriell    ${(Buffer.byteLength(svg) / 1024).toFixed(1)} kB`);
