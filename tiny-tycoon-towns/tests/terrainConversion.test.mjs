import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { keyOf, isUnlocked } from '../src/domain/grid.js';
import { createTown, convertTerrain, conversionCost, placeBuilding } from '../src/domain/engine.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, '..', 'data', f), 'utf8'));
const data = {
  resources: load('resources.json'),
  biomes: load('biomes.json'),
  buildings: load('buildings.json'),
  economy: load('economy.json'),
  merchant: load('merchant.json'),
  npcs: load('npcs.json'),
};
const ctx = { data, maxElapsedSec: 0, dateKey: null };

function town(extra = {}) {
  const s = createTown({ name: 'T', biome: 'riverlands', seed: 777, now: 0, data, mapSize: 10 });
  return { ...s, coins: 100000, ...extra };
}

// Erste freigeschaltete, freie Wiesen-Kachel ohne Gebäude.
function freeMeadow(s) {
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {
    const t = s.tiles[keyOf(x, y)];
    if (isUnlocked(x, y, s.townLevel, data, 10) && t && !t.building && !t.field && t.terrain === 'meadow') return { x, y };
  }
  return null;
}

test('Wandlung: Wiese wird Wasser, Münzen fallen, Zähler steigt', () => {
  const s = town();
  const { x, y } = freeMeadow(s);
  const cost = conversionCost(s, x, y, data);
  const r = convertTerrain(s, { x, y, terrain: 'water' }, ctx);
  assert.equal(r.error, undefined);
  assert.equal(r.state.tiles[keyOf(x, y)].terrain, 'water');
  assert.equal(r.state.coins, s.coins - cost);
  assert.equal(r.state.terrainConversions, 1);
  assert.equal(s.tiles[keyOf(x, y)].terrain, 'meadow', 'Eingabezustand bleibt unverändert');
});

test('Wandlung: außerhalb des freigeschalteten Bereichs gesperrt', () => {
  const s = town();
  let spot = null;
  for (let y = 0; y < 10 && !spot; y++) for (let x = 0; x < 10 && !spot; x++) {
    if (!isUnlocked(x, y, s.townLevel, data, 10)) spot = { x, y };
  }
  assert.ok(spot, 'es gibt eine gesperrte Kachel');
  const r = convertTerrain(s, { ...spot, terrain: 'water' }, ctx);
  assert.equal(r.error, 'locked');
});

test('Wandlung: Kachel mit Gebäude gesperrt, gleiches Gelände gesperrt', () => {
  const s = town();
  const { x, y } = freeMeadow(s);
  const built = placeBuilding(s, { x, y, buildingId: 'farm' }, ctx);
  assert.equal(built.error, undefined, 'Test braucht eine Farm');
  assert.equal(convertTerrain(built.state, { x, y, terrain: 'water' }, ctx).error, 'occupied');

  const m = freeMeadow(s);
  assert.equal(convertTerrain(s, { ...m, terrain: 'meadow' }, ctx).error, 'sameTerrain');
});

test('Wandlung: ohne genug Münzen gesperrt', () => {
  const s = town({ coins: 0 });
  const { x, y } = freeMeadow(s);
  assert.equal(convertTerrain(s, { x, y, terrain: 'water' }, ctx).error, 'noCoins');
});

test('Kosten: je Kachel verschieden (Zufall), bei gleicher Lage gleich', () => {
  const s = town();
  const costs = new Set();
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) costs.add(conversionCost(s, x, y, data));
  assert.ok(costs.size > 5, 'Kosten streuen über die Kacheln');
  assert.equal(conversionCost(s, 3, 4, data), conversionCost(s, 3, 4, data));
});

test('Kosten: wachsen mit jeder Wandlung (kleinster Preis später größer als größter früher)', () => {
  const c = data.economy.terrainConversion;
  const early = { ...town(), terrainConversions: 0 };
  const late = { ...town(), terrainConversions: 5 };
  const maxEarly = Math.max(...Array.from({ length: 100 }, (_, i) => conversionCost(early, i % 10, Math.floor(i / 10), data)));
  const minLate = Math.min(...Array.from({ length: 100 }, (_, i) => conversionCost(late, i % 10, Math.floor(i / 10), data)));
  assert.ok(minLate > maxEarly, `minLate ${minLate} > maxEarly ${maxEarly}`);
  assert.ok(c.growthPerConversion > 1);
});
