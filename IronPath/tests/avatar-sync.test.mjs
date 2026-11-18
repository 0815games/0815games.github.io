import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createAvatarSync} from '../avatar-sync.mjs';
import {encodeAvatar,decodeAvatar,AVATAR_STORAGE_KEY} from '../avatar.mjs';

// The face is handed over to the server once per session - and the handover must
// never break an account, never overwrite a newer face, and never loop.

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

test('a profile without a face receives the one this device shows',async()=>{
  const {sync,calls}=harness({mirror:'g:f|face:bun|hair:braid'});
  assert.equal(await sync.sync({name:'Alice',gender:'female',xp:0}),'written');
  assert.deepEqual(calls,[{avatar:'g:f|face:bun|hair:braid'}],'the mirrored face is handed over, not a default');
});

test('without a mirror the gender default goes over - the face on screen is never a lie',async()=>{
  const female=harness();
  assert.equal(await female.sync.sync({name:'Alice',gender:'female',xp:0}),'written');
  assert.deepEqual(female.calls,[{avatar:encodeAvatar({gender:'female',faceId:'crop',hairId:null,beardId:null})}]);
  const male=harness();
  await male.sync.sync({name:'Bob',gender:'male',xp:0});
  assert.deepEqual(male.calls,[{avatar:'g:m|face:buzz'}],'the male default');
});

test('a server value is the truth and is never overwritten',async()=>{
  // Another device may have chosen a newer face this session does not know.
  const {sync,calls}=harness({mirror:'g:f|face:crop'});
  assert.equal(await sync.sync({name:'Alice',gender:'female',xp:0,avatar:'g:f|face:ponytail'}),'present');
  assert.equal(calls.length,0,'nothing is written');
  // ... and it stays the truth for the rest of the session.
  assert.equal(await sync.sync({name:'Alice',gender:'female',xp:0,avatar:'g:f|face:ponytail'}),'skipped');
});

test('one attempt per session - a refused ruleset is not asked twice a minute',async()=>{
  const {sync,calls,bump}=harness({mirror:'g:f|face:crop'});
  assert.equal(await sync.sync({gender:'female'}),'written');
  assert.equal(await sync.sync({gender:'female'}),'skipped','a second call in the same session does nothing');
  assert.equal(calls.length,1);
  bump();
  assert.equal(await sync.sync({gender:'female'}),'written','a new session tries again');
  assert.equal(calls.length,2);
});

test('a refused write is not an error: the mirror keeps the face, the account stays healthy',async()=>{
  // This is the state TODAY: the published rules have no avatar field, so every
  // write is denied. Not one of them may surface to the player.
  const {sync,calls,bump}=harness({mirror:'g:f|face:slick',writes:false});
  assert.equal(await sync.sync({name:'Alice',gender:'female',xp:0}),'refused');
  assert.equal(calls.length,1,'it tried');
  // The session is spent; the next sign-in tries once more, not in a loop.
  assert.equal(await sync.sync({name:'Alice',gender:'female',xp:0}),'skipped');
  bump();
  assert.equal(await sync.sync({name:'Alice',gender:'female',xp:0}),'refused');
  assert.equal(calls.length,2);
});

test('a sign-out or a deleted character starts the next session clean',async()=>{
  const {sync,calls}=harness({mirror:'g:f|face:crop'});
  await sync.sync({gender:'female'});
  sync.reset();
  assert.equal(sync.synced(),null,'the session marker is gone');
  assert.equal(await sync.sync({gender:'female'}),'written','and the next load hands the face over again');
  assert.equal(calls.length,2);
});

test('no profile, no write - an account that is still loading is left alone',async()=>{
  const {sync,calls}=harness({mirror:'g:f|face:crop'});
  assert.equal(await sync.sync(null),'skipped');
  assert.equal(await sync.sync(undefined),'skipped');
  assert.equal(calls.length,0);
});

test('the handed-over value decodes back to the face that was mirrored',async()=>{
  const {sync,calls}=harness({mirror:'g:m|face:beard|hair:null|beard:full'});
  await sync.sync({gender:'male'});
  const decoded=decodeAvatar(calls[0].avatar,'male');
  assert.equal(decoded.gender,'male');
  assert.equal(decoded.faceId,'beard','a face that only the legacy mapping could reach is now storable');
});

test('the factory rejects a caller that cannot write or count sessions',()=>{
  for(const options of [undefined,null,{},{write:null},{write:()=>{},session:null},
    {write:()=>{},session:()=>0,encode:null},{write:()=>{},session:()=>0,resolve:null}])
    assert.throws(()=>createAvatarSync(options),/Invalid avatar sync/);
});

// ── Wiring contract ────────────────────────────────────────────────────────
// account.js cannot be imported outside a browser (Firebase SDK, auth,
// window), so - like the campaign save contract - the hand-over is pinned on
// source level: a soldier who enlisted before the avatar field existed only
// gets their face onto the server if the profile load really calls the sync.
import {readFile} from 'node:fs/promises';

const accountSource=()=>readFile(new URL('../account.js',import.meta.url),'utf8');

test('account.js hands the face over on every profile load',async()=>{
  const source=await accountSource();
  const start=source.indexOf('function loadProfile(currentUser,version){');
  const end=source.indexOf('const account={',start);
  assert.ok(start>=0&&end>start,'loadProfile found in account.js');
  const body=source.slice(start,end);
  assert.match(body,/if\(!value\.avatar\)void avatarSync\.sync\(value\);/,
    'a profile without a server-side face is handed over, the same way a missing service date is stamped');
  assert.match(source,/const avatarSync=createAvatarSync\(\{[\s\S]*?session:\(\)=>sessionVersion\}\);/,
    'the sync is bound to the session counter, so a sign-out or a new sign-in gets its own attempt');
  assert.match(source,/import \{ createAvatarSync \} from '\.\/avatar-sync\.mjs\?v=[^']+';/,
    'the module is imported with its own cache token');
});

test('the hand-over never blocks a profile load',async()=>{
  const source=await accountSource();
  // A rejected write is the normal state until the rules are published; an
  // unhandled rejection there would break the whole account listener.
  assert.match(source,/void avatarSync\.sync\(value\)/,'fire and forget - a refused write stays silent');
  assert.doesNotMatch(source,/await avatarSync\.sync\(value\)/,'the profile listener is not held up by it');
});

test('a face that arrives during the session reaches the dossier too',async()=>{
  const source=await accountSource();
  const start=source.indexOf('function loadProfile(currentUser,version){');
  const end=source.indexOf('const account={',start);
  const body=source.slice(start,end);
  // The hand-over above writes the field; the profile listener then delivers
  // it. Without this the dossier would keep the old frame until a reload.
  assert.match(body,/void refreshSoldierPortrait\(\);commandCenter\?\.render\(\);/,
    'every later profile snapshot recomposes the portrait, not just the first one');
  assert.match(source,/if\(portraitCache\.key===key\)return;/,
    'the recomposition is skipped when the encoded face did not change');
});
