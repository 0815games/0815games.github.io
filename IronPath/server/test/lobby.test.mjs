import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createLobbyRegistry } from '../lobby.mjs';
const code=(fn,expected)=>assert.throws(fn,error=>error.code===expected);

test('private one-use invitations and server-owned two-player roster',()=>{
  const registry=createLobbyRegistry();const room=registry.create('alice');
  assert.deepEqual(room.players,['alice']);assert.equal(room.status,'waiting');
  code(()=>registry.create('alice'),'already-in-lobby');code(()=>registry.start('alice'),'need-two-players');
  const first=registry.invite('alice'),second=registry.invite('alice');
  assert.notEqual(first.secret,second.secret);assert.equal('secret' in registry.get('alice'),false);
  code(()=>registry.join('bob',first.secret),'invalid-invite');
  assert.deepEqual(registry.join('bob',second.secret).players,['alice','bob']);
  code(()=>registry.join('eve',second.secret),'invalid-invite');
  code(()=>registry.invite('bob'),'not-owner');code(()=>registry.start('bob'),'not-owner');
  code(()=>registry.invite('alice'),'lobby-full');
  const match=registry.start('alice');assert.deepEqual(match.players,['alice','bob']);
  assert.equal(registry.get('bob').status,'active');code(()=>registry.start('alice'),'match-active');
  code(()=>registry.leave('bob'),'match-active');
  assert.equal(registry.finishMatch('unknown'),false);assert.equal(registry.finishMatch(match.matchId),true);
  assert.equal(registry.finishMatch(match.matchId),false);code(()=>registry.get('bob'),'not-in-lobby');
  registry.create('bob');
});

test('expiry, revoke, owner departure, capacity, and joining while busy',()=>{
  let time=0;const registry=createLobbyRegistry({now:()=>time,waitingTtlMs:100,inviteTtlMs:20,maxLobbies:2});
  registry.create('alice');registry.create('carol');code(()=>registry.create('eve'),'capacity');
  let invitation=registry.invite('alice');code(()=>registry.join('carol',invitation.secret),'already-in-lobby');
  registry.leave('carol');assert.deepEqual(registry.join('carol',invitation.secret).players,['alice','carol']);
  registry.leave('carol');invitation=registry.invite('alice');registry.revokeInvite('alice');code(()=>registry.join('bob',invitation.secret),'invalid-invite');
  invitation=registry.invite('alice');time=20;code(()=>registry.join('bob',invitation.secret),'invalid-invite');
  invitation=registry.invite('alice');registry.leave('alice');code(()=>registry.join('bob',invitation.secret),'invalid-invite');
  registry.create('alice');invitation=registry.invite('alice');time=120;code(()=>registry.join('bob',invitation.secret),'invalid-invite');
  registry.create('bob');
});

test('membership snapshots cannot mutate registry and active matches do not expire',()=>{
  let time=0;const r=createLobbyRegistry({now:()=>time,waitingTtlMs:10});
  const initial=r.create('a');initial.players.push('attacker');assert.deepEqual(r.get('a').players,['a']);
  const invite=r.invite('a');r.join('b',invite.secret);const match=r.start('a');match.players.pop();
  time=100;r.prune();assert.deepEqual(r.get('b').players,['a','b']);
  code(()=>r.get('attacker'),'not-in-lobby');code(()=>r.join('',invite.secret),'invalid-identity');
  assert.equal(r.finishMatch(match.matchId),true);
});

test('trusted lobby roster can provision an isolated real match service',async t=>{
  const {createMatchService}=await import('../service.mjs');
  const {createPlayer}=await import('../../match.mjs');
  const {createCoopClient}=await import('../../coop-client.mjs');
  const {WebSocket}=await import('ws');
  const r=createLobbyRegistry();r.create('alice');r.join('bob',r.invite('alice').secret);
  const match=r.start('alice');
  // In a real allocator profiles must be loaded server-side, never from the client.
  const server=createMatchService({players:match.players.map(uid=>createPlayer(uid,{name:uid,gender:'female',level:1})),verifyToken:async token=>({uid:token,exp:Math.floor(Date.now()/1000)+60}),allowedOrigins:['https://allowed.example']});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.shutdown(()=>{r.finishMatch(match.matchId);resolve();})));
  const url=`ws://127.0.0.1:${server.address().port}/match`;
  class TestWebSocket extends WebSocket{constructor(endpoint){super(endpoint,{origin:'https://allowed.example'});}}
  const options={url,WebSocketImpl:TestWebSocket,retryMs:10};
  const a=createCoopClient({...options,getToken:async()=> 'alice'}),b=createCoopClient({...options,getToken:async()=> 'bob'});
  t.after(()=>{a.stop();b.stop();});a.start();b.start();
  const deadline=Date.now()+3000;
  while(a.getState()!=='ready'||b.getState()!=='ready'){if(Date.now()>deadline)throw new Error('Match failed to start');await new Promise(resolve=>setTimeout(resolve,10));}
  assert.deepEqual(Object.keys(a.getSnapshot().match.players).sort(),['alice','bob']);
  assert.equal((await a.command({type:'build',pad:0,towerType:0})).ok,true);
  assert.equal((await b.command({type:'build',pad:0,towerType:0})).ok,false);
  const outsider=new WebSocket(url,{origin:'https://allowed.example'});
  outsider.on('error',()=>{});
  await new Promise(resolve=>outsider.once('open',resolve));
  const closed=new Promise(resolve=>outsider.once('close',(code)=>resolve(code)));
  outsider.send(JSON.stringify({type:'auth',token:'eve'}));assert.equal(await closed,1008);
  a.stop();b.stop();
});
