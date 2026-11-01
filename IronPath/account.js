import {renderSkillTree,armoryIcon} from './development-ui.mjs?v=20261102-tree1';
import {ITEMS,readArmory,rewardWave,upgradeArmory,equipArmory,encodeLoadout} from './armory.mjs';
import {SKILL_PATHS,parseBuild,encodeBuild,pointsLeft} from './skills.mjs';
import {createCoopRewardQueue} from './coop-rewards.mjs?v=20261101-armory1';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase, ref, onValue, runTransaction, get, remove, set, update, onDisconnect, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import { createFirebasePartyLobby } from './firebase-party-lobby.mjs?v=20261101-armory1';
import { createFourDigitPanel } from './firebase-four-digit-panel.mjs?v=20261101-skills1';
import { createFourDigitLobby } from './firebase-four-digit-lobby.mjs?v=20261101-fourstage1';
import { startGame } from './game.js?v=20261102-cartoon1';
import { createFirebasePartyGame } from './firebase-party-game.mjs?v=20261101-armory1';
import { createPlayer } from './match.mjs?v=20261101-armory1';
import { characterProgress } from './progression.mjs?v=20261031-rpg2';

window.ironPathLoaded = true;
const app = initializeApp({apiKey:'AIzaSyC_1iHc7YREzKAGH9YbdO5bMTEtE4edPiE',authDomain:'iron-path-dc727.firebaseapp.com',databaseURL:'https://iron-path-dc727-default-rtdb.europe-west1.firebasedatabase.app',projectId:'iron-path-dc727',storageBucket:'iron-path-dc727.firebasestorage.app',messagingSenderId:'305063261861',appId:'1:305063261861:web:8ec54d8318a983fce3ff4c'});
const auth=getAuth(app), db=getDatabase(app), $=id=>document.getElementById(id);
let profile=null, user=null, unsubscribe=null, sessionVersion=0, gameStarted=false, notifySession=()=>{}, gameControl=null;
// Limited live alpha test: publicly accessible; not a security boundary.
const partySdk={ref,onValue,runTransaction,get,remove,set,update,onDisconnect,serverTimestamp};
const partyPanel=createFourDigitPanel({document,createApproval:lobby=>createFourDigitLobby({db,auth,sdk:partySdk,lobby}),createLobby:()=>createFirebasePartyLobby({db,auth,sdk:partySdk}),getProfile:()=>({name:profile.name,gender:profile.gender,level:level(profile.xp),...(profile.skills?{skills:profile.skills}:{}),...(profile.armory?{loadout:encodeLoadout(profile.armory)}:{})}),confirmMatch:()=>gameControl?.confirmParty()??false,onLeaveMatch:()=>gameControl?.leaveCoop(),onJoinMatch:(party,onUpdate)=>{const uid=auth.currentUser?.uid,version=sessionVersion;const rewardQueue=createCoopRewardQueue({db,auth,sdk:partySdk,partyId:party.partyId,onStatus:status=>{if(version===sessionVersion&&auth.currentUser?.uid===uid)$('saveStatus').textContent=status==='saved'?'Co-op wave XP and loot saved.':'Co-op XP and loot could not be saved yet. Check Firebase rules and connection.';}});const joined=gameControl?.beginCoop(callbacks=>createFirebasePartyGame({db,auth,sdk:partySdk,...party,players:party.profiles?.map((p,i)=>createPlayer(party.playerIds[i],p,i?800:850,450)),...callbacks,onWaveRewards:mask=>rewardQueue.observe(mask)}),onUpdate)??false;if(!joined)rewardQueue.close();return joined;},confirmClose:()=>window.confirm("Close the party? This ends co-op for both players."),enabled:true});
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
function showProfile(value){profile=value;$('profileName').textContent=value.name;$('profileLevel').textContent=levelText(value.xp);$('profileStats').textContent=`HERO DAMAGE: ${10+Math.min(level(value.xp)-1,20)+2*parseBuild(value.skills,level(value.xp)).assault+(readArmory(value.armory).equipped===1?3:0)} / SHOT`;$('saveStatus').textContent='';display('game');if(!gameStarted){gameStarted=true;gameControl=startGame(account);}else notifySession();}
function loadProfile(currentUser,version){if(unsubscribe)unsubscribe();unsubscribe=onValue(ref(db,`players/${currentUser.uid}`),snap=>{if(version!==sessionVersion)return;const value=snap.val();if(!value){profile=null;display('character');return;}if(typeof value.name!=='string'||!['male','female'].includes(value.gender)||!Number.isInteger(value.xp)||value.xp<0){profile=null;display('connection');message('Your soldier data is invalid. Please contact support.');return;}const first=!profile;profile=value;$('profileName').textContent=value.name;$('profileLevel').textContent=levelText(value.xp);$('profileStats').textContent=`HERO DAMAGE: ${10+Math.min(level(value.xp)-1,20)+2*parseBuild(value.skills,level(value.xp)).assault+(readArmory(value.armory).equipped===1?3:0)} / SHOT`;if(first)showProfile(value);},error=>{if(version!==sessionVersion)return;profile=null;display('connection');message(errorText(error));});}
const account={getProfile:()=>({...profile,loadout:encodeLoadout(profile?.armory)}),getUserId:()=>user?.uid,getToken:()=>{if(!user)throw new Error('Sign in required');return user.getIdToken();},getLevel:()=>level(profile?.xp||0),isReady:()=>!!profile&&!!user,onSessionChange:callback=>{notifySession=callback;},awardXP:async (amount,wave)=>{const currentUser=user,version=sessionVersion;if(!currentUser||!profile||!Number.isInteger(wave)||wave<1||wave>10)return;$('saveStatus').textContent=`Saving +${amount} XP and loot…`;try{const result=await runTransaction(ref(db,`players/${currentUser.uid}`),current=>current&&Number.isInteger(current.xp)&&current.xp+amount<=10000000?{...current,xp:current.xp+amount,armory:rewardWave(current.armory,wave)}:undefined,{applyLocally:false});if(version!==sessionVersion)return;$('saveStatus').textContent=result.committed?`+${amount} XP and wave loot saved.`:'XP and loot could not be saved.';}catch(e){if(version===sessionVersion)$('saveStatus').textContent='XP and loot could not be saved. Check your connection and database rules.';}}};
onAuthStateChanged(auth,currentUser=>{if($('skillDialog').open)$('skillDialog').close();if($('armoryDialog').open)$('armoryDialog').close();partyPanel.reset();partyPanel.collapse();sessionVersion++;const version=sessionVersion;if(unsubscribe){unsubscribe();unsubscribe=null;}profile=null;user=currentUser;notifySession();message('');$('password').value='';if(!currentUser){display('auth');return;}display('loading');loadProfile(currentUser,version);},error=>{display('auth');message(errorText(error));});

let draftSkills=null,selectedSkill={path:'assault',rank:1};
function canEditSkills(){return !!profile&&!partyPanel.isActive()&&!!gameControl?.canEditSkills();}
function renderSkills(){
  const lvl=level(profile.xp),left=pointsLeft(draftSkills,lvl),path=SKILL_PATHS.find(p=>p.id===selectedSkill.path)||SKILL_PATHS[0],rank=selectedSkill.rank,ability=rank===4;
  $('skillPoints').textContent=`LEVEL ${lvl}  ·  ${left} POINT${left===1?'':'S'} AVAILABLE`;
  renderSkillTree({document,container:$('skillPaths'),build:draftSkills,level:lvl,selected:selectedSkill,onSelect:(value,keyboard)=>{selectedSkill=value;renderSkills();if(keyboard)$('skillPaths').querySelector(`[data-path="${value.path}"][data-rank="${value.rank}"]`)?.focus({preventScroll:true});}});
  const action=$('skillDetailAction');$('skillDetailType').textContent=ability?'ACTIVE ABILITY':`${path.name.toUpperCase()} / PASSIVE`;
  $('skillDetailTitle').textContent=ability?path.ability:`${path.name} · Rank ${rank}`;
  $('skillDetailText').textContent=ability?`${path.description} Choose one active ability; all passive upgrades remain active.`:`${path.passive}. ${draftSkills[path.id]} of 3 ranks unlocked.`;
  if(ability){action.textContent=draftSkills.active===path.id?'ABILITY SELECTED':'SELECT ABILITY';action.disabled=draftSkills.active===path.id;action.onclick=()=>{draftSkills.active=path.id;renderSkills();};}
  else {const unlocked=rank<=draftSkills[path.id],next=rank===draftSkills[path.id]+1;action.textContent=unlocked?'UNLOCKED':!next?'UNLOCK PREVIOUS RANK':!left?'NO POINTS AVAILABLE':'UPGRADE · 1 POINT';action.disabled=unlocked||!next||!left;action.onclick=()=>{if(rank===draftSkills[path.id]+1&&pointsLeft(draftSkills,level(profile.xp))>0){draftSkills[path.id]++;renderSkills();}};}
}
$('skillOpen').onclick=()=>{if(!canEditSkills()){$('saveStatus').textContent='Edit skills between matches, before building or joining a party.';return;}draftSkills=parseBuild(profile.skills,level(profile.xp));selectedSkill={path:'assault',rank:1};$('skillStatus').textContent='';renderSkills();$('skillDialog').showModal();};
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

function renderArmory(){
  const a=readArmory(profile.armory),list=$('armoryList');list.replaceChildren();$('armoryScrap').textContent=`${a.scrap} SCRAP`;
  const section=(name,caption)=>{const wrap=document.createElement('section'),head=document.createElement('div'),title=document.createElement('h3'),sub=document.createElement('span'),grid=document.createElement('div');wrap.className='armory-section';head.className='armory-section-head';title.textContent=name;sub.textContent=caption;head.append(title,sub);grid.className='armory-grid';wrap.append(head,grid);list.append(wrap);return grid;};
  const add=(grid,{icon,title,description,eyebrow,label,disabled,action,state,rank})=>{
    const card=document.createElement('article'),art=document.createElement('div'),body=document.createElement('div'),meta=document.createElement('span'),heading=document.createElement('h4'),text=document.createElement('p'),button=document.createElement('button');
    card.className=`armory-card ${state||''}`;art.className='armory-art';art.append(armoryIcon(document,icon));body.className='armory-card-body';meta.className='armory-meta';meta.textContent=eyebrow;heading.textContent=title;text.textContent=description;
    body.append(meta,heading,text);
    if(rank!==undefined){const ticks=document.createElement('div');ticks.className='armory-ranks';ticks.setAttribute('aria-label',`Rank ${rank} of 3`);for(let i=0;i<3;i++){const tick=document.createElement('i');if(i<rank)tick.className='filled';ticks.append(tick);}body.append(ticks);}
    button.type='button';button.textContent=label;button.disabled=disabled;button.onclick=action;body.append(button);card.append(art,body);grid.append(card);
  };
  const defenses=section('Bunker upgrades','SHARED DEFENSE');
  for(const [kind,name,description] of [['fortify','Fortification','+10 maximum bunker health per rank.'],['plating','Plating','10% less bunker damage per rank.']]){
    const rank=a[kind],cost=(rank+1)*30;add(defenses,{icon:kind,title:name,description:`${description} In co-op the highest player rank applies.`,eyebrow:'PERMANENT UPGRADE',rank,label:rank===3?'MAX RANK':`UPGRADE · ${cost} SCRAP`,disabled:rank===3||a.scrap<cost,action:()=>{if(window.confirm(`Upgrade ${name.toLowerCase()} for ${cost} scrap?`))void saveArmory(current=>upgradeArmory(current,kind));}});
  }
  const equipment=section('Your equipment','ONE SLOT');
  ITEMS.forEach((item,i)=>{const id=i+1,owned=!!(a.owned&(1<<i)),equipped=a.equipped===id;add(equipment,{icon:['scope','vest','boots'][i],title:item.name,description:item.description,eyebrow:equipped?'EQUIPPED':owned?'UNLOCKED':`WAVE ${id*2} REWARD`,state:equipped?'is-equipped':owned?'':'is-locked',label:owned?(equipped?'EQUIPPED':'EQUIP'):`UNLOCKS ON WAVE ${id*2}`,disabled:!owned||equipped,action:()=>void saveArmory(current=>equipArmory(current,id))});});
  const unequip=document.createElement('button');unequip.type='button';unequip.className='armory-unequip';unequip.textContent='UNEQUIP ITEM';unequip.disabled=a.equipped===0;unequip.onclick=()=>void saveArmory(current=>equipArmory(current,0));list.append(unequip);
}
async function saveArmory(change){
  if(!canEditSkills()){$('armoryStatus').textContent='Finish the match and leave the party before changing your armory.';return;}
  const currentUser=user,version=sessionVersion;$('armoryStatus').textContent='Saving…';
  try{const result=await runTransaction(ref(db,`players/${currentUser.uid}`),current=>{if(!current||!Number.isInteger(current.xp))return;const armory=change(current.armory);if(!armory)return;return {...current,armory};},{applyLocally:false});
    if(version!==sessionVersion||user?.uid!==currentUser.uid)return;
    if(!result.committed){$('armoryStatus').textContent='Not enough scrap or the armory changed. Please try again.';return;}
    profile=result.snapshot.val();if(canEditSkills())gameControl.resetSkills();$('armoryStatus').textContent='Saved for your next match.';renderArmory();
  }catch(error){if(version===sessionVersion)$('armoryStatus').textContent='Could not save. Check your connection and database rules.';}
}
$('armoryOpen').onclick=()=>{if(!canEditSkills()){$('saveStatus').textContent='Open the armory between matches, before building or joining a party.';return;}$('armoryStatus').textContent='';renderArmory();$('armoryDialog').showModal();};
$('armoryClose').onclick=()=>$('armoryDialog').close();
