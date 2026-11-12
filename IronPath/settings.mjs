// Settings: one dialog for language, sound, graphics and fullscreen.
//
// Why this file exists. The game used to put a language flag and a FULLSCREEN button
// in the top-right corner of every screen, permanently. On a phone that corner is the
// most expensive space there is: two chips sat over the battlefield, half under the
// field menu, while the controls that actually belong to the match were pushed
// around them. Both of them are settings, not actions, so they belong behind one
// door - the menu - with everything else that is a preference rather than a move.
//
// The rules this module keeps:
//
//   * it owns no state the rest of the game reads directly. Language stays in
//     `language.mjs`, sound stays in `battle-sound.mjs`, fullscreen stays in
//     `fullscreen.mjs`. This dialog is a view over three modules that already
//     exist, so a setting cannot have a second source of truth;
//   * it never opens itself. `open()` is called by the menu buttons, and it
//     remembers what had focus so closing returns the player where they were;
//   * the destructive choices ask first. Resetting the first run replays a match
//     and writes progress markers, so it goes through the same confirmation
//     dialog as ending a run.
export const SETTINGS_KEY = 'ironpath:settings';

// The three things a player can change here besides the language. Graphics is
// stored and read by the game (reduced motion is decided by the same switch, so a
// player who needs it does not have to find an operating-system setting).
export const GRAPHICS = Object.freeze(['full', 'reduced']);

const DEFAULTS = Object.freeze({ volume: 0.7, graphics: 'full' });

export function readSettings(storage) {
  const value = { ...DEFAULTS };
  try {
    const raw = storage?.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Out of range means the blob was not written by this module: a volume of 9 is
      // not "maximum", it is corrupt, and guessing hides the bug. Ignore it.
      if (Number.isFinite(parsed?.volume) && parsed.volume >= 0 && parsed.volume <= 1) value.volume = parsed.volume;
      if (GRAPHICS.includes(parsed?.graphics)) value.graphics = parsed.graphics;
    }
  } catch { /* An unreadable blob must not stop the game from starting. */ }
  return value;
}

export function writeSettings(storage, next) {
  const value = {
    volume: Number.isFinite(next?.volume) ? Math.max(0, Math.min(1, next.volume)) : DEFAULTS.volume,
    graphics: GRAPHICS.includes(next?.graphics) ? next.graphics : DEFAULTS.graphics,
  };
  try { storage?.setItem(SETTINGS_KEY, JSON.stringify(value)); } catch { /* session-only */ }
  return value;
}

// `confirm` is the game's own confirmation dialog - the same object that asks before
// a run is ended (`createConfirmation(...).ask`). It is optional so the module can be
// driven by a test, or by a screen that has no confirm dialog at all.
export function createSettings({
  document,
  window: win,
  storage,
  translate = text => text,
  sound = null,
  confirm = null,
  fullscreen = null,
  onGraphicsChange = () => {},
  onResetFirstRun = null,
} = {}) {
  const $ = id => document.getElementById(id);
  const dialog = $('settingsDialog');
  const current = readSettings(storage);
  let openedFrom = null;

  const volumeInput = $('soundVolume');
  const volumeStatus = $('soundVolumeStatus');
  const graphicsSelect = $('graphicsQuality');

  function paint() {
    if (volumeInput) volumeInput.value = String(Math.round(current.volume * 100));
    if (volumeStatus) volumeStatus.textContent = `${Math.round(current.volume * 100)} %`;
    if (graphicsSelect) graphicsSelect.value = current.graphics;
    if (volumeInput) volumeInput.setAttribute('aria-valuetext', volumeStatus?.textContent ?? '');
  }

  function save() {
    writeSettings(storage, current);
    paint();
  }

  // Sound is a real gain now: the slider scales every cue. 0 is a real mute, which
  // is why the engine keeps its own on/off - the slider never silently turns a
  // soldier's sound back on after they muted it on purpose.
  function applyVolume() {
    const level = Math.round(current.volume * 100);
    if (sound && typeof sound.setVolume === 'function') sound.setVolume(current.volume);
    if (sound && typeof sound.setEnabled === 'function') {
      // Turning the slider up from zero is the explicit gesture the browser needs
      // before audio may start; turning it to zero mutes without losing the level.
      void sound.setEnabled(level > 0);
    }
  }

  volumeInput?.addEventListener('input', () => {
    current.volume = Math.max(0, Math.min(1, Number(volumeInput.value) / 100));
    save();
    applyVolume();
  });

  graphicsSelect?.addEventListener('change', async () => {
    const next = GRAPHICS.includes(graphicsSelect.value) ? graphicsSelect.value : 'full';
    if (next === current.graphics) return;
    // Reduced graphics turn off the animated battlefield effects. That changes how
    // the game looks, not how it plays - but it is still a choice the player might
    // not have meant to make with one tap, so it asks.
    const ok = !confirm || await confirm.ask({
      title: 'Change graphics?',
      text: next === 'reduced'
        ? 'Animated effects on the battlefield are turned off. The game plays exactly the same.'
        : 'Animated effects on the battlefield are turned back on.',
      accept: 'APPLY',
    });
    if (!ok) { paint(); return; }
    current.graphics = next;
    save();
    onGraphicsChange(next);
  });

  async function open(from) {
    if (!dialog) return false;
    openedFrom = from ?? document.activeElement ?? null;
    paint();
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.open = true;
    }
    // Focus lands on the dialog itself, never on the language select: focusing a
    // <select> opens its picker on a phone, so the settings opened straight into
    // the language dropdown. Reported exactly that way.
    try { dialog.focus?.(); } catch { /* focus is a courtesy, not a requirement */ }
    return true;
  }

  function close() {
    if (!dialog) return;
    if (dialog.open) dialog.close();
    openedFrom?.focus?.();
    openedFrom = null;
  }

  $('settingsClose')?.addEventListener('click', close);
  dialog?.addEventListener('cancel', event => { event.preventDefault(); close(); });

  $('settingsTutorialReset')?.addEventListener('click', async () => {
    if (typeof onResetFirstRun !== 'function') return;
    const ok = !confirm || await confirm.ask({
      title: 'Play the first run again?',
      text: 'The training contract starts from the beginning: same map, same cards, same guide. Progress you already earned stays yours, and this replay pays no second XP.',
      accept: 'START OVER',
    });
    if (!ok) return;
    close();
    await onResetFirstRun();
  });

  // Fullscreen lives in the dialog now, so its button is driven here instead of by
  // a permanent chip in the page corner. `fullscreen` is the object fullscreen.mjs
  // already returns; when it is missing the button is hidden rather than dead.
  const fullscreenButton = $('fullscreenToggle');
  if (fullscreenButton && !fullscreen) fullscreenButton.hidden = true;

  return {
    open,
    close,
    paint,
    get volume() { return current.volume; },
    get graphics() { return current.graphics; },
    // The game asks this once at start and after every change, instead of reading
    // storage itself: one reader, one shape.
    isReduced() { return current.graphics === 'reduced'; },
    apply() { applyVolume(); },
  };
}
