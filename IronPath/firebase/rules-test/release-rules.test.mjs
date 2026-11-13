import {test,before,beforeEach,after} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,get,set,update,goOffline,goOnline,onValue} from 'firebase/database';
import {buildRulesCandidate} from '../../release-tools/rules-candidate.mjs';
import {CONTROL_PATH} from '../../release-tools/release-control.mjs';

// This applies generated candidate rules to an isolated local emulator only.
// It neither inspects nor deploys production rules, Auth or release state.
const source=JSON.parse(await readFile(new URL('../WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url),'utf8'));
const {candidate}=buildRulesCandidate(source);
const t=Math.floor(Date.now()/1000), epochA='a'.repeat(32),epochB='b'.repeat(32);
const initial={mode:'open',build:'release-1',epoch:epochA,authAfter:t-120};
let env;
const database=(epoch=epochA,authTime=t-30,provider='custom',uid='alice')=>env.authenticatedContext(uid,{
  iat:t,auth_time:authTime,ip_release_epoch:epoch,firebase:{sign_in_provider:provider,identities:{}}
}).database();
const adminSet=(path,value)=>env.withSecurityRulesDisabled(ctx=>set(path ? ref(ctx.database(),path) : ref(ctx.database()),value));
const adminGet=async path=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),path))).val();});return value;};
const profile=db=>ref(db,'players/alice');

before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(candidate)}});
});
beforeEach(async()=>{
 await env.clearDatabase();
 await adminSet('',{[CONTROL_PATH]:initial,players:{alice:{name:'Alice',gender:'female',xp:0}},leaderboards:{solo:{alice:{name:'Alice',wave:1}}}});
});
after(async()=>{if(env)await env.cleanup();});

test('only release control is publicly readable, and no client can write it',async()=>{
 const anon=env.unauthenticatedContext().database(),alice=database();
 assert.equal((await assertSucceeds(get(ref(anon,CONTROL_PATH)))).val().mode,'open');
 await assertFails(get(profile(anon)));
 await assertFails(set(ref(anon,CONTROL_PATH),{...initial,mode:'open'}));
 await assertFails(set(ref(alice,CONTROL_PATH),{...initial,mode:'open'}));
 await assertFails(set(ref(alice,`${CONTROL_PATH}/mode`),'open'));
 await assertFails(set(ref(alice),{}));
});

test('only a fresh matching custom-token session is admitted; original ownership remains',async()=>{
 const good=database();
 assert.equal((await assertSucceeds(get(profile(good)))).val().name,'Alice');
 await assertSucceeds(update(profile(good),{xp:1}));
 await assertSucceeds(get(ref(good,'leaderboards/solo/alice')));
 await assertFails(get(ref(database(epochA,t-30,'custom','bob'),'players/alice')));
 await assertFails(update(profile(database(epochA,t-30,'custom','bob')),{xp:2}));
 await assertFails(get(profile(database(epochA,t-30,'password'))));
 await assertFails(update(profile(database(epochA,t-30,'password')),{xp:2}));
 await assertFails(get(profile(database(epochB))));
 await assertFails(get(profile(database(epochA,t-120))));
 await assertFails(get(profile(env.authenticatedContext('alice',{iat:t,auth_time:t-30}).database())));
});

test('missing, malformed and maintenance control records fail closed',async()=>{
 for(const control of [null,{...initial,mode:'maintenance'}, {...initial,build:'../bad'},
   {...initial,epoch:''}, {...initial,authAfter:0}, {...initial,authAfter:1.5}]){
  await adminSet(CONTROL_PATH,control);
  const db=database();
  await assertFails(get(profile(db)));
  await assertFails(update(profile(db),{xp:1}));
 }
});

test('closing and reopening on a new epoch fences old sessions, including old deletes',async()=>{
 const old=database();
 await assertSucceeds(get(profile(old)));
 await adminSet(CONTROL_PATH,{...initial,mode:'maintenance',epoch:epochB});
 await assertFails(update(profile(database()),{xp:2}));
 await assertFails(set(profile(database()),null));
 await adminSet(CONTROL_PATH,{mode:'open',build:'release-2',epoch:epochB,authAfter:t-10});
 await assertFails(get(profile(database())));
 await assertFails(update(profile(database()),{xp:2}));
 const fresh=database(epochB,t-1);
 await assertSucceeds(update(profile(fresh),{xp:3}));
 assert.equal((await assertSucceeds(get(profile(fresh)))).val().xp,3);
});

test('a write queued offline in the old session is rejected after the new epoch opens',{timeout:30000},async()=>{
 const old=database();
 // Establish the old authenticated socket before deliberately going offline.
 await assertSucceeds(get(profile(old)));
 goOffline(old);
 const queued=update(profile(old),{xp:5});
 await adminSet(CONTROL_PATH,{...initial,mode:'maintenance',epoch:epochB});
 await adminSet(CONTROL_PATH,{mode:'open',build:'release-2',epoch:epochB,authAfter:t-10});
 goOnline(old);
 await assertFails(queued);
 assert.equal((await adminGet('players/alice')).xp,0);
});

test('a subscribed read is cancelled when the referenced control closes',{timeout:20000},async()=>{
 const db=database();let stop;
 const cancelled=new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('listener was not cancelled after the control changed')),12000);
  stop=onValue(profile(db),()=>{},error=>{clearTimeout(timer);resolve(error);});
 });
 // Wait for the first live snapshot before changing the rule dependency.
 await new Promise((resolve,reject)=>{const off=onValue(profile(db),()=>{off();resolve();},reject);});
 await adminSet(CONTROL_PATH,{...initial,mode:'maintenance',epoch:epochB});
 try {const error=await cancelled;assert.match(String(error?.code||error),/permission.denied/i);}
 finally {stop?.();}
});
