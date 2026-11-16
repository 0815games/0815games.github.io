// Convert the validated four-player protocol snapshot into the existing battle
// screen's per-player field, without changing the host-authoritative snapshot.
export function projectFourGameView(snapshot,uid){
  const game=snapshot?.match;if(!game||!['four-coop','two-vs-two'].includes(game.mode)||typeof uid!=='string'||!Object.hasOwn(game.members||{},uid))throw Error('Invalid four-player view');
  const team=game.mode==='two-vs-two'?game.teams?.findIndex(t=>Array.isArray(t)&&t.includes(uid)):0;
  const fields=game.mode==='two-vs-two'?game.lanes:[game.match],field=fields?.[team];
  if(team<0||!field||!Object.hasOwn(field.players||{},uid))throw Error('Missing player field');
  const request=game.pending,requester=request?.requester??game.hostId;
  const needsApproval=!!request&&Array.isArray(request.required)&&request.required.includes(uid)&&Array.isArray(request.approved)&&!request.approved.includes(uid);
  const other=game.mode==='two-vs-two'?fields[1-team]:null;
  const nameFor=id=>fields.map(item=>item.players?.[id]?.name).find(name=>typeof name==='string')||null;
  // The request can come from the opposing field in 2v2. Keep that field out of
  // the player's projected roster, but retain the sender's public display name.
  const waveRequesterName=request?nameFor(requester):null;
  const speedRequesterName=snapshot?.speedControl?.request?nameFor(snapshot.speedControl.request.requester):null;
  return {...snapshot,match:{...field,mode:game.mode,hostId:game.hostId,money:field.players[uid].money,pendingWave:request?.wave||0,waveRequestId:Number.isSafeInteger(game.nextRequest)?game.nextRequest-1:request?.id||0,
    waveRequest:request?{...request,requester,required:[...request.required],approved:[...request.approved]}:null,waveRequesterName,speedRequesterName,waveRosterReady:Object.values(game.members).every(member=>member.active!==false),
    fourInfo:{mode:game.mode,team,otherHealth:other?.hp??null,otherNotReady:!!(other&&(other.running||other.pendingPerk||other.pendingSector||other.ended)),waitingForOthers:!!request&&requester!==uid&&!needsApproval,approved:request?.approved?.length||0,required:request?.required?.length||0,winnerTeam:game.winnerTeam??null,ended:game.mode==='two-vs-two'?!!game.ended:!!field.ended}}};
}
