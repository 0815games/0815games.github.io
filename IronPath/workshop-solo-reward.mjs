// Free-tier solo wave credit: one account transaction credits legacy XP/loot, the
// workshop bonus and a per-run receipt together. Client-reported completion cannot
// prove a wave was completed; receipts only stop accidental duplicate retries.
import {decodeWorkshop} from './workshop-wire.mjs?v=20261216-winter2';
import {initializeWireWorkshop} from './workshop-wire.mjs?v=20261216-winter2';
import {applyWorkshopWaveCredit} from './workshop-wave-credit.mjs?v=20261216-winter2';
import {receiptForBlock,waveCredit} from './workshop-run-receipt.mjs';

// Returns the changed profile or null. A missing workshop is initialized exactly
// once; a corrupt workshop fails closed instead of being replaced or reset.
export function applySoloWaveReward(profile,{runId,wave,campaign=false}={}){
 if(campaign||!profile||typeof profile!=='object'||Array.isArray(profile))return null;
 const credit=waveCredit(wave);if(!credit)return null;
 const receiptId=receiptForBlock(runId,credit.block);if(!receiptId)return null;
 let current=profile;
 if(!Object.hasOwn(current,'workshop'))current=initializeWireWorkshop(current);
 if(!current||!decodeWorkshop(current.workshop))return null;
 return applyWorkshopWaveCredit(current,{kind:'solo',receiptId,mask:credit.mask,block:credit.block});
}
