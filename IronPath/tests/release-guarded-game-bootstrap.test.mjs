import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createGuardedGameBootstrap} from '../release-tools/guarded-game-bootstrap.mjs';

const release={mode:'open',build:'game-1',epoch:'a'.repeat(32),authAfterMs:1000000};
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
function setup(options={}){
 const events=[],shown=deferred(),replaced=deferred(),sdk={
  inMemoryPersistence:{},initializeApp:(_config,name)=>({name}),
  initializeAuth:()=>({currentUser:null,authStateReady:async()=>{}}),getDatabase:()=>({}),
  beforeAuthStateChanged:()=>()=>{},onAuthStateChanged:()=>()=>{},
  signInWithEmailAndPassword:()=>{},createUserWithEmailAndPassword:()=>{},signInWithCustomToken:()=>{},
  sendPasswordResetEmail:()=>{},signOut:async()=>events.push('signout'),goOffline:()=>events.push('offline')
 };
 let status=release;
 const runtime=createGuardedGameBootstrap({config:{databaseURL:'https://demo.firebaseio.com'},sdk,build:'game-1',
  sessionEndpoint:'https://release.example/api/session',intervalMs:60000,statusTimeoutMs:1000,
  statusFetcher:async()=>new Response(JSON.stringify(status)),
  installSession:context=>{events.push('install');return options.installSession?.(context);},
  importGame:()=>{events.push('import');return options.importGame?.();},
  onHold:reason=>events.push(`hold:${reason}`),
  showGame:()=>{events.push('show');shown.resolve();return options.showGame?.();},
  replaceDocument:target=>{events.push(target);replaced.resolve(target);}
 });
 return {runtime,events,shown:shown.promise,replaced:replaced.promise,setStatus:value=>{status=value;}};
}

test('a fresh open release installs the session before importing and revealing the game',async()=>{
 let session,signal;
 const h=setup({installSession:value=>{({session,signal}=value);}});
 h.runtime.start();await h.shown;
 assert.deepEqual(h.events.slice(0,4),['hold:checking','install','import','show']);
 assert.equal(session.getState(),'idle');assert.equal(signal.aborted,false);
 await h.runtime.stop('logout');assert.equal(signal.aborted,true);assert.deepEqual(await h.replaced,{kind:'entry'});
});

test('a late game import never uncovers the page after maintenance',async()=>{
 const imported=deferred(),started=deferred();
 const h=setup({importGame:()=>{started.resolve();return imported.promise;}});
 h.runtime.start();await started.promise;
 h.setStatus({...release,mode:'maintenance'});await h.runtime.refresh();
 assert.deepEqual(await h.replaced,{kind:'maintenance'});imported.resolve();
 await new Promise(resolve=>setImmediate(resolve));
 assert.ok(!h.events.includes('show'));assert.equal(h.runtime.getPhase(),'terminated');
});

test('failed or asynchronous installation and reveal immediately initiate teardown',async()=>{
 const install=setup({installSession:async()=>{throw Error('not synchronous');}});
 install.runtime.start();assert.deepEqual(await install.replaced,{kind:'maintenance'});
 assert.ok(!install.events.includes('import'));assert.ok(install.events.includes('offline'));
 const show=setup({showGame:()=>{throw Error('failed reveal');}});
 show.runtime.start();assert.deepEqual(await show.replaced,{kind:'maintenance'});
 assert.equal(show.runtime.getPhase(),'terminated');
});
