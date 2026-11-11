import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {avatarPortrait,PORTRAIT_TOKEN} from '../avatar-art.mjs';
import {FEMALE_LOOKS,MALE_LOOKS,defaultAvatar,decodeAvatar} from '../avatar.mjs';

const assets=join(import.meta.dirname,'..','assets','portraits');

test('every look resolves to a rendered portrait file that exists',()=>{
  for(const [gender,looks] of [['female',FEMALE_LOOKS],['male',MALE_LOOKS]])
    for(const [index,look] of looks.entries()){
      const url=avatarPortrait({gender,look:index});
      assert.match(url,new RegExp(`^assets/portraits/${look.file}\\?v=${PORTRAIT_TOKEN}$`),look.id);
      assert.ok(existsSync(join(assets,look.file)),`${look.file} must exist on disk`);
    }
});

test('unknown avatars clamp to a real portrait, never a broken image',()=>{
  assert.equal(avatarPortrait(null),avatarPortrait(defaultAvatar('female')));
  assert.equal(avatarPortrait({gender:'male'}),avatarPortrait(defaultAvatar('male')));
  assert.equal(avatarPortrait({gender:'female',look:9999}),avatarPortrait({...defaultAvatar('female'),look:FEMALE_LOOKS.length-1}));
  assert.equal(avatarPortrait({gender:'male',look:-4}),avatarPortrait(defaultAvatar('male')));
  assert.equal(avatarPortrait(decodeAvatar('g:f|look:buzz','female')),avatarPortrait(defaultAvatar('female')),'a male look id on a female face clamps to her first portrait');
});
