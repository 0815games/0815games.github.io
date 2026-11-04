import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,remove,onValue,serverTimestamp,runTransaction} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {createFirebaseFourLobby} from '../../firebase-four-lobby.mjs';
import {createCoopInvites} from '../../coop-invites.mjs';
let env,alice,bob,eve;const sdk={ref,set,get,remove,onValue,serverTimestamp,runTransaction};
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../direct-invites.complete.draft.rules.json',import.meta.url),'utf8')}});alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();eve=env.authenticatedContext('eve').database();});
beforeEach(async()=>{await env.clearDatabase();await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.database();for(const [id,name] of [['alice','Alice'],['bob','Bob'],['eve','Eve']])await set(ref(db,`players/${id}`),{name,gender:'female',xp:0});for(const [id,name] of [['bob','Bob'],['eve','Eve']])await set(ref(db,`friendships/${id}/alice`),{status:'accepted',senderName:'Alice',receiverName:name,code:'a'.repeat(32)});});});after(async()=>env.cleanup());
const lobby=(db,uid)=>createFirebaseFourLobby({db,auth:{currentUser:{uid}},sdk,crypto:webcrypto});
const invites=(db,uid)=>createCoopInvites({db,auth:{currentUser:{uid}},sdk});
const profile=name=>({name,gender:'female',level:1});
test('invited friend claims a slot and starts co-op without a host approval click',async()=>{
 const h=lobby(alice,'alice'),g=lobby(bob,'bob'),party=await h.create(profile('Alice'));await invites(alice,'alice').send('bob',{partyId:party.partyId,code:party.inviteCode},'Alice');const req=await g.request(party.inviteCode,'Bob',party.partyId);
 assert.equal(await g.claimInvitedSlot(req.partyId,party.inviteCode),true);assert.equal((await get(ref(alice,`fourParties/${party.partyId}/slots/one`))).val(),'bob');await g.cancel(party.inviteCode);await g.publishProfile(party.partyId,profile('Bob'));await h.configure(party.partyId,{mode:'coop',teams:[0,0,1,1]});const match=await h.start(party.partyId);assert.deepEqual(match.playerIds,['alice','bob']);assert.equal(match.mode,'coop');
});
test('uninvited, forged, stale and revoked invitations cannot claim slots',async()=>{
 const h=lobby(alice,'alice'),g=lobby(bob,'bob'),party=await h.create(profile('Alice')),slot=ref(bob,`fourParties/${party.partyId}/slots/one`);
 await assertFails(set(slot,'bob'));await g.request(party.inviteCode,'Bob');await assertFails(set(slot,'bob'));await g.cancel(party.inviteCode);
 await invites(alice,'alice').send('bob',{partyId:party.partyId,code:party.inviteCode},'Alice');await g.request(party.inviteCode,'Bob',party.partyId);
 await assertFails(set(ref(eve,`fourParties/${party.partyId}/slots/one`),'bob'));
 await env.withSecurityRulesDisabled(async ctx=>set(ref(ctx.database(),`coopInvites/bob/alice/createdAt`),Date.now()-1900000));await assertFails(set(slot,'bob'));
 await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.database();await set(ref(db,'coopInvites/bob/alice/createdAt'),Date.now());await set(ref(db,'friendships/bob/alice/status'),'pending');});await assertFails(set(slot,'bob'));
 await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.database();await set(ref(db,'friendships/bob/alice/status'),'accepted');await remove(ref(db,'coopInvites/bob/alice'));});await assertFails(set(slot,'bob'));
});
test('concurrent invited guests get distinct seats and cannot claim twice',async()=>{
 const h=lobby(alice,'alice'),b=lobby(bob,'bob'),e=lobby(eve,'eve'),party=await h.create(profile('Alice'));for(const id of ['bob','eve'])await invites(alice,'alice').send(id,{partyId:party.partyId,code:party.inviteCode},'Alice');await Promise.all([b.request(party.inviteCode,'Bob',party.partyId),e.request(party.inviteCode,'Eve',party.partyId)]);
 await Promise.all([b.claimInvitedSlot(party.partyId,party.inviteCode),e.claimInvitedSlot(party.partyId,party.inviteCode)]);const slots=(await get(ref(alice,`fourParties/${party.partyId}/slots`))).val();assert.deepEqual(Object.values(slots).sort(),['bob','eve']);await assertFails(set(ref(bob,`fourParties/${party.partyId}/slots/three`),'bob'));
});
test('manual code requests still require host approval',async()=>{
 const h=lobby(alice,'alice'),g=lobby(bob,'bob'),party=await h.create(profile('Alice'));await g.request(party.inviteCode,'Bob');await assertFails(set(ref(bob,`fourParties/${party.partyId}/slots/one`),'bob'));await assertSucceeds(h.approve(party.partyId,party.inviteCode,'bob'));
});
