// Total XP is never rewritten when balancing the curve. Level 1 -> 2 takes 300 XP;
// each following level requires 150 XP more than the previous one.
export function characterProgress(totalXP) {
  let level=1, spent=0, required=300;
  while(totalXP-spent>=required){spent+=required;level++;required+=150;}
  return {level, current:totalXP-spent, required};
}
export const MAX_TOWER_LEVEL=6;
// Indexed by current level. Level 2 -> 3 includes a permanent specialization.
export const UPGRADE_COSTS=[0,70,120,180,260,360];
export function upgradeCost(level){return level>=1&&level<MAX_TOWER_LEVEL?UPGRADE_COSTS[level]:null;}
export function waveXP(wave){return 20+wave*10;}
