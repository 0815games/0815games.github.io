import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {characterNameKey,normalizeCharacterName,validateCharacterName,sameCharacterName,CHARACTER_NAME_POLICY,CHARACTER_NAME_RESERVATION_GRACE_MS} from '../core/character-name.mjs';
import {createCharacterNameClaim} from '../core/character-name-claim.mjs';
import {createCharacterNameConflictHandler} from '../core/character-name-conflict.mjs';
import {friendNameKey} from '../core/friends.mjs';
import {buildCharacterNameCandidate,characterNameIndexRules} from '../firebase/character-name-candidate.mjs';
import {buildBlock2PublishCandidate,BLOCK9D_RULES_SHA256} from '../firebase/block2-publish-candidate.mjs';

const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');

// A tiny in-memory stand-in for the paths the claim module touches: enough to
// prove WHO wins a race, without an emulator and without a network.
//
// It also stands in for the RULES, and that is its limit: it mirrors the
// candidate, so it proves the client logic, not the rules. The rules
// themselves are proven in firebase/rules-test/character-name.test.mjs.
let player={uid:null};          // who is writing right now (auth.uid in rules)
function firebase(){
  const store=new Map();
  // Which accounts have a character. The real client CANNOT read this for
  // somebody else (`players/<uid>` is owner-readable only) - which is exactly
  // why the takeover decision has to sit in the rules.
  const players=new Set();
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
    players,
    deny,
    sdk:{
      ref:(db,path)=>({path}),
      get:async({path})=>snapshot(path),
      set:async({path},value)=>{store.set(path,value);},
      remove:async({path})=>{store.delete(path);},
      query:(ref)=>ref,
      orderByKey:()=>({}),
      limitToFirst:()=>({}),
      // Stands in for the rules: a write passes when the entry is free, when
      // it is ours, or when it is abandoned - owner gone AND older than the
      // grace window. It mirrors the candidate rules, so it proves the CLIENT
      // logic only; the rules themselves are proven in the emulator suite.
      runTransaction:async({path},update)=>{
        const uid=player.uid;
        const current=store.has(path)?store.get(path):null;
        const next=update(current);
        if(next===undefined)return {committed:false,snapshot:snapshot(path)};
        const abandoned=current&&typeof current.at==='number'
          &&Date.now()-current.at>=CHARACTER_NAME_RESERVATION_GRACE_MS&&!players.has(current.uid);
        if(current?.uid&&current.uid!==uid&&!abandoned)throw deny('permission_denied');
        store.set(path,next);
        return {committed:true,snapshot:snapshot(path)};
      },
    },
  };
}
// The stand-in needs to know WHO is writing, because the rules compare the
// entry's uid with auth.uid.
const session=uid=>{player.uid=uid;return {currentUser:{uid}};};
const claim=(fire,uid)=>{player.uid=uid;return createCharacterNameClaim({db:{},auth:{currentUser:{uid}},sdk:fire.sdk});};

test('the policy is versioned, so a stored key can always be traced to a rule',()=>{
  assert.match(CHARACTER_NAME_POLICY,/^[A-Z0-9_]+_V\d+$/);
  assert.equal(read('core/character-name.mjs').includes(CHARACTER_NAME_POLICY),true);
});

// The two engines that decide "same name" must agree. The shared fixture is the
// contract: change one engine without the other and this goes red.
test('the client comparison matches the shared fixtures cleanly under NFC_CASEFOLD_V2',()=>{
  assert.equal(CHARACTER_NAME_POLICY,'NFC_CASEFOLD_V2');
  const fixture=JSON.parse(read('firebase/name-policy-fixtures.json'));
  assert.equal(fixture.version,2);
  assert.match(fixture.note,/NFC_CASEFOLD_V2/);
  assert.ok(fixture.cases.length>=8);
  for(const entry of fixture.cases){
    const [first,...rest]=entry.names;
    for(const other of rest){
      const equal=normalizeCharacterName(first)===normalizeCharacterName(other);
      assert.equal(equal,entry.same,`"${first}" vs "${other}": ${entry.why}`);
      assert.equal(sameCharacterName(first,other),entry.same);
      assert.equal(entry.same,entry.casefoldSame,`no divergence in v2 for ${entry.names.join(' / ')}`);
    }
    assert.ok(entry.why,'every case says why it matters');
  }
});

test('names are stored as typed and compared by strict Unicode casefold key',()=>{
  assert.equal(validateCharacterName('  Alex  ').name,'Alex','the display name keeps its own spelling');
  assert.equal(friendNameKey('Alex'),characterNameKey('alex'),'search and reservation share one key');
  assert.equal(friendNameKey('Alex'),'616c6578','lowercase hex of the comparison form');
  assert.equal(characterNameKey('Straße'),characterNameKey('STRASSE'));
  assert.equal(characterNameKey('STRAẞE'),characterNameKey('strasse'));
  assert.equal(characterNameKey('ﬁn'),characterNameKey('FIN'));
  assert.equal(characterNameKey('ΜΑΡΚΟΣ'),characterNameKey('μαρκοσ'));
  // Hex keeps any Unicode out of the path, including things that would break it.
  for(const name of ['Ünïcode','Иван','Ａlex','Straße','a/b','a.b']){
    assert.match(characterNameKey(name),/^(?:[a-f0-9]{2}){1,96}$/,name);
  }
  for(const bad of ['', ' ', 'a', 'x'.repeat(25), 42, null, undefined, 'a'.repeat(97)])assert.equal(validateCharacterName(bad).ok,false,String(bad));
  // Lone surrogates would encode into a key that can never be typed again.
  assert.equal(validateCharacterName('a\ud800b').ok,false);
  // Display limits remain 2..24 UTF-16 code units even when casefolding expands length (e.g. 24 x 'ß' -> 48 's').
  assert.equal(validateCharacterName('ß'.repeat(24)).ok,true,'24-char expanding casefold stays valid');
  assert.equal(characterNameKey('ß'.repeat(24)).length,96,'48 folded ASCII chars = 96 hex chars <= 96 bytes');
  // The 96-byte guard checks encoded UTF-8 bytes after normalization, keeping 24 3-byte chars (72 bytes) valid.
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

// An entry whose owner never got a character (crashed enlistment, or a
// character deleted in another session) would block the name forever. Taking
// one over is allowed ONLY when both conditions hold: the owner has no
// character AND the entry is older than the grace window.
test('an abandoned reservation can be taken over, a live one never can',async()=>{
  const key=characterNameKey('Alex');
  const abandoned=at=>({uid:'ghost',name:'Alex',at});
  // Crashed enlistment long enough ago: the name is free again.
  {
   const fire=firebase();
   fire.store.set(`characterNames/${key}`,abandoned(Date.now()-CHARACTER_NAME_RESERVATION_GRACE_MS-1));
   const taken=await claim(fire,'bob').claim('Alex');
   assert.deepEqual(taken,{status:'claimed',key,reclaimed:true});
   assert.equal(fire.store.get(`characterNames/${key}`).uid,'bob');
   assert.equal(typeof fire.store.get(`characterNames/${key}`).at,'number','and it carries a fresh timestamp');
  }
  // The same entry one minute inside the window: an enlistment may still be
  // running, and stealing the name then would create the duplicate we prevent.
  {
   const fire=firebase();
   fire.store.set(`characterNames/${key}`,abandoned(Date.now()-CHARACTER_NAME_RESERVATION_GRACE_MS+60_000));
   assert.deepEqual(await claim(fire,'bob').claim('Alex'),{status:'taken',key,source:'index'});
   assert.equal(fire.store.get(`characterNames/${key}`).uid,'ghost');
  }
  // Old, but the owner still has a character: not abandoned, whatever the clock says.
  {
   const fire=firebase();
   fire.players.add('ghost');
   fire.store.set(`characterNames/${key}`,abandoned(Date.now()-CHARACTER_NAME_RESERVATION_GRACE_MS-1));
   assert.deepEqual(await claim(fire,'bob').claim('Alex'),{status:'taken',key,source:'index'});
  }
  // No usable timestamp: cannot be told from a running enlistment, so it stays.
  {
   const fire=firebase();
   fire.store.set(`characterNames/${key}`,{uid:'ghost',name:'Alex'});
   assert.deepEqual(await claim(fire,'bob').claim('Alex'),{status:'taken',key,source:'index'});
  }
});

// A transaction the rules refuse is phrased differently from a refused `set`.
// Miss that spelling and the refusal escapes as an exception instead of a
// message the player can act on.
test('both spellings of a refusal are recognized',async()=>{
  const fire=firebase();
  const spellings=[
   Object.assign(Error('permission_denied at /characterNames/x'),{code:'permission_denied'}),
   Object.assign(Error("Client doesn't have permission to access the desired data."),{code:'PERMISSION_DENIED'}),
   Object.assign(Error('PERMISSION_DENIED: Permission denied'),{code:'PERMISSION_DENIED'}),
  ];
  for(const error of spellings){
   const half={...fire.sdk,runTransaction:async()=>{throw error;}};
   assert.equal((await createCharacterNameClaim({db:{},auth:session('alice'),sdk:half}).claim('Alex')).status,'unsupported');
  }
  // An unrelated failure is still a failure: it must not be read as "taken".
  const broken={...fire.sdk,runTransaction:async()=>{throw Error('network down');}};
  await assert.rejects(()=>createCharacterNameClaim({db:{},auth:session('alice'),sdk:broken}).claim('Alex'),/network down/);
});

// The client cannot read another account's profile, so it must not guess: it
// attempts the write and reports what the server says. Both possible answers
// have to reach the player as the right message.
test('a takeover the server refuses is reported as taken, not as unsupported',async()=>{
  const key=characterNameKey('Alex'),fire=firebase();
  // The read works (the rules know the path) but every write is refused: the
  // entry belongs to a live account.
  fire.store.set(`characterNames/${key}`,{uid:'ghost',name:'Alex',at:Date.now()});
  const denied={...fire.sdk,runTransaction:async()=>{throw fire.deny('permission_denied');}};
  const result=await createCharacterNameClaim({db:{},auth:session('bob'),sdk:denied}).claim('Alex');
  assert.deepEqual(result,{status:'taken',key,source:'index'});
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
  const alice=createCharacterNameClaim({db:{},auth:session('alice'),sdk:half});
  assert.equal((await alice.claim('Alex')).status,'unsupported');
  assert.equal(fire.store.size,0);
});

test('a ruleset without the index degrades to a read-only check instead of blocking enlistment',async()=>{
  const fire=firebase();
  const denied={...fire.sdk,
   runTransaction:async()=>{throw fire.deny('permission_denied');},
   get:async({path})=>{if(path.startsWith('characterNames/'))throw fire.deny('permission_denied');return fire.sdk.get({path});}};
  const alice=createCharacterNameClaim({db:{},auth:session('alice'),sdk:denied});
  assert.equal((await alice.claim('Alex')).status,'unsupported','creation is not blocked');
  // An existing public listing still answers the question.
  fire.store.set(`friendNames/${characterNameKey('Alex')}`,{bob:{name:'Alex',code:'b'.repeat(32)}});
  assert.equal((await alice.claim('alex')).status,'taken');
  assert.equal((await alice.claim('Alexa')).status,'unsupported');
  // A release against rules without the index is a no-op, never a throw.
  assert.equal((await alice.release('Alex')).unsupported,true);
  // Synthetic browser-smoke runTransaction stubs that return uncommitted/null
  // without invoking the reducer callback must degrade to unsupported instead of taken.
  const noopStub={...fire.sdk,get:async()=>({val:()=>null}),runTransaction:async()=>({committed:false,snapshot:{val:()=>null}})};
  assert.equal((await createCharacterNameClaim({db:{},auth:session('alice'),sdk:noopStub}).claim('Alex')).status,'unsupported');
});

test('an account switch mid-flight is refused rather than reserving for the wrong soldier',async()=>{
  const fire=firebase();
  const stale=createCharacterNameClaim({db:{},auth:session('alice'),sdk:fire.sdk,isCurrent:()=>false});
  await assert.rejects(()=>stale.claim('Alex'),/Account changed/);
  assert.equal(fire.store.size,0);
  // A synchronous throw, not a rejected promise: assert.rejects would let it
  // escape instead of matching it.
  assert.throws(()=>createCharacterNameClaim({db:{},auth:{},sdk:fire.sdk}),/Invalid name reservation session/);
});

test('the reservation is wired into enlistment and released when the character is deleted',()=>{
  const account=read('account.js'),deletion=read('core/character-deletion.mjs'),candidate=read('firebase/character-name-candidate.mjs');
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
  // The publishable draft carries the index, built from the SAME code the
  // emulator suite tests - not a hand-edited copy that can drift from it.
  const publishable=JSON.parse(read('firebase/workshop.complete.draft.rules.json'));
  assert.deepEqual(publishable.rules.characterNames,characterNameIndexRules(),'the staged draft and the builder agree');
  // And nothing that was there before was dropped or rewritten on the way in.
  const before=JSON.parse(read('firebase/pre-block2.complete.draft.rules.json')).rules;
  for(const key of Object.keys(before))assert.ok(key in publishable.rules,`${key} survived the rebuild`);
  for(const node of ['friendOutgoing','friendPresence'])
   assert.equal(JSON.stringify(publishable.rules[node]),JSON.stringify(before[node]),`${node} is untouched`);
  // friendPrivate is one of the paths the rename deliberately touches: the
  // search key could only ever be written ONCE, so a renamed soldier could
  // never be published under their new name again. OR-ed, like the two below.
  const searchKey=publishable.rules.friendPrivate.$uid.searchKey['.write'],keyWas=before.friendPrivate.$uid.searchKey['.write'];
  assert.equal(searchKey,`(${keyWas}) || (auth != null && auth.uid === $uid && data.exists() && !root.child('friendNames').child(data.val()).child($uid).exists())`);
  assert.match(searchKey,/data\.exists\(\) && !root\.child\('friendNames'\)/,'the key only moves while no listing sits under the old one');
  assert.deepEqual(publishable.rules.friendPrivate.$uid.code,before.friendPrivate.$uid.code,'the code itself is untouched');
  // friendCodes is another: an entry can only be created today, never
  // refreshed, so a renamed soldier's code would advertise the old name
  // forever. The change is OR-ed onto the old rule, so nothing that was
  // allowed becomes forbidden.
  const codes=publishable.rules.friendCodes.$code['.write'],was=before.friendCodes.$code['.write'];
  assert.equal(codes,`(${was}) || (auth != null && $code.matches(/^[a-f0-9]{32}$/) && data.exists() && data.child('uid').val() === auth.uid && newData.child('uid').val() === auth.uid && newData.child('name').val() === root.child('players').child(auth.uid).child('name').val())`);
  assert.match(codes,/newData\.child\('name'\)\.val\(\) === root\.child\('players'\)/,'only ever to the owner’s own current name');
  const rules={rules:buildCharacterNameCandidate(read('firebase/WORKSHOP-RULES-TO-PUBLISH.json')).rules??buildCharacterNameCandidate(read('firebase/WORKSHOP-RULES-TO-PUBLISH.json'))};
  assert.ok(rules.rules.characterNames?.$key?.['.write'],'the candidate carries the index');
  // `hasChildren` only requires the listed children; without $other an entry may
  // carry arbitrary extra fields (the emulator accepted one before this rule).
  assert.equal(rules.rules.characterNames.$key.$other?.['.validate'],false,'no extra fields in a reservation');
  // `$other` matches every child NOT named here. Naming uid and name first is
  // what keeps `$other` from blocking the whole node - the emulator denied
  // every read and write when only the parent `.validate` mentioned them.
  for(const field of ['uid','name'])assert.ok(rules.rules.characterNames.$key[field],`${field} is a named node before \$other`);
  assert.equal(rules.rules.characterNames.$key['.validate'],"newData.hasChildren(['uid','name','at'])");
  assert.match(rules.rules.characterNames.$key['.read'],/\$key\.matches\(\/\^/,'the key regex is inlined into the rules, not left to the client');
  assert.doesNotMatch(rules.rules.characterNames.$key['.write'],/\(\?:/,'RE2 in rules: no non-capturing groups (see the emulator log of PR #293)');
  assert.ok(rules.rules.players,'and nothing else was dropped');
  // The emulator suite builds its rules the same way, so it tests what a
  // publication would actually deploy.
  const emulator=read('firebase/rules-test/character-name.test.mjs');
  assert.match(emulator,/buildBlock2RulesCandidate\(JSON.parse\(bytes\)\)/,'the emulator suite tests the composed candidate');
  assert.match(emulator,/pre-block2\.complete\.draft\.rules\.json/,'against the ruleset known before this change');
  assert.match(emulator,/CHARACTER_NAME_BASELINE/,'and it also runs against today’s ruleset');
  // The portrait half of the same publication is proven against the staged
  // artifact, not only against a standalone candidate.
  const portrait=read('firebase/rules-test/friend-portrait.test.mjs');
  assert.match(portrait,/FRIEND_PORTRAIT_STAGED/);
  assert.match(portrait,/workshop\.complete\.draft\.rules\.json/,'the staged draft is what gets tested');
});

// Every one of these reaches the player through message(), which runs
// translateText. A missing entry means a German player reads raw English.
test('the German client never sees an untranslated name error',()=>{
  const dictionaries=['i18n/localization-de.mjs','i18n/localization-account-de.mjs'].map(read).join('\n');
  // Dictionaries use single or double quotes depending on the string.
  const quoted=text=>`['"]${text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}['"]\s*:`;
  for(const text of [
    'That soldier name is already taken. Choose another one.',
    'That soldier name cannot be used. Choose another one.',
    'Soldier name must be 2–24 characters.',
    'Soldier name already in use',
    'Choose a different name from your current duplicate name.',
    'Checking availability and updating your soldier name…',
    'Could not update soldier name. Check your connection and try again.',
    'Soldier name updated. All progress and gear remain intact.',
  ])
    assert.match(dictionaries,new RegExp(quoted(text)),'German entry for: '+text);
});

test('block2-publish-candidate composes cleanly on BLOCK9D-RULES-TO-PUBLISH.json with MAINTENANCE_GATE preserved',()=>{
  const block9dText=read('firebase/BLOCK9D-RULES-TO-PUBLISH.json');
  const built=buildBlock2PublishCandidate(block9dText);
  const committed=JSON.parse(read('firebase/BLOCK2-RULES-TO-PUBLISH.json'));
  assert.deepEqual(built,committed,'BLOCK2-RULES-TO-PUBLISH.json matches block2-publish-candidate output');
  const base=JSON.parse(block9dText).rules;
  assert.equal(base.activeSessions!==undefined,true);
  assert.deepEqual(built.rules.activeSessions,base.activeSessions,'activeSessions rules preserved verbatim');
  assert.deepEqual(built.rules._ironpathMaintenance,base._ironpathMaintenance,'maintenance control rules preserved verbatim');
  assert.equal(built.rules.players.$uid.skills['.validate'],base.players.$uid.skills['.validate'],'block5 v2 skills schema preserved');
  assert.equal(built.rules.players.$uid.gender['.read'],base.players.$uid.gender['.read'],'gated friend gender read preserved');
  assert.equal(built.rules.players.$uid.avatar['.read'],base.players.$uid.avatar['.read'],'gated friend avatar read preserved');
  assert.match(built.rules.characterNames.$key['.read'],/_ironpathMaintenance/,'characterNames reads gated by maintenance');
  assert.match(built.rules.characterNames.$key['.write'],/_ironpathMaintenance/,'characterNames writes gated by maintenance');
  assert.ok(BLOCK9D_RULES_SHA256.length===64);
});

function createConflictDialogMock(){
  const makeEl=()=>({textContent:'',value:'',disabled:false,listeners:{},onclick:null,open:false,
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);},
    showModal(){this.open=true;},
    close(){this.open=false;},
    focus(){},
  });
  const elements={
    nameConflictDialog:makeEl(),
    nameConflictForm:makeEl(),
    nameConflictCurrentName:makeEl(),
    nameConflictInput:makeEl(),
    nameConflictStatus:makeEl(),
    nameConflictSubmit:makeEl(),
    nameConflictLogout:makeEl(),
  };
  return {
    elements,
    document:{getElementById:id=>elements[id]??null},
  };
}

test('legacy login conflict handler silently claims free names, blocks on duplicates without data loss, and never exposes a general rename control',async()=>{
  const fire=firebase();
  const mock=createConflictDialogMock();
  let reserved=0,renamedTo=null,beforeOpened=0,signedOut=0;
  let currentUid='bob';
  fire.players.add('alice');
  fire.players.add('bob');
  fire.store.set(`players/bob`,{name:'Alex',gender:'male',xp:4200,armory:'1;2',campaign:'m1'});
  fire.store.set(`characterNames/${characterNameKey('Alex')}`,{uid:'alice',name:'Alex',at:Date.now()});

  // Account with a free name (e.g. Charlie) backfills quietly without opening the modal.
  const freeFire=firebase();
  freeFire.players.add('charlie');
  const freeMock=createConflictDialogMock();
  const freeHandler=createCharacterNameConflictHandler({
    document:freeMock.document,db:{},auth:{currentUser:{uid:'charlie'}},sdk:freeFire.sdk,
    onReserved:()=>{reserved++;},
  });
  const freeRes=await freeHandler.reconcile('Charlie');
  assert.equal(freeRes.status,'claimed');
  assert.equal(reserved,1);
  assert.equal(freeMock.elements.nameConflictDialog.open,false);
  assert.equal(freeFire.store.get(`characterNames/${characterNameKey('Charlie')}`).uid,'charlie');

  // Legacy duplicate opens the modal, ignores Escape, refuses same/taken names, then renames atomically keeping XP/gear/campaign.
  player.uid='bob';
  const getAt=(path)=>{
    if(fire.store.has(path))return fire.store.get(path);
    const parts=path.split('/'),last=parts.pop(),parent=parts.join('/');
    if(fire.store.has(parent)&&fire.store.get(parent)&&typeof fire.store.get(parent)==='object')return fire.store.get(parent)[last]??null;
    return null;
  };
  const setAt=(path,value)=>{
    if(fire.store.has(path)||path.split('/').length<=2){fire.store.set(path,value);return;}
    const parts=path.split('/'),last=parts.pop(),parent=parts.join('/');
    if(fire.store.has(parent)&&fire.store.get(parent)&&typeof fire.store.get(parent)==='object'){fire.store.get(parent)[last]=value;return;}
    fire.store.set(path,value);
  };
  const renameSdk={
    ...fire.sdk,
    ref:(db,path)=>({path}),
    get:async({path})=>{const v=getAt(path);return {val:()=>v===null?null:JSON.parse(JSON.stringify(v))};},
    set:async({path},value)=>{setAt(path,value);},
    remove:async({path})=>{fire.store.delete(path);},
  };
  const handler=createCharacterNameConflictHandler({
    document:mock.document,
    db:{},
    auth:{get currentUser(){return {uid:currentUid};}},
    sdk:renameSdk,
    beforeOpen:()=>{beforeOpened++;},
    onReserved:()=>{reserved++;},
    onRenamed:name=>{renamedTo=name;},
    onSignOut:()=>{signedOut++;},
  });
  const takenRes=await handler.reconcile('Alex');
  assert.equal(takenRes.status,'taken');
  assert.equal(mock.elements.nameConflictDialog.open,true);
  assert.equal(handler.isActive(),true);
  assert.equal(beforeOpened,1);
  assert.equal(mock.elements.nameConflictCurrentName.textContent,'Alex');

  // Cancel / Escape is blocked while unresolved.
  let cancelled=false;
  for(const fn of mock.elements.nameConflictDialog.listeners.cancel||[])fn({preventDefault(){cancelled=true;}});
  assert.equal(cancelled,true);

  // Trying the same casefold-equivalent duplicate ("ALEX") is rejected locally.
  mock.elements.nameConflictInput.value='ALEX';
  for(const fn of mock.elements.nameConflictForm.listeners.submit||[])await fn({preventDefault(){}});
  assert.match(mock.elements.nameConflictStatus.textContent,/different name/i);
  assert.equal(mock.elements.nameConflictDialog.open,true);

  // Claiming a taken name fails cleanly without closing.
  fire.store.set(`characterNames/${characterNameKey('Viper')}`,{uid:'dave',name:'Viper',at:Date.now()});
  mock.elements.nameConflictInput.value='Viper';
  for(const fn of mock.elements.nameConflictForm.listeners.submit||[])await fn({preventDefault(){}});
  assert.match(mock.elements.nameConflictStatus.textContent,/already taken/i);
  assert.equal(mock.elements.nameConflictDialog.open,true);

  // Claiming a fresh unique name renames player record while keeping existing name index of Alice and all progress.
  mock.elements.nameConflictInput.value='AlexTwo';
  for(const fn of mock.elements.nameConflictForm.listeners.submit||[])await fn({preventDefault(){}});
  assert.equal(renamedTo,'AlexTwo');
  assert.equal(mock.elements.nameConflictDialog.open,false);
  assert.equal(handler.isActive(),false);
  assert.equal(fire.store.get('players/bob').name,'AlexTwo');
  assert.equal(fire.store.get(`characterNames/${characterNameKey('Alex')}`).uid,'alice','other owner reservation untouched');
  assert.equal(fire.store.get(`characterNames/${characterNameKey('AlexTwo')}`).uid,'bob');
  assert.equal(fire.store.get('players/bob').xp,4200);
  assert.equal(fire.store.get('players/bob').armory,'1;2');

  // Sign out triggers onSignOut; no general rename trigger exists in Soldier Dossier or Settings.
  mock.elements.nameConflictLogout.onclick();
  assert.equal(signedOut,1);
  const html=read('index.html');
  assert.doesNotMatch(html,/id="(?:soldier|settings)[^"]*Rename/i,'no public general rename button');
  assert.match(read('account.js'),/nameConflictHandler\.reconcile\(value\.name/, 'login silently reconciles and prompts on duplicate');
});
