import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createLobbyHttpService } from '../lobby-service.mjs';

async function setup(t,extra={}){
  const verifier=async token=>{if(token==='bad')throw Error('secret verifier details');if(token==='expired')return {uid:'alice',exp:1};return {uid:token,exp:Math.floor(Date.now()/1000)+300};};
  const server=createLobbyHttpService({allowedOrigins:['https://allowed.example'],verifyToken:verifier,...extra});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const url=`http://127.0.0.1:${server.address().port}`;
  async function call(path,{user='alice',method='GET',origin='https://allowed.example',body,headers={}}={}){
    const response=await fetch(url+path,{method,headers:{origin,...(user?{authorization:`Bearer ${user}`} : {}),...(body!==undefined?{'content-type':'application/json'}:{}),...headers},...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
    return {status:response.status,headers:response.headers,body:response.status===204?null:await response.json()};
  }
  return {call};
}

test('authenticated private invitations, membership and replay over HTTP',async t=>{
  const {call}=await setup(t);
  assert.equal((await call('/lobby',{method:'POST',user:'alice',body:{uid:'bob'}})).status,400);
  assert.equal((await call('/lobby',{method:'POST',user:'alice'})).body.ownerId,'alice');
  assert.equal((await call('/lobby',{user:'bob'})).status,404);
  const invitation=(await call('/lobby/invite',{method:'POST'})).body;
  assert.ok(invitation.secret);const view=(await call('/lobby')).body;assert.equal('secret' in view,false);
  const joins=await Promise.all(['bob','eve'].map(user=>call('/lobby/join',{user,method:'POST',body:{secret:invitation.secret}})));
  assert.deepEqual(joins.map(x=>x.status).sort(),[200,404]);
  const winner=joins.find(x=>x.status===200).body.players[1];
  assert.equal((await call('/lobby/invite',{method:'POST',user:winner})).status,403);
  assert.equal((await call('/lobby/join',{method:'POST',user:'mallory',body:{secret:invitation.secret}})).status,404);
  assert.equal((await call('/lobby',{method:'DELETE'})).status,200);
  assert.equal((await call('/lobby',{user:winner})).status,404);
  assert.equal((await call('/lobby/start',{method:'POST'})).status,404,'no match lifecycle endpoint before allocator exists');
});

test('origin, auth, privacy, parsing and preflight enforcement',async t=>{
  const {call}=await setup(t);
  assert.equal((await call('/lobby',{method:'POST',origin:'https://evil.example'})).status,403);
  assert.equal((await call('/lobby',{method:'POST',user:null})).status,401);
  for(const user of ['bad','expired']){const result=await call('/lobby',{method:'POST',user});assert.deepEqual(result.body,{error:'unauthorized'});assert.equal(result.status,401);}
  const pre=await call('/lobby/join',{method:'OPTIONS',headers:{'access-control-request-method':'POST','access-control-request-headers':'authorization,content-type'}});
  assert.equal(pre.status,204);assert.equal(pre.headers.get('access-control-allow-origin'),'https://allowed.example');
  assert.equal((await call('/lobby?secret=leak')).status,404);
  const response=await call('/lobby',{method:'POST',body:'{' });assert.equal(response.status,400);assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal((await call('/lobby',{method:'POST',body:'x'.repeat(1025)})).status,413);
  assert.equal((await call('/lobby/join',{method:'POST',body:{secret:42}})).status,400);
  assert.equal((await call('/lobby',{method:'POST'})).status,200);
});

test('per-identity rate limit and bounded tracking are enforced after verification',async t=>{
  let now=Date.now();const {call}=await setup(t,{rateLimit:2,rateWindowMs:1000,maxTrackedUsers:1,now:()=>now});
  assert.equal((await call('/lobby',{method:'POST'})).status,200);
  assert.equal((await call('/lobby')).status,200);
  assert.equal((await call('/lobby')).status,429);
  assert.equal((await call('/lobby',{user:'bob'})).status,429);
  now+=1000;assert.equal((await call('/lobby',{user:'bob'})).status,404);
});
