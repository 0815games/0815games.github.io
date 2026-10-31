import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { WebSocket } from 'ws';
import { createMatchService } from '../service.mjs';
import { createPlayer } from '../../match.mjs';
import { createCoopClient } from '../../coop-client.mjs';
const profile={name:'Soldier',gender:'female',level:1};
function until(predicate,timeout=3000){return new Promise((resolve,reject)=>{const start=Date.now();function check(){if(predicate())resolve();else if(Date.now()-start>timeout)reject(new Error('Timed out'));else setTimeout(check,10);}check();});}
test('two network clients join, issue commands and reconnect without moving while disconnected',async t=>{
  const server=createMatchService({players:[createPlayer('alice',profile),createPlayer('bob',profile)],allowedOrigins:['https://allowed.example'],verifyToken:async token=>({uid:token,exp:Math.floor(Date.now()/1000)+300})});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.shutdown(resolve)));
  const url=`ws://127.0.0.1:${server.address().port}/match`;
  class TestWebSocket extends WebSocket{constructor(endpoint){super(endpoint,{origin:'https://allowed.example'});}}
  let tokens=0;const opts={url,WebSocketImpl:TestWebSocket,retryMs:10,maxRetries:3};
  const alice=createCoopClient({...opts,getToken:async()=>{tokens++;return 'alice';}}),bob=createCoopClient({...opts,getToken:async()=> 'bob'});
  t.after(()=>{alice.stop();bob.stop();});alice.start();bob.start();
  await until(()=>alice.getState()==='ready'&&bob.getState()==='ready');
  assert.equal((await alice.command({type:'build',pad:0,towerType:0})).ok,true);
  assert.equal((await bob.command({type:'build',pad:0,towerType:1})).ok,false);
  assert.equal((await bob.command({type:'upgrade',pad:0,expectedTowerId:999,expectedLevel:1})).reason,'Tower changed. Select it again.');
  assert.equal((await bob.command({type:'sell',pad:0,expectedTowerId:999,expectedLevel:1})).ok,false);
  assert.equal((await alice.command({type:'direction',x:1,y:0})).ok,true);
  assert.equal((await bob.command({type:'direction',x:-1,y:0})).ok,true);
  alice.stop();await until(()=>bob.getState()==='waiting');
  await until(()=>bob.getSnapshot()?.match.players.bob.direction.x===0);
  await assert.rejects(bob.command({type:'startWave'}),/not ready/);
  alice.start();await until(()=>alice.getState()==='ready'&&bob.getState()==='ready');
  assert.deepEqual(alice.getSnapshot().match.players.alice.direction,{x:0,y:0});
  assert.equal((await bob.command({type:'startWave'})).ok,true);
  assert.ok(tokens>=2);
  assert.throws(()=>createCoopClient({...opts,url:'ws://not-local.example/match',getToken:async()=>''}),/secure/);
  assert.throws(()=>createCoopClient({...opts,url:'ws://127.0.0.1/match?token=secret',getToken:async()=>''}),/secure/);
  alice.stop();bob.stop();
});
