import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {probeUnconfiguredSession} from '../release-tools/smoke-unconfigured.mjs';

const endpoint='https://release.example.test/api/session';
const response=(body='{"status":"unavailable"}',overrides={})=>new Response(body,{
  status:503,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',
    'x-content-type-options':'nosniff'},...overrides
});

test('unconfigured probe sends only synthetic requests and requires a fail-closed response',async()=>{
  const calls=[];
  const result=await probeUnconfiguredSession(endpoint,{fetcher:async(url,options)=>{
    calls.push({url,options});return response();
  }});
  assert.deepEqual(result,[{method:'GET',status:503},{method:'OPTIONS',status:503},{method:'POST',status:503}]);
  assert.deepEqual(calls.map(call=>call.options.method),['GET','OPTIONS','POST']);
  for(const call of calls){
    assert.equal(call.url,endpoint);assert.equal(call.options.credentials,'omit');
    assert.equal(call.options.redirect,'error');assert.equal(call.options.cache,'no-store');
    assert.equal(call.options.referrerPolicy,'no-referrer');
  }
  assert.equal(calls[2].options.headers.authorization,'Bearer synthetic-invalid-probe');
  assert.deepEqual(JSON.parse(calls[2].options.body),{build:'smoke-test'});
});

test('probe rejects unsafe endpoints before sending any request',async()=>{
  for(const value of ['', 'http://release.example.test/api/session',
    'https://u:p@release.example.test/api/session','https://release.example.test:8080/api/session',
    'https://release.example.test/api/session?key=secret','https://release.example.test/api/session#x',
    'https://release.example.test/api/other']){
    await assert.rejects(probeUnconfiguredSession(value,{fetcher:()=>{throw Error('must not fetch');}}),/Invalid session endpoint/);
  }
});

test('probe rejects wrong status, headers, payload and oversized JSON',async()=>{
  const wrong=[
    response('{}',{status:200}),
    response('{"status":"unavailable"}',{headers:{'content-type':'text/html','cache-control':'no-store','x-content-type-options':'nosniff'}}),
    response('{"status":"unavailable"}',{headers:{'content-type':'application/json','cache-control':'max-age=60','x-content-type-options':'nosniff'}}),
    response('{"status":"unavailable","token":"not-allowed"}'),
    response('x'.repeat(1025)),
    response('{')
  ];
  for(const item of wrong) await assert.rejects(probeUnconfiguredSession(endpoint,{fetcher:async()=>item}));
});

test('probe times out even when a transport ignores abort',async()=>{
  let signal;
  await assert.rejects(probeUnconfiguredSession(endpoint,{timeoutMs:10,fetcher:(_url,options)=>{
    signal=options.signal;return new Promise(()=>{});
  }}),/Probe timed out/);
  assert.equal(signal.aborted,true);
});
