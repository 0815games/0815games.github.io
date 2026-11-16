import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {characterNameKey,normalizeCharacterName,validateCharacterName,sameCharacterName,CHARACTER_NAME_POLICY} from '../character-name.mjs';
import {createCharacterNameClaim} from '../character-name-claim.mjs';
import {friendNameKey} from '../friends.mjs';
import {buildCharacterNameCandidate} from '../firebase/character-name-candidate.mjs';

const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');

// A tiny in-memory stand-in for the paths the claim module touches: enough to
// prove WHO wins a race, without an emulator and without a network.
function firebase(){
  const store=new Map();
  const snapshot=path=>({val:()=>{
    if(!store.has(path))return null;
    const value=store.get(path);
    if(value===null)return null;
    // Firebase hands back plain clones, never the stored object itself.
    return JSON.parse(JSON.stringify(value));
  }});
  const deny=message=>Object.assign(Error(message),{code:'PERMISSION_DENIED'});
  return {
    store,
    deny,
    sdk:{
      ref:(db,path)=>({path}),
      get:async({path})=>snapshot(path),
      set:async({path},value)=>{store.set(path,value);},
      remove:async({path})=>{store.delete(path);},
      query:(ref)=>ref,
      orderByKey:()=>({}),
      limitToFirst:()=>({}),
      runTransaction:async({path},update)=>{
        const current=store.has(path)?store.get(path):null;
        const next=update(current);
        if(next===undefined)return {committed:false,snapshot:snapshot(path)};
        store.set(path,next);
        return {committed:true,snapshot:snapshot(path)};
      },
    },
  };
}
const claim=(fire,uid)=>createCharacterNameClaim({db:{},auth:{currentUser:{uid}},sdk:fire.sdk});

test('the policy is versioned, so a stored key can always be traced to a rule',()=>{
  assert.match(CHARACTER_NAME_POLICY,/^[A-Z0-9_]+_V\d+$/);
  assert.equal(read('character-name.mjs').includes(CHARACTER_NAME_POLICY),true);
});

// The two engines that decide "same name" must agree. The shared fixture is the
// contract: change one engine without the other and this goes red.
test('the client comparison matches the shared fixtures, including the known divergence',()=>{
  const fixture=JSON.parse(read('firebase/name-policy-fixtures.json'));
  assert.equal(fixture.version,1);
  assert.ok(fixture.cases.length>=6);
  for(const entry of fixture.cases){
    const [first,...rest]=entry.names;
    for(const other of rest){
      const equal=normalizeCharacterName(first)===normalizeCharacterName(other);
      assert.equal(equal,entry.same,`"${first}" vs "${other}": ${entry.why}`);
      assert.equal(sameCharacterName(first,other),entry.same);
    }
    assert.ok(entry.why,'every case says why it matters');
  }
  // The one place the stricter audit disagrees with the game is documented,
  // not accidental: `Straße`/`STRASSE`.
  const divergence=fixture.cases.filter(entry=>entry.same!==entry.casefoldSame);
  assert.equal(divergence.length,1,'exactly one documented difference');
  assert.deepEqual(divergence[0].names,['Straße','STRASSE']);
  assert.match(divergence[0].why,/case folding/i);
});

test('names are stored as typed and compared by the normalized key',()=>{
  assert.equal(validateCharacterName('  Alex  ').name,'Alex','the display name keeps its own spelling');
  assert.equal(friendNameKey('Alex'),characterNameKey('alex'),'search and reservation share one key');
  assert.equal(friendNameKey('Alex'),'616c6578','lowercase hex of the comparison form');
  // Hex keeps any Unicode out of the path, including things that would break it.
  for(const name of ['Ünïcode','Иван','Ａlex','a/b','a.b']){
    assert.match(characterNameKey(name),/^(?:[a-f0-9]{2}){1,96}$/,name);
  }
  for(const bad of ['', ' ', 'a', 'x'.repeat(25), 42, null, undefined, 'a'.repeat(97)])assert.equal(validateCharacterName(bad).ok,false,String(bad));
  // Lone surrogates would encode into a key that can never be typed again.
  assert.equal(validateCharacterName('a\ud800b').ok,false);
  // The 96-byte guard is a backstop: within the 24-character bound a name can
  // hold at most 3 UTF-8 bytes per UTF-16 unit, so 72 bytes is the real ceiling.
  assert.equal(characterNameKey('ꀀ'.repeat(24)).length,144,'24 three-byte characters stay inside the key');
});

test('two accounts racing for one name leave exactly one winner',async()=>{
  const fire=firebase(),alice=claim(fire,'alice'),bob=claim(fire,'bob');
  assert.equal((await alice.claim('Alex')).status,'claimed');
  const lost=await bob.claim('alex');
  assert.equal(lost.status,'taken');
  assert.equal(fire.store.get(`characterNames/${characterNameKey('Alex')}`).uid,'alice','the loser wrote nothing');
  assert.equal((await bob.claim('Bobby')).status,'claimed');
  // A retry by the owner after a lost response is not a conflict.
  assert.equal((await alice.claim('Alex')).status,'claimed');
  assert.equal((await alice.claim('ALEX')).status,'claimed');
});

test('only the owner can free a name, and a failed enlistment does not squat it',async()=>{
  const fire=firebase(),alice=claim(fire,'alice'),bob=claim(fire,'bob');
  await alice.claim('Alex');
  assert.deepEqual(await bob.release('Alex'),{released:false});
  assert.equal(fire.store.has(`characterNames/${characterNameKey('Alex')}`),true);
  assert.deepEqual(await alice.release('Alex'),{released:true,key:characterNameKey('Alex')});
  assert.equal((await bob.claim('Alex')).status,'claimed','freed names are reusable');
  // Releasing twice is harmless.
  assert.deepEqual(await alice.release('Alex'),{released:false});
});

test('a refused transaction is reported, not retried until the player gives up',async()=>{
  const fire=firebase();
  // The read is allowed (rules published) but the write is not: a stale or
  // restricted ruleset must still not hang the enlistment.
  const half={...fire.sdk,runTransaction:async()=>{throw fire.deny('permission_denied');}};
  const alice=createCharacterNameClaim({db:{},auth:{currentUser:{uid:'alice'}},sdk:half});
  assert.equal((await alice.claim('Alex')).status,'unsupported');
  assert.equal(fire.store.size,0);
});

test('a ruleset without the index degrades to a read-only check instead of blocking enlistment',async()=>{
  const fire=firebase();
  const denied={...fire.sdk,
   runTransaction:async()=>{throw fire.deny('permission_denied');},
   get:async({path})=>{if(path.startsWith('characterNames/'))throw fire.deny('permission_denied');return fire.sdk.get({path});}};
  const alice=createCharacterNameClaim({db:{},auth:{currentUser:{uid:'alice'}},sdk:denied});
  assert.equal((await alice.claim('Alex')).status,'unsupported','creation is not blocked');
  // An existing public listing still answers the question.
  fire.store.set(`friendNames/${characterNameKey('Alex')}`,{bob:{name:'Alex',code:'b'.repeat(32)}});
  assert.equal((await alice.claim('alex')).status,'taken');
  assert.equal((await alice.claim('Alexa')).status,'unsupported');
  // A release against rules without the index is a no-op, never a throw.
  assert.equal((await alice.release('Alex')).unsupported,true);
});

test('an account switch mid-flight is refused rather than reserving for the wrong soldier',async()=>{
  const fire=firebase();
  const session=createCharacterNameClaim({db:{},auth:{currentUser:{uid:'alice'}},sdk:fire.sdk,isCurrent:()=>false});
  await assert.rejects(()=>session.claim('Alex'),/Account changed/);
  assert.equal(fire.store.size,0);
  // A synchronous throw, not a rejected promise: assert.rejects would let it
  // escape instead of matching it.
  assert.throws(()=>createCharacterNameClaim({db:{},auth:{},sdk:fire.sdk}),/Invalid name reservation session/);
});

test('the reservation is wired into enlistment and released when the character is deleted',()=>{
  const account=read('account.js'),deletion=read('character-deletion.mjs'),candidate=read('firebase/character-name-candidate.mjs');
  // Claim BEFORE the profile, release when the profile never appears.
  const claimed=account.indexOf('claim.claim(name)'),profile=account.indexOf('runTransaction(ref(db,`players/${currentUser.uid}`)');
  assert.ok(claimed>0&&claimed<profile,'the name is reserved before the profile is written');
  assert.match(account,/claim\.release\(name\)/,'a failed enlistment gives the name back');
  assert.match(account,/reserved\.status==='taken'/,`a taken name stops the enlistment`);
  assert.match(account,/That soldier name is already taken\. Choose another one\./);
  // Deletion only asks for the release when this session actually reserved one,
  // so the published rules (which have no such path) cannot break deletion.
  assert.match(account,/if\(nameReserved\)try\{releaseNameKey=characterNameKey\(currentName\)/);
  assert.match(deletion,/drop\(`characterNames\/\$\{releaseNameKey\}`\)/);
  assert.match(deletion,/releaseNameKey!==null/,'the release stays opt-in');
  // The candidate is built from the pinned reference and adds one path only.
  // It is NOT staged into the publishable candidate: like the portrait rules it
  // stays a builder until its publication is authorized on its own.
  assert.match(candidate,/buildSocialCleanupCandidate\(bytes\)/);
  assert.match(candidate,/characterNames/);
  const publishable=JSON.parse(read('firebase/workshop.complete.draft.rules.json'));
  assert.equal(publishable.rules.characterNames,undefined,'the index is not staged for publication yet');
  const rules=buildCharacterNameCandidate(read('firebase/WORKSHOP-RULES-TO-PUBLISH.json'));
  assert.ok(rules.rules.characterNames?.$key?.['.write'],'the candidate carries the index');
  // `hasChildren` only requires the listed children; without $other an entry may
  // carry arbitrary extra fields (the emulator accepted one before this rule).
  assert.equal(rules.rules.characterNames.$key.$other?.['.validate'],false,'no extra fields in a reservation');
  assert.match(rules.rules.characterNames.$key['.read'],/\$key\.matches\(\/\^/,'the key regex is inlined into the rules, not left to the client');
  assert.doesNotMatch(rules.rules.characterNames.$key['.write'],/\(\?:/,'RE2 in rules: no non-capturing groups (see the emulator log of PR #293)');
  assert.ok(rules.rules.players,'and nothing else was dropped');
  // The emulator suite builds its rules the same way, so it tests what a
  // publication would actually deploy.
  const emulator=read('firebase/rules-test/character-name.test.mjs');
  assert.match(emulator,/buildCharacterNameCandidate\(bytes\)/);
  assert.match(emulator,/CHARACTER_NAME_BASELINE/,'and it also runs against today’s ruleset');
});

// Every one of these reaches the player through message(), which runs
// translateText. A missing entry means a German player reads raw English.
test('the German client never sees an untranslated name error',()=>{
  const dictionaries=['localization-de.mjs','localization-account-de.mjs'].map(read).join('\n');
  // Dictionaries use single or double quotes depending on the string.
  const quoted=text=>`['"]${text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}['"]\s*:`;
  for(const text of ['That soldier name is already taken. Choose another one.','That soldier name cannot be used. Choose another one.','Soldier name must be 2–24 characters.'])
    assert.match(dictionaries,new RegExp(quoted(text)),'German entry for: '+text);
});
