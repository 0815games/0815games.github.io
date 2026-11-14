import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {buildRulesCandidate, RELEASE_GATE} from '../release-tools/rules-candidate.mjs';
import {CONTROL_PATH} from '../release-tools/release-control.mjs';

const source = JSON.parse(await readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json', import.meta.url), 'utf8'));

function walkTogether(before, after, path = '') {
  for (const [key, value] of Object.entries(before)) {
    if (key === '.read' || key === '.write') {
      if (value === false || (typeof value === 'string' && value.trim() === 'false')) {
        assert.equal(after[key], value, `${path}/${key} remains denied`);
      } else {
        assert.equal(after[key], `(${RELEASE_GATE}) && (${String(value)})`, `${path}/${key} is individually fenced`);
      }
    } else if (key === '.validate' || key === '.indexOn') {
      assert.deepEqual(after[key], value, `${path}/${key} is unchanged`);
    } else {
      walkTogether(value, after[key], `${path}/${key}`);
    }
  }
}

test('candidate fences every existing grant and preserves the reference conditions', () => {
  const untouched = structuredClone(source);
  const {candidate, counts} = buildRulesCandidate(source);
  assert.deepEqual(source, untouched, 'does not mutate the source rules');
  assert.deepEqual(counts, {readWrapped:45, writeWrapped:41, readDenied:1, writeDenied:1});
  walkTogether(source.rules, candidate.rules);
  assert.deepEqual(candidate.rules[CONTROL_PATH], {'.read':true, '.write':false});
  assert.match(RELEASE_GATE, /firebase\.sign_in_provider === 'custom'/);
  assert.match(RELEASE_GATE, /ip_release_epoch/);
  assert.match(RELEASE_GATE, /\.matches\(\/\^\[a-f0-9\]\{32\}\$\/\)/);
});

test('root or wildcard grants cannot override the read-only control node', () => {
  for (const key of ['.read', '.write']) {
    for (const value of [true, 'true', 'auth != null']) {
      const copy = structuredClone(source); copy.rules[key] = value;
      assert.throws(() => buildRulesCandidate(copy), /explicitly false/);
    }
    const copy = structuredClone(source); delete copy.rules[key];
    assert.throws(() => buildRulesCandidate(copy), /explicitly false/);
  }
  const wildcard = structuredClone(source); wildcard.rules.$other = {'.write':'true'};
  assert.throws(() => buildRulesCandidate(wildcard), /wildcards/);
  const collision = structuredClone(source); collision.rules[CONTROL_PATH] = {'.write':true};
  assert.throws(() => buildRulesCandidate(collision), /already exists/);
});

test('candidate rejects malformed nodes, unsupported directives and malformed grants', () => {
  assert.throws(() => buildRulesCandidate(null), /complete rules/);
  assert.throws(() => buildRulesCandidate({rules:{'.read':false, '.write':false, players:'true'}}), /Invalid rules node/);
  assert.throws(() => buildRulesCandidate({rules:{'.read':false, '.write':false, players:{'.write':null}}}), /Invalid .write/);
  assert.throws(() => buildRulesCandidate({rules:{'.read':false, '.write':false, '.unknown':true}}), /Unknown rules directive/);
});

test('ordinary database keys cannot alter the generator object prototype', () => {
  const input = JSON.parse('{"rules":{".read":false,".write":false,"__proto__":{".read":"true"}}}');
  const {candidate, counts} = buildRulesCandidate(input);
  assert.equal(counts.readWrapped, 1);
  assert.equal(JSON.parse(JSON.stringify(candidate)).rules.__proto__['.read'], `(${RELEASE_GATE}) && (true)`);
});
