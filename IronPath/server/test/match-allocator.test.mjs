import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createLobbyRegistry } from '../lobby.mjs';
import { createMatchAllocator } from '../match-allocator.mjs';
import { createLobbyHttpService } from '../lobby-service.mjs';
import { createMatchService } from '../service.mjs';
import { createPlayer } from '../../match.mjs';
import { createCoopClient } from '../../coop-client.mjs';
import { WebSocket } from 'ws';
const profile={name:'Soldier',gender:'female',level:1};
const player=(id,index)=>createPlayer(id,profile,index?800:850,450);
const verify=async token=>({uid:token,exp:Math.floor(Date.now()/1000)+300});
function room(registry,owner,guest){registry.create(owner);registry.join(guest,registry.invite(owner).secret);}
const code=(fn,expected)=>assert.rejects(fn,error=>error.code===expected);

test('reserves atomically, limits capacity and cleans up on allocation failure',async()=>{
  const registry=createLobbyRegistry();room(registry,'alice','bob');room(registry,'carol','dave');
  let release;const gate=new Promise(resolve=>release=resolve);let launches=0;
  const allocator=createMatchAllocator({registry,maxMatches:1,loadPlayer:async(id,i)=>{await gate;return player(id,i);},launchMatch:async()=>{launches++;return {stop:async()=>{}};}});
  const first=allocator.start('alice');
  await code(()=>allocator.start('alice'),'match-active');await code(()=>allocator.start('bob'),'not-owner');await code(()=>allocator.start('carol'),'capacity');
  assert.equal(allocator.get('bob').status,'starting');assert.throws(()=>allocator.get('dave'),e=>e.code==='no-match');
  release();const match=await first;assert.equal(launches,1);assert.equal(allocator.get('bob').matchId,match.matchId);
  assert.equal(await allocator.stop(match.matchId),true);assert.equal(await allocator.stop(match.matchId),false);
  assert.equal(registry.get('carol').status,'waiting');
  const bad=createMatchAllocator({registry,loadPlayer:async()=>{throw Error('db offline');},launchMatch:async()=>{throw Error('must not start');}});
  await assert.rejects(bad.start('carol'),/db offline/);assert.throws(()=>registry.get('dave'),e=>e.code==='not-in-lobby');
  registry.create('carol'); // Failed allocation tears down the room, releasing both members.
});

test('stop failure retains the reservation and can be retried',async()=>{
  const registry=createLobbyRegistry();room(registry,'a','b');let tries=0;
  const allocator=createMatchAllocator({registry,loadPlayer:async(id,i)=>player(id,i),launchMatch:async()=>({stop(){if(++tries===1)throw Error('still running');}})});
  const match=await allocator.start('a');await assert.rejects(allocator.stop(match.matchId),/still running/);
  assert.equal(allocator.get('a').status,'stop-failed');assert.equal(registry.get('b').status,'active');
  assert.equal(await allocator.stop(match.matchId),true);assert.throws(()=>registry.get('a'),e=>e.code==='not-in-lobby');
});

test('HTTP lobby start provisions an authenticated two-player WebSocket match',async t=>{
  const registry=createLobbyRegistry(),servers=new Map();
  const allocator=createMatchAllocator({registry,loadPlayer:async(id,i)=>player(id,i),launchMatch:async({matchId,players})=>{
    const server=createMatchService({players,verifyToken:verify,allowedOrigins:['https://allowed.example']});
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    servers.set(matchId,server);
    return {stop:()=>new Promise(resolve=>server.shutdown(()=>{servers.delete(matchId);resolve();}))};
  }});
  const http=createLobbyHttpService({registry,allocator,verifyToken:verify,allowedOrigins:['https://allowed.example']});
  await new Promise(resolve=>http.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>http.close(resolve)));
  let matchId; t.after(async()=>{if(matchId)await allocator.stop(matchId);});
  const base=`http://127.0.0.1:${http.address().port}`;
  async function req(path,user,method='GET',body){const res=await fetch(base+path,{method,headers:{origin:'https://allowed.example',authorization:`Bearer ${user}`},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,body:await res.json()};}
  assert.equal((await req('/lobby','alice','POST')).status,200);
  const invite=await req('/lobby/invite','alice','POST');
  assert.equal((await req('/lobby/join','bob','POST',{secret:invite.body.secret})).status,200);
  assert.equal((await req('/lobby/start','bob','POST')).status,403);
  const start=await req('/lobby/start','alice','POST');assert.equal(start.status,200);matchId=start.body.matchId;
  assert.equal((await req('/lobby/match','bob')).body.matchId,matchId);
  assert.equal((await req('/lobby/match','eve')).status,404);
  const matchServer=servers.get(matchId),url=`ws://127.0.0.1:${matchServer.address().port}/match`;
  class ClientSocket extends WebSocket{constructor(u){super(u,{origin:'https://allowed.example'});}}
  const options={url,WebSocketImpl:ClientSocket,retryMs:10};
  const a=createCoopClient({...options,getToken:async()=> 'alice'}),b=createCoopClient({...options,getToken:async()=> 'bob'});
  t.after(()=>{a.stop();b.stop();});a.start();b.start();
  const deadline=Date.now()+3000;while(a.getState()!=='ready'||b.getState()!=='ready'){if(Date.now()>deadline)throw Error('Match not ready');await new Promise(resolve=>setTimeout(resolve,10));}
  assert.equal((await a.command({type:'build',pad:0,towerType:0})).ok,true);
  assert.equal((await b.command({type:'build',pad:0,towerType:0})).ok,false);
  const outsider=new WebSocket(url,{origin:'https://allowed.example'});outsider.on('error',()=>{});
  await new Promise(resolve=>outsider.once('open',resolve));const closed=new Promise(resolve=>outsider.once('close',resolve));outsider.send(JSON.stringify({type:'auth',token:'eve'}));assert.equal(await closed,1008);
  a.stop();b.stop();assert.equal(await allocator.stop(matchId),true);matchId=null;
  assert.equal((await req('/lobby','bob')).status,404);
});
