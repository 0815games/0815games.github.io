// ONE-TIME SETUP FOR THE EXISTING ironpathtest PROJECT ONLY.
// This is an operator script, not an HTTP endpoint and not part of the game.
// Run only with an explicit flag in the dedicated Vercel test project's build.
// It replaces only the test RTDB Rules and creates only its release-status
// record, initially closed. It never writes a credential, token or player data.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readBoundedJson} from './bounded-json.mjs';
import {isolatedTestBuildId,TEST_PUBLIC_CONFIG} from './build-isolated-test-site.mjs';
import {parseReleaseControl} from './release-control.mjs';
import {prepareReleaseControlWrite} from './release-control-write.mjs';
import {buildRulesCandidate} from './rules-candidate.mjs';

const DB=TEST_PUBLIC_CONFIG.firebase.databaseURL;
const REFERENCE_HASH='8041607e1adb3f235afffde8f581ebf6a06afdee99eb642a4d460ad938a04577';
const CANDIDATE_HASH='f92a0332f6a34e33a67f51b436d375aef0a20f3d51673f140608128442276bc5';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=code=>{throw Error(code);};
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

export function hasOnlyLockedRootRules(value) {
  if(!isObject(value)||Object.keys(value).length!==1||!isObject(value.rules))return false;
  const root=value.rules,keys=Object.keys(root).sort();
  const denied=v=>v===false || (typeof v==='string'&&v.trim()==='false');
  return keys.length===2 && keys[0]==='.read' && keys[1]==='.write' && denied(root['.read']) && denied(root['.write']);
}

// Ordering and boolean spelling are not semantically important in a Rules
// export. Do not normalize any other expressions or ignore any other fields.
function canonical(value,key='') {
  if((key==='.read'||key==='.write') && (value==='false'||value==='true'))value=value==='true';
  if(Array.isArray(value))return value.map(item=>canonical(item));
  if(isObject(value))return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k],k)]));
  return value;
}
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));

async function checkedCandidate() {
  const bytes=await readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
  if(hash(bytes)!==REFERENCE_HASH)fail('TEST_REFERENCE_CHANGED');
  const source=JSON.parse(bytes.toString('utf8'));
  const {candidate}=buildRulesCandidate(source);
  if(hash(`${JSON.stringify(candidate,null,2)}\n`)!==CANDIDATE_HASH)fail('TEST_CANDIDATE_CHANGED');
  return candidate;
}

export async function initializeIsolatedTest({commit,accessToken,fetcher=globalThis.fetch}={}) {
  const build=isolatedTestBuildId(commit);
  if(typeof accessToken!=='string'||accessToken.length<20||accessToken.length>8192||/\s/.test(accessToken)||typeof fetcher!=='function') {
    fail('TEST_CREDENTIAL_UNAVAILABLE');
  }
  const candidate=await checkedCandidate();
  async function request(path,{method='GET',body,authenticated=true,headers={}}={}) {
    // These are the only paths this script is able to modify. In particular,
    // never issue a write to the database root or to a player node.
    if(!['/.settings/rules.json','/_ironpathRelease.json'].includes(path))fail('TEST_PATH_REJECTED');
    let response;
    try {
      response=await fetcher(DB+path,{method,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),
        headers:{...(authenticated?{authorization:`Bearer ${accessToken}`}:{ }),
          ...(body===undefined?{}:{'content-type':'application/json'}),...headers},
        ...(body===undefined?{}:{body:JSON.stringify(body)})});
      if(!response.ok)fail('TEST_DATABASE_REJECTED');
      return await readBoundedJson(response,512*1024);
    } catch { fail('TEST_DATABASE_REJECTED'); }
  }
  const rules=await request('/.settings/rules.json');
  const existing=await request('/_ironpathRelease.json');
  const parsed=parseReleaseControl(existing);
  // Safe retry when a prior deployment finished setup but did not finish its
  // build. Never reuse an existing open state or take over another build.
  if(same(rules,candidate) && parsed?.mode==='maintenance' && parsed.build===build) {
    const publicStatus=await request('/_ironpathRelease.json',{authenticated:false});
    if(!same(publicStatus,existing))fail('TEST_STATUS_MISMATCH');
    return {build,alreadyInitialized:true};
  }
  if(!hasOnlyLockedRootRules(rules) || existing!==null)fail('TEST_RULES_OR_STATUS_UNEXPECTED');
  const control=prepareReleaseControlWrite({mode:'maintenance',build,currentEpoch:null});
  // The conditional whole-record write never overwrites an existing status;
  // Firebase resolves the server timestamp as part of the same operation.
  await request('/_ironpathRelease.json',{method:'PUT',body:control,headers:{'if-match':'null_etag'}});
  const written=await request('/_ironpathRelease.json');
  const ready=parseReleaseControl(written);
  if(!ready||ready.mode!=='maintenance'||ready.build!==build||ready.epoch!==control.epoch)fail('TEST_STATUS_MISMATCH');
  // One operator only: re-read immediately before replacing Rules. A concurrent
  // console edit in the remaining gap is not an atomic compare-and-swap.
  if(!hasOnlyLockedRootRules(await request('/.settings/rules.json')))fail('TEST_RULES_CHANGED');
  await request('/.settings/rules.json',{method:'PUT',body:candidate});
  if(!same(await request('/.settings/rules.json'),candidate))fail('TEST_RULES_MISMATCH');
  if(!same(await request('/_ironpathRelease.json',{authenticated:false}),written))fail('TEST_STATUS_MISMATCH');
  return {build,alreadyInitialized:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  (async()=>{
    if(process.argv.length!==3||process.argv[2]!=='--apply-ironpathtest-only'||
        process.env.VERCEL_PROJECT_NAME!=='ironpath-release'||process.env.VERCEL_TARGET_ENV!=='production') {
      fail('TEST_EXPLICIT_TARGET_REQUIRED');
    }
    // Dependencies are loaded only for the explicitly authorized Vercel run;
    // pure safety tests do not need the Admin SDK or real credentials.
    const [{cert},{readServiceConfig}]=await Promise.all([import('firebase-admin/app'),import('./api/session.mjs')]);
    const config=readServiceConfig(process.env);
    if(config.projectId!=='ironpathtest'||config.databaseUrl!==DB||
        config.origin!=='https://ironpath-release.vercel.app')fail('TEST_EXPLICIT_TARGET_REQUIRED');
    const token=await cert(config.serviceAccount).getAccessToken();
    const result=await initializeIsolatedTest({commit:process.env.VERCEL_GIT_COMMIT_SHA,accessToken:token.access_token});
    console.log(`ironpathtest is closed and ready for the guarded test (${result.build})`);
  })().catch(error=>{
    // Network errors and credential libraries may include sensitive values.
    // Only print a fixed, preselected diagnostic, never their message/stack.
    const code=/^TEST_[A-Z_]+$/.test(error?.message||'')?error.message:'TEST_SETUP_FAILED';
    console.error(`Isolated test setup stopped: ${code}. No production data was targeted.`);
    process.exitCode=1;
  });
}
