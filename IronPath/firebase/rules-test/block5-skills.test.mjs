import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,runTransaction,update} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {createFirebaseFourLobby} from '../../net/firebase-four-lobby.mjs';
import {encodeBuild,parseBuild,SKILL_PATHS,DEFAULT_BUILD} from '../../core/skills.mjs';
import {migrateSkillsProfile} from '../../core/skills-migration.mjs';

let env,alice,bob;
const sdk={ref,set,get,remove:undefined,update,onValue:undefined,runTransaction,onDisconnect:undefined,serverTimestamp:undefined};

before(async()=>{
  const {remove,onValue,onDisconnect,serverTimestamp}=await import('firebase/database');
  Object.assign(sdk,{remove,onValue,onDisconnect,serverTimestamp});
  env=await initializeTestEnvironment({
    projectId:'demo-ironpath',
    database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../block5.complete.draft.rules.json',import.meta.url),'utf8')}
  });
  alice=env.authenticatedContext('alice').database();
  bob=env.authenticatedContext('bob').database();
});

beforeEach(async()=>{
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.database();
    await set(ref(db,'players/alice'),{name:'Alice',gender:'female',xp:10000,storyProgress:1,skills:'1,0,0,0,0;assault'});
    await set(ref(db,'players/bob'),{name:'Bob',gender:'male',xp:0,skills:DEFAULT_BUILD});
  });
});

after(async()=>env.cleanup());

test('Block 5 candidate accepts V2 builds for all 6 classes including airDefense and rejects malformed shapes',async()=>{
  await assertSucceeds(set(ref(alice,'players/alice/skills'),'v2;none'));
  for(const path of SKILL_PATHS){
    const b=parseBuild(`v2;${path.id};3;1;11111111110111`,18);
    const encoded=encodeBuild(b);
    assert.ok(encoded.startsWith(`v2;${path.id};3;1;`));
    await assertSucceeds(set(ref(alice,'players/alice/skills'),encoded));
  }
  await assertFails(set(ref(bob,'players/alice/skills'),'v2;none'));
  await assertFails(set(ref(alice,'players/alice/skills'),'v2;bogus;1;0;00000000000000'));
  await assertFails(set(ref(alice,'players/alice/skills'),'v2;airDefense;4;0;00000000000000'));
  await assertFails(set(ref(alice,'players/alice/skills'),'v2;airDefense;1;3;00000000000000'));
  await assertFails(set(ref(alice,'players/alice/skills'),'v2;airDefense;1;0;0000000000000'));
  await assertFails(set(ref(alice,'players/alice/skills'),'v2;none;1;0;00000000000000'));
});

test('legacy V1 skill profile migrates safely inside owner transaction preserving XP and storyProgress',async()=>{
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

test('fourParties and 2-player parties accept V2 skill strings cleanly',async()=>{
  const skills=encodeBuild(parseBuild('v2;airDefense;2;1;10000000000110',10));
  await assertSucceeds(set(ref(alice,'players/alice/skills'),skills));
  const lobby=createFirebaseFourLobby({db:alice,auth:{currentUser:{uid:'alice'}},sdk,crypto:webcrypto});
  const party=await assertSucceeds(lobby.create({name:'Alice',gender:'female',level:10,skills}));
  const profile=(await get(ref(alice,`fourParties/${party.partyId}/profiles/alice`))).val();
  assert.equal(profile.skills,skills);
  await lobby.close(party.partyId,party.inviteCode);
  const pid='a'.repeat(32);
  await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),`parties/${pid}`),{hostId:'alice',guestId:'bob'}));
  await assertSucceeds(set(ref(alice,`parties/${pid}/profiles/alice`),{name:'Alice',gender:'female',level:10,skills}));
  await assertFails(set(ref(alice,`parties/${pid}/profiles/alice/skills`),'v2;invalid;1;0;00000000000000'));
});
