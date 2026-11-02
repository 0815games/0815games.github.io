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

// Presentation reads the same authoritative clock as the boss mechanics.
// Windups before shield/rally are informational; they do not alter timing.
export function bossTelegraph(enemy){
 if(!enemy?.boss)return null;
 const clock=Math.max(0,enemy.bossClock||0),phase=bossPhase(enemy);
 let key='',message='',seconds=0,warning=false;
 if(enemy.boss==='bossIronclad'){
  const t=clock%16;if(t>=6&&t<8){key='shield-warning';seconds=Math.ceil(8-t);message='SHIELD RAISING';warning=true;}
  else if(phase==='shield'){key='shield';seconds=Math.ceil(12-t);message='SHIELD UP · DAMAGE REDUCED';}
 }else if(enemy.boss==='bossBomber'&&phase==='bomb-warning'){key='bomb-warning';seconds=Math.ceil(12-clock%12);message='BOMB STRIKE IN';warning=true;}
 else if(enemy.boss==='bossJuggernaut'&&phase==='repair-warning'){key='repair-warning';seconds=Math.ceil(10-clock%10);message='REPAIR IN';warning=true;}
 else if(enemy.boss==='bossCommander'){
  const t=clock%16;if(t>=8&&t<10){key='rally-warning';seconds=Math.ceil(10-t);message='RALLY IN';warning=true;}
  else if(phase==='rally'){key='rally';seconds=Math.ceil(14-t);message='RALLY ACTIVE';}
 }
 return key?{key,warning,seconds,text:`${message} · ${seconds}s`}:null;
}
