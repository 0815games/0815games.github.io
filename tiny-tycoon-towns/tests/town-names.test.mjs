import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTownName, townKey } from '../src/town-names.js';

test('names are unique by their normalized key (case and spacing ignored)', () => {
  assert.equal(townKey('  Eichen   Hain '), 'eichen hain');
  assert.equal(townKey('EICHENHAIN'), 'eichenhain');
  assert.notEqual(townKey('Eichen Hain'), townKey('Eichenhain'));
});

test('empty, too long and forbidden names are rejected with a message', () => {
  assert.equal(checkTownName('   ').ok, false);
  assert.equal(checkTownName('x'.repeat(25)).ok, false);
  assert.equal(checkTownName('Stadt.Name').ok, false);
  assert.equal(checkTownName('A/B').ok, false);
  assert.ok(checkTownName('A#B').reason.includes('nicht erlaubt'));
});

test('a valid name gives the cleaned name and its key', () => {
  assert.deepEqual(checkTownName('  Sonnen  brück '), { ok: true, key: 'sonnen brück', name: 'Sonnen brück' });
});
