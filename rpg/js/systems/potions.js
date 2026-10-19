export function consumePotion(player,index,items,removeItem,healingRank=0){
 const entry=player?.inventory?.[index],item=entry&&items[entry.id];
 if(!Number.isInteger(index)||index<0||!entry||!Number.isSafeInteger(entry.count)||entry.count<1||item?.type!=='potion'||!['hp','mp'].includes(item.effect)||!Number.isFinite(item.val)||item.val<=0)return false;
 const key=item.effect,maximum=key==='hp'?player.maxHp:player.maxMp;
 if(!Number.isFinite(player[key])||!Number.isFinite(maximum))return false;
 const amount=key==='hp'?Math.floor(item.val*(1+.2*healingRank)):item.val;
 const inventory=player.inventory.map(x=>x&&({...x}));
 if(!removeItem(inventory,entry.id,1))return false;
 player.inventory=inventory;player[key]=Math.min(maximum,player[key]+amount);return true;
}
export function battlePotion(state,id,useItem,enemyTurn){
 if(!state.inCombat||!state.activeMonster||!(state.player?.hp>0)||!['health_potion','mana_potion'].includes(id))return false;
 const index=(state.player.inventory||[]).findIndex(x=>x?.id===id&&Number.isSafeInteger(x.count)&&x.count>0);
 if(index<0||useItem(index)!==true)return false;
 enemyTurn();return true;
}
