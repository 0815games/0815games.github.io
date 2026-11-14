// Checks for a Pages artifact produced by build-pages-site.mjs. A control
// check reads only the public release record; a public check only downloads
// static files. Neither check deploys, opens maintenance or writes Firebase.
import {createHash,webcrypto} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readBoundedBytes} from './bounded-json.mjs';
import {planPagesReleases} from './build-pages-site.mjs';
import {parseReleaseControl} from './release-control.mjs';
import {createFreshControlReader} from './session-service.mjs';
import {validateSiteOrigin} from './public-site-config.mjs';
import {verifyStagedBuild} from './verify-staged-build.mjs';
import {verifyPublicRelease} from './verify-public-release.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sha=/^[a-f0-9]{64}$/,revision=/^[a-f0-9]{40}$/;
const isObject=value=>value!==null && typeof value==='object' && !Array.isArray(value);

export function validatePagesArtifact({artifact,pins,publicConfig,origin} = {}) {
  const expected=planPagesReleases(pins,publicConfig),siteOrigin=validateSiteOrigin(origin);
  const matches=(actual,wanted)=>wanted===null?actual===null:
    isObject(actual) && actual.revision===wanted.revision && actual.build===wanted.build &&
    (!Object.hasOwn(wanted,'disableCharacterDeletion') || actual.disableCharacterDeletion===wanted.disableCharacterDeletion) &&
    Number.isSafeInteger(actual.fileCount) && actual.fileCount>0 && actual.fileCount<=10000;
  if(!isObject(artifact)||artifact.format!==1||artifact.origin!==siteOrigin||!revision.test(artifact.siteRevision||'')||
      artifact.configSha256!==expected.configSha256||artifact.launcher!==expected.launcher||
      !matches(artifact.candidate,expected.candidate)||!matches(artifact.rollback,expected.rollback)||
      !isObject(artifact.launcherFiles))throw Error('Pages artifact does not match the pinned releases');
  const files=Object.entries(artifact.launcherFiles);
  if(files.length<2||files.length>50||!Object.hasOwn(artifact.launcherFiles,'index.html'))throw Error('Invalid launcher inventory');
  const prefix=`launcher/${expected.launcher}/`;
  for(const [name,entry] of files){
    const components=name.split('/');
    if((name!=='index.html'&&!name.startsWith(prefix)) ||
        components.some(part=>!part || part==='.' || part==='..' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(part)) ||
        !isObject(entry)||!Number.isSafeInteger(entry.bytes)||entry.bytes<1||entry.bytes>5*1024*1024||
        typeof entry.sha256!=='string'||!sha.test(entry.sha256))throw Error('Invalid launcher inventory');
  }
  return expected;
}

export async function checkPagesControl({artifact,pins,publicConfig,origin,fetcher=globalThis.fetch,timeoutMs=5000} = {}) {
  const plan=validatePagesArtifact({artifact,pins,publicConfig,origin});
  const read=createFreshControlReader({databaseUrl:plan.config.firebase.databaseURL,fetcher,timeoutMs});
  let control;try{control=parseReleaseControl(await read());}catch{control=null;}
  if(!control)throw Error('The authoritative release control is unavailable or invalid; do not deploy');
  if(![plan.candidate,plan.rollback].filter(Boolean).some(item=>item.build===control.build)) {
    throw Error('The current release is not retained in this Pages artifact; do not deploy');
  }
  return {mode:control.mode,build:control.build};
}

async function download(url,fetcher,maxBytes,timeoutMs) {
  const controller=new AbortController();let timer;
  const aborted=new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('Public file check timed out')),{once:true}));
  const work=(async()=>{
    const response=await fetcher(url,{method:'GET',cache:'no-store',credentials:'omit',redirect:'error',
      referrerPolicy:'no-referrer',headers:{'cache-control':'no-cache'},signal:controller.signal});
    if(!response?.ok)throw Error('Public file unavailable');
    return Buffer.from(await readBoundedBytes(response,maxBytes));
  })();
  try{timer=setTimeout(()=>controller.abort(),timeoutMs);return await Promise.race([work,aborted]);}
  finally{clearTimeout(timer);controller.abort();}
}

export async function verifyPagesPublic({siteDir,artifact,pins,publicConfig,origin,fetcher=globalThis.fetch,full=false,timeoutMs=30000} = {}) {
  if(typeof siteDir!=='string'||typeof fetcher!=='function'||typeof full!=='boolean'||
      !Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000)throw Error('Invalid Pages verification settings');
  const plan=validatePagesArtifact({artifact,pins,publicConfig,origin}),siteOrigin=validateSiteOrigin(origin);
  const base=`${siteOrigin}/IronPath/`,iron=join(resolve(siteDir),'IronPath');
  const localPlan=await readFile(join(iron,'pages-release-plan.json'));
  if(localPlan.length>256*1024)throw Error('Invalid local Pages plan');
  let parsed;try{parsed=JSON.parse(localPlan);}catch{throw Error('Invalid local Pages plan');}
  validatePagesArtifact({artifact:parsed,pins,publicConfig,origin});
  if(JSON.stringify(parsed)!==JSON.stringify(artifact))throw Error('Pages plan changed after build');
  const remotePlan=await download(`${base}pages-release-plan.json`,fetcher,256*1024,timeoutMs);
  if(!remotePlan.equals(localPlan))throw Error('Public Pages plan differs from the local artifact');
  await Promise.all(Object.entries(artifact.launcherFiles).map(async([name,entry])=>{
    const local=await readFile(join(iron,name));
    if(local.length!==entry.bytes||hash(local)!==entry.sha256)throw Error(`Local launcher changed: ${name}`);
    const remote=await download(name==='index.html'?base:base+name,fetcher,entry.bytes,timeoutMs);
    if(remote.length!==entry.bytes||hash(remote)!==entry.sha256)throw Error(`Public launcher differs: ${name}`);
  }));
  for(const item of [plan.candidate,plan.rollback].filter(Boolean)){
    const manifest=join(iron,'releases',item.build,'release-manifest.json'),local=await readFile(manifest);
    if(local.length>1024*1024)throw Error('Invalid local release inventory');
    const remote=await download(`${base}releases/${item.build}/release-manifest.json`,fetcher,1024*1024,timeoutMs);
    if(!remote.equals(local))throw Error('Public release inventory differs from the local artifact');
    if(full){
      await verifyPublicRelease({origin:siteOrigin,manifestPath:manifest,fetcher,timeoutMs});
    }else{
      await verifyStagedBuild({build:item.build,origin:siteOrigin,config:plan.config,fetcher,crypto:webcrypto,timeoutMs});
    }
  }
  return {candidate:plan.candidate.build,rollback:plan.rollback?.build??null,full};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [,,operation,siteDir,configFile,pinsFile,option]=process.argv;
  if(!['control','verify'].includes(operation)||!siteDir||!configFile||!pinsFile||
      !(process.argv.length===6 || (process.argv.length===7&&operation==='verify'&&option==='--full'))){
    console.error('Usage: node pages-safety.mjs <control|verify> <site-directory> <public-config.json> <release-pins.json> [--full]');
    process.exitCode=2;
  }else{
    (async()=>{
      const [artifact,publicConfig,pins]=await Promise.all([
        join(siteDir,'IronPath','pages-release-plan.json'),configFile,pinsFile
      ].map(async path=>JSON.parse(await readFile(path,'utf8'))));
      const common={artifact,pins,publicConfig,origin:'https://0815games.github.io'};
      return operation==='control'?checkPagesControl(common):verifyPagesPublic({...common,siteDir,full:option==='--full'});
    })().then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});
  }
}
