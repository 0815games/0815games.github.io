// Experimental four-player panel. Not instantiated by the live application:
// it requires reviewed, published rules and a complete four-player game handoff.
import {fourTeamRosters} from './firebase-four-lobby.mjs?v=20261103-fourlobby1';
export function createFourPlayerPanel({document,createLobby,getProfile,onMatch,confirmStart=async()=>true,onLeaveMatch=async()=>{}}){
  if(!document||![createLobby,getProfile,onMatch,confirmStart,onLeaveMatch].every(fn=>typeof fn==='function'))throw Error('Invalid panel configuration');
  const $=id=>document.getElementById(id),root=$('fourPartyPanel'),requests=$('fourPartyRequests'),roster=$('fourPartyRoster');
  const teams=[[0,0,1,1],[0,1,0,1],[0,1,1,0]];
  let lobby=null,party=null,slots={},profiles={},config=null,started=false,busy=false,generation=0,unwatch=[],profileWatches=new Map(),joining=false;
  function status(message){$('fourPartyStatus').textContent=message;}
  function clear(){generation++;for(const stop of unwatch)stop();unwatch=[];for(const entry of profileWatches.values())entry.stop?.();profileWatches.clear();lobby=null;party=null;slots={};profiles={};config=null;started=false;busy=false;joining=false;requests.replaceChildren();roster.replaceChildren();render();}
  function render(){
    $('fourPartyEntry').hidden=!!party;$('fourPartyActive').hidden=!party;
    const host=party?.role==='host',pending=party?.role==='pending';
    $('fourPartyCodeDisplay').textContent=host?party.inviteCode:'';$('fourPartyCodeArea').hidden=!host;
    $('fourPartySettings').hidden=!host||started;requests.hidden=!host||started;
    $('fourPartyStart').hidden=!host||started;
    $('fourPartyStart').disabled=busy||!host||started||!ready();
    $('fourPartyLeave').hidden=started&&!host;
    $('fourPartyLeave').textContent=host?'CLOSE PARTY':pending?'CANCEL REQUEST':started?'LEAVE MATCH':'LEAVE PARTY';
    for(const id of ['fourPartyCreate','fourPartyJoin','fourPartyLeave','fourPartyMode','fourPartyTeams'])$(id).disabled=busy;
    if(joining)$('fourPartyLeave').disabled=true;
    if(config){$('fourPartyMode').value=config.mode;const choice=teams.findIndex(t=>t.every((v,i)=>v===config.teams?.[i]));if(choice>=0)$('fourPartyTeams').value=String(choice);}
    $('fourPartyTeamsLabel').hidden=$('fourPartyTeams').hidden=config?.mode!=='two-vs-two';
    roster.replaceChildren();if(!party||pending)return;
    [party.hostId,slots.one,slots.two,slots.three].forEach((id,index)=>{
      const item=document.createElement('li'),profile=id&&profiles[id],team=config?.mode==='two-vs-two'?` · Team ${config.teams?.[index]===0?'A':'B'}`:'';
      item.textContent=id?`${profile?.name||'Waiting for soldier'}${index===0?' · Host':''}${team}${profile?' · Ready':' · Not ready'}`:`Slot ${index+1} · Open`;roster.append(item);
    });
  }
  function ready(){return !!party&&!!config&&[party.hostId,slots.one,slots.two,slots.three].every(id=>id&&profiles[id]);}
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
    try{const teamRosters=fourTeamRosters(value);if(!value.playerIds.includes(party.uid)||value.hostId!==party.hostId)throw Error('Roster changed');started=true;render();status('Match started. Connecting…');Promise.resolve(onMatch({...value,partyId:party.partyId,teamRosters})).then(ok=>{if(gen===generation)status(ok===false?'Could not connect to the match. Leave and try again.':'Connecting to the match…');}).catch(failed);}catch{failed();}
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
    addWatch(lobby.watchHost(party.partyId,value=>{if(gen===generation&&party&&value!==party.hostId){const wasStarted=started;clear();if(wasStarted)void Promise.resolve(onLeaveMatch()).catch(()=>{});status('The host closed the party.');}},failed));
    addWatch(lobby.watchSlots(party.partyId,value=>{
      if(gen!==generation||!party)return;slots=value||{};
      if(party.role==='pending'&&Object.values(slots).includes(party.uid)&&!joining){joining=true;party.role='guest';render();void (async()=>{
        let resumed=null;try{resumed=await lobby.reconnect(party.partyId,party.inviteCode);}catch{}
        if(gen!==generation||!party)return;
        if(!resumed){try{await lobby.publishProfile(party.partyId,getProfile());}catch(error){try{resumed=await lobby.reconnect(party.partyId,party.inviteCode);}catch{throw error;}}}
        if(gen!==generation||!party)return;
        if(resumed){await lobby.cancel(party.inviteCode).catch(()=>{});if(gen!==generation||!party)return;enterMatch(gen,resumed);}
        watchMember(gen);render();if(!started)status('Approved. Waiting for the host to start.');
      })().catch(()=>{if(gen===generation)status('Approved, but your soldier could not be published. Leave and try again.');}).finally(()=>{joining=false;if(gen===generation)render();});}
      else if(party.role!=='pending'){watchProfiles(gen);if(party.role==='guest'&&!started&&!Object.values(slots).includes(party.uid)){clear();status('You are no longer in the party.');return;}}
      render();
    },failed));
  }
  function showRequests(gen,values){
    if(gen!==generation||party?.role!=='host')return;requests.replaceChildren();
    for(const [uid,request] of Object.entries(values||{})){
      if(!request||typeof request.name!=='string')continue;
      const row=document.createElement('li'),name=document.createElement('span'),accept=document.createElement('button'),decline=document.createElement('button');
      name.textContent=request.name;accept.type=decline.type='button';accept.textContent='APPROVE';decline.textContent='DECLINE';
      accept.onclick=()=>run(async()=>{await lobby.approve(party.partyId,party.inviteCode,uid);status('Player approved.');});
      decline.onclick=()=>run(async()=>{await lobby.reject(party.inviteCode,uid);status('Request declined.');});row.append(name,accept,decline);requests.append(row);
    }
  }
  $('fourPartyCreate').onclick=()=>run(async gen=>{
    const active=createLobby();lobby=active;const result=await active.create(getProfile());if(gen!==generation){await active.close(result.partyId,result.inviteCode);return;}
    party={...result,role:'host'};status('Share the code and approve three players.');watchParty(gen);watchMember(gen);addWatch(lobby.watchRequests(party.inviteCode,v=>showRequests(gen,v),failed));render();
  });
  $('fourPartyJoin').onclick=()=>run(async gen=>{
    const code=$('fourPartyCodeInput').value.trim();if(!/^\d{4}$/.test(code)){status('Enter a four-digit code.');return;}
    const active=createLobby();lobby=active;const result=await active.request(code,getProfile().name);if(gen!==generation){await active.cancel(code);return;}
    party={...result,role:'pending'};status('Request sent. Waiting for approval.');watchParty(gen);
    addWatch(lobby.watchOwnRequest(code,value=>{if(gen===generation&&party?.role==='pending'&&value===null)status('Request closed. If not approved, leave and ask the host to try again.');},failed));render();
  });
  async function configure(mode,selection){if(!party||party.role!=='host'||started||!teams[selection])return;await lobby.configure(party.partyId,{mode,teams:teams[selection]});}
  function changeConfig(){const mode=$('fourPartyMode').value,selection=Number($('fourPartyTeams').value);return run(()=>configure(mode,selection));}
  $('fourPartyMode').onchange=changeConfig;$('fourPartyTeams').onchange=changeConfig;
  $('fourPartyStart').onclick=()=>run(async gen=>{
    if(party?.role!=='host'||!ready()||started||!await confirmStart()||gen!==generation||!party||!ready())return;
    const result=await lobby.start(party.partyId);if(gen!==generation)return;started=true;render();status('Match started. Connecting…');const ok=await onMatch({...result,partyId:party.partyId});if(gen===generation&&ok===false)status('Could not connect to the match. Close the party and try again.');
  });
  const leaveParty=()=>run(async gen=>{
    if(!party||joining)return;const current=party,active=lobby;if(started)await onLeaveMatch();if(current.role==='host')await active.close(current.partyId,current.inviteCode);else if(!started&&current.role==='guest')await active.leave(current.partyId);else if(!started)await active.cancel(current.inviteCode);
    if(gen===generation){clear();status(current.role==='host'?'Party closed.':'You left the party.');return true;}
  });
  $('fourPartyLeave').onclick=leaveParty;
  async function leaveForLogout(timeoutMs=2000){
    const old=party,active=lobby,wasStarted=started;clear();root.hidden=true;
    const cleanup=(async()=>{if(wasStarted)await onLeaveMatch();if(!old)return;if(old.role==='host')await active.close(old.partyId,old.inviteCode);else if(!wasStarted&&old.role==='guest')await active.leave(old.partyId);else if(!wasStarted)await active.cancel(old.inviteCode);})().catch(()=>{});
    let timer;await Promise.race([cleanup,new Promise(resolve=>{timer=setTimeout(resolve,timeoutMs);})]);clearTimeout(timer);
  }
  root.hidden=true;render();return {show(){root.hidden=false;},hide(){root.hidden=true;},isActive:()=>!!party,leaveParty,leaveForLogout};
}
