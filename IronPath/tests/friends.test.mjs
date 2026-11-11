import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createFriendService,friendNameKey} from '../friends.mjs';
import {readFileSync} from 'node:fs';
const makeStore=()=>{const values=new Map(),listeners=new Map();const read=p=>{if(values.has(p))return values.get(p);const v={};for(const [k,x] of values)if(k.startsWith(p+'/')){const key=k.slice(p.length+1);if(!key.includes('/'))v[key]=x;}return Object.keys(v).length?v:null;};const emit=p=>{for(const [k,set] of listeners)if(k===p||p.startsWith(k+'/'))for(const cb of set)cb({val:()=>read(k)});};return {values,sdk:{ref:(_db,p)=>p,async get(p){return {val:()=>read(p)};},async set(p,v){values.set(p,v);emit(p);},async remove(p){for(const k of [...values.keys()])if(k===p||k.startsWith(p+'/'))values.delete(k);emit(p);},onValue(p,cb){if(!listeners.has(p))listeners.set(p,new Set());listeners.get(p).add(cb);cb({val:()=>read(p)});return()=>listeners.get(p).delete(cb);}}};};
test('service sends, observes, accepts and removes a friend request',async()=>{
 const store=makeStore();let n=0;const crypto={getRandomValues(bytes){bytes.fill(++n);}};const make=uid=>createFriendService({db:{},auth:{currentUser:{uid}},sdk:store.sdk,crypto}),alice=make('alice'),bob=make('bob');let a,b;const stopA=alice.watch(v=>a=v,()=>{}),stopB=bob.watch(v=>b=v,()=>{});
 const code=await bob.ensureCode('Bob');assert.equal(await bob.ensureCode('Bob'),code);assert.equal(await alice.send(code,'Alice'),'Bob');assert.equal(b.incoming.alice.senderName,'Alice');assert.equal(a.edges.bob.status,'pending');
 // A real Firebase SDK updates the parent on a child write; emulate the accepted object here.
 await store.sdk.set('friendships/bob/alice',{...b.incoming.alice,status:'accepted'});assert.equal(a.edges.bob.status,'accepted');await alice.removeOutgoing('bob');assert.equal(a.outgoing.bob,undefined);assert.equal(b.incoming.alice,undefined);stopA();stopB();
 await assert.rejects(()=>alice.send('wrong','Alice'),/32-character/);await assert.rejects(()=>bob.send(code,'Bob'),/own/);
});

test('name lookup normalizes case and safely encodes Firebase path characters',()=>{assert.equal(friendNameKey(' Bob '),friendNameKey('bob'));assert.match(friendNameKey('Ä/#.[]'),/^[a-f0-9]+$/);assert.throws(()=>friendNameKey('x'),/2–24/);});

test('account listing is published automatically and restores a previously hidden listing',async()=>{
 const store=makeStore(),crypto={getRandomValues(bytes){bytes.fill(9);}},alice=createFriendService({db:{},auth:{currentUser:{uid:'alice'}},sdk:store.sdk,crypto});const key=friendNameKey('Alice'),listing=`friendNames/${key}/alice`;
 await alice.ensureSearchListing('Alice');assert.equal(store.values.get(listing).name,'Alice');const code=store.values.get(listing).code;await store.sdk.remove(listing);await alice.ensureSearchListing('Alice');assert.deepEqual(store.values.get(listing),{name:'Alice',code});
});

test('deleting a character empties the own list and leaves everyone else\'s lists',async()=>{
 const store=makeStore();let n=0;const crypto={getRandomValues(bytes){bytes.fill(++n);}};
 const make=uid=>createFriendService({db:{},auth:{currentUser:{uid}},sdk:store.sdk,crypto});
 const alice=make('alice'),bob=make('bob'),carol=make('carol');
 await alice.ensureSearchListing('Alice');await bob.ensureSearchListing('Bob');await carol.ensureSearchListing('Carol');
 // Alice is mutual friends with Bob (Alice sent, Bob accepted) and has a
 // pending request from Carol sitting in her inbox.
 const aliceCode=store.values.get(`friendPrivate/alice/code`),bobCode=store.values.get(`friendPrivate/bob/code`);
 await alice.send(bobCode,'Alice');
 await store.sdk.set('friendships/bob/alice',{...store.values.get('friendships/bob/alice'),status:'accepted'});
 await carol.send(aliceCode,'Carol');
 const summary=await alice.purge();
 assert.deepEqual(summary,{edges:1,outgoing:1,failed:0});
 assert.equal(store.values.get('friendships/alice'),undefined,'own incoming edges are gone');
 assert.equal(store.values.get('friendOutgoing/alice'),undefined,'own outgoing records are gone');
 assert.equal(store.values.get('friendships/bob/alice'),undefined,'the character left Bob\'s friend list');
 assert.equal(store.values.get(`friendNames/${friendNameKey('Alice')}/alice`),undefined,'the search listing is gone');
 // Carol sent Alice a request: her outgoing record is owner-only under the
 // rules, so it stays - but the edge it points at is gone, which is exactly
 // what renders as "Request no longer active" with a CLEAR button.
 assert.ok(store.values.get('friendOutgoing/carol/alice'),'the other side\'s own record is theirs to clear');
 assert.equal(store.values.get('friendships/alice/carol'),undefined,'the request trail into the deleted account is gone');
 // The create-only pieces survive by rule design: the code keeps resolving,
 // which is what lets a re-enlisted soldier reuse it.
 assert.ok(store.values.get(`friendCodes/${aliceCode}`),'the friend code entry is create-only');
 assert.ok(store.values.get('friendPrivate/alice/code'),'the private code is create-only');
});

test('purge without any friend data is a clean no-op',async()=>{
 const store=makeStore();const crypto={getRandomValues(bytes){bytes.fill(3);}};
 const alice=createFriendService({db:{},auth:{currentUser:{uid:'alice'}},sdk:store.sdk,crypto});
 assert.deepEqual(await alice.purge(),{edges:0,outgoing:0,failed:0});
});

test('re-enlisting under a new name degrades honestly instead of bricking search',async()=>{
 const store=makeStore();const crypto={getRandomValues(bytes){bytes.fill(5);}};
 const alice=createFriendService({db:{},auth:{currentUser:{uid:'alice'}},sdk:store.sdk,crypto});
 await alice.ensureSearchListing('Alice');
 const firstCode=store.values.get(`friendPrivate/alice/code`);
 await alice.purge(); // the character is gone; friendPrivate is create-only
 // The same account enlists a new soldier with a different name.
 const secondCode=await alice.ensureCode('Alicia');
 assert.equal(secondCode,firstCode,'the code is reused, not collided');
 await assert.rejects(()=>alice.ensureSearchListing('Alicia'),/share your friend code instead/);
 assert.equal(store.values.get(`friendNames/${friendNameKey('Alice')}/alice`),undefined,'the stale listing was taken down');
 assert.equal(store.values.get(`friendNames/${friendNameKey('Alicia')}/alice`),undefined,'no listing appears under the new name while the key cannot move');
});

test('character deletion is wired to the friends purge',()=>{
 const account=readFileSync(new URL('../account.js',import.meta.url),'utf8');
 assert.match(account,/friendsUI\.purge\(\)\.catch\(\(\)=>\{\}\)/,'deleteCharacter runs the friends purge');
 assert.match(account,/friend links are erased/,'the confirmation names the friend links');
 const ui=readFileSync(new URL('../friends-ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/return \{reset,start,signOut,open,purge\}/,'the friends UI exposes the purge');
});
