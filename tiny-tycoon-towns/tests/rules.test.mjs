import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkRules, missingPaths, CANDIDATE } from '../scripts/check-rules.mjs';

const candidate = JSON.parse(readFileSync(CANDIDATE, 'utf8'));

test('candidate rules pass the lock-mode checks', () => {
  assert.deepEqual(checkRules(candidate).errors, []);
});

test('an open root is rejected (bissfest)', () => {
  const bad = { rules: { '.read': true, '.write': true } };
  assert.ok(checkRules(bad).errors.some((e) => e.includes('Wurzel')));
});

test('an open save path is rejected (bissfest)', () => {
  const bad = structuredClone(candidate);
  bad.rules.saves.$uid.town['.write'] = 'true';
  assert.ok(checkRules(bad).errors.some((e) => e.includes('.write ohne Eigentümerprüfung')));
});

test('unknown fields in a town are rejected (bissfest)', () => {
  const bad = structuredClone(candidate);
  delete bad.rules.saves.$uid.town.$other;
  assert.ok(checkRules(bad).errors.some((e) => e.includes('$other')));
});

test('missing live paths are reported before publishing', () => {
  const live = { rules: { ...candidate.rules, players: { $uid: { '.read': true } } } };
  assert.deepEqual(missingPaths(live, candidate), ['/players', '/players/$uid']);
});

test('the wrapped export form is accepted', () => {
  assert.deepEqual(checkRules({ rules: candidate.rules }).errors, []);
});
