// Native dialog backdrop clicks target the dialog itself; clicks on its padding
// also do, so check coordinates and require the gesture to start outside.
export function bindDialogBackdrop(dialog,onDismiss){
  let downOutside=false;
  const outside=event=>{const r=dialog.getBoundingClientRect();return event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom);};
  dialog.addEventListener('pointerdown',event=>{downOutside=dialog.open&&event.button===0&&outside(event);});
  dialog.addEventListener('pointercancel',()=>{downOutside=false;});
  dialog.addEventListener('click',event=>{const dismiss=downOutside&&dialog.open&&outside(event);downOutside=false;if(dismiss){event.preventDefault();onDismiss();}});
}
