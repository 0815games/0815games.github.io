import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readRecoveryFromServer} from '../firebase-recovery-server-read.mjs';
import {createFirebaseRecoveryStore} from '../firebase-recovery-store.mjs';
import {createPartyHost} from '../party-host.mjs';
import {createMatch} from '../simulation.mjs';
import {createPlayer} from '../match.mjs';
import {webcrypto} from 'node:crypto';

const reference={toString:()=> 'https://test-default-rtdb.europe-west1.firebasedatabase.app/path/to/session'};
const auth=()=>({currentUser:{uid:'alice',getIdToken:async()=>'secret-token'}});
test('server reads use authenticated no-cache REST requests without leaking tokens in errors',async()=>{
 const identity=auth();let request;
 const result=await readRecoveryFromServer(reference,identity,{fetcher:async(url,options)=>{request={url:new URL(url),options};return {ok:true,json:async()=>({generation:3})};}});
 assert.deepEqual(result,{generation:3});assert.equal(request.url.pathname,'/path/to/session.json');assert.equal(request.url.searchParams.get('auth'),'secret-token');assert.equal(request.options.cache,'no-store');assert.equal(request.options.credentials,'omit');assert.equal(request.options.redirect,'error');
 await assert.rejects(readRecoveryFromServer(reference,identity,{fetcher:async url=>{throw Error(`network failed ${url}`);}}),e=>e.message==='Server checkpoint read failed'&&!e.message.includes('secret-token'));
 await assert.rejects(readRecoveryFromServer(reference,identity,{fetcher:async()=>({ok:false})}),/Server checkpoint read failed/);
});
test('server reads fail closed on identity changes and unsafe URLs',async()=>{
 const identity=auth();await assert.rejects(readRecoveryFromServer(reference,identity,{fetcher:async()=>{identity.currentUser={uid:'alice'};return {ok:true};}}),/Server checkpoint read failed/);
 await assert.rejects(readRecoveryFromServer({toString:()=> 'http://remote.example/session'},auth(),{fetcher:async()=>{throw Error('must not fetch');}}),/Invalid recovery database URL/);
});
test('takeover reads the fenced previous session through the server reader, never SDK cached get',async()=>{
 const data=new Map(),uid='alice',partyId='a'.repeat(32),ids=['alice','bob'],host=createPartyHost(createMatch(ids.map(id=>createPlayer(id,{name:id,gender:'female'}))),{hostId:uid}),views=Object.fromEntries(ids.map(id=>[id,{ready:false}]));
 const sdk={ref:(_db,path)=>path,onValue:(_p,cb)=>{queueMicrotask(cb);return ()=>{};},get:()=>{throw Error('cached SDK read must not be used');},runTransaction:async(path,update)=>{const next=update(data.get(path)??null);if(next===undefined)return {committed:false};data.set(path,next);return {committed:true};}};
 const seen=[],store=createFirebaseRecoveryStore({db:{},auth:{currentUser:{uid}},sdk,partyId,manifest:{hostId:uid,playerIds:ids,mode:'coop'},crypto:webcrypto,readFresh:async path=>{seen.push(path);return data.get(path)??null;}});
 const first=await store.initialize(host.checkpoint(),views),second=await store.claim(first.generation);assert.deepEqual(second.checkpoint,host.checkpoint());assert.deepEqual(seen,[`fourParties/${partyId}/recovery/sessions/${first.owner}`]);
});
test('takeover cannot restore an SDK-cached checkpoint after a server read fails',async()=>{
 const data=new Map(),uid='alice',partyId='b'.repeat(32),ids=['alice','bob'],host=createPartyHost(createMatch(ids.map(id=>createPlayer(id,{name:id,gender:'female'}))),{hostId:uid}),views=Object.fromEntries(ids.map(id=>[id,{ready:false}]));
 const sdk={ref:(_db,path)=>path,onValue:(_p,cb)=>{queueMicrotask(cb);return ()=>{};},get:()=>{throw Error('cached SDK read must not be used');},runTransaction:async(path,update)=>{const next=update(data.get(path)??null);if(next===undefined)return {committed:false};data.set(path,next);return {committed:true};}};
 const store=createFirebaseRecoveryStore({db:{},auth:{currentUser:{uid}},sdk,partyId,manifest:{hostId:uid,playerIds:ids,mode:'coop'},crypto:webcrypto,readFresh:async()=>{throw Error('offline');}});const first=await store.initialize(host.checkpoint(),views);await assert.rejects(store.claim(first.generation),/offline/);assert.equal(data.get(`fourParties/${partyId}/recovery/lease`).generation,2,'interrupted takeover remains a known blocker');assert.equal([...data.keys()].filter(k=>k.includes('/sessions/')).length,1);
});
