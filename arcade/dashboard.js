
'use strict';
(async()=>{
 const $=id=>document.getElementById(id);
 const buttons=[...document.querySelectorAll('.game-option')];
 let games;
 try{
  const response=await fetch('arcade/games.json?v=1.1.0');
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  games=await response.json();
  if(games.length!==buttons.length)throw new Error('Spieleliste stimmt nicht mit HTML überein.');
 }catch(error){
  $('preview-status').textContent='Die Auswahl konnte nicht geladen werden. Direkte Spielverknüpfungen stehen unten.';
  const links=document.createElement('p');
  links.className='direct-links';
  const fallback=[
   ['Schattengruft','rpg/'],['Pip-Boy','PipBoy3000/'],
   ['UFO-Jagd','ufo/'],['Nachtfahrt','night/'],
   ['Garage & Drive','game/car-workshop/']
  ];
  fallback.forEach(([label,path],index)=>{
   if(index)links.append(' · ');
   const a=document.createElement('a');a.href=path;a.textContent=label;
   links.append(a);
  });
  $('games').append(links);
  console.error('Dashboard:',error);
  return;
 }
 let index=0,timer=null;
 function preview(){
  clearTimeout(timer);
  $('preview-slot').replaceChildren();
  if(document.hidden)return;
  const selected=index;
  timer=setTimeout(()=>{
   if(document.hidden||selected!==index)return;
   const frame=document.createElement('iframe');
   frame.title='Startseitenvorschau: '+games[index].title;
   frame.setAttribute('sandbox','');
   frame.setAttribute('tabindex','-1');
   frame.setAttribute('aria-hidden','true');
   frame.setAttribute('referrerpolicy','no-referrer');
   frame.src='arcade/previews/'+games[index].id+'.html';
   $('preview-slot').append(frame);
  },180);
 }
 function select(next){
  index=(next+games.length)%games.length;
  const game=games[index];
  $('game-title').textContent=game.title;
  $('game-category').textContent=game.category;
  $('game-description').textContent=game.description;
  $('play').href=game.path;
  $('play').setAttribute('aria-label',game.title+' spielen');
  $('counter').textContent=String(index+1).padStart(2,'0')+' / '+String(games.length).padStart(2,'0');
  buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  preview();
 }
 buttons.forEach((button,i)=>button.addEventListener('click',()=>select(i)));
 $('previous').addEventListener('click',()=>select(index-1));
 $('next').addEventListener('click',()=>select(index+1));
 document.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  if(!event.target.closest('.library'))return;
  if(event.target.closest('input,textarea,select,[contenteditable=true]'))return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
   event.preventDefault();
   select(index+(event.key==='ArrowRight'?1:-1));
   buttons[index].focus({preventScroll:true});
  }
 });
 let touch=null;
 $('preview').addEventListener('touchstart',event=>{
  touch={x:event.touches[0].clientX,y:event.touches[0].clientY};
 },{passive:true});
 $('preview').addEventListener('touchcancel',()=>{touch=null;},{passive:true});
 $('preview').addEventListener('touchend',event=>{
  if(!touch)return;
  const dx=event.changedTouches[0].clientX-touch.x;
  const dy=event.changedTouches[0].clientY-touch.y;
  touch=null;
  if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)select(index+(dx<0?1:-1));
 },{passive:true});
 document.addEventListener('visibilitychange',preview);
 select(0);
})();
