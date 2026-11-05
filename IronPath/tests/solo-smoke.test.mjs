import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
// Minimal browser adapter to check that the existing solo UI still drives shared commands.
const elements=new Map();
let lastArc, strokes=[], path=[];
const ctx=new Proxy({}, {get(target,key){if(key==='beginPath')return ()=>{path=[];};if(key==='moveTo'||key==='lineTo')return (...args)=>path.push([key,...args]);if(key==='arc')return (...args)=>{lastArc=args;};if(key==='stroke')return ()=>strokes.push({arc:lastArc,path:[...path],style:target.strokeStyle});return target[key]||(()=>{});},set(target,key,value){target[key]=value;return true;}});
function element(id){if(!elements.has(id))elements.set(id,{id,textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{toggle(){}},contains(){return false;},setAttribute(){},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return elements.get(id);}
globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},querySelector:()=>null,getElementById:element,activeElement:{tagName:'BODY'}};
let scrolls=[];globalThis.window={scrollBy(options){scrolls.push(options);},innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
let frame;globalThis.requestAnimationFrame=fn=>{frame=fn;};
function draw(){strokes=[];frame(performance.now());return strokes.filter(s=>s.style==='#bad8ca');}
let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
for(const file of ['language.mjs','game-localization.mjs','story-localization.mjs','soldier-motion.mjs','dialog-dismiss.mjs','focus-pause.mjs','story-cinematics.mjs','campaign.mjs','story-mission.mjs','four-game-view.mjs','battle-viewport-controller.mjs','battle-viewport.mjs','run-results.mjs','coop-motion.mjs','boss-mechanics.mjs','battle-sound.mjs','run-perks.mjs','terrain.mjs','maps.mjs','combat-fx.mjs','cartoon-art.mjs','match.mjs','combat.mjs','progression.mjs','simulation.mjs','tutorial.mjs','coop-config.mjs','coop-client.mjs','coop-input.mjs'])source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
source=source.replace(/'\.\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../skills.mjs',import.meta.url).href));
const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let allowEnd=false,confirmation,returned=0;
const gameControl=startGame({getProfile:()=>({name:'Test',gender:'female'}),getUserId:()=> 'smoke-user',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',confirmAction:async options=>{confirmation=options;return allowEnd;},onReturnToCommand:()=>returned++});
assert.equal(element('tutorialDialog').open,true);
element('tutorialSkip').onclick();
assert.equal(element('tutorialDialog').open,false);
assert.equal(element('money').textContent,125);
assert.equal(element('mapName').textContent,'The Last Road');
assert.match(element('wavePreview').textContent,/Next: Wave 1/);
// A phone selection obscured by the fixed sheet scrolls only vertically.
element('radialMenu').getBoundingClientRect=()=>({top:220});
element('game').onclick({clientX:105,clientY:210});
assert.ok(scrolls[0].top>0);assert.equal('left' in scrolls[0],false);assert.equal(scrolls[0].behavior,'auto');
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
// Sale still requires confirmation.
element('game').onclick({clientX:105,clientY:210});
element('radial1').onclick();
assert.match(element('menuName0').textContent,/Confirm/);
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
assert.match(element('wavePreview').textContent,/Next: Wave 2/);
const enemiesBeforePause=element('enemies').textContent;gameControl.setMenuOpen(true);const pauseTime=performance.now();for(let i=1;i<=30;i++)frame(pauseTime+i*50);assert.equal(element('enemies').textContent,enemiesBeforePause,'solo combat does not advance while the command menu is open');gameControl.setMenuOpen(false);assert.equal(await gameControl.chooseEndless(),false,'declining a new operation preserves the current run');assert.equal(element('wave').textContent,'1 / ∞');
await element('endRun').onclick();assert.equal(element('wave').textContent,'1 / ∞');assert.equal(element('start').textContent,'WAVE IN PROGRESS');assert.match(confirmation.text,/unfinished wave/);assert.equal(returned,0,'cancelling does not navigate');
allowEnd=true;await element('endRun').onclick();assert.equal(element('start').textContent,'RESTART OPERATION');assert.equal(element('endRun').disabled,true);assert.match(element('message').textContent,/Run ended/);assert.equal(element('runResults').open,true);assert.equal(returned,1,'confirmed end returns to command center');assert.match(element('resultsTitle').textContent,/Operation ended/);assert.match(element('resultsWaves').textContent,/0 waves completed/);assert.equal(element('runResults').dataset.outcome,'neutral');assert.equal(element('resultsStatWaves').textContent,'0');assert.equal(element('resultsRewardXp').textContent,'+0 XP');assert.equal(element('resultsDone').textContent,'RETURN TO COMMAND CENTER');element('resultsDone').onclick();assert.equal(element('runResults').open,false);element('viewResults').onclick();assert.equal(element('runResults').open,true);element('resultsDone').onclick();element('start').onclick();assert.equal(element('wave').textContent,'0 / ∞');assert.equal(element('endRun').disabled,false);

element('tutorialReplay').onclick();
assert.equal(element('tutorialDialog').open,true);
element('tutorialSkip').onclick();
assert.equal(element('tutorialDialog').open,false);
console.log('Solo tower sheet and tutorial smoke test passed.');
