// The page is public; only Firebase Rules authorize its read probe and writes.
// The SDK, Auth instance and database are supplied by the separate admin entry.
import {MAINTENANCE_PATH,MAINTENANCE_ADMIN_ACCESS_PATH,parseMaintenanceControl,createMaintenanceProbe} from './maintenance-check.mjs?v=20261031-update2';
import {sameMaintenanceControl,transitionMaintenance} from './admin-maintenance.mjs?v=20261031-update2';

export function createAdminPanel({document,window,auth,db,sdk,databaseUrl,fetcher=window?.fetch?.bind(window)}={}){
 const $=id=>document.getElementById(id);
 const required=['adminLogin','adminDashboard','adminLoginForm','adminEmail','adminPassword','adminLoginButton','adminLoginMessage','adminIdentity','adminLogout','adminStatusCard','adminStatusLabel','adminStatusDetail','adminEnable','adminDisable','adminRefresh','adminMessage','adminConfirm','adminConfirmTitle','adminConfirmDetail','adminConfirmCancel','adminConfirmAction'];
 const methods=['onAuthStateChanged','signInWithEmailAndPassword','signOut','ref','get','onValue','runTransaction','serverTimestamp'];
 if(!auth||!db||!required.every(id=>$(id))||!methods.every(name=>typeof sdk?.[name]==='function'))throw Error('Invalid administration panel');
 const probe=createMaintenanceProbe({databaseUrl,fetcher});
 const controlRef=sdk.ref(db,MAINTENANCE_PATH),accessRef=sdk.ref(db,MAINTENANCE_ADMIN_ACCESS_PATH);
 let session=null,generation=0,authorized=false,initialized=false,loginBusy=false,logoutBusy=false;
 let observation=null,watchReady=false,stopWatch=null,control=null,refreshBusy=false,operation=false,confirmTarget=null;
 let loginMessage='',panelMessage='',pendingTimer=null,refreshTimer=null;
 const isCurrent=(own,user)=>generation===own&&session===user&&auth.currentUser===user;
 const synchronized=()=>authorized&&control&&watchReady&&sameMaintenanceControl(control,observation);
 function render(){
  const signedIn=!!session;$('adminLogin').hidden=signedIn;$('adminDashboard').hidden=!signedIn;
  $('adminLoginButton').disabled=!initialized||loginBusy;
  $('adminLoginButton').textContent=loginBusy?'ANMELDUNG LÄUFT …':initialized?'ANMELDEN':'VERBINDUNG WIRD VORBEREITET …';
  $('adminLoginMessage').textContent=loginMessage;$('adminIdentity').textContent=session?.email||session?.uid||'';
  $('adminLogout').disabled=logoutBusy||operation;$('adminRefresh').disabled=!authorized||refreshBusy||operation;
  const ready=!!synchronized()&&!refreshBusy&&!operation;
  $('adminEnable').disabled=!ready||control?.mode!=='open';$('adminDisable').disabled=!ready||control?.mode!=='maintenance';
  $('adminConfirmAction').disabled=!ready||!confirmTarget||control?.mode===confirmTarget;
  const card=$('adminStatusCard');
  card.dataset.state=control?.mode||'unknown';
  $('adminStatusLabel').textContent=control?.mode==='open'?'SPIELBETRIEB OFFEN':control?.mode==='maintenance'?'WARTUNG AKTIV':'STATUS NICHT BESTÄTIGT';
  $('adminStatusDetail').textContent=control?.mode==='open'?'Der Betrieb ist freigegeben. Spieler können sich anmelden.':control?.mode==='maintenance'?'Spielzugriffe sind durch die veröffentlichten Wartungsregeln gesperrt.':'Ohne bestätigten Status bleiben beide Schalter gesperrt.';
  $('adminMessage').textContent=panelMessage;
 }
 function closeWatch(){try{stopWatch?.();}catch{}stopWatch=null;watchReady=false;observation=null;}
 function startWatch(own,user){
  closeWatch();
  try{
   const stop=sdk.onValue(controlRef,snapshot=>{
    if(!isCurrent(own,user))return;
    watchReady=true;observation=parseMaintenanceControl(snapshot.val());
    if(!operation&&control&&!sameMaintenanceControl(control,observation)){
     control=null;panelMessage='Der Status hat sich geändert. Bitte erneut prüfen.';
    }
    render();
   },()=>{
    if(!isCurrent(own,user))return;
    watchReady=false;observation=null;control=null;panelMessage='Datenbankverbindung nicht verfügbar. Schalter bleiben gesperrt.';render();
   });
   if(isCurrent(own,user))stopWatch=stop;else stop?.();
  }catch{watchReady=false;observation=null;control=null;panelMessage='Datenbankverbindung nicht verfügbar. Schalter bleiben gesperrt.';}
 }
 async function refresh({quiet=false}={}){
  if(!session||!authorized||refreshBusy||operation)return;
  const own=generation,user=session;refreshBusy=true;if(!quiet)panelMessage='Status wird überprüft …';render();
  const value=await probe();
  if(!isCurrent(own,user))return;
  refreshBusy=false;control=parseMaintenanceControl(value);
  panelMessage=control?'': 'Status konnte nicht frisch geprüft werden. Nichts wurde geschaltet.';
  render();
 }
 async function checkAccess(own,user){
  panelMessage='Berechtigung wird geprüft …';render();
  let timeout;
  try{
   // This read-only check may time out; it is not authorization for a write.
   // Rules independently verify the UID on every actual transaction.
   const deadline=new Promise((_,reject)=>{timeout=window.setTimeout(()=>reject(Error('timeout')),10000);});
   await Promise.race([sdk.get(accessRef),deadline]);
   if(!isCurrent(own,user))return;
   authorized=true;startWatch(own,user);await refresh();
  }catch{
   if(!isCurrent(own,user))return;
   authorized=false;control=null;panelMessage='Berechtigung oder Verbindung konnte nicht bestätigt werden. Prüfe Admin-Konto und veröffentlichte Rules.';render();
  }finally{if(timeout)window.clearTimeout(timeout);}
 }
 function observe(user){
  generation++;const own=generation;session=user||null;authorized=false;control=null;refreshBusy=false;confirmTarget=null;closeWatch();
  // Do not forget a still-pending transaction on an Auth change. Its promise
  // might commit later; subsequent sessions must not send another write yet.
  if($('adminConfirm').open)$('adminConfirm').close();
  $('adminPassword').value='';panelMessage='';initialized=true;
  if(session){loginMessage='';render();void checkAccess(own,session);}else render();
 }
 $('adminLoginForm').addEventListener('submit',async event=>{
  event.preventDefault();if(!initialized||loginBusy)return;
  const email=$('adminEmail').value.trim(),password=$('adminPassword').value;
  if(!email||!password)return;
  loginBusy=true;loginMessage='';render();
  try{await sdk.signInWithEmailAndPassword(auth,email,password);}
  catch{loginMessage='Anmeldung fehlgeschlagen. Prüfe Zugangsdaten und Internetverbindung.';}
  finally{$('adminPassword').value='';loginBusy=false;render();}
 });
 $('adminLogout').onclick=async()=>{
  if(!session||logoutBusy||operation)return;logoutBusy=true;render();
  try{await sdk.signOut(auth);}catch{panelMessage='Abmeldung fehlgeschlagen. Bitte erneut versuchen.';}
  finally{logoutBusy=false;render();}
 };
 $('adminRefresh').onclick=()=>void refresh();
 function confirm(target){
  if(!synchronized()||operation||refreshBusy||control.mode===target)return;
  confirmTarget=target;
  $('adminConfirmTitle').textContent=target==='maintenance'?'Wartung aktivieren?':'Wartung beenden?';
  $('adminConfirmDetail').textContent=target==='maintenance'
   ?'Spieler verlieren den Online-Zugriff; laufende Partien können unterbrochen werden. Nicht bestätigte Speicherungen können verloren gehen.'
   :'Der Spielbetrieb wird wieder geöffnet. Bestehende Sitzungen müssen sich nach dem neuen Server-Zeitpunkt erneut anmelden.';
  $('adminConfirmAction').textContent=target==='maintenance'?'WARTUNG AKTIVIEREN':'WARTUNG BEENDEN';
  $('adminConfirmAction').className=target==='maintenance'?'danger':'primary';
  render();$('adminConfirm').showModal();$('adminConfirmCancel').focus();
 }
 $('adminEnable').onclick=()=>confirm('maintenance');$('adminDisable').onclick=()=>confirm('open');
 $('adminConfirmCancel').onclick=()=>{$('adminConfirm').close();confirmTarget=null;render();};
 $('adminConfirm').addEventListener('cancel',()=>{confirmTarget=null;render();});
 $('adminConfirmAction').onclick=async()=>{
  if(!confirmTarget||!synchronized()||operation||refreshBusy||control.mode===confirmTarget)return;
  const target=confirmTarget,expected=control,user=session,own=generation;
  $('adminConfirm').close();confirmTarget=null;operation=true;panelMessage='Änderung wird bestätigt …';render();
  pendingTimer=window.setTimeout(()=>{
   if(operation&&session){panelMessage='Bestätigung steht noch aus. Nicht erneut schalten oder die Seite schließen; das Ergebnis ist noch offen.';render();}
  },12000);
  try{
   const result=await transitionMaintenance({expected,target,probe,readCurrent:async()=>observation,
    transact:reducer=>sdk.runTransaction(controlRef,reducer,{applyLocally:false}),
    serverTimestamp:sdk.serverTimestamp,isCurrent:()=>isCurrent(own,user)});
   if(!isCurrent(own,user))return;
   if(result.kind==='confirmed'){
    control=result.control;panelMessage=target==='maintenance'?'Wartung aktiviert und öffentlich bestätigt.':'Wartung beendet und öffentlich bestätigt.';
   }else{
    control=null;
    panelMessage=result.kind==='changed'?'Der Zustand wurde inzwischen geändert. Bitte zuerst erneut prüfen.':
     result.kind==='unavailable'?'Status nicht erreichbar. Es wurde keine Änderung gestartet.':
     result.kind==='cancelled'?'Die Sitzung hat sich geändert. Keine neue Änderung gestartet.':
     'Änderung konnte nicht vollständig bestätigt werden. Bitte den aktuellen Zustand prüfen, bevor du erneut schaltest.';
   }
  }catch(error){
   if(!isCurrent(own,user))return;
   control=null;const code=String(error?.code||error?.message||'');
   panelMessage=/permission.denied/i.test(code)?'Zugriff verweigert. Prüfe die Admin-UID und die veröffentlichten Rules.':'Änderung fehlgeschlagen oder Ergebnis unklar. Bitte zuerst den aktuellen Zustand prüfen.';
  }finally{
   if(pendingTimer!==null)window.clearTimeout(pendingTimer);pendingTimer=null;
   operation=false;
   if(!isCurrent(own,user)&&session){control=null;panelMessage='Ein vorheriger Schaltvorgang ist beendet. Bitte den Status erneut prüfen.';}
   render();
  }
 };
 const offAuth=sdk.onAuthStateChanged(auth,observe,()=>{initialized=true;loginMessage='Anmeldestatus nicht verfügbar. Bitte Seite neu laden.';render();});
 refreshTimer=window.setInterval(()=>void refresh({quiet:true}),20000);render();
 return Object.freeze({stop(){generation++;closeWatch();offAuth?.();if(refreshTimer!==null)window.clearInterval(refreshTimer);if(pendingTimer!==null)window.clearTimeout(pendingTimer);}});
}
