import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { fnv1a, mulberry32 } from '../src/domain/rng.js';
import { generateTerrain } from '../src/domain/terrain.js';
import { keyOf, isUnlocked, gridSize } from '../src/domain/grid.js';
import {
  buildCost, productionMultiplier, ratePerMin, storageCap,
  throughputPerMin, townLevelFor, classOf,
} from '../src/domain/economy.js';
import { merchantOffers, localDateKey } from '../src/domain/merchant.js';
import {
  createTown, placeBuilding, upgradeBuilding, toggleSell, buyOffer, advance,
} from '../src/domain/engine.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, '..', 'data', f), 'utf8'));
const data = {
  resources: load('resources.json'),
  biomes: load('biomes.json'),
  buildings: load('buildings.json'),
  economy: load('economy.json'),
  merchant: load('merchant.json'),
};
const NOW = Date.UTC(2026, 10, 24, 8, 0, 0);
const ctx = (extra = {}) => ({ data, dateKey: '2026-11-24', ...extra });

/** Test town with a given biome and empty tiles except the hall. */
function townFor(biome = 'riverlands', seed = 42) {
  const t = createTown({ name: 'Testhausen', biome, seed, now: NOW, data });
  return t;
}

/** Puts a terrain-independent building directly onto a tile (test setup). */
function withBuilding(state, x, y, id, level = 1, terrain) {
  const s = structuredClone(state);
  s.tiles[keyOf(x, y)].building = { id, level };
  if (terrain) s.tiles[keyOf(x, y)].terrain = terrain;
  return s;
}

test('rng is deterministic', () => {
  assert.equal(fnv1a('abc'), fnv1a('abc'));
  const a = mulberry32(7);
  const b = mulberry32(7);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
});

test('town starts with 10x10 tiles, hall in the middle, scarce resources kept', () => {
  const t = townFor('riverlands');
  assert.equal(Object.keys(t.tiles).length, 100);
  assert.equal(t.tiles['4,4'].building.id, 'townHall');
  assert.equal(t.coins, 150);
  assert.equal(t.sellEnabled.stone, false);   // scarce in riverlands
  assert.equal(t.sellEnabled.grain, true);    // abundant
  assert.equal(t.sellEnabled.iron, true);     // neutral
});

test('terrain generator is seeded and always has meadow at hall', () => {
  for (const biome of ['riverlands', 'deepwoods', 'highlands', 'coast']) {
    const a = generateTerrain(biome, 99);
    const b = generateTerrain(biome, 99);
    assert.deepEqual(a, b);
    assert.equal(a[4][4], 'meadow');
  }
});

test('biome classes follow the plan', () => {
  assert.equal(classOf('coast', 'pearls', data), 'abundant');
  assert.equal(classOf('coast', 'iron', data), 'scarce');
  assert.equal(classOf('coast', 'grain', data), 'neutral');
});

test('grid unlock is centered and grows with town level', () => {
  assert.equal(gridSize(1, data), 6);
  assert.equal(gridSize(3, data), 7);
  assert.equal(gridSize(12, data), 10);
  assert.equal(isUnlocked(2, 2, 1, data), true);
  assert.equal(isUnlocked(1, 1, 1, data), false);
  assert.equal(isUnlocked(0, 0, 5, data), false);
  assert.equal(isUnlocked(1, 1, 3, data), true); // 7x7 starts at 1
});

test('town level thresholds', () => {
  const th = data.economy.townLevelThresholds;
  assert.equal(townLevelFor(0, th), 1);
  assert.equal(townLevelFor(49, th), 1);
  assert.equal(townLevelFor(50, th), 2);
  assert.equal(townLevelFor(24000, th), 12);
});

test('build and upgrade costs use the growth formulas (ceil)', () => {
  assert.deepEqual(buildCost('farm', 0, data), { coins: 40, material: { resource: 'lumber', amount: 5 } });
  // L=1: coins ceil(40*1.15)=46, material ceil(5*1.08)=6
  assert.deepEqual(buildCost('farm', 1, data), { coins: 46, material: { resource: 'lumber', amount: 6 } });
});

test('placing a building pays cost, grants XP and sets level 1', () => {
  const t = townFor('riverlands');
  const r = placeBuilding(t, { x: 2, y: 2, buildingId: 'farm' }, ctx());
  assert.equal(r.error, undefined);
  assert.equal(r.state.coins, 110);
  assert.equal(r.state.stock.lumber, 5);
  assert.deepEqual(r.state.tiles['2,2'].building, { id: 'farm', level: 1 });
  assert.equal(r.state.townXp, 20);
  assert.equal(t.coins, 150, 'input state must not be mutated');
});

test('placement errors: locked, occupied, town level, money, material', () => {
  const t = townFor();
  assert.equal(placeBuilding(t, { x: 0, y: 0, buildingId: 'farm' }, ctx()).error, 'locked');
  const hut = placeBuilding(t, { x: 4, y: 4, buildingId: 'farm' }, ctx());
  assert.equal(hut.error, 'occupied');
  assert.equal(placeBuilding(t, { x: 2, y: 2, buildingId: 'apiary' }, ctx()).error, 'townLevelTooLow');
  const broke = { ...t, coins: 10 };
  assert.equal(placeBuilding(broke, { x: 2, y: 2, buildingId: 'farm' }, ctx()).error, 'noCoins');
  const poor = { ...t, stock: { ...t.stock, lumber: 4 } };
  assert.equal(placeBuilding(poor, { x: 2, y: 2, buildingId: 'farm' }, ctx()).error, 'noMaterial');
});

test('upgrade pays the level-based cost and grants XP', () => {
  let t = withBuilding(townFor(), 2, 2, 'farm', 1);
  t.coins = 1000;
  const r = upgradeBuilding(t, { x: 2, y: 2 }, ctx());
  assert.equal(r.state.tiles['2,2'].building.level, 2);
  assert.equal(r.state.coins, 1000 - 46);
  assert.equal(r.state.townXp, 10); // 5 * new level 2
});

test('town hall cannot be upgraded', () => {
  assert.equal(upgradeBuilding(townFor(), { x: 4, y: 4 }, ctx()).error, 'notUpgradable');
});

test('production formula: farm on meadow in riverlands (grain is abundant)', () => {
  let t = withBuilding(townFor('riverlands'), 2, 2, 'farm', 1, 'meadow');
  t.sellEnabled.grain = false; // isolate production
  const M = productionMultiplier(t, 2, 2, 'farm', data);
  assert.ok(Math.abs(M - 1.5 * 1.2) < 1e-9, `M=${M}`);
  const r = advance(t, t.lastTick + 60_000, ctx({ maxElapsedSec: 8 * 3600 }));
  // 6 * 1 / 60 * 1.8 per sec over 60 s = 10.8
  assert.ok(Math.abs(r.state.stock.grain - (10 + 10.8)) < 1e-6, `grain=${r.state.stock.grain}`);
});

test('adjacency: apiary next to farm gets +15%', () => {
  let t = withBuilding(townFor('deepwoods'), 2, 2, 'farm', 1);
  t = withBuilding(t, 3, 2, 'apiary', 1);
  const alone = withBuilding(townFor('deepwoods'), 3, 2, 'apiary', 1);
  const withNb = productionMultiplier(t, 3, 2, 'apiary', data);
  const without = productionMultiplier(alone, 3, 2, 'apiary', data);
  assert.ok(Math.abs(withNb / without - 1.15) < 1e-9);
});

test('adjacency: fishery next to water', () => {
  const t = withBuilding(townFor('deepwoods'), 2, 2, 'fishery', 1, 'meadow');
  const dry = productionMultiplier(t, 2, 2, 'fishery', data);
  const wet = structuredClone(t);
  wet.tiles['3,2'].terrain = 'water';
  assert.ok(Math.abs(productionMultiplier(wet, 2, 2, 'fishery', data) / dry - 1.3) < 1e-9);
});

test('town level adds 2% per level to production multiplier', () => {
  const t = withBuilding(townFor('riverlands'), 2, 2, 'farm', 1, 'meadow');
  const lvl1 = productionMultiplier(t, 2, 2, 'farm', data);
  const lvl3 = productionMultiplier({ ...t, townLevel: 3 }, 2, 2, 'farm', data);
  assert.ok(Math.abs(lvl3 / lvl1 - 1.04) < 1e-9);
});

test('rate per min scales linearly with building level', () => {
  const a = withBuilding(townFor('highlands'), 2, 2, 'quarry', 1, 'rock');
  const b = withBuilding(townFor('highlands'), 2, 2, 'quarry', 5, 'rock');
  assert.ok(Math.abs(ratePerMin(b, 2, 2, data) / ratePerMin(a, 2, 2, data) - 5) < 1e-9);
});

test('storage cap grows with warehouse levels and clamps production', () => {
  let t = townFor();
  assert.equal(storageCap(t, data), 500);
  t = withBuilding(t, 3, 3, 'warehouse', 2);
  assert.equal(storageCap(t, data), 1000);

  let p = withBuilding(townFor('riverlands'), 2, 2, 'farm', 30, 'meadow');
  p.stock.grain = 499.9;
  p.sellEnabled.grain = false;
  const r = advance(p, p.lastTick + 3_600_000, ctx({ maxElapsedSec: 8 * 3600 }));
  assert.equal(r.state.stock.grain, 500);
});

test('selling keeps the reserve of 20 and respects the sell switch', () => {
  let t = townFor('riverlands');
  t.stock.fish = 30;   // abundant, sell on
  t.stock.stone = 80;  // scarce, sell off
  t.stock.grain = 10;  // below reserve
  t.stock.lumber = 0;
  t.sellEnabled.lumber = true;
  const r = advance(t, t.lastTick + 60_000, ctx({ maxElapsedSec: 8 * 3600 }));
  assert.equal(r.state.stock.fish, 20, 'fish sold down to reserve');
  assert.equal(r.state.stock.stone, 80, 'scarce not sold');
  assert.equal(r.state.stock.grain, 10);
  assert.equal(r.state.coins, 150 + 10 * 4);
});

test('throughput: 20/min base, +40 per market level', () => {
  assert.equal(throughputPerMin(townFor(), data), 20);
  const t = withBuilding(townFor(), 3, 3, 'marketSquare', 2);
  assert.equal(throughputPerMin(t, data), 100);
});

test('sell throughput is shared between resources', () => {
  let t = townFor('riverlands');
  t.stock.fish = 1000;
  t.stock.grain = 1000;
  t.stock.lumber = 1000;
  t.sellEnabled.lumber = true;
  t.sellEnabled.fish = true;
  t.sellEnabled.grain = true;
  const r = advance(t, t.lastTick + 60_000, ctx({ maxElapsedSec: 8 * 3600 }));
  const sold = (1000 - r.state.stock.fish) + (1000 - r.state.stock.grain) + (1000 - r.state.stock.lumber);
  assert.ok(Math.abs(sold - 20) < 1e-6, `sold=${sold}`);
  assert.ok(Math.abs((1000 - r.state.stock.fish) - (1000 - r.state.stock.grain)) < 1e-6);
});

test('offline time is capped and the rest is discarded', () => {
  const t = townFor();
  const later = t.lastTick + 100 * 3600_000;
  const r = advance(t, later, ctx({ maxElapsedSec: 8 * 3600 }));
  assert.equal(r.appliedSec, 8 * 3600);
  assert.equal(r.capped, true);
  assert.equal(r.state.lastTick, later);
});

test('clock going backwards never produces time', () => {
  const t = townFor();
  const r = advance(t, t.lastTick - 5000, ctx({ maxElapsedSec: 8 * 3600 }));
  assert.equal(r.appliedSec, 0);
  assert.equal(r.state.lastTick, t.lastTick);
});

test('toggleSell flips the switch', () => {
  const t = townFor('riverlands');
  const r = toggleSell(t, { resource: 'stone' });
  assert.equal(r.state.sellEnabled.stone, true);
  assert.equal(toggleSell(t, { resource: 'nope' }).error, 'unknownResource');
});

test('merchant offers are deterministic per town and day', () => {
  const a = merchantOffers('town-x', '2026-11-24', 'coast', data);
  const b = merchantOffers('town-x', '2026-11-24', 'coast', data);
  assert.deepEqual(a, b);
  assert.equal(a.length, 3);
  const c = merchantOffers('town-x', '2026-11-25', 'coast', data);
  assert.notDeepEqual(a, c);
});

test('merchant offers respect quantity steps and price range', () => {
  for (let d = 1; d <= 60; d++) {
    const key = `2026-01-${String(d).padStart(2, '0')}`;
    for (const o of merchantOffers('town-y', key, 'highlands', data)) {
      assert.ok(o.quantity >= 20 && o.quantity <= 60 && o.quantity % 5 === 0);
      const base = data.resources[o.resource].basePrice;
      assert.ok(o.unitPrice >= Math.ceil(base * 2.5) && o.unitPrice <= Math.ceil(base * 3.0));
    }
  }
});

test('merchant: scarce resources are offered more often than abundant ones', () => {
  const counts = { scarce: 0, abundant: 0 };
  for (let d = 1; d <= 300; d++) {
    const key = `d${d}`;
    for (const o of merchantOffers('town-z', key, 'riverlands', data)) {
      counts[classOf('riverlands', o.resource, data)] = (counts[classOf('riverlands', o.resource, data)] ?? 0) + 1;
    }
  }
  assert.ok(counts.scarce > counts.abundant, JSON.stringify(counts));
});

test('buying a merchant offer pays, adds stock once and grants XP', () => {
  const t = townFor('riverlands');
  t.coins = 100000;
  const offer = merchantOffers(t.id, '2026-11-24', t.biome, data)[0];
  const r = buyOffer(t, { index: 0 }, ctx());
  assert.equal(r.error, undefined);
  assert.equal(r.state.coins, 100000 - offer.unitPrice * offer.quantity);
  assert.equal(r.state.stock[offer.resource], 10 + offer.quantity);
  assert.equal(r.state.townXp, 2);
  assert.equal(buyOffer(r.state, { index: 0 }, ctx()).error, 'alreadyBought');
});

test('merchant purchase fails without coins or storage room', () => {
  const t = townFor('riverlands');
  assert.equal(buyOffer(t, { index: 0 }, ctx()).error, 'noCoins');
  const rich = { ...t, coins: 1e9, stock: Object.fromEntries(Object.keys(t.stock).map((r) => [r, 490])) };
  assert.equal(buyOffer(rich, { index: 0 }, ctx()).error, 'storageFull');
});

test('a new day resets merchant purchases', () => {
  const t = townFor('riverlands');
  t.coins = 1e6;
  const bought = buyOffer(t, { index: 0 }, ctx({ dateKey: '2026-11-24' })).state;
  const next = advance(bought, bought.lastTick + 1000, ctx({ dateKey: '2026-11-25' })).state;
  assert.deepEqual(next.merchant.bought, {});
  assert.equal(next.merchant.dateKey, '2026-11-25');
});

test('local date key uses calendar fields', () => {
  assert.equal(localDateKey(new Date(2026, 0, 5, 12)), '2026-01-05');
});

test('levelUp is reported when XP crosses a threshold', () => {
  const t = townFor();
  t.townXp = 45;
  t.coins = 1000;
  const r = placeBuilding(t, { x: 2, y: 2, buildingId: 'farm' }, ctx());
  const lu = r.events.find((e) => e.type === 'levelUp');
  assert.ok(lu);
  assert.equal(r.state.townLevel, 2);
});
