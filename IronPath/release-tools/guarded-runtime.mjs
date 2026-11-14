// Experimental composition for a future guarded game document. Nothing here
// changes the published game, Firebase Rules, or the deployment process.
import {createGuardedGameSession,createSessionExchangeClient} from './game-session.mjs';
import {firebaseControlUrl,sameRelease} from './release-control.mjs';
import {createRuntimeFence} from './runtime-fence.mjs';
import {createReleaseStatusMonitor} from './status-monitor.mjs';

// Instances issued here can be mounted once only. Reusing an old RTDB/Auth
// instance can release old offline writes under a new identity. The caller must
// use the genuine Firebase SDK and must not alter persistence after creation.
const issued=new WeakMap(),claimedAuth=new WeakSet(),claimedDb=new WeakSet();
export function createIsolatedReleaseFirebase({config,sdk,configure=()=>{}} = {}) {
  if (!config || typeof config!=='object' || Array.isArray(config) ||
      !['initializeApp','initializeAuth','getDatabase'].every(name=>typeof sdk?.[name]==='function') ||
      !sdk.inMemoryPersistence || typeof configure!=='function') throw Error('Invalid Firebase configuration');
  const statusUrl=firebaseControlUrl(config.databaseURL);
  // Firebase initializeApp/initializeAuth can return an existing instance for
  // the same name and settings. Use a new random name AND reject any identity
  // already issued by this module, rather than accidentally reviving its queue.
  if (typeof globalThis.crypto?.getRandomValues!=='function') throw Error('Secure randomness unavailable');
  const bytes=globalThis.crypto.getRandomValues(new Uint8Array(16));
  const suffix=Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
  const gameApp=sdk.initializeApp(config,`ironpath-guarded-game-${suffix}`);
  const passwordApp=sdk.initializeApp(config,`ironpath-guarded-password-${suffix}`);
  const auth=sdk.initializeAuth(gameApp,{persistence:sdk.inMemoryPersistence});
  const passwordAuth=sdk.initializeAuth(passwordApp,{persistence:sdk.inMemoryPersistence});
  const db=sdk.getDatabase(gameApp);
  const isObject=value=>value!==null && (typeof value==='object'||typeof value==='function');
  if (![auth,passwordAuth,db].every(isObject) || auth===passwordAuth ||
      claimedAuth.has(auth) || claimedAuth.has(passwordAuth) || claimedDb.has(db)) throw Error('Invalid or reused Firebase instances');
  // Burn the identities even if emulator setup throws; partial setup must not
  // enable a later runtime to inherit these instances and their queues.
  claimedAuth.add(auth);claimedAuth.add(passwordAuth);claimedDb.add(db);
  // For emulator setup only; production must not replace auth persistence or
  // authenticate either instance here. The session also checks both are empty.
  const configured=configure({auth,passwordAuth,db});
  if(configured && typeof configured.then==='function'){
    void Promise.resolve(configured).catch(()=>{});
    throw Error('Firebase setup must be synchronous');
  }
  const resources=Object.freeze({auth,db});
  issued.set(resources,{auth,passwordAuth,db,sdk,statusUrl});
  return resources;
}

export function createGuardedRuntime({resources,build,statusUrl,sessionEndpoint,
  statusFetcher=globalThis.fetch,sessionFetcher=globalThis.fetch,intervalMs=5000,statusTimeoutMs=8000,
  sessionTimeoutMs=15000,signOutTimeoutMs=2000,onHold,onReady,replaceDocument} = {}) {
  const privateResources=issued.get(resources);
  if (!privateResources || ![onHold,onReady,replaceDocument].every(fn=>typeof fn==='function') ||
      !['goOffline','signOut'].every(name=>typeof privateResources.sdk?.[name]==='function')) {
    throw Error('Invalid guarded runtime configuration');
  }
  const {auth,passwordAuth,db,sdk}=privateResources;
  // Optional explicit statusUrl is accepted only if it names this app's exact
  // database control record. A typo or another project must not keep the UI
  // open while the actual database is in maintenance.
  if(statusUrl!==undefined && statusUrl!==privateResources.statusUrl)throw Error('Status URL does not match Firebase database');
  const exchange=createSessionExchangeClient({endpoint:sessionEndpoint,fetcher:sessionFetcher,timeoutMs:sessionTimeoutMs});
  let monitor,lastEvent=null,started=false;
  const fence=createRuntimeFence({build,signOutTimeoutMs,
    onHold:reason=>{
      if(reason!=='checking')monitor?.stop();
      return onHold(reason);
    },
    onReady:({release,signal})=>(async()=>{
      const refreshStatus=async()=>{
        if(signal.aborted || fence.getPhase()!=='active')throw Error('Release unavailable');
        // The monitor intentionally reports errors through onStatus rather than
        // throwing. Check the synchronously applied lifecycle state as well.
        await monitor.refresh();
        if(signal.aborted || fence.getPhase()!=='active' || lastEvent?.kind!=='open' ||
            !sameRelease(lastEvent.release,release))throw Error('Release unavailable');
      };
      const session=await createGuardedGameSession({auth,passwordAuth,db,release,build,signal,sdk,
        exchange,refreshStatus,onTerminate:reason=>{
          const valid=['logout','maintenance','updating','unavailable'].includes(reason)?reason:'unavailable';
          void fence.stop(valid);
        }});
      if(signal.aborted)return;
      await onReady({session,auth,db,release,signal});
    })(),
    goOffline:()=>sdk.goOffline(db),
    signOut:()=>Promise.allSettled([
      Promise.resolve().then(()=>sdk.signOut(auth)),
      Promise.resolve().then(()=>sdk.signOut(passwordAuth))
    ]),
    replaceDocument
  });
  monitor=createReleaseStatusMonitor({statusUrl:privateResources.statusUrl,fetcher:statusFetcher,intervalMs,timeoutMs:statusTimeoutMs,
    onStatus:event=>{lastEvent=event;void fence.accept(event);},
    onFatal:()=>{void fence.stop('unavailable');}
  });
  // A failed constructor above leaves the resources unused. Once mounted, they
  // cannot be paired with a new epoch even after stop or a failed startup.
  issued.delete(resources);
  return Object.freeze({
    start(){
      if(started || fence.getPhase()==='terminated')throw Error('Runtime cannot restart');
      started=true;monitor.start();
    },
    async refresh(){
      if(!started || fence.getPhase()==='terminated')throw Error('Release unavailable');
      await monitor.refresh();
      return fence.getPhase();
    },
    stop:(reason='unavailable')=>fence.stop(reason),
    getPhase:()=>fence.getPhase()
  });
}
