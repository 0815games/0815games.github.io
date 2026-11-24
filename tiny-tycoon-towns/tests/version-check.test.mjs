// Versions-Gate (ported from IronPath core/version-check.mjs): parse, probe, and reload coordination.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePublishedVersion, createVersionProbe, createVersionCoordinator } from '../src/version-check.mjs';

const ORIGIN = 'https://0815games.github.io';
const URL_ = `${ORIGIN}/tiny-tycoon-towns/release-version.json`;
const json = (obj) => new Response(JSON.stringify(obj), { status: 200 });

test('parsePublishedVersion accepts only format 1 with a valid build', () => {
  assert.deepEqual(parsePublishedVersion({ format: 1, build: 'test-build-1' }), { build: 'test-build-1' });
  assert.equal(parsePublishedVersion({ build: 'test-build-1' }), null);
  assert.equal(parsePublishedVersion({ format: 1, build: 'Bad Build' }), null);
  assert.equal(parsePublishedVersion({ format: 1, build: 'x', extra: 1 }), null);
});

test('probe reports current, outdated and unavailable', async () => {
  const cur = createVersionProbe({ url: URL_, origin: ORIGIN, build: 'a1', fetcher: async () => json({ format: 1, build: 'a1' }) });
  assert.equal((await cur()).kind, 'current');
  const old = createVersionProbe({ url: URL_, origin: ORIGIN, build: 'a1', fetcher: async () => json({ format: 1, build: 'b2' }) });
  assert.deepEqual(await old(), { kind: 'outdated', build: 'b2' });
  const down = createVersionProbe({ url: URL_, origin: ORIGIN, build: 'a1', fetcher: async () => new Response('', { status: 503 }) });
  assert.equal((await down()).kind, 'unavailable');
});

test('probe adds a fresh probe parameter on every call', async () => {
  const seen = [];
  const p = createVersionProbe({ url: URL_, origin: ORIGIN, build: 'a1',
    fetcher: async (u) => { seen.push(u); return json({ format: 1, build: 'a1' }); } });
  await p(); await p();
  assert.notEqual(new URL(seen[0]).searchParams.get('probe'), new URL(seen[1]).searchParams.get('probe'));
});

test('coordinator reloads only when the game is safe', async () => {
  let reloaded = null;
  let safe = 'saving';
  const timers = [];
  const coord = createVersionCoordinator({
    probe: async () => ({ kind: 'outdated', build: 'b2' }),
    safety: () => safe,
    onStatus: () => {},
    reload: (b) => { reloaded = b; },
    setTimer: (fn) => { timers.push(fn); return timers.length; },
    clearTimer: () => {},
    retryMs: 50,
  });
  assert.equal(await coord.check(), false);
  assert.equal(reloaded, null, 'no reload while saving');
  safe = 'ready';
  timers.shift()?.();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(reloaded, 'b2');
});
