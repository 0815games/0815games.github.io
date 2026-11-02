import {characterProgress,waveXP} from './progression.mjs?v=20261102-terrain4';
import {ITEMS,readArmory} from './armory.mjs?v=20261102-longterm1';
import {parseBuild,pointsLeft} from './skills.mjs?v=20261102-results1';
import {WAVE_COUNT} from './combat.mjs?v=20261102-battle2';

// This is presentation/telemetry, not a source of reward authorization.
export function rewardDelta(before,after){
  if(!before||!after)return null;
  const a=readArmory(before.armory),b=readArmory(after.armory);
  const from=characterProgress(before.xp||0).level,to=characterProgress(after.xp||0).level,unlocks=[];if(from<5&&to>=5)unlocks.push('Veteran Kit, Supply Relay and Emergency Bulwark');if(from<10&&to>=10)unlocks.push('Boss Hunter');
  return {xp:Math.max(0,(after.xp||0)-(before.xp||0)),scrap:Math.max(0,b.scrap-a.scrap),items:ITEMS.filter((_,i)=>(b.owned&(1<<i))&&!(a.owned&(1<<i))).map(i=>i.name),levels:Math.max(0,to-from),unlocks};
}
export function completedWaves(state,id){
  if(!state?.individualSupplies)return Array.from({length:Math.max(0,Math.min(state?.completedWave||0,10000))},(_,i)=>i+1);
  const p=state.players?.[id];if(!p)return [];
  const blocks={0:p.completedWaveMask||0,...p.completedWaveBlocks},waves=[];
  for(const [block,mask] of Object.entries(blocks))if(Number.isSafeInteger(+block)&&+block>=0&&Number.isInteger(mask))for(let bit=0;bit<WAVE_COUNT;bit++)if(mask&(1<<bit))waves.push(+block*WAVE_COUNT+bit+1);
  return waves.sort((a,b)=>a-b);
}
export function expectedXP(waves){return waves.reduce((sum,wave)=>sum+waveXP(wave),0);}
export function waveRewardSummary(state,id){if(state?.individualSupplies){const waves=completedWaves(state,id);return {count:waves.length,xp:expectedXP(waves)};}const count=Number.isSafeInteger(state?.completedWave)&&state.completedWave>0?state.completedWave:0,n=Math.min(count,100);return {count,xp:20*n+5*n*(n+1)+(count-n)*1020};}
export function nextSteps(profile){
  if(!profile)return 'Sign in to review progression.';
  const p=characterProgress(profile.xp||0),a=readArmory(profile.armory),next=ITEMS.find((item,i)=>!(a.owned&(1<<i)));
  const left=pointsLeft(parseBuild(profile.skills,p.level),p.level),options=[`Level ${p.level}: ${p.required-p.current} XP to the next skill point.${left?` ${left} skill point${left===1?'':'s'} available in Skills.`:''}`];
  if(next)options.push(`Next equipment: ${next.name} at wave ${next.wave}.`);
  const names={fortify:'Fortification',plating:'Plating',repair:'Repair Crew',gun:'Bunker Gun',supply:'Supply Relay',safeguard:'Emergency Bulwark'};const affordable=Object.keys(names).filter(k=>a[k]<3&&(p.level>=5||!['supply','safeguard'].includes(k))&&a.scrap>=(a[k]+1)*(['supply','safeguard'].includes(k)?50:30));
  options.push(affordable.length?`Armory upgrades affordable: ${affordable.map(k=>names[k]+' rank '+(a[k]+1)).join(', ')} (${a.scrap} scrap available).`:`Armory: ${a.scrap} scrap available; complete waves for more.`);
  return options.join(' ');
}
