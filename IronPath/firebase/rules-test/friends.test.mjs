import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,remove,onValue} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {createFriendService} from '../../friends.mjs';
let env,alice,bob,eve,anon;const sdk={ref,set,get,remove,onValue};
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL(process.env.DIRECT_INVITES_RULES?'../direct-invites.complete.draft.rules.json':process.env.LEADERBOARD_RULES?'../leaderboards.complete.draft.rules.json':process.env.COOP_INVITES_RULES?'../coop-invites.complete.draft.rules.json':process.env.FRIEND_SEARCH_RULES?'../friend-search.complete.draft.rules.json':'../friends.complete.draft.rules.json',import.meta.url),'utf8')}});alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();eve=env.authenticatedContext('eve').database();anon=env.unauthenticatedContext().database();});
beforeEach(async()=>{await env.clearDatabase();await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.database();for(const [id,name] of [['alice','Alice'],['bob','Bob'],['eve','Eve']])await set(ref(db,`players/${id}`),{name,gender:'female',xp:0});});});after(async()=>env.cleanup());
const service=(db,uid)=>createFriendService({db,auth:{currentUser:{uid}},sdk,crypto:webcrypto});
test('send, accept and remove persist for both accounts without exposing private profiles',async()=>{
 const a=service(alice,'alice'),b=service(bob,'bob'),code=await b.ensureCode('Bob'),aCode=await a.ensureCode('Alice');assert.match(code,/^[a-f0-9]{32}$/);assert.equal(await b.ensureCode('Bob'),code);
 await assertFails(get(ref(anon,`friendCodes/${code}`)));await assertFails(get(ref(eve,'friendCodes')));await assertFails(get(ref(eve,'players/bob')));await assertFails(get(ref(eve,'friendPrivate/bob')));
 assert.equal(await a.send(code,'Alice'),'Bob');const edge=ref(bob,'friendships/bob/alice');assert.equal((await get(edge)).val().status,'pending');
 await assertFails(set(ref(alice,'friendships/bob/alice/status'),'accepted'));await assertFails(set(ref(eve,'friendships/bob/alice/status'),'accepted'));await assertFails(get(ref(eve,'friendships/bob/alice')));await assertFails(get(ref(alice,'friendships/bob')));
 await assertFails(set(ref(eve,'friendCodes/'+aCode),{uid:'eve',name:'Eve'}));await assertFails(set(ref(alice,'friendPrivate/alice/code'),code));
 await assertSucceeds(b.accept('alice'));assert.equal((await get(ref(alice,'friendships/bob/alice'))).val().status,'accepted');
 await assertFails(set(ref(bob,'friendships/bob/alice/senderName'),'Forged'));await assertSucceeds(b.removeIncoming('alice'));assert.equal((await get(ref(alice,'friendships/bob/alice'))).val(),null);await a.removeOutgoing('bob');assert.equal((await get(ref(alice,'friendOutgoing/alice/bob'))).val(),null);
});
test('decline, cancellation, duplicate and forged requests',async()=>{
 const a=service(alice,'alice'),b=service(bob,'bob'),code=await b.ensureCode('Bob'),aCode=await a.ensureCode('Alice');await a.send(code,'Alice');
 await assert.rejects(()=>b.send(aCode,'Bob'),/already sent/);await assertFails(set(ref(eve,'friendships/bob/alice'),{status:'pending',senderName:'Alice',receiverName:'Bob',code}));
 await assertFails(set(ref(eve,'friendships/bob/eve'),{status:'accepted',senderName:'Eve',receiverName:'Bob',code}));await assertFails(set(ref(eve,'friendships/bob/eve'),{status:'pending',senderName:'Alice',receiverName:'Bob',code}));
 await b.removeIncoming('alice');await a.removeOutgoing('bob');await a.send(code,'Alice');await a.removeOutgoing('bob');assert.equal((await get(ref(bob,'friendships/bob/alice'))).val(),null);
});
