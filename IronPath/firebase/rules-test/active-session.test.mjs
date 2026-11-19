import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,update,remove,runTransaction,serverTimestamp} from 'firebase/database';
import {MAINTENANCE_PATH} from '../../maintenance-check.mjs';
import {DEFAULT_BUILD,SKILL_PATHS,encodeBuild,parseBuild} from '../../skills.mjs';

let env,alice,bob,anon;
const now=Math.floor(Date.now()/1000);
const claims=()=>({iat:now,auth_time:now-30,firebase:{sign_in_provider:'password',identities:{}}});
const clientA='a'.repeat(32);
const clientB='b'.repeat(32);

before(async()=>{
 env=await initializeTestEnvironment({
  projectId:'demo-ironpath',
  database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../BLOCK9D-RULES-TO-PUBLISH.json',import.meta.url),'utf8')}
 });
 alice=env.authenticatedContext('alice',claims()).database();
 bob=env.authenticatedContext('bob',claims()).database();
 anon=env.unauthenticatedContext().database();
});

beforeEach(async()=>{
 await env.clearDatabase();
 await env.withSecurityRulesDisabled(async ctx=>{
  await set(ref(ctx.database()),{
   [MAINTENANCE_PATH]:{format:1,mode:'open',authAfterMs:0},
   players:{
    alice:{name:'Alice',gender:'female',xp:1200,skills:DEFAULT_BUILD},
    bob:{name:'Bob',gender:'male',xp:500,skills:DEFAULT_BUILD}
   }
  });
 });
});

after(async()=>env?.cleanup());

test('BLOCK9D activeSessions enforces single active clientId, heartbeat serverTimestamp, and ownership',async()=>{
 const aliceSession=ref(alice,'activeSessions/alice');

 // Claim an empty lease
 await assertSucceeds(set(aliceSession,{clientId:clientA,claimedAt:serverTimestamp(),heartbeatAt:serverTimestamp()}));
 const claimed=(await assertSucceeds(get(aliceSession))).val();
 assert.equal(claimed.clientId,clientA);
 assert.equal(typeof claimed.heartbeatAt,'number');

 // Other users & anonymous readers/writers are always denied
 await assertFails(get(ref(bob,'activeSessions/alice')));
 await assertFails(set(ref(bob,'activeSessions/alice'),{clientId:clientB,claimedAt:serverTimestamp(),heartbeatAt:serverTimestamp()}));
 await assertFails(get(ref(anon,'activeSessions/alice')));

 // Same clientId renews heartbeat with serverTimestamp()
 await assertSucceeds(set(aliceSession,{clientId:clientA,claimedAt:claimed.claimedAt,heartbeatAt:serverTimestamp()}));

 // Forged timestamps, extra fields, or malformed clientId are rejected
 await assertFails(set(aliceSession,{clientId:clientA,claimedAt:claimed.claimedAt,heartbeatAt:Date.now()-1000}));
 await assertFails(set(aliceSession,{clientId:'bad-id',claimedAt:serverTimestamp(),heartbeatAt:serverTimestamp()}));
 await assertFails(set(aliceSession,{clientId:clientA,claimedAt:serverTimestamp(),heartbeatAt:serverTimestamp(),extra:1}));

 // A second browser/incognito window with clientB cannot overwrite while lease is fresh (<45s)
 await assertFails(set(aliceSession,{clientId:clientB,claimedAt:serverTimestamp(),heartbeatAt:serverTimestamp()}));
 const txBlocked=await runTransaction(aliceSession,current=>{
  if(current&&current.clientId!==clientB)return undefined;
  return {clientId:clientB,claimedAt:serverTimestamp(),heartbeatAt:serverTimestamp()};
 },{applyLocally:false});
 assert.equal(txBlocked.committed,false);
 assert.equal((await get(aliceSession)).val().clientId,clientA);

 // Stale lease (>45s old) can be reclaimed automatically by clientB
 await env.withSecurityRulesDisabled(ctx=>update(ref(ctx.database(),'activeSessions/alice'),{heartbeatAt:Date.now()-60_000}));
 await assertSucceeds(set(aliceSession,{clientId:clientB,claimedAt:serverTimestamp(),heartbeatAt:serverTimestamp()}));
 assert.equal((await get(aliceSession)).val().clientId,clientB);

 // Clean disconnect / logout removes the lease
 await assertSucceeds(remove(aliceSession));
 assert.equal((await get(aliceSession)).val(),null);
});

test('BLOCK9D preserves maintenance gating and existing Block 5 player/skills rules',async()=>{
 const aliceSession=ref(alice,'activeSessions/alice');
 await assertSucceeds(set(aliceSession,{clientId:clientA,claimedAt:serverTimestamp(),heartbeatAt:serverTimestamp()}));

 const airBuild=encodeBuild(parseBuild(`v2;${SKILL_PATHS[5].id};2;0;11000000000000`,8));
 await assertSucceeds(set(ref(alice,'players/alice/skills'),airBuild));

 // Maintenance mode shuts down activeSessions alongside player nodes
 await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),`${MAINTENANCE_PATH}/mode`),'maintenance'));
 await assertFails(get(aliceSession));
 await assertFails(set(aliceSession,{clientId:clientA,claimedAt:serverTimestamp(),heartbeatAt:serverTimestamp()}));
 await assertFails(get(ref(alice,'players/alice')));
});
