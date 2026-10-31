import { createHost } from './protocol.mjs';

// Local, player-hosted match core. The future Firebase adapter must bind each
// playerId to an authenticated, rules-protected input path; never trust an ID
// inside a command. The hosting browser is not an anti-cheat authority.
export function createPartyHost(initialMatch){
  const ids=Object.keys(initialMatch?.players||{});
  if(ids.length!==2||new Set(ids).size!==2)throw new Error('Party requires two players');
  const host=createHost(initialMatch),online=new Map(ids.map(id=>[id,false]));
  const ready=()=>ids.every(id=>online.get(id));
  function setPresence(id,connected){
    if(!online.has(id)||typeof connected!=='boolean')return false;
    const wasReady=ready();online.set(id,connected);
    // A disconnect pauses the shared game and neutralizes both sides. Never
    // replay queued purchases or held movement when a player reconnects.
    if(wasReady&&!ready())for(const playerId of ids)host.suspendPlayer(playerId);
    return true;
  }
  function receive(id,envelope){
    if(!online.has(id))return {status:'rejected',reason:'unknown-player'};
    if(!ready())return {status:'rejected',reason:'match-paused'};
    return host.receive(id,envelope);
  }
  function advance(){return ready()?host.advance():null;}
  function snapshotFor(id){return host.snapshotFor(id);}
  return {setPresence,ready,receive,advance,snapshotFor};
}
