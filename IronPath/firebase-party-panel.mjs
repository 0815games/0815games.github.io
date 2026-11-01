// Experimental private party UI. Disabled until rules and real-account testing
// are complete. Party codes are bearer secrets, never navigation destinations.
export function createFirebasePartyPanel({document,createLobby,getProfile=()=>null,onJoinMatch=()=>false,onLeaveMatch=()=>{},confirmMatch=()=>true,clipboard,enabled=false}){
  const $=id=>document.getElementById(id),root=$('firebaseParty');
  let lobby=null,party=null,unwatch=[],busy=false,version=0,guest=null,matchStarted=false;
  root.hidden=!enabled;
  function render(message=''){
    $('partyStatus').textContent=message;$('partyEntry').hidden=!!party;$('partyActive').hidden=!party;
    $('partyCodeDisplay').textContent=party?.role==='host'?party.partyId:'';$('partyCopy').hidden=party?.role!=='host';
    $('partyStart').hidden=party?.role!=='host';
    for(const id of ['partyCreate','partyJoin','partyLeave','partyCopy'])$(id).disabled=busy;
    $('partyStart').disabled=busy||!guest||matchStarted;
  }
  function clearWatchers(){for(const fn of unwatch)fn();unwatch=[];}
  function reset(){version++;clearWatchers();void onLeaveMatch();lobby=null;party=null;guest=null;matchStarted=false;busy=false;$('partyCodeInput').value='';render('');}
  async function run(operation){if(!enabled||busy)return;busy=true;const current=version;render('Working…');try{await operation(current);}catch{if(current===version)render('Could not complete the party request. Check your connection and try again.');}finally{if(current===version){busy=false;for(const id of ['partyCreate','partyJoin','partyLeave','partyCopy'])$(id).disabled=false;$('partyStart').disabled=!guest||matchStarted;}}}
  function watchHost(current){const stop=lobby.watchHost(party.partyId,value=>{if(current===version&&party&&value!==party.hostId){void onLeaveMatch();clearWatchers();lobby=null;party=null;guest=null;matchStarted=false;render('The host closed the party.');}},()=>{if(current===version)render('Party connection lost.');});if(current===version&&party)unwatch.push(stop);else stop();}
  $('partyCreate').onclick=()=>run(async current=>{
    const next=createLobby(),result=await next.create();if(current!==version)return;
    lobby=next;party={...result,role:'host'};render('Preparing your party…');watchHost(current);
    await lobby.publishProfile(party.partyId,getProfile());if(current!==version||!party)return;
    unwatch.push(lobby.watchGuest(party.partyId,value=>{
      if(current!==version||party?.role!=='host')return;
      if(matchStarted&&value!==guest){void onLeaveMatch();guest=null;render('Teammate left. Close this party to start another match.');return;}
      guest=value;render(guest?'Teammate joined. Start when ready.':'Share this private code. Waiting for your teammate.');
    },()=>{if(current===version)render('Party connection lost.');}));
  });
  $('partyJoin').onclick=()=>run(async current=>{
    const code=$('partyCodeInput').value.trim().toLowerCase();if(!/^[a-f0-9]{32}$/.test(code)){render('Enter a valid 32-character party code.');return;}
    const next=createLobby(),result=await next.join(code);if(current!==version)return;
    lobby=next;party={...result,role:'guest'};$('partyCodeInput').value='';render('Preparing your soldier…');watchHost(current);
    await lobby.publishProfile(code,getProfile());if(current!==version||!party)return;
    unwatch.push(lobby.watchMatch(code,startedGuest=>{
      if(current!==version||!party||matchStarted||startedGuest!==party.guestId)return;
      if(!confirmMatch()){render('Match not joined. Leave the party to return to solo.');return;}
      matchStarted=true;const joined=onJoinMatch({partyId:code,hostId:party.hostId,playerIds:[party.hostId,party.guestId]},state=>{if(current===version&&party)render(`Co-op: ${state}.`);});
      render(joined?'Connecting to the match…':'Could not join the match. Leave and try again.');
    },()=>{if(current===version)render('Party connection lost.');}));
    if(!matchStarted)render('Joined. Waiting for the host to start.');
  });
  $('partyStart').onclick=()=>run(async current=>{
    if(!party||party.role!=='host'||!guest||matchStarted||!confirmMatch())return;
    const result=await lobby.startMatch(party.partyId);if(current!==version||!party)return;
    matchStarted=true;const joined=onJoinMatch({partyId:result.partyId,hostId:result.hostId,playerIds:[result.hostId,result.guestId],profiles:result.profiles},state=>{if(current===version&&party)render(`Co-op: ${state}.`);});
    render(joined?'Connecting to the match…':'Could not start the match. Close this party and try again.');
  });
  $('partyLeave').onclick=()=>run(async current=>{
    if(!party)return;await onLeaveMatch();const ok=party.role==='host'?await lobby.close(party.partyId):await lobby.leaveGuest(party.partyId);
    if(current!==version)return;if(!ok)throw new Error('Party could not be left');
    clearWatchers();lobby=null;party=null;guest=null;matchStarted=false;render('Party closed.');
  });
  $('partyCopy').onclick=()=>run(async current=>{
    if(!party||party.role!=='host'||!clipboard?.writeText){render('Select the code above to copy it.');return;}
    await clipboard.writeText(party.partyId);if(current===version)render('Party code copied. Share it privately.');
  });
  render();return {reset};
}
