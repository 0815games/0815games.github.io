// RTDB-safe wire format for the workshop stored on production accounts. The
// single string preserves empty arrays/objects that RTDB removes as nodes.
// Writes require the published workshop rules (see
// firebase/WORKSHOP-RULES-TO-PUBLISH.json); without them saves are rejected
// and the legacy path keeps working.
//
// IPL-0137: wire v2 stores the taken array — every worn piece at once. The
// decoder still reads the retired three-slot v1 and migrates it to wearing
// everything the account owns.
import {validateWorkshop} from './workshop-model.mjs?v=20261125-aim15';
import {initializeWorkshop,applyWorkshopCommand} from './workshop-transactions.mjs?v=20261125-aim15';
import {isPrestige} from '../core/prestige.mjs?v=20261112-pressure1';
import {completeStory} from '../core/campaign.mjs?v=20261112-pressure1';
const LIMIT=2048;
const exactKeys=(value,keys)=>value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).length===keys.length && keys.every(k=>Object.hasOwn(value,k));

// Reject unknown fields rather than accidentally discarding a future extension.
export function encodeWorkshop(value){
 if(!exactKeys(value,['version','components','owned','equipped','mods'])||!Array.isArray(value.equipped)||!validateWorkshop(value))return null;
 const mods=Object.entries(value.mods).sort(([a],[b])=>a<b?-1:a>b?1:0);
 const text=JSON.stringify([2,value.components,[...value.owned],[...value.equipped],mods]);
 return text.length<=LIMIT?text:null;
}
export function decodeWorkshop(text){
 if(typeof text!=='string'||text.length>LIMIT)return null;
 let value;try{value=JSON.parse(text);}catch{return null;}
 if(!Array.isArray(value)||value.length!==5||typeof value[1]!=='number'||!Array.isArray(value[2])||!Array.isArray(value[4]))return null;
 const mods=Object.create(null);
 for(const pair of value[4]){
  if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string'||typeof pair[1]!=='string'||Object.hasOwn(mods,pair[0]))return null;
  mods[pair[0]]=pair[1];
 }
 let result;
 if(value[0]===1){
  // Retired three-slot wire: wear every owned piece from the first read.
  if(!Array.isArray(value[3]))return null;
  result={version:2,components:value[1],owned:value[2],equipped:[...value[2]],mods};
 }else if(value[0]===2){
  if(!Array.isArray(value[3]))return null;
  result={version:2,components:value[1],owned:value[2],equipped:value[3],mods};
 }else return null;
 return validateWorkshop(result)?result:null;
}
// Reducers accept the current profile from an account transaction. Never write
// the result without the surrounding transaction and a compatible rule set.
export function initializeWireWorkshop(profile){
 const initialized=initializeWorkshop(profile);if(!initialized)return null;
 const workshop=encodeWorkshop(initialized.workshop);return workshop===null?null:{...initialized,workshop};
}
export function applyWireWorkshopCommand(profile,command){
 if(!profile||typeof profile!=='object'||Array.isArray(profile))return null;
 const workshop=decodeWorkshop(profile.workshop);if(!workshop)return null;
 const result=applyWorkshopCommand({...profile,workshop},command);if(!result)return null;
 const encoded=encodeWorkshop(result.workshop);return encoded===null?null:{...result,workshop:encoded};
}

// Melt: strip every prestige trophy from a workshop. The trophies were retired
// into the act relics (see relics.mjs), so an old save keeps its story progress
// and loses the equipable gear: owned ids are removed, taken trophies leave the
// loadout and their mod entry is dropped. A workshop that cannot be read is
// left untouched rather than blocking anything.
function meltWorkshop(workshop){
 const owned=workshop.owned.filter(id=>!isPrestige(id));
 const equipped=workshop.equipped.filter(id=>owned.includes(id));
 const mods={...workshop.mods};
 for(const id of Object.keys(mods))if(isPrestige(id))delete mods[id];
 const next={...workshop,owned,equipped,mods};
 return validateWorkshop(next)?next:null;
}
// Campaign completion writes story progress and melts the retired trophies in
// the same transaction, so finishing a mission can never resurrect old gear.
export function completeStoryMission(profile,missionId){
 if(!profile||typeof profile!=='object'||Array.isArray(profile)||typeof missionId!=='string')return null;
 const next=completeStory(profile,missionId);
 if(!next||!Object.hasOwn(next,'workshop'))return next;
 const workshop=decodeWorkshop(next.workshop);
 if(!workshop)return next;
 const melted=meltWorkshop(workshop);
 if(!melted)return next;
 const encoded=encodeWorkshop(melted);
 return encoded===null||encoded===next.workshop?next:{...next,workshop:encoded};
}
// Account sync: melt leftover trophies without touching story progress.
export function meltPrestige(profile){
 if(!profile||typeof profile!=='object'||Array.isArray(profile)||!Object.hasOwn(profile,'workshop'))return profile;
 const workshop=decodeWorkshop(profile.workshop);
 if(!workshop)return profile;
 const melted=meltWorkshop(workshop);
 if(!melted)return profile;
 const encoded=encodeWorkshop(melted);
 return encoded===null||encoded===profile.workshop?profile:{...profile,workshop:encoded};
}
// A prestige trophy goes away for good; the scrap it cost is not refunded.
export {meltWorkshop};
export {RECIPES,MOD_SCRAP,slotOf,toggleEquipped} from './workshop-model.mjs?v=20261125-aim15';

// ---- co-op match loadout wire (protocol 2, taken list) ----
export function encodeMatchLoadout(snapshot){
 if(!snapshot||snapshot.version!==1||!Array.isArray(snapshot.items)||snapshot.items.length>50)return null;
 const items=snapshot.items.map(item=>{
  if(!item||typeof item.id!=='string'||!(item.mod===null||typeof item.mod==='string'))return null;
  return [item.id,item.mod];
 });
 if(items.some(item=>item===null))return null;
 const text=JSON.stringify([2,snapshot.mode,items]);
 return text.length<=2000?text:null;
}
export function decodeMatchLoadout(text){
 if(typeof text!=='string'||text.length>2000)return null;let value;
 try{value=JSON.parse(text);}catch{return null;}
 if(!Array.isArray(value)||value.length!==3||value[0]!==2||typeof value[1]!=='string'||!Array.isArray(value[2]))return null;
 const items=value[2].map(pair=>{
  if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string'||!(pair[1]===null||typeof pair[1]==='string'))return null;
  return {id:pair[0],mod:pair[1]};
 });
 if(items.some(item=>item===null))return null;
 return {version:1,mode:value[1],items,relics:null};
}
