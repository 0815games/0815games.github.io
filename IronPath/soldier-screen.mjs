import {soldierProfile} from './soldier-profile.mjs?v=20261112-tagless1';
import {characterProgress} from './progression.mjs?v=20261105-prestige1';
import {renderRankInsignia,rankForLevel,rankTooltip} from './rank-insignia.mjs?v=20261031-rank1';
import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
export function createSoldierScreen({document,getProfile,translate:tr,getPortrait=null,onArmory,onSkills}){
 const $=id=>document.getElementById(id),dialog=$('soldierDialog');
 function render(){const profile=getProfile();if(!profile)return;const data=soldierProfile(profile);
  $('soldierNameDisplay').textContent=data.name;$('soldierLevelDisplay').textContent=tr('LEVEL {level}',{level:data.level});const rank=rankForLevel(data.level);renderRankInsignia(document,$('soldierRank'),{level:data.level},{size:30});$('soldierRankName').textContent=tr(rank.name);$('soldierRank').title=rankTooltip(data.level);$('soldierPortrait').src=(typeof getPortrait==='function'?getPortrait():null)||(data.gender==='male'?'assets/soldier-male.jpg':'assets/soldier-female.jpg');
  $('soldierAbility').textContent=tr(data.ability);
  const progress=characterProgress(profile.xp||0);$('soldierXpBar').value=progress.current;$('soldierXpBar').max=progress.required;$('soldierXpText').textContent=`${progress.current} / ${progress.required} XP`;$('soldierDamage').textContent=String(data.damage);$('soldierRange').textContent=String(data.range);$('soldierMovement').textContent=String(data.movement);$('soldierCooldown').textContent=data.cooldown===null?'—':tr('{seconds} s',{seconds:data.cooldown});
  $('soldierEquipped').textContent=data.equipment?tr(data.equipment.name):tr('No equipment');$('soldierEquippedEffect').textContent=data.equipment?tr(data.equipment.description):tr('Choose an item in the Armory.');$('soldierInventoryCount').textContent=tr('{owned} / {total} owned',{owned:data.inventory.filter(i=>i.owned).length,total:data.inventory.length});
  const items=data.inventory.filter(item=>item.owned),list=$('soldierCollectionList');$('soldierCollectionEmpty').hidden=items.length>0;list.replaceChildren();for(const item of items){const row=document.createElement('li'),heading=document.createElement('div'),name=document.createElement('strong'),status=document.createElement('span'),effect=document.createElement('p');row.className='soldier-collection-item';if(item.equipped)row.classList.add('is-equipped');name.textContent=tr(item.name);status.textContent=tr(item.equipped?'EQUIPPED':'UNLOCKED');heading.append(name,status);effect.textContent=tr(item.description);row.append(heading,effect);list.append(row);}
 }
 function close(){if(dialog.open)dialog.close();}
 $('soldierClose').onclick=close;$('soldierArmory').onclick=()=>{close();onArmory();};$('soldierSkills').onclick=()=>{close();onSkills();};dialog.addEventListener('cancel',e=>{e.preventDefault();close();});bindDialogBackdrop(dialog,close);
 return {open(){if(!getProfile())return;render();if(!dialog.open)dialog.showModal();},refresh(){if(dialog.open)render();},close};
}
