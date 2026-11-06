// The training contract: the first-run operation a new soldier is sent on.
//
// It is a real solo run with real rewards, not a scripted mock. The contract is
// deliberately kinder than a story mission so that a player who has never built
// a tower before can finish it: five waves instead of an endless run, enemies at
// 70% health, a bunker with half again as much health, and a weakened wave-5
// boss. **The boss of wave 5 ends the run**: that boss drops the soldier's dog
// tag, which is the first piece of kit they ever own.
//
// Waves 1-5 pay 250 XP on their own. The contract tops that up with a mission
// bonus to exactly FIRST_RUN_XP, so the first real skill point is never one
// balance change away. The bonus is credited with the last wave and shown as its
// own line in the debrief, never as a silent round-up.
//
// Pure maths, no state or DOM: the deployment, the game loop and the tests all
// read the same numbers from here.
import {waveXP} from './progression.mjs';

export const TRAINING_WAVES=5;
// What the first run must pay in total: exactly enough for level 2.
export const FIRST_RUN_XP=300;
export const TRAINING_UNIT=.7;
export const TRAINING_BUNKER=1.5;
export const TRAINING_BOSS_UNIT=.6;
export const TRAINING_MISSION_ID='training-contract';
export const TRAINING_MAP='road';

// The contract shape `createSoloDeployment` already understands, so the training
// run reuses the campaign deployment path instead of a parallel one.
export function trainingContract(){
  return Object.freeze({
    id:TRAINING_MISSION_ID,
    threat:'training',
    waves:TRAINING_WAVES,
    unit:TRAINING_UNIT,
    bunker:TRAINING_BUNKER,
    bossUnit:TRAINING_BOSS_UNIT,
  });
}

// Enemy health multiplier for a training wave. The boss is weakened further so
// the only boss in the run is a lesson, not a wall.
export function trainingUnitScale(boss=false){
  return Math.round((boss?TRAINING_UNIT*TRAINING_BOSS_UNIT:TRAINING_UNIT)*100)/100;
}

// XP paid by the waves alone, before the contract bonus.
export function trainingWaveXP(){
  let total=0;
  for(let wave=1;wave<=TRAINING_WAVES;wave++)total+=waveXP(wave);
  return total;
}

// The mission bonus that tops the five waves up to FIRST_RUN_XP. It is credited
// with the last wave, so the skill point lands the moment the boss falls.
export function trainingBonusXP(){
  return Math.max(0,FIRST_RUN_XP-trainingWaveXP());
}

// What the contract pays in total, and what that buys (level 2, one point).
export function trainingXP(){
  return trainingWaveXP()+trainingBonusXP();
}

// Wave the run is on, for the objective panel. Zero before the first deploy.
export function trainingProgress(state){
  const wave=Number.isSafeInteger(state?.wave)?state.wave:0;
  return {wave:Math.min(Math.max(0,wave),TRAINING_WAVES),total:TRAINING_WAVES,remaining:Math.max(0,TRAINING_WAVES-wave)};
}

// The boss of the last wave is dead and nothing else is left standing, so the
// operation is over. The boss must actually fall: `completedWave` is only set
// once a wave is cleared, and the wave does not clear while the boss is alive.
export function trainingWon(state){
  return !!state&&Number.isSafeInteger(state.completedWave)&&state.completedWave>=TRAINING_WAVES&&!state.running&&!state.ended;
}

// What the objective panel shows while the contract is running.
export function trainingStatus(state,tr=(text,values={})=>text.replace(/\{([A-Za-z]+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match)){
  const progress=trainingProgress(state);
  if(!state?.wave)return {label:tr('Training contract'),detail:tr('Deploy the first wave to begin. Five waves, and the boss of wave five ends it.'),progress:0,max:TRAINING_WAVES,marker:null,dialogue:''};
  return {
    label:tr('Wave {wave} of {total}',{wave:progress.wave,total:progress.total}),
    detail:tr('Clear {remaining} more wave(s). Enemies are weakened here and your bunker is reinforced.',{remaining:progress.remaining}),
    progress:progress.wave,max:progress.total,marker:null,dialogue:'',
  };
}

// The contract is offered once per account per browser, like the tutorial and the
// ending. The flag is local storage only: no server field, no rules change.
//
// The edition matters here more than anywhere else. This contract is where a new
// soldier earns the first real skill point, so an account that never played it has
// never had a point to spend. It is new content, not a re-offer: keep the edition
// and raise it only when the contract itself changes.
export const TRAINING_KEY='ironpath:training:v1';
const trainingMemory=new Set();
export function trainingSeen(id,storage){
 if(!id)return false;
 if(trainingMemory.has(id))return true;
 try{return storage?.getItem(`${TRAINING_KEY}:${id}`)==='done';}catch{return false;}
}
export function markTrainingSeen(id,storage){
 if(!id)return;
 trainingMemory.add(id);
 try{storage?.setItem(`${TRAINING_KEY}:${id}`,'done');}catch{/* Continue in this session if storage is unavailable. */}
}
