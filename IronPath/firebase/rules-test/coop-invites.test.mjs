import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,remove,onValue,serverTimestamp,runTransaction} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {createFirebaseFourLobby} from '../../firebase-four-lobby.mjs';
import {createCoopInvites} from '../../coop-invites.mjs';
let env,alice,bob,eve,anon;const sdk={ref,set,get,remove,onValue,serverTimestamp,runTransaction},party='a'.repeat(32),other='b'.repeat(32),code='1234';
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL(process.env.DIRECT_INVITES_RULES?'../direct-invites.complete.draft.rules.json':process.env.LEADERBOARD_RULES?'../leaderboards.complete.draft.rules.json':'../coop-invites.complete.draft.rules.json',import.meta.url),'utf8')}});alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();eve=env.authenticatedContext('eve').database();anon=env.unauthenticatedContext().database();});
beforeEach(async()=>{await env.clearDatabase();await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.database();for(const [id,name] of [['alice','Alice'],['bob','Bob'],['eve','Eve']])await set(ref(db,`players/${id}`),{name,gender:'female',xp:0});await set(ref(db,'friendships/bob/alice'),{status:'accepted',senderName:'Alice',receiverName:'Bob',code:'a'.repeat(32)});await set(ref(db,`fourParties/${party}`),{hostId:'alice',inviteCode:code,config:{mode:'four-coop',teams:[0,0,1,1]}});await set(ref(db,`fourCodes/${code}`),{hostId:'alice',partyId:party});});});after(async()=>env.cleanup());
const service=(db,uid)=>createCoopInvites({db,auth:{currentUser:{uid}},sdk});
test('accepted friends can receive, request a specific party and decline',async()=>{
 const a=service(alice,'alice'),b=service(bob,'bob');await a.send('bob',{partyId:party,code},'Alice');const invite=(await get(ref(bob,'coopInvites/bob/alice'))).val();assert.equal(invite.partyId,party);assert.equal(invite.name,'Alice');assert.ok(Number.isFinite(invite.createdAt));
 await assertFails(get(ref(eve,'coopInvites/bob')));await assertFails(get(ref(anon,'coopInvites/bob')));await assertFails(get(ref(alice,'coopInvites/bob')));await assertSucceeds(get(ref(alice,'coopInvites/bob/alice')));
 await assertSucceeds(set(ref(bob,`fourCodes/${code}/requests/bob`),{name:'Bob',expectedPartyId:party}));await b.dismiss('alice');assert.equal((await get(ref(bob,'coopInvites/bob/alice'))).val(),null);
});
test('rejects nonfriends, spoofing, wrong parties, started parties and forged invitations',async()=>{
 const a=service(alice,'alice');await assertFails(a.send('eve',{partyId:party,code},'Alice'));await assertFails(a.send('bob',{partyId:other,code},'Alice'));await assertFails(a.send('bob',{partyId:party,code},'Eve'));await assertFails(set(ref(eve,'coopInvites/bob/alice'),{partyId:party,code,name:'Alice',createdAt:serverTimestamp()}));
 await env.withSecurityRulesDisabled(async ctx=>set(ref(ctx.database(),`fourParties/${party}/started`),{hostId:'alice'}));await assertFails(a.send('bob',{partyId:party,code},'Alice'));
});
test('stale, removed-friend and reused-code invites cannot create a request',async()=>{
 const a=service(alice,'alice');await a.send('bob',{partyId:party,code},'Alice');await assertFails(set(ref(bob,`fourCodes/${code}/requests/bob`),{name:'Bob',expectedPartyId:other}));
 await env.withSecurityRulesDisabled(async ctx=>set(ref(ctx.database(),'friendships/bob/alice/status'),'pending'));await assertFails(set(ref(bob,`fourCodes/${code}/requests/bob`),{name:'Bob',expectedPartyId:party}));
 await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.database();await set(ref(db,'friendships/bob/alice/status'),'accepted');await set(ref(db,'coopInvites/bob/alice/createdAt'),Date.now()-1900000);});await assertFails(set(ref(bob,`fourCodes/${code}/requests/bob`),{name:'Bob',expectedPartyId:party}));
 // Normal manual code entry remains compatible.
 await assertSucceeds(set(ref(bob,`fourCodes/${code}/requests/bob`),{name:'Bob'}));
});

test('full invite to approved co-op match uses the real lobby adapter',async()=>{
 const host=createFirebaseFourLobby({db:alice,auth:{currentUser:{uid:'alice'}},sdk,crypto:webcrypto}),guest=createFirebaseFourLobby({db:bob,auth:{currentUser:{uid:'bob'}},sdk,crypto:webcrypto});
 const created=await host.create({name:'Alice',gender:'female',level:1});await service(alice,'alice').send('bob',{partyId:created.partyId,code:created.inviteCode},'Alice');
 const request=await guest.request(created.inviteCode,'Bob',created.partyId);assert.equal(request.partyId,created.partyId);await host.approve(created.partyId,created.inviteCode,'bob');await guest.publishProfile(created.partyId,{name:'Bob',gender:'female',level:1});await host.configure(created.partyId,{mode:'coop',teams:[0,0,1,1]});const match=await host.start(created.partyId);assert.deepEqual(match.playerIds,['alice','bob']);assert.equal(match.mode,'coop');await assertFails(service(alice,'alice').send('bob',{partyId:created.partyId,code:created.inviteCode},'Alice'));await host.close(created.partyId,created.inviteCode);
});
