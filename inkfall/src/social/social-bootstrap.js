(() => {
'use strict';
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
  if(actions&&!actions.querySelector('[data-social-entry]')){const b=document.createElement('button');b.type='button';b.className='if-top-action';b.dataset.socialEntry='top';const label=document.createElement('span');label.textContent='Freunde';b.append(label);b.onclick=()=>ui.open(b);actions.append(b);buttons.push(b);}
  const coop=document.getElementById('if-coop');
  if(coop&&!document.querySelector('[data-social-entry="menu"]')){const b=document.createElement('button');b.type='button';b.className='if-mode-card';b.dataset.socialEntry='menu';b.textContent='Freunde';b.onclick=()=>ui.open(b);coop.after(b);buttons.push(b);}
  for(let i=buttons.length-1;i>=0;i--)if(!buttons[i].isConnected)buttons.splice(i,1);
  const signedIn=typeof auth!=='undefined'&&!!auth.currentUser;buttons.forEach(b=>{b.disabled=!signedIn;});
 }
 const observer=new MutationObserver(mountButtons);observer.observe(frame,{childList:true,subtree:true});mountButtons();
 const unsubscribe=typeof auth!=='undefined'?auth.onAuthStateChanged(user=>{store.setUser(user?.uid||null);mountButtons();}):()=>{};
 window.inkfallSocial={open:()=>ui.open(),destroy(){observer.disconnect();unsubscribe();ui.destroy();store.destroy();buttons.forEach(b=>b.remove());delete window.inkfallSocial;}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
