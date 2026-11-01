import {waveXP} from './progression.mjs?v=20261031-rpg2';

// Idempotent, per-account credits. One transaction changes XP and the match's
// wave receipt together; the player-host is not trusted or cheat-proof.
export function createCoopRewardQueue({db,auth,sdk,partyId,onStatus=()=>{},clock=Date.now}){
  const uid=auth?.currentUser?.uid;
  if(!db||!uid||!sdk||typeof sdk.ref!=='function'||typeof sdk.onValue!=='function'||typeof sdk.runTransaction!=='function'||!/^[a-f0-9]{32}$/.test(partyId)||typeof onStatus!=='function')throw new Error('Invalid reward queue');
  let pending=0,confirmed=0,running=false,retryAt=0,closed=false;
  async function pump(){
    if(running||closed||!pending||clock()<retryAt||auth.currentUser?.uid!==uid)return;
    running=true;const mask=pending;pending=0;let unwatch=null;
    try{
      const profileRef=sdk.ref(db,`players/${uid}`);
      // Keep an active subscription through the transaction. RTDB may invoke
      // a transaction with uncached null even after a one-off get().
      await new Promise((resolve,reject)=>{unwatch=sdk.onValue(profileRef,()=>resolve(),reject);});
      if(closed||auth.currentUser?.uid!==uid)return;
      const result=await sdk.runTransaction(profileRef,current=>{
        if(closed||auth.currentUser?.uid!==uid||!current||!Number.isInteger(current.xp))return undefined;
        const receipts=current.coopRewards||{},old=receipts[partyId]||0;
        if(!Number.isInteger(old)||old<0||old>1023)return undefined;
        const added=mask&~old;if(!added)return undefined;
        let xp=0;for(let wave=1;wave<=10;wave++)if(added&(1<<(wave-1)))xp+=waveXP(wave);
        if(current.xp+xp>10000000)return undefined;
        return {...current,xp:current.xp+xp,coopRewards:{...receipts,[partyId]:old|mask}};
      },{applyLocally:false});
      if(closed||auth.currentUser?.uid!==uid)return;
      const receipt=result.snapshot.val()?.coopRewards?.[partyId]||0;
      if(!Number.isInteger(receipt)||receipt<0||receipt>1023||(receipt&mask)!==mask)throw new Error('XP credit not confirmed');
      confirmed|=receipt;pending&=~confirmed;if(result.committed)onStatus('saved');
    }catch(error){if(!closed&&auth.currentUser?.uid===uid){pending|=mask;retryAt=clock()+5000;onStatus('error',error);}}
    finally{unwatch?.();running=false;if(!closed&&pending&&clock()>=retryAt)void pump();}
  }
  return {
    observe(mask){if(closed||!Number.isInteger(mask)||mask<0||mask>1023)return;pending|=mask&~confirmed;void pump();},
    close(){closed=true;pending=0;}
  };
}
