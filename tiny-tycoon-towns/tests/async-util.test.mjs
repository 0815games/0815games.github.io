import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout } from '../src/async-util.js';

test('a fast promise passes its value through', async () => {
  assert.equal(await withTimeout(Promise.resolve(42), 1000), 42);
});

test('a fast rejection stays a rejection, not a timeout', async () => {
  await assert.rejects(withTimeout(Promise.reject(new Error('permission_denied')), 1000), /permission_denied/);
});

test('a hanging promise times out with code "timeout" (bissfest)', async () => {
  const never = new Promise(() => {});
  await assert.rejects(withTimeout(never, 20, 'Cloud'), (e) => e.code === 'timeout' && /Cloud/.test(e.message));
});
