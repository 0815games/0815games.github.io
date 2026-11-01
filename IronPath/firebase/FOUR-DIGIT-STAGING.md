# Four-digit join flow (staged, not enabled)

This is preparatory work, not a deployable feature yet. The live party UI continues using the previous long invite. Do not publish `party-four-digit.draft.rules.json` until the UI is connected and the full two-client flow has passed emulator tests: the new rules disable direct guest claims, so publishing them early would break the current live join flow.

The staged design maps a four-digit code to a random internal party ID. A signed-in player may send a join request containing the name from their own Firebase profile. Only the host can read the request list or assign the guest slot; rules require an existing request, an empty slot, and the original guest for a started match. Code knowledge alone does not authorize reading match views or writing gameplay input. The host sees a player name, which is not a verified identity: names can be duplicated, so agree on who is joining out of band.

Four digits are easily enumerable. Any authenticated user can guess codes and send join requests. Rules cannot rate-limit this flow or prevent spam, cost, and orphaned code reservations after a crash. Reusing a numeric code can route a stale request to a different host, so the host must review every request. Closed or orphaned reservations require cleanup; do not treat a four-digit code as a secret. No dedicated server is required, but production-grade abuse controls remain unresolved.

The prior rules and the new rules are complete rulesets, not fragments. Publishing replaces all database rules. Back up and compare the live rules first; users must manually publish a reviewed updated file. The player profile rules remain unchanged.
