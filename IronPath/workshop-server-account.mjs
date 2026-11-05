// Experimental browser adapter. Endpoint must be trusted deployment config,
// never user input: it receives Firebase ID tokens. No insecure write fallback.
export function createWorkshopServerAccount({auth,endpoint,storage,crypto=globalThis.crypto,fetcher=globalThis.fetch,canEdit=()=>false,timeoutMs=15000}){
 let url;try{url=new URL(endpoint);}catch{throw Error('Invalid progression endpoint');}
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/progression'||!auth||!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||typeof storage.removeItem!=='function'||typeof crypto?.getRandomValues!=='function'||typeof fetcher!=='function'||typeof canEdit!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<1)throw Error('Invalid progression configuration');
 let busy=false;
 const key=uid=>`ironpath.progression.pending.v1:${url.origin}:${uid}`;
 async function transact(command){
  const session=auth.currentUser,uid=session?.uid;if(!uid)return {status:'signed-out'};
  if(busy)return {status:'busy'};if(!canEdit())return {status:'locked'};
  let text;try{text=JSON.stringify(command);if(!text||text.length>2048)throw Error();}catch{return {status:'invalid'};}
  busy=true;let timer;
  try{
   let pending;const raw=storage.getItem(key(uid)),retry=raw!==null;
   if(raw!==null){pending=JSON.parse(raw);if(!pending||Object.keys(pending).sort().join(',')!=='command,requestId'||typeof pending.command!=='string'||!/^[a-f0-9]{32}$/.test(pending.requestId))return {status:'error'};if(pending.command!==text)return {status:'pending'};}
   else{const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);pending={requestId:Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join(''),command:text};storage.setItem(key(uid),JSON.stringify(pending));}
   const token=await session.getIdToken();if(auth.currentUser!==session||!canEdit())return {status:'cancelled'};
   const controller=new AbortController();timer=setTimeout(()=>controller.abort(),timeoutMs);
   const response=await fetcher(url.href,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({requestId:pending.requestId,command}),cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});
   const result=await response.json();if(auth.currentUser!==session)return {status:'cancelled'};
   if(response.ok&&['applied','already-applied'].includes(result?.status)&&result.profile&&typeof result.profile==='object'&&!Array.isArray(result.profile)){storage.removeItem(key(uid));return {status:'saved',profile:result.profile};}
   // On a first attempt a definitive rejection means no transaction was applied.
   // After an uncertain earlier attempt, another in-flight request might still
   // commit, so even a later rejection must retain the original ID.
   if(!retry&&response.status===409&&result?.status==='rejected'){storage.removeItem(key(uid));return {status:'rejected'};}
   // Unknown outcomes and request conflicts retain the ID; never send a fresh
   // command until the pending result is reconciled.
   return {status:'error'};
  }catch{return {status:'error'};}finally{if(timer)clearTimeout(timer);busy=false;}
 }
 return {initialize:()=>transact({type:'initialize'}),command:transact,isBusy:()=>busy};
}
