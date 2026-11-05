// Existing one-slot equipment effects. These values mirror the original
// gameplay and remain shared by simulation, abilities and motion prediction.
const neutral=Object.freeze({damage:0,range:0,movement:0,cooldown:0,bunkerHealth:0,startSupplies:0,airstrikeDamage:0,shotIntervalMultiplier:1,waveSupplies:0,tankTowerMultiplier:1});
const changes=[{}, {damage:3}, {bunkerHealth:10}, {movement:20}, {range:30}, {cooldown:4}, {startSupplies:25}, {airstrikeDamage:10}, {shotIntervalMultiplier:.9}, {waveSupplies:8}, {tankTowerMultiplier:1.1}];
const effects=changes.map(change=>Object.freeze({...neutral,...change}));
export function legacyEquipmentEffects(equipped,wave=0){
 return Number.isInteger(equipped)&&equipped>0&&equipped<effects.length&&(equipped<7||wave>=6)?effects[equipped]:neutral;
}
