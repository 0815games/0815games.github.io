import {cloud} from './firebase.js';
import {state} from '../core/state.js';
const id=Array.from(crypto.getRandomValues(new Uint32Array(4)),x=>x.toString(16).padStart(8,'0')).join('');
let connected=false,offset=0,ref=null,keeper=null,valid=false,busy=false,renewing=null,queue=Promise.resolve(),closing=false,overlay,epoch=0;
// Offene Anmeldung, die an einer fremden Sitzung scheitert. Sie bleibt bestehen,
// damit der Spieler sie ohne erneute Passworteingabe uebernehmen kann.
let pending=null;
const waiters=new Set(),now=()=>Date.now()+offset,byId=x=>document.getElementById(x);
function pause(message){valid=false;if(overlay){overlay.querySelector('p').textContent=message;overlay.hidden=!ref;}}
function owned(v){return v&&v.id===id&&v.expiresAt>now();}
function waitConnected(){if(connected)return Promise.resolve();return new Promise((resolve,reject)=>{const done=()=>{clearTimeout(timer);waiters.delete(done);resolve();};const timer=setTimeout(()=>{waiters.delete(done);reject(new Error('Serververbindung nicht bereit. Bitte Internet prüfen und erneut versuchen.'));},12000);waiters.add(done);});}
async function verify(){
 if(!ref||closing)return false;
 // Ist die Serververbindung noch nicht gemeldet, kurz darauf warten statt
 // sofort abzulehnen. Sonst schlägt die Prüfung direkt nach der Anmeldung
 // fehl und der Spieler landet über failedLogin wieder im Login – das
 // „doppelte Einloggen“.
 if(!connected){
  try{await waitConnected();}catch(e){return false;}
  if(!connected||closing)return false;
 }
 if(renewing)return renewing;const currentRef=ref,version=epoch;renewing=(async()=>{try{const snapshot=await currentRef.once('value');if(!owned(snapshot.val())){pause('Dieses Konto wurde auf einem anderen Gerät angemeldet. Hier wurde die Sitzung beendet. Bitte melde dich neu an, wenn du hier weiterspielen willst.');return false;}const r=await currentRef.transaction(v=>{if(!owned(v))return;return{id,expiresAt:now()+120000};},undefined,false);if(!r.committed){const latest=await currentRef.once('value');pause(owned(latest.val())?'Sitzung vorübergehend nicht bestätigt. Bitte erneut prüfen.':'Deine Sitzung ist abgelaufen oder wird von einem anderen Fenster gehalten.');return false;}valid=connected&&!closing&&ref===currentRef&&epoch===version;if(valid&&overlay)overlay.hidden=true;return valid;}catch(e){pause('Sitzung konnte nicht geprüft werden. Bitte Verbindung prüfen.');console.warn('Sitzungsprüfung:',e);return false;}})();try{return await renewing;}finally{renewing=null;}}
async function release(){closing=true;valid=false;epoch++;if(renewing)await renewing;const old=ref,listener=keeper;ref=null;keeper=null;if(overlay)overlay.hidden=true;try{if(old&&connected){await old.once('value');await old.transaction(v=>v?.id===id?null:undefined,undefined,false);}}finally{if(old&&listener)old.off('value',listener);closing=false;}}
async function failedLogin(error){await release().catch(e=>console.warn('Eigene Sperre freigeben:',e));await cloud.auth.signOut().catch(console.warn);state.user=null;for(const name of ['game','slot-screen','class-screen','death-screen','combat','levelup-overlay','floor-overlay'])byId(name)?.classList.add('hidden');const shop=byId('preparation-shop');if(shop)shop.hidden=true;byId('login-screen')?.classList.remove('hidden');const box=byId('auth-error');if(box){box.textContent=error.message||'Anmeldung konnte nicht abgeschlossen werden.';box.classList.remove('hidden');}}
const originalInit=cloud.init.bind(cloud);
cloud.init=function(){if(this.sessionInitialized)return this.ready;if(!originalInit())return false;const app=firebase.initializeApp(firebase.app().options,'tab-'+id);this.auth=app.auth();this.db=app.database();this.sessionInitialized=true;this.db.ref('.info/serverTimeOffset').on('value',s=>offset=Number(s.val())||0);this.db.ref('.info/connected').on('value',s=>{connected=s.val()===true;if(connected){for(const done of [...waiters])done();if(ref&&!busy&&!closing)verify();}else pause('Verbindung unterbrochen. Das Spiel pausiert.');});return true;};
for(const method of ['login','register']){const original=cloud[method].bind(cloud);cloud[method]=async function(...args){if(busy)throw new Error('Anmeldung wird bereits geprüft. Bitte warte.');busy=true;const button=byId('auth-submit');if(button)button.disabled=true;let candidate=null,listener=null,user=null;try{if(ref)await release();await this.auth.setPersistence(firebase.auth.Auth.Persistence.NONE);user=await original(...args);await waitConnected();const time=await this.db.ref('.info/serverTimeOffset').once('value');offset=Number(time.val())||0;candidate=this.db.ref('dark_rpg/sessions/'+user.uid);listener=()=>{};candidate.on('value',listener);await candidate.once('value');const r=await candidate.transaction(v=>{if(v&&v.id!==id&&v.expiresAt>now())return;return{id,expiresAt:now()+120000};},undefined,false);if(!r.committed){const busy=new Error('Dieses Konto ist gerade auf einem anderen Gerät oder in einem anderen Browserfenster angemeldet.');busy.code='SESSION_BUSY';throw busy;}ref=candidate;keeper=listener;epoch++;state.user=user;valid=connected;if(overlay)overlay.hidden=valid;return user;}catch(e){
  // Fremde Sitzung: Anmeldung offen halten, damit sie uebernommen werden kann.
  // Hier darf NICHT abgemeldet werden – sonst waere das Passwort umsonst.
  if(e&&e.code==='SESSION_BUSY'&&candidate){pending={ref:candidate,listener,user,method};throw e;}
  if(candidate&&listener&&candidate!==ref)candidate.off('value',listener);
  const denied=String(e.code||'').toUpperCase().replace(/[-_]/g,'').includes('PERMISSIONDENIED');
  const error=denied?new Error('Sitzungszugriff verweigert. Bitte Firebase-Regeln prüfen.'):e;
  await failedLogin(error);throw error;}finally{busy=false;if(button)button.disabled=false;}};}
cloud.loadAllSlots=async function(){try{if(!await verify())throw new Error('Keine bestätigte Spielsitzung. Bitte erneut anmelden.');const uid=this.auth.currentUser?.uid;if(!uid||state.user?.uid!==uid)throw new Error('Anmeldesitzung hat sich geändert.');const snapshot=await this.db.ref(`dark_rpg/saves/${uid}`).once('value');if(this.auth.currentUser?.uid!==uid)throw new Error('Anmeldesitzung hat sich geändert.');const data=snapshot.val()||{};return Array.from({length:4},(_,i)=>data[`slot_${i}`]||null);}catch(e){const denied=String(e.code||'').toUpperCase().replace(/[-_]/g,'').includes('PERMISSIONDENIED');const error=denied?new Error('Zugriff auf Charaktere verweigert. Bitte Firebase-Regeln prüfen.'):e;await failedLogin(error);throw error;}};
// --- Uebernahme einer fremden Sitzung -------------------------------------
// Der Spieler entscheidet bewusst: "Hier weiterspielen". Die fremde Sitzung
// wird beendet, dieses Fenster uebernimmt. Das andere Geraet merkt es bei
// seiner naechsten Pruefung (alle 25 s) und zeigt die Pause an.
cloud.sessionBusy=function(){
 if(!pending)return null;
 return {email:pending.user?.email||''};
};
cloud.takeOverSession=async function(){
 if(!pending)return false;
 if(busy)throw new Error('Es läuft bereits eine Anmeldung. Bitte warte kurz.');
 busy=true;
 try{
  if(!connected){
   try{await waitConnected();}
   catch(e){throw new Error('Keine Verbindung zum Ordensarchiv. Bitte Internet prüfen und erneut versuchen.');}
  }
  const {ref:candidate,listener}=pending;
  // Fremde Sitzung beenden und die eigene in einem Schritt setzen.
  const r=await candidate.transaction(()=>({id,expiresAt:now()+120000}),undefined,false);
  if(!r.committed)throw new Error('Die Übernahme wurde nicht bestätigt. Bitte erneut versuchen.');
  const user=pending.user;
  ref=candidate;keeper=listener;pending=null;epoch++;valid=connected;
  state.user=user;
  if(overlay)overlay.hidden=true;
  return true;
 }catch(e){
  console.warn('Sitzungsübernahme:',e);
  throw e;
 }finally{busy=false;}
};
const originalDelete=cloud.deleteSlot.bind(cloud);cloud.deleteSlot=async function(...args){if(!await verify())return false;return originalDelete(...args);};
cloud.saveSlot=function(slot,data){const user=this.auth?.currentUser,version=epoch;let snapshot;try{snapshot=JSON.parse(JSON.stringify({player:data.player,world:data.world,meta:data.meta,currentSlot:slot}));}catch(e){return Promise.resolve(false);}const run=async()=>{try{if(!user||epoch!==version||this.auth.currentUser?.uid!==user.uid||!await verify())return false;await this.db.ref(`dark_rpg/saves/${user.uid}/slot_${slot}`).set(snapshot);return true;}catch(e){console.warn('Speichern fehlgeschlagen:',e);return false;}};const result=queue.then(run,run);queue=result.catch(()=>{});return result;};
function setup(){const style=document.createElement('style');style.textContent='#cloud-status{display:none!important}#session-pause{position:fixed;inset:0;z-index:300;background:#08090ef5;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));overflow:auto;display:flex;align-items:center;justify-content:center}#session-pause[hidden]{display:none}#session-pause>div{width:min(100%,440px);border:1px solid #c99c42;border-radius:16px;padding:20px;background:#111420}.session-takeover{margin:12px 0;padding:12px;border:1px solid #c99c42;border-radius:12px;background:#111420}.session-takeover[hidden]{display:none}.session-takeover p{margin:0 0 10px;font-size:13px;line-height:1.45;color:#e8e4d9}.session-takeover button{width:100%;min-height:48px;margin-top:8px;color:#fff;background:#24293c;border:1px solid #c99c42;border-radius:10px;font:inherit;cursor:pointer}.session-takeover button.dark{background:#181b28;border-color:#3b4258;color:#aab1c0}.session-takeover button:disabled{opacity:.6;cursor:default}#session-pause button{min-height:48px;width:100%;margin-top:12px;color:#fff;background:#24293c;border:1px solid #c99c42;border-radius:10px}';document.head.append(style);document.querySelector('#login-screen > [data-music-toggle]')?.remove();overlay=document.createElement('section');overlay.id='session-pause';overlay.hidden=true;overlay.setAttribute('role','alertdialog');overlay.setAttribute('aria-modal','true');overlay.innerHTML='<div><h2>Sitzung pausiert</h2><p></p><button type="button">Erneut prüfen</button><button type="button">Abmelden</button></div>';document.body.append(overlay);

 // Uebernahme-Knopf: erscheint nur, wenn eine fremde Sitzung im Weg ist.
 const holder=document.createElement('div');
 holder.id='session-takeover';
 holder.hidden=true;
 holder.className='session-takeover';
 const info=document.createElement('p');
 info.textContent='Dieses Konto ist auf einem anderen Gerät angemeldet. Du kannst es hier übernehmen – das andere Gerät wird dabei abgemeldet.';
 const takeBtn=document.createElement('button');takeBtn.type='button';takeBtn.textContent='Hier weiterspielen';
 const dropBtn=document.createElement('button');dropBtn.type='button';dropBtn.textContent='Abbrechen';dropBtn.className='dark';
 holder.append(info,takeBtn,dropBtn);
 const authError=byId('auth-error');
 (authError?.parentElement||document.body).insertBefore(holder,(authError&&authError.nextSibling)||null);
 const hideTakeover=()=>{holder.hidden=true;};
 window.__sessionTakeover={show(){if(holder)holder.hidden=false;},hide:hideTakeover};
 takeBtn.onclick=async()=>{
  takeBtn.disabled=true;
  try{
   await cloud.takeOverSession();
   hideTakeover();
   if(authError)authError.classList.add('hidden');
   // Kein Neuladen: die Anmeldung lebt nur in diesem Fenster (Persistenz
   // NONE) und waere danach weg. main.js haengt sich hier ein und oeffnet
   // direkt die Charakterauswahl.
   if(typeof window.__sessionOverTaken==='function')window.__sessionOverTaken();
  }catch(e){
   if(authError){authError.textContent=e.message||'Übernahme fehlgeschlagen.';authError.classList.remove('hidden');}
  }finally{takeBtn.disabled=false;}
 };
 dropBtn.onclick=hideTakeover;
overlay.querySelectorAll('button')[0].onclick=()=>verify();async function logout(){await release().catch(console.warn);await cloud.auth.signOut().catch(console.warn);state.user=null;location.reload();}overlay.querySelectorAll('button')[1].onclick=logout;for(const name of ['logout','btn-slot-logout'])byId(name)?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();logout();},true);
for(const event of ['pointerdown','touchstart','click','keydown'])window.addEventListener(event,e=>{const diagnostic=byId('startup-diagnostics-host');if(diagnostic&&e.composedPath?.().includes(diagnostic))return;if(ref&&(!valid||!connected||document.hidden)&&!overlay.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();}if(event==='keydown'&&busy&&e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,passive:false});
const saveButton=byId('save');if(saveButton)saveButton.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();if(saveButton.disabled)return;saveButton.disabled=true;try{const ok=await cloud.saveSlot(state.currentSlot,state);const box=document.createElement('div');box.dataset.manualSave='true';box.className='toast '+(ok?'success':'error');box.textContent=ok?'Manuell gespeichert.':'Manuelles Speichern fehlgeschlagen. Bitte Sitzung und Verbindung prüfen.';byId('toast')?.appendChild(box);setTimeout(()=>box.remove(),3600);}finally{saveButton.disabled=false;}},true);
for(const name of ['toast','logs']){const box=byId(name);if(box)new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)if(node.nodeType===1&&!node.dataset.manualSave&&/Recke erfolgreich gesichert|Speichern fehlgeschlagen|Slot \d+ gesichert/.test(node.textContent))node.remove();}).observe(box,{childList:true});}
queueMicrotask(()=>{const game=window.__rpg;if(game)for(const name of ['move','interact']){const original=game[name];game[name]=(...args)=>{if(ref&&valid&&connected&&!document.hidden)return original(...args);};}});
setInterval(()=>{if(!ref||busy||closing)return;if(!state.user){release().then(()=>cloud.auth.signOut()).catch(console.warn);return;}if(!document.hidden)verify();},25000);
document.addEventListener('visibilitychange',()=>{if(ref&&!busy&&!closing){pause('Sitzung wird erneut geprüft.');if(!document.hidden)verify();}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
