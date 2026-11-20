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
//     `fullscreen.mjs`, and visual/battle preferences forward directly into the
//     active game engine. This dialog is a single synchronized console, so an
//     in-game change and an out-of-game change never diverge;
//   * it never opens itself. `open()` is called by the menu buttons (Command
//     Center or in-game field menu), and remembers what had focus so closing
//     returns the player where they were;
//   * destructive choices ask first. Resetting the first run replays a match
//     and writes progress markers, changing graphics mode asks first, and
//     restoring defaults confirms before wiping customizations.
export const SETTINGS_KEY = 'ironpath:settings';

// Graphics quality presets and battlefield camera defaults.
export const GRAPHICS = Object.freeze(['full', 'reduced']);
export const MAP_VIEWS = Object.freeze(['fit', 'large']);

const DEFAULTS = Object.freeze({
  volume: 0.7,
  sfxVolume: 0.85,
  musicVolume: 0.65,
  soundEnabled: true,
  musicEnabled: true,
  voiceOver: true,
  graphics: 'full',
  screenShake: true,
  weatherEffects: true,
  combatTracers: true,
  autoPause: true,
  mapZoom: 'fit',
});

export function defaultSettings() {
  return { ...DEFAULTS };
}

export function readSettings(storage) {
  const value = { ...DEFAULTS };
  try {
    const raw = storage?.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Out of range means the blob was not written by this module: a volume of 9 is
      // not "maximum", it is corrupt, and guessing hides the bug. Ignore it.
      if (Number.isFinite(parsed?.volume) && parsed.volume >= 0 && parsed.volume <= 1) value.volume = parsed.volume;
      if (Number.isFinite(parsed?.sfxVolume) && parsed.sfxVolume >= 0 && parsed.sfxVolume <= 1) value.sfxVolume = parsed.sfxVolume;
      if (Number.isFinite(parsed?.musicVolume) && parsed.musicVolume >= 0 && parsed.musicVolume <= 1) value.musicVolume = parsed.musicVolume;
      if (typeof parsed?.soundEnabled === 'boolean') value.soundEnabled = parsed.soundEnabled;
      if (typeof parsed?.musicEnabled === 'boolean') value.musicEnabled = parsed.musicEnabled;
      if (typeof parsed?.voiceOver === 'boolean') value.voiceOver = parsed.voiceOver;
      if (GRAPHICS.includes(parsed?.graphics)) value.graphics = parsed.graphics;
      if (typeof parsed?.screenShake === 'boolean') value.screenShake = parsed.screenShake;
      if (typeof parsed?.weatherEffects === 'boolean') value.weatherEffects = parsed.weatherEffects;
      if (typeof parsed?.combatTracers === 'boolean') value.combatTracers = parsed.combatTracers;
      if (typeof parsed?.autoPause === 'boolean') value.autoPause = parsed.autoPause;
      if (MAP_VIEWS.includes(parsed?.mapZoom)) value.mapZoom = parsed.mapZoom;
    }
  } catch { /* An unreadable blob must not stop the game from starting. */ }
  return value;
}

export function writeSettings(storage, next) {
  const value = {
    volume: Number.isFinite(next?.volume) ? Math.max(0, Math.min(1, next.volume)) : DEFAULTS.volume,
    sfxVolume: Number.isFinite(next?.sfxVolume) ? Math.max(0, Math.min(1, next.sfxVolume)) : DEFAULTS.sfxVolume,
    musicVolume: Number.isFinite(next?.musicVolume) ? Math.max(0, Math.min(1, next.musicVolume)) : DEFAULTS.musicVolume,
    soundEnabled: typeof next?.soundEnabled === 'boolean' ? next.soundEnabled : DEFAULTS.soundEnabled,
    musicEnabled: typeof next?.musicEnabled === 'boolean' ? next.musicEnabled : DEFAULTS.musicEnabled,
    voiceOver: typeof next?.voiceOver === 'boolean' ? next.voiceOver : DEFAULTS.voiceOver,
    graphics: GRAPHICS.includes(next?.graphics) ? next.graphics : DEFAULTS.graphics,
    screenShake: typeof next?.screenShake === 'boolean' ? next.screenShake : DEFAULTS.screenShake,
    weatherEffects: typeof next?.weatherEffects === 'boolean' ? next.weatherEffects : DEFAULTS.weatherEffects,
    combatTracers: typeof next?.combatTracers === 'boolean' ? next.combatTracers : DEFAULTS.combatTracers,
    autoPause: typeof next?.autoPause === 'boolean' ? next.autoPause : DEFAULTS.autoPause,
    mapZoom: MAP_VIEWS.includes(next?.mapZoom) ? next.mapZoom : DEFAULTS.mapZoom,
  };
  try { storage?.setItem(SETTINGS_KEY, JSON.stringify(value)); } catch { /* session-only */ }
  return value;
}

export function createSettings({
  document,
  window: win,
  storage,
  translate = text => text,
  sound = null,
  confirm = null,
  fullscreen = null,
  onGraphicsChange = () => {},
  onVisualChange = () => {},
  onResetFirstRun = null,
  onOpen = null,
  onClose = null,
} = {}) {
  const $ = id => document.getElementById(id);
  const dialog = $('settingsDialog');
  const current = readSettings(storage);
  let openedFrom = null;
  let activeTab = 'general';

  const volumeInput = $('soundVolume');
  const volumeStatus = $('soundVolumeStatus');
  const sfxVolumeInput = $('sfxVolume');
  const sfxVolumeStatus = $('sfxVolumeStatus');
  const musicVolumeInput = $('musicVolume');
  const musicVolumeStatus = $('musicVolumeStatus');
  const soundEnabledToggle = $('soundEnabledToggle');
  const musicEnabledToggle = $('musicEnabledToggle');
  const voiceOverToggle = $('voiceOverToggle');
  const graphicsSelect = $('graphicsQuality');
  const screenShakeToggle = $('screenShakeToggle');
  const weatherEffectsToggle = $('weatherEffectsToggle');
  const combatTracersToggle = $('combatTracersToggle');
  const autoPauseToggle = $('autoPauseToggle');
  const mapZoomSelect = $('defaultMapZoom');
  const restoreButton = $('settingsRestoreDefaults');
  const tabGeneral = $('settingsTabGeneral');
  const tabAccount = $('settingsTabAccount');
  const panelGeneral = $('settingsPanelGeneral');
  const panelAccount = $('settingsPanelAccount');

  function snapshot() {
    return { ...current };
  }

  function setTab(next) {
    activeTab = next === 'account' ? 'account' : 'general';
    if (tabGeneral) tabGeneral.setAttribute?.('aria-selected', String(activeTab === 'general'));
    if (tabAccount) tabAccount.setAttribute?.('aria-selected', String(activeTab === 'account'));
    if (panelGeneral) panelGeneral.hidden = activeTab !== 'general';
    if (panelAccount) panelAccount.hidden = activeTab !== 'account';
  }

  tabGeneral?.addEventListener?.('click', () => setTab('general'));
  tabAccount?.addEventListener?.('click', () => setTab('account'));

  function paintSwitch(node, enabled, { disabled = false } = {}) {
    if (!node) return;
    const on = !!enabled;
    node.setAttribute?.('aria-checked', String(on));
    node.dataset.state = on ? 'on' : 'off';
    node.disabled = !!disabled;
    node.textContent = translate(on ? 'ON' : 'OFF');
  }

  function paintSlider(input, status, ratio) {
    const pct = Math.round(ratio * 100);
    if (input) {
      input.value = String(pct);
      input.setAttribute?.('aria-valuetext', `${pct} %`);
      input.style?.setProperty?.('--vol', `${pct}%`);
    }
    if (status) status.textContent = `${pct} %`;
    return pct;
  }

  function paint() {
    const pct = paintSlider(volumeInput, volumeStatus, current.volume);
    paintSlider(sfxVolumeInput, sfxVolumeStatus, current.sfxVolume);
    const musicPct = paintSlider(musicVolumeInput, musicVolumeStatus, current.musicVolume);
    const audioActive = current.soundEnabled && pct > 0;
    const musicActive = audioActive && current.musicEnabled && musicPct > 0;
    const reduced = current.graphics === 'reduced';
    if (graphicsSelect) graphicsSelect.value = current.graphics;
    if (mapZoomSelect) mapZoomSelect.value = current.mapZoom;
    paintSwitch(soundEnabledToggle, audioActive);
    paintSwitch(musicEnabledToggle, musicActive, { disabled: !audioActive });
    paintSwitch(voiceOverToggle, current.voiceOver);
    paintSwitch(screenShakeToggle, !reduced && current.screenShake, { disabled: reduced });
    paintSwitch(weatherEffectsToggle, !reduced && current.weatherEffects, { disabled: reduced });
    paintSwitch(combatTracersToggle, !reduced && current.combatTracers, { disabled: reduced });
    paintSwitch(autoPauseToggle, current.autoPause);
    if (dialog?.dataset) dialog.dataset.graphics = current.graphics;
  }

  function save() {
    writeSettings(storage, current);
    paint();
  }

  function applyAudio() {
    const level = Math.round(current.volume * 100);
    const musicLevel = Math.round(current.musicVolume * 100);
    if (sound && typeof sound.setVolume === 'function') sound.setVolume(current.volume);
    if (sound && typeof sound.setSfxVolume === 'function') sound.setSfxVolume(current.sfxVolume);
    if (sound && typeof sound.setMusicVolume === 'function') sound.setMusicVolume(current.musicVolume);
    if (sound && typeof sound.setMusicEnabled === 'function') {
      sound.setMusicEnabled(!!current.musicEnabled && musicLevel > 0);
    }
    if (sound && typeof sound.setEnabled === 'function') {
      void sound.setEnabled(!!current.soundEnabled && level > 0);
    }
  }

  function applyVisuals() {
    try { onGraphicsChange(current.graphics === 'reduced'); } catch { /* noop */ }
    try { onVisualChange(snapshot()); } catch { /* noop */ }
  }

  function apply() {
    applyAudio();
    applyVisuals();
  }

  volumeInput?.addEventListener('input', () => {
    const next = Math.max(0, Math.min(1, Number(volumeInput.value) / 100));
    current.volume = next;
    current.soundEnabled = Math.round(next * 100) > 0;
    save();
    applyAudio();
  });

  sfxVolumeInput?.addEventListener('input', () => {
    current.sfxVolume = Math.max(0, Math.min(1, Number(sfxVolumeInput.value) / 100));
    save();
    applyAudio();
  });

  musicVolumeInput?.addEventListener('input', () => {
    const next = Math.max(0, Math.min(1, Number(musicVolumeInput.value) / 100));
    current.musicVolume = next;
    current.musicEnabled = Math.round(next * 100) > 0;
    save();
    applyAudio();
  });

  soundEnabledToggle?.addEventListener('click', () => {
    const currentlyActive = current.soundEnabled && Math.round(current.volume * 100) > 0;
    if (currentlyActive) {
      current.soundEnabled = false;
    } else {
      current.soundEnabled = true;
      if (Math.round(current.volume * 100) <= 0) current.volume = 0.5;
    }
    save();
    applyAudio();
  });

  musicEnabledToggle?.addEventListener('click', () => {
    const currentlyActive = current.musicEnabled && Math.round(current.musicVolume * 100) > 0;
    if (currentlyActive) {
      current.musicEnabled = false;
    } else {
      current.musicEnabled = true;
      if (Math.round(current.musicVolume * 100) <= 0) current.musicVolume = 0.5;
    }
    save();
    applyAudio();
  });

  function bindBooleanToggle(node, key) {
    node?.addEventListener('click', () => {
      current[key] = !current[key];
      save();
      applyVisuals();
    });
  }

  bindBooleanToggle(voiceOverToggle, 'voiceOver');
  bindBooleanToggle(screenShakeToggle, 'screenShake');
  bindBooleanToggle(weatherEffectsToggle, 'weatherEffects');
  bindBooleanToggle(combatTracersToggle, 'combatTracers');
  bindBooleanToggle(autoPauseToggle, 'autoPause');

  mapZoomSelect?.addEventListener('change', () => {
    current.mapZoom = MAP_VIEWS.includes(mapZoomSelect.value) ? mapZoomSelect.value : 'fit';
    save();
    applyVisuals();
  });

  graphicsSelect?.addEventListener('change', async () => {
    const next = GRAPHICS.includes(graphicsSelect.value) ? graphicsSelect.value : 'full';
    if (next === current.graphics) return;
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
    applyVisuals();
  });

  restoreButton?.addEventListener('click', async () => {
    const ok = !confirm || await confirm.ask({
      title: 'Reset settings?',
      text: 'Restore default audio, graphics, and battlefield display preferences. Language and your account stay unchanged.',
      accept: 'RESET',
    });
    if (!ok) return;
    Object.assign(current, DEFAULTS);
    save();
    apply();
  });

  async function open(from, { tab = 'general' } = {}) {
    if (!dialog) return false;
    openedFrom = from ?? document.activeElement ?? null;
    setTab(tab);
    paint();
    try { onOpen?.(); } catch { /* hooks must never block settings */ }
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.open = true;
    }
    try { dialog.focus?.(); } catch { /* focus is a courtesy, not a requirement */ }
    return true;
  }

  function close() {
    if (!dialog) return;
    if (dialog.open) dialog.close();
    try { onClose?.(); } catch { /* hooks must never block closing */ }
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

  const fullscreenButton = $('fullscreenToggle');
  if (fullscreenButton && !fullscreen) fullscreenButton.hidden = true;

  return {
    open,
    close,
    paint,
    apply,
    snapshot,
    setTab,
    get tab() { return activeTab; },
    get volume() { return current.volume; },
    get sfxVolume() { return current.sfxVolume; },
    get musicVolume() { return current.musicVolume; },
    get soundEnabled() { return current.soundEnabled && Math.round(current.volume * 100) > 0; },
    get musicEnabled() { return current.musicEnabled && Math.round(current.musicVolume * 100) > 0; },
    get voiceOver() { return current.voiceOver; },
    get graphics() { return current.graphics; },
    get mapZoom() { return current.mapZoom; },
    isReduced() { return current.graphics === 'reduced'; },
  };
}
