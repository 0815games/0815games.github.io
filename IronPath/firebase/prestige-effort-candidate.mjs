// OFFLINE candidate only. No credentials, network calls or deployment.
// Base is the ruleset the operator published on 2026-11-23
// (PROGRESSION-DELTA-CAPS-TO-PUBLISH.json: the live rules plus the growth
// caps). It only ever ADDS two children to a player profile - the campaign
// prestige ladder (AUSBAU-PLAN 4b) and the war-effort fund (4a) - and it
// aborts if either field already exists in a different spelling, instead
// of drifting over a base nobody reviewed.
//
// Both fields are written by name through the profile's existing .write,
// like the record counters. Each carries the delta philosophy of the base
// ruleset: bounded totals, and the prestige ladder climbs at most one
// rung per write - exactly the step recordPrestigeClear performs. The war
// effort only counts scrap the same write removes from the armory balance
// (spending stays uncapped there), so its own growth cap just keeps a
// single write honest; the stored total buys nothing beyond the client's
// ten derived tiers.

const AUDIT = 'Prestige/effort rule base changed; re-audit before building a candidate';

export const CAMPAIGN_PRESTIGE_VALIDATE = 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 10 && (!data.exists() ? newData.val() <= 1 : (newData.val() >= data.val() && newData.val() <= data.val() + 1))';
export const WAR_EFFORT_VALIDATE = 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 50000 && (!data.exists() ? newData.val() <= 1000 : (newData.val() >= data.val() && newData.val() <= data.val() + 1000))';

// Applied to an existing ruleset, in place. Existing children are never
// touched; a base that already carries one of these fields aborts the
// build instead of drifting.
export function applyPrestigeEffortRules(rules) {
  const player = rules?.players?.$uid;
  if (!player || player.campaignPrestige || player.warEffort) throw Error(AUDIT);
  player.campaignPrestige = {'.validate': CAMPAIGN_PRESTIGE_VALIDATE};
  player.warEffort = {'.validate': WAR_EFFORT_VALIDATE};
  return rules;
}

// The publish file, rebuilt from the reviewed base text: parse, add the
// two fields, serialize exactly like the base file (one-space indent,
// trailing newline), so the operator's diff shows the two new blocks and
// nothing else.
export function buildPrestigeEffortCandidate(baseText) {
  const rules = JSON.parse(baseText);
  applyPrestigeEffortRules(rules.rules);
  return JSON.stringify(rules, null, 1) + '\n';
}
