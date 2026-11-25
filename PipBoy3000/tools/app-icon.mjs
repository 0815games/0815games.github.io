// App-Icon fuer Startbildschirm, Homescreen und Browser-Tab.
//
// QUELLE IST DIE VEKTORDATEI docs/muster/app-icon.svg. Aus ihr entstehen alle
// Groessen - nicht umgekehrt. Wer eine Groesse von Hand nachpflegt, hat nach
// der naechsten Aenderung zwei verschiedene Icons im Umlauf.
//
//   node tools/app-icon.mjs
//
// Das Motiv ist das des Lade-Kreisels vom Startbildschirm: zwei gruene Boegen
// oben und unten, ein gelber Punktkranz als gegenlaeufiger Ring, in der Mitte
// der Reaktor (dunkle Scheibe, gruener Ring, gruener Kern).
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

// Das Motiv in Zahlen. Die SVG beschreibt dasselbe, nur als Pfade; die Werte
// hier entsprechen dem Zweig <g id="mittel"> - die kraeftige Fassung ohne
// Punktkranz, die auch fuer das Favicon gezeichnet wird.
const MOTIV = {
  bogenR: 39,            // Mitte der beiden Boegen (oben und unten)
  bogenBreite: 15,       // bei 16 px sind das 2.4 Pixel - duenn waere weg
  bogenGrad: 130,        // Bogenweite; die Luecken links und rechts machen aus
                         // dem Kreis einen Kreisel und keine Zielscheibe
  bogenMitte: [0, 180],  // oben und unten
  gelbInnen: 23,         // gelber Ring von ... bis. 8 Einheiten = 1.3 px bei
  gelbAussen: 31,        // 16 px - schmaler wird zu Matsch
  scheibe: 22,           // dunkle Scheibe
  ringAussen: 22.75,     // gruener Ring darum
  kern: 12               // gruener Kern
};

// Die Farben des Motivs. Kein Farbverlauf, keine Zwischentoene - das ist der
// ganze Witz der Pixelformel.
const GRUEN = [0x39, 0xff, 0x14];
const GELB = [0xea, 0xb3, 0x08];
const GRUEN_DUNKEL = [0x00, 0x11, 0x00];   // Fuellung der Scheibe
const SCHWARZ = [0x00, 0x00, 0x00];

// Liegt der Punkt im Bogen? Zwei Boegen, je 150 Grad breit, oben und unten
// zentriert. Der Radius entscheidet ueber die Dicke, der Winkel ueber die
// Laenge - ohne das waeren es Klammern statt eines drehenden Rings.
function bogenTreffer(winkel, radius) {
  if (Math.abs(radius - MOTIV.bogenR) > MOTIV.bogenBreite / 2) return false;
  const halb = MOTIV.bogenGrad / 2;
  for (const mitte of MOTIV.bogenMitte) {
    let d = Math.abs(winkel - mitte);
    d = Math.min(d, 360 - d);
    if (d <= halb) return true;
  }
  return false;
}

// Pixelgenaue Zeichnung fuer kleine Kantenlaengen.
// Kein sharp-Resize, keine Interpolation: jeder Pixel ist eine der vier
// Motivfarben. Das ist der Unterschied zwischen "erkennbar" und "Matsch".
function zeichneKlein(kante) {
  const puffer = Buffer.alloc(kante * kante * 4);
  const mitte = kante / 2;
  const einheit = kante / 100;   // das 100er-Raster der SVG

  for (let y = 0; y < kante; y++) {
    for (let x = 0; x < kante; x++) {
      const dx = x + 0.5 - mitte;
      const dy = y + 0.5 - mitte;
      const radius = Math.hypot(dx, dy) / einheit;

      let winkel = Math.atan2(dx, -dy) * 180 / Math.PI;
      if (winkel < 0) winkel += 360;

      // Von aussen nach innen: Boegen, gelber Ring, gruener Ring, Scheibe, Kern.
      let farbe = SCHWARZ;
      if (bogenTreffer(winkel, radius)) farbe = GRUEN;
      if (radius >= MOTIV.gelbInnen && radius <= MOTIV.gelbAussen) farbe = GELB;
      if (radius <= MOTIV.scheibe) farbe = GRUEN_DUNKEL;
      if (radius <= MOTIV.ringAussen && radius > MOTIV.scheibe) farbe = GRUEN;
      if (radius <= MOTIV.kern) farbe = GRUEN;

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
export {MOTIV, bogenTreffer, zeichneKlein, RASTER_AB};

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
