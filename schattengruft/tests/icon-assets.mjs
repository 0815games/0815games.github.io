/**
 * icon-assets.mjs – Icon-Set und Web-Manifest sind konsistent.
 *
 * Prüft:
 *  - index.html referenziert favicon.svg, favicon.ico, apple-touch-icon.png,
 *    manifest.webmanifest und die OG-Bilder, und alle Dateien existieren
 *  - PNG-Icons haben die versprochenen Groessen
 *  - favicon.ico ist ein gueltiges Multisize-ICO (16/32/48/64, 32bpp)
 *  - das Manifest referenziert alle PNGs mit korrekten purpose/sizes
 *  - tools/make-icons.py liegt im Repo (Set ist reproduzierbar)
 *
 * Usage: node tests/icon-assets.mjs
 */
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const iconDir = resolve(ROOT, 'assets/icons');
const exists = (path) => access(path).then(() => true, () => false);

const failures = [];
let checks = 0;
async function check(name, fn) {
  checks++;
  try { await fn(); }
  catch (e) { failures.push(`${name}: ${e.message || e}`); }
}

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const html = await readFile(resolve(ROOT, 'index.html'), 'utf8');
// src/href plus content= von OG/Twitter-Meta (dort stehen die Bild-URLs)
const refs = [
  ...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g),
  ...html.matchAll(/content\s*=\s*["']([^"']*assets\/icons\/[^"']+)["']/g),
]
  .map((m) => m[1])
  .filter((ref) => ref.includes('assets/icons/'));

await check('index.html referenziert alle Icons', () => {
  const wanted = [
    'assets/icons/favicon.svg',
    'assets/icons/favicon.ico',
    'assets/icons/apple-touch-icon.png',
    'assets/icons/manifest.webmanifest',
    'assets/icons/og-image.jpg',
  ];
  const missing = wanted.filter((w) => !refs.some((r) => r.split('?')[0] === w));
  if (missing.length) throw new Error(`fehlende Referenzen: ${missing.join(', ')}`);
});

await check('alle referenzierten Icon-Dateien existieren', async () => {
  const local = refs.map((r) => r.split('?')[0].split('#')[0]);
  const missing = [];
  for (const p of local) if (!(await exists(resolve(ROOT, p)))) missing.push(p);
  if (missing.length) throw new Error(`fehlende Dateien: ${missing.join(', ')}`);
});

await check('SVG-Favicon ist gueltiges SVG', async () => {
  const svg = await readFile(resolve(iconDir, 'favicon.svg'), 'utf8');
  if (!svg.startsWith('<svg') || !svg.trimEnd().endsWith('</svg>')) {
    throw new Error('falsche SVG-Struktur');
  }
});

for (const [file, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-512-maskable.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  await check(`${file} hat Groesse ${size}x${size}`, async () => {
    const buf = await readFile(resolve(iconDir, file));
    if (buf.subarray(0, 8).toString('binary') !== PNG_SIG.toString('binary')) {
      throw new Error('kein PNG');
    }
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    if (w !== size || h !== size) throw new Error(`tatsächlich ${w}x${h}`);
  });
}

await check('favicon.ico ist Multisize-ICO', async () => {
  const buf = await readFile(resolve(iconDir, 'favicon.ico'));
  if (buf.readUInt16LE(0) !== 0) throw new Error('falsche Signatur');
  const count = buf.readUInt16LE(4);
  if (count < 2) throw new Error(`zu wenige Groessen (${count})`);
  for (let i = 0; i < count; i++) {
    const o = 6 + i * 16;
    const w = buf[o] || 256;
    if (buf.readUInt16LE(o + 6) !== 32) throw new Error(`Eintrag ${i}: kein 32bpp`);
    if (![16, 32, 48, 64].includes(w)) throw new Error(`Eintrag ${i}: Breite ${w} unerwartet`);
  }
});

await check('Manifest ist konsistent', async () => {
  const manifest = JSON.parse(await readFile(resolve(iconDir, 'manifest.webmanifest'), 'utf8'));
  if (!manifest.name || !manifest.short_name) throw new Error('kein Name');
  const icons = manifest.icons || [];
  const have = new Set(icons.map((i) => i.src));
  for (const src of ['icon-192.png', 'icon-512.png', 'icon-512-maskable.png']) {
    if (!have.has(src)) throw new Error(`referenziert nicht ${src}`);
  }
  const maskable = icons.find((i) => i.purpose === 'maskable');
  if (!maskable || !/512x512/.test(maskable.sizes)) {
    throw new Error('kein korrektes maskable Icon');
  }
});

await check('make-icons.py ist reproduzierbar', async () => {
  if (!(await exists(resolve(ROOT, 'tools/make-icons.py')))) {
    throw new Error('Skript fehlt');
  }
});

const result = {
  checks,
  passed: checks - failures.length,
  failed: failures.length,
  errors: failures,
  scope: 'Icon-Set: Referenzen, Groessen, Manifest, ICO-Format; keine visuelle Abschneidung.',
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
