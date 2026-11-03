// Solo-only scripted objectives, separate from multiplayer combat. Story progress
// is client-reported and is not a trusted record of gameplay.
export function createStoryMission(mission){if(!mission||!Array.isArray(mission.stages)||!mission.stages.length)throw Error('Invalid story mission');return {mission,stage:0,elapsed:0,killBaseline:null,patrolHealth:100,assetHealth:100,timeRemaining:mission.timeLimit??null,finished:false,failureMessage:null};}
const aliveNear=(state,point,radius)=>state.enemies.some(e=>e.hp>0&&Math.hypot(e.x-point.x,e.y-point.y)<radius);
export function storyStatus(story,state){
 const stage=story.mission.stages[story.stage];if(state.ended&&!story.finished)return {label:'Mission failed',detail:'The bunker was lost.',progress:0,max:1,marker:null};if(story.finished)return {label:story.finished==='victory'?'Mission complete':'Mission failed',detail:story.finished==='victory'?story.mission.success:story.failureMessage,progress:1,max:1,marker:null};
 const waiting=!state.wave||!state.running,max=stage.type==='eliminate'?stage.count:stage.seconds,progress=stage.type==='eliminate'?Math.max(0,(state.lootKills||0)-(story.killBaseline??(state.lootKills||0))):story.elapsed,remaining=Math.max(0,Math.ceil(max-progress));
 const contested=stage.type==='secure'&&aliveNear(state,stage,110);
 let detail=!state.wave?'Deploy the first wave to begin the mission.':waiting?'Deploy the next wave to continue the objective.':stage.type==='defend'?`${remaining}s remaining. Protect the bunker.`:stage.type==='protect'?`${stage.asset} health: ${Math.ceil(story.assetHealth)}%. Protect it for ${remaining}s; nearby enemies damage it.`:stage.type==='escort'?`Escort the survivors to the marker. Health: ${Math.max(0,Math.ceil(story.patrolHealth))}%.`:stage.type==='eliminate'?`Defeat ${remaining} more enemy units to break the escort.`:stage.type==='secure'?contested?'Position contested! Eliminate nearby enemies to continue.':`Hold the marked position for ${stage.seconds}s. Nearby enemies contest it.`:`Move to the marked location and hold for ${stage.seconds}s.`;
 if(story.timeRemaining!==null)detail+=` Mission time: ${Math.ceil(Math.max(0,story.timeRemaining))}s (runs during waves).`;
 return {label:stage.label,detail,dialogue:stage.dialogue,progress:Math.min(max,progress),max,marker:['defend','eliminate'].includes(stage.type)?null:{x:stage.x,y:stage.y,type:stage.type},waiting};
}
function fail(story,state,message){story.finished='failure';story.failureMessage=message;state.ended=true;state.running=false;state.endReason='story-failure';return {type:'failure',message};}
export function stepStory(story,state,dt){
 if(story.finished||state.ended||!Number.isFinite(dt)||dt<=0)return null;
 const stage=story.mission.stages[story.stage],player=state.players.local;if(!player)return null;
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
 story.elapsed=0;story.stage++;story.assetHealth=100;story.killBaseline=story.mission.stages[story.stage]?.type==='eliminate'?(state.lootKills||0):null;
 if(story.stage>=story.mission.stages.length){story.finished='victory';state.ended=true;state.running=false;state.endReason='campaign-victory';state.pendingPerk=0;return {type:'victory',message:story.mission.success};}
 return {type:'stage',message:story.mission.stages[story.stage].dialogue};
}
