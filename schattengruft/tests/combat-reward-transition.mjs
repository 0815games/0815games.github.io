import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(process.argv[2]||new URL('../js/systems/combat-reward-feedback.js',import.meta.url),'utf8');
function setup(){
 let now=0,next=0;const timers=new Map(),micro=[],observers=[],events={},env={levelup:null};
 const document={hidden:false,readyState:'complete'};
 class Element{
  constructor(id=''){this.id=id;this.children=[];this.parentNode=null;this.style={};this.textContent='';this.attrs={};this.hidden=false;this.open=false;this.classList={contains:n=>n==='hidden'&&this.hidden};}
  detach(){if(this.parentNode){const p=this.parentNode;p.children.splice(p.children.indexOf(this),1);this.parentNode=null;}}
  append(n){n.detach();n.parentNode=this;this.children.push(n);}
  insertBefore(n,b){n.detach();n.parentNode=this;const index=this.children.indexOf(b);this.children.splice(index<0?0:index,0,n);}
  get firstChild(){return this.children[0]||null;}
  remove(){this.detach();}
  setAttribute(k,v){this.attrs[k]=v;}
  getBoundingClientRect(){return this.id==='combat'?{left:10,top:20,width:300,height:400}:{left:0,top:0,width:400,height:600};}
 }
 const combat=new Element('combat'),game=new Element('game'),boss=new Element('boss-loot-dialog'),body=new Element('body');
 body.append(combat);body.append(game);body.append(boss);
 const walk=n=>[n,...n.children.flatMap(walk)];
 Object.assign(document,{body,getElementById:id=>walk(body).find(n=>n.id===id)||null,createElement:()=>new Element(),querySelector:s=>s==='.levelup-choice .levelup-box'?env.levelup:s==='#boss-loot-dialog[open]'&&boss.open?boss:null,querySelectorAll:()=>[],addEventListener:(t,fn)=>events[t]=fn});
 class Renderer{text(){this.originalCalls=(this.originalCalls||0)+1;}}
 const renderer=new Renderer(),monster={hp:10,xp:35,x:2,y:3},state={player:{},activeMonster:monster,world:{tiles:{},monsters:[monster]},currentSlot:0,user:{uid:'u'},inCombat:true};
 const context={document,state,Renderer,window:{__rpg:{renderer},addEventListener:(t,fn)=>events[t]=fn},MutationObserver:class{constructor(fn){this.fn=fn;}observe(target){observers.push({target,fn:this.fn});}},setTimeout:(fn,ms)=>{const id=++next;timers.set(id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id),queueMicrotask:fn=>micro.push(fn),console};
 const notify=target=>{for(const o of observers.filter(o=>o.target===target))o.fn();};
 const flush=()=>{while(micro.length)micro.shift()();};
 function tick(ms){const end=now+ms;while(true){const sorted=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at);if(!sorted.length)break;const [id,t]=sorted[0];timers.delete(id);now=t.at;t.fn();flush();}now=end;}
 vm.runInNewContext(source.replace(/^import .*;\n/gm,''),context);tick(0);
 function win(){state.inCombat=false;monster.hp=0;state.world.monsters=[];renderer.text('+35 EP',2,3);flush();}
 return {combat,game,boss,body,state,renderer,monster,win,notify,flush,tick,events,env,Element,reward:()=>document.getElementById('combat-reward-feedback'),document};
}
if(process.argv[3]==='baseline'){
 const h=setup();h.win();assert.ok(h.reward());h.tick(850);h.combat.hidden=true;h.notify(h.combat);assert.equal(h.reward(),null);console.log('Baseline reproduced: reward removed at 850ms before its 1250ms expiry.');
}else{
 let checks=0;const check=fn=>{fn();checks++;};
 check(()=>{const h=setup();h.win();assert.equal(h.reward().textContent,'Sieg · +35 EP');});
 check(()=>{const h=setup();h.win();h.tick(850);h.combat.hidden=true;h.notify(h.combat);assert.ok(h.reward());assert.ok(h.reward().style.cssText.includes('left:200px'));});
 check(()=>{const h=setup();h.win();h.tick(850);h.combat.hidden=true;h.notify(h.combat);h.tick(399);assert.ok(h.reward());h.tick(1);assert.equal(h.reward(),null);});
 check(()=>{const h=setup();h.win();const first=h.reward();h.renderer.text('+35 EP',2,3);h.flush();assert.equal(h.reward(),first);assert.equal(h.body.children.filter(n=>n.id==='combat-reward-feedback').length,1);});
 check(()=>{const h=setup();h.win();h.env.levelup=new h.Element();h.body.append(h.env.levelup);h.notify(h.body);assert.equal(h.reward().parentNode,h.env.levelup);});
 check(()=>{const h=setup();h.win();h.env.levelup=new h.Element();h.body.append(h.env.levelup);h.notify(h.body);h.env.levelup.remove();h.env.levelup=null;h.boss.open=true;h.notify(h.boss);assert.equal(h.reward().parentNode,h.boss);});
 check(()=>{const h=setup();h.win();h.boss.open=true;h.notify(h.boss);assert.equal(h.reward().parentNode,h.boss);h.boss.open=false;h.notify(h.boss);assert.equal(h.reward().parentNode,h.body);});
 check(()=>{const h=setup();h.win();h.state.inCombat=true;h.notify(h.combat);assert.equal(h.reward(),null);});
 check(()=>{const h=setup();h.win();h.state.currentSlot=1;h.notify(h.game);assert.equal(h.reward(),null);});
 check(()=>{const h=setup();h.win();h.state.user.uid='other';h.notify(h.game);assert.equal(h.reward(),null);});
 check(()=>{const h=setup();h.win();h.document.hidden=true;h.events.visibilitychange();assert.equal(h.reward(),null);});
 check(()=>{const h=setup();h.win();h.game.hidden=true;h.notify(h.game);assert.equal(h.reward(),null);});
 check(()=>{const h=setup();h.renderer.text('+35 EP',2,3);h.flush();assert.equal(h.reward(),null);assert.equal(h.renderer.originalCalls,1);});
 check(()=>{const h=setup();h.win();const before=JSON.stringify(h.state);h.combat.hidden=true;h.notify(h.combat);h.notify(h.body);assert.equal(JSON.stringify(h.state),before);});
 console.log(JSON.stringify({checks,passed:checks,scope:'Actual reward-feedback module in VM with fake DOM, observers and clocks; no real browser/Firebase'}));
}
