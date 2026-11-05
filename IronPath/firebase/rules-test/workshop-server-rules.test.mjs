// Candidate trusted-server boundary only. No production rules or server changed.
import {test,before,after,beforeEach} from 'node:test';import {strict as assert} from 'node:assert';import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';import {ref,set,get,update,runTransaction,onValue} from 'firebase/database';
import {initializeWireWorkshop,applyWireWorkshopCommand} from '../../workshop-wire.mjs';import {applyWorkshopWaveCredit} from '../../workshop-wave-credit.mjs';
const id='0123456789abcdef0123456789abcdef';let env,alice,bob;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../workshop-server-only.draft.rules.json',import.meta.url),'utf8')}});alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();});
beforeEach(async()=>{await env.clearDatabase();await env.withSecurityRulesDisabled(async ctx=>{const admin=ctx.database();await set(ref(admin,'players/alice'),{name:'Alice',gender:'female',xp:750,armory:{scrap:100,fortify:3,plating:1,owned:1,equipped:1},storyProgress:2,coopRewards:{[id]:3}});});});after(()=>env.cleanup());
async function ready(r){let stop;await new Promise((resolve,reject)=>{stop=onValue(r,resolve,reject)});return stop;}
test('ordinary accounts keep their existing writes, but clients cannot initialize the protected workshop',async()=>{
 await assertSucceeds(set(ref(alice,'players/alice/armory/scrap'),90));await assertFails(set(ref(alice,'players/alice/workshop'),'[1,0,[],["standard","none","none"],[]]'));
 const original=(await get(ref(alice,'players/alice'))).val();await assertFails(set(ref(alice,'players/alice'),{...original,workshop:'anything'}));assert.equal((await get(ref(alice,'players/alice/workshop'))).exists(),false);
});
test('after server migration all client account writes, including receipt deletion and stale overwrites, are denied',async()=>{
 let current;await env.withSecurityRulesDisabled(async ctx=>{const r=ref(ctx.database(),'players/alice');current=initializeWireWorkshop((await get(r)).val());current=applyWorkshopWaveCredit(current,{kind:'solo',receiptId:id,mask:31});await set(r,current);});
 await assertSucceeds(get(ref(alice,'players/alice')));await assertFails(get(ref(bob,'players/alice')));
 await assertFails(set(ref(alice,`players/alice/soloWorkshopReceipts/${id}`),null));await assertFails(set(ref(alice,'players/alice/armory/scrap'),999));await assertFails(set(ref(alice,'players/alice/workshop'),'fake'));await assertFails(set(ref(alice,'players/alice/skills'),'0,0,0,0,0;assault'));
 const oldClient={...current};delete oldClient.workshop;delete oldClient.soloWorkshopReceipts;await assertFails(set(ref(alice,'players/alice'),oldClient));
 assert.equal((await get(ref(alice,`players/alice/soloWorkshopReceipts/${id}`))).val(),31);
});
test('trusted admin can run atomic workshop transactions after migration',async()=>{
 await env.withSecurityRulesDisabled(async ctx=>{const r=ref(ctx.database(),'players/alice');await set(r,initializeWireWorkshop((await get(r)).val()));const stop=await ready(r);
 try{const result=await runTransaction(r,p=>applyWireWorkshopCommand(p,{type:'craft',item:'boots'})??undefined,{applyLocally:false});assert.equal(result.committed,true);assert.equal(result.snapshot.val().armory.scrap,50);assert.equal(result.snapshot.val().storyProgress,2);}finally{stop();}});
});

test('experimental authority binds identity and deduplicates real emulator transactions',async()=>{
 const {createProgressionService}=await import('../../server/progression-service.mjs');
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.database(),reference=ref(db,'players/alice'),stop=await ready(reference);
  const service=createProgressionService({verifyToken:async token=>token==='alice-token'?{uid:'alice'}:null,transact:(_uid,fn)=>runTransaction(reference,fn,{applyLocally:false}),isUnlocked:()=>true});
  try{
   const run=(requestId,command)=>service.execute({token:'alice-token',requestId,command});
   assert.equal((await run('1'.repeat(32),{type:'initialize'})).status,'applied');
   const cmd={type:'upgrade',kind:'fortify',expectedRank:3}; // already at cap
   assert.equal((await run('2'.repeat(32),cmd)).status,'invalid');
   const craft={type:'craft',item:'boots'},requestId='3'.repeat(32);
   const results=await Promise.all([run(requestId,craft),run(requestId,craft)]);
   assert.equal(results.filter(x=>x.status==='applied').length,1);assert.equal(results.filter(x=>x.status==='already-applied').length,1);
   const saved=(await get(reference)).val();assert.equal(saved.armory.scrap,50);assert.equal(saved.storyProgress,2);assert.ok(saved.progressionRequests[requestId]);
  }finally{stop();}
 });
});
