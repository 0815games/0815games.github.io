// Soldier name reservations, against the real Rules in the database emulator.
// Two runs: the default one uses the candidate that KNOWS the index; the
// `CHARACTER_NAME_BASELINE=1` run uses an older ruleset without it and proves
// that enlistment then degrades to a best-effort check instead of breaking.
//
// Everything here writes a line to stdout before it asserts. The emulator is
// the only place these rules are exercised, the log is the only evidence it
// produces, and a bare "permission denied" says nothing about WHICH rule or
// WHICH direction (read vs. write vs. transaction) refused.
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
const log=(...parts)=>console.log('[character-name]',...parts);
const report=(label,value)=>{log(label+':',JSON.stringify(value));return value;};

let env,alice,bob,anon;
const sdk={ref,set,get,remove,runTransaction,query,orderByKey,limitToFirst};
const claimService=(db,uid)=>createCharacterNameClaim({db,auth:{currentUser:{uid}},sdk});

// Run an operation and describe what came back instead of only whether it
// threw. `permission denied` from a ruleset that is not loaded yet looks
// exactly like `permission denied` from a rule that refuses the write.
async function probe(label,operation){
 try{const value=await operation();log(`ok   ${label}`);return {ok:true,value};}
 catch(error){
  log(`DENY ${label} -> code=${String(error?.code)} message=${String(error?.message)}`);
  return {ok:false,error};
 }
}

before(async()=>{
 const bytes=await readFile(new URL('../WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url),'utf8');
 const rules=baseline?bytes:JSON.stringify(buildCharacterNameCandidate(bytes));
 env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules}});
 alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();anon=env.unauthenticatedContext().database();

 // The emulator answers requests before the uploaded rules are in effect, and
 // an unanswered ruleset denies everything. Wait for a read that BOTH
 // rulesets permit (`players/$uid` is readable by its owner in either), then
 // note how long that took - a slow warm-up is a fact about the harness, not
 // about the rules under test.
 const started=Date.now();
 for(let attempt=1;;attempt++){
  const result=await probe(`warm-up read of players/alice (attempt ${attempt})`,()=>get(ref(alice,'players/alice/name')));
  if(result.ok){log(`rules in effect after ${attempt} attempt(s), ${Date.now()-started} ms`);break;}
  if(attempt>=60)throw Error('the emulator never accepted the rules');
  await new Promise(done=>setTimeout(done,500));
 }
 // What the ruleset under test thinks of the index path, once, up front.
 log('index path readable by its owner:',JSON.stringify((await probe('read characterNames/<key> as alice',()=>get(ref(alice,`characterNames/${characterNameKey('Alex')}`)))).ok));
 log('index path readable by an anonymous client:',JSON.stringify((await probe('read characterNames/<key> as anon',()=>get(ref(anon,`characterNames/${characterNameKey('Alex')}`)))).ok));
});

beforeEach(async()=>{
 await env.clearDatabase();
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.database();
  for(const [id,name] of [['alice','Alice'],['bob','Bob']])await set(ref(db,`players/${id}`),{name,gender:'female',xp:0});
 });
});
after(async()=>env.cleanup());

// Isolated, so a refusal here says "the rules are wrong" and not "the claim
// module is wrong".
test('the ruleset under test is the one we think it is',async()=>{
 const key=characterNameKey('Alex');
 const read=await probe('read characterNames/<key> as alice',()=>get(ref(alice,`characterNames/${key}`)));
 const write=await probe('write {uid:alice,name:Alex} as alice',()=>set(ref(alice,`characterNames/${key}`),{uid:'alice',name:'Alex'}));
 const tx=await probe('transaction as alice',()=>runTransaction(ref(alice,`characterNames/${characterNameKey('Bobby')}`),current=>current==null?{uid:'alice',name:'Bobby'}:undefined,{applyLocally:false}));
 if(baseline){
  assert.equal(read.ok,false,'the baseline ruleset has no index, so even a read is refused');
  assert.equal(write.ok,false);
  assert.equal(tx.ok,false);
 }else{
  // A ruleset that blocks everything makes every assertFails below pass for
  // the wrong reason. These three are the positive proof.
  assert.equal(read.ok,true,'the candidate rules let an account read the index');
  assert.equal(write.ok,true,'the candidate rules let an account reserve a free name');
  assert.equal((await get(ref(alice,`characterNames/${key}`))).val().uid,'alice');
  assert.equal(tx.ok,true,'the candidate rules let an account claim through a transaction');
 }
});

test('exactly one account wins a name, and case or padding does not create a second one',{skip:baseline},async()=>{
 const key=characterNameKey('Alex'),alice$1=claimService(alice,'alice'),bob$1=claimService(bob,'bob');
 assert.equal(report('alice claims Alex',await alice$1.claim('Alex')).status,'claimed');
 assert.equal((await get(ref(alice,`characterNames/${key}`))).val().uid,'alice');
 for(const spelling of ['alex','ALEX','  Alex  '])
  assert.equal(report(`bob claims ${JSON.stringify(spelling)}`,await bob$1.claim(spelling)).status,'taken',`${JSON.stringify(spelling)} is the same name`);
 // A different name is still free for the second account.
 assert.equal(report('bob claims Bobby',await bob$1.claim('Bobby')).status,'claimed');
 assert.equal((await get(ref(bob,`characterNames/${characterNameKey('Bobby')}`))).val().uid,'bob');
 // Re-claiming your own name is not "taken" - a retry after a lost response
 // must not tell the player their own name is gone.
 assert.equal(report('alice re-claims Alex',await alice$1.claim('Alex')).status,'claimed');
});

test('only the owner releases a name, and a released name becomes free',{skip:baseline},async()=>{
 const key=characterNameKey('Alex'),alice$1=claimService(alice,'alice'),bob$1=claimService(bob,'bob');
 assert.equal(report('alice claims Alex',await alice$1.claim('Alex')).status,'claimed');
 assert.deepEqual(report('bob releases Alex',await bob$1.release('Alex')),{released:false},'another account cannot free it');
 await assertFails(remove(ref(bob,`characterNames/${key}`)));
 assert.equal(report('bob claims Alex',await bob$1.claim('Alex')).status,'taken');
 assert.deepEqual(report('alice releases Alex',await alice$1.release('Alex')),{released:true,key});
 assert.equal(report('bob claims Alex after release',await bob$1.claim('Alex')).status,'claimed','freed names can be taken again');
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
 // Keys that are not lowercase hex. A path with a dot or ".." is refused by
 // the client before it ever reaches the rules, so it proves nothing here.
 for(const bad of ['not-hex','ALEX','z'])await assertFails(set(ref(alice,`characterNames/${bad}`),{uid:'alice',name:'Alex'}));
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
 assert.equal(report('alice claims Alex (baseline)',await alice$1.claim('Alex')).status,'unsupported');
 await env.withSecurityRulesDisabled(async ctx=>{
  // A listing published by another account is visible to everyone.
  await set(ref(ctx.database(),`friendNames/${key}/bob`),{name:'Alex',code:'b'.repeat(32)});
 });
 assert.equal(report('alice claims alex (listing exists)',await alice$1.claim('alex')).status,'taken','a visible listing still answers the question');
 assert.equal(report('alice claims Alexa',await alice$1.claim('Alexa')).status,'unsupported','an unknown name is not silently promised');
 // Releasing against rules without the index is a no-op, not a failure.
 assert.equal(report('bob releases Alex (baseline)',await bob$1.release('Alex')).unsupported,true);
});
