// Experimental adapter for a future guarded game document. This is not wired
// into the currently published game. A new document gets new in-memory Auth and
// RTDB instances; it may authorize the game instance at most once. Never move
// an old offline RTDB queue to a new session or synchronize auth across tabs.
import {BUILD_PATTERN, parseReleaseControl, isAuthAfterCutoff} from './release-control.mjs';
import {readBoundedJson} from './bounded-json.mjs';

function error(code) { const result = Error('Release session unavailable'); result.code = code; return result; }

export function createSessionExchangeClient({endpoint, fetcher=globalThis.fetch, timeoutMs=15000} = {}) {
  let url;
  try { url = new URL(endpoint); } catch { throw Error('Invalid session endpoint'); }
  if (url.protocol!=='https:' || url.username || url.password || url.search || url.hash ||
      url.pathname!=='/api/session' || typeof fetcher!=='function' ||
      !Number.isInteger(timeoutMs) || timeoutMs<1 || timeoutMs>60000) throw Error('Invalid session endpoint');
  return async function exchange({idToken, build, signal} = {}) {
    if (typeof idToken!=='string' || !idToken || idToken.length>8192 || /\s/.test(idToken) ||
        typeof build!=='string' || !BUILD_PATTERN.test(build) || !signal) throw error('release/invalid');
    if (signal.aborted) throw error('release/unavailable');
    const controller=new AbortController();let timer;
    const abort=()=>controller.abort();signal.addEventListener('abort',abort,{once:true});
    const aborted=new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(error('release/unavailable')),{once:true}));
    const work=(async()=>{
      const response=await fetcher(url.href,{method:'POST',mode:'cors',cache:'no-store',credentials:'omit',
        redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal,
        headers:{'content-type':'application/json','authorization':`Bearer ${idToken}`},body:JSON.stringify({build})});
      let body;try{body=await readBoundedJson(response,20000);}catch{throw error('release/unavailable');}
      if(response.status===200 && body?.status==='ok' && typeof body.customToken==='string' &&
          body.customToken.length>0 && body.customToken.length<=16384 && !/\s/.test(body.customToken)) {
        return {status:'ok',customToken:body.customToken};
      }
      if(['maintenance','outdated','unauthorized','invalid','unavailable'].includes(body?.status))return {status:body.status};
      return {status:'unavailable'};
    })();
    try {timer=setTimeout(abort,timeoutMs);return await Promise.race([work,aborted]);}
    finally {clearTimeout(timer);signal.removeEventListener('abort',abort);}
  };
}

// sdk provides the unwrapped Firebase Web SDK methods. refreshStatus must force
// a fresh control check and synchronously initiate teardown on any change.
// onTerminate must synchronously freeze UI and stop RTDB before navigation.
export async function createGuardedGameSession({auth, passwordAuth, db, release, build, signal,
  sdk, refreshStatus, exchange, onTerminate} = {}) {
  const accepted=parseReleaseControl(release);
  const required=['beforeAuthStateChanged','onAuthStateChanged','signInWithEmailAndPassword','createUserWithEmailAndPassword',
    'signInWithCustomToken','signOut','sendPasswordResetEmail'];
  if (!auth || !passwordAuth || auth===passwordAuth || !db || !accepted || accepted.mode!=='open' ||
      accepted.build!==build || !signal || typeof signal.addEventListener!=='function' ||
      !required.every(name=>typeof sdk?.[name]==='function') ||
      ![refreshStatus,exchange,onTerminate].every(fn=>typeof fn==='function') ||
      typeof auth.authStateReady!=='function' || typeof passwordAuth.authStateReady!=='function') {
    throw Error('Invalid guarded session configuration');
  }
  let state='initializing', approved=null, stopped=false, unwatch=null, expectedUid=null, admissionUsed=false;
  const listeners=new Set();
  function terminate(reason) {
    if(stopped)return;
    stopped=true;state='terminated';
    try{onTerminate(reason);}catch{/* The embedding fence must still own teardown. */}
  }
  const alive=()=>{if(stopped||signal.aborted)throw error('release/unavailable');};
  const notify=()=>{
    for(const observer of listeners){
      // A previous observer can synchronously request logout or throw. Never
      // deliver a user to later consumers once teardown has begun.
      if(stopped || signal.aborted)break;
      const user=approved;
      if(observer.last===user)continue;
      observer.last=user;
      try{observer.next(user);}catch{terminate('unavailable');}
    }
  };
  signal.addEventListener('abort',()=>{stopped=true;state='terminated';try{unwatch?.();}catch{}},{once:true});
  await Promise.all([auth.authStateReady(),passwordAuth.authStateReady()]);alive();
  if(auth.currentUser || passwordAuth.currentUser){terminate('unavailable');throw error('release/unavailable');}
  // Firebase's blocking hook runs before currentUser changes and before RTDB
  // receives the new token. Keep it installed even after abort: an in-flight
  // sign-in completing late must not authorize this old database instance.
  sdk.beforeAuthStateChanged(auth, async candidate=>{
    if(stopped || signal.aborted){if(candidate===null)return;throw error('release/unavailable');}
    if(state!=='entering' || !candidate || admissionUsed){
      terminate('unavailable');
      if(candidate!==null)throw error('release/unavailable');
      return;
    }
    admissionUsed=true;
    try{
      const claims=(await candidate.getIdTokenResult())?.claims;alive();
      if(candidate.uid!==expectedUid || claims?.firebase?.sign_in_provider!=='custom' ||
          claims.ip_release_epoch!==accepted.epoch || !isAuthAfterCutoff(claims.auth_time,accepted.authAfterMs)) {
        throw error('release/unavailable');
      }
      await checked();
    }catch{terminate('unavailable');throw error('release/unavailable');}
  });
  state='idle';
  unwatch=sdk.onAuthStateChanged(auth, observed=>{
    if(stopped||signal.aborted)return;
    // Ignore a delayed observer notification that no longer matches SDK state.
    if(observed!==auth.currentUser)return;
    if((state==='idle'||state==='password'||state==='resetting') && observed)terminate('unavailable');
    if(state==='active' && observed!==approved)terminate('unavailable');
  },()=>{
    // An Auth observer failure is a fatal guarded-document error, not an
    // invitation to redisplay the normal login form inside the old document.
    terminate('unavailable');
  });

  async function checked() {
    alive();
    try{await refreshStatus();}catch{terminate('unavailable');throw error('release/unavailable');}
    alive();
  }
  async function enter(kind,email,password) {
    alive();if(state!=='idle')throw error('release/busy');
    state='password';let gameAttempted=false, temporarySignedOut=false;
    try {
      await checked();
      const signed=await (kind==='register' ? sdk.createUserWithEmailAndPassword : sdk.signInWithEmailAndPassword)(passwordAuth,email,password);
      alive();
      const uid=signed?.user?.uid;
      if(typeof uid!=='string'||!uid||uid.length>128)throw error('release/unavailable');
      const idToken=await signed.user.getIdToken();alive();
      let result;
      try{result=await exchange({idToken,build,signal});}
      catch{terminate('unavailable');throw error('release/unavailable');}
      if(result?.status!=='ok'){
        terminate(result?.status==='outdated'?'updating':result?.status==='maintenance'?'maintenance':'unavailable');
        throw error('release/unavailable');
      }
      try{await sdk.signOut(passwordAuth);temporarySignedOut=true;}
      catch{terminate('unavailable');throw error('release/unavailable');}
      alive();
      await checked();
      // From this point onward, any failure must replace the whole document.
      // Even signInWithCustomToken's rejected promise may have touched SDK state.
      expectedUid=uid;gameAttempted=true;state='entering';
      const gameCredential=await sdk.signInWithCustomToken(auth,result.customToken);alive();
      const gameUser=gameCredential?.user;
      const claims=(await gameUser?.getIdTokenResult())?.claims;alive();
      if(!admissionUsed || !gameUser || gameUser.uid!==uid || auth.currentUser!==gameUser ||
          claims?.firebase?.sign_in_provider!=='custom' || claims.ip_release_epoch!==accepted.epoch ||
          !isAuthAfterCutoff(claims.auth_time,accepted.authAfterMs)) {
        throw error('release/unavailable');
      }
      await checked();
      if(auth.currentUser!==gameUser)throw error('release/unavailable');
      approved=gameUser;state='active';notify();alive();
      return gameCredential;
    } catch(failure) {
      if(gameAttempted)terminate('unavailable');
      throw failure;
    } finally {
      if(!temporarySignedOut){
        try{await sdk.signOut(passwordAuth);}catch{terminate('unavailable');}
      }
      // A retry must not race the previous temporary-auth cleanup.
      if(!gameAttempted && !stopped && !signal.aborted)state='idle';
    }
  }
  return Object.freeze({
    auth,db,
    onAuthStateChanged(next){
      if(typeof next!=='function')throw Error('Missing auth observer');
      const observer={next,last:Symbol('not-delivered')};listeners.add(observer);
      queueMicrotask(()=>{if(listeners.has(observer)&&!stopped)notify();});
      return ()=>listeners.delete(observer);
    },
    signIn:(email,password)=>enter('signin',email,password),
    register:(email,password)=>enter('register',email,password),
    async resetPassword(email){
      alive();if(state!=='idle')throw error('release/busy');
      state='resetting';
      try{await checked();await sdk.sendPasswordResetEmail(passwordAuth,email);alive();}
      finally{if(!stopped&&!signal.aborted)state='idle';}
    },
    logout(){terminate('logout');},
    getState:()=>state
  });
}
