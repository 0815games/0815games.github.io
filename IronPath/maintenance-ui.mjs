// Free, client-side presentation of the public Firebase maintenance signal.
// It cannot close another offline tab or enforce Rules; see maintenance-check.
import {createMaintenanceProbe} from './maintenance-check.mjs?v=20261031-update1';

const words={
 en:{maintenanceTitle:'Maintenance in progress',maintenanceDetail:'Sign-in and game data are paused while Iron Path is being updated.',
  unavailableTitle:'Checking the operation',unavailableDetail:'The maintenance status could not be checked. Check your connection and try again.',
  sessionTitle:'Session ended',sessionDetail:'The maintenance status changed. Reload the game and sign in again.',
  stopped:'This session has ended. Saves not confirmed before maintenance may be lost.',
  readyTitle:'Operation available',readyDetail:'Reload the game to continue. You may need to sign in again.',
  loadErrorTitle:'Game connection unavailable',loadErrorDetail:'The game files could not be loaded. Check your connection and reload the game.',
  retry:'RETRY CHECK',reload:'RELOAD GAME',checking:'CHECKING…'},
 de:{maintenanceTitle:'Wartung läuft',maintenanceDetail:'Anmeldung und Spieldaten sind pausiert, während Iron Path aktualisiert wird.',
  unavailableTitle:'Einsatzstatus wird geprüft',unavailableDetail:'Der Wartungsstatus konnte nicht geprüft werden. Prüfe deine Verbindung und versuche es erneut.',
  sessionTitle:'Sitzung beendet',sessionDetail:'Der Wartungsstatus hat sich geändert. Lade das Spiel neu und melde dich erneut an.',
  stopped:'Diese Sitzung wurde beendet. Vor der Wartung nicht bestätigte Speicherungen können verloren sein.',
  readyTitle:'Einsatz verfügbar',readyDetail:'Lade das Spiel neu, um fortzufahren. Du musst dich möglicherweise erneut anmelden.',
  loadErrorTitle:'Spielverbindung nicht verfügbar',loadErrorDetail:'Die Spieldateien konnten nicht geladen werden. Prüfe deine Verbindung und lade das Spiel neu.',
  retry:'ERNEUT PRÜFEN',reload:'SPIEL NEU LADEN',checking:'WIRD GEPRÜFT…'}
};

export function createMaintenanceUI({document,window,databaseUrl,fetcher=window?.fetch?.bind(window),intervalMs=15000}={}){
 const $=id=>document.getElementById(id),dialog=$('maintenanceGate'),title=$('maintenanceTitle'),detail=$('maintenanceDetail'),extra=$('maintenanceExtra'),retry=$('maintenanceRetry'),language=$('maintenanceLanguage');
 if(![dialog,title,detail,extra,retry,language].every(Boolean)||!Number.isInteger(intervalMs)||intervalMs<1000)throw Error('Missing maintenance UI');
 const probe=createMaintenanceProbe({databaseUrl,fetcher});
 let checking=false,timer=null,pending=null,phase='boot',status=null,signout=Promise.resolve(),reloadStarted=false,languageOverride=null;
 const lang=()=>{if(languageOverride)return languageOverride;try{return window.localStorage?.getItem('ironpath:language')==='de'?'de':'en';}catch{return document.documentElement.lang==='de'?'de':'en';}};
 const t=key=>words[lang()][key];
 function show(){dialog.hidden=false;try{if(!dialog.open)dialog.showModal();}catch{dialog.setAttribute('open','');}}
 function hide(){try{if(dialog.open)dialog.close();}catch{}dialog.hidden=true;}
 function render(){
  const key=status==='maintenance'?'maintenance':status==='session'?'session':status==='ready'?'ready':status==='load-error'?'loadError':'unavailable';
  dialog.lang=lang();language.textContent=lang()==='de'?'EN':'DE';language.setAttribute('aria-label',lang()==='de'?'Switch to English':'Auf Deutsch wechseln');
  title.textContent=t(`${key}Title`);detail.textContent=t(`${key}Detail`);extra.hidden=phase!=='halted';extra.textContent=phase==='halted'?t('stopped'):'';
  retry.disabled=checking||reloadStarted;retry.textContent=t(checking?'checking':status==='ready'||phase==='load-error'?'reload':'retry');
 }
 function cancelTimer(){if(timer!==null){window.clearTimeout(timer);timer=null;}}
 function schedule(){cancelTimer();if((pending||phase==='halted')&&status!=='ready')timer=window.setTimeout(()=>{timer=null;void check();},intervalMs);}
 async function check(){
  if(checking||reloadStarted)return;checking=true;if(status!==null)render();
  const control=await probe();checking=false;
  if(phase==='halted'){
   status=control?.mode==='open'?'ready':control?.mode==='maintenance'?'maintenance':'unavailable';show();render();schedule();return;
  }
  if(!pending)return;
  if(control?.mode==='open'){
   const current=pending;pending=null;status=null;cancelTimer();hide();current.resolve({control,delayed:current.delayed});return;
  }
  pending.delayed=true;status=control?.mode==='maintenance'?'maintenance':'unavailable';show();render();schedule();
 }
 function reload(){
  if(reloadStarted)return;reloadStarted=true;render();
  // An Auth sign-out normally settles locally. Even if it stalls, do not reuse
  // this RTDB instance; the next document rechecks status and token cutoff.
  void (async()=>{
   let id;await Promise.race([signout,new Promise(resolve=>{id=window.setTimeout(resolve,2000);})]);if(id)window.clearTimeout(id);
   const target=new URL(window.location.href);target.searchParams.set('_ip_nonce',`${Date.now()}-maintenance`);
   window.location.replace(target.href);
  })().catch(()=>{reloadStarted=false;status='unavailable';render();});
 }
 retry.onclick=()=>{if(phase==='load-error'||phase==='halted'&&status==='ready')reload();else void check();};
 // This control changes only the maintenance view; it does not silently alter
 // the player's saved game-language preference.
 language.onclick=()=>{languageOverride=lang()==='de'?'en':'de';render();};
 dialog.addEventListener('cancel',event=>event.preventDefault());
 return Object.freeze({
  waitForOpen(){
   if(phase!=='boot'||pending)throw Error('Maintenance gate already waiting');
   return new Promise(resolve=>{pending={resolve,delayed:false};void check();});
  },
  halt(reason,signoutPromise=Promise.resolve()){
   if(phase==='halted')return;phase='halted';pending=null;cancelTimer();signout=Promise.resolve(signoutPromise).catch(()=>{});
   status=['maintenance','session'].includes(reason)?reason:'unavailable';show();render();schedule();
  },
  loadFailure(){
   if(phase==='halted')return;phase='load-error';pending=null;cancelTimer();status='load-error';show();render();
  },
  refresh(){if(status!==null)render();}
 });
}
