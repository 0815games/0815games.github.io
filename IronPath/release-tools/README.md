# Iron Path release guard — experiment, not production

These files are **not connected to the game or production Firebase**. Do not
publish the generated rules, start a real maintenance window, or promise that
sign-in is blocked using these prototypes alone. GitHub Pages currently serves
`main:/` directly; an ordinary merge is not gated by this experiment.

The owner reports that the Firebase project is dedicated to Iron Path and that
they can administer it. The owner requires a **free solution only**: do not
activate billing or a paid plan. The owner can set up Vercel Hobby for this
non-commercial personal project, and chose to block sign-in **in the game** and
access to its data, not to prohibit every possible Firebase Auth token. Vercel
Hobby is a target, not an established service; the project configuration, free
limits, identity setup and actual deployments still need independent verification.

## Current isolated candidates

- Vercel is connected to the owner's `0815games` Hobby team, but that team has
  no projects. Creating a repository-linked project was rejected because the
  Vercel account needs a GitHub Login Connection. **No Vercel project or
  deployment was created.** The owner must connect GitHub and grant repository
  access in Vercel before retrying; do not create a project implicitly through
  a deployment call.
- `api/session.mjs`, `package.json`, `vercel.json`, and `public/` are an
  **unconfigured** Node 22/Vercel service candidate rooted in this directory.
  The intended static output contains only `public/`; actual bundling, HTTP
  handling and public browser/CORS access still need a real Vercel deployment
  test. Team deployment protection, the production alias and a Hobby WAF rule
  must be checked explicitly. Hobby rate limits are per region, not a global
  distributed security guarantee; its quotas can interrupt service.
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
  not the Vercel service. It does not yet modify `account.js`, build a launcher
  or control production.

## What has to be true before enabling it

1. Verify the real Firebase project, database instance, deployed rules, Auth
   providers, plan, administrator permissions, backups, and whether any other
   application shares those resources. `WORKSHOP-RULES-TO-PUBLISH.json` is a
   repository reference, **not** a verified live export. Disabling a provider
   or wrapping every rule can interrupt other applications and data paths.
2. Decide and provision a trusted, TLS-hosted session service. It needs a
   narrowly scoped identity, an authoritative *fresh* control-record read,
   Admin ID-token verification with revocation checking, custom-token signing,
   protected operations, monitoring and abuse/rate limits. None is deployed
   here. Never place service-account keys, tokens or player data in this repo.
3. Integrate the game and launcher before changing production rules. The game
   currently signs in directly and immediately starts a profile listener. It
   must authenticate with a separate transient password-auth instance, exchange
   the token, validate the custom claims, and only then start game listeners.
   A status failure must freeze the interface, stop the database and terminate
   the document. The stable entry point must select and verify a complete,
   immutable build. `stage-version.mjs` merely makes a local candidate; it is
   not a Pages pipeline, launcher, cryptographic code attestation or deployment.
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
```

The cross-tab test additionally requires Playwright/Chromium. CI installs it
and runs `npm run test:release-tabs --prefix IronPath/firebase/rules-test` with
`NODE_PATH` pointing at the pinned Playwright installation. The tests use only
`demo-ironpath`, loopback emulators and synthetic users; they do not inspect or
modify the live Firebase project.
