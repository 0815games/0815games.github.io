import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createCharacterRename} from '../core/character-rename.mjs';
import {characterNameKey} from '../core/character-name.mjs';
import {buildBlock2RulesCandidate} from '../firebase/block2-rules-candidate.mjs';

const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const CODE='c'.repeat(32);
const ALICE=characterNameKey('Alice'),ALICIA=characterNameKey('Alicia'),BOBBY=characterNameKey('Bobby');

// A small in-memory stand-in that behaves like the deployed Rules where it
// matters: an index entry owned by another account cannot be written, and a
// refused write leaves the data alone. It also records the ORDER of the
// writes, because the order is the safety argument - see character-rename.mjs.
function firebase({deny=()=>false}={}){
 const store={
  players:{alice:{name:'Alice',gender:'female',xp:0}},
  friendPrivate:{alice:{searchKey:ALICE,code:CODE}},
  friendNames:{[ALICE]:{alice:{name:'Alice',code:CODE}}},
  friendCodes:{[CODE]:{uid:'alice',name:'Alice'}},
  // The reservation a soldier holds for their own name since enlisting.
  characterNames:{[ALICE]:{uid:'alice',name:'Alice',at:1}},
 };
 const ops=[];
 const err=()=>Object.assign(Error("Client doesn't have permission to access the desired data."),{code:'PERMISSION_DENIED'});
 const seg=path=>String(path).split('/').filter(Boolean);
 const peek=path=>seg(path).reduce((node,part)=>node==null?undefined:node[part],store);
 const clone=value=>value===undefined?null:JSON.parse(JSON.stringify(value));
 const put=(path,value)=>{
  const parts=seg(path),last=parts.pop();let node=store;
  for(const part of parts){if(typeof node[part]!=='object'||node[part]===null)node[part]={};node=node[part];}
  if(value===undefined||value===null)delete node[last];else node[last]=value;
 };
 const snapshot=path=>({val:()=>clone(peek(path))});
 const guard=(op,path)=>{if(deny(op,path))throw err();ops.push([op,path]);};
 return {
  store,ops,
  // The writes in the order they happened, as "op path".
  writes:()=>ops.filter(([op])=>op!=='get').map(([op,path])=>`${op} ${path}`),
  at:path=>clone(peek(path)),
  sdk:{
   ref:(db,path)=>path,
   get:async path=>{guard('get',path);return snapshot(path);},
   set:async(path,value)=>{guard('set',path);put(path,value);},
   remove:async path=>{guard('remove',path);put(path,null);},
   runTransaction:async(path,update)=>{
    guard('tx',path);
    const next=update(clone(peek(path)));
    if(next===undefined)return {committed:false,snapshot:snapshot(path)};
    const existing=peek(path);
    // What the index Rules do: an entry held by another account stays.
    if(existing?.uid&&next?.uid&&existing.uid!==next.uid)throw err();
    put(path,next);ops.push(['wrote',path,next]);
    return {committed:true,snapshot:snapshot(path)};
   },
   query:path=>path,orderByKey:()=>({}),limitToFirst:()=>({}),
  },
 };
}
const rename=(fire,overrides={})=>createCharacterRename({db:{},auth:{currentUser:{uid:'alice'}},sdk:fire.sdk,...overrides});

test('a rename reserves the new name first, unlists, renames, then publishes again',async()=>{
 const fire=firebase();
 const result=await rename(fire).rename('Alicia');
 assert.equal(result.status,'renamed');
 assert.equal(result.previous,'Alice');
 assert.equal(result.republished,true);
 const order=fire.writes();
 assert.ok(order.includes(`tx characterNames/${ALICIA}`),'the new name is reserved');
 assert.ok(order.indexOf(`tx characterNames/${ALICIA}`)<order.indexOf('set players/alice/name'),
  'reserved before the name changes');
 assert.ok(order.indexOf(`remove friendNames/${ALICE}/alice`)<order.indexOf('set players/alice/name'),
  'the old listing is gone before the name changes');
 assert.ok(order.indexOf('set players/alice/name')<order.indexOf(`set friendNames/${ALICIA}/alice`),
  'and the soldier is published again afterwards');
 assert.ok(order.indexOf('set players/alice/name')<order.indexOf(`remove characterNames/${ALICE}`),
  'the old name is only released once the profile has moved');
 // The end state a player and their friends actually see.
 assert.equal(fire.at('players/alice/name'),'Alicia');
 assert.equal(fire.at('friendPrivate/alice/searchKey'),ALICIA);
 assert.deepEqual(fire.at(`friendNames/${ALICIA}/alice`),{name:'Alicia',code:CODE});
 assert.equal(fire.at(`friendNames/${ALICE}/alice`),null,'gone from the old listing');
 assert.equal(fire.at(`characterNames/${ALICE}`),null,'the old name is free again');
 assert.equal(fire.at(`characterNames/${ALICIA}`).uid,'alice');
 assert.deepEqual(fire.at(`friendCodes/${CODE}`),{uid:'alice',name:'Alicia'},'the code follows the soldier');
});

test('a name another account holds is refused before anything moves',async()=>{
 const fire=firebase();
 fire.store.characterNames={[BOBBY]:{uid:'bob',name:'Bobby',at:Date.now()}};
 for(const spelling of ['Bobby','  BOBBY  ']){
  const result=await rename(fire).rename(spelling);
  assert.deepEqual(result,{status:'taken',key:BOBBY,source:'index'});
 }
 assert.deepEqual(fire.writes(),[`tx characterNames/${BOBBY}`,`tx characterNames/${BOBBY}`],
  'the only writes attempted are the two refused reservations');
 assert.equal(fire.at('players/alice/name'),'Alice');
 assert.deepEqual(fire.at(`friendNames/${ALICE}/alice`),{name:'Alice',code:CODE},'still published');
 assert.equal(fire.at(`characterNames/${BOBBY}`).uid,'bob');
});

// Today's rules make the name immutable. Renaming anyway would be worse than
// refusing: it could land on a name nobody checked.
test('rules that refuse the rename put the soldier back and give the new name back',async()=>{
 const fire=firebase({deny:(op,path)=>op==='set'&&path==='players/alice/name'});
 const result=await rename(fire).rename('Alicia');
 assert.equal(result.status,'unsupported');
 assert.equal(result.previous,'Alice');
 assert.equal(fire.at('players/alice/name'),'Alice');
 assert.deepEqual(fire.at(`friendNames/${ALICE}/alice`),{name:'Alice',code:CODE},'republished, not left unfindable');
 assert.equal(fire.at(`characterNames/${ALICIA}`),null,'the new name was given back');
 assert.equal(fire.at(`characterNames/${ALICE}`).uid,'alice','and the old reservation stays');
 // A refusal is not an exception: the caller shows a message, it does not crash.
 const quiet=firebase({deny:(op,path)=>op==='tx'&&path===`characterNames/${ALICIA}`});
 assert.equal((await rename(quiet).rename('Alicia')).status,'unsupported','no index, no rename');
 assert.deepEqual(quiet.writes(),[]);
});

test('a half-finished rename says so instead of pretending it worked',async()=>{
 // The name moved, but republishing was refused: honest answer, and the next
 // account load finishes it (friends.mjs publishes on load).
 const fire=firebase({deny:(op,path)=>op==='set'&&path==='friendPrivate/alice/searchKey'});
 const result=await rename(fire).rename('Alicia');
 assert.equal(result.status,'renamed');
 assert.equal(result.republished,false);
 assert.match(String(result.note),/\S/,'the caller gets the reason, not a silent success');
 assert.equal(fire.at('players/alice/name'),'Alicia');
});

test('the same name, an invalid name and an account switch change nothing',async()=>{
 const fire=firebase();
 assert.equal((await rename(fire).rename('  alice  ')).status,'unchanged','same comparison key');
 assert.deepEqual(fire.writes(),[]);
 for(const bad of ['',' ','a','x'.repeat(25),42,null])await assert.rejects(()=>rename(fire).rename(bad),/2–24/);
 assert.deepEqual(fire.writes(),[]);
 const switched=rename(fire,{isCurrent:()=>false});
 await assert.rejects(()=>switched.rename('Alicia'),/Account changed/);
 assert.deepEqual(fire.writes(),[]);
});

test('an account that was never published can still rename',async()=>{
 const fire=firebase();
 delete fire.store.friendPrivate.alice.searchKey;
 delete fire.store.friendNames[ALICE];
 const result=await rename(fire).rename('Alicia');
 assert.equal(result.status,'renamed');
 assert.equal(fire.at('friendPrivate/alice/searchKey'),ALICIA);
 assert.deepEqual(fire.at(`friendNames/${ALICIA}/alice`),{name:'Alicia',code:CODE});
 assert.ok(!fire.writes().some(entry=>entry.startsWith(`remove friendNames/${ALICE}`)),'nothing to unlist');
});

// The rules are what make the rename safe; this pins that they exist on the
// published candidate and stay OR-ed to what was there before.
test('the published candidate only allows a rename while the soldier is not listed',()=>{
 const before=JSON.parse(read('firebase/pre-block2.complete.draft.rules.json')).rules;
 const after=JSON.parse(read('firebase/workshop.complete.draft.rules.json')).rules;
 // 1. The name: the old condition is still in there, OR-ed with the new one.
 assert.notEqual(after.players.$uid.name['.validate'],before.players.$uid.name['.validate']);
 assert.ok(after.players.$uid.name['.validate'].startsWith(before.players.$uid.name['.validate'].slice(0,60)));
 assert.match(after.players.$uid.name['.validate'],/friendNames.*searchKey.*\$uid.*exists\(\)/,
  'a rename is only allowed while no listing contradicts the new name');
 // 2. The search key has to be able to follow the name, or the soldier could
 //    never be found again. The first-write rule stays as it is.
 assert.ok(after.friendPrivate.$uid.searchKey['.write'].startsWith(`(${before.friendPrivate.$uid.searchKey['.write']})`));
 assert.match(after.friendPrivate.$uid.searchKey['.write'],/data\.exists\(\) && !root\.child\('friendNames'\)\.child\(data\.val\(\)\)/,
  'the key may only move while no listing sits under the old one');
 // 3. The code may be refreshed by its owner, to their own current name only.
 assert.ok(after.friendCodes.$code['.write'].startsWith(`(${before.friendCodes.$code['.write']})`));
 assert.match(after.friendCodes.$code['.write'],/data\.child\('uid'\)\.val\(\) === auth\.uid/);
 assert.match(after.friendCodes.$code['.write'],/newData\.child\('name'\)\.val\(\) === root\.child\('players'\)/);
 // And the builder produces exactly what is staged.
 const built=buildBlock2RulesCandidate(JSON.parse(read('firebase/pre-block2.complete.draft.rules.json')));
 assert.deepEqual(built,after,'the staged draft and the builder agree');
});
