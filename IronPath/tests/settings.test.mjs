import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { productionModuleUrl } from './production-module.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createSettings, readSettings, writeSettings, defaultSettings, SETTINGS_KEY } from '../core/settings.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function memory(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: key => (Object.hasOwn(data, key) ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: key => { delete data[key]; },
  };
}

function fakeDocument(ids) {
  const nodes = new Map();
  for (const id of ids) {
    nodes.set(id, {
      id, value: '', textContent: '', hidden: false, open: false, disabled: false, dataset: {},
      style: { setProperty() {} },
      listeners: {},
      addEventListener(type, fn) { this.listeners[type] = fn; },
      setAttribute(key, value) { this[key] = value; },
      focus() { this.focused = true; },
      showModal() { this.open = true; },
      close() { this.open = false; this.listeners.close?.(); },
    });
  }
  return {
    nodes,
    getElementById: id => nodes.get(id) ?? null,
    activeElement: null,
  };
}

const IDS = [
  'settingsDialog', 'settingsClose', 'settingsTabGeneral', 'settingsTabAccount',
  'settingsPanelGeneral', 'settingsPanelAccount', 'languageToggle', 'soundVolume',
  'soundVolumeStatus', 'sfxVolume', 'sfxVolumeStatus', 'musicVolume', 'musicVolumeStatus',
  'soundEnabledToggle', 'musicEnabledToggle', 'voiceOverToggle', 'graphicsQuality',
  'screenShakeToggle', 'weatherEffectsToggle', 'combatTracersToggle',
  'autoPauseToggle', 'defaultMapZoom', 'settingsTutorialReset', 'settingsRestoreDefaults',
  'fullscreenToggle', 'menuPatchNotes', 'menuTutorial',
];

test('an unreadable or partial settings blob falls back cleanly to defaults', () => {
  const expected = defaultSettings();
  assert.deepEqual(readSettings(memory()), expected);
  assert.deepEqual(readSettings(memory({ [SETTINGS_KEY]: 'not json' })), expected);
  assert.deepEqual(readSettings(memory({ [SETTINGS_KEY]: '{"volume":9,"graphics":"8k","mapZoom":"orbital"}' })), expected,
    'out-of-range values are ignored, not clamped into something the player never chose');
  assert.deepEqual(readSettings(memory({ [SETTINGS_KEY]: '{"volume":0.25,"graphics":"reduced"}' })), {
    ...expected,
    volume: 0.25,
    graphics: 'reduced',
  });
  const storage = memory();
  writeSettings(storage, { volume: 2, graphics: 'reduced', voiceOver: false, mapZoom: 'large' });
  const stored = readSettings(storage);
  assert.equal(stored.volume, 1, 'writing clamps volume');
  assert.equal(stored.graphics, 'reduced');
  assert.equal(stored.voiceOver, false);
  assert.equal(stored.mapZoom, 'large');
});

test('the volume slider and sound switch drive the real sound engine and survive a reload', async () => {
  const storage = memory();
  const document = fakeDocument(IDS);
  const calls = [];
  const sound = {
    setVolume(value) { calls.push(['volume', value]); return value; },
    setEnabled(value) { calls.push(['enabled', value]); return value; },
  };
  const settings = createSettings({ document, storage, sound });
  settings.apply();
  settings.paint();
  assert.deepEqual(calls.at(-1), ['enabled', true], 'a non-zero volume is the gesture that starts audio');
  assert.equal(settings.volume, 0.7, 'the stored default');
  assert.equal(settings.soundEnabled, true);
  assert.equal(document.nodes.get('soundVolume').value, '70', 'the control shows it');
  assert.equal(document.nodes.get('soundVolumeStatus').textContent, '70 %');
  assert.equal(document.nodes.get('soundEnabledToggle')['aria-checked'], 'true');

  document.nodes.get('soundVolume').value = '35';
  document.nodes.get('soundVolume').listeners.input();
  assert.deepEqual(calls.at(-1), ['enabled', true]);
  assert.ok(calls.some(([kind, value]) => kind === 'volume' && Math.abs(value - 0.35) < 1e-9), 'the engine got 35%');
  assert.equal(readSettings(storage).volume, 0.35, 'and it is stored');

  // Toggle sound switch off while preserving slider level, then toggle back on.
  document.nodes.get('soundEnabledToggle').listeners.click();
  assert.deepEqual(calls.at(-1), ['enabled', false], 'mute toggle silences sound');
  assert.equal(settings.soundEnabled, false);
  assert.equal(readSettings(storage).volume, 0.35, 'volume preference stays intact');

  document.nodes.get('soundEnabledToggle').listeners.click();
  assert.deepEqual(calls.at(-1), ['enabled', true], 'unmute toggle restores sound');
  assert.equal(settings.soundEnabled, true);

  // Zero slider value is also a real mute; toggling back on raises from 0% to 50%.
  document.nodes.get('soundVolume').value = '0';
  document.nodes.get('soundVolume').listeners.input();
  assert.deepEqual(calls.at(-1), ['enabled', false], 'zero mutes the engine');
  document.nodes.get('soundEnabledToggle').listeners.click();
  assert.equal(readSettings(storage).volume, 0.5, 'unmuting from zero lifts volume to 50%');
});

test('visual, audio voice, camera view, and auto-pause preferences notify listeners and persist', async () => {
  const storage = memory();
  const document = fakeDocument(IDS);
  const visualEvents = [];
  const settings = createSettings({
    document,
    storage,
    onVisualChange: prefs => visualEvents.push(prefs),
  });
  settings.paint();

  document.nodes.get('voiceOverToggle').listeners.click();
  document.nodes.get('screenShakeToggle').listeners.click();
  document.nodes.get('weatherEffectsToggle').listeners.click();
  document.nodes.get('combatTracersToggle').listeners.click();
  document.nodes.get('autoPauseToggle').listeners.click();
  document.nodes.get('defaultMapZoom').value = 'large';
  document.nodes.get('defaultMapZoom').listeners.change();

  const saved = readSettings(storage);
  assert.equal(saved.voiceOver, false);
  assert.equal(saved.screenShake, false);
  assert.equal(saved.weatherEffects, false);
  assert.equal(saved.combatTracers, false);
  assert.equal(saved.autoPause, false);
  assert.equal(saved.mapZoom, 'large');
  assert.equal(visualEvents.at(-1).mapZoom, 'large');
  assert.equal(settings.voiceOver, false);

  // Restoring defaults confirms before resetting all visual & audio fields.
  await document.nodes.get('settingsRestoreDefaults').listeners.click();
  assert.deepEqual(readSettings(storage), defaultSettings());
});

test('graphics asks before it changes the battlefield and disables redundant effect toggles', async () => {
  const storage = memory();
  const document = fakeDocument(IDS);
  const asked = [];
  const applied = [];
  const settings = createSettings({
    document,
    storage,
    confirm: { ask: async options => { asked.push(options); return options.accept === 'APPLY'; } },
    onGraphicsChange: value => applied.push(value),
  });
  assert.equal(settings.isReduced(), false);

  document.nodes.get('graphicsQuality').value = 'reduced';
  await document.nodes.get('graphicsQuality').listeners.change();
  assert.equal(asked.length, 1, 'the player is asked once');
  assert.match(asked[0].text, /Animated effects/);
  assert.deepEqual(applied, [true], 'and the game is told');
  assert.equal(settings.isReduced(), true);
  assert.equal(readSettings(storage).graphics, 'reduced');
  assert.equal(document.nodes.get('screenShakeToggle').disabled, true, 'sub-effect toggles disable clearly in reduced mode');

  const declineDocument = fakeDocument(IDS);
  const declined = [];
  const declining = createSettings({
    document: declineDocument,
    storage,
    confirm: { ask: async () => false },
    onGraphicsChange: value => declined.push(value),
  });
  declineDocument.nodes.get('graphicsQuality').value = 'full';
  await declineDocument.nodes.get('graphicsQuality').listeners.change();
  assert.deepEqual(declined, [], 'a declined change does not reach the game');
  assert.equal(declineDocument.nodes.get('graphicsQuality').value, 'reduced', 'the control goes back to the real value');
  assert.equal(declining.isReduced(), true);
});

test('restarting the first run is confirmed, then handed to the game', async () => {
  const storage = memory();
  const document = fakeDocument(IDS);
  let restarted = 0;
  const asked = [];
  createSettings({
    document,
    storage,
    confirm: { ask: async options => { asked.push(options); return false; } },
    onResetFirstRun: () => { restarted++; },
  });
  await document.nodes.get('settingsTutorialReset').listeners.click();
  assert.equal(asked.length, 1);
  assert.match(asked[0].text, /pays no second XP/, 'the dialog says the replay is not paid');
  assert.equal(restarted, 0, 'declining does nothing');

  const agreeing = createSettings({
    document,
    storage,
    confirm: { ask: async () => true },
    onResetFirstRun: () => { restarted++; },
  });
  await document.nodes.get('settingsTutorialReset').listeners.click();
  assert.equal(restarted, 1, 'accepting starts the replay');
  assert.equal(agreeing.graphics, 'full');
});

test('the dialog opens and closes over the game without becoming a second menu', () => {
  const document = fakeDocument(IDS);
  const settings = createSettings({ document, storage: memory() });
  const opener = { focused: false, focus() { this.focused = true; } };
  settings.open(opener);
  assert.equal(document.nodes.get('settingsDialog').open, true);
  assert.equal(document.nodes.get('settingsDialog').focused, true, 'the dialog takes the focus');
  assert.notEqual(document.nodes.get('languageToggle').focused, true, 'the language toggle must not take focus by itself');
  settings.close();
  assert.equal(document.nodes.get('settingsDialog').open, false);
  assert.equal(opener.focused, true, 'closing returns the player where they were');
});

test('General and Account tabs switch cleanly and open() notifies lifecycle hooks', () => {
  const document = fakeDocument(IDS);
  const events = [];
  const settings = createSettings({
    document,
    storage: memory(),
    onOpen: () => events.push('open'),
    onClose: () => events.push('close'),
  });
  assert.equal(settings.tab, 'general');

  document.nodes.get('settingsTabAccount').listeners.click();
  assert.equal(settings.tab, 'account');
  assert.equal(document.nodes.get('settingsTabGeneral')['aria-selected'], 'false');
  assert.equal(document.nodes.get('settingsTabAccount')['aria-selected'], 'true');
  assert.equal(document.nodes.get('settingsPanelGeneral').hidden, true);
  assert.equal(document.nodes.get('settingsPanelAccount').hidden, false);

  settings.open();
  assert.equal(settings.tab, 'general');
  assert.equal(document.nodes.get('settingsPanelGeneral').hidden, false);
  assert.equal(document.nodes.get('settingsPanelAccount').hidden, true);

  settings.close();
  settings.open(null, { tab: 'account' });
  assert.equal(settings.tab, 'account');
  assert.equal(document.nodes.get('settingsPanelAccount').hidden, false);
  settings.close();

  assert.deepEqual(events, ['open', 'close', 'open', 'close']);
});

test('the field menu opens this dialog instead of carrying its own copies', () => {
  const menu = readFileSync(resolve(root, 'ui/field-menu.mjs'), 'utf8');
  assert.match(menu, /onSettings/, 'the menu requests the shared dialog');
  assert.doesNotMatch(menu, /fieldLanguage/, 'no second language select');
  assert.doesNotMatch(menu, /fieldFullscreen/, 'no second fullscreen button');
  assert.doesNotMatch(menu, /new MutationObserver/, 'and nothing left to keep in sync');
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /id="soundToggle"/, 'no duplicate sound toggle hidden inside the field menu');
});

test('the dialog that switches the language is German itself', async () => {
  const { germanSettings } = await import('../i18n/localization-settings-de.mjs');
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const settingsMarkup = html.slice(html.indexOf('id="settingsDialog"'), html.indexOf('</dialog>', html.indexOf('id="settingsDialog"')));
  const fromMarkup = [...settingsMarkup.matchAll(/data-i18n-(?:aria-label|text)="([^"]+)"/g)].map(match => match[1].replace(/&amp;/g, '&'));
  assert.ok(fromMarkup.length >= 16, 'the dialog has complete translated copy');

  const source = readFileSync(resolve(root, 'core/settings.mjs'), 'utf8');
  const fromCode = [
    ...[...source.matchAll(/(?:title|text): '([^']+)'/g)].map(match => match[1]),
    ...[...source.matchAll(/[:?] '([^']{20,})'/g)].map(match => match[1]),
    ...[...source.matchAll(/accept: '([^']+)'/g)].map(match => match[1]),
    ...[...source.matchAll(/translate\(on \? '([^']+)' : '([^']+)'\)/g)].flatMap(match => [match[1], match[2]]),
  ];
  const english = [' the ', ' and ', ' your ', ' you ', ' this '];
  const language = await import(productionModuleUrl('language.mjs'));
  const storage = memory({ 'ironpath:language': 'de' });
  const node = () => ({ value: '', textContent: '', hidden: false, classList: { toggle() {}, add() {}, remove() {} }, setAttribute() {}, addEventListener() {}, dispatchEvent() {}, getAttribute() { return null; } });
  const saved = globalThis.document;
  globalThis.document = { documentElement: {}, getElementById: node, querySelector: node, querySelectorAll: () => [], addEventListener() {}, dispatchEvent() {} };
  try {
    language.setupLanguage({ document: globalThis.document, storage });
    assert.equal(language.getLanguage(), 'de');
    for (const text of [...fromMarkup, ...fromCode]) {
      const german = language.translateText(text);
      assert.notEqual(german, text, `not translated: ${text}`);
      for (const word of english) {
        assert.ok(!german.toLowerCase().includes(word), `still English ("${word.trim()}"): ${german}`);
      }
    }
    assert.equal(language.translate('workspace.back'), '← KOMMANDOZENTRALE');
  } finally {
    globalThis.document = saved;
  }
  const live = new Set([...fromMarkup, ...fromCode,
    'SETTINGS', 'Close settings', 'APPLY', 'START OVER', 'RESET', 'FULLSCREEN', 'EXIT FULLSCREEN',
    'Run over. This replay pays no XP - the first run already did.',
    'Fullscreen unavailable. Check your browser permissions or exit fullscreen and try again.',
  ]);
  const orphans = Object.keys(germanSettings).filter(key => !live.has(key));
  assert.deepEqual(orphans, [], `Settings entries nothing asks for: ${orphans.join(' / ')}`);
});

test('split SFX and Music sliders and Music toggle persist independently and avoid mute deadlock', () => {
  const storage = memory();
  const document = fakeDocument(IDS);
  const events = { sfx: [], music: [], musicEnabled: [] };
  const settings = createSettings({
    document,
    storage,
    sound: {
      setSfxVolume: v => events.sfx.push(v),
      setMusicVolume: v => events.music.push(v),
      setMusicEnabled: v => events.musicEnabled.push(v),
    },
  });

  document.nodes.get('sfxVolume').value = '30';
  document.nodes.get('sfxVolume').listeners.input();
  document.nodes.get('musicVolume').value = '0';
  document.nodes.get('musicVolume').listeners.input();
  assert.equal(readSettings(storage).sfxVolume, 0.3);
  assert.equal(readSettings(storage).musicVolume, 0);
  assert.equal(document.nodes.get('musicEnabledToggle')['aria-checked'], 'false');

  // Re-enabling Music from zero volume raises it back cleanly to 50% instead of staying muted.
  document.nodes.get('musicEnabledToggle').listeners.click();
  assert.equal(readSettings(storage).musicEnabled, true);
  assert.equal(readSettings(storage).musicVolume, 0.5);
  assert.equal(settings.sfxVolume, 0.3);
  assert.equal(settings.musicVolume, 0.5);
  assert.equal(events.sfx.at(-1), 0.3);
  assert.equal(events.music.at(-1), 0.5);
  assert.equal(events.musicEnabled.at(-1), true);
});

