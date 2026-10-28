# Social step 1: isolated security groundwork

No production deployment and no frontend activation in this commit.
Existing root database.rules.json and firebase.json stay unchanged.
CI loads the complete repository rules plus social.rules.fragment.json in a local demo emulator.
The fragment must NEVER be deployed alone: that would replace the legacy rules.

Private accounts stay at users/{uid}; classes knight/mage, character schemaVersion 2.
Public-to-friends data is an allowlist projection, never the private save object.
Character fields: heroClass, heroName, level, xp, skillPoints, known skills,
checkpointWave, updatedAt, schemaVersion and progressSource=client-save.
checkpointWave is a stored checkpoint, not a verified completion record.
Email, diagnostics, gold, positions, towers, room codes and full saves remain excluded.
Level/XP are client-save values, not anti-cheat proof.

Canonical relationship: social/relationships/{a}/{b}, sorted UID pair.
States none/pending/friends/blocked. Pending requests expire after seven days.
Only recipient accepts/declines; sender cancels. No self requests or implicit cross-request acceptance.
Block revokes pending/friend status; unblock never restores friendship.
Mutual blocks require each actor to clear their own flag.

Backend requirements (not implemented yet): verify auth token, derive actorUid from auth,
check account existence, use server time, call reducer in a transaction on the canonical pair,
apply quotas and abuse protection, and maintain revision-ordered idempotent list indexes.
Indexes friends/requests/sentRequests/blocks contain IDs and minimal metadata only.
Indexes NEVER authorize character access; canonical relationship status does.
Projection publisher must handle save/reset/deletion and privacy changes.
No direct client writes to relationships, indexes or projections; endpoints remain to be built.

Privacy settings profile/characters: private|friends; missing means deny to others.
Only owner may edit settings. Individual friend-readable views require canonical friends status
and explicit consent. Character views must be read per class, not by reading their parent.
Presence/invites are reserved and denied until later implementation.
Downloaded data cannot be recalled after revocation.
Existing rooms remain readable to signed-in users with known room code; invite privacy is separate work.

Commands:
  node --test inkfall/social/social-model.test.cjs
  cd inkfall/social && npm install --ignore-scripts && npm run test:rules
Firebase CLI/test dependencies and Java 21 are required for emulator tests.
CI uses Node 22 and a demo project, has read-only repository permission and no production secrets.
Dependencies are version-ranged; CI uploads the resolved lockfile for review and later pinning.
Model tests were run locally; emulator and full existing regression tests were NOT run here.
Await CI results before production integration or claiming authorization tests passed.
Actual deployed database rules may differ from this repository.
