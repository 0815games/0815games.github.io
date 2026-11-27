import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const firebase = require('firebase8/app');
require('firebase8/auth');
require('firebase8/database');
const source = readFileSync(new URL('../../src/network.js', import.meta.url), 'utf8');
const config = {apiKey: 'demo-key', authDomain: 'demo-pipboy.firebaseapp.com', projectId:'demo-pipboy', databaseURL:'http://127.0.0.1:9000?ns=demo-pipboy'};

function client(name, confirm) {
  const app = firebase.initializeApp(config, name);
  const auth = app.auth();
  auth.useEmulator('http://127.0.0.1:9099/');
  const db = app.database();
  db.useEmulator('127.0.0.1', 9000);
  let lost;
  const displaced = new Promise(resolve => { lost = resolve; });
  const window = {confirm};
  const context = vm.createContext({window, firebase, console, setTimeout, clearTimeout, setInterval, clearInterval,
    UI: {logout: (...args) => lost(args), log() {}}, Game: {saveTimer: null}});
  vm.runInContext(source, context);
  const network = window.Network;
  Object.assign(network, {db, auth});
  return {app, auth, db, network, displaced};
}

const timeout = (p, ms = 8000) => Promise.race([p, new Promise((_, reject) => setTimeout(() => reject(new Error('Zeitüberschreitung')), ms))]);

test('echter Firebase-8-Client: Abbruch und bestätigte Übernahme mit zwei unabhängigen Sitzungen', {timeout: 25000}, async () => {
  let allow = false;
  const a = client('a', () => true), b = client('b', () => allow);
  const email = 'session-test@example.invalid', password = 'test-password-123';
  try {
    console.log('STEP create user');
    const user = (await timeout(a.auth.createUserWithEmailAndPassword(email, password))).user;
    console.log('STEP login A');
    await timeout(a.network.login(email, password));
    console.log('STEP save A');
    await timeout(a.network.saveToSlot(0, {playerName:'Ada', lvl:3}));
    console.log('STEP decline B');
    await assert.rejects(timeout(b.network.login(email, password)), /abgebrochen/);
    assert.ok(a.network.sessionId);
    const still = await a.db.ref('saves/' + user.uid + '/0').once('value');
    assert.equal(still.val().lvl, 3);
    console.log('STEP takeover B');
    allow = true;
    const saves = await timeout(b.network.login(email, password));
    assert.equal(saves[0].lvl, 3);
    const lost = await timeout(a.displaced);
    assert.equal(lost[1], true);
    assert.equal(a.network.sessionId, null);
    await b.network.saveToSlot(0, {playerName:'Ada', lvl:4});
    assert.equal((await b.db.ref('saves/' + user.uid + '/0').once('value')).val().lvl, 4);
    await b.network.deleteSlot(0);
    assert.equal((await b.db.ref('saves/' + user.uid + '/0').once('value')).val()._deleted, true);
    console.log('STEP disconnect B');
    await timeout(b.network.disconnect());
  } finally {
    await timeout(a.network.disconnect()).catch(() => {});
    if (b.network.sessionId) await timeout(b.network.disconnect()).catch(() => {});
    await timeout(Promise.all([a.app.delete(), b.app.delete()])).catch(() => {});
  }
});
