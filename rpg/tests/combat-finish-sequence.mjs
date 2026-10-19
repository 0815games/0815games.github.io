import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const effectsSource=await readFile(new URL('../js/systems/combat-effects.js',import.meta.url),'utf8');
const timingSource=await readFile(new URL('../js/systems/combat-timing.js',import.meta.url),'utf8');
const {COMBAT_FINISH_MS}=await import('data:text/javascript;base64,'+Buffer.from(timingSource).toString('base64'));
let checks=0;const test=(name,fn)=>{try{fn();checks++;}catch(e){e.message=name+': '+e.message;throw e;}};
function setup(){
 let now=0,next=0;const timers=new Map(),fxTimers=new Set(),micro=[],observers=[],records=[],liveFX=new Set(),nodes={};
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
  querySelectorAll(){return [];}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  contains(node){return this===node||this.children.some(n=>n.contains(node))||Object.values(this.parts).includes(node);}
  getContext(){return {clearRect(){}};}
  getBoundingClientRect(){const enemy=this.parentElement===nodes['combat-display']?.children[1];return {left:enemy?260:20,top:30,width:112,height:112};}
 }
 for(const id of ['combat','combat-info','game','stage','attack','fire','heal','flee']){const node=new Element(['attack','fire','heal','flee'].includes(id)?'button':'div');node.id=id;}
 const body=new Element(),head=new Element();
 const monster={id:'rat',name:'Ratte',hp:10,maxHp:10,x:2,y:1,xp:20,gold:5,atk:2,def:1};
 const player={name:'Held',hp:50,maxHp:50,mp:30,maxMp:30,atk:10,def:3,level:1,xp:0,gold:0,inventory:[{id:'health_potion',count:1}],equipped:{mainhand:'sword'},x:1,y:1,buffs:{shield:0,block:false,evade:false},cooldowns:{}};
 const state={player,activeMonster:monster,world:{tiles:{},monsters:[monster]},currentSlot:0,user:{uid:'u'},inCombat:true};
 const renderer={text(){}};const oldText=renderer.text;
 const record=(kind,...args)=>{records.push({kind,args,at:now});};
 const fx={clear(){for(const id of [...fxTimers])cancel(id);liveFX.clear();record('clear');},later,number(...args){record('number',...args);const n={};liveFX.add(n);later(()=>liveFX.delete(n),690);},hit:(...a)=>record('hit',...a),slash:(...a)=>record('slash',...a),projectile:(...a)=>record('projectile',...a),heal:(...a)=>record('heal',...a),escape:(...a)=>record('escape',...a),react:(...a)=>record('react',...a)};
 const window={__rpg:{renderer},addEventListener(){}};
 const document={readyState:'complete',hidden:false,body,head,getElementById:id=>nodes[id]||null,createElement:tag=>new Element(tag),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
 nodes.attack.onclick=function(){monster.hp-=20;renderer.text('-20',monster.x,monster.y);if(monster.hp<=0){state.inCombat=false;state.world.monsters=[];nodes.combat.classList.add('hidden');}};
 const sandbox={state,ITEMS:{sword:{name:'Schwert',type:'weapon',val:9}},sound:{potion(){}},drawCharacter(){},drawMonsterPortrait(){},createBattleFX:()=>fx,COMBAT_FINISH_MS,document,window,setTimeout:schedule,clearTimeout:cancel,queueMicrotask:fn=>micro.push(fn),MutationObserver:class{constructor(fn){this.fn=fn;}observe(node){observers.push({node,fn:this.fn});}},matchMedia:()=>({matches:false}),console};
 vm.runInNewContext(effectsSource.replace(/^import .*;\n/gm,''),sandbox);flush();
 const notify=node=>{for(const o of observers.filter(o=>o.node===node))o.fn();flush();};
 const event=target=>({target,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}});
 function click(id){const e=event(nodes[id]);for(const fn of nodes.combat.listeners.click||[]){fn(e);if(e.stopped)return e;}if(!nodes[id].disabled)nodes[id].onclick(e);flush();return e;}
 const enemy=()=>nodes['combat-display'].children[1];
 const numbers=()=>records.filter(r=>r.kind==='number');
 return {state,player,monster,nodes,enemy,click,tick,notify,numbers,records,liveFX,renderer,oldText};
}
test('850ms constant',()=>assert.equal(COMBAT_FINISH_MS,850));
test('combat finish completes at 850ms',()=>{const h=setup();h.click('attack');assert.deepEqual(h.numbers().map(n=>n.args[0]),['-20']);assert.equal(h.enemy().attrs['data-defeated'],'true');h.tick(849);assert.equal(h.nodes.combat.classList.contains('hidden'),false);h.tick(1);assert.equal(h.nodes.combat.classList.contains('hidden'),true);assert.equal(h.liveFX.size,0);});
test('renderer hook restored after action',()=>{const h=setup();h.click('attack');h.tick(850);assert.equal(h.renderer.text,h.oldText);});
console.log(JSON.stringify({checks,passed:checks,scope:'Combat finish sequence only; reward, level-up and boss-loot interplay remain separate.'}));
