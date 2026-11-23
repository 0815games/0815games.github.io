import {test, before, after, beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment, assertSucceeds, assertFails} from '@firebase/rules-unit-testing';
import {ref, get, set, update} from 'firebase/database';

// AUSBAU-PLAN Punkt 2, Emulator-Beweis gegen die exakte Publish-Datei
// (../PROGRESSION-DELTA-CAPS-TO-PUBLISH.json): Ehrliche Schreibungen des
// echten Clients gehen durch, Ein-Schreibungs-Sprünge ans Limit nicht.
let env, alice;
const now = Math.floor(Date.now() / 1000);
const claims = () => ({iat: now, auth_time: now - 30, firebase: {sign_in_provider: 'password', identities: {}}});
before(async () => {
  env = await initializeTestEnvironment({projectId: 'demo-ironpath', database: {host: '127.0.0.1', port: 9000, rules: await readFile(new URL('../PROGRESSION-DELTA-CAPS-TO-PUBLISH.json', import.meta.url), 'utf8')}});
  alice = env.authenticatedContext('alice', claims()).database();
});
beforeEach(async () => {
  await env.clearDatabase();
  // Die Live-Regeln tragen das Wartungs-Gate (format 1 / open); ohne den
  // Stempel in der Datenbank bleibt jede Schreibung zu Recht verweigert.
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.database();
    await set(ref(db, '_ironpathMaintenance'), {format: 1, mode: 'open', authAfterMs: 0});
    await set(ref(db, 'players/alice'), {
      name: 'Alice', gender: 'female', xp: 900, campaign: 3,
      armory: {scrap: 100, fortify: 0, plating: 0, repair: 0, gun: 0, supply: 0, safeguard: 0, owned: 1, equipped: 1},
    });
  });
});
after(async () => env.cleanup());

const p = () => ref(alice, 'players/alice');

test('xp grows by an honest wave and refuses the jump to the ceiling', async () => {
  await assertSucceeds(update(p(), {xp: 900 + 1020}));
  await assertFails(update(p(), {xp: 1920 + 5001}));
  await assertSucceeds(update(p(), {xp: 1920 + 5000}));
  await assertFails(update(p(), {xp: 10000000}));
  await assertFails(update(p(), {xp: 100}));
});

test('story progress and the endless counters step, never leap', async () => {
  await assertFails(update(p(), {storyProgress: 2}));
  await assertSucceeds(update(p(), {storyProgress: 1}));
  await assertFails(update(p(), {storyProgress: 3}));
  await assertSucceeds(update(p(), {storyProgress: 2}));
  await assertSucceeds(update(p(), {endlessRuns: 1, endlessWaves: 7, endlessBosses: 1, endlessBestSector: 2}));
  await assertFails(update(p(), {endlessRuns: 3}));
  await assertSucceeds(update(p(), {endlessRuns: 2}));
  await assertFails(update(p(), {endlessWaves: 7 + 1001}));
  await assertSucceeds(update(p(), {endlessWaves: 7 + 1000}));
  await assertFails(update(p(), {endlessBosses: 1 + 201}));
  await assertSucceeds(update(p(), {endlessBosses: 1 + 200}));
});

test('scrap may be spent freely but not minted in one write', async () => {
  await assertSucceeds(update(p(), {'armory/scrap': 1100}));
  await assertFails(update(p(), {'armory/scrap': 2101}));
  await assertSucceeds(update(p(), {'armory/scrap': 5}), 'spending down is not a growth step');
});

test('the leaderboard best wave climbs with play, not to the cap at once', async () => {
  const board = ref(alice, 'leaderboards/solo/alice');
  await assertFails(set(board, {name: 'Alice', wave: 10000}));
  await assertSucceeds(set(board, {name: 'Alice', wave: 10}));
  await assertFails(update(board, {wave: 511}));
  await assertSucceeds(update(board, {wave: 510}));
  assert.equal((await get(board)).val().wave, 510);
});
