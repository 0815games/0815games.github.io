import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPartyHost,restorePartyHost} from '../party-host.mjs';
import {createDurableHostSession} from '../firebase-durable-host-session.mjs';
import {createPlayer} from '../match.mjs';
import {createMatch} from '../simulation.mjs';
const ids=['alice','bob'];
function setup(){const host=createPartyHost(createMatch(ids.map(id=>createPlayer(id,{name:id,gender:'female'}))),{hostId:'alice'}),frames=[],errors=[];let held,resolve,reject;const store={async initialize(checkpoint,views){held={checkpoint,views};return {generation:1,owner:'a'.repeat(32)};},publish(_f,checkpoint,views){held={checkpoint,views};return new Promise((ok,no)=>{resolve=ok;reject=no;});}};const session=createDurableHostSession({host,store,playerIds:ids,onCommitted:v=>frames.push(v),onError:e=>errors.push(e)});return {host,session,frames,errors,get held(){return held;},resolve:()=>resolve(),reject:()=>reject(Error('disk unavailable'))};}
test('host-local command receipts are not delivered until the matching checkpoint is committed',async()=>{
 const f=setup();assert.equal(await f.session.start(),true);f.session.setPresence('alice',true);f.session.setPresence('bob',true);assert.equal(f.session.receive('alice',{generation:1,owner:'a'.repeat(32),envelope:{version:1,seq:1,command:{type:'build',pad:0,towerType:0}}}).status,'queued');const step=f.session.step();assert.equal(f.frames.length,1);assert.equal(f.held.checkpoint.tick,1);assert.equal(f.held.views.alice.snapshot.receipts[0].status,'applied');assert.equal(await f.session.step(),false,'no concurrent writes');f.resolve();assert.equal(await step,true);assert.equal(f.frames.length,2);assert.equal(f.frames[1].views.alice.snapshot.receipts[0].status,'applied');assert.equal(f.frames[1].checkpoint.match.towers.length,1);f.session.stop();
});
test('a failed checkpoint never acknowledges a command and permanently stops the host',async()=>{
 const f=setup();await f.session.start();f.session.setPresence('alice',true);f.session.setPresence('bob',true);f.session.receive('bob',{generation:1,owner:'a'.repeat(32),envelope:{version:1,seq:1,command:{type:'move',x:700,y:400}}});const pending=f.session.step();f.reject();assert.equal(await pending,false);assert.equal(f.frames.length,1);assert.equal(f.errors.length,1);assert.equal(f.session.isFailed(),true);assert.equal(f.session.receive('bob',{generation:1,owner:'a'.repeat(32),envelope:{version:1,seq:2,command:{type:'startWave'}}}).status,'rejected');assert.equal(await f.session.step(),false);
});
test('recovered host begins paused and cannot replay previously queued commands',async()=>{
 const f=setup();await f.session.start();f.session.setPresence('alice',true);f.session.setPresence('bob',true);f.session.receive('bob',{generation:1,owner:'a'.repeat(32),envelope:{version:1,seq:1,command:{type:'move',x:700,y:400}}});const restored=restorePartyHost(f.host.checkpoint(),{hostId:'alice',playerIds:ids,mode:'coop'});assert.equal(restored.advance(),null);assert.equal(restored.snapshotFor('bob').receipts[0].status,'cancelled');for(const id of ids)restored.setPresence(id,true);assert.deepEqual(restored.advance().commands,[]);f.session.stop();
});
test('stopping while a publish is pending suppresses a late local acknowledgement',async()=>{
 const f=setup();await f.session.start();f.session.setPresence('alice',true);const pending=f.session.step();f.session.stop();f.resolve();assert.equal(await pending,false);assert.equal(f.frames.length,1);
});

test('a recovered host rejects delayed inputs from an old generation',async()=>{
 const f=setup();await f.session.start();f.session.setPresence('alice',true);f.session.setPresence('bob',true);const input={version:1,seq:1,command:{type:'startWave'}};assert.equal(f.session.receive('bob',{generation:0,owner:'b'.repeat(32),envelope:input}).reason,'stale-generation');assert.equal(f.session.receive('bob',{generation:1,owner:'a'.repeat(32),envelope:input}).status,'queued');f.session.stop();
});

test('unchanged paused matches do not repeatedly write checkpoints',async()=>{
 const f=setup();await f.session.start();for(let i=0;i<20;i++)assert.equal(await f.session.step(),true);assert.equal(f.frames.length,1,'no duplicate network commits');f.session.setConnections('alice',['a'.repeat(32)]);const changed=f.session.step();f.resolve();assert.equal(await changed,true);assert.equal(f.frames.length,2,'connection changes are still saved');for(let i=0;i<10;i++)assert.equal(await f.session.step(),true);assert.equal(f.frames.length,2);f.session.stop();
});
test('finished matches stop ticking but still commit presence changes',async()=>{
 const f=setup();await f.session.start();f.session.setPresence('alice',true);f.session.setPresence('bob',true);const start=f.session.step();f.resolve();await start;assert.equal(f.session.receive('alice',{generation:1,owner:'a'.repeat(32),envelope:{version:1,seq:1,command:{type:'endRun'}}}).status,'queued');const end=f.session.step();f.resolve();await end;const tick=f.frames.at(-1).checkpoint.tick;assert.equal(f.frames.at(-1).checkpoint.match.ended,true);const count=f.frames.length;for(let i=0;i<20;i++)assert.equal(await f.session.step(),true);assert.equal(f.frames.length,count);assert.equal(f.host.checkpoint().tick,tick);f.session.setPresence('bob',false);const changed=f.session.step();f.resolve();await changed;assert.equal(f.frames.length,count+1);assert.equal(f.frames.at(-1).views.bob.ready,false);f.session.stop();
});

test('presence changes during a pending commit are saved on the following tick',async()=>{
 const f=setup();await f.session.start();f.session.setPresence('alice',true);f.session.setPresence('bob',true);f.session.setConnections('alice',['a'.repeat(32)]);f.session.setConnections('bob',['b'.repeat(32)]);const inflight=f.session.step();f.session.setPresence('bob',false);f.resolve();assert.equal(await inflight,true);assert.equal(f.frames.at(-1).views.bob.ready,true,'first frame reflects its own checkpoint');const corrective=f.session.step();f.resolve();assert.equal(await corrective,true);assert.equal(f.frames.at(-1).views.bob.ready,false,'subsequent commit carries the disconnect');f.session.stop();
});

test('six-tick batch persists its receipt before acknowledging and saves commands arriving during the write',async()=>{
 const f=setup();await f.session.start();f.session.setPresence('alice',true);f.session.setPresence('bob',true);const send=(id,seq,command)=>f.session.receive(id,{generation:1,owner:'a'.repeat(32),envelope:{version:1,seq,command}});
 assert.equal(send('alice',1,{type:'build',pad:0,towerType:0}).status,'queued');const first=f.session.step(6);assert.equal(f.held.checkpoint.tick,6);assert.equal(f.frames.length,1);assert.equal(send('bob',1,{type:'move',x:700,y:400}).status,'queued');assert.equal(await f.session.step(6),false);f.resolve();await first;assert.equal(f.frames.at(-1).views.alice.snapshot.receipts[0].status,'applied');assert.equal(f.frames.at(-1).views.bob.snapshot.receipts.length,0);const second=f.session.step(6);assert.equal(f.held.checkpoint.tick,12);assert.equal(f.held.views.bob.snapshot.receipts[0].status,'applied');f.resolve();await second;assert.equal(f.frames.at(-1).checkpoint.players.bob.receipts[0].response.status,'applied');f.session.stop();
});
