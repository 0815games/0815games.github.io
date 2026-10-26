
'use strict';
(()=>{
 const data=JSON.parse(document.getElementById('world-data').textContent);
 const $=id=>document.getElementById(id);
 const cards=[...document.querySelectorAll('[data-world]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let index=0,sequence=0;
 function select(next){
  index=(next+data.length)%data.length;
  const game=data[index],ticket=++sequence;
  $('hero-title').textContent=game.headline;
  $('category').textContent=game.category;
  $('chapter').textContent=game.chapter;
  $('description').textContent=game.copy;
  $('game-name').textContent=game.title;
  $('play').href=game.path;
  $('play').setAttribute('aria-label',game.title+' beginnen');
  $('count').textContent=String(index+1).padStart(2,'0')+' / '+String(data.length).padStart(2,'0');
  document.documentElement.style.setProperty('--accent',game.accent);
  cards.forEach((card,i)=>card.setAttribute('aria-pressed',String(i===index)));
  const image=new Image();
  const hero=document.querySelector('.hero');
  hero.classList.add('switching');
  image.onload=()=>{
   if(ticket!==sequence)return;
   $('landscape').src=image.src;
   requestAnimationFrame(()=>hero.classList.remove('switching'));
  };
  image.onerror=()=>{if(ticket===sequence)hero.classList.remove('switching');};
  image.src='arcade/art/'+game.id+'.svg';
 }
 cards.forEach((card,i)=>card.addEventListener('click',()=>select(i)));
 $('prev').addEventListener('click',()=>select(index-1));
 $('next').addEventListener('click',()=>select(index+1));
 document.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==='Escape')document.documentElement.classList.remove('arriving');
  if(event.target.closest('input,textarea,select,[contenteditable=true],.themes'))return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
   event.preventDefault();
   select(index+(event.key==='ArrowRight'?1:-1));
   cards[index].focus({preventScroll:true});
   cards[index].scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest',inline:'nearest'});
  }
 });
 let touch=null;
 const hero=document.querySelector('.hero');
 hero.addEventListener('touchstart',event=>{
  if(event.target.closest('a,button'))return;
  touch={x:event.touches[0].clientX,y:event.touches[0].clientY};
 },{passive:true});
 hero.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
 hero.addEventListener('touchend',event=>{
  if(!touch)return;
  const dx=event.changedTouches[0].clientX-touch.x;
  const dy=event.changedTouches[0].clientY-touch.y;
  touch=null;
  if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)select(index+(dx<0?1:-1));
 },{passive:true});
 for(const game of data){const image=new Image();image.src='arcade/art/'+game.id+'.svg';}
 setTimeout(()=>document.documentElement.classList.remove('arriving'),650);
})();
