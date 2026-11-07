import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {migrateWorkshop,equipWorkshop} from '../workshop-model.mjs';
import {captureWorkshopLoadout,workshopEffects} from '../workshop-effects.mjs';
const effect=(w,wave=6,mode='solo')=>workshopEffects(captureWorkshopLoadout(w,mode),wave);
const baseline=effect(migrateWorkshop(null));
test('each migrated legacy item keeps its old effect with neutral other slots',()=>{
 const expected=[['damage',3],['bunkerHealth',10],['movement',20],['range',30],['cooldown',4],['startSupplies',25],['airstrikeDamage',10],['shotIntervalMultiplier',.9],['waveSupplies',8],['tankTowerMultiplier',1.1]];
 for(let id=1;id<=10;id++){
  const w=migrateWorkshop({owned:1<<(id-1),equipped:id});const [key,value]=expected[id-1];assert.deepEqual(effect(w),{...baseline,[key]:value},`legacy ${id}`);
  if(id>=7)assert.deepEqual(effect(w,5),baseline,`legacy ${id} before wave 6`);
 }
});
test('crafted equipment stacks across slots and applies only the equipped modification',()=>{
 const w=migrateWorkshop(null);w.owned=['marksman','mechanic','radio','boots'];w.equipped={weapon:'marksman',gear:'mechanic',gadget:'radio'};w.mods={marksman:'precision',mechanic:'lightweight',radio:'efficient',boots:'lightweight'};
 assert.deepEqual(effect(w),{...baseline,damage:2,range:20,movement:10,bunkerHealth:10,startSupplies:10,cooldown:5});
 const changed=equipWorkshop(w,'gear','boots');assert.equal(effect(changed).movement,25);assert.equal(effect(changed).bunkerHealth,0);
});
test('competitive modes standardize effects while keeping visual choices',()=>{
 const w=migrateWorkshop({owned:1,equipped:1}),solo=captureWorkshopLoadout(w,'solo');
 for(const mode of ['versus','two-vs-two']){const snap=captureWorkshopLoadout(w,mode);assert.deepEqual(snap.items,solo.items);assert.deepEqual(workshopEffects(snap,20),baseline);}
 // Migrated legacy gear keeps its early value and grows with the wave curve
 // from wave 6 (see equipment-effects.mjs): scope damage 3 + 5 at wave 20.
 assert.equal(effect(w,20,'coop').damage,8);assert.equal(effect(w,20,'four-coop').damage,8);
});
test('match snapshot is detached, immutable and malformed input is rejected',()=>{
 const w=migrateWorkshop({owned:1,equipped:1}),snap=captureWorkshopLoadout(w,'solo');w.equipped.gadget='none';assert.equal(workshopEffects(snap,1).damage,3);assert.ok(Object.isFrozen(snap.items[2]));
 assert.equal(captureWorkshopLoadout(w,'future-mode'),null);assert.equal(workshopEffects(snap,-1),null);assert.equal(workshopEffects({...snap,items:[{slot:'weapon',id:'unknown',mod:null},...snap.items.slice(1)]},1),null);
});
