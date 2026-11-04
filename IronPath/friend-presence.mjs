// A separate timestamp per browser connection prevents one tab going offline
// from hiding another. Stale records expire even if onDisconnect never runs.
const validId=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);
export function createFriendPresence({db,auth,sdk,crypto=globalThis.crypto,clock=Date.now,heartbeatMs=60000,expiryMs=180000}){
 const uid=auth.currentUser?.uid;if(!validId(uid)||!crypto?.getRandomValues)throw Error('Sign in required');
 const ref=path=>sdk.ref(db,path),alive=()=>!closed&&auth.currentUser?.uid===uid;
 let closed=false,connected=false,registered=false,generation=0,activeRef=null,heartbeat=null,checker=null,offset=null,connectionStop=null,offsetStop=null;
 const watched=new Map();
 function emit(entry){
  let value='unknown';
  if(alive()&&connected&&registered&&offset!==null&&entry.loaded){const now=clock()+offset;const items=entry.raw&&typeof entry.raw==='object'&&!Array.isArray(entry.raw)?Object.entries(entry.raw):[];value=items.some(([id,t])=>/^[a-f0-9]{32}$/.test(id)&&Number.isFinite(t)&&t<=now+5000&&now-t<expiryMs)?'online':'offline';}
  if(value!==entry.status){entry.status=value;entry.callback(value);}
 }
 const emitAll=()=>{for(const entry of watched.values())emit(entry);};
 const disconnect=()=>{generation++;connected=false;registered=false;activeRef=null;if(heartbeat)clearInterval(heartbeat);heartbeat=null;emitAll();};
 async function connect(){
  if(!alive()||connected)return;connected=true;registered=false;const gen=++generation,bytes=new Uint8Array(16);crypto.getRandomValues(bytes);const id=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join(''),path=ref(`friendPresence/${uid}/${id}`);activeRef=path;
  const stale=()=>!alive()||!connected||gen!==generation;
  try{await sdk.onDisconnect(path).remove();if(stale())return;await sdk.set(path,sdk.serverTimestamp());if(stale()){void sdk.remove(path).catch(()=>{});return;}registered=true;emitAll();let writing=false;heartbeat=setInterval(async()=>{if(stale()||writing)return;writing=true;try{await sdk.set(path,sdk.serverTimestamp());if(stale())void sdk.remove(path).catch(()=>{});}catch{if(!stale())disconnect();}finally{writing=false;}},heartbeatMs);}catch{if(!stale())disconnect();}
 }
 function start(){
  connectionStop=sdk.onValue(ref('.info/connected'),snap=>{if(!alive())return;if(snap.val()===true)void connect();else disconnect();},()=>disconnect());
  offsetStop=sdk.onValue(ref('.info/serverTimeOffset'),snap=>{if(!alive())return;const v=snap.val();offset=typeof v==='number'&&Number.isFinite(v)?v:null;emitAll();},()=>{offset=null;emitAll();});
  checker=setInterval(emitAll,Math.min(heartbeatMs,5000));
 }
 function watch(id,callback){
  if(!alive()||!validId(id)||id===uid)throw Error('Invalid friend');
  if(watched.has(id))throw Error('Friend already watched');
  const entry={callback,raw:null,loaded:false,status:null,stop:null};watched.set(id,entry);emit(entry);
  entry.stop=sdk.onValue(ref(`friendPresence/${id}`),snap=>{if(!alive()||watched.get(id)!==entry)return;entry.raw=snap.val();entry.loaded=true;emit(entry);},()=>{entry.loaded=false;emit(entry);});
  return ()=>{if(watched.get(id)!==entry)return;watched.delete(id);entry.stop?.();};
 }
 async function stop(){
  if(closed)return;const current=activeRef,wasConnected=connected;closed=true;generation++;connected=false;registered=false;if(heartbeat)clearInterval(heartbeat);if(checker)clearInterval(checker);connectionStop?.();offsetStop?.();for(const entry of watched.values())entry.stop?.();watched.clear();
  if(current&&wasConnected&&auth.currentUser?.uid===uid)try{await sdk.remove(current);}catch{}
 }
 start();return {watch,stop};
}
