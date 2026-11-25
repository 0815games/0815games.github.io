// Tutorial: Fortschritt im Spielstand (domain) und Zielbereiche im HTML.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTown, setTutorialStep } from '../src/domain/engine.js';
import { TUTORIAL_STEPS, HELP_SECTIONS } from '../src/tutorial.js';

const load = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const data = { resources: load('resources'), biomes: load('biomes'), buildings: load('buildings'), economy: load('economy'), merchant: load('merchant') };

test('setTutorialStep stores progress in the town and rejects bad values', () => {
  const town = createTown({ name: 'Test', biome: 'riverlands', seed: 7, now: 0, data });
  assert.equal(town.tutorialStep, 0);
  const r = setTutorialStep(town, 3);
  assert.equal(r.state.tutorialStep, 3);
  assert.equal(town.tutorialStep, 0, 'input state is not mutated');
  assert.ok(setTutorialStep(town, -1).error);
  assert.ok(setTutorialStep(town, 1.5).error);
});

test('every tutorial target exists in index.html', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const step of TUTORIAL_STEPS) {
    if (!step.target) continue;
    const id = step.target.replace(/^#/, '');
    assert.ok(html.includes(`id="${id}"`), `missing ${step.target}`);
  }
});

test('help has content for every section', () => {
  assert.ok(HELP_SECTIONS.length >= 6);
  for (const s of HELP_SECTIONS) assert.ok(s.title && s.paragraphs.length > 0);
});

import { tutorialResume, tutorialStored, TUTORIAL_STORE_OFFSET, CHECK_LABELS } from '../src/tutorial.js';

test('tutorialResume: new towns get the offer, old finished accounts get nothing, progress resumes', () => {
  assert.equal(tutorialResume(0), 'offer', 'neue Stadt: einmal anbieten');
  assert.equal(tutorialResume(3), 3, 'alter Lauf in Arbeit');
  assert.equal(tutorialResume(8), 'offer', 'alte, abgeschlossene Konten bekommen das Angebot einmal');
  assert.equal(tutorialResume(tutorialStored(0)), 0);
  assert.equal(tutorialResume(tutorialStored(9)), 9, 'neuer Lauf wird fortgesetzt');
  assert.equal(tutorialResume(tutorialStored(TUTORIAL_STEPS.length)), null, 'neuer Lauf fertig');
  assert.equal(TUTORIAL_STORE_OFFSET, 100);
});

test('setTutorialStep accepts the stored values of the new run', () => {
  const town = createTown({ name: 'Test', biome: 'riverlands', seed: 7, now: 0, data });
  assert.equal(setTutorialStep(town, tutorialStored(5)).state.tutorialStep, 105);
});

test('every checklist item has a label, and every task step has a known task', () => {
  for (const step of TUTORIAL_STEPS) {
    for (const t of step.checklist ?? []) assert.ok(CHECK_LABELS[t], `Bezeichnung für ${t}`);
    if (step.task) assert.ok(['build', 'house', 'worker'].includes(step.task), step.task);
  }
});
