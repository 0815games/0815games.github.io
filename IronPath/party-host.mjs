import { createHost, restoreHost } from './protocol.mjs?v=20261105-workshop1';

// Local, player-hosted match core. The Firebase adapter must bind each player
// ID to authenticated paths. The hosting browser is not an anti-cheat authority.
const rosterOf=match=>{const four=match?.mode==='four-coop'||match?.mode==='two-vs-two',ids=Object.keys((four?match?.members:match?.players)||{});if((four?(match.mode==='four-coop'?![3,4].includes(ids.length):ids.length!==4):ids.length!==2))throw new Error('Invalid party roster');return ids;};
function wrapPartyHost(host,match,ids,hostId,{cancelPending=false}={}){
  const online=new Map(ids.map(id=>[id,false]));let focusPaused=false,focusGeneration=0;
  for(const id of ids){host.setPlayerActive(id,false);if(cancelPending)host.suspendPlayer(id);}
  const ready=()=>!focusPaused&&online.get(hostId)===true&&(!['versus','two-vs-two'].includes(match.mode)||ids.every(id=>online.get(id)===true));
  function setPresence(id,connected){
    if(!online.has(id)||typeof connected!=='boolean')return false;
    const wasOnline=online.get(id);online.set(id,connected);host.setPlayerActive(id,connected);
    if(wasOnline&&!connected){if(id===hostId||match.mode==='two-vs-two'){for(const playerId of ids)host.suspendPlayer(playerId);}else host.suspendPlayer(id);}
    return true;
  }
  function setFocusPaused(paused){
    if(typeof paused!=='boolean')return false;
    if(paused===focusPaused)return true;
    focusPaused=paused;
    // Cancel queued actions and neutralize every player's movement. Do not
    // mark anyone disconnected or discard the current wave/field upgrades.
    if(paused){focusGeneration++;for(const id of ids)host.suspendPlayer(id,'host-paused');}
    return true;
  }
  const readyFor=id=>ready()&&online.get(id)===true;
  function receive(id,envelope){
    if(!online.has(id))return {status:'rejected',reason:'unknown-player'};
    if(!online.get(id))return {status:'rejected',reason:ready()?'player-offline':'match-paused'};
    // A command sent just before the pause can arrive late, even after resume.
    // Record a cancellation receipt rather than leaving the client sequence stuck
    // or applying stale actions when the match resumes.
    if(focusPaused||(envelope?.focusGeneration??0)!==focusGeneration){
      const response=host.receive(id,envelope);
      if(response.status==='queued'){host.suspendPlayer(id,'host-paused');return {status:'cancelled',seq:response.seq,reason:'host-paused'};}
      return response;
    }
    if(!ready())return {status:'rejected',reason:'match-paused'};
    return host.receive(id,envelope);
  }
  function advance(){if(!ready())return null;const first=host.advance();if(host.speed()!==2)return first;const second=host.advance();return {...second,commands:[...first.commands,...second.commands],events:[...first.events,...second.events]};}
  return {setPresence,setFocusPaused,ready,readyFor,receive,advance,snapshotFor:id=>{const snapshot=host.snapshotFor(id);return snapshot?{...snapshot,hostPaused:focusPaused,focusGeneration}:null;},checkpoint:()=>host.checkpoint()};
}
export function createPartyHost(initialMatch,{hostId}={}){
  const ids=rosterOf(initialMatch);hostId=hostId??ids[0];if(!ids.includes(hostId))throw new Error('Host must be a party player');
  return wrapPartyHost(createHost({...initialMatch,hostId}),initialMatch,ids,hostId);
}
// Recovery core only: checkpoints must come from trusted storage bound to the
// locked manifest and protected by an authoritative generation/fencing scheme.
// This function is NOT wired into live Firebase recovery.
export function restorePartyHost(checkpoint,{hostId,playerIds,mode,teams}={}){
  const match=checkpoint?.match,ids=rosterOf(match),actualMode=match?.mode||'coop';
  if(!Array.isArray(playerIds)||playerIds.length!==ids.length||new Set(playerIds).size!==ids.length||ids.some(id=>!playerIds.includes(id))||!ids.includes(hostId)||match.hostId!==hostId||actualMode!==mode)throw Error('Checkpoint does not match locked party');
  if(mode==='two-vs-two'&&(!Array.isArray(teams)||teams.length!==2||!Array.isArray(match.teams)||match.teams.length!==2||teams.some((team,i)=>!Array.isArray(team)||team.length!==2||new Set(team).size!==2||!Array.isArray(match.teams[i])||match.teams[i].length!==2||team.some(id=>!match.teams[i].includes(id)))))throw Error('Checkpoint teams do not match locked party');
  const host=restoreHost(checkpoint);
  return wrapPartyHost(host,match,ids,hostId,{cancelPending:true});
}
