(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.InkfallSocialPresence=api;})(globalThis,()=>{
'use strict';
const validUid=x=>typeof x==='string'&&x.length>0&&x.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(x);
function summarize(raw,now,ttl=90000){
 if(raw===null||raw&&typeof raw==='object'&&!Array.isArray(raw)&&Object.keys(raw).length===0)return {state:'offline',online:false,connections:0};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!Number.isFinite(now))return {state:'unknown',online:null,connections:null};
 const fresh=Object.values(raw).filter(x=>x?.online===true&&Number.isSafeInteger(x.updatedAt)&&x.updatedAt>=0&&x.updatedAt<=now+5000&&now-x.updatedAt<ttl);
 return fresh.length?{state:'online',online:true,connections:fresh.length}:{state:'unknown',online:null,connections:null};
}
function createPublisher({db,auth,uid,enabled=false,serverTimestamp=()=>globalThis.firebase.database.ServerValue.TIMESTAMP,schedule=setTimeout,cancel=clearTimeout,onError=()=>{}}){
 if(!validUid(uid))throw Error('invalid-uid');
 let running=false,connected=false,allowed=false,active=null,heartbeat=null,unsubAuth=null;
 const refs=[];
 const owned=()=>auth.currentUser?.uid===uid;
 const valid=entry=>running&&connected&&allowed&&owned()&&active===entry&&!entry.closing;
 function clearHeartbeat(){if(heartbeat!==null)cancel(heartbeat);heartbeat=null;}
 function closeSlot(){
  clearHeartbeat();const entry=active;active=null;if(!entry)return Promise.resolve();
  entry.closing=true;
  entry.cleanup=entry.operation.catch(()=>{}).then(()=>entry.ref.remove()).then(()=>entry.disconnect.cancel()).catch(onError);
  return entry.cleanup;
 }
 function beat(entry){
  if(!valid(entry))return;
  entry.operation=entry.operation.then(()=>valid(entry)?entry.ref.set({online:true,updatedAt:serverTimestamp()}):undefined).then(()=>{if(valid(entry))heartbeat=schedule(()=>beat(entry),30000);}).catch(error=>{onError(error);if(active===entry)closeSlot();});
 }
 function reconcile(){
  if(!running||!connected||!allowed||!owned()){closeSlot();return;}
  if(active)return;
  const ref=db.ref('social/presence/'+uid+'/connections').push();
  const entry={ref,disconnect:ref.onDisconnect(),closing:false,operation:Promise.resolve()};active=entry;
  entry.operation=Promise.resolve().then(async()=>{
   if(!valid(entry))return;
   await entry.disconnect.remove();
   if(valid(entry))await ref.set({online:true,updatedAt:serverTimestamp()});
  }).then(()=>{if(valid(entry))heartbeat=schedule(()=>beat(entry),30000);}).catch(error=>{onError(error);if(active===entry)closeSlot();});
 }
 function listen(path,callback){if(!running)return;const ref=db.ref(path);ref.on('value',callback,error=>{onError(error);allowed=false;closeSlot();});refs.push({ref,callback});}
 function start(){
  if(running)return true;
  if(!enabled||!owned())return false;
  running=true;
  unsubAuth=auth.onAuthStateChanged(user=>{if(user?.uid!==uid)stop();});
  if(!running){if(unsubAuth)unsubAuth();unsubAuth=null;return false;}
  listen('social/presencePrivacy/'+uid,snap=>{if(!running)return;allowed=snap.val()==='friends';reconcile();});
  listen('.info/connected',snap=>{if(!running)return;connected=snap.val()===true;reconcile();});
  return true;
 }
 async function stop(){
  running=false;connected=false;allowed=false;
  for(const {ref,callback} of refs.splice(0))ref.off('value',callback);
  if(unsubAuth)unsubAuth();unsubAuth=null;
  const cleanup=closeSlot();let timer;
  await Promise.race([cleanup,new Promise(resolve=>{timer=schedule(resolve,2500);})]);
  if(timer!==undefined)cancel(timer);
 }
 async function setVisibility(value){
  if(!enabled||!owned())throw Error('unauthenticated-or-disabled');
  if(!['private','friends'].includes(value))throw Error('invalid-visibility');
  await db.ref('social/presencePrivacy/'+uid).set(value);
 }
 return {start,stop,setVisibility,retry:reconcile};
}
function watch({db,auth,targetUid,onData,clock=Date.now,schedule=setTimeout,cancel=clearTimeout}){
 if(!validUid(targetUid))throw Error('invalid-uid');
 const viewer=auth.currentUser?.uid,unknown=()=>onData({state:'unknown',online:null,connections:null});
 if(!validUid(viewer)){unknown();return()=>{};}
 let alive=true,connected=false,offset=0,seen=false,raw=null,timer=null,offAuth=null;
 const refs=[];
 function cleanup(){if(timer!==null)cancel(timer);timer=null;for(const {ref,cb} of refs.splice(0))ref.off('value',cb);if(offAuth)offAuth();offAuth=null;}
 function stop(){alive=false;cleanup();}
 function fail(){if(!alive)return;stop();unknown();}
 function publish(){
  if(!alive)return;if(timer!==null)cancel(timer);timer=null;
  if(!connected||!seen||auth.currentUser?.uid!==viewer){unknown();return;}
  const now=clock()+offset,result=summarize(raw,now);onData(result);
  if(result.online){const expiry=Object.values(raw).filter(x=>x?.online===true&&Number.isSafeInteger(x.updatedAt)&&x.updatedAt<=now+5000&&now-x.updatedAt<90000).reduce((min,x)=>Math.min(min,x.updatedAt+90000),Infinity);timer=schedule(publish,Math.max(1,expiry-now+1));}
 }
 function listen(path,cb){if(!alive)return;const ref=db.ref(path);ref.on('value',cb,fail);refs.push({ref,cb});}
 offAuth=auth.onAuthStateChanged(user=>{if(user?.uid!==viewer)fail();});
 listen('.info/connected',snap=>{connected=snap.val()===true;publish();});
 listen('.info/serverTimeOffset',snap=>{offset=Number.isFinite(snap.val())?snap.val():0;publish();});
 listen('social/presence/'+targetUid+'/connections',snap=>{raw=snap.val();seen=true;publish();});
 if(!alive)cleanup();return stop;
}
return {createPublisher,watch,summarize};
});
