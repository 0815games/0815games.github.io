
'use strict';
function portalOffset(index,active,count){return ((index-active+Math.floor(count/2)+count)%count)-Math.floor(count/2);}
(()=>{
 const games=JSON.parse(document.getElementById('portal-data').textContent);
 const $=id=>document.getElementById(id);
 const portals=[...document.querySelectorAll('.portal')];
 const tabs=[...document.querySelectorAll('[data-select]')];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 let current=0,departing=false,touch=null;
 function finishBoot(){document.documentElement.classList.remove('boot-rift');$('boot').setAttribute('inert','');}
 $('skip-boot').addEventListener('click',finishBoot);
 if(reduce.matches)finishBoot();else setTimeout(finishBoot,900);
 function select(next,focus=false){
  if(departing)return;
  current=(next+games.length)%games.length;
  const game=games[current];
  document.documentElement.style.setProperty('--tone',game.accent);
  portals.forEach((portal,index)=>{
   const offset=portalOffset(index,current,games.length),active=index===current;
   portal.style.setProperty('--offset',offset);
   portal.style.setProperty('--depth',Math.abs(offset));
   portal.style.setProperty('--opacity',active?'1':Math.abs(offset)===1?'.42':'.12');
   portal.style.setProperty('--z',String(10-Math.abs(offset)));
   portal.classList.toggle('is-active',active);
   portal.classList.toggle('paused',document.hidden);
   portal.style.setProperty('--rx','0deg');portal.style.setProperty('--ry','0deg');
  });
  tabs.forEach((tab,index)=>tab.setAttribute('aria-pressed',String(index===current)));
  $('world-category').textContent=game.category;
  $('world-title').textContent=game.title;
  $('world-copy').textContent=game.copy||game.description;
  $('play').href=game.path;
  $('play').setAttribute('aria-label',game.title+' betreten');
  $('counter').textContent=String(current+1).padStart(2,'0')+' / '+String(games.length).padStart(2,'0');
  document.body.dataset.world=game.id;
  if(focus)tabs[current].focus({preventScroll:true});
 }
 tabs.forEach((button,index)=>button.addEventListener('click',()=>select(index)));
 $('previous').addEventListener('click',()=>select(current-1));
 $('next').addEventListener('click',()=>select(current+1));
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape')finishBoot();
  if(event.altKey||event.ctrlKey||event.metaKey||departing)return;
  if(event.target.closest('input,textarea,select,[contenteditable=true],.themes'))return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
   event.preventDefault();finishBoot();select(current+(event.key==='ArrowRight'?1:-1),true);
  }
 });
 $('vault').addEventListener('pointermove',event=>{
  if(!fine.matches||reduce.matches||departing)return;
  const rect=$('vault').getBoundingClientRect();
  const x=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1));
  const y=Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1));
  portals[current].style.setProperty('--ry',(x*5)+'deg');
  portals[current].style.setProperty('--rx',(-y*3)+'deg');
 });
 $('vault').addEventListener('pointerleave',()=>{
  portals[current].style.setProperty('--ry','0deg');portals[current].style.setProperty('--rx','0deg');
 });
 $('vault').addEventListener('touchstart',event=>{touch={x:event.touches[0].clientX,y:event.touches[0].clientY};},{passive:true});
 $('vault').addEventListener('touchcancel',()=>{touch=null;},{passive:true});
 $('vault').addEventListener('touchend',event=>{
  if(!touch)return;const dx=event.changedTouches[0].clientX-touch.x,dy=event.changedTouches[0].clientY-touch.y;touch=null;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)select(current+(dx<0?1:-1));
 },{passive:true});
 $('play').addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||reduce.matches)return;
  if(departing){event.preventDefault();return;}
  event.preventDefault();departing=true;finishBoot();
  const destination=$('play').href;
  document.documentElement.classList.add('departing');
  $('play').setAttribute('aria-disabled','true');
  setTimeout(()=>location.assign(destination),780);
 });
 window.addEventListener('pageshow',()=>{departing=false;document.documentElement.classList.remove('departing');$('play').removeAttribute('aria-disabled');});
 document.addEventListener('visibilitychange',()=>portals.forEach(portal=>portal.classList.toggle('paused',document.hidden)));
 reduce.addEventListener('change',()=>{if(reduce.matches)finishBoot();});
 select(0);
})();
