import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {guardMultiplayerTab} from '../multiplayer-tab-guard.mjs';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fakeLocks(){const held=new Set();return {held,async request(key,options,callback){assert.equal(options.ifAvailable,true);if(held.has(key))return callback(null);held.add(key);try{return await callback({name:key});}finally{held.delete(key);}}};}
const open=(locks,partyId,uid,events)=>guardMultiplayerTab({locks,partyId,uid,onAcquired:()=>events.push('open'),onConflict:()=>events.push('duplicate')});
test('same party and account cannot start in two supported tabs',async()=>{
 const locks=fakeLocks(),a=[],b=[],c=[];const closeA=open(locks,'party','alice',a);await flush();const closeB=open(locks,'party','alice',b);const closeC=open(locks,'party','bob',c);await flush();assert.deepEqual(a,['open']);assert.deepEqual(b,['duplicate']);assert.deepEqual(c,['open']);closeB();closeC();closeA();await flush();const d=[];const closeD=open(locks,'party','alice',d);await flush();assert.deepEqual(d,['open']);closeD();await flush();assert.equal(locks.held.size,0);
});
test('closing before an asynchronous lock response never starts a game',async()=>{
 let callback;const locks={request(_key,_opts,fn){callback=fn;return new Promise(resolve=>{this.done=resolve;});}},events=[];const close=open(locks,'p','a',events);await flush();close();assert.equal(callback({}),undefined);locks.done();await flush();assert.deepEqual(events,[]);
});
test('unsupported or denied Web Locks fall back to normal play',async()=>{
 const first=[],second=[];const a=open(null,'p','a',first),b=open({request(){throw Error('not supported');}},'p','a',second);await flush();assert.deepEqual(first,['open']);assert.deepEqual(second,['open']);a();b();
});

test('game adapter refuses a second same-browser session before registering presence',async()=>{
 const {createFirebasePartyGame}=await import('../firebase-party-game.mjs');const locks=fakeLocks(),events=[],paths=[];
 const sdk={ref:(_db,p)=>p,onValue(p,cb){paths.push(p);cb({val:()=>p==='.info/connected'?false:null});return()=>{};},async set(){},async update(){},async remove(){},onDisconnect(){return {async remove(){}};},serverTimestamp(){return 0;}};
 const create=(label)=>createFirebasePartyGame({db:{},auth:{currentUser:{uid:'bob'}},sdk,crypto:{getRandomValues(a){a.fill(1);}},partyId:'party',partyRoot:'fourParties',hostId:'alice',playerIds:['alice','bob'],mode:'coop',lockManager:locks,onState:state=>events.push([label,state])});
 const a=create('a'),b=create('b');a.start();await flush();const firstCount=paths.length;assert.ok(firstCount>0);b.start();await flush();assert.deepEqual(events.filter(([label,state])=>label==='b'&&state==='duplicate'),[['b','duplicate']]);assert.equal(paths.length,firstCount,'duplicate must not attach channels or presence');await b.stop();await a.stop();await flush();const c=create('c');c.start();await flush();assert.ok(paths.length>firstCount);await c.stop();
});
