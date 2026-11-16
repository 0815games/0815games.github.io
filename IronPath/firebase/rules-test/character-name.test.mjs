// Soldier name reservations, against the real Rules in the database emulator.
// Two runs: the default one uses the candidate that KNOWS the index; the
// `CHARACTER_NAME_BASELINE=1` run uses an older ruleset without it and proves
// that enlistment then degrades to a best-effort check instead of breaking.
import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,remove,runTransaction,query,orderByKey,limitToFirst} from 'firebase/database';
import {createCharacterNameClaim} from '../../character-name-claim.mjs';
import {characterNameKey} from '../../character-name.mjs';
import {buildCharacterNameCandidate} from '../character-name-candidate.mjs';

// Two runs against the PINNED owner reference (not a fresh export):
//   default                    - with the candidate index, which is what the
//                                rules would enforce after a separately
//                                authorized publication;
//   CHARACTER_NAME_BASELINE=1  - with exactly that reference, i.e. the ruleset
//                                as it stands today, which has no index. That
//                                run proves enlistment still works.
const baseline=process.env.CHARACTER_NAME_BASELINE==='1';
let env,alice,bob,anon;
const sdk={ref,set,get,remove,runTransaction,query,orderByKey,limitToFirst};
const claimService=(db,uid)=>createCharacterNameClaim({db,auth:{currentUser:{uid}},sdk});

before(async()=>{
 const bytes=await readFile(new URL('../WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url),'utf8');
 const rules=baseline?bytes:JSON.stringify(buildCharacterNameCandidate(bytes));
 env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules}});
 alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();anon=env.unauthenticatedContext().database();
});
beforeEach(async()=>{
 await env.clearDatabase();
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.database();
  for(const [id,name] of [['alice','Alice'],['bob','Bob']])await set(ref(db,`players/${id}`),{name,gender:'female',xp:0});
 });
});
after(async()=>env.cleanup());

test('exactly one account wins a name, and case or padding does not create a second one',async()=>{
 const key=characterNameKey('Alex'),alice$1=claimService(alice,'alice'),bob$1=claimService(bob,'bob');
 assert.equal((await alice$1.claim('Alex')).status,'claimed');
 assert.equal((await get(ref(alice,`characterNames/${key}`))).val().uid,'alice');
 for(const spelling of ['alex','ALEX','  Alex  '])assert.equal((await bob$1.claim(spelling)).status,'taken',`"${spelling}" is the same name`);
 // A different name is still free for the second account.
 assert.equal((await bob$1.claim('Bobby')).status,'claimed');
 assert.equal((await get(ref(bob,`characterNames/${characterNameKey('Bobby')}`))).val().uid,'bob');
 // Re-claiming your own name is not "taken" - a retry after a lost response
 // must not tell the player their own name is gone.
 assert.equal((await alice$1.claim('Alex')).status,'claimed');
});

test('only the owner releases a name, and a released name becomes free',async()=>{
 const key=characterNameKey('Alex'),alice$1=claimService(alice,'alice'),bob$1=claimService(bob,'bob');
 await alice$1.claim('Alex');
 assert.equal((await bob$1.release('Alex')).released,false,'another account cannot free it');
 await assertFails(remove(ref(bob,`characterNames/${key}`)));
 assert.equal((await bob$1.claim('Alex')).status,'taken');
 assert.deepEqual(await alice$1.release('Alex'),{released:true,key});
 assert.equal((await bob$1.claim('Alex')).status,'claimed','freed names can be taken again');
});

test('the rules refuse forged, mis-shaped and anonymous reservations',{skip:baseline},async()=>{
 const key=characterNameKey('Alex');
 await assertFails(set(ref(anon,`characterNames/${key}`),{uid:'alice',name:'Alex'}));
 await assertFails(get(ref(anon,`characterNames/${key}`)));
 await assertFails(set(ref(bob,`characterNames/${key}`),{uid:'alice',name:'Alex'}));
 await assertFails(set(ref(alice,`characterNames/${key}`),{uid:'alice'}));                       // no name
 await assertFails(set(ref(alice,`characterNames/${key}`),{uid:'alice',name:'A'}));              // too short
 await assertFails(set(ref(alice,`characterNames/${key}`),{uid:'alice',name:'A'.repeat(25)}));   // too long
 await assertFails(set(ref(alice,`characterNames/${key}`),{uid:'alice',name:'Alex',xp:0}));      // no extra fields
 await assertFails(set(ref(alice,'characterNames/not-hex'),{uid:'alice',name:'Alex'}));
 await assertFails(set(ref(alice,'characterNames/'+'../escape'),{uid:'alice',name:'Alex'}));
 await assertSucceeds(set(ref(alice,`characterNames/${key}`),{uid:'alice',name:'Alex'}));
 // The owner may refresh their own entry, but never take another account's.
 await assertSucceeds(set(ref(alice,`characterNames/${key}`),{uid:'alice',name:'Alex'}));
 await assertFails(set(ref(bob,`characterNames/${key}`),{uid:'bob',name:'Alex'}));
});

// The ruleset currently in production has no `characterNames` path. Enlistment
// must not start failing because of that: the module reports `unsupported`,
// falls back to the public search index when it can, and otherwise stays quiet.
test('without the index rules the reservation degrades instead of blocking enlistment',{skip:!baseline,timeout:20000},async()=>{
 const key=characterNameKey('Alex'),alice$1=claimService(alice,'alice'),bob$1=claimService(bob,'bob');
 assert.equal((await alice$1.claim('Alex')).status,'unsupported');
 await env.withSecurityRulesDisabled(async ctx=>{
  // A listing published by another account is visible to everyone.
  await set(ref(ctx.database(),`friendNames/${key}/bob`),{name:'Alex',code:'b'.repeat(32)});
 });
 assert.equal((await alice$1.claim('Alex')).status,'taken','a visible listing still answers the question');
 assert.equal((await alice$1.claim('Alice')).status,'unsupported','an unknown name is not silently promised');
 // Releasing against rules without the index is a no-op, not a failure.
 assert.equal((await bob$1.release('Alex')).unsupported,true);
});
