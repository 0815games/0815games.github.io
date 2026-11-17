// Chromium exercises real battle controls for multiple isolated players. The
// host protocol is real, but the bridge below is an in-memory transport double:
// no Firebase, accounts, or production network is used.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const languageToken=readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8').match(/language\.mjs\?v=([\w-]+)/)[1];

(async()=>{
 const {createPlayer}=await import('../match.mjs');
 const {createMatch}=await import('../simulation.mjs');
 const {createFourCoop,createTwoVsTwo}=await import('../four-modes.mjs');
 const {createVersus}=await import('../versus.mjs');
 const {createPartyHost}=await import('../party-host.mjs');
 const cases=[['coop',2],['four-coop',3],['four-coop',4],['versus',2],['two-vs-two',4]],only=process.env.IRONPATH_BROWSER_CASE;
 if(only&&!cases.some(([mode,count])=>`${mode}/${count}`===only))throw Error(`Unknown browser case: ${only}`);
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
 try{
  for(const [mode,count] of cases){
   if(only&&`${mode}/${count}`!==only)continue;
   const ids=['alice','bob','cara','dan'].slice(0,count),names=['Alice','Bob','Cara','Dan'];
   const players=ids.map((id,i)=>createPlayer(id,{name:names[i],gender:'female',level:1}));
   const match=mode==='four-coop'?createFourCoop(players,'alice'):mode==='two-vs-two'?createTwoVsTwo(players,'alice',[['alice','bob'],['cara','dan']]):mode==='versus'?createVersus(players,'road','alice'):createMatch(players,'road');
   const core=createPartyHost(match,{hostId:'alice'});for(const id of ids)core.setPresence(id,true);
   const pages=[],contexts=[],errors=[];let chain=Promise.resolve(),stage='boot',lastMark=Date.now(),holdGuestReceipt=false,releaseHeldReceipt=null;
   const mark=value=>{const now=Date.now();stage=value;if(process.env.IRONPATH_BROWSER_VERBOSE)console.log(`${mode}/${count}: ${value} (+${now-lastMark}ms)`);lastMark=now;};
   async function sync(){await Promise.all(pages.map(({page,id})=>page.evaluate(snapshot=>window.__waveOptions.onSnapshot(snapshot),core.snapshotFor(id))));}
   try{
    for(let i=0;i<count;i++){
     mark(`boot player ${i+1}`);
     const mobile=i%3!==2,viewport=i%3===0?{width:390,height:844}:i%3===1?{width:844,height:390}:{width:1280,height:800};
     const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});contexts.push(context);
     await context.route('**/*',async route=>{
      const url=new URL(route.request().url());if(url.hostname!=='127.0.0.1')return route.abort();
      if(url.pathname==='/IronPath/'){
       const response=await route.fetch(),html=(await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
       return route.fulfill({response,body:html});
      }
      return route.continue();
     });
     const page=await context.newPage(),id=ids[i];page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(`${mode}/${id}: ${String(error)}`));
     await page.exposeFunction('__waveSend',command=>{
      const next=chain.then(async()=>{
       const snap=core.snapshotFor(id),packet={version:1,seq:snap.nextSeq,command,rosterGeneration:snap.rosterGeneration,focusGeneration:snap.focusGeneration};
       const received=core.receive(id,packet);if(received.status!=='queued')return {ok:false,reason:received.reason||received.status};
       const result=core.advance()?.commands.find(item=>item.playerId===id&&item.seq===packet.seq)?.result;
       if(!result)throw Error('missing command result');await sync();return result;
      });chain=next.catch(()=>{});
      // A host may process the next player's action while the requester is
      // still waiting for its receipt. Keep the transport chain independent
      // from this optional response delay so that race is realistic.
      return next.then(result=>{if(holdGuestReceipt&&id===ids.at(-1)&&command.type==='requestSpeed'){holdGuestReceipt=false;return new Promise(resolve=>{releaseHeldReceipt=()=>resolve(result);});}return result;});
     });
     await page.goto('http://127.0.0.1:8765/IronPath/',{waitUntil:'load'});
     await page.evaluate(async({id,name,language,snapshot,map,languageToken})=>{
      // Several full-canvas battlefields at once can starve Chromium's input
      // thread on a two-core CI worker. Throttle drawing only; real DOM, CSS,
      // pointer events and host simulation remain exercised. This is not a
      // frame-rate/performance test.
      const nativeFrame=window.requestAnimationFrame.bind(window),nativeCancel=window.cancelAnimationFrame.bind(window),frames=new Map();let frameId=0;
      window.requestAnimationFrame=callback=>{const id=++frameId,entry={timer:null,frame:null};frames.set(id,entry);entry.timer=setTimeout(()=>{if(!frames.has(id))return;entry.frame=nativeFrame(time=>{frames.delete(id);callback(time);});},100);return id;};
      window.cancelAnimationFrame=id=>{const entry=frames.get(id);if(!entry)return;clearTimeout(entry.timer);if(entry.frame!==null)nativeCancel(entry.frame);frames.delete(id);};
      for(const key of ['languageGate','introOverlay','loading','authView','entry','commandCenter'])document.getElementById(key)?.setAttribute('hidden','');
      document.getElementById('gameView').hidden=false;
      const workspace=document.getElementById('gameWorkspace');workspace.hidden=false;workspace.dataset.screen='online';
      const {setupLanguage,translateText,onLanguageChange}=await import(`./language.mjs?v=${languageToken}`);
      setupLanguage({document,storage:{getItem:()=>language,setItem(){}}});
      const {createMultiplayerPrompts}=await import(`./multiplayer-prompts.mjs?v=${languageToken}`);
      const promptCenter=createMultiplayerPrompts({document,translate:translateText});onLanguageChange(()=>promptCenter.refresh());window.__promptCenter=promptCenter;
      const {startGame}=await import('./game.js');
      const profile={name,gender:'female',xp:0,armory:'',skills:''};
      const account={getProfile:()=>profile,getUserId:()=>id,isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP:async()=>{},recordScore(){},saveCampaign:async()=>{},getToken:async()=> 'test',sandbox:()=>false};
      window.__waveGame=startGame(account,{nextMapId:()=>map,deferTutorial:true,experimentalFourViewport:true,promptCenter});window.__wavePending=0;
      if(!window.__waveGame.beginCoop(options=>(window.__waveOptions=options,{start(){options.onSnapshot(snapshot);options.onStatus(true);},stop(){},command(command){window.__wavePending++;return window.__waveSend(command).finally(()=>setTimeout(()=>window.__wavePending--,0));}})))throw Error('Cannot start browser test');
     },{id,name:names[i],language:i===0?'de':'en',snapshot:core.snapshotFor(id),map:count>2?'four-front':'road',languageToken});
     pages.push({page,id});
    }
    const host=pages[0].page,guest=pages.at(-1).page,requester=names[count-1];
    mark('wave request, decline and withdrawal');
    assert.equal(await host.locator('#start').innerText(),'WELLE ANFRAGEN');
    assert.equal(await guest.locator('#start').innerText(),'REQUEST WAVE');
    // Snapshots can render just before the sending promise and input lock
    // settle. Do not accidentally turn the next intended action into a rapid
    // double-tap; that separate behavior belongs in the protocol tests.
    const idle=page=>page.waitForFunction(()=>window.__wavePending===0);
    const tapOrClick=async(page,selector,mobile)=>{await idle(page);if(mobile)await page.locator(selector).tap();else await page.locator(selector).click();await idle(page);};
    // There is no radio device any more: ordinary traffic is SPOKEN into a
    // live region that is not painted over the field, so the test reads what
    // the game last said. (`textContent`, not `innerText`: the region is
    // deliberately invisible, and `innerText` of an unrendered box is empty.)
    // No `idle` either - this harness deliberately holds a wave operation in
    // flight to test a late receipt, and waiting for `__wavePending` would wait
    // for the very thing it is holding.
    const readRadio=async page=>page.locator('#message').textContent();
    const guestMobile=(count-1)%3!==2,prompt='#multiplayerPrompt',approve='#multiplayerPromptActions [data-action="approve"]',decline='#multiplayerPromptActions [data-action="decline"]',later='#multiplayerPromptActions [data-action="later"]';
    const waitPrompt=page=>page.locator(prompt).waitFor({state:'visible'});
    const checkPrompt=async page=>{const box=await page.locator(prompt).evaluate(element=>{const r=element.getBoundingClientRect(),buttons=[...element.querySelectorAll('button')].map(button=>{const b=button.getBoundingClientRect();return {width:b.width,height:b.height};});return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight,scroll:element.scrollWidth,client:element.clientWidth,buttons};});assert.ok(box.left>=0&&box.top>=0&&box.right<=box.width+1&&box.bottom<=box.height+1&&box.scroll<=box.client+1,`${mode}: centered card fits: ${JSON.stringify(box)}`);assert.ok(Math.abs((box.left+box.right)/2-box.width/2)<2&&Math.abs((box.top+box.bottom)/2-box.height/2)<2,`${mode}: card is centered`);assert.ok(box.buttons.every(b=>b.width>=44&&b.height>=44),`${mode}: buttons have touch-sized targets`);};
    // Field menus can open or close without any network snapshot or focus
    // event. A waiting request must not cover the menu or remain hidden.
    await host.locator('#mapViewport').focus();
    await host.evaluate(()=>window.__promptCenter.update('test-field',[{key:'one',title:'TEST',body:'Waiting for field menu',actions:[{id:'view',label:'VIEW',run:()=>true}]}]));
    await waitPrompt(host);await host.locator(later).focus();await host.evaluate(()=>{document.getElementById('radialMenu').hidden=false;});
    await host.locator(prompt).waitFor({state:'hidden',timeout:2500});
    assert.equal(await host.evaluate(()=>document.activeElement.id),'mapViewport','a deferred focused card returns focus outside');
    await host.evaluate(()=>{document.getElementById('radialMenu').hidden=true;});await host.locator(prompt).waitFor({state:'visible',timeout:2500});
    // A field choice in an invisible workspace must not suppress a lobby or
    // social notice. Re-entering that workspace defers it again.
    await host.evaluate(()=>{document.getElementById('storyDecision').hidden=false;});await host.locator(prompt).waitFor({state:'hidden',timeout:2500});
    await host.evaluate(()=>{document.getElementById('gameWorkspace').hidden=true;});await host.locator(prompt).waitFor({state:'visible',timeout:2500});
    await host.evaluate(()=>{document.getElementById('gameWorkspace').hidden=false;});await host.locator(prompt).waitFor({state:'hidden',timeout:2500});
    await host.evaluate(()=>{document.getElementById('gameWorkspace').dataset.screen='lobby';});await host.locator(prompt).waitFor({state:'visible',timeout:2500});
    await host.evaluate(()=>{document.getElementById('gameWorkspace').dataset.screen='online';});await host.locator(prompt).waitFor({state:'hidden',timeout:2500});
    await host.evaluate(()=>{document.getElementById('storyDecision').hidden=true;});await host.locator(prompt).waitFor({state:'visible',timeout:2500});
    await tapOrClick(host,later,true);await host.evaluate(()=>window.__promptCenter.update('test-field',[]));
    // An existing modal and a queued social notice are not closed or stacked.
    await host.evaluate(()=>{document.getElementById('towerDetails').showModal();window.__promptCenter.update('test-social',[{key:'one',title:'PARTY INVITATION',body:'Synthetic invitation',actions:[{id:'view',label:'VIEW',run:()=>true}]}]);});
    await tapOrClick(guest,'#start',guestMobile);
    assert.equal(await host.locator('#towerDetails').evaluate(d=>d.open),true);assert.equal(await host.locator(prompt).isHidden(),true);
    await host.evaluate(()=>document.getElementById('towerDetails').close());await waitPrompt(host);assert.equal(await host.locator('#multiplayerPromptBody').innerText(),'Synthetic invitation');
    await tapOrClick(host,later,true);await waitPrompt(host);
    assert.match(await host.locator('#multiplayerPromptBody').innerText(),new RegExp(`${requester} fragt Welle 1 an\\. ${count-1} Zustimmung`));
    assert.equal(await host.locator('#start').innerText(),'WELLE BESTÄTIGEN');assert.equal(await guest.locator('#start').innerText(),'CANCEL REQUEST');assert.equal(await guest.locator('#waveDecline').isHidden(),true);
    for(const {page} of pages.slice(0,-1)){await waitPrompt(page);await checkPrompt(page);}
    // Language changes repaint the same decision; no approval or focus steal.
    await host.evaluate(()=>{const s=document.getElementById('languageSelect');s.value='en';s.dispatchEvent(new Event('change'));window.__waveGame.refreshLanguage();});
    assert.match(await host.locator('#multiplayerPromptBody').innerText(),/requests wave 1/);
    await host.evaluate(()=>{const s=document.getElementById('languageSelect');s.value='de';s.dispatchEvent(new Event('change'));window.__waveGame.refreshLanguage();window.__staleAccept=document.querySelector('#multiplayerPromptActions [data-action="approve"]');});
    await tapOrClick(host,later,true);await host.waitForFunction(()=>!document.getElementById('waveRequest').hidden);await host.evaluate(()=>window.__staleAccept.click());
    const pending=()=>{const s=core.checkpoint().match;return mode==='four-coop'||mode==='two-vs-two'?s.pending:s.waveRequest;};
    assert.ok(pending()&&!pending().approved.includes('alice'),'Later and a detached old button do not approve');
    await tapOrClick(host,'#waveDecline',true);await guest.waitForFunction(()=>document.getElementById('waveRequest').hidden);
    assert.equal(core.checkpoint().match.mode==='four-coop'?core.checkpoint().match.match.wave:mode==='two-vs-two'?core.checkpoint().match.lanes[0].wave:mode==='versus'?core.checkpoint().match.lanes.alice.wave:core.checkpoint().match.wave,0);
    await tapOrClick(guest,'#start',guestMobile);await waitPrompt(host);await tapOrClick(host,decline,true);await guest.waitForFunction(()=>document.getElementById('waveRequest').hidden);
    await tapOrClick(guest,'#start',guestMobile);await guest.waitForFunction(()=>!document.getElementById('waveRequest').hidden);
    await tapOrClick(guest,'#start',guestMobile);await guest.waitForFunction(()=>document.getElementById('waveRequest').hidden);
    await tapOrClick(guest,'#start',guestMobile);await waitPrompt(host);
    mark('wave one approvals');
    for(let i=0;i<count-1;i++){
     const page=pages[i].page;
     // Keyboard activation also takes the explicit approval path.
     await waitPrompt(page);
     if(i===0){await idle(page);await page.locator(approve).focus();await page.keyboard.press('Enter');await idle(page);}else await tapOrClick(page,approve,i%3!==2);
     if(i<count-2){
      await guest.waitForFunction(expected=>document.getElementById('waveRequestText').textContent.includes(`${expected} approval`),count-i-2);
      assert.equal(await page.locator('#start').isDisabled(),true);
      assert.equal(await page.locator('#waveDecline').isVisible(),true,'an earlier approver may still decline while others are deciding');
     }
    }
    for(const {page} of pages){await page.waitForFunction(()=>document.getElementById('waveRequest').hidden);assert.match(await page.locator('#start').innerText(),/WELLE LÄUFT|WAVE IN PROGRESS/);}
    const final=core.checkpoint().match,fields=mode==='four-coop'?[final.match]:mode==='two-vs-two'?final.lanes:mode==='versus'?Object.values(final.lanes):[final];
    assert.ok(fields.every(field=>field.wave===1&&field.running),`${mode}: each field starts once`);

    // Fast-forward the real deterministic simulation to the end of wave one,
    // then start wave two via the actual UI. No timeouts stand in for consent.
    mark('clear wave one and start wave two');
    const matchFields=()=>{const s=core.checkpoint().match;return mode==='four-coop'?[s.match]:mode==='two-vs-two'?s.lanes:mode==='versus'?Object.values(s.lanes):[s];};
    let steps=0;while(steps<6000&&matchFields().some(field=>field.running&&!field.ended)){for(let n=0;n<30;n++)core.advance();steps+=30;}
    assert.ok(matchFields().every(field=>field.wave===1&&!field.running&&!field.ended),`${mode}: wave one really cleared`);
    await sync();await guest.waitForFunction(()=>document.getElementById('start').textContent==='REQUEST WAVE');
    await tapOrClick(guest,'#start',guestMobile);await waitPrompt(host);
    for(let i=0;i<count-1;i++){await waitPrompt(pages[i].page);await tapOrClick(pages[i].page,approve,i%3!==2);}
    for(const {page} of pages)await page.waitForFunction(()=>document.getElementById('waveRequest').hidden);
    assert.ok(matchFields().every(field=>field.wave===2&&field.running),`${mode}: wave two is active`);

    // The originally reported bug was a guest's 2× request during wave 2/3.
    // Exercise the real buttons in all five modes as well as the wave vote.
    mark('speed request, geometry, decline and withdrawal');
    await tapOrClick(guest,'#speed',guestMobile);await waitPrompt(host);
    assert.match(await host.locator('#multiplayerPromptBody').innerText(),new RegExp(`${requester} beantragt 2× für Welle 2\\. 0/${count-1} bestätigt\\.`));
    assert.match(await host.locator('#multiplayerPromptNote').innerText(),/Kampf läuft.*weiter/);
    for(const {page} of pages.slice(0,-1)){await waitPrompt(page);await checkPrompt(page);}
    // The non-modal popup does not pause the authoritative battlefield.
    const beforeSpawn=matchFields().map(field=>field.spawnIndex);for(let n=0;n<100;n++)core.advance();
    assert.ok(matchFields().some((field,i)=>field.spawnIndex>beforeSpawn[i]),`${mode}: the wave advanced while the card was open`);await sync();
    await tapOrClick(host,decline,true);await guest.waitForFunction(()=>document.getElementById('speedRequest').hidden);
    // The battle status is not raised as a notice: the device that kept it is
    // gone, and ordinary traffic is spoken out of sight. (A warning from an
    // earlier step may well still be standing - it has its own turn - so this
    // checks WHAT the notice says, not whether it is there at all.)
    assert.doesNotMatch(await guest.locator('#fieldNoticeText').textContent(),/2× request ended/i,'ordinary traffic is spoken, not raised over the field');
    assert.match(await readRadio(guest),/2× request ended\. Check the current speed/i,'a missing vote has no fabricated reason');
    assert.equal(core.snapshotFor('alice').speedControl.speed,1,'decline never accelerates the wave');
    // Hold only the guest's success receipt: the host declines meanwhile, so a
    // late receipt must not replace the newer status with a false waiting bar.
    holdGuestReceipt=true;await idle(guest);if(guestMobile)await guest.locator('#speed').tap();else await guest.locator('#speed').click();
    await waitPrompt(host);await chain;assert.equal(typeof releaseHeldReceipt,'function');await tapOrClick(host,decline,true);
    await guest.waitForFunction(()=>document.getElementById('speedRequest').hidden);
    assert.match(await readRadio(guest),/2× request ended\. Check the current speed/i);
    releaseHeldReceipt();releaseHeldReceipt=null;await idle(guest);
    assert.match(await readRadio(guest),/2× request ended\. Check the current speed/i,'a late request receipt does not restore waiting');
    await tapOrClick(guest,'#speed',guestMobile);await guest.waitForFunction(()=>!document.getElementById('speedRequest').hidden);await waitPrompt(host);
    await tapOrClick(guest,'#speed',guestMobile);await host.locator(prompt).waitFor({state:'hidden'});
    await tapOrClick(guest,'#speed',guestMobile);await waitPrompt(host);
    mark('disconnect and reconnect');
    const syncPresence=async()=>Promise.all(pages.map(({page,id})=>page.evaluate(({snapshot,ready})=>{
     window.__waveOptions.onSnapshot(snapshot);window.__waveOptions.onStatus(ready);
    },{snapshot:core.snapshotFor(id),ready:core.readyFor(id)})));
    core.setPresence(ids.at(-1),false);await syncPresence();
    await host.locator(prompt).waitFor({state:'hidden'});
    assert.equal(core.snapshotFor('alice').speedControl.speed,1,'a disconnect invalidates the speed vote');
    core.setPresence(ids.at(-1),true);await syncPresence();
    assert.equal(core.snapshotFor('alice').speedControl.request,null,'reconnection never revives the old vote');
    mark('speed approvals');
    await tapOrClick(guest,'#speed',guestMobile);await waitPrompt(host);
    for(let i=0;i<count-1;i++){
     const page=pages[i].page;await waitPrompt(page);
     if(i===0){await idle(page);await page.locator(approve).focus();await page.keyboard.press('Enter');await idle(page);}
     else await tapOrClick(page,approve,i%3!==2);
     if(i<count-2)assert.equal(core.snapshotFor('alice').speedControl.speed,1,'all other players must approve');
    }
    for(const {page} of pages){await page.waitForFunction(()=>document.getElementById('speedRequest').hidden);assert.match(await page.locator('#speed').innerText(),/2×/);}
    assert.match(await readRadio(guest),/2× approved by all players/i);
    // And nothing of the old device is left on the field to read it from.
    assert.equal(await guest.locator('#radioLog').count(),0,`${mode}: the radio log is gone`);
    assert.equal(core.snapshotFor('alice').speedControl.speed,2);
    await tapOrClick(host,'#speed',true);assert.equal(core.snapshotFor('alice').speedControl.speed,1);
    assert.deepEqual(errors,[]);mark('complete');
    console.log(`${mode}/${count}: guest wave and wave-two 2× requests, refusal, withdrawal, reconnect and unanimous approval passed in Chromium`);
   }catch(error){console.error(`${mode}/${count}: failed at ${stage}`);throw error;}
   finally{releaseHeldReceipt?.();for(const context of contexts)await context.close();}
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
