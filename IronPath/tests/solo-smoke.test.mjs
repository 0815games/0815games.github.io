import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
// Minimal browser adapter to check that the existing solo UI still drives shared commands.
const elements=new Map();
const ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
function element(id){if(!elements.has(id))elements.set(id,{id,textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{toggle(){}},setAttribute(){},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return elements.get(id);}
globalThis.document={getElementById:element,activeElement:{tagName:'BODY'}};
globalThis.window={matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
globalThis.requestAnimationFrame=()=>{};
let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
for(const file of ['match.mjs','combat.mjs','progression.mjs','simulation.mjs'])source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
startGame({getProfile:()=>({name:'Test',gender:'female'}),isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}});
assert.equal(element('money').textContent,125);
element('game').onclick({clientX:105,clientY:210});
assert.equal(element('money').textContent,75);
element('game').onclick({clientX:105,clientY:210});
assert.equal(element('upgradePanel').open,true);
element('branchA').onclick();
assert.equal(element('money').textContent,5);
assert.equal(element('upgradePanel').open,false);
element('start').onclick();
assert.equal(element('wave').textContent,'1 / 10');
console.log('Solo UI command smoke test passed.');
