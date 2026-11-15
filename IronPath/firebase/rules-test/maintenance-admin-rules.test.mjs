import {test,before,beforeEach,after} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,get,set,update,onValue,runTransaction,serverTimestamp} from 'firebase/database';
import {buildSocialCleanupCandidate} from '../social-cleanup-candidate.mjs';
import {buildMaintenanceRulesCandidate} from '../../release-tools/maintenance-rules.mjs';
import {MAINTENANCE_PATH,MAINTENANCE_ADMIN_ACCESS_PATH} from '../../maintenance-check.mjs';
import {transitionMaintenance} from '../../admin-maintenance.mjs';

// Synthetic identities against the local emulator only. The real operator must
// supply and independently verify their separate Firebase Auth UID at rollout.
const adminUid='local-maintenance-admin';
const bytes=await readFile(new URL('../WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
const {candidate}=buildMaintenanceRulesCandidate(buildSocialCleanupCandidate(bytes),{adminUid});
const open={format:1,mode:'open',authAfterMs:0},t=Math.floor(Date.now()/1000);let env;
const db=(uid,time=t-100)=>env.authenticatedContext(uid,{iat:t,auth_time:time,firebase:{sign_in_provider:'password',identities:{}}}).database();
const privilegedSet=(path,value)=>env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),path),value));
const privilegedGet=async path=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),path))).val();});return value;};

before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(candidate)}});});
beforeEach(async()=>{
 await env.clearDatabase();
 await privilegedSet(MAINTENANCE_PATH,open);
 await privilegedSet('players/alice',{name:'Alice',gender:'female',xp:0});
});
after(async()=>{if(env)await env.cleanup();});

test('only the dedicated UID may change maintenance, never another player or a different path',async()=>{
 const anon=env.unauthenticatedContext().database(),alice=db('alice'),admin=db(adminUid);
 for(const client of [anon,alice,db('other-admin')]){
  await assertSucceeds(get(ref(client,MAINTENANCE_PATH)));
  await assertFails(get(ref(client,MAINTENANCE_ADMIN_ACCESS_PATH)));
  await assertFails(set(ref(client,MAINTENANCE_PATH),{...open,mode:'maintenance'}));
  await assertFails(update(ref(client),{[`${MAINTENANCE_PATH}/mode`]:'maintenance'}));
 }
 await assertSucceeds(get(ref(admin,MAINTENANCE_ADMIN_ACCESS_PATH)));
 await assertFails(set(ref(admin,MAINTENANCE_ADMIN_ACCESS_PATH),true));
 await assertFails(update(ref(admin,'players/alice'),{xp:99}));
 await assertSucceeds(set(ref(admin,MAINTENANCE_PATH),{...open,mode:'maintenance'}));
 await assertSucceeds(get(ref(admin,MAINTENANCE_ADMIN_ACCESS_PATH)),'the panel remains accessible while closed');
 await assertFails(get(ref(alice,'players/alice')));
 await assertFails(update(ref(alice,'players/alice'),{xp:1}));
 assert.deepEqual(await privilegedGet(MAINTENANCE_PATH),{...open,mode:'maintenance'});
});

test('the admin can reopen only with the server timestamp; old game sessions stay fenced',async()=>{
 const admin=db(adminUid),alice=db('alice');
 await assertSucceeds(set(ref(admin,MAINTENANCE_PATH),{...open,mode:'maintenance'}));
 for(const invalid of [0,1,Date.now()-60000,'now',null]){
  await assertFails(set(ref(admin,MAINTENANCE_PATH),{...open,mode:'open',authAfterMs:invalid}));
 }
 await assertSucceeds(set(ref(admin,MAINTENANCE_PATH),{format:1,mode:'open',authAfterMs:serverTimestamp()}));
 const actual=await privilegedGet(MAINTENANCE_PATH);
 assert.equal(actual.mode,'open');assert.ok(Number.isSafeInteger(actual.authAfterMs)&&actual.authAfterMs>0);
 await assertFails(get(ref(alice,'players/alice')));
 await assertSucceeds(get(ref(db('alice',Math.floor(actual.authAfterMs/1000)+2),'players/alice')));
});

test('malformed records, extra fields, cutoffs and invalid transitions are rejected',async()=>{
 const admin=db(adminUid),control=ref(admin,MAINTENANCE_PATH);
 for(const invalid of [
  null,{...open,format:2,mode:'maintenance'}, {...open,mode:'maintenance',extra:true},
  {...open,mode:'maintenance',authAfterMs:1}, {...open,mode:'open'}, {...open,mode:'closed'},
  {format:1,mode:'maintenance'}, {...open,mode:'maintenance',authAfterMs:-1}
 ])await assertFails(set(control,invalid));
 await assertFails(update(control,{mode:'maintenance',extra:'x'}));
 assert.deepEqual(await privilegedGet(MAINTENANCE_PATH),open);
 await privilegedSet(MAINTENANCE_PATH,null);
 await assertFails(set(control,{...open,mode:'maintenance'}),'initialization remains an operator action');
});

test('the real Firebase transaction coordinator closes and reopens under the admin Rules',{timeout:30000},async()=>{
 const admin=db(adminUid),control=ref(admin,MAINTENANCE_PATH);let observed,loaded;
 const ready=new Promise(resolve=>{loaded=resolve;});
 // Keep a listener alive: get() alone does not necessarily seed a transaction's
 // local cache, so an initial transaction callback could otherwise see null.
 const off=onValue(control,snapshot=>{observed=snapshot.val();loaded();});await ready;
 try{
  const deps={probe:()=>privilegedGet(MAINTENANCE_PATH),readCurrent:async()=>observed,
   transact:reducer=>runTransaction(control,reducer,{applyLocally:false}),serverTimestamp};
  const close=await transitionMaintenance({...deps,expected:open,target:'maintenance'});
  assert.deepEqual(close,{kind:'confirmed',control:{...open,mode:'maintenance'}});
  const reopen=await transitionMaintenance({...deps,expected:close.control,target:'open'});
  assert.equal(reopen.kind,'confirmed');assert.equal(reopen.control.mode,'open');assert.ok(reopen.control.authAfterMs>0);
 }finally{off();}
});
