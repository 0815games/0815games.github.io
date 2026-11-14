import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,get,set,update,remove,onValue,runTransaction,serverTimestamp,query,orderByKey,startAfter,limitToFirst} from 'firebase/database';
import {buildSocialCleanupCandidate} from '../social-cleanup-candidate.mjs';
import {buildRulesCandidate} from '../../release-tools/rules-candidate.mjs';
import {createFriendService,friendNameKey} from '../../friends.mjs';
import {createCoopInvites} from '../../coop-invites.mjs';
import {createCharacterDeletion} from '../../character-deletion.mjs';
import {createFirebaseFourLobby} from '../../firebase-four-lobby.mjs';

// The baseline is the checked-in owner reference, not a live Rules export.
// Candidate and candidate+release-guard are separate emulator runs.
const baseline=process.env.SOCIAL_BASELINE==='1',guarded=process.env.SOCIAL_GUARDED==='1';
const sdk={ref,get,set,update,remove,onValue,runTransaction,serverTimestamp,query,orderByKey,startAfter,limitToFirst};
const now=Math.floor(Date.now()/1000),epoch='a'.repeat(32),control={mode:'open',build:'social-test',epoch,authAfterMs:(now-120)*1000};
const claims={iat:now,auth_time:now-30,ip_release_epoch:epoch,firebase:{sign_in_provider:'custom',identities:{}}};
const ids=['alice','bob','carol','eve'];let env,db;
const auth=uid=>({currentUser:{uid}});
const friends=uid=>createFriendService({db:db[uid],auth:auth(uid),sdk,crypto:webcrypto});
const invites=uid=>createCoopInvites({db:db[uid],auth:auth(uid),sdk});
const lobby=uid=>createFirebaseFourLobby({db:db[uid],auth:auth(uid),sdk,crypto:webcrypto});
const deletion=uid=>createCharacterDeletion({db:db[uid],auth:auth(uid),sdk});
const adminSet=(path,value)=>env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),path),value));
const adminRead=async path=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),path))).val();});return value;};

before(async()=>{
 const bytes=await readFile(new URL('../WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
 let rules=baseline?JSON.parse(bytes):buildSocialCleanupCandidate(bytes);
 if(guarded)rules=buildRulesCandidate(rules).candidate;
 env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}});
 db=Object.fromEntries(ids.map(uid=>[uid,env.authenticatedContext(uid,guarded?claims:undefined).database()]));
});
beforeEach(async()=>{
 await env.clearDatabase();if(guarded)await adminSet('_ironpathRelease',control);
 for(const [uid,name] of [['alice','Alice'],['bob','Bob'],['carol','Carol'],['eve','Eve']])await set(ref(db[uid],`players/${uid}`),{name,gender:'female',xp:0});
});
after(async()=>env.cleanup());

test('candidate removes both friendship directions, known invites, scores and identity, then allows a new name',{skip:baseline,timeout:30000},async()=>{
 const a=friends('alice'),b=friends('bob'),c=friends('carol');
 await Promise.all([a.ensureSearchListing('Alice'),b.ensureSearchListing('Bob'),c.ensureSearchListing('Carol')]);
 const oldCode=await a.ensureCode('Alice'),bobCode=await b.ensureCode('Bob');
 await a.send(bobCode,'Alice');await b.accept('alice');await c.send(oldCode,'Carol');await a.accept('carol');
 const hostA=lobby('alice'),hostB=lobby('bob'),partyA=await hostA.create({name:'Alice',gender:'female',level:1}),partyB=await hostB.create({name:'Bob',gender:'female',level:1});
 await invites('alice').send('bob',{partyId:partyA.partyId,code:partyA.inviteCode},'Alice');
 await invites('bob').send('alice',{partyId:partyB.partyId,code:partyB.inviteCode},'Bob');
 await assertSucceeds(hostA.close(partyA.partyId,partyA.inviteCode));
 assert.equal(await adminRead(`fourParties/${partyA.partyId}`),null);assert.equal(await adminRead(`fourCodes/${partyA.inviteCode}`),null);
 await set(ref(db.alice,'leaderboards/solo/alice'),{name:'Alice',wave:9});await set(ref(db.alice,'leaderboards/coop/alice'),{name:'Alice',wave:6});
 await set(ref(db.alice,`friendPresence/alice/${'f'.repeat(32)}`),serverTimestamp());
 if(guarded){const stale=env.authenticatedContext('alice',{...claims,ip_release_epoch:'b'.repeat(32)}).database();await assertFails(update(ref(stale),{'players/alice':null}));}
 await assertSucceeds(deletion('alice').remove('Alice'));
 for(const path of ['players/alice','friendPrivate/alice',`friendCodes/${oldCode}`,`friendNames/${friendNameKey('Alice')}/alice`,'friendships/bob/alice','friendships/alice/carol','friendOutgoing/alice/bob','friendOutgoing/carol/alice','coopInvites/bob/alice','coopInvites/alice/bob','leaderboards/solo/alice','leaderboards/coop/alice','friendPresence/alice'])assert.equal(await adminRead(path),null,path);
 assert.equal((await get(ref(db.bob,'players/bob'))).val().name,'Bob');
 await assertFails(set(ref(db.alice,`friendPresence/alice/${'e'.repeat(32)}`),serverTimestamp()));
 await assertSucceeds(set(ref(db.alice,'players/alice'),{name:'Alicia',gender:'female',xp:0}));
 await a.ensureSearchListing('Alicia');const newCode=await a.ensureCode('Alicia');assert.notEqual(newCode,oldCode);
 assert.deepEqual((await b.search('Alicia')).matches.map(v=>v.id),['alice']);
 await assert.rejects(()=>b.send(oldCode,'Bob'),/not found/);await b.send(newCode,'Bob');await a.accept('bob');
 assert.equal((await get(ref(db.bob,'friendships/alice/bob'))).val().status,'accepted');
 await hostB.close(partyB.partyId,partyB.inviteCode);
});

test('candidate repairs a retained legacy code and search key after a differently named enlistment',{skip:baseline},async()=>{
 const code='c'.repeat(32),old=friendNameKey('Alice'),fresh=friendNameKey('Alicia');
 await adminSet('players/alice',{name:'Alicia',gender:'female',xp:0});
 await adminSet(`friendCodes/${code}`,{uid:'alice',name:'Alice'});await adminSet('friendPrivate/alice',{code,searchKey:old});
 await adminSet(`friendNames/${old}/alice`,{name:'Alice',code});
 const a=friends('alice'),b=friends('bob');await assertSucceeds(a.ensureSearchListing('Alicia'));
 assert.equal(await adminRead(`friendNames/${old}/alice`),null);assert.deepEqual(await adminRead(`friendNames/${fresh}/alice`),{name:'Alicia',code});
 assert.deepEqual(await adminRead(`friendCodes/${code}`),{uid:'alice',name:'Alicia'});assert.equal(await adminRead('friendPrivate/alice/searchKey'),fresh);
 assert.deepEqual((await b.search('Alicia')).matches.map(v=>v.id),['alice']);await b.send(code,'Bob');await a.accept('bob');
});

test('candidate retains owner boundaries and lets only the addressed peer clear a foreign pointer',{skip:baseline},async()=>{
 const code=await friends('alice').ensureCode('Alice');await friends('carol').send(code,'Carol');
 await assertFails(remove(ref(db.eve,`friendCodes/${code}`)));
 await assertFails(set(ref(db.bob,`friendCodes/${code}`),{uid:'bob',name:'Bob'}));
 await assertFails(set(ref(db.alice,`friendCodes/${code}`),{uid:'bob',name:'Alice'}));
 await assertFails(set(ref(db.eve,'friendPrivate/alice/searchKey'),friendNameKey('Eve')));
 await assertFails(get(ref(db.alice,'friendOutgoing/carol')));
 await assertFails(remove(ref(db.eve,'friendOutgoing/carol/alice')));
 await assertFails(set(ref(db.alice,'friendOutgoing/carol/alice'),{name:'Alice',code}));
 await assertSucceeds(remove(ref(db.alice,'friendOutgoing/carol/alice')));
 assert.equal((await get(ref(db.carol,'friendOutgoing/carol/alice'))).val(),null);
});

test('reference Rules reject the complete atomic cleanup without deleting the player or score',{skip:!baseline},async()=>{
 const code=await friends('alice').ensureCode('Alice');await friends('alice').ensureSearchListing('Alice');
 await friends('carol').send(code,'Carol');await set(ref(db.alice,'leaderboards/solo/alice'),{name:'Alice',wave:7});
 await assertFails(deletion('alice').remove('Alice'));
 assert.equal((await get(ref(db.alice,'players/alice'))).val().name,'Alice');
 assert.equal((await get(ref(db.alice,'leaderboards/solo/alice'))).val().wave,7);
 assert.ok(await adminRead('friendships/alice/carol'));assert.ok(await adminRead(`friendCodes/${code}`));
});

test('a soldier with no social records can be deleted with the reference Rules',{skip:!baseline},async()=>{
 await set(ref(db.alice,'leaderboards/solo/alice'),{name:'Alice',wave:7});
 await assertSucceeds(deletion('alice').remove('Alice'));assert.equal(await adminRead('players/alice'),null);assert.equal(await adminRead('leaderboards/solo/alice'),null);
});
