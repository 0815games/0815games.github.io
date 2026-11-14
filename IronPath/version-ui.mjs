// Ordinary GitHub Pages update UI. No Vercel or Firebase credentials are used.
// A matching page stamp is not proof that every cached module or asset matches.
import {BUILD_ID_PATTERN,createVersionProbe,createVersionCoordinator} from './version-check.mjs?v=20261031-update2';

const messages={
  en:{checking:'Checking the game version…',unavailable:'The current version could not be checked. Check your connection and try again before starting a new game.',
    waiting:'The new version is not available on this device yet. Try again in a moment.',reloading:'Loading the new version…',
    game:'A new version is available. Finish your current operation before updating.',
    party:'A new version is available. Finish and leave or close your party before updating.',
    saving:'A new version is available. Waiting for saves and rewards to be confirmed; keep this page open.',
    failed:'A save, reward or statistic could not be confirmed. The game will not update automatically; check your connection and any retry option in the report.',
    dialog:'A new version is available. Close the open report or dialog to update.',
    form:'A new version is available. Finish or leave the sign-in or soldier form before updating.',
    ready:'A new version is available. Preparing the update…',loaded:'New version {build} loaded.',retry:'RETRY CHECK',dismiss:'DISMISS'},
  de:{checking:'Spielversion wird geprüft…',unavailable:'Die aktuelle Version konnte nicht geprüft werden. Prüfe deine Verbindung und versuche es vor einem neuen Spiel erneut.',
    waiting:'Die neue Version ist auf diesem Gerät noch nicht verfügbar. Bitte gleich erneut versuchen.',reloading:'Neue Version wird geladen…',
    game:'Eine neue Version ist verfügbar. Beende zuerst deinen laufenden Einsatz.',
    party:'Eine neue Version ist verfügbar. Beende und verlasse oder schließe zuerst deine Party.',
    saving:'Eine neue Version ist verfügbar. Warte, bis Speicherungen und Belohnungen bestätigt sind; lass diese Seite geöffnet.',
    failed:'Eine Speicherung, Belohnung oder Statistik wurde nicht bestätigt. Das Spiel aktualisiert sich nicht automatisch; prüfe die Verbindung und mögliche Wiederholungen im Bericht.',
    dialog:'Eine neue Version ist verfügbar. Schließe den offenen Bericht oder Dialog für das Update.',
    form:'Eine neue Version ist verfügbar. Schließe die Anmeldung oder die Soldatenerstellung ab oder verlasse das Formular.',
    ready:'Eine neue Version ist verfügbar. Das Update wird vorbereitet…',loaded:'Neue Version {build} wurde geladen.',retry:'ERNEUT PRÜFEN',dismiss:'SCHLIESSEN'}
};
const LAST_BUILD='ironpath:last-confirmed-build';

export function createVersionUI({document,window,safety,beforeReload=()=>{},fetcher=window?.fetch?.bind(window)}={}){
  const $=id=>document.getElementById(id),build=document.querySelector('meta[name="ironpath-build"]')?.content;
  const initial=$('releaseCheck'),loading=$('loading'),title=$('releaseCheckTitle'),detail=$('releaseCheckDetail'),retry=$('releaseCheckRetry');
  const banner=$('versionNotice'),bannerText=$('versionNoticeText'),bannerRetry=$('versionNoticeRetry'),dismiss=$('versionNoticeDismiss'),results=$('resultsVersionStatus');
  if(typeof build!=='string'||!BUILD_ID_PATTERN.test(build)||![initial,loading,title,detail,retry,banner,bannerText,bannerRetry,dismiss,results].every(Boolean)||typeof safety!=='function'||typeof beforeReload!=='function')throw Error('Missing version gate UI');
  const endpoint=new URL('release-version.json',window.location.href);
  const probe=createVersionProbe({url:endpoint.href,origin:window.location.origin,build,fetcher});
  let booted=false,bootBusy=false,bootResolve=null,coordinator=null,status=null,loadedNotice=false,nonce=0;
  let monitorTimer=null,monitoring=false,backgroundCheck=false,backgroundRequested=false;
  // Check periodically in a visible tab, and after returning from the background
  // or BFCache. A second visibility event during an in-flight request requires
  // one fresh follow-up, rather than silently dropping the newer observation.
  // A timer cannot guarantee that a suspended/offline tab sees a release promptly.
  async function checkInBackground(){
    if(!monitoring||document.visibilityState==='hidden')return;
    if(backgroundCheck){backgroundRequested=true;return;}
    backgroundCheck=true;
    try{
      do{backgroundRequested=false;await coordinator?.check();}
      while(monitoring&&backgroundRequested&&document.visibilityState!=='hidden');
    }finally{backgroundCheck=false;}
  }
  function onVisibility(){if(document.visibilityState!=='hidden')void checkInBackground();}
  function onPageShow(event){if(event.persisted)void checkInBackground();}
  function startMonitoring(){
    monitoring=true;
    document.addEventListener('visibilitychange',onVisibility);
    window.addEventListener('pageshow',onPageShow);
    monitorTimer=window.setInterval(()=>void checkInBackground(),60000);
  }
  function stopMonitoring(){
    monitoring=false;backgroundRequested=false;if(monitorTimer!==null)window.clearInterval(monitorTimer);monitorTimer=null;
    document.removeEventListener('visibilitychange',onVisibility);
    window.removeEventListener('pageshow',onPageShow);
  }
  const lang=()=>{try{return window.localStorage?.getItem('ironpath:language')==='de'?'de':'en';}catch{return document.documentElement.lang==='de'?'de':'en';}};
  const text=(key,vars={})=>Object.entries(vars).reduce((s,[k,v])=>s.replace(`{${k}}`,String(v)),messages[lang()][key]||'');
  function render(){
    retry.textContent=bannerRetry.textContent=text('retry');dismiss.textContent=text('dismiss');
    const state=status;let content='';
    if(state?.kind==='unavailable')content=text('unavailable');
    else if(state?.kind==='update')content=text(['game','party','saving','failed','dialog','form','ready'].includes(state.reason)?state.reason:'saving');
    else if(state?.kind==='reloading')content=text('reloading');
    else if(loadedNotice)content=text('loaded',{build});
    banner.hidden=!content;bannerText.textContent=content;
    bannerRetry.hidden=state?.kind!=='unavailable';dismiss.hidden=!!state&&state.kind!=='current';
    results.hidden=!state||!['unavailable','update','reloading'].includes(state.kind);
    results.textContent=results.hidden?'':content;
    if(!booted&&!initial.hidden){
      title.textContent=text(state?.kind==='boot-reloading'?'reloading':state?.kind==='boot-checking'?'checking':'unavailable');
      detail.textContent=text(state?.kind==='boot-waiting'?'waiting':state?.kind==='boot-unavailable'?'unavailable':'checking');
      retry.hidden=state?.kind==='boot-checking';
    }
  }
  function setStatus(value){status=value;render();}
  function reload(target){
    if(!BUILD_ID_PATTERN.test(target)||target===build)throw Error('Invalid update target');
    // Only navigate to this document, never to a URL supplied by the manifest.
    // The target plus a nonce bypass the usual browser cache and the attempt
    // marker prevents an automatic reload loop if Pages/CDN is still stale.
    const url=new URL(window.location.href);
    url.searchParams.set('_ip_attempt',target);url.searchParams.set('_ip_from',build);
    url.searchParams.set('_ip_nonce',`${Date.now()}-${++nonce}`);
    // The account supplies a synchronous freeze/offline hook only after it has
    // confirmed there are no outstanding writes or parties in this document.
    beforeReload();window.location.replace(url.href);
  }
  function confirmLoaded(){
    const url=new URL(window.location.href),attempt=url.searchParams.get('_ip_attempt'),from=url.searchParams.get('_ip_from');
    let previous=null;try{previous=window.localStorage?.getItem(LAST_BUILD);window.localStorage?.setItem(LAST_BUILD,build);}catch{/* The URL marker also works when storage is unavailable. */}
    loadedNotice=(attempt===build&&BUILD_ID_PATTERN.test(from||'')&&from!==build)||
      (typeof previous==='string'&&BUILD_ID_PATTERN.test(previous)&&previous!==build);
    if(attempt!==null||from!==null||url.searchParams.has('_ip_nonce')){
      url.searchParams.delete('_ip_attempt');url.searchParams.delete('_ip_from');url.searchParams.delete('_ip_nonce');
      try{window.history.replaceState(window.history.state,'',url.href);}catch{/* A notice is harmless if an old URL remains. */}
    }
  }
  async function boot(force=false){
    if(bootBusy||booted)return;bootBusy=true;initial.hidden=false;loading.hidden=true;setStatus({kind:'boot-checking'});
    const result=await probe();bootBusy=false;
    if(result.kind==='current'){
      booted=true;initial.hidden=true;loading.hidden=false;confirmLoaded();
      coordinator=createVersionCoordinator({probe,safety,onStatus:setStatus,reload});startMonitoring();status=null;render();bootResolve?.();return;
    }
    if(result.kind==='outdated'){
      const attempted=new URL(window.location.href).searchParams.get('_ip_attempt');
      if(attempted===result.build&&!force){setStatus({kind:'boot-waiting'});return;}
      setStatus({kind:'boot-reloading'});
      try{reload(result.build);}catch{setStatus({kind:'boot-unavailable'});}
      return;
    }
    setStatus({kind:'boot-unavailable'});
  }
  retry.onclick=()=>void boot(true);
  bannerRetry.onclick=()=>void coordinator?.retry();
  dismiss.onclick=()=>{loadedNotice=false;if(status?.kind==='current')status=null;render();};
  return Object.freeze({
    start(){if(bootResolve)throw Error('Version gate already started');return new Promise(resolve=>{bootResolve=resolve;void boot();});},
    beforeGame(){return coordinator?coordinator.check():Promise.resolve(false);},
    afterGame(){coordinator?.afterGame();},
    refresh:render,
    stop(){stopMonitoring();coordinator?.stop();}
  });
}
