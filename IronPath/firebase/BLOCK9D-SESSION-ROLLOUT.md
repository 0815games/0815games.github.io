# Block 9D · Single-Session Enforcement: Staged RTDB Rules Rollout

Block 9D prevents concurrent logins for the same account across separate browser profiles, private/incognito windows, and separate devices.

## How It Works

1. **Client Lease & Live Fence (`IronPath/active-session.mjs`)**:
   - Each browser storage profile generates a 32-hex `clientId` persisted locally (`ironpath:client-session-id`); a private/incognito window, different browser, or separate device generates a distinct `clientId`.
   - Before loading `players/$uid`, `account.js` claims `activeSessions/$uid` (`{ clientId, claimedAt, heartbeatAt }`) via atomic RTDB transaction, arms `onDisconnect().remove()`, renews `heartbeatAt` every 15s, and subscribes via `onValue` so an explicit takeover kicks the older session immediately.
   - Same-browser tabs sharing `localStorage` and Firebase Auth persistence continue cooperating safely via `createSessionTabLock`.
2. **Server-Side Lease Rule (`activeSessions/$uid`)**:
   - `.read`: `MAINTENANCE_GATE && auth.uid === $uid`
   - `.write`: `MAINTENANCE_GATE && auth.uid === $uid && (!newData.exists() || !data.exists() || data.child('clientId').val() === newData.child('clientId').val() || (data.child('heartbeatAt').isNumber() && data.child('heartbeatAt').val() + 45000 < now))`
   - Rejects overwriting another active session while its `heartbeatAt` is less than 45s old, while allowing clean sign-out/`onDisconnect` release and automatic recovery after stale crashes (>45s).
3. **Graceful Pre-Publish Rollout**:
   - Until `BLOCK9D-RULES-TO-PUBLISH.json` is published in Firebase Console, `activeSessions/$uid` returns `PERMISSION_DENIED` on both write and read and `account.js` falls back cleanly (`unsupported`) without breaking existing login or tests.
   - Publishing `BLOCK9D-RULES-TO-PUBLISH.json` immediately enforces cross-window / cross-incognito / cross-device single-session locking live.

## Publication Steps (Operator)

1. Export/backup the current live RTDB Rules in **Firebase Console → Realtime Database → Rules**.
2. Open **`IronPath/firebase/BLOCK9D-RULES-TO-PUBLISH.json`**, copy the complete JSON, paste it into the Rules editor, verify the diff only adds `/rules/activeSessions` (assuming `BLOCK5-RULES-TO-PUBLISH.json` is currently live), and click **Publish**.
3. If your live Rules differ from `BLOCK5-RULES-TO-PUBLISH.json`, generate over your fresh live export first:
   ```bash
   node IronPath/firebase/block9d-session-candidate.mjs live-export.json > block9d-ready.json
   ```
4. Verify CI checks (`test:block9d` and `test:block9d-browser` in `IronPath/firebase/rules-test`) pass cleanly before and after rollout.
