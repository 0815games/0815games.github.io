import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {buildEndlessLastRunCandidate,ENDLESS_LAST_RUN_VALIDATE} from '../firebase/endless-last-run-candidate.mjs';
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
