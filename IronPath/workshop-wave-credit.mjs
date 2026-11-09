// Account-transaction reducer for the live co-op reward queues. It cannot
// prove a wave was completed. Call inside a single transaction against
// the latest account and use a stable per-run/receipt identity for retries.
import {WAVE_COUNT,MAX_WAVE_MASK} from './combat.mjs?v=20261102-battle2';
import {waveXP} from './progression.mjs?v=20261105-prestige1';
import {rewardWave} from './armory.mjs?v=20261107-balance1';
import {decodeWorkshop,encodeWorkshop} from './workshop-wire.mjs?v=20261101-campaign1';
import {applyBossRewards} from './workshop-rewards.mjs?v=20261108-squadmaps1';

export function applyWorkshopWaveCredit(profile,{kind,receiptId,mask,block=0}={}){
 if(!profile||typeof profile!=='object'||Array.isArray(profile)||!Number.isSafeInteger(profile.xp)||profile.xp<0||profile.xp>10000000||!['solo','coop'].includes(kind)||typeof receiptId!=='string'||!/^[a-f0-9]{32}$/.test(receiptId)||!Number.isInteger(mask)||mask<0||mask>MAX_WAVE_MASK)return null;
 const field=kind==='solo'?'soloWorkshopReceipts':'coopRewards',receipts=profile[field]??{};
 if(!receipts||typeof receipts!=='object'||Array.isArray(receipts))return null;
 const old=Object.hasOwn(receipts,receiptId)?receipts[receiptId]:0;
 if(!Number.isInteger(old)||old<0||old>MAX_WAVE_MASK)return null;
 const added=mask&~old;if(!added)return null;
 const workshop=decodeWorkshop(profile.workshop);if(!workshop)return null;
 const bonus=applyBossRewards({...profile,workshop},old,mask,block);if(!bonus)return null;
 let xp=profile.xp,armory=bonus.profile.armory;
 for(let i=0;i<WAVE_COUNT;i++)if(added&(1<<i)){const wave=block*WAVE_COUNT+i+1;xp+=waveXP(wave);armory=rewardWave(armory,wave);}
 if(!Number.isSafeInteger(xp)||xp>10000000)return null;
 // Unlocks earned after migration must remain selectable in the workshop.
 const owned=[...workshop.owned];for(let i=0;i<10;i++)if((armory.owned&(1<<i))&&!owned.includes(`legacy-${i+1}`))owned.push(`legacy-${i+1}`);
 const encoded=encodeWorkshop({...bonus.profile.workshop,owned});if(!encoded)return null;
 return {...profile,xp,armory,workshop:encoded,[field]:{...receipts,[receiptId]:bonus.receipt}};
}
