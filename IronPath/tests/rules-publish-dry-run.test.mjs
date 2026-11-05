import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {writeFile,mkdtemp,readFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {compareRules,unwrapRules,CANDIDATE} from '../scripts/rules-publish-dry-run.mjs';
const run=promisify(execFile);
const candidate=unwrapRules(JSON.parse(await readFile(CANDIDATE,'utf8')));

test('exported rules may be wrapped and are unwrapped once',()=>{
 assert.equal(unwrapRules({rules:{foo:{'.read':true}}}).foo['.read'],true);
 assert.equal(unwrapRules({foo:{'.read':true}}).foo['.read'],true);
 assert.throws(()=>unwrapRules(null));assert.throws(()=>unwrapRules([]));
});

test('identical rules produce no blockers and no review noise',()=>{
 const report=compareRules(candidate,candidate);
 assert.deepEqual(report.blockers,[]);assert.deepEqual(report.warnings,[]);assert.deepEqual(report.added,[]);
});

test('a live restriction missing from the candidate is a blocker when its parent still grants access',()=>{
 const live=structuredClone(candidate);
 live.players.$uid.soloWorkshopReceipts={'.read':'auth != null'};
 const narrowed=structuredClone(candidate);
 delete narrowed.players.$uid.soloWorkshopReceipts;
 const report=compareRules(live,narrowed);
 assert.equal(report.blockers.length,1);
 assert.equal(report.blockers[0].path,'/players/$uid/soloWorkshopReceipts');
 assert.match(report.blockers[0].reason,/leave the path open/);
 assert.deepEqual(report.blockers[0].widens,['.read']);
});

test('a live-only subtree is a blocker when the parent grants write, because validation would vanish',()=>{
 const live=structuredClone(candidate);
 live.players.$uid.extraField={'.validate':'newData.isString()'};
 const report=compareRules(live,candidate);
 assert.equal(report.blockers.length,1);
 assert.equal(report.blockers[0].path,'/players/$uid/extraField');
 assert.deepEqual(report.blockers[0].widens,['.validate']);
});

test('a live-only denied path without inherited access is only a review item',()=>{
 const live=structuredClone(candidate);
 live.unusedTopLevel={'.read':false,'.write':false};
 const report=compareRules(live,candidate);
 assert.deepEqual(report.blockers,[]);
 assert.ok(report.warnings.some(item=>item.path==='/unusedTopLevel'));
});

test('dropped validation under an open write is a blocker; dropped index is a review item',()=>{
 const live=structuredClone(candidate);
 live.leaderboards.$mode['.indexOn']=['wave','name'];
 const report=compareRules(live,candidate);
 assert.ok(report.warnings.some(item=>item.mode==='.indexOn'));
 const strict=structuredClone(candidate);delete strict.players.$uid.gender['.validate'];
 const blockers=compareRules(candidate,strict).blockers;
 assert.ok(blockers.some(item=>item.path==='/players/$uid/gender'&&item.mode==='.validate'));
});

test('changed rule text is reported for human review, never silently accepted',()=>{
 const live=structuredClone(candidate);live.players.$uid.xp['.validate']='true';
 const report=compareRules(live,candidate);
 const item=report.warnings.find(entry=>entry.path==='/players/$uid/xp'&&entry.mode==='.validate');
 assert.ok(item);assert.equal(item.live,'true');assert.match(item.candidate,/newData.isNumber/);
});

test('the CLI exits 0 without blockers and 1 with them, and never writes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'rules-dry-run-'));
 const clean=join(dir,'live.json'),risky=join(dir,'risky.json');
 await writeFile(clean,JSON.stringify({rules:candidate}));
 const riskyRules=structuredClone(candidate);
 delete riskyRules.players.$uid.gender['.validate'];
 riskyRules.players.$uid.soloWorkshopReceipts={'.read':'auth != null'};
 await writeFile(risky,JSON.stringify(riskyRules));
 const script=fileURLToPath(new URL('../scripts/rules-publish-dry-run.mjs',import.meta.url));
 const ok=await run(process.execPath,[script,clean,'--json']);const parsed=JSON.parse(ok.stdout);
 assert.deepEqual(parsed.blockers,[]);assert.equal(parsed.counts.live,parsed.counts.candidate);
 await assert.rejects(()=>run(process.execPath,[script,risky]),error=>error.code===1);
 const missing=await run(process.execPath,[script,join(dir,'absent.json')]).catch(error=>error);
 assert.equal(missing.code,2,'a missing export is a usage error, not a pass');
});

test('every complete draft in the repo is covered by the candidate',async()=>{
 const {compareRepoDrafts}=await import('../scripts/rules-publish-dry-run.mjs');
 const report=await compareRepoDrafts();
 assert.ok(report.drafts>=10,`expected the feature drafts to be checked, saw ${report.drafts}`);
 assert.deepEqual(report.missing,[],'publishing the candidate must not drop another shipped feature');
});
