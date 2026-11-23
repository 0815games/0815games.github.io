import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';

// The ability HUD, on the field and in the real game.
//
// The pure rules are `ability-hud.test.mjs`. This is the part only the real
// `game.js` can answer: does the button actually say all that, and does it say
// it from the player's own match state - not from a copy that went stale?
//
// The harness is the same one the endless shimmer uses: the real `game.js` over
// a stubbed page, driven through the buttons a soldier would press.
async function field({skills}={}){
  const nodes=new Map(),ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
  function el(id){if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},children:[],scrollWidth:400,clientWidth:400,scrollLeft:0,value:'',classList:{set:new Set(),toggle(){},add(name){this.set.add(name);},remove(name){this.set.delete(name);},contains(name){return this.set.has(name);}},contains(){return false;},setAttribute(k,v){this[k]=v;},removeAttribute(){},toggleAttribute(){},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:960,height:540}),width:960,height:540});return nodes.get(id);}
  globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},querySelector:()=>null,getElementById:el,activeElement:{tagName:'BODY'}};
  globalThis.window={scrollBy(){},innerWidth:400,innerHeight:800,devicePixelRatio:1,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
  let frame;globalThis.requestAnimationFrame=fn=>{frame=fn;};
  let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
  for(const file of ['core/features.mjs','core/solo-deployment.mjs','workshop/workshop-run-receipt.mjs','core/canvas-resolution.mjs','language.mjs','core/map-zoom.mjs','core/game-localization.mjs','core/story-localization.mjs','core/soldier-motion.mjs','ui/dialog-dismiss.mjs','core/focus-pause.mjs','core/story-cinematics.mjs','core/campaign.mjs','core/relics.mjs','core/campaign-prestige.mjs','core/campaign-pressure.mjs','core/story-mission.mjs','core/story-events.mjs','core/training-run.mjs','ui/first-run-coach.mjs','core/four-game-view.mjs','battle/battle-viewport-controller.mjs','battle/battle-viewport.mjs','core/run-results.mjs','core/coop-motion.mjs','core/boss-mechanics.mjs','battle/battle-sound.mjs','core/run-perks.mjs','core/terrain.mjs','core/maps.mjs','core/combat-fx.mjs','core/cartoon-art.mjs','core/match.mjs','core/combat.mjs','core/progression.mjs','battle/battle-xp-hud.mjs','core/tower-upgrade-cue.mjs','core/tower-specialization.mjs','core/tower-class-paths.mjs','ui/development-ui.mjs','core/report-promotion.mjs','core/rank-insignia.mjs','core/ground-tracks.mjs','ui/ability-hud.mjs','ui/ability-hud.mjs','ui/ability-hud.mjs','core/simulation.mjs','core/tutorial.mjs','core/coop-config.mjs','core/coop-client.mjs','core/coop-input.mjs','ui/field-notice.mjs','ui/map-intro.mjs','core/hit-feedback.mjs','ui/boss-banner.mjs'])
    source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
  source=source.replace(/'\.\/core\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../core/skills.mjs',import.meta.url).href));
  const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  // The build is the encoded string the account really stores; `parseBuild`
  // turns it into the object the HUD reads. Level 5 affords the two ranks.
  startGame({getProfile:()=>({name:'Test',gender:'female',skills}),getUserId:()=>'ability-user',isReady:()=>true,getLevel:()=>5,onSessionChange(){},awardXP(){}},{nextMapId:()=>'road',confirmAction:async()=>false});
  el('tutorialSkip').onclick();
  // The field only speaks after it has run: enemies spawn during a wave, and
  // the HUD is repainted from the match, never from the click that caused it.
  let clock=performance.now();
  const tick=(steps=6,ms=120)=>{for(let i=0;i<steps;i++){clock+=ms;frame(clock);}};
  return {el,tick};
}

test('the button names the ability, shows its mark and says why it is waiting',async()=>{
  const f=await field({skills:'v2;assault;2;0;00000000000000'});
  const hud=f.el('ability');
  assert.equal(f.el('abilityName').textContent,'AIRSTRIKE','the chosen ability is named');
  assert.match(f.el('abilityIcon').innerHTML,/^<svg /,'and carries its mark');
  assert.equal(hud.dataset.state,'not-running','no wave has started, so it says so');
  assert.equal(f.el('abilityState').textContent,'START THE WAVE');
  assert.equal(hud.disabled,true);

  // A wave with an enemy on the field: ready, with attention ring, notice banner and radio intro.
  f.el('start').onclick();f.tick();
  assert.equal(hud.dataset.state,'ready','the wave runs and there is something to hit');
  assert.equal(f.el('abilityState').textContent,'READY');
  assert.equal(hud.disabled,false);
  assert.equal(hud.classList.contains('ability-hud--new'),true,'the ready ability announces itself visibly');
  assert.match(f.el('fieldNoticeText').textContent,/Airstrike is ready!/,'and the field notice alerts the player when it becomes ready');
  assert.match(f.el('message').textContent,/Airstrike is ready\. Use it from the button at the bottom right/,'and the radio says where it is');
});

test('without a chosen ability the button explains where to get one',async()=>{
  const f=await field({});
  assert.equal(f.el('abilityName').textContent,'NO SKILL');
  assert.equal(f.el('abilityState').textContent,'CHOOSE IN SKILLS','not a dead button: a direction');
  assert.equal(f.el('ability').dataset.state,'no-skill');
  assert.equal(f.el('abilityIcon').innerHTML,'','and no mark for an ability that does not exist');
  // Disabled on purpose: it cannot be used, and the stylesheet takes a disabled
  // HUD out of the hit test, so it never eats a tap meant for a build pad under
  // it. The direction is spoken on its own instead of waiting to be asked.
  assert.equal(f.el('ability').disabled,true,'it stays out of the way of the field');
  // Where to get an ability is a WARNING, not ordinary traffic: the player
  // tried to use one and could not. It flutters in under the status bar until
  // its turn is over, and the spoken line is left alone.
  assert.match(f.el('fieldNoticeText').textContent,/Choose an ability under SKILLS/,'the field says where abilities are chosen, unprompted');
  assert.equal(f.el('fieldNoticeMore').hidden,true,'once - the second attempt is the same answer, not a second warning');
  f.el('ability').onclick();
  assert.match(f.el('fieldNoticeText').textContent,/Choose an ability under SKILLS/,'and asking again says it again');
});

test('a recharging ability counts its seconds down, from the player state, and alerts again when ready',async()=>{
  // Supply Drop needs nothing but a running wave - a full bunker would refuse
  // Field Repair and prove nothing about the cooldown.
  const f=await field({skills:'v2;logistics;2;0;00000000000000'});
  f.el('start').onclick();f.tick();
  assert.equal(f.el('abilityName').textContent,'SUPPLY DROP');
  assert.equal(f.el('ability').dataset.state,'ready','logistics needs nothing but a running wave');
  assert.match(f.el('fieldNoticeText').textContent,/Supply Drop is ready!/,'announces readiness via the visible field notice');
  f.el('fieldNoticeText').textContent='';
  f.el('ability').classList.remove('ability-hud--new');
  f.el('ability').onclick();f.tick(2);
  assert.equal(f.el('ability').dataset.state,'cooldown','and after use it recharges');
  assert.match(f.el('abilityState').textContent,/^READY IN \d+s$/,'with the seconds written out');
  assert.equal(f.el('ability').disabled,true);
  // Let the 30s cooldown finish inside the running wave so readiness returns
  // (the loop clamps each tick to 0.05s, so advance in 50ms steps).
  for(let i=0;i<700&&f.el('ability').dataset.state==='cooldown';i++)f.tick(1,50);
  if(f.el('ability').dataset.state==='not-running'){f.el('start').onclick();f.tick();}
  assert.equal(f.el('ability').dataset.state,'ready','returns to ready after recharging');
  assert.equal(f.el('ability').disabled,false);
  assert.equal(f.el('ability').classList.contains('ability-hud--new'),true,'re-triggers the visible ring burst after recharging');
  assert.match(f.el('fieldNoticeText').textContent,/Supply Drop is ready!/,'alerts the player again when cooldown finishes');
});
