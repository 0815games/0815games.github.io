import {MAX_WAVE_MASK} from './combat.mjs?v=20261123-aim6';

// This is a delivery/save handshake, not an anti-cheat authority. Each client
// confirms only its own finished report and server-acknowledged reward receipts.
// The host may close only after observing every authenticated roster member's
// acknowledgement in the same terminal snapshot generation.
export function createPartyEndCoordinator({uid,hostId,playerIds,getQueues,send,onClose,isCurrent=()=>true,onStatus=()=>{},retryMs=2000,setTimer=setTimeout,clearTimer=clearTimeout}){
  if(typeof uid!=='string'||typeof hostId!=='string'||!Array.isArray(playerIds)||![2,3,4].includes(playerIds.length)||new Set(playerIds).size!==playerIds.length||!playerIds.includes(uid)||!playerIds.includes(hostId)||![getQueues,send,onClose,isCurrent,onStatus,setTimer,clearTimer].every(fn=>typeof fn==='function')||!Number.isFinite(retryMs)||retryMs<=0)throw Error('Invalid party finalization coordinator');
  const roster=[...playerIds],known=new Map(),offline=new Set(),departed=new Set();
  let stopped=false,invalid=false,finalTick=null,finalMasks=null,frame=null,sending=false,closing=false,timer=null,lastStatus=null,lastDetailSig='';
  const active=()=>{try{return !stopped&&!invalid&&isCurrent()===true;}catch{return false;}};
  const missingIds=()=>frame?roster.filter(id=>!frame.acknowledged.includes(id)):[];
  const departedIds=()=>frame?roster.filter(id=>!frame.acknowledged.includes(id)&&departed.has(id)):[];
  const offlineIds=()=>frame?roster.filter(id=>!frame.acknowledged.includes(id)&&offline.has(id)&&!departed.has(id)):[];
  const canForceClose=tick=>active()&&uid===hostId&&tick===finalTick&&localConfirmed()&&!!frame?.acknowledged.includes(uid)&&!roster.every(id=>frame.acknowledged.includes(id));
  function status(value){
    const missing=missingIds(),dep=departedIds(),off=offlineIds(),force=finalTick!==null&&canForceClose(finalTick);
    const sig=finalTick===null?'':`${finalTick}:${missing.join(',')}:${dep.join(',')}:${off.join(',')}:${force}`;
    if(value===lastStatus&&sig===lastDetailSig)return;
    lastStatus=value;lastDetailSig=sig;
    try{onStatus(value,finalTick,{endTick:finalTick,missingIds:missing,departedIds:dep,offlineIds:off,canForceClose:force});}catch{/* Feedback must not change the safety gate. */}
  }
  function cancelTimer(){if(timer!==null)clearTimer(timer);timer=null;}
  function stop(){stopped=true;cancelTimer();}
  function schedule(){if(!active()||timer!==null)return;timer=setTimer(()=>{timer=null;refresh();},retryMs);timer?.unref?.();}
  function masksOf(value){
    if(!value||typeof value!=='object'||Array.isArray(value))return null;
    const result=new Map();
    for(const [key,mask] of Object.entries(value)){
      const block=Number(key);
      if(!/^\d+$/.test(key)||!Number.isSafeInteger(block)||block<0||!Number.isInteger(mask)||mask<0||mask>MAX_WAVE_MASK)return null;
      result.set(block,(result.get(block)||0)|mask);
    }
    return result.has(0)?result:null;
  }
  const maskSignature=masks=>JSON.stringify([...masks].sort((a,b)=>a[0]-b[0]));
  function knownCovered(masks){for(const [block,mask] of known)if(((masks.get(block)||0)&mask)!==mask)return false;return true;}
  function localConfirmed(){
    if(!frame?.ended||!frame.reportReady||!finalMasks||!knownCovered(finalMasks))return false;
    try{
      const queues=getQueues();if(!(queues instanceof Map))return false;
      for(const queue of queues.values())if(!queue?.isSettled?.())return false;
      for(const [block,mask] of finalMasks)if(!queues.get(block)?.hasConfirmed?.(mask))return false;
      return true;
    }catch{return false;}
  }
  function refresh(){
    if(!active()||!frame)return;
    if(!localConfirmed()){status('saving');return;}
    if(!frame.acknowledged.includes(uid)){
      status('acknowledging');if(sending||timer!==null)return;
      sending=true;const tick=finalTick;
      Promise.resolve().then(()=>active()&&send(tick)).catch(()=>{}).finally(()=>{
        sending=false;if(!active())return;
        // Neither a successful input write nor a timeout proves the host
        // processed it. Retry until the authoritative view includes our ID.
        if(frame?.acknowledged.includes(uid))refresh();else schedule();
      });return;
    }
    cancelTimer();
    if(uid!==hostId||!roster.every(id=>frame.acknowledged.includes(id))){status('waiting');return;}
    status('closing');if(closing)return;closing=true;const tick=finalTick;
    Promise.resolve().then(()=>active()&&onClose(tick)).then(result=>{
      closing=false;if(!active())return;if(result===true)stop();else schedule();
    },()=>{closing=false;if(active())schedule();});
  }
  return {
    observeReward(block,mask){
      if(!active())return;
      if(!Number.isSafeInteger(block)||block<0||!Number.isInteger(mask)||mask<0||mask>MAX_WAVE_MASK){invalid=true;cancelTimer();return;}
      known.set(block,(known.get(block)||0)|mask);
      if(finalMasks&&!knownCovered(finalMasks)){invalid=true;cancelTimer();return;}
    },
    observe(value){
      if(!active()||!value?.partyEnd)return;
      const end=value.partyEnd,masks=masksOf(value.masks);
      if(!Number.isSafeInteger(end.tick)||end.tick<1||!Number.isSafeInteger(value.snapshotTick)||value.snapshotTick<end.tick||!Array.isArray(end.acknowledged)||new Set(end.acknowledged).size!==end.acknowledged.length||end.acknowledged.some(id=>!roster.includes(id))||!masks||!knownCovered(masks)){
        invalid=true;cancelTimer();return;
      }
      if(finalTick!==null&&(end.tick!==finalTick||maskSignature(masks)!==maskSignature(finalMasks))){invalid=true;cancelTimer();return;}
      if(value.members&&typeof value.members==='object'&&!Array.isArray(value.members)){
        for(const id of roster){
          const member=value.members[id];
          if(!member||typeof member!=='object')continue;
          if(member.active===false)offline.add(id);else offline.delete(id);
          if(member.departed===true)departed.add(id);else departed.delete(id);
        }
      }
      finalTick=end.tick;finalMasks=masks;frame={ended:value.ended===true,reportReady:value.reportReady===true,acknowledged:[...end.acknowledged]};refresh();
    },
    canClose(tick){return active()&&uid===hostId&&tick===finalTick&&localConfirmed()&&roster.every(id=>frame.acknowledged.includes(id));},
    canForceClose,missingIds,departedIds,offlineIds,
    refresh,stop
  };
}
