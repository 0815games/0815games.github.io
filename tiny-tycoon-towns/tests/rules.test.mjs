import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkRules, missingPaths, CANDIDATE } from '../scripts/rules-publish-dry-run.mjs';

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

test('sessions are owner-only and reject unknown fields (bissfest)', () => {
  const bad = structuredClone(candidate);
  bad.rules.sessions.$uid['.write'] = 'true';
  assert.ok(checkRules(bad).errors.some((e) => e.includes('sessions/$uid: .write ohne Eigentümerprüfung')));
  const bad2 = structuredClone(candidate);
  delete bad2.rules.sessions.$uid.$other;
  assert.ok(checkRules(bad2).errors.some((e) => e.includes('$other')));
});

test('admins are readable only by their own account and never writable (bissfest)', () => {
  const bad = structuredClone(candidate);
  bad.rules.admins = { $uid: { '.read': 'true', '.write': 'auth != null' } };
  const errs = checkRules(bad).errors;
  assert.ok(errs.some((e) => e.includes('admins/$uid: .read ohne Eigentümerprüfung')));
  assert.ok(errs.some((e) => e.includes('admins/$uid: .write muss false sein')));
  assert.equal(checkRules(candidate).errors.filter((e) => e.includes('admins')).length, 0);
});

test('other towns: only the view fields are readable, never coins, stock or the town node (bissfest)', () => {
  const bad = structuredClone(candidate);
  bad.rules.saves.$uid.town.coins['.read'] = 'auth != null';
  assert.ok(checkRules(bad).errors.some((e) => e.includes('town/coins: .read nur für Ansichtsfelder')));
  const bad2 = structuredClone(candidate);
  bad2.rules.saves.$uid.town['.read'] = 'auth != null';
  assert.ok(checkRules(bad2).errors.some((e) => e.includes('Stadt-Knoten')));
  // Die Ansicht selbst ist erlaubt.
  assert.equal(checkRules(candidate).errors.filter((e) => e.includes('Ansichtsfelder') || e.includes('Stadt-Knoten')).length, 0);
});

test('friends draft passes the lock-mode checks (bissfest)', () => {
  const draft = JSON.parse(readFileSync(new URL('../firebase/friends-draft.rules.json', import.meta.url), 'utf8'));
  assert.deepEqual(checkRules(draft).errors, []);
});

test('friend requests can only be created by the sender (bissfest)', () => {
  const draft = JSON.parse(readFileSync(new URL('../firebase/friends-draft.rules.json', import.meta.url), 'utf8'));
  const rule = String(draft.rules.friendRequests.$to.$from['.write']);
  // Der Empfänger darf nur löschen (annehmen/ablehnen), nie anlegen.
  assert.ok(rule.includes('auth.uid === $from ||'));
  assert.ok(rule.includes('auth.uid === $to && !newData.exists()'));
});
