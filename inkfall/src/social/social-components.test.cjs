"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const {create:createClient,createRtdbActions}=require('./social-client.js');
const {create:createStore}=require('./social-store.js');
function adapter(){let onData,onError,stops=0;const wait=[];return {has:()=>false,watch(uid,data,error){onData=data;onError=error;return()=>stops++;},getProfile(uid){return new Promise(resolve=>wait.push({uid,resolve}));},getCharacter(uid,classId){return new Promise(resolve=>wait.push({uid,classId,resolve}));},invoke(){throw Error('unexpected');},emit(value){onData(value);},fail(){onError(Error('denied'));},get wait(){return wait;},get stops(){return stops;}};}
const roster={available:true,friends:[{uid:'bob'},{uid:'carol'}],requests:[]};
function fakeDb(){
 const data={};
 function setPath(path,value){
  const parts=path.split('/').filter(Boolean);let node=data;
  for(let i=0;i<parts.length-1;i++){const key=parts[i];if(value===null&&i===parts.length-2){delete node[key];return;}node[key]??={};node=node[key];}
  const key=parts.at(-1);if(value===null)delete node[key];else node[key]=value;
 }
 return {data,ref(path){return {
  async get(){const value=path.split('/').filter(Boolean).reduce((node,key)=>node?.[key],data);return {val:()=>value===undefined?null:value};},
  update(patch){for(const [key,value] of Object.entries(patch))setPath(key,value);},
  set(value){setPath(path,value);},
  remove(){setPath(path,null);},
  on(){return;},off(){return;}
 };}};
}
function user(uid){return {uid};}
test('Unconfigured client shows no fake friends',()=>{const c=createClient();let data;c.watch('alice',x=>data=x,()=>{});assert.equal(data.available,false);assert.deepEqual(data.friends,[]);assert.equal(c.has('invite'),false);});
test('No database write API in client',()=>{const c=createClient();assert.equal(c.set,undefined);assert.equal(c.update,undefined);assert.equal(c.remove,undefined);});
test('Disabled action rejects',async()=>{await assert.rejects(createClient().invoke('invite',{}),/backend-unavailable/);});
test('Invalid character class denied',async()=>{await assert.rejects(createClient({enabled:true}).getCharacter('bob','admin'));});
test('RTDB actions require database',()=>{assert.throws(()=>createRtdbActions({getUser:()=>user('alice')}),/backend-unavailable/);});
test('getCode reserves a matching friend code',async()=>{
 const db=fakeDb();const actions=createRtdbActions({db,getUser:()=>user('alice')});
 const first=await actions.getCode();assert.match(first.friendCode,/^[A-Za-z0-9_-]{24}$/);
 assert.equal(db.data.social.codeLookup[first.friendCode],'alice');
 const second=await actions.getCode();assert.equal(second.friendCode,first.friendCode);
});
test('requestByCode creates a pending relationship and request indexes',async()=>{
 const db=fakeDb();db.data.social={ownCodes:{bob:'BOB'.padEnd(24,'B')},codeLookup:{'BOB'.padEnd(24,'B'):'bob'},profiles:{bob:{displayName:'Bob'}}};
 const actions=createRtdbActions({db,getUser:()=>user('alice')});
 const result=await actions.requestByCode({friendCode:'BOB'.padEnd(24,'B')});
 assert.equal(result.status,'pending');
 const relationship=Object.values(db.data.social.relationships)[0];
 assert.equal(relationship.status,'pending');assert.equal(relationship.requestedBy,'alice');
 assert.equal(db.data.social.requests.bob.alice.active,true);
 assert.equal(db.data.social.sentRequests.alice.bob.active,true);
 assert.equal(db.data.social.friends.alice.bob.active,false);
});
test('Recipient accept activates friendship and clears requests',async()=>{
 const db=fakeDb();db.data.social={ownCodes:{alice:'A'.padEnd(24,'A')},codeLookup:{'A'.padEnd(24,'A'):'alice'},relationships:{alice:{bob:{a:'alice',b:'bob',status:'pending',requestedBy:'alice',requesterName:'Alice',requestedAt:1,expiresAt:9999999999999,revision:1,updatedAt:1}}}};
 const actions=createRtdbActions({db,getUser:()=>user('bob')});
 const result=await actions.accept({targetUid:'alice'});
 assert.equal(result.status,'friends');
 const relationship=db.data.social.relationships.alice.bob;
 assert.equal(relationship.status,'friends');assert.equal(relationship.revision,2);
 assert.equal(db.data.social.friends.alice.bob.active,true);
 assert.equal(db.data.social.friends.bob.alice.active,true);
 assert.equal(db.data.social.requests.bob.alice.active,false);
 assert.equal(db.data.social.sentRequests.alice.bob.active,false);
});
test('Decline and cancel reset the relationship',async()=>{
 const db=fakeDb();db.data.social={relationships:{alice:{bob:{a:'alice',b:'bob',status:'pending',requestedBy:'alice',requesterName:'Alice',requestedAt:1,expiresAt:9999999999999,revision:1,updatedAt:1}}}};
 const recipient=createRtdbActions({db,getUser:()=>user('bob')});
 await recipient.decline({targetUid:'alice'});
 assert.equal(db.data.social.relationships.alice.bob.status,'none');
 db.data.social.relationships.alice.bob={a:'alice',b:'bob',status:'pending',requestedBy:'bob',requesterName:'Bob',requestedAt:1,expiresAt:9999999999999,revision:2,updatedAt:2};
 const sender=createRtdbActions({db,getUser:()=>user('bob')});
 await sender.cancel({targetUid:'alice'});
 assert.equal(db.data.social.relationships.alice.bob.status,'none');
});
test('Remove requires an existing friendship',async()=>{
 const db=fakeDb();db.data.social={relationships:{alice:{bob:{a:'alice',b:'bob',status:'friends',revision:3,updatedAt:1}}}};
 const actions=createRtdbActions({db,getUser:()=>user('alice')});
 const result=await actions.remove({targetUid:'bob'});
 assert.equal(result.status,'none');
 assert.equal(db.data.social.friends.alice.bob.active,false);
 await assert.rejects(actions.remove({targetUid:'bob'}),/not-friends/);
});
test('Privacy values are stored for the signed-in user',async()=>{
 const db=fakeDb();const actions=createRtdbActions({db,getUser:()=>user('alice')});
 const result=await actions.setPrivacy({profile:'friends',characters:'private'});
 assert.deepEqual(result,{profile:'friends',characters:'private'});
 assert.deepEqual(db.data.social.privacy.alice,{profile:'friends',characters:'private'});
});
test('Block and unblock write only the owner mapping',async()=>{
 const db=fakeDb();const actions=createRtdbActions({db,getUser:()=>user('alice')});
 await actions.block({targetUid:'mallory'});assert.equal(db.data.social.blocks.alice.mallory,true);
 await actions.unblock({targetUid:'mallory'});assert.equal(db.data.social.blocks.alice.mallory,undefined);
});
test('Logout clears private UI data and listeners',async()=>{const c=adapter(),s=createStore(c);s.setUser('alice');c.emit(roster);const p=s.selectFriend('bob');c.wait[0].resolve({displayName:'Bob'});await p;s.setUser(null);assert.equal(s.snapshot().profile,null);assert.equal(s.snapshot().uid,null);assert.deepEqual(s.snapshot().friends,[]);assert.equal(c.stops,1);});
test('Late profile response after logout ignored',async()=>{const c=adapter(),s=createStore(c);s.setUser('alice');c.emit(roster);const p=s.selectFriend('bob');s.setUser(null);c.wait[0].resolve({displayName:'private'});await p;assert.equal(s.snapshot().profile,null);});
test('Late profile cannot overwrite newer selection',async()=>{const c=adapter(),s=createStore(c);s.setUser('alice');c.emit(roster);const first=s.selectFriend('bob'),second=s.selectFriend('carol');c.wait[1].resolve({displayName:'Carol'});await second;c.wait[0].resolve({displayName:'Bob'});await first;assert.equal(s.snapshot().profile.displayName,'Carol');});
test('Removed friendship clears profile and pending response',async()=>{const c=adapter(),s=createStore(c);s.setUser('alice');c.emit(roster);const p=s.selectFriend('bob');c.emit({available:true,friends:[],requests:[]});c.wait[0].resolve({displayName:'Bob'});await p;assert.equal(s.snapshot().selectedUid,null);assert.equal(s.snapshot().profile,null);});
test('Cannot inspect nonfriend',async()=>{const c=adapter(),s=createStore(c);s.setUser('alice');c.emit(roster);await s.selectFriend('mallory');assert.equal(c.wait.length,0);});
test('Permission error clears data',()=>{const c=adapter(),s=createStore(c);s.setUser('alice');c.emit(roster);c.fail();assert.deepEqual(s.snapshot().friends,[]);assert.equal(s.snapshot().available,false);});
test('Observers receive isolated snapshots',()=>{const c=adapter(),s=createStore(c);s.setUser('alice');c.emit(roster);const snap=s.snapshot();snap.friends.length=0;assert.equal(s.snapshot().friends.length,2);});
test('Disabling backend blocks action',async()=>{const c=adapter(),s=createStore(c);s.setUser('alice');assert.equal(await s.action('remove',{targetUid:'bob'}),false);});
test('Late character response ignored after selection change',async()=>{const c=adapter(),s=createStore(c);s.setUser('alice');c.emit(roster);const p=s.selectFriend('bob');c.wait[0].resolve({displayName:'Bob'});await p;const character=s.selectCharacter('knight');const second=s.selectFriend('carol');c.wait[1].resolve({heroName:'Bobs secret'});await character;c.wait[2].resolve({displayName:'Carol'});await second;assert.equal(s.snapshot().character,null);});
test('Live privacy revocation removes character',async()=>{const c=adapter();let profileError,charData,profileStops=0,charStops=0;c.watchProfile=(uid,data,error)=>{profileError=error;data({displayName:'Bob'});return()=>profileStops++;};c.watchCharacter=(uid,id,data)=>{charData=data;return()=>charStops++;};const s=createStore(c);s.setUser('alice');c.emit(roster);await s.selectFriend('bob');await s.selectCharacter('knight');charData({level:3});profileError();assert.equal(s.snapshot().profile,null);assert.equal(s.snapshot().character,null);assert.equal(charStops,1);s.setUser(null);assert.equal(profileStops,1);});
test('Live character permission error clears sheet',async()=>{const c=adapter();let denied;c.watchCharacter=(uid,id,data,error)=>{data({level:5});denied=error;return()=>{};};const s=createStore(c);s.setUser('alice');c.emit(roster);const p=s.selectFriend('bob');c.wait[0].resolve({displayName:'Bob'});await p;await s.selectCharacter('mage');denied();assert.equal(s.snapshot().character,null);});
