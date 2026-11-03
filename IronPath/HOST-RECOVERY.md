# Host reload recovery — implementation in progress

The live Firebase match still cannot resume after a host reload. `restorePartyHost` is a tested simulation building block, not a complete recovery system. It requires a checkpoint from trusted storage; it checks the locked roster, mode and teams, resets all presence and held movement, cancels queued inputs, and retains receipts. The browser host is not a trusted anti-cheat authority.

An experimental Firebase recovery store and complete draft rules now exist. The emulator covers atomic checkpoint/view records, generation takeover, stale-owner writes and member read isolation. They are **not wired into gameplay or published**, and do not yet guarantee safe end-to-end recovery. In particular, a crash during takeover and reading a cached checkpoint need explicit handling; the old live view paths are not fenced by these experimental rules.

A safe online handoff still needs all of the following before it is enabled:

1. A durable checkpoint bound to the immutable party ID and started manifest, with an explicit version and bounded size. Account for versus lanes and four-player state. A recipient snapshot is not a full checkpoint.
2. A Firebase-enforced, atomic host generation/lease with a unique connection identity. Old hosts must be fenced from **every** checkpoint, view and input-acknowledgement write. A same-browser Web Lock is not cross-device fencing.
3. Publish checkpoint, generation and recipient views as one consistent commit. A guest must never be acknowledged for a command that a checkpoint can later roll back. Preserve the command sequence and receipts, and define behaviour when a checkpoint cannot be saved; pause rather than silently claim success.
4. Reconnect UI for the authenticated host after refresh. The host must recover the same party, not accidentally create a second simulation. Guests must recognise only a verified newer generation, stop local input during handoff, reconcile outstanding commands against durable receipts, and reject stale generation writes/views. Current clients intentionally fail on an epoch change.
5. Firebase emulator tests for host refresh across 2/3/4-player modes, stale host after takeover, two concurrent hosts, guest pending command, stale/reordered writes, checkpoint size and malformed checkpoints, and permissions. Then test actual devices and flaky networks. If fencing or checkpoint persistence fails, end/pause with a clear message, not an unsafe restore.

Replacing Firebase Realtime Database rules requires the complete combined ruleset, not a partial fragment. Do not enable a new storage path or ask for production publication until the complete rules and the handoff have passed those tests. Separately, player-hosted simulation and XP remain client-controlled and unsuitable for trusted competitive outcomes.
