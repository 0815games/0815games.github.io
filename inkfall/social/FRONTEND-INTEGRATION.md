# Frontend binding: items 1 and 2

The feature remains OFF by default. No Firebase deployment or database-rule change.

## List decoding
Object indexes require active:true and a non-negative integer revision.
Requests additionally require an integer expiresAt strictly after the estimated server time.
The adapter listens to .info/serverTimeOffset and schedules a local expiry timer, so expired
requests disappear without another database event. Legacy boolean friends are supported;
boolean requests without an expiry are rejected. Tombstones never become visible contacts.
All roster listeners and expiry timers are removed after errors or unsubscribe/logout.
Names are enriched separately; pending request notices do not wait for profile fetches.
Local expiry is a display aid, NOT authorization: the backend still enforces expiry.

## Callable binding
requestByCode -> socialRequestByCode
accept/decline/cancel/remove/block/unblock -> socialRespond with fixed operation
getCode -> socialGetCode; setPrivacy -> socialSetPrivacy (UI for these remains a later task).
invite remains unsupported. No client write to friendships or database indexes.
The existing bootstrap needs no change: it already calls InkfallSocialClient.create().
Existing injected actions are retained for tests or explicit adapters.

For later reviewed activation, set functionsRegion in INKFALL_SOCIAL_CONFIG alongside enabled.
Use the exact deployed region, not a guessed region. This commit does not set enabled:true.
The compat Functions SDK loads lazily from the same gstatic version as the existing app SDK;
there is a 10-second load timeout and a 15-second callable timeout.
Auth is checked before and after loading and after receiving a result. Caller UID is never
forwarded as identity in callable payloads. Invalid extra fields are rejected.
The Functions SDK can attach Auth/App Check tokens only if those are initialized correctly;
this binding neither initializes App Check nor relaxes backend App Check enforcement.

Before activation: deploy and test the backend, initialize App Check, merge/test/deploy the
complete database rules, configure region, and run an actual two-account browser test.
Own-code display/copy and privacy controls are NOT added by this change.

Tests: node --test inkfall/tests/social-client-binding.test.cjs
Mocks and VM browser doubles, no real network/Firebase calls. This does not prove production
Auth/App Check, CORS/CSP, SDK runtime, or cross-account integration works.
