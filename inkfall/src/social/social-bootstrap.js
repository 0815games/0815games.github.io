(() => {
'use strict';
function socialIcon(){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('if-social-icon');
 for(const [tag,attrs] of [['circle',{cx:'9',cy:'7',r:'3'}],['path',{d:'M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 5v3'}]]){
  const part=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [key,value] of Object.entries(attrs))part.setAttribute(key,value);
  svg.append(part);
 }
 return svg;
}
function start(){
 if(window.inkfallSocial)return;
 const frame=document.getElementById('inkfall-window');if(!frame)return;
 const config=window.INKFALL_SOCIAL_CONFIG||{};
 const client=InkfallSocialClient.create({db:typeof db!=='undefined'?db:null,enabled:config.enabled===true,actions:config.actions||{}});
 const store=InkfallSocialStore.create(client);
 const ui=InkfallSocialUI.create({document,window,store,inspector:InkfallCharacterInspector,skills:typeof TREE!=='undefined'?TREE:[]});
 const buttons=[];
 function mountButtons(){
  const actions=document.getElementById('if-top-actions');
  if(actions&&!actions.querySelector('[data-social-entry]')){
   const b=document.createElement('button');b.type='button';b.className='if-top-action';b.dataset.socialEntry='top';
   const label=document.createElement('span');label.textContent='Freunde';b.append(socialIcon(),label);b.onclick=()=>ui.open(b);actions.append(b);buttons.push(b);
  }
  const coop=document.getElementById('if-coop');
  if(coop&&!document.querySelector('[data-social-entry="menu"]')){
   const b=document.createElement('button');b.type='button';b.className='if-mode-card if-mode-friends';b.dataset.socialEntry='menu';
   const emblem=document.createElement('span');emblem.className='if-mode-icon';emblem.setAttribute('aria-hidden','true');emblem.append(socialIcon());
   const copy=document.createElement('span');copy.className='if-mode-copy';
   const title=document.createElement('strong');title.textContent='Freunde';
   const description=document.createElement('small');description.textContent='Gefährten finden. Zusammen die Bastion verteidigen.';copy.append(title,description);
   const arrow=document.createElement('span');arrow.className='if-mode-arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
   b.append(emblem,copy,arrow);b.onclick=()=>ui.open(b);coop.after(b);buttons.push(b);
  }
  for(let i=buttons.length-1;i>=0;i--)if(!buttons[i].isConnected)buttons.splice(i,1);
  const signedIn=typeof auth!=='undefined'&&!!auth.currentUser;buttons.forEach(b=>{b.disabled=!signedIn;});
 }
 const observer=new MutationObserver(mountButtons);observer.observe(frame,{childList:true,subtree:true});mountButtons();
 const unsubscribe=typeof auth!=='undefined'?auth.onAuthStateChanged(user=>{store.setUser(user?.uid||null);mountButtons();}):()=>{};
 window.inkfallSocial={open:()=>ui.open(),destroy(){observer.disconnect();unsubscribe();ui.destroy();store.destroy();buttons.forEach(b=>b.remove());delete window.inkfallSocial;}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
