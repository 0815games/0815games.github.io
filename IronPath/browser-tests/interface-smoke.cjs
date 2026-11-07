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
      await page.evaluate(()=>{document.querySelector('#radialMenu').hidden=true;});
      await check('#mapViewport');await check('.dashboard');await check('#start');await check('#speed');await check('#ability');await check('#endRun');await check('#message');
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
        inDialog:!!document.querySelector('#settingsDialog #languageSelect'),
      }));
      assert.deepEqual(settingsOnly,{selects:1,inDialog:true},`${name}: exactly one language control, inside Settings`);
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
      for (const [id, control] of [['skillDialog', '#skillSave'], ['armoryDialog', '#armoryClose'], ['runResults', '#resultsDone'], ['gameConfirm', '#gameConfirmAccept'], ['tutorialDialog', '#tutorialNext'], ['friendsDialog', '#friendsClose'], ['friendStatsDialog', '#friendStatsClose'], ['leaderboardDialog', '#leaderboardClose']]) {
        await page.evaluate(id => document.getElementById(id).showModal(), id);
        // The armory now opens on its item list; its workshop tab is checked separately.
        if(id==='armoryDialog')await page.evaluate(()=>document.querySelectorAll('#armoryList .armory-section').forEach(section=>{section.hidden=section.dataset.section!=='equipment';}));
        await check(`#${id}`); await check(control);
        if(id==='friendsDialog'||id==='leaderboardDialog'){
          const layout=await page.locator(control).evaluate(el=>{const r=el.getBoundingClientRect(),h=el.parentElement.getBoundingClientRect(),style=getComputedStyle(el);return {rightGap:h.right-r.right,textAlign:style.textAlign,width:r.width,height:r.height};});
          assert.ok(Math.abs(layout.rightGap)<2,`${name}: ${control} should align to the right edge of its header`);assert.equal(layout.textAlign,'center');assert.ok(layout.width>=44&&layout.height>=44);
        }
        await page.screenshot({ path: `browser-artifacts/${name}-${id}.png` });
        await page.evaluate(id => document.getElementById(id).close(), id);
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
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
