// Two actual Chromium tabs and the Firebase Web SDK, against local emulators.
// This is a controlled test only: no connection to the production project.
const {chromium}=require(process.env.PW_PATH||'playwright');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {ref,get,set}=require('firebase/database');
const {readFile}=require('node:fs/promises');
const path=require('node:path');const http=require('node:http');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');

const project='demo-ironpath',epochA='a'.repeat(32),epochB='b'.repeat(32);
const now=Math.floor(Date.now()/1000);
const first={mode:'open',build:'release-1',epoch:epochA,authAfter:now-120};
const second={mode:'open',build:'release-2',epoch:epochB,authAfter:now-1};
const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
function customToken(epoch){
 const seconds=Math.floor(Date.now()/1000);
 return `${encode({alg:'none',typ:'JWT'})}.${encode({aud:'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',iat:seconds,exp:seconds+3600,iss:'firebase-auth-emulator@example.com',sub:'firebase-auth-emulator@example.com',uid:'alice',claims:{ip_release_epoch:epoch}})}.`;
}
const harness=`
import {initializeApp} from '/sdk/firebase-app.js';
import {getAuth,connectAuthEmulator,setPersistence,browserSessionPersistence,signInWithCustomToken,signOut} from '/sdk/firebase-auth.js';
import {getDatabase,connectDatabaseEmulator,ref,get,update,goOffline,goOnline} from '/sdk/firebase-database.js';
const app=initializeApp({apiKey:'fake',authDomain:'demo-ironpath.firebaseapp.com',projectId:'demo-ironpath',databaseURL:'http://127.0.0.1:9000?ns=demo-ironpath'});
const auth=getAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
const db=getDatabase(app);connectDatabaseEmulator(db,'127.0.0.1',9000);
window.harness={
 ready:()=>auth.authStateReady(),
 epoch:async()=>auth.currentUser?(await auth.currentUser.getIdTokenResult()).claims.ip_release_epoch:null,
 login:token=>signInWithCustomToken(auth,token),
 session:async()=>{await setPersistence(auth,browserSessionPersistence);await signOut(auth);},
 read:async()=>(await get(ref(db,'players/alice'))).val(),
 write:xp=>update(ref(db,'players/alice'),{xp}),
 offline:()=>goOffline(db),online:()=>goOnline(db),
 queue:xp=>{window.queued=update(ref(db,'players/alice'),{xp}).then(()=>({accepted:true}),error=>({accepted:false,code:error.code||''}));},
 result:()=>window.queued
};`;
(async()=>{
 const source=JSON.parse(await readFile('../WORKSHOP-RULES-TO-PUBLISH.json','utf8'));
 const {buildRulesCandidate}=await import(pathToFileURL(path.resolve('../../release-tools/rules-candidate.mjs')).href);
 const rules=buildRulesCandidate(source).candidate;
 const sdk=path.resolve('node_modules/firebase'), scripts={};
 for(const name of ['firebase-app.js','firebase-auth.js','firebase-database.js']){
  let js=await readFile(path.join(sdk,name),'utf8');
  if(name!=='firebase-app.js')js=js.replaceAll('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js','/sdk/firebase-app.js');
  scripts[`/sdk/${name}`]=js;
 }
 const server=http.createServer((req,res)=>{
  const file=new URL(req.url,'http://127.0.0.1').pathname;
  if(file==='/harness.js'){res.writeHead(200,{'content-type':'text/javascript'}).end(harness);return;}
  if(scripts[file]){res.writeHead(200,{'content-type':'text/javascript'}).end(scripts[file]);return;}
  if(file==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><html><body><script type="module" src="/harness.js"></script></body></html>');return;}
  res.writeHead(404).end();
 });
 let browser,env;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  env=await initializeTestEnvironment({projectId:project,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}});
  const adminSet=(p,v)=>env.withSecurityRulesDisabled(ctx=>set(p?ref(ctx.database(),p):ref(ctx.database()),v));
  const adminGet=async p=>{let value;await env.withSecurityRulesDisabled(async ctx=>{value=(await get(ref(ctx.database(),p))).val();});return value;};
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:process.env.CHROMIUM_PATH?['--no-sandbox']:[]});
  const url=`http://127.0.0.1:${server.address().port}/`;
  async function prepare(){
   await env.clearDatabase();await adminSet('',{_ironpathRelease:first,players:{alice:{name:'Alice',gender:'female',xp:0}}});
   const context=await browser.newContext(),old=await context.newPage();
   const pageErrors=[];old.on('pageerror',error=>pageErrors.push(String(error)));
   await old.goto(url);await old.waitForFunction(()=>window.harness);await old.evaluate(()=>window.harness.ready());
   await old.evaluate(token=>window.harness.login(token),customToken(epochA));
   assert.equal((await old.evaluate(()=>window.harness.read())).xp,0);
   await old.evaluate(()=>{window.harness.offline();window.harness.queue(5);});
   await adminSet('_ironpathRelease',{...first,mode:'maintenance',epoch:epochB});await adminSet('_ironpathRelease',second);
   const fresh=await context.newPage();fresh.on('pageerror',error=>pageErrors.push(String(error)));
   await fresh.goto(url);await fresh.waitForFunction(()=>window.harness);await fresh.evaluate(()=>window.harness.ready());
   return {context,old,fresh,pageErrors};
  }
  {
   const {context,old,fresh,pageErrors}=await prepare();
   try{
    await fresh.evaluate(token=>window.harness.login(token),customToken(epochB));
    await old.waitForFunction(async epoch=>await window.harness.epoch()===epoch,epochB,{timeout:15000});
    await fresh.evaluate(()=>window.harness.write(2));
    // The public currentUser changes before all dependent SDK listeners finish.
    await new Promise(resolve=>setTimeout(resolve,2000));
    await old.evaluate(()=>window.harness.online());
    const outcome=await old.evaluate(()=>window.harness.result());
    assert.equal(outcome.accepted,true,JSON.stringify(outcome));
    assert.equal((await adminGet('players/alice')).xp,5);
    assert.deepEqual(pageErrors,[]);
    console.log('UNSAFE characterization: local-persistence auth in the second tab upgraded the old offline queue.');
   }finally{await context.close();}
  }
  {
   const {context,old,fresh,pageErrors}=await prepare();
   try{
    await fresh.evaluate(()=>window.harness.session());
    await fresh.evaluate(token=>window.harness.login(token),customToken(epochB));
    // Old LOCAL sessions can be signed out by the persistence switch, but must
    // never receive the new SESSION token through origin-wide auth sync.
    await new Promise(resolve=>setTimeout(resolve,1500));
    assert.notEqual(await old.evaluate(()=>window.harness.epoch()),epochB);
    await fresh.evaluate(()=>window.harness.write(3));
    await old.evaluate(()=>window.harness.online());
    const outcome=await old.evaluate(()=>window.harness.result());
    assert.equal(outcome.accepted,false);assert.match(outcome.code,/permission.denied/i);
    assert.equal((await adminGet('players/alice')).xp,3);assert.deepEqual(pageErrors,[]);
    console.log('Tab-scoped session: the old tab kept its old/no auth, and its queued write was rejected.');
   }finally{await context.close();}
  }
 }finally{
  if(browser)await browser.close();if(env)await env.cleanup();await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
