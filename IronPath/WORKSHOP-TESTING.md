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
6. **Co-op.** Play a party run, reach wave 5, disconnect and rejoin. Your completed
   waves are paid exactly once for both partners, and the boss component shows up in
   the Armory → WORKSHOP wallet.
7. **Full wallet.** If you are near the scrap cap, a completed wave must still give
   its XP (the balance just stops growing).
8. **Locked while playing.** Open the armory during a party or a match: it should
   refuse with "finish the match and leave the party", never write mid-match.
9. **Campaign.** Open Campaign: each mission card shows its threat and wave count.
   Play an Elite or Legendary mission after crafting gear — the difference between
   standard kit and a trophy should be obvious, not marginal. Finishing a mission
   must add its trophy to Armory → WORKSHOP → Prestige gear, and re-finishing a
   completed mission must not add a second one.
10. **German.** Switch the language to Deutsch: the workshop tab, wallet, item names,
   buttons and status lines must all be German.
11. **Older account.** Try an account that has never opened the workshop, one with
    every item unlocked, and one with an old campaign save.

## Live now

The database rules are published, so the workshop is on for every signed-in
account. There is no switch left to flip.

- **If the tab says the workshop is not switched on for the account**, the write was
  rejected by the database: the rules were rolled back, or that account is being
  written with a field the current rules do not accept. Nothing is changed and the
  rest of the Armory keeps working. A finished wave is then saved once with the old
  reward and the browser stops sending workshop receipts for the rest of the
  session, so nothing is lost and no reward is paid twice.
- **`firebase/WORKSHOP-RULES-TO-PUBLISH.md`** records the exact ruleset that was
  published; rollback is pasting your backup export back, not that file.

## Reporting

Tell me the tab, what you expected, what happened, and whether the armory status
line showed an error. Do not share your password or your Firebase token.

## Known limits (not bugs)

- You can cheat progression; that is accepted for the free-tier alpha.
- Crafted and prestige loadouts apply to endless solo **and campaign missions**.
  Co-op runs pay XP, scrap and boss components to the workshop, but multiplayer
  matches do not yet use the crafted combat effects.
- Prices, threat levels and combat numbers are provisional and being balanced.
- A prestige trophy is a campaign reward, not an anti-cheat; story progress is
  still client-reported, like every other progression value.
- German and English text is provisional.
