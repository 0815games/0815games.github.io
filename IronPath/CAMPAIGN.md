# The Broken Signal — solo story

Six connected missions replace the old wave-target operations. They use the existing tower-defense battlefield and enemy waves but have narrative briefings, dialogue, map markers and separate mission objectives:

1. **The Silent Signal** — find a downed courier, restore a field relay and return the coordinates to command.
2. **The Missing Patrol** — locate a patrol and escort it to the bunker. Nearby living enemies damage the patrol; losing it fails the mission.
3. **Blackout at the Outpost** — plant charges at two sites and hold the bunker through a detonation countdown.
4. **The Relief Convoy** — recover medical supplies, find survivors and escort them to safety.
5. **Orders in the Ashes** — break an enemy dispatch escort, recover its orders and deliver them.
6. **Hold the Bridge** — secure a contested approach, cover the evacuation and confirm it is complete.

Deploy enemy waves to work on objectives. Hold position in the marked circle to interact; leaving it interrupts a hold. If a wave ends first, deploy the next one to continue. The dispatch objective counts enemy defeats after the stage begins; the bridge objective pauses while enemies contest the area and resets if the hero leaves. The bunker must survive. Missions restart from the beginning on reload; the results screen supports replay and the next unlocked mission.

Story progression uses the new `storyProgress` account field. The prior `campaign` field remains untouched as legacy data; old wave-target completions do not falsely mark the new story finished. Existing XP, armory, skills, Free Play and multiplayer remain unchanged. Completed waves still award their normal XP and loot; completing a story objective does not award additional XP. Story saves are independent of wave rewards and can be retried without duplicating XP. Client-reported story completion is not cheat-proof or suitable for trusted competitive rewards.

`firebase/story.complete.draft.rules.json` is a **complete replacement** based on the user-reported live `online-recovery.complete.draft.rules.json`, adding sequential, monotonic story progress while retaining legacy campaign and all multiplayer rules. Publishing a fragment would replace and break existing rules. Publish the complete file only after the combined story emulator suite passes, and before deploying the story client. Actual live behavior and devices still need testing.
