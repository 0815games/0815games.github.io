// Host session for the opt-in host-recovery trial. The host may advance
// locally, but no host-local view or receipt is delivered until the checkpoint
// and all recipient views are durably committed together. A failed write is
// terminal.
export function createDurableHostSession({host,store,playerIds,onCommitted=()=>{},onError=()=>{}}){
  if(!host||!store||!['initialize','publish'].every(k=>typeof store[k]==='function')||!['checkpoint','snapshotFor','advance','receive','setPresence','readyFor'].every(k=>typeof host[k]==='function')||!Array.isArray(playerIds)||playerIds.length<2||new Set(playerIds).size!==playerIds.length||typeof onCommitted!=='function'||typeof onError!=='function')throw Error('Invalid durable host configuration');
  let started=false,closed=false,failed=false,busy=false,fence=null,lastCommitted=null,focusFlush=false;const connections=new Map(playerIds.map(id=>[id,[]]));
  function capture(){const checkpoint=host.checkpoint(),views=Object.fromEntries(playerIds.map(id=>[id,{ready:host.readyFor(id),connections:connections.get(id),snapshot:host.snapshotFor(id)}]));return {checkpoint,views};}
  function finished(checkpoint){const match=checkpoint?.match;return (match?.mode==='four-coop'?match.match?.ended:match?.ended)===true;}
  function fail(error){if(failed||closed)return;failed=true;onError(error);}
  function localDelivery(frame){if(!closed&&!failed)onCommitted({fence:{...fence},...frame});}
  async function flushFocus(){if(busy||!focusFlush||closed||failed||!fence)return;focusFlush=false;await session.step(1);}
  const session={
    async start(existingFence=null){if(started||closed)throw Error('Durable host already started or closed');started=true;busy=true;try{const frame=capture();if(existingFence){fence={generation:existingFence.generation,owner:existingFence.owner};await store.publish(fence,frame.checkpoint,frame.views);}else fence=await store.initialize(frame.checkpoint,frame.views);lastCommitted=JSON.stringify(frame);if(!closed)localDelivery(frame);return !closed;}catch(error){fail(error);return false;}finally{busy=false;if(focusFlush)void flushFocus();}},
    setConnections(id,value){if(!started||closed||failed||!connections.has(id)||!Array.isArray(value))return false;connections.set(id,value.slice(0,64));return true;},
    setFocusPaused(value){if(!started||closed||failed||typeof host.setFocusPaused!=='function')return false;const ok=host.setFocusPaused(value);if(ok){focusFlush=true;void flushFocus();}return ok;},
    setPresence(id,value){if(!started||closed||failed)return false;return host.setPresence(id,value);},
    receive(id,packet){if(!started||closed||failed||!fence)return {status:'rejected',reason:'host-not-available'};if(packet?.generation!==fence.generation||packet?.owner!==fence.owner)return {status:'rejected',reason:'stale-generation'};const result=host.receive(id,packet.envelope);if(result.status==='cancelled'){focusFlush=true;void flushFocus();}return result;},
    async step(count=1){if(!Number.isInteger(count)||count<1||count>6)throw Error('Invalid step count');if(!started||closed||failed||busy||!fence)return false;busy=true;try{const before=host.checkpoint();if(!finished(before)||before.queue.length)for(let i=0;i<count;i++)if(host.advance()===null)break;const frame=capture(),serialized=JSON.stringify(frame);if(serialized===lastCommitted)return !closed;await store.publish(fence,frame.checkpoint,frame.views);lastCommitted=serialized;if(!closed)localDelivery(frame);return !closed;}catch(error){fail(error);return false;}finally{busy=false;if(focusFlush)void flushFocus();}},
    isFailed:()=>failed,
    stop(){closed=true;}
  };return session;
}
