import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {buildEndlessLastRunCandidate,applyEndlessLastRunRules,ENDLESS_LAST_RUN_VALIDATE} from '../firebase/endless-last-run-candidate.mjs';
import {createHash} from 'node:crypto';
import {buildSocialCleanupCandidate} from '../firebase/social-cleanup-candidate.mjs';

test('the endless last-run candidate only adds the profile field, on the reviewed base',async()=>{
 const bytes=await readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
 const base=buildSocialCleanupCandidate(bytes),candidate=buildEndlessLastRunCandidate(bytes);
 const added=[];
 const walk=(a,b,path='')=>{
  if(a&&b&&typeof a==='object'&&typeof b==='object'){
   for(const key of Object.keys(b)){
    if(!(key in a))added.push(`${path}/${key}`);
    else walk(a[key],b[key],`${path}/${key}`);
   }
   for(const key of Object.keys(a))assert.ok(key in b,`${path}/${key} must not disappear`);
  }else assert.equal(b,a,`${path} must not change`);
 };
 walk(base,candidate);
 assert.deepEqual(added,['/rules/players/$uid/endlessLastRun'],'the candidate adds exactly one field');
 const field=candidate.rules.players.$uid.endlessLastRun;
 assert.equal(field['.validate'],ENDLESS_LAST_RUN_VALIDATE);
 assert.match(field.waves['.validate'],/<= 100000/);
 assert.match(field.bosses['.validate'],/<= 20000/);
 assert.match(field.sector['.validate'],/<= 999/);
 assert.equal(field.$other['.validate'],false,'no extra keys ride inside the summary');
 assert.throws(()=>buildEndlessLastRunCandidate(Buffer.concat([bytes,Buffer.from(' ')])),/reference changed/,'a drifted base aborts the build');
});

test('the saved publish file is the saved live export plus exactly this field',async()=>{
 const liveBytes=await readFile(new URL('../firebase/live-rules-20261123.json',import.meta.url));
 const publishBytes=await readFile(new URL('../firebase/ENDLESS-LAST-RUN-TO-PUBLISH.json',import.meta.url));
 assert.equal(createHash('sha256').update(liveBytes).digest('hex'),'7a78078f643918c2120a791763073caf0fecf5e9f52f8355243fe0ffac69629e','live export snapshot is pinned');
 const live=JSON.parse(liveBytes),publish=JSON.parse(publishBytes);
 assert.equal(live.rules.players.$uid.endlessLastRun,undefined,'the live export predates the field');
 const rebuilt=JSON.parse(liveBytes);
 applyEndlessLastRunRules(rebuilt.rules);
 assert.deepEqual(publish,rebuilt,'the publish file is the live export with only endlessLastRun applied');
});
