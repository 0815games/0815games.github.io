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
import {createTwoVsTwo} from '../four-modes.mjs';
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

test('the host session paces to an uplink budget across roster sizes',async()=>{
  // Rosters amplify the publish set: a duo runs a ~7 KB view set, two-vs-two
  // ~13 KB before a wave even spawns (every view carries BOTH lanes), and a
  // running four-player field reaches 17-25 KB - doubling again in late
  // waves. The session therefore paces the FULL set by an uplink budget
  // (default 180 KB/s), quantized to 15/10/7.5/6/5 Hz, with receipts as
  // tiny sender-only publishes on top.
  const sizes={};
  const countPublishes=async(build,ids,budget,record)=>{
    let publishes=0,blob=0;
    const party=createPartyHost(build(),{hostId:ids[0]});
    for(const id of ids)party.setPresence(id,true);
    const channel={watchInputs(){return()=>{};},async publishViews(views){publishes++;blob=Math.max(blob,JSON.stringify(views).length);},async close(){}};
    const session=createFirebasePartyHostSession({channel,host:party,playerIds:ids,epoch:'epoch-budget',...(budget?{publishBudgetBytesPerSecond:budget}:{})});
    session.start();await flush();
    for(let i=0;i<3;i++){session.step();await flush();}
    publishes=0;
    for(let i=0;i<30;i++){session.step();await flush();}
    if(record)sizes[record]=blob;
    await session.stop();
    return publishes;
  };
  const mk=id=>createPlayer(id,{name:id,gender:'male',level:25,skills:'3,3,2,2,1;engineer;1100000000',loadout:'3,3,10',storyProgress:12});
  // The quantization ladder on a stable duo set (~3.4 KB at rest).
  const duo=()=>createMatch([mk('alice'),mk('bob')],'road');
  assert.equal(await countPublishes(duo,['alice','bob']),15,'the default budget gives a lean duo fifteen hertz');
  assert.equal(await countPublishes(duo,['alice','bob'],25000),8,'a tighter budget quantizes to seven and a half');
  assert.equal(await countPublishes(duo,['alice','bob'],20000),6,'and to six hertz');
  assert.equal(await countPublishes(duo,['alice','bob'],1000),5,'a starvation budget floors at five hertz');
  // The roster amplification itself: a two-vs-two set (both lanes in every
  // view) runs ~13.4 KB at rest - four times the duo - and must pace below
  // the duo on the same budget.
  const four=['a','b','c','d'].map(mk);
  assert.equal(await countPublishes(()=>createTwoVsTwo(four,'a',[['a','b'],['c','d']]),['a','b','c','d'],100000,'2v2'),8,'two-vs-two paces below the duo on the same budget');
  await countPublishes(duo,['alice','bob'],100000,'duo');
  assert.ok(sizes['2v2']>sizes['duo']*3,`rosters amplify the view set (${sizes['duo']} -> ${sizes['2v2']} bytes)`);
});

test('command receipts publish only the sender, never the whole roster',async()=>{
  const players=['alice','bob'];
  const published=[];
  let inputListener=()=>{};
  const hostChannel={watchInputs(fn){inputListener=fn;return()=>{inputListener=()=>{};};},async publishViews(views){published.push(views);},async close(){}};
  const session=createFirebasePartyHostSession({channel:hostChannel,host:createPartyHost(twoPlayerMatch(),{hostId:'alice'}),playerIds:players,epoch:'epoch-receipts',localPlayerId:'alice'});
  session.start();session.setPresence('alice',true);session.setPresence('bob',true);await flush();
  // A remote command publishes its receipt as a sender-only view.
  inputListener('bob',{epoch:'epoch-receipts',envelope:{version:1,seq:1,command:{type:'direction',x:1,y:0}}});
  session.step();await flush();
  assert.ok(published.some(views=>Object.keys(views).join(',')==='bob'),'the receipt publish addresses only bob');
  // The host's own command publishes nothing: its screen is localView().
  const before=published.length;
  const local=session.localChannel();
  await local.writeInput({epoch:'epoch-receipts',envelope:{version:1,seq:1,command:{type:'direction',x:0,y:1}}});
  session.step();await flush();
  assert.equal(published.length,before,'the host command costs no database write');
  await session.stop();
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
    for(const id of Object.keys(view)){
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
