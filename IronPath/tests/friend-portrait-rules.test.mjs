import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {buildSocialCleanupCandidate} from '../firebase/social-cleanup-candidate.mjs';
import {buildFriendPortraitCandidate} from '../firebase/friend-portrait-candidate.mjs';

test('the offline portrait Rules candidate adds only two friend-scoped child reads',async()=>{
 const bytes=await readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
 const baseline=buildSocialCleanupCandidate(bytes),candidate=buildFriendPortraitCandidate(bytes);
 const expected=structuredClone(baseline),shared=expected.rules.players.$uid.xp['.read'];
 expected.rules.players.$uid.avatar['.read']=shared;expected.rules.players.$uid.gender['.read']=shared;
 assert.deepEqual(candidate,expected,'no parent, write or unrelated permission changes');
 assert.throws(()=>buildFriendPortraitCandidate(Buffer.concat([bytes,Buffer.from(' ')])),/reference changed/);
});
