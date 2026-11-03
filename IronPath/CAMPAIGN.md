# The Broken Signal — solo story

Twelve connected missions in three acts replace the old wave-target operations. A distress call draws Captain Mara Voss and her team into a fight over the Tidelock floodgate. Courier Ada Vale, engineer Ivo Chen, medic Sera Malik and survivor Nia Reyes return across the campaign; Commander Rook's orders reveal the stakes. Briefings, objective dialogue, debriefs and the **Story So Far** journal tell the story in game. The last mission concludes it.

**Act I — The Silence**
1. **The Silent Signal** — find Ada, restore a relay and get her warning home.
2. **The Missing Patrol** — locate and escort a patrol under attack.
3. **Blackout at the Outpost** — plant charges and defend the bunker through detonation.
4. **The Relief Convoy** — recover medicine and escort survivors to safety.

**Act II — The Flood**
5. **Orders in the Ashes** — break an enemy escort and recover its orders.
6. **Hold the Bridge** — secure an approach and cover the evacuation.
7. **Dead Air** — restore a transmitter and protect it from nearby enemies.
8. **White Noise** — recover and deliver the Tidelock authorization key before time runs out.

**Act III — The Last Light**
9. **The Long Switch** — recover the manual override and protect its transformer.
10. **A City Under Glass** — break the prison escort and rescue Nia.
11. **Tidelock** — protect Ada’s broadcast and isolate the gate control.
12. **The Last Transmission** — disable the override, hold the line and bring the story home.

Deploy enemy waves to work on objectives. Hold position in the marked circle to interact; leaving it interrupts a hold. If a wave ends first, deploy the next one to continue. Elimination objectives count enemy defeats after their stage begins; contested positions pause while enemies are nearby and reset if the hero leaves. Protect objectives show asset health; nearby living enemies damage the asset, and its destruction fails the mission. The White Noise deadline runs only during active waves and is shared across its stages. The bunker must survive. Missions restart from the beginning on reload; the results screen supports replay and the next unlocked mission.

Story progression uses the new `storyProgress` account field. The prior `campaign` field remains untouched as legacy data; old wave-target completions do not falsely mark the new story finished. Existing XP, armory, skills, Free Play and multiplayer remain unchanged. Completed waves still award their normal XP and loot; completing a story objective does not award additional XP. Story saves are independent of wave rewards and can be retried without duplicating XP. Client-reported story completion is not cheat-proof or suitable for trusted competitive rewards.

`firebase/story.complete.draft.rules.json` is a **complete replacement** based on the user-reported live `online-recovery.complete.draft.rules.json`, adding sequential, monotonic story progress while retaining legacy campaign and all multiplayer rules. Publishing a fragment would replace and break existing rules. Publish the complete file only after the combined story emulator suite passes, and before deploying the story client. Actual live behavior and devices still need testing.
