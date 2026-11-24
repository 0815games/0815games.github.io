import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createTown, hydrateTown, placeBuilding } from '../src/domain/engine.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, '..', 'data', f), 'utf8'));
const data = {
  resources: load('resources.json'), biomes: load('biomes.json'), buildings: load('buildings.json'),
  economy: load('economy.json'), merchant: load('merchant.json'),
};

test('a town survives a Realtime Database round trip (empty objects dropped)', () => {
  const t = createTown({ name: 'Rund', biome: 'coast', seed: 5, now: 1000, data });
  // RTDB removes empty objects and null values on write.
  const stored = JSON.parse(JSON.stringify(t));
  delete stored.merchant.bought;
  delete stored.merchant.dateKey;
  const back = hydrateTown(stored);
  assert.deepEqual(back.merchant, { dateKey: null, bought: {} });
  assert.equal(back.tiles['4,4'].building.id, 'townHall');
  // Actions must work on the hydrated town.
  const r = placeBuilding(back, { x: 2, y: 2, buildingId: 'farm' }, { data, dateKey: '2026-11-24' });
  assert.equal(r.error, undefined);
});

test('hydrate does not mutate its input', () => {
  const raw = { schemaVersion: 1, merchant: {} };
  hydrateTown(raw);
  assert.deepEqual(raw, { schemaVersion: 1, merchant: {} });
});
