import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,remove,runTransaction} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {createFirebaseFourLobby} from '../../net/firebase-four-lobby.mjs';
import {MAINTENANCE_PATH,MAINTENANCE_ADMIN_ACCESS_PATH} from '../../core/maintenance-check.mjs';
import {encodeBuild,parseBuild,SKILL_PATHS,DEFAULT_BUILD} from '../../core/skills.mjs';
import {migrateSkillsProfile} from '../../core/skills-migration.mjs';

let env,alice,bob,eve,anon;
const sdk={ref,set,get,remove,update:undefined,onValue:undefined,runTransaction,onDisconnect:undefined,serverTimestamp:undefined};
const now=Math.floor(Date.now()/1000);
const claims=()=>({iat:now,auth_time:now-30,firebase:{sign_in_provider:'password',identities:{}}});

before(async()=>{
  const {update,onValue,onDisconnect,serverTimestamp}=await import('firebase/database');
  Object.assign(sdk,{update,onValue,onDisconnect,serverTimestamp});
  env=await initializeTestEnvironment({
    projectId:'demo-ironpath',
    database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../BLOCK5-RULES-TO-PUBLISH.json',import.meta.url),'utf8')}
  });
  alice=env.authenticatedContext('alice',claims()).database();
  bob=env.authenticatedContext('bob',claims()).database();
  eve=env.authenticatedContext('eve',claims()).database();
  anon=env.unauthenticatedContext().database();
});

beforeEach(async()=>{
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.database();
    await set(ref(db),{
      [MAINTENANCE_PATH]:{format:1,mode:'open',authAfterMs:0},
      players:{
        alice:{name:'Alice',gender:'female',xp:10000,storyProgress:1,avatar:'g:f|face:crop|hair:bob',skills:'1,0,0,0,0;assault'},
        bob:{name:'Bob',gender:'male',xp:0,avatar:'g:m|look:beard',skills:DEFAULT_BUILD},
        eve:{name:'Eve',gender:'female',xp:0}
      },
      friendships:{bob:{alice:{status:'accepted',senderName:'Alice',receiverName:'Bob',code:'b'.repeat(32)}}}
    });
  });
});

after(async()=>env?.cleanup());

test('BLOCK5-RULES-TO-PUBLISH accepts V2 builds for all 6 classes, 2- and 4-player lobbies, and rejects invalid shapes',async()=>{
  await assertSucceeds(set(ref(alice,'players/alice/skills'),'v2;none'));
  for(const path of SKILL_PATHS){
    const encoded=encodeBuild(parseBuild(`v2;${path.id};3;1;11111111110111`,18));
    await assertSucceeds(set(ref(alice,'players/alice/skills'),encoded));
  }
  await assertFails(set(ref(bob,'players/alice/skills'),'v2;none'));
  await assertFails(set(ref(alice,'players/alice/skills'),'v2;bogus;1;0;00000000000000'));
  await assertFails(set(ref(alice,'players/alice/skills'),'v2;airDefense;4;0;00000000000000'));
  await assertFails(set(ref(alice,'players/alice/skills'),'v2;none;1;0;00000000000000'));

  const skills=encodeBuild(parseBuild('v2;airDefense;2;1;10000000000110',10));
  const lobby=createFirebaseFourLobby({db:alice,auth:{currentUser:{uid:'alice'}},sdk,crypto:webcrypto});
  const party=await assertSucceeds(lobby.create({name:'Alice',gender:'female',level:10,skills}));
  assert.equal((await get(ref(alice,`fourParties/${party.partyId}/profiles/alice/skills`))).val(),skills);
  await assertSucceeds(lobby.close(party.partyId,party.inviteCode));

  const pid='a'.repeat(32);
  await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),`parties/${pid}`),{hostId:'alice',guestId:'bob'}));
  await assertSucceeds(set(ref(alice,`parties/${pid}/profiles/alice`),{name:'Alice',gender:'female',level:10,skills}));
  await assertFails(set(ref(alice,`parties/${pid}/profiles/alice/skills`),'v2;invalid;1;0;00000000000000'));
});

test('BLOCK5-RULES-TO-PUBLISH migrates legacy V1 profiles safely without dropping xp or storyProgress',async()=>{
  const res=await assertSucceeds(runTransaction(ref(alice,'players/alice'),current=>{
    if(!current)return current;
    const migrated=migrateSkillsProfile(current);
    return migrated.migrated?migrated.profile:undefined;
  },{applyLocally:false}));
  const saved=res.snapshot.val();
  assert.equal(saved.skills,'v2;none');
  assert.equal(saved.xp,10000);
  assert.equal(saved.storyProgress,1);
});

test('BLOCK5-RULES-TO-PUBLISH preserves Block 4 portrait reads, social cleanup, and MAINTENANCE_GATE fencing',async()=>{
  assert.equal((await assertSucceeds(get(ref(bob,'players/alice/avatar')))).val(),'g:f|face:crop|hair:bob');
  assert.equal((await assertSucceeds(get(ref(bob,'players/alice/gender')))).val(),'female');
  await assertFails(get(ref(eve,'players/alice/avatar')));
  await assertFails(get(ref(anon,'players/alice/gender')));

  await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),'friendOutgoing/bob/alice'),{name:'Alice',code:'b'.repeat(32)}));
  await assertSucceeds(remove(ref(alice,'friendOutgoing/bob/alice')));
  await assertFails(get(ref(alice,MAINTENANCE_ADMIN_ACCESS_PATH)));
  await assertFails(set(ref(alice,`${MAINTENANCE_PATH}/mode`),'maintenance'));

  await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),`${MAINTENANCE_PATH}/mode`),'maintenance'));
  await assertFails(get(ref(alice,'players/alice')));
  await assertFails(set(ref(alice,'players/alice/skills'),'v2;none'));
  await assertFails(get(ref(bob,'players/alice/avatar')));
});
