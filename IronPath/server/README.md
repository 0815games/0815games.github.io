# Experimental co-op match service

This is an **experimental, single-process, single-match server**, not a production deployment and not enabled in the public game UI. It hosts the existing fixed-step protocol over WebSockets. Two preconfigured player UIDs form the roster. The server verifies Firebase ID tokens (including revocation checks at connection), loads profiles from the Realtime Database using Firebase Admin, checks the explicit Origin allowlist and roster, and pauses the match on disconnect. On disconnect, held movement is neutralized for both players and both players' pending commands are cancelled; reconnecting returns a fresh snapshot with sequence receipts. Inputs are bounded and rate-limited. No production credentials, hosting, public endpoint or database rules are included.

## Local development and tests

Use Node 22 or later:

```sh
cd IronPath/server
npm ci
npm test
```

Tests use a mock token verifier and local real WebSocket connections; they do **not** verify the Firebase project or live credentials. `main.mjs` always uses Firebase Admin; there is no production mock-auth switch.

To run against a configured Firebase project, provide Application Default Credentials through your deployment platform, grant the service identity the minimum required access, and set `IRONPATH_PLAYER_UIDS` to the two comma-separated Firebase UIDs, `IRONPATH_ALLOWED_ORIGINS` to explicit comma-separated exact browser origins (for example the actual GitHub Pages origin), and optionally `PORT`. The server binds `0.0.0.0`. Do not commit credentials or put tokens into URLs. It expects a TLS/WSS-terminating reverse proxy with the WebSocket path `/match`; `/healthz` reports basic process liveness only. Do not expose this prototype publicly without a security review and platform-level protections.

## Wire sketch

Connect to `/match` from an allowed Origin. The first JSON message is `{ "type": "auth", "token": "<Firebase ID token>" }`; tokens are not sent in URL query strings. After authentication the server sends a player-specific snapshot and a ready status. While both roster members are connected, send `{ "type": "command", "envelope": { "version": 1, "seq": 1, "command": { "type": "startWave" } } }`. The server reports queued and applied receipts, ordered tick events and periodic snapshots. Sequence numbers are per player. Snapshot requests use `{ "type": "snapshot" }`. Commands are rejected while a member is disconnected; on reconnect, inspect `nextSeq` and the recent receipts to reconcile. Token expiry terminates the connection; reconnect with a fresh token.

## Limitations before real players

- No deployed lobby/invite service, friend list, matchmaking or ready-up UI. The co-op UI adapter is disabled by default.
- State and checkpoints are only in memory. Restart loses the match. There is no durable idempotent reward processing or co-op XP, and existing solo XP is client-writable/untrusted. Profile XP loaded for the match is likewise not cheat-proof.
- Only one statically provisioned roster per process. Match lifecycle, capacity, persistent recovery, replay protection, observability, deployment, cost limits and abuse controls need design and testing.
- No encryption at the process itself, CSRF/origin allowlisting alone is not authentication, and rate limiting is per connection rather than distributed. Firebase ID token revocation is checked on connection; active sessions are closed on token expiry, not continuously rechecked for revocation.
- Fixed interval scheduling does not compensate for overloaded event loops; latency, bandwidth and disconnect behavior need real-device testing. The entire match pauses whenever either player disconnects and resumes when both reconnect; a timeout or forfeit policy remains to be designed.

The dependency audit currently reports moderate advisories in transitive Firebase Admin/Firestore dependencies (`glob`/`minimatch`); the server does not explicitly use Firestore. Reassess and update dependencies before any public deployment. Avoid forced major-version overrides without compatibility testing.

## Experimental client adapter

`../coop-client.mjs` is an independent browser-side transport adapter for this protocol. It obtains a fresh Firebase ID token from an injected token provider on each connection, sends it in the first WebSocket message, accepts WSS (or localhost WS for development), tracks snapshots and bounded reconnects, and exposes command results. It permits only one command in flight. If a command times out with an unknown outcome, the adapter requires a fresh snapshot before accepting another command rather than blindly replaying a purchase. If the server says a command was cancelled on disconnect, the caller must decide whether to issue a new action. The server's sequence and receipt rules remain authoritative; the adapter is not anti-cheat.

The game UI uses this adapter behind a disabled-by-default feature flag. The URL must come from trusted deployment configuration and point to the deployed match service, not a token-bearing link. No public service is deployed by this repository.

## Opt-in UI integration (development only)

The browser now contains a feature-flagged co-op adapter. `IronPath/coop-config.mjs` deliberately exports `null`, so normal players see solo only. Once a **trusted**, reviewed WSS server has been deployed and both roster UIDs configured on that server, a developer can set this constant to its exact `wss://…/match` endpoint. The endpoint is fixed by trusted application code, not supplied by players or invite links; otherwise a malicious server could receive Firebase ID tokens. The game will then show a test join/leave control. Do not enable it for the public site without the safeguards below.

In test mode the browser renders both players from server snapshots and sends actions as commands, without simulating co-op locally or awarding client-side XP. Speed is fixed at 1×; unlike solo, the match continues while tower and tutorial menus are open. The server pauses while either player is disconnected. Tower upgrades/sales include expected tower identity and level to reject stale choices. This is not a lobby, and both participants must be in the server's configured roster.

Limitations: no durable match state, co-op rewards, friend invites, live Firebase end-to-end test, production security review or public deployment. A client can still modify solo XP, which is currently used for server-loaded character levels. Transport snapshots are rendered directly (no interpolation); final UX and mobile multiplayer testing remain necessary.

## Experimental private lobby rules

`lobby.mjs` implements an **in-memory rules component**, not a network service or a player-facing lobby. An authenticated owner can create a two-player waiting room, issue or revoke a short-lived, single-use cryptographically random invitation, and start once both players have joined. Invitation secrets are indexed only by hash; lobby views do not expose them. Waiting rooms and invitations expire, capacity is bounded, and a player may belong to at most one room. Active rooms are locked until the trusted match lifecycle calls `finishMatch`. A test provisions a real local WebSocket match from a lobby roster, using mocked authentication.

All UID arguments **must** be taken from verified authentication, never a request body. The match allocator must load trusted profiles, enforce roster admission and call `finishMatch` only after its match has stopped. Do not expose this component directly: it has no authentication, network endpoint, cross-process synchronization, durable storage, rate limiting, abuse prevention, user interface, or crash recovery. Invitations are bearer secrets: transmit over TLS, avoid logging or URL query strings, and never send Firebase tokens to invitation-provided destinations. A production implementation needs atomic storage transactions and limits across instances, plus a lifecycle policy for abandoned active matches.

## Experimental authenticated lobby HTTP adapter

`lobby-service.mjs` exposes the in-memory lobby rules through an injected token verifier and an explicit browser Origin allowlist. It is **not included in the production entry point, deployed, or enabled in the game**. Its tests use real local HTTP requests and mock token verification, not live Firebase. Routes are `GET /lobby`, `POST /lobby`, `POST /lobby/invite`, `DELETE /lobby/invite`, `POST /lobby/join` (JSON `{ "secret": "..." }`), and `DELETE /lobby`. The verified token UID, never a request body UID, determines the acting player. Bearer tokens belong in the Authorization header; invite secrets belong in the HTTPS request body and must not be logged. Responses use `no-store` and only approved origins get CORS access. When a trusted allocator is explicitly injected, `POST /lobby/start` reserves and starts a match for the owner and `GET /lobby/match` returns its status and opaque ID only to lobby members. The default adapter exposes neither route.

The per-identity rate limit is process-local and only applies after token verification. It does not protect the verifier from unauthenticated traffic or provide a distributed quota. The registry and rate limits vanish on restart and cannot coordinate across instances; the service still requires HTTPS termination, network-level abuse controls, durable atomic storage, real Firebase integration tests, a match allocator and lifecycle, and a security review before deployment. It is not a production-ready invitation service.

## Experimental match allocation

`match-allocator.mjs` is a bounded, in-process coordinator linking a lobby roster to a trusted player loader and match launcher. It reserves the lobby and a capacity slot synchronously before doing any asynchronous work, preventing concurrent duplicate starts. Only the owner can start; a lobby member can see its match ID/status. The allocator never accepts player identities or a server URL from a client. On allocation failure the lobby is removed and both members are released. On shutdown failure the reservation is retained for retry rather than accidentally allowing a second match. The launcher must clean up any partially created resources if it throws, and return a `stop()` method that resolves only after the match is fully stopped.

The integration test starts a real local HTTP lobby and WebSocket match with mock authentication, verifies both players can issue commands and rejects an outsider. This is not a deployable complete system: there is no production launcher or routing to match IDs, no browser lobby UI, no automatic abandonment/timeout cleanup, no durable/distributed capacity or state, no recovery after crashes, no real Firebase end-to-end test, and no trusted reward persistence. A stalled loader/launcher can hold a slot; a disconnected HTTP client does not cancel an in-progress allocation. Do not enable the routes publicly until those lifecycle and infrastructure issues are addressed.
