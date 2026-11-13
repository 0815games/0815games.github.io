// An isolated browser integration against Firebase emulators only. It combines
// the real Web SDK, status monitor, guarded session, Node HTTP adapter, Admin
// Auth and candidate RTDB rules. The game and Vercel are NOT used by this test.
const {chromium}=require(process.env.PW_PATH||'playwright');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {initializeApp:initializeAdmin,deleteApp:deleteAdmin}=require('firebase-admin/app');
const {getAuth:getAdminAuth}=require('firebase-admin/auth');
const {ref,get,set}=require('firebase/database');
const {readFile}=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');

for(const [name,port] of [['FIREBASE_AUTH_EMULATOR_HOST',9099],['FIREBASE_DATABASE_EMULATOR_HOST',9000]]){
 if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(process.env[name]))throw Error(`${name} must explicitly name the local emulator`);
}
const project='demo-ironpath',uid='runtime-browser-alice';
const epochA='a'.repeat(32),epochB='b'.repeat(32);
const releaseDir=path.resolve(__dirname,'../../release-tools');
const emulatorStatus=`http://127.0.0.1:9000/_ironpathRelease.json?ns=${project}`;
const harness=`
import {initializeApp} from '/sdk/firebase-app.js';
import {initializeAuth,inMemoryPersistence,connectAuthEmulator,beforeAuthStateChanged,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithCustomToken,signOut,sendPasswordResetEmail} from '/sdk/firebase-auth.js';
import {getDatabase,connectDatabaseEmulator,ref,get,update,goOffline,goOnline} from '/sdk/firebase-database.js';
import {createGuardedRuntime,createIsolatedReleaseFirebase} from '/release/guarded-runtime.mjs';
const events=[],observed=[];
let instances,session,lifeSignal,destination=null;
const sdk={initializeApp,initializeAuth,inMemoryPersistence,getDatabase,beforeAuthStateChanged,onAuthStateChanged,
 signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithCustomToken,sendPasswordResetEmail,
 signOut:auth=>{events.push('signout');return signOut(auth);},
 goOffline:db=>{events.push('offline');goOffline(db);}};
const resources=createIsolatedReleaseFirebase({sdk,
 config:{apiKey:'fake',authDomain:'demo-ironpath.firebaseapp.com',projectId:'demo-ironpath',databaseURL:'https://demo-ironpath.firebaseio.com'},
 configure:values=>{
  instances=values;
  connectAuthEmulator(values.auth,'http://127.0.0.1:9099',{disableWarnings:true});
  connectAuthEmulator(values.passwordAuth,'http://127.0.0.1:9099',{disableWarnings:true});
  connectDatabaseEmulator(values.db,'127.0.0.1',9000);
 }});
const runtime=createGuardedRuntime({resources,sdk,
 build:new URL(location.href).searchParams.get('build'),
 statusUrl:'https://demo-ironpath.firebaseio.com/_ironpathRelease.json',sessionEndpoint:'https://release.example/api/session',
 // Same-origin local proxies; this does not test Vercel or cross-origin CORS.
 statusFetcher:(_url,options)=>fetch('/status',options),sessionFetcher:(_url,options)=>fetch('/api/session',options),
 intervalMs:60000,statusTimeoutMs:5000,signOutTimeoutMs:2000,
 onHold:reason=>events.push('hold:'+reason),
 onReady:context=>{session=context.session;lifeSignal=context.signal;events.push('ready');
  session.onAuthStateChanged(user=>observed.push(user?.uid??null));},
 // Record the required full-navigation target rather than navigating away so
 // the test can inspect and forcibly reconnect an old database instance.
 replaceDocument:target=>{destination=target;events.push('replace:'+target.kind);}
});
const player='players/runtime-browser-alice';
window.guard={
 ready:()=>!!session,phase:()=>runtime.getPhase(),destination:()=>destination,
 events:()=>events,observed:()=>observed,aborted:()=>lifeSignal?.aborted??false,
 uid:()=>instances.auth.currentUser?.uid??null,
 passwordUid:()=>instances.passwordAuth.currentUser?.uid??null,
 login:()=>session.signIn('runtime-browser@example.test','example-password-123').then(()=>true),
 refresh:()=>runtime.refresh(),
 write:xp=>update(ref(instances.db,player),{xp}),
 read:()=>get(ref(instances.db,player)).then(snapshot=>snapshot.val()),
 offline:()=>goOffline(instances.db),online:()=>goOnline(instances.db),
 queue:xp=>{window.queued=update(ref(instances.db,player),{xp}).then(()=>({accepted:true}),error=>({accepted:false,code:error.code||''}));},
 queueResult:()=>window.queued,
 reauth:async token=>{try{await signInWithCustomToken(instances.auth,token);return 'accepted';}catch(error){return error.code;}}
};
runtime.start();`;

(async()=>{
 const source=JSON.parse(await readFile(path.resolve(__dirname,'../WORKSHOP-RULES-TO-PUBLISH.json'),'utf8'));
 const {buildRulesCandidate}=await import(pathToFileURL(path.join(releaseDir,'rules-candidate.mjs')).href);
 const {prepareReleaseControlWrite}=await import(pathToFileURL(path.join(releaseDir,'release-control-write.mjs')).href);
 const {createConfiguredSessionExchange}=await import(pathToFileURL(path.join(releaseDir,'session-service.mjs')).href);
 const {createReleaseSessionHttpHandler}=await import(pathToFileURL(path.join(releaseDir,'session-http.mjs')).href);
 const rules=buildRulesCandidate(source).candidate;
 const scripts={};
 for(const name of ['firebase-app.js','firebase-auth.js','firebase-database.js']){
  let js=await readFile(path.join(__dirname,'node_modules/firebase',name),'utf8');
  if(name!=='firebase-app.js')js=js.replaceAll('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js','/sdk/firebase-app.js');
  scripts[`/sdk/${name}`]=js;
 }
 for(const name of ['guarded-runtime.mjs','game-session.mjs','release-control.mjs','runtime-fence.mjs','status-monitor.mjs','bounded-json.mjs']){
  scripts[`/release/${name}`]=await readFile(path.join(releaseDir,name),'utf8');
 }
 const admin=initializeAdmin({projectId:project},'release-runtime-browser-admin');
 const adminAuth=getAdminAuth(admin);
 let env,browser,server,failStatus=false,serviceReads=0,sessionRequests=0;
 try{
  await adminAuth.createUser({uid,email:'runtime-browser@example.test',password:'example-password-123'});
  const service=createConfiguredSessionExchange({databaseUrl:'https://demo-ironpath.firebaseio.com',adminAuth,
   fetcher:(_url,options)=>{serviceReads++;return fetch(emulatorStatus,options);}});
  const handleSession=createReleaseSessionHttpHandler({exchange:service,allowedOrigins:['https://0815games.github.io'],route:'/api/session'});
  server=http.createServer((req,res)=>{
   const pathname=new URL(req.url,'http://127.0.0.1').pathname;
   if(pathname==='/status'){
    if(failStatus){res.writeHead(503).end();return;}
    fetch(emulatorStatus,{cache:'no-store',signal:AbortSignal.timeout(5000)}).then(async upstream=>{
     res.writeHead(upstream.status,{'content-type':'application/json','cache-control':'no-store'}).end(await upstream.text());
    }).catch(()=>{if(!res.headersSent)res.writeHead(503);res.end();});return;
   }
   if(pathname==='/api/session'){
    // The production adapter permits only the real game's HTTPS Origin. The
    // loopback test proxy substitutes it; browser-to-Vercel CORS is not tested.
    req.headers.origin='https://0815games.github.io';sessionRequests++;handleSession(req,res);return;
   }
   if(pathname==='/harness.js'){res.writeHead(200,{'content-type':'text/javascript'}).end(harness);return;}
   if(scripts[pathname]){res.writeHead(200,{'content-type':'text/javascript'}).end(scripts[pathname]);return;}
   if(pathname==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><script type="module" src="/harness.js"></script>');return;}
   res.writeHead(404).end();
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  env=await initializeTestEnvironment({projectId:project,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}});
  const adminSet=(p,v)=>env.withSecurityRulesDisabled(ctx=>set(p?ref(ctx.database(),p):ref(ctx.database()),v));
  const adminGet=async p=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),p))).val();});return value;};
  await env.clearDatabase();
  const initial={mode:'open',build:'runtime-1',epoch:epochA,authAfterMs:(Math.floor(Date.now()/1000)-120)*1000};
  await adminSet('',{_ironpathRelease:initial,players:{[uid]:{name:'Alice',gender:'female',xp:0}}});
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:process.env.CHROMIUM_PATH?['--no-sandbox']:[]});
  const context=await browser.newContext(),errors=[];
  const openPage=async build=>{
   const page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));
   await page.goto(`http://127.0.0.1:${server.address().port}/?build=${build}`);
   await page.waitForFunction(()=>window.guard);return page;
  };
  try{
   const old=await openPage('runtime-1');await old.waitForFunction(()=>window.guard.ready());
   assert.equal(await old.evaluate(()=>window.guard.uid()),null);
   await old.evaluate(()=>window.guard.login());
   assert.equal(await old.evaluate(()=>window.guard.uid()),uid);
   assert.equal(await old.evaluate(()=>window.guard.passwordUid()),null);
   assert.deepEqual(await old.evaluate(()=>window.guard.observed()),[null,uid]);
   await old.evaluate(()=>window.guard.write(1));assert.equal((await adminGet(`players/${uid}`)).xp,1);
   await old.evaluate(()=>{window.guard.offline();window.guard.queue(99);});

   await adminSet('_ironpathRelease',{...initial,mode:'maintenance',epoch:epochB});
   await old.evaluate(()=>window.guard.refresh());
   await old.waitForFunction(()=>window.guard.destination());
   assert.equal(await old.evaluate(()=>window.guard.aborted()),true);
   assert.deepEqual(await old.evaluate(()=>window.guard.destination()),{kind:'maintenance'});
   const oldEvents=await old.evaluate(()=>window.guard.events());
   assert.ok(oldEvents.indexOf('hold:maintenance')<oldEvents.indexOf('offline'));
   assert.ok(oldEvents.indexOf('offline')<oldEvents.lastIndexOf('signout'));
   const during=await openPage('runtime-1');await during.waitForFunction(()=>window.guard.destination());
   assert.equal(await during.evaluate(()=>window.guard.ready()),false);
   assert.deepEqual(await during.evaluate(()=>window.guard.destination()),{kind:'maintenance'});

   const opening=prepareReleaseControlWrite({mode:'open',build:'runtime-2',currentEpoch:epochB},()=>Buffer.alloc(16,0xcc));
   await adminSet('_ironpathRelease',opening);
   const reopened=await adminGet('_ironpathRelease'),cutoffMs=reopened.authAfterMs;
   assert.notEqual(reopened.epoch,epochB);
   while(Math.floor(Date.now()/1000)*1000<=cutoffMs)await new Promise(resolve=>setTimeout(resolve,50));
   const fresh=await openPage('runtime-2');await fresh.waitForFunction(()=>window.guard.ready());
   await fresh.evaluate(()=>window.guard.login());await fresh.evaluate(()=>window.guard.write(3));
   assert.equal((await adminGet(`players/${uid}`)).xp,3);
   await old.evaluate(()=>window.guard.online());
   const queued=await old.evaluate(()=>window.guard.queueResult());
   assert.equal(queued.accepted,false);assert.match(queued.code,/permission.denied/i);
   assert.equal((await adminGet(`players/${uid}`)).xp,3);
   const newToken=await adminAuth.createCustomToken(uid,{ip_release_epoch:reopened.epoch});
   assert.equal(await old.evaluate(token=>window.guard.reauth(token),newToken),'auth/login-blocked');
   assert.equal(await old.evaluate(()=>window.guard.uid()),null);
   assert.ok(sessionRequests>=2);assert.ok(serviceReads>=6);

   failStatus=true;await fresh.evaluate(()=>window.guard.refresh());
   await fresh.waitForFunction(()=>window.guard.destination());
   assert.deepEqual(await fresh.evaluate(()=>window.guard.destination()),{kind:'maintenance'});
   assert.ok((await fresh.evaluate(()=>window.guard.events())).includes('hold:unavailable'));
   assert.deepEqual(errors,[]);
   console.log('Browser runtime: real SDK + HTTP/Admin exchange + fresh emulator status blocked maintenance and stale queues; reopen used a new document.');
  }finally{await context.close();}
 }finally{
  if(browser)await browser.close();if(env)await env.cleanup();
  if(server)await new Promise(resolve=>server.close(resolve));await deleteAdmin(admin);
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
