import {state} from '../core/state.js';
function stairKey(s,visible){const w=s.world,p=s.player,t=w?.stairs;if(!visible||!s.user?.uid||s.inCombat||p?.needsPreparation||!(p?.hp>0)||!t||(w.monsters||[]).length||p.x!==t.x||p.y!==t.y)return null;return `${s.user.uid}:${s.currentSlot}:${w.depth}:${t.x}:${t.y}`;}
let controls;
window.addEventListener('keydown',e=>{if(!controls?.dialog.open)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();controls.cancel();return;}if(e.key==='Tab'){e.preventDefault();e.stopImmediatePropagation();const buttons=[...controls.dialog.querySelectorAll('button')];const i=buttons.indexOf(document.activeElement);buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();return;}if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&controls.dialog.contains(document.activeElement)&&document.activeElement.tagName==='BUTTON')document.activeElement.click();return;}e.stopImmediatePropagation();if(e.key.startsWith('Arrow'))e.preventDefault();},true);
function setup(){
 const el=id=>document.getElementById(id),game=el('game'),creator=el('class-screen');
 const style=document.createElement('style');style.textContent=`
:root{--play-top:max(12px,env(safe-area-inset-top));--play-right:max(12px,env(safe-area-inset-right));--play-bottom:max(12px,env(safe-area-inset-bottom));--play-left:max(12px,env(safe-area-inset-left))}
#game{position:fixed;inset:var(--play-top) var(--play-right) var(--play-bottom) var(--play-left);width:auto;height:auto!important;min-height:0!important;max-width:none;margin:0;padding:0!important;border:2px solid #c99c42;border-radius:16px;background:#111420;box-shadow:0 0 35px #000,0 0 20px #c99c4233;overflow:hidden}
#game header{flex-shrink:0;padding-top:8px}
#game #layout{min-height:0;overflow:hidden}
#game #mapbox{min-height:0}
#game aside{min-height:0;max-height:100%;overflow-y:auto;padding-bottom:12px}
#hint{display:none!important}
#combat{inset:var(--play-top) var(--play-right) var(--play-bottom) var(--play-left);height:auto!important;border:2px solid #c99c42!important;border-radius:16px;overflow-y:auto!important;padding-top:12px;padding-bottom:12px}
#floor-overlay,#levelup-overlay,body .tutorial-modal,body .levelup-choice{inset:var(--play-top) var(--play-right) var(--play-bottom) var(--play-left);border-radius:16px}
#stair-confirm{width:min(440px,calc(100vw - 48px));max-height:calc(100dvh - var(--play-top) - var(--play-bottom) - 24px);overflow:auto;margin:auto;border:2px solid #c99c42;border-radius:16px;padding:20px;background:#111420;color:#e8e4d9;box-shadow:0 0 40px #000}
#stair-confirm::backdrop{background:#000b}#stair-confirm h2{margin:0 0 12px;color:#ffd36c}#stair-confirm p{line-height:1.6}#stair-confirm .actions{display:flex;flex-wrap:wrap;gap:10px}#stair-confirm button{flex:1;min-height:48px;padding:10px 14px;border:1px solid #c99c42;border-radius:10px;background:#24293c;color:#fff}#stair-confirm [data-go]{background:#c99c42;color:#16120a;font-weight:bold}
`;document.head.append(style);
 let creatorOpen=false;
 function fillName(){el('random-name')?.click();}
 function watchCreator(){const open=!creator.classList.contains('hidden');if(open&&!creatorOpen)fillName();creatorOpen=open;}
 new MutationObserver(watchCreator).observe(creator,{attributes:true,attributeFilter:['class']});watchCreator();
 el('start-run').addEventListener('click',()=>{if(!el('run-name').value.trim())fillName();},true);
 const dialog=document.createElement('dialog');dialog.id='stair-confirm';dialog.setAttribute('aria-labelledby','stair-confirm-title');dialog.setAttribute('aria-describedby','stair-confirm-text');dialog.innerHTML='<h2 id="stair-confirm-title">Nächste Ebene</h2><p id="stair-confirm-text"></p><div class="actions"><button type="button" data-stay>Hier bleiben</button><button type="button" data-go>Hinabsteigen</button></div>';document.body.append(dialog);
 let latch=null,pending=null,tiles=null,baseInteract=null,scheduled=false;
 const visible=()=>!game.classList.contains('hidden');
 const key=()=>stairKey(state,visible());
 function blocked(){return !!document.querySelector('dialog[open]:not(#stair-confirm),.tutorial-modal:not(.hidden),.levelup-choice,#levelup-overlay:not(.hidden),#floor-overlay:not(.hidden),#death-screen:not(.hidden),#session-pause:not([hidden]),#preparation-shop:not([hidden])');}
 function cancel(){pending=null;if(dialog.open)dialog.close();if(visible())el('stage')?.focus();}
 controls={dialog,cancel};
 dialog.querySelector('[data-stay]').onclick=cancel;
 dialog.addEventListener('cancel',e=>{e.preventDefault();cancel();});
 dialog.querySelector('[data-go]').onclick=()=>{const ticket=pending;if(!ticket||key()!==ticket.key||state.world.tiles!==ticket.tiles||blocked()||!baseInteract){cancel();return;}pending=null;dialog.close();baseInteract();if(state.world.depth===ticket.depth+1)latch=null;if(visible())el('stage')?.focus();};
 function check(){scheduled=false;if(tiles!==state.world.tiles){tiles=state.world.tiles;latch=null;if(dialog.open)cancel();}const current=key();if(!current){latch=null;if(dialog.open)cancel();return;}if(dialog.open){if(pending?.key!==current||blocked())cancel();return;}if(current===latch||blocked()||!baseInteract)return;latch=current;pending={key:current,depth:state.world.depth,tiles:state.world.tiles};el('stair-confirm-text').textContent=`Möchtest du auf Ebene ${state.world.depth+1} hinabsteigen?`;dialog.showModal();dialog.querySelector('[data-stay]').focus();}
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(check);}}
 queueMicrotask(()=>{const api=window.__rpg;if(!api||typeof api.move!=='function'||typeof api.interact!=='function'){console.warn('Treppenabfrage: Spiel-API nicht verfügbar.');return;}const move=api.move.bind(api);baseInteract=api.interact.bind(api);api.move=(...args)=>{if(dialog.open)return;const result=move(...args);check();return result;};api.interact=(...args)=>{if(dialog.open)return;const t=state.world.stairs;if(t&&state.player.x===t.x&&state.player.y===t.y){check();return;}return baseInteract(...args);};schedule();});
 el('stage').addEventListener('click',e=>{const t=state.world.stairs;if(visible()&&t&&state.player.x===t.x&&state.player.y===t.y){e.preventDefault();e.stopImmediatePropagation();check();}},true);
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','open']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
