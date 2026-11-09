// Transaction reducers for the production workshop account. Call only inside
// a transaction using its current profile, not a cached copy.
import {migrateWorkshop,validateWorkshop,craftWorkshop,equipWorkshop,modifyWorkshop,validLegacy} from './workshop-model.mjs?v=20261217-stormgate';

function validProfile(profile){
 return profile && typeof profile==='object' && !Array.isArray(profile) && validLegacy(profile.armory);
}
// Explicit one-time migration. Never replace an existing, malformed or newer
// workshop. Unknown fields in the rest of the account are preserved.
export function initializeWorkshop(profile){
 if(!validProfile(profile)||Object.hasOwn(profile,'workshop'))return null;
 const workshop=migrateWorkshop(profile.armory);
 return workshop?{...profile,workshop}:null;
}
// Costs, ownership and selected modification are checked against the latest
// state together. A failed command returns null; no partial debit is possible.
export function applyWorkshopCommand(profile,command){
 if(!validProfile(profile)||!validateWorkshop(profile.workshop)||!command||typeof command!=='object'||Array.isArray(command))return null;
 if(command.type==='craft'){
  const result=craftWorkshop(profile.armory,profile.workshop,command.item);
  return result?{...profile,...result}:null;
 }
 if(command.type==='modify'){
  const result=modifyWorkshop(profile.armory,profile.workshop,command.item,command.mod);
  return result?{...profile,...result}:null;
 }
 if(command.type==='equip'){
  const workshop=equipWorkshop(profile.workshop,command.slot,command.item);
  return workshop?{...profile,workshop}:null;
 }
 return null;
}
