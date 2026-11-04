# Patches 6–7: beta test gate

The 2026-11 implementation hardens cleanup after fatal multiplayer errors and adds in-game connection guidance. This is not a declaration that either patch or the beta gate is complete. Automated mock-SDK and Firebase emulator tests are not production or physical-device tests.

## Online playtest (requires people, accounts and devices)

Use the GitHub Pages deployment, separate accounts and at least two devices. Everyone closes old tabs and reloads the current client before starting; old clients may misread or overwrite doctrine builds. Keep codes and credentials private. Record date/build, device, browser, network, mode, steps, expected result, actual result and timestamps. Never include credentials or invite codes in reports.

| Case | Minimum exercise | Result |
| --- | --- | --- |
| Doctrine | Unlock a specialist, buy a doctrine, save, reload; verify bonus in solo and multiplayer. | Not yet run live |
| 2-player co-op | Create, approve, build, wave, rewards, guest drop/rejoin, host close. | Not yet run live |
| 1v1 | Wave approval, separate bunkers, disconnect/pause/rejoin, forfeit. | Not yet run live |
| 3-player co-op | Large map, all approve, shared pads, leave/rejoin, rewards. | Not yet run live |
| 4-player co-op | Same, including touch controls and crowded waves. | Not yet run live |
| 2v2 | Teams, shared pads, isolated supplies, pause/rejoin, simultaneous defeat/draw. | Not yet run live |
| Host reload | Normal party: no recovery promised. Separate short `?recovery=1` trial: host resume, with current clients only. | Not yet run live |
| Fatal failure | Confirm failed client stops presenting itself online and versus peers pause. | Not yet run live |
| Mobile and accessibility | Phone/tablet portrait and landscape, touch, reduced motion, sound, keyboard/focus, legibility. | Not yet run on devices |
| Network and cost | Short weak-network and background/sleep tests; monitor Firebase usage, especially recovery's full checkpoints. | Not yet measured live |

For recovery's cost and limitations see `RECOVERY-ONLINE-TEST.md`. Host reload before the first checkpoint, the 64-takeover limit, abandoned records and network interruption remain known limitations. Invites are enumerable; the host must only approve known players. Client-controlled results, rewards and XP are not cheat-proof. Do not offer trusted rankings or rewards without server authority.

## Exit criteria

Fix and retest reproducible blockers; repeat the affected modes after each fix. Complete the matrix on representative real phones and desktop browsers and review usage before inviting a broader beta. A passing CI run alone is not the beta gate.
