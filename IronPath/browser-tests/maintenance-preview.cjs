// Design/interaction smoke only. This preview neither contacts Firebase nor
// proves real maintenance, sign-out, session revocation or deployment behavior.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.IRONPATH_BASE_URL||'http://127.0.0.1:8765/IronPath';
const out=process.env.IRONPATH_SCREENSHOT_DIR||'browser-artifacts';

(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:process.env.CHROMIUM_PATH?['--no-sandbox']:[]});
  try{
    for(const [name,width,height] of [['small-phone',320,568],['phone',390,844],['desktop',1440,900]]){
      const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
      const page=await context.newPage(),errors=[],requests=[];
      page.on('pageerror',error=>errors.push(String(error)));
      page.on('request',req=>requests.push(req.url()));
      try{
        await page.goto(`${base}/release-tools/maintenance-preview.html`,{waitUntil:'load'});
        assert.equal(await page.locator('#previewLabel').textContent(),'LOKALE VORSCHAU · NICHT LIVE');
        assert.equal(await page.locator('#titleText').textContent(),'Einsatzpause');
        assert.equal(await page.locator('.release-brand').evaluate(img=>img.complete&&img.naturalWidth>0),true,'game brand loads');
        assert.match(await page.locator('.release-scene').evaluate(el=>getComputedStyle(el,'::before').backgroundImage),/story-outpost\.jpg/);
        assert.equal(await page.locator('.status-pulse').evaluate(el=>getComputedStyle(el).animationName),'none','reduced motion is respected');
        const assertFits=async()=>{
          const result=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,card:(()=>{const b=document.querySelector('.release-card').getBoundingClientRect();return {left:b.left,right:b.right,width:b.width};})()}));
          assert.ok(result.scroll<=width+1,`${name}: no horizontal scrolling ${JSON.stringify(result)}`);
          assert.ok(result.card.left>=-1&&result.card.right<=width+1,`${name}: card fits ${JSON.stringify(result)}`);
        };
        await assertFits();
        await page.screenshot({path:path.join(out,`maintenance-${name}.png`),fullPage:true});
        await page.locator('#previewLanguage').click();assert.equal(await page.locator('#titleText').textContent(),'Operation paused');
        assert.equal(await page.locator('#previewLabel').textContent(),'LOCAL PREVIEW · NOT LIVE');await assertFits();
        await page.locator('#previewState').selectOption('unavailable');assert.equal(await page.locator('#titleText').textContent(),'Signal lost');
        assert.match(await page.locator('#lead').textContent(),/cannot be confirmed/);
        await page.locator('#previewState').selectOption('updating');assert.equal(await page.locator('#titleText').textContent(),'Almost ready');
        assert.equal(await page.locator('#step3Row').evaluate(el=>el.classList.contains('is-current')),true);
        await page.locator('#previewLanguage').click();assert.equal(await page.locator('#titleText').textContent(),'Fast bereit');await assertFits();
        assert.deepEqual(errors,[]);
        assert.ok(requests.every(request=>new URL(request).origin===new URL(base).origin),'preview makes no Firebase/network calls');
        console.log(`${name}: localized preview, states, responsive layout and reduced motion pass`);
      }finally{await context.close();}
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
