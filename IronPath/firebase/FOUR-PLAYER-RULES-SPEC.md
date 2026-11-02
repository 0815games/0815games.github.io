# Four-player Firebase security requirements — NOT DEPLOYABLE RULES

The four-player client and transport are experimental and disabled in the UI. Current deployed rules know only the two-player `parties`/`partyCodes` schema. Four-player traffic uses separate `fourParties`/`fourCodes` paths so widening an old rule is not necessary. **This document grants no access and is not a replacement ruleset.** The next stage must produce a complete combined ruleset and run Firebase Emulator tests before asking the project owner to publish it.

## Intended paths

- `fourCodes/$code/{hostId,partyId,requests/$uid}`: reserve a four-digit code; authenticated players create/delete only their own request; host can read requests and decline them. Request names must match `players/$uid/name`. Code enumeration and malicious request floods remain possible without rate limiting.
- `fourParties/$partyId/hostId`: immutable authenticated creator. `inviteCode`: host-only immutable four-digit code linked back to the reserved code.
- `slots/{one,two,three}`: host transactionally approves at most three distinct non-host IDs that have active requests. Each value must be unique across all slots; no extra keys. A guest may remove only their own slot before start. Once started, no roster replacement or guest departure from the locked roster; presence and forfeit represent departures.
- `profiles/$uid`: a roster member publishes their own validated name, gender, level, optional skill build and loadout before start. The existing name/skill/loadout validation and account rules remain intact. Host and roster members may read only what the game needs; outsiders cannot read profiles.
- `config`: host-only pre-start mode (`four-coop` or `two-vs-two`) and exactly four binary team assignments with two per team. The host is slot zero. Configuration becomes immutable at start.
- `started`: host-only, create-once manifest (`hostId`, ordered `playerIds`, `mode`, team assignments). At **commit time**, rules must compare every member to the current host and three unique slots, compare mode/team configuration, and require valid published profiles for all four. It must not be possible to start a roster that changed while the host was reading it. Reconnecting members may read the manifest; outsiders cannot.
- `inputs/$uid`: only the matching locked member can write a bounded packet; only host and that member can read it. `views/$uid`: only host writes, only the matching locked member reads, bounded packet size. `presence/$uid/$connection`: only matching locked member writes/deletes a bounded timestamp; only locked members read. Enforce party existence, identity, roster and manifest on every path.
- Host-only party/code cleanup must not permit creation or overwriting of arbitrary nested data. A `started` party can be closed by the host, but client-controlled rewards are not thereby trusted.

## Emulator gate

Test valid four-account setup, code collision and request approval; invalid/duplicate/full slots; unauthorized host and guest writes; team sizes and immutable mode; the simultaneous-start-versus-leave/approval races; manifest mismatch, missing profile, invalid skills and names; own-input/own-view isolation; presence expiry paths; reconnect into the original locked roster; host-only cleanup; and all existing two-player, profile and reward-rule tests against the **same complete ruleset**. Explicitly test concurrent parent/child slot writes and ensure Firebase rules see current root state at commit.

The existing `createFirebaseFourLobby` and four-player game adapter perform client-side checks only. Their mock SDK tests cannot prove any rule, transaction race or real connectivity property. The live mode must remain disabled until the complete rules are reviewed, emulator-tested, published by the owner, and end-to-end sessions tested on real devices.
