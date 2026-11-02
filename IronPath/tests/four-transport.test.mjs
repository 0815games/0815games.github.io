import {strict as assert} from 'node:assert';
import {createPlayer} from '../match.mjs';
import {createTwoVsTwo,createFourCoop} from '../four-modes.mjs';
import {createPartyHost} from '../party-host.mjs';
import {createHost,restoreHost} from '../protocol.mjs';
import {createFirebasePartyChannel} from '../firebase-party-channel.mjs';
import {createFirebasePartyHostSession,createFirebasePartyClientSession} from '../firebase-party-session.mjs';
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
