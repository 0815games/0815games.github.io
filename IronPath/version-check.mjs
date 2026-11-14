// Client-side update coordination for the ordinary GitHub Pages build.
// This is a convenience check, not a security boundary or proof of executed code.
import {readBoundedJson} from './release-tools/bounded-json.mjs';

export const BUILD_ID_PATTERN=/^[a-z0-9][a-z0-9-]{0,63}$/;

export function parsePublishedVersion(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||
     Object.keys(value).sort().join(',')!=='build,format'||value.format!==1||
     typeof value.build!=='string'||!BUILD_ID_PATTERN.test(value.build))return null;
  return Object.freeze({build:value.build});
}

// Every call is a new server request. Firebase's cached get()/listener values
// are deliberately not used to establish that a build is current. The timeout
// also covers a stalled body and test fetchers that ignore AbortSignal.
export function createVersionProbe({url,origin,build,fetcher=globalThis.fetch,timeoutMs=8000}={}){
  let endpoint,site;
  try{endpoint=new URL(url);site=new URL(origin);}catch{throw Error('Invalid version URL');}
  if(site.origin!==origin||endpoint.origin!==origin||endpoint.username||endpoint.password||
     endpoint.search||endpoint.hash||!endpoint.pathname.endsWith('/release-version.json')||
     !['https:','http:'].includes(endpoint.protocol)||typeof build!=='string'||
     !BUILD_ID_PATTERN.test(build)||typeof fetcher!=='function'||
     !Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000)throw Error('Invalid version probe');
  let counter=0;
  return async function probe(){
    const controller=new AbortController();let timer;
    const aborted=new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('Version check timed out')),{once:true}));
    try{
      const request=new URL(endpoint.href);request.searchParams.set('probe',`${Date.now()}-${++counter}`);
      const work=(async()=>{
        const response=await fetcher(request.href,{method:'GET',cache:'no-store',credentials:'same-origin',redirect:'error',signal:controller.signal});
        if(!response?.ok)throw Error('Version unavailable');
        const published=parsePublishedVersion(await readBoundedJson(response,1024));
        if(!published)throw Error('Invalid version');
        return {kind:published.build===build?'current':'outdated',build:published.build};
      })();
      timer=setTimeout(()=>controller.abort(),timeoutMs);
      return await Promise.race([work,aborted]);
    }catch{return {kind:'unavailable'};}
    finally{clearTimeout(timer);controller.abort();}
  };
}

// Tracks the actual Firebase promise, not a watchdog racing it. A timed-out
// transaction may still be queued in the SDK and is not safe to abandon.
export function createWriteTracker(){
  const pending=new Set();
  return Object.freeze({
    track(work){
      const promise=Promise.resolve(work);pending.add(promise);
      void promise.then(()=>pending.delete(promise),()=>pending.delete(promise));
      return promise;
    },
    isIdle:()=>pending.size===0,
    getPendingCount:()=>pending.size
  });
}

// `safety` is evaluated again after the fresh check and immediately before
// navigation. No version change tears down a running operation or party. The
// owning UI must include every outstanding reward/save and open interaction in
// safety(), and keep blocking new starts when check() returns false.
export function createVersionCoordinator({probe,safety,onStatus,reload,setTimer=setTimeout,clearTimer=clearTimeout,
  retryMs=1000}={}){
  if(![probe,safety,onStatus,reload,setTimer,clearTimer].every(fn=>typeof fn==='function')||
     !Number.isInteger(retryMs)||retryMs<50)throw Error('Invalid version coordinator');
  let generation=0,pendingBuild=null,timer=null,closed=false,reloading=false,lastStatus='';
  function publish(kind,reason='',build=pendingBuild){
    const key=JSON.stringify([kind,reason,build]);if(key===lastStatus)return;lastStatus=key;
    onStatus({kind,reason,build});
  }
  function cancelTimer(){if(timer!==null){clearTimer(timer);timer=null;}}
  function schedule(){if(!closed&&pendingBuild&&!reloading&&timer===null)timer=setTimer(()=>{timer=null;void considerReload();},retryMs);}
  function safeReason(){try{return safety()||'saving';}catch{return 'saving';}}
  async function check(){
    if(closed||reloading)return false;
    const own=++generation;let result;
    try{result=await probe();}catch{result={kind:'unavailable'};}
    // An older request cannot grant a start or overwrite a newer decision.
    if(closed||reloading||own!==generation)return false;
    if(result?.kind==='current'){
      pendingBuild=null;cancelTimer();publish('current','',result.build);return true;
    }
    if(result?.kind==='outdated'&&typeof result.build==='string'&&BUILD_ID_PATTERN.test(result.build)){
      pendingBuild=result.build;publish('update',safeReason());schedule();return false;
    }
    publish('unavailable');if(pendingBuild)schedule();return false;
  }
  async function considerReload(){
    if(closed||reloading||!pendingBuild)return;
    let reason=safeReason();
    if(reason!=='ready'){publish('update',reason);schedule();return;}
    // Recheck the published version, then recheck all local save/party state in
    // the same task as the navigation. A rollback or outage cannot trigger a
    // stale reload. A new start uses check() too and invalidates this request.
    const own=++generation;let result;
    try{result=await probe();}catch{result={kind:'unavailable'};}
    if(closed||reloading||own!==generation){schedule();return;}
    if(result?.kind==='current'){pendingBuild=null;publish('current','',result.build);return;}
    if(result?.kind!=='outdated'||typeof result.build!=='string'||!BUILD_ID_PATTERN.test(result.build)){
      publish('unavailable');schedule();return;
    }
    pendingBuild=result.build;reason=safeReason();
    if(reason!=='ready'){publish('update',reason);schedule();return;}
    reloading=true;cancelTimer();publish('reloading','',pendingBuild);
    try{reload(pendingBuild);}catch{reloading=false;publish('unavailable');}
  }
  return Object.freeze({
    check,
    afterGame(){void check();},
    retry(){return check();},
    stop(){closed=true;generation++;cancelTimer();},
    state:()=>({pendingBuild,reloading})
  });
}
