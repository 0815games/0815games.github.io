import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';

const file = name => new URL(`../assets/${name}`, import.meta.url);

test('Vault-Artwork ist lokal auslieferbar und Tuer freigestellt', async () => {
  const szene = await sharp(file('vault-eingang.jpg').pathname).metadata();
  assert.ok(szene.width > szene.height, 'Gang muss breit sein');
  const {data, info} = await sharp(file('vault-tuer.png').pathname).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  assert.equal(info.width, info.height);
  assert.equal(data[3], 0, 'Ecke muss transparent sein');
  const mitte = ((Math.floor(info.height / 2) * info.width) + Math.floor(info.width / 2)) * 4;
  assert.equal(data[mitte + 3], 255, 'Tuerzentrum muss deckend sein');
});

test('Vault-Szene rollt die Tuer zur Seite, zoomt und respektiert reduzierte Bewegung', () => {
  const css = readFileSync(new URL('../shell/style.css', import.meta.url), 'utf8');
  assert.match(css, /@keyframes vault-rollen[\s\S]*?translate\(calc\(-50% \+ 120vw\)/);
  assert.match(css, /@keyframes vault-kamera[\s\S]*?scale\(1\.65\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*?\.vault-cinematic-corridor/);
  assert.match(css, /vault-eingang\.jpg/);
  assert.match(css, /vault-tuer\.png/);
});
