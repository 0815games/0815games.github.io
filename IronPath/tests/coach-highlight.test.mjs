import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {padRing, elementRing, arrowBetween, createCoachHighlight} from '../coach-highlight.mjs';
import {COACH_STEPS} from '../first-run-coach.mjs';

const css = readFileSync(new URL('../interface-redesign.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('a pad ring lands where the pad is drawn, on the screen', () => {
  // A 960x540 world drawn into a 390x220 canvas: exactly 390/960 per world unit.
  const rect = {left: 0, top: 100, width: 390, height: 220};
  const ring = padRing({x: 480, y: 270}, {rect});
  assert.equal(Math.round(ring.x), 195, 'the world centre is the canvas centre');
  // The world scales by WIDTH (960 logical px across the canvas), so the vertical
  // offset is 270 * 390/960, not the canvas centre - the ring follows the drawing,
  // not the box.
  assert.equal(Math.round(ring.y), 210, 'the world scale is width-based and the offset is respected');
  assert.equal(ring.visible, true);
  // A pad outside the visible slice of a panned view is not marked: a ring on a pad
  // the player cannot see is worse than none.
  const panned = padRing({x: 100, y: 100}, {rect, view: {x: 400, y: 0, scale: 1}});
  assert.equal(panned.visible, false);
  // A zoomed phone view scales the ring with the field, or it points at the wrong
  // building.
  const zoomed = padRing({x: 200, y: 100}, {rect, view: {x: 0, y: 0, scale: 2}});
  assert.ok(zoomed.size > ring.size, 'a zoomed ring is bigger');
});

test('bad geometry returns null instead of throwing mid-frame', () => {
  assert.equal(padRing(null, {rect: {left: 0, top: 0, width: 100, height: 100}}), null);
  assert.equal(padRing({x: 1, y: 1}, {rect: null}), null);
  assert.equal(padRing({x: 1, y: 1}, {rect: {left: 0, top: 0, width: 0, height: 0}}), null);
  assert.equal(elementRing(null), null);
  assert.equal(arrowBetween(null, {x: 1, y: 1}), null);
  // A real control gets a ring slightly larger than itself.
  const ring = elementRing({x: 10, y: 20, width: 80, height: 44}, 6);
  assert.deepEqual(ring, {x: 4, y: 14, size: 0, width: 92, height: 56, visible: true});
});

test('the pointer can never swallow a tap or hide the field', () => {
  // This is the whole lesson of the modal briefing: a guide that captures input is
  // the bug. The pointer is decoration and must stay that way.
  const block = css.slice(css.indexOf('.coach-highlight{'));
  assert.match(block, /pointer-events:none/, 'the layer ignores the pointer');
  assert.doesNotMatch(block, /pointer-events:auto/);
  assert.match(html, /id="coachHighlight"[^>]*aria-hidden="true"/, 'it is not in the accessibility tree');
  assert.match(html, /id="coachHighlight"[^>]*hidden/, 'it starts hidden');
  // No backdrop: the field keeps its own light. A dimmed field is a modal in
  // disguise and is exactly what made the first run unplayable.
  assert.doesNotMatch(block, /background:[^;]*rgba\(0, ?0, ?0/, 'no darkening overlay');
  assert.match(block, /prefers-reduced-motion:reduce/, 'the pulse respects motion settings');
});

test('every card explains one thing, and names what to touch', () => {
  assert.ok(COACH_STEPS.length >= 6, 'the field has six things to teach');
  for (const step of COACH_STEPS) {
    assert.ok(step.title && step.text, `${step.id} has words`);
    // A card that points nowhere has to be an announcement, not an instruction.
    if (!step.target) {
      assert.ok(['hero', 'boss'].includes(step.id), `${step.id} points somewhere or is an announcement`);
    }
  }
  // The build card must point at a build marker; that is the card that failed.
  const build = COACH_STEPS.find(step => step.id === 'build');
  assert.deepEqual(build.target, {pad: 'first-free'});
  const deploy = COACH_STEPS.find(step => step.id === 'deploy');
  assert.deepEqual(deploy.target, {element: '#start'}, 'the deploy card rings the deploy button');
});

test('every element a card points at actually exists', () => {
  for (const step of COACH_STEPS) {
    const selector = step.target?.element;
    if (!selector) continue;
    assert.ok(html.includes(`id="${selector.slice(1)}"`), `${step.id} points at ${selector}, which must exist`);
  }
});

// The bug this test exists for: `line.hidden=false` does nothing on an SVG element.
// `hidden` is an IDL property on HTML elements only; on SVG it is an expando, so the
// attribute stays and the arrow never appears - while every unit test that checked
// `.hidden` on a real node passed. The stub below behaves like a real <line>.
test('the arrow is revealed by attribute, because SVG has no hidden property', () => {
  const attributes = new Set(['hidden']);
  const svgLine = {
    id: 'coachArrow', style: {},
    setAttribute: (name) => attributes.add(name),
    removeAttribute: (name) => attributes.delete(name),
    hasAttribute: (name) => attributes.has(name),
    getAttribute: () => null,
  };
  const htmlNode = (id) => ({
    id, hidden: false, style: {}, setAttribute() {}, removeAttribute() {},
    getBoundingClientRect: () => ({left: 0, top: 0, width: 100, height: 50}),
  });
  const nodes = {
    coachHighlight: htmlNode('layer'), coachRing: htmlNode('ring'),
    coachArrow: svgLine, firstRunCoach: htmlNode('card'), game: htmlNode('canvas'),
  };
  const highlight = createCoachHighlight({document: {getElementById: (id) => nodes[id] ?? null}, window: {}});
  highlight.markPad({x: 100, y: 100});
  assert.equal(attributes.has('hidden'), false, 'the line is actually revealed');
  highlight.hide();
  assert.equal(attributes.has('hidden'), true, 'and hidden again by attribute');
});
