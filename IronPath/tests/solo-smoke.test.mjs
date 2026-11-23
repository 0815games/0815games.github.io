import {test} from 'node:test';
// Minimal browser adapter to check that the existing solo UI still drives shared commands.

import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';

test('the solo tower sheet and the tutorial still drive the shared command layer',async()=>{
const elements=new Map();
let lastArc, strokes=[], path=[];
const ctx=new Proxy({}, {get(target,key){if(key==='beginPath')return ()=>{path=[];};if(key==='moveTo'||key==='lineTo')return (...args)=>path.push([key,...args]);if(key==='arc')return (...args)=>{lastArc=args;};if(key==='stroke')return ()=>strokes.push({arc:lastArc,path:[...path],style:target.strokeStyle});return target[key]||(()=>{});},set(target,key,value){target[key]=value;return true;}});
function element(id){if(!elements.has(id))elements.set(id,{id,textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{toggle(){}},contains(){return false;},setAttribute(){},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return elements.get(id);}
globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},querySelector:()=>null,getElementById:element,activeElement:{tagName:'BODY'}};
let scrolls=[];globalThis.window={scrollBy(options){scrolls.push(options);},innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
let frame;globalThis.requestAnimationFrame=fn=>{frame=fn;};
function draw(){strokes=[];frame(performance.now());return strokes.filter(s=>s.style==='#bad8ca');}
let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
for(const file of ['core/features.mjs','core/solo-deployment.mjs','workshop/workshop-run-receipt.mjs','core/canvas-resolution.mjs','language.mjs','core/map-zoom.mjs','core/game-localization.mjs','core/story-localization.mjs','core/soldier-motion.mjs','ui/dialog-dismiss.mjs','core/focus-pause.mjs','core/story-cinematics.mjs','core/campaign.mjs','core/relics.mjs','core/story-mission.mjs','core/story-events.mjs','core/training-run.mjs','ui/first-run-coach.mjs','core/four-game-view.mjs','battle/battle-viewport-controller.mjs','battle/battle-viewport.mjs','core/run-results.mjs','core/coop-motion.mjs','core/boss-mechanics.mjs','battle/battle-sound.mjs','core/run-perks.mjs','core/terrain.mjs','core/maps.mjs','core/combat-fx.mjs','core/cartoon-art.mjs','core/match.mjs','core/combat.mjs','core/progression.mjs','battle/battle-xp-hud.mjs','core/tower-upgrade-cue.mjs','core/tower-specialization.mjs','core/tower-class-paths.mjs','ui/development-ui.mjs','core/report-promotion.mjs','core/rank-insignia.mjs','core/ground-tracks.mjs','ui/ability-hud.mjs','core/simulation.mjs','core/tutorial.mjs','core/coop-config.mjs','core/coop-client.mjs','core/coop-input.mjs','ui/field-notice.mjs','ui/map-intro.mjs','ui/boss-banner.mjs'])source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
source=source.replace(/'\.\/core\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../core/skills.mjs',import.meta.url).href));
const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let allowEnd=false,confirmation,returned=0;
const gameControl=startGame({getProfile:()=>({name:'Test',gender:'female'}),getUserId:()=> 'smoke-user',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',confirmAction:async options=>{confirmation=options;return allowEnd;},onReturnToCommand:()=>returned++});
assert.equal(element('tutorialDialog').open,true);
element('tutorialSkip').onclick();
assert.equal(element('tutorialDialog').open,false);
assert.equal(element('money').textContent,125);
assert.equal(element('mapName').textContent,'The Last Road');
window.devicePixelRatio=2;frame(performance.now());assert.equal(element('game').width,1920);assert.equal(element('game').height,1080);
// The tower menu is a ring around the pad now, so nothing has to be scrolled to clear
// it: the old behaviour (push the page until the bottom sheet no longer covers the
// spot) would move the very pad the ring is centred on.
element('radialMenu').getBoundingClientRect=()=>({top:220});
const scrollsBefore=scrolls.length;
element('game').onclick({clientX:105,clientY:210});
assert.equal(scrolls.length,scrollsBefore,'selecting a pad never scrolls the page');
assert.ok(element('radialMenu').style.top,'the ring is anchored to the pad');
assert.equal(element('radialMenu').dataset.radius>0,true,'and publishes its radius');
// Choose an unaffordable tower to inspect it without purchasing.
assert.equal(element('radialMenu').hidden,false);
assert.deepEqual(draw()[0].path[0],['moveTo',73,189], 'empty selected pad has a visible marker');
element('game').onclick({clientX:285,clientY:210});
assert.deepEqual(draw()[0].path[0],['moveTo',253,189], 'marker follows a newly selected pad');
element('radialClose').onclick();assert.equal(draw().length,0,'closing clears an empty pad marker');
element('game').onclick({clientX:105,clientY:210});
assert.equal(element('radial0').disabled,false);
assert.match(element('menuName0').textContent,/MG Nest/);
assert.match(element('menuDesc0').textContent,/infantry/);
assert.equal(element('sheetTitle').textContent,'Build defense');
assert.equal(element('radialMenu').hidden,false); // remains open while inspecting the map
element('radial0').onclick();
assert.equal(element('towerDetails').open,true);
assert.match(element('towerDetailsText').textContent,/infantry/);
assert.equal(element('money').textContent,125);
assert.equal(element('towerDetailsConfirm').disabled,false);
element('towerDetailsConfirm').onclick();
assert.equal(element('money').textContent,75);
assert.equal(element('radialMenu').hidden,true);
assert.deepEqual(draw()[0].path[0],['moveTo',73,189], 'built tower stays visibly selected');
// The action panel shows effects and acts as the purchase confirmation.
element('game').onclick({clientX:105,clientY:210});
assert.match(element('menuName0').textContent,/Confirm upgrade/i);
assert.match(element('menuDesc0').textContent,/0.3/);
assert.equal(element('money').textContent,75);
element('radial0').onclick();
assert.equal(element('money').textContent,5);
// Unaffordable branch options can be inspected but not purchased.
element('game').onclick({clientX:105,clientY:210});
element('radial0').onclick();
assert.match(element('menuName0').textContent,/Twin MG/);
element('radial0').onclick();
assert.match(element('towerDetailsText').textContent,/45% shorter/);
assert.equal(element('towerDetailsConfirm').disabled,true);
assert.match(element('towerDetailsCost').textContent,/Not enough/);
assert.equal(element('money').textContent,5);
element('towerDetailsBack').onclick();
element('radialClose').onclick();
// Sale still requires confirmation and equips both ring buttons with dedicated icons and refund value.
element('game').onclick({clientX:105,clientY:210});
assert.equal(element('radial1').dataset.icon,'sell');
assert.equal(element('menuPrice1').textContent,'+60');
element('radial1').onclick();
assert.equal(element('radial0').dataset.icon,'confirmSell');
assert.equal(element('radial1').dataset.icon,'cancel');
assert.equal(element('menuName0').textContent,'Confirm sale');
assert.equal(element('menuPrice0').textContent,'+60');
assert.equal(element('menuName1').textContent,'Cancel');
{
  const {setupLanguage}=await import('../language.mjs');
  const selector={value:'',addEventListener(_type,fn){this.change=fn;}},langDoc={documentElement:{},getElementById:id=>id==='languageSelect'?selector:{},querySelectorAll:()=>[]};
  setupLanguage({document:langDoc});
  selector.value='de';selector.change();gameControl.refreshLanguage();
  assert.equal(element('radial0').dataset.icon,'confirmSell');
  assert.equal(element('radial1').dataset.icon,'cancel');
  assert.equal(element('menuName0').textContent,'Verkauf bestätigen');
  assert.equal(element('menuPrice0').textContent,'+60');
  assert.equal(element('menuName1').textContent,'Abbrechen');
  selector.value='en';selector.change();gameControl.refreshLanguage();
}
element('radial1').onclick();
assert.match(element('menuName0').textContent,/specialization/i);
element('radial1').onclick();element('radial0').onclick();
assert.equal(element('money').textContent,65);
assert.equal(element('radialMenu').hidden,true);
// Inspect an unaffordable cannon without spending supplies.
element('game').onclick({clientX:105,clientY:210});
element('radial1').onclick();
assert.match(element('towerDetailsTitle').textContent,/Cannon/);
assert.match(element('towerDetailsText').textContent,/tanks/);
const {setupLanguage}=await import('../language.mjs');const selector={value:'',addEventListener(_type,fn){this.change=fn;}},langDoc={documentElement:{},getElementById:id=>id==='languageSelect'?selector:{},querySelectorAll:()=>[]};setupLanguage({document:langDoc});selector.value='de';selector.change();gameControl.refreshLanguage();assert.equal(element('towerDetailsTitle').textContent,'Kanone');assert.match(element('towerDetailsText').textContent,/Panzer/);assert.equal(element('money').textContent,65);assert.equal(element('towerDetails').open,true);selector.value='en';selector.change();gameControl.refreshLanguage();assert.equal(element('towerDetailsTitle').textContent,'Cannon');assert.match(element('towerDetailsText').textContent,/tanks/);
assert.equal(element('towerDetailsConfirm').disabled,true);
element('towerDetailsBack').onclick();
element('radial0').onclick();element('towerDetailsConfirm').onclick();
assert.equal(element('money').textContent,15);
element('start').onclick();
assert.equal(element('wave').textContent,'1 / ∞');
const enemiesBeforePause=element('enemies').textContent;gameControl.setMenuOpen(true);const pauseTime=performance.now();for(let i=1;i<=30;i++)frame(pauseTime+i*50);assert.equal(element('enemies').textContent,enemiesBeforePause,'solo combat does not advance while the command menu is open');gameControl.setMenuOpen(false);assert.equal(await gameControl.chooseEndless(),false,'declining a new operation preserves the current run');assert.equal(element('wave').textContent,'1 / ∞');
await element('endRun').onclick();assert.equal(element('wave').textContent,'1 / ∞');assert.equal(element('start').textContent,'WAVE IN PROGRESS');assert.match(confirmation.text,/unfinished wave/);assert.equal(returned,0,'cancelling does not navigate');
allowEnd=true;await element('endRun').onclick();assert.equal(element('start').textContent,'RESTART OPERATION');assert.equal(element('endRun').disabled,true);assert.match(element('message').textContent,/Run ended/);assert.equal(element('runResults').open,true);assert.equal(returned,1,'confirmed end returns to command center');assert.match(element('resultsTitle').textContent,/Operation ended/);assert.match(element('resultsWaves').textContent,/0 waves completed/);assert.equal(element('runResults').dataset.outcome,'neutral');assert.equal(element('resultsStatWaves').textContent,'0');assert.equal(element('resultsRewardXp').textContent,'+0 XP');assert.equal(element('resultsDone').textContent,'RETURN TO COMMAND CENTER');element('resultsDone').onclick();assert.equal(element('runResults').open,false);element('viewResults').onclick();assert.equal(element('runResults').open,true);element('resultsDone').onclick();element('start').onclick();assert.equal(element('wave').textContent,'0 / ∞');assert.equal(element('endRun').disabled,false);

element('tutorialReplay').onclick();
assert.equal(element('tutorialDialog').open,true);
element('tutorialSkip').onclick();
assert.equal(element('tutorialDialog').open,false);
});
