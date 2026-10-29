import { state } from '../core/state.js';
function setup(){
 const el=id=>document.getElementById(id);
 const visible=n=>n&&!n.closest('.hidden')&&n.getClientRects().length>0;
 const tips={move:'Bewege dich: Am PC mit WASD oder Pfeiltasten. Auf dem Handy wischst du über die Karte.',interact:'Truhen öffnen sich beim Betreten. Auf der Karte Enter oder Leertaste zum Interagieren drücken; im Treppendialog Absteigen bestätigen.',combat:'TP sind Lebenspunkte, MP ist Mana. 1 Angriff, 2 Feuerball (8 MP), 3 Heiltrank, 4 Manatrank, 5 Flucht. Q / E / R: Klassenfähigkeiten 1 / 2 / 3. Tab wählt, Enter bestätigt.',equipment:'Im Inventar einen Gegenstand antippen, um Details und Vergleich zu öffnen. Nur die Buttons Ausrüsten oder Nutzen führen die Aktion aus. Ausrüstung verändert Werte und das Aussehen.',skills:'Du hast einen Skillpunkt! Öffne Skills mit ✨ oder K und lerne einen verfügbaren Rang.',stairs:'Das Runensiegel ist gebrochen. Suche die Treppe und steige hinab. Hilfe findest du jederzeit über ❔ oder H.'};
 let key='',progress={},last={},pending=null,playing=false,previousFocus=null;
 function save(){try{localStorage.setItem(key,JSON.stringify(progress));}catch{}}
 function load(){const next=`schattengruft-tutorial-v1:${state.user?.uid||'local'}`;if(next===key)return;key=next;try{progress=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{progress={};}last={};pending=null;playing=false;}
 const css=document.createElement('style');css.textContent='.game-help{width:min(600px,calc(100vw - 24px));max-height:calc(100dvh - 32px);overflow-x:hidden;overflow-y:auto;background:#111420;color:#e8e4d9;border:2px solid #c99c42;border-radius:16px;padding:18px;touch-action:pan-y}.game-help::backdrop{background:#000c}.game-help p,.game-help li{line-height:1.6}.game-help button{min-height:44px;margin:4px;padding:8px 12px;background:#24293c;color:#fff;border:1px solid #c99c42;border-radius:9px}.tutorial-modal{position:fixed;inset:0;z-index:170;display:grid;place-items:center;background:#000c;padding:16px}.tutorial-box{width:min(520px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow-y:auto;background:#111420;color:#fff;border:3px solid #ffd54f;border-radius:18px;padding:22px;text-align:center;box-shadow:0 0 60px #000,0 0 30px #ffd54f55}.tutorial-box h3{margin:0 0 10px;color:#ffd54f;font-size:20px}.tutorial-box p{margin:0 0 16px;line-height:1.6;font-size:15px}.tutorial-box button{min-height:48px;min-width:180px;padding:10px 18px;background:#c99c42;color:#16120a;border:1px solid #ffe082;border-radius:12px;font-weight:bold;font-size:15px}.tutorial-box button:hover{background:#ffc857}@media(max-height:520px){.tutorial-box{padding:14px}.tutorial-box h3{font-size:17px}.tutorial-box p{font-size:13px;margin-bottom:10px}.tutorial-box button{min-height:42px;min-width:150px}}';document.head.append(css);
 const dialog=document.createElement('dialog');dialog.className='game-help';dialog.setAttribute('aria-label','Spielhilfe und Tutorial');document.body.append(dialog);
 const modal=document.createElement('div');modal.className='tutorial-modal hidden';modal.setAttribute('role','alertdialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','tutorial-title');document.body.append(modal);
 function open(html){previousFocus=document.activeElement;dialog.innerHTML=html;if(!dialog.open)dialog.showModal();dialog.querySelector('button')?.focus();}
 dialog.addEventListener('close',()=>{if(previousFocus?.isConnected&&visible(previousFocus))previousFocus.focus();else if(visible(el('game')))el('stage').focus();});
 function close(){dialog.close();}
 function tip(id){if(progress.skipped||progress[id]||pending||dialog.open||!modal.classList.contains('hidden'))return;pending=id;modal.innerHTML=`<div class="tutorial-box"><h3 id="tutorial-title">Hinweis</h3><p>${tips[id]}</p><button type="button">Verstanden</button></div>`;modal.querySelector('button').onclick=dismiss;modal.classList.remove('hidden');modal.querySelector('button').focus();}
 function dismiss(){if(pending){progress[pending]=true;save();pending=null;}modal.classList.add('hidden');modal.innerHTML='';if(previousFocus?.isConnected&&visible(previousFocus))previousFocus.focus();else if(visible(el('game')))el('stage').focus();}
 function welcome(){open('<h2>Deine erste Expedition</h2><p>Lerne Bewegung, Kampf, Ausrüstung und Skills direkt beim Spielen. Hinweise erscheinen mittig und müssen bestätigt werden.</p><button data-action="start">Tutorial starten</button><button data-action="skip">Überspringen</button>');}
 function help(){open('<h2>Hilfe zur Schattengruft</h2><h3>Steuerung</h3><p>PC: WASD / Pfeile. Enter / Leertaste: Interaktion auf der Karte. Tab / Shift+Tab: Auswahl. Enter / Leertaste: Bestätigen.</p><p>Handy: über die Karte wischen. Klicken zum Laufen ist deaktiviert.</p><h3>Kampf</h3><p>1 Angriff · 2 Feuerball (8 MP) · 3 Heiltrank · 4 Manatrank · 5 Flucht. Q / E / R: Klassenfähigkeiten 1 / 2 / 3. TP: Leben, MP: Mana. Flucht kann scheitern. Esc öffnet diese Hilfe ohne Spielzug.</p><h3>Recke</h3><p>I Inventar · C Ausrüstung · K Skills · L Chronik · P Speichern. Gegenstand antippen: Details und Vergleich. Nur Ausrüsten oder Nutzen führt die Aktion aus. Skills kosten Punkte und können Voraussetzungen haben.</p><h3>Spielablauf</h3><p>Besiege alle Gegner, um die Treppe freizugeben. Truhen öffnen sich beim Betreten; auf der Karte Enter oder Leertaste zum Interagieren drücken und den Treppendialog bestätigen. Bei Tod startet die Ebene neu; gesammeltes Gold geht an den Orden. Speichern benötigt eine Verbindung zum Ordensarchiv.</p><button data-action="close">Zurück zum Spiel</button><button data-action="restart">Tutorial erneut starten</button>');}
 dialog.addEventListener('click',e=>{const action=e.target.closest('button')?.dataset.action;if(action==='close')close();if(action==='start'){progress.started=true;progress.skipped=false;save();close();tip('move');}if(action==='skip'){progress.started=true;progress.skipped=true;save();close();}if(action==='restart'){progress={};save();pending=null;welcome();}});
 const button=document.createElement('button');button.id='game-help-button';button.type='button';button.textContent='❔ Hilfe';button.setAttribute('aria-keyshortcuts','H');button.onclick=()=>{load();help();};el('game').querySelector('.right').append(button);
 function check(){
  load();const active=visible(el('game'))&&!visible(el('death-screen'));if(!active){modal.classList.add('hidden');playing=false;return;}
  if(!playing){playing=true;last={x:state.player.x,y:state.player.y};if(!progress.started){welcome();return;}}
  if(dialog.open||progress.skipped)return;
  if(state.inCombat){dismiss();tip('combat');return;}
  if(last.x!==state.player.x||last.y!==state.player.y){if(pending==='move')dismiss();last.x=state.player.x;last.y=state.player.y;tip('interact');}
  if(state.player.skillPoints>0)tip('skills');
  if((state.player.inventory||[]).some(i=>!['health_potion','mana_potion','soul_shard'].includes(i.id)))tip('equipment');
  if(state.world.stairs&&state.world.monsters?.length===0)tip('stairs');
 }
 for(const id of ['game','death-screen','combat'])new MutationObserver(check).observe(el(id),{attributes:true,attributeFilter:['class']});
 new MutationObserver(check).observe(el('logs'),{childList:true});
 new MutationObserver(check).observe(el('skill-points'),{childList:true,characterData:true,subtree:true});
 window.addEventListener('keydown',e=>{
  if(dialog.open){if(e.key==='Escape'){e.preventDefault();close();}e.stopImmediatePropagation();return;}
  if(!modal.classList.contains('hidden')){if(e.key==='Enter'||e.key===' '||e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)dismiss();}return;}
  if(visible(el('intro-screen'))||e.target.matches('input,textarea,select')||e.target.isContentEditable)return;
  if(visible(el('game'))&&!visible(el('death-screen'))&&(e.key.toLowerCase()==='h'||(state.inCombat&&e.key==='Escape'))){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){load();help();}return;}
  if(pending&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dismiss();}
 },true);
 document.addEventListener('click',()=>queueMicrotask(check));
 check();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
