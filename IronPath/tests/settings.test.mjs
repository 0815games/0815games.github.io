import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {productionModuleUrl} from './production-module.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createSettings, readSettings, writeSettings, SETTINGS_KEY } from '../settings.mjs';

// Settings exists because two controls that were permanently in the page corner - the
// language flag and FULLSCREEN - are preferences, not moves. They now live behind the
// menu in one dialog. These tests hold the two rules that matter:
//
//   1. one source of truth per setting: the dialog writes through the modules that
//      already own the state (sound engine, graphics flag), it does not keep a copy;
//   2. a change that costs something asks first. Turning effects off and restarting
//      the first run are both confirmed through the game's own dialog.

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
      id, value: '', textContent: '', hidden: false, open: false, dataset: {},
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

const IDS = ['settingsDialog', 'settingsClose', 'languageSelect', 'soundVolume', 'soundVolumeStatus',
  'graphicsQuality', 'settingsTutorialReset', 'fullscreenToggle'];

test('an unreadable or missing settings blob falls back to the defaults', () => {
  assert.deepEqual(readSettings(memory()), { volume: 0.7, graphics: 'full' });
  assert.deepEqual(readSettings(memory({ [SETTINGS_KEY]: 'not json' })), { volume: 0.7, graphics: 'full' });
  assert.deepEqual(readSettings(memory({ [SETTINGS_KEY]: '{"volume":9,"graphics":"8k"}' })), { volume: 0.7, graphics: 'full' },
    'out-of-range values are ignored, not clamped into something the player never chose');
  assert.deepEqual(readSettings(memory({ [SETTINGS_KEY]: '{"volume":0.25,"graphics":"reduced"}' })), { volume: 0.25, graphics: 'reduced' });
  const storage = memory();
  writeSettings(storage, { volume: 2, graphics: 'reduced' });
  assert.deepEqual(readSettings(storage), { volume: 1, graphics: 'reduced' }, 'writing clamps, reading trusts its own writes');
});

test('the volume slider drives the real sound engine and survives a reload', async () => {
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
  assert.equal(document.nodes.get('soundVolume').value, '70', 'the control shows it');
  assert.equal(document.nodes.get('soundVolumeStatus').textContent, '70 %');

  document.nodes.get('soundVolume').value = '35';
  document.nodes.get('soundVolume').listeners.input();
  assert.deepEqual(calls.at(-1), ['enabled', true]);
  assert.ok(calls.some(([kind, value]) => kind === 'volume' && Math.abs(value - 0.35) < 1e-9), 'the engine got 35%');
  assert.equal(readSettings(storage).volume, 0.35, 'and it is stored');

  // Zero is a real mute, and it says so to the engine instead of leaving a silent
  // 0% gain with the speaker still "on".
  document.nodes.get('soundVolume').value = '0';
  document.nodes.get('soundVolume').listeners.input();
  assert.deepEqual(calls.at(-1), ['enabled', false], 'zero mutes the engine');
});

test('graphics asks before it changes the battlefield', async () => {
  const storage = memory();
  const document = fakeDocument(IDS);
  const asked = [];
  const applied = [];
  const settings = createSettings({
    document, storage, applied,
    confirm: { ask: async options => { asked.push(options); return options.accept === 'APPLY'; } },
    onGraphicsChange: value => applied.push(value),
  });
  assert.equal(settings.isReduced(), false);

  document.nodes.get('graphicsQuality').value = 'reduced';
  await document.nodes.get('graphicsQuality').listeners.change();
  assert.equal(asked.length, 1, 'the player is asked once');
  assert.match(asked[0].text, /Animated effects/);
  assert.deepEqual(applied, ['reduced'], 'and the game is told');
  assert.equal(settings.isReduced(), true);
  assert.equal(readSettings(storage).graphics, 'reduced');

  // Declining restores the control instead of leaving it showing a value that is not
  // in effect - a select that says "Full" while the field still runs reduced is a lie.
  const declineDocument = fakeDocument(IDS);
  const declined = [];
  const declining = createSettings({
    document: declineDocument, storage, confirm: { ask: async () => false },
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
    document, storage,
    confirm: { ask: async options => { asked.push(options); return false; } },
    onResetFirstRun: () => { restarted++; },
  });
  await document.nodes.get('settingsTutorialReset').listeners.click();
  assert.equal(asked.length, 1);
  assert.match(asked[0].text, /pays no second XP/, 'the dialog says the replay is not paid');
  assert.equal(restarted, 0, 'declining does nothing');

  const agreeing = createSettings({
    document, storage,
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
  assert.equal(document.nodes.get('languageSelect').focused, true, 'the language is the first thing focused');
  settings.close();
  assert.equal(document.nodes.get('settingsDialog').open, false);
  assert.equal(opener.focused, true, 'closing returns the player where they were');
});

test('the field menu opens this dialog instead of carrying its own copies', () => {
  // The regression this guards: field-menu.mjs used to mirror #languageSelect and
  // #fullscreenToggle with MutationObservers, which is exactly how two switches for
  // one setting start disagreeing.
  const menu = readFileSync(resolve(root, 'field-menu.mjs'), 'utf8');
  assert.match(menu, /onSettings/, 'the menu requests the shared dialog');
  assert.doesNotMatch(menu, /fieldLanguage/, 'no second language select');
  assert.doesNotMatch(menu, /fieldFullscreen/, 'no second fullscreen button');
  assert.doesNotMatch(menu, /new MutationObserver/, 'and nothing left to keep in sync');
});

test('the dialog that switches the language is German itself', async () => {
  // This is the one screen a player reaches *because* they cannot read the language
  // they are in. An English fallback here is the worst possible place for one, so the
  // copy in index.html and the strings settings.mjs hands to the confirmation dialog
  // both have to be translated - not just present in a dictionary nobody reads.
  const { germanSettings } = await import('../localization-settings-de.mjs');
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const settingsMarkup = html.slice(html.indexOf('id="settingsDialog"'), html.indexOf('</dialog>', html.indexOf('id="settingsDialog"')));
  const fromMarkup = [...settingsMarkup.matchAll(/data-i18n(?:-aria-label|-text)?="([^"]+)"/g)].map(match => match[1]);
  assert.ok(fromMarkup.length >= 10, 'the dialog has copy to translate');

  const source = readFileSync(resolve(root, 'settings.mjs'), 'utf8');
  // Both the plain `text:` values and the ternary that picks the graphics sentence.
  const fromCode = [
    ...[...source.matchAll(/(?:title|text): '([^']+)'/g)].map(match => match[1]),
    ...[...source.matchAll(/[:?] '([^']{20,})'/g)].map(match => match[1]),
    ...[...source.matchAll(/accept: '([^']+)'/g)].map(match => match[1]),
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
  } finally {
    globalThis.document = saved;
  }
  // And nothing sits in the dictionary that the dialog never asks for.
  // Strings the game translates but this file does not spell out: labels that live in
  // fullscreen.mjs, and the notice game.js shows when a replay ends.
  const live = new Set([...fromMarkup, ...fromCode,
    'SETTINGS', 'Close settings', 'APPLY', 'START OVER', 'FULLSCREEN', 'EXIT FULLSCREEN',
    'Run over. This replay pays no XP - the first run already did.',
    'Fullscreen unavailable. Check your browser permissions or exit fullscreen and try again.',
  ]);
  const orphans = Object.keys(germanSettings).filter(key => !live.has(key));
  assert.deepEqual(orphans, [], `Settings entries nothing asks for: ${orphans.join(' / ')}`);
});
