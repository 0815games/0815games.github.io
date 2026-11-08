// Loadout effects for captured workshop snapshots, live in solo, campaign
// and co-op; competitive modes standardize to neutral. Values are covered by
// the balance suite. All bonuses belong to the wearer except bunkerHealth,
// which is shared with their team.
import {validateWorkshop} from './workshop-model.mjs?v=20261108-squadmaps1';
import {PRESTIGE,isPrestige} from './prestige.mjs?v=20261108-squadmaps1';
import {legacyEquipmentEffects} from './equipment-effects.mjs?v=20261107-balance1';

const BASE=Object.freeze({damage:0,range:0,movement:0,cooldown:0,bunkerHealth:0,startSupplies:0,airstrikeDamage:0,shotIntervalMultiplier:1,waveSupplies:0,tankTowerMultiplier:1});
const ITEMS=Object.freeze({
 marksman:{damage:2,range:10},mechanic:{bunkerHealth:10,startSupplies:10},
 radio:{cooldown:3},boots:{movement:15}
});
// Campaign trophies. Same shape as a crafted item so nothing downstream cares
// where an item came from; the values are tuned as the campaign finale answer.
const TROPHY=Object.freeze(Object.fromEntries(Object.entries(PRESTIGE).map(([id,item])=>[id,item.bonus])));
const TROPHY_MODS=Object.freeze(Object.fromEntries(Object.entries(PRESTIGE).map(([id,item])=>[id,Object.fromEntries(Object.entries(item.mods).map(([mod,info])=>[mod,modEffect(info.effect)]))])));
// Read the numeric effect back out of the description we show the player, so the
// catalogue text and the combat value cannot drift apart.
function modEffect(text){
 if(/damage/i.test(text))return {damage:Number(text.match(/(\d+)/)?.[1]||0)};
 if(/angle|range/i.test(text))return {range:Number(text.match(/(\d+)/)?.[1]||0)};
 if(/movement/i.test(text))return {movement:Number(text.match(/(\d+)/)?.[1]||0)};
 if(/bunker/i.test(text))return {bunkerHealth:Number(text.match(/(\d+)/)?.[1]||0)};
 if(/supplies/i.test(text))return {startSupplies:Number(text.match(/(\d+)/)?.[1]||0)};
 if(/recharges/i.test(text))return {cooldown:Number(text.match(/(\d+)/)?.[1]||0)};
 const percent=Number(text.match(/(\d+)%/)?.[1]||0);return percent?{shotIntervalMultiplier:1-percent/100}:{};
}
const MODS=Object.freeze({
 marksman:{precision:{range:10},quick:{shotIntervalMultiplier:.95}},
 mechanic:{tools:{startSupplies:5},lightweight:{movement:10}},
 radio:{efficient:{cooldown:2},extended:{range:10}},
 boots:{lightweight:{movement:10}}
});
const modes=new Set(['solo','coop','four-coop','versus','two-vs-two']);
function add(target,source){for(const [key,value] of Object.entries(source||{})){if(key==='shotIntervalMultiplier'||key==='tankTowerMultiplier')target[key]*=value;else target[key]+=value;}}

// A match captures only the selected items and mods, not a mutable account.
// Competitively standardized effects are neutral; visual choices remain.
export function captureWorkshopLoadout(workshop,mode){
 if(!validateWorkshop(workshop)||!modes.has(mode))return null;
 const items=['weapon','gear','gadget'].map(slot=>{const id=workshop.equipped[slot];return Object.freeze({slot,id,mod:workshop.mods[id]||null});});
 return Object.freeze({version:1,mode,items:Object.freeze(items)});
}
export function workshopEffects(snapshot,wave){
 if(!snapshot||snapshot.version!==1||!modes.has(snapshot.mode)||!Array.isArray(snapshot.items)||snapshot.items.length!==3||!Number.isSafeInteger(wave)||wave<0)return null;
 // Revalidate snapshots rather than trusting serialized multiplayer input.
 const slots=['weapon','gear','gadget'];if(snapshot.items.some((item,i)=>!item||item.slot!==slots[i]||typeof item.id!=='string'||!(item.mod===null||typeof item.mod==='string')))return null;
 const ids=snapshot.items.map(item=>item.id),owned=ids.filter(id=>id!=='standard'&&id!=='none'),mods={};
 for(const item of snapshot.items){if(item.mod!==null){if(Object.hasOwn(mods,item.id))return null;mods[item.id]=item.mod;}}
 const w={version:1,components:0,owned,equipped:Object.fromEntries(snapshot.items.map(i=>[i.slot,i.id])),mods};if(!validateWorkshop(w))return null;
 const result={...BASE};if(snapshot.mode==='versus'||snapshot.mode==='two-vs-two')return result;
 // Crafted and earned gear follows the same long-run curve as the legacy
 // armory (see equipment-effects.mjs): flat combat bonuses grow from wave 6 so
 // a damage item keeps its share of output next to upgraded towers. Legacy
 // items scale inside legacyEquipmentEffects and must not be scaled twice.
 const late=Math.max(0,wave-5);
 const grow=source=>{
  if(!late||!source||!source.damage&&!source.airstrikeDamage&&!source.waveSupplies)return source;
  const scaled={...source};
  if(scaled.damage)scaled.damage+=Math.floor(late/3);
  if(scaled.airstrikeDamage)scaled.airstrikeDamage+=Math.floor(late/2);
  if(scaled.waveSupplies)scaled.waveSupplies+=Math.floor(late/8);
  return scaled;
 };
 for(const {id,mod} of snapshot.items){if(id.startsWith('legacy-'))add(result,legacyEquipmentEffects(Number(id.slice(7)),wave));else if(isPrestige(id)){add(result,grow(TROPHY[id]));if(mod)add(result,grow(TROPHY_MODS[id]?.[mod]));}else{add(result,grow(ITEMS[id]));if(mod)add(result,grow(MODS[id]?.[mod]));}}
 return result;
}
