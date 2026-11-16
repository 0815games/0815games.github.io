import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';

const expected=[
 'test:party-end-browser',
 'test:party-end-rejection-browser',
 'test:party-signout-browser',
 'test:party-modes-browser',
 'test:party-offline-modes-browser',
 'test:party-natural-browser',
 'test:party-recovery-browser',
 'test:party-maintenance-browser'
];

test('each party-finalization browser scenario is scheduled against isolated local emulators in CI',async()=>{
 const workflow=await readFile(new URL('../../.github/workflows/ironpath-firebase-rules.yml',import.meta.url),'utf8');
 const match=workflow.match(/^  party-finalization-browser:\s*\n([\s\S]*?)(?=^  [a-z][\w-]*:\s*\n|$(?![\s\S]))/m);
 assert.ok(match,'a separate matrix job prevents port collisions with the other emulator jobs');
 const job=match[1],scheduled=[...job.matchAll(/^\s+- (test:party-[\w-]+-browser)\s*$/gm)].map(result=>result[1]);
 assert.deepEqual(scheduled,expected);assert.match(job,/fail-fast:\s*false/);assert.match(job,/npm run "\$TEST_SCRIPT"/);
 const {scripts}=JSON.parse(await readFile(new URL('../firebase/rules-test/package.json',import.meta.url),'utf8'));
 for(const name of expected){
  const script=scripts[name];assert.equal(typeof script,'string',`${name} exists`);
  assert.match(script,/firebase emulators:exec --only auth,database --project demo-ironpath --config \.\.\/firebase-release\.emulator\.json/);
  assert.match(script,/node multiplayer-browser\.cjs/);
 }
 assert.match(scripts['test:party-maintenance-browser'],/IRONPATH_TEST_MAINTENANCE=1.*IRONPATH_BROWSER_PLAYERS=3/);
 assert.match(scripts['test:party-maintenance-browser'],/IRONPATH_TEST_MAINTENANCE=1.*IRONPATH_BROWSER_PLAYERS=4/);
});
