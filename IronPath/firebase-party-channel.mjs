// Low-level Firebase Realtime Database packet channel for a player-hosted party.
// The SDK is injected; no Firebase rules are supplied by this module. It must
// remain disabled until membership, host-only views and own-input writes are
// enforced by deployed and emulator-tested rules.
const MAX_INPUT_BYTES=4096,MAX_VIEW_BYTES=262144;
const encoder=new TextEncoder();
function validKey(value){return typeof value==='string'&&value.length>0&&value.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(value);}
function encode(value,limit){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid party packet');
  const text=JSON.stringify(value);
  if(typeof text!=='string'||encoder.encode(text).length>limit)throw new Error('Packet too large or invalid');
  return text;
}
function decode(value,limit){
  if(typeof value!=='string'||encoder.encode(value).length>limit)throw new Error('Invalid party packet');
  const result=JSON.parse(value);
  if(!result||typeof result!=='object'||Array.isArray(result))throw new Error('Invalid party packet');
  return result;
}
export function createFirebasePartyChannel({db,auth,sdk,partyId,hostId,playerIds,onError=()=>{}}){
  if(!db||!auth||!sdk||typeof sdk.ref!=='function'||typeof sdk.onValue!=='function'||typeof sdk.set!=='function'||typeof sdk.update!=='function'||!validKey(partyId)||!validKey(hostId)||!Array.isArray(playerIds)||playerIds.length!==2||playerIds.some(id=>!validKey(id))||new Set(playerIds).size!==2||!playerIds.includes(hostId)||typeof onError!=='function')throw new Error('Invalid party channel configuration');
  const uid=auth.currentUser?.uid;
  if(!validKey(uid)||!playerIds.includes(uid))throw new Error('Authenticated party member required');
  const base=`parties/${partyId}`,listeners=new Set();let closed=false,pending=Promise.resolve();
  const ensure=()=>{if(closed)throw new Error('Party channel closed');if(auth.currentUser?.uid!==uid)throw new Error('Party identity changed');};
  const ref=path=>sdk.ref(db,`${base}/${path}`);
  // Queue writes so older asynchronous snapshots cannot overwrite newer ones.
  function write(operation){
    ensure();const next=pending.then(()=>{ensure();return operation();});
    pending=next.catch(()=>{});return next;
  }
  function listen(path,limit,callback){
    ensure();if(typeof callback!=='function')throw new Error('Callback required');
    const unsubscribe=sdk.onValue(ref(path),snapshot=>{
      if(closed||auth.currentUser?.uid!==uid)return;
      const value=snapshot.val();if(value===null)return;
      let packet;try{packet=decode(value,limit);}catch{onError(new Error('Invalid party packet'));return;}
      callback(packet);
    },error=>{if(!closed)onError(error);});
    const remove=()=>{if(listeners.delete(remove))unsubscribe();};listeners.add(remove);return remove;
  }
  return {
    // Single latest input slot per player. The caller must permit only one
    // outstanding sequenced command until a receipt has been observed.
    writeInput(envelope){const packet=encode(envelope,MAX_INPUT_BYTES);return write(()=>sdk.set(ref(`inputs/${uid}`),packet));},
    watchView(callback){return listen(`views/${uid}`,MAX_VIEW_BYTES,callback);},
    watchInputs(callback){
      ensure();if(uid!==hostId)throw new Error('Host required');if(typeof callback!=='function')throw new Error('Callback required');
      const unsubscribes=playerIds.map(id=>listen(`inputs/${id}`,MAX_INPUT_BYTES,packet=>callback(id,packet)));
      return ()=>unsubscribes.forEach(remove=>remove());
    },
    publishViews(views){
      ensure();if(uid!==hostId)throw new Error('Host required');
      if(!views||typeof views!=='object'||Array.isArray(views)||Object.keys(views).length!==2||playerIds.some(id=>!Object.hasOwn(views,id)))throw new Error('Both player views required');
      const changes=Object.fromEntries(playerIds.map(id=>[`views/${id}`,encode(views[id],MAX_VIEW_BYTES)]));
      return write(()=>sdk.update(sdk.ref(db,base),changes));
    },
    async close(){closed=true;for(const remove of [...listeners])remove();await pending;}
  };
}
