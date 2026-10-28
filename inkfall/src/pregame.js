(() => {
  'use strict';
  const frame = document.getElementById('inkfall-window');
  if (!frame || document.getElementById('if-pregame')) return;
  const classes = [
    {id:'knight',name:'Ritter',role:'Nahkampf und Kontrolle',description:'Kämpft auf kurze Distanz. Schildstoß schädigt und verlangsamt Bodengegner in seiner Nähe.',ability:'Schildstoß · 10 Sekunden Abklingzeit',strength:'Stärkerer einzelner Basisangriff, kurze Angriffsreichweite.',available:true},
    {id:'mage',name:'Elementarmagier',role:'Fernkampf und Flächenkontrolle',description:'Greift aus größerer Entfernung an. Frostnova schädigt und verlangsamt Gegner im Umkreis.',ability:'Frostnova · 12 Sekunden Abklingzeit',strength:'Größere Reichweite, schwächerer einzelner Basisangriff.',available:true},
    {id:'rogue',name:'Schattenklinge',role:'Mobilität und Elite-Jagd'},
    {id:'engineer',name:'Tüftler',role:'Türme und Fallen'},
    {id:'druid',name:'Naturdruide',role:'Natur und Unterstützung'},
    {id:'bard',name:'Barde',role:'Verstärkung und Schwächung'}
  ];
  const style = document.createElement('style');
  style.textContent = `
    #if-pregame .if-class-info{position:relative;overflow:visible;margin-top:22px;padding-top:18px}
    #if-pregame .if-wood-name{box-sizing:border-box;position:absolute;top:-22px;right:12px;z-index:2;width:max-content;max-width:calc(100% - 24px);padding:9px 23px;border:3px solid #392a28;border-radius:7px 4px 9px 5px;background:repeating-linear-gradient(3deg,transparent 0 9px,#61351d26 10px 11px),linear-gradient(#c58b4d,#a76a35 48%,#8d542d);color:#fff2c9;font:900 17px/1.2 Georgia,serif;text-shadow:0 2px 0 #56311e;box-shadow:inset 0 2px #f1c77c,inset 0 -3px #653a24,2px 5px 0 #17213755;transform:rotate(3deg);overflow-wrap:anywhere}
    #if-pregame .if-wood-name::before{content:'';position:absolute;top:-18px;left:14px;right:14px;height:18px;background:linear-gradient(90deg,#e5c997 0 4px,transparent 4px calc(100% - 4px),#e5c997 calc(100% - 4px));filter:drop-shadow(1px 0 #51372a)}
    #if-pregame .if-name-form{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:8px 0}
    #if-pregame .if-name-form label{font-weight:800;font-size:12px}
    #if-pregame #if-hero-name{box-sizing:border-box;width:min(230px,100%);padding:9px 12px;border:2px solid #49354a;border-radius:10px 6px 12px 7px;background:linear-gradient(#fff9e9,#f3dfb4);box-shadow:inset 0 2px 4px #75513433;color:#322942;font:800 14px/1.25 Georgia,serif}
    #if-pregame #if-hero-name:focus-visible{outline:3px solid #61cad8;outline-offset:2px}
    #if-pregame .if-name-note{font-size:11px;color:#4a5264;margin:5px 0}
    #if-pregame #if-reset-character{background:linear-gradient(#ffe8cf,#edb494);border-color:#663e42;color:#64323c}
    #if-pregame .if-character-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
    @media(max-width:650px){#if-pregame .if-wood-name{font-size:14px;padding:8px 17px}}
  `;
  document.head.append(style);
  const screen = document.createElement('section');
  screen.id = 'if-pregame';
  screen.hidden = true;
  screen.setAttribute('aria-label','Spielvorbereitung');
  frame.append(screen);
  let chosen = 'knight', busy = false;
  const drafts = {};
  const character = id => currentProfile?.characters?.[id];
  const locked = (data,id) => data?.heroNameLocked === true || (data?.heroNameLocked !== false && typeof data?.heroName === 'string' && data.heroName.trim() !== '' && data.heroName !== HERO[id].name);
  const unavailable = () => active || characterSaveBusy || window.inkfallMode === 'lobby';
  function status(text){const target=screen.querySelector('#if-pregame-message');if(target)target.textContent=text;}
  function ensureAccount(user){if(auth.currentUser?.uid!==user.uid)throw new Error('Account wurde während der Aktion geändert.');}
  function sync(id,data,user){
    ensureAccount(user);
    currentProfile.characters ||= {};
    currentProfile.characters[id]=data;
    if(activeCharacterId===id){hero.name=data.heroName||HERO[id].name;ui();}
    updateAccountUI();
  }
  window.setHeroName = async function(id,value){
    if(!['knight','mage'].includes(id))throw new Error('Diese Klasse ist noch nicht verfügbar.');
    const user=auth.currentUser;
    if(!user || characterLoadedUid!==user.uid || !currentProfile)throw new Error('Bitte zuerst das Charakterprofil laden.');
    const name=String(value||'').trim();
    if(!name)return character(id)?.heroName||HERO[id].name;
    if(name.length<3 || name.length>20 || /[\u0000-\u001f\u007f]/.test(name))throw new Error('Bitte einen Namen mit 3–20 Zeichen ohne Steuerzeichen eingeben.');
    if(unavailable())throw new Error('Benennen ist während einer Welle, Speicherung oder in der Coop-Lobby gesperrt.');
    const ref=db.ref('users/'+user.uid+'/characters/'+id);
    characterSaveBusy=true;
    try{
      await ref.get();
      const result=await ref.transaction(data=>{
        if(auth.currentUser?.uid!==user.uid)return;
        data=data||freshCharacter(id);
        if(locked(data,id))return;
        return {...data,heroName:name,heroNameLocked:true};
      },undefined,false);
      ensureAccount(user);
      const data=result.snapshot.val();
      if(!result.committed){
        if(data)sync(id,data,user);
        if(data?.heroName===name && locked(data,id))return name;
        throw new Error('Der Name ist bereits fest vergeben. Nur ein vollständiger Charakter-Reset gibt ihn wieder frei.');
      }
      sync(id,data,user);
      return data.heroName;
    }finally{characterSaveBusy=false;}
  };
  async function fixName(){
    const id=chosen;
    const value=String(drafts[id]||'').trim();
    if(value.length<3 || value.length>20)throw new Error('Bitte einen Namen mit 3–20 Zeichen eingeben.');
    if(unavailable())throw new Error('Namensvergabe ist gerade gesperrt.');
    const yes=await inkfallDialog({title:'Namen dauerhaft festlegen?',message:'„'+value+'“ bleibt der Name dieses Charakters. Er kann nur durch einen vollständigen Reset des Charakters geändert werden.',confirmText:'Namen festlegen',cancelText:'Abbrechen'});
    if(!yes)return false;
    await window.setHeroName(id,value);
    delete drafts[id];
    return true;
  }
  async function resetCharacter(){
    const id=chosen,user=auth.currentUser;
    if(!user || characterLoadedUid!==user.uid || !currentProfile)throw new Error('Charakterprofil ist noch nicht geladen.');
    if(unavailable())throw new Error('Reset während einer Welle, Speicherung oder in der Coop-Lobby gesperrt.');
    const name=character(id)?.heroName||HERO[id].name;
    const yes=await inkfallDialog({title:'Charakter vollständig zurücksetzen?',message:'„'+name+'“ ('+HERO[id].name+'): Name, Level, XP, Skills, Skillpunkte, Türme und Solo-Fortschritt werden unwiderruflich zurückgesetzt. Account und andere Klassen bleiben erhalten.',confirmText:'Vollständig zurücksetzen',cancelText:'Behalten'});
    if(!yes)return;
    ensureAccount(user);
    if(unavailable())throw new Error('Reset ist gerade gesperrt.');
    const data={...freshCharacter(id),heroName:HERO[id].name,heroNameLocked:false};
    characterSaveBusy=true;
    try{
      await db.ref('users/'+user.uid+'/characters/'+id).set(data);
      ensureAccount(user);
      if(activeCharacterId===id)applyCharacter(id,data);
      sync(id,data,user);
      delete drafts[id];
    }finally{characterSaveBusy=false;}
  }
  async function action(callback){
    if(busy)return;busy=true;
    screen.querySelectorAll('button,input').forEach(el=>el.disabled=true);
    try{await callback();busy=false;render();}
    catch(error){busy=false;render();status(error.message);}
  }
  function render(){
    const item=classes.find(c=>c.id===chosen),data=character(chosen),fixed=locked(data,chosen);
    screen.replaceChildren();
    const shell=document.createElement('div');shell.className='if-pregame-shell';
    shell.innerHTML=`<header class="if-pregame-heading"><h1>Dein Held</h1><button id="if-pregame-back" class="if-pregame-button secondary">Zurück</button></header><p class="if-pregame-description">Wähle deine Klasse und bereite dich auf die Verteidigung vor.</p><div class="if-player-slots"><div class="if-player-slot"><strong>Spieler 1 · Du</strong><span id="if-local-player"></span></div></div><div id="if-class-grid" class="if-class-grid"></div><section id="if-class-info" class="if-class-info"><div class="if-wood-name"></div><h2></h2><div id="if-name-controls"></div><div id="if-class-description"></div><div class="if-character-actions"><button id="if-reset-character" class="if-pregame-button secondary">Charakter zurücksetzen</button></div></section><footer class="if-pregame-footer"><button id="if-pregame-start" class="if-pregame-button"></button><p id="if-pregame-message" role="status" aria-live="polite"></p></footer>`;
    screen.append(shell);
    shell.querySelector('#if-local-player').textContent=currentProfile?.profile?.displayName||auth.currentUser?.displayName||'Wächter';
    const grid=shell.querySelector('#if-class-grid');
    for(const c of classes){
      const button=document.createElement('button');
      button.type='button';button.className='if-class-card'+(c.id===chosen?' selected':'');button.disabled=!c.available;button.setAttribute('aria-pressed',String(c.id===chosen));
      if(c.available){const img=document.createElement('img');img.src='assets/art/heroes/'+c.id+'.svg';img.alt='';img.onerror=()=>img.hidden=true;button.append(img);}
      else{const icon=document.createElement('div');icon.className='if-class-placeholder';icon.textContent='✦';button.append(icon);}
      for(const [tag,text] of [['strong',c.name],['small',c.role],...(!c.available?[['small','Noch nicht implementiert']]:[])]){const el=document.createElement(tag);el.textContent=text;button.append(el);}
      button.onclick=()=>{if(busy)return;if(active){status('Während einer laufenden Welle ist kein Klassenwechsel möglich.');return;}chosen=c.id;render();};grid.append(button);
    }
    shell.querySelector('.if-wood-name').textContent=fixed?data.heroName:item.name;
    shell.querySelector('#if-class-info h2').textContent=item.name+' · Level '+(data?.level||1);
    const controls=shell.querySelector('#if-name-controls');
    if(fixed){const note=document.createElement('p');note.className='if-name-note';note.textContent='Name fest vergeben · Nur durch vollständigen Charakter-Reset änderbar.';controls.append(note);}
    else{
      controls.innerHTML='<div class="if-name-form"><label for="if-hero-name">Name deines Helden</label><input id="if-hero-name" minlength="3" maxlength="20" autocomplete="off" placeholder="Dein Heldenname …"><button id="if-fix-name" class="if-pregame-button">Namen festlegen</button></div><p class="if-name-note">3–20 Zeichen · Einmalige Vergabe bis zum vollständigen Reset.</p>';
      const input=controls.querySelector('input');input.value=drafts[chosen]||'';input.disabled=unavailable();input.oninput=()=>drafts[chosen]=input.value;
      controls.querySelector('button').disabled=unavailable();controls.querySelector('button').onclick=()=>action(fixName);
    }
    for(const text of [item.description,item.ability,item.strength]){const p=document.createElement('p');p.textContent=text;shell.querySelector('#if-class-description').append(p);}
    const reset=shell.querySelector('#if-reset-character');reset.disabled=unavailable()||!data;reset.onclick=()=>action(resetCharacter);
    shell.querySelector('#if-pregame-back').onclick=()=>{if(!busy)screen.hidden=true;};
    const start=shell.querySelector('#if-pregame-start');start.textContent=(wave>0||active||towers.length)?'Spiel fortsetzen':'Verteidigung betreten';
    start.onclick=()=>action(async()=>{
      const original=document.getElementById('if-single');
      if(typeof original?.onclick!=='function')throw new Error('Start-Handler fehlt. Bitte zum Hauptmenü zurückkehren.');
      if(!locked(character(chosen),chosen) && String(drafts[chosen]||'').trim()){if(!await fixName())return;}
      await window.selectSoloCharacter(chosen);screen.hidden=true;original.onclick();
    });
    status(active?'Laufende Welle pausiert. Deine aktuelle Klasse bleibt erhalten.':'Deine anderen Klassen bleiben vom Reset unberührt.');
  }
  document.addEventListener('click',event=>{
    if(!event.target.closest?.('#if-single'))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(busy)return;chosen=['knight','mage'].includes(hero.cls)?hero.cls:'knight';speed=0;screen.hidden=false;render();
  },true);
})();
