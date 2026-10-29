import {state} from '../core/state.js';
function install(){
 const el=id=>document.getElementById(id),game=el('game'),stage=el('stage');
 if(!game||!stage||document.getElementById('stair-confirm'))return;
 const dialog=document.createElement('dialog');dialog.id='stair-confirm';dialog.setAttribute('aria-labelledby','stair-confirm-title');dialog.setAttribute('aria-describedby','stair-confirm-text');
 dialog.innerHTML='<div class="stair-card"><h2 id="stair-confirm-title">⬇️ TREPPE GEFUNDEN</h2><p id="stair-confirm-text"></p><div class="stair-actions"><button id="stair-descend" type="button" autofocus>⬇️ Absteigen</button><button id="stair-stay" type="button">🚪 Hier bleiben</button></div></div>';
 document.body.append(dialog);
 const style=document.createElement('style');style.textContent=`
#stair-confirm,#stair-confirm *{box-sizing:border-box}
#stair-confirm{position:fixed;inset:0;margin:0;width:100%;max-width:100%;height:100dvh;max-height:100dvh;border:0;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:#05060af2;color:#fff;overflow:auto}
#stair-confirm[open]{display:grid;place-items:center}
#stair-confirm::backdrop{background:#05060ae6}
#stair-confirm .stair-card{width:min(420px,100%);min-width:0;max-height:100%;overflow:auto;padding:20px;background:#111420;border:2px solid #c99c42;border-radius:16px;text-align:center;box-shadow:0 20px 60px #000c}
#stair-confirm h2{margin:0 0 8px;color:#ffd54f;font-size:20px;overflow-wrap:anywhere}
#stair-confirm p{margin:0 0 16px;line-height:1.5;overflow-wrap:anywhere}
#stair-confirm .stair-actions{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
#stair-confirm button{width:100%;min-width:0;min-height:52px;padding:12px;border:1px solid #c99c42;border-radius:12px;background:#24293c;color:#fff;font:inherit;overflow-wrap:anywhere;touch-action:manipulation}
#stair-confirm #stair-descend{background:#c99c42;color:#111;font-weight:700}
#stair-confirm button:focus-visible{outline:3px solid #ffe082;outline-offset:2px}
@media(min-width:480px){#stair-confirm .stair-actions{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;document.head.append(style);
 const go=dialog.querySelector('#stair-descend'),stay=dialog.querySelector('#stair-stay'),text=dialog.querySelector('#stair-confirm-text');
 let latch=null,pending=null,tiles=null,baseInteract=null,scheduled=false;
 const visible=()=>!game.classList.contains('hidden');
 function key(){const w=state.world,p=state.player,t=w?.stairs;if(!visible()||!state.user?.uid||state.inCombat||p?.needsPreparation||!(p?.hp>0)||!t||!Array.isArray(w.monsters)||w.monsters.length||p.x!==t.x||p.y!==t.y)return null;return `${state.user.uid}:${state.currentSlot}:${w.depth}:${t.x}:${t.y}`;}
 function blocked(){return !!document.querySelector('dialog[open]:not(#stair-confirm),.tutorial-modal:not(.hidden),.levelup-choice,#levelup-overlay:not(.hidden),#floor-overlay:not(.hidden),#death-screen:not(.hidden),#session-pause:not([hidden]),#preparation-shop:not([hidden])');}
 function cancel(){pending=null;if(dialog.open)dialog.close();if(visible())stage.focus({preventScroll:true});}
 stay.onclick=cancel;dialog.addEventListener('cancel',e=>{e.preventDefault();cancel();});
 go.onclick=()=>{const ticket=pending;if(!dialog.open||!ticket||key()!==ticket.key||state.world.tiles!==ticket.tiles||blocked()||!baseInteract){cancel();return;}pending=null;dialog.close();try{const result=baseInteract();Promise.resolve(result).catch(error=>console.error('Treppenabstieg:',error));}finally{if(state.world.depth===ticket.depth+1)latch=null;if(visible())stage.focus({preventScroll:true});}};
 function check(){scheduled=false;if(tiles!==state.world.tiles){tiles=state.world.tiles;latch=null;if(dialog.open)cancel();}const current=key();if(!current){latch=null;if(dialog.open)cancel();return;}if(dialog.open){if(pending?.key!==current||blocked())cancel();return;}if(current===latch||blocked()||!baseInteract)return;latch=current;pending={key:current,depth:state.world.depth,tiles:state.world.tiles};text.textContent=`Möchtest du auf Ebene ${state.world.depth+1} hinabsteigen?`;dialog.showModal();go.focus({preventScroll:true});}
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(check);}}
 window.addEventListener('keydown',e=>{if(!dialog.open)return;e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();cancel();}else if(e.key==='Tab'){e.preventDefault();const buttons=[go,stay],i=buttons.indexOf(document.activeElement);buttons[(i+(e.shiftKey?-1:1)+2)%2].focus();}else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat&&[go,stay].includes(document.activeElement))document.activeElement.click();}else if(e.key.startsWith('Arrow'))e.preventDefault();},true);
 let attempts=0;
 function bind(){const api=window.__rpg;if(!api||typeof api.move!=='function'||typeof api.interact!=='function'){if(++attempts<100)setTimeout(bind,50);else console.error('Treppenabfrage: Spiel-API nicht verfügbar.');return;}const move=api.move.bind(api);baseInteract=api.interact.bind(api);api.move=(...args)=>{if(dialog.open)return;const result=move(...args);check();return result;};api.interact=(...args)=>{if(dialog.open)return;const t=state.world.stairs;if(t&&state.player.x===t.x&&state.player.y===t.y){check();return;}return baseInteract(...args);};schedule();}
 stage.addEventListener('click',e=>{if(key()){e.preventDefault();e.stopImmediatePropagation();check();}},true);
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','open']});
 setTimeout(bind,0);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});else setTimeout(install,0);
