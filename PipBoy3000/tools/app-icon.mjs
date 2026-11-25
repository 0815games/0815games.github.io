// App-Icon fuer Startbildschirm, Homescreen und Browser-Tab.
//
// QUELLE IST DIE VEKTORDATEI docs/muster/app-icon.svg. Aus ihr entstehen alle
// Groessen - nicht umgekehrt. Wer eine Groesse von Hand nachpflegt, hat nach
// der naechsten Aenderung zwei verschiedene Icons im Umlauf.
//
//   node tools/app-icon.mjs
//
// Das Motiv ist die zackige Vault-Tuer: acht Trapez-Zaehne am Rand, ein
// dunkler Kranz mit acht Speichen, eine achteckige Innenplatte und in der
// Mitte das Messingschild mit der 33.
//
// Warum nicht alles aus der SVG: bei 16 px ist eine Bogenbreite von 8
// Einheiten 1.3 Pixel. Beim Weichzeichnen wird daraus eine graue Flaeche ohne
// Kontur - genau der Fehler des alten Masken-Icons. Deshalb zwei Wege:
//
//   1. ab 64 px    SVG rastern (density hoch, dann herunterrechnen)
//   2. unter 64 px Pixelformel: pro Pixel entscheidet eine Bedingung, es gibt
//                  nur die Farben des Motivs. Kein Antialiasing.
//
// Die Zahlen der Formel sind dieselben wie in der SVG: Boegen r=40 mit 12
// Einheiten Breite ueber 150 Grad, gelber Ring 26..30, Scheibe r=27 mit
// gruenem Ring bis 28.75, Kern r=13. Die kleine Fassung hat keinen Punktkranz -
// zwoelf Punkte auf 32 px waeren zwoelf einzelne Pixel, also ein grauer Ring.
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

// Das Motiv in Zahlen. Die Werte hier gehoeren zum Zweig <g id="mittel">:
// die kraeftige Fassung ohne Achteck und ohne Nummer. Die "33" ist bei 16 px
// vier Pixel breit - das ist ein Fleck, keine Ziffer.
const MOTIV = {
  zaehne: 8,
  zahnAussen: 40,        // Winkelbreite an der Korpuskante
  zahnInnen: 26,         // Winkelbreite an der Zahnspitze - der Unterschied
                         // macht den Zacken, nicht den Kasten
  rKorpus: 34,           // Aussenkante des Korpus
  rZahn: 50,             // Zaehne reichen bis hierhin
  rRing: 27,             // dunkler Kranz ...
  ringBreite: 8,
  speichen: 8,
  spBreite: 9,
  spVon: 12,             // Speichen von ... bis (Radius)
  spBis: 32,
  rMitte: 19,            // Messingschild
  achtInnen: 28.3        // Achteck-Platte (r * 1.18)
};

// Die festen Farben des Motivs. Kein Verlauf, keine Zwischentoene - das ist
// der ganze Witz der Pixelformel.
const GRUEN = [0x39, 0xff, 0x14];
const GOLD = [0xea, 0xb3, 0x08];
const DUNKEL = [0x05, 0x0f, 0x05];   // Kranz, Speichen, Schatten
const LINIE = [0x0a, 0x2a, 0x0a];    // Achteck-Kante
const SCHWARZ = [0x00, 0x00, 0x00];

// Ein Zahn ist ein Trapez: aussen schmaler als aussen am Korpus. Als
// Winkelbreite gerechnet, damit die Zacken mit dem Radius skalieren.
function zahnTreffer(winkel, radius) {
  if (radius > MOTIV.rZahn || radius < MOTIV.rKorpus) return false;
  // Zwischen Korpuskante und Zahnspitze laeuft die Breite von zahnAussen
  // auf zahnInnen zurueck.
  const t = (radius - MOTIV.rKorpus) / (MOTIV.rZahn - MOTIV.rKorpus);
  const breite = MOTIV.zahnAussen + (MOTIV.zahnInnen - MOTIV.zahnAussen) * t;
  for (let i = 0; i < MOTIV.zaehne; i++) {
    let d = Math.abs(winkel - i * 360 / MOTIV.zaehne);
    d = Math.min(d, 360 - d);
    if (d <= breite / 2) return true;
  }
  return false;
}

// Pixelgenaue Zeichnung fuer kleine Kantenlaengen.
function zeichneKlein(kante) {
  const puffer = Buffer.alloc(kante * kante * 4);
  const mitte = kante / 2;
  const einheit = kante / 100;

  for (let y = 0; y < kante; y++) {
    for (let x = 0; x < kante; x++) {
      const dx = x + 0.5 - mitte;
      const dy = y + 0.5 - mitte;
      const radius = Math.hypot(dx, dy) / einheit;
      let winkel = Math.atan2(dx, -dy) * 180 / Math.PI;
      if (winkel < 0) winkel += 360;

      let farbe = SCHWARZ;
      if (zahnTreffer(winkel, radius)) farbe = GRUEN;       // Zaehne
      if (radius <= MOTIV.rKorpus) farbe = GRUEN;           // Korpus
      if (radius <= MOTIV.achtInnen && innerhalbAchteck(dx, dy, einheit)) farbe = GRUEN;

      // Dunkler Kranz
      if (Math.abs(radius - MOTIV.rRing) <= MOTIV.ringBreite / 2) {
        farbe = radius > MOTIV.rRing ? LINIE : DUNKEL;
      }

      // Speichen als dunkle Stege ueber den Kranz hinaus
      if (radius >= MOTIV.spVon && radius <= MOTIV.spBis) {
        for (let i = 0; i < MOTIV.speichen; i++) {
          let d = Math.abs(winkel - (i * 360 / MOTIV.speichen + 22.5));
          d = Math.min(d, 360 - d);
          if (d * Math.PI / 180 * radius <= MOTIV.spBreite / 2) { farbe = DUNKEL; break; }
        }
      }

      if (radius <= MOTIV.rMitte) farbe = GOLD;             // Messingschild

      const i = (y * kante + x) * 4;
      puffer[i] = farbe[0];
      puffer[i + 1] = farbe[1];
      puffer[i + 2] = farbe[2];
      puffer[i + 3] = 0xff;
    }
  }
  return sharp(puffer, {raw: {width: kante, height: kante, channels: 4}})
    .png({compressionLevel: 9})
    .toBuffer();
}

// Liegt der Punkt in der achteckigen Innenplatte? Achteck = Kreis, bei dem
// die Ecken abgeschnitten sind: max(|x|,|y|) begrenzt die Kanten, der Radius
// die Ecken.
function innerhalbAchteck(dx, dy, einheit) {
  const r = MOTIV.achtInnen;
  const kante = r * Math.cos(Math.PI / 8);   // halbe Kantenbreite des Achtecks
  const ax = Math.abs(dx) / einheit, ay = Math.abs(dy) / einheit;
  return ax <= kante && ay <= kante && Math.hypot(ax, ay) <= r;
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
export {MOTIV, zahnTreffer, innerhalbAchteck, zeichneKlein, RASTER_AB};

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
