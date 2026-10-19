import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(process.argv[2]||new URL('../js/systems/combat-effects.js',import.meta.url),'utf8');
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
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.listeners={};this.style={};this.className='';this.disabled=false;this.hidden=false;this.parts={};this.classList={contains:n=>this.className.split(' ').includes(n),add:n=>{if(!this.classList.contains(n))this.className+=' '+n;},remove:n=>{this.className=this.className.split(' ').filter(x=>x!==n).join(' ');}};}
  set id(value){this._id=value;nodes[value]=this;}get id(){return this._id;}
  set innerHTML(value){this._html=value;if(value.includes('<h3>')){
   for(const key of ['h3','canvas','.hp-label','.mp-label','.battle-meter>span','.battle-meter.mana>span','.battle-values']){const n=new Element(key==='canvas'?'canvas':'span');n.parentElement=this;this.parts[key]=n;}
   if(value.includes('battle-defeat-label')){const label=new Element('span');label.textContent='Besiegt';label.hidden=true;this.parts['.battle-defeat-label']=label;}
  }}get innerHTML(){return this._html||'';}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
  append(node){node.parentElement=this;this.children.push(node);}
  after(node){nodes[node.id]=node;}
  querySelector(selector){return this.parts[selector]||null;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  contains(node){return this===node||this.children.some(n=>n.contains(node))||Object.values(this.parts).includes(node);}
  getContext(){return {clearRect(){}};}
  getBoundingClientRect(){const enemy=this.parentElement===nodes['combat-display']?.children[1];return {left:enemy?260:20,top:30,width:112,height:112};}
 }
 for(const id of ['combat','combat-info','game','stage','attack','fire','heal','mana','flee']){const node=new Element(['attack','fire','heal','mana','flee'].includes(id)?'button':'div');node.id=id;}
 const body=new Element('body'),head=new Element('head');
 const document={readyState:'complete',hidden:false,body,head,getElementById:id=>nodes[id]||null,createElement:tag=>new Element(tag),querySelector:()=>env.urgent?{}:null,querySelectorAll:()=>[],addEventListener:(type,fn)=>{(docEvents[type]??=[]).push(fn);}};
 const monster={id:'rat',name:'Ratte',hp:options.hp??10,maxHp:options.hp??10,x:2,y:1,xp:20,gold:5,atk:2,def:1};
 const player={name:'Held',hp:50,maxHp:50,mp:options.mp??30,maxMp:30,atk:10,def:3,level:1,xp:0,gold:0,inventory:options.emptyBag?[]:[{id:'health_potion',count:1},{id:'mana_potion',count:1}],equipped:{mainhand:options.staff?'staff':'sword'},x:1,y:1};
 const state={player,activeMonster:monster,world:{tiles:{},monsters:[monster]},currentSlot:0,user:{uid:'u'},inCombat:true};
 const renderer={text(){}};const oldText=renderer.text;
 const sound={potion(){}};const oldPotion=sound.potion;
 for(const id of ['attack','fire','heal','mana','flee'])nodes[id].onclick=function(){
  env.calls++;if(options.throwAction)throw new Error('action failed');
  if(id==='heal'){player.hp=Math.min(player.maxHp,player.hp+10);sound.potion();return;}
  if(id==='mana'){player.mp=Math.min(player.maxMp,player.mp+25);sound.potion();return;}
  if(id==='flee'){state.inCombat=false;nodes.combat.classList.add('hidden');return;}
  if(id==='fire')player.mp-=8;
  const damage=options.damage??20;monster.hp-=damage;
  if(!options.noText&&typeof renderer.text==='function')renderer.text(options.critical?`KRIT -${damage}`:`-${damage}`,monster.x,monster.y);
  if(monster.hp<=0){state.inCombat=false;state.world.monsters=[];player.xp+=monster.xp;player.gold+=monster.gold;nodes.combat.classList.add('hidden');if(options.urgentAfterAction)env.urgent=true;}
 };
 if(options.missingText)renderer.text=null;
 const record=(kind,...args)=>{records.push({kind,args,at:now});};
 const fx={clear(){for(const id of [...fxTimers])cancel(id);liveFX.clear();record('clear');},later,number(...args){record('number',...args);const n={};liveFX.add(n);later(()=>liveFX.delete(n),690);},hit:(...a)=>record('hit',...a),slash:(...a)=>record('slash',...a),projectile:(...a)=>record('projectile',...a),heal:(...a)=>record('heal',...a),escape:(...a)=>record('escape',...a),react:(...a)=>record('react',...a)};
 const window={__rpg:{renderer},addEventListener:(type,fn)=>{(windowEvents[type]??=[]).push(fn);}};
 vm.runInNewContext(source.replace(/^import .*;\n/gm,''),{state,ITEMS:{sword:{name:'Schwert',type:'weapon',val:9},staff:{name:'Stab',type:'weapon',val:9}},sound,drawCharacter(){},drawMonsterPortrait(){},createBattleFX:()=>fx,COMBAT_FINISH_MS,document,window,setTimeout:schedule,clearTimeout:cancel,queueMicrotask:fn=>micro.push(fn),MutationObserver:class{constructor(fn){this.fn=fn;}observe(node){observers.push({node,fn:this.fn});}},matchMedia:()=>({matches:env.reduced}),console});flush();
 const notify=node=>{for(const o of observers.filter(o=>o.node===node))o.fn();flush();};
 const event=target=>({target,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}});
 function click(id){const e=event(nodes[id]);for(const fn of nodes.combat.listeners.click||[]){fn(e);if(e.stopped)return e;}if(!nodes[id].disabled)nodes[id].onclick(e);flush();return e;}
 const emit=(type,target=body)=>{const e=event(target);for(const fn of windowEvents[type]||[])fn(e);for(const fn of docEvents[type]||[])fn(e);flush();return e;};
 const enemy=()=>nodes['combat-display'].children[1];
 const numbers=()=>records.filter(r=>r.kind==='number');
 return {state,player,monster,nodes,enemy,click,tick,notify,emit,env,document,renderer,sound,oldText,oldPotion,numbers,records,liveFX,timers};
}
if(process.argv[3]==='baseline'){
 const h=setup();h.click('fire');assert.equal(h.numbers().length,1);assert.equal(h.numbers()[0].at,0);assert.equal(h.enemy().querySelector('.battle-defeat-label'),null);
 console.log('Baseline verified: lethal fire number emitted immediately at launch; no defeat label.');process.exit(0);
}
test('850ms constant',()=>assert.equal(COMBAT_FINISH_MS,850));
test('last melee damage once',()=>{const h=setup();h.click('attack');assert.deepEqual(h.numbers().map(n=>n.args[0]),['-20']);assert.equal(h.env.calls,1);});
test('critical text preserved',()=>{const h=setup({critical:true});h.click('attack');assert.equal(h.numbers()[0].args[0],'KRIT -20');});
test('fallback number without renderer text',()=>{const h=setup({noText:true});h.click('attack');assert.equal(h.numbers().length,1);});
test('visible defeat',()=>{const h=setup();h.click('attack');assert.equal(h.enemy().attrs['data-defeated'],'true');assert.equal(h.enemy().querySelector('.battle-defeat-label').hidden,false);});
test('open at 849, closed at 850',()=>{const h=setup();h.click('attack');h.tick(849);assert.equal(h.nodes.combat.classList.contains('hidden'),false);h.tick(1);assert.equal(h.nodes.combat.classList.contains('hidden'),true);});
test('cleanup exactly at finish',()=>{const h=setup();h.click('attack');h.tick(850);assert.equal(h.liveFX.size,0);assert.equal(h.enemy().querySelector('.battle-defeat-label').hidden,true);});
test('fire last number at impact, not twice',()=>{const h=setup();h.click('fire');assert.equal(h.numbers().length,0);h.tick(199);assert.equal(h.numbers().length,0);h.tick(1);assert.equal(h.numbers().length,1);assert.equal(h.numbers()[0].at,200);h.tick(650);assert.equal(h.numbers().length,1);});
test('fire defeat follows impact',()=>{const h=setup();h.click('fire');assert.equal(h.enemy().querySelector('.battle-defeat-label').hidden,true);h.tick(200);assert.equal(h.enemy().querySelector('.battle-defeat-label').hidden,false);});
test('staff ranged kill supported',()=>{const h=setup({staff:true});h.click('attack');assert.equal(h.numbers().length,0);h.tick(200);assert.equal(h.numbers().length,1);assert.equal(h.enemy().attrs['data-defeated'],'true');});
test('nonfatal melee unchanged',()=>{const h=setup({hp:50});h.click('attack');assert.equal(h.state.inCombat,true);assert.equal(h.numbers().length,1);assert.equal(h.enemy().querySelector('.battle-defeat-label').hidden,true);h.tick(850);assert.equal(h.nodes.combat.classList.contains('hidden'),false);});
test('nonfatal ranged number timing unchanged',()=>{const h=setup({hp:50});h.click('fire');assert.equal(h.numbers().length,1);assert.equal(h.numbers()[0].at,0);});
test('double click cannot duplicate reward',()=>{const h=setup();h.click('attack');h.click('fire');assert.equal(h.env.calls,1);assert.equal(h.player.xp,20);assert.equal(h.player.gold,5);});
test('capture blocks combat click',()=>{const h=setup();h.click('attack');assert.equal(h.click('fire').prevented,true);});
test('keyboard blocked while phase busy',()=>{const h=setup();h.click('attack');assert.equal(h.emit('keydown').prevented,true);});
test('no mana no turn',()=>{const h=setup({mp:0});h.click('fire');assert.equal(h.env.calls,0);assert.equal(h.numbers().length,0);});
test('empty potion no turn',()=>{const h=setup({emptyBag:true});h.click('heal');assert.equal(h.env.calls,0);});
test('priority dialog interrupts immediately',()=>{const h=setup({urgentAfterAction:true});h.click('attack');assert.equal(h.nodes.combat.classList.contains('hidden'),true);assert.equal(h.numbers().length,0);assert.equal(h.enemy().querySelector('.battle-defeat-label').hidden,true);});
for(const change of ['slot','user','tiles'])test('context switch '+change,()=>{const h=setup();h.click('fire');if(change==='slot')h.state.currentSlot++;if(change==='user')h.state.user={uid:'other'};if(change==='tiles')h.state.world.tiles={};h.notify(h.nodes.game);h.tick(1000);assert.equal(h.numbers().length,0);assert.equal(h.liveFX.size,0);});
test('background cancels pending effects',()=>{const h=setup();h.click('fire');h.document.hidden=true;h.emit('visibilitychange');h.tick(1000);assert.equal(h.numbers().length,0);assert.equal(h.liveFX.size,0);});
test('resize cancels delayed coordinates',()=>{const h=setup();h.click('fire');h.emit('resize');h.tick(850);assert.equal(h.numbers().length,0);assert.equal(h.nodes.combat.classList.contains('hidden'),true);});
test('exception restores original hooks',()=>{const h=setup({throwAction:true});assert.throws(()=>h.click('attack'));assert.equal(h.renderer.text,h.oldText);assert.equal(h.sound.potion,h.oldPotion);assert.equal(h.liveFX.size,0);});
test('reduced motion keeps duration but no projectile wait',()=>{const h=setup({reduced:true});h.click('fire');h.tick(0);assert.equal(h.numbers().length,1);assert.equal(h.enemy().attrs['data-defeated'],'true');h.tick(849);assert.equal(h.nodes.combat.classList.contains('hidden'),false);h.tick(1);assert.equal(h.nodes.combat.classList.contains('hidden'),true);});
test('missing renderer uses fallback',()=>{const h=setup({missingText:true});h.click('attack');assert.equal(h.numbers().length,1);assert.equal(h.renderer.text,null);});
test('flee is not defeat',()=>{const h=setup();h.click('flee');assert.equal(h.enemy().querySelector('.battle-defeat-label').hidden,true);assert.equal(h.player.xp,0);});
test('no reward changes during timer',()=>{const h=setup();h.click('fire');const before=JSON.stringify(h.state);h.tick(850);assert.equal(JSON.stringify(h.state),before);});
test('new encounter has no old defeat badge',()=>{const h=setup();h.click('attack');h.tick(850);h.state.activeMonster={...h.monster,hp:50};h.state.world.monsters=[h.state.activeMonster];h.state.inCombat=true;h.nodes.combat.classList.remove('hidden');h.notify(h.nodes.combat);assert.equal(h.enemy().querySelector('.battle-defeat-label').hidden,true);});
test('mana feedback and action lock',()=>{const h=setup({mp:0});h.click('mana');assert.equal(h.player.mp,25);assert.deepEqual(h.numbers().map(n=>n.args[0]),['+25 MP']);h.click('attack');assert.equal(h.env.calls,1);h.tick(850);assert.equal(h.nodes.mana.disabled,false);});
test('empty mana potion no turn',()=>{const h=setup({emptyBag:true,mp:0});h.click('mana');assert.equal(h.env.calls,0);});
test('mana gain respects cap',()=>{const h=setup({mp:28});h.click('mana');assert.deepEqual(h.numbers().map(n=>n.args[0]),['+2 MP']);});
console.log(JSON.stringify({checks,passed:checks,scope:'Actual combat-effects.js in VM; DOM, core actions, FX and clocks are test doubles. No browser/Firebase/end-to-end gameplay.'}));
