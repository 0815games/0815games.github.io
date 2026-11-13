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
  const safely=fn=>{try{fn();}catch{/* Continue teardown even if a UI/SDK callback fails. */}};

  function leave(reason, target) {
    if (phase==='terminated') return transition;
    phase='terminated';
    // Synchronously freeze the page and stop the RTDB connection before any
    // asynchronous sign-out or navigation. A fresh document discards in-memory
    // queued writes; the server-side epoch is still the authoritative fence.
    safely(()=>onHold(reason));lifetime.abort();safely(goOffline);
    transition=(async()=>{
      let timer;
      const signout=Promise.resolve().then(signOut).catch(()=>{});
      const deadline=new Promise(resolve=>{timer=setTimeout(resolve,signOutTimeoutMs);});
      await Promise.race([signout,deadline]);clearTimeout(timer);
      safely(()=>replaceDocument(target));
    })();
    return transition;
  }
  return Object.freeze({
    accept(event){
      if (phase==='terminated') return transition;
      if (event?.kind==='checking' && phase==='checking') { safely(()=>onHold('checking'));return; }
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
    getPhase:()=>phase
  });
}
