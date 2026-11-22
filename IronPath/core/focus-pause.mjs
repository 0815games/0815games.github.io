// Tracks local focus only. The multiplayer adapter decides whether this browser
// owns the shared simulation; guests cannot pause the host.
export function createFocusPause({window,document,onBlur=()=>{},onChange=()=>{}}){
  let focused=document.hasFocus(),visible=!document.hidden;
  const notify=()=>onChange(!focused||!visible);
  const loseFocus=()=>{focused=false;onBlur();notify();};
  const gainFocus=()=>{focused=true;notify();};
  const visibility=()=>{visible=!document.hidden;if(!visible)onBlur();notify();};
  window.addEventListener('blur',loseFocus);
  window.addEventListener('focus',gainFocus);
  document.addEventListener('visibilitychange',visibility);
  return {isSoloPaused:()=>!focused||!visible,dispose(){window.removeEventListener('blur',loseFocus);window.removeEventListener('focus',gainFocus);document.removeEventListener('visibilitychange',visibility);}};
}
