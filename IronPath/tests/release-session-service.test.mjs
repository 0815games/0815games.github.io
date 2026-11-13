import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {controlUrl, createFreshControlReader, createConfiguredSessionExchange} from '../release-tools/session-service.mjs';

const databaseUrl='https://demo-test-default-rtdb.europe-west1.firebasedatabase.app';
const control={mode:'open',build:'release-1',epoch:'a'.repeat(32),authAfterMs:1000000};
const json=value=>new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}});

test('control URL is pinned to an HTTPS Firebase database root',()=>{
 assert.equal(controlUrl(databaseUrl),'https://demo-test-default-rtdb.europe-west1.firebasedatabase.app/_ironpathRelease.json');
 assert.equal(controlUrl('https://demo-test.firebaseio.com/'),'https://demo-test.firebaseio.com/_ironpathRelease.json');
 for(const url of ['', 'http://demo-test.firebaseio.com', 'https://u:p@demo-test.firebaseio.com',
  'https://demo-test.firebaseio.com:8080', 'https://demo-test.firebaseio.com/path',
  'https://demo-test.firebaseio.com?auth=secret', 'https://demo-test.firebaseio.com#fragment',
  'https://demo-test.firebaseio.com.attacker.example', 'https://firebasedatabase.app', 'https://127.0.0.1']){
  assert.throws(()=>controlUrl(url),/Invalid Firebase database URL/,url);
 }
});

test('the service reads public status freshly and requires Admin revoked-token verification',async()=>{
 const requests=[],verified=[],signed=[];
 const service=createConfiguredSessionExchange({databaseUrl,now:()=>1002000,
  fetcher:async(...args)=>{requests.push(args);return json(control);},
  adminAuth:{verifyIdToken:async(...args)=>{verified.push(args);return {uid:'alice',auth_time:1001,firebase:{sign_in_provider:'password'}};},
   createCustomToken:async(...args)=>{signed.push(args);return 'signed-custom-token';}}
 });
 assert.deepEqual(await service.exchange({idToken:'valid-password-token',build:'release-1'}),{status:'ok',customToken:'signed-custom-token'});
 assert.equal(requests.length,3);
 for(const [url,options] of requests){
  assert.equal(url,controlUrl(databaseUrl));assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');
  assert.equal(options.credentials,'omit');assert.match(options.headers['cache-control'],/no-cache/);
 }
 assert.deepEqual(verified,[['valid-password-token',true]]);
 assert.deepEqual(signed,[['alice',{ip_release_epoch:control.epoch}]]);
});

test('invalid status, failed upstream, oversized bodies and invalid UTF-8 fail closed',async()=>{
 const options={databaseUrl,timeoutMs:30};
 const values=[
  ()=>new Response('error',{status:503}),
  ()=>new Response('{broken'),
  ()=>new Response('x'.repeat(2049)),
  ()=>new Response('small',{headers:{'content-length':'2049'}}),
  ()=>new Response(new Uint8Array([0xff,0xfe])),
  ()=>Promise.reject(Error('offline')),
  ()=>new Promise(()=>{})
 ];
 for(const fetcher of values){
  const read=createFreshControlReader({...options,fetcher});
  await assert.rejects(read());
 }
 const service=createConfiguredSessionExchange({...options,fetcher:async()=>json(null),
  adminAuth:{verifyIdToken:()=>{throw Error('must not verify');},createCustomToken:()=>{throw Error('must not sign');}}});
 assert.deepEqual(await service.exchange({idToken:'x',build:'release-1'}),{status:'unavailable'});
});

test('control changes during Admin verification never produce a new token',async()=>{
 let current=control, mints=0;
 const service=createConfiguredSessionExchange({databaseUrl,now:()=>1002000,fetcher:async()=>json(current),
  adminAuth:{verifyIdToken:async()=>{current={...control,mode:'maintenance',epoch:'b'.repeat(32)};return {uid:'alice',auth_time:1001,firebase:{sign_in_provider:'password'}};},
   createCustomToken:async()=>{mints++;return 'should-not-escape';}}
 });
 assert.deepEqual(await service.exchange({idToken:'x',build:'release-1'}),{status:'unavailable'});assert.equal(mints,0);
});
