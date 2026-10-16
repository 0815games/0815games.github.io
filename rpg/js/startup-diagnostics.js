(function(){
'use strict';
var active=new URLSearchParams(location.search).get('diagnose')==='1';
var records=[],panel,output,toggle;
function clean(value){return String(value||'').replace(/https?:\/\/[^\s)]+/g,function(raw){try{var u=new URL(raw);return u.origin+u.pathname;}catch(e){return '[URL]';}}).slice(0,3000);}
function record(kind,value){if(!active)return;records.push(new Date().toISOString()+' '+kind+' '+clean(value));if(records.length>60)records.shift();refresh();}
function report(){return 'SCHATTENGRUFT STARTDIAGNOSE\nBuild: '+document.documentElement.getAttribute('data-rpg-build')+'\nBrowser: '+navigator.userAgent+'\nViewport: '+innerWidth+' x '+innerHeight+'\nDOM: '+document.readyState+'\nSpiel-API: '+(window.__rpg?'vorhanden':'nicht vorhanden')+'\n\n'+records.join('\n')+'\n\nKeine Konsolen-Vollaufzeichnung; Importfehler können ohne Dateidetails erscheinen. Bericht vor dem Teilen prüfen.';}
function refresh(){if(output)output.value=report();}
function navigate(enabled){var u=new URL(location.href);u.searchParams.set('diagnose',enabled?'1':'0');location.assign(u.href);}
if(active){
 window.addEventListener('error',function(e){if(e.target&&e.target!==window){record('LADEFEHLER',e.target.src||e.target.href||e.target.tagName);return;}record('FEHLER',(e.message||'Unbekannt')+' @ '+clean(e.filename)+':'+e.lineno+':'+e.colno+'\n'+(e.error&&e.error.stack||''));},true);
 window.addEventListener('unhandledrejection',function(e){var r=e.reason;record('PROMISE',r&&r.stack||r&&r.message||r||'Unbekannt');});
 record('START','Diagnose vor Spielmodulen aktiv');
 document.addEventListener('DOMContentLoaded',function(){record('DOM','DOMContentLoaded');});
 window.addEventListener('load',function(){record('FENSTER','load');});
 setTimeout(function(){var intro=document.getElementById('intro-screen');record('STATUS nach 15s','Intro '+(intro&&!intro.classList.contains('hidden')?'sichtbar':'nicht sichtbar')+'; Spiel-API '+(window.__rpg?'vorhanden':'fehlt')+'. Das allein beweist keinen Fehler.');},15000);
}
function setup(){
 var host=document.createElement('div');host.id='startup-diagnostics-host';document.body.appendChild(host);
 var root=host.attachShadow({mode:'open'});
 var style=document.createElement('style');style.textContent=':host{all:initial;position:fixed;right:max(8px,env(safe-area-inset-right));bottom:max(8px,env(safe-area-inset-bottom));z-index:2147483647;font:14px system-ui;color:#eee}button{min-height:44px;padding:8px 12px;border:1px solid #c99c42;border-radius:9px;background:#202535;color:#ffe09a;font:inherit;cursor:pointer}section{box-sizing:border-box;position:fixed;inset:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));max-width:720px;margin:auto;padding:14px;background:#111420;border:2px solid #c99c42;border-radius:14px;display:flex;flex-direction:column;gap:10px;overflow:auto}section[hidden]{display:none}h2,p{margin:0}p{font-size:13px;line-height:1.4}textarea{box-sizing:border-box;width:100%;min-height:140px;flex:1;background:#070a10;color:#eee;border:1px solid #626c80;padding:10px;font:12px/1.5 monospace;resize:none}nav{display:flex;gap:8px;flex-wrap:wrap}button:focus-visible,textarea:focus-visible{outline:3px solid #ffe082}';root.appendChild(style);
 toggle=document.createElement('button');toggle.type='button';toggle.textContent=active?'Diagnose aktiv':'Diagnose';root.appendChild(toggle);
 panel=document.createElement('section');panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Startdiagnose');root.appendChild(panel);
 var title=document.createElement('h2');title.textContent='Startdiagnose';panel.appendChild(title);
 var info=document.createElement('p');info.textContent=active?'Aktiv für diese URL. Keine automatische Übertragung. Nur Fehler und Startstatus, keine Spielstände oder Formulare. Meldungen vor dem Teilen prüfen.':'Ausgeschaltet. Einschalten lädt die Seite neu und erfasst danach Fehler unabhängig vom Spielstart. Ungespeicherter Spielfortschritt kann beim Neuladen verloren gehen.';panel.appendChild(info);
 output=document.createElement('textarea');output.readOnly=true;output.setAttribute('aria-label','Diagnosebericht zum Kopieren');output.hidden=!active;panel.appendChild(output);
 var status=document.createElement('p');status.setAttribute('role','status');panel.appendChild(status);
 var nav=document.createElement('nav');panel.appendChild(nav);
 function button(text,fn){var b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',fn);nav.appendChild(b);return b;}
 var first=button(active?'Ausschalten & neu laden':'Einschalten & neu laden',function(){if(confirm('Seite neu laden? Ungespeicherter Spielfortschritt kann verloren gehen.'))navigate(!active);});
 if(active){button('Bericht kopieren',async function(){refresh();try{if(!navigator.clipboard)throw new Error('Clipboard nicht verfügbar');await navigator.clipboard.writeText(output.value);status.textContent='Bericht kopiert.';}catch(e){output.focus();output.select();output.setSelectionRange(0,output.value.length);status.textContent='Bitte markierten Text manuell kopieren oder Screenshot senden.';}});button('Aktualisieren',refresh);button('Leeren',function(){records=[];refresh();});}
 button('Zuklappen',function(){panel.hidden=true;toggle.focus();});
 toggle.addEventListener('click',function(){panel.hidden=!panel.hidden;if(!panel.hidden){refresh();first.focus();}});
 root.addEventListener('keydown',function(e){e.stopPropagation();if(e.key==='Escape'){panel.hidden=true;toggle.focus();}});
 if(active){panel.hidden=false;refresh();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
