// Tests a repository-derived draft, NOT the unknown production ruleset.
import {test,before,after,beforeEach} from 'node:test';import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,set,get,onValue,runTransaction} from 'firebase/database';
import {createWorkshopAccount} from '../../workshop-account.mjs';import {decodeWorkshop} from '../../workshop-wire.mjs';
import {applyWorkshopWaveCredit} from '../../workshop-wave-credit.mjs';
const id='0123456789abcdef0123456789abcdef';let env,alice,bob;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../workshop.complete.draft.rules.json',import.meta.url),'utf8')}});alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();});
beforeEach(async()=>{await env.clearDatabase();await env.withSecurityRulesDisabled(async ctx=>set(ref(ctx.database(),'players/alice'),{name:'Alice',gender:'female',xp:750,armory:{scrap:100,fortify:3,plating:1,owned:1,equipped:1},storyProgress:2,coopRewards:{[id]:3}}));});after(()=>env.cleanup());
const account=()=>createWorkshopAccount({db:alice,auth:{currentUser:{uid:'alice'}},sdk:{ref,onValue,runTransaction},canEdit:()=>true});
async function ready(reference){let stop;await new Promise((resolve,reject)=>{stop=onValue(reference,resolve,reject)});return stop;}
test('real account service migrates, crafts and equips under the candidate rules',async()=>{
 const service=account();assert.equal((await service.initialize()).status,'saved');assert.equal((await service.command({type:'craft',item:'boots'})).status,'saved');assert.equal((await service.command({type:'equip',slot:'gear',item:'boots'})).status,'saved');
 const p=(await get(ref(alice,'players/alice'))).val();assert.equal(p.armory.scrap,50);assert.equal(p.armory.fortify,3);assert.equal(p.storyProgress,2);assert.equal(p.coopRewards[id],3);assert.equal(decodeWorkshop(p.workshop).equipped.gear,'boots');
});
test('owner-only string bounds, unknown children and existing progress protection',async()=>{
 const service=account();assert.equal((await service.initialize()).status,'saved');const field=ref(alice,'players/alice/workshop');
 await assertFails(set(ref(bob,'players/alice/workshop'),'x'));await assertFails(get(ref(bob,'players/alice/workshop')));await assertFails(set(field,{}));await assertFails(set(field,''));await assertFails(set(field,'a'.repeat(2049)));await assertFails(set(field,null));await assertFails(set(ref(alice,'players/alice/unknown'),'x'));await assertFails(set(ref(alice,'players/alice/storyProgress'),null));
 // Rules bound the payload but cannot parse JSON or validate item ownership.
 await assertSucceeds(set(field,'future-version'));assert.equal((await service.command({type:'craft',item:'boots'})).status,'rejected');assert.equal((await get(field)).val(),'future-version');
});
test('solo reward receipt grows without clearing previously credited bits',async()=>{
 const r=ref(alice,`players/alice/soloWorkshopReceipts/${id}`);await assertSucceeds(set(r,3));await assertFails(set(r,4));await assertSucceeds(set(r,7));await assertFails(set(r,1048576));await assertFails(set(ref(alice,'players/alice/soloWorkshopReceipts/bad'),1));
 await assertFails(set(ref(alice,'players/alice/soloWorkshopReceipts'),null));
});
test('wave credit transaction under candidate rules preserves workshop and existing progress',async()=>{
 const service=account();assert.equal((await service.initialize()).status,'saved');const r=ref(alice,'players/alice'),stop=await ready(r);
 try{const opts={kind:'solo',receiptId:id,mask:31};const credit=await runTransaction(r,current=>applyWorkshopWaveCredit(current,opts)??undefined,{applyLocally:false});assert.equal(credit.committed,true);const again=await runTransaction(r,current=>applyWorkshopWaveCredit(current,opts)??undefined,{applyLocally:false});assert.equal(again.committed,false);const p=(await get(r)).val();assert.equal(p.xp,1000);assert.equal(p.armory.scrap,180);assert.equal(decodeWorkshop(p.workshop).components,1);assert.equal(p.soloWorkshopReceipts[id],31);assert.equal(p.coopRewards[id],3);assert.equal(p.storyProgress,2);}finally{stop();}
});
test('free-tier solo path initializes once and credits a run receipt under candidate rules',async()=>{
 const {applySoloWaveReward}=await import('../../workshop-solo-reward.mjs');
 const r=ref(alice,'players/alice'),stop=await ready(r),runId='cd'.repeat(16);
 try{
  const first=await runTransaction(r,current=>applySoloWaveReward(current,{runId,wave:5})??undefined,{applyLocally:false});assert.equal(first.committed,true);
  const again=await runTransaction(r,current=>applySoloWaveReward(current,{runId,wave:5})??undefined,{applyLocally:false});assert.equal(again.committed,false,'a replayed report is not written');
  const p=(await get(r)).val();assert.equal(p.xp,820);assert.equal(p.armory.scrap,130);assert.equal(p.armory.fortify,3);assert.equal(p.storyProgress,2);assert.equal(p.coopRewards[id],3);assert.ok(decodeWorkshop(p.workshop));assert.equal(p.soloWorkshopReceipts[runId],16);
 }finally{stop();}
});
test('legacy tier never writes workshop fields and keeps the wave payable',async()=>{
 const {creditSoloWave}=await import('../../workshop-solo-credit.mjs');
 const {rewardWave}=await import('../../armory.mjs');
 const r=ref(alice,'players/alice'),runId='ef'.repeat(16);
 const outcome=await creditSoloWave({sdk:{runTransaction},profileRef:r,amount:30,wave:5,runId,rewardWave,subscribe:()=>new Promise((resolve,reject)=>{let stop;stop=onValue(r,()=>resolve(stop||(()=>{})),reject);}),mode:'legacy'});
 assert.equal(outcome.status,'legacy');const p=(await get(r)).val();
 assert.equal(p.xp,780);assert.equal(p.workshop,undefined);assert.equal(p.soloWorkshopReceipts,undefined);assert.equal(p.storyProgress,2);
});
test('candidate rules preserve representative legacy saves through migration and a wave',async()=>{
 const {applySoloWaveReward}=await import('../../workshop-solo-reward.mjs');
 const {decodeWorkshop}=await import('../../workshop-wire.mjs');
 const runId='aa'.repeat(16);
 const shapes=[
  {name:'NoArmory',gender:'male',xp:0},
  {name:'Maxed',gender:'female',xp:9999920,armory:{scrap:10000000,fortify:3,plating:3,repair:3,gun:3,supply:3,safeguard:3,owned:1023,equipped:10},campaign:3,storyProgress:12,skills:'0,0,0,0,0;assault'},
  {name:'Partial',gender:'female',xp:120,armory:{scrap:7,fortify:1,owned:5,equipped:1},coopRewards:{[id]:3,['0'.repeat(32)]:1048575}},
  {name:'OldReceipts',gender:'male',xp:40,armory:{scrap:0,fortify:0,plating:0,owned:0,equipped:0},campaign:1,storyProgress:1,coopRewards:{[id]:1},soloWorkshopReceipts:{['11'.repeat(16)]:7}}
 ];
 for(const profile of shapes){
  const r=ref(alice,'players/alice');await set(r,structuredClone(profile));
  const stop=await new Promise((resolve,reject)=>{const off=onValue(r,()=>resolve(off),reject);});
  try{
   const credit=await runTransaction(r,current=>applySoloWaveReward(current,{runId,wave:5})??undefined,{applyLocally:false});
   assert.equal(credit.committed,true,`migration must commit for ${profile.name}`);
   const saved=(await get(r)).val();
   assert.equal(saved.name,profile.name);assert.equal(saved.gender,profile.gender);assert.equal(saved.xp,profile.xp+70);
   if(profile.armory)assert.equal(saved.armory.scrap,profile.armory.scrap+30);else assert.equal(saved.armory.scrap,30);
   assert.equal(saved.campaign,profile.campaign);assert.equal(saved.storyProgress,profile.storyProgress);assert.equal(saved.skills,profile.skills);
   assert.deepEqual(saved.coopRewards,profile.coopRewards);
   if(profile.soloWorkshopReceipts)assert.equal(saved.soloWorkshopReceipts['11'.repeat(16)],7);
   assert.equal(saved.soloWorkshopReceipts[runId],16);assert.ok(decodeWorkshop(saved.workshop));
   await assertFails(set(ref(alice,'players/alice/coopRewards'),null));
   await assertFails(set(r,{...saved,workshop:undefined}));
  }finally{stop();}
 }
});
