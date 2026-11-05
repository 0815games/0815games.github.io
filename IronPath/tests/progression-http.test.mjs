import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createAdminProgressionService,createProgressionHttpServer} from '../server/progression-http.mjs';

test('Admin adapter verifies revocation, binds transaction path and fails closed',async()=>{
 let profile={name:'Alice',xp:0,armory:{scrap:0,owned:0,equipped:0}},verified,usedPath;
 const service=createAdminProgressionService({auth:{verifyIdToken:async(token,revoked)=>{verified=[token,revoked];return {uid:'alice'};}},db:{ref:path=>{usedPath=path;return {on:(_event,callback)=>{queueMicrotask(callback);return callback;},off:()=>{},transaction:async(fn,cb,local)=>{assert.equal(local,false);const next=fn(profile);if(next)profile=next;return {committed:!!next,snapshot:{val:()=>profile}};}};}},isUnlocked:()=>true});
 const request={token:'token',requestId:'a'.repeat(32),command:{type:'initialize'}};
 assert.equal((await service.execute(request)).status,'applied');assert.deepEqual(verified,['token',true]);assert.equal(usedPath,'players/alice');assert.equal((await service.execute(request)).status,'already-applied');
 assert.throws(()=>createAdminProgressionService({auth:{},db:{}}));
});

test('HTTP boundary enforces origin, auth, shape, size and maps outcomes',async t=>{
 const calls=[];const server=createProgressionHttpServer({allowedOrigins:['https://example.test'],service:{execute:async request=>{calls.push(request);return {status:'applied'};}}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const url=`http://127.0.0.1:${server.address().port}/progression`,headers={origin:'https://example.test',authorization:'Bearer secret','content-type':'application/json'};
 const post=(body,h=headers)=>fetch(url,{method:'POST',headers:h,body:JSON.stringify(body)});
 assert.equal((await post({requestId:'a'.repeat(32),command:{type:'initialize'}},{...headers,origin:'https://evil.test'})).status,403);
 assert.equal((await post({}, {...headers,authorization:''})).status,401);
 assert.equal((await post({requestId:'x',command:{},uid:'bob'})).status,400);
 assert.equal((await post({requestId:'x',command:{data:'a'.repeat(5000)}})).status,413);
 const response=await post({requestId:'a'.repeat(32),command:{type:'initialize'}});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(calls.length,1);assert.equal(calls[0].token,'secret');
 assert.equal((await fetch(url,{method:'OPTIONS',headers:{origin:headers.origin,'access-control-request-method':'POST'}})).status,204);
});
