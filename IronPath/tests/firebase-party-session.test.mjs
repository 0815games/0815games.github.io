import {strict as assert} from 'node:assert';
import {createFirebasePartyHostSession,createFirebasePartyClientSession} from '../firebase-party-session.mjs';
import {createPartyHost} from '../party-host.mjs';
import {createMatch} from '../simulation.mjs';
import {createPlayer} from '../match.mjs';
const players=['alice','bob'];const host=createPartyHost(createMatch(players.map(id=>createPlayer(id,{name:id,gender:'female'}))));
let inputListener=()=>{},listeners={},published=[],held=null,holdInput=false;
const hostChannel={watchInputs(fn){inputListener=fn;return()=>{inputListener=()=>{};};},async publishViews(views){published.push(views);for(const id of players)listeners[id]?.(views[id]);},async close(){}};
function clientChannel(id){return {watchView(fn){listeners[id]=fn;return()=>delete listeners[id];},async writeInput(packet){if(holdInput)held={id,packet};else inputListener(id,packet);},async close(){}};}
const states=[],alice=createFirebasePartyClientSession({channel:clientChannel('alice'),onState:s=>states.push(s),timeoutMs:15});
let bobView,bobState;const bob=createFirebasePartyClientSession({channel:clientChannel('bob'),onState:s=>bobState=s,onView:s=>bobView=s,timeoutMs:15});
alice.start();bob.start();
const session=createFirebasePartyHostSession({channel:hostChannel,host,playerIds:players,epoch:'epoch-one'});
session.start();session.setPresence('alice',true);session.setPresence('bob',true);
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));await flush();
const first=alice.command({type:'build',pad:0,towerType:0});await flush();
assert.match((await alice.command({type:'startWave'})).reason,/previous/);
for(let i=0;i<6;i++)session.step();await flush();assert.equal((await first).ok,true);assert.equal(bobView.match.towers.length,1);
assert.equal(published.at(-1).alice.snapshot.match.money,75);assert.equal(published.at(-1).bob.snapshot.match.money,125,'legacy snapshots expose the receiving player balance');
// An uncertain command must not be retried or replaced until its receipt arrives.
holdInput=true;const uncertain=bob.command({type:'sell',pad:0});await flush();
assert.match((await uncertain).reason,/unknown/);assert.equal(bobState,'syncing');assert.match((await bob.command({type:'startWave'})).reason,/previous/);
holdInput=false;inputListener(held.id,held.packet);for(let i=0;i<6;i++)session.step();await flush();assert.equal(bobState,'ready');
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
