// Browser transport for the experimental single-match server. The game UI does
// not use this client yet. Tokens are sent only after a WebSocket opens, never in
// URLs. The server, not this client, owns match state and decides command results.
export const COOP_PROTOCOL_VERSION=1;
export function createCoopClient({url,getToken,WebSocketImpl=globalThis.WebSocket,onState=()=>{},onSnapshot=()=>{},onEvents=()=>{},onStatus=()=>{},retryMs=1000,maxRetries=5,commandTimeoutMs=15000}) {
  const endpoint=new URL(url,globalThis.location?.href);
  if(endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.pathname!=='/match'||!(endpoint.protocol==='wss:'||(endpoint.protocol==='ws:'&&['localhost','127.0.0.1','[::1]'].includes(endpoint.hostname))))throw new Error('Use a secure match WebSocket URL (ws only for localhost)');
  if(typeof getToken!=='function'||typeof WebSocketImpl!=='function')throw new Error('Token provider and WebSocket are required');
  let socket=null,stopped=true,generation=0,timer=null,retries=0,ready=false,snapshot=null,playerId=null,pending=null,nextSeq=null,connectionState='idle';
  function state(value){connectionState=value;onState(value);}
  function send(message){if(!socket||socket.readyState!==1)return false;socket.send(JSON.stringify(message));return true;}
  function finishPending(error,result){if(!pending)return;const p=pending;pending=null;clearTimeout(p.timer);if(error)p.reject(new Error(error));else p.resolve(result);}
  function reconcile(receipt){
    if(!pending||receipt.seq!==pending.seq)return;
    if(receipt.status==='queued'){pending.accepted=true;nextSeq=Math.max(nextSeq||1,pending.seq+1);return;}
    if(receipt.status==='applied'){nextSeq=Math.max(nextSeq||1,pending.seq+1);finishPending(null,receipt.result);return;}
    if(receipt.status==='cancelled'){nextSeq=Math.max(nextSeq||1,pending.seq+1);finishPending('Command cancelled on disconnect');return;}
    if(receipt.status==='rejected'){
      if(receipt.reason==='match-paused'){finishPending('Match paused; command not accepted');return;}
      finishPending(`Command rejected: ${receipt.reason}`);send({type:'snapshot'});
    }
  }
  function sendPendingIfReady(){if(ready&&pending&&!pending.accepted&&!pending.sent){pending.sent=send({type:'command',envelope:{version:COOP_PROTOCOL_VERSION,seq:pending.seq,command:pending.command}});}}
  function handle(message){
    if(!message||typeof message!=='object')return;
    if(message.type==='authenticated'){playerId=message.playerId;return;}
    if(message.type==='status'){ready=message.ready===true;onStatus(ready);if(ready){retries=0;state('ready');sendPendingIfReady();}else state('waiting');return;}
    if(message.type==='snapshot'){
      const s=message.snapshot;if(!s||s.version!==COOP_PROTOCOL_VERSION||!Number.isSafeInteger(s.nextSeq)||!Array.isArray(s.receipts)||!s.match||!playerId||!Object.hasOwn(s.match.players||{},playerId)){state('error');socket?.close(1008,'invalid snapshot');return;}
      snapshot=s;nextSeq=s.nextSeq;
      if(pending){const receipt=s.receipts.find(r=>r.seq===pending.seq);if(receipt)reconcile(receipt);else if(pending.seq<s.nextSeq)finishPending('Command outcome expired; resync required');else if(pending.seq>s.nextSeq)finishPending('Command sequence mismatch; resync required');else {pending.accepted=false;pending.sent=false;}}
      onSnapshot(s);sendPendingIfReady();return;
    }
    if(message.type==='receipt'){reconcile(message.receipt||{});return;}
    if(message.type==='events')onEvents(message.events||[],message.tick);
  }
  async function connect(){
    const current=++generation;if(stopped)return;state('connecting');
    try{
      const token=await getToken();if(stopped||current!==generation)return;
      if(typeof token!=='string'||!token)throw new Error('No authentication token');
      const ws=new WebSocketImpl(endpoint.href);socket=ws;
      ws.addEventListener('open',()=>{if(current!==generation)return;send({type:'auth',token});});
      ws.addEventListener('message',e=>{if(current!==generation)return;try{handle(JSON.parse(e.data));}catch{state('error');ws.close(1008,'invalid server message');}});
      ws.addEventListener('close',()=>{if(current!==generation)return;socket=null;ready=false;playerId=null;onStatus(false);if(pending)pending.sent=false;if(stopped)return;scheduleRetry();});
      ws.addEventListener('error',()=>{});
    }catch{if(!stopped&&current===generation)scheduleRetry();}
  }
  function scheduleRetry(){
    if(stopped)return;if(++retries>maxRetries){state('error');finishPending('Connection lost; reconnect manually');return;}
    state('reconnecting');timer=setTimeout(()=>{timer=null;connect();},retryMs);
  }
  function start(){if(!stopped)return;stopped=false;retries=0;connect();}
  function stop(){stopped=true;generation++;if(timer!==null)clearTimeout(timer);timer=null;ready=false;playerId=null;socket?.close();socket=null;finishPending('Connection closed');state('closed');}
  function command(command){
    if(!ready||!snapshot||!Number.isSafeInteger(nextSeq))return Promise.reject(new Error('Match is not ready'));
    if(pending)return Promise.reject(new Error('Wait for the previous command'));
    let copy;try{copy=JSON.parse(JSON.stringify(command));}catch{return Promise.reject(new Error('Invalid command'));}
    if(!copy||typeof copy!=='object'||Array.isArray(copy))return Promise.reject(new Error('Invalid command'));
    return new Promise((resolve,reject)=>{pending={seq:nextSeq,command:copy,resolve,reject,accepted:false,sent:false,timer:null};pending.timer=setTimeout(()=>{snapshot=null;finishPending('Command timed out; outcome unknown. Resync before sending another command');send({type:'snapshot'});},commandTimeoutMs);sendPendingIfReady();});
  }
  return {start,stop,command,getState:()=>connectionState,getSnapshot:()=>snapshot};
}
