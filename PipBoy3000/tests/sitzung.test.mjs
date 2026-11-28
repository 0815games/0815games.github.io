import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function setup(initial = null, confirm = () => true) {
  let session = initial, listener = null, count = 0;
  const writes = [];
  const sessionRef = {
    once: async () => ({val: () => session}),
    transaction: async fn => {
      const next = fn(session);
      if (next === undefined) return {committed: false};
      session = next;
      if (listener) listener({val: () => session});
      return {committed: true};
    },
    on: (_event, cb) => { listener = cb; },
    off: () => { listener = null; }
  };
  const db = {ref(path) {
    if (!path) return {push: () => ({key: 'session-' + ++count})};
    if (path.startsWith('sessions/')) return sessionRef;
    return {set: async value => { writes.push([path, value]); }, once: async () => ({val: () => null}), off() {}};
  }};
  const logouts = [];
  const window = {PipDialog: {confirm: async () => confirm()}};
  const context = vm.createContext({window, console, setTimeout, clearTimeout, setInterval, clearInterval,
    UI: {logout: (...args) => logouts.push(args)}, Game: {saveTimer: null}});
  vm.runInContext(readFileSync(new URL('../src/network.js', import.meta.url), 'utf8'), context);
  const network = window.Network;
  Object.assign(network, {db, active: true, myId: 'u', auth: {currentUser: {email: 'u@example.com'}}});
  return {network, writes, logouts, changeSession(value) { session = value; listener?.({val: () => session}); }, getSession: () => session};
}

test('aktive Sitzung wird ohne Zustimmung nicht ersetzt', async () => {
  const existing = {id: 'old', lastSeen: Date.now()};
  const t = setup(existing, () => false);
  await assert.rejects(t.network.acquireSession('u'), /abgebrochen/);
  assert.equal(t.getSession(), existing);
});

test('Übernahme markiert Saves und verdrängter Client speichert nicht beim Logout', async () => {
  const t = setup({id: 'old', lastSeen: Date.now()});
  await t.network.acquireSession('u');
  await t.network.saveToSlot(0, {playerName: 'Test'});
  assert.equal(t.writes[0][1]._session, t.network.sessionId);
  t.changeSession({id: 'new', lastSeen: Date.now()});
  assert.equal(t.network.sessionId, null);
  assert.equal(t.logouts.length, 1);
  assert.equal(t.logouts[0][1], true);
  assert.equal(t.network.saveToSlot(0, {}), undefined);
  await t.network.disconnect();
});

test('Logout gibt nur die eigene Sitzung frei', async () => {
  const t = setup();
  await t.network.acquireSession('u');
  await t.network.disconnect();
  assert.equal(t.getSession(), null);
});

test('Löschung erzeugt markierten Tombstone statt ungeschütztem remove', async () => {
  const t = setup();
  await t.network.acquireSession('u');
  await t.network.deleteSlot(2);
  assert.equal(t.writes[0][0], 'saves/u/2');
  assert.equal(t.writes[0][1]._deleted, true);
  assert.equal(t.writes[0][1]._session, t.network.sessionId);
  await t.network.disconnect();
});
