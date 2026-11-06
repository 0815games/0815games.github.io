import {createWorkshopAccount} from './workshop-account.mjs?v=20261105-workshop5';
import {createWorkshopView} from './workshop-view.mjs?v=20261112-firstrun3';
import {createSoldierScreen} from './soldier-screen.mjs?v=20261112-firstrun3';
import {localizeSkillSummary} from './skill-summary-localization.mjs?v=20261110-storyde1';
import {renderSkillIndicators} from './skill-indicator.mjs?v=20261104-skillindicator1';
import {setupLanguage,translateText,onLanguageChange} from './language.mjs?v=20261112-firstrun3';
import {setupFullscreen} from './fullscreen.mjs?v=20261104-fullscreen1';
import {setupFieldMenu} from './field-menu.mjs?v=20261104-fieldcommand2';
import {bindDisclosureDismiss} from './disclosure-dismiss.mjs?v=20261104-dismissall1';
import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
import {setupLeaderboard} from './leaderboards-ui.mjs?v=20261105-workshop5';
import {createLeaderboardService,createScoreReporter,waveFromMask} from './leaderboards.mjs?v=20261104-leaderboards1';
import {setupFriends} from './friends-ui.mjs?v=20261105-workshop5';
import {createCommandCenter} from './command-center.mjs?v=20261105-workshop5';
import {initializeWireWorkshop,applyWireWorkshopCommand} from './workshop-wire.mjs?v=20261112-firstrun3';
// Story completion writes progress and the mission's prestige trophy together.
import {completeStoryWithPrestige,syncPrestige,decodeWorkshop as decodeWorkshopSafe} from './workshop-wire.mjs?v=20261112-firstrun3';
import {missingPrestige} from './prestige.mjs';
import {createFirebaseRecoverableGame} from './firebase-recoverable-game.mjs?v=20261112-alpha3';
import {createFourPlayerPanel} from './firebase-four-panel.mjs?v=20261105-workshop5';
import {createFirebaseFourLobby} from './firebase-four-lobby.mjs?v=20261104-directinvite1';
import {skillBuildSummary,canSaveSkillDraft} from './skill-planner.mjs?v=20261104-doctrines1';
import {setupAuthForm} from './auth-form.mjs?v=20261102-autofill1';
import {serviceMedals} from './service-record.mjs?v=20261105-prestige1';
import {createConfirmation} from './confirmation.mjs?v=20261111-completede1';
import {renderSkillTree,armoryIcon} from './development-ui.mjs?v=20261110-storyde1';
import {renderDogTag,dogTag} from './dog-tag.mjs?v=20261112-firstrun3';
import {runFirstRunEnding,endingDone,FIELD_SCHOOL_ENTRIES} from './first-run-ending.mjs?v=20261112-firstrun3';
import {ITEMS,readArmory,rewardWave,upgradeArmory,equipArmory,encodeLoadout} from './armory.mjs?v=20261102-longterm1';
import {SKILL_PATHS,parseBuild,encodeBuild,pointsLeft,WEB_NODES,webReady,webRequirement,webBonuses} from './skills.mjs?v=20261104-doctrines1';
import {rewardDelta} from './run-results.mjs?v=20261105-prestige1';
import {createCoopRewardQueue} from './coop-rewards.mjs?v=20261105-prestige1';
import {creditSoloWave} from './workshop-solo-credit.mjs?v=20261112-free2';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase, ref, onValue, runTransaction, get, remove, set, update, onDisconnect, serverTimestamp, query, orderByKey, startAfter, limitToFirst, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import { createFirebasePartyLobby } from './firebase-party-lobby.mjs?v=20261104-doctrines1';
import { createFourDigitPanel } from './firebase-four-digit-panel.mjs?v=20261102-versus1';
import { createFourDigitLobby } from './firebase-four-digit-lobby.mjs?v=20261101-fourstage1';
import { startGame } from './game.js?v=20261112-alpha1';
import { createFirebasePartyGame } from './firebase-party-game.mjs?v=20261112-alpha3';
import { createPlayer } from './match.mjs?v=20261105-workshop3';
import { characterProgress } from './progression.mjs?v=20261105-prestige1';

bindDisclosureDismiss(document);
window.ironPathLoaded = true;
const app = initializeApp({apiKey:'AIzaSyC_1iHc7YREzKAGH9YbdO5bMTEtE4edPiE',authDomain:'iron-path-dc727.firebaseapp.com',databaseURL:'https://iron-path-dc727-default-rtdb.europe-west1.firebasedatabase.app',projectId:'iron-path-dc727',storageBucket:'iron-path-dc727.firebasestorage.app',messagingSenderId:'305063261861',appId:'1:305063261861:web:8ec54d8318a983fce3ff4c'});
const auth=getAuth(app), db=getDatabase(app), $=id=>document.getElementById(id);
let profile=null, user=null, unsubscribe=null, sessionVersion=0, gameStarted=false, notifySession=()=>{}, gameControl=null, commandCenter=null, scoreReporter=null, soldierUI=null;
// Declared before setupLanguage() runs: its first onChange fires immediately.
let armoryCategory='equipment';
let languageStorage;try{languageStorage=window.localStorage;}catch{languageStorage=null;}
setupLanguage({document,storage:languageStorage,onChange:()=>{commandCenter?.render();gameControl?.refreshLanguage?.();soldierUI?.refresh();if(armoryCategory==='workshop')renderWorkshop();if(profile){$('profileLevel').textContent=levelText(profile.xp);$('profileStats').textContent=translateText('HERO DAMAGE: {damage} / SHOT',{damage:10+Math.min(level(profile.xp)-1,20)+2*parseBuild(profile.skills,level(profile.xp)).assault+(readArmory(profile.armory).equipped===1?3:0)+webBonuses(parseBuild(profile.skills,level(profile.xp))).damage});updateSkillPrompt(profile);if($('armoryDialog').open)renderArmory();if($('skillDialog').open)renderSkills();}}});
setupFullscreen({document,button:$('fullscreenToggle'),status:$('fullscreenStatus'),translate:translateText,onLanguageChange});
setupFieldMenu({document,onLanguageChange});
const confirmation=createConfirmation(document,translateText);onLanguageChange(()=>confirmation.refresh());
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
  async sync(){return applySandboxWorkshop(p=>syncPrestige(p));},
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
  command:command=>inSandbox()?sandboxWorkshop.command(command):workshopAccount.command(command),
  sync:()=>inSandbox()?sandboxWorkshop.sync():workshopAccount.sync(),
  hasPending:()=>inSandbox()?false:!!workshopAccount.hasPending?.(),
  isBusy:()=>workshopAccount.isBusy(),
};
armoryView=createWorkshopView({document,root:$('armoryWorkshop'),getProfile:viewProfile,service:workshopService,confirm:options=>confirmation.ask(options),translate:translateText,onProfile:value=>{profile=value;commandCenter?.render();soldierUI?.refresh();if(gameControl?.canEditSkills())gameControl.resetSkills();}});
soldierUI=createSoldierScreen({document,getProfile:viewProfile,translate:translateText,onArmory:()=>$('armoryOpen').onclick(),onSkills:()=>$('skillOpen').onclick()});$('menuSoldier').onclick=()=>soldierUI.open();
const leaderboardUI=setupLeaderboard({document,db,auth,sdk:{ref,get,onValue,runTransaction,query,orderByChild,limitToLast}});
const friendsUI=setupFriends({document,db,auth,sdk:{ref,get,set,remove,onValue,onDisconnect,query,orderByKey,startAfter,limitToFirst,serverTimestamp},getProfile:()=>profile,getHostInvite:()=>fourPanel?.hostInvite(),joinInvite:async invite=>{if(!fourPanel||fourPanel.isActive()||partyPanel.isActive())return false;const joined=await fourPanel.joinInvite(invite);if(joined){commandCenter?.showLobby();fourPanel.show();$('partyToggle').setAttribute('aria-expanded','true');}return !!joined;}});
// Limited live alpha test: publicly accessible; not a security boundary.
const partySdk={ref,onValue,runTransaction,get,remove,set,update,onDisconnect,serverTimestamp};
// Online alpha: requires the complete four-player Firebase rules to be published.
const fourPlayerTest=true;
// Explicit, limited online trial; the host's immutable manifest selects the
// protocol for every member so normal lobbies remain unchanged.
const hostRecoveryEnabled=new URLSearchParams(window.location.search).get('recovery')==='1';
$('fourPartyResume').hidden=!hostRecoveryEnabled;
let fourPanel=null;
const partyPanel=createFourDigitPanel({document,createApproval:lobby=>createFourDigitLobby({db,auth,sdk:partySdk,lobby}),createLobby:()=>{if(fourPanel?.isActive())throw Error('Leave the four-player party first');return createFirebasePartyLobby({db,auth,sdk:partySdk});},getProfile:()=>({name:profile.name,gender:profile.gender,level:level(profile.xp),...(profile.skills?{skills:profile.skills}:{}),...(profile.armory?{loadout:encodeLoadout(profile.armory)}:{})}),confirmMatch:()=>gameControl?.confirmParty()??false,onLeaveMatch:()=>gameControl?.leaveCoop(),onJoinMatch:(party,onUpdate)=>{const uid=auth.currentUser?.uid,version=sessionVersion;const rewardQueues=new Map();const rewardOptions={db,auth,sdk:partySdk,partyId:party.partyId,workshop:true,onStatus:(status,detail,block)=>{if(version===sessionVersion&&auth.currentUser?.uid===uid){$('saveStatus').textContent=status==='error'?translateText('Co-op XP and loot could not be saved yet. Check Firebase rules and connection.'):translateText('Co-op wave XP and loot saved.');gameControl?.recordCoopReward(party.partyId,status,detail,block);}}};const getRewards=block=>{if(!rewardQueues.has(block))rewardQueues.set(block,createCoopRewardQueue({...rewardOptions,block,onStatus:(status,detail)=>rewardOptions.onStatus(status,detail,block)}));return rewardQueues.get(block);};const joined=gameControl?.beginCoop(callbacks=>createFirebasePartyGame({db,auth,sdk:partySdk,...party,mapId:gameControl.getMapId(),players:party.profiles?.map((p,i)=>createPlayer(party.playerIds[i],p,i?800:850,450)),...callbacks,onWaveRewards:(mask,block=0)=>getRewards(block).observe(mask)}),onUpdate,party.partyId)??false;if(!joined)for(const queue of rewardQueues.values())queue.close();return joined;},confirmClose:()=>confirmation.ask({title:"Close party?",text:"This closes the multiplayer match for both players.",accept:"CLOSE PARTY"}),enabled:false});
if(fourPlayerTest){
  fourPanel=createFourPlayerPanel({document,createLobby:()=>{if(partyPanel.isActive())throw Error('Leave the current party first');return createFirebaseFourLobby({db,auth,sdk:partySdk,recoveryEnabled:hostRecoveryEnabled});},
    getProfile:()=>({name:profile.name,gender:profile.gender,level:level(profile.xp),...(profile.skills?{skills:profile.skills}:{}),...(profile.armory?{loadout:encodeLoadout(profile.armory)}:{})}),
    confirmStart:()=>gameControl?.confirmParty()??false,confirmClose:()=>confirmation.ask({title:'Close multiplayer party?',text:'This ends the party and disconnects all players.',accept:'CLOSE PARTY'}),onLeaveMatch:async()=>{await gameControl?.leaveCoop();if(user&&!$('gameView').hidden&&!$('gameWorkspace').hidden){commandCenter?.showLobby();fourPanel?.show();}},
    onMatch:party=>{const uid=auth.currentUser?.uid,version=sessionVersion,rewardQueues=new Map();
      const getRewards=block=>{if(!rewardQueues.has(block))rewardQueues.set(block,createCoopRewardQueue({db,auth,sdk:partySdk,partyId:party.partyId,block,onStatus:(status,detail)=>{if(version!==sessionVersion||auth.currentUser?.uid!==uid)return;$('saveStatus').textContent=status==='error'?translateText('Wave rewards could not be saved yet.'):translateText('Wave rewards saved.');gameControl?.recordCoopReward(party.partyId,status,detail,block);}}));return rewardQueues.get(block);};
      const joined=gameControl?.beginCoop(callbacks=>{const players=party.profiles?.map((p,i)=>createPlayer(party.playerIds[i],p,party.playerIds.length===2?(i?800:850):1220,party.playerIds.length===2?450:270+i*60)),common={db,auth,sdk:partySdk,partyId:party.partyId,mapId:gameControl.getMapId(),players,...callbacks,onWaveRewards:(mask,block=0)=>{getRewards(block).observe(mask);if(party.mode==='coop'||party.mode==='four-coop')scoreReporter?.observe('coop',waveFromMask(mask,block));}};return party.recovery===true?createFirebaseRecoverableGame({...common,manifest:party,resumeGeneration:party.resumeGeneration??null}):createFirebasePartyGame({...common,partyRoot:'fourParties',hostId:party.hostId,playerIds:party.playerIds,mode:party.mode,teams:party.teamRosters});},()=>{},party.partyId)??false;
      if(joined){commandCenter?.showBattle();fourPanel.hide();$('partyToggle').setAttribute('aria-expanded','false');}else for(const queue of rewardQueues.values())queue.close();return joined;
    }});
  $('partyToggle').hidden=false;$('partyToggle').onclick=()=>{commandCenter?.showLobby();partyPanel.collapse();fourPanel.show();$('partyToggle').setAttribute('aria-expanded','true');};
}
const level=xp=>characterProgress(xp).level;
const levelText=xp=>{const p=characterProgress(xp);return translateText('LEVEL {level} · {current} / {required} XP',{level:p.level,current:p.current,required:p.required});};
function display(view){$('loading').hidden=view!=='loading';$('authView').hidden=view!=='auth';$('connectionView').hidden=view!=='connection';$('characterView').hidden=view!=='character';$('entry').hidden=view==='game';$('gameView').hidden=view!=='game';}
let entryMessage={text:'',values:{}};
function message(text,values={}){entryMessage=typeof text==='object'?text:{text,values};$('entryMessage').textContent=translateText(entryMessage.text,entryMessage.values);}
onLanguageChange(()=>message(entryMessage));
function errorText(error){const code=error?.code||'';if(code.includes('invalid-credential')||code.includes('wrong-password')||code.includes('user-not-found'))return 'Incorrect email or password.';if(code.includes('email-already-in-use'))return 'This email is already registered. Sign in instead.';if(code.includes('weak-password'))return 'Please choose a stronger password.';if(code.includes('invalid-email'))return 'Please enter a valid email address.';if(code.includes('network'))return 'Network error. Check your connection and try again.';if(code.includes('permission-denied')||code.includes('permission_denied'))return 'Database access denied. The Iron Path database rules may need to be deployed.';return code?{text:'Could not complete the request. Please try again. ({code})',values:{code}}:'Could not complete the request. Please try again.';}
async function busy(button, task){if(button.disabled)return;button.disabled=true;message('');try{await task();}catch(e){message(errorText(e));}finally{button.disabled=false;}}
setupAuthForm({form:$('authForm'),email:$('email'),password:$('password'),submit:$('authSubmit'),register:$('register'),forgot:$('forgot'),onSignIn:(email,password)=>signInWithEmailAndPassword(auth,email,password),onRegister:(email,password)=>createUserWithEmailAndPassword(auth,email,password),onError:error=>message(error?errorText(error):'')});
$('forgot').onclick=e=>{const email=$('email').value.trim();if(!email){message('Enter your email address first.');return;}busy(e.currentTarget,async()=>{await sendPasswordResetEmail(auth,email);message('If the email is registered, a reset email may arrive shortly.');});};
async function logout(){try{await fourPanel?.leaveForLogout();await partyPanel.leaveForLogout();await signOut(auth);$('password').value='';}catch(e){message(errorText(e));{const err=errorText(e);$('saveStatus').textContent=typeof err==='string'?translateText(err):translateText(err.text,err.values);}}}
async function requestLogout(){const partyActive=partyPanel.isActive()||!!fourPanel?.isActive(),run=gameControl?.getRunSummary();if((partyActive||run)&&!await confirmation.ask({title:'Sign out?',text:partyActive?'Signing out leaves your multiplayer party and may end its match.':'Your current solo operation will be lost. Completed-wave rewards remain saved.',accept:'SIGN OUT'}))return;await logout();}
$('logout').onclick=requestLogout; $('setupLogout').onclick=logout; $('errorLogout').onclick=logout; $('retryProfile').onclick=()=>{if(user){message('');display('loading');loadProfile(user,sessionVersion);}};
$('characterForm').addEventListener('submit',e=>{e.preventDefault();const name=$('soldierName').value.trim();if(name.length<2||name.length>24){message('Soldier name must be 2–24 characters.');return;}const currentUser=user, version=sessionVersion;busy(e.submitter,async()=>{const result=await runTransaction(ref(db,`players/${currentUser.uid}`),current=>current===null?{name,gender:$('gender').value,xp:0}:undefined,{applyLocally:false});if(version!==sessionVersion)return;if(!result.committed&&result.snapshot.exists())loadProfile(currentUser,version);});});
function updateSkillPrompt(value){const lvl=level(value.xp),left=pointsLeft(parseBuild(value.skills,lvl),lvl);renderSkillIndicators({document,points:left});}
function showProfile(value){updateSkillPrompt(value);profile=value;$('profileName').textContent=value.name;$('profileLevel').textContent=levelText(value.xp);$('profileStats').textContent=translateText('HERO DAMAGE: {damage} / SHOT',{damage:10+Math.min(level(value.xp)-1,20)+2*parseBuild(value.skills,level(value.xp)).assault+(readArmory(value.armory).equipped===1?3:0)+webBonuses(parseBuild(value.skills,level(value.xp))).damage});$('saveStatus').textContent='';display('game');friendsUI.start();scoreReporter?.close();scoreReporter=createScoreReporter({service:createLeaderboardService({db,auth,sdk:{ref,get,onValue,runTransaction,query,orderByChild,limitToLast}}),getName:()=>profile?.name,onSuccess:()=>{$('scoreSaveStatus').textContent='';},onError:()=>{$('scoreSaveStatus').textContent=translateText('High score could not be saved yet; retrying.');}});if(!gameStarted){gameStarted=true;gameControl=startGame(account,{confirmAction:confirmation.ask,leaveParty:()=>fourPanel?.isActive()?fourPanel.leaveParty():partyPanel.leaveParty(),experimentalFourViewport:fourPlayerTest,experimentalWorkshop:true,deferTutorial:false,onReturnToCommand:()=>commandCenter?.showAfterEnd(),onResumeBattle:()=>commandCenter?.showBattle(),onTrainingComplete:()=>window.setTimeout(offerFirstRunEnding,600)});commandCenter=createCommandCenter({document,getProfile:()=>profile,getGame:()=>gameControl,isPartyActive:()=>partyPanel.isActive()||!!fourPanel?.isActive(),openParty:()=>{if($('fourPartyPanel').hidden)$('partyToggle').onclick();},closeParty:()=>{fourPanel?.hide();$('partyToggle').setAttribute('aria-expanded','false');},signOut:requestLogout});}else notifySession();commandCenter.showMenu();}
function loadProfile(currentUser,version){if(unsubscribe)unsubscribe();unsubscribe=onValue(ref(db,`players/${currentUser.uid}`),snap=>{if(version!==sessionVersion)return;const value=snap.val();if(!value){profile=null;display('character');return;}if(typeof value.name!=='string'||!['male','female'].includes(value.gender)||!Number.isInteger(value.xp)||value.xp<0){profile=null;display('connection');message('Your soldier data is invalid. Please contact support.');return;}const first=!profile;profile=value;updateSkillPrompt(value);$('profileName').textContent=value.name;$('profileLevel').textContent=levelText(value.xp);$('profileStats').textContent=translateText('HERO DAMAGE: {damage} / SHOT',{damage:10+Math.min(level(value.xp)-1,20)+2*parseBuild(value.skills,level(value.xp)).assault+(readArmory(value.armory).equipped===1?3:0)+webBonuses(parseBuild(value.skills,level(value.xp))).damage});if(first){showProfile(value);void backfillPrestige(value);refreshDogTags();void startFirstRunTutorial();}else {commandCenter?.render();soldierUI?.refresh();refreshDogTags();if(armoryCategory==='workshop')renderWorkshop();}},error=>{if(version!==sessionVersion)return;profile=null;display('connection');message(errorText(error));});}
const account={recordScore:(mode,wave)=>scoreReporter?.observe(mode,wave),getProfile:()=>({...profile,loadout:encodeLoadout(profile?.armory)}),getUserId:()=>user?.uid,getToken:()=>{if(!user)throw new Error('Sign in required');return user.getIdToken();},getLevel:()=>level(profile?.xp||0),isReady:()=>!!profile&&!!user,onSessionChange:callback=>{notifySession=callback;},canChooseSolo:()=>!partyPanel.isActive()&&!fourPanel?.isActive(),saveCampaign:async(id)=>{if(inSandbox())return {committed:false};const currentUser=user,version=sessionVersion;if(!currentUser||!profile)return {committed:false};try{
   // Story progress and the mission's prestige trophy are written together, so a
   // finished mission can never grant one without the other.
   const result=await runTransaction(ref(db,`players/${currentUser.uid}`),current=>completeStoryWithPrestige(current,id)??undefined,{applyLocally:false});if(version!==sessionVersion)return {committed:false};return {committed:result.committed,profile:result.committed?result.snapshot.val():null};}catch{return {committed:false};}},awardXP:async (amount,wave,runId=null)=>{if(inSandbox())return {committed:false};const currentUser=user,version=sessionVersion;if(!currentUser||!profile||!Number.isInteger(wave)||wave<1||!Number.isSafeInteger(wave))return;$('saveStatus').textContent=translateText('Saving +{amount} XP and loot…',{amount});try{
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
  return {committed:!!outcome.committed,delta:outcome.committed?rewardDelta(outcome.before,outcome.after):null,profile:outcome.committed?outcome.after:null};
 }catch(e){if(version===sessionVersion)$('saveStatus').textContent=translateText('XP and loot could not be saved. Check your connection and database rules.');return {committed:false};}}};
let draftSkills=null,selectedSkill={path:'assault',rank:1},openedSkills='',savingSkills=false,savingArmory=false,closingSkills=false,skillsOpenGeneration=0;
onAuthStateChanged(auth,currentUser=>{scoreReporter?.close();scoreReporter=null;$('scoreSaveStatus').textContent='';leaderboardUI.reset();friendsUI.signOut();savingSkills=false;savingArmory=false;closingSkills=false;skillsOpenGeneration++;$('skillSave').disabled=false;$('skillReset').disabled=false;confirmation.cancel();if($('skillDialog').open)$('skillDialog').close();if($('armoryDialog').open)$('armoryDialog').close();soldierUI.close();workshopPrepareFailed=false;partyPanel.reset();partyPanel.collapse();if(fourPanel?.isActive())void fourPanel.leaveForLogout();sessionVersion++;const version=sessionVersion;if(unsubscribe){unsubscribe();unsubscribe=null;}profile=null;user=currentUser;notifySession();message('');if(currentUser){const uid=currentUser.uid;setTimeout(()=>{if(auth.currentUser?.uid===uid)$('password').value='';},1500);}if(!currentUser){display('auth');return;}display('loading');loadProfile(currentUser,version);},error=>{display('auth');message(errorText(error));});

function canEditSkills(){return !!profile&&!partyPanel.isActive()&&!fourPanel?.isActive()&&!!gameControl&&(gameControl.canEditSkills()||!$('commandCenter').hidden);}
function renderSkills(){
  if(!viewProfile())return;
  document.querySelectorAll('[data-skill-path]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.skillPath===$('skillPathFilter').value)));
  const lvl=level(viewProfile().xp),left=pointsLeft(draftSkills,lvl),index=SKILL_PATHS.findIndex(p=>p.id===selectedSkill.path),path=SKILL_PATHS[index<0?0:index],rank=selectedSkill.rank,specialist=rank>=5&&rank<100,extraIndex=(index<0?0:index)*2+rank-5;
  $('skillPoints').textContent=translateText(left===1?'LEVEL {level} · {points} POINT AVAILABLE':'LEVEL {level} · {points} POINTS AVAILABLE',{level:lvl,points:left});
  const summary=localizeSkillSummary(skillBuildSummary(draftSkills,lvl),translateText);$('skillSummaryActive').textContent=summary.active;$('skillSummaryStats').textContent=summary.values.join('\n');$('skillSummaryCombos').textContent=summary.combos;$('skillSummaryCaps').textContent=summary.caps;
  if(!savingSkills)$('skillStatus').textContent=translateText(encodeBuild(draftSkills)===openedSkills?'Saved build unchanged.':'Unsaved draft — save to apply; closing discards these changes.');

  const scroll=$('skillDialog').scrollTop,restoreActionFocus=document.activeElement===$('skillDetailAction');
  renderSkillTree({document,container:$('skillPaths'),build:draftSkills,level:lvl,selected:selectedSkill,filter:$('skillFilter').value,pathFilter:$('skillPathFilter').value,inspector:$('skillInspector'),inspectorHome:$('skillInspectorHome'),translate:translateText,onSelect:(value,keyboard)=>{const selector=`[data-path="${value.path}"][data-rank="${value.rank}"]`,previous=$('skillPaths').querySelector(selector)?.getBoundingClientRect().top;selectedSkill=value;renderSkills();const current=$('skillPaths').querySelector(selector);if(current&&Number.isFinite(previous))$('skillDialog').scrollTop+=current.getBoundingClientRect().top-previous;if(keyboard)current?.focus({preventScroll:true});}});
  if(restoreActionFocus)$('skillDetailAction').focus({preventScroll:true});
  if(Number.isFinite(scroll))$('skillDialog').scrollTop=scroll;
  const action=$('skillDetailAction');
  if(rank>=100){const node=WEB_NODES[rank-100];if(!node)return;const unlocked=!!draftSkills.web[node.id],ready=webReady(draftSkills,node);$('skillDetailType').textContent=translateText(node.kind==='doctrine'?'SPECIALIST DOCTRINE':node.kind!=='mastery'?'HYBRID COMBO':node.tier===4?'MASTERY CAPSTONE':'ADVANCED MASTERY');$('skillDetailTitle').textContent=translateText(node.name);$('skillDetailText').textContent=`${translateText(node.description)} ${translateText(webRequirement(node))} ${translateText('Each node costs one point.')}`;action.textContent=translateText(unlocked?'UNLOCKED':!ready?'PREREQUISITES REQUIRED':!left?'NO POINTS AVAILABLE':'UNLOCK · 1 POINT');action.disabled=savingSkills||unlocked||!ready||!left;action.onclick=()=>{if(!savingSkills&&!draftSkills.web[node.id]&&webReady(draftSkills,node)&&pointsLeft(draftSkills,level(profile.xp))>0){draftSkills.web[node.id]=1;renderSkills();}};return;}
$('skillDetailType').textContent=rank===1?translateText('MAIN SKILL'):`${translateText(path.name).toUpperCase()} / ${translateText(specialist?'SPECIAL SKILL':'PASSIVE')}`;
  $('skillDetailTitle').textContent=rank===1?translateText(path.ability):specialist?translateText(path.branches[rank-5].ability):translateText('{name} · Rank {rank}',{name:translateText(path.name),rank});
  $('skillDetailText').textContent=rank===1?`${translateText(path.description)} ${translateText(path.passive)}. ${translateText(draftSkills[path.id]>=1?'Unlocked main skills can be selected for free.':'Spend one point to unlock this main skill.')}`:specialist?`${translateText(path.branches[rank-5].abilityDescription)} ${translateText('Passive: {text} Requires {name} rank 2. Selecting it replaces your current active skill.',{text:translateText(path.branches[rank-5].description),name:translateText(path.name)})}`:`${translateText(path.passive)}. ${translateText('Requires {name} rank {rank}. {count} of 3 ranks unlocked.',{name:translateText(path.name),rank:rank-1,count:draftSkills[path.id]})}`;
  if(specialist){const unlocked=!!draftSkills.extra[extraIndex],ready=draftSkills[path.id]>=2,selected=unlocked&&draftSkills.active===path.id&&draftSkills.variant===rank-4;action.textContent=translateText(selected?'SPECIAL SKILL SELECTED':unlocked?'SELECT SPECIAL SKILL':!ready?'REQUIRES RANK 2':!left?'NO POINTS AVAILABLE':'UNLOCK & SELECT · 1 POINT');action.disabled=savingSkills||selected||(!unlocked&&(!ready||!left));action.onclick=()=>{if(savingSkills)return;if(!draftSkills.extra[extraIndex]){if(draftSkills[path.id]<2||pointsLeft(draftSkills,level(profile.xp))<1)return;draftSkills.extra[extraIndex]=1;}draftSkills.active=path.id;draftSkills.variant=rank-4;renderSkills();};}
  else if(rank===1){const unlocked=draftSkills[path.id]>=1,selected=draftSkills.active===path.id&&!draftSkills.variant;action.textContent=translateText(selected?'MAIN SKILL SELECTED':unlocked?'SELECT MAIN SKILL':!left?'NO POINTS AVAILABLE':'UNLOCK & SELECT · 1 POINT');action.disabled=savingSkills||selected||(!unlocked&&!left);action.onclick=()=>{if(savingSkills)return;if(!draftSkills[path.id]){if(!pointsLeft(draftSkills,level(profile.xp)))return;draftSkills[path.id]=1;}draftSkills.active=path.id;draftSkills.variant=0;renderSkills();};}
  else {const unlocked=rank<=draftSkills[path.id],next=rank===draftSkills[path.id]+1;action.textContent=translateText(unlocked?'UNLOCKED':!next?'UNLOCK PREVIOUS RANK':!left?'NO POINTS AVAILABLE':'UPGRADE · 1 POINT');action.disabled=savingSkills||unlocked||!next||!left;action.onclick=()=>{if(!savingSkills&&rank===draftSkills[path.id]+1&&pointsLeft(draftSkills,level(profile.xp))>0){draftSkills[path.id]++;renderSkills();}};}
}
document.querySelectorAll('[data-skill-path]').forEach(button=>{button.onclick=()=>{ $('skillPathFilter').value=button.dataset.skillPath; if(button.dataset.skillPath!=='all')selectedSkill={path:button.dataset.skillPath,rank:1}; $('skillPaths').scrollTop=0;renderSkills(); };});
$('skillFilter').onchange=()=>renderSkills();$('skillPathFilter').onchange=()=>renderSkills();
$('skillOpen').onclick=()=>{if(!inSandbox()&&!canEditSkills()){$('saveStatus').textContent=translateText('Return to the Command Center to edit skills between deployments, or leave your party first.');return;}skillsOpenGeneration++;draftSkills=parseBuild(viewProfile().skills,level(viewProfile().xp));openedSkills=encodeBuild(draftSkills);selectedSkill={path:'assault',rank:1};$('skillFilter').value='all';$('skillPathFilter').value='assault';renderSkills();$('skillDialog').showModal();$('skillPaths').scrollLeft=0;$('skillPaths').scrollTop=0;};
$('skillReset').onclick=async()=>{if(inSandbox())return;if(!canEditSkills()||savingSkills)return;const version=sessionVersion;if(await confirmation.ask({title:'Reset draft skill points?',text:'This refunds every point for free in this draft. Your saved build will only change if you press Save Build. Close the skill tree without saving to keep it.',accept:'RESET DRAFT'})&&version===sessionVersion&&$('skillDialog').open&&canEditSkills()&&!savingSkills){draftSkills=parseBuild(undefined,level(profile.xp));renderSkills();}};
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
    sandboxAPI.markSkill({upgraded:viewProfile().skills!==''&&pointsLeft(draftSkills,level(viewProfile().xp))===0,saved:true});
    $('skillStatus').textContent=translateText('Sample data: your real build is unchanged.');
    $('skillDialog').close();
    return;
  }
  if(!canEditSkills()){$('skillStatus').textContent=translateText('Leave the party and finish the match before changing skills.');return;}
  if(savingSkills)return;const currentUser=user,version=sessionVersion,build=encodeBuild(draftSkills),expected=openedSkills;savingSkills=true;$('skillSave').disabled=true;$('skillReset').disabled=true;$('skillDetailAction').disabled=true;$('skillStatus').textContent=translateText('Saving…');
  try{
    const result=await runTransaction(ref(db,`players/${currentUser.uid}`),current=>{
      if(!canSaveSkillDraft(current,expected,build,level))return;
      return {...current,skills:build};
    },{applyLocally:false});
    if(version!==sessionVersion||user?.uid!==currentUser.uid)return;
    if(!result.committed){$('skillStatus').textContent=translateText('Could not save: your saved build may have changed elsewhere, or this draft is no longer valid. Close and reopen Skills to reload it.');return;}
    profile=result.snapshot.val();commandCenter?.render();$('skillDialog').close();if(gameControl?.canEditSkills())gameControl.resetSkills();updateSkillPrompt(profile);$('saveStatus').textContent=translateText('Skill build saved for the next match.');
  }catch(error){if(version===sessionVersion)$('skillStatus').textContent=translateText('Could not save skills. Check your connection and Firebase rules.');}
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
  const example={...(base||{name:'Example Soldier',gender:'male',xp:0}),xp:300,skills:'',armory:{scrap:SANDBOX_SCRAP,fortify:0,plating:0,repair:0,gun:0,supply:0,safeguard:0,owned:1,equipped:1}};
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
// After the training contract the new soldier spends their first skill point in
// the REAL Skills dialog, receives a dog tag (drawn, never stored) and opens the
// workshop for the first time. Ordering and the once-per-account gate live in
// first-run-ending.mjs; the dialogs stay here, where they already are.
let endingRunning=false;
const firstRunStorage=()=>{try{return window.localStorage;}catch{return null;}};
// The tag is cosmetic: it is derived on every render and nothing is written back.
function refreshDogTags(){
 if(!profile)return;
 const data={profile,accountId:user?.uid};
 for(const container of [document.getElementById('soldierDogTag'),document.getElementById('armoryDogTag')])if(container)renderDogTag(document,container,data);
}
const dialogOpen=id=>!!document.getElementById(id)?.open;
// Wait for a dialog to open, then for the player to finish with it. Never hangs:
// a timeout resolves so a broken screen cannot trap the first run.
function waitFor(condition,{timeout=180000,interval=150}={}){
 const start=Date.now();
 return new Promise(resolve=>{
  const tick=()=>{
   let ok=false;
   try{ok=condition()===true;}catch{ok=false;}
   if(ok)return resolve(true);
   if(Date.now()-start>timeout)return resolve(false);
   setTimeout(tick,interval);
  };
  tick();
 });
}
async function practiceSkills(){
 const before=profile?.skills||'';
 document.getElementById('skillOpen')?.click?.();
 if(!await waitFor(()=>dialogOpen('skillDialog')))return false;
 // A saved build with no points left is the proof that the point went somewhere.
 const saved=await waitFor(()=>{
  const after=profile?.skills||'',lvl=level(profile?.xp||0);
  return after!==before&&pointsLeft(parseBuild(after,lvl),lvl)===0;
 });
 if(saved){await waitFor(()=>!dialogOpen('skillDialog'));return true;}
 // Closing without saving is a decline, not a failure: the ending stays offered.
 return false;
}
async function showDogTag(){
 refreshDogTags();
 soldierUI?.open();
 if(!await waitFor(()=>dialogOpen('soldierDialog')))return true;
 await waitFor(()=>!dialogOpen('soldierDialog'));
 return true;
}
async function openWorkshopFirstTime(){
 document.getElementById('armoryOpen')?.click?.();
 if(await waitFor(()=>dialogOpen('armoryDialog')))document.getElementById('armoryWorkshopTab')?.click?.();
 else return false;
 await waitFor(()=>!dialogOpen('armoryDialog'));
 return true;
}
function offerFirstRunEnding(){
 const id=user?.uid;
 if(!id||endingRunning)return;
 if(endingDone(id,firstRunStorage()))return;
 endingRunning=true;
 void runFirstRunEnding({
  id,storage:firstRunStorage(),
  steps:{skills:practiceSkills,tag:showDogTag,workshop:openWorkshopFirstTime},
  onDone:()=>{endingRunning=false;openFieldSchool();},
  onStopped:()=>{endingRunning=false;},
 });
}
// The Field School lists where the new soldier can go next. Each entry clicks an
// existing control rather than opening a second path into a screen.
function openFieldSchool(){
 const fieldSchool=document.getElementById('fieldSchool');
 if(!fieldSchool)return;
 fieldSchool.hidden=false;
 for(const entry of FIELD_SCHOOL_ENTRIES){
  const button=document.getElementById(`fieldSchool-${entry.id}`);
  if(button)button.onclick=()=>document.getElementById(entry.action)?.click?.();
 }
 fieldSchool.scrollIntoView?.({block:'nearest',behavior:'smooth'});
 document.getElementById('fieldSchool-armory')?.focus?.();
}
const FIRST_RUN_TUTORIAL_KEY=id=>`ironpath:tutorial:v1:${id}`;
function startFirstRunTutorial(){
  // Let the Command Center paint first; the tutorial is a modal over it.
  requestAnimationFrame(()=>{try{gameControl?.startTutorialIfNeeded?.();}catch{}});
}
function chooseArmoryCategory(category){
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
    if(!next){$('armoryStatus').textContent=translateText('Not enough scrap for that in the sample.');return;}
    const a=readArmory(next);
    sandboxAPI.apply({...viewProfile(),armory:next});
    sandboxAPI.markArmory({equipped:a.equipped>0,upgraded:['fortify','plating','repair','gun','supply','safeguard'].some(k=>a[k]>(readArmory(sandbox.profile.armory)[k]||0))});
    $('armoryStatus').textContent=translateText('Sample data: nothing is saved.');
    renderArmory();
    return;
  }
  if(!canEditSkills()){$('armoryStatus').textContent=translateText('Finish the match and leave the party before changing your armory.');return;}
  savingArmory=true;const currentUser=user,version=sessionVersion;$('armoryStatus').textContent=translateText('Saving…');
  try{const result=await runTransaction(ref(db,`players/${currentUser.uid}`),current=>{if(!current||!Number.isInteger(current.xp))return;const armory=change(current.armory);if(!armory)return;const old=readArmory(current.armory);if(characterProgress(current.xp).level<5&&(armory.supply>old.supply||armory.safeguard>old.safeguard))return;return {...current,armory};},{applyLocally:false});
    if(version!==sessionVersion||user?.uid!==currentUser.uid)return;
    if(!result.committed){$('armoryStatus').textContent=translateText('Not enough scrap or the armory changed. Please try again.');return;}
    profile=result.snapshot.val();commandCenter?.render();if(gameControl?.canEditSkills())gameControl.resetSkills();$('armoryStatus').textContent=translateText('Saved for your next match.');renderArmory();
  }catch(error){if(version===sessionVersion)$('armoryStatus').textContent=translateText('Could not save. Check your connection and database rules.');}
  finally{if(version===sessionVersion)savingArmory=false;}
}
$('armoryOpen').onclick=()=>{if(!inSandbox()&&!canEditSkills()){$('saveStatus').textContent=translateText('Return to the Command Center to open the armory, or leave your party first.');return;}$('armoryStatus').textContent='';renderArmory();$('armoryDialog').showModal();};
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
