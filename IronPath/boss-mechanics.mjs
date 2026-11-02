// Boss timing is part of the host's fixed-step simulation and snapshots.
export function bossPhase(enemy){
 const clock=Math.max(0,enemy?.bossClock||0);
 switch(enemy?.boss){
  case 'bossIronclad': return clock%16>=8&&clock%16<12?'shield':'normal';
  case 'bossBomber': return clock%12>=10?'bomb-warning':'normal';
  case 'bossJuggernaut': return clock%10>=8?'repair-warning':'normal';
  case 'bossCommander': return clock%16>=10&&clock%16<14?'rally':'normal';
  default:return 'normal';
 }
}
export function bossWeaponFactor(enemy){return bossPhase(enemy)==='shield'?.6:1;}
export function bossPhaseLabel(enemy){
 switch(bossPhase(enemy)){
  case 'shield':return 'SHIELD UP · weapon damage reduced';
  case 'bomb-warning':return 'BOMB RUN · bunker strike incoming!';
  case 'repair-warning':return 'REPAIR CYCLE · heal incoming!';
  case 'rally':return 'RALLY · nearby ground troops surge!';
  default:return '';
 }
}
// True when a fixed step crosses a periodic ability boundary.
export function crossedCycle(before,after,period){return Math.floor(after/period)>Math.floor(before/period);}
