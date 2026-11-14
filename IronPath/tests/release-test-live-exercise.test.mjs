import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {exerciseIsolatedGuard} from '../release-tools/exercise-isolated-guard.mjs';
import {buildRulesCandidate} from '../release-tools/rules-candidate.mjs';
import {isAuthAfterCutoff} from '../release-tools/release-control.mjs';

const previousBuild=`test-${'a'.repeat(40)}`,nextBuild=`test-${'b'.repeat(40)}`;
const initialEpoch='c'.repeat(32),accessToken='synthetic-access-token-never-real';
const source=JSON.parse(await readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url),'utf8'));
const rules=buildRulesCandidate(source).candidate;
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const decode=value=>JSON.parse(Buffer.from(value,'base64url').toString('utf8'));
const fakeJwt=value=>`${encode({alg:'none'})}.${encode(value)}.test`;
const fromJwt=value=>decode(value.split('.')[1]);
const allowedOrigin='https://ironpath-release.vercel.app';

function fixture({failProfile=false,conflictOnFirstTransition=false,changedRules=false}={}){
 let now=1800000001000,version=1,user=null,profile=null,createdUid=null;
 let control={mode:'maintenance',build:previousBuild,epoch:initialEpoch,authAfterMs:now-10000};
 const transitions=[],requests=[],calls=[];
 const serviceHeaders={'access-control-allow-origin':allowedOrigin,'cache-control':'no-store'};
 const notFound=()=>Object.assign(Error('synthetic missing user'),{code:'auth/user-not-found'});
 const adminAuth={
  async createUser(info){calls.push('create');assert.equal(user,null);createdUid=info.uid;user={...info};return user;},
  async getUser(uid){calls.push('get');if(!user||user.uid!==uid)throw notFound();return {uid:user.uid,email:user.email};},
  async deleteUser(uid){calls.push('delete');assert.equal(uid,user.uid);user=null;}
 };
 const token=(provider,epoch)=>fakeJwt({aud:'ironpathtest',sub:user.uid,auth_time:Math.floor(now/1000),
  firebase:{sign_in_provider:provider},...(epoch?{ip_release_epoch:epoch}:{})});
 const fetcher=async(input,options={})=>{
  const url=new URL(input),method=options.method||'GET',headers=options.headers||{};
  requests.push({host:url.host,path:url.pathname,method});
  assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
  if(url.hostname==='ironpathtest-default-rtdb.europe-west1.firebasedatabase.app'){
   if(url.pathname==='/.settings/rules.json'){
    assert.equal(method,'GET');assert.equal(headers.authorization,`Bearer ${accessToken}`);
    return Response.json(changedRules?{rules:{'.read':true,'.write':true}}:rules);
   }
   if(url.pathname==='/_ironpathRelease.json'){
    assert.equal(headers.authorization,`Bearer ${accessToken}`);
    if(method==='GET'){
     assert.equal(headers['x-firebase-etag'],'true');
     return Response.json(control,{headers:{etag:`"v${version}"`}});
    }
    assert.equal(method,'PUT');
    if(conflictOnFirstTransition&&transitions.length===0){
     control={...control,mode:'open',epoch:'d'.repeat(32)};version++;
    }
    if(headers['if-match']!==`"v${version}"`)return Response.json({error:'conflict'},{status:412});
    const incoming=JSON.parse(options.body);
    assert.deepEqual(incoming.authAfterMs,{'.sv':'timestamp'});
    assert.notEqual(incoming.epoch,control.epoch);
    now+=300;control={...incoming,authAfterMs:now};version++;transitions.push(control.mode);
    return Response.json(control);
   }
   assert.match(url.pathname,/^\/players\/ironpath-smoke-[a-f0-9]{24}\.json$/);
   assert.equal(url.pathname,`/players/${createdUid}.json`);
   if(headers.authorization){
    assert.equal(headers.authorization,`Bearer ${accessToken}`);
    if(method==='DELETE'){profile=null;return Response.json(null);}
    assert.equal(method,'GET');return Response.json(profile);
   }
   const value=fromJwt(url.searchParams.get('auth'));
   const permitted=control.mode==='open'&&value.firebase.sign_in_provider==='custom'&&
    value.ip_release_epoch===control.epoch&&isAuthAfterCutoff(value.auth_time,control.authAfterMs);
   if(!permitted)return Response.json({error:'denied'},{status:401});
   if(method==='GET')return Response.json(profile);
   assert.equal(method,'PUT');profile=JSON.parse(options.body);
   if(failProfile)return Response.json({error:'ambiguous write'},{status:503});
   return Response.json(profile);
  }
  if(url.hostname==='identitytoolkit.googleapis.com'){
   assert.equal(method,'POST');assert.ok(user);const body=JSON.parse(options.body);
   if(url.pathname==='/v1/accounts:signInWithPassword'){
    assert.equal(body.email,user.email);assert.equal(body.password,user.password);
    return Response.json({localId:user.uid,idToken:token('password')});
   }
   assert.equal(url.pathname,'/v1/accounts:signInWithCustomToken');
   const custom=decode(body.token);assert.equal(custom.uid,user.uid);
   return Response.json({localId:user.uid,idToken:token('custom',custom.epoch)});
  }
  assert.equal(url.href,`${allowedOrigin}/api/session`);assert.equal(headers.origin,allowedOrigin);
  if(method==='OPTIONS')return new Response(null,{status:204,headers:serviceHeaders});
  assert.equal(method,'POST');const body=JSON.parse(options.body),identity=fromJwt(headers.authorization.slice(7));
  let status=503,kind='maintenance';
  if(control.mode==='open'){
   if(body.build!==control.build){status=409;kind='outdated';}
   else if(!isAuthAfterCutoff(identity.auth_time,control.authAfterMs)){status=401;kind='unauthorized';}
   else return Response.json({status:'ok',customToken:encode({uid:identity.sub,epoch:control.epoch})},{headers:serviceHeaders});
  }
  return Response.json({status:kind},{status,headers:serviceHeaders});
 };
 const verify=async options=>{
  assert.equal(options.build,previousBuild);assert.equal(options.origin,allowedOrigin);
  assert.equal(options.config.firebase.projectId,'ironpathtest');
  return `/IronPath/releases/${previousBuild}/`;
 };
 const args={previousBuild,nextBuild,initialEpoch,accessToken,adminAuth,fetcher,verify,
  wait:async ms=>{now+=ms;},random:n=>Buffer.alloc(n,0xab)};
 return {args,transitions,requests,calls,getControl:()=>control,getUser:()=>user,getProfile:()=>profile};
}

test('live operator checks transitions, verifies cleanup and leaves the new test build open',async()=>{
 const f=fixture();
 const result=await exerciseIsolatedGuard(f.args);
 assert.deepEqual(result,{previousBuild,nextBuild,checks:'live-maintenance-open-reopen-and-cleanup'});
 assert.deepEqual(f.transitions,['open','maintenance','open','maintenance','open']);
 assert.equal(f.getControl().mode,'open');assert.equal(f.getControl().build,nextBuild);
 assert.equal(f.getUser(),null);assert.equal(f.getProfile(),null);
 assert.deepEqual(f.calls,['create','get','delete','get']);
 assert.ok(f.requests.every(request=>['ironpathtest-default-rtdb.europe-west1.firebasedatabase.app',
  'identitytoolkit.googleapis.com','ironpath-release.vercel.app'].includes(request.host)));
 // The original epoch is single-use; redeploying the same operator cannot open again.
 const count=f.transitions.length;
 await assert.rejects(()=>exerciseIsolatedGuard(f.args),/TEST_EXPECTED_MAINTENANCE/);
 assert.equal(f.transitions.length,count);
});

test('a failed or uncertain profile write closes our epoch and removes the synthetic data',async()=>{
 const f=fixture({failProfile:true});
 await assert.rejects(()=>exerciseIsolatedGuard(f.args),/TEST_PROFILE_WRITE_FAILED/);
 assert.deepEqual(f.transitions,['open','maintenance']);
 assert.equal(f.getControl().mode,'maintenance');assert.equal(f.getUser(),null);assert.equal(f.getProfile(),null);
 assert.ok(f.requests.some(request=>request.method==='DELETE'&&request.path.startsWith('/players/')));
});

test('a concurrent operator is never overwritten and the synthetic account is removed',async()=>{
 const f=fixture({conflictOnFirstTransition:true});
 await assert.rejects(()=>exerciseIsolatedGuard(f.args),/TEST_CONTROL_CLEANUP_FAILED/);
 assert.equal(f.getControl().mode,'open');assert.equal(f.getControl().epoch,'d'.repeat(32));
 assert.deepEqual(f.transitions,[]);assert.equal(f.getUser(),null);
});

test('unexpected rules, epoch, input or execution target fail before side effects',async()=>{
 const f=fixture({changedRules:true});
 await assert.rejects(()=>exerciseIsolatedGuard(f.args),/TEST_RULES_MISMATCH/);
 assert.deepEqual(f.calls,[]);assert.deepEqual(f.transitions,[]);
 const g=fixture();
 await assert.rejects(()=>exerciseIsolatedGuard({...g.args,initialEpoch:'d'.repeat(32)}),/TEST_EXPECTED_MAINTENANCE/);
 await assert.rejects(()=>exerciseIsolatedGuard({...g.args,nextBuild:previousBuild}),/TEST_INPUT_INVALID/);
 assert.deepEqual(g.calls,[]);assert.deepEqual(g.transitions,[]);
 const file=fileURLToPath(new URL('../release-tools/exercise-isolated-guard.mjs',import.meta.url));
 const result=spawnSync(process.execPath,[file,'--exercise-ironpathtest-only',previousBuild,initialEpoch],{encoding:'utf8',env:{PATH:process.env.PATH}});
 assert.equal(result.status,1);assert.match(result.stderr,/TEST_EXPLICIT_TARGET_REQUIRED/);
});
