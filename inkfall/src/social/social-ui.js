(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.InkfallSocialUI=api;})(globalThis,()=>{
'use strict';
function create({document:doc,window:win,store,inspector,skills=[],mount=doc.body}){
 const dialog=doc.createElement('dialog');dialog.id='if-social-dialog';dialog.setAttribute('aria-labelledby','if-social-title');
 const shell=doc.createElement('div');shell.className='if-social-shell';dialog.append(shell);mount.append(dialog);
 let tab='friends',mobileDetail=false,previousFocus=null,current=store.snapshot();
 let focusTicket=0;const scrollPositions={};
 function node(tag,text,cls){const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
 function button(text,key,fn,disabled=false){const b=node('button',text);b.type='button';b.dataset.focus=key;b.disabled=disabled;b.onclick=fn;return b;}
 const act=(name,payload)=>store.action(name,payload);
 function render(){
  const active=doc.activeElement,focused=dialog.contains(active)?active?.dataset.focus:null;
  const inputValue=shell.querySelector('[data-focus="friend-code"]')?.value||'';
  shell.replaceChildren();
  const heading=node('header',undefined,'if-social-heading');const title=node('h2','Freunde');title.id='if-social-title';heading.append(title,button('Schließen','close',close));shell.append(heading);
  const tabs=node('nav',undefined,'if-social-tabs');tabs.setAttribute('aria-label','Freundesbereich');
  for(const [id,label] of [['friends','Freunde'],['requests','Anfragen ('+current.requests.length+')'],['add','Hinzufügen']]){
   const b=button(label,'tab-'+id,()=>{tab=id;mobileDetail=false;render();});b.setAttribute('aria-pressed',String(tab===id));tabs.append(b);
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
    const pick=button(label,'friend-'+friend.uid,()=>{mobileDetail=true;store.selectFriend(friend.uid);});pick.setAttribute('aria-pressed',String(current.selectedUid===friend.uid));
    const hint=node('small','Online-Status nicht verfügbar');
    const invite=button('Einladen','invite-'+friend.uid,()=>act('invite',{targetUid:friend.uid}),current.busy||!store.has('invite'));invite.title='Erst nach Anbindung des Coop-Backends verfügbar';
    row.append(pick,hint,invite);list.append(row);
   }
   const detail=node('section',undefined,'if-social-detail');detail.setAttribute('aria-label','Spielerprofil');
   if(current.selectedUid){
    detail.append(button('Zurück zur Liste','back',()=>{mobileDetail=false;render();}));
    if(current.profileLoading)detail.append(node('p','Profil wird geladen …'));
    else if(current.profile){
     detail.append(node('h3',String(current.profile.displayName||'Spieler')));
     for(const [id,label] of [['knight','Ritter'],['mage','Elementarmagier']])detail.append(button(label,'class-'+id,()=>store.selectCharacter(id),current.busy));
     if(current.characterLoading)detail.append(node('p','Charakter wird geladen …'));
     else if(current.character)detail.append(inspector.render(doc,current.character,skills));
     else detail.append(node('p','Charakter auswählen. Nicht angelegte oder private Charaktere sind nicht einsehbar.'));
     for(const [action,label] of [['remove','Freund entfernen'],['block','Blockieren']])detail.append(button(label,action,()=>{
      const targetUid=current.selectedUid;
      if(win.confirm(label+'?'))act(action,{targetUid});
     },current.busy||!store.has(action)));
    }else detail.append(node('p','Profil nicht verfügbar oder nicht freigegeben.'));
   }else detail.append(node('p','Wähle einen Freund aus der Liste.'));
   content.append(list,detail);
  }else if(tab==='requests'){
   const list=node('section');list.append(node('h3','Eingehende Anfragen'));
   if(!current.requests.length)list.append(node('p','Keine Anfragen vorhanden.'));
   for(const request of current.requests){const row=node('div',undefined,'if-social-row');row.append(node('span',request.displayName?'Anfrage von '+request.displayName:'Anfrage · Absenderdaten fehlen'),button('Annehmen','accept-'+request.uid,()=>act('accept',{targetUid:request.uid}),current.busy||!store.has('accept')||!request.displayName),button('Ablehnen','decline-'+request.uid,()=>act('decline',{targetUid:request.uid}),current.busy||!store.has('decline')));list.append(row);}
   content.append(list);
  }else{
   const form=node('form');const label=node('label','Freundescode');const input=node('input');input.dataset.focus='friend-code';input.maxLength=80;input.required=true;input.autocomplete='off';input.value=inputValue;input.disabled=!store.has('requestByCode')||current.busy;label.append(input);form.append(label);
   const submit=node('button','Anfrage senden');submit.type='submit';submit.disabled=input.disabled;form.append(submit,node('p','Freundescode-Suche benötigt den authentifizierten Backend-Endpunkt.'));
   form.onsubmit=e=>{e.preventDefault();if(input.value.trim())act('requestByCode',{friendCode:input.value.trim()});};content.append(form);
  }
  content.scrollTop=scrollPositions[scrollKey]||0;
  if(focused){const match=[...shell.querySelectorAll('[data-focus]')].find(n=>n.dataset.focus===focused);if(match&&!match.disabled)match.focus({preventScroll:true});else shell.querySelector('button')?.focus({preventScroll:true});}
 }
 function close(){if(dialog.open)dialog.close();}
 function open(trigger){if(dialog.open)return;if(typeof dialog.showModal!=='function')throw Error('Dieser Browser unterstützt den Freundesdialog nicht.');previousFocus=trigger||doc.activeElement;render();dialog.showModal();shell.querySelector('button')?.focus({preventScroll:true});}
 dialog.addEventListener('close',()=>{if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});});
 function keyboard(event){if(!dialog.open)return;event.stopImmediatePropagation();if(event.key==='Escape'){event.preventDefault();close();}}
 win.addEventListener('keydown',keyboard,true);
 const unsubscribe=store.subscribe(value=>{
  current=value;if(!value.selectedUid)mobileDetail=false;
  if(!value.uid&&dialog.open)close();
  const ticket=++focusTicket;
  if(dialog.open)win.requestAnimationFrame(()=>{if(dialog.open&&ticket===focusTicket)render();});
 });
 return {open,close,destroy(){close();unsubscribe();win.removeEventListener('keydown',keyboard,true);dialog.remove();}};
}
return {create};
});
