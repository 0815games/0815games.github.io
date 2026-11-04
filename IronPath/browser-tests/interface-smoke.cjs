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
      await page.evaluate(()=>document.querySelector('#friendRequestNotification').hidden=false);await check('#friendRequestNotification');await page.evaluate(()=>document.querySelector('#friendRequestNotification').hidden=true);
      await page.screenshot({ path: `browser-artifacts/${name}-command.png`, fullPage: true });
      await page.evaluate(() => {
        document.querySelector('#commandCenter').hidden = true; document.querySelector('#gameWorkspace').hidden = false;
        document.querySelector('#fourPartyPanel').hidden = false;
      });
      await check('#fourPartyCodeInput'); await check('#fourPartyJoin'); await check('#fourPartyCreate');
      await page.screenshot({ path: `browser-artifacts/${name}-lobby.png`, fullPage: true });
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
      console.log(`${name}: sign-in, command, lobby and dialogs fit the viewport`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
