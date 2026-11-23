import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {applySixDigitPartyCodes, buildSixDigitPartyCodeCandidate, PARTY_CODE_OLD_FORMAT, PARTY_CODE_NEW_FORMAT, PARTY_CODE_FORMAT_SITES} from '../firebase/party-codes-six-candidate.mjs';

// AUSBAU-PLAN Punkt 5: sechsstellige Party-Codes. Der vierstellige Raum
// (10.000) war von jedem angemeldeten Konto in Sekunden aufgezählt; die
// Regeln selbst pinnen das Format an 17 Stellen. Diese Publish-Datei
// weitet exakt diese Stellen auf 4-oder-6 (Alt-Codes laufen aus), auf dem
// live Stand PRESTIGE-EFFORT; der Betreiber veröffentlicht selbst,
// WORKSHOP-RULES-TO-PUBLISH.json bleibt unangetastet.

const CHANGED = [
  '/rules/parties/$partyId/inviteCode/.write',
  '/rules/parties/$partyId/inviteCode/.validate',
  '/rules/partyCodes/$code/.write',
  '/rules/partyCodes/$code/hostId/.read',
  '/rules/partyCodes/$code/hostId/.write',
  '/rules/partyCodes/$code/partyId/.read',
  '/rules/partyCodes/$code/partyId/.write',
  '/rules/partyCodes/$code/requests/$uid/.write',
  '/rules/fourParties/$partyId/inviteCode/.write',
  '/rules/fourParties/$partyId/inviteCode/.validate',
  '/rules/fourCodes/$code/.write',
  '/rules/fourCodes/$code/hostId/.read',
  '/rules/fourCodes/$code/hostId/.write',
  '/rules/fourCodes/$code/partyId/.read',
  '/rules/fourCodes/$code/partyId/.write',
  '/rules/fourCodes/$code/requests/$uid/.write',
  '/rules/coopInvites/$receiver/$sender/code/.validate',
];

test('the six-digit publish file is the live ruleset with exactly the format widened', async () => {
  const baseText = await readFile(new URL('../firebase/PRESTIGE-EFFORT-TO-PUBLISH.json', import.meta.url), 'utf8');
  const publishText = await readFile(new URL('../firebase/PARTY-CODES-SIX-DIGIT-TO-PUBLISH.json', import.meta.url), 'utf8');
  const base = JSON.parse(baseText), publish = JSON.parse(publishText);
  const changed = [];
  const walk = (a, b, path = '') => {
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      assert.deepEqual(Object.keys(b).sort(), Object.keys(a).sort(), `${path} gains or loses no keys`);
      for (const key of Object.keys(a)) walk(a[key], b[key], `${path}/${key}`);
    } else if (a !== b) changed.push(path);
  };
  walk(base, publish);
  assert.deepEqual(changed.sort(), [...CHANGED].sort(), 'only the seventeen format strings move');
  assert.equal(buildSixDigitPartyCodeCandidate(baseText), publishText, 'the publish file is reproducible from the live base, byte for byte');
});

test('the new format takes six, keeps four for the run-out, and nothing else', async () => {
  assert.equal(PARTY_CODE_FORMAT_SITES, 17);
  const publish = JSON.parse(await readFile(new URL('../firebase/PARTY-CODES-SIX-DIGIT-TO-PUBLISH.json', import.meta.url), 'utf8'));
  const validate = publish.rules.parties.$partyId.inviteCode['.validate'];
  assert.ok(validate.includes(PARTY_CODE_NEW_FORMAT));
  const format = /^[0-9]{4}([0-9]{2})?$/;
  assert.ok(format.test('123456'), 'six digits join');
  assert.ok(format.test('1234'), 'four digits still join while old parties run out');
  assert.ok(!format.test('12345') && !format.test('1234567') && !format.test('abcdef'));
  const text = JSON.stringify(publish);
  assert.ok(!text.includes(PARTY_CODE_OLD_FORMAT), 'no rule still pins four alone');
});

test('a drifted base aborts the candidate build', async () => {
  const base = JSON.parse(await readFile(new URL('../firebase/PRESTIGE-EFFORT-TO-PUBLISH.json', import.meta.url), 'utf8'));
  base.rules.partyCodes.$code.hostId['.read'] = 'auth != null';
  assert.throws(() => applySixDigitPartyCodes(base.rules), /re-audit/);
  const missing = JSON.parse(await readFile(new URL('../firebase/PRESTIGE-EFFORT-TO-PUBLISH.json', import.meta.url), 'utf8'));
  delete missing.rules.fourCodes;
  assert.throws(() => applySixDigitPartyCodes(missing.rules), /re-audit/);
});
