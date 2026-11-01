import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
// Minimal browser adapter to check that the existing solo UI still drives shared commands.
const elements=new Map();
let lastArc, strokes=[];
const ctx=new Proxy({}, {get(target,key){if(key==='arc')return (...args)=>{lastArc=args;};if(key==='stroke')return ()=>strokes.push({arc:lastArc,style:target.strokeStyle});return target[key]||(()=>{});},set(target,key,value){target[key]=value;return true;}});
function element(id){if(!elements.has(id))elements.set(id,{id,textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{toggle(){}},setAttribute(){},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return elements.get(id);}
globalThis.document={getElementById:element,activeElement:{tagName:'BODY'}};
let scrolls=[];globalThis.window={scrollBy(options){scrolls.push(options);},innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
let frame;globalThis.requestAnimationFrame=fn=>{frame=fn;};
function draw(){strokes=[];frame(performance.now());return strokes.filter(s=>s.arc?.[2]===35&&s.style==='#ffed70');}
let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
for(const file of ['match.mjs','combat.mjs','progression.mjs','simulation.mjs','tutorial.mjs','coop-config.mjs','coop-client.mjs','coop-input.mjs'])source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
source=source.replace("'./skills.mjs'",JSON.stringify(new URL('../skills.mjs',import.meta.url).href));
const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
startGame({getProfile:()=>({name:'Test',gender:'female'}),getUserId:()=> 'smoke-user',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}});
assert.equal(element('tutorialDialog').open,true);
element('tutorialSkip').onclick();
assert.equal(element('tutorialDialog').open,false);
assert.equal(element('money').textContent,125);
assert.match(element('wavePreview').textContent,/Next: Wave 1/);
// A phone selection obscured by the fixed sheet scrolls only vertically.
element('radialMenu').getBoundingClientRect=()=>({top:220});
element('game').onclick({clientX:105,clientY:210});
assert.ok(scrolls[0].top>0);assert.equal('left' in scrolls[0],false);assert.equal(scrolls[0].behavior,'auto');
// Choose an unaffordable tower to inspect it without purchasing.
assert.equal(element('radialMenu').hidden,false);
assert.deepEqual(draw()[0].arc.slice(0,3),[105,210,35], 'empty selected pad has a visible marker');
element('game').onclick({clientX:285,clientY:210});
assert.deepEqual(draw()[0].arc.slice(0,3),[285,210,35], 'marker follows a newly selected pad');
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
assert.deepEqual(draw()[0].arc.slice(0,3),[105,210,35], 'built tower stays visibly selected');
// Upgrades show effects before confirming.
element('game').onclick({clientX:105,clientY:210});
assert.match(element('menuName0').textContent,/Upgrade/);
element('radial0').onclick();
assert.match(element('towerDetailsText').textContent,/0.3/);
assert.equal(element('money').textContent,75);
element('towerDetailsConfirm').onclick();
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
assert.match(element('menuName0').textContent,/Upgrade/);
element('radial1').onclick();element('radial0').onclick();
assert.equal(element('money').textContent,65);
assert.equal(element('radialMenu').hidden,true);
// Inspect an unaffordable cannon without spending supplies.
element('game').onclick({clientX:105,clientY:210});
element('radial1').onclick();
assert.match(element('towerDetailsTitle').textContent,/Cannon/);
assert.match(element('towerDetailsText').textContent,/tanks/);
assert.equal(element('towerDetailsConfirm').disabled,true);
element('towerDetailsBack').onclick();
element('radial0').onclick();element('towerDetailsConfirm').onclick();
assert.equal(element('money').textContent,15);
element('start').onclick();
assert.equal(element('wave').textContent,'1 / 10');
assert.match(element('wavePreview').textContent,/Next: Wave 2/);
element('tutorialReplay').onclick();
assert.equal(element('tutorialDialog').open,true);
element('tutorialSkip').onclick();
assert.equal(element('tutorialDialog').open,false);
console.log('Solo tower sheet and tutorial smoke test passed.');
