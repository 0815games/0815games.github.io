// Experimental bootstrap for an explicitly guarded staged game document. The
// page MUST be blocked and non-interactive in its initial HTML before this
// module runs. Its caller must perform real same-origin full-document navigation,
// never an SPA reset. This is not installed in the current published page.
import {createGuardedRuntime,createIsolatedReleaseFirebase} from './guarded-runtime.mjs';

function synchronous(callback,value) {
  const result=callback(value);
  if(result && typeof result.then==='function'){
    void Promise.resolve(result).catch(()=>{});
    throw Error('The game gate must change synchronously');
  }
}

export function createGuardedGameBootstrap({config,sdk,configure,build,statusUrl,sessionEndpoint,
  statusFetcher,sessionFetcher,intervalMs,statusTimeoutMs,sessionTimeoutMs,signOutTimeoutMs,
  installSession,importGame,onHold,showGame,replaceDocument} = {}) {
  if(![installSession,importGame,onHold,showGame,replaceDocument].every(fn=>typeof fn==='function')) {
    throw Error('Invalid guarded game bootstrap');
  }
  const resources=createIsolatedReleaseFirebase({config,sdk,configure});
  return createGuardedRuntime({resources,build,statusUrl,sessionEndpoint,
    statusFetcher,sessionFetcher,intervalMs,statusTimeoutMs,sessionTimeoutMs,signOutTimeoutMs,
    onHold,
    onReady:async context=>{
      if(context.signal.aborted)return;
      // account.js must receive exactly this session before it is imported and
      // may not fall back to its normal direct Firebase login in guarded HTML.
      synchronous(installSession,{session:context.session,signal:context.signal});
      if(context.signal.aborted)return;
      await importGame();
      // A late import may finish after maintenance or logout. Never uncover
      // the application again after the lifecycle signal was aborted.
      if(context.signal.aborted)return;
      synchronous(showGame);
    },
    replaceDocument
  });
}
