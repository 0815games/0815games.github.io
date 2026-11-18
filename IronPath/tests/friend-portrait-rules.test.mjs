import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {buildSocialCleanupCandidate} from '../firebase/social-cleanup-candidate.mjs';
import {buildFriendPortraitCandidate,applyFriendPortraitRules,AVATAR_VALIDATE,FRIEND_READ} from '../firebase/friend-portrait-candidate.mjs';
import {encodeAvatar,defaultAvatar,randomAvatar} from '../avatar.mjs';

const reference=()=>readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
const playerOf=rules=>rules.players.$uid;

test('the offline portrait Rules candidate adds only two friend-scoped child reads',async()=>{
 const bytes=await reference();
 const baseline=buildSocialCleanupCandidate(bytes),candidate=buildFriendPortraitCandidate(bytes);
 const expected=structuredClone(baseline),shared=expected.rules.players.$uid.xp['.read'];
 expected.rules.players.$uid.avatar['.read']=shared;expected.rules.players.$uid.gender['.read']=shared;
 assert.deepEqual(candidate,expected,'no parent, write or unrelated permission changes');
 assert.throws(()=>buildFriendPortraitCandidate(Buffer.concat([bytes,Buffer.from(' ')])),/reference changed/);
});

// Reported (Block 4): "ein lokaler Speicher-Fallback ist kein Nachweis sicherer
// geräteübergreifender Speicherung". The face never reaches the server because
// the published rules have no `avatar` field at all - the catch-all refuses it,
// and account.js has to swallow the write. A ruleset in that shape is the one
// this candidate will be published against, so it has to learn the field.
test('a ruleset without the avatar field gets it, validated, instead of a refusal',async()=>{
 const base=buildSocialCleanupCandidate(await reference());
 delete base.rules.players.$uid.avatar;
 const before=structuredClone(base.rules);
 const rules=applyFriendPortraitRules(base.rules);
 assert.equal(playerOf(rules).avatar['.validate'],AVATAR_VALIDATE,'the pinned field validation is added');
 assert.equal(playerOf(rules).avatar['.read'],FRIEND_READ,'and the friend read with it');
 // Nothing else may move: creating the field is not a licence to touch anything
 // else, and a dropped rule here is invisible until players lose access.
 const expected=structuredClone(before);
 expected.players.$uid.avatar={'.validate':AVATAR_VALIDATE,'.read':FRIEND_READ};
 expected.players.$uid.gender['.read']=FRIEND_READ;
 assert.deepEqual(rules,expected);
});

test('the validation is the one every base already carries byte for byte',async()=>{
 const bytes=await reference();
 const pinned=JSON.parse(String(bytes)).rules.players.$uid.avatar['.validate'];
 assert.equal(AVATAR_VALIDATE,pinned,'the candidate cannot silently tighten or loosen the stored face');
 assert.equal(FRIEND_READ,JSON.parse(String(bytes)).rules.players.$uid.xp['.read'],
  'the friend condition has exactly one spelling');
 // The pre-Block-2 draft and the staged draft must agree, or a publication
 // built from one and reviewed against the other is a different ruleset.
 for(const file of ['pre-block2.complete.draft.rules.json','workshop.complete.draft.rules.json']){
  const draft=JSON.parse(await readFile(new URL('../firebase/'+file,import.meta.url),'utf8'));
  const rules=draft.rules??draft;
  assert.equal(rules.players.$uid.avatar['.validate'],AVATAR_VALIDATE,file+' carries the same avatar validation');
 }
});

test('a base that already carries a different avatar or friend rule is refused',async()=>{
 // Applying the block twice, or onto a hand-edited ruleset, must be loud:
 // publishing a ruleset nobody re-audited is the expensive kind of surprise.
 const bytes=await reference();
 const twice=buildSocialCleanupCandidate(bytes);
 applyFriendPortraitRules(twice.rules);
 assert.throws(()=>applyFriendPortraitRules(twice.rules),/reference changed/,'twice-applied is refused');
 const otherAvatar=buildSocialCleanupCandidate(bytes);
 otherAvatar.rules.players.$uid.avatar['.validate']='newData.isString()';
 assert.throws(()=>applyFriendPortraitRules(otherAvatar.rules),/reference changed/,'a different avatar rule is refused');
 const otherRead=buildSocialCleanupCandidate(bytes);
 otherRead.rules.players.$uid.xp['.read']='auth != null';
 assert.throws(()=>applyFriendPortraitRules(otherRead.rules),/reference changed/,'a looser or tighter friend rule is refused');
 const noGender=buildSocialCleanupCandidate(bytes);
 delete noGender.rules.players.$uid.gender;
 assert.throws(()=>applyFriendPortraitRules(noGender.rules),/reference changed/,'a ruleset without the gender field is refused');
 assert.throws(()=>applyFriendPortraitRules({}),/reference changed/,'so is one without players at all');
});

// The bound is a storage guard that must never reject a face the client can
// actually produce - otherwise the hand-over silently fails for real soldiers
// while every hand-written test string passes.
test('every face the client encodes fits inside the Rules bound',()=>{
 let seed=11;
 const random=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
 for(const gender of ['female','male']){
  for(const face of [defaultAvatar(gender),...Array.from({length:40},()=>randomAvatar(gender,random))]){
   const encoded=encodeAvatar(face);
   assert.ok(encoded.length>=8&&encoded.length<=64,'out of bounds: '+encoded);
   assert.ok(!/[^a-z0-9:|]/.test(encoded),'the stored face stays a plain bounded string: '+encoded);
  }
 }
});
