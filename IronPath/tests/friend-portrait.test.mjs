import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {watchFriendPortrait,FRIEND_PORTRAIT_PLACEHOLDER} from '../friend-portrait.mjs';
import {decodeAvatar,encodeAvatar,looksFor} from '../avatar.mjs';
import {layerOptions} from '../avatar-layers.mjs';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
const image=id=>`data:image/png;base64,${id}`;
function fixture(){
 const listeners=new Map(),stops=[],renders=[],seen=[],auth={currentUser:{uid:'alice'}};
 const sdk={ref:(_db,path)=>path,onValue(path,change,error){const entry={change,error,stopped:false};listeners.set(path,entry);return()=>{entry.stopped=true;stops.push(path);};}};
 const render=(_document,avatar)=>{const job={avatar};job.promise=new Promise((resolve,reject)=>Object.assign(job,{resolve,reject}));renders.push(job);return job.promise;};
 const options={db:{},auth,sdk,id:'bob',document:{},onChange:url=>seen.push(url),render};
 const emit=(field,value)=>listeners.get(`players/bob/${field}`).change({val:()=>value});
 return {listeners,stops,renders,seen,auth,options,emit,watch:()=>watchFriendPortrait(options)};
}

test('only portrait child fields are watched and legacy looks use the same avatar decoder',async()=>{
 const f=fixture(),stop=f.watch();
 assert.deepEqual([...f.listeners.keys()].sort(),['players/bob/avatar','players/bob/gender']);
 assert.deepEqual(f.seen,[FRIEND_PORTRAIT_PLACEHOLDER]);
 f.emit('gender','male');f.emit('avatar','g:m|look:beard');await flush();
 assert.deepEqual(f.renders[0].avatar,{gender:'male',faceId:'buzz',hairId:null,beardId:'full'});
 f.renders[0].resolve(image('Qk9C'));await flush();assert.equal(f.seen.at(-1),image('Qk9C'));
 stop();assert.deepEqual(f.stops.sort(),['players/bob/avatar','players/bob/gender']);
});

test('missing, malformed or denied fields keep the neutral placeholder',async()=>{
 const f=fixture(),stop=f.watch();f.emit('gender','female');
 for(const value of [null,42,'','not-an-avatar','g:f|'+('x:1|'.repeat(10)),
  'g:f|face:unknown','g:f|look:buzz','g:f|hair:bob','g:f|face:crop|hair:unknown',
  'g:f|face:crop|beard:full','g:m|face:buzz','g:f|face:crop|face:bun',
  'g:f|look:bob|hair:long','g:f|face:crop|g:m','g:f|face:crop|invalid'])f.emit('avatar',value);
 await flush();assert.equal(f.renders.length,0);assert.equal(f.seen.at(-1),FRIEND_PORTRAIT_PLACEHOLDER);
 f.emit('avatar','g:f|face:crop|hair:bob');await flush();f.renders[0].resolve(image('QQ=='));await flush();
 assert.equal(f.seen.at(-1),image('QQ=='));
 f.listeners.get('players/bob/avatar').error(Error('permission denied'));assert.equal(f.seen.at(-1),FRIEND_PORTRAIT_PLACEHOLDER);
 f.emit('avatar','g:f|face:bun');await flush();assert.equal(f.renders.length,1,'a terminated listener cannot restore a revoked image');stop();
});

test('every current layered selection and recognized legacy look uses the owner decoder',async()=>{
 for(const gender of ['female','male']){
  const {faces,hairs,beards}=layerOptions(gender),cases=[];
  for(const face of faces)for(const hair of [null,...hairs])for(const beard of [null,...beards])
   cases.push(encodeAvatar({gender,faceId:face.id,hairId:hair?.id??null,beardId:beard?.id??null}));
  for(const look of looksFor(gender))cases.push(`g:${gender[0]}|look:${look.id}`);
  for(const encoded of cases){
   const f=fixture(),stop=f.watch();f.emit('gender',gender);f.emit('avatar',encoded);await flush();
   assert.equal(f.renders.length,1,encoded);assert.deepEqual(f.renders[0].avatar,decodeAvatar(encoded,gender),encoded);stop();
  }
 }
});

test('late compositions, unsubscribe and account changes cannot replace a current portrait',async()=>{
 const f=fixture(),stop=f.watch();f.emit('gender','male');f.emit('avatar','g:m|face:buzz|hair:short');await flush();
 f.emit('avatar','g:m|face:buzz|beard:full');await flush();assert.equal(f.renders.length,2);
 f.renders[1].resolve(image('TkVX'));await flush();assert.equal(f.seen.at(-1),image('TkVX'));
 f.renders[0].resolve(image('T0xE'));await flush();assert.equal(f.seen.at(-1),image('TkVX'),'the older rendering is fenced');
 f.emit('avatar','g:m|face:short');await flush();f.auth.currentUser={uid:'eve'};f.renders[2].resolve(image('RVZF'));await flush();
 assert.equal(f.seen.at(-1),FRIEND_PORTRAIT_PLACEHOLDER,'a different session receives no old result');
 stop();const count=f.seen.length;f.emit('avatar','g:m|face:buzz');assert.equal(f.seen.length,count,'stale SDK callbacks are ignored after closing');
});

test('failed rendering, unsafe URLs and invalid identities fail safely',async()=>{
 const f=fixture(),stop=f.watch();f.emit('gender','female');f.emit('avatar','g:f|face:crop');await flush();
 f.renders[0].resolve('https://example.invalid/tracking.png');await flush();assert.equal(f.seen.at(-1),FRIEND_PORTRAIT_PLACEHOLDER);
 f.emit('avatar','g:f|face:bun');await flush();f.renders[1].reject(Error('missing layer'));await flush();assert.equal(f.seen.at(-1),FRIEND_PORTRAIT_PLACEHOLDER);stop();
 for(const id of ['alice','bob/other','',null])assert.throws(()=>watchFriendPortrait({...f.options,id}),/Invalid friend/);
});
