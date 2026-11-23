import {test, before, after, beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment, assertSucceeds, assertFails} from '@firebase/rules-unit-testing';
import {ref, set, update} from 'firebase/database';

// AUSBAU-PLAN Punkt 5, Emulator-Beweis gegen die exakte Publish-Datei
// (../PARTY-CODES-SIX-DIGIT-TO-PUBLISH.json): Sechsstellige Codes lassen
// sich anlegen, anfragen und auf der Party hinterlegen; vierstellige
// Alt-Codes funktionieren weiter (Auslauf), fünf- und siebenstellige
// werden verweigert - und der Rest der Regeln bleibt der live Stand.
let env, alice, bob;
const now = Math.floor(Date.now() / 1000);
const claims = () => ({iat: now, auth_time: now - 30, firebase: {sign_in_provider: 'password', identities: {}}});
before(async () => {
  env = await initializeTestEnvironment({projectId: 'demo-ironpath', database: {host: '127.0.0.1', port: 9000, rules: await readFile(new URL('../PARTY-CODES-SIX-DIGIT-TO-PUBLISH.json', import.meta.url), 'utf8')}});
  alice = env.authenticatedContext('alice', claims()).database();
  bob = env.authenticatedContext('bob', claims()).database();
});
beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.database();
    await set(ref(db, '_ironpathMaintenance'), {format: 1, mode: 'open', authAfterMs: 0});
    await set(ref(db, 'players/alice'), {
      name: 'Alice', gender: 'female', xp: 900, campaign: 3,
      armory: {scrap: 100, fortify: 0, plating: 0, repair: 0, gun: 0, supply: 0, safeguard: 0, owned: 1, equipped: 1},
    });
    // A join request must carry the requester's own profile name
    // (requests .validate compares them), so Bob needs a profile too.
    await set(ref(db, 'players/bob'), {name: 'Bob', gender: 'male', xp: 0});
  });
});
after(async () => env.cleanup());

test('a six-digit two-player code opens, takes a request, and closes', async () => {
  // The rules bind the code to a real party: the party carries the code as
  // its inviteCode before the code node may link to it (the client's order).
  const partyId = 'a'.repeat(32);
  await env.withSecurityRulesDisabled(async ctx => {
    await set(ref(ctx.database(), `parties/${partyId}`), {hostId: 'alice'});
  });
  await assertSucceeds(update(ref(alice, `parties/${partyId}`), {inviteCode: '123456'}));
  await assertSucceeds(set(ref(alice, 'partyCodes/123456/hostId'), 'alice'));
  await assertSucceeds(set(ref(alice, 'partyCodes/123456/partyId'), partyId));
  await assertSucceeds(set(ref(bob, 'partyCodes/123456/requests/bob'), {name: 'Bob'}));
  await assertSucceeds(set(ref(alice, 'partyCodes/123456'), null), 'the host clears the code node');
});

test('legacy four-digit codes still run, in-between lengths do not', async () => {
  const legacyParty = 'd'.repeat(32);
  await env.withSecurityRulesDisabled(async ctx => {
    await set(ref(ctx.database(), `parties/${legacyParty}`), {hostId: 'alice'});
  });
  await assertSucceeds(update(ref(alice, `parties/${legacyParty}`), {inviteCode: '1234'}));
  await assertSucceeds(set(ref(alice, 'partyCodes/1234/hostId'), 'alice'), 'pre-switch parties run out');
  await assertSucceeds(set(ref(alice, 'partyCodes/1234/partyId'), legacyParty));
  await assertSucceeds(set(ref(bob, 'partyCodes/1234/requests/bob'), {name: 'Bob'}));
  await assertFails(set(ref(alice, 'partyCodes/12345/hostId'), 'alice'), 'five digits are neither old nor new');
  await assertFails(set(ref(alice, 'partyCodes/1234567/hostId'), 'alice'));
  await assertFails(set(ref(alice, 'fourCodes/12345/hostId'), 'alice'));
  await assertSucceeds(set(ref(alice, 'fourCodes/654321/hostId'), 'alice'), 'the four-player space is six digits too');
  await assertSucceeds(set(ref(alice, 'fourCodes/4321/hostId'), 'alice'), 'and keeps its legacy codes');
});

test('the invite code stored on a party follows the same format', async () => {
  // inviteCode is write-once on a party (!data.exists() in its .write), so
  // each format case gets its own party.
  const parties = ['b', 'c', 'd'].map(ch => ch.repeat(32));
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.database();
    for (const partyId of parties) await set(ref(db, `parties/${partyId}`), {hostId: 'alice'});
  });
  await assertSucceeds(update(ref(alice, `parties/${parties[0]}`), {inviteCode: '123456'}));
  await assertFails(update(ref(alice, `parties/${parties[1]}`), {inviteCode: '12345'}));
  await assertSucceeds(update(ref(alice, `parties/${parties[2]}`), {inviteCode: '1234'}), 'a fallback party keeps its four-digit code');
});

test('the rest of the live ruleset is untouched', async () => {
  await assertSucceeds(update(ref(alice, 'players/alice'), {xp: 900 + 1020}), 'an honest wave still saves under the delta caps');
  await assertSucceeds(update(ref(alice, 'players/alice'), {campaignPrestige: 1}), 'the prestige ladder from the base file still writes');
  await assertFails(update(ref(alice, 'players/alice'), {campaignPrestige: 3}), 'and still climbs one rung at a time');
});
