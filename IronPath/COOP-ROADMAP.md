# Iron Path: co-op foundation and roadmap

## Goal and current status
One authoritative shared match for one or two authenticated players, using the same rules for solo and co-op. This is an incremental migration of the existing prototype: **online co-op does not exist yet and the match is not cheat-proof**.

## Started: command rules
`match.mjs` is a DOM- and Firebase-independent command layer. `simulation.mjs` contains the fixed-step shared movement, enemy waves, attacks, cooldowns and outcomes. The solo UI executes this simulation; replay and two-player simulation tests run without a browser. The current solo game uses it for build, upgrade, tap-to-move, and airstrike. It models player-specific positions/cooldowns and a shared bunker economy and shared towers. Either participant may upgrade a shared tower. Each tower records its builder. Automated tests exercise two players, invalid inputs, shared resources and independent cooldowns. The server must supply the player identity from the authenticated connection; an ID sent in a command is not proof of identity.

## Next milestones
1. Continue hardening the shared fixed-step simulation and command API. Keyboard movement and starting waves now use the command boundary, and the simulation advances every player independently. Continue testing full matches and refine target ordering and event handling. Speed and pause remain local UI controls; define their co-op permissions before networking. Rendering and profile/reward persistence still assume one local player. No two-player rendering or online transport is implemented. Player level is captured at the start of a wave in the current solo adapter; a future authoritative service must load trusted stats.
2. Add versioned snapshots, a server-ordered tick/command protocol, replay and reconnect tests. Avoid trusting client timestamps or allowing clients to write match state or award their own rewards. Account for duplicate, delayed, out-of-order and invalid commands.
3. Run that engine on an authoritative, long-lived game service. Authenticate both players with Firebase ID tokens, enforce lobby membership and rate limits on the server, and persist validated results with Admin credentials. Evaluate hosting and cost before choosing the service. Cloud Functions are appropriate for bounded account/invite operations, not assumed to be a continuously running real-time match host.
4. Build private lobbies/invites, join/leave/reconnect, timeouts and two-player UI; add narrowly scoped Firebase rules for each new data path and integration tests. Do not expose active authoritative state as client-writable database data.
5. Build skill allocation and stat aggregation as shared, versioned graph rules, including self/ally/shared-defense effect scopes. Validate allocations and refunds with a trusted server transaction; test connectivity and cross-player effects. Keep existing profile XP compatible.
6. Test online sessions on real phones, desktop, poor networks and across devices; measure latency, failure recovery and infrastructure cost before release.

**Existing XP remains client-awarded and modifiable.** The current Firebase rules provide account isolation but do not validate fair play. No existing database rules were changed by this foundation. None of the shared code becomes secure merely by running in a browser.
