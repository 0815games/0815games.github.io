# Progression write inventory (draft, not a release audit)

Repository search for `players/` write paths, reviewed 2026-11-05. These are live browser writes unless marked experimental; replacing rules with server-only rules now would break them. A complete rollout must repeat this audit against the deployed client and live rules, including all ancillary paths.

| Path / operation | Existing behavior | Trusted boundary status |
| --- | --- | --- |
| `account.js` character creation | Transaction creates name, gender and zero XP only if absent. | Missing lifecycle operation. |
| `account.js` solo `awardXP` | Adds client-reported XP, credits scrap and unlocks legacy equipment per wave. No solo receipt. | Missing trusted completion, durable run identity and idempotent credit. Offline/local-play policy unresolved. |
| `account.js` `saveCampaign` | `completeStory` records mission progression on a client completion claim. | Missing trusted story validation and operation. |
| `account.js` skill save | Transaction checks expected build and point constraints. | Experimental server operation; durable match lock and client integration missing. |
| `account.js` armory | `saveArmory` buys bunker ranks and equips/unequips owned legacy items. Advanced ranks require level 5. | Experimental server upgrade exists, but legacy equip/unequip and post-migration compatibility need completion. |
| `coop-rewards.mjs` | Per-account receipt masks with XP, scrap and legacy unlocks in a transaction; client/host observations are not proof of completion. | No trusted game completion or durable cross-mode run identity; experimental workshop reducer is not connected. |
| `workshop-account.mjs` | Experimental client transactions for initialization, craft, equip and modify, gated off. | Server operation prototype exists; no production connection or fencing. |

Leaderboard scores, friends, party/lobby and presence use other database paths; they are not a substitute for trusted profile progression and need separate rules/protocol review. Client reads and in-memory changes are not included in this write inventory. Do not infer this inventory proves no dynamic or external writer exists.
