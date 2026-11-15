import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createVersionUI} from '../version-ui.mjs';

const pause=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({build='old',published='old',url='https://example.test/IronPath/',previous=null,language='en',fetcherOverride=null}={}){
 const ids=['releaseCheck','loading','releaseCheckTitle','releaseCheckDetail','releaseCheckRetry','versionNotice','versionNoticeText','versionNoticeRetry','versionNoticeDismiss','resultsVersionStatus'];
 const nodes=new Map(ids.map(id=>[id,{id,hidden:true,textContent:'',onclick:null}]));nodes.get('loading').hidden=false;
 const docEvents=new Map(),winEvents=new Map(),intervals=new Map();let intervalId=0;
 const document={documentElement:{lang:language},visibilityState:'visible',getElementById:id=>nodes.get(id),querySelector:selector=>selector==='meta[name="ironpath-build"]'?{content:build}:null,
  addEventListener:(name,fn)=>docEvents.set(name,fn),removeEventListener:name=>docEvents.delete(name)};
 const values=new Map([['ironpath:language',language]]);if(previous)values.set('ironpath:last-confirmed-build',previous);
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
 const navigations=[];const location={href:url,origin:new URL(url).origin,replace:target=>navigations.push(target)};
 const window={location,localStorage:storage,history:{state:null,replaceState:(_state,_title,href)=>{location.href=href;}},
  addEventListener:(name,fn)=>winEvents.set(name,fn),removeEventListener:name=>winEvents.delete(name),
  setInterval:(fn,ms)=>{assert.equal(ms,60000);intervals.set(++intervalId,fn);return intervalId;},clearInterval:id=>intervals.delete(id)};
 let current=published,safe='ready',before=0;
 const fetcher=fetcherOverride|| (async()=>current==='unavailable'?new Response('offline',{status:503}):new Response(JSON.stringify({format:1,build:current})));
 const ui=createVersionUI({document,window,safety:()=>safe,beforeReload:()=>before++,fetcher});
 return {ui,nodes,navigations,storage,location,document,docEvents,winEvents,intervals,getBefore:()=>before,setPublished:value=>{current=value;},setSafety:value=>{safe=value;}};
}

test('the boot gate opens only after a fresh matching manifest, before account startup',async()=>{
 const f=fixture();let started=false;const startup=f.ui.start().then(()=>{started=true;});await startup;
 assert.equal(started,true);assert.equal(f.nodes.get('releaseCheck').hidden,true);assert.equal(f.nodes.get('loading').hidden,false);
 assert.equal(f.nodes.get('versionNotice').hidden,true,'a first visit does not claim a new version');assert.equal(await f.ui.beforeGame(),true);f.ui.stop();
});

test('an unavailable manifest keeps boot and login blocked until a successful retry',async()=>{
 const f=fixture({published:'unavailable',language:'de'});let started=false;const startup=f.ui.start().then(()=>{started=true;});await pause();
 assert.equal(started,false);assert.equal(f.nodes.get('releaseCheck').hidden,false);assert.match(f.nodes.get('releaseCheckDetail').textContent,/konnte nicht geprüft/);assert.equal(f.nodes.get('releaseCheckRetry').hidden,false);
 assert.equal(await f.ui.beforeGame(),false);f.setPublished('old');f.nodes.get('releaseCheckRetry').onclick();await startup;assert.equal(started,true);f.ui.stop();
});

test('an outdated first document navigates once and an unchanged cached document does not loop',async()=>{
 const f=fixture({build:'old',published:'new'});let booted=false;f.ui.start().then(()=>{booted=true;});await pause();
 assert.equal(booted,false);assert.equal(f.navigations.length,1);assert.equal(f.getBefore(),1);const target=new URL(f.navigations[0]);
 assert.equal(target.origin,'https://example.test');assert.equal(target.searchParams.get('_ip_attempt'),'new');assert.equal(target.searchParams.get('_ip_from'),'old');
 const stale=fixture({build:'old',published:'new',url:target.href});stale.ui.start();await pause();
 assert.equal(stale.navigations.length,0);assert.equal(stale.nodes.get('releaseCheck').hidden,false);assert.match(stale.nodes.get('releaseCheckDetail').textContent,/not available/);
 assert.equal(stale.nodes.get('versionNotice').hidden,true,'the old page must not claim a new build loaded');
 stale.nodes.get('releaseCheckRetry').onclick();await pause();assert.equal(stale.navigations.length,1,'retry is a deliberate next attempt');
});

test('the loaded message appears only after the new page matches the published build',async()=>{
 const good=fixture({build:'new',published:'new',url:'https://example.test/IronPath/?_ip_attempt=new&_ip_from=old&_ip_nonce=123',language:'de'});
 await good.ui.start();assert.match(good.nodes.get('versionNoticeText').textContent,/Neue Version new wurde geladen/);assert.equal(good.location.href,'https://example.test/IronPath/');
 good.nodes.get('versionNoticeDismiss').onclick();assert.equal(good.nodes.get('versionNotice').hidden,true);good.ui.stop();
 const normal=fixture({build:'new',published:'new',previous:'new'});await normal.ui.start();assert.equal(normal.nodes.get('versionNotice').hidden,true);normal.ui.stop();
 const changed=fixture({build:'new',published:'new',previous:'old'});await changed.ui.start();assert.match(changed.nodes.get('versionNoticeText').textContent,/New version new loaded/);changed.ui.stop();
 const broken=fixture({build:'new',published:'unavailable',previous:'old'});broken.ui.start();await pause();assert.equal(broken.nodes.get('versionNotice').hidden,true);broken.ui.stop();
});

test('visible polling and returning from BFCache discover updates without interrupting the game',async()=>{
 const f=fixture();await f.ui.start();f.setPublished('new');f.setSafety('game');
 f.document.visibilityState='hidden';f.intervals.values().next().value();await pause();assert.equal(f.nodes.get('versionNotice').hidden,true);
 f.document.visibilityState='visible';f.docEvents.get('visibilitychange')();await pause();
 assert.match(f.nodes.get('versionNoticeText').textContent,/Finish your current operation/);assert.deepEqual(f.navigations,[]);
 f.setPublished('old');f.winEvents.get('pageshow')({persisted:true});await pause();assert.equal(f.nodes.get('versionNotice').hidden,true);
 f.setPublished('new');f.intervals.values().next().value();await pause();assert.match(f.nodes.get('versionNoticeText').textContent,/Finish your current operation/);
 f.ui.stop();assert.equal(f.intervals.size,0);assert.equal(f.docEvents.size,0);assert.equal(f.winEvents.size,0);
});

test('a visibility event during a pending background check causes one fresh follow-up',async()=>{
 let calls=0,release,requested;const wait=new Promise(resolve=>{release=resolve;}),asked=new Promise(resolve=>{requested=resolve;});
 const response=build=>new Response(JSON.stringify({format:1,build}));
 const f=fixture({fetcherOverride:async()=>{calls++;if(calls===2){requested();await wait;return response('old');}return response(calls===1?'old':'new');}});
 await f.ui.start();f.setSafety('game');f.docEvents.get('visibilitychange')();await asked;
 f.docEvents.get('visibilitychange')();f.winEvents.get('pageshow')({persisted:true});release();
 for(let i=0;i<5;i++)await pause();
 assert.equal(calls,3,'concurrent events are coalesced into one additional fetch');
 assert.match(f.nodes.get('versionNoticeText').textContent,/Finish your current operation/);
 assert.deepEqual(f.navigations,[]);f.ui.stop();
});

test('the game sees a waiting reason instead of being interrupted when a new build appears',async()=>{
 const f=fixture();await f.ui.start();f.setPublished('new');f.setSafety('game');
 assert.equal(await f.ui.beforeGame(),false);assert.match(f.nodes.get('versionNoticeText').textContent,/Finish your current operation/);assert.equal(f.nodes.get('versionNoticeDismiss').hidden,true);assert.deepEqual(f.navigations,[]);f.ui.stop();
});
