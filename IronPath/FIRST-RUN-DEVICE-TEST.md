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

To repeat a first run on the same device afterwards, clear these keys in the
browser's local storage for the site:

| Key | What it remembers |
| --- | --- |
| `ironpath:language` | the gate choice for this device |
| `ironpath:coach:v2:<account id>` | the first-run cards were shown |
| `ironpath:training:v2:<account id>` | the training contract was offered |
| `ironpath:firstrun:v2:<account id>` | the ending was offered |
| `ironpath:tutorial:v2:<account id>` | the *replay* briefing (Help panel) was seen |

Older keys you may still find, and what they mean now:

- `ironpath:tutorial:v1:` — the 8-step tour. Ignored. It once hid the new briefing
  from every existing account; leaving it in place is the point, so **do not**
  clear it to test anything.
- `ironpath:firstrun:v1:` — the old ending order (skills first, no dog tag).
  Ignored since the ending moved to v2, which is why an old account still gets the
  new ending once.

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
   anything else, with **CHOOSE YOUR LANGUAGE / SPRACHE WÄHLEN** as the heading.
   The note under the tiles reads *"You can change this later in
   Settings."* in English and the German line directly beneath it.
   **First thing to check:** both tiles show a **real flag image**, not the
   letters `GB` / `DE` — Windows renders flag emoji as bare letters, so a gate
   that looks right on your phone can look broken on a Windows laptop.
2. **Check no English reader is stuck:** both tiles must be readable and
   tappable — **English** / *Continue in English* and **Deutsch** / *Auf Deutsch
   fortfahren*.
3. **Check no German reader is stuck:** the German sentence *"Du kannst die
   Sprache später in den Einstellungen ändern."* must be complete and in correct
   German. If it is not, that is a fail even if you read English. It sits
   directly under the tiles, so nobody has to read the English line first.
4. Pick **Deutsch**. **Expected:** the whole gate disappears at once — no flash of
   English underneath, no half-translated screen.
5. Reload. **Expected:** no gate; the game opens straight in German.
6. Switch to English with the language selector in the Settings dialog and
   reload. **Expected:** the choice stuck, and no gate returned.

**On a phone specifically:** the gate must fit without scrolling on a 320 px wide
screen, and both buttons must be reachable with a thumb.

## 2. Field first, then the cards (the phone fix)

A fresh account now lands **on the battlefield**, not on a briefing. This section is
the whole reason the first run was rebuilt; test it before anything else.

1. **Expected:** the training field is built and visible, and a small card appears
   over its lower edge: **ERSTER EINSATZ · 1 / 7** with *Willkommen, Soldat*.
   It must appear **after** the field is drawn, never over an empty canvas.
2. **The card is not a modal.** Tap the field while it is open. **Expected:** the
   tap goes through — a build marker opens, or your soldier moves. If the tap is
   swallowed, that is a blocker.
3. **The game does not pause.** Deploy a wave with the card still open and watch
   the enemies. **Expected:** they walk. The old build froze the field here, which
   is what made the first run unplayable.
4. **The card is small.** At 390 x 664 it must take less than half the screen and
   never cover the Deploy button or the build pads. Try 360 x 480 as well: the
   card may scroll *inside* itself, but its **NEXT** button must stay reachable
   without scrolling the page.
5. **The cards follow what you do**, not a click sequence: build a tower → *Baue
   einen Turm* goes away; upgrade it → the next; move your soldier → the next;
   Deploy → the next. Each card is one sentence and at least 44 px per button.
6. **The card does not move.** Scroll hard — swipe up and down on the field, on the
   card, anywhere. **Expected:** the card stays at the bottom, the field moves, and
   the ring stays on the pad. If the card drifts with the page, that is a blocker:
   the card and its pointer then point at different things.
7. **German check:** every card must be German — `ERSTER EINSATZ · n / 7`,
   *Willkommen, Soldat*, *Baue einen Turm*, *Der Boss ist da*, `VERSTANDEN`.
   Anything in English is a fail.
8. **Dismiss:** the × must hide the card for good, and it must not come back on
   reload. Nothing is written to your soldier.

**Landscape (844 x 390):** the card moves to the right-hand side and leaves the
build pads on the left. It must not cover them.

## 3. Training contract (five waves, boss ends it)

1. **Expected:** the objective reads **AUSBILDUNGSVERTRAG · MIT VORSICHT** and
   **WELLE 1 / 5**, with *"Noch 4 Welle(n) schaffen. Hier sind die Gegner
   geschwächt und dein Bunker ist verstärkt."*
   It must sit **below** the status row (WAVE / BUNKER / SUPPLIES) and leave the
   field menu on the right free. Nothing of it may be hidden behind either. On a
   short screen (360 x 480) the hint line disappears and only the title and the
   progress bar stay — that is intended, the pads matter more.
2. **Play it properly** — build towers, upgrade them, move your hero, use the
   ability when you get one. Note the time per wave and total.
3. **Expected:** the bunker has more health than a normal run (150 instead of
   100), enemies die noticeably faster, and **the boss of wave 5 is the last thing
   you fight**. When it falls, the run ends by itself and nothing follows it. Wave 5
   must not ask you for a field upgrade — if it does, the run is stuck.
4. **The boss card:** when the boss of wave 5 walks on, the card must switch to
   *Der Boss ist da* even if you were still reading an earlier one.
5. **The page does not scroll away.** On the training field a swipe must move the
   map, never the page behind it: with the document scrolling, the coach card and
   its ring leave the screen while the battle keeps running.
6. **Expected ending:** a notice reads *"Ausbildungsvertrag erfüllt! 450 XP
   verdient. Willkommen auf dem Eisernen Pfad, Soldat."* — the waves pay 250 and
   the contract adds 200, so the run always ends at level 2 with one point and
   150 XP of headroom towards level 3.
6. **After the debrief, Deploy must work.** Close the debrief and press Deploy.
   **Expected:** a fresh battlefield. (The old build left a dead Deploy button
   here.)
7. **The pass/fail question no automated test can answer:** did it feel like a
   tutorial or like a punishment? If a new player loses this, that is a blocker —
   record exactly which wave and what was on the field.

For reference, a headless simulation of the real command path (level 1, builds on
every pad, upgrades when supplies allow) clears all five waves in about 65
seconds and ends the boss wave with 100 of 150 bunker health left.

## 4. The ending

1. **Expected order:** debrief → **dog tag** → **equipment** → **skill point** →
   workshop → Field School. Gear comes before skills on purpose: the boss reward
   goes on first, the point is spent after.
2. **Dog tag popup:** the heading reads **Deine Hundemarke**, full size, with your
   soldier's name, a gender pictogram, a
   serial like `DBD6-B90A`, a blood type like `A RH+`, `0815 GAMES · IRON PATH`,
   the issue date, and the note *Abgeleitet, nicht erfasst.* Press **ANLEGEN**.
3. **Check it is stable:** note serial **and blood type**, reload, and check both
   are identical. They are derived from the account, never stored, so they must
   never change. If the blood type looks like a real medical record to you, say
   so — the label is meant to prevent exactly that.
4. **Equipment:** the real Armory opens on the Equipment tab. Put on what the run
   earned. **Expected:** it saves to your soldier (this is not the practice
   sandbox), and the step ends when you close the armory.
5. **Skill point:** spend it and save. Reload and open **Skills** again.
   **Expected:** the build is still there. If it reverted, that is a blocker.
6. **Field School:** four entries — **Waffenkammer & Werkstatt**, **Fähigkeiten**,
   **Kampagne**, **Mehrspieler**. Tap each one and confirm it opens the real
   screen, not a second copy of anything.
7. **Decline path (optional, needs a second fresh account):** when the ending
   offers a step, decline it. **Expected:** the sequence stops cleanly, nothing is
   marked as done, and you are not trapped in a dialog.

## 5. Fullscreen (desktop)

1. Enter fullscreen with the toggle in the Settings dialog. **Expected:** the
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
- A first-run card shows English text to a German reader.
- A first-run card blocks a tap on the field, or the wave clock stops while it is
  open.
- The equipment step writes to the practice sandbox, or the sample banner is
  missing.
- The training contract cannot be completed by a reasonable new player.
- The skill point or the build is lost on reload.
- The dog tag or its blood type changes between visits.
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
