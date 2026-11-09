// Solo-only scripted objectives, separate from multiplayer combat. Story progress
// is client-reported and is not a trusted record of gameplay.
import {MISSION_DECISIONS,MISSION_EVENTS} from './story-events.mjs?v=20261111-events1';
export function createStoryMission(mission){if(!mission||!Array.isArray(mission.stages)||!mission.stages.length)throw Error('Invalid story mission');return {mission,stage:0,elapsed:0,killBaseline:null,patrolHealth:100,assetHealth:100,timeRemaining:mission.timeLimit??null,finished:false,failureMessage:null,
  // Mission accompaniment (see story-events.mjs). The decision stays *pending*
  // until the player picks a choice - nothing blocks on it: the field keeps
  // running, the panel is non-modal, and an unanswered decision simply never
  // applies its effects.
  decisionDef:MISSION_DECISIONS[mission.id]||null,
  decision:MISSION_DECISIONS[mission.id]?{pending:true,choice:null}:null,
  choiceReinforce:null,
  sides:[],
  sideEvents:(MISSION_EVENTS[mission.id]||[]).filter(e=>e.kind==='side'),
  setpieces:(MISSION_EVENTS[mission.id]||[]).filter(e=>e.kind==='setpiece').map(e=>({def:e,fired:false})),
  reinforcements:(MISSION_EVENTS[mission.id]||[]).filter(e=>e.kind==='reinforce').map(e=>({def:e,fired:false})),
  stageEntered:-1,stageElapsed:0,lastStageStats:null,notifications:[]};}
const aliveNear=(state,point,radius)=>state.enemies.some(e=>e.hp>0&&Math.hypot(e.x-point.x,e.y-point.y)<radius);
function notify(story,entry){story.notifications.push(entry);}
function completeSide(story,state,side){if(side.done||side.failed)return;side.done=true;state.money=(state.money||0)+side.def.reward;notify(story,{type:'side',id:side.def.id,label:side.def.label,outcome:'complete',reward:side.def.reward});}
function missSide(story,_state,side){if(side.done||side.failed)return;side.failed=true;notify(story,{type:'side',id:side.def.id,label:side.def.label,outcome:'missed'});}
// Everything that happens when a stage becomes active: the decision offer,
// side-objective registration and evaluation, and stage statistics handover.
function enterStage(story,state){
  const index=story.stage;
  // Previous-stage statistics: captured by stepStory before the advance, they
  // settle 'time' and 'asset' sides that look back at the stage just finished.
  const stats=story.lastStageStats;
  if(stats)for(const side of story.sides){
    if(side.done||side.failed)continue;
    if(side.def.kind==='time'&&side.def.stage===stats.index)stats.duration<=side.def.seconds?completeSide(story,state,side):missSide(story,state,side);
    if(side.def.kind==='asset'&&side.def.stage===stats.index)(stats.asset>=side.def.threshold?completeSide:missSide)(story,state,side);
  }
  // A kills side that did not reach its count before its deadline stage began
  // has missed - the moment it was asking for is gone.
  for(const side of story.sides)if(!side.done&&!side.failed&&side.def.kind==='kills'&&Number.isInteger(side.def.until?.stage)&&index>side.def.until.stage)missSide(story,state,side);
  // Authored side events activate on their stage; choice sides registered when
  // the player decided. Both run on the same runtime objects from here on.
  for(const event of story.sideEvents)if(event.activate?.stage===index&&!story.sides.some(s=>s.def.id===event.side.id))story.sides.push({def:event.side,baseline:state.lootKills||0,done:false,failed:false});
  // The clock side asks about the moment of arrival: mission time still above
  // the threshold when its stage begins.
  for(const side of story.sides)if(!side.done&&!side.failed&&side.def.kind==='clock'&&side.def.stage===index)(story.timeRemaining!==null&&story.timeRemaining>=side.def.threshold?completeSide:missSide)(story,state,side);
  // The radio decision is offered once, when its stage activates.
  if(story.decisionDef&&story.decisionDef.at===index&&story.decision?.pending)notify(story,{type:'decision',id:story.mission.id,speaker:story.decisionDef.speaker,text:story.decisionDef.text,choices:story.decisionDef.choices});
}
// Applies a chosen decision. Returns the choice, or null when nothing was
// pending or the id is unknown (the panel stays up for a retry).
export function resolveStoryDecision(story,state,choiceId){
  if(!story?.decision?.pending||!story.decisionDef)return null;
  const choice=story.decisionDef.choices.find(c=>c.id===choiceId);
  if(!choice)return null;
  story.decision={pending:false,choice:choice.id};
  if(choice.supplies)state.money=(state.money||0)+choice.supplies;
  if(choice.reinforce)story.choiceReinforce={count:choice.reinforce,applied:false};
  if(choice.side)story.sides.push({def:choice.side,baseline:state.lootKills||0,done:false,failed:false});
  notify(story,{type:'decisionResolved',id:choice.id,confirm:choice.confirm,supplies:choice.supplies||0});
  return choice;
}
// game.js drains these after every step; the array empties on read.
export function drainStoryNotifications(story){const out=story.notifications||[];story.notifications=[];return out;}
export function storyStatus(story,state){
 const stage=story.mission.stages[story.stage];if(state.ended&&!story.finished)return {label:'Mission failed',detail:'The bunker was lost.',progress:0,max:1,marker:null};if(story.finished)return {label:story.finished==='victory'?'Mission complete':'Mission failed',detail:story.finished==='victory'?story.mission.success:story.failureMessage,progress:1,max:1,marker:null};
 const waiting=!state.wave||!state.running,max=stage.type==='eliminate'?stage.count:stage.seconds,progress=stage.type==='eliminate'?Math.max(0,(state.lootKills||0)-(story.killBaseline??(state.lootKills||0))):story.elapsed,remaining=Math.max(0,Math.ceil(max-progress));
 const contested=stage.type==='secure'&&aliveNear(state,stage,110);
 let detail=!state.wave?'Deploy the first wave to begin the mission.':waiting?'Deploy the next wave to continue the objective.':stage.type==='defend'?`${remaining}s remaining. Protect the bunker.`:stage.type==='protect'?`${stage.asset} health: ${Math.ceil(story.assetHealth)}%. Protect it for ${remaining}s; nearby enemies damage it.`:stage.type==='escort'?`Escort the survivors to the marker. Health: ${Math.max(0,Math.ceil(story.patrolHealth))}%.`:stage.type==='eliminate'?`Defeat ${remaining} more enemy units to break the escort.`:stage.type==='secure'?contested?'Position contested! Eliminate nearby enemies to continue.':`Hold the marked position for ${stage.seconds}s. Nearby enemies contest it.`:`Move to the marked location and hold for ${stage.seconds}s.`;
 if(story.timeRemaining!==null)detail+=` Mission time: ${Math.ceil(Math.max(0,story.timeRemaining))}s (runs during waves).`;
 // The first unfinished side objective is the one worth reading; finished
 // ones already had their radio moment.
 const side=story.sides.find(s=>!s.done&&!s.failed)||null;
 const bonus=side?{id:side.def.id,kind:side.def.kind,label:side.def.label,progress:side.def.kind==='kills'?Math.max(0,(state.lootKills||0)-side.baseline):side.def.kind==='asset'&&story.stage===side.def.stage?Math.ceil(story.assetHealth):0,max:side.def.kind==='kills'?side.def.count:side.def.kind==='asset'?100:null}:null;
 return {label:stage.label,detail,dialogue:stage.dialogue,progress:Math.min(max,progress),max,marker:['defend','eliminate'].includes(stage.type)?null:{x:stage.x,y:stage.y,type:stage.type},waiting,bonus};}
function fail(story,state,message){story.finished='failure';story.failureMessage=message;state.ended=true;state.running=false;state.endReason='story-failure';return {type:'failure',message};}
export function stepStory(story,state,dt){
 if(story.finished||state.ended||!Number.isFinite(dt)||dt<=0)return null;
 const stage=story.mission.stages[story.stage],player=state.players.local;if(!player)return null;
 // Stage bookkeeping runs before anything can return: the decision offer and
 // the side registrations must happen on the very first tick of a stage, even
 // before the first wave deploys.
 if(story.stageEntered!==story.stage){story.stageEntered=story.stage;story.stageElapsed=0;enterStage(story,state);}
 if(state.running)story.stageElapsed+=dt;
 // Set pieces: a scripted strike, fired once, its moment measured in running
 // time inside the stage (waves, not wall clock - same as the mission clock).
 for(const sp of story.setpieces)if(!sp.fired&&story.stage===sp.def.at&&story.stageElapsed>=sp.def.delay){
   sp.fired=true;let hits=0;
   for(const enemy of state.enemies)if(enemy.hp>0){enemy.hp-=sp.def.damage;hits++;}
   notify(story,{type:'setpiece',id:sp.def.id,speaker:sp.def.speaker,text:sp.def.text,damage:sp.def.damage,hits});
 }
 // Reinforcements join a running wave through the regular spawner, so they
 // arrive as real units of the current wave - not a synthetic burst.
 if(state.running){
   for(const r of story.reinforcements)if(!r.fired&&story.stage===r.def.at&&story.stageElapsed>=r.def.delay){r.fired=true;state.spawnLeft=(state.spawnLeft||0)+r.def.count;notify(story,{type:'reinforce',id:r.def.id,count:r.def.count,speaker:r.def.speaker,text:r.def.text});}
   if(story.choiceReinforce&&!story.choiceReinforce.applied){story.choiceReinforce.applied=true;state.spawnLeft=(state.spawnLeft||0)+story.choiceReinforce.count;notify(story,{type:'reinforce',id:'decision',count:story.choiceReinforce.count});}
 }
 // Kill-count sides resolve the moment their count is reached.
 for(const side of story.sides)if(!side.done&&!side.failed&&side.def.kind==='kills'&&(state.lootKills||0)-side.baseline>=side.def.count)completeSide(story,state,side);
 if(story.timeRemaining!==null&&state.running){story.timeRemaining=Math.max(0,story.timeRemaining-dt);if(story.timeRemaining<=0)return fail(story,state,'IVO: The authorization window closed. We lost the key.');}
 if(stage.type==='eliminate'){
  if(story.killBaseline===null)story.killBaseline=state.lootKills||0;
  if((state.lootKills||0)-story.killBaseline<stage.count)return null;
 }else{
  if(!state.running)return null;
  if(stage.type==='escort'){
   if(aliveNear(state,player,100))story.patrolHealth=Math.max(0,story.patrolHealth-12*dt);
   if(story.patrolHealth<=0)return fail(story,state,'SURVIVORS: We cannot make it. The rescue has failed.');
  }
  if(stage.type==='protect'&&aliveNear(state,stage,100)){story.assetHealth=Math.max(0,story.assetHealth-12*dt);if(story.assetHealth<=0)return fail(story,state,`${stage.asset} destroyed. The mission has failed.`);}
  const inPlace=stage.type==='defend'||stage.type==='protect'||Math.hypot(player.x-stage.x,player.y-stage.y)<=50;
  if(!inPlace)story.elapsed=0;else if(stage.type!=='secure'||!aliveNear(state,stage,110))story.elapsed+=dt;
  if(story.elapsed+1e-9<stage.seconds)return null;
 }
 // The stage is done. Its statistics settle the 'time' and 'asset' sides when
 // the next stage (or the debrief) enters.
 story.lastStageStats={index:story.stage,asset:story.assetHealth,duration:story.stageElapsed};
 story.elapsed=0;story.stage++;story.stageEntered=story.stage;story.stageElapsed=0;story.assetHealth=100;story.killBaseline=story.mission.stages[story.stage]?.type==='eliminate'?(state.lootKills||0):null;
 if(story.stage>=story.mission.stages.length){story.finished='victory';state.ended=true;state.running=false;state.endReason='campaign-victory';state.pendingPerk=0;
   // Whatever is still open missed its moment; the radio is done, so the
   // sides close silently instead of notifying into the debrief.
   for(const side of story.sides)if(!side.done)side.failed=true;
   enterStage(story,state);
   return {type:'victory',message:story.mission.success};}
 enterStage(story,state);
 return {type:'stage',message:story.mission.stages[story.stage].dialogue};
}
