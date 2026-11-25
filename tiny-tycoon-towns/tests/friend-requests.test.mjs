import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextRequestToShow, requestBadgeLabel } from '../src/friend-requests.js';

test('nextRequestToShow returns the first request not shown yet', () => {
  const pending = [{ from: 'a', name: 'A' }, { from: 'b', name: 'B' }];
  assert.deepEqual(nextRequestToShow(pending, new Set()), { from: 'a', name: 'A' });
  assert.deepEqual(nextRequestToShow(pending, new Set(['a'])), { from: 'b', name: 'B' });
  assert.equal(nextRequestToShow(pending, new Set(['a', 'b'])), null);
  assert.equal(nextRequestToShow([], new Set()), null);
});

test('requestBadgeLabel pluralises and falls back to Menü', () => {
  assert.equal(requestBadgeLabel(0), 'Menü');
  assert.equal(requestBadgeLabel(1), 'Menü, 1 Freundschaftsanfrage');
  assert.equal(requestBadgeLabel(3), 'Menü, 3 Freundschaftsanfragen');
});
