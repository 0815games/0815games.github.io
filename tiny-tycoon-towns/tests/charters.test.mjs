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
  assert.equal(canFoundCharter({ townLevel: 7, lifetimeCoins: 500000 }).ok, false);
  assert.equal(canFoundCharter({ townLevel: 8, lifetimeCoins: 99999 }).ok, false);
  const ok = canFoundCharter({ townLevel: 8, lifetimeCoins: 100000 });
  assert.equal(ok.ok, true);
  assert.equal(ok.gain, 1);
});

test('granting adds the gain once per founding, never more', () => {
  const c = grantCharters(emptyCharter(), 400000);
  assert.equal(c.earned, 2);
  assert.equal(availableCharters(c), 2);
});

test('a perk costs one charter and stops at its maximum', () => {
  let c = grantCharters(emptyCharter(), 900000); // 3 Freibriefe
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
  let c = grantCharters(emptyCharter(), 1600000); // 4 Freibriefe
  c = buyPerk(c, 'yield').charter;
  c = buyPerk(c, 'yield').charter;
  assert.equal(perkEffect(c, 'yield'), 0.1);
  assert.equal(perkEffect(c, 'storage'), 0);
  assert.equal(perkEffect(c, 'nope'), 0);
  assert.equal(buyPerk(c, 'nope').ok, false);
});
