// Exercise real account/game modules and actual clicks, with a mock Firebase
// transport only. This is an initialization test, not a live online match.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
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
    const artwork=['terrain-forest.jpg','terrain-city.jpg','terrain-desert.jpg','terrain-snow.jpg','terrain-marsh.jpg','tutorial-defend.jpg','tutorial-build.jpg','tutorial-soldier.jpg','armory-kit.jpg','armory-optics.jpg','bunker-sprite.png','hero-sprite.png','tank-sprite.png','boss-heavy-sprite.png','boss-plane-sprite.png','landmark-radio-sprite.png','landmark-transformer-sprite.png','landmark-bridge-sprite.png','landmark-truck-sprite.png','landmark-wreck-sprite.png','landmark-shelter-sprite.png','landmark-prison-sprite.png','landmark-dam-sprite.png'];
    const missing=await page.evaluate(async files=>{const results=await Promise.all(files.map(file=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(null);image.onerror=()=>resolve(file);image.src='assets/'+file;})));return results.filter(Boolean);},artwork);
    assert.deepEqual(missing,[],'artwork must load and decode in the browser');

    assert.equal(await page.locator('.brand-logo').evaluate(e=>e.complete && e.naturalWidth>0),true,'new logo loads');
    await page.evaluate(()=>document.getElementById('introOverlay').hidden=true);
    const visible=selector=>page.locator(selector).isVisible();
    assert.equal(await page.locator('.mode-card b').count(),0,'operation cards have no arrows');
    await page.locator('#menuCampaign').click(); await page.locator('#campaignBoard').waitFor({state:'visible'});
    assert.equal(await visible('.dashboard'),false,'campaign board is separate from the battlefield');
    assert.equal(await visible('#game'),false); assert.equal(await visible('#partyToggle'),false);
    await page.locator('#backToCommand').click();
    await page.locator('#menuEndless').click(); await page.locator('#gameWorkspace').waitFor({state:'visible'});
    assert.equal(await visible('#game'),true); assert.equal(await visible('#partyToggle'),false,'no multiplayer button in Endless');
    assert.equal(await visible('#campaignPanel'),false); assert.equal(await visible('#fourPartyPanel'),false);
    await page.locator('#backToCommand').click();
    await page.locator('#menuMultiplayer').click(); await page.locator('#fourPartyPanel').waitFor({state:'visible'});
    assert.equal(await visible('.profile-bar'),false,'no soldier header in lobby'); assert.equal(await visible('#campaignPanel'),false);
    assert.equal(await visible('#game'),false,'no map in lobby'); assert.equal(await visible('.dashboard'),false);
    await page.locator('#backToCommand').click();
    // Reproduce the reported case: a solo operation is already under way.
    await page.locator('#menuEndless').click(); await page.locator('#start').click(); await page.locator('#backToCommand').click();
    await page.locator('#menuArmory').click(); assert.ok(await page.locator('#armoryList .armory-art[data-item]').count()>0); assert.equal(await page.locator('#armoryDialog').evaluate(e=>e.open),true); assert.match(await page.locator('#armoryDialog .development-head').evaluate(e=>getComputedStyle(e).backgroundImage),/arsenal-workbench/);
    assert.equal(await page.locator('.armory-section[data-section="equipment"]').isVisible(),true);
    assert.equal(await page.locator('.armory-section[data-section="defenses"]').isVisible(),false);
    await page.locator('#armoryDefensesTab').click(); assert.equal(await page.locator('.armory-section[data-section="defenses"]').isVisible(),true); assert.equal(await page.locator('#armoryDefensesTab').getAttribute('aria-pressed'),'true');
    await page.locator('#armoryServiceTab').click(); assert.equal(await page.locator('.armory-section[data-section="service"]').isVisible(),true);
    await page.locator('#armoryEquipmentTab').click(); assert.equal(await page.locator('.armory-section[data-section="equipment"]').isVisible(),true); await page.locator('#armoryClose').click();
    await page.locator('#menuSkills').click(); assert.equal(await page.locator('#skillDialog').evaluate(e=>e.open),true); assert.match(await page.locator('#skillDialog .development-head').evaluate(e=>getComputedStyle(e).backgroundImage),/skill-field-dossier/); assert.ok(await page.locator('#skillPaths .tree-node').count()>10); await page.locator('#skillZoomIn').click(); await page.locator('#skillCenter').click();
    await page.locator('#skillPaths').scrollIntoViewIfNeeded();
    const box=await page.locator('#skillPaths').boundingBox(), cdp=await context.newCDPSession(page);
    const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y,id])=>({x,y,id}))});
    const x=box.x+box.width/2,y=box.y+box.height/2;
    const before=await page.locator('#skillPaths').evaluate(e=>({left:e.scrollLeft,top:e.scrollTop,width:e.firstElementChild.offsetWidth}));
    await touch('touchStart',[[x,y,1]]);await touch('touchMove',[[x+55,y+45,1]]);await touch('touchEnd',[]);
    const panned=await page.locator('#skillPaths').evaluate(e=>({left:e.scrollLeft,top:e.scrollTop}));assert.ok(panned.left<before.left-20&&panned.top<before.top-20,'one finger pans both axes');
    await touch('touchStart',[[x-40,y,2]]);await touch('touchStart',[[x-40,y,2],[x+40,y,3]]);await touch('touchMove',[[x-75,y,2],[x+75,y,3]]);await touch('touchEnd',[]);
    const width=await page.locator('#skillPaths .skill-tree-board').evaluate(e=>e.offsetWidth);assert.ok(width>before.width,'pinch zooms the skill board');
    await page.locator('[data-tree-jump="4"]').click(); const jumpTop=await page.locator('#skillPaths').evaluate(e=>e.scrollTop); assert.ok(jumpTop>700,'path shortcuts navigate to the correct lane');
    await page.locator('#skillCenter').click(); const node=page.locator('#skillPaths .tree-node').first();await node.scrollIntoViewIfNeeded();await node.tap();assert.equal(await node.getAttribute('aria-pressed'),'true','nodes still select on tap');
    await page.locator('#skillCancel').click();
    await page.locator('#menuTutorial').click(); assert.equal(await page.locator('#tutorialScene svg').count(),0); assert.match(await page.locator('#tutorialScene').evaluate(e=>getComputedStyle(e).backgroundImage),/tutorial-defend/); assert.equal(await page.locator('#tutorialDialog').evaluate(e=>e.open),true); await page.locator('#tutorialSkip').click();
    // Exercise the online handoff independently from Firebase: no stale solo
    // battlefield appears until the first authoritative match snapshot arrives.
    await page.evaluate(async()=>{const {createCommandCenter}=await import('./command-center.mjs?v=20261103-modes1');window.testNav=createCommandCenter({document,getProfile:()=>null,getGame:()=>({setMenuOpen(){},isOnlineMatch:()=>true}),isPartyActive:()=>true,openParty(){},closeParty(){},signOut(){}});document.querySelector('#gameWorkspace').dataset.onlineReady='false';window.testNav.showBattle();});
    assert.equal(await visible('.online-connecting'),true); assert.equal(await visible('#game'),false); assert.equal(await visible('#partyToggle'),true);
    await page.evaluate(()=>document.querySelector('#gameWorkspace').dataset.onlineReady='true');
    assert.equal(await visible('#game'),true); assert.equal(await visible('#campaignPanel'),false);
    await page.evaluate(()=>window.testNav.showLobby());
    assert.equal(await visible('#game'),false); assert.equal(await visible('#returnOnline'),true);
    assert.deepEqual(errors,[],`browser exceptions: ${errors.join('\n')}`);
    console.log('Initialized command center: campaign, endless, multiplayer, armory, skills and tutorial work with mock account.');
    await context.close();
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
