import {drawCharacter} from '../world/character.js';
import {state} from '../core/state.js';
import {ITEMS} from '../data/items.js';
import {cloud} from './firebase.js';
import {equipmentCandidates} from './equipment-candidates.js';
const views=new WeakMap();
export function renderArmory(panel,player,stats,depth,options={}){
 if(!panel)return false;
 const grid=panel.querySelector('.equip-grid'),box=panel.querySelector('#stats');if(!grid||!box)return false;
 const doc=panel.ownerDocument||document;
 const make=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
 const number=value=>Number.isFinite(value)?String(value):'—';
 let view=views.get(grid);
 if(!view){
  const figure=make('figure','armory-hero'),canvas=make('canvas','armory-hero__canvas'),caption=make('figcaption','armory-hero__caption'),name=make('strong','armory-hero__name'),identity=make('span','armory-hero__identity'),fallback=make('span','armory-hero__fallback','Vorschau nicht verfügbar.');
  canvas.width=128;canvas.height=128;canvas.setAttribute('role','img');fallback.hidden=true;caption.append(name,identity,fallback);figure.append(canvas,caption);grid.prepend(figure);view={figure,canvas,name,identity,fallback};views.set(grid,view);
 }
 view.name.textContent=player.name||'Recke';
 view.identity.textContent=`${options.classLabel||player.heroClass||'Recke'} · Level ${number(player.level)}`;
 view.canvas.setAttribute('aria-label',`${player.name||'Recke'} mit aktuell angelegter Ausrüstung`);
 view.canvas.hidden=false;view.fallback.hidden=true;
 try{const ctx=view.canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');ctx.clearRect(0,0,128,128);(options.draw||drawCharacter)(ctx,player,16,12,96);}catch(error){view.canvas.hidden=true;view.fallback.hidden=false;}
 const values=make('dl','armory-values');
 for(const [label,value,note] of [
  ['Run-Gold',number(player.gold),''],
  ['Angriff',number(stats?.totalAtk),`Basis ${number(player.atk)}`],
  ['Verteidigung',number(stats?.totalDef),`Basis ${number(player.def)}`],
  ['Max. TP',number(player.maxHp),''],
  ['Max. MP',number(player.maxMp),''],
  ['EP',`${number(player.xp)} / ${number(player.nextXp)}`,''],
  ['Skillpunkte',number(player.skillPoints??0),''],
  ['Ebene',number(depth),'']
 ]){const card=make('div','armory-value');card.append(make('dt','',label),make('dd','',value));if(note)card.append(make('span','armory-value__base',note));values.append(card);}
 box.replaceChildren(values);bindSlotChoices(panel,player);return true;
}

const slotNames={head:'Kopf',body:'Körper',mainhand:'Waffe',offhand:'Schild',feet:'Stiefel',ring:'Ring'};
function showSlotChoices(panel,player,slot,trigger){
 const doc=panel.ownerDocument||document;
 if(state.player!==player||!state.user?.uid||state.inCombat||player.hp<=0||player.needsPreparation||doc.hidden||doc.getElementById('game')?.classList.contains('hidden'))return;
 if(doc.querySelector('dialog[open]:not(#mobile-game-menu),.tutorial-modal:not(.hidden),.levelup-choice,#death-screen:not(.hidden),#floor-overlay:not(.hidden),#levelup-overlay:not(.hidden),#session-pause:not([hidden]),#preparation-shop:not([hidden])'))return;
 panel.querySelector('.armory-slot-choices')?.remove();
 for(const button of panel.querySelectorAll('.armory-slot-open'))button.setAttribute('aria-expanded','false');
 const section=doc.createElement('section'),heading=doc.createElement('h4'),list=doc.createElement('ul'),close=doc.createElement('button');
 section.className='armory-slot-choices';section.setAttribute('role','region');section.setAttribute('aria-label',`Passende Gegenstände: ${slotNames[slot]}`);section.style.cssText='margin:12px 0;padding:12px;border:1px solid #b69960;border-radius:12px;background:#111520';
 heading.textContent=`Passende Gegenstände · ${slotNames[slot]}`;heading.style.margin='0 0 10px';section.append(heading);
 const matches=equipmentCandidates(player.inventory,slot,ITEMS);
 const status=doc.createElement('p');status.setAttribute('role','status');status.style.cssText='margin:8px 0;color:#efd194';
 const ticket={player,slot,section,uid:state.user.uid,saveSlot:state.currentSlot,world:state.world,tiles:state.world?.tiles,inventory:player.inventory,equipped:player.equipped,busy:false,done:false};
 if(matches.length){
  list.style.cssText='margin:0 0 12px;padding-left:20px';
  for(const item of matches){
   const row=doc.createElement('li'),choose=doc.createElement('button');row.textContent=`${item.icon} ${item.name}${item.count>1?' ×'+item.count:''}`;row.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:8px 0;overflow-wrap:anywhere';
   choose.type='button';choose.textContent='Ausrüsten';choose.setAttribute('aria-label',`${item.name} ausrüsten`);choose.style.cssText='min-height:44px;padding:8px 12px;background:#24293c;color:#f1dfb5;border:1px solid #a68750;border-radius:9px';
   choose.onclick=()=>{
    choose.disabled=true;
    try{
     if(equipSlotChoice(ticket,item,doc)){
      section.remove();trigger.setAttribute('aria-expanded','false');
      doc.getElementById('slot-item-'+slot)?.closest('.equip-slot-box')?.querySelector('.btn-unequip')?.focus();
     }else status.textContent='Auswahl nicht mehr gültig oder Ausrüsten nicht möglich. Bitte die Auswahl erneut öffnen.';
    }catch(error){status.textContent='Ausrüsten konnte nicht abgeschlossen werden. Bitte Inventar und Ausrüstung prüfen.';}
    finally{if(section.isConnected)choose.disabled=false;}
   };
   row.append(choose);list.append(row);
  }
  section.append(list);
 }else{const message=doc.createElement('p');message.textContent='Kein passender Gegenstand im Rucksack.';section.append(message);}
 section.append(status);
 close.type='button';close.textContent='Schließen';close.style.cssText='min-height:44px;padding:8px 12px;background:#24293c;color:#f1dfb5;border:1px solid #a68750;border-radius:9px';
 close.onclick=()=>{section.remove();trigger.setAttribute('aria-expanded','false');if(trigger.isConnected)trigger.focus();};section.append(close);panel.querySelector('.equip-grid').after(section);trigger.setAttribute('aria-expanded','true');close.focus({preventScroll:true});section.scrollIntoView?.({block:'nearest'});
}
function bindSlotChoices(panel,player){
 panel.querySelector('.armory-slot-choices')?.remove();
 for(const slot of Object.keys(slotNames)){
  const name=panel.querySelector('#slot-item-'+slot),card=name?.closest('.equip-slot-box');if(!card)continue;
  let trigger=name.querySelector('.armory-slot-open');
  if(!trigger){trigger=(panel.ownerDocument||document).createElement('button');trigger.type='button';trigger.className='armory-slot-open';trigger.textContent=player.equipped?.[slot]?'Belegt · Ersatz wählen':'Leer · Auswahl öffnen';trigger.style.cssText='width:100%;min-height:44px;padding:0;border:0;background:transparent;color:#d9bf87;font:inherit;text-align:left;cursor:pointer';name.replaceChildren(trigger);}
  trigger.setAttribute('aria-label',`${slotNames[slot]}: passende Gegenstände anzeigen`);trigger.setAttribute('aria-expanded','false');card.style.cursor='pointer';
  card.onclick=e=>{if(e.target.closest?.('.btn-unequip'))return;showSlotChoices(panel,player,slot,trigger);};
 }
}
function equipSlotChoice(ticket,item,doc){
 const p=ticket.player;
 if(ticket.busy||ticket.done||!ticket.section.isConnected)return false;
 if(state.player!==p||state.user?.uid!==ticket.uid||cloud.auth?.currentUser?.uid!==ticket.uid||state.currentSlot!==ticket.saveSlot||state.world!==ticket.world||state.world?.tiles!==ticket.tiles||p.inventory!==ticket.inventory||p.equipped!==ticket.equipped)return false;
 if(state.inCombat||p.hp<=0||p.needsPreparation||doc.hidden||doc.getElementById('game')?.classList.contains('hidden'))return false;
 if(doc.querySelector('dialog[open]:not(#mobile-game-menu),.tutorial-modal:not(.hidden),.levelup-choice,#death-screen:not(.hidden),#floor-overlay:not(.hidden),#levelup-overlay:not(.hidden),#session-pause:not([hidden]),#preparation-shop:not([hidden])'))return false;
 const current=p.inventory[item.index];
 if(!Number.isInteger(item.index)||current!==item.entry||current?.id!==item.id||current?.count!==item.count||!Number.isSafeInteger(current?.count)||current.count<1||!Object.prototype.hasOwnProperty.call(ITEMS,item.id)||ITEMS[item.id]?.slot!==ticket.slot)return false;
 const row=doc.getElementById(`inventory-detail-${item.index}`)?.closest('.item');
 if(typeof row?.inventoryEquipAction!=='function')return false;
 ticket.busy=true;
 try{row.inventoryEquipAction();if(p.equipped?.[ticket.slot]!==item.id)return false;ticket.done=true;return true;}finally{ticket.busy=false;}
}
