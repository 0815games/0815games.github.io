// The training contract: the cohesive first-run operation a new soldier is sent on.
//
// Seven weakened waves on The Last Road with a reinforced bunker (150% HP) and
// a weakened Vanguard Boss on Wave 7 so a newcomer learns turret building,
// upgrading/selling, hero movement, Rank-3 tower specialization, aircraft defense
// (Wave 6), and boss combat (Wave 7) in one continuous match.
//
// Completing the operation awards FIRST_RUN_XP (450 XP — Rank 2 plus a head
// start toward Rank 3) and first equipment ONCE per character (enforced both
// locally and atomically inside players/$uid/tutorial on Firebase RTDB).
// Losing still guarantees FIRST_RUN_DEFEAT_XP (330 XP — Rank 2) once so the
// Equipment and 6-Class Skills lessons always have a point to spend.
import {waveXP} from './progression.mjs?v=20261105-prestige1';

export const TRAINING_WAVES=7;
export const FIRST_RUN_XP=450;
export const FIRST_RUN_DEFEAT_XP=330;
export const TRAINING_UNIT=.7;
export const TRAINING_BUNKER=1.5;
export const TRAINING_BOSS_UNIT=.6;
export const TRAINING_MISSION_ID='training-contract';
export const TRAINING_BOSS_EVERY=TRAINING_WAVES;
export const TRAINING_MAP='road';
// 180 supplies comfortably covers ANY base turret (up to 80) plus its Rank-2
// upgrade (70) and leaves headroom toward specialization / Flak coverage.
export const TRAINING_SUPPLIES=180;

export function trainingContract(){
  return Object.freeze({
    id:TRAINING_MISSION_ID,
    threat:'training',
    waves:TRAINING_WAVES,
    unit:TRAINING_UNIT,
    bunker:TRAINING_BUNKER,
    bossUnit:TRAINING_BOSS_UNIT,
    bossEvery:TRAINING_BOSS_EVERY,
  });
}

export function trainingUnitScale(boss=false){
  return Math.round((boss?TRAINING_UNIT*TRAINING_BOSS_UNIT:TRAINING_UNIT)*100)/100;
}

export function trainingWaveXP(){
  let total=0;
  for(let wave=1;wave<=TRAINING_WAVES;wave++)total+=waveXP(wave);
  return total;
}

export function trainingBonusXP(){
  return Math.max(0,FIRST_RUN_XP-trainingWaveXP());
}

export function trainingXP(){
  return trainingWaveXP()+trainingBonusXP();
}

export function trainingProgress(state){
  const wave=Number.isSafeInteger(state?.wave)?state.wave:0;
  return {wave:Math.min(Math.max(0,wave),TRAINING_WAVES),total:TRAINING_WAVES,remaining:Math.max(0,TRAINING_WAVES-wave)};
}

export function trainingWon(state){
  return !!state&&Number.isSafeInteger(state.completedWave)&&state.completedWave>=TRAINING_WAVES&&!state.running&&!state.ended;
}

export function trainingWaveRadioCue(wave){
  if(wave===1)return 'mission-welcome';
  if(wave===4)return 'mission-specialize';
  if(wave===6)return 'mission-air';
  if(wave===TRAINING_WAVES)return 'mission-boss';
  return null;
}

export function trainingStatus(state,tr=(text,values={})=>text.replace(/\{([A-Za-z]+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match)){
  const progress=trainingProgress(state);
  if(!state?.wave)return {label:tr('Training contract'),detail:tr('Deploy the first wave to begin. Seven waves, and the boss of wave seven ends it.'),progress:0,max:TRAINING_WAVES,marker:null,dialogue:''};
  return {
    label:tr('Wave {wave} of {total}',{wave:progress.wave,total:progress.total}),
    detail:tr('Clear {remaining} more wave(s). Enemies are weakened here and your bunker is reinforced.',{remaining:progress.remaining}),
    progress:progress.wave,max:progress.total,marker:null,dialogue:'',
  };
}

export const TRAINING_KEY='ironpath:training:v2';
const trainingMemory=new Set();
export function trainingSeen(id,storage){
  if(!id)return false;
  if(trainingMemory.has(id))return true;
  try{return storage?.getItem(`${TRAINING_KEY}:${id}`)==='done';}catch{return false;}
}
export function markTrainingSeen(id,storage){
  if(!id)return;
  trainingMemory.add(id);
  try{storage?.setItem(`${TRAINING_KEY}:${id}`,'done');}catch{}
}
export function forgetTrainingSeen(id,storage){
  if(!id)return false;
  trainingMemory.delete(id);
  try{storage?.removeItem?.(`${TRAINING_KEY}:${id}`);}catch{}
  return true;
}
