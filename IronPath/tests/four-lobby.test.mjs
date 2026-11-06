// The four-player lobby and its transport: roster slots, the wire contract and
// the motion projection the guests receive.

import {projectCoopMotion} from '../coop-motion.mjs';
import {createFirebasePartyChannel} from '../firebase-party-channel.mjs';
import {createFirebasePartyClientSession, createFirebasePartyHostSession} from '../firebase-party-session.mjs';
import {createFourLobby, transitionFourLobby as transition} from '../four-lobby.mjs';
import {createFourCoop, createTwoVsTwo} from '../four-modes.mjs';
import {createPlayer} from '../match.mjs';
import {createPartyHost} from '../party-host.mjs';
import {createHost, restoreHost} from '../protocol.mjs';
import {createMatch} from '../simulation.mjs';
import {strict as assert} from 'node:assert';

// ---- from four-lobby.test.mjs ----
{
const profile=name=>({name,gender:'female',level:1});
let lobby=createFourLobby('alice',profile('Alice'));const original=structuredClone(lobby);
assert.equal(transition(lobby,'bob',{type:'approve',uid:'bob'}),null,'only host approves');
assert.equal(transition(lobby,'alice',{type:'approve',uid:'bad/id'}),null);
assert.equal(transition(lobby,'alice',{type:'start'}),null,'cannot start without four ready profiles');
for(const id of ['bob','cara','dan']){lobby=transition(lobby,'alice',{type:'approve',uid:id});assert.ok(lobby);lobby=transition(lobby,id,{type:'profile',profile:profile(id)});assert.ok(lobby);}
assert.deepEqual(original.slots.slice(1),[null,null,null],'state transitions do not mutate the prior snapshot');
assert.equal(transition(lobby,'alice',{type:'approve',uid:'bob'}),null,'no duplicate accounts');assert.equal(transition(lobby,'alice',{type:'approve',uid:'eve'}),null,'capacity is exactly four');
assert.equal(transition(lobby,'bob',{type:'teams',teams:[0,1,0,1]}),null);assert.equal(transition(lobby,'alice',{type:'teams',teams:[0,0,0,1]}),null,'teams must stay balanced');
lobby=transition(lobby,'alice',{type:'mode',mode:'two-vs-two'});lobby=transition(lobby,'alice',{type:'teams',teams:[0,1,0,1]});assert.deepEqual(lobby.teams,[0,1,0,1]);
assert.equal(transition(lobby,'bob',{type:'profile',profile:{...profile('bob'),level:1,skills:'bad'}}),null);assert.equal(transition(lobby,'eve',{type:'profile',profile:profile('eve')}),null);
const departed=transition(lobby,'cara',{type:'leave'});assert.equal(departed.slots[2],null);assert.equal(transition(departed,'alice',{type:'start'}),null);assert.equal(lobby.slots[2].id,'cara');
const removed=transition(lobby,'alice',{type:'remove',uid:'cara'});assert.equal(removed.slots[2],null);assert.equal(transition(lobby,'bob',{type:'remove',uid:'cara'}),null);
const started=transition(lobby,'alice',{type:'start'});assert.equal(started.started,true);for(const cmd of [{type:'mode',mode:'four-coop'},{type:'approve',uid:'eve'},{type:'remove',uid:'bob'},{type:'teams',teams:[0,0,1,1]},{type:'start'}])assert.equal(transition(started,'alice',cmd),null,'roster, teams and mode lock at start');assert.equal(transition(started,'bob',{type:'leave'}),null,'match departure uses presence/forfeit, not roster replacement');
console.log('Four-player lobby capacity, authorization decisions and immutable roster tests passed.');
}

// ---- from four-transport.test.mjs ----
{
const ids=['alice','bob','cara','dan'],players=ids.map(id=>createPlayer(id,{name:id,gender:'female'}));
const cmd=(seq,type,extra={})=>({version:1,seq,command:{type,...extra}});
const duel=createTwoVsTwo(players,'alice',[['alice','bob'],['cara','dan']]);
const direct=createHost(duel);assert.equal(direct.receive('alice',cmd(1,'startWave')).status,'queued');
const saved=direct.checkpoint(),restored=restoreHost(saved);assert.deepEqual(direct.advance(),restored.advance(),'trusted checkpoint preserves pending four-player commands');assert.equal(direct.receive('alice',cmd(1,'startWave')).status,'applied');assert.equal(direct.receive('alice',cmd(1,'build',{pad:0,towerType:0})).reason,'sequence-conflict');
assert.equal(direct.snapshotFor('unknown'),null);assert.deepEqual(direct.snapshotFor('bob').receipts,[],'receipts remain private to their sender');
const host=createPartyHost(duel,{hostId:'alice'});for(const id of ids)host.setPresence(id,true);assert.equal(host.ready(),true);
assert.equal(host.receive('bob',cmd(1,'move',{x:1300,y:600})).status,'queued');assert.equal(host.receive('cara',cmd(1,'build',{pad:2,towerType:0})).status,'queued');
host.setPresence('dan',false);assert.equal(host.ready(),false);assert.equal(host.advance(),null);assert.equal(host.snapshotFor('bob').receipts.at(-1).status,'cancelled');assert.equal(host.snapshotFor('cara').receipts.at(-1).status,'cancelled');
host.setPresence('dan',true);assert.ok(host.advance());assert.equal(host.snapshotFor('bob').match.lanes[1].towers.length,0,'cancelled inputs do not replay after reconnect');
const coop=createPartyHost(createFourCoop(players,'alice'),{hostId:'alice'});for(const id of ids)coop.setPresence(id,true);coop.setPresence('dan',false);assert.equal(coop.ready(),true,'co-op continues with a missing guest');coop.setPresence('alice',false);assert.equal(coop.ready(),false,'co-op pauses without the host');
// Firebase-shaped in-memory SDK exercises the real per-player packet channel.
// It does not test authorization or live network behavior.
const values=new Map(),listeners=new Map();
const sdk={ref:(_db,path)=>path,onValue(path,fn){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add(fn);fn({val:()=>values.get(path)??null});return()=>listeners.get(path).delete(fn);},async set(path,value){values.set(path,value);for(const fn of listeners.get(path)||[])fn({val:()=>value});},async update(path,patch){for(const [key,value] of Object.entries(patch))values.set(`${path}/${key}`,value);for(const key of Object.keys(patch)){const full=`${path}/${key}`;for(const fn of listeners.get(full)||[])fn({val:()=>values.get(full)});}}};
const config={db:{},sdk,partyId:'fourtest',hostId:'alice',playerIds:ids,partyRoot:'fourParties'},auth=id=>({currentUser:{uid:id}});
const runtime=createPartyHost(createTwoVsTwo(players,'alice',[['alice','bob'],['cara','dan']]),{hostId:'alice'});
const hostChannel=createFirebasePartyChannel({...config,auth:auth('alice')});const views={};
const clients=Object.fromEntries(ids.map(id=>{const channel=createFirebasePartyChannel({...config,auth:auth(id)});return [id,createFirebasePartyClientSession({channel,onView:s=>{views[id]=s;},timeoutMs:1000})];}));
for(const client of Object.values(clients))client.start();
const session=createFirebasePartyHostSession({channel:hostChannel,host:runtime,playerIds:ids,epoch:'four-test'});session.start();for(const id of ids)session.setPresence(id,true);
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));await flush();
async function execute(id,command){const result=clients[id].command(command);await flush();session.step();await flush();return result;}
assert.equal((await execute('alice',{type:'startWave'})).waitingForPlayers,true);const requestId=views.alice.match.pending.id;
for(const id of ids.slice(1))assert.equal((await execute(id,{type:'approveWave',requestId})).ok,true);
assert.deepEqual(views.bob.match.lanes.map(lane=>lane.wave),[1,1]);
assert.equal((await execute('cara',{type:'build',pad:15,towerType:0})).ok,true);assert.equal(views.dan.match.lanes[1].towers[0].ownerId,'cara');assert.equal(views.alice.match.lanes[0].towers.length,0);
assert.equal(views.cara.receipts.length,2);assert.equal(views.alice.receipts.length,1);
assert.ok(new TextEncoder().encode(values.get('fourParties/fourtest/views/dan')).length<262144,'four-player view fits current packet size in this scenario');
for(const client of Object.values(clients))await client.stop();await session.stop();
console.log('Four-player ordered host, reconnect and mock packet/session integration passed; Firebase rules not tested.');
}

// ---- from four-motion.test.mjs ----
{
const p=createPlayer('a',{name:'Alice',gender:'female'},1300,650),q=createPlayer('b',{name:'Bob',gender:'male'}),s=createMatch([p,q],'four-front');
p.direction={x:1,y:1};s.players.a.direction=p.direction;s.enemies=[{kind:'infantry',road:1,x:10,y:580,segment:1,speed:100,hp:10}];const before=structuredClone(s),view=projectCoopMotion(s,.2);
assert.ok(view.players.a.x>1300);assert.ok(view.players.a.y>650);assert.ok(view.enemies[0].x>10);assert.equal(view.enemies[0].y,580);assert.deepEqual(s,before,'visual prediction does not mutate simulation');console.log('Four-player visual prediction respects map bounds and road selection.');
}
