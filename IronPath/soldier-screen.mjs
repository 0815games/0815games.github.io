import {soldierProfile} from './soldier-profile.mjs?v=20261105-soldier1';
import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
export function createSoldierScreen({document,getProfile,translate:tr,onArmory,onSkills}){
 const $=id=>document.getElementById(id),dialog=$('soldierDialog');
 function render(){const profile=getProfile();if(!profile)return;const data=soldierProfile(profile);
  $('soldierNameDisplay').textContent=data.name;$('soldierLevelDisplay').textContent=tr('LEVEL {level}',{level:data.level});$('soldierPortrait').src=data.gender==='male'?'assets/soldier-male.jpg':'assets/soldier-female.jpg';
  $('soldierAbility').textContent=tr(data.ability);$('soldierDamage').textContent=String(data.damage);$('soldierRange').textContent=String(data.range);$('soldierMovement').textContent=String(data.movement);$('soldierCooldown').textContent=data.cooldown===null?'—':tr('{seconds} s',{seconds:data.cooldown});
  $('soldierEquipped').textContent=data.equipment?tr(data.equipment.name):tr('No equipment');$('soldierEquippedEffect').textContent=data.equipment?tr(data.equipment.description):tr('Choose an item in the Armory.');$('soldierInventoryCount').textContent=tr('{owned} / {total} owned',{owned:data.inventory.filter(i=>i.owned).length,total:data.inventory.length});
 }
 function close(){if(dialog.open)dialog.close();}
 $('soldierClose').onclick=close;$('soldierArmory').onclick=()=>{close();onArmory();};$('soldierSkills').onclick=()=>{close();onSkills();};dialog.addEventListener('cancel',e=>{e.preventDefault();close();});bindDialogBackdrop(dialog,close);
 return {open(){if(!getProfile())return;render();if(!dialog.open)dialog.showModal();},refresh(){if(dialog.open)render();},close};
}
