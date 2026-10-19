import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../js/systems/combat-effects.js',import.meta.url),'utf8');
const timingSource=await readFile(new URL('../js/systems/combat-timing.js',import.meta.url),'utf8');
const {COMBAT_FINISH_MS}=await import('data:text/javascript;base64,'+Buffer.from(timingSource).toString('base64'));
let checks=0;const test=(name,fn)=>{try{fn();checks++;}catch(e){e.message=name+': '+e.message;throw e;}};
function setup(options={}){
 let now=0,next=0;const timers=new Map(),fxTimers=new Set(),micro=[],observers=[],windowEvents={},docEvents={},records=[],liveFX=new Set(),nodes={};
 const env={urgent:false,calls:0,reduced:!!options.reduced};
 const schedule=(fn,ms)=>{const id=++next;timers.set(id,{fn,at:now+ms});return id;};
 const cancel=id=>{timers.delete(id);fxTimers.delete(id);};
 const later=(fn,ms)=>{const id=schedule(()=>{fxTimers.delete(id);fn();},ms);fxTimers.add(id);return id;};
 const flush=()=>{while(micro.length)micro.shift()();};
 function tick(ms){const end=now+ms;while(true){const ready=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at);if(!ready.length)break;const [id,t]=ready[0];timers.delete(id);now=t.at;t.fn();flush();}now=end;}
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.listeners={};this.style={};this.className='';this.disabled=false;this.hidden=false;this.parts={};this.dataset={};this.parentElement=null;this.classList={contains:n=>this.className.split(' ').includes(n),add:n=>{if(!this.classList.contains(n))this.className+=' '+n;},remove:n=>{this.className=this.className.split(' ').filter(x=>x!==n).join(' ');}};}
  set id(value){this._id=value;nodes[value]=this;}get id(){return this._id;}
  set innerHTML(value){this._html=value;if(value.includes('<h3>')){for(const key of ['h3','canvas','.hp-label','.mp-label','.battle-meter>span','.battle-meter.mana>span','.battle-values']){const n=new Element(key==='canvas'?'canvas':'span');n.parentElement=this;this.parts[key]=n;}if(value.includes('battle-defeat-label')){const label=new Element('span');label.textContent='Besiegt';label.hidden=true;this.parts['.battle-defeat-label']=label;}}}get innerHTML(){return this._html||'';}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
  append(node){node.parentElement=this;this.children.push(node);}
  after(node){nodes[node.id]=node;}
  querySelector(selector){return this.parts[selector]||null;}
  querySelectorAll(selector){if(selector==='.ability-btn')return this.abilityButtons||[];return [];}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  contains(node){return this===node||this.children.some(n=>n.contains(node))||Object.values(this.parts).includes(node);}
  matches(selector){return selector==='.ability-btn'&&this.className.split(' ').includes('ability-btn');}
  closest(selector){let n=this;while(n){if(n.matches&&n.matches(selector))return n;n=n.parentElement;}return null;}
  getContext(){return {clearRect(){}};}
  getBoundingClientRect(){const enemy=this.parentElement===nodes['combat-display']?.children[1];return {left:enemy?260:20,top:30,width:112,height:112};}
 }
 for(const id of ['combat','combat-info','game','stage','attack','fire','heal','flee']){const node=new Element(['attack','fire','heal','flee'].includes(id)?'button':'div');node.id=id;}
 const body=new Element('body'),head=new Element('head');
 const monster={id:'rat',name:'Ratte',hp:options.hp??10,maxHp:options.hp??10,x:2,y:1,xp:20,gold:5,atk:2,def:1};
 const player={name:'Held',hp:50,maxHp:50,mp:options.mp??30,maxMp:30,atk:10,def:3,level:1,xp:0,gold:0,inventory:[{id:'health_potion',count:1}],equipped:{mainhand:'sword'},x:1,y:1,buffs:{shield:0,block:false,evade:false},cooldowns:{}};
 const state={player,activeMonster:monster,world:{tiles:{},monsters:[monster]},currentSlot:0,user:{uid:'u'},inCombat:true};
 const renderer={text(){}};const oldText=renderer.text;
 const abilities=['power_strike','poison','frost_bolt','mana_surge'].map(id=>{const b=new Element('button');b.id='ability-'+id;b.className='ability-btn';b.dataset.ability=id;b.parentElement=nodes.combat;return b;});
 nodes.combat.abilityButtons=abilities;
 const record=(kind,...args)=>{records.push({kind,args,at:now});};
 const fx={clear(){for(const id of [...fxTimers])cancel(id);liveFX.clear();record('clear');},later,number(...args){record('number',...args);const n={};liveFX.add(n);later(()=>liveFX.delete(n),690);},hit:(...a)=>record('hit',...a),slash:(...a)=>record('slash',...a),projectile:(...a)=>record('projectile',...a),heal:(...a)=>record('heal',...a),escape:(...a)=>record('escape',...a),react:(...a)=>record('react',...a)};
 const window={__rpg:{renderer},addEventListener:(type,fn)=>{(windowEvents[type]??=[]).push(fn);}};
 const document={readyState:'complete',hidden:false,body,head,getElementById:id=>nodes[id]||null,createElement:tag=>new Element(tag),querySelector:()=>env.urgent?{}:null,querySelectorAll:()=>[],addEventListener:(type,fn)=>{(docEvents[type]??=[]).push(fn);}};
 for(const b of abilities){const id=b.dataset.ability;b.onclick=function(){
  env.calls++;
  if(id==='power_strike'){monster.hp-=20;renderer.text('-20',monster.x,monster.y);}
  else if(id==='poison'){monster.dot={turns:3,dmg:5};}
  else if(id==='frost_bolt'){player.mp-=6;monster.hp-=15;renderer.text('-15',monster.x,monster.y);}
  else if(id==='mana_surge'){player.mp=Math.min(player.maxMp,player.mp+20);}
  if(monster.dot&&monster.dot.turns>0){monster.hp-=monster.dot.dmg;monster.dot.turns--;renderer.text(`-${monster.dot.dmg}`,monster.x,monster.y);}
  if(monster.hp<=0){state.inCombat=false;state.world.monsters=[];player.xp+=monster.xp;player.gold+=monster.gold;nodes.combat.classList.add('hidden');if(options.urgentAfterAction)env.urgent=true;}
 };}
 vm.runInNewContext(source.replace(/^import .*;\n/gm,''),{state,ITEMS:{},sound:{potion(){}},drawCharacter(){},drawMonsterPortrait(){},createBattleFX:()=>fx,COMBAT_FINISH_MS,document,window,setTimeout:schedule,clearTimeout:cancel,queueMicrotask:fn=>micro.push(fn),MutationObserver:class{constructor(fn){this.fn=fn;}observe(node){observers.push({node,fn:this.fn});}},matchMedia:()=>({matches:env.reduced}),console});flush();
 const notify=node=>{for(const o of observers.filter(o=>o.node===node))o.fn();flush();};
 const event=target=>({target,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}});
 function click(nodeOrId){const node=typeof nodeOrId==='string'?nodes[nodeOrId]:nodeOrId;const e=event(node);for(const fn of nodes.combat.listeners.click||[]){fn(e);if(e.stopped)return e;}if(!node.disabled)node.onclick(e);flush();return e;}
 const enemy=()=>nodes['combat-display'].children[1];
 const numbers=()=>records.filter(r=>r.kind==='number');
 return {state,player,monster,nodes,enemy,click,tick,notify,env,document,numbers,records,liveFX,abilities};
}
test('850ms constant',()=>assert.equal(COMBAT_FINISH_MS,850));
test('lethal power strike finishes in 850ms',()=>{const h=setup();h.click(h.abilities[0]);assert.equal(h.env.calls,1);assert.deepEqual(h.numbers().map(n=>n.args[0]),['-20']);assert.equal(h.enemy().attrs['data-defeated'],'true');h.tick(849);assert.equal(h.nodes.combat.classList.contains('hidden'),false);h.tick(1);assert.equal(h.nodes.combat.classList.contains('hidden'),true);});
test('poison tick kill finishes in 850ms',()=>{const h=setup({hp:5});h.click(h.abilities[1]);assert.deepEqual(h.numbers().map(n=>n.args[0]),['-5']);assert.equal(h.enemy().attrs['data-defeated'],'true');h.tick(850);assert.equal(h.nodes.combat.classList.contains('hidden'),true);});
test('nonfatal frost bolt shows number immediately',()=>{const h=setup({hp:50});h.click(h.abilities[2]);assert.equal(h.numbers().length,1);assert.equal(h.state.inCombat,true);h.tick(850);assert.equal(h.nodes.combat.classList.contains('hidden'),false);});
test('mana surge reports restored mana',()=>{const h=setup({mp:0});h.click(h.abilities[3]);assert.deepEqual(h.numbers().map(n=>n.args[0]),['+20 MP']);h.tick(850);});
test('ability click blocked while phase busy',()=>{const h=setup();h.click(h.abilities[0]);const e=h.click(h.abilities[1]);assert.equal(e.prevented,true);assert.equal(h.env.calls,1);});
test('priority dialog interrupts ability phase',()=>{const h=setup({urgentAfterAction:true});h.click(h.abilities[0]);assert.equal(h.nodes.combat.classList.contains('hidden'),true);assert.equal(h.numbers().length,0);});
console.log(JSON.stringify({checks,passed:checks,scope:'Actual combat-effects.js in VM; ability actions, poison tick, FX and clocks are test doubles. No browser/Firebase/end-to-end gameplay.'}));
