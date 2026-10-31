import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { createPlayer } from '../../match.mjs';
import { createMatchService } from '../service.mjs';
const profile={name:'Soldier',gender:'female',level:1};
function client(url,origin='https://allowed.example'){
  const ws=new WebSocket(url,{origin}),messages=[],waiters=[];
  ws.on('message',raw=>{const message=JSON.parse(raw.toString()),i=waiters.findIndex(w=>w.predicate(message));if(i>=0){const [w]=waiters.splice(i,1);clearTimeout(w.timer);w.resolve(message);}else messages.push(message);});
  ws.next=(predicate)=>new Promise((resolve,reject)=>{const i=messages.findIndex(predicate);if(i>=0){resolve(messages.splice(i,1)[0]);return;}const w={predicate,resolve};w.timer=setTimeout(()=>{const index=waiters.indexOf(w);if(index>=0)waiters.splice(index,1);reject(new Error('Timed out waiting for message'));},2500);waiters.push(w);});
  ws.sendJSON=value=>ws.send(JSON.stringify(value));return ws;
}
test('real websocket authentication, command ordering, pause and reconnect',async(t)=>{
  const app=createMatchService({players:[createPlayer('alice',profile),createPlayer('bob',profile)],allowedOrigins:['https://allowed.example'],verifyToken:async token=>({uid:token,exp:Math.floor(Date.now()/1000)+3600})});
  await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>app.shutdown(resolve)));
  const url=`ws://127.0.0.1:${app.address().port}/match`;
  const alice=client(url),bob=client(url);t.after(()=>{alice.terminate();bob.terminate();});
  await Promise.all([once(alice,'open'),once(bob,'open')]);
  alice.sendJSON({type:'auth',token:'alice'});await alice.next(m=>m.type==='authenticated');
  await alice.next(m=>m.type==='status'&&!m.ready);
  alice.sendJSON({type:'command',envelope:{version:1,seq:1,command:{type:'startWave'}}});
  assert.equal((await alice.next(m=>m.type==='receipt')).receipt.reason,'match-paused');
  bob.sendJSON({type:'auth',token:'bob'});await bob.next(m=>m.type==='authenticated');await alice.next(m=>m.type==='status'&&m.ready);
  alice.sendJSON({type:'command',envelope:{version:1,seq:1,command:{type:'direction',x:1,y:0}}});
  assert.equal((await alice.next(m=>m.type==='receipt'&&m.receipt.status==='queued')).receipt.seq,1);
  assert.equal((await alice.next(m=>m.type==='receipt'&&m.receipt.status==='applied')).receipt.result.ok,true);
  alice.terminate();await bob.next(m=>m.type==='status'&&!m.ready);
  bob.sendJSON({type:'command',envelope:{version:1,seq:1,command:{type:'startWave'}}});
  assert.equal((await bob.next(m=>m.type==='receipt')).receipt.reason,'match-paused');
  const reconnect=client(url);t.after(()=>reconnect.terminate());await once(reconnect,'open');reconnect.sendJSON({type:'auth',token:'alice'});
  await reconnect.next(m=>m.type==='authenticated');
  const snap=(await reconnect.next(m=>m.type==='snapshot')).snapshot;
  assert.equal(snap.nextSeq,2);assert.deepEqual(snap.match.players.alice.direction,{x:0,y:0});
  await bob.next(m=>m.type==='status'&&m.ready);
  bob.sendJSON({type:'command',envelope:{version:1,seq:1,command:{type:'startWave'}}});
  const applied=await bob.next(m=>m.type==='receipt'&&m.receipt.status==='applied');assert.equal(applied.receipt.result.ok,true);
  reconnect.terminate();bob.terminate();
});
test('rejects wrong origin, non-roster identity and duplicate connections',async(t)=>{
  const app=createMatchService({players:[createPlayer('alice',profile),createPlayer('bob',profile)],allowedOrigins:['https://allowed.example'],verifyToken:async token=>({uid:token,exp:Math.floor(Date.now()/1000)+3600})});
  await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>app.shutdown(resolve)));
  const url=`ws://127.0.0.1:${app.address().port}/match`;
  const bad=client(url,'https://evil.example');bad.on('error',()=>{});await new Promise(resolve=>bad.on('close',resolve));
  const unauthorized=client(url);await once(unauthorized,'open');unauthorized.sendJSON({type:'auth',token:'eve'});assert.equal((await once(unauthorized,'close'))[0],1008);
  const first=client(url);await once(first,'open');first.sendJSON({type:'auth',token:'alice'});await first.next(m=>m.type==='authenticated');
  const duplicate=client(url);await once(duplicate,'open');duplicate.sendJSON({type:'auth',token:'alice'});assert.equal((await once(duplicate,'close'))[0],1008);first.terminate();
});
