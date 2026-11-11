# Publishing the workshop rules: dry run and rollout

Status: **published and current (verified 2026-11-11).** The live database accepted the workshop fields from 2026-11-05, and the live ruleset now matches `WORKSHOP-RULES-TO-PUBLISH.json` exactly: the owner pasted the current file into the console rules editor and the editor showed no differences (publish button inactive), confirming the story-format fields (`storyCampaign`, `storyProgress` 0–50) are live and campaign saves are accepted. An earlier revision of this document claimed a re-publish was still required; that warning was stale — the re-publish had already happened after the campaign-save fix. Everything below remains the procedure for the *next* publish: back up, dry run, paste the whole file, publish, verify on a test identity.

Cost note: this uses the existing Firebase Auth + Realtime Database on the free (Spark) tier and GitHub Pages. No Cloud Functions, no paid backend, no billing account. Firebase free-tier quotas still apply, and free-tier availability is not guaranteed.

## 0. What the dry run can and cannot prove

`IronPath/scripts/rules-publish-dry-run.mjs` compares a ruleset **you export from the console** with `IronPath/firebase/workshop.complete.draft.rules.json`, and cross-checks the candidate against every other `*.complete.draft.rules.json` in the repo.

- It **can** show that the candidate keeps every path and restriction that live has, and that it does not silently drop a shipped feature's rules.
- It **cannot** prove the repo drafts match your live database, cannot validate rule semantics, and cannot detect a path that live has but no draft in the repo has.
- Publishing **replaces the entire ruleset**. There is no partial publish and no undo button other than pasting a backup back in.

## 1. Back up the live rules (required, do this first)

1. Firebase Console → project `iron-path-dc727` → Realtime Database → **Rules**. Confirm the instance is `europe-west1` (`iron-path-dc727-default-rtdb`) and that no other app shares this database.
2. Copy the **whole** rules text into a local file, e.g. `~/ironpath-live-rules-YYYY-MM-DD.json`. Never commit it: player rules are not secret, but keeping exports out of Git prevents accidental drift and confusion.
3. Record the current deployed rule version/date and take a full data export: Realtime Database → **Data → ⋮ → Export JSON** into the same local folder. Rules rollback without data rollback can strand writes; keep both.
4. Put both files somewhere private and versioned by date (e.g. an encrypted archive or your own password manager attachment). No player data goes into this repository.

## 2. Run the dry run

```bash
node IronPath/scripts/rules-publish-dry-run.mjs ~/ironpath-live-rules-YYYY-MM-DD.json
```

Read every line of output:

- `BLOCK …` — publishing would remove a restriction or a whole feature's rules. **Stop.** Merge those live paths into the candidate first.
- `REVIEW …` — a rule text changed, an index was dropped, or a live path is absent but unreachable. Decide each one deliberately; do not skip.
- `NEW …` — paths the candidate adds (`workshop`, `soloWorkshopReceipts`, receipts protection). These are expected.

Exit code `0` means no blockers, `1` means blockers, `2` means the export was unreadable or missing. Add `--json` for a machine-readable report.

Known expectation for this candidate: it is a superset of every other complete draft in the repo, so the cross-check section should be empty. If it is not, do not publish.

## 3. Run the emulator suite against the exact candidate

```bash
cd IronPath/firebase/rules-test
npm ci
npm run test:workshop-draft   # candidate rules: migration, receipts, legacy saves, clamping
npm test                      # baseline gameplay rules
npm run test:four
npm run test:unified
npm run test:recovery
npm run test:online
npm run test:story
npm run test:doctrines
npm run test:friends
npm run test:friend-search
npm run test:coop-invites
npm run test:leaderboards
npm run test:direct-invites
npm run test:friend-presence
npm run test:friend-stats
npm run test:campaign
```

All must pass on the same file you are about to publish, with no edits afterwards. CI already runs these for the repository copy (`.github/workflows/ironpath-firebase-rules.yml`).

## 4. Publish (only with explicit owner approval)

1. Paste the **complete** candidate JSON into the console rules editor. Do not paste a subtree.
2. Publish, then immediately verify on a test identity, not on a real player:
   - sign in, load the existing profile, complete one solo wave → XP and scrap increase, no rules errors;
   - open Armory → WORKSHOP, prepare it, craft and equip one item, reload and confirm it persisted;
   - a second, unready wave report earns nothing;
   - a maxed account (scrap or components at cap) still gains XP;
   - friends list, party join and leaderboard still load.
3. Watch Realtime Database usage for a short period. Rules cannot rate-limit, so abandoned party/presence records can grow free-tier usage.

**Rollback:** paste the saved export back into the rules editor and publish. Then check whether any writes were rejected during the window; a rejected write means a player did not receive that wave's credit, and you should tell them rather than silently replaying receipts.

## 5. Known limits that publishing does not fix

- Client-reported completion: a determined account owner can cheat. Receipts prevent accidental duplication only.
- `.validate` does not run on deleted children, so an owner can delete an individual receipt entry and replay one wave. Fixing that needs a different write/ownership boundary, which the free-tier plan does not have.
- No old-client fence: a stale browser can still join multiplayer and write the older fields.
- Rules cannot validate the encoded workshop string, item ownership or costs.

## 6. Rollout order

1. Publish rules (above). The client is already live, so the workshop becomes usable as soon as the rules accept the new fields. Verify nothing regressed for live players first: sign in, finish a solo wave, load friends and the leaderboard.
2. Verify the flow end to end on a phone on a test identity: prepare, craft, equip, reload, then play a wave.
3. Keep the legacy equipment and bunker tabs working; they are still the path for campaign and for accounts without a prepared workshop.
If a step fails, roll back the rules. Players who never opened the workshop tab have no new fields, so a rollback leaves them exactly as they were.

## 7. Not part of this step

Campaign keeps the legacy save path. Do not migrate production profiles in bulk; migration happens lazily on the player's first rewarded wave and preserves all existing fields.
