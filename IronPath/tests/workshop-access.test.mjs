import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {parseOptIn,rememberOptIn,rememberedOptIn,allowListed,accessReason,accessGranted,ACCESS_STORAGE_KEY} from '../workshop-access.mjs';

const memory=()=>{const data=new Map();return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key),data};};

test('the query switch accepts the alpha spellings and ignores everything else',()=>{
 assert.equal(parseOptIn('?workshop=alpha'),true);
 assert.equal(parseOptIn('?workshop=1'),true);
 assert.equal(parseOptIn('?workshop=ON'),true);
 assert.equal(parseOptIn('?workshop=true'),true);
 assert.equal(parseOptIn('?workshop=off'),false,'a wrong value turns the local switch back off');
 assert.equal(parseOptIn('?workshop='),false);
 assert.equal(parseOptIn(''),null,'no parameter means no change');
 assert.equal(parseOptIn('?other=1'),null);
});

test('the opt-in is remembered in local storage and survives a bad storage',()=>{
 const storage=memory();
 assert.equal(rememberedOptIn(storage),false);
 assert.equal(rememberOptIn(storage,true),true);assert.equal(rememberedOptIn(storage),true);assert.equal(storage.data.get(ACCESS_STORAGE_KEY),'1');
 assert.equal(rememberOptIn(storage,false),false);assert.equal(rememberedOptIn(storage),false);
 assert.equal(rememberOptIn(null,true),null);
 const broken={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
 assert.equal(rememberedOptIn(broken),false,'blocked storage never grants access');
 assert.equal(rememberOptIn(broken,true),null);
});

test('the allow-list needs an explicit true and fails closed',async()=>{
 const db={},make=value=>async ref=>({val:()=>value});
 assert.equal(await allowListed({get:async r=>({val:()=>true}),ref:(_db,path)=>path},db,'alice'),true);
 assert.equal(await allowListed({get:async r=>({val:()=>'true'}),ref:(_db,path)=>path},db,'alice'),false,'strings are not accepted');
 assert.equal(await allowListed({get:async()=>({val:()=>null}),ref:(_db,path)=>path},db,'alice'),false);
 assert.equal(await allowListed({get:async()=>{throw Error('permission denied');},ref:(_db,path)=>path},db,'alice'),false,'a denied read is not access');
 assert.equal(await allowListed({ref:(_db,path)=>path},db,'alice'),false);
 assert.equal(await allowListed({get:make(true),ref:(_db,path)=>path},db,''),false);
 assert.equal(await allowListed({get:make(true),ref:(_db,path)=>path},db,null),false);
});

test('the release gate always wins and access needs a real reason',()=>{
 assert.equal(accessReason({}),'release-gate');
 assert.equal(accessGranted({optIn:true,allowListed:true}),false,'nothing opens while the gate is off');
 assert.equal(accessReason({releaseReady:true}),'closed');
 assert.equal(accessReason({releaseReady:true,optIn:true}),'local-opt-in');
 assert.equal(accessReason({releaseReady:true,allowListed:true}),'allow-list');
 assert.equal(accessGranted({releaseReady:true,optIn:true}),true);
 assert.equal(accessGranted({releaseReady:true}),false);
});
