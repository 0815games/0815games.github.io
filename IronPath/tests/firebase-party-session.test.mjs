import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createFirebasePartyHostSession,createFirebasePartyClientSession} from '../net/firebase-party-session.mjs';
import {createPartyHost} from '../party-host.mjs';
import {createMatch} from '../simulation.mjs';
import {createVersus} from '../versus.mjs';
import {createPlayer} from '../match.mjs';

test('the Firebase party session sequences, pauses and resyncs after an uncertain write',async()=>{
const players=['alice','bob'];const host=createPartyHost(createMatch(players.map(id=>createPlayer(id,{name:id,gender:'female'}))));
let inputListener=()=>{},listeners={},published=[],held=null,holdInput=false,failHeld=false;
const hostChannel={watchInputs(fn){inputListener=fn;return()=>{inputListener=()=>{};};},async publishViews(views){published.push(views);for(const id of players)listeners[id]?.(views[id]);},async close(){}};
function clientChannel(id){return {watchView(fn){listeners[id]=fn;return()=>delete listeners[id];},async writeInput(packet){if(holdInput){held={id,packet};if(failHeld)throw Error('write outcome unknown');}else inputListener(id,packet);},async close(){}};}
// A deliberately failed write below models uncertainty without making every
// unrelated pause/receipt assertion race a 15 ms wall-clock deadline.
const states=[],alice=createFirebasePartyClientSession({channel:clientChannel('alice'),onState:s=>states.push(s),timeoutMs:2000});
let bobView,bobState;const bob=createFirebasePartyClientSession({channel:clientChannel('bob'),onState:s=>bobState=s,onView:s=>bobView=s,timeoutMs:2000});
alice.start();bob.start();
const session=createFirebasePartyHostSession({channel:hostChannel,host,playerIds:players,epoch:'epoch-one'});
session.start();session.setPresence('alice',true);session.setPresence('bob',true);
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));await flush();
const first=alice.command({type:'build',pad:0,towerType:0});await flush();
assert.match((await alice.command({type:'startWave'})).reason,/previous/);
for(let i=0;i<6;i++)session.step();await flush();assert.equal((await first).ok,true);assert.equal(bobView.match.towers.length,1);
assert.equal(published.at(-1).alice.snapshot.match.money,75);assert.equal(published.at(-1).bob.snapshot.match.money,125,'legacy snapshots expose the receiving player balance');
// A failed write may still arrive at the host. It must not be retried or
// replaced until its receipt arrives; keep the delayed packet to simulate that.
holdInput=true;failHeld=true;const uncertain=bob.command({type:'sell',pad:0});await flush();
assert.match((await uncertain).reason,/unknown/);assert.equal(bobState,'syncing');assert.match((await bob.command({type:'startWave'})).reason,/previous/);
holdInput=false;failHeld=false;inputListener(held.id,held.packet);for(let i=0;i<6;i++)session.step();await flush();assert.equal(bobState,'ready');
const wave=alice.command({type:'startWave'});await flush();for(let i=0;i<6;i++)session.step();await flush();assert.equal((await wave).waitingForGuest,true);assert.equal(bobView.match.wave,0);
const approval=bob.command({type:'approveWave',requestId:bobView.match.waveRequestId});await flush();for(let i=0;i<6;i++)session.step();await flush();assert.equal((await approval).ok,true);assert.equal(bobView.match.wave,1);
// A packet delayed across a pause is cancelled with a receipt, not replayed.
holdInput=true;const late=bob.command({type:'move',x:500,y:300});await flush();assert.equal(held.packet.envelope.focusGeneration,0);session.setFocusPaused(true);await flush();assert.equal(bobView.hostPaused,true);session.setFocusPaused(false);await flush();holdInput=false;inputListener(held.id,held.packet);await flush();assert.match((await late).reason,/host paused/);assert.equal(bobView.match.players.bob.target,null);assert.equal(bobView.focusGeneration,1);assert.equal(bobState,'ready');
// Guest disconnect cancels only their pending commands; the host continues.
const sale=bob.command({type:'sell',pad:0});await flush();session.setPresence('bob',false);await flush();
assert.match((await sale).reason,/cancelled/);assert.ok(session.step());assert.equal(bobView.match.towers.length,0);
const hostMove=alice.command({type:'move',x:700,y:400});await flush();for(let i=0;i<6;i++)session.step();await flush();assert.equal((await hostMove).ok,true);
assert.ok(states.includes('ready'));assert.ok(states.includes('waiting'));
await alice.stop();await bob.stop();await session.stop();
// Different host epochs cannot silently resume an old session.
let viewCallback;let state;const epochChannel={watchView(fn){viewCallback=fn;return()=>{};},async writeInput(){},async close(){}};
const epochClient=createFirebasePartyClientSession({channel:epochChannel,onState:s=>{state=s;},timeoutMs:50});epochClient.start();
const snap={tick:2,nextSeq:1,receipts:[]};viewCallback({epoch:'old',ready:true,snapshot:snap});viewCallback({epoch:'new',ready:true,snapshot:snap});
assert.equal(state,'error');assert.equal((await epochClient.command({type:'startWave'})).ok,false);await epochClient.stop();
console.log('Firebase party session sequencing, pause and uncertainty tests passed.');
// A hosting player uses the authoritative simulation directly, not a network
// round trip; the guest still receives ordered Firebase-style snapshots.
const fastHost=createPartyHost(createMatch(players.map(id=>createPlayer(id,{name:id,gender:'female'}))));let guestInputs,networkViews=0,localSnapshot;
const fastSession=createFirebasePartyHostSession({host:fastHost,playerIds:players,epoch:'local',localPlayerId:'alice',channel:{watchInputs(fn){guestInputs=fn;return()=>{};},async publishViews(){networkViews++;},async close(){}}});
const local=createFirebasePartyClientSession({channel:fastSession.localChannel(),onView:s=>localSnapshot=s,timeoutMs:100});local.start();fastSession.start();fastSession.setPresence('alice',true);fastSession.setPresence('bob',true);
const direct=local.command({type:'move',x:700,y:400});await flush();fastSession.step();await flush();assert.equal((await direct).ok,true);assert.deepEqual(localSnapshot.match.players.alice.target,{x:700,y:400});assert.ok(networkViews>0);assert.equal(typeof guestInputs,'function');
await local.stop();await fastSession.stop();

// Malformed commands must not consume or lock a sequence on the host.
let validatedView, sent=[];
const validationClient=createFirebasePartyClientSession({channel:{watchView(fn){validatedView=fn;return()=>{};},async writeInput(packet){sent.push(packet);},async close(){}}});
validationClient.start();validatedView({epoch:'safe',ready:true,snapshot:{tick:0,nextSeq:1,receipts:[]}});
assert.match((await validationClient.command({type:'approveWave'})).reason,/Invalid/);
assert.match((await validationClient.command({type:'move',x:NaN,y:2})).reason,/Invalid/);
assert.match((await validationClient.command({type:'startWave',extra:1})).reason,/Invalid/);
assert.equal(sent.length,0);
const mutable={type:'move',x:100,y:200},valid=validationClient.command(mutable);mutable.x=NaN;await flush();assert.equal(sent[0].envelope.command.x,100);
validatedView({epoch:'safe',ready:true,snapshot:{tick:1,nextSeq:2,receipts:[{seq:1,status:'applied',result:{ok:true}}]}});
assert.equal((await valid).ok,true);await validationClient.stop();
});

test('a timed-out command stays locked until its late receipt arrives',async()=>{
 let view;const writes=[],states=[];
 const client=createFirebasePartyClientSession({channel:{watchView(fn){view=fn;return()=>{};},async writeInput(packet){writes.push(packet);},async close(){}},onState:value=>states.push(value),timeoutMs:15});
 try{
  client.start();view({epoch:'timeout',ready:true,snapshot:{tick:0,nextSeq:1,receipts:[]}});
  const result=await client.command({type:'move',x:100,y:200});
  assert.match(result.reason,/unknown/);assert.equal(states.at(-1),'syncing');assert.equal(writes.length,1);
  assert.match((await client.command({type:'startWave'})).reason,/previous/);
  view({epoch:'timeout',ready:true,snapshot:{tick:1,nextSeq:2,receipts:[{seq:1,status:'applied',result:{ok:true}}]}});
  assert.equal(states.at(-1),'ready','the later receipt reconciles the old sequence');
  const next=client.command({type:'startWave'});await new Promise(resolve=>setImmediate(resolve));assert.equal(writes.length,2);assert.equal(writes[1].envelope.seq,2);
  await client.stop();assert.match((await next).reason,/closed/);
 }finally{await client.stop();}
});

test('a wave packet delayed across another player reconnect is cancelled, then a fresh request succeeds',async()=>{
 const ids=['alice','bob'],host=createPartyHost(createMatch(ids.map(id=>createPlayer(id,{name:id,gender:'female'}))),{hostId:'alice'});
 let inputListener,viewListener,held,hold=true,latest;
 const hostChannel={watchInputs(fn){inputListener=fn;return()=>{};},async publishViews(views){if(views.alice)viewListener?.(views.alice);},async close(){}};
 const channel={watchView(fn){viewListener=fn;return()=>{};},async writeInput(packet){if(hold)held=packet;else inputListener('alice',packet);},async close(){}};
 const client=createFirebasePartyClientSession({channel,onView:s=>latest=s,timeoutMs:1000}),session=createFirebasePartyHostSession({channel:hostChannel,host,playerIds:ids,epoch:'wave-fence'});
 const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
 try{
  client.start();session.start();session.setPresence('alice',true);session.setPresence('bob',true);await flush();
  const old=client.command({type:'startWave'});await flush();assert.equal(held.envelope.rosterGeneration,0);
  session.setPresence('bob',false);session.setPresence('bob',true);await flush();assert.equal(latest.rosterGeneration,1);
  hold=false;inputListener('alice',held);await flush();assert.match((await old).reason,/cancelled/i);assert.equal(host.snapshotFor('alice').match.pendingWave,0);
  const fresh=client.command({type:'startWave'});await flush();session.step();await flush();assert.equal((await fresh).ok,true);assert.equal(host.snapshotFor('alice').match.waveRequest.requester,'alice');
 }finally{await client.stop();await session.stop();}
});

for(const [mode,sender,absent] of [['coop','bob','bob'],['versus','alice','bob'],['versus','bob','bob']])test(`${mode}: a delayed wave packet arriving during ${absent}'s outage unblocks ${sender} on reconnect`,async()=>{
 const ids=['alice','bob'],players=ids.map(id=>createPlayer(id,{name:id,gender:'female'}));
 const host=createPartyHost(mode==='versus'?createVersus(players,'road','alice'):createMatch(players),{hostId:'alice'});
 const listeners={},online={alice:true,bob:true},stored={};let input,held,hold=true,latest;
 const hostChannel={watchInputs(fn){input=fn;return()=>{};},async publishViews(views){for(const [id,view] of Object.entries(views)){stored[id]=view;if(online[id])listeners[id]?.(view);}},async close(){}};
 const channel={watchView(fn){listeners[sender]=fn;return()=>delete listeners[sender];},async writeInput(packet){if(hold)held=packet;else input(sender,packet);},async close(){}};
 const session=createFirebasePartyHostSession({channel:hostChannel,host,playerIds:ids,epoch:'outage-test'}),client=createFirebasePartyClientSession({channel,onView:s=>latest=s,timeoutMs:1000});
 const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
 try{
  client.start();session.start();for(const id of ids)session.setPresence(id,true);await flush();
  const pending=client.command({type:'startWave'});await flush();assert.equal(held.envelope.rosterGeneration,0);
  online[absent]=false;session.setPresence(absent,false);await flush();
  hold=false;input(sender,held);await flush();
  assert.equal(host.snapshotFor(sender).receipts.at(-1).status,'cancelled');
  assert.equal(host.snapshotFor(sender).match.pendingWave,0);
  online[absent]=true;session.setPresence(absent,true);await flush();
  if(sender===absent&&stored[sender])listeners[sender]?.(stored[sender]);
  assert.match((await pending).reason,/cancelled/i);assert.equal(latest.nextSeq,2);
  const next=client.command({type:'startWave'});await flush();session.step();await flush();
  assert.equal((await next).ok,true,'the next input uses the new sequence and roster');
 }finally{await client.stop();await session.stop();}
});

for(const [mode,sender,absent] of [['coop','bob','bob'],['versus','alice','bob'],['versus','bob','bob']])test(`${mode}: a delayed speed request during ${absent}'s outage unblocks ${sender} on reconnect`,async()=>{
 const ids=['alice','bob'],players=ids.map(id=>createPlayer(id,{name:id,gender:'female'}));
 const match=mode==='versus'?createVersus(players,'road','alice'):createMatch(players);
 for(const field of mode==='versus'?Object.values(match.lanes):[match]){field.wave=2;field.running=true;field.spawnLeft=1;field.spawnTimer=100;}
 const host=createPartyHost(match,{hostId:'alice'}),listeners={},online={alice:true,bob:true},stored={};let input,held,hold=true,latest;
 const hostChannel={watchInputs(fn){input=fn;return()=>{};},async publishViews(views){for(const [id,view] of Object.entries(views)){stored[id]=view;if(online[id])listeners[id]?.(view);}},async close(){}};
 const channel={watchView(fn){listeners[sender]=fn;return()=>delete listeners[sender];},async writeInput(packet){if(hold)held=packet;else input(sender,packet);},async close(){}};
 const session=createFirebasePartyHostSession({channel:hostChannel,host,playerIds:ids,epoch:'speed-fence'}),client=createFirebasePartyClientSession({channel,onView:s=>latest=s,timeoutMs:1000});
 const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
 try{
  client.start();session.start();session.setPresence('alice',true);session.setPresence('bob',true);await flush();
  const pending=client.command({type:'requestSpeed'});await flush();assert.equal(held.envelope.rosterGeneration,0);
  online[absent]=false;session.setPresence(absent,false);await flush();hold=false;input(sender,held);await flush();
  assert.equal(host.snapshotFor(sender).receipts.at(-1).status,'cancelled');assert.equal(host.snapshotFor(sender).speedControl.request,null);
  online[absent]=true;session.setPresence(absent,true);await flush();if(sender===absent&&stored[sender])listeners[sender]?.(stored[sender]);
  assert.match((await pending).reason,/cancelled/i);assert.equal(latest.nextSeq,2);
  const next=client.command({type:'requestSpeed'});await flush();session.step();await flush();
  assert.equal((await next).ok,true);assert.equal(host.snapshotFor(sender).speedControl.request.requester,sender);
 }finally{await client.stop();await session.stop();}
});

test('a queued full view cannot overwrite a newer same-tick cancellation receipt',async()=>{
 const ids=['alice','bob'],host=createPartyHost(createMatch(ids.map(id=>createPlayer(id,{name:id,gender:'female'}))),{hostId:'alice'});
 let input,holdNext=false,releaseWrite,enteredWrite,tail=Promise.resolve();const delivered=[];
 const blocked=new Promise(resolve=>releaseWrite=resolve),entered=new Promise(resolve=>enteredWrite=resolve);
 const channel={watchInputs(fn){input=fn;return()=>{};},publishViews(views){
  const copy=structuredClone(views),hold=holdNext;holdNext=false;
  const write=tail.then(async()=>{if(hold){enteredWrite();await blocked;}delivered.push(copy);});tail=write.catch(()=>{});return write;
 },async close(){await tail;}};
 const session=createFirebasePartyHostSession({channel,host,playerIds:ids,epoch:'ordered-views'}),flush=()=>new Promise(resolve=>setTimeout(resolve,0));
 try{
  session.start();for(const id of ids)session.setPresence(id,true);await flush();await tail;
  const packet={version:1,seq:1,command:{type:'startWave'},rosterGeneration:host.snapshotFor('alice').rosterGeneration};
  holdNext=true;session.setConnections('alice',['a'.repeat(32)]);await entered;
  session.setPresence('bob',false);input('alice',{epoch:'ordered-views',envelope:packet});
  releaseWrite();await flush();await tail;await flush();await tail;
  const aliceViews=delivered.filter(views=>views.alice).map(views=>views.alice.snapshot);
  assert.equal(aliceViews.at(-1).nextSeq,2,'the final full view must not regress the receipt sequence');
  assert.equal(aliceViews.at(-1).receipts.at(-1).status,'cancelled');
 }finally{releaseWrite();await session.stop();}
});

test('a paused competitive host may send only end intent; connected clients see the final report before the missing guest returns',async()=>{
 const ids=['alice','bob'],players=ids.map(id=>createPlayer(id,{name:id,gender:'female'}));
 const host=createPartyHost(createVersus(players,'road','alice'),{hostId:'alice'});let input,bobView,bobState,listenBob;
 const transport={watchInputs(fn){input=fn;return()=>{};},async publishViews(views){if(views.bob)listenBob?.(views.bob);},async close(){}};
 const session=createFirebasePartyHostSession({channel:transport,host,playerIds:ids,epoch:'paused-end',localPlayerId:'alice'});
 let hostState;const alice=createFirebasePartyClientSession({channel:session.localChannel(),onState:value=>hostState=value,timeoutMs:1000});
 const bob=createFirebasePartyClientSession({channel:{watchView(fn){listenBob=fn;return()=>{};},async writeInput(packet){input('bob',packet);},async close(){}},onState:value=>bobState=value,onView:value=>bobView=value,timeoutMs:1000});
 const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
 try{
  alice.start();bob.start();session.start();for(const id of ids)session.setPresence(id,true);await flush();
  session.setPresence('bob',false);await flush();assert.equal(hostState,'waiting');assert.equal(alice.canEnd(),true);
  assert.match((await alice.command({type:'move',x:700,y:400})).reason,/not ready/i);
  session.setFocusPaused(true);await flush();assert.equal(alice.canEnd(),false);assert.match((await alice.command({type:'endRun'})).reason,/not ready/i);
  session.setFocusPaused(false);await flush();assert.equal(alice.canEnd(),true);
  const end=alice.command({type:'endRun'});await flush();const frame=session.step();await flush();assert.equal((await end).ok,true);assert.deepEqual(frame.events,[]);
  assert.ok(bobView.partyEnd);assert.equal(hostState,'ready');assert.equal(bobState,'waiting');
  session.setPresence('bob',true);await flush();assert.equal(bobState,'ready');
  const ack=bob.command({type:'acknowledgePartyEnd',endTick:bobView.partyEnd.tick});await flush();session.step();await flush();assert.equal((await ack).ok,true);
  assert.ok(host.snapshotFor('alice').partyEnd.acknowledged.includes('bob'));
 }finally{await alice.stop();await bob.stop();await session.stop();}
});

test('a late gameplay packet during a competitive pause is cancelled so the host can still request an end',async()=>{
 const ids=['alice','bob'],players=ids.map(id=>createPlayer(id,{name:id,gender:'female'})),host=createPartyHost(createVersus(players,'road','alice'),{hostId:'alice'});
 let input,view,held,hold=true;const hostChannel={watchInputs(fn){input=fn;return()=>{};},async publishViews(views){if(views.alice)view?.(views.alice);},async close(){}};
 const channel={watchView(fn){view=fn;return()=>{};},async writeInput(packet){if(hold)held=packet;else input('alice',packet);},async close(){}};
 const session=createFirebasePartyHostSession({channel:hostChannel,host,playerIds:ids,epoch:'late-before-end'}),client=createFirebasePartyClientSession({channel,timeoutMs:100});const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
 try{
  client.start();session.start();for(const id of ids)session.setPresence(id,true);await flush();
  const move=client.command({type:'move',x:700,y:400});await flush();session.setPresence('bob',false);await flush();
  hold=false;input('alice',held);await flush();assert.match((await move).reason,/cancelled/i);
  const end=client.command({type:'endRun'});await flush();session.step();await flush();assert.equal((await end).ok,true);
  assert.equal(host.snapshotFor('alice').match.players.alice.target,null);
 }finally{await client.stop();await session.stop();}
});
