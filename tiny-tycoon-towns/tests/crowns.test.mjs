import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileCrowns, emptyCharter } from '../src/domain/charters.js';

const town = (convoys) => ({ convoys });

test('settled convoys with crowns are credited once', () => {
  const t = town([
    { id: 'a-k1', status: 'settled', payout: { crowns: 3 } },
    { id: 'a-k2', status: 'settled', payout: { crowns: 2 } },
  ]);
  const r = reconcileCrowns(emptyCharter(), t);
  assert.equal(r.changed, true);
  assert.equal(r.charter.crowns, 5);
  assert.equal(r.charter.creditedConvoys['a-k1'], true);
  // Zweiter Lauf auf dem Ergebnis ändert nichts (idempotent).
  const again = reconcileCrowns(r.charter, t);
  assert.equal(again.changed, false);
  assert.equal(again.charter.crowns, 5);
});

test('convoys that are not settled or carry no crowns are ignored', () => {
  const t = town([
    { id: 'b-k1', status: 'travelling', payout: undefined },
    { id: 'b-k2', status: 'arrived' },
    { id: 'b-k3', status: 'settled', payout: { crowns: 0 } },
  ]);
  const r = reconcileCrowns(emptyCharter(), t);
  assert.equal(r.changed, false);
  assert.equal(r.charter.crowns ?? 0, 0);
});

test('a missed credit is caught up later from the town state', () => {
  const t = town([{ id: 'c-k1', status: 'settled', payout: { crowns: 4 } }]);
  const old = { ...emptyCharter(), crowns: 10 };
  const r = reconcileCrowns(old, t);
  assert.equal(r.charter.crowns, 14);
});

test('a missing town and missing convoys do not throw', () => {
  assert.equal(reconcileCrowns(null, null).changed, false);
  assert.equal(reconcileCrowns(emptyCharter(), {}).changed, false);
});
