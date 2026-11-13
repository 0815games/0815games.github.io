import {BUILD_PATTERN,parseReleaseControl,sameRelease} from './release-control.mjs';

// Candidate lifecycle controller, deliberately not connected to account.js.
// The consumer must begin with the entire UI blocked, load account/game code
// only inside onReady, honor its AbortSignal, use tab-scoped auth, and verify
// the signed token/epoch before any profile listener or write is started.
// Never reauthenticate the same RTDB instance across an epoch: its offline
// queue can otherwise be sent using the new identity. Origin-wide auth can also
// upgrade another tab; the consuming app must prevent that before enabling it.
// replaceDocument must perform a full navigation to a local maintenance page
// or isolated build, not an SPA transition or unrestricted redirect.
export function createRuntimeFence({build, onHold, onReady, goOffline, signOut, replaceDocument, signOutTimeoutMs=2000} = {}) {
  if (typeof build !== 'string' || !BUILD_PATTERN.test(build) ||
      ![onHold,onReady,goOffline,signOut,replaceDocument].every(fn=>typeof fn==='function') ||
      !Number.isInteger(signOutTimeoutMs) || signOutTimeoutMs<1) throw Error('Invalid runtime fence configuration');
  let phase='checking', accepted=null, transition=null;
  const lifetime=new AbortController();
  const safely=fn=>{try{
    const result=fn();
    if(result && typeof result.then==='function')void Promise.resolve(result).catch(()=>{});
  }catch{/* Continue teardown even if a UI/SDK callback fails. */}};
  const hold=reason=>{
    const result=onHold(reason);
    if(result && typeof result.then==='function'){
      void Promise.resolve(result).catch(()=>{});
      throw Error('The blocking UI callback must be synchronous');
    }
  };

  function leave(reason, target) {
    if (phase==='terminated') return transition;
    phase='terminated';
    // Assign the promise before callbacks: an abort/hold callback may reenter
    // stop(), which must see the same in-progress transition, not null.
    // This microtask cannot sign out until the synchronous fence below returns.
    transition=Promise.resolve().then(async()=>{
      let timer;
      const signout=Promise.resolve().then(signOut).catch(()=>{});
      const deadline=new Promise(resolve=>{timer=setTimeout(resolve,signOutTimeoutMs);});
      await Promise.race([signout,deadline]);clearTimeout(timer);
      safely(()=>replaceDocument(target));
    });
    // Synchronously freeze and disconnect before notifying application abort
    // listeners: those listeners may stop presence/lobbies and queue cleanup.
    // An already in-flight request still needs the server-side epoch fence.
    // A fresh document discards the in-memory queue before any new login.
    safely(()=>hold(reason));safely(goOffline);lifetime.abort();
    return transition;
  }
  return Object.freeze({
    accept(event){
      if (phase==='terminated') return transition;
      if (event?.kind==='checking' && phase==='checking') {
        try { hold('checking'); }
        catch { return leave('unavailable',{kind:'maintenance'}); }
        return;
      }
      if (event?.kind==='maintenance') return leave('maintenance',{kind:'maintenance'});
      if (event?.kind!=='open') return leave('unavailable',{kind:'maintenance'});
      const release=parseReleaseControl(event.release);
      if (!release || release.mode!=='open') return leave('unavailable',{kind:'maintenance'});
      if (release.build!==build || (accepted && !sameRelease(accepted,release))) {
        return leave('updating',{kind:'update',build:release.build});
      }
      if (phase==='checking') {
        accepted=release;phase='active';
        try {
          Promise.resolve(onReady({release,signal:lifetime.signal})).catch(()=>leave('unavailable',{kind:'maintenance'}));
        } catch { return leave('unavailable',{kind:'maintenance'}); }
      }
    },
    // Logout, a failed session exchange, or an external fatal error must tear
    // down the same way as a status change. The caller chooses a fixed local
    // destination for each target; this API never accepts a URL.
    stop(reason='unavailable'){
      if (reason==='logout') return leave('logout',{kind:'entry'});
      if (reason==='maintenance') return leave('maintenance',{kind:'maintenance'});
      if (reason==='updating') return leave('updating',{kind:'update'});
      if (reason==='unavailable') return leave('unavailable',{kind:'maintenance'});
      throw Error('Invalid teardown reason');
    },
    getPhase:()=>phase
  });
}
