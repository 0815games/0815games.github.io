import {soldierProfile} from '../core/soldier-profile.mjs?v=20261121-menu1';
import {characterProgress} from '../core/progression.mjs?v=20261105-prestige1';
import {renderRankInsignia,rankForLevel,rankTooltip} from '../core/rank-insignia.mjs?v=20261121-menu1';
import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
import {decodeWorkshop} from '../workshop/workshop-wire.mjs?v=20261121-menu1';
import {slotOf,RECIPES} from '../workshop/workshop-model.mjs?v=20261121-menu1';
import {WORKSHOP_CATALOG} from '../workshop/workshop-catalog.mjs?v=20261108-balance2';
import {PRESTIGE,PRESTIGE_IDS,isPrestige,prestigeEarned} from '../core/prestige.mjs?v=20261112-pressure1';
import {CAMPAIGN} from '../core/campaign.mjs?v=20261112-pressure1';
import {readArmory,ITEMS} from '../core/armory.mjs?v=20261121-menu1';
import {artOf} from './item-art.mjs?v=20261121-menu1';
// The Field Dossier is the character hub: the soldier stands between her
// three loadout slots (paper doll), each card names what she wears and opens
// an inline picker. Every change goes through the account workshop service -
// this screen never writes a save itself.
// The dossier shows five anatomical places around the figure: the weapon in
// her hand, the vest on her chest, boots at her feet, spare gear at the hip
// and the gadgets along the belt. The mechanics stay three-slot (slotOf) —
// the split is presentation only, and every place opens its slot's picker.
const PLACE_BUTTONS={weapon:'soldierSlotWeapon',vest:'soldierSlotVest',boots:'soldierSlotBoots',gear:'soldierSlotGear',gadget:'soldierSlotGadget'};
const PLACE_SLOT={weapon:'weapon',vest:'gear',boots:'gear',gear:'gear',gadget:'gadget'};
// Which anatomical place wears this piece. Presentation only — the equip
// mechanics still go through slotOf (weapon/gear/gadget), never this.
function placeOf(id){
 const slot=slotOf(id);
 if(slot==='weapon')return 'weapon';
 if(slot==='gadget')return 'gadget';
 if(id==='legacy-3'||id==='boots')return 'boots';
 if(id==='legacy-2'||id==='prestige-convoy-plate')return 'vest';
 return 'gear';
}
export function createSoldierScreen({document,getProfile,translate:tr,getPortrait=null,onArmory,onSkills,workshopService=null,onProfile=()=>{}}){
 const $=id=>document.getElementById(id),dialog=$('soldierDialog');
 let openSlot=null,working=false,status='';
 // Inventory board state: category tab, search text and the selected cell.
 let invFilter='all',invQuery='',invSelected=null;
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
 // The26-piece catalogue: ten legacy finds, four recipes, twelve trophies.
 // Ownership and the worn flag merge the old armory bits with the workshop
 // taken list, so every source of truth shows on the board (presentation only).
 function catalogue(data,workshop){
  const cells=[];
  for(const item of data.inventory){
   const id=`legacy-${item.id}`;
   cells.push({id,slot:slotOf(id),owned:item.owned||!!workshop?.owned?.includes(id),equipped:!!(item.equipped||workshop?.equipped?.includes(id))});
  }
  for(const id of Object.keys(RECIPES))cells.push({id,slot:slotOf(id),owned:!!workshop?.owned?.includes(id),equipped:!!workshop?.equipped?.includes(id)});
  for(const id of PRESTIGE_IDS)cells.push({id,slot:slotOf(id),owned:!!workshop?.owned?.includes(id),equipped:!!workshop?.equipped?.includes(id)});
  return cells;
 }
 // A missing piece says where it comes from — waves, workshop or campaign.
 function sourceHint(cell,profile){
  if(cell.id.startsWith('legacy-'))return tr('Found on completed waves — the report offers the piece.');
  if(isPrestige(cell.id)){
   if(!prestigeEarned(cell.id,profile))return tr('Locked · finish “{mission}”',{mission:tr(CAMPAIGN.find(m=>m.id===PRESTIGE[cell.id].mission)?.title||'')});
   return tr('Earned. Reopen the workshop to collect it.');
  }
  return tr('Craft it in the Armory workshop.');
 }
 function renderDetails(cells){
  const box=$('soldierItemDetails');
  const cell=cells.find(c=>c.id===invSelected)||cells[0];
  if(!cell){box.hidden=true;box.replaceChildren();return;}
  box.hidden=false;box.replaceChildren();
  const artBox=el('div','soldier-details-art');
  const art=artOf(cell.id);
  if(art){const img=el('img','');img.src=art;img.alt='';artBox.append(img);}
  box.append(artBox);
  const body=el('div','soldier-details-body');
  body.append(el('span','soldier-details-kicker',tr('ITEM DETAILS')));
  body.append(el('strong','soldier-details-name',itemName(cell.id)));
  body.append(el('span','soldier-details-type',tr('Type: {slot}',{slot:cell.slot.toUpperCase()})));
  body.append(el('span','soldier-details-status'+(cell.owned?' is-owned':' is-locked'),cell.owned?tr(cell.equipped?'EQUIPPED':'UNLOCKED'):tr('NOT OWNED')));
  body.append(el('p','soldier-details-effect',itemEffect(cell.id)));
  if(cell.owned){
   const action=el('button',cell.equipped?'is-secondary':'',cell.equipped?tr('TAKEN'):tr('TAKE'));
   action.type='button';action.disabled=working;
   // Same toggle as the slot picker: one command, never a silent swap.
   action.onclick=()=>{void equip(cell.id);};
   body.append(action);
  }else body.append(el('p','soldier-details-hint',sourceHint(cell,getProfile())));
  box.append(body);
 }
 // The inventory board: tab + search filtered cells, every piece of the26.
 function renderInventory(data,workshop){
  const cells=catalogue(data,workshop);
  $('soldierCollectionEmpty').hidden=cells.some(c=>c.owned);
  const query=invQuery.trim().toLowerCase();
  const visible=cells.filter(c=>(invFilter==='all'||c.slot===invFilter)&&(!query||itemName(c.id).toLowerCase().includes(query)));
  if(!cells.some(c=>c.id===invSelected))invSelected=(cells.find(c=>c.owned)||cells[0])?.id||null;
  for(const [filter,id] of Object.entries({all:'soldierInvTabAll',weapon:'soldierInvTabWeapon',gear:'soldierInvTabGear',gadget:'soldierInvTabGadget'}))
   $(id).setAttribute('aria-pressed',String(invFilter===filter));
  const list=$('soldierCollectionList');list.replaceChildren();
  for(const cell of visible){
   const row=document.createElement('li'),button=document.createElement('button');
   row.className='soldier-collection-item';
   button.type='button';
   button.className='soldier-cell'+(cell.owned?' is-owned':' is-locked')+(cell.equipped?' is-equipped':'')+(cell.id===invSelected?' is-selected':'');
   button.setAttribute('aria-pressed',String(cell.id===invSelected));
   button.setAttribute('aria-label',`${itemName(cell.id)}${cell.equipped?` · ${tr('EQUIPPED')}`:''}`);
   button.title=itemName(cell.id);
   const art=artOf(cell.id);
   if(art){const img=document.createElement('img');img.className='soldier-cell-art';img.src=art;img.alt='';button.append(img);}
   button.onclick=()=>{invSelected=cell.id;render();};
   row.append(button);list.append(row);
  }
  renderDetails(cells);
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
   const art=artOf(id);
   if(art){const img=el('img','soldier-choice-art');img.src=art;img.alt='';row.append(img);}
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
  // The paper doll: five anatomical places around the portrait, plus the
  // legacy one-slot note for gear that still counts from the old armory.
  const workshop=workshopOf(profile);
  for(const [place,buttonId] of Object.entries(PLACE_BUTTONS)){
   // Every worn piece of this place shows on its card at once — the old
   // one-item-per-slot limit is gone (IPL-0137).
   const worn=workshop?workshop.equipped.filter(id=>placeOf(id)===place):[];
   $(buttonId+'Name').textContent=worn.length?worn.map(itemName).join(' · '):tr('NOTHING TAKEN');
   $(buttonId+'Effect').textContent=worn.length?worn.map(itemEffect).filter(Boolean).join(' '):'';
   // The place shows the artwork of what she wears; empty places stay text.
   const artNode=$(buttonId+'Art'),artId=worn.find(id=>artOf(id));
   if(artId){artNode.src=artOf(artId);artNode.hidden=false;}else{artNode.hidden=true;artNode.removeAttribute?.('src');}
   $(buttonId).setAttribute('aria-expanded',String(openSlot===PLACE_SLOT[place]));
  }
  $('soldierInventoryCount').textContent=tr('{count} pieces owned',{count:workshop?workshop.owned.length:0});
  const armory=readArmory(profile.armory),legacyItem=armory.equipped?ITEMS[armory.equipped-1]:null;
  $('soldierLegacyNote').hidden=!legacyItem;
  if(legacyItem)$('soldierLegacyNote').textContent=tr('Existing equipment: {name} - still counts in your combat profile.',{name:tr(legacyItem.name)});
  renderPicker(workshop);
  renderInventory(data,workshop);
 }
 function close(){if(dialog.open)dialog.close();}
 for(const [filter,id] of Object.entries({all:'soldierInvTabAll',weapon:'soldierInvTabWeapon',gear:'soldierInvTabGear',gadget:'soldierInvTabGadget'}))
  $(id).onclick=()=>{invFilter=filter;render();};
 $('soldierInventorySearch').oninput=event=>{invQuery=event.target?event.target.value||'':'';render();};
 for(const [place,buttonId] of Object.entries(PLACE_BUTTONS)){
  const slot=PLACE_SLOT[place],button=$(buttonId);
  button.onclick=()=>{if(openSlot===slot)openSlot=null;else openSlot=slot;status='';render();};
  button.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();button.onclick();}};
 }
 $('soldierClose').onclick=close;$('soldierArmory').onclick=()=>{close();onArmory();};$('soldierSkills').onclick=()=>{close();onSkills();};dialog.addEventListener('cancel',e=>{e.preventDefault();close();});bindDialogBackdrop(dialog,close);
 return {open(){if(!getProfile())return;openSlot=null;invFilter='all';invQuery='';invSelected=null;$('soldierInventorySearch').value='';render();if(!dialog.open)dialog.showModal();},refresh(){if(dialog.open)render();},close};
}
