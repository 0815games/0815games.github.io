import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPartyHost} from '../core/party-host.mjs';
import {createPlayer} from '../core/match.mjs';
import {createMatch} from '../core/simulation.mjs';
import {createFourCoop,createTwoVsTwo} from '../core/four-modes.mjs';
import {createVersus} from '../core/versus.mjs';

const cases=[['coop',2],['four-coop',3],['four-coop',4],['versus',2],['two-vs-two',4]];
function fixture(mode,count){
 const ids=['a','b','c','d'].slice(0,count),players=ids.map(id=>createPlayer(id,{name:id,gender:'female'}));
 const game=mode==='four-coop'?createFourCoop(players,'a'):mode==='two-vs-two'?createTwoVsTwo(players,'a',[['a','b'],['c','d']]):mode==='versus'?createVersus(players,'road','a'):createMatch(players,'road');
 const fields=mode==='four-coop'?[game.match]:mode==='two-vs-two'?game.lanes:mode==='versus'?Object.values(game.lanes):[game];
 for(const field of fields){field.wave=2;field.running=true;field.spawnLeft=1;field.spawnTimer=100;}
 const host=createPartyHost(game,{hostId:'a'});for(const id of ids)host.setPresence(id,true);
 const packet=(id,type,extra={})=>{const snap=host.snapshotFor(id);return {version:1,seq:snap.nextSeq,command:{type,...extra},rosterGeneration:snap.rosterGeneration};};
 const run=(id,input)=>{assert.equal(host.receive(id,input).status,'queued');const output=host.advance();return output.commands.find(item=>item.playerId===id)?.result;};
 return {host,packet,run};
}
for(const [mode,count] of cases){
 test(`${mode}/${count}: a queued 2x request cannot revive after another player reconnects`,()=>{
  const {host,packet,run}=fixture(mode,count),old=packet('a','requestSpeed');
  assert.equal(host.receive('a',old).status,'queued');host.setPresence('b',false);host.setPresence('b',true);
  assert.deepEqual(host.advance().commands,[]);assert.equal(host.snapshotFor('a').receipts.at(-1).status,'cancelled');
  assert.equal(host.snapshotFor('a').speedControl.request,null);
  const fresh=run('a',packet('a','requestSpeed'));assert.equal(fresh.ok,true);assert.equal(host.snapshotFor('a').speedControl.request.requester,'a');
 });
 for(const sender of ['a','b'])test(`${mode}/${count}: an old 2x input from ${sender} arriving during an outage gets a receipt`,()=>{
  const {host,packet,run}=fixture(mode,count),old=packet(sender,'requestSpeed');host.setPresence('b',false);
  const receipt=host.receive(sender,old);assert.equal(receipt.status,'cancelled');assert.equal(receipt.reason,'roster-changed');
  host.setPresence('b',true);assert.equal(host.receive(sender,old).status,'cancelled','redelivery is idempotent');
  assert.equal(host.snapshotFor(sender).speedControl.request,null);
  assert.equal(run(sender,packet(sender,'requestSpeed')).ok,true,'the next sequence can request again');
 });
 test(`${mode}/${count}: every delayed 2x action is fenced after a roster change`,()=>{
  for(const type of ['requestSpeed','approveSpeed','declineSpeed','cancelSpeed','slowSpeed']){
   const {host,packet}=fixture(mode,count),old=packet('a',type,['approveSpeed','declineSpeed','cancelSpeed'].includes(type)?{requestId:1}:{});
   host.setPresence('b',false);host.setPresence('b',true);
   assert.equal(host.receive('a',old).status,'cancelled',type);assert.equal(host.snapshotFor('a').receipts.at(-1).reason,'roster-changed');
   assert.deepEqual(host.advance().commands,[]);
  }
 });
 test(`${mode}/${count}: an old slow-down packet cannot cancel a new speed request`,()=>{
  const {host,packet,run}=fixture(mode,count),stale=packet('a','slowSpeed');
  host.setPresence('b',false);host.setPresence('b',true);
  const fresh=run('b',packet('b','requestSpeed'));assert.equal(fresh.ok,true);
  assert.equal(host.receive('a',stale).status,'cancelled');assert.deepEqual(host.advance().commands,[]);
  const vote=host.snapshotFor('a').speedControl.request;assert.equal(vote.requester,'b');assert.equal(vote.id,fresh.requestId);
 });
}
