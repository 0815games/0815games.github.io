import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {AFK_DELAY_MS,createAfkTimer,createSessionTabLock} from '../afk-session.mjs';

const pause=()=>new Promise(resolve=>setImmediate(resolve));
function fakeLocks(){
 const active=new Set(),waiting=[];
 function drain(){
  for(let i=0;i<waiting.length;){
   const item=waiting[i],exclusive=item.options.mode==='exclusive';
   if(exclusive?active.size>0:[...active].some(x=>x.options.mode==='exclusive')){i++;continue;}
   waiting.splice(i,1);active.add(item);item.options.signal?.removeEventListener('abort',item.abort);
   Promise.resolve().then(()=>item.callback({name:item.name,mode:item.options.mode}))
    .then(item.resolve,item.reject).finally(()=>{active.delete(item);drain();});
   if(exclusive)break;
  }
 }
 return {request(name,options,callback){
  return new Promise((resolve,reject)=>{
   const exclusive=options.mode==='exclusive',blocked=exclusive?active.size>0:[...active].some(x=>x.options.mode==='exclusive');
   if(options.ifAvailable&&blocked){Promise.resolve().then(()=>callback(null)).then(resolve,reject);return;}
   const item={name,options,callback,resolve,reject,abort:null};
   item.abort=()=>{const i=waiting.indexOf(item);if(i>=0)waiting.splice(i,1);reject(Error('aborted'));};
   if(options.signal?.aborted)return item.abort();
   options.signal?.addEventListener('abort',item.abort,{once:true});waiting.push(item);drain();
  });
 }};
}
function events(){
 const handlers=new Map(),intervals=new Map();let id=0;
 return {handlers,intervals,addEventListener:(name,fn)=>handlers.set(name,fn),removeEventListener:name=>handlers.delete(name),
  setInterval:(fn,ms)=>{assert.equal(ms,15000);intervals.set(++id,fn);return id;},clearInterval:n=>intervals.delete(n),
  emit:(name,event={})=>handlers.get(name)?.(event)};
}
function fixture(){
 let now=100,session=1,safety='ready',expired=0;const document=events(),window=events();
 const timer=createAfkTimer({document,window,session:()=>session,safety:()=>safety,clock:()=>now,onExpire:async({stillIdle})=>{if(stillIdle())expired++;}});
 timer.start();return {timer,document,window,get expired(){return expired;},advance:ms=>{now+=ms;},setNow:value=>{now=value;},setSession:value=>{session=value;},setSafety:value=>{safety=value;}};
}

test('30 minutes of real inactivity are required; activity, sessions and backward clocks reset the deadline',async()=>{
 const f=fixture();f.advance(AFK_DELAY_MS-1);await f.timer.check();assert.equal(f.expired,0);
 f.window.emit('pointermove',{isTrusted:true});f.advance(AFK_DELAY_MS-1);await f.timer.check();assert.equal(f.expired,0);
 f.window.emit('keydown',{isTrusted:false});f.advance(1);await f.timer.check();assert.equal(f.expired,1,'synthetic input is not user activity');
 f.timer.reset();f.setSession(null);f.advance(AFK_DELAY_MS+1);await f.timer.check();assert.equal(f.expired,1);
 f.setSession(2);f.setNow(1);await f.timer.check();f.advance(AFK_DELAY_MS-1);await f.timer.check();assert.equal(f.expired,1);
 f.advance(1);await f.timer.check();assert.equal(f.expired,2);
 f.timer.stop();assert.equal(f.window.intervals.size,0);assert.equal(f.window.handlers.size,0);assert.equal(f.document.handlers.size,0);
});

test('a long active game, party, dialog or outstanding save starts a fresh idle period when safe',async()=>{
 for(const reason of ['game','party','dialog','saving','failed','form']){
  const f=fixture();f.setSafety(reason);f.advance(AFK_DELAY_MS+1000);await f.timer.check();assert.equal(f.expired,0,reason);
  f.setSafety('ready');f.advance(AFK_DELAY_MS-1);await f.timer.check();assert.equal(f.expired,0,reason);
  f.advance(1);await f.timer.check();assert.equal(f.expired,1,reason);f.timer.stop();
 }
});

test('a late idle action cannot sign out a new session or a user who has returned',async()=>{
 for(const change of ['user','input','unsafe','stop']){
  let now=0,current=1,safe='ready',release,completed=0;
  const document=events(),window=events(),gate=new Promise(resolve=>{release=resolve;});
  const timer=createAfkTimer({document,window,clock:()=>now,session:()=>current,safety:()=>safe,
   onExpire:async({stillIdle})=>{await gate;if(stillIdle())completed++;}});
  timer.start();now=AFK_DELAY_MS;const work=timer.check();await pause();
  if(change==='user')current=2;
  if(change==='input')window.emit('pointerdown',{isTrusted:true});
  if(change==='unsafe')safe='game';
  if(change==='stop')timer.stop();
  release();await work;assert.equal(completed,0,change);timer.stop();
 }
});

test('session locks refuse automatic sign-out while another cooperating tab exists',async()=>{
 const locks=fakeLocks(),a=createSessionTabLock({locks}),b=createSessionTabLock({locks});
 assert.equal(await a.start(),true);assert.equal(await b.start(),true);
 let calls=0;const blocked=await a.runIfAlone(()=>{calls++;});
 assert.equal(blocked.ran,false);assert.equal(calls,0);assert.equal(a.isHeld(),true);assert.equal(b.isHeld(),true);
 b.stop();await pause();const alone=await a.runIfAlone(async()=>{calls++;return 'done';});
 assert.equal(alone.ran,true);assert.equal(alone.value,'done');assert.equal(calls,1);assert.equal(a.isHeld(),true);a.stop();
});

test('exclusive sign-out blocks a new cooperating document until the old action completes',async()=>{
 const locks=fakeLocks(),a=createSessionTabLock({locks}),b=createSessionTabLock({locks});await a.start();
 let release,entered;const waiting=new Promise(resolve=>{release=resolve;}),started=new Promise(resolve=>{entered=resolve;});
 const action=a.runIfAlone(async()=>{entered();await waiting;});await started;
 let bStarted=false;const open=b.start().then(value=>{bStarted=value;});await pause();assert.equal(bStarted,false);
 release();await action;await open;assert.equal(bStarted,true);assert.equal(b.isHeld(),true);a.stop();b.stop();
});

test('missing or failing Web Locks disable automatic sign-out instead of guessing about other tabs',async()=>{
 for(const locks of [null,{request(){return Promise.reject(Error('not available'));}}]){
  const lease=createSessionTabLock({locks});assert.equal(await lease.start(),false);assert.equal(lease.available(),false);
  let calls=0;assert.equal((await lease.runIfAlone(()=>calls++)).ran,false);assert.equal(calls,0);lease.stop();
 }
});
