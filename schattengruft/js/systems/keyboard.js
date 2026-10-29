import { state } from '../core/state.js';
import { activateAbilityShortcut, isInteractionKey, ABILITY_KEYS } from './keyboard-actions.js';
function setup(){
 const el=id=>document.getElementById(id),combat=el('combat'),stage=el('stage');
 stage.tabIndex=0;stage.setAttribute('aria-label','Karte: WASD oder Pfeile bewegen, Enter oder Leertaste interagiert. I Inventar, C Ausrüstung, K Skills, L Chronik, P speichern.');
 let menu=false;
 const visible=n=>n&&!n.closest('.hidden')&&n.getClientRects().length>0;
 const focusables=root=>Array.from(root.querySelectorAll('button,input,select,textarea,[tabindex="0"],[role="button"]')).filter(n=>!n.disabled&&visible(n));
 const first=root=>focusables(root)[0]?.focus();
 const decorate=()=>{document.querySelectorAll('.slot-box.empty,.item,.slot-box').forEach(n=>{n.tabIndex=0;n.setAttribute('role','button');});};
 decorate();new MutationObserver(decorate).observe(el('slots-grid'),{childList:true});new MutationObserver(decorate).observe(el('items'),{childList:true});
 const css=document.createElement('style');css.textContent=':focus-visible{outline:3px solid #ffe082!important;outline-offset:3px}.keyboard-help{color:#fff;background:#111420;border:2px solid #c99c42;border-radius:14px;max-width:90vw;padding:20px}.keyboard-help::backdrop{background:#000b}';document.head.append(css);
 const help=document.createElement('dialog');help.className='keyboard-help';help.innerHTML='<h2>Tastatur</h2><p>Kampf: 1 Angriff, 2 Feuerball, 3 Heiltrank, 4 Manatrank, 5 Flucht. Q / E / R: Klassenfähigkeiten 1 / 2 / 3.</p><p>Charakterauswahl: Pfeiltasten wählen, Enter bestätigt. Im Klassendialog: Pfeiltasten wählen die Klasse, Tab wechselt zu Name und Aktionen.</p><p>Tab / Shift+Tab: Auswahl. Enter / Leertaste: Bestätigen.</p><p>Erkundung: WASD / Pfeile, Enter / Leertaste: Interaktion auf der Karte. I Inventar, C Ausrüstung, K Skills, L Chronik, P Speichern.</p><p>Esc schließt Menüs. Im Kampf öffnet Esc diese Hilfe ohne Flucht oder Spielzug.</p><button type="button">Zurück</button>';document.body.append(help);help.querySelector('button').onclick=()=>help.close();
 const labels={attack:'[1] Angriff',fire:'[2] Feuerball',heal:'[3] Heiltrank',mana:'[4] Manatrank',flee:'[5] Flucht'};
 function labelButtons(){for(const[id,text]of Object.entries(labels)){const b=el(id);if(!b)continue;if(id==='heal'||id==='mana'){const itemId=id==='heal'?'health_potion':'mana_potion',count=(state.player.inventory||[]).filter(x=>x?.id===itemId&&x.count>0).reduce((n,x)=>n+x.count,0);b.textContent=`${id==='heal'?'[3] Heil':'[4] Mana'} · ×${count}`;b.setAttribute('aria-keyshortcuts',id==='heal'?'3':'4');continue;}b.setAttribute('aria-keyshortcuts',id==='attack'?'1':id==='fire'?'2':id==='heal'?'3':id==='mana'?'4':'5');b.textContent=text+(id==='fire'?' · 8 MP':id==='heal'?` · ${(state.player.inventory||[]).filter(x=>x.id==='health_potion').reduce((a,x)=>a+x.count,0)}`:'');}}
 function labelAbilities(){
  [...combat.querySelectorAll('.ability-btn')].forEach((button,index)=>{
   const key=ABILITY_KEYS[index];if(!key)return;
   button.setAttribute('aria-keyshortcuts',key.toUpperCase());
   if(!button.querySelector('.ability-key-hint')){
    const hint=document.createElement('span');hint.className='ability-key-hint';hint.textContent=`[${key.toUpperCase()}] `;hint.setAttribute('aria-hidden','true');button.prepend(hint);
   }
  });
 }
 const shortcutStyle=document.createElement('style');shortcutStyle.textContent='.ability-key-hint{display:none}@media(hover:hover) and (pointer:fine){.ability-key-hint{display:inline;color:#ffe082}}';document.head.append(shortcutStyle);
 new MutationObserver(labelAbilities).observe(combat,{childList:true,subtree:true});labelAbilities();
 combat.addEventListener('click',()=>queueMicrotask(labelButtons),true);
 new MutationObserver(()=>{if(state.inCombat&&visible(combat)){menu=false;labelButtons();first(combat);}else if(!visible(el('death-screen'))&&visible(el('game')))stage.focus();}).observe(combat,{attributes:true,attributeFilter:['class']});
 for(const id of ['login-screen','slot-screen','class-screen','death-screen','game']){const node=el(id);new MutationObserver(()=>{if(visible(node)){if(id==='game'){menu=false;stage.focus();}else first(node);}}).observe(node,{attributes:true,attributeFilter:['class']});}
 function consume(e){e.preventDefault();e.stopImmediatePropagation();}
 function openPanel(tab){menu=true;document.querySelector(`nav button[data-tab="${tab}"]`)?.click();first(el(tab));}
 document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{menu=true;first(el(b.dataset.tab));}));
 document.addEventListener('click',e=>{if(e.target.closest('.item')){const index=Array.from(el('items').children).indexOf(e.target.closest('.item'));queueMicrotask(()=>{if(menu){const items=Array.from(el('items').children);items[Math.min(index,items.length-1)]?.focus();}});}},true);
 function moveFocus(list,dx,dy,columns=1){
  if(!list.length)return;
  const index=list.indexOf(document.activeElement);
  if(index<0){list[0]?.focus();return;}
  let next=index;
  if(dx)next=index+dx;
  if(dy)next=index+dy*columns;
  next=Math.max(0,Math.min(list.length-1,next));
  list[next]?.focus();list[next]?.scrollIntoView({block:'nearest',inline:'nearest'});
 }
 window.addEventListener('keydown',e=>{
  if(help.open){e.stopPropagation();return;}
  if(visible(el('intro-screen'))){if(e.key==='Enter'||e.key===' '){consume(e);if(!e.repeat)document.querySelector('#intro-screen')?.click();}return;}
  const editing=e.target.matches('input,textarea,select')||e.target.isContentEditable;
  const blocked=document.hidden||!!document.querySelector('dialog[open]:not(#mobile-game-menu),.tutorial-modal:not(.hidden),.levelup-choice,#floor-overlay:not(.hidden),#levelup-overlay:not(.hidden),#death-screen:not(.hidden),#session-pause:not([hidden]),#preparation-shop:not([hidden])');
  if(blocked){e.stopPropagation();return;}
  if(editing||e.isComposing){e.stopImmediatePropagation();return;}
  if(e.altKey||e.ctrlKey||e.metaKey){e.stopImmediatePropagation();return;}
  if(state.inCombat&&visible(combat)){
   const list=focusables(combat);
   if(e.key==='Tab'){consume(e);const i=list.indexOf(document.activeElement);list[(i+(e.shiftKey?-1:1)+list.length)%list.length]?.focus();return;}
   if(e.key==='Escape'){consume(e);if(!e.repeat)help.showModal();return;}
   const abilityButtons=[...combat.querySelectorAll('.ability-btn')],abilityIndex=ABILITY_KEYS.indexOf(e.key.toLowerCase());
   if(activateAbilityShortcut(e,abilityButtons,!!state.user?.uid&&state.player?.hp>0&&visible(abilityButtons[abilityIndex])))return;
   const id={'1':'attack','2':'fire','3':'heal','4':'mana','5':'flee'}[e.key];
   if(id){consume(e);if(!e.repeat&&el(id)&&!el(id).disabled)el(id).click();return;}
   if(e.key==='Enter'||e.key===' '){consume(e);if(!e.repeat&&list.includes(document.activeElement))document.activeElement.click();return;}
   if(['w','a','s','d','e','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){consume(e);return;}
   return;
  }
  if(visible(el('slot-screen'))){
   const grid=el('slots-grid'),boxes=Array.from(grid.children).filter(visible);
   if(boxes.includes(document.activeElement)){
    if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)){consume(e);moveFocus(boxes,e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0,2);return;}
    if(e.key==='Enter'||e.key===' '){consume(e);if(!e.repeat)document.activeElement.click();return;}
   }
  }
  if(visible(el('class-screen'))&&!editing){
   const classes=Array.from(document.querySelectorAll('.class')).filter(visible);
   if(classes.includes(document.activeElement)&&['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)){consume(e);moveFocus(classes,e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0,1);return;}
   if(!classes.includes(document.activeElement)&&['ArrowUp','ArrowDown'].includes(e.key)){consume(e);classes[0]?.focus();return;}
  }
  if(editing)return;
  if(e.target.matches('.item,.slot-box.empty,.slot-box')&&(e.key==='Enter'||e.key===' ')){consume(e);if(!e.repeat)e.target.click();return;}
  if(!visible(el('game'))||visible(el('death-screen')))return;
  if(visible(el('floor-overlay'))||visible(el('levelup-overlay'))){consume(e);return;}
  const k=e.key.toLowerCase();
  if(e.key==='Escape'){consume(e);menu=false;stage.focus();return;}
  const tabs={i:'inv',c:'char',k:'skills',l:'log'};
  if(tabs[k]){consume(e);if(!e.repeat)openPanel(tabs[k]);return;}
  if(k==='p'){consume(e);if(!e.repeat)el('save').click();return;}
  if(menu||e.target.matches('button,[role="button"]')){if(['w','a','s','d','e'].includes(k)||e.key.startsWith('Arrow'))e.stopImmediatePropagation();if(e.key===' ')e.stopPropagation();return;}
  const dirs={w:[0,-1],arrowup:[0,-1],s:[0,1],arrowdown:[0,1],a:[-1,0],arrowleft:[-1,0],d:[1,0],arrowright:[1,0]};
  if(dirs[k]){consume(e);window.__rpg?.move(...dirs[k]);return;}
  if(k==='e'){consume(e);return;}
  if(isInteractionKey(e)){consume(e);if(!e.repeat)window.__rpg?.interact();}
 },true);
 labelButtons();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
