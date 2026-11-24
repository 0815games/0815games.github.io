// Rohbilder vor der Aufbereitung auf Bildfehler pruefen.
//
// Hintergrund: ein Motiv kam mit weisser Stoerung in allen vier Ecken. Im
// Inventar sah das nach einem kaputten Icon aus, die Ursache lag aber im
// Rohbild. Der Stil schreibt gruene Linien auf Schwarz vor - alles Heilweisse
// ist per Definition ein Fehler.
//
//   node tools/icon-check.mjs
import {readdir, readFile} from 'node:fs/promises';
import {join, dirname, basename, extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = join(ROOT, 'docs/muster');

const GRENZE = 0.005;   // mehr als 0,5 % weisse Pixel gilt als Fehler

const {default: sharp} = await import('sharp');
const dateien = (await readdir(QUELLE)).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

let fehler = 0;
for (const datei of dateien.sort()) {
  const {data, info} = await sharp(join(QUELLE, datei)).raw().toBuffer({resolveWithObject: true});
  let weiss = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) weiss++;
  }
  const anteil = weiss / (info.width * info.height);
  if (anteil > GRENZE) {
    fehler++;
    console.log(`  ${basename(datei, extname(datei)).padEnd(20)} ${(anteil * 100).toFixed(1)} % weisse Pixel - neu zeichnen`);
  }
}
console.log(fehler === 0
  ? `\n${dateien.length} Rohbilder geprueft, keine Bildfehler.`
  : `\n${fehler} von ${dateien.length} Rohbildern sind fehlerhaft - Aufbereitung abgebrochen.`);
process.exit(fehler === 0 ? 0 : 1);
