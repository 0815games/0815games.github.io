
'use strict';
(()=>{
 const key='pipboy3003.dashboard.theme';
 const media=matchMedia('(prefers-color-scheme: dark)');
 let choice='system';
 try{
  const saved=localStorage.getItem(key);
  if(['system','light','dark'].includes(saved))choice=saved;
 }catch{}
 function apply(){
  const theme=choice==='system'?(media.matches?'dark':'light'):choice;
  document.documentElement.dataset.theme=theme;
  document.documentElement.style.colorScheme=theme;
  document.querySelectorAll('[data-theme-choice]').forEach(button=>{
   button.setAttribute('aria-pressed',String(button.dataset.themeChoice===choice));
  });
 }
 apply();
 media.addEventListener('change',()=>{if(choice==='system')apply();});
 document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-theme-choice]').forEach(button=>{
   button.addEventListener('click',()=>{
    choice=button.dataset.themeChoice;
    try{
     if(choice==='system')localStorage.removeItem(key);
     else localStorage.setItem(key,choice);
    }catch{}
    apply();
   });
  });
  apply();
 },{once:true});
})();
