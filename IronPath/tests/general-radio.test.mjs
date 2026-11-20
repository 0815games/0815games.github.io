import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERAL_RADIO_SCRIPTS,
  tutorialVoicePath,
  tutorialRadioSubtitle,
  createGeneralRadio,
} from '../general-radio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function makeFakeDoc() {
  const nodes = new Map();
  for (const prefix of ['dossierRadio', 'coachRadio', 'guideRadio', 'menuTourRadio']) {
    for (const suffix of ['Speaker', 'Subtitle', 'Status', 'Mute']) {
      const id = `${prefix}${suffix}`;
      nodes.set(id, { id, textContent: '', hidden: false, dataset: {}, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } });
    }
  }
  return { getElementById: id => nodes.get(id) ?? null, nodes };
}

test('every General Vance radio clip provides authentic EN & DE scripts with unique text', () => {
  const keys = Object.keys(GENERAL_RADIO_SCRIPTS);
  assert.equal(keys.length, 18);
  for (const id of keys) {
    const entry = GENERAL_RADIO_SCRIPTS[id];
    assert.ok(entry.en && entry.en.length >= 30, `${id} has EN script`);
    assert.ok(entry.de && entry.de.length >= 30, `${id} has DE script`);
    assert.notEqual(entry.en, entry.de, `${id} EN & DE differ`);
    assert.equal(tutorialVoicePath(id, 'en'), `assets/voice/en/tutorial/${id}.mp3`);
    assert.equal(tutorialVoicePath(id, 'de'), `assets/voice/de/tutorial/${id}.mp3`);
  }
  assert.ok(tutorialRadioSubtitle('dossier-offer', 'en').includes('General Vance'));
});

test('General Vance audio works gracefully offline/muted, updates subtitle/DOM and notifies toggle callback', () => {
  const doc = makeFakeDoc();
  const createdAudio = [];
  class MockAudio {
    constructor(src) {
      this.src = src;
      this.volume = 1;
      this.paused = false;
      createdAudio.push(this);
    }
    play() { return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  let toggled = null;
  const radio = createGeneralRadio({
    AudioCtor: MockAudio,
    initialPrefs: { voiceOver: true, soundEnabled: true, volume: 0.6 },
    onToggleVoiceOver: next => { toggled = next; },
    document: doc,
  });

  assert.equal(radio.play('mission-welcome', { speak: true }), true);
  assert.equal(createdAudio.length, 1);
  assert.equal(createdAudio[0].volume, 0.6);
  assert.equal(doc.nodes.get('coachRadioSubtitle').hidden, false);
  assert.ok(doc.nodes.get('coachRadioSubtitle').textContent.length > 20);

  // Muting stops playback immediately and keeps subtitle visible in text fallback mode
  assert.equal(radio.toggleMute(), false);
  assert.equal(toggled, false);
  assert.equal(createdAudio[0].paused, true);
  assert.equal(radio.snapshot().audible, false);
  assert.equal(doc.nodes.get('coachRadioMute').attrs['aria-pressed'], 'true');

  // Calling stop() clears subtitle cleanly and hides all bound <p> subtitle nodes
  radio.stop();
  assert.equal(doc.nodes.get('coachRadioSubtitle').textContent, '');
  assert.equal(doc.nodes.get('coachRadioSubtitle').hidden, true);
});

test('all 18 EN and 18 DE General Vance voice MP3 files exist on disk and are non-empty', () => {
  for (const lang of ['en', 'de']) {
    for (const clip of Object.keys(GENERAL_RADIO_SCRIPTS)) {
      const file = resolve(root, tutorialVoicePath(clip, lang));
      assert.equal(existsSync(file), true, `${lang}:${file} exists`);
      assert.ok(statSync(file).size > 2000, `${lang}:${file} has audio content`);
    }
  }
});
