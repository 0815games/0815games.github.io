// Experimental RTDB-safe wire format, not used by production accounts.
// The single string preserves empty arrays/objects that RTDB removes as nodes.
// Rules must be reviewed before this field can be written to production.
import {validateWorkshop} from './workshop-model.mjs';
import {initializeWorkshop,applyWorkshopCommand} from './workshop-transactions.mjs';
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
