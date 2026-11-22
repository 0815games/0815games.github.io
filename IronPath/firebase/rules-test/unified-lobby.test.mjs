import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,get,set,update,onValue,runTransaction,remove,onDisconnect,serverTimestamp} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {createFirebaseFourLobby} from '../../net/firebase-four-lobby.mjs';
import {createFirebasePartyGame} from '../../net/firebase-party-game.mjs';
import {createPlayer} from '../../match.mjs';
const ids=['alice','bob','cara','dan'],sdk={ref,get,set,update,onValue,runTransaction,remove,onDisconnect,serverTimestamp},profiles=Object.fromEntries(ids.map(id=>[id,{name:id,gender:'female',level:1}]));let env,db;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL(process.env.IRONPATH_STORY_RULES?'../story.complete.draft.rules.json':process.env.IRONPATH_ONLINE_RULES?'../online-recovery.complete.draft.rules.json':process.env.IRONPATH_CAMPAIGN_RULES?'../campaign.complete.draft.rules.json':'../unified.complete.draft.rules.json',import.meta.url),'utf8')}});db=Object.fromEntries(ids.map(id=>[id,env.authenticatedContext(id).database()]));});
beforeEach(async()=>{await env.clearDatabase();for(const id of ids)await set(ref(db[id],`players/${id}`),{name:id,gender:'female',xp:0});});after(async()=>env.cleanup());
for(const [mode,count] of [['coop',2],['versus',2],['four-coop',3],['four-coop',4],['two-vs-two',4]])test(`unified ${mode} with ${count} players`,{timeout:60000},async()=>{
 const participants=ids.slice(0,count),auth=id=>({currentUser:{uid:id}}),lobbies=Object.fromEntries(ids.map(id=>[id,createFirebaseFourLobby({db:db[id],auth:auth(id),sdk,crypto:webcrypto})]));
 const created=await assertSucceeds(lobbies.alice.create(profiles.alice));for(const id of participants.slice(1)){await assertSucceeds(lobbies[id].request(created.inviteCode,id));await assertSucceeds(lobbies.alice.approve(created.partyId,created.inviteCode,id));await assertSucceeds(lobbies[id].publishProfile(created.partyId,profiles[id]));}
 await assertSucceeds(lobbies.alice.configure(created.partyId,{mode,teams:[0,1,0,1]}));const manifest=await assertSucceeds(lobbies.alice.start(created.partyId));assert.deepEqual(manifest.playerIds,participants);assert.deepEqual((await lobbies.bob.reconnect(created.partyId,created.inviteCode)).playerIds,participants);
 const statuses={},views={},errors=[],players=participants.map((id,i)=>createPlayer(id,profiles[id],800+i*15,450));
 const make=id=>createFirebasePartyGame({db:db[id],auth:auth(id),sdk,crypto:webcrypto,partyId:created.partyId,partyRoot:'fourParties',hostId:'alice',playerIds:participants,mode,teams:manifest.teamRosters,...(id==='alice'?{players}:{}),onStatus:v=>statuses[id]=v,onState:v=>{if(v==='error')errors.push(id);},onSnapshot:v=>views[id]=v});
 const clients=participants.map(make),requester=participants.at(-1),requesterIndex=count-1;
 const wait=async(pred,label)=>{const deadline=Date.now()+15000;while(!pred()){if(errors.length)throw Error(`${label}: client errors: ${errors}`);if(Date.now()>deadline)throw Error(`${label}: timed out`);await new Promise(r=>setTimeout(r,50));}};
 const waveRequest=id=>mode==='coop'||mode==='versus'?views[id]?.match?.waveRequest:views[id]?.match?.pending;
 const allHaveRequest=id=>participants.every(uid=>waveRequest(uid)?.id===id&&waveRequest(uid).requester===requester);
 try{
  for(const c of clients)c.start();await wait(()=>participants.every(id=>statuses[id]&&views[id]),'all players ready');
  if(mode==='four-coop'){
   // Use the actual Firebase SDK/rules and the host adapter, not an in-memory
   // transport, for the three-/four-player own and teammate upgrade paths.
   assert.equal((await clients[requesterIndex].command({type:'build',pad:15,towerType:0})).ok,true);
   await wait(()=>participants.every(id=>views[id]?.match?.match?.towers.some(t=>t.pad===15&&t.ownerId===requester)),'guest tower replicated');
   const otherMoney=views.alice.match.match.players[requester].money;
   assert.equal((await clients[0].command({type:'upgrade',pad:15,branch:0})).ok,true);
   await wait(()=>participants.every(id=>views[id]?.match?.match?.towers.some(t=>t.pad===15&&t.level===2)),'teammate upgrade replicated');
   for(const id of participants){assert.equal(views[id].match.match.players.alice.money,55);assert.equal(views[id].match.match.players[requester].money,otherMoney);}
   assert.equal((await clients[1].command({type:'build',pad:14,towerType:0})).ok,true);
   assert.equal((await clients[1].command({type:'upgrade',pad:14,branch:0})).ok,true);
   await wait(()=>participants.every(id=>views[id]?.match?.match?.towers.some(t=>t.pad===14&&t.ownerId==='bob'&&t.level===2)),'own upgrade replicated');
   for(const id of participants)assert.equal(views[id].match.match.players.bob.money,5);
  }
  const declined=await clients[requesterIndex].command({type:'startWave'});assert.equal(declined.ok,true);
  await wait(()=>allHaveRequest(declined.requestId),'guest wave request reaches everyone');
  assert.equal((await clients[0].command({type:'declineWave',requestId:declined.requestId})).ok,true);
  await wait(()=>participants.every(id=>!waveRequest(id)),'host decline reaches everyone');
  const withdrawn=await clients[requesterIndex].command({type:'startWave'});assert.ok(withdrawn.requestId>declined.requestId);
  await wait(()=>allHaveRequest(withdrawn.requestId),'next wave request reaches everyone');
  assert.equal((await clients[requesterIndex].command({type:'cancelWave',requestId:withdrawn.requestId})).ok,true);
  await wait(()=>participants.every(id=>!waveRequest(id)),'guest withdrawal reaches everyone');
  const interrupted=await clients[requesterIndex].command({type:'startWave'});assert.equal(interrupted.ok,true);
  await wait(()=>allHaveRequest(interrupted.requestId),'request before disconnect');
  await clients[requesterIndex].stop();
  await wait(()=>!statuses[requester]&&!waveRequest('alice'),'disconnect invalidates the vote');
  views[requester]=null;clients[requesterIndex]=make(requester);clients[requesterIndex].start();
  await wait(()=>participants.every(id=>statuses[id]&&views[id])&&!waveRequest(requester),'guest rejoins without old consent');
  const req=await clients[requesterIndex].command({type:'startWave'});assert.ok(req.requestId>interrupted.requestId);
  await wait(()=>allHaveRequest(req.requestId),'fresh request after reconnect');
  for(let i=0;i<count-1;i++){
   const result=await clients[i].command({type:'approveWave',requestId:req.requestId});assert.equal(result.ok,true,JSON.stringify(result));
   if(i<count-2)await wait(()=>participants.every(id=>waveRequest(id)?.approved.length===i+1),'partial approvals stay pending');
  }
  await wait(()=>participants.every(id=>{const m=views[id]?.match;return mode==='four-coop'?m?.match?.wave===1:mode==='two-vs-two'?m?.lanes?.every(l=>l.wave===1):m?.wave===1;}),'all fields start wave one');
  const speedVote=await clients[requesterIndex].command({type:'requestSpeed'});assert.equal(speedVote.ok,true);
  await wait(()=>participants.every(id=>views[id]?.speedControl?.request?.id===speedVote.requestId&&views[id].speedControl.request.requester===requester),'guest speed vote reaches everyone');
  for(let i=0;i<count-1;i++)assert.equal((await clients[i].command({type:'approveSpeed',requestId:speedVote.requestId})).ok,true);
  await wait(()=>participants.every(id=>views[id]?.speedControl?.speed===2),'all players approved 2x');
  assert.equal((await clients[0].command({type:'slowSpeed'})).ok,true);await wait(()=>participants.every(id=>views[id]?.speedControl?.speed===1),'return to 1x');
  assert.equal(clients[1].setFocusPaused(true),false);assert.equal(clients[0].setFocusPaused(true),true);
  await wait(()=>participants.every(id=>statuses[id]===false&&views[id]?.hostPaused===true),'host pause reaches everyone');
  const tick=views.alice.tick;await new Promise(r=>setTimeout(r,250));assert.equal(views.alice.tick,tick);
  assert.equal((await clients[1].command({type:'move',x:700,y:400})).ok,false);clients[0].setFocusPaused(false);
  await wait(()=>participants.every(id=>statuses[id]&&views[id]?.hostPaused===false),'host resumes');
 }finally{await Promise.allSettled(clients.map(c=>c.stop()));await lobbies.alice.close(created.partyId,created.inviteCode);}
});
test('manifest rejects wrong sizes and stale roster after a departure',async()=>{
 const lobby=Object.fromEntries(ids.map(id=>[id,createFirebaseFourLobby({db:db[id],auth:{currentUser:{uid:id}},sdk,crypto:webcrypto})])),p=await lobby.alice.create(profiles.alice);
 for(const id of ['bob','cara']){await lobby[id].request(p.inviteCode,id);await lobby.alice.approve(p.partyId,p.inviteCode,id);await lobby[id].publishProfile(p.partyId,profiles[id]);}
 await lobby.alice.configure(p.partyId,{mode:'four-coop',teams:[0,0,1,1]});const path=`fourParties/${p.partyId}`;
 await assertFails(set(ref(db.alice,`${path}/started`),{hostId:'alice',playerIds:['alice','bob','cara','dan'],mode:'four-coop',teams:[0,0,1,1]}));
 await lobby.cara.leave(p.partyId);await assertFails(set(ref(db.alice,`${path}/started`),{hostId:'alice',playerIds:['alice','bob','cara'],mode:'four-coop',teams:[0,0,1,1]}));
 await assert.rejects(()=>lobby.alice.start(p.partyId),/ready/);await lobby.alice.close(p.partyId,p.inviteCode);
});
test('a departed middle slot can be omitted from the locked roster',async()=>{
 const lobby=Object.fromEntries(ids.map(id=>[id,createFirebaseFourLobby({db:db[id],auth:{currentUser:{uid:id}},sdk,crypto:webcrypto})])),p=await lobby.alice.create(profiles.alice);
 for(const id of ids.slice(1)){await lobby[id].request(p.inviteCode,id);await lobby.alice.approve(p.partyId,p.inviteCode,id);await lobby[id].publishProfile(p.partyId,profiles[id]);}
 await lobby.bob.leave(p.partyId);await lobby.alice.configure(p.partyId,{mode:'four-coop',teams:[0,0,1,1]});const m=await assertSucceeds(lobby.alice.start(p.partyId));assert.deepEqual(m.playerIds,['alice','cara','dan']);await lobby.alice.close(p.partyId,p.inviteCode);
});
