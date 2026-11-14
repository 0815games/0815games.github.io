// One-time live smoke for the owner's isolated ironpathtest project. This is a
// build-time operator, not a deployed API. It creates only a randomly named
// synthetic account/profile, checks the actual session service and RTDB Rules,
// then removes both. NEVER use this on real players or a production database.
import {createHash,randomBytes,webcrypto} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {pathToFileURL} from 'node:url';
import {readBoundedJson} from './bounded-json.mjs';
import {isolatedTestBuildId,TEST_PUBLIC_CONFIG} from './build-isolated-test-site.mjs';
import {BUILD_PATTERN,EPOCH_PATTERN,isAuthAfterCutoff,parseReleaseControl,sameRelease} from './release-control.mjs';
import {prepareReleaseControlWrite} from './release-control-write.mjs';
import {buildRulesCandidate} from './rules-candidate.mjs';
import {verifyStagedBuild} from './verify-staged-build.mjs';

const DB=TEST_PUBLIC_CONFIG.firebase.databaseURL, ORIGIN='https://ironpath-release.vercel.app';
const API_KEY=TEST_PUBLIC_CONFIG.firebase.apiKey;
const CONTROL=`${DB}/_ironpathRelease.json`;
const RULES=`${DB}/.settings/rules.json`;
const IDENTITY='https://identitytoolkit.googleapis.com/v1/accounts:';
const REFERENCE_HASH='8041607e1adb3f235afffde8f581ebf6a06afdee99eb642a4d460ad938a04577';
const CANDIDATE_HASH='f92a0332f6a34e33a67f51b436d375aef0a20f3d51673f140608128442276bc5';
const fail=code=>{throw Error(code);};
const validBuild=value=>typeof value==='string'&&BUILD_PATTERN.test(value)&&/^test-[a-f0-9]{40}$/.test(value);
const obj=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function canonical(value,key=''){
  if((key==='.read'||key==='.write')&&(value==='false'||value==='true'))value=value==='true';
  if(Array.isArray(value))return value.map(v=>canonical(v));
  if(obj(value))return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k],k)]));
  return value;
}
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function expectedRules(){
  const bytes=await readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
  if(hash(bytes)!==REFERENCE_HASH)fail('TEST_REFERENCE_CHANGED');
  const {candidate}=buildRulesCandidate(JSON.parse(bytes.toString('utf8')));
  if(hash(`${JSON.stringify(candidate,null,2)}\n`)!==CANDIDATE_HASH)fail('TEST_CANDIDATE_CHANGED');
  return candidate;
}
function claims(token,uid,provider){
  if(typeof token!=='string'||token.length>8192)fail('TEST_IDENTITY_TOKEN_MISSING');
  let value;try{value=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));}catch{fail('TEST_IDENTITY_TOKEN_MALFORMED');}
  // Fixed diagnostic codes identify a failed assertion without printing any
  // part of a token, a user ID, credentials, or an upstream error body.
  if(value?.aud!=='ironpathtest')fail('TEST_IDENTITY_PROJECT');
  if(value.sub!==uid)fail('TEST_IDENTITY_SUBJECT');
  if(value.firebase?.sign_in_provider!==provider)fail('TEST_IDENTITY_PROVIDER');
  if(!Number.isSafeInteger(value.auth_time))fail('TEST_IDENTITY_AUTH_TIME');
  return value;
}

export async function exerciseIsolatedGuard({previousBuild,nextBuild,initialEpoch,accessToken,adminAuth,
  fetcher=globalThis.fetch,verify=verifyStagedBuild,wait=delay,random=randomBytes}={}) {
  if(!validBuild(previousBuild)||!validBuild(nextBuild)||previousBuild===nextBuild||
      typeof initialEpoch!=='string'||!EPOCH_PATTERN.test(initialEpoch)||
      typeof accessToken!=='string'||accessToken.length<20||accessToken.length>8192||/\s/.test(accessToken)||
      !['createUser','getUser','deleteUser'].every(name=>typeof adminAuth?.[name]==='function')||
      typeof fetcher!=='function'||typeof verify!=='function'||typeof wait!=='function'||typeof random!=='function') {
    fail('TEST_INPUT_INVALID');
  }
  const bytes=random(12);if(!(bytes instanceof Uint8Array)||bytes.length!==12)fail('TEST_RANDOM_INVALID');
  const uid=`ironpath-smoke-${Buffer.from(bytes).toString('hex')}`,email=`${uid}@example.invalid`;
  const passwordBytes=random(24);if(!(passwordBytes instanceof Uint8Array)||passwordBytes.length!==24)fail('TEST_RANDOM_INVALID');
  const password=`A9!${Buffer.from(passwordBytes).toString('base64url')}`;
  const adminHeader={authorization:`Bearer ${accessToken}`},ownedEpochs=new Set();
  let current=null,acquired=false,userAttempted=false,profileMayExist=false;

  async function request(url,options={}){
    try{return await fetcher(url,{...options,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});}
    catch{fail('TEST_NETWORK_FAILED');}
  }
  async function json(response,limit=20000){try{return await readBoundedJson(response,limit);}catch{fail('TEST_RESPONSE_INVALID');}}
  async function readControl(){
    const response=await request(CONTROL,{headers:{...adminHeader,'x-firebase-etag':'true'}});
    if(!response.ok)fail('TEST_CONTROL_READ_FAILED');
    const value=parseReleaseControl(await json(response,2048)),etag=response.headers.get('etag');
    if(!value||typeof etag!=='string'||!etag)fail('TEST_CONTROL_INVALID');
    return {value,etag};
  }
  async function transition(mode,build){
    const before=await readControl();
    if(!sameRelease(before.value,current))fail('TEST_CONTROL_CONFLICT');
    const prepared=prepareReleaseControlWrite({mode,build,currentEpoch:before.value.epoch});
    ownedEpochs.add(prepared.epoch); // A timed-out write can still have reached Firebase.
    const response=await request(CONTROL,{method:'PUT',headers:{...adminHeader,'content-type':'application/json','if-match':before.etag},body:JSON.stringify(prepared)});
    if(!response.ok)fail('TEST_CONTROL_WRITE_FAILED');
    const after=await readControl();
    if(after.value.mode!==mode||after.value.build!==build||after.value.epoch!==prepared.epoch)fail('TEST_CONTROL_MISMATCH');
    current=after.value;return current;
  }
  async function forceClosedIfOwned(){
    const latest=await readControl();
    if(latest.value.mode==='maintenance'){current=latest.value;return;}
    if(!ownedEpochs.has(latest.value.epoch))fail('TEST_CONTROL_CONFLICT');
    current=latest.value;await transition('maintenance',current.build);
  }
  async function signIn(){
    const response=await request(`${IDENTITY}signInWithPassword?key=${API_KEY}`,{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({email,password,returnSecureToken:true})});
    if(!response.ok)fail('TEST_PASSWORD_SIGNIN_FAILED');
    const body=await json(response);if(body?.localId!==uid)fail('TEST_PASSWORD_UID_MISMATCH');
    return {token:body.idToken,claims:claims(body.idToken,uid,'password')};
  }
  async function freshSignIn(cutoff){
    for(let i=0;i<12;i++){
      const signed=await signIn();if(isAuthAfterCutoff(signed.claims.auth_time,cutoff))return signed;
      await wait(500);
    }
    fail('TEST_AUTH_CLOCK_NOT_AFTER_OPEN');
  }
  async function exchange(token,build){
    const response=await request(TEST_PUBLIC_CONFIG.sessionEndpoint,{method:'POST',headers:{origin:ORIGIN,authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({build})});
    if(response.headers.get('access-control-allow-origin')!==ORIGIN||!String(response.headers.get('cache-control')).includes('no-store'))fail('TEST_SERVICE_HEADERS_FAILED');
    const body=await json(response);return {status:response.status,body};
  }
  async function customSignIn(customToken,epoch){
    const response=await request(`${IDENTITY}signInWithCustomToken?key=${API_KEY}`,{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({token:customToken,returnSecureToken:true})});
    if(!response.ok)fail('TEST_CUSTOM_SIGNIN_FAILED');
    // The custom-token REST response documents an ID token, not localId.
    // Verify the ID token's subject below; if a localId is supplied, it must
    // agree too. Password sign-in, in contrast, does document localId.
    const body=await json(response);
    if(Object.hasOwn(body,'localId')&&body.localId!==uid)fail('TEST_CUSTOM_UID_MISMATCH');
    const value=claims(body.idToken,uid,'custom');if(value.ip_release_epoch!==epoch||!isAuthAfterCutoff(value.auth_time,current.authAfterMs))fail('TEST_CUSTOM_CLAIMS_INVALID');
    return body.idToken;
  }
  async function player(token,{method='GET',value}={}){
    const url=new URL(`${DB}/players/${uid}.json`);url.searchParams.set('auth',token);
    const response=await request(url.href,{method,...(value===undefined?{}:{headers:{'content-type':'application/json'},body:JSON.stringify(value)})});
    return {status:response.status,...(response.ok?{value:await json(response)}:{})};
  }
  const denied=result=>{if(![401,403].includes(result.status))fail('TEST_ACCESS_NOT_DENIED');};
  const status=(result,code,kind)=>{if(result.status!==code||result.body?.status!==kind)fail('TEST_EXCHANGE_UNEXPECTED');};
  async function deleteProfile(){
    if(!profileMayExist)return;
    const url=`${DB}/players/${uid}.json`;
    const response=await request(url,{method:'DELETE',headers:adminHeader});
    if(!response.ok)fail('TEST_PROFILE_CLEANUP_FAILED');
    const check=await request(url,{headers:adminHeader});
    if(!check.ok||await json(check)!==null)fail('TEST_PROFILE_CLEANUP_FAILED');
  }
  async function deleteUser(){
    if(!userAttempted)return;
    let record;
    try{record=await adminAuth.getUser(uid);}catch(error){if(error?.code==='auth/user-not-found')return;fail('TEST_USER_CLEANUP_FAILED');}
    if(record?.uid!==uid||record.email!==email)fail('TEST_USER_CLEANUP_FAILED');
    try{await adminAuth.deleteUser(uid);}catch{fail('TEST_USER_CLEANUP_FAILED');}
    try{await adminAuth.getUser(uid);fail('TEST_USER_CLEANUP_FAILED');}
    catch(error){if(error?.code!=='auth/user-not-found')fail('TEST_USER_CLEANUP_FAILED');}
  }
  let failure=null;
  try{
    const ruleResponse=await request(RULES,{headers:adminHeader});
    if(!ruleResponse.ok||!same(await json(ruleResponse,512*1024),await expectedRules()))fail('TEST_RULES_MISMATCH');
    current=(await readControl()).value;
    // Bind this invocation to the exact, already-inspected initial epoch. Once
    // any transition succeeds, repeating the same deployment cannot run it again.
    if(current.mode!=='maintenance'||current.build!==previousBuild||current.epoch!==initialEpoch)fail('TEST_EXPECTED_MAINTENANCE');
    acquired=true;
    await verify({build:previousBuild,origin:ORIGIN,config:TEST_PUBLIC_CONFIG,fetcher,crypto:webcrypto,timeoutMs:30000});
    const options=await request(TEST_PUBLIC_CONFIG.sessionEndpoint,{method:'OPTIONS',headers:{origin:ORIGIN,'access-control-request-method':'POST','access-control-request-headers':'authorization,content-type'}});
    if(options.status!==204||options.headers.get('access-control-allow-origin')!==ORIGIN)fail('TEST_CORS_PREFLIGHT_FAILED');

    userAttempted=true;await adminAuth.createUser({uid,email,password});
    const old=await signIn();denied(await player(old.token));
    status(await exchange(old.token,previousBuild),503,'maintenance');
    await transition('open',previousBuild);
    status(await exchange(old.token,previousBuild),401,'unauthorized');
    const fresh=await freshSignIn(current.authAfterMs);denied(await player(fresh.token));
    status(await exchange(fresh.token,'test-outdated'),409,'outdated');
    const approved=await exchange(fresh.token,previousBuild);status(approved,200,'ok');
    const session=await customSignIn(approved.body.customToken,current.epoch);
    profileMayExist=true;
    const created=await player(session,{method:'PUT',value:{name:'Test Soldier',gender:'female',xp:0}});
    if(created.status!==200)fail('TEST_PROFILE_WRITE_FAILED');
    if((await player(session)).value?.name!=='Test Soldier')fail('TEST_PROFILE_READ_FAILED');

    await transition('maintenance',previousBuild);
    denied(await player(session));denied(await player(session,{method:'PUT',value:{name:'Test Soldier',gender:'female',xp:5}}));
    status(await exchange(fresh.token,previousBuild),503,'maintenance');
    await transition('open',previousBuild);
    denied(await player(session));status(await exchange(fresh.token,previousBuild),401,'unauthorized');
    const renewed=await freshSignIn(current.authAfterMs),approvedAgain=await exchange(renewed.token,previousBuild);
    status(approvedAgain,200,'ok');
    const newSession=await customSignIn(approvedAgain.body.customToken,current.epoch);
    if((await player(newSession)).value?.xp!==0)fail('TEST_REOPEN_READ_FAILED');
    if((await player(newSession,{method:'PUT',value:{name:'Test Soldier',gender:'female',xp:1}})).status!==200)fail('TEST_REOPEN_WRITE_FAILED');
  }catch(error){failure=error;}

  // Always close before cleanup. Do not touch another operator's epoch.
  try{if(acquired)await forceClosedIfOwned();}catch{failure=Error('TEST_CONTROL_CLEANUP_FAILED');}
  try{await deleteProfile();}catch{failure=Error('TEST_PROFILE_CLEANUP_FAILED');}
  try{await deleteUser();}catch{failure=Error('TEST_USER_CLEANUP_FAILED');}
  if(failure)throw failure;

  // The new static test build was just packaged by this deployment. It can be
  // briefly unavailable until Vercel promotes it; the launcher fails closed
  // during that interval. If this final write is uncertain, close our epoch.
  try{await transition('open',nextBuild);}catch(error){
    try{await forceClosedIfOwned();}catch{fail('TEST_CONTROL_CLEANUP_FAILED');}
    throw error;
  }
  return {previousBuild,nextBuild,checks:'live-maintenance-open-reopen-and-cleanup'};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  (async()=>{
    if(process.argv.length!==5||process.argv[2]!=='--exercise-ironpathtest-only'||
       process.env.VERCEL_PROJECT_NAME!=='ironpath-release'||process.env.VERCEL_TARGET_ENV!=='production')fail('TEST_EXPLICIT_TARGET_REQUIRED');
    const [{cert,initializeApp},{getAuth},{readServiceConfig}]=await Promise.all([
      import('firebase-admin/app'),import('firebase-admin/auth'),import('./api/session.mjs')]);
    const config=readServiceConfig(process.env);
    if(config.projectId!=='ironpathtest'||config.databaseUrl!==DB||config.origin!==ORIGIN)fail('TEST_EXPLICIT_TARGET_REQUIRED');
    const credential=cert(config.serviceAccount),token=await credential.getAccessToken();
    const app=initializeApp({projectId:config.projectId,credential},'ironpath-live-test');
    await exerciseIsolatedGuard({previousBuild:process.argv[3],nextBuild:isolatedTestBuildId(process.env.VERCEL_GIT_COMMIT_SHA),
      initialEpoch:process.argv[4],accessToken:token.access_token,adminAuth:getAuth(app)});
    console.log('Live ironpathtest guard checks passed; synthetic profile and account removed; new test build opened.');
  })().catch(error=>{
    const code=/^TEST_[A-Z_]+$/.test(error?.message||'')?error.message:'TEST_LIVE_FAILED';
    console.error(`Isolated live test stopped: ${code}. Inspect the test status before retrying.`);
    process.exitCode=1;
  });
}
