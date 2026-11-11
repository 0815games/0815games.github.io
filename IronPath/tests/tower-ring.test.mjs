import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// The tower menu used to be a sheet along the bottom edge of the screen, up to 70dvh
// tall: picking a tower meant leaving the pad you had just tapped and reaching for the
// far edge. It is now a ring of four buttons around that pad, each showing a picture
// and a name, and the click opens the existing details dialog for cost and confirm.
//
// What can break silently, and is therefore pinned here: the ring drifting away from
// the pad it belongs to, buttons pushed off the field near the edges, and the click no
// longer opening the dialog that answers "what is it, what does it cost".

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const css = readFileSync(resolve(root, 'interface-redesign.css'), 'utf8');
const game = readFileSync(resolve(root, 'game.js'), 'utf8');

function declarations(source, selector) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const merged = new Map();
  for (const match of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1].split(',').map(part => part.trim().replace(/\s+/g, ' '));
    if (!selectors.includes(selector)) continue;
    for (const declaration of match[2].split(';')) {
      const at = declaration.indexOf(':');
      if (at < 0) continue;
      if (declaration.slice(0, at).trim()) merged.set(declaration.slice(0, at).trim(), declaration.slice(at + 1).trim());
    }
  }
  return Object.fromEntries(merged);
}

test('the tower menu is a ring anchored to the pad, not a sheet on the bottom edge', () => {
  assert.match(html, /id="radialMenu"[^>]*class="tower-sheet tower-radial"/,
    'the menu carries the ring layout');
  const ring = declarations(css, '.tower-sheet.tower-radial');
  assert.equal(ring.position, 'fixed');
  // The point of the whole change: no bottom-edge anchoring anywhere in the base rule.
  assert.equal(ring.bottom, 'auto');
  assert.equal(ring.top, '0');
  assert.equal(ring['width'], '0', 'it is a zero-size anchor box centred on the pad');
  assert.equal(ring.overflow, 'visible', 'the buttons may sit outside it');
  // The old sheet's dimensions must not leak in through the shared class.
  assert.equal(ring['max-height'], 'none');
  assert.equal(ring.padding, '0');
});

test('the four buttons sit on the four points of the ring', () => {
  // North, east, south, west: each button is offset by half its own size so its CENTRE
  // lands on the radius, and by the radius on the axis it belongs to.
  const points = {
    radial0: {axis: 'top', sign: -1},
    radial1: {axis: 'left', sign: 1},
    radial2: {axis: 'top', sign: 1},
    radial3: {axis: 'left', sign: -1},
  };
  for (const [id, {axis, sign}] of Object.entries(points)) {
    const rule = declarations(css, `.tower-sheet.tower-radial #${id}`);
    assert.ok(rule.left && rule.top, `${id} is absolutely placed`);
    const offset = rule[axis];
    assert.ok(offset, `${id} is offset on ${axis}`);
    assert.match(offset, /var\(--ring-radius\)/, `${id} uses the radius game.js publishes`);
    if (sign < 0) assert.match(offset, /^-?calc\(-1 \*/, `${id} points away from the centre on ${axis}`);
    assert.match(axis === 'top' ? rule.left : rule.top, /--ring-size\) \/ 2|--ring-size\)\/2/,
      `${id} is centred on the other axis by half a button`);
  }
  // The radius and the button size come from game.js, so they must be variables.
  const ring = declarations(css, '.tower-sheet.tower-radial');
  assert.match(ring['--ring-radius'] ?? '', /\d+px/, 'there is a fallback radius');
  assert.match(ring['--ring-size'] ?? '', /\d+px/, 'and a fallback button size');
});

test('a button shows a picture and a name, nothing to read', () => {
  const button = declarations(css, '.tower-sheet.tower-radial .sheet-option');
  assert.equal(button['border-radius'], '50%', 'round, so the ring reads as a ring');
  assert.equal(declarations(css, '.tower-sheet.tower-radial .sheet-description').display, 'none',
    'the long description belongs to the dialog the click opens');
  assert.ok(declarations(css, '.tower-sheet.tower-radial .sheet-art')['background-size'], 'there is a picture');
  // The four build towers get their real sprites, not letters. The url carries
  // the sprite cache token, which changes with every art re-issue.
  for (const sprite of ['mg', 'cannon', 'flak', 'sniper']) {
    assert.match(css, new RegExp(`data-mode="build"\\] #radial\\d \\.sheet-art\\{background-image:url\\('assets/${sprite}-sprite\\.png(\\?v=[\\w-]+)?'\\)`),
      `${sprite} shows its sprite in the ring`);
  }
  // Actions get their own icons, chosen per action because the ring position moves.
  for (const icon of ['upgrade', 'sell', 'branch']) {
    assert.match(css, new RegExp(`\\[data-icon="${icon}"\\] \\.sheet-art\\{background-image:url\\('assets/icon-${icon}\\.svg'\\)`));
  }
});

test('the ring is centred on the pad, and clamped so no button leaves the field', () => {
  // Centring: the anchor is the pad's screen position, computed from the same mapping
  // the tap handler uses (logical 960x540 box, panned by the four-player viewport).
  assert.match(game, /menu\.style\.left=`\$\{Math\.round\(x\)\}px`/, 'it is positioned in screen pixels');
  assert.match(game, /const view=battleViewport\?\.getViewport\?\.\(\)\|\|null;/, 'the pan/zoom viewport is honoured');
  assert.match(game, /menu\.style\.setProperty\('--ring-radius'/, 'the radius is published to CSS');
  // Clamping: the half-extent of ring + button is what must stay inside the box.
  // Bounded by what follows the ring code: the canvas tap handler.
  const place = game.slice(game.indexOf('function placeMenu'), game.indexOf("canvas.addEventListener('click'"));
  assert.match(place, /half=radius\+button\/2\+6|half=radius \+ button \/ 2 \+ 6/, 'the full extent of the ring is known');
  assert.match(place, /Math\.min\(space\.right-half,Math\.max\(space\.left\+half,screenX\)\)/, 'x is clamped into the field');
  assert.match(place, /Math\.min\(space\.bottom-half,Math\.max\(space\.top\+half,screenY\)\)/, 'y is clamped into the field');
  assert.doesNotMatch(place, /NaN/, 'and no arithmetic can leak a NaN into the position');
});

test('the ring is placed after the menu opens, and never scrolls the page', () => {
  assert.match(game, /showMenu\(selected\);\s*\n\s*\/\/ The ring is placed around the pad/, 'placement follows opening');
  // The old behaviour pushed the page so the bottom sheet would not cover the pad -
  // that would now move the very pad the ring is centred on.
  assert.doesNotMatch(game, /spotY\+margin-menu\.getBoundingClientRect\(\)\.top/, 'the scroll-into-view nudge is gone');
  assert.match(game, /Menu/.source ? /anchorMenu\(selected\)/ : /.^/);
});

test('clicking a ring button still opens the details dialog that confirms the build', () => {
  // The ring is a shortcut to the same answer, not a second way of building: the
  // button opens #towerDetails with description, cost and CONFIRM.
  assert.match(html, /id="towerDetails"[^>]*class="tower-details"/);
  for (const id of ['towerDetailsTitle', 'towerDetailsText', 'towerDetailsCost', 'towerDetailsConfirm']) {
    assert.match(html, new RegExp(`id="${id}"`), `${id} is in the dialog`);
  }
  const build = game.slice(game.indexOf('if(!tower){'), game.indexOf("}else if(mode==='branches')"));
  assert.match(build, /run:\(\)=>\{\s*\n\s*showDetails\(/, 'the build option opens the dialog');
  assert.match(build, /dispatch\(\{type:'build',pad,towerType:i\}/, 'and the dialog is what dispatches the build');
  // The ring labels are just the name now; the cost is what the dialog is for.
  assert.match(build, /label:tr\(type\.name\)/, 'the ring shows the name');
  assert.doesNotMatch(build, /label:`\$\{tr\(type\.name\)\} · \$\{type\.cost\}`/, 'not the name with a price glued on');
});
