import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {parseReleaseControl, sameRelease} from '../release-tools/release-control.mjs';
import {createReleaseSessionExchange} from '../release-tools/session-exchange.mjs';
import http from 'node:http';
import {createReleaseSessionHttpHandler,createReleaseSessionHttpServer} from '../release-tools/session-http.mjs';

const base = Object.freeze({mode:'open', build:'release-2', epoch:'0123456789abcdef0123456789abcdef', authAfterMs:1000000});
const identity = Object.freeze({uid:'alice', auth_time:1001, firebase:{sign_in_provider:'password'}});
const setup = (overrides={}) => {
  let control = structuredClone(base), reads=0, verifies=[], mints=[];
  const service = createReleaseSessionExchange({
    readControl:async()=>{reads++;return control;},
    verifyIdToken:async(...args)=>{verifies.push(args);return identity;},
    mintCustomToken:async(...args)=>{mints.push(args);return 'signed-custom-token';},
    now:()=>1002000, ...overrides
  });
  return {service, setControl:value=>control=value, get reads(){return reads;}, verifies, mints};
};
const request = {idToken:'firebase-id-token', build:'release-2'};

test('release record fails closed when required fields are missing or malformed', () => {
  assert.deepEqual(parseReleaseControl(base), base);
  for (const value of [null, {}, [], {...base,mode:'other'}, {...base,epoch:'x'}, {...base,epoch:'A'.repeat(32)},
    {...base,build:'../other'}, {...base,build:''}, {...base,build:'a'.repeat(65)},
    {...base,authAfterMs:0}, {...base,authAfterMs:1.1}, {...base,authAfterMs:'1000000'}]) {
    assert.equal(parseReleaseControl(value), null);
  }
  assert.equal(sameRelease(parseReleaseControl(base), parseReleaseControl({...base})), true);
  assert.equal(sameRelease(parseReleaseControl(base), parseReleaseControl({...base,authAfterMs:1001000})), false);
});

test('a fresh verified password ID token is exchanged for a release-bound custom token', async () => {
  const h=setup();
  assert.deepEqual(await h.service.exchange(request), {status:'ok', customToken:'signed-custom-token'});
  assert.deepEqual(h.verifies, [['firebase-id-token', true]], 'revocation check is mandatory');
  assert.deepEqual(h.mints, [['alice', {ip_release_epoch:base.epoch}]]);
  assert.equal(h.reads, 3, 'control checked before verification, signing and return');
});

test('maintenance, unknown state, wrong build and invalid input fail before signing', async () => {
  const h=setup();
  for (const input of [null, [], {}, {...request,idToken:''}, {...request,idToken:'x y'}, {...request,build:'../v2'}, {...request,idToken:'x'.repeat(8193)}]) {
    assert.equal((await h.service.exchange(input)).status,'invalid');
  }
  h.setControl(null); assert.equal((await h.service.exchange(request)).status,'unavailable');
  h.setControl({...base, mode:'maintenance'}); assert.equal((await h.service.exchange(request)).status,'maintenance');
  h.setControl({...base, build:'release-3'}); assert.equal((await h.service.exchange(request)).status,'outdated');
  assert.equal(h.verifies.length,0); assert.equal(h.mints.length,0);
});

test('old, anonymous, tenant, custom, future and unverified sessions cannot be upgraded', async () => {
  for (const user of [
    {...identity,auth_time:1000}, {...identity,auth_time:999}, {...identity,auth_time:undefined},
    {...identity,auth_time:701}, {...identity,auth_time:1033}, {...identity,uid:''},
    {...identity,firebase:{sign_in_provider:'anonymous'}}, {...identity,firebase:{sign_in_provider:'custom'}},
    {...identity,firebase:{sign_in_provider:'password',tenant:'other'}}
  ]) {
    const h=setup({verifyIdToken:async()=>user});
    assert.equal((await h.service.exchange(request)).status,'unauthorized');
    assert.equal(h.mints.length,0);
  }
  const rejected=setup({verifyIdToken:async()=>{throw Error('revoked or offline');}});
  assert.equal((await rejected.service.exchange(request)).status,'unauthorized');
  assert.equal(rejected.mints.length,0);
});

test('a closure or changed epoch during verification or signing never returns a token', async () => {
  let control=structuredClone(base), calls=0;
  const duringVerify=createReleaseSessionExchange({
    readControl:async()=>control,
    verifyIdToken:async()=>{control={...base,mode:'maintenance',epoch:'f'.repeat(32)};return identity;},
    mintCustomToken:async()=>{calls++;return 'must-not-escape';},now:()=>1002000
  });
  assert.equal((await duringVerify.exchange(request)).status,'unavailable'); assert.equal(calls,0);
  control=structuredClone(base);
  const duringMint=createReleaseSessionExchange({
    readControl:async()=>control,verifyIdToken:async()=>identity,
    mintCustomToken:async()=>{control={...base,epoch:'f'.repeat(32)};return 'must-not-escape';},now:()=>1002000
  });
  assert.deepEqual(await duringMint.exchange(request),{status:'unavailable'});
  const missing=setup({readControl:async()=>{throw Error('no server');}});
  assert.equal((await missing.service.exchange(request)).status,'unavailable');
  const signer=setup({mintCustomToken:async()=>{throw Error('signer unavailable');}});
  assert.equal((await signer.service.exchange(request)).status,'unavailable');
});

test('HTTP adapter enforces route, origin, bounded body, bearer tokens and no-store', async () => {
  const h=setup();
  assert.throws(()=>createReleaseSessionHttpServer({exchange:h.service,allowedOrigins:['http://example.com']}),/Invalid origin/);
  const server=createReleaseSessionHttpServer({exchange:h.service,allowedOrigins:['https://0815games.github.io']});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const headers={origin:'https://0815games.github.io', authorization:'Bearer firebase-id-token', 'content-type':'application/json'};
  try {
    let r=await fetch(`${url}/v1/session`,{method:'OPTIONS',headers:{origin:headers.origin,'access-control-request-method':'POST'}});
    assert.equal(r.status,204); assert.equal(r.headers.get('access-control-allow-origin'),headers.origin);
    r=await fetch(`${url}/v1/session`,{method:'POST',headers,body:JSON.stringify({build:request.build})});
    assert.equal(r.status,200); assert.deepEqual(await r.json(),{status:'ok',customToken:'signed-custom-token'});
    assert.equal(r.headers.get('cache-control'),'no-store'); assert.match(r.headers.get('vary'),/Origin/);
    r=await fetch(`${url}/v1/session?token=secret`,{method:'POST',headers,body:'{}'}); assert.equal(r.status,404);
    r=await fetch(`${url}/v1/session`,{method:'POST',headers:{...headers,origin:'https://example.com'},body:'{}'}); assert.equal(r.status,403); assert.equal(r.headers.get('access-control-allow-origin'),null);
    r=await fetch(`${url}/v1/session`,{method:'GET',headers}); assert.equal(r.status,405);
    r=await fetch(`${url}/v1/session`,{method:'POST',headers:{...headers,authorization:'firebase-id-token'},body:'{}'}); assert.equal(r.status,401);
    r=await fetch(`${url}/v1/session`,{method:'POST',headers:{...headers,'content-type':'text/plain'},body:'{}'}); assert.equal(r.status,415);
    r=await fetch(`${url}/v1/session`,{method:'POST',headers,body:'x'.repeat(1025)}); assert.equal(r.status,413);
    r=await fetch(`${url}/v1/session`,{method:'POST',headers,body:JSON.stringify({build:'release-2',password:'do-not-accept'})}); assert.equal(r.status,400);
    r=await fetch(`${url}/v1/session`,{method:'POST',headers,body:JSON.stringify({build:'release-1'})}); assert.equal(r.status,409); assert.deepEqual(await r.json(),{status:'outdated'});
    h.setControl({...base,mode:'maintenance'});
    r=await fetch(`${url}/v1/session`,{method:'POST',headers,body:JSON.stringify({build:'release-2'})}); assert.equal(r.status,503); assert.deepEqual(await r.json(),{status:'maintenance'});
  } finally { await new Promise(resolve=>server.close(resolve)); }
});

test('the HTTP handler does not invoke a lazy platform body getter and rejects an already consumed stream', async () => {
  const h=setup(),handler=createReleaseSessionHttpHandler({exchange:h.service,allowedOrigins:['https://0815games.github.io']});
  let getterCalls=0;
  const server=http.createServer((req,res)=>{
    Object.defineProperty(req,'body',{get(){getterCalls++;throw Error('the getter must not be accessed');}});
    if(req.headers['x-consume-first']==='yes'){
      req.resume();req.once('end',()=>handler(req,res));
    }else handler(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/v1/session`;
  const headers={origin:'https://0815games.github.io',authorization:'Bearer firebase-id-token','content-type':'application/json'};
  try{
    let response=await fetch(url,{method:'POST',headers,body:JSON.stringify({build:request.build})});
    assert.equal(response.status,200);assert.deepEqual(await response.json(),{status:'ok',customToken:'signed-custom-token'});
    response=await fetch(url,{method:'POST',headers:{...headers,'x-consume-first':'yes'},body:JSON.stringify({build:request.build}),signal:AbortSignal.timeout(1000)});
    assert.equal(response.status,400);assert.deepEqual(await response.json(),{status:'invalid'});assert.equal(getterCalls,0);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
