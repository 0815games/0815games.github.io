import {test,before,beforeEach,after} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,get,set,update,goOffline,goOnline,onValue} from 'firebase/database';
import {buildSocialCleanupCandidate} from '../social-cleanup-candidate.mjs';
import {buildMaintenanceRulesCandidate} from '../../release-tools/maintenance-rules.mjs';
import {MAINTENANCE_PATH,createMaintenanceProbe} from '../../maintenance-check.mjs';

// Synthetic data and tokens against a local emulator only, never production.
const bytes=await readFile(new URL('../WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
const {candidate}=buildMaintenanceRulesCandidate(buildSocialCleanupCandidate(bytes));
const t=Math.floor(Date.now()/1000),open={format:1,mode:'open',authAfterMs:0};let env;
const db=(authTime=t-100,uid='alice')=>env.authenticatedContext(uid,{iat:t,auth_time:authTime,firebase:{sign_in_provider:'password',identities:{}}}).database();
const adminSet=(path,value)=>env.withSecurityRulesDisabled(ctx=>set(path?ref(ctx.database(),path):ref(ctx.database()),value));
const adminGet=async path=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),path))).val();});return value;};
const profile=client=>ref(client,'players/alice');

before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(candidate)}});});
beforeEach(async()=>{await env.clearDatabase();await adminSet('',{[MAINTENANCE_PATH]:open,players:{alice:{name:'Alice',gender:'female',xp:0}}});});
after(async()=>{if(env)await env.cleanup();});

test('the maintenance signal is public and cannot be changed by a game client',async()=>{
 const anon=env.unauthenticatedContext().database(),alice=db();
 assert.deepEqual((await assertSucceeds(get(ref(anon,MAINTENANCE_PATH)))).val(),open);
 await assertFails(get(profile(anon)));await assertFails(set(ref(anon,`${MAINTENANCE_PATH}/mode`),'maintenance'));
 await assertFails(set(ref(alice,`${MAINTENANCE_PATH}/mode`),'maintenance'));await assertFails(update(ref(alice),{[`${MAINTENANCE_PATH}/mode`]:'open'}));
});

test('the fresh unauthenticated REST probe reads the public control through the emulator',async()=>{
 const requests=[];
 // Only this test adapter redirects the validated Firebase URL to loopback.
 // The emulator does not establish production CORS or cache behavior.
 const probe=createMaintenanceProbe({databaseUrl:'https://demo-ironpath.firebaseio.com',fetcher:(url,options)=>{
  const source=new URL(url),target=new URL(`http://127.0.0.1:9000${source.pathname}${source.search}`);
  target.searchParams.set('ns','demo-ironpath');requests.push(target.href);
  return fetch(target,{...options,headers:{origin:'https://0815games.github.io'}});
 }});
 assert.deepEqual(await probe(),open);
 const closed={...open,mode:'maintenance'};await adminSet(MAINTENANCE_PATH,closed);
 assert.deepEqual(await probe(),closed);assert.notEqual(requests[0],requests[1]);
 await adminSet(MAINTENANCE_PATH,null);assert.equal(await probe(),null);
});

test('initial open mode preserves ordinary password sessions and original ownership',async()=>{
 await assertSucceeds(get(profile(db())));await assertSucceeds(update(profile(db()),{xp:1}));
 await assertFails(get(profile(db(t-100,'bob'))));await assertFails(update(profile(db(t-100,'bob')),{xp:2}));
});

test('maintenance, missing control and invalid cutoff deny normal reads and writes',async()=>{
 for(const value of [null,{...open,mode:'maintenance'},{...open,format:2},{...open,authAfterMs:-1},{...open,authAfterMs:1.5},{...open,authAfterMs:'0'}]){
  await adminSet(MAINTENANCE_PATH,value);await assertFails(get(profile(db())));await assertFails(update(profile(db()),{xp:2}));
 }
});

test('a fresh authentication after the opening cutoff works; older sessions stay denied',async()=>{
 await adminSet(MAINTENANCE_PATH,{...open,mode:'maintenance'});
 await assertFails(update(profile(db()),{xp:1}));
 await adminSet(MAINTENANCE_PATH,{...open,authAfterMs:(t-10)*1000});
 await assertFails(get(profile(db(t-100))));await assertFails(update(profile(db(t-100)),{xp:1}));
 await assertFails(get(profile(db(t-10))),'the cutoff second is deliberately denied');
 await assertSucceeds(update(profile(db(t-9)),{xp:2}));assert.equal((await adminGet('players/alice')).xp,2);
});

test('an old offline write is rejected after maintenance reopens with a new cutoff',{timeout:30000},async()=>{
 const old=db(t-100);await assertSucceeds(get(profile(old)));goOffline(old);
 const queued=update(profile(old),{xp:5});await adminSet(MAINTENANCE_PATH,{...open,mode:'maintenance'});
 await adminSet(MAINTENANCE_PATH,{...open,authAfterMs:(t-10)*1000});goOnline(old);
 await assertFails(queued);assert.equal((await adminGet('players/alice')).xp,0);
});

test('an existing profile listener is cancelled by a maintenance closure',{timeout:20000},async()=>{
 const client=db();let stop;
 const cancelled=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('listener not cancelled')),12000);stop=onValue(profile(client),()=>{},error=>{clearTimeout(timer);resolve(error);});});
 await new Promise((resolve,reject)=>{const off=onValue(profile(client),()=>{off();resolve();},reject);});
 await adminSet(MAINTENANCE_PATH,{...open,mode:'maintenance'});
 try{const error=await cancelled;assert.match(String(error?.code||error),/permission.denied/i);}finally{stop?.();}
});
