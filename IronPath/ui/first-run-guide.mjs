// The guide that walks the player through the real post-match progression
// dialogs (Armory Equip -> 6-Class Skills -> Workshop) before the full HQ
// Menu Tour begins.
import {translateText as tr} from '../language.mjs?v=20261123-aim3';
import {mountOverlayPopover} from './popover-host.mjs?v=20261123-aim3';

export const STEPS = Object.freeze([
  Object.freeze({
    id: 'equip',
    title: 'Gear is what fights',
    text: 'The Armory holds what you own. Each piece raises one number - damage, health, supplies per wave. Equip the piece you just won: an item in the bag does nothing at all.',
    caption: 'ARMORY · EQUIPMENT',
    target: { element: '#armoryList' },
    advance: 'action',
    voiceClip: 'hq-armory',
  }),
  Object.freeze({
    id: 'skills',
    title: 'Six classes, one choice',
    text: 'At level 2 you pick one of six classes: Assault, Engineer, Logistics, Medic, Recon, or Air Defense. Each opens its own skill tree, active ability, and tower upgrade path.',
    caption: 'SKILLS · CHOOSE A CLASS',
    target: { element: '#skillPaths' },
    advance: 'action',
    voiceClip: 'hq-skills',
  }),
  Object.freeze({
    id: 'workshop',
    title: 'Where gear comes from',
    text: 'The workshop builds new equipment from scrap, which arrives as you clear waves. This is the long game: the first run paid for one item, the workshop is how you earn the rest.',
    caption: 'ARMORY · WORKSHOP',
    target: { element: '#armoryWorkshop' },
    advance: 'button',
    voiceClip: 'hq-workshop',
  }),
]);

export const CLASSES = Object.freeze([
  Object.freeze({id: 'assault', name: 'Assault', what: 'Hero damage, airstrikes, and heavy storm tower ordnance.', forYou: 'If you want direct firepower and boss pressure.'}),
  Object.freeze({id: 'engineer', name: 'Engineer', what: 'Faster tower cadence, overdrives, and field overclock cores.', forYou: 'If you want rapid turret networks.'}),
  Object.freeze({id: 'logistics', name: 'Logistics', what: 'Extra supplies, cheaper builds, and salvage bounties on kills.', forYou: 'If you want strong field economy.'}),
  Object.freeze({id: 'medic', name: 'Medic', what: 'Bunker repairs, healing zones, and triage relays on towers.', forYou: 'If you want steady defense and bunker sustain.'}),
  Object.freeze({id: 'recon', name: 'Recon', what: 'Longer range, suppression control, and pinning spotter optics.', forYou: 'If you like controlling lanes with hero positioning.'}),
  Object.freeze({id: 'airDefense', name: 'Air Defense', what: 'Sky sweeps, target marks, and anti-air flak guidance.', forYou: 'If you want dedicated sky control and marked-target focus.'}),
]);

const EDITION = 1;
const keyFor = id => `ironpath:guide:v${EDITION}:${id}`;
const memory = new Set();

export function guideSeen(id, storage) {
  if (!id) return false;
  if (memory.has(id)) return true;
  try { return storage?.getItem(keyFor(id)) === 'done'; } catch { return false; }
}

export function forgetGuideSeen(id, storage) {
  if (!id) return false;
  memory.delete(id);
  try { storage?.removeItem?.(keyFor(id)); } catch {}
  return true;
}

export function markGuideSeen(id, storage) {
  if (!id) return;
  memory.add(id);
  try { storage?.setItem(keyFor(id), 'done'); } catch {}
}

export function createGuide({ document, storage, resolve = () => null, onVisibilityChange = () => {}, onStepChange = () => {} } = {}) {
  const card = document.getElementById('firstRunGuide');
  const $ = id => document.getElementById(id);
  let index = -1, activeUser = null;

  const step = () => STEPS[index] || null;
  const open = () => !!card && !card.hidden;
  const active = () => index >= 0 && activeUser != null;
  const isDismissed = () => !!card && card.hidden && active();

  function render({notify = true} = {}) {
    const current = step();
    if (!current) return hide();
    $('guideStep').textContent = `${index + 1} / ${STEPS.length}`;
    $('guideTitle').textContent = tr(current.title);
    $('guideText').textContent = tr(current.text);
    $('guideCaption').textContent = tr(current.caption);
    const minLabel = $('guideMinimize')?.querySelector?.('[data-i18n-text]');
    if (minLabel) minLabel.textContent = tr('Minimize');
    $('guideNext').hidden = current.advance !== 'button';
    card.hidden = false;
    mountOverlayPopover(document, card, { visible: true });
    try { card.showPopover?.(); } catch {}
    const body = card.querySelector?.('.guide-body');
    if (body) body.scrollTop = 0;
    card.dataset.step = current.id;
    ringTarget(current);
    if (notify) { try { onStepChange(current, index); } catch {} }
  }

  function ringTarget(current) {
    const layer = document.getElementById('coachHighlight');
    const ring = document.getElementById('coachRing');
    if (!layer || !ring) return;
    try {
      const node = current.target?.element ? resolve(current.target.element) : null;
      const box = node?.getBoundingClientRect?.();
      if (!box || !box.width || !box.height) { layer.hidden = true; return; }
      layer.hidden = false;
      ring.hidden = false;
      ring.style.width = `${Math.round(box.width + 10)}px`;
      ring.style.height = `${Math.round(box.height + 10)}px`;
      ring.style.left = `${Math.round(box.left - 5)}px`;
      ring.style.top = `${Math.round(box.top - 5)}px`;
      ring.style.borderRadius = '6px';
    } catch {}
  }

  function hide() {
    try { card.hidePopover?.(); } catch {}
    if (card) card.hidden = true;
    mountOverlayPopover(document, card, { visible: false });
    const layer = document.getElementById('coachHighlight');
    if (layer) layer.hidden = true;
    onVisibilityChange(false);
  }

  function go() {
    index++;
    if (!step()) { markGuideSeen(activeUser, storage); hide(); index = -1; return; }
    render({notify: true});
  }

  const control = {
    isOpen: open,
    step,
    steps: STEPS,
    raise() {
      if (!open()) return false;
      mountOverlayPopover(document, card, { visible: true });
      try { if (card.matches?.(':popover-open')) card.hidePopover?.(); } catch {}
      try { card.showPopover?.(); } catch {}
      return true;
    },
    start(id) {
      if (!id || guideSeen(id, storage)) return false;
      activeUser = id; index = 0; render({notify: true}); onVisibilityChange(true); return true;
    },
    next() {
      const current = step();
      if (!current || current.advance !== 'button') return false;
      go();
      return true;
    },
    event(id) {
      const current = step();
      if (!current || current.advance !== 'action' || current.id !== id) return false;
      go();
      return open();
    },
    dismiss() { if (!open()) return false; hide(); return true; },
    dismissed: isDismissed,
    reopen() { if (!isDismissed()) return false; render({notify: false}); onVisibilityChange(true); return true; },
    stop() { hide(); index = -1; activeUser = null; },
    refreshLanguage() { if (open()) render({notify: false}); },
  };
  return control;
}
