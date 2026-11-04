import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,remove,onValue,query,orderByKey,startAfter,limitToFirst} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {createFriendService,friendNameKey} from '../../friends.mjs';
let env,alice,bob,eve,anon;const sdk={ref,set,get,remove,onValue,query,orderByKey,startAfter,limitToFirst};
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL(process.env.COOP_INVITES_RULES?'../coop-invites.complete.draft.rules.json':'../friend-search.complete.draft.rules.json',import.meta.url),'utf8')}});alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();eve=env.authenticatedContext('eve').database();anon=env.unauthenticatedContext().database();});
beforeEach(async()=>{await env.clearDatabase();await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.database();for(const [id,name] of [['alice','Alice'],['bob','Bob'],['eve','Bob']])await set(ref(db,`players/${id}`),{name,gender:'female',xp:0});});});after(async()=>env.cleanup());
const service=(db,uid)=>createFriendService({db,auth:{currentUser:{uid}},sdk,crypto:webcrypto});
test('automatic listing, duplicate names, requests and restoration of old hidden listings',async()=>{
 const a=service(alice,'alice'),b=service(bob,'bob'),e=service(eve,'eve');await b.ensureCode('Bob');await e.ensureCode('Bob');assert.equal((await get(ref(bob,`friendNames/${friendNameKey('Bob')}/bob`))).val(),null);assert.equal((await a.search('Bob')).matches.length,0);
 await b.ensureSearchListing('Bob');await e.ensureSearchListing('Bob');const results=await a.search(' bOb ');assert.deepEqual(results.matches.map(x=>x.id),['bob','eve']);assert.notEqual(results.matches[0].code,results.matches[1].code);
 await a.send(results.matches[0].code,'Alice');await b.accept('alice');assert.equal((await get(ref(alice,'friendships/bob/alice'))).val().status,'accepted');
 await remove(ref(bob,`friendNames/${friendNameKey('Bob')}/bob`));assert.equal((await get(ref(bob,`friendNames/${friendNameKey('Bob')}/bob`))).val(),null);assert.deepEqual((await a.search('Bob')).matches.map(x=>x.id),['eve']);assert.equal((await get(ref(alice,'friendships/bob/alice'))).val().status,'accepted');await b.ensureSearchListing('Bob');assert.ok((await get(ref(bob,`friendNames/${friendNameKey('Bob')}/bob`))).exists());
});
test('search requires bounded authenticated query; listings cannot impersonate another user',async()=>{
 const b=service(bob,'bob');const code=await b.ensureCode('Bob');await b.ensureSearchListing('Bob');const key=friendNameKey('Bob');
 await assertFails(get(ref(anon,`friendNames/${key}`)));await assertFails(get(ref(alice,'friendNames')));await assertFails(get(ref(alice,`friendNames/${key}`)));await assertFails(get(query(ref(alice,`friendNames/${key}`),orderByKey(),limitToFirst(31))));
 await assertSucceeds(get(query(ref(alice,`friendNames/${key}`),orderByKey(),limitToFirst(30))));await assertFails(get(ref(eve,`friendNames/${key}/bob`)));await assertFails(set(ref(eve,`friendNames/${key}/bob`),{name:'Bob',code}));await assertFails(set(ref(bob,`friendNames/${key}/bob`),{name:'Alice',code}));await assertFails(set(ref(bob,`friendPrivate/bob/searchKey`),friendNameKey('Alice')));
});
test('search supports paging duplicate names',async()=>{
 const key=friendNameKey('Bob');await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.database();for(let i=0;i<35;i++)await set(ref(db,`friendNames/${key}/u${String(i).padStart(2,'0')}`),{name:'Bob',code:i.toString(16).padStart(32,'0')});});
 const a=service(alice,'alice'),first=await a.search('bob');assert.equal(first.matches.length,30);assert.ok(first.next);const second=await a.search('bob',first.next);assert.equal(second.matches.length,5);assert.equal(second.next,null);assert.equal(new Set([...first.matches,...second.matches].map(x=>x.id)).size,35);
});
