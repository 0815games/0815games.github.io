import { strict as assert } from 'node:assert';
import { createCoopClient } from '../coop-client.mjs';
const sockets=[];
class Socket {
  constructor(url){this.url=url;this.readyState=0;this.handlers={};this.sent=[];sockets.push(this);}
  addEventListener(event,handler){this.handlers[event]=handler;}
  emit(event,data={}){this.handlers[event]?.(data);}
  open(){this.readyState=1;this.emit('open');}
  message(data){this.emit('message',{data:JSON.stringify(data)});}
  send(data){this.sent.push(JSON.parse(data));}
  close(){this.readyState=3;this.emit('close');}
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const snapshot=(nextSeq,receipts=[])=>({type:'snapshot',snapshot:{version:1,tick:0,nextSeq,receipts,match:{players:{alice:{}}}}});
const client=createCoopClient({url:'wss://match.example/match',getToken:async()=> 'token',WebSocketImpl:Socket,retryMs:1,maxRetries:3,commandTimeoutMs:100});
client.start();await sleep(0);let ws=sockets.at(-1);ws.open();assert.deepEqual(ws.sent[0],{type:'auth',token:'token'});
ws.message({type:'authenticated',playerId:'alice'});ws.message(snapshot(1));ws.message({type:'status',ready:true});
const pending=client.command({type:'build',pad:0,towerType:0});await assert.rejects(client.command({type:'airstrike'}),/previous/);
assert.equal(ws.sent.at(-1).envelope.seq,1);
ws.message({type:'receipt',receipt:{status:'queued',seq:1}});
ws.close();await sleep(5);ws=sockets.at(-1);ws.open();ws.message({type:'authenticated',playerId:'alice'});ws.message(snapshot(2,[{status:'cancelled',seq:1,reason:'disconnected'}]));
await assert.rejects(pending,/cancelled/);ws.message({type:'status',ready:true});
const next=client.command({type:'startWave'});assert.equal(ws.sent.at(-1).envelope.seq,2);
ws.message({type:'receipt',receipt:{status:'applied',seq:2,result:{ok:true}}});assert.deepEqual(await next,{ok:true});
// If the result is unknown when the timeout fires, do not resend it; require a snapshot.
const timeout=client.command({type:'airstrike'});await assert.rejects(timeout,/outcome unknown/);
assert.equal(ws.sent.at(-1).type,'snapshot');await assert.rejects(client.command({type:'startWave'}),/not ready/);
ws.message(snapshot(4,[{status:'applied',seq:3,result:{ok:false}}]));
const after=client.command({type:'direction',x:0,y:0});assert.equal(ws.sent.at(-1).envelope.seq,4);
ws.message({type:'receipt',receipt:{status:'applied',seq:4,result:{ok:true}}});await after;
client.stop();console.log('Co-op client reconnect and uncertain-result tests passed.');
