# Presence foundation (not activated)

This commit adds a standalone UMD presence module, a rule-fragment extension and tests.
It does NOT load the module on the website, alter the friend rows or add an opt-in switch yet.
Root production rules and Firebase deployment are unchanged. Existing Social remains disabled.

Data: social/presence/{uid}/connections/{pushId} = {online:true, updatedAt:serverTimestamp}.
Each tab gets its own push ID. onDisconnect().remove() must be acknowledged before publishing.
Heartbeat: 30 seconds. Fresh records count as online; empty server data means offline.
Records older than 90 seconds, invalid data, permission errors and viewer disconnect mean unknown,
NOT offline. Browser throttling can legitimately make the status unknown.
No room code, device information, character state or last-seen history is published.

Consent: social/presencePrivacy/{uid} = private|friends. Missing means private.
This is independent of existing profile/character consent; it is NOT automatically enabled.
Only owner may change it or write own connection nodes. Friends read only with canonical
friendship and explicit friends opt-in. Block/removal/opt-out revoke read access in the rules.
The module offers setVisibility(), but the actual consent UI is a later integration step.

API: InkfallSocialPresence.createPublisher({db,auth,uid,enabled,serverTimestamp,onError}).
Call start(), await stop(), and use one publisher instance per tab/account.
Stop before signing out or switching accounts while credentials still allow cleanup.
The auth listener is only a fallback. If credentials are already gone or the network is down,
cleanup may fail; stop waits at most 2.5 seconds and keeps server disconnect cleanup armed
unless deletion succeeded. A stale entry can remain, but readers must not call it online forever.
Never call goOffline() on the shared Firebase database just to stop presence.

Reader: watch({db,auth,targetUid,onData}) returns an unsubscribe function.
It estimates server time and clears subscriptions on logout/read denial. The next UI increment
must connect this reader to the store and distinguish online/offline/unknown visibly.
Activity labels and authoritative Coop availability are not part of this foundation.

Local validation: 24 mocked publisher/reader/aggregation tests plus JS syntax check passed.
Firebase emulator authorization cases were added, NOT executed locally; CI must verify them.
Real multi-tab, logout, reconnect, throttling and permission revocation browser tests are pending.
Connection-count/write quotas, stale-record cleanup and full account-deletion cleanup remain
production-hardening tasks. Do not deploy the Social rule fragment alone over legacy rules.
