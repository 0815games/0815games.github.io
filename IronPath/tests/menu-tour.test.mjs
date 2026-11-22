import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { TOUR_STATIONS, FORBIDDEN_TOUR_TARGETS, SAFE_INSPECT_ACTIONS, createMenuTour } from '../ui/menu-tour.mjs';

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
      scrollTop: 0, dataset: {}, style: {}, attrs: {},
      setAttribute(k, v) { this.attrs[k] = v; },
      showPopover() { this._popoverOpen = true; },
      hidePopover() { this._popoverOpen = false; },
      matches() { return !!this._popoverOpen; },
    });
  }
  const bodyEl = { className: 'menu-tour-body', scrollTop: 0 };
  nodes.get('menuTour').querySelector = sel => (sel === '.menu-tour-body' ? bodyEl : null);
  return { getElementById: id => nodes.get(id) ?? null, nodes, bodyEl };
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
  const radioCalls = [];
  const tour = createMenuTour({
    document: doc,
    resolve,
    radio: {
      snapshot: () => ({ voiceOver: true }),
      play() {},
      stop() {},
      silence() { radioCalls.push('silence'); },
      toggleMute() {},
      replay() {},
      refreshLanguage() {},
    },
    onStepChange: (st, idx) => steps.push([st.id, idx]),
    onComplete: uid => { completedUid = uid; },
  });

  assert.equal(tour.start('rookie-1', { startStep: 0 }), true);
  assert.equal(tour.isOpen(), true);
  assert.equal(tour.step().id, 'soldier');
  assert.equal(doc.nodes.get('menuTourBack').disabled, true);
  assert.equal(doc.nodes.get('menuTourFinish').hidden, false, 'End tour is available on steps 1–7');
  assert.equal(doc.nodes.get('menuTourRadioReplay').hidden, false);

  // Simulate user scrolling within station 1 before stepping to station 2
  doc.bodyEl.scrollTop = 180;
  doc.nodes.get('menuTour').scrollTop = 40;

  // Inspect opens safe Soldier dialog; advancing cleanly closes that preview dialog and resets scroll
  assert.equal(tour.inspectStation('soldier'), true);
  assert.deepEqual(openedDialogs, ['open:#soldierDialog']);
  assert.equal(tour.next(), true);
  assert.equal(doc.bodyEl.scrollTop, 0, '.menu-tour-body scrollTop resets on station advance');
  assert.equal(doc.nodes.get('menuTour').scrollTop, 0, '#menuTour scrollTop resets on station advance');
  assert.deepEqual(openedDialogs, ['open:#soldierDialog', 'close:#soldierDialog']);
  assert.equal(tour.step().id, 'armory');

  // Minimize & reopen preserves exact index, resets scroll, and silences active radio cleanly
  doc.bodyEl.scrollTop = 120;
  assert.equal(tour.dismiss(), true);
  assert.deepEqual(radioCalls, ['silence']);
  assert.equal(tour.dismissed(), true);
  assert.equal(tour.reopen(), true);
  assert.equal(doc.bodyEl.scrollTop, 0);
  assert.equal(tour.step().id, 'armory');

  // Walk to the last station and verify Finish takes over cleanly
  while (tour.next()) {}
  assert.equal(completedUid, 'rookie-1');
  assert.equal(tour.isOpen(), false);
  assert.equal(new Set(steps.map(([id]) => id)).size, 8);

  // Structural & CSS layout guards for pinned header/footer + scrollable body + unclipped subtitles
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const tourHtml = html.slice(html.indexOf('id="menuTour"'), html.indexOf('</aside>', html.indexOf('id="menuTour"')));
  assert.match(tourHtml, /class="menu-tour-head"[\s\S]*class="menu-tour-body"[\s\S]*class="menu-tour-actions"/);
  assert.match(tourHtml, /class="tour-min-label"[^>]*data-i18n-text="Minimize"/);
  const menuCss = readFileSync(new URL('../menu-redesign.css', import.meta.url), 'utf8');
  assert.match(menuCss, /#menuTour\.menu-tour\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*overflow:\s*hidden;/);
  assert.match(menuCss, /#menuTour\s+\.menu-tour-body\s*\{[^}]*flex:\s*1\s+1\s+auto;[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/);
  assert.match(menuCss, /#menuTour\s+\.menu-tour-radio\s+\.general-radio-sub\s*\{[^}]*max-height:\s*none;[^}]*overflow:\s*visible;/);
});
