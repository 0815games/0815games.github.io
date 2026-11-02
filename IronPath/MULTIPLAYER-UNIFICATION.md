# Unified multiplayer lobby — work in progress

One Multiplayer button and one four-digit code must serve all supported party sizes. The host approves guests into a shared roster and chooses from the modes allowed by the current number of ready players:

- 2 players: existing co-op or 1v1.
- 3 players: co-op on the larger two-road map.
- 4 players: co-op on the larger map or 2v2, with balanced teams.

The first increment adds this policy and three-player large-map simulation/host/transport support. **It is not yet wired to the live lobby and is not playable online.** The existing two-player and four-player panels and deployed rules are unchanged. Do not deploy this increment as if the unified lobby were finished.

Remaining: migrate both two-player modes and the 3/4-player modes onto one compatible authenticated roster and code namespace; redesign the manifest and rules so the locked roster has 2, 3 or 4 members and the mode is valid for that count; compare the current published rules and provide a complete replacement rather than a fragment; preserve existing running two- and four-player sessions; update the single panel, game handoff, reconnect and departure paths; emulator-test permissions and start/join/leave races for every size, then run real multi-device tests before release. Player-hosted simulation and progression remain non-authoritative.
