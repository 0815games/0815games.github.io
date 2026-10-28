# Social frontend integration

Implemented: active/expiry list filtering, callable action binding, own-code display/copy,
and the Settings tab with independent profile and character/skill visibility controls.

The feature remains OFF by default. This change does not deploy Firebase, change production
rules, initialize App Check or enable Social. Configure the exact functionsRegion only after
backend, complete ruleset and App Check have passed real integration tests.

Settings read only the current account's social/privacy/{uid} using the existing authenticated
Realtime Database client. The UI read adapter is injectable as readPrivacy for testing.
Writes go through store.action('setPrivacy', {profile,characters}) and socialSetPrivacy;
there are no direct client privacy writes in this UI. Values are private|friends only.
Missing values default to private; malformed values/read errors lock editing.

Draft edits never save automatically. The card shows the saved value separately from the draft.
Saving requires an acknowledged backend action plus a matching reread. Failed or mismatching
results never display success; partial backend publication errors still trigger a reread.
An unknown result requires reload before editing. This is not a live cross-device conflict
resolution protocol: another client may change privacy after the displayed read.
Unsaved drafts remain when navigating within the dialog; explicit discard/reload or logout
clears them. Account changes invalidate pending results. Disabled Social makes no settings calls.

Other features preserved: getCode uses socialGetCode and a login-scoped cache; copy falls back
to field selection. Friend actions use socialRespond, requests use socialRequestByCode.
Invites and presence are not implemented. Callable SDK loading does not relax App Check.

Tests: node --test inkfall/tests/social-privacy-ui.test.cjs
Local controller/DOM doubles passed; no real Firebase, clipboard or browser layout validation.
Run the full CI, Functions/RTDB emulators and two-account browser tests before activation.
Next separate increments: presence/activity; secure Coop invitations; graphical skill inspection;
sent/blocked management; ordered character-view updates and account cleanup.
