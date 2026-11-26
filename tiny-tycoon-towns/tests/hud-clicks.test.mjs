// Die Erfahrungsleiste (in einer Pille) muss Klicks annehmen, sonst geht das Tutorial-Ziel „Stadtlevel“ nicht.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');

test('map pills accept clicks while the map header stays click-through', () => {
  assert.match(css, /\.map-hud\s*\{[^}]*pointer-events:\s*none/, 'Kopfzeile bleibt durchlässig');
  assert.match(css, /\.map-pill\s*\{\s*pointer-events:\s*auto;?\s*\}/, 'Pillen nehmen Klicks an');
});

test('the xp bar is inside a map pill', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const i = html.indexOf('id="xp-bar"');
  assert.ok(i > 0);
  assert.ok(html.slice(0, i).lastIndexOf('map-pill') > html.slice(0, i).lastIndexOf('</div>'), 'Erfahrungsleiste sitzt in einer Pille');
});
