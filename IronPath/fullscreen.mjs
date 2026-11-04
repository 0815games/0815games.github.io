// Fullscreen the document rather than the battlefield so dialogs, the HUD,
// navigation and the normal scrolling layout remain available.
export function setupFullscreen({document,button,status,translate=text=>text,onLanguageChange=()=>()=>{}}){
 const root=document.documentElement;
 const supported=document.fullscreenEnabled!==false&&typeof root.requestFullscreen==='function'&&typeof document.exitFullscreen==='function';
 let busy=false,failed=false;
 function render(){
  button.hidden=!supported;
  const active=!!document.fullscreenElement;
  button.textContent=translate(active?'EXIT FULLSCREEN':'FULLSCREEN');
  button.setAttribute('aria-pressed',String(active));
  button.disabled=busy;
  status.textContent=failed?translate('Fullscreen unavailable. Check your browser permissions or exit fullscreen and try again.'):'';
  status.hidden=!failed;
 }
 async function toggle(){
  if(!supported||busy)return;
  busy=true;failed=false;render();
  try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen();}
  catch{failed=true;}
  finally{busy=false;render();}
 }
 const changed=()=>{failed=false;render();};
 button.addEventListener('click',toggle);
 document.addEventListener('fullscreenchange',changed);
 const unsubscribe=onLanguageChange(render);
 render();
 return {destroy(){button.removeEventListener('click',toggle);document.removeEventListener('fullscreenchange',changed);unsubscribe();}};
}
