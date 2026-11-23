// OFFLINE candidate only. No credentials, network calls or deployment.
// Base is the ruleset the operator published on 2026-11-23
// (ENDLESS-LAST-RUN-TO-PUBLISH.json, the live export plus endlessLastRun).
// It only ever TIGHTENS seven `.validate` strings with a per-write growth
// cap; it never adds or removes a field, never touches a read/write rule,
// and it aborts if any base string has drifted from the reviewed text.
//
// Why: the progression rules bounded totals (monotonic + a ceiling) but
// not the step. A modified client could write xp 0 -> 10,000,000, a
// leaderboard wave of 10,000, or the endless counters at their ceilings
// in a single write. The caps below sit far above anything the real
// client can earn in one write (wave XP peaks at 1,020 per wave, an
// endless run adds its own wave/boss totals once, scrap pays 20 per
// boss), so honest play never notices them; a one-shot jump does.
// Spending (scrap going down) stays unrestricted, as do decreases the
// monotonic fields already forbid.

const AUDIT = 'Progression delta-cap base changed; re-audit before building a candidate';

export const PROGRESSION_DELTAS = Object.freeze({
  xp: 5000,              // per wave at most 1,020 XP; a write credits one wave (+bonuses)
  storyProgress: 1,      // one mission per completion, same step as campaign
  endlessRuns: 1,        // one finished run per record write
  endlessWaves: 1000,    // one run's whole wave total, generously
  endlessBosses: 200,    // one run's whole boss total, generously
  scrap: 1000,           // 20 per boss; decreases (spending) are never capped
  leaderboardWave: 500,  // a best wave is reported as it is reached
});

const CAPS = [
  {
    path: ['players', '$uid', 'xp'],
    cap: PROGRESSION_DELTAS.xp,
    base: 'newData.isNumber() && newData.val() >= 0 && newData.val() <= 10000000 && newData.val() % 1 === 0 && (!data.exists() ? newData.val() === 0 : newData.val() >= data.val())',
    capped: 'newData.isNumber() && newData.val() >= 0 && newData.val() <= 10000000 && newData.val() % 1 === 0 && (!data.exists() ? newData.val() === 0 : (newData.val() >= data.val() && newData.val() <= data.val() + 5000))',
  },
  {
    path: ['players', '$uid', 'storyProgress'],
    cap: PROGRESSION_DELTAS.storyProgress,
    base: 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 50 && (!data.exists() ? newData.val() <= 1 : newData.val() >= data.val())',
    capped: 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 50 && (!data.exists() ? newData.val() <= 1 : (newData.val() >= data.val() && newData.val() <= data.val() + 1))',
  },
  {
    path: ['players', '$uid', 'endlessRuns'],
    cap: PROGRESSION_DELTAS.endlessRuns,
    base: 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 1000000 && (!data.exists() ? newData.val() <= 1 : newData.val() >= data.val())',
    capped: 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 1000000 && (!data.exists() ? newData.val() <= 1 : (newData.val() >= data.val() && newData.val() <= data.val() + 1))',
  },
  {
    path: ['players', '$uid', 'endlessWaves'],
    cap: PROGRESSION_DELTAS.endlessWaves,
    base: 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 10000000 && (!data.exists() ? newData.val() <= 10000 : newData.val() >= data.val())',
    capped: 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 10000000 && (!data.exists() ? newData.val() <= 10000 : (newData.val() >= data.val() && newData.val() <= data.val() + 1000))',
  },
  {
    path: ['players', '$uid', 'endlessBosses'],
    cap: PROGRESSION_DELTAS.endlessBosses,
    base: 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 1000000 && (!data.exists() ? newData.val() <= 1000 : newData.val() >= data.val())',
    capped: 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 1000000 && (!data.exists() ? newData.val() <= 1000 : (newData.val() >= data.val() && newData.val() <= data.val() + 200))',
  },
  {
    path: ['players', '$uid', 'armory', 'scrap'],
    cap: PROGRESSION_DELTAS.scrap,
    base: 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 10000000',
    capped: 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 10000000 && (!data.exists() ? newData.val() <= 1000 : (newData.val() <= data.val() || newData.val() <= data.val() + 1000))',
  },
  {
    path: ['leaderboards', '$mode', '$uid', 'wave'],
    cap: PROGRESSION_DELTAS.leaderboardWave,
    base: 'newData.isNumber() && newData.val() >= 1 && newData.val() <= 10000 && newData.val() % 1 === 0',
    capped: 'newData.isNumber() && newData.val() >= 1 && newData.val() <= 10000 && newData.val() % 1 === 0 && (!data.exists() ? newData.val() <= 500 : newData.val() <= data.val() + 500)',
  },
];

// Applied to an existing ruleset, in place. Every target `.validate` must
// match the reviewed base string exactly; drift aborts the build rather
// than quietly capping a different rule than the one that was reviewed.
export function applyProgressionDeltaCaps(rules) {
  for (const {path, base, capped} of CAPS) {
    let node = rules;
    for (const key of path) node = node?.[key];
    if (!node || node['.validate'] !== base) throw Error(AUDIT);
    node['.validate'] = capped;
  }
  return rules;
}
