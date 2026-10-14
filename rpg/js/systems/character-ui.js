import { cloud } from './firebase.js';
import { sound } from './audio.js';
import { CLASSES } from '../core/state.js';
import { drawCharacter } from '../world/character.js';
let slots=[];
const load=cloud.loadAllSlots;
cloud.loadAllSlots=async function(...args){const result=await load.apply(this,args);slots=result;return result;};
function setup(){
 const intro=document.getElementById('intro-screen'),login=document.getElementById('login-screen');
 let entered=false,gesture=null;
 const keep=()=>{if(!entered){intro.classList.remove('hidden');login.classList.add('hidden');}};
 new MutationObserver(keep).observe(intro,{attributes:true,attributeFilter:['class']});
 const enter=()=>{if(entered)return;entered=true;intro.classList.add('hidden');login.classList.remove('hidden');sound.resume();sound.startMusic();};
 intro.addEventListener('pointerdown',e=>{if(e.isPrimary)gesture={x:e.clientX,y:e.clientY,id:e.pointerId};});
 intro.addEventListener('pointercancel',()=>gesture=null);
 intro.addEventListener('pointerup',e=>{if(gesture&&gesture.id===e.pointerId&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<12)enter();gesture=null;});
 intro.addEventListener('click',e=>{e.stopImmediatePropagation();if(e.detail===0)enter();},true);
 window.addEventListener('keydown',e=>{if(!entered&&e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();enter();}},true);
 const css=document.createElement('style');css.textContent='.hero-preview{display:block;width:112px;height:112px;margin:8px auto;image-rendering:pixelated;background:radial-gradient(ellipse,#272238,transparent 70%);pointer-events:none}.class .hero-preview{width:88px;height:88px}';document.head.append(css);
 const preview=(parent,p)=>{const cv=document.createElement('canvas');cv.width=128;cv.height=128;cv.className='hero-preview';cv.setAttribute('role','img');cv.setAttribute('aria-label',`${p.name||CLASSES[p.heroClass]?.title||'Recke'} mit ausgerüsteter Kleidung und Waffen`);drawCharacter(cv.getContext('2d'),p,16,12,96);parent.prepend(cv);};
 const grid=document.getElementById('slots-grid');
 const render=()=>{Array.from(grid.children).forEach((box,i)=>{if(!box.classList.contains('empty')&&!box.querySelector('.hero-preview')&&slots[i]?.player)preview(box,slots[i].player);});};
 new MutationObserver(render).observe(grid,{childList:true});
 document.querySelectorAll('.class').forEach(button=>{const id=button.dataset.class,c=CLASSES[id];if(c)preview(button,{heroClass:id,equipped:{body:c.armor,mainhand:c.weapon}});});
 render();keep();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
