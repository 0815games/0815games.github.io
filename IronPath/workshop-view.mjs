// Reusable player-facing workshop panel. The account app does not mount it yet:
// save rules and multiplayer version fencing are still required before rollout.
import {RECIPES,migrateWorkshop,validLegacy} from './workshop-model.mjs';
import {decodeWorkshop} from './workshop-wire.mjs';
import {readArmory,ITEMS} from './armory.mjs?v=20261102-longterm1';
import {WORKSHOP_CATALOG} from './workshop-catalog.mjs';
const slotKeys=['weapon','gear','gadget'];
export function createWorkshopView({document,root,getProfile,service,confirm,translate=key=>key,onProfile=()=>{}}){
 if(!document||!root||typeof getProfile!=='function'||!service||typeof confirm!=='function')throw new Error('Invalid workshop view');
 let working=false,status='';
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
 const tr=(text,values)=>translate(text,values);
 function name(id){if(id==='standard')return tr('Standard weapon');if(id==='none')return tr('Empty slot');if(id.startsWith('legacy-'))return tr(ITEMS[Number(id.slice(7))-1]?.name||'Unknown item');return tr(WORKSHOP_CATALOG[id]?.name||'Unknown item');}
 function button(label,disabled,action){const b=el('button','workshop-button',tr(label));b.type='button';b.disabled=disabled||working;b.onclick=action;return b;}
 async function run(command,confirmation){
  if(working)return;working=true;render();let result;
  try{if(confirmation&&!await confirm(confirmation))return;status=tr('Saving…');render();result=command?await service.command(command):await service.initialize();if(result.status==='saved'){onProfile(result.profile);status=tr('Saved for your next match.');}else status=tr('Workshop could not be saved. Check your connection and try again.');}catch{status=tr('Workshop could not be saved. Check your connection and try again.');}
  finally{working=false;render();}
 }
 function render(){
  const p=getProfile();root.replaceChildren();if(!p)return;
  const has=Object.hasOwn(p,'workshop'),w=validLegacy(p.armory)?(has?decodeWorkshop(p.workshop):migrateWorkshop(p.armory)):null;
  if(!w){root.append(el('p','workshop-error',tr('Workshop data is invalid or requires a newer version.')));return;}
  const armory=readArmory(p.armory),wallet=el('div','workshop-wallet');wallet.append(el('strong','',tr('{count} scrap',{count:armory.scrap})),el('strong','',tr('{count} boss components',{count:w.components})));root.append(wallet);
  if(!has){const note=el('section','workshop-intro');note.append(el('p','',tr('Prepare your workshop. Your existing equipment and bunker upgrades will be kept.')),button('PREPARE WORKSHOP',false,()=>run(null,{title:tr('Prepare workshop?'),text:tr('Your existing progress will be kept.'),accept:tr('PREPARE WORKSHOP')})));root.append(note);if(status){const message=el('p','workshop-status',status);message.setAttribute('role','status');root.append(message);}return;}
  const slots=el('section','workshop-slots');slots.append(el('h3','',tr('Equipped loadout')));const list=el('div','workshop-slot-grid');
  for(const slot of slotKeys){const card=el('div','workshop-slot');card.append(el('span','',tr(slot.toUpperCase())),el('strong','',name(w.equipped[slot])));if(w.equipped[slot]!== (slot==='weapon'?'standard':'none'))card.append(button('UNEQUIP',false,()=>run({type:'equip',slot,item:slot==='weapon'?'standard':'none'})));list.append(card);}slots.append(list);root.append(slots);
  const section=el('section','workshop-items');section.append(el('h3','',tr('Craft and equip')));const grid=el('div','workshop-item-grid');
  for(const [id,recipe] of Object.entries(RECIPES)){
   const data=WORKSHOP_CATALOG[id],owned=w.owned.includes(id),equipped=w.equipped[recipe.slot]===id,card=el('article','workshop-item');
   card.append(el('span','workshop-tag',tr(recipe.slot.toUpperCase())),el('h4','',tr(data.name)),el('p','',tr(data.effect)));
   if(!owned){card.append(el('small','',tr('{scrap} scrap · {components} boss components',{scrap:recipe.scrap,components:recipe.components})),button('CRAFT',armory.scrap<recipe.scrap||w.components<recipe.components,()=>run({type:'craft',item:id},{title:tr('Craft {name}?',{name:tr(data.name)}),text:tr('Spend {scrap} scrap and {components} boss components?',{scrap:recipe.scrap,components:recipe.components}),accept:tr('CRAFT')})));}
   else{
    card.append(button(equipped?'EQUIPPED':'EQUIP',equipped,()=>run({type:'equip',slot:recipe.slot,item:id})));
    for(const [mod,info] of Object.entries(data.mods)){const chosen=w.mods[id]===mod,modRow=el('div','workshop-mod');modRow.append(el('strong','',tr(info.name)),el('p','',tr(info.effect)),button(chosen?'INSTALLED':'MODIFY · 40 SCRAP',chosen||armory.scrap<40,()=>run({type:'modify',item:id,mod},{title:tr('Install {name}?',{name:tr(info.name)}),text:tr('Spend 40 scrap? This replaces the current modification.'),accept:tr('MODIFY')})));card.append(modRow);}
   }grid.append(card);
  }
  section.append(grid);root.append(section);
  const legacy=el('section','workshop-legacy');legacy.append(el('h3','',tr('Existing equipment')));
  for(const id of w.owned.filter(value=>value.startsWith('legacy-'))){const index=Number(id.slice(7))-1,item=ITEMS[index],slot=['gadget','gear','gear','gadget','gadget','gear','gadget','gadget','gadget','gadget'][index],equipped=w.equipped[slot]===id,row=el('div','workshop-legacy-item');row.append(el('strong','',name(id)),el('p','',tr(item.description)),button(equipped?'EQUIPPED':'EQUIP',equipped,()=>run({type:'equip',slot,item:id})));legacy.append(row);}
  root.append(legacy);const message=el('p','workshop-status',status);message.setAttribute('role','status');root.append(message);
 }
 return {render};
}
