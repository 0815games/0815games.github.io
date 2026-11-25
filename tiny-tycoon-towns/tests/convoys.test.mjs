import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createTown, advance, hydrateTown } from '../src/domain/engine.js';
import { startConvoy, activeConvoys } from '../src/domain/convoys.js';
import { applyCharterToData, emptyCharter, grantCharters, buyPerk } from '../src/domain/charters.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, '..', 'data', f), 'utf8'));
const data = {
  resources: load('resources.json'),
  biomes: load('biomes.json'),
  buildings: load('buildings.json'),
  economy: { ...load('economy.json'), expressLevel: 0 },
  merchant: load('merchant.json'),
};
const NOW = Date.UTC(2026, 10, 24, 8, 0, 0);
const MIN = 60_000;
const ctx = (extra = {}) => ({ data, nowMs: NOW, ...extra });
const town = (over = {}) => {
  const t = createTown({ name: 'T', biome: 'riverlands', seed: 7, now: NOW, data });
  return { ...t, coins: 10_000, stock: { ...t.stock, grain: 500, lumber: 500, stone: 500 }, ...over };
};
const partner = { id: 'eichenfeld', distance: 2 };

test('an export takes the goods out of stock and starts a convoy', () => {
  const r = startConvoy(town(), { partner, direction: 'export', resource: 'grain', qty: 20 }, ctx());
  assert.equal(r.error, undefined);
  assert.equal(r.state.stock.grain, 480);
  assert.equal(r.state.convoys.length, 1);
  const c = r.state.convoys[0];
  assert.equal(c.status, 'travelling');
  assert.equal(c.arriveAt - c.departAt, 180 * MIN); // 120 + 30 × 2
});

test('an import pays the coins at departure and arrives later', () => {
  const r = startConvoy(town(), { partner, direction: 'import', resource: 'honey', qty: 10 }, ctx());
  assert.equal(r.error, undefined);
  assert.equal(r.state.coins, 10_000 - Math.ceil(10 * data.resources.honey.basePrice * 1.8));
  assert.equal(r.state.convoys[0].direction, 'import');
});

test('the input state is never mutated', () => {
  const t = town();
  const before = JSON.stringify(t);
  startConvoy(t, { partner, direction: 'export', resource: 'grain', qty: 20 }, ctx());
  assert.equal(JSON.stringify(t), before);
});

test('no more than two convoys at once', () => {
  let s = town();
  for (let i = 0; i < 2; i++) {
    const r = startConvoy(s, { partner, direction: 'export', resource: 'grain', qty: 10 }, ctx());
    assert.equal(r.error, undefined);
    s = r.state;
  }
  assert.equal(activeConvoys(s).length, 2);
  const third = startConvoy(s, { partner, direction: 'export', resource: 'grain', qty: 10 }, ctx());
  assert.equal(third.error, 'convoyLimit');
});

test('export needs enough stock, import needs enough coins', () => {
  const poor = town({ stock: { ...town().stock, grain: 5 } });
  assert.equal(startConvoy(poor, { partner, direction: 'export', resource: 'grain', qty: 10 }, ctx()).error, 'noStock');
  const broke = town({ coins: 1 });
  assert.equal(startConvoy(broke, { partner, direction: 'import', resource: 'honey', qty: 10 }, ctx()).error, 'noCoins');
});

test('input checks: quantity, direction, resource, partner', () => {
  const t = town();
  assert.equal(startConvoy(t, { partner, direction: 'export', resource: 'grain', qty: 9 }, ctx()).error, 'badQuantity');
  assert.equal(startConvoy(t, { partner, direction: 'trade', resource: 'grain', qty: 10 }, ctx()).error, 'badDirection');
  assert.equal(startConvoy(t, { partner, direction: 'export', resource: 'gold', qty: 10 }, ctx()).error, 'unknownResource');
  assert.equal(startConvoy(t, { partner: null, direction: 'export', resource: 'grain', qty: 10 }, ctx()).error, 'noPartner');
});

test('advance marks a convoy as arrived once its time has passed, exactly once', () => {
  const r = startConvoy(town(), { partner, direction: 'export', resource: 'grain', qty: 10 }, ctx());
  const id = r.state.convoys[0].id;
  const arriveAt = r.state.convoys[0].arriveAt;
  const before = advance(r.state, arriveAt - MIN, ctx());
  assert.equal(before.state.convoys[0].status, 'travelling');
  const at = advance(before.state, arriveAt, ctx());
  assert.equal(at.state.convoys[0].status, 'arrived');
  assert.deepEqual(at.events.filter((e) => e.type === 'convoy_arrive').map((e) => e.id), [id]);
  const again = advance(at.state, arriveAt + 10 * MIN, ctx());
  assert.equal(again.events.filter((e) => e.type === 'convoy_arrive').length, 0);
});

test('arrived convoys no longer count against the limit', () => {
  let s = town();
  for (let i = 0; i < 2; i++) s = startConvoy(s, { partner, direction: 'export', resource: 'grain', qty: 10 }, ctx()).state;
  const done = advance(s, s.convoys[0].arriveAt + 1, ctx()).state;
  // Beide Konvois fahren gleich lang und kommen gleichzeitig an: danach ist das Limit wieder frei.
  assert.equal(done.convoys.every((c) => c.status === 'arrived'), true);
  assert.equal(activeConvoys(done).length, 0);
  const next = startConvoy(done, { partner, direction: 'export', resource: 'grain', qty: 10 }, ctx({ nowMs: done.lastTick }));
  assert.equal(next.error, undefined);
});

test('Eilpost shortens the convoy duration via the charter perk', () => {
  let c = grantCharters(emptyCharter(), { id: 'x', lifetimeCoins: 900_000 }); // 3 Freibriefe
  c = buyPerk(c, 'express').charter;
  c = buyPerk(c, 'express').charter;
  c = buyPerk(c, 'express').charter; // Stufe 3 = −15 %
  const boosted = applyCharterToData(data, c);
  assert.equal(boosted.economy.expressLevel, 3);
  const far = { id: 'wiesenau', distance: 10 };
  const r = startConvoy(town(), { partner: far, direction: 'export', resource: 'grain', qty: 10 }, { data: boosted, nowMs: NOW });
  assert.equal(r.state.convoys[0].arriveAt - NOW, Math.round(420 * 0.85) * MIN);
});

test('towns saved before convoys existed load with an empty convoy list', () => {
  const old = town();
  delete old.convoys;
  delete old.convoySeq;
  const loaded = hydrateTown(old);
  assert.deepEqual(loaded.convoys, []);
  assert.equal(loaded.convoySeq, 0);
});
