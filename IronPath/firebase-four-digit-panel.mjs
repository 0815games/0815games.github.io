// Staged UI for the four-digit approval flow. Only enable with matching rules.
import {translateText as tr} from './language.mjs?v=20261130-germanfull1';
export function createFourDigitPanel({document,createLobby,createApproval,getProfile,onJoinMatch,onLeaveMatch,confirmMatch,confirmClose=()=>true,enabled=false}){
  const $=id=>document.getElementById(id),root=$('firebaseParty'),requests=$('partyRequests'),toggle=$('partyToggle');
  let base=null,approval=null,party=null,unwatch=[],profileWatch=null,guest=null,guestReady=false,matchGuest=null,started=false,busy=false,version=0;
  root.hidden=true;toggle.hidden=!enabled;toggle.setAttribute('aria-expanded','false');
  function collapse(){root.hidden=true;toggle.setAttribute('aria-expanded','false');}
  function updateRequestIndicator(count){toggle.textContent=count?tr('MULTIPLAYER •'):tr('MULTIPLAYER');toggle.setAttribute('aria-label',count?tr('Multiplayer, join request waiting'):tr('Multiplayer party'));}
  updateRequestIndicator(0);
  toggle.onclick=()=>{if(!enabled)return;root.hidden=!root.hidden;toggle.setAttribute('aria-expanded',String(!root.hidden));};
  function render(message){
    if(message!==undefined)$('partyStatus').textContent=message;
    $('partyEntry').hidden=!!party;$('partyActive').hidden=!party;
    $('partyCodeDisplay').textContent=party?.role==='host'?party.inviteCode:'';
    $('partyCodeArea').hidden=party?.role!=='host';$('partyStart').hidden=party?.role!=='host';$('partyModeArea').hidden=party?.role!=='host'||!guestReady||started;$('partyMode').disabled=busy||started;
    $('partyLeave').textContent=party?.role==='host'?tr('CLOSE PARTY'):party?.role==='pending'?tr('CANCEL REQUEST'):tr('LEAVE PARTY');
    $('partyStart').disabled=busy||!guest||!guestReady||started;
    for(const id of ['partyCreate','partyJoin','partyLeave'])$(id).disabled=busy;
    requests.hidden=party?.role!=='host';
  }
  function clear(){profileWatch?.();profileWatch=null;for(const fn of unwatch)fn();unwatch=[];requests.replaceChildren();updateRequestIndicator(0);}
  function reset(){version++;clear();const stopped=Promise.resolve().then(()=>onLeaveMatch()).catch(()=>{});base=null;approval=null;party=null;guest=null;guestReady=false;started=false;matchGuest=null;busy=false;$('partyCodeInput').value='';render('');return stopped;}
  async function run(fn){if(!enabled||busy)return;busy=true;const current=version;render();try{return await fn(current);}catch{if(current===version)render(tr('Could not complete the party request. Check your connection and try again.'));}finally{if(current===version){busy=false;render();}}}
  async function cleanup(oldParty,oldBase,oldApproval){if(!oldParty)return;if(oldParty.role==='host')await oldApproval.close(oldParty.partyId,oldParty.inviteCode);else if(oldParty.role==='guest')await oldBase.leaveGuest(oldParty.partyId);else await oldApproval.cancel(oldParty.inviteCode);}
  async function leaveForLogout(timeoutMs=2000){const p=party,b=base,a=approval,stopped=reset();const done=(async()=>{await stopped;await cleanup(p,b,a);})().catch(()=>{});let timer;await Promise.race([done,new Promise(resolve=>{timer=setTimeout(resolve,timeoutMs);})]);clearTimeout(timer);}
  function watchHost(current){unwatch.push(base.watchHost(party.partyId,value=>{if(current===version&&party&&value!==party.hostId){void reset();render(tr('The host closed the party.'));}},()=>{if(current===version)render(tr('Party connection lost.'));}));}
  function watchGuest(current){unwatch.push(base.watchGuest(party.partyId,value=>{
    if(current!==version||party?.role!=='host')return;
    if(started){guest=value;render(value===matchGuest?'Teammate rejoined the battle.':'Teammate left. Your battle continues.');return;}
    if(value===guest)return;profileWatch?.();profileWatch=null;guest=value;guestReady=false;
    if(!value){render(tr('Share the code. Waiting for a join request.'));return;}
    render(tr('Player approved. Waiting for their soldier…'));const watched=value;
    profileWatch=base.watchProfile(party.partyId,value,profile=>{if(current!==version||party?.role!=='host'||guest!==watched)return;guestReady=!!profile;render(guestReady?'Teammate ready. Start when ready.':'Waiting for teammate details.');},()=>{if(current===version&&guest===watched)render(tr('Waiting for teammate details.'));});
  },()=>{if(current===version)render(tr('Party connection lost.'));}));}
  function showRequests(current,values){
    requests.replaceChildren();if(current!==version||party?.role!=='host')return;
    updateRequestIndicator(Object.values(values).filter(profile=>profile&&typeof profile.name==='string').length);
    for(const [uid,profile] of Object.entries(values)){
      if(!profile||typeof profile.name!=='string')continue;
      const row=document.createElement('div'),label=document.createElement('span'),accept=document.createElement('button'),reject=document.createElement('button');
      label.textContent=`${tr('{name} wants to join.',{name:profile.name})} `;accept.textContent=tr('APPROVE');reject.textContent=tr('DECLINE');accept.type=reject.type='button';
      accept.onclick=()=>run(async v=>{await approval.approve(party.partyId,party.inviteCode,uid);if(v===version)render(tr('Player approved.'));});
      reject.onclick=()=>run(async v=>{await approval.reject(party.inviteCode,uid);if(v===version)render(tr('Request declined.'));});
      row.append(label,accept,reject);requests.append(row);
    }
  }
  $('partyCreate').onclick=()=>run(async current=>{
    base=createLobby();approval=createApproval(base);const result=await approval.create();if(current!==version)return;
    party={...result,role:'host'};render(tr('Preparing your party…'));watchHost(current);
    await base.publishProfile(party.partyId,getProfile());if(current!==version||!party)return;
    watchGuest(current);unwatch.push(approval.watchRequests(party.inviteCode,values=>showRequests(current,values),()=>{if(current===version)render(tr('Could not read join requests.'));}));render(tr('Share the four-digit code. Approve your teammate when they ask to join.'));
  });
  $('partyJoin').onclick=()=>run(async current=>{
    const code=$('partyCodeInput').value.trim();if(!/^\d{4}$/.test(code)){render(tr('Enter the four-digit party code.'));return;}
    base=createLobby();approval=createApproval(base);const result=await approval.request(code,getProfile().name);if(current!==version)return;
    party={...result,role:'pending'};$('partyCodeInput').value='';render(tr('Request sent. Waiting for host approval…'));watchHost(current);
    let accepting=false,confirmingMatch=false;
    unwatch.push(base.watchGuest(party.partyId,value=>{
      if(current!==version||!party||party.role!=='pending'||value!==party.guestId||accepting)return;accepting=true;
      void (async()=>{
        const startedGuest=await approval.readStarted(party.partyId);if(current!==version||!party)return;
        party.role='guest';if(startedGuest!==party.guestId)await base.publishProfile(party.partyId,getProfile());if(current!==version||!party)return;
        unwatch.push(base.watchMatch(party.partyId,value=>{
          if(current!==version||!party||started||confirmingMatch||value!==party.guestId)return;
          confirmingMatch=true;void (async()=>{
            const accepted=await confirmMatch();if(current!==version||!party||started)return;
            if(!accepted){render(tr('Match not joined. Leave the party to return to solo.'));return;}
            started=true;const joined=onJoinMatch({partyId:party.partyId,hostId:party.hostId,playerIds:[party.hostId,party.guestId]},state=>{if(current===version&&party)render(tr('Multiplayer: {state}.',{state}));});
            render(joined?'Connecting to the match…':'Could not join the match. Leave and try again.');if(joined)collapse();
          })().catch(()=>{if(current===version)render(tr('Could not join the match. Leave and try again.'));}).finally(()=>{confirmingMatch=false;});
        },()=>{if(current===version)render(tr('Party connection lost.'));}));
        if(!started)render(tr('Approved. Waiting for the host to start.'));
      })().catch(()=>{if(current===version)render(tr('Could not join the approved party. Leave and try again.'));});
    },()=>{if(current===version)render(tr('Party connection lost.'));}));
    unwatch.push(approval.watchOwnRequest(code,value=>{
      if(value!==null||current!==version||party?.role!=='pending')return;
      void approval.readGuest(party.partyId).then(id=>{if(current===version&&party?.role==='pending'&&id!==party.guestId){void reset();render(tr('Join request declined.'));}}).catch(()=>{if(current===version)render(tr('Party connection lost.'));});
    },()=>{if(current===version)render(tr('Party connection lost.'));}));
  });
  $('partyStart').onclick=()=>run(async current=>{
    if(!party||party.role!=='host'||!guest||!guestReady||started)return;
    const confirmedGuest=guest;if(!await confirmMatch()||current!==version||!party||party.role!=='host'||guest!==confirmedGuest||!guestReady||started)return;
    const result=await base.startMatch(party.partyId);if(current!==version||!party)return;
    started=true;matchGuest=result.guestId;const mode=$('partyMode').value==='versus'?'versus':'coop';const joined=onJoinMatch({mode,partyId:result.partyId,hostId:result.hostId,playerIds:[result.hostId,result.guestId],profiles:result.profiles},state=>{if(current===version&&party)render(state==='ready'&&!guest?'Teammate left. Your battle continues.':`Multiplayer: ${state}.`);});render(joined?'Connecting to the match…':'Could not start the match. Close the party and try again.');if(joined)collapse();
  });
  const leaveParty=()=>run(async current=>{if(!party)return;if(party.role==='host'&&(!await confirmClose()||current!==version||!party))return;const wasHost=party.role==='host';await onLeaveMatch();await cleanup(party,base,approval);if(current!==version)return;clear();base=null;approval=null;party=null;guest=null;guestReady=false;started=false;matchGuest=null;render(wasHost?'Party closed.':'You left the party.');return true;});
  $('partyLeave').onclick=leaveParty;
  render('');return {reset,leaveForLogout,leaveParty,collapse,isActive:()=>!!party};
}
