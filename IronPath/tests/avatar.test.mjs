import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {FEMALE_LOOKS,MALE_LOOKS,looksFor,AVATAR_STORAGE_KEY,DEFAULT_HAIR_COLOR,defaultAvatar,encodeAvatar,decodeAvatar,resolveAvatar,storeAvatar,randomAvatar} from '../core/avatar.mjs';

const EXPECTED_LEGACY_LOOKS={
  female:{crop:{faceId:'f1',hairId:'crop',beardId:null},bob:{faceId:'f1',hairId:'bob',beardId:null},
    ponytail:{faceId:'f1',hairId:'ponytail',beardId:null},bun:{faceId:'f2',hairId:'bun',beardId:null},
    long:{faceId:'f1',hairId:'long',beardId:null},braid:{faceId:'f1',hairId:'braid',beardId:null}},
  male:{buzz:{faceId:'m1',hairId:'buzz',beardId:null},short:{faceId:'m1',hairId:'short',beardId:null},
    side:{faceId:'m1',hairId:'side',beardId:null},medium:{faceId:'m1',hairId:'medium',beardId:null},
    stubble:{faceId:'m1',hairId:'buzz',beardId:'stubble'},beard:{faceId:'m1',hairId:'buzz',beardId:'full'}},
};

test('the legacy look lists stay separate per gender for decoding',()=>{
  assert.equal(FEMALE_LOOKS.length,6);
  assert.equal(MALE_LOOKS.length,6);
  assert.deepEqual(MALE_LOOKS.map(l=>l.id),['buzz','short','side','medium','stubble','beard']);
  const femaleIds=FEMALE_LOOKS.map(l=>l.id),maleIds=MALE_LOOKS.map(l=>l.id);
  assert.ok(femaleIds.every(id=>!maleIds.includes(id)));
  assert.deepEqual(looksFor('female'),FEMALE_LOOKS);
  assert.deepEqual(looksFor('male'),MALE_LOOKS);
  assert.deepEqual(looksFor('nonsense'),FEMALE_LOOKS);
});

test('encode and decode round-trip v2 avatars including bald, clean-shaven and all 5 colors',()=>{
  const cases=[
    defaultAvatar('female'),
    defaultAvatar('male'),
    {gender:'female',faceId:'f1',hairId:null,beardId:null,colorId:'brown'},
    {gender:'female',faceId:'f4',hairId:'braid',beardId:null,colorId:'auburn'},
    {gender:'male',faceId:'m3',hairId:'fade',beardId:'stubble',colorId:'black'},
    {gender:'male',faceId:'m6',hairId:'medium',beardId:'boxed',colorId:'silver'},
    {gender:'male',faceId:'m4',hairId:null,beardId:'mustache',colorId:'blonde'},
  ];
  for(const avatar of cases)
    assert.deepEqual(decodeAvatar(encodeAvatar(avatar),'male'),avatar,encodeAvatar(avatar));
  assert.equal(encodeAvatar({gender:'male',faceId:'m1',hairId:null,beardId:null,colorId:'brown'}),'g:m|face:m1');
  assert.equal(encodeAvatar({gender:'female',faceId:'f2',hairId:'bob',beardId:null,colorId:'auburn'}),'g:f|face:f2|hair:bob|color:auburn');
  assert.equal(encodeAvatar({gender:'female',faceId:'f1',hairId:'crop',beardId:'full',colorId:'brown'}),'g:f|face:f1|hair:crop','female avatars never serialize a beard');
});

test('legacy single-look and PR #313 face saves migrate cleanly onto new frontal heads',()=>{
  for(const [gender,looks] of [['female',FEMALE_LOOKS],['male',MALE_LOOKS]])
    for(const look of looks){
      const migrated=decodeAvatar(`g:${gender[0]}|look:${look.id}`,gender);
      assert.deepEqual(
        {gender:migrated.gender,faceId:migrated.faceId,hairId:migrated.hairId,beardId:migrated.beardId,colorId:migrated.colorId},
        {gender,...EXPECTED_LEGACY_LOOKS[gender][look.id],colorId:DEFAULT_HAIR_COLOR},
        look.id
      );
    }
  // PR #313 layered saves (old face ids like bun/beard/crop/stubble) map without ghosting
  assert.deepEqual(decodeAvatar('g:f|face:bun|hair:braid','female'),{gender:'female',faceId:'f2',hairId:'braid',beardId:null,colorId:'brown'});
  assert.deepEqual(decodeAvatar('g:f|face:bun','female'),{gender:'female',faceId:'f2',hairId:'bun',beardId:null,colorId:'brown'});
  assert.deepEqual(decodeAvatar('g:m|face:beard|hair:short','male'),{gender:'male',faceId:'m6',hairId:'short',beardId:'full',colorId:'brown'});
  assert.deepEqual(decodeAvatar('g:m|face:stubble','male'),{gender:'male',faceId:'m5',hairId:'short',beardId:'stubble',colorId:'brown'});
  assert.deepEqual(decodeAvatar('g:f|look:buzz','female'),defaultAvatar('female'));
});

test('decode falls back part by part, never throws',()=>{
  for(const garbage of [null,undefined,42,'','||||','g:f|hair:bob|y:9|z','nope',`g:f|${'hair:bob|'.repeat(9)}`])
    assert.doesNotThrow(()=>decodeAvatar(garbage,'male'));
  assert.deepEqual(decodeAvatar('g:x','female'),defaultAvatar('female'));
  assert.equal(decodeAvatar('g:f|face:f1|color:neon','female').colorId,'brown');
});

test('the encoding stays inside the RTDB 8..64 rules bounds for every max-length combo',()=>{
  const longest=encodeAvatar({gender:'male',faceId:'m6',hairId:'medium',beardId:'mustache',colorId:'auburn'});
  assert.ok(longest.length<=64,`length ${longest.length}`);
  const shortest=encodeAvatar({gender:'female',faceId:'f1',hairId:null,beardId:null,colorId:'brown'});
  assert.ok(shortest.length>=8&&shortest.length<=64,`length ${shortest.length}`);
});

test('resolveAvatar prefers the profile, then the mirror, then the default',()=>{
  const storage={store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=String(v);}};
  const profile={gender:'male'};
  assert.deepEqual(resolveAvatar(profile,storage),defaultAvatar('male'));
  storeAvatar(storage,{...defaultAvatar('female'),hairId:'long',colorId:'blonde'});
  const mirrored=resolveAvatar(profile,storage);
  assert.equal(mirrored.hairId,'long');
  assert.equal(mirrored.colorId,'blonde');
  const synced={...profile,avatar:encodeAvatar({...defaultAvatar('male'),faceId:'m4',hairId:'side',beardId:'full',colorId:'silver'})};
  assert.equal(resolveAvatar(synced,storage).beardId,'full');
  assert.equal(resolveAvatar(synced,storage).colorId,'silver');
  const locked={getItem(){throw new Error('blocked');}};
  assert.doesNotThrow(()=>resolveAvatar(profile,locked));
  assert.deepEqual(resolveAvatar({gender:'female'},locked),defaultAvatar('female'));
  assert.equal(resolveAvatar({gender:'female',avatar:'g:f|look:bob'},null).hairId,'bob');
});

test('storeAvatar writes the mirror and returns the encoding',()=>{
  const written={};
  const storage={setItem(k,v){written[k]=String(v);}};
  const face={...defaultAvatar('male'),hairId:'short',colorId:'auburn'};
  const encoded=storeAvatar(storage,face);
  assert.equal(written[AVATAR_STORAGE_KEY],encoded);
  assert.deepEqual(decodeAvatar(encoded,'male'),face);
  assert.doesNotThrow(()=>storeAvatar({setItem(){throw new Error('quota');}},face));
  assert.doesNotThrow(()=>storeAvatar(null,face));
});

test('randomAvatar rolls valid faces, hairs, beards and colors within the chosen gender',()=>{
  let seed=7;
  const random=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  for(let i=0;i<200;i++){
    const gender=i%2?'male':'female';
    const face=randomAvatar(gender,random);
    assert.equal(face.gender,gender);
    assert.ok(/^([fm])[1-6]$/.test(face.faceId));
    assert.ok(face.hairId===null||typeof face.hairId==='string');
    assert.ok(face.beardId===null||typeof face.beardId==='string');
    assert.ok(['black','brown','auburn','blonde','silver'].includes(face.colorId));
    if(gender==='female')assert.equal(face.beardId,null);
  }
  const deepMale=randomAvatar('male',()=>0.999);
  assert.equal(deepMale.faceId,'m6');
  assert.equal(deepMale.hairId,'mohawk');
  assert.equal(deepMale.beardId,'full');
  assert.equal(deepMale.colorId,'silver');
  const deepFemale=randomAvatar('female',()=>0.999);
  assert.equal(deepFemale.faceId,'f6');
  assert.equal(deepFemale.hairId,'curly');
  assert.equal(deepFemale.beardId,null);
  assert.equal(deepFemale.colorId,'silver');
});
