import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createGuardedGameSession,createSessionExchangeClient} from '../release-tools/game-session.mjs';

const release={mode:'open',build:'release-1',epoch:'a'.repeat(32),authAfter:1000};
const claims={firebase:{sign_in_provider:'custom'},ip_release_epoch:release.epoch,auth_time:1001};
const user=(uid,tokenClaims=claims)=>({uid,getIdToken:async()=>`password-token-${uid}`,getIdTokenResult:async()=>({claims:tokenClaims})});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
async function setup(override={}){
 const calls=[],terminations=[],controller=new AbortController(),observers=[];
 const auth={currentUser:null,authStateReady:async()=>{}},passwordAuth={currentUser:null,authStateReady:async()=>{}},db={};
 let sdkObserver;
 const sdk={
  beforeAuthStateChanged:(a,next)=>{a._before=next;return ()=>calls.push('unwatch-before');},
  onAuthStateChanged:(_auth,next)=>{sdkObserver=next;queueMicrotask(()=>next(auth.currentUser));return ()=>calls.push('unwatch');},
  signInWithEmailAndPassword:async(a,email)=>{calls.push('password');return {user:a.currentUser=user(email)};},
  createUserWithEmailAndPassword:async(a,email)=>{calls.push('register');return {user:a.currentUser=user(email)};},
  signInWithCustomToken:async(a)=>{calls.push('custom');const u=user(passwordAuth._expectedUid||'alice');await a._before(u);a.currentUser=u;sdkObserver(u);return {user:u};},
  signOut:async(a)=>{calls.push(a===auth?'game-signout':'password-signout');a.currentUser=null;},
  sendPasswordResetEmail:async()=>calls.push('reset')
 };
 const opts={auth,passwordAuth,db,release,build:release.build,signal:controller.signal,sdk,
  refreshStatus:async()=>calls.push('status'),
  exchange:async({idToken})=>{calls.push('exchange');assert.equal(idToken,'password-token-alice');return {status:'ok',customToken:'custom-token'};},
  onTerminate:reason=>{terminations.push(reason);controller.abort();},...override};
 Object.assign(sdk,override.sdk||{});opts.sdk=sdk;
 const session=await createGuardedGameSession(opts);
 session.onAuthStateChanged(value=>observers.push(value?.uid??null));await new Promise(resolve=>queueMicrotask(resolve));
 return {session,auth,passwordAuth,db,sdk,calls,terminations,controller,observers,emit:u=>{auth.currentUser=u;sdkObserver(u);}};
}

test('only an authenticated, matching custom session reaches the real game observer',async()=>{
 const h=await setup();assert.deepEqual(h.observers,[null]);
 await h.session.signIn('alice','password');
 assert.equal(h.session.getState(),'active');assert.deepEqual(h.observers,[null,'alice']);
 assert.deepEqual(h.calls,['status','password','exchange','password-signout','status','custom','status','status']);
 assert.equal(h.passwordAuth.currentUser,null);assert.equal(h.session.auth,h.auth);assert.equal(h.session.db,h.db);
 await assert.rejects(h.session.signIn('alice','password'),/unavailable/);
 h.session.logout();assert.deepEqual(h.terminations,['logout']);assert.equal(h.controller.signal.aborted,true);
});

test('registration uses the separate temporary auth before a single game sign-in',async()=>{
 const h=await setup();await h.session.register('alice','password');
 assert.ok(h.calls.includes('register'));assert.equal(h.observers.at(-1),'alice');
});

test('incorrect password may be retried before game authentication; concurrent attempts cannot start',async()=>{
 const wait=deferred();let attempts=0;
 const h=await setup({sdk:{signInWithEmailAndPassword:async(a)=>{attempts++;if(attempts===1){const e=Error('incorrect');e.code='auth/invalid-credential';throw e;}await wait.promise;return {user:a.currentUser=user('alice')};}}});
 await assert.rejects(h.session.signIn('alice','wrong'),{code:'auth/invalid-credential'});
 assert.equal(h.session.getState(),'idle');assert.deepEqual(h.terminations,[]);
 const pending=h.session.signIn('alice','right');
 await assert.rejects(h.session.signIn('alice','right'),{code:'release/busy'});
 wait.resolve();await pending;assert.equal(h.session.getState(),'active');
});

test('maintenance, stale status or exchange failure terminates before game auth',async()=>{
 for(const result of [{status:'maintenance'},{status:'outdated'},{status:'unavailable'}]){
  const h=await setup({exchange:async()=>result});await assert.rejects(h.session.signIn('alice','p'));
  assert.equal(h.calls.includes('custom'),false);assert.equal(h.terminations.length,1);assert.deepEqual(h.observers,[null]);
 }
 const failed=await setup({refreshStatus:async()=>{throw Error('offline');}});
 await assert.rejects(failed.session.signIn('alice','p'));assert.deepEqual(failed.terminations,['unavailable']);assert.equal(failed.calls.includes('password'),false);
});

test('a wrong uid, provider, epoch or authentication time terminates the document before any profile callback',async()=>{
 for(const [uid,badClaims] of [['bob',claims],['alice',{...claims,ip_release_epoch:'b'.repeat(32)}],
  ['alice',{...claims,firebase:{sign_in_provider:'password'}}],['alice',{...claims,auth_time:1000}]]){
  const h=await setup({sdk:{signInWithCustomToken:async(a)=>{const value=user(uid,badClaims);await a._before(value);a.currentUser=value;return {user:value};}}});
  await assert.rejects(h.session.signIn('alice','p'));assert.deepEqual(h.terminations,['unavailable']);assert.deepEqual(h.observers,[null]);
 }
});

test('abort during exchange never authenticates the game and unexpected auth changes terminate it',async()=>{
 const wait=deferred();const h=await setup({exchange:async()=>wait.promise});
 const pending=h.session.signIn('alice','p');
 await new Promise(resolve=>setImmediate(resolve));h.controller.abort();wait.resolve({status:'ok',customToken:'x'});
 await assert.rejects(pending);assert.equal(h.calls.includes('custom'),false);assert.deepEqual(h.observers,[null]);
 const other=await setup();other.emit(user('intruder'));assert.deepEqual(other.terminations,['unavailable']);
});

test('one observer terminating the document prevents later observers from starting profile work',async()=>{
 const h=await setup(),later=[];
 h.session.onAuthStateChanged(value=>{if(value)h.session.logout();});
 h.session.onAuthStateChanged(value=>later.push(value?.uid??null));
 await new Promise(resolve=>queueMicrotask(resolve));
 await assert.rejects(h.session.signIn('alice','password'),{code:'release/unavailable'});
 assert.deepEqual(h.terminations,['logout']);assert.deepEqual(later,[null]);
});

test('a retry cannot race cleanup of the temporary password identity',async()=>{
 const cleanup=deferred();
 const h=await setup({sdk:{
  signInWithEmailAndPassword:async()=>{throw Object.assign(Error('incorrect'),{code:'auth/invalid-credential'});},
  signOut:async()=>cleanup.promise
 }});
 const pending=h.session.signIn('alice','wrong');
 // Capture the rejection before it is resolved by the delayed cleanup.
 const failure=assert.rejects(pending,{code:'auth/invalid-credential'});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.session.getState(),'password');
 await assert.rejects(h.session.signIn('alice','right'),{code:'release/busy'});
 cleanup.resolve();await failure;assert.equal(h.session.getState(),'idle');
});

test('the blocking auth hook refuses a same-uid reauthentication before RTDB can adopt it',async()=>{
 const h=await setup();await h.session.signIn('alice','password');
 const original=h.auth.currentUser;
 await assert.rejects(h.auth._before(user('alice',{...claims,ip_release_epoch:'b'.repeat(32)})),{code:'release/unavailable'});
 assert.equal(h.auth.currentUser,original);assert.deepEqual(h.terminations,['unavailable']);
 // Even an in-flight login completing after teardown cannot attach a new user.
 await assert.rejects(h.auth._before(user('alice')), {code:'release/unavailable'});
});

test('exchange client sends the password token only in an authorization header and fails closed',async()=>{
 const reqs=[],signal=new AbortController().signal;
 const exchange=createSessionExchangeClient({endpoint:'https://release.example/api/session',fetcher:async(...args)=>{
  reqs.push(args);return new Response(JSON.stringify({status:'ok',customToken:'issued'}),{status:200});
 }});
 assert.deepEqual(await exchange({idToken:'id-token',build:'release-1',signal}),{status:'ok',customToken:'issued'});
 assert.equal(reqs[0][0],'https://release.example/api/session');assert.equal(reqs[0][1].headers.authorization,'Bearer id-token');
 assert.equal(reqs[0][1].body,JSON.stringify({build:'release-1'}));assert.equal(reqs[0][1].cache,'no-store');
 for(const endpoint of ['http://release.example/api/session','https://release.example/api/session?token=x','https://u:p@release.example/api/session'])assert.throws(()=>createSessionExchangeClient({endpoint}),/Invalid/);
 const hanging=createSessionExchangeClient({endpoint:'https://release.example/api/session',timeoutMs:5,fetcher:()=>new Promise(()=>{})});
 await assert.rejects(hanging({idToken:'x',build:'release-1',signal}),{code:'release/unavailable'});
});
