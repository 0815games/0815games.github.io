// Layout and native-keyboard smoke for the real request card and styles. This
// uses a local static server and synthetic requests, not a screen reader,
// physical devices, Firebase or production data.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const build=JSON.parse(readFileSync(path.join(__dirname,'../release-version.json'),'utf8')).build;

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
 try{
  for(const viewport of [{width:320,height:568},{width:568,height:320},{width:320,height:240},{width:390,height:844},{width:844,height:390},{width:1280,height:800}]){
   const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'}),errors=[];
   try{
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());if(url.hostname!=='127.0.0.1')return route.abort();
     if(url.pathname==='/IronPath/'){const response=await route.fetch(),html=(await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');return route.fulfill({response,body:html});}
     return route.continue();
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));
    await page.goto('http://127.0.0.1:8765/IronPath/');
    await page.evaluate(async build=>{
     for(const id of ['languageGate','introOverlay','loading','authView','entry'])document.getElementById(id)?.setAttribute('hidden','');
     document.getElementById('gameView').hidden=false;
     const {setupLanguage,translateText:tr,onLanguageChange}=await import(`./language.mjs?v=${build}`);
     setupLanguage({document,storage:{getItem:()=> 'de',setItem(){}}});
     const {createMultiplayerPrompts}=await import(`./core/multiplayer-prompts.mjs?v=${build}`);
     const center=createMultiplayerPrompts({document,translate:tr});onLanguageChange(()=>center.refresh());
     window.__center=center;window.__runs=0;window.__sender='<b>WWWWWWWWWWWWWW</b>';
     window.__item=key=>({key,title:()=>tr('SPEED REQUEST'),body:()=>tr('{name} requests 2× for wave {wave}. {approved}/{required} approved.',{name:window.__sender,wave:23,approved:0,required:3}),note:()=>tr('Battle continues while you decide.'),actions:[{id:'approve',label:()=>tr('APPROVE 2×'),run:()=>{window.__runs++;return true;}},{id:'decline',label:()=>tr('DECLINE'),run:()=>{window.__runs++;return true;}}]});
    },build);
    await page.locator('#menuMultiplayer').focus();await page.evaluate(()=>window.__center.update('battle',[window.__item('one')]));
    const root=page.locator('#multiplayerPrompt');await root.waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>document.activeElement.id),'menuMultiplayer','a new non-modal card does not steal focus');
    assert.equal(await page.getByRole('region',{name:'TEMPOANFRAGE'}).getAttribute('id'),'multiplayerPrompt');
    assert.equal(await root.locator('[role="status"][aria-live="polite"]').count(),1);
    assert.match(await root.locator('#multiplayerPromptBody').textContent(),/<b>WWWWWWWWWWWWWW<\/b> beantragt 2×/);
    assert.equal(await root.locator('#multiplayerPromptBody b').count(),0,'sender names are text, not markup');
    const box=await root.evaluate(element=>{
     const r=element.getBoundingClientRect(),buttons=[...element.querySelectorAll('button')].map(button=>{const b=button.getBoundingClientRect();return {width:b.width,height:b.height};}),style=getComputedStyle(element);
     return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewportWidth:innerWidth,viewportHeight:innerHeight,scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,buttons,animation:style.animationName};
    });
    assert.ok(box.left>=-1&&box.top>=-1&&box.right<=box.viewportWidth+1&&box.bottom<=box.viewportHeight+1&&box.scrollWidth<=box.clientWidth+1,JSON.stringify({viewport,box}));
    assert.ok(Math.abs((box.left+box.right)/2-box.viewportWidth/2)<2&&Math.abs((box.top+box.bottom)/2-box.viewportHeight/2)<2,JSON.stringify({viewport,box}));
    assert.ok(box.buttons.every(button=>button.width>=44&&button.height>=44),JSON.stringify({viewport,box}));assert.equal(box.animation,'none');
    assert.equal(await page.evaluate(()=>document.getElementById('multiplayerPrompt').contains(document.elementFromPoint(2,2))),false,'there is no full-screen click-catching backdrop');
    await page.evaluate(()=>{if(document.documentElement.lang!=='en')document.getElementById('languageToggle').click();});
    assert.equal(await page.getByRole('region',{name:'SPEED REQUEST'}).getAttribute('id'),'multiplayerPrompt');assert.match(await root.locator('#multiplayerPromptNote').textContent(),/Battle continues/);
    const approve=root.locator('[data-action="approve"]'),decline=root.locator('[data-action="decline"]'),later=root.locator('[data-action="later"]');
    await approve.focus();await page.keyboard.press('Tab');assert.equal(await decline.evaluate(element=>element===document.activeElement),true);
    await page.keyboard.press('Tab');assert.equal(await later.evaluate(element=>element===document.activeElement),true);
    const inView=await later.evaluate(element=>{const b=element.getBoundingClientRect(),r=element.closest('#multiplayerPrompt').getBoundingClientRect();return b.top>=r.top-1&&b.bottom<=r.bottom+1;});
    assert.equal(inView,true,'keyboard focus scrolls even a short card to its last action');
    await page.keyboard.press('Escape');await root.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.__runs),0,'Escape is not a vote');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'menuMultiplayer','focus returns to the prior control');
    await page.evaluate(()=>window.__center.update('battle',[window.__item('two')]));await root.waitFor({state:'visible'});
    await approve.focus();await page.keyboard.press('Enter');await root.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.__runs),1,'keyboard approval is an explicit action');
    await page.evaluate(async build=>{
     if(document.documentElement.lang!=='de')document.getElementById('languageToggle').click();
     const [{createConfirmation},{translateText}]=await Promise.all([import(`./ui/confirmation.mjs?v=${build}`),import(`./language.mjs?v=${build}`)]);
     window.__confirmation=createConfirmation(document,translateText);window.__decision=null;
     window.__confirmation.ask({title:'Sign out?',text:'Waiting ends the shared match and signs you out only after every report and reward is confirmed. Keep this page open. Signing out now can leave the party open and rewards unconfirmed.',accept:'END AND WAIT',alternate:'SIGN OUT NOW'}).then(value=>window.__decision=value);
    },build);
    const dialog=page.locator('#gameConfirm');await dialog.waitFor({state:'visible'});
    assert.equal(await page.locator('#gameConfirmAlternate').textContent(),'JETZT ABMELDEN');
    const confirmationBox=await dialog.evaluate(element=>{const r=element.getBoundingClientRect(),buttons=[...element.querySelectorAll('button')].filter(b=>!b.hidden).map(b=>{const x=b.getBoundingClientRect();return {width:x.width,height:x.height};}),style=getComputedStyle(element);return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,innerWidth,innerHeight,visual:{width:visualViewport.width,height:visualViewport.height,offsetLeft:visualViewport.offsetLeft,offsetTop:visualViewport.offsetTop,scale:visualViewport.scale},css:{width:style.width,height:style.height,maxHeight:style.maxHeight,boxSizing:style.boxSizing,margin:style.margin},buttons};});
    assert.ok(confirmationBox.left>=-1&&confirmationBox.right<=viewport.width+1&&confirmationBox.top>=-1&&confirmationBox.bottom<=viewport.height+1&&confirmationBox.scrollWidth<=confirmationBox.clientWidth+1,JSON.stringify({viewport,confirmationBox}));
    assert.ok(confirmationBox.buttons.length===3&&confirmationBox.buttons.every(button=>button.width>=44&&button.height>=44),JSON.stringify({viewport,confirmationBox}));
    await page.locator('#gameConfirmAlternate').focus();await page.keyboard.press('Enter');await dialog.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.__decision),'alternate','immediate sign-out requires its own explicit choice');
    await page.evaluate(()=>{window.__decision=null;window.__confirmation.ask({title:'Sign out?',text:'Confirm',accept:'END AND WAIT',alternate:'SIGN OUT NOW'}).then(value=>window.__decision=value);});
    await dialog.waitFor({state:'visible'});await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.__decision),false,'Escape cancels, never signs out');
    await page.evaluate(async build=>{
     document.getElementById('commandCenter').hidden=true;const field=document.getElementById('gameWorkspace');field.hidden=false;field.dataset.screen='online';field.dataset.onlineReady='true';
     window.__fieldSignOut=0;document.getElementById('menuLogout').onclick=()=>window.__fieldSignOut++;
     const {setupFieldMenu}=await import(`./ui/field-menu.mjs?v=${build}`);setupFieldMenu({document});
    },build);
    await page.locator('#fieldOps > summary').click();const fieldLogout=page.locator('#fieldLogout');await fieldLogout.scrollIntoViewIfNeeded();
    const actionBox=await fieldLogout.evaluate(element=>{const r=element.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,hit:document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2)===element};});
    assert.ok(actionBox.width>=44&&actionBox.height>=44&&actionBox.hit&&actionBox.left>=0&&actionBox.right<=viewport.width&&actionBox.top>=0&&actionBox.bottom<=viewport.height,JSON.stringify({viewport,actionBox}));
    await fieldLogout.click();assert.equal(await page.evaluate(()=>window.__fieldSignOut),1);assert.equal(await page.locator('#fieldOps').evaluate(element=>element.open),false);
    assert.deepEqual(errors,[]);console.log(`${viewport.width}x${viewport.height}: centered request, three-choice confirmation, field sign-out, overflow, focus and keyboard passed`);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
