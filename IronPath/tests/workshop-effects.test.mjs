import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {migrateWorkshop,toggleEquipped} from '../workshop/workshop-model.mjs';
import {captureWorkshopLoadout,workshopEffects} from '../workshop/workshop-effects.mjs';
const effect=(w,wave=6,mode='solo')=>workshopEffects(captureWorkshopLoadout(w,mode),wave);
const baseline=effect(migrateWorkshop(null));
test('each migrated legacy item keeps its old effect with neutral other slots',()=>{
 const expected=[['damage',3],['bunkerHealth',10],['movement',20],['range',30],['cooldown',4],['startSupplies',25],['airstrikeDamage',10],['shotIntervalMultiplier',.9],['waveSupplies',8],['tankTowerMultiplier',1.1]];
 for(let id=1;id<=10;id++){
  const w=migrateWorkshop({owned:1<<(id-1),equipped:id});const [key,value]=expected[id-1];assert.deepEqual(effect(w),{...baseline,[key]:value},`legacy ${id}`);
  if(id>=7)assert.deepEqual(effect(w,5),baseline,`legacy ${id} before wave 6`);
 }
});
test('crafted equipment stacks at once and applies only the installed modification',()=>{
 // IPL-0137: the taken list carries every worn piece — vest, boots, radio and
 // weapon in parallel; nothing displaces anything.
 const w=migrateWorkshop(null);w.owned=['marksman','mechanic','radio','boots'];w.equipped=['marksman','mechanic','radio'];w.mods={marksman:'precision',mechanic:'lightweight',radio:'efficient',boots:'lightweight'};
 assert.deepEqual(effect(w),{...baseline,damage:2,range:20,movement:10,bunkerHealth:10,startSupplies:10,cooldown:5});
 const changed=toggleEquipped(w,'boots');assert.equal(effect(changed).movement,35,'both lightweight pieces stack — mechanic 10 + boots 15 + boots mod 10');assert.equal(effect(changed).bunkerHealth,10,'the mechanic stays worn — nothing replaces anything');
 assert.ok(!toggleEquipped(changed,'boots').equipped.includes('boots'),'the toggle takes the boots back off');
});
test('competitive modes standardize effects while keeping visual choices',()=>{
 const w=migrateWorkshop({owned:1,equipped:1}),solo=captureWorkshopLoadout(w,'solo');
 for(const mode of ['versus','two-vs-two']){const snap=captureWorkshopLoadout(w,mode);assert.deepEqual(snap.items,solo.items);assert.deepEqual(workshopEffects(snap,20),baseline);}
 // Migrated legacy gear keeps its early value and grows with the wave curve
 // from wave 6 (see equipment-effects.mjs): scope damage 3 + 5 at wave 20.
 assert.equal(effect(w,20,'coop').damage,8);assert.equal(effect(w,20,'four-coop').damage,8);
});
test('match snapshot is detached, immutable and malformed input is rejected',()=>{
 const w=migrateWorkshop({owned:1,equipped:1}),snap=captureWorkshopLoadout(w,'solo');const takenOff=toggleEquipped(w,'legacy-1');assert.notDeepEqual(takenOff.equipped,w.equipped);assert.equal(workshopEffects(snap,1).damage,3,'the captured snapshot never sees later account edits');
 assert.ok(Object.isFrozen(snap.items[0]));
 assert.equal(captureWorkshopLoadout(w,'future-mode'),null);assert.equal(workshopEffects(snap,-1),null);
 assert.equal(workshopEffects({...snap,items:[{id:'unknown',mod:null},...snap.items.slice(1)]},1),null,'a loadout item the store never granted fails validation');
 assert.equal(workshopEffects({...snap,items:[{id:'legacy-1',mod:null},{id:'legacy-1',mod:null}]},1),null,'duplicate pieces fail validation');
});
