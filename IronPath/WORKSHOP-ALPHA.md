# Endless workshop alpha: scope and safety

The workshop is now **live inside the Armory** on GitHub Pages (`Command Center → ARMORY → WORKSHOP`), for endless solo. Campaign workshop integration and multiplayer loadouts follow later. Progression stays client-reported: there is no anti-cheat, and the workshop writes depend on the candidate rules being published.

## Alpha must let the tester

- Open inventory from the soldier/Command Center, see retained equipment, craft, equip and modify items, and save changes across reloads.
- Play endless solo and the existing multiplayer modes with the selected effects, earning regular wave rewards and completed-boss-wave materials without duplicate credit on retries.
- Return, reconnect, and see accurate saved progress; recover safely from an unavailable service or uncertain transaction result.
- Test narrow mobile layouts and English/German text. Prices and effects are provisional alpha values.

## Free-tier direction (supersedes the server recommendation below)

The user requires **no paid services**. Use GitHub Pages for the static game and the existing Firebase Authentication/Realtime Database client SDK and transactions. Do not require Cloud Functions, a paid backend, a separate hosting provider or a Blaze upgrade. Stay within Firebase's free-tier limits; free-tier availability and quotas are controlled by Firebase and are not guaranteed to cover unlimited use. Do not enable billing.

This changes the trust model: completion and progression are client-reported, and Firebase rules cannot validate our encoded inventory or fully prevent a malicious owner from deleting receipts or cheating. Transactions and receipts can reduce accidental duplication, not prove honest play. Old-client compatibility, account preservation, rules review and safe recovery still need work; these are not solved by accepting the anti-cheat limitation. The server prototypes remain research artifacts, not a deployment dependency.

The workshop UI uses the direct Firebase transaction adapter (`workshop-account.mjs`): one guarded transaction per change, no backend. The unused HTTP client and trusted-service prototypes are retained for reference only.

## Access (free tier)

There is no opt-in and no allow-list any more. The `WORKSHOP_RELEASE_READY` flag,
`workshop-access.mjs`, the `?workshop=alpha` query switch, the remembered local
storage entry and the `workshopAlpha/<uid>` database list are all removed. Any
signed-in soldier can open the workshop tab; the only gate left is the normal
in-game one (`canEditSkills()`), which already blocks armory edits during a party or
a live match. If the rules that accept the workshop fields are not published yet,
the write is rejected, the tab says so, the old save keeps working and the session
falls back to the legacy wave credit. See `WORKSHOP-TESTING.md`.

## Reward wiring (free tier)

Endless solo uses a client-transaction reward path: each run gets one random 32-hex receipt id (`workshop-run-receipt.mjs`), and the wave-cleared report calls `account.awardXP(..., runId)`. The transaction runs `applySoloWaveReward`, which initializes a missing workshop once (failing closed on a corrupt one) and credits legacy XP/loot, boss materials, preserved legacy unlocks and the receipt in that single write. Campaign reports keep the existing additive save with no new fields. Co-op wave blocks use the same atomic reducer through `createCoopRewardQueue({..., workshop:true})`, so party runs pay boss components too. Versus does not credit XP and stays on the legacy path. Replayed or retried reports are no-ops. Full scrap or component balances clamp at the cap instead of rejecting the wave, so a maxed account still receives its XP. If a workshop write is rejected because the candidate rules are not deployed yet, the wave is saved once with the current legacy credit and that browser session stops sending receipts, so nothing is lost and no receipt can be replayed. This is still client-reported and is not anti-cheat. The candidate rules are in `firebase/WORKSHOP-RULES-TO-PUBLISH.json`; until they are published the workshop tab stays inert and waves use the legacy credit.

## Before sharing a playable link

1. Prefer isolated Firebase test data and identities within the available free-tier limits, plus a separate GitHub Pages alpha configuration that cannot accidentally write the live account. A second Firebase project is optional, not a paid service requirement. Preserve the existing public game and saves. A production profile copy requires a private, access-controlled backup and explicit operational review; do not put player data in Git.
2. Wire migration, workshop UI, wave credits and combat to the alpha. Preserve old balances, bunker ranks, unlocked items and existing receipts. Separate old and new receipt namespaces; migrate only a consistent snapshot and do not overwrite subsequent progress on rollback.
3. Connect versioned loadouts to actual endless solo and multiplayer modes, including roster admission and reconnect/host recovery. Prevent stale clients from mutating migrated saves or entering incompatible matches through an enforceable boundary.
4. Use Firebase transactions and rules for storage, define stable receipt identities, and handle disconnects and retries without requiring an extra backend. Current multiplayer is client-hosted, and local solo completion is not independently verifiable. If the alpha accepts client-reported results, state that explicitly and isolate it; it is not cheat-resistant.
5. Deploy and test staging rules, inspect staging writes, and run automated and real-device multiplayer checks. Record concrete limitations and recovery instructions. Separate approval is required for any production Firebase rules publication.

## Campaign deferral

Campaign gameplay remains available in the existing live game. No campaign workshop integration is included in this alpha. The current experimental server-only rules would block campaign progress for migrated accounts, so they cannot be applied to a shared/live profile merely because campaign integration is deferred. Any alpha must isolate its accounts or preserve campaign saves without unsafe bypasses. Do not silently remove campaign or offline/local play.

## Integration progress

Solo deployment routes through `solo-deployment.mjs`. An endless run uses the captured workshop loadout when the profile has a readable workshop; a profile without one (any account that never opened the tab) plays with the legacy equipment instead of throwing, and a profile with an unreadable/newer workshop refuses to deploy rather than silently dropping the player's chosen gear. Campaign stays on the legacy path. The old equipment and bunker tabs remain in the same dialog, so nothing that used to work was removed.

The Firebase party and experimental recovery adapters now accept an optional workshop lock, construct a workshop match, and reject mismatched workshop snapshot/checkpoint loadouts. This path is **not enabled by the lobby or release gate**: lock creation, verified ownership, durable authoritative manifest binding, old-client fencing and reward wiring are still missing. These structural checks do not make a client-controlled host authoritative or block older clients.

An unused experimental browser adapter (`workshop-server-account.mjs`) can talk to the authenticated progression HTTP contract without falling back to client writes. It retains an uncertain request ID in session storage, blocks different commands until the same request is reconciled, and checks the signed-in session before applying a response. The gated workshop view no longer selects this adapter under the free-tier direction; no endpoint is configured and the feature stays disabled. Session storage is tab-scoped and may be cleared, and an unresolved retry can require manual recovery. Cross-tab/device durability, a visible retry/recovery flow, a trusted endpoint and complete account operations are still required.
