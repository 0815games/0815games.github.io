# First-run device test

The first run is the only part of Iron Path that a new soldier cannot skip past a
language they do not read, and the only part that runs before they have any
reason to forgive it. CI proves the *logic*; it cannot prove how this feels on a
real phone held in one hand.

`BETA-TEST-PLAN.md` covers multiplayer on real devices. This file covers the
single-player first run — the language gate, the briefing, the training contract,
the ending, and the Field School. It exists to close these checklist rows:

- Validate the first run on a real phone and a real desktop browser.
- Validate fullscreen, including gameplay, dialogs, and exiting with Escape.
- Skill UI on real touch: inline descriptions, scrolling, class/state highlights.

Allow about 20 minutes per device for a first pass. You need one signed-in
account and no second device.

## Before you start

Record, for every run: **date, build (the merge commit), device, OS, browser,
screen size, and whether it was portrait or landscape.** Without those, a report
cannot be reproduced. Use a fresh browser profile or a private window so the
language gate and the briefing both appear — the game remembers both per device.

To repeat a first run on the same device afterwards, clear these four keys in the
browser's local storage for the site:

| Key | What it remembers |
| --- | --- |
| `ironpath:language` | the gate choice for this device |
| `ironpath:tutorial:v2:<account id>` | the briefing was completed |
| `ironpath:training:v1:<account id>` | the training contract was offered |
| `ironpath:firstrun:v1:<account id>` | the ending was offered |

An account that predates the 11-step briefing holds `ironpath:tutorial:v1:`. That
key is what hid the new tour from existing players for a while; it is now ignored,
so **do not** clear it to test the fix — log in with an old account and the new
briefing should start on its own.

Clearing the language key also brings the gate back, which is what you want when
re-testing step 1.

## How to report

For each numbered step, one of:

- **Pass** — with anything worth noting (a slow moment, an awkward tap target).
- **Fail** — with what you saw instead, and the step number.
- **Blocked** — with what stopped you.

Attach a screenshot for any failure. Do not paste credentials or invite codes
into a report.

---

## 1. Language gate (both languages, both devices)

1. Open the site in a fresh profile. **Expected:** the gate appears before
   anything else, with **CHOOSE YOUR LANGUAGE / SPRACHE WÄHLEN** as the heading
   and the same sentence in both languages: *"Pick the language for this device.
   You can change it later at the top of the screen."* / *"Wähle die Sprache für
   dieses Gerät. Du kannst sie später oben im Bildschirm ändern."*
2. **Check no English reader is stuck:** both buttons must be readable and
   tappable — **English** / *Continue in English* and **Deutsch** / *Weiter auf
   Deutsch*.
3. **Check no German reader is stuck:** the German sentence must be complete and
   in correct German. If it is not, that is a fail even if you read English.
4. Pick **Deutsch**. **Expected:** the whole gate disappears at once — no flash of
   English underneath, no half-translated screen.
5. Reload. **Expected:** no gate; the game opens straight in German.
6. Switch to English with the language selector at the top of the screen and
   reload. **Expected:** the choice stuck, and no gate returned.

**On a phone specifically:** the gate must fit without scrolling on a 320 px wide
screen, and both buttons must be reachable with a thumb.

## 2. Briefing (11 steps, real dialogs)

A fresh account gets the briefing automatically after signing in. You do not open
it.

1. **Expected:** the briefing opens by itself over the Command Center. It does not
   appear *before* sign-in, and it does not appear twice.
2. Walk through all 11 steps. **Expected step count:** **FELDEINWEISUNG · 7 / 11**
   and so on — 11 in total. The last four practice steps open **real dialogs**, not
   pictures.
3. **German check, the whole way through.** Every title, body text and scene
   caption must be German, including the last four steps. The ones that matter
   most are the four newest: *Fähigkeitenmenü*, *Waffenkammer*, *Deine Werkstatt*,
   *Prestigewaffen*. Anything in English here is a fail — it is the one place a
   German reader has no escape hatch.
4. **Practice steps 8–11:** each one opens a real dialog over the briefing, with a
   banner reading **EINWEISUNG · BEISPIELDATEN** and *"Nichts, was du hier tust,
   wird gespeichert. Dein Soldat bleibt unverändert."* (English: *TUTORIAL ·
   SAMPLE DATA*).
5. **Step 8, do the practice.** Open **Skills**, unlock a skill, save. **Expected:**
   the briefing only lets you continue after the save; before that, continuing is
   blocked. Then close the dialog and check the banner is gone.
6. **Step 9, armory.** Equip something and upgrade something on the sample. Note
   whether you could tell it was sample data and not your own soldier.
7. **Step 10, workshop.** Craft and equip on the sample.
8. **Step 11, prestige.** View the locked trophies. **Expected:** each locked
   trophy names the mission that unlocks it.
9. **Skip path:** on a practice step, the *DIESE ÜBUNG ÜBERSPRINGEN* button must
   let you move on. It should be obvious what it does.
10. **Touch check:** on a phone, no control in the briefing should require a
    pinch, and nothing should be cut off in portrait.

## 3. Training contract (six waves, real deployment)

Finishing the briefing hands you a real battlefield — the Command Center is
replaced, not overlaid.

1. **Expected:** the objective reads **AUSBILDUNGSVERTRAG · MIT VORSICHT** and
   **WELLE 1 / 6**, with *"Noch 5 Welle(n) schaffen. Hier sind die Gegner
   geschwächt und dein Bunker ist verstärkt."*
2. **Play it properly** — build towers, upgrade them, move your hero, use the
   ability when you get one. Note the time per wave and total.
3. **Expected:** the bunker has more health than a normal run (150 instead of
   100), enemies die noticeably faster, and the wave-5 boss does not end the run.
4. **Expected ending:** after wave 6, a notice reads *"Ausbildungsvertrag erfüllt!
   330 XP verdient. Willkommen auf dem Eisernen Pfad, Soldat."* and the run ends
   itself. You do not need to press END RUN.
5. **The pass/fail question that no automated test can answer:** did it feel like
   a tutorial or like a punishment? If a new player loses this, that is a
   blocker — record exactly which wave and what was on the field.

For reference, a headless simulation of the real command path gives:

| Play style | Result |
| --- | --- |
| Two starting towers, never upgrades | Bunker lost in wave 4 |
| Builds whenever affordable, never upgrades | Bunker lost in wave 5 |
| Fills the build pads, then upgrades | Clears in ~2 minutes, 70 of 150 bunker health left |

If your real experience is much harder than that, something is wrong — say so.

## 4. The ending

1. **Expected order:** debrief → the skill point is spent for real → the dog tag is
   shown → the workshop opens for the first time → the Field School appears.
2. **Skill point:** spend it and save. Reload and open **Skills** again.
   **Expected:** the build is still there. If it reverted, that is a blocker.
3. **Dog tag:** it should show your soldier's name, a gender pictogram, a serial
   like `DBD6-B90A`, `0815 GAMES · IRON PATH`, and the issue date. It is cosmetic
   and always worn — there is nothing to press.
4. **Check it is stable:** note the serial, reload, and check it is identical. It
   is derived from the account, never stored, so it must never change.
5. **Field School:** four entries — **Waffenkammer & Werkstatt**, **Fähigkeiten**,
   **Kampagne**, **Mehrspieler**. Tap each one and confirm it opens the real
   screen, not a second copy of anything.
6. **Decline path (optional, needs a second fresh account):** when the ending
   offers a step, decline it. **Expected:** the sequence stops cleanly, nothing is
   marked as done, and you are not trapped in a dialog.

## 5. Fullscreen (desktop)

1. Enter fullscreen with the toggle at the top of the screen. **Expected:** the
   battlefield fills the screen and every control needed to play is still
   reachable — build, upgrade, ability, speed, field menu.
2. Open a dialog (Skills or Armory) in fullscreen. **Expected:** it is centred and
   scrollable, with nothing clipped at the bottom.
3. Multiplayer party panel in fullscreen: readable and operable.
4. Press **Escape**. **Expected:** fullscreen exits cleanly in one press. If a
   dialog is open, decide which is more surprising — leaving fullscreen or closing
   the dialog — and record what actually happened.

## 6. Skill UI on real touch

1. Open **Skills**. Select a card. **Expected:** its details expand *inside* the
   card, and the screen does not jump to the top.
2. Scroll deep into the list, select a card near the bottom. **Expected:** the card
   stays put; no jump.
3. Check the states are distinguishable at a glance: unlocked, locked,
   equipped/main ability, selected. On a bright phone screen, in direct sun if you
   can.
4. **German + touch:** switch language while the dialog is open. **Expected:** the
   descriptions re-render in German without closing the dialog, and the layout
   does not break.
5. Try to reach an unsaved draft then close the dialog. **Expected:** a
   "discard changes" confirmation, in the current language.

## What counts as a blocker

Fix before inviting anyone else:

- The gate hides the language a reader needs, or the German sentence is wrong.
- Any briefing step shows English text to a German reader.
- Practice writes to the real save, or the sample banner is missing.
- The training contract cannot be completed by a reasonable new player.
- The skill point or the build is lost on reload.
- The dog tag changes between visits.
- Any screen traps the player: a dialog that cannot be closed, a disabled Next
  with no way forward, a lost Escape.

Everything else — copy that reads oddly, a tap target that is merely annoying, a
wave that is a bit slow — is a note, not a blocker.

## Current status

| Device | First pass | Notes |
| --- | --- | --- |
| Desktop, Chrome, 1440×900 | Not yet run on a device — CI covers layout only | |
| Phone, 390×844 | Not yet run on a device — CI covers layout only | |
| Phone, 320×700 | Not yet run on a device — CI covers layout only | |
| Desktop fullscreen | Not yet run | |
| Touch skill UI | Not yet run | |

CI runs the same screens headlessly at those three widths and walks the briefing
into the real dialogs, so a *layout* failure here is unlikely. A *feel* failure is
entirely possible, and that is what this pass is for.
