import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {applyBlock6TutorialRules,BLOCK6_TUTORIAL_GUARD,BLOCK6_TUTORIAL_RULE} from '../firebase/block6-tutorial-candidate.mjs';
import {buildBlock2PublishCandidate} from '../firebase/block2-publish-candidate.mjs';
import {compareRules,unwrapRules} from '../scripts/rules-publish-dry-run.mjs';

const read=rel=>readFileSync(new URL('../'+rel,import.meta.url),'utf8');

test('block6-tutorial-candidate adds strict per-character tutorial persistence over BLOCK9D without loosening anything',()=>{
  const baseText=read('firebase/BLOCK9D-RULES-TO-PUBLISH.json');
  const base=JSON.parse(baseText);
  const patched={rules:applyBlock6TutorialRules(structuredClone(base.rules))};

  const tut=patched.rules.players.$uid.tutorial;
  assert.deepEqual(tut,BLOCK6_TUTORIAL_RULE);
  assert.equal(tut.$other['.validate'],false,'unknown tutorial keys rejected');
  assert.match(patched.rules.players.$uid['.validate'],new RegExp(BLOCK6_TUTORIAL_GUARD.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(tut.rewarded['.validate'],/!data\.exists\(\)\s*\|\|\s*data\.val\(\)\s*!==\s*true\s*\|\|\s*newData\.val\(\)\s*===\s*true/,'rewarded flag is monotonic per character');
  assert.match(tut.missionCompleted['.validate'],/!data\.exists\(\)\s*\|\|\s*data\.val\(\)\s*!==\s*true\s*\|\|\s*newData\.val\(\)\s*===\s*true/,'missionCompleted flag is monotonic per character');

  // Idempotent when applied twice, and rejects unexpected divergence.
  assert.deepEqual(applyBlock6TutorialRules(structuredClone(patched.rules)),patched.rules);
  const altered=structuredClone(patched.rules);
  altered.players.$uid.tutorial.extra={'.validate':'newData.isBoolean()'};
  assert.throws(()=>applyBlock6TutorialRules(altered),/different schema/);

  // Dry-run against live BLOCK9D reports 0 blockers.
  const publishCandidate=buildBlock2PublishCandidate(baseText);
  const report=compareRules(unwrapRules(base),unwrapRules(publishCandidate));
  assert.equal(report.blockers.length,0,'consolidated Block 2 + Block 6 publish candidate has 0 blockers against BLOCK9D');
  assert.ok(report.added.includes('/players/$uid/tutorial'),'players/$uid/tutorial included in publishable diff');
  assert.ok(report.added.includes('/characterNames/$key'),'characterNames/$key included in publishable diff');
});
