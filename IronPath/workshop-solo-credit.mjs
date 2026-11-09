// Free-tier solo credit with a bounded legacy fallback.
//
// The gated workshop needs the candidate Firebase rules to be deployed. Until
// then a workshop write is rejected by rules. Rather than lose the wave, retry
// once with exactly the current legacy credit (no new fields). The caller must
// keep a session flag and use the legacy path for later waves after a fallback,
// so a missing receipt can never be replayed into repeated credit.
import {applySoloWaveReward} from './workshop-solo-reward.mjs?v=20261218-junction1';
import {receiptForBlock,waveCredit} from './workshop-run-receipt.mjs';

const MAX_XP=10000000;

export function legacyWaveReward(profile,amount,wave,rewardWave){
 if(!profile||!Number.isInteger(profile.xp)||!Number.isSafeInteger(amount)||amount<0||!Number.isInteger(wave)||wave<1)return null;
 if(profile.xp+amount>MAX_XP)return null;
 return {...profile,xp:profile.xp+amount,armory:rewardWave(profile.armory,wave)};
}

// `subscribe` must keep a listener open while the transaction runs; RTDB may
// otherwise invoke the update with an uncached null. Returns a plain result so
// the UI can report exactly what happened.
export async function creditSoloWave({sdk,profileRef,amount,wave,runId,rewardWave,subscribe,mode='workshop'}){
 if(!sdk||typeof sdk.runTransaction!=='function'||typeof subscribe!=='function'||typeof rewardWave!=='function')throw new Error('Invalid solo credit');
 const credit=waveCredit(wave);if(!credit)return {status:'invalid'};
 const receiptId=runId?receiptForBlock(runId,credit.block):null;
 let before=null;
 const runLegacy=async()=>{
  const stop=await subscribe();
  try{
   const result=await sdk.runTransaction(profileRef,current=>{const next=legacyWaveReward(current,amount,wave,rewardWave);if(!next)return undefined;before=current;return next;},{applyLocally:false});
   return result;
  }finally{stop?.();}
 };
 if(mode!=='workshop'||!receiptId){
  const result=await runLegacy();
  return {status:result?.committed?'legacy':'failed',committed:!!result?.committed,before,after:result?.snapshot?.val?.()??null};
 }
 const stop=await subscribe();
 let result,seen=null;
 try{
  result=await sdk.runTransaction(profileRef,current=>{seen=current??null;const next=applySoloWaveReward(current,{runId,wave});if(!next)return undefined;before=current;return next;},{applyLocally:false});
 }catch(error){
  // A network failure is not a rules rejection: surface it so the game can retry.
  return {status:'error',error};
 }finally{stop?.();}
 if(result?.committed)return {status:'workshop',committed:true,before,after:result.snapshot?.val?.()??null};
 // Replay of an already-credited receipt: nothing to pay, and never fall back.
 // `seen` is the last profile the reducer observed, even when it declined.
 const masked=seen?.soloWorkshopReceipts?.[receiptId];
 if(Number.isInteger(masked)&&masked>=0&&(masked&credit.mask)===credit.mask)return {status:'already-credited',committed:false};
 const legacy=await runLegacy();
 if(legacy?.committed)return {status:'legacy-fallback',committed:true,before,after:legacy.snapshot?.val?.()??null};
 return {status:'failed'};
}
