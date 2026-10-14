import { state } from '../core/state.js';
function setup(){
 const el=id=>document.getElementById(id);
 const visible=n=>n&&!n.closest('.hidden')&&n.getClientRects().length>0;
 const tips={move:'Bewege dich: Tippe ein entdecktes Feld an oder wische über die Karte. Am PC: WASD oder Pfeile.',interact:'Truhen öffnen sich beim Betreten. Auf einer Treppe erneut auf deinen Helden tippen oder E drücken.',combat:'TP sind Lebenspunkte, MP ist Mana. 1 Angriff, 2 Feuerball (8 MP), 3 Heiltrank, 4 Flucht. Tab wählt, Enter bestätigt.',equipment:'Im Inventar einen Gegenstand auswählen und aktivieren, um ihn anzulegen oder zu nutzen. Ausrüstung verändert Werte und das Aussehen.',skills:'Du hast einen Skillpunkt! Öffne Skills mit ✨ oder K und lerne einen verfügbaren Rang.',stairs:'Das Runensiegel ist gebrochen. Suche die Treppe und steige hinab. Hilfe findest du jederzeit über ❔ oder H.'};
 let key='',progress={},last={},pending=null,playing=false,previousFocus=null;
 function save(){try{localStorage.setItem(key,JSON.stringify(progress));}catch{}}
 function load(){const next=`schattengruft-tutorial-v1:${state.user?.uid||'local'}`;if(next===key)return;key=next;try{progress=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{progress={};}last={};pending=null;playing=false;}
 const css=document.createElement('style');css.textContent='.game-help{width:min(600px,calc(100vw - 24px));max-height:calc(100dvh - 32px);overflow-x:hidden;overflow-y:auto;background:#111420;color:#e8e4d9;border:2px solid #c99c42;border-radius:16px;padding:18px;touch-action:pan-y}.game-help::backdrop{background:#000c}.game-help p,.game-help li{line-height:1.6}.game-help button{min-height:44px;margin:4px;padding:8px 12px;background:#24293c;color:#fff;border:1px solid #c99c42;border-radius:9px}.tutorial-note{position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:160;background:#171b28;color:#fff;border:1px solid #ffd54f;border-radius:12px;padding:12px;line-height:1.5;font-size:14px}.tutorial-note button{min-height:44px;margin-top:8px;padding:8px;border:1px solid #c99c42;background:#24293c;color:#fff;border-radius:8px}';document.head.append(css);
 const dialog=document.createElement('dialog');dialog.className='game-help';dialog.setAttribute('aria-label','Spielhilfe und Tutorial');document.body.append(dialog);
 const note=document.createElement('div');note.className='tutorial-note hidden';note.setAttribute('role','status');document.body.append(note);
 function open(html){note.classList.add('hidden');previousFocus=document.activeElement;dialog.innerHTML=html;if(!dialog.open)dialog.showModal();dialog.querySelector('button')?.focus();}
 dialog.addEventListener('close',()=>{if(previousFocus?.isConnected&&visible(previousFocus))previousFocus.focus();else if(visible(el('game')))el('stage').focus();});
 function close(){dialog.close();}
 function dismiss(){if(pending){progress[pending]=true;save();pending=null;}note.classList.add('hidden');}
 function tip(id){if(progress.skipped||progress[id]||pending||dialog.open)return;pending=id;note.replaceChildren();const text=document.createElement('div');text.textContent=tips[id];const b=document.createElement('button');b.type='button';b.textContent='Verstanden';b.onclick=dismiss;note.append(text,b);note.classList.remove('hidden');}
 function welcome(){open('<h2>Deine erste Expedition</h2><p>Lerne Bewegung, Kampf, Ausrüstung und Skills direkt beim Spielen. Hinweise erscheinen, wenn du sie brauchst.</p><button data-action="start">Tutorial starten</button><button data-action="skip">Überspringen</button>');}
 function help(){open('<h2>Hilfe zur Schattengruft</h2><h3>Steuerung</h3><p>Handy: entdecktes Kartenfeld antippen oder wischen. PC: WASD / Pfeile. E: Interaktion. Tab / Shift+Tab: Auswahl. Enter / Leertaste: Bestätigen.</p><h3>Kampf</h3><p>1 Angriff · 2 Feuerball (8 MP) · 3 Heiltrank · 4 Flucht. TP: Leben, MP: Mana. Flucht kann scheitern. Esc öffnet diese Hilfe ohne Spielzug.</p><h3>Recke</h3><p>I Inventar · C Ausrüstung · K Skills · L Chronik · P Speichern. Gegenstände aktivieren: nutzen oder ausrüsten. Skills kosten Punkte und können Voraussetzungen haben.</p><h3>Spielablauf</h3><p>Besiege alle Gegner, um die Treppe freizugeben. Truhen öffnen sich beim Betreten; auf der Treppe erneut tippen oder E drücken. Bei Tod startet die Ebene neu; gesammeltes Gold geht an den Orden. Speichern benötigt eine Verbindung zum Ordensarchiv.</p><button data-action="close">Zurück zum Spiel</button><button data-action="restart">Tutorial erneut starten</button>');}
 dialog.addEventListener('click',e=>{const action=e.target.closest('button')?.dataset.action;if(action==='close')close();if(action==='start'){progress.started=true;progress.skipped=false;save();close();tip('move');}if(action==='skip'){progress.started=true;progress.skipped=true;save();close();}if(action==='restart'){progress={};save();pending=null;welcome();}});
 const button=document.createElement('button');button.id='game-help-button';button.type='button';button.textContent='❔ Hilfe';button.setAttribute('aria-keyshortcuts','H');button.onclick=()=>{load();help();};el('game').querySelector('.right').append(button);
 function check(){
  load();const active=visible(el('game'))&&!visible(el('death-screen'));if(!active){note.classList.add('hidden');playing=false;return;}
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
  if(visible(el('intro-screen'))||e.target.matches('input,textarea,select')||e.target.isContentEditable)return;
  if(visible(el('game'))&&!visible(el('death-screen'))&&(e.key.toLowerCase()==='h'||(state.inCombat&&e.key==='Escape'))){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){load();help();}return;}
  if(pending&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dismiss();}
 },true);
 document.addEventListener('click',()=>queueMicrotask(check));
 check();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
