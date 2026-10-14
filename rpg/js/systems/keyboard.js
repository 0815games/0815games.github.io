import { state } from '../core/state.js';
function setup(){
 const el=id=>document.getElementById(id),combat=el('combat'),stage=el('stage');
 stage.tabIndex=0;stage.setAttribute('aria-label','Karte: WASD oder Pfeile bewegen, E interagiert. I Inventar, C Ausrüstung, K Skills, L Chronik, P speichern.');
 let menu=false;
 const visible=n=>n&&!n.closest('.hidden')&&n.getClientRects().length>0;
 const focusables=root=>Array.from(root.querySelectorAll('button,input,select,textarea,[tabindex="0"]')).filter(n=>!n.disabled&&visible(n));
 const first=root=>focusables(root)[0]?.focus();
 const decorate=()=>{document.querySelectorAll('.slot-box.empty,.item').forEach(n=>{n.tabIndex=0;n.setAttribute('role','button');});};
 decorate();new MutationObserver(decorate).observe(el('slots-grid'),{childList:true});new MutationObserver(decorate).observe(el('items'),{childList:true});
 const css=document.createElement('style');css.textContent=':focus-visible{outline:3px solid #ffe082!important;outline-offset:3px}.keyboard-help{color:#fff;background:#111420;border:2px solid #c99c42;border-radius:14px;max-width:90vw;padding:20px}.keyboard-help::backdrop{background:#000b}';document.head.append(css);
 const help=document.createElement('dialog');help.className='keyboard-help';help.innerHTML='<h2>Tastatur</h2><p>Kampf: 1 Angriff, 2 Feuerball, 3 Heiltrank, 4 Flucht.</p><p>Tab / Shift+Tab: Auswahl. Enter / Leertaste: Bestätigen.</p><p>Erkundung: WASD / Pfeile, E Interaktion. I Inventar, C Ausrüstung, K Skills, L Chronik, P Speichern.</p><p>Esc schließt Menüs. Im Kampf öffnet Esc diese Hilfe ohne Flucht oder Spielzug.</p><button type="button">Zurück</button>';document.body.append(help);help.querySelector('button').onclick=()=>help.close();
 const labels={attack:'[1] Angriff',fire:'[2] Feuerball',heal:'[3] Heiltrank',flee:'[4] Flucht'};
 function labelButtons(){for(const[id,text]of Object.entries(labels)){const b=el(id);b.setAttribute('aria-keyshortcuts',id==='attack'?'1':id==='fire'?'2':id==='heal'?'3':'4');if(!b.textContent.startsWith('['))b.textContent=text+(id==='fire'?' · 8 MP':id==='heal'?` · ${(state.player.inventory||[]).filter(x=>x.id==='health_potion').reduce((a,x)=>a+x.count,0)}`:'');}}
 combat.addEventListener('click',()=>queueMicrotask(labelButtons),true);
 new MutationObserver(()=>{if(state.inCombat&&visible(combat)){menu=false;labelButtons();first(combat);}else if(!visible(el('death-screen'))&&visible(el('game')))stage.focus();}).observe(combat,{attributes:true,attributeFilter:['class']});
 for(const id of ['login-screen','slot-screen','class-screen','death-screen','game']){const node=el(id);new MutationObserver(()=>{if(visible(node)){if(id==='game'){menu=false;stage.focus();}else first(node);}}).observe(node,{attributes:true,attributeFilter:['class']});}
 function consume(e){e.preventDefault();e.stopImmediatePropagation();}
 function openPanel(tab){menu=true;document.querySelector(`nav button[data-tab="${tab}"]`)?.click();first(el(tab));}
 document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{menu=true;first(el(b.dataset.tab));}));
 document.addEventListener('click',e=>{if(e.target.closest('.item')){const index=Array.from(el('items').children).indexOf(e.target.closest('.item'));queueMicrotask(()=>{if(menu){const items=Array.from(el('items').children);items[Math.min(index,items.length-1)]?.focus();}});}},true);
 window.addEventListener('keydown',e=>{
  if(help.open)return;
  if(visible(el('intro-screen')))return;
  const editing=e.target.matches('input,textarea,select')||e.target.isContentEditable;
  if(state.inCombat&&visible(combat)){
   const list=focusables(combat);
   if(e.key==='Tab'){consume(e);const i=list.indexOf(document.activeElement);list[(i+(e.shiftKey?-1:1)+list.length)%list.length]?.focus();return;}
   if(e.key==='Escape'){consume(e);if(!e.repeat)help.showModal();return;}
   const id={'1':'attack','2':'fire','3':'heal','4':'flee'}[e.key];
   if(id){consume(e);if(!e.repeat&&!el(id).disabled)el(id).click();return;}
   if(e.key==='Enter'||e.key===' '){consume(e);if(!e.repeat&&list.includes(document.activeElement))document.activeElement.click();return;}
   if(['w','a','s','d','e','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){consume(e);return;}
   return;
  }
  if(editing)return;
  if(e.target.matches('.item,.slot-box.empty')&&(e.key==='Enter'||e.key===' ')){consume(e);if(!e.repeat)e.target.click();return;}
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
  if(k==='e'||e.key===' '){consume(e);if(!e.repeat)window.__rpg?.interact();}
 },true);
 labelButtons();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
