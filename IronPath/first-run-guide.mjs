// The guide that walks the player through the *screens* after the first match.
//
// The reward screen, the armory and the skill tree all opened on their own before
// this file existed - and explained nothing. A new soldier was shown a dog tag, a
// grid of gear with prices and a tree with four classes, and told to get on with it.
// The run had taught them to tap a build marker; nothing had taught them what
// "Assault" is.
//
// So this is a small, ordered set of cards that sits over those screens and says
// what this screen is for, what to press, and why. Same rules as the first-run card:
//
//   * NOT a <dialog>: no ::backdrop, no focus trap, the screen behind stays usable;
//   * it advances on the player's own action where there is one, so "next" never
//     becomes the tutorial;
//   * every card names one thing. "Here is the armory" is not a lesson.
//
// The cards are data. `STEPS` is exported so tests can check that every class is
// explained and that no card points at an id that does not exist.
//
// The strings stay English here and are translated when they are written to the DOM.
// That is deliberate: this file is the source of truth for *what* a card says, and
// the German lives in `localization-firstrun-de.mjs` next to the first-run card's
// German. Writing the raw strings to the screen was a real bug - the guide was the
// one part of the first run with no German at all, because nobody ever asked for a
// translation.
import {translateText as tr} from './language.mjs?v=20261219-trains1';

export const STEPS = Object.freeze([
  Object.freeze({
    id: 'rewards',
    title: 'Your first reward',
    text: 'This is what the run paid: experience towards the next level, and a dog tag with your name, your serial and a blood type the game derives from your account. It is issued once and then worn beside your name.',
    caption: 'REWARDS',
    target: { element: '#dogTagAward' },
    advance: 'button',
  }),
  Object.freeze({
    id: 'equip',
    title: 'Gear is what fights',
    text: 'The Armory holds what you own. Each piece raises one number - damage, health, supplies per wave. Equip the piece you just won: an item in the bag does nothing at all.',
    caption: 'ARMORY · EQUIPMENT',
    target: { element: '#armoryList' },
    advance: 'action',
  }),
  Object.freeze({
    id: 'skills',
    title: 'Four classes, one point',
    text: 'The skill tree has four paths and you have one point. Assault adds damage and rate of fire. Engineer makes towers cheaper and tougher. Recon moves your soldier faster and further. Command buffs the whole field. Pick the one that matches how you played.',
    caption: 'SKILLS · CHOOSE A PATH',
    target: { element: '#skillPaths' },
    advance: 'action',
  }),
  Object.freeze({
    id: 'workshop',
    title: 'Where gear comes from',
    text: 'The workshop builds new equipment from scrap, which arrives as you clear waves. This is the long game: the first run paid for one item, the workshop is how you earn the rest.',
    caption: 'ARMORY · WORKSHOP',
    target: { element: '#armoryWorkshop' },
    advance: 'button',
  }),
]);

// The class descriptions are part of the lesson, so they live with the lesson and
// not in a tooltip somewhere. Kept in the interface language of the game: the
// player meets them before they have ever opened the tree.
export const CLASSES = Object.freeze([
  Object.freeze({id: 'assault', name: 'Assault', what: 'More damage per shot and a faster rate of fire.', forYou: 'If you want the towers to kill things.'}),
  Object.freeze({id: 'engineer', name: 'Engineer', what: 'Towers cost less and take more damage before they fall.', forYou: 'If you would rather build a lot than hit hard.'}),
  Object.freeze({id: 'recon', name: 'Recon', what: 'The soldier moves faster and sees further.', forYou: 'If you like running the hero around the road.'}),
  Object.freeze({id: 'command', name: 'Command', what: 'Auras that help every tower near the bunker.', forYou: 'If you would rather hold the last line.'}),
]);

const EDITION = 1;
const keyFor = id => `ironpath:guide:v${EDITION}:${id}`;
const memory = new Set();

export function guideSeen(id, storage) {
  if (!id) return false;
  if (memory.has(id)) return true;
  try { return storage?.getItem(keyFor(id)) === 'done'; } catch { return false; }
}

// Only the Settings replay calls this: the four cards after the match are marked as
// seen per soldier, and a replay has to start at the first one again.
export function forgetGuideSeen(id, storage) {
  if (!id) return false;
  memory.delete(id);
  try { storage?.removeItem?.(keyFor(id)); } catch { /* the session copy is gone either way */ }
  return true;
}

export function markGuideSeen(id, storage) {
  if (!id) return;
  memory.add(id);
  try { storage?.setItem(keyFor(id), 'done'); } catch { /* The session still remembers. */ }
}

// `resolve` maps a target to a DOM node, so this module never queries the game's
// own state and can be tested without a browser.
export function createGuide({ document, storage, resolve = () => null, onVisibilityChange = () => {} } = {}) {
  const card = document.getElementById('firstRunGuide');
  const $ = id => document.getElementById(id);
  let index = -1, activeUser = null;

  const step = () => STEPS[index] || null;
  const open = () => !!card && !card.hidden;
  // Active runs from `start` to the last card - including while the card was put
  // away. Same prove-of-state principle as the field card: dismissing is a pause,
  // never an end, and the evidence of a screen still counts while it is hidden.
  const active = () => index >= 0 && activeUser != null;
  const isDismissed = () => !!card && card.hidden && active();

  function render() {
    const current = step();
    if (!current) return hide();
    $('guideStep').textContent = `${index + 1} / ${STEPS.length}`;
    $('guideTitle').textContent = tr(current.title);
    $('guideText').textContent = tr(current.text);
    $('guideCaption').textContent = tr(current.caption);
    $('guideNext').hidden = current.advance !== 'button';
    card.hidden = false;
    // A modal dialog (the armory, the skill tree) is always above every z-index -
    // the card spent its life under their backdrops, which is why the screens after
    // the dog tag "came without explanation". The popover layer is the only layer
    // above a modal dialog, so the card is shown as a manual popover where the
    // browser has one; without it, the old fixed-position behaviour stands.
    try { card.showPopover?.(); } catch { /* older browsers keep the old layering */ }
    card.dataset.step = current.id;
    ringTarget(current);
  }

  // The same pointer language as the first-run card: the screen the card describes
  // is ringed, so "the skill tree" is a thing on screen and not a word.
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
    } catch { /* decoration only */ }
  }

  function hide() {
    try { card.hidePopover?.(); } catch { /* not shown as a popover */ }
    if (card) card.hidden = true;
    const layer = document.getElementById('coachHighlight');
    if (layer) layer.hidden = true;
    onVisibilityChange(false);
  }

  function go() {
    index++;
    if (!step()) { markGuideSeen(activeUser, storage); hide(); index = -1; return; }
    render();
  }

  const control = {
    isOpen: open,
    step,
    steps: STEPS,
    // The account calls this after the screen the card describes has OPENED: a
    // modal dialog joins the top layer above a popover that is already up, so the
    // card has to re-join above it. Without this, the armory covered the card that
    // was supposed to explain the armory.
    raise() {
      if (!open()) return false;
      try { if (card.matches?.(':popover-open')) card.hidePopover?.(); } catch {}
      try { card.showPopover?.(); } catch {}
      return true;
    },
    start(id) {
      if (!id || guideSeen(id, storage)) return false;
      activeUser = id; index = 0; render(); onVisibilityChange(true); return true;
    },
    // A card that waits for the player's action cannot be skipped with a button -
    // that is the difference between a guide and a wall of text to click through.
    next() {
      const current = step();
      if (!open() || !current || current.advance !== 'button') return false;
      go();
      return open();
    },
    // The account calls this when the screen did what the card asked (gear put on,
    // a skill saved). Only the card waiting for that screen advances - and it
    // advances while put away too: the card comes back at the NEXT step, exactly
    // like the field card returns at 5/7. Reported: "soll die Mission auch
    // ausgeblendet werden können und wieder aufgerufen - gleiches Prinzip wie
    // davor." The account offers the recall pill for the put-away state.
    event(name) {
      const current = step();
      if (!active() || current?.advance !== 'action' || current.id !== name) return false;
      go();
      return true;
    },
    // Putting the card away is not finishing the guide. It keeps its place.
    dismiss() { if (!open()) return false; hide(); return true; },
    dismissed: isDismissed,
    reopen() { if (!isDismissed()) return false; render(); onVisibilityChange(true); return true; },
    stop() { hide(); index = -1; activeUser = null; },
    refreshLanguage() { if (open()) render(); },
  };
  return control;
}
