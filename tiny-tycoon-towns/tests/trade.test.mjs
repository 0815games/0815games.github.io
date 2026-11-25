import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  convoyDurationMin, distanceTax, isValidQuantity, crownsFor, exportPayout, importCost,
  CONVOY_MAX_MIN, MAX_ACTIVE_CONVOYS, IMPORT_PRICE_FACTOR,
} from '../src/domain/trade.js';
import { readFileSync } from 'node:fs';

const npcs = JSON.parse(readFileSync(new URL('../data/npcs.json', import.meta.url), 'utf8'));

test('convoy duration is 120 min + 30 min per field, capped at 480', () => {
  assert.equal(convoyDurationMin(1), 150);
  assert.equal(convoyDurationMin(10), 420);
  assert.equal(CONVOY_MAX_MIN, 480);
  assert.throws(() => convoyDurationMin(0));
  assert.throws(() => convoyDurationMin(11));
});

test('Eilpost shortens the duration by 5 % per level, max level 5 = −25 %', () => {
  assert.equal(convoyDurationMin(10, 0), 420);
  assert.equal(convoyDurationMin(10, 1), 399); // 420 × 0,95
  assert.equal(convoyDurationMin(10, 5), 315); // 420 × 0,75
  assert.equal(convoyDurationMin(10, 9), 315); // Stufe wird auf 5 gedeckelt
});

test('distance tax is 1 % per field, capped at 15 %', () => {
  assert.equal(distanceTax(0), 0);
  assert.equal(distanceTax(5), 0.05);
  assert.equal(distanceTax(10), 0.1);
});

test('quantity must be an integer from 10 to 100', () => {
  assert.equal(isValidQuantity(10), true);
  assert.equal(isValidQuantity(100), true);
  assert.equal(isValidQuantity(9), false);
  assert.equal(isValidQuantity(101), false);
  assert.equal(isValidQuantity(12.5), false);
});

test('crowns are floor(goods value / 300)', () => {
  assert.equal(crownsFor(10, 2), 0);   // 20
  assert.equal(crownsFor(100, 6), 2);  // 600
  assert.equal(crownsFor(50, 6), 1);   // 300
});

test('export pays 0.9 × base price minus distance tax, plus crowns', () => {
  // 20 × 4 × 0,9 = 72, Distanz 5 → −5 % → 68,4 → 68
  assert.deepEqual(exportPayout({ qty: 20, basePrice: 4, distance: 5 }), { coins: 68, crowns: 0 });
});

test('reciprocity gives +25 % on export, not on import', () => {
  const plain = exportPayout({ qty: 20, basePrice: 4, distance: 0 }).coins;
  const recip = exportPayout({ qty: 20, basePrice: 4, distance: 0, reciprocal: true }).coins;
  assert.equal(recip, Math.floor(plain * 1.25));
});

test('import costs 1.8 × base price, arrived quantity reduced by distance tax', () => {
  const r = importCost({ qty: 20, basePrice: 4, distance: 10 });
  assert.equal(r.coins, 144);   // 20 × 4 × 1,8
  assert.equal(r.arrived, 18);  // 20 × (1 − 0,10)
});

test('import is cheaper than the merchant (merchant min 2.5 × base price)', () => {
  assert.ok(IMPORT_PRICE_FACTOR < 2.5);
  const merchantMin = Math.ceil(4 * 2.5);
  assert.ok(importCost({ qty: 1, basePrice: 4, distance: 0 }).coins < merchantMin);
});

test('at most two convoys may be active at once', () => {
  assert.equal(MAX_ACTIVE_CONVOYS, 2);
});

test('npcs.json has 8 towns with valid distance 1 to 10 and unique ids', () => {
  assert.equal(npcs.towns.length, 8);
  const ids = new Set(npcs.towns.map((t) => t.id));
  assert.equal(ids.size, 8);
  for (const t of npcs.towns) {
    assert.ok(Number.isInteger(t.distance) && t.distance >= 1 && t.distance <= 10, t.id);
  }
});
