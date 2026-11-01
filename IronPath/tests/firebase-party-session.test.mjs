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
// An uncertain command must not be retried or replaced until its receipt arrives.
holdInput=true;const uncertain=bob.command({type:'sell',pad:0});await flush();
assert.match((await uncertain).reason,/unknown/);assert.equal(bobState,'syncing');assert.match((await bob.command({type:'startWave'})).reason,/previous/);
holdInput=false;inputListener(held.id,held.packet);for(let i=0;i<6;i++)session.step();await flush();assert.equal(bobState,'ready');
const wave=bob.command({type:'startWave'});await flush();for(let i=0;i<6;i++)session.step();await flush();assert.equal((await wave).ok,true);
// Disconnect cancels pending commands and pauses the game.
const sale=alice.command({type:'sell',pad:0});await flush();session.setPresence('bob',false);await flush();
assert.match((await sale).reason,/cancelled/);assert.equal(session.step(),null);assert.equal(bobView.match.towers.length,0);
assert.equal((await alice.command({type:'startWave'})).ok,false);
assert.ok(states.includes('ready'));assert.ok(states.includes('waiting'));
await alice.stop();await bob.stop();await session.stop();
// Different host epochs cannot silently resume an old session.
let viewCallback;let state;const epochChannel={watchView(fn){viewCallback=fn;return()=>{};},async writeInput(){},async close(){}};
const epochClient=createFirebasePartyClientSession({channel:epochChannel,onState:s=>{state=s;},timeoutMs:50});epochClient.start();
const snap={tick:2,nextSeq:1,receipts:[]};viewCallback({epoch:'old',ready:true,snapshot:snap});viewCallback({epoch:'new',ready:true,snapshot:snap});
assert.equal(state,'error');assert.equal((await epochClient.command({type:'startWave'})).ok,false);await epochClient.stop();
console.log('Firebase party session sequencing, pause and uncertainty tests passed.');
