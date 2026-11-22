// Best-effort same-browser protection only. Web Locks are origin/profile scoped;
// they do not prevent duplicate accounts on other devices or browsers.
export function guardMultiplayerTab({locks,partyId,uid,onAcquired,onConflict}){
  if(typeof partyId!=='string'||typeof uid!=='string'||typeof onAcquired!=='function'||typeof onConflict!=='function')throw Error('Invalid tab guard');
  let closed=false,release=null,claimed=false;
  const enter=()=>{if(!closed&&!claimed){claimed=true;onAcquired();}};
  if(!locks||typeof locks.request!=='function'){enter();return ()=>{closed=true;};}
  const key=`ironpath-party:${JSON.stringify([partyId,uid])}`;
  Promise.resolve().then(()=>locks.request(key,{mode:'exclusive',ifAvailable:true},lock=>{
    if(closed)return;
    if(!lock){onConflict();return;}
    const held=new Promise(resolve=>{release=resolve;});
    enter();if(closed)release();return held;
  })).catch(()=>{if(!closed&&!claimed)enter();});
  return ()=>{closed=true;release?.();};
}
