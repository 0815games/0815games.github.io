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
  for(const file of ['features.mjs','solo-deployment.mjs','workshop-run-receipt.mjs','canvas-resolution.mjs','language.mjs','map-zoom.mjs','game-localization.mjs','story-localization.mjs','soldier-motion.mjs','dialog-dismiss.mjs','focus-pause.mjs','story-cinematics.mjs','campaign.mjs','relics.mjs','story-mission.mjs','story-events.mjs','training-run.mjs','first-run-coach.mjs','four-game-view.mjs','battle-viewport-controller.mjs','battle-viewport.mjs','run-results.mjs','coop-motion.mjs','boss-mechanics.mjs','battle-sound.mjs','run-perks.mjs','terrain.mjs','maps.mjs','combat-fx.mjs','cartoon-art.mjs','match.mjs','combat.mjs','progression.mjs','battle-xp-hud.mjs','tower-upgrade-cue.mjs','tower-specialization.mjs','report-promotion.mjs','rank-insignia.mjs','ability-hud.mjs','ability-hud.mjs','ability-hud.mjs','simulation.mjs','tutorial.mjs','coop-config.mjs','coop-client.mjs','coop-input.mjs'])
    source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
  source=source.replace(/'\.\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../skills.mjs',import.meta.url).href));
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
  const f=await field({skills:'2,0,0,0,0;assault'});
  const hud=f.el('ability');
  assert.equal(f.el('abilityName').textContent,'AIRSTRIKE','the chosen ability is named');
  assert.match(f.el('abilityIcon').innerHTML,/^<svg /,'and carries its mark');
  assert.equal(hud.dataset.state,'not-running','no wave has started, so it says so');
  assert.equal(f.el('abilityState').textContent,'START THE WAVE');
  assert.equal(hud.disabled,true);

  // A wave with an enemy on the field: ready, and the ring that introduces it.
  f.el('start').onclick();f.tick();
  assert.equal(hud.dataset.state,'ready','the wave runs and there is something to hit');
  assert.equal(f.el('abilityState').textContent,'READY');
  assert.equal(hud.disabled,false);
  assert.equal(hud.classList.contains('ability-hud--new'),true,'the first ready ability is introduced once');
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
  assert.match(f.el('message').textContent,/Choose an ability under SKILLS/,'the radio says where abilities are chosen, unprompted');
  f.el('ability').onclick();
  assert.match(f.el('message').textContent,/Choose an ability under SKILLS/,'and asking again repeats it');
});

test('a recharging ability counts its seconds down, from the player state',async()=>{
  // Supply Drop needs nothing but a running wave - a full bunker would refuse
  // Field Repair and prove nothing about the cooldown.
  const f=await field({skills:'0,0,2,0,0;logistics'});
  f.el('start').onclick();f.tick();
  assert.equal(f.el('abilityName').textContent,'SUPPLY DROP');
  assert.equal(f.el('ability').dataset.state,'ready','logistics needs nothing but a running wave');
  f.el('ability').onclick();f.tick(2);
  assert.equal(f.el('ability').dataset.state,'cooldown','and after use it recharges');
  assert.match(f.el('abilityState').textContent,/^READY IN \d+s$/,'with the seconds written out');
  assert.equal(f.el('ability').disabled,true);
});
