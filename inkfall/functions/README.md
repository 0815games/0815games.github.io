# Social backend core: preparatory commit, no deployment

## Scope
Callable handlers: socialGetCode, socialRequestByCode, socialRespond, socialSetPrivacy.
The authenticated actor comes only from request.auth.uid; unknown body keys are rejected.
Code generation uses 18 random bytes (24 URL-safe characters). Existing codes remain stable.
Only the recipient can accept. Graph transitions use transactions on one sorted UID pair.
Every caller has a shared 30 operations/minute quota; this is not a complete anti-abuse system.
App Check is required by all callable wrappers. No client deployment activation in this commit.

## Indexes and crash recovery
friends/requests/sentRequests/blocks use {active,revision,updatedAt,...} per peer.
Inactive records remain as tombstones so delayed updates cannot overwrite newer revisions.
Canonical relationships, NOT indexes, authorize reads in the existing Social rule fragment.
Callables reconcile after committing; socialRepairIndexes retries reconciliation after graph events.
The graph transaction and indexes are NOT one atomic cross-path write; lists are eventually consistent.
A partial index failure returns an error even if the canonical operation already committed.
Retrying accept/remove/block is safe; do not infer failure means the graph was unchanged.
Expired requests cannot be accepted. Index expiry display/cleanup still needs client filtering or scheduling.

## Public-to-friends projections
Explicit privacy settings required: private|friends separately for profile/characters.
Privacy changes publish only allowlisted fields or delete projections.
No verified achievement claims; character progress remains client-save.
Missing/reset characters can be removed via publishOwner, but automatic save/reset/delete triggers
and comprehensive account-deletion cleanup are NOT implemented in this commit.
Profile publishing is not yet a full ordered live synchronization pipeline.

## Packaging
firebase.social-backend.json is a separate, functions-only deployment config.
Root firebase.json and database.rules.json are unchanged.
Source is inkfall so the existing social/social-model.cjs is included without duplication.
Frontend src, tests and local dependency folders are excluded from the function bundle.
Node 22; install dependencies in inkfall and review/commit a lockfile before release.
No installation of server dependencies is needed to run the pure mocked tests:
  node --test inkfall/tests/social-backend.test.cjs

## Required before any production deployment
- Confirm current model/rules/legacy CI results and run real RTDB + Functions emulator tests.
- Configure exact database URL, instance name and matching region. No region guessed in code.
  Parameters: INKFALL_DATABASE_URL, INKFALL_DATABASE_INSTANCE, INKFALL_DATABASE_REGION.
- Confirm Firebase billing/IAM and inspect deployment costs. A GitHub push does not deploy Firebase.
- Configure App Check and the Functions SDK on the frontend (not loaded yet by this commit).
- Merge the Social rule fragment into the complete ruleset only after emulator validation.
  Never deploy the fragment alone. Internal codeLookup/privateCodes/limits paths remain client-denied.
- Update social-client.js to filter active:false records and expired requests before enabling it.
  Current frontend adapter is NOT ready to consume tombstones unchanged.
- Add frontend own-code display/copy, privacy controls and callable adapter.
- Add quotas for inbox/friend capacities, anti-spam cooldowns, code rotation and account cleanup.
- Online status, Coop invitations and join authorization are separate later increments.

## Validation status
28 backend-service tests with an in-memory transaction adapter passed locally; syntax checked.
These are NOT Firebase authorization, App Check, real SDK integration or deployment tests.
Dependencies, function parameter resolution, trigger registration and production runtime remain untested.
Backend default stays unactivated. This code is not a production-readiness claim.
