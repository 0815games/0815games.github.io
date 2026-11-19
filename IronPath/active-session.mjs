// Cross-window / cross-device single-session lease over Firebase RTDB.
// Every tab/window receives an ephemeral in-memory clientId so concurrent tabs
// in the same browser also coordinate against the shared single-session lease,
// while createSameBrowserSessionMonitor distinguishes same-browser siblings from
// separate/private windows so blocking or taking over a sibling tab never wipes
// shared Firebase Auth IndexedDB persistence.
export const ACTIVE_SESSIONS_PATH='activeSessions';
export const ACTIVE_SESSION_LEASE_MS=45_000;
export const ACTIVE_SESSION_HEARTBEAT_MS=10_000;
export const CLIENT_SESSION_STORAGE_KEY='ironpath:client-session-id';
export const CLIENT_ID_PATTERN=/^[a-f0-9]{32}$/;
export const SAME_BROWSER_LOCK_PREFIX='ironpath:session-holder:';
export const SAME_BROWSER_CHANNEL_NAME='ironpath:active-session';

const REMOTE_CLEANUP_TIMEOUT_MS=2500;
const RECLAIM_DELAY_MS=150;
const SAME_BROWSER_PING_MS=80;

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

export function createWindowSessionId({crypto=globalThis.crypto}={}){
 return generateClientSessionId(crypto);
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

export function createSameBrowserSessionMonitor({
 clientId,
 locks=globalThis.navigator?.locks,
 BroadcastChannelCtor=globalThis.BroadcastChannel,
 channelName=SAME_BROWSER_CHANNEL_NAME,
 setTimeout=globalThis.setTimeout,
 clearTimeout=globalThis.clearTimeout
}={}){
 if(typeof clientId!=='string'||!CLIENT_ID_PATTERN.test(clientId)){
  throw Error('Invalid same-browser session clientId');
 }
 const lockName=`${SAME_BROWSER_LOCK_PREFIX}${clientId}`;
 let claimed=false;
 let releaseLock=null;
 let listenerChannel=null;
 let lockOpId=0;

 function release(){
  claimed=false;
  lockOpId++;
  const unlock=releaseLock;
  releaseLock=null;
  if(unlock)try{unlock();}catch{}
  const ch=listenerChannel;
  listenerChannel=null;
  if(ch)try{ch.close();}catch{}
 }

 function claim(){
  if(claimed)return;
  claimed=true;
  const opId=++lockOpId;
  if(typeof locks?.request==='function'){
   try{
    void locks.request(lockName,{mode:'shared'},()=>new Promise(resolve=>{
     if(!claimed||opId!==lockOpId){resolve();return;}
     releaseLock=resolve;
    })).catch(()=>{});
   }catch{/* Web Locks unavailable in restricted contexts. */}
  }
  if(typeof BroadcastChannelCtor==='function'){
   try{
    const ch=new BroadcastChannelCtor(channelName);
    listenerChannel=ch;
    ch.addEventListener?.('message',event=>{
     const data=event?.data;
     if(!claimed||!data||data.type!=='holder-ping'||data.targetClientId!==clientId)return;
     try{ch.postMessage({type:'holder-pong',clientId,nonce:data.nonce});}catch{}
    });
   }catch{/* BroadcastChannel unavailable in restricted contexts. */}
  }
 }

 async function hasHolder(targetClientId){
  if(typeof targetClientId!=='string'||!CLIENT_ID_PATTERN.test(targetClientId)||targetClientId===clientId){
   return false;
  }
  const targetLock=`${SAME_BROWSER_LOCK_PREFIX}${targetClientId}`;
  if(typeof locks?.query==='function'){
   try{
    const snapshot=await locks.query();
    const held=Array.isArray(snapshot?.held)?snapshot.held:[];
    if(held.some(entry=>entry?.name===targetLock))return true;
   }catch{/* Fall through to BroadcastChannel probe. */}
  }
  if(typeof BroadcastChannelCtor==='function'){
   try{
    return await new Promise(resolve=>{
     const ch=new BroadcastChannelCtor(channelName);
     const nonce=Math.random().toString(36).slice(2);
     let settled=false;
     let timer=null;
     const finish=result=>{
      if(settled)return;
      settled=true;
      if(timer!==null)try{clearTimeout(timer);}catch{}
      try{ch.close();}catch{}
      resolve(result);
     };
     ch.addEventListener?.('message',event=>{
      const data=event?.data;
      if(data?.type==='holder-pong'&&data.clientId===targetClientId&&data.nonce===nonce){
       finish(true);
      }
     });
     timer=setTimeout(()=>finish(false),SAME_BROWSER_PING_MS);
     try{ch.postMessage({type:'holder-ping',targetClientId,nonce});}catch{finish(false);}
    });
   }catch{
    return false;
   }
  }
  return false;
 }

 return Object.freeze({claim,release,hasHolder});
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
  let occupiedHolder=null;
  const ts=timestampValue();
  try{
   const result=await sdk.runTransaction(sessionRef,current=>{
    reducerCalled=true;
    if(stopped)return undefined;
    if(current&&typeof current==='object'&&current.clientId&&current.clientId!==clientId){
     if(!takeover&&isFreshForeign(current)){
      sawOccupied=true;
      occupiedHolder=current;
      return undefined;
     }
    }
    const claimedAt=current&&current.clientId===clientId&&Number.isInteger(current.claimedAt)&&current.claimedAt>=0?current.claimedAt:ts;
    return {clientId,claimedAt,heartbeatAt:ts};
   },{applyLocally:false});
   if(stopped)return {status:'stopped'};
   const snapVal=result?.snapshot?.val?.();
   if(sawOccupied)return {status:'occupied',holder:occupiedHolder||snapVal||null};
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
