import http from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { createHost } from '../protocol.mjs';
import { createMatch, STEP } from '../simulation.mjs';

// Experimental single-match process. No HTTP endpoint can provision a roster;
// the caller must construct players from trusted server-side configuration.
export function createMatchService({players,verifyToken,allowedOrigins}) {
  if(!Array.isArray(players)||players.length!==2||new Set(players.map(p=>p.id)).size!==2)throw new Error('Exactly two distinct players required');
  if(typeof verifyToken!=='function'||!Array.isArray(allowedOrigins)||!allowedOrigins.length||allowedOrigins.includes('*'))throw new Error('Verifier and explicit origin allowlist required');
  const host=createHost(createMatch(players)),roster=new Set(players.map(p=>p.id)),peers=new Map(),all=new Set();
  const server=http.createServer((req,res)=>{if(req.method==='GET'&&req.url==='/healthz'){res.writeHead(200,{'content-type':'text/plain'});res.end('ok');}else{res.writeHead(404);res.end();}});
  const wss=new WebSocketServer({noServer:true,maxPayload:8192,perMessageDeflate:false});
  const send=(ws,value)=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(value));};
  const ready=()=>peers.size===roster.size;
  function broadcastStatus(){for(const ws of peers.values())send(ws,{type:'status',ready:ready()});}
  function snapshotAll(){for(const [id,ws] of peers)send(ws,{type:'snapshot',snapshot:host.snapshotFor(id)});}
  server.on('upgrade',(req,socket,head)=>{
    if(req.url!=='/match'||!allowedOrigins.includes(req.headers.origin)||all.size>=16){socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');socket.destroy();return;}
    wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
  });
  wss.on('connection',ws=>{
    all.add(ws);let playerId=null,expiry=0,authenticating=false,rateStart=Date.now(),messages=0,alive=true;
    const authTimeout=setTimeout(()=>{if(!playerId)ws.close(1008,'authentication timeout');},5000);
    ws.on('pong',()=>{alive=true;});ws.on('error',()=>{});
    const heartbeat=setInterval(()=>{if(!alive||playerId&&Date.now()>=expiry){ws.terminate();return;}alive=false;ws.ping();},15000);
    ws.on('message',async(raw,isBinary)=>{
      if(isBinary){ws.close(1003,'text required');return;}
      const now=Date.now();if(now-rateStart>=1000){rateStart=now;messages=0;}if(++messages>30){ws.close(1008,'rate limit');return;}
      let msg;try{msg=JSON.parse(raw.toString());}catch{ws.close(1007,'invalid JSON');return;}
      if(!msg||typeof msg!=='object'||Array.isArray(msg)){ws.close(1008,'invalid message');return;}
      if(!playerId){
        if(authenticating||msg.type!=='auth'||typeof msg.token!=='string'||msg.token.length>4096){ws.close(1008,'authentication required');return;}
        authenticating=true;
        try{
          const identity=await verifyToken(msg.token);
          if(ws.readyState!==WebSocket.OPEN)return;
          if(!identity||typeof identity.uid!=='string'||!roster.has(identity.uid)||!Number.isFinite(identity.exp)||identity.exp*1000<=Date.now()||peers.has(identity.uid)){ws.close(1008,'not authorized');return;}
          playerId=identity.uid;expiry=identity.exp*1000;ws.expiresAt=expiry;peers.set(playerId,ws);clearTimeout(authTimeout);
          send(ws,{type:'authenticated',playerId});snapshotAll();broadcastStatus();
        }catch{if(ws.readyState===WebSocket.OPEN)ws.close(1008,'authentication failed');}
        return;
      }
      if(Date.now()>=expiry){ws.close(1008,'session expired');return;}
      if(msg.type==='command'){
        if(!ready()){send(ws,{type:'receipt',receipt:{status:'rejected',reason:'match-paused',seq:msg.envelope?.seq}});return;}
        send(ws,{type:'receipt',receipt:host.receive(playerId,msg.envelope)});
      }else if(msg.type==='snapshot'){send(ws,{type:'snapshot',snapshot:host.snapshotFor(playerId)});}
      else ws.close(1008,'unknown message');
    });
    ws.on('close',()=>{clearTimeout(authTimeout);clearInterval(heartbeat);all.delete(ws);if(playerId&&peers.get(playerId)===ws){peers.delete(playerId);host.suspendPlayer(playerId);broadcastStatus();snapshotAll();}});
  });
  const ticker=setInterval(()=>{
    if(!ready())return;
    for(const ws of peers.values()){if(Date.now()>=ws.expiresAt){ws.terminate();return;}}
    const result=host.advance();
    for(const item of result.commands){const ws=peers.get(item.playerId);if(ws)send(ws,{type:'receipt',receipt:{status:'applied',seq:item.seq,tick:result.tick,result:item.result}});}
    if(result.events.length)for(const ws of peers.values())send(ws,{type:'events',tick:result.tick,events:result.events});
    if(result.tick%6===0||result.events.length)snapshotAll();
  },STEP*1000);
  server.on('close',()=>{clearInterval(ticker);for(const ws of all)ws.terminate();wss.close();});
  server.shutdown=callback=>{clearInterval(ticker);for(const ws of all)ws.terminate();server.close(callback);};
  return server;
}
