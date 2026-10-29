import {state} from '../core/state.js';
import {cloud} from './firebase.js';
import {normalizeWorldLists} from './world-list-compat.js';
function direction(dx,dy){if(Math.hypot(dx,dy)<12)return null;return Math.abs(dx)>=Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)];}
function setup(){
 const el=id=>document.getElementById(id),stage=el('stage'),game=el('game'),audio=el('audio-settings-button');let enabled=false,gesture=null,timer=null;
 const style=document.createElement('style');style.textContent=`
#game header{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}#game .hud-left,#game .right{min-width:0}#game #hud-slot-name,#game #sound{display:none!important}
#game header>.bars{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;gap:10px}#game header>.bars>label{min-width:0;font-size:11px}#game header>.bars>label>i{width:100%;height:12px}#game header>.bars small{font-size:11px;margin-top:5px}
body[data-playing=true] #audio-settings-button{position:static!important;min-width:44px;width:44px;height:44px;padding:0;font-size:0;flex-shrink:0}body[data-playing=true] #audio-settings-button::before{content:'⚙';font-size:22px}
body[data-playing=true] #combat #audio-settings-button{position:absolute!important;right:12px;top:10px}#combat h2{padding-right:48px}#stage{touch-action:none;-webkit-user-select:none;user-select:none}
`;document.head.append(style);
 function placeAudio(){const playing=!game.classList.contains('hidden');document.body.dataset.playing=String(playing);const combat=el('combat'),parent=playing?(!combat.classList.contains('hidden')?combat:game.querySelector('.right')):document.body;if(audio&&audio.parentElement!==parent)parent.append(audio);if(audio)audio.title='Audioeinstellungen';}
 new MutationObserver(placeAudio).observe(game,{attributes:true,attributeFilter:['class']});new MutationObserver(placeAudio).observe(el('combat'),{attributes:true,attributeFilter:['class']});placeAudio();
 const blocked=()=>!!document.querySelector('dialog[open],.tutorial-modal:not(.hidden),.levelup-choice,#floor-overlay:not(.hidden),#levelup-overlay:not(.hidden),#death-screen:not(.hidden),#session-pause:not([hidden]),#preparation-shop:not([hidden])');
 const ready=()=>enabled&&!document.hidden&&navigator.onLine&&!game.classList.contains('hidden')&&state.user?.uid===cloud.auth?.currentUser?.uid&&!!state.user?.uid&&state.player.hp>0&&!state.inCombat&&!state.player.needsPreparation&&!blocked();
 function stop(){const old=gesture;gesture=null;clearTimeout(timer);timer=null;if(old)try{if(stage.hasPointerCapture(old.id))stage.releasePointerCapture(old.id);}catch{}}
 function step(){timer=null;const g=gesture;if(!g||!g.dir)return;if(!ready()||state.currentSlot!==g.slot||state.user.uid!==g.uid||state.world.tiles!==g.tiles||state.world.depth!==g.depth){stop();return;}const x=state.player.x,y=state.player.y;try{normalizeWorldLists(state.world);window.__rpg.move(...g.dir);}catch(error){stop();console.error('Bewegung gestoppt:',error);window.dispatchEvent(new ErrorEvent('error',{message:'Bewegung gestoppt: '+(error?.message||String(error)),error}));return;}if(!ready()||(x===state.player.x&&y===state.player.y)){stop();return;}if(gesture===g)timer=setTimeout(step,180);}
 window.addEventListener('pointerdown',e=>{if(e.target!==stage)return;e.preventDefault();e.stopImmediatePropagation();stop();if(!ready()||!e.isPrimary||e.pointerType==='mouse')return;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,dir:null,slot:state.currentSlot,uid:state.user.uid,tiles:state.world.tiles,depth:state.world.depth};try{stage.setPointerCapture(e.pointerId);}catch{stop();}},{capture:true,passive:false});
 window.addEventListener('pointermove',e=>{const g=gesture;if(!g||g.id!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();const r=stage.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){stop();return;}g.dir=direction(e.clientX-g.x,e.clientY-g.y);if(!g.dir){clearTimeout(timer);timer=null;}else if(timer===null)step();},{capture:true,passive:false});
 for(const event of ['pointerup','pointercancel'])window.addEventListener(event,e=>{if(e.target===stage||gesture?.id===e.pointerId){e.preventDefault();e.stopImmediatePropagation();if(gesture?.id===e.pointerId)stop();}},{capture:true,passive:false});
 stage.addEventListener('lostpointercapture',stop);
 window.addEventListener('click',e=>{if(e.target===stage){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,passive:false});
 for(const event of ['touchstart','touchmove','touchend','touchcancel'])window.addEventListener(event,e=>{if(e.target===stage){e.preventDefault();e.stopImmediatePropagation();if(event==='touchend'||event==='touchcancel')stop();}},{capture:true,passive:false});
 window.addEventListener('blur',stop);window.addEventListener('resize',stop);window.addEventListener('offline',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 new MutationObserver(()=>{if(gesture&&!ready())stop();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open']});
 let attempts=0;
 async function boot(){if(!window.__rpg?.move||!window.__rpg?.interact){if(++attempts<100)setTimeout(boot,50);else console.warn('Spiel-API fehlt: Haltebewegung bleibt deaktiviert.');return;}try{await import('./journey-ui.js?v=0.5.3');await import('./stair-audio.js?v=0.5.4');enabled=true;}catch(error){console.warn('Spielintegration fehlgeschlagen:',error);}}
 setTimeout(boot,0);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
