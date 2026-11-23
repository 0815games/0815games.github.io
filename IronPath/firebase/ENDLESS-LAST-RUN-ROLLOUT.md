# Endless last run on the profile — rollout

**Problem (operator report, 2026-11-23):** The endless launch dialog showed a
full record (runs, waves, bosses, best sector) but "No endless run yet on
this device." underneath. Cause: the four record counters live on the
soldier's profile (`players/$uid/endlessRuns` etc., published 2026-10-31),
while the *last run* summary was only ever written to the device's
`localStorage` (`ironpath:endlessLastRun`). Any device, browser or storage
reset without that key showed the empty text next to a full record.

**Client change (shipped with this rollout note):** `recordEndlessRun` in
`IronPath/account.js` now also writes
`players/$uid/endlessLastRun = {waves, bosses, sector, date}` — assigned to
account and character like everything else (tutorial progress, record
counters). The write is deliberately separate from the record-counters
transaction and best-effort: until the live rules carry the field, the
database refuses it (`$other: {".validate": false}`), the client catches
that, keeps the counters untouched and falls back to the device mirror,
which is still written on every run. The launcher reads the profile first
and the device mirror second, so existing soldiers keep their last run on
their home device and gain the synced one from their next finished run.

**Rules step (operator, manual):** Publish a ruleset built from the current
live export with `IronPath/firebase/endless-last-run-candidate.mjs`
(`buildEndlessLastRunCandidate(liveExportBytes)`), after the usual backup
and dry-run (`scripts/rules-publish-dry-run.mjs`). The candidate only adds
`players/$uid/endlessLastRun` (bounded integers, owner-written through the
existing profile `.write`); it never loosens anything else. Do **not** edit
`WORKSHOP-RULES-TO-PUBLISH.json` — it remains the exact copy of the live
ruleset; rebase the candidate onto a fresh export instead.

**After publishing:** no client change is needed. The next finished endless
run writes the field, and every device of that soldier shows the same last
run. A rejected write stays silent by design (rewards and counters were
never affected).
