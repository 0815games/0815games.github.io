import {createFriendService} from './friends.mjs?v=20261104-friends1';
export function setupFriends({document,db,auth,sdk,getProfile,crypto=globalThis.crypto,clipboard=globalThis.navigator?.clipboard}){
 const $=id=>document.getElementById(id),dialog=$('friendsDialog');let generation=0,service=null,unsubscribe=null,busy=false;
 function reset(){generation++;unsubscribe?.();unsubscribe=null;service=null;busy=false;if(dialog.open)dialog.close();$('friendCode').value='';$('friendInput').value='';$('friendStatus').textContent='';}
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
  try{service=createFriendService({db,auth,sdk,crypto});unsubscribe=service.watch(render,()=>{if(current===generation)message('Could not load friends. Check your connection and published rules.');});const instance=service;void instance.ensureCode(getProfile().name).then(code=>{if(current===generation){$('friendCode').value=code;message('Share your friend code privately.');}}).catch(()=>{if(current===generation)message('Could not create your friend code. Check your connection and published rules.');});}catch{message('Could not open friends. Check your connection.');}
 };
 $('friendsClose').onclick=reset;dialog.addEventListener('cancel',()=>reset());
 $('friendSend').onclick=()=>action(async current=>{if(!service||!getProfile())return;const name=await service.send($('friendInput').value,getProfile().name);if(current()){$('friendInput').value='';message(`Request sent to ${name}.`);}});
 $('friendCopy').onclick=()=>action(async current=>{if(!$('friendCode').value)return;if(!clipboard?.writeText){$('friendCode').focus();$('friendCode').select();message('Copy the selected code.');return;}await clipboard.writeText($('friendCode').value);if(current())message('Friend code copied.');});
 return {reset};
}
