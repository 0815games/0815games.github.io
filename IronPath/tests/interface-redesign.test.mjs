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

// The first run is the only part of the game that has to work on a phone before
// the player has learned anything about it. These three surfaces were designed
// separately and it showed; the dossier block is what makes them one thing. The
// overflow rule is a regression guard: the old briefing was clipped on a 360x480
// screen because it set a max-height and nothing else.
test('the first-run surfaces share one visual language and stay inside a phone', () => {
  const dossier = css.slice(css.indexOf('First-run dossier'));
  assert.ok(dossier.length > 500, 'the dossier block is present');
  for (const surface of ['.first-run-coach', '.tutorial-dialog', '.dog-tag-award']) {
    assert.ok(dossier.includes(surface), `the dossier styles ${surface}`);
  }
  // A max-height without overflow is exactly the bug that made the first run
  // unplayable: content taller than the box, and no way to reach the buttons.
  assert.match(dossier, /\.dog-tag-award\{[^}]*overflow:auto/);
  assert.match(dossier, /max-height:calc\(100dvh/);
  // The 44px thumb rule survives any restyle.
  assert.match(dossier, /\.tutorial-dialog \.tutorial-actions button\{min-height:44px\}/);
  // One gold, one plate, one edge - named, not sprinkled.
  assert.match(dossier, /--dossier-gold:#e4ca89/);
  assert.match(dossier, /@media\(max-height:520px\)/);
  // And the coach draws its own progress ticks instead of a bare number.
  assert.match(html, /id="coachPips"/);
  assert.match(dossier, /\.coach-pips i\[data-done\]/);
});
