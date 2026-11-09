import {WAVE_COUNT,MAX_WAVE_MASK} from './combat.mjs?v=20261212-actiii3';
import {rewardWave} from './armory.mjs?v=20261107-balance1';
import {waveXP} from './progression.mjs?v=20261105-prestige1';
import {rewardDelta} from './run-results.mjs?v=20261212-actiii3';
import {applyWorkshopWaveCredit} from './workshop-wave-credit.mjs?v=20261215-winter1';
import {initializeWireWorkshop,decodeWorkshop} from './workshop-wire.mjs?v=20261215-winter1';

// Idempotent, per-account credits. One transaction changes XP and the match's
// wave receipt together; the player-host is not trusted or cheat-proof.
export function createCoopRewardQueue({db,auth,sdk,partyId,block=0,onStatus=()=>{},clock=Date.now,workshop=false}){
  const uid=auth?.currentUser?.uid;
  if(!db||!uid||!sdk||typeof sdk.ref!=='function'||typeof sdk.onValue!=='function'||typeof sdk.runTransaction!=='function'||!/^[a-f0-9]{32}$/.test(partyId)||!Number.isSafeInteger(block)||block<0||typeof onStatus!=='function')throw new Error('Invalid reward queue');
  const receiptId=block===0?partyId:((BigInt('0x'+partyId)+BigInt(block))%(1n<<128n)).toString(16).padStart(32,'0');
  let pending=0,confirmed=0,running=false,retryAt=0,closed=false,retryTimer=null;
  async function pump(){
    if(running||closed||!pending||clock()<retryAt||auth.currentUser?.uid!==uid)return;
    running=true;const mask=pending;pending=0;let unwatch=null;
    try{
      const profileRef=sdk.ref(db,`players/${uid}`);
      // Keep an active subscription through the transaction. RTDB may invoke
      // a transaction with uncached null even after a one-off get().
      await new Promise((resolve,reject)=>{unwatch=sdk.onValue(profileRef,()=>resolve(),reject);});
      if(closed||auth.currentUser?.uid!==uid)return;
      let before=null;const result=await sdk.runTransaction(profileRef,current=>{
        if(closed||auth.currentUser?.uid!==uid||!current||!Number.isInteger(current.xp))return undefined;
        // Gated workshop alpha: the same transaction also credits components,
        // preserved legacy unlocks and the coop receipt. Client-reported results.
        if(workshop){const credited=applyWorkshopWaveCredit(current.workshop?current:initializeWireWorkshop(current)??{}, {kind:'coop',receiptId,mask,block});if(!credited||!decodeWorkshop(credited.workshop))return undefined;before=current;return credited;}
        const receipts=current.coopRewards||{},old=receipts[receiptId]||0;
        if(!Number.isInteger(old)||old<0||old>MAX_WAVE_MASK)return undefined;
        const added=mask&~old;if(!added)return undefined;
        let xp=0,armory=current.armory;for(let wave=1;wave<=WAVE_COUNT;wave++)if(added&(1<<(wave-1))){const actualWave=block*WAVE_COUNT+wave;xp+=waveXP(actualWave);armory=rewardWave(armory,actualWave);}
        if(current.xp+xp>10000000)return undefined;
        before=current;return {...current,xp:current.xp+xp,armory,coopRewards:{...receipts,[receiptId]:old|mask}};
      },{applyLocally:false});
      if(closed||auth.currentUser?.uid!==uid)return;
      const receipt=result.snapshot.val()?.coopRewards?.[receiptId]||0;
      if(!Number.isInteger(receipt)||receipt<0||receipt>MAX_WAVE_MASK||(receipt&mask)!==mask)throw new Error('XP credit not confirmed');
      confirmed|=receipt;pending&=~confirmed;if(result.committed)onStatus('saved',{delta:rewardDelta(before,result.snapshot.val()),profile:result.snapshot.val()});else onStatus('confirmed');
    }catch(error){if(!closed&&auth.currentUser?.uid===uid){pending|=mask;retryAt=clock()+5000;onStatus('error',error);if(!retryTimer){retryTimer=setTimeout(()=>{retryTimer=null;void pump();},5000);retryTimer.unref?.();}}}
    finally{unwatch?.();running=false;if(!closed&&pending&&clock()>=retryAt)void pump();}
  }
  return {
    observe(mask){if(closed||!Number.isInteger(mask)||mask<0||mask>MAX_WAVE_MASK)return;pending|=mask&~confirmed;void pump();},
    close(){closed=true;pending=0;if(retryTimer)clearTimeout(retryTimer);retryTimer=null;}
  };
}
