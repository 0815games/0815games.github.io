import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,get,set,update,onValue,runTransaction,remove,onDisconnect,serverTimestamp} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {createFirebaseFourLobby} from '../../firebase-four-lobby.mjs';
import {createFirebasePartyGame} from '../../firebase-party-game.mjs';
import {createPlayer} from '../../match.mjs';
const ids=['alice','bob','cara','dan'],sdk={ref,get,set,update,onValue,runTransaction,remove,onDisconnect,serverTimestamp},profiles=Object.fromEntries(ids.map(id=>[id,{name:id,gender:'female',level:1}]));let env,db;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../unified.complete.draft.rules.json',import.meta.url),'utf8')}});db=Object.fromEntries(ids.map(id=>[id,env.authenticatedContext(id).database()]));});
beforeEach(async()=>{await env.clearDatabase();for(const id of ids)await set(ref(db[id],`players/${id}`),{name:id,gender:'female',xp:0});});after(async()=>env.cleanup());
for(const [mode,count] of [['coop',2],['versus',2],['four-coop',3],['four-coop',4],['two-vs-two',4]])test(`unified ${mode} with ${count} players`,{timeout:45000},async()=>{
 const participants=ids.slice(0,count),auth=id=>({currentUser:{uid:id}}),lobbies=Object.fromEntries(ids.map(id=>[id,createFirebaseFourLobby({db:db[id],auth:auth(id),sdk,crypto:webcrypto})]));
 const created=await assertSucceeds(lobbies.alice.create(profiles.alice));for(const id of participants.slice(1)){await assertSucceeds(lobbies[id].request(created.inviteCode,id));await assertSucceeds(lobbies.alice.approve(created.partyId,created.inviteCode,id));await assertSucceeds(lobbies[id].publishProfile(created.partyId,profiles[id]));}
 await assertSucceeds(lobbies.alice.configure(created.partyId,{mode,teams:[0,1,0,1]}));const manifest=await assertSucceeds(lobbies.alice.start(created.partyId));assert.deepEqual(manifest.playerIds,participants);assert.deepEqual((await lobbies.bob.reconnect(created.partyId,created.inviteCode)).playerIds,participants);
 const statuses={},views={},errors=[],players=participants.map((id,i)=>createPlayer(id,profiles[id],800+i*15,450));
 const clients=participants.map(id=>createFirebasePartyGame({db:db[id],auth:auth(id),sdk,crypto:webcrypto,partyId:created.partyId,partyRoot:'fourParties',hostId:'alice',playerIds:participants,mode,teams:manifest.teamRosters,...(id==='alice'?{players}:{}),onStatus:v=>statuses[id]=v,onState:v=>{if(v==='error')errors.push(id);},onSnapshot:v=>views[id]=v}));
 const wait=async(pred)=>{const deadline=Date.now()+15000;while(!pred()){if(errors.length)throw Error(`Client errors: ${errors}`);if(Date.now()>deadline)throw Error('Timed out');await new Promise(r=>setTimeout(r,50));}};
 try{for(const c of clients)c.start();await wait(()=>participants.every(id=>statuses[id]&&views[id]));const req=await clients[0].command({type:'startWave'});assert.equal(req.ok,true);for(let i=1;i<count;i++){const result=await clients[i].command({type:'approveWave',requestId:req.requestId});assert.equal(result.ok,true);}await wait(()=>participants.every(id=>{const m=views[id]?.match;return mode==='four-coop'?m?.match?.wave===1:mode==='two-vs-two'?m?.lanes?.every(l=>l.wave===1):m?.wave===1;}));}
 finally{await Promise.allSettled(clients.map(c=>c.stop()));await lobbies.alice.close(created.partyId,created.inviteCode);}
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
