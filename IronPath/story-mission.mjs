// Solo-only scripted objectives. Runs alongside, never inside, the shared combat
// simulation; the server does not validate completion or rewards.
export function createStoryMission(mission){if(!mission||!Array.isArray(mission.stages)||!mission.stages.length)throw Error('Invalid story mission');return {mission,stage:0,elapsed:0,patrolHealth:100,finished:false};}
export function storyStatus(story,state){
 const stage=story.mission.stages[story.stage];if(state.ended&&!story.finished)return {label:'Mission failed',detail:'The bunker was lost.',progress:0,max:1,marker:null};if(story.finished)return {label:story.finished==='victory'?'Mission complete':'Mission failed',detail:story.finished==='victory'?story.mission.success:'The patrol was lost.',progress:1,max:1,marker:null};
 const waiting=!state.wave||!state.running;const remaining=Math.max(0,Math.ceil(stage.seconds-story.elapsed));
 const detail=!state.wave?'Deploy the first wave to begin the mission.':waiting?'Deploy the next wave to continue the objective.':stage.type==='defend'?`${remaining}s until detonation. Protect the bunker.`:stage.type==='escort'?`Escort the patrol to the marker. Patrol health: ${Math.max(0,Math.ceil(story.patrolHealth))}%.`: `Move to the marked location and hold for ${stage.seconds}s.`;
 return {label:stage.label,detail,dialogue:stage.dialogue,progress:Math.min(stage.seconds,story.elapsed),max:stage.seconds,marker:stage.type==='defend'?null:{x:stage.x,y:stage.y},waiting};
}
export function stepStory(story,state,dt){
 if(story.finished||state.ended||!state.running||!Number.isFinite(dt)||dt<=0)return null;
 const stage=story.mission.stages[story.stage],player=state.players.local;if(!player)return null;
 if(stage.type==='escort'){
  const nearby=state.enemies.some(e=>e.hp>0&&Math.hypot(e.x-player.x,e.y-player.y)<100);
  if(nearby)story.patrolHealth=Math.max(0,story.patrolHealth-12*dt);
  if(story.patrolHealth<=0){story.finished='failure';state.ended=true;state.running=false;state.endReason='story-failure';return {type:'failure',message:'PATROL: We cannot make it. The rescue has failed.'};}
 }
 const inPlace=stage.type==='defend'||Math.hypot(player.x-stage.x,player.y-stage.y)<=50;
 story.elapsed=inPlace?story.elapsed+dt:0;
 if(story.elapsed+1e-9<stage.seconds)return null;
 story.elapsed=0;story.stage++;
 if(story.stage>=story.mission.stages.length){story.finished='victory';state.ended=true;state.running=false;state.endReason='campaign-victory';state.pendingPerk=0;return {type:'victory',message:story.mission.success};}
 return {type:'stage',message:story.mission.stages[story.stage].dialogue};
}
