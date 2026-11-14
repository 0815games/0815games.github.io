import {test,before,after} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeApp as initializeClient,deleteApp as deleteClient} from 'firebase/app';
import {initializeAuth,connectAuthEmulator,inMemoryPersistence,beforeAuthStateChanged,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signInWithCustomToken,signOut,sendPasswordResetEmail} from 'firebase/auth';
import {getDatabase,connectDatabaseEmulator,ref,get,set,update,goOffline,goOnline} from 'firebase/database';
import {initializeApp as initializeAdmin,deleteApp as deleteAdmin} from 'firebase-admin/app';
import {getAuth as getAdminAuth} from 'firebase-admin/auth';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {buildRulesCandidate} from '../../release-tools/rules-candidate.mjs';
import {createReleaseSessionExchange} from '../../release-tools/session-exchange.mjs';
import {createConfiguredSessionExchange} from '../../release-tools/session-service.mjs';
import {createReleaseSessionHttpServer} from '../../release-tools/session-http.mjs';
import {CONTROL_PATH,parseReleaseControl,sameRelease} from '../../release-tools/release-control.mjs';
import {prepareReleaseControlWrite} from '../../release-tools/release-control-write.mjs';
import {createGuardedGameSession,createSessionExchangeClient} from '../../release-tools/game-session.mjs';

// Actual client and Admin SDKs, but ONLY local emulators and a demo project.
// Require explicit loopback endpoints; never point this test at production.
for(const [name,port] of [['FIREBASE_AUTH_EMULATOR_HOST',9099],['FIREBASE_DATABASE_EMULATOR_HOST',9000]]){
 if(!new RegExp(`^(127\\.0\\.0\\.1|localhost):${port}$`).test(process.env[name]||''))throw Error(`${name} must explicitly name the local emulator`);
}
const projectId='demo-ironpath',epochA='a'.repeat(32),epochB='b'.repeat(32);
const source=JSON.parse(await readFile(new URL('../WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url),'utf8'));
const {candidate}=buildRulesCandidate(source);
const clients=[];let env,admin,adminAuth,sequence=0;
const adminSet=(p,v)=>env.withSecurityRulesDisabled(ctx=>set(p?ref(ctx.database(),p):ref(ctx.database()),v));
const adminGet=async p=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),p))).val();});return value;};
function client(){
 const app=initializeClient({apiKey:'fake',projectId,databaseURL:`http://127.0.0.1:9000?ns=${projectId}`},`release-integration-${++sequence}`);
 const auth=initializeAuth(app,{persistence:inMemoryPersistence});connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
 const db=getDatabase(app);connectDatabaseEmulator(db,'127.0.0.1',9000);
 const result={app,auth,db};clients.push(result);return result;
}
before(async()=>{
 env=await initializeTestEnvironment({projectId,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(candidate)}});
 admin=initializeAdmin({projectId},'release-admin-test');adminAuth=getAdminAuth(admin);
});
after(async()=>{for(const {app,auth} of clients){await signOut(auth);await deleteClient(app);}if(admin)await deleteAdmin(admin);await env?.cleanup();});

test('real emulator SDK exchange fences data and requires a new login for each epoch, but does not disable Firebase Auth', {timeout:60000},async()=>{
 const now=Math.floor(Date.now()/1000);
 const initial={mode:'open',build:'release-1',epoch:epochA,authAfterMs:(now-120)*1000};
 await env.clearDatabase();await adminSet(CONTROL_PATH,initial);
 const passwordClient=client();
 const credential=await createUserWithEmailAndPassword(passwordClient.auth,'alice@example.test','example-password-123');
 const uid=credential.user.uid, player=`players/${uid}`;
 await adminSet(player,{name:'Alice',gender:'female',xp:0});
 const passwordToken=await credential.user.getIdToken();
 const passwordClaims=await adminAuth.verifyIdToken(passwordToken,true);
 assert.equal(passwordClaims.firebase.sign_in_provider,'password');
 await assertFails(get(ref(passwordClient.db,player)));

 const exchange=createReleaseSessionExchange({
  readControl:()=>adminGet(CONTROL_PATH),
  verifyIdToken:(token,checkRevoked)=>adminAuth.verifyIdToken(token,checkRevoked),
  mintCustomToken:(id,claims)=>adminAuth.createCustomToken(id,claims)
 });
 const issued=await exchange.exchange({idToken:passwordToken,build:'release-1'});
 assert.equal(issued.status,'ok');
 const game=client();
 await signInWithCustomToken(game.auth,issued.customToken);
 const gameClaims=(await game.auth.currentUser.getIdTokenResult()).claims;
 assert.equal(gameClaims.ip_release_epoch,epochA);assert.equal(gameClaims.firebase.sign_in_provider,'custom');
 assert.equal((await assertSucceeds(get(ref(game.db,player)))).val().name,'Alice');
 await assertSucceeds(update(ref(game.db,player),{xp:1}));

 // The real Admin verifier must consult user state, not just decode a JWT.
 await adminAuth.updateUser(uid,{disabled:true});
 assert.equal((await exchange.exchange({idToken:passwordToken,build:'release-1'})).status,'unauthorized');
 await adminAuth.updateUser(uid,{disabled:false});

 await adminSet(CONTROL_PATH,{...initial,mode:'maintenance',epoch:epochB});
 assert.equal((await exchange.exchange({idToken:passwordToken,build:'release-1'})).status,'maintenance');
 await assertFails(update(ref(game.db,player),{xp:2}));
 // Database rules and the exchange alone do not turn off Firebase Auth. A
 // previously minted custom token can still create a Firebase session, and
 // registration can still succeed, while their database operations are denied.
 const late=client();await signInWithCustomToken(late.auth,issued.customToken);
 await assertFails(get(ref(late.db,player)));
 const registration=client();
 const newUser=await createUserWithEmailAndPassword(registration.auth,'bob@example.test','example-password-123');
 const duringMaintenanceToken=await newUser.user.getIdToken();
 const duringMaintenanceClaims=await adminAuth.verifyIdToken(duringMaintenanceToken,true);
 await assertFails(set(ref(registration.db,`players/${newUser.user.uid}`),{name:'Bob',gender:'male',xp:0}));

 // Resolve the RTDB timestamp in the *same write* that opens the new epoch.
 // Both emulators use the local clock; this does not prove real clock sync.
 const opening=prepareReleaseControlWrite({mode:'open',build:'release-2',currentEpoch:epochB},()=>Buffer.alloc(16,0xcc));
 await adminSet(CONTROL_PATH,opening);
 const reopened=await adminGet(CONTROL_PATH),cutoffMs=reopened.authAfterMs;
 assert.ok(Number.isSafeInteger(cutoffMs) && cutoffMs>=duringMaintenanceClaims.auth_time*1000);
 assert.equal((await exchange.exchange({idToken:passwordToken,build:'release-2'})).status,'unauthorized');
 assert.equal((await exchange.exchange({idToken:duringMaintenanceToken,build:'release-2'})).status,'unauthorized');
 await assertFails(update(ref(game.db,player),{xp:2}));
 while(Math.floor(Date.now()/1000)*1000<=cutoffMs)await new Promise(resolve=>setTimeout(resolve,50));
 await signOut(passwordClient.auth);
 const freshPassword=await signInWithEmailAndPassword(passwordClient.auth,'alice@example.test','example-password-123');
 const freshIssue=await exchange.exchange({idToken:await freshPassword.user.getIdToken(),build:'release-2'});
 assert.equal(freshIssue.status,'ok');
 // New SDK/database instance: never upgrade an old offline write queue.
 const freshGame=client();await signInWithCustomToken(freshGame.auth,freshIssue.customToken);
 await assertSucceeds(update(ref(freshGame.db,player),{xp:3}));
 assert.equal((await adminGet(player)).xp,3);
});

test('Node HTTP service adapter uses real Admin Auth and fresh REST control against the local emulators', {timeout:60000},async()=>{
 const now=Math.floor(Date.now()/1000);
 const initial={mode:'open',build:'release-http-1',epoch:epochA,authAfterMs:(now-120)*1000};
 await env.clearDatabase();await adminSet(CONTROL_PATH,initial);
 const password=client();
 const credential=await createUserWithEmailAndPassword(password.auth,'http-alice@example.test','example-password-123');
 const uid=credential.user.uid, player=`players/${uid}`;
 await adminSet(player,{name:'Alice',gender:'female',xp:0});
 const passwordToken=await credential.user.getIdToken();
 let reads=0;
 // Only this injected test fetcher speaks loopback HTTP. The service itself
 // insists on an HTTPS Firebase host and never sees production credentials.
 const fetcher=(_url,options)=>{reads++;return fetch(`http://127.0.0.1:9000/${CONTROL_PATH}.json?ns=${projectId}`,options);};
 const exchange=createConfiguredSessionExchange({databaseUrl:'https://demo-ironpath.firebaseio.com',adminAuth,fetcher});
 const server=createReleaseSessionHttpServer({exchange,allowedOrigins:['https://0815games.github.io'],route:'/api/session'});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/api/session`;
 const headers={origin:'https://0815games.github.io',authorization:`Bearer ${passwordToken}`,'content-type':'application/json'};
 try{
  let response=await fetch(url,{method:'POST',headers,body:JSON.stringify({build:'release-http-1'})});
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  const issued=await response.json();assert.equal(issued.status,'ok');assert.equal(reads,3);
  const game=client();await signInWithCustomToken(game.auth,issued.customToken);
  await assertSucceeds(update(ref(game.db,player),{xp:7}));
  await adminSet(CONTROL_PATH,{...initial,mode:'maintenance',epoch:epochB});
  response=await fetch(url,{method:'POST',headers,body:JSON.stringify({build:'release-http-1'})});
  assert.equal(response.status,503);assert.deepEqual(await response.json(),{status:'maintenance'});
  await assertFails(update(ref(game.db,player),{xp:8}));
  assert.equal((await adminGet(player)).xp,7);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('guarded adapter checks real SDK credentials before game access and isolates an old offline queue', {timeout:60000},async()=>{
 const initial={mode:'open',build:'guard-1',epoch:epochA,authAfterMs:(Math.floor(Date.now()/1000)-120)*1000};
 await env.clearDatabase();await adminSet(CONTROL_PATH,initial);
 const seed=client();
 const created=await createUserWithEmailAndPassword(seed.auth,'guard-alice@example.test','example-password-123');
 const uid=created.user.uid,player=`players/${uid}`;
 await signOut(seed.auth);await adminSet(player,{name:'Alice',gender:'female',xp:0});
 const service=createConfiguredSessionExchange({databaseUrl:'https://demo-ironpath.firebaseio.com',adminAuth,
  fetcher:(_url,options)=>fetch(`http://127.0.0.1:9000/${CONTROL_PATH}.json?ns=${projectId}`,options)});
 const server=createReleaseSessionHttpServer({exchange:service,allowedOrigins:['https://0815games.github.io'],route:'/api/session'});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const localEndpoint=`http://127.0.0.1:${server.address().port}/api/session`;
 const exchange=createSessionExchangeClient({endpoint:'https://release.example/api/session',fetcher:(_url,options)=>
  fetch(localEndpoint,{...options,headers:{...options.headers,origin:'https://0815games.github.io'}})});
 const sdk={beforeAuthStateChanged,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,
  signInWithCustomToken,signOut,sendPasswordResetEmail};
 const sessions=[];
 async function guarded(release){
  const game=client(),password=client(),controller=new AbortController(),observed=[],events=[];
  const terminate=reason=>{events.push(reason);goOffline(game.db);controller.abort();};
  const refreshStatus=async()=>{
   const response=await fetch(`http://127.0.0.1:9000/${CONTROL_PATH}.json?ns=${projectId}`,{cache:'no-store'});
   const current=parseReleaseControl(await response.json());
   if(!sameRelease(release,current)){terminate(current?.mode==='maintenance'?'maintenance':'unavailable');throw Error('release changed');}
  };
  const session=await createGuardedGameSession({auth:game.auth,passwordAuth:password.auth,db:game.db,release,build:release.build,
   signal:controller.signal,sdk,exchange,refreshStatus,onTerminate:terminate});
  session.onAuthStateChanged(value=>observed.push(value?.uid??null));
  await new Promise(resolve=>setImmediate(resolve));
  const result={game,password,controller,session,refreshStatus,observed,events};sessions.push(result);return result;
 }
 try{
  const old=await guarded(initial);
  assert.deepEqual(old.observed,[null]);
  await assertFails(get(ref(old.game.db,player)));
  await old.session.signIn('guard-alice@example.test','example-password-123');
  assert.deepEqual(old.observed,[null,uid]);assert.equal(old.password.auth.currentUser,null);
  assert.equal((await assertSucceeds(get(ref(old.game.db,player)))).val().xp,0);
  await assertSucceeds(update(ref(old.game.db,player),{xp:1}));

  // Queue an old write while disconnected, then close and reopen in a new
  // epoch. A new document must use a separate Auth and RTDB instance.
  goOffline(old.game.db);
  const queued=update(ref(old.game.db,player),{xp:99});
  const rejected=assertFails(queued);
  await adminSet(CONTROL_PATH,{...initial,mode:'maintenance',epoch:epochB});
  await assert.rejects(old.refreshStatus());
  assert.deepEqual(old.events,['maintenance']);assert.equal(old.controller.signal.aborted,true);
  await assert.rejects(old.session.signIn('guard-alice@example.test','example-password-123'));
  const opening=prepareReleaseControlWrite({mode:'open',build:'guard-2',currentEpoch:epochB},()=>Buffer.alloc(16,0xcc));
  await adminSet(CONTROL_PATH,opening);
  const reopened=await adminGet(CONTROL_PATH);
  while(Math.floor(Date.now()/1000)*1000<=reopened.authAfterMs)await new Promise(resolve=>setTimeout(resolve,50));
  const fresh=await guarded(reopened);
  await fresh.session.signIn('guard-alice@example.test','example-password-123');
  await assertSucceeds(update(ref(fresh.game.db,player),{xp:3}));
  goOnline(old.game.db);await rejected;
  assert.equal((await adminGet(player)).xp,3);

  // Even a same-uid reauthentication on the new instance must be stopped by
  // Firebase's blocking hook before Auth hands it to the database SDK.
  const original=fresh.game.auth.currentUser;
  const anotherToken=await adminAuth.createCustomToken(uid,{ip_release_epoch:reopened.epoch});
  await assert.rejects(signInWithCustomToken(fresh.game.auth,anotherToken),{code:'auth/login-blocked'});
  assert.equal(fresh.game.auth.currentUser,original);
  assert.deepEqual(fresh.events,['unavailable']);assert.deepEqual(fresh.observed,[null,uid]);
 }finally{
  for(const session of sessions){session.controller.abort();goOnline(session.game.db);}
  await new Promise(resolve=>server.close(resolve));
 }
});
