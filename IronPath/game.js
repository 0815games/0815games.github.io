import {createSoloDeployment} from './core/solo-deployment.mjs?v=20261122-ring1';
import {newRunReceiptId} from './workshop/workshop-run-receipt.mjs?v=20261031-finale1';
import {canvasResolution} from './core/canvas-resolution.mjs?v=20261105-sharp1';
import {createMapZoom} from './core/map-zoom.mjs?v=20261105-sharp1';
import {featureEnabled} from './core/features.mjs?v=20261112-endless1';
import {localizeGameMessage} from './core/game-localization.mjs?v=20261122-ring1';
import {translateStoryDetail} from './core/story-localization.mjs?v=20261110-storyde1';
import {translateText as tr,getLanguage} from './language.mjs?v=20261122-ring1';
import {createSoldierMotion} from './core/soldier-motion.mjs?v=20261104-movement1';
import {bindDialogBackdrop} from './ui/dialog-dismiss.mjs?v=20261104-dismiss1';
import {createFocusPause} from './core/focus-pause.mjs?v=20261104-hostpause1';
import {cinematicFrames,cinematicScene,relicHandover} from './core/story-cinematics.mjs?v=20261031-finale2';
import {CAMPAIGN,campaignProgress,campaignMission,campaignAvailable,campaignDifficulty,campaignWaveContract,ACTS,actOf,actEndIndex,actComplete} from './core/campaign.mjs?v=20261112-pressure1';
import {RELICS,earnedRelicIds} from './core/relics.mjs?v=20261112-tagless1';
import {createStoryMission,storyStatus,stepStory,resolveStoryDecision,drainStoryNotifications} from './core/story-mission.mjs?v=20261111-events1';
import {STAGE_CAPTIONS,EVENT_TEMPLATES} from './core/story-events.mjs?v=20261206-acttwo1';
import {TRAINING_MISSION_ID,TRAINING_MAP,TRAINING_WAVES,TRAINING_BOSS_EVERY,FIRST_RUN_DEFEAT_XP,trainingContract,trainingStatus,trainingWon,trainingXP,trainingBonusXP,trainingSeen,markTrainingSeen,forgetTrainingSeen,trainingWaveRadioCue} from './core/training-run.mjs?v=20261122-ring1';
import {projectFourGameView} from './core/four-game-view.mjs?v=20261122-ring1';
import {createBattleViewportController} from './battle/battle-viewport-controller.mjs?v=20261122-ring1';
import {drawInBattleViewport} from './battle/battle-viewport.mjs?v=20261122-ring1';
import {waveRewardSummary,nextSteps} from './core/run-results.mjs?v=20261122-ring1';
import {reportRank} from './core/report-promotion.mjs?v=20261117-rank1';
// The rank mark is painted by the kit that owns ranks; the report only asks which one.
import {renderRankInsignia} from './core/rank-insignia.mjs?v=20261122-ring1';
import {createGroundTracks} from './core/ground-tracks.mjs?v=20261122-ring1';
import {projectCoopMotion} from './core/coop-motion.mjs?v=20261122-ring1';
import {bossPhaseLabel,bossTelegraph} from './core/boss-mechanics.mjs?v=20261031-finale1';
import {createBattleSound} from './battle/battle-sound.mjs?v=20261122-ring1';
import {RUN_PERKS,perkOffers} from './core/run-perks.mjs?v=20261102-terrain4';
import {TERRAIN_BRIEFINGS,ZONE_BRIEFINGS,terrainFor} from './core/terrain.mjs?v=20261124-zones1';
import {getMap,createRandomMapId,sectorOf} from './core/maps.mjs?v=20261122-ring1';
import {createCombatEffects} from './core/combat-fx.mjs?v=20261122-ring1';
import {drawCartoonBattle} from './core/cartoon-art.mjs?v=20261122-ring1';
import {abilityName,SKILL_PATH_MAP} from './core/skills.mjs?v=20261122-ring1';
import {classUpgradeState,classPathConfig,classPathInvested} from './core/tower-class-paths.mjs?v=20261122-ring1';
import {towerClassIcon} from './ui/development-ui.mjs?v=20261122-ring1';
import { COOP_SERVER_URL } from './core/coop-config.mjs?v=20261031-coopui1';
import { createCoopClient } from './core/coop-client.mjs?v=20261031-coopui1';
import { createCoopInput } from './core/coop-input.mjs?v=20261122-ring1';
import { createTutorial } from './core/tutorial.mjs?v=20261122-ring1';
import { createCoach, coachSeen, markCoachSeen } from './ui/first-run-coach.mjs?v=20261122-ring1';
import { abilityHud, abilityHudSvg } from './ui/ability-hud.mjs?v=20261122-ring1';
import { stepMatch, getTowerRange, STEP } from './core/simulation.mjs?v=20261122-ring1';
import { createPlayer, applyCommand, towerRefund, getSupplies, TOWER_COSTS, trainingBuildLocked } from './core/match.mjs?v=20261122-ring1';
import { ENEMY_TYPES, BOSSES,waveFormation,bossForWave,countFieldThreats } from './core/combat.mjs?v=20261122-ring1';
import { MAX_TOWER_LEVEL, upgradeCost, towerDisplay, characterProgress, towerUpgradeInvestment } from './core/progression.mjs?v=20261105-prestige1';
import { createBattleXpHud } from './battle/battle-xp-hud.mjs?v=20261117-hudxp1';
import { towerUpgradeCues } from './core/tower-upgrade-cue.mjs?v=20261122-ring1';
import { createFieldNotice } from './ui/field-notice.mjs?v=20261117-fieldnotice1';
import { createMapIntro } from './ui/map-intro.mjs?v=20261117-mapintro1';
import { specializationRank, upgradeCostFor, branchUnlockLevel } from './core/tower-specialization.mjs?v=20261122-ring1';
export function startGame(account, {coopUrl=COOP_SERVER_URL, clientFactory=createCoopClient, confirmAction=async()=>false, leaveParty=null, onForceCloseParty=null, nextMapId=createRandomMapId, experimentalFourViewport=false,experimentalWorkshop=false,deferTutorial=false,reducedGraphics=false,initialSettings=null,onReturnToCommand=()=>{},onResumeBattle=()=>{},onTrainingComplete=null,onRunFinished=()=>{},promptCenter=null,generalRadio=null}={}) {
  // One-way release teardown; the guarded caller still has to replace the
  // whole document, because the rest of this UI is not a reusable SPA.
  let releaseStopped=false,frameHandle=null;
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const logicalWidth=960;let logicalHeight=540;
  function setLogicalHeight(height,versus=false){if(logicalHeight!==height){logicalHeight=height;canvas.height=Math.round(canvas.width*height/logicalWidth);}canvas.dataset.lanes=versus?'versus':'single';}
  function prepareCanvas(){const size=canvasResolution(logicalWidth,logicalHeight,canvas.getBoundingClientRect(),window.devicePixelRatio);if(canvas.width!==size.width)canvas.width=size.width;if(canvas.height!==size.height)canvas.height=size.height;ctx.setTransform(size.width/logicalWidth,0,0,size.height/logicalHeight,0,0);return size.width/logicalWidth;}
  // Reduced motion is either the operating system's wish or the player's own
  // Graphics setting - the setting only ever makes it MORE reduced, never less, so a
  // soldier who needs it for medical reasons is never overruled by a game default.
  const systemReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let graphicsReduced=!!(reducedGraphics||initialSettings?.graphics==='reduced');
  let reducedMotion=systemReducedMotion||graphicsReduced;
  const visualPrefs={
    voiceOver:initialSettings?.voiceOver!==false,
    screenShake:initialSettings?.screenShake!==false,
    weatherEffects:initialSettings?.weatherEffects!==false,
    combatTracers:initialSettings?.combatTracers!==false,
    autoPause:initialSettings?.autoPause!==false,
    mapZoom:initialSettings?.mapZoom==='large'?'large':'fit',
  };
  function applyGraphics(reduced){graphicsReduced=!!reduced;reducedMotion=systemReducedMotion||graphicsReduced;syncAudioScene();}
  const sound=createBattleSound(window.AudioContext||window.webkitAudioContext);
  if(Number.isFinite(initialSettings?.volume))sound.setVolume(initialSettings.volume);
  if(Number.isFinite(initialSettings?.sfxVolume))sound.setSfxVolume?.(initialSettings.sfxVolume);
  if(Number.isFinite(initialSettings?.musicVolume))sound.setMusicVolume?.(initialSettings.musicVolume);
  if(typeof initialSettings?.musicEnabled==='boolean')sound.setMusicEnabled?.(initialSettings.musicEnabled);
  let soundEnabled=false;
  let desiredSoundEnabled=initialSettings?.soundEnabled!==false&&Math.round((initialSettings?.volume??0.7)*100)>0;
  let missionVoiceActive=false,actIntroActive=false,radioSpeaking=false;
  let currentAudioView='menu';
  let focusPause=null;
  function syncVoiceDucking(){sound.setVoiceDucking?.(missionVoiceActive||actIntroActive||radioSpeaking);}
  const stopRadioWatch=generalRadio?.subscribe?.(snap=>{const next=!!snap?.speaking;if(next!==radioSpeaking){radioSpeaking=next;syncVoiceDucking();}});
  function syncAudioScene(){
    if(releaseStopped)return;
    const isMenuView=currentAudioView!=='battle'&&currentAudioView!=='online';
    const ready=account?.isReady?.()!==false;
    const paused=!!(!ready||$('gameConfirm')?.open||$('settingsDialog')?.open||(visualPrefs.autoPause&&focusPause?.isSoloPaused?.()));
    if(!ready){
      sound.setScene?.({phase:'silent',paused:true,weatherEffects:visualPrefs.weatherEffects});
      return;
    }
    if(isMenuView){
      sound.setScene?.({phase:'menu',paused,weatherEffects:visualPrefs.weatherEffects});
      return;
    }
    const activeMap=state?.mapId?getMap(state.mapId):null;
    const bossAlive=!!state?.enemies?.some?.(e=>e.boss&&e.hp>0);
    const interval=activeTraining&&!coop?TRAINING_BOSS_EVERY:5;
    const bossWave=!!(state?.running&&state?.wave>0&&state.wave%interval===0);
    const phase=state?.ended?'menu':(bossAlive||bossWave)?'boss':state?.running?'wave':'prep';
    sound.setScene?.({
      phase,
      storyMissionId:!coop&&activeMission?activeMission.id:null,
      theme:activeMap?.theme||null,
      weatherEffects:visualPrefs.weatherEffects,
      paused:paused||!!cinematic,
    });
  }
  function ensureAudioGesture(){
    if(!desiredSoundEnabled)return;
    if(!soundEnabled){
      void sound.setEnabled(true).then(ok=>{soundEnabled=ok;if(ok)syncAudioScene();}).catch(()=>{});
    }else if(sound.needsResume?.()){
      void sound.resume().then(ok=>{if(ok)syncAudioScene();}).catch(()=>{});
    }
  }
  const onAudioGestureUnlock=()=>ensureAudioGesture();
  try{
    document.addEventListener('pointerdown',onAudioGestureUnlock,true);
    document.addEventListener('keydown',onAudioGestureUnlock,true);
  }catch{/* minimal DOM */}
  // Two independent track recorders: one for the local battlefield, one for the
  // opponent's. Sharing a single recorder (as the first version of this did)
  // makes each view delete the other's player trackers every frame, because a
  // tracker for a player the other state does not contain is dropped as stale -
  // so in versus play no footprint was ever laid at all.
  const combatFx=createCombatEffects({reducedMotion}),soldierMotion=createSoldierMotion(),rivalMotion=createSoldierMotion(),groundTracks=createGroundTracks(),rivalGroundTracks=createGroundTracks();let lastSnapshotAt=0;
  const types = [
    {name:'MG Nest',cost:TOWER_COSTS[0],range:125,damage:10,interval:.55,color:'#d9d884',description:'Fast fire · strong vs infantry and scouts; weak vs armor and aircraft'},
    {name:'Cannon',cost:TOWER_COSTS[1],range:145,damage:34,interval:1.4,color:'#e49b67',description:'Heavy damage · strong vs tanks; weak vs aircraft'},
    {name:'Flak',cost:TOWER_COSTS[2],range:155,damage:17,interval:.8,color:'#8cc0a6',description:'Long range · strong vs aircraft; weaker vs tanks'},
    {name:'Sniper',cost:TOWER_COSTS[3],range:210,damage:45,interval:1.8,color:'#a9a4d4',description:'Extreme range · strong vs infantry; anti-armor upgrade available'}
  ];
  const branches = [
    [{name:'Twin MG',damage:1,interval:.55,range:1,description:'45% shorter firing interval',rank2:'Suppression nest: every hit pins ground enemies for 1s',rank3:'Full damage against aircraft'}, {name:'Heavy MG',damage:2.1,interval:1,range:1,description:'110% more damage per shot',rank2:'Interdiction: every hit pins ground enemies for 2s',rank3:'Pinned enemies take 10% more damage from ALL towers'}],
    [{name:'Rapid Cannon',damage:1,interval:.6,range:1,description:'40% shorter firing interval',rank2:'Autoloader: hits stagger tanks for half a second',rank3:'Every sixth shot splashes 25% onto enemies within 40px'}, {name:'Siege Cannon',damage:2.1,interval:1,range:1,description:'110% more damage per shot',rank2:'Counter-battery: hits mark tanks for 3s; marked tanks take 20% more damage from ALL towers',rank3:'Shots clear dust clouds at the impact point'}],
    [{name:'Twin Flak',damage:1,interval:.55,range:1,description:'45% shorter firing interval',rank2:'Barrage: hits chain 20% onto one nearby enemy',rank3:'15% more range against aircraft'}, {name:'Long-range Flak',damage:1.3,interval:1,range:1.45,description:'45% more range and 30% more damage',rank2:'Spotting station: hits mark targets for 3s; rifle criticals deal 25% more to marked',rank3:'Radar: ignores dust clouds'}],
    [{name:'Marksman',damage:1,interval:.6,range:1,description:'40% shorter firing interval',rank2:'Duelist: critical hit every third shot',rank3:'Criticals deal 50% more damage to pinned enemies'}, {name:'Anti-armor Rifle',damage:2,interval:1,range:1.1,description:'100% more damage, 10% more range and another 40% damage against tanks',rank2:'Tank breaker: hits slow tanks for 2s',rank3:'Consecutive hits on the same tank stack 8% each, up to 40%'}]
  ];
  for(const variants of branches){variants.push({name:'Veteran Kit',damage:1.4,interval:.85,range:1.15,description:'Upgrader must be level 5 · 40% more damage, 15% faster fire and 15% more range',rank2:'Commanded crew: fires 10% faster while your soldier stands near',rank3:'This tower\'s upgrades cost 15% less'});variants.push({name:'Boss Hunter',damage:1,interval:1.25,range:1,description:'Upgrader must be level 10 · fires 20% slower but deals 50% more damage to bosses.',rank2:'Trophy gun: 25% more damage while a boss shield is up',rank3:'A boss finished by this gun pays +25 supplies'});}
  const keys = new Set();
  let state, selectedMap=nextMapId(), activeMission=null, activeStory=null, activeTraining=false, trainingDone=false, trainingBonusPaid=false, trainingRewards=true, trainingWaveFloor=0, accumulator=0, menuPad=null, coop=null, coopInput=null, coopReady=false, lastDirection='0,0', needStop=false,seenCoopWaves=0,seenCoopCaches=0,coopHasBaseline=false,bossSignal=null,hostFocusPaused=false,rosterGeneration=0,focusGeneration=0,promptEpoch=0;
  // Online UI normally repaints on snapshots, not animation frames. The
  // fallback controls must reappear immediately when a card is put aside.
  const stopPromptWatch=promptCenter?.onChange?.(()=>{if(state&&!releaseStopped)updateUI();});
  // A deployed free-play field is already an operation even before wave one or
  // a tower exists. Keep it resumable and do not reload it for a normal update.
  let soloDeployed=false,trainingHandoffs=0;
  // The endless launch dialog lets the soldier pick a region; free maps are
  // redrawn until they match. Null means true random (the shipped default).
  let endlessTheme=null;
  function drawFreeMapId(previous){
    for(let i=0;i<14;i++){const id=nextMapId(previous);if(!endlessTheme||getMap(id).theme===endlessTheme)return id;previous=id;}
    return nextMapId(previous);
  }
  let cinematic=null,radioTime=0,commandMenuOpen=false,missionBoardOpen=false;
  function closeCinematic(continueScene=true){if(!cinematic)return;stopMissionVoice();const callback=cinematic.done;cinematic=null;if($('storyCinematic').open)$('storyCinematic').close();keys.clear();accumulator=0;if(continueScene&&callback)callback();}
  function showCinematic(mission,kind,done=null,finishLabel=null){
    // An act finale ends with the bearer's relict handover: four extra frames
    // over the act's key art. cinematicFrames stays pure; the handover is a
    // presentation tail, so replays and translations address a stable coda.
    const frames=cinematicFrames(mission,kind).concat(kind==='ending'?relicHandover(mission):[]);if(!frames.length){if(done)done();return;}closeCinematic(false);keys.clear();sendDirection();accumulator=0;cinematic={mission,kind,frames,index:0,done,finishLabel};const scene=cinematicScene(mission,kind);$('storyCinematic').dataset.location=scene?.art||'valley';$('storyCinematic').dataset.weather=scene?.weather||'mist';$('cinematicLocation').textContent=tr(scene?.place||'');$('storyCinematic').dataset.act=mission.act.includes('ACT III')?'3':mission.act.includes('ACT II')?'2':'1';renderCinematic();$('storyCinematic').showModal();
  }
  function renderCinematic(){const {mission,kind,frames,index,finishLabel}=cinematic,frame=frames[index],scene=cinematicScene(mission,kind),art=frame.art||scene?.art||'valley',place=frame.place||scene?.place||'';$('cinematicProgress').max=frames.length;$('cinematicProgress').value=index+1;$('storyCinematic').dataset.location=art;$('cinematicAct').textContent=`${tr(mission.act)} / ${tr(kind==='intro'?'BRIEFING':'DEBRIEF')} · ${tr(place)}`;$('cinematicCount').textContent=`${index+1} / ${frames.length}`;$('cinematicLocation').textContent=tr(place);$('cinematicTitle').textContent=tr(mission.title);$('cinematicSpeaker').textContent=frame.speaker==='NARRATOR'?tr('FIELD REPORT'):frame.speaker;$('cinematicText').textContent=tr(frame.text);$('cinematicInitial').textContent=frame.speaker==='NARRATOR'?'◆':frame.speaker[0];$('storyCinematic').dataset.speaker=frame.speaker.toLowerCase();playMissionVoice(mission.id,kind,index);$('cinematicPrevious').disabled=index===0;$('cinematicNext').textContent=index===frames.length-1?tr(finishLabel|| (kind==='intro'?'DEPLOY':'VIEW RESULTS')):tr('NEXT →');}
  $('cinematicPrevious').onclick=()=>{if(cinematic&&cinematic.index>0){cinematic.index--;renderCinematic();}};
  $('cinematicNext').onclick=()=>{if(!cinematic)return;if(cinematic.index+1<cinematic.frames.length){cinematic.index++;renderCinematic();}else closeCinematic();};
  $('cinematicSkip').onclick=()=>closeCinematic();$('storyCinematic').addEventListener('cancel',e=>{e.preventDefault();closeCinematic();});bindDialogBackdrop($('storyCinematic'),()=>closeCinematic());
  const me=()=>coop?account.getUserId():'local';
  // The soldier tile reads only what the account has confirmed. There is no way
  // to hand it a wave's XP: a save that has not come back must not lift a level.
  const xpHud=createBattleXpHud({document,getProfile:()=>account.getProfile(),tr});
  let report=null,lastReport=null,hasCoopSnapshot=false,currentPartyEnd=null,partyFinalizationEnabled=false;const coopReports=new Map(),releaseReports=new Set();
  function newReport(id=null){
    // A previous report can still be waiting to subscribe to the profile, before
    // any Firebase write promise exists. Keep unresolved reports across resets.
    for(const old of releaseReports)if(!old.pending&&!old.statsPending&&!old.failed&&!old.statsFailed&&!old.disconnected&&(!old.campaign||old.campaignSaved===true))releaseReports.delete(old);
    const next={id,receiptId:null,mode:id?'coop':'solo',xp:0,scrap:0,items:[],levels:0,unlocks:[],pending:0,failed:false,statsPending:0,statsFailed:false,confirmedEarlier:false,finished:false,snapshot:null,playerId:null};releaseReports.add(next);return next;
  }
  // Every endless solo run gets one random receipt id; campaign sends null and keeps legacy saving.
  // Receipts are only sent when the gated workshop alpha is enabled, so the live
  // game never writes workshop fields before the candidate rules are approved.
  const runReceipt=()=>report&&!report.soloMission?report.receiptId:null;
  function addReward(target,detail){if(!target||!detail?.delta)return;const d=detail.delta;target.xp+=d.xp;target.scrap+=d.scrap;target.levels+=d.levels;target.items.push(...d.items);target.unlocks.push(...(d.unlocks||[]));if(!target.profile||(detail.profile?.xp||0)>=(target.profile.xp||0))target.profile=detail.profile;}
  // Count the actual promise before it starts. A rejected or unconfirmed save
  // prevents an automatic update; a timeout is not evidence of cancellation.
  function trackReportSave(target,work,{reward=false,statistic=false}={}){
    if(!target)return;const pending=statistic?'statsPending':'pending',failed=statistic?'statsFailed':'failed';target[pending]++;if(lastReport===target&&$('runResults').open)renderResults(target);
    const settle=detail=>{target[pending]--;if(detail?.committed){if(reward)addReward(target,detail);}else if(detail?.confirmed)target.confirmedEarlier=true;else target[failed]=true;if(lastReport===target&&$('runResults').open)renderResults(target);renderCampaign();};
    void Promise.resolve(work).then(settle,()=>settle(null)).catch(()=>{/* The save was already accounted for. */});
  }
  function recordCoopReward(id,status,detail,block=0){const target=coopReports.get(id);if(!target)return;const errors=target.errors||(target.errors=new Set());if(status==='saved'){addReward(target,detail);errors.delete(block);}else if(status==='error')errors.add(block);else if(status==='confirmed'){target.confirmedEarlier=true;errors.delete(block);}target.failed=errors.size>0;if(lastReport===target&&$('runResults').open)renderResults(target);}
  const storyProfile=target=>({...account.getProfile(),storyProgress:Math.max(campaignProgress(account.getProfile()),campaignProgress(target?.profile),target?.storyConfirmed||0)});
  function canReturnFromResults(target){return !!target&&(!target.campaign||target.campaignSaved===true)&&((target===report&&state.ended)||((target.left||target.partyClosed)&&!coop&&!state.running&&state.wave===0&&state.towers.length===0));}
  function campaignSaveProblem(reason){
  if(reason==='rejected')return 'The database rejected the mission save. The Iron Path database rules may need to be deployed.';
  if(reason==='timeout')return 'Saving mission progress timed out. Check your connection and retry.';
  if(reason==='locked')return 'Your saved story progress is behind this mission. Reload the page to sync, then replay it.';
  return 'Mission progress could not be confirmed. Retry saving before leaving.';
}
  // The ability HUD. One button on the field with its mark, its name and - the
  // part that used to be missing - the reason it cannot be used right now. The
  // reasons are ordered the way a player asks: over, nothing chosen, panel in
  // the way, recharging, party not ready, wave not started, nothing to hit.
  const ABILITY_STATE={
    ready:()=>tr('READY'),
    cooldown:hud=>tr('READY IN {seconds}s',{seconds:hud.seconds}),
    'no-targets':()=>tr('NO TARGETS'),
    'not-running':()=>tr('START THE WAVE'),
    'panel-open':()=>tr('CLOSE THE PANEL'),
    waiting:()=>tr('WAITING'),
    ended:()=>tr('OPERATION OVER'),
    'no-skill':()=>tr('CHOOSE IN SKILLS'),
  };
  let abilityView=null,abilityPending=false,abilityEmptyHinted=false,wasAbilityReady=false,abilityReadyNotified=false,abilityHintTimer=null;
  // The storage lives further down this closure; reading it too early would be
  // a question nobody asked, so the hint simply stays available instead.
  function hintStorage(){try{return tutorialStorage??null;}catch{return null;}}
  function abilityHint(){
    if(abilityHintTimer!==null){clearTimeout(abilityHintTimer);abilityHintTimer=null;}
    try{$('ability').classList.remove('ability-hud--new');void $('ability').offsetWidth;$('ability').classList.add('ability-hud--new');}catch{/* A stubbed field has no class list. */}
    abilityHintTimer=setTimeout(()=>{abilityHintTimer=null;try{$('ability').classList.remove('ability-hud--new');}catch{}},6000);
    abilityHintTimer?.unref?.();
  }
  function renderAbility(player){
    const hud=abilityHud({skills:player?.skills,cooldown:player?.cooldown,running:!!state.running,enemies:state.enemies?.length||0,menuOpen:!menu.hidden,coopReady:coop?coopReady:true,ended:!!state.ended});
    abilityView=hud;
    const node=$('ability');node.dataset.state=hud.reason;
    // A HUD that cannot be used is disabled - and the stylesheet takes it out of
    // the way entirely (pointer-events), so it never swallows a tap meant for a
    // build pad underneath it. That matters most in the state a new player sees
    // first: no ability chosen yet.
    node.disabled=!hud.ready||abilityPending;
    $('abilityName').textContent=tr(hud.name).toUpperCase();
    $('abilityState').textContent=(ABILITY_STATE[hud.reason]||ABILITY_STATE.ready)(hud);
    try{$('abilityIcon').innerHTML=abilityHudSvg(hud.active,{size:26,variant:hud.variant});}catch{/* No DOM in unit tests. */}
    try{node.setAttribute('aria-label',`${tr(hud.name)}: ${$('abilityState').textContent}`);}catch{}
    if(hud.reason==='cooldown')abilityReadyNotified=false;
    if(hud.reason==='no-skill'&&!abilityEmptyHinted){abilityEmptyHinted=true;warn(tr('Choose an ability under SKILLS in the command center.'));}
    if(hud.ready&&!wasAbilityReady&&!abilityReadyNotified){
      abilityReadyNotified=true;
      abilityHint();
      if(state?.running)sound.play('abilityReady');
      warn(()=>tr('{ability} is ready!',{ability:tr(hud.name)}));
      if(!coachSeen('ability-hud',hintStorage())){
        markCoachSeen('ability-hud',hintStorage());
        notice(()=>tr('{ability} is ready. Use it from the button at the bottom right of the field.',{ability:tr(hud.name)}));
      }
    }
    wasAbilityReady=hud.ready;
  }
function renderResults(target){
    const snapshot=target.snapshot;if(!snapshot)return;const waves=waveRewardSummary(snapshot,target.playerId),p=snapshot.players?.[target.playerId],damage=p?.towerDamage||[],combos=Object.entries(p?.comboCounts||{}).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
    const outcome=snapshot.fourInfo?.mode==='two-vs-two'?(snapshot.fourInfo.winnerTeam===null?'Match ended in a draw':snapshot.fourInfo.winnerTeam===snapshot.fourInfo.team?'Victory!':'Defeat'):snapshot.mode==='versus'?(snapshot.winnerId?(snapshot.winnerId===target.playerId?'Victory!':'Defeat'):'Match ended'):(target.left?'You left the operation':snapshot.endReason==='retired'?'Operation ended':snapshot.endReason==='training-complete'?'Training complete!':snapshot.endReason==='campaign-victory'?'Mission complete!':snapshot.endReason==='story-failure'?'Mission failed':'Bunker lost');
    $('resultsTitle').textContent=tr(outcome);$('runResults').dataset.outcome=['Victory!','Mission complete!','Training complete!'].includes(outcome)?'victory':['Defeat','Mission failed','Bunker lost'].includes(outcome)?'defeat':'neutral';
    $('resultsOutcome').textContent=target.training?tr('TRAINING CONTRACT · FIRST DEPLOYMENT'):target.soloMission?tr('CAMPAIGN · {title}',{title:tr(target.soloMission.title).toUpperCase()}):tr(snapshot.fourInfo?.mode==='two-vs-two'?'2 VS 2 · SURVIVAL':snapshot.fourInfo?.mode==='four-coop'?'FOUR-PLAYER CO-OP':snapshot.mode==='versus'?'1 VS 1 · SURVIVAL':target.mode==='coop'?'CO-OP OPERATION':'SOLO OPERATION');
    $('resultsWaves').textContent=tr(waves.count===1?'{count} wave completed · reached wave {wave}':'{count} waves completed · reached wave {wave}',{count:waves.count,wave:snapshot.wave||0})+'\n'+tr('Wave reward value: {xp} XP',{xp:waves.xp})+'\n'+tr(target.mode==='coop'&&snapshot.mode!=='versus'?'{count} enemies defeated (team)':'{count} enemies defeated',{count:snapshot.lootKills||0});
    $('resultsRewards').textContent=tr('Confirmed during this session: +{xp} XP · +{scrap} scrap',{xp:target.xp,scrap:target.scrap})+(target.items.length?'\n'+tr('New equipment: {items}',{items:target.items.map(x=>tr(x)).join(', ')}):'');
    $('resultsStatWaves').textContent=String(waves.count);$('resultsStatEnemies').textContent=String(snapshot.lootKills||0);$('resultsEnemiesLabel').textContent=tr(target.mode==='coop'&&snapshot.mode!=='versus'?'ENEMIES DEFEATED · TEAM':'ENEMIES DEFEATED');$('resultsStatDamage').textContent=String(Math.round(damage.reduce((sum,n)=>sum+(Number.isFinite(n)?n:0),0)));
    $('resultsRewardXp').textContent=tr('+{value} XP',{value:target.xp});$('resultsRewardScrap').textContent=`+${target.scrap}`;$('resultsEquipment').hidden=!target.items.length;$('resultsEquipment').textContent=target.items.length?tr('New equipment: {items}',{items:target.items.map(x=>tr(x)).join(', ')}):'';
    const currentProfile=account.getProfile(),profiles=[target.profile,currentProfile].filter(p=>Number.isSafeInteger(p?.xp)&&p.xp>=0),profile=profiles.sort((a,b)=>b.xp-a.xp)[0];$('resultsProgressSection').hidden=!profile;
    if(profile){const progress=characterProgress(profile.xp);$('resultsProgressLevel').textContent=tr('LEVEL {level}',{level:progress.level});$('resultsProgressBar').max=progress.required;$('resultsProgressBar').value=progress.current;$('resultsProgressText').textContent=tr('{current} / {required} XP to next level',{current:progress.current,required:progress.required});}
    // The rank sits next to the level because that is what a uniform shows:
    // derived from the confirmed profile, never stored. A promotion is claimed
    // only when the committed saves of THIS report carried the soldier across a
    // threshold - levels alone are not a new rank, and a pending save is not a
    // promotion.
    const standing=profile?reportRank({xp:profile.xp,levelsGained:target.levels}):null;
    $('resultsRank').hidden=!standing;
    if(standing){renderRankInsignia(document,$('resultsRankInsignia'),{level:standing.level},{size:22});$('resultsRankName').textContent=tr(standing.rank.name);}
    $('resultsPromotion').hidden=!standing?.promoted;
    if(standing?.promoted){renderRankInsignia(document,$('resultsPromotionInsignia'),{level:standing.level},{size:34});$('resultsPromotionRank').textContent=tr(standing.rank.name);$('resultsPromotionFrom').textContent=tr('Previously {rank}.',{rank:tr(standing.previous.name)});}
    // An earlier receipt may cover only one block. For coordinated parties,
    // show full confirmation only after every final mask has been verified.
    const coopUnconfirmed=target.mode==='coop'&&(target.partyFinalizationRequired?!target.partyRewardsConfirmed:!target.confirmedEarlier&&!target.partyRewardsConfirmed);
    $('runResults').dataset.save=target.failed?'failed':target.pending?'pending':target.disconnected||coopUnconfirmed?'uncertain':'confirmed';
    $('resultsDone').textContent=tr(canReturnFromResults(target)?'RETURN TO COMMAND CENTER':'CONTINUE');

    $('storyReplayEnding').hidden=!target.campaign||snapshot.endReason!=='campaign-victory';$('resultsStory').hidden=!target.storyMessage;if(target.storyMessage)$('resultsStory').textContent=translateStoryDetail(target.storyMessage,tr);
    $('resultsCampaign').hidden=!target.campaign;$('campaignRetry').hidden=!target.campaign||target.campaignSaved!==false;
    if(target.campaign)$('resultsCampaign').textContent=tr(target.campaignSaved===true?'Mission progress saved.':target.campaignSaved===false?campaignSaveProblem(target.campaignReason):'Saving mission progress…');
    $('resultsSave').textContent=tr(target.failed?'Some rewards could not be confirmed. Check your connection and save status.':target.pending?'Saving rewards…':target.disconnected?'This uses the last received snapshot. Reconnect to confirm any missing rewards.':target.partyRewardsConfirmed?'All completed-wave rewards are confirmed.':target.confirmedEarlier?'Some earlier rewards were already saved before this report; they are not counted twice.':target.mode==='coop'?'Rewards may still be saving or may have been saved before reconnecting.':'Only confirmed saves are counted above.')+(target.partyRewardsConfirmed&&target.confirmedEarlier?'\n'+tr('Some earlier rewards were already saved before this report; they are not counted twice.'):'')+(coopUnconfirmed&&target.confirmedEarlier&&!target.failed&&!target.pending&&!target.disconnected?'\n'+tr('Rewards may still be saving or may have been saved before reconnecting.'):'')+(target.partyFinalizationRequired&&!target.partyClosed&&target.partyWaitDetail?.missingEntries?.length?'\n'+tr('Waiting for reports and saved rewards from: {names}.',{names:target.partyWaitDetail.missingEntries.map(entry=>entry.state==='departed'?tr('{name} (left early)',{name:entry.name}):entry.state==='offline'?tr('{name} (offline)',{name:entry.name}):entry.name).join(', ')}):'')+(target.partyClosed?'\n'+tr('The host closed the party.'):'');
    $('resultsDamage').textContent=damage.some(n=>n>0)?damage.map((n,i)=>`${tr(types[i].name)}: ${Math.round(n||0)}`).join(' · '):tr('No tower damage recorded.');
    $('resultsCombos').textContent=combos.length?tr('Skill activity: {items}',{items:combos.map(([name,n])=>`${tr(name)} ×${n}`).join(' · ')}):tr('No skill combos or capstones activated.');
    $('resultsUnlocks').textContent=(target.levels?tr(target.levels===1?'{count} level gained · {count} new skill point.':'{count} levels gained · {count} new skill points.',{count:target.levels}):tr('No new level confirmed during this session.'))+(target.unlocks.length?'\n'+tr('New upgrades: {items}',{items:target.unlocks.map(x=>tr(x)).join(' · ')}):'');
    $('resultsNext').textContent=nextSteps(target.profile||account.getProfile(),tr);
    const mission=target.soloMission,index=CAMPAIGN.indexOf(mission),next=CAMPAIGN[index+1],eligible=!!mission&&target.mode==='solo'&&!coop&&state===snapshot&&state.ended&&target.accountId===account.getUserId()&&(typeof account.canChooseSolo!=='function'||account.canChooseSolo());
    const safe=eligible&&!target.pending&&(!target.campaign||target.campaignSaved===true);
    $('resultsReplayMission').hidden=!eligible;$('resultsReplayMission').disabled=!safe;
    $('resultsNextMission').hidden=!eligible||!next||!target.campaign;$('resultsNextMission').disabled=!safe||!next||!campaignAvailable(storyProfile(target),next.id);
    if(next)$('resultsNextMission').textContent=tr('NEXT: {title}',{title:tr(next.title).toUpperCase()});
    $('resultsForceCloseParty').hidden=!(target===lastReport&&target.partyFinalizationRequired&&!target.partyClosed&&target.partyWaitDetail?.canForceClose&&typeof onForceCloseParty==='function'&&(!coop||(state?.hostId===me()&&report?.id===target.id)));

  }
  function finishReport(target,snapshot,id,open=true){if(!target||!snapshot)return;fieldNotice.clear();const first=!target.finished;target.finished=true;closeMenu();keys.clear();if($('towerDetails').open)$('towerDetails').close();target.snapshot=snapshot;target.playerId=id;lastReport=target;$('viewResults').hidden=false;renderResults(target);if(open&&!$('runResults').open)$('runResults').showModal();
    // The statistics write is separate from wave rewards and must also settle
    // before a version-triggered reload. It is client-reported, not anti-cheat.
    if(!coop&&!activeMission&&!activeTraining&&snapshot.ended&&!target.endlessStatsSent){target.endlessStatsSent=true;if(typeof account.recordEndlessRun==='function')trackReportSave(target,account.recordEndlessRun({waves:Math.max(0,snapshot.wave||0),bosses:Math.floor(Math.max(0,snapshot.wave||0)/5),sector:Math.max(1,sectorOf(snapshot.mapId)||1),date:Date.now()}),{statistic:true});}
    // Campaign completion starts its save immediately after finishReport in the
    // same task. Deferring the check makes that save visible to the safety gate.
    if(first)queueMicrotask(()=>{try{onRunFinished();}catch{/* Checking must never break the finished report. */}});
  }
  $('campaignRetry').onclick=async()=>{const target=lastReport;if(!target?.campaign||target.campaignSaved!==false||target.accountId!==account.getUserId()||typeof account.saveCampaign!=='function')return;target.campaignSaved=null;target.campaignReason=null;renderResults(target);const result=await account.saveCampaign(target.campaign.id);target.campaignSaved=!!result?.committed&&campaignProgress(result.profile)>=CAMPAIGN.indexOf(target.campaign)+1;target.campaignReason=result?.reason||null;if(result?.profile){target.profile=result.profile;target.storyConfirmed=campaignProgress(result.profile);const finishedAct=actOf(target.campaign);if(finishedAct&&campaignProgress(result.profile)===actEndIndex(finishedAct)+1&&RELICS[finishedAct.relic])notice(tr('RELIC EARNED: {name}',{name:tr(RELICS[finishedAct.relic].name)}));}if(lastReport===target&&$('runResults').open)renderResults(target);renderCampaign();};
  function loadResultMission(next=false,versionChecked=false){
    const target=lastReport,mission=target?.soloMission,index=CAMPAIGN.indexOf(mission),destination=next?CAMPAIGN[index+1]:mission;
    if(!target||!mission||!destination||target.mode!=='solo'||coop||state!==target.snapshot||!state.ended||target.accountId!==account.getUserId()||target.pending||(target.campaign&&target.campaignSaved!==true)||(next&&!target.campaign)||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo())||!campaignAvailable(storyProfile(target),destination.id))return;
    if(!versionChecked&&typeof account.beforeNewGame==='function'){
      void Promise.resolve(account.beforeNewGame()).then(ok=>{if(ok&&lastReport===target)loadResultMission(next,true);}).catch(()=>{});return;
    }
    soloDeployed=true;activeMission=destination;selectedMap=destination.mapId;$('campaignSelect').value=destination.id;reset();onResumeBattle();notice(destination.stages[0].dialogue);showCinematic(destination,'intro');
  }
  $('storyReplayEnding').onclick=()=>{const target=lastReport;if(!target?.campaign||target.snapshot?.endReason!=='campaign-victory')return;$('runResults').close();showCinematic(target.campaign,'ending',()=>{if(lastReport===target&&target.accountId===account.getUserId()){renderResults(target);$('runResults').showModal();}});};
  $('resultsReplayMission').onclick=()=>loadResultMission();$('resultsNextMission').onclick=()=>loadResultMission(true);
  $('storyChoice0').onclick=()=>pickDecision(0);$('storyChoice1').onclick=()=>pickDecision(1);
  function hasResults(){return !!lastReport&&lastReport.accountId===account.getUserId();}
  function showResults(){if(!hasResults())return false;renderResults(lastReport);if(!$('runResults').open)$('runResults').showModal();return true;}
  $('resultsClose').onclick=()=>$('runResults').close();$('resultsDone').onclick=()=>{const go=canReturnFromResults(lastReport);$('runResults').close();if(go)onReturnToCommand();};$('resultsForceCloseParty').onclick=()=>{const target=lastReport;if(!target||!target.partyFinalizationRequired||target.partyClosed||!target.partyWaitDetail?.canForceClose||typeof onForceCloseParty!=='function')return;void onForceCloseParty(target.id,target.partyWaitDetail.endTick);};bindDialogBackdrop($('runResults'),()=>$('runResults').close());$('viewResults').onclick=showResults;

  const supplies=()=>getSupplies(state,me());
  // A large, horizontally scrollable map is the default in portrait on phones.
  const mapViewport=$('mapViewport'), zoomButton=$('mapZoom');
  const portrait=window.matchMedia('(max-width: 850px) and (orientation: portrait)');
  let largeMap=visualPrefs.mapZoom==='large', battleViewport=null, savedLargeMap=false, touchZoom=null, fullBattleView=false;
  // The controller selects on pointerup. Its subsequent compatibility click
  // must not close the sheet it just opened or activate a button underneath it.
  let viewportTap=null;
  document.addEventListener('pointerdown',()=>{viewportTap=null;},true);
  // V3 impact tracking: the bunker-hit camera shake is presentation only -
  // the seq comes from the authoritative state, the wobble is local.
  let lastImpactSeq=0, shakeStart=-1e9;
  function renderViewportLabels(){if(touchZoom&&!battleViewport){const zoomed=touchZoom.getFactor()>1.01;zoomButton.textContent=tr(zoomed?'MAP: FIT':'MAP: ZOOM');$('mapQuickZoom').textContent=tr(zoomed?'FIT MAP':'ZOOM MAP');$('mapHint').textContent=tr('Drag to pan, pinch or use the mouse wheel to zoom. Tap to build or move.');return;}if(battleViewport){const v=battleViewport.getViewport(),fit=Math.min(v.width/v.worldWidth,v.height/v.worldHeight),zoomed=v.scale>fit+1e-8;zoomButton.setAttribute('aria-pressed',String(zoomed));zoomButton.textContent=tr(zoomed?'MAP: FIT':'MAP: ZOOM');$('mapQuickZoom').textContent=tr(zoomed?'FIT MAP':'ZOOM MAP');$('mapHint').textContent=tr('Drag to pan, pinch or use the mouse wheel to zoom. Tap to build or move.');}else{zoomButton.textContent=tr(largeMap?'MAP: LARGE':'MAP: FIT');$('mapHint').textContent=tr(largeMap?'Swipe the map left or right to see the battlefield. Tap to build or move.':'Full map view. Tap MAP: FIT to enlarge it.');}}
  function setMapZoom(large){largeMap=large;mapViewport.classList.toggle('map-large',large);zoomButton.setAttribute('aria-pressed',String(large));renderViewportLabels();}
  setMapZoom(largeMap);
  // Touch devices start with the complete map; pinch and native scroll provide
  // precise inspection without changing the world coordinates or game state.
  const touchDevice=window.matchMedia('(pointer: coarse)');
  if(touchDevice.matches)touchZoom=createMapZoom({viewport:mapViewport,canvas,getLogicalSize:()=>({width:logicalWidth,height:logicalHeight}),isEnabled:()=>!battleViewport,onChange:factor=>{largeMap=factor>1.01;zoomButton.setAttribute('aria-pressed',String(largeMap));$('mapQuickZoom').textContent=tr(largeMap?'FIT MAP':'ZOOM MAP');zoomButton.textContent=tr(largeMap?'MAP: FIT':'MAP: ZOOM');}});
  // The startup labels were painted before touchZoom existed, so a phone open
  // showed the desktop hint until the first zoom. One repaint fixes that.
  renderViewportLabels();
  $('mapQuickZoom').addEventListener('click',()=>zoomButton.click());
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(state&&(coop||battleViewport||fullBattleView||wantsBattleViewport(getMap(state.mapId),state.mode==='versus',false)))updateUI();else if(touchZoom&&!battleViewport)touchZoom.resize(touchZoom.getFactor());}).observe(mapViewport);
  // The pointer is anchored to a world position, not to a pixel: whenever the field
  // moves under it, re-mark. Cheap, and the ring must never point at where the pad
  // used to be.
  const remarkCoach=()=>{try{coach.remark();}catch{}};
  zoomButton.addEventListener('click',()=>{remarkCoach();if(touchZoom&&!battleViewport){touchZoom.toggle();return;}if(battleViewport){const v=battleViewport.getViewport(),fit=Math.min(v.width/v.worldWidth,v.height/v.worldHeight);if(v.scale>fit+1e-8)battleViewport.reset();else{const fill=Math.max(v.width/v.worldWidth,v.height/v.worldHeight),map=getMap(state?.mapId),soloScale=!coop&&!map?.fourPlayer?1/fit:0;battleViewport.zoom(fullBattleView?Math.max(2,fill/fit,soloScale):Math.max(2,soloScale));}return;}const middle=(mapViewport.scrollLeft+mapViewport.clientWidth/2)/mapViewport.scrollWidth;setMapZoom(!largeMap);mapViewport.scrollLeft=middle*mapViewport.scrollWidth-mapViewport.clientWidth/2;});
  // Reported: "Bunker und Straßen Endpunkte passen nicht" - the quick-jump
  // buttons pinned to the left and right rim. Start and bunker sit wherever
  // the generated map puts them, so both buttons now aim at the real world
  // coordinates: the road's entry point and the bunker it ends in.
  const aimViewport=target=>{
    if(battleViewport){const v=battleViewport.getViewport(),visW=v.width/v.scale,visH=v.height/v.scale;
      battleViewport.pan((v.x+visW/2-target.x)*v.scale,(v.y+visH/2-target.y)*v.scale);return;}
    const m=getMap(state.mapId),fx=Math.max(0,Math.min(1,target.x/(m.width||960))),fy=Math.max(0,Math.min(1,target.y/(m.height||540)));
    mapViewport.scrollTo({left:fx*(mapViewport.scrollWidth-mapViewport.clientWidth),top:fy*(mapViewport.scrollHeight-mapViewport.clientHeight),behavior:'smooth'});
  };
  $('mapEntry').addEventListener('click',()=>{aimViewport(getMap(state.mapId).path[0]);remarkCoach();});
  // Classic maps predate explicit bunker coordinates; their renderer and
  // simulation use the same default. Keep the jump control usable there too.
  $('mapBunker').addEventListener('click',()=>{aimViewport(getMap(state.mapId).bunker||{x:900,y:400});remarkCoach();});
  portrait.addEventListener('change',()=>{if(touchZoom&&!battleViewport)touchZoom.resize(touchZoom.getFactor());remarkCoach();});
  window.addEventListener('resize',()=>{if(state)updateUI();remarkCoach();});
  // Two more ways the field moves under the card: the page itself is scrolled (the
  // phone browser toolbar collapsing, a bounce at the end of a swipe), and the map
  // viewport is scrolled sideways. `resize` does not fire for either, so the ring
  // stayed on the old pad while the card stayed put - the two drifted apart.
  window.addEventListener('scroll',remarkCoach,{passive:true});
  mapViewport.addEventListener('scroll',remarkCoach,{passive:true});
  function wantsBattleViewport(map,versus,fullBattle=false){
    const oversized=(map.width||960)>960||(map.height||540)>540;
    return !!(fullBattle||(versus?oversized:((oversized&&!map.fourPlayer)||(experimentalFourViewport&&map.fourPlayer))));
  }
  function syncBattleViewport(map,versus,fullBattle){
    // A 1v1 view contains two equal map-sized lanes and a 20px divider.
    // Classic maps omit their dimensions; checkpoints can still use them.
    const worldWidth=map.width||960,laneHeight=map.height||540,worldHeight=versus?laneHeight*2+20:laneHeight;
    const wanted=wantsBattleViewport(map,versus,fullBattle),current=battleViewport?.getViewport();
    // A new sector or mode must not keep the previous world's clipping bounds.
    const stale=!!current&&(current.worldWidth!==worldWidth||current.worldHeight!==worldHeight);
    if(wanted&&stale){battleViewport.destroy();battleViewport=null;}
    const openZoom=()=>{
      const v=battleViewport.getViewport(),fillScale=Math.max(v.width/v.worldWidth,v.height/v.worldHeight);
      // Co-op opens at exact fill scale; solo single-road sectors also open at >=1× reading scale on desktops while filling portrait phones edge-to-edge.
      const target=fullBattle?(!coop&&!map.fourPlayer?Math.max(fillScale,1):fillScale):(!map.fourPlayer?Math.max(1,v.scale):v.scale);
      if(v.scale<target)battleViewport.zoom(target/v.scale);
    };
    // On a tall phone the filled view can show only a slice of a wide map.
    // Start at this soldier rather than an arbitrary map centre. In a duel,
    // the local soldier is always in the upper lane of the projected view.
    const focusPlayer=()=>{const player=state.players?.[me()];if(Number.isFinite(player?.x)&&Number.isFinite(player?.y))aimViewport({x:player.x,y:player.y});};
    if(wanted&&!battleViewport){
      if(touchZoom){touchZoom.reset();canvas.style.width='';canvas.style.height='';}
      savedLargeMap=largeMap;setMapZoom(false);mapViewport.scrollLeft=0;mapViewport.scrollTop=0;
      battleViewport=createBattleViewportController({canvas,worldWidth,worldHeight,screenWidth:logicalWidth,screenHeight:logicalHeight,
        onTap:(point,event)=>{viewportTap={id:event.pointerId,x:event.clientX,y:event.clientY,time:Date.now()};void selectBattlePoint(point.x,point.y);},
        onChange:v=>{closeMenu();if(state)state.selectedPad=null;const fit=Math.min(v.width/v.worldWidth,v.height/v.worldHeight),zoomed=v.scale>fit+1e-8;zoomButton.setAttribute('aria-pressed',String(zoomed));zoomButton.textContent=tr(zoomed?'MAP: FIT':'MAP: ZOOM');$('mapQuickZoom').textContent=tr(zoomed?'FIT MAP':'ZOOM MAP');}});
      // Multiplayer and oversized solo sectors start large and undistorted on
      // phones, tablets and desktops. FIT shows the complete map; panning reaches the edges.
      if(fullBattle){openZoom();focusPlayer();}
      else if(!map.fourPlayer){const fit=Math.min(logicalWidth/worldWidth,logicalHeight/worldHeight);if(fit<1)battleViewport.zoom(1/fit);}
      renderViewportLabels();
    }else if(wanted&&battleViewport){
      const resized=current.width!==logicalWidth||current.height!==logicalHeight;
      const wasFilled=current.scale>=Math.max(current.width/current.worldWidth,current.height/current.worldHeight)-1e-8;
      if(resized)battleViewport.resize(logicalWidth,logicalHeight);
      if(fullBattle&&!fullBattleView){battleViewport.reset();openZoom();focusPlayer();}
      else if(fullBattle&&resized&&wasFilled){const next=battleViewport.getViewport(),fillScale=Math.max(next.width/next.worldWidth,next.height/next.worldHeight);if(next.scale<fillScale)battleViewport.zoom(fillScale/next.scale);}
      renderViewportLabels();
    }else if(!wanted&&battleViewport){
      battleViewport.destroy();battleViewport=null;setMapZoom(touchZoom?false:savedLargeMap);if(touchZoom)touchZoom.resize(1);
    }
    fullBattleView=!!(wanted&&fullBattle);
  }
  $('campaignSelect').value='free';
  // The act detail header is rendered per act at runtime (like the mission
  // cards, it never appears in static HTML); its parts are addressed through
  // one helper so the DOM contract only sees static ids.
  const actDetailEl=part=>$('actDetail'+part);
  function renderCampaign(){
    const profile=account.getProfile(),progress=campaignProgress(profile),selection=$('campaignSelect').value,mission=campaignMission(selection);
    const blocked=!!coop||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo());
    CAMPAIGN.forEach((m,i)=>{const locked=i>progress,complete=i<progress,card=$(`missionCard${i}`);$(`campaignOption${i}`).disabled=locked;$(`campaignOption${i}`).textContent=`${String(i+1).padStart(2,'0')} · ${locked?tr('CLASSIFIED'):tr(m.title)}`;if(!card)return;card.disabled=blocked||locked;card.dataset.status=locked?'locked':complete?'complete':'available';card.setAttribute('aria-pressed',String(selection===m.id));$(`missionTitle${i}`).textContent=locked?tr('CLASSIFIED'):tr(m.title);$(`missionStatus${i}`).textContent=tr(locked?'LOCKED':complete?'COMPLETED':'NEXT MISSION');const stamp=$(`missionStamp${i}`);if(stamp){stamp.textContent=tr('COMPLETED');stamp.hidden=!complete;}
     // The contract is visible before you commit: act, threat and wave count.
     const contract=$(`missionContract${i}`);
     if(contract){const difficulty=campaignDifficulty(m);contract.textContent=locked?'':tr('{threat} · {waves} waves',{threat:tr(difficulty.label.toUpperCase()),waves:campaignWaveContract(m)});contract.dataset.threat=locked?'':m.threat;contract.hidden=locked;}
    });
    // The act overview is a painted land map of the valley: five stations on
    // one road, each act a settlement to click into. A station only opens
    // once the previous act is complete - the road itself is the lock.
    ACTS.forEach((act,i)=>{
      const banner=$(`actBanner${i}`);if(!banner)return;
      const list=CAMPAIGN.map((m,idx)=>({m,idx})).filter(({m})=>actOf(m)?.n===act.n),done=list.filter(({idx})=>idx<progress).length,end=actEndIndex(act),complete=end>=0&&progress>end;
      const unlocked=act.n===1||actComplete(profile,act.n-1);
      banner.dataset.state=complete?'complete':!unlocked?'locked':list.length?'open':'upcoming';
      banner.disabled=blocked||!list.length||!unlocked;
      banner.title=unlocked?'':tr('Complete {act} to unlock this place.',{act:tr(ACTS[act.n-2].title)});
      const title=$(`actBannerTitle${i}`),meta=$(`actBannerMeta${i}`),prog=$(`actBannerProgress${i}`),stamp=$(`actBannerStamp${i}`),lock=$(`actBannerLock${i}`);
      if(title)title.textContent=tr(act.title);
      if(meta)meta.textContent=`${tr(act.character)} · ${tr(act.regionLabel)}`;
      if(prog)prog.textContent=complete?tr('COMPLETED'):tr('{done} / {total} MISSIONS',{done,total:list.length});
      if(stamp){stamp.textContent=tr('COMPLETED');stamp.hidden=!complete;}
      if(lock){lock.textContent=tr('LOCKED');lock.hidden=unlocked;}
    });
    const mapHint=$('campaignMap'+'Hint');if(mapHint)mapHint.textContent=tr('SWIPE TO FOLLOW THE ROAD →');
    if(campaignActView){const act=ACTS.find(a=>a.n===campaignActView);
      if(act){const list=CAMPAIGN.map((m,idx)=>({m,idx})).filter(({m})=>actOf(m)?.n===act.n),done=list.filter(({idx})=>idx<progress).length;
        const eyebrow=actDetailEl('Eyebrow'),head=actDetailEl('Title'),prog=actDetailEl('Progress');
        if(eyebrow)eyebrow.textContent=tr(act.title);
        if(head)head.textContent=`${tr(act.character)} · ${tr(act.regionLabel)}`;
        if(prog)prog.textContent=tr('{done} / {total} MISSIONS',{done,total:list.length});
      }}
    $('campaignBoard').hidden=!mission||!missionBoardOpen;$('campaignShowBoard').hidden=!mission||missionBoardOpen;$('campaignShowBoard').disabled=blocked;$('campaignCloseBoard').hidden=!activeMission;$('campaignPanel').dataset.boardOpen=String(missionBoardOpen);$('campaignOverall').textContent=progress===CAMPAIGN.length?tr('The valley is safe. Revisit any completed mission.'):progress?tr('Your next mission awaits. {done} of {total} missions completed.',{done:progress,total:CAMPAIGN.length}):tr('A lost signal is only the beginning.');$('campaignProgressText').textContent=tr('{done} / {total} COMPLETED',{done:progress,total:CAMPAIGN.length});$('campaignProgressBar').max=CAMPAIGN.length;$('campaignProgressBar').value=progress;$('campaignContinue').disabled=blocked;$('campaignContinue').textContent=tr(progress===CAMPAIGN.length?'REPLAY FINAL MISSION →':progress?'CONTINUE STORY →':'BEGIN STORY →');$('campaignSelectedAct').textContent=tr(mission?.act||'');$('campaignSelectedTitle').textContent=tr(mission?.title||'Select a mission');$('campaignQuickLoad').disabled=blocked||!!mission&&!campaignAvailable(profile,mission.id);$('campaignQuickStatus').textContent=tr(blocked?'Leave your party before changing solo operations.':mission?'Select a mission on the board or load this selection.':'Free play: random map and endless waves.');
    const strip=$('relicStrip');
    if(strip){
      strip.innerHTML=ACTS.map(act=>{
        const relic=RELICS[act.relic],earned=earnedRelicIds(profile).includes(act.relic),end=actEndIndex(act);
        const state=earned?'earned':end>=0?'locked':'upcoming';
        const name=earned?tr(relic.name):tr(act.title);
        const detail=earned?tr(relic.effect):end>=0?tr('Complete {act} to earn this relic.',{act:tr(act.title)}):tr('This act lies ahead.');
        const status=earned?tr('EARNED'):end>=0?tr('LOCKED'):tr('UPCOMING');
        return `<div class="relic-slot" data-act="${act.n}" data-relic="${act.relic}" data-state="${state}" role="listitem"><div class="relic-slot-art" aria-hidden="true"></div><div class="relic-slot-copy"><div class="relic-slot-meta"><span class="relic-slot-act">${tr(act.title)}</span><span class="relic-slot-badge">${status}</span></div><strong>${name}</strong><span>${detail}</span></div></div>`;
      }).join('');
    }
    const journal=progress?CAMPAIGN.slice(0,progress).map(m=>`${tr(m.act)} · ${tr(m.title)}\n${tr(m.success)}`).join('\n\n'):tr('No transmissions recorded yet. Start The Silent Signal to begin the story.');if($('storyJournal').textContent!==journal)$('storyJournal').textContent=journal;
    $('storyReplayDebrief').hidden=!mission||CAMPAIGN.indexOf(mission)>=progress;$('storyReplayDebrief').disabled=blocked;$('storyReplayIntro').hidden=!mission;$('storyReplayIntro').disabled=blocked||!mission||!campaignAvailable(profile,mission.id);$('campaignSelect').disabled=blocked;$('campaignLoad').disabled=blocked||!!mission&&!campaignAvailable(profile,mission.id);
    $('campaignBriefing').textContent=blocked?tr('Leave your party before changing solo operations.'):mission?`${tr(mission.act)} · ${tr(mission.title)} — ${tr(mission.briefing)}${CAMPAIGN.indexOf(mission)>0&&campaignAvailable(profile,mission.id)?` ${tr('Previously: {text}',{text:tr(CAMPAIGN[CAMPAIGN.indexOf(mission)-1].success)})}`:''} ${tr(campaignAvailable(profile,mission.id)?'Available.':'Complete the previous mission first.')}`:tr('Free play: random map and endless waves. Campaign: {done} / {total} operations complete.',{done:progress,total:CAMPAIGN.length});
  }
  // The mission board, its act sections and the quick-select options are
  // generated from CAMPAIGN: a new act ships by adding missions, never by
  // hand-editing markup. Cards keep their historic ids so the handlers and
  // the renderer above stay untouched.
  // The mission board opens on a staged overview of the five acts; each act
  // banner leads into that act's mission list. Entering an act for the first
  // time plays its intro film - once per browser, skip always in reach.
  let campaignActView=0;
  const actIntrosSeen=new Set();
  try{const saved=JSON.parse(window.localStorage.getItem('ironpath:actIntros')||'[]');if(Array.isArray(saved))for(const n of saved)if(Number.isInteger(n)&&n>=1&&n<=ACTS.length)actIntrosSeen.add(n);}catch{}
  function markActIntroSeen(n){actIntrosSeen.add(n);try{window.localStorage.setItem('ironpath:actIntros',JSON.stringify([...actIntrosSeen]));}catch{}}
  function actIntroSource(n){return `assets/cinematics/act${n}-intro-${getLanguage()==='de'?'de':'en'}.mp4?v=20261031-readable1`;}
  function playActIntro(n,onDone){
    const dialog=$('actIntro'),video=$('actIntroVideo'),done=typeof onDone==='function'?onDone:()=>{};
    if(!featureEnabled('actVideos')){markActIntroSeen(n);done();return;}
    if(!dialog||!video){markActIntroSeen(n);done();return;}
    let finished=false;
    const finish=()=>{if(finished)return;finished=true;actIntroActive=false;syncVoiceDucking();markActIntroSeen(n);video.onended=null;try{dialog.close();}catch{}if(typeof video.pause==='function')video.pause();done();};
    video.onended=finish;$('actIntroSkip').onclick=finish;
    dialog.onclose=()=>{if(!finished){finished=true;actIntroActive=false;syncVoiceDucking();markActIntroSeen(n);done();}};
    video.src=actIntroSource(n);
    actIntroActive=true;syncVoiceDucking();
    try{dialog.showModal();}catch{}
    const playing=typeof video.play==='function'?video.play():null;
    if(playing&&typeof playing.catch==='function')playing.catch(()=>{actIntroActive=false;syncVoiceDucking();});
  }
  // Mission voice-over: every briefing, stage and debrief line has an audio
  // clip per language at assets/voice/<lang>/<mission>/<part><index>.mp3.
  // Clips ship incrementally; a missing file simply stays silent, so the
  // game is always playable with whatever subset exists.
  let missionVoice=null;
  function stopMissionVoice(){if(missionVoice){try{missionVoice.pause();}catch{}missionVoice=null;}if(missionVoiceActive){missionVoiceActive=false;syncVoiceDucking();}}
  function playMissionVoice(missionId,part,index){
    stopMissionVoice();
    if(!featureEnabled('voiceOver')||!visualPrefs.voiceOver)return;
    try{
      const audio=new Audio(`assets/voice/${getLanguage()==='de'?'de':'en'}/${missionId}/${part}${index}.mp3`);
      audio.volume=.9;
      const clear=()=>{if(missionVoice===audio){missionVoice=null;missionVoiceActive=false;syncVoiceDucking();}};
      audio.onerror=clear;audio.onended=clear;
      missionVoice=audio;missionVoiceActive=true;syncVoiceDucking();
      const playing=audio.play();if(playing&&typeof playing.catch==='function')playing.catch(clear);
    }catch{missionVoiceActive=false;syncVoiceDucking();/* Voice must never interrupt the game. */}
  }
  function showActOverview(){campaignActView=0;const overview=$('actOverview'),detail=$('missionActs');if(overview)overview.hidden=false;if(detail)detail.hidden=true;
    // On phones the map travels sideways; reopening centers the road on the
    // act still in progress instead of the far west. Guards keep the
    // behaviour inert wherever the DOM is not fully interactive.
    if(overview&&typeof overview.scrollLeft==='number'&&overview.scrollWidth>overview.clientWidth+1&&typeof overview.querySelector==='function'){
      const profile=account.getProfile();let current=ACTS.length;
      for(const act of ACTS){if(!actComplete(profile,act.n)){current=act.n;break;}}
      const node=overview.querySelector(`.act-node[data-act="${current}"]`);
      if(node&&typeof node.offsetLeft==='number')overview.scrollLeft=Math.max(0,node.offsetLeft+node.offsetWidth/2-overview.clientWidth/2);
    }}
  function wireMissionCards(){
    CAMPAIGN.forEach((mission,i)=>{const card=$(`missionCard${i}`);if(!card)return;card.onclick=()=>{if(!coop&&campaignAvailable(account.getProfile(),mission.id)&&(typeof account.canChooseSolo!=='function'||account.canChooseSolo())){$('campaignSelect').value=mission.id;renderCampaign();}};});
  }
  function showActDetail(n){
    const act=ACTS.find(a=>a.n===n);if(!act)return;
    campaignActView=n;
    const cards=CAMPAIGN.map((mission,i)=>({mission,i})).filter(({mission})=>actOf(mission)?.n===act.n).map(({mission,i})=>{
      const numberText=`MISSION ${String(i+1).padStart(2,'0')}`;
      return `<button type="button" id="missionCard${i}" class="mission-card" data-mission="${mission.id}" aria-pressed="false"><span class="mission-number" data-i18n-text="${numberText}">${tr(numberText)}</span><strong id="missionTitle${i}">CLASSIFIED</strong><span id="missionStatus${i}" class="mission-status">${tr('LOCKED')}</span><span id="missionContract${i}" class="mission-contract" hidden></span><b id="missionStamp${i}" class="mission-stamp" aria-hidden="true" hidden></b></button>`;
    }).join('');
    const detail=$('missionActs');
    detail.innerHTML=`<header class="act-detail-head" data-act="${act.n}"><button type="button" id="actDetailBack" class="act-detail-back">← ${tr('BACK TO ACTS')}</button><div class="act-detail-meta"><span id="actDetailEyebrow" class="board-eyebrow">${tr(act.title)}</span><h3 id="actDetailTitle"></h3><p id="actDetailProgress"></p></div><button type="button" id="actDetailReplay" class="act-intro-replay">▸ ${tr('WATCH INTRO')}</button></header><div class="mission-grid">${cards}</div>`;
    const overview=$('actOverview');if(overview)overview.hidden=true;detail.hidden=false;
    wireMissionCards();
    const back=actDetailEl('Back');if(back)back.onclick=()=>showActOverview();
    const replay=actDetailEl('Replay');if(replay)replay.onclick=()=>playActIntro(n);
    renderCampaign();
  }
  function openAct(n){const act=ACTS.find(a=>a.n===n);if(!act)return;if(!actIntrosSeen.has(n))playActIntro(n,()=>showActDetail(n));else showActDetail(n);}
  function buildMissionBoard(){
    const overview=$('actOverview'),select=$('campaignSelect');
    // The painted valley map: five act stations along the one road, west to
    // east - forest, marsh, city, pass, junction. Positions are map
    // percentages; the dashed route is the Iron Path itself.
    if(overview){
      const stations=[[18,64],[34,80],[50,50],[64,20],[82,36]];
      const route=stations.map(([x,y])=>`${x},${y}`).join(' ');
      overview.innerHTML=`<div class="campaign-map" role="group" aria-label="${tr('The five acts')}"><svg class="campaign-map-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${route}"/></svg>${ACTS.map((act,i)=>`<button type="button" id="actBanner${i}" class="act-node" data-act="${act.n}" data-state="open" style="--node-x:${stations[i]?.[0]||50}%;--node-y:${stations[i]?.[1]||50}%" aria-label="${act.title}"><span class="act-node-marker" aria-hidden="true"><b class="act-node-numeral">${['I','II','III','IV','V'][i]||act.n}</b></span><span class="act-node-plate"><strong id="actBannerTitle${i}">${tr(act.title)}</strong><span id="actBannerMeta${i}" class="act-node-meta"></span><span id="actBannerProgress${i}" class="act-node-progress"></span></span><b id="actBannerStamp${i}" class="mission-stamp" aria-hidden="true" hidden></b><span id="actBannerLock${i}" class="act-node-lock" aria-hidden="true" hidden></span></button>`).join('')}<span id="campaignMapHint" class="campaign-map-hint" aria-hidden="true"></span></div>`;
    }
    ACTS.forEach((act,i)=>{const banner=$(`actBanner${i}`);if(banner)banner.onclick=()=>openAct(act.n);});
    // The quick select keeps free play first; option labels come from the
    // renderer. Rebuilding replaces the whole list, ids stay stable.
    select.innerHTML=`<option value="free" data-i18n-text="Free play · random battlefield">${tr('Free play · random battlefield')}</option>`+CAMPAIGN.map((mission,i)=>`<option id="campaignOption${i}" value="${mission.id}"></option>`).join('');
    showActOverview();
  }
  function setMissionBoard(open){missionBoardOpen=!!open;if(open)showActOverview();keys.clear();sendDirection();accumulator=0;renderCampaign();syncAudioScene();if(state)updateUI();}
  buildMissionBoard();
  $('campaignSelect').onchange=()=>setMissionBoard(!!campaignMission($('campaignSelect').value));
  $('campaignShowBoard').onclick=()=>setMissionBoard(true);$('campaignCloseBoard').onclick=()=>setMissionBoard(false);
  $('campaignContinue').onclick=async()=>{if(coop||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo()))return;const progress=campaignProgress(account.getProfile()),mission=CAMPAIGN[Math.min(progress,CAMPAIGN.length-1)];$('campaignSelect').value=mission.id;renderCampaign();await $('campaignLoad').onclick();};
  $('campaignQuickLoad').onclick=()=>$('campaignLoad').onclick();
  $('storyReplayDebrief').onclick=()=>{const mission=campaignMission($('campaignSelect').value);if(!coop&&mission&&CAMPAIGN.indexOf(mission)<campaignProgress(account.getProfile())&&(typeof account.canChooseSolo!=='function'||account.canChooseSolo()))showCinematic(mission,'ending',null,'CLOSE');};
  $('storyReplayIntro').onclick=()=>{const mission=campaignMission($('campaignSelect').value);if(!coop&&mission&&campaignAvailable(account.getProfile(),mission.id)&&(typeof account.canChooseSolo!=='function'||account.canChooseSolo()))showCinematic(mission,'intro',null,'CLOSE');};
  $('campaignLoad').onclick=async()=>{
    if(coop||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo()))return false;
    if(state.ended&&report?.campaign&&report.campaignSaved!==true){warn('Confirm or retry your story save before changing operations.');return false;}
    const id=$('campaignSelect').value,mission=id==='free'?null:campaignMission(id),currentState=state,currentUser=account.getUserId(),currentSession=account.getSessionVersion?.();if(id!=='free'&&(!mission||!campaignAvailable(account.getProfile(),id)))return false;
    if(typeof account.beforeNewGame==='function'&&!await account.beforeNewGame())return false;
    if(coop||state!==currentState||account.getUserId()!==currentUser||account.getSessionVersion?.()!==currentSession||!account.isReady()||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo()))return false;
    if(!state.ended&&(state.wave>0||state.towers.length)&&!await confirmAction({title:'Change operation?',text:'This ends your current solo run. Completed-wave rewards remain saved.',accept:'CHANGE OPERATION'}))return false;
    if(coop||state!==currentState||account.getUserId()!==currentUser||account.getSessionVersion?.()!==currentSession||!account.isReady()||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo())||(mission&&!campaignAvailable(account.getProfile(),id)))return false;
    // Only replace the old run after the version check and confirmation succeed.
    soloDeployed=true;activeTraining=false;activeMission=mission;selectedMap=mission?mission.mapId:drawFreeMapId(selectedMap);missionBoardOpen=false;reset();notice(()=>tr(mission?mission.stages[0].dialogue:'Free play ready.'));if(mission)showCinematic(mission,'intro');return true;
  };
  function reset(freshMap=false,{preserveResults=false}={}){fieldNotice.clear();wasAbilityReady=false;abilityReadyNotified=false;mapIntro.clear();announcedMap=null;closeCinematic(false);radioTime=0;$('storyRadio').hidden=true;hideDecisionPanel();$('soloBonus').hidden=true;if(!preserveResults&&$('runResults').open)$('runResults').close();report=newReport();report.soloMission=activeMission;report.training=activeTraining;report.accountId=account.getUserId();report.receiptId=activeMission||!experimentalWorkshop?null:newRunReceiptId();activeStory=activeMission?createStoryMission(activeMission):null;setLogicalHeight(540);if(freshMap&&!activeMission)selectedMap=drawFreeMapId(selectedMap);combatFx.clear();sound.resetCombat?.();soldierMotion.reset();rivalMotion.reset();groundTracks.reset();rivalGroundTracks.reset();lastSnapshotAt=0;bossSignal=null;const deploymentProfile=account.getProfile();state=createSoloDeployment({player:createPlayer('local',{...deploymentProfile,level:account.getLevel()}),mapId:selectedMap,profile:deploymentProfile,workshopEnabled:experimentalWorkshop,campaign:activeTraining?trainingContract():activeMission&&{id:activeMission.id,threat:activeMission.threat,spawn:{x:activeMission.stages[0]?.x,y:activeMission.stages[0]?.y}}});Object.assign(state,{speed:1,selectedPad:null});accumulator=0;keys.clear();closeMenu();updateUI();}
  const voteCommands=new Set(['startWave','approveWave','declineWave','cancelWave','requestSpeed','approveSpeed','declineSpeed','cancelSpeed','slowSpeed']);
  function dispatch(command,done){
    if(!coop){done(applyCommand(state,'local',command));return;}
    const active=coop,input=coopInput,roster=rosterGeneration,focus=focusGeneration,wave=state.wave;
    const isTowerUpgradeCmd=command.type==='upgrade'||command.type==='classUpgrade';
    const running=state.running,mapId=state.mapId,menuAtClick=isTowerUpgradeCmd?menuRevision:null,detailsAtClick=isTowerUpgradeCmd&&$('towerDetails').open;
    const waveCounter=Number.isSafeInteger(state.waveRequestId)?state.waveRequestId:0;
    const speedCounter=Number.isSafeInteger(state.speedRequestId)?state.speedRequestId:null;
    // Stamp new requests and slow-downs with the last observed vote epoch.
    // The host verifies it even if another vote comes and goes before a late
    // packet arrives; old clients without the optional field remain supported.
    const outgoing=command.type==='startWave'?{...command,expectedRequestId:waveCounter}:
      ['requestSpeed','slowSpeed'].includes(command.type)&&speedCounter!==null?{...command,expectedRequestId:speedCounter}:command;
    // A vote may wait briefly behind a movement receipt. It must never turn
    // into a new request after another player disconnects, a wave ends, or the
    // request being answered is replaced. The host also fences its generation.
    const isCurrent=()=>{
      if(coop!==active||coopInput!==input||!coopReady||state.ended||roster!==rosterGeneration||focus!==focusGeneration||state.wave!==wave)return false;
      if(command.type==='startWave')return (state.waveRequestId??0)===waveCounter&&!state.running&&!currentWaveRequest()&&!state.pendingPerk&&!state.pendingSector&&waveRosterReady();
      if(['approveWave','declineWave','cancelWave'].includes(command.type))return currentWaveRequest()?.id===command.requestId;
      if(command.type==='requestSpeed')return (state.speedRequestId??null)===speedCounter&&state.running&&state.speed!==2&&!state.speedRequest;
      if(['approveSpeed','declineSpeed','cancelSpeed'].includes(command.type))return state.running&&state.speedRequest?.id===command.requestId;
      if(command.type==='slowSpeed')return (state.speedRequestId??null)===speedCounter&&state.running&&state.speed===2;
      if(command.type==='upgrade'||command.type==='classUpgrade')return menuAtClick===menuRevision&&!menu.hidden&&menuPad===command.pad&&$('towerDetails').open===detailsAtClick&&state.mapId===mapId&&state.running===running&&state.towers.some(t=>t.pad===command.pad&&t.id===command.expectedTowerId&&t.level===command.expectedLevel);
      return false;
    };
    const options=voteCommands.has(command.type)?{waitForDirection:true,isCurrent,onQueued:()=>notice('Sending request after movement is synchronized…')}:
      isTowerUpgradeCmd?{waitForTower:true,isCurrent,staleReason:'Tower changed. Select it again.',onQueued:()=>{const text='Sending upgrade after the previous action is synchronized…';if(detailsAtClick&&$('towerDetails').open)$('towerDetailsCost').textContent=localizeGameMessage(text,tr);else notice(text);}}:undefined;
    return input.execute(outgoing,options).then(result=>{if(coop===active)done(result);return result;});
  }
  // ONE message and one writer (field-notice.mjs). What matters flutters in
  // under the status bar, takes its turn and steps aside; everything the radio
  // used to say is still spoken, but only into the screen-reader live region,
  // because a player in a firefight does not read a ticker.
  // No dismiss button: the notice is a caption over the field and takes no
  // taps. It steps aside on its own, and the game clears it when the run does.
  const fieldNotice=createFieldNotice(document,{translate:tr});
  // The map announces itself once, when it is loaded - a title card with the
  // battlefield drawn in the game's own art. After that the field says nothing
  // more about itself: the player knows where they are.
  const mapIntro=createMapIntro(document,{translate:tr,getMap:mapId=>{try{return getMap(mapId);}catch{return null;}}});
  let announcedMap=null;
  let lastNotice=null;
  // Ordinary traffic: spoken for a screen reader, not painted over the field.
  function notice(text){lastNotice=typeof text==='function'?text:()=>localizeGameMessage(text,tr);$('message').textContent=lastNotice();}
  // The notice: the player asked for something and did not get it, or something
  // happened to the field - a bomber, breaking ice, a lost bunker. See
  // field-notice.mjs for what that costs it.
  function warn(text){fieldNotice.warn(typeof text==='function'?text:()=>localizeGameMessage(text,tr));}
  // A successful command receipt confirms submission, not that the vote is
  // still pending. A newer snapshot may have already ended or replaced it; a
  // different transport may deliver the receipt before its matching snapshot.
  const pendingRequestFeedback={wave:null,speed:null};
  function requestFeedbackContext(){return {wave:state.wave,actor:me(),epoch:promptEpoch,roster:rosterGeneration,focus:focusGeneration};}
  function clearRequestFeedback(){pendingRequestFeedback.wave=null;pendingRequestFeedback.speed=null;}
  function feedbackCurrent(kind,item){
    if(!coop||!coopReady||state.ended||item.epoch!==promptEpoch||item.roster!==rosterGeneration||item.focus!==focusGeneration||item.actor!==me())return false;
    if(kind==='speed'&&(!state.running||state.wave!==item.wave))return false;
    if(kind==='wave'&&state.wave!==item.wave&&state.wave!==item.wave+1)return false;
    return true;
  }
  function reconcileRequestFeedback(kind,item){
    if(!feedbackCurrent(kind,item))return true;
    const vote=kind==='wave'?currentWaveRequest():state.speedRequest;
    const counter=kind==='wave'?(Number.isSafeInteger(state.waveRequestId)?state.waveRequestId:0):state.speedRequestId;
    if(vote?.id===item.id&&vote.requester===item.actor){notice(kind==='wave'?'Waiting for player approval.':'Speed request sent. Waiting for every other player.');return true;}
    // A newer visible request owns the current UI; do not replace its feedback
    // with a status about the old request.
    if(vote&&Number.isSafeInteger(vote.id)&&vote.id>=item.id)return true;
    if(!Number.isSafeInteger(counter)){notice('Request sent. Check the current status.');return true;}
    if(counter<item.id)return false;
    if(vote)return true;
    if(kind==='speed')notice(counter===item.id&&state.speed===2?'2× approved by all players.':'2× request ended. Check the current speed.');
    else if(counter===item.id&&state.wave===item.wave+1&&state.running)notice('Wave started.');
    else if(counter===item.id&&state.wave===item.wave&&!state.running)notice('Wave request cancelled, declined or teammate disconnected.');
    else notice('Wave request ended. Check the current status.');
    return true;
  }
  function requestReceipt(kind,result,context){
    pendingRequestFeedback[kind]=null;
    if(!feedbackCurrent(kind,context))return;
    if(!Number.isSafeInteger(result.requestId)||result.requestId<1){notice('Request sent. Check the current status.');return;}
    const item={...context,id:result.requestId};
    if(!reconcileRequestFeedback(kind,item)){pendingRequestFeedback[kind]=item;notice('Request sent. Synchronizing the game state…');}
  }
  function refreshRequestFeedback(){for(const kind of ['wave','speed']){const item=pendingRequestFeedback[kind];if(item&&reconcileRequestFeedback(kind,item))pendingRequestFeedback[kind]=null;}}
  let storyRadioSource="";let storyRadioCard=null;
  function storyRadio(text,refresh=false,card=null,speaker=null){storyRadioSource=text;storyRadioCard=card;const raw=text;text=tr(text);const match=raw.match(/^([A-Z]+):\s*(.*)$/),who=speaker||(match&&match[1]);$('storyRadio').dataset.speaker=who?who.toLowerCase():'narrator';$('storyRadioSpeaker').textContent=who?`${who} / RADIO`:tr('FIELD REPORT');$('storyRadioText').textContent=speaker?text:match?match[2]:text;
   // Tutorial-style stage card: the caption says what to do, the pips show how
   // much of the mission is still asking for it. Plain radio lines clear both.
   const caption=$('storyRadioCaption'),pips=$('storyRadioPips');
   caption.hidden=!card?.caption;caption.textContent=card?.caption?tr(card.caption):'';
   pips.hidden=!card||!card.steps;pips.replaceChildren(...(card?.steps||[]).map((_,i)=>{const pip=document.createElement('i');if(i<=card.step)pip.toggleAttribute('data-done',true);return pip;}));
   $('storyRadio').hidden=false;if(!refresh){radioTime=7;sound.play('request');}}
  function storyStageCard(){const stage=activeMission?.stages[Math.min(activeStory.stage,activeMission.stages.length-1)];storyRadio(stage?.dialogue||'',false,{caption:STAGE_CAPTIONS[stage?.type]||null,steps:activeMission?.stages,step:activeStory.stage});}
  // Field decisions: offered once per authored moment, non-modal. The field
  // keeps running while the card waits; picking applies run-local effects only.
  let decisionChoices=null;
  function showDecisionPanel(entry){decisionChoices=entry.choices;$('storyDecisionSpeaker').textContent=`${entry.speaker} / ${tr(EVENT_TEMPLATES.decisionTitle)}`;$('storyDecisionText').textContent=tr(entry.text);$('storyDecisionNote').textContent=tr(EVENT_TEMPLATES.decisionPending);entry.choices.slice(0,2).forEach((choice,index)=>{const button=$('storyChoice'+index);button.replaceChildren();const label=document.createElement('b');label.textContent=tr(choice.label);const detail=document.createElement('small');detail.textContent=tr(choice.detail);button.append(label,detail);});$('storyDecision').hidden=false;}
  function hideDecisionPanel(){$('storyDecision').hidden=true;decisionChoices=null;}
  function pickDecision(index){if(!activeStory||!decisionChoices||state?.ended)return;const choice=decisionChoices[index];if(choice)resolveStoryDecision(activeStory,state,choice.id);}
  let hudBottom='',mapHudBottom='',actionBar='';
  // Bottom edge of the status dashboard, measured against the battlefield box.
  // Re-measured only when the number actually moves, so scrolling never thrashes layout.
  function measureHud(){
    try{
      const query=(node,selector)=>typeof node?.querySelector==='function'?node.querySelector(selector):null;
      const battle=typeof $('gameView')?.querySelector==='function'?$('gameView').querySelector('.battle'):null;
      const dashboard=query(battle,'.dashboard');
      if(!dashboard||typeof dashboard.getBoundingClientRect!=='function'||typeof battle.getBoundingClientRect!=='function')return;
      const bottom=dashboard.getBoundingClientRect().bottom;
      const edge=Math.round(bottom-battle.getBoundingClientRect().top);
      if(edge>0&&`${edge}px`!==hudBottom){hudBottom=`${edge}px`;document.documentElement.style.setProperty('--hud-bottom',hudBottom);}
      // The same edge for overlays that live INSIDE the map frame: its top sits
      // below the battle head, so the number above is not their coordinate system.
      const frame=query(battle,'.map-frame');
      if(!frame||typeof frame.getBoundingClientRect!=='function')return;
      const inside=Math.round(bottom-frame.getBoundingClientRect().top);
      if(inside>0&&`${inside}px`!==mapHudBottom){mapHudBottom=`${inside}px`;document.documentElement.style.setProperty('--map-hud-bottom',mapHudBottom);}
    }catch{/* a headless harness without layout must never break the frame loop */}
  }
  // The coach card sits ABOVE the action bar, never on it: Deploy has to stay
  // tappable with a card open, which is the whole reason the card is not a modal.
  // The bar is `position:fixed;bottom:0` on phones and `absolute` on desktop, so its
  // height is measured from the viewport bottom instead of assumed.
  function measureActionBar(){
    try{
      const query=node=>typeof node?.querySelector==='function'?node.querySelector('.map-frame .command'):null;
      const bar=query($('gameView'));
      if(!bar||typeof bar.getBoundingClientRect!=='function')return;
      const box=bar.getBoundingClientRect();
      if(!box.height||!window.innerHeight)return;
      const height=Math.round(box.height+Math.max(0,window.innerHeight-box.bottom));
      if(height>0&&`${height}px`!==actionBar){actionBar=`${height}px`;document.documentElement.style.setProperty('--action-bar',actionBar);}
    }catch{/* same rule as the header: a harness without layout must not break the loop */}
  }
  window.addEventListener('resize',measureActionBar);
  window.addEventListener('resize',measureHud);
  // Language switches re-render the whole panel, which re-runs updateUI() and re-measures.
  let dismissedPerk=null;
  const perkKey=()=>state&&!state.ended&&state.pendingPerk?`${state.mapId}:${state.wave}:${state.pendingPerk}`:null;
  function dismissPerk(){const key=perkKey();if(!key)return;dismissedPerk=key;updateUI();}
  $('runPerkClose').onclick=dismissPerk;
  $('runPerkReopen').onclick=()=>{dismissedPerk=null;updateUI();};
  document.addEventListener('click',event=>{const panel=$('runPerkPanel');if(panel.hidden||panel.contains(event.target)||document.querySelector('dialog[open]'))return;dismissPerk();event.preventDefault();event.stopPropagation();},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('runPerkPanel').hidden&&!document.querySelector('dialog[open]')){dismissPerk();event.preventDefault();}});
  for(let i=0;i<3;i++)if($(`runPerk${i}`))$(`runPerk${i}`).onclick=()=>dispatch({type:'choosePerk',index:i},result=>{if(result.ok)sound.play('perk');notice(result.ok?tr('{name} acquired for this operation.',{name:tr(result.perk)}):result.reason);updateUI();});
  // The retreat panel: every tenth cleared wave a solo endless run falls back
  // to the next sector. It is a panel over the field, like the perk choices -
  // never a modal dialog that could cover anything.
  $('sectorAdvance').onclick=()=>dispatch({type:'advanceSector'},result=>{
    if(!result.ok){warn(result.reason);return;}
    selectedMap=state.mapId;state.selectedPad=null;closeMenu();combatFx.clear();sound.play('sector');
    notice(tr('Sector {number}: a longer road, a meaner enemy. Demolition refund: {refund} supplies.',{number:result.sector,refund:result.refund}));
    updateUI();
  });
  // The host's snapshot carries one vote for the entire locked roster. A
  // fallback keeps an already-running legacy host's old host-only request
  // readable; it cannot grant approval or add participants locally.
  function currentWaveRequest(){
    if(!state?.pendingWave)return null;
    if(state.waveRequest&&Array.isArray(state.waveRequest.required)&&Array.isArray(state.waveRequest.approved))return state.waveRequest;
    return {id:state.waveRequestId,wave:state.pendingWave,requester:state.hostId,required:Object.keys(state.players||{}).filter(id=>id!==state.hostId),approved:[]};
  }
  function waveRequesterName(request){return state.waveRequesterName||state.players?.[request?.requester]?.name||tr('A player');}
  function waveRosterReady(){return typeof state.waveRosterReady==='boolean'?state.waveRosterReady:Object.values(state.players||{}).length>=2&&Object.values(state.players).every(player=>player.active!==false);}
  function publishVotePrompts(vote,speedVote){
    if(!promptCenter)return;
    const items=[],session=coop,actor=me(),roster=rosterGeneration,focus=focusGeneration,epoch=promptEpoch;
    const connected=()=>!!session&&coop===session&&coopReady&&hasCoopSnapshot&&!state.ended&&actor===me()&&roster===rosterGeneration&&focus===focusGeneration&&epoch===promptEpoch;
    function add(kind,request){
      if(!connected()||!request||!Number.isSafeInteger(request.id)||request.id<1||request.requester===actor||!request.required.includes(actor)||request.approved.includes(actor))return;
      const id=request.id;
      const valid=()=>{const now=kind==='wave'?currentWaveRequest():state.speedRequest;return connected()&&(kind==='wave'?!state.running:state.running)&&now?.id===id&&now.requester!==actor&&now.required.includes(actor)&&!now.approved.includes(actor);};
      const answer=type=>{if(!valid())return false;return Promise.resolve(dispatch({type,requestId:id},result=>{notice(result.ok?(type==='approveWave'?'Wave approved.':type==='declineWave'?'Wave postponed. Anyone can request again when ready.':type==='approveSpeed'?'Speed approved.':'Speed request declined.'):result.reason);updateUI();})).then(result=>result?.ok===true);};
      const name=kind==='wave'?waveRequesterName(request):(state.speedRequesterName||state.players[request.requester]?.name||tr('A player'));
      const missing=Math.max(0,request.required.length-request.approved.length);
      items.push({key:`${kind}:${id}`,title:tr(kind==='wave'?'WAVE REQUEST':'SPEED REQUEST'),
        body:kind==='wave'?tr(missing===1?'{name} requests wave {wave}. {count} approval still needed.':'{name} requests wave {wave}. {count} approvals still needed.',{name,wave:request.wave,count:missing}):tr('{name} requests 2× for wave {wave}. {approved}/{required} approved.',{name,wave:request.wave,approved:request.approved.length,required:request.required.length}),
        note:tr(kind==='wave'?'You can also answer using the battle controls.':'Battle continues while you decide.'),valid,
        actions:[{id:'approve',label:tr(kind==='wave'?'APPROVE WAVE':'APPROVE 2×'),run:()=>answer(kind==='wave'?'approveWave':'approveSpeed')},{id:'decline',label:tr(kind==='wave'?'NOT YET':'DECLINE'),run:()=>answer(kind==='wave'?'declineWave':'declineSpeed')}]});
    }
    add('wave',vote);add('speed',speedVote);promptCenter.update('battle',items);
  }
  function updateUI(){
    renderCampaign();
    syncAudioScene();
    const showObjective=(!!activeMission||activeTraining)&&!coop;$('soloObjective').hidden=!showObjective;
    measureActionBar();
    if(showObjective&&activeTraining){const status=trainingStatus(state,tr);$('soloObjectiveTitle').textContent=tr('TRAINING CONTRACT · HANDLE WITH CARE');$('soloObjectiveProgress').textContent=tr('WAVE {wave} / {total}',{wave:status.progress,total:status.max});$('soloObjectiveBar').max=status.max;$('soloObjectiveBar').value=status.progress;$('soloObjectiveHint').textContent=tr(status.detail);}
    else if(showObjective){const status=storyStatus(activeStory,state);
    // The accompaniment's open side objective rides under the main objective;
    // closed ones had their radio moment and step aside for the next.
    const bonus=status.bonus;
    if(bonus&&!bonus.max)bonus.text=tr(EVENT_TEMPLATES.bonusLine,{label:tr(bonus.label)});
    else if(bonus&&bonus.kind==='asset')bonus.text=tr(EVENT_TEMPLATES.bonusAsset,{label:tr(bonus.label),percent:bonus.progress});
    else if(bonus)bonus.text=tr(EVENT_TEMPLATES.bonusProgress,{label:tr(bonus.label),progress:bonus.progress,max:bonus.max});
    $('soloBonus').hidden=!bonus;$('soloBonus').textContent=bonus?.text||'';
    // A decision card never outlives its mission: the field ending (victory,
    // failure, bunker loss) or leaving the story closes it.
    if(!$('storyDecision').hidden&&(!activeStory.decision?.pending||state.ended))hideDecisionPanel();
    $('soloObjectiveTitle').textContent=`${tr(activeMission.act)} · ${tr(activeMission.title)}`;$('soloObjectiveProgress').textContent=tr('OBJECTIVE {current} / {total}: {label}',{current:Math.min(activeStory.stage+1,activeMission.stages.length),total:activeMission.stages.length,label:tr(status.label)});$('soloObjectiveBar').max=status.max;$('soloObjectiveBar').value=status.progress;$('soloObjectiveHint').textContent=`${translateStoryDetail(status.detail,tr)} ${tr(status.dialogue||'')}`;}
    if(state.ended&&(!coop||hasCoopSnapshot)&&report&&!report.finished){finishReport(report,state,me());if(state.endReason!=='retired')onReturnToCommand();if(activeTraining&&state.endReason!=='retired'&&typeof onTrainingComplete==='function')onTrainingComplete({victory:state.endReason==='training-complete',rewards:trainingRewards});}else if(state.ended&&report?.finished&&report.snapshot!==state){report.snapshot=state;if(lastReport===report&&$('runResults').open)renderResults(report);}
    const map=getMap(state.mapId),terrain=terrainFor(map),versus=state.mode==='versus',teamMatch=state.fourInfo?.mode==='two-vs-two';$('battleLabel').textContent=coop?tr('MULTIPLAYER'):activeMission?tr('STORY MISSION {number}',{number:CAMPAIGN.indexOf(activeMission)+1}):tr('FREE PLAY');const sector=sectorOf(state.mapId);
    // The title the field writes and the title the card shows are the SAME text:
    // the corner is gone, so this node is the only place the map is named, and
    // the retreat flow reads the sector back out of it.
    const mapTitle=versus?`${tr(map.name)} · 1 VS 1`:sector>1?`${tr(map.name)} · ${tr('SECTOR {number}',{number:sector})}`:tr(map.name);
    $('mapName').textContent=mapTitle;
    // One announcement per loaded map. `reset()` clears `announcedMap`, so a new
    // run on the same ground is announced again - it is a new battle.
    if(announcedMap!==state.mapId){announcedMap=state.mapId;mapIntro.show(state.mapId,{label:$('battleLabel').textContent,name:mapTitle});}
    const workspace=$('gameWorkspace'),screen=workspace?.dataset?.screen,campaignBoardOpen=$('campaignPanel')?.dataset?.boardOpen==='true';
    const inBattleFrame=!workspace?.hidden&&((!!coop&&screen==='online'&&workspace.dataset.onlineReady==='true')||(!coop&&(screen==='endless'||screen==='training'||(screen==='campaign'&&!campaignBoardOpen))));
    const fullBattle=Boolean(inBattleFrame&&mapViewport.clientWidth>0&&mapViewport.clientHeight>0&&(coop||wantsBattleViewport(map,versus,false)));
    const canvasHeight=fullBattle?Math.max(1,Math.round(logicalWidth*mapViewport.clientHeight/mapViewport.clientWidth)):versus?Math.round(logicalWidth*((map.height||540)*2+20)/(map.width||960)):540;
    canvas.dataset.fullBattle=String(fullBattle);
    if(logicalHeight!==canvasHeight){setLogicalHeight(canvasHeight,versus);if(touchZoom&&!battleViewport&&!fullBattle)touchZoom.resize(touchZoom.getFactor());}else canvas.dataset.lanes=versus?'versus':'single';
    syncBattleViewport(map,versus,fullBattle);
    $('versusStatus').hidden=!versus&&!teamMatch;if(teamMatch){const info=state.fourInfo;$('versusTitle').textContent=state.ended?(info.winnerTeam===null?tr('DRAW / MATCH ENDED'):info.winnerTeam===info.team?tr('VICTORY'):tr('DEFEAT')):tr('2 VS 2 · TEAM {team}',{team:info.team?'B':'A'});$('versusInfo').textContent=tr('YOUR BUNKER {health} · OTHER BUNKER {other}',{health:Math.max(0,Math.ceil(state.hp)),other:Math.max(0,Math.ceil(info.otherHealth))});}if(versus){$('versusTitle').textContent=state.ended?(state.winnerId?(state.winnerId===me()?tr('VICTORY'):tr('DEFEAT')):tr('DRAW / MATCH ENDED')):tr('1 VS 1 · SURVIVAL');$('versusInfo').textContent=tr('YOUR BUNKER {health} · {name} {other}',{health:Math.max(0,Math.ceil(state.hp)),name:state.players[state.rivalId]?.name||tr('OPPONENT'),other:Math.max(0,Math.ceil(state.rival.hp))})+(state.waitingForRival&&!state.ended?tr(' · WAITING FOR OPPONENT'):'');}
    if($('terrainBriefing')){
      const zoneKinds=map.zones?[...new Set(map.zones.map(z=>z.kind))]:[];
      $('terrainBriefing').hidden=!terrain&&!zoneKinds.length;
      if(terrain||zoneKinds.length){
        if($('terrainTitle'))$('terrainTitle').textContent=terrain?tr('{map} · Terrain effects',{map:tr(map.name)}):tr('{map} · Field zones',{map:tr(map.name)});
        const text=terrain?tr(TERRAIN_BRIEFINGS[terrain])+(terrain==='urban'?(state.rubbleCleared?tr(' Rubble is cleared.'):tr(' Rubble remaining: {remaining} / 200.',{remaining:Math.max(0,Math.ceil(200-(state.rubbleDamage||0)))})):''):zoneKinds.map(kind=>tr(ZONE_BRIEFINGS[kind])).join(' ');
        if($('terrainDescription').textContent!==text)$('terrainDescription').textContent=text;
      }
    }
    if($('runPerksStatus')){const ranks=state.runPerks||{},acquired=RUN_PERKS.filter(perk=>ranks[perk.key]);$('runPerksStatus').hidden=!acquired.length;const text=acquired.map(perk=>`${tr(perk.name)} ×${ranks[perk.key]}`).join(' · ');if($('runPerksList').textContent!==text)$('runPerksList').textContent=text;}
    if($('runPerkPanel')){
      const key=perkKey();if(!key)dismissedPerk=null;const dismissed=!!key&&dismissedPerk===key;$('runPerkPanel').hidden=!key||dismissed;$('runPerkReopen').hidden=!key||!dismissed;if($('runPerkIntro'))$('runPerkIntro').textContent=state.mode==='versus'?tr('Choose a field upgrade for your own battlefield.'):state.mode==='two-vs-two'?tr('One shared upgrade for your team. Either teammate may choose.'):tr('One shared upgrade for this operation. Any active player may choose.');
      if(state.pendingPerk){const offers=perkOffers(state.mapId,state.pendingPerk);for(let i=0;i<3;i++){const button=$(`runPerk${i}`),perk=RUN_PERKS[offers[i]];const content=`${perk.rare?tr('★ RARE · '):''}${tr(perk.name)}<small>${tr(perk.description)}</small>`;if(button.innerHTML!==content)button.innerHTML=content;button.disabled=!!coop&&!coopReady;}}
    }
    if($('sectorPanel')){
      // The retreat waits until the perk choice is done: wave ten clears both
      // at once, and one panel at a time keeps the field readable.
      const waiting=!coop&&!state.ended&&!!state.pendingSector&&!state.pendingPerk;
      $('sectorPanel').hidden=!waiting;
      if(waiting){
        $('sectorTitle').textContent=tr('SECTOR {number} CLEARED',{number:sectorOf(state.mapId)});
        $('sectorText').textContent=tr('Fall back now. Your towers are lost in the retreat; you carry over a {refund} supply demolition refund.',{refund:state.towers.reduce((sum,tower)=>sum+Math.floor(.6*(TOWER_COSTS[tower.type]+(towerUpgradeInvestment(tower.level)??0)+classPathInvested(tower))),0)});
      }
    }
    if($('bossAlert')){
      const bossInterval=activeTraining&&!coop?TRAINING_BOSS_EVERY:5;
      const boss=state.enemies.find(e=>e.boss&&e.hp>0),incoming=state.running&&state.wave%bossInterval===0&&state.spawnLeft>0?bossForWave(state.wave,bossInterval):null,info=boss?BOSSES.find(b=>b.kind===boss.boss):incoming;
      $('bossAlert').hidden=!info||state.ended;
      if(info){const signal=boss?bossTelegraph(boss):null,key=boss?`${boss.boss}:${signal?.key||'normal'}`:null;if(signal?.warning&&bossSignal?.startsWith(`${boss.boss}:`)&&bossSignal!==key){sound.play('warning');$('bossAnnouncement').textContent=`${tr(info.label)}: ${localizedBossSignal(signal)}`;}bossSignal=key;$('bossAlert').classList.toggle('is-warning',!!signal?.warning);$('bossAlertTitle').textContent=tr(boss?'BOSS · {name}':'BOSS INCOMING · {name}',{name:tr(info.label)});$('bossAlertInfo').textContent=signal?localizedBossSignal(signal):tr((boss&&bossPhaseLabel(boss))||info.description);$('bossHealth').hidden=!boss;if(boss)$('bossHealthFill').style.width=`${Math.max(0,Math.min(100,100*boss.hp/boss.maxHp))}%`;}else bossSignal=null;
    }
    const threats=countFieldThreats(state.enemies);for(const [kind,id] of [['infantry','threatInfantry'],['runner','threatRunner'],['tank','threatTank'],['plane','threatPlane']])$(id).textContent=String(threats[kind]);const summary=Object.entries(threats).filter(([,n])=>n).map(([kind,n])=>`${tr(ENEMY_TYPES[kind].label)} ${n}`).join(' · ');$('threatSummary').textContent=summary||tr('No enemies on field');
    $('wave').textContent=`${state.wave} / ∞`; $('health').textContent=Math.max(0,Math.ceil(state.hp)); $('money').textContent=supplies();if($('moneyLabel'))$('moneyLabel').textContent=coop?tr('YOUR SUPPLIES'):tr('SUPPLIES'); $('enemies').textContent=state.enemies.length+state.spawnLeft; xpHud.render(state.players[me()]?.level);
    // The objective card and the boss alert sit BELOW the status dashboard instead
    // of at a guessed offset: the row's height depends on the number of stats, the
    // language and the width of the phone. Measure it after the row has been
    // written, so a wrapped row or a soldier tile that just grew its XP block
    // moves everything underneath in the same frame.
    measureHud();
    const player=state.players[me()],speedVote=state.speedRequest; $('speed').textContent=coop?tr(state.speed===2?'SPEED: 2× · SET 1×':speedVote?(speedVote.requester===me()?'CANCEL 2× REQUEST':'2× VOTE PENDING'):'REQUEST 2×'):tr('SPEED: {speed}×',{speed:state.speed}); renderAbility(player); $('speed').disabled=!menu.hidden||!!coop&&(!coopReady||state.ended||!state.running||!!speedVote&&speedVote.requester!==me());
    const speedEligible=!!speedVote&&speedVote.required.includes(me())&&!speedVote.approved.includes(me());$('speedRequest').hidden=!coop||!speedVote;$('speedRequestText').textContent=speedVote?tr('{name} requests 2× for wave {wave}. {approved}/{required} approved.',{name:state.speedRequesterName||state.players[speedVote.requester]?.name||tr('A player'),wave:speedVote.wave,approved:speedVote.approved.length,required:speedVote.required.length}):'';$('speedApprove').hidden=$('speedDecline').hidden=!speedEligible;$('speedApprove').disabled=$('speedDecline').disabled=!coopReady;
    const guest=!!coop&&!!state.hostId&&state.hostId!==me(),host=!!coop&&state.hostId===me(),vote=coop?currentWaveRequest():null;
    const requester=!!vote&&vote.requester===me(),eligible=!!vote&&vote.required.includes(me())&&!vote.approved.includes(me());
    const rosterReady=!!coop&&waveRosterReady(),otherNotReady=versus&&state.waitingForRival||teamMatch&&state.fourInfo?.otherNotReady;
    $('endRun').textContent=guest?(versus?tr('LEAVE MATCH'):tr('LEAVE CO-OP')):host&&(state.ended||(versus&&!coopReady))?tr('CLOSE PARTY'):tr('END RUN');$('endRun').disabled=(!coop&&state.ended)||!menu.hidden||(!!coop&&!coopReady&&!guest&&!state.ended&&!versus&&coop.canRequestHostEnd?.()!==true);
    $('waveRequest').hidden=!vote||state.ended;
    if(vote){const missing=Math.max(0,vote.required.length-vote.approved.length);$('waveRequestText').textContent=tr(missing===1?'{name} requests wave {wave}. {count} approval still needed.':'{name} requests wave {wave}. {count} approvals still needed.',{name:waveRequesterName(vote),wave:vote.wave,count:missing});$('waveDecline').hidden=!vote.required.includes(me());$('waveDecline').disabled=!coopReady;}
    $('start').textContent=state.ended?(coop?tr('MATCH ENDED'):tr('RESTART OPERATION')):state.running?tr('WAVE IN PROGRESS'):!coop?(state.wave===0?tr('DEPLOY / START WAVE'):tr('START NEXT WAVE')):vote?(requester?tr('CANCEL REQUEST'):eligible?tr('APPROVE WAVE'):tr('WAIT FOR PLAYERS')):!rosterReady?tr('WAIT FOR PLAYERS'):otherNotReady?tr(versus?'WAIT FOR OPPONENT':'WAIT FOR PLAYERS'):tr('REQUEST WAVE');
    $('start').disabled=(state.running&&!state.ended)||!!state.pendingPerk||!!state.pendingSector||!menu.hidden||(!!coop&&(!coopReady||state.ended||(!host&&!guest)||!rosterReady||(!vote&&otherNotReady)||(!!vote&&!requester&&!eligible)));
    publishVotePrompts(vote,speedVote);
    // The existing strips remain available after choosing Later; do not stack
    // the same request strip underneath its centered card.
    if(promptCenter?.isShowing('battle',`wave:${vote?.id}`))$('waveRequest').hidden=true;
    if(promptCenter?.isShowing('battle',`speed:${speedVote?.id}`))$('speedRequest').hidden=true;
    // The coach re-reads the field once per painted frame. That is what lets a gate
    // open without a callback (a tower already standing when the card came up) and
    // close again when the evidence disappears (the tower was sold).
    try{if(coach.isOpen()||coach.dismissed())coach.tick();}catch{/* A hint must never break the field. */}
    const coachRecall=$('coachRecall');if(coachRecall)coachRecall.hidden=!coach?.dismissed();
  }
  function localizedBossSignal(signal){const labels={'shield-warning':'SHIELD RAISING · {seconds}s',shield:'SHIELD UP · DAMAGE REDUCED · {seconds}s','bomb-warning':'BOMB STRIKE IN · {seconds}s','repair-warning':'REPAIR IN · {seconds}s','rally-warning':'RALLY IN · {seconds}s',rally:'RALLY ACTIVE · {seconds}s','jam-warning':'JAM FIELD RISING · {seconds}s',jam:'JAM FIELD ACTIVE · {seconds}s','flood-warning':'FLOOD PULSE IN · {seconds}s',flood:'FLOOD PULSE ACTIVE · {seconds}s','rail-warning':'RAIL GUNS LOADING · {seconds}s',wire:'SIGNAL WIRE ACTIVE · WEAPON DAMAGE HALVED · {seconds}s',guns:'RAIL GUNS ACCELERATING · HOLD THE BUNKER · {seconds}s'};return labels[signal.key]?tr(labels[signal.key],{seconds:signal.seconds}):signal.text;}
  function waveSummary(wave){const counts={},interval=activeTraining&&!coop?TRAINING_BOSS_EVERY:5;for(const kind of waveFormation(wave,interval)) counts[kind]=(counts[kind]||0)+1;return tr('Wave {wave}',{wave})+(wave%interval===0?tr(' · BOSS WAVE'):'')+' · '+Object.entries(counts).map(([kind,n])=>`${n} ${tr(ENEMY_TYPES[kind].label)}`).join(' · ')+(bossForWave(wave,interval)?` · ${tr(bossForWave(wave,interval).description)}`:'');}
  $('speed').onclick=()=>{if(coop){const vote=state.speedRequest,command=state.speed===2?{type:'slowSpeed'}:vote?{type:'cancelSpeed',requestId:vote.id}:{type:'requestSpeed'},context=requestFeedbackContext();dispatch(command,result=>{if(!result.ok)warn(result.reason);else if(command.type==='requestSpeed')requestReceipt('speed',result,context);else notice(command.type==='cancelSpeed'?'Speed request cancelled.':'Speed returned to 1×.');updateUI();});return;}state.speed=state.speed===1?2:state.speed===2?3:1;updateUI();};
  for(const [id,type] of [['speedApprove','approveSpeed'],['speedDecline','declineSpeed']])$(id).onclick=()=>{const vote=state.speedRequest;if(!coop||!vote)return;dispatch({type,requestId:vote.id},result=>{notice(result.ok?(type==='approveSpeed'?'Speed approved.':'Speed request declined.'):result.reason);updateUI();});};
  function startFromButton(versionChecked=false){
    // A reset after an ended run is a new game. Do not check between waves of
    // an existing operation, including an already-loaded training mission.
    if(!versionChecked&&!coop&&typeof account.beforeNewGame==='function'&&(state.ended||(!soloDeployed&&!activeMission&&!activeTraining&&state.wave===0&&!state.towers.length))){
      const currentState=state,currentUser=account.getUserId(),currentSession=account.getSessionVersion?.();
      void Promise.resolve(account.beforeNewGame()).then(ok=>{if(ok&&!coop&&state===currentState&&account.getUserId()===currentUser&&account.getSessionVersion?.()===currentSession&&account.isReady())startFromButton(true);}).catch(()=>{});return;
    }
    // A finished training contract turns into a normal endless run: the player
    // has already been handed on by the debrief, and pressing Deploy must not
    // silently replay the shortened contract.
    if(state.ended){if(!coop){if(activeTraining){activeTraining=false;activeMission=null;selectedMap=drawFreeMapId(selectedMap);}soloDeployed=true;reset(true);notice('New battlefield ready. Deploy when ready.');}return;}if(state.running)return;if(!coop)state.players.local.level=account.getLevel();
    const vote=coop?currentWaveRequest():null;
    if(vote&&vote.requester!==me()&&(!vote.required.includes(me())||vote.approved.includes(me())))return;
    const command=vote?(vote.requester===me()?'cancelWave':'approveWave'):'startWave',context=coop?requestFeedbackContext():null;
    dispatch(command==='startWave'?{type:command}:{type:command,requestId:vote.id},result=>{if(!result.ok){warn(result.reason);return;}if(!coop)soloDeployed=true;coach.event('deploy');if(!coop){const interval=activeTraining?TRAINING_BOSS_EVERY:5;sound.play(state.wave%interval===0?'boss':'wave');if(activeTraining){const cue=trainingWaveRadioCue(state.wave);if(cue)generalRadio?.play?.(cue);}}if(coop&&command==='startWave'&&(result.waitingForGuest||result.waitingForPlayers))requestReceipt('wave',result,context);else notice(!coop?tr('Wave {wave} incoming: {summary}.',{wave:state.wave,summary:waveSummary(state.wave)}):command==='cancelWave'?'Wave request cancelled.':result.waitingForGuest||result.waitingForPlayers?'Waiting for player approval.':command==='approveWave'?'Wave approved.':'Wave started.');updateUI();});
  }
  $('start').onclick=()=>{ensureAudioGesture();startFromButton();};
  $('waveDecline').onclick=()=>{const vote=coop?currentWaveRequest():null;if(!vote||!vote.required.includes(me()))return;dispatch({type:'declineWave',requestId:vote.id},result=>{notice(result.ok?'Wave postponed. Anyone can request again when ready.':result.reason);updateUI();});};
  $('endRun').onclick=async()=>{
    const guest=!!coop&&!!state.hostId&&state.hostId!==me(),teamMatch=state.fourInfo?.mode==='two-vs-two';
    if(coop&&(state.ended||(state.mode==='versus'&&!coopReady))&&!guest){if(typeof leaveParty==='function'){if(!await leaveParty())return;}else await leaveCoop();onReturnToCommand();return;}
    if((state.ended&&!guest)||!menu.hidden||(coop&&!coopReady&&!guest&&coop.canRequestHostEnd?.()!==true))return;
    const session=coop,soloState=state,mapId=state.mapId;
    const confirmed=await confirmAction({title:guest?(state.mode==='versus'||teamMatch?'Leave match?':'Leave co-op?'):'End this run?',text:guest?(state.mode==='versus'||teamMatch?(coopReady?(teamMatch?'Leave this match? Your team forfeits and the other team wins. Completed-wave rewards are saved.':'Leave this match? You forfeit and the host wins. Completed-wave rewards are saved.'):'Leave while disconnected? Your opponent may not receive your forfeit; reconnect first if possible.'):coopReady?'Leave this co-op party? The host keeps playing. Completed-wave rewards are saved; the current unfinished wave earns no rewards.':'Leave while disconnected? Rewards not yet received from the host may require reconnecting. The host keeps playing.'):session?'This ends the shared run for all players. Completed-wave rewards are kept; the current unfinished wave earns no rewards. Battle continues until confirmed.':'End this run now? Completed-wave rewards are kept; the current unfinished wave earns no rewards.',accept:guest?(state.mode==='versus'||teamMatch?'LEAVE MATCH':'LEAVE CO-OP'):'END RUN'});
    if(!confirmed||!account.isReady()||coop!==session||(!guest&&state.ended)||state.mapId!==mapId||(!session&&state!==soloState)||(session&&!coopReady&&!guest&&coop.canRequestHostEnd?.()!==true))return;
    if(session&&!guest&&!coopReady){if(await requestHostPartyEnd(report?.id))onReturnToCommand();return;}
    if(guest){
      // The host marks the guest inactive before the final reward snapshot is
      // delivered. This prevents a wave-clear race while leaving mid-battle.
      if(coopReady&&!state.ended){const result=await new Promise(resolve=>dispatch({type:'leaveRun'},resolve));if(coop!==session)return;if(!result.ok&&!state.ended){warn(result.reason);return;}}
      const resultSnapshot=state,resultReport=report,resultId=me(),wasDisconnected=!coopReady;if(typeof leaveParty==='function'){if(!await leaveParty())return;}else await leaveCoop();resultReport.left=true;resultReport.disconnected=wasDisconnected;finishReport(resultReport,resultSnapshot,resultId);onReturnToCommand();notice(teamMatch?'You left the match.':'You left co-op. The host can continue.');return;
    }
    dispatch({type:'endRun'},result=>{if(!result.ok){warn(result.reason);return;}keys.clear();notice(session?(partyFinalizationEnabled?'Waiting for all reports and saved rewards before closing the party.':'Shared run ended. Completed-wave rewards are kept. Close the party to start a new run.'):'Run ended. Completed-wave rewards are kept. Restart for a new battlefield.');updateUI();onReturnToCommand();});
  };
  $('ability').onclick=()=>{const player=state.players[me()];
    // Without a chosen ability the button used to sit there looking broken. It
    // now says where the choice lives, and pressing it repeats the directions.
    if(!abilityView?.active){warn(tr('Choose an ability under SKILLS in the command center.'));return;}
    if(abilityPending)return; // A slow network must never fire it twice.
    abilityPending=true;$('ability').disabled=true;
    const solo=!coop,targets=solo?state.enemies.map(e=>({...e})):[];dispatch({type:'airstrike'},result=>{abilityPending=false;if(!result.ok){warn(result.reason);renderAbility(state.players[me()]);return;}if(solo){const activeMap=getMap(state.mapId);combatFx.emit(player?.skills?.active||'assault',player,{enemies:targets});sound.play('ability',{classId:player?.skills?.active||'assault',variant:player?.skills?.variant||0,x:player?.x,mapWidth:activeMap.width});if(result.combos?.length){combatFx.emit('combo',{x:player.comboCue.x,y:player.comboCue.y,comboLabel:result.combos.join(' + ')},state);sound.play('combo',{x:player.comboCue.x,mapWidth:activeMap.width});}}notice(()=>tr('{ability} deployed!',{ability:tr(abilityName(state.players[me()]?.skills))})+(result.combos?.length?tr(' {combos} combo!',{combos:result.combos.map(x=>tr(x)).join(' + ')}):''));updateUI();});};
  function sendDirection(){const x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),y=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(coop){const key=`${x},${y}`;if(key!==lastDirection){lastDirection=key;coopInput.direction({type:'direction',x,y});
        // Render-only prediction: the own soldier answers instantly instead
        // of after the database round trip. The next authoritative snapshot
        // confirms or gently corrects the extrapolation (projectCoopMotion).
        const myself=state.players[me()];if(myself&&coopReady){myself.direction={x,y};if(x||y)myself.target=null;}
      }}else applyCommand(state,'local',{type:'direction',x,y});}
  window.addEventListener('keydown', e=>{if(cinematic)return;if(!menu.hidden){if(e.key==='Escape'){closeMenu();state.selectedPad=null;updateUI();}return;}if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();keys.add(key);sendDirection();}});
  window.addEventListener('keyup', e=>{keys.delete(e.key.toLowerCase());sendDirection();});
  focusPause=createFocusPause({window,document,onBlur:()=>{keys.clear();sendDirection();accumulator=0;},onChange:paused=>{coop?.setFocusPaused?.(paused);syncAudioScene();}});
  let tutorialStorage;try{tutorialStorage=window.localStorage;}catch{tutorialStorage=null;}
  // Practice steps drive the real dialogs. The sandbox comes from the account app,
  // which owns the write guard; without it the tutorial stays on mock screens.
  const tutorial=createTutorial({document,storage:tutorialStorage,
   // A finished tour hands the new soldier straight to the training contract.
   onFinish:id=>{if(trainingSeen(id,tutorialStorage))return;
    // The tour hands off after a short animation. Keep updates waiting during
    // that gap, and never start the old session's training on a new session.
    const session=account.getSessionVersion?.();trainingHandoffs++;window.setTimeout(()=>{
     if(releaseStopped||account.getUserId()!==id||account.getSessionVersion?.()!==session||!account.isReady()){trainingHandoffs--;return;}
     void Promise.resolve().then(()=>requestTrainingStart(()=>startTrainingRun())).then(ok=>{if(ok&&account.getUserId()===id&&account.getSessionVersion?.()===session)markTrainingSeen(id,tutorialStorage);}).catch(()=>{}).finally(()=>{trainingHandoffs--;});
    },400);},
   onPractice:request=>{
    const sandbox=account.sandbox;
    if(!sandbox||!request)return false;
    sandbox.enter();
    try{
     if(request==='armoryWorkshop'||request==='armoryPrestige'){openArmoryPractice('workshop');return true;}
     if(request==='armory'){openArmoryPractice('equipment');return true;}
     if(request==='skills'){openSkillsPractice();return true;}
    }catch{sandbox.leave();return false;}
    sandbox.leave();return false;
  },
   // Skipping or finishing the tour tears down whatever its practice opened:
   // the sandboxed armory/skills dialog and the sandbox itself. The dialog's
   // own close listener leaves the sandbox too; this is the path for closing
   // the tour while the practice window is still in front of the player.
   onTearDown:()=>{
    const sandbox=account.sandbox;
    if(!sandbox?.isActive?.())return;
    for(const id of ['armoryDialog','skillDialog']){const dialog=$(id);if(dialog?.open)dialog.close();}
    sandbox.leave();
   }});
  // The first-run coach runs ON TOP of the training run, without pausing it. This
  // is the "play first, read while you play" path; the modal tour above stays for
  // the replay button in Help.
  // Finishing the cards hands nothing on by itself: the run's own debrief (via
  // onTrainingComplete) owns the ending, so there is exactly one path into it.
  // The coach asks the engine where to point, because only the engine knows which
  // pads are free in the live match. A card that says "tap a build marker" without
  // a ring around one is a puzzle, not an explanation.
  const coach=featureEnabled('coach')?createCoach({document,window,storage:tutorialStorage,resolveTarget:target=>{
   if(!state)return null;
   if(target?.pad==='first-free'){
    const map=getMap(state.mapId);
    const index=map.pads.findIndex((pad,i)=>!state.towers.some(t=>(t.pad??t.padId)===i));
    return index<0?null:{pad:map.pads[index]};
   }
   if(target?.pad==='occupied'){
    const tower=state.towers[0];
    if(!tower)return null;
    const map=getMap(state.mapId);
    return {pad:map.pads[tower.pad??tower.padId]};
   }
   if(target?.element){
    const node=document.querySelector(target.element);
    return node?{element:node}:null;
   }
   return null;
  },
  // The coach proves a step by reading the field, not by trusting a callback. This
  // is that view: the live towers (with their ids) and this soldier. Kept as a small
  // object so the card never has to know the shape of a match.
  observe:()=>{
   if(!state)return null;
   const player=state.players?.[me()]||null;
   return {towers:state.towers,localId:me(),players:state.players,wave:state.wave,running:!!state.running,playerTarget:player?.target||null,x:player?.x,y:player?.y};
  },
  onStepChange:step=>{
   if(step?.voiceClip)generalRadio?.play?.(step.voiceClip);
  }}):null;
  // The account reports practice as it happens and drops the sample soldier when the
  // dialog closes; this hands the result to the tour, which waits on the step.
  account.sandbox?.onPracticeChange?.(seen=>{
   if(!seen)return;
   tutorial.practiceResult('skills',seen.skills);
   tutorial.practiceResult('armory',seen.armory);
   tutorial.practiceResult('workshop',seen.workshop);
  });
  // The recall button: closing the card puts the task away, this brings it back.
  const coachRecall=$('coachRecall');
  if(coachRecall)coachRecall.onclick=()=>{if(coach?.reopen())updateUI()};
  // The real Skills dialog, opened against the sample soldier.
  function openSkillsPractice(){
   const status=$('saveStatus');if(status)status.textContent=tr('Sample data: nothing is saved.');
   $('skillOpen').onclick?.();
  }
  function openArmoryPractice(category){
    closeMenu();keys.clear();
    $('armoryOpen').onclick?.();
    $(category==='workshop'?'armoryWorkshopTab':'armoryEquipmentTab').onclick?.();
    // Set after the real opener, which clears the status line as it opens.
    const status=$('armoryStatus');if(status&&account.sandbox?.isActive?.())status.textContent=tr('Sample data: nothing is saved.');
  }
  $('tutorialReplay').onclick=()=>{closeMenu();state.selectedPad=null;keys.clear();sendDirection();tutorial.replay(account.getUserId());updateUI();};
  const menu=$('radialMenu');
  const options=[0,1,2,3].map(i=>$('radial'+i));
  let menuMode='actions',menuTowerKey=null,detailAvailability=null,detailContent=null,menuRevision=0;
  let selectionEpoch=0,reservedPad=null,reservationQueue=Promise.resolve(),lastReservationRefresh=0,pendingClaims=0;const orphanReleases=new Map();
  function reservationCommand(session,input,command,cancelled=null){
    const operation=reservationQueue.then(async()=>{
      async function send(packet){
        for(let attempts=0;attempts<40;attempts++){
          if(coop!==session||coopInput!==input)return {ok:false,reason:'Party changed.'};
          const result=await input.execute(packet);
          if(result.reason!=='Wait for the previous action.')return result;
          await new Promise(resolve=>setTimeout(resolve,100));
        }
        return {ok:false,reason:'Wait for the previous action and try again.'};
      }
      const result=await send(command);
      // Clean up a late claim before the next queued reservation can run.
      if(result.ok&&cancelled?.())await send({type:'releaseBuild',pad:command.pad});
      return result;
    });
    reservationQueue=operation.catch(()=>{});return operation;
  }
  function releaseReservation(){
    const pad=reservedPad,session=coop,input=coopInput;reservedPad=null;
    if(pad!==null&&session&&input)void reservationCommand(session,input,{type:'releaseBuild',pad});
  }
  // A timed-out command can still be committed by the host. Once the outcome
  // is reflected in a ready snapshot, release any claim with no open/pending
  // selection. Serialize cleanup with claims so it cannot erase a newer one.
  function reconcileOrphanReservations(){
    if(!coop||!coopReady||!coopInput||!hasCoopSnapshot||state.ended||pendingClaims)return;
    const session=coop,input=coopInput;
    for(const [key,claim] of Object.entries(state.buildReservations||{})){
      const pad=Number(key);if(!Number.isInteger(pad)||claim?.playerId!==me()||pad===reservedPad||orphanReleases.has(pad))continue;
      const marker={session,input};orphanReleases.set(pad,marker);
      void reservationCommand(session,input,{type:'releaseBuild',pad}).finally(()=>{if(orphanReleases.get(pad)===marker)orphanReleases.delete(pad);});
    }
  }
  const towerKey=t=>t?`${t.id??''}:${t.type}:${t.level}:${t.classPath||''}:${t.classTier||0}`:'empty';
  function closeMenu(){selectionEpoch++;menuRevision++;releaseReservation();menu.hidden=true;menuPad=null;menuTowerKey=null;detailAvailability=null;detailContent=null;}
  function showMenu(pad,mode='actions',refresh=false){
    const tower=state.towers.find(t=>t.pad===pad);menuPad=pad;menuMode=mode;state.selectedPad=tower?pad:null;
    if(!refresh){menuRevision++;menuTowerKey=towerKey(tower);keys.clear();sendDirection();}
    const menuNotice=text=>{if(!refresh)notice(text);};
    const actions=[];
    if(!tower){
      const tutorialLock=trainingBuildLocked(state);
      types.forEach((type,i)=>actions.push({label:tr(type.name),price:type.cost,summary:tr(type.description)+(tutorialLock?tr(' · One tower, one upgrade in training'):''),unaffordable:supplies()<type.cost,locked:tutorialLock,description:tr('View {name}, {cost} supplies. {description}',{name:tr(type.name),cost:type.cost,description:tr(type.description)})+(tutorialLock?tr('. The training contract walks one tower and its upgrade first.'):'')+(supplies()<type.cost?tr('. Not enough supplies to build.'):'' ),run:()=>{
        showDetails(()=>tr(type.name),()=>tr('{description}. Base damage: {damage} per shot, firing interval: {interval} seconds, range: {range}. Damage varies by enemy type.',{description:tr(type.description),damage:type.damage,interval:type.interval,range:type.range}),type.cost,'BUILD',()=>{
          dispatch({type:'build',pad,towerType:i},result=>{if(!result.ok){$('towerDetailsCost').textContent=localizeGameMessage(result.reason,tr);return;}// The id is what makes the evidence check meaningful: the card later asks the
// field whether *this* tower still stands, so selling it takes the step back.
          const built=state.towers.find(t=>t.pad===pad);
          // A successful host build already consumed this reservation. Sending a
          // redundant release occupies the one-command transport just as the
          // player taps the new tower, and can reject that first upgrade.
          if(coop&&reservedPad===pad)reservedPad=null;
          coach.event('build',{builtTowerId:built?built.id:null});if($('towerDetails').open)$('towerDetails').close();if(!coop){const activeMap=getMap(state.mapId);combatFx.emit('build',activeMap.pads[pad],state);sound.play('build',{towerType:i,x:activeMap.pads[pad]?.x,mapWidth:activeMap.width});}state.selectedPad=pad;closeMenu();notice(()=>tr('{name} built. Tap it to upgrade or sell.',{name:tr(type.name)}));updateUI();});
        });
      }}));
      menuNotice(coop?'Tap a tower for details. Grey options need more supplies. Battle continues in co-op.':'Tap a tower for details. Grey options need more supplies. Battle paused.');
    }else if(mode==='branches'){
      const cost=upgradeCostFor(tower,upgradeCost(tower.level)),sharedUpgrade=state.individualSupplies&&tower.ownerId!==me()?tr(' You pay for this upgrade; any sale refund goes to {name}.',{name:state.players[tower.ownerId]?.name||tr('the builder')}):'';
      // The unlock level is the protocol's rule and the field shimmer's, not a
      // third copy of the numbers.
      branches[tower.type].forEach((branch,i)=>{const required=branchUnlockLevel(i),locked=(state.players[me()]?.level||1)<required;actions.push({icon:'branch',price:cost,label:tr(branch.name),summary:tr(branch.description)+(locked?tr(' · LOCKED UNTIL LEVEL {level}',{level:required}):''),unaffordable:supplies()<cost,locked,lockLevel:required,description:tr('View {name}: {description}. {cost} supplies',{name:tr(branch.name),description:tr(branch.description),cost})+(locked?tr('. Unlocks at level {level}.',{level:required}):'')+(supplies()<cost?tr('. Not enough supplies.') :''),run:()=>showDetails(()=>tr(branch.name),()=>tr('{description}. Level 3 also increases the base damage multiplier before specialization and enemy modifiers. This specialization is permanent.',{description:tr(branch.description)})+' '+tr('RANK II at level 4: {rank2}. RANK III at level 5: {rank3}.',{rank2:tr(branch.rank2),rank3:tr(branch.rank3)})+(state.individualSupplies&&tower.ownerId!==me()?tr(' You pay for this upgrade; any sale refund goes to {name}.',{name:state.players[tower.ownerId]?.name||tr('the builder')}):''),cost,'UPGRADE',()=>upgrade(i),required)});});
      menuNotice(coop?'Tap a specialization to see its effects. Battle continues in co-op.':'Tap a specialization to see its effects. Battle paused.');
    }else if(mode==='confirmSell'){
      const ownerName=state.players[tower.ownerId]?.name||tr('tower owner'),mine=!state.individualSupplies||tower.ownerId===me(),refund=towerRefund(tower);
      actions.push({icon:'confirmSell',price:mine?`+${refund}`:null,label:tr('Confirm sale'),summary:mine?tr('Remove this tower and recover half of its total cost.'):tr('Remove this tower; {name} receives {amount} supplies.',{name:ownerName,amount:refund}),description:mine?tr('Confirm sale for {amount} supplies',{amount:refund}):tr('Confirm sale. {name} receives {amount} supplies',{name:ownerName,amount:refund}),run:()=>{dispatch({type:'sell',pad,...(coop?{expectedTowerId:tower.id,expectedLevel:tower.level}:{})},result=>{if(!result.ok){warn(result.reason);return;}if(!coop){const activeMap=getMap(state.mapId);sound.play('sell',{x:activeMap.pads[pad]?.x,mapWidth:activeMap.width});}state.selectedPad=null;closeMenu();notice(result.refundTo&&result.refundTo!==me()?tr('Tower sold. {name} receives {amount} supplies.',{name:state.players[result.refundTo]?.name||tr('the owner'),amount:result.refund}):tr('Tower sold. +{amount} supplies.',{amount:result.refund}));updateUI();});}});
      actions.push({icon:'cancel',label:tr('Cancel'),summary:tr('Keep this tower.'),description:tr('Cancel sale'),run:()=>showMenu(pad)});
      menuNotice(coop?'Confirm sale for half the investment, or cancel. Battle continues in co-op.':'Confirm sale for half the investment, or cancel. Battle paused.');
    }else{
      const cost=upgradeCostFor(tower,upgradeCost(tower.level)),max=cost===null,display=towerDisplay(tower.level),prestiging=display.level===MAX_TOWER_LEVEL,sharedUpgrade=state.individualSupplies&&tower.ownerId!==me()?tr(' You pay for this upgrade; any sale refund goes to {name}.',{name:state.players[tower.ownerId]?.name||tr('the builder')}):'';
      actions.push({icon:'upgrade',price:max?null:cost,unaffordable:!max&&supplies()<cost,label:max?tr('Upgrade unavailable'):tr(tower.level===2?'Choose specialization · {cost}':prestiging?'Prestige · {cost}':'Confirm upgrade · {cost}',{cost}),summary:max?tr('This tower cannot be upgraded further.'):tower.level===2?tr('Choose a permanent specialization.'):(prestiging?tr('Prestige {prestige}: level resets to 1; power and specialization stay, and damage increases.',{prestige:display.prestige+1}):tr('Confirm purchase: +0.3 damage multiplier.')+(tower.branch!=null&&tower.level>=3&&tower.level<5?' '+tr('Then RANK {rank}: {mechanic}',{rank:tower.level+1===4?2:3,mechanic:tr(branches[tower.type][tower.branch]['rank'+(tower.level+1===4?2:3)])}):''))+sharedUpgrade,disabled:max,unaffordable:!max&&supplies()<cost,description:max?tr('Upgrade unavailable'):tr('Upgrade to level {level}, prestige {prestige}, {cost} supplies',{level:towerDisplay(tower.level+1).level,prestige:towerDisplay(tower.level+1).prestige,cost})+(supplies()<cost?tr('. Not enough supplies.'):''),run:()=>{if(tower.level===2)showMenu(pad,'branches');else if(supplies()>=cost)upgrade(0);else warn('Not enough supplies to upgrade.');}});
      const mine=!state.individualSupplies||tower.ownerId===me(),ownerName=state.players[tower.ownerId]?.name||tr('the owner'),refund=towerRefund(tower);
      actions.push({icon:'sell',price:mine?`+${refund}`:null,label:tr('Sell tower'),summary:mine?tr('Recover half of build and upgrade costs.'):tr('Half the costs go to {name}.',{name:ownerName}),description:mine?tr('Sell tower for {amount} supplies',{amount:refund}):tr('Sell tower; refund goes to {name}',{name:ownerName}), run:()=>showMenu(pad,'confirmSell')});
      const cls=classUpgradeState(state.players[me()],tower);
      const clsCfg=classPathConfig(cls.classId),clsClassName=SKILL_PATH_MAP[cls.classId]?.name||cls.classId||'';
      const clsReady=cls.reason==='ready',clsMaxed=cls.reason==='maxed',clsLocked=!clsReady&&!clsMaxed;
      const clsLockRank=cls.reason==='rank-locked'?cls.requiredRank:0;
      const clsOwnerName=state.players[tower.ownerId]?.name||tr('the builder');
      const clsReason=cls.reason==='not-owner'?tr('Owned by {name}. Only the builder may attach their class path.',{name:clsOwnerName}):cls.reason==='no-class'?tr('Choose a class in Skills at level 2.'):cls.reason==='rank-locked'?tr('Requires {name} rank {rank} in Skills.',{name:tr(clsClassName),rank:cls.requiredRank}):clsMaxed?tr('Class upgrade path mastered.'):'';
      const clsPathLabel=cls.spec?.label||clsCfg?.name||'Class Path';
      const clsSummary=cls.spec?.summary||'';
      actions.push({
        icon:'classUpgrade',
        classId:cls.classId||null,
        price:cls.cost??null,
        unaffordable:clsReady&&supplies()<cls.cost,
        locked:clsLocked,
        lockRank:clsLockRank,
        label:cls.reason==='no-class'||cls.reason==='not-owner'?tr(clsCfg?.name||'Class Path'):clsReady?tr(clsPathLabel):tr(clsCfg?.name||'Class Path'),
        summary:clsReady?tr(clsSummary):clsReason,
        description:clsReady?tr('{name}, {cost} supplies. {effect}',{name:tr(clsPathLabel),cost:cls.cost,effect:tr(clsSummary)}):`${tr(clsPathLabel)}. ${clsReason}`,
        run:()=>{
          const title=()=>clsCfg?`${tr(clsClassName)} · ${tr(clsPathLabel)}`:tr('Class Tower Upgrade');
          const detailText=()=>cls.reason==='no-class'?tr('Choose a soldier class in Skills at level 2 and reach rank 2 to unlock your class tower upgrade path on every tower.'):cls.reason==='not-owner'?tr('Only {name} can apply their class tower upgrade path to this tower (separate from level-3 tower kits).',{name:clsOwnerName}):clsMaxed?`${tr('Tier I')}: ${tr(clsCfg.tiers[0].summary)} · ${tr('Tier II')}: ${tr(clsCfg.tiers[1].summary)}`:`${clsReady?tr('Tier {tier}',{tier:cls.nextTier===2?'II':'I'}):clsReason}: ${tr(clsSummary)} ${tr('Separate from level-3 tower kits.')}`;
          showDetails(title,detailText,cls.cost??null,'CLASS UPGRADE',()=>{
            if(!clsReady)return;
            dispatch({type:'classUpgrade',pad,...(coop?{expectedTowerId:tower.id,expectedLevel:tower.level}:{})},result=>{
              if(!result.ok){if($('towerDetails').open)$('towerDetailsCost').textContent=localizeGameMessage(result.reason,tr);else warn(result.reason);return;}
              if(!coop){const activeMap=getMap(state.mapId);combatFx.emit('classUpgrade',activeMap.pads[pad],state);sound.play('classUpgrade',{classId:result.classPath,x:activeMap.pads[pad]?.x,mapWidth:activeMap.width});}
              notice(()=>tr('{name} applied.',{name:tr(result.label||clsPathLabel)}));
              if($('towerDetails').open)$('towerDetails').close();
              closeMenu();updateUI();
            });
          },0,{lockReason:clsReason,forceDisabled:!clsReady});
        }
      });
      const name=tower.branch!=null?branches[tower.type][tower.branch].name:types[tower.type].name;
      menuNotice(()=>tr(towerDisplay(tower.level).prestige?'{name} · level {level} · prestige {prestige} · range {range}. {battle}':'{name} · level {level} · range {range}. {battle}',{name:tr(name),level:towerDisplay(tower.level).level,prestige:towerDisplay(tower.level).prestige,range:Math.round(getTowerRange(tower)),battle:tr(coop?'Battle continues in co-op.':'Battle paused.')}));
    }
    function upgrade(branch){const next=towerDisplay(tower.level+1),upgradeCue=tower.level===2?'branch':next.level===1&&next.prestige>0?'prestige':'upgrade';dispatch({type:'upgrade',pad,branch,...(coop?{expectedTowerId:tower.id,expectedLevel:tower.level}:{})},result=>{if(!result.ok){if($('towerDetails').open)$('towerDetailsCost').textContent=localizeGameMessage(result.reason,tr);else warn(result.reason);return;}coach.event('upgrade',{builtTowerId:tower.id});if(!coop){const activeMap=getMap(state.mapId);combatFx.emit('upgrade',activeMap.pads[pad],state);sound.play(upgradeCue,{x:activeMap.pads[pad]?.x,mapWidth:activeMap.width});}notice(()=>next.level===1?tr('Tower reached prestige {prestige} · level 1.',{prestige:next.prestige}):tr(next.prestige?'Tower upgraded to level {level} · prestige {prestige}.':'Tower upgraded to level {level}.',{level:next.level,prestige:next.prestige}));if($('towerDetails').open)$('towerDetails').close();closeMenu();updateUI();});}
    menu.dataset.mode=tower?'actions':'build';
    $('sheetMode').textContent=tr(coop?'BATTLE CONTINUES':'BATTLE PAUSED');
    $('sheetTitle').textContent=!tower?tr('Build defense'):mode==='branches'?tr('Choose specialization'):mode==='confirmSell'?tr('Sell tower?'):tr(towerDisplay(tower.level).prestige?'{name} · Level {level} · Prestige {prestige}':'{name} · Level {level}',{name:tr(tower.branch!=null?branches[tower.type][tower.branch].name:types[tower.type].name)+(tower.branch!=null&&specializationRank(tower)>0?tr(' · Rank {rank}',{rank:specializationRank(tower)}):''),level:towerDisplay(tower.level).level,prestige:towerDisplay(tower.level).prestige});
    $('sheetHint').textContent=!tower?tr('Choose a tower to inspect.'):mode==='branches'?tr('This choice is permanent.'):mode==='confirmSell'?tr('Confirm or cancel the sale.'):tr('Range {range} · tap an action for details',{range:Math.round(getTowerRange(tower))});
    options.forEach((button,i)=>{const action=actions[i];button.hidden=!action;button.disabled=!action||!!action.disabled;if(action?.icon)button.dataset.icon=action.icon;else delete button.dataset.icon;button.classList.toggle('unaffordable',!!(action?.unaffordable||action?.locked));button.classList.toggle('locked',!!action?.locked);$('menuName'+i).textContent=action?action.label:'';const artNode=$('menuArt'+i);if(artNode&&typeof artNode.replaceChildren==='function'){if(action?.icon==='classUpgrade'&&typeof document.createElementNS==='function')artNode.replaceChildren(towerClassIcon(document,action.classId));else artNode.replaceChildren();}const priceNode=$('menuPrice'+i);if(priceNode)priceNode.textContent=action?(action.locked?(action.lockLevel?tr('Lv {level}',{level:action.lockLevel}):action.lockRank?tr('Rank {rank}',{rank:action.lockRank}):'—'):(action.price!=null?String(action.price):'')):'';$('menuDesc'+i).textContent=action?(action.summary||'')+(action.unaffordable?tr(' · Not enough supplies'):''):'';button.setAttribute('aria-label',action?action.description:'');button.onclick=action?()=>action.run():null;});
    menu.hidden=false;if(!refresh)updateUI();
  }
  function refreshDetails(){
    if(!$('towerDetails').open||!detailAvailability)return;
    const {cost,required,lockReason,forceDisabled}=detailAvailability;if(detailContent){$('towerDetailsTitle').textContent=detailContent.title();$('towerDetailsText').textContent=detailContent.text();$('towerDetailsConfirm').textContent=cost!=null?`${tr(detailContent.verb)} · ${cost}`:tr(detailContent.verb);}const changed=menuPad===null||towerKey(state.towers.find(t=>t.pad===menuPad))!==menuTowerKey;
    const locked=(state.players[me()]?.level||1)<required,cantAfford=cost!=null&&supplies()<cost,reason=changed?'Tower changed. Close and select it again.':lockReason?lockReason:locked?tr('Unlocks at soldier level {level}.',{level:required}):cantAfford?'Not enough supplies':'';
    $('towerDetailsCost').textContent=(cost!=null?tr('Cost: {cost} supplies · Available: {available}',{cost,available:supplies()}):tr('Available: {available} supplies',{available:supplies()}))+(reason?' · '+tr(reason):'');
    $('towerDetailsConfirm').disabled=!!forceDisabled||changed||locked||cantAfford;
  }
  function refreshTowerMenu(){
    if(menu.hidden||menuPad===null)return;
    if(reservedPad!==null&&state.buildReservations?.[reservedPad]?.playerId!==me()){
      if(state.towers.some(t=>t.pad===reservedPad)){refreshDetails();return;}
      if($('towerDetails').open)$('towerDetails').close();closeMenu();state.selectedPad=null;warn('Build reservation expired. Select the spot again.');return;
    }
    if(reservedPad!==null&&performance.now()-lastReservationRefresh>20000){
      lastReservationRefresh=performance.now();const session=coop,input=coopInput,pad=reservedPad;
      if(session&&input)void reservationCommand(session,input,{type:'reserveBuild',pad});
    }
    if(towerKey(state.towers.find(t=>t.pad===menuPad))===menuTowerKey)showMenu(menuPad,menuMode,true);
    refreshDetails();
  }
  function showDetails(title,text,cost,verb,confirm,required=0,{lockReason='',forceDisabled=false}={}){
    menuRevision++;detailContent={title:typeof title==='function'?title:()=>title,text:typeof text==='function'?text:()=>text,verb};
    detailAvailability={cost,required,lockReason,forceDisabled};const button=$('towerDetailsConfirm');button.onclick=confirm;
    $('towerDetails').showModal();refreshDetails();
  }
  $('towerDetailsBack').onclick=()=>{menuRevision++;$('towerDetails').close();};
  function dismissTower(){if($('towerDetails').open)$('towerDetails').close();closeMenu();state.selectedPad=null;notice('Tower menu closed.');updateUI();}
  $('radialClose').onclick=dismissTower;
  bindDialogBackdrop($('towerDetails'),dismissTower);
  $('towerDetails').addEventListener('cancel',event=>{event.preventDefault();dismissTower();});
  document.addEventListener('click',event=>{
    const tap=viewportTap;viewportTap=null;
    const samePointer=tap&&(event.pointerId==null||event.pointerId<0||event.pointerId===tap.id);
    const sameClick=samePointer&&event.detail!==0&&Date.now()-tap.time<1000&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)<3;
    // A click may even be retargeted onto the newly opened sheet on touch.
    // Swallow only that compatibility click, not the next physical tap or a
    // keyboard activation; a later outside click still dismisses the menu.
    if(sameClick){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();return;}
    if(menu.hidden||$('towerDetails').open||document.querySelector('dialog[open]')||menu.contains(event.target))return;
    dismissTower();event.preventDefault();event.stopPropagation();
  },true);
  async function selectBattlePoint(x,y){
    ensureAudioGesture();
    if(battleViewport&&!menu.hidden){dismissTower();return;}
    selectionEpoch++;
    if(state.ended||(coop&&!coopReady))return;const rect=canvas.getBoundingClientRect(),map=getMap(state.mapId),view=battleViewport?.getViewport();
    if(state.mode==='versus'&&y>=(map.height||540)){warn('That is your opponent’s battlefield. Build and move on your own lane above.');return;}
    const radius=Math.min(56,Math.max(28,22*logicalWidth/rect.width/(view?.scale||1))),pads=map.pads;let index=-1,nearest=radius;
    pads.forEach((p,i)=>{const d=Math.hypot(p.x-x,p.y-y);if(d<nearest){index=i;nearest=d;}});
    if(index<0){closeMenu();state.selectedPad=null;const mx=Math.max(12,Math.min((map.width||960)-12,x)),my=Math.max(12,Math.min((map.height||540)-12,y));
      if(coop&&coopReady){const myself=state.players[me()];if(myself){myself.target={x:mx,y:my};myself.direction={x:0,y:0};}}
      dispatch({type:'move',x:mx,y:my},result=>{if(result.ok){const p=state.players[me()];coach.event('move',{moveFrom:{x:p?.x,y:p?.y}});}notice(result.ok?'Hero moving to position.':result.reason);updateUI();});return;}
    const selected=index;
    if(coop&&!state.towers.some(t=>t.pad===selected)){
      closeMenu();state.selectedPad=null;const epoch=selectionEpoch,session=coop,input=coopInput;
      notice('Reserving build spot…');
      const cancelled=()=>epoch!==selectionEpoch||coop!==session||!coopReady;
      pendingClaims++;
      try{
        const result=await reservationCommand(session,input,{type:'reserveBuild',pad:selected},cancelled);
        if(cancelled())return;
        if(!result.ok){warn(result.reason||'Build spot could not be reserved.');return;}
        reservedPad=selected;lastReservationRefresh=performance.now();
      }finally{pendingClaims--;reconcileOrphanReservations();}
    }else if(!menu.hidden||reservedPad!==null)closeMenu();
    showMenu(selected);
    // The ring is placed around the pad that was just tapped, so the old "scroll the
    // page until the sheet no longer covers the spot" nudge is gone with the sheet:
    // nothing is anchored to the bottom edge any more.
    anchorMenu(selected);
  }

  // Put the ring around the pad. The buttons must stay inside the field, so the anchor
  // is CLAMPED rather than the ring being shrunk: on a 320px phone the ring is about
  // 150px wide and a pad near the edge would otherwise push two buttons off screen.
  // Returns the effective ring radius so the CSS and the geometry cannot disagree.
  function anchorMenu(pad){
    if(!menu||menu.hidden)return 0;
    const index=Number.isInteger(pad)?pad:menuPad;
    return placeMenu(index,menuSpace());
  }
  // Where the ring may go: the battlefield box, clipped to the viewport with an 8px
  // margin. Every edge is derived defensively - a partial rect (or none at all) must
  // fall back to the viewport instead of producing NaN and freezing the ring.
  function menuSpace(){
    const vw=window.innerWidth||1024,vh=window.innerHeight||768;
    let box=null;
    try{box=canvas.getBoundingClientRect();}catch{/* headless */}
    const num=value=>Number.isFinite(value)?value:null;
    const left=Math.max(8,num(box?.left)??8);
    const top=Math.max(8,num(box?.top)??8);
    const right=Math.min(vw-8,num(box?.right)??((num(box?.width)!==null?left+box.width:vw-8)));
    const bottom=Math.min(vh-8,num(box?.bottom)??((num(box?.height)!==null?top+box.height:vh-8)));
    return {left,top,right,bottom,width:Math.max(0,right-left),height:Math.max(0,bottom-top)};
  }
  function placeMenu(index,space){
    const pad=getMap(state.mapId).pads[index];
    if(!pad)return 0;
    const rect=canvas.getBoundingClientRect();
    // The button size is the CSS custom property's business; read the live width when
    // the DOM can give one, otherwise fall back to the same number the stylesheet uses.
    const first=typeof menu.querySelector==='function'?menu.querySelector('.sheet-option'):null;
    const measured=typeof first?.getBoundingClientRect==='function'?first.getBoundingClientRect().width:0;
    const button=Math.round(measured||78);
    const radius=Math.max(56,Math.min(104,Math.round(Math.min(space.width,space.height)/2-button*0.45)));
    // The pan/zoom viewport (four-player maps) moves the world under the glass, so the
    // pad's screen position has to be derived here rather than remembered from the tap.
    const view=battleViewport?.getViewport?.()||null;
    const scale=rect.height/logicalHeight;
    const screenX=rect.left+(view?(pad.x-view.x)*view.scale:pad.x)*rect.width/logicalWidth;
    const screenY=rect.top+(view?(pad.y-view.y)*view.scale:pad.y)*scale;
    const half=radius+button/2+6;
    const x=Math.min(space.right-half,Math.max(space.left+half,screenX));
    const y=Math.min(space.bottom-half,Math.max(space.top+half,screenY));
    menu.style.left=`${Math.round(x)}px`;
    menu.style.top=`${Math.round(y)}px`;
    if(typeof menu.style.setProperty==='function'){
      menu.style.setProperty('--ring-radius',`${radius}px`);
      menu.style.setProperty('--ring-size',`${button}px`);
    }
    if(menu.dataset)menu.dataset.radius=String(radius);
    return radius;
  }
  canvas.addEventListener('click',e=>{if(battleViewport)return;const rect=canvas.getBoundingClientRect();return selectBattlePoint((e.clientX-rect.left)*logicalWidth/rect.width,(e.clientY-rect.top)*logicalHeight/rect.height);});
  let uiElapsed=0;
  // Bumped when a sprite PNG finishes loading. It is part of the terrain cache key
  // (`artVersion`), because the ground layer bakes its own "art or fallback" decision
  // into a canvas that is reused until its revision changes - without this the very
  // first frame decided, permanently, and a phone that decoded slowly showed vector
  // markers ("YOU", "I") for the whole match.
  let artVersion=0;
  const onSpritesReady=()=>{artVersion++;};
  function update(dt){
    if(radioTime>0&&!cinematic){radioTime=Math.max(0,radioTime-dt);if(!radioTime)$('storyRadio').hidden=true;}
    const dialogPause=$('gameConfirm')?.open||$('settingsDialog')?.open;
    const focusPaused=visualPrefs.autoPause&&focusPause.isSoloPaused();
    if(coop||focusPaused||state.ended||commandMenuOpen||missionBoardOpen||cinematic||!menu.hidden||tutorial.isOpen()||dialogPause||!account.isReady()){accumulator=0;return;}
    accumulator+=dt*state.speed;
    let stepped=false;
    while(accumulator>=STEP){
      stepped=true;
      accumulator-=STEP;
      for(const event of stepMatch(state)){
        const eventMap=getMap(state.mapId);
        if(event.type==='skillCombo'){combatFx.emit('combo',{x:event.x,y:event.y,comboLabel:event.name},state);sound.play('combo',{x:event.x,mapWidth:eventMap.width});}
        else if(event.type==='bossSpawn'){coach.boss();sound.play('boss');}
        else if(event.type==='bunkerHit'){sound.play('impact',{x:eventMap.bunker?.x??900,mapWidth:eventMap.width});combatFx.emit('bunkerHit',{x:900,y:400,comboLabel:`−${Math.round(event.damage*10)/10}`},state);warn(()=>tr('{enemy} reached the bunker! −{damage} health.',{enemy:tr(ENEMY_TYPES[event.kind]?.label||'Enemy'),damage:Math.round(event.damage*10)/10}));}
        else if(event.type==='bounty'){sound.play('loot',{bounty:true});notice('Trophy gun! The boss kill pays +25 supplies.');}else if(event.type==='lootDrop'){sound.play('loot');notice(()=>tr('Supply cache found! +{count} supplies.',{count:event.supplies}));}
        else if(event.type==='bossAbility'&&event.ability==='bomb'){sound.play('impact',{x:eventMap.bunker?.x??900,mapWidth:eventMap.width});combatFx.emit('bunkerHit',{x:900,y:400,comboLabel:`−${Math.round(event.damage*10)/10}`},state);warn(()=>tr('Bomber struck the bunker! −{damage} health.',{damage:Math.round(event.damage*10)/10}));}
        else if(event.type==='bossAbility'&&event.ability==='railgun'){sound.play('impact',{x:eventMap.bunker?.x??900,mapWidth:eventMap.width});combatFx.emit('bunkerHit',{x:900,y:400,comboLabel:`−${Math.round(event.damage*10)/10}`},state);warn(()=>tr('Rail guns struck the bunker! −{damage} health.',{damage:Math.round(event.damage*10)/10}));}
        else if(event.type==='bossAbility'){sound.play('bossAbility',{boss:event.boss,ability:event.ability});}
        else if(event.type==='rubbleCleared'){sound.play('rubble');warn('Rubble cleared! Long-range shots are no longer weakened in that zone.');}
        else if(event.type==='iceBroken'){sound.play('ice');warn('Thin ice broke! Tanks slow down and take more damage.');}
        else if(event.type==='defeat'){sound.play('defeat');warn('Bunker lost. The operation has failed.');}
        else if(event.type==='waveCleared'){if(!activeMission)account.recordScore?.('solo',event.wave);sound.play('clear');const target=report;if(!activeTraining||(trainingRewards&&event.wave>trainingWaveFloor)){trackReportSave(target,account.awardXP(event.xp,event.wave,!experimentalWorkshop?null:runReceipt()),{reward:true});if(activeTraining)account.recordTutorialWave?.(event.wave);}const interval=activeTraining?TRAINING_BOSS_EVERY:5;notice(event.wave%interval===0?tr('Boss wave {wave} cleared! Choose a field upgrade. +{xp} XP.',{wave:event.wave,xp:event.xp}):tr('Wave cleared! +20 supplies and +{xp} XP. Prepare for the next wave.',{xp:event.xp}));}
      }
      // The boss of wave 7 ends the training contract: seven cleared waves and
      // the debrief (with defeat fallback also granting Level 2 once).
      if(activeTraining&&state.ended&&!trainingDone&&state.endReason==='retired'){
       trainingDone=true;coach.stop();generalRadio?.stop?.();
      }
      if(activeTraining&&state.ended&&!trainingDone&&!state.endReason?.startsWith('training')){
       trainingDone=true;trainingBonusPaid=true;coach.complete();
       const xp=FIRST_RUN_DEFEAT_XP;
       // A replay pays nothing: the first run can be restarted from Settings, and a
       // reward that can be farmed by restarting the tutorial is not a reward.
       if(trainingRewards)trackReportSave(report,account.awardXP(xp,Math.max(1,state.completedWave||1)),{reward:true});
       if(typeof account.claimTutorialOutcome==='function')void account.claimTutorialOutcome({victory:false,rewards:trainingRewards,waves:Math.max(1,state.completedWave||1)});
       generalRadio?.play?.('mission-complete');
       notice(()=>tr(trainingRewards?'Run over. {xp} XP for the attempt - time to gear up.':'Run over. This replay pays no XP - the first run already did.',{xp}));
      }
      if(activeTraining&&!state.ended&&trainingWon(state)&&!trainingDone){
       trainingDone=true;state.ended=true;state.running=false;state.endReason='training-complete';
       coach.complete();
       sound.play('victory');
       // The seven waves + bonus pay 450 XP total so the first skill point is
       // guaranteed with headroom. Credited once per character.
       const bonus=trainingBonusXP();
       if(trainingRewards&&bonus>0&&state.completedWave>=TRAINING_WAVES&&!trainingBonusPaid)trackReportSave(report,account.awardXP(bonus,state.completedWave),{reward:true});
       trainingBonusPaid=true;
       if(typeof account.claimTutorialOutcome==='function')void account.claimTutorialOutcome({victory:true,rewards:trainingRewards,waves:state.completedWave||TRAINING_WAVES});
       generalRadio?.play?.('mission-complete');
       notice(()=>tr('Training contract complete! {xp} XP earned. Welcome to the Iron Path, soldier.',{xp:trainingXP()}));
      }
      if(activeStory&&!state.ended){const outcome=stepStory(activeStory,state,STEP);
       for(const entry of drainStoryNotifications(activeStory)){
        if(entry.type==='decision')showDecisionPanel(entry);
        else if(entry.type==='decisionResolved'){hideDecisionPanel();if(entry.confirm)storyRadio(entry.confirm);if(entry.supplies)notice(tr(EVENT_TEMPLATES.suppliesGranted,{amount:entry.supplies}));}
        else if(entry.type==='setpiece'){storyRadio(entry.text,false,null,entry.speaker);sound.play('strike');}
        else if(entry.type==='reinforce')storyRadio(entry.text?entry.text:tr(EVENT_TEMPLATES.reinforcements,{count:entry.count}),false,null,entry.speaker);
        else if(entry.type==='side')storyRadio(entry.outcome==='complete'?tr(EVENT_TEMPLATES.bonusComplete,{label:tr(entry.label),reward:entry.reward}):tr(EVENT_TEMPLATES.bonusMissed,{label:tr(entry.label)}));
       }
       if(outcome){notice(()=>translateStoryDetail(outcome.message,tr));if(outcome.type==='stage'){storyStageCard();if(activeStory?.stage>0)playMissionVoice(activeMission.id,'stage',activeStory.stage);}if(outcome.type==='victory'){sound.play('victory');const target=report;target.storyMessage=outcome.message;target.campaign=activeMission;target.campaignSaved=null;target.pending++;finishReport(target,state,me(),false);showCinematic(activeMission,'ending',()=>{if(lastReport===target&&state===target.snapshot&&target.accountId===account.getUserId()){renderResults(target);if(!$('runResults').open)$('runResults').showModal();}});Promise.resolve(account.saveCampaign(activeMission.id)).then(result=>{target.pending--;target.campaignSaved=!!result?.committed&&campaignProgress(result.profile)>=CAMPAIGN.indexOf(target.campaign)+1;target.campaignReason=result?.reason||null;if(result?.profile){target.profile=result.profile;target.storyConfirmed=campaignProgress(result.profile);const finishedAct=actOf(target.campaign);if(finishedAct&&campaignProgress(result.profile)===actEndIndex(finishedAct)+1&&RELICS[finishedAct.relic])notice(tr('RELIC EARNED: {name}',{name:tr(RELICS[finishedAct.relic].name)}));}if(lastReport===target&&$('runResults').open)renderResults(target);renderCampaign();}).catch(()=>{target.pending--;target.campaignSaved=false;if(lastReport===target&&$('runResults').open)renderResults(target);});}else if(outcome.type==='failure'){report.storyMessage=outcome.message;sound.play('defeat');}}}
      if(state.ended){accumulator=0;updateUI();break;}
    }
    if(stepped&&!state.ended){const activeMap=getMap(state.mapId);sound.observeCombat?.(state,{pads:activeMap.pads,mapWidth:activeMap.width});}
    uiElapsed+=dt;if(uiElapsed>=.12){uiElapsed=0;updateUI();}
  }
  // Every map tells its own ground story: the seed drives plate section,
  // flip, tint and scatter, so no two fields look alike (V2 field art).
  const groundSeedOf=id=>[...id].reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))|0,7)>>>0;
  function draw(){const map=getMap(state.mapId),{path,pads,theme}=map;const renderScale=prepareCanvas();ctx.clearRect(0,0,logicalWidth,logicalHeight);
    // V3 impact: a bunker hit shakes the camera - a short decaying wobble over
    // the whole battlefield frame. Never in reduced-motion mode, never a
    // simulation value: the seq only triggers it, the shake paints over the
    // already-cleared canvas like any other effect.
    const impactSeq=state?.bunkerImpact?.seq||0;
    if(impactSeq>lastImpactSeq){lastImpactSeq=impactSeq;shakeStart=performance.now();}
    const shakeAge=(performance.now()-shakeStart)/450;
    if(shakeAge>=0&&shakeAge<1&&!reducedMotion&&visualPrefs.screenShake){const amp=4.5*(1-shakeAge);ctx.translate(amp*Math.sin(shakeAge*47),amp*Math.cos(shakeAge*39));}const visual=coop&&coopReady&&lastSnapshotAt?projectCoopMotion(state,(performance.now()-lastSnapshotAt)/1000*(state.speed===2?2:1)):state;
    // The first-run coach is NOT part of this list, by design: its card is a hint
    // over a live battlefield, and adding it here is what made the first run
    // unplayable on a phone.
    const paused=!!coop&&!coopReady||!coop&&(visualPrefs.autoPause&&focusPause.isSoloPaused()||commandMenuOpen||missionBoardOpen||!!cinematic||!menu.hidden||tutorial.isOpen()||$('gameConfirm').open||$('settingsDialog')?.open||!account.isReady())||state.ended;const poses=soldierMotion.sample(visual.players,performance.now()/1000,{reducedMotion,paused});
    // Footprints and tread marks: sampled from the same interpolated state the
    // painter draws, in seconds, and paused together with the field.
    const tracks=groundTracks.sample(visual,performance.now()/1000,{paused,theme});
    function drawOwn(){drawCartoonBattle(ctx,visual,{path,pads,theme,types,me:me(),getTowerRange,effects:visualPrefs.combatTracers?combatFx.active():[],reducedMotion,weatherEffects:visualPrefs.weatherEffects,combatTracers:visualPrefs.combatTracers,soldierPoses:poses,groundTracks:tracks,storyMission:!coop?activeMission:null,storyStage:!coop&&!state.ended?activeMission?.stages[activeStory?.stage]:null,renderScale:renderScale*(battleViewport?.getViewport().scale||1),storyTime:performance.now()/1000,shotAge:coop&&lastSnapshotAt?Math.max(0,(performance.now()-lastSnapshotAt)/1000):0,artVersion,onSpritesReady,deco:map.deco,zones:map.zones,paths:map.paths,width:map.width,height:map.height,bunkerPosition:map.bunker,torches:map.torches,groundSeed:groundSeedOf(state.mapId)});

    if(activeStory&&!coop&&!state.ended){const objective=storyStatus(activeStory,state),point=objective.marker;if(point){ctx.save();ctx.beginPath();ctx.arc(point.x,point.y,36+(reducedMotion?0:2*Math.sin(performance.now()/400)),0,Math.PI*2);ctx.strokeStyle='#152118';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#b8d6c8';ctx.lineWidth=4;ctx.setLineDash([8,5]);ctx.lineDashOffset=reducedMotion?0:-performance.now()/120;ctx.stroke();ctx.setLineDash([]);
      // The label plate never leaves the canvas: field markers can sit near
      // a map edge (the balance-validated spot grid reaches there), so near
      // the top edge the plate flips below the ring and its x clamps inward.
      const plateBelow=point.y<67,plateX=Math.max(50,Math.min(logicalWidth-50,point.x)),plateY=plateBelow?point.y+56:point.y-61;
      ctx.fillStyle='#14221b';ctx.fillRect(plateX-48,plateY,96,20);ctx.fillStyle='#d8e9da';ctx.textAlign='center';ctx.font='bold 12px sans-serif';ctx.fillText(tr(point.type==='protect'?'PROTECT':'OBJECTIVE'),plateX,plateY+14);if(point.type==='protect'){ctx.fillStyle='#1c2b20';ctx.fillRect(point.x-25,point.y+43,50,7);ctx.fillStyle=activeStory.assetHealth<30?'#f28f73':'#b6dd8b';ctx.fillRect(point.x-24,point.y+44,48*Math.max(0,activeStory.assetHealth)/100,5);}ctx.restore();}}

    if(activeStory&&!coop&&!state.ended&&activeStory.mission.stages[activeStory.stage]?.type==='escort'){const hero=visual.players.local;if(hero){ctx.save();for(const offset of [-14,14]){ctx.beginPath();ctx.arc(hero.x+offset,hero.y+25,7,0,Math.PI*2);ctx.fillStyle='#bce6f1';ctx.fill();ctx.strokeStyle='#263c35';ctx.lineWidth=2;ctx.stroke();}ctx.restore();}}

    // Subtle corner brackets keep the selected pad visible over any terrain.
    const markerPad=menuPad??state.selectedPad;
    if(markerPad!==null&&!state.ended){const p=pads[markerPad];if(p){
      ctx.save();ctx.beginPath();for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ctx.moveTo(p.x+sx*32,p.y+sy*21);ctx.lineTo(p.x+sx*32,p.y+sy*28);ctx.lineTo(p.x+sx*24,p.y+sy*28);}
      ctx.lineJoin='round';ctx.strokeStyle='#172721';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#bad8ca';ctx.lineWidth=2;ctx.stroke();ctx.restore();
    }}
    }
    // Both 1v1 lanes must share the camera transform; otherwise the rival lane
    // is drawn at screen coordinates while taps/panning use world coordinates.
    const drawBattle=()=>{
      drawOwn();
      // The field shimmer: a tower whose next step is unlocked AND paid for
      // gets a ring, and nothing else on the field says "improve this one". A
      // ring on a tower the soldier cannot afford would promise an upgrade the
      // menu then refuses, so the wallet decides - every frame, never cached.
      // Reduced graphics keeps the ring and drops the breathing: the mark
      // stands still instead of pulsing.
      const now=performance.now();
      for(const cue of towerUpgradeCues(visual,{supplies:supplies(),level:state.players[me()]?.level,pads,skipPad:menuPad})){
        const breath=reducedMotion?0:Math.sin(now/420);
        // Built faint, then found too faint to notice on the field: the ring is
        // wider, thicker and brighter now, and it carries its own glow. The
        // warning from the day it was built still holds - a shimmer that is
        // brighter than the tower it rings is not an invitation but a smudge -
        // so the light is a blurred edge around a thin line, never a filled disc.
        ctx.save();ctx.beginPath();ctx.ellipse(cue.x,cue.y,40+breath*2,28+breath*1.5,0,0,Math.PI*2);
        ctx.strokeStyle='#f2d891';ctx.lineWidth=reducedMotion?3.5:3;ctx.shadowColor='#f2d891';
        ctx.shadowBlur=reducedMotion?14:10+4*breath;ctx.globalAlpha=reducedMotion?.82:.58+.2*breath;ctx.stroke();ctx.restore();
      }
      if(state.mode==='versus'&&state.rival){const width=map.width||960,height=map.height||540;ctx.save();ctx.fillStyle='#344b36';ctx.fillRect(0,height,width,20);ctx.fillStyle='#f1e7c4';ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr('{name} · OPPONENT BATTLEFIELD',{name:state.players[state.rivalId]?.name||tr('OPPONENT')}),width/2,height+15);ctx.translate(0,height+20);const rival=coopReady&&lastSnapshotAt?projectCoopMotion(state.rival,(performance.now()-lastSnapshotAt)/1000*(state.speed===2?2:1)):state.rival;const rivalTracks=rivalGroundTracks.sample(rival,performance.now()/1000,{paused:!coopReady||state.ended,theme});drawCartoonBattle(ctx,rival,{path,pads,theme,types,me:state.rivalId,getTowerRange,effects:[],reducedMotion,soldierPoses:rivalMotion.sample(rival.players,performance.now()/1000,{reducedMotion,paused:!coopReady||state.ended}),groundTracks:rivalTracks,renderScale,storyTime:performance.now()/1000,shotAge:coop&&lastSnapshotAt?Math.max(0,(performance.now()-lastSnapshotAt)/1000):0,deco:map.deco,zones:map.zones,paths:map.paths,width:map.width,height:map.height,bunkerPosition:map.bunker,torches:map.torches,groundSeed:groundSeedOf(state.mapId)});ctx.restore();}
    };
    if(battleViewport)drawInBattleViewport(ctx,battleViewport.getViewport(),drawBattle);else drawBattle();
  }
  $('coopControls').hidden=!coopUrl;
  function leaveCoop({preserveReport=false,hostClosed=false}={}){
    $('gameWorkspace').dataset.onlineReady='false';promptEpoch++;clearRequestFeedback();promptCenter?.reset('battle');sound.resetCombat?.();if(!coop){syncAudioScene();return Promise.resolve();}
    const old=coop,input=coopInput,finished=preserveReport&&report?.finished?report:null;
    if(finished&&hostClosed){finished.partyClosed=true;delete finished.partyWaitDetail;}
    coop=null;coopInput=null;coopReady=false;coopHasBaseline=false;currentPartyEnd=null;partyFinalizationEnabled=false;soloDeployed=false;needStop=false;orphanReleases.clear();
    // A broken input adapter must not prevent the transport itself from stopping.
    try{input?.setEnabled(false);}catch{}
    let stopping;try{stopping=old.stop();}catch(error){stopping=Promise.reject(error);}
    keys.clear();lastDirection='0,0';$('coopToggle').textContent=tr('JOIN CO-OP (TEST)');$('coopStatus').textContent=tr('SOLO');
    if(!releaseStopped&&account.isReady()){
      reset(true,{preserveResults:!!finished});
      if(finished){lastReport=finished;$('viewResults').hidden=false;if($('runResults').open)renderResults(finished);}
    }
    return Promise.resolve(stopping);
  }
  async function requestHostPartyEnd(id){
    const controlReady=coop?.canRequestHostEnd?.()===true;
    if(!coop||report?.id!==id||state.hostId!==me()||(!coopReady&&!controlReady)){notice('Could not end the match yet. Reconnect and try again.');return false;}
    if(state.ended&&currentPartyEnd)return true;
    // In a paused competitive game only the host's restricted end control is
    // available. Its transport still enforces one in-flight sequence and the
    // host processes it without advancing the battlefield.
    const session=coop,command={type:state.ended?'finishParty':'endRun'},result=await (coopReady?coopInput.execute(command):coop.command(command));
    if(coop!==session)return false;
    if(!result.ok){warn(result.reason);return false;}
    notice('Waiting for all reports and saved rewards before closing the party.');return true;
  }
  async function acknowledgePartyEnd(id,endTick){
    if(!coop||report?.id!==id||!coopReady||!state.ended||!report.finished||currentPartyEnd?.tick!==endTick)return {ok:false,reason:'Party finalization is not ready.'};
    return coopInput.execute({type:'acknowledgePartyEnd',endTick});
  }
  function markPartyRewardsConfirmed(id,endTick){
    if(!coop||report?.id!==id||!state.ended||!report.finished||currentPartyEnd?.tick!==endTick)return false;
    report.partyRewardsConfirmed=true;if(lastReport===report&&$('runResults').open)renderResults(report);return true;
  }
  function setPartyFinalizationState(id,endTick,detail){
    if(!coop||report?.id!==id||!state.ended||!report.finished||currentPartyEnd?.tick!==endTick)return false;
    report.partyWaitDetail=detail?{endTick,canForceClose:!!detail.canForceClose,missingEntries:detail.missingEntries||[]}:null;
    if(lastReport===report&&$('runResults').open)renderResults(report);return true;
  }
  function stopForRelease(){
    if(releaseStopped)return;
    releaseStopped=true;
    // Each step is best-effort: a broken dialog or adapter must not keep the
    // other resources running. The surrounding fence has already gone offline.
    const stop=fn=>{try{const result=fn();if(result&&typeof result.then==='function')void Promise.resolve(result).catch(()=>{});}catch{}};
    stop(()=>{if(frameHandle!==null&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(frameHandle);});
    frameHandle=null;keys.clear();
    stop(()=>{document.removeEventListener('pointerdown',onAudioGestureUnlock,true);document.removeEventListener('keydown',onAudioGestureUnlock,true);});
    stop(()=>stopPromptWatch?.());stop(()=>stopRadioWatch?.());stop(()=>focusPause?.dispose?.());stop(()=>closeCinematic(false));stop(()=>tutorial.stop());stop(()=>coach.stop());
    stop(()=>sound.dispose?.());stop(()=>sound.setEnabled(false));stop(()=>leaveCoop());
  }
  function confirmParty(){return !(state.wave>0||state.towers.length)||confirmAction({title:'Leave solo operation?',text:'Joining co-op will end the current solo run.',accept:'JOIN CO-OP'});}
  function beginCoop(factory,onUpdate=()=>{},reportId=null,mode=null,onFinalSnapshot=null){
    if(releaseStopped||coop||!account.isReady()||(onFinalSnapshot!==null&&typeof onFinalSnapshot!=='function'))return false;
    wasAbilityReady=false;abilityReadyNotified=false;
    $('gameWorkspace').dataset.onlineReady='false';$('onlineConnecting').textContent=tr('Connecting to the multiplayer battlefield…');hostFocusPaused=false;rosterGeneration=0;focusGeneration=0;
    // Both two-player modes get an existing larger, one-road sector-two map.
    // The host's snapshot carries its seed to the guest; recovery retains the
    // checkpoint's original map, including a previously started classic duel.
    soloDeployed=false;activeMission=null;activeStory=null;activeTraining=false;trainingDone=false;trainingBonusPaid=false;selectedMap=(mode==='coop'||mode==='versus')?nextMapId(selectedMap,globalThis.crypto,2):nextMapId(selectedMap);hasCoopSnapshot=false;currentPartyEnd=null;partyFinalizationEnabled=!!onFinalSnapshot;report=newReport(reportId||'test');report.accountId=account.getUserId();report.partyFinalizationRequired=partyFinalizationEnabled;coopReports.set(report.id,report);
    closeMenu();keys.clear();lastDirection='0,0';seenCoopWaves=0;seenCoopCaches=0;coopHasBaseline=false;combatFx.clear();sound.resetCombat?.();soldierMotion.reset();rivalMotion.reset();groundTracks.reset();rivalGroundTracks.reset();lastSnapshotAt=0;let client;
    try{
      client=factory({onState:value=>{if(coop!==client)return;$('coopStatus').textContent=value.toUpperCase();onUpdate(value);if(value==='error'||value==='duplicate')$('onlineConnecting').textContent=tr(value==='error'?'Multiplayer connection failed. Open Party to leave or retry.':'This party is already open in another tab. Close it and retry.');if(value==='error')notice('Multiplayer connection failed. If the host reloaded, use Resume as Host in a recovery trial; otherwise create a new party.');if(value==='duplicate')notice('This party is already open in another tab. Close it before joining here.');},onStatus:ready=>{if(coop!==client)return;coopReady=ready;coopInput.setEnabled(ready);if(!ready){promptEpoch++;clearRequestFeedback();closeMenu();state.selectedPad=null;if($('towerDetails').open)$('towerDetails').close();combatFx.clear();sound.resetCombat?.();bossSignal=null;coopHasBaseline=false;needStop=true;keys.clear();lastDirection='0,0';if(!state.ended)notice(state.mode==='versus'?'1 vs 1 paused. Waiting for both players to reconnect.':state.mode==='two-vs-two'?'2 vs 2 paused. Waiting for all players to reconnect.':'Co-op connection interrupted. Waiting to reconnect.');}else if(needStop){needStop=false;sound.play('reconnect');coopInput.direction({type:'direction',x:0,y:0});}if(ready)reconcileOrphanReservations();updateUI();},onSnapshot:snapshot=>{if(coop!==client)return;rosterGeneration=Number.isSafeInteger(snapshot?.rosterGeneration)?snapshot.rosterGeneration:0;focusGeneration=Number.isSafeInteger(snapshot?.focusGeneration)?snapshot.focusGeneration:0;if(snapshot?.match?.mode==='four-coop'||snapshot?.match?.mode==='two-vs-two'){try{snapshot=projectFourGameView(snapshot,me());}catch{notice('Invalid four-player match snapshot.');return;}}currentPartyEnd=snapshot?.partyEnd||null;const wasHostPaused=hostFocusPaused;hostFocusPaused=snapshot.hostPaused===true;if(hostFocusPaused&&!wasHostPaused)notice('Match paused: the host left the game window.');else if(wasHostPaused&&!hostFocusPaused)notice(coopReady?'Host returned. The match has resumed.':'Host returned. Waiting for players to reconnect.');hasCoopSnapshot=true;$('gameWorkspace').dataset.onlineReady='true';const wasEnded=state.ended,oldWave=state.wave,wasRunning=state.running,oldSpeedVote=state.speedRequest,oldPendingWave=state.pendingWave||0,oldWaveRequestId=state.waveRequestId||0,wasIceBroken=!!state.iceBroken,wasRubbleCleared=!!state.rubbleCleared,oldZonesBroken=state.zoneBroken||{},oldZonesCleared=state.zoneCleared||{},oldTowers=state.towers||[],oldPlayers=state.players||{},oldMapId=state.mapId,oldBoss=state.enemies.find(e=>e.boss&&e.hp>0),oldImpact=state.bunkerImpact?.seq||0,hadSnapshot=coopReady&&coopHasBaseline,selectedPad=state.selectedPad;if(coopReady){const snapMap=getMap(snapshot.match.mapId);for(const cue of combatFx.observe(snapshot.match,snapMap.pads)){if(cue==='ability'){let caster=null;for(const [pid,p] of Object.entries(snapshot.match.players||{})){if((p?.cooldown||0)>(oldPlayers[pid]?.cooldown||0)+1){caster=p;break;}}sound.play('ability',{classId:caster?.skills?.active||'assault',variant:caster?.skills?.variant||0,x:caster?.x,mapWidth:snapMap.width});}else if(cue==='build'||cue==='upgrade'||cue==='classUpgrade'){const nextT=(snapshot.match.towers||[]).find(t=>{const prevT=oldTowers.find(o=>o.id===t.id&&o.pad===t.pad);return cue==='build'?!prevT:cue==='classUpgrade'?(prevT&&(t.classTier||0)>(prevT.classTier||0)):(prevT&&t.level>prevT.level);});const padPt=nextT?snapMap.pads[nextT.pad]:null,prevT=nextT?oldTowers.find(o=>o.id===nextT.id&&o.pad===nextT.pad):null;const resolvedCue=cue==='upgrade'&&prevT?(prevT.level===2?'branch':nextT.level>prevT.level&&towerDisplay(nextT.level).level===1&&towerDisplay(nextT.level).prestige>0?'prestige':'upgrade'):cue;sound.play(resolvedCue,{towerType:nextT?.type??0,classId:nextT?.classPath,x:padPt?.x,mapWidth:snapMap.width});}else sound.play(cue,{x:cue==='impact'?(snapMap.bunker?.x??900):null,mapWidth:snapMap.width});}if(hadSnapshot&&oldMapId===snapshot.match.mapId){for(const prevT of oldTowers)if(!(snapshot.match.towers||[]).some(t=>t.id===prevT.id&&t.pad===prevT.pad))sound.play('sell',{x:snapMap.pads[prevT.pad]?.x,mapWidth:snapMap.width});for(const zId of Object.keys(snapshot.match.zoneBroken||{}))if(snapshot.match.zoneBroken[zId]&&!oldZonesBroken[zId])sound.play('ice');for(const zId of Object.keys(snapshot.match.zoneCleared||{}))if(snapshot.match.zoneCleared[zId]&&!oldZonesCleared[zId])sound.play('rubble');}if(!snapshot.match.ended)sound.observeCombat?.(snapshot.match,{pads:snapMap.pads,mapWidth:snapMap.width,baselineOnly:!hadSnapshot});}else{combatFx.clear();sound.resetCombat?.();}lastSnapshotAt=performance.now();state={...snapshot.match,selectedPad,speed:snapshot.speedControl?.speed===2?2:1,speedRequest:snapshot.speedControl?.request||null,speedRequestId:Number.isSafeInteger(snapshot.speedControl?.lastRequestId)?snapshot.speedControl.lastRequestId:null};if(coopReady)coopHasBaseline=true;if(hadSnapshot&&state.running&&state.wave!==oldWave)sound.play(state.wave%5===0?'boss':'wave');
      if(hadSnapshot&&(state.bunkerImpact?.seq||0)>oldImpact){const hit=state.bunkerImpact;warn(()=>tr('{enemy} hit the bunker! −{damage} health.',{enemy:tr(ENEMY_TYPES[hit.kind]?.label||'Enemy'),damage:Math.round(hit.damage*10)/10}));}
      const newBoss=state.enemies.find(e=>e.boss&&e.hp>0);
      if(hadSnapshot&&coopReady&&(newBoss?.boss==='bossBomber'||newBoss?.boss==='bossZugsmeister')&&newBoss.bossFlash>0&&oldBoss?.boss===newBoss.boss&&!(oldBoss.bossFlash>0)){sound.play('impact');warn(newBoss.boss==='bossZugsmeister'?'Rail guns struck the bunker!':'Bomber struck the bunker!');}
      else if(hadSnapshot&&coopReady&&newBoss&&newBoss.bossFlash>0&&oldBoss?.boss===newBoss.boss&&!(oldBoss.bossFlash>0)){sound.play('bossAbility',{boss:newBoss.boss,ability:newBoss.boss==='bossJuggernaut'?'repair':newBoss.boss==='bossKolt'?'flood':newBoss.boss==='bossRiegel'?'interceptors':'phase'});}
      if(hadSnapshot&&state.pendingWave&&(!oldPendingWave||oldWaveRequestId!==state.waveRequestId)){const vote=currentWaveRequest();if(vote?.requester!==me())sound.play('request');if(vote)notice(()=>tr('{name} requests wave {wave}.',{name:waveRequesterName(vote),wave:vote.wave}));}
      if(hadSnapshot&&oldPendingWave&&!state.pendingWave&&!state.running&&!state.ended)notice(state.wave===oldWave?'Wave request cancelled, declined or teammate disconnected.':'Wave request ended. Check the current status.');
      // A disappearing 2× strip is not itself an explanation to the requester.
      // A fast approval followed by 1× can also coalesce into a single snapshot,
      // so do not invent a decline or infer approval from a later generation.
      if(hadSnapshot&&oldSpeedVote?.requester===me()&&!state.speedRequest&&state.running&&!state.ended&&state.wave===oldSpeedVote.wave){
        notice(state.speedRequestId===oldSpeedVote.id&&state.speed===2?'2× approved by all players.':'2× request ended. Check the current speed.');
      }
      if(hadSnapshot&&!wasRubbleCleared&&state.rubbleCleared){sound.play('rubble');warn('Rubble cleared! Long-range shots are no longer weakened in that zone.');}
      if(hadSnapshot&&!wasIceBroken&&state.iceBroken){sound.play('ice');warn('Thin ice broke! Tanks slow down and take more damage.');}
      if(hadSnapshot&&wasRunning&&!state.running&&!state.ended){sound.play('clear');notice(state.pendingPerk?'Boss wave cleared! Choose a shared field upgrade.':'Wave cleared. Prepare for the next wave.');}
      if(hadSnapshot&&!wasEnded&&state.ended&&state.mode==='versus'){sound.play(state.winnerId===me()?'victory':'defeat');notice(state.winnerId?(state.winnerId===me()?'Victory! Your bunker survived.':'Defeat. Your opponent survived.'):'Both bunkers fell: draw.');}else if(hadSnapshot&&!wasEnded&&state.ended&&state.endReason!=='retired'){sound.play('defeat');notice('Bunker lost.');}
      if(state.ended&&!wasEnded&&state.endReason==='retired'){keys.clear();closeMenu();state.selectedPad=null;if($('towerDetails').open)$('towerDetails').close();notice(partyFinalizationEnabled?'Waiting for all reports and saved rewards before closing the party.':'Shared run ended. Completed-wave rewards are kept. Close the party to start a new run.');}const completed=state.players[me()]?.completedWaveMask||0,caches=state.players[me()]?.lootCaches||0;if(caches>seenCoopCaches){if(hadSnapshot)sound.play('loot');notice('Supply cache found! Supplies added to your balance.');}seenCoopCaches=caches;if(completed&~seenCoopWaves)notice('Wave completed! Saving co-op XP and loot…');seenCoopWaves|=completed;refreshRequestFeedback();refreshTowerMenu();reconcileOrphanReservations();updateUI();
      if(onFinalSnapshot&&currentPartyEnd){
        const player=state.players?.[me()];
        const members=state.fourInfo?.memberStates||state.memberStates||Object.fromEntries(Object.entries(state.players||{}).map(([id,pl])=>[id,{active:pl?.active!==false,departed:pl?.departed===true}]));
        try{onFinalSnapshot({partyEnd:currentPartyEnd,snapshotTick:snapshot.tick,ended:state.ended===true,reportReady:!!report?.finished&&report.snapshot===state&&report.playerId===me(),members,masks:{0:player?.completedWaveMask,...player?.completedWaveBlocks}});}catch{/* A failed coordinator must not break the report or battle UI. */}
      }
    },onEvents:events=>{if(coop!==client)return;for(const event of events){if(event.type==='bunkerHit')warn(()=>tr('{enemy} reached the bunker! −{damage} health.',{enemy:tr(ENEMY_TYPES[event.kind].label),damage:Math.round(event.damage*10)/10}));
        else if(event.type==='lootDrop')notice(()=>tr('Supply cache found! +{count} supplies.',{count:event.supplies}));else if(event.type==='iceBroken'){sound.play('ice');warn('Thin ice broke! Tanks slow down and take more damage.');}else if(event.type==='defeat'){sound.play('defeat');notice('Bunker lost.');}else if(event.type==='waveCleared'){if(!activeMission)account.recordScore?.('solo',event.wave);sound.play('clear');notice(event.wave%5===0?'Boss wave cleared! Choose a shared field upgrade.':'Wave cleared. Prepare for the next wave.');}}}});
      coop=client;coopInput=createCoopInput(client,message=>notice(message));coopReady=false;$('coopToggle').textContent=tr('LEAVE CO-OP');$('coopStatus').textContent=tr('CONNECTING');client.setFocusPaused?.(focusPause.isSoloPaused());client.start();
      // Joining replaces the solo battlefield. A parked lesson must not keep
      // listening to co-op actions or reappear as a task in another match.
      tutorial.stop();coach?.stop();if(coachRecall)coachRecall.hidden=true;updateUI();return true;
    }catch{if(coop===client)void leaveCoop();notice('Co-op could not be started.');return false;}
  }
  $('coopToggle').onclick=async()=>{if(coop){void leaveCoop();notice('Returned to solo.');return;}if(await confirmParty()&&account.isReady()&&!coop)beginCoop(callbacks=>clientFactory({url:coopUrl,getToken:()=>account.getToken(),...callbacks}));};
  account.onSessionChange(()=>{soloDeployed=false;activeTraining=false;trainingDone=false;trainingBonusPaid=false;closeCinematic(false);missionBoardOpen=false;lastReport=null;coopReports.clear();$('viewResults').hidden=true;if($('runResults').open)$('runResults').close();leaveCoop();if($('towerDetails').open)$('towerDetails').close();closeMenu();tutorial.stop();coach?.stop();if(coachRecall)coachRecall.hidden=true;keys.clear();if(account.isReady()){activeMission=null;$('campaignSelect').value='free';// The first-run tutorial is started by the account once a soldier exists.
  reset();if(!deferTutorial)tutorial.startIfNeeded(account.getUserId());}});
  // The first-run tutorial is started by the account once a soldier exists.
  reset();if(!deferTutorial&&featureEnabled('tutorial'))tutorial.startIfNeeded(account.getUserId());
  let last=performance.now();function frame(now){
    if(releaseStopped)return;frameHandle=null;
    const dt=Math.min((now-last)/1000,.05);last=now;update(dt);
    if(releaseStopped)return;draw();if(!releaseStopped)frameHandle=requestAnimationFrame(frame);
  }
  frameHandle=requestAnimationFrame(frame);
  function setMenuOpen(open){commandMenuOpen=!!open;keys.clear();sendDirection();accumulator=0;syncAudioScene();}
  function chooseStory(){const progress=campaignProgress(account.getProfile()),mission=CAMPAIGN[Math.min(progress,CAMPAIGN.length-1)];$('campaignSelect').value=mission.id;setMissionBoard(true);$('campaignContinue').focus?.();}
  // What a first login does now: the field first, the briefing *on* the field.
  // The 11-step modal tour used to run here, which meant a new soldier read about
  // a battlefield they had never seen - and on a phone it covered the very field
  // it was explaining.
  //
  // The old fallback was `trainingSeen ? tour : field`, and it was wrong twice.
  // An account that played the contract in the previous edition was sent to the
  // eleven-step modal - the exact thing this redesign removed - and never saw the
  // new first run at all. `TRAINING_KEY` is versioned for that reason: a new
  // contract edition is new content, so every account plays the field again. The
  // tour is now only what an account that skipped everything gets from the Help
  // button, which is where a replay belongs.
  function requestTrainingStart(action){
   // A queued tutorial handoff must never replace a live match or an open
   // lobby, including in guarded builds without a beforeNewGame hook.
   const eligible=()=>!releaseStopped&&!coop&&!!account.getUserId()&&account.isReady()&&(typeof account.canChooseSolo!=='function'||account.canChooseSolo());
   if(!eligible())return false;
   if(typeof account.beforeNewGame!=='function')return action();
   const oldState=state,id=account.getUserId(),session=account.getSessionVersion?.();
   return Promise.resolve(account.beforeNewGame()).then(ok=>ok&&state===oldState&&account.getUserId()===id&&account.getSessionVersion?.()===session&&eligible()?action():false).catch(()=>false);
  }
  function startFirstRun(){
   const id=account.getUserId(),session=account.getSessionVersion?.();
   if(!id)return false;
   if(!trainingSeen(id,tutorialStorage)){
    const started=requestTrainingStart(()=>startTrainingRun());
    if(started&&typeof started.then==='function')return started.then(ok=>{if(ok&&account.getUserId()===id&&account.getSessionVersion?.()===session)markTrainingSeen(id,tutorialStorage);return ok;});
    if(started)markTrainingSeen(id,tutorialStorage);
    return started;
   }
   tutorial.startIfNeeded(id);
   return false;
  }
  // The first deployment of a new soldier: a real, shortened, weakened run that
  // pays level 2 (see training-run.mjs). Offered once, from the tutorial handoff.
  // `trainingDone` is the win flag of the CURRENT run, not a "seen it" marker: it
  // used to block a second deployment after the debrief, which left a player who
  // chose "endless" from the results screen with a Deploy button that did nothing.
  // `restart` is the replay path: it is allowed to replace a run that is already the
  // training contract. Without it the second tap on "play the first run again" did
  // nothing, because `activeTraining` was still true from the first replay.
  function startTrainingRun({rewards=true,restart=false}={}){
   const waveFloor=Math.max(0,(Number(arguments[0]?.waveFloor)||0)|0);
   if(releaseStopped)return false;
   if(activeTraining&&!restart)return false;
   trainingRewards=rewards!==false;
   trainingWaveFloor=waveFloor;
   closeMenu();keys.clear();sendDirection();soloDeployed=true;activeMission=null;activeStory=null;activeTraining=true;trainingDone=false;trainingBonusPaid=false;selectedMap=TRAINING_MAP;reset();onResumeBattle();
   notice(()=>tr('Training contract: seven waves, boss in the last one. Enemies are weakened and your bunker is reinforced.'));
   // The welcome card waits for a field that is actually drawn: the card has no
   // meaning over an empty canvas, and the player must see the pads it points at.
   const id=account.getUserId(),session=account.getSessionVersion?.(),trainingState=state;
   if(id){
    markTrainingSeen(id,tutorialStorage);
    if(!coachSeen(id,tutorialStorage)||restart){
    // Two frames can elapse after a run is abandoned or the account changes.
    // Never start an old soldier's lesson over a replacement battlefield.
    const start=()=>{if(!releaseStopped&&!coop&&activeTraining&&state===trainingState&&!state.ended&&account.getUserId()===id&&account.getSessionVersion?.()===session){if(restart)coach?.replay(id);else coach?.start(id);}};
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>requestAnimationFrame(start));
    else start();
    }
   }
   return true;
  }
  async function chooseEndless(theme){endlessTheme=theme??null;const previous=activeMission?.id||'free';$('campaignSelect').value='free';renderCampaign();const loaded=await $('campaignLoad').onclick();if(!loaded){$('campaignSelect').value=previous;renderCampaign();}return loaded;}
  function releaseSafety(){
   if(coop)return 'party';
   if(trainingHandoffs||state.ended&&!report?.finished)return 'saving';
   for(const result of releaseReports){
    if(result.failed||result.statsFailed||result.disconnected||result.campaignSaved===false)return 'failed';
    if(result.pending||result.statsPending||(result.campaign&&result.campaignSaved!==true))return 'saving';
   }
   if(!state.ended&&(soloDeployed||state.running||state.wave>0||state.towers.length||activeMission||activeTraining))return 'game';
   return 'ready';
  }
  return {releaseSafety,refreshLanguage:()=>{if(state)updateUI();if(lastNotice)$('message').textContent=lastNotice();fieldNotice.refresh();tutorial.refreshLanguage?.();coach.refreshLanguage?.();generalRadio?.refreshLanguage?.();renderViewportLabels();if(!menu.hidden&&menuPad!==null&&towerKey(state.towers.find(t=>t.pad===menuPad))===menuTowerKey){showMenu(menuPad,menuMode,true);refreshDetails();}if(cinematic)renderCinematic();if(radioTime>0&&storyRadioSource)storyRadio(storyRadioSource,true,storyRadioCard);if(lastReport&&$('runResults').open)renderResults(lastReport);},recordCoopReward,requestHostPartyEnd,acknowledgePartyEnd,markPartyRewardsConfirmed,setPartyFinalizationState,hasResults,showResults,getMapId:()=>selectedMap,canEditSkills:()=>!coop&&((state.wave===0&&state.towers.length===0)||state.ended),resetSkills:reset,confirmParty,beginCoop,leaveCoop,stopForRelease,setMenuOpen,chooseStory,chooseEndless,// "Field tutorial" from the Command Center and "Replay coaching" from the field
   // menu both need the SAME thing: the seven cards on the live field. They used to
   // get the retired 11-step modal tour instead, so an account that dismissed the
   // coach had no way back to it at all - the cards are a "seen it" marker.
   showTutorial:()=>{closeMenu();keys.clear();sendDirection();
    if(state&&!state.ended){coach?.replay(account.getUserId());updateUI();return;}
    tutorial.replay(account.getUserId());},
  // First run: the account calls this once the Command Center is visible. That is
  // the first moment a tutorial can be shown at all, because the tutorial is keyed
  // by player id. A no-op for anyone who already finished or skipped it.
  startTutorialIfNeeded:()=>{closeMenu();keys.clear();sendDirection();tutorial.startIfNeeded(account.getUserId());},
  startFirstRun,
  // "Play the first run again" from Settings. This is the whole thing, not just the
  // cards: the training contract's seen marker is cleared so `startFirstRun` deploys
  // the shortened contract on the training map again, the coach's marker is cleared
  // so the seven cards start at the first one, and the run pays no second reward.
  //
  // Deliberately NOT cleared: the ending marker (equip, skills, workshop). Those
  // steps write to the real profile - replaying them would hand out a second free
  // point, so a replay teaches the field, not the economy.
  replayFirstRun:()=>{
   const id=account.getUserId();
   if(!id)return false;
   return requestTrainingStart(()=>{
    forgetTrainingSeen(id,tutorialStorage);
    coach.reset?.(id);
    closeMenu();keys.clear();sendDirection();
    return startTrainingRun({rewards:false,restart:true});
   });
  },
  // The Settings dialog owns the controls, the game owns the effects. These hooks
  // keep Audio, Graphics, Voice-Over, Effects, Auto-Pause, and Map View synced.
  setSoundEnabled:async value=>{desiredSoundEnabled=!!value;soundEnabled=await sound.setEnabled(desiredSoundEnabled);if(soundEnabled)syncAudioScene();generalRadio?.setPrefs?.({soundEnabled:desiredSoundEnabled});return soundEnabled;},
  isSoundEnabled:()=>soundEnabled,
  setVolume:value=>{const v=sound.setVolume(value);generalRadio?.setPrefs?.({volume:v});return v;},
  setSfxVolume:value=>sound.setSfxVolume?.(value),
  setMusicVolume:value=>sound.setMusicVolume?.(value),
  setMusicEnabled:value=>sound.setMusicEnabled?.(value),
  setView:view=>{currentAudioView=view||'menu';syncAudioScene();},
  playCue:(kind,detail)=>{ensureAudioGesture();sound.play(kind,detail);},
  setReducedGraphics:applyGraphics,
  isReducedGraphics:()=>reducedMotion,
  applySettings:prefs=>{
    if(!prefs)return;
    applyGraphics(prefs.graphics==='reduced');
    const prevZoom=visualPrefs.mapZoom;
    visualPrefs.voiceOver=prefs.voiceOver!==false;
    visualPrefs.screenShake=prefs.screenShake!==false;
    visualPrefs.weatherEffects=prefs.weatherEffects!==false;
    visualPrefs.combatTracers=prefs.combatTracers!==false;
    visualPrefs.autoPause=prefs.autoPause!==false;
    visualPrefs.mapZoom=prefs.mapZoom==='large'?'large':'fit';
    if(Number.isFinite(prefs.sfxVolume))sound.setSfxVolume?.(prefs.sfxVolume);
    if(Number.isFinite(prefs.musicVolume))sound.setMusicVolume?.(prefs.musicVolume);
    if(typeof prefs.musicEnabled==='boolean')sound.setMusicEnabled?.(prefs.musicEnabled);
    if(!visualPrefs.voiceOver)stopMissionVoice();
    generalRadio?.setPrefs?.({voiceOver:visualPrefs.voiceOver,soundEnabled:prefs.soundEnabled!==false,volume:prefs.volume});
    syncAudioScene();
    if(prevZoom!==visualPrefs.mapZoom&&!battleViewport&&!touchZoom)setMapZoom(visualPrefs.mapZoom==='large');
  },
   // The training contract is a real deployment, not a mock: seven weakened waves
   // that pay level 2. Called once by the account after the first-run tutorial.
   startTrainingRun:options=>requestTrainingStart(()=>startTrainingRun(options)),
  // The coach owns its own card; these let other modules (account.js) drive it.
  startCoach:id=>coach.start(id),stopCoach:()=>coach.stop(),isCoachOpen:()=>coach.isOpen(),replayCoach:()=>coach.replay(account.getUserId()),
  parkCoach(){try{coach?.dismiss?.();}catch{/* never block the menu */}
   generalRadio?.stop?.();
   for(const id of ['firstRunCoach','coachRecall']){const node=$(id);if(node)node.hidden=true;}
   for(const id of ['coachHighlight','coachRing','coachArrow']){const node=$(id);if(node)node.setAttribute('hidden','');}},
   isTrainingRun:()=>activeTraining,getTrainingXP:trainingXP,
   getSoloMode:()=>activeTraining?'training':activeMission?'campaign':'endless',getRunSummary:()=>!state.ended&&(soloDeployed||state.wave>0||state.towers.length||activeMission)?tr(activeTraining?'TRAINING CONTRACT':activeMission?.title||'ENDLESS'):null,isOnlineMatch:()=>!!coop};
}
