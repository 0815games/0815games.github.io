import {test,before,beforeEach,afterEach,after} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeApp,deleteApp} from 'firebase/app';
import {initializeAuth,connectAuthEmulator,inMemoryPersistence,signInWithCustomToken,signOut} from 'firebase/auth';
import {getDatabase,connectDatabaseEmulator,ref,get,set,update,goOffline,goOnline,onDisconnect} from 'firebase/database';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {buildRulesCandidate} from '../../release-tools/rules-candidate.mjs';
import {CONTROL_PATH} from '../../release-tools/release-control.mjs';

// Emulator-only unsigned custom tokens. Never use this token construction with
// production Firebase. The project ID and all accounts are local fixtures.
const projectId='demo-ironpath',epochA='a'.repeat(32),epochB='b'.repeat(32);
const source=JSON.parse(await readFile(new URL('../WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url),'utf8'));
const {candidate}=buildRulesCandidate(source);
const t=Math.floor(Date.now()/1000);
const initial={mode:'open',build:'release-1',epoch:epochA,authAfterMs:(t-120)*1000};
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
function emulatorCustomToken(epoch){
 const now=Math.floor(Date.now()/1000);
 return `${encode({alg:'none',typ:'JWT'})}.${encode({aud:'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',iat:now,exp:now+3600,iss:'firebase-auth-emulator@example.com',sub:'firebase-auth-emulator@example.com',uid:'alice',claims:{ip_release_epoch:epoch}})}.`;
}
let env,seq=0,clients=[];
const adminSet=(path,value)=>env.withSecurityRulesDisabled(ctx=>set(path?ref(ctx.database(),path):ref(ctx.database()),value));
const adminGet=async path=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),path))).val();});return value;};
function client(){
 // initializeTestEnvironment uses namespace projectId; the SDK default is
 // ${projectId}-default-rtdb, a DIFFERENT and potentially open database.
 const app=initializeApp({apiKey:'fake',projectId,databaseURL:`http://127.0.0.1:9000?ns=${projectId}`},`release-auth-${++seq}`);
 const auth=initializeAuth(app,{persistence:inMemoryPersistence});connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
 const db=getDatabase(app);connectDatabaseEmulator(db,'127.0.0.1',9000);
 const result={app,auth,db};clients.push(result);return result;
}
async function closeAndOpen(){
 await adminSet(CONTROL_PATH,{...initial,mode:'maintenance',epoch:epochB});
 await adminSet(CONTROL_PATH,{mode:'open',build:'release-2',epoch:epochB,authAfterMs:(t-1)*1000});
}
async function waitForProfileRemoval(){
 const deadline=Date.now()+5000;
 while(Date.now()<deadline){if(await adminGet('players/alice')===null)return;await new Promise(resolve=>setTimeout(resolve,50));}
 throw Error('onDisconnect baseline did not run within 5 seconds');
}
before(async()=>{env=await initializeTestEnvironment({projectId,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(candidate)}});});
beforeEach(async()=>{await env.clearDatabase();await adminSet('',{[CONTROL_PATH]:initial,players:{alice:{name:'Alice',gender:'female',xp:0}}});});
afterEach(async()=>{for(const {app,auth} of clients){await signOut(auth);await deleteApp(app);}clients=[];});
after(async()=>{await env?.cleanup();});

test('UNSAFE characterization: switching auth on a database with an old offline queue can apply it under the new epoch', {timeout:30000},async()=>{
 const {auth,db}=client();
 await signInWithCustomToken(auth,emulatorCustomToken(epochA));
 assert.equal((await assertSucceeds(get(ref(db,'players/alice')))).val()?.name,'Alice');
 goOffline(db);
 const pending=update(ref(db,'players/alice'),{xp:5});
 await closeAndOpen();
 await signInWithCustomToken(auth,emulatorCustomToken(epochB));
 assert.equal((await auth.currentUser.getIdTokenResult()).claims.ip_release_epoch,epochB);
 // Give the SDK's auth-token listener time to receive the new identity while
 // the database socket is offline. Reusing the same SDK instance is unsafe.
 await new Promise(resolve=>setTimeout(resolve,500));
 goOnline(db);
 await assertSucceeds(pending);
 assert.equal((await adminGet('players/alice')).xp,5,'old queued data was applied using the new auth; this is not a protected flow');
});

test('a separate new SDK instance does not authorize the old instance queued under its old auth', {timeout:30000},async()=>{
 const old=client();await signInWithCustomToken(old.auth,emulatorCustomToken(epochA));
 assert.equal((await assertSucceeds(get(ref(old.db,'players/alice')))).val()?.xp,0);
 goOffline(old.db);const pending=update(ref(old.db,'players/alice'),{xp:5});
 await closeAndOpen();
 const fresh=client();await signInWithCustomToken(fresh.auth,emulatorCustomToken(epochB));
 await assertSucceeds(update(ref(fresh.db,'players/alice'),{xp:3}));
 goOnline(old.db);await assertFails(pending);
 assert.equal((await adminGet('players/alice')).xp,3);
});

test('onDisconnect baseline actually runs while the release is open', {timeout:30000},async()=>{
 const {auth,db}=client();await signInWithCustomToken(auth,emulatorCustomToken(epochA));
 assert.equal((await assertSucceeds(get(ref(db,'players/alice')))).val()?.name,'Alice');
 await onDisconnect(ref(db,'players/alice')).remove();goOffline(db);
 await waitForProfileRemoval();
});

test('an old onDisconnect removal is denied after closure and reopening in a new epoch', {timeout:30000},async()=>{
 const {auth,db}=client();await signInWithCustomToken(auth,emulatorCustomToken(epochA));
 assert.equal((await assertSucceeds(get(ref(db,'players/alice')))).val()?.name,'Alice');
 await onDisconnect(ref(db,'players/alice')).remove();
 await closeAndOpen();goOffline(db);
 // The baseline above proves the emulator runs onDisconnect; waiting here is a
 // bounded observation, not a proof about production timing or cleanup.
 await new Promise(resolve=>setTimeout(resolve,1500));
 assert.equal((await adminGet('players/alice'))?.name,'Alice');
});
