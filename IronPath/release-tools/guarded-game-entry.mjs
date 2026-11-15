// Experimental *packaged* game entry. Only an explicitly guarded staged HTML
// references this module. It does not change the published game or Firebase.
// The HTML is already hidden/inert before any module or network request runs.
import siteConfig from '../release-config.mjs';
import {validatePublicSiteConfig,validateSiteOrigin} from './public-site-config.mjs';
import {createGuardedGameBootstrap} from './guarded-game-bootstrap.mjs';
import {installGuardedAccountSession} from '../account-services.mjs?v=20261031-releaseguard1';

const $=id=>document.getElementById(id);
const game=$('ironpath-guarded-game'),hold=$('ironpath-guarded-hold');
let runtime,lastReason='unavailable';

function language(){try{return localStorage.getItem('ironpath:language')==='de'?'de':'en';}catch{return 'en';}}
function setHold(reason){
  if(!game || !hold || !$('ironpath-hold-title') || !$('ironpath-hold-detail'))throw Error('Missing guarded page');
  lastReason=reason;game.inert=true;game.hidden=true;hold.hidden=false;
  const de=language(),checking=reason==='checking',updating=reason==='updating',maintenance=reason==='maintenance';
  $('ironpath-hold-title').textContent=de
    ? checking?'Einsatzstatus wird geprüft':updating?'Neue Version wird geladen':maintenance?'Einsatzpause':'Verbindung wird geprüft'
    : checking?'Checking operation status':updating?'Loading the new version':maintenance?'Operation paused':'Checking the connection';
  $('ironpath-hold-detail').textContent=de
    ? 'Anmeldung und Spiel bleiben bis zur Freigabe gesperrt.'
    : 'Sign-in and play remain blocked until clearance.';
}
function revealGame(){
  if(!game || !hold)throw Error('Missing guarded page');
  game.inert=false;game.hidden=false;hold.hidden=true;
}
function replaceWithEntry(){
  // Never use a URL supplied by the database or a runtime callback. The stable
  // entry rechecks the authoritative record and chooses its own local build.
  const reason=lastReason==='maintenance'?'maintenance':lastReason==='updating'?'updating':
    lastReason==='logout'?'logout':'unavailable';
  location.replace(reason==='logout'?'/IronPath/':`/IronPath/?from=${reason}`);
}

async function start(){
  try{
    if(!game?.hidden || !game.inert || !hold || hold.hidden ||
        document.documentElement.dataset.ironpathGuard!=='required')throw Error('Guarded page was not initially blocked');
    const config=validatePublicSiteConfig(siteConfig),build=document.documentElement.dataset.ironpathReleaseBuild;
    validateSiteOrigin(location.origin);
    if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(build || '') ||
        ![`/IronPath/releases/${build}/`,`/IronPath/releases/${build}/index.html`].includes(location.pathname)) {
      throw Error('Unexpected guarded game path');
    }
    // Dynamic imports let a failed CDN request show a blocked state instead of
    // leaving a frozen loading label. They are the same pinned SDK as account.js.
    const [app,auth,db]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js')
    ]);
    const sdk={initializeApp:app.initializeApp,initializeAuth:auth.initializeAuth,inMemoryPersistence:auth.inMemoryPersistence,
      getDatabase:db.getDatabase,beforeAuthStateChanged:auth.beforeAuthStateChanged,onAuthStateChanged:auth.onAuthStateChanged,
      signInWithEmailAndPassword:auth.signInWithEmailAndPassword,createUserWithEmailAndPassword:auth.createUserWithEmailAndPassword,
      signInWithCustomToken:auth.signInWithCustomToken,sendPasswordResetEmail:auth.sendPasswordResetEmail,
      signOut:auth.signOut,goOffline:db.goOffline};
    runtime=createGuardedGameBootstrap({config:config.firebase,sdk,build,sessionEndpoint:config.sessionEndpoint,
      installSession:installGuardedAccountSession,importGame:()=>import('../account.js'),
      onHold:setHold,showGame:revealGame,replaceDocument:replaceWithEntry});
    const refresh=()=>{if(runtime.getPhase()!=='terminated')void runtime.refresh().catch(()=>{});};
    window.addEventListener('online',refresh);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
    // A restored bfcache document must never resume an old authenticated SDK
    // instance. Freeze and tear it down before it can be used again.
    window.addEventListener('pageshow',event=>{if(event.persisted)void runtime.stop('unavailable');});
    runtime.start();
  }catch{
    if(runtime){void runtime.stop('unavailable');return;}
    try{setHold('unavailable');}catch{/* The initial HTML must remain blocked. */}
    replaceWithEntry();
  }
}
void start();
