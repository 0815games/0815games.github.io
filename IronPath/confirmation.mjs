import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
// One accessible, cancellable confirmation at a time. Never use browser alerts.
export function createConfirmation(document,translate=(text)=>text){
  const $=id=>document.getElementById(id),dialog=$('gameConfirm');let resolve=null,content=null;
  function refresh(){if(!content)return;$('gameConfirmTitle').textContent=typeof content.title==='function'?content.title():translate(content.title);$('gameConfirmText').textContent=typeof content.text==='function'?content.text():translate(content.text);$('gameConfirmAccept').textContent=typeof content.accept==='function'?content.accept():translate(content.accept);}
  function finish(value){if(!resolve)return;const done=resolve;resolve=null;content=null;if(dialog.open)dialog.close();done(value);}
  $('gameConfirmAccept').onclick=()=>finish(true);$('gameConfirmCancel').onclick=()=>finish(false);
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
  bindDialogBackdrop(dialog,()=>finish(false));
  // A close event can arrive after a new confirmation has already opened.
  dialog.addEventListener('close',()=>{if(!dialog.open)finish(false);});
  return {ask({title,text,accept='CONFIRM'}){if(resolve)return Promise.resolve(false);content={title,text,accept};refresh();return new Promise(done=>{resolve=done;try{dialog.showModal();}catch{resolve=null;content=null;done(false);}});},cancel:()=>finish(false),refresh};
}
