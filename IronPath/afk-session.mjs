// AFK is a convenience, not a server-side session timeout. Firebase's normal
// LOCAL persistence can share sign-out between same-origin tabs. Cooperating
// game documents hold shared Web Locks; automatic sign-out requires an
// exclusive lock. Older/uncooperative pages cannot be detected by Web Locks.
export const AFK_DELAY_MS=30*60_000;
export const SESSION_TAB_LOCK='ironpath:shared-firebase-session:v1';

export function createSessionTabLock({locks,name=SESSION_TAB_LOCK}={}){
 let usable=!!locks&&typeof locks.request==='function',closed=false,shared=null,held=false,busy=false;
 async function acquireShared(){
  if(!usable||closed||shared)return false;
  let announce,finish,announced=false;
  const entered=new Promise(resolve=>{announce=resolve;});
  const hold=new Promise(resolve=>{finish=resolve;});
  const abort=new AbortController();
  const say=value=>{if(!announced){announced=true;announce(value);}};
  const entry={finish,abort,promise:null};shared=entry;
  entry.promise=Promise.resolve().then(()=>locks.request(name,{mode:'shared',signal:abort.signal},async lock=>{
   if(!lock||closed){say(false);return;}
   held=true;say(true);await hold;held=false;
  })).catch(()=>say(false));
  const ok=await entered;
  if(!ok){if(shared===entry)shared=null;usable=false;}
  return ok;
 }
 async function dropShared(){
  const entry=shared;if(!entry)return;
  if(!held)entry.abort.abort();entry.finish();await entry.promise;
  if(shared===entry)shared=null;
 }
 async function start(){return acquireShared();}
 async function runIfAlone(task){
  if(!usable||closed||!held||busy||typeof task!=='function')return {ran:false};
  busy=true;let ran=false,value;
  try{
   await dropShared();
   if(!closed)await locks.request(name,{mode:'exclusive',ifAvailable:true},async lock=>{
    if(!lock||closed)return;
    ran=true;value=await task();
   });
  }catch{/* Fail closed: never sign out without the exclusive lock. */}
  finally{if(!closed)await acquireShared();busy=false;}
  return {ran,value};
 }
 function stop(){closed=true;const entry=shared;if(entry){if(!held)entry.abort.abort();entry.finish();}}
 return Object.freeze({start,runIfAlone,stop,available:()=>usable&&!closed,isHeld:()=>held});
}

// The owning account supplies the same conservative safety check used for
// updates and a session-bound action. A busy game/party or unconfirmed save
// resets the clock, so 30 minutes means time away from a safe menu, not time
// spent watching a long match. Only genuine user input resets the clock.
export function createAfkTimer({document,window,session,safety,onExpire,clock=Date.now,
 delayMs=AFK_DELAY_MS,pollMs=15_000}={}){
 if(!document?.addEventListener||!window?.addEventListener||
    ![session,safety,onExpire,clock].every(fn=>typeof fn==='function')||
    !Number.isInteger(delayMs)||delayMs<1||!Number.isInteger(pollMs)||pollMs<1)throw Error('Invalid AFK timer');
 let last=clock(),timer=null,busy=false,stopped=false;
 const events=['pointerdown','pointermove','keydown','wheel','touchstart'];
 function activity(event){if(event?.isTrusted===true)last=clock();}
 function currentSession(){try{return session();}catch{return null;}}
 function safe(){try{return safety()==='ready';}catch{return false;}}
 async function check(){
  if(stopped||busy)return;
  const now=clock();if(!Number.isFinite(now))return;
  if(now<last)last=now;
  const current=currentSession();
  if(current===null||current===undefined||!safe()){last=now;return;}
  if(now-last<delayMs)return;
  const observed=last;
  const stillIdle=()=>!stopped&&last===observed&&currentSession()===current&&safe()&&clock()>=observed+delayMs;
  busy=true;
  try{await onExpire({session:current,stillIdle});}catch{/* A failure is retried only at a later poll. */}
  finally{busy=false;}
 }
 const wake=()=>void check();
 function start(){
  if(stopped||timer!==null)return;
  for(const name of events)window.addEventListener(name,activity,{capture:true,passive:true});
  document.addEventListener('visibilitychange',wake);window.addEventListener('pageshow',wake);
  timer=window.setInterval(wake,pollMs);
 }
 function stop(){
  if(stopped)return;stopped=true;
  if(timer!==null)window.clearInterval(timer);timer=null;
  for(const name of events)window.removeEventListener(name,activity,true);
  document.removeEventListener('visibilitychange',wake);window.removeEventListener('pageshow',wake);
 }
 return Object.freeze({start,stop,check,reset(){last=clock();}});
}
