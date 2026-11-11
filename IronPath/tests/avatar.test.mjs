import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {FEMALE_LOOKS,MALE_LOOKS,looksFor,AVATAR_STORAGE_KEY,defaultAvatar,encodeAvatar,decodeAvatar,resolveAvatar,storeAvatar,randomAvatar} from '../avatar.mjs';

test('the hairstyle sets are strictly separate per gender',()=>{
  assert.ok(FEMALE_LOOKS.length>=6,'the female list carries its own hairstyles');
  assert.ok(MALE_LOOKS.length>=4,'the male list carries its own hairstyles');
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

test('encode and decode round-trip a look',()=>{
  for(const [gender,looks] of [['female',FEMALE_LOOKS],['male',MALE_LOOKS]])
    for(const [index,look] of looks.entries()){
      const face={gender,look:index};
      assert.deepEqual(decodeAvatar(encodeAvatar(face)),face,look.id);
    }
  assert.deepEqual(decodeAvatar(encodeAvatar(defaultAvatar('female'))),defaultAvatar('female'));
});

test('decode falls back part by part, never throws',()=>{
  const base=decodeAvatar('g:x|look:mohawk','female');
  assert.equal(base.gender,'female','an unknown gender keeps the given default');
  assert.equal(base.look,0,'an unknown look falls back to the first of its gender');
  for(const garbage of [null,undefined,42,'','||||','g:f|look:bob|y:9|z','nope',`g:f|${'look:bob|'.repeat(9)}`])
    assert.doesNotThrow(()=>decodeAvatar(garbage,'male'));
  // A male look id never leaks into a female face and vice versa.
  assert.equal(decodeAvatar('g:f|look:buzz','female').look,0);
  assert.equal(decodeAvatar('g:m|look:bob','male').look,0);
  // Legacy comic faces (s/h/c/e/b/x parts) decode to the default look.
  const legacy=decodeAvatar('g:m|s:2|h:long|c:1|e:0|b:full|x:scar','female');
  assert.deepEqual(legacy,defaultAvatar('male'));
});

test('the encoding stays inside the rules bounds',()=>{
  for(const gender of ['male','female'])
    for(const [index] of looksFor(gender).entries()){
      const length=encodeAvatar({gender,look:index}).length;
      assert.ok(length>=8&&length<=64,`length ${length}`);
    }
});

test('resolveAvatar prefers the profile, then the mirror, then the default',()=>{
  const storage={store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=String(v);}};
  const profile={gender:'male'};
  assert.deepEqual(resolveAvatar(profile,storage),defaultAvatar('male'),'nothing stored: gender default');
  storeAvatar(storage,{...defaultAvatar('female'),look:4});
  assert.equal(resolveAvatar(profile,storage).look,4,'no profile field: the local mirror answers');
  const synced={...profile,avatar:encodeAvatar({...defaultAvatar('male'),look:2})};
  assert.equal(resolveAvatar(synced,storage).look,2,'a profile field wins over the mirror');
  assert.equal(resolveAvatar(synced,null).look,2,'no storage is fine when the profile has the face');
  const locked={getItem(){throw new Error('blocked');}};
  assert.doesNotThrow(()=>resolveAvatar(profile,locked));
  assert.deepEqual(resolveAvatar({gender:'female'},locked),defaultAvatar('female'));
});

test('storeAvatar writes the mirror and returns the encoding',()=>{
  const written={};
  const storage={setItem(k,v){written[k]=String(v);}};
  const face={...defaultAvatar('male'),look:1};
  const encoded=storeAvatar(storage,face);
  assert.equal(written[AVATAR_STORAGE_KEY],encoded);
  assert.equal(decodeAvatar(encoded,'male').look,1);
  assert.doesNotThrow(()=>storeAvatar({setItem(){throw new Error('quota');}},face));
  assert.doesNotThrow(()=>storeAvatar(null,face));
});

test('randomAvatar rolls a valid look within the chosen gender',()=>{
  let seed=7;
  const random=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  for(let i=0;i<200;i++){
    const gender=i%2?'male':'female';
    const face=randomAvatar(gender,random);
    assert.equal(face.gender,gender);
    assert.ok(Number.isInteger(face.look)&&face.look>=0&&face.look<looksFor(gender).length);
  }
});
