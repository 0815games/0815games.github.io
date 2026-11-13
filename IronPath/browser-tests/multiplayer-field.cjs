// Real Chromium input regression for the large co-op field. The account and
// network are deliberately stubbed; pointer/click propagation, rendering and
// CSS geometry are not. Run with the other browser smokes on port 8765.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    await context.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.hostname!=='127.0.0.1')return route.abort();
      if(url.pathname==='/IronPath/'){
        const response=await route.fetch();
        const html=(await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
        return route.fulfill({response,body:html});
      }
      return route.continue();
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto('http://127.0.0.1:8765/IronPath/');
    const boot=await page.evaluate(async()=>{
      for(const id of ['languageGate','introOverlay','loading','authView','entry'])document.getElementById(id)?.setAttribute('hidden','');
      document.getElementById('gameView').hidden=false;
      const workspace=document.getElementById('gameWorkspace');workspace.hidden=false;workspace.dataset.screen='online';
      // Register before the game to prove the compatibility click really took
      // place even if the game's own capture listener stops it afterwards.
      window.__clicks=[];
      document.addEventListener('click',e=>window.__clicks.push({trusted:e.isTrusted,detail:e.detail,target:e.target.id}),true);
      const {startGame}=await import('./game.js'),{createPlayer}=await import('./match.mjs');
      const {createFourCoop,applyFourCommand}=await import('./four-modes.mjs');
      const ids=['alice','bob','cara'],profile={name:'Alice',gender:'female',xp:750,armory:'',skills:''};
      const match=createFourCoop(ids.map(id=>createPlayer(id,{...profile,name:id})),'alice','four-front');
      const mine=applyFourCommand(match,'alice',{type:'build',pad:4,towerType:0});
      const theirs=applyFourCommand(match,'bob',{type:'build',pad:11,towerType:1});
      window.__match=match;window.__commands=[];
      const account={getProfile:()=>profile,getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>3,onSessionChange(){},awardXP:async()=>{},recordScore(){},saveCampaign:async()=>{},getToken:async()=> 'test',sandbox:()=>false};
      window.__control=startGame(account,{experimentalFourViewport:true,nextMapId:()=>window.__nextMap||'four-front',deferTutorial:true,confirmAction:async()=>true});
      const started=window.__control.beginCoop(options=>(window.__options=options,{
        start(){options.onSnapshot({match:structuredClone(match)});options.onStatus(true);},stop(){},
        async command(command){window.__commands.push(command);await new Promise(resolve=>setTimeout(resolve,40));const result=applyFourCommand(match,'alice',command);options.onSnapshot({match:structuredClone(match)});return result;}
      }));
      return {mine,theirs,started};
    });
    assert.ok(boot.started&&boot.mine.ok&&boot.theirs.ok);
    await page.waitForFunction(()=>document.getElementById('game').dataset.fullBattle==='true');
    const size=await page.locator('#game').boundingBox();
    assert.ok(size.width>=389&&size.height>=800,`portrait battlefield fills the phone, got ${JSON.stringify(size)}`);

    // Reference the same documented camera geometry, not the old 960x540
    // projection: the logical height changes with the portrait canvas.
    const setView=async(fill)=>page.evaluate(async fill=>{
      const {getMap}=await import('./maps.mjs');const {createBattleViewport,zoomBattleViewport}=await import('./battle-viewport.mjs');
      const map=getMap('four-front'),r=document.getElementById('game').getBoundingClientRect();
      const height=document.getElementById('game').dataset.fullBattle==='true'?Math.round(960*r.height/r.width):540;
      let v=createBattleViewport(map.width,map.height,960,height);
      if(fill)v=zoomBattleViewport(v,Math.max(v.width/v.worldWidth,v.height/v.worldHeight)/v.scale,{x:v.width/2,y:v.height/2});
      window.__view=v;
    },fill);
    const point=async index=>page.evaluate(async index=>{
      const {getMap}=await import('./maps.mjs'),pad=getMap('four-front').pads[index],v=window.__view,r=document.getElementById('game').getBoundingClientRect();
      const x=r.left+(pad.x-v.x)*v.scale*r.width/v.width,y=r.top+(pad.y-v.y)*v.scale*r.height/v.height;
      return {x,y,target:document.elementFromPoint(x,y)?.id};
    },index);
    const tapPad=async(index,touch=false)=>{
      const p=await point(index);assert.equal(p.target,'game',`pad ${index} must be visible on the canvas: ${JSON.stringify(p)}`);
      if(touch)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
      await page.waitForFunction(()=>!document.getElementById('radialMenu').hidden);
    };
    const closeOutside=async(touch=false)=>{
      const p={x:12,y:400};if(touch)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
      await page.waitForFunction(()=>document.getElementById('radialMenu').hidden);
    };
    // The opening camera follows the local soldier. Switch via overview back
    // to a centred fill for the deterministic pad projections used below.
    await page.evaluate(()=>{const b=document.getElementById('mapZoom');if(b.getAttribute('aria-pressed')==='true')b.click();b.click();});
    await setView(true);

    await tapPad(4);assert.match(await page.locator('#sheetTitle').textContent(),/MG Nest/,'own tower stays open after mouse click');
    assert.ok((await page.evaluate(()=>window.__clicks)).some(e=>e.trusted&&e.detail>0),'a real compatibility click was dispatched');
    const commandsBefore=await page.evaluate(()=>window.__commands.length);await closeOutside();
    assert.equal(await page.evaluate(()=>window.__commands.length),commandsBefore,'outside dismissal does not also move the hero');

    await tapPad(3,true);assert.match(await page.locator('#sheetTitle').textContent(),/Build defense/,'empty spot stays open after touch and reservation');
    assert.equal(await page.evaluate(()=>window.__match.match.buildReservations[3]?.playerId),'alice');
    await page.locator('#radial0').focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#towerDetails').evaluate(el=>el.open),true,'keyboard activation is not swallowed as a compatibility click');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.getElementById('radialMenu').hidden);
    await page.waitForFunction(()=>!window.__match.match.buildReservations[3]);

    await tapPad(11,true);assert.match(await page.locator('#sheetTitle').textContent(),/Cannon/,'another player’s tower stays open');await closeOutside(true);
    // Pan with a physical drag, then select a previously off-screen spot.
    await page.mouse.move(200,400);await page.mouse.down();await page.mouse.move(80,400,{steps:8});await page.mouse.up();
    await page.evaluate(async()=>{const {panBattleViewport}=await import('./battle-viewport.mjs');const r=document.getElementById('game').getBoundingClientRect();window.__view=panBattleViewport(window.__view,-120*960/r.width,0);});
    await tapPad(5);assert.match(await page.locator('#sheetTitle').textContent(),/Build defense/,'pan retains correct touch projection');await closeOutside();
    await page.waitForFunction(()=>!window.__match.match.buildReservations[5]);
    await page.mouse.move(200,400);await page.mouse.wheel(0,-200);
    await page.evaluate(async()=>{const {zoomBattleViewport}=await import('./battle-viewport.mjs');const r=document.getElementById('game').getBoundingClientRect(),v=window.__view;window.__view=zoomBattleViewport(v,Math.exp(.3),{x:(200-r.left)*v.width/r.width,y:(400-r.top)*v.height/r.height});});
    await tapPad(4);assert.match(await page.locator('#sheetTitle').textContent(),/MG Nest/,'wheel zoom retains world coordinates');await closeOutside();

    // Return to overview, pinch with two actual touch points, and select again.
    await page.evaluate(()=>document.getElementById('mapZoom').click());await setView(false);
    const cdp=await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:125,y:420,id:1},{x:265,y:420,id:2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:90,y:420,id:1},{x:300,y:420,id:2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.evaluate(async()=>{const {zoomBattleViewport}=await import('./battle-viewport.mjs');const r=document.getElementById('game').getBoundingClientRect(),v=window.__view;window.__view=zoomBattleViewport(v,1.5,{x:(195-r.left)*v.width/r.width,y:(420-r.top)*v.height/r.height});});
    assert.equal(await page.locator('#radialMenu').isHidden(),true,'pinching is not interpreted as a tap');
    await tapPad(4,true);assert.match(await page.locator('#sheetTitle').textContent(),/MG Nest/,'pinch zoom retains world coordinates');await closeOutside();

    // Rotation changes the logical height but both orientations fill the
    // screen. Reset to overview before checking landscape coordinates.
    await page.setViewportSize({width:844,height:390});
    await page.waitForFunction(()=>{const c=document.getElementById('game'),r=c.getBoundingClientRect();return c.dataset.fullBattle==='true'&&Math.abs(r.width-844)<3&&Math.abs(r.height-390)<3;});
    await page.evaluate(()=>{const b=document.getElementById('mapZoom');if(b.getAttribute('aria-pressed')==='true')b.click();});await setView(false);
    await tapPad(4);assert.match(await page.locator('#sheetTitle').textContent(),/MG Nest/,'landscape still selects the correct tower');
    await page.evaluate(()=>document.getElementById('radialClose').click());
    await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>{const r=document.getElementById('game').getBoundingClientRect();return Math.abs(r.width-390)<3&&Math.abs(r.height-844)<3;});
    await page.evaluate(()=>{const b=document.getElementById('mapZoom');if(b.getAttribute('aria-pressed')==='false')b.click();});
    await setView(true);await tapPad(4,true);await page.evaluate(()=>document.getElementById('radialClose').click());

    // Leaving multiplayer must restore the non-fullscreen solo layout and its
    // input; the stub deliberately returns the same large map.
    await page.evaluate(async()=>{await window.__control.leaveCoop();document.getElementById('gameWorkspace').dataset.screen='endless';});
    await page.waitForFunction(()=>document.getElementById('game').dataset.fullBattle==='false');
    await page.locator('#game').scrollIntoViewIfNeeded();
    await page.evaluate(()=>{const b=document.getElementById('mapZoom');if(b.getAttribute('aria-pressed')==='true')b.click();});await setView(false);
    await tapPad(4);assert.match(await page.locator('#sheetTitle').textContent(),/Build defense/,'solo field still accepts tower input');
    // Classic maps omit width, height and explicit bunker fields. Their old
    // non-viewport scroll path must still receive finite quick-jump targets.
    const jumps=await page.evaluate(async()=>{
      document.getElementById('radialClose').click();window.__nextMap='road';
      if(!await window.__control.chooseEndless(null))throw Error('could not load classic solo map');
      const viewport=document.getElementById('mapViewport'),calls=[];viewport.scrollTo=options=>calls.push(options);
      document.getElementById('mapBunker').click();document.getElementById('mapEntry').click();
      return {map:window.__control.getMapId(),calls};
    });
    assert.equal(jumps.map,'road');assert.equal(jumps.calls.length,2);
    for(const call of jumps.calls)assert.ok(Number.isFinite(call.left)&&Number.isFinite(call.top),`classic jump: ${JSON.stringify(call)}`);
    assert.deepEqual(errors,[],'no browser errors');
    await context.close();
  }finally{await browser.close();}
  console.log('Multiplayer field mouse, touch, pinch, rotation and solo regressions passed.');
})().catch(error=>{console.error(error);process.exit(1);});
