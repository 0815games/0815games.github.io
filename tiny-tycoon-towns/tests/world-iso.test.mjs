import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toScreen, toTile, hash } from '../src/world/iso.js';

test('toTile inverts toScreen on the ground plane', () => {
  for (const [x, y] of [[0, 0], [4.5, 4.5], [-3, 12], [9.25, 0.5]]) {
    const p = toTile(toScreen(x, y).x, toScreen(x, y).y);
    assert.ok(Math.abs(p.x - x) < 1e-9 && Math.abs(p.y - y) < 1e-9, `${x},${y} -> ${p.x},${p.y}`);
  }
});

test('height lifts a point straight up on screen', () => {
  const a = toScreen(2, 3, 0), b = toScreen(2, 3, 30);
  assert.equal(a.x, b.x);
  assert.equal(a.y - b.y, 30);
});

test('hash is stable and in [0, 1)', () => {
  for (let x = -5; x < 15; x++) for (let y = -5; y < 15; y++) {
    const h = hash(x, y, 3);
    assert.ok(h >= 0 && h < 1);
    assert.equal(h, hash(x, y, 3));
  }
  assert.notEqual(hash(1, 2, 0), hash(2, 1, 0));
});
