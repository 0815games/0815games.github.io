# Friends rollout

This release adds a consent-based friends list using random 128-bit friend codes, separate from four-digit match codes. Players can send, accept, decline, cancel and remove. A friend relationship does not automatically reveal online status, a party, or a join code. Share a party code separately. No email, XP or private account profile is shared through this feature. Display names and Firebase user IDs are visible to people who know a friend code or participate in a request.

The full replacement `friends.complete.draft.rules.json` is based on `doctrines.complete.draft.rules.json` and adds `friendCodes`, `friendPrivate`, `friendOutgoing` and `friendships`. **Publishing replaces all RTDB rules.** Back up and compare the actual live rules, merge any changes made outside the repo, and publish only the full reviewed file after emulator checks pass. The user previously reported publishing the doctrine rules; this cannot be independently confirmed here. Don't publish an older partial file.

Publish these rules before deploying the client. Test with two real accounts after deployment: create/share code, request, accept, reload both, remove, decline, cancel, then share a separate multiplayer code and join normally. Test a dropped network and an account change too. Don't post friend codes, invite codes or credentials publicly.

Security limitations: codes are random but **not** a security boundary against anyone who receives one; there is no server-side rate limiting, blocking, code rotation, notification service, automatic data cleanup, trusted status or abuse prevention. Rules enforce basic ownership, consent and account name matching, but an authenticated abuser with codes/IDs could spam requests and increase database costs. Random code reservations can be orphaned if setup is interrupted or two devices create simultaneously. User IDs and names in relationships are visible to participants. This is a limited online feature, not a guarantee of safety or privacy. Deploy trusted server-side abuse controls before broader public use.

## Character deletion also deletes friend data (client, 2026-11)

`deleteCharacter` in `account.js` now calls `purge()` on the friend service (`friends.mjs`) after the `players/{uid}` removal succeeds. The purge removes, best-effort under the rules above:

- `friendships/{other}/{uid}` for every outgoing contact — the character leaves **everyone else's friend lists and pending requests** (the edge rule allows either side to remove).
- `friendships/{uid}` and `friendOutgoing/{uid}` — the own list and own sent requests are emptied.
- `friendNames/{searchKey}/{uid}` — the search listing, so the deleted character is no longer findable by name.

What deliberately survives under the current rule shapes:

- `friendOutgoing/{other}/{uid}` — the other side's own record about the deleted character is owner-only. With the edge gone it renders as "Request no longer active" with a CLEAR button; they clear it whenever they see it.
- `friendPrivate/{uid}` and `friendCodes/{code}` — both are create-only. The code keeps resolving to the account, which is what lets a re-enlisted soldier **reuse** the same code instead of colliding with a dead entry.
- Re-enlisting under a **different** name therefore cannot move the create-only `searchKey`: `ensureSearchListing` takes the stale listing down and reports "Friend search keeps one soldier name per account. After deleting a character, share your friend code instead." Name search then stays unavailable for that account; friend codes keep working.

If a future rules publish wants full name-search support across re-enlistment, allow rewriting `friendPrivate/{uid}/searchKey` when `players/{uid}` does not exist (the account is between characters). No rule file is changed by the client work above; the purge degrades silently while the friend rules are unpublished.
