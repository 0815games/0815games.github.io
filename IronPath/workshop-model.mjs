// Pure workshop data model: validation and crafting rules, no Firebase, combat
// or account imports. Live callers are the armory view and the account
// transaction service; safety lives in the rules and the receipts there.
import {ITEMS,readArmory} from './armory.mjs?v=20261107-balance1';
import {PRESTIGE,isPrestige} from './prestige.mjs?v=20261210-actiii1';
const slots=['weapon','gear','gadget'];
const legacySlots=['gadget','gear','gear','gadget','gadget','gear','gadget','gadget','gadget','gadget'];
// One price source for both the reducer and the UI, so a re-tune cannot drift.
export const MOD_SCRAP=60;
export const RECIPES=Object.freeze({
 // Provisional playtest costs: roughly eleven completed waves for a component
 // item and four for boots, so crafting stays a goal.
 marksman:{slot:'weapon',scrap:150,components:1,mods:['precision','quick']},
 mechanic:{slot:'gear',scrap:150,components:1,mods:['tools','lightweight']},
 radio:{slot:'gadget',scrap:150,components:1,mods:['efficient','extended']},
 boots:{slot:'gear',scrap:50,components:0,mods:['lightweight']},
});
const neutral={weapon:'standard',gear:'none',gadget:'none'};
export function validLegacy(value){if(value==null)return true;if(typeof value!=='object'||Array.isArray(value))return false;const a=readArmory(value);return ['scrap','fortify','plating','repair','gun','supply','safeguard','owned','equipped'].every(k=>value[k]===undefined||value[k]===a[k]);}
function owned(w,id){if(id==='standard'||id==='none')return true;return w.owned.includes(id);}
function slotOf(id){if(id==='standard')return 'weapon';if(id==='none')return null;if(Object.hasOwn(RECIPES,id))return RECIPES[id].slot;if(isPrestige(id))return PRESTIGE[id].slot;const match=/^legacy-([1-9]|10)$/.exec(id);return match?legacySlots[Number(match[1])-1]:null;}
export function validateWorkshop(w){
 if(!w||w.version!==1||!Number.isSafeInteger(w.components)||w.components<0||w.components>1000000||!Array.isArray(w.owned)||w.owned.length>100||new Set(w.owned).size!==w.owned.length||!w.equipped||!w.mods||typeof w.mods!=='object'||Array.isArray(w.mods))return false;
 if(w.owned.some(id=>typeof id!=='string'||!slotOf(id)))return false;
 if(!slots.every(slot=>typeof w.equipped[slot]==='string'&&owned(w,w.equipped[slot])&&(w.equipped[slot]==='none'&&slot!=='weapon'||slotOf(w.equipped[slot])===slot)))return false;
 return Object.entries(w.mods).every(([id,mod])=>owned(w,id)&&(isPrestige(id)?Object.hasOwn(PRESTIGE[id].mods,mod):RECIPES[id]?.mods.includes(mod)));
}
export function migrateWorkshop(armory){
 if(!validLegacy(armory))return null;const a=readArmory(armory),ownedItems=ITEMS.flatMap((_,i)=>(a.owned&(1<<i))?[`legacy-${i+1}`]:[]),equipped={...neutral};if(a.equipped)equipped[legacySlots[a.equipped-1]]=`legacy-${a.equipped}`;
 return {version:1,components:0,owned:ownedItems,equipped,mods:{}};
}
// Award a mission trophy. Idempotent and free: it grants an item the campaign has
// already proven, and refuses anything that is not a prestige item. The caller
// must still verify the mission is complete against the profile it is writing.
export function unlockPrestige(workshop,id){
 if(!isPrestige(id)||!validateWorkshop(workshop)||owned(workshop,id))return null;
 return {...workshop,owned:[...workshop.owned,id]};
}
// All operations return a fresh value or null; the caller must run them inside
// a transaction against the latest account, never on a cached balance.
export function craftWorkshop(armory,workshop,id){
 const recipe=Object.hasOwn(RECIPES,id)?RECIPES[id]:null;if(!recipe||!validLegacy(armory)||!validateWorkshop(workshop)||owned(workshop,id))return null;const a=readArmory(armory);if(a.scrap<recipe.scrap||workshop.components<recipe.components)return null;
 return {armory:{...a,scrap:a.scrap-recipe.scrap},workshop:{...workshop,components:workshop.components-recipe.components,owned:[...workshop.owned,id]}};
}
export function equipWorkshop(workshop,slot,id){
 if(!validateWorkshop(workshop)||!slots.includes(slot)||!owned(workshop,id)||!(id==='none'&&slot!=='weapon'||slotOf(id)===slot))return null;
 return {...workshop,equipped:{...workshop.equipped,[slot]:id}};
}
const modsOf=id=>isPrestige(id)?Object.keys(PRESTIGE[id].mods):(RECIPES[id]?.mods??[]);
export {modsOf};
export function modifyWorkshop(armory,workshop,id,mod){
 const cost=MOD_SCRAP;if(!validLegacy(armory)||!validateWorkshop(workshop)||!owned(workshop,id)||!modsOf(id).includes(mod)||workshop.mods[id]===mod)return null;const a=readArmory(armory);if(a.scrap<cost)return null;
 return {armory:{...a,scrap:a.scrap-cost},workshop:{...workshop,mods:{...workshop.mods,[id]:mod}}};
}
