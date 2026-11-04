# Friend search rollout

> Historical rollout note: search visibility was removed later; see `AUTOMATIC-FRIEND-SEARCH.md` for current behavior.

This change replaces visible friend codes with exact, case-insensitive soldier-name search. Search is **opt-in**: each player must enable visibility in Friends before another signed-in player can find them. Matching accounts have distinct player IDs; a request still requires acceptance. Existing friendships and requests remain unchanged. Match invitations still use the separate four-digit party code.

The complete `friend-search.complete.draft.rules.json` is based on `friends.complete.draft.rules.json`, which the user reported publishing; actual live rules have not been independently inspected. Firebase rules publication replaces the whole ruleset: back up and compare the live rules, merge any independent changes, review the full new file and emulator results, then publish the full replacement **before** deploying the client. Don't publish a fragment or an older complete ruleset.

Name search is not a private directory: any signed-in player can query an exact name and see matching opted-in names, UIDs and the underlying random friend tokens. Requests can be sent by anyone who obtains a token; hiding a listing stops discovery but doesn't revoke tokens already seen or remove existing friends. There is no block list, code rotation, server-side rate limiting or abuse prevention. Each query is limited to 30 entries and supports paging; RTDB rules cannot verify that a client normalized its name honestly. Profile names remain protected against impersonation in entries, but a malicious user can misfile their own entry. Avoid treating search as trustworthy identity verification or suitable for a broad public release without server-side abuse controls.

After rollout use two real accounts: opt in, search with mixed case, distinguish duplicate names, send/accept, reload, turn visibility off, verify search no longer finds the account while existing friends remain, and test mobile. Don't post accounts' tokens or private details publicly. Emulator tests do not prove live behavior.
