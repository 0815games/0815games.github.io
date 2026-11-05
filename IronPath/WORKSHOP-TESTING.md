# Playtesting the workshop (free tier)

How to try the armory workshop without deploying anything or spending money. The workshop is still an alpha: saves and rewards work, the combat effects and the look are not final.

## For the owner's device: a local switch

1. Open the live game with `?workshop=alpha` added to the address, e.g. `https://0815games.github.io/IronPath/?workshop=alpha`.
2. Sign in. The soldier screen now shows **OPEN WORKSHOP**.
3. The switch is remembered in this browser's local storage, so later visits work without the query string. `?workshop=off` turns it back off.

This is a local opt-in, not a release: it does not change the game for anyone else, does not deploy code, and does not touch Firebase rules. It exists so the alpha can be tested on a real phone against the live data before anything is published.

## For a friend: the allow-list

Add one small entry to the database (Console → Realtime Database → Data):

```
workshopAlpha/<their-uid> = true
```

They then see **OPEN WORKSHOP** after signing in, with no new build and no query string. Remove the entry to turn it off.

Two caveats, be deliberate:

- This is a **test switch**, not security. It controls visibility only; rewards are still client-reported, and a determined player can write their own profile regardless. Do not treat it as access control for anything valuable.
- The path needs a rules entry before it is useful. `workshop.complete.draft.rules.json` does not currently include `workshopAlpha`, so writes there are denied until it is added. Until then, only the local switch works. Adding it is part of the rules review in `firebase/WORKSHOP-ROLLOUT.md`, not a separate decision.

## What to test, in order

1. **First load.** Open the workshop once. Nothing should be destroyed: your scrap, bunker ranks, owned gear, campaign progress and story progress stay exactly as they were, and your existing equipment keeps working.
2. **One endless solo run, five waves.** You should have roughly 70 scrap. The five-wave boss also pays one component and 20 extra scrap.
3. **Crafter's curve.** Boots cost 50 scrap (about five waves). The three component items cost 150 scrap plus one component (about eleven waves, two boss kills). If you can buy everything after one boss, that is a balance bug: tell me.
4. **Replay safety.** Close the run-results dialog mid-save, refresh during a wave report, or reopen an old result. A wave must never pay twice, and a lost save must never vanish silently.
5. **Co-op.** Play a party run, finish a wave, disconnect and rejoin. Your completed waves should be paid exactly once, both partners.
6. **Full wallet.** If you are near the scrap cap, a completed wave must still give its XP (the balance just stops growing).
7. **Old save.** Try an account that has never opened the workshop, one with every item unlocked, and one with an old campaign save.

## Reporting

Tell me the wave, what you expected, what happened, and whether the after-action report showed a save error. Do not share your password or your Firebase token. If the workshop ever says "Workshop could not be saved", stop and report it: that means a rules rejection, and the session then falls back to the legacy save for the rest of the run.

## Known limits (not bugs)

- You can cheat progression; that is accepted for the alpha.
- Combat effects of crafted items are provisional and only apply to endless solo while the switch is on.
- Multiplayer does not yet use workshop loadouts in the live lobby.
- German and English text is provisional; prices are not final.
