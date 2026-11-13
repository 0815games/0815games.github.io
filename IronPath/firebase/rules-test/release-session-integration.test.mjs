import {test,before,after} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeApp as initializeClient,deleteApp as deleteClient} from 'firebase/app';
import {initializeAuth,connectAuthEmulator,inMemoryPersistence,createUserWithEmailAndPassword,signInWithEmailAndPassword,signInWithCustomToken,signOut} from 'firebase/auth';
import {getDatabase,connectDatabaseEmulator,ref,get,set,update} from 'firebase/database';
import {initializeApp as initializeAdmin,deleteApp as deleteAdmin} from 'firebase-admin/app';
import {getAuth as getAdminAuth} from 'firebase-admin/auth';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {buildRulesCandidate} from '../../release-tools/rules-candidate.mjs';
import {createReleaseSessionExchange} from '../../release-tools/session-exchange.mjs';
import {CONTROL_PATH} from '../../release-tools/release-control.mjs';

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
 const initial={mode:'open',build:'release-1',epoch:epochA,authAfter:now-120};
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

 // The cutoff covers the entire maintenance interval. auth_time is
 // second-granular, so a genuinely fresh login must wait for the next second.
 const cutoff=Math.max(passwordClaims.auth_time,duringMaintenanceClaims.auth_time);
 await adminSet(CONTROL_PATH,{mode:'open',build:'release-2',epoch:epochB,authAfter:cutoff});
 assert.equal((await exchange.exchange({idToken:passwordToken,build:'release-2'})).status,'unauthorized');
 assert.equal((await exchange.exchange({idToken:duringMaintenanceToken,build:'release-2'})).status,'unauthorized');
 await assertFails(update(ref(game.db,player),{xp:2}));
 while(Math.floor(Date.now()/1000)<=cutoff)await new Promise(resolve=>setTimeout(resolve,50));
 await signOut(passwordClient.auth);
 const freshPassword=await signInWithEmailAndPassword(passwordClient.auth,'alice@example.test','example-password-123');
 const freshIssue=await exchange.exchange({idToken:await freshPassword.user.getIdToken(),build:'release-2'});
 assert.equal(freshIssue.status,'ok');
 // New SDK/database instance: never upgrade an old offline write queue.
 const freshGame=client();await signInWithCustomToken(freshGame.auth,freshIssue.customToken);
 await assertSucceeds(update(ref(freshGame.db,player),{xp:3}));
 assert.equal((await adminGet(player)).xp,3);
});
