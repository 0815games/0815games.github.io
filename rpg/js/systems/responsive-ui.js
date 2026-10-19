function actionLabel(text,key,touch){const label=text.replace(/^\s*\[[1-5]\]\s*/, '');return touch?label:`[${key}] ${label}`;}
function setup(){
 const style=document.createElement('style');style.textContent=`
#slot-screen #slots-grid{grid-auto-rows:max-content;align-items:start;align-content:start;overflow-y:auto}
#slot-screen #slots-grid>.slot-box:not(.empty){display:grid!important;grid-template-columns:80px minmax(0,1fr);grid-template-rows:auto auto;gap:10px;height:auto!important;min-height:0;max-height:none!important;overflow:visible;align-content:start}
#slot-screen #slots-grid>.slot-box:not(.empty)>.hero-preview{grid-column:1;grid-row:1;width:76px;height:76px;max-width:100%;margin:0;align-self:start}
#slot-screen #slots-grid>.slot-box:not(.empty)>div:not(.slot-buttons){grid-column:2;grid-row:1;min-width:0}
#slot-screen #slots-grid>.slot-box:not(.empty)>.slot-buttons{grid-column:1/-1;grid-row:2;display:flex!important;position:static;gap:8px;margin:0;min-width:0}
#slot-screen .slot-buttons button{min-height:48px;flex-shrink:0}
#slot-screen .btn-slot-play{min-width:0;flex:1}
#slot-screen .btn-slot-del{min-width:48px}
#slot-screen .slot-header{flex-wrap:wrap;gap:4px}
#slot-screen .slot-hero-name,#slot-screen .slot-meta{white-space:normal;overflow-wrap:anywhere}
#slot-screen #slots-grid>.slot-box.empty{height:auto!important;min-height:132px;max-height:none!important}
.equip-grid>.equip-slot-box{display:grid;grid-template-columns:minmax(0,1fr) 44px;column-gap:8px;row-gap:4px;align-content:start;min-height:80px}
.equip-slot-box>.slot-label,.equip-slot-box>.slot-item-name{grid-column:1;min-width:0}
.equip-slot-box>.slot-item-name{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:anywhere;margin:0}
.equip-slot-box>.btn-unequip{position:static!important;grid-column:2;grid-row:1/3;align-self:start;display:flex;align-items:center;justify-content:center;width:44px;height:44px;min-width:44px;min-height:44px;padding:0;line-height:1;font-family:Arial,sans-serif;font-size:28px;color:#ffb3bc;touch-action:manipulation}
@media(max-width:359px){.equip-grid{grid-template-columns:minmax(0,1fr)}}
`;document.head.append(style);
 const media=matchMedia('(pointer: coarse)'),memory=new WeakMap();let touch=media.matches,pending=false;
 const replacements=new Map([
 ['Bewege dich: Am PC mit WASD oder Pfeiltasten. Auf dem Handy wischst du über die Karte.','Wische über die Karte, um deinen Recken zu bewegen.'],
 ['Truhen öffnen sich beim Betreten. Auf der Karte Enter oder Leertaste zum Interagieren drücken; im Treppendialog Absteigen bestätigen.','Truhen öffnen sich beim Betreten. Nutze die Treppe zum Hinabsteigen.'],
 ['TP sind Lebenspunkte, MP ist Mana. 1 Angriff, 2 Feuerball (8 MP), 3 Heiltrank, 4 Flucht, 5 Manatrank. Q / E / R: Klassenfähigkeiten 1 / 2 / 3. Tab wählt, Enter bestätigt.','TP sind Lebenspunkte, MP ist Mana. Tippe auf Angriff, Feuerball (8 MP), Heiltrank, Manatrank oder Flucht.'],
 ['Du hast einen Skillpunkt! Öffne Skills mit ✨ oder K und lerne einen verfügbaren Rang.','Du hast einen Skillpunkt! Tippe auf ✨ und lerne einen verfügbaren Rang.'],
 ['Das Runensiegel ist gebrochen. Suche die Treppe und steige hinab. Hilfe findest du jederzeit über ❔ oder H.','Das Runensiegel ist gebrochen. Suche die Treppe und steige hinab. Hilfe findest du über ❔.'],
 ['PC: WASD / Pfeile. Enter / Leertaste: Interaktion auf der Karte. Tab / Shift+Tab: Auswahl. Enter / Leertaste: Bestätigen.','Wische über die Karte zum Bewegen. Tippe auf Schaltflächen zum Auswählen und Bestätigen.'],
 ['Handy: über die Karte wischen. Klicken zum Laufen ist deaktiviert.','Direktes Antippen der Karte zum Laufen ist deaktiviert.'],
 ['1 Angriff · 2 Feuerball (8 MP) · 3 Heiltrank · 4 Flucht · 5 Manatrank. Q / E / R: Klassenfähigkeiten 1 / 2 / 3. TP: Leben, MP: Mana. Flucht kann scheitern. Esc öffnet diese Hilfe ohne Spielzug.','Tippe auf Angriff, Feuerball (8 MP), Heiltrank, Manatrank oder Flucht. TP: Leben, MP: Mana. Flucht kann scheitern. Öffne Hilfe über ❔.'],
 ['I Inventar · C Ausrüstung · K Skills · L Chronik · P Speichern. Gegenstand antippen: Details und Vergleich. Nur Ausrüsten oder Nutzen führt die Aktion aus. Skills kosten Punkte und können Voraussetzungen haben.','Öffne Inventar, Ausrüstung, Skills oder Chronik über die Menüschaltflächen. Tippe auf Speichern zum Sichern. Gegenstand antippen: Details und Vergleich. Nur Ausrüsten oder Nutzen führt die Aktion aus. Skills kosten Punkte und können Voraussetzungen haben.']
 ]);
 function adapt(node,convert){const current=node.textContent;let entry=memory.get(node);if(!entry||current!==entry.output)entry={base:current,output:current};const output=touch?convert(entry.base):entry.base;if(current!==output)node.textContent=output;entry.output=output;memory.set(node,entry);}
 function refresh(){
  pending=false;
  for(const [id,key] of [['attack','1'],['fire','2'],['heal','3'],['mana','5'],['flee','4']]){const button=document.getElementById(id);if(button){const label=actionLabel(button.textContent,key,touch);if(button.textContent!==label)button.textContent=label;}}
  document.querySelectorAll('.tutorial-box p,.game-help p').forEach(node=>adapt(node,text=>replacements.get(text)||text.replace('auf der Karte Enter oder Leertaste zum Interagieren drücken und den Treppendialog bestätigen.','Nutze die Treppe zum Hinabsteigen.')));
  const hint=document.querySelector('.intro-hint');if(hint)adapt(hint,()=> 'TIPPE ZUM BETRETEN');
  const grid=document.getElementById('slots-grid');if(grid){const label=touch?'Reckenliste: Tippe auf Spielen oder einen freien Reckenplatz.':'Reckenliste: Pfeiltasten zum Auswählen, Enter zum Bestätigen';if(grid.getAttribute('aria-label')!==label)grid.setAttribute('aria-label',label);}
  document.querySelectorAll('.btn-unequip').forEach(button=>{if(button.textContent!=='×')button.textContent='×';button.setAttribute('aria-label','Gegenstand ablegen');button.title='Gegenstand ablegen';});
 }
 function schedule(){if(!pending){pending=true;queueMicrotask(refresh);}}
 function mode(next){if(touch!==next){touch=next;schedule();}}
 media.addEventListener('change',event=>mode(event.matches));
 window.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')mode(true);else if(event.pointerType==='mouse')mode(false);},{capture:true,passive:true});
 window.addEventListener('keydown',event=>{if(!event.target.closest?.('input,textarea,select,[contenteditable="true"]')&&/^(Arrow|Key|Digit|Tab|Enter|Space|Escape)/.test(event.code))mode(false);},true);
 new MutationObserver(schedule).observe(document.body,{childList:true,characterData:true,subtree:true});refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
