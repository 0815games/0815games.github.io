import {strict as assert} from 'node:assert';
import {readFile, stat} from 'node:fs/promises';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
for(const asset of ['favicon.svg','favicon.ico','apple-touch-icon.png']) {
  assert.ok(html.includes(`assets/${asset}`));
  assert.ok((await stat(new URL(`../assets/${asset}`,import.meta.url))).size>0);
}
for(const id of ['wave','health','money','enemies']) assert.match(html,new RegExp(`id="${id}"`));
assert.equal((html.match(/class="hud-icon"/g)||[]).length,4);
assert.match(css,/map-viewport\.map-large canvas\{width:max\(760px, 200%\)/,'retain the playable, horizontally scrollable large map');
assert.match(css,/body:has\(#gameView:not\(\[hidden\]\)\) main>header\{display:none\}/);
console.log('Login, favicon and compact HUD checks passed.');
