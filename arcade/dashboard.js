
'use strict';
(async()=>{
 const $=id=>document.getElementById(id);
 let games;
 try{
  const response=await fetch('arcade/games.json?v=1.0.0');
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  games=await response.json();
 }catch(error){
  $('preview-status').textContent='AUSWAHL NICHT GELADEN';
  console.error('Arcade:',error);
  return;
 }
 const cards=[...document.querySelectorAll('.cartridge')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let index=0,timer=null,hidden=false;
 function loadPreview(){
  clearTimeout(timer);
  $('preview-slot').replaceChildren();
  $('preview-status').textContent='VORSCHAU';
  if(hidden)return;
  const selected=index;
  timer=setTimeout(()=>{
   if(selected!==index||hidden)return;
   const frame=document.createElement('iframe');
   frame.title='Startseitenvorschau: '+games[index].title;
   frame.setAttribute('sandbox','');
   frame.setAttribute('tabindex','-1');
   frame.setAttribute('aria-hidden','true');
   frame.setAttribute('referrerpolicy','no-referrer');
   frame.src='arcade/previews/'+games[index].id+'.html';
   frame.addEventListener('load',()=>{
    if(selected===index)$('preview-status').textContent='ORIGINAL · OHNE SPIELSKRIPTE';
   },{once:true});
   frame.addEventListener('error',()=>{
    if(selected===index)$('preview-status').textContent='VORSCHAU NICHT VERFÜGBAR';
   },{once:true});
   $('preview-slot').append(frame);
  },250);
 }
 function select(next,scroll=true){
  index=(next+games.length)%games.length;
  const game=games[index];
  document.documentElement.style.setProperty('--accent',game.color);
  for(const id of ['game-title','scene-title'])$(id).textContent=game.title;
  for(const id of ['game-category','scene-category'])$(id).textContent=game.category;
  $('game-description').textContent=game.description;
  $('scene-icon').textContent=game.icon;
  $('play').href=game.path;
  $('play').setAttribute('aria-label',game.title+' starten');
  $('counter').textContent=String(index+1).padStart(2,'0')+' / '+String(games.length).padStart(2,'0');
  cards.forEach((card,i)=>card.setAttribute('aria-pressed',String(i===index)));
  if(scroll){
   const rail=$('rail'),card=cards[index];
   rail.scrollTo({
    left:card.offsetLeft-rail.offsetLeft-(rail.clientWidth-card.offsetWidth)/2,
    behavior:reduced.matches?'auto':'smooth'
   });
  }
  loadPreview();
 }
 cards.forEach((card,i)=>card.addEventListener('click',()=>select(i)));
 $('previous').addEventListener('click',()=>select(index-1));
 $('next').addEventListener('click',()=>select(index+1));
 document.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.target.closest('input,textarea,select,[contenteditable=true]'))return;
  if(event.key==='ArrowLeft'){event.preventDefault();select(index-1);}
  if(event.key==='ArrowRight'){event.preventDefault();select(index+1);}
 });
 let touch=null;
 $('rail').addEventListener('touchstart',event=>{
  touch=event.touches[0].clientX;
 },{passive:true});
 $('rail').addEventListener('touchend',event=>{
  if(touch===null)return;
  const delta=event.changedTouches[0].clientX-touch;
  touch=null;
  if(Math.abs(delta)>55)select(index+(delta<0?1:-1));
 },{passive:true});
 document.addEventListener('visibilitychange',()=>{
  hidden=document.hidden;
  loadPreview();
 });
 select(0,false);
})();
