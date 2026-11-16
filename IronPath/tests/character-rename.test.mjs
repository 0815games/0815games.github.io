import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createCharacterRename} from '../character-rename.mjs';
import {characterNameKey} from '../character-name.mjs';
import {buildBlock2RulesCandidate} from '../firebase/block2-rules-candidate.mjs';

const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');

// A tiny in-memory stand-in. It records the multi-location update as one unit,
// because THAT is the point of the rename: the four places have to move in a
// single write or the rules cannot check that they agree.
function firebase({failUpdate=false,failReads=false}={}){
 const store=new Map(),updates=[];
 store.set('players/alice/name','Alice');
 store.set('friendPrivate/alice/searchKey',characterNameKey('Alice'));
 store.set('friendPrivate/alice/code','c'.repeat(32));
 const snapshot=path=>({val:()=>store.has(path)?JSON.parse(JSON.stringify(store.get(path))):null});
 const deny=message=>Object.assign(Error(message),{code:'PERMISSION_DENIED'});
 return {
  store,updates,deny,
  sdk:{
   ref:(db,path)=>path,
   get:async path=>{if(failReads)throw deny('permission_denied');return snapshot(path);},
   update:async(path,value)=>{if(failUpdate)throw deny('permission_denied');updates.push(value);
    for(const [key,next] of Object.entries(value)){if(next===null)store.delete(key);else store.set(key,next);}},
   query:(ref)=>ref,orderByKey:()=>({}),limitToFirst:()=>({}),
  },
 };
}
const rename=(fire,uid='alice')=>createCharacterRename({db:{},auth:{currentUser:{uid}},sdk:fire.sdk});

test('a rename moves profile, search listing, code and reservation in one write',async()=>{
 const fire=firebase();
 const result=await rename(fire).rename('Alicia');
 assert.equal(result.status,'renamed');
 assert.equal(result.previous,'Alice');
 assert.equal(fire.updates.length,1,'one multi-location update, not a sequence of writes');
 const [moved]=fire.updates;
 const key=characterNameKey('Alicia'),old=characterNameKey('Alice');
 assert.equal(moved[`players/alice/name`],'Alicia');
 assert.equal(moved[`friendPrivate/alice/searchKey`],key);
 assert.deepEqual(moved[`friendNames/${key}/alice`],{name:'Alicia',code:'c'.repeat(32)});
 assert.equal(moved[`friendNames/${old}/alice`],null,'the old listing goes in the same write');
 assert.equal(moved[`characterNames/${old}`],null,'and so does the old reservation');
 assert.equal(moved[`characterNames/${key}`].name,'Alicia');
 assert.equal(moved[`friendCodes/${'c'.repeat(32)}/name`],'Alicia','the code advertises the new name');
 assert.equal(fire.store.get('players/alice/name'),'Alicia');
 assert.equal(fire.store.has(`friendNames/${old}/alice`),false);
});

test('a rename into a name another account holds is refused before anything is written',async()=>{
 const fire=firebase();
 fire.store.set(`characterNames/${characterNameKey('Alicia')}`,{uid:'bob',name:'Alicia',at:Date.now()});
 const result=await rename(fire).rename('Alicia');
 assert.deepEqual(result,{status:'taken',key:characterNameKey('Alicia'),source:'index'});
 assert.equal(fire.updates.length,0,'nothing was written');
 assert.equal(fire.store.get('players/alice/name'),'Alice');
 // Case and padding are the same name: they collide too.
 fire.store.set(`characterNames/${characterNameKey('Bobby')}`,{uid:'bob',name:'Bobby',at:Date.now()});
 assert.equal((await rename(fire).rename('  BOBBY  ')).status,'taken');
 assert.equal(fire.updates.length,0);
});

// The deployed rules make the name immutable. Renaming anyway would be worse
// than refusing: it could land on a name we never checked.
test('rules that do not permit renaming leave everything untouched',async()=>{
 const fire=firebase({failUpdate:true});
 const result=await rename(fire).rename('Alicia');
 assert.equal(result.status,'unsupported');
 assert.equal(result.previous,'Alice');
 assert.equal(fire.store.get('players/alice/name'),'Alice');
 // A refusal is not an exception: the caller shows a message, it does not crash.
 const fire2=firebase({failReads:true});
 assert.equal((await rename(fire2).rename('Alicia')).status,'unsupported');
});

test('an unknown name reservation is not treated as a free one',async()=>{
 const fire=firebase();
 // The index read succeeds but gives no answer at all - a half-answer must not
 // be read as "free". The public listing is the only fallback.
 fire.store.set(`friendNames/${characterNameKey('Alicia')}`,{bob:{name:'Alicia',code:'b'.repeat(32)}});
 assert.deepEqual((await rename(fire).rename('Alicia')),{status:'taken',key:characterNameKey('Alicia'),source:'search'});
 assert.equal(fire.updates.length,0);
});

test('the same name, an invalid name and an account switch change nothing',async()=>{
 const fire=firebase();
 assert.equal((await rename(fire).rename('  alice  ')).status,'unchanged','same comparison key');
 assert.equal(fire.updates.length,0);
 for(const bad of ['',' ','a','x'.repeat(25),42,null])await assert.rejects(()=>rename(fire).rename(bad),/2–24/);
 assert.equal(fire.updates.length,0);
 const switched=createCharacterRename({db:{},auth:{currentUser:{uid:'alice'}},sdk:fire.sdk,isCurrent:()=>false});
 await assert.rejects(()=>switched.rename('Alicia'),/Account changed/);
 assert.equal(fire.updates.length,0);
});

test('an account without a friend code still renames cleanly',async()=>{
 const fire=firebase();
 fire.store.delete('friendPrivate/alice/code');
 const result=await rename(fire).rename('Alicia');
 assert.equal(result.status,'renamed');
 const [moved]=fire.updates;
 assert.equal(moved[`friendNames/${characterNameKey('Alicia')}/alice`].code,null,'no invented code');
 assert.ok(!Object.keys(moved).some(path=>path.startsWith('friendCodes/')),'and no code path is touched');
});

// The rules are what make the rename safe; this pins that they exist on the
// published candidate and stay OR-ed to what was there before.
test('the published candidate permits a rename only when the listing agrees',()=>{
 const before=JSON.parse(read('firebase/pre-block2.complete.draft.rules.json')).rules;
 const after=JSON.parse(read('firebase/workshop.complete.draft.rules.json')).rules;
 assert.notEqual(after.players.$uid.name['.validate'],before.players.$uid.name['.validate']);
 assert.ok(after.players.$uid.name['.validate'].startsWith(before.players.$uid.name['.validate'].slice(0,60)),
  'the old condition is still in there, OR-ed with the new one');
 assert.match(after.players.$uid.name['.validate'],/friendNames.*searchKey.*name.*=== newData\.val\(\)/,
  'a rename is only allowed when the listing under the current search key already shows the new name');
 // The code may be refreshed by its owner, to their own current name only.
 assert.match(after.friendCodes.$code['.write'],/data\.child\('uid'\)\.val\(\) === auth\.uid/);
 assert.match(after.friendCodes.$code['.write'],/newData\.child\('name'\)\.val\(\) === root\.child\('players'\)/);
 // And the builder produces exactly what is staged.
 const built=buildBlock2RulesCandidate(JSON.parse(read('firebase/pre-block2.complete.draft.rules.json')));
 assert.deepEqual(built,after,'the staged draft and the builder agree');
});
