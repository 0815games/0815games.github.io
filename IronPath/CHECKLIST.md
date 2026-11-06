# Iron Path checklist

Work through the remaining items before stress and balance testing. Previously released multiplayer features still need real-device validation; see [BETA-TEST-PLAN.md](BETA-TEST-PLAN.md).

- [x] First run reworked, v2: language gate on every device, and the briefing is no longer a modal over a paused field. A first login builds the training field and briefs **on** it with six cards that never pause and stay under half the screen. Practice still drives the real dialogs in a sandbox.
- [x] First run reworked, v3: the contract is **five waves and the boss of wave 5 ends it**; the run tops up to 300 XP so the point is guaranteed; the dog tag (with a derived blood type) is issued in its own popup as the boss reward; the ending then runs tag → equipment → skill point → workshop. See [TUTORIAL.md](TUTORIAL.md) and [TUTORIAL-V3-PLAN.md](TUTORIAL-V3-PLAN.md).
- [ ] Validate the first run on a real phone and a real desktop browser: gate, field-first cards, five-wave contract, dog tag award, equipment, skill save, workshop, Field School. **Script: [FIRST-RUN-DEVICE-TEST.md](FIRST-RUN-DEVICE-TEST.md)** — steps, exact German strings, and what counts as a blocker. The phone layout is the open question: CI proves the card is under half the viewport and that the wave clock keeps running, but not how it feels in the hand.
- [x] First run optics, v3: coach card, Help replay and dog tag now share one dossier look (plate, gold, hairline, stencil kicker), the card shows progress ticks, and the short-viewport rules that broke the phone (max-height without overflow) are locked by `tests/interface-redesign.test.mjs`. What CI still cannot judge is whether the type is *readable* at 360 px — that stays in the device row above.
- [ ] Continue the English/German translation incrementally. Untranslated content stays in English; incorporate feedback from testing.
- [x] Add a fullscreen option for desktop browsers, with all controls needed to play available in fullscreen.
- [ ] Validate fullscreen in real desktop browsers, including gameplay, dialogs, and exiting with Escape. Covered by section 5 of [FIRST-RUN-DEVICE-TEST.md](FIRST-RUN-DEVICE-TEST.md).
- [x] Check online status for invitations. Real two-account testing remains needed.
- [x] When new skill points are available, highlight the Skills button and show the number of unspent points. Do not show a separate message.
- [x] For new friend requests, highlight the Friends button and show the number of requests, rather than a separate notification. Real two-account testing remains needed.
- [x] Add a friend stats window so players can inspect a friend's level, armory, skills, and other relevant stats before playing together. Real two-account validation remains needed.
- [ ] Stress and balance test single-player, Endless, and all multiplayer variants, including real-device testing. Initial local stress results: [STRESS-REPORT.md](STRESS-REPORT.md); balance and real-device/network testing remain open.
- [ ] Tower prestige prototype: repeatable level-6 prestige, visible shine and level reset while retaining power. Validate on real devices and balance the costs and damage before considering this complete.

- [ ] Skill UI: validate inline expanded descriptions, scrolling and class/state highlights on real mobile and desktop devices. Covered by section 6 of [FIRST-RUN-DEVICE-TEST.md](FIRST-RUN-DEVICE-TEST.md).
