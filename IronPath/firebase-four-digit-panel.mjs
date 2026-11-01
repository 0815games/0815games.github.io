// Staged UI for the four-digit approval flow. Only enable with matching rules.
export function createFourDigitPanel({document,createLobby,createApproval,getProfile,onJoinMatch,onLeaveMatch,confirmMatch,confirmClose=()=>true,enabled=false}){
  const $=id=>document.getElementById(id),root=$('firebaseParty'),requests=$('partyRequests');
  let base=null,approval=null,party=null,unwatch=[],profileWatch=null,guest=null,guestReady=false,matchGuest=null,started=false,busy=false,version=0;
  root.hidden=!enabled;
  function render(message){
    if(message!==undefined)$('partyStatus').textContent=message;
    $('partyEntry').hidden=!!party;$('partyActive').hidden=!party;
    $('partyCodeDisplay').textContent=party?.role==='host'?party.inviteCode:'';
    $('partyCodeArea').hidden=party?.role!=='host';$('partyStart').hidden=party?.role!=='host';
    $('partyLeave').textContent=party?.role==='host'?'CLOSE PARTY':party?.role==='pending'?'CANCEL REQUEST':'LEAVE PARTY';
    $('partyStart').disabled=busy||!guest||!guestReady||started;
    for(const id of ['partyCreate','partyJoin','partyLeave'])$(id).disabled=busy;
    requests.hidden=party?.role!=='host';
  }
  function clear(){profileWatch?.();profileWatch=null;for(const fn of unwatch)fn();unwatch=[];requests.replaceChildren();}
  function reset(){version++;clear();const stopped=Promise.resolve().then(()=>onLeaveMatch()).catch(()=>{});base=null;approval=null;party=null;guest=null;guestReady=false;started=false;matchGuest=null;busy=false;$('partyCodeInput').value='';render('');return stopped;}
  async function run(fn){if(!enabled||busy)return;busy=true;const current=version;render();try{await fn(current);}catch{if(current===version)render('Could not complete the party request. Check your connection and try again.');}finally{if(current===version){busy=false;render();}}}
  async function cleanup(oldParty,oldBase,oldApproval){if(!oldParty)return;if(oldParty.role==='host')await oldApproval.close(oldParty.partyId,oldParty.inviteCode);else if(oldParty.role==='guest')await oldBase.leaveGuest(oldParty.partyId);else await oldApproval.cancel(oldParty.inviteCode);}
  async function leaveForLogout(timeoutMs=2000){const p=party,b=base,a=approval,stopped=reset();const done=(async()=>{await stopped;await cleanup(p,b,a);})().catch(()=>{});let timer;await Promise.race([done,new Promise(resolve=>{timer=setTimeout(resolve,timeoutMs);})]);clearTimeout(timer);}
  function watchHost(current){unwatch.push(base.watchHost(party.partyId,value=>{if(current===version&&party&&value!==party.hostId){void reset();render('The host closed the party.');}},()=>{if(current===version)render('Party connection lost.');}));}
  function watchGuest(current){unwatch.push(base.watchGuest(party.partyId,value=>{
    if(current!==version||party?.role!=='host')return;
    if(started){guest=value;render(value===matchGuest?'Teammate rejoined the battle.':'Teammate left. Your battle continues.');return;}
    if(value===guest)return;profileWatch?.();profileWatch=null;guest=value;guestReady=false;
    if(!value){render('Share the code. Waiting for a join request.');return;}
    render('Player approved. Waiting for their soldier…');const watched=value;
    profileWatch=base.watchProfile(party.partyId,value,profile=>{if(current!==version||party?.role!=='host'||guest!==watched)return;guestReady=!!profile;render(guestReady?'Teammate ready. Start when ready.':'Waiting for teammate details.');},()=>{if(current===version&&guest===watched)render('Waiting for teammate details.');});
  },()=>{if(current===version)render('Party connection lost.');}));}
  function showRequests(current,values){
    requests.replaceChildren();if(current!==version||party?.role!=='host')return;
    for(const [uid,profile] of Object.entries(values)){
      if(!profile||typeof profile.name!=='string')continue;
      const row=document.createElement('div'),label=document.createElement('span'),accept=document.createElement('button'),reject=document.createElement('button');
      label.textContent=`${profile.name} wants to join. `;accept.textContent='APPROVE';reject.textContent='DECLINE';accept.type=reject.type='button';
      accept.onclick=()=>run(async v=>{await approval.approve(party.partyId,party.inviteCode,uid);if(v===version)render('Player approved.');});
      reject.onclick=()=>run(async v=>{await approval.reject(party.inviteCode,uid);if(v===version)render('Request declined.');});
      row.append(label,accept,reject);requests.append(row);
    }
  }
  $('partyCreate').onclick=()=>run(async current=>{
    base=createLobby();approval=createApproval(base);const result=await approval.create();if(current!==version)return;
    party={...result,role:'host'};render('Preparing your party…');watchHost(current);
    await base.publishProfile(party.partyId,getProfile());if(current!==version||!party)return;
    watchGuest(current);unwatch.push(approval.watchRequests(party.inviteCode,values=>showRequests(current,values),()=>{if(current===version)render('Could not read join requests.');}));render('Share the four-digit code. Approve your teammate when they ask to join.');
  });
  $('partyJoin').onclick=()=>run(async current=>{
    const code=$('partyCodeInput').value.trim();if(!/^\d{4}$/.test(code)){render('Enter the four-digit party code.');return;}
    base=createLobby();approval=createApproval(base);const result=await approval.request(code,getProfile().name);if(current!==version)return;
    party={...result,role:'pending'};$('partyCodeInput').value='';render('Request sent. Waiting for host approval…');watchHost(current);
    let accepting=false;
    unwatch.push(base.watchGuest(party.partyId,value=>{
      if(current!==version||!party||party.role!=='pending'||value!==party.guestId||accepting)return;accepting=true;
      void (async()=>{
        const startedGuest=await approval.readStarted(party.partyId);if(current!==version||!party)return;
        party.role='guest';if(startedGuest!==party.guestId)await base.publishProfile(party.partyId,getProfile());if(current!==version||!party)return;
        unwatch.push(base.watchMatch(party.partyId,value=>{
          if(current!==version||!party||started||value!==party.guestId)return;
          if(!confirmMatch()){render('Match not joined. Leave the party to return to solo.');return;}
          started=true;const joined=onJoinMatch({partyId:party.partyId,hostId:party.hostId,playerIds:[party.hostId,party.guestId]},state=>{if(current===version&&party)render(`Co-op: ${state}.`);});
          render(joined?'Connecting to the match…':'Could not join the match. Leave and try again.');
        },()=>{if(current===version)render('Party connection lost.');}));
        if(!started)render('Approved. Waiting for the host to start.');
      })().catch(()=>{if(current===version)render('Could not join the approved party. Leave and try again.');});
    },()=>{if(current===version)render('Party connection lost.');}));
    unwatch.push(approval.watchOwnRequest(code,value=>{
      if(value!==null||current!==version||party?.role!=='pending')return;
      void approval.readGuest(party.partyId).then(id=>{if(current===version&&party?.role==='pending'&&id!==party.guestId){void reset();render('Join request declined.');}}).catch(()=>{if(current===version)render('Party connection lost.');});
    },()=>{if(current===version)render('Party connection lost.');}));
  });
  $('partyStart').onclick=()=>run(async current=>{
    if(!party||party.role!=='host'||!guest||!guestReady||started||!confirmMatch())return;
    const result=await base.startMatch(party.partyId);if(current!==version||!party)return;
    started=true;matchGuest=result.guestId;const joined=onJoinMatch({partyId:result.partyId,hostId:result.hostId,playerIds:[result.hostId,result.guestId],profiles:result.profiles},state=>{if(current===version&&party)render(state==='ready'&&!guest?'Teammate left. Your battle continues.':`Co-op: ${state}.`);});render(joined?'Connecting to the match…':'Could not start the match. Close the party and try again.');
  });
  $('partyLeave').onclick=()=>run(async current=>{if(!party||(party.role==='host'&&!confirmClose()))return;const wasHost=party.role==='host';await onLeaveMatch();await cleanup(party,base,approval);if(current!==version)return;clear();base=null;approval=null;party=null;guest=null;guestReady=false;started=false;matchGuest=null;render(wasHost?'Party closed.':'You left the party.');});
  render('');return {reset,leaveForLogout};
}
