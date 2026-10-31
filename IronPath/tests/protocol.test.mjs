import { strict as assert } from 'node:assert';
import { createPlayer } from '../match.mjs';
import { createMatch } from '../simulation.mjs';
import { createHost, restoreHost, PROTOCOL_VERSION, MAX_PENDING, RECEIPT_HISTORY } from '../protocol.mjs';
const profile={name:'Soldier',gender:'female',level:2};
const match=()=>createMatch([createPlayer('alice',profile),createPlayer('bob',profile)]);
const message=(seq,command)=>({version:PROTOCOL_VERSION,seq,command});
const initial=match(),host=createHost(initial);
initial.money=9999; // input and snapshots are detached
assert.equal(host.snapshotFor('alice').match.money,125);
assert.equal(host.snapshotFor('intruder'),null);
assert.equal(host.receive('intruder',message(1,{type:'startWave'})).reason,'unknown-player');
assert.equal(host.receive('alice',{...message(1,{type:'startWave'}),version:99}).reason,'version');
assert.equal(host.receive('alice',message(2,{type:'startWave'})).reason,'out-of-order');
assert.equal(host.receive('alice',message(1,{type:'build',pad:0,towerType:0,playerId:'bob'})).reason,'malformed-command');
const build=message(1,{type:'build',pad:0,towerType:0});
assert.equal(host.receive('alice',build).status,'queued');
assert.equal(host.receive('alice',build).status,'queued');
assert.equal(host.receive('alice',message(1,{type:'sell',pad:0})).reason,'sequence-conflict');
assert.equal(host.receive('bob',message(1,{type:'build',pad:0,towerType:1})).status,'queued');
// Restore a checkpoint with unprocessed commands; both are applied exactly once.
const restored=restoreHost(JSON.parse(JSON.stringify(host.checkpoint())));
const tick=host.advance(),restoredTick=restored.advance();
assert.deepEqual(restoredTick,tick);
assert.equal(tick.commands.length,2);
assert.equal(tick.commands[0].result.ok,true);
assert.equal(tick.commands[1].result.ok,false);
assert.equal(host.snapshotFor('alice').match.money,75);
assert.equal(host.receive('alice',build).status,'applied');
assert.equal(host.receive('bob',message(1,{type:'build',pad:0,towerType:1})).result.ok,false);
assert.equal(host.advance().commands.length,0);
// A well-formed but illegal action consumes its sequence and is never retried as a new action.
const invalid=message(2,{type:'build',pad:999,towerType:0});
assert.equal(host.receive('alice',invalid).status,'queued');
assert.equal(host.advance().commands[0].result.ok,false);
assert.equal(host.receive('alice',invalid).result.ok,false);
assert.equal(host.snapshotFor('alice').nextSeq,3);
assert.equal(host.snapshotFor('alice').match.towers.length,1);
const client=host.snapshotFor('alice');client.match.money=0;assert.equal(host.snapshotFor('alice').match.money,75);
assert.throws(()=>restoreHost({...host.checkpoint(),version:99}));
assert.throws(()=>restoreHost({...host.checkpoint(),queue:[{playerId:'eve',seq:1,command:{type:'airstrike'}}]}));
// Retry after reconnect and replay the same ordered input on a fresh host.
const input=[['alice',message(1,{type:'direction',x:-1,y:0})],['bob',message(1,{type:'startWave'})],['alice',message(2,{type:'direction',x:0,y:0})]];
function replay(){const h=createHost(match());for(const [id,msg] of input)assert.equal(h.receive(id,msg).status,'queued');const out=[];for(let i=0;i<80;i++)out.push(h.advance());return {out,checkpoint:h.checkpoint()};}
assert.deepEqual(replay(),replay());
// Bounded queue and receipt retention: old retries are rejected, never reapplied.
const bounded=createHost(match());for(let i=1;i<=MAX_PENDING;i++)assert.equal(bounded.receive('alice',message(i,{type:'direction',x:0,y:0})).status,'queued');
assert.equal(bounded.receive('alice',message(MAX_PENDING+1,{type:'direction',x:0,y:0})).reason,'queue-full');bounded.advance();
for(let i=MAX_PENDING+1;i<=MAX_PENDING+RECEIPT_HISTORY;i++){assert.equal(bounded.receive('alice',message(i,{type:'direction',x:0,y:0})).status,'queued');bounded.advance();}
assert.equal(bounded.receive('alice',message(1,{type:'direction',x:0,y:0})).reason,'receipt-expired');
console.log('Protocol ordering, retries, checkpoints and replay tests passed.');
