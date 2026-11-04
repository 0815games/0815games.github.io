// One accessible, cancellable confirmation at a time. Never use browser alerts.
export function createConfirmation(document){
  const $=id=>document.getElementById(id),dialog=$('gameConfirm');let resolve=null;
  function finish(value){if(!resolve)return;const done=resolve;resolve=null;if(dialog.open)dialog.close();done(value);}
  $('gameConfirmAccept').onclick=()=>finish(true);$('gameConfirmCancel').onclick=()=>finish(false);
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
  // A close event can arrive after a new confirmation has already opened.
  dialog.addEventListener('close',()=>{if(!dialog.open)finish(false);});
  return {ask({title,text,accept='CONFIRM'}){if(resolve)return Promise.resolve(false);$('gameConfirmTitle').textContent=title;$('gameConfirmText').textContent=text;$('gameConfirmAccept').textContent=accept;return new Promise(done=>{resolve=done;try{dialog.showModal();}catch{resolve=null;done(false);}});},cancel:()=>finish(false)};
}
