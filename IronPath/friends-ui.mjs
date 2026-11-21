import {loadFriendStats} from './friend-stats.mjs?v=20261121-road1';
import {renderFriendIndicators} from './friend-indicator.mjs?v=20261104-friendbadge1';
import {createFriendPresence} from './friend-presence.mjs?v=20261104-presence1';
import {translateText as tr,onLanguageChange} from './language.mjs?v=20261121-road1';
import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
import {createSocialNotifications} from './social-notifications.mjs?v=20261121-road1';
import {createCoopInvites} from './coop-invites.mjs?v=20261121-road1';
import {createFriendService} from './friends.mjs?v=20261121-road1';
import {watchFriendPortrait,FRIEND_PORTRAIT_PLACEHOLDER} from './friend-portrait.mjs?v=20261121-road1';
export function setupFriends({document,db,auth,sdk,getProfile,getHostInvite=()=>null,joinInvite=async()=>false,crypto=globalThis.crypto,promptCenter=null}){
 const $=id=>document.getElementById(id),dialog=$('friendsDialog');let generation=0,service=null,unsubscribe=null,busy=false,next=null,searchName='',invitations={},inviteService=null,stopInvites=null,stopRequests=null,indexPromise=null,indexSession=0,noticeUid=null,requestCount=0,requestUnavailable=false,presence=null,presenceStops=new Map(),presenceStates=new Map(),presenceLabels=new Map(),portraitStops=new Map(),portraitStates=new Map(),portraitNodes=new Map(),statsId=null,statsGeneration=0,statsData=null,statsName='',lastFriendData=null,searchRows=[],lastMessage={text:'',values:{}};
 const popup=createSocialNotifications({document,container:$('socialPopup'),title:$('socialPopupTitle'),body:$('socialPopupBody'),openButton:$('socialPopupOpen'),dismissButton:$('socialPopupDismiss'),onOpen:()=>open(),promptCenter});
 // Closing the dialog only detaches listeners; writes already sent by the
 // search index or an action must settle before a character can be deleted.
 const inFlight=new Set();
 function track(promise){inFlight.add(promise);void promise.then(()=>inFlight.delete(promise),()=>inFlight.delete(promise));return promise;}
 function clearPresenceWatches(){for(const stop of presenceStops.values())stop();presenceStops.clear();presenceStates.clear();presenceLabels.clear();}
 function clearPortraitWatches(){for(const stop of portraitStops.values())stop();portraitStops.clear();portraitStates.clear();portraitNodes.clear();}
 function reset({clearInput=false}={}){closeStats();clearPresenceWatches();clearPortraitWatches();generation++;unsubscribe?.();unsubscribe=null;service=null;busy=false;if(dialog.open)dialog.close();if(clearInput)$('friendInput').value='';$('friendResults').replaceChildren();$('friendRequests').replaceChildren();$('friendList').replaceChildren();$('friendSent').replaceChildren();$('friendMore').hidden=true;$('friendsEmpty').hidden=true;$('friendRequestsSection').hidden=true;$('friendSentSection').hidden=true;$('friendListError').hidden=true;lastMessage={text:'',values:{}};$('friendStatus').textContent='';next=null;searchName='';lastFriendData=null;searchRows=[];}
 function closeStats(){statsGeneration++;statsId=null;statsData=null;$('friendStatsPortrait').src=FRIEND_PORTRAIT_PLACEHOLDER;if($('friendStatsDialog').open)$('friendStatsDialog').close();}
 function renderStats(){if(!statsData)return;const de=document.documentElement.lang==='de',d=statsData,none=de?'Keine':'None';$('friendStatsTitle').textContent=statsName;$('friendStatsKicker').textContent=de?'TRUPPAKTE':'SQUAD DOSSIER';$('friendStatsLevelHeading').textContent=de?'LEVEL':'LEVEL';$('friendStatsAbilityHeading').textContent=de?'AKTIVE FÄHIGKEIT':'ACTIVE SKILL';$('friendStatsEquipmentHeading').textContent=de?'AUSRÜSTUNG':'EQUIPMENT';$('friendStatsBunkerHeading').textContent=de?'BUNKER-AUSBAUTEN':'BUNKER UPGRADES';$('friendStatsSkillsHeading').textContent=de?'FÄHIGKEITEN':'SKILLS';$('friendStatsLevel').textContent=String(d.level);$('friendStatsAbility').textContent=tr(d.ability);$('friendStatsEquipment').textContent=d.equipped?tr(d.equipped):none;$('friendStatsBunker').textContent=Object.entries(d.bunker).map(([k,v])=>`${tr(k)}: ${v}/3`).join(' · ');$('friendStatsSkills').textContent=(d.className&&d.className!=='Unchosen'?`${tr(d.className)}: ${d.ranks[0]?.rank||0}/3`:tr('No class selected'))+(de?` · ${d.points} offene Punkte`:` · ${d.points} unspent points`);$('friendStatsSpecialists').textContent=(de?'Spezialisten: ':'Specialists: ')+(d.specialists.map(x=>tr(x)).join(', ')||none);$('friendStatsMasteries').textContent=(de?'Meisterschaften & Kombinationen: ':'Masteries & combos: ')+(d.masteries.map(x=>tr(x)).join(', ')||none);$('friendStatsOwned').textContent=(de?'Besessene Ausrüstung: ':'Owned equipment: ')+(d.owned.map(name=>tr(name)).join(', ')||none);$('friendStatsNote').textContent=de?'Momentaufnahme des gespeicherten Fortschritts. Spielerangaben sind nicht verifiziert.':'Snapshot of saved progression. Stats are player-reported and not verified.';}
 async function openStats(id,name){if(!dialog.open||!auth.currentUser)return;closeStats();const current=++statsGeneration,uid=auth.currentUser.uid;statsId=id;statsName=name;$('friendStatsPortrait').src=portraitStates.get(id)||FRIEND_PORTRAIT_PLACEHOLDER;$('friendStatsTitle').textContent=name;$('friendStatsContent').hidden=true;$('friendStatsStatus').textContent=document.documentElement.lang==='de'?'Lade Daten…':'Loading stats…';$('friendStatsDialog').showModal();try{const data=await loadFriendStats({db,auth,sdk,id});if(current!==statsGeneration||auth.currentUser?.uid!==uid||!$('friendStatsDialog').open)return;statsData=data;renderStats();$('friendStatsContent').hidden=false;$('friendStatsStatus').textContent='';}catch{if(current===statsGeneration&&auth.currentUser?.uid===uid&&$('friendStatsDialog').open)$('friendStatsStatus').textContent=document.documentElement.lang==='de'?'Daten nicht verfügbar. Prüfe die Verbindung und ob ihr noch befreundet seid.':'Stats unavailable. Check your connection and that you are still friends.';}}
 $('friendStatsClose').onclick=closeStats;$('friendStatsDialog').addEventListener('cancel',event=>{event.preventDefault();closeStats();});bindDialogBackdrop($('friendStatsDialog'),closeStats);
 function addStats(item,id,name){const button=document.createElement('button');button.type='button';button.textContent=document.documentElement.lang==='de'?'DATEN':'STATS';button.onclick=()=>void openStats(id,name);item.append(button);}
 function message(text,values={}){lastMessage={text,values};$('friendStatus').textContent=tr(text,values);}
 function indicators(){renderFriendIndicators({document,count:requestCount,unavailable:requestUnavailable});$('inviteNotification').textContent=tr('INVITATIONS · {count}',{count:Object.keys(invitations).length});}
 onLanguageChange(()=>{indicators();renderInvites();if(lastFriendData&&dialog.open)render(lastFriendData);renderSearchRows();message(lastMessage.text,lastMessage.values);renderStats();for(const [id,label] of presenceLabels)label.textContent=tr(presenceStates.get(id)==='online'?'Online':presenceStates.get(id)==='offline'?'Offline or using an older version':'Online status unavailable');});
 function action(fn){if(busy)return Promise.resolve();busy=true;const current=generation;return track((async()=>{try{await fn(()=>current===generation);}catch(error){if(current===generation)message(error?.message||'Could not complete that action. Check your connection and try again.');}finally{if(current===generation)busy=false;}})());}
 function addInvite(item,id){const button=document.createElement('button');button.type='button';button.textContent=tr('INVITE');button.disabled=!getHostInvite();button.title=button.disabled?tr('Host an open party with a free slot first'):'';button.onclick=()=>action(async current=>{const party=getHostInvite();if(!party)throw Error('Host an open party with a free slot first.');await inviteService.send(id,party,getProfile().name);if(current())message('Invitation sent. The player can join directly after accepting.');});item.append(button);}
 function renderInvites(){const list=$('coopInviteList');list.replaceChildren();for(const [id,invite] of Object.entries(invitations)){if(!invite||typeof invite.name!=='string'||!/^\d{4}$/.test(invite.code)||!/^[a-f0-9]{32}$/.test(invite.partyId))continue;const item=document.createElement('li'),text=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('span'),join=document.createElement('button'),decline=document.createElement('button');name.textContent=invite.name;detail.textContent=tr('Invited you to a party · expires after 30 minutes');text.append(name,detail);join.type=decline.type='button';join.textContent=tr('JOIN');decline.textContent=tr('DECLINE');join.onclick=()=>action(async current=>{if(await joinInvite(invite)){await inviteService.dismiss(id,invite).catch(()=>{});if(current())reset();}else if(current())message('Join cancelled or unavailable. Leave your current party, or ask for a fresh invitation.');});decline.onclick=()=>action(async current=>{const removed=await inviteService.dismiss(id,invite);if(current())message(removed?'Invitation declined.':'Invitation changed or is no longer available. Check the inbox.');});item.append(text,join,decline);list.append(item);}$('coopInvitesEmpty').hidden=list.children.length>0;$('friendInvitesSection').hidden=list.children.length===0;}
 // The search listing is a background sync, not a screen: a failed update
 // retries quietly (30s, 60s, 120s) before anything is shown, and the notice
 // lives INSIDE the friends dialog where the search actually happens. It used
 // to sit as a bar at the very top of the game view, over the Command Center
 // and every match (reported: "Die spielersuche konnte nicht aktualisiert
 // werden. Erneut versuchen." stand ganz oben, permanent).
 let indexRetries=0,indexTimer=null,indexFailed=false,connectionStop=null;
 // The quiet retries below run three times, then stop. A player who never
 // opens the friends dialog never sees the notice either, so a listing that
 // failed while the device was offline stayed broken until they acted on it -
 // they simply were not findable and nothing said so. Coming back online is
 // the one moment we know the cause may be gone, so it earns another attempt.
 function watchConnection(){
  if(typeof sdk.onValue!=='function'||typeof sdk.ref!=='function')return;
  connectionStop?.();
  connectionStop=sdk.onValue(sdk.ref(db,'.info/connected'),snapshot=>{
   // Only after a failure, and never while one is running: a reconnect must
   // not turn into a burst of writes from every tab.
   if(snapshot?.val?.()!==true||!indexFailed||indexPromise)return;
   indexRetries=0;void indexAccount();
  },()=>{});
 }
 function stopConnectionWatch(){connectionStop?.();connectionStop=null;}
 function scheduleIndexRetry(session){
  if(indexRetries>=3)return false;
  const delay=30000*(indexRetries+1);indexRetries++;
  clearTimeout(indexTimer);
  indexTimer=setTimeout(()=>{indexTimer=null;if(indexSession===session&&getProfile()&&auth.currentUser)void indexAccount();},delay);
  return true;
 }
 function indexAccount(){
  if(indexPromise)return indexPromise;const current=indexSession,profile=getProfile();if(!profile||!auth.currentUser)return Promise.resolve(false);
  indexPromise=track(Promise.resolve().then(()=>createFriendService({db,auth,sdk,crypto}).ensureSearchListing(profile.name)).then(()=>{if(current===indexSession){$('friendIndexError').hidden=true;indexRetries=0;indexFailed=false;}return true;}).catch(error=>{if(current===indexSession){indexFailed=true;if(!scheduleIndexRetry(current)){$('friendIndexError').hidden=false;if(dialog.open)message(error?.message||'Could not update your player search listing. Retry when connected.');}}return false;}).finally(()=>{if(current===indexSession)indexPromise=null;}));return indexPromise;
 }
 function start(){void presence?.stop();presence=null;clearPresenceWatches();try{presence=createFriendPresence({db,auth,sdk,crypto});}catch{}stopInvites?.();stopRequests?.();indexSession++;indexPromise=null;clearTimeout(indexTimer);indexTimer=null;indexRetries=0;invitations={};const uid=auth.currentUser?.uid;if(noticeUid!==uid){popup.reset();noticeUid=uid;}const session=indexSession;requestCount=0;requestUnavailable=false;indexFailed=false;watchConnection();indicators();stopRequests=sdk.onValue(sdk.ref(db,`friendships/${uid}`),snapshot=>{if(session!==indexSession||auth.currentUser?.uid!==uid)return;const edges=snapshot.val()||{},pending=Object.entries(edges).filter(([,edge])=>edge?.status==='pending');const count=pending.length;requestCount=count;requestUnavailable=false;indicators();},()=>{if(session!==indexSession||auth.currentUser?.uid!==uid)return;requestUnavailable=true;indicators();});$('friendInvitesError').hidden=true;inviteService=createCoopInvites({db,auth,sdk});stopInvites=inviteService.watch(values=>{if(session!==indexSession||auth.currentUser?.uid!==uid)return;$('friendInvitesError').hidden=true;invitations=values;const fresh=Object.entries(values).filter(([,v])=>v&&typeof v.name==='string'&&/^\d{4}$/.test(v.code)&&/^[a-f0-9]{32}$/.test(v.partyId)&&Number.isFinite(v.createdAt)&&v.createdAt>=Date.now()-1800000);popup.update('invites',fresh.map(([id,v])=>({key:JSON.stringify([id,v.partyId,v.code,v.name,v.createdAt]),name:v.name,expiresAt:v.createdAt+1800000})),{suppress:dialog.open});const count=Object.keys(values).length;$('inviteNotification').hidden=!count;indicators();renderInvites();},()=>{if(session===indexSession&&auth.currentUser?.uid===uid)$('friendInvitesError').hidden=false;});void indexAccount();}
 // Character deletion suspends listeners before its server response; if it
 // fails, the same signed-in profile can reload without re-announcing notices.
 function signOut({preserveNotices=false}={}){const stopped=presence?.stop();presence=null;clearPresenceWatches();if(preserveNotices){popup.update('requests',[]);popup.update('invites',[]);}else{popup.reset();noticeUid=null;}indexSession++;indexPromise=null;clearTimeout(indexTimer);indexTimer=null;indexRetries=0;stopInvites?.();stopInvites=null;stopRequests?.();stopRequests=null;stopConnectionWatch();indexFailed=false;requestCount=0;requestUnavailable=false;inviteService=null;invitations={};indicators();renderInvites();$('inviteNotification').hidden=true;$('friendIndexError').hidden=true;$('friendInvitesError').hidden=true;reset({clearInput:true});return Promise.resolve(stopped).catch(()=>{});}
 async function prepareForDeletion(){const stopped=signOut({preserveNotices:true});await Promise.allSettled([stopped,...inFlight]);}
 $('friendIndexRetry').onclick=()=>{void indexAccount();};
 function render({incoming,outgoing,edges}){
  lastFriendData={incoming,outgoing,edges};
  const requests=$('friendRequests'),friends=$('friendList'),sent=$('friendSent'),accepted=new Set();presenceLabels.clear();portraitNodes.clear();requests.replaceChildren();friends.replaceChildren();sent.replaceChildren();
  function presenceLabel(item,id){accepted.add(id);const label=item.querySelector('span');presenceLabels.set(id,label);label.textContent=tr(presenceStates.get(id)==='online'?'Online':presenceStates.get(id)==='offline'?'Offline or using an older version':'Online status unavailable');}
  function row(list,name,label,buttonText,click,portraitId=null){const item=document.createElement('li'),text=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('span'),button=document.createElement('button');title.textContent=name;detail.textContent=tr(label);text.append(title,detail);button.type='button';button.textContent=tr(buttonText);button.onclick=()=>action(click);if(portraitId){const image=document.createElement('img');image.className='friend-portrait';image.alt='';image.src=portraitStates.get(portraitId)||FRIEND_PORTRAIT_PLACEHOLDER;portraitNodes.set(portraitId,image);item.append(image);}item.append(text,button);list.append(item);return item;}
  for(const [id,edge] of Object.entries(incoming)){
   if(edge?.status==='pending'){
    const item=row(requests,edge.senderName,'Wants to connect','ACCEPT',async current=>{await service.accept(id);if(current())message('Friend request accepted.');});const decline=document.createElement('button');decline.type='button';decline.textContent=tr('DECLINE');decline.onclick=()=>action(async current=>{await service.removeIncoming(id);if(current())message('Request declined.');});item.append(decline);
   }else if(edge?.status==='accepted'){const item=row(friends,edge.senderName,'Connected','REMOVE',async current=>{await service.removeIncoming(id);if(current())message('Friend removed.');},id);presenceLabel(item,id);addInvite(item,id);addStats(item,id,edge.senderName);}
  }
  for(const [id,contact] of Object.entries(outgoing)){
   const edge=edges[id];if(edge?.status==='accepted'){const item=row(friends,contact.name,'Connected','REMOVE',async current=>{await service.removeOutgoing(id);if(current())message('Friend removed.');},id);presenceLabel(item,id);addInvite(item,id);addStats(item,id,contact.name);}
   else row(sent,contact.name,edge?.status==='pending'?'Waiting for approval':'Request no longer active','CLEAR',async current=>{await service.removeOutgoing(id);if(current())message('Request cleared.');});
  }
  if(statsId&&!accepted.has(statsId))closeStats();
  for(const [id,stop] of presenceStops)if(!accepted.has(id)){stop();presenceStops.delete(id);presenceStates.delete(id);}
  for(const id of accepted)if(presence&&!presenceStops.has(id)){try{const stop=presence.watch(id,value=>{presenceStates.set(id,value);const label=presenceLabels.get(id);if(label)label.textContent=tr(value==='online'?'Online':value==='offline'?'Offline or using an older version':'Online status unavailable');});presenceStops.set(id,stop);}catch{}}
  for(const [id,stop] of portraitStops)if(!accepted.has(id)){stop();portraitStops.delete(id);portraitStates.delete(id);}
  for(const id of accepted)if(!portraitStops.has(id)){
   try{
    const current=generation,uid=auth.currentUser?.uid;
    const stop=watchFriendPortrait({db,auth,sdk,id,document,onChange:url=>{
     if(current!==generation||auth.currentUser?.uid!==uid||!dialog.open)return;
     portraitStates.set(id,url);const image=portraitNodes.get(id);if(image)image.src=url;
     if(statsId===id&&$('friendStatsDialog').open)$('friendStatsPortrait').src=url;
    }});
    portraitStops.set(id,stop);
   }catch{/* Old or restrictive Rules leave the neutral placeholder. */}
  }
  $('friendsEmpty').hidden=friends.children.length>0;$('requestsEmpty').hidden=requests.children.length>0;$('sentEmpty').hidden=sent.children.length>0;
  $('friendListSection').hidden=false;$('friendRequestsSection').hidden=requests.children.length===0;$('friendSentSection').hidden=sent.children.length===0;
 }
 function open(){
  if(!auth.currentUser||!getProfile())return;popup.clear();reset();const current=generation;dialog.showModal();message('Connecting…');
  try{service=createFriendService({db,auth,sdk,crypto});unsubscribe=service.watch(render,()=>{if(current===generation){closeStats();$('friendListError').hidden=false;}});void indexAccount().then(ok=>{if(current===generation&&ok)message('Search for a soldier by name.');});}catch{$('friendListError').hidden=false;message('Could not open friends. Check your connection.');}
 }
 $('menuFriends').onclick=open;$('lobbyFriends').onclick=open;$('inviteNotification').onclick=open;
 function closeFriends(){if(busy){message('Please wait for the current action to finish.');return;}reset();}
 $('friendsClose').onclick=closeFriends;dialog.addEventListener('cancel',event=>{event.preventDefault();closeFriends();});bindDialogBackdrop(dialog,closeFriends);
 function renderSearchRows(){const list=$('friendResults');list.replaceChildren();for(const player of searchRows){const item=document.createElement('li'),text=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('span'),button=document.createElement('button');title.textContent=player.name;detail.textContent=tr('Player ID · {id}',{id:player.id});text.append(title,detail);button.type='button';button.textContent=tr('ADD');button.onclick=()=>action(async stillCurrent=>{const name=await service.send(player.code,getProfile().name);if(stillCurrent())message('Request sent to {name}.',{name});});item.append(text,button);list.append(item);}}
 async function search(current,more){
  if(!service)return;const requested=more?searchName:$('friendInput').value;const result=await service.search(requested,more?next:null);if(!current())return;
  if(!more){searchRows=[];searchName=requested;}next=result.next;$('friendMore').hidden=!next;searchRows.push(...result.matches);renderSearchRows();
  message(result.matches.length?(result.matches.length===1?'Found {count} player. Check the player ID before sending.':'Found {count} players. Check the player ID before sending.'):result.next?'No matches on this page. Try more results.':'No players found. Check the exact name; existing players must sign in once to be searchable.',{count:result.matches.length});

 }
 $('friendSearch').onclick=()=>action(current=>search(current,false));$('friendMore').onclick=()=>action(current=>search(current,true));
 return {reset,start,signOut,open,prepareForDeletion,hasPending:()=>busy||inFlight.size>0};
}
