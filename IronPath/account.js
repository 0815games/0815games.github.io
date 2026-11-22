import {createWorkshopAccount} from './workshop/workshop-account.mjs?v=20261112-tagless1';
import {createWorkshopView} from './workshop/workshop-view.mjs?v=20261112-tagless1';
import {createSoldierScreen} from './soldier-screen.mjs?v=20261122-i18n1';
import {localizeSkillSummary} from './skill-summary-localization.mjs?v=20261122-i18n1';
import {renderSkillIndicators} from './skill-indicator.mjs?v=20261104-skillindicator1';
import {setupLanguage,translate,translateText,onLanguageChange,getLanguage} from './language.mjs?v=20261122-i18n1';
import {setupFullscreen} from './fullscreen.mjs?v=20261104-fullscreen1';
import {setupFieldMenu} from './field-menu.mjs?v=20261122-i18n1';
import {createSettings,readSettings} from './settings.mjs?v=20261122-i18n1';
import {createPasswordChange} from './password-change.mjs?v=20261122-i18n1';
// Field notes: the patch log as a screen. Read-only, so it is wired next to the
// settings dialog and nothing else in the account has to know about it.
import {createPatchNotes} from './patch-notes.mjs?v=20261122-i18n1';
import {bindDisclosureDismiss} from './disclosure-dismiss.mjs?v=20261104-dismissall1';
import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
import {setupLeaderboard} from './leaderboards-ui.mjs?v=20261122-i18n1';
import {createLeaderboardService,createScoreReporter,waveFromMask} from './leaderboards.mjs?v=20261122-i18n1';
import {setupFriends} from './friends-ui.mjs?v=20261122-i18n1';
import {createMultiplayerPrompts} from './multiplayer-prompts.mjs?v=20261122-i18n1';
import {createCharacterDeletion} from './character-deletion.mjs?v=20261031-patch8';
import {validateCharacterName,characterNameKey} from './character-name.mjs?v=20261122-i18n1';
import {createCharacterNameClaim} from './character-name-claim.mjs?v=20261122-i18n1';
import {createCharacterNameConflictHandler} from './character-name-conflict.mjs?v=20261122-i18n1';
import {createDischargeNotice,createDischargeSignOut,DISCHARGE_MESSAGE} from './discharge-notice.mjs?v=20261122-i18n1';
import {createCommandCenter} from './command-center.mjs?v=20261122-i18n1';
import {featureEnabled} from './features.mjs?v=20261112-endless1';
import {createEndlessLauncher,readLastEndlessRun,writeLastEndlessRun,ENDLESS_LAST_RUN_KEY} from './endless-launcher.mjs?v=20261122-i18n1';
import {initializeWireWorkshop,applyWireWorkshopCommand} from './workshop/workshop-wire.mjs?v=20261112-tagless1';
// Story completion writes progress and the mission's prestige trophy together.
import {completeStoryMission,meltPrestige,decodeWorkshop as decodeWorkshopSafe} from './workshop/workshop-wire.mjs?v=20261112-tagless1';
import {missingPrestige} from './prestige.mjs?v=20261112-pressure1';
import {createFirebaseRecoverableGame} from './firebase-recoverable-game.mjs?v=20261122-i18n1';
import {createFourPlayerPanel} from './firebase-four-panel.mjs?v=20261122-i18n1';
import {watchFriendPortrait} from './friend-portrait.mjs?v=20261122-i18n1';
import {createFirebaseFourLobby} from './firebase-four-lobby.mjs?v=20261122-i18n1';
import {skillBuildSummary,canSaveSkillDraft} from './skill-planner.mjs?v=20261122-i18n1';
import {setupAuthForm} from './auth-form.mjs?v=20261122-i18n1';
import {applyLoginScene} from './login-scene.mjs?v=20261122-i18n1';
import {createAccountServices,requiresAccountGuard} from './account-services.mjs?v=20261031-releaseguard1';
import {createVersionUI} from './version-ui.mjs?v=20261122-i18n1';
import {createWriteTracker} from './version-check.mjs?v=20261122-i18n1';
import {createAfkTimer,createSessionTabLock} from './afk-session.mjs?v=20261031-update3';
import {createActiveSessionManager,createSameBrowserSessionMonitor,createWindowSessionId} from './active-session.mjs?v=20261122-i18n1';
import {drawAfkRestScene} from './afk-rest-scene.mjs?v=20261117-afkart1';
import {createMaintenanceUI} from './maintenance-ui.mjs?v=20261031-update3';
import {getMaintenanceBoot} from './maintenance-bootstrap.mjs?v=20261031-update3';
import {MAINTENANCE_PATH,createMaintenanceMonitor,isSessionAfterCutoff} from './maintenance-check.mjs?v=20261031-update3';
import {serviceMedals} from './service-record.mjs?v=20261112-tagless1';
import {createConfirmation} from './confirmation.mjs?v=20261122-i18n1';
import {renderSkillTree,armoryIcon} from './development-ui.mjs?v=20261122-i18n1';
import {runFirstRunEnding,endingDone,markEndingDone,createEndingHandoffs,FIELD_SCHOOL_ENTRIES} from './first-run-ending.mjs?v=20261122-i18n1';
import {createGuide,forgetGuideSeen} from './first-run-guide.mjs?v=20261122-i18n1';
import {initialOfferedTutorial,shouldAutoPresentTutorial,tutorialResumeTarget,shouldPayTutorialReward,createTutorialSync} from './tutorial-sync.mjs?v=20261122-i18n1';
import {createGeneralRadio} from './general-radio.mjs?v=20261122-i18n1';
import {createTutorialDossier} from './tutorial-dossier.mjs?v=20261122-i18n1';
import {createMenuTour} from './menu-tour.mjs?v=20261122-i18n1';
import {mountOverlayPopover} from './popover-host.mjs?v=20261122-i18n1';
import {ITEMS,readArmory,rewardWave,upgradeArmory,equipArmory,encodeLoadout} from './armory.mjs?v=20261112-tagless1';
import {SKILL_PATHS,parseBuild,encodeBuild,pointsLeft,WEB_NODES,webReady,webRequirement,webBonuses} from './skills.mjs?v=20261122-i18n1';
import {migrateSkillsProfile,needsSkillMigration,readLegacySkillBackup,summarizeSkillMigration} from './skills-migration.mjs?v=20261122-i18n1';
import {rewardDelta} from './run-results.mjs?v=20261122-i18n1';
import {createCoopRewardQueue} from './coop-rewards.mjs?v=20261122-i18n1';
import {createPartyEndCoordinator} from './party-end-coordinator.mjs?v=20261122-i18n1';
import {createPartySignOut} from './party-signout.mjs?v=20261122-i18n1';
import {creditSoloWave} from './workshop/workshop-solo-credit.mjs?v=20261112-tagless1';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase, ref, onValue, runTransaction as firebaseRunTransaction, get, remove as firebaseRemove, set as firebaseSet, update as firebaseUpdate, goOffline, onDisconnect, serverTimestamp, query, orderByKey, startAfter, limitToFirst, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import { createFirebasePartyLobby } from './firebase-party-lobby.mjs?v=20261122-i18n1';
import { createFourDigitPanel } from './firebase-four-digit-panel.mjs?v=20261122-i18n1';
import { createFourDigitLobby } from './firebase-four-digit-lobby.mjs?v=20261101-fourstage1';
import { startGame } from './game.js?v=20261122-i18n1';
import { createFirebasePartyGame } from './firebase-party-game.mjs?v=20261122-i18n1';
import { createPlayer } from './match.mjs?v=20261122-i18n1';
import { bunkerStart } from './solo-deployment.mjs?v=20261122-i18n1';
import { resolveAvatar,encodeAvatar,AVATAR_STORAGE_KEY } from './avatar.mjs?v=20261119-avatar3';
import { composePortrait,facePortrait } from './avatar-layers.mjs?v=20261119-avatar3';
import { createAvatarSync } from './avatar-sync.mjs?v=20261119-avatar3';
import { setupRecruitScreen } from './recruit-screen.mjs?v=20261122-i18n1';
import { renderRankInsignia } from './rank-insignia.mjs?v=20261122-i18n1';
import { characterProgress } from './progression.mjs?v=20261105-prestige1';

// Firebase's actual write promises remain pending while offline, including when
// a screen's own watchdog has timed out. Do not reload the document while one
// of these writes, a retry queue, or a party is still outstanding.
const releaseWrites=createWriteTracker();
let releaseFrozen=false,afkTransition=false,sessionTransition=false;
const trackedWrite=(fn,args)=>(releaseFrozen||afkTransition)?Promise.reject(Error('This session is ending')):releaseWrites.track(fn(...args));
const runTransaction=(...args)=>trackedWrite(firebaseRunTransaction,args);
const remove=(...args)=>trackedWrite(firebaseRemove,args);
const set=(...args)=>trackedWrite(firebaseSet,args);
const update=(...args)=>trackedWrite(firebaseUpdate,args);
const guardedDocument=requiresAccountGuard(document.documentElement.dataset.ironpathGuard);
let releaseSafety=()=> 'saving',beforeVersionReload=()=>{};
// Defining public settings does not initialize Auth. The older guarded build has
// its own launcher/lifecycle; the ordinary entry uses the free Firebase signal
// and a separate GitHub Pages version check.
const accountServiceOptions={
 config:{apiKey:'AIzaSyC_1iHc7YREzKAGH9YbdO5bMTEtE4edPiE',authDomain:'iron-path-dc727.firebaseapp.com',databaseURL:'https://iron-path-dc727-default-rtdb.europe-west1.firebasedatabase.app',projectId:'iron-path-dc727',storageBucket:'iron-path-dc727.firebasestorage.app',messagingSenderId:'305063261861',appId:'1:305063261861:web:8ec54d8318a983fce3ff4c'}, // @ironpath-account-firebase-config
 sdk:{initializeApp,getAuth,getDatabase,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signOut},
 requireGuard:guardedDocument
};
const maintenanceBoot=guardedDocument?null:getMaintenanceBoot();
if(maintenanceBoot&&maintenanceBoot.databaseUrl!==accountServiceOptions.config.databaseURL)throw Error('Maintenance database does not match account');
const maintenanceUI=guardedDocument?null:maintenanceBoot?.ui??createMaintenanceUI({document,window,databaseUrl:accountServiceOptions.config.databaseURL});
const versionUI=guardedDocument?null:createVersionUI({document,window,safety:()=>releaseSafety(),beforeReload:()=>beforeVersionReload()});
window.ironPathLoaded=true;
let maintenanceControl=null;
if(maintenanceUI){
 const first=maintenanceBoot?await maintenanceBoot.first:await maintenanceUI.waitForOpen();
 await versionUI.start();
 // Maintenance can begin while the page waits for its version check. Confirm
 // again before initializing Auth. If we had to wait or the cutoff rotated,
 // restart the document and check the version again, not the old cached state.
 const second=await maintenanceUI.waitForOpen();
 if(second.delayed||first.control.authAfterMs!==second.control.authAfterMs){
  const target=new URL(window.location.href);target.searchParams.set('_ip_nonce',`${Date.now()}-maintenance`);
  try{window.location.replace(target.href);}catch{maintenanceUI.halt('session');}
  await new Promise(()=>{});
 }
 maintenanceControl=second.control;
}

// Cooperating game tabs acquire this before initializing the shared Firebase
// Auth instance. If Web Locks are unavailable, play continues but automatic
// AFK sign-out is disabled rather than risking another tab's active session.
const sessionTabLock=guardedDocument?null:createSessionTabLock({locks:window.navigator?.locks});
if(sessionTabLock)await sessionTabLock.start();
let afkTimer=null;

bindDisclosureDismiss(document);
const accountServices=createAccountServices(accountServiceOptions);
const {auth,db}=accountServices, $=id=>document.getElementById(id);
let profile=null, user=null, unsubscribe=null, sessionVersion=0, gameStarted=false, notifySession=()=>{}, gameControl=null, commandCenter=null, scoreReporter=null, soldierUI=null;
let deletingCharacter=false,deletionPending=null;
let languageStorage;try{languageStorage=window.localStorage;}catch{languageStorage=null;}
const clientSessionId=createWindowSessionId();
const sameBrowserMonitor=createSameBrowserSessionMonitor({
 clientId:clientSessionId,
 locks:window.navigator?.locks,
 BroadcastChannelCtor:globalThis.BroadcastChannel
});
const sessionSdk={ref,get,remove:firebaseRemove,set:firebaseSet,runTransaction:firebaseRunTransaction,onValue,onDisconnect,serverTimestamp};
let activeSession=null,pendingConflictNotice=null,forceSessionTakeover=false,pendingSessionTakeover=false;
const SESSION_OCCUPIED_MESSAGE='This account is already active in another browser window or device. Sign out there or close the other window first.';
const SESSION_TAKEN_OVER_MESSAGE='You were signed out because this account signed in on another browser window or device.';
let dischargeStorage=null;try{dischargeStorage=window.sessionStorage;}catch{/* In-memory notice works for this document. */}
const dischargeNotice=createDischargeNotice(dischargeStorage);
let endingRunning=false,endingAborted=false,endingRun=null,firstRunGuide=null,menuTour=null,tutorialDossier=null;
const endingHandoffs=createEndingHandoffs({setTimer:(fn,ms)=>window.setTimeout(fn,ms),
 isCurrent:({version,id})=>!accountTerminated&&!!id&&version===sessionVersion&&user?.uid===id,
 offer:()=>offerFirstRunEnding()});
const releaseRewardQueues=new Set(),releaseScoreReporters=new Set(),pendingFirstRuns=new Set(),pendingStartChecks=new Set();
function trackedRewardQueue(options){const queue=createCoopRewardQueue(options);releaseRewardQueues.add(queue);return queue;}
function showStartCheck(){
 const pending=pendingStartChecks.size>0,workspace=$('gameWorkspace'),notice=$('deploymentCheck');
 if(workspace){workspace.inert=pending;if(pending)workspace.setAttribute('aria-busy','true');else workspace.removeAttribute('aria-busy');}
 if(notice)notice.hidden=!pending;
}
function cancelStartChecks(){pendingStartChecks.clear();showStartCheck();}
function beforeNewGame(){
 if(!versionUI)return Promise.resolve(true);
 // The field must not accept a second deploy, build or navigation while the
 // first asynchronous version check is deciding which operation may start.
 const marker={};pendingStartChecks.add(marker);showStartCheck();
 return Promise.resolve().then(()=>versionUI.beforeGame()).finally(()=>{pendingStartChecks.delete(marker);showStartCheck();});
}
// Declared before setupLanguage() runs: its first onChange fires immediately.
let armoryCategory='equipment';
// The recruiting office: the avatar preview and the option rows on the
// character-creation screen. Presentation only; the profile write stays in
// the form submit below.
const recruitScreen=setupRecruitScreen({document,storage:languageStorage,getAccountId:()=>user?.uid??null});
function syncContextBackButton(button,fromHq,closeLabel){
 if(!button)return;
 button.dataset.context=fromHq?'hq':'field';
 if(fromHq){
  let span=button.querySelector('[data-i18n="workspace.back"]');
  if(!span){
   span=document.createElement('span');
   span.setAttribute('data-i18n','workspace.back');
   button.replaceChildren(span);
  }
  const label=translate('workspace.back');
  span.textContent=label;
  button.setAttribute('aria-label',label.replace(/^←\s*/,''));
 }else{
  button.textContent='✕';
  button.setAttribute('aria-label',translateText(closeLabel));
 }
}
function syncContextBackButtons(){
 const fromHq=!$('commandCenter')?.hidden;
 syncContextBackButton($('settingsClose'),fromHq,'Close settings');
 syncContextBackButton($('friendsClose'),fromHq,'Close friends');
 syncContextBackButton($('armoryClose'),fromHq,'Close armory');
 syncContextBackButton($('skillCancel'),fromHq,'Close skills');
 syncContextBackButton($('resultsClose'),fromHq,'Close results');
}
let authForm=null;
setupLanguage({document,storage:languageStorage,onChange:()=>{recruitScreen?.refresh?.();authForm?.refresh?.();commandCenter?.render();gameControl?.refreshLanguage?.();soldierUI?.refresh();syncContextBackButtons();if(armoryCategory==='workshop')renderWorkshop();if(profile){$('profileLevel').textContent=levelText(profile.xp);refreshProfileRank(profile);$('profileStats').textContent=translateText('HERO DAMAGE: {damage} / SHOT',{damage:10+Math.min(level(profile.xp)-1,20)+2*parseBuild(profile.skills,level(profile.xp)).assault+(readArmory(profile.armory).equipped===1?3:0)+webBonuses(parseBuild(profile.skills,level(profile.xp))).damage});updateSkillPrompt(profile);if($('armoryDialog').open)renderArmory();if($('skillDialog').open)renderSkills();}}});
onLanguageChange(()=>{versionUI?.refresh();maintenanceUI?.refresh();});versionUI?.refresh();
const promptCenter=createMultiplayerPrompts({document,translate:translateText});onLanguageChange(()=>promptCenter.refresh());
const fullscreen=setupFullscreen({document,button:$('fullscreenToggle'),status:$('fullscreenStatus'),translate:translateText,onLanguageChange});
const confirmation=createConfirmation(document,translateText);onLanguageChange(()=>confirmation.refresh());
// One dialog for language, sound, graphics, effects and fullscreen, reached from
// both the Command Center menu and the in-game field menu. It is the single shared
// console in and out of battle: audio, voice-over, visual effects and map view flow
// live into gameControl while language stays in language.mjs.
const storedSettings=readSettings(languageStorage);
let passwordChange=null;
let settingsSoundEnabled=storedSettings.soundEnabled!==false&&Math.round(storedSettings.volume*100)>0;
let settings=null;
const generalRadio=createGeneralRadio({
 AudioCtor:globalThis.Audio,
 document,
 initialPrefs:storedSettings,
 onToggleVoiceOver:voiceOver=>{
  if(settings&&settings.voiceOver!==!!voiceOver){$('voiceOverToggle')?.click?.();}
 }
});
settings=createSettings({
 document,window,storage:languageStorage,translate:translateText,confirm:confirmation,fullscreen,
 sound:{
  setVolume:value=>{const v=gameControl?.setVolume?.(value)??value;generalRadio?.setPrefs?.({volume:v});return v;},
  setSfxVolume:value=>gameControl?.setSfxVolume?.(value)??value,
  setMusicVolume:value=>gameControl?.setMusicVolume?.(value)??value,
  setMusicEnabled:value=>gameControl?.setMusicEnabled?.(value)??!!value,
  setEnabled:value=>{
   settingsSoundEnabled=!!value;
   const enabled=gameControl?.setSoundEnabled?.(settingsSoundEnabled)??settingsSoundEnabled;
   generalRadio?.setPrefs?.({soundEnabled:settingsSoundEnabled});
   return enabled;
  },
 },
 onGraphicsChange:reduced=>gameControl?.setReducedGraphics?.(reduced),
 onVisualChange:prefs=>{gameControl?.applySettings?.(prefs);generalRadio?.setPrefs?.({voiceOver:prefs.voiceOver!==false,soundEnabled:prefs.soundEnabled!==false,volume:prefs.volume});},
 onResetFirstRun:()=>replayFirstRun(),
 onOpen:()=>{syncContextBackButtons();passwordChange?.refresh();settings.paint();},
 onClose:()=>passwordChange?.reset(),
});
for(const muteId of ['coachRadioMute','guideRadioMute']){
 const btn=$(muteId);if(btn)btn.onclick=()=>generalRadio?.toggleMute?.();
}
onLanguageChange(()=>{generalRadio?.refreshLanguage?.();tutorialDossier?.refreshLanguage?.();menuTour?.refreshLanguage?.();});
passwordChange=createPasswordChange({
 document,
 getUser:()=>user??auth.currentUser??null,
 resetPassword:email=>accountServices.resetPassword(email),
 translate:translateText,
});
bindDialogBackdrop($('settingsDialog'),()=>settings.close());
onLanguageChange(()=>{passwordChange?.refresh();passwordChange?.retranslate();settings.paint();});
const openSettings=(from,options)=>{syncContextBackButtons();settings.apply();settings.open(from,options);};
setupFieldMenu({document,onLanguageChange,onSettings:openSettings});
$('menuSettings').onclick=()=>openSettings($('menuSettings'));
// What changed and what comes next, straight from patch-notes.mjs. It opens on
// the released list; the planned tab carries the blocks, Block 7 last.
const patchNotes=createPatchNotes({document});
bindDialogBackdrop($('patchNotes'),()=>patchNotes.close());
$('menuPatchNotes').onclick=()=>patchNotes.open('released');
onLanguageChange(()=>patchNotes.render());
// The armory workshop is open to every signed-in soldier (free tier: client
// transactions, no backend). It is built into the Armory screen.
// Set once a workshop award was rejected by rules, so later waves use the legacy
// credit for the rest of the session instead of retrying (and replaying) receipts.
let workshopReceiptFallback=false;
let workshopPrepare=null,armoryView=null,workshopPrepareFailed=false;
// Free-tier direction: Firebase client transactions, no paid backend.
// Tutorial sandbox. While it is on, the real Armory/Skills dialogs render from an
// example soldier and every write is refused here, in one place, before any
// transaction can be built. A bug in the tutorial therefore cannot touch a save.
let sandbox=null;
const inSandbox=()=>sandbox!==null;
const viewProfile=()=>sandbox?sandbox.profile:profile;
// Refuse instead of silently succeeding: the tutorial UI must never believe a
// change was saved when nothing was written.
class SandboxWrite extends Error{}
function assertWritable(){if(inSandbox())throw new SandboxWrite('Sandbox mode: nothing is written to your soldier.');}
const workshopAccount=createWorkshopAccount({db,auth,sdk:{ref,onValue,runTransaction},canEdit:()=>!inSandbox()&&canEditSkills()});
// Practice runs the workshop's own reducers against the sample soldier. It is a
// separate service object rather than a relaxed `canEdit`: the real service can
// never reach a transaction while the sandbox is on, so this cannot become a hole.
const sandboxWorkshop={
  async initialize(){return applySandboxWorkshop(p=>initializeWireWorkshop(p));},
  async sync(){return applySandboxWorkshop(p=>meltPrestige(p));},
  async command(command){return applySandboxWorkshop(p=>applyWireWorkshopCommand(p,command),command);},
};
function applySandboxWorkshop(reduce,command=null){
  if(!inSandbox())return {status:'sandbox'};
  const next=reduce(sandbox.profile);
  if(!next)return {status:'rejected'};
  sandboxAPI.apply(next);
  if(command&&(command.type==='craft'||command.type==='equip'))sandboxAPI.markWorkshop(command);
  return {status:'saved',profile:next};
}
const workshopService={
  initialize:()=>inSandbox()?sandboxWorkshop.initialize():workshopAccount.initialize(),
  command:async command=>{
    const result=await (inSandbox()?sandboxWorkshop.command(command):workshopAccount.command(command));
    if(result?.status==='saved')gameControl?.playCue?.(command?.type==='equip'?'uiEquip':'uiCraft');
    else if(result?.status&&result.status!=='cancelled')gameControl?.playCue?.('uiError');
    return result;
  },
  sync:()=>inSandbox()?sandboxWorkshop.sync():workshopAccount.sync(),
  hasPending:()=>inSandbox()?false:!!workshopAccount.hasPending?.(),
  isBusy:()=>workshopAccount.isBusy(),
};
armoryView=createWorkshopView({document,root:$('armoryWorkshop'),getProfile:viewProfile,service:workshopService,confirm:options=>confirmation.ask(options),translate:translateText,onProfile:value=>{profile=value;commandCenter?.render();soldierUI?.refresh();if(gameControl?.canEditSkills())gameControl.resetSkills();}});
soldierUI=createSoldierScreen({document,getProfile:viewProfile,translate:translateText,getPortrait:recruitPortraitUrl,onArmory:()=>$('armoryOpen').onclick(),onSkills:()=>$('skillOpen').onclick()});$('menuSoldier').onclick=()=>soldierUI.open();
const leaderboardUI=setupLeaderboard({document,db,auth,sdk:{ref,get,onValue,runTransaction,query,orderByChild,limitToLast}});
const friendsUI=setupFriends({document,db,auth,sdk:{ref,get,set,remove,runTransaction,onValue,onDisconnect,query,orderByKey,startAfter,limitToFirst,serverTimestamp},getProfile:()=>profile,getHostInvite:()=>fourPanel?.hostInvite(),joinInvite:async invite=>{if(!fourPanel||fourPanel.isActive()||partyPanel.isActive())return false;const joined=await fourPanel.joinInvite(invite);if(joined){commandCenter?.showLobby();fourPanel.show();$('partyToggle').setAttribute('aria-expanded','true');}return !!joined;},promptCenter});
let nameReserved=false;
const nameConflictHandler=createCharacterNameConflictHandler({
 document,db,auth,
 sdk:{ref,get,set,remove,update,runTransaction,query,orderByKey,limitToFirst},
 translate:translateText,
 isCurrent:()=>!accountTerminated&&!!user&&auth.currentUser?.uid===user?.uid,
 beforeOpen:()=>{closeMenuDialogs();},
 onReserved:()=>{nameReserved=true;},
 onRenamed:newName=>{
  nameReserved=true;
  if(profile)profile={...profile,name:newName};
  $('profileName').textContent=newName;
  commandCenter?.render();soldierUI?.refresh();
  if(featureEnabled('friends'))friendsUI.start();
  $('saveStatus').textContent=translateText('Soldier name updated. All progress and gear remain intact.');
 },
 onSignOut:()=>logout()
});
onLanguageChange(()=>nameConflictHandler.refreshLanguage());
for(const trigger of ['menuFriends','lobbyFriends','inviteNotification','menuResults','viewResults'])$(trigger)?.addEventListener?.('click',syncContextBackButtons,{capture:true});
// Limited live alpha test: publicly accessible; not a security boundary.
const partySdk={ref,onValue,runTransaction,get,remove,set,update,onDisconnect,serverTimestamp};
// Online alpha: requires the complete four-player Firebase rules to be published.
const fourPlayerTest=true;
// Explicit, limited online trial; the host's immutable manifest selects the
// protocol for every member so normal lobbies remain unchanged.
const hostRecoveryEnabled=new URLSearchParams(window.location.search).get('recovery')==='1';
$('fourPartyResume').hidden=!hostRecoveryEnabled;
let fourPanel=null,activePartyEnd=null,hostPartySignOut=null;
const confirmNewParty=async()=>{
 const version=sessionVersion,uid=user?.uid;
 if(!uid||!profile||versionUI&&!await beforeNewGame()||version!==sessionVersion||user?.uid!==uid||!profile)return false;
 const confirmed=await (gameControl?.confirmParty()??false);
 return !!confirmed&&version===sessionVersion&&user?.uid===uid&&!!profile;
};
const partyPanel=createFourDigitPanel({document,createApproval:lobby=>createFourDigitLobby({db,auth,sdk:partySdk,lobby}),createLobby:()=>{if(fourPanel?.isActive())throw Error('Leave the four-player party first');return createFirebasePartyLobby({db,auth,sdk:partySdk});},getProfile:()=>({name:profile.name,gender:profile.gender,level:level(profile.xp),...(profile.skills?{skills:profile.skills}:{}),...(profile.armory?{loadout:encodeLoadout(profile.armory)}:{})}),confirmMatch:confirmNewParty,onLeaveMatch:()=>gameControl?.leaveCoop(),onJoinMatch:(party,onUpdate)=>{const uid=auth.currentUser?.uid,version=sessionVersion;const rewardQueues=new Map();const rewardOptions={db,auth,sdk:partySdk,partyId:party.partyId,workshop:true,onStatus:(status,detail,block)=>{if(version===sessionVersion&&auth.currentUser?.uid===uid){$('saveStatus').textContent=status==='error'?translateText('Co-op XP and loot could not be saved yet. Check Firebase rules and connection.'):translateText('Co-op wave XP and loot saved.');gameControl?.recordCoopReward(party.partyId,status,detail,block);}}};const getRewards=block=>{if(!rewardQueues.has(block))rewardQueues.set(block,trackedRewardQueue({...rewardOptions,block,onStatus:(status,detail)=>rewardOptions.onStatus(status,detail,block)}));return rewardQueues.get(block);};const joined=gameControl?.beginCoop(callbacks=>createFirebasePartyGame({db,auth,sdk:partySdk,...party,mapId:gameControl.getMapId(),players:party.profiles?.map((p,i)=>{const start=bunkerStart(gameControl.getMapId(),i);return createPlayer(party.playerIds[i],p,start.x,start.y);}),...callbacks,onWaveRewards:(mask,block=0)=>getRewards(block).observe(mask)}),onUpdate,party.partyId,'coop')??false;if(!joined)for(const queue of rewardQueues.values())queue.close();return joined;},confirmClose:()=>confirmation.ask({title:"Close party?",text:"This closes the multiplayer match for both players.",accept:"CLOSE PARTY"}),enabled:false});
if(fourPlayerTest){
  fourPanel=createFourPlayerPanel({document,createLobby:()=>{if(partyPanel.isActive())throw Error('Leave the current party first');return createFirebaseFourLobby({db,auth,sdk:partySdk,recoveryEnabled:hostRecoveryEnabled});},
    getProfile:()=>({name:profile.name,gender:profile.gender,level:level(profile.xp),...(profile.skills?{skills:profile.skills}:{}),...(profile.armory?{loadout:encodeLoadout(profile.armory)}:{})}),
    // WHOSE face a card may show is decided here, not in the panel: the local
    // soldier's own portrait is already rendered, a party member's is watched
    // live from the two profile fields the portrait rules permit. Until those
    // rules are published that read is refused and the card keeps its
    // placeholder - the honest answer, and the same one the friends list gives.
    portraitFor:(id,onChange)=>{
      if(id===auth.currentUser?.uid){onChange(recruitPortraitUrl());return ()=>{};}
      return watchFriendPortrait({db,auth,sdk:partySdk,id,document,onChange});
    },
    confirmStart:confirmNewParty,confirmClose:({started}={})=>confirmation.ask({title:'Close multiplayer party?',text:started?'This ends the shared match. The party closes after every player has received their report and saved their completed-wave rewards.':'This closes the multiplayer party.',accept:'CLOSE PARTY'}),
    confirmForceClose:({entries=[]}={})=>confirmation.ask({
      title:'Force close party?',
      text:()=>{
        const names=entries.map(entry=>entry.state==='departed'?translateText('{name} (left early)',{name:entry.name}):entry.state==='offline'?translateText('{name} (offline)',{name:entry.name}):entry.name).join(', ');
        return names
          ?translateText('These players have not confirmed yet: {names}. Their already-saved completed waves stay safe, and any unconfirmed offline rewards will not be delivered if you close the party now.',{names})
          :translateText('Not all players have confirmed their final report and rewards yet. Their already-saved completed waves stay safe, and any unconfirmed offline rewards will not be delivered if you close the party now.');
      },
      accept:'FORCE CLOSE PARTY'
    }),
    promptCenter,onViewRequests:()=>{commandCenter?.showLobby();fourPanel?.show();$('partyToggle').setAttribute('aria-expanded','true');},
    onRequestHostEnd:id=>gameControl?.requestHostPartyEnd(id)??false,
    canCompleteEnd:(id,tick)=>activePartyEnd?.partyId===id&&activePartyEnd.coordinator.canClose(tick),
    canForceCloseEnd:(id,tick)=>activePartyEnd?.partyId===id&&activePartyEnd.coordinator.canForceClose(tick),
    onLeaveMatch:async(options={})=>{const version=sessionVersion,finishedScope=activePartyEnd;activePartyEnd?.coordinator.stop();activePartyEnd=null;await gameControl?.leaveCoop(options);if(options.forced&&finishedScope)void hostPartySignOut?.completed(finishedScope);if(version===sessionVersion&&!fourPanel?.isActive()&&user&&!$('gameView').hidden&&!$('gameWorkspace').hidden){commandCenter?.showLobby();fourPanel?.show();}},
    onMatch:async (party,{isCurrent=()=>true}={})=>{
      const uid=auth.currentUser?.uid,version=sessionVersion;if(versionUI&&party.hostId!==uid&&!await beforeNewGame())return false;if(uid!==auth.currentUser?.uid||version!==sessionVersion||!isCurrent())return false;
      const rewardQueues=new Map();let scope;
      const nameFor=id=>{const idx=party.playerIds.indexOf(id);return fourPanel?.profileNameFor?.(id)||party.profiles?.[idx]?.name||id;};
      const coordinator=createPartyEndCoordinator({uid,hostId:party.hostId,playerIds:party.playerIds,getQueues:()=>rewardQueues,
        isCurrent:()=>activePartyEnd===scope&&version===sessionVersion&&auth.currentUser?.uid===uid&&isCurrent(),
        send:tick=>gameControl?.acknowledgePartyEnd(party.partyId,tick)??{ok:false},
        onClose:async tick=>{const closed=await (fourPanel?.completeParty(party.partyId,tick)??false);if(closed===true)void hostPartySignOut?.completed(scope);return closed;},
        onStatus:(value,tick,detail)=>{
          const departedSet=new Set(detail?.departedIds||[]),offlineSet=new Set(detail?.offlineIds||[]);
          const missingEntries=(detail?.missingIds||[]).map(id=>({name:nameFor(id),state:departedSet.has(id)?'departed':offlineSet.has(id)?'offline':'confirming'}));
          const uiDetail=detail?{endTick:tick,canForceClose:!!detail.canForceClose,missingEntries}:null;
          if(value!=='saving'){
            gameControl?.markPartyRewardsConfirmed(party.partyId,tick);
            gameControl?.setPartyFinalizationState?.(party.partyId,tick,uiDetail);
          }
          fourPanel?.completionStatus(party.partyId,value,uiDetail);
        }
      });
      scope={partyId:party.partyId,hostId:party.hostId,uid,version,user,authUser:auth.currentUser,coordinator};activePartyEnd?.coordinator.stop();activePartyEnd=scope;
      const getRewards=block=>{if(!rewardQueues.has(block))rewardQueues.set(block,trackedRewardQueue({db,auth,sdk:partySdk,partyId:party.partyId,block,onChange:()=>queueMicrotask(()=>coordinator.refresh()),onStatus:(status,detail)=>{if(version!==sessionVersion||auth.currentUser?.uid!==uid)return;$('saveStatus').textContent=status==='error'?translateText('Wave rewards could not be saved yet.'):translateText('Wave rewards saved.');gameControl?.recordCoopReward(party.partyId,status,detail,block);}}));return rewardQueues.get(block);};
      const joined=gameControl?.beginCoop(callbacks=>{const players=party.profiles?.map((p,i)=>{if(party.playerIds.length!==2)return createPlayer(party.playerIds[i],p,1220,270+i*60);const start=bunkerStart(gameControl.getMapId(),i);return createPlayer(party.playerIds[i],p,start.x,start.y);}),common={db,auth,sdk:partySdk,partyId:party.partyId,mapId:gameControl.getMapId(),players,...callbacks,onWaveRewards:(mask,block=0)=>{coordinator.observeReward(block,mask);getRewards(block).observe(mask);if(party.mode==='coop'||party.mode==='four-coop')scoreReporter?.observe('coop',waveFromMask(mask,block));}};return party.recovery===true?createFirebaseRecoverableGame({...common,manifest:party,resumeGeneration:party.resumeGeneration??null}):createFirebasePartyGame({...common,partyRoot:'fourParties',hostId:party.hostId,playerIds:party.playerIds,mode:party.mode,teams:party.teamRosters});},()=>{},party.partyId,party.mode,frame=>coordinator.observe(frame))??false;
      if(joined){commandCenter?.showBattle();fourPanel.hide();$('partyToggle').setAttribute('aria-expanded','false');}else{coordinator.stop();if(activePartyEnd===scope)activePartyEnd=null;for(const queue of rewardQueues.values())queue.close();}return joined;
    }});
  $('partyToggle').hidden=false;$('partyToggle').onclick=()=>{commandCenter?.showLobby();partyPanel.collapse();fourPanel.show();$('partyToggle').setAttribute('aria-expanded','true');};
}
const level=xp=>characterProgress(xp).level;
const levelText=xp=>{const p=characterProgress(xp);return translateText('LEVEL {level} · {current} / {required} XP',{level:p.level,current:p.current,required:p.required});};
// The connecting scene tells the truth in two steps: the field link while
// Firebase auth resolves, the soldier while the profile streams in. `link` is
// the resting state of a fresh page; the auth callback moves it to `soldier`.
const LOADING_STEPS={
 link:{title:'Establishing field connection…',hint:'The valley is waiting.'},
 soldier:{title:'Preparing your soldier.',hint:'Record, gear and skills are on their way.'},
};
const SESSION_LOADING_STEP={title:'Checking active session…',hint:'Verifying single-account access.'};
let loadingStep='link',loadingSlowTimer=null;
function setLoadingStep(step){
 loadingStep=(LOADING_STEPS[step]||step==='session')?step:'link';
 const def=LOADING_STEPS[loadingStep]||(loadingStep==='session'?SESSION_LOADING_STEP:LOADING_STEPS.link);
 const title=$('loadingTitle'),hint=$('loadingStep');
 if(title)title.textContent=translateText(def.title);
 if(hint)hint.textContent=translateText(def.hint);
}
function beginLoadingScene(){
 setLoadingStep(loadingStep);
 if(loadingSlowTimer)clearTimeout(loadingSlowTimer);
 $('loadingSlow')&&($('loadingSlow').hidden=true);
 // A slow connection is told, not swallowed: after six seconds the scene
 // says so itself, long before the error view would take over.
 loadingSlowTimer=setTimeout(()=>{const slow=$('loadingSlow');if(slow&&$('loading').hidden===false)slow.hidden=false;},6000);
}
function endLoadingScene(){
 if(loadingSlowTimer){clearTimeout(loadingSlowTimer);loadingSlowTimer=null;}
 $('loadingSlow')&&($('loadingSlow').hidden=true);
}
function closeMenuDialogs(){
 for(const id of ['settingsDialog','patchNotes','endlessLaunch','soldierDialog','armoryDialog','skillDialog','friendsDialog','friendStatsDialog','leaderboardDialog']){
  const dialog=$(id);if(dialog?.open)try{dialog.close();}catch{}
 }
}
function display(view){const wasAuthHidden=$('authView').hidden;if(view!=='game')closeMenuDialogs();$('loading').hidden=view!=='loading';$('authView').hidden=view!=='auth';$('connectionView').hidden=view!=='connection';$('characterView').hidden=view!=='character';$('entry').hidden=view==='game';$('gameView').hidden=view!=='game';if(view==='auth'&&wasAuthHidden)applyLoginScene({document,storage:languageStorage});if(view==='loading')beginLoadingScene();else endLoadingScene();
 // The recruiting office is a wide desk, not a 430px personnel card: the
 // entry panel breaks out of its dossier width while the Musterung is up.
 $('entry').classList.toggle('recruiting',view==='character');}
let entryMessage={text:'',values:{}};
function message(text,values={}){entryMessage=typeof text==='object'?text:{text,values};$('entryMessage').textContent=translateText(entryMessage.text,entryMessage.values);}
onLanguageChange(()=>message(entryMessage));
function errorText(error){const code=error?.code||'';if(code.includes('invalid-credential')||code.includes('wrong-password')||code.includes('user-not-found'))return 'Incorrect email or password.';if(code.includes('email-already-in-use'))return 'This email is already registered. Sign in instead.';if(code.includes('weak-password'))return 'Please choose a stronger password.';if(code.includes('invalid-email'))return 'Please enter a valid email address.';if(code.includes('network'))return 'Network error. Check your connection and try again.';if(code.includes('permission-denied')||code.includes('permission_denied'))return 'Database access denied. The Iron Path database rules may need to be deployed.';return code?{text:'Could not complete the request. Please try again. ({code})',values:{code}}:'Could not complete the request. Please try again.';}
async function busy(button, task){if(button.disabled)return;button.disabled=true;message('');try{await task();}catch(e){message(errorText(e));}finally{button.disabled=false;}}
authForm=setupAuthForm({form:$('authForm'),email:$('email'),password:$('password'),submit:$('authSubmit'),register:$('register'),forgot:$('forgot'),confirm:$('passwordConfirm'),confirmField:$('passwordConfirmField'),
 onSignIn:async (email,secret)=>{
  forceSessionTakeover=!!$('sessionTakeoverCheck')?.checked;
  const beforeVersion=sessionVersion,preSignInUid=auth.currentUser?.uid||null;
  try{await accountServices.signIn(email,secret);}
  catch(error){forceSessionTakeover=false;throw error;}
  if(!accountTerminated&&sessionVersion===beforeVersion&&user===null&&preSignInUid&&auth.currentUser?.uid===preSignInUid){
   sessionVersion++;
   activateSignedInUser(auth.currentUser,sessionVersion);
  }
 },
 onRegister:(email,secret)=>{forceSessionTakeover=false;return accountServices.register(email,secret);},
 onError:error=>message(typeof error==='string'?error:error?errorText(error):'')});
$('register').addEventListener('click',()=>{queueMicrotask(()=>{if(!$('passwordConfirmField')?.hidden){forceSessionTakeover=false;if($('sessionTakeoverField'))$('sessionTakeoverField').hidden=true;if($('sessionTakeoverCheck'))$('sessionTakeoverCheck').checked=false;}});});
$('forgot').onclick=e=>{const email=$('email').value.trim();if(!email){message('Enter your email address first.');return;}busy(e.currentTarget,async()=>{await accountServices.resetPassword(email);message('If the email is registered, a reset email may arrive shortly.');});};
async function releaseActiveSession({removeRemote=true}={}){
 sameBrowserMonitor.release();
 const current=activeSession;activeSession=null;
 if(current)await current.release({removeRemote});
}
window.addEventListener('pagehide',()=>{
 sameBrowserMonitor.release();
 void activeSession?.release?.({removeRemote:true});
});
async function logout(){
 sessionTransition=true;
 try{
 // Once an immediate sign-out is chosen, a guarded session ends this document
 // without waiting for network cleanup. Deferred sign-out is a separate choice.
 if(accountServices.guarded){await releaseActiveSession({removeRemote:true});await accountServices.logout();}
 else{await fourPanel?.leaveForLogout();await partyPanel.leaveForLogout();await releaseActiveSession({removeRemote:true});await accountServices.logout();}
 $('password').value='';return true;
}catch(e){message(errorText(e));{const err=errorText(e);$('saveStatus').textContent=typeof err==='string'?translateText(err):translateText(err.text,err.values);}return false;}finally{sessionTransition=false;}}
let hostSignOutState='idle';
function renderHostSignOutStatus(){
 const text=({waiting:'Sign-out is waiting for every report and saved reward. Keep this page open. Choose sign out again to cancel waiting or sign out now.',failed:'The match could not be ended. You are still signed in; reconnect and try again.',changed:'The party changed. Review it before signing out.', 'signout-failed':'Sign-out failed. You are still signed in; try again.'})[hostSignOutState];
 $('partySignOutStatus').hidden=!text;$('partySignOutStatus').textContent=text?translateText(text):'';
}
onLanguageChange(renderHostSignOutStatus);
hostPartySignOut=createPartySignOut({
 isSessionCurrent:scope=>!accountTerminated&&!releaseFrozen&&scope.version===sessionVersion&&scope.user===user&&scope.authUser===auth.currentUser&&scope.uid===user?.uid,
 isPartyCurrent:scope=>fourPanel?.startedHostPartyId()===scope.partyId&&(scope.coordinator?activePartyEnd===scope:!activePartyEnd),
 canSignOutAfterClose:()=>!fourPanel?.isActive()&&!partyPanel.isActive(),
 requestEnd:scope=>activePartyEnd===scope?(gameControl?.requestHostPartyEnd(scope.partyId)??false):false,
 signOut:async()=>{if(!await logout())throw Error('Sign-out failed');},
 onState:value=>{hostSignOutState=value;renderHostSignOutStatus();}
});
async function requestLogout(){
 const version=sessionVersion,currentUser=user,currentAuth=auth.currentUser,hostPartyId=fourPanel?.startedHostPartyId();
 if(hostPartyId){
  // The placeholder covers a just-started match whose adapter is still
  // connecting: waiting will fail safely, while immediate logout stays usable.
  const scope=activePartyEnd?.partyId===hostPartyId?activePartyEnd:{partyId:hostPartyId,uid:user?.uid,version,user,authUser:currentAuth};
  const waiting=hostPartySignOut.isWaiting(scope);
  const answer=await confirmation.ask({title:'Sign out?',text:waiting?'Sign-out is waiting for every player. You can cancel the scheduled sign-out (the match remains ended), or sign out now and leave the party potentially unfinished.':'Waiting ends the shared match and signs you out only after every report and reward is confirmed. Keep this page open. Signing out now can leave the party open and rewards unconfirmed.',accept:waiting?'CANCEL SCHEDULED SIGN-OUT':'END AND WAIT',alternate:'SIGN OUT NOW'});
  if(answer===false)return;
  await hostPartySignOut.choose(scope,answer==='alternate'?'now':waiting?'cancel':'wait');return;
 }
 const partyActive=partyPanel.isActive()||!!fourPanel?.isActive(),run=gameControl?.getRunSummary();
 if((partyActive||run)&&!await confirmation.ask({title:'Sign out?',text:partyActive?'Signing out disconnects you. Unsaved rewards and party closure may require you to reconnect.':'Your current solo operation will be lost. Completed-wave rewards remain saved.',accept:'SIGN OUT'}))return;
 // A delayed dialog must not sign out a different account or a newly joined party.
 if(version!==sessionVersion||currentUser!==user||currentAuth!==auth.currentUser||partyActive!==(partyPanel.isActive()||!!fourPanel?.isActive()))return;
 await logout();
}
$('logout').onclick=requestLogout; $('setupLogout').onclick=logout;
// Once the server has acknowledged deletion, a failed sign-out must not be
// reported as a failed deletion or let the old session silently re-enlist.
// The retry remains tied to this exact account session. Guarded logout replaces
// the document; the one-shot notice travels through tab-local storage.
const dischargeSignOut=createDischargeSignOut({auth,notice:dischargeNotice,guarded:accountServices.guarded,logout:()=>accountServices.logout(),
 isCurrent:(currentUser,version)=>!accountTerminated&&version===sessionVersion&&user===currentUser&&auth.currentUser?.uid===currentUser.uid&&!accountServices.signal?.aborted,
 onFailure:()=>{display('connection');message('Character deleted, but sign out failed. Please retry signing out before creating a new soldier.');}});
const signOutDischarged=(currentUser,version)=>dischargeSignOut.start(currentUser,version);
$('errorLogout').onclick=()=>dischargeSignOut.hasRetry()?dischargeSignOut.retry():logout();
// Never start deleting in a party or while a lobby request is still completing.
// Other tabs/older builds cannot be locked by this page; the confirmation asks
// the player to close them. A successful update covers only discoverable paths.
const partyActivity=()=>partyPanel.isActive()||partyPanel.isBusy()||!!fourPanel?.isActive()||!!fourPanel?.isBusy();
async function deleteCharacter(){
 if(!user||!profile||deletionPending)return;
 const partyWarning='Leave your party and wait for its actions to finish. For a started match, ask the host to close it before deleting your soldier.';
 if(partyActivity()){$('saveStatus').textContent=translateText(partyWarning);passwordChange?.setStatus(partyWarning,'error');return;}
 const currentUser=user,currentName=profile.name,version=sessionVersion;
 const confirmed=await confirmation.ask({title:'Delete character?',text:'Your soldier, progress, scores and discoverable friend links and invitations will be removed. Close other tabs and devices first. Any current solo operation ends even if deletion fails. Your account remains; older unindexed data may remain.',accept:'DELETE'});
 if(!confirmed||user!==currentUser||version!==sessionVersion||profile?.name!==currentName)return;
 if(partyActivity()){$('saveStatus').textContent=translateText(partyWarning);passwordChange?.setStatus(partyWarning,'error');return;}
 settings.close();closeMenuDialogs();
 const attempt={};deletionPending=attempt;deletingCharacter=true;$('menuDeleteCharacter').disabled=true;
 const current=()=>deletionPending===attempt&&version===sessionVersion&&user===currentUser&&auth.currentUser?.uid===currentUser.uid&&!accountServices.signal?.aborted;
 try{
  // Stop new local writes and wait for work already sent by this document. Do
  // not time out and then start another deletion: Firebase can queue writes
  // offline. The loading view remains blocked until a server response arrives.
  const scoreStop=scoreReporter?.close();scoreReporter=null;
  const socialStop=friendsUI.prepareForDeletion();
  if(unsubscribe){unsubscribe();unsubscribe=null;}
  leaderboardUI.reset();notifySession();display('loading');
  message('Deleting your soldier. Keep this page open and check your connection.');
  await Promise.all([scoreStop,socialStop]);if(!current())return;
  // A reserved name belongs to the character, not the account: it has to go
  // when the character does, or the name stays blocked forever. Only ever
  // asked for when this session actually holds a reservation - the published
  // Rules do not know the index yet, and an unknown path must not make the
  // whole atomic deletion fail.
  let releaseNameKey=null;
  if(nameReserved)try{releaseNameKey=characterNameKey(currentName);}catch{releaseNameKey=null;}
  if(!releaseNameKey){
   try{
    const candidateKey=characterNameKey(currentName);
    const snap=await get(ref(db,`characterNames/${candidateKey}`));
    if(snap?.val?.()?.uid===currentUser.uid)releaseNameKey=candidateKey;
   }catch{releaseNameKey=null;}
  }
  if(!current())return;
  const deletion=createCharacterDeletion({db,auth,sdk:{ref,get,update},isCurrent:current,releaseNameKey});
  await deletion.remove(currentName);if(!current())return;
  // update() is locally optimistic; only sign out after the server has
  // acknowledged it. The profile listener stayed detached while it was pending.
  deletingCharacter=false;profile=null;notifySession();
  try{localStorage.removeItem(AVATAR_STORAGE_KEY);localStorage.removeItem(ENDLESS_LAST_RUN_KEY);}catch{/* Local mirrors are optional. */}
  const nameField=$('soldierName');if(nameField)nameField.value='';
  recruitScreen.reset();await releaseActiveSession({removeRemote:true});await signOutDischarged(currentUser,version);
 }catch{
  if(current()){
   // A denied update is atomic, but a lost response is uncertain. Reload the
   // soldier instead of claiming either success or an unchanged profile.
   deletingCharacter=false;profile=null;notifySession();display('connection');
   message('Character deletion was not confirmed. Check your connection and database rules, then retry loading your soldier.');
  }
 }finally{
  if(deletionPending===attempt)deletionPending=null;
  $('menuDeleteCharacter').disabled=false;
 }
}
$('menuDeleteCharacter').onclick=deleteCharacter; $('retryProfile').onclick=()=>{if(dischargeSignOut.hasRetry()){void dischargeSignOut.retry();return;}if((user||auth.currentUser)&&!accountTerminated){message('');loadingStep='soldier';display('loading');void loadProfile(user||auth.currentUser,sessionVersion);}};
// The day service began - shown in the service record. Local time, ISO
// shape, exactly what the published rules accept.
const enlistmentDate=()=>{const now=new Date(),pad=n=>String(n).padStart(2,'0');return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;};
// Soldier names are meant to be unique across accounts (A1). The reservation
// index is claimed BEFORE the profile is written and released again if the
// profile never materializes. Until the companion Rules are published the
// reservation is refused by the server; then this stays a best-effort check
// against the existing friend search index and CHARACTER CREATION KEEPS
// WORKING - an unsupported index must never block a new player.
$('characterForm').addEventListener('submit',e=>{e.preventDefault();const typed=$('soldierName').value;const check=validateCharacterName(typed);if(!check.ok){message(check.reason==='length'?'Soldier name must be 2–24 characters.':'That soldier name cannot be used. Choose another one.');return;}const name=check.name;const avatar=recruitScreen.getAvatar();const currentUser=user, version=sessionVersion;recruitScreen.stamp();busy(e.submitter,async()=>{
 const claim=createCharacterNameClaim({db,auth:{currentUser},sdk:{ref,get,remove,runTransaction,query,orderByKey,limitToFirst},isCurrent:()=>version===sessionVersion});
 const reserved=await claim.claim(name).catch(()=>({status:'unsupported'}));
 if(version!==sessionVersion)return;
 if(reserved.status==='taken'){message(translateText('That soldier name is already taken. Choose another one.'));return;}
 nameReserved=reserved.status==='claimed';
 const isRulesRefusal=err=>/permission[_ -]?denied|doesn'?t have permission to access/i.test(`${err?.code||''} ${err?.message||''}`);
 const runEnlist=(includeTutorial)=>runTransaction(ref(db,`players/${currentUser.uid}`),current=>current===null?{name,gender:avatar.gender,xp:0,enlisted:enlistmentDate(),...(includeTutorial?{tutorial:initialOfferedTutorial()}:{})}:undefined,{applyLocally:false});
 let result;
 try{
  try{result=await runEnlist(true);}
  catch(err){if(!isRulesRefusal(err)||version!==sessionVersion)throw err;result=await runEnlist(false);}
 }catch(err){
  if(version===sessionVersion&&nameReserved){nameReserved=false;void claim.release(name).catch(()=>{});}
  throw err;
 }
 // The reservation is only kept when the profile really exists; otherwise the
 // name would stay blocked for everyone after a failed enlistment.
 if(!result.committed&&!result.snapshot.exists()&&nameReserved){nameReserved=false;void claim.release(name).catch(()=>{});}
 // The face rides in its own optional field after the profile exists, so a
 // ruleset without the avatar field can never block account creation. Until
 // that field is published the localStorage mirror (written on every change)
 // keeps the face; the write starts succeeding the moment the rules go live.
 if(version!==sessionVersion)return;
 if(result.committed){try{await update(ref(db,`players/${currentUser.uid}`),{avatar:encodeAvatar(avatar)});}catch{/* Rules for the avatar field not published yet; the mirror has the face. */}await refreshSoldierPortrait();}
 else if(result.snapshot.exists())loadProfile(currentUser,version);});});
function updateSkillPrompt(value){const lvl=level(value.xp),left=pointsLeft(parseBuild(value.skills,lvl),lvl);renderSkillIndicators({document,points:left});}
// ── Endless record (launch dialog) ─────────────────────────────────────────
// Client-reported like every other progression write. The stats live in four
// profile fields the published rules accept (since 2026-10-31); if a write is
// ever rejected anyway (rules rollback, offline), it silently disables the
// stats for this session - wave rewards and the last-run card are unaffected
// either way.
let endlessStatsEnabled=true;
function endlessRecord(){
  const armory=profile?readArmory(profile.armory):null;
  return {runs:profile?.endlessRuns,waves:profile?.endlessWaves,bosses:profile?.endlessBosses,bestSector:profile?.endlessBestSector,scrap:armory?.scrap,loadout:armory?.equipped?translateText(ITEMS[armory.equipped-1].name):null};
}
async function bestSoloWave(){try{const snap=await get(ref(db,`leaderboards/solo/${user?.uid}`));return snap?.val()?.wave||0;}catch{return 0;}}
async function recordEndlessRun(summary){
  writeLastEndlessRun(window.localStorage,summary);
  if(!endlessStatsEnabled||inSandbox()||!user||!profile)return {committed:false};
  const currentUser=user,version=sessionVersion;
  try{
    const result=await runTransaction(ref(db,`players/${currentUser.uid}`),current=>{
      if(!current||version!==sessionVersion)return undefined;
      return {...current,
        endlessRuns:Math.min(1000000,(current.endlessRuns||0)+1),
        endlessWaves:Math.min(10000000,(current.endlessWaves||0)+Math.max(0,summary.waves|0)),
        endlessBosses:Math.min(1000000,(current.endlessBosses||0)+Math.max(0,summary.bosses|0)),
        endlessBestSector:Math.max(current.endlessBestSector||0,Math.min(4,Math.max(0,summary.sector|0)))};
    },{applyLocally:false});
    return {committed:result.committed===true&&version===sessionVersion};
  }catch{/* Rules rejection or offline: stop asking for this session. */
    endlessStatsEnabled=false;return {committed:false};
  }
}
const endlessLauncher=featureEnabled('endlessMenu')?createEndlessLauncher({document,storage:window.localStorage,
  getRecord:endlessRecord,getBestWave:bestSoloWave,getLastRun:()=>readLastEndlessRun(window.localStorage),
  onDeploy:async theme=>{
    const version=sessionVersion,uid=user?.uid,control=gameControl,center=commandCenter;if(!uid||!control||!center)return;
    center.showBattle(true,'endless');let loaded=false;try{loaded=await control.chooseEndless(theme);}catch{/* Return to the menu below. */}
    // A late check from a previous login must not navigate a new user's game.
    if(accountTerminated||version!==sessionVersion||user?.uid!==uid||gameControl!==control)return;
    if(loaded)control.setMenuOpen(false);else center.showMenu();
  }}):null;
onLanguageChange(()=>endlessLauncher?.refreshLanguage?.());
bindDialogBackdrop($('endlessLaunch'),()=>{try{$('endlessLaunch').close();}catch{}});
// The rank is derived from the level on every snapshot - the combat profile
// strip gets its own paint, the menu card and the dossier re-render themselves.
function refreshProfileRank(value){
 const lvl=level((value??profile)?.xp||0);
 renderRankInsignia(document,document.getElementById('profileRank'),{level:lvl},{size:22});
}
function showProfile(value){updateSkillPrompt(value);profile=value;void refreshSoldierPortrait();$('profileName').textContent=value.name;$('profileLevel').textContent=levelText(value.xp);$('profileStats').textContent=translateText('HERO DAMAGE: {damage} / SHOT',{damage:10+Math.min(level(value.xp)-1,20)+2*parseBuild(value.skills,level(value.xp)).assault+(readArmory(value.armory).equipped===1?3:0)+webBonuses(parseBuild(profile.skills,level(value.xp))).damage});$('saveStatus').textContent='';display('game');if(featureEnabled('friends'))friendsUI.start();scoreReporter?.close();scoreReporter=featureEnabled('leaderboards')?createScoreReporter({service:createLeaderboardService({db,auth,sdk:{ref,get,onValue,runTransaction,query,orderByChild,limitToLast}}),getName:()=>profile?.name,onSuccess:()=>{$('scoreSaveStatus').textContent='';},onError:()=>{$('scoreSaveStatus').textContent=translateText('High score could not be saved yet; retrying.');}}):null;if(scoreReporter)releaseScoreReporters.add(scoreReporter);if(!gameStarted){gameStarted=true;gameControl=startGame(account,{confirmAction:confirmation.ask,reducedGraphics:settings.isReduced(),initialSettings:settings.snapshot(),leaveParty:()=>fourPanel?.isActive()?fourPanel.leaveParty():partyPanel.leaveParty(),onForceCloseParty:(id,tick)=>fourPanel?.forceCompleteParty(id,tick)??false,experimentalFourViewport:fourPlayerTest,experimentalWorkshop:featureEnabled('workshop'),deferTutorial:true,promptCenter,generalRadio,onReturnToCommand:()=>commandCenter?.showAfterEnd(),onResumeBattle:()=>commandCenter?.showBattle(),onRunFinished:()=>versionUI?.afterGame(),onTrainingComplete:()=>endingHandoffs.schedule({version:sessionVersion,id:user?.uid})});settings.apply();commandCenter=createCommandCenter({document,getProfile:()=>profile,getGame:()=>gameControl,isPartyActive:()=>partyPanel.isActive()||!!fourPanel?.isActive(),endlessLauncher,getPortrait:recruitPortraitUrl,onTutorial:openTutorialDossierDialog,onViewChange:view=>{syncContextBackButtons();const screen=$('gameWorkspace')?.dataset?.screen;const audioView=view==='workspace'?(screen==='lobby'?'menu':(screen==='online'?'online':'battle')):'menu';gameControl?.setView?.(audioView);if(view==='workspace'){menuTour?.dismiss?.();generalRadio?.stop?.();}},openParty:()=>{if($('fourPartyPanel').hidden)$('partyToggle').onclick();},closeParty:()=>{fourPanel?.hide();$('partyToggle').setAttribute('aria-expanded','false');},signOut:requestLogout});}else notifySession();commandCenter.showMenu();}
const attemptedSkillMigrations=new Set();
let skillMigrationSummary=null;
async function runSkillMigration(currentUser,version,snapshotValue){
 if(inSandbox()||!currentUser||!snapshotValue||!needsSkillMigration(snapshotValue))return;
 const attemptKey=`${currentUser.uid}:${version}:${snapshotValue.skills}`;
 if(attemptedSkillMigrations.has(attemptKey))return;
 attemptedSkillMigrations.add(attemptKey);
 const prep=migrateSkillsProfile(snapshotValue,{uid:currentUser.uid,storage:languageStorage});
 if(!prep.migrated||!prep.profile)return;
 try{
  const result=await runTransaction(ref(db,`players/${currentUser.uid}`),current=>{
   if(!current||!needsSkillMigration(current)||version!==sessionVersion||user?.uid!==currentUser.uid)return;
   return {...current,skills:prep.profile.skills};
  },{applyLocally:false});
  if(version!==sessionVersion||user?.uid!==currentUser.uid)return;
  if(result.committed){
   profile=result.snapshot.val();
   skillMigrationSummary=prep.summary;
   commandCenter?.render();soldierUI?.refresh();updateSkillPrompt(profile);
   if($('skillDialog')?.open)renderSkills();
   $('saveStatus').textContent=translateText('Skill points refunded for the new 6-class system.');
  }
 }catch{/* Rules or connection unavailable: parseBuild transparently handles legacy strings locally until the next save. */}
}
async function loadProfile(currentUser,version){
 const ready=await ensureActiveSession(currentUser,version);
 if(!ready||accountTerminated||version!==sessionVersion||auth.currentUser?.uid!==currentUser.uid)return;
 // The face, handed over to the server once per session (see avatar-sync.mjs):
 // soldiers from before the avatar field - or before rules that allow it - would
 // otherwise keep their face in this browser alone. The write is refused until
 // those rules are published; then it simply starts working, for every returning
 // soldier, without another client update. Built inside the listener, so the
 // write always goes to the account this listener belongs to.
 const avatarSync=createAvatarSync({
  write:values=>update(ref(db,`players/${currentUser.uid}`),values),
  storage:languageStorage,session:()=>sessionVersion});
 if(unsubscribe)unsubscribe();unsubscribe=onValue(ref(db,`players/${currentUser.uid}`),snap=>{if(version!==sessionVersion)return;const value=snap.val();if(!value){nameConflictHandler.reset();nameReserved=false;profile=null;display('character');return;}if(typeof value.name!=='string'||!['male','female'].includes(value.gender)||!Number.isInteger(value.xp)||value.xp<0){profile=null;display('connection');message('Your soldier data is invalid. Please contact support.');return;}const first=!profile;profile=value;updateSkillPrompt(value);
 // Accounts from before the service-date rework carry none; stamp one once.
 // If the rules are not live yet this fails silently and retries on the
 // next load - the service record shows the placeholder until then.
 if(!value.enlisted)update(ref(db,`players/${currentUser.uid}`),{enlisted:enlistmentDate()}).catch(()=>{});
 if(needsSkillMigration(value))void runSkillMigration(currentUser,version,value);
 else if(!skillMigrationSummary){const savedBackup=readLegacySkillBackup(currentUser.uid,languageStorage);if(savedBackup&&value.skills==='v2;none')skillMigrationSummary=summarizeSkillMigration({xp:value.xp,skills:savedBackup.skills});}
 // The same for the face. Every soldier who enlisted before the avatar field
 // existed - or before the rules accepted it - would keep the face in the local
 // mirror and nowhere else: no second device, no friend, no party roster could
 // ever show it. The decision is taken ONCE, from the first snapshot of the
 // session: a face that is removed later (cleanup, a purged field) is not
 // quietly written back, and a refused write is not an error.
 void avatarSync.sync(value);$('profileName').textContent=value.name;$('profileLevel').textContent=levelText(value.xp);refreshProfileRank(value);$('profileStats').textContent=translateText('HERO DAMAGE: {damage} / SHOT',{damage:10+Math.min(level(value.xp)-1,20)+2*parseBuild(value.skills,level(value.xp)).assault+(readArmory(value.armory).equipped===1?3:0)+webBonuses(parseBuild(value.skills,level(value.xp))).damage});// A face that arrives during the session - the hand-over above landing, or
 // another device choosing one - has to reach the dossier too, not just the
 // next reload. refreshSoldierPortrait recomposes only when the encoded face
 // really changed, and it runs before the menu repaints so the command center
 // shows the new face, not the previous one.
 if(first){showProfile(value);void backfillPrestige(value);if(featureEnabled('tutorial'))void startFirstRunTutorial();}else {void refreshSoldierPortrait();commandCenter?.render();soldierUI?.refresh();if(armoryCategory==='workshop')renderWorkshop();}
 if(first)void nameConflictHandler.reconcile(value.name,{alreadyReserved:nameReserved});},error=>{if(version!==sessionVersion)return;profile=null;display('connection');message(errorText(error));});}
const account={...(versionUI?{beforeNewGame}:{}),recordScore:(mode,wave)=>scoreReporter?.observe(mode,wave),recordEndlessRun,getProfile:()=>({...profile,loadout:encodeLoadout(profile?.armory)}),getUserId:()=>user?.uid,getSessionVersion:()=>sessionVersion,getToken:()=>{if(!user)throw new Error('Sign in required');return user.getIdToken();},getLevel:()=>level(profile?.xp||0),isReady:()=>!!profile&&!!user&&!deletingCharacter&&!nameConflictHandler.isActive(),onSessionChange:callback=>{notifySession=callback;},canChooseSolo:()=>!partyPanel.isActive()&&!fourPanel?.isActive(),saveCampaign:async(id)=>{if(inSandbox())return {committed:false};const currentUser=user,version=sessionVersion;if(!currentUser||!profile)return {committed:false};
  // A realtime-database transaction only settles once the server answers; while
  // offline it stays pending forever, and the results screen would sit on
  // "Saving mission progress…" with every button locked and no retry offered.
  // Race a watchdog so a stuck save fails with reason "timeout" instead.
  const settle=work=>Promise.race([work,new Promise(resolve=>setTimeout(()=>resolve('timeout'),12000))]);
  try{
   // Story progress and the mission's prestige trophy are written together, so a
   // finished mission can never grant one without the other.
   const outcome=await settle(runTransaction(ref(db,`players/${currentUser.uid}`),current=>completeStoryMission(current,id)??undefined,{applyLocally:false}));
   if(outcome==='timeout')return version===sessionVersion?{committed:false,reason:'timeout'}:{committed:false};
   const result=outcome;
   if(version!==sessionVersion)return {committed:false};
   // Reported: "Nach Abschluss der ersten Quest wird die zweite nicht
   // freigeschalten und die erste nicht abgeschlossen markiert." The write
   // committed, but the in-memory profile never learned about it: every board
   // and menu kept rendering the pre-mission account until a reload. The save
   // now adopts the committed snapshot the same way awardXP does, so the
   // mission board unlocks the next operation in the same session.
   if(result.committed){profile=result.snapshot.val();commandCenter?.render();}
   if(result.committed)return {committed:true,profile};
   // The transaction was rejected or aborted, but its snapshot is still the
   // freshest server state, so finish the save with a minimal patch of exactly
   // what completeStoryMission would change there. A live ruleset without the
   // story fields answers with permission-denied (reason "rejected") instead of
   // the generic "could not be confirmed", and a mission that is already
   // complete on the server adopts that state without writing anything.
   const current=result.snapshot.val(),next=completeStoryMission(current,id);
   if(!next)return {committed:false,reason:'locked'};
   const patch={};for(const key of Object.keys(next))if(JSON.stringify(next[key])!==JSON.stringify(current[key]))patch[key]=next[key];
   if(!Object.keys(patch).length){profile=next;commandCenter?.render();return {committed:true,alreadyComplete:true,profile:next};}
   const applied=await settle(update(ref(db,`players/${currentUser.uid}`),patch));
   if(applied==='timeout')return version===sessionVersion?{committed:false,reason:'timeout'}:{committed:false};
   if(version!==sessionVersion)return {committed:false};
   profile=next;commandCenter?.render();
   return {committed:true,profile:next};}catch(e){return {committed:false,reason:String(e?.code||e?.message||'').includes('permission')?'rejected':'error'};}},
 recordTutorialWave:wave=>{if(!inSandbox()&&user?.uid&&profile?.tutorial&&!profile.tutorial.missionCompleted)void tutorialSync.recordMissionStep(wave);},
 claimTutorialOutcome:async({victory=false,rewards=true,waves=1}={})=>{
  if(inSandbox()||!user?.uid||!profile)return {committed:false};
  if(rewards&&shouldPayTutorialReward(profile,rewards)){
   return await tutorialSync.claimReward({
    amount:0,
    wave:Math.max(1,waves|0),
    armoryRewardFn:armory=>armory,
    markMissionCompleted:true,
   });
  }
  return await tutorialSync.beginMenuTour(0);
 },
 awardXP:async (amount,wave,runId=null)=>{if(inSandbox())return {committed:false};const currentUser=user,version=sessionVersion;if(!currentUser||!profile||!Number.isInteger(wave)||wave<1||!Number.isSafeInteger(wave))return;$('saveStatus').textContent=translateText('Saving +{amount} XP and loot…',{amount});try{
  // Free tier: no paid backend. Campaign and every report without a run receipt
  // keep the legacy additive save. Endless solo with a receipt credits legacy
  // XP/loot, workshop rewards and the receipt in one transaction. If the
  // candidate rules are not deployed yet the write is rejected; the wave then
  // saves once with the legacy credit and this session stops sending receipts so
  // a missing receipt can never be replayed. Client-reported results, not anti-cheat.
  const fallback=workshopReceiptFallback;
  const outcome=await creditSoloWave({sdk:{runTransaction},profileRef:ref(db,`players/${currentUser.uid}`),amount,wave,runId:fallback?null:runId,rewardWave,subscribe:()=>new Promise((resolve,reject)=>{let stop;stop=onValue(ref(db,`players/${currentUser.uid}`),()=>resolve(stop||(()=>{})),reject);})});
  if(outcome.status==='error')throw outcome.error;
  if(version!==sessionVersion)return {committed:false};
  if(outcome.status==='legacy-fallback'||outcome.status==='already-credited'){if(outcome.status==='legacy-fallback')workshopReceiptFallback=true;$('saveStatus').textContent=translateText('Rewards saved. Some workshop rewards were rejected by the database rules.');}
  else $('saveStatus').textContent=outcome.committed?translateText('+{amount} XP and wave loot saved.',{amount}):translateText('XP and loot could not be saved.');
  return {committed:!!outcome.committed,confirmed:outcome.status==='already-credited',delta:outcome.committed?rewardDelta(outcome.before,outcome.after):null,profile:outcome.committed?outcome.after:null};
 }catch(e){if(version===sessionVersion)$('saveStatus').textContent=translateText('XP and loot could not be saved. Check your connection and database rules.');return {committed:false};}}};
let draftSkills=null,selectedSkill={path:'assault',rank:1},openedSkills='',savingSkills=false,savingArmory=false,closingSkills=false,skillsOpenGeneration=0;
// This is intentionally conservative. A pending Firebase promise, retrying
// leaderboard/reward queue, failed report, active party or open dialog prevents
// automatic reload. It describes this document only, not other devices/tabs.
function normalReleaseSafety(){
 if(partyActivity()||gameControl?.isOnlineMatch?.())return 'party';
 // Never discard an in-progress authentication, profile load or account form.
 // Recruitment also includes avatar choices that are not just a text input.
 if(sessionTransition||pendingStartChecks.size||!$('loading').hidden||$('authSubmit').disabled||$('forgot').disabled)return 'saving';
 if(!$('characterView').hidden||(!$('authView').hidden&&['email','password','passwordConfirm'].some(id=>$(id).value)))return 'form';
 const gameState=gameControl?.releaseSafety?.()??'ready';
 if(gameState!=='ready')return gameState;
 if(!releaseWrites.isIdle()||[...releaseRewardQueues].some(queue=>!queue.isSettled())||
    [...releaseScoreReporters].some(reporter=>!reporter.isSettled())||
    savingSkills||savingArmory||deletingCharacter||deletionPending||workshopPrepare||
    workshopAccount.isBusy()||friendsUI.hasPending())return 'saving';
 // The rest card is not a form: it holds nothing a reload could lose, and it
 // comes back on its own after one, because the notice lives in sessionStorage.
 // Blocking the reload on it would leave the player on an old build until they
 // happened to dismiss the picture.
 if(pendingFirstRuns.size||endingHandoffs.isPending()||endingRunning||tutorialDossier?.isOpen?.()||nameConflictHandler.isActive()||document.querySelector('dialog[open]:not(#afkRestDialog)'))return 'dialog';
 return 'ready';
}
releaseSafety=()=>afkTransition?'saving':normalReleaseSafety();
const AFK_NOTICE_KEY='ironpath:afk-signed-out';
function afkNotice(value){try{
 if(value===true)window.sessionStorage.setItem(AFK_NOTICE_KEY,'1');
 else if(value===false)window.sessionStorage.removeItem(AFK_NOTICE_KEY);
 else return window.sessionStorage.getItem(AFK_NOTICE_KEY)==='1';
}catch{}return false;}
const afkText=(en,de)=>getLanguage()==='de'?de:en;
function renderAfkText(){
 $('afkSessionStatus').textContent=afkText('Signing out after inactivity…','Abmeldung wegen Inaktivität…');
 if($('afkFailureKicker'))$('afkFailureKicker').textContent=afkText('FIELD SECURITY','SITZUNGSSCHUTZ');
 $('afkFailureTitle').textContent=afkText('Session protection unavailable','Sitzungsschutz nicht verfügbar');
 $('afkFailureDetail').textContent=afkText('The browser could not protect the shared session. Reload the game before continuing.','Der Browser konnte die gemeinsame Sitzung nicht schützen. Lade das Spiel neu, bevor du fortfährst.');
 $('afkSessionReload').textContent=afkText('RELOAD GAME','SPIEL NEU LADEN');
}
// Half an hour away and the session is closed. That deserves the field's own
// painted shelter scene instead of plain placeholder text: the soldier resting
// beside the lit lantern. Dismissing the card leaves the player on the sign-in
// screen behind it and clears the notice so language changes cannot reopen it.
function paintAfkRestCard(){
 $('afkRestKicker').textContent=afkText('FIELD BREAK','PAUSE IM FELD');
 $('afkRestTitle').textContent=afkText('You were signed out','Du wurdest abgemeldet');
 $('afkRestText').textContent=afkText('You were signed out after 30 minutes of inactivity. Sign in to continue.','Du wurdest nach 30 Minuten Inaktivität abgemeldet. Melde dich erneut an.');
 $('afkRestAccept').textContent=afkText('BACK TO SIGN IN','ZUR ANMELDUNG');
}
function showAfkRestCard(){
 paintAfkRestCard();
 try{
  const art=$('afkRestArt');
  if(art?.getContext){
   const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   drawAfkRestScene(art,{scale:Math.min(2,window.devicePixelRatio||1),reducedMotion:reduced});
  }
 }catch{/* A card without its picture is still a card with the right words. */}
 const dialog=$('afkRestDialog');if(dialog&&!dialog.open)dialog.showModal?.();
}
onLanguageChange(()=>{renderAfkText();if($('afkRestDialog')?.open)paintAfkRestCard();});renderAfkText();
// The card is an event, not a text render: it opens once the sign-out is over,
// and again after a reload (the notice lives in sessionStorage). Never from
// inside the sign-out itself - that is the moment the page is held inert and a
// version probe is still to come.
function maybeShowAfkCard(){if(afkNotice()&&!user&&!auth.currentUser)showAfkRestCard();}
maybeShowAfkCard();
$('afkRestAccept').onclick=()=>{try{$('afkRestDialog').close();}catch{}afkNotice(false);try{$('email').focus();}catch{}};
$('afkSessionFailure').addEventListener('cancel',event=>event.preventDefault());
$('afkSessionReload').onclick=()=>window.location.reload();
async function signOutAfterIdle({stillIdle}){
 if(!sessionTabLock?.isHeld()||!stillIdle())return;
 const oldAuth=auth.currentUser,wasInert=document.documentElement.inert;
 if(!oldAuth||oldAuth.uid!==user?.uid)return;
 afkTransition=true;document.documentElement.inert=true;$('afkSessionStatus').hidden=false;
 try{
  await sessionTabLock.runIfAlone(async()=>{
   // Another document may have opened while our shared lock was released. The
   // exclusive lock, unchanged auth object, input clock and safety are all
   // checked again immediately before calling Firebase signOut.
   if(!stillIdle()||auth.currentUser!==oldAuth||accountTerminated||releaseFrozen)return;
   afkNotice(true);
   await releaseActiveSession({removeRemote:true});
   try{await accountServices.logout();}catch{
    afkNotice(false);
    if(auth.currentUser===oldAuth&&!accountTerminated&&!releaseFrozen)void startAuthenticatedSession(oldAuth,sessionVersion);
    return;
   }
   if(auth.currentUser){afkNotice(false);return;}
   for(const id of ['email','password','passwordConfirm'])$(id).value='';
   renderAfkText();
   // This is a new network version check after logout. The existing coordinator
   // reloads only if a newer build is confirmed and every safety check passes.
   await versionUI?.beforeGame();
  });
 }finally{
  afkTransition=false;$('afkSessionStatus').hidden=true;
  if(!accountTerminated&&!releaseFrozen){
   document.documentElement.inert=wasInert;
   maybeShowAfkCard();
   if(!sessionTabLock.isHeld()){
    // Never continue as an unprotected cooperating tab after a lock failure.
    releaseFrozen=true;document.documentElement.inert=false;
    if(!$('afkSessionFailure').open)$('afkSessionFailure').showModal();
   }
  }
 }
}
beforeVersionReload=()=>{
 // Called only after safety() and a fresh version check. Block new user input
 // synchronously; the old RTDB instance must not queue new work during navigation.
 releaseFrozen=true;document.documentElement.inert=true;
 try{goOffline(db);}catch{}
 try{void friendsUI.signOut();}catch{}
 try{scoreReporter?.close();}catch{}
 try{gameControl?.stopForRelease?.();}catch{}
};
// A maintenance closure is different from an ordinary update: stop this page
// immediately, even mid-match, and never reuse its RTDB queue after sign-out.
// Server Rules, not this teardown, deny data access while maintenance is closed.
let accountTerminated=false;
function stopAccountForRelease(){
 if(accountTerminated)return;releaseFrozen=true;accountTerminated=true;sessionVersion++;profile=null;user=null;hostPartySignOut?.reset();cancelStartChecks();
 afkTimer?.stop();sessionTabLock?.stop();void releaseActiveSession({removeRemote:false});
 const stop=fn=>{try{const result=fn();if(result&&typeof result.then==='function')void Promise.resolve(result).catch(()=>{});}catch{}};
 const oldWatch=unsubscribe;unsubscribe=null;
 stop(()=>oldWatch?.());stop(()=>scoreReporter?.close());scoreReporter=null;
 stop(()=>gameControl?.stopForRelease());stop(()=>notifySession());
 stop(()=>cancelFirstRunEnding());
 stop(()=>leaderboardUI.reset());stop(()=>friendsUI.signOut());stop(()=>nameConflictHandler.reset());nameReserved=false;stop(()=>confirmation.cancel());stop(()=>soldierUI?.close());
 stop(()=>partyPanel.reset());stop(()=>partyPanel.collapse());stop(()=>fourPanel?.leaveForLogout(0));
 stop(()=>{for(const dialog of document.querySelectorAll('dialog[open]'))try{dialog.close();}catch{}});
 stop(()=>{$('password').value='';$('gameView').hidden=true;$('entry').hidden=true;});
}
function haltForMaintenance(reason){
 if(accountTerminated||!maintenanceUI)return;
 // Freeze new writes before disconnecting. Already queued/in-flight operations
 // may be unconfirmed; no timeout can cancel them. The Rules are the fence.
 releaseFrozen=true;versionUI?.stop();try{goOffline(db);}catch{}
 stopAccountForRelease();let signedOut;try{signedOut=accountServices.logout();}catch{signedOut=Promise.resolve();}
 maintenanceUI.halt(reason,signedOut);
}
if(accountServices.signal){
 accountServices.signal.addEventListener('abort',stopAccountForRelease,{once:true});
 if(accountServices.signal.aborted)stopAccountForRelease();
}
if(maintenanceUI&&!accountTerminated)createMaintenanceMonitor({
 initial:maintenanceControl,
 subscribe:(accept,fail)=>onValue(ref(db,MAINTENANCE_PATH),snapshot=>accept(snapshot.val()),fail),
 onHalt:haltForMaintenance
});
if(!accountTerminated&&sessionTabLock?.isHeld()){
 afkTimer=createAfkTimer({document,window,
  session:()=>user&&profile&&!accountTerminated&&!releaseFrozen?sessionVersion:null,
  safety:normalReleaseSafety,onExpire:signOutAfterIdle});
 afkTimer.start();
}
function applyBlockedAuthUi(kind,{email=''}={}){
 releaseFrozen=false;
 if(email&&$('email')&&!$('email').value)$('email').value=email;
 $('password').value='';
 display('auth');
 renderAfkText();
 if(kind==='occupied')message(SESSION_OCCUPIED_MESSAGE);
 else if(kind==='taken-over')message(SESSION_TAKEN_OVER_MESSAGE);
 if($('sessionTakeoverField'))$('sessionTakeoverField').hidden=kind!=='occupied';
 if($('sessionTakeoverCheck'))$('sessionTakeoverCheck').checked=false;
}
async function handleSessionTakenOver(takenUser,version,newHolder){
 if(accountTerminated||version!==sessionVersion||auth.currentUser?.uid!==takenUser.uid)return;
 releaseFrozen=true;sessionVersion++;const myVersion=sessionVersion;
 activeSession=null;profile=null;user=null;hostPartySignOut?.reset();cancelStartChecks();cancelFirstRunEnding();
 const stop=fn=>{try{const result=fn();if(result&&typeof result.then==='function')void Promise.resolve(result).catch(()=>{});}catch{}};
 const oldWatch=unsubscribe;unsubscribe=null;
 stop(()=>oldWatch?.());stop(()=>scoreReporter?.close());scoreReporter=null;
 stop(()=>notifySession());stop(()=>leaderboardUI.reset());stop(()=>friendsUI.signOut());stop(()=>nameConflictHandler.reset());nameReserved=false;stop(()=>confirmation.cancel());stop(()=>soldierUI?.close());
 stop(()=>partyPanel.reset());stop(()=>partyPanel.collapse());stop(()=>fourPanel?.leaveForLogout(0));
 stop(()=>{for(const dialog of document.querySelectorAll('dialog[open]'))try{dialog.close();}catch{}});
 stop(()=>{$('password').value='';});
 const sameBrowser=await sameBrowserMonitor.hasHolder(newHolder?.clientId);
 sameBrowserMonitor.release();
 if(accountTerminated||myVersion!==sessionVersion)return;
 if(sameBrowser){
  applyBlockedAuthUi('taken-over');
  return;
 }
 pendingConflictNotice='taken-over';
 try{await accountServices.logout();}catch{
  if(!accountTerminated&&myVersion===sessionVersion){
   releaseFrozen=false;
   display('connection');
   message(SESSION_TAKEN_OVER_MESSAGE);
  }
 }
}
async function ensureActiveSession(currentUser,version){
 if(accountTerminated||version!==sessionVersion||auth.currentUser?.uid!==currentUser.uid)return false;
 const takeover=pendingSessionTakeover;pendingSessionTakeover=false;
 if(activeSession&&(activeSession.isClaimed()||activeSession.isUnsupported())&&user?.uid===currentUser.uid)return true;
 setLoadingStep('session');
 sameBrowserMonitor.claim();
 const manager=createActiveSessionManager({
  db,sdk:sessionSdk,uid:currentUser.uid,clientId:clientSessionId,
  onTakeover:entry=>void handleSessionTakenOver(currentUser,version,entry)
 });
 activeSession=manager;
 const outcome=await manager.acquire({takeover});
 if(accountTerminated||version!==sessionVersion||auth.currentUser?.uid!==currentUser.uid||activeSession!==manager){
  sameBrowserMonitor.release();
  void manager.release({removeRemote:false});
  return false;
 }
 if(outcome.status==='occupied'){
  if(activeSession===manager)activeSession=null;
  sameBrowserMonitor.release();
  void manager.release({removeRemote:false});
  const sameBrowser=await sameBrowserMonitor.hasHolder(outcome.holder?.clientId);
  if(accountTerminated||version!==sessionVersion||auth.currentUser?.uid!==currentUser.uid)return false;
  if(sameBrowser){
   applyBlockedAuthUi('occupied',{email:currentUser.email||''});
   return false;
  }
  pendingConflictNotice='occupied';
  $('password').value='';
  try{await accountServices.logout();}catch{
   if(!accountTerminated&&version===sessionVersion){
    display('connection');
    message(SESSION_OCCUPIED_MESSAGE);
   }
  }
  return false;
 }
 if(outcome.status==='error'){
  if(activeSession===manager)activeSession=null;
  sameBrowserMonitor.release();
  void manager.release({removeRemote:false});
  display('connection');
  message(errorText(outcome.error));
  return false;
 }
 if($('sessionTakeoverField'))$('sessionTakeoverField').hidden=true;
 if($('sessionTakeoverCheck'))$('sessionTakeoverCheck').checked=false;
 user=currentUser;notifySession();
 const uid=currentUser.uid;
 setTimeout(()=>{if(auth.currentUser?.uid===uid)$('password').value='';},1500);
 setLoadingStep('soldier');
 return true;
}
function activateSignedInUser(currentUser,version){
 afkNotice(false);display('loading');setLoadingStep('soldier');
 const activate=()=>{pendingSessionTakeover=forceSessionTakeover;forceSessionTakeover=false;if(!accountTerminated&&version===sessionVersion&&auth.currentUser?.uid===currentUser.uid)loadProfile(currentUser,version);};
 // The initial cutoff of zero preserves existing sessions at first rollout.
 // After a maintenance reopening, inspect the token's *authentication* time,
 // not its refresh time, before listening to the profile. Rules check it too.
 if(!maintenanceControl||maintenanceControl.authAfterMs===0){activate();return;}
 let timer;const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Token check timed out')),8000);});
 void Promise.race([Promise.resolve().then(()=>currentUser.getIdTokenResult()),timeout]).then(token=>{
  clearTimeout(timer);if(accountTerminated||version!==sessionVersion||auth.currentUser?.uid!==currentUser.uid)return;
  if(!isSessionAfterCutoff(token?.claims?.auth_time,maintenanceControl.authAfterMs))haltForMaintenance('session');else activate();
 },()=>{clearTimeout(timer);if(!accountTerminated&&version===sessionVersion)haltForMaintenance('unavailable');});
}
if(!accountTerminated)accountServices.observe(currentUser=>{
 if(accountTerminated)return;
 hostPartySignOut?.reset();
 const showDischarge=dischargeSignOut.observe(currentUser);
 afkTimer?.reset();
 cancelStartChecks();cancelFirstRunEnding();const fieldSchool=$('fieldSchool');if(fieldSchool)fieldSchool.hidden=true;
 deletingCharacter=false;nameReserved=false;nameConflictHandler.reset();scoreReporter?.close();scoreReporter=null;$('scoreSaveStatus').textContent='';leaderboardUI.reset();friendsUI.signOut();savingSkills=false;savingArmory=false;closingSkills=false;skillsOpenGeneration++;$('skillSave').disabled=false;$('skillReset').disabled=false;confirmation.cancel();closeMenuDialogs();passwordChange?.reset();soldierUI.close();workshopPrepareFailed=false;partyPanel.reset();partyPanel.collapse();if(fourPanel?.isActive()||fourPanel?.isBusy())void fourPanel.leaveForLogout();sessionVersion++;const version=sessionVersion;if(unsubscribe){unsubscribe();unsubscribe=null;}profile=null;user=null;notifySession();message('');
 if(!currentUser){
  releaseFrozen=false;pendingSessionTakeover=false;
  void releaseActiveSession({removeRemote:false});
  $('password').value='';display('auth');renderAfkText();
  const conflict=pendingConflictNotice;pendingConflictNotice=null;
  if(showDischarge)message(DISCHARGE_MESSAGE);
  else if(conflict==='occupied')message(SESSION_OCCUPIED_MESSAGE);
  else if(conflict==='taken-over')message(SESSION_TAKEN_OVER_MESSAGE);
  if($('sessionTakeoverField'))$('sessionTakeoverField').hidden=conflict!=='occupied';
  if($('sessionTakeoverCheck'))$('sessionTakeoverCheck').checked=false;
  return;
 }
 void releaseActiveSession({removeRemote:false});
 activateSignedInUser(currentUser,version);
},error=>{if(!accountTerminated){display('auth');message(errorText(error));}});

function canEditSkills(){return !!profile&&!partyPanel.isActive()&&!fourPanel?.isActive()&&!!gameControl&&(gameControl.canEditSkills()||!$('commandCenter').hidden);}
function renderSkills(){
  const activeProfile=viewProfile();
  if(!activeProfile)return;
  const lvl=level(activeProfile.xp),left=pointsLeft(draftSkills,lvl),chosenClass=draftSkills.classId||null;
  const effectivePath=chosenClass||selectedSkill.path;
  const index=SKILL_PATHS.findIndex(p=>p.id===effectivePath),path=SKILL_PATHS[index<0?0:index],rank=selectedSkill.rank,specialist=rank>=5&&rank<100;
  if(chosenClass&&selectedSkill.path!==chosenClass){selectedSkill={path:chosenClass,rank:1};}
  document.querySelectorAll('[data-skill-path]').forEach(button=>{
    const btnPath=button.dataset.skillPath;
    if(chosenClass)button.hidden=btnPath!==chosenClass;
    else button.hidden=false;
    button.setAttribute('aria-pressed',String(btnPath===(chosenClass||$('skillPathFilter').value)));
  });
  const filterWrap=document.querySelector?.('.skills-filter');
  if(filterWrap)filterWrap.hidden=!chosenClass;
  const noticeEl=$('skillMigrationNotice');
  if(noticeEl){
    const hasMigration=!inSandbox()&&typeof skillMigrationSummary==='object'&&skillMigrationSummary!==null&&!!skillMigrationSummary.hadLegacy&&draftSkills.classId===null&&draftSkills.rank===0;
    noticeEl.hidden=!hasMigration;
    if(hasMigration)noticeEl.textContent=translateText('Your previous skill build was archived and all {points} earned skill points were refunded for free selection in the new 6-class tree.',{points:skillMigrationSummary.refundedPoints});
  }
  $('skillPoints').textContent=translateText(left===1?'LEVEL {level} · {points} POINT AVAILABLE':'LEVEL {level} · {points} POINTS AVAILABLE',{level:lvl,points:left});
  const summary=localizeSkillSummary(skillBuildSummary(draftSkills,lvl),translateText);$('skillSummaryActive').textContent=summary.active;$('skillSummaryStats').textContent=summary.values.join('\n');$('skillSummaryCombos').textContent=summary.combos;$('skillSummaryCaps').textContent=summary.caps;
  if(!savingSkills)$('skillStatus').textContent=translateText(encodeBuild(draftSkills)===openedSkills?'Saved build unchanged.':'Unsaved draft — save to apply; closing discards these changes.');

  const workspace=$('skillDialog').querySelector?.('.skills-workspace');
  const scroll=$('skillDialog').scrollTop,wsScroll=workspace?.scrollTop,restoreActionFocus=document.activeElement===$('skillDetailAction');
  renderSkillTree({document,container:$('skillPaths'),build:draftSkills,level:lvl,selected:selectedSkill,filter:$('skillFilter').value,pathFilter:chosenClass||'all',inspector:$('skillInspector'),inspectorHome:$('skillInspectorHome'),translate:translateText,onSelect:(value,keyboard)=>{const selector=`[data-path="${value.path}"][data-rank="${value.rank}"]`,previous=$('skillPaths').querySelector(selector)?.getBoundingClientRect().top;selectedSkill=value;renderSkills();const current=$('skillPaths').querySelector(selector);if(current&&Number.isFinite(previous)){const delta=current.getBoundingClientRect().top-previous;$('skillDialog').scrollTop+=delta;if(workspace)workspace.scrollTop+=delta;}if(keyboard)current?.focus({preventScroll:true});}});
  if(restoreActionFocus)$('skillDetailAction').focus({preventScroll:true});
  if(Number.isFinite(scroll))$('skillDialog').scrollTop=scroll;
  if(workspace&&Number.isFinite(wsScroll))workspace.scrollTop=wsScroll;
  const action=$('skillDetailAction');
  if(!chosenClass){
    $('skillDetailType').textContent=translateText('CLASS SELECTION');
    $('skillDetailTitle').textContent=`${translateText(path.name)} — ${translateText(path.ability)}`;
    $('skillDetailText').textContent=`${translateText(path.description)} ${translateText(path.passive)}. ${translateText('Choosing a class locks in its 14-node specialization tree and class tower path. Use Reset Draft to preview another class before saving.')}`;
    action.textContent=translateText(lvl<2?'UNLOCKS AT LEVEL 2':!left?'NO POINTS AVAILABLE':'CHOOSE CLASS · 1 POINT');
    action.disabled=savingSkills||lvl<2||left<1;
    action.onclick=()=>{if(savingSkills||lvl<2||left<1)return;draftSkills=parseBuild(`v2;${path.id};1;0;00000000000000`,lvl);selectedSkill={path:path.id,rank:1};renderSkills();};
    return;
  }
  if(rank>=100){
    const node=WEB_NODES.find(n=>n.id===rank-100);if(!node)return;
    const unlocked=!!draftSkills.extra?.[node.slot],ready=webReady(draftSkills,node);
    $('skillDetailType').textContent=translateText(node.kind==='doctrine'?'SPECIALIST DOCTRINE':node.kind==='combo'?'CLASS COMBO':node.tier===4?'MASTERY CAPSTONE':'ADVANCED MASTERY');
    $('skillDetailTitle').textContent=translateText(node.name);
    $('skillDetailText').textContent=`${translateText(node.description)} ${translateText(webRequirement(node))} ${translateText('Each node costs one point.')}`;
    action.textContent=translateText(unlocked?'UNLOCKED':!ready?'PREREQUISITES REQUIRED':!left?'NO POINTS AVAILABLE':'UNLOCK · 1 POINT');
    action.disabled=savingSkills||unlocked||!ready||!left;
    action.onclick=()=>{if(!savingSkills&&!draftSkills.extra?.[node.slot]&&webReady(draftSkills,node)&&pointsLeft(draftSkills,level(activeProfile.xp))>0){draftSkills.extra[node.slot]=1;draftSkills.web[node.id]=1;renderSkills();}};
    return;
  }
  $('skillDetailType').textContent=rank===1?translateText('MAIN SKILL'):`${translateText(path.name).toUpperCase()} / ${translateText(specialist?'SPECIAL SKILL':'PASSIVE')}`;
  $('skillDetailTitle').textContent=rank===1?translateText(path.ability):specialist?translateText(path.branches[rank-5].ability):translateText('{name} · Rank {rank}',{name:translateText(path.name),rank});
  $('skillDetailText').textContent=rank===1?`${translateText(path.description)} ${translateText(path.passive)}. ${translateText('Unlocked main skills can be selected for free.')}`:specialist?`${translateText(path.branches[rank-5].abilityDescription)} ${translateText('Passive: {text} Requires {name} rank 2. Selecting it replaces your current active skill.',{text:translateText(path.branches[rank-5].description),name:translateText(path.name)})}`:`${translateText(path.passive)}. ${translateText('Requires {name} rank {rank}. {count} of 3 ranks unlocked.',{name:translateText(path.name),rank:rank-1,count:draftSkills.rank})}`;
  if(specialist){
    const slot=rank-5,unlocked=!!draftSkills.extra[slot],ready=draftSkills.rank>=2,selected=unlocked&&draftSkills.active===path.id&&draftSkills.variant===slot+1;
    action.textContent=translateText(selected?'SPECIAL SKILL SELECTED':unlocked?'SELECT SPECIAL SKILL':!ready?'REQUIRES RANK 2':!left?'NO POINTS AVAILABLE':'UNLOCK & SELECT · 1 POINT');
    action.disabled=savingSkills||selected||(!unlocked&&(!ready||!left));
    action.onclick=()=>{if(savingSkills)return;if(!draftSkills.extra[slot]){if(draftSkills.rank<2||pointsLeft(draftSkills,level(activeProfile.xp))<1)return;draftSkills.extra[slot]=1;const specNode=WEB_NODES.find(n=>n.path===path.id&&n.slot===slot);if(specNode)draftSkills.web[specNode.id]=1;}draftSkills.active=path.id;draftSkills.variant=slot+1;renderSkills();};
  }else if(rank===1){
    const selected=draftSkills.active===path.id&&!draftSkills.variant;
    action.textContent=translateText(selected?'MAIN SKILL SELECTED':'SELECT MAIN SKILL');
    action.disabled=savingSkills||selected;
    action.onclick=()=>{if(savingSkills)return;draftSkills.active=path.id;draftSkills.variant=0;renderSkills();};
  }else{
    const unlocked=rank<=draftSkills.rank,next=rank===draftSkills.rank+1;
    action.textContent=translateText(unlocked?'UNLOCKED':!next?'UNLOCK PREVIOUS RANK':!left?'NO POINTS AVAILABLE':'UPGRADE · 1 POINT');
    action.disabled=savingSkills||unlocked||!next||!left;
    action.onclick=()=>{if(!savingSkills&&rank===draftSkills.rank+1&&pointsLeft(draftSkills,level(activeProfile.xp))>0){draftSkills.rank++;draftSkills[path.id]=draftSkills.rank;renderSkills();}};
  }
}
document.querySelectorAll('[data-skill-path]').forEach(button=>{button.onclick=()=>{ $('skillPathFilter').value=button.dataset.skillPath; if(button.dataset.skillPath!=='all')selectedSkill={path:button.dataset.skillPath,rank:1}; $('skillPaths').scrollTop=0;renderSkills(); };});
$('skillFilter').onchange=()=>renderSkills();$('skillPathFilter').onchange=()=>renderSkills();
$('skillOpen').onclick=()=>{if(!inSandbox()&&!canEditSkills()){$('saveStatus').textContent=translateText('Return to the Command Center to edit skills between deployments, or leave your party first.');return;}syncContextBackButtons();skillsOpenGeneration++;draftSkills=parseBuild(viewProfile().skills,level(viewProfile().xp));openedSkills=encodeBuild(draftSkills);selectedSkill={path:draftSkills.classId||'assault',rank:1};$('skillFilter').value='all';$('skillPathFilter').value=draftSkills.classId||'all';renderSkills();$('skillDialog').showModal();$('skillPaths').scrollLeft=0;$('skillPaths').scrollTop=0;};
$('skillReset').onclick=async()=>{if(inSandbox()){draftSkills=parseBuild(undefined,level(viewProfile().xp));selectedSkill={path:'assault',rank:1};renderSkills();return;}if(!canEditSkills()||savingSkills)return;const version=sessionVersion;if(await confirmation.ask({title:'Reset draft skill points?',text:'This refunds every point for free in this draft, letting you choose another class too. Your saved build will only change if you press Save Build. Close the skill tree without saving to keep it.',accept:'RESET DRAFT'})&&version===sessionVersion&&$('skillDialog').open&&canEditSkills()&&!savingSkills){draftSkills=parseBuild(undefined,level(profile.xp));selectedSkill={path:'assault',rank:1};renderSkills();}};
async function closeSkills(){
  if(!$('skillDialog').open||savingSkills||closingSkills)return;
  if(encodeBuild(draftSkills)===openedSkills){$('skillDialog').close();return;}
  const version=sessionVersion,opened=skillsOpenGeneration,draft=encodeBuild(draftSkills);closingSkills=true;
  try{const discard=await confirmation.ask({title:'Discard skill changes?',text:'Your unsaved skill changes will be lost. Keep editing or discard them.',accept:'DISCARD CHANGES'});
    if(discard&&version===sessionVersion&&opened===skillsOpenGeneration&&$('skillDialog').open&&!savingSkills&&encodeBuild(draftSkills)===draft)$('skillDialog').close();
  }finally{if(version===sessionVersion&&opened===skillsOpenGeneration)closingSkills=false;}
}
$('skillCancel').onclick=closeSkills;
$('skillDialog').addEventListener('cancel',event=>{event.preventDefault();void closeSkills();});
bindDialogBackdrop($('skillDialog'),()=>void closeSkills());
$('skillSave').onclick=async()=>{
  // Sandbox: the draft is applied to the sample soldier so the tour can teach the
  // real gesture. The player's own build is never touched.
  if(inSandbox()){
    const build=encodeBuild(draftSkills);
    sandboxAPI.apply({...viewProfile(),skills:build});
    sandboxAPI.markSkill({upgraded:build!=='v2;none'&&pointsLeft(draftSkills,level(viewProfile().xp))===0,saved:true});
    gameControl?.playCue?.('uiConfirm');
    $('skillStatus').textContent=translateText('Sample data: your real build is unchanged.');
    $('skillDialog').close();
    return;
  }
  if(!canEditSkills()){gameControl?.playCue?.('uiError');$('skillStatus').textContent=translateText('Leave the party and finish the match before changing skills.');return;}
  if(savingSkills)return;const currentUser=user,version=sessionVersion,build=encodeBuild(draftSkills),expected=openedSkills;savingSkills=true;$('skillSave').disabled=true;$('skillReset').disabled=true;$('skillDetailAction').disabled=true;$('skillStatus').textContent=translateText('Saving…');
  try{
    const result=await runTransaction(ref(db,`players/${currentUser.uid}`),current=>{
      if(!canSaveSkillDraft(current,expected,build,level))return;
      return {...current,skills:build};
    },{applyLocally:false});
    if(version!==sessionVersion||user?.uid!==currentUser.uid)return;
    if(!result.committed){gameControl?.playCue?.('uiError');$('skillStatus').textContent=translateText('Could not save: your saved build may have changed elsewhere, or this draft is no longer valid. Close and reopen Skills to reload it.');return;}
    profile=result.snapshot.val();skillMigrationSummary=null;commandCenter?.render();$('skillDialog').close();if(gameControl?.canEditSkills())gameControl.resetSkills();updateSkillPrompt(profile);gameControl?.playCue?.('uiConfirm');$('saveStatus').textContent=translateText('Skill build saved for the next match.');
  }catch(error){if(version===sessionVersion){gameControl?.playCue?.('uiError');$('skillStatus').textContent=translateText('Could not save skills. Check your connection and Firebase rules.');}}
  finally{if(version===sessionVersion){savingSkills=false;$('skillSave').disabled=false;$('skillReset').disabled=false;if($('skillDialog').open){const message=$('skillStatus').textContent;renderSkills();$('skillStatus').textContent=message;}}}
};

const armoryTabs=[['armoryEquipmentTab','equipment'],['armoryWorkshopTab','workshop'],['armoryDefensesTab','defenses'],['armoryServiceTab','service']];
// The workshop is prepared the first time the player opens its tab, through the
// same guarded account service the rest of the workshop uses. Nothing is written
// until then, so a player who never opens it keeps exactly today's save, and a
// rejected write (server rules not updated yet) leaves the account untouched.
async function prepareWorkshop(){
  if(inSandbox())return {status:'sandbox'};
  if(!profile||!user)return {status:'signed-out'};
  if(Object.hasOwn(profile,'workshop'))return {status:'ready'};
  // One attempt per session: re-rendering the tab must not retry the write.
  if(workshopPrepareFailed)return {status:'failed'};
  if(workshopPrepare)return workshopPrepare;
  const version=sessionVersion;
  $('armoryStatus').textContent=translateText('Preparing your workshop…');
  const settle=(status,error)=>{
    if(version!==sessionVersion)return {status:'cancelled'};
    if(status==='rejected'){workshopPrepareFailed=true;$('armoryStatus').textContent=translateText('Your saved equipment cannot be prepared for the workshop. Nothing was changed; the rest of the Armory still works.');return {status:'unchanged'};}
    if(status==='locked'){$('armoryStatus').textContent=translateText('Finish the match and leave the party before changing gear.');return {status:'locked'};}
    const rejected=/permission|denied/i.test(String(error?.code||error?.message||''));
    if(rejected)workshopPrepareFailed=true;
    if(rejected)$('armoryStatus').textContent=translateText('The workshop is not switched on for this account yet. Nothing was changed; the rest of the Armory still works.');
    else $('armoryStatus').textContent=translateText('Your workshop could not be prepared yet. Check your connection and try again.');
    return {status:'failed'};
  };
  workshopPrepare=workshopAccount.initialize()
    .then(result=>{
      if(result.status==='saved'){
        if(version!==sessionVersion)return {status:'cancelled'};
        profile=result.profile;commandCenter?.render();soldierUI?.refresh();
        $('armoryStatus').textContent=translateText('Workshop ready.');
        return {status:'ready'};
      }
      return settle(result.status,result.error);
    })
    .catch(error=>settle('error',error))
    .finally(()=>{workshopPrepare=null;if(armoryCategory==='workshop')renderWorkshop();});
  return workshopPrepare;
}
// A player who finished missions before trophies existed keeps what the campaign
// already proved: the missing trophies are added through the same guarded account
// transaction, once per sign-in, and only for completed missions.
async function backfillPrestige(value){
  if(inSandbox()||!user||!value||!Object.hasOwn(value,'workshop'))return;
  const currentUser=user,version=sessionVersion;
  const owed=missingPrestige(value,decodeWorkshopSafe(value.workshop));
  if(!owed.length)return;
  try{
   const result=await workshopAccount.sync();
   if(version!==sessionVersion||user?.uid!==currentUser.uid)return;
   if(result.status==='saved'){profile=result.profile;commandCenter?.render();soldierUI?.refresh();if(armoryCategory==='workshop')renderWorkshop();}
  }catch{}
}
// --- Tutorial sandbox API -------------------------------------------------------
// The tutorial opens the REAL dialogs against an example soldier. `enter` builds a
// throwaway profile (never saved), `leave` restores the real one. Every write path
// is already refused while `sandbox` is set, so this cannot touch a save.
const SANDBOX_SCRAP=240;
function exampleProfile(base){
  // A fresh level 2 soldier: one point to spend, nothing unlocked. Practice has to
  // teach the first skill point, so it must not inherit a build that already has one.
  const example={...(base||{name:'Example Soldier',gender:'male',xp:0}),xp:300,skills:'v2;none',armory:{scrap:SANDBOX_SCRAP,fortify:0,plating:0,repair:0,gun:0,supply:0,safeguard:0,owned:1,equipped:1}};
  // Same initialiser the live save uses, so the example panel cannot drift from it.
  return initializeWireWorkshop(example)||example;
}
let sandboxPracticeListener=null;
// Report practice the moment it happens, so the tour never has to poll and cannot
// miss a save that is followed immediately by closing the dialog.
function notifyPractice(){try{sandboxPracticeListener?.(sandboxAPI.practice());}catch{}}
const sandboxAPI={
  enter({example}={}){
    if(inSandbox())return sandbox.profile;
    sandbox={profile:example?exampleProfile(example):exampleProfile(profile),practice:{skills:{upgraded:false,saved:false},armory:{equipped:false,upgraded:false}}};
    document.body.dataset.sandbox='1';
    $('sandboxBanner')?.removeAttribute('hidden');
    return sandbox.profile;
  },
  leave(){
    if(!inSandbox())return;
    sandbox=null;delete document.body.dataset.sandbox;
    $('sandboxBanner')?.setAttribute('hidden','');
    if(profile){commandCenter?.render();soldierUI?.refresh();if(armoryCategory==='workshop')renderWorkshop();}
  },
  isActive:inSandbox,
  getProfile:viewProfile,
  // The sample soldier is the whole save while practice runs: the real dialogs
  // read and write it through these two calls, and it disappears on `leave`.
  apply(next){
    if(!inSandbox()||!next)return null;
    sandbox.profile=next;
    commandCenter?.render();soldierUI?.refresh();updateSkillPrompt(next);
    if(armoryCategory==='workshop')renderWorkshop();
    return sandbox.profile;
  },
  // What the player actually did in the real dialogs, for the tour's own steps.
  markSkill({upgraded=false,saved=false}={}){
    if(!inSandbox())return;
    sandbox.practice.skills.upgraded||=upgraded;
    sandbox.practice.skills.saved||=saved;
    notifyPractice();
  },
  markWorkshop(command){
    if(!inSandbox())return;
    if(command.type==='craft')sandbox.practice.workshop.crafted=true;
    if(command.type==='equip')sandbox.practice.workshop.equippedItem=true;
    notifyPractice();
  },
  practice:()=>inSandbox()?{...sandbox.practice}:null,
  // The tour subscribes instead of polling: a save is reported as it happens.
  onPracticeChange(fn){sandboxPracticeListener=typeof fn==='function'?fn:null;},
  markArmory({equipped=false,upgraded=false}={}){
    if(!inSandbox())return;
    sandbox.practice.armory.equipped||=equipped;
    sandbox.practice.armory.upgraded||=upgraded;
    notifyPractice();
  },
  // Exposed so the tutorial (and the tests) can prove a write is refused.
  refuseWrite:assertWritable,
};
// However practice ends - the close button, Escape, the backdrop, or a save that
// closes the dialog itself - the sample soldier goes with it.
for(const id of ['skillDialog','armoryDialog'])$(id)?.addEventListener('close',()=>{if(inSandbox())sandboxAPI.leave();});
// --- First-run ending -----------------------------------------------------------
// After the training contract the new soldier puts on the gear the run earned
// in the REAL Armory, spends their first skill point in the REAL Skills dialog
// and opens the workshop for the first time. Ordering and the once-per-account
// gate live in first-run-ending.mjs; the dialogs stay here, where they are.
const firstRunStorage=()=>{try{return window.localStorage;}catch{return null;}};
// The dossier and soldier-screen portraits show the soldier's own LAYERED
// face: base portrait plus the chosen hair and beard overlays, composed on
// an offscreen canvas. The composition is async, the consumers are sync, so
// the composed PNG data URL is cached per avatar string and the base face
// file is the immediate fallback for the first paint.
let portraitCache={key:'',url:null};
async function refreshSoldierPortrait(){
  if(!profile){portraitCache={key:'',url:null};return;}
  const avatar=resolveAvatar(profile,languageStorage);
  const key=encodeAvatar(avatar);
  if(portraitCache.key===key)return;
  const canvas=document.createElement('canvas');
  try{
    await composePortrait(canvas,avatar,192);
    portraitCache={key,url:canvas.toDataURL('image/png')};
  }catch{/* Assets unavailable: the base face file carries the frame. */
    portraitCache={key,url:null};}
}
function recruitPortraitUrl(){
  if(!profile)return null;
  return portraitCache.url??facePortrait(resolveAvatar(profile,languageStorage));
}
const dialogOpen=id=>!!document.getElementById(id)?.open;
// Wait for a dialog to open, then for the player to finish with it. Never hangs:
// a timeout resolves so a broken screen cannot trap the first run.
function waitFor(condition,{timeout=180000,interval=150,current=()=>true}={}){
 const start=Date.now();
 return new Promise(resolve=>{
  const tick=()=>{
   // An account switch or maintenance invalidates the old dialog immediately,
   // even when the same UID signs in again before the old wait resolves.
   if(!current())return resolve(false);
   let ok=false;
   try{ok=condition()===true;}catch{ok=false;}
   if(ok)return resolve(true);
   if(Date.now()-start>timeout)return resolve(false);
   setTimeout(tick,interval);
  };
  tick();
 });
}
async function practiceSkills(current=()=>true){
 if(!current())return false;
 const before=profile?.skills||'';
 // The skills card explains the four classes before the tree opens: a new soldier
 // has never heard of Assault or Engineer, and the tree does not say what they buy.
 guide().event?.('equip');
 document.getElementById('skillOpen')?.click?.();
 if(!await waitFor(()=>dialogOpen('skillDialog'),{timeout:10000,current})||!current())return false;
 guide().raise?.();
 // A saved build with no points left is the proof that the point went somewhere.
 const saved=await waitFor(()=>{
  const after=profile?.skills||'',lvl=level(profile?.xp||0);
  return after!==before&&pointsLeft(parseBuild(after,lvl),lvl)===0;
 },{current});
 if(saved){await waitFor(()=>!dialogOpen('skillDialog'),{current});return current();}
 // Closing without saving is a decline, not a failure: the ending stays offered.
 return false;
}
// Step 1 of the ending: put on what the run earned, in the REAL armory. This is
// the player's own soldier, not the practice sandbox, so the save is real.
async function equipFirstRewards(current=()=>true){
 if(!current())return false;
 guide().start(user?.uid);
 document.getElementById('armoryOpen')?.click?.();
 if(!await waitFor(()=>dialogOpen('armoryDialog'),{timeout:10000,current})||!current())return false;
 document.getElementById('armoryEquipmentTab')?.click?.();
 guide().raise?.();
 // Reported: "Legt ein Spieler das item an, passiert nichts. Die Mission geht
 // nicht automatisch weiter." The step used to wait for the armory to be
 // CLOSED, and its only close button sat under the guide card on a phone.
 // The step now completes on the equip itself: the ending closes the armory
 // and walks on to the skills screen. Closing without equipping still ends
 // the step the old way - a soldier who owns everything is not trapped.
 const before=readArmory(viewProfile()?.armory).equipped;
 const equipped=await waitFor(()=>{
  const now=readArmory(viewProfile()?.armory).equipped;
  return (now!==before&&now!==0)||!dialogOpen('armoryDialog');
 },{current});
 if(!current())return false;
 if(equipped&&dialogOpen('armoryDialog')){
  await waitFor(()=>!savingArmory,{timeout:10000,current});
  if(!current())return false;
  document.getElementById('armoryClose')?.click?.();
  return await waitFor(()=>!dialogOpen('armoryDialog'),{timeout:5000,current});
 }
 await waitFor(()=>!dialogOpen('armoryDialog'),{current});
 return current();
}
async function openWorkshopFirstTime(current=()=>true){
 if(!current())return false;
 guide().event?.('skills');
 document.getElementById('armoryOpen')?.click?.();
 if(await waitFor(()=>dialogOpen('armoryDialog'),{timeout:10000,current})&&current()){if(featureEnabled('workshop'))document.getElementById('armoryWorkshopTab')?.click?.();}
 else return false;
 guide().raise?.();
 await waitFor(()=>!dialogOpen('armoryDialog'),{current});
 return current();
}
// The guide for the post-match screens is created lazily; its reference lives
// with the session state so a logout can cancel it before a later step resumes.
// "Play the first run again": forget that this device has seen the tutorial, then let
// the game redeploy the training contract. Only the seen markers are cleared - the
// rewards are switched off inside game.js, so a replay cannot mint a second reward.
const firstRunStorageFor=()=>{try{return window.localStorage;}catch{return null;}};
// "Play the first run again": forget that this device has seen the coaching and the
// three cards after the match, then let the game redeploy the training contract. The
// ending (real armory, real skill tree) is deliberately NOT cleared: those steps
// write to the profile, so a replay teaches the field, not the economy.
function replayFirstRun(){
 const id=user?.uid,version=sessionVersion;
 if(!id)return false;
 firstRunGuide?.stop?.();
 firstRunGuide=null;
 menuTour?.stop?.();
 tutorialDossier?.close?.();
 const storage=firstRunStorageFor();
 try{
  forgetGuideSeen(id,storage);
  for(const key of ['equip','skills','workshop'])storage?.removeItem?.(`ironpath:guide:v1:${key}`);
 }catch{/* memory only: the session still replays */}
 const started=gameControl?.replayFirstRun?.();
 if(started&&typeof started.then==='function')return started.then(ok=>{const current=ok&&version===sessionVersion&&user?.uid===id;if(current)commandCenter?.showBattle?.(false,'training');return !!current;});
 if(!started)return false;
 commandCenter?.showBattle?.(false,'training');
 return true;
}
function syncGuideRecall(){
 const pill=document.getElementById('guideRecall');if(!pill)return;
 const show=!!firstRunGuide?.dismissed?.()||!!menuTour?.dismissed?.();
 pill.hidden=!show;
 mountOverlayPopover(document,pill,{visible:show});
 try{show?pill.showPopover?.():pill.hidePopover?.();}catch{/* fixed pill stands */}
}
const tutorialSync=createTutorialSync({
 db,sdk:{ref,runTransaction},
 getUid:()=>user?.uid,
 isCurrent:()=>!accountTerminated&&!releaseFrozen&&!!user,
 onProfile:updated=>{if(updated){profile=updated;commandCenter?.render();soldierUI?.refresh();}}
});
function ensureMenuTour(){
 if(!menuTour){
  menuTour=createMenuTour({
   document,radio:generalRadio,
   resolve:selector=>document.querySelector(selector),
   onVisibilityChange:()=>syncGuideRecall(),
   onStepChange:(_station,index)=>{
    if(user?.uid&&profile?.tutorial&&profile.tutorial.status!=='completed'){
     void tutorialSync.recordMenuStep(index);
    }
   },
   onComplete:uid=>{
    syncGuideRecall();
    if(uid&&profile?.tutorial){
     void tutorialSync.completeTour(menuTour?.stations?.length||8);
    }
    openFieldSchool();
   },
  });
 }
 return menuTour;
}
function ensureTutorialDossier(){
 if(!tutorialDossier){
  tutorialDossier=createTutorialDossier({
   document,radio:generalRadio,
   onAccept:async mode=>{
    const id=user?.uid,version=sessionVersion;
    if(!id)return false;
    if(mode==='replay'){
     await tutorialSync.restartForReplay('mission',profile);
     return replayFirstRun();
    }
    await tutorialSync.acceptMission();
    if(accountTerminated||version!==sessionVersion||user?.uid!==id)return false;
    const pay=shouldPayTutorialReward(profile,true);
    const floor=pay?Math.max(0,profile?.tutorial?.step||0):0;
    const started=gameControl?.startTrainingRun?.({rewards:pay,restart:true,waveFloor:floor});
    const ok=started&&typeof started.then==='function'?await started:!!started;
    if(ok&&version===sessionVersion&&user?.uid===id)commandCenter?.showBattle?.(false,'training');
    return !!ok;
   },
   onDecline:async()=>{
    await tutorialSync.declineMission();
    return true;
   },
   onReplayMenuOnly:async()=>{
    const id=user?.uid;
    if(!id)return false;
    if(profile?.tutorial)await tutorialSync.restartForReplay('menu',profile);
    commandCenter?.showMenu?.();
    ensureMenuTour().start(id,{startStep:0,speak:true});
    return true;
   },
  });
 }
 return tutorialDossier;
}
function openTutorialDossierDialog(){
 if(!profile)return false;
 if(!featureEnabled('tutorial')){
  const game=gameControl;
  if(game?.replayFirstRun?.())return true;
  game?.showTutorial?.();
  return true;
 }
 const tut=profile?.tutorial;
 const rewarded=!shouldPayTutorialReward(profile,true);
 const mode=tut?.status==='accepted'&&!tut?.missionCompleted?'resume':(!tut||tut.status==='offered'||tut.status==='declined')&&!rewarded?'offer':'replay';
 ensureTutorialDossier().open({mode,rewarded,speak:true});
 return true;
}
function guide(){
 if(!firstRunGuide){
  firstRunGuide=createGuide({document,storage:firstRunStorageFor(),resolve:selector=>document.querySelector(selector),onVisibilityChange:visible=>{syncGuideRecall();if(!visible)generalRadio?.silence?.();},onStepChange:step=>{if(step?.voiceClip)generalRadio?.play?.(step.voiceClip);}});
  const next=document.getElementById('guideNext');if(next)next.onclick=()=>{firstRunGuide?.next?.();};
  const minimize=document.getElementById('guideMinimize');if(minimize)minimize.onclick=()=>{firstRunGuide?.dismiss?.();};
  const close=document.getElementById('guideClose');
  if(close)close.onclick=()=>{
   const midLesson=dialogOpen('armoryDialog')||dialogOpen('skillDialog');
   if(!endingRunning||midLesson){firstRunGuide?.dismiss?.();return;}
   endingAborted=true;endingRun=null;
   firstRunGuide?.stop?.();
   markEndingDone(user?.uid,firstRunStorage());
   endingRunning=false;
   syncGuideRecall();
   openFieldSchool();
  };
  const pill=document.getElementById('guideRecall');if(pill)pill.onclick=()=>{if(menuTour?.dismissed?.()){menuTour.reopen();return;}firstRunGuide?.reopen?.();};
 }
 return firstRunGuide;
}
function cancelFirstRunEnding(){
 endingAborted=true;endingRun=null;endingRunning=false;
 try{firstRunGuide?.stop?.();}catch{}
 try{menuTour?.stop?.();}catch{}
 try{tutorialDossier?.close?.();}catch{}
 try{generalRadio?.stop?.();}catch{}
 syncGuideRecall();
}
function offerFirstRunEnding(){
 const id=user?.uid,version=sessionVersion;
 if(!id||endingRunning)return;
 if(endingDone(id,firstRunStorage())){
  const currentSession=()=>!accountTerminated&&version===sessionVersion&&user?.uid===id;
  void waitFor(()=>!dialogOpen('runResults'),{timeout:180000,current:currentSession}).then(ready=>{
   if(!ready||!currentSession())return;
   if(!$('commandCenter').hidden)ensureMenuTour().start(id,{startStep:0,speak:true});
  });
  return;
 }
 const attempt={};endingRun=attempt;endingRunning=true;endingAborted=false;
 const current=()=>!accountTerminated&&!endingAborted&&endingRun===attempt&&version===sessionVersion&&user?.uid===id;
 const guarded=name=>async()=>current()&&await ({equip:equipFirstRewards,skills:practiceSkills,workshop:openWorkshopFirstTime})[name](current);
 const stopped=()=>{if(endingRun!==attempt)return;endingRun=null;endingRunning=false;firstRunGuide?.stop?.();syncGuideRecall();};
 void (async()=>{
  const settled=await waitFor(()=>!dialogOpen('runResults'),{timeout:180000,current});
  if(!settled||!current())return stopped();
  await runFirstRunEnding({
   id,storage:firstRunStorage(),
   steps:{equip:guarded('equip'),skills:guarded('skills'),workshop:guarded('workshop')},
   shouldStop:()=>!current(),
   onDone:()=>{
    if(!current())return;
    endingRun=null;endingRunning=false;firstRunGuide?.event?.('workshop');firstRunGuide?.stop?.();
    if(profile?.tutorial)void tutorialSync.beginMenuTour(0);
    openFieldSchool();
    ensureMenuTour().start(id,{startStep:0,speak:true});
   },
   onStopped:stopped,
  });
 })().catch(stopped);
}
// The Field School lists where the new soldier can go next. Each entry clicks an
// existing control rather than opening a second path into a screen.
function openFieldSchool(){
 const fieldSchool=document.getElementById('fieldSchool');
 if(!fieldSchool)return;
 for(const entry of FIELD_SCHOOL_ENTRIES){
  const button=document.getElementById(`fieldSchool-${entry.id}`);
  if(button)button.onclick=()=>document.getElementById(entry.action)?.click?.();
 }
 if(window?.matchMedia?.('(max-width: 859px)')?.matches){
  fieldSchool.hidden=true;
  return;
 }
 fieldSchool.hidden=false;
 fieldSchool.scrollIntoView?.({block:'nearest',behavior:'smooth'});
 document.getElementById('fieldSchool-armory')?.focus?.();
}
// The briefing's marker is owned by tutorial.mjs and nowhere else. A second copy of
// the key here is what let the 11-step tour inherit the 8-step tour's completion
// and hide itself from every existing account; use tutorial.completed() instead of
// reading the key again.
function startFirstRunTutorial(){
  const attempt={},version=sessionVersion,id=user?.uid;pendingFirstRuns.add(attempt);
  requestAnimationFrame(()=>{
    if(accountTerminated||version!==sessionVersion||!id||user?.uid!==id||!profile){pendingFirstRuns.delete(attempt);return;}
    try{
      if(!shouldAutoPresentTutorial(profile)){pendingFirstRuns.delete(attempt);return;}
      const target=tutorialResumeTarget(profile);
      if(target==='dossier'||target==='mission-resume'){
        ensureTutorialDossier().open({
          mode:target==='mission-resume'?'resume':'offer',
          rewarded:!shouldPayTutorialReward(profile,true),
          speak:true,
        });
        pendingFirstRuns.delete(attempt);
        return;
      }
      if(target==='menu'){
        if(!endingDone(id,firstRunStorage()))offerFirstRunEnding();
        else ensureMenuTour().start(id,{startStep:Math.max(0,profile?.tutorial?.step||0),speak:true});
        pendingFirstRuns.delete(attempt);
        return;
      }
      pendingFirstRuns.delete(attempt);
    }catch{pendingFirstRuns.delete(attempt);}
  });
}
function chooseArmoryCategory(category){
  if(category==='workshop'&&!featureEnabled('workshop'))category='equipment';
  armoryCategory=category;
  for(const [id,key] of armoryTabs){const tab=$(id);tab.setAttribute('aria-pressed',String(key===category));tab.setAttribute('aria-controls',key==='workshop'?'armoryWorkshop':'armoryList');}
  for(const section of $('armoryList').querySelectorAll('.armory-section'))section.hidden=section.dataset.section!==category;
  const workshop=$('armoryWorkshop');workshop.hidden=category!=='workshop';$('armoryList').hidden=category==='workshop';
  if(category==='workshop'){renderWorkshop();if(!inSandbox()&&!Object.hasOwn(profile||{},'workshop'))void prepareWorkshop();}
}
function renderWorkshop(){
  const root=$('armoryWorkshop');
  if(armoryCategory!=='workshop'){root.hidden=true;return;}
  root.hidden=false;armoryView?.render();
}
for(const [id,key] of armoryTabs)$(id).onclick=()=>chooseArmoryCategory(key);
function renderArmory(){
  if(!viewProfile())return;
  const a=readArmory(viewProfile().armory),list=$('armoryList');list.replaceChildren();$('armoryScrap').textContent=translateText('{amount} SCRAP',{amount:a.scrap});
  const section=(name,caption,key)=>{const wrap=document.createElement('section'),head=document.createElement('div'),title=document.createElement('h3'),sub=document.createElement('span'),grid=document.createElement('div');wrap.className='armory-section';wrap.dataset.section=key;head.className='armory-section-head';title.textContent=translateText(name);sub.textContent=translateText(caption);head.append(title,sub);grid.className='armory-grid';wrap.append(head,grid);list.append(wrap);return grid;};
  const add=(grid,{icon,title,description,eyebrow,label,disabled,action,state,rank})=>{
    const card=document.createElement('article'),art=document.createElement('div'),body=document.createElement('div'),meta=document.createElement('span'),heading=document.createElement('h4'),text=document.createElement('p'),button=document.createElement('button');
    card.className=`armory-card ${state||''}`;art.className='armory-art';art.dataset.item=icon;art.append(armoryIcon(document,icon));body.className='armory-card-body';meta.className='armory-meta';meta.textContent=eyebrow;heading.textContent=title;text.textContent=description;
    body.append(meta,heading,text);
    if(rank!==undefined){const ticks=document.createElement('div');ticks.className='armory-ranks';ticks.setAttribute('aria-label',translateText('Rank {rank} of 3',{rank}));for(let i=0;i<3;i++){const tick=document.createElement('i');if(i<rank)tick.className='filled';ticks.append(tick);}body.append(ticks);}
    button.type='button';button.textContent=label;button.disabled=disabled;button.onclick=action;body.append(button);card.append(art,body);grid.append(card);
  };
  const medals=section('Service record','PERMANENT MEDALS','service');
  for(const medal of serviceMedals(viewProfile())){const card=document.createElement('article'),title=document.createElement('strong'),text=document.createElement('p');card.className=`service-medal${medal.unlocked?' is-earned':''}`;title.textContent=`${medal.unlocked?'★':'☆'} ${translateText(medal.name)}`;text.textContent=translateText(medal.description);card.append(title,text);medals.append(card);}
  const veteran=document.createElement('p');veteran.className='development-hint';veteran.textContent=translateText('Level 5 unlocks Veteran Kit; level 10 unlocks Boss Hunter. Choose one specialization when a tower reaches level 3.');medals.parentElement.append(veteran);
  const defenses=section('Bunker upgrades','SHARED DEFENSE','defenses');
  for(const [kind,name,description] of [['fortify','Fortification','+10 maximum bunker health per rank.'],['plating','Plating','10% less bunker damage per rank.'],['repair','Repair Crew','Restore 3 bunker health per rank after each cleared wave.'],['gun','Bunker Gun','Bunker fires for 5 damage per rank every 3 seconds at nearby enemies.'],['supply','Supply Relay','From wave 6, each active soldier receives 3 supplies per rank after each wave. Unlocks at soldier level 5.'],['safeguard','Emergency Bulwark','From wave 6, bunker takes 2% less damage per rank while below half health. Unlocks at soldier level 5.']]){
    const rank=a[kind],advanced=['supply','safeguard'].includes(kind),cost=(rank+1)*(advanced?50:30),locked=advanced&&level(viewProfile().xp)<5;add(defenses,{icon:kind,title:translateText(name),description:`${translateText(description)} ${translateText('In co-op the highest player rank applies.')}`,eyebrow:translateText('PERMANENT UPGRADE'),rank,label:rank===3?translateText('MAX RANK'):locked?translateText('UNLOCKS AT LEVEL 5'):translateText('UPGRADE · {cost} SCRAP',{cost}),disabled:rank===3||locked||a.scrap<cost,action:async()=>{const version=sessionVersion;if(await confirmation.ask({title:()=>translateText('Upgrade {name}?',{name:translateText(name)}),text:()=>translateText('Spend {cost} scrap on {name}?',{cost,name:translateText(name)}),accept:'UPGRADE'})&&version===sessionVersion)await saveArmory(current=>readArmory(current)[kind]===rank?upgradeArmory(current,kind):null);}});
  }
  const equipment=section('Your equipment','ONE SLOT','equipment');
  ITEMS.forEach((item,i)=>{const id=i+1,owned=!!(a.owned&(1<<i)),equipped=a.equipped===id;add(equipment,{icon:item.icon,title:translateText(item.name),description:translateText(item.description),eyebrow:equipped?translateText('EQUIPPED'):owned?translateText('UNLOCKED'):translateText('WAVE {wave} REWARD',{wave:item.wave}),state:equipped?'is-equipped':owned?'':'is-locked',label:owned?translateText(equipped?'EQUIPPED':'EQUIP'):translateText('UNLOCKS ON WAVE {wave}',{wave:item.wave}),disabled:!owned||equipped,action:()=>void saveArmory(current=>equipArmory(current,id))});});
  const unequip=document.createElement('button');unequip.type='button';unequip.className='armory-unequip';unequip.textContent=translateText('UNEQUIP ITEM');unequip.disabled=a.equipped===0;unequip.onclick=()=>void saveArmory(current=>equipArmory(current,0));equipment.parentElement.append(unequip);chooseArmoryCategory(armoryCategory);
}
async function saveArmory(change){
  if(savingArmory)return;
  // Sandbox: the same change runs against the sample soldier, so practice feels
  // real. Nothing is sent anywhere; the record is thrown away on `leave`.
  if(inSandbox()){
    const next=change(viewProfile()?.armory);
    if(!next){gameControl?.playCue?.('uiError');$('armoryStatus').textContent=translateText('Not enough scrap for that in the sample.');return;}
    const a=readArmory(next);
    sandboxAPI.apply({...viewProfile(),armory:next});
    sandboxAPI.markArmory({equipped:a.equipped>0,upgraded:['fortify','plating','repair','gun','supply','safeguard'].some(k=>a[k]>(readArmory(sandbox.profile.armory)[k]||0))});
    gameControl?.playCue?.('uiEquip');
    $('armoryStatus').textContent=translateText('Sample data: nothing is saved.');
    renderArmory();
    return;
  }
  if(!canEditSkills()){gameControl?.playCue?.('uiError');$('armoryStatus').textContent=translateText('Finish the match and leave the party before changing your armory.');return;}
  savingArmory=true;const currentUser=user,version=sessionVersion;$('armoryStatus').textContent=translateText('Saving…');
  try{const result=await runTransaction(ref(db,`players/${currentUser.uid}`),current=>{if(!current||!Number.isInteger(current.xp))return;const armory=change(current.armory);if(!armory)return;const old=readArmory(current.armory);if(characterProgress(current.xp).level<5&&(armory.supply>old.supply||armory.safeguard>old.safeguard))return;return {...current,armory};},{applyLocally:false});
    if(version!==sessionVersion||user?.uid!==currentUser.uid)return;
    if(!result.committed){gameControl?.playCue?.('uiError');$('armoryStatus').textContent=translateText('Not enough scrap or the armory changed. Please try again.');return;}
    profile=result.snapshot.val();commandCenter?.render();if(gameControl?.canEditSkills())gameControl.resetSkills();gameControl?.playCue?.('uiEquip');$('armoryStatus').textContent=translateText('Saved for your next match.');renderArmory();
  }catch(error){if(version===sessionVersion){gameControl?.playCue?.('uiError');$('armoryStatus').textContent=translateText('Could not save. Check your connection and database rules.');}}
  finally{if(version===sessionVersion)savingArmory=false;}
}
$('armoryOpen').onclick=()=>{if(!inSandbox()&&!canEditSkills()){$('saveStatus').textContent=translateText('Return to the Command Center to open the armory, or leave your party first.');return;}syncContextBackButtons();$('armoryStatus').textContent='';renderArmory();$('armoryDialog').showModal();};
function closeArmory(){if(savingArmory){$('armoryStatus').textContent=translateText('Saving… Please wait before closing.');return;}if($('armoryDialog').open)$('armoryDialog').close();}
$('armoryClose').onclick=closeArmory;
$('armoryDialog').addEventListener('cancel',event=>{event.preventDefault();closeArmory();});
bindDialogBackdrop($('armoryDialog'),closeArmory);

// The sandbox lives on the account object, so the game and the tutorial can reach
// it. Attached at the very end rather than inside the object literal above:
// naming `sandboxAPI` before its `const` is initialised is a temporal-dead-zone
// error, which throws at module load and takes the whole account - and with it the
// Command Center - down. There is a regression test for exactly this.
account.sandbox=sandboxAPI;
