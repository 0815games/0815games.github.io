// Server-side protocol core, independent of transport and Firebase. The adapter
// MUST authenticate the connection and pass its trusted player ID to these APIs.
// Neither clients nor this in-memory module can be considered authoritative.
import { applyCommand } from './match.mjs?v=20261101-wallet1';
import { stepMatch } from './simulation.mjs?v=20261101-coopxp1';
export const PROTOCOL_VERSION=1;
export const MAX_PENDING=128;
export const RECEIPT_HISTORY=128;
const clone=value=>JSON.parse(JSON.stringify(value));
const commandFields={startWave:[],airstrike:[],direction:['x','y'],move:['x','y'],build:['pad','towerType'],upgrade:['pad','branch','expectedTowerId','expectedLevel'],sell:['pad','expectedTowerId','expectedLevel']};
function normalizeCommand(command){
  if(!command||typeof command!=='object'||Array.isArray(command)||typeof command.type!=='string'||!Object.hasOwn(commandFields,command.type))return null;
  const fields=commandFields[command.type];
  if(Object.keys(command).some(key=>key!=='type'&&!fields.includes(key)))return null;
  const result={type:command.type};
  for(const key of fields){
    const value=command[key];
    if(value===undefined&&['branch','expectedTowerId','expectedLevel'].includes(key))continue;
    if(typeof value!=='number'||!Number.isFinite(value))return null;
    result[key]=value;
  }
  return result;
}
function makeHost(data){
  let {match,tick,players,queue}=data;
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
  function advance(){
    tick++;const commands=[];
    for(const item of queue){
      const result=applyCommand(match,item.playerId,item.command);
      const response={status:'applied',seq:item.seq,tick,result};
      const receipt=players[item.playerId].receipts.find(r=>r.seq===item.seq);
      receipt.response=clone(response);
      commands.push({...clone(item),result:clone(result)});
    }
    queue=[];
    const events=stepMatch(match);
    return clone({version:PROTOCOL_VERSION,tick,commands,events});
  }
  // Cancel unprocessed inputs and neutralize movement on transport disconnect.
  // The host must stop ticking until its disconnect policy permits resuming.
  function suspendPlayer(playerId){
    if(!Object.hasOwn(players,playerId))return false;
    const player=match.players[playerId];player.direction={x:0,y:0};player.target=null;
    const remaining=[];
    for(const item of queue){
      if(item.playerId!==playerId){remaining.push(item);continue;}
      const receipt=players[playerId].receipts.find(r=>r.seq===item.seq);
      receipt.response={status:'cancelled',seq:item.seq,reason:'disconnected'};
    }
    queue=remaining;return true;
  }
  // Player-hosted sessions can suspend an absent player's combat without
  // removing their identity, towers or reconnect receipts from the match.
  function setPlayerActive(playerId,active){
    if(!Object.hasOwn(players,playerId)||typeof active!=='boolean')return false;
    match.players[playerId].active=active;return true;
  }
  // This is a trusted server checkpoint, not a client-provided snapshot.
  function checkpoint(){return clone({version:PROTOCOL_VERSION,tick,match,players,queue});}
  // A reconnecting authenticated player receives a detached view and their own receipts.
  function snapshotFor(playerId){
    if(!Object.hasOwn(players,playerId))return null;
    const p=players[playerId];
    return clone({version:PROTOCOL_VERSION,tick,match,nextSeq:p.nextSeq,receipts:p.receipts.map(r=>r.response)});
  }
  return {receive,advance,checkpoint,snapshotFor,suspendPlayer,setPlayerActive};
}
export function createHost(initialMatch){
  const match=clone(initialMatch),ids=Object.keys(match.players||{});
  if(ids.length<1||ids.length>2)throw new Error('Match must contain one or two players');
  return makeHost({match,tick:0,players:Object.fromEntries(ids.map(id=>[id,{nextSeq:1,receipts:[]}])),queue:[]});
}
export function restoreHost(checkpoint){
  if(!checkpoint||checkpoint.version!==PROTOCOL_VERSION)throw new Error('Unsupported checkpoint version');
  const data=clone(checkpoint),ids=Object.keys(data.match?.players||{});
  if(!Number.isSafeInteger(data.tick)||data.tick<0||!data.players||!Array.isArray(data.queue)||data.queue.length>MAX_PENDING||ids.length<1||ids.length>2||Object.keys(data.players).length!==ids.length||ids.some(id=>!Object.hasOwn(data.players,id)||!Number.isSafeInteger(data.players[id].nextSeq)||data.players[id].nextSeq<1||!Array.isArray(data.players[id].receipts)))throw new Error('Invalid trusted checkpoint');
  // Storage is trusted; reject obviously inconsistent pending records rather than
  // accepting checkpoint data from an untrusted client as an authorization source.
  for(const item of data.queue){const p=data.players[item.playerId];if(!p||!normalizeCommand(item.command)||!p.receipts.some(r=>r.seq===item.seq&&r.response.status==='queued'))throw new Error('Invalid pending command');}
  return makeHost(data);
}
