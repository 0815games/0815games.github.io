// Emulator-only storage/transaction tests using deliberately minimal rules.
// These are NOT production rules and do not validate or secure player data.
import {test,before,beforeEach,after} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import {ref,get,set,onValue,runTransaction} from 'firebase/database';
import {initializeWireWorkshop,applyWireWorkshopCommand,decodeWorkshop,encodeWorkshop} from '../../workshop-wire.mjs';
let env,a,b,other;
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../workshop-emulator-only.rules.json',import.meta.url),'utf8')}});
 a=env.authenticatedContext('alice').database();b=env.authenticatedContext('alice').database();other=env.authenticatedContext('bob').database();
});
beforeEach(async()=>env.clearDatabase());after(async()=>env.cleanup());
const base=()=>({name:'Alice',gender:'female',xp:10,armory:{scrap:60,owned:3,equipped:2,fortify:3},coopRewards:{abcd:31}});
async function ready(reference){let stop;await new Promise((resolve,reject)=>{stop=onValue(reference,resolve,reject)});return stop;}

test('migration round trips an empty workshop scalar and preserves existing account values',async()=>{
 const reference=ref(a,'players/alice');await set(reference,base());const stop=await ready(reference);
 try{const result=await runTransaction(reference,current=>initializeWireWorkshop(current)??undefined,{applyLocally:false});assert.equal(result.committed,true);
  const stored=(await get(reference)).val(),w=decodeWorkshop(stored.workshop);assert.equal(typeof stored.workshop,'string');assert.equal(w.components,0);assert.deepEqual(w.owned,['legacy-1','legacy-2']);assert.deepEqual({...w.mods},{});assert.equal(w.equipped.gear,'legacy-2');assert.deepEqual(stored.armory,base().armory);assert.deepEqual(stored.coopRewards,base().coopRewards);
  await assertFails(get(ref(other,'players/alice')));await assertFails(set(ref(other,'players/alice/workshop'),'tampered'));
 }finally{stop();}
});
test('completely empty owned and mod collections survive Firebase storage',async()=>{
 const reference=ref(a,'players/alice');const empty=initializeWireWorkshop({name:'Alice',gender:'female',xp:0});await set(reference,empty);
 const saved=(await get(reference)).val(),decoded=decodeWorkshop(saved.workshop);assert.deepEqual(decoded.owned,[]);assert.deepEqual({...decoded.mods},{});assert.deepEqual(decoded.equipped,{weapon:'standard',gear:'none',gadget:'none'});
});
test('competing transactions cannot both spend the same scrap',async()=>{
 let p=initializeWireWorkshop(base()),w=decodeWorkshop(p.workshop);w.components=1;p.workshop=encodeWorkshop(w);
 const ra=ref(a,'players/alice'),rb=ref(b,'players/alice');await set(ra,p);const stopA=await ready(ra),stopB=await ready(rb);
 try{
  const [first,second]=await Promise.all([
   runTransaction(ra,current=>applyWireWorkshopCommand(current,{type:'craft',item:'boots'})??undefined,{applyLocally:false}),
   runTransaction(rb,current=>applyWireWorkshopCommand(current,{type:'craft',item:'marksman'})??undefined,{applyLocally:false})
  ]);
  assert.equal([first,second].filter(result=>result.committed).length,1);
  const stored=(await get(ra)).val(),workshop=decodeWorkshop(stored.workshop);assert.ok(workshop);assert.equal(workshop.owned.filter(id=>id==='boots'||id==='marksman').length,1);
  assert.equal(stored.armory.scrap,workshop.owned.includes('boots')?10:0);assert.equal(workshop.components,workshop.owned.includes('boots')?1:0);assert.equal(stored.armory.fortify,3);assert.deepEqual(stored.coopRewards,{abcd:31});
 }finally{stopA();stopB();}
});
test('unsupported or corrupt workshop is never reset by a transaction',async()=>{
 const reference=ref(a,'players/alice'),profile={...base(),workshop:'[2,0,[],[],[]]'};await set(reference,profile);const stop=await ready(reference);
 try{const result=await runTransaction(reference,current=>applyWireWorkshopCommand(current,{type:'craft',item:'boots'})??undefined,{applyLocally:false});assert.equal(result.committed,false);assert.deepEqual((await get(reference)).val(),profile);}finally{stop();}
});

test('concurrent completed-wave replays credit a boss only once',async()=>{
 const {applyWorkshopWaveCredit}=await import('../../workshop-wave-credit.mjs');
 const receiptId='0123456789abcdef0123456789abcdef',options={kind:'coop',receiptId,mask:31};
 const ra=ref(a,'players/alice'),rb=ref(b,'players/alice');await set(ra,initializeWireWorkshop(base()));const stopA=await ready(ra),stopB=await ready(rb);
 try{
  const outcomes=await Promise.all([ra,rb].map(reference=>runTransaction(reference,current=>applyWorkshopWaveCredit(current,options)??undefined,{applyLocally:false})));
  assert.equal(outcomes.filter(result=>result.committed).length,1);
  const saved=(await get(ra)).val();assert.equal(saved.xp,260);assert.equal(saved.armory.scrap,150); // wave 2/4 duplicate legacy item adds 20
  assert.equal(decodeWorkshop(saved.workshop).components,1);assert.equal(saved.coopRewards[receiptId],31);assert.equal(saved.coopRewards.abcd,31);assert.equal(saved.armory.fortify,3);
 }finally{stopA();stopB();}
});
