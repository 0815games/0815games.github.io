// Admin account tools against the exact file that would be published:
// ADMIN-ACCOUNT-RULES-TO-PUBLISH.json. The operator may read any player and
// set XP or the character name; everyone else keeps the rules they have.
// characterNames stays admin-only, so the in-game claim flow keeps returning
// 'unsupported' exactly as it does against the live rules today.
import assert from 'node:assert/strict';
import {before,test} from 'node:test';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const ADMIN='fKrII8AGsHPhKlrS3IWy0LXQ3cp1';
const now=Math.floor(Date.now()/1000);
// The maintenance gate reads auth.token.auth_time; plain contexts have no
// token, so player contexts carry one like maintenance-admin-rules does.
const authOptions={iat:now,auth_time:now-100,firebase:{sign_in_provider:'password',identities:{}}};
let env=null;
function testRulesetPath(relative){
 return fileURLToPath(new URL(relative,import.meta.url));
}
async function assertDenied(run){
 let outcome='allowed';
 try{
  await run();
 }catch(error){
  outcome=String(error?.message||error);
 }
 // Emulator messages vary: 'Permission denied', 'permission_denied', …
 assert.match(outcome,/permission[ _]denied/i,`denial expected, got: ${outcome}`);
}
const as=sdk=>sdk();

before(async()=>{
 env=await initializeTestEnvironment({
  projectId:'demo-ironpath',
  database:{host:'127.0.0.1',port:9000,rules:readFileSync(testRulesetPath('../ADMIN-ACCOUNT-RULES-TO-PUBLISH.json'),'utf8')}
 });
});

test('published admin account rules: operator reads and sets XP, players keep their own rules',async()=>{
  await env.withSecurityRulesDisabled(async context=>{
   const db=context.database();
   await db.ref('_ironpathMaintenance').set({format:1,mode:'open',authAfterMs:0});
   await db.ref('players/alpha').set({name:'Alpha',gender:'male',xp:500});
   await db.ref('players/beta').set({name:'Beta',gender:'female',xp:250});
   await db.ref('characterNames/alpha').set({uid:'alpha'});
  });

  // The operator: any player, read and write.
  await as(env.authenticatedContext(ADMIN,authOptions)).database().ref('players/alpha').child('xp').get();
  await as(env.authenticatedContext(ADMIN,authOptions)).database().ref('players/beta').get();
  await as(env.authenticatedContext(ADMIN,authOptions)).database().ref('players/alpha').update({xp:900});
  assert.equal((await as(env.authenticatedContext(ADMIN,authOptions)).database().ref('players/alpha/xp').get()).val(),900);
  // Lowering is allowed for the operator only; the shape stays enforced.
  await as(env.authenticatedContext(ADMIN,authOptions)).database().ref('players/alpha').update({xp:42});
  assert.equal((await as(env.authenticatedContext(ADMIN,authOptions)).database().ref('players/alpha/xp').get()).val(),42);
  await assertDenied(()=>as(env.authenticatedContext(ADMIN,authOptions)).database().ref('players/alpha').update({xp:10000001}));
  await assertDenied(()=>as(env.authenticatedContext(ADMIN,authOptions)).database().ref('players/alpha').update({xp:12.5}));
  await assertDenied(()=>as(env.authenticatedContext(ADMIN,authOptions)).database().ref('players/alpha').update({xp:1,name:'Nope',gender:'other'}));

  // The operator: rename with the reservation moving in the same update.
  await as(env.authenticatedContext(ADMIN,authOptions)).database().ref().update({
   'players/alpha/name':'Gamma',
   'characterNames/gamma':{uid:'alpha'},
   'characterNames/alpha':null
  });
  assert.equal((await as(env.authenticatedContext(ADMIN,authOptions)).database().ref('players/alpha/name').get()).val(),'Gamma');
  assert.equal((await as(env.authenticatedContext(ADMIN,authOptions)).database().ref('characterNames/gamma/uid').get()).val(),'alpha');
  assert.equal((await as(env.authenticatedContext(ADMIN,authOptions)).database().ref('characterNames/alpha').get()).exists(),false);

  // A player: reads nobody else, writes nobody else, cannot touch the index.
  await assertDenied(()=>as(env.unauthenticatedContext()).database().ref('players/alpha/xp').get());
  await assertDenied(()=>as(env.authenticatedContext('beta',authOptions)).database().ref('players/alpha/xp').get());
  await assertDenied(()=>as(env.authenticatedContext('beta',authOptions)).database().ref('players/alpha/xp').set(1));
  await assertDenied(()=>as(env.authenticatedContext('beta',authOptions)).database().ref('characterNames/omega').get());
  await assertDenied(()=>as(env.authenticatedContext('beta',authOptions)).database().ref('characterNames/omega').set({uid:'beta'}));

  // The owner still has their account: monotone XP, immutable name.
  await as(env.authenticatedContext('beta',authOptions)).database().ref('players/beta').update({xp:999});
  assert.equal((await as(env.authenticatedContext('beta',authOptions)).database().ref('players/beta/xp').get()).val(),999);
  await assertDenied(()=>as(env.authenticatedContext('beta',authOptions)).database().ref('players/beta').update({xp:5}));
  await assertDenied(()=>as(env.authenticatedContext('beta',authOptions)).database().ref('players/beta/name').set('Stolen'));

  // Maintenance mode: the player gate still applies, the operator does not.
  await env.withSecurityRulesDisabled(async context=>{
   await context.database().ref('_ironpathMaintenance').set({format:1,mode:'down',authAfterMs:0});
  });
  await assertDenied(()=>as(env.authenticatedContext('beta',authOptions)).database().ref('players/beta/xp').get());
  await as(env.authenticatedContext(ADMIN,authOptions)).database().ref('players/beta').child('xp').get();
  await env.withSecurityRulesDisabled(async context=>{
   await context.database().ref('_ironpathMaintenance').set({format:1,mode:'open',authAfterMs:0});
  });
 });
