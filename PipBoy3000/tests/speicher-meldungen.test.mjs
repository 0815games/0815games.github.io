import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const quelle = readFileSync(new URL('../src/network.js', import.meta.url), 'utf8');

test('automatische Cloud-Speicherungen schreiben weiterhin, aber ohne Erfolgsmeldungsflut', async () => {
  const dom = new JSDOM('', {url: 'https://example.test/', runScripts: 'outside-only'});
  const w = dom.window;
  w.eval(quelle);
  const writes = [], meldungen = [];
  w.UI = {log: (...args) => meldungen.push(args)};
  Object.assign(w.Network, {active: true, myId: 'spieler', sessionId: 'sitzung', auth: {currentUser: {}}, db: {ref: path => ({set: async data => writes.push({path, data})})}});
  for (let i = 0; i < 5; i++) w.Network.saveToSlot(0, {playerName: 'Test', sektor: i});
  await Promise.resolve();
  assert.equal(writes.length, 5);
  assert.equal(writes[4].data.sektor, 4);
  assert.equal(meldungen.length, 0);
  dom.window.close();
});

test('Speicherfehler bleiben im Fehlerprotokoll sichtbar', async () => {
  const dom = new JSDOM('', {url: 'https://example.test/', runScripts: 'outside-only'});
  const w = dom.window;
  w.eval(quelle);
  const fehler = [];
  w.console.error = (...args) => fehler.push(args);
  Object.assign(w.Network, {active: true, myId: 'spieler', sessionId: 'sitzung', auth: {currentUser: {}}, db: {ref: () => ({set: () => Promise.reject(new Error('Netzfehler'))})}});
  w.Network.saveToSlot(0, {playerName: 'Test'});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(fehler.length, 1);
  assert.match(fehler[0][0], /Save Error/);
  dom.window.close();
});
