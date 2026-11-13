// Chromium exercises real canvas geometry and input; the multiplayer transport
// is a local double and never contacts Firebase. Run from the repository root
// with the static server on port 8765.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
 try{
  for(const spec of [
   {mode:'coop',width:390,height:844,touch:true},
   {mode:'coop',width:1365,height:768,touch:false},
   {mode:'versus',width:390,height:844,touch:true},
   {mode:'versus',width:1365,height:768,touch:false},
   {mode:'versus',width:1365,height:768,touch:false,classic:true},
   {mode:'four-coop',width:1024,height:1366,touch:true},
   {mode:'two-vs-two',width:844,height:390,touch:true},
  ]){
   const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},deviceScaleFactor:1,hasTouch:spec.touch,reducedMotion:'reduce'});
   try{
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
     if(url.hostname!=='127.0.0.1')return route.abort();
     // Observe the real controller's world bounds without exposing a test API
     // in the shipped game. Its gestures, camera math and draw path stay real.
     if(url.pathname.endsWith('/battle-viewport-controller.mjs')&&!url.searchParams.has('instrumented'))return route.fulfill({contentType:'text/javascript',body:`import {createBattleViewportController as base} from './battle-viewport-controller.mjs?instrumented=1';export function createBattleViewportController(options){const controller=base({...options,onChange(view){window.__viewport={...view};options.onChange(view);}});window.__viewport=controller.getViewport();return controller;}`});
     if(url.pathname==='/IronPath/'){
      const response=await route.fetch();
      return route.fulfill({response,body:(await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')});
     }
     return route.continue();
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto('http://127.0.0.1:8765/IronPath/');
    const boot=await page.evaluate(async spec=>{
     const mode=spec.mode;
     for(const id of ['languageGate','introOverlay','loading','authView','entry'])document.getElementById(id)?.setAttribute('hidden','');
     document.getElementById('gameView').hidden=false;
     const workspace=document.getElementById('gameWorkspace');workspace.hidden=false;workspace.dataset.screen='online';
     const {startGame}=await import('./game.js'),{createPlayer,applyCommand}=await import('./match.mjs');
     const {createMatch}=await import('./simulation.mjs');
     const {createVersus,versusView,applyVersus}=await import('./versus.mjs');
     const {createFourCoop,createTwoVsTwo,applyFourCommand}=await import('./four-modes.mjs');
     const {bunkerStart}=await import('./solo-deployment.mjs');
     const ids=mode==='four-coop'?['alice','bob','cara']:mode==='two-vs-two'?['alice','bob','cara','dan']:['alice','bob'];
     const profile={name:'Alice',gender:'female',xp:750,armory:'',skills:''};
     const mapId=mode==='four-coop'?'g3-29e3779b1':mode==='two-vs-two'?'four-front':spec.classic?'road':'g3-19e3779b1';
     const players=ids.map((id,i)=>{const p=bunkerStart(mapId,i);return createPlayer(id,{...profile,name:id},p.x,p.y);});
     let match,apply,view;
     if(mode==='versus'){
      match=createVersus(players,mapId,'alice');apply=command=>applyVersus(match,'alice',command);view=()=>versusView(match,'alice');
     }else if(mode==='four-coop'||mode==='two-vs-two'){
      match=mode==='four-coop'?createFourCoop(players,'alice',mapId):createTwoVsTwo(players,'alice',[['alice','bob'],['cara','dan']],mapId);
      apply=command=>applyFourCommand(match,'alice',command);view=()=>match;
     }else{
      match=createMatch(players,mapId);match.hostId='alice';apply=command=>applyCommand(match,'alice',command);view=()=>match;
     }
     const built=apply({type:'build',pad:4,towerType:0});
     window.__commands=[];window.__mode=mode;window.__mapId=mapId;window.__player=mode==='coop'?{x:match.players.alice.x,y:match.players.alice.y}:null;window.__sectors=[];
     const account={getProfile:()=>profile,getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>3,onSessionChange(){},awardXP:async()=>{},recordScore(){},saveCampaign:async()=>{},getToken:async()=> 'test',sandbox:()=>false};
     window.__control=startGame(account,{experimentalFourViewport:true,nextMapId:(_previous,_random,sector)=>(window.__sectors.push(sector??1),mapId),deferTutorial:true,confirmAction:async()=>true});
     const started=window.__control.beginCoop(options=>({
      start(){options.onSnapshot({match:structuredClone(view())});options.onStatus(true);},stop(){},
      async command(command){window.__commands.push(command);const result=apply(command);options.onSnapshot({match:structuredClone(view())});return result;}
     }),()=>{},'test-party',mode);
     return {started,built,sector:window.__sectors.at(-1)};
    },spec);
    assert.ok(boot.started&&boot.built.ok,`${spec.mode}: test match booted`);
    assert.equal(boot.sector,['coop','versus'].includes(spec.mode)?2:1,`${spec.mode}: two-player modes request a larger generated field`);
    await page.waitForFunction(()=>document.getElementById('game').dataset.fullBattle==='true');
    await page.waitForFunction(()=>{const c=document.getElementById('game'),r=c.getBoundingClientRect(),p=document.getElementById('mapViewport');return Math.abs(r.width-p.clientWidth)<2&&Math.abs(r.height-p.clientHeight)<2&&c.width>0&&c.height>0;});
    const geometry=await page.evaluate(()=>{const c=document.getElementById('game'),r=c.getBoundingClientRect();return {width:r.width,height:r.height,bufferWidth:c.width,bufferHeight:c.height};});
    assert.ok(geometry.width>=spec.width-3&&geometry.height>=spec.height-3,`${spec.mode} ${spec.width}×${spec.height}: canvas fills screen ${JSON.stringify(geometry)}`);
    assert.ok(Math.abs(geometry.width/geometry.height-geometry.bufferWidth/geometry.bufferHeight)<.006,`${spec.mode}: map is not stretched`);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const corners=await page.evaluate(()=>{const c=document.getElementById('game'),ctx=c.getContext('2d');return [[4,4],[c.width-5,4],[4,c.height-5],[c.width-5,c.height-5]].map(([x,y])=>ctx.getImageData(x,y,1,1).data[3]);});
    assert.ok(corners.every(alpha=>alpha===255),`${spec.mode}: the filled view paints the map at all four edges (${corners})`);

    if(spec.mode==='coop'){
     // The first filled view follows the player's spawn, even when the bunker
     // is far from map centre. Select a nearby free pad before touching zoom.
     const nearSpawn=await page.evaluate(async()=>{
      const {getMap}=await import('./maps.mjs'),{createBattleViewport,zoomBattleViewport,panBattleViewport}=await import('./battle-viewport.mjs');
      const m=getMap(window.__mapId),r=document.getElementById('game').getBoundingClientRect(),height=Math.round(960*r.height/r.width),player=window.__player;
      let v=createBattleViewport(m.width,m.height,960,height);
      v=zoomBattleViewport(v,Math.max(v.width/v.worldWidth,v.height/v.worldHeight)/v.scale,{x:v.width/2,y:v.height/2});
      v=panBattleViewport(v,(v.x+v.width/(2*v.scale)-player.x)*v.scale,(v.y+v.height/(2*v.scale)-player.y)*v.scale);
      const p=m.pads[13];return {x:r.left+(p.x-v.x)*v.scale*r.width/v.width,y:r.top+(p.y-v.y)*v.scale*r.height/v.height};
     });
     assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,nearSpawn),'game','a pad near the soldier is visible on the opening camera');
     if(spec.touch)await page.touchscreen.tap(nearSpawn.x,nearSpawn.y);else await page.mouse.click(nearSpawn.x,nearSpawn.y);
     await page.waitForFunction(()=>!document.getElementById('radialMenu').hidden);
     assert.match(await page.locator('#sheetTitle').textContent(),/Build defense/,'opening camera maps the nearby pad correctly');
     await page.evaluate(()=>document.getElementById('radialClose').click());
     await page.waitForFunction(()=>window.__commands.some(c=>c.type==='releaseBuild'&&c.pad===13));
    }

    // The overview is a deterministic camera position. A real mouse/touch tap
    // on an existing tower must select it with the correct world coordinates.
    await page.evaluate(()=>{const button=document.getElementById('mapZoom');if(button.getAttribute('aria-pressed')==='true')button.click();});
    const point=await page.evaluate(async()=>{
     const {getMap}=await import('./maps.mjs'),{createBattleViewport}=await import('./battle-viewport.mjs');
     const map=getMap(window.__mapId),canvas=document.getElementById('game'),r=canvas.getBoundingClientRect();
     const worldWidth=map.width||960,laneHeight=map.height||540,worldHeight=window.__mode==='versus'?laneHeight*2+20:laneHeight;
     const v=createBattleViewport(worldWidth,worldHeight,960,Math.round(960*r.height/r.width));
     const project=p=>({x:r.left+(p.x-v.x)*v.scale*r.width/v.width,y:r.top+(p.y-v.y)*v.scale*r.height/v.height});
     return {own:project(map.pads[4]),rival:project({x:map.pads[4].x,y:map.pads[4].y+laneHeight+20})};
    });
    const ownTarget=await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,point.own);
    assert.equal(ownTarget,'game',`${spec.mode}: test tower is visible, not covered (${JSON.stringify(point.own)}, ${ownTarget})`);
    if(spec.touch)await page.touchscreen.tap(point.own.x,point.own.y);else await page.mouse.click(point.own.x,point.own.y);
    await page.waitForFunction(()=>!document.getElementById('radialMenu').hidden);
    assert.match(await page.locator('#sheetTitle').textContent(),/MG Nest/,`${spec.mode}: correct tower selected`);
    await page.evaluate(()=>document.getElementById('radialClose').click());

    if(spec.mode==='versus'){
     const count=await page.evaluate(()=>window.__commands.length);
     assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,point.rival),'game','rival lane is visible');
     if(spec.touch)await page.touchscreen.tap(point.rival.x,point.rival.y);else await page.mouse.click(point.rival.x,point.rival.y);
     await page.waitForFunction(()=>document.getElementById('message').textContent.includes('opponent'));
     assert.equal(await page.evaluate(()=>window.__commands.length),count,'tapping the opponent lane sends no command');
     assert.equal(await page.locator('#radialMenu').isHidden(),true);
    }
    if(!spec.touch&&['coop','versus'].includes(spec.mode)){
     // Test the target, not just the absence of exceptions: after zooming in,
     // each real button must center on the generated (or classic) coordinate,
     // clamped at the world edges. The rival lane never changes the target.
     await page.locator('#fieldOps > summary').click();
     await page.locator('#mapZoom').click();
     for(const [id,key] of [['mapBunker','bunker'],['mapEntry','entry']]){
      await page.locator(`#${id}`).click();
      const result=await page.evaluate(async key=>{
       const {getMap}=await import('./maps.mjs'),map=getMap(window.__mapId),v=window.__viewport;
       const target=key==='bunker'?(map.bunker||{x:900,y:400}):map.path[0],w=v.width/v.scale,h=v.height/v.scale;
       const axis=(t,size,world)=>size>=world?(world-size)/2:Math.max(0,Math.min(world-size,t-size/2));
       return {x:v.x,y:v.y,expectedX:axis(target.x,w,v.worldWidth),expectedY:axis(target.y,h,v.worldHeight),target,worldWidth:v.worldWidth,worldHeight:v.worldHeight};
      },key);
      assert.ok(Math.abs(result.x-result.expectedX)<0.01&&Math.abs(result.y-result.expectedY)<0.01,`${spec.mode} ${spec.classic?'classic':'large'} ${key}: ${JSON.stringify(result)}`);
     }
    }
    if(spec.mode==='coop'&&!spec.touch){
     // The existing settings button invokes the real Fullscreen API from a
     // user gesture. The field keeps its viewport after entering and exiting.
     await page.evaluate(async()=>{const {setupFullscreen}=await import('./fullscreen.mjs');window.__full=setupFullscreen({document,button:document.getElementById('fullscreenToggle'),status:document.getElementById('fullscreenStatus')});document.getElementById('settingsDialog').showModal();});
     assert.equal(await page.locator('#fullscreenToggle').isVisible(),true,'browser Fullscreen API is available');
     await page.locator('#fullscreenToggle').click();await page.waitForFunction(()=>!!document.fullscreenElement);
     await page.locator('#fullscreenToggle').click();await page.waitForFunction(()=>!document.fullscreenElement);
     await page.evaluate(()=>{document.getElementById('settingsDialog').close();window.__full.destroy();});
     await page.waitForFunction(()=>document.getElementById('game').dataset.fullBattle==='true');
    }
    assert.deepEqual(errors,[],`${spec.mode}: no page errors`);
    console.log(`${spec.mode}: ${spec.width}×${spec.height} full field and input passed`);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
