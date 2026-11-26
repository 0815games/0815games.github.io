// Transparente Tuer aus dem quadratischen Artwork erzeugen.
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const input = fileURLToPath(new URL('../assets/vault-tuer.jpg', import.meta.url));
const output = fileURLToPath(new URL('../assets/vault-tuer.png', import.meta.url));
const {width, height} = await sharp(input).metadata();
if (!width || width !== height) throw new Error('Vault-Tuer muss quadratisch sein');
const maske = Buffer.from(`<svg width="${width}" height="${height}"><circle cx="${width/2}" cy="${height/2}" r="${width*0.48}" fill="white"/></svg>`);
await sharp(input).ensureAlpha().composite([{input: maske, blend: 'dest-in'}]).png({compressionLevel: 9}).toFile(output);
console.log('assets/vault-tuer.png erzeugt.');
