// Operator-side comparison of a deployed version against the *local trusted*
// staging inventory. This performs no deployment and does not open a release.
// It is a point-in-time file check, not protection against later changes, stale
// service workers, compromised origins, missing launcher files or bad rules.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {BUILD_PATTERN} from './release-control.mjs';
import {readBoundedBytes} from './bounded-json.mjs';
import {CRITICAL_RELEASE_FILES} from './verify-staged-build.mjs';
import {validateSiteOrigin} from './public-site-config.mjs';

const MAX_MANIFEST=1024*1024,MAX_FILE=32*1024*1024,MAX_TOTAL=1024*1024*1024;
const safePath=/^[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
const hashPattern=/^[a-f0-9]{64}$/;

export async function verifyPublicRelease({origin,manifestPath,fetcher=globalThis.fetch,concurrency=4,timeoutMs=30000} = {}) {
  if(typeof manifestPath!=='string' || !manifestPath || typeof fetcher!=='function' ||
      !Number.isInteger(concurrency) || concurrency<1 || concurrency>8 ||
      !Number.isInteger(timeoutMs) || timeoutMs<1 || timeoutMs>120000)throw Error('Invalid public verification settings');
  const siteOrigin=validateSiteOrigin(origin);
  const local=await readFile(manifestPath);
  if(local.length>MAX_MANIFEST)throw Error('Invalid local release inventory');
  let inventory;
  try{inventory=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(local));}catch{throw Error('Invalid local release inventory');}
  if(!inventory || typeof inventory!=='object' || Array.isArray(inventory) || inventory.format!==1 ||
      inventory.guarded!==true || typeof inventory.build!=='string' || !BUILD_PATTERN.test(inventory.build) ||
      !inventory.files || typeof inventory.files!=='object' || Array.isArray(inventory.files))throw Error('Invalid local release inventory');
  const names=Object.keys(inventory.files).sort();
  if(names.length<CRITICAL_RELEASE_FILES.length || names.length>10000 ||
      !CRITICAL_RELEASE_FILES.every(name=>Object.hasOwn(inventory.files,name)))throw Error('Incomplete local release inventory');
  let totalBytes=0;
  for(const name of names){
    const entry=inventory.files[name];
    if(!safePath.test(name) || name.split('/').some(part=>part==='.'||part==='..') || name==='release-manifest.json' ||
        !entry || typeof entry!=='object' || Array.isArray(entry) || !Number.isSafeInteger(entry.bytes) ||
        entry.bytes<0 || entry.bytes>MAX_FILE || typeof entry.sha256!=='string' || !hashPattern.test(entry.sha256)) {
      throw Error('Invalid local release inventory');
    }
    totalBytes+=entry.bytes;if(totalBytes>MAX_TOTAL)throw Error('Release inventory too large');
  }
  const base=`${siteOrigin}/IronPath/releases/${inventory.build}/`,all=new AbortController();
  async function request(name,consume){
    const controller=new AbortController(),abort=()=>controller.abort();
    if(all.signal.aborted)controller.abort();else all.signal.addEventListener('abort',abort,{once:true});
    const aborted=new Promise((_,reject)=>{
      if(controller.signal.aborted)reject(Error('aborted'));
      else controller.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});
    });
    const work=(async()=>{
      const response=await fetcher(base+name,{method:'GET',cache:'no-store',credentials:'omit',redirect:'error',
        headers:{'cache-control':'no-cache'},signal:controller.signal});
      if(!response?.ok)throw Error('unavailable');
      return consume(response);
    })();
    let timer;
    try{timer=setTimeout(abort,timeoutMs);return await Promise.race([work,aborted]);}
    catch{throw Error(`Public release check failed: ${name}`);}
    finally{clearTimeout(timer);all.signal.removeEventListener('abort',abort);controller.abort();}
  }
  try{
    const remote=await request('release-manifest.json',response=>readBoundedBytes(response,MAX_MANIFEST));
    if(!Buffer.from(remote).equals(local))throw Error('Public release manifest differs from the local inventory');
    let next=0;
    async function worker(){
      while(next<names.length){
        const name=names[next++],entry=inventory.files[name];
        await request(name,async response=>{
          if(!response.body?.getReader)throw Error('missing body');
          const reader=response.body.getReader(),hash=createHash('sha256');let size=0,finished=false;
          try{
            for(;;){
              const {done,value}=await reader.read();
              if(done){finished=true;break;}
              if(!(value instanceof Uint8Array))throw Error('invalid body');
              size+=value.byteLength;if(size>entry.bytes)throw Error('oversized body');
              hash.update(value);
            }
          }finally{if(!finished)void reader.cancel().catch(()=>{});reader.releaseLock();}
          if(size!==entry.bytes || hash.digest('hex')!==entry.sha256)throw Error('content mismatch');
        });
      }
    }
    await Promise.all(Array.from({length:Math.min(concurrency,names.length)},()=>worker()));
    return {build:inventory.build,fileCount:names.length,totalBytes};
  }catch(error){all.abort();throw error;}
  finally{all.abort();}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [,,origin,manifestPath]=process.argv;
  if(process.argv.length!==4 || !origin || !manifestPath){
    console.error('Usage: node verify-public-release.mjs <site-origin> <local-release-manifest.json>');process.exitCode=2;
  }else{
    verifyPublicRelease({origin,manifestPath}).then(result=>console.log(JSON.stringify(result)))
      .catch(error=>{console.error(error.message);process.exitCode=1;});
  }
}
