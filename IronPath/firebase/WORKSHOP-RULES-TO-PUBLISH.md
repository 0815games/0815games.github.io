# Rules to paste into Firebase

File to paste: **`IronPath/firebase/WORKSHOP-RULES-TO-PUBLISH.json`** (identical to `workshop.complete.draft.rules.json`, renamed so it is obvious which file goes into the console).

Console: project `iron-path-dc727` → Realtime Database → **Rules** → select all → paste the **whole** file → Publish.

Run the backup and dry-run steps in `WORKSHOP-ROLLOUT.md` first. Publishing replaces the entire ruleset.

## What these rules add or change

- `players/$uid/workshop`: a bounded string (1–2048 chars), cannot be removed once created.
- `players/$uid/soloWorkshopReceipts/$receiptId`: 32-hex keys, 1–1048575, monotonic bits (a replay cannot clear progress).
- `players/$uid/coopRewards`: kept, and now cannot be dropped from an existing profile.
- `players/$uid`: refuses a write that deletes `campaign`, `storyProgress`, `workshop`, `soloWorkshopReceipts` or `coopRewards` once they exist; XP stays non-decreasing and capped.
- `workshopAlpha/$uid`: read by the owner only, **not writable by anyone** (`.write: false`); set an entry with the console/admin SDK. Only the boolean `true` counts.
- Everything else (parties, four-player, friends, invites, leaderboards, story) is the same as the other complete drafts in this folder.

## Before you publish, check one thing

The repository's last recorded reference baseline is `database.rules.json`, which only covers `players/$uid`. These rules are a superset of every complete draft in the repo, but they have **not** been compared with your live database. Export the live rules and run:

```bash
node IronPath/scripts/rules-publish-dry-run.mjs ~/live-rules.json
```

Exit `0` with no `BLOCK` lines means the candidate keeps everything live has. If it reports a blocker, send me the output (it contains rules text only, no player data) and I will merge those paths in.

## If you publish before the code is live

Not a problem: the new rules accept the old client exactly as before, because the workshop fields are optional (`(!data.child('workshop').exists() || newData.child('workshop').exists())`). Order does not matter.
