// Explicit opt-in smoke against the existing *test* deployment only. A random
// synthetic Firebase Auth account is created, used on the real browser login
// form, and deleted in finally. No real credentials, profile writes, secrets or
// tokens are printed. This is not a production or multi-device test.
const {randomBytes}=require('node:crypto');
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');
const ORIGIN='https://ironpath-release.vercel.app';
const DB='https://ironpathtest-default-rtdb.europe-west1.firebasedatabase.app';
const KEY='AIzaSyCY7Mz5OO7ql9Sqlq707mf9epbkiJ2oWIk'; // Firebase Web API key, not a secret.
const IDENTITY='https://identitytoolkit.googleapis.com/v1/accounts:';
const expected=process.argv[2];
if(process.argv.length!==3||!/^test-[a-f0-9]{40}$/.test(expected||'')){
 console.error('Explicit isolated test build ID required.');process.exit(2);
}
const email=`ironpath-browser-${randomBytes(12).toString('hex')}@example.invalid`;
const password=`A9!${randomBytes(24).toString('base64url')}`;
let stage='STATUS',token=null,signupStarted=false,browser=null,problem=false,cleanupProblem=false;
async function auth(action,body){
 const response=await fetch(`${IDENTITY}${action}?key=${KEY}`,{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify(body),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('AUTH_REQUEST_FAILED');
 return response.json();
}
(async()=>{
 try{
  const status=await fetch(`${DB}/_ironpathRelease.json`,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!status.ok)throw Error('STATUS_FAILED');
  const record=await status.json();
  if(record?.mode!=='open'||record.build!==expected)throw Error('TEST_NOT_OPEN');
  stage='CREATE_ACCOUNT';signupStarted=true;
  const created=await auth('signUp',{email,password,returnSecureToken:true});
  if(typeof created?.idToken!=='string'||typeof created?.localId!=='string')throw Error('NO_TEST_IDENTITY');
  token=created.idToken;
  const payload=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));
  if(payload.aud!=='ironpathtest'||payload.sub!==created.localId)throw Error('WRONG_TEST_PROJECT');

  stage='LAUNCHER';browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(()=>{try{localStorage.setItem('ironpath:language','en');}catch{}});
  // Avoid silently touching a different Firebase database/key if a build ever
  // regresses to the normal game's configuration. Never log request URLs.
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   const database=url.hostname.endsWith('.firebasedatabase.app')||url.hostname.endsWith('.firebaseio.com');
   if(database&&!url.hostname.startsWith('ironpathtest-')&&url.searchParams.get('ns')!=='ironpathtest-default-rtdb')return route.abort();
   if(['identitytoolkit.googleapis.com','securetoken.googleapis.com'].includes(url.hostname)&&url.searchParams.get('key')!==KEY)return route.abort();
   return route.continue();
  });
  await context.routeWebSocket(url=>url.hostname.endsWith('.firebasedatabase.app')||url.hostname.endsWith('.firebaseio.com'),socket=>{
   const url=new URL(socket.url());
   if(!url.hostname.startsWith('ironpathtest-')&&url.searchParams.get('ns')!=='ironpathtest-default-rtdb')return socket.close();
   return socket.connectToServer();
  });
  const page=await context.newPage();
  try{await page.goto(`${ORIGIN}/IronPath/`,{waitUntil:'domcontentloaded',timeout:45000});}
  catch(error){if(!String(error?.message).includes('ERR_ABORTED'))throw error;}
  await page.waitForURL(url=>url.origin===ORIGIN&&url.pathname===`/IronPath/releases/${expected}/`,{timeout:45000});
  await page.locator('#authView').waitFor({state:'visible',timeout:45000});
  await page.evaluate(()=>{const intro=document.getElementById('introOverlay');if(intro)intro.hidden=true;});
  assert.equal(await page.locator('#ironpath-guarded-game').isVisible(),true);
  stage='PASSWORD_LOGIN';
  await page.locator('#email').fill(email);await page.locator('#password').fill(password);
  await page.locator('#authSubmit').click();
  // A newly created account has no profile. Reaching recruitment proves that
  // the guarded browser session could read its (empty) test profile; no test
  // profile or extra social data is created by this smoke.
  await page.locator('#characterView').waitFor({state:'visible',timeout:45000});
  assert.equal(await page.locator('#authView').isHidden(),true);
  assert.equal(await page.locator('#connectionView').isHidden(),true);
  await context.close();
 }catch{problem=true;console.error(`Isolated browser test stopped at ${stage}.`);}
 finally{
  try{await browser?.close();}catch{problem=true;}
  if(signupStarted){
   try{
    // If the sign-up response was lost, recover the synthetic account using
    // its random email/password and still attempt deletion.
    if(!token){const signed=await auth('signInWithPassword',{email,password,returnSecureToken:true});token=signed.idToken;}
    if(typeof token!=='string')throw Error('NO_CLEANUP_TOKEN');
    await auth('delete',{idToken:token});
   }catch{cleanupProblem=true;console.error('Synthetic test account cleanup could not be confirmed.');}
  }
 }
 if(problem||cleanupProblem)process.exitCode=1;
 else console.log('Isolated live browser reached recruitment after login; synthetic account deleted.');
})();
