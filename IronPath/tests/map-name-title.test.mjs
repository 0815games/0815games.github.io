import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';

// The map is named ONCE, in the title card - and nowhere else.
//
// The corner plate that used to repeat the name for the whole battle is gone, so
// `#mapName` is now a node on the title card. Two things must hold at once, and
// they pulled in opposite directions:
//
//   * the card must not rewrite the name with a shorter version of its own. It
//     did, and Chromium found it in the retreat flow: the field had composed
//     "Urban Ruin & Industrial Complex · SECTOR 4" for the sector readout, the
//     card overwrote it with the bare map name, and the next step of the flow
//     read a sector that was no longer there;
//   * the card must still be able to name a map by itself - a caller that only
//     knows the id gets the name from the map's own geometry.

const elements=new Map();
let lastArc, strokes=[], path=[];
const ctx=new Proxy({}, {get(target,key){if(key==='beginPath')return ()=>{path=[];};if(key==='moveTo'||key==='lineTo')return (...args)=>path.push([key,...args]);if(key==='arc')return (...args)=>{lastArc=args;};if(key==='stroke')return ()=>strokes.push({arc:lastArc,path:[...path],style:target.strokeStyle});return target[key]||(()=>{});},set(target,key,value){target[key]=value;return true;}});
function element(id){if(!elements.has(id))elements.set(id,{id,textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{toggle(){}},contains(){return false;},setAttribute(){},addEventListener(type,fn){this['on'+type]=fn;},removeEventListener(){},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return elements.get(id);}
globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},querySelector:()=>null,getElementById:element,activeElement:{tagName:'BODY'}};
let scrolls=[];globalThis.window={scrollBy(options){scrolls.push(options);},innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
let frame;globalThis.requestAnimationFrame=fn=>{frame=fn;};

async function boot(mapId){
  globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},querySelector:()=>null,
    getElementById:element,activeElement:{tagName:'BODY'},createElement:()=>element('created')};
  globalThis.window={scrollBy(){},innerWidth:400,innerHeight:800,devicePixelRatio:1,
    matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
  globalThis.requestAnimationFrame=()=>0;
  let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
  for(const file of ['features.mjs','solo-deployment.mjs','workshop-run-receipt.mjs','canvas-resolution.mjs','language.mjs','map-zoom.mjs','game-localization.mjs','story-localization.mjs','soldier-motion.mjs','dialog-dismiss.mjs','focus-pause.mjs','story-cinematics.mjs','campaign.mjs','relics.mjs','story-mission.mjs','story-events.mjs','training-run.mjs','first-run-coach.mjs','four-game-view.mjs','battle-viewport-controller.mjs','battle-viewport.mjs','run-results.mjs','coop-motion.mjs','boss-mechanics.mjs','battle-sound.mjs','run-perks.mjs','terrain.mjs','maps.mjs','combat-fx.mjs','cartoon-art.mjs','match.mjs','combat.mjs','progression.mjs','battle-xp-hud.mjs','tower-upgrade-cue.mjs','tower-specialization.mjs','report-promotion.mjs','rank-insignia.mjs','ability-hud.mjs','simulation.mjs','tutorial.mjs','coop-config.mjs','coop-client.mjs','coop-input.mjs','field-notice.mjs','map-intro.mjs'])
    source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
  source=source.replace(/'\.\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../skills.mjs',import.meta.url).href));
  const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const account={getProfile:()=>({name:'Test',gender:'female'}),getUserId:()=> 'title-user',isReady:()=>true,
    getLevel:()=>1,onSessionChange(){},awardXP(){}};
  const game=startGame(account,{nextMapId:()=>mapId,confirmAction:async()=>false,onReturnToCommand(){}});
  element('tutorialSkip').onclick();
  return game;
}

test('the title card shows the map the field named, sector and all',async()=>{
  // A sector-4 battlefield: the id's fourth hex digit is the sector index, so
  // this one has to read "· SECTOR 4" - and the card must not eat it.
  await boot('g3-4e9c6f21d');
  const name=element('mapName').textContent;
  assert.match(name,/SECTOR 4$/,`the field names the sector (${name})`);
  assert.equal(element('mapIntro').hidden,false,'and the title card is playing');
  assert.equal(element('mapName').textContent,name,'the card shows exactly what the field wrote');
  assert.equal(element('mapIntroLabel').textContent,'FREE PLAY','with the mode it is played in');
});

test('and it comes back for a new battle on the same ground',async()=>{
  // One announcement per LOADED map, not one per redraw: the card is playing
  // after the run started, and the name is the field's own text either way.
  await boot('road');
  assert.equal(element('mapName').textContent,'The Last Road');
  assert.equal(element('mapIntro').hidden,false,'the road is announced');
});
