// Convert the validated four-player protocol snapshot into the existing battle
// screen's per-player field, without changing the host-authoritative snapshot.
export function projectFourGameView(snapshot,uid){
  const game=snapshot?.match;if(!game||!['four-coop','two-vs-two'].includes(game.mode)||typeof uid!=='string'||!Object.hasOwn(game.members||{},uid))throw Error('Invalid four-player view');
  const team=game.mode==='two-vs-two'?game.teams?.findIndex(t=>Array.isArray(t)&&t.includes(uid)):0;
  const fields=game.mode==='two-vs-two'?game.lanes:[game.match],field=fields?.[team];
  if(team<0||!field||!Object.hasOwn(field.players||{},uid))throw Error('Missing player field');
  const request=game.pending,host=game.hostId===uid,needsApproval=!!request&&Array.isArray(request.required)&&request.required.includes(uid)&&Array.isArray(request.approved)&&!request.approved.includes(uid);
  const pendingWave=request&&(host||needsApproval)?request.wave:0;
  const other=game.mode==='two-vs-two'?fields[1-team]:null;
  return {...snapshot,match:{...field,mode:game.mode,hostId:game.hostId,money:field.players[uid].money,pendingWave,waveRequestId:request?.id||0,
    fourInfo:{mode:game.mode,team,otherHealth:other?.hp??null,otherNotReady:!!(other&&(other.running||other.pendingPerk||other.ended)),waitingForOthers:!!request&&!host&&!needsApproval,approved:request?.approved?.length||0,required:request?.required?.length||0,winnerTeam:game.winnerTeam??null,ended:game.mode==='two-vs-two'?!!game.ended:!!field.ended}}};
}
