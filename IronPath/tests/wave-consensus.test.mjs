import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPlayer,applyCommand} from '../core/match.mjs';
import {createMatch} from '../core/simulation.mjs';
import {createFourCoop,createTwoVsTwo,applyFourCommand} from '../core/four-modes.mjs';
import {createVersus,applyVersus} from '../core/versus.mjs';
import {createPartyHost,restorePartyHost} from '../core/party-host.mjs';

const cases=[['coop',2],['four-coop',3],['four-coop',4],['versus',2],['two-vs-two',4]];
function fixture(mode,count,prepare=()=>{}){
 const ids=['a','b','c','d'].slice(0,count),players=ids.map(id=>createPlayer(id,{name:`Soldier ${id}`,gender:'female'}));
 const teams=mode==='two-vs-two'?[['a','b'],['c','d']]:undefined;
 const match=mode==='four-coop'?createFourCoop(players,'a'):mode==='two-vs-two'?createTwoVsTwo(players,'a',teams):mode==='versus'?createVersus(players,'road','a'):createMatch(players,'road');
 prepare(match);
 const host=createPartyHost(match,{hostId:'a'}),seq=Object.fromEntries(ids.map(id=>[id,0]));
 for(const id of ids)host.setPresence(id,true);
 function send(id,type,extra={}){
  const packet={version:1,seq:++seq[id],command:{type,...extra},rosterGeneration:host.snapshotFor(id).rosterGeneration};
  assert.equal(host.receive(id,packet).status,'queued',`${mode}: ${id} ${type} queued`);
  const result=host.advance()?.commands.find(c=>c.playerId===id&&c.seq===packet.seq)?.result;
  assert.ok(result,`${mode}: ${id} ${type} received a result`);
  return {result,packet};
 }
 const state=()=>host.checkpoint().match;
 const fields=()=>{const s=state();return mode==='four-coop'?[s.match]:mode==='two-vs-two'?s.lanes:mode==='versus'?Object.values(s.lanes):[s];};
 const pending=()=>{const s=state();return mode==='four-coop'||mode==='two-vs-two'?s.pending:s.waveRequest;};
 return {ids,teams,host,send,state,fields,pending,seq};
}

for(const [mode,count] of cases){
 for(let requesterIndex=0;requesterIndex<count;requesterIndex++)test(`${mode}/${count}: player ${requesterIndex+1} can request and every other player must approve`,()=>{
  const f=fixture(mode,count),requester=f.ids[requesterIndex],others=f.ids.filter(id=>id!==requester);
  const start=f.send(requester,'startWave');assert.equal(start.result.ok,true);
  const request=f.pending();assert.equal(request.requester,requester);assert.equal(request.wave,1);assert.deepEqual(new Set(request.required),new Set(others));assert.deepEqual(request.approved,[]);
  assert.equal(f.send(requester,'approveWave',{requestId:request.id}).result.ok,false,'the requester is already ready');
  assert.equal(f.send(others[0],'startWave').result.ok,false,'a competing request does not replace the first');
  for(let i=0;i<others.length;i++){
   assert.ok(f.fields().every(field=>field.wave===0&&!field.running),'no field starts before the final approval');
   const reply=f.send(others[i],'approveWave',{requestId:request.id});assert.equal(reply.result.ok,true);
   if(i<others.length-1){assert.equal(f.send(others[i],'approveWave',{requestId:request.id}).result.ok,false,'double approval is rejected');assert.ok(f.pending());}
   else {
    assert.equal(f.host.receive(others[i],reply.packet).status,'applied','retry returns the recorded receipt');
    assert.deepEqual(f.host.advance().commands,[],'retry does not reapply the command');
   }
  }
  assert.ok(f.fields().every(field=>field.wave===1&&field.running),'all affected fields start once, together');
  assert.equal(f.pending(),null);assert.equal(f.send(others[0],'approveWave',{requestId:request.id}).result.ok,false,'late approval cannot start again');
 });
 test(`${mode}/${count}: decline, withdrawal, disconnect, stale IDs and explicit leave`,()=>{
  const f=fixture(mode,count),requester=f.ids.at(-1),other=f.ids[0];
  assert.equal(f.send(requester,'startWave').result.ok,true);const first=f.pending().id;
  assert.equal(f.send(other,'cancelWave',{requestId:first}).result.ok,false,'only the requester can withdraw');
  assert.equal(f.send(other,'declineWave',{requestId:first}).result.ok,true);assert.equal(f.pending(),null);
  assert.equal(f.send(requester,'startWave').result.ok,true);const second=f.pending().id;assert.ok(second>first);
  assert.equal(f.send(other,'approveWave',{requestId:first}).result.ok,false,'stale consent is not transferable');
  assert.equal(f.send(requester,'cancelWave',{requestId:second}).result.ok,true);assert.equal(f.pending(),null);
  assert.equal(f.send(requester,'startWave').result.ok,true);const third=f.pending().id;
  f.host.setPresence(requester,false);assert.equal(f.pending(),null,'disconnect invalidates the whole vote');
  if(f.host.ready())assert.equal(f.send(other,'startWave').result.ok,false,'co-op cannot silently start with an absent roster member');
  else {
   // A delayed packet is now explicitly cancelled (and consumes its sequence)
   // while competitive play is paused. It must not leave the input slot locked.
   const packet={version:1,seq:++f.seq[other],command:{type:'startWave'},rosterGeneration:f.host.snapshotFor(other).rosterGeneration};
   const receipt=f.host.receive(other,packet);
   assert.equal(receipt.status,'cancelled');assert.equal(receipt.reason,'match-paused');
   assert.equal(f.host.receive(other,packet).status,'cancelled','redelivery returns the cancellation rather than applying the request');
  }
  assert.ok(f.fields().every(field=>field.wave===0));
  f.host.setPresence(requester,true);
  assert.equal(f.send(other,'approveWave',{requestId:third}).result.ok,false,'reconnection never revives consent');
  assert.equal(f.send(requester,'startWave').result.ok,true);assert.ok(f.pending().id>third);
  if(mode==='coop'||mode==='four-coop'){
   assert.equal(f.send(requester,'leaveRun').result.ok,true);assert.equal(f.pending(),null);
   assert.equal(f.send(other,'startWave').result.ok,false,'a departed participant is not silently removed from the locked roster');
  }
 });
 test(`${mode}/${count}: simultaneous requests, queued inputs at disconnect, and recovery are fenced`,()=>{
  const f=fixture(mode,count),[a,b]=f.ids;
  const first={version:1,seq:++f.seq[a],command:{type:'startWave'}},second={version:1,seq:++f.seq[b],command:{type:'startWave'}};
  assert.equal(f.host.receive(b,second).status,'queued');assert.equal(f.host.receive(a,first).status,'queued');
  const tick=f.host.advance();assert.equal(tick.commands[0].result.ok,true);assert.equal(tick.commands[1].result.ok,false);
  const old=f.pending().id;assert.equal(f.pending().requester,b);
  for(let i=0;i<200;i++)f.host.advance();assert.equal(f.pending().id,old,'waiting has no timeout or automatic yes');assert.ok(f.fields().every(field=>field.wave===0));
  const checkpoint=f.host.checkpoint();
  const restored=restorePartyHost(checkpoint,{hostId:'a',playerIds:f.ids,mode,teams:f.teams});
  for(const id of f.ids)restored.setPresence(id,true);
  const snap=restored.checkpoint().match,restoredPending=mode==='four-coop'||mode==='two-vs-two'?snap.pending:snap.waveRequest;
  assert.equal(restoredPending,null,'a recovered host starts with no inherited votes');
  const stale={version:1,seq:checkpoint.players[a].nextSeq,command:{type:'approveWave',requestId:old}};
  assert.equal(restored.receive(a,stale).status,'queued');assert.equal(restored.advance().commands[0].result.ok,false);
  const renewed={version:1,seq:checkpoint.players[b].nextSeq,command:{type:'startWave'}};
  assert.equal(restored.receive(b,renewed).status,'queued');assert.equal(restored.advance().commands[0].result.ok,true);
  const newer=restored.checkpoint().match,req=mode==='four-coop'||mode==='two-vs-two'?newer.pending:newer.waveRequest;assert.ok(req.id>old,'recovery retains the monotonic request counter');

  // A queued request from another connected player must not spring to life if
  // a roster member disconnects and reconnects before the host's next tick.
  const g=fixture(mode,count),packet={version:1,seq:++g.seq[a],command:{type:'startWave'}};
  assert.equal(g.host.receive(a,packet).status,'queued');g.host.setPresence(b,false);g.host.setPresence(b,true);
  assert.deepEqual(g.host.advance().commands,[],'presence changes cancel queued wave input');
  assert.equal(g.pending(),null);assert.ok(g.fields().every(field=>field.wave===0));
  assert.equal(g.host.snapshotFor(a).receipts.at(-1).status,'cancelled');
  const delayed=fixture(mode,count),oldPacket={version:1,seq:++delayed.seq[a],command:{type:'startWave'},rosterGeneration:delayed.host.snapshotFor(a).rosterGeneration};
  delayed.host.setPresence(b,false);delayed.host.setPresence(b,true);
  assert.equal(delayed.host.receive(a,oldPacket).status,'cancelled','a packet delayed outside the host queue is fenced too');
  assert.deepEqual(delayed.host.advance().commands,[]);assert.equal(delayed.pending(),null);
  assert.equal(delayed.send(a,'startWave').result.ok,true,'a fresh request from the new roster view still works');
 });
 test(`${mode}/${count}: late wave inputs arriving during an outage receive a cancellation receipt`,()=>{
  for(const [sender,absent] of [['a','b'],['b','b']]){
   const f=fixture(mode,count),packet={version:1,seq:++f.seq[sender],command:{type:'startWave'},rosterGeneration:f.host.snapshotFor(sender).rosterGeneration};
   f.host.setPresence(absent,false);
   const receipt=f.host.receive(sender,packet);
   assert.equal(receipt.status,'cancelled',`${sender} input while ${absent} is offline is reconciled`);
   assert.equal(receipt.reason,'roster-changed');
   assert.equal(f.host.snapshotFor(sender).receipts.at(-1).status,'cancelled');
   assert.equal(f.pending(),null);assert.ok(f.fields().every(field=>field.wave===0));
   f.host.setPresence(absent,true);
   assert.equal(f.host.receive(sender,packet).status,'cancelled','redelivery returns the same receipt');
   assert.equal(f.send(sender,'startWave').result.ok,true,'the next sequence remains usable');
  }
 });
 test(`${mode}/${count}: mandatory field decisions must be finished before a request`,()=>{
  const f=fixture(mode,count,match=>{
   const fields=mode==='four-coop'?[match.match]:mode==='two-vs-two'?match.lanes:mode==='versus'?Object.values(match.lanes):[match];
   fields.at(-1).pendingPerk=5;
  });
  assert.equal(f.send(f.ids.at(-1),'startWave').result.ok,false);assert.equal(f.pending()??null,null);assert.ok(f.fields().every(field=>field.wave===0));
 });
}

test('the last approval rechecks every competitive field before starting either',()=>{
 const players=['a','b','c','d'].map(id=>createPlayer(id,{name:id,gender:'female'}));
 const team=createTwoVsTwo(players,'a',[['a','b'],['c','d']]);
 const req=applyFourCommand(team,'d',{type:'startWave'});assert.equal(req.ok,true);
 assert.equal(applyFourCommand(team,'a',{type:'approveWave',requestId:req.requestId}).ok,true);
 assert.equal(applyFourCommand(team,'b',{type:'approveWave',requestId:req.requestId}).ok,true);
 team.lanes[1].pendingPerk=5;
 assert.equal(applyFourCommand(team,'c',{type:'approveWave',requestId:req.requestId}).ok,false);
 assert.deepEqual(team.lanes.map(field=>field.wave),[0,0]);assert.equal(team.pending,null);
 const duel=createVersus(players.slice(0,2),'road','a'),vote=applyVersus(duel,'b',{type:'startWave'});assert.equal(vote.ok,true);
 duel.lanes.a.pendingPerk=5;assert.equal(applyVersus(duel,'a',{type:'approveWave',requestId:vote.requestId}).ok,false);
 assert.deepEqual(Object.values(duel.lanes).map(field=>field.wave),[0,0]);assert.equal(duel.waveRequest,null);
});

test('solo starts without a multiplayer vote',()=>{
 const match=createMatch([createPlayer('solo',{name:'Solo',gender:'female'})],'road');
 assert.equal(applyCommand(match,'solo',{type:'startWave'}).ok,true);assert.equal(match.wave,1);assert.equal(match.running,true);assert.ok(!match.waveRequest);
});
