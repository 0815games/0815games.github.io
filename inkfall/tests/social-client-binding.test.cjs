"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const {create,decodeIndex,createCallableActions}=require('../game/social/social-client.js');
const record=(extra={})=>({active:true,revision:1,...extra});
for(const [label,raw,kind,want] of [
 ['inactive friend',{bob:record({active:false})},'friends',0],
 ['inactive request',{bob:record({active:false,expiresAt:2000})},'requests',0],
 ['valid friend',{bob:record()},'friends',1],
 ['valid request',{bob:record({expiresAt:2000})},'requests',1],
 ['expired request',{bob:record({expiresAt:999})},'requests',0],
 ['expiry boundary',{bob:record({expiresAt:1000})},'requests',0],
 ['missing expiry',{bob:record()},'requests',0],
 ['string expiry',{bob:record({expiresAt:'2000'})},'requests',0],
 ['missing revision',{bob:{active:true}},'friends',0],
 ['negative revision',{bob:record({revision:-1})},'friends',0],
 ['invalid key',{'bad/uid':record()},'friends',0],
 ['array input',[record()],'friends',0],
 ['legacy friend',{bob:true},'friends',1],
 ['legacy request denied',{bob:true},'requests',0],
 ['string active',{bob:record({active:'true'})},'friends',0]
])test('Decode '+label,()=>assert.equal(decodeIndex(raw,kind,1000).length,want));
test('Stable ordering and preserved sender name',()=>{const list=decodeIndex({zoe:record({displayName:'Zoe',expiresAt:2000}),bob:record({displayName:'Bob',expiresAt:2000})},'requests',1000);assert.deepEqual(list.map(x=>x.uid),['bob','zoe']);assert.equal(list[0].displayName,'Bob');});
function transport(){let user={uid:'alice'};const calls=[];const functions={httpsCallable:(name,options)=>async payload=>{calls.push({name,options,payload});return {data:{ok:true}};}};return {calls,functions,actions:createCallableActions({getFunctions:async()=>functions,getUser:()=>user}),setUser:value=>user=value};}
test('Code request maps to exact callable and trims code',async()=>{const t=transport();await t.actions.requestByCode({friendCode:'  '+'A'.repeat(24)+'  '});assert.equal(t.calls[0].name,'socialRequestByCode');assert.deepEqual(t.calls[0].payload,{friendCode:'A'.repeat(24)});assert.equal(t.calls[0].options.timeout,15000);});
for(const operation of ['accept','decline','cancel','remove','block','unblock'])test('Callable mapping '+operation,async()=>{const t=transport();await t.actions[operation]({targetUid:'bob'});assert.equal(t.calls[0].name,'socialRespond');assert.deepEqual(t.calls[0].payload,{operation,targetUid:'bob'});});
test('Code retrieval never forwards caller identity',async()=>{const t=transport();await t.actions.getCode({actorUid:'mallory'});assert.deepEqual(t.calls[0].payload,{});assert.equal(t.calls[0].name,'socialGetCode');});
test('Forged target payload is rejected',async()=>{const t=transport();await assert.rejects(async()=>t.actions.accept({targetUid:'bob',actorUid:'mallory'}));assert.equal(t.calls.length,0);});
test('Invalid friend code never calls backend',async()=>{const t=transport();await assert.rejects(async()=>t.actions.requestByCode({friendCode:'bad'}));assert.equal(t.calls.length,0);});
test('Unauthenticated invocation denied',async()=>{const t=transport();t.setUser(null);await assert.rejects(t.actions.remove({targetUid:'bob'}),{code:'unauthenticated'});assert.equal(t.calls.length,0);});
test('Account change while SDK loads prevents dispatch',async()=>{let user={uid:'alice'},release,calls=0;const actions=createCallableActions({getUser:()=>user,getFunctions:()=>new Promise(resolve=>release=resolve)});const p=actions.accept({targetUid:'bob'});user={uid:'carol'};release({httpsCallable:()=>()=>{calls++;}});await assert.rejects(p,{code:'session-changed'});assert.equal(calls,0);});
test('Account change during response rejects stale result',async()=>{let user={uid:'alice'},release;const actions=createCallableActions({getUser:()=>user,getFunctions:async()=>({httpsCallable:()=>()=>new Promise(resolve=>release=resolve)})});const p=actions.accept({targetUid:'bob'});await new Promise(setImmediate);user=null;release({data:{ok:true}});await assert.rejects(p,{code:'session-changed'});});
test('Backend rejection propagates, no fallback write',async()=>{const actions=createCallableActions({getUser:()=>({uid:'alice'}),getFunctions:async()=>({httpsCallable:()=>async()=>{throw Object.assign(Error('denied'),{code:'functions/permission-denied'});}})});await assert.rejects(actions.block({targetUid:'bob'}),{code:'functions/permission-denied'});});
test('Undeveloped invite stays disabled',async()=>{const client=create({enabled:true,actions:{invite:async()=>{throw Error('must not run');}}});assert.equal(client.has('invite'),false);await assert.rejects(client.invoke('invite',{}),{code:'backend-unavailable'});});
test('Disabled feature makes no transport available',()=>{const client=create({actions:{accept:async()=>{}}});assert.equal(client.has('accept'),false);});
function databaseFixture(){
 const state={'.info/serverTimeOffset':0,'social/friends/alice':{},'social/requests/alice':{}},listeners=new Map(),jobs=new Map();let time=1000,seq=0,reads=0;
 const db={ref(path){return {on(kind,data,error){listeners.set(path,{data,error});data({val:()=>state[path]??null});},off(){listeners.delete(path);},get:async()=>{reads++;return {val:()=>({displayName:'Bob'})};}};}};
 const output=[],errors=[];
 const client=create({db,enabled:true,clock:()=>time,schedule:(fn,delay)=>{jobs.set(++seq,{fn,at:time+delay});return seq;},cancel:id=>jobs.delete(id)});
 const stop=client.watch('alice',value=>output.push(value),e=>errors.push(e));
 return {output,errors,stop,get jobs(){return jobs.size;},get reads(){return reads;},get listeners(){return listeners.size;},emit(path,value){state[path]=value;listeners.get(path)?.data({val:()=>value});},fail(){listeners.get('social/requests/alice')?.error(Error('denied'));},advance(delta){time+=delta;for(const [id,job] of [...jobs])if(job.at<=time){jobs.delete(id);job.fn();}}};
}
test('Request expires without new database event',()=>{const f=databaseFixture();f.emit('social/requests/alice',{bob:record({expiresAt:2000})});assert.equal(f.output.at(-1).requests.length,1);f.advance(1001);assert.equal(f.output.at(-1).requests.length,0);f.stop();});
test('Expiry uses server clock offset',()=>{const f=databaseFixture();f.emit('.info/serverTimeOffset',1200);f.emit('social/requests/alice',{bob:record({expiresAt:2000})});assert.equal(f.output.at(-1).requests.length,0);f.stop();});
test('Unsubscribe clears all three listeners and timer',()=>{const f=databaseFixture();f.emit('social/requests/alice',{bob:record({expiresAt:2000})});assert.equal(f.jobs,1);assert.equal(f.listeners,3);const count=f.output.length;f.stop();assert.equal(f.jobs,0);assert.equal(f.listeners,0);f.advance(2000);assert.equal(f.output.length,count);});
test('Permission error clears timer and subscriptions',()=>{const f=databaseFixture();f.emit('social/requests/alice',{bob:record({expiresAt:2000})});f.fail();assert.equal(f.errors.length,1);assert.equal(f.jobs,0);assert.equal(f.listeners,0);});
test('Inactive friends are not fetched',async()=>{const f=databaseFixture();f.emit('social/friends/alice',{bob:record({active:false})});await new Promise(setImmediate);assert.equal(f.reads,0);f.stop();});
test('Queued profile fetch does not run after unsubscribe',async()=>{const f=databaseFixture();f.emit('social/friends/alice',{bob:record()});f.stop();await new Promise(setImmediate);assert.equal(f.reads,0);});
test('Request event is emitted before profile enrichment finishes',()=>{const f=databaseFixture();f.emit('social/friends/alice',{bob:record()});f.emit('social/requests/alice',{carol:record({expiresAt:2000})});assert.equal(f.output.at(-1).requests[0].uid,'carol');f.stop();});
test('Callable data returned to caller',async()=>{const t=transport();assert.deepEqual(await t.actions.accept({targetUid:'bob'}),{ok:true});});
test('Privacy callable uses explicit allowlist',async()=>{const t=transport();await t.actions.setPrivacy({profile:'private',characters:'friends'});assert.equal(t.calls[0].name,'socialSetPrivacy');await assert.rejects(async()=>t.actions.setPrivacy({profile:'public',characters:'friends'}));});

test('Unknown index kind is denied',()=>assert.deepEqual(decodeIndex({bob:record()},'invites',1000),[]));
test('Invalid reference time is denied',()=>assert.deepEqual(decodeIndex({bob:record()},'friends',NaN),[]));
function browserClient(){
 const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
 const scripts=[],calls=[];let user={uid:'alice'};
 const firebase={auth:()=>({currentUser:user}),app:()=>({functions:region=>({httpsCallable:name=>async payload=>{calls.push({region,name,payload});return {data:{ok:true}};}})})};
 const doc={scripts:[{src:'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js'}],createElement:()=>({remove(){this.removed=true;}}),head:{append:script=>scripts.push(script)}};
 const box={module:{exports:{}},firebase,document:doc,INKFALL_SOCIAL_CONFIG:{functionsRegion:'us-central1'},setTimeout,clearTimeout};box.globalThis=box;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../game/social/social-client.js'),'utf8'),box);
 return {client:box.module.exports.create({enabled:true}),firebase,scripts,calls,box,setUser:value=>user=value};
}
test('Functions SDK loads only on first action with matching version',async()=>{const b=browserClient();assert.equal(b.scripts.length,0);const p=b.client.invoke('accept',{targetUid:'bob'});assert.equal(b.scripts.length,1);assert.equal(b.scripts[0].src,'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions-compat.js');b.firebase.functions=()=>{};b.scripts[0].onload();await p;assert.equal(b.calls[0].region,'us-central1');assert.equal(b.calls[0].name,'socialRespond');});
test('SDK load failure permits retry',async()=>{const b=browserClient();const p=b.client.invoke('block',{targetUid:'bob'});b.scripts[0].onerror();await assert.rejects(p,{code:'functions-sdk-unavailable'});const second=b.client.invoke('block',{targetUid:'bob'});assert.equal(b.scripts.length,2);b.firebase.functions=()=>{};b.scripts[1].onload();await second;assert.equal(b.calls.length,1);});
test('Logout during actual lazy loader prevents backend call',async()=>{const b=browserClient();const p=b.client.invoke('remove',{targetUid:'bob'});b.setUser(null);b.firebase.functions=()=>{};b.scripts[0].onload();await assert.rejects(p,{code:'session-changed'});assert.equal(b.calls.length,0);});
