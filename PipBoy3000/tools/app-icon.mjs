// Alle App-Icons aus demselben Artwork erzeugen: npm run icons:app
// Die Ausgangsdatei bleibt im Repository; der Build kopiert shell/ nach oben.
import {readFile, writeFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHELL = join(ROOT, 'shell');
const source = await readFile(join(ROOT, 'assets/app-icon-artwork.png'));
const metadata = await sharp(source).metadata();
if (metadata.width !== 1024 || metadata.height !== 1024) throw new Error('Artwork muss 1024 x 1024 sein');
// Die KI-Vorlage hat weisse, abgerundete Ecken. Quadratisch beschneiden,
// damit iOS und Android ihre eigene Maske ohne weisse Ecken anwenden.
const artwork = await sharp(source).extract({left: 72, top: 72, width: 880, height: 880}).png().toBuffer();
async function image(size) {
  return sharp(artwork).resize(size, size).png({palette: true, colours: 256, effort: 8}).toBuffer();
}
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await writeFile(join(SHELL, name), await image(size));
}
// Zentrales Motiv innerhalb des maskable-Sicherheitskreises (40% Radius).
// Das Artwork selbst liegt deshalb innerhalb eines Quadrats mit 56% Kante.
const safe = await image(288);
const maskable = await sharp({create: {width: 512, height: 512, channels: 3, background: '#0a1710'}})
  .composite([{input: safe, gravity: 'center'}]).png({palette: true, colours: 256, effort: 8}).toBuffer();
await writeFile(join(SHELL, 'icon-512-maskable.png'), maskable);

// Favicon mit mehreren PNG-Eintraegen fuer Browser ohne SVG-Unterstuetzung.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(image));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (let i = 0; i < sizes.length; i++) {
  const pos = 6 + 16 * i;
  header.writeUInt8(sizes[i], pos); header.writeUInt8(sizes[i], pos + 1);
  header.writeUInt16LE(1, pos + 4); header.writeUInt16LE(32, pos + 6);
  header.writeUInt32LE(images[i].length, pos + 8); header.writeUInt32LE(offset, pos + 12);
  offset += images[i].length;
}
await writeFile(join(SHELL, 'favicon.ico'), Buffer.concat([header, ...images]));
// SVG ist ein eigenstaendiger Container mit eingebettetem Artwork, kein
// externes href: Browser koennen es auch als Favicon sicher darstellen.
const embedded = await sharp(artwork).resize(512, 512).jpeg({quality: 90}).toBuffer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><image width="512" height="512" xlink:href="data:image/jpeg;base64,${embedded.toString('base64')}"/></svg>\n`;
await writeFile(join(SHELL, 'icon.svg'), svg);
console.log('App-Icons aus assets/app-icon-artwork.png erzeugt.');
