import { createHost } from './protocol.mjs?v=20261101-hostcontinues1';

// Local, player-hosted match core. The future Firebase adapter must bind each
// playerId to an authenticated, rules-protected input path; never trust an ID
// inside a command. The hosting browser is not an anti-cheat authority.
export function createPartyHost(initialMatch,{hostId}={}){
  const ids=Object.keys(initialMatch?.players||{});
  if(ids.length!==2||new Set(ids).size!==2)throw new Error('Party requires two players');
  hostId=hostId??ids[0];if(!ids.includes(hostId))throw new Error('Host must be a party player');
  const host=createHost(initialMatch),online=new Map(ids.map(id=>[id,false]));
  for(const id of ids)host.setPlayerActive(id,false);
  const ready=()=>online.get(hostId)===true;
  function setPresence(id,connected){
    if(!online.has(id)||typeof connected!=='boolean')return false;
    const wasOnline=online.get(id);online.set(id,connected);
    host.setPlayerActive(id,connected);
    // A missing guest loses control and stops fighting; the host continues.
    // Losing the host pauses the match and neutralizes all held input.
    if(wasOnline&&!connected){if(id===hostId){for(const playerId of ids)host.suspendPlayer(playerId);}else host.suspendPlayer(id);}
    return true;
  }
  const readyFor=id=>ready()&&online.get(id)===true;
  function receive(id,envelope){
    if(!online.has(id))return {status:'rejected',reason:'unknown-player'};
    if(!ready())return {status:'rejected',reason:'match-paused'};
    if(!online.get(id))return {status:'rejected',reason:'player-offline'};
    return host.receive(id,envelope);
  }
  function advance(){return ready()?host.advance():null;}
  function snapshotFor(id){return host.snapshotFor(id);}
  return {setPresence,ready,readyFor,receive,advance,snapshotFor};
}
