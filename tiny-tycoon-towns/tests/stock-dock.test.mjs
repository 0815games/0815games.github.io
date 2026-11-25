import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fullResources, fillPercent } from '../src/stock-dock.js';

test('fullResources lists only resources at the cap', () => {
  const stock = { grain: 100, lumber: 99, stone: 120 };
  assert.deepEqual(fullResources(stock, 100, ['grain', 'lumber', 'stone', 'coal']), ['grain', 'stone']);
});

test('fillPercent clamps to 0..100 and handles a missing cap', () => {
  assert.equal(fillPercent(50, 200), 25);
  assert.equal(fillPercent(300, 200), 100);
  assert.equal(fillPercent(-5, 200), 0);
  assert.equal(fillPercent(10, 0), 0);
});
