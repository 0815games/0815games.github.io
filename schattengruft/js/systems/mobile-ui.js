import { state } from '../core/state.js';
import { ITEMS } from '../data/items.js';
const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('../../css/mobile-hotfix-v041.css?v=0.4.1',import.meta.url).href;document.head.append(link);
const style=document.createElement('style');style.textContent=`
#game,#layout,#mapbox,aside,.panel,.name-row,.name-row input{min-width:0;max-width:100%}
.screen,aside,#items,#logs{overflow-x:hidden;overflow-y:auto;touch-action:pan-y}
.screen{align-items:start}.screen>main{margin:auto;max-width:100%;min-width:0}.cloud{max-width:100%;width:fit-content}
#combat{display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;height:100dvh;justify-content:stretch;gap:10px;overflow:hidden;padding:12px;padding-top:max(12px,env(safe-area-inset-top));padding-bottom:max(12px,env(safe-area-inset-bottom));padding-left:max(12px,env(safe-area-inset-left));padding-right:max(12px,env(safe-area-inset-right))}
#combat-info{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0;padding:8px;font-size:14px}
.combat-unit{min-width:0;text-align:left;overflow-wrap:anywhere}.combat-unit h3{font-size:14px;margin:0 0 6px}
.combat-meter-label{display:block;margin:4px 0;font-size:13px;color:#fff}.combat-meter{height:10px;background:#08090e;border:1px solid #63404a;border-radius:6px;overflow:hidden}.combat-meter span{display:block;height:100%;background:#d74351}.combat-meter.mana span{background:#348de3}.combat-values{font-size:12px;color:#f3dcaa;margin-top:6px}
#combat-log{min-height:0;overflow-x:hidden;overflow-y:auto;margin:0;touch-action:pan-y}.combat-buttons{margin:0;grid-template-columns:repeat(2,minmax(0,1fr))}.combat-buttons button{min-height:48px;padding:8px;font-size:13px;white-space:normal}.combat-buttons button:disabled{opacity:.5}
.item,.skill-head{overflow-wrap:anywhere}.item>span{min-width:0}.intro-box{overflow-wrap:anywhere}#hint{pointer-events:none}
@media(max-height:480px){#combat{gap:4px;padding-top:6px;padding-bottom:6px}#combat h2{font-size:14px}.combat-unit h3{font-size:12px;margin:0}.combat-meter-label{font-size:11px;margin:2px 0}.combat-buttons button{min-height:42px}}
`;document.head.append(style);
function setup(){
 const el=id=>document.getElementById(id);
 const combat=el('combat'),game=el('game'),canvas=el('stage');
 if(!combat||!game||!canvas)return;
 document.body.append(combat);combat.setAttribute('role','dialog');combat.setAttribute('aria-modal','true');combat.setAttribute('aria-label','Kampf');
 document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-label',{inv:'Inventar',char:'Ausrüstung',skills:'Skills',log:'Chronik'}[b.dataset.tab]||b.dataset.tab));
 const hint=document.querySelector('.intro-hint');if(hint)hint.textContent='TIPPE ZUM BETRETEN · ENTER AM PC';
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&','<':'<','>':'>','"':'"',"'":'&#39;'}[c]));
 function meter(label,v,max,mana=false){v=Math.max(0,Number(v)||0);max=Math.max(0,Number(max)||0);return `<span class="combat-meter-label">${label}: ${v} / ${max}</span><div class="combat-meter${mana?' mana':''}"><span style="width:${max?Math.min(100,v/max*100):0}%"></span></div>`;}
 function refresh(){
  if(!state.inCombat||combat.classList.contains('hidden')||!state.activeMonster)return;
  const p=state.player,m=state.activeMonster;let atk=p.atk,def=p.def;
  for(const id of Object.values(p.equipped||{})){const it=ITEMS[id];if(!it)continue;if(it.type==='weapon'||it.stat==='atk')atk+=it.val||0;else if(['armor','shield','helmet','boots'].includes(it.type))def+=it.val||0;}
  el('combat-info').innerHTML=`<div class="combat-unit"><h3>${esc(p.name)} · LVL ${p.level}</h3>${meter('TP',p.hp,p.maxHp)}${meter('MP',p.mp,p.maxMp,true)}<div class="combat-values">ATK ${atk} · DEF ${def}</div></div><div class="combat-unit"><h3>${esc(m.name)}</h3>${meter('Gegner-TP',m.hp,m.maxHp)}<div class="combat-values">ATK ${m.atk} · DEF ${m.def}</div></div>`;
  const count=(p.inventory||[]).filter(x=>x.id==='health_potion').reduce((a,x)=>a+x.count,0);
  el('fire').textContent='🔥 FEUERBALL · 8 MP';el('fire').disabled=p.mp<8;
  el('heal').textContent=`🧪 HEILTRANK · ${count}`;el('heal').disabled=count<1;
 }
 combat.addEventListener('click',()=>queueMicrotask(refresh),true);
 new MutationObserver(refresh).observe(combat,{attributes:true,attributeFilter:['class']});
 function resize(){
  if(game.classList.contains('hidden'))return;
  const r=canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;
  const scale=32/Math.max(26,Math.min(40,r.width/12));
  const w=Math.round(r.width*scale),h=Math.round(r.height*scale);
  if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
 }
 new ResizeObserver(resize).observe(el('mapbox'));
 new MutationObserver(()=>requestAnimationFrame(resize)).observe(game,{attributes:true,attributeFilter:['class']});
 addEventListener('resize',resize);refresh();resize();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
