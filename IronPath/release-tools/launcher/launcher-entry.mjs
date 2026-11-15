// This entry is packaged only by the isolated release staging tool. It does
// not initialize Firebase Auth or access player data.
import config from './release-config.mjs';
import {renderMaintenanceView} from './maintenance-view.mjs';
import {createReleaseLauncher} from './release-launcher.mjs';

const button=document.getElementById('launcherLanguage'),retry=document.getElementById('launcherRetry');
let lang='en',state='checking',launcher;
try{lang=localStorage.getItem('ironpath:language')==='de'?'de':'en';}catch{/* Use English without storage. */}
function render(next=state){
  state=next;renderMaintenanceView(document,{state,lang});
  const de=lang==='de';
  document.title=de?'Iron Path · Einsatzstatus':'Iron Path · Operation status';
  document.getElementById('footerText').textContent=de?'EINSATZSTATUS':'OPERATION STATUS';
  button.textContent=de?'EN':'DE';button.setAttribute('aria-label',de?'Switch to English':'Auf Deutsch wechseln');
  retry.textContent=de?'Erneut prüfen':'Check again';retry.hidden=state==='updating';
}
try{
  render();
  button.addEventListener('click',()=>{
    lang=lang==='de'?'en':'de';
    try{localStorage.setItem('ironpath:language',lang);}catch{/* Keep the choice for this page. */}
    render();
  });
  launcher=createReleaseLauncher({config,origin:location.origin,onView:render,navigate:path=>location.replace(path),
    manualRetry:new URLSearchParams(location.search).get('from')==='unavailable'});
  retry.addEventListener('click',()=>{void launcher.retry();});
  const refresh=()=>{void launcher.refresh();};
  window.addEventListener('online',refresh);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
  window.addEventListener('pagehide',()=>launcher.stop());
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
  launcher.start();
}catch{
  // A bad local configuration or missing module must never lead to a game.
  try{render('unavailable');retry.hidden=true;}catch{/* Keep the static blocked page. */}
}
