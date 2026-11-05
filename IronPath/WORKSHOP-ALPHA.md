# Endless workshop alpha: scope and safety

The intended first playable test is on GitHub Pages for endless solo and multiplayer. Campaign workshop integration follows later. This is a target, **not an available build**: the workshop remains disabled and the experimental modules are not wired into live matches or saving.

## Alpha must let the tester

- Open inventory from the soldier/Command Center, see retained equipment, craft, equip and modify items, and save changes across reloads.
- Play endless solo and the existing multiplayer modes with the selected effects, earning regular wave rewards and completed-boss-wave materials without duplicate credit on retries.
- Return, reconnect, and see accurate saved progress; recover safely from an unavailable service or uncertain transaction result.
- Test narrow mobile layouts and English/German text. Prices and effects are provisional alpha values.

## Before sharing a playable link

1. Choose and prepare an isolated staging Firebase project and identities; use a separate GitHub Pages alpha deployment/configuration that cannot write the live database. Preserve the existing public game and saves. A production profile copy requires a private, access-controlled backup and explicit operational review; do not put player data in Git.
2. Wire migration, workshop UI, wave credits and combat to the alpha. Preserve old balances, bunker ranks, unlocked items and existing receipts. Separate old and new receipt namespaces; migrate only a consistent snapshot and do not overwrite subsequent progress on rollback.
3. Connect versioned loadouts to actual endless solo and multiplayer modes, including roster admission and reconnect/host recovery. Prevent stale clients from mutating migrated saves or entering incompatible matches through an enforceable boundary.
4. Provide a reachable, authenticated backend and durable lock/receipt storage where needed; GitHub Pages hosts static files only. Define a reliable event source and disconnect/retry handling. Current multiplayer is client-hosted, and local solo completion is not independently verifiable. If the alpha accepts client-reported results, state that explicitly and isolate it; it is not cheat-resistant.
5. Deploy and test staging rules, inspect staging writes, and run automated and real-device multiplayer checks. Record concrete limitations and recovery instructions. Separate approval is required for any production Firebase rules publication.

## Campaign deferral

Campaign gameplay remains available in the existing live game. No campaign workshop integration is included in this alpha. The current experimental server-only rules would block campaign progress for migrated accounts, so they cannot be applied to a shared/live profile merely because campaign integration is deferred. Any alpha must isolate its accounts or preserve campaign saves without unsafe bypasses. Do not silently remove campaign or offline/local play.
