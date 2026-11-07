import {releaseBuildReservations} from './build-reservations.mjs?v=20261104-buildreservation1';
// Experimental, transport-independent four-player rules. Not wired to live
// Firebase: its current party and security rules only permit two players.
import {createMatch,stepMatch} from './simulation.mjs?v=20261108-balance2';
import {applyCommand} from './match.mjs?v=20261108-balance2';
export const FOUR_PLAYER_MAP='four-front';
function roster(players,hostId,count=[4]){
  if(!Array.isArray(players)||!count.includes(players.length)||new Set(players.map(p=>p?.id)).size!==players.length||!players.every(p=>typeof p?.id==='string'&&p.id.length>0)||!players.some(p=>p.id===hostId))throw new Error('Invalid roster: unique players including the host are required');
  return Object.fromEntries(players.map(p=>[p.id,{id:p.id,active:true}]));
}
export function createFourCoop(players,hostId){
  const members=roster(players,hostId,[3,4]),match=createMatch(players,FOUR_PLAYER_MAP);
  return {mode:'four-coop',hostId,members,match,pending:null,nextRequest:1};
}
export function createTwoVsTwo(players,hostId,teams){
  const members=roster(players,hostId),ids=Object.keys(members);
  if(!Array.isArray(teams)||teams.length!==2||teams.some(t=>!Array.isArray(t)||t.length!==2)||new Set(teams.flat()).size!==4||teams.flat().some(id=>!Object.hasOwn(members,id)))throw new Error('Two teams of two distinct roster players are required');
  const lanes=teams.map(team=>createMatch(team.map(id=>players.find(p=>p.id===id)),FOUR_PLAYER_MAP));
  return {mode:'two-vs-two',hostId,members,teams:teams.map(t=>[...t]),lanes,pending:null,nextRequest:1,ended:false,winnerTeam:null};
}
const teamOf=(s,id)=>s.teams.findIndex(team=>team.includes(id));
function allReady(s){return Object.values(s.members).every(p=>p.active);}
function lanes(s){return s.mode==='two-vs-two'?s.lanes:[s.match];}
function ended(s){return s.mode==='two-vs-two'?s.ended:s.match.ended;}
function stopPending(s){s.pending=null;}
function finishTeam(s,winner,reason){s.ended=true;s.winnerTeam=winner;s.endReason=reason;stopPending(s);for(const lane of s.lanes){lane.ended=true;lane.running=false;lane.endReason=reason;}}
// A competitive match pauses whenever any player is absent. Co-op pauses only
// for the host; disconnected guests stop acting/earning and may reconnect.
export function setFourPresence(s,id,active){
  if(!Object.hasOwn(s.members,id)||typeof active!=='boolean')return false;
  s.members[id].active=active;
  for(const lane of lanes(s)){const p=lane.players[id];if(p){p.active=active;if(!active){releaseBuildReservations(lane,id);p.direction={x:0,y:0};p.target=null;}}}
  if(!active)stopPending(s);
  if(!active&&id===s.hostId)for(const lane of lanes(s))for(const p of Object.values(lane.players)){p.direction={x:0,y:0};p.target=null;}
  return true;
}
export function fourReady(s){return !ended(s)&&s.members[s.hostId].active&&(s.mode!=='two-vs-two'||allReady(s));}
export function applyFourCommand(s,id,command){
  if(!Object.hasOwn(s.members,id)||!command||typeof command.type!=='string')return {ok:false,reason:'Invalid player or command.'};
  if(ended(s))return {ok:false,reason:'The operation is over.'};
  if(!s.members[id].active)return {ok:false,reason:'Player is offline.'};
  if(!fourReady(s))return {ok:false,reason:'The match is paused until players reconnect.'};
  const team=s.mode==='two-vs-two'?teamOf(s,id):0,lane=lanes(s)[team];
  switch(command.type){
    case 'leaveRun':
      if(id===s.hostId)return {ok:false,reason:'Host must end the operation.'};
      if(s.mode==='two-vs-two'){finishTeam(s,1-team,'forfeit');return {ok:true};}
      setFourPresence(s,id,false);return {ok:true};
    case 'endRun':
      if(id!==s.hostId)return {ok:false,reason:'Only the host can end the operation.'};
      if(s.mode==='two-vs-two')finishTeam(s,null,'retired');else{stopPending(s);lane.ended=true;lane.running=false;lane.endReason='retired';}
      return {ok:true};
    case 'startWave': {
      if(id!==s.hostId)return {ok:false,reason:'Only the host can request a wave.'};
      const fields=lanes(s);if(s.pending||fields.some(l=>l.running||l.pendingPerk||l.ended)||fields.some(l=>l.wave!==fields[0].wave))return {ok:false,reason:'All fields must be ready.'};
      const required=Object.keys(s.members).filter(key=>key!==id&&s.members[key].active);
      if(!required.length)return applyCommand(lane,id,{type:'startWave'});
      s.pending={id:s.nextRequest++,wave:fields[0].wave+1,required,approved:[]};return {ok:true,waitingForPlayers:true,requestId:s.pending.id};
    }
    case 'approveWave': {
      const request=s.pending;if(!request||command.requestId!==request.id||!request.required.includes(id)||request.approved.includes(id))return {ok:false,reason:'No wave approval is due.'};
      request.approved.push(id);if(request.approved.length<request.required.length)return {ok:true,waitingForPlayers:true};
      // No lane has hostId: the orchestrator alone owns wave coordination.
      for(const field of lanes(s)){const result=applyCommand(field,Object.keys(field.players)[0],{type:'startWave'});if(!result.ok)throw new Error('Wave synchronization failed');}
      stopPending(s);return {ok:true};
    }
    case 'declineWave':
      if(!s.pending||command.requestId!==s.pending.id||!s.pending.required.includes(id))return {ok:false,reason:'No wave approval is due.'};stopPending(s);return {ok:true};
    case 'cancelWave':
      if(id!==s.hostId||!s.pending||command.requestId!==s.pending.id)return {ok:false,reason:'No wave request to cancel.'};stopPending(s);return {ok:true};
    default:return applyCommand(lane,id,command);
  }
}
export function stepFour(s){
  if(!fourReady(s))return [];
  if(s.mode==='four-coop')return stepMatch(s.match);
  const events=[];for(let i=0;i<2;i++)for(const event of stepMatch(s.lanes[i]))events.push({...event,team:i});
  const dead=s.lanes.map(l=>l.ended);if(dead[0]||dead[1])finishTeam(s,dead[0]&&dead[1]?null:dead[0]?1:0,'defeat');
  return events;
}
