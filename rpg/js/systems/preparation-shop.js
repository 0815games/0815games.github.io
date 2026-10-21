import {tryAddItem} from './inventory.js';
import { createRestartPlayer } from './run-lifecycle.js';
import {state,CLASSES} from '../core/state.js';
import {renderPreparationHero} from './preparation-hero.js';
import {ITEMS} from '../data/items.js';
import {cloud} from './firebase.js';
const slots=['head','body','mainhand','offhand','feet','ring'];
const families={warrior:['Ordensschwert','🗡️'],mage:['Runenstab','🔮'],rogue:['Ordensdolch','🔪']};
for(const [cls,[name,icon]] of Object.entries(families)){
 ITEMS['emergency_'+cls]={name:'Notwaffe: '+name,type:'weapon',slot:'mainhand',minLevel:1,heroClass:cls,val:2,price:0,stack:1,icon,category:'Waffe',desc:'+2 ATK. Kostenloser Neustart.'};
 for(let tier=1;tier<=20;tier++){const value=4+tier*2;ITEMS[`order_${cls}_${tier}`]={name:`${name} Stufe ${tier}`,type:'weapon',slot:'mainhand',minLevel:1+(tier-1)*5,heroClass:cls,val:value,price:40+tier*25,stack:1,icon,category:'Waffe',desc:`+${value} ATK. Startausrüstung.`};}
}
for(let tier=1;tier<=20;tier++)for(const [slot,type,label,icon] of [['body','armor','Ordensrüstung','🛡️'],['head','helmet','Ordenshelm','⛑️'],['feet','boots','Ordensstiefel','🥾'],['offhand','shield','Ordensschild','🛡️'],['ring','ring','Ordensring','💍']]){const value=slot==='body'?tier+2:tier;ITEMS[`order_${slot}_${tier}`]={name:`${label} Stufe ${tier}`,type,slot,minLevel:1+(tier-1)*5,val:value,stat:slot==='ring'?'atk':undefined,price:slot==='body'?35+tier*20:20+tier*15,stack:1,icon,category:slot==='ring'?'Reliquie':'Rüstung',desc:`+${value} ${slot==='ring'?'ATK':'DEF'}. Startausrüstung.`};}
let panel,list,info,footer,status,category='weapon',pending=null,busy=false,ready=null;
const el=id=>document.getElementById(id);
const originalSave=cloud.saveSlot.bind(cloud);
cloud.saveSlot=function(slot,data){
 // Speichern verändert keinen Spielzustand anhand sichtbarer Fenster.
 const promise=Promise.resolve(originalSave(slot,data));
 if(data.player.needsPreparation&&slot===state.currentSlot){
  ready=promise;
 }
 return promise;
};
function eligible(){return state.user&&state.player.needsPreparation;}
function stats(){const p=state.player;let atk=p.atk,def=p.def;for(const id of Object.values(p.equipped||{})){const item=ITEMS[id];if(!item)continue;if(item.type==='weapon'||item.stat==='atk')atk+=item.val||0;else if(['armor','helmet','boots','shield'].includes(item.type))def+=item.val||0;}return{atk,def};}
function render(){if(!panel)return;const p=state.player,tier=Math.min(20,1+Math.floor((p.level-1)/5)),cls=families[p.heroClass]?p.heroClass:'warrior',s=stats();renderPreparationHero(info,p,state.meta,s,{tier,classLabel:CLASSES[p.heroClass]?.title||'Recke'});
 list.replaceChildren();const ids=category==='weapon'?[`order_${cls}_${tier}`]:category==='armor'?slots.filter(x=>x!=='mainhand').map(x=>`order_${x}_${tier}`):['health_potion','mana_potion'];
 for(const id of ids){const item=ITEMS[id];const count=(p.inventory||[]).filter(x=>x.id===id).reduce((sum,x)=>sum+x.count,0);const owned=item.slot?!!p.preparationBought?.[item.slot]:count>=3;const card=document.createElement('article'),title=document.createElement('h3'),desc=document.createElement('p'),button=document.createElement('button');title.textContent=`${item.icon||'📦'} ${item.name}`;desc.textContent=`${item.desc}${item.slot?` · Benötigt Level ${item.minLevel??1}`:''} · ${item.price} Gold${item.slot?'':` · Bestand ${count}/3`}`;button.textContent=owned?'Bereits gekauft / Limit erreicht':'Kaufen';button.disabled=busy||owned||(state.meta.gold||0)<item.price;button.onclick=()=>{pending=id;status.textContent=`${item.name} für ${item.price} Gold kaufen?`;footer.querySelector('[data-confirm]').hidden=false;footer.querySelector('[data-cancel]').hidden=false;footer.querySelector('[data-confirm]').focus();};card.append(title,desc,button);list.append(card);}
 footer.querySelector('[data-start]').disabled=busy;footer.querySelector('[data-confirm]').disabled=busy;footer.querySelector('[data-cancel]').disabled=busy;
}
function refreshSummary(){const box=el('death-stats');if(box&&eligible()){box.replaceChildren();for(const text of [`Run-Gold gesichert: ${state.player.lastRunGold||0}`,`Ordensgold: ${state.meta.gold||0}`,`Level ${state.player.level}, Skills und permanente Werte erhalten.`,`Alle Gegenstände verloren. TP und MP aufgefüllt.`]){const div=document.createElement('div');div.textContent=text;box.append(div);}}}
function show(){if(!eligible())return;panel.hidden=false;pending=null;footer.querySelector('[data-confirm]').hidden=true;footer.querySelector('[data-cancel]').hidden=true;status.textContent='Käufe gelten für den nächsten Run und gehen beim nächsten Tod verloren. Ohne Kauf erhältst du eine Notwaffe.';render();footer.querySelector('[data-start]').focus();}
async function buy(){
 if(busy||!pending||!eligible())return;

 const itemId=pending;
 const player=state.player,world=state.world,meta=state.meta;
 const slot=state.currentSlot,uid=state.user?.uid,runId=player.runId;
 const current=()=>state.user?.uid===uid&&state.currentSlot===slot&&
  state.player===player&&state.world===world&&state.meta===meta&&
  player.runId===runId&&player.needsPreparation===true;

 busy=true;
 render();

 try{
  if(ready&&!await ready){
   if(!current())return;
   ready=cloud.saveSlot(slot,{
    player:structuredClone(player),
    world:structuredClone(world),
    meta:structuredClone(meta),
    currentSlot:slot
   });
   if(!await ready)throw new Error('Vorbereitung konnte nicht gespeichert werden.');
  }
  if(!current())return;

  const item=ITEMS[itemId];
  if(!item)throw new Error('Gegenstand nicht mehr verfügbar.');
  if(!Number.isFinite(item.price)||item.price<0){
   throw new Error('Ungültiger Kaufpreis.');
  }
  if(!Number.isFinite(meta.gold)||meta.gold<item.price){
   throw new Error('Nicht genügend Ordensgold.');
  }
  if((player.level||1)<(item.minLevel??1)){
   throw new Error(`Benötigt Heldenlevel ${item.minLevel}.`);
  }
  if(item.heroClass&&item.heroClass!==player.heroClass){
   throw new Error('Dieser Gegenstand ist für eine andere Klasse bestimmt.');
  }

  const draft={
   player:structuredClone(player),
   world:structuredClone(world),
   meta:structuredClone(meta),
   currentSlot:slot
  };
  const next=draft.player;
  next.preparationBought=next.preparationBought||{};

  if(item.slot){
   if(!slots.includes(item.slot)){
    throw new Error('Ungültiger Ausrüstungsplatz.');
   }
   if(next.preparationBought[item.slot]){
    throw new Error('Für diesen Ausrüstungsplatz wurde bereits gekauft.');
   }
   next.equipped[item.slot]=itemId;
   next.preparationBought[item.slot]=true;
  }else{
   if(!['health_potion','mana_potion'].includes(itemId)){
    throw new Error('Dieser Vorrat wird hier nicht angeboten.');
   }
   const count=next.inventory
    .filter(entry=>entry.id===itemId)
    .reduce((sum,entry)=>sum+entry.count,0);
   if(count>=3)throw new Error('Höchstens drei Tränke dieser Sorte pro Vorbereitung.');
   const added=tryAddItem(next.inventory,itemId,1);
   if(!added.ok){
    throw new Error(added.reason==='INVENTORY_FULL'
     ?'Kein Platz im Inventar.'
     :'Inventar konnte nicht aktualisiert werden.');
   }
  }

  draft.meta.gold-=item.price;
  status.textContent=`${item.name}: Kauf wird gespeichert …`;

  const ok=await cloud.saveSlot(slot,draft);
  if(!current())return;
  if(!ok)throw new Error('Kauf konnte nicht gespeichert werden.');

  Object.assign(player,next);
  Object.assign(meta,draft.meta);
  status.textContent=`${item.name}: Kauf für den nächsten Run übernommen.`;
  refreshSummary();
 }catch(error){
  if(current()){
   status.textContent=error.message+' Der lokale Kaufzustand wurde nicht verändert.';
  }
  console.warn('Vorbereitungskauf:',error);
 }finally{
  busy=false;
  pending=null;
  footer.querySelector('[data-confirm]').hidden=true;
  footer.querySelector('[data-cancel]').hidden=true;
  render();
 }
}
async function start(){
 if(busy||!eligible())return;
 busy=true;
 render();
 const player=state.player,world=state.world,slot=state.currentSlot;
 const uid=state.user?.uid;
 const current=()=>state.user?.uid===uid&&state.currentSlot===slot&&
  state.player===player&&state.world===world;
 try{
  // Vor dem Start muss die Vorbereitung einschließlich Käufen gesichert sein.
  if(ready&&!await ready){
   if(!current())return;
   ready=cloud.saveSlot(slot,{
    player:structuredClone(player),world:structuredClone(world),
    meta:structuredClone(state.meta),currentSlot:slot
   });
   if(!await ready)throw new Error('Vorbereitung konnte nicht gespeichert werden.');
  }
  if(!current())return;
  const cls=families[player.heroClass]?player.heroClass:'warrior';
  const next=createRestartPlayer(player,'emergency_'+cls);
  const draft={
   player:next,world:structuredClone(world),
   meta:structuredClone(state.meta),currentSlot:slot
  };
  const ok=await cloud.saveSlot(slot,draft);
  if(!current())return;
  if(!ok)throw new Error('Neustart konnte nicht gespeichert werden.');
  Object.assign(player,next);
  panel.hidden=true;
  ready=null;
  el('btn-revive').onclick();
 }catch(error){
  if(current())status.textContent=error.message+' Bitte erneut versuchen.';
 }finally{
  busy=false;
  render();
 }
}
function setup(){const style=document.createElement('style');style.textContent='#preparation-shop{position:fixed;inset:0;z-index:220;background:#08090ef5;display:flex;flex-direction:column;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));gap:10px}#preparation-shop[hidden]{display:none}#preparation-shop header,#preparation-shop footer{flex:none;display:block;padding:12px;background:#111420;border:1px solid #c99c42;border-radius:12px}#preparation-shop h2{margin:0;color:#ffd54f;font-size:20px}#preparation-shop .shop-info{white-space:pre-line;line-height:1.5;font-size:13px}#preparation-shop .shop-tabs{display:flex;gap:8px;flex-wrap:wrap}#preparation-shop button{min-height:48px;padding:10px;border:1px solid #c99c42;border-radius:10px;background:#24293c;color:#fff;font:inherit}#preparation-shop button:disabled{opacity:.5}#preparation-shop button:focus-visible{outline:3px solid #ffe082}#preparation-shop .shop-list{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:1fr;gap:10px;align-content:start}#preparation-shop article{padding:12px;background:#111420;border:1px solid #4a546f;border-radius:12px}#preparation-shop h3{font-size:16px;margin:0}#preparation-shop p{line-height:1.5}#preparation-shop footer button{margin:4px}#preparation-shop [data-start]{background:#c99c42;color:#111;font-weight:bold}@media(min-width:800px){#preparation-shop{padding-left:max(24px,calc((100vw - 1000px)/2));padding-right:max(24px,calc((100vw - 1000px)/2))}#preparation-shop .shop-list{grid-template-columns:repeat(2,minmax(0,1fr))}}';document.head.append(style);
 panel=document.createElement('section');panel.id='preparation-shop';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Rüstkammer des Ordens');panel.innerHTML='<header><h2>RÜSTKAMMER DES ORDENS</h2><div class="shop-info"></div><div class="shop-tabs"><button data-category="weapon">Waffen</button><button data-category="armor">Rüstung</button><button data-category="supply">Vorräte</button></div></header><div class="shop-list"></div><footer><p role="status"></p><button data-confirm hidden>Kauf bestätigen</button><button data-cancel hidden>Abbrechen</button><button data-start>RUN STARTEN</button></footer>';document.body.append(panel);info=panel.querySelector('.shop-info');list=panel.querySelector('.shop-list');footer=panel.querySelector('footer');status=footer.querySelector('p');panel.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{if(!busy){category=b.dataset.category;render();}});footer.querySelector('[data-confirm]').onclick=buy;footer.querySelector('[data-cancel]').onclick=()=>{pending=null;footer.querySelector('[data-confirm]').hidden=true;footer.querySelector('[data-cancel]').hidden=true;status.textContent='Kauf abgebrochen.';};footer.querySelector('[data-start]').onclick=start;
 el('btn-revive').addEventListener('click',e=>{if(eligible()){e.preventDefault();e.stopImmediatePropagation();show();}},true);
 for(const type of ['click','pointerdown','touchstart','keydown'])window.addEventListener(type,e=>{const diagnostic=el('startup-diagnostics-host');if(diagnostic&&e.composedPath?.().includes(diagnostic))return;if(panel.hidden)return;if(!panel.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();}else if(type==='keydown'){if(e.key==='Tab'){const buttons=[...panel.querySelectorAll('button')].filter(b=>!b.hidden&&!b.disabled);const i=buttons.indexOf(document.activeElement);if((e.shiftKey&&i<=0)||(!e.shiftKey&&i===buttons.length-1)){e.preventDefault();buttons[e.shiftKey?buttons.length-1:0]?.focus();}}e.stopImmediatePropagation();}},true);
 new MutationObserver(()=>{refreshSummary();}).observe(el('death-screen'),{attributes:true,attributeFilter:['class']});
 new MutationObserver(()=>{if(eligible()&&!el('game').classList.contains('hidden')&&el('death-screen').classList.contains('hidden')){if(panel.hidden)show();}else if(!eligible()||el('game').classList.contains('hidden')&&el('death-screen').classList.contains('hidden'))panel.hidden=true;}).observe(el('game'),{attributes:true,attributeFilter:['class']});
 const controls=document.querySelector('.combat-buttons');if(controls&&!controls.id)controls.id='combat-buttons';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
