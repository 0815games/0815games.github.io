# Endless workshop alpha: scope and safety

The intended first playable test is on GitHub Pages for endless solo and multiplayer. Campaign workshop integration follows later. This is a target, **not an available build**: the workshop remains disabled and the experimental modules are not wired into live matches or saving.

## Alpha must let the tester

- Open inventory from the soldier/Command Center, see retained equipment, craft, equip and modify items, and save changes across reloads.
- Play endless solo and the existing multiplayer modes with the selected effects, earning regular wave rewards and completed-boss-wave materials without duplicate credit on retries.
- Return, reconnect, and see accurate saved progress; recover safely from an unavailable service or uncertain transaction result.
- Test narrow mobile layouts and English/German text. Prices and effects are provisional alpha values.

## Free-tier direction (supersedes the server recommendation below)

The user requires **no paid services**. Use GitHub Pages for the static game and the existing Firebase Authentication/Realtime Database client SDK and transactions. Do not require Cloud Functions, a paid backend, a separate hosting provider or a Blaze upgrade. Stay within Firebase's free-tier limits; free-tier availability and quotas are controlled by Firebase and are not guaranteed to cover unlimited use. Do not enable billing.

This changes the trust model: completion and progression are client-reported, and Firebase rules cannot validate our encoded inventory or fully prevent a malicious owner from deleting receipts or cheating. Transactions and receipts can reduce accidental duplication, not prove honest play. Old-client compatibility, account preservation, rules review and safe recovery still need work; these are not solved by accepting the anti-cheat limitation. The server prototypes remain research artifacts, not a deployment dependency.

The gated workshop UI now selects the existing direct Firebase transaction adapter again. It remains disabled: switching adapters is not a release or a complete alpha. The unused HTTP client and trusted service prototypes are retained for reference and are not required by this free-tier direction.

## Alpha access (free tier)

The compile-time gate stays `false`, but there are two free runtime switches: a local opt-in (`?workshop=alpha`, remembered per device) and a database allow-list entry `workshopAlpha/<uid> = true`. Both are visibility switches for playtesting only, not security. See `WORKSHOP-TESTING.md` for the tester script, and `firebase/WORKSHOP-ROLLOUT.md` before the allow-list path is used.

## Reward wiring (free tier, gated)

Endless solo now has a client-transaction reward path behind the same `WORKSHOP_RELEASE_READY=false` gate: each run gets one random 32-hex receipt id (`workshop-run-receipt.mjs`), and the wave-cleared report calls `account.awardXP(..., runId)`. The transaction runs `applySoloWaveReward`, which initializes a missing workshop once (failing closed on a corrupt one) and credits legacy XP/loot, boss materials, preserved legacy unlocks and the receipt in that single write. Campaign reports, and all reports while the gate is off, keep the existing additive save with no new fields. Co-op/versus wave blocks use the same atomic reducer through `createCoopRewardQueue({..., workshop:true})`. Replayed or retried reports are no-ops. Full scrap or component balances clamp at the cap instead of rejecting the wave, so a maxed account still receives its XP. If a workshop write is rejected because the candidate rules are not deployed yet, the wave is saved once with the current legacy credit and that browser session stops sending receipts, so nothing is lost and no receipt can be replayed. This is still client-reported and is not anti-cheat; the candidate rules must be reviewed and deployed before the gate can be flipped.

## Before sharing a playable link

1. Prefer isolated Firebase test data and identities within the available free-tier limits, plus a separate GitHub Pages alpha configuration that cannot accidentally write the live account. A second Firebase project is optional, not a paid service requirement. Preserve the existing public game and saves. A production profile copy requires a private, access-controlled backup and explicit operational review; do not put player data in Git.
2. Wire migration, workshop UI, wave credits and combat to the alpha. Preserve old balances, bunker ranks, unlocked items and existing receipts. Separate old and new receipt namespaces; migrate only a consistent snapshot and do not overwrite subsequent progress on rollback.
3. Connect versioned loadouts to actual endless solo and multiplayer modes, including roster admission and reconnect/host recovery. Prevent stale clients from mutating migrated saves or entering incompatible matches through an enforceable boundary.
4. Use Firebase transactions and rules for storage, define stable receipt identities, and handle disconnects and retries without requiring an extra backend. Current multiplayer is client-hosted, and local solo completion is not independently verifiable. If the alpha accepts client-reported results, state that explicitly and isolate it; it is not cheat-resistant.
5. Deploy and test staging rules, inspect staging writes, and run automated and real-device multiplayer checks. Record concrete limitations and recovery instructions. Separate approval is required for any production Firebase rules publication.

## Campaign deferral

Campaign gameplay remains available in the existing live game. No campaign workshop integration is included in this alpha. The current experimental server-only rules would block campaign progress for migrated accounts, so they cannot be applied to a shared/live profile merely because campaign integration is deferred. Any alpha must isolate its accounts or preserve campaign saves without unsafe bypasses. Do not silently remove campaign or offline/local play.

## Integration progress

The actual solo deployment reset now routes through `solo-deployment.mjs`. With the release gate disabled it retains the old behavior; with an explicitly enabled valid workshop it captures the equipped loadout and replaces the old item effects for endless solo. Campaign deliberately remains on the legacy path. This is not an enablement switch: initialization/error UX, reward persistence, safe account migration and multiplayer are not connected yet. Do not flip the gate until those paths are complete and tested. The old armory still provides bunker upgrades and campaign equipment; removing it before replacements exist would break those functions.

The Firebase party and experimental recovery adapters now accept an optional workshop lock, construct a workshop match, and reject mismatched workshop snapshot/checkpoint loadouts. This path is **not enabled by the lobby or release gate**: lock creation, verified ownership, durable authoritative manifest binding, old-client fencing and reward wiring are still missing. These structural checks do not make a client-controlled host authoritative or block older clients.

An unused experimental browser adapter (`workshop-server-account.mjs`) can talk to the authenticated progression HTTP contract without falling back to client writes. It retains an uncertain request ID in session storage, blocks different commands until the same request is reconciled, and checks the signed-in session before applying a response. The gated workshop view no longer selects this adapter under the free-tier direction; no endpoint is configured and the feature stays disabled. Session storage is tab-scoped and may be cleared, and an unresolved retry can require manual recovery. Cross-tab/device durability, a visible retry/recovery flow, a trusted endpoint and complete account operations are still required.
