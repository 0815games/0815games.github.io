// [2026-10-12 14:31] - v0.0.9: Tastatur- und Touch-Joysticksteuerung; untere Aktionsleiste entfernt.
import {state} from './state.js';import {eventBus} from './eventBus.js';
export function initInput(){let lastMove=0;function move(dx,dy){if(state.isInputLocked||state.inCombat||state.inShop)return;const now=performance.now();if(now-lastMove<105)return;lastMove=now;eventBus.emit('player:move',{dx,dy});}
 window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='escape'&&state.inShop){eventBus.emit('shop:close_request');return;}if(k==='e'||k===' '){if(state.isInputLocked||state.inCombat||state.inShop)return;e.preventDefault();eventBus.emit('player:interact');return;}const dirs={w:[0,-1],arrowup:[0,-1],s:[0,1],arrowdown:[0,1],a:[-1,0],arrowleft:[-1,0],d:[1,0],arrowright:[1,0]};if(dirs[k]){e.preventDefault();move(...dirs[k]);}});
 document.querySelectorAll('.touch-key[data-dx]').forEach(btn=>{const press=e=>{e.preventDefault();move(Number(btn.dataset.dx),Number(btn.dataset.dy));};btn.addEventListener('pointerdown',press);btn.addEventListener('contextmenu',e=>e.preventDefault());});
 const action=document.querySelector('.touch-key[data-action="interact"]');action?.addEventListener('pointerdown',e=>{e.preventDefault();eventBus.emit('player:interact');});
}
