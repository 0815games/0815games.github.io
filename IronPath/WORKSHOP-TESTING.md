# Playtesting the workshop (free tier)

How to try the armory workshop. It is part of the game now: no query string, no
allow-list, no extra build. The workshop is still an alpha in one sense only —
prices, effects and the look can change, and progression is client-reported.

## Where it is

1. Open `https://0815games.github.io/IronPath/` and sign in.
2. Command Center → **ARMORY**.
3. There are four tabs: **EQUIPMENT**, **WORKSHOP**, **BUNKER**, **SERVICE RECORD**.
   Everything about gear lives in that one dialog; the workshop is the second tab.
4. The first time you open the **WORKSHOP** tab, the game prepares it. Your scrap,
   bunker ranks, owned gear, campaign progress and story progress stay exactly as
   they were, and your existing equipment is carried over. Nothing is written until
   you open that tab.

## What to test, in order

1. **First open.** Prepare the workshop, close the armory, reload the page. Your
   workshop must still be there with the same gear.
2. **One endless solo run, five waves.** You should have roughly 70 scrap. The
   five-wave boss also pays one component and 20 extra scrap.
3. **Crafter's curve.** Boots cost 50 scrap (about five waves). The three component
   items cost 150 scrap plus one component (about eleven waves, two boss kills). If
   you can buy everything after one boss, that is a balance bug: tell me.
4. **Equip and modify.** Craft, equip, then install a modification. Each change
   should say "Saved for your next match", and the equipped loadout at the top of
   the tab should match what you see in the match.
5. **Replay safety.** Close the run-results dialog mid-save, refresh during a wave
   report, or reopen an old result. A wave must never pay twice, and a lost save
   must never vanish silently.
6. **Co-op.** Play a party run, finish a wave, disconnect and rejoin. Your completed
   waves should be paid exactly once, both partners.
7. **Full wallet.** If you are near the scrap cap, a completed wave must still give
   its XP (the balance just stops growing).
8. **Locked while playing.** Open the armory during a party or a match: it should
   refuse with "finish the match and leave the party", never write mid-match.
9. **German.** Switch the language to Deutsch: the workshop tab, wallet, item names,
   buttons and status lines must all be German.
10. **Older account.** Try an account that has never opened the workshop, one with
    every item unlocked, and one with an old campaign save.

## What "not enabled yet" looks like

If the database rules that accept the workshop fields are not published yet, the
workshop tab says that it is not switched on for this account and nothing was
changed. The Armory, the game and your old save keep working. In that state a
finished wave is saved once with the old reward and the browser stops sending
workshop receipts for the rest of the session, so nothing is lost and no reward can
be paid twice. Publishing the rules (`firebase/WORKSHOP-RULES-TO-PUBLISH.json`) is
what turns the workshop on for everyone.

## Reporting

Tell me the tab, what you expected, what happened, and whether the armory status
line showed an error. Do not share your password or your Firebase token.

## Known limits (not bugs)

- You can cheat progression; that is accepted for the free-tier alpha.
- Crafted loadouts apply to endless solo. Campaign keeps the old equipment, and the
  live multiplayer lobby does not use workshop loadouts yet.
- Prices and combat numbers are provisional and being balanced.
- German and English text is provisional.
