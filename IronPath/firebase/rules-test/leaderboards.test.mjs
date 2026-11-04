import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,remove,onValue,runTransaction,query,orderByChild,limitToLast} from 'firebase/database';
import {createLeaderboardService} from '../../leaderboards.mjs';
let env,alice,bob,eve,anon;const sdk={ref,set,get,remove,onValue,runTransaction,query,orderByChild,limitToLast};
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../leaderboards.complete.draft.rules.json',import.meta.url),'utf8')}});alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();eve=env.authenticatedContext('eve').database();anon=env.unauthenticatedContext().database();});
beforeEach(async()=>{await env.clearDatabase();await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.database();for(const [id,name] of [['alice','Alice'],['bob','Bob'],['eve','Eve']])await set(ref(db,`players/${id}`),{name,gender:'female',xp:0});await set(ref(db,'friendships/bob/alice'),{status:'accepted',senderName:'Alice',receiverName:'Bob',code:'a'.repeat(32)});await set(ref(db,'friendOutgoing/alice/bob'),{name:'Bob',code:'a'.repeat(32)});});});after(async()=>env.cleanup());
const service=(db,uid)=>createLeaderboardService({db,auth:{currentUser:{uid}},sdk});
test('personal bests, separate boards, ranking and friends filter',async()=>{
 const a=service(alice,'alice'),b=service(bob,'bob'),e=service(eve,'eve');await a.record('solo',5,'Alice');await a.record('solo',3,'Alice');await b.record('solo',8,'Bob');await e.record('solo',12,'Eve');await b.record('coop',9,'Bob');
 const all=await a.scores('solo');assert.deepEqual(all.entries.map(x=>x.name),['Eve','Bob','Alice']);assert.equal(all.own.wave,5);assert.deepEqual((await a.scores('solo','friends')).entries.map(x=>x.name),['Bob','Alice']);assert.deepEqual((await a.scores('coop','friends')).entries.map(x=>x.name),['Bob']);
 await remove(ref(bob,'friendships/bob/alice'));assert.deepEqual((await a.scores('solo','friends')).entries.map(x=>x.name),['Alice']);
});
test('only owner can write their own named, bounded, monotonic score; queries are limited',async()=>{
 await assertFails(set(ref(eve,'leaderboards/solo/alice'),{name:'Alice',wave:1}));await assertFails(set(ref(alice,'leaderboards/solo/alice'),{name:'Eve',wave:1}));await assertFails(set(ref(alice,'leaderboards/solo/alice'),{name:'Alice',wave:1.5}));await assertFails(set(ref(alice,'leaderboards/solo/alice'),{name:'Alice',wave:10001}));await assertFails(set(ref(alice,'leaderboards/versus/alice'),{name:'Alice',wave:1}));await assertFails(set(ref(alice,'leaderboards/solo/alice'),{name:'Alice',wave:1,extra:'data'}));await assertSucceeds(set(ref(alice,'leaderboards/solo/alice'),{name:'Alice',wave:8}));await assertFails(set(ref(alice,'leaderboards/solo/alice'),{name:'Alice',wave:7}));
 await assertFails(get(ref(anon,'leaderboards/solo/alice')));await assertFails(get(ref(alice,'leaderboards/solo')));await assertFails(get(query(ref(alice,'leaderboards/solo'),orderByChild('wave'),limitToLast(51))));await assertSucceeds(get(query(ref(alice,'leaderboards/solo'),orderByChild('wave'),limitToLast(50))));await assertFails(get(ref(eve,'players/alice')));
});
