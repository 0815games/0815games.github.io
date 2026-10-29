"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const {createPublisher,watch,summarize}=require('../game/social/social-presence.js');
const tick=()=>new Promise(setImmediate);
function fixture(){
 let uid='alice',serial=0,time=1000,timerId=0;
 const state={social:{presencePrivacy:{alice:'friends'}},'.info':{connected:true,serverTimeOffset:0}},listeners=new Map(),authListeners=new Set(),jobs=new Map(),events=[];
 let failRegister=false,failRemove=false,holdSet=null;
 const parts=p=>p.split('/').filter(Boolean);
 function read(p){let value=state;for(const k of parts(p))value=value?.[k];return value??null;}
 function write(p,value){const keys=parts(p),last=keys.pop();let node=state;for(const k of keys)node=node[k]||={};if(value===null)delete node[last];else node[last]=value;for(const [path,set] of listeners)if(p===path||p.startsWith(path+'/'))for(const entry of [...set])entry.cb({val:()=>read(path)});}
 const db={ref(path){return {push(){return db.ref(path+'/'+'A'.repeat(19)+String.fromCharCode(65+serial++));},on(kind,cb,error){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add({cb,error});cb({val:()=>read(path)});},off(kind,cb){for(const e of listeners.get(path)||[])if(e.cb===cb)listeners.get(path).delete(e);},onDisconnect(){return {remove:async()=>{events.push(['arm',path]);if(failRegister)throw Error('arm failed');},cancel:async()=>events.push(['cancel',path])};},async set(value){events.push(['set',path]);if(holdSet&&path.includes('/connections/'))await holdSet;write(path,value);},async remove(){events.push(['remove',path]);if(failRemove)throw Error('remove failed');write(path,null);}};}};
 const auth={get currentUser(){return uid?{uid}:null;},onAuthStateChanged(fn){authListeners.add(fn);fn(auth.currentUser);return()=>authListeners.delete(fn);}};
 const options={db,auth,uid:'alice',enabled:true,serverTimestamp:()=>time,schedule:(fn,delay)=>{jobs.set(++timerId,{fn,at:time+delay});return timerId;},cancel:id=>jobs.delete(id)};
 return {db,auth,options,events,read,write,publisher:()=>createPublisher(options),setUser(value){uid=value;for(const fn of [...authListeners])fn(auth.currentUser);},setFailRegister(){failRegister=true;},setFailRemove(){failRemove=true;},hold(value){holdSet=value;},async advance(delta){time+=delta;for(const [id,job] of [...jobs])if(job.at<=time){jobs.delete(id);job.fn();}await tick();},watch(onData){return watch({...options,targetUid:'bob',onData,clock:()=>time});},failReader(){for(const e of [...listeners.get('social/presence/bob/connections')||[]])e.error(Error('denied'));},activeListeners(){return [...listeners.values()].reduce((n,set)=>n+set.size,0);},jobs};
}
test('No connections is offline',()=>assert.deepEqual(summarize(null,1000),{state:'offline',online:false,connections:0}));
test('One fresh connection is online',()=>assert.equal(summarize({a:{online:true,updatedAt:1000}},1001).online,true));
test('Two tabs are aggregated',()=>assert.equal(summarize({a:{online:true,updatedAt:1000},b:{online:true,updatedAt:1001}},1002).connections,2));
test('Stale entries are unknown, not falsely online',()=>assert.equal(summarize({a:{online:true,updatedAt:0}},100000).state,'unknown'));
test('Invalid entries are unknown',()=>assert.equal(summarize({a:{online:true,updatedAt:'future'}},1000).state,'unknown'));
test('Future timestamps beyond tolerance are unknown',()=>assert.equal(summarize({a:{online:true,updatedAt:100000}},1000).state,'unknown'));
test('Disabled publisher never listens or writes',async()=>{const f=fixture();const p=createPublisher({...f.options,enabled:false});assert.equal(p.start(),false);assert.equal(f.activeListeners(),0);assert.equal(f.events.length,0);await p.stop();});
test('Missing consent creates no connection',async()=>{const f=fixture();f.write('social/presencePrivacy/alice',null);const p=f.publisher();p.start();await tick();assert.equal(f.events.length,0);await p.stop();});
test('Disconnect cleanup is armed before marking online',async()=>{const f=fixture(),p=f.publisher();p.start();await tick();assert.deepEqual(f.events.slice(0,2).map(x=>x[0]),['arm','set']);await p.stop();});
test('Failed disconnect registration never marks online',async()=>{const f=fixture();f.setFailRegister();const p=f.publisher();p.start();await tick();assert.equal(f.events.some(x=>x[0]==='set'),false);await p.stop();});
test('Stopping one tab does not remove another',async()=>{const f=fixture(),a=f.publisher(),b=f.publisher();a.start();b.start();await tick();await a.stop();assert.equal(Object.keys(f.read('social/presence/alice/connections')).length,1);assert.equal(summarize(f.read('social/presence/alice/connections'),1001).online,true);await b.stop();});
test('Privacy opt-out removes own connection',async()=>{const f=fixture(),p=f.publisher();p.start();await tick();await p.setVisibility('private');await tick();assert.equal(Object.keys(f.read('social/presence/alice/connections')||{}).length,0);await p.stop();});
test('No global offline Boolean is written',async()=>{const f=fixture(),p=f.publisher();p.start();await tick();await p.stop();assert.equal(f.events.filter(x=>['set','remove'].includes(x[0])).every(x=>x[1].includes('/connections/')),true);});
test('Cleanup waits for delayed online write before removing it',async()=>{const f=fixture();let release;f.hold(new Promise(resolve=>release=resolve));const p=f.publisher();p.start();await tick();const stopping=p.stop();release();await stopping;assert.equal(Object.keys(f.read('social/presence/alice/connections')||{}).length,0);});
test('Remove failure keeps server disconnect cleanup armed',async()=>{const f=fixture(),p=f.publisher();p.start();await tick();f.setFailRemove();await p.stop();assert.equal(f.events.some(x=>x[0]==='cancel'),false);});
test('Heartbeat updates live timestamp',async()=>{const f=fixture(),p=f.publisher();p.start();await tick();await f.advance(30001);assert.equal(Object.values(f.read('social/presence/alice/connections'))[0].updatedAt,31001);await p.stop();});
test('Reconnect gets a new connection key',async()=>{const f=fixture(),p=f.publisher();p.start();await tick();const first=Object.keys(f.read('social/presence/alice/connections'))[0];f.write('.info/connected',false);await tick();f.write('.info/connected',true);await tick();assert.notEqual(Object.keys(f.read('social/presence/alice/connections'))[0],first);await p.stop();});
test('Wrong account cannot publish',async()=>{const f=fixture();f.setUser('bob');const p=f.publisher();assert.equal(p.start(),false);await assert.rejects(p.setVisibility('friends'));assert.equal(f.events.length,0);});
test('Invalid visibility is rejected',async()=>{const f=fixture(),p=f.publisher();await assert.rejects(p.setVisibility('public'));assert.equal(f.events.length,0);});
test('Reader sees unknown while its own connection is down',()=>{const f=fixture(),output=[];f.write('.info/connected',false);const stop=f.watch(x=>output.push(x));assert.equal(output.at(-1).state,'unknown');stop();});
test('Permission errors are not reported as offline',()=>{const f=fixture(),output=[];const stop=f.watch(x=>output.push(x));f.failReader();assert.equal(output.at(-1).state,'unknown');assert.equal(f.activeListeners(),0);stop();});
test('Reader expires stale data without new database event',async()=>{const f=fixture(),output=[];f.write('social/presence/bob/connections',{a:{online:true,updatedAt:1000}});const stop=f.watch(x=>output.push(x));assert.equal(output.at(-1).online,true);await f.advance(90001);assert.equal(output.at(-1).state,'unknown');stop();assert.equal(f.jobs.size,0);});
test('Reader account change clears subscriptions',()=>{const f=fixture(),output=[];const stop=f.watch(x=>output.push(x));f.setUser('carol');assert.equal(output.at(-1).state,'unknown');assert.equal(f.activeListeners(),0);stop();});

test('Auth change during start leaves no publisher listeners',async()=>{const f=fixture();let removed=0;f.auth.onAuthStateChanged=fn=>{fn({uid:'bob'});return()=>removed++;};const p=f.publisher();assert.equal(p.start(),false);await tick();assert.equal(f.activeListeners(),0);assert.equal(removed,1);});
