import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createFirebaseFourLobby} from '../net/firebase-four-lobby.mjs';
import {createFourDigitLobby} from '../net/firebase-four-digit-lobby.mjs';
import {createCoopInvites} from '../core/coop-invites.mjs';

// AUSBAU-PLAN Punkt 5: Party-Codes werden sechsstellig (1.000.000 statt
// 10.000 Kombinationen - der alte Raum war in Sekunden aufgezählt). Der
// Beitritt akzeptiert beide Längen, damit Codes von vor der Umstellung
// auslaufen statt mitten in der Party zu brechen; erzeugt wird nur noch
// sechsstellig. Sind die neuen Regeln noch nicht veröffentlicht, fällt
// die Erzeugung sitzungsweise auf vier Stellen zurück.

function fakeSdk({denySix = false} = {}) {
  const root = {};
  const denied = path => denySix && /(?:partyCodes|fourCodes)\/\d{6}(?:\/|$)/.test(path);
  const get = path => { let p = root; for (const key of path.split('/')) { if (!p || typeof p !== 'object' || !Object.hasOwn(p, key)) return null; p = p[key]; } return p == null ? null : structuredClone(p); };
  const set = (path, value) => { const keys = path.split('/'), last = keys.pop(); let p = root; for (const key of keys) p = p[key] || (p[key] = {}); if (value === null) delete p[last]; else p[last] = structuredClone(value); };
  const sdk = {
    ref: (_db, path) => path,
    async get(path) { if (denied(path)) throw Error('PERMISSION_DENIED'); return {val: () => get(path), exists: () => get(path) !== null}; },
    async set(path, value) { if (denied(path)) throw Error('PERMISSION_DENIED'); set(path, value); },
    async remove(path) { set(path, null); },
    async update(path, values) { for (const [key, value] of Object.entries(values)) set(path ? `${path}/${key}` : key, value); },
    async runTransaction(path, fn) { if (denied(path)) throw Error('PERMISSION_DENIED'); const value = fn(get(path)); if (value === undefined) return {committed: false, snapshot: {val: () => get(path)}}; set(path, value); return {committed: true, snapshot: {val: () => get(path)}}; },
    onValue(path, cb) { cb({val: () => get(path)}); return () => {}; },
    serverTimestamp: () => 1,
  };
  return {sdk, root};
}
let counter = 0;
const cryptoFake = {getRandomValues(bytes) { bytes.fill(++counter); return bytes; }};
const profile = name => ({name, gender: 'female', level: 1});

test('the four-player lobby creates six-digit codes and joins both lengths', async () => {
  const {sdk} = fakeSdk();
  const make = uid => createFirebaseFourLobby({db: {}, sdk, crypto: cryptoFake, auth: {currentUser: {uid}}});
  const alice = make('alice'), bob = make('bob');
  const party = await alice.create(profile('Alice'));
  assert.match(party.inviteCode, /^\d{6}$/, 'new parties are six digits');
  const joined = await bob.request(party.inviteCode, 'Bob');
  assert.equal(joined.partyId, party.partyId);
  await assert.rejects(() => bob.request('12345', 'Bob'), /Invalid request/, 'five digits are neither old nor new');
  await assert.rejects(() => bob.request('1234567', 'Bob'), /Invalid request/);
});

test('the two-player lobby creates six-digit codes and joins both lengths', async () => {
  const {sdk} = fakeSdk();
  const inner = {async create() { return {partyId: 'a'.repeat(32), hostId: 'alice'}; }, async close() {}};
  const make = uid => createFourDigitLobby({db: {}, sdk, crypto: cryptoFake, auth: {currentUser: {uid}}, lobby: inner});
  const alice = make('alice'), bob = make('bob');
  const party = await alice.create();
  assert.match(party.inviteCode, /^\d{6}$/);
  const joined = await bob.request(party.inviteCode, 'Bob');
  assert.equal(joined.hostId, 'alice');
  await assert.rejects(() => bob.request('12345', 'Bob'), /Invalid request/);
});

test('before the six-digit rules are published, creation falls back to four digits', async () => {
  const {sdk, root} = fakeSdk({denySix: true});
  const four = createFirebaseFourLobby({db: {}, sdk, crypto: cryptoFake, auth: {currentUser: {uid: 'alice'}}});
  const legacy = await four.create(profile('Alice'));
  assert.match(legacy.inviteCode, /^\d{4}$/, 'the party still opens, in the space both rulesets accept');
  assert.equal(root.fourCodes[legacy.inviteCode].hostId, 'alice');
  // Und der Beitritt zu so einem Alt-Code funktioniert mit dem neuen Client:
  const {sdk: openSdk} = fakeSdk();
  void openSdk;
  const inner = {async create() { return {partyId: 'b'.repeat(32), hostId: 'alice'}; }, async close() {}};
  const duo = createFourDigitLobby({db: {}, sdk, crypto: cryptoFake, auth: {currentUser: {uid: 'alice'}}, lobby: inner});
  const duoParty = await duo.create();
  assert.match(duoParty.inviteCode, /^\d{4}$/, 'the two-player lobby falls back the same way');
});

test('friend invitations carry six-digit codes and still carry legacy ones', async () => {
  const {sdk, root} = fakeSdk();
  const invites = createCoopInvites({db: {}, sdk, auth: {currentUser: {uid: 'alice'}}});
  const partyId = 'c'.repeat(32);
  await invites.send('bob', {code: '123456', partyId}, 'Alice');
  assert.equal(root.coopInvites.bob.alice.code, '123456');
  await invites.send('bob', {code: '1234', partyId}, 'Alice');
  assert.equal(root.coopInvites.bob.alice.code, '1234', 'a pre-switch party can still invite friends');
  await assert.rejects(() => invites.send('bob', {code: '12345', partyId}, 'Alice'), /Create a multiplayer party first/);
});
