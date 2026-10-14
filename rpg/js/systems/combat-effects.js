import { state } from '../core/state.js';
import { ITEMS } from '../data/items.js';
import { sound } from './audio.js';
import { drawCharacter } from '../world/character.js';
function setup(){queueMicrotask(()=>{
 const el=id=>document.getElementById(id),combat=el('combat');
 const style=document.createElement('style');style.textContent=`
#combat-info{display:none!important}#combat-display{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;min-width:0;padding:10px;background:#1b1017;border:1px solid #693040;border-radius:14px}
.battle-unit{min-width:0;position:relative;overflow-wrap:anywhere}.battle-unit h3{font-size:14px;margin:0 0 4px}.battle-unit canvas{width:72px;height:72px;display:block;margin:auto;image-rendering:pixelated}.battle-meter{height:12px;min-height:12px;display:block;background:#08090e;border:1px solid #63404a;border-radius:6px;overflow:hidden}.battle-meter>span{display:block;height:100%;background:linear-gradient(90deg,#a61d36,#ff6772);transition:width .35s}.battle-meter.mana>span{background:linear-gradient(90deg,#245ba8,#64c8ff)}.battle-label{font-size:12px;display:block;margin:4px 0}.battle-values{font-size:11px;color:#f3dcaa;margin-top:5px}
#battle-fx{position:fixed;inset:0;z-index:145;pointer-events:none;overflow:hidden}.battle-float{position:absolute;font:bold 24px Georgia,serif;text-shadow:0 2px 4px #000;animation:battleFloat .85s ease-out forwards;white-space:nowrap}.battle-effect{position:absolute;font-size:44px;animation:battleBurst .65s ease-out forwards;filter:drop-shadow(0 0 8px currentColor)}.battle-projectile{animation:battleFly .5s ease-out forwards}.battle-dust{animation:battleDust .75s ease-out forwards}
@keyframes battleFloat{from{opacity:1;transform:translate(-50%,0) scale(.85)}25%{transform:translate(-50%,-12px) scale(1.1)}to{opacity:0;transform:translate(-50%,-65px) scale(1)}}
@keyframes battleBurst{from{opacity:1;transform:translate(-50%,-50%) scale(.4)}to{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}
@keyframes battleFly{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy)))}}
@keyframes battleDust{from{opacity:1;transform:translate(-50%,-50%) scale(.5)}to{opacity:0;transform:translate(-90%,-50%) scale(2)}}
@media(prefers-reduced-motion:reduce){.battle-float,.battle-effect{animation:none;transform:translate(-50%,-50%)}.battle-meter>span{transition:none}}
@media(max-height:480px){.battle-unit canvas{width:40px;height:40px}.battle-unit h3{font-size:12px}.battle-label{font-size:11px;margin:2px 0}#combat-display{padding:5px;gap:6px}}
`;document.head.append(style);
 const display=document.createElement('div');display.id='combat-display';
 function unit(side){const box=document.createElement('div');box.className='battle-unit';box.innerHTML=`<h3></h3><canvas width="96" height="96" aria-hidden="true"></canvas><span class="battle-label hp-label"></span><div class="battle-meter"><span></span></div>${side==='hero'?'<span class="battle-label mp-label"></span><div class="battle-meter mana"><span></span></div>':''}<div class="battle-values"></div>`;display.append(box);return box;}
 const hero=unit('hero'),enemy=unit('enemy');el('combat-info').after(display);
 const fx=document.createElement('div');fx.id='battle-fx';fx.setAttribute('aria-hidden','true');document.body.append(fx);
 let busy=false,closing=false,shownMonster=null;
 function stats(p){let a=p.atk,d=p.def;for(const id of Object.values(p.equipped||{})){const it=ITEMS[id];if(!it)continue;if(it.type==='weapon'||it.stat==='atk')a+=it.val||0;else if(['armor','shield','helmet','boots'].includes(it.type))d+=it.val||0;}return{a,d};}
 function bar(box,v,max,kind){v=Math.max(0,Number(v)||0);max=Math.max(0,Number(max)||0);box.querySelector(`.${kind}-label`).textContent=`${kind==='hp'?'TP':'MP'}: ${v} / ${max}`;box.querySelector(kind==='hp'?'.battle-meter>span':'.battle-meter.mana>span').style.width=`${max?Math.min(100,v/max*100):0}%`;}
 function refresh(){const p=state.player,m=state.activeMonster||shownMonster;if(!m)return;if(state.inCombat)shownMonster=m;const s=stats(p);hero.querySelector('h3').textContent=`${p.name} · LVL ${p.level}`;enemy.querySelector('h3').textContent=m.name;bar(hero,p.hp,p.maxHp,'hp');bar(hero,p.mp,p.maxMp,'mp');bar(enemy,m.hp,m.maxHp,'hp');hero.querySelector('.battle-values').textContent=`ATK ${s.a} · DEF ${s.d}`;enemy.querySelector('.battle-values').textContent=`ATK ${m.atk} · DEF ${m.def}`;const hc=hero.querySelector('canvas').getContext('2d');hc.clearRect(0,0,96,96);drawCharacter(hc,p,0,0,96);const ec=enemy.querySelector('canvas').getContext('2d');ec.clearRect(0,0,96,96);ec.fillStyle=m.color||'#e53935';ec.beginPath();ec.arc(48,48,28,0,Math.PI*2);ec.fill();ec.fillStyle='#ffe082';ec.fillRect(34,39,7,6);ec.fillRect(55,39,7,6);if(busy)document.querySelectorAll('.combat-buttons button').forEach(b=>b.disabled=true);}
 function point(box){const r=box.querySelector('canvas').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};}
 function effect(text,pos,color,type='',target=null){const node=document.createElement('span');node.className=`battle-effect ${type}`;node.textContent=text;node.style.left=`${pos.x}px`;node.style.top=`${pos.y}px`;node.style.color=color;if(target){node.style.setProperty('--dx',`${target.x-pos.x}px`);node.style.setProperty('--dy',`${target.y-pos.y}px`);}fx.append(node);setTimeout(()=>node.remove(),850);}
 function number(text,pos,color,offset=0){const node=document.createElement('span');node.className='battle-float';node.textContent=text;node.style.left=`${pos.x+offset}px`;node.style.top=`${pos.y}px`;node.style.color=color;fx.append(node);setTimeout(()=>node.remove(),900);}
 combat.addEventListener('click',e=>{if(busy){e.preventDefault();e.stopImmediatePropagation();}},true);
 window.addEventListener('keydown',e=>{if(busy){e.preventDefault();e.stopImmediatePropagation();}},true);
 new MutationObserver(()=>{if(busy&&combat.classList.contains('hidden')){closing=true;combat.classList.remove('hidden');}refresh();}).observe(combat,{attributes:true,attributeFilter:['class']});
 new MutationObserver(refresh).observe(el('combat-info'),{childList:true});
 for(const id of ['attack','fire','heal','flee']){
  const button=el(id),original=button.onclick;
  button.onclick=function(e){
   if(busy||!state.inCombat||!state.activeMonster)return;
   if(id==='fire'&&state.player.mp<8)return;
   if(id==='heal'&&!(state.player.inventory||[]).some(x=>x.id==='health_potion'&&x.count>0))return;
   refresh();const hp=point(hero),mp=point(enemy),p=state.player,m=state.activeMonster,before={hp:p.hp,mp:p.mp,mhp:m.hp};
   busy=true;closing=false;const events=[],gfx=window.__rpg?.renderer,oldText=gfx?.text,oldPotion=sound.potion;
   if(gfx)gfx.text=function(text,x,y,...rest){if(/^(KRIT -|-)\d+/.test(text))events.push({text,hero:x===p.x&&y===p.y});return oldText.call(this,text,x,y,...rest);};
   sound.potion=function(...args){const amount=Math.max(0,p.hp-before.hp);if(amount)events.push({text:`+${amount} TP`,hero:true,heal:true});return oldPotion.apply(this,args);};
   try{original.call(this,e);}finally{if(gfx)gfx.text=oldText;sound.potion=oldPotion;}
   refresh();
   if(id==='attack'&&m.hp<before.mhp)effect(p.equipped?.mainhand==='arcane_staff'?'✦':'╱',hp,'#ffe082','battle-projectile',mp);
   if(id==='fire'&&p.mp!==before.mp)effect('🔥',hp,'#ff9b43','battle-projectile',mp);
   if(id==='heal')effect('✚',hp,'#72e599');
   let i=0;for(const event of events){number(event.text,event.hero?hp:mp,event.heal?'#79f0a2':event.hero?'#ff6878':'#ffd45c',i++*8);if(!event.heal)effect('✧',event.hero?hp:mp,event.hero?'#ff6878':'#ffc85c');}
   if(state.inCombat&&el('combat-log').textContent.includes('weichst'))number('AUSGEWICHEN',hp,'#c0b7ff');
   if(id==='flee'){if(!state.inCombat&&p.hp>0)effect('💨',hp,'#d6c3a1','battle-dust');else number('FLUCHT GESCHEITERT',hp,'#ffc4c7');}
   if(m.hp<=0){
    const ranks=p.skillTree||{};
    if(ranks.bloodlust){const amount=Math.min(Math.max(0,p.maxHp-before.hp),Math.floor(p.maxHp*.05));effect('🩸',hp,'#d94e77');if(amount)number(`+${amount} TP`,hp,'#79f0a2',-18);}
    if(ranks.arcane_return){const used=id==='fire'?8:0,amount=Math.min(3,Math.max(0,p.maxMp-(before.mp-used)));effect('✦',hp,'#77cfff');if(amount)number(`+${amount} MP`,hp,'#77cfff',18);}
   }
   setTimeout(()=>{busy=false;el('attack').disabled=false;el('flee').disabled=false;el('fire').disabled=p.mp<8;el('heal').disabled=!(p.inventory||[]).some(x=>x.id==='health_potion'&&x.count>0);if(closing||!state.inCombat)combat.classList.add('hidden');else refresh();},850);
  };
 }
 refresh();
});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
