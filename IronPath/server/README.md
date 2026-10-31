# Experimental co-op match service

This is an **experimental, single-process, single-match server**, not a production deployment and not connected to the game UI. It hosts the existing fixed-step protocol over WebSockets. Two preconfigured player UIDs form the roster. The server verifies Firebase ID tokens (including revocation checks at connection), loads profiles from the Realtime Database using Firebase Admin, checks the explicit Origin allowlist and roster, and pauses the match on disconnect. On disconnect, held movement is neutralized and that player's pending commands are cancelled; reconnecting returns a fresh snapshot with sequence receipts. Inputs are bounded and rate-limited. No production credentials, hosting, public endpoint or database rules are included.

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

- No lobby/invite service, browser co-op integration, friend list, matchmaking or ready-up UI.
- State and checkpoints are only in memory. Restart loses the match. There is no durable idempotent reward processing or co-op XP, and existing solo XP is client-writable/untrusted. Profile XP loaded for the match is likewise not cheat-proof.
- Only one statically provisioned roster per process. Match lifecycle, capacity, persistent recovery, replay protection, observability, deployment, cost limits and abuse controls need design and testing.
- No encryption at the process itself, CSRF/origin allowlisting alone is not authentication, and rate limiting is per connection rather than distributed. Firebase ID token revocation is checked on connection; active sessions are closed on token expiry, not continuously rechecked for revocation.
- Fixed interval scheduling does not compensate for overloaded event loops; latency, bandwidth and disconnect behavior need real-device testing. The entire match pauses whenever either player disconnects and resumes when both reconnect; a timeout or forfeit policy remains to be designed.

The dependency audit currently reports moderate advisories in transitive Firebase Admin/Firestore dependencies (`glob`/`minimatch`); the server does not explicitly use Firestore. Reassess and update dependencies before any public deployment. Avoid forced major-version overrides without compatibility testing.
