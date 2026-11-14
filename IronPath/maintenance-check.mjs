// Maintenance signal for the ordinary Firebase/Pages deployment. The public
// record coordinates honest clients; only Firebase Rules enforce data access.
// Neither this signal nor auth_time proves which JavaScript a browser executed.
import {readBoundedJson} from './release-tools/bounded-json.mjs';

export const MAINTENANCE_PATH='_ironpathMaintenance';

export function parseMaintenanceControl(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!=='authAfterMs,format,mode'||
    value.format!==1||!['open','maintenance'].includes(value.mode)||
    !Number.isSafeInteger(value.authAfterMs)||value.authAfterMs<0)return null;
 return Object.freeze({format:1,mode:value.mode,authAfterMs:value.authAfterMs});
}

export function isSessionAfterCutoff(authTimeSeconds,cutoffMs){
 return Number.isSafeInteger(authTimeSeconds)&&authTimeSeconds>0&&Number.isSafeInteger(cutoffMs)&&cutoffMs>=0&&
  Number.isSafeInteger(authTimeSeconds*1000)&&authTimeSeconds*1000>cutoffMs;
}

export function createMaintenanceProbe({databaseUrl,fetcher=globalThis.fetch,timeoutMs=8000}={}){
 let base;try{base=new URL(databaseUrl);}catch{throw Error('Invalid Firebase database URL');}
 if(base.protocol!=='https:'||base.username||base.password||base.port||base.pathname!=='/'||base.search||base.hash||
    !/^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:firebasedatabase\.app|firebaseio\.com)$/.test(base.hostname)||
    typeof fetcher!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000)throw Error('Invalid Firebase maintenance probe');
 base.pathname=`/${MAINTENANCE_PATH}.json`;let sequence=0;
 return async()=>{
  const controller=new AbortController();let timer;
  const timeout=new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('Maintenance check timed out')),{once:true}));
  try{
   const url=new URL(base.href);url.searchParams.set('probe',`${Date.now()}-${++sequence}`);
   const work=(async()=>{
    const response=await fetcher(url.href,{method:'GET',cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});
    if(!response?.ok)throw Error('Maintenance status unavailable');
    const control=parseMaintenanceControl(await readBoundedJson(response,1024));
    if(!control)throw Error('Invalid maintenance status');return control;
   })();
   timer=setTimeout(()=>controller.abort(),timeoutMs);
   return await Promise.race([work,timeout]);
  }catch{return null;}
  finally{clearTimeout(timer);controller.abort();}
 };
}

// A newly opened page obtains `initial` using the REST probe *before* Auth or
// profile initialization. The RTDB listener then detects maintenance and a
// rotated cutoff while the page is open. This cannot notify an offline device
// until it reconnects; the paired Rules still deny server reads/writes closed.
export function createMaintenanceMonitor({initial,subscribe,onHalt}={}){
 const expected=parseMaintenanceControl(initial);
 if(!expected||expected.mode!=='open'||typeof subscribe!=='function'||typeof onHalt!=='function')throw Error('Invalid maintenance monitor');
 let stopped=false,unsubscribe=null;
 function halt(reason){if(stopped)return;stopped=true;try{unsubscribe?.();}catch{}onHalt(reason);}
 function accept(value){
  if(stopped)return;const control=parseMaintenanceControl(value);
  if(!control)return halt('unavailable');
  if(control.mode==='maintenance')return halt('maintenance');
  if(control.authAfterMs!==expected.authAfterMs)return halt('session');
 }
 try{unsubscribe=subscribe(accept,()=>halt('unavailable'));if(stopped)unsubscribe?.();}
 catch{halt('unavailable');}
 return Object.freeze({stop(){if(!stopped){stopped=true;try{unsubscribe?.();}catch{}}},isStopped:()=>stopped});
}
