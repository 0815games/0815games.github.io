import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { TOUR_STATIONS, FORBIDDEN_TOUR_TARGETS, SAFE_INSPECT_ACTIONS, createMenuTour } from '../menu-tour.mjs';

function makeTourDocument() {
  const nodes = new Map();
  const ids = [
    'menuTour', 'menuTourStep', 'menuTourTitle', 'menuTourText', 'menuTourDetail',
    'menuTourCaption', 'menuTourArt', 'menuTourBack', 'menuTourNext',
    'menuTourInspect', 'menuTourInspectAlt', 'menuTourClose', 'menuTourFinish',
    'menuTourRadioMute', 'menuTourRadioReplay', 'coachHighlight', 'coachRing',
  ];
  for (const id of ids) {
    nodes.set(id, {
      id, hidden: true, disabled: false, textContent: '', src: '', alt: '',
      dataset: {}, style: {}, attrs: {},
      setAttribute(k, v) { this.attrs[k] = v; },
      showPopover() { this._popoverOpen = true; },
      hidePopover() { this._popoverOpen = false; },
      matches() { return !!this._popoverOpen; },
    });
  }
  return { getElementById: id => nodes.get(id) ?? null, nodes };
}

test('menuTour walks all 8 Block-9 HQ stations and guarantees destructive actions remain strictly untargeted', () => {
  assert.equal(TOUR_STATIONS.length, 8);
  const forbiddenSet = new Set(FORBIDDEN_TOUR_TARGETS);
  for (const station of TOUR_STATIONS) {
    assert.ok(station.title && station.text && station.caption && station.art);
    assert.equal(forbiddenSet.has(station.target.replace(/^#/, '')), false, `${station.id} cannot target forbidden action`);
  }
  for (const action of Object.values(SAFE_INSPECT_ACTIONS)) {
    for (const bad of FORBIDDEN_TOUR_TARGETS) {
      assert.equal(action.trigger.includes(bad), false);
      assert.equal(action.dialog.includes(bad), false);
    }
  }
});

test('menuTour supports step navigation, pause/reopen, safe inspect dialogs, and completion', () => {
  const doc = makeTourDocument();
  const openedDialogs = [];
  const resolve = sel => {
    if (sel === '#menuSoldier') return { click() { openedDialogs.push('open:#soldierDialog'); } };
    if (sel === '#soldierDialog') return { open: true, close() { openedDialogs.push('close:#soldierDialog'); this.open = false; } };
    return { getBoundingClientRect: () => ({ left: 20, top: 30, width: 140, height: 60 }) };
  };
  let completedUid = null;
  const steps = [];
  const tour = createMenuTour({
    document: doc,
    resolve,
    radio: { snapshot: () => ({ voiceOver: true }), play() {}, stop() {}, toggleMute() {}, replay() {}, refreshLanguage() {} },
    onStepChange: (st, idx) => steps.push([st.id, idx]),
    onComplete: uid => { completedUid = uid; },
  });

  assert.equal(tour.start('rookie-1', { startStep: 0 }), true);
  assert.equal(tour.isOpen(), true);
  assert.equal(tour.step().id, 'soldier');
  assert.equal(doc.nodes.get('menuTourBack').disabled, true);
  assert.equal(doc.nodes.get('menuTourRadioReplay').hidden, false);

  // Inspect opens safe Soldier dialog; advancing cleanly closes that preview dialog
  assert.equal(tour.inspectStation('soldier'), true);
  assert.deepEqual(openedDialogs, ['open:#soldierDialog']);
  assert.equal(tour.next(), true);
  assert.deepEqual(openedDialogs, ['open:#soldierDialog', 'close:#soldierDialog']);
  assert.equal(tour.step().id, 'armory');

  // Minimize & reopen preserves exact index
  assert.equal(tour.dismiss(), true);
  assert.equal(tour.dismissed(), true);
  assert.equal(tour.reopen(), true);
  assert.equal(tour.step().id, 'armory');

  // Walk to the last station and complete cleanly
  while (tour.next()) {}
  assert.equal(completedUid, 'rookie-1');
  assert.equal(tour.isOpen(), false);
  assert.equal(new Set(steps.map(([id]) => id)).size, 8);
});
