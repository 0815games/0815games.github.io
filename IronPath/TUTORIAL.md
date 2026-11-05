# The first run: language gate, field briefing, training contract, dog tag

This is what a brand-new soldier sees, in order, and why each part exists. It is
written so a future change can be checked against the intended experience rather
than against the code alone.

## The sequence

| # | Screen | Owner | Runs |
| --- | --- | --- | --- |
| 1 | Language gate (English / German, each written in both languages) | `language-gate.mjs` | Once per device, before anything else paints |
| 2 | Intro overlay | `intro.mjs` | Once per page load, skipped behind the gate |
| 3 | Sign in, create the soldier | `account.js` | — |
| 4 | Command Center | `command-center.mjs` | — |
| 5 | Field briefing, 11 steps | `tutorial.mjs` | Once per account per browser |
| 6 | Training contract, 6 waves | `game.js` + `training-run.mjs` | Once per account per browser |
| 7 | First skill point, real Skills dialog | `account.js` | Once per account per browser |
| 8 | Dog tag issued | `dog-tag.mjs` | Derived on every render |
| 9 | Workshop opened for the first time | `account.js` | Once per account per browser |
| 10 | Field School menu: Armory & Workshop, Skills, Campaign, Multiplayer | `account.js` + `index.html` | Shown after the ending |

Storage keys, all local and all per account where they concern a person:

| Key | Written by | Meaning |
| --- | --- | --- |
| `ironpath:language` | `language.mjs`, `language-gate.mjs` | The chosen language, per device |
| `ironpath:tutorial:v1:<uid>` | `tutorial.mjs` | The briefing was finished (or skipped) |
| `ironpath:training:v1:<uid>` | `training-run.mjs` | The training contract was offered |
| `ironpath:firstrun:v1:<uid>` | `first-run-ending.mjs` | The ending (skills, tag, workshop) completed |

Nothing above is written to Firebase. There is no new database field and no rules
change, so an old client and a new client can share the same account.

## The training contract

`training-run.mjs` is the single source of the numbers, and the tests read the
same module:

- **6 waves**, not an endless run.
- **Enemies at 70% health** (`TRAINING_UNIT = 0.7`).
- **The wave-5 boss at 60% of that** (`TRAINING_BOSS_UNIT = 0.6`), so the only
  boss in the run teaches a mechanic instead of ending the run.
- **Bunker at 150% health** (`TRAINING_BUNKER = 1.5`, 100 → 150).
- **330 XP** for the six waves (30 + 40 + 50 + 60 + 70 + 80), which is exactly
  level 2. Five waves pay 250 and stay at level 1, so the last wave is what earns
  the first skill point.

It reuses the campaign deployment path (`createSoloDeployment` with
`campaign:{threat:'training'}`), so it is a real match: real towers, real
economy, real rewards, real save. It is not a scripted mock. Endless solo and
story missions are untouched — a legendary mission still deploys at 55% bunker
health and keeps its full-strength bosses.

The run ends itself when the last wave is cleared (`endReason:
'training-complete'`) and the debrief calls the account back, which starts the
ending.

## Why practice uses the real dialogs

The tour used to show two cosy mock panels. They taught the layout of a screen
that no longer existed, and they could not fail in the ways the real screen can.
Now practice opens the genuine Armory, Workshop, Skills and Campaign dialogs
against a **sandbox**:

- `account.sandbox.enter()` swaps in an example soldier (`SANDBOX_SCRAP = 240`,
  level 2, a legacy item equipped) and shows the banner
  `TUTORIAL · SAMPLE DATA / Nothing you do here is saved.`
- Every write path checks `inSandbox()` and returns or throws **before** a
  transaction is even built. `canEdit` is `() => !inSandbox() && canEditSkills()`,
  so the workshop service, the skill save, the armory save, the campaign save and
  XP crediting all refuse.
- `SandboxWrite` is thrown rather than returning quietly, so the UI can never
  believe a change was saved when nothing was written.
- Leaving the tour calls `sandbox.leave()` and restores the real profile.

The safety property the tests assert: with the sandbox on, no write can reach the
account.

## The dog tag

Drawn, never stored. `dogTag({profile, accountId, issued})` derives:

- the name, from the soldier profile;
- a gender pictogram in the same line style as the armory icons;
- a serial, FNV-1a over `0815-IRON-PATH` + the account id, shown as `XXXX-XXXX`;
- `0815 GAMES · IRON PATH`;
- the issue date.

It is cosmetic: no stat, no bonus, never equipped, always worn. It appears on the
Soldier screen and in the Armory. Because it is derived at render time, a soldier
who has played for a year gets the same tag they always had, and the account
needs no migration.

## The ending

`first-run-ending.mjs` owns the order and the once-per-account gate; `account.js`
owns the dialogs. Three steps:

1. **Skills** — the real Skills dialog opens, and the step only counts as done
   once the account saved a build whose points are all spent. Closing without
   saving stops the sequence without marking it complete, so it can be offered
   again instead of vanishing.
2. **Dog tag** — the tag is drawn and the Soldier screen is shown.
3. **Workshop** — the Armory opens on the workshop tab for the first time.

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
| `tests/tutorial.test.mjs` | 11 steps, practice gates, real-dialog handoff, completion once per account |
| `tests/training-run.test.mjs` | 6 waves, 70% / 150% / weakened boss, 330 XP = level 2, weaker spawns in a real match, offered once |
| `tests/dog-tag.test.mjs` | Serial derived and stable, nothing persisted, SVG in the armory style |
| `tests/first-run-ending.test.mjs` | Order, once per account, decline stops without marking done, sandbox refuses writes, Field School uses existing controls |

`node --test IronPath/tests/*.test.mjs` is the gate. Browser checks
(`browser-tests/command-center.cjs`) walk the tour into the real dialogs and
assert the sandbox banner appears and disappears; they need Playwright and run in
CI only.
