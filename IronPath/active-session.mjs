// Cross-window / cross-device single-session lease over Firebase RTDB.
// Normal same-browser cooperating tabs share one persistent clientId via
// localStorage (and coordinate automatic AFK logout via afk-session.mjs); a
// private/incognito window, separate browser, or second device receives a
// distinct clientId and cannot hold the same account simultaneously.
export const ACTIVE_SESSIONS_PATH='activeSessions';
export const ACTIVE_SESSION_LEASE_MS=45_000;
export const ACTIVE_SESSION_HEARTBEAT_MS=15_000;
export const CLIENT_SESSION_STORAGE_KEY='ironpath:client-session-id';
export const CLIENT_ID_PATTERN=/^[a-f0-9]{32}$/;

const REMOTE_CLEANUP_TIMEOUT_MS=2500;
const RECLAIM_DELAY_MS=150;

export function isActiveSessionPermissionError(error){
 const code=String(error?.code||'').toLowerCase();
 const message=String(error?.message||'').toLowerCase();
 return code.includes('permission-denied')||code.includes('permission_denied')||message.includes('permission_denied')||message.includes('permission denied');
}

export function generateClientSessionId(crypto=globalThis.crypto){
 if(!crypto?.getRandomValues)throw Error('Crypto random generator unavailable');
 const bytes=new Uint8Array(16);
 crypto.getRandomValues(bytes);
 return Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
}

export function getOrCreateClientSessionId({storage=null,crypto=globalThis.crypto}={}){
 try{
  const stored=storage?.getItem?.(CLIENT_SESSION_STORAGE_KEY);
  if(typeof stored==='string'&&CLIENT_ID_PATTERN.test(stored))return stored;
 }catch{/* Storage access can be restricted in privacy-hardened browsers. */}
 const created=generateClientSessionId(crypto);
 try{storage?.setItem?.(CLIENT_SESSION_STORAGE_KEY,created);}catch{/* In-memory ID works for this window. */}
 return created;
}

export function createActiveSessionManager({
 db,
 sdk,
 uid,
 clientId,
 leaseMs=ACTIVE_SESSION_LEASE_MS,
 heartbeatMs=ACTIVE_SESSION_HEARTBEAT_MS,
 clock=Date.now,
 setInterval=globalThis.setInterval,
 clearInterval=globalThis.clearInterval,
 setTimeout=globalThis.setTimeout,
 clearTimeout=globalThis.clearTimeout,
 onTakeover=()=>{}
}={}){
 if(!db||!sdk||typeof sdk.ref!=='function'||typeof sdk.runTransaction!=='function'||typeof sdk.get!=='function'||typeof sdk.remove!=='function'){
  throw Error('Invalid active session dependencies');
 }
 if(typeof uid!=='string'||!uid||typeof clientId!=='string'||!CLIENT_ID_PATTERN.test(clientId)){
  throw Error('Invalid active session identity');
 }
 if(!Number.isInteger(leaseMs)||leaseMs<5000||!Number.isInteger(heartbeatMs)||heartbeatMs<1000||heartbeatMs>=leaseMs){
  throw Error('Invalid active session lease timing');
 }

 const sessionRef=sdk.ref(db,`${ACTIVE_SESSIONS_PATH}/${uid}`);
 let stopped=false;
 let claimed=false;
 let unsupported=false;
 let serverOffsetMs=0;
 let wasConnected=true;
 let heartbeatTimer=null;
 let reclaimTimer=null;
 let unsubSession=null;
 let unsubOffset=null;
 let unsubConnected=null;
 let disconnectHandle=null;
 let takeoverNotified=false;
 let pendingRenew=null;

 const timestampValue=()=>typeof sdk.serverTimestamp==='function'?sdk.serverTimestamp():clock();
 const isFreshForeign=entry=>{
  if(!entry||typeof entry!=='object'||typeof entry.clientId!=='string')return false;
  if(entry.clientId===clientId)return false;
  const heartbeat=Number(entry.heartbeatAt);
  if(!Number.isFinite(heartbeat))return true;
  return heartbeat+leaseMs>=clock()+serverOffsetMs;
 };

 function armDisconnect(){
  if(stopped||unsupported||typeof sdk.onDisconnect!=='function')return;
  try{
   const handle=sdk.onDisconnect(sessionRef);
   disconnectHandle=handle||null;
   const op=handle?.remove?.();
   if(op&&typeof op.catch==='function')op.catch(()=>{});
  }catch{/* Mocked or offline SDKs may omit onDisconnect support. */}
 }

 function stopWatchers(){
  if(heartbeatTimer!==null){try{clearInterval(heartbeatTimer);}catch{}heartbeatTimer=null;}
  if(reclaimTimer!==null){try{clearTimeout(reclaimTimer);}catch{}reclaimTimer=null;}
  if(unsubSession){try{unsubSession();}catch{}unsubSession=null;}
  if(unsubOffset){try{unsubOffset();}catch{}unsubOffset=null;}
  if(unsubConnected){try{unsubConnected();}catch{}unsubConnected=null;}
 }

 function triggerTakeover(entry){
  if(takeoverNotified)return;
  takeoverNotified=true;
  claimed=false;
  stopped=true;
  stopWatchers();
  try{const cancel=disconnectHandle?.cancel?.();if(cancel&&typeof cancel.catch==='function')cancel.catch(()=>{});}catch{}
  disconnectHandle=null;
  try{onTakeover(entry);}catch{/* Caller handles teardown. */}
 }

 async function renewLease({allowEmpty=true}={}){
  if(stopped||unsupported)return false;
  if(pendingRenew)return pendingRenew;
  const work=(async()=>{
   let sawForeign=false;
   const ts=timestampValue();
   try{
    const result=await sdk.runTransaction(sessionRef,current=>{
     if(stopped)return undefined;
     if(current&&typeof current==='object'&&current.clientId&&current.clientId!==clientId){
      if(isFreshForeign(current)){sawForeign=true;return undefined;}
     }
     if(!current&&!allowEmpty)return undefined;
     const claimedAt=current&&current.clientId===clientId&&Number.isInteger(current.claimedAt)&&current.claimedAt>=0?current.claimedAt:ts;
     return {clientId,claimedAt,heartbeatAt:ts};
    },{applyLocally:false});
    if(stopped)return false;
    const val=result?.snapshot?.val?.();
    if(sawForeign||(val&&typeof val==='object'&&val.clientId&&val.clientId!==clientId)){
     triggerTakeover(val||null);
     return false;
    }
    return result?.committed===true;
   }catch(error){
    if(stopped)return false;
    if(isActiveSessionPermissionError(error)){
     try{
      const snap=await sdk.get(sessionRef);
      const val=snap?.val?.();
      if(val&&typeof val==='object'&&val.clientId&&val.clientId!==clientId){
       triggerTakeover(val);
       return false;
      }
     }catch{/* Transient read failure; next heartbeat or onValue will confirm. */}
    }
    return false;
   }
  })().finally(()=>{if(pendingRenew===work)pendingRenew=null;});
  pendingRenew=work;
  return work;
 }

 function startMonitors(){
  if(stopped||unsupported)return;
  if(typeof sdk.onValue==='function'){
   if(!unsubOffset){
    try{
     unsubOffset=sdk.onValue(sdk.ref(db,'.info/serverTimeOffset'),snap=>{
      const value=snap?.val?.();
      if(typeof value==='number'&&Number.isFinite(value))serverOffsetMs=value;
     },()=>{});
    }catch{}
   }
   try{
    unsubConnected=sdk.onValue(sdk.ref(db,'.info/connected'),snap=>{
     const connected=snap?.val?.()===true;
     if(connected&&!wasConnected&&claimed&&!stopped){
      armDisconnect();
      void renewLease({allowEmpty:true});
     }
     wasConnected=connected;
    },()=>{});
   }catch{}
   try{
    unsubSession=sdk.onValue(sessionRef,snap=>{
     if(stopped||!claimed)return;
     const val=snap?.val?.();
     if(val&&typeof val==='object'&&val.clientId&&val.clientId!==clientId){
      if(reclaimTimer!==null){clearTimeout(reclaimTimer);reclaimTimer=null;}
      triggerTakeover(val);
      return;
     }
     if(!val){
      if(reclaimTimer===null){
       reclaimTimer=setTimeout(()=>{
        reclaimTimer=null;
        if(stopped||!claimed)return;
        armDisconnect();
        void renewLease({allowEmpty:true});
       },RECLAIM_DELAY_MS);
      }
      return;
     }
     if(reclaimTimer!==null){clearTimeout(reclaimTimer);reclaimTimer=null;}
    },error=>{
     if(!stopped&&isActiveSessionPermissionError(error)){
      // Do not treat maintenance gate shutdown as a multi-window takeover.
     }
    });
   }catch{}
  }
  heartbeatTimer=setInterval(()=>{
   if(!stopped&&claimed)void renewLease({allowEmpty:true});
  },heartbeatMs);
 }

 function attachOffsetMonitor(){
  if(stopped||unsubOffset||typeof sdk.onValue!=='function')return;
  try{
   unsubOffset=sdk.onValue(sdk.ref(db,'.info/serverTimeOffset'),snap=>{
    const value=snap?.val?.();
    if(typeof value==='number'&&Number.isFinite(value))serverOffsetMs=value;
   },()=>{});
  }catch{}
 }

 async function acquire({takeover=false}={}){
  if(stopped)return {status:'stopped'};
  attachOffsetMonitor();
  if(stopped)return {status:'stopped'};
  if(takeover){
   try{await sdk.remove(sessionRef);}catch(error){
    if(isActiveSessionPermissionError(error)){
     try{await sdk.get(sessionRef);}catch(readError){
      if(isActiveSessionPermissionError(readError)){unsupported=true;return {status:'unsupported'};}
     }
    }
   }
   if(stopped)return {status:'stopped'};
  }
  let reducerCalled=false;
  let sawOccupied=false;
  const ts=timestampValue();
  try{
   const result=await sdk.runTransaction(sessionRef,current=>{
    reducerCalled=true;
    if(stopped)return undefined;
    if(current&&typeof current==='object'&&current.clientId&&current.clientId!==clientId){
     if(!takeover&&isFreshForeign(current)){
      sawOccupied=true;
      return undefined;
     }
    }
    const claimedAt=current&&current.clientId===clientId&&Number.isInteger(current.claimedAt)&&current.claimedAt>=0?current.claimedAt:ts;
    return {clientId,claimedAt,heartbeatAt:ts};
   },{applyLocally:false});
   if(stopped)return {status:'stopped'};
   if(sawOccupied)return {status:'occupied'};
   const snapVal=result?.snapshot?.val?.();
   if(result?.committed===true){
    if(snapVal&&typeof snapVal==='object'&&snapVal.clientId&&snapVal.clientId!==clientId){
     return {status:'occupied',holder:snapVal};
    }
    claimed=true;
    armDisconnect();
    startMonitors();
    return {status:'claimed',holder:snapVal||{clientId}};
   }
   let remoteVal=snapVal;
   if(remoteVal===undefined){
    try{remoteVal=(await sdk.get(sessionRef))?.val?.()??null;}catch(readError){
     if(isActiveSessionPermissionError(readError)){unsupported=true;return {status:'unsupported'};}
     return {status:'error',error:readError};
    }
   }
   if(stopped)return {status:'stopped'};
   if(remoteVal&&typeof remoteVal==='object'&&remoteVal.clientId&&remoteVal.clientId!==clientId){
    if(!takeover&&isFreshForeign(remoteVal))return {status:'occupied',holder:remoteVal};
   }
   if(!reducerCalled&&!remoteVal){
    unsupported=true;
    return {status:'unsupported'};
   }
   return {status:'error',error:Error('Active session transaction did not commit')};
  }catch(error){
   if(stopped)return {status:'stopped'};
   if(isActiveSessionPermissionError(error)){
    try{
     const snap=await sdk.get(sessionRef);
     const existing=snap?.val?.();
     if(existing&&typeof existing==='object'&&existing.clientId&&existing.clientId!==clientId){
      return {status:'occupied',holder:existing};
     }
     return {status:'error',error};
    }catch(readError){
     if(isActiveSessionPermissionError(readError)){
      unsupported=true;
      return {status:'unsupported'};
     }
     return {status:'error',error:readError};
    }
   }
   return {status:'error',error};
  }
 }

 async function release({removeRemote=true}={}){
  const wasClaimed=claimed&&!unsupported;
  stopped=true;
  claimed=false;
  stopWatchers();
  const handle=disconnectHandle;
  disconnectHandle=null;
  if(handle){
   try{
    const cancel=handle.cancel?.();
    if(cancel&&typeof cancel.catch==='function')await Promise.race([cancel.catch(()=>{}),new Promise(resolve=>setTimeout(resolve,400))]);
   }catch{}
  }
  if(!removeRemote||!wasClaimed)return true;
  let timer=null;
  try{
   await Promise.race([
    sdk.runTransaction(sessionRef,current=>{
     if(!current||current.clientId===clientId)return null;
     return undefined;
    },{applyLocally:false}).catch(()=>null),
    new Promise(resolve=>{timer=setTimeout(resolve,REMOTE_CLEANUP_TIMEOUT_MS);})
   ]);
  }catch{}
  finally{if(timer!==null)try{clearTimeout(timer);}catch{}}
  return true;
 }

 return Object.freeze({
  clientId,
  acquire,
  release,
  renew:()=>renewLease({allowEmpty:true}),
  isClaimed:()=>claimed&&!stopped,
  isUnsupported:()=>unsupported
 });
}
