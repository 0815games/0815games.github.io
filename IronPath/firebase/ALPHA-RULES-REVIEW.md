# Private alpha Firebase rules review

The current reference rules in `database.rules.json` match the rules shown in the Firebase Console screenshot: root read/write are denied, and only the authenticated owner can access their `players/$uid` profile. The screenshot cannot establish the project/instance identity or rule changes made afterwards; check those again immediately before publishing.

`party-alpha.draft.rules.json` is the **complete combined ruleset**, not a fragment. Its root defaults and `players` subtree are identical to the repository reference. It adds the `parties` subtree, so publishing replaces all the rules, not only that subtree. Back up the current rules first. Do not publish if the console differs from the screenshot or is on the wrong database.

## Scope and residual risks

- Emulator tests cover authentication, cross-player profile and input isolation, host-only snapshots, participant views, size limits, guest slot contention, started-roster lock and same-guest rejoin. They cannot establish live Firebase security or cover all abuse.
- A party code is a secret invite. Any signed-in person who knows it can read the host and guest slot and, before match start, claim an empty guest slot. Anyone with a code should be treated as an invitee. Never put it in URLs or logs.
- Signed-in users can create unbounded parties and their own presence records, and can repeatedly write allowed data. Rules cannot rate-limit or automatically expire orphaned records. Abandoned records and malicious activity can increase usage and cost. Restrict account registration/invites for the test, monitor Firebase usage and billing alerts, and remove abandoned records deliberately; a budget alert is not a spending cap.
- Presence is best-effort. A stale record can last until expiry and host loss prevents the host browser from advancing. A connection-ID acknowledgement is required before each client can submit after connecting, but mobile sleep, multiple tabs and intermittent networks need live-device tests.
- The host controls the simulation. Co-op outcomes are not trustworthy for rewards, and existing solo XP is already client-writable. Do not use these rules as anti-cheat.
- The user reports publishing the combined rules. The party feature flag is enabled for a limited live alpha test; it is visible to signed-in users and is not access control. Live two-account and device tests are needed before wider release.

## If deliberately enabling a limited private test

1. Confirm project `iron-path-dc727` and its intended Realtime Database instance, and confirm no other application uses the database. Save a backup of the live rules.
2. Compare the current rules against `database.rules.json` again. Stop if they differ; merge any independent changes before replacing the rules.
3. Copy the complete `party-alpha.draft.rules.json` contents into Firebase Console → Realtime Database → Rules and publish only after accepting the risks above. Do not paste a partial JSON subtree. Publishing rules alone does not enable the co-op UI; the separate feature flag controls it.
4. Verify solo sign-in, existing profiles and XP still work. Inspect usage, and then separately arrange a restricted two-account co-op test. If anything breaks, restore the backed-up rules.
