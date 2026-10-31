// In-process experimental allocator. All identities and player profiles must be
// authenticated/loaded by trusted server code. No URL or roster comes from a client.
export function createMatchAllocator({registry,loadPlayer,launchMatch,maxMatches=10}={}){
  if(!registry||typeof loadPlayer!=='function'||typeof launchMatch!=='function'||!Number.isSafeInteger(maxMatches)||maxMatches<1)throw new Error('Invalid match allocator configuration');
  const matches=new Map(),byLobby=new Map();
  const fail=code=>{const error=new Error(code);error.code=code;throw error;};
  async function start(uid){
    // This function reserves capacity and the lobby synchronously before awaiting
    // any I/O. Concurrent starts cannot launch duplicate matches.
    const lobby=registry.get(uid);
    if(lobby.ownerId!==uid)fail('not-owner');
    if(lobby.status!=='waiting')fail('match-active');
    if(matches.size>=maxMatches)fail('capacity');
    const reservation=registry.start(uid),entry={lobbyId:lobby.id,matchId:reservation.matchId,status:'starting',handle:null,stopping:null};
    matches.set(entry.matchId,entry);byLobby.set(entry.lobbyId,entry);
    try{
      const players=await Promise.all(reservation.players.map((id,index)=>loadPlayer(id,index)));
      if(players.some((p,index)=>!p||p.id!==reservation.players[index]))throw new Error('Invalid trusted player');
      const handle=await launchMatch({matchId:entry.matchId,players});
      if(!handle||typeof handle.stop!=='function')throw new Error('Invalid match handle');
      entry.handle=handle;entry.status='active';
      return {matchId:entry.matchId};
    }catch(error){
      matches.delete(entry.matchId);byLobby.delete(entry.lobbyId);registry.finishMatch(entry.matchId);
      throw error;
    }
  }
  function get(uid){
    const lobby=registry.get(uid),entry=byLobby.get(lobby.id);
    if(!entry)fail('no-match');
    return {status:entry.status,matchId:entry.matchId};
  }
  async function stop(matchId){
    const entry=matches.get(matchId);if(!entry)return false;
    if(entry.status==='starting')fail('match-starting');
    if(entry.stopping)return entry.stopping;
    entry.status='stopping';
    entry.stopping=(async()=>{
      try{await Promise.resolve().then(()=>entry.handle.stop());matches.delete(entry.matchId);byLobby.delete(entry.lobbyId);registry.finishMatch(entry.matchId);return true;}
      catch(error){entry.status='stop-failed';throw error;}
      finally{entry.stopping=null;}
    })();
    return entry.stopping;
  }
  return {start,get,stop};
}
