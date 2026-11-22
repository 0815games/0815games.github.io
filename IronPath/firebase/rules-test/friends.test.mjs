import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,remove,onValue} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {createFriendService} from '../../core/friends.mjs';
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

const until=async(predicate,label)=>{const deadline=Date.now()+5000;while(!predicate()){if(Date.now()>deadline)throw Error(`Timed out: ${label}`);await new Promise(resolve=>setTimeout(resolve,20));}};

test('decline and repeat requests refresh both lists, and removal works in both directions', {timeout:15000},async t=>{
 const a=service(alice,'alice'),b=service(bob,'bob'),aCode=await a.ensureCode('Alice'),bCode=await b.ensureCode('Bob');
 let av,bv;const stopA=a.watch(v=>av=v,()=>{}),stopB=b.watch(v=>bv=v,()=>{});t.after(()=>{stopA();stopB();});
 await a.send(bCode,'Alice');await until(()=>bv?.incoming?.alice?.status==='pending','first request');
 await b.removeIncoming('alice');await until(()=>av?.outgoing?.bob&&!av?.edges?.bob&&!bv?.incoming?.alice,'declined request');
 // The sender has not cleared its old outgoing marker; a new request should
 // still be possible and must reappear on both clients.
 await a.send(bCode,'Alice');await until(()=>av?.edges?.bob?.status==='pending'&&bv?.incoming?.alice?.status==='pending','repeat request');
 await b.accept('alice');await until(()=>av?.edges?.bob?.status==='accepted'&&bv?.incoming?.alice?.status==='accepted','accepted friend');
 await b.removeIncoming('alice');await until(()=>!av?.edges?.bob&&!bv?.incoming?.alice,'recipient removal');
 await a.send(bCode,'Alice');await b.accept('alice');await until(()=>av?.edges?.bob?.status==='accepted','re-added friend');
 await a.removeOutgoing('bob');await until(()=>!av?.outgoing?.bob&&!bv?.incoming?.alice,'sender removal');
 // Start the relationship in the other direction as well, not just by
 // reusing the original receiver/sender paths.
 await b.send(aCode,'Bob');await until(()=>av?.incoming?.bob?.status==='pending','reverse request');
 await a.accept('bob');await until(()=>av?.incoming?.bob?.status==='accepted'&&bv?.edges?.alice?.status==='accepted','reverse acceptance');
 await b.removeOutgoing('alice');await until(()=>!av?.incoming?.bob&&!bv?.outgoing?.alice,'reverse removal');
});

test('two tabs sending the same request report only the server-acknowledged write as successful', {timeout:15000},async()=>{
 const otherAlice=env.authenticatedContext('alice').database(),code=await service(bob,'bob').ensureCode('Bob');
 let releaseBoth,releaseWinner,arrived=0;const both=new Promise(resolve=>{releaseBoth=resolve;}),winner=new Promise(resolve=>{releaseWinner=resolve;});
 const delayed={...sdk,async set(path,value){
  if(String(path).endsWith('/friendships/bob/alice')&&value?.status==='pending'){
   if(++arrived===2)releaseBoth();await both;
   try{const result=await set(path,value);releaseWinner();return result;}
   catch(error){await winner;throw error;}
  }
  return set(path,value);
 }};
 const make=db=>createFriendService({db,auth:{currentUser:{uid:'alice'}},sdk:delayed,crypto:webcrypto});
 const results=await Promise.allSettled([make(alice).send(code,'Alice'),make(otherAlice).send(code,'Alice')]);
 assert.equal(arrived,2,'both tabs made the request from an empty pre-read');
 assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
 const [rejected]=results.filter(result=>result.status==='rejected');assert.ok(rejected);assert.match(rejected.reason.message,/could not be confirmed/i);
 assert.equal((await get(ref(bob,'friendships/bob/alice'))).val().status,'pending','the winning edge is not removed');
 assert.ok((await get(ref(alice,'friendOutgoing/alice/bob'))).exists(),'the outgoing marker is preserved');
});

test('simultaneous opposite requests cannot create two friendships', {timeout:15000},async()=>{
 const aBase=service(alice,'alice'),bBase=service(bob,'bob'),aCode=await aBase.ensureCode('Alice'),bCode=await bBase.ensureCode('Bob');
 let release,arrived=0;const both=new Promise(resolve=>{release=resolve;});
 const delayed={...sdk,async set(path,value){
  if(/\/friendships\/(alice|bob)\/(alice|bob)$/.test(String(path))&&value?.status==='pending'){
   if(++arrived===2)release();await both;
  }
  return set(path,value);
 }};
 const a=createFriendService({db:alice,auth:{currentUser:{uid:'alice'}},sdk:delayed,crypto:webcrypto});
 const b=createFriendService({db:bob,auth:{currentUser:{uid:'bob'}},sdk:delayed,crypto:webcrypto});
 const results=await Promise.allSettled([a.send(bCode,'Alice'),b.send(aCode,'Bob')]);
 assert.equal(arrived,2,'both tabs reached the actual request writes');
 assert.equal(results.filter(result=>result.status==='fulfilled').length,1,'only one sender is confirmed');
 assert.equal(results.filter(result=>result.status==='rejected').length,1,'the other sender receives the race failure');
 const ab=(await get(ref(bob,'friendships/bob/alice'))).val(),ba=(await get(ref(alice,'friendships/alice/bob'))).val();
 assert.equal(Number(!!ab)+Number(!!ba),1,'there is exactly one authoritative edge');
});
