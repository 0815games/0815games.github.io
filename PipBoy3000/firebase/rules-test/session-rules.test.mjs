import {test, before, after, beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment, assertSucceeds, assertFails} from '@firebase/rules-unit-testing';
import {ref, get, set, update, remove, runTransaction, onValue} from 'firebase/database';

let env, a, b, other, admin, anon;
before(async () => {
  env = await initializeTestEnvironment({projectId: 'demo-pipboy', database: {
    host: '127.0.0.1', port: 9000,
    rules: await readFile(new URL('../database.rules.session-candidate.json', import.meta.url), 'utf8')
  }});
  a = env.authenticatedContext('alice', {email: 'alice@example.com'}).database();
  b = env.authenticatedContext('alice', {email: 'alice@example.com'}).database();
  other = env.authenticatedContext('bob', {email: 'bob@example.com'}).database();
  admin = env.authenticatedContext('admin', {email: 'admin@pipboy-system.com'}).database();
  anon = env.unauthenticatedContext().database();
});
beforeEach(() => env.clearDatabase());
after(() => env?.cleanup());
const session = id => ({id, lastSeen: 1000});
const save = (id, level = 1) => ({_session: id, playerName: 'Ada', lvl: level});

test('legacy data remains readable and legacy unmarked writes are rejected', async () => {
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), 'saves/alice/0'), {playerName:'Ada', lvl:3}));
  assert.equal((await assertSucceeds(get(ref(a, 'saves/alice/0')))).val().lvl, 3);
  await assertFails(set(ref(a, 'saves/alice/0'), {playerName:'Ada', lvl:4}));
  await assertFails(remove(ref(a, 'saves/alice/0')));
  await assertFails(get(ref(other, 'saves/alice/0')));
});

test('only current marked full saves, tombstones and presence can be written', async () => {
  await assertSucceeds(set(ref(a, 'sessions/alice'), session('A')));
  await assertSucceeds(set(ref(a, 'saves/alice/0'), save('A')));
  await assertSucceeds(set(ref(a, 'players/alice'), {_session:'A', name:'Ada', lastSeen:1}));
  await assertFails(set(ref(a, 'saves/alice/0'), save('B')));
  await assertFails(remove(ref(a, 'saves/alice/0')));
  await assertFails(remove(ref(a, 'players/alice')));
  await assertFails(set(ref(other, 'saves/alice/0'), save('A')));
  await assertFails(set(ref(other, 'sessions/alice'), session('B')));
  await assertFails(set(ref(anon, 'sessions/alice'), session('B')));
  await assertSucceeds(set(ref(a, 'saves/alice/0'), {_session:'A', _deleted:true}));
});

test('takeover rejects delayed full saves, tombstones and old presence without touching new data', async () => {
  await assertSucceeds(set(ref(a, 'sessions/alice'), session('A')));
  await assertSucceeds(set(ref(a, 'saves/alice/0'), save('A')));
  const lease = ref(b, 'sessions/alice');
  const ready = new Promise(resolve => { const stop = onValue(lease, snapshot => resolve({stop, snapshot})); });
  const {stop} = await ready;
  const taken = await assertSucceeds(runTransaction(lease, current => current && current.id === 'A' ? session('B') : undefined, {applyLocally:false}));
  stop();
  assert.equal(taken.committed, true);
  await assertSucceeds(set(ref(b, 'saves/alice/0'), save('B', 10)));
  await assertSucceeds(set(ref(b, 'players/alice'), {_session:'B', name:'New', lastSeen:2}));
  await assertFails(set(ref(a, 'saves/alice/0'), save('A', 2)));
  await assertFails(set(ref(a, 'saves/alice/0'), {_session:'A', _deleted:true}));
  await assertFails(set(ref(a, 'players/alice'), {_session:'A', name:'Old', lastSeen:3}));
  await assertFails(remove(ref(a, 'players/alice')));
  assert.equal((await get(ref(b, 'saves/alice/0'))).val().lvl, 10);
  assert.equal((await get(ref(b, 'players/alice'))).val().name, 'New');
});

test('admin can read and edit other accounts; other unrelated permissions stay intact', async () => {
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), 'saves/alice/0'), save('A', 3)));
  assert.equal((await assertSucceeds(get(ref(admin, 'saves')))).val().alice[0].lvl, 3);
  await assertSucceeds(set(ref(admin, 'saves/alice/0/lvl'), 4));
  await assertFails(get(ref(a, 'saves')));
  await assertSucceeds(set(ref(anon, 'bug_reports/report'), {message:'Fehler'}));
  await assertFails(get(ref(anon, 'bug_reports')));
  await assertSucceeds(get(ref(admin, 'bug_reports')));
  await assertSucceeds(set(ref(a, 'leaderboard/Ada'), {lvl:4}));
  await assertFails(set(ref(anon, 'leaderboard/Ada'), {lvl:99}));
  await assertSucceeds(get(ref(anon, 'players')));
  await assertFails(set(ref(a, 'unlisted'), 1));
});
