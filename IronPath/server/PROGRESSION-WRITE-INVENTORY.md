# Progression write inventory (draft, not a release audit)

Repository search for `players/` write paths, reviewed 2026-11-05. These are live browser writes unless marked experimental; replacing rules with server-only rules now would break them. A complete rollout must repeat this audit against the deployed client and live rules, including all ancillary paths.

| Path / operation | Existing behavior | Trusted boundary status |
| --- | --- | --- |
| `account.js` character creation | Transaction creates name, gender and zero XP only if absent. | Missing lifecycle operation. |
| `account.js` solo `awardXP` | Legacy additive XP/loot for campaign and, while the release gate is off, for endless solo. With the gated alpha enabled, endless solo instead sends a per-run receipt id and one transaction runs `applySoloWaveReward` (legacy XP/loot + workshop bonus + receipt). | Client-reported completion. Receipts prevent accidental duplicate credit only; no trusted completion or anti-cheat. Campaign keeps the legacy path. |
| `account.js` `saveCampaign` | `completeStory` records mission progression on a client completion claim. | Missing trusted story validation and operation. |
| `account.js` skill save | Transaction checks expected build and point constraints. | Experimental server operation; durable match lock and client integration missing. |
| `account.js` armory | `saveArmory` buys bunker ranks and equips/unequips owned legacy items. Advanced ranks require level 5. | Experimental server upgrade exists, but legacy equip/unequip and post-migration compatibility need completion. |
| `coop-rewards.mjs` | Per-account receipt masks with XP, scrap and legacy unlocks in a transaction; client/host observations are not proof of completion. With `workshop: true` (gated alpha) the same transaction also credits components, preserved legacy unlocks and the coop receipt via `applyWorkshopWaveCredit`. | No trusted game completion; default path does not write workshop fields until the candidate rules are approved and deployed. |
| `workshop-account.mjs` | Direct Firebase transactions for initialization, craft, equip and modify, selected by the disabled UI gate under the free-tier approach. | Requires reviewed client-write rules, mixed-client handling and end-to-end testing. It is not anti-cheat. |
| `workshop-server-account.mjs` | Unused experimental service client. | Not required for the free-tier approach; no deployed service. |

Leaderboard scores, friends, party/lobby and presence use other database paths; they are not a substitute for trusted profile progression and need separate rules/protocol review. Client reads and in-memory changes are not included in this write inventory. Do not infer this inventory proves no dynamic or external writer exists.
