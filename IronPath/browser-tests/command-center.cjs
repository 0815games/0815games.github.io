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
      'firebase-auth.js': `const user={uid:'mock-user',getIdToken:async()=> 'mock'}; const auth={currentUser:user}; export function getAuth(){return auth} export function onAuthStateChanged(a,cb){globalThis.__mockAuth=next=>{a.currentUser=next;cb(next)};setTimeout(()=>cb(user),0);return ()=>{}} export async function signOut(a){a.currentUser=null} export async function signInWithEmailAndPassword(){} export async function createUserWithEmailAndPassword(){} export async function sendPasswordResetEmail(){}`,
      'firebase-database.js': `const profile={name:'Test Soldier',gender:'female',xp:750}; let invite={alice:{name:'Alice',code:'0123',partyId:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',createdAt:Date.now()}},inviteCb,friendRequests={},friendListeners=new Set();globalThis.__friendUpdate=value=>{friendRequests=value;for(const cb of friendListeners)cb({val:()=>friendRequests})};globalThis.__friendListenerCount=()=>friendListeners.size; export function getDatabase(){return {}} export function ref(db,path){return {path}} export function onValue(r,cb){if(r.path==='players/mock-user')queueMicrotask(()=>cb({val:()=>profile}));if(r.path==='coopInvites/mock-user'){inviteCb=cb;queueMicrotask(()=>cb({val:()=>invite}));}if(r.path==='friendships/mock-user'){friendListeners.add(cb);queueMicrotask(()=>{if(friendListeners.has(cb))cb({val:()=>friendRequests})});return ()=>friendListeners.delete(cb);}return ()=>{}} export async function runTransaction(){return {committed:false}} export async function get(){return {val:()=>null,exists:()=>false,forEach(){}}} export async function remove(r){if(r.path==='coopInvites/mock-user/alice'){invite={};inviteCb?.({val:()=>invite});}} export async function set(r,v){(globalThis.__firebaseWrites??=[]).push(r.path);if(r.path==='friendships/mock-user/alice/status'){globalThis.__friendUpdate({...friendRequests,alice:{...friendRequests.alice,status:v}})}} export async function update(){} export function onDisconnect(){return {cancel:async()=>{},remove:async()=>{}}} export function serverTimestamp(){return 0} export function query(r,...args){return r} export function orderByKey(){return {}} export function startAfter(v){return {}} export function limitToFirst(v){return {}} export function orderByChild(v){return {}} export function limitToLast(v){return {}}`
    };
    await context.route('**/*',route=>{
      const url=new URL(route.request().url());
      if(url.hostname==='www.gstatic.com' && mocks[url.pathname.split('/').pop()])return route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:mocks[url.pathname.split('/').pop()]});
      if(url.hostname!=='127.0.0.1')return route.abort();
      return route.continue();
    });
    await page.goto('http://127.0.0.1:8765/IronPath/',{waitUntil:'load'});
    await page.locator('#menuName').waitFor({state:'visible',timeout:10000});
    await page.waitForFunction(()=>window.__firebaseWrites?.some(p=>p.startsWith('friendNames/')&&p.endsWith('/mock-user'))); // indexed without opening Friends
    assert.equal(await page.locator('#friendIndexError').isHidden(),true);
    const artwork=['terrain-forest.jpg','terrain-city.jpg','terrain-desert.jpg','terrain-snow.jpg','terrain-marsh.jpg','tutorial-defend.jpg','tutorial-build.jpg','tutorial-soldier.jpg','armory-kit.jpg','armory-optics.jpg','bunker-sprite.png','hero-sprite.png','tank-sprite.png','boss-heavy-sprite.png','boss-plane-sprite.png','landmark-radio-sprite.png','landmark-transformer-sprite.png','landmark-bridge-sprite.png','landmark-truck-sprite.png','landmark-wreck-sprite.png','landmark-shelter-sprite.png','landmark-prison-sprite.png','landmark-dam-sprite.png'];
    const missing=await page.evaluate(async files=>{const results=await Promise.all(files.map(file=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(null);image.onerror=()=>resolve(file);image.src='assets/'+file;})));return results.filter(Boolean);},artwork);
    assert.deepEqual(missing,[],'artwork must load and decode in the browser');

    assert.equal(await page.locator('.brand-logo').evaluate(e=>e.complete && e.naturalWidth>0),true,'new logo loads');
    await page.evaluate(()=>document.getElementById('introOverlay').hidden=true);
    const visible=selector=>page.locator(selector).isVisible();
    await page.locator('#socialPopup').waitFor({state:'visible'});assert.match(await page.locator('#socialPopupTitle').innerText(),/PARTY INVITATION/);assert.match(await page.locator('#socialPopupBody').innerText(),/Alice/);await page.locator('#socialPopupDismiss').click();

    assert.equal(await page.locator('.mode-card b').count(),0,'operation cards have no arrows');
    assert.equal(await page.locator('#friendRequestNotification').isHidden(),true);
    await page.evaluate(()=>window.__friendUpdate({alice:{status:'pending',senderName:'Alice'},bob:{status:'accepted',senderName:'Bob'}}));
    assert.match(await page.locator('#friendRequestNotification').innerText(),/1 FRIEND REQUEST/);
    await page.locator('#socialPopup').waitFor({state:'visible'});assert.match(await page.locator('#socialPopupBody').innerText(),/Alice/);await page.locator('#socialPopupOpen').click();assert.match(await page.locator('#friendRequests').innerText(),/Alice/);await page.locator('#friendRequests button').filter({hasText:'ACCEPT'}).click();await page.locator('#friendRequestNotification').waitFor({state:'hidden'});await page.locator('#friendsClose').click();
    await page.evaluate(()=>window.__friendUpdate({alice:{status:'pending',senderName:'Alice'},eve:{status:'pending',senderName:'Eve'}}));assert.match(await page.locator('#friendRequestNotification').innerText(),/2 FRIEND REQUESTS/);await page.evaluate(()=>window.__friendUpdate({}));await page.locator('#friendRequestNotification').waitFor({state:'hidden'});
    await page.locator('#menuCampaign').click(); await page.locator('#campaignBoard').waitFor({state:'visible'});
    assert.equal(await visible('.dashboard'),false,'campaign board is separate from the battlefield');
    assert.equal(await visible('#game'),false); assert.equal(await visible('#partyToggle'),false);
    await page.locator('#backToCommand').click();
    await page.locator('#menuEndless').click(); await page.locator('#gameWorkspace').waitFor({state:'visible'});
    assert.equal(await visible('#game'),true); assert.equal(await visible('#partyToggle'),false,'no multiplayer button in Endless');
    assert.equal(await visible('#campaignPanel'),false); assert.equal(await visible('#fourPartyPanel'),false);
    await page.evaluate(()=>{document.querySelector('#radialMenu').hidden=false;});await page.locator('#game').click({position:{x:5,y:5}});assert.equal(await page.locator('#radialMenu').isHidden(),true,'outside click closes the tower sheet');
    await page.evaluate(()=>{document.querySelector('#radialMenu').hidden=false;document.querySelector('#towerDetails').showModal();});await page.mouse.click(1,1);assert.equal(await page.locator('#towerDetails').evaluate(e=>e.open),false,'backdrop closes tower details');assert.equal(await page.locator('#radialMenu').isHidden(),true);
    await page.locator('#backToCommand').click();
    await page.locator('#menuMultiplayer').click(); await page.locator('#fourPartyPanel').waitFor({state:'visible'});await page.locator('#lobbyFriends').click();assert.equal(await page.locator('#friendsDialog').evaluate(e=>e.open),true);await page.locator('#friendsClose').click();
    await page.locator('.multiplayer-help summary').click(); assert.match(await page.locator('.multiplayer-help').innerText(),/codes can be guessed/i); assert.match(await page.locator('.multiplayer-help').innerText(),/host reload/i);
    assert.equal(await visible('.profile-bar'),false,'no soldier header in lobby'); assert.equal(await visible('#campaignPanel'),false);
    assert.equal(await visible('#game'),false,'no map in lobby'); assert.equal(await visible('.dashboard'),false);
    await page.locator('#backToCommand').click();
    await page.locator('#inviteNotification').click();assert.match(await page.locator('#coopInviteList').innerText(),/Alice/);await page.locator('#coopInviteList button').filter({hasText:'DECLINE'}).click();await page.locator('#inviteNotification').waitFor({state:'hidden'});await page.locator('#friendsClose').click();
    await page.locator('#menuFriends').click();assert.equal(await page.locator('#friendsDialog').evaluate(e=>e.open),true);assert.equal(await page.locator('#friendVisibility').count(),0);await page.locator('#friendInput').fill('Bob');await page.locator('#friendSearch').click();assert.match(await page.locator('#friendStatus').innerText(),/No players found/);assert.equal(await page.locator('#friendCode').count(),0);await page.locator('#friendsClose').click();
    await page.locator('#menuLeaderboard').click();assert.equal(await page.locator('#leaderboardDialog').evaluate(e=>e.open),true);assert.match(await page.locator('#leaderboardDialog').innerText(),/not verified/);await page.locator('#leaderboardCoop').click();assert.equal(await page.locator('#leaderboardCoop').getAttribute('aria-pressed'),'true');await page.locator('#leaderboardFriends').click();assert.equal(await page.locator('#leaderboardFriends').getAttribute('aria-pressed'),'true');await page.locator('#leaderboardClose').click();
    // Reproduce the reported case: a solo operation is already under way.
    await page.locator('#menuEndless').click(); await page.locator('#start').click(); await page.locator('#backToCommand').click();
    await page.locator('#menuArmory').click(); assert.ok(await page.locator('#armoryList .armory-art[data-item]').count()>0); assert.equal(await page.locator('#armoryDialog').evaluate(e=>e.open),true); assert.match(await page.locator('#armoryDialog .development-head').evaluate(e=>getComputedStyle(e).backgroundImage),/arsenal-workbench/);
    assert.equal(await page.locator('.armory-section[data-section="equipment"]').isVisible(),true);
    assert.equal(await page.locator('.armory-section[data-section="defenses"]').isVisible(),false);
    await page.locator('#armoryDefensesTab').click(); assert.equal(await page.locator('.armory-section[data-section="defenses"]').isVisible(),true); assert.equal(await page.locator('#armoryDefensesTab').getAttribute('aria-pressed'),'true');
    await page.locator('#armoryServiceTab').click(); assert.equal(await page.locator('.armory-section[data-section="service"]').isVisible(),true);
    await page.locator('#armoryEquipmentTab').click(); assert.equal(await page.locator('.armory-section[data-section="equipment"]').isVisible(),true); await page.mouse.click(1,1);assert.equal(await page.locator('#armoryDialog').evaluate(e=>e.open),false,'backdrop closes armory');
    await page.locator('#menuSkills').click(); assert.equal(await page.locator('#skillDialog').evaluate(e=>e.open),true);
    assert.equal(await page.locator('[data-skill-path="assault"]').getAttribute('aria-pressed'),'true');
    assert.ok(await page.locator('#skillPaths .skill-card').count()>10);assert.equal(await page.locator('.skill-tree-board').count(),0,'no map to pan or zoom');
    await page.locator('[data-skill-path="recon"]').tap();assert.equal(await page.locator('[data-skill-path="recon"]').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#skillPaths').innerText(),/Suppression/);
    await page.locator('#skillFilter').selectOption('hybrid'); assert.ok(await page.locator('#skillPaths .skill-card').count()>0);assert.equal(await page.locator('#skillPaths .skill-card[data-rank="1"]').count(),0);
    await page.locator('#skillFilter').selectOption('all'); const node=page.locator('#skillPaths .skill-card[data-path="recon"][data-rank="2"]');await node.scrollIntoViewIfNeeded();await node.tap();assert.equal(await node.getAttribute('aria-pressed'),'true');assert.match(await page.locator('#skillDetailTitle').innerText(),/Recon/);
    await page.locator('#skillPaths .skill-card[data-path="recon"][data-rank="1"]').click();await page.locator('#skillDetailAction').click();assert.match(await page.locator('#skillStatus').innerText(),/Unsaved draft/);
    await page.mouse.click(1,1);assert.equal(await page.locator('#gameConfirm').evaluate(e=>e.open),true);await page.locator('#gameConfirmCancel').click();assert.equal(await page.locator('#skillDialog').evaluate(e=>e.open),true,'cancel preserves the draft');
    await page.keyboard.press('Escape');assert.equal(await page.locator('#gameConfirm').evaluate(e=>e.open),true);await page.locator('#gameConfirmAccept').click();assert.equal(await page.locator('#skillDialog').evaluate(e=>e.open),false);
    await page.locator('#menuTutorial').click(); assert.equal(await page.locator('#tutorialScene svg').count(),0); assert.match(await page.locator('#tutorialScene').evaluate(e=>getComputedStyle(e).backgroundImage),/tutorial-defend/); assert.equal(await page.locator('#tutorialDialog').evaluate(e=>e.open),true);
    for(let i=0;i<7;i++)await page.locator('#tutorialNext').click();assert.match(await page.locator('#tutorialTitle').innerText(),/Skills menu/);assert.equal(await page.locator('#tutorialSkillUpgrade').isDisabled(),true);await page.locator('#tutorialSkillNode').click();assert.equal(await page.locator('#tutorialSkillNode').getAttribute('aria-pressed'),'true');await page.locator('#tutorialSkillUpgrade').click();assert.equal(await page.locator('#tutorialNext').isDisabled(),true);await page.locator('#tutorialSkillSave').click();await page.locator('#tutorialNext').click();
    assert.match(await page.locator('#tutorialTitle').innerText(),/Armory/);assert.equal(await page.locator('#tutorialEquipmentTab').getAttribute('aria-pressed'),'true');await page.locator('#tutorialEquip').click();await page.locator('#tutorialBunkerTab').click();assert.equal(await page.locator('#tutorialBunkerTab').getAttribute('aria-pressed'),'true');await page.locator('#tutorialBunkerUpgrade').click();await page.locator('#tutorialBunkerConfirm').click();assert.match(await page.locator('#tutorialScrap').innerText(),/30 SCRAP/);await page.locator('#tutorialNext').click();assert.equal(await page.locator('#tutorialDialog').evaluate(e=>e.open),false);

    // Exercise the online handoff independently from Firebase: no stale solo
    // battlefield appears until the first authoritative match snapshot arrives.
    await page.evaluate(async()=>{const {createCommandCenter}=await import('./command-center.mjs?v=20261103-modes1');window.testNav=createCommandCenter({document,getProfile:()=>null,getGame:()=>({setMenuOpen(){},isOnlineMatch:()=>true}),isPartyActive:()=>true,openParty(){},closeParty(){},signOut(){}});document.querySelector('#gameWorkspace').dataset.onlineReady='false';window.testNav.showBattle();});
    assert.equal(await visible('.online-connecting'),true); assert.equal(await visible('#game'),false); assert.equal(await visible('#partyToggle'),true);
    await page.evaluate(()=>document.querySelector('#gameWorkspace').dataset.onlineReady='true');
    assert.equal(await visible('#game'),true); assert.equal(await visible('#campaignPanel'),false);
    await page.evaluate(()=>window.testNav.showLobby());
    assert.equal(await visible('#game'),false); assert.equal(await visible('#returnOnline'),true);
    await page.evaluate(()=>window.__mockAuth(null));assert.equal(await page.evaluate(()=>window.__friendListenerCount()),0);assert.equal(await page.locator('#friendRequestNotification').isHidden(),true);
    assert.deepEqual(errors,[],`browser exceptions: ${errors.join('\n')}`);
    console.log('Initialized command center: campaign, endless, multiplayer, armory, skills and tutorial work with mock account.');
    await context.close();
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
