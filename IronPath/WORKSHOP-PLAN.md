# Armory overhaul — staged implementation

## Status

The first deliverable is a read-only soldier dossier using the **current one-slot equipment system**. It does not yet add an inventory, new gear, crafting, boss components, modifications, competitive normalization, or change rewards. No account schema, match protocol, Firebase rules or gameplay values are changed by the dossier. The displayed values are base loadout values; terrain, enemies and temporary effects can change them. English and German are supported. A separate, unconnected `workshop-model.mjs` prototype exercises migration, crafting, slot assignment and modifications in memory; it is not used by the game and cannot award materials or alter account data. A separate experimental `workshop-rewards.mjs` now calculates boss bonuses from newly completed receipt bits, with replay and overflow tests. It is not connected to the live reward queue; it must run in the same transaction as the receipt and regular rewards. This is not the finished overhaul.

## Proposed end state (not yet live)

- Three personal slots: weapon, gear and gadget; neutral starter items; equipment is locked into a match at its start.
- Shared bunker upgrades remain separate. Existing ranks and scrap remain untouched. An existing equipped item must retain the same effect in its new slot; all previously owned items must remain available, including wave-conditional bonuses. Other starter slots are neutral to prevent a migration power spike.
- Completed boss waves award one component and a scrap bonus to each eligible participant. Use the existing completed-wave receipt identity and transaction for co-op; eligibility and disconnect behavior must be explicit. A boss killed in a lost, incomplete wave earns no permanent reward. Solo also needs a per-run/wave idempotency strategy, as its current save path is not a trusted receipt ledger.
- Deterministic recipes and one chosen mod per item. Preview costs and exact effects; confirm expenditure; perform ownership, affordability, currency debit and item/mod assignment atomically. No random rolls in the first version. Values and costs remain provisional until playtested.
- Solo/co-op use each player's captured loadout. Competitive matches are intended to standardize equipment effects for both sides, while preserving cosmetic choices; this requires explicit, tested match-mode handling, not merely hiding UI bonuses.

## Safety gates before multiplayer or production rollout

1. Inventory schema must be versioned, validated and migrated without discarding unknown/newer fields or losing scrap, bunker ranks, equipment or pending reward receipts. Malformed data must fail closed, not silently reset to a default account.
2. Old clients currently send and expect a compact one-item loadout. They can overwrite newer data or disagree on combat. A reliable version gate across lobby, participants, match snapshots, recovery and reconnect is required before using new effects; simply changing the serializer or asking people to reload is not sufficient.
3. The current progression and game host are client-reported. Transactions and rules can reduce accidental duplicates and invalid states, but cannot prove that a player earned a boss reward. A trusted authority is required for strong anti-cheat claims. Competitive normalization must be enforced consistently, and this limitation disclosed.
4. Changes to production Firebase rules require a full ruleset review, backup, emulator tests and separate explicit approval to publish; a partial rules file must never replace the live ruleset. Dry-run migration and rollback on copied profiles first.
5. Test concurrent spending, stale tabs, offline retries, reward replays, disconnects and host recovery, all supported match modes, persistence, localization, mobile interaction and actual two-device sessions. Keep the redesign draft until these gates pass. Do not claim validated balance based only on simulations.
