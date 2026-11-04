// Layout smoke tests only: scripts and Firebase are deliberately blocked. These
// screenshots exercise real CSS in Chromium, not sign-in or online gameplay.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync('browser-artifacts', { recursive: true });
  try {
    for (const [name, width, height] of [['phone', 320, 700], ['phone-wide', 390, 844], ['desktop', 1440, 900]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.hostname !== '127.0.0.1' || route.request().resourceType() === 'script') return route.abort();
        return route.continue();
      });
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:8765/IronPath/', { waitUntil: 'load' });
      assert.equal(await page.locator('link[href^="interface-redesign.css"]').count(), 1);
      const check = async (selector) => {
        const box = await page.locator(selector).boundingBox();
        assert.ok(box && box.width > 0 && box.height > 0, `${name}: ${selector} is not visible`);
        assert.ok(box.x >= -1 && box.x + box.width <= width + 1, `${name}: ${selector} extends outside viewport: ${JSON.stringify(box)}`);
      };
      await page.evaluate(() => { document.querySelector('#introOverlay').hidden = true; document.querySelector('#loading').hidden = true; document.querySelector('#authView').hidden = false; });
      await check('#authForm'); await check('#authSubmit');
      await page.screenshot({ path: `browser-artifacts/${name}-signin.png`, fullPage: true });
      await page.evaluate(() => {
        document.querySelector('#entry').hidden = true; document.querySelector('#gameView').hidden = false;
        document.querySelector('#menuName').textContent = 'Field Commander'; document.querySelector('#menuLevel').textContent = 'LEVEL 12';
      });
      await check('#menuMultiplayer'); await check('#menuCampaign');
      // A global hover shorthand previously reset the art to its natural size,
      // exposing the source image border. Each card must retain its crop.
      for(const id of ['menuCampaign','menuEndless','menuMultiplayer']){
        await page.mouse.move(0,0);
        const card=page.locator('#'+id);
        const background=()=>card.evaluate(el=>{const s=getComputedStyle(el);return {image:s.backgroundImage,size:s.backgroundSize,position:s.backgroundPosition,repeat:s.backgroundRepeat};});
        const normal=await background();await card.hover();const hovered=await background();
        assert.match(normal.image,/url\(/,`${name}: ${id} needs artwork`);assert.ok(normal.size.split(',').every(size=>size.trim()==='cover'));assert.deepEqual(hovered,normal,`${name}: ${id} artwork crop must not shift on hover`);
        if(name==='desktop')await page.screenshot({path:`browser-artifacts/${name}-${id}-hover.png`});
      }
      await page.mouse.move(0,0);

      await page.evaluate(()=>{document.querySelector('#menuFriendBadge').textContent='12';document.querySelector('#menuFriendBadge').hidden=false;document.querySelector('#menuFriends').classList.add('has-friend-requests');});await check('#menuFriends');await check('#menuFriendBadge');await page.evaluate(()=>{document.querySelector('#menuFriendBadge').hidden=true;document.querySelector('#menuFriends').classList.remove('has-friend-requests');});
      await page.evaluate(()=>{document.querySelector('#socialPopupTitle').textContent='PARTY INVITATION';document.querySelector('#socialPopupBody').textContent='A very long soldier name invited you to a party.';document.querySelector('#socialPopup').hidden=false;});await check('#socialPopup');await check('#socialPopupOpen');await check('#socialPopupDismiss');await page.screenshot({path:`browser-artifacts/${name}-social-popup.png`});await page.evaluate(()=>document.querySelector('#socialPopup').hidden=true);
      await page.screenshot({ path: `browser-artifacts/${name}-command.png`, fullPage: true });
      await page.evaluate(() => {
        document.querySelector('#commandCenter').hidden = true; document.querySelector('#gameWorkspace').hidden = false;
        document.querySelector('#fourPartyPanel').hidden = false;
      });
      await check('#fourPartyCodeInput'); await check('#fourPartyJoin'); await check('#fourPartyCreate');
      await page.evaluate(()=>{document.querySelector('#runPerkPanel').hidden=false;document.querySelector('#runPerk0').textContent='Defenses';document.querySelector('#runPerk1').textContent='Supplies';document.querySelector('#runPerk2').textContent='Repair';});await check('#runPerkPanel');await check('#runPerkClose');const centered=await page.locator('#runPerkPanel').evaluate(el=>{const p=el.getBoundingClientRect(),m=el.parentElement.getBoundingClientRect();return {x:(p.left+p.right-m.left-m.right)/2,y:(p.top+p.bottom-m.top-m.bottom)/2};});assert.ok(Math.abs(centered.x)<2&&Math.abs(centered.y)<2,`${name}: field upgrade popup is centered`);await page.screenshot({path:`browser-artifacts/${name}-field-upgrade.png`});await page.evaluate(()=>document.querySelector('#runPerkPanel').hidden=true);

      await page.evaluate(()=>{document.querySelector('#fourPartyPanel').hidden=true;document.querySelector('#speedRequest').hidden=false;document.querySelector('#speedRequestText').textContent='A long soldier name requests 2× for wave 12. 1/3 approved.';});await check('#speedRequest');await check('#speedApprove');await check('#speedDecline');await page.evaluate(()=>{document.querySelector('#speedRequest').hidden=true;document.querySelector('#fourPartyPanel').hidden=false;});
      await page.screenshot({ path: `browser-artifacts/${name}-lobby.png`, fullPage: true });
      // Inspect the actual battlefield layout independently of Firebase.
      await page.evaluate(()=>{document.querySelector('#fourPartyPanel').hidden=true;document.querySelector('#gameWorkspace').dataset.screen='endless';});
      await check('#mapViewport');await check('.dashboard');await check('#start');await check('#speed');await check('#ability');await check('#endRun');await check('#message');
      const hud=await page.evaluate(()=>{const b=document.querySelector('#game').getBoundingClientRect(),d=document.querySelector('.dashboard').getBoundingClientRect(),c=document.querySelector('.command').getBoundingClientRect();return {b:{top:b.top,bottom:b.bottom,left:b.left,right:b.right},d:{top:d.top,bottom:d.bottom,left:d.left,right:d.right},c:{top:c.top,bottom:c.bottom,left:c.left,right:c.right}};});
      assert.ok(hud.d.top>=0 && hud.d.top<height/4,`${name}: HUD overlays the top of the battlefield`);
      const mapView=await page.locator('#mapViewport').boundingBox();assert.ok(mapView.height>=height-2,`${name}: battlefield fills the viewport`);await check('#fieldOps > summary');
      assert.ok(hud.c.left>=-1 && hud.c.right<=width+1,`${name}: controls stay inside viewport`);
      await page.screenshot({path:`browser-artifacts/${name}-field-command.png`,fullPage:true});
      await page.evaluate(()=>document.querySelector('#fourPartyPanel').hidden=false);
      for (const [id, control] of [['skillDialog', '#skillSave'], ['armoryDialog', '#armoryClose'], ['runResults', '#resultsDone'], ['gameConfirm', '#gameConfirmAccept'], ['tutorialDialog', '#tutorialNext'], ['friendsDialog', '#friendsClose'], ['leaderboardDialog', '#leaderboardClose']]) {
        await page.evaluate(id => document.getElementById(id).showModal(), id);
        await check(`#${id}`); await check(control);
        if(id==='friendsDialog'||id==='leaderboardDialog'){
          const layout=await page.locator(control).evaluate(el=>{const r=el.getBoundingClientRect(),h=el.parentElement.getBoundingClientRect(),style=getComputedStyle(el);return {rightGap:h.right-r.right,textAlign:style.textAlign,width:r.width,height:r.height};});
          assert.ok(Math.abs(layout.rightGap)<2,`${name}: ${control} should align to the right edge of its header`);assert.equal(layout.textAlign,'center');assert.ok(layout.width>=44&&layout.height>=44);
        }
        await page.screenshot({ path: `browser-artifacts/${name}-${id}.png` });
        await page.evaluate(id => document.getElementById(id).close(), id);
      }
      for (const [panel,control] of [['tutorialSkillsPractice','#tutorialSkillNode'],['tutorialArmoryPractice','#tutorialEquip']]) {
        await page.evaluate(id=>{document.querySelector('#tutorialScene').hidden=true;document.getElementById(id).hidden=false;document.querySelector('#tutorialDialog').showModal();},panel);
        await check(control);await page.screenshot({path:`browser-artifacts/${name}-${panel}.png`});
        await page.evaluate(id=>{document.querySelector('#tutorialDialog').close();document.getElementById(id).hidden=true;},panel);
      }
      console.log(`${name}: sign-in, command, lobby and dialogs fit the viewport`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
