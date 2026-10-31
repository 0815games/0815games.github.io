import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
// Minimal browser adapter to check that the existing solo UI still drives shared commands.
const elements=new Map();
const ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
function element(id){if(!elements.has(id))elements.set(id,{id,textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{toggle(){}},setAttribute(){},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return elements.get(id);}
globalThis.document={getElementById:element,activeElement:{tagName:'BODY'}};
globalThis.window={innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
globalThis.requestAnimationFrame=()=>{};
let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
for(const file of ['match.mjs','combat.mjs','progression.mjs','simulation.mjs','tutorial.mjs'])source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
startGame({getProfile:()=>({name:'Test',gender:'female'}),getUserId:()=> 'smoke-user',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}});
assert.equal(element('tutorialDialog').open,true);
element('tutorialSkip').onclick();
assert.equal(element('tutorialDialog').open,false);
assert.equal(element('money').textContent,125);
// Tap a pad: no purchase happens until a tower is chosen.
element('game').onclick({clientX:105,clientY:210});
assert.equal(element('money').textContent,125);
assert.equal(element('radialMenu').hidden,false);
assert.equal(element('radial0').disabled,false);
assert.match(element('radial0').textContent,/MG Nest/);
element('radial0').onclick();
assert.equal(element('money').textContent,75);
assert.equal(element('radialMenu').hidden,true);
// Upgrade to level two through the tower wheel.
element('game').onclick({clientX:105,clientY:210});
assert.match(element('radial0').textContent,/UPGRADE/);
assert.equal(element('radial0').disabled,false);
element('radial0').onclick();
assert.equal(element('money').textContent,5);
// Level three upgrade is too expensive; it is visibly disabled.
element('game').onclick({clientX:105,clientY:210});
assert.equal(element('radial0').disabled,true);
assert.match(element('radial1').textContent,/SELL/);
element('radial1').onclick();
assert.match(element('radial0').textContent,/CONFIRM/);
element('radial1').onclick(); // cancel returns to tower actions
assert.match(element('radial0').textContent,/UPGRADE/);
element('radial1').onclick();element('radial0').onclick();
assert.equal(element('money').textContent,65);
assert.equal(element('radialMenu').hidden,true);
// Costs gate build choices too.
element('game').onclick({clientX:105,clientY:210});
assert.equal(element('radial0').disabled,false);
assert.equal(element('radial1').disabled,true);
assert.equal(element('radial2').disabled,false);
assert.equal(element('radial3').disabled,true);
element('radial0').onclick();
assert.equal(element('money').textContent,15);
element('start').onclick();
assert.equal(element('wave').textContent,'1 / 10');
element('tutorialReplay').onclick();
assert.equal(element('tutorialDialog').open,true);
element('tutorialSkip').onclick();
assert.equal(element('tutorialDialog').open,false);
console.log('Solo radial menu and tutorial smoke test passed.');
