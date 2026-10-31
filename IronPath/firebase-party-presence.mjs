// Experimental Firebase presence adapter. It depends on rules restricting each
// participant to their own presence path; these rules have not been deployed.
const validKey=value=>typeof value==='string'&&value.length>0&&value.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(value);
export function createFirebasePartyPresence({db,auth,sdk,partyId,playerIds,crypto=globalThis.crypto,onPresence=()=>{},onConnection=()=>{},onError=()=>{},heartbeatMs=5000,expiryMs=20000,clock=Date.now}){
  if(!db||!auth||!sdk||!['ref','onValue','onDisconnect','set','remove','serverTimestamp'].every(key=>typeof sdk[key]==='function')||!validKey(partyId)||!Array.isArray(playerIds)||playerIds.length!==2||new Set(playerIds).size!==2||playerIds.some(id=>!validKey(id))||typeof crypto?.getRandomValues!=='function'||![onPresence,onConnection,onError,clock].every(fn=>typeof fn==='function')||!Number.isFinite(heartbeatMs)||heartbeatMs<100||!Number.isFinite(expiryMs)||expiryMs<heartbeatMs*2)throw new Error('Invalid party presence configuration');
  const uid=auth.currentUser?.uid;if(!validKey(uid)||!playerIds.includes(uid))throw new Error('Authenticated party member required');
  let started=false,closed=false,connected=false,registered=false,failed=false,generation=0,offset=0,heartbeat=null,checker=null,activeRef=null;
  const subscriptions=[],raw=new Map(),states=new Map(playerIds.map(id=>[id,false]));
  const ref=path=>sdk.ref(db,path);
  const authorized=()=>!closed&&auth.currentUser?.uid===uid;
  function emit(){
    if(!closed&&auth.currentUser?.uid!==uid&&connected){failed=true;disconnect();onError(new Error('Party identity changed'));return;}
    const now=clock()+offset;
    for(const id of playerIds){
      const values=raw.get(id),timestamps=values&&typeof values==='object'&&!Array.isArray(values)?Object.values(values):[];
      const online=!!(authorized()&&connected&&registered&&timestamps.some(t=>typeof t==='number'&&Number.isFinite(t)&&t<=now+5000&&now-t<expiryMs));
      if(states.get(id)!==online){states.set(id,online);onPresence(id,online);}
    }
  }
  function disconnect(){
    generation++;connected=false;registered=false;activeRef=null;if(heartbeat){clearInterval(heartbeat);heartbeat=null;}emit();onConnection(false);
  }
  function name(){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
  function stale(myGeneration){return !authorized()||failed||!connected||myGeneration!==generation;}
  async function connect(){
    if(!authorized()||failed||connected)return;
    connected=true;registered=false;const myGeneration=++generation,connectionRef=ref(`parties/${partyId}/presence/${uid}/${name()}`);activeRef=connectionRef;
    try{
      // Register removal before announcing presence, every time Firebase connects.
      await sdk.onDisconnect(connectionRef).remove();if(stale(myGeneration))return;
      await sdk.set(connectionRef,sdk.serverTimestamp());
      if(stale(myGeneration)){void sdk.remove(connectionRef).catch(()=>{});return;}
      registered=true;onConnection(true);emit();let writing=false;
      heartbeat=setInterval(async()=>{
        if(stale(myGeneration)||writing)return;writing=true;
        try{await sdk.set(connectionRef,sdk.serverTimestamp());if(stale(myGeneration))void sdk.remove(connectionRef).catch(()=>{});}
        catch(error){if(!stale(myGeneration)){failed=true;disconnect();onError(error);}}
        finally{writing=false;}
      },heartbeatMs);
    }catch(error){if(!stale(myGeneration)){failed=true;disconnect();onError(error);}}
  }
  function subscribe(path,callback){subscriptions.push(sdk.onValue(ref(path),snapshot=>{if(authorized())callback(snapshot.val());},error=>{if(authorized()){failed=true;disconnect();onError(error);}}));}
  return {
    start(){
      if(started||closed)throw new Error('Presence already started or closed');started=true;onConnection(false);
      for(const id of playerIds)subscribe(`parties/${partyId}/presence/${id}`,value=>{raw.set(id,value);emit();});
      subscribe('.info/serverTimeOffset',value=>{if(typeof value==='number'&&Number.isFinite(value))offset=value;emit();});
      subscribe('.info/connected',value=>{if(value===true)void connect();else if(connected||registered)disconnect();});
      checker=setInterval(emit,Math.min(heartbeatMs,1000));
    },
    async stop(){
      if(closed)return;const current=activeRef;const wasConnected=connected;closed=true;generation++;connected=false;registered=false;
      if(heartbeat)clearInterval(heartbeat);if(checker)clearInterval(checker);for(const unsub of subscriptions)unsub();emit();onConnection(false);
      // If offline, Firebase's registered onDisconnect handles removal. Avoid
      // waiting for a write that the SDK would queue until a future reconnect.
      if(current&&wasConnected){try{await sdk.remove(current);}catch(error){onError(error);}}
    }
  };
}
