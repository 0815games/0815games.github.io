# Presence: foundation and lifecycle binding (disabled by default)

Implemented: per-tab publisher/reader; separate opt-in; lifecycle binding in social-bootstrap.js.
The bootstrap lazily loads the sibling social-presence.js only for a signed-in account when
both INKFALL_SOCIAL_CONFIG.enabled and .presenceEnabled are explicitly true.
Neither flag is enabled by this commit. No production rules, index.html or Firebase deployment changes.

One publisher is created per active account/tab. Duplicate auth events do not duplicate it.
Module loads have a 10-second timeout and can be retried. Logout, account changes, destruction
and pagehide invalidate late loads. pageshow resumes only if authentication is still current.
The existing private opt-in still applies: lifecycle start does NOT make the user publicly online.

All ordinary auth.signOut() calls on this Auth instance are wrapped to await publisher.stop()
before credentials are dropped. The original return/rejection and this binding are preserved;
a failed sign-out restarts the current owner's publisher. The wrapper is restored on destruction
unless another component has since replaced it. If wrapping is impossible and no SDK pre-change
hook exists, Presence stays off rather than publishing without a logout guard.

When public auth.beforeAuthStateChanged exists, it additionally guards direct account switches.
No SDK-private _delegate API is used. The modular API documents this hook, but the existing
compat SDK must still be checked in a real browser; the code feature-detects it.
Compat direct sign-in account switches without the hook, remote-tab changes, token invalidation
and user deletion may only be observed after credentials changed. The fallback stops heartbeats
and attempts cleanup; successful removal cannot then be guaranteed. No goOffline() is called.

Data: social/presence/{uid}/connections/{pushId} = {online:true,updatedAt:serverTimestamp}.
Disconnect removal is registered before marking online. Each tab removes only its own entry.
Heartbeat is 30 seconds. Readers classify stale (90 seconds), invalid, denied or disconnected
states as unknown, not automatically offline. Empty readable data means offline. Browser timer
throttling may produce unknown. Cleanup waits at most 2.5 seconds; a stale entry may remain.

Consent: social/presencePrivacy/{uid} = private|friends; missing means private.
Only confirmed friends with explicit opt-in may read; profile/character consent is independent.
There is still NO opt-in switch or live friend-row display. Those are UI steps 2 and 3.
Activity labels, authoritative Coop availability, write quotas, stale-row and account cleanup remain open.

API additions: window.inkfallSocial.stopPresence(), retryPresence(); destroy() returns cleanup promise.
No code or UI should enable Presence until the complete merged rules and Firebase/browser tests pass.
Never deploy the Social rules fragment alone over legacy rules.

Validation: 24 session/loader mock tests and JS syntax checked locally. Existing publisher unit
and emulator tests remain in CI. The full CI result, actual compat SDK, BFCache, multi-tab,
Firebase permissions and network-disconnect behavior have NOT been verified here.
