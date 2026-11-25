import {soldierProfile} from '../core/soldier-profile.mjs?v=20261121-fund1';
import {characterProgress} from '../core/progression.mjs?v=20261105-prestige1';
import {renderRankInsignia,rankForLevel,rankTooltip} from '../core/rank-insignia.mjs?v=20261121-fund1';
import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
import {decodeWorkshop} from '../workshop/workshop-wire.mjs?v=20261121-fund1';
import {slotOf} from '../workshop/workshop-model.mjs?v=20261121-fund1';
import {WORKSHOP_CATALOG} from '../workshop/workshop-catalog.mjs?v=20261108-balance2';
import {PRESTIGE,isPrestige} from '../core/prestige.mjs?v=20261112-pressure1';
import {readArmory,ITEMS} from '../core/armory.mjs?v=20261121-fund1';
// The Field Dossier is the character hub: the soldier stands between her
// three loadout slots (paper doll), each card names what she wears and opens
// an inline picker. Every change goes through the account workshop service -
// this screen never writes a save itself.
const SLOTS=['gear','weapon','gadget'];
const SLOT_BUTTONS={gear:'soldierSlotGear',weapon:'soldierSlotWeapon',gadget:'soldierSlotGadget'};
export function createSoldierScreen({document,getProfile,translate:tr,getPortrait=null,onArmory,onSkills,workshopService=null,onProfile=()=>{}}){
 const $=id=>document.getElementById(id),dialog=$('soldierDialog');
 let openSlot=null,working=false,status='';
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
 const itemName=id=>{
  if(id==='standard')return tr('Standard weapon');
  if(id==='none')return tr('Empty slot');
  if(id.startsWith('legacy-'))return tr(ITEMS[Number(id.slice(7))-1]?.name||'Unknown item');
  if(isPrestige(id))return tr(PRESTIGE[id].name);
  return tr(WORKSHOP_CATALOG[id]?.name||'Unknown item');
 };
 const itemEffect=id=>{
  if(id==='standard'||id==='none')return '';
  if(id.startsWith('legacy-'))return tr(ITEMS[Number(id.slice(7))-1]?.description||'');
  if(isPrestige(id))return tr(PRESTIGE[id].effect||'');
  return tr(WORKSHOP_CATALOG[id]?.effect||'');
 };
 const workshopOf=profile=>profile&&profile.workshop?decodeWorkshop(profile.workshop):null;
 const statusLine=()=>{const line=el('p','',status);line.setAttribute('role','status');return line;};
 async function equip(item){
  if(!workshopService||working)return;
  working=true;status=tr('Saving…');render();
  try{
   // IPL-0137: the equip command is a toggle on the taken list — the slot
   // argument is gone because taking one piece never touches another.
   const result=await workshopService.command({type:'equip',item});
   if(result.status==='saved'){onProfile(result.profile);status=tr('Saved for your next match.');}
   else if(result.status==='locked')status=tr('Finish the match and leave the party before changing gear.');
   else status=tr('Workshop could not be saved. Check your connection and try again.');
  }catch{status=tr('Workshop could not be saved. Check your connection and try again.');}
  finally{working=false;render();}
 }
 function renderPicker(workshop){
  const box=$('soldierSlotPicker');
  if(!openSlot){box.hidden=true;box.replaceChildren();return;}
  box.hidden=false;box.replaceChildren();
  box.append(el('h4','',tr('CHANGE {slot}',{slot:openSlot.toUpperCase()})));
  if(!workshop){
   box.append(el('p','',tr('Open the Armory workshop once to prepare your loadout.')));
   box.append(statusLine());return;
  }
  // Toggle list: worn pieces read TAKEN and take the press to remove; the
  // rest read TAKE. Nothing here can displace another slot's gear (IPL-0137).
  const taken=workshop.equipped,candidates=workshop.owned.filter(id=>slotOf(id)===openSlot);
  if(!candidates.length)box.append(el('p','',tr('No gear for this slot yet. Craft it in the Armory workshop.')));
  for(const id of candidates){
   const isTaken=taken.includes(id),row=el('div','soldier-slot-choice');
   row.append(el('strong','',itemName(id)));
   const button=el('button',isTaken?'is-secondary':'',isTaken?tr('TAKEN'):tr('TAKE'));
   button.type='button';button.disabled=working;
   // The picker stays open through the save so the status line is readable.
   button.onclick=()=>{void equip(id);};
   row.append(button);box.append(row);
  }
  box.append(statusLine());
 }
 function render(){const profile=getProfile();if(!profile)return;const data=soldierProfile(profile);
  $('soldierNameDisplay').textContent=data.name;$('soldierLevelDisplay').textContent=tr('LEVEL {level}',{level:data.level});const rank=rankForLevel(data.level);renderRankInsignia(document,$('soldierRank'),{level:data.level},{size:30});$('soldierRankName').textContent=tr(rank.name);$('soldierRank').title=rankTooltip(data.level);$('soldierPortrait').src=(typeof getPortrait==='function'?getPortrait():null)||(data.gender==='male'?'assets/soldier-male.jpg':'assets/soldier-female.jpg');
  $('soldierAbility').textContent=data.classId&&data.className?`${tr(data.className)} · ${tr(data.ability)}`:tr(data.ability);
  const progress=characterProgress(profile.xp||0);$('soldierXpBar').value=progress.current;$('soldierXpBar').max=progress.required;$('soldierXpText').textContent=`${progress.current} / ${progress.required} XP`;$('soldierDamage').textContent=String(data.damage);$('soldierRange').textContent=String(data.range);$('soldierMovement').textContent=String(data.movement);$('soldierCooldown').textContent=data.cooldown===null?'—':tr('{seconds} s',{seconds:data.cooldown});
  // The paper doll: three slot cards around the portrait, plus the legacy
  // one-slot note for gear that still counts from the old armory.
  const workshop=workshopOf(profile);
  for(const slot of SLOTS){
   const buttonId=SLOT_BUTTONS[slot];
   // Every worn piece of this category shows on its card at once — the old
   // one-item-per-slot limit is gone (IPL-0137).
   const worn=workshop?workshop.equipped.filter(id=>slotOf(id)===slot):[];
   $(buttonId+'Name').textContent=worn.length?worn.map(itemName).join(' · '):tr('NOTHING TAKEN');
   $(buttonId+'Effect').textContent=worn.length?worn.map(itemEffect).filter(Boolean).join(' '):'';
   $(buttonId).setAttribute('aria-expanded',String(openSlot===slot));
  }
  $('soldierInventoryCount').textContent=tr('{count} pieces owned',{count:workshop?workshop.owned.length:0});
  const armory=readArmory(profile.armory),legacyItem=armory.equipped?ITEMS[armory.equipped-1]:null;
  $('soldierLegacyNote').hidden=!legacyItem;
  if(legacyItem)$('soldierLegacyNote').textContent=tr('Existing equipment: {name} - still counts in your combat profile.',{name:tr(legacyItem.name)});
  renderPicker(workshop);
  const items=data.inventory.filter(item=>item.owned),list=$('soldierCollectionList');$('soldierCollectionEmpty').hidden=items.length>0;list.replaceChildren();for(const item of items){const row=document.createElement('li'),heading=document.createElement('div'),name=document.createElement('strong'),statusTag=document.createElement('span'),effect=document.createElement('p');row.className='soldier-collection-item';if(item.equipped)row.classList.add('is-equipped');name.textContent=tr(item.name);statusTag.textContent=tr(item.equipped?'EQUIPPED':'UNLOCKED');heading.append(name,statusTag);effect.textContent=tr(item.description);row.append(heading,effect);list.append(row);}
 }
 function close(){if(dialog.open)dialog.close();}
 for(const slot of SLOTS){
  const button=$(SLOT_BUTTONS[slot]);
  button.onclick=()=>{if(openSlot===slot)openSlot=null;else openSlot=slot;status='';render();};
  button.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();button.onclick();}};
 }
 $('soldierClose').onclick=close;$('soldierArmory').onclick=()=>{close();onArmory();};$('soldierSkills').onclick=()=>{close();onSkills();};dialog.addEventListener('cancel',e=>{e.preventDefault();close();});bindDialogBackdrop(dialog,close);
 return {open(){if(!getProfile())return;openSlot=null;render();if(!dialog.open)dialog.showModal();},refresh(){if(dialog.open)render();},close};
}
