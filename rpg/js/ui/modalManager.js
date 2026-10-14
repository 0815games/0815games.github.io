import { state } from '../core/state.js';
export class ModalManager {
 constructor(){
  this.modalEl=document.getElementById('fantasy-modal');
  if(!this.modalEl){this.modalEl=document.createElement('dialog');this.modalEl.id='fantasy-modal';document.body.append(this.modalEl);}
  this.modalEl.innerHTML='<div id="fantasy-modal-icon" aria-hidden="true"></div><h2 id="fantasy-modal-title"></h2><p id="fantasy-modal-msg"></p><p id="fantasy-modal-error" role="alert"></p><div id="fantasy-modal-actions"></div>';
  this.modalEl.setAttribute('role','dialog');this.modalEl.setAttribute('aria-modal','true');this.modalEl.setAttribute('aria-labelledby','fantasy-modal-title');this.modalEl.setAttribute('aria-describedby','fantasy-modal-msg');
  this.titleEl=document.getElementById('fantasy-modal-title');this.msgEl=document.getElementById('fantasy-modal-msg');this.iconEl=document.getElementById('fantasy-modal-icon');this.actionsEl=document.getElementById('fantasy-modal-actions');this.errorEl=document.getElementById('fantasy-modal-error');this.busy=false;this.opened=false;
  const style=document.createElement('style');style.textContent='#fantasy-modal{width:min(480px,calc(100vw - 24px));max-height:calc(100dvh - 32px);overflow-x:hidden;overflow-y:auto;border:2px solid #c99c42;border-radius:16px;padding:22px;background:#111420;color:#e8e4d9;box-shadow:0 0 35px #000;text-align:center}#fantasy-modal::backdrop{background:#000c}#fantasy-modal-msg{white-space:pre-line;line-height:1.6;overflow-wrap:anywhere}#fantasy-modal-icon{font-size:32px}#fantasy-modal-error{color:#ff9a9a}#fantasy-modal-actions{display:flex;flex-wrap:wrap;gap:10px}#fantasy-modal button{flex:1;min-height:48px;border:1px solid #c99c42;border-radius:10px;background:#24293c;color:#fff;padding:10px}#fantasy-modal .btn-danger{background:#641b2b;border-color:#d75b68}#fantasy-modal button:disabled{opacity:.5}';document.head.append(style);
  this.modalEl.addEventListener('cancel',e=>{e.preventDefault();if(!this.busy)this.close();});
  window.addEventListener('keydown',e=>{if(!this.opened)return;e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();if(!this.busy)this.close();}if(e.repeat&&(e.key==='Enter'||e.key===' '))e.preventDefault();if(e.key==='Tab'){const list=Array.from(this.actionsEl.querySelectorAll('button')).filter(b=>!b.disabled);if(list.length){e.preventDefault();const i=list.indexOf(document.activeElement);list[(i+(e.shiftKey?-1:1)+list.length)%list.length].focus();}}},true);
 }
 open(title,message,icon){this.previousFocus=document.activeElement;this.previousLock=Boolean(state.isInputLocked);state.isInputLocked=true;this.titleEl.textContent=title;this.msgEl.textContent=message;this.iconEl.textContent=icon;this.errorEl.textContent='';this.actionsEl.replaceChildren();this.modalEl.classList.remove('hidden');this.opened=true;if(this.modalEl.showModal&&!this.modalEl.open)this.modalEl.showModal();}
 button(text,handler,danger=false){const b=document.createElement('button');b.type='button';b.textContent=text;if(danger)b.className='btn-danger';b.onclick=handler;this.actionsEl.append(b);return b;}
 showNotice(title,message,icon='📜'){if(this.busy)return;this.open(title,message,icon);this.button('Verstanden',()=>this.close()).focus();}
 showConfirm(title,message,onConfirm,icon='⚔️'){
  if(this.opened||this.busy)return;this.open(title,message,icon);
  const cancel=this.button('Abbrechen',()=>this.close());
  const yes=this.button('Endgültig löschen',async()=>{
   if(this.busy)return;this.busy=true;this.errorEl.textContent='';cancel.disabled=true;yes.disabled=true;yes.textContent='Wird gelöscht …';
   try{const result=await onConfirm();if(result===false)throw new Error('Löschen fehlgeschlagen. Bitte Verbindung prüfen.');this.busy=false;this.close();}
   catch(error){this.busy=false;cancel.disabled=false;yes.disabled=false;yes.textContent='Erneut versuchen';this.errorEl.textContent=error.message||'Löschen fehlgeschlagen.';cancel.focus();}
  },true);cancel.focus();
 }
 close(){if(this.busy)return;if(this.modalEl.close&&this.modalEl.open)this.modalEl.close();this.modalEl.classList.add('hidden');this.opened=false;state.isInputLocked=this.previousLock||false;if(this.previousFocus?.isConnected)this.previousFocus.focus();}
}
