import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {SKIN_TONES,HAIR_COLORS,EYE_COLORS,HAIR_STYLES,BEARDS,EXTRAS,AVATAR_STORAGE_KEY,defaultAvatar,encodeAvatar,decodeAvatar,resolveAvatar,storeAvatar,randomAvatar} from '../avatar.mjs';

test('the face has a bounded option surface',()=>{
  assert.equal(SKIN_TONES.length,5);
  assert.equal(HAIR_COLORS.length,6);
  assert.equal(EYE_COLORS.length,5);
  assert.deepEqual([...HAIR_STYLES],['buzz','short','side','long','bun']);
  assert.deepEqual([...BEARDS],['none','stubble','mustache','full']);
  assert.deepEqual([...EXTRAS],['none','scar','earring','glasses']);
});

test('encode and decode round-trip every part',()=>{
  const face={gender:'male',skin:3,hair:'side',hairColor:4,eyes:1,beard:'full',extra:'scar'};
  assert.deepEqual(decodeAvatar(encodeAvatar(face),'female'),face);
  const her=defaultAvatar('female');
  assert.deepEqual(decodeAvatar(encodeAvatar(her)),her);
});

test('decode falls back part by part, never throws',()=>{
  const base=decodeAvatar('g:x|s:99|h:mohawk|c:-1|e:q|b:full|x:jetpack','female');
  assert.equal(base.gender,'female','an unknown gender keeps the given default');
  assert.equal(base.skin,1);
  assert.equal(base.hair,'short');
  assert.equal(base.hairColor,0);
  assert.equal(base.eyes,2);
  assert.equal(base.beard,'none','a female face ignores the beard part entirely');
  assert.equal(base.extra,'none');
  for(const garbage of [null,undefined,42,'','||||','g:f|s:1|h:long|c:1|e:0|b:none|x:none|y:9|z','nope'])
    assert.doesNotThrow(()=>decodeAvatar(garbage,'male'));
});

test('a beard survives only on a male face',()=>{
  const male=decodeAvatar('g:m|s:0|h:buzz|c:0|e:0|b:stubble|x:none','female');
  assert.equal(male.gender,'male');
  assert.equal(male.beard,'stubble');
  const female=decodeAvatar('g:f|s:0|h:buzz|c:0|e:0|b:stubble|x:none','male');
  assert.equal(female.gender,'female');
  assert.equal(female.beard,'none','the beard part is dropped, not applied');
});

test('the encoding stays inside the rules bounds',()=>{
  for(const gender of ['male','female'])
    for(const hair of HAIR_STYLES)
      for(const beard of BEARDS){
        const length=encodeAvatar({gender,skin:0,hair,hairColor:0,eyes:0,beard,extra:'none'}).length;
        assert.ok(length>=8&&length<=64,`length ${length}`);
      }
});

test('resolveAvatar prefers the profile, then the mirror, then the default',()=>{
  const storage={store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=String(v);}};
  const profile={gender:'male'};
  assert.deepEqual(resolveAvatar(profile,storage),defaultAvatar('male'),'nothing stored: gender default');
  storeAvatar(storage,{...defaultAvatar('female'),hair:'long',extra:'scar'});
  assert.equal(resolveAvatar(profile,storage).hair,'long','no profile field: the local mirror answers');
  const synced={...profile,avatar:encodeAvatar({...defaultAvatar('male'),hair:'bun'})};
  assert.equal(resolveAvatar(synced,storage).hair,'bun','a profile field wins over the mirror');
  assert.equal(resolveAvatar(synced,null).hair,'bun','no storage is fine when the profile has the face');
  const locked={getItem(){throw new Error('blocked');}};
  assert.doesNotThrow(()=>resolveAvatar(profile,locked));
  assert.deepEqual(resolveAvatar({gender:'female'},locked),defaultAvatar('female'));
});

test('storeAvatar writes the mirror and returns the encoding',()=>{
  const written={};
  const storage={setItem(k,v){written[k]=String(v);}};
  const face={...defaultAvatar('male'),beard:'mustache'};
  const encoded=storeAvatar(storage,face);
  assert.equal(written[AVATAR_STORAGE_KEY],encoded);
  assert.equal(decodeAvatar(encoded,'male').beard,'mustache');
  assert.doesNotThrow(()=>storeAvatar({setItem(){throw new Error('quota');}},face));
  assert.doesNotThrow(()=>storeAvatar(null,face));
});

test('randomAvatar rolls a valid face',()=>{
  let seed=7;
  const random=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  for(let i=0;i<200;i++){
    const gender=i%2?'male':'female';
    const face=randomAvatar(gender,random);
    assert.equal(face.gender,gender);
    assert.ok(face.skin>=0&&face.skin<SKIN_TONES.length);
    assert.ok(HAIR_STYLES.includes(face.hair));
    assert.ok(face.hairColor>=0&&face.hairColor<HAIR_COLORS.length);
    assert.ok(face.eyes>=0&&face.eyes<EYE_COLORS.length);
    assert.ok(BEARDS.includes(face.beard));
    assert.ok(EXTRAS.includes(face.extra));
    if(gender==='female')assert.equal(face.beard,'none');
  }
});
