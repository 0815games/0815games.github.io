# The first run: language gate, the field, the coach cards, the tag

This is what a brand-new soldier sees, in order, and why each part exists. It is
written so a future change can be checked against the intended experience rather
than against the code alone.

## The sequence

| # | Screen | Owner | Runs |
| --- | --- | --- | --- |
| 1 | Language gate (English / German, each written in both languages) | `language-gate.mjs` | Once per device, before anything else paints |
| 2 | Intro overlay | `intro.mjs` | Once per page load, skipped behind the gate |
| 3 | Sign in, create the soldier | `account.js` | — |
| 4 | **Training field, built and drawn** — straight into the match, no briefing first | `game.js` + `training-run.mjs` | Once per account per browser |
| 5 | **Coach cards, ON the field** (7 cards, no modal, never pauses) | `first-run-coach.mjs` | Once per account per browser |
| 6 | **The pointer:** a ring on the pad the card names, a line from the card to it | `coach-highlight.mjs` | While a card is up |
| 7 | Play waves 1–5 yourself; the boss of wave 5 ends the run and nothing follows it | `game.js` + `training-run.mjs` | Same run |
| 8 | **Rewards** — XP for the level, **won or lost** | `account.js` | Once per account |
| 9 | **Equipment on** in the real Armory, with the card explaining what gear does | `account.js` + `first-run-guide.mjs` | Once per account |
| 10 | **First skill point**, with the card naming Assault / Engineer / Recon / Command | `account.js` + `first-run-guide.mjs` | Once per account |
| 11 | Workshop opened, with the card saying where gear comes from | `account.js` + `first-run-guide.mjs` | Once per account |
| 12 | Field School menu: Armory & Workshop, Skills, Campaign, Multiplayer | `account.js` + `index.html` | Shown after the ending |

The order is the point. The old build briefed first and played second, and the
briefing was a modal over the very field it described. Now the field comes first,
the cards explain it **while it runs**, and the screens after the match explain
themselves. See §"Why the field comes before the briefing".

The order of 7–9 is the fix a player asked for and it is deliberate: the boss
reward goes **on** first, the skill point is spent **after**. A skill tree means
nothing before there is gear to fight with.

## Why the field comes before the briefing

The first version briefed over the Command Center in an 11-step modal `<dialog>`.
On a phone that was unplayable, and the cause was structural rather than cosmetic:

- `game.js` pauses the simulation whenever `tutorial.isOpen()` is true — it was in
  both the `update()` early return and the `paused` flag used for drawing. A tour
  shown over the battlefield therefore froze the battlefield.
- A `<dialog>` opened with `showModal()` captures every pointer event. Even an
  unpaused field could not be tapped.
- The card was ~450 px of content plus frame against `max-height:
  calc(100dvh - 28px)` with no `overflow` — on a 390 × 664 phone it filled the
  screen, and under ~380 px of height it was clipped.

`first-run-coach.mjs` is the answer to all three. It is a plain `<aside>` with
`role="dialog"` and `aria-modal="false"`, anchored above the action bar, capped at
45 % of the viewport (`46dvh` on phones), scrolls its own body and keeps its
footer buttons at 44 px. **It is not part of any pause condition, and a test fails
the build if anyone adds it.** Five of its six cards are dismissed by what the
player actually does (`build`, `upgrade`, `move`, `deploy`, `boss`), which is why
it can run while the field is live.

`startFirstRun()` in `game.js` builds the training field first and starts the cards
only after the second `requestAnimationFrame`, i.e. after the field has actually
been drawn. The old modal tour is still in the code, but only as the fallback for
an account that played the contract before the cards existed, and as the replay in
the battle Help panel.

Storage keys, all local and all per account where they concern a person:

| Key | Written by | Meaning |
| --- | --- | --- |
| `ironpath:language` | `language.mjs`, `language-gate.mjs` | The chosen language, per device |
| `ironpath:tutorial:v2:<uid>` | `tutorial.mjs` | The briefing was finished (or skipped) |
| `ironpath:tutorial:v1:<uid>` | the old 8-step tour | Read-only legacy marker; ignored, never written |
| `ironpath:coach:v2:<uid>` | `first-run-coach.mjs` | The first-run cards were shown |
| `ironpath:training:v2:<uid>` | `training-run.mjs` | The training contract was offered |
| `ironpath:firstrun:v2:<uid>` | `first-run-ending.mjs` | The ending (tag, equip, skills, workshop) completed |
| `ironpath:firstrun:v1:<uid>` | the old ending order | Read-only legacy marker; ignored (skills came first, no tag) |

The briefing marker carries the **edition** of the briefing it belongs to. The old
8-step tour wrote `ironpath:tutorial:v1:<uid>` on finish *and* on skip, and the
11-step briefing first reused that key — so every existing account looked "already
briefed" and never saw the new tour. `TUTORIAL_EDITION` in `tutorial.mjs` is now
bumped whenever the briefing gains something a returning player should see; the
legacy key is left untouched and simply stops mattering. The key is built in one
place only, `keyFor` in `tutorial.mjs`; nothing else may spell it out, and the
ending no longer keeps a second copy of it.

The same reasoning applies to the training contract and the cards, and this is
where the first build got it wrong. `ironpath:training:v1` said "this soldier
played the contract", so every existing account was told it had already done it
and was handed the old eleven-step modal instead — the exact screen the redesign
removes. The contract changed shape (five waves became six, and the boss with it),
so `TRAINING_KEY` is `v2` and every account plays the new field once. The cards
follow the same rule: `ironpath:coach:v2`, because a dismissed card is a "seen it"
marker and would otherwise suppress the new explanations for ever.

Nothing above is written to Firebase. There is no new database field and no rules
change, so an old client and a new client can share the same account.

## The training contract

`training-run.mjs` is the single source of the numbers, and the tests read the
same module:

- **5 waves**, not an endless run. The boss of wave 5 is the finale, and nothing
  follows it: `TRAINING_BOSS_EVERY` is pinned to the contract length instead of
  borrowing the endless every-fifth-wave rhythm, so the finale cannot move if the
  length ever changes.
- **Enemies at 70% health** (`TRAINING_UNIT = 0.7`).
- **The wave-5 boss at 60% of that** (`TRAINING_BOSS_UNIT = 0.6`).
- **Bunker at 150% health** (`TRAINING_BUNKER = 1.5`, 100 → 150).
- **A defeat still pays.** Losing ends the run with `FIRST_RUN_DEFEAT_XP` (330)
  anyway. The run is the tutorial, not an exam: the screens that follow
  teach equipment and skills, and a player who bounced off wave five still has to be
  given something to equip and a point to spend. Losing costs the surplus, not the
  lesson. (`game.js` used to fire the ending only on `training-end`, so a defeat
  finished with a debrief and no reward at all.)
- **450 XP** on a win: the five waves pay 250 (30 + 40 + 50 + 60 + 70) and the
  contract adds `trainingBonusXP() = 50` with the last wave. The bonus exists so
  the first skill point cannot drift away with a balance change; it is shown as a
  contract line, never as a silent round-up.
- `trainingWon()` reads `completedWave`, not `wave`: the run cannot end while the
  boss is still walking.

It reuses the campaign deployment path (`createSoloDeployment` with
`campaign:{threat:'training'}`), so it is a real match: real towers, real
economy, real rewards, real save. It is not a scripted mock. Endless solo and
story missions are untouched — a legendary mission still deploys at 55% bunker
health and keeps its full-strength bosses.

The run ends itself when the boss of wave 5 dies (`endReason:
'training-complete'`) and the debrief calls the account back, which starts the
ending. `trainingDone` is the win flag of the *current* run; it used to also block
a second deployment, which left a dead Deploy button after the debrief.

### Measured difficulty (headless simulation)

Driven through `applyCommand` + `stepMatch` with a level 1 soldier and no skill
point, answering every field-upgrade offer:

| Play style | Result |
| --- | --- |
| Two starting towers, never upgrades | Bunker lost in wave 4 |
| Builds whenever affordable, never upgrades | Bunker lost before the boss |
| Fills the pads, then upgrades | **Clears all 5 waves in ~65 s with 100 / 150 bunker health** |

So the contract is forgiving but not free: a new soldier who only builds loses,
and one who builds *and* upgrades clears with room to spare. That is the
behaviour step 4 promises. It is still worth confirming with a real player on a
real device, because the simulation never moves the hero or fires an ability.

## Why practice uses the real dialogs

The tour used to show two cosy mock panels. They taught the layout of a screen
that no longer existed, and they could not fail in the ways the real screen can.
Now practice opens the genuine Armory, Workshop, Skills and Campaign dialogs
against a **sandbox**:

- `account.sandbox.enter()` swaps in a **fresh level 2 soldier** — one unspent
  skill point, nothing unlocked, 240 scrap — and shows the banner
  `TUTORIAL · SAMPLE DATA / Nothing you do here is saved.` The sample is fresh on
  purpose: a player who already owns a main skill must still be able to *spend the
  point* in practice, because that is the gesture the step teaches.
- Practice is playable, not a slideshow. Saving the sample build and equipping or
  upgrading sample gear go through the same reducers the real screens use, and
  land in `sandbox.profile` through a local, transaction-free service
  (`sandboxWorkshop`). The real workshop service keeps
  `canEdit: () => !inSandbox() && canEditSkills()`, so practice can never reach a
  transaction.
- Everything that touches the save itself — campaign progress, XP crediting,
  rewards, receipts — checks `inSandbox()` and returns or throws **before** a
  transaction is built.
- The account records what the player actually did and reports it through
  `sandbox.onPracticeChange`; the tour only advances when the real save gesture
  happened.
- The sandbox ends with the practice dialog, however it closes: the close button,
  Escape, the backdrop, or a save that closes it. It is bound to the dialogs' own
  `close` event, not to any single button.

Two properties the tests assert: with the sandbox on, no write can reach the
account save; and the player's own build is byte-identical after practicing.

## The ending

`first-run-ending.mjs` owns the order and the once-per-account gate; `account.js`
owns the dialogs. Three steps:

1. **Equip** — the **real** Armory opens on the Equipment tab and the player puts
   on what the run earned. No sandbox: this is their own soldier and the save is
   real. The step ends when the armory is closed, so nobody is trapped in it.
2. **Skills** — the real Skills dialog opens, and the step only counts as done
   once the account saved a build whose points are all spent. Closing without
   saving stops the sequence without marking it complete, so it can be offered
   again instead of vanishing.
3. **Workshop** — the Armory opens on the workshop tab for the first time.

`ENDING_EDITION` is **2**. It is raised whenever the step list changes, so
accounts that finished an older order are offered the new one — the same lesson as
`TUTORIAL_EDITION`: a content change that reuses the old key reaches nobody.

Then the Field School appears on the Command Center with four entries. Each one
clicks an existing control (`armoryOpen`, `skillOpen`, `campaignShowBoard`,
`partyToggle`); the menu never invents a second way into a screen.

## Language

Everything new is bilingual, and the gate itself prints both languages in both
languages so nobody is stuck. New strings live in
`localization-more-static-de.mjs`. The gate choice is per device, so a returning
player on a new browser is asked once and then goes straight in.

## Tests

| File | Proves |
| --- | --- |
| `tests/language-gate.test.mjs` | Gate once per device, both languages printed, gate → intro order, single reload |
| `tests/first-run-coach.test.mjs` | Cards follow real actions, no modal, **the coach is in no pause condition**, boss jumps the queue, dismissed stays dismissed |
| `tests/tutorial.test.mjs` | The replay tour, practice gates, real-dialog handoff, completion once per account, one owner for the marker key |
| `tests/coach-highlight.test.mjs` | the ring lands on the pad, survives a panned/zoomed view, and can never capture a tap; the arrow is revealed by attribute (SVG has no `hidden` property) |
| `tests/first-run-guide.test.mjs` | equip → skills → workshop in that order; an action card cannot be clicked past; the four classes are explained; not a modal |
| `tests/training-run.test.mjs` | 5 waves, 70% / 150% / weakened boss, boss only on wave 5, 250 + 200 = 450 XP = level 2 with headroom, the boss must fall before the run ends, offered once per edition |
| `tests/first-run-ending.test.mjs` | Order (equip → skills → workshop), once per account, decline stops without marking done, Field School uses existing controls |
| `tests/language-gate.test.mjs` | Gate once per device, both languages printed, and **every inline script in `index.html` compiles** |

The first run still has to be played on a real phone and a real desktop browser.
[FIRST-RUN-DEVICE-TEST.md](FIRST-RUN-DEVICE-TEST.md) is the script for that pass:
ordered steps, the exact German to expect, the local-storage keys that reset a
run, and what counts as a blocker. `tests/first-run-device-test.test.mjs` keeps
the plan honest by asserting that every string it quotes is still what the build
shows.

`node --test IronPath/tests/*.test.mjs` is the gate. Browser checks
(`browser-tests/command-center.cjs`) prove the phone fix first — field up, card
over it, no modal, wave clock still running — and walk the replay tour into the
real dialogs and
assert the sandbox banner appears and disappears; they need Playwright and run in
CI only.
