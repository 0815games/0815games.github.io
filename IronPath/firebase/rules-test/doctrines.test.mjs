import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,remove,update,onValue,runTransaction,onDisconnect,serverTimestamp} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {createFirebaseFourLobby} from '../../firebase-four-lobby.mjs';
import {parseBuild,encodeBuild} from '../../skills.mjs';
let env,alice,bob;const sdk={ref,set,get,remove,update,onValue,runTransaction,onDisconnect,serverTimestamp};
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../doctrines.complete.draft.rules.json',import.meta.url),'utf8')}});alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();});
beforeEach(async()=>{await env.clearDatabase();await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.database();await set(ref(db,'players/alice'),{name:'Alice',gender:'female',xp:10000,storyProgress:1});await set(ref(db,'players/bob'),{name:'Bob',gender:'female',xp:0});});});after(async()=>env.cleanup());
test('extended skill encoding is accepted for owner and unified multiplayer roster; malformed and other-user writes fail',async()=>{
 const b=parseBuild('2,0,0,0,0;assault;1000000000;1',15);b.web[55]=1;b.web[56]=1;const skills=encodeBuild(b);
 await assertSucceeds(set(ref(alice,'players/alice/skills'),skills));await assertFails(set(ref(bob,'players/alice/skills'),skills));await assertFails(set(ref(alice,'players/alice/skills'),skills+'1'));await assertFails(set(ref(alice,'players/alice/skills'),skills.slice(0,-1)+'x'));
 const lobby=createFirebaseFourLobby({db:alice,auth:{currentUser:{uid:'alice'}},sdk,crypto:webcrypto});const party=await assertSucceeds(lobby.create({name:'Alice',gender:'female',level:15,skills}));
 const profile=(await get(ref(alice,`fourParties/${party.partyId}/profiles/alice`))).val();assert.equal(profile.skills,skills);await lobby.close(party.partyId,party.inviteCode);
 assert.equal((await get(ref(alice,'players/alice/storyProgress'))).val(),1,'full story rules retained');
});
