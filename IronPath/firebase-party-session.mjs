import {normalizeCommand} from './protocol.mjs?v=20261212-actiii3';
// Session logic for live parties, independent of Firebase SDK wiring and UI.
// Presence must come from an authenticated, rules-protected Firebase adapter.
// The host is a player, not a trusted authority; never award validated XP here.
export function createFirebasePartyHostSession({channel,host,playerIds,epoch,localPlayerId=null,onError=()=>{}}){
  if(!channel||!host||!Array.isArray(playerIds)||![2,3,4].includes(playerIds.length)||new Set(playerIds).size!==playerIds.length||typeof epoch!=='string'||!epoch||typeof onError!=='function')throw new Error('Invalid host session');
  let started=false,closed=false,unsubscribe=null,publishing=false,latest=null,failed=false,localListener=null;
  const connections=new Map(playerIds.map(id=>[id,[]]));
  function localView(){
    if(!localListener||!localPlayerId||closed||failed)return;
    const snapshot=host.snapshotFor(localPlayerId);if(snapshot?.match?.individualSupplies)snapshot.match.money=snapshot.match.players[localPlayerId].money;
    localListener({epoch,ready:host.readyFor(localPlayerId),connections:connections.get(localPlayerId),snapshot});
  }
  function queueView(){
    if(closed||failed)return;
    latest=Object.fromEntries(playerIds.map(id=>{
      const snapshot=host.snapshotFor(id);
      // Older game screens read match.money. Supply a per-recipient alias so
      // a cached screen never displays an empty balance during an update.
      if(snapshot?.match?.individualSupplies&&Number.isFinite(snapshot.match.players?.[id]?.money))snapshot.match.money=snapshot.match.players[id].money;
      return [id,{epoch,ready:host.readyFor(id),connections:connections.get(id),snapshot}];
    }));
    localView();if(!publishing)void pump();
  }
  async function pump(){
    publishing=true;
    try{while(latest&&!closed){const view=latest;latest=null;await channel.publishViews(view);}}
    catch(error){failed=true;latest=null;for(const id of playerIds)host.setPresence(id,false);onError(error);}
    finally{publishing=false;}
  }
  return {
    start(){
      if(started||closed)throw new Error('Host session already started or closed');started=true;
      unsubscribe=channel.watchInputs((id,packet)=>{if(!closed&&!failed&&packet?.epoch===epoch){const result=host.receive(id,packet.envelope);if(result.status==='cancelled')queueView();}});
      queueView();
    },
    setFocusPaused(paused){if(!started||closed||failed||typeof host.setFocusPaused!=='function')return false;const changed=host.setFocusPaused(paused);if(changed)queueView();return changed;},
    setPresence(id,connected){if(!started||closed||failed)return false;const changed=host.setPresence(id,connected);if(changed)queueView();return changed;},
    setConnections(id,ids){if(!started||closed||failed||!connections.has(id)||!Array.isArray(ids))return false;connections.set(id,ids.slice(0,64));queueView();return true;},
    // The host sees its authoritative state locally, while remote views are
    // coalesced to at most 10 Hz plus command and wave-completion receipts.
    step(){if(!started||closed||failed)return null;const result=host.advance();if(result){if(result.tick%3===0||result.commands.length||result.events.some(event=>event.type==='waveCleared'))queueView();else if(result.tick%2===0)localView();}return result;},
    localChannel(){
      if(!playerIds.includes(localPlayerId))throw new Error('Local player required');
      return {watchView(fn){localListener=fn;if(started)localView();return()=>{if(localListener===fn)localListener=null;};},
        async writeInput(packet){if(closed||failed||packet?.epoch!==epoch)throw new Error('Session changed');const result=host.receive(localPlayerId,packet.envelope);if(result.status==='cancelled')queueView();if(result.status==='rejected')throw new Error(result.reason);},
        async close(){localListener=null;}};
    },
    publish(){if(started&&!closed&&!failed)queueView();},
    async stop(){if(closed)return;closed=true;latest=null;localListener=null;unsubscribe?.();for(const id of playerIds)host.setPresence(id,false);await channel.close();}
  };
}

export function createFirebasePartyClientSession({channel,onView=()=>{},onState=()=>{},onConnections=()=>{},timeoutMs=15000}){
  if(!channel||typeof onView!=='function'||typeof onState!=='function'||typeof onConnections!=='function'||!Number.isFinite(timeoutMs)||timeoutMs<=0)throw new Error('Invalid client session');
  let started=false,closed=false,unsubscribe=null,epoch=null,latest=null,pending=null,invalid=false;
  function settle(item,result){if(item.timer)clearTimeout(item.timer);if(!item.settled){item.settled=true;item.resolve(result);}}
  function observe(view){
    if(closed||invalid||!view||typeof view.epoch!=='string'||!view.epoch||typeof view.ready!=='boolean'||!view.snapshot||!Number.isSafeInteger(view.snapshot.tick)||view.snapshot.tick<0||!Number.isSafeInteger(view.snapshot.nextSeq)||view.snapshot.nextSeq<1||!Array.isArray(view.snapshot.receipts))return;
    if(epoch!==null&&epoch!==view.epoch){if(pending){settle(pending,{ok:false,reason:'Party session changed.'});pending=null;}invalid=true;latest=null;onState('error');return;}
    if(epoch===null)epoch=view.epoch;
    if(latest&&view.snapshot.tick<latest.snapshot.tick)return;
    latest=view;
    if(pending){
      const receipt=view.snapshot.receipts.find(item=>item?.seq===pending.seq);
      if(receipt?.status==='applied'){settle(pending,receipt.result);pending=null;}
      else if(receipt?.status==='cancelled'){settle(pending,{ok:false,reason:receipt.reason==='host-paused'?'Command cancelled because the host paused the match.':'Command cancelled when a player disconnected.'});pending=null;}
    }
    onConnections(Array.isArray(view.connections)?view.connections.filter(id=>typeof id==='string'&&/^[a-f0-9]{32}$/.test(id)).slice(0,64):[]);
    onState(pending?.settled?'syncing':view.ready?'ready':'waiting');onView(view.snapshot);
  }
  return {
    start(){if(started||closed)throw new Error('Client session already started or closed');started=true;unsubscribe=channel.watchView(observe);onState(latest?.ready?'ready':'waiting');},
    command(command){
      if(!started||closed||invalid||!latest?.ready)return Promise.resolve({ok:false,reason:'Party is not ready.'});
      if(pending)return Promise.resolve({ok:false,reason:'Waiting for the previous command to be reconciled.'});
      const normalized=normalizeCommand(command);if(!normalized)return Promise.resolve({ok:false,reason:'Invalid command.'});
      const seq=latest.snapshot.nextSeq,activeEpoch=epoch,focusGeneration=latest.snapshot.focusGeneration??0;
      return new Promise(resolve=>{
        const item={seq,resolve,settled:false,timer:null};pending=item;
        item.timer=setTimeout(()=>{if(pending===item&&!item.settled){item.settled=true;onState('syncing');resolve({ok:false,reason:'Command outcome unknown; waiting for synchronization.'});}},timeoutMs);
        // A failed/disconnected write can still have reached Firebase. Keep the
        // sequence locked until a receipt or a new host epoch resolves it.
        Promise.resolve().then(()=>{if(closed||invalid||epoch!==activeEpoch||pending!==item)throw new Error('Session changed');return channel.writeInput({epoch:activeEpoch,envelope:{version:1,seq,command:normalized,focusGeneration}});}).catch(()=>{if(pending===item&&!item.settled){clearTimeout(item.timer);item.settled=true;onState('syncing');resolve({ok:false,reason:'Command outcome unknown; waiting for synchronization.'});}});
      });
    },
    async stop(){if(closed)return;closed=true;unsubscribe?.();if(pending){settle(pending,{ok:false,reason:'Party closed.'});pending=null;}await channel.close();}
  };
}
