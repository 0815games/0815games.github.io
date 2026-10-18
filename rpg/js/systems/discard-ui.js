let controls;
window.addEventListener('keydown',e=>{
 if(!controls?.dialog.open)return;
 e.stopImmediatePropagation();
 if(e.key==='Escape'){e.preventDefault();controls.cancel();return;}
 if(e.key==='Tab'){e.preventDefault();const list=[...controls.dialog.querySelectorAll('input,button')].filter(n=>!n.disabled),i=list.indexOf(document.activeElement);list[(i+(e.shiftKey?-1:1)+list.length)%list.length]?.focus();return;}
 if((e.key==='Enter'||e.key===' ')&&document.activeElement?.tagName==='BUTTON'){e.preventDefault();if(!e.repeat)document.activeElement.click();}
},true);
export function planDiscard(player,index,count,expectedId,remove){
 if(!player||!Array.isArray(player.inventory)||!Number.isInteger(index)||index<0||index>=player.inventory.length)return {ok:false,reason:'INVALID_SELECTION'};
 const entry=player.inventory[index];
 if(!entry||entry.id!==expectedId)return {ok:false,reason:'STALE_SELECTION'};
 if(!Number.isSafeInteger(count)||count<1||!Number.isSafeInteger(entry.count)||count>entry.count)return {ok:false,reason:'INVALID_COUNT'};
 const probe=player.inventory.map(s=>s&&({...s}));
 if(!remove(probe,entry.id,count))return {ok:false,reason:'INVALID_INVENTORY'};
 const inventory=player.inventory.map(s=>({...s}));
 inventory[index].count-=count;if(inventory[index].count===0)inventory.splice(index,1);
 return {ok:true,inventory};
}
export async function persistDiscard(ticket,count,remove,save,valid){
 if(!valid())return {ok:false,reason:'STALE_SELECTION'};
 const plan=planDiscard(ticket.player,ticket.index,count,ticket.id,remove);if(!plan.ok)return plan;
 const snapshot=JSON.parse(JSON.stringify({player:{...ticket.player,inventory:plan.inventory},world:ticket.world,meta:ticket.meta,currentSlot:ticket.slot}));
 const ok=await save(ticket.slot,snapshot);
 if(!ok)return {ok:false,reason:'SAVE_FAILED'};
 if(!valid())return {ok:false,reason:'CONTEXT_CHANGED_AFTER_SAVE',persisted:true};
 return {ok:true,inventory:plan.inventory};
}
export function installDiscard({state,cloud,ITEMS,removeItem,useItem,hud,log}){
 if(document.getElementById('discard-confirm'))return;
 const el=id=>document.getElementById(id),items=el('items'),game=el('game');if(!items||!game)return;
 const dialog=document.createElement('dialog');dialog.id='discard-confirm';dialog.setAttribute('aria-labelledby','discard-title');dialog.setAttribute('aria-describedby','discard-warning');
 dialog.innerHTML='<div class="discard-card"><h2 id="discard-title">Gegenstand wegwerfen</h2><p id="discard-name"></p><p id="discard-warning">Dauerhaft entfernen. Kein Gold, keine Bodenbeute. Angelegte Ausrüstung zuerst ablegen.</p><label for="discard-quantity">Menge</label><input id="discard-quantity" type="number" min="1" step="1" inputmode="numeric" value="1"><p id="discard-status" role="status" aria-live="polite"></p><div class="discard-actions"><button type="button" data-cancel>Abbrechen</button><button type="button" data-confirm>Endgültig wegwerfen</button></div></div>';
 document.body.append(dialog);
 const style=document.createElement('style');style.textContent=`
#items>.item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px}
#items>.item>span{grid-column:1;min-width:0;overflow-wrap:anywhere}
#items>.item>.inventory-actions{grid-column:2;grid-row:1 / span 2;display:flex;align-items:center;gap:6px}
#items .inventory-actions>button{min-height:44px;padding:8px;border-radius:9px;font:inherit;font-size:12px;touch-action:manipulation}
#items .inventory-actions>.use-row-button{border:1px solid #6d9bb6;background:#20313a;color:#d9f1ff}
#items .inventory-actions>.discard-row-button{border:1px solid #b66d70;background:#34202a;color:#ffd9d9}
#items .inventory-actions>button:disabled{opacity:.5}
#items .inventory-actions>button[hidden]{display:none}
@media(max-width:480px){#items>.item>.inventory-actions{grid-column:1 / -1;grid-row:auto;justify-content:flex-end}}
#discard-confirm,#discard-confirm *{box-sizing:border-box}
#discard-confirm{position:fixed;inset:0;margin:0;width:100%;max-width:100%;height:100dvh;max-height:100dvh;border:0;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:#05060ae8;color:#eee;overflow:auto}
#discard-confirm[open]{display:grid;place-items:center}#discard-confirm::backdrop{background:#000b}
#discard-confirm .discard-card{width:min(440px,100%);max-height:100%;overflow:auto;padding:20px;border:2px solid #c99c42;border-radius:16px;background:#111420;overflow-wrap:anywhere}
#discard-confirm h2{margin:0 0 12px;color:#ffd36c;font-size:20px}#discard-confirm p{line-height:1.5}
#discard-confirm label{display:block;margin-bottom:6px}#discard-confirm input{width:100%;min-height:48px;padding:10px;font:inherit;border:1px solid #c99c42;border-radius:9px;background:#202535;color:#fff}
#discard-confirm .discard-actions{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
#discard-confirm button{min-height:48px;padding:10px;font:inherit;border:1px solid #c99c42;border-radius:9px;background:#24293c;color:#fff;touch-action:manipulation}
#discard-confirm [data-confirm]{background:#692b38;border-color:#d78d92}#discard-confirm button:disabled{opacity:.5}
#discard-confirm button:focus-visible,#discard-confirm input:focus-visible{outline:3px solid #ffe082;outline-offset:2px}
@media(min-width:480px){#discard-confirm .discard-actions{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;document.head.append(style);
 const quantity=dialog.querySelector('#discard-quantity'),status=dialog.querySelector('#discard-status'),cancelButton=dialog.querySelector('[data-cancel]'),confirmButton=dialog.querySelector('[data-confirm]');
 let ticket=null,busy=false;
 const blocked=()=>!!document.querySelector('dialog[open]:not(#discard-confirm):not(#mobile-game-menu),.tutorial-modal:not(.hidden),.levelup-choice,#floor-overlay:not(.hidden),#levelup-overlay:not(.hidden),#death-screen:not(.hidden),#session-pause:not([hidden]),#preparation-shop:not([hidden])');
 function allowed(){return !document.hidden&&!!state.user?.uid&&state.user.uid===cloud.auth?.currentUser?.uid&&!game.classList.contains('hidden')&&!state.inCombat&&state.player?.hp>0&&!state.player.needsPreparation&&!blocked();}
 function valid(){return !!ticket&&allowed()&&state.user.uid===ticket.uid&&state.currentSlot===ticket.slot&&state.player===ticket.player&&state.player.inventory===ticket.inventory&&state.player.equipped===ticket.equipped&&state.world===ticket.world&&state.world.tiles===ticket.tiles&&state.world.depth===ticket.depth&&state.meta===ticket.meta&&ticket.inventory[ticket.index]===ticket.entry&&ticket.entry.id===ticket.id&&ticket.entry.count===ticket.originalCount;}
 function restoreMenu(old){queueMicrotask(()=>{if(!allowed())return;if(old?.menuOpen)document.querySelector('nav [data-tab="inv"]')?.click();else el('stage')?.focus({preventScroll:true});});}
 function cancel(){if(busy)return;const old=ticket;ticket=null;if(dialog.open)dialog.close();restoreMenu(old);}
 controls={dialog,cancel};
 function update(){const n=Number(quantity.value);confirmButton.disabled=busy||!Number.isSafeInteger(n)||n<1||n>(ticket?.originalCount||0);cancelButton.disabled=busy;quantity.disabled=busy;}
 function open(index){if(busy||dialog.open||!allowed())return;const p=state.player,entry=p.inventory[index],item=entry&&ITEMS[entry.id];if(!item||!Number.isSafeInteger(entry.count)||entry.count<1)return;ticket={uid:state.user.uid,slot:state.currentSlot,player:p,inventory:p.inventory,equipped:p.equipped,world:state.world,tiles:state.world.tiles,depth:state.world.depth,meta:state.meta,index,entry,id:entry.id,originalCount:entry.count,menuOpen:!!el('mobile-game-menu')?.open};dialog.querySelector('#discard-name').textContent=`${item.icon||'📦'} ${item.name} · Bestand ${entry.count}`;quantity.max=String(entry.count);quantity.value='1';status.textContent='Die Entfernung wird vor Übernahme gespeichert.';update();dialog.showModal();cancelButton.focus({preventScroll:true});}
 cancelButton.onclick=cancel;quantity.addEventListener('input',update);dialog.addEventListener('cancel',e=>{e.preventDefault();cancel();});
 confirmButton.onclick=async()=>{if(busy)return;if(!valid()){status.textContent='Auswahl oder Sitzung geändert. Bitte abbrechen und erneut auswählen.';return;}const count=Number(quantity.value);if(!Number.isSafeInteger(count)||count<1||count>ticket.originalCount){status.textContent='Bitte eine gültige Menge eingeben.';return;}busy=true;update();const current=ticket;status.textContent='Wegwerfen wird gespeichert …';try{const result=await persistDiscard(current,count,removeItem,(slot,data)=>cloud.saveSlot(slot,data),valid);if(!result.ok){if(result.persisted){ticket=null;dialog.close();log('Wegwerfen gespeichert; Ansicht oder Sitzung hat sich geändert. Bitte den betreffenden Helden neu laden.');return;}status.textContent=result.reason==='SAVE_FAILED'?'Speichern fehlgeschlagen. Es wurde lokal nichts entfernt.':'Auswahl ungültig oder verändert. Es wurde nichts entfernt.';return;}if(!valid()){ticket=null;dialog.close();log('Wegwerfen gespeichert; bitte den betreffenden Helden neu laden.');return;}current.player.inventory=result.inventory;ticket=null;dialog.close();hud();el('iteminfo').textContent=`${count} × ${ITEMS[current.id].name} weggeworfen. Kein Gold erhalten.`;log(`${count} × ${ITEMS[current.id].name} weggeworfen.`);restoreMenu(current);}catch(error){status.textContent='Wegwerfen konnte nicht bestätigt werden. Lokal nichts entfernt; bei unklarem Netzwerkstatus Spielstand erneut prüfen.';console.warn('Wegwerfen:',error);}finally{busy=false;update();decorate();}};
 function decorate(){[...items.children].forEach(row=>{
  if(!row.classList.contains('item'))return;
  const index=[...items.children].indexOf(row),entry=state.player?.inventory?.[index],item=entry&&ITEMS[entry.id];
  let group=row.querySelector('.inventory-actions');
  if(!group){
   group=document.createElement('div');group.className='inventory-actions';
   const use=document.createElement('button');use.type='button';use.className='use-row-button';use.textContent='Nutzen';
   use.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();
    const i=[...items.children].indexOf(row),current=state.player?.inventory?.[i];
    if(busy||dialog.open||!allowed()||current!==entry||!current||ITEMS[current.id]?.slot)return;
    if(typeof useItem==='function')useItem(i);else row.click();
   });
   const discard=document.createElement('button');discard.type='button';discard.className='discard-row-button';discard.textContent='Wegwerfen';
   discard.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const i=[...items.children].indexOf(row);if(state.player?.inventory?.[i]!==entry)return;open(i);});
   group.append(use,discard);row.append(group);
  }
  const use=group.querySelector('.use-row-button'),discard=group.querySelector('.discard-row-button');
  const hideUse=!!item?.slot;
  if(use.hidden!==hideUse)use.hidden=hideUse;
  use.disabled=busy||dialog.open||!allowed()||!item||(typeof useItem!=='function'&&typeof row.onclick!=='function');
  use.setAttribute('aria-label',`${item?.name||'Gegenstand'} nutzen`);
  discard.disabled=busy||!allowed()||!entry;
  discard.setAttribute('aria-label',`${item?.name||'Gegenstand'} wegwerfen`);
 });}
 const hint=document.createElement('p');hint.id='discard-help';hint.textContent='Wegwerfen entfernt Taschengegenstände dauerhaft ohne Gold oder Bodenbeute. Bei Stapeln Menge wählen und bestätigen. Im Kampf gesperrt.';items.before(hint);
 new MutationObserver(decorate).observe(items,{childList:true});
 new MutationObserver(records=>{
  if(records.every(({target})=>target.closest?.('.inventory-actions')))return;
  if(ticket&&!busy&&!valid())cancel();
  decorate();
 }).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden']});
 decorate();
}
