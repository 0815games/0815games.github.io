# Block 5 · 6-Class Skill System & Safe Migration: Staged RTDB Rules Rollout

The Block 5 client introduces the 6th `airDefense` class, exclusive level-2 class selection with 14-node class specialization trees, and a V2 encoded skill string (`v2;none` and `v2;<classId>;<rank 1..3>;<variant 0..2>;<14-bit tree>`).

## Important Rules & Safety Contract

1. **`WORKSHOP-RULES-TO-PUBLISH.json` remains pinned and untouched** (SHA-256 `8041607e1adb3f235afffde8f581ebf6a06afdee99eb642a4d460ad938a04577`). Nothing in this repository pushes rules to Firebase automatically.
2. **`IronPath/firebase/block5-skills-candidate.mjs`** performs an additive transform over an exported live RTDB ruleset (defaulting to the pinned reference only when generating local drafts/tests). It updates only the three `skills/.validate` checks:
   - `/rules/players/$uid/skills/.validate`
   - `/rules/parties/$partyId/profiles/$uid/skills/.validate`
   - `/rules/fourParties/$partyId/profiles/$uid/skills/.validate`
   Each field is updated from legacy V1-only matching to `BLOCK5_SKILLS_VALIDATE`, accepting **both** V2 strings (`v2;none` and all 6 classes including `airDefense`) and legacy V1 strings during rollout/migration.
3. **Rolling migration & older clients:**
   - Existing players keep `xp`, `level`, `armory`, `workshop`, `storyProgress`, and trophies untouched. When `account.js` observes a legacy build, it writes the raw legacy string to local backup storage once and resets `players/$uid/skills` to `v2;none` via idempotent transaction.
   - Until live rules are updated in Firebase Console, legacy clients cannot write `v2;...` strings (writes fail cleanly while `parseBuild()` runs client-side). Publish the live RTDB candidate **before** expecting cross-device persistence of V2 `v2;...` builds.

## Publication Artifact (`BLOCK5-RULES-TO-PUBLISH.json`)

- **`IronPath/firebase/BLOCK5-RULES-TO-PUBLISH.json`** is the ready-to-paste complete ruleset generated from the operator's live RTDB export (`WORKSHOP-RULES-TO-PUBLISH.json` + Block 4 social-cleanup & friend portrait `.read` grants + `MAINTENANCE_GATE`) with `applyBlock5SkillsRules(...)` updating **only** the three `skills/.validate` rules above.
- **Do NOT paste `block5.complete.draft.rules.json` into production** — that draft omits Block 4 (`social-cleanup`, `gender.read`, `avatar.read`) and `MAINTENANCE_GATE` (`_ironpathMaintenance` / `_ironpathMaintenanceAdminAccess`).

## Publication Steps (Operator)

1. Confirm the current live RTDB Rules backup in **Firebase Console -> Realtime Database -> Rules**.
2. Open **`IronPath/firebase/BLOCK5-RULES-TO-PUBLISH.json`**, copy the complete file (`Copy raw file` on GitHub), paste it into the Firebase Console Rules editor, verify the diff only modifies the three `skills/.validate` lines, and click **Publish**.
3. If future live rules drift, re-generate cleanly over a fresh live export:
   ```bash
   node IronPath/firebase/block5-skills-candidate.mjs live-export.json > block5-ready.json
   ```
4. Confirm emulator verification (`npm run test:block5` in `IronPath/firebase/rules-test` in CI, which exercises both `block5.complete.draft.rules.json` and `BLOCK5-RULES-TO-PUBLISH.json`) passes cleanly before publishing.
