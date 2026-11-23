import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';

// The endless field shimmer, painted.
//
// The cue itself is a pure module (`tower-upgrade-cue.mjs`) with its own tests.
// This file asks the question nobody else can: does the battlefield actually
// paint the ring, and does it stay quiet when the soldier cannot pay? It runs
// the real `game.js` against a stub canvas and reads back every stroke, so the
// machine sees the mark even though no human has looked at the field yet.
//
// `performance.now()` is controlled: the breathing of the ring is a function of
// the clock, so a frozen clock is what makes "reduced graphics is calm"
// checkable instead of probable.
const SHIMMER='#f2d891';
const PAD={x:105,y:210}; // getMap('road').pads[0]
let clock=1000;
Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true,writable:true});

async function field({reducedGraphics=false}={}){
  const elements=new Map();
  let lastArc,lastEllipse,path=[],strokes=[];
  const ctx=new Proxy({},{
    get(target,key){
      if(key==='beginPath')return ()=>{path=[];};
      if(key==='moveTo'||key==='lineTo')return (...args)=>path.push([key,...args]);
      if(key==='arc')return (...args)=>{lastArc=args;};
      if(key==='ellipse')return (...args)=>{lastEllipse=args;};
      if(key==='stroke')return ()=>strokes.push({arc:lastArc,ellipse:lastEllipse,path:[...path],style:target.strokeStyle,alpha:target.globalAlpha,width:target.lineWidth});
      return target[key]||(()=>{});
    },
    set(target,key,value){target[key]=value;return true;}});
  function element(id){if(!elements.has(id))elements.set(id,{id,textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},scrollWidth:400,clientWidth:400,scrollLeft:0,value:'',classList:{toggle(){},add(){},remove(){},contains(){return false;}},contains(){return false;},setAttribute(){},removeAttribute(){},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:960,height:540}),width:960,height:540});return elements.get(id);}
  globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},querySelector:()=>null,getElementById:element,activeElement:{tagName:'BODY'},documentElement:{style:{setProperty(){}},lang:'en'}};
  globalThis.window={scrollBy(){},innerWidth:400,innerHeight:800,devicePixelRatio:1,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},AudioContext:undefined,webkitAudioContext:undefined};
  let frame;globalThis.requestAnimationFrame=fn=>{frame=fn;};
  let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
  for(const file of ['core/features.mjs','core/solo-deployment.mjs','workshop/workshop-run-receipt.mjs','core/canvas-resolution.mjs','language.mjs','core/map-zoom.mjs','core/game-localization.mjs','core/story-localization.mjs','core/soldier-motion.mjs','core/tower-aim.mjs','ui/dialog-dismiss.mjs','core/focus-pause.mjs','core/story-cinematics.mjs','core/campaign.mjs','core/relics.mjs','core/campaign-prestige.mjs','core/campaign-pressure.mjs','core/story-mission.mjs','core/story-events.mjs','core/training-run.mjs','ui/first-run-coach.mjs','core/four-game-view.mjs','battle/battle-viewport-controller.mjs','battle/battle-viewport.mjs','core/run-results.mjs','core/coop-motion.mjs','core/boss-mechanics.mjs','battle/battle-sound.mjs','core/run-perks.mjs','core/terrain.mjs','core/maps.mjs','core/combat-fx.mjs','core/cartoon-art.mjs','core/match.mjs','core/combat.mjs','core/progression.mjs','battle/battle-xp-hud.mjs','core/tower-upgrade-cue.mjs','core/tower-specialization.mjs','core/tower-class-paths.mjs','ui/development-ui.mjs','core/report-promotion.mjs','core/rank-insignia.mjs','core/ground-tracks.mjs','ui/ability-hud.mjs','ui/ability-hud.mjs','core/report-promotion.mjs','core/rank-insignia.mjs','ui/ability-hud.mjs','ui/ability-hud.mjs','core/simulation.mjs','core/tutorial.mjs','core/coop-config.mjs','core/coop-client.mjs','core/coop-input.mjs','ui/field-notice.mjs','ui/map-intro.mjs','core/hit-feedback.mjs','ui/boss-banner.mjs'])
    source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
  source=source.replace(/'\.\/core\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../core/skills.mjs',import.meta.url).href));
  const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  startGame({getProfile:()=>({name:'Test',gender:'female'}),getUserId:()=>'shimmer-user',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},
    {nextMapId:()=>'road',reducedGraphics,confirmAction:async()=>false});
  element('tutorialSkip').onclick();
  const paint=()=>{strokes=[];path=[];frame(clock);return strokes.filter(stroke=>stroke.style===SHIMMER);};
  const build=padX=>{element('game').onclick({clientX:padX,clientY:210});element('radial0').onclick();element('towerDetailsConfirm').onclick();};
  return {element,paint,build};
}

test('a tower the soldier can afford shimmers; one he cannot stays quiet',async()=>{
  const f=await field();
  assert.equal(f.paint().length,0,'an empty field promises nothing');
  f.build(105); // MG costs 50 of 125 supplies; the level 2 step costs 70
  assert.equal(f.element('money').textContent,75);
  const marked=f.paint();
  assert.equal(marked.length,1,'the affordable tower is marked');
  assert.deepEqual(marked[0].ellipse.slice(0,2),[PAD.x,PAD.y],'the ring sits on the tower');
  // A second tower leaves 25 supplies - less than the 70 the next step costs.
  f.build(285);
  assert.equal(f.element('money').textContent,25);
  assert.equal(f.paint().length,0,'two towers and no money: the field stops promising');
});

test('reduced graphics keeps the mark and drops the breathing',async()=>{
  const calm=await field({reducedGraphics:true});
  calm.build(105);
  clock=1000;const first=calm.paint();
  clock=1220;const second=calm.paint();
  assert.equal(first.length,1,'the mark is still there - calm is not invisible');
  assert.deepEqual(second[0].ellipse,first[0].ellipse,'the ring does not move');
  assert.equal(second[0].alpha,first[0].alpha,'and does not fade in and out');

  const live=await field();
  live.build(105);
  clock=1000;const a=live.paint();
  clock=1220;const b=live.paint();
  assert.equal(a.length,1);
  assert.notEqual(b[0].ellipse[2],a[0].ellipse[2],'with full graphics the ring breathes');
  assert.equal(first[0].ellipse[2],40,'the calm ring keeps exactly the resting size');
  assert.ok(Math.abs(a[0].ellipse[2]-40)<=2&&Math.abs(b[0].ellipse[2]-40)<=2,'the breathing stays subtle');
  // Found too faint on the field: the mark has to be seen, not looked for. A
  // hairline at a quarter opacity is a rumour, not an invitation.
  assert.ok(a[0].width>=3,`the ring is a line one can see (${a[0].width}px)`);
  assert.ok(Math.min(a[0].alpha,b[0].alpha)>=.38,`it never fades out of sight (${Math.min(a[0].alpha,b[0].alpha).toFixed(2)})`);
  assert.ok(first[0].alpha>.7,'and with reduced graphics it stands firm');
});

test('the tower whose own sheet is open steps back, and returns when it closes',async()=>{
  const f=await field();
  f.build(105);
  assert.equal(f.paint().length,1);
  f.element('game').onclick({clientX:105,clientY:210});
  assert.equal(f.element('radialMenu').hidden,false,'the tower sheet is open');
  assert.equal(f.paint().length,0,'that sheet states the price in full');
  f.element('radialClose').onclick();
  assert.equal(f.paint().length,1,'so the mark comes back when it closes');
});
