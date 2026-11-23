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
    // Pretend the language was already chosen: the first-run gate is tested on its own.
    await context.addInitScript(() => { try { localStorage.setItem('ironpath:language', 'en'); } catch {} });
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
      // A popup belongs in the middle. The reference box is the containing
      // block the browser really uses: the viewport for `fixed`, the nearest
      // positioned ancestor for `absolute` - so a popup centred over the
      // battlefield and one centred over the page are both measured fairly.
      const centredPopup = async (selector) => {
        const measured = await page.evaluate(sel => {
          const el = document.querySelector(sel), box = el.getBoundingClientRect(), style = getComputedStyle(el);
          const host = style.position === 'fixed' ? { x: 0, y: 0, width: innerWidth, height: innerHeight }
            : (el.offsetParent || document.body).getBoundingClientRect();
          return { box, dx: (box.x + box.width / 2) - (host.x + host.width / 2), dy: (box.y + box.height / 2) - (host.y + host.height / 2) };
        }, selector);
        assert.ok(measured.box.width > 0 && measured.box.height > 0, `${name}: ${selector} is visible`);
        assert.ok(Math.abs(measured.dx) <= 2 && Math.abs(measured.dy) <= 2,
          `${name}: ${selector} is centred, not parked in a corner (off by ${Math.round(measured.dx)}/${Math.round(measured.dy)})`);
        assert.ok(measured.box.x >= -1 && measured.box.x + measured.box.width <= width + 1, `${name}: ${selector} stays inside the width`);
      };
      await check('#authForm'); await check('#authSubmit'); await check('#adminLoginLink'); await check('#authLanguageToggle');
      const authImgOk = await page.locator('#authSceneImg').evaluate(img => img.complete && img.naturalWidth > 0);
      assert.equal(authImgOk, true, `${name}: #authSceneImg rotating banner loads cleanly`);
      assert.equal(await page.locator('#adminLoginLink').getAttribute('href'), 'admin.html', `${name}: admin link points to admin.html`);
      const authLayout=await page.evaluate(()=>{
        const header=document.querySelector('main > header')?.getBoundingClientRect();
        const scene=document.querySelector('#authView .dossier-scene')?.getBoundingClientRect();
        const form=document.querySelector('#authView .dossier-form')?.getBoundingClientRect();
        const card=document.querySelector('#authView')?.getBoundingClientRect();
        return {headerTop:header?.top??-1,sceneBottom:scene?.bottom??0,formTop:form?.top??0,formWidthRatio:(form?.width??0)/Math.max(1,card?.width??1)};
      });
      assert.ok(authLayout.headerTop>=0,`${name}: IRON PATH header is not clipped above the viewport (${Math.round(authLayout.headerTop)})`);
      assert.ok(authLayout.sceneBottom<=authLayout.formTop+2,`${name}: #authView stacks hero scene cleanly above single-column form`);
      assert.ok(authLayout.formWidthRatio>=0.75,`${name}: #authView form spans single column cleanly (${Math.round(authLayout.formWidthRatio*100)}%)`);
      await page.screenshot({ path: `browser-artifacts/${name}-signin.png`, fullPage: true });
      await page.evaluate(() => {
        document.querySelector('#entry').hidden = true; document.querySelector('#gameView').hidden = false;
        document.querySelector('#menuName').textContent = 'Field Commander'; document.querySelector('#menuLevel').textContent = 'LEVEL 12';
        document.querySelector('#menuXp').textContent = '340 / 900 XP';
      });
      await check('#menuMultiplayer'); await check('#menuCampaign');
      const commandCardFit=await page.evaluate(()=>{
        const card=document.getElementById('menuSoldier').getBoundingClientRect();
        const portrait=document.getElementById('menuPortrait').getBoundingClientRect();
        const xpBox=document.querySelector('#menuSoldier .command-soldier-xp').getBoundingClientRect();
        const xp=document.getElementById('menuXp').getBoundingClientRect();
        const recall=document.getElementById('guideRecall'),wasRecallHidden=recall.hidden;
        recall.hidden=false;
        const rr=recall.getBoundingClientRect(),ur=document.querySelector('.command-utilities').getBoundingClientRect();
        const overlapsUtils=!(rr.right<=ur.left||rr.left>=ur.right||rr.bottom<=ur.top||rr.top>=ur.bottom);
        recall.hidden=wasRecallHidden;
        return {
          xpRight:xp.right,cardRight:card.right,
          xpTop:xpBox.top,portraitBottom:portrait.bottom,
          xpWidth:xpBox.width,cardWidth:card.width,
          overlapsUtils
        };
      });
      assert.ok(commandCardFit.xpRight<=commandCardFit.cardRight+1,`${name}: #menuXp stays inside #menuSoldier (${Math.round(commandCardFit.xpRight)} <= ${Math.round(commandCardFit.cardRight)})`);
      assert.ok(commandCardFit.xpTop>=commandCardFit.portraitBottom-2,`${name}: EXP bar sits below soldier portrait (${Math.round(commandCardFit.xpTop)} >= ${Math.round(commandCardFit.portraitBottom)})`);
      assert.ok(commandCardFit.xpWidth>=commandCardFit.cardWidth-40,`${name}: EXP bar spans the bottom of #menuSoldier (${Math.round(commandCardFit.xpWidth)} / ${Math.round(commandCardFit.cardWidth)})`);
      assert.equal(commandCardFit.overlapsUtils,false,`${name}: #guideRecall (SHOW TASK) does not overlap .command-utilities`);
      for(const actionId of ['menuArmory','menuSkills','menuFriends','menuLeaderboard']){
        const btn=page.locator('#'+actionId);
        const snap=()=>btn.evaluate(el=>{const s=getComputedStyle(el);const icon=el.querySelector('.action-card-icon').getBoundingClientRect();return {image:s.backgroundImage,size:s.backgroundSize,position:s.backgroundPosition,repeat:s.backgroundRepeat,iconW:icon.width,iconH:icon.height};});
        const normal=await snap();
        assert.match(normal.image,/url\(/,`${name}: #${actionId} renders painted game artwork`);
        assert.ok(normal.iconW>=14&&normal.iconH>=14,`${name}: #${actionId} renders vector emblem (${normal.iconW}x${normal.iconH})`);
        await btn.hover();
        const hovered=await snap();
        assert.deepEqual(hovered,normal,`${name}: #${actionId} artwork crop must not shift on hover`);
      }
      await page.mouse.move(0,0);
      const resultsPlacement=await page.evaluate(()=>{
        const res=document.getElementById('menuResults'),wasHidden=res.hidden;
        const resume=document.getElementById('menuResume'),wasResumeHidden=resume.hidden;
        res.hidden=false;
        const modesOnly=document.querySelector('.mode-grid').getBoundingClientRect(),r1=res.getBoundingClientRect();
        resume.hidden=false;
        const modesWithResume=document.querySelector('.mode-grid').getBoundingClientRect(),r2=res.getBoundingClientRect(),resBox=resume.getBoundingClientRect();
        res.hidden=wasHidden;resume.hidden=wasResumeHidden;
        return {
          modeBottom1:modesOnly.bottom,resultsTop1:r1.top,resultsHeight:r1.height,
          resumeBottom:resBox.bottom,modeTop2:modesWithResume.top,modeBottom2:modesWithResume.bottom,resultsTop2:r2.top
        };
      });
      assert.ok(resultsPlacement.resultsHeight>=40,`${name}: #menuResults is laid out when shown`);
      assert.ok(resultsPlacement.resultsTop1>=resultsPlacement.modeBottom1-1,`${name}: #menuResults sits below .mode-grid without #menuResume (${Math.round(resultsPlacement.resultsTop1)} < ${Math.round(resultsPlacement.modeBottom1)})`);
      assert.ok(resultsPlacement.resumeBottom<=resultsPlacement.modeTop2+1,`${name}: #menuResume stays above .mode-grid (${Math.round(resultsPlacement.resumeBottom)} > ${Math.round(resultsPlacement.modeTop2)})`);
      assert.ok(resultsPlacement.resultsTop2>=resultsPlacement.modeBottom2-1,`${name}: #menuResults stays below .mode-grid when #menuResume is shown (${Math.round(resultsPlacement.resultsTop2)} < ${Math.round(resultsPlacement.modeBottom2)})`);
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
      await page.evaluate(()=>{document.querySelector('#socialPopupTitle').textContent='PARTY INVITATION';document.querySelector('#socialPopupBody').textContent='A very long soldier name invited you to a party.';document.querySelector('#socialPopup').hidden=false;});await check('#socialPopup');await check('#socialPopupOpen');await check('#socialPopupDismiss');await centredPopup('#socialPopup');await page.screenshot({path:`browser-artifacts/${name}-social-popup.png`});await page.evaluate(()=>document.querySelector('#socialPopup').hidden=true);
      // The new-build notice carries RETRY CHECK and DISMISS, so it is an
      // interruption and belongs in the middle - it sat in the top-right corner
      // on the strength of its name alone. Measured like any other popup.
      await page.evaluate(()=>{document.querySelector('#versionNoticeText').textContent='New version 20261123-endless1 loaded.';document.querySelector('#versionNotice').hidden=false;});
      await centredPopup('#versionNotice');await check('#versionNoticeDismiss');
      const noticeLayout=await page.evaluate(()=>{
        const box=document.querySelector('#versionNotice'),text=document.querySelector('#versionNoticeText'),
          dismiss=document.querySelector('#versionNoticeDismiss'),art=document.querySelector('#versionNotice .version-notice-art img');
        const b=box.getBoundingClientRect(),t=text.getBoundingClientRect(),d=dismiss.getBoundingClientRect(),a=art.getBoundingClientRect();
        return {
          scrollWidth:box.scrollWidth,clientWidth:box.clientWidth,
          textWidth:t.width,textBottom:t.bottom,dismissTop:d.top,dismissRight:d.right,boxRight:b.right,
          artComplete:art.complete,artNaturalWidth:art.naturalWidth,artWidth:a.width,artHeight:a.height
        };
      });
      assert.ok(noticeLayout.scrollWidth<=noticeLayout.clientWidth+1,`${name}: version notice must not overflow horizontally (${noticeLayout.scrollWidth} > ${noticeLayout.clientWidth})`);
      assert.ok(noticeLayout.textWidth>=180,`${name}: version notice text keeps readable width (${noticeLayout.textWidth})`);
      assert.ok(noticeLayout.textBottom<=noticeLayout.dismissTop+1,`${name}: version notice text sits above dismiss button`);
      assert.ok(noticeLayout.dismissRight<=noticeLayout.boxRight+1,`${name}: dismiss button stays inside version notice`);
      assert.ok(noticeLayout.artComplete&&noticeLayout.artNaturalWidth>0&&noticeLayout.artWidth>=200&&noticeLayout.artHeight>=80,`${name}: version notice artwork loads cleanly`);
      await page.screenshot({path:`browser-artifacts/${name}-version-notice.png`,fullPage:false});
      await page.evaluate(()=>document.querySelector('#versionNotice').hidden=true);
      await page.screenshot({ path: `browser-artifacts/${name}-command.png`, fullPage: true });
      await page.evaluate(() => {
        document.querySelector('#commandCenter').hidden = true; document.querySelector('#gameWorkspace').hidden = false;
        document.querySelector('#fourPartyPanel').hidden = false;
      });
      await check('#fourPartyCodeInput'); await check('#fourPartyJoin'); await check('#fourPartyCreate');
      await page.evaluate(()=>{document.querySelector('#runPerkPanel').hidden=false;document.querySelector('#runPerk0').textContent='Defenses';document.querySelector('#runPerk1').textContent='Supplies';document.querySelector('#runPerk2').textContent='Repair';});await check('#runPerkPanel');await check('#runPerkClose');const centered=await page.locator('#runPerkPanel').evaluate(el=>{const p=el.getBoundingClientRect(),m=el.parentElement.getBoundingClientRect();return {x:(p.left+p.right-m.left-m.right)/2,y:(p.top+p.bottom-m.top-m.bottom)/2};});assert.ok(Math.abs(centered.x)<2&&Math.abs(centered.y)<2,`${name}: field upgrade popup is centered`);await page.screenshot({path:`browser-artifacts/${name}-field-upgrade.png`});await page.evaluate(()=>document.querySelector('#runPerkPanel').hidden=true);

      await page.evaluate(()=>{document.querySelector('#fourPartyPanel').hidden=true;document.querySelector('#speedRequest').hidden=false;document.querySelector('#speedRequestText').textContent='A long soldier name requests 2× for wave 12. 1/3 approved.';});await check('#speedRequest');await check('#speedApprove');await check('#speedDecline');await centredPopup('#speedRequest');await page.evaluate(()=>{document.querySelector('#speedRequest').hidden=true;document.querySelector('#fourPartyPanel').hidden=false;});
      await page.screenshot({ path: `browser-artifacts/${name}-lobby.png`, fullPage: true });
      // Inspect the actual battlefield layout independently of Firebase.
      await page.evaluate(()=>{document.querySelector('#fourPartyPanel').hidden=true;document.querySelector('#gameWorkspace').dataset.screen='endless';});
      // The tower ring: four round buttons around the pad that was tapped, each with a
      // picture and a name, all of them inside the viewport, and the pad itself NOT
      // covered - the whole point is that the finger stays where it is.
      await page.evaluate(()=>{
        const menu=document.getElementById('radialMenu');
        const pad=document.getElementById('game').getBoundingClientRect();
        menu.querySelectorAll('.sheet-option').forEach((button,index)=>{
          button.hidden=false;button.disabled=false;
          const name=document.getElementById('menuName'+index);
          if(name)name.textContent=['MG Nest','Cannon','Flak','Sniper'][index];
          // As game.js renders them: the price under the name, and the one ring
          // position the wallet cannot cover flagged unaffordable.
          const price=document.getElementById('menuPrice'+index);
          if(price)price.textContent=['50','80','65','75'][index];
          button.classList.toggle('unaffordable',index===1);
        });
        // Centre of the field, as game.js would place it for a pad there.
        menu.style.left=Math.round(pad.left+pad.width/2)+'px';
        menu.style.top=Math.round(pad.top+pad.height/2)+'px';
        // Build mode is what game.js sets for an empty pad; the sprites hang off it.
        menu.dataset.mode='build';
        menu.style.setProperty('--ring-radius','96px');
        menu.style.setProperty('--ring-size','78px');
        menu.hidden=false;
      });
      const ring=await page.evaluate(()=>{
        const menu=document.getElementById('radialMenu');
        const buttons=[...menu.querySelectorAll('.sheet-option')].map(button=>{
          const box=button.getBoundingClientRect();
          const style=getComputedStyle(button);
          const priceStyle=button.querySelector('.sheet-price')?getComputedStyle(button.querySelector('.sheet-price')):null;
          return {x:box.x,y:box.y,w:box.width,h:box.height,radius:style.borderRadius,
            art:getComputedStyle(button.querySelector('.sheet-art')).backgroundImage,
            artOpacity:getComputedStyle(button.querySelector('.sheet-art')).opacity,
            desc:getComputedStyle(button.querySelector('.sheet-description')).display,
            price:button.querySelector('.sheet-price')?.textContent??'',
            priceColor:priceStyle?priceStyle.color:'',
            unaffordable:button.classList.contains('unaffordable'),
            name:button.querySelector('.sheet-name').textContent};
        });
        const centre={x:parseFloat(menu.style.left),y:parseFloat(menu.style.top)};
        return {buttons,centre};
      });
      const centreX=ring.centre.x,centreY=ring.centre.y;
      ring.buttons.forEach((button,index)=>{
        assert.ok(button.w>=44&&button.h>=44,`${name}: ring button ${index} is a touch target (${Math.round(button.w)}x${Math.round(button.h)})`);
        assert.match(button.radius,/50%|\d+px/,`${name}: ring button ${index} is round`);
        assert.match(button.art,/url\(/,`${name}: ring button ${index} shows a picture`);
        assert.equal(button.desc,'none',`${name}: ring button ${index} shows a name, not a paragraph`);
        assert.ok(/^\d+$/.test(button.price),`${name}: ring button ${index} shows its price (${button.price})`);
        assert.ok(button.name.length>0,`${name}: ring button ${index} is labelled`);
        assert.ok(button.x>=-1&&button.x+button.w<=width+1,`${name}: ring button ${index} stays inside the width`);
        assert.ok(button.y>=-1&&button.y+button.h<=height+1,`${name}: ring button ${index} stays inside the height`);
        const dx=button.x+button.w/2-centreX,dy=button.y+button.h/2-centreY;
        assert.ok(Math.hypot(dx,dy)>40,`${name}: ring button ${index} is really OFFSET from the pad, not on it`);
      });
      // The afford signal: the unaffordable option must differ from an affordable
      // one in more than a shade of green - different price colour, dimmed art.
      // Reported: "Circle Upgrade menu shows all upgrade options. We need some
      // indication of I can build the tower or not."
      assert.equal(ring.buttons[1].unaffordable,true,`${name}: the unaffordable flag is on the ring`);
      assert.notEqual(ring.buttons[1].priceColor,ring.buttons[0].priceColor,`${name}: the unaffordable price reads differently`);
      assert.ok(parseFloat(ring.buttons[1].artOpacity)<parseFloat(ring.buttons[0].artOpacity),`${name}: the unaffordable art is dimmed`);
      // Nothing overlaps the pad marker itself: the gap in the middle is the point.
      const coversCentre=ring.buttons.some(button=>centreX>=button.x&&centreX<=button.x+button.w&&centreY>=button.y&&centreY<=button.y+button.h);
      assert.equal(coversCentre,false,`${name}: the pad in the middle stays visible and tappable`);
      await page.screenshot({path:`browser-artifacts/${name}-tower-ring.png`,fullPage:false});
      // Confirm-sale mode must paint real SVG icons and legible German labels on both ring discs.
      await page.evaluate(()=>{
        const menu=document.getElementById('radialMenu');
        menu.dataset.mode='actions';
        const defs=[
          {icon:'confirmSell',name:'Verkauf bestätigen',price:'+60'},
          {icon:'cancel',name:'Abbrechen',price:''},
        ];
        menu.querySelectorAll('.sheet-option').forEach((button,index)=>{
          const def=defs[index];
          button.hidden=!def;button.disabled=!def;
          button.classList.remove('unaffordable','locked');
          if(def)button.dataset.icon=def.icon;else delete button.dataset.icon;
          const nameEl=document.getElementById('menuName'+index);
          if(nameEl)nameEl.textContent=def?def.name:'';
          const priceEl=document.getElementById('menuPrice'+index);
          if(priceEl)priceEl.textContent=def?def.price:'';
          const artEl=document.getElementById('menuArt'+index);
          if(artEl)artEl.replaceChildren();
        });
      });
      const confirmSellRing=await page.evaluate(()=>[0,1].map(index=>{
        const button=document.getElementById('radial'+index);
        const art=button.querySelector('.sheet-art');
        const box=button.getBoundingClientRect();
        const artBox=art.getBoundingClientRect();
        const btnStyle=getComputedStyle(button);
        const artStyle=getComputedStyle(art);
        return {
          icon:button.dataset.icon||'',
          w:box.width,h:box.height,
          scrollH:button.scrollHeight,clientH:button.clientHeight,
          artW:artBox.width,artH:artBox.height,
          artImage:artStyle.backgroundImage,
          bg:btnStyle.backgroundImage||btnStyle.backgroundColor,
          border:btnStyle.borderTopColor,
          price:document.getElementById('menuPrice'+index)?.textContent??'',
          name:document.getElementById('menuName'+index)?.textContent??'',
        };
      }));
      assert.equal(confirmSellRing[0].icon,'confirmSell',`${name}: confirmSell button carries data-icon`);
      assert.equal(confirmSellRing[1].icon,'cancel',`${name}: cancel button carries data-icon`);
      assert.match(confirmSellRing[0].artImage,/icon-confirm-sell\.svg/,`${name}: confirmSell paints icon-confirm-sell.svg`);
      assert.match(confirmSellRing[1].artImage,/icon-cancel\.svg/,`${name}: cancel paints icon-cancel.svg`);
      assert.ok(confirmSellRing[0].artW>=24&&confirmSellRing[0].artH>=24,`${name}: confirmSell art has visible size`);
      assert.ok(confirmSellRing[1].artW>=24&&confirmSellRing[1].artH>=24,`${name}: cancel art has visible size`);
      assert.equal(confirmSellRing[0].price,'+60',`${name}: confirmSell shows refund amount`);
      assert.ok(confirmSellRing[0].scrollH<=confirmSellRing[0].clientH+1,`${name}: German confirmSell label + refund fits inside ring disc (${confirmSellRing[0].scrollH}/${confirmSellRing[0].clientH})`);
      assert.notEqual(confirmSellRing[0].bg,confirmSellRing[1].bg,`${name}: confirmSell and cancel buttons read as distinct surfaces`);
      assert.notEqual(confirmSellRing[0].border,confirmSellRing[1].border,`${name}: confirmSell border stands out from cancel`);
      await page.screenshot({path:`browser-artifacts/${name}-confirm-sell-ring.png`,fullPage:false});
      await page.evaluate(()=>{
        const menu=document.getElementById('radialMenu');
        menu.querySelectorAll('.sheet-option').forEach(button=>{delete button.dataset.icon;button.hidden=false;button.disabled=false;});
        menu.hidden=true;
      });
      await check('#mapViewport');await check('.dashboard');await check('#start');await check('#speed');await check('#ability');await check('#endRun');
      // The radio line is no longer painted: what the game says is spoken into a
      // live region for a screen reader and is not on the field at all. A box
      // that cannot be seen cannot cover the battlefield, which is the point.
      const spoken=await page.evaluate(()=>{const el=document.getElementById('message');const box=el.getBoundingClientRect();
        return {live:el.getAttribute('aria-live'),width:box.width,height:box.height};});
      assert.equal(spoken.live,'polite',`${name}: the spoken line is still a live region`);
      assert.ok(spoken.width<=2&&spoken.height<=2,`${name}: and it is not painted over the field (${JSON.stringify(spoken)})`);
      // The ability HUD moved out of the command strip onto the field. It has to
      // be a real touch target, it has to be reachable at the right edge, and it
      // must not fall off the screen - all three measured, not assumed.
      const ability=await page.locator('#ability').boundingBox();
      assert.ok(ability.width>=44&&ability.height>=44,`${name}: the ability HUD is a touch target (${Math.round(ability.width)}x${Math.round(ability.height)})`);
      assert.ok(ability.x+ability.width<=width+1&&ability.x>=-1,`${name}: the ability HUD stays inside the width`);
      assert.ok(ability.y>=-1&&ability.y+ability.height<=height+1,`${name}: the ability HUD stays inside the height`);
      assert.ok(ability.x+ability.width>width/2,`${name}: the ability HUD sits on the right half of the field`);
      // Low in the frame, where a thumb rests - the first version was centred
      // vertically and landed in the middle of the fighting.
      assert.ok(ability.y+ability.height/2>height*0.55,`${name}: the ability HUD sits low, not in the middle of the battlefield`);
      assert.ok(ability.width<=width*0.65,`${name}: the ability HUD is a button, not a bar across the field (${Math.round(ability.width)}px of ${width})`);
      // And it must not sit ON the control row. It was first built inside the
      // command panel - a positioned box at the bottom - so `absolute` measured
      // from there and the HUD landed on DEPLOY / START WAVE. Chromium refused
      // the click: a disabled button still answers the hit test. Two guards:
      // the boxes must not overlap, and the deploy button must really be on top.
      const startBox=await page.locator('#start').boundingBox();
      const overlaps=!(ability.x+ability.width<=startBox.x||startBox.x+startBox.width<=ability.x||ability.y+ability.height<=startBox.y||startBox.y+startBox.height<=ability.y);
      assert.equal(overlaps,false,`${name}: the ability HUD keeps its hands off the deploy button`);
      const reached=await page.evaluate(()=>{
        const centre=selector=>{const b=document.querySelector(selector).getBoundingClientRect();return {x:Math.round(b.left+b.width/2),y:Math.round(b.top+b.height/2)};};
        const hit=(x,y)=>{const e=document.elementFromPoint(x,y);return e?{id:e.id||e.className,inside:e.closest?!!e.closest('#ability'):false}:null;};
        const start=centre('#start'),hud=centre('#ability'),startHit=hit(start.x,start.y),hudHit=hit(hud.x,hud.y);
        return {start:startHit,hud:hudHit};
      });
      assert.equal(reached.start.id,'start',`${name}: the deploy button is reachable, not covered (hit ${reached.start.id})`);
      assert.equal(reached.hud.inside,true,`${name}: the ability HUD is reachable itself (hit ${reached.hud.id})`);
      // What the field no longer shows. Three things were taken out on the
      // operator's word, and a browser is the only place that can prove they
      // are really gone from the page - not just hidden by a rule.
      const removed=await page.evaluate(()=>({
        flag:document.querySelectorAll('.wave-info').length,
        xp:document.querySelectorAll('#levelXpBox,#levelXpBar,#levelXpText,#levelXpLeft').length,
        radio:document.querySelectorAll('#battleFoot,.radio-toggle,.radio-log').length}));
      assert.equal(removed.flag,0,`${name}: the wave flag and its next-wave popover are gone (${JSON.stringify(removed)})`);
      assert.equal(removed.xp,0,`${name}: the XP bar and the "still missing" line are gone from the status row`);
      assert.equal(removed.radio,0,`${name}: the radio handset and its log are gone`);
      // The status row keeps the level itself - one number, not a character sheet.
      assert.equal(await page.locator('#level').isVisible(),true,`${name}: the soldier's level is still there`);
      // The one message that is left: it flutters in UNDER the status row, it
      // is a card and not a banner, and a tap anywhere on it reaches the field
      // beneath. Measured, because a message over the battlefield is a wall
      // unless it is proven not to be.
      const statusRow=await page.locator('.dashboard').boundingBox();
      await page.evaluate(()=>{
        document.querySelector('#fieldNotice').hidden=false;
        document.querySelector('#fieldNoticeText').textContent='Thin ice broke! Tanks slow down and take more damage.';
        document.querySelector('#fieldNoticeMore').hidden=false;
        document.querySelector('#fieldNoticeMore').textContent='+2 more';
      });
      const notice=await page.locator('#fieldNotice').boundingBox();
      assert.ok(notice&&notice.height>0,`${name}: the notice shows on the field (${JSON.stringify(notice)})`);
      assert.ok(notice.y>=statusRow.y+statusRow.height-1,`${name}: it hangs under the status row, not over it (notice ${JSON.stringify(notice)} vs row ${JSON.stringify(statusRow)})`);
      assert.ok(notice.y+notice.height<height*0.35,`${name}: and high enough to be out of the fighting`);
      assert.ok(notice.x>=-1&&notice.x+notice.width<=width+1,`${name}: it stays inside the width (${JSON.stringify(notice)})`);
      // A card, not a banner: a banner grows with the field, a card stops at a
      // readable line - and on a narrow field it keeps a margin on both sides
      // instead of spanning the whole width edge to edge.
      assert.ok(notice.width<=341,`${name}: it is a card of a fixed width, not a banner across the field (${Math.round(notice.width)}px)`);
      assert.ok(notice.x>=7&&notice.x+notice.width<=width-7,`${name}: and it keeps a margin on both sides (${JSON.stringify(notice)})`);
      // Centred on the field it hangs over - not on the window, which the frame
      // does not fill exactly on every layout.
      const frameBox=await page.locator('.map-frame').boundingBox();
      assert.ok(Math.abs((notice.x+notice.width/2)-(frameBox.x+frameBox.width/2))<=2,`${name}: and it is centred under the row, so it reads as one line (notice ${JSON.stringify(notice)} vs frame ${JSON.stringify(frameBox)})`);
      const throughNotice=await page.evaluate(()=>{
        const card=document.querySelector('#fieldNotice').getBoundingClientRect();
        const points=[[4,0.5],[0.5,0.5],[card.width-4,0.5]].map(([rx,ry])=>[Math.round(card.left+card.width*rx),Math.round(card.top+card.height*ry)]);
        return points.map(([x,y])=>{const hit=document.elementFromPoint(x,y);return {x,y,inside:!!(hit&&hit.closest('#fieldNotice')),at:hit?`${hit.tagName}#${hit.id||''}`:'nothing'};});
      });
      for(const probe of throughNotice)
        assert.equal(probe.inside,false,`${name}: a tap through the notice reaches the field, not the message (hit ${probe.at} at ${probe.x},${probe.y})`);
      assert.equal(await page.locator('#fieldNotice button').count(),0,`${name}: and there is no dismiss button on it`);
      await page.evaluate(()=>{document.querySelector('#fieldNotice').hidden=true;document.querySelector('#fieldNoticeMore').hidden=true;});
      // The field menu moved out of the top-right corner into the command strip,
      // between SPEED and END RUN where the other controls are. Written out on
      // a desktop; where the strip is tight it is the three-line burger.
      const menuBox=await page.locator('#fieldOps > summary').boundingBox();
      const speedBox=await page.locator('#speed').boundingBox();
      const endBox=await page.locator('#endRun').boundingBox();
      assert.ok(menuBox.x>=speedBox.x+speedBox.width-1,`${name}: the menu sits after SPEED (menu ${JSON.stringify(menuBox)} vs speed ${JSON.stringify(speedBox)})`);
      assert.ok(menuBox.x+menuBox.width<=endBox.x+1,`${name}: and before END RUN (menu ${JSON.stringify(menuBox)} vs end ${JSON.stringify(endBox)})`);
      assert.ok(menuBox.height>=44&&menuBox.width>=44,`${name}: it is a touch target, not a dot (${Math.round(menuBox.width)}x${Math.round(menuBox.height)})`);
      assert.ok(Math.abs((menuBox.y+menuBox.height/2)-(speedBox.y+speedBox.height/2))<=2,`${name}: on the same row as the other controls`);
      const menuShape=await page.evaluate(()=>{
        const label=document.querySelector('#fieldOps .field-ops-label'),burger=document.querySelector('#fieldOps .field-ops-burger');
        return {label:getComputedStyle(label).display,burger:getComputedStyle(burger).display,bars:burger.querySelectorAll('i').length};
      });
      // 320 and 390 are the phone widths this harness runs; 1440 is the desktop.
      if(width<=430){
        assert.equal(menuShape.label,'none',`${name}: a tight strip shows no words`);
        assert.equal(menuShape.burger,'flex',`${name}: it shows the burger instead (${JSON.stringify(menuShape)})`);
      }else{
        assert.equal(menuShape.burger,'none',`${name}: a roomy strip needs no burger`);
        assert.notEqual(menuShape.label,'none',`${name}: it says MENU (${JSON.stringify(menuShape)})`);
      }
      assert.equal(menuShape.bars,3,`${name}: the burger is three lines, not two or four`);
      // Opened, the panel grows UPWARD out of the strip and stays in the frame:
      // a panel that opens downwards is a panel behind the player's own thumb.
      await page.locator('#fieldOps > summary').click();
      const panel=await page.locator('.field-ops-panel').boundingBox();
      assert.ok(panel&&panel.height>0,`${name}: the field menu opens (${JSON.stringify(panel)})`);
      assert.ok(panel.y+panel.height<=menuBox.y+1,`${name}: it opens upward, clear of the strip (panel ${JSON.stringify(panel)} vs menu ${JSON.stringify(menuBox)})`);
      assert.ok(panel.y>=-1&&panel.x>=-1&&panel.x+panel.width<=width+1,`${name}: and stays inside the frame (${JSON.stringify(panel)})`);
      // ONE FAMILY. DEPLOY, SPEED, the MENU burger and END RUN share a frame and
      // a row. The burger used to be styled beside the buttons: square corners
      // where the buttons are rounded, and a box that stopped short of the row,
      // so it sat higher than its neighbours.
      const strip=await page.evaluate(()=>{
        const parts=[...['start','speed','endRun'].map(id=>document.getElementById(id)),document.querySelector('#fieldOps > summary')];
        return parts.map(el=>{
          const box=el.getBoundingClientRect(),style=getComputedStyle(el);
          return {id:el.id||'menu',top:box.top,bottom:box.bottom,left:box.left,right:box.right,
            radius:style.borderRadius,frame:style.borderTopWidth+' '+style.borderTopStyle,
            type:style.fontFamily,size:style.fontSize,weight:style.fontWeight};
        });
      });
      for(const part of strip.slice(1)){
        assert.equal(part.radius,strip[0].radius,`${name}: ${part.id} has the same corner as #start (${part.radius} vs ${strip[0].radius})`);
        assert.equal(part.frame,strip[0].frame,`${name}: ${part.id} has the same frame (${part.frame} vs ${strip[0].frame})`);
        assert.equal(part.type,strip[0].type,`${name}: ${part.id} uses the same typeface`);
        assert.equal(part.size,strip[0].size,`${name}: ${part.id} uses the same type size (${part.size} vs ${strip[0].size})`);
        assert.equal(part.weight,strip[0].weight,`${name}: ${part.id} uses the same type weight`);
        assert.ok(Math.abs(part.top-strip[0].top)<=1,`${name}: ${part.id} starts on the same line (${Math.round(part.top)} vs ${Math.round(strip[0].top)})`);
        assert.ok(Math.abs(part.bottom-strip[0].bottom)<=1,`${name}: ${part.id} ends on the same line (${Math.round(part.bottom)} vs ${Math.round(strip[0].bottom)})`);
      }
      const ordered=[...strip].sort((a,b)=>a.left-b.left);
      for(let i=1;i<ordered.length;i++)
        assert.ok(ordered[i].left>=ordered[i-1].right-1,`${name}: ${ordered[i].id} does not sit on ${ordered[i-1].id} (${Math.round(ordered[i].left)} < ${Math.round(ordered[i-1].right)})`);
      // THE RIGHT RIM, ONE COLUMN. "Fit map", the field-upgrade reminder and the
      // ability button used to be positioned independently and met each other on
      // a phone. The zoom button only shows for a coarse pointer, so it is forced
      // visible here - this is what a touch player sees.
      // The ability glows gold while it is ready - that is a STATE, not a second
      // frame. It is measured neutral here, and the glow is checked afterwards.
      // Buttons transition their colours over 150 ms, so the reading waits: right
      // after the attribute change the computed value is still the old one.
      await page.evaluate(()=>{
        const zoom=document.getElementById('mapQuickZoom'),perk=document.getElementById('runPerkReopen'),ability=document.getElementById('ability');
        zoom.style.display='block';perk.hidden=false;ability.hidden=false;
        window.__abilityState=ability.dataset.state;ability.dataset.state='cooldown';
      });
      await page.waitForTimeout(300);
      const rim=await page.evaluate(()=>{
        const zoom=document.getElementById('mapQuickZoom'),perk=document.getElementById('runPerkReopen'),ability=document.getElementById('ability');
        const column=document.getElementById('fieldControls'),command=document.querySelector('#gameView .map-frame .command');
        const read=el=>{const box=el.getBoundingClientRect(),style=getComputedStyle(el);
          return {id:el.id,top:box.top,bottom:box.bottom,left:box.left,right:box.right,
            radius:style.borderRadius,frame:style.borderTopWidth+' '+style.borderTopStyle,plate:style.backgroundColor};};
        const columnBox=column.getBoundingClientRect(),commandBox=command.getBoundingClientRect();
        const parts=[perk,zoom,ability].map(read);
        return {parts,neutral:parts[2].plate,
          column:{top:columnBox.top,bottom:columnBox.bottom,left:columnBox.left,right:columnBox.right},
          command:{top:commandBox.top}};
      });
      // The plate is measured with the ability NOT glowing: three buttons, one
      // look. Before this they were three guesses - the zoom button was a stamped
      // gradient bar (the iron rule in interface-redesign.css outranked it) next
      // to the ability's dark plate.
      for(const part of rim.parts){
        assert.equal(part.radius,rim.parts[0].radius,`${name}: ${part.id} has the same corner as the other field buttons (${part.radius} vs ${rim.parts[0].radius})`);
        assert.equal(part.frame,rim.parts[0].frame,`${name}: ${part.id} has the same frame (${part.frame} vs ${rim.parts[0].frame})`);
        assert.equal(part.plate,rim.neutral,`${name}: ${part.id} has the same plate (${part.plate} vs ${rim.neutral})`);
        assert.ok(Math.abs(part.right-rim.parts[0].right)<=1,`${name}: ${part.id} ends on the same rim (${Math.round(part.right)} vs ${Math.round(rim.parts[0].right)})`);
      }
      for(let i=1;i<rim.parts.length;i++)
        assert.ok(rim.parts[i].top>=rim.parts[i-1].bottom-1,`${name}: ${rim.parts[i].id} does not sit on ${rim.parts[i-1].id} (${Math.round(rim.parts[i].top)} < ${Math.round(rim.parts[i-1].bottom)})`);
      assert.ok(rim.column.right<=width+1&&rim.column.left>=-1,`${name}: the column stays inside the width (${JSON.stringify(rim.column)})`);
      assert.ok(rim.column.bottom<=rim.command.top+1,`${name}: and above the command strip, not across it (column bottom ${Math.round(rim.column.bottom)} vs strip top ${Math.round(rim.command.top)})`);
      // Restored, the glow is back: the same button, one state lighter.
      await page.evaluate(()=>{
        document.getElementById('mapQuickZoom').style.display='';
        document.getElementById('runPerkReopen').hidden=true;
        document.getElementById('ability').dataset.state=window.__abilityState;
      });
      await page.waitForTimeout(300);
      const glow=await page.evaluate(()=>getComputedStyle(document.getElementById('ability')).backgroundColor);
      assert.notEqual(glow,rim.neutral,`${name}: the ready ability still glows - a state, not a second frame (${glow})`);
      // THE MAP ANNOUNCES ITSELF ONCE. A title card, centred, with the field
      // drawn in the game's own art - and then it goes away.
      await page.evaluate(()=>{
        const card=document.getElementById('mapIntro');
        card.hidden=false;
        document.getElementById('mapIntroLabel').textContent='FREE PLAY';
        document.getElementById('mapName').textContent='The Last Road';
      });
      await centredPopup('#mapIntro');
      const title=await page.evaluate(()=>{
        const card=document.getElementById('mapIntro'),style=getComputedStyle(card),box=card.getBoundingClientRect();
        const art=document.getElementById('mapIntroArt').getBoundingClientRect();
        const points=[[0.5,0.5],[4,0.5],[box.width-4,0.5]].map(([rx,ry])=>[Math.round(box.left+box.width*rx),Math.round(box.top+box.height*ry)]);
        return {pointer:style.pointerEvents,buttons:card.querySelectorAll('button').length,
          art:{width:art.width,height:art.height},
          taps:points.map(([x,y])=>{const hit=document.elementFromPoint(x,y);return {x,y,inside:!!(hit&&hit.closest('#mapIntro')),at:hit?`${hit.tagName}#${hit.id||''}`:'nothing'};})};
      });
      assert.equal(title.pointer,'none',`${name}: the title takes no taps`);
      assert.equal(title.buttons,0,`${name}: and it has no button to dismiss`);
      assert.ok(title.art.width>40&&title.art.height>20,`${name}: it carries the battlefield artwork (${Math.round(title.art.width)}x${Math.round(title.art.height)})`);
      for(const tap of title.taps)
        assert.equal(tap.inside,false,`${name}: a tap through the title reaches the field, not the title (hit ${tap.at} at ${tap.x},${tap.y})`);
      // And the corner no longer repeats it: the map name is said once, then never.
      const corner=await page.evaluate(()=>{
        const head=document.querySelector('.battle-head');
        return {visible:!!head&&head.checkVisibility(),names:document.querySelectorAll('#gameView #mapName').length};
      });
      assert.equal(corner.visible,false,`${name}: the corner plate is gone from the field`);
      assert.equal(corner.names,1,`${name}: the map name exists once, on the title (${corner.names})`);
      await page.evaluate(()=>{document.getElementById('mapIntro').hidden=true;});
      await page.locator('#fieldOps > summary').click();
      // Two more popups live on the field itself: a wave vote and a mission
      // decision with choices. Both interrupt, so both take the middle - the
      // same place the request centre and the field-upgrade card already use.
      await page.evaluate(()=>{
        document.querySelector('#waveRequest').hidden=false;
        document.querySelector('#waveRequestText').textContent='A long soldier name requests wave 12. 1 approval still needed.';
        document.querySelector('#storyDecision').hidden=false;
        document.querySelector('#storyDecisionSpeaker').textContent='Mara Voss / FIELD DECISION';
        document.querySelector('#storyDecisionText').textContent='The convoy can take the valley road or the ridge. Choose before the next wave.';
        document.querySelector('#storyChoice0').textContent='VALLEY ROAD';
        document.querySelector('#storyChoice1').textContent='RIDGE';
      });
      await centredPopup('#waveRequest');await centredPopup('#storyDecision');
      await check('#storyChoice0');await check('#storyChoice1');
      await page.screenshot({path:`browser-artifacts/${name}-field-popups.png`,fullPage:false});
      await page.evaluate(()=>{document.querySelector('#waveRequest').hidden=true;document.querySelector('#storyDecision').hidden=true;});
      const hud=await page.evaluate(()=>{const b=document.querySelector('#game').getBoundingClientRect(),d=document.querySelector('.dashboard').getBoundingClientRect(),c=document.querySelector('.command').getBoundingClientRect();return {b:{top:b.top,bottom:b.bottom,left:b.left,right:b.right},d:{top:d.top,bottom:d.bottom,left:d.left,right:d.right},c:{top:c.top,bottom:c.bottom,left:c.left,right:c.right}};});
      assert.ok(hud.d.top>=0 && hud.d.top<height/4,`${name}: HUD overlays the top of the battlefield`);
      // All five status chips (wave, bunker, supplies, enemies, soldier) have to
      // FIT, not merely exist: the dashboard sizes itself to its content and the
      // phone media query only shrinks the padding. A chip that overflows would
      // push the row past the wave-info flag or off the screen.
      const chips=await page.evaluate(()=>{
        const board=document.querySelector('.dashboard');
        const chipBoxes=[...board.children].map(chip=>{
          const box=chip.getBoundingClientRect();
          return {left:box.left,right:box.right,text:chip.textContent.trim().replace(/\s+/g,' ')};
        });
        return {scroll:board.scrollWidth,client:board.clientWidth,boxes:chipBoxes};
      });
      assert.ok(chips.scroll<=chips.client+1,`${name}: the status row does not overflow (${chips.scroll} > ${chips.client})`);
      for(const chip of chips.boxes){
        assert.ok(chip.right<=width+1,`${name}: status chip '${chip.text}' stays on screen (right ${Math.round(chip.right)} > ${width})`);
        assert.ok(chip.left>=-1,`${name}: status chip '${chip.text}' starts on screen`);
      }
      assert.equal(chips.boxes.length,5,`${name}: five status chips, one per readout`);
      const mapView=await page.locator('#mapViewport').boundingBox();assert.ok(mapView.height>=height-2,`${name}: battlefield fills the viewport`);await check('#fieldOps > summary');
      assert.ok(hud.c.left>=-1 && hud.c.right<=width+1,`${name}: controls stay inside viewport`);
      await page.screenshot({path:`browser-artifacts/${name}-field-command.png`,fullPage:true});
      // The training field (the first run) is a different frame: it owns the viewport,
      // the page behind it must not scroll, and the contract card must sit BELOW the
      // status dashboard instead of on top of it. Scripts are blocked here, so this
      // also proves the pre-measurement fallback offset is already correct.
      await page.evaluate(()=>{
        const workspace=document.querySelector('#gameWorkspace');
        workspace.dataset.screen='training';
        const objective=document.querySelector('#soloObjective');
        objective.hidden=false;
        document.querySelector('#soloObjectiveTitle').textContent='TRAINING CONTRACT · HANSA';
        document.querySelector('#soloObjectiveHint').textContent='Wave 1 of 5 · hold the line, the boss comes with the last wave.';
        document.querySelector('#soloObjectiveProgress').textContent='0 / 5';
      });
      // No language flag on the field at all any more. Both permanent switches are
      // gone - language and fullscreen are settings now, reached from the menu - so the
      // corner that used to hold them belongs to the battlefield. This replaces the old
      // "exactly one of the two flags" check: the answer is now zero.
      const flags=await page.evaluate(()=>({
        global:!!document.querySelector('.language-picker')?.checkVisibility?.(),
        field:!!document.querySelector('.field-language-flag')?.checkVisibility?.(),
        corner:!!document.querySelector('#fullscreenToggle')?.checkVisibility?.(),
      }));
      assert.deepEqual(flags,{global:false,field:false,corner:false},`${name}: nothing from Settings floats over the field (${JSON.stringify(flags)})`);
      const settingsOnly=await page.evaluate(()=>({
        selects:document.querySelectorAll('#languageSelect').length,
        toggles:document.querySelectorAll('#languageToggle, #authLanguageToggle').length,
        inSettings:!!document.querySelector('#settingsDialog #languageToggle'),
        inAuth:!!document.querySelector('#authView #authLanguageToggle'),
      }));
      assert.deepEqual(settingsOnly,{selects:0,toggles:2,inSettings:true,inAuth:true},`${name}: language toggles live only inside Sign-In and Settings`);
      const training=await page.evaluate(()=>{
        const battle=document.querySelector('.battle').getBoundingClientRect();
        const card=document.querySelector('#soloObjective').getBoundingClientRect();
        const dashboard=document.querySelector('#gameView .map-frame .dashboard').getBoundingClientRect();
        const doc=document.documentElement;
        return {battle:{top:battle.top,height:battle.height},card:{top:card.top,bottom:card.bottom,left:card.left,right:card.right},dashboard:{bottom:dashboard.bottom},scrollable:doc.scrollHeight-window.innerHeight};
      });
      assert.ok(training.battle.height>=height-2,`${name}: the training field fills the viewport (${Math.round(training.battle.height)} of ${height})`);
      assert.ok(training.scrollable<=2,`${name}: the page behind the training field does not scroll (${training.scrollable}px)`);
      // The contract is a row of the frame now, so it sits ABOVE the field rather than
      // below the status row. What matters is that it covers nothing: not the status
      // row, not the battlefield, and it stays inside the width.
      const covers=await page.evaluate(()=>{
        const card=document.getElementById('soloObjective').getBoundingClientRect();
        const dashboard=document.querySelector('#gameView .map-frame .dashboard').getBoundingClientRect();
        const canvas=document.getElementById('game').getBoundingClientRect();
        const overlaps=(a,b)=>Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1;
        return {dashboard:overlaps(card,dashboard),canvas:overlaps(card,canvas)};
      });
      assert.equal(covers.dashboard,false,`${name}: the contract card does not cover the status row`);
      assert.equal(covers.canvas,false,`${name}: the contract card does not cover the battlefield`);
      assert.ok(training.card.right<=width+1,`${name}: the contract card stays inside the field`);
      assert.ok(training.card.bottom-training.card.top<height*.25,
        `${name}: the contract row stays a row (${Math.round(training.card.bottom-training.card.top)} of ${height})`);
      await page.screenshot({path:`browser-artifacts/${name}-training-field.png`,fullPage:false});
      // The coach card is a bottom strip that must not be dragged by a scroll.
      await page.evaluate(()=>{
        const card=document.querySelector('#firstRunCoach');
        card.hidden=false;
        document.querySelector('#coachTitle').textContent='Welcome, soldier';
        document.querySelector('#coachText').textContent='Tap a build marker to place your first tower.';
        window.scrollBy(0,600);
      });
      const before=await page.locator('#firstRunCoach').boundingBox();
      await page.evaluate(()=>window.scrollBy(0,600));
      const after=await page.locator('#firstRunCoach').boundingBox();
      assert.ok(before&&after,`${name}: the coach card is laid out`);
      assert.ok(Math.abs(after.y-before.y)<1,`${name}: the coach card does not move when the page scrolls (${Math.round(before.y)} -> ${Math.round(after.y)})`);
      assert.ok(before.y+before.height<=height+1,`${name}: the coach card sits above the action bar`);
      await page.screenshot({path:`browser-artifacts/${name}-training-coach.png`,fullPage:false});
      // An open field menu must cover the contract card, not be covered by it.
      await page.evaluate(()=>{
        document.querySelector('#firstRunCoach').hidden=true;
        document.querySelector('#soloObjective').hidden=false;
        document.querySelector('#fieldOps').open=true;
      });
      await page.waitForTimeout(50);
      const menuOnTop=await page.evaluate(()=>{
        const menu=document.querySelector('.field-ops-panel'),card=document.getElementById('soloObjective');
        const box=menu.getBoundingClientRect();
        const hit=document.elementFromPoint(Math.round(box.left+box.width/2),Math.round(box.top+30));
        return {onTop:!!hit&&(menu===hit||menu.contains(hit)),hit:hit?hit.id||hit.className:null,
          cardOver:card.getBoundingClientRect().top<box.bottom};
      });
      assert.equal(menuOnTop.onTop,true,`${name}: the open field menu is on top of the contract card (hit ${menuOnTop.hit})`);
      await page.screenshot({path:`browser-artifacts/${name}-training-menu.png`,fullPage:false});
      await page.evaluate(()=>{document.querySelector('#fieldOps').open=false;});
      await page.evaluate(()=>{
        document.querySelector('#firstRunCoach').hidden=true;
        document.querySelector('#soloObjective').hidden=true;
        document.querySelector('#gameWorkspace').dataset.screen='endless';
      });
      await page.evaluate(()=>document.querySelector('#fourPartyPanel').hidden=false);
      for (const [id, control] of [['settingsDialog', '#settingsRestoreDefaults'], ['afkRestDialog', '#afkRestAccept'], ['endlessLaunch', '#endlessDeploy'], ['skillDialog', '#skillSave'], ['armoryDialog', '#armoryClose'], ['runResults', '#resultsDone'], ['gameConfirm', '#gameConfirmAccept'], ['tutorialDossier', '#dossierAccept'], ['tutorialDialog', '#tutorialNext'], ['friendsDialog', '#friendsClose'], ['friendStatsDialog', '#friendStatsClose'], ['leaderboardDialog', '#leaderboardClose']]) {
        if(id==='tutorialDossier')await page.evaluate(()=>{
          document.getElementById('dossierClose').hidden=true;
          document.getElementById('dossierKicker').textContent='KOMMANDOZENTRALE · EINSATZAUFTRAG';
          document.getElementById('dossierTitle').textContent="Einsatz-Dossier von General Vance";
          document.getElementById('dossierLead').textContent='Rekrut, tritt an den Taktiktisch. Dich erwarten sieben geführte Ausbildungswellen samt anschließender Kommando-Tour durch die neue Zentrale.';
          document.getElementById('dossierRewardNote').textContent='Der erfolgreiche Erstabschluss bringt bis zu 450 EP (sofort einsetzbares Rüstungs- & Skillbudget).';
          document.getElementById('dossierRadioStatus').textContent='TON AUS';
          document.getElementById('dossierRadioReplay').textContent='Funk wiederholen';
          document.getElementById('dossierRadioMute').textContent='Stumm';
          document.getElementById('dossierRadioSubtitle').textContent='General Vance: Rekrut, das ist mein Gefechtsstand. Ich leite dich durch sieben kurze Gefechtswellen bis zum Konvoi-Boss und danach durch die Kommandozentrale. Bereit für den Einsatz?';
          document.getElementById('dossierRadioSubtitle').hidden=false;
          document.getElementById('dossierAccept').textContent='AUFTRAG ANNEHMEN';
          document.getElementById('dossierDecline').textContent='VORERST ABLEHNEN';
        });
        await page.evaluate(id => document.getElementById(id).showModal(), id);
        // The armory now opens on its item list; its workshop tab is checked separately.
        if(id==='armoryDialog')await page.evaluate(()=>document.querySelectorAll('#armoryList .armory-section').forEach(section=>{section.hidden=section.dataset.section!=='equipment';}));
        await check(`#${id}`); await check(control);
        if(id==='tutorialDossier'){
          const dossierImgs=await page.evaluate(()=>{
            const d=document.getElementById('tutorialDossier');
            const banner=d.querySelector('.dossier-banner').getBoundingClientRect();
            const body=d.querySelector('.dossier-body');
            const bodyRect=body.getBoundingClientRect();
            const actions=d.querySelector('.dossier-actions').getBoundingClientRect();
            const sub=document.getElementById('dossierRadioSubtitle');
            const replay=document.getElementById('dossierRadioReplay').getBoundingClientRect();
            const mute=document.getElementById('dossierRadioMute').getBoundingClientRect();
            const p=document.getElementById('dossierPortrait'),m=document.getElementById('dossierMapArt');
            const mapRect=m.getBoundingClientRect();
            return {
              overflow:d.scrollWidth>d.clientWidth+1,
              dialogScrollTop:d.scrollTop,
              bodyScrollTop:body.scrollTop,
              bannerTop:banner.top,
              bannerBottom:banner.bottom,
              actionsBottom:actions.bottom,
              vh:innerHeight,
              subScrollH:sub.scrollHeight,
              subClientH:sub.clientHeight,
              controlsOverlap:!(replay.right<=mute.left+1||mute.right<=replay.left+1||replay.bottom<=mute.top+1||mute.bottom<=replay.top+1),
              mapW:mapRect.width,
              bodyW:bodyRect.width,
              portrait:p.complete&&p.naturalWidth>0,
              map:m.complete&&m.naturalWidth>0
            };
          });
          assert.equal(dossierImgs.overflow,false,`${name}: #tutorialDossier fits without horizontal overflow`);
          assert.equal(dossierImgs.dialogScrollTop,0,`${name}: #tutorialDossier opens scrolled to top`);
          assert.equal(dossierImgs.bodyScrollTop,0,`${name}: #tutorialDossier .dossier-body opens scrolled to top`);
          assert.ok(dossierImgs.bannerTop>=-1&&dossierImgs.bannerBottom>dossierImgs.bannerTop,`${name}: #tutorialDossier banner stays pinned at top`);
          assert.ok(dossierImgs.actionsBottom<=dossierImgs.vh+1,`${name}: #tutorialDossier footer actions stay pinned inside viewport (${Math.round(dossierImgs.actionsBottom)} <= ${dossierImgs.vh})`);
          assert.ok(dossierImgs.subScrollH<=dossierImgs.subClientH+2,`${name}: #dossierRadioSubtitle is fully visible without internal clipping (${dossierImgs.subScrollH} vs ${dossierImgs.subClientH})`);
          assert.equal(dossierImgs.controlsOverlap,false,`${name}: #dossierRadioReplay and #dossierRadioMute do not collide`);
          if(width<=600)assert.ok(dossierImgs.mapW>=dossierImgs.bodyW-48,`${name}: #dossierMapArt stretches full width on narrow phone (${Math.round(dossierImgs.mapW)} vs ${Math.round(dossierImgs.bodyW)})`);
          assert.equal(dossierImgs.portrait&&dossierImgs.map,true,`${name}: #tutorialDossier portrait and map artworks load cleanly`);
        }
        if(id==='afkRestDialog'){const img=await page.locator('#afkRestArt').evaluate(e=>e.complete&&e.naturalWidth>0);assert.equal(img,true,`${name}: #afkRestArt artwork loads cleanly`);}
        if(id==='endlessLaunch'){
          await check('#endlessPrev'); await check('#endlessNext'); await check('#endlessThemeCard');
          const carouselLayout=await page.evaluate(()=>{
            const deploy=document.getElementById('endlessDeploy').getBoundingClientRect();
            const card=document.getElementById('endlessThemeCard');
            const label=document.getElementById('endlessSelectedTheme');
            const prev=document.getElementById('endlessPrev').getBoundingClientRect();
            const next=document.getElementById('endlessNext').getBoundingClientRect();
            const prevIcon=document.querySelector('#endlessPrev svg.endless-arrow-icon')?.getBoundingClientRect();
            const nextIcon=document.querySelector('#endlessNext svg.endless-arrow-icon')?.getBoundingClientRect();
            const heights=[];
            const origTheme=card.dataset.theme,origText=label.textContent;
            for(const [theme,text] of [['random','Random battlefield'],['scrub','Scorched Scrubland'],['forest','Dense Temperate Forest'],['urban','Urban Ruin & Industrial Complex'],['arctic','Arktische Tundra & Eissee'],['marsh','Tiefe Sumpfgebiete']]) {
              card.dataset.theme=theme; label.textContent=text;
              heights.push(card.getBoundingClientRect().height);
            }
            card.dataset.theme=origTheme; label.textContent=origText;
            const r=card.getBoundingClientRect();
            const inside=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
            return {card:r,deploy,prev,next,cancelPresent:!!document.getElementById('endlessCancel'),art:getComputedStyle(card).backgroundImage,heights,prevIconWidth:prevIcon?.width??0,nextIconWidth:nextIcon?.width??0,dialogWidth:document.getElementById('endlessLaunch').getBoundingClientRect().width,
              deployInside:inside(deploy,r),prevInside:inside(prev,r),nextInside:inside(next,r),
              deployCentered:Math.abs((deploy.left+deploy.right)/2-(r.left+r.right)/2)<4,
              deployLow:deploy.top>=r.top+r.height*0.6,prevHugsLeft:prev.left<=r.left+r.width*0.25,nextHugsRight:next.right>=r.right-r.width*0.25,
              labelInside:inside(label.getBoundingClientRect(),r),labelAtTop:label.getBoundingClientRect().top<=r.top+r.height*0.4,labelAboveDeploy:label.getBoundingClientRect().bottom<=deploy.top};
          });
          assert.equal(carouselLayout.cancelPresent,false,`${name}: endless launcher has no cancel button any more`);
          assert.ok(carouselLayout.card.height>160,`${name}: endless stage shows one large battlefield artwork (${Math.round(carouselLayout.card.height)}px)`);
          assert.ok(carouselLayout.deployInside,`${name}: #endlessDeploy sits inside #endlessThemeCard`);
          assert.ok(carouselLayout.deployCentered&&carouselLayout.deployLow,`${name}: #endlessDeploy is centred on the lower part of the artwork`);
          assert.ok(carouselLayout.labelInside&&carouselLayout.labelAtTop&&carouselLayout.labelAboveDeploy,`${name}: battlefield name holds the top of the artwork and never meets DEPLOY`);
          assert.ok(carouselLayout.prevInside&&carouselLayout.nextInside,`${name}: endless arrows sit inside the artwork`);
          assert.ok(carouselLayout.prevHugsLeft&&carouselLayout.nextHugsRight,`${name}: endless arrows hug the artwork edges`);
          assert.match(carouselLayout.art,/endless-random/,`${name}: #endlessThemeCard opens on Random artwork`);
          assert.ok(carouselLayout.prevIconWidth>=12&&carouselLayout.nextIconWidth>=12,`${name}: #endlessPrev and #endlessNext render custom vector arrows`);
          const minH=Math.min(...carouselLayout.heights),maxH=Math.max(...carouselLayout.heights);
          assert.ok(maxH-minH<=1,`${name}: Endless terrain cards stay identical height across all 6 themes (${minH.toFixed(1)}..${maxH.toFixed(1)})`);
        }
        if(id==='settingsDialog'){
          const langControl=await page.evaluate(()=>{
            const btn=document.getElementById('languageToggle');
            const b=btn.getBoundingClientRect(),style=getComputedStyle(btn);
            const code=btn.querySelector('.login-lang-code')?.textContent?.trim();
            const flag=btn.querySelector('.login-lang-flag');
            return {width:b.width,height:b.height,opacity:style.opacity,code,flagBg:flag?getComputedStyle(flag).backgroundImage:''};
          });
          assert.equal(langControl.opacity,'1',`${name}: #languageToggle is visible in Settings`);
          assert.ok(langControl.width>=60&&langControl.height>=36,`${name}: #languageToggle has tappable size (${Math.round(langControl.width)}x${Math.round(langControl.height)})`);
          assert.equal(langControl.code,'EN',`${name}: #languageToggle shows EN code`);
          assert.match(langControl.flagBg,/flag-gb/,`${name}: #languageToggle shows flag icon`);
        }
        if(id==='friendsDialog'||id==='leaderboardDialog'){
          const layout=await page.locator(control).evaluate(el=>{const r=el.getBoundingClientRect(),h=el.parentElement.getBoundingClientRect(),style=getComputedStyle(el);return {leftGap:r.left-h.left,topGap:r.top-h.top,textAlign:style.textAlign,width:r.width,height:r.height};});
          assert.ok(Math.abs(layout.leftGap)<2&&Math.abs(layout.topGap)<2,`${name}: ${control} anchors top-left of its header (leftGap=${layout.leftGap}, topGap=${layout.topGap})`);assert.equal(layout.textAlign,'center');assert.ok(layout.width>=44&&layout.height>=44);
          const deGap=await page.locator(control).evaluate(el=>{
            const label=el.querySelector('span'),prev=label?label.textContent:null;
            if(label)label.textContent='← KOMMANDOZENTRALE';
            const r=el.getBoundingClientRect(),h=el.parentElement.getBoundingClientRect();
            if(label&&prev!==null)label.textContent=prev;
            return {leftGap:r.left-h.left,fits:r.right<=h.right+1};
          });
          assert.ok(Math.abs(deGap.leftGap)<2&&deGap.fits,`${name}: ${control} keeps top-left alignment in German (← KOMMANDOZENTRALE, leftGap=${deGap.leftGap})`);
        }
        await page.screenshot({ path: `browser-artifacts/${name}-${id}.png` });
        await page.evaluate(id => document.getElementById(id).close(), id);
      }
      await page.evaluate(()=>{
        const tour=document.getElementById('menuTour');
        document.getElementById('menuTourStep').textContent='HQ TOUR · 1 / 8';
        document.getElementById('menuTourCaption').textContent='COMMAND HQ';
        document.getElementById('menuTourTitle').textContent='Soldier Dossier & Profile';
        document.getElementById('menuTourText').textContent='Open your Dossier to review soldier XP, rank insignia, service record, and safe avatar styling.';
        document.getElementById('menuTourDetail').textContent='Account deletion & sign-out stay protected outside the tour.';
        document.getElementById('menuTourRadioStatus').textContent='AUDIO READY';
        document.getElementById('menuTourRadioReplay').textContent='Funk wiederholen';
        document.getElementById('menuTourRadioMute').textContent='Stumm';
        document.getElementById('menuTourRadioSubtitle').textContent='General Vance: Willkommen in der Kommandozentrale. Lass uns jede Station sicher überprüfen, bevor du loslegst.';
        document.getElementById('menuTourRadioSubtitle').hidden=false;
        tour.hidden=false;
        tour.showPopover?.();
      });
      await check('#menuTour'); await check('#menuTourNext');
      const tourMetrics=await page.evaluate(()=>{
        const tour=document.getElementById('menuTour'),art=document.getElementById('menuTourArt');
        const head=tour.querySelector('.menu-tour-head').getBoundingClientRect();
        const actions=tour.querySelector('.menu-tour-actions').getBoundingClientRect();
        const sub=document.getElementById('menuTourRadioSubtitle');
        return {
          overflow:tour.scrollWidth>tour.clientWidth+1,
          headTop:head.top,
          actionsBottom:actions.bottom,
          tourBottom:tour.getBoundingClientRect().bottom,
          subScrollH:sub.scrollHeight,
          subClientH:sub.clientHeight,
          art:art.complete&&art.naturalWidth>0
        };
      });
      assert.equal(tourMetrics.overflow,false,`${name}: #menuTour fits without horizontal overflow`);
      assert.ok(tourMetrics.headTop>=0&&tourMetrics.actionsBottom<=tourMetrics.tourBottom+2,`${name}: #menuTour pins header & footer actions`);
      assert.ok(tourMetrics.subScrollH<=tourMetrics.subClientH+2,`${name}: #menuTourRadioSubtitle renders unclipped`);
      assert.equal(tourMetrics.art,true,`${name}: #menuTourArt artwork loads cleanly`);
      await page.screenshot({ path: `browser-artifacts/${name}-menu-tour.png` });
      await page.evaluate(()=>{
        const tour=document.getElementById('menuTour');
        tour.hidePopover?.();
        tour.hidden=true;
      });
      if(width<860){
        const fieldSchoolHidden=await page.evaluate(()=>{
          const fs=document.getElementById('fieldSchool'),was=fs.hidden;
          fs.hidden=false;
          const display=getComputedStyle(fs).display;
          fs.hidden=was;
          return display;
        });
        assert.equal(fieldSchoolHidden,'none',`${name}: mobile HQ keeps #fieldSchool hidden beneath the 4 bottom thumb actions`);
        const guideDialogCheck=await page.evaluate(()=>{
          const dlg=document.getElementById('skillDialog'),guide=document.getElementById('firstRunGuide'),recall=document.getElementById('guideRecall'),cancel=document.getElementById('skillCancel');
          const gText=document.getElementById('guideText'),rSub=document.getElementById('guideRadioSubtitle'),minBtn=document.getElementById('guideMinimize'),muteBtn=document.getElementById('guideRadioMute');
          document.getElementById('guideStep').textContent='2 / 3 · FÄHIGKEITEN';
          document.getElementById('guideTitle').textContent='Klasse wählen und Punkt vergeben';
          gText.textContent='Wähle zuerst eine Soldatenklasse, wähle dann unten eine Fähigkeit für Stufe 1 aus und speichere.';
          rSub.textContent=gText.textContent;rSub.hidden=false;
          dlg.showModal();
          dlg.appendChild(guide);
          guide.hidden=false;
          guide.showPopover?.();
          const gb=guide.getBoundingClientRect(),cb=cancel.getBoundingClientRect(),mb=minBtn.getBoundingClientRect(),mub=muteBtn.getBoundingClientRect(),subDisplay=getComputedStyle(rSub).display;
          const overlapsCancel=!(gb.right<=cb.left||gb.left>=cb.right||gb.bottom<=cb.top||gb.top>=cb.bottom);
          guide.hidePopover?.();guide.hidden=true;
          dlg.appendChild(recall);recall.hidden=false;recall.showPopover?.();
          const rb=recall.getBoundingClientRect();
          const recallOverlapsCancel=!(rb.right<=cb.left||rb.left>=cb.right||rb.bottom<=cb.top||rb.top>=cb.bottom);
          recall.hidePopover?.();recall.hidden=true;
          document.body.appendChild(guide);document.body.appendChild(recall);
          dlg.close();
          return {overlapsCancel,guideH:gb.height,minW:mb.width,muteW:mub.width,subDisplay,recallOverlapsCancel};
        });
        assert.equal(guideDialogCheck.overlapsCancel,false,`${name}: #firstRunGuide never covers #skillCancel`);
        assert.ok(guideDialogCheck.guideH<=230,`${name}: mobile #firstRunGuide stays compact (${Math.round(guideDialogCheck.guideH)}px)`);
        assert.equal(guideDialogCheck.subDisplay,'none',`${name}: mobile #firstRunGuide hides duplicate subtitle`);
        assert.ok(guideDialogCheck.minW>=44&&guideDialogCheck.muteW>=44,`${name}: #guideMinimize and #guideRadioMute keep full tap width`);
        assert.equal(guideDialogCheck.recallOverlapsCancel,false,`${name}: minimized #guideRecall sits opposite #skillCancel without overlap`);
      }
      if(width>=860){
        const opWidths=await page.evaluate(()=>{
          const ws=document.getElementById('gameWorkspace');
          const camp=document.getElementById('campaignPanel');
          const party=document.getElementById('fourPartyPanel');
          const endless=document.getElementById('endlessLaunch');
          const prevScreen=ws.dataset.screen,prevWsHidden=ws.hidden,prevBoard=camp.dataset.boardOpen,prevCampHidden=camp.hidden,prevPartyHidden=party.hidden;
          ws.hidden=false;ws.dataset.screen='campaign';camp.hidden=false;camp.dataset.boardOpen='true';
          const cw=camp.getBoundingClientRect().width;
          ws.dataset.screen='lobby';party.hidden=false;
          const pw=party.getBoundingClientRect().width;
          endless.showModal();
          const ew=endless.getBoundingClientRect().width;
          endless.close();
          ws.hidden=prevWsHidden;ws.dataset.screen=prevScreen;camp.dataset.boardOpen=prevBoard;camp.hidden=prevCampHidden;party.hidden=prevPartyHidden;
          return {cw,pw,ew};
        });
        assert.ok(Math.abs(opWidths.cw-opWidths.ew)<=2&&Math.abs(opWidths.pw-opWidths.ew)<=2,`${name}: Campaign (${opWidths.cw}), Endless (${opWidths.ew}), and Multiplayer (${opWidths.pw}) match width`);
      }
      // Scripts are blocked here, so the tour never fills its card in: give it the kind
      // of text it renders and check the layout of the real markup and CSS.
      await page.evaluate(()=>{
        document.querySelector('#tutorialStep').textContent='FIELD BRIEFING · 8 / 11';
        document.querySelector('#tutorialTitle').textContent='Practice the Skills menu';
        document.querySelector('#tutorialText').textContent='At level 2, you earn your first skill point. Pick a category and select a skill card to see its details. Unlock it, then save your build. Try it here on a sample soldier: nothing you do is saved.';
        document.querySelector('#tutorialCaption').textContent='EXAMPLE BUILD';
        document.querySelector('#tutorialPracticeStatus').hidden=false;
        document.querySelector('#tutorialPracticeStatus').textContent='Use the real Skills menu on the sample soldier. Nothing is saved.';
        document.querySelector('#tutorialPracticeSkip').hidden=false;
        document.querySelector('#tutorialDialog').showModal();
      });
      // Practice drives the real dialogs, so the briefing is checked on its own; the
      // controls it points at are covered by the dialog loop above.
      await check('#tutorialTitle');await check('#tutorialNext');await check('#tutorialPracticeSkip');
      await page.screenshot({path:`browser-artifacts/${name}-tutorial-briefing.png`});
      await page.evaluate(()=>document.querySelector('#tutorialDialog').close());
      // The language gate: the one screen a player cannot skip. It is opened here on
      // purpose (the context pretends a language was chosen), because it is the only
      // place the flags actually have to paint.
      await page.evaluate(()=>{document.documentElement.dataset.langGate='1';document.querySelector('#languageGate').hidden=false;});
      for(const code of ['gb','de']){
        const flag=page.locator(`.language-gate-button[data-language="${code==='gb'?'en':'de'}"] .language-gate-flag img`);
        assert.equal(await flag.evaluate(img=>img.complete&&img.naturalWidth>0),true,`${name}: the ${code} flag is a real painted image`);
      }
      // Both tiles are inside the screen and tall enough for a thumb, on all three
      // viewports - including 320px, where the tiles stack instead of splitting.
      for(const lang of ['en','de']){
        const tile=page.locator(`.language-gate-button[data-language="${lang}"]`);
        const box=await tile.boundingBox();
        assert.ok(box&&box.width>0,'the tile is laid out');
        assert.ok(box.x>=-1&&box.x+box.width<=width+1,`${name}: the ${lang} tile is inside the viewport`);
        assert.ok(box.height>=44,`${name}: the ${lang} tile is ${Math.round(box.height)}px tall, under the 44px thumb rule`);
      }
      // Nothing in the gate may be cut off: no button may hang below the fold.
      const lastTile=await page.locator('.language-gate-button[data-language="de"]').boundingBox();
      assert.ok(lastTile.y+lastTile.height<=height+1,`${name}: the gate fits ${height}px without scrolling`);
      await page.screenshot({path:`browser-artifacts/${name}-language-gate.png`});
      console.log(`${name}: sign-in, command, lobby, dialogs and the language gate fit the viewport`);
      await context.close();
    }
    // Dedicated mobile-landscape (844x390) check for #tutorialDossier + #menuTour pinned footers/headers
    {
      const context = await browser.newContext({ viewport: { width: 844, height: 390 }, reducedMotion: 'reduce' });
      await context.addInitScript(() => { try { localStorage.setItem('ironpath:language', 'de'); } catch {} });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.hostname !== '127.0.0.1' || route.request().resourceType() === 'script') return route.abort();
        return route.continue();
      });
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:8765/IronPath/', { waitUntil: 'load' });
      await page.evaluate(() => {
        document.querySelector('#introOverlay').hidden = true;
        document.querySelector('#loading').hidden = true;
        document.querySelector('#entry').hidden = true;
        document.querySelector('#gameView').hidden = false;
        document.getElementById('dossierClose').hidden = true;
        document.getElementById('dossierTitle').textContent = "Einsatz-Dossier von General Vance";
        document.getElementById('dossierLead').textContent = 'Rekrut, tritt an den Taktiktisch. Dich erwarten sieben geführte Ausbildungswellen.';
        document.getElementById('dossierRewardNote').textContent = 'Der erfolgreiche Erstabschluss bringt bis zu 450 EP.';
        document.getElementById('dossierRadioStatus').textContent = 'TON AUS';
        document.getElementById('dossierRadioReplay').textContent = 'Funk wiederholen';
        document.getElementById('dossierRadioMute').textContent = 'Stumm';
        document.getElementById('dossierRadioSubtitle').textContent = 'General Vance: Rekrut, das ist mein Gefechtsstand. Bereit für den Einsatz?';
        document.getElementById('dossierRadioSubtitle').hidden = false;
        document.getElementById('dossierAccept').textContent = 'AUFTRAG ANNEHMEN';
        document.getElementById('dossierDecline').textContent = 'VORERST ABLEHNEN';
        document.getElementById('tutorialDossier').showModal();
      });
      const lsDossier = await page.evaluate(() => {
        const d = document.getElementById('tutorialDossier');
        const banner = d.querySelector('.dossier-banner').getBoundingClientRect();
        const actions = d.querySelector('.dossier-actions').getBoundingClientRect();
        const accept = document.getElementById('dossierAccept').getBoundingClientRect();
        const decline = document.getElementById('dossierDecline').getBoundingClientRect();
        return {
          overflow: d.scrollWidth > d.clientWidth + 1,
          bannerTop: banner.top,
          actionsBottom: actions.bottom,
          sideBySide: Math.abs(accept.top - decline.top) <= 4,
          vh: innerHeight,
        };
      });
      assert.equal(lsDossier.overflow, false, 'phone-landscape: #tutorialDossier has zero horizontal overflow');
      assert.ok(lsDossier.bannerTop >= 0 && lsDossier.actionsBottom <= lsDossier.vh + 1, 'phone-landscape: banner and pinned footer stay inside 390px viewport');
      assert.equal(lsDossier.sideBySide, true, 'phone-landscape: action buttons sit cleanly side by side');
      await page.screenshot({ path: 'browser-artifacts/phone-landscape-tutorialDossier.png' });
      await page.evaluate(() => {
        document.getElementById('tutorialDossier').close();
        const tour = document.getElementById('menuTour');
        document.getElementById('menuTourStep').textContent = 'HQ-TOUR · 1 / 8';
        document.getElementById('menuTourCaption').textContent = 'KOMMANDO-HQ';
        document.getElementById('menuTourTitle').textContent = 'Soldaten-Akte & Profil';
        document.getElementById('menuTourText').textContent = 'Prüfe Dienstgrad, Erfahrungspunkte und dein sicheres Porträt.';
        document.getElementById('menuTourDetail').textContent = 'Löschen & Abmelden bleiben geschützt.';
        document.getElementById('menuTourRadioStatus').textContent = 'TON AUS';
        document.getElementById('menuTourRadioSubtitle').textContent = 'Willkommen in der Kommandozentrale.';
        document.getElementById('menuTourRadioSubtitle').hidden = false;
        tour.hidden = false;
        tour.showPopover?.();
      });
      await page.screenshot({ path: 'browser-artifacts/phone-landscape-menu-tour.png' });
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
