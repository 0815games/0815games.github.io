# Iron Path: road to beta, status

This file tracks the seven-patch beta plan against the code in this folder. "Existing" means the feature was already in the repository before this work; "Added" means it arrived with the change that introduced this file. Nothing here is a public beta launch yet. The launch gate (real-device pass, server-validated rewards, and multiplayer hardening) is still open.

## Patch 1: Build-defining skill combos
- **Existing:** all ten pairs of the five skill paths have a combo (`skill-combos.mjs`), each with tiers, combo cues in the battle view, and sound cues. Five mastery capstones exist (`CAPSTONES` in `skills.mjs`).
- **Added:** combo activity is recorded per player (`playerRecord().combos`) and shown on the operation report.
- **Not done:** no rebalance pass. Build differences have not been measured in play.

## Patch 2: Combat clarity and game feel
- **Existing:** boss telegraphs and warnings (`boss-mechanics.mjs`, `bossAlert` HUD), enemy role intel (`ENEMY_INTEL`), threat counts, impact effects (`combat-fx.mjs`, `cartoon-art.mjs`).
- **Not done:** no new readability pass on mobile; needs playtesting on phones.

## Patch 3: Skill tree and build quality of life
- **Existing:** filters for path, hybrid, active, unlocked and available nodes; prerequisite and related-node highlighting (`skill-planner.mjs`, `drag-tree.mjs`); a combined-bonus build summary; a reset confirmation before saving.
- **Not done:** no further touch-target or mobile navigation work in this change.

## Patch 4: Post-run results and progression
- **Added:** an operation report (`run-summary.mjs`, `results-view.mjs`) opens when a run ends. It shows waves survived, bosses defeated, enemies defeated, XP, supplies, caches, combo activity, damage per soldier (hero and towers), new skill points, new armory items and scrap, field upgrades taken, and towers standing.
- **Caveat:** XP, scrap and level values in the report are client-side estimates from the published formulas. Account progression is still awarded by the existing per-wave path. The report is not an anti-cheat record.
- **Not done:** progression pacing has not been reviewed with real players.

## Patch 5: Campaign and mission structure
- **Added:** a first campaign of four missions (`campaign.mjs`, `campaign-view.mjs`). Each mission is a fixed seeded battlefield with its own terrain (scrubland, frozen lake, ruined industrial zone, delta mudflats). Each finale is a boss from the existing cycle (waves 5, 10, 15 and 20). Missions unlock at soldier levels 1–4; the level already comes from saved account XP, so no new save data was needed. Victory ends the run once the objective wave is cleared (`objectiveWave` in `simulation.mjs`).
- **Limits:** mission completion is not saved, so the picker cannot show "completed" state yet. Saving it needs a database rules change, which has not been drafted or published. Campaign missions are solo-only. Regions do not yet have their own enemy mixes; all regions use the shared wave table.

## Patch 6: Multiplayer hardening
- **Existing:** Firebase party, co-op and 1v1 code, with emulator tests and the reconnect and departure handling described in `COOP-ROADMAP.md`.
- **Not done:** no real-device, cross-browser or real-network testing was possible in this change. Host-authoritative rewards are still not cheat-proof, and the roadmap's own boundary still applies.

## Patch 7: Beta polish, balancing and feedback
- **Added:** a feedback link in the footer and in the operation report (`feedback.mjs`). It opens a new GitHub issue prefilled with the outcome, mission and wave, and never includes account or party data. The How-to-play text mentions the campaign and the report.
- **Not done:** balance review, accessibility audit, sound review, tutorial steps for campaign, and onboarding changes.

## Beta launch gate (not met)
- Real-device pass on desktop, phone, solo, co-op and 1v1.
- Crash, lost-progress and match-blocking bugs resolved on those devices.
- Server-authoritative validation before any ranking or reward is presented as trustworthy.

## Tests
Run each file in `tests/` with `node`. New in this change: `iron-path-beta.test.mjs` (simulation objectives, records, results math, campaign data and feedback) and `iron-path-beta-ui.test.mjs` (page wiring, escaping, campaign picker).
