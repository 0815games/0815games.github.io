import { ITEMS } from '../data/items.js';
export const INVENTORY_LIMIT = 15;
const owns = id => typeof id === 'string' && Object.prototype.hasOwnProperty.call(ITEMS, id);
const stackLimit = id => owns(id) ? (ITEMS[id].stack ?? 1) : 0;
const fail = reason => ({ok:false,reason});
function validate(inv,id,count){
 if(!Array.isArray(inv))return 'INVALID_INVENTORY';
 if(!owns(id))return 'UNKNOWN_ITEM';
 if(!Number.isSafeInteger(count)||count<=0)return 'INVALID_COUNT';
 if(!Number.isSafeInteger(stackLimit(id))||stackLimit(id)<1)return 'INVALID_STACK_LIMIT';
 for(let i=0;i<inv.length;i++){
  const slot=inv[i];
  if(!slot||!owns(slot.id)||!Number.isSafeInteger(slot.count)||slot.count<1||!Number.isSafeInteger(stackLimit(slot.id))||stackLimit(slot.id)<1||slot.count>stackLimit(slot.id))return 'INVALID_INVENTORY';
 }
 return null;
}
export function tryAddItem(inv,id,count=1){
 const error=validate(inv,id,count);if(error)return fail(error);
 if(inv.length>INVENTORY_LIMIT)return fail('INVENTORY_FULL');
 const max=stackLimit(id),space=inv.reduce((sum,s)=>sum+(s.id===id?max-s.count:0),0)+(INVENTORY_LIMIT-inv.length)*max;
 if(count>space)return fail('INVENTORY_FULL');
 const next=inv.map(s=>({...s}));let remaining=count;
 for(const s of next){if(s.id!==id||remaining===0)continue;const amount=Math.min(max-s.count,remaining);s.count+=amount;remaining-=amount;}
 while(remaining>0){const amount=Math.min(max,remaining);next.push({id,count:amount});remaining-=amount;}
 inv.splice(0,inv.length,...next);return {ok:true};
}
export function tryRemoveItem(inv,id,count=1){
 const error=validate(inv,id,count);if(error)return fail(error);
 const available=inv.reduce((sum,s)=>sum+(s.id===id?s.count:0),0);
 if(count>available)return fail('INSUFFICIENT_ITEMS');
 const next=inv.map(s=>({...s}));let remaining=count;
 for(let i=next.length-1;i>=0&&remaining>0;i--){if(next[i].id!==id)continue;const amount=Math.min(next[i].count,remaining);next[i].count-=amount;remaining-=amount;if(next[i].count===0)next.splice(i,1);}
 inv.splice(0,inv.length,...next);return {ok:true};
}
export function addItem(inv,id,count=1){return tryAddItem(inv,id,count).ok;}
export function removeItem(inv,id,count=1){return tryRemoveItem(inv,id,count).ok;}
export function countItem(inv,id){return inv.filter(s=>s.id===id).reduce((sum,s)=>sum+s.count,0);}
export function sortInventory(inv){
 const order={potion:0,weapon:1,armor:2,shield:3,helmet:4,boots:5,ring:6,loot:7};
 inv.sort((a,b)=>(order[ITEMS[a.id]?.type]??9)-(order[ITEMS[b.id]?.type]??9)||a.id.localeCompare(b.id));
}
