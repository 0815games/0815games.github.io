// Experimental only: not wired to live gameplay. The host may advance locally,
// but no host-local view or receipt is delivered until the checkpoint and all
// recipient views are durably committed together. A failed write is terminal.
export function createDurableHostSession({host,store,playerIds,onCommitted=()=>{},onError=()=>{}}){
  if(!host||!store||!['initialize','publish'].every(k=>typeof store[k]==='function')||!['checkpoint','snapshotFor','advance','receive','setPresence','readyFor'].every(k=>typeof host[k]==='function')||!Array.isArray(playerIds)||playerIds.length<2||new Set(playerIds).size!==playerIds.length||typeof onCommitted!=='function'||typeof onError!=='function')throw Error('Invalid durable host configuration');
  let started=false,closed=false,failed=false,busy=false,fence=null;
  function capture(){const checkpoint=host.checkpoint(),views=Object.fromEntries(playerIds.map(id=>[id,{ready:host.readyFor(id),snapshot:host.snapshotFor(id)}]));return {checkpoint,views};}
  function fail(error){if(failed||closed)return;failed=true;onError(error);}
  function localDelivery(frame){if(!closed&&!failed)onCommitted({fence:{...fence},...frame});}
  return {
    async start(existingFence=null){if(started||closed)throw Error('Durable host already started or closed');started=true;busy=true;try{const frame=capture();if(existingFence){fence={generation:existingFence.generation,owner:existingFence.owner};await store.publish(fence,frame.checkpoint,frame.views);}else fence=await store.initialize(frame.checkpoint,frame.views);if(!closed)localDelivery(frame);return !closed;}catch(error){fail(error);return false;}finally{busy=false;}},
    setPresence(id,value){if(!started||closed||failed)return false;return host.setPresence(id,value);},
    receive(id,packet){if(!started||closed||failed||!fence)return {status:'rejected',reason:'host-not-available'};if(packet?.generation!==fence.generation||packet?.owner!==fence.owner)return {status:'rejected',reason:'stale-generation'};return host.receive(id,packet.envelope);},
    async step(){if(!started||closed||failed||busy||!fence)return false;busy=true;try{host.advance();const frame=capture();await store.publish(fence,frame.checkpoint,frame.views);if(!closed)localDelivery(frame);return !closed;}catch(error){fail(error);return false;}finally{busy=false;}},
    isFailed:()=>failed,
    stop(){closed=true;}
  };
}
