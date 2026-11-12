// The training contract: the first-run operation a new soldier is sent on.
//
// It is a real solo run with real rewards, not a scripted mock. The contract is
// deliberately kinder than a story mission so that a player who has never built a
// tower before can finish it: five waves instead of an endless run, enemies at 70%
// health, a bunker with half again as much health, and a weakened wave-5 boss.
// **The boss of wave 5 ends the run**: nothing follows it, the debrief and the
// first-run screens take over.
//
// Waves 1-5 pay 250 XP on their own, which is short of level 2. The contract pays a
// mission bonus up to FIRST_RUN_XP (450) - level 2 plus a third of the way to level
// 3 - so the first skill point is guaranteed rather than inherited from the wave
// formula. The bonus is credited with the last wave and shown as its own line in the
// debrief, never as a silent round-up.
//
// Pure maths, no state or DOM: the deployment, the game loop and the tests all
// read the same numbers from here.
import {waveXP} from './progression.mjs';

export const TRAINING_WAVES=5;
// What the first run pays in total when the soldier wins. 300 is the level-2
// threshold; the contract pays 450 so the first skill point does not depend on the
// wave formula staying at 20+10n. Level 2, and a 150 XP head start on level 3.
export const FIRST_RUN_XP=450;
// What the first run pays when the soldier LOSES. The run is the tutorial, not an
// exam: a player who loses still walks away with enough XP to reach
// level 2 and spend the point, because the screens that follow teach equipment and
// skills and both need something to teach. Losing costs the surplus, not the lesson.
export const FIRST_RUN_DEFEAT_XP=330;
export const TRAINING_UNIT=.7;
export const TRAINING_BUNKER=1.5;
export const TRAINING_BOSS_UNIT=.6;
export const TRAINING_MISSION_ID='training-contract';
// The contract's own boss rhythm: the boss walks with the last wave and nothing
// follows it. Kept explicit rather than relying on the endless every-fifth-wave
// rhythm, so a change to the contract length cannot silently move the finale.
export const TRAINING_BOSS_EVERY=TRAINING_WAVES;
export const TRAINING_MAP='road';
// What the first run starts with. The coach gates its cards on the field now:
// build a tower, then upgrade THAT tower. The dearest tower in the sheet costs 80
// and the first upgrade costs 70, so the endless start of 125 only covered the
// cheapest tower - a new soldier who picked the Cannon sat on 45 supplies and the
// upgrade card would not let them past. 150 lets every tower in the sheet be built
// AND upgraded; the surplus after the cheapest path (MG: 30 left) is the same
// lesson in scarcity the card below teaches.
export const TRAINING_SUPPLIES=150;

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
    bossEvery:TRAINING_BOSS_EVERY,
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

// What the contract pays in total when won, and what that buys (level 2, one point).
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
// never had a point to spend. Raise the edition when the contract itself changes,
// and every existing account gets to play the new one.
//
// v2 is the six-wave contract with the coach cards on the field. Without this bump
// an existing account read `training:v1`, was told it had already done the
// contract, and was handed the old eleven-step modal tour instead - the exact
// screen this redesign exists to remove.
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
 try{storage?.setItem(`${TRAINING_KEY}:${id}`,'done');}catch{/* Continue in this session if storage is unavailable. */}
}
// Only the Settings replay calls this. Every automatic path reads `trainingSeen`, which
// is what keeps the contract from being offered twice on its own.
export function forgetTrainingSeen(id,storage){
 if(!id)return false;
 trainingMemory.delete(id);
 try{storage?.removeItem?.(`${TRAINING_KEY}:${id}`);}catch{/* the session copy is gone either way */}
 return true;
}
