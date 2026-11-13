# Iron Path release guard — experiment, not production

This is **not enabled in the published game or production Firebase**. The
working-branch account code now has an optional guarded-session boundary and a
one-way stop hook, but the ordinary game entry does not install or require the
guard. Do not publish the generated rules, start a real maintenance window, or
promise that sign-in is blocked using these prototypes alone. GitHub Pages
currently serves `main:/` directly; an ordinary merge is not gated by this experiment.

The owner reports that the Firebase project is dedicated to Iron Path and that
they can administer it. The owner requires a **free solution only**: do not
activate billing or a paid plan. The owner can set up Vercel Hobby for this
non-commercial personal project, and chose to block sign-in **in the game** and
access to its data, not to prohibit every possible Firebase Auth token. Vercel
Hobby hosts an **unconfigured test deployment**, not an established game
service; identity, free limits and the complete rollout still need verification.

## Current isolated candidates

- The owner connected GitHub to Vercel. The separate `ironpath-release` project
  exists in the `0815games` Hobby team, linked to this repository with project
  root `IronPath/release-tools` and output directory `public`. The first Git
  push was surprisingly promoted to this *separate project's* production alias
  even though its configured production branch is `main`. No game or Firebase
  configuration was changed. `vercel.json` requests **no automatic Git
  deployments**. Commit `e2f44ea` containing that setting produced no automatic
  `ironpath-release` deployment before a later explicit deployment, but this is
  not an independently enforced protection and does not control GitHub Pages.
  Verify behavior after subsequent pushes and use explicitly reviewed deployments.
- `api/session.mjs`, `package.json`, `vercel.json`, and `public/` form an
  **unconfigured** service candidate. Explicit deployment `dpl_7PxUCqssH4Ma814NE1F5BG5Qvkbu`
  from commit `e2f44ea` is READY, uses Node 22.x, and serves the public alias
  `https://ironpath-release.vercel.app/`; the deployment-specific and team
  aliases require Vercel sign-in. No Firebase variables or credentials have
  been added. The initial function crashed at startup (500). Vercel disables
  `require(ESM)` by default and this dependency chain fails with that setting
  locally; adding the documented non-secret project setting
  `NODE_OPTIONS=--experimental-require-module` for Production and Preview and
  redeploying `9527b55` yielded the generic unavailable JSON response on the
  public alias; the opt-in [CI probe](https://github.com/0815games/0815games.github.io/actions/runs/43408350246)
  confirmed 503/no-store JSON for unconfigured GET, OPTIONS and synthetic POST.
  The exact original runtime error was not retrieved, so this is a plausible
  compatibility diagnosis, not a captured production stack trace.
  Run `runtime-compatibility.test.mjs` after dependency changes and recheck the
  Vercel setting: ordinary Node 22 locally can otherwise hide this failure.
  The real configured HTTP exchange, request streaming, CORS, deployment
  protection, abuse controls and Firebase integration remain unverified. Hobby
  rate limits are per region, not a global distributed security guarantee; its
  quotas can interrupt service.
- The candidate currently expects `IRONPATH_FIREBASE_PROJECT_ID`,
  `IRONPATH_FIREBASE_DATABASE_URL`, `IRONPATH_GAME_ORIGIN` and
  `IRONPATH_FIREBASE_SERVICE_ACCOUNT`. The last is a highly sensitive,
  long-lived service-account key: it can sign Firebase custom tokens, so a
  leak can compromise player access even if its IAM database privileges are
  restricted. No key has been created or shared. If this approach is approved,
  use a dedicated account with the minimum Auth lookup permissions; put its
  key directly into a sensitive **production-only** Vercel variable, never in
  chat, Git, preview environments, build output or logs. Verify key rotation,
  revocation and incident response before production. Google's guide for
  external Workload Identity Federation lists enabled billing as a prerequisite;
  do not enable billing or assume that alternative works under the user's
  restriction. A no-billing, keyless alternative would be preferable if proven.
- `game-session.mjs` is a **separate, unmounted** client adapter. It uses a
  transient password Auth instance, a single game sign-in, claim validation and
  Firebase's blocking Auth hook to prevent an old RTDB instance from receiving
  another user's or another epoch's credentials. Its caller must actually create
  separate **in-memory** Auth instances, freeze/stop the game on termination and
  replace the whole document. Real-SDK integration and a two-tab Chromium test
  passed locally against the unofficial Fireemu and in the official emulator
  CI on commit `8acd7f9` ([run 43405350430](https://github.com/0815games/0815games.github.io/actions/runs/43405350430)),
  including an old `LOCAL` tab. The exchange in that browser test is synthetic,
  not the Vercel service. The ordinary game entry still does not install this
  adapter; no launcher or production gate is in place.
- `guarded-runtime.mjs` composes the isolated Firebase factory, monitor, lifecycle
  and session adapter. It generates fresh app names, uses in-memory Auth, refuses
  to remount known Auth/RTDB objects and derives the status URL from the same
  Firebase database configuration. Startup remains gated until an open status is
  read; a status failure, maintenance, version change or logout synchronously
  begins one-way teardown. The embedding UI must block synchronously, honor the
  abort signal and actually perform a full-document navigation. Those properties
  are not magically imposed on the current game.
- `release-runtime-browser.cjs` exercises that composition in Chromium with the
  real Web SDK, local HTTP handler, Admin Auth and candidate rules against the
  unofficial Fireemu (`productionExact: false`). The test checks a real password
  exchange, maintenance, rejection of an old offline write after reopening, and
  a status outage. It uses same-origin loopback proxies, records the navigation
  rather than leaving the page, and is not the real game, Vercel, browser CORS,
  production Firebase or a real-device test. The previous implementation passed
  the official emulators in [CI 43410406970](https://github.com/0815games/0815games.github.io/actions/runs/43410406970)
  on commit `8303961`; that run predates the current changes.
- `account-services.mjs` selects the normal SDK or an explicitly preinstalled,
  single-use guarded session. `guarded-game-bootstrap.mjs` installs that session
  before importing the account and will not reveal a late import after abort.
  On guarded teardown, the fence blocks the page, takes RTDB offline, then aborts
  the account: the game frame loop and multiplayer transport stop, dialogs close,
  listeners are detached where supported, and a full navigation follows. The
  game is not a generally reusable/destroyable SPA; navigation is mandatory.
  Cleanup is best effort and can leave stale presence/lobby data behind. None of
  this changes the ordinary published entry or makes a client-side check a
  server-side security boundary.
- `stage-version.mjs` includes an explicit allowlist of browser guard modules
  inside each version directory, not server code or deployment secrets. Its
  generated HTML still starts the *unguarded* game. The additional
  `release-game-browser.cjs` test modifies that HTML **only in memory** to
  install a guarded test bootstrap, serves the packaged modules, and drives the
  real account UI using local emulator identities and HTTP proxies. With the
  unofficial Fireemu (`productionExact: false`) it passed incorrect-password
  retry, login, a hanging logout, actual game-loop stop, open-dialog teardown,
  full local document navigations, maintenance, a queued old write, stale build,
  reopen and status outage. This is not the deployed launcher, a Vercel/CORS
  test, production Firebase or a real-device test. All three browser cases passed
  the **official Firebase emulators** in [CI 43418709714](https://github.com/0815games/0815games.github.io/actions/runs/43418709714)
  for commit `b643a45`.

## What has to be true before enabling it

1. Verify the real Firebase project, database instance, deployed rules, Auth
   providers, plan, administrator permissions, backups, and whether any other
   application shares those resources. `WORKSHOP-RULES-TO-PUBLISH.json` is a
   repository reference, **not** a verified live export. Disabling a provider
   or wrapping every rule can interrupt other applications and data paths.
2. Decide and provision a trusted, TLS-hosted session service. It needs a
   narrowly scoped identity, an authoritative *fresh* control-record read,
   Admin ID-token verification with revocation checking, custom-token signing,
   protected operations, monitoring and abuse/rate limits. No fully configured
   trusted service is deployed here. Never place service-account keys, tokens
   or player data in this repo.
3. Complete the actual game and launcher integration before changing production
   rules. The normal entry still signs in directly and starts a profile listener;
   only the isolated test installs the guarded account session before import.
   The real path must use separate temporary and game Auth instances, exchange
   and validate the claims, then start listeners; a status failure must block,
   disconnect and replace the document. The stable entry must select and verify
   a complete immutable build. `stage-version.mjs` only makes a local, currently
   unguarded candidate; it is not a Pages pipeline, launcher, cryptographic code
   attestation or deployment.
4. **Never upgrade an old Realtime Database SDK instance to a new epoch.** The
   tests demonstrate that an offline write queued under the old identity can
   be sent with new credentials. Origin-wide `LOCAL` Auth can transfer the new
   credentials to another tab and trigger the same problem. Use and verify
   tab-scoped Auth before a new game session, stop the old SDK, and fully
   replace the document; an SPA state reset or `signOut()` alone is not enough.
   Account changes, user logout, interrupted sign-in, cross-tab activity and
   offline/reconnect paths all need the same treatment. The stand-alone
   `runtime-fence.mjs` does not enforce this in the current game.
5. The rules and token exchange restrict **database access**, not the Firebase
   Auth service. A direct password registration/login or an already minted
   custom token can still issue a Firebase session during maintenance. Decide
   whether the requirement is an application login block or a project-wide
   Auth issuance block. If the latter, separately verify and configure every
   enabled provider and custom-token path, their plan and impact, and their
   reopen/rollback behavior. Do not disable a shared provider blindly.
6. Run the official emulators plus browser tests, then rehearse the complete
   cutover and rollback on a separate Firebase project with real test accounts,
   two tabs, two devices, offline writes, `onDisconnect`, cache/CDN behavior,
   failed network calls and a broken/late backend. Successful local or CI tests
   are not proof of production configuration or real-device behavior.

## Intended release sequence — not yet automated

- Announce the maintenance window and keep an operator-controlled rollback
  available. Back up and compare the **actual** live rules/configuration.
- Close the authoritative control atomically and rotate to a unique, never
  reused epoch. Verify live reads/writes and old sessions are blocked. Prevent
  application sign-ins and handle the separate Auth-issuance decision above.
- Put guarded clients in a blocked view, stop their database connection and
  replace their document. Offline clients cannot be immediately signed out;
  old credentials must be rejected when they next contact the service.
- Deploy a full new version without overwriting its build path. Verify the
  actual public artifact, all assets, the launcher and status endpoint before
  allowing traffic. Pages/CDN caching, a preexisting service worker and stale
  open documents need explicit tests; `no-store` is not code attestation.
- Reopen by atomically publishing `mode: open` with a fresh, **server-derived**
  `authAfter` cutoff covering the whole maintenance interval. Account for
  trusted clock synchronization with Firebase Auth. Since `auth_time` has
  one-second precision and the candidate uses `auth_time > authAfter`, an
  authentication in the same second as the cutoff is rejected; retry later.
  Login during maintenance must not become valid merely because it was recent.
- Smoke-test new and old accounts and versions, then monitor. Previously
  registered `onDisconnect` operations may be rejected by the closed rules;
  identify and carefully clean only stale ephemeral presence/lobby records.
- On failure stay closed. A rollback must use a **new epoch and a new cutoff**;
  never reopen an old epoch, restore a ruleset that silently removes the fence,
  or activate an unguarded build. Restore a known-compatible build and repeat
  verification before reopening.

## Isolated test entry points

With Node 22, Java 21 and the official Firebase emulator available:

```sh
npm ci --prefix IronPath/firebase/rules-test --no-audit --no-fund
npm run test:release-guard --prefix IronPath/firebase/rules-test
node --test IronPath/tests/release-*.test.mjs
npm ci --prefix IronPath/release-tools --no-audit --no-fund
node --test IronPath/release-tools/session-config.test.mjs IronPath/release-tools/runtime-compatibility.test.mjs
```

To verify **only an intentionally unconfigured isolated deployment**, run
`node IronPath/release-tools/smoke-unconfigured.mjs https://ironpath-release.vercel.app/api/session`
from a network that can reach Vercel. It sends only synthetic invalid inputs and
expects 503/no-store JSON for GET, OPTIONS and POST. It does not test successful
login, streaming, credentials or production Firebase. The GitHub workflow can
also run this probe when a push commit explicitly includes
`[ironpath-unconfigured-smoke]`; it does not run on ordinary pushes or PRs.
The public alias is reachable without Vercel login; protected preview and
unique deployment URLs cannot be substituted without an authorized test path.

The cross-tab, combined browser-runtime and staged-game tests additionally
require Playwright/Chromium. CI installs them and runs
`npm run test:release-tabs --prefix IronPath/firebase/rules-test` with `NODE_PATH`
pointing at the pinned Playwright installation. The tests use only
`demo-ironpath`, loopback emulators and synthetic users; they do not inspect or
modify the live Firebase project.
