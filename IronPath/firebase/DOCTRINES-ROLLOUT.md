# Specialist doctrines: staged rollout

The new client supports 20 paid doctrine upgrades (two ranks for each existing specialist) and reads existing builds unchanged. New doctrine builds use a 75-bit web suffix; the currently published story rules accept only 40 or 55 bits. Do not enable public access to the new client before the new rules are published.

1. Review `doctrines.complete.draft.rules.json`, based on `story.complete.draft.rules.json`. The only changes are the three skill string validators (account, two-player party profile, and unified four-player party profile). Confirm it is still based on the full rules currently in production. Publishing RTDB rules **replaces the entire ruleset**, so do not publish an older partial draft.
2. After the emulator suite passes, publish the full doctrine rules through Firebase Console. This permits the additional suffix but does not itself create or alter any player builds.
3. Deploy the updated client, and tell all players to close and reload the game before editing builds or joining matches. Older clients cannot interpret the 75-bit format and may display or overwrite an extended build incorrectly. Do not use old clients or mixed-version parties after any doctrine has been saved. There is no reliable server-side client version enforcement here.
4. Test saving/reloading an upgraded build and an online match with refreshed clients on real devices. Firebase rules validate string shape and ownership, not the skill prerequisites or fairness. Player-hosted matches and progress remain client-controlled.

These rules cannot be published from this repository without Firebase deployment credentials; publishing them is a separate action in the Firebase Console.
