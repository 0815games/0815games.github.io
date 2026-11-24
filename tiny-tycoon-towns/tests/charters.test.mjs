import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PERKS, TOTAL_PERK_POINTS, emptyCharter, availableCharters, charterGain,
  canFoundCharter, grantCharters, buyPerk, perkEffect, perkLevel,
} from '../src/domain/charters.js';

test('the perk tree has the 28 points from the plan', () => {
  assert.equal(TOTAL_PERK_POINTS, 28);
  assert.equal(PERKS.length, 6);
});

test('charter gain is floor(sqrt(lifetime / 100000)) per the plan', () => {
  assert.equal(charterGain(99999), 0);
  assert.equal(charterGain(100000), 1);
  assert.equal(charterGain(399999), 1);
  assert.equal(charterGain(400000), 2);
  assert.equal(charterGain(900000), 3);
  assert.equal(charterGain(-5), 0);
});

test('founding needs town level 8 and 100,000 lifetime coins in that town', () => {
  const c = emptyCharter();
  assert.equal(canFoundCharter({ id: 'a', townLevel: 7, lifetimeCoins: 500000 }, c).ok, false);
  assert.equal(canFoundCharter({ id: 'a', townLevel: 8, lifetimeCoins: 99999 }, c).ok, false);
  const ok = canFoundCharter({ id: 'a', townLevel: 8, lifetimeCoins: 100000 }, c);
  assert.equal(ok.ok, true);
  assert.equal(ok.gain, 1);
});

test('granting adds the gain and marks the town, so the same town cannot found twice', () => {
  const town = { id: 'town-a', townLevel: 8, lifetimeCoins: 400000 };
  const c = grantCharters(emptyCharter(), town);
  assert.equal(c.earned, 2);
  assert.equal(availableCharters(c), 2);
  const again = canFoundCharter(town, c);
  assert.equal(again.ok, false);
  assert.ok(again.reason.includes('schon einen Freibrief'));
  // Eine andere Stadt ist davon nicht betroffen.
  assert.equal(canFoundCharter({ ...town, id: 'town-b' }, c).ok, true);
});

test('a perk costs one charter and stops at its maximum', () => {
  let c = grantCharters(emptyCharter(), { id: 't1', lifetimeCoins: 900000 }); // 3 Freibriefe
  for (let i = 0; i < 3; i++) {
    const r = buyPerk(c, 'memory');
    assert.equal(r.ok, true);
    c = r.charter;
  }
  assert.equal(perkLevel(c, 'memory'), 3);
  assert.equal(availableCharters(c), 0);
  assert.equal(buyPerk(c, 'memory').ok, false); // Max 3 erreicht
  assert.equal(buyPerk(c, 'yield').ok, false); // Kein Freibrief mehr frei
});

test('perk effects scale with the level', () => {
  let c = grantCharters(emptyCharter(), { id: 't2', lifetimeCoins: 1600000 }); // 4 Freibriefe
  c = buyPerk(c, 'yield').charter;
  c = buyPerk(c, 'yield').charter;
  assert.equal(perkEffect(c, 'yield'), 0.1);
  assert.equal(perkEffect(c, 'storage'), 0);
  assert.equal(perkEffect(c, 'nope'), 0);
  assert.equal(buyPerk(c, 'nope').ok, false);
});

import { applyCharterToData as applyCharter } from '../src/domain/charters.js';
import { productionMultiplier, storageCap, sellPrice } from '../src/domain/economy.js';

test('Perk-Wirkungen landen in den Spieldaten, Originaldaten bleiben', () => {
  const base = {
    economy: { storage: { base: 500, perWarehouseLevel: 0 }, offline: { baseCapHours: 8 }, levelBonusPerTownLevel: 0 },
    resources: { wood: { basePrice: 10 } },
    biomes: {},
    buildings: {},
  };
  const charter = { earned: 9, spent: 6, perks: { yield: 2, storage: 3, market: 1, memory: 2 }, founded: {} };
  const d = applyCharter(base, charter);
  assert.equal(d.economy.offline.baseCapHours, 10);
  assert.equal(base.economy.offline.baseCapHours, 8, 'Original unverändert');
  assert.equal(d.economy.storageMultiplier, 1.6);
  assert.equal(storageCap({ tiles: {}, townLevel: 1, biome: 'x' }, d), 800);
  assert.equal(sellPrice('wood', d), 10.5);
  assert.equal(sellPrice('wood', base), 10, 'ohne Perk unverändert');
});

test('ohne Freibrief bleiben die Spieldaten neutral', () => {
  const base = { economy: { storage: { base: 500, perWarehouseLevel: 0 }, offline: { baseCapHours: 8 } }, resources: { wood: { basePrice: 10 } } };
  const d = applyCharter(base, null);
  assert.equal(d.economy.yieldMultiplier, 1);
  assert.equal(sellPrice('wood', d), 10);
  assert.equal(d.economy.offline.baseCapHours, 8);
});
