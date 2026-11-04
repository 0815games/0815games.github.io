// The shared simulation belongs to the host; a guest losing focus must never
// pause it. This controller pauses only the local solo simulation.
export function createFocusPause({window,document,onBlur=()=>{}}){
  let focused=document.hasFocus(),visible=!document.hidden;
  const loseFocus=()=>{focused=false;onBlur();};
  const gainFocus=()=>{focused=true;};
  const visibility=()=>{visible=!document.hidden;if(!visible)onBlur();};
  window.addEventListener('blur',loseFocus);
  window.addEventListener('focus',gainFocus);
  document.addEventListener('visibilitychange',visibility);
  return {isSoloPaused:()=>!focused||!visible,dispose(){window.removeEventListener('blur',loseFocus);window.removeEventListener('focus',gainFocus);document.removeEventListener('visibilitychange',visibility);}};
}
