// Reward reducers for the live workshop account path: must execute inside
// the SAME account transaction that commits the completed-wave receipt. This function does not verify that a
// client actually finished a wave, and must not be connected until migration,
// rules and mixed-client protection have been reviewed.
import {WAVE_COUNT,MAX_WAVE_MASK,bossForWave} from './combat.mjs?v=20261212-actiii3';
import {readArmory} from './armory.mjs?v=20261107-balance1';
import {validLegacy,validateWorkshop} from './workshop-model.mjs?v=20261215-winter1';

export const BOSS_SCRAP=20;
export const BOSS_COMPONENTS=1;
const MAX_SCRAP=10000000, MAX_COMPONENTS=1000000;

// Returns the changed profile and receipt to persist together, or null on
// invalid input/overflow. `previousMask` must come from the current profile
// within the transaction, never from a client cache. `completedMask` must only
// contain eligible *completed* waves for this player in the same receipt block.
// The caller separately applies regular wave rewards for the same new bits.
export function applyBossRewards(profile,previousMask,completedMask,block=0){
 if(!profile||typeof profile!=='object'||Array.isArray(profile)||!validLegacy(profile.armory)||!validateWorkshop(profile.workshop))return null;
 if(!Number.isInteger(previousMask)||previousMask<0||previousMask>MAX_WAVE_MASK||!Number.isInteger(completedMask)||completedMask<0||completedMask>MAX_WAVE_MASK||!Number.isSafeInteger(block)||block<0||!Number.isSafeInteger((block+1)*WAVE_COUNT))return null;
 const added=completedMask&~previousMask;let bosses=0;
 for(let index=0;index<WAVE_COUNT;index++)if((added&(1<<index))&&bossForWave(block*WAVE_COUNT+index+1))bosses++;
 // Clamp at the caps like the live legacy reward does, so a player who already
 // holds the maximum balance still receives the wave's XP instead of losing it.
 const armory=readArmory(profile.armory),scrap=Math.min(MAX_SCRAP,armory.scrap+bosses*BOSS_SCRAP),components=Math.min(MAX_COMPONENTS,profile.workshop.components+bosses*BOSS_COMPONENTS);
 if(!Number.isSafeInteger(scrap)||!Number.isSafeInteger(components))return null;
 return {profile:{...profile,armory:{...armory,scrap},workshop:{...profile.workshop,components}},receipt:previousMask|completedMask,bosses};
}
