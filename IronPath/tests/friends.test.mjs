import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createFriendService,friendNameKey} from '../friends.mjs';
const makeStore=()=>{const values=new Map(),listeners=new Map();const read=p=>{if(values.has(p))return values.get(p);const v={};for(const [k,x] of values)if(k.startsWith(p+'/')){const key=k.slice(p.length+1);if(!key.includes('/'))v[key]=x;}return Object.keys(v).length?v:null;};const emit=p=>{for(const [k,set] of listeners)if(k===p||p.startsWith(k+'/'))for(const cb of set)cb({val:()=>read(k)});};return {values,sdk:{ref:(_db,p)=>p,async get(p){return {val:()=>read(p)};},async set(p,v){values.set(p,v);emit(p);},async remove(p){values.delete(p);emit(p);},onValue(p,cb){if(!listeners.has(p))listeners.set(p,new Set());listeners.get(p).add(cb);cb({val:()=>read(p)});return()=>listeners.get(p).delete(cb);}}};};
test('service sends, observes, accepts and removes a friend request',async()=>{
 const store=makeStore();let n=0;const crypto={getRandomValues(bytes){bytes.fill(++n);}};const make=uid=>createFriendService({db:{},auth:{currentUser:{uid}},sdk:store.sdk,crypto}),alice=make('alice'),bob=make('bob');let a,b;const stopA=alice.watch(v=>a=v,()=>{}),stopB=bob.watch(v=>b=v,()=>{});
 const code=await bob.ensureCode('Bob');assert.equal(await bob.ensureCode('Bob'),code);assert.equal(await alice.send(code,'Alice'),'Bob');assert.equal(b.incoming.alice.senderName,'Alice');assert.equal(a.edges.bob.status,'pending');
 // A real Firebase SDK updates the parent on a child write; emulate the accepted object here.
 await store.sdk.set('friendships/bob/alice',{...b.incoming.alice,status:'accepted'});assert.equal(a.edges.bob.status,'accepted');await alice.removeOutgoing('bob');assert.equal(a.outgoing.bob,undefined);assert.equal(b.incoming.alice,undefined);stopA();stopB();
 await assert.rejects(()=>alice.send('wrong','Alice'),/32-character/);await assert.rejects(()=>bob.send(code,'Bob'),/own/);
});

test('name lookup normalizes case and safely encodes Firebase path characters',()=>{assert.equal(friendNameKey(' Bob '),friendNameKey('bob'));assert.match(friendNameKey('Ä/#.[]'),/^[a-f0-9]+$/);assert.throws(()=>friendNameKey('x'),/2–24/);});
