import { state } from '../core/state.js';
const stage=document.getElementById('stage');
let start=null;
const api=()=>window.__rpg;
const ready=()=>api()&&!state.inCombat&&!document.getElementById('game').classList.contains('hidden')&&document.getElementById('death-screen').classList.contains('hidden')&&document.getElementById('floor-overlay').classList.contains('hidden')&&document.getElementById('levelup-overlay').classList.contains('hidden');
if(stage){
 stage.addEventListener('pointerdown',e=>{if(!ready()||!e.isPrimary)return;start={x:e.clientX,y:e.clientY,id:e.pointerId};stage.setPointerCapture(e.pointerId);e.preventDefault();},{passive:false});
 stage.addEventListener('pointerup',e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(!ready())return;if(Math.hypot(dx,dy)>30){if(Math.abs(dx)>Math.abs(dy))api().move(Math.sign(dx),0);else api().move(0,Math.sign(dy));}});
 stage.addEventListener('pointercancel',()=>{start=null;});
}
addEventListener('pointerdown',e=>{if(e.target!==stage)start=null;},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)start=null;});
