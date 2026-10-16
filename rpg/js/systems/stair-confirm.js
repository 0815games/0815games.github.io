import {state} from '../core/state.js';
function install(){
 const game=document.getElementById('game'),id='stair-confirm';if(!game||document.getElementById(id))return;
 const el=id=>document.getElementById(id),stage=el('stage');if(!stage)return;
 const legacy=document.getElementById('stair-confirm');if(legacy&&legacy!==undefined&&legacy.id===id)legacy.remove();
 const dialog=document.createElement('dialog');dialog.id=id;dialog.className='stair-confirm';dialog.setAttribute('aria-labelledby','stair-confirm-title');dialog.setAttribute('aria-describedby','stair-confirm-text');
 dialog.innerHTML='<form method="dialog"><h2 id="stair-confirm-title">⬇️ TREPPE GEFUNDEN</h2><p id="stair-confirm-text">Möchtest du zur nächsten Ebene hinabsteigen?</p><div class="stair-actions"><button id="stair-descend" type="submit" value="descend" autofocus>⬇️ Absteigen</button><button id="stair-stay" type="submit" value="stay">🚪 Hier bleiben</button></div></form>';
 game.append(dialog);
 const style=document.createElement('style');style.id=id+'-style';style.textContent='#stair-confirm{position:fixed;inset:0;width:100dvw;max-width:100dvw;height:100dvh;max-height:100dvh;margin:0;border:0;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));background:#05060af2;color:#fff;overflow:hidden}#stair-confirm::backdrop{background:#05060ae6}#stair-confirm form{display:flex;flex-direction:column;justify-content:center;width:min(420px,100%);max-width:100%;max-height:100%;margin:auto;padding:20px;background:#111420;border:2px solid #c99c42;border-radius:16px;box-shadow:0 20px 60px #000c;text-align:center;overflow:auto}#stair-confirm h2{margin:0 0 8px;color:#ffd54f;font-size:20px;line-height:1.3;overflow-wrap:anywhere}#stair-confirm p{margin:0 0 16px;color:#e8e4d9;font-size:14px;line-height:1.5;overflow-wrap:anywhere}#stair-confirm .stair-actions{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;margin-top:auto}#stair-confirm button{width:100%;min-width:0;min-height:52px;padding:12px;border:1px solid #c99c42;border-radius:12px;background:#24293c;color:#fff;font:inherit;font-weight:600;overflow-wrap:anywhere;touch-action:manipulation}#stair-confirm #stair-descend{background:#c99c42;color:#111}#stair-confirm button:focus-visible{outline:3px solid #ffe082;outline-offset:2px}@media(min-width:480px){#stair-confirm .stair-actions{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){#stair-confirm{transition:none}}';document.head.append(style);
 let descend=null,interact=null;
 function open(){if(dialog.open||state.inCombat)return;dialog.returnValue='';dialog.showModal();el('stair-descend').focus({preventScroll:true});}
 function close(result){if(!dialog.open)return;dialog.returnValue=result;dialog.close(result);}
 dialog.addEventListener('cancel',e=>{e.preventDefault();close('stay');});
 dialog.addEventListener('close',()=>{const result=dialog.returnValue||'stay';if(result==='descend'&&typeof descend==='function'){const operation=descend();descend=null;Promise.resolve(operation).catch(error=>console.warn('Treppenabstieg:',error));}else descend=null;});
 el('stair-stay').addEventListener('click',()=>close('stay'));
 const api=window.__rpg||(window.__rpg={});interact=api.interact;
 api.interact=function(){const stairs=state.world?.stairs;if(!stairs||state.player?.x!==stairs.x||state.player?.y!==stairs.y)return interact?.call(this);if(dialog.open)return;descend=interact?.bind(this);open();};
 stage.addEventListener('click',e=>{if(!dialog.open)return;e.preventDefault();e.stopImmediatePropagation();},true);
 new MutationObserver(()=>{if(dialog.open&&state.inCombat)close('stay');}).observe(game,{attributes:true,attributeFilter:['class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});else setTimeout(install,0);
