import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {initializeWireWorkshop,decodeWorkshop} from '../workshop-wire.mjs';import {applyWorkshopWaveCredit} from '../workshop-wave-credit.mjs';
const id='0123456789abcdef0123456789abcdef',mask=(...waves)=>waves.reduce((v,w)=>v|(1<<(w-1)),0);
const initial=()=>initializeWireWorkshop({name:'Alice',xp:0,armory:{scrap:0,owned:0,equipped:0,fortify:2},other:{keep:true}});
test('completed solo boss wave credits regular rewards, bonus and receipt together',()=>{
 const p=initial(),copy=structuredClone(p),options={kind:'solo',receiptId:id,mask:mask(1,2,3,4,5)},result=applyWorkshopWaveCredit(p,options);
 assert.deepEqual(p,copy);assert.equal(result.xp,250);assert.equal(result.armory.scrap,70);assert.equal(result.armory.fortify,2);assert.equal(decodeWorkshop(result.workshop).components,1);assert.deepEqual(decodeWorkshop(result.workshop).owned,['legacy-1','legacy-2']);assert.equal(result.soloWorkshopReceipts[id],options.mask);assert.deepEqual(result.other,{keep:true});assert.equal(applyWorkshopWaveCredit(result,options),null);
});
test('co-op receipts suppress replays and only new waves earn rewards',()=>{
 const opts={kind:'coop',receiptId:id,mask:mask(1,2,3,4,5)},one=applyWorkshopWaveCredit(initial(),opts);assert.equal(applyWorkshopWaveCredit(one,opts),null);
 const two=applyWorkshopWaveCredit(one,{...opts,mask:opts.mask|mask(6)});assert.equal(two.armory.scrap,80);assert.equal(decodeWorkshop(two.workshop).components,1);assert.deepEqual(decodeWorkshop(two.workshop).owned,['legacy-1','legacy-2','legacy-3']);assert.equal(two.coopRewards[id],opts.mask|mask(6));
});
test('corrupt saves and receipts, invalid blocks and overflowing experience fail closed',()=>{
 const p=initial(),opts={kind:'solo',receiptId:id,mask:mask(5)};for(const bad of [{...p,workshop:'future'}, {...p,xp:9999999}, {...p,soloWorkshopReceipts:{[id]:-1}}, {...p,soloWorkshopReceipts:[]}, {...p,armory:{...p.armory,scrap:-1}}])assert.equal(applyWorkshopWaveCredit(bad,opts),null);
 assert.equal(applyWorkshopWaveCredit(p,{...opts,block:Number.MAX_SAFE_INTEGER}),null);assert.equal(applyWorkshopWaveCredit(p,{...opts,receiptId:'bad'}),null);
});
