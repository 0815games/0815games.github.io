# Multiplayer status and hardening

One Multiplayer button uses a four-digit invitation code and host-approved roster. Two players can choose co-op or 1v1; three play large-map co-op; four choose co-op or 2v2. Versus is a synchronized survival race, not direct combat or enemy sending. Two-vs-two has independent shared bunkers and pads, individual supplies, and a draw if both bunkers fall in the same simulation step.

The live interface uses `fourParties` and `fourCodes`. The older `parties` rules remain for older clients; old and new clients cannot share newly created lobbies. Everyone should reload after an update. The latest full replacement rules in the repository are `firebase/doctrines.complete.draft.rules.json`; the user reported publishing them. Firebase rules publication replaces the entire ruleset. Compare with actual live rules before any future deployment; do not publish older drafts or partial fragments.

## Hardening and limitations

- A fatal transport or invalid-packet error now closes the local session and removes its presence; competitive peers pause rather than seeing a failed client indefinitely online. This behavior has mock integration coverage, not yet a live-device test.
- Input packets have size limits and authenticated per-player paths. The client rejects malformed commands before consuming a sequence, snapshots contain receipts, and uncertain commands are not blindly retried.
- Presence expires without heartbeats, guest reconnect is supported, and competitive matches pause for absent players. The host runs the simulation: **host reload/loss does not restore the match**. An experimental opt-in host recovery flow exists at `?recovery=1`, but it is not verified on real devices and is not general host migration; see `RECOVERY-ONLINE-TEST.md`. Where Web Locks are available, a best-effort guard blocks the same account opening the same match in two tabs in one browser profile. It does not protect across devices or browser profiles and falls back to normal play if unavailable.
- Four-digit invites are enumerable and there is no server-side rate limiting. Host approval reduces accidental joins but is not a secure private invitation mechanism.
- The host and account progression are client-controlled. Neither results nor XP/loot are cheat-proof; do not use them for trusted rankings or rewards without server authority.
- Automated game tests and Firebase emulator tests cover the roster sizes and modes, but they do not establish real-device reliability or prove security.

## Release test checklist

On separate devices/accounts and networks, reload the deployed build, then create/join and complete waves in 2-player co-op, 1v1, 3-player co-op, 4-player co-op, and 2v2. Check team choice, simultaneous defeats, wave approvals, leave/forfeit, a guest network drop and reconnect, sign-out, and host close. Repeat on mobile with reduced motion and sound preferences. Record browser/device, party size, mode, and reproduction steps for failures. Test host reload explicitly as a known unsupported recovery case. Complete this gate before calling multiplayer beta-ready.
