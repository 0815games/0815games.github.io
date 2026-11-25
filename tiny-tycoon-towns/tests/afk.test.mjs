import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAfk, startAfkWatch, AFK_LIMIT_MS } from '../src/afk.js';

function fakeTarget() {
  const handlers = new Map();
  return {
    handlers,
    addEventListener(ev, fn) { handlers.set(ev, [...(handlers.get(ev) ?? []), fn]); },
    removeEventListener(ev, fn) { handlers.set(ev, (handlers.get(ev) ?? []).filter((f) => f !== fn)); },
    fire(ev) { for (const fn of handlers.get(ev) ?? []) fn(); },
    count() { let n = 0; for (const list of handlers.values()) n += list.length; return n; },
  };
}

test('AFK limit is five minutes', () => {
  assert.equal(AFK_LIMIT_MS, 300_000);
});

test('isAfk: exactly at the limit counts as AFK, one ms before does not', () => {
  assert.equal(isAfk(0, AFK_LIMIT_MS - 1), false);
  assert.equal(isAfk(0, AFK_LIMIT_MS), true);
  assert.equal(isAfk(NaN, 10 * AFK_LIMIT_MS), false);
});

test('AFK fires once after the limit, not before', () => {
  let now = 0;
  const target = fakeTarget();
  let calls = 0;
  const stop = startAfkWatch(() => { calls += 1; }, { limitMs: 100, checkMs: 600_000, now: () => now, target });
  now = 99; stop.check();
  assert.equal(calls, 0);
  now = 100; stop.check();
  assert.equal(calls, 1);
  now = 500; stop.check();
  assert.equal(calls, 1, 'no second logout');
});

test('activity resets the idle clock', () => {
  let now = 0;
  const target = fakeTarget();
  let calls = 0;
  const stop = startAfkWatch(() => { calls += 1; }, { limitMs: 100, checkMs: 600_000, now: () => now, target });
  now = 80; target.fire('pointerdown');
  now = 150; stop.check();
  assert.equal(calls, 0, '70 ms since the last input, still active');
  now = 181; stop.check();
  assert.equal(calls, 1);
  stop();
});

test('stop removes listeners and prevents firing', () => {
  let now = 0;
  const target = fakeTarget();
  let calls = 0;
  const stop = startAfkWatch(() => { calls += 1; }, { limitMs: 100, checkMs: 600_000, now: () => now, target });
  assert.ok(target.count() > 0);
  stop();
  assert.equal(target.count(), 0);
  now = 1000; stop.check();
  assert.equal(calls, 0, 'stopped watch never fires');
});
