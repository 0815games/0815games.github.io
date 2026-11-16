// Host-side wave votes. The roster and field state come from the match, never
// from a client's command. A requester's own request is their readiness; every
// other roster member must explicitly approve that very request.
export function waveRosterPresent(roster){
  const players=Object.values(roster||{});
  return players.length>=2&&players.every(player=>player&&player.active!==false);
}
export function waveFieldsReady(fields,expectedWave=null){
  if(!Array.isArray(fields)||!fields.length)return false;
  const wave=fields[0]?.wave;
  return Number.isSafeInteger(wave)&&wave>=0&&wave<Number.MAX_SAFE_INTEGER-1&&
    (expectedWave===null||expectedWave===wave+1)&&fields.every(field=>field&&field.wave===wave&&!field.running&&!field.ended&&!field.pendingPerk&&!field.pendingSector&&!(field.spawnLeft>0)&&!(field.enemies||[]).some(enemy=>enemy.hp>0));
}
export function makeWaveRequest(id,wave,requester,roster){
  return {id,wave,requester,required:Object.keys(roster).filter(playerId=>playerId!==requester),approved:[]};
}
export function replyToWaveRequest(request,playerId,command){
  if(!request||!Array.isArray(request.required)||!Array.isArray(request.approved)||command.requestId!==request.id)return {ok:false,reason:'No matching wave request.'};
  if(command.type==='cancelWave')return request.requester===playerId?{ok:true,cancelled:true}:{ok:false,reason:'Only the requester can cancel.'};
  if(!request.required.includes(playerId))return {ok:false,reason:'No wave approval is due.'};
  if(command.type==='declineWave')return {ok:true,cancelled:true};
  if(command.type!=='approveWave'||request.approved.includes(playerId))return {ok:false,reason:'No wave approval is due.'};
  request.approved.push(playerId);
  return {ok:true,complete:request.approved.length===request.required.length};
}
