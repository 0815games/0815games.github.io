// Total XP is never rewritten when balancing the curve. Level 1 -> 2 takes 300 XP;
// each following level requires 150 XP more than the previous one.
export function characterProgress(totalXP) {
  let level=1, spent=0, required=300;
  while(totalXP-spent>=required){spent+=required;level++;required+=150;}
  return {level, current:totalXP-spent, required};
}
export const MAX_TOWER_LEVEL=6;
// Six displayed levels per prestige cycle. Internal levels keep increasing.
// Indexed by absolute current level. Level 2 -> 3 includes a permanent specialization.
export const UPGRADE_COSTS=[0,70,120,180,260,360];
export function towerDisplay(level){
  if(!Number.isSafeInteger(level)||level<1)throw new Error('Invalid tower level');
  return {level:(level-1)%MAX_TOWER_LEVEL+1,prestige:Math.floor((level-1)/MAX_TOWER_LEVEL)};
}
// Past the original cap, each upgrade costs 90 more than the previous one.
export function upgradeCost(level){
  if(!Number.isSafeInteger(level)||level<1)return null;
  const cost=level<MAX_TOWER_LEVEL?UPGRADE_COSTS[level]:450+90*(level-MAX_TOWER_LEVEL);
  return Number.isSafeInteger(cost)?cost:null;
}
export function towerUpgradeInvestment(level){
  if(!Number.isSafeInteger(level)||level<1)return null;
  const n=Math.max(0,level-MAX_TOWER_LEVEL);
  const total=UPGRADE_COSTS.slice(1,Math.min(level,MAX_TOWER_LEVEL)).reduce((a,b)=>a+b,0)+n*450+45*n*(n-1);
  return Number.isSafeInteger(total)?total:null;
}
export function waveXP(wave){return 20+Math.min(wave,100)*10;}
