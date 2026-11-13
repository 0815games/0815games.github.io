// Limited readiness check for an experimental staged build. These hashes catch
// incomplete or inconsistent critical files, not malicious hosting, a service
// worker, later file changes or missing non-critical assets. A deployment must
// separately verify its entire public inventory before opening the release.
import {BUILD_PATTERN} from './release-control.mjs';
import {readBoundedBytes,readBoundedJson} from './bounded-json.mjs';
import {formatPublicSiteConfig,validatePublicSiteConfig,validateSiteOrigin} from './public-site-config.mjs';

export const CRITICAL_RELEASE_FILES=Object.freeze([
  'index.html','account.js','account-services.mjs','release-config.mjs',
  'release-tools/guarded-game-entry.mjs','release-tools/public-site-config.mjs',
  'release-tools/guarded-game-bootstrap.mjs','release-tools/guarded-runtime.mjs',
  'release-tools/game-session.mjs','release-tools/release-control.mjs',
  'release-tools/runtime-fence.mjs','release-tools/status-monitor.mjs','release-tools/bounded-json.mjs'
]);
const MAX_MANIFEST_BYTES=1024*1024,MAX_FILE_BYTES=2*1024*1024;
const hashPattern=/^[a-f0-9]{64}$/;

export async function verifyStagedBuild({build,origin,config,fetcher=globalThis.fetch,crypto=globalThis.crypto,
  signal,timeoutMs=15000} = {}) {
  if(typeof build!=='string' || !BUILD_PATTERN.test(build) || typeof fetcher!=='function' ||
      typeof crypto?.subtle?.digest!=='function' || !Number.isInteger(timeoutMs) || timeoutMs<1 || timeoutMs>60000 ||
      (signal!==undefined && (!signal || typeof signal.addEventListener!=='function')))throw Error('Invalid build check');
  const publicConfig=validatePublicSiteConfig(config);
  const siteOrigin=validateSiteOrigin(origin);
  const base=`${siteOrigin}/IronPath/releases/${build}/`;
  const controller=new AbortController(),abort=()=>controller.abort();
  if(signal?.aborted)controller.abort();else signal?.addEventListener('abort',abort,{once:true});
  let timer;
  const aborted=new Promise((_,reject)=>{
    if(controller.signal.aborted)reject(Error('Build check aborted'));
    else controller.signal.addEventListener('abort',()=>reject(Error('Build check aborted')),{once:true});
  });
  const get=async name=>{
    const response=await fetcher(base+name,{method:'GET',cache:'no-store',credentials:'omit',mode:'same-origin',
      redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal});
    if(!response?.ok)throw Error('Build unavailable');
    return response;
  };
  const work=(async()=>{
    const inventory=await readBoundedJson(await get('release-manifest.json'),MAX_MANIFEST_BYTES);
    if(!inventory || typeof inventory!=='object' || Array.isArray(inventory) || inventory.format!==1 ||
        inventory.build!==build || inventory.guarded!==true || !inventory.files || typeof inventory.files!=='object' ||
        Array.isArray(inventory.files) || Object.keys(inventory.files).length>10000)throw Error('Invalid build inventory');
    const entries=CRITICAL_RELEASE_FILES.map(name=>{
      const entry=Object.hasOwn(inventory.files,name)?inventory.files[name]:null;
      if(!entry || typeof entry!=='object' || Array.isArray(entry) || !Number.isSafeInteger(entry.bytes) ||
          entry.bytes<1 || entry.bytes>MAX_FILE_BYTES || typeof entry.sha256!=='string' || !hashPattern.test(entry.sha256)) {
        throw Error('Incomplete build inventory');
      }
      return [name,entry];
    });
    const files=Object.fromEntries(await Promise.all(entries.map(async([name,entry])=>{
      const bytes=await readBoundedBytes(await get(name),entry.bytes);
      if(bytes.length!==entry.bytes)throw Error('Incomplete build');
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      if(actual!==entry.sha256)throw Error('Inconsistent build');
      return [name,bytes];
    })));
    const decode=bytes=>new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    if(decode(files['release-config.mjs'])!==formatPublicSiteConfig(publicConfig))throw Error('Build configuration differs from launcher');
    const html=decode(files['index.html']);
    const once=text=>html.split(text).length===2;
    if(!once(`<html lang="en" data-ironpath-guard="required" data-ironpath-release-build="${build}">`) ||
        !once('<div id="ironpath-guarded-game" hidden inert>') || !once('id="ironpath-guarded-hold"') ||
        !once('<script type="module" src="release-tools/guarded-game-entry.mjs"></script>') ||
        /<script\b[^>]*\bsrc=["']account\.js(?:\?[^"']*)?["']/i.test(html)) {
      throw Error('Build does not have the required blocked entry');
    }
    return `/IronPath/releases/${build}/`;
  })();
  try{
    timer=setTimeout(abort,timeoutMs);
    return await Promise.race([work,aborted]);
  }finally{
    clearTimeout(timer);signal?.removeEventListener('abort',abort);controller.abort();
  }
}
