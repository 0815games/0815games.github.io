import {releaseBuildReservations} from './build-reservations.mjs?v=20261104-buildreservation1';
// Transport-independent four-player rules, live through the Firebase party
// game: three- and four-player squads and 2v2 teams play on the squad fields.
import {createMatch,stepMatch} from './simulation.mjs?v=20261123-aim2';
import {applyCommand} from './match.mjs?v=20261123-aim2';
import {getMap} from './maps.mjs?v=20261123-aim2';
import {waveRosterPresent,waveFieldsReady,makeWaveRequest,replyToWaveRequest} from './wave-consensus.mjs?v=20261123-aim2';
export const FOUR_PLAYER_MAP='four-front';
// Squad fields mix the hand-built frontier with vetted generated retreat
// sectors: every entry carries two roads and enough pads for four wallets,
// and every entry is balanced by the headless harness (tests/balance-suite).
export const SQUAD_MAP_POOL=Object.freeze([FOUR_PLAYER_MAP,'g3-29e3779b1','g3-2f1bbcd88','g3-3cc623a9b']);
// The field is drawn from the party id, not the host's choice: host and every
// client compute the same map from the same party id, so the snapshot needs
// no extra wiring and a reloaded host restores the same field.
export function squadMapFor(partyId){
  if(typeof partyId!=='string'||!/^[a-f0-9]{32}$/.test(partyId))return FOUR_PLAYER_MAP;
  let h=2166136261;for(const ch of partyId)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;
  return SQUAD_MAP_POOL[h%SQUAD_MAP_POOL.length];
}
function pathLength(path){let l=0;for(let i=1;i<path.length;i++)l+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);return l;}
function pointAlong(path,t){let total=0;for(let i=1;i<path.length;i++)total+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);let left=total*t;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],seg=Math.hypot(b.x-a.x,b.y-a.y);if(left<=seg)return {x:a.x+(b.x-a.x)*(left/seg),y:a.y+(b.y-a.y)*(left/seg)};left-=seg;}return {...path[path.length-1]};}
// On a generated field nobody tuned fixed spawn coordinates: the squad starts
// spread across the roads (round-robin, two depths), like the harness anchors.
// The hand-built frontier keeps the positions the caller chose.
function anchorSquad(map,players){
  const roads=(map.paths||[map.path]).slice().sort((a,b)=>pathLength(b)-pathLength(a));
  players.forEach((player,i)=>{
    const road=roads[i%roads.length],depth=[.35,.6,.5][Math.min(2,Math.floor(i/roads.length))];
    const p=pointAlong(road,depth);
    player.x=p.x;player.y=p.y;player.target=null;player.direction={x:0,y:0};
  });
}
function squadField(players,mapId){
  const map=getMap(mapId);
  // Anchor before the match copies the players: createMatch stores copies of
  // the roster it receives, so the anchors must be on the objects it copies.
  if(!map.fourPlayer)anchorSquad(map,players);
  return createMatch(players,mapId);
}
function roster(players,hostId,count=[4]){
  if(!Array.isArray(players)||!count.includes(players.length)||new Set(players.map(p=>p?.id)).size!==players.length||!players.every(p=>typeof p?.id==='string'&&p.id.length>0)||!players.some(p=>p.id===hostId))throw new Error('Invalid roster: unique players including the host are required');
  return Object.fromEntries(players.map(p=>[p.id,{id:p.id,active:true}]));
}
export function createFourCoop(players,hostId,mapId=FOUR_PLAYER_MAP){
  const members=roster(players,hostId,[3,4]),match=squadField(players,mapId);
  return {mode:'four-coop',hostId,members,match,pending:null,nextRequest:1};
}
export function createTwoVsTwo(players,hostId,teams,mapId=FOUR_PLAYER_MAP){
  const members=roster(players,hostId),ids=Object.keys(members);
  if(!Array.isArray(teams)||teams.length!==2||teams.some(t=>!Array.isArray(t)||t.length!==2)||new Set(teams.flat()).size!==4||teams.flat().some(id=>!Object.hasOwn(members,id)))throw new Error('Two teams of two distinct roster players are required');
  const lanes=teams.map(team=>squadField(team.map(id=>players.find(p=>p.id===id)),mapId));
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
  if(active)delete s.members[id].departed;
  for(const lane of lanes(s)){const p=lane.players[id];if(p){p.active=active;if(active)delete p.departed;else{releaseBuildReservations(lane,id);p.direction={x:0,y:0};p.target=null;}}}
  if(!active)stopPending(s);
  if(!active&&id===s.hostId)for(const lane of lanes(s))for(const p of Object.values(lane.players)){p.direction={x:0,y:0};p.target=null;}
  return true;
}
export function fourReady(s){return !ended(s)&&s.members[s.hostId].active&&(s.mode!=='two-vs-two'||allReady(s));}
export function applyFourCommand(s,id,command){
  if(!Object.hasOwn(s.members,id)||!command||typeof command.type!=='string')return {ok:false,reason:'Invalid player or command.'};
  if(ended(s))return {ok:false,reason:'The operation is over.'};
  if(!s.members[id].active)return {ok:false,reason:'Player is offline.'};
  // The host may deliberately end a paused match, but may not advance or
  // manipulate the battlefield while any competitive player is absent.
  if(!fourReady(s)&&!(command.type==='endRun'&&id===s.hostId))return {ok:false,reason:'The match is paused until players reconnect.'};
  const team=s.mode==='two-vs-two'?teamOf(s,id):0,lane=lanes(s)[team];
  switch(command.type){
    case 'leaveRun':
      if(id===s.hostId)return {ok:false,reason:'Host must end the operation.'};
      if(s.mode==='two-vs-two'){
        s.members[id].departed=true;for(const l of lanes(s))if(l.players[id])l.players[id].departed=true;
        finishTeam(s,1-team,'forfeit');return {ok:true};
      }
      setFourPresence(s,id,false);s.members[id].departed=true;for(const l of lanes(s))if(l.players[id])l.players[id].departed=true;return {ok:true};
    case 'endRun':
      if(id!==s.hostId)return {ok:false,reason:'Only the host can end the operation.'};
      if(s.mode==='two-vs-two')finishTeam(s,null,'retired');else{stopPending(s);lane.ended=true;lane.running=false;lane.endReason='retired';}
      return {ok:true};
    case 'startWave': {
      const fields=lanes(s);
      if(s.pending)return {ok:false,reason:'A wave request is already pending.'};
      if(!waveRosterPresent(s.members))return {ok:false,reason:'All players must reconnect before requesting a wave.'};
      if(!waveFieldsReady(fields))return {ok:false,reason:'All fields must be ready for the next wave.'};
      if(!Number.isSafeInteger(s.nextRequest)||s.nextRequest<1||s.nextRequest>=Number.MAX_SAFE_INTEGER)return {ok:false,reason:'No new wave request ID is available.'};
      if(command.expectedRequestId!==undefined&&command.expectedRequestId!==s.nextRequest-1)return {ok:false,reason:'The request changed. Please try again.'};
      s.pending=makeWaveRequest(s.nextRequest++,fields[0].wave+1,id,s.members);
      return {ok:true,waitingForPlayers:true,requestId:s.pending.id};
    }
    case 'approveWave': case 'declineWave': case 'cancelWave': {
      const request=s.pending,fields=lanes(s);
      if(command.type==='approveWave'&&request&&(!waveRosterPresent(s.members)||!waveFieldsReady(fields,request.wave))){stopPending(s);return {ok:false,reason:'All fields and players must be ready for the next wave.'};}
      const reply=replyToWaveRequest(request,id,command);if(!reply.ok)return reply;
      if(reply.cancelled){stopPending(s);return {ok:true};}
      if(!reply.complete)return {ok:true,waitingForPlayers:true};
      // Validate ALL fields before mutating either: no lane can start on its own.
      // No lane has hostId: the orchestrator alone owns wave coordination.
      for(const field of fields){const result=applyCommand(field,Object.keys(field.players)[0],{type:'startWave'});if(!result.ok)throw new Error('Wave synchronization failed');}
      stopPending(s);return {ok:true};
    }
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
