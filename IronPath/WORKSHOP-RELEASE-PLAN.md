# Armory overhaul: release plan

> **Direction:** GitHub Pages and free-tier Firebase only, with no paid cloud service. The server-owned recommendation below is retained as historical research and is not the chosen release requirement. See `WORKSHOP-ALPHA.md` for the shipped free-tier approach and its client-trust limitations.

## Goal and current status

Release a responsive soldier inventory and workshop with three equipment slots, boss-wave materials, crafting and modifications, while preserving existing scrap, bunker ranks, owned gear, equipped effects and progress in solo and multiplayer. The GitHub Pages site remains the player-facing application.

**Shipped and live:** the workshop is part of the Armory for every signed-in soldier (`Command Center → ARMORY → WORKSHOP`, no gate beyond the normal in-match edit lock). Endless solo and campaign run on the captured loadout, co-op credits workshop rewards, versus standardizes equipment to neutral. Reward crediting is wired as client transactions: endless solo through per-run receipts (`workshop-run-receipt.mjs`, `workshop-solo-reward.mjs`), co-op wave blocks through `coop-rewards.mjs` with `workshop: true`. The candidate rules were published to production on 2026-11-05, so the workshop fields are accepted live.

**Outstanding — the finalization list, in order:**

1. **Re-publish the rules.** The live ruleset from 2026-11-05 predates the story format stamp (`storyCampaign`, PR #210), so every campaign save since then is rejected by the `$other` catch-all — the reported "won mission never completes" bug. The current `firebase/WORKSHOP-RULES-TO-PUBLISH.json` is byte-identical to the CI-tested candidate (`test:publish` runs against exactly this file on every push), is a verified superset of all fourteen feature rule drafts, and covers every field the client writes today (`storyProgress` 0–50, `storyCampaign` 1–9, workshop, solo receipts, co-op rewards). This is an owner console action with backup and dry run — the exact steps are in `firebase/WORKSHOP-ROLLOUT.md`.
2. **Live end-to-end verification on a test identity** after the re-publish: workshop prepare → craft → equip → reload, one solo wave (XP/scrap/component, no duplicate on retry), one campaign mission that now saves, friends/party/leaderboard regression check, maxed-account clamping. The scripted order is in `WORKSHOP-TESTING.md`.
3. **Real-device and two-account checks** (the parts automation cannot prove) per `WORKSHOP-TESTING.md` and the BETA-TEST-PLAN matrix.
4. **Disclosed, accepted free-tier limits** (unchanged by any publish): completion is client-reported and not cheat-resistant; the account owner can delete individual receipts and replay one wave; there is no old-client fence in multiplayer. Do not claim otherwise in product copy.

The server-boundary sections below are retained as research for that abandoned direction; their checkboxes do not describe open work for the shipped workshop. [Draft PR #156](https://github.com/0815games/0815games.github.io/pull/156) stays a draft for the same reason.

## 1. Choose and implement the progression authority

**Recommended direction:** finish the server-owned account boundary prototyped in `firebase/workshop-server-only.draft.rules.json`. It prevents clients from modifying migrated profiles, including deleting reward receipts. It is not deployable by itself: once migrated, **every** progression write must be handled by a trusted service, or players would lose the ability to save.

- [ ] Inventory all current writes: XP, ordinary and boss-wave loot, scrap, legacy unlocks, bunker upgrades, equipment, skills, campaign/story progress, and any other player-profile mutations. Preserve existing eligibility, limits and unrelated fields.
- [ ] Implement authenticated, authorized server operations for every required mutation, with atomic transactions, retries and idempotency. An unmounted prototype covers workshop, bunker upgrades and skill saves; an experimental HTTP/Admin adapter exists, but it has no production endpoint, durable match lock or remaining progression operations. See `server/PROGRESSION-WRITE-INVENTORY.md` for the draft write inventory. Client-supplied IDs, costs, balances, eligibility and completed-wave claims must not be trusted.
- [ ] Decide how solo wave completion is established by a trusted authority. The current solo game runs locally, so a server cannot verify a claimed clear merely by receiving a message. Document any change to offline/local play before release; do not silently remove it. If trusted validation is not implemented, explicitly disclose that rewards remain client-reported and do not claim cheat resistance.
- [ ] Make downtime, retry, sign-out, stale-tab and uncertain-result behavior safe. Do not fall back to unprotected writes if the service is unavailable. Establish hosting, operational limits, monitoring, backups and recovery for the service; GitHub Pages itself cannot run it.
- [ ] Test the whole account lifecycle and authorization against an emulator and real staging identities. No production migration before all current progression paths work with the chosen authority.

## 2. Save schema, migration and recovery

- [ ] Finalize the versioned workshop format and synchronize newly earned legacy items. Reject malformed or unknown future versions without resetting them. Retain unknown unrelated profile fields and all existing receipt data.
- [ ] Migrate copies of representative old profiles (offline helpers and an emulator compare-and-swap rehearsal now exist; no production accounts have been touched): no armory, each existing equipped item, every bunker rank, maximum balances, partially missing optional fields and profiles with existing co-op receipts. Verify exact balances, item ownership and existing effects, including wave-dependent effects.
- [ ] ~~Define stable run and receipt identities for solo and every multiplayer mode~~ (draft: random 32-hex per solo run in `workshop-run-receipt.mjs`, deterministic block receipts for co-op in `coop-rewards.mjs`; campaign deliberately keeps the legacy additive save). Credit regular XP/loot, boss materials and the corresponding receipt in one durable transaction. A boss killed during an unfinished wave gives no permanent boss reward.
- [ ] Define receipt retention and growth limits without making old rewards replayable. Test concurrent transactions, two tabs, offline/reconnect, duplicate observations and server restart.
- [ ] Produce and rehearse backup, migration, reconciliation and rollback procedures on copies. An initial helper only permits rollback when the entire profile is unchanged; durable protected checkpoints and reconciliation are not implemented. After a player earns or spends new items, restoring an old snapshot can destroy legitimate progress: rollback must reconcile those changes or leave the migrated data intact, not blindly overwrite it.

## 3. Multiplayer protocol and old-client fencing

- [ ] Connect versioned, immutable per-player loadouts to the actual lobby, locked match manifest, all simulations and rendered snapshots. Do not let a participant change their match loadout after start.
- [ ] Enforce compatibility at an authoritative boundary for **all** lobby creation/join/start paths, player admission, published snapshots, host takeover, checkpoint restore and reconnect. Old or unknown clients must fail closed with a clear update/reload message; a client-side check or asking players to refresh is not sufficient.
- [ ] Test solo, two-player and four-player co-op, 1v1 and 2v2. Verify shared bunker rules and personal items, absent-player reward eligibility, reconnects, host loss, stale checkpoints, mismatched manifests and mixed-version clients.
- [ ] Enforce the agreed competitive equipment normalization in the actual competitive simulations for every participant, while keeping visual choices. Test it separately from co-op. Clarify which non-equipment progression remains active; do not imply full competitive fairness without further review.

## 4. Connect the player-facing workshop

- [ ] Connect the soldier/Command Center entry, workshop view, authenticated account operations, reward display and actual match creation. Remove the release gate only after the dependencies above pass.
- [ ] Show owned and equipped items in weapon, gear and gadget slots; allow valid equip/unequip actions, crafting and one modification per item. Make costs, effects, selection, disabled reasons and permanent spending clear; confirm purchases and modifications.
- [ ] Respect the existing between-match/party restrictions; prevent changes during an active or recovering match. Refresh the view on saved account updates, language changes and session changes.
- [ ] Complete English/German strings and test keyboard, screen-reader labels, touch targets, narrow portrait/landscape layouts, scroll behavior, error handling and sign-out. Test real phones as well as automated browser checks.

## 5. Review rules and verify the complete build

- [ ] Export and back up the **current live** Firebase rules; compare them with the complete repository baseline and merge production-only differences. Never publish a partial rules file. Review account, friend, lobby, presence, leaderboard and recovery permissions together.
- [ ] Run the full rules emulator suite against the exact final candidate, including unauthorized writes, old-client attempts, receipt deletion/replay, concurrent spending and migration. Rules and service authorization must be reviewed together. (The four-player, workshop, recovery, friends, leaderboard and story suites all pass in CI against `workshop.complete.draft.rules.json`; a live-database comparison still has to be run by hand with `scripts/rules-publish-dry-run.mjs` — see `firebase/WORKSHOP-ROLLOUT.md`.)
- [ ] Run the entire game regression suite, browser tests, deterministic stress tests and integration tests with the real adapters. Verify no account/progression writes escape the chosen authority.
- [ ] Use staging accounts on at least two devices to test all supported multiplayer modes, host recovery and disconnect/reconnect; test solo and mobile UI. Record failures and fixes. Simulations and emulator tests do not replace these checks.
- [ ] Playtest costs, boss rewards, item effects and mod combinations; adjust and retest. Existing estimates are provisional, not validated balance.

## 6. Controlled rollout and release

1. Keep the workshop disabled while building and testing. Prepare a full rules backup, service deployment/rollback and a client rollback plan; verify monitoring and incident contacts.
2. Obtain **separate explicit approval** before publishing the full reviewed Firebase rules. Deploy and verify the trusted service and its readiness first. The order must be rehearsed in staging; never migrate an account while the service cannot support every existing write.
3. Enable a limited, explicitly identified staging/canary group only after server, rules, protocol fencing and migration tests pass. Verify real saves and every affected game mode; stop rollout on data inconsistency or incompatible-client behavior.
4. Resolve canary feedback and rerun checks. Enable the feature for the public build only when every release gate passes. Merge the reviewed PR and verify the GitHub Pages deployment; ask players to reload, but do not treat that as the version gate.
5. Monitor errors, saves, duplicate/rejected rewards, reconnects and service availability. Keep the documented reconciliation/rollback procedure ready. Do not report release as complete until deployment and verification actually succeed.

## Release gates: all required

- [ ] Chosen progression authority supports every existing write and its trust limitations are documented.
- [ ] Migration and recovery preserve player data; rollback has been rehearsed.
- [ ] Old-client fencing works across lobby, match, snapshots and recovery.
- [ ] Workshop, rewards and loadouts work end to end in all supported modes.
- [ ] Full rules reviewed against live backup; final rules and integration suites pass.
- [ ] Real-device staging and balance feedback addressed.
- [ ] Explicit rules-publication approval obtained; production deployment verified.
