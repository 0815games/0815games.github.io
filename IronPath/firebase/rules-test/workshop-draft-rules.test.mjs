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
