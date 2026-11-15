import {renderMaintenanceView} from './maintenance-view.mjs';

// Controls only this isolated design preview. No network or auth operations.
let lang='de';
const state=document.getElementById('previewState'), language=document.getElementById('previewLanguage');
function render(){
  renderMaintenanceView(document,{state:state.value,lang});
  const de=lang==='de';
  document.title=de?'Iron Path · Wartungsanzeige – Vorschau':'Iron Path · Maintenance screen – preview';
  document.getElementById('previewLabel').textContent=de?'LOKALE VORSCHAU · NICHT LIVE':'LOCAL PREVIEW · NOT LIVE';
  document.getElementById('previewStateLabel').textContent=de?'Ansicht':'View';
  document.getElementById('footerText').textContent=de?'VORSCHAU · KEINE LIVE-PRÜFUNG':'PREVIEW · NO LIVE CHECK';
  const options=de?['Wartung','Kein Signal','Version laden']:['Maintenance','No signal','Loading version'];
  [...state.options].forEach((option,index)=>option.textContent=options[index]);
  language.textContent=de?'EN':'DE';language.setAttribute('aria-label',de?'Switch to English':'Auf Deutsch wechseln');
}
state.addEventListener('change',render);
language.addEventListener('click',()=>{lang=lang==='de'?'en':'de';render();});
render();
