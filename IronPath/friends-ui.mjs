import {createCoopInvites} from './coop-invites.mjs?v=20261104-invites1';
import {createFriendService} from './friends.mjs?v=20261104-autosearch1';
export function setupFriends({document,db,auth,sdk,getProfile,getHostInvite=()=>null,joinInvite=async()=>false,crypto=globalThis.crypto}){
 const $=id=>document.getElementById(id),dialog=$('friendsDialog');let generation=0,service=null,unsubscribe=null,busy=false,next=null,searchName='',invitations={},inviteService=null,stopInvites=null,indexPromise=null,indexSession=0;
 function reset(){generation++;unsubscribe?.();unsubscribe=null;service=null;busy=false;if(dialog.open)dialog.close();$('friendInput').value='';$('friendResults').replaceChildren();$('friendMore').hidden=true;$('friendStatus').textContent='';next=null;searchName='';}
 function message(text){$('friendStatus').textContent=text;}
 async function action(fn){if(busy)return;busy=true;const current=generation;try{await fn(()=>current===generation);}catch(error){if(current===generation)message(error?.message||'Could not complete that action. Check your connection and try again.');}finally{if(current===generation)busy=false;}}
 function addInvite(item,id){const button=document.createElement('button');button.type='button';button.textContent='INVITE';button.disabled=!getHostInvite();button.title=button.disabled?'Host an open party with a free slot first':'';button.onclick=()=>action(async current=>{const party=getHostInvite();if(!party)throw Error('Host an open party with a free slot first.');await inviteService.send(id,party,getProfile().name);if(current())message('Invitation sent. The player must accept, then you approve their join request.');});item.append(button);}
 function renderInvites(){const list=$('coopInviteList');list.replaceChildren();for(const [id,invite] of Object.entries(invitations)){if(!invite||typeof invite.name!=='string'||!/^\d{4}$/.test(invite.code)||!/^[a-f0-9]{32}$/.test(invite.partyId))continue;const item=document.createElement('li'),text=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('span'),join=document.createElement('button'),decline=document.createElement('button');name.textContent=invite.name;detail.textContent='Invited you to a party · expires after 30 minutes';text.append(name,detail);join.type=decline.type='button';join.textContent='JOIN';decline.textContent='DECLINE';join.onclick=()=>action(async current=>{if(await joinInvite(invite)){await inviteService.dismiss(id).catch(()=>{});if(current())reset();}else if(current())message('Join cancelled or unavailable. Leave your current party, or ask for a fresh invitation.');});decline.onclick=()=>action(async current=>{await inviteService.dismiss(id);if(current())message('Invitation declined.');});item.append(text,join,decline);list.append(item);}$('coopInvitesEmpty').hidden=list.children.length>0;}
 function indexAccount(){
  if(indexPromise)return indexPromise;const current=indexSession,profile=getProfile();if(!profile||!auth.currentUser)return Promise.resolve(false);
  indexPromise=Promise.resolve().then(()=>createFriendService({db,auth,sdk,crypto}).ensureSearchListing(profile.name)).then(()=>{if(current===indexSession)$('friendIndexError').hidden=true;return true;}).catch(()=>{if(current===indexSession){$('friendIndexError').hidden=false;if(dialog.open)message('Could not update your player search listing. Retry when connected.');}return false;}).finally(()=>{if(current===indexSession)indexPromise=null;});return indexPromise;
 }
 function start(){stopInvites?.();indexSession++;indexPromise=null;invitations={};inviteService=createCoopInvites({db,auth,sdk});stopInvites=inviteService.watch(values=>{invitations=values;const count=Object.keys(values).length;$('inviteNotification').hidden=!count;$('inviteNotification').textContent=`INVITATIONS · ${count}`;renderInvites();},()=>{if(dialog.open)message('Could not load invitations. Check your connection.');});void indexAccount();}
 function signOut(){indexSession++;indexPromise=null;stopInvites?.();stopInvites=null;inviteService=null;invitations={};$('inviteNotification').hidden=true;$('friendIndexError').hidden=true;reset();}
 $('friendIndexRetry').onclick=()=>{void indexAccount();};
 function render({incoming,outgoing,edges}){
  const requests=$('friendRequests'),friends=$('friendList'),sent=$('friendSent');requests.replaceChildren();friends.replaceChildren();sent.replaceChildren();
  function row(list,name,label,buttonText,click){const item=document.createElement('li'),text=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('span'),button=document.createElement('button');title.textContent=name;detail.textContent=label;text.append(title,detail);button.type='button';button.textContent=buttonText;button.onclick=()=>action(click);item.append(text,button);list.append(item);return item;}
  for(const [id,edge] of Object.entries(incoming)){
   if(edge?.status==='pending'){
    const item=row(requests,edge.senderName,'Wants to connect','ACCEPT',async current=>{await service.accept(id);if(current())message('Friend request accepted.');});const decline=document.createElement('button');decline.type='button';decline.textContent='DECLINE';decline.onclick=()=>action(async current=>{await service.removeIncoming(id);if(current())message('Request declined.');});item.append(decline);
   }else if(edge?.status==='accepted'){const item=row(friends,edge.senderName,'Connected','REMOVE',async current=>{await service.removeIncoming(id);if(current())message('Friend removed.');});addInvite(item,id);}
  }
  for(const [id,contact] of Object.entries(outgoing)){
   const edge=edges[id];if(edge?.status==='accepted'){const item=row(friends,contact.name,'Connected','REMOVE',async current=>{await service.removeOutgoing(id);if(current())message('Friend removed.');});addInvite(item,id);}
   else row(sent,contact.name,edge?.status==='pending'?'Waiting for approval':'Request no longer active','CLEAR',async current=>{await service.removeOutgoing(id);if(current())message('Request cleared.');});
  }
  $('friendsEmpty').hidden=friends.children.length>0;$('requestsEmpty').hidden=requests.children.length>0;$('sentEmpty').hidden=sent.children.length>0;
 }
 function open(){
  if(!auth.currentUser||!getProfile())return;reset();const current=generation;dialog.showModal();message('Connecting…');
  try{service=createFriendService({db,auth,sdk,crypto});unsubscribe=service.watch(render,()=>{if(current===generation)message('Could not load friends. Check your connection and published rules.');});void indexAccount().then(ok=>{if(current===generation&&ok)message('Search for a soldier by name.');});}catch{message('Could not open friends. Check your connection.');}
 }
 $('menuFriends').onclick=open;$('lobbyFriends').onclick=open;$('inviteNotification').onclick=open;
 $('friendsClose').onclick=reset;dialog.addEventListener('cancel',()=>reset());
 async function search(current,more){
  if(!service)return;const requested=more?searchName:$('friendInput').value;const result=await service.search(requested,more?next:null);if(!current())return;
  if(!more){$('friendResults').replaceChildren();searchName=requested;}next=result.next;$('friendMore').hidden=!next;
  for(const player of result.matches){const item=document.createElement('li'),text=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('span'),button=document.createElement('button');title.textContent=player.name;detail.textContent=`Player ID · ${player.id}`;text.append(title,detail);button.type='button';button.textContent='ADD';button.onclick=()=>action(async stillCurrent=>{const name=await service.send(player.code,getProfile().name);if(stillCurrent())message(`Request sent to ${name}.`);});item.append(text,button);$('friendResults').append(item);}
  message(result.matches.length?`Found ${result.matches.length} player${result.matches.length===1?'':'s'}. Check the player ID before sending.`:result.next?'No matches on this page. Try more results.':'No players found. Check the exact name; existing players must sign in once to be searchable.');
 }
 $('friendSearch').onclick=()=>action(current=>search(current,false));$('friendMore').onclick=()=>action(current=>search(current,true));
 return {reset,start,signOut,open};
}
