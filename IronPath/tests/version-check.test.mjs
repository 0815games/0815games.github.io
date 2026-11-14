import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createVersionProbe,parsePublishedVersion,createVersionCoordinator,createWriteTracker} from '../version-check.mjs';

const pause=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function timers(){
 let id=0;const pending=new Map();
 return {set:(fn,ms)=>{assert.equal(ms,1000);pending.set(++id,fn);return id;},clear:id=>pending.delete(id),
  async tick(){const first=pending.entries().next().value;assert.ok(first,'a retry must be scheduled');pending.delete(first[0]);first[1]();await pause();},size:()=>pending.size};
}

test('only the exact, small public manifest format is accepted',()=>{
 assert.deepEqual(parsePublishedVersion({format:1,build:'build-a-1'}),{build:'build-a-1'});
 for(const value of [null,[],{}, {format:2,build:'x'}, {format:1,build:'../x'}, {format:1,build:'X'},
  {format:1,build:'a'.repeat(65)}, {format:1,build:'ok',url:'https://other.test/'}, {format:'1',build:'ok'}])assert.equal(parsePublishedVersion(value),null);
});

test('the version probe uses a fresh, same-origin request and validates its response',async()=>{
 const calls=[];let body=JSON.stringify({format:1,build:'build-a'}),status=200;
 const probe=createVersionProbe({url:'https://example.test/IronPath/release-version.json',origin:'https://example.test',build:'build-a',fetcher:async(url,options)=>{calls.push({url,options});return new Response(body,{status});}});
 assert.deepEqual(await probe(),{kind:'current',build:'build-a'});
 body=JSON.stringify({format:1,build:'build-b'});assert.deepEqual(await probe(),{kind:'outdated',build:'build-b'});
 assert.notEqual(calls[0].url,calls[1].url);assert.equal(calls[0].options.cache,'no-store');assert.equal(calls[0].options.redirect,'error');
 assert.equal(new URL(calls[0].url).origin,'https://example.test');
 body='{"format":1,"build":"bad","extra":1}';assert.deepEqual(await probe(),{kind:'unavailable'});
 body='x'.repeat(1025);assert.deepEqual(await probe(),{kind:'unavailable'});
 body='missing';status=404;assert.deepEqual(await probe(),{kind:'unavailable'});
 assert.throws(()=>createVersionProbe({url:'https://other.test/IronPath/release-version.json',origin:'https://example.test',build:'a'}),/Invalid version/);
 assert.throws(()=>createVersionProbe({url:'https://example.test/IronPath/release-version.json?x=1',origin:'https://example.test',build:'a'}),/Invalid version/);
 assert.throws(()=>createVersionProbe({url:'https://user@example.test/IronPath/release-version.json',origin:'https://example.test',build:'a'}),/Invalid version/);
});

test('a stalled fetch cannot hang the version check forever',async()=>{
 const probe=createVersionProbe({url:'https://example.test/release-version.json',origin:'https://example.test',build:'a',timeoutMs:10,fetcher:()=>new Promise(()=>{})});
 assert.deepEqual(await probe(),{kind:'unavailable'});
});

test('the tracker holds the real unresolved write, even when a separate watchdog wins',async()=>{
 const tracker=createWriteTracker(),write=deferred();const tracked=tracker.track(write.promise);
 assert.equal(tracker.getPendingCount(),1);assert.equal(await Promise.race([tracked,Promise.resolve('timeout')]),'timeout');
 assert.equal(tracker.isIdle(),false,'the SDK write was not cancelled by a timeout');
 write.resolve('acknowledged');assert.equal(await tracked,'acknowledged');await pause();assert.equal(tracker.isIdle(),true);
 const failed=deferred(),failure=tracker.track(failed.promise);failed.reject(Error('denied'));await assert.rejects(failure);await pause();assert.equal(tracker.isIdle(),true);
});

test('a version change waits for the game, save, party and dialog, then reconfirms before reload',async()=>{
 let reason='game',published='new',checks=0;const reloads=[],events=[],clock=timers();
 const coordinator=createVersionCoordinator({probe:async()=>{checks++;return {kind:'outdated',build:published};},safety:()=>reason,onStatus:event=>events.push(event),reload:build=>reloads.push(build),setTimer:clock.set,clearTimer:clock.clear});
 assert.equal(await coordinator.check(),false);assert.equal(events.at(-1).reason,'game');assert.equal(checks,1);
 for(const state of ['party','saving','dialog']){reason=state;await clock.tick();assert.equal(events.at(-1).reason,state);assert.deepEqual(reloads,[]);assert.equal(checks,1,'no repeated network request while unsafe');}
 reason='ready';published='newer';await clock.tick();assert.equal(checks,2);assert.deepEqual(reloads,['newer']);assert.equal(events.at(-1).kind,'reloading');assert.equal(clock.size(),0);
 assert.equal(await coordinator.check(),false,'navigation has already begun');
});

test('a save or party beginning during the fresh recheck prevents a reload',async()=>{
 let reason='ready',calls=0;const pending=deferred(),reloads=[],clock=timers();
 const coordinator=createVersionCoordinator({probe:()=>++calls===1?Promise.resolve({kind:'outdated',build:'b'}):pending.promise,safety:()=>reason,onStatus:()=>{},reload:b=>reloads.push(b),setTimer:clock.set,clearTimer:clock.clear});
 assert.equal(await coordinator.check(),false);await clock.tick();reason='saving';pending.resolve({kind:'outdated',build:'b'});await pause();assert.deepEqual(reloads,[]);assert.equal(clock.size(),1);
 coordinator.stop();assert.equal(clock.size(),0);
});

test('an outage never starts or reloads, and rollback to the running build cancels the update',async()=>{
 const values=[{kind:'outdated',build:'b'},{kind:'unavailable'},{kind:'current',build:'a'}],clock=timers(),events=[],reloads=[];
 const c=createVersionCoordinator({probe:async()=>values.shift(),safety:()=> 'ready',onStatus:e=>events.push(e),reload:b=>reloads.push(b),setTimer:clock.set,clearTimer:clock.clear});
 assert.equal(await c.check(),false);await clock.tick();assert.equal(events.at(-1).kind,'unavailable');assert.deepEqual(reloads,[]);assert.equal(clock.size(),1);
 await clock.tick();assert.equal(events.at(-1).kind,'current');assert.equal(c.state().pendingBuild,null);assert.equal(clock.size(),0);assert.deepEqual(reloads,[]);
});

test('a late stale probe cannot authorize a new game or override a newer result',async()=>{
 const old=deferred(),fresh=deferred();let n=0;const events=[],clock=timers();
 const c=createVersionCoordinator({probe:()=>++n===1?old.promise:fresh.promise,safety:()=> 'game',onStatus:e=>events.push(e),reload:()=>assert.fail('reload'),setTimer:clock.set,clearTimer:clock.clear});
 const first=c.check(),second=c.check();fresh.resolve({kind:'outdated',build:'b'});assert.equal(await second,false);old.resolve({kind:'current',build:'a'});assert.equal(await first,false);assert.equal(events.at(-1).kind,'update');assert.equal(c.state().pendingBuild,'b');c.stop();
});

test('the release manifest, displayed build and cache-busted entry points agree',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),account=readFileSync(new URL('../account.js',import.meta.url),'utf8'),entry=readFileSync(new URL('../account-entry.mjs',import.meta.url),'utf8');
 const manifest=JSON.parse(readFileSync(new URL('../release-version.json',import.meta.url),'utf8')),build=manifest.build;
 assert.ok(parsePublishedVersion(manifest));assert.ok(html.includes(`<meta name="ironpath-build" content="${build}">`));
 assert.equal((html.match(new RegExp(`BUILD ${build}`,'g'))||[]).length,2);
 for(const file of ['account-entry.mjs','style.css'])assert.ok(html.includes(`${file}?v=${build}`),file);
 assert.ok(entry.includes(`account.js?v=${build}`));
 for(const file of ['game.js','version-ui.mjs','version-check.mjs','coop-rewards.mjs','leaderboards.mjs','leaderboards-ui.mjs','friends-ui.mjs','firebase-four-panel.mjs','first-run-ending.mjs'])assert.ok(account.includes(`${file}?v=${build}`),file);
});
