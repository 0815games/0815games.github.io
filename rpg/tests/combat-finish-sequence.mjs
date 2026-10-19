import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const effectsSource=await readFile(new URL('../js/systems/combat-effects.js',import.meta.url),'utf8');
const rewardSource=await readFile(new URL('../js/systems/combat-reward-feedback.js',import.meta.url),'utf8');
const timingSource=await readFile(new URL('../js/systems/combat-timing.js',import.meta.url),'utf8');
const {COMBAT_FINISH_MS}=await import('data:text/javascript;base64,'+Buffer.from(timingSource).toString('base64'));
let checks=0;const test=(name,fn)=>{try{fn();checks++;}catch(e){e.message=name+': '+e.message;throw e;}};
function setup(){
 let now=0,next=0;const timers=new Map(),fxTimers=new Set(),micro=[],observers=[],windowEvents={},docEvents={},records=[],liveFX=new Set(),nodes={},bodyChildren=[];
 const env={urgent:false};
 const schedule=(fn,ms)=>{const id=++next;timers.set(id,{fn,at:now+ms});return id;};
 const cancel=id=>{timers.delete(id);fxTimers.delete(id);};
 const later=(fn,ms)=>{const id=schedule(()=>{fxTimers.delete(id);fn();},ms);fxTimers.add(id);return id;};
 const flush=()=>{while(micro.length)micro.shift()();};
 function tick(ms){const end=now+ms;while(true){const ready=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at);if(!ready.length)break;const [id,t]=ready[0];timers.delete(id);now=t.at;t.fn();flush();}now=end;}
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.listeners={};this.style={};this.className='';this.disabled=false;this.hidden=false;this.parts={};this.dataset={};this.parentElement=null;this.id='';this.classList={contains:n=>this.className.split(' ').includes(n),add:n=>{if(!this.classList.contains(n))this.className+=' '+n;},remove:n=>{this.className=this.className.split(' ').filter(x=>x!==n).join(' ');}};}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
  append(node){node.parentElement=this;this.children.push(node);bodyChildren.push(node);}
  after(node){nodes[node.id]=node;}
  querySelector(selector){return this.parts[selector]||null;}
  querySelectorAll(selector){if(selector==='.ability-btn')return this.abilityButtons||[];if(selector==='.exp-popup')return bodyChildren.filter(n=>n.className==='exp-popup');return [];}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  contains(node){return this===node||this.children.some(n=>n.contains(node))||Object.values(this.parts).includes(node);}
  matches(selector){if(selector==='.ability-btn')return this.className.split(' ').includes('ability-btn');if(selector==='#boss-loot-dialog[open]')return this.id==='boss-loot-dialog'&&this.attrs.open==='true';return false;}
  closest(selector){let n=this;while(n){if(n.matches&&n.matches(selector))return n;n=n.parentElement;}return null;}
  getContext(){return {clearRect(){}};}
  getBoundingClientRect(){const enemy=this.parentElement===nodes['combat-display']?.children[1];return {left:enemy?260:20,top:30,width:112,height:112};}
 }
 for(const id of ['combat','combat-info','game','stage','attack','fire','heal','flee']){const node=new Element(['attack','fire','heal','flee'].includes(id)?'button':'div');node.id=id;}
 const body=new Element('body'),head=new Element('head');
 const monster={id:'rat',name:'Ratte',hp:10,maxHp:10,x:2,y:1,xp:20,gold:5,atk:2,def:1};
 const player={name:'Held',hp:50,maxHp:50,mp:30,maxMp:30,atk:10,def:3,level:1,xp:0,gold:0,inventory:[{id:'health_potion',count:1}],equipped:{mainhand:'sword'},x:1,y:1,buffs:{shield:0,block:false,evade:false},cooldowns:{}};
 const state={player,activeMonster:monster,world:{tiles:{},monsters:[monster]},currentSlot:0,user:{uid:'u'},inCombat:true};
 class Renderer{constructor(){this.texts=[];}text(text,x,y){this.texts.push({text,x,y});}}
 const rendererInstance=new Renderer();
 const record=(kind,...args)=>{records.push({kind,args,at:now});};
 const fx={clear(){for(const id of [...fxTimers])cancel(id);liveFX.clear();record('clear');},later,number(...args){record('number',...args);const n={};liveFX.add(n);later(()=>liveFX.delete(n),690);},hit:(...a)=>record('hit',...a),slash:(...a)=>record('slash',...a),projectile:(...a)=>record('projectile',...a),heal:(...a)=>record('heal',...a),escape:(...a)=>record('escape',...a),react:(...a)=>record('react',...a)};
 const window={__rpg:{renderer:rendererInstance},addEventListener:(type,fn)=>{(windowEvents[type]??=[]).push(fn);}};
 const levelupBox=new Element('div');levelupBox.className='levelup-box';
 const levelupChoice=new Element('div');levelupChoice.className='levelup-choice';levelupChoice.append(levelupBox);
 const bossDialog=new Element('div');bossDialog.id='boss-loot-dialog';
 const document={readyState:'complete',hidden:false,body,head,getElementById:id=>nodes[id]||null,createElement:tag=>new Element(tag),querySelector:selector=>{if(selector==='.levelup-choice .levelup-box')return levelupBox;if(selector==='#boss-loot-dialog[open]')return bossDialog.attrs.open==='true'?bossDialog:null;return env.urgent?{}:null;},querySelectorAll:selector=>{if(selector==='.exp-popup')return bodyChildren.filter(n=>n.className==='exp-popup');return [];},addEventListener:(type,fn)=>{(docEvents[type]??=[]).push(fn);}};
 nodes.attack.onclick=function(){env.calls++;monster.hp-=20;rendererInstance.text('-20',monster.x,monster.y);if(monster.hp<=0){state.inCombat=false;state.world.monsters=[];nodes.combat.classList.add('hidden');rendererInstance.text('+20 EP',monster.x,monster.y);}};
 const sandbox={state,ITEMS:{},sound:{potion(){}},drawCharacter(){},drawMonsterPortrait(){},createBattleFX:()=>fx,COMBAT_FINISH_MS,document,window,setTimeout:schedule,clearTimeout:cancel,queueMicrotask:fn=>micro.push(fn),MutationObserver:class{constructor(fn){this.fn=fn;}observe(node){observers.push({node,fn:this.fn});}},matchMedia:()=>({matches:false}),console,Renderer};
 vm.runInNewContext(effectsSource.replace(/^import .*;\n/gm,''),sandbox);flush();
 vm.runInNewContext(rewardSource.replace(/^import .*;\n/gm,''),sandbox);flush();
 const notify=node=>{for(const o of observers.filter(o=>o.node===node))o.fn();flush();};
 const event=target=>({target,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}});
 function click(id){const e=event(nodes[id]);for(const fn of nodes.combat.listeners.click||[]){fn(e);if(e.stopped)return e;}if(!nodes[id].disabled)nodes[id].onclick(e);flush();return e;}
 const enemy=()=>nodes['combat-display'].children[1];
 const numbers=()=>records.filter(r=>r.kind==='number');
 const rewards=()=>bodyChildren.filter(n=>n.id==='combat-reward-feedback');
 return {state,player,monster,nodes,enemy,click,tick,notify,env,document,numbers,records,liveFX,rewards,levelupChoice,levelupBox,bossDialog,rendererInstance};
}
test('850ms constant',()=>assert.equal(COMBAT_FINISH_MS,850));
test('kill then reward survives finish and level-up',()=>{const h=setup();h.click('attack');h.notify(h.nodes.combat);assert.equal(h.env.calls,1);assert.deepEqual(h.numbers().map(n=>n.args[0]),['-20']);assert.equal(h.enemy().attrs['data-defeated'],'true');assert.equal(h.rewards().length,1);assert.equal(h.rewards()[0].textContent,'Sieg · +20 EP');h.tick(850);assert.equal(h.nodes.combat.classList.contains('hidden'),true);assert.equal(h.liveFX.size,0);assert.equal(h.numbers().length,1);assert.equal(h.rewards().length,1);h.document.body.append(h.levelupChoice);h.notify(h.document.body);assert.equal(h.rewards()[0].parentElement,h.levelupBox);h.rendererInstance.text('+20 EP',h.monster.x,h.monster.y);h.notify(h.document.body);assert.equal(h.rewards().length,1);h.tick(400);assert.equal(h.rewards().length,0);});
test('boss loot keeps reward visible',()=>{const h=setup();h.click('attack');h.notify(h.nodes.combat);h.tick(850);h.bossDialog.attrs.open='true';h.notify(h.document.body);assert.equal(h.rewards().length,1);});
console.log(JSON.stringify({checks,passed:checks,scope:'Actual combat-effects.js and combat-reward-feedback.js in one VM; DOM, actions, FX and clocks are test doubles. No browser/Firebase/end-to-end gameplay.'}));
