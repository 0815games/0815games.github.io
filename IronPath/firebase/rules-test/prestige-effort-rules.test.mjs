import {test, before, after, beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment, assertSucceeds, assertFails} from '@firebase/rules-unit-testing';
import {ref, get, set, update} from 'firebase/database';

// AUSBAU-PLAN Punkt 4, Emulator-Beweis gegen die exakte Publish-Datei
// (../PRESTIGE-EFFORT-TO-PUBLISH.json): Die zwei neuen Profilfelder nehmen
// die Schreibungen des echten Clients an (Prestige-Sprossen einzeln,
// Spenden in Deckel-Schritten) und verweigern Sprünge - der Rest des
// Profils bleibt, was er war.
let env, alice;
const now = Math.floor(Date.now() / 1000);
const claims = () => ({iat: now, auth_time: now - 30, firebase: {sign_in_provider: 'password', identities: {}}});
before(async () => {
  env = await initializeTestEnvironment({projectId: 'demo-ironpath', database: {host: '127.0.0.1', port: 9000, rules: await readFile(new URL('../PRESTIGE-EFFORT-TO-PUBLISH.json', import.meta.url), 'utf8')}});
  alice = env.authenticatedContext('alice', claims()).database();
});
beforeEach(async () => {
  await env.clearDatabase();
  // Wie im Delta-Beweis: Das Wartungs-Gate (format 1 / open) muss in der
  // Datenbank stehen, und eine DB-Instanz pro Seed genügt.
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.database();
    await set(ref(db, '_ironpathMaintenance'), {format: 1, mode: 'open', authAfterMs: 0});
    await set(ref(db, 'players/alice'), {
      name: 'Alice', gender: 'female', xp: 900, campaign: 3,
      armory: {scrap: 5000, fortify: 0, plating: 0, repair: 0, gun: 0, supply: 0, safeguard: 0, owned: 1, equipped: 1},
    });
  });
});
after(async () => env.cleanup());

const p = () => ref(alice, 'players/alice');

test('the prestige ladder climbs one rung per write and pays its scrap', async () => {
  await assertFails(update(p(), {campaignPrestige: 2}), 'no first-write leap');
  await assertSucceeds(update(p(), {campaignPrestige: 1, 'armory/scrap': 5150}), 'rung one plus its 150 scrap bonus');
  await assertFails(update(p(), {campaignPrestige: 3}), 'no skipping rungs');
  await assertSucceeds(update(p(), {campaignPrestige: 2, 'armory/scrap': 5350}));
  await assertFails(update(p(), {campaignPrestige: 1}), 'the ladder never descends');
  assert.equal((await get(ref(alice, 'players/alice/campaignPrestige'))).val(), 2);
});

test('the war effort only grows in donation steps and never shrinks', async () => {
  await assertSucceeds(update(p(), {warEffort: 250, 'armory/scrap': 4750}), 'a donation spends scrap in the same write');
  await assertFails(update(p(), {warEffort: 1251}), 'one write funds at most 1000');
  await assertSucceeds(update(p(), {warEffort: 1250, 'armory/scrap': 3750}));
  await assertFails(update(p(), {warEffort: 100}), 'donations never come back');
  await assertFails(update(p(), {warEffort: 50001}), 'the ceiling holds');
});

test('everything the old ruleset allowed still works, unknown fields still refuse', async () => {
  await assertSucceeds(update(p(), {xp: 900 + 1020}), 'an honest wave still saves');
  await assertSucceeds(update(p(), {storyProgress: 1}));
  await assertFails(update(p(), {'armory/scrap': 5000 + 1001}), 'the live scrap growth cap is untouched');
  await assertFails(update(p(), {prestigeLevel: 1}), 'no third field sneaks in');
});
