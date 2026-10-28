"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {createSocialService}=require("../functions/social-service.cjs");
const clone=x=>x==null?null:JSON.parse(JSON.stringify(x));
function fixture(options={}){
 let time=1000000,sequence=0;
 const data={users:{alice:{profile:{displayName:"Alice"},characters:{knight:{heroName:"Thorin",level:3,xp:8,skillPoints:1,skills:{blade1:true},soloRun:{wave:2,gold:999}}}},bob:{profile:{displayName:"Bobby"}},mallory:{profile:{displayName:"Mallory"}}}};
 const queues=new Map(),writes=[];
 function read(path){let value=data;for(const key of path.split('/').filter(Boolean))value=value?.[key];return clone(value);}
 function write(path,value){const keys=path.split('/').filter(Boolean),last=keys.pop();let parent=data;for(const key of keys)parent=parent[key]||=Object.create(null);if(value===null)delete parent[last];else parent[last]=clone(value);writes.push(path);}
 const db={ref(path=''){return {get:async()=>({val:()=>read(path)}),set:async value=>write(path,value),update:async patch=>{for(const [key,value] of Object.entries(patch))write(path?path+'/'+key:key,value);},transaction(callback){const run=(queues.get(path)||Promise.resolve()).catch(()=>{}).then(()=>{const value=callback(read(path));if(value===undefined)return {committed:false,snapshot:{val:()=>read(path)}};write(path,value);return {committed:true,snapshot:{val:()=>clone(value)}};});queues.set(path,run);return run;}};}};
 const service=createSocialService({db,clock:()=>time,makeCode:()=>String(++sequence).padStart(24,'A'),...options});
 return {service,db,read,write,writes,advance(delta){time+=delta;}};
}
async function pending(f){const code=await f.service.getCode('bob');return f.service.requestByCode('alice',code);}
async function friends(f){await pending(f);return f.service.respond('bob',{operation:'accept',targetUid:'alice'});}
test('Unauthenticated calls rejected before writes',async()=>{const f=fixture();await assert.rejects(f.service.getCode(null),{code:'unauthenticated'});assert.equal(f.writes.length,0);});
test('Missing profiles rejected',async()=>{const f=fixture();await assert.rejects(f.service.getCode('ghost'),{code:'failed-precondition'});});
test('Own code is stable and private lookup points to owner',async()=>{const f=fixture();const a=await f.service.getCode('alice'),b=await f.service.getCode('alice');assert.equal(a.friendCode,b.friendCode);assert.equal(f.read('social/codeLookup/'+a.friendCode),'alice');});
test('Concurrent code creation returns same code',async()=>{const f=fixture();const values=await Promise.all([f.service.getCode('alice'),f.service.getCode('alice')]);assert.equal(values[0].friendCode,values[1].friendCode);});
test('Body cannot spoof actor',async()=>{const f=fixture();await assert.rejects(f.service.getCode('alice',{actorUid:'bob'}),{code:'invalid-argument'});});
test('Unknown friend code rejected',async()=>{const f=fixture();await assert.rejects(f.service.requestByCode('alice',{friendCode:'A'.repeat(24)}),{code:'not-found'});});
test('Invalid code rejected',async()=>{const f=fixture();await assert.rejects(f.service.requestByCode('alice',{friendCode:'../users'}),{code:'invalid-argument'});});
test('Self request rejected',async()=>{const f=fixture();const code=await f.service.getCode('alice');await assert.rejects(f.service.requestByCode('alice',code));});
test('Request creates canonical pair and recipient index',async()=>{const f=fixture();await pending(f);assert.equal(f.read('social/relationships/alice/bob').status,'pending');assert.equal(f.read('social/requests/bob/alice').active,true);assert.equal(f.read('social/requests/bob/alice').displayName,'Alice');assert.equal(f.read('social/friends/alice/bob').active,false);});
test('Sender cannot self approve',async()=>{const f=fixture();await pending(f);await assert.rejects(f.service.respond('alice',{operation:'accept',targetUid:'bob'}),{code:'failed-precondition'});});
test('Third party cannot approve',async()=>{const f=fixture();await pending(f);await assert.rejects(f.service.respond('mallory',{operation:'accept',targetUid:'alice'}),{code:'failed-precondition'});});
test('Recipient accepts and both indexes become active',async()=>{const f=fixture();await friends(f);assert.equal(f.read('social/friends/alice/bob').active,true);assert.equal(f.read('social/friends/bob/alice').active,true);assert.equal(f.read('social/requests/bob/alice').active,false);});
test('Repeated acceptance is idempotent',async()=>{const f=fixture();await friends(f);const before=f.read('social/relationships/alice/bob').revision;await f.service.respond('bob',{operation:'accept',targetUid:'alice'});assert.equal(f.read('social/relationships/alice/bob').revision,before);});
test('Recipient declines',async()=>{const f=fixture();await pending(f);await f.service.respond('bob',{operation:'decline',targetUid:'alice'});assert.equal(f.read('social/requests/bob/alice').active,false);});
test('Sender cancels',async()=>{const f=fixture();await pending(f);await f.service.respond('alice',{operation:'cancel',targetUid:'bob'});assert.equal(f.read('social/sentRequests/alice/bob').active,false);});
test('Remove revokes both friend indexes',async()=>{const f=fixture();await friends(f);await f.service.respond('alice',{operation:'remove',targetUid:'bob'});assert.equal(f.read('social/friends/alice/bob').active,false);assert.equal(f.read('social/friends/bob/alice').active,false);});
test('Block revokes request and forbids acceptance',async()=>{const f=fixture();await pending(f);await f.service.respond('bob',{operation:'block',targetUid:'alice'});assert.equal(f.read('social/blocks/bob/alice').active,true);assert.equal(f.read('social/requests/bob/alice').active,false);await assert.rejects(f.service.respond('bob',{operation:'accept',targetUid:'alice'}));});
test('Concurrent block and accept never finish as friends',async()=>{const f=fixture();await pending(f);await Promise.allSettled([f.service.respond('bob',{operation:'accept',targetUid:'alice'}),f.service.respond('alice',{operation:'block',targetUid:'bob'})]);assert.equal(f.read('social/relationships/alice/bob').status,'blocked');});
test('Unblock never restores friendship',async()=>{const f=fixture();await friends(f);await f.service.respond('alice',{operation:'block',targetUid:'bob'});await f.service.respond('alice',{operation:'unblock',targetUid:'bob'});assert.equal(f.read('social/friends/alice/bob').active,false);});
test('Newer index revision cannot be overwritten',async()=>{const f=fixture();await pending(f);f.write('social/friends/alice/bob',{revision:999,active:false});await f.service.reconcile('alice','bob');assert.equal(f.read('social/friends/alice/bob').revision,999);});
test('Expiry is checked by server',async()=>{const f=fixture();await pending(f);f.advance(7*24*60*60*1000);await assert.rejects(f.service.respond('bob',{operation:'accept',targetUid:'alice'}));});
test('Privacy allowlist rejects unknown fields',async()=>{const f=fixture();await assert.rejects(f.service.setPrivacy('alice',{profile:'friends',characters:'friends',admin:true}),{code:'invalid-argument'});});
test('Public privacy denied',async()=>{const f=fixture();await assert.rejects(f.service.setPrivacy('alice',{profile:'public',characters:'friends'}),{code:'invalid-argument'});});
test('Explicit consent publishes sanitized character only',async()=>{const f=fixture();await f.service.setPrivacy('alice',{profile:'friends',characters:'friends'});const view=f.read('social/characterViews/alice/knight');assert.equal(view.heroName,'Thorin');assert.equal(view.gold,undefined);assert.equal(view.soloRun,undefined);assert.equal(f.read('users/alice/characters/knight').soloRun.gold,999);});
test('Private settings delete published views',async()=>{const f=fixture();await f.service.setPrivacy('alice',{profile:'friends',characters:'friends'});await f.service.setPrivacy('alice',{profile:'private',characters:'private'});assert.equal(f.read('social/profiles/alice'),null);assert.equal(f.read('social/characterViews/alice/knight'),null);});
test('Missing character removes stale view on refresh',async()=>{const f=fixture();await f.service.setPrivacy('alice',{profile:'friends',characters:'friends'});f.write('users/alice/characters/knight',null);await f.service.publishOwner('alice');assert.equal(f.read('social/characterViews/alice/knight'),null);});
test('Per-account operation quota enforced',async()=>{const f=fixture({limit:2});await f.service.getCode('alice');await f.service.getCode('alice');await assert.rejects(f.service.getCode('alice'),{code:'resource-exhausted'});});
test('Quota resets in next minute',async()=>{const f=fixture({limit:1});await f.service.getCode('alice');f.advance(60000);await f.service.getCode('alice');});
