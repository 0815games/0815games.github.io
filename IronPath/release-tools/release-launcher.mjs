// Experimental stable-entry controller. It selects only a fixed same-origin
// version path and never imports game/auth code. Server rules, an independently
// verified deployment and a full-document navigation remain mandatory.
import {firebaseControlUrl,sameRelease} from './release-control.mjs';
import {createReleaseStatusMonitor} from './status-monitor.mjs';
import {validatePublicSiteConfig,validateSiteOrigin} from './public-site-config.mjs';
import {verifyStagedBuild} from './verify-staged-build.mjs';

function synchronous(callback,value){
  const result=callback(value);
  if(result && typeof result.then==='function'){
    void Promise.resolve(result).catch(()=>{});
    throw Error('Launcher callbacks must be synchronous');
  }
}

export function createReleaseLauncher({config,origin,fetcher=globalThis.fetch,verify=verifyStagedBuild,
  onView,navigate,manualRetry=false,intervalMs=5000,statusTimeoutMs=8000,verifyTimeoutMs=15000} = {}) {
  const publicConfig=validatePublicSiteConfig(config),statusUrl=firebaseControlUrl(publicConfig.firebase.databaseURL);
  validateSiteOrigin(origin);
  if(typeof fetcher!=='function' || typeof verify!=='function' ||
      typeof onView!=='function' || typeof navigate!=='function' || typeof manualRetry!=='boolean' ||
      !Number.isInteger(verifyTimeoutMs) || verifyTimeoutMs<1 || verifyTimeoutMs>60000)throw Error('Invalid launcher configuration');
  let running=false,started=false,manual=manualRetry,latest=null,revision=0,attempt=null,monitor;
  const view=state=>synchronous(onView,state);
  function stop(){
    if(!running)return;
    running=false;revision++;attempt?.controller.abort();monitor.stop();
  }
  function fatal(){
    stop();
    try{view('unavailable');}catch{/* Initial markup stays blocked even if the renderer is broken. */}
  }
  const current=job=>running && !manual && revision===job.revision && latest?.kind==='open' &&
    sameRelease(latest.release,job.release) && !job.controller.signal.aborted;
  function begin(release){
    if(!running || manual || attempt)return;
    const job={release,revision,controller:new AbortController()};attempt=job;
    try{view('updating');}catch{fatal();attempt=null;return;}
    void (async()=>{
      try{
        const path=await verify({build:release.build,origin,config:publicConfig,fetcher,
          signal:job.controller.signal,timeoutMs:verifyTimeoutMs});
        if(!current(job))return;
        // The first refresh may still be the original in-flight status check.
        // The second must start after it has settled and freshly reconfirm the
        // same release immediately before navigation.
        await monitor.refresh();if(!current(job))return;
        await monitor.refresh();if(!current(job))return;
        if(path!==`/IronPath/releases/${release.build}/`)throw Error('Invalid build destination');
        synchronous(navigate,path);stop();
      }catch{
        if(current(job)){
          // A missing/corrupt build or failed navigation must not loop and
          // repeatedly load an old or partial game. Retry requires a click.
          manual=true;
          try{view('unavailable');}catch{fatal();}
        }
      }finally{
        if(attempt===job)attempt=null;
        // A newer open status can arrive while the previous build check is
        // aborting. Once it has settled, start only the current generation.
        if(running && !manual && revision!==job.revision && latest?.kind==='open'){
          queueMicrotask(()=>{if(running && !attempt && !manual && latest?.kind==='open')begin(latest.release);});
        }
      }
    })();
  }
  function onStatus(event){
    const changed=!latest || latest.kind!==event.kind ||
      ((event.kind==='open' || event.kind==='maintenance') && !sameRelease(latest.release,event.release));
    if(changed){revision++;attempt?.controller.abort();}
    latest=event;
    if(event.kind==='checking')view('checking');
    else if(event.kind==='maintenance')view('maintenance');
    else if(event.kind!=='open' || manual)view('unavailable');
    else if(!attempt)begin(event.release);
  }
  monitor=createReleaseStatusMonitor({statusUrl,fetcher,intervalMs,timeoutMs:statusTimeoutMs,onStatus,onFatal:fatal});
  return Object.freeze({
    start(){if(started)throw Error('Launcher cannot restart');started=true;running=true;monitor.start();},
    refresh(){return running?monitor.refresh():Promise.resolve();},
    retry(){
      if(!running)return Promise.resolve();
      manual=false;revision++;attempt?.controller.abort();latest=null;
      try{view('checking');}catch{fatal();return Promise.resolve();}
      return monitor.refresh();
    },
    stop
  });
}
