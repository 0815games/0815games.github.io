# Four-player multiplayer plan

## Product direction
- Four-player co-op: one large battlefield, two incoming roads, one shared bunker, individual supplies and existing personal wave rewards. Enemies spawn alternately on both roads. Initial balancing is experimental, not a competitive guarantee.
- 2 vs 2: two teams of two, each defending their own identical battlefield in the existing survival-race style. No enemy sending. Each team shares its bunker and tower pads; each player keeps their own supplies, abilities and progression rewards. Both teams start the same wave together; the last surviving bunker wins, simultaneous defeats draw. Team assignment and lobby presentation need to be implemented.
- Existing solo, two-player co-op and 1v1 stay available; preserve current saves, progression, rewards and legacy map geometry.

## Stages
1. **Simulation foundation (initial core implemented and tested; no UI):** deterministic large two-road map, support four co-op players, scale economy/health explicitly and test both paths, building, abilities, rewards and legacy compatibility. No public UI or Firebase dependency.
2. **Team match rules (initial offline core implemented and tested):** isolated 2v2 survival races, unanimous wave approval, team-local commands and simultaneous outcome handling; deterministic tests including forfeits and disconnect policy. No ranking or claim of fair-play enforcement.
3. **Party and security:** redesign four-digit lobby with three independent guest slots, explicit approval, locked immutable roster and team assignments, host/guest departure, reconnect and concurrency. Publish a complete updated Firebase ruleset only after emulator tests; deployment requires the owner to publish the complete rules first. Existing two-player parties and per-player receipts remain compatible. Test unauthorized access, races, slot reclamation and host loss.
4. **UI and integration:** render large, two-road map; mobile pan/zoom and clear team/road indicators, party roster, team selection, wave approval and results. Version snapshot/protocol where needed; handle old clients cleanly. Implement bounded bandwidth and monitor snapshot limits.
5. **Validation:** simulation regression/replay and Firebase emulator tests, followed by real desktop/phone sessions in both modes with disconnects, reconnects, tab suspension, rewards and bandwidth/performance checks. No public switch until rules are deployed and these paths work.

## Safety boundaries
The current Firebase lobby, roster rules and live protocol are two-player only. Do not enable 4-player controls or broaden rules before end-to-end authorization and lifecycle tests. Player-hosted simulations and client-writable progression are not cheat-proof; do not advertise rankings or competitive rewards as trustworthy. The host remains a single point of failure without a dedicated authoritative service.
