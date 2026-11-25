import {createMatch,stepMatch} from './simulation.mjs?v=20261125-aim13';
import {applyCommand} from './match.mjs?v=20261125-aim13';
import {WAVE_COUNT} from './combat.mjs?v=20261125-aim13';
import {bunkerStart} from './solo-deployment.mjs?v=20261125-aim13';
import {waveRosterPresent,waveFieldsReady,makeWaveRequest,replyToWaveRequest} from './wave-consensus.mjs?v=20261125-aim13';

// Two isolated, identically generated battlefields, advanced on the host's
// fixed clock. Only the authenticated player can command their own lane.
export function createVersus(players,mapId,hostId){
  if(players.length!==2||!players.some(p=>p.id===hostId))throw new Error('Versus requires two players');
  // Each lane is its own host: a versus field never falls back a sector, so
  // both duelists hold the same map for the whole match (the solo endless
  // retreat is gated on a field having no host of its own).
  // Both rivals begin at the same point relative to the actual map bunker.
  // An old fixed point could be far from a generated bunker's position.
  const spawn=bunkerStart(mapId);
  const lanes=Object.fromEntries(players.map(p=>{const lane=createMatch([{...p,...spawn,direction:{x:0,y:0},target:null}],mapId);lane.hostId=p.id;return [p.id,lane];}));
  return {mode:'versus',hostId,mapId,players:Object.fromEntries(players.map(p=>[p.id,{...p,active:true,completedWaveMask:0}])),lanes,pendingWave:0,waveRequestId:0,waveRequest:null,ended:false,winnerId:null};
}
function clearWaveRequest(s){s.pendingWave=0;s.waveRequest=null;}
function finish(s,winner,reason){s.ended=true;s.winnerId=winner;s.endReason=reason;clearWaveRequest(s);for(const lane of Object.values(s.lanes)){lane.ended=true;lane.running=false;lane.endReason=reason;}}
export function applyVersus(s,id,command){
  const player=s.players[id],lane=s.lanes[id],ids=Object.keys(s.players),other=ids.find(x=>x!==id);
  if(!player||!lane)return {ok:false,reason:'Unknown player.'};
  if(s.ended)return {ok:false,reason:'The match is over.'};
  if(player.active===false)return {ok:false,reason:'Player is offline.'};
  switch(command.type){
    case 'leaveRun': if(id===s.hostId)return {ok:false,reason:'Only the guest can leave individually.'};player.departed=true;if(lane.players[id])lane.players[id].departed=true;finish(s,other,'forfeit');return {ok:true};
    case 'endRun': if(id!==s.hostId)return {ok:false,reason:'Only the host can end the match.'};finish(s,null,'retired');return {ok:true};
    case 'startWave': {
      if(s.pendingWave||s.waveRequest)return {ok:false,reason:'A wave request is already pending.'};
      if(!waveRosterPresent(s.players))return {ok:false,reason:'All players must reconnect before requesting a wave.'};
      if(!waveFieldsReady(Object.values(s.lanes)))return {ok:false,reason:'All fields must be ready for the next wave.'};
      const previous=s.waveRequestId??0;
      if(!Number.isSafeInteger(previous)||previous<0||previous>=Number.MAX_SAFE_INTEGER)return {ok:false,reason:'No new wave request ID is available.'};
      if(command.expectedRequestId!==undefined&&command.expectedRequestId!==previous)return {ok:false,reason:'The request changed. Please try again.'};
      s.waveRequestId=previous+1;s.pendingWave=lane.wave+1;
      s.waveRequest=makeWaveRequest(s.waveRequestId,s.pendingWave,id,s.players);
      return {ok:true,waitingForGuest:true,requestId:s.waveRequestId};
    }
    case 'approveWave': case 'declineWave': case 'cancelWave': {
      const request=s.waveRequest;
      if(command.type==='approveWave'&&request&&(!waveRosterPresent(s.players)||!waveFieldsReady(Object.values(s.lanes),request.wave))){clearWaveRequest(s);return {ok:false,reason:'All fields and players must be ready for the next wave.'};}
      const reply=replyToWaveRequest(request,id,command);if(!reply.ok)return reply;
      if(reply.cancelled){clearWaveRequest(s);return {ok:true};}
      if(!reply.complete)return {ok:true,waitingForPlayers:true};
      for(const key of ids){const result=applyCommand(s.lanes[key],key,{type:'startWave'});if(!result.ok)throw new Error('Cannot synchronize versus waves');}
      clearWaveRequest(s);return {ok:true};
    }
    default:return applyCommand(lane,id,command);
  }
}
export function stepVersus(s){
  if(s.ended)return [];
  const events=[];for(const [id,lane] of Object.entries(s.lanes))for(const event of stepMatch(lane)){
    if(event.type==='waveCleared'){
      const p=s.players[id],block=Math.floor((event.wave-1)/WAVE_COUNT),bit=1<<((event.wave-1)%WAVE_COUNT);
      if(!block)p.completedWaveMask|=bit;else{const blocks=p.completedWaveBlocks||(p.completedWaveBlocks={});blocks[block]=(blocks[block]||0)|bit;}
    }
    events.push({...event,playerId:id});
  }
  const dead=Object.entries(s.lanes).filter(([,l])=>l.ended).map(([id])=>id);
  if(dead.length)finish(s,dead.length===2?null:Object.keys(s.players).find(id=>id!==dead[0]),'versus');
  return events;
}
export function versusView(s,id){
  const rivalId=Object.keys(s.players).find(key=>key!==id),lane=s.lanes[id],rival=s.lanes[rivalId];
  function viewFor(key,other){const own=s.lanes[key],players={};for(const uid of [key,other])players[uid]={...s.players[uid],...(uid===key?own.players[uid]:s.lanes[uid].players[uid]),money:s.lanes[uid].money,active:uid===key&&s.players[uid].active!==false,completedWaveMask:s.players[uid].completedWaveMask,...(s.players[uid].completedWaveBlocks?{completedWaveBlocks:s.players[uid].completedWaveBlocks}:{})};return {...own,individualSupplies:true,players,hostId:s.hostId,mode:'versus',pendingWave:s.pendingWave,waveRequestId:s.waveRequestId,waveRequest:s.waveRequest,waveRosterReady:waveRosterPresent(s.players),ended:s.ended,endReason:s.endReason,winnerId:s.winnerId};}
  return {...viewFor(id,rivalId),rival:viewFor(rivalId,id),rivalId,waitingForRival:!!(rival.running||rival.pendingPerk),memberStates:Object.fromEntries(Object.entries(s.players).map(([uid,player])=>[uid,{active:player?.active!==false,departed:player?.departed===true}]))};
}
