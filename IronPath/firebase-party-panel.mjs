// Private party UI prototype. Kept disabled until Firebase rules, match wiring,
// lifecycle and live-account testing are complete. Codes are bearer secrets.
export function createFirebasePartyPanel({document,createLobby,clipboard,enabled=false}){
  const $=id=>document.getElementById(id),root=$('firebaseParty');
  let lobby=null,party=null,unwatch=null,busy=false,version=0;
  root.hidden=!enabled;
  function render(message=''){
    $('partyStatus').textContent=message;
    $('partyEntry').hidden=!!party;$('partyActive').hidden=!party;
    $('partyCodeDisplay').textContent=party?.role==='host'?party.partyId:'';
    $('partyCopy').hidden=party?.role!=='host';
    for(const id of ['partyCreate','partyJoin','partyLeave','partyCopy'])$(id).disabled=busy;
  }
  function reset(){version++;unwatch?.();unwatch=null;lobby=null;party=null;busy=false;$('partyCodeInput').value='';render('');}
  async function run(operation){if(!enabled||busy)return;busy=true;const current=version;render('Working…');try{await operation(current);}catch{if(current===version)render('Could not complete the party request. Check your connection and try again.');}finally{if(current===version){busy=false;for(const id of ['partyCreate','partyJoin','partyLeave','partyCopy'])$(id).disabled=false;}}}
  $('partyCreate').onclick=()=>run(async current=>{
    const next=createLobby(),result=await next.create();if(current!==version)return;
    lobby=next;party={...result,role:'host'};render('Share this private code. Waiting for your teammate.');
    unwatch=lobby.watchGuest(party.partyId,guest=>{if(current===version&&party?.role==='host')render(guest?'Teammate joined. Match integration is not ready yet.':'Share this private code. Waiting for your teammate.');},()=>{if(current===version)render('Party connection lost.');});
  });
  $('partyJoin').onclick=()=>run(async current=>{
    const code=$('partyCodeInput').value.trim().toLowerCase();if(!/^[a-f0-9]{32}$/.test(code)){render('Enter a valid 32-character party code.');return;}
    const next=createLobby(),result=await next.join(code);if(current!==version)return;
    lobby=next;party={...result,role:'guest'};$('partyCodeInput').value='';render('Joined. Match integration is not ready yet.');
  });
  $('partyLeave').onclick=()=>run(async current=>{
    if(!party)return;const ok=party.role==='host'?await lobby.close(party.partyId):await lobby.leaveGuest(party.partyId);
    if(current!==version)return;if(!ok)throw new Error('Party could not be left');
    unwatch?.();unwatch=null;lobby=null;party=null;render('Party closed.');
  });
  $('partyCopy').onclick=()=>run(async current=>{
    if(!party||party.role!=='host'||!clipboard?.writeText){render('Select the code above to copy it.');return;}
    await clipboard.writeText(party.partyId);if(current===version)render('Party code copied. Share it privately.');
  });
  render();return {reset};
}
