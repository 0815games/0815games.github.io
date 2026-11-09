// Boss timing is part of the host's fixed-step simulation and snapshots.
export function bossPhase(enemy){
 const clock=Math.max(0,enemy?.bossClock||0);
 switch(enemy?.boss){
  case 'bossIronclad': return clock%16>=8&&clock%16<12?'shield':'normal';
  case 'bossBomber': return clock%12>=10?'bomb-warning':'normal';
  case 'bossJuggernaut': return clock%10>=8?'repair-warning':'normal';
  case 'bossCommander': return clock%16>=10&&clock%16<14?'rally':'normal';
  case 'bossRiegel': return clock%18>=12?'jam':'normal';
  case 'bossKolt': return clock%18>=12?'flood':'normal';
  case 'bossA7': {
   // Werk -> Torso -> Kern is a damage race, not a timer: the phase is read
   // straight off the boss health, so co-op snapshots and reconnects agree
   // without extra state.
   const hp=Math.max(0,enemy?.hp||0),max=Math.max(1,enemy?.maxHp||1);
   if(hp>max*2/3)return 'werk';
   if(hp>max/3)return 'torso';
   return 'kern';
  }
  default:return 'normal';
 }
}
export function bossWeaponFactor(enemy){const phase=bossPhase(enemy);return phase==='shield'?.6:phase==='jam'?.2:phase==='flood'?.5:phase==='werk'?.5:phase==='kern'?1.25:1;}
export function bossPhaseLabel(enemy){
 switch(bossPhase(enemy)){
  case 'shield':return 'SHIELD UP · weapon damage reduced';
  case 'bomb-warning':return 'BOMB RUN · bunker strike incoming!';
  case 'repair-warning':return 'REPAIR CYCLE · heal incoming!';
  case 'rally':return 'RALLY · nearby ground troops surge!';
  case 'jam':return 'JAM FIELD · ability recharge blocked';
  case 'flood':return 'FLOOD PULSE · every enemy surges, Kolt is shielded';
  case 'werk':return 'WORKS SHELL · weapon damage halved';
  case 'torso':return 'TORSO EXPOSED · full damage, A-7 accelerates';
  case 'kern':return 'CORE OPEN · bonus damage - strike now!';
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
 }else if(enemy.boss==='bossRiegel'){
  const t=clock%18;if(t>=10&&t<12){key='jam-warning';seconds=Math.ceil(12-t);message='JAM FIELD RISING';warning=true;}
  else if(phase==='jam'){key='jam';seconds=Math.ceil(18-t);message='JAM FIELD ACTIVE · ABILITY BLOCKED';}
 }else if(enemy.boss==='bossKolt'){
  const t=clock%18;if(t>=10&&t<12){key='flood-warning';seconds=Math.ceil(12-t);message='FLOOD PULSE IN';warning=true;}
  else if(phase==='flood'){key='flood';seconds=Math.ceil(18-t);message='FLOOD PULSE ACTIVE · KOLT SHIELDED';}
 }
 return key?{key,warning,seconds,text:`${message} · ${seconds}s`}:null;
}
