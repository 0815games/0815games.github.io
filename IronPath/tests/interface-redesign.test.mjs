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
    // Sprites carry a cache-buster token (?v=...); the file behind it is the
    // path without the query.
    assert.ok(existsSync(resolve(root, path.split('?')[0])), `missing ${path}`);
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

// The language gate is the first screen of the game and the only one a player
// cannot skip. Flag emoji are not flags on Windows (it prints "GB"/"DE"), so the
// tiles use the repo's SVG files; and the tiles must never shrink below a thumb
// or squeeze the language name into 45px on a phone.
test('the language gate shows real flags and keeps its tiles tappable', () => {
  const gate = html.match(/<section id="languageGate"[\s\S]*?<\/section>/)?.[0] ?? '';
  for (const code of ['gb', 'de']) {
    assert.match(gate, new RegExp(`<img src="assets/flag-${code}\\.svg"`), `the ${code} flag is an image`);
    assert.ok(existsSync(resolve(root, `assets/flag-${code}.svg`)), `assets/flag-${code}.svg exists`);
  }
  assert.doesNotMatch(gate, /\u{1F1EC}|\u{1F1E9}/u, 'no flag emoji anywhere in the gate');
  // One sentence under the tiles, not four blocks of prose above them.
  assert.ok(gate.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length < 60, 'the gate stays short');
  // Symmetric buttons: the same class carries the same size on both.
  assert.equal((gate.match(/class="language-gate-button"/g) ?? []).length, 2);
  assert.match(css, /\.language-gate-button\{[^}]*min-height:88px/);
  // Phones stack the tiles; each block is checked on its own so a reformat of the
  // media query cannot fail the test for a reason that is not a regression.
  assert.match(css, /@media\(max-width:520px\)/);
  assert.match(css, /\.language-gate-choices\{grid-template-columns:1fr;/);
  // The flag is beside the name (a grid row pair), not stacked above it.
  assert.match(css, /\.language-gate-flag\{[^}]*grid-row:1\/span 2/);
  // Short screens take the space from the heading, never from the tiles.
  assert.match(css, /@media\(max-height:560px\)\{[\s\S]{0,240}\.language-gate-title\{font-size:18px/);
});
