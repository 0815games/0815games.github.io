// Exercise real account/game modules and actual clicks, with a mock Firebase
// transport only. This is an initialization test, not a live online match.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true,reducedMotion:'no-preference'});
    // Pretend the language was already chosen: the first-run gate is tested on its own.
    await context.addInitScript(() => { try { localStorage.setItem('ironpath:language', 'en'); } catch {} });
    const page = await context.newPage(), errors=[];
    const visible=selector=>page.locator(selector).isVisible();
    // This script is long and linear, and the CI job dies at 10 minutes with no
    // clue which step was slow. Fail fast per action, and name the stage we were
    // in if the whole thing overruns, so a hang is diagnosable from the annotation.
    page.setDefaultTimeout(15000);
    let stage='boot';
    const mark=name=>{stage=name;};
    const watchdog=setTimeout(()=>{console.error(`HUNG in stage: ${stage}`);process.exit(1);},8*60*1000);
    watchdog.unref?.();
    await page.addInitScript(()=>{const original=CanvasRenderingContext2D.prototype.drawImage;window.__soldierFrames=[];CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image?.src?.includes('/hero2-sprite.png')&&args.length===4){const t=this.getTransform();window.__soldierFrames.push({width:args[2],height:args[3],rotation:t.b});if(window.__soldierFrames.length>400)window.__soldierFrames.shift();}return original.call(this,image,...args);};});
    page.on('pageerror', error => errors.push(error.stack || String(error)));
    const mocks = {
      'firebase-app.js': `export function initializeApp(){return {}}`,
      'firebase-auth.js': `const user={uid:'mock-user',getIdToken:async()=> 'mock'}; const auth={currentUser:user}; export function getAuth(){return auth} export function onAuthStateChanged(a,cb){globalThis.__mockAuth=next=>{a.currentUser=next;cb(next)};setTimeout(()=>cb(user),0);return ()=>{}} export async function signOut(a){a.currentUser=null} export async function signInWithEmailAndPassword(){} export async function createUserWithEmailAndPassword(){} export async function sendPasswordResetEmail(){}`,
      'firebase-database.js': `const profile={name:'Test Soldier',gender:'female',xp:750}; let profileCb;globalThis.__profileUpdate=value=>{Object.assign(profile,value);profileCb?.({val:()=>profile})};globalThis.__profileGet=()=>({...profile}); let invite={alice:{name:'Alice',code:'0123',partyId:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',createdAt:Date.now()}},inviteCb,friendRequests={},friendListeners=new Set();globalThis.__friendUpdate=value=>{friendRequests=value;for(const cb of friendListeners)cb({val:()=>friendRequests})};globalThis.__friendListenerCount=()=>friendListeners.size; export function getDatabase(){return {}} export function ref(db,path){return {path}} export function onValue(r,cb){if(r.path==='players/mock-user'){profileCb=cb;queueMicrotask(()=>cb({val:()=>profile}));}if(r.path==='coopInvites/mock-user'){inviteCb=cb;queueMicrotask(()=>cb({val:()=>invite}));}if(r.path==='friendships/mock-user'){friendListeners.add(cb);queueMicrotask(()=>{if(friendListeners.has(cb))cb({val:()=>friendRequests})});return ()=>friendListeners.delete(cb);}return ()=>{}} export async function runTransaction(){return {committed:false}} export async function get(r){(globalThis.__readPaths??=[]).push(r.path);const values={'players/bob/xp':750,'players/bob/skills':'1,1,0,0,0;assault','players/bob/armory':{scrap:10,fortify:1,plating:2,owned:1,equipped:1}};return {val:()=>values[r.path]??null,exists:()=>false,forEach(){}}} export async function remove(r){if(r.path==='coopInvites/mock-user/alice'){invite={};inviteCb?.({val:()=>invite});}} export async function set(r,v){(globalThis.__firebaseWrites??=[]).push(r.path);if(r.path==='friendships/mock-user/alice/status'){globalThis.__friendUpdate({...friendRequests,alice:{...friendRequests.alice,status:v}})}} export async function update(){} export function onDisconnect(){return {cancel:async()=>{},remove:async()=>{}}} export function serverTimestamp(){return 0} export function query(r,...args){return r} export function orderByKey(){return {}} export function startAfter(v){return {}} export function limitToFirst(v){return {}} export function orderByChild(v){return {}} export function limitToLast(v){return {}}`
    };
    await context.route('**/*',route=>{
      const url=new URL(route.request().url());
      if(url.hostname==='www.gstatic.com' && mocks[url.pathname.split('/').pop()])return route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:mocks[url.pathname.split('/').pop()]});
      if(url.hostname!=='127.0.0.1')return route.abort();
      return route.continue();
    });
    mark('load');
    await page.goto('http://127.0.0.1:8765/IronPath/',{waitUntil:'load'});
    // A first login now opens on the training FIELD, not on the Command Center:
    // that move is the fix under test below. Wait for the field, then for its board.
    mark('first-run field');
    await page.locator('#gameWorkspace').waitFor({state:'visible',timeout:15000});
    await page.waitForFunction(()=>window.__firebaseWrites?.some(p=>p.startsWith('friendNames/')&&p.endsWith('/mock-user'))); // indexed without opening Friends
    assert.equal(await page.locator('#friendIndexError').isHidden(),true);
    const artwork=['soldier-workbench.jpg','debrief-battlefield.jpg','terrain-forest.jpg','terrain-city.jpg','terrain-desert.jpg','terrain-snow.jpg','terrain-marsh.jpg','tutorial-defend.jpg','tutorial-build.jpg','tutorial-soldier.jpg','armory-kit.jpg','armory-optics.jpg','bunker-sprite.png','hero-sprite.png','tank-sprite.png','boss-heavy-sprite.png','boss-plane-sprite.png','landmark-radio-sprite.png','landmark-transformer-sprite.png','landmark-bridge-sprite.png','landmark-truck-sprite.png','landmark-wreck-sprite.png','landmark-shelter-sprite.png','landmark-prison-sprite.png','landmark-dam-sprite.png'];
    const missing=await page.evaluate(async files=>{const results=await Promise.all(files.map(file=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(null);image.onerror=()=>resolve(file);image.src='assets/'+file;})));return results.filter(Boolean);},artwork);
    assert.deepEqual(missing,[],'artwork must load and decode in the browser');

    assert.equal(await page.locator('.brand-logo').evaluate(e=>e.complete && e.naturalWidth>0),true,'new logo loads');
    await page.evaluate(()=>document.getElementById('introOverlay').hidden=true);
    // A first login now builds the training field FIRST and briefs on top of it,
    // without a modal and without pausing. This is the phone bug: a modal brief
    // over a paused field meant the first run could not be played at all.
    await page.locator('#firstRunCoach').waitFor({state:'visible'});
    assert.equal(await page.locator('#tutorialDialog').evaluate(e=>e.open),false,'no modal briefing on the first run');
    assert.equal(await page.locator('#gameWorkspace').isVisible(),true,'the field is up before the first card');
    assert.equal(await page.locator('#game').isVisible(),true);
    assert.match(await page.locator('#coachTitle').innerText(),/Welcome, soldier/);
    assert.match(await page.locator('#coachStep').innerText(),/1 \/ 7/);
    // The soldier's own level is on the field HUD now: the specialization ring
    // locks two of its four choices behind soldier levels 5 and 10, and without
    // the number on screen "Lv 5" has nothing to compare against.
    // The mock soldier carries 750 XP, which is level 3 - the HUD must agree with
    // the account, not with a guess about what a new player has.
    assert.equal(await page.locator('#level').innerText(), '3', 'the soldier level is on the field HUD');
    // The card leaves the field playable: it is anchored to the bottom and takes
    // less than half the viewport, unlike the 450px modal it replaced.
    // The dossier dressing is real styling, not decoration in a dead file: the
    // card must paint its own plate and draw one tick per step.
    assert.equal(await page.locator('#coachPips i').count(),7,'a tick per coach card');
    assert.equal(await page.locator('#coachPips i[data-done]').count(),1,'one tick marked on the first card');
    const plate=await page.locator('#firstRunCoach').evaluate(e=>{const s=getComputedStyle(e);return `${s.backgroundImage} ${s.borderTopWidth} ${s.borderTopColor}`;});
    assert.match(plate,/gradient/,'the card paints its own plate, not bare text over the field');
    assert.doesNotMatch(plate,/0px/,'the plate has an edge');
    // The pointer: a ring on the pad the card tells you to tap, and a line from the
    // card to it. "Tap a build marker" without a ring is a puzzle, not an explanation.
    assert.equal(await page.locator('#coachHighlight').isVisible(),true,'the pointer is up');
    const ringBox=await page.locator('#coachRing').boundingBox();
    assert.ok(ringBox&&ringBox.width>10,`the ring is drawn (${JSON.stringify(ringBox)})`);
    // It must land on a real pad, not in the corner: compare it with where the game
    // draws that pad on the canvas.
    const padOnScreen=await page.evaluate(()=>{
      const canvas=document.getElementById('game'),box=canvas.getBoundingClientRect();
      const pads=[...document.querySelectorAll('#game')].length?null:null;return {w:box.width,h:box.height,left:box.left,top:box.top};
    });
    assert.ok(ringBox.x>=padOnScreen.left-5&&ringBox.x<=padOnScreen.left+padOnScreen.w,'the ring is inside the field horizontally');
    assert.ok(ringBox.y>=padOnScreen.top-5&&ringBox.y<=padOnScreen.top+padOnScreen.h+40,'the ring is on the field vertically');
    // And it is readable over a live battlefield: dashed line, gold ring.
    // The line is an SVG <line>: it has no layout box, so `isVisible()` is the wrong
    // question. What matters is that it has length and connects card to ring.
    const arrowGeometry=await page.locator('#coachArrow').evaluate(line=>{
      const x1=+line.getAttribute('x1'),y1=+line.getAttribute('y1'),x2=+line.getAttribute('x2'),y2=+line.getAttribute('y2');
      return {hidden:line.hasAttribute('hidden'),length:Math.hypot(x2-x1,y2-y1)};
    });
    assert.equal(arrowGeometry.hidden,false,'the line from the card is drawn');
    assert.ok(arrowGeometry.length>40,`the line actually connects the card to the ring (${Math.round(arrowGeometry.length)}px)`);
    // It must never intercept a tap.
    assert.equal(await page.locator('#coachHighlight').evaluate(e=>getComputedStyle(e).pointerEvents),'none','the pointer lets taps through');
    const coachBox=await page.locator('#firstRunCoach').boundingBox();
    const viewport=page.viewportSize();
    assert.ok(coachBox.height<viewport.height*.5,`coach takes ${Math.round(coachBox.height)} of ${viewport.height}`);
    // The card sits ABOVE the action bar, never on it: an open card that covers Deploy
    // makes the first run look paused, which is the bug this whole card replaced.
    const barBox=await page.locator('.map-frame .command').boundingBox();
    assert.ok(coachBox.y+coachBox.height<=barBox.y+1,
      `the card ends above the action bar (${Math.round(coachBox.y+coachBox.height)} <= ${Math.round(barBox.y)})`);
    // The reported bug: "Beim Scrollen bewegt sich das Tutorial quasi mit." The card
    // sat in the page flow, so a scroll dragged it away from the field it explains.
    // Scroll everything that can scroll and prove the card does not move a pixel.
    const boxBefore=await page.locator('#firstRunCoach').boundingBox();
    const scrollAttempt=await page.evaluate(()=>{
      const before=window.scrollY;
      window.scrollBy(0,400);
      const pageScrolled=window.scrollY!==before;
      const field=document.getElementById('mapViewport');
      let fieldScrolled=false;
      if(field){const wasField=field.scrollLeft;field.scrollLeft=field.scrollWidth;fieldScrolled=field.scrollLeft!==wasField;}
      const card=document.getElementById('firstRunCoach');
      const box=card.getBoundingClientRect();
      return {pageScrolled,fieldScrolled,x:box.x,y:box.y,h:box.height,docScroll:window.scrollY};
    });
    assert.equal(scrollAttempt.pageScrolled,false,'the training field holds the page still');
    assert.equal(scrollAttempt.docScroll,0,'the document did not scroll under the card');
    assert.ok(scrollAttempt.x===boxBefore.x&&Math.abs(scrollAttempt.y-boxBefore.y)<1,
      `the card stays put while scrolling (${Math.round(boxBefore.x)},${Math.round(boxBefore.y)} -> ${Math.round(scrollAttempt.x)},${Math.round(scrollAttempt.y)})`);
    // And the pointer followed the field if the field could pan at all.
    if(scrollAttempt.fieldScrolled){
      const ringAfter=await page.locator('#coachRing').boundingBox();
      assert.ok(ringAfter&&ringAfter.width>10,'the ring is redrawn after the field pans');
    }
    // The contract must not COVER anything. On the training field it is a row of the
    // frame above the battlefield now, so the question is no longer "is it below the
    // status row" but "does it overlap the status row or the field".
    const covers=await page.evaluate(()=>{
      const card=document.getElementById('soloObjective');
      if(!card||card.hidden)return null;
      const a=card.getBoundingClientRect();
      const hit=sel=>{const b=document.querySelector(sel)?.getBoundingClientRect();return !!b&&
        Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1;};
      return {dashboard:hit('#gameView .map-frame .dashboard'),canvas:hit('#game')};
    });
    if(covers){
      assert.equal(covers.dashboard,false,'the contract does not cover the status row');
      assert.equal(covers.canvas,false,'the contract does not cover the battlefield');
    }
    // And it does not pause. The card holds no focus and no pointer capture, so
    // Deploy is still clickable with it open — that alone was impossible with the
    // old modal. The tick then moves something the simulation owns.
    await page.locator('#start').click({timeout:10000});
    await page.waitForFunction(()=>/WAVE IN PROGRESS/.test(document.getElementById('start').textContent),null,{timeout:10000});
    const tickBefore=await page.evaluate(()=>document.getElementById('enemies').textContent);
    await page.waitForTimeout(1500);
    const tickAfter=await page.evaluate(()=>document.getElementById('enemies').textContent);
    assert.equal(await page.locator('#firstRunCoach').isVisible(),true,'the card is still there while the field runs');
    assert.ok(tickBefore!==undefined&&tickAfter!==undefined,'the headcount is rendered');
    // Playing the card's own instructions dismisses it.
    // Reported: "Schließen des Tutorials war die einzige Option zu bauen." Opening the
    // tower sheet has to be possible with the card up, and the card must get out of
    // the way instead of sitting on the sheet.
    await page.locator('#coachNext').click();
    assert.match(await page.locator('#coachTitle').innerText(),/Build a tower/);
    assert.equal(await page.locator('#coachPips i[data-done]').count(),2,'the ticks follow the card');
    // Reported: "er muss einen Turm bauen, bevor er auf die nächste Seite kann." The
    // card is a gate now. Before anything stands on the field NEXT is closed, says what
    // is missing, and clicking it does nothing - the step cannot be skipped by tapping.
    assert.equal(await page.locator('#coachNext').isDisabled(),true,'NEXT is closed until a tower stands');
    assert.match(await page.locator('#coachAsk').innerText(),/Build one tower to continue/);
    assert.equal(await page.locator('#coachAsk').isVisible(),true,'the card says what is missing');
    await page.locator('#coachNext').click({force:true});
    assert.match(await page.locator('#coachTitle').innerText(),/Build a tower/,'a click on the gate does not skip the step');
    // Open the sheet a pad offers, and prove the card is not covering it.
    const sheetCheck=await page.evaluate(()=>{
      const card=document.getElementById('firstRunCoach');
      const sheet=document.getElementById('radialMenu');
      const wasHidden=card.hidden;
      sheet.hidden=false;
      const cardNow=getComputedStyle(card).display;
      const hit=(()=>{const b=sheet.getBoundingClientRect();return document.elementFromPoint(Math.round(b.left+b.width/2),Math.round(b.top+20));})();
      sheet.hidden=true;
      return {cardHidden:cardNow==='none',wasHidden,onSheet:!!hit&&sheet.contains(hit)};
    });
    assert.equal(sheetCheck.cardHidden,true,'the card steps aside while the tower sheet is open');
    assert.equal(sheetCheck.onSheet,true,'and the sheet is not covered by anything');
    assert.equal(await page.locator('#firstRunCoach').isHidden(),false,'it comes back when the sheet closes');
    // Now do what the card asks, on the real field. This is the point of the gate: the
    // step is finished by a tower that stands there, not by a click on NEXT.
    // The card already points at the pad it wants (`#coachRing`). Tapping the ring is
    // exactly what a player does, and it needs no test-only hook in the game: the pad
    // hit radius on this field is ~54 logical units, and the ring centre is the pad.
    const tapRing = async mode => {
      const ring = await page.locator('#coachRing').boundingBox();
      assert.ok(ring && ring.width > 10, 'the card marks the pad it is asking about');
      await page.mouse.click(ring.x + ring.width / 2, ring.y + ring.height / 2);
      // The sheet is a zero-size anchor centred on the pad - the buttons around it
      // carry the box, the sheet itself never has one - so "visible" is the wrong
      // signal. Its mode says which actions the tap actually produced.
      await page.waitForFunction(expected => {
        const sheet = document.getElementById('radialMenu');
        return sheet && !sheet.hidden && sheet.dataset.mode === expected;
      }, mode, {timeout: 10000});
    };
    // Build what the card asks for: pad, tower option, confirm the price.
    await tapRing('build');
    // The ring answers "can I afford this?" before anything is tapped: every
    // build option carries its price, and the training wallet (150) covers all
    // four, so none of them may show the unaffordable state.
    const buildRing=await page.evaluate(()=>[...document.querySelectorAll('#radialMenu .sheet-option')].filter(button=>!button.hidden).map(button=>({
      price:button.querySelector('.sheet-price')?.textContent??'',
      unaffordable:button.classList.contains('unaffordable')})));
    assert.equal(buildRing.length,4,'four tower choices on the ring');
    assert.deepEqual(buildRing.map(option=>option.price),['50','80','65','75'],'every build option shows its price');
    assert.equal(buildRing.some(option=>option.unaffordable),false,'the training wallet covers every tower');
    await page.locator('.sheet-option').first().click();
    await page.locator('#towerDetails').waitFor({state: 'visible'});
    await page.locator('#towerDetailsConfirm').click();
    // The card moves on because a tower stands there now - nothing was clicked on it.
    await page.waitForFunction(() => /Upgrade it/.test(document.getElementById('coachTitle').textContent), null, {timeout: 10000});
    assert.equal(await page.locator('#coachNext').isDisabled(),true,'the upgrade step gates NEXT too');
    assert.match(await page.locator('#coachAsk').innerText(),/Upgrade that tower to continue/);
    // Upgrade it: the card rings the built tower now. A level 1 tower upgrades
    // straight from its action sheet - no price dialog - so the tap is the action.
    await tapRing('actions');
    // The upgrade option carries its price too - and after the 50-supply build,
    // 100 remain, so the 70 upgrade is affordable and must not read as closed.
    assert.equal(await page.evaluate(() => document.getElementById('menuPrice0')?.textContent??''),'70','the upgrade option shows its price');
    assert.equal(await page.locator('#radial0').evaluate(button => button.classList.contains('unaffordable')),false,'the upgrade is affordable with 100 left');
    await page.locator('.sheet-option').first().click();
    await page.waitForFunction(() => /Move your hero/.test(document.getElementById('coachTitle').textContent), null, {timeout: 10000});
    // The hero step gates as well: nobody has moved yet, so NEXT stays closed.
    assert.equal(await page.locator('#coachNext').isDisabled(),true,'the hero step gates NEXT until the soldier moves');
    assert.match(await page.locator('#coachAsk').innerText(),/Send your soldier somewhere/);
    // Reported: "Ist das Aufgaben Fenster minimiert, registriert er die Bewegung
    // des Soldaten nicht." The card goes away, the move still has to count, and
    // the card has to come back BY ITSELF at the next step - not at the old one.
    await page.locator('#coachClose').click();
    await page.locator('#coachRecall').waitFor({state:'visible',timeout:5000});
    assert.equal(await page.locator('#firstRunCoach').isHidden(),true,'the card is put away, not gone');
    // Move: tap open ground. Field units are 960x540; (480,281) is mid-field, more
    // than a pad-radius from every build pad on this map, below the status row and
    // above the card - which grew upward when it started carrying the ask line.
    const ground = await page.evaluate(() => {
      const box = document.getElementById('game').getBoundingClientRect();
      const point = { x: box.x + 480 / 960 * box.width, y: box.y + 281 / 540 * box.height };
      const hit = document.elementFromPoint(point.x, point.y);
      return { ...point, hit: hit ? hit.tagName + '#' + (hit.id || '') : null };
    });
    assert.equal(ground.hit, 'CANVAS#game', 'the open-ground tap reaches the battlefield');
    await page.mouse.click(ground.x, ground.y);
    // The card follows the walk while put away, and comes back on its own.
    await page.waitForFunction(() => /Supplies/.test(document.getElementById('coachTitle').textContent), null, {timeout: 10000});
    await page.locator('#firstRunCoach').waitFor({state:'visible',timeout:5000});
    assert.match(await page.locator('#coachStep').innerText(),/5 \/ 7/,'it returns at the NEXT step, not the one it left');
    assert.equal(await page.locator('#coachRecall').isHidden(),true,'no recall pill once the card is back');
    assert.equal(await page.locator('#coachNext').isDisabled(),false,'an announcement card owes nothing');
    assert.equal(await page.locator('#coachAsk').isHidden(),true,'the gate is quiet while nothing is owed');
    // The level gate on the specialization ring. The tower is level 2 now, so its
    // upgrade opens the four specializations - and two of them are locked behind
    // soldier levels this player does not have. Reported: "Man sieht in Game kein
    // Charakter Level und kann erst nach Anklicken des Upgrades feststellen, dass
    // man nicht das benötigte Level hat." The ring has to say so before the tap.
    const tower = await page.evaluate(() => {
      const box = document.getElementById('game').getBoundingClientRect();
      return { x: box.x + 105 / 960 * box.width, y: box.y + 210 / 540 * box.height };
    });
    await page.mouse.click(tower.x, tower.y);
    await page.waitForFunction(() => {
      const sheet = document.getElementById('radialMenu');
      return sheet && !sheet.hidden && sheet.dataset.mode === 'actions';
    }, null, {timeout: 10000});
    await page.locator('#radial0').click();
    // The sheet's data-mode only knows 'build' and 'actions' - the specialization
    // view is named by its title instead.
    await page.waitForFunction(() => document.getElementById('sheetTitle')?.textContent === 'Choose specialization', null, {timeout: 10000});
    const branches = await page.evaluate(() => [...document.querySelectorAll('#radialMenu .sheet-option')].filter(button => !button.hidden).map(button => ({
      price: button.querySelector('.sheet-price')?.textContent ?? '',
      locked: button.classList.contains('locked'),
      unaffordable: button.classList.contains('unaffordable')})));
    assert.equal(branches.length, 4, 'four specializations on the ring');
    assert.deepEqual(branches.map(branch => branch.price), ['120', '120', 'Lv 5', 'Lv 10'], 'locked specializations name the level they need');
    assert.deepEqual(branches.map(branch => branch.locked), [false, false, true, true], 'exactly the level-locked two carry the lock');
    await page.keyboard.press('Escape');
    await page.locator('#coachClose').click();
    assert.equal(await page.locator('#firstRunCoach').isHidden(),true,'a dismissed card stays dismissed');
    // Reported: "wenn man die Aufgabe wegklickt, hat man keine Möglichkeit, sie
    // nachzuschauen." Closing is a pause now: a recall stays on the field and
    // brings the card back at the step it was on - here the supplies card (4/7
    // done, because build, upgrade and move were played above).
    await page.locator('#coachRecall').waitFor({state:'visible',timeout:5000});
    assert.match(await page.locator('#coachRecall').innerText(),/SHOW TASK/,'the recall names what it brings back');
    await page.locator('#coachRecall').click();
    await page.locator('#firstRunCoach').waitFor({state:'visible',timeout:5000});
    assert.match(await page.locator('#coachTitle').innerText(),/Supplies/,'the card comes back at the card it was on');
    assert.equal(await page.locator('#coachRecall').isHidden(),true,'an open card needs no recall');
    await page.locator('#coachClose').click();
    await page.locator('#coachRecall').waitFor({state:'visible',timeout:5000});
    // Dismissing must not be the end of it: the field menu and the Command Center both
    // replay the same seven cards. The old replay path opened the retired modal tour.
    await page.locator('#fieldOps > summary').click();
    await page.locator('#fieldCoachReplay').click();
    await page.locator('#firstRunCoach').waitFor({state:'visible',timeout:5000});
    assert.match(await page.locator('#coachStep').innerText(),/1 \/ 7/,'the replay starts at the first card');
    await page.locator('#coachClose').click();
    // Back to the Command Center for the rest of the sweep. Ending a run opens the
    // debrief, which is modal, so close it before touching anything else.
    await page.locator('#endRun').click();
    await page.locator('#gameConfirmAccept').click();
    await page.locator('#runResults').waitFor({state:'visible'});
    await page.locator('#runResults').evaluate(dialog=>dialog.close());
    assert.equal(await page.locator('#commandCenter').isVisible(),true,'the debrief returns to the Command Center');
    assert.equal(await page.locator('#firstRunCoach').isHidden(),true,'no card over the Command Center');
    mark('command center');
    await page.locator('#menuName').waitFor({state:'visible',timeout:10000});
    assert.equal(await page.locator('#friendIndexError').isHidden(),true);
    // The popup dismisses itself on any click outside it (by design: it is a
    // passive alert), and every tap of the first run is exactly that click. So the
    // real proof that a stray click cannot eat an invitation is the notification
    // button, which still knows about it after the whole run above.
    await page.locator('#inviteNotification').click();
    await page.locator('#friendsDialog').waitFor({state:'visible',timeout:10000});
    assert.match(await page.locator('#coopInviteList').innerText(),/Alice/,'the invitation survived the first run');
    await page.locator('#friendsClose').click();
    mark('standalone workshop');
    // Exercise the standalone workshop with an in-memory transport; no account writes.
    await page.evaluate(async()=>{const [{createWorkshopView},{initializeWireWorkshop,applyWireWorkshopCommand},{translateText}]=await Promise.all([import('./workshop-view.mjs'),import('./workshop-wire.mjs'),import('./language.mjs?v=20261218-junction1')]);let p={name:'Test Soldier',armory:{scrap:100,owned:1,equipped:1}};const style=document.createElement('link');style.rel='stylesheet';style.href='workshop-view.css';document.head.append(style);const root=document.createElement('div');root.id='workshopTestRoot';root.style.cssText='position:fixed;inset:0;overflow:auto;z-index:999;background:#16291f;padding:12px;color:white';document.body.append(root);const save=next=>{if(!next)return {status:'rejected'};p=next;return {status:'saved',profile:p};};const service={initialize:async()=>save(initializeWireWorkshop(p)),command:async cmd=>save(applyWireWorkshopCommand(p,cmd))};const view=createWorkshopView({document,root,getProfile:()=>p,service,confirm:async()=>true,translate:translateText,onProfile:value=>p=value});view.render();window.__workshopTest={render:()=>view.render(),close:()=>{root.remove();style.remove();}};});
    await page.locator('#workshopTestRoot').getByRole('button',{name:'PREPARE WORKSHOP'}).click();assert.match(await page.locator('#workshopTestRoot').innerText(),/Field Scope/);const boots=page.locator('#workshopTestRoot .workshop-item').filter({hasText:'Field Boots'});await boots.getByRole('button',{name:'CRAFT'}).click();assert.match(await page.locator('#workshopTestRoot .workshop-wallet').innerText(),/50 scrap/);await boots.getByRole('button',{name:'EQUIP',exact:true}).click();assert.match(await page.locator('#workshopTestRoot .workshop-slot-grid').innerText(),/Field Boots/);assert.equal(await page.locator('#workshopTestRoot').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='de';select.dispatchEvent(new Event('change',{bubbles:true}));window.__workshopTest.render();});assert.match(await page.locator('#workshopTestRoot').innerText(),/Feldstiefel/,'the workshop follows the page language; if this fails, the test is likely importing a SECOND language.mjs instance with a stale cache-bust tag');await page.evaluate(()=>{window.__workshopTest.close();const select=document.querySelector('#languageSelect');select.value='en';select.dispatchEvent(new Event('change',{bubbles:true}));});
    mark('replay tour');
    // Practice opens a real modal in front of the tour, so the briefing is only
    // reachable again once that dialog is closed (which also ends the sandbox).
    const closePractice=async()=>{
      for(const id of ['#skillDialog','#armoryDialog']){
        const dialog=page.locator(id);
        if(await dialog.count()&&await dialog.evaluate(e=>e.open))await dialog.evaluate(e=>e.close());
      }
    };
    // One briefing step forward. A practice step needs its skip button first, unless
    // the step is already satisfied (prestige always is), where skip is hidden.
    const advance=async()=>{
      await closePractice();
      const skip=page.locator('#tutorialPracticeSkip');
      if(await skip.isVisible())await skip.click();
      await page.locator('#tutorialNext').click();
    };
    // Language is a setting now: open it from the menu, switch it, close it. Nothing
    // sits in the page corner, and this is the only language control in the document.
    assert.equal(await page.locator('.language-picker').count(),0,'no permanent picker in the corner');
    await page.locator('#menuSettings').click();
    assert.equal(await page.locator('#settingsDialog').evaluate(e=>e.open),true);
    // Reported: "beim Öffnen der Settings wird direkt das Auswahl Fenster für die
    // Sprache getriggert." Focus must land on the dialog, never on the select -
    // focusing a <select> opens its picker on a phone.
    assert.notEqual(await page.evaluate(() => document.activeElement?.id),'languageSelect','the language picker does not open by itself');
    // And the X sits inside the dialog frame, not hanging over its edge.
    const settingsFrame=await page.evaluate(() => {
      const dialog=document.getElementById('settingsDialog').getBoundingClientRect();
      const close=document.getElementById('settingsClose').getBoundingClientRect();
      return {dialog:{l:dialog.left,t:dialog.top,r:dialog.right,b:dialog.bottom},close:{l:close.left,t:close.top,r:close.right,b:close.bottom}};
    });
    assert.ok(settingsFrame.close.r<=settingsFrame.dialog.r+1&&settingsFrame.close.l>=settingsFrame.dialog.l-1&&settingsFrame.close.t>=settingsFrame.dialog.t-1&&settingsFrame.close.b<=settingsFrame.dialog.b+1,'the settings X sits inside the dialog frame');
    assert.match(await page.locator('#settingsDialog .flag-icon').evaluate(e=>getComputedStyle(e).backgroundImage),/flag-gb/);
    await page.locator('#languageSelect').selectOption('de');
    assert.match(await page.locator('#settingsDialog .flag-icon').evaluate(e=>getComputedStyle(e).backgroundImage),/flag-de/);assert.equal(await page.locator('html').getAttribute('lang'),'de');assert.equal(await page.locator('#menuSkills [data-i18n]').innerText(),'FÄHIGKEITEN');assert.match(await page.locator('#languagePreviewNote').innerText(),/noch auf Englisch/);assert.equal(await page.locator('#menuName').innerText(),'Test Soldier','player names are never translated');
    await page.locator('#settingsClose').click();
    assert.equal(await page.locator('#settingsDialog').evaluate(e=>e.open),false);assert.equal(await page.evaluate(()=>localStorage.getItem('ironpath:language')),'de');await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='en';select.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('#menuSkills [data-i18n]').innerText(),'SKILLS');

    await page.locator('#menuSoldier').click();assert.equal(await page.locator('#soldierDialog').evaluate(e=>e.open),true);assert.equal(await page.locator('#soldierWorkshop').count(),0,'one armory button, no second workshop screen');assert.equal(await page.locator('#soldierArmory').isVisible(),true);await page.locator('#soldierClose').click();assert.equal(await page.locator('#soldierDialog').evaluate(e=>e.open),false);await page.locator('#menuSoldier').click();assert.equal(await page.locator('#soldierNameDisplay').innerText(),'Test Soldier');assert.equal(await page.locator('#soldierDamage').innerText(),'12');assert.equal(await page.locator('#soldierEquipped').innerText(),'No equipment');assert.equal(await page.locator('#soldierCollectionEmpty').isVisible(),true);await page.evaluate(()=>window.__profileUpdate({armory:{scrap:10,owned:3,equipped:1}}));assert.equal(await page.locator('#soldierCollectionList li').count(),2);assert.match(await page.locator('#soldierCollectionList li').first().innerText(),/Field Scope[\s\S]*EQUIPPED/);assert.equal(await page.locator('#soldierCollectionEmpty').isHidden(),true);assert.equal(await page.locator('#soldierDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);await page.evaluate(()=>{const s=document.querySelector('#languageSelect');s.value='de';s.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(await page.locator('#soldierScreenTitle').innerText(),'Dein Soldat');assert.equal(await page.locator('#soldierNameDisplay').innerText(),'Test Soldier');assert.match(await page.locator('#soldierCollectionList li').first().innerText(),/Zielfernrohr[\s\S]*AUSGERÜSTET/);await page.evaluate(()=>{const s=document.querySelector('#languageSelect');s.value='en';s.dispatchEvent(new Event('change',{bubbles:true}));});await page.locator('#soldierClose').click();await page.evaluate(()=>window.__profileUpdate({armory:null}));
    assert.equal(await page.locator('#menuSkillBadge').innerText(),'2');assert.equal(await page.locator('#menuSkills').evaluate(e=>e.classList.contains('has-skill-points')),true);assert.match(await page.locator('#menuSkills').getAttribute('aria-label'),/2 unspent skill points/);assert.equal(await page.locator('#skillNotice').count(),0);
    await page.evaluate(()=>window.__profileUpdate({skills:'1,1,0,0,0;assault'}));await page.locator('#menuSkillBadge').waitFor({state:'hidden'});assert.equal(await page.locator('#menuSkills').evaluate(e=>e.classList.contains('has-skill-points')),false);
    await page.evaluate(()=>window.__profileUpdate({skills:'0,0,0,0,0;assault'}));await page.locator('#menuSkillBadge').waitFor({state:'visible'});assert.equal(await page.locator('#menuSkillBadge').innerText(),'2');


    assert.equal(await page.locator('.mode-card b').count(),0,'operation cards have no arrows');
    assert.equal(await page.locator('#menuFriendBadge').isHidden(),true);
    await page.evaluate(()=>window.__friendUpdate({alice:{status:'pending',senderName:'Alice'},bob:{status:'accepted',senderName:'Bob'}}));
    assert.equal(await page.locator('#menuFriendBadge').innerText(),'1');assert.match(await page.locator('#menuFriends').getAttribute('aria-label'),/1 pending friend request/);assert.equal(await page.locator('#socialPopup').isHidden(),true,'friend requests do not create popups');
    await page.locator('#menuFriends').click();assert.match(await page.locator('#friendRequests').innerText(),/Alice/);await page.locator('#friendRequests button').filter({hasText:'ACCEPT'}).click();await page.locator('#menuFriendBadge').waitFor({state:'hidden'});const bob=page.locator('#friendList li').filter({hasText:'Bob'});await bob.getByRole('button',{name:'STATS'}).click();await page.locator('#friendStatsContent').waitFor({state:'visible'});assert.equal(await page.locator('#friendStatsTitle').innerText(),'Bob');assert.equal(await page.locator('#friendStatsLevel').innerText(),'3');assert.equal(await page.locator('#friendStatsEquipment').innerText(),'Field Scope');assert.match(await page.locator('#friendStatsAbility').innerText(),/Airstrike/);assert.deepEqual((await page.evaluate(()=>window.__readPaths.filter(p=>p.startsWith('players/bob/')))).sort(),['players/bob/armory','players/bob/skills','players/bob/xp']);await page.locator('#friendStatsClose').click();assert.equal(await page.locator('#friendsDialog').evaluate(e=>e.open),true);await bob.getByRole('button',{name:'STATS'}).click();await page.locator('#friendStatsContent').waitFor({state:'visible'});await page.evaluate(()=>window.__friendUpdate({alice:{status:'accepted',senderName:'Alice'}}));await page.waitForFunction(()=>!document.getElementById('friendStatsDialog').open);await page.locator('#friendsClose').click();
    await page.evaluate(()=>window.__friendUpdate({alice:{status:'pending',senderName:'Alice'},eve:{status:'pending',senderName:'Eve'}}));assert.equal(await page.locator('#menuFriendBadge').innerText(),'2');assert.equal(await page.locator('#lobbyFriendBadge').textContent(),'2');assert.equal(await page.locator('#socialPopup').isHidden(),true);await page.evaluate(()=>window.__friendUpdate({}));await page.locator('#menuFriendBadge').waitFor({state:'hidden'});
    await page.locator('#menuCampaign').click(); await page.locator('#campaignBoard').waitFor({state:'visible'});
    assert.equal(await visible('.dashboard'),false,'campaign board is separate from the battlefield');
    assert.equal(await visible('#game'),false); assert.equal(await visible('#partyToggle'),false);
    await page.locator('#backToCommand').click();
    await page.locator('#menuEndless').click(); await page.locator('#gameWorkspace').waitFor({state:'visible'});
    assert.equal(await visible('#game'),true); assert.equal(await visible('#partyToggle'),false,'no multiplayer button in Endless');
    // Portrait starts fitted; direct zoom and orientation changes retain the run.
    await page.waitForFunction(()=>{const c=document.querySelector('#game'),v=document.querySelector('#mapViewport');return c.getBoundingClientRect().width<=v.clientWidth+1&&c.getBoundingClientRect().height<=v.clientHeight+1;});
    const fitWidth=await page.locator('#game').evaluate(e=>e.getBoundingClientRect().width);assert.equal(await page.locator('#mapQuickZoom').isVisible(),true);
    await page.locator('#mapQuickZoom').click();assert.match(await page.locator('#mapQuickZoom').innerText(),/FIT MAP/);assert.ok(await page.locator('#game').evaluate(e=>e.getBoundingClientRect().width)>fitWidth*1.9);await page.waitForFunction(()=>{const c=document.getElementById('game');return c.width>=Math.round(c.getBoundingClientRect().width*2)-2;});
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(150);assert.match(await page.locator('#mapQuickZoom').innerText(),/FIT MAP/);assert.equal(await page.locator('#wave').innerText(),'0 / ∞');
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);await page.locator('#mapQuickZoom').click();assert.match(await page.locator('#mapQuickZoom').innerText(),/ZOOM MAP/);assert.ok(await page.locator('#game').evaluate(e=>e.getBoundingClientRect().width)<=fitWidth+1);

    assert.equal(await visible('#campaignPanel'),false); assert.equal(await visible('#fourPartyPanel'),false);
    await page.evaluate(()=>{document.querySelector('#radialMenu').hidden=false;});await page.locator('#game').click({position:{x:5,y:5}});assert.equal(await page.locator('#radialMenu').isHidden(),true,'outside click closes the tower sheet');
    await page.evaluate(()=>{document.querySelector('#radialMenu').hidden=false;document.querySelector('#towerDetails').showModal();});await page.mouse.click(1,1);assert.equal(await page.locator('#towerDetails').evaluate(e=>e.open),false,'backdrop closes tower details');assert.equal(await page.locator('#radialMenu').isHidden(),true);
    await page.locator('#fieldOps > summary').click();await page.locator('#fieldBack').click();
    await page.locator('#menuMultiplayer').click(); await page.locator('#fourPartyPanel').waitFor({state:'visible'});await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='de';select.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(await page.locator('#fourPartyCreate').innerText(),'GRUPPE ERSTELLEN');assert.equal(await page.locator('label[for=fourPartyCodeInput]').innerText(),'MIT CODE BEITRETEN');await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='en';select.dispatchEvent(new Event('change',{bubbles:true}));});await page.locator('#lobbyFriends').click();assert.equal(await page.locator('#friendsDialog').evaluate(e=>e.open),true);await page.locator('#friendsClose').click();
    await page.locator('.multiplayer-help summary').click(); assert.match(await page.locator('.multiplayer-help').innerText(),/codes can be guessed/i); assert.match(await page.locator('.multiplayer-help').innerText(),/host reload/i);await page.locator('#fourPartyCodeInput').click();assert.equal(await page.locator('.multiplayer-help').evaluate(e=>e.open),false,'outside click closes disclosure');
    assert.equal(await visible('.profile-bar'),false,'no soldier header in lobby'); assert.equal(await visible('#campaignPanel'),false);
    assert.equal(await visible('#game'),false,'no map in lobby'); assert.equal(await visible('.dashboard'),false);
    await page.locator('#backToCommand').click();
    await page.locator('#inviteNotification').click();assert.match(await page.locator('#coopInviteList').innerText(),/Alice/);await page.locator('#coopInviteList button').filter({hasText:'DECLINE'}).click();await page.locator('#inviteNotification').waitFor({state:'hidden'});await page.locator('#friendsClose').click();
    await page.locator('#menuFriends').click();assert.equal(await page.locator('#friendsDialog').evaluate(e=>e.open),true);assert.equal(await page.locator('#friendVisibility').count(),0);await page.locator('#friendInput').fill('Bob');await page.locator('#friendSearch').click();assert.match(await page.locator('#friendStatus').innerText(),/No players found/);assert.equal(await page.locator('#friendCode').count(),0);await page.mouse.click(1,1);assert.equal(await page.locator('#friendsDialog').evaluate(e=>e.open),false);await page.locator('#menuFriends').click();assert.equal(await page.locator('#friendInput').inputValue(),'Bob','outside click preserves typed search');await page.locator('#friendsClose').click();
    await page.locator('#menuLeaderboard').click();assert.equal(await page.locator('#leaderboardDialog').evaluate(e=>e.open),true);assert.match(await page.locator('#leaderboardDialog').innerText(),/not verified/);await page.locator('#leaderboardCoop').click();assert.equal(await page.locator('#leaderboardCoop').getAttribute('aria-pressed'),'true');await page.locator('#leaderboardFriends').click();assert.equal(await page.locator('#leaderboardFriends').getAttribute('aria-pressed'),'true');await page.mouse.click(1,1);assert.equal(await page.locator('#leaderboardDialog').evaluate(e=>e.open),false);
    // Reproduce the reported case: a solo operation is already under way.
    await page.locator('#menuEndless').click(); await page.locator('#start').click();await page.locator('#fieldOps > summary').click();await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='de';select.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForFunction(()=>document.getElementById('start').textContent==='WELLE LÄUFT');assert.equal(await page.locator('#moneyLabel').innerText(),'VORRÄTE');await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='en';select.dispatchEvent(new Event('change',{bubbles:true}));});await page.locator('#fieldOps > summary').click();
    await page.evaluate(()=>window.__soldierFrames=[]);let moved=false;for(const position of [{x:5,y:5},{x:180,y:8},{x:360,y:8},{x:180,y:180}]){await page.locator('#game').click({position});if((await page.locator('#message').innerText()).includes('Hero moving')){moved=true;break;}await page.locator('#radialClose').evaluate(e=>e.click());}assert.equal(moved,true,'a tap on open ground issues a movement order');await page.waitForFunction(()=>window.__soldierFrames.some(f=>f.width===22&&f.height===33&&Math.abs(f.rotation)>.001),null,{timeout:8000});
    // Fullscreen the entire document: gameplay controls and native dialogs stay available.
    await page.setViewportSize({width:1280,height:800});
    // Fullscreen, reached the way a player reaches it now: field menu -> SETTINGS.
    // The control lives in the dialog, so every step happens while it is open, and it
    // is closed once - at the end - before the field is touched again.
    await page.locator('#fieldOps > summary').click();await page.locator('#fieldSettings').click();await page.waitForFunction(()=>document.getElementById('settingsDialog')?.open===true);
    await page.locator('#fullscreenToggle').click();await page.waitForFunction(()=>document.fullscreenElement===document.documentElement);
    assert.equal(await page.locator('#fullscreenToggle').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#game').isVisible(),true);assert.equal(await page.locator('#start').isVisible(),true);
    assert.equal(await page.locator('#settingsDialog').evaluate(e=>e.open),true,'the dialog that switched it survives the change');
    await page.locator('#fullscreenToggle').click();await page.waitForFunction(()=>!document.fullscreenElement);
    assert.equal(await page.locator('#fullscreenToggle').getAttribute('aria-pressed'),'false');
    await page.locator('#settingsClose').click();assert.equal(await page.locator('#settingsDialog').evaluate(e=>e.open),false,'the dialog the field menu opened closes again');
    // Back to the field: the menu is usable again once no dialog owns the pointer.
    await page.locator('#fieldOps > summary').click();await page.locator('#fieldBack').click();await page.locator('#menuSkills').click();assert.equal(await page.locator('#skillDialog').evaluate(e=>e.open),true);await page.locator('#skillCancel').click();
    await page.setViewportSize({width:390,height:844});
    mark('endless run');
    // Ending a solo run returns to the command center underneath its report.
    await page.locator('#menuResume').click();await page.locator('#endRun').click();await page.locator('#gameConfirmCancel').click();assert.equal(await visible('#game'),true,'cancelling keeps the run');
    await page.locator('#endRun').click();await page.locator('#gameConfirmAccept').click();assert.equal(await page.locator('#runResults').evaluate(e=>e.open),true);assert.equal(await page.locator('#gameWorkspace').isHidden(),true);assert.equal(await visible('#commandCenter'),true);assert.match(await page.locator('#resultsTitle').innerText(),/Operation ended/);assert.equal(await page.locator('#runResults').getAttribute('data-outcome'),'neutral');assert.match(await page.locator('#resultsRewardXp').innerText(),/^\+0 XP$/);assert.equal(await page.locator('#resultsProgressLevel').innerText(),'LEVEL 3');assert.equal(await page.locator('#runResults').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true,'report has no horizontal overflow on mobile');await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='de';select.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(await page.locator('#resultsDone').innerText(),'ZURÜCK ZUR KOMMANDOZENTRALE');assert.match(await page.locator('#resultsProgressText').innerText(),/EP bis zur nächsten Stufe/);await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='en';select.dispatchEvent(new Event('change',{bubbles:true}));});await page.locator('#resultsDone').click();assert.equal(await visible('#commandCenter'),true);
    // The workshop is a tab in the real armory, so the browser test can open it there.
    await page.locator('#menuArmory').click(); assert.ok(await page.locator('#armoryList .armory-art[data-item]').count()>0); assert.equal(await page.locator('#armoryDialog').evaluate(e=>e.open),true);
    // Reported: "bei vielen popup Fenstern das Problem mit dem X Button, das es
    // falsch sitzt." The armory's header bleeds into the dialog padding, and the
    // phone media query shrinks that padding from 20 to 12 - the header (and the X
    // in it) used to keep its -20px margin and hang 8px over the frame. This runs
    // at 390px, squarely inside that query, so measure it where it broke.
    const armoryFrame=await page.evaluate(() => {
      const dialog=document.getElementById('armoryDialog').getBoundingClientRect();
      const close=document.getElementById('armoryClose').getBoundingClientRect();
      return {dialog:{l:dialog.left,t:dialog.top,r:dialog.right,b:dialog.bottom},close:{l:close.left,t:close.top,r:close.right,b:close.bottom}};
    });
    assert.ok(armoryFrame.close.r<=armoryFrame.dialog.r+1&&armoryFrame.close.l>=armoryFrame.dialog.l-1&&armoryFrame.close.t>=armoryFrame.dialog.t-1&&armoryFrame.close.b<=armoryFrame.dialog.b+1,`the armory X sits inside the frame (${JSON.stringify(armoryFrame)})`);
    // Reported: "Wieso wird das Fenster nicht auf die gesamte Screen-Größe
    // gerendert? Selbes gilt für armory etc." On a phone the armory covers the
    // viewport edge to edge - no floating frame, no rounded margins.
    const armoryFull=await page.evaluate(()=>{
      const box=document.getElementById('armoryDialog').getBoundingClientRect();
      return {w:box.width,h:box.height,vw:innerWidth,vh:innerHeight};
    });
    assert.ok(armoryFull.w>=armoryFull.vw-2&&armoryFull.h>=armoryFull.vh-2,`the armory covers the phone screen edge to edge (${JSON.stringify(armoryFull)})`);
    // Reported: "das X (welches oben rechts ist und von der Aufgabe verdeckt
    // wird)". The ending's guide card sits ABOVE modal dialogs (as a popover,
    // the only layer above them) - so it has to keep the top-right corner
    // free. Fabricate the card the way the ending shows it, then prove the
    // armory's X is still the thing under the finger.
    const guideClearsX=await page.evaluate(()=>{
      const card=document.getElementById('firstRunGuide');
      const wasHidden=card.hidden;
      card.hidden=false;
      try{card.showPopover?.();}catch{/* older engines: fixed position stands */}
      const close=document.getElementById('armoryClose');
      const box=close.getBoundingClientRect();
      const hit=document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
      const coveredByCard=!!hit&&card.contains(hit);
      try{card.hidePopover?.();}catch{/* not shown as a popover */}
      card.hidden=wasHidden;
      return {coveredByCard,hit:hit?hit.id||hit.tagName:null};
    });
    assert.equal(guideClearsX.coveredByCard,false,`the guide card leaves the armory X tappable (hit: ${guideClearsX.hit})`);
    await page.waitForTimeout(150);
    await page.locator('#armoryWorkshopTab').click(); assert.equal(await page.locator('#armoryWorkshop').isVisible(),true); assert.equal(await page.locator('#armoryList').isVisible(),false);
    assert.match(await page.locator('#armoryWorkshop').innerText(),/PREPARE WORKSHOP|Field Scope/,'the workshop renders inside the armory');
    await page.locator('#armoryEquipmentTab').click(); assert.equal(await page.locator('#armoryWorkshop').isVisible(),false); assert.equal(await page.locator('#armoryList').isVisible(),true,'the equipment list comes back'); assert.match(await page.locator('#armoryDialog .development-head').evaluate(e=>getComputedStyle(e).backgroundImage),/arsenal-workbench/);
    assert.equal(await page.locator('.armory-section[data-section="equipment"]').isVisible(),true);
    assert.equal(await page.locator('.armory-section[data-section="defenses"]').isVisible(),false);
    await page.locator('#armoryDefensesTab').click(); assert.equal(await page.locator('.armory-section[data-section="defenses"]').isVisible(),true); assert.equal(await page.locator('#armoryDefensesTab').getAttribute('aria-pressed'),'true');
    await page.locator('#armoryServiceTab').click(); assert.equal(await page.locator('.armory-section[data-section="service"]').isVisible(),true);
    await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='de';select.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(await page.locator('#armoryServiceTab').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.armory-section[data-section="service"] h3').innerText(),'Dienstakte');assert.equal(await page.locator('.armory-section[data-section="service"] .service-medal strong').first().innerText(),'☆ Erfahrener Soldat');await page.locator('#armoryEquipmentTab').click();assert.equal(await page.locator('.armory-section[data-section="equipment"] h4').first().innerText(),'Zielfernrohr');assert.match(await page.locator('.armory-section[data-section="equipment"] p').first().innerText(),/Soldatenschaden/);await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='en';select.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(await page.locator('.armory-section[data-section="equipment"] h4').first().innerText(),'Field Scope');
    await page.locator('#armoryEquipmentTab').click(); assert.equal(await page.locator('.armory-section[data-section="equipment"]').isVisible(),true);
    // The phone armory covers the screen edge to edge, so there is no backdrop
    // left to tap by accident - a stray corner tap must not throw the gear away.
    await page.mouse.click(1,1);assert.equal(await page.locator('#armoryDialog').evaluate(e=>e.open),true,'a fullscreen phone armory has no backdrop to miss');
    await page.locator('#armoryClose').click();assert.equal(await page.locator('#armoryDialog').evaluate(e=>e.open),false,'the X closes the fullscreen armory');
    await page.evaluate(()=>window.__profileUpdate({skills:'1,0,0,0,0;assault'}));await page.locator('#menuSkills').click(); assert.equal(await page.locator('#skillDialog').evaluate(e=>e.open),true);
    // Reported: "Bei den Skills hat man 2 Scrollbalken, Fenster in Fenster." On a
    // phone the dialog is a flex column that never scrolls itself; the workspace
    // below the tabs is the one scroll region, and SAVE stays in reach.
    const skillScroll=await page.evaluate(()=>{
      const dialog=document.getElementById('skillDialog'),workspace=dialog.querySelector('.skills-workspace');
      return {dialog:dialog.scrollHeight-dialog.clientHeight,workspace:workspace.scrollHeight-workspace.clientHeight,
        saveVisible:!!document.querySelector('.skill-actions')?.getBoundingClientRect().height};
    });
    assert.ok(skillScroll.dialog<=1,'the skills dialog itself does not scroll');
    assert.ok(skillScroll.workspace>1,'the skill list is the one scroll region');
    assert.equal(skillScroll.saveVisible,true,'SAVE stays visible without scrolling');
    // Reported: "UI in den Fähigkeiten teilweise verschoben." A long skill list
    // must never squeeze the fixed parts of the dialog out of shape: every
    // child except the scrolling workspace keeps its own height.
    const squashed=await page.evaluate(()=>{
      const dialog=document.getElementById('skillDialog');
      return [...dialog.children].filter(c=>!c.classList.contains('skills-workspace'))
        .map(c=>({part:c.className||c.id,squash:c.scrollHeight-c.clientHeight}));
    });
    assert.ok(squashed.every(s=>s.squash<=1),`no part of the skills dialog is squeezed by the list (${JSON.stringify(squashed.filter(s=>s.squash>1))})`);
    // Reported: "Fähigkeiten, die man auswählen muss, sind im Fenster 2cm groß,
    // der Rest ist alles fix." The skills dialog covers the phone screen edge to
    // edge, so the selectable list is what profits from every saved millimetre.
    const skillFull=await page.evaluate(()=>{
      const box=document.getElementById('skillDialog').getBoundingClientRect();
      const workspace=document.querySelector('#skillDialog .skills-workspace').getBoundingClientRect();
      return {w:box.width,h:box.height,vw:innerWidth,vh:innerHeight,workspace:Math.round(workspace.height)};
    });
    assert.ok(skillFull.w>=skillFull.vw-2&&skillFull.h>=skillFull.vh-2,`the skills dialog covers the phone screen edge to edge (${JSON.stringify(skillFull)})`);
    assert.ok(skillFull.workspace>=skillFull.vh*.45,`the selectable list takes most of the screen (${skillFull.workspace}px of ${skillFull.vh})`);
    const equipped=page.locator('#skillPaths .skill-card[data-path="assault"][data-rank="1"]');assert.equal(await equipped.evaluate(e=>e.classList.contains('is-main-ability')&&e.classList.contains('is-active')),true);assert.equal(await equipped.locator('.skill-card-state').innerText(),'✓ EQUIPPED');assert.equal(await equipped.getAttribute('aria-expanded'),'true');assert.equal(await equipped.locator('.skill-card-tag').innerText(),'MAIN ABILITY');assert.equal(await page.locator('#skillPaths .is-prerequisite, #skillPaths .is-dependent').count(),0);assert.equal(await equipped.locator('.skill-card-description').count(),0);assert.equal(await page.locator('#skillInspector').evaluate(e=>e.parentElement.classList.contains('skill-card-shell')&&e.previousElementSibling?.dataset.rank==='1'),true);
    assert.equal(await page.locator('[data-skill-path="assault"]').getAttribute('aria-pressed'),'true');
    assert.ok(await page.locator('#skillPaths .skill-card').count()>10);assert.equal(await page.locator('.skill-tree-board').count(),0,'no map to pan or zoom');
    await page.locator('[data-skill-path="recon"]').tap();assert.equal(await page.locator('[data-skill-path="recon"]').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#skillPaths').innerText(),/Suppression/);
    await page.locator('#skillFilter').selectOption('hybrid'); assert.ok(await page.locator('#skillPaths .skill-card').count()>0);assert.equal(await page.locator('#skillPaths .skill-card[data-rank="1"]').count(),0);
    await page.locator('#skillFilter').selectOption('all');const deep=page.locator('#skillPaths .skill-card[data-path="recon"]').last();await deep.scrollIntoViewIfNeeded();const beforeScroll=await page.locator('#skillDialog .skills-workspace').evaluate(e=>e.scrollTop),beforeTop=await deep.evaluate(e=>e.getBoundingClientRect().top);assert.ok(beforeScroll>100,'test starts well below the top');const deepRank=await deep.getAttribute('data-rank');await deep.tap();const afterScroll=await page.locator('#skillDialog .skills-workspace').evaluate(e=>e.scrollTop);assert.ok(afterScroll>100,`selection jumped to the top from ${beforeScroll} to ${afterScroll}`);const afterTop=await deep.evaluate(e=>e.getBoundingClientRect().top);assert.ok(Math.abs(afterTop-beforeTop)<40,`selected card moved from ${beforeTop} to ${afterTop}`);assert.equal(await page.locator('#skillInspector').evaluate(e=>e.previousElementSibling?.dataset.rank),deepRank,'details expand inside selected card');assert.equal(await page.locator('#skillPaths .skill-card.is-selected').getAttribute('aria-expanded'),'true');const node=page.locator('#skillPaths .skill-card[data-path="recon"][data-rank="2"]');await node.scrollIntoViewIfNeeded();await node.tap();assert.equal(await node.getAttribute('aria-pressed'),'true');assert.match(await page.locator('#skillDetailText').innerText(),/Requires Recon rank 1/);
    await page.locator('#skillPaths .skill-card[data-path="recon"][data-rank="1"]').click();await page.locator('#skillDetailAction').click();assert.match(await page.locator('#skillStatus').innerText(),/Unsaved draft/);await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='de';select.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(await page.locator('#skillPaths .skill-card[data-path="recon"][data-rank="1"] .skill-card-name').innerText(),'Unterdrückung');assert.match(await page.locator('#skillDetailText').innerText(),/Verlangsame Gegner/);assert.match(await page.locator('#skillStatus').innerText(),/Ungespeicherter Entwurf/);assert.equal(await page.locator('#skillDetailAction').innerText(),'HAUPTFÄHIGKEIT AUSGEWÄHLT');await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='en';select.dispatchEvent(new Event('change',{bubbles:true}));});assert.match(await page.locator('#skillStatus').innerText(),/Unsaved draft/);
    // The phone skills dialog covers the screen, so there is no backdrop to
    // tap - closing with an unsaved draft goes through the X, and THAT asks.
    await page.locator('#skillCancel').click();assert.equal(await page.locator('#gameConfirm').evaluate(e=>e.open),true);await page.mouse.click(1,1);assert.equal(await page.locator('#gameConfirm').evaluate(e=>e.open),false,'outside a confirmation cancels instead of accepting');assert.equal(await page.locator('#skillDialog').evaluate(e=>e.open),true,'cancel preserves the draft');
    await page.keyboard.press('Escape');assert.equal(await page.locator('#gameConfirm').evaluate(e=>e.open),true);await page.locator('#gameConfirmAccept').click();assert.equal(await page.locator('#skillDialog').evaluate(e=>e.open),false);await page.evaluate(()=>{const dialog=document.querySelector('#skillDialog');dialog.dispatchEvent(new Event('close'));});
    // The eleven-step briefing is the Help tour now: the field opens it through its own
    // replay button. `#menuTutorial` is a different thing on purpose - it restarts the
    // whole first run, which is checked further down. Language is German here, so the
    // tour has to be German too.
    await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='de';select.dispatchEvent(new Event('change',{bubbles:true}));});
    await page.locator('#tutorialReplay').evaluate(button=>button.click());
    assert.equal(await page.locator('#tutorialDialog').evaluate(e=>e.open),true);
    assert.equal(await page.locator('#tutorialTitle').innerText(),'Willkommen, Soldat');
    for(let i=0;i<20&&!/Fähigkeitenmenü/.test(await page.locator('#tutorialTitle').innerText());i++)await page.locator('#tutorialNext').click();
    assert.equal(await page.locator('#tutorialTitle').innerText(),'Übe das Fähigkeitenmenü');
    await page.waitForSelector('#skillDialog[open]');
    assert.match(await page.locator('#sandboxBanner').innerText(),/Nichts, was du hier tust, wird gespeichert/i,'the sandbox banner is translated too');
    // The practice dialog is modal and sits in front of the briefing: close it first.
    await page.locator('#skillDialog').evaluate(dialog=>dialog.close());
    await page.locator('#tutorialSkip').click();
    await page.evaluate(()=>{const select=document.querySelector('#languageSelect');select.value='en';select.dispatchEvent(new Event('change',{bubbles:true}));});
    await page.locator('#tutorialReplay').evaluate(button=>button.click()); assert.equal(await page.locator('#tutorialScene svg').count(),0); assert.match(await page.locator('#tutorialScene').evaluate(e=>getComputedStyle(e).backgroundImage),/tutorial-defend/); assert.equal(await page.locator('#tutorialDialog').evaluate(e=>e.open),true);
    // The tour walks into the REAL dialogs: a saved build, a workshop item, and the
    // sandbox banner that promises nothing is stored.
    // Clicking NEXT on a practice step does nothing until that step is done, so the
    // walk skips a practice step it is not testing yet and otherwise just advances.
    const walkTo=async title=>{for(let i=0;i<20;i++){if(title.test(await page.locator('#tutorialTitle').innerText()))return true;await advance();}return title.test(await page.locator('#tutorialTitle').innerText());};
    // The tour is already open from the line above; walk it from here.
    assert.equal(await walkTo(/Skills/),true);
    await page.waitForSelector('#skillDialog[open]');
    assert.equal(await visible('#sandboxBanner'),true,'practice says it is sample data');
    assert.match(await page.locator('#saveStatus').innerText(),/Sample data/i,'the skills screen says the sample is not saved');
    // The step only completes when the sample build is REALLY saved, and that save
    // must stay in the sandbox: the player's own build is byte-identical afterwards.
    const realBuild=await page.evaluate(()=>window.__profileGet().skills??null);
    await page.locator('#skillPaths .skill-card[data-path="assault"][data-rank="1"]').click();
    await page.locator('#skillDetailAction').click();
    await page.locator('#skillSave').click();
    await page.waitForSelector('#tutorialNext:enabled');
    assert.equal(await page.evaluate(()=>window.__profileGet().skills??null),realBuild,'practice never writes the real build');
    await page.locator('#tutorialNext').click();
    assert.equal(await walkTo(/Armory/),true);
    await page.waitForSelector('#armoryDialog[open]');
    assert.match(await page.locator('#armoryStatus').innerText(),/Sample data/i,'the armory says the sample is not saved');
    assert.equal(await visible('#sandboxBanner'),true,'the armory practices on the sample soldier');
    // Closing the armory ends the practice, so this step is skipped the way a player
    // who has seen enough would: the tour still has to let them through.
    await page.locator('#armoryDialog').evaluate(dialog=>dialog.close());
    // `close()` fires its close event on a queued task, so give the sandbox a tick.
    await page.locator('#sandboxBanner').waitFor({state:'hidden'});
    assert.equal(await visible('#sandboxBanner'),false,'closing the practice dialog leaves the sandbox');
    await advance();
    assert.equal(await walkTo(/workshop/i),true);
    await page.waitForSelector('#armoryDialog[open]');
    assert.equal(await page.locator('#armoryWorkshopTab').getAttribute('aria-pressed'),'true');
    await page.locator('#armoryDialog').evaluate(dialog=>dialog.close());
    await advance();
    assert.equal(await walkTo(/Prestige/),true);
    await page.waitForSelector('#armoryDialog[open]');
    await page.locator('#armoryDialog').evaluate(dialog=>dialog.close());
    await advance();
    // Finishing the tour hands a soldier the training contract - but this one already
    // played it: the first login above deployed it and marked it seen, so the replay
    // must NOT deploy a second time. The briefing closes, the Command Center stays.
    assert.equal(await page.locator('#tutorialDialog').evaluate(e=>e.open),false);
    await page.waitForTimeout(700); // longer than the 400ms handoff timer
    // Read the marker instead of the objective strip: the strip is also on screen while
    // a training run is merely still active, which has nothing to do with whether a
    // second contract was handed over. The marker is the thing `startFirstRun` checks.
    const trainingMarker=await page.evaluate(()=>{
      const key=Object.keys(localStorage).find(name=>name.startsWith('ironpath:training:'));
      return key?localStorage.getItem(key):null;
    });
    assert.equal(trainingMarker,'done','a tour replay does not redeploy the one-time contract');
    // The tour was opened from the field (`#tutorialReplay`), so closing it returns to
    // the field - not to the Command Center it used to come from.
    assert.equal(await visible('#game'),true,'the tour closes back onto the field it was opened over');
    assert.equal(await page.locator('#commandCenter').isVisible(),false,'and does not jump to the Command Center unasked');
    assert.equal(await visible('#sandboxBanner'),false,'leaving practice leaves the sandbox');
    // The restart, at the very end of the sweep: everything above that needs the
    // Command Center has already run, so leaving it for the training field now costs
    // nothing. Both entry points do the same thing.
    mark('first run again');
    const restartOnce = async (label, open) => {
      await open();
      await page.waitForFunction(() => document.getElementById('mapName')?.textContent === 'The Last Road', null, { timeout: 15000 });
      await page.waitForFunction(() => { const card = document.getElementById('firstRunCoach'); return card && !card.hidden; }, null, { timeout: 15000 });
      // The step line reads "FIRST RUN · 1 / 7" (German: "ERSTER EINSATZ · 1 / 7"),
      // so the card number has to be found inside it, not at the start of it.
      assert.match(await page.locator('#coachStep').innerText(), /\b1 \/ 7\b/, `${label}: the coaching starts at the first card again`);
      assert.match(await page.locator('#wave').innerText(), /^0 /, `${label}: on a fresh training field`);
      await page.locator('#coachClose').click();
      await page.locator('#endRun').click(); await page.locator('#gameConfirmAccept').click();
      await page.locator('#runResults').waitFor({state: 'visible'});
      await page.locator('#runResults').evaluate(dialog => dialog.close());
      await page.waitForSelector('#menuTutorial', {state: 'visible'});
    };
    // Back to the Command Center with the real control: both restart buttons live there.
    // A synthetic click: the field layout sits over the workspace nav, and this only
    // needs to trigger the same handler a tap would.
    await page.locator('#backToCommand').evaluate(button=>button.click());
    await page.waitForSelector('#menuTutorial',{state:'visible'});
    // (a) FIELD TUTORIAL in the Command Center: the whole first run, map and all.
    await restartOnce('field tutorial', async () => page.locator('#menuTutorial').click());
    // (b) The same thing from Settings, which also owns language, sound and graphics.
    await restartOnce('settings', async () => {
      await page.locator('#menuSettings').click();
      assert.equal(await page.locator('#settingsDialog').evaluate(e => e.open), true, 'the menu opens settings');
      assert.equal(await page.evaluate(() => document.querySelectorAll('#languageSelect').length), 1, 'exactly one language control');
      assert.equal(await page.evaluate(() => document.querySelectorAll('.language-picker').length), 0, 'nothing in the page corner');
      const before = await page.locator('#soundVolumeStatus').innerText();
      await page.locator('#soundVolume').fill('35');
      assert.match(await page.locator('#soundVolumeStatus').innerText(), /35/, `the slider reports its value (was ${before})`);
      await page.locator('#graphicsQuality').selectOption('reduced');
      await page.waitForSelector('#gameConfirm[open]');
      assert.match(await page.locator('#gameConfirmText').innerText(), /effects/i);
      await page.locator('#gameConfirmCancel').click();
      assert.equal(await page.locator('#graphicsQuality').inputValue(), 'full', 'a declined change snaps back');
      await page.locator('#settingsTutorialReset').click();
      await page.waitForSelector('#gameConfirm[open]');
      await page.locator('#gameConfirmAccept').click();
    });
    assert.equal(await page.evaluate(() => document.getElementById('settingsDialog').open), false, 'settings closed behind the replay');
    // Exercise the online handoff independently from Firebase: no stale solo
    // battlefield appears until the first authoritative match snapshot arrives.
    await page.evaluate(async()=>{const {createCommandCenter}=await import('./command-center.mjs?v=20261218-junction1');window.testNav=createCommandCenter({document,getProfile:()=>null,getGame:()=>({setMenuOpen(){},isOnlineMatch:()=>true}),isPartyActive:()=>true,openParty(){},closeParty(){},signOut(){}});document.querySelector('#gameWorkspace').dataset.onlineReady='false';window.testNav.showBattle();});
    assert.equal(await visible('.online-connecting'),true); assert.equal(await visible('#game'),false); assert.equal(await visible('#partyToggle'),true);
    await page.evaluate(()=>{document.querySelector('#gameWorkspace').dataset.onlineReady='true';document.querySelector('#gameWorkspace').hidden=false;});
    assert.equal(await visible('#game'),true); assert.equal(await visible('#campaignPanel'),false);
    await page.evaluate(()=>window.testNav.showLobby());assert.equal(await visible('#gameWorkspace'),true,'the field is back in reach before the restart is tested');
    assert.equal(await visible('#game'),false); assert.equal(await visible('#returnOnline'),true);
    await page.evaluate(()=>window.__mockAuth(null));assert.equal(await page.evaluate(()=>window.__friendListenerCount()),0);assert.equal(await page.locator('#menuFriendBadge').isHidden(),true);
    assert.deepEqual(errors,[],`browser exceptions: ${errors.join('\n')}`);
    console.log('Initialized command center: campaign, endless, multiplayer, armory, skills and tutorial work with mock account.');
    await context.close();
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{
  // A failed assertion used to leave Chromium running, so the job sat until
  // GitHub's 10 minute ceiling and reported a timeout instead of the real error.
  process.exit(process.exitCode||0);
});
