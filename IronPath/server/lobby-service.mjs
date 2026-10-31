import http from 'node:http';
import { createLobbyRegistry } from './lobby.mjs';

// Experimental only: authentication and CORS do not replace edge-level abuse
// controls, shared storage, TLS termination, or a production security review.
export function createLobbyHttpService({verifyToken,allowedOrigins,registry=createLobbyRegistry(),now=Date.now,rateLimit=30,rateWindowMs=60_000,maxTrackedUsers=2000}={}) {
  if(typeof verifyToken!=='function'||!Array.isArray(allowedOrigins)||!allowedOrigins.length||typeof now!=='function'||!Number.isSafeInteger(rateLimit)||rateLimit<1||!Number.isSafeInteger(rateWindowMs)||rateWindowMs<1||!Number.isSafeInteger(maxTrackedUsers)||maxTrackedUsers<1)throw new Error('Invalid lobby service configuration');
  for(const origin of allowedOrigins){let url;try{url=new URL(origin);}catch{throw new Error('Invalid origin');}if(url.origin!==origin||!['https:','http:'].includes(url.protocol))throw new Error('Invalid origin');}
  const origins=new Set(allowedOrigins),rates=new Map();
  const routes=new Map([
    ['GET /lobby',uid=>registry.get(uid)],
    ['POST /lobby',uid=>registry.create(uid)],
    ['POST /lobby/invite',uid=>registry.invite(uid)],
    ['DELETE /lobby/invite',uid=>{registry.revokeInvite(uid);return {}; }],
    ['POST /lobby/join',(uid,body)=>registry.join(uid,body.secret)],
    ['DELETE /lobby',uid=>{registry.leave(uid);return {}; }]
  ]);
  const statuses={'invalid-identity':401,'not-in-lobby':404,'not-owner':403,'already-in-lobby':409,'invalid-invite':404,'lobby-full':409,'match-active':409,'capacity':503};
  function respond(res,status,value,origin){
    if(res.destroyed||res.writableEnded)return;
    const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','vary':'Origin'};
    if(origins.has(origin))headers['access-control-allow-origin']=origin;
    res.writeHead(status,headers);res.end(JSON.stringify(value));
  }
  function readBody(req){return new Promise((resolve,reject)=>{
    let size=0,chunks=[],failed=false;
    req.on('data',chunk=>{size+=chunk.length;if(size>1024){if(!failed){failed=true;reject('body-too-large');}chunks=[];return;}if(!failed)chunks.push(chunk);});
    req.on('end',()=>{if(failed)return;const text=Buffer.concat(chunks).toString('utf8');if(!text){resolve({});return;}try{const body=JSON.parse(text);if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();resolve(body);}catch{reject('invalid-body');}});
    req.on('error',()=>{if(!failed){failed=true;reject('invalid-body');}});
    req.on('aborted',()=>{if(!failed){failed=true;reject('invalid-body');}});
  });}
  function withinRate(uid){
    const time=now();for(const [key,value] of rates)if(time>=value.reset)rates.delete(key);
    let entry=rates.get(uid);if(!entry){if(rates.size>=maxTrackedUsers)return false;entry={count:0,reset:time+rateWindowMs};rates.set(uid,entry);}
    entry.count++;return entry.count<=rateLimit;
  }
  const server=http.createServer(async(req,res)=>{
    const origin=req.headers.origin;
    if(!origins.has(origin)){respond(res,403,{error:'origin-denied'},origin);req.resume();return;}
    if(req.method==='OPTIONS'){
      if(!['GET','POST','DELETE'].includes(req.headers['access-control-request-method'])||!routes.has(`${req.headers['access-control-request-method']} ${req.url}`)){respond(res,404,{error:'not-found'},origin);return;}
      res.writeHead(204,{'access-control-allow-origin':origin,'access-control-allow-methods':'GET, POST, DELETE','access-control-allow-headers':'Authorization, Content-Type','access-control-max-age':'600','cache-control':'no-store','vary':'Origin'});res.end();return;
    }
    const action=routes.get(`${req.method} ${req.url}`);if(!action){respond(res,404,{error:'not-found'},origin);req.resume();return;}
    const auth=req.headers.authorization;
    if(typeof auth!=='string'||!/^Bearer [^\s]{1,4096}$/.test(auth)){respond(res,401,{error:'unauthorized'},origin);req.resume();return;}
    let identity;try{identity=await verifyToken(auth.slice(7));}catch{respond(res,401,{error:'unauthorized'},origin);req.resume();return;}
    if(!identity||typeof identity.uid!=='string'||!identity.uid||identity.uid.length>128||!Number.isFinite(identity.exp)||identity.exp*1000<=now()){respond(res,401,{error:'unauthorized'},origin);req.resume();return;}
    if(!withinRate(identity.uid)){respond(res,429,{error:'rate-limited'},origin);req.resume();return;}
    let body;try{body=await readBody(req);}catch(error){respond(res,error==='body-too-large'?413:400,{error:error==='body-too-large'?'body-too-large':'invalid-body'},origin);return;}
    const allowed=req.method==='POST'&&req.url==='/lobby/join'?['secret']:[];
    if(Object.keys(body).some(key=>!allowed.includes(key))||(allowed.length&&typeof body.secret!=='string')){respond(res,400,{error:'invalid-body'},origin);return;}
    try{respond(res,200,action(identity.uid,body),origin);}catch(error){const status=statuses[error?.code];respond(res,status||500,{error:status?error.code:'internal-error'},origin);}
  });
  server.requestTimeout=15_000;server.headersTimeout=10_000;
  return server;
}
