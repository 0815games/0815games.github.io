import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const css = readFileSync(resolve(root, 'interface-redesign.css'), 'utf8');

test('interface layer loads after the base stylesheet and its imagery exists', () => {
  assert.match(html, /interface-redesign\.css\?v=[\w-]+/);
  assert.ok(html.indexOf('style.css?v=') < html.indexOf('interface-redesign.css?v='));
  for (const [, path] of css.matchAll(/url\(['"]?(assets\/[^)'" ]+)/g)) {
    assert.ok(existsSync(resolve(root, path)), `missing ${path}`);
  }
});

test('redesign covers the lobby, combat menus, progression and debrief without changing controls', () => {
  for (const name of ['firebase-party', 'tower-sheet', 'tower-details', 'skill-dialog', 'armory-card', 'results-grid', 'tutorial-dialog', 'threat-intel']) {
    assert.ok(css.includes(`.${name}`), `missing styling for ${name}`);
  }
  for (const id of ['fourPartyPanel','fourPartyCreate','fourPartyJoin','fourPartyStart','radialMenu','towerDetails','gameConfirm','skillDialog','armoryDialog','runResults','tutorialDialog']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /@media\(max-width:520px\)/);
  assert.doesNotMatch(css, /\.tree-node\s*\{/); // Leave the skill-map geometry to the existing renderer.
});
