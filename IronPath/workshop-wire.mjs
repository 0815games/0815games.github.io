// RTDB-safe wire format for the workshop stored on production accounts. The
// single string preserves empty arrays/objects that RTDB removes as nodes.
// Writes require the published workshop rules (see
// firebase/WORKSHOP-RULES-TO-PUBLISH.json); without them saves are rejected
// and the legacy path keeps working.
import {validateWorkshop} from './workshop-model.mjs?v=20261215-winter1';
import {initializeWorkshop,applyWorkshopCommand} from './workshop-transactions.mjs?v=20261215-winter1';
import {isPrestige} from './prestige.mjs?v=20261215-winter1';
import {completeStory} from './campaign.mjs?v=20261215-winter1';
const LIMIT=2048;
const exactKeys=(value,keys)=>value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).length===keys.length && keys.every(k=>Object.hasOwn(value,k));

// Reject unknown fields rather than accidentally discarding a future extension.
export function encodeWorkshop(value){
 if(!exactKeys(value,['version','components','owned','equipped','mods'])||!exactKeys(value.equipped,['weapon','gear','gadget'])||!validateWorkshop(value))return null;
 const mods=Object.entries(value.mods).sort(([a],[b])=>a<b?-1:a>b?1:0);
 const text=JSON.stringify([1,value.components,[...value.owned],[value.equipped.weapon,value.equipped.gear,value.equipped.gadget],mods]);
 return text.length<=LIMIT?text:null;
}
export function decodeWorkshop(text){
 if(typeof text!=='string'||text.length>LIMIT)return null;
 let value;try{value=JSON.parse(text);}catch{return null;}
 if(!Array.isArray(value)||value.length!==5||value[0]!==1||!Array.isArray(value[2])||!Array.isArray(value[3])||value[3].length!==3||!Array.isArray(value[4]))return null;
 const mods=Object.create(null);
 for(const pair of value[4]){
  if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string'||typeof pair[1]!=='string'||Object.hasOwn(mods,pair[0]))return null;
  mods[pair[0]]=pair[1];
 }
 const result={version:1,components:value[1],owned:value[2],equipped:{weapon:value[3][0],gear:value[3][1],gadget:value[3][2]},mods};
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
// and loses the equipable gear: owned ids are removed, an equipped trophy is
// replaced by the slot's neutral item and its mod entry is dropped. A workshop
// that cannot be read is left untouched rather than blocking anything.
function meltWorkshop(workshop){
 const owned=workshop.owned.filter(id=>!isPrestige(id));
 const equipped={...workshop.equipped};
 for(const slot of ['weapon','gear','gadget'])if(isPrestige(equipped[slot]))equipped[slot]=slot==='weapon'?'standard':'none';
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
