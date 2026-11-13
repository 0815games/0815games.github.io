import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {getMap,createRandomMapId} from '../maps.mjs';
import {bunkerStart} from '../solo-deployment.mjs';
import {createPlayer} from '../match.mjs';
import {createFirebasePartyGame} from '../firebase-party-game.mjs';
import {runCoop,GEARS} from './balance-harness.mjs';

const seed=value=>({getRandomValues(array){array.fill(value);return array;}});

test('two-player large maps use reproducible sector-two geometry and valid bunker spawns',()=>{
 for(let i=0;i<100;i++){
  const id=createRandomMapId(null,seed(Math.imul(i,2654435761)>>>0),2),map=getMap(id);
  assert.match(id,/^g3-1[0-9a-f]{8}$/);
  assert.equal(map.width,1320);assert.equal(map.height,720);
  assert.ok(map.pads.length>=14);
  assert.equal(map.paths?.length??1,1);
  for(let slot=0;slot<2;slot++){
   const p=bunkerStart(id,slot);
   assert.ok(p.x>=0&&p.x<map.width&&p.y>=0&&p.y<map.height,`${id} spawn ${slot} is on the field`);
  }
  assert.equal(getMap(id),map,'every client reconstructs identical geometry from the seed');
 }
});

test('a simulated rookie pair clears ten waves on sample large maps',()=>{
 // The harness stops at the BEGINNING of its limit, so reaching 11 proves
 // that wave 10 actually cleared. This is an engine smoke, not a balance
 // playtest; the enlarged field keeps the existing sector-two enemy scaling.
 for(const id of ['g3-19e3779b1','g3-17c2a4b8e','g3-100000001','g3-100000009']){
  const result=runCoop(id,2,GEARS.rookie,11);
  assert.equal(result.wave,11,`${id}: ${JSON.stringify(result)}`);
  assert.equal(result.ended,'alive',`${id}: the pair survives wave ten`);
 }
});

for(const mode of ['coop','versus'])test(`two ${mode} party adapters share the large host map, actions and wave over an in-memory SDK`,async()=>{
 // This exercises the actual protocol/channel/presence and simulation, but the
 // SDK is local: no production Firebase rules, credentials or network are used.
 const ids=['alice','bob'],mapId=createRandomMapId(null,seed(0x9e3779b1),2),map=getMap(mapId);
 const players=ids.map((id,i)=>{const p=bunkerStart(mapId,i);return createPlayer(id,{name:id,gender:'female',level:1},p.x,p.y);});
 const values=new Map([['.info/connected',true],['.info/serverTimeOffset',0]]),listeners=new Map();
 const read=path=>{if(values.has(path))return values.get(path);const children={};for(const [key,value] of values)if(key.startsWith(path+'/')){const child=key.slice(path.length+1);if(!child.includes('/'))children[child]=value;}return Object.keys(children).length?children:null;};
 const notify=path=>{for(const [name,cbs] of listeners)if(path===name||path.startsWith(name+'/'))for(const cb of cbs)cb({val:()=>read(name)});};
 const sdk={ref:(_db,path)=>path,onValue(path,cb){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add(cb);cb({val:()=>read(path)});return()=>listeners.get(path).delete(cb);},onDisconnect(){return {async remove(){}};},serverTimestamp:()=>Date.now(),async set(path,value){values.set(path,value);notify(path);},async remove(path){values.delete(path);notify(path);},async update(path,patch){for(const [key,value] of Object.entries(patch))values.set(`${path}/${key}`,value);for(const key of Object.keys(patch))notify(`${path}/${key}`);}};
 let nonce=0;const crypto={getRandomValues(bytes){bytes.fill(++nonce);return bytes;}},views={},ready={},errors=[];
 const make=id=>createFirebasePartyGame({db:{},auth:{currentUser:{uid:id}},sdk,partyId:'0123456789abcdef0123456789abcdef',partyRoot:'fourParties',hostId:'alice',playerIds:ids,mode,mapId:id==='alice'?mapId:'road',...(id==='alice'?{players}:{}),crypto,onStatus:value=>ready[id]=value,onSnapshot:value=>views[id]=value,onState:value=>{if(value==='error')errors.push(id);}});
 const wait=async(predicate,label)=>{for(let i=0;i<500;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,10));}throw Error(`Timed out: ${label}`);};
 const clients=ids.map(make);
 try{
  clients.forEach(client=>client.start());await wait(()=>ids.every(id=>ready[id]),'both players ready');
  assert.ok(ids.every(id=>views[id]?.match?.mapId===mapId),'guest uses the host map, not its own candidate');
  assert.ok((await clients[1].command({type:'reserveBuild',pad:12})).ok,'guest reserves an extra large-map pad');
  assert.ok((await clients[1].command({type:'build',pad:12,towerType:0})).ok,'guest builds there');
  assert.ok((await clients[0].command({type:'build',pad:0,towerType:0})).ok,'host builds independently');
  if(mode==='coop')await wait(()=>ids.every(id=>views[id]?.match?.towers?.length===2),'both shared towers replicated');
  else await wait(()=>ids.every(id=>views[id]?.match?.towers?.length===1&&views[id]?.match?.rival?.towers?.length===1),'isolated duel towers replicated');
  const move={type:'move',x:map.width-30,y:map.height/2};
  assert.ok((await clients[1].command(move)).ok,'the guest can move beyond the old 960-pixel boundary');
  const request=await clients[0].command({type:'startWave'});assert.equal(request.waitingForGuest,true);
  await wait(()=>views.bob?.match?.pendingWave===1,'guest sees wave request');
  assert.ok((await clients[1].command({type:'approveWave',requestId:views.bob.match.waveRequestId})).ok);
  await wait(()=>ids.every(id=>views[id]?.match?.wave===1),'wave starts on both views');
  await clients[1].stop();await wait(()=>ready.bob===false,'guest disconnects');
  views.bob=null; // Reconnection must deliver a new snapshot, not reuse the old one.
  clients[1]=make('bob');clients[1].start();await wait(()=>ready.bob&&views.bob?.match?.mapId===mapId&&views.bob.match.wave===1,'guest reconnects to the same map and wave');
  if(mode==='coop')assert.equal(views.bob.match.towers.length,2);
  else {assert.equal(views.bob.match.towers.length,1);assert.equal(views.bob.match.rival.towers.length,1);}
  assert.deepEqual(errors,[]);
 }finally{await Promise.all(clients.map(client=>client.stop()));}
});
