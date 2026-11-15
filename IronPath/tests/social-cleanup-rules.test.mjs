import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {buildSocialCleanupCandidate,SOCIAL_SOURCE_SHA256} from '../firebase/social-cleanup-candidate.mjs';
import {createHash} from 'node:crypto';

test('the offline social candidate is pinned and changes only five reviewed rule expressions',async()=>{
 const bytes=await readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SOCIAL_SOURCE_SHA256);
 const original=JSON.parse(bytes),candidate=buildSocialCleanupCandidate(bytes),changed=[];
 const walk=(a,b,path='')=>{
  if(a&&b&&typeof a==='object'&&typeof b==='object'){
   assert.deepEqual(Object.keys(b).sort(),Object.keys(a).sort(),path);
   for(const key of Object.keys(a))walk(a[key],b[key],`${path}/${key}`);
  }else if(a!==b)changed.push(path);
 };
 walk(original,candidate);
 assert.deepEqual(changed.sort(),[
  '/rules/friendCodes/$code/.write',
  '/rules/friendOutgoing/$uid/$other/.write',
  '/rules/friendPresence/$uid/$connection/.write',
  '/rules/friendPrivate/$uid/code/.write',
  '/rules/friendPrivate/$uid/searchKey/.write'
 ].sort());
 assert.throws(()=>buildSocialCleanupCandidate(Buffer.concat([bytes,Buffer.from(' ')])),/reference changed/);
 assert.deepEqual(JSON.parse(bytes),original,'building a candidate does not change the reference file');
});
