import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,get,set,update,onValue,runTransaction,remove,onDisconnect,serverTimestamp} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {createFirebaseFourLobby} from '../../firebase-four-lobby.mjs';
import {createFirebaseRecoveryStore} from '../../firebase-recovery-store.mjs';
import {createPartyHost} from '../../party-host.mjs';
import {createMatch} from '../../simulation.mjs';
import {createPlayer} from '../../match.mjs';
const ids=['alice','bob','eve'],sdk={ref,get,set,update,onValue,runTransaction,remove,onDisconnect,serverTimestamp};let env,db;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../recovery.complete.draft.rules.json',import.meta.url),'utf8')}});db=Object.fromEntries(ids.map(id=>[id,env.authenticatedContext(id).database()]));db.alice2=env.authenticatedContext('alice').database();});
beforeEach(async()=>{await env.clearDatabase();for(const id of ids)await set(ref(db[id],`players/${id}`),{name:id,gender:'female',xp:0});});after(async()=>env.cleanup());
async function setup(){
 const profile=id=>({name:id,gender:'female',level:1}),lobby=id=>createFirebaseFourLobby({db:db[id],auth:{currentUser:{uid:id}},sdk,crypto:webcrypto}),a=lobby('alice'),b=lobby('bob');const party=await a.create(profile('alice'));await b.request(party.inviteCode,'bob');await a.approve(party.partyId,party.inviteCode,'bob');await b.publishProfile(party.partyId,profile('bob'));await a.configure(party.partyId,{mode:'coop',teams:[0,0,1,1]});const manifest=await a.start(party.partyId);const players=['alice','bob'].map(id=>createPlayer(id,profile(id))),host=createPartyHost(createMatch(players),{hostId:'alice'});host.setPresence('alice',true);host.setPresence('bob',true);const views={alice:{tick:0},bob:{tick:0}},path=`fourParties/${party.partyId}/recovery`,store=key=>createFirebaseRecoveryStore({db:db[key],auth:{currentUser:{uid:'alice'}},sdk,partyId:party.partyId,manifest,crypto:webcrypto});return {party,manifest,host,views,path,store,close:()=>a.close(party.partyId,party.inviteCode)};
}
test('recovery state and views are private to the host and their intended member',async()=>{
 const f=await setup();try{const fence=await assertSucceeds(f.store('alice').initialize(f.host.checkpoint(),f.views)),session=`${f.path}/sessions/${fence.owner}`;assert.equal(fence.generation,1);assert.equal((await assertSucceeds(get(ref(db.bob,`${f.path}/lease/generation`)))).val(),1);assert.ok((await assertSucceeds(get(ref(db.bob,`${session}/views/bob`)))).exists());await assertFails(get(ref(db.bob,`${session}/checkpoint`)));await assertFails(get(ref(db.bob,`${session}/views/alice`)));await assertFails(get(ref(db.eve,`${session}/views/bob`)));await assertFails(set(ref(db.bob,`${f.path}/lease/generation`),2));}finally{await f.close();}
});
test('one takeover wins and the old host is fenced from checkpoint and views',async()=>{
 const f=await setup();try{const first=f.store('alice'),second=f.store('alice2'),old=await first.initialize(f.host.checkpoint(),f.views),oldPath=`${f.path}/sessions/${old.owner}`,before=(await get(ref(db.alice,oldPath))).val();const contenders=await Promise.allSettled([first.claim(1),second.claim(1)]),success=contenders.filter(x=>x.status==='fulfilled');assert.equal(success.length,1);const winner=success[0].value;assert.equal(winner.generation,2);assert.deepEqual(winner.checkpoint,f.host.checkpoint());await assert.rejects(()=>first.publish(old,f.host.checkpoint(),f.views));await assertFails(set(ref(db.alice,oldPath),before));await assertFails(set(ref(db.alice,`${oldPath}/checkpoint`),'corrupted'));assert.equal((await get(ref(db.alice,`${f.path}/lease/generation`))).val(),2);assert.equal(await second.publish(winner,f.host.checkpoint(),f.views),true);}finally{await f.close();}
});
test('invalid checkpoints and roster views are rejected before writing',async()=>{
 const f=await setup();try{const store=f.store('alice'),checkpoint=f.host.checkpoint();await assert.rejects(()=>store.initialize({...checkpoint,match:{...checkpoint.match,hostId:'eve'}},f.views),/locked party/);await assert.rejects(()=>store.initialize(checkpoint,{alice:{}}),/views/);assert.equal((await get(ref(db.alice,`${f.path}/lease`))).exists(),false);}finally{await f.close();}
});
