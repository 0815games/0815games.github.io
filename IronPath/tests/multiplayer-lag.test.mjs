// Multiplayer lag (Punkt 9), measured before touching anything: the host
// published ~5.8 KB views per player at 10 Hz (115 KB/s of database traffic
// for a duo), ~60% of which was receipt history the client can never read
// (one command in flight), and the remote player's own soldier only answered
// after the full database round trip. These tests pin the three fixes.
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createFirebasePartyHostSession,createFirebasePartyClientSession} from '../firebase-party-session.mjs';
import {createPartyHost} from '../party-host.mjs';
import {createMatch} from '../simulation.mjs';
import {createPlayer} from '../match.mjs';
import {SNAPSHOT_RECEIPTS} from '../protocol.mjs';

const twoPlayerMatch=()=>createMatch(['alice','bob'].map(id=>createPlayer(id,{name:id,gender:'female'})));
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));

test('snapshots carry only the newest receipts, not the whole history',()=>{
  const host=createPartyHost(twoPlayerMatch(),{hostId:'alice'});
  host.setPresence('alice',true);host.setPresence('bob',true);
  let seq=1;
  for(let i=0;i<20;i++){
    host.receive('bob',{version:1,seq:seq++,command:{type:'direction',x:i%2?1:0,y:0}});
    host.advance();
  }
  const snapshot=host.snapshotFor('bob');
  assert.ok(snapshot.receipts.length<=SNAPSHOT_RECEIPTS,'receipt history is windowed');
  assert.equal(snapshot.receipts.length,8,'twenty commands leave the newest eight');
  assert.equal(snapshot.receipts.at(-1).seq,20,'the newest receipt is the latest command');
  assert.equal(snapshot.receipts[0].seq,13,'the window slides with the sequence');
  assert.equal(snapshot.nextSeq,21,'the sequence itself is unaffected');
});

test('the host session publishes at fifteen hertz, not per tick',async()=>{
  const players=['alice','bob'];
  let publishes=0,inputListener=()=>{};
  const hostChannel={watchInputs(fn){inputListener=fn;return()=>{inputListener=()=>{};};},async publishViews(){publishes++;},async close(){}};
  const session=createFirebasePartyHostSession({channel:hostChannel,host:createPartyHost(twoPlayerMatch(),{hostId:'alice'}),playerIds:players,epoch:'epoch-cadence'});
  session.start();session.setPresence('alice',true);session.setPresence('bob',true);await flush();
  // Thirty session steps at thirty steps per second: the pulse counter must
  // coalesce to fifteen publishes, and a double-speed advance (two protocol
  // ticks per step) must not double the rate.
  publishes=0;
  for(let i=0;i<30;i++){session.step();await flush();}
  assert.equal(publishes,15,'fifteen hertz baseline');
  // A command is urgent and publishes on its own step.
  inputListener('bob',{epoch:'epoch-cadence',envelope:{version:1,seq:1,command:{type:'direction',x:1,y:0}}});
  session.step();await flush();
  assert.equal(publishes,16,'command receipts still publish immediately');
  await session.stop();
  // A FAT view throttles back to ten hertz instead of saturating the uplink:
  // late waves run ~10 KB per view, and 15 Hz would cost a duo ~290 KB/s.
  let fatPublishes=0;
  const fatChannel={watchInputs(){return()=>{};},async publishViews(){fatPublishes++;},async close(){}};
  const fatSession=createFirebasePartyHostSession({channel:fatChannel,host:createPartyHost(twoPlayerMatch(),{hostId:'alice'}),playerIds:['alice','bob'],epoch:'epoch-fat',leanViewBytes:1});
  fatSession.start();fatSession.setPresence('alice',true);fatSession.setPresence('bob',true);await flush();
  fatPublishes=0;
  for(let i=0;i<30;i++){fatSession.step();await flush();}
  assert.equal(fatPublishes,10,'fat views publish at ten hertz');
  await fatSession.stop();
});

test('a full session round trip stays small and keeps resolving commands',async()=>{
  const players=['alice','bob'];
  let inputListener=()=>{},listeners={},views=[];
  const hostChannel={watchInputs(fn){inputListener=fn;return()=>{inputListener=()=>{};};},async publishViews(v){views.push(v);for(const id of players)listeners[id]?.(v[id]);},async close(){}};
  const clientChannel=id=>({watchView(fn){listeners[id]=fn;return()=>delete listeners[id];},async writeInput(packet){inputListener(id,packet);},async close(){}});
  const states=[];const bob=createFirebasePartyClientSession({channel:clientChannel('bob'),onState:s=>states.push(s),timeoutMs:50});
  bob.start();
  const session=createFirebasePartyHostSession({channel:hostChannel,host:createPartyHost(twoPlayerMatch(),{hostId:'alice'}),playerIds:players,epoch:'epoch-roundtrip'});
  session.start();session.setPresence('alice',true);session.setPresence('bob',true);await flush();
  // Thirty sequential commands through the real client, host and channel.
  for(let i=0;i<30;i++){
    const sent=bob.command({type:'direction',x:i%2?1:0,y:0});
    await flush();
    for(let step=0;step<3;step++)session.step();
    assert.equal((await sent).ok,true,`command ${i+1} resolves through the windowed receipts`);
    await flush();
  }
  assert.ok(views.length>0,'views were published');
  for(const view of views){
    for(const id of players){
      const size=JSON.stringify(view[id]).length;
      assert.ok(size<4200,`view for ${id} stays lean (${size} bytes)`);
      assert.ok(view[id].snapshot.receipts.length<=SNAPSHOT_RECEIPTS,'published views carry the receipt window only');
    }
  }
  assert.equal(states.at(-1),'ready','the client settles ready after every command');
  await session.stop();await bob.stop();
});

test('the local movement prediction is wired into the game',()=>{
  const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
  assert.match(source,/Render-only prediction: the own soldier answers instantly/,'the prediction is documented where it lands');
  assert.match(source,/myself\.direction=\{x,y\};if\(x\|\|y\)myself\.target=null;/,'direction prediction mirrors the host semantics');
  assert.match(source,/myself\.target=\{x:mx,y:my\};myself\.direction=\{x:0,y:0\};/,'move prediction mirrors the host semantics');
  assert.match(source,/visual=coop&&coopReady&&lastSnapshotAt\?projectCoopMotion/,'the projection that carries the prediction is live');
});
