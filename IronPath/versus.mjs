import {createMatch,stepMatch} from './simulation.mjs?v=20261212-actiii3';
import {applyCommand} from './match.mjs?v=20261212-actiii3';
import {WAVE_COUNT} from './combat.mjs?v=20261212-actiii3';

// Two isolated, identically generated battlefields, advanced on the host's
// fixed clock. Only the authenticated player can command their own lane.
export function createVersus(players,mapId,hostId){
  if(players.length!==2||!players.some(p=>p.id===hostId))throw new Error('Versus requires two players');
  // Each lane is its own host: a versus field never falls back a sector, so
  // both duelists hold the same map for the whole match (the solo endless
  // retreat is gated on a field having no host of its own).
  const lanes=Object.fromEntries(players.map(p=>{const lane=createMatch([{...p,x:850,y:450,direction:{x:0,y:0},target:null}],mapId);lane.hostId=p.id;return [p.id,lane];}));
  return {mode:'versus',hostId,mapId,players:Object.fromEntries(players.map(p=>[p.id,{...p,active:true,completedWaveMask:0}])),lanes,pendingWave:0,waveRequestId:0,ended:false,winnerId:null};
}
function finish(s,winner,reason){s.ended=true;s.winnerId=winner;s.endReason=reason;s.pendingWave=0;for(const lane of Object.values(s.lanes)){lane.ended=true;lane.running=false;lane.endReason=reason;}}
export function applyVersus(s,id,command){
  const player=s.players[id],lane=s.lanes[id],ids=Object.keys(s.players),other=ids.find(x=>x!==id);
  if(!player||!lane)return {ok:false,reason:'Unknown player.'};
  if(s.ended)return {ok:false,reason:'The match is over.'};
  if(player.active===false)return {ok:false,reason:'Player is offline.'};
  switch(command.type){
    case 'leaveRun': if(id===s.hostId)return {ok:false,reason:'Only the guest can leave individually.'};finish(s,other,'forfeit');return {ok:true};
    case 'endRun': if(id!==s.hostId)return {ok:false,reason:'Only the host can end the match.'};finish(s,null,'retired');return {ok:true};
    case 'startWave':
      if(id!==s.hostId)return {ok:false,reason:'Only the host can request a wave.'};
      if(s.pendingWave)return {ok:false,reason:'Waiting for approval.'};
      if(Object.values(s.lanes).some(l=>l.running||l.pendingPerk)||s.lanes[ids[0]].wave!==s.lanes[ids[1]].wave)return {ok:false,reason:'Both players must finish the wave and choose upgrades first.'};
      s.pendingWave=lane.wave+1;s.waveRequestId++;return {ok:true,waitingForGuest:true};
    case 'approveWave':
      if(id===s.hostId||!s.pendingWave||command.requestId!==s.waveRequestId||Object.values(s.lanes).some(l=>l.running||l.pendingPerk))return {ok:false,reason:'No wave is waiting for approval.'};
      for(const key of ids){const result=applyCommand(s.lanes[key],key,{type:'startWave'});if(!result.ok)throw new Error('Cannot synchronize versus waves');}
      s.pendingWave=0;return {ok:true};
    case 'declineWave': case 'cancelWave':
      if(!s.pendingWave||command.requestId!==s.waveRequestId||(command.type==='declineWave')===(id===s.hostId))return {ok:false,reason:'No wave request to cancel.'};
      s.pendingWave=0;return {ok:true};
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
  function viewFor(key,other){const own=s.lanes[key],players={};for(const uid of [key,other])players[uid]={...s.players[uid],...(uid===key?own.players[uid]:s.lanes[uid].players[uid]),money:s.lanes[uid].money,active:uid===key&&s.players[uid].active!==false,completedWaveMask:s.players[uid].completedWaveMask,...(s.players[uid].completedWaveBlocks?{completedWaveBlocks:s.players[uid].completedWaveBlocks}:{})};return {...own,individualSupplies:true,players,hostId:s.hostId,mode:'versus',pendingWave:s.pendingWave,waveRequestId:s.waveRequestId,ended:s.ended,endReason:s.endReason,winnerId:s.winnerId};}
  return {...viewFor(id,rivalId),rival:viewFor(rivalId,id),rivalId,waitingForRival:!!(rival.running||rival.pendingPerk)};
}
