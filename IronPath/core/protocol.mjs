import {createSpeedControl} from './multiplayer-speed.mjs?v=20261124-aim8';
import {releaseBuildReservations} from './build-reservations.mjs?v=20261104-buildreservation1';
import {applyFourCommand,stepFour,setFourPresence} from './four-modes.mjs?v=20261124-aim8';
import {applyVersus,stepVersus,versusView} from './versus.mjs?v=20261124-aim8';
// Server-side protocol core, independent of transport and Firebase. The adapter
// MUST authenticate the connection and pass its trusted player ID to these APIs.
// Neither clients nor this in-memory module can be considered authoritative.
import { applyCommand } from './match.mjs?v=20261124-aim8';
import { stepMatch } from './simulation.mjs?v=20261124-aim8';
export const PROTOCOL_VERSION=1;
// Snapshots carry only the newest receipts. A client may have exactly ONE
// command in flight (it sends sequence nextSeq and stays locked until that
// receipt arrives), so the newest handful of receipts is strictly sufficient;
// the window merely covers view reordering. Views are written to the database
// up to 15 times per second per player, so every kilobyte here is bandwidth
// the players feel as lag (measured: a full 128-receipt history dominated the
// view at ~60% of its bytes).
export const SNAPSHOT_RECEIPTS=8;
export const MAX_PENDING=128;
export const RECEIPT_HISTORY=128;
const isFour=match=>match?.mode==='four-coop'||match?.mode==='two-vs-two';
const hasEnded=match=>(match?.mode==='four-coop'?match.match?.ended:match?.ended)===true;
const matchIds=match=>Object.keys((isFour(match)?match.members:match.players)||{});
const validCount=match=>isFour(match)?(match.mode==='four-coop'?[3,4].includes(matchIds(match).length):matchIds(match).length===4):matchIds(match).length>=1&&matchIds(match).length<=2;
const clone=value=>JSON.parse(JSON.stringify(value));
const speedCommands=new Set(['requestSpeed','approveSpeed','declineSpeed','cancelSpeed','slowSpeed']);
const waveCommands=new Set(['startWave','approveWave','declineWave','cancelWave']);
// Both kinds of vote depend on the same locked roster. A late speed request or
// slow-down can otherwise revive or cancel a vote after someone reconnects.
export const isRosterVoteCommand=type=>waveCommands.has(type)||speedCommands.has(type);
const commandFields={requestSpeed:['expectedRequestId'],approveSpeed:['requestId'],declineSpeed:['requestId'],cancelSpeed:['requestId'],slowSpeed:['expectedRequestId'],endRun:[],leaveRun:[],finishParty:[],acknowledgePartyEnd:['endTick'],startWave:['expectedRequestId'],approveWave:['requestId'],declineWave:['requestId'],cancelWave:['requestId'],choosePerk:['index'],airstrike:[],direction:['x','y'],move:['x','y'],reserveBuild:['pad'],releaseBuild:['pad'],build:['pad','towerType'],upgrade:['pad','branch','expectedTowerId','expectedLevel'],classUpgrade:['pad','expectedTowerId','expectedLevel'],sell:['pad','expectedTowerId','expectedLevel'],repairTower:['pad','expectedTowerId']};
export function normalizeCommand(command){
  if(!command||typeof command!=='object'||Array.isArray(command)||typeof command.type!=='string'||!Object.hasOwn(commandFields,command.type))return null;
  const fields=commandFields[command.type];
  if(Object.keys(command).some(key=>key!=='type'&&!fields.includes(key)))return null;
  const result={type:command.type};
  for(const key of fields){
    const value=command[key];
    if(value===undefined&&['branch','expectedTowerId','expectedLevel','expectedRequestId'].includes(key))continue;
    if(typeof value!=='number'||!Number.isFinite(value))return null;
    if(key==='expectedRequestId'&&(!Number.isSafeInteger(value)||value<0))return null;
    if(key==='endTick'&&(!Number.isSafeInteger(value)||value<1))return null;
    result[key]=value;
  }
  return result;
}
function makeHost(data){
  let {match,tick,players,queue,partyEnd=null}=data;const speedControl=createSpeedControl(match,data.speedControl);
  function receive(playerId,envelope){
    if(!Object.hasOwn(players,playerId))return {status:'rejected',reason:'unknown-player'};
    if(!envelope||envelope.version!==PROTOCOL_VERSION)return {status:'rejected',reason:'version'};
    if(!Number.isSafeInteger(envelope.seq)||envelope.seq<1)return {status:'rejected',reason:'sequence'};
    const command=normalizeCommand(envelope.command);
    if(!command)return {status:'rejected',reason:'malformed-command'};
    const p=players[playerId],signature=JSON.stringify(command),seq=envelope.seq;
    if(seq<p.nextSeq){
      const previous=p.receipts.find(r=>r.seq===seq);
      if(!previous)return {status:'rejected',reason:'receipt-expired',nextSeq:p.nextSeq};
      if(previous.signature!==signature)return {status:'rejected',reason:'sequence-conflict',nextSeq:p.nextSeq};
      return clone(previous.response);
    }
    if(seq>p.nextSeq)return {status:'rejected',reason:'out-of-order',nextSeq:p.nextSeq};
    if(queue.length>=MAX_PENDING)return {status:'rejected',reason:'queue-full',nextSeq:p.nextSeq};
    const response={status:'queued',seq};
    queue.push({playerId,seq,command});p.nextSeq++;
    p.receipts.push({seq,signature,response});
    // Retain pending commands even if a client fills its history before the next tick.
    while(p.receipts.length>RECEIPT_HISTORY){const i=p.receipts.findIndex(r=>r.response.status!=='queued');if(i<0)break;p.receipts.splice(i,1);}
    return clone(response);
  }
  function advance(onlyHostEnd=false){
    // When a competitive roster is incomplete, permit a host end request
    // without advancing combat or applying any queued gameplay command.
    const selected=onlyHostEnd?queue.filter(item=>item.playerId===match.hostId&&['endRun','finishParty'].includes(item.command.type)):queue;
    if(onlyHostEnd&&!selected.length)return null;
    tick++;const commands=[];
    for(const item of selected){
      let result;
      if(item.command.type==='finishParty'){
        // A naturally finished match is not an intent to delete the party.
        // Only its host can start the finalization after seeing the outcome.
        if(matchIds(match).length<2||item.playerId!==match.hostId||!hasEnded(match))result={ok:false,reason:'Only the host can finish an ended party.'};
        else{partyEnd??={tick,acknowledged:[]};result={ok:true};}
      }else if(item.command.type==='acknowledgePartyEnd'){
        // Identity is bound to the sender by the authenticated input path.
        // A matching final tick prevents an old acknowledgement from being
        // reused for a different terminal snapshot.
        if(!partyEnd||item.command.endTick!==partyEnd.tick||!hasEnded(match))result={ok:false,reason:'Party finalization changed.'};
        else{if(!partyEnd.acknowledged.includes(item.playerId))partyEnd.acknowledged.push(item.playerId);result={ok:true};}
      }else{
        result=speedCommands.has(item.command.type)?speedControl.command(item.playerId,item.command):isFour(match)?applyFourCommand(match,item.playerId,item.command):match.mode==='versus'?applyVersus(match,item.playerId,item.command):applyCommand(match,item.playerId,item.command);
        // A successful host end is intentional. Presence loss, forfeit and
        // normal defeat must not silently become permission to close.
        if(item.command.type==='endRun'&&result.ok&&item.playerId===match.hostId&&matchIds(match).length>1&&hasEnded(match))partyEnd??={tick,acknowledged:[]};
      }
      const response={status:'applied',seq:item.seq,tick,result};
      const receipt=players[item.playerId].receipts.find(r=>r.seq===item.seq);
      receipt.response=clone(response);
      commands.push({...clone(item),result:clone(result)});
    }
    queue=onlyHostEnd?queue.filter(item=>!selected.includes(item)):[];
    const events=onlyHostEnd?[]:isFour(match)?stepFour(match):match.mode==='versus'?stepVersus(match):stepMatch(match);
    speedControl.reconcile();return clone({version:PROTOCOL_VERSION,tick,commands,events});
  }
  // Cancel unprocessed inputs and neutralize movement on transport disconnect.
  // The host must stop ticking until its disconnect policy permits resuming.
  function suspendPlayer(playerId,reason='disconnected'){
    if(!Object.hasOwn(players,playerId))return false;
    const player=isFour(match)?(match.mode==='four-coop'?match.match.players[playerId]:match.lanes.find(lane=>Object.hasOwn(lane.players,playerId))?.players[playerId]):match.mode==='versus'?match.lanes[playerId].players[playerId]:match.players[playerId];if(!player)return false;player.direction={x:0,y:0};player.target=null;
    const remaining=[];
    for(const item of queue){
      if(item.playerId!==playerId){remaining.push(item);continue;}
      const receipt=players[playerId].receipts.find(r=>r.seq===item.seq);
      receipt.response={status:'cancelled',seq:item.seq,reason};
    }
    queue=remaining;return true;
  }
  // A roster change invalidates queued wave AND speed actions, not only the
  // currently displayed vote. A quick reconnect must not revive a request or
  // let an old slow-down cancel somebody's new vote.
  function suspendRosterVotes(playerId=null,seq=null){
    const remaining=[];
    for(const item of queue){
      if(!isRosterVoteCommand(item.command.type)||(playerId!==null&&(item.playerId!==playerId||item.seq!==seq))){remaining.push(item);continue;}
      const receipt=players[item.playerId].receipts.find(r=>r.seq===item.seq);
      receipt.response={status:'cancelled',seq:item.seq,reason:'roster-changed'};
    }
    queue=remaining;
  }
  // Player-hosted sessions can suspend an absent player's combat without
  // removing their identity, towers or reconnect receipts from the match.
  function setPlayerActive(playerId,active){
    if(!Object.hasOwn(players,playerId)||typeof active!=='boolean')return false;
    if(!active)speedControl.reset();
    if(isFour(match))return setFourPresence(match,playerId,active);if(!active)releaseBuildReservations(match.mode==='versus'?match.lanes[playerId]:match,playerId);match.players[playerId].active=active;if(active)delete match.players[playerId].departed;if(!active){match.pendingWave=0;match.waveRequest=null;}return true;
  }
  // This is a trusted server checkpoint, not a client-provided snapshot.
  function checkpoint(){return clone({version:PROTOCOL_VERSION,tick,match,players,queue,speedControl:speedControl.checkpoint(),...(partyEnd?{partyEnd}:{})});}
  // Strip redundant web bit-arrays and migration flags from wire snapshots while
  // keeping all fields read by client UI, coop motion, and class upgrades.
  function compactSkills(s){
    if(!s||typeof s!=='object')return s;
    const out={active:s.active??null,variant:s.variant||0,classId:s.classId??null,rank:s.rank||0};
    if(s.classId&&s[s.classId])out[s.classId]=s[s.classId];
    if(s.recon&&out.recon===undefined)out.recon=s.recon;
    if(Array.isArray(s.extra)&&s.extra.some(Boolean))out.extra=s.extra;
    return out;
  }
  function compactViewMatch(m){
    if(!m||typeof m!=='object')return m;
    const stripPlayers=players=>{if(!players||typeof players!=='object')return;for(const pl of Object.values(players))if(pl?.skills)pl.skills=compactSkills(pl.skills);};
    stripPlayers(m.players);
    if(m.match)stripPlayers(m.match.players);
    if(Array.isArray(m.lanes))for(const lane of m.lanes)stripPlayers(lane?.players);
    else if(m.lanes&&typeof m.lanes==='object')for(const lane of Object.values(m.lanes))stripPlayers(lane?.players);
    return m;
  }
  // A reconnecting authenticated player receives a detached view and their own receipts.
  function snapshotFor(playerId){
    if(!Object.hasOwn(players,playerId))return null;
    const p=players[playerId];
    const view=clone({version:PROTOCOL_VERSION,tick,speedControl:speedControl.snapshot(),match:match.mode==='versus'?versusView(match,playerId):match,nextSeq:p.nextSeq,receipts:p.receipts.slice(-SNAPSHOT_RECEIPTS).map(r=>r.response),...(partyEnd?{partyEnd}:{})});
    compactViewMatch(view.match);
    return view;
  }
  return {receive,advance:()=>advance(),advanceHostEnd:()=>advance(true),hasEnded:()=>hasEnded(match),checkpoint,snapshotFor,suspendPlayer,suspendRosterVotes,setPlayerActive,speed:()=>speedControl.snapshot().speed};
}
export function createHost(initialMatch){
  const match=clone(initialMatch),ids=matchIds(match);
  if(!validCount(match))throw new Error('Match must contain one or two players');
  return makeHost({match,tick:0,players:Object.fromEntries(ids.map(id=>[id,{nextSeq:1,receipts:[]}])),queue:[]});
}
export function restoreHost(checkpoint){
  if(!checkpoint||checkpoint.version!==PROTOCOL_VERSION)throw new Error('Unsupported checkpoint version');
  const data=clone(checkpoint),ids=matchIds(data.match);
  if(!Number.isSafeInteger(data.tick)||data.tick<0||!data.players||!Array.isArray(data.queue)||data.queue.length>MAX_PENDING||!validCount(data.match)||Object.keys(data.players).length!==ids.length||ids.some(id=>!Object.hasOwn(data.players,id)||!Number.isSafeInteger(data.players[id].nextSeq)||data.players[id].nextSeq<1||!Array.isArray(data.players[id].receipts)))throw new Error('Invalid trusted checkpoint');
  if(data.partyEnd!==undefined&&(!data.partyEnd||!Number.isSafeInteger(data.partyEnd.tick)||data.partyEnd.tick<1||data.partyEnd.tick>data.tick||!Array.isArray(data.partyEnd.acknowledged)||new Set(data.partyEnd.acknowledged).size!==data.partyEnd.acknowledged.length||data.partyEnd.acknowledged.some(id=>!ids.includes(id))||!ids.includes(data.match.hostId)||!hasEnded(data.match)))throw new Error('Invalid party finalization checkpoint');
  // Storage is trusted; reject obviously inconsistent pending records rather than
  // accepting checkpoint data from an untrusted client as an authorization source.
  for(const item of data.queue){const p=data.players[item.playerId];if(!p||!normalizeCommand(item.command)||!p.receipts.some(r=>r.seq===item.seq&&r.response.status==='queued'))throw new Error('Invalid pending command');}
  return makeHost(data);
}
