# Rules to paste into Firebase

**Status: PUBLISHED (2026-11-05).** The live database now accepts the workshop
fields, so the workshop in the live Armory is active. Keep this file as the exact
copy that was published: rollback means pasting your saved export back, not this
file.

**✅ Status update — resolved and verified (2026-11-11).** The earlier
"RE-PUBLISH REQUIRED" warning below turned out to be stale: when the owner
pasted the current file into the console rules editor, the editor showed **no
differences** against the live ruleset (the publish button stayed inactive), so
the live rules already include the story fields (`players/$uid/storyCampaign`
integer 1–9 and the `storyProgress` band 0–50, first write ≤ 1, never
decreasing) from PR #210. Campaign saves are accepted; the "won mission never
completes" symptom is gone. This file remains the exact copy of the live
ruleset — if a future change moves it ahead of live again, the same paste-and-
publish steps apply.

**✅ Status update — published (2026-10-31).** The four endless-record fields
(`players/$uid/endlessRuns` ≤ 1000000 first write ≤ 1, `endlessWaves`
≤ 10000000 first write ≤ 10000, `endlessBosses` ≤ 1000000 first write ≤ 1000,
`endlessBestSector` 0–4, all never decreasing) from PR #252 are live: the
owner pasted this file into the console rules editor and published. The
endless launch dialog's per-run record now persists for every account; until a
player reloads, a rejected write still just silences the stats for that
session (rewards were never affected). This file remains the exact copy of the
live ruleset.

File to paste: **`IronPath/firebase/WORKSHOP-RULES-TO-PUBLISH.json`** (identical to `workshop.complete.draft.rules.json`, renamed so it is obvious which file goes into the console).

Console: project `iron-path-dc727` → Realtime Database → **Rules** → select all → paste the **whole** file → Publish.

Run the backup and dry-run steps in `WORKSHOP-ROLLOUT.md` first. Publishing replaces the entire ruleset.

## What these rules add or change

- `players/$uid/workshop`: a bounded string (1–2048 chars), cannot be removed once created.
- `players/$uid/soloWorkshopReceipts/$receiptId`: 32-hex keys, 1–1048575, monotonic bits (a replay cannot clear progress).
- `players/$uid/coopRewards`: kept, and now cannot be dropped from an existing profile.
- `players/$uid`: refuses a write that deletes `campaign`, `storyProgress`, `workshop`, `soloWorkshopReceipts`, `coopRewards`, `endlessRuns`, `endlessWaves`, `endlessBosses` or `endlessBestSector` once they exist; XP stays non-decreasing and capped.
- `players/$uid/endlessRuns|endlessWaves|endlessBosses|endlessBestSector`: the free-play record the endless launch dialog shows - client-reported integers, monotonic, capped (`endlessRuns` ≤ 1000000 first write ≤ 1, `endlessWaves` ≤ 10000000 first write ≤ 10000, `endlessBosses` ≤ 1000000 first write ≤ 1000, `endlessBestSector` 0–4). The game treats a rejection as non-fatal: a session flag stops the stats writes, run rewards are unaffected.
- Everything else (parties, four-player, friends, invites, leaderboards, story) is the same as the other complete drafts in this folder.

There is no longer an alpha allow-list (`workshopAlpha`): the workshop is part of the Armory for every signed-in account, so the rules only need to accept its two new fields.

## Before you publish, check one thing

The repository's last recorded reference baseline is `database.rules.json`, which only covers `players/$uid`. These rules are a superset of every complete draft in the repo, but they have **not** been compared with your live database. Export the live rules and run:

```bash
node IronPath/scripts/rules-publish-dry-run.mjs ~/live-rules.json
```

Exit `0` with no `BLOCK` lines means the candidate keeps everything live has. If it reports a blocker, send me the output (it contains rules text only, no player data) and I will merge those paths in.

## Order does not matter (but it decides what works)

The new rules accept the old client exactly as before, because the workshop fields are optional (`(!data.child('workshop').exists() || newData.child('workshop').exists())`). The client is already live, so:

- **Before the rules are published:** Armory → WORKSHOP says it is not switched on for the account, nothing is changed, and a finished wave still pays the old reward once.
- **After the rules are published:** preparing, crafting, equipping and modifying work, and endless solo uses the crafted loadout.

Verified against the repository baseline: `node IronPath/scripts/rules-publish-dry-run.mjs IronPath/firebase/WORKSHOP-RULES-TO-PUBLISH.json` → 167 live paths, 167 candidate paths, 0 blockers, 0 review items.
