// Experimental transport and Admin adapter. Not mounted in the public server.
// TLS, edge rate limiting, durable match locks and complete operations remain required.
import http from 'node:http';
import {createProgressionService} from './progression-service.mjs';

export function createAdminProgressionService({auth,db,isUnlocked}) {
 if(typeof auth?.verifyIdToken!=='function'||typeof db?.ref!=='function'||typeof isUnlocked!=='function')throw Error('Admin auth, database and durable fencing required');
 return createProgressionService({
  verifyToken:token=>auth.verifyIdToken(token,true),
  transact:async(uid,update)=>{
   const ref=db.ref(`players/${uid}`);
   // Keep the initial server snapshot cached through the transaction: RTDB
   // may otherwise invoke an update with null before existing data is loaded.
   let listener;
   try{
    await new Promise((resolve,reject)=>{listener=ref.on('value',()=>resolve(),reject);});
    return await ref.transaction(update,undefined,false);
   }finally{if(listener)ref.off('value',listener);}
  },
  isUnlocked
 });
}

export function createProgressionHttpServer({service,allowedOrigins}={}) {
 if(typeof service?.execute!=='function'||!Array.isArray(allowedOrigins)||!allowedOrigins.length)throw Error('Invalid service configuration');
 for(const origin of allowedOrigins){let url;try{url=new URL(origin);}catch{throw Error('Invalid origin');}if(url.origin!==origin||!['http:','https:'].includes(url.protocol))throw Error('Invalid origin');}
 const origins=new Set(allowedOrigins);
 function respond(res,status,body,origin){if(res.destroyed||res.writableEnded)return;const headers={'cache-control':'no-store','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff','vary':'Origin'};if(origins.has(origin))headers['access-control-allow-origin']=origin;res.writeHead(status,headers);res.end(JSON.stringify(body));}
 const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin;
  if(!origins.has(origin)){req.resume();return respond(res,403,{status:'origin-denied'},origin);}
  if(req.url!=='/progression'){req.resume();return respond(res,404,{status:'not-found'},origin);}
  if(req.method==='OPTIONS'){
   if(req.headers['access-control-request-method']!=='POST')return respond(res,405,{status:'method-not-allowed'},origin);
   res.writeHead(204,{'access-control-allow-origin':origin,'access-control-allow-methods':'POST','access-control-allow-headers':'Authorization, Content-Type','access-control-max-age':'600','cache-control':'no-store','vary':'Origin'});return res.end();
  }
  if(req.method!=='POST'){req.resume();return respond(res,405,{status:'method-not-allowed'},origin);}
  const authorization=req.headers.authorization;
  if(typeof authorization!=='string'||!/^Bearer [^\s]{1,8192}$/.test(authorization)){req.resume();return respond(res,401,{status:'unauthorized'},origin);}
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')){req.resume();return respond(res,415,{status:'invalid-content-type'},origin);}
  let size=0,chunks=[],tooLarge=false;
  req.on('data',chunk=>{size+=chunk.length;if(size>4096){tooLarge=true;chunks=[];}else if(!tooLarge)chunks.push(chunk);});
  req.on('error',()=>respond(res,400,{status:'invalid'},origin));
  req.on('aborted',()=>respond(res,400,{status:'invalid'},origin));
  req.on('end',async()=>{
   if(tooLarge)return respond(res,413,{status:'body-too-large'},origin);
   let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return respond(res,400,{status:'invalid'},origin);}
   if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==2||!Object.hasOwn(body,'requestId')||!Object.hasOwn(body,'command'))return respond(res,400,{status:'invalid'},origin);
   try{const result=await service.execute({token:authorization.slice(7),requestId:body.requestId,command:body.command});const status=({applied:200,'already-applied':200,invalid:400,unauthorized:401,rejected:409,'request-conflict':409,unavailable:503})[result?.status]??500;respond(res,status,result,origin);}catch{respond(res,503,{status:'unavailable'},origin);}
  });
 });
 server.requestTimeout=15000;server.headersTimeout=10000;
 return server;
}
