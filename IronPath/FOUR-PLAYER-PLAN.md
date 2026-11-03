# Four-player multiplayer plan

## Product direction
- Four-player co-op: one large battlefield, two incoming roads, one shared bunker, individual supplies and existing personal wave rewards. Enemies spawn alternately on both roads. Initial balancing is experimental, not a competitive guarantee.
- 2 vs 2: two teams of two, each defending their own identical battlefield in the existing survival-race style. No enemy sending. Each team shares its bunker and tower pads; each player keeps their own supplies, abilities and progression rewards. Both teams start the same wave together; the last surviving bunker wins, simultaneous defeats draw. Team assignment and lobby presentation need to be implemented.
- Existing solo, two-player co-op and 1v1 stay available; preserve current saves, progression, rewards and legacy map geometry.

## Stages
1. **Simulation foundation (initial core implemented and tested; no UI):** deterministic large two-road map, support four co-op players, scale economy/health explicitly and test both paths, building, abilities, rewards and legacy compatibility. No public UI or Firebase dependency.
2. **Team match rules (initial offline core implemented and tested):** isolated 2v2 survival races, unanimous wave approval, team-local commands and simultaneous outcome handling; deterministic tests including forfeits and disconnect policy. No ranking or claim of fair-play enforcement.
3. **Party and security (lobby and transport prototypes mock-tested; rules and UI still outstanding):** redesign four-digit lobby with three independent guest slots, explicit approval, locked immutable roster and team assignments, host/guest departure, reconnect and concurrency. Publish a complete updated Firebase ruleset only after emulator tests; deployment requires the owner to publish the complete rules first. Existing two-player parties and per-player receipts remain compatible. Test unauthorized access, races, slot reclamation and host loss.
4. **UI and integration (renderer and motion prediction prepared; UI not wired):** render large, two-road map; mobile pan/zoom and clear team/road indicators, party roster, team selection, wave approval and results. Version snapshot/protocol where needed; handle old clients cleanly. Implement bounded bandwidth and monitor snapshot limits.
5. **Validation:** simulation regression/replay and Firebase emulator tests, followed by real desktop/phone sessions in both modes with disconnects, reconnects, tab suspension, rewards and bandwidth/performance checks. No public switch until rules are deployed and these paths work.

## Safety boundaries
The published Firebase rules and ordinary live lobby support only two-player parties. Do not enable 4-player controls or broaden rules before end-to-end authorization and lifecycle tests. Player-hosted simulations and client-writable progression are not cheat-proof; do not advertise rankings or competitive rewards as trustworthy. The host remains a single point of failure without a dedicated authoritative service.

The staged four-player lobby (`firebase-four-lobby.mjs`) and host/game transport now use isolated `fourParties` / `fourCodes` paths and are exercised with in-memory SDK tests, including roster locking, ordered receipts, reconnect and reward participation. These are not security tests; see `firebase/FOUR-PLAYER-RULES-SPEC.md` for the still-required complete ruleset and emulator gate.

The staged `battle-viewport.mjs` provides fit, bounded pan, anchored zoom and CSS-to-world pointer conversion for the larger battlefield, with geometry tests. It is wired into `game.js` behind the explicit, default-off `experimentalFourViewport` option, and wired to the experimental online four-player flow; it remains default-off. The combined rules and SDK lobby flow now pass the emulator CI, including simultaneous start/departure and duplicate approval tests; this is not a security review or real-device validation.

The staged viewport now has a clipped canvas drawing helper and a pointer controller for tap, drag, pinch and wheel zoom. These are unit-tested and have an experimental game integration smoke test; actual mobile gesture behavior still needs device testing.

The staged lobby adapter exposes subscriptions for host, own request, configuration and individual profiles so the next UI can show approval and readiness without reading forbidden parent paths. Security rules remain draft-only.

A hidden four-player lobby panel now covers code entry, approval/decline, four-slot readiness, co-op or balanced 2v2 selection, start handoff and logout cleanup. It is connected to the game adapter behind `?fourPlayerTest=1`, but the required Firebase rules are not published. Emulator-backed panel flow, accessibility and real-device testing remain required.

The former unlinked offline playground was removed. Automated four-player simulation, viewport and online protocol tests remain; real online device testing is still required.

The emulator suite exercises four real Firebase SDK clients for each mode: presence, synchronized wave approval, tower replication, disconnect and reconnect. This tests the adapter and draft rules together, not the browser panel or real devices. The host is still a single point of failure; a reloaded host cannot resume the prior authoritative simulation. Do not publish rules or merge until security, lifecycle and real-device tests are complete.

The emulator gate now also exercises the actual four lobby panel controllers through code creation, three approvals, mode/team configuration, four real Firebase SDK game clients, synchronized wave approvals and a tower build in both modes. The panel's DOM is simulated, not a browser; it is not a substitute for real-device tests. Legacy rule nodes in the combined draft have been compared against the progression baseline and match exactly. Game and server regression suites are also included in CI.

The online alpha branch now shows the four-player party without a query parameter. The user reports publishing the combined Firebase rules; that publication has not been independently verified here. The branch is not merged into main, and real desktop/phone multiplayer testing and security review remain release gates.
