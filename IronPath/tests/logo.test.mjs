import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8'),css=await readFile(new URL('../style.css',import.meta.url),'utf8');
assert.match(html,/<h1 class="brand-title"><img[^>]+src="assets\/iron-path-logo\.png\?v=20261102-logo1"[^>]+alt="Iron Path"/);
assert.match(css,/body:has\(#entry:not\(\[hidden\]\)\) main>header/);
const png=await readFile(new URL('../assets/iron-path-logo.png',import.meta.url));assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
console.log('Responsive accessible Iron Path logo checks passed.');
