// Campaign prestige (NG+), profile side. The pressure maths live in
// campaign-pressure.mjs (prestigeScale); this module owns the stored
// ladder: one number, `campaignPrestige`, counting the highest prestige
// tier the soldier has cleared on any already-completed mission. It only
// ever climbs one tier per recorded clear, which is also what the rule
// candidate allows per write.
//
// Storage note: `campaignPrestige` is a new profile field. The published
// rules refuse unknown player fields until the operator publishes
// PRESTIGE-EFFORT-TO-PUBLISH.json, so the record runs in its own
// best-effort transaction (the endlessLastRun pattern) and disables itself
// for the session if the database refuses it - mission completion itself
// never carries the field and can never be blocked by it.
import {readArmory} from './armory.mjs?v=20261112-tagless1';
import {PRESTIGE_MAX_TIER} from './campaign-pressure.mjs?v=20261112-pressure1';

export {PRESTIGE_MAX_TIER};

// Scrap paid for clearing a prestige tier: 150 for the first rung, 600 for
// the tenth. It lands in the armory balance (and can flow straight into the
// war effort), in one write well under the scrap growth cap.
export function prestigeScrapBonus(tier) {
  return Number.isSafeInteger(tier) && tier >= 1 && tier <= PRESTIGE_MAX_TIER ? 100 + 50 * tier : 0;
}

// The stored ladder value, sanitized like every other profile read.
export function prestigeTierOf(profile) {
  const value = profile?.campaignPrestige;
  return Number.isSafeInteger(value) && value > 0 ? Math.min(value, PRESTIGE_MAX_TIER) : 0;
}

// Record a cleared tier. Only the next rung counts: clearing tier 3 while
// the ladder stands at 1 proves nothing the ladder does not already know,
// and skipping rungs would outrun the one-step rule. Returns the next
// profile or null; run inside a transaction against the latest account.
export function recordPrestigeClear(profile, tier) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return null;
  const current = prestigeTierOf(profile);
  if (!Number.isSafeInteger(tier) || tier !== current + 1 || tier > PRESTIGE_MAX_TIER) return null;
  const armory = readArmory(profile.armory);
  const scrap = Math.min(10000000, armory.scrap + prestigeScrapBonus(tier));
  if (!Number.isSafeInteger(scrap)) return null;
  return {...profile, armory: {...armory, scrap}, campaignPrestige: tier};
}
