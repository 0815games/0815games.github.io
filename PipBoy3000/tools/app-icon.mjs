// App-Icon fuer Startbildschirm, Homescreen und Browser-Tab.
//
// Quelle ist EIN Rohbild (docs/muster/app-icon.png). Daraus entstehen alle
// Groessen, die die Plattformen erwarten - nicht umgekehrt. Wer eine Groesse
// von Hand nachpflegt, hat nach der naechsten Aenderung zwei verschiedene
// Icons im Umlauf.
//
//   node tools/app-icon.mjs
//
// Ausgeliefert wird aus dem Repo-Wurzelverzeichnis (GitHub Pages liefert
// legacy aus), deshalb liegen die Dateien in shell/ und werden von dort
// kopiert - genau wie shell/style.css.
//
// Warum kein Rand wie bei den Item-Bildern: iOS rundet die Ecken selbst und
// erwartet eine randlose Flaeche. Ein eigener Rand wuerde als schwarzer
// Rahmen um das gerundete Icon stehen. Android nutzt das Rohbild als
// "any"-Layer und beschneidet selbst.
import {readFile, writeFile, copyFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = join(ROOT, 'docs/muster/app-icon.png');
const SHELL = join(ROOT, 'shell');
const THEME = '#39ff14';   // Leuchtgruen der Oberflaeche
const HINTERGRUND = '#000000';

const {default: sharp} = await import('sharp');

// PNG fuer Apple und Browser-Tab, plus maskable-Variante mit Sicherheitsrand.
const PNG = [
  {name: 'icon-192.png', size: 192, typ: 'any'},
  {name: 'icon-512.png', size: 512, typ: 'any'},
  {name: 'icon-512-maskable.png', size: 512, typ: 'maskable'},
  {name: 'apple-touch-icon.png', size: 180, typ: 'any'}
];

const roh = await readFile(QUELLE);

// Auf Inhalt beschneiden, dann quadratisch mit Rand. Ohne das Zuschneiden
// sitzt das Motiv je nach Erzeugung unterschiedlich im Bild, und das Icon
// springt zwischen den Groessen.
async function quadrat(seite) {
  // sharp fuehrt pro Pipeline nur EINEN resize aus - deshalb zwei Instanzen.
  const beschnitten = await sharp(roh).trim({threshold: 10}).png().toBuffer();
  return sharp(beschnitten)
    .resize(seite, seite, {fit: 'contain', background: HINTERGRUND})
    .png({compressionLevel: 9})
    .toBuffer();
}

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

// Ausserdem eine SVG-Fassung fuer Browser, die sie bevorzugen: scharf in jeder
// Groesse, ein paar hundert Byte. Das Motiv ist bewusst als Vektor nachgebaut -
// aus dem PNG automatisch vektorisieren waere bei Linienkunst unbrauchbar.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${HINTERGRUND}"/>
  <g fill="none" stroke="${THEME}" stroke-width="5" stroke-linecap="round">
    <circle cx="50" cy="48" r="30"/>
    <circle cx="38" cy="40" r="8"/>
    <circle cx="62" cy="40" r="8"/>
    <path d="M36 70a14 14 0 0 0 28 0"/>
    <path d="M38 68h24M41 75h18"/>
  </g>
  <g fill="${THEME}">
    <circle cx="50" cy="57" r="2.4"/>
    <path d="M50 51.4 53 57h-6z"/>
    <path d="M46.6 58.6 43.6 61h6.6z" transform="rotate(120 50 57)"/>
    <path d="M46.6 58.6 43.6 61h6.6z" transform="rotate(240 50 57)"/>
  </g>
</svg>
`;
await writeFile(join(SHELL, 'icon.svg'), svg);
console.log(`  ${'icon.svg'.padEnd(24)} vektoriell    ${(Buffer.byteLength(svg) / 1024).toFixed(1)} kB`);

// In das Wurzelverzeichnis, damit Pages sie ohne Umweg ausliefert.
for (const name of [...PNG.map(p => p.name), 'favicon.ico', 'icon.svg']) {
  await copyFile(join(SHELL, name), join(ROOT, name));
}
console.log(`\n${PNG.length + 2} Dateien nach shell/ und ins Wurzelverzeichnis geschrieben.`);
