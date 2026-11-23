import {translateText as tr,onLanguageChange} from '../language.mjs?v=20261123-sector1';
// Unified online party panel. The server rules remain the authority for roster changes.
import {availablePartyModes} from '../core/multiplayer-lobby.mjs?v=20261103-unified1';
import {fourTeamRosters} from './firebase-four-lobby.mjs?v=20261123-sector1';
import {rankForLevel,rankInsigniaSvg} from '../core/rank-insignia.mjs?v=20261123-sector1';
import {FRIEND_PORTRAIT_PLACEHOLDER} from '../core/friend-portrait.mjs?v=20261123-sector1';
export function createFourPlayerPanel({document,createLobby,getProfile,onMatch,confirmStart=async()=>true,confirmClose=async()=>false,confirmForceClose=async()=>false,onLeaveMatch=async()=>{},onRequestHostEnd=async()=>false,canCompleteEnd=()=>false,canForceCloseEnd=()=>false,promptCenter=null,onViewRequests=()=>{},portraitFor=null}={}){
  if(!document||![createLobby,getProfile,onMatch,confirmStart,confirmClose,confirmForceClose,onLeaveMatch,onRequestHostEnd,canCompleteEnd,canForceCloseEnd,onViewRequests].every(fn=>typeof fn==='function'))throw Error('Invalid panel configuration');
  // Optional, and deliberately the caller's decision: WHOSE face may be shown
  // and where it comes from is not this panel's business. Without it every card
  // keeps the neutral placeholder.
  if(portraitFor!==null&&typeof portraitFor!=='function')throw Error('Invalid panel configuration');
  const $=id=>document.getElementById(id),root=$('fourPartyPanel'),requests=$('fourPartyRequests'),roster=$('fourPartyRoster');
  const teams=[[0,0,1,1],[0,1,0,1],[0,1,1,0]];
  let lobby=null,party=null,slots={},profiles={},config=null,started=false,joinFailed=false,busy=false,forceConfirming=false,generation=0,unwatch=[],profileWatches=new Map(),portraitWatches=new Map(),cardImages=new Map(),joining=false,selectedMode=null,selectedTeams=0,renderedModes='',lastStatus={text:'',values:{}},lastRequests={},requestSerial=0,requestTokens=new Map(),closingParty=null,endState=null;
  const retainedParties=new Map();
  function clearRetained(){for(const marker of retainedParties.values())marker.stop?.();retainedParties.clear();}
  function rememberLockedGuest(active,current){
    if(retainedParties.has(current.partyId))return;
    const marker={stop:null};retainedParties.set(current.partyId,marker);
    const forget=()=>{if(retainedParties.get(current.partyId)!==marker)return;retainedParties.delete(current.partyId);marker.stop?.();};
    // A started roster is immutable for guests. The local leave ends the game
    // but cannot erase that roster/profile; wait for the host to close it
    // before allowing character deletion in this document.
    try{marker.stop=active.watchHost(current.partyId,value=>{if(value!==current.hostId)forget();},()=>{});if(retainedParties.get(current.partyId)!==marker)marker.stop?.();}catch{/* Unknown state stays blocked until logout. */}
  }
  function formatMissing(entries){
    return entries.map(entry=>{
      if(entry.state==='departed')return tr('{name} (left early)',{name:entry.name});
      if(entry.state==='offline')return tr('{name} (offline)',{name:entry.name});
      return entry.name;
    }).join(', ');
  }
  function paintStatus(){
    if(!lastStatus.text){$('fourPartyStatus').textContent='';return;}
    const values=Array.isArray(lastStatus.entries)?{...lastStatus.values,names:formatMissing(lastStatus.entries)}:lastStatus.values;
    $('fourPartyStatus').textContent=tr(lastStatus.text,values);
  }
  function status(message,values={},entries=null){lastStatus={text:message||'',values:values||{},entries};paintStatus();}
  function clear(){generation++;promptCenter?.reset('party-joins');for(const stop of unwatch)stop();unwatch=[];for(const entry of profileWatches.values())entry.stop?.();profileWatches.clear();for(const entry of portraitWatches.values())entry.stop?.();portraitWatches.clear();cardImages.clear();lobby=null;party=null;slots={};profiles={};config=null;started=false;joinFailed=false;busy=false;forceConfirming=false;joining=false;selectedMode=null;selectedTeams=0;renderedModes='';lastRequests={};requestTokens.clear();endState=null;requests.replaceChildren();roster.replaceChildren();render();}
  function render(){
    $('fourPartyEntry').hidden=!!party;$('fourPartyActive').hidden=!party;
    const host=party?.role==='host',pending=party?.role==='pending';
    if(!host||started)promptCenter?.update('party-joins',[]);else promptCenter?.refresh?.();
    $('fourPartyCodeDisplay').textContent=host?party.inviteCode:'';$('fourPartyCodeArea').hidden=!host;
    $('fourPartySettings').hidden=!host||started;requests.hidden=!host||started;
    $('fourPartyStart').hidden=!host||started;
    $('fourPartyStart').disabled=busy||!host||started||!ready();
    $('fourPartyLeave').hidden=started&&!host&&!joinFailed;
    $('fourPartyLeave').textContent=tr(host?'CLOSE PARTY':pending?'CANCEL REQUEST':started?'LEAVE MATCH':'LEAVE PARTY');
    $('fourPartyForceClose').textContent=tr('FORCE CLOSE PARTY');
    const showForceClose=!!(host&&started&&endState?.partyId===party.partyId&&endState.canForceClose&&canForceCloseEnd(party.partyId,endState.endTick));
    $('fourPartyForceClose').hidden=!showForceClose;
    $('fourPartyForceClose').disabled=busy||!showForceClose;
    for(const id of ['fourPartyCreate','fourPartyJoin','fourPartyResume','fourPartyLeave','fourPartyMode','fourPartyTeams'])$(id).disabled=busy;
    if(joining)$('fourPartyLeave').disabled=true;
    const modes=availablePartyModes(party?1+Object.values(slots).filter(Boolean).length:0),signature=modes.join(',');
    if(!modes.includes(selectedMode))selectedMode=modes[0]||null;
    if(signature!==renderedModes){renderedModes=signature;$('fourPartyMode').replaceChildren();for(const mode of modes){const option=document.createElement('option');option.value=mode;option.textContent=tr(({coop:'Co-op · defend together',versus:'1 vs 1 · survival', 'four-coop':'Large-map co-op · two roads','two-vs-two':'2 vs 2 · survival'})[mode]);$('fourPartyMode').append(option);}}
    if(selectedMode)$('fourPartyMode').value=selectedMode;$('fourPartyTeams').value=String(selectedTeams);
    $('fourPartyTeamsLabel').hidden=$('fourPartyTeams').hidden=selectedMode!=='two-vs-two';
    roster.replaceChildren();cardImages.clear();
    const ids=party&&!pending?[party.hostId,slots.one,slots.two,slots.three]:[];
    for(const [index,id] of ids.entries())roster.append(buildCard(id,index));
    syncPortraits(ids);
  }
  // One card per slot: portrait, name, rank, role and readiness. The roster is
  // still a list for screen readers - only the presentation is a card.
  function tag(className,text){const node=document.createElement('span');node.className=className;node.textContent=text;return node;}
  function buildCard(id,index){
   const item=document.createElement('li');
   if(!id){item.className='party-card party-card-open';item.textContent=tr('Slot {number} · Open',{number:index+1});return item;}
   const profile=profiles[id];
   item.className='party-card';
   const portrait=document.createElement('img');
   // Decorative: the soldier's name is written next to it. Until a portrait
   // arrives the placeholder stands in, and it also stays if none ever does.
   portrait.className='party-card-portrait';portrait.alt='';portrait.src=FRIEND_PORTRAIT_PLACEHOLDER;
   cardImages.set(id,portrait);
   const body=document.createElement('div');body.className='party-card-body';
   const name=document.createElement('span');name.className='party-card-name';name.textContent=profile?.name||tr('Waiting for soldier');
   // The rank is derived from the published level and never stored: an unknown
   // or missing level shows the lowest rank, it does not invent one.
   const rank=rankForLevel(profile?.level),rankLine=document.createElement('span');
   // The SVG marks itself decorative (aria-hidden, focusable=false) and the
   // rank name is written out next to it, so the mark is never the only
   // carrier of the information.
   const insignia=document.createElement('span');insignia.className='party-card-insignia';
   insignia.innerHTML=rankInsigniaSvg(rank,{size:20});
   rankLine.className='party-card-rank';rankLine.append(insignia,tag('party-card-rankname',tr(rank.name)));
   const tags=document.createElement('span');tags.className='party-card-tags';
   if(index===0)tags.append(tag('party-tag',tr('Host')));
   if(selectedMode==='two-vs-two')tags.append(tag('party-tag',tr('Team {letter}',{letter:teams[selectedTeams][index]===0?'A':'B'})));
   const state=document.createElement('span');
   state.className=profile?'party-card-state is-ready':'party-card-state is-waiting';
   state.textContent=tr(profile?'Ready':'Not ready');
   body.append(name,rankLine,tags,state);
   item.append(portrait,body);
   const held=portraitWatches.get(id)?.url;if(held)portrait.src=held;
   return item;
  }
  // One watch per soldier, kept across re-renders: a card is rebuilt on every
  // status change, and restarting the watch each time would drop the face back
  // to the placeholder on every tick.
  function syncPortraits(ids){
   if(typeof portraitFor!=='function')return;
   for(const [id,entry] of portraitWatches)if(!ids.includes(id)){entry.stop?.();portraitWatches.delete(id);}
   for(const id of ids){
    if(!id||portraitWatches.has(id))continue;
    const entry={stop:null,url:null};portraitWatches.set(id,entry);
    try{entry.stop=portraitFor(id,url=>{if(portraitWatches.get(id)!==entry)return;entry.url=url;applyPortrait(id,url);});}
    catch{portraitWatches.delete(id);continue;} // A failed watch stays failed; the placeholder is the honest answer.
   }
  }
  function applyPortrait(id,url){
   const image=cardImages.get(id);
   if(image&&typeof url==='string'&&url)image.src=url;
  }
  function ready(){const ids=party?[party.hostId,slots.one,slots.two,slots.three].filter(Boolean):[];return !!config&&availablePartyModes(ids.length).includes(selectedMode)&&ids.every(id=>profiles[id]);}
  function addWatch(stop){unwatch.push(stop);}
  function failed(){status('Party connection lost. Check your connection or leave and try again.');}
  async function run(fn){if(busy)return;busy=true;const gen=generation;render();try{return await fn(gen);}catch{if(gen===generation)status('Could not complete that action. Check your connection and try again.');}finally{if(gen===generation){busy=false;render();}}}
  function watchProfiles(gen){
    const ids=[party.hostId,slots.one,slots.two,slots.three].filter(Boolean);
    for(const [id,entry] of profileWatches)if(!ids.includes(id)){entry.stop?.();profileWatches.delete(id);delete profiles[id];}
    for(const id of ids)if(!profileWatches.has(id)){
      const entry={stop:null};profileWatches.set(id,entry);entry.stop=lobby.watchProfile(party.partyId,id,value=>{if(gen!==generation||!party||profileWatches.get(id)!==entry)return;if(value)profiles[id]=value;else delete profiles[id];render();},failed);
    }
  }
  function enterMatch(gen,value){
    if(gen!==generation||!party||started)return;
    try{const teamRosters=fourTeamRosters(value);if(!value.playerIds.includes(party.uid)||value.hostId!==party.hostId)throw Error('Roster changed');started=true;render();status('Match started. Connecting…');Promise.resolve().then(()=>gen===generation&&party?onMatch({...value,partyId:party.partyId,teamRosters},{isCurrent:()=>gen===generation&&!!party&&started}):false).then(ok=>{if(gen===generation){joinFailed=ok===false;render();status(joinFailed?'Could not connect to the match. Leave and try again.':'Connecting to the match…');}}).catch(()=>{if(gen===generation){joinFailed=true;render();status('Could not connect to the match. Leave and try again.');}});}catch{failed();}
  }
  function watchMember(gen){
    addWatch(lobby.watchConfig(party.partyId,value=>{if(gen!==generation||!party)return;config=value;render();},failed));
    addWatch(lobby.watchStarted(party.partyId,value=>{
      if(gen!==generation||!party||!value||party.role==='host'||started)return;
      enterMatch(gen,value);
    },failed));
    watchProfiles(gen);
  }
  function watchParty(gen){
    addWatch(lobby.watchHost(party.partyId,value=>{if(gen===generation&&party&&value!==party.hostId){
      // RTDB applies a host's delete optimistically in its own client. Do not
      // stop the match until that delete has actually been acknowledged.
      if(party.role==='host'&&closingParty===party)return;
      const wasStarted=started;clear();if(wasStarted)void Promise.resolve(onLeaveMatch({preserveReport:true,hostClosed:true})).catch(()=>{});status('The host closed the party.');
    }},failed));
    addWatch(lobby.watchSlots(party.partyId,value=>{
      if(gen!==generation||!party)return;slots=value||{};
      if(party.role==='pending'&&Object.values(slots).includes(party.uid)&&!joining){joining=true;party.role='guest';render();void (async()=>{
        let resumed=null;try{resumed=await lobby.reconnect(party.partyId,party.inviteCode);}catch{}
        if(gen!==generation||!party)return;
        if(!resumed){try{await lobby.publishProfile(party.partyId,getProfile());}catch(error){try{resumed=await lobby.reconnect(party.partyId,party.inviteCode);}catch{throw error;}}}
        if(gen!==generation||!party)return;
        if(resumed){await lobby.cancel(party.inviteCode).catch(()=>{});if(gen!==generation||!party)return;enterMatch(gen,resumed);}
        watchMember(gen);render();if(!started)status('Approved. Waiting for the host to start.');
      })().catch(()=>{if(gen===generation)status('Approved, but your soldier could not be published. Leave and try again.');}).finally(()=>{if(gen===generation){joining=false;render();}});}
      else if(party.role!=='pending'){watchProfiles(gen);if(party.role==='guest'&&!started&&!Object.values(slots).includes(party.uid)){clear();status('You are no longer in the party.');return;}}
      render();
    },failed));
  }
  function showRequests(gen,values){
    if(gen!==generation||party?.role!=='host')return;lastRequests=values||{};requests.replaceChildren();
    const current=party,active=lobby,visible=Object.entries(lastRequests).filter(([,request])=>request&&typeof request.name==='string'&&!request.expectedPartyId),cards=[];
    const ids=new Set(visible.map(([uid])=>uid));for(const uid of requestTokens.keys())if(!ids.has(uid))requestTokens.delete(uid);
    for(const [uid,request] of visible){
      let token=requestTokens.get(uid);if(!token||token.name!==request.name){token={name:request.name,serial:++requestSerial};requestTokens.set(uid,token);}
      // The current rules identify requests only by account, not by a server
      // nonce. This local generation catches observed removal/replacement but
      // cannot fence a replacement the client did not observe in flight.
      const stillCurrent=()=>gen===generation&&party===current&&!started&&requestTokens.get(uid)===token&&!!lastRequests[uid]&&!lastRequests[uid].expectedPartyId&&!Object.values(slots).includes(uid);
      const row=document.createElement('li'),name=document.createElement('span'),accept=document.createElement('button'),decline=document.createElement('button');
      name.textContent=request.name;accept.type=decline.type='button';accept.textContent=tr('APPROVE');decline.textContent=tr('DECLINE');
      accept.onclick=()=>run(async()=>{if(!stillCurrent())return;await active.approve(current.partyId,current.inviteCode,uid);if(gen===generation&&party===current)status('Player approved.');});
      decline.onclick=()=>run(async()=>{if(!stillCurrent())return;await active.reject(current.inviteCode,uid);if(gen===generation&&party===current)status('Request declined.');});row.append(name,accept,decline);requests.append(row);
      cards.push({key:JSON.stringify([gen,current.partyId,uid,token.serial]),title:()=>tr('JOIN REQUEST'),body:()=>tr('{name} wants to join.',{name:request.name}),valid:stillCurrent,
        actions:[{id:'view',label:()=>tr('VIEW PARTY'),run:()=>{if(!stillCurrent())return false;onViewRequests();return true;}}]});
    }
    promptCenter?.update('party-joins',started?[]:cards);
  }
  $('fourPartyCreate').onclick=()=>run(async gen=>{
    const active=createLobby();lobby=active;const result=await active.create(getProfile());if(gen!==generation){await active.close(result.partyId,result.inviteCode);return;}
    party={...result,role:'host'};status('Share the code and approve players. Start with two, three or four players.');watchParty(gen);watchMember(gen);addWatch(lobby.watchRequests(party.inviteCode,v=>showRequests(gen,v),failed));render();
  });
  async function join(code,expectedPartyId=null){return run(async gen=>{
    if(party){status('Leave your current party first.');return false;}
    if(!/^\d{4}$/.test(code)){status('Enter a four-digit code.');return false;}
    if(!await confirmStart()||gen!==generation)return false;
    const active=createLobby();lobby=active;const result=await active.request(code,getProfile().name,expectedPartyId);if(gen!==generation){await active.cancel(code);return false;}
    party={...result,role:'pending'};status(expectedPartyId?'Joining invited party…':'Request sent. Waiting for approval.');watchParty(gen);
    if(expectedPartyId){
      try{await active.claimInvitedSlot(result.partyId,code);if(gen!==generation){await active.leave(result.partyId).catch(()=>{});await active.cancel(code).catch(()=>{});return false;}await active.cancel(code).catch(()=>{});return true;}
      catch{await active.cancel(code).catch(()=>{});if(gen===generation){clear();status('Invitation expired, the party is full, or the host closed it.');}return false;}
    }
    addWatch(lobby.watchOwnRequest(code,value=>{if(gen===generation&&party?.role==='pending'&&value===null)status('Request closed. If not approved, leave and ask the host to try again.');},failed));render();return true;
  });}
  $('fourPartyJoin').onclick=()=>join($('fourPartyCodeInput').value.trim());
  $('fourPartyResume').onclick=()=>run(async gen=>{
    const code=$('fourPartyCodeInput').value.trim();if(!/^\d{4}$/.test(code)){status('Enter the four-digit party code.');return;}
    if(!await confirmStart()||gen!==generation)return;
    const active=createLobby();lobby=active;const result=await active.resumeHost(code);if(gen!==generation)return;
    party={...result,role:'host'};started=true;watchParty(gen);watchMember(gen);render();status('Recovering the match…');
    const ok=await onMatch(result,{isCurrent:()=>gen===generation&&!!party&&started});if(gen===generation&&ok===false)status('Could not recover the match. Close the party and try again.');
  });
  $('fourPartyMode').onchange=()=>{selectedMode=$('fourPartyMode').value;render();};
  $('fourPartyTeams').onchange=()=>{selectedTeams=Number($('fourPartyTeams').value);if(!teams[selectedTeams])selectedTeams=0;render();};
  $('fourPartyStart').onclick=()=>run(async gen=>{
    if(party?.role!=='host'||!ready()||started||!await confirmStart()||gen!==generation||!party||!ready())return;
    await lobby.configure(party.partyId,{mode:selectedMode,teams:teams[selectedTeams]});if(gen!==generation||!party||!ready())return;const result=await lobby.start(party.partyId);if(gen!==generation)return;started=true;render();status('Match started. Connecting…');const ok=await onMatch({...result,partyId:party.partyId},{isCurrent:()=>gen===generation&&!!party&&started});if(gen===generation&&ok===false)status('Could not connect to the match. Close the party and try again.');
  });
  const leaveParty=()=>run(async gen=>{
    if(!party||joining)return;const current=party,active=lobby;if(current.role==='host'&&(!await confirmClose({started})||gen!==generation||party!==current))return;
    if(started&&current.role==='host'){
      // A started match stays alive while every player receives the final
      // report and saves their own rewards; this request is not a deletion.
      const requested=await onRequestHostEnd(current.partyId);
      if(gen===generation&&party===current)status(requested?'Waiting for all reports and saved rewards before closing the party.':'Could not end the match yet. Reconnect and try again.');
      return !!requested;
    }
    if(started)await onLeaveMatch();if(current.role==='host')await active.close(current.partyId,current.inviteCode);else if(!started&&current.role==='guest')await active.leave(current.partyId);else if(!started)await active.cancel(current.inviteCode);
    if(gen===generation){const lockedGuest=started&&current.role==='guest';clear();if(lockedGuest)rememberLockedGuest(active,current);status(current.role==='host'?'Party closed.':'You left the party.');return true;}
  });
  const completeParty=(partyId,endTick)=>run(async gen=>{
    const current=party,active=lobby;
    if(!current||current.role!=='host'||!started||current.partyId!==partyId||!canCompleteEnd(partyId,endTick))return false;
    closingParty=current;
    try{
      // Delete first. An offline/failed delete must leave the session and its
      // final snapshot available for retry. Once Firebase acknowledges the
      // atomic delete, a broken or stalled local transport stop cannot make the
      // already-deleted party exist again or hold the panel open forever.
      await active.close(current.partyId,current.inviteCode);
      if(gen!==generation||party!==current)return false;
      clear();status('Party closed.');
      try{void Promise.resolve(onLeaveMatch({preserveReport:true,hostClosed:true})).catch(()=>{});}catch{/* The confirmed deletion still stands. */}
      return true;
    }finally{if(closingParty===current)closingParty=null;}
  });
  const forceCompleteParty=async(partyId,endTick)=>{
    const current=party,genAtAsk=generation;
    if(busy||forceConfirming||!current||current.role!=='host'||!started||current.partyId!==partyId||!canForceCloseEnd(partyId,endTick))return false;
    const detail=endState&&endState.partyId===partyId&&endState.endTick===endTick?endState:null;
    const entries=detail?.missingEntries||[];
    forceConfirming=true;
    let confirmed=false;
    try{
      confirmed=await confirmForceClose({
        partyId,endTick,entries,
        missingNames:entries.map(e=>e.name),
        departedNames:entries.filter(e=>e.state==='departed').map(e=>e.name),
        offlineNames:entries.filter(e=>e.state==='offline').map(e=>e.name),
      });
    }finally{forceConfirming=false;}
    if(!confirmed||genAtAsk!==generation||party!==current||!canForceCloseEnd(partyId,endTick))return false;
    return run(async gen=>{
      const active=lobby;
      if(gen!==genAtAsk||gen!==generation||party!==current||!started||!canForceCloseEnd(partyId,endTick))return false;
      closingParty=current;
      try{
        await active.close(current.partyId,current.inviteCode);
        if(gen!==generation||party!==current)return false;
        clear();status('Party closed.');
        try{void Promise.resolve(onLeaveMatch({preserveReport:true,hostClosed:true,forced:true})).catch(()=>{});}catch{/* The confirmed deletion still stands. */}
        return true;
      }finally{if(closingParty===current)closingParty=null;}
    });
  };
  $('fourPartyLeave').onclick=leaveParty;
  $('fourPartyForceClose').onclick=()=>{if(endState)void forceCompleteParty(endState.partyId,endState.endTick);};
  async function leaveForLogout(timeoutMs=2000){
    const old=party,active=lobby,wasStarted=started;clear();clearRetained();root.hidden=true;
    // Signing out or an enforced teardown cannot prove delivery to the other
    // accounts. Leave a started party intact rather than silently deleting it.
    const cleanup=(async()=>{if(wasStarted)await onLeaveMatch();if(!old)return;if(old.role==='host'&&!wasStarted)await active.close(old.partyId,old.inviteCode);else if(!wasStarted&&old.role==='guest')await active.leave(old.partyId);else if(!wasStarted&&old.role!=='host')await active.cancel(old.inviteCode);})().catch(()=>{});
    let timer;await Promise.race([cleanup,new Promise(resolve=>{timer=setTimeout(resolve,timeoutMs);})]);clearTimeout(timer);
  }
  function completionStatus(partyId,value,detail=null){
    if(!party||party.partyId!==partyId||!started)return;
    endState=detail?{partyId,endTick:detail.endTick,canForceClose:!!detail.canForceClose,missingEntries:detail.missingEntries||[]}:null;
    render();
    if(value==='saving')status('Saving rewards before closing the party…');
    else if(value==='closing')status('Closing the party…');
    else if(detail?.missingEntries?.length)status('Waiting for reports and saved rewards from: {names}.',{},detail.missingEntries);
    else status('Waiting for all reports and saved rewards before closing the party.');
  }
  onLanguageChange(()=>{renderedModes='';render();paintStatus();if(party?.role==='host'&&!started)showRequests(generation,lastRequests);});
  root.hidden=true;render();return {show(){root.hidden=false;},hide(){root.hidden=true;},isActive:()=>!!party,isBusy:()=>busy||joining||retainedParties.size>0,startedHostPartyId:()=>started&&party?.role==='host'?party.partyId:null,profileNameFor:id=>profiles[id]?.name||null,hostInvite:()=>party?.role==='host'&&!started&&Object.values(slots).filter(Boolean).length<3?{partyId:party.partyId,code:party.inviteCode}:null,joinInvite:invite=>join(invite.code,invite.partyId),leaveParty,completeParty,forceCompleteParty,completionStatus,leaveForLogout};
}
