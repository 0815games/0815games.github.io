const HEAVY_ATTACKERS=new Set(['frost_guard','obsidian_guard']);

export function nextMonsterAction(monster){
 if(!HEAVY_ATTACKERS.has(monster.key)){
  return {kind:'attack',multiplier:1};
 }
 if(monster.heavyAttackPending===true){
  monster.heavyAttackPending=false;
  monster.heavyAttackCounter=0;
  return {kind:'heavy',multiplier:1.6};
 }
 const counter=Number.isSafeInteger(monster.heavyAttackCounter)
  ?Math.max(0,monster.heavyAttackCounter):0;
 monster.heavyAttackCounter=counter+1;
 if(monster.heavyAttackCounter>=2){
  monster.heavyAttackPending=true;
  return {kind:'charge',multiplier:0};
 }
 return {kind:'attack',multiplier:1};
}
