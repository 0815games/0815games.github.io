import {state} from '../core/state.js';
function install(){
 const combat=document.getElementById('combat'),id='combat-layout-v0513';if(!combat||document.getElementById(id))return;
 const style=document.createElement('style');style.id=id;style.textContent=`
#combat[role="dialog"]{--battle-halo:#ffb75820;display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"title" "units" "log" "abilities" "actions";grid-template-rows:auto minmax(0,1fr) minmax(40px,72px) auto auto;gap:10px;max-width:1040px;margin:0 auto;min-height:0;padding:12px;color:#eee8db;border:2px solid #b99450!important;background:radial-gradient(ellipse at top,var(--battle-halo),transparent 55%),linear-gradient(145deg,#1b1b20,#0c0d12);box-shadow:0 0 40px #000b;overflow:auto!important;font:14px/1.5 system-ui,sans-serif}
#combat[role="dialog"].hidden{display:none!important}#combat[role="dialog"] *{box-sizing:border-box;min-width:0}
#combat[role="dialog"][data-battle-theme="pilzwald"]{--battle-halo:#8fdf9924}#combat[role="dialog"][data-battle-theme="frostgruft"]{--battle-halo:#9ddfff24}#combat[role="dialog"][data-battle-theme="feuershrein"]{--battle-halo:#ff864c24}#combat[role="dialog"][data-battle-theme="schattenarena"]{--battle-halo:#bb8fff24}
#combat[role="dialog"]>h2{grid-area:title;order:0;align-self:start;margin:0;padding:0 52px 0 0;text-align:left;color:#f0d797;font:700 clamp(17px,4.5vw,24px)/1.3 Georgia,serif;letter-spacing:.045em}
#combat[role="dialog"] #combat-display{grid-area:units;order:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:center;align-items:stretch;gap:10px;min-height:0;padding:4px;margin:0;border:0;border-radius:0;background:transparent;overflow:auto;scroll-padding:8px}
#combat[role="dialog"] .battle-unit{display:grid;grid-template-columns:minmax(0,1fr);align-content:start;gap:4px;padding:12px;border:1px solid #796747;border-radius:14px;background:radial-gradient(ellipse at top,var(--battle-halo),transparent 70%),linear-gradient(#252329,#15151b);box-shadow:inset 0 1px #ffffff08;overflow-wrap:anywhere}
#combat[role="dialog"] .battle-unit h3{min-height:2.6em;margin:0;text-align:center;color:#f1dfb5;font:700 14px/1.3 Georgia,serif;overflow-wrap:anywhere}
#combat[role="dialog"] .battle-unit canvas{display:block;width:clamp(76px,22vw,112px);height:clamp(76px,22vw,112px);max-width:100%;margin:4px auto 8px;border:1px solid #796747;border-radius:14px;background:radial-gradient(circle,var(--battle-halo),#090b12 75%);image-rendering:pixelated}
#combat[role="dialog"][data-battle-boss="true"] .battle-unit:nth-child(2){border-color:#c7a564;box-shadow:inset 0 0 22px #b88b3220}
#combat[role="dialog"] .battle-label{margin:0;font-size:12px;line-height:1.4;color:#d6cebc}#combat[role="dialog"] .battle-hp-text{color:#fff}
#combat[role="dialog"] .battle-meter{height:12px;min-height:12px;border:1px solid #645641;background:#080a10;border-radius:8px}#combat[role="dialog"] .battle-meter>span{background:linear-gradient(90deg,#a62d45,#ec7d80)}#combat[role="dialog"] .battle-meter.mana>span{background:linear-gradient(90deg,#265c9d,#80c7e3)}
#combat[role="dialog"] .battle-values{margin-top:4px;font-size:12px;line-height:1.4;color:#d9c79f}
#combat[role="dialog"] #combat-log{grid-area:log;order:2;min-height:40px;max-height:72px;overflow:auto;overscroll-behavior:contain;touch-action:pan-y;margin:0;padding:8px 12px;border:1px solid #645641;border-radius:10px;color:#e2d6c1;background:#0e0f15;font-size:13px;line-height:1.5;overflow-wrap:anywhere}
#combat[role="dialog"] #ability-bar{grid-area:abilities;order:3;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:0;padding:0;flex:none}
#combat[role="dialog"] #ability-bar::before{content:'Klassenfähigkeiten';grid-column:1/-1;color:#d9c79f;font-size:12px;letter-spacing:.04em}#combat[role="dialog"] #ability-bar:empty{display:none}
#combat[role="dialog"] .ability-btn{min-width:0;min-height:52px;margin:0;padding:8px 6px;border:1px solid #786747;border-radius:10px;background:#242229;color:#eee8db;font:600 12px/1.35 system-ui,sans-serif;white-space:normal;overflow-wrap:anywhere;touch-action:manipulation}
#combat[role="dialog"] .ability-btn small{display:block;margin:4px 0 0;font-size:11px;line-height:1.3;color:#d9c79f}
#combat[role="dialog"] .combat-buttons{grid-area:actions;order:4;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0;padding:0;flex:none}
#combat[role="dialog"] .combat-buttons button{min-height:52px;margin:0;padding:10px;border:1px solid #a68750;border-radius:11px;background:linear-gradient(#302a25,#1d1c22);color:#f1dfb5;font:700 14px/1.35 system-ui,sans-serif;white-space:normal;overflow-wrap:anywhere;touch-action:manipulation}
#combat[role="dialog"] #attack{border-color:#e7cc90;background:linear-gradient(#e2c586,#bc934c);color:#19130a}#combat[role="dialog"] #heal{border-color:#65866e}#combat[role="dialog"] #fire{border-color:#aa7c55}
#combat[role="dialog"] button:disabled{opacity:.55;cursor:not-allowed}#combat[role="dialog"] button:focus-visible{outline:3px solid #ffe082;outline-offset:2px}
@media(min-width:900px){#combat[role="dialog"]{padding:20px;gap:14px}#combat[role="dialog"] #combat-display{gap:18px}#combat[role="dialog"] .battle-unit{padding:18px}#combat[role="dialog"] .battle-unit canvas{width:128px;height:128px}#combat[role="dialog"] .battle-unit h3{font-size:17px}#combat[role="dialog"] .combat-buttons,#combat[role="dialog"] #ability-bar{width:100%;max-width:760px;justify-self:center}}
@media(max-height:600px){#combat[role="dialog"]{display:flex;flex-direction:column;gap:8px;padding:10px;overflow:auto!important}#combat[role="dialog"]>h2{flex:none;font-size:17px}#combat[role="dialog"] #combat-display{flex:none;overflow:visible;align-content:start}#combat[role="dialog"] .battle-unit{grid-template-columns:52px minmax(0,1fr);gap:3px 6px;padding:8px}#combat[role="dialog"] .battle-unit h3{grid-column:1/-1;font-size:12px;min-height:2.6em}#combat[role="dialog"] .battle-unit canvas{grid-column:1;grid-row:2/7;width:52px;height:52px;margin:0;align-self:start}#combat[role="dialog"] .battle-unit>:not(canvas):not(h3){grid-column:2}#combat[role="dialog"] .battle-label,#combat[role="dialog"] .battle-values{font-size:11px}#combat[role="dialog"] .battle-meter{height:10px;min-height:10px}#combat[role="dialog"] #combat-log{flex:none;max-height:64px}#combat[role="dialog"] .combat-buttons button{min-height:48px;padding:8px}#combat[role="dialog"] .ability-btn{min-height:48px}}
`;document.head.append(style);
 combat.setAttribute('role','dialog');const heading=combat.querySelector('h2');if(heading){if(!heading.id)heading.id='combat-layout-title';combat.setAttribute('aria-labelledby',heading.id);}
 const display=document.getElementById('combat-display');if(display){display.setAttribute('role','group');display.setAttribute('aria-label','Held und Gegner');}
 const log=document.getElementById('combat-log');if(log){log.setAttribute('role','status');log.setAttribute('aria-live','polite');log.setAttribute('aria-atomic','true');}
 function refresh(){
  const known=['katakomben','pilzwald','frostgruft','feuershrein','schattenarena'],theme=known.includes(state.world?.theme)?state.world.theme:'katakomben',boss=String(state.activeMonster?.id==='boss');
  if(combat.getAttribute('data-battle-theme')!==theme)combat.setAttribute('data-battle-theme',theme);
  if(combat.getAttribute('data-battle-boss')!==boss)combat.setAttribute('data-battle-boss',boss);
  const text=boss==='true'?'Bossbegegnung':'Begegnung';if(heading&&heading.textContent!==text)heading.textContent=text;
  const bar=document.getElementById('ability-bar'),actions=combat.querySelector('.combat-buttons');
  if(bar&&actions&&bar.parentElement===combat){if(bar.getAttribute('role')!=='group')bar.setAttribute('role','group');if(bar.getAttribute('aria-label')!=='Klassenfähigkeiten')bar.setAttribute('aria-label','Klassenfähigkeiten');if(bar.nextElementSibling!==actions)combat.insertBefore(bar,actions);}
 }
 new MutationObserver(refresh).observe(combat,{attributes:true,attributeFilter:['class'],childList:true});refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});else setTimeout(install,0);
