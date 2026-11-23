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

**Rules step (operator, manual):** Done on the operator's live export of
2026-11-23 (`IronPath/firebase/live-rules-20261123.json`, SHA-256
`7a78078f643918c2120a791763073caf0fecf5e9f52f8355243fe0ffac69629e`, kept
byte-identical as the reference). Applying `applyEndlessLastRunRules` from
`IronPath/firebase/endless-last-run-candidate.mjs` to it produced
**`IronPath/firebase/ENDLESS-LAST-RUN-TO-PUBLISH.json`** — that is the file
to paste into the console. Verified before handover: the structural diff
against the live export is exactly one added path
(`/rules/players/$uid/endlessLastRun`, nothing changed, nothing removed),
and `node IronPath/scripts/rules-publish-dry-run.mjs
IronPath/firebase/live-rules-20261123.json --candidate
IronPath/firebase/ENDLESS-LAST-RUN-TO-PUBLISH.json` reports **0 blockers,
0 review items** (6 new paths: the field and its children). Publish steps:
back up the live rules already saved here, paste the whole publish file in
the Realtime Database Rules editor, publish, then finish one endless run
and check `players/<uid>/endlessLastRun` exists. Never edit
`WORKSHOP-RULES-TO-PUBLISH.json` for this — it remains the older reference
snapshot; this field rides on the 2026-11-23 export instead.

**After publishing:** no client change is needed. The next finished endless
run writes the field, and every device of that soldier shows the same last
run. A rejected write stays silent by design (rewards and counters were
never affected).
