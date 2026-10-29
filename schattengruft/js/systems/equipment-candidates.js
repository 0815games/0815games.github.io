const slots=new Set(['head','body','mainhand','offhand','feet','ring']);
export function equipmentCandidates(inventory,slot,items){
 if(!Array.isArray(inventory)||!slots.has(slot)||!items||typeof items!=='object')return [];
 const result=[];
 inventory.forEach((entry,index)=>{
  if(!entry||typeof entry.id!=='string'||!Number.isSafeInteger(entry.count)||entry.count<1||!Object.prototype.hasOwnProperty.call(items,entry.id))return;
  const item=items[entry.id];
  if(!item||item.slot!==slot)return;
  result.push({index,entry,id:entry.id,count:entry.count,name:String(item.name||entry.id)+(item.slot?` · Lv. ${item.minLevel??1}`:'')+(item.heroClass?` · ${{warrior:'Krieger',mage:'Magier',rogue:'Schurke'}[item.heroClass]||item.heroClass}`:''),icon:String(item.icon||'📦')});
 });
 return result;
}
