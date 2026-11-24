// Item-Bilder aufbereiten.
//
// Die Rohbilder kommen gross und quadratisch mit viel Rand. Ausgeliefert wird
// 128x128 mit engem Rand, weil ein Inventar-Icon bei 32 Pixeln gelesen werden
// muss. Roh waeren 119 Bilder rund 200 MB; aufbereitet sind es etwa 1,5 MB.
//
// Warum ein Skript und nicht Handarbeit: jedes Bild muss gleich beschnitten
// und skaliert werden, sonst steht im Inventar ein Set aus verschiedenen
// Groessen. Der Lauf ist wiederholbar - neue Bilder einfach in docs/muster/
// legen und erneut ausfuehren.
//
//   node tools/icons.mjs            alle Bilder aufbereiten
//   node tools/icons.mjs stimpack   nur eines
import {readdir, readFile, mkdir, writeFile} from 'node:fs/promises';
import {join, dirname, basename, extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = join(ROOT, 'docs/muster');
const ZIEL = join(ROOT, 'img/items');

const GROESSE = 128;
// Das Motiv soll das Bild fuellen, aber nicht am Rand kleben.
const RAND_ANTEIL = 0.08;
// Alles unter dieser Helligkeit gilt als Hintergrund. Der Grund ist schwarz,
// die Linien gruen - 40 trennt beides zuverlaessig.
const SCHWELLE = 40;

export async function aufbereiten(datei, {ziel = ZIEL, groesse = GROESSE} = {}) {
  const {default: sharp} = await import('sharp');
  const quelle = join(QUELLE, datei);
  const name = basename(datei, extname(datei));

  // 1. Auf den Inhalt beschneiden. `trim` entfernt einfarbige Raender -
  //    genau der Grund, warum die erste Spritze bei 32 px unlesbar war:
  //    das Motiv lag diagonal in einem 2048er Quadrat.
  const beschnitten = await sharp(await readFile(quelle))
    .trim({threshold: SCHWELLE})
    .toBuffer();

  // 2. Quadratisch machen und Rand ergaenzen, damit alle Icons gleich wirken.
  const meta = await sharp(beschnitten).metadata();
  const seite = Math.max(meta.width, meta.height);
  const rand = Math.round(seite * RAND_ANTEIL);

  await mkdir(ziel, {recursive: true});
  const zielPfad = join(ziel, `${name}.png`);

  // Auf eine quadratische Leinwand mit Rand legen, dann auf Zielgroesse.
  //
  // Zwei getrennte sharp-Instanzen, nicht eine Kette: sharp fuehrt pro
  // Pipeline nur EINEN resize aus. In einer Kette wurde der zweite (auf 128)
  // still ignoriert und es kamen 260 px heraus - das faellt ohne Pruefung
  // nicht auf, weil das Bild ja existiert.
  const mitRand = await sharp(beschnitten)
    .resize(seite, seite, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 1}})
    .extend({
      top: rand, bottom: rand, left: rand, right: rand,
      background: {r: 0, g: 0, b: 0, alpha: 1}
    })
    .toBuffer();

  await sharp(mitRand)
    .resize(groesse, groesse, {fit: 'fill', kernel: 'lanczos3'})
    .png({compressionLevel: 9, palette: true})
    .toFile(zielPfad);

  const groesseBytes = (await readFile(zielPfad)).length;
  return {name, pfad: zielPfad, bytes: groesseBytes};
}

const istDirekt = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (istDirekt) {
  const nur = process.argv.slice(2).filter(a => !a.startsWith('-'));
  const dateien = (await readdir(QUELLE))
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .filter(f => nur.length === 0 || nur.some(n => basename(f, extname(f)) === n));

  if (dateien.length === 0) {
    console.log('Keine Bilder in docs/muster/ gefunden.');
    process.exit(0);
  }

  let summe = 0;
  const fertig = [];
  for (const datei of dateien.sort()) {
    const {name, bytes} = await aufbereiten(datei);
    summe += bytes;
    fertig.push(name);
    console.log(`  ${name.padEnd(22)} ${(bytes / 1024).toFixed(1).padStart(6)} kB`);
  }
  console.log(`\n${dateien.length} Bilder -> img/items/ (${(summe / 1024).toFixed(0)} kB gesamt)`);

  // Tabelle im Quellcode mitfuehren, damit Dateibestand und Spiel nicht
  // auseinanderlaufen koennen.
  const alle = (await readdir(ZIEL)).filter(f => f.endsWith('.png')).map(f => basename(f, '.png')).sort();
  const kopf = `// Welche Items haben ein Bild? (erzeugt von tools/icons.mjs)
//
// Die Dateien selbst liegen in img/items/<id>.png. Diese Tabelle entsteht beim
// Aufbereiten aus dem Dateibestand - sie kann deshalb nicht auseinanderlaufen
// mit dem, was wirklich da ist. Wer ein Bild hinzufuegt, fuehrt
// \`node tools/icons.mjs\` aus und committet diese Datei mit.
//
// Bewusst eine Liste und keine Pruefung zur Laufzeit: ein HTTP-Kopf pro Item
// waere bei 32 Icons im Inventar zu teuer, und ein 404 im Netz ist im
// Pip-Boy-Design ein sichtbarer Fehler.
if (typeof window.GameData === 'undefined') window.GameData = {};

window.GameData.itemBilder = [
${alle.map(n => `  '${n}'`).join(',\n')}
];
`;
  await writeFile(join(ROOT, 'src/data/data_item_icons.js'), kopf);
  console.log(`Tabelle geschrieben: src/data/data_item_icons.js (${alle.length} Eintraege)`);
}
