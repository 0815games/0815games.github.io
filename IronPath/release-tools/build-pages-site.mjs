// Prepare a GitHub Pages artifact locally. This script does not change Pages,
// Firebase, a live status record or the repository. The site is not production
// ready merely because an artifact was built; see PAGES-ROLLOUT.md.
import {execFile} from 'node:child_process';
import {createHash,webcrypto} from 'node:crypto';
import {lstat,mkdir,mkdtemp,readFile,readdir,realpath,rm,unlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename,dirname,join,relative,resolve,sep} from 'node:path';
import {promisify} from 'node:util';
import {pathToFileURL} from 'node:url';
import {formatPublicSiteConfig,validatePublicSiteConfig,validateSiteOrigin} from './public-site-config.mjs';

const exec=promisify(execFile), revisionPattern=/^[a-f0-9]{40}$/;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const isObject=value=>value!==null && typeof value==='object' && !Array.isArray(value);
const within=(parent,child)=>{const r=relative(parent,child);return r===''||(!r.startsWith(`..${sep}`)&&r!=='..'&&!r.startsWith(sep));};

// IDs identify both the immutable Git revision and the browser configuration.
// A changed endpoint/Firebase project therefore cannot silently reuse URLs.
export function planPagesReleases(pins,publicConfig) {
  const rollback=pins?.rollback;
  if(!isObject(pins) || Object.keys(pins).sort().join(',')!=='format,gameRevision,rollback' || pins.format!==1 ||
      typeof pins.gameRevision!=='string' || !revisionPattern.test(pins.gameRevision) ||
      !(rollback===null || (isObject(rollback) && Object.keys(rollback).sort().join(',')==='disableCharacterDeletion,revision' &&
        typeof rollback.revision==='string' && revisionPattern.test(rollback.revision) &&
        typeof rollback.disableCharacterDeletion==='boolean' && rollback.revision!==pins.gameRevision))) {
    throw Error('Invalid Pages release pins');
  }
  const config=validatePublicSiteConfig(publicConfig);
  const formattedConfig=formatPublicSiteConfig(config),configSha256=hash(formattedConfig);
  const suffix=configSha256.slice(0,12);
  // The special legacy artifact is modified after staging. Its ID must also
  // change if that transformation changes, even when revision/config do not.
  const legacySuffix=hash(`${formattedConfig}\n${disableLegacyCharacterDeletion.toString()}`).slice(0,12);
  const make=(revision,disableCharacterDeletion=false)=>({revision,
    build:`${disableCharacterDeletion?'legacy':'prod'}-${revision}-${disableCharacterDeletion?legacySuffix:suffix}`});
  return Object.freeze({config,configSha256,launcher:`launcher-${pins.gameRevision}-${suffix}`,
    candidate:make(pins.gameRevision),rollback:rollback?{...make(rollback.revision,rollback.disableCharacterDeletion),
      disableCharacterDeletion:rollback.disableCharacterDeletion}:null});
}

async function git(repo,...args) {
  try{return (await exec('git',['-C',repo,...args],{maxBuffer:1024*1024})).stdout.trim();}
  catch{throw Error('Git revision unavailable or not an ancestor of the current site');}
}

async function exportTree(repo,revision,destination,paths=[]) {
  await mkdir(destination,{recursive:true});
  // No untrusted values are interpolated into shell text. pipefail ensures an
  // archive error cannot leave a partial directory that looks successful.
  try{
    await exec('bash',['-c','set -euo pipefail; git -C "$1" archive --format=tar "$2" -- "${@:4}" | tar -x --no-same-owner --no-same-permissions -f - -C "$3"',
      'ironpath-pages-archive',repo,revision,destination,...paths],{maxBuffer:1024*1024});
  }catch{throw Error('Could not export the tracked site or release revision');}
}

async function assertRegularTree(dir) {
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const path=join(dir,entry.name),info=await lstat(path);
    if(info.isSymbolicLink())throw Error('Symlinks are not accepted in the Pages artifact');
    if(info.isDirectory())await assertRegularTree(path);
    else if(!info.isFile() || info.nlink!==1)throw Error('Non-regular or hard-linked file in the Pages artifact');
  }
}

// The first fallback predates atomic character cleanup. Disable its known
// unsafe button instead of silently bringing the old deletion path back. The
// distinct "legacy-" build ID means these bytes never reuse a normal build URL.
// This does not fix other old-client races or make the fallback production-tested.
export async function disableLegacyCharacterDeletion(directory) {
  const accountPath=join(directory,'account.js'),manifestPath=join(directory,'release-manifest.json');
  const original=await readFile(accountPath),text=original.toString('utf8');
  const needle="$('menuDeleteCharacter').onclick=deleteCharacter;";
  if(text.split(needle).length!==2)throw Error('Legacy deletion handler is not uniquely identifiable');
  const manifest=JSON.parse(await readFile(manifestPath,'utf8')),entry=manifest?.files?.['account.js'];
  if(entry?.bytes!==original.length || entry?.sha256!==hash(original))throw Error('Legacy account inventory changed');
  const replacement="$('menuDeleteCharacter').disabled=true; $('menuDeleteCharacter').title='Character deletion is unavailable during rollback.'; $('menuDeleteCharacter').onclick=()=>{};";
  const changed=Buffer.from(text.replace(needle,replacement));
  manifest.files['account.js']={bytes:changed.length,sha256:hash(changed)};
  await writeFile(accountPath,changed);
  await writeFile(manifestPath,`${JSON.stringify(manifest,null,2)}\n`);
}

async function fileInventory(root,relativePath='') {
  const result={};
  for(const name of (await readdir(join(root,relativePath))).sort()){
    const rel=relativePath?`${relativePath}/${name}`:name,path=join(root,rel),info=await lstat(path);
    if(info.isDirectory()&&!info.isSymbolicLink())Object.assign(result,await fileInventory(root,rel));
    else if(info.isFile()&&!info.isSymbolicLink()){
      const bytes=await readFile(path);result[rel]={bytes:bytes.length,sha256:hash(bytes)};
    }else throw Error('Invalid launcher file');
  }
  return result;
}

function localFetcher(site,origin) {
  return async url=>{
    const request=new URL(url);
    if(request.origin!==origin || request.search || request.hash)throw Error('Unexpected local verification URL');
    const path=resolve(site,`.${decodeURIComponent(request.pathname)}`);
    if(!within(site,path))throw Error('Unexpected local verification path');
    try{return new Response(await readFile(path));}catch{return new Response('missing',{status:404});}
  };
}

export async function buildPagesSite({repoDir,outputDir,pins,publicConfig,origin='https://0815games.github.io'} = {}) {
  if(typeof repoDir!=='string' || typeof outputDir!=='string')throw Error('Explicit repository and new output path required');
  const siteOrigin=validateSiteOrigin(origin),plan=planPagesReleases(pins,publicConfig);
  const repo=await realpath(resolve(repoDir));
  if(await realpath(await git(repo,'rev-parse','--show-toplevel'))!==repo)throw Error('Expected the repository root');
  for(const item of [plan.candidate,plan.rollback].filter(Boolean)){
    await git(repo,'cat-file','-e',`${item.revision}^{commit}`);
    await git(repo,'merge-base','--is-ancestor',item.revision,'HEAD');
  }
  const parent=await realpath(dirname(resolve(outputDir))),site=join(parent,basename(resolve(outputDir)));
  if(within(repo,site)||within(site,repo))throw Error('Pages output must be outside the repository');
  try{await lstat(site);throw Error('Pages output already exists');}catch(error){if(error.code!=='ENOENT')throw error;}
  await mkdir(site); // A failure below leaves a partial directory: never deploy it.
  const temporary=await mkdtemp(join(tmpdir(),'ironpath-pages-source-'));
  try{
    const head=await git(repo,'rev-parse','HEAD');
    if(!revisionPattern.test(head))throw Error('Invalid site revision');
    await exportTree(repo,head,site);
    await assertRegularTree(site);
    const iron=join(site,'IronPath'),entry=join(iron,'index.html');
    const entryInfo=await lstat(entry);
    if(!entryInfo.isFile()||entryInfo.isSymbolicLink())throw Error('Missing original Iron Path entry');
    for(const name of ['launcher','releases','pages-release-plan.json']){
      try{await lstat(join(iron,name));throw Error(`Pages path already exists: ${name}`);}
      catch(error){if(error.code!=='ENOENT')throw error;}
    }
    const releases=join(iron,'releases');await mkdir(releases);
    const snapshots=new Map(),staged=[];
    for(const item of [plan.candidate,plan.rollback].filter(Boolean)){
      const snapshot=join(temporary,item.revision);await exportTree(repo,item.revision,snapshot,['IronPath']);
      const source=join(snapshot,'IronPath');snapshots.set(item.revision,source);
      const packager=await import(pathToFileURL(join(source,'release-tools','stage-version.mjs')).href);
      const result=await packager.stageVersion({sourceDir:source,outputDir:releases,build:item.build,guardedConfig:plan.config});
      if(item.disableCharacterDeletion)await disableLegacyCharacterDeletion(result.directory);
      staged.push({...item,fileCount:result.fileCount});
    }
    const source=snapshots.get(plan.candidate.revision);
    const {stageLauncher}=await import(pathToFileURL(join(source,'release-tools','stage-launcher.mjs')).href);
    // Only the exported copy is changed. The repository's live entry stays intact.
    await unlink(entry);
    await stageLauncher({sourceDir:source,outputDir:iron,build:plan.launcher,config:plan.config});

    // The candidate launcher's own verifier must accept every retained build,
    // not only the new one. Full inventory verification uses file-backed fetch;
    // no Firebase, Vercel, Pages or test server is contacted during this build.
    const {verifyStagedBuild}=await import(pathToFileURL(join(source,'release-tools','verify-staged-build.mjs')).href);
    const {verifyPublicRelease}=await import(pathToFileURL(join(source,'release-tools','verify-public-release.mjs')).href);
    const fetcher=localFetcher(site,siteOrigin);
    for(const item of staged){
      const path=await verifyStagedBuild({build:item.build,origin:siteOrigin,config:plan.config,fetcher,crypto:webcrypto,timeoutMs:60000});
      if(path!==`/IronPath/releases/${item.build}/`)throw Error('Unexpected verified build path');
      const full=await verifyPublicRelease({origin:siteOrigin,manifestPath:join(releases,item.build,'release-manifest.json'),fetcher,timeoutMs:60000});
      if(full.fileCount!==item.fileCount)throw Error('Incomplete staged release');
    }
    const launcherFiles=await fileInventory(iron,`launcher/${plan.launcher}`);
    const index=await readFile(entry);launcherFiles['index.html']={bytes:index.length,sha256:hash(index)};
    const result={format:1,siteRevision:head,origin:siteOrigin,configSha256:plan.configSha256,
      launcher:plan.launcher,candidate:staged[0],rollback:staged[1]??null,launcherFiles};
    await writeFile(join(iron,'pages-release-plan.json'),`${JSON.stringify(result,null,2)}\n`,{flag:'wx'});
    await assertRegularTree(site);
    return result;
  } finally {await rm(temporary,{recursive:true,force:true});}
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [,,repoDir,outputDir,configFile,pinsFile]=process.argv;
  if(process.argv.length!==6 || !repoDir || !outputDir || !configFile || !pinsFile){
    console.error('Usage: node build-pages-site.mjs <repository-root> <new-output-directory> <public-config.json> <release-pins.json>');
    process.exitCode=2;
  }else{
    (async()=>{
      const [publicConfig,pins]=await Promise.all([configFile,pinsFile].map(async path=>JSON.parse(await readFile(path,'utf8'))));
      return buildPagesSite({repoDir,outputDir,pins,publicConfig});
    })().then(result=>console.log(JSON.stringify({siteRevision:result.siteRevision,candidate:result.candidate,
      rollback:result.rollback,launcher:result.launcher})))
      .catch(error=>{console.error(error.message);process.exitCode=1;});
  }
}
