// OFFLINE candidate only. No credentials, network calls or deployment.
// Base is the ruleset the operator published on 2026-11-23
// (PRESTIGE-EFFORT-TO-PUBLISH.json: live rules, growth caps, the prestige
// ladder and the war effort). It only ever widens the party-code format
// from four digits to four-or-six, in exactly the seventeen rule strings
// that pin the old format, and it aborts if the count has drifted - a
// changed base means nobody reviewed what would be published.
//
// Why: a four-digit code space (10,000) is enumerable in seconds by any
// signed-in account, and RTDB rules cannot rate-limit the guessing; the
// join-request inboxes of every open party are the reachable surface.
// Six digits (1,000,000) make the scan a hundred times dearer. Four-digit
// codes stay valid so parties created before the switch - they live one
// session - run out instead of breaking; the client already only creates
// six-digit codes (with a session fallback to four until this publishes).

const AUDIT = 'Six-digit party-code base changed; re-audit before building a candidate';

export const PARTY_CODE_OLD_FORMAT = '/^[0-9]{4}$/';
export const PARTY_CODE_NEW_FORMAT = '/^[0-9]{4}([0-9]{2})?$/';
export const PARTY_CODE_FORMAT_SITES = 17;

// Applied to an existing ruleset, in place. Only string leaves carrying
// the exact old format token change; anything else - and any drift in how
// many sites carry it - aborts the build.
export function applySixDigitPartyCodes(rules) {
  let sites = 0;
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (typeof value === 'string' && value.includes(PARTY_CODE_OLD_FORMAT)) {
        const parts = value.split(PARTY_CODE_OLD_FORMAT);
        sites += parts.length - 1;
        node[key] = parts.join(PARTY_CODE_NEW_FORMAT);
      } else walk(value);
    }
  };
  walk(rules);
  if (sites !== PARTY_CODE_FORMAT_SITES) throw Error(AUDIT);
  return rules;
}

// The publish file, rebuilt from the reviewed base text: parse, widen the
// format, serialize exactly like the base file (one-space indent, trailing
// newline), so the operator's diff shows the seventeen widened strings and
// nothing else.
export function buildSixDigitPartyCodeCandidate(baseText) {
  const rules = JSON.parse(baseText);
  applySixDigitPartyCodes(rules.rules);
  return JSON.stringify(rules, null, 1) + '\n';
}
