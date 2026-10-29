(() => {
'use strict';
const frame=document.getElementById('inkfall-window');
if(!frame||document.getElementById('if-pregame'))return;
const classes=[
{id:'knight',name:'Ritter',role:'Nahkampf und Kontrolle',description:'Kämpft auf kurze Distanz. Schildstoß schädigt und verlangsamt Bodengegner in seiner Nähe.',ability:'Schildstoß · 10 Sekunden Abklingzeit',strength:'Stärkerer einzelner Basisangriff, kurze Angriffsreichweite.',available:true},
{id:'mage',name:'Elementarmagier',role:'Fernkampf und Flächenkontrolle',description:'Greift aus größerer Entfernung an. Frostnova schädigt und verlangsamt Gegner im Umkreis.',ability:'Frostnova · 12 Sekunden Abklingzeit',strength:'Größere Reichweite, schwächerer einzelner Basisangriff.',available:true},
{id:'rogue',name:'Schattenklinge',role:'Mobilität und Elite-Jagd'},
{id:'engineer',name:'Tüftler',role:'Türme und Fallen'},
{id:'druid',name:'Naturdruide',role:'Natur und Unterstützung'},
{id:'bard',name:'Barde',role:'Verstärkung und Schwächung'}];
const style=document.createElement('style');
style.textContent=`
#if-pregame{box-sizing:border-box;overflow:hidden}
#if-pregame .if-pregame-shell{height:100%;min-height:0;gap:10px}
#if-pregame .if-pregame-heading,#if-pregame .if-pregame-footer{flex-shrink:0}
#if-pregame .if-selection-body{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:4px 7px 12px;scrollbar-gutter:stable}
#if-pregame .if-player-slots{margin-bottom:12px}
#if-pregame .if-class-grid{gap:25px 12px;margin-bottom:25px}
#if-pregame .if-class-tile{position:relative;min-width:0}
#if-pregame .if-class-card{box-sizing:border-box;display:block;height:100%;min-height:115px;padding:10px 8px}
#if-pregame .if-wood-name{box-sizing:border-box;position:absolute;bottom:-13px;right:3px;z-index:2;width:max-content;max-width:calc(100% - 6px);padding:6px 14px;border:2px solid #392a28;border-radius:6px 3px 8px 4px;background:repeating-linear-gradient(3deg,transparent 0 7px,#61351d26 8px 9px),linear-gradient(#c58b4d,#a76a35 48%,#8d542d);color:#fff2c9;font:900 13px/1.2 Georgia,serif;text-shadow:0 1px #56311e;box-shadow:inset 0 2px #f1c77c,inset 0 -2px #653a24,1px 3px 0 #17213755;transform:rotate(3deg);overflow-wrap:anywhere;pointer-events:none}
#if-pregame .if-wood-name::before{content:'';position:absolute;top:-10px;left:10px;right:10px;height:10px;background:linear-gradient(90deg,#e5c997 0 3px,transparent 3px calc(100% - 3px),#e5c997 calc(100% - 3px));filter:drop-shadow(1px 0 #51372a)}
#if-pregame .if-compact-section{margin:7px 0;border:2px solid #182141;border-radius:11px;background:#d8eff5;color:#26304d;overflow:hidden;font-size:12px;line-height:1.4}
#if-pregame .if-compact-section summary{padding:11px 12px;min-height:20px;cursor:pointer;font-weight:800}
#if-pregame .if-compact-section summary:focus-visible{outline:3px solid #61cad8;outline-offset:-3px}
#if-pregame .if-compact-content{padding:0 12px 10px}
#if-pregame .if-compact-content p{margin:5px 0}
#if-pregame .if-name-form{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
#if-pregame .if-name-form label{flex-basis:100%;font-weight:800}
#if-pregame #if-hero-name{box-sizing:border-box;flex:1;min-width:100px;width:160px;padding:10px 12px;border:2px solid #49354a;border-radius:10px 6px 12px 7px;background:linear-gradient(#fff9e9,#f3dfb4);box-shadow:inset 0 2px 4px #75513433;color:#322942;font:800 16px/1.25 Georgia,serif}
#if-pregame #if-hero-name:focus-visible{outline:3px solid #61cad8;outline-offset:2px}
#if-pregame #if-reset-character{background:linear-gradient(#ffe8cf,#edb494);border-color:#663e42;color:#64323c}
#if-pregame .if-pregame-footer{position:static;margin:0;padding:10px;border:2px solid #465479;border-radius:12px;background:#202d48;align-items:center}
#if-pregame #if-pregame-start{min-height:44px}
@media(max-width:650px){#if-pregame .if-class-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 9px}#if-pregame .if-pregame-description{font-size:12px}#if-pregame .if-pregame-footer{gap:5px}#if-pregame #if-pregame-start{width:100%}#if-pregame .if-wood-name{font-size:12px;padding:5px 10px}}
`;
document.head.append(style);
const screen=document.createElement('section');screen.id='if-pregame';screen.hidden=true;screen.setAttribute('aria-label','Spielvorbereitung');frame.append(screen);
let chosen='knight',busy=false;const drafts={};
const character=id=>currentProfile?.characters?.[id];
const locked=(data,id)=>heroNameState(data,id).assigned;
const unavailable=()=>active||characterSaveBusy||window.inkfallMode==='lobby';
function status(text){const target=screen.querySelector('#if-pregame-message');if(target)target.textContent=text;}
function ensureAccount(user){if(auth.currentUser?.uid!==user.uid)throw new Error('Account wurde während der Aktion geändert.');}
function sync(id,data,user){ensureAccount(user);currentProfile.characters||={};currentProfile.characters[id]=data;if(activeCharacterId===id){hero.name=data.heroName||HERO[id].name;ui();}updateAccountUI();}
async function fixName(){const id=chosen,value=String(drafts[id]||'').trim();if(value.length<3||value.length>20)throw new Error('Bitte einen Namen mit 3–20 Zeichen eingeben.');if(unavailable())throw new Error('Namensvergabe ist gerade gesperrt.');const yes=await inkfallDialog({title:'Namen dauerhaft festlegen?',message:'„'+value+'“ bleibt der Name dieses Charakters. Er kann nur durch einen vollständigen Reset des Charakters geändert werden.',confirmText:'Namen festlegen',cancelText:'Abbrechen'});if(!yes)return false;await window.setHeroName(id,value);delete drafts[id];return true;}
async function resetCharacter(){
const id=chosen,user=auth.currentUser;if(!user||characterLoadedUid!==user.uid||!currentProfile)throw new Error('Charakterprofil ist noch nicht geladen.');if(unavailable())throw new Error('Reset während einer Welle, Speicherung oder in der Coop-Lobby gesperrt.');
const name=character(id)?.heroName||HERO[id].name;const yes=await inkfallDialog({title:'Charakter vollständig zurücksetzen?',message:'„'+name+'“ ('+HERO[id].name+'): Name, Level, XP, Skills, Skillpunkte, Türme und Solo-Fortschritt werden unwiderruflich zurückgesetzt. Account und andere Klassen bleiben erhalten.',confirmText:'Vollständig zurücksetzen',cancelText:'Behalten'});
if(!yes)return;ensureAccount(user);if(unavailable())throw new Error('Reset ist gerade gesperrt.');const data={...freshCharacter(id),heroName:HERO[id].name,heroNameLocked:false};characterSaveBusy=true;try{await db.ref('users/'+user.uid+'/characters/'+id).set(data);ensureAccount(user);if(activeCharacterId===id)applyCharacter(id,data);sync(id,data,user);delete drafts[id];}finally{characterSaveBusy=false;}
}
async function action(callback){if(busy)return;busy=true;screen.querySelectorAll('button,input').forEach(el=>el.disabled=true);try{await callback();busy=false;render();}catch(error){busy=false;render();status(error.message);}}
function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function section(parent,title){const details=element('details',undefined,'if-compact-section');details.append(element('summary',title));const body=element('div',undefined,'if-compact-content');details.append(body);parent.append(details);return body;}
function render(){
const item=classes.find(c=>c.id===chosen),data=character(chosen),fixed=locked(data,chosen);screen.replaceChildren();
const shell=element('div',undefined,'if-pregame-shell');
shell.innerHTML='<header class="if-pregame-heading"><h1>Dein Held</h1><button id="if-pregame-back" class="if-pregame-button secondary">Zurück</button></header><div class="if-selection-body"><p class="if-pregame-description">Wähle deine Klasse. Benannte Helden erkennst du am Holzschild.</p><div class="if-player-slots"><div class="if-player-slot"><strong>Spieler 1 · Du</strong><span id="if-local-player"></span></div></div><div id="if-class-grid" class="if-class-grid"></div><div id="if-character-details"></div></div><footer class="if-pregame-footer"><button id="if-pregame-start" class="if-pregame-button"></button><p id="if-pregame-message" role="status" aria-live="polite"></p></footer>';screen.append(shell);
shell.querySelector('#if-local-player').textContent=currentProfile?.profile?.displayName||auth.currentUser?.displayName||'Wächter';
const grid=shell.querySelector('#if-class-grid');
for(const c of classes){
const tile=element('div',undefined,'if-class-tile'),button=element('button',undefined,'if-class-card'+(c.id===chosen?' selected':''));button.type='button';button.disabled=!c.available;button.setAttribute('aria-pressed',String(c.id===chosen));
if(c.available){const img=document.createElement('img');img.src='assets/art/heroes/'+c.id+'.svg';img.alt='';img.onerror=()=>img.hidden=true;button.append(img);}else button.append(element('div','✦','if-class-placeholder'));
button.append(element('strong',c.name),element('small',c.role));if(!c.available)button.append(element('small','Noch nicht implementiert'));
const saved=c.available?character(c.id):null;if(c.available&&locked(saved,c.id)){button.setAttribute('aria-label',c.name+' · '+saved.heroName);tile.append(element('span',heroNameState(saved,c.id).name,'if-wood-name'));}
button.onclick=()=>{if(busy)return;if(active){status('Während einer laufenden Welle ist kein Klassenwechsel möglich.');return;}chosen=c.id;render();};tile.prepend(button);grid.append(tile);
}
const details=shell.querySelector('#if-character-details');
const management=section(details,'Charakter verwalten');
management.append(element('strong',item.name+' · Level '+(data?.level||1)));
const info=management;for(const text of [item.description,item.ability,item.strength])info.append(element('p',text));
if(fixed)management.append(element('p','Heldenname: '+heroNameState(data,chosen).name+' · Fest vergeben.'));
if(!fixed){const body=management;body.innerHTML='<form class="if-name-form"><label for="if-hero-name">Name deines Helden</label><input id="if-hero-name" minlength="3" maxlength="20" autocomplete="off" placeholder="Dein Heldenname …"><button class="if-pregame-button" type="submit">Namen festlegen</button></form><p>3–20 Zeichen · Bleibt bis zum vollständigen Reset erhalten.</p>';const input=body.querySelector('input');input.value=drafts[chosen]||'';input.disabled=unavailable();input.oninput=()=>drafts[chosen]=input.value;body.querySelector('button').disabled=unavailable();body.querySelector('form').onsubmit=event=>{event.preventDefault();action(fixName);};}
management.append(element('p',fixed?'Der Name ist fest vergeben. Ein vollständiger Reset löscht auch den Fortschritt.':'Ein vollständiger Reset betrifft nur diese Klasse.'));const reset=element('button','Charakter zurücksetzen','if-pregame-button secondary');reset.id='if-reset-character';reset.disabled=unavailable()||!data;reset.onclick=()=>action(resetCharacter);management.append(reset);
shell.querySelector('#if-pregame-back').onclick=()=>{if(!busy)screen.hidden=true;};
const start=shell.querySelector('#if-pregame-start');start.textContent=(wave>0||active||towers.length)?'Spiel fortsetzen':'Verteidigung betreten';start.onclick=()=>action(async()=>{const original=document.getElementById('if-single');if(typeof original?.onclick!=='function')throw new Error('Start-Handler fehlt. Bitte zum Hauptmenü zurückkehren.');if(!locked(character(chosen),chosen)&&String(drafts[chosen]||'').trim()){if(!await fixName())return;}await window.selectSoloCharacter(chosen);screen.hidden=true;original.onclick();});status(active?'Laufende Welle pausiert.':'');
}
document.addEventListener('click',event=>{if(!event.target.closest?.('#if-single'))return;event.preventDefault();event.stopImmediatePropagation();if(busy)return;chosen=['knight','mage'].includes(hero.cls)?hero.cls:'knight';speed=0;screen.hidden=false;render();action(async()=>{await window.refreshHeroNames();});},true);
})();
