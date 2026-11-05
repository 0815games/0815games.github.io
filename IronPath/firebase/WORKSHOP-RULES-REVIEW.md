# Workshop save rules — unapproved draft, do not deploy

`workshop.complete.draft.rules.json` is a **candidate replacement** derived from the repository's `friend-stats.complete.draft.rules.json`. The live Firebase rules are not available or verified here. Before any publication, export and back up the entire live ruleset, compare it against this baseline, merge all production-only features, independently review the complete result, and run all relevant emulator suites against that final file. Publishing replaces the entire ruleset. User approval for publication must be obtained separately.

The candidate permits a bounded workshop string on the player's private record, forbids removing that field once created, and permits a solo completed-wave receipt map with bounded masks and monotonic bits for non-deletion updates. It preserves the baseline's friend-stat visibility, private records, all other paths, and existing co-op receipts. Transactions and client code are still disabled in the public interface.

## Important limitations — release blockers

- Realtime Database rules cannot inspect/validate the encoded JSON inventory or prove item ownership, costs, match completion, or boss kills. A malicious authenticated client can write arbitrary bounded strings and account progression. Client-reported game results are not anti-cheat.
- RTDB `.validate` does not run for deleted child nodes; because the baseline grants an owner write at the entire player path, this draft **does not prevent removing individual solo receipt entries** while keeping the collection. A malicious client can delete one and replay a reward. The existing co-op receipts have similar limits. Fixing this needs a redesigned write/authority boundary; the draft does not claim adversarial replay protection.
- A stale client can preserve the workshop field while changing legacy equipment or claiming ordinary wave rewards without synchronizing workshop ownership/components. More importantly, existing matchmaking has no authoritative mixed-client version gate. The workshop must remain disabled until these paths, all match modes, reconnects and host recovery are fenced and tested.
- Tests use demo data and an emulator, not the real project. They do not establish whether the baseline matches live production or verify real devices. Before rollout also test copied-profile migration and rollback, concurrent spending, offline retries and two-device multiplayer.

The candidate rules are intentionally not sufficient to authorize release. They are a starting point for review, not an invitation to publish.
