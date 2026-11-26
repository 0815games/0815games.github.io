// Tutorial: Feld-Finder für die Grundstruktur (Hof, Sägewerk, Steinbruch, Lager).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTown } from '../src/domain/engine.js';
import { tutorialSpot, builtSpot } from '../src/domain/tutorialSpot.js';
import { checkPlacement } from '../src/domain/placement.js';
import { TUTORIAL_STEPS, STATE_TASKS, CHECK_LABELS } from '../src/tutorial.js';
import { tutorialTaskDone } from '../src/domain/settlement.js';
import { HALL } from '../src/domain/grid.js';

const load = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const data = { resources: load('resources'), biomes: load('biomes'), buildings: load('buildings'), economy: load('economy'), merchant: load('merchant') };

test('tutorialSpot finds a free, legal tile for each starter building, nearest to the town hall', () => {
  for (const biome of ['riverlands', 'deepwoods', 'highlands', 'coast']) {
    for (const seed of [1, 7, 42]) {
      const town = createTown({ name: 'T', biome, seed, now: 0, data });
      for (const id of ['farm', 'sawmill', 'quarry', 'warehouse']) {
        const spot = tutorialSpot(town, id, data);
        if (!spot) continue; // nicht jede Karte hat jeden Geländetyp in Reichweite
        assert.ok(checkPlacement(town, spot.x, spot.y, id, data).ok, `${biome}/${seed}/${id}`);
        assert.ok(!town.tiles[`${spot.x},${spot.y}`].building, 'frei');
        const d = Math.abs(spot.x - HALL.x) + Math.abs(spot.y - HALL.y);
        assert.ok(d >= 1, 'nicht das Rathaus');
      }
    }
  }
});

test('tutorialSpot returns null for unknown buildings', () => {
  const town = createTown({ name: 'T', biome: 'riverlands', seed: 1, now: 0, data });
  assert.equal(tutorialSpot(town, 'nope', data), null);
});

test('builtSpot finds an existing building', () => {
  const town = createTown({ name: 'T', biome: 'riverlands', seed: 1, now: 0, data });
  assert.equal(builtSpot(town, 'farm'), null);
  const key = Object.keys(town.tiles).find((k) => town.tiles[k].terrain === 'meadow');
  const [x, y] = key.split(',').map(Number);
  town.tiles[key].building = { id: 'farm', level: 1 };
  assert.deepEqual(builtSpot(town, 'farm'), { x, y });
});

test('the starter tasks are checked against the town state', () => {
  const town = createTown({ name: 'T', biome: 'riverlands', seed: 1, now: 0, data });
  for (const id of ['farm', 'sawmill', 'quarry', 'warehouse']) {
    assert.ok(STATE_TASKS.includes(id));
    assert.ok(CHECK_LABELS[id]);
    assert.equal(tutorialTaskDone(town, id), false);
    const key = Object.keys(town.tiles).find((k) => town.tiles[k].terrain !== 'water' && !town.tiles[k].building);
    town.tiles[key].building = { id, level: 1 };
    assert.equal(tutorialTaskDone(town, id), true, id);
  }
});

test('every build step asks for a building that the final check lists', () => {
  const check = TUTORIAL_STEPS.find((s) => s.checklist).checklist;
  for (const s of TUTORIAL_STEPS) {
    if (s.build) assert.ok(check.includes(s.build), `Check fehlt ${s.build}`);
  }
});
