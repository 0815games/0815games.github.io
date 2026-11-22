import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createAvatarSync} from '../core/avatar-sync.mjs';
import {encodeAvatar,decodeAvatar,AVATAR_STORAGE_KEY} from '../core/avatar.mjs';

function harness({profile=null,mirror=null,writes=true}={}){
  const calls=[],storage=new Map([[AVATAR_STORAGE_KEY,mirror]]);
  let version=1;
  const sync=createAvatarSync({
    write:async values=>{calls.push(values);if(!writes)throw Error('PERMISSION_DENIED');},
    storage:{getItem:key=>storage.has(key)?storage.get(key):null},
    session:()=>version
  });
  return {sync,calls,bump:()=>{version++;},version:()=>version,
    mirrorOf:()=>storage.get(AVATAR_STORAGE_KEY)??null};
}

test('a profile without a face receives the mirrored face migrated to v2 format',async()=>{
  const {sync,calls}=harness({mirror:'g:f|face:f2|hair:braid|color:auburn'});
  assert.equal(await sync.sync({name:'Alice',gender:'female',xp:0}),'written');
  assert.deepEqual(calls,[{avatar:'g:f|face:f2|hair:braid|color:auburn'}]);

  const legacy=harness({mirror:'g:f|face:bun|hair:braid'});
  assert.equal(await legacy.sync.sync({name:'Alice',gender:'female',xp:0}),'written');
  assert.deepEqual(legacy.calls,[{avatar:'g:f|face:f2|hair:braid'}],'legacy mirror migrates cleanly on handover');
});

test('without a mirror the gender default goes over',async()=>{
  const female=harness();
  assert.equal(await female.sync.sync({name:'Alice',gender:'female',xp:0}),'written');
  assert.deepEqual(female.calls,[{avatar:'g:f|face:f1|hair:crop'}]);
  const male=harness();
  await male.sync.sync({name:'Bob',gender:'male',xp:0});
  assert.deepEqual(male.calls,[{avatar:'g:m|face:m1|hair:buzz'}],'the male default');
});

test('a server value is the truth and is never overwritten',async()=>{
  const {sync,calls}=harness({mirror:'g:f|face:f1'});
  assert.equal(await sync.sync({name:'Alice',gender:'female',xp:0,avatar:'g:f|face:f3|hair:ponytail'}),'present');
  assert.equal(calls.length,0);
  assert.equal(await sync.sync({name:'Alice',gender:'female',xp:0,avatar:'g:f|face:f3|hair:ponytail'}),'skipped');
});

test('a face removed during the session is not quietly written back',async()=>{
  const {sync,calls,bump}=harness({mirror:'g:m|face:m6|hair:short'});
  assert.equal(await sync.sync({gender:'male',avatar:'g:m|face:m2|hair:short'}),'present');
  assert.equal(await sync.sync({gender:'male'}),'skipped');
  assert.equal(await sync.sync({gender:'male'}),'skipped');
  assert.equal(calls.length,0);
  bump();
  assert.equal(await sync.sync({gender:'male'}),'written');
  assert.deepEqual(calls,[{avatar:'g:m|face:m6|hair:short'}]);
});

test('one attempt per session - a refused ruleset is not asked twice a minute',async()=>{
  const {sync,calls,bump}=harness({mirror:'g:f|face:f1'});
  assert.equal(await sync.sync({gender:'female'}),'written');
  assert.equal(await sync.sync({gender:'female'}),'skipped');
  assert.equal(calls.length,1);
  bump();
  assert.equal(await sync.sync({gender:'female'}),'written');
  assert.equal(calls.length,2);
});

test('a refused write is not an error: the mirror keeps the face, the account stays healthy',async()=>{
  const {sync,calls,bump}=harness({mirror:'g:f|face:f1|hair:slick',writes:false});
  assert.equal(await sync.sync({name:'Alice',gender:'female',xp:0}),'refused');
  assert.equal(calls.length,1);
  assert.equal(await sync.sync({name:'Alice',gender:'female',xp:0}),'skipped');
  bump();
  assert.equal(await sync.sync({name:'Alice',gender:'female',xp:0}),'refused');
  assert.equal(calls.length,2);
});

test('a sign-out or a deleted character starts the next session clean',async()=>{
  const {sync,calls}=harness({mirror:'g:f|face:f1'});
  await sync.sync({gender:'female'});
  sync.reset();
  assert.equal(sync.synced(),null);
  assert.equal(await sync.sync({gender:'female'}),'written');
  assert.equal(calls.length,2);
});

test('no profile, no write - an account that is still loading is left alone',async()=>{
  const {sync,calls}=harness({mirror:'g:f|face:f1'});
  assert.equal(await sync.sync(null),'skipped');
  assert.equal(await sync.sync(undefined),'skipped');
  assert.equal(calls.length,0);
});

test('the handed-over value decodes back to the face that was mirrored',async()=>{
  const {sync,calls}=harness({mirror:'g:m|face:m6|beard:full|color:silver'});
  await sync.sync({gender:'male'});
  const decoded=decodeAvatar(calls[0].avatar,'male');
  assert.equal(decoded.gender,'male');
  assert.equal(decoded.faceId,'m6');
  assert.equal(decoded.hairId,null);
  assert.equal(decoded.beardId,'full');
  assert.equal(decoded.colorId,'silver');
});

test('the factory rejects a caller that cannot write or count sessions',()=>{
  for(const options of [undefined,null,{},{write:null},{write:()=>{},session:null},
    {write:()=>{},session:()=>0,encode:null},{write:()=>{},session:()=>0,resolve:null}])
    assert.throws(()=>createAvatarSync(options),/Invalid avatar sync/);
});

import {readFile} from 'node:fs/promises';
const accountSource=()=>readFile(new URL('../account.js',import.meta.url),'utf8');

test('account.js hands the face over on every profile load',async()=>{
  const source=await accountSource();
  const start=source.indexOf('function loadProfile(currentUser,version){');
  const end=source.indexOf('const account={',start);
  assert.ok(start>=0&&end>start,'loadProfile found in account.js');
  const body=source.slice(start,end);
  assert.match(body,/void avatarSync\.sync\(value\);/);
  assert.doesNotMatch(body,/if\(!value\.avatar\)void avatarSync\.sync/);
  assert.match(source,/const avatarSync=createAvatarSync\(\{[\s\S]*?session:\(\)=>sessionVersion\}\);/);
  assert.match(source,/import \{ createAvatarSync \} from '\.\/core\/avatar-sync\.mjs\?v=[^']+';/);
});

test('the hand-over never blocks a profile load',async()=>{
  const source=await accountSource();
  assert.match(source,/void avatarSync\.sync\(value\)/);
  assert.doesNotMatch(source,/await avatarSync\.sync\(value\)/);
});

test('a face that arrives during the session reaches the dossier too',async()=>{
  const source=await accountSource();
  const start=source.indexOf('function loadProfile(currentUser,version){');
  const end=source.indexOf('const account={',start);
  const body=source.slice(start,end);
  assert.match(body,/void refreshSoldierPortrait\(\);commandCenter\?\.render\(\);/);
  assert.match(source,/if\(portraitCache\.key===key\)return;/);
});
