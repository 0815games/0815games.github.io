# Patches 6–7: beta test gate

The 2026-11 implementation hardens cleanup after fatal multiplayer errors and adds in-game connection guidance. This is not a declaration that either patch or the beta gate is complete. Automated mock-SDK and Firebase emulator tests are not production or physical-device tests.

## Online playtest (requires people, accounts and devices)

Use the GitHub Pages deployment, separate accounts and at least two devices. Everyone closes old tabs and reloads the current client before starting; old clients may misread or overwrite doctrine builds and cannot safely issue commands after a host focus pause. Keep codes and credentials private. Record date/build, device, browser, network, mode, steps, expected result, actual result and timestamps. Never include credentials or invite codes in reports.

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
| Host focus pause | In every mode, hide/blur the host during a wave; verify all fields freeze and show why, then resume. Blur a guest and verify the match continues. Exercise mobile backgrounding and pending commands. | Not yet run live |
| Network and cost | Short weak-network and background/sleep tests; monitor Firebase usage, especially recovery's full checkpoints. | Not yet measured live |

### Build-spot reservation: focused live test

Run with two signed-in players on separate devices in **co-op**, then repeat with teammates in **four-player co-op** and **2v2**. Keep all players on the current client. Record actual results; do not treat these steps as completed until they are observed.

1. Both players try the same empty pad nearly simultaneously. Only one build sheet should open; the other sees that the spot is occupied by a teammate's selection. The reserved player can inspect a tower without spending supplies.
2. Close the owner's sheet without building. The other player should be able to select and build on that spot; check the owner's supplies were not charged. Repeat with backdrop dismissal, changing to another pad, and confirming a build.
3. Leave the owner's build sheet open through several snapshots and a wave; the other player should remain blocked. Close it, then select it with the other player. Test an unavailable tower: a failed build must not spend supplies or give away the open reservation.
4. Interrupt the selecting player's connection or close their tab, then reconnect. Their abandoned reservation should clear; the teammate must be able to select that pad. If a claim was processed during a brief connection loss, wait for synchronization and check the spot becomes available rather than staying locked until expiry.
5. In 2v2, teammates contend for the same pad on their shared battlefield, but opponents on the other battlefield can reserve the corresponding pad independently. In 1v1 each opponent's battlefield is separate.
6. Check both mouse and touch if available, and record any delay, stuck menu, incorrect supply change, duplicate tower, or disagreement between screens. Real network interruption and reconnect timing are important; automated tests cannot prove this case on production devices.

For recovery's cost and limitations see `RECOVERY-ONLINE-TEST.md`. Host reload before the first checkpoint, the 64-takeover limit, abandoned records and network interruption remain known limitations. Invites are enumerable; the host must only approve known players. Client-controlled results, rewards and XP are not cheat-proof. Do not offer trusted rankings or rewards without server authority.

## Exit criteria

Fix and retest reproducible blockers; repeat the affected modes after each fix. Complete the matrix on representative real phones and desktop browsers and review usage before inviting a broader beta. A passing CI run alone is not the beta gate.
