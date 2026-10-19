import { state } from '../core/state.js';
import { ITEMS } from '../data/items.js';
import { sound } from './audio.js';
import { drawCharacter } from '../world/character.js';
import { drawMonsterPortrait } from '../world/monster.js';
import { createBattleFX } from './battle-fx.js?v=0.5.14';
import { COMBAT_FINISH_MS } from './combat-timing.js';
function setup(){queueMicrotask(()=>{
 const el=id=>document.getElementById(id),combat=el('combat');if(!combat||el('combat-display'))return;
 const style=document.createElement('style');style.textContent=`
#combat-info{display:none!important}#combat-display{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;min-width:0;padding:10px;background:#1b1017;border:1px solid #693040;border-radius:14px}
.battle-unit{min-width:0;position:relative;overflow-wrap:anywhere}.battle-unit h3{font-size:14px;margin:0 0 4px}.battle-unit canvas{width:88px;height:88px;display:block;margin:auto;image-rendering:pixelated;background:radial-gradient(circle,#241a2c,#0b0d14 70%);border:1px solid #693040;border-radius:12px}.battle-meter{height:14px;min-height:14px;display:block;background:#08090e;border:1px solid #63404a;border-radius:8px;overflow:hidden}.battle-meter>span{display:block;height:100%;background:linear-gradient(90deg,#a61d36,#ff6772);transition:width .35s}.battle-meter.mana>span{background:linear-gradient(90deg,#245ba8,#64c8ff)}.battle-label{font-size:12px;display:block;margin:4px 0}.battle-values{font-size:12px;color:#f3dcaa;margin-top:5px}.battle-hp-text{font-weight:bold;color:#fff}
@media(prefers-reduced-motion:reduce){.battle-meter>span{transition:none}}
@media(max-height:480px){.battle-unit canvas{width:52px;height:52px}.battle-unit h3{font-size:12px}.battle-label{font-size:11px;margin:2px 0}#combat-display{padding:5px;gap:6px}}
#combat #combat-display .battle-unit[data-defeated="true"] canvas{filter:grayscale(1);opacity:.45;transition:opacity .22s ease}
#combat #combat-display .battle-defeat-label{grid-column:1/-1;color:#ffe3a0;font-weight:700;text-align:center}
#combat #combat-display .battle-defeat-label[hidden]{display:none!important}
@media(prefers-reduced-motion:reduce){#combat #combat-display .battle-unit[data-defeated="true"] canvas{transition:none}}
`;document.head.append(style);
 const display=document.createElement('div');display.id='combat-display';
 function unit(side){const box=document.createElement('div');box.className='battle-unit';box.innerHTML=`<h3></h3><canvas width="112" height="112" aria-hidden="true"></canvas><span class="battle-label hp-label"></span><div class="battle-meter"><span></span></div>${side==='hero'?'<span class="battle-label mp-label"></span><div class="battle-meter mana"><span></span></div>':''}<div class="battle-values"></div>${side==='enemy'?'<span class="battle-defeat-label" role="status" hidden>Besiegt</span>':''}`;display.append(box);return box;}
 const hero=unit('hero'),enemy=unit('enemy');el('combat-info').after(display);
 const fx=createBattleFX(combat);let busy=false,closing=false,shownMonster=null,ticket=null,unlockTimer=null;
 function stats(p){let a=p.atk,d=p.def;for(const id of Object.values(p.equipped||{})){const it=ITEMS[id];if(!it)continue;if(it.type==='weapon'||it.stat==='atk')a+=it.val||0;else if(['armor','shield','helmet','boots'].includes(it.type))d+=it.val||0;}return{a,d};}
 function bar(box,v,max,kind){v=Math.max(0,Number(v)||0);max=Math.max(0,Number(max)||0);box.querySelector(`.${kind}-label`).innerHTML=`${kind==='hp'?'TP':'MP'}: <span class="battle-hp-text">${v}</span> / ${max}`;box.querySelector(kind==='hp'?'.battle-meter>span':'.battle-meter.mana>span').style.width=`${max?Math.min(100,v/max*100):0}%`;}
 function drawEnemy(c,m){drawMonsterPortrait(c,m);}
 function refresh(){const p=state.player,m=state.activeMonster||shownMonster;if(!m)return;if(state.inCombat)shownMonster=m;const s=stats(p);hero.querySelector('h3').textContent=`${p.name} · LVL ${p.level}`;enemy.querySelector('h3').textContent=m.name;bar(hero,p.hp,p.maxHp,'hp');bar(hero,p.mp,p.maxMp,'mp');bar(enemy,m.hp,m.maxHp,'hp');const defeated=!!(busy&&ticket?.defeatReady&&ticket.monster===m&&same(ticket)&&!state.inCombat&&p.hp>0&&m.hp<=0&&Array.isArray(state.world.monsters)&&!state.world.monsters.includes(m));if(enemy.getAttribute('data-defeated')!==String(defeated))enemy.setAttribute('data-defeated',String(defeated));enemy.querySelector('.battle-defeat-label').hidden=!defeated;hero.querySelector('.battle-values').textContent=`ATK ${s.a} · DEF ${s.d}`;enemy.querySelector('.battle-values').textContent=`ATK ${m.atk} · DEF ${m.def}`;const hc=hero.querySelector('canvas').getContext('2d');hc.clearRect(0,0,112,112);drawCharacter(hc,p,8,8,96);drawEnemy(enemy.querySelector('canvas').getContext('2d'),m);if(busy)for(const id of ['attack','fire','heal','mana','flee'].filter(id=>el(id)))el(id).disabled=true;}
 function paint(){try{refresh();}catch(error){console.warn('Kampfdarstellung:',error);}}
 function point(box){const r=box.querySelector('canvas').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};}
 const urgent=()=>document.hidden||el('game').classList.contains('hidden')||!!document.querySelector('dialog[open],.tutorial-modal:not(.hidden),.levelup-choice,#death-screen:not(.hidden),#floor-overlay:not(.hidden),#levelup-overlay:not(.hidden),#session-pause:not([hidden]),#preparation-shop:not([hidden])');
 const same=t=>t&&state.player===t.player&&state.world.tiles===t.tiles&&state.currentSlot===t.slot&&state.user?.uid===t.uid&&(!state.inCombat||state.activeMonster===t.monster);
 function finish(t,abort=false){if(ticket!==t)return;clearTimeout(unlockTimer);unlockTimer=null;const hide=el('game').classList.contains('hidden')||!state.inCombat||closing&&same(t);busy=false;closing=false;ticket=null;fx.clear();enemy.removeAttribute('data-defeated');enemy.querySelector('.battle-defeat-label').hidden=true;el('attack').disabled=false;el('flee').disabled=false;el('fire').disabled=state.player.mp<8;el('heal').disabled=!(state.player.inventory||[]).some(x=>x.id==='health_potion'&&x.count>0);if(el('mana'))el('mana').disabled=!(state.player.inventory||[]).some(x=>x.id==='mana_potion'&&x.count>0);if(hide)combat.classList.add('hidden');else paint();}
 function safety(){if(busy&&(!same(ticket)||urgent())){finish(ticket,true);return;}if(busy&&combat.classList.contains('hidden')){closing=true;combat.classList.remove('hidden');}else if(!busy&&combat.classList.contains('hidden')){fx.clear();shownMonster=null;}paint();}
 combat.addEventListener('click',e=>{if(busy&&!urgent()){e.preventDefault();e.stopImmediatePropagation();}},true);
 window.addEventListener('keydown',e=>{if(busy&&!urgent()&&(combat.contains(e.target)||e.target===document.body||e.target===el('stage'))){e.preventDefault();e.stopImmediatePropagation();}},true);
 new MutationObserver(safety).observe(combat,{attributes:true,attributeFilter:['class']});new MutationObserver(paint).observe(el('combat-info'),{childList:true});
 for(const node of [el('game'),...document.querySelectorAll('#login-screen,#slot-screen,#class-screen,#death-screen,#floor-overlay,#levelup-overlay,#session-pause,#preparation-shop,dialog,.tutorial-modal')].filter(Boolean))new MutationObserver(safety).observe(node,{attributes:true,attributeFilter:['class','hidden','open']});
 combat.addEventListener('scroll',()=>fx.clear(),true);window.addEventListener('resize',()=>fx.clear());window.addEventListener('blur',()=>fx.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden){if(busy)finish(ticket,true);else fx.clear();}});
 for(const id of ['attack','fire','heal','mana','flee'].filter(id=>el(id))){const button=el(id),original=button.onclick;button.onclick=function(e){
  if(busy||!state.inCombat||!state.activeMonster||typeof original!=='function'||urgent())return;if(id==='fire'&&state.player.mp<8)return;if(id==='heal'&&!(state.player.inventory||[]).some(x=>x.id==='health_potion'&&x.count>0))return;if(id==='mana'&&!(state.player.inventory||[]).some(x=>x.id==='mana_potion'&&x.count>0))return;
  paint();fx.clear();const p=state.player,m=state.activeMonster,t={player:p,monster:m,tiles:state.world.tiles,slot:state.currentSlot,uid:state.user?.uid},before={hp:p.hp,mp:p.mp,mhp:m.hp,level:p.level},events=[];let healed=0,restored=0;
  busy=true;closing=false;ticket=t;const gfx=window.__rpg?.renderer,oldText=gfx?.text,oldPotion=sound.potion;
  const textHook=function(text,x,y,...rest){if(/^(KRIT -|-)\d+/.test(String(text))){const side=x===m.x&&y===m.y?'enemy':x===p.x&&y===p.y?'hero':null;if(side)events.push({text:String(text),side});}return oldText.call(this,text,x,y,...rest);};
  const potionHook=function(...args){healed+=Math.max(0,p.hp-before.hp);restored+=Math.max(0,p.mp-before.mp);return oldPotion.apply(this,args);};
  if(typeof oldText==='function')gfx.text=textHook;if(typeof oldPotion==='function')sound.potion=potionHook;
  try{original.call(this,e);}catch(error){finish(t,true);throw error;}finally{if(gfx?.text===textHook)gfx.text=oldText;if(sound.potion===potionHook)sound.potion=oldPotion;}
  if(!same(t)||urgent()){finish(t,true);return;}if(!state.inCombat&&combat.classList.contains('hidden')){closing=true;combat.classList.remove('hidden');}paint();unlockTimer=setTimeout(()=>finish(t),COMBAT_FINISH_MS);
  try{const hp=point(hero),mp=point(enemy),weapon=p.equipped?.mainhand||'',staff=/staff|stab/i.test(weapon+' '+(ITEMS[weapon]?.name||'')),ranged=id==='fire'&&p.mp!==before.mp||id==='attack'&&staff&&m.hp<before.mhp;
   if(m.hp<before.mhp){if(ranged)fx.projectile(hp,mp,id==='fire');else if(id==='attack')fx.slash(mp);if(!events.some(x=>x.side==='enemy'))events.push({text:`-${before.mhp-m.hp}`,side:'enemy'});}
   if(healed>0){fx.heal(hp);fx.number(`+${healed} TP`,hp,'#8ce5af',-10);}
   if(restored>0)fx.number(`+${restored} MP`,hp,'#83cfee',-10);
   if(!events.some(x=>x.side==='hero')&&state.inCombat&&p.level===before.level){const damage=before.hp+healed-p.hp;if(damage>0)events.push({text:`-${damage}`,side:'hero'});}
   const won=!state.inCombat&&p.hp>0&&m.hp<=0&&Array.isArray(state.world.monsters)&&!state.world.monsters.includes(m);
   const markDefeated=()=>{if(!won||ticket!==t||!same(t)||urgent())return;t.defeatReady=true;paint();};
   const impactDelay=matchMedia('(prefers-reduced-motion: reduce)').matches?0:200;
   let offset=0;
   for(const event of events){
    const isHero=event.side==='hero',pos=isHero?hp:mp,color=isHero?'#ff8b96':'#f7d590',shift=offset++*6;
    if(!isHero&&ranged&&won){
     fx.later(()=>{if(ticket!==t||!same(t)||urgent())return;fx.number(event.text,pos,color,shift);fx.react(enemy);markDefeated();},impactDelay);
    }else{
     fx.number(event.text,pos,color,shift);
     if(!isHero&&ranged)fx.later(()=>{if(ticket===t&&same(t)&&!urgent())fx.react(enemy);},200);
     else{fx.hit(pos,color);fx.react(isHero?hero:enemy,isHero);}
    }
   }
   if(won&&!ranged)markDefeated();
   if(id==='flee'){if(!state.inCombat&&p.hp>0)fx.escape(hp);else fx.number('FLUCHT GESCHEITERT',hp,'#e5c7b4');}
  }catch(error){fx.clear();console.warn('Kampfeffekte:',error);}
 };}
 
combat.addEventListener('click', e => {
  const button = e.target?.closest?.('.ability-btn');
  if (!button || busy || !state.inCombat || !state.activeMonster || urgent()) return;
  const original = button.onclick;
  if (typeof original !== 'function') return;
  e.stopImmediatePropagation();
  const id = button.dataset.ability;
  paint(); fx.clear();
  const p = state.player, m = state.activeMonster;
  const t = {player: p, monster: m, tiles: state.world.tiles, slot: state.currentSlot, uid: state.user?.uid};
  const before = {hp: p.hp, mp: p.mp, mhp: m.hp, level: p.level};
  const events = [];
  busy = true; closing = false; ticket = t;
  const gfx = window.__rpg?.renderer, oldText = gfx?.text;
  const textHook = function(text, x, y, ...rest) {
    if (/^(KRIT -|-)\d+/.test(String(text))) {
      const side = x === m.x && y === m.y ? 'enemy' : x === p.x && y === p.y ? 'hero' : null;
      if (side) events.push({text: String(text), side});
    }
    return oldText.call(this, text, x, y, ...rest);
  };
  if (typeof oldText === 'function') gfx.text = textHook;
  try { original.call(button, e); }
  catch (error) { finish(t, true); throw error; }
  finally { if (gfx?.text === textHook) gfx.text = oldText; }
  if (!same(t) || urgent()) { finish(t, true); return; }
  if (!state.inCombat && combat.classList.contains('hidden')) { closing = true; combat.classList.remove('hidden'); }
  paint();
  unlockTimer = setTimeout(() => finish(t), COMBAT_FINISH_MS);
  try {
    const hp = point(hero), mp = point(enemy);
    const ranged = id === 'frost_bolt';
    const healed = Math.max(0, p.hp - before.hp);
    const mana = Math.max(0, p.mp - before.mp);
    const heroDamage = Math.max(0, before.hp - p.hp - healed);
    if (m.hp < before.mhp) {
      if (ranged) fx.projectile(hp, mp, false); else fx.slash(mp);
      if (!events.some(x => x.side === 'enemy')) events.push({text: `-${before.mhp - m.hp}`, side: 'enemy'});
    }
    if (healed > 0) events.push({text: `+${healed} TP`, side: 'hero', color: '#8ce5af'});
    if (mana > 0) events.push({text: `+${mana} MP`, side: 'hero', color: '#83cfee'});
    if (heroDamage > 0 && !events.some(x => x.side === 'hero' && String(x.text).startsWith('-'))) events.push({text: `-${heroDamage}`, side: 'hero'});
    const won = !state.inCombat && p.hp > 0 && m.hp <= 0 && Array.isArray(state.world.monsters) && !state.world.monsters.includes(m);
    const markDefeated = () => {
      if (!won || ticket !== t || !same(t) || urgent()) return;
      t.defeatReady = true; paint();
    };
    const impactDelay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200;
    let offset = 0;
    for (const item of events) {
      const isHero = item.side === 'hero', pos = isHero ? hp : mp;
      const color = item.color || (isHero ? '#ff8b96' : '#f7d590');
      const shift = offset++ * 6;
      if (!isHero && ranged && won) {
        fx.later(() => {
          if (ticket !== t || !same(t) || urgent()) return;
          fx.number(item.text, pos, color, shift);
          fx.react(enemy); markDefeated();
        }, impactDelay);
      } else {
        fx.number(item.text, pos, color, shift);
        if (!isHero && ranged) fx.later(() => { if (ticket === t && same(t) && !urgent()) fx.react(enemy); }, 200);
        else { fx.hit(pos, color); fx.react(isHero ? hero : enemy, isHero); }
      }
    }
    if (won && !ranged) markDefeated();
  } catch (error) { fx.clear(); console.warn('Kampfeffekte:', error); }
}, true);

paint();
});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
