// War effort: the late-game scrap sink (AUSBAU-PLAN Punkt 4a).
//
// Every permanent armory rank is capped at three and every workshop recipe
// is a one-time craft, so a veteran's scrap balance only grows. The war
// effort turns that surplus into a stored progression goal: scrap donated
// to the valley's logistics fund, tier by tier, on the profile - never a
// device-local number. The reward is deliberately small and logistics-
// shaped: each funded tier sends a solo operation out with more starting
// supplies. No new currency, no combat power creep; the tiers are derived
// from the stored total exactly like act relics derive from storyProgress.
//
// Storage note: `warEffort` is a new profile field. The published rules
// refuse unknown player fields, so the donation transaction is separate
// from every other save and simply fails until the operator publishes
// PRESTIGE-EFFORT-TO-PUBLISH.json (see firebase/PRESTIGE-EFFORT-ROLLOUT.md).
import {readArmory} from './armory.mjs?v=20261112-tagless1';

export const WAR_EFFORT_DONATION = 250;   // one button press, one transaction
export const WAR_EFFORT_TIER_COST = 500;  // scrap per tier
export const WAR_EFFORT_MAX_TIER = 10;
export const WAR_EFFORT_GOAL = WAR_EFFORT_TIER_COST * WAR_EFFORT_MAX_TIER;
export const WAR_EFFORT_SUPPLIES_PER_TIER = 3;

// The stored total, sanitized. Anything unreadable counts as nothing
// donated - an old save and a new one agree on zero.
export function readWarEffort(profile) {
  const value = profile?.warEffort;
  return Number.isSafeInteger(value) && value > 0 ? Math.min(value, WAR_EFFORT_GOAL) : 0;
}
export function warEffortTier(profile) {
  return Math.min(WAR_EFFORT_MAX_TIER, Math.floor(readWarEffort(profile) / WAR_EFFORT_TIER_COST));
}
// Equipment-vocabulary bonus, merged at deployment like the relic bonus.
export function warEffortBonus(profile) {
  return {startSupplies: warEffortTier(profile) * WAR_EFFORT_SUPPLIES_PER_TIER};
}

// Donate scrap to the fund. Returns the next profile or null; the caller
// must run it inside a transaction against the latest account, never on a
// cached balance (same contract as the workshop reducers).
export function donateWarEffort(profile, amount = WAR_EFFORT_DONATION) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return null;
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1000) return null;
  const effort = readWarEffort(profile);
  if (effort + amount > WAR_EFFORT_GOAL) return null;
  const armory = readArmory(profile.armory);
  if (armory.scrap < amount) return null;
  return {...profile, armory: {...armory, scrap: armory.scrap - amount}, warEffort: effort + amount};
}
