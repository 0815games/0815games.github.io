(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.InkfallSocialUI=api;})(globalThis,()=>{
'use strict';
function normalizePrivacy(value){
 if(value==null)return {profile:'private',characters:'private'};
 if(typeof value!=='object'||Array.isArray(value))throw Error('invalid-privacy');
 const result={};for(const key of ['profile','characters']){const item=value[key]??'private';if(!['private','friends'].includes(item))throw Error('invalid-privacy');result[key]=item;}return result;
}
function createPrivacyController({read,save,canUse}){
 let state={uid:null,loaded:false,loading:false,saving:false,saved:normalizePrivacy(null),draft:normalizePrivacy(null),error:null,message:null};
 let epoch=0,pending=null;
 const listeners=new Set(),copy=x=>JSON.parse(JSON.stringify(x));
 const dirty=()=>state.saved.profile!==state.draft.profile||state.saved.characters!==state.draft.characters;
 const snapshot=()=>({...copy(state),dirty:dirty(),available:Boolean(state.uid&&canUse())});
 const emit=()=>listeners.forEach(fn=>fn(snapshot()));
 function setUser(uid){if((uid||null)===state.uid)return;epoch++;pending=null;state={uid:uid||null,loaded:false,loading:false,saving:false,saved:normalizePrivacy(null),draft:normalizePrivacy(null),error:null,message:null};emit();}
 function load({discard=false}={}){
  if(!state.uid||!canUse()||state.saving)return Promise.resolve(false);
  if(pending)return pending;
  if(state.loaded&&dirty()&&!discard)return Promise.resolve(false);
  const token=epoch,uid=state.uid;state.loading=true;state.error=null;state.message=null;
  pending=Promise.resolve().then(()=>token===epoch?read(uid):null).then(raw=>{
   if(token!==epoch)return false;
   const value=normalizePrivacy(raw);state.saved=value;state.draft={...value};state.loaded=true;return true;
  }).catch(()=>{if(token===epoch){state.loaded=false;state.error='Einstellungen konnten nicht geladen werden. Es wurde nichts geändert.';}return false;}).finally(()=>{if(token===epoch){pending=null;state.loading=false;emit();}});
  emit();return pending;
 }
 function set(key,value){if(!state.loaded||state.loading||state.saving||!state.uid||!canUse()||!['profile','characters'].includes(key)||!['private','friends'].includes(value))return false;state.draft={...state.draft,[key]:value};state.message=null;state.error=null;emit();return true;}
 function reset(){if(state.loading||state.saving)return;state.draft={...state.saved};state.error=null;state.message=null;emit();}
 async function submit(){
  if(!state.uid||!canUse()||!state.loaded||state.loading||state.saving||!dirty())return false;
  const token=epoch,uid=state.uid,sent={...state.draft};state.saving=true;state.error=null;state.message=null;emit();
  let acknowledged=false;
  try{if(token!==epoch)return false;acknowledged=(await save({...sent}))===true;}catch{}
  if(token!==epoch)return false;
  try{
   const actual=normalizePrivacy(await read(uid));if(token!==epoch)return false;
   state.saved=actual;state.loaded=true;
   if(acknowledged&&actual.profile===sent.profile&&actual.characters===sent.characters){state.draft={...actual};state.message='Datenschutz-Einstellungen gespeichert und bestätigt.';return true;}
   state.error=acknowledged?'Der Serverstand weicht vom Entwurf ab. Bitte prüfen und bei Bedarf erneut speichern.':'Die Aktion wurde nicht vollständig bestätigt. Der angezeigte Serverstand wurde neu geladen; die Veröffentlichung kann fehlgeschlagen sein.';
   return false;
  }catch{
   if(token===epoch){state.loaded=false;state.error='Speicherergebnis unbekannt. Bitte den Serverstand neu laden, bevor du weiteränderst.';}return false;
  }finally{if(token===epoch){state.saving=false;emit();}}
 }
 return {snapshot,setUser,load,set,reset,submit,subscribe(fn){listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn);},destroy(){epoch++;pending=null;listeners.clear();state={uid:null,loaded:false,loading:false,saving:false,saved:normalizePrivacy(null),draft:normalizePrivacy(null),error:null,message:null};}};
}
function privacyCard({doc,controller,busy=false}){
 const state=controller.snapshot(),card=doc.createElement('section');card.className='if-social-code-card';card.style.gridColumn='1 / -1';card.setAttribute('aria-labelledby','if-social-privacy-title');card.setAttribute('aria-busy',String(state.loading||state.saving));
 function text(tag,value){const n=doc.createElement(tag);n.textContent=value;card.append(n);return n;}
 const title=text('h3','Deine Privatsphäre');title.id='if-social-privacy-title';
 text('p','Du entscheidest, was bestätigte Freunde sehen dürfen. Änderungen werden erst mit „Speichern“ übernommen.');
 for(const [key,label,description] of [['profile','Spielerprofil','Dein freigegebenes Profil mit Anzeigenamen.'],['characters','Charaktere & Skills','Charakterblätter, gespeicherter Fortschritt und gelernte Skills.']]){
  const group=doc.createElement('div');group.style.cssText='padding:14px 0;border-bottom:2px solid #d0b28a;';
  const heading=doc.createElement('strong');heading.textContent=label;heading.id='if-social-privacy-'+key;
  const hint=doc.createElement('p');hint.textContent=description;
  const toggle=doc.createElement('button');toggle.type='button';toggle.dataset.focus='privacy-'+key;toggle.setAttribute('role','switch');toggle.setAttribute('aria-labelledby',heading.id);toggle.setAttribute('aria-checked',String(state.draft[key]==='friends'));if(state.draft[key]==='friends'){toggle.style.background='linear-gradient(#dcf5ff,#91ccec)';toggle.style.borderColor='#354860';}toggle.textContent=state.draft[key]==='friends'?'Für Freunde sichtbar':'Nur ich';toggle.disabled=!state.available||!state.loaded||state.loading||state.saving||busy;
  toggle.onclick=()=>controller.set(key,state.draft[key]==='friends'?'private':'friends');
  const saved=doc.createElement('small');saved.style.display='block';saved.textContent=state.loaded?'Gespeicherter Serverstand: '+(state.saved[key]==='friends'?'Für Freunde sichtbar':'Nur ich'):'Serverstand noch nicht geladen.';
  group.append(heading,hint,toggle,saved);card.append(group);
 }
 const status=text('p',!state.uid?'Bitte zuerst anmelden.':!state.available?'Der Freundesdienst ist noch deaktiviert. Hier werden keine Änderungen gespeichert.':state.saving?'Einstellungen werden gespeichert und geprüft …':state.loading?'Einstellungen werden geladen …':state.error||state.message||(state.dirty?'Ungespeicherte Änderungen.':'Fehlende Einstellungen sind privat. Freigaben gelten nur für bestätigte Freunde.'));
 status.tabIndex=-1;status.dataset.focus='privacy-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 function button(label,key,action,disabled){const b=doc.createElement('button');b.type='button';b.textContent=label;b.dataset.focus=key;b.disabled=disabled;b.onclick=action;card.append(b);return b;}
 const disabled=!state.available||state.loading||state.saving||busy;
 const apply=button(state.saving?'Wird gespeichert …':'Speichern','privacy-save',()=>controller.submit(),disabled||!state.loaded||!state.dirty);apply.className='if-social-primary';
 button('Entwurf verwerfen','privacy-reset',()=>controller.reset(),disabled||!state.loaded||!state.dirty);
 button(state.dirty?'Neu laden · Entwurf verwerfen':'Serverstand neu laden','privacy-reload',()=>controller.load({discard:true}),disabled);
 return card;
}
function ownCodeCard({doc,win,store}){
 const state=store.snapshot(),card=doc.createElement('section');card.className='if-social-code-card';card.style.gridColumn='1 / -1';card.setAttribute('aria-labelledby','if-social-own-code-title');
 const title=doc.createElement('h3');title.id='if-social-own-code-title';title.textContent='Dein Freundescode';
 const description=doc.createElement('p');description.textContent='Teile diesen Code mit deinen Gefährten, damit sie dir eine Freundschaftsanfrage senden können.';
 const note=doc.createElement('p');note.id='if-social-own-code-note';note.className='if-social-field-note';note.setAttribute('role','status');
 card.append(title,description);
 if(state.friendCode){
  const label=doc.createElement('label');label.textContent='Dein persönlicher Code';label.htmlFor='if-social-own-code';
  const field=doc.createElement('input');field.id='if-social-own-code';field.dataset.focus='own-code';field.type='text';field.readOnly=true;field.value=state.friendCode;field.spellcheck=false;field.setAttribute('aria-describedby',note.id);field.style.fontFamily='ui-monospace,monospace';label.append(field);card.append(label);
  const copy=doc.createElement('button');copy.type='button';copy.dataset.focus='copy-own-code';copy.className='if-social-primary';copy.textContent='Code kopieren';
  copy.onclick=async()=>{
   const current=store.snapshot();if(current.uid!==state.uid||current.friendCode!==state.friendCode)return;
   function stillCurrent(){const value=store.snapshot();return value.uid===state.uid&&value.friendCode===state.friendCode&&card.isConnected;}
   try{
    if(typeof win.navigator?.clipboard?.writeText!=='function')throw Error('clipboard-unavailable');
    await win.navigator.clipboard.writeText(state.friendCode);
    if(stillCurrent())note.textContent='Freundescode kopiert.';
   }catch{
    if(!stillCurrent())return;
    field.focus({preventScroll:true});field.select();field.setSelectionRange(0,field.value.length);
    note.textContent='Automatisches Kopieren nicht möglich. Der Code ist markiert; bitte manuell kopieren.';
   }
  };
  card.append(copy);note.textContent='Der Code bleibt für deinen Account gleich.';
 }else{
  const available=Boolean(state.uid&&store.has('getCode'));
  note.textContent=!state.uid?'Bitte zuerst anmelden.':!available?'Dein Code ist verfügbar, sobald der Freundesdienst freigeschaltet ist.':state.codeLoading?'Dein Freundescode wird geladen …':state.codeError||'Deinen persönlichen Freundescode laden.';
  if(available){const load=doc.createElement('button');load.type='button';load.dataset.focus='load-own-code';load.className='if-social-primary';load.textContent=state.codeLoading?'Code wird geladen …':state.codeError?'Erneut versuchen':'Code laden';load.disabled=Boolean(state.codeLoading);load.onclick=()=>store.loadCode();card.append(load);}
 }
 card.append(note);return card;
}
function create({document:doc,window:win,store,inspector,skills=[],mount=doc.body,readPrivacy=async uid=>{if(typeof db==='undefined')throw Error('database-unavailable');return (await db.ref('social/privacy/'+uid).get()).val();}}){
 const dialog=doc.createElement('dialog');dialog.id='if-social-dialog';dialog.setAttribute('aria-labelledby','if-social-title');
 const shell=doc.createElement('div');shell.className='if-social-shell';dialog.append(shell);mount.append(dialog);
 let tab='friends',mobileDetail=false,previousFocus=null,current=store.snapshot(),confirmation=null;
 let focusTicket=0;const scrollPositions={};
 function node(tag,text,cls){const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
 function button(text,key,fn,disabled=false){const b=node('button',text);b.type='button';b.dataset.focus=key;b.disabled=disabled;b.onclick=fn;return b;}
 const act=(name,payload)=>store.action(name,payload);
 function focusKey(key){[...shell.querySelectorAll('[data-focus]')].find(n=>n.dataset.focus===key&&!n.disabled)?.focus({preventScroll:true});}
 function cancelConfirmation(){const key=confirmation?.name;confirmation=null;render();if(key)focusKey(key);}
 const privacyController=createPrivacyController({read:readPrivacy,save:values=>store.action('setPrivacy',values),canUse:()=>store.has('setPrivacy')});
 function scheduleRender(){const ticket=++focusTicket;if(dialog.open)win.requestAnimationFrame(()=>{if(dialog.open&&ticket===focusTicket)render();});}
 const stopPrivacy=privacyController.subscribe(scheduleRender);
 function render(){
  const active=doc.activeElement,focused=dialog.contains(active)?active?.dataset.focus:null;
  const inputValue=shell.querySelector('[data-focus="friend-code"]')?.value||'';
  shell.replaceChildren();
  const heading=node('header',undefined,'if-social-heading');const title=node('h2','Freunde & Gefährten');title.id='if-social-title';heading.append(title,button('Schließen','close',close));shell.append(heading);
  const tabs=node('nav',undefined,'if-social-tabs');tabs.setAttribute('aria-label','Freundesbereich');
  for(const [id,label] of [['friends','Freunde'],['requests','Anfragen ('+current.requests.length+')'],['add','Hinzufügen'],['settings','Einstellungen']]){
   const b=button(label,'tab-'+id,()=>{tab=id;confirmation=null;mobileDetail=false;render();if(id==='add')store.loadCode?.();if(id==='settings')privacyController.load();});b.setAttribute('aria-pressed',String(tab===id));tabs.append(b);
  }
  shell.append(tabs);
  const status=node('p',undefined,'if-social-status');status.setAttribute('role','status');status.textContent=current.loading?'Freundesdaten werden geladen …':current.error||(!current.uid?'Bitte zuerst anmelden.':!current.available?'Freundesdienst noch nicht aktiviert. Es werden keine Testkontakte angezeigt.':'Online-Status ist noch nicht angebunden.');shell.append(status);
  const content=node('div',undefined,'if-social-content');content.dataset.detail=String(mobileDetail);content.setAttribute('aria-busy',String(current.busy));const scrollKey=tab+(mobileDetail?'-detail':'-list');content.onscroll=()=>{scrollPositions[scrollKey]=content.scrollTop;};shell.append(content);
  if(tab==='friends'){
   const list=node('section',undefined,'if-social-list');list.setAttribute('aria-label','Deine Freunde');
   if(!current.friends.length)list.append(node('p',current.available?'Noch keine Freunde vorhanden.':'Die Freundesliste ist noch nicht verfügbar.'));
   for(const [index,friend] of current.friends.entries()){
    const row=node('div',undefined,'if-social-row');
    const label=current.selectedUid===friend.uid&&current.profile?.displayName?String(current.profile.displayName):friend.displayName||'Kontakt '+(index+1)+' · Name nicht freigegeben';
    const pick=button(label,'friend-'+friend.uid,()=>{confirmation=null;mobileDetail=true;store.selectFriend(friend.uid);});pick.setAttribute('aria-pressed',String(current.selectedUid===friend.uid));
    const hint=node('small','Online-Status nicht verfügbar');
    const invite=button('Einladen','invite-'+friend.uid,()=>act('invite',{targetUid:friend.uid}),current.busy||!store.has('invite'));invite.title='Erst nach Anbindung des Coop-Backends verfügbar';
    row.append(pick,hint,invite);list.append(row);
   }
   const detail=node('section',undefined,'if-social-detail');detail.setAttribute('aria-label','Spielerprofil');
   if(current.selectedUid){
    detail.append(button('Zurück zur Liste','back',()=>{confirmation=null;mobileDetail=false;render();}));
    if(current.profileLoading)detail.append(node('p','Profil wird geladen …'));
    else if(current.profile){
     detail.append(node('h3',String(current.profile.displayName||'Spieler')));
     for(const [id,label] of [['knight','Ritter'],['mage','Elementarmagier']])detail.append(button(label,'class-'+id,()=>{confirmation=null;store.selectCharacter(id);},current.busy));
     if(current.characterLoading)detail.append(node('p','Charakter wird geladen …'));
     else if(current.character)detail.append(inspector.render(doc,current.character,skills));
     else detail.append(node('p','Charakter auswählen. Nicht angelegte oder private Charaktere sind nicht einsehbar.'));
     for(const [action,label] of [['remove','Freund entfernen'],['block','Blockieren']])detail.append(button(label,action,()=>{
      confirmation={name:action,label,targetUid:current.selectedUid};render();focusKey('confirm-cancel');
     },current.busy||!store.has(action)));
    }else detail.append(node('p','Profil nicht verfügbar oder nicht freigegeben.'));
   }else detail.append(node('p','Wähle einen Freund aus der Liste.'));
   content.append(list,detail);
  }else if(tab==='requests'){
   const list=node('section');list.append(node('h3','Eingehende Anfragen'));
   if(!current.requests.length)list.append(node('p','Keine Anfragen vorhanden.'));
   for(const request of current.requests){const row=node('div',undefined,'if-social-row');row.append(node('span',request.displayName?'Anfrage von '+request.displayName:'Anfrage · Absenderdaten fehlen'),button('Annehmen','accept-'+request.uid,()=>act('accept',{targetUid:request.uid}),current.busy||!store.has('accept')||!request.displayName),button('Ablehnen','decline-'+request.uid,()=>act('decline',{targetUid:request.uid}),current.busy||!store.has('decline')));list.append(row);}
   content.append(list);
  }else if(tab==='settings'){
   content.append(privacyCard({doc,controller:privacyController,busy:current.busy}));
  }else{
   content.append(ownCodeCard({doc,win,store}));
   const form=node('form');form.className='if-social-code-card';form.noValidate=true;
   form.append(node('span','NEUE GEFÄHRTEN','if-social-eyebrow'),node('h3','Freund hinzufügen'),node('p','Gib den Freundescode deines Gefährten ein und sende eine Anfrage.'));
   const label=node('label','Freundescode');label.htmlFor='if-social-code-input';
   const input=node('input');input.id='if-social-code-input';input.dataset.focus='friend-code';input.maxLength=80;input.required=true;input.autocomplete='off';input.spellcheck=false;input.placeholder='Freundescode eingeben';input.value=inputValue;input.disabled=!store.has('requestByCode')||current.busy;input.setAttribute('aria-describedby','if-social-code-note');label.append(input);form.append(label);
   const note=node('p',store.has('requestByCode')?'Den Code erhältst du direkt von deinem Freund.':'Freundesanfragen werden mit der Backend-Anbindung freigeschaltet.','if-social-field-note');note.id='if-social-code-note';note.setAttribute('role','status');
   const submit=node('button',current.busy?'Wird gesendet …':'Anfrage senden');submit.type='submit';submit.dataset.focus='send-code';submit.className='if-social-primary';submit.disabled=input.disabled;form.append(note,submit);
   form.onsubmit=e=>{e.preventDefault();if(input.disabled||!store.has('requestByCode'))return;const code=input.value.trim();if(!code){note.textContent='Bitte zuerst einen Freundescode eingeben.';input.setAttribute('aria-invalid','true');input.focus();return;}input.removeAttribute('aria-invalid');act('requestByCode',{friendCode:code});};content.append(form);
  }
  if(confirmation&&confirmation.targetUid===current.selectedUid&&current.profile){
   const card=node('section',undefined,'if-social-confirm');card.setAttribute('role','group');card.setAttribute('aria-labelledby','if-social-confirm-title');
   const title=node('h3',confirmation.label+'?');title.id='if-social-confirm-title';
   const message=node('p',confirmation.name==='block'?'Dieser Kontakt wird blockiert. Entblockieren stellt die Freundschaft nicht automatisch wieder her.':'Dieser Kontakt wird aus deiner Freundesliste entfernt.');
   card.append(title,message,button('Abbrechen','confirm-cancel',cancelConfirmation),button('Bestätigen','confirm-apply',()=>{const pending=confirmation;confirmation=null;act(pending.name,{targetUid:pending.targetUid});render();},current.busy||!store.has(confirmation.name)));content.append(card);
  }
  content.scrollTop=scrollPositions[scrollKey]||0;
  if(focused){const match=[...shell.querySelectorAll('[data-focus]')].find(n=>n.dataset.focus===focused);if(match&&!match.disabled)match.focus({preventScroll:true});else if(focused.startsWith('privacy-'))focusKey('privacy-status');else if(focused==='load-own-code')focusKey('copy-own-code');else shell.querySelector('button')?.focus({preventScroll:true});}
 }
 function close(){confirmation=null;if(dialog.open)dialog.close();}
 function open(trigger){if(dialog.open)return;if(typeof dialog.showModal!=='function')throw Error('Dieser Browser unterstützt den Freundesdialog nicht.');previousFocus=trigger||doc.activeElement;render();dialog.showModal();shell.querySelector('button')?.focus({preventScroll:true});if(tab==='add')store.loadCode?.();if(tab==='settings')privacyController.load();}
 dialog.addEventListener('close',()=>{confirmation=null;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});});
 function keyboard(event){if(!dialog.open)return;event.stopImmediatePropagation();if(event.key==='Escape'){event.preventDefault();if(confirmation)cancelConfirmation();else close();}}
 win.addEventListener('keydown',keyboard,true);
 const unsubscribe=store.subscribe(value=>{
  current=value;privacyController.setUser(value.uid);if(confirmation&&(confirmation.targetUid!==value.selectedUid||!value.profile))confirmation=null;if(!value.selectedUid)mobileDetail=false;
  if(!value.uid&&dialog.open)close();
  scheduleRender();
 });
 return {open,close,destroy(){close();unsubscribe();stopPrivacy();privacyController.destroy();win.removeEventListener('keydown',keyboard,true);dialog.remove();}};
}
return {create,ownCodeCard,normalizePrivacy,createPrivacyController,privacyCard};
});
