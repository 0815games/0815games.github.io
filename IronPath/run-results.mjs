import {characterProgress,waveXP} from './progression.mjs?v=20261105-prestige1';
import {ITEMS,readArmory} from './armory.mjs?v=20261107-balance1';
import {parseBuild,pointsLeft} from './skills.mjs?v=20261107-balance1';
import {WAVE_COUNT} from './combat.mjs?v=20261217-stormgate';

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
export function nextSteps(profile,tr=(text,values={})=>text.replace(/\{([A-Za-z]+)\}/g,(m,k)=>Object.hasOwn(values,k)?String(values[k]):m)){
  if(!profile)return tr('Sign in to review progression.');
  const p=characterProgress(profile.xp||0),a=readArmory(profile.armory),next=ITEMS.find((item,i)=>!(a.owned&(1<<i)));
  const left=pointsLeft(parseBuild(profile.skills,p.level),p.level),options=[tr('Level {level}: {xp} XP to the next skill point.',{level:p.level,xp:p.required-p.current})+(left?tr(left===1?' {count} skill point available in Skills.':' {count} skill points available in Skills.',{count:left}):'')];
  if(next)options.push(tr('Next equipment: {name} at wave {wave}.',{name:tr(next.name),wave:next.wave}));
  const names={fortify:'Fortification',plating:'Plating',repair:'Repair Crew',gun:'Bunker Gun',supply:'Supply Relay',safeguard:'Emergency Bulwark'};const affordable=Object.keys(names).filter(k=>a[k]<3&&(p.level>=5||!['supply','safeguard'].includes(k))&&a.scrap>=(a[k]+1)*(['supply','safeguard'].includes(k)?50:30));
  options.push(affordable.length?tr('Armory upgrades affordable: {items} ({scrap} scrap available).',{items:affordable.map(k=>tr('{name} rank {rank}',{name:tr(names[k]),rank:a[k]+1})).join(', '),scrap:a.scrap}):tr('Armory: {scrap} scrap available; complete waves for more.',{scrap:a.scrap}));
  return options.join(' ');
}
