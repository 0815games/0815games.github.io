(() => {
'use strict';
function createRequestTracker(){
 let owner=null,ready=false,previous=new Set();
 return {update(state){
  const uid=state.uid||null;
  if(uid!==owner){owner=uid;ready=false;previous=new Set();}
  if(!uid||!state.available||state.loading)return {count:0,newCount:0};
  const ids=new Set((state.requests||[]).map(item=>item?.uid).filter(id=>typeof id==='string'&&id.length>0));
  const newCount=ready?[...ids].filter(id=>!previous.has(id)).length:0;
  previous=ids;ready=true;return {count:ids.size,newCount};
 }};
}
function createPresenceSession({auth,getDb,loadModule,enabled=false,onError=()=>{}}){
 let running=false,disposed=false,version=0,owner=null,publisher=null,waiting=false,hidden=false,sdkPending=false,sdkNext=null,authOperations=0;
 let offAuth=null,offBefore=null,restoreSignOut=null,stopping=Promise.resolve();
 const report=error=>{try{onError(error);}catch{}};
 const eligible=()=>running&&!disposed&&!hidden&&!sdkPending&&authOperations===0;
 async function safeStop(value){if(!value)return;try{await value.stop();}catch(error){report(error);}}
 function halt(){
  version++;owner=null;waiting=false;const old=publisher;publisher=null;
  stopping=Promise.all([stopping,safeStop(old)]).then(()=>{});return stopping;
 }
 function sync(user,force=false){
  const uid=user?.uid||null;
  if(!eligible()||(auth.currentUser?.uid||null)!==uid)return;
  if(!force&&uid===owner&&(publisher||waiting))return;
  const cleanup=halt(),ticket=version;owner=uid;if(!uid)return;
  waiting=true;
  const valid=()=>eligible()&&ticket===version&&auth.currentUser?.uid===uid;
  Promise.resolve(cleanup).then(async()=>{
   if(!valid())return;
   const module=await loadModule();if(!valid())return;
   if(typeof module?.createPublisher!=='function')throw Error('presence-module-unavailable');
   const value=module.createPublisher({db:getDb(),auth,uid,enabled:true,onError:report});
   if(!valid()){await safeStop(value);return;}
   publisher=value;
   try{if(value.start()===false)throw Error('presence-start-rejected');}
   catch(error){if(publisher===value)publisher=null;await safeStop(value);throw error;}
   if(!valid()){if(publisher===value)publisher=null;await safeStop(value);}
  }).catch(error=>{if(ticket===version){owner=null;report(error);}}).finally(()=>{if(ticket===version)waiting=false;});
 }
 function start(){
  if(running)return true;if(disposed||!enabled)return false;
  running=true;
  if(typeof auth.beforeAuthStateChanged==='function'){
   try{offBefore=auth.beforeAuthStateChanged(next=>{if((next?.uid||null)!==(auth.currentUser?.uid||null)){sdkPending=true;sdkNext=next?.uid||null;return halt();}},()=>{sdkPending=false;sync(auth.currentUser);});}
   catch(error){report(error);}
  }
  const original=auth.signOut,descriptor=Object.getOwnPropertyDescriptor(auth,'signOut');
  const wrapped=function(...args){
   if(!running||disposed)return original.apply(this,args);
   authOperations++;
   return halt().then(()=>original.apply(this,args)).finally(()=>{authOperations--;if(sdkPending&&sdkNext===null){sdkPending=false;}sync(auth.currentUser);});
  };
  try{
   if(typeof original!=='function')throw Error('presence-signout-guard-unavailable');
   auth.signOut=wrapped;if(auth.signOut!==wrapped)throw Error('presence-signout-guard-unavailable');
   restoreSignOut=()=>{if(auth.signOut!==wrapped)return;if(descriptor)Object.defineProperty(auth,'signOut',descriptor);else delete auth.signOut;};
  }catch(error){
   if(!offBefore){running=false;report(error);return false;}
  }
  try{offAuth=auth.onAuthStateChanged(user=>{if(sdkPending&&(user?.uid||null)!==sdkNext)return;sdkPending=false;sync(user);});}
  catch(error){running=false;if(offBefore)offBefore();offBefore=null;if(restoreSignOut)restoreSignOut();restoreSignOut=null;report(error);return false;}
  return true;
 }
 async function destroy(){
  if(disposed)return stopping;running=false;disposed=true;
  if(offAuth)offAuth();offAuth=null;if(offBefore)offBefore();offBefore=null;
  if(restoreSignOut){try{restoreSignOut();}catch(error){report(error);}}restoreSignOut=null;
  await halt();
 }
 return {start,destroy,retry(){sync(auth.currentUser,true);},suspend(){hidden=true;return halt();},resume(){hidden=false;sync(auth.currentUser);},beforeAuthChange:halt};
}
function createPresenceLoader({document:doc,source,getModule=()=>globalThis.InkfallSocialPresence,schedule=setTimeout,cancel=clearTimeout}){
 let loading=null;
 return function load(){
  if(typeof getModule()?.createPublisher==='function')return Promise.resolve(getModule());
  if(loading)return loading;
  if(!source)return Promise.reject(Error('presence-source-unavailable'));
  loading=new Promise((resolve,reject)=>{
   const script=doc.createElement('script');script.async=true;script.src=new URL('social-presence.js',source).href;
   let settled=false;const finish=error=>{if(settled)return;settled=true;cancel(timer);if(error){script.remove();reject(error);}else resolve(getModule());};
   const timer=schedule(()=>finish(Error('presence-module-timeout')),10000);
   script.onload=()=>finish(typeof getModule()?.createPublisher==='function'?null:Error('presence-module-unavailable'));
   script.onerror=()=>finish(Error('presence-module-unavailable'));
   try{doc.head.append(script);}catch(error){finish(error);}
  }).catch(error=>{loading=null;throw error;});
  return loading;
 };
}
if(typeof module==='object'&&module.exports){module.exports={createRequestTracker,createPresenceSession,createPresenceLoader};return;}
const loadPresenceModule=createPresenceLoader({document,source:document.currentScript?.src||[...document.scripts].find(s=>/\/social-bootstrap\.js(?:\?.*)?$/.test(s.src))?.src});
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
 const buttons=[],tracker=createRequestTracker();let requestCount=0;
 const style=document.createElement('style');style.id='if-social-notification-style';
 style.textContent=`
  [data-social-entry] .if-social-request-badge {display:inline-grid;place-items:center;flex:none;min-width:23px;height:23px;padding:0 5px;border:2px solid #77344c;border-radius:9px;background:linear-gradient(#e97e88,#bb4d6c);color:#fff6dc;font:850 11px/1 system-ui;box-shadow:0 2px 0 #77344c;}
  [data-social-entry] .if-social-request-badge[hidden] {display:none !important;}
  #inkfall-window #if-window-titlebar #if-top-actions [data-social-entry] .if-social-request-badge {color:#fff6dc !important;font:850 11px/1 system-ui !important;}
  #if-social-request-notice {box-sizing:border-box;position:absolute;top:110px;right:14px;z-index:180;width:min(360px,calc(100% - 28px));padding:14px;color:#33425d;background:linear-gradient(#e8f7ff,#b5dbed);border:3px solid #354860;border-radius:15px 10px 17px 11px;box-shadow:0 5px 0 #263349,0 10px 24px #10173355;font:13px/1.45 system-ui;}
  #if-social-request-notice[hidden] {display:none !important;}
  #if-social-request-notice p {margin:0 0 10px;}
  #if-social-request-notice strong {display:block;margin-bottom:5px;}
  #if-social-request-notice button {width:auto;min-height:44px;margin:4px 6px 0 0;padding:8px 10px;background:linear-gradient(#fff4d7,#e7cc94);color:#33425d;border:2px solid #354860;border-radius:9px;box-shadow:0 2px 0 #354860;font:800 12px system-ui;}
  #if-social-request-notice button:focus-visible {outline:3px solid #167c91;outline-offset:3px;}
 `;document.head.append(style);
 const notice=document.createElement('section');notice.id='if-social-request-notice';notice.hidden=true;notice.setAttribute('aria-label','Neue Freundschaftsanfrage');
 const announcement=document.createElement('div');announcement.setAttribute('role','status');announcement.setAttribute('aria-live','polite');announcement.setAttribute('aria-atomic','true');
 const heading=document.createElement('strong');heading.textContent='Neue Freundschaftsanfrage';
 const message=document.createElement('p');announcement.append(heading,message);
 const showRequests=document.createElement('button');showRequests.type='button';showRequests.textContent='Anfragen ansehen';
 const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='Schließen';dismiss.setAttribute('aria-label','Anfragehinweis schließen');
 notice.append(announcement,showRequests,dismiss);frame.append(notice);
 function hideNotice(restoreFocus=false){
  const hadFocus=notice.contains(document.activeElement);notice.hidden=true;
  if(restoreFocus&&hadFocus){const target=buttons.find(b=>b.isConnected&&!b.disabled&&b.getClientRects().length);target?.focus({preventScroll:true});}
 }
 function openRequests(trigger){hideNotice();ui.open(trigger);const tab=document.querySelector('#if-social-dialog [data-focus="tab-requests"]');tab?.click();document.querySelector('#if-social-dialog [data-focus="tab-requests"]')?.focus({preventScroll:true});}
 showRequests.onclick=()=>openRequests(buttons.find(b=>b.isConnected&&!b.disabled&&b.getClientRects().length));
 dismiss.onclick=()=>hideNotice(true);
 function updateBadge(button){
  let badge=button.querySelector('.if-social-request-badge');
  if(!badge){badge=document.createElement('span');badge.className='if-social-request-badge';badge.setAttribute('aria-hidden','true');button.insertBefore(badge,button.querySelector('.if-mode-arrow'));}
  const text=requestCount>99?'99+':String(requestCount);if(badge.textContent!==text)badge.textContent=text;
  badge.hidden=requestCount===0;button.setAttribute('aria-label',requestCount?'Freunde, '+requestCount+' offene Freundschaftsanfragen':'Freunde');
 }
 function openFriends(button){hideNotice();if(requestCount)openRequests(button);else ui.open(button);}
 function mountButtons(){
  const actions=document.getElementById('if-top-actions');
  if(actions&&!actions.querySelector('[data-social-entry]')){
   const b=document.createElement('button');b.type='button';b.className='if-top-action';b.dataset.socialEntry='top';
   const label=document.createElement('span');label.textContent='Freunde';b.append(socialIcon(),label);b.onclick=()=>openFriends(b);actions.append(b);buttons.push(b);
  }
  const coop=document.getElementById('if-coop');
  if(coop&&!document.querySelector('[data-social-entry="menu"]')){
   const b=document.createElement('button');b.type='button';b.className='if-mode-card if-mode-friends';b.dataset.socialEntry='menu';
   const emblem=document.createElement('span');emblem.className='if-mode-icon';emblem.setAttribute('aria-hidden','true');emblem.append(socialIcon());
   const copy=document.createElement('span');copy.className='if-mode-copy';
   const title=document.createElement('strong');title.textContent='Freunde';
   const description=document.createElement('small');description.textContent='Gefährten finden. Zusammen die Bastion verteidigen.';copy.append(title,description);
   const arrow=document.createElement('span');arrow.className='if-mode-arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
   b.append(emblem,copy,arrow);b.onclick=()=>openFriends(b);coop.after(b);buttons.push(b);
  }
  for(let i=buttons.length-1;i>=0;i--)if(!buttons[i].isConnected)buttons.splice(i,1);
  const signedIn=typeof auth!=='undefined'&&!!auth.currentUser;buttons.forEach(b=>{b.disabled=!signedIn;updateBadge(b);});
 }
 const observer=new MutationObserver(mountButtons);observer.observe(frame,{childList:true,subtree:true});mountButtons();
 const stopNotifications=store.subscribe(state=>{
  const result=tracker.update(state);requestCount=result.count;buttons.forEach(updateBadge);
  if(!state.uid||!state.available||!requestCount||document.getElementById('if-social-dialog')?.open){hideNotice(true);return;}
  if(result.newCount){heading.textContent=result.newCount===1?'Neue Freundschaftsanfrage':'Neue Freundschaftsanfragen';message.textContent=result.newCount===1?'Du hast eine neue Anfrage erhalten.':result.newCount+' neue Anfragen sind eingegangen.';notice.hidden=false;}
 });
 const unsubscribe=typeof auth!=='undefined'?auth.onAuthStateChanged(user=>{store.setUser(user?.uid||null);mountButtons();}):()=>{};
 const presenceSession=typeof auth!=='undefined'&&typeof db!=='undefined'?createPresenceSession({auth,getDb:()=>db,loadModule:loadPresenceModule,enabled:config.enabled===true&&config.presenceEnabled===true,onError:()=>window.inkfallDiag?.warn('Presence','Online-Status konnte nicht gestartet oder bereinigt werden.')}):null;
 const onPageHide=()=>presenceSession?.suspend(),onPageShow=()=>presenceSession?.resume();
 if(config.enabled===true&&config.presenceEnabled===true){window.addEventListener('pagehide',onPageHide);window.addEventListener('pageshow',onPageShow);presenceSession?.start();}
 window.inkfallSocial={stopPresence:()=>presenceSession?.beforeAuthChange(),retryPresence:()=>presenceSession?.retry(),open:()=>openFriends(buttons.find(b=>b.isConnected&&!b.disabled&&b.getClientRects().length)),destroy(){const cleanup=presenceSession?.destroy();window.removeEventListener('pagehide',onPageHide);window.removeEventListener('pageshow',onPageShow);observer.disconnect();unsubscribe();stopNotifications();ui.destroy();store.destroy();buttons.forEach(b=>b.remove());notice.remove();style.remove();delete window.inkfallSocial;return cleanup;}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
