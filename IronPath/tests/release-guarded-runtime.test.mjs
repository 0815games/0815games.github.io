import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createGuardedRuntime,createIsolatedReleaseFirebase} from '../release-tools/guarded-runtime.mjs';

const initial={mode:'open',build:'release-1',epoch:'a'.repeat(32),authAfter:1000};
const statusUrl='https://demo.firebaseio.com/_ironpathRelease.json';
const endpoint='https://release.example.test/api/session';
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});

function setup(options={}){
  const events=[],created=[],ready=deferred(),replaced=deferred();
  const memory={type:'in-memory'};let instances,current=initial,statusReads=0,exchangeCalls=0;
  const claims={firebase:{sign_in_provider:'custom'},ip_release_epoch:initial.epoch,auth_time:1001};
  const passwordUser={uid:'alice',getIdToken:async()=> 'synthetic-password-token'};
  const gameUser={uid:'alice',getIdTokenResult:async()=>({claims})};
  const sdk={
    inMemoryPersistence:memory,
    initializeApp:(config,name)=>{const app={config,name};created.push(app);return app;},
    initializeAuth:(app,configuration)=>{created.push(configuration);return {app,currentUser:null,authStateReady:async()=>{}};},
    getDatabase:app=>({app}),
    beforeAuthStateChanged:(auth,next)=>{auth.before=next;return ()=>{};},
    onAuthStateChanged:(auth,next)=>{auth.observer=next;queueMicrotask(()=>next(auth.currentUser));return ()=>{};},
    signInWithEmailAndPassword:async auth=>{events.push('password');auth.currentUser=passwordUser;return {user:passwordUser};},
    createUserWithEmailAndPassword:async auth=>{events.push('register');auth.currentUser=passwordUser;return {user:passwordUser};},
    signInWithCustomToken:async auth=>{events.push('custom');await auth.before(gameUser);auth.currentUser=gameUser;auth.observer(gameUser);return {user:gameUser};},
    signOut:async auth=>{events.push(auth===instances.auth?'signout:game':'signout:password');auth.currentUser=null;},
    sendPasswordResetEmail:async()=>{},
    goOffline:()=>events.push('offline')
  };
  Object.assign(sdk,options.sdk||{});
  const resources=createIsolatedReleaseFirebase({config:{projectId:'demo',databaseURL:'https://demo.firebaseio.com'},sdk,configure:value=>{instances=value;}});
  const statusFetcher=options.statusFetcher||(async()=>{statusReads++;if(current instanceof Error)throw current;return json(current);});
  const sessionFetcher=options.sessionFetcher||(async(_url,request)=>{
    exchangeCalls++;assert.equal(request.headers.authorization,'Bearer synthetic-password-token');
    assert.deepEqual(JSON.parse(request.body),{build:initial.build});return json({status:'ok',customToken:'synthetic-custom-token'});
  });
  const params={resources,build:initial.build,statusUrl,sessionEndpoint:endpoint,statusFetcher,sessionFetcher,
    intervalMs:60000,statusTimeoutMs:1000,signOutTimeoutMs:100,
    onHold:reason=>{events.push(`hold:${reason}`);return options.onHold?.(reason);},
    onReady:context=>{events.push('ready');ready.resolve(context);return options.onReady?.(context);},
    replaceDocument:target=>{events.push(target);replaced.resolve(target);}};
  const runtime=createGuardedRuntime(params);
  return {runtime,resources,sdk,instances,created,events,ready:ready.promise,replaced:replaced.promise,
    params,setStatus:value=>{current=value;},statusReads:()=>statusReads,exchangeCalls:()=>exchangeCalls};
}

test('fresh in-memory apps are distinct, and their RTDB instance cannot be mounted twice',async()=>{
  const h=setup();
  const names=h.created.filter(value=>value.name).map(value=>value.name);
  assert.match(names[0],/^ironpath-guarded-game-[a-f0-9]{32}$/);
  assert.equal(names[1],names[0].replace('-game-','-password-'));
  assert.equal(h.created[2].persistence,h.sdk.inMemoryPersistence);assert.equal(h.created[3].persistence,h.sdk.inMemoryPersistence);
  assert.notEqual(h.instances.auth,h.instances.passwordAuth);assert.equal(h.resources.db.app,h.instances.auth.app);
  assert.throws(()=>createGuardedRuntime(h.params),/Invalid guarded runtime/);
  h.runtime.start();await h.ready;await h.runtime.stop('logout');
  assert.throws(()=>h.runtime.start(),/cannot restart/);
});

test('the runtime refuses a mismatched status database and unsafe Firebase URLs',()=>{
  const h=setup();
  // The factory's objects are already mounted by setup; make another fresh
  // set to exercise constructor failure without consuming its one permitted use.
  const resources=createIsolatedReleaseFirebase({config:{projectId:'demo',databaseURL:'https://demo.firebaseio.com'},sdk:h.sdk});
  assert.throws(()=>createGuardedRuntime({...h.params,resources,statusUrl:'https://another.firebaseio.com/_ironpathRelease.json'}),/does not match/);
  assert.throws(()=>createIsolatedReleaseFirebase({config:{databaseURL:'http://example.test'},sdk:h.sdk}),/Invalid Firebase database URL/);
  const valid=createGuardedRuntime({...h.params,resources});
  return valid.stop();
});

test('the factory refuses Firebase objects already used or left by partial setup',()=>{
  const game={},password={},db={};
  const sdk={inMemoryPersistence:{},initializeApp:(_config,name)=>({name}),
    initializeAuth:app=>app.name.includes('-game-')?game:password,getDatabase:()=>db};
  const input={config:{projectId:'demo',databaseURL:'https://demo.firebaseio.com'},sdk};
  assert.throws(()=>createIsolatedReleaseFirebase({...input,configure:()=>Promise.resolve()}),/must be synchronous/);
  assert.throws(()=>createIsolatedReleaseFirebase(input),/reused Firebase instances/);
});

test('open status, exchange, claims and live checks precede game access; maintenance disconnects it',async()=>{
  const h=setup();h.runtime.start();const {session,signal}=await h.ready;
  const seen=[];session.onAuthStateChanged(user=>seen.push(user?.uid??null));
  await new Promise(resolve=>queueMicrotask(resolve));assert.deepEqual(seen,[null]);
  await session.signIn('alice@example.test','password');
  assert.deepEqual(seen,[null,'alice']);assert.equal(h.exchangeCalls(),1);assert.ok(h.statusReads()>=4);
  assert.equal(h.instances.passwordAuth.currentUser,null);
  h.setStatus({...initial,mode:'maintenance',epoch:'b'.repeat(32)});
  assert.equal(await h.runtime.refresh(),'terminated');assert.equal(signal.aborted,true);
  assert.ok(h.events.indexOf('hold:maintenance')<h.events.indexOf('offline'));
  assert.deepEqual(await h.replaced,{kind:'maintenance'});
  assert.ok(h.events.indexOf('offline')<h.events.lastIndexOf('signout:game'));
  await assert.rejects(session.signIn('alice@example.test','password'));
});

test('maintenance and broken status at startup never call the game',async()=>{
  for(const value of [{...initial,mode:'maintenance'},null,Error('offline')]){
    const h=setup();h.setStatus(value);h.runtime.start();
    assert.deepEqual(await h.replaced,{kind:'maintenance'});
    assert.equal(h.runtime.getPhase(),'terminated');assert.ok(!h.events.includes('ready'));
    assert.ok(!h.events.includes('password'));assert.ok(!h.events.includes('custom'));
  }
});

test('a failed fresh status check is not swallowed during login',async()=>{
  const h=setup();h.runtime.start();const {session}=await h.ready;
  h.setStatus(Error('offline'));
  await assert.rejects(session.signIn('alice@example.test','password'));
  assert.equal(h.runtime.getPhase(),'terminated');assert.ok(!h.events.includes('password'));
  assert.deepEqual(await h.replaced,{kind:'maintenance'});
});

test('maintenance appearing during exchange prevents custom login',async()=>{
  let h;
  h=setup({sessionFetcher:async()=>{h.setStatus({...initial,mode:'maintenance'});return json({status:'ok',customToken:'synthetic'});}});
  h.runtime.start();const {session}=await h.ready;
  await assert.rejects(session.signIn('alice@example.test','password'));
  assert.ok(h.events.includes('password'));assert.ok(!h.events.includes('custom'));
  assert.deepEqual(await h.replaced,{kind:'maintenance'});assert.equal(h.instances.auth.currentUser,null);
});

test('version changes and explicit logout replace the whole document',async()=>{
  const changed=setup();changed.runtime.start();const c=await changed.ready;
  changed.setStatus({...initial,build:'release-2',epoch:'b'.repeat(32)});
  await changed.runtime.refresh();assert.equal(c.signal.aborted,true);
  assert.deepEqual(await changed.replaced,{kind:'update',build:'release-2'});
  const logout=setup();logout.runtime.start();const {session,signal}=await logout.ready;
  session.logout();assert.equal(signal.aborted,true);assert.deepEqual(await logout.replaced,{kind:'entry'});
});

test('late open responses after logout cannot start a new game',async()=>{
  const pending=deferred(),h=setup({statusFetcher:()=>pending.promise});
  h.runtime.start();await h.runtime.stop('logout');pending.resolve(json(initial));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.runtime.getPhase(),'terminated');assert.ok(!h.events.includes('ready'));
});

test('a failed initial UI gate or asynchronous game startup tears down safely',async()=>{
  const badHold=setup({onHold:reason=>{if(reason==='checking')throw Error('broken UI');}});
  badHold.runtime.start();assert.deepEqual(await badHold.replaced,{kind:'maintenance'});
  assert.ok(!badHold.events.includes('ready'));assert.ok(badHold.events.includes('offline'));
  const asyncHold=setup({onHold:async()=>{throw Error('late UI failure');}});
  asyncHold.runtime.start();assert.deepEqual(await asyncHold.replaced,{kind:'maintenance'});
  assert.ok(!asyncHold.events.includes('ready'));
  const badReady=setup({onReady:async()=>{throw Error('broken startup');}});
  badReady.runtime.start();assert.deepEqual(await badReady.replaced,{kind:'maintenance'});
  assert.equal(badReady.runtime.getPhase(),'terminated');
});
