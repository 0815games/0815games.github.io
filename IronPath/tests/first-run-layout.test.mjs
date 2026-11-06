import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Two defects the first run shipped with, both reported from a real phone:
//
//   1. the training contract card at the top left ("Ausbildungsvertrag") sat on
//      top of the status dashboard and the field menu, because it was pinned to a
//      guessed `top:65px`;
//   2. the coach card moved with the page when the player scrolled, so the card
//      and the ring it was pointing with drifted apart.
//
// Neither is invisible in a unit test - you can read both out of the stylesheet
// and the game loop - so they are guarded here instead of only in the browser
// smoke, which needs a Chromium to say anything at all.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const field = readFileSync(resolve(root, 'field-command.css'), 'utf8');
const redesign = readFileSync(resolve(root, 'interface-redesign.css'), 'utf8');
const game = readFileSync(resolve(root, 'game.js'), 'utf8');
const nav = readFileSync(resolve(root, 'command-center.mjs'), 'utf8');

// A property is decided by the LAST block that sets it, and one block can carry a
// whole selector list. Reading only the last block would report a media override -
// or the shared rule for two cards - as if it were the whole definition.
function declarations(source, selector) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const merged = new Map();
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of text.matchAll(rule)) {
    const selectors = match[1].split(',').map(part => part.trim().replace(/\s+/g, ' '));
    if (!selectors.includes(selector)) continue;
    for (const declaration of match[2].split(';')) {
      const at = declaration.indexOf(':');
      if (at < 0) continue;
      const property = declaration.slice(0, at).trim();
      const value = declaration.slice(at + 1).trim();
      if (property) merged.set(property, value);
    }
  }
  return merged;
}
const ruleOf = (source, selector) => Object.fromEntries(declarations(source, selector));
// Some properties are intentionally re-declared per media query (the card is a
// bottom strip in portrait and a side column in landscape). For those, what matters
// is that SOME rule says it, not which one wins on a desktop.
function declares(source, selector, property, pattern) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].some(match => {
    const selectors = match[1].split(',').map(part => part.trim().replace(/\s+/g, ' '));
    if (!selectors.includes(selector)) return false;
    return [...match[2].matchAll(/([\w-]+)\s*:\s*([^;]+)/g)]
      .some(([, name, value]) => name === property && pattern.test(value.trim()));
  });
}

test('the contract card is placed below the measured header, never at a guessed offset', () => {
  const card = ruleOf(field, '#gameView .battle .solo-objective:not([hidden])');
  assert.ok(card.top, 'the objective card still has a top offset');
  assert.match(card.top, /^calc\(var\(--hud-bottom/, 'it waits for the measured header instead of a fixed 65px');
  assert.doesNotMatch(card.top, /65px/, 'the guessed offset that ran under the dashboard is gone');
  // The dashboard on a phone is 5px from the top, ~52px tall and reserves room for
  // the field menu: a card that starts at 65px is inside it. The variable is fed by
  // a real measurement, and a floor exists for the first frame.
  // 52px on a normal phone, 46px on a short one (the last block wins here); the
  // training frame overrides it with 84px because its header is in flow above the
  // field and the first frame has no measurement yet.
  assert.match(card.top, /--hud-bottom,calc\(4[0-9]|5[0-9]px \+ env\(safe-area-inset-top,0px\)\)/, 'there is a floor before the first measurement');
  // The measurement already contains the notch. Adding it again would push the card
  // about 50px too low on a notched phone, i.e. back onto the field.
  assert.doesNotMatch(card.top.replace(/--hud-bottom,calc\([^)]*\)\)/, ''),
    /env\(safe-area-inset-top/, 'the notch is not counted twice');
  // Never over the field menu on the right, and never wider than the field.
  assert.match(card.right, /^calc\(64px/, 'the card keeps clear of the field menu');
  assert.ok(declares(field, '#gameView .battle .solo-objective:not([hidden])', 'max-width', /^min\(340px/), 'and it stays narrower than the field');
  // It must not grow down over the build pads: the tutorial asks the player to tap
  // them, so long copy is clamped rather than pushed on top of them.
  const body = ruleOf(field, '#gameView .battle .solo-objective:not([hidden]) p');
  assert.match(body['-webkit-line-clamp'] ?? body.display, /2|none/);
});

test('the training-specific offset overrides the general one, in that order', () => {
  // Same specificity trap that the browser smoke caught: the training rule first
  // appeared ABOVE the general rule and lost, so on a 320px phone the fallback was
  // 52px and the card was painted 10px inside the two-line status dashboard.
  const text = field.replace(/\/\*[\s\S]*?\*\//g, '');
  const general = text.indexOf('#gameView .battle .solo-objective:not([hidden]),' +
    '\n#gameView .battle .versus-status:not([hidden])');
  assert.ok(general > 0, 'the general rule is there');
  const training = text.indexOf('#gameView #gameWorkspace[data-screen="training"] .battle .solo-objective:not([hidden])');
  assert.ok(training > general, 'the training override comes after it in the file');
  const selector = '#gameView #gameWorkspace[data-screen="training"] .battle .solo-objective:not([hidden])';
  assert.ok(ruleOf(field, selector).top, 'the override sets a top offset');
  assert.ok(declares(field, selector, 'top', /--hud-bottom,calc\(8[0-9]px/),
    'its floor clears a wrapped two-line status row');
});

test('game.js publishes the measured header height relative to the field, not the page', () => {
  assert.match(game, /--hud-bottom/, 'the measurement is published as a custom property');
  const measure = game.slice(game.indexOf('function measureHud'), game.indexOf('function measureHud') + 900);
  assert.match(measure, /getBoundingClientRect\(\)\.bottom/, 'it reads the dashboard bottom');
  assert.match(measure, /-\s*battle\.getBoundingClientRect\(\)\.top/, 'relative to the battlefield box');
  // A headless harness (and a very early frame) has no layout: the loop must not throw.
  assert.match(measure, /try\s*\{[\s\S]*catch/, 'measuring never breaks the frame loop');
  assert.match(game, /window\.addEventListener\('resize',measureHud\)/, 'rotation re-measures');
  assert.match(game, /--action-bar/, 'the action bar height is published too');
  const bar = game.slice(game.indexOf('function measureActionBar'), game.indexOf('function measureActionBar') + 900);
  assert.match(bar, /getBoundingClientRect\(\)/, 'measured, not assumed');
  assert.match(bar, /catch/, 'and it cannot break the loop either');
});

test('the training screen owns the viewport so the page cannot scroll under the card', () => {
  // `data-screen` decides the frame. Training used to fall through to the layout
  // page, where the document scrolls under the field: that is the bug that moved
  // the card. It must be named, and it must be pinned like the endless field.
  assert.match(nav, /data-screen|dataset\.screen/, 'navigation labels the screen');
  const pinned = field.slice(field.indexOf('[data-screen="training"]'));
  assert.match(pinned, /\.battle\{[^}]*position:fixed/, 'training gets the fixed field frame');
  assert.match(pinned, /overflow:hidden/, 'and the page behind it is held still');
  assert.match(pinned, /\.map-frame\{[^}]*flex:1/, 'the field fills what the header leaves');
});

test('the coach card and its pointer cannot be dragged by an ancestor containing block', () => {
  // The BASE rule is the first one; the landscape block later in the file overrides
  // `bottom` inside a media query, so merging every declaration would report that one.
  const coachText = redesign.replace(/\/\*[\s\S]*?\*\//g, '');
  const base = coachText.match(/(?:^|\})\s*\.first-run-coach\s*\{([^{}]*)\}/);
  assert.ok(base, 'the card has a base rule');
  const coach = Object.fromEntries(base[1].split(';').map(d => {
    const at = d.indexOf(':');
    return at < 0 ? null : [d.slice(0, at).trim(), d.slice(at + 1).trim()];
  }).filter(Boolean));
  assert.equal(coach.position, 'fixed', 'the card is anchored to the viewport');
  // Above the measured action bar: a card that covers Deploy makes the first run
  // untappable, which is exactly what the browser smoke caught.
  assert.match(coach.bottom, /^calc\(var\(--action-bar,calc\(66px \+ env\(safe-area-inset-bottom,0px\)\)\) \+ 8px\)$/,
    'and sits above the measured action bar, never on it');
  assert.ok(declares(redesign, '.first-run-coach', 'max-height', /^45dvh$/), 'it keeps the 45dvh cap the user asked for');
  // Landscape phones get a side column instead - still never the whole screen height.
  assert.ok(declares(redesign, '.first-run-coach', 'right', /^calc\(8px/), 'landscape moves it to a column');
  // In landscape it is still above the bar, and it never assumes the full height.
  assert.ok(declares(redesign, '.first-run-coach', 'bottom', /--action-bar/), 'landscape keeps it above the bar');
  assert.ok(declares(redesign, '.first-run-coach', 'max-height', /100dvh - var\(--action-bar/), 'and shortens it by the bar');
  // The pointer is drawn from the card to the pad, so the card moving without the
  // ring is exactly how they lost each other.
  const highlight = ruleOf(redesign, '.coach-highlight');
  assert.equal(highlight.position, 'fixed');
  assert.equal(highlight['pointer-events'], 'none');
  // And the field loop re-marks on the two scrolls that do not fire `resize`.
  assert.match(game, /window\.addEventListener\('scroll',remarkCoach/, 'page scroll re-marks the ring');
  assert.match(game, /mapViewport\.addEventListener\('scroll',remarkCoach/, 'field pan re-marks the ring');
});

test('no selector asks for #gameView inside #gameWorkspace', () => {
  // `#gameView` wraps `#gameWorkspace`. A descendant selector with them in that order
  // matches nothing at all, which is how the training offset silently did not apply -
  // twice, once as an order bug and once as a nesting bug, both caught in CI.
  for (const file of ['field-command.css', 'interface-redesign.css']) {
    const source = readFileSync(resolve(root, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, selector] of source.matchAll(/([^{}]+)\{/g)) {
      assert.doesNotMatch(selector, /#gameWorkspace[^,{]*#gameView/,
        `${file}: "${selector.trim().slice(0, 80)}" can never match`);
    }
  }
});

test('the measured header is the one the field really uses', () => {
  // A guard against the measurement going stale: the dashboard must still exist
  // inside the battlefield, or the custom property would point at nothing.
  const objective = html.indexOf('id="soloObjective"');
  const dashboard = html.indexOf('class="dashboard"');
  assert.ok(dashboard > 0 && objective > 0);
  assert.ok(html.indexOf('id="gameView"') < dashboard, 'the dashboard lives inside #gameView');
  assert.match(field, /#gameView \.map-frame \.dashboard\{position:absolute/, 'and it is positioned in the field');
});

test('the training field shows one language flag, not two', () => {
  // Reported from a phone: two flags in the top right. The field has its own switch
  // (#fieldLanguage, left of the menu) and the page has the global picker - and the
  // list that hides the global one did not include the training screen.
  const training = field.slice(field.indexOf('data-field-menu="open"') > 0
    ? field.indexOf('#gameView #gameWorkspace[data-screen="training"] .field-language-flag')
    : 0);
  assert.match(field, /#gameView #gameWorkspace\[data-screen="training"\] \.field-language-flag\{display:none\}/,
    'the field flag is hidden on the training field');
  // And the global picker must NOT be hidden there, or the screen has no switch at all.
  const hideGlobal = field.match(/body:has\([^)]*[^}]*>\.language-picker\{display:none\}/);
  assert.ok(hideGlobal, 'the global picker is hidden on the full-field screens');
  assert.doesNotMatch(hideGlobal[0], /data-screen="training"/,
    'training keeps exactly one language switch');
});

test('the coach caption counts five waves, like the contract it describes', () => {
  const coach = readFileSync(resolve(root, 'first-run-coach.mjs'), 'utf8');
  assert.match(coach, /caption:'WAVE 1 OF 5'/, 'the card says five waves');
  assert.doesNotMatch(coach, /OF 6|of 6'/, 'and nothing still says six');
});

test('an open field menu paints above the contract card', () => {
  // The contract card sat at z-index 5 over a menu at 9, so "COMMAND CENTER" and "How
  // to play" were covered by it and the menu looked stuck behind a permanent overlay.
  // The rule keys off the <details> itself, so it also holds where scripts are blocked.
  assert.match(field, /#gameView #gameWorkspace:has\(#fieldOps\[open\]\)/,
    'the open menu is detected in the stylesheet, not by a class a script must remember');
  // `.map-frame` is `isolation:isolate`: the menu inside it cannot overtake a sibling
  // of the frame, so the frame itself has to clear the contract card (5).
  const frame = ruleOf(field, '#gameView #gameWorkspace:has(#fieldOps[open]) .map-frame');
  assert.ok(Number(frame['z-index']) > 5, `the field frame rises above the contract card (${frame['z-index']})`);
  assert.ok(declares(field, '#gameView #gameWorkspace:has(#fieldOps[open]) .field-ops', 'z-index', /^1[0-9]$/),
    'the menu stays on top inside the frame');
  assert.ok(declares(field, '#gameView #gameWorkspace:has(#fieldOps[open]) .field-ops-panel', 'z-index', /^1[0-9]$/),
    'and so does its panel');
});
