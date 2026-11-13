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

- The owner supplied a complete rules JSON block described as the current rules.
  A temporary transcription was byte-for-byte and structurally identical to
  `firebase/WORKSHOP-RULES-TO-PUBLISH.json` (59,215 bytes, SHA-256
  `8041607e1adb3f235afffde8f581ebf6a06afdee99eb642a4d460ad938a04577`),
  with no duplicate JSON keys. This is evidence of the owner's supplied text,
  **not** an independent Firebase read or proof of the database instance or
  current deployment. Obtain a fresh backup and compare again before changes.
- The owner supplied public Web settings for the separate `ironpathtest`
  project. A public Identity Toolkit lookup matched its project number, but did
  not establish database ownership, Auth-provider settings, rules or billing
  plan. Anonymous REST reads of both the database root and `_ironpathRelease`
  returned `Permission denied`: this does **not** prove child paths or writes
  are locked. A guarded build and launcher were staged only under `/tmp` using
  those Web settings and a deliberately synthetic session endpoint. All 595
  staged files were scanned for the normal game's project ID and API key; none
  contained either. A local full-inventory check covered 580 build files. A
  separate network-blocked Chromium dry run with SDK doubles and a simulated
  denied status kept the launcher and direct game blocked before the account
  module or login. The fuller SDK/emulator browser test also passed with a
  simulated 403. This test made no live login, session exchange, database write
  or rule change, and did not deploy the staged build; it does not prove
  Firebase enforcement.
- `IRONPATH_RELEASE_GUARD=1` runs the real large-map lobby and party modules
  with two synthetic users under the generated candidate rules: coop and versus
  including guest reconnect, stale/unexchanged credentials and closure of a
  multiplayer listener and writes were tested locally with Fireemu
  (`productionExact: false`; 4/4). The `test:release-guard` step also passed
  with the official emulator in [CI 43430568466](https://github.com/0815games/0815games.github.io/actions/runs/43430568466)
  for `f8bde98`. It is not a live or two-device test.
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
  been added. The deployed instance reports Node 22.x, and the service package
  requests `22.x`; a later project-settings read reported `26.x`. Reconcile the
  effective Node version and rerun the unconfigured smoke before any new
  deployment or credential setup. The initial function crashed at startup (500).
  Vercel disables `require(ESM)` by default and this dependency chain fails with
  that setting locally; adding the documented non-secret project setting
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
  adapter; no launcher or production gate is deployed.
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
- `stage-version.mjs` defaults to the **unguarded** packaging smoke, but an
  explicit `--guarded-public-config` now produces a separate candidate with a
  hidden/inert first paint, a required guard marker and the actual guarded
  bootstrap instead of the direct account script. It replaces the uniquely
  marked default account Firebase config with that staged public config; a
  missing/ambiguous marker fails staging, and the launcher's critical-file
  check compares the replacement to its own config. This reduces accidental
  cross-project fallback but does not prove project ownership, network
  isolation, source integrity or future code free of other Firebase targets.
  `stage-launcher.mjs` makes a separate stable entry and uniquely versioned
  launcher assets. Neither writes
  into the source tree, deploys anything, changes Firebase or protects the
  existing public entry. Keep old version and launcher paths intact; the tools
  do not build a retained, atomic Pages snapshot or a rollback automatically.
  Each full build duplicates tens of MiB of assets: assess the hosting limits
  and a safe retention policy before rollout rather than promising unlimited
  versions within a free quota.
- The candidate launcher polls the same configured Firebase control record,
  fails closed on missing/bad status, checks the manifest and 13 critical files,
  confirms the release again, and performs a fixed same-origin full navigation.
  A missing/changed build requires a manual retry instead of a redirect loop.
  Its hashes detect inconsistent files but are not signed, do not cover every
  asset and do not prove what subsequent requests execute. Browser caches,
  service workers, malicious hosting and a later file replacement are outside
  this check. `verify-public-release.mjs` can separately compare **every**
  inventoried public build file and the remote manifest with a trusted local
  staging inventory, once per release. A loopback HTTP check compared all 580
  staged files (about 68 MiB) in a local build. It does not check the launcher,
  prove later immutability, configure the service or reopen anything.
- `release-game-browser.cjs` uses in-memory test HTML and passed the **official
  Firebase emulators** in [CI 43418709714](https://github.com/0815games/0815games.github.io/actions/runs/43418709714)
  on `b643a45`. The newer `release-site-browser.cjs` uses the actual generated
  launcher and guarded HTML, without HTML injection, and passed locally with
  Fireemu (`productionExact: false`): blocked first paint, bad artifact, login,
  hanging logout, maintenance with an open dialog and queued write, reopen,
  status outage, stale build and a simulated bfcache restore. Its SDK wrappers
  and HTTP routes point to loopback emulators; this is not a real Vercel/CORS,
  Pages/CDN, production Firebase or two-device test. All four browser cases
  also passed the **official Firebase emulators** in [CI 43422704446](https://github.com/0815games/0815games.github.io/actions/runs/43422704446)
  for commit `80722ac`.

## What has to be true before enabling it

1. Verify the real Firebase project, database instance, deployed rules, Auth
   providers, plan, administrator permissions, backups, and whether any other
   application shares those resources. The owner's posted JSON matched the
   `WORKSHOP-RULES-TO-PUBLISH.json` repository reference, but it was **not**
   retrieved independently from Firebase. Compare a fresh backup immediately
   before any change. Disabling a provider or wrapping every rule can interrupt
   other applications and data paths.
2. Decide and provision a trusted, TLS-hosted session service. It needs a
   narrowly scoped identity, an authoritative *fresh* control-record read,
   Admin ID-token verification with revocation checking, custom-token signing,
   protected operations, monitoring and abuse/rate limits. No fully configured
   trusted service is deployed here. Never place service-account keys, tokens
   or player data in this repo.
3. Complete and rehearse the actual deployment integration before changing
   production rules. The normal published entry still signs in directly and
   starts a profile listener. The opt-in staged launcher/game implement a
   candidate guarded path, but they are not wired into GitHub Pages. The
   deployed path must use separate temporary and game Auth instances, exchange
   and validate claims before listeners, and fully replace the document after
   teardown. The new packagers are not a retained atomic Pages pipeline, a
   guaranteed cache strategy, code attestation, a verified production artifact
   or a deployment. Review and verify the launcher as well as every build file.
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

## Before any live test-project changes

Verify in the Firebase Console that the Realtime Database URL and Web app really
belong to `ironpathtest`, that its plan is Spark, and whether Authentication →
Sign-in method has Email/Password enabled. Inspect and back up the test database
rules; anonymous root denial is not a substitute for reviewing child grants.
The owner's production rules are a reference for a generated candidate, not
permission to overwrite any test or production rules.

The real candidate needs a publicly readable but client-nonwritable
`_ironpathRelease` record **and** reviewed server-side rules guarding all game
data. A locked or missing record intentionally makes the launcher unavailable.
It also needs a working trusted session exchange; the synthetic endpoint used in
local staging is deliberately unusable. Do not publish rules or place service
credentials in Vercel until the target and deployment/alias boundaries have been
independently checked and a test-only rollout and rollback are agreed. Never
share private keys, passwords, tokens, or player data in chat or this repository.

## Creating an isolated guarded candidate

The following makes local files **only**. The example is deliberately fake and
cannot log in; browser integration tests route it to loopback emulators. Do not
copy a service-account JSON, a private key, a player token, or any other secret
into this public configuration or the generated artifact. The Web API key below
is a synthetic stand-in for the intended public Firebase Web configuration.

```sh
mkdir -p /tmp/ironpath-candidate/IronPath/releases
cat > /tmp/ironpath-candidate/public.json <<'JSON'
{"firebase":{"apiKey":"fake-public-key","authDomain":"demo-ironpath.firebaseapp.com","databaseURL":"https://demo-ironpath.firebaseio.com","projectId":"demo-ironpath"},"sessionEndpoint":"https://release.example/api/session"}
JSON
node IronPath/release-tools/stage-version.mjs IronPath /tmp/ironpath-candidate/IronPath/releases example-1 --guarded-public-config /tmp/ironpath-candidate/public.json
node IronPath/release-tools/stage-launcher.mjs IronPath /tmp/ironpath-candidate/IronPath launcher-1 /tmp/ironpath-candidate/public.json
```

Use a fresh directory and never reuse a game or launcher ID for different
contents. Both tools reject source/output overlap and refuse to overwrite their
entry paths; an unsuccessful stage can leave a partial directory that must not
be published. The launcher and game need exactly the same public config. The
normal `account.js` default config is replaced in a guarded build only; review
and scan the *whole* output for unexpected production identifiers whenever the
source changes. The config validator does not prove that the Firebase database
belongs to the selected Auth project. The candidate is hard-coded for
`/IronPath/`, requires HTTPS except loopback in local checks, and currently
accepts the project's `firebaseapp.com` Auth domain. The normal packager
invocation without the explicit config remains unguarded.

After a separately reviewed deployment, the operator can compare the whole
remote release with its trusted *local* inventory using
`node IronPath/release-tools/verify-public-release.mjs <authorized-site-origin> <local-release-manifest.json>`.
This read-only check downloads every listed file (currently roughly 68 MB), uses
bounded concurrency and fails on a missing or altered response. It does not
verify the stable launcher itself, future changes, a browser's service worker or
cached resources, Firebase rules, the session service, or a safe release order.
It must not be treated as permission to reopen maintenance.

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

The cross-tab, combined browser-runtime, staged-game and packaged-site tests
additionally require Playwright/Chromium. CI installs them and runs
`npm run test:release-tabs --prefix IronPath/firebase/rules-test` with `NODE_PATH`
pointing at the pinned Playwright installation. The tests use only
`demo-ironpath`, loopback emulators and synthetic users; they do not inspect or
modify the live Firebase project.
