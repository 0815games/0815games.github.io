import {state} from '../core/state.js';
import {ITEMS} from '../data/items.js';
function install(){
 const panel=document.getElementById('preparation-shop'),id='preparation-purchase-hint';if(!panel||document.getElementById(id))return;
 const list=panel.querySelector('.shop-list'),header=panel.querySelector('header'),footer=panel.querySelector('footer'),confirm=footer?.querySelector('[data-confirm]'),cancel=footer?.querySelector('[data-cancel]'),start=footer?.querySelector('[data-start]'),status=footer?.querySelector('p');if(!list||!header||!confirm||!cancel||!start||!status)return;
 const hint=document.createElement('p');hint.id=id;hint.textContent='Tränke werden direkt gekauft. Ausrüstung wird erst nach deiner Bestätigung gekauft.';hint.style.cssText='margin:0;font:12px/1.4 system-ui,sans-serif;color:#d6cebc';header.append(hint);const described=(panel.getAttribute('aria-describedby')||'').split(' ').filter(Boolean);if(!described.includes(id))described.push(id);panel.setAttribute('aria-describedby',described.join(' '));let saving=false;
 const title=card=>card?.querySelector('h3')?.textContent||'';
 function potion(card){const label=title(card);return ['health_potion','mana_potion'].map(id=>ITEMS[id]).find(item=>item&&label===`${item.icon||'📦'} ${item.name}`);}
 function decorate(){for(const card of list.querySelectorAll('article')){const button=card.querySelector('button'),item=potion(card);if(button&&item){const label=`${item.name} · ${item.price} Gold · ${button.disabled?button.textContent+' (nicht verfügbar)':'direkt kaufen'}`;if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);}}}
 panel.addEventListener('click',e=>{const button=e.target?.closest?.('button');if(button&&(saving||start.disabled)&&(list.contains(button)||button===confirm||button===cancel||button===start)){e.preventDefault();e.stopImmediatePropagation();}},true);
 panel.addEventListener('click',async e=>{const button=e.target?.closest?.('button'),card=button?.closest('article');if(!card||!list.contains(card)||button.disabled||saving||start.disabled)return;const item=potion(card);if(!item||confirm.hidden||confirm.disabled||cancel.hidden||typeof confirm.onclick!=='function'||status.textContent!==`${item.name} für ${item.price} Gold kaufen?`)return;
  e.preventDefault();saving=true;const label=title(card),player=state.player,slot=state.currentSlot,uid=state.user?.uid;
  try{const operation=confirm.onclick.call(confirm,e);confirm.hidden=true;cancel.hidden=true;if(start.disabled){status.textContent=`${item.name}: Kauf wird gespeichert …`;status.tabIndex=-1;status.focus({preventScroll:true});}else{cancel.onclick?.call(cancel);status.textContent='Kauf nicht möglich. Bestand und Ordensgold prüfen.';}await operation;}
  catch(error){status.textContent='Kauf konnte nicht abgeschlossen werden. Bitte erneut prüfen.';console.warn('Direkter Trankkauf:',error);}
  finally{saving=false;if(!panel.hidden&&state.player===player&&state.currentSlot===slot&&state.user?.uid===uid){const next=[...list.querySelectorAll('article')].find(c=>title(c)===label)?.querySelector('button');if(next&&!next.disabled)next.focus({preventScroll:true});else if(!start.disabled)start.focus({preventScroll:true});}}
 });
 new MutationObserver(decorate).observe(list,{childList:true});decorate();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});else setTimeout(install,0);
