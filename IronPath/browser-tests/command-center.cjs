// Exercise real account/game modules and actual clicks, with a mock Firebase
// transport only. This is an initialization test, not a live online match.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const page = await context.newPage(), errors=[];
    page.on('pageerror', error => errors.push(error.stack || String(error)));
    const mocks = {
      'firebase-app.js': `export function initializeApp(){return {}}`,
      'firebase-auth.js': `const user={uid:'mock-user',getIdToken:async()=> 'mock'}; const auth={currentUser:user}; export function getAuth(){return auth} export function onAuthStateChanged(a,cb){setTimeout(()=>cb(user),0);return ()=>{}} export async function signOut(a){a.currentUser=null} export async function signInWithEmailAndPassword(){} export async function createUserWithEmailAndPassword(){} export async function sendPasswordResetEmail(){}`,
      'firebase-database.js': `const profile={name:'Test Soldier',gender:'female',xp:0}; export function getDatabase(){return {}} export function ref(db,path){return {path}} export function onValue(r,cb){if(r.path==='players/mock-user')queueMicrotask(()=>cb({val:()=>profile}));return ()=>{}} export async function runTransaction(){return {committed:false}} export async function get(){return {val:()=>null,exists:()=>false}} export async function remove(){} export async function set(){} export async function update(){} export function onDisconnect(){return {cancel:async()=>{},remove:async()=>{}}} export function serverTimestamp(){return 0}`
    };
    await context.route('**/*',route=>{
      const url=new URL(route.request().url());
      if(url.hostname==='www.gstatic.com' && mocks[url.pathname.split('/').pop()])return route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:mocks[url.pathname.split('/').pop()]});
      if(url.hostname!=='127.0.0.1')return route.abort();
      return route.continue();
    });
    await page.goto('http://127.0.0.1:8765/IronPath/',{waitUntil:'load'});
    await page.locator('#menuName').waitFor({state:'visible',timeout:10000});
    await page.evaluate(()=>document.getElementById('introOverlay').hidden=true);
    await page.locator('#menuCampaign').click(); await page.locator('#campaignBoard').waitFor({state:'visible'});
    await page.locator('#backToCommand').click();
    await page.locator('#menuEndless').click(); await page.locator('#gameWorkspace').waitFor({state:'visible'});
    await page.locator('#backToCommand').click();
    await page.locator('#menuMultiplayer').click(); await page.locator('#fourPartyPanel').waitFor({state:'visible'});
    await page.locator('#partyToggle').click(); await page.locator('#backToCommand').click();
    await page.locator('#menuArmory').click(); assert.equal(await page.locator('#armoryDialog').evaluate(e=>e.open),true); await page.locator('#armoryClose').click();
    await page.locator('#menuSkills').click(); assert.equal(await page.locator('#skillDialog').evaluate(e=>e.open),true); await page.locator('#skillCancel').click();
    await page.locator('#menuTutorial').click(); assert.equal(await page.locator('#tutorialDialog').evaluate(e=>e.open),true); await page.locator('#tutorialSkip').click();
    assert.deepEqual(errors,[],`browser exceptions: ${errors.join('\n')}`);
    console.log('Initialized command center: campaign, endless, multiplayer, armory, skills and tutorial work with mock account.');
    await context.close();
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
