import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const helper=await readFile(new URL('../js/systems/keyboard-actions.js',import.meta.url),'utf8');
const keyboard=await readFile(new URL('../js/systems/keyboard.js',import.meta.url),'utf8');
let checks=0;
const check=fn=>{fn();checks++;};
function create(){
 const listeners={},observers=[],nodes={},env={blocked:false,interactions:0,moves:0};
 let doc;
 class Element{
  constructor(tag='div',id=''){this.tagName=tag.toUpperCase();this.id=id;this.hidden=false;this.open=false;this.disabled=false;this.attrs={};this.children=[];this.textContent='';this.className='';this.style={};this.classList={contains:n=>n==='hidden'&&this.hidden};}
  closest(sel){if(sel==='.hidden')return this.hidden?this:null;if(sel==='.item')return null;return null;}
  matches(sel){return sel.split(',').some(s=>s==='button'?this.tagName==='BUTTON':['input','textarea','select'].includes(s)?this.tagName===s.toUpperCase():false);}
  getClientRects(){return this.hidden?[]:[{}];}
  setAttribute(k,v){this.attrs[k]=v;}
  getAttribute(k){return this.attrs[k]??null;}
  addEventListener(){}
  append(n){this.children.push(n);}
  prepend(n){this.children.unshift(n);}
  querySelector(sel){if(sel==='.ability-key-hint')return this.children.find(n=>n.className==='ability-key-hint')||null;if(sel==='button'){return this.button??=new Element('button');}return null;}
  querySelectorAll(sel){if(this.id==='combat'){if(sel==='.ability-btn')return env.abilities;return [...env.abilities,nodes.attack,nodes.fire,nodes.heal,nodes.mana,nodes.flee];}return [];}
  focus(){doc.activeElement=this;}
  click(){this.hits=(this.hits||0)+1;}
  showModal(){this.open=true;}
  close(){this.open=false;}
  scrollIntoView(){}
 }
 for(const id of ['combat','stage','slots-grid','items','login-screen','slot-screen','class-screen','death-screen','game','intro-screen','floor-overlay','levelup-overlay','attack','fire','heal','mana','flee','save'])nodes[id]=new Element(['attack','fire','heal','mana','flee','save'].includes(id)?'button':'div',id);
 for(const id of ['intro-screen','login-screen','slot-screen','class-screen','death-screen','floor-overlay','levelup-overlay'])nodes[id].hidden=true;
 env.abilities=[0,1,2].map(()=>new Element('button'));
 doc={readyState:'complete',hidden:false,activeElement:nodes.stage,head:new Element(),body:new Element(),getElementById:id=>nodes[id],createElement:tag=>new Element(tag),querySelectorAll:()=>[],querySelector:()=>env.blocked?{}:null,addEventListener(){}};
 const state={inCombat:true,user:{uid:'user'},player:{hp:10,inventory:[]}};
 const window={addEventListener:(type,fn)=>{(listeners[type]??=[]).push(fn);},__rpg:{interact(){env.interactions++;},move(){env.moves++;}}};
 const context={document:doc,window,state,MutationObserver:class{constructor(fn){observers.push(fn);}observe(){}},queueMicrotask:fn=>fn(),console};
 vm.runInNewContext(helper.replace(/export /g,'')+'\n'+keyboard.replace(/^import .*;\n/gm,''),context);
 function press(key,extra={}){const e={key,target:nodes.stage,repeat:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.immediate=true;this.propagation=true;},stopPropagation(){this.propagation=true;},...extra};listeners.keydown[0](e);return e;}
 return {env,nodes,state,doc,press,observers,Element};
}
for(const [index,key]of ['q','e','r'].entries())for(const value of [key,key.toUpperCase()])check(()=>{const h=create();h.press(value);assert.equal(h.env.abilities[index].hits,1);assert.equal(h.env.interactions,0);});
for(const value of ['q','e','r'])check(()=>{const h=create();h.press(value,{repeat:true});assert.ok(h.env.abilities.every(b=>!b.hits));});
for(const state of ['disabled','hidden'])check(()=>{const h=create();h.env.abilities[1][state]=true;h.press('e');assert.ok(h.env.abilities.every(b=>!b.hits));});
check(()=>{const h=create();h.env.abilities[0].hidden=true;h.press('e');assert.equal(h.env.abilities[1].hits,1);});
for(const flag of ['ctrlKey','altKey','metaKey','isComposing'])check(()=>{const h=create();h.press('e',{[flag]:true});assert.ok(h.env.abilities.every(b=>!b.hits));});
for(const tag of ['input','textarea','select'])check(()=>{const h=create();h.press('q',{target:new h.Element(tag)});assert.ok(h.env.abilities.every(b=>!b.hits));});
check(()=>{const h=create(),target=new h.Element();target.isContentEditable=true;h.press('r',{target});assert.ok(h.env.abilities.every(b=>!b.hits));});
check(()=>{const h=create();h.env.blocked=true;const e=h.press('q');assert.ok(h.env.abilities.every(b=>!b.hits));assert.equal(e.immediate,undefined);assert.equal(e.propagation,true);});
check(()=>{const h=create();h.doc.hidden=true;h.press('q');assert.ok(h.env.abilities.every(b=>!b.hits));});
check(()=>{const h=create();h.state.user=null;h.press('q');assert.ok(h.env.abilities.every(b=>!b.hits));});
for(const key of ['Enter',' '])check(()=>{const h=create();h.state.inCombat=false;h.nodes.combat.hidden=true;h.press(key);assert.equal(h.env.interactions,1);});
check(()=>{const h=create();h.state.inCombat=false;h.nodes.combat.hidden=true;const e=h.press('e');assert.equal(h.env.interactions,0);assert.equal(e.immediate,true);});
check(()=>{const h=create();h.state.inCombat=false;h.nodes.combat.hidden=true;h.press('Enter',{repeat:true});assert.equal(h.env.interactions,0);});
check(()=>{const h=create();h.state.inCombat=false;h.nodes.combat.hidden=true;h.press('Enter',{target:new h.Element('button')});assert.equal(h.env.interactions,0);});
check(()=>{const h=create();h.doc.activeElement=h.env.abilities[2];h.press('Enter');assert.equal(h.env.abilities[2].hits,1);assert.equal(h.env.interactions,0);});
check(()=>{const h=create();h.press('1');assert.equal(h.nodes.attack.hits,1);});
check(()=>{const h=create();assert.equal(h.env.abilities[1].attrs['aria-keyshortcuts'],'E');assert.equal(h.env.abilities[1].children[0].textContent,'[E] ');});
check(()=>{const h=create();h.observers[2]();h.observers[2]();assert.equal(h.env.abilities[0].children.length,1);});
check(()=>{const h=create();h.press('5');assert.equal(h.nodes.mana.hits,1);});
check(()=>{const h=create();h.nodes.mana.disabled=true;h.press('5');assert.equal(h.nodes.mana.hits,undefined);});
check(()=>{const h=create();h.press('5',{repeat:true});assert.equal(h.nodes.mana.hits,undefined);});
console.log(JSON.stringify({checks,passed:checks,scope:'Actual keyboard.js setup/handler in VM with DOM/event/action doubles; no real browser or Firebase'}));
