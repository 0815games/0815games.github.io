import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {FEMALE_LOOKS,MALE_LOOKS,looksFor,AVATAR_STORAGE_KEY,defaultAvatar,encodeAvatar,decodeAvatar,resolveAvatar,storeAvatar,randomAvatar} from '../avatar.mjs';

// The layered combinations every legacy single-look id maps to on decode -
// the same table avatar.mjs carries, pinned here so an accidental change to
// the migration cannot silently re-face existing soldiers.
const EXPECTED_LEGACY={
  female:{crop:{faceId:'crop',hairId:null,beardId:null},bob:{faceId:'crop',hairId:'bob',beardId:null},
    ponytail:{faceId:'crop',hairId:'ponytail',beardId:null},bun:{faceId:'bun',hairId:null,beardId:null},
    long:{faceId:'crop',hairId:'long',beardId:null},braid:{faceId:'crop',hairId:'braid',beardId:null}},
  male:{buzz:{faceId:'buzz',hairId:null,beardId:null},short:{faceId:'buzz',hairId:'short',beardId:null},
    side:{faceId:'buzz',hairId:'side',beardId:null},medium:{faceId:'buzz',hairId:'medium',beardId:null},
    stubble:{faceId:'buzz',hairId:null,beardId:'stubble'},beard:{faceId:'buzz',hairId:null,beardId:'full'}},
};

test('the hairstyle sets are strictly separate per gender',()=>{
  assert.equal(FEMALE_LOOKS.length,6,'the female list carries its own hairstyles');
  assert.equal(MALE_LOOKS.length,6,'the male list carries its own hairstyles');
  assert.deepEqual(MALE_LOOKS.map(l=>l.id),['buzz','short','side','medium','stubble','beard'],'the male bearded looks are part of the hairstyle list');
  const femaleIds=FEMALE_LOOKS.map(l=>l.id),maleIds=MALE_LOOKS.map(l=>l.id);
  assert.ok(femaleIds.every(id=>!maleIds.includes(id)),'no hairstyle is shared between the lists');
  assert.deepEqual(looksFor('female'),FEMALE_LOOKS);
  assert.deepEqual(looksFor('male'),MALE_LOOKS);
  assert.deepEqual(looksFor('nonsense'),FEMALE_LOOKS,'an unknown gender reads as the female set');
  for(const look of [...FEMALE_LOOKS,...MALE_LOOKS]){
    assert.match(look.id,/^[a-z]+$/);
    assert.match(look.file,/^[fm]-[a-z]+\.jpg$/);
    assert.ok(look.name);
  }
});

test('encode and decode round-trip a layered combination',()=>{
  const cases=[
    defaultAvatar('female'),
    defaultAvatar('male'),
    {gender:'female',faceId:'slick',hairId:'braid',beardId:null},
    {gender:'male',faceId:'buzz',hairId:'side',beardId:'full'},
    {gender:'male',faceId:'short',hairId:null,beardId:'mustache'},
  ];
  for(const avatar of cases)
    assert.deepEqual(decodeAvatar(encodeAvatar(avatar),'male'),avatar,encodeAvatar(avatar));
  // Nulls are omitted, not written as "hair:null".
  assert.equal(encodeAvatar({gender:'male',faceId:'buzz',hairId:null,beardId:null}),'g:m|face:buzz');
  assert.equal(encodeAvatar({gender:'female',faceId:'crop',hairId:'bob',beardId:null}),'g:f|face:crop|hair:bob');
});

test('legacy single-look saves migrate to layered combinations on decode',()=>{
  for(const [gender,looks] of [['female',FEMALE_LOOKS],['male',MALE_LOOKS]])
    for(const look of looks){
      const migrated=decodeAvatar(`g:${gender[0]}|look:${look.id}`,gender);
      assert.deepEqual({gender:migrated.gender,faceId:migrated.faceId,hairId:migrated.hairId,beardId:migrated.beardId},
        {gender,...EXPECTED_LEGACY[gender][look.id]},look.id);
    }
  // The old bearded looks survive as beard choices, exactly as promised.
  assert.equal(decodeAvatar('g:m|look:stubble','male').beardId,'stubble');
  assert.equal(decodeAvatar('g:m|look:beard','male').beardId,'full');
  // A foreign look id never leaks across genders.
  assert.equal(decodeAvatar('g:f|look:buzz','female').hairId,null);
  assert.deepEqual(decodeAvatar('g:f|look:buzz','female'),defaultAvatar('female'));
});

test('decode falls back part by part, never throws',()=>{
  for(const garbage of [null,undefined,42,'','||||','g:f|hair:bob|y:9|z','nope',`g:f|${'hair:bob|'.repeat(9)}`])
    assert.doesNotThrow(()=>decodeAvatar(garbage,'male'));
  assert.deepEqual(decodeAvatar('g:x','female'),defaultAvatar('female'),'an unknown gender keeps the default');
  assert.deepEqual(decodeAvatar('g:m|s:2|h:long|c:1|e:0|b:full|x:scar','female'),defaultAvatar('male'),'legacy comic parts decode to the default');
});

test('the encoding stays inside the rules bounds',()=>{
  const longest=encodeAvatar({gender:'male',faceId:'buzz',hairId:'medium',beardId:'mustache'});
  assert.ok(longest.length<=64,`length ${longest.length}`);
  for(const gender of ['male','female'])
    for(const look of looksFor(gender)){
      const length=encodeAvatar({gender,look:0}).length;
      assert.ok(length>=8&&length<=64,`length ${length}`);
    }
});

test('resolveAvatar prefers the profile, then the mirror, then the default',()=>{
  const storage={store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=String(v);}};
  const profile={gender:'male'};
  assert.deepEqual(resolveAvatar(profile,storage),defaultAvatar('male'),'nothing stored: gender default');
  storeAvatar(storage,{...defaultAvatar('female'),hairId:'long'});
  assert.equal(resolveAvatar(profile,storage).hairId,'long','no profile field: the local mirror answers');
  const synced={...profile,avatar:encodeAvatar({...defaultAvatar('male'),hairId:'side',beardId:'full'})};
  assert.equal(resolveAvatar(synced,storage).beardId,'full','a profile field wins over the mirror');
  assert.equal(resolveAvatar(synced,null).hairId,'side','no storage is fine when the profile has the face');
  const locked={getItem(){throw new Error('blocked');}};
  assert.doesNotThrow(()=>resolveAvatar(profile,locked));
  assert.deepEqual(resolveAvatar({gender:'female'},locked),defaultAvatar('female'));
  // A legacy profile string migrates through resolveAvatar unchanged.
  assert.equal(resolveAvatar({gender:'female',avatar:'g:f|look:bob'},null).hairId,'bob');
});

test('storeAvatar writes the mirror and returns the encoding',()=>{
  const written={};
  const storage={setItem(k,v){written[k]=String(v);}};
  const face={...defaultAvatar('male'),hairId:'short'};
  const encoded=storeAvatar(storage,face);
  assert.equal(written[AVATAR_STORAGE_KEY],encoded);
  assert.equal(decodeAvatar(encoded,'male').hairId,'short');
  assert.doesNotThrow(()=>storeAvatar({setItem(){throw new Error('quota');}},face));
  assert.doesNotThrow(()=>storeAvatar(null,face));
});

test('randomAvatar rolls a valid combination within the chosen gender',()=>{
  let seed=7;
  const random=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  for(let i=0;i<200;i++){
    const gender=i%2?'male':'female';
    const face=randomAvatar(gender,random);
    assert.equal(face.gender,gender);
    assert.ok(typeof face.faceId==='string'&&face.faceId.length>0);
    assert.ok(face.hairId===null||typeof face.hairId==='string');
    assert.ok(face.beardId===null||typeof face.beardId==='string');
    if(gender==='female')assert.equal(face.beardId,null,'women never roll a beard');
  }
  // A deterministic deep roll lands on the last face/hair/beard of the list.
  const deep=randomAvatar('male',()=>0.999);
  assert.equal(deep.faceId,'short');
  assert.equal(deep.hairId,'medium');
  assert.equal(deep.beardId,'full');
  const deepFemale=randomAvatar('female',()=>0.999);
  assert.equal(deepFemale.faceId,'slick');
  assert.equal(deepFemale.hairId,'curly');
  assert.equal(deepFemale.beardId,null);
});
