// Experimental loadout effects, not connected to live combat or networking.
// Numbers are provisional and require gameplay/balance testing. All bonuses
// belong to the wearer except bunkerHealth, which is shared with their team.
import {validateWorkshop} from './workshop-model.mjs';

const BASE=Object.freeze({damage:0,range:0,movement:0,cooldown:0,bunkerHealth:0,startSupplies:0,airstrikeDamage:0,shotIntervalMultiplier:1,waveSupplies:0,tankTowerMultiplier:1});
const ITEMS=Object.freeze({
 'legacy-1':{damage:3},'legacy-2':{bunkerHealth:10},'legacy-3':{movement:20},
 'legacy-4':{range:30},'legacy-5':{cooldown:4},'legacy-6':{startSupplies:25},
 'legacy-7':{airstrikeDamage:10},'legacy-8':{shotIntervalMultiplier:.9},
 'legacy-9':{waveSupplies:8},'legacy-10':{tankTowerMultiplier:1.1},
 marksman:{damage:2,range:10},mechanic:{bunkerHealth:10,startSupplies:10},
 radio:{cooldown:3},boots:{movement:15}
});
const MODS=Object.freeze({
 marksman:{precision:{range:10},quick:{shotIntervalMultiplier:.95}},
 mechanic:{tools:{startSupplies:5},lightweight:{movement:10}},
 radio:{efficient:{cooldown:2},extended:{range:10}},
 boots:{lightweight:{movement:10}}
});
const delayed=new Set(['legacy-7','legacy-8','legacy-9','legacy-10']);
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
 for(const {id,mod} of snapshot.items){if(!delayed.has(id)||wave>=6)add(result,ITEMS[id]);if(mod)add(result,MODS[id]?.[mod]);}
 return result;
}
