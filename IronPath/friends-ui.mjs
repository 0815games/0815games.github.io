import {createFriendService} from './friends.mjs?v=20261104-friendsearch1';
export function setupFriends({document,db,auth,sdk,getProfile,crypto=globalThis.crypto}){
 const $=id=>document.getElementById(id),dialog=$('friendsDialog');let generation=0,service=null,unsubscribe=null,busy=false,visible=false,next=null,searchName='';
 function reset(){generation++;unsubscribe?.();unsubscribe=null;service=null;busy=false;if(dialog.open)dialog.close();$('friendInput').value='';$('friendResults').replaceChildren();$('friendMore').hidden=true;$('friendVisibility').disabled=true;$('friendVisibility').setAttribute('aria-pressed','false');$('friendVisibility').textContent='LOADING';$('friendStatus').textContent='';visible=false;next=null;searchName='';}
 function message(text){$('friendStatus').textContent=text;}
 async function action(fn){if(busy)return;busy=true;const current=generation;try{await fn(()=>current===generation);}catch(error){if(current===generation)message(error?.message||'Could not complete that action. Check your connection and try again.');}finally{if(current===generation)busy=false;}}
 function render({incoming,outgoing,edges}){
  const requests=$('friendRequests'),friends=$('friendList'),sent=$('friendSent');requests.replaceChildren();friends.replaceChildren();sent.replaceChildren();
  function row(list,name,label,buttonText,click){const item=document.createElement('li'),text=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('span'),button=document.createElement('button');title.textContent=name;detail.textContent=label;text.append(title,detail);button.type='button';button.textContent=buttonText;button.onclick=()=>action(click);item.append(text,button);list.append(item);return item;}
  for(const [id,edge] of Object.entries(incoming)){
   if(edge?.status==='pending'){
    const item=row(requests,edge.senderName,'Wants to connect','ACCEPT',async current=>{await service.accept(id);if(current())message('Friend request accepted.');});const decline=document.createElement('button');decline.type='button';decline.textContent='DECLINE';decline.onclick=()=>action(async current=>{await service.removeIncoming(id);if(current())message('Request declined.');});item.append(decline);
   }else if(edge?.status==='accepted')row(friends,edge.senderName,'Connected','REMOVE',async current=>{await service.removeIncoming(id);if(current())message('Friend removed.');});
  }
  for(const [id,contact] of Object.entries(outgoing)){
   const edge=edges[id];if(edge?.status==='accepted')row(friends,contact.name,'Connected','REMOVE',async current=>{await service.removeOutgoing(id);if(current())message('Friend removed.');});
   else row(sent,contact.name,edge?.status==='pending'?'Waiting for approval':'Request no longer active','CLEAR',async current=>{await service.removeOutgoing(id);if(current())message('Request cleared.');});
  }
  $('friendsEmpty').hidden=friends.children.length>0;$('requestsEmpty').hidden=requests.children.length>0;$('sentEmpty').hidden=sent.children.length>0;
 }
 $('menuFriends').onclick=()=>{
  if(!auth.currentUser||!getProfile())return;reset();const current=generation;dialog.showModal();message('Connecting…');
  try{service=createFriendService({db,auth,sdk,crypto});unsubscribe=service.watch(render,()=>{if(current===generation)message('Could not load friends. Check your connection and published rules.');});const instance=service;void instance.ensureCode(getProfile().name).then(()=>instance.visibility(getProfile().name)).then(value=>{if(current===generation){visible=value;$('friendVisibility').disabled=false;$('friendVisibility').textContent=value?'VISIBLE':'HIDDEN';$('friendVisibility').setAttribute('aria-pressed',String(value));message(value?'Players can find you by name.':'Enable visibility so friends can find you.');}}).catch(()=>{if(current===generation)message('Could not load search settings. Check your connection and published rules.');});}catch{message('Could not open friends. Check your connection.');}
 };
 $('friendsClose').onclick=reset;dialog.addEventListener('cancel',()=>reset());
 $('friendVisibility').onclick=()=>action(async current=>{if(!service||!getProfile())return;const value=await service.setVisibility(getProfile().name,!visible);if(current()){visible=value;$('friendVisibility').textContent=value?'VISIBLE':'HIDDEN';$('friendVisibility').setAttribute('aria-pressed',String(value));message(value?'Players can now find you by name.':'Your name is hidden from search. Existing friends are unchanged.');}});
 async function search(current,more){
  if(!service)return;const requested=more?searchName:$('friendInput').value;const result=await service.search(requested,more?next:null);if(!current())return;
  if(!more){$('friendResults').replaceChildren();searchName=requested;}next=result.next;$('friendMore').hidden=!next;
  for(const player of result.matches){const item=document.createElement('li'),text=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('span'),button=document.createElement('button');title.textContent=player.name;detail.textContent=`Player ID · ${player.id}`;text.append(title,detail);button.type='button';button.textContent='ADD';button.onclick=()=>action(async stillCurrent=>{const name=await service.send(player.code,getProfile().name);if(stillCurrent())message(`Request sent to ${name}.`);});item.append(text,button);$('friendResults').append(item);}
  message(result.matches.length?`Found ${result.matches.length} player${result.matches.length===1?'':'s'}. Check the player ID before sending.`:result.next?'No matches on this page. Try more results.':'No players found. Check the name and ask them to enable search visibility.');
 }
 $('friendSearch').onclick=()=>action(current=>search(current,false));$('friendMore').onclick=()=>action(current=>search(current,true));
 return {reset};
}
