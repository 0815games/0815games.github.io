# Tower specialization plan (Punkt 7)

Concept first, as agreed. This plan turns the existing level-3 branch choice
into a real specialization system: named kits with ranks that add *mechanics*,
not just stat multipliers — without touching the command protocol, the
multiplayer snapshots, or the freshly calibrated campaign pressure.

## 1. Where towers stand today (measured)

Four tower types (MG 50, Cannon 80, Flak 65, Rifle 75), levels 1–6
(70/120/180/260/360), +30% base damage per level, prestige cycles after 6
(TOWER-PRESTIGE.md). At level 2→3 the player picks one of four permanent
specializations (game.js `branches`, combat.mjs `branchDamage`,
simulation.mjs `branchStats`):

| Type | Branch 0 | Branch 1 | Branch 2 (lvl 5) | Branch 3 (lvl 10) |
|---|---|---|---|---|
| MG | Twin MG (×.55 interval) | Heavy MG (×2.1 dmg) | Veteran Kit | Boss Hunter (×1.5 vs boss) |
| Cannon | Rapid Cannon (×.6 interval) | Siege Cannon (×2.1 dmg) | Veteran Kit | Boss Hunter |
| Flak | Twin Flak (×.55 interval) | Long-range Flak (×1.45 range) | Veteran Kit | Boss Hunter |
| Rifle | Marksman | Anti-armor Rifle (×1.4 vs tank) | Veteran Kit | Boss Hunter |

**The problem:** every choice is one flat stat line. Twin MG vs Heavy MG is a
DPS arithmetic exercise, not a playstyle; after the choice the tower never
changes character again. The two conditional bonuses that exist (sniper armor
×1.4, boss ×1.5) are the exception that shows what is missing. Nothing in the
game reads "this is a suppression nest", "this is a counter-battery post".

## 2. Goals and non-goals

**Goals**
- Each specialization is a *kit with a name, an identity and three ranks* that
  unlock real mechanics on the existing upgrade ladder.
- Choices change **how** a tower plays (slow, mark, chain, crit pattern,
  spotting), not just how big its numbers are.
- Zero protocol change: ranks derive from `tower.level` + `tower.branch`,
  both already in every snapshot and stale-command guard.

**Non-goals (this plan)**
- No new build commands, no new tower types, no per-tower abilities the player
  triggers manually (that is the hero's role).
- No power creep that invalidates the point-6 pressure calibration
  (`20261112-pressure1`): rank mechanics are situational sidegrades, budget
  ≤ ~15% effective DPS at rank III, verified by re-running the calibrator.
- No changes to prestige economics.

## 3. Design: ranks ride the existing ladder

The branch choice stays where it is (level 2→3). From there the tower's
*specialization rank* derives from its level:

| Tower level | 3 | 4 | 5 | 6+ (prestige) |
|---|---|---|---|---|
| Specialization rank | I | II | III | III (keeps everything) |

- Rank I = today's stat line, unchanged.
- Rank II (level 4) and Rank III (level 5) each add **one mechanic** from the
  vocabulary the simulation already speaks: `e.pinned` (slow),
  `e.siegeMarks` (team damage marks), flak `chain`, the sniper crit pattern,
  `dustClouds` targeting, splash/chain as mini-AoE.
- Prestige keeps rank III forever — another reason to prestige a specialist
  instead of spamming new towers.

**Why derive, not store:** match.mjs validates `upgrade` with
`branch` only; `tower.level` already syncs through snapshots and the
stale-command guard (`expectedLevel`). A derived rank means old multiplayer
clients stay math-compatible as long as they reload once (same contract as
prestige, documented there).

## 4. The kits (draft for calibration)

Rank mechanics marked (m); stat lines stay as today. Situational by design —
each is weak in the wrong fight and strong in the right one.

**Twin MG — suppression nest**
- II (m): hits pin ground enemies 10 % for 1 s (`pinned`).
- III (m): full damage vs aircraft (MG's designed weakness stays for other kits).

**Heavy MG — interdiction gun**
- II (m): built-in pinning, 20 % / 2 s (the rare run perk's effect, rank 1).
- III (m): pinned enemies take +10 % damage from *all* towers.

**Rapid Cannon — autoloader battery**
- II (m): hits stagger tanks (0.5 s pin).
- III (m): every 6th shot splashes 25 % to enemies within 40 px.

**Siege Cannon — counter-battery post**
- II (m): hits *mark* tanks for 3 s (`siegeMarks`): +20 % damage from all towers.
- III (m): shots clear a dust cloud at the impact point.

**Twin Flak — barrage mount**
- II (m): built-in chain, 20 % to one nearby enemy (the rare perk, rank 1).
- III (m): +15 % range vs aircraft only.

**Long-range Flak — spotting station**
- II (m): hits mark targets for 3 s: sniper crits deal +25 % against marked.
- III (m): ignores dust clouds for targeting (radar).

**Marksman — duelist**
- II (m): crit every 3rd shot instead of every 4th.
- III (m): crits deal +50 % vs pinned enemies.

**Anti-armor Rifle — tank breaker**
- II (m): hits slow tanks 10 % for 2 s.
- III (m): consecutive hits on the same tank +8 % each, cap +40 %.

**Veteran Kit (universal, lvl 5) — commanded crew**
- II (m): +10 % fire rate while the hero is within 120 px.
- III (m): this tower's upgrades cost 15 % less (economy, not DPS).

**Boss Hunter (universal, lvl 10) — trophy gun**
- II (m): +25 % damage vs shielded bosses (the shield phase counter).
- III (m): a boss killed by this tower pays +25 supplies.

## 5. UI

- Branch sheet (level 2→3): keep, plus a visible **rank track** under each
  option — three chevrons, the mechanic per rank in one line each.
- Tower card: `Twin MG · Rank II` and the next rank's mechanic as the upgrade
  summary (replaces today's bare "+0.3 damage multiplier" once level ≥ 3).
- Canvas: one chevron per rank under the tower plate; gold glow stays
  prestige's signature.

## 6. Balance, tests, rollout

**Calibration guard:** mechanics land as situational ≤ ~8 % effective DPS per
rank. After implementation, `tools/calibrate-pressure.mjs` must still
reproduce the `20261112-pressure1` table within one step (±0.05) — otherwise
the mechanic is a buff and gets cut or the table is recalibrated explicitly.

**Tests:** per-mechanic unit tests (pin application/decay, mark stacking caps,
chain target selection, crit cadence, splash radius), harness sims per kit
(autopilot builds each branch once), suite extension of the tower pins.

**Rollout in three stages, each independently shippable:**
- **Stage A — identity (small):** rank track UI, kit names/descriptions for
  all 16, rank badges, next-rank summaries. No balance change at all.
- **Stage B — mechanics (the build):** the 10 kits above, rank II+III, in the
  simulation and combat math. Token wave, full suite, calibrator rerun.
- **Stage C — synergy (optional, later):** adjacency combos (spotting station
  next to a duelist), per-map kit recommendations in the briefing. Only if
  B lands well with players.

## 7. Open decisions

1. Depth of the first ship: Stage A alone (readability) or A+B together?
2. Power budget: strict sidegrades (pressure table stays) or allow one or two
   clearly stronger kits and recalibrate the campaign explicitly?
3. The universal kits (Veteran/Boss Hunter): keep them stat-only and spend the
   mechanics budget on the eight type-specific kits, or upgrade all ten?
