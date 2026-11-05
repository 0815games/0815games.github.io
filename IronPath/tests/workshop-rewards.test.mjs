import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {applyBossRewards} from '../workshop-rewards.mjs';
import {migrateWorkshop} from '../workshop-model.mjs';
const mask=(...waves)=>waves.reduce((n,w)=>n|(1<<(w-1)),0);
function profile(){const armory={scrap:70,owned:3,equipped:1,fortify:2,extra:'retained'};return {name:'Soldier',xp:123,armory,workshop:migrateWorkshop(armory),coopRewards:{existing:3},unrelated:{value:1}};}
test('only newly completed boss waves award bonus, atomically with the receipt',()=>{
 const initial=profile(),copy=structuredClone(initial),result=applyBossRewards(initial,mask(5),mask(5,6,10,15));
 assert.equal(result.bosses,2);assert.equal(result.profile.armory.scrap,110);assert.equal(result.profile.workshop.components,2);assert.equal(result.receipt,mask(5,6,10,15));assert.deepEqual(initial,copy);
 assert.equal(result.profile.armory.extra,'retained');assert.deepEqual(result.profile.coopRewards,initial.coopRewards);assert.deepEqual(result.profile.unrelated,initial.unrelated);
 const replay=applyBossRewards(result.profile,result.receipt,mask(5,6,10,15));assert.equal(replay.bosses,0);assert.deepEqual(replay.profile,result.profile);
});
test('uses actual waves across receipt blocks and does not award incomplete waves',()=>{
 const first=applyBossRewards(profile(),0,mask(4,5),1);assert.equal(first.bosses,1); // wave 25
 const noBoss=applyBossRewards(profile(),0,mask(1,2,3,4),0);assert.equal(noBoss.bosses,0);
});
test('rejects malformed profiles, masks, future schema and balance overflow without mutation',()=>{
 const p=profile();assert.equal(applyBossRewards({...p,armory:{scrap:-1}},0,mask(5)),null);assert.equal(applyBossRewards({...p,workshop:{...p.workshop,version:2}},0,mask(5)),null);
 assert.equal(applyBossRewards(p,-1,mask(5)),null);assert.equal(applyBossRewards(p,0,2**20),null);assert.equal(applyBossRewards(p,0,mask(5),Number.MAX_SAFE_INTEGER),null);
 // At the caps the balance is clamped and the wave is still credited, so the player
 // never loses XP because of a full scrap or component balance.
 const scrapCap=applyBossRewards({...p,armory:{...p.armory,scrap:9999990}},0,mask(5));assert.equal(scrapCap.profile.armory.scrap,10000000);assert.equal(scrapCap.receipt,mask(5));
 const componentCap=applyBossRewards({...p,workshop:{...p.workshop,components:1000000}},0,mask(5));assert.equal(componentCap.profile.workshop.components,1000000);assert.equal(componentCap.bosses,1);
 assert.equal(applyBossRewards({...p,armory:{...p.armory,scrap:'x'}},0,mask(5)),null);
});
