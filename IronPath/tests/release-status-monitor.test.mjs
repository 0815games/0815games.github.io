import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createReleaseStatusMonitor} from '../release-tools/status-monitor.mjs';

const url='https://example.firebasedatabase.app/_ironpathRelease.json';
const open={mode:'open',build:'release-2',epoch:'a'.repeat(32),authAfter:1000};
const response=value=>new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}});

test('monitor only accepts a fixed HTTPS control path and valid timings',()=>{
  for(const statusUrl of ['', 'http://example.com/_ironpathRelease.json', 'https://u:p@example.com/_ironpathRelease.json',
    'https://example.com/_ironpathRelease.json?token=x', 'https://example.com/other.json']){
    assert.throws(()=>createReleaseStatusMonitor({statusUrl,onStatus(){},onFatal(){}}),/Invalid status URL/);
  }
  assert.throws(()=>createReleaseStatusMonitor({statusUrl:url,onStatus(){},onFatal(){},intervalMs:0}),/Invalid monitor configuration/);
  assert.throws(()=>createReleaseStatusMonitor({statusUrl:url,onStatus(){}}),/Invalid monitor configuration/,'a callback failure needs a safe teardown');
});

test('only a fresh no-store response can produce open; failures and invalid records block',async()=>{
  const events=[], requests=[];
  let next=response(open);
  const monitor=createReleaseStatusMonitor({statusUrl:url, onStatus:event=>events.push(event), onFatal(){}, intervalMs:60000,
    fetcher:async(...args)=>{requests.push(args);if(next instanceof Error)throw next;return next;}});
  monitor.start();await monitor.refresh();
  assert.deepEqual(events.map(v=>v.kind),['checking','open']);
  assert.deepEqual(events.at(-1).release,open);
  assert.equal(requests[0][0],url); assert.equal(requests[0][1].cache,'no-store');
  assert.equal(requests[0][1].credentials,'omit'); assert.equal(requests[0][1].redirect,'error');
  next=response({...open,mode:'maintenance'});await monitor.refresh();assert.equal(events.at(-1).kind,'maintenance');
  next=response(null);await monitor.refresh();assert.deepEqual(events.at(-1),{kind:'unavailable'});
  next={ok:false};await monitor.refresh();assert.deepEqual(events.at(-1),{kind:'unavailable'});
  next=new Error('offline');await monitor.refresh();assert.deepEqual(events.at(-1),{kind:'unavailable'});
  next=new Response('x'.repeat(2049));await monitor.refresh();assert.deepEqual(events.at(-1),{kind:'unavailable'});
  monitor.stop();
});

test('hanging requests time out, abort and stay blocked',async()=>{
  const events=[];let signal;
  const monitor=createReleaseStatusMonitor({statusUrl:url, onStatus:event=>events.push(event), onFatal(){}, intervalMs:60000, timeoutMs:15,
    fetcher:(_url,options)=>{signal=options.signal;return new Promise(()=>{});}});
  monitor.start();await monitor.refresh();
  assert.equal(signal.aborted,true);assert.deepEqual(events.map(v=>v.kind),['checking','unavailable']);
  monitor.stop();
});

test('checks are serialized and a stopped monitor ignores late open results',async()=>{
  let resolve, count=0;const events=[];
  const monitor=createReleaseStatusMonitor({statusUrl:url,onStatus:event=>events.push(event),onFatal(){},intervalMs:60000,
    fetcher:()=>{count++;return new Promise(ok=>{resolve=ok;});}});
  monitor.start();const a=monitor.refresh(),b=monitor.refresh();assert.equal(a,b);assert.equal(count,1);
  monitor.stop();resolve(response(open));await a;
  assert.deepEqual(events,[{kind:'checking'}]);
});

test('stop then restart immediately starts a fresh check even if an old fetch ignores abort',async()=>{
  const events=[],requests=[];
  const monitor=createReleaseStatusMonitor({statusUrl:url,onStatus:event=>events.push(event),onFatal(){},intervalMs:60000,timeoutMs:30000,
    fetcher:(_url,options)=>new Promise(resolve=>requests.push({resolve,signal:options.signal}))});
  monitor.start();const stale=monitor.refresh();monitor.stop();
  monitor.start();const fresh=monitor.refresh();
  assert.equal(requests.length,2);assert.equal(requests[0].signal.aborted,true);
  requests[1].resolve(response({...open,build:'release-3'}));await fresh;
  requests[0].resolve(response(open));await stale;
  assert.deepEqual(events.map(e=>e.kind),['checking','checking','open']);
  assert.equal(events.at(-1).release.build,'release-3');
  monitor.stop();
});

test('a consumer exception stops polling and invokes the required fatal teardown',async()=>{
  let calls=0,fatal=0;
  const monitor=createReleaseStatusMonitor({statusUrl:url,intervalMs:1000,onStatus:event=>{if(event.kind==='open')throw Error('failed render');},
    onFatal:error=>{fatal++;assert.equal(error.message,'failed render');},fetcher:async()=>{calls++;return response(open);}});
  monitor.start();await monitor.refresh();assert.equal(fatal,1);
  await monitor.refresh();assert.equal(calls,1,'a broken consumer does not keep polling as if active');
});
