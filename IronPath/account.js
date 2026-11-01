import {SKILL_PATHS,parseBuild,encodeBuild,pointsLeft} from './skills.mjs';
import {createCoopRewardQueue} from './coop-rewards.mjs?v=20261101-coopxp1';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase, ref, onValue, runTransaction, get, remove, set, update, onDisconnect, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import { createFirebasePartyLobby } from './firebase-party-lobby.mjs?v=20261101-skills1';
import { createFourDigitPanel } from './firebase-four-digit-panel.mjs?v=20261101-skills1';
import { createFourDigitLobby } from './firebase-four-digit-lobby.mjs?v=20261101-fourstage1';
import { startGame } from './game.js?v=20261101-skills1';
import { createFirebasePartyGame } from './firebase-party-game.mjs?v=20261101-skills1';
import { createPlayer } from './match.mjs?v=20261101-skills1';
import { characterProgress } from './progression.mjs?v=20261031-rpg2';

window.ironPathLoaded = true;
const app = initializeApp({apiKey:'AIzaSyC_1iHc7YREzKAGH9YbdO5bMTEtE4edPiE',authDomain:'iron-path-dc727.firebaseapp.com',databaseURL:'https://iron-path-dc727-default-rtdb.europe-west1.firebasedatabase.app',projectId:'iron-path-dc727',storageBucket:'iron-path-dc727.firebasestorage.app',messagingSenderId:'305063261861',appId:'1:305063261861:web:8ec54d8318a983fce3ff4c'});
const auth=getAuth(app), db=getDatabase(app), $=id=>document.getElementById(id);
let profile=null, user=null, unsubscribe=null, sessionVersion=0, gameStarted=false, notifySession=()=>{}, gameControl=null;
// Limited live alpha test: publicly accessible; not a security boundary.
const partySdk={ref,onValue,runTransaction,get,remove,set,update,onDisconnect,serverTimestamp};
const partyPanel=createFourDigitPanel({document,createApproval:lobby=>createFourDigitLobby({db,auth,sdk:partySdk,lobby}),createLobby:()=>createFirebasePartyLobby({db,auth,sdk:partySdk}),getProfile:()=>({name:profile.name,gender:profile.gender,level:level(profile.xp),...(profile.skills?{skills:profile.skills}:{})}),confirmMatch:()=>gameControl?.confirmParty()??false,onLeaveMatch:()=>gameControl?.leaveCoop(),onJoinMatch:(party,onUpdate)=>{const uid=auth.currentUser?.uid,version=sessionVersion;const rewardQueue=createCoopRewardQueue({db,auth,sdk:partySdk,partyId:party.partyId,onStatus:status=>{if(version===sessionVersion&&auth.currentUser?.uid===uid)$('saveStatus').textContent=status==='saved'?'Co-op wave XP saved.':'Co-op XP could not be saved yet. Check Firebase rules and connection.';}});const joined=gameControl?.beginCoop(callbacks=>createFirebasePartyGame({db,auth,sdk:partySdk,...party,players:party.profiles?.map((p,i)=>createPlayer(party.playerIds[i],p,i?800:850,450)),...callbacks,onWaveRewards:mask=>rewardQueue.observe(mask)}),onUpdate)??false;if(!joined)rewardQueue.close();return joined;},confirmClose:()=>window.confirm("Close the party? This ends co-op for both players."),enabled:true});
const level=xp=>characterProgress(xp).level;
const levelText=xp=>{const p=characterProgress(xp);return `LEVEL ${p.level} · ${p.current} / ${p.required} XP`;};
function display(view){$('loading').hidden=view!=='loading';$('authView').hidden=view!=='auth';$('connectionView').hidden=view!=='connection';$('characterView').hidden=view!=='character';$('entry').hidden=view==='game';$('gameView').hidden=view!=='game';}
function message(text){$('entryMessage').textContent=text;}
function errorText(error){const code=error?.code||'';if(code.includes('invalid-credential')||code.includes('wrong-password')||code.includes('user-not-found'))return 'Incorrect email or password.';if(code.includes('email-already-in-use'))return 'This email is already registered. Sign in instead.';if(code.includes('weak-password'))return 'Please choose a stronger password.';if(code.includes('invalid-email'))return 'Please enter a valid email address.';if(code.includes('network'))return 'Network error. Check your connection and try again.';if(code.includes('permission-denied')||code.includes('permission_denied'))return 'Database access denied. The Iron Path database rules may need to be deployed.';return 'Could not complete the request. Please try again. '+(code?`(${code})`:'');}
async function busy(button, task){if(button.disabled)return;button.disabled=true;message('');try{await task();}catch(e){message(errorText(e));}finally{button.disabled=false;}}
$('authForm').addEventListener('submit',e=>{e.preventDefault();busy(e.submitter,()=>signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value));});
$('register').onclick=e=>{if(!$('authForm').reportValidity())return;busy(e.currentTarget,()=>createUserWithEmailAndPassword(auth,$('email').value.trim(),$('password').value));};
$('forgot').onclick=e=>{const email=$('email').value.trim();if(!email){message('Enter your email address first.');return;}busy(e.currentTarget,async()=>{await sendPasswordResetEmail(auth,email);message('If the email is registered, a reset email may arrive shortly.');});};
async function logout(){try{await partyPanel.leaveForLogout();await signOut(auth);}catch(e){message(errorText(e));$('saveStatus').textContent=errorText(e);}}
$('logout').onclick=logout; $('setupLogout').onclick=logout; $('errorLogout').onclick=logout; $('retryProfile').onclick=()=>{if(user){message('');display('loading');loadProfile(user,sessionVersion);}};
$('characterForm').addEventListener('submit',e=>{e.preventDefault();const name=$('soldierName').value.trim();if(name.length<2||name.length>24){message('Soldier name must be 2–24 characters.');return;}const currentUser=user, version=sessionVersion;busy(e.submitter,async()=>{const result=await runTransaction(ref(db,`players/${currentUser.uid}`),current=>current===null?{name,gender:$('gender').value,xp:0}:undefined,{applyLocally:false});if(version!==sessionVersion)return;if(!result.committed&&result.snapshot.exists())loadProfile(currentUser,version);});});
function showProfile(value){profile=value;$('profileName').textContent=value.name;$('profileLevel').textContent=levelText(value.xp);$('profileStats').textContent=`HERO DAMAGE: ${10+Math.min(level(value.xp)-1,20)+2*parseBuild(value.skills,level(value.xp)).assault} / SHOT`;$('saveStatus').textContent='';display('game');if(!gameStarted){gameStarted=true;gameControl=startGame(account);}else notifySession();}
function loadProfile(currentUser,version){if(unsubscribe)unsubscribe();unsubscribe=onValue(ref(db,`players/${currentUser.uid}`),snap=>{if(version!==sessionVersion)return;const value=snap.val();if(!value){profile=null;display('character');return;}if(typeof value.name!=='string'||!['male','female'].includes(value.gender)||!Number.isInteger(value.xp)||value.xp<0){profile=null;display('connection');message('Your soldier data is invalid. Please contact support.');return;}const first=!profile;profile=value;$('profileName').textContent=value.name;$('profileLevel').textContent=levelText(value.xp);$('profileStats').textContent=`HERO DAMAGE: ${10+Math.min(level(value.xp)-1,20)+2*parseBuild(value.skills,level(value.xp)).assault} / SHOT`;if(first)showProfile(value);},error=>{if(version!==sessionVersion)return;profile=null;display('connection');message(errorText(error));});}
const account={getProfile:()=>profile,getUserId:()=>user?.uid,getToken:()=>{if(!user)throw new Error('Sign in required');return user.getIdToken();},getLevel:()=>level(profile?.xp||0),isReady:()=>!!profile&&!!user,onSessionChange:callback=>{notifySession=callback;},awardXP:async amount=>{const currentUser=user,version=sessionVersion;if(!currentUser||!profile)return;$('saveStatus').textContent=`Saving +${amount} XP…`;try{const result=await runTransaction(ref(db,`players/${currentUser.uid}/xp`),xp=>typeof xp==='number'?xp+amount:undefined,{applyLocally:false});if(version!==sessionVersion)return;$('saveStatus').textContent=result.committed?`+${amount} XP saved.`:'XP could not be saved.';}catch(e){if(version===sessionVersion)$('saveStatus').textContent='XP could not be saved. Check your connection and database rules.';}}};
onAuthStateChanged(auth,currentUser=>{if($('skillDialog').open)$('skillDialog').close();partyPanel.reset();partyPanel.collapse();sessionVersion++;const version=sessionVersion;if(unsubscribe){unsubscribe();unsubscribe=null;}profile=null;user=currentUser;notifySession();message('');$('password').value='';if(!currentUser){display('auth');return;}display('loading');loadProfile(currentUser,version);},error=>{display('auth');message(errorText(error));});

let draftSkills=null;
function canEditSkills(){return !!profile&&!partyPanel.isActive()&&!!gameControl?.canEditSkills();}
function renderSkills(){
  const container=$('skillPaths');container.replaceChildren();const lvl=level(profile.xp),left=pointsLeft(draftSkills,lvl);
  $('skillPoints').textContent=`LEVEL ${lvl} · ${left} SKILL POINT${left===1?'':'S'} AVAILABLE`;
  for(const path of SKILL_PATHS){
    const card=document.createElement('section'),title=document.createElement('strong'),description=document.createElement('small'),actions=document.createElement('div'),rank=document.createElement('button'),active=document.createElement('button');
    card.className='skill-path';actions.className='skill-path-actions';title.textContent=`${path.name.toUpperCase()} · RANK ${draftSkills[path.id]} / 3`;description.textContent=`Passive: ${path.passive}. Ability: ${path.ability} — ${path.description}`;
    rank.type='button';rank.textContent='UPGRADE · 1 POINT';rank.disabled=!left||draftSkills[path.id]>=3;rank.onclick=()=>{draftSkills[path.id]++;renderSkills();};
    active.type='button';active.textContent=draftSkills.active===path.id?'ACTIVE ABILITY':'SELECT ABILITY';active.setAttribute('aria-pressed',String(draftSkills.active===path.id));active.onclick=()=>{draftSkills.active=path.id;renderSkills();};
    actions.append(rank,active);card.append(title,description,actions);container.append(card);
  }
}
$('skillOpen').onclick=()=>{if(!canEditSkills()){$('saveStatus').textContent='Edit skills between matches, before building or joining a party.';return;}draftSkills=parseBuild(profile.skills,level(profile.xp));$('skillStatus').textContent='';renderSkills();$('skillDialog').showModal();};
$('skillReset').onclick=()=>{draftSkills=parseBuild(undefined,level(profile.xp));renderSkills();};
$('skillCancel').onclick=()=>$('skillDialog').close();
$('skillSave').onclick=async()=>{
  if(!canEditSkills()){$('skillStatus').textContent='Leave the party and finish the match before changing skills.';return;}
  const currentUser=user,version=sessionVersion,build=encodeBuild(draftSkills);$('skillSave').disabled=true;$('skillStatus').textContent='Saving…';
  try{
    const result=await runTransaction(ref(db,`players/${currentUser.uid}`),current=>{
      if(!current||!Number.isInteger(current.xp)||encodeBuild(parseBuild(build,level(current.xp)))!==build)return;
      return {...current,skills:build};
    },{applyLocally:false});
    if(version!==sessionVersion||user?.uid!==currentUser.uid)return;
    if(!result.committed){$('skillStatus').textContent='Could not save this build. Please try again.';return;}
    profile=result.snapshot.val();$('skillDialog').close();if(canEditSkills())gameControl.resetSkills();$('saveStatus').textContent='Skill build saved for the next match.';
  }catch(error){if(version===sessionVersion)$('skillStatus').textContent='Could not save skills. Check your connection and Firebase rules.';}
  finally{$('skillSave').disabled=false;}
};
