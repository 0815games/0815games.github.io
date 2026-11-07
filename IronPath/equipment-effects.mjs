// Existing one-slot equipment effects. These values mirror the original
// gameplay and remain shared by simulation, abilities and motion prediction.
const neutral=Object.freeze({damage:0,range:0,movement:0,cooldown:0,bunkerHealth:0,startSupplies:0,airstrikeDamage:0,shotIntervalMultiplier:1,waveSupplies:0,tankTowerMultiplier:1});
const changes=[{}, {damage:3}, {bunkerHealth:10}, {movement:20}, {range:30}, {cooldown:4}, {startSupplies:25}, {airstrikeDamage:10}, {shotIntervalMultiplier:.9}, {waveSupplies:8}, {tankTowerMultiplier:1.1}];
const effects=changes.map(change=>Object.freeze({...neutral,...change}));
// Long-run gear: a flat bonus bought in the early game fades behind the wave
// curve (+23% enemy health per wave). From wave 6 the flat combat bonuses grow
// with the waves - the scope's damage, the demolition pouch's strike and the
// quartermaster badge's payout all keep roughly the share of total output they
// had when they were earned. Percent and utility bonuses already hold.
const scaledCache=new Map();
export function legacyEquipmentEffects(equipped,wave=0){
 if(!Number.isInteger(equipped)||equipped<=0||equipped>=effects.length)return neutral;
 if(equipped>=7&&wave<6)return neutral;
 const late=Math.max(0,wave-5);
 if(!late)return effects[equipped];
 const key=equipped*10000+late;
 let item=scaledCache.get(key);
 if(!item){
  const base=effects[equipped];
  item=Object.freeze({...base,
   damage:base.damage?base.damage+Math.floor(late/3):base.damage,
   airstrikeDamage:base.airstrikeDamage?base.airstrikeDamage+Math.floor(late/2):base.airstrikeDamage,
   waveSupplies:base.waveSupplies?base.waveSupplies+Math.floor(late/8):base.waveSupplies});
  scaledCache.set(key,item);
 }
 return item;
}
