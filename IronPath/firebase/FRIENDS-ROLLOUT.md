# Friends, character deletion and rollout status

The normal game uses consent-based friendship edges, player-name search,
per-connection presence, and invitations to an open multiplayer party. Firebase
Rules, not the browser, are the authorization boundary. Friend codes and user
IDs are not secrets once shared. Accepted friends can also read the limited
stats allowed by the current Rules; this is not an account privacy or abuse
prevention system.

## Before deploying

`WORKSHOP-RULES-TO-PUBLISH.json` is the owner's **checked-in reference**, not a
fresh independent export of the live Rules. The complete Rules block most
recently supplied by the owner in chat was structurally identical to this
reference; the reconstructed two-space JSON has SHA-256
`8041607e1adb3f235afffde8f581ebf6a06afdee99eb642a4d460ad938a04577`. That
comparison does not independently establish which database the text came from,
or whether Rules have changed since. The former `friends.complete` and other
draft files are older, partial baselines: do not publish one of them over a newer
database. Replacing RTDB Rules replaces the *whole* ruleset. Export, back up and
compare the real live Rules immediately before any change; reconcile outside
changes and review all grants. Do not publish anything until the owner approves
the rollout and all relevant emulator and real-device checks pass. The changes
in this branch have not been published to the real game or its database.

`social-cleanup-candidate.mjs` builds a **local candidate** from the exact
SHA-256-pinned reference; it refuses a changed reference. It changes five
expressions: the account owner may remove or update its own friend-code name,
remove its private code and replace/remove its search key; a request recipient
may delete only the sender's pointer to that recipient; and presence writes
require a current soldier (deletes remain allowed). These are the five `.write`
expressions at `friendCodes/$code`, `friendPrivate/$uid/code`,
`friendPrivate/$uid/searchKey`, `friendOutgoing/$uid/$other`, and
`friendPresence/$uid/$connection`. All existing field validation and access to
other players remain in force. Generate for inspection, not publication, with:

```sh
node IronPath/firebase/social-cleanup-candidate.mjs > /tmp/ironpath-social-candidate.json
npm run test:social-cleanup --prefix IronPath/firebase/rules-test
```

The script uses no credential and cannot publish. Review the actual diff against
the exported live Rules and integrate any independent changes before preparing
a publishable file. `scripts/rules-publish-dry-run.mjs` checks the workshop draft,
not this social candidate; it is not a substitute for that review. For the
experimental maintenance guard the social candidate must additionally be passed
through the guarded Rules builder and tested as a combined candidate; the
previously installed `ironpathtest` Rules still use the old pinned reference.
The guard changes far more than the five social expressions and blocks existing
ordinary sessions: do not publish it ahead of a compatible deployment. Never
paste an unreviewed candidate over live Rules.

## Character deletion in this branch

The client stops local social/score work and waits for outstanding writes, asks
the player to close other tabs/devices, and refuses deletion in an active or
busy party. For a locally observed started guest match it waits for the host to
close the immutable roster. Pre-match guest departure and host closure use
atomic multi-location updates for the four-player lobby. This is not a way to discover
parties in other devices or an earlier browser session.

The client gathers the current profile, private code/search key, both indexed
friendship directions, incoming invitations, known outgoing invite recipients,
per-connection presence and solo/co-op scores. It submits **one** RTDB
multi-location delete and does not show recruitment until the server
acknowledges it. A denied write cannot delete only the profile; a lost response
is reported as *unconfirmed* and the player must reload the profile. The old
reference Rules reject the complete operation for accounts with a friend code
or incoming edge; the paired candidate must be reviewed and installed first.
Deletion may wait for connectivity: timing out a Firebase write would not
cancel its offline queue. On a successful deletion the old friend code is
invalidated, and a newly enlisted soldier gets a new code and search listing.
The candidate also supports migration of a retained old code/search key from an
incomplete legacy deletion when the account already has a new soldier name.

This is **not a comprehensive account-wide erasure**. Older orphaned code
reservations or name listings, invitations to former friends, and party or
presence records from other devices can be unindexed and undiscoverable to the
client. Another tab, an old client, concurrent requests or re-enlistment can
race the client-side snapshot and cleanup; atomicity applies only to the paths
actually in the one update. A trusted backend or a server-enforced character
incarnation/cleanup protocol is needed for stronger cross-device guarantees and
audit of legacy data. Do not promise all data has been erased. The feature does
not delete the Firebase Auth account.

## Checks and limitations

The `test:social-cleanup` suite exercises the checked-in reference, the candidate
and the candidate combined with the experimental release guard using Firebase's
official local emulator in CI. It checks failure without partial profile loss,
both friendship directions, known invitations, scores, re-enlistment under a new
name, legacy name migration and unauthorized access. `test:social-browser` uses
the real account UI and Firebase SDK against local Auth/RTDB emulators: it
checks the old Rules' atomic rejection, the active-party block, waiting while
offline at the deletion write, reconnecting, cleanup with the guarded candidate
and re-enlistment. Two isolated Chromium contexts with separate synthetic Auth
users also exercise a friend request and acceptance, invited party join, guest
leave, host closure and a friend's view of character cleanup. The browser suite
needs Playwright and Chromium; CI installs the pinned browser tooling separately.
These local emulator checks are not two physical devices, live-service tests or
proof of cross-device race and interrupted-write safety. Mock-store tests do not
prove Rules behavior; an emulator is not the live database. Before any rollout,
test with separate consenting accounts/devices: friendship request/accept and
remove in both directions, invitations, host close and guest leave, offline or
interrupted writes, deletion, re-enlistment and search. Verify deployed Rules
and cleanup using the owner's backup/audit process. Do not share credentials,
friend codes, invite codes, ID tokens or private profile data in public logs.

There is no server-side rate limiting, blocking, trusted presence, automatic
legacy cleanup or guaranteed abuse prevention. Authenticated users who receive
codes can spam requests and consume database quota. Orphaned reservations can
also arise from interrupted or concurrent setup. Review abuse controls and
operational costs before a broader public release.
