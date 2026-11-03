# Solo campaign

The campaign has three fixed solo operations: The Last Road (clear wave 5), Pinewood Crossing (wave 10), and Broken Outpost (wave 15). Completing one unlocks the next. Each starts a fresh battle; existing wave XP, loot, skills and armory apply. There are no separate campaign rewards. Completed operations can be replayed, and Free Play remains the random-map endless mode. Campaign selection is disabled while in an online party.

A successful completion and its final wave XP/loot are written in the same account transaction. If the save cannot be confirmed, the results screen provides a separate idempotent progress retry, which does not grant the wave XP twice. Progress is an account field, not a battle save; reloading during a mission starts a new run. Firebase account rules validate the progress range and sequential changes but cannot verify gameplay: client-controlled progress is not suitable for trusted rankings or rewards.

`firebase/campaign.complete.draft.rules.json` is the complete replacement ruleset for the live unified multiplayer baseline plus campaign progress. Publish only after the emulator checks pass; replacing Realtime Database rules with a fragment would remove other protections. Host-reload recovery remains disabled separately until its safety and bandwidth blockers are resolved. Existing multiplayer should continue to use its current adapter.
