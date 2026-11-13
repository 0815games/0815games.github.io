import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPlayer} from '../match.mjs';
import {bunkerStart} from '../solo-deployment.mjs';
import {createFirebaseRecoverableGame} from '../firebase-recoverable-game.mjs';

// A minimal hierarchical in-memory SDK, not Firebase or its rules. It allows
// the real recoverable game, presence, durable transport and store adapters
// to exchange asynchronous snapshots and atomic local transactions.
function memorySdk(){
 const root={'.info':{connected:true,serverTimeOffset:0}},listeners=new Map();
 const clone=value=>value===undefined?null:structuredClone(value);
 function read(path){let node=root;for(const part of path.split('/')){if(!node||typeof node!=='object'||!Object.hasOwn(node,part))return null;node=node[part];}return clone(node);}
 function emit(path){
  for(const [name,callbacks] of listeners){
   if(name!==path&&!name.startsWith(path+'/')&&!path.startsWith(name+'/'))continue;
   const value=read(name);for(const cb of callbacks)queueMicrotask(()=>{if(callbacks.has(cb))cb({val:()=>clone(value)});});
  }
 }
 function write(path,value){
  const parts=path.split('/'),key=parts.pop();let node=root;
  for(const part of parts)node=node[part]??={};
  if(value===null)delete node[key];else node[key]=clone(value);
  emit(path);
 }
 return {read,sdk:{
  ref:(_db,path)=>path,
  onValue(path,cb){if(!listeners.has(path))listeners.set(path,new Set());const callbacks=listeners.get(path);callbacks.add(cb);const value=read(path);queueMicrotask(()=>{if(callbacks.has(cb))cb({val:()=>clone(value)});});return()=>callbacks.delete(cb);},
  onDisconnect(){return {async remove(){}};},serverTimestamp:()=>Date.now(),
  async set(path,value){write(path,value);},async remove(path){write(path,null);},
  async runTransaction(path,update){const value=update(read(path));if(value===undefined)return {committed:false};write(path,value);return {committed:true};},
 }};
}

for(const mode of ['coop','versus'])test(`large ${mode} checkpoint restores its map, towers and wave after host reload`,{timeout:30000},async()=>{
 const {read,sdk}=memorySdk(),ids=['alice','bob'],partyId='0123456789abcdef0123456789abcdef',mapId='g3-19e3779b1',manifest={hostId:'alice',playerIds:ids,mode};
 const players=ids.map((id,index)=>{const point=bunkerStart(mapId,index);return createPlayer(id,{name:id,gender:'female',level:1},point.x,point.y);});
 let nonce=0;const crypto={getRandomValues(bytes){bytes.fill(++nonce);return bytes;}},ready={},views={},errors=[];
 const make=(id,extra={})=>createFirebaseRecoverableGame({db:{},auth:{currentUser:{uid:id}},sdk,partyId,manifest,crypto,readFresh:async path=>read(path),mapId:id==='alice'?mapId:'road',...extra,onStatus:value=>ready[id]=value,onSnapshot:value=>views[id]=value,onState:value=>{if(value==='error'||value==='duplicate')errors.push(`${id}:${value}`);}});
 const wait=async(predicate,label)=>{const deadline=Date.now()+12000;while(!predicate()){if(errors.length)throw Error(`${label}: ${errors}`);if(Date.now()>deadline)throw Error(`Timed out: ${label}, ready=${JSON.stringify(ready)}`);await new Promise(resolve=>setTimeout(resolve,20));}};
 let host=make('alice',{players}),guest=make('bob');
 try{
  host.start();guest.start();await wait(()=>ids.every(id=>ready[id]&&views[id]?.match?.mapId===mapId),'original match ready');
  assert.equal((await host.command({type:'build',pad:0,towerType:0})).ok,true);
  assert.equal((await guest.command({type:'build',pad:12,towerType:0})).ok,true);
  await wait(()=>mode==='coop'?views.bob?.match.towers.length===2:views.bob?.match.towers.length===1&&views.bob?.match.rival.towers.length===1,'both builds committed');
  const request=await host.command({type:'startWave'});assert.equal(request.ok,true);
  await wait(()=>views.bob?.match?.pendingWave===1,'guest sees the wave request');
  assert.equal((await guest.command({type:'approveWave',requestId:views.bob.match.waveRequestId})).ok,true);
  await wait(()=>ids.every(id=>views[id]?.match?.wave===1),'wave started');
  await host.stop();await wait(()=>ready.bob===false,'guest observes host departure');
  const lease=read(`fourParties/${partyId}/recovery/lease`);assert.equal(lease.generation,1);
  views.alice=null;views.bob=null; // Require newly delivered recovery snapshots.
  // The account proposes a fresh seed on every handoff. Recovery must ignore
  // this candidate in favour of the persisted, already-played match.
  host=make('alice',{mapId:'g3-100000009',resumeGeneration:lease.generation});host.start();
  await wait(()=>ids.every(id=>ready[id]&&views[id]?.match?.mapId===mapId&&views[id]?.match?.wave===1),'same map and wave after host reload');
  if(mode==='coop')assert.equal(views.bob.match.towers.length,2);
  else {assert.equal(views.bob.match.towers.length,1);assert.equal(views.bob.match.rival.towers.length,1);}
  assert.equal((await guest.command({type:'move',x:1200,y:600})).ok,true,'guest can still move beyond the old field');
  assert.deepEqual(errors,[]);
 }finally{await Promise.allSettled([host.stop(),guest.stop()]);}
});
