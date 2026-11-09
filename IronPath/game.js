import {createSoloDeployment} from './solo-deployment.mjs?v=20261217-stormgate';
import {newRunReceiptId} from './workshop-run-receipt.mjs?v=20261217-stormgate';
import {canvasResolution} from './canvas-resolution.mjs?v=20261105-sharp1';
import {createMapZoom} from './map-zoom.mjs?v=20261105-sharp1';
import {localizeGameMessage} from './game-localization.mjs?v=20261107-balance1';
import {translateStoryDetail} from './story-localization.mjs?v=20261110-storyde1';
import {translateText as tr} from './language.mjs?v=20261217-stormgate';
import {createSoldierMotion} from './soldier-motion.mjs?v=20261104-movement1';
import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
import {createFocusPause} from './focus-pause.mjs?v=20261104-hostpause1';
import {cinematicFrames,cinematicScene,relicHandover} from './story-cinematics.mjs?v=20261217-stormgate';
import {CAMPAIGN,campaignProgress,campaignMission,campaignAvailable,campaignDifficulty,campaignWaveContract,ACTS,actOf,actEndIndex} from './campaign.mjs?v=20261217-stormgate';
import {RELICS,earnedRelicIds} from './relics.mjs?v=20261217-stormgate';
import {createStoryMission,storyStatus,stepStory,resolveStoryDecision,drainStoryNotifications} from './story-mission.mjs?v=20261111-events1';
import {STAGE_CAPTIONS,EVENT_TEMPLATES} from './story-events.mjs?v=20261206-acttwo1';
import {TRAINING_MISSION_ID,TRAINING_MAP,TRAINING_WAVES,FIRST_RUN_DEFEAT_XP,trainingContract,trainingStatus,trainingWon,trainingXP,trainingBonusXP,trainingSeen,markTrainingSeen,forgetTrainingSeen} from './training-run.mjs?v=20261121-supplies1';
import {projectFourGameView} from './four-game-view.mjs?v=20261103-online1';
import {createBattleViewportController} from './battle-viewport-controller.mjs?v=20261105-sharp1';
import {drawInBattleViewport} from './battle-viewport.mjs?v=20261102-fourviewport2';
import {waveRewardSummary,nextSteps} from './run-results.mjs?v=20261217-stormgate';
import {projectCoopMotion} from './coop-motion.mjs?v=20261217-stormgate';
import {bossPhaseLabel,bossTelegraph} from './boss-mechanics.mjs?v=20261217-stormgate';
import {createBattleSound} from './battle-sound.mjs?v=20261118-settings1';
import {RUN_PERKS,perkOffers} from './run-perks.mjs?v=20261102-terrain4';
import {TERRAIN_BRIEFINGS,ZONE_BRIEFINGS,terrainFor} from './terrain.mjs?v=20261124-zones1';
import {getMap,createRandomMapId,sectorOf} from './maps.mjs?v=20261217-stormgate';
import {createCombatEffects} from './combat-fx.mjs?v=20261217-stormgate';
import {drawCartoonBattle} from './cartoon-art.mjs?v=20261217-stormgate';
import {abilityName} from './skills.mjs?v=20261107-balance1';
import { COOP_SERVER_URL } from './coop-config.mjs?v=20261031-coopui1';
import { createCoopClient } from './coop-client.mjs?v=20261031-coopui1';
import { createCoopInput } from './coop-input.mjs?v=20261031-coopui1';
import { createTutorial } from './tutorial.mjs?v=20261217-stormgate';
import { createCoach, coachSeen } from './first-run-coach.mjs?v=20261217-stormgate';
import { stepMatch, getTowerRange, STEP } from './simulation.mjs?v=20261217-stormgate';
import { createPlayer, applyCommand, towerRefund, getSupplies, TOWER_COSTS, trainingBuildLocked } from './match.mjs?v=20261217-stormgate';
import { ENEMY_TYPES, BOSSES,waveFormation,bossForWave,countFieldThreats } from './combat.mjs?v=20261217-stormgate';
import { MAX_TOWER_LEVEL, upgradeCost, towerDisplay, characterProgress, towerUpgradeInvestment } from './progression.mjs?v=20261105-prestige1';
export function startGame(account, {coopUrl=COOP_SERVER_URL, clientFactory=createCoopClient, confirmAction=async()=>false, leaveParty=null, nextMapId=createRandomMapId, experimentalFourViewport=false,experimentalWorkshop=false,deferTutorial=false,reducedGraphics=false,onReturnToCommand=()=>{},onResumeBattle=()=>{},onTrainingComplete=null}={}) {
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const logicalWidth=960;let logicalHeight=540;
  function setLogicalHeight(height){if(logicalHeight!==height){logicalHeight=height;canvas.height=Math.round(canvas.width*height/logicalWidth);}canvas.dataset.lanes=height===1100?'versus':'single';}
  function prepareCanvas(){const size=canvasResolution(logicalWidth,logicalHeight,canvas.getBoundingClientRect(),window.devicePixelRatio);if(canvas.width!==size.width)canvas.width=size.width;if(canvas.height!==size.height)canvas.height=size.height;ctx.setTransform(size.width/logicalWidth,0,0,size.height/logicalHeight,0,0);return size.width/logicalWidth;}
  // Reduced motion is either the operating system's wish or the player's own
  // Graphics setting - the setting only ever makes it MORE reduced, never less, so a
  // soldier who needs it for medical reasons is never overruled by a game default.
  const systemReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let graphicsReduced=!!reducedGraphics;
  let reducedMotion=systemReducedMotion||graphicsReduced;
  function applyGraphics(reduced){graphicsReduced=!!reduced;reducedMotion=systemReducedMotion||graphicsReduced;}
  const sound=createBattleSound(window.AudioContext||window.webkitAudioContext);let soundEnabled=false;
  // The sound button inside the field briefing is the same switch the Settings dialog
  // drives. Both read and write `soundEnabled`, so the two can never disagree.
  function paintSound(){$('soundToggle').textContent=tr(soundEnabled?'SOUND: ON':'SOUND: OFF');$('soundToggle').setAttribute('aria-pressed',String(soundEnabled));}
  $('soundToggle').onclick=async()=>{soundEnabled=await sound.setEnabled(!soundEnabled);paintSound();if(soundEnabled)sound.play('clear');};
  const combatFx=createCombatEffects({reducedMotion}),soldierMotion=createSoldierMotion(),rivalMotion=createSoldierMotion();let lastSnapshotAt=0;
  const types = [
    {name:'MG Nest',cost:TOWER_COSTS[0],range:125,damage:10,interval:.55,color:'#d9d884',description:'Fast fire · strong vs infantry and scouts; weak vs armor and aircraft'},
    {name:'Cannon',cost:TOWER_COSTS[1],range:145,damage:34,interval:1.4,color:'#e49b67',description:'Heavy damage · strong vs tanks; weak vs aircraft'},
    {name:'Flak',cost:TOWER_COSTS[2],range:155,damage:17,interval:.8,color:'#8cc0a6',description:'Long range · strong vs aircraft; weaker vs tanks'},
    {name:'Sniper',cost:TOWER_COSTS[3],range:210,damage:45,interval:1.8,color:'#a9a4d4',description:'Extreme range · strong vs infantry; anti-armor upgrade available'}
  ];
  const branches = [
    [{name:'Twin MG',damage:1,interval:.55,range:1,description:'45% shorter firing interval'}, {name:'Heavy MG',damage:2.1,interval:1,range:1,description:'110% more damage per shot'}],
    [{name:'Rapid Cannon',damage:1,interval:.6,range:1,description:'40% shorter firing interval'}, {name:'Siege Cannon',damage:2.1,interval:1,range:1,description:'110% more damage per shot'}],
    [{name:'Twin Flak',damage:1,interval:.55,range:1,description:'45% shorter firing interval'}, {name:'Long-range Flak',damage:1.3,interval:1,range:1.45,description:'45% more range and 30% more damage'}],
    [{name:'Marksman',damage:1,interval:.6,range:1,description:'40% shorter firing interval'}, {name:'Anti-armor Rifle',damage:2,interval:1,range:1.1,description:'100% more damage, 10% more range and another 40% damage against tanks'}]
  ];
  for(const variants of branches){variants.push({name:'Veteran Kit',damage:1.4,interval:.85,range:1.15,description:'Upgrader must be level 5 · 40% more damage, 15% faster fire and 15% more range'});variants.push({name:'Boss Hunter',damage:1,interval:1.25,range:1,description:'Upgrader must be level 10 · fires 20% slower but deals 50% more damage to bosses.'});}
  const keys = new Set();
  let state, selectedMap=nextMapId(), activeMission=null, activeStory=null, activeTraining=false, trainingDone=false, trainingBonusPaid=false, trainingRewards=true, accumulator=0, menuPad=null, coop=null, coopInput=null, coopReady=false, lastDirection='0,0', needStop=false,seenCoopWaves=0,seenCoopCaches=0,coopHasBaseline=false,bossSignal=null,hostFocusPaused=false;
  let cinematic=null,radioTime=0,commandMenuOpen=false,missionBoardOpen=false;
  function closeCinematic(continueScene=true){if(!cinematic)return;const callback=cinematic.done;cinematic=null;if($('storyCinematic').open)$('storyCinematic').close();keys.clear();accumulator=0;if(continueScene&&callback)callback();}
  function showCinematic(mission,kind,done=null,finishLabel=null){
    // An act finale ends with the bearer's relict handover: four extra frames
    // over the act's key art. cinematicFrames stays pure; the handover is a
    // presentation tail, so replays and translations address a stable coda.
    const frames=cinematicFrames(mission,kind).concat(kind==='ending'?relicHandover(mission):[]);if(!frames.length){if(done)done();return;}closeCinematic(false);keys.clear();sendDirection();accumulator=0;cinematic={mission,kind,frames,index:0,done,finishLabel};const scene=cinematicScene(mission,kind);$('storyCinematic').dataset.location=scene?.art||'valley';$('storyCinematic').dataset.weather=scene?.weather||'mist';$('cinematicLocation').textContent=tr(scene?.place||'');$('storyCinematic').dataset.act=mission.act.includes('ACT III')?'3':mission.act.includes('ACT II')?'2':'1';renderCinematic();$('storyCinematic').showModal();
  }
  function renderCinematic(){const {mission,kind,frames,index,finishLabel}=cinematic,frame=frames[index],scene=cinematicScene(mission,kind),art=frame.art||scene?.art||'valley',place=frame.place||scene?.place||'';$('cinematicProgress').max=frames.length;$('cinematicProgress').value=index+1;$('storyCinematic').dataset.location=art;$('cinematicAct').textContent=`${tr(mission.act)} / ${tr(kind==='intro'?'BRIEFING':'DEBRIEF')} · ${tr(place)}`;$('cinematicCount').textContent=`${index+1} / ${frames.length}`;$('cinematicLocation').textContent=tr(place);$('cinematicTitle').textContent=tr(mission.title);$('cinematicSpeaker').textContent=frame.speaker==='NARRATOR'?tr('FIELD REPORT'):frame.speaker;$('cinematicText').textContent=tr(frame.text);$('cinematicInitial').textContent=frame.speaker==='NARRATOR'?'◆':frame.speaker[0];$('storyCinematic').dataset.speaker=frame.speaker.toLowerCase();$('cinematicPrevious').disabled=index===0;$('cinematicNext').textContent=index===frames.length-1?tr(finishLabel|| (kind==='intro'?'DEPLOY':'VIEW RESULTS')):tr('NEXT →');}
  $('cinematicPrevious').onclick=()=>{if(cinematic&&cinematic.index>0){cinematic.index--;renderCinematic();}};
  $('cinematicNext').onclick=()=>{if(!cinematic)return;if(cinematic.index+1<cinematic.frames.length){cinematic.index++;renderCinematic();}else closeCinematic();};
  $('cinematicSkip').onclick=()=>closeCinematic();$('storyCinematic').addEventListener('cancel',e=>{e.preventDefault();closeCinematic();});bindDialogBackdrop($('storyCinematic'),()=>closeCinematic());
  const me=()=>coop?account.getUserId():'local';
  let report=null,lastReport=null,hasCoopSnapshot=false;const coopReports=new Map();
  function newReport(id=null){return {id,receiptId:null,mode:id?'coop':'solo',xp:0,scrap:0,items:[],levels:0,unlocks:[],pending:0,failed:false,confirmedEarlier:false,finished:false,snapshot:null,playerId:null};}
  // Every endless solo run gets one random receipt id; campaign sends null and keeps legacy saving.
  // Receipts are only sent when the gated workshop alpha is enabled, so the live
  // game never writes workshop fields before the candidate rules are approved.
  const runReceipt=()=>report&&!report.soloMission?report.receiptId:null;
  function addReward(target,detail){if(!target||!detail?.delta)return;const d=detail.delta;target.xp+=d.xp;target.scrap+=d.scrap;target.levels+=d.levels;target.items.push(...d.items);target.unlocks.push(...(d.unlocks||[]));if(!target.profile||(detail.profile?.xp||0)>=(target.profile.xp||0))target.profile=detail.profile;}
  function recordCoopReward(id,status,detail,block=0){const target=coopReports.get(id);if(!target)return;const errors=target.errors||(target.errors=new Set());if(status==='saved'){addReward(target,detail);errors.delete(block);}else if(status==='error')errors.add(block);else if(status==='confirmed'){target.confirmedEarlier=true;errors.delete(block);}target.failed=errors.size>0;if(lastReport===target&&$('runResults').open)renderResults(target);}
  const storyProfile=target=>({...account.getProfile(),storyProgress:Math.max(campaignProgress(account.getProfile()),campaignProgress(target?.profile),target?.storyConfirmed||0)});
  function canReturnFromResults(target){return !!target&&(!target.campaign||target.campaignSaved===true)&&((target===report&&state.ended)||(target.left&&!coop&&!state.running&&state.wave===0&&state.towers.length===0));}
  function campaignSaveProblem(reason){
  if(reason==='rejected')return 'The database rejected the mission save. The Iron Path database rules may need to be deployed.';
  if(reason==='timeout')return 'Saving mission progress timed out. Check your connection and retry.';
  if(reason==='locked')return 'Your saved story progress is behind this mission. Reload the page to sync, then replay it.';
  return 'Mission progress could not be confirmed. Retry saving before leaving.';
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
    $('runResults').dataset.save=target.failed?'failed':target.pending?'pending':target.disconnected||target.mode==='coop'&&!target.confirmedEarlier?'uncertain':'confirmed';
    $('resultsDone').textContent=tr(canReturnFromResults(target)?'RETURN TO COMMAND CENTER':'CONTINUE');

    $('storyReplayEnding').hidden=!target.campaign||snapshot.endReason!=='campaign-victory';$('resultsStory').hidden=!target.storyMessage;if(target.storyMessage)$('resultsStory').textContent=translateStoryDetail(target.storyMessage,tr);
    $('resultsCampaign').hidden=!target.campaign;$('campaignRetry').hidden=!target.campaign||target.campaignSaved!==false;
    if(target.campaign)$('resultsCampaign').textContent=tr(target.campaignSaved===true?'Mission progress saved.':target.campaignSaved===false?campaignSaveProblem(target.campaignReason):'Saving mission progress…');
    $('resultsSave').textContent=tr(target.failed?'Some rewards could not be confirmed. Check your connection and save status.':target.pending?'Saving rewards…':target.disconnected?'This uses the last received snapshot. Reconnect to confirm any missing rewards.':target.confirmedEarlier?'Some earlier rewards were already saved before this report; they are not counted twice.':target.mode==='coop'?'Rewards may still be saving or may have been saved before reconnecting.':'Only confirmed saves are counted above.');
    $('resultsDamage').textContent=damage.some(n=>n>0)?damage.map((n,i)=>`${tr(types[i].name)}: ${Math.round(n||0)}`).join(' · '):tr('No tower damage recorded.');
    $('resultsCombos').textContent=combos.length?tr('Skill activity: {items}',{items:combos.map(([name,n])=>`${tr(name)} ×${n}`).join(' · ')}):tr('No skill combos or capstones activated.');
    $('resultsUnlocks').textContent=(target.levels?tr(target.levels===1?'{count} level gained · {count} new skill point.':'{count} levels gained · {count} new skill points.',{count:target.levels}):tr('No new level confirmed during this session.'))+(target.unlocks.length?'\n'+tr('New upgrades: {items}',{items:target.unlocks.map(x=>tr(x)).join(' · ')}):'');
    $('resultsNext').textContent=nextSteps(target.profile||account.getProfile(),tr);
    const mission=target.soloMission,index=CAMPAIGN.indexOf(mission),next=CAMPAIGN[index+1],eligible=!!mission&&target.mode==='solo'&&!coop&&state===snapshot&&state.ended&&target.accountId===account.getUserId()&&(typeof account.canChooseSolo!=='function'||account.canChooseSolo());
    const safe=eligible&&!target.pending&&(!target.campaign||target.campaignSaved===true);
    $('resultsReplayMission').hidden=!eligible;$('resultsReplayMission').disabled=!safe;
    $('resultsNextMission').hidden=!eligible||!next||!target.campaign;$('resultsNextMission').disabled=!safe||!next||!campaignAvailable(storyProfile(target),next.id);
    if(next)$('resultsNextMission').textContent=tr('NEXT: {title}',{title:tr(next.title).toUpperCase()});

  }
  function finishReport(target,snapshot,id,open=true){if(!target||!snapshot)return;target.finished=true;closeMenu();keys.clear();if($('towerDetails').open)$('towerDetails').close();target.snapshot=snapshot;target.playerId=id;lastReport=target;$('viewResults').hidden=false;renderResults(target);if(open&&!$('runResults').open)$('runResults').showModal();}
  $('campaignRetry').onclick=async()=>{const target=lastReport;if(!target?.campaign||target.campaignSaved!==false||target.accountId!==account.getUserId()||typeof account.saveCampaign!=='function')return;target.campaignSaved=null;target.campaignReason=null;renderResults(target);const result=await account.saveCampaign(target.campaign.id);target.campaignSaved=!!result?.committed&&campaignProgress(result.profile)>=CAMPAIGN.indexOf(target.campaign)+1;target.campaignReason=result?.reason||null;if(result?.profile){target.profile=result.profile;target.storyConfirmed=campaignProgress(result.profile);const finishedAct=actOf(target.campaign);if(finishedAct&&campaignProgress(result.profile)===actEndIndex(finishedAct)+1&&RELICS[finishedAct.relic])notice(tr('RELIC EARNED: {name}',{name:tr(RELICS[finishedAct.relic].name)}));}if(lastReport===target&&$('runResults').open)renderResults(target);renderCampaign();};
  function loadResultMission(next=false){
    const target=lastReport,mission=target?.soloMission,index=CAMPAIGN.indexOf(mission),destination=next?CAMPAIGN[index+1]:mission;
    if(!target||!mission||!destination||target.mode!=='solo'||coop||state!==target.snapshot||!state.ended||target.accountId!==account.getUserId()||target.pending||(target.campaign&&target.campaignSaved!==true)||(next&&!target.campaign)||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo())||!campaignAvailable(storyProfile(target),destination.id))return;
    activeMission=destination;selectedMap=destination.mapId;$('campaignSelect').value=destination.id;reset();onResumeBattle();notice(destination.stages[0].dialogue);showCinematic(destination,'intro');
  }
  $('storyReplayEnding').onclick=()=>{const target=lastReport;if(!target?.campaign||target.snapshot?.endReason!=='campaign-victory')return;$('runResults').close();showCinematic(target.campaign,'ending',()=>{if(lastReport===target&&target.accountId===account.getUserId()){renderResults(target);$('runResults').showModal();}});};
  $('resultsReplayMission').onclick=()=>loadResultMission();$('resultsNextMission').onclick=()=>loadResultMission(true);
  $('storyChoice0').onclick=()=>pickDecision(0);$('storyChoice1').onclick=()=>pickDecision(1);
  $('resultsClose').onclick=()=>$('runResults').close();$('resultsDone').onclick=()=>{const go=canReturnFromResults(lastReport);$('runResults').close();if(go)onReturnToCommand();};bindDialogBackdrop($('runResults'),()=>$('runResults').close());$('viewResults').onclick=()=>{if(lastReport){renderResults(lastReport);$('runResults').showModal();}};

  const supplies=()=>getSupplies(state,me());
  // A large, horizontally scrollable map is the default in portrait on phones.
  const mapViewport=$('mapViewport'), zoomButton=$('mapZoom');
  const portrait=window.matchMedia('(max-width: 850px) and (orientation: portrait)');
  let largeMap=false, battleViewport=null, savedLargeMap=false, touchZoom=null;
  // V3 impact tracking: the bunker-hit camera shake is presentation only -
  // the seq comes from the authoritative state, the wobble is local.
  let lastImpactSeq=0, shakeStart=-1e9;
  function renderViewportLabels(){if(touchZoom&&!battleViewport){const zoomed=touchZoom.getFactor()>1.01;zoomButton.textContent=tr(zoomed?'MAP: FIT':'MAP: ZOOM');$('mapQuickZoom').textContent=tr(zoomed?'FIT MAP':'ZOOM MAP');$('mapHint').textContent=tr('Drag to pan, pinch or use the mouse wheel to zoom. Tap to build or move.');return;}if(battleViewport){const v=battleViewport.getViewport(),fit=Math.min(v.width/v.worldWidth,v.height/v.worldHeight);zoomButton.textContent=tr(v.scale>fit+1e-8?'MAP: FIT':'MAP: ZOOM');$('mapHint').textContent=tr('Drag to pan, pinch or use the mouse wheel to zoom. Tap to build or move.');}else{zoomButton.textContent=tr(largeMap?'MAP: LARGE':'MAP: FIT');$('mapHint').textContent=tr(largeMap?'Swipe the map left or right to see the battlefield. Tap to build or move.':'Full map view. Tap MAP: FIT to enlarge it.');}}
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
  if(touchZoom&&typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(!battleViewport)touchZoom.resize(touchZoom.getFactor());}).observe(mapViewport);
  // The pointer is anchored to a world position, not to a pixel: whenever the field
  // moves under it, re-mark. Cheap, and the ring must never point at where the pad
  // used to be.
  const remarkCoach=()=>{try{coach.remark();}catch{}};
  zoomButton.addEventListener('click',()=>{remarkCoach();if(touchZoom&&!battleViewport){touchZoom.toggle();return;}if(battleViewport){const v=battleViewport.getViewport(),fit=Math.min(v.width/v.worldWidth,v.height/v.worldHeight);if(v.scale>fit+1e-8)battleViewport.reset();else battleViewport.zoom(2);return;}const middle=(mapViewport.scrollLeft+mapViewport.clientWidth/2)/mapViewport.scrollWidth;setMapZoom(!largeMap);mapViewport.scrollLeft=middle*mapViewport.scrollWidth-mapViewport.clientWidth/2;});
  // Reported: "Bunker und Straßen Endpunkte passen nicht" - the quick-jump
  // buttons pinned to the left and right rim. Start and bunker sit wherever
  // the generated map puts them, so both buttons now aim at the real world
  // coordinates: the road's entry point and the bunker it ends in.
  const aimViewport=target=>{
    if(battleViewport){const v=battleViewport.getViewport(),visW=v.width/v.scale,visH=v.height/v.scale;
      battleViewport.pan((v.x+visW/2-target.x)*v.scale,(v.y+visH/2-target.y)*v.scale);return;}
    const m=getMap(state.mapId),fx=Math.max(0,Math.min(1,target.x/m.width)),fy=Math.max(0,Math.min(1,target.y/m.height));
    mapViewport.scrollTo({left:fx*(mapViewport.scrollWidth-mapViewport.clientWidth),top:fy*(mapViewport.scrollHeight-mapViewport.clientHeight),behavior:'smooth'});
  };
  $('mapEntry').addEventListener('click',()=>{aimViewport(getMap(state.mapId).path[0]);remarkCoach();});
  $('mapBunker').addEventListener('click',()=>{aimViewport(getMap(state.mapId).bunker);remarkCoach();});
  portrait.addEventListener('change',()=>{if(touchZoom&&!battleViewport)touchZoom.resize(touchZoom.getFactor());remarkCoach();});
  window.addEventListener('resize',remarkCoach);
  // Two more ways the field moves under the card: the page itself is scrolled (the
  // phone browser toolbar collapsing, a bounce at the end of a swipe), and the map
  // viewport is scrolled sideways. `resize` does not fire for either, so the ring
  // stayed on the old pad while the card stayed put - the two drifted apart.
  window.addEventListener('scroll',remarkCoach,{passive:true});
  mapViewport.addEventListener('scroll',remarkCoach,{passive:true});
  function syncBattleViewport(map,versus){
    // Oversized fields (the endless retreat sectors) get the pan-and-zoom
    // viewport the four-player frontier uses; phone maps stay as they are.
    const oversized=(map.width||960)>960||(map.height||540)>540;
    const wanted=!versus&&((oversized&&!map.fourPlayer)||(experimentalFourViewport&&map.fourPlayer));
    if(wanted&&!battleViewport){if(touchZoom)touchZoom.reset();savedLargeMap=largeMap;setMapZoom(false);mapViewport.scrollLeft=0;battleViewport=createBattleViewportController({canvas,worldWidth:map.width,worldHeight:map.height,screenWidth:logicalWidth,screenHeight:logicalHeight,onTap:point=>selectBattlePoint(point.x,point.y),onChange:v=>{closeMenu();if(state)state.selectedPad=null;const fit=Math.min(v.width/v.worldWidth,v.height/v.worldHeight),zoomed=v.scale>fit+1e-8;zoomButton.setAttribute('aria-pressed',String(zoomed));zoomButton.textContent=tr(zoomed?'MAP: FIT':'MAP: ZOOM');$('mapQuickZoom').textContent=tr(zoomed?'FIT MAP':'ZOOM MAP');}});$('mapHint').textContent=tr('Drag to pan, pinch or use the mouse wheel to zoom. Tap to build or move.');zoomButton.textContent=tr('MAP: ZOOM');$('mapQuickZoom').textContent=tr('ZOOM MAP');}
    else if(!wanted&&battleViewport){battleViewport.destroy();battleViewport=null;setMapZoom(savedLargeMap);}
  }
  $('campaignSelect').value='free';
  function renderCampaign(){
    const profile=account.getProfile(),progress=campaignProgress(profile),selection=$('campaignSelect').value,mission=campaignMission(selection);
    const blocked=!!coop||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo());
    CAMPAIGN.forEach((m,i)=>{const locked=i>progress,complete=i<progress,card=$(`missionCard${i}`);$(`campaignOption${i}`).disabled=locked;$(`campaignOption${i}`).textContent=`${String(i+1).padStart(2,'0')} · ${locked?tr('CLASSIFIED'):tr(m.title)}`;card.disabled=blocked||locked;card.dataset.status=locked?'locked':complete?'complete':'available';card.setAttribute('aria-pressed',String(selection===m.id));$(`missionTitle${i}`).textContent=locked?tr('CLASSIFIED'):tr(m.title);$(`missionStatus${i}`).textContent=tr(locked?'LOCKED':complete?'COMPLETED':'NEXT MISSION');const stamp=$(`missionStamp${i}`);if(stamp){stamp.textContent=tr('COMPLETED');stamp.hidden=!complete;}
     // The contract is visible before you commit: act, threat and wave count.
     const contract=$(`missionContract${i}`);
     if(contract){const difficulty=campaignDifficulty(m);contract.textContent=locked?'':tr('{threat} · {waves} waves',{threat:tr(difficulty.label.toUpperCase()),waves:campaignWaveContract(m)});contract.dataset.threat=locked?'':m.threat;contract.hidden=locked;}
    });
    $('campaignBoard').hidden=!mission||!missionBoardOpen;$('campaignShowBoard').hidden=!mission||missionBoardOpen;$('campaignShowBoard').disabled=blocked;$('campaignCloseBoard').hidden=!activeMission;$('campaignPanel').dataset.boardOpen=String(missionBoardOpen);$('campaignOverall').textContent=progress===CAMPAIGN.length?tr('The valley is safe. Revisit any completed mission.'):progress?tr('Your next mission awaits. {done} of {total} missions completed.',{done:progress,total:CAMPAIGN.length}):tr('A lost signal is only the beginning.');$('campaignProgressText').textContent=tr('{done} / {total} COMPLETED',{done:progress,total:CAMPAIGN.length});$('campaignProgressBar').max=CAMPAIGN.length;$('campaignProgressBar').value=progress;$('campaignContinue').disabled=blocked;$('campaignContinue').textContent=tr(progress===CAMPAIGN.length?'REPLAY FINAL MISSION →':progress?'CONTINUE STORY →':'BEGIN STORY →');$('campaignSelectedAct').textContent=tr(mission?.act||'');$('campaignSelectedTitle').textContent=tr(mission?.title||'Select a mission');$('campaignQuickLoad').disabled=blocked||!!mission&&!campaignAvailable(profile,mission.id);$('campaignQuickStatus').textContent=tr(blocked?'Leave your party before changing solo operations.':mission?'Select a mission on the board or load this selection.':'Free play: random map and endless waves.');
    const strip=$('relicStrip');
    if(strip){
      strip.innerHTML=ACTS.map(act=>{
        const relic=RELICS[act.relic],earned=earnedRelicIds(profile).includes(act.relic),end=actEndIndex(act);
        const state=earned?'earned':end>=0?'locked':'upcoming';
        const name=earned?tr(relic.name):tr(act.title);
        const detail=earned?tr(relic.effect):end>=0?tr('Complete {act} to earn this relic.',{act:tr(act.title)}):tr('This act lies ahead.');
        return `<div class="relic-slot" data-state="${state}" role="listitem"><strong>${name}</strong><span>${detail}</span></div>`;
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
  function buildMissionBoard(){
    const acts=$('missionActs'),select=$('campaignSelect');
    let html='';
    for(const title of [...new Set(CAMPAIGN.map(m=>m.act))]){
      const cards=CAMPAIGN.map((mission,i)=>({mission,i})).filter(({mission})=>mission.act===title).map(({mission,i})=>{
        const numberText=`MISSION ${String(i+1).padStart(2,'0')}`;
        return `<button type="button" id="missionCard${i}" class="mission-card" data-mission="${mission.id}" aria-pressed="false"><span class="mission-number" data-i18n-text="${numberText}">${tr(numberText)}</span><strong id="missionTitle${i}">CLASSIFIED</strong><span id="missionStatus${i}" class="mission-status">${tr('LOCKED')}</span><span id="missionContract${i}" class="mission-contract" hidden></span><b id="missionStamp${i}" class="mission-stamp" aria-hidden="true" hidden></b></button>`;
      }).join('');
      html+=`<section class="mission-act" aria-label="${title}"><h4 data-i18n-text="${title}">${tr(title)}</h4><div class="mission-grid">${cards}</div></section>`;
    }
    acts.innerHTML=html;
    // The quick select keeps free play first; option labels come from the
    // renderer. Rebuilding replaces the whole list, ids stay stable.
    select.innerHTML=`<option value="free" data-i18n-text="Free play · random battlefield">${tr('Free play · random battlefield')}</option>`+CAMPAIGN.map((mission,i)=>`<option id="campaignOption${i}" value="${mission.id}"></option>`).join('');
  }
  function setMissionBoard(open){missionBoardOpen=!!open;keys.clear();sendDirection();accumulator=0;renderCampaign();}
  buildMissionBoard();
  $('campaignSelect').onchange=()=>setMissionBoard(!!campaignMission($('campaignSelect').value));
  $('campaignShowBoard').onclick=()=>setMissionBoard(true);$('campaignCloseBoard').onclick=()=>setMissionBoard(false);
  CAMPAIGN.forEach((mission,i)=>{$(`missionCard${i}`).onclick=()=>{if(!coop&&campaignAvailable(account.getProfile(),mission.id)&&(typeof account.canChooseSolo!=='function'||account.canChooseSolo())){$('campaignSelect').value=mission.id;renderCampaign();}};});
  $('campaignContinue').onclick=async()=>{if(coop||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo()))return;const progress=campaignProgress(account.getProfile()),mission=CAMPAIGN[Math.min(progress,CAMPAIGN.length-1)];$('campaignSelect').value=mission.id;renderCampaign();await $('campaignLoad').onclick();};
  $('campaignQuickLoad').onclick=()=>$('campaignLoad').onclick();
  $('storyReplayDebrief').onclick=()=>{const mission=campaignMission($('campaignSelect').value);if(!coop&&mission&&CAMPAIGN.indexOf(mission)<campaignProgress(account.getProfile())&&(typeof account.canChooseSolo!=='function'||account.canChooseSolo()))showCinematic(mission,'ending',null,'CLOSE');};
  $('storyReplayIntro').onclick=()=>{const mission=campaignMission($('campaignSelect').value);if(!coop&&mission&&campaignAvailable(account.getProfile(),mission.id)&&(typeof account.canChooseSolo!=='function'||account.canChooseSolo()))showCinematic(mission,'intro',null,'CLOSE');};
  $('campaignLoad').onclick=async()=>{
    if(coop||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo()))return false;
    // Choosing any other operation ends the training contract for this session.
    activeTraining=false;
    if(state.ended&&report?.campaign&&report.campaignSaved!==true){notice('Confirm or retry your story save before changing operations.');return false;}
    const id=$('campaignSelect').value,mission=id==='free'?null:campaignMission(id),currentState=state,currentUser=account.getUserId();if(id!=='free'&&(!mission||!campaignAvailable(account.getProfile(),id)))return false;
    if(!state.ended&&(state.wave>0||state.towers.length)&&!await confirmAction({title:'Change operation?',text:'This ends your current solo run. Completed-wave rewards remain saved.',accept:'CHANGE OPERATION'}))return false;
    if(coop||state!==currentState||account.getUserId()!==currentUser||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo())||(mission&&!campaignAvailable(account.getProfile(),id)))return false;
    activeMission=mission;selectedMap=mission?mission.mapId:nextMapId(selectedMap);missionBoardOpen=false;reset();notice(()=>tr(mission?mission.stages[0].dialogue:'Free play ready.'));if(mission)showCinematic(mission,'intro');return true;
  };
  function reset(freshMap=false){closeCinematic(false);radioTime=0;$('storyRadio').hidden=true;hideDecisionPanel();$('soloBonus').hidden=true;if($('runResults').open)$('runResults').close();report=newReport();report.soloMission=activeMission;report.training=activeTraining;report.accountId=account.getUserId();report.receiptId=activeMission||!experimentalWorkshop?null:newRunReceiptId();activeStory=activeMission?createStoryMission(activeMission):null;setLogicalHeight(540);if(freshMap&&!activeMission)selectedMap=nextMapId(selectedMap);combatFx.clear();soldierMotion.reset();rivalMotion.reset();lastSnapshotAt=0;bossSignal=null;const deploymentProfile=account.getProfile();state=createSoloDeployment({player:createPlayer('local',{...deploymentProfile,level:account.getLevel()}),mapId:selectedMap,profile:deploymentProfile,workshopEnabled:experimentalWorkshop,campaign:activeTraining?trainingContract():activeMission&&{id:activeMission.id,threat:activeMission.threat,spawn:{x:activeMission.stages[0]?.x,y:activeMission.stages[0]?.y}}});Object.assign(state,{speed:1,selectedPad:null});accumulator=0;keys.clear();closeMenu();updateUI();}
  function dispatch(command,done){
    if(!coop){done(applyCommand(state,'local',command));return;}
    const active=coop;
    coopInput.execute(command).then(result=>{if(coop===active)done(result);});
  }
  let lastNotice=null;
  function notice(text){lastNotice=typeof text==='function'?text:()=>localizeGameMessage(text,tr);$('message').textContent=lastNotice();}
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
  let hudBottom='',actionBar='';
  // Bottom edge of the status dashboard, measured against the battlefield box.
  // Re-measured only when the number actually moves, so scrolling never thrashes layout.
  function measureHud(){
    try{
      const query=node=>typeof node?.querySelector==='function'?node.querySelector('.dashboard'):null;
      const battle=typeof $('gameView')?.querySelector==='function'?$('gameView').querySelector('.battle'):null;
      const dashboard=query(battle);
      if(!dashboard||typeof dashboard.getBoundingClientRect!=='function'||typeof battle.getBoundingClientRect!=='function')return;
      const bottom=Math.round(dashboard.getBoundingClientRect().bottom-battle.getBoundingClientRect().top);
      if(bottom>0&&`${bottom}px`!==hudBottom){hudBottom=`${bottom}px`;document.documentElement.style.setProperty('--hud-bottom',hudBottom);}
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
  for(let i=0;i<3;i++)if($(`runPerk${i}`))$(`runPerk${i}`).onclick=()=>dispatch({type:'choosePerk',index:i},result=>{notice(result.ok?tr('{name} acquired for this operation.',{name:tr(result.perk)}):result.reason);updateUI();});
  // The retreat panel: every tenth cleared wave a solo endless run falls back
  // to the next sector. It is a panel over the field, like the perk choices -
  // never a modal dialog that could cover anything.
  $('sectorAdvance').onclick=()=>dispatch({type:'advanceSector'},result=>{
    if(!result.ok){notice(result.reason);return;}
    state.selectedPad=null;closeMenu();combatFx.clear();sound.play('clear');
    notice(tr('Sector {number}: a longer road, a meaner enemy. Demolition refund: {refund} supplies.',{number:result.sector,refund:result.refund}));
    updateUI();
  });
  function updateUI(){
    renderCampaign();
    const showObjective=(!!activeMission||activeTraining)&&!coop;$('soloObjective').hidden=!showObjective;
    // The objective card is positioned BELOW the status dashboard and the field menu
    // instead of at a guessed offset: the dashboard's height depends on the number of
    // stats, the language and the width of the phone. Publish its measured bottom edge,
    // relative to the battlefield box (the card is positioned inside that box), so the
    // stylesheet can place the card under it on every device and every screen size.
    if(showObjective)measureHud();
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
    if(state.ended&&(!coop||hasCoopSnapshot)&&report&&!report.finished){finishReport(report,state,me());if(state.endReason!=='retired')onReturnToCommand();if(state.endReason==='training-complete'&&typeof onTrainingComplete==='function')onTrainingComplete();}else if(state.ended&&report?.finished&&report.snapshot!==state){report.snapshot=state;if(lastReport===report&&$('runResults').open)renderResults(report);}
    const map=getMap(state.mapId),terrain=terrainFor(map),versus=state.mode==='versus',teamMatch=state.fourInfo?.mode==='two-vs-two';$('battleLabel').textContent=coop?tr('MULTIPLAYER'):activeMission?tr('STORY MISSION {number}',{number:CAMPAIGN.indexOf(activeMission)+1}):tr('FREE PLAY');const sector=sectorOf(state.mapId);
    $('mapName').textContent=versus?`${tr(map.name)} · 1 VS 1`:sector>1?`${tr(map.name)} · ${tr('SECTOR {number}',{number:sector})}`:tr(map.name);
    const canvasHeight=versus?1100:540;if(logicalHeight!==canvasHeight){setLogicalHeight(canvasHeight);if(touchZoom&&!battleViewport)touchZoom.resize(touchZoom.getFactor());}syncBattleViewport(map,versus);
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
        $('sectorText').textContent=tr('Fall back now. Your towers are lost in the retreat; you carry over a {refund} supply demolition refund.',{refund:state.towers.reduce((sum,tower)=>sum+Math.floor(.6*(TOWER_COSTS[tower.type]+(towerUpgradeInvestment(tower.level)??0))),0)});
      }
    }
    if($('bossAlert')){
      const boss=state.enemies.find(e=>e.boss&&e.hp>0),incoming=state.running&&state.wave%5===0&&state.spawnLeft>0?bossForWave(state.wave):null,info=boss?BOSSES.find(b=>b.kind===boss.boss):incoming;
      $('bossAlert').hidden=!info||state.ended;
      if(info){const signal=boss?bossTelegraph(boss):null,key=boss?`${boss.boss}:${signal?.key||'normal'}`:null;if(signal?.warning&&bossSignal?.startsWith(`${boss.boss}:`)&&bossSignal!==key){sound.play('warning');$('bossAnnouncement').textContent=`${tr(info.label)}: ${localizedBossSignal(signal)}`;}bossSignal=key;$('bossAlert').classList.toggle('is-warning',!!signal?.warning);$('bossAlertTitle').textContent=tr(boss?'BOSS · {name}':'BOSS INCOMING · {name}',{name:tr(info.label)});$('bossAlertInfo').textContent=signal?localizedBossSignal(signal):tr((boss&&bossPhaseLabel(boss))||info.description);$('bossHealth').hidden=!boss;if(boss)$('bossHealthFill').style.width=`${Math.max(0,Math.min(100,100*boss.hp/boss.maxHp))}%`;}else bossSignal=null;
    }
    const threats=countFieldThreats(state.enemies);for(const [kind,id] of [['infantry','threatInfantry'],['runner','threatRunner'],['tank','threatTank'],['plane','threatPlane']])$(id).textContent=String(threats[kind]);const summary=Object.entries(threats).filter(([,n])=>n).map(([kind,n])=>`${tr(ENEMY_TYPES[kind].label)} ${n}`).join(' · ');$('threatSummary').textContent=summary||tr('No enemies on field');
    const preview=state.ended?tr(coop?'Run ended. Close the party to start a new operation.':'Run ended. Restart to play again.'):tr('Next: ')+waveSummary(state.wave+1); if($('wavePreview').textContent!==preview)$('wavePreview').textContent=preview;
    $('wave').textContent=`${state.wave} / ∞`; $('health').textContent=Math.max(0,Math.ceil(state.hp)); $('money').textContent=supplies();if($('moneyLabel'))$('moneyLabel').textContent=coop?tr('YOUR SUPPLIES'):tr('SUPPLIES'); $('enemies').textContent=state.enemies.length+state.spawnLeft; const levelNode=$('level');if(levelNode)levelNode.textContent=String(state.players[me()]?.level||1);
    const player=state.players[me()],speedVote=state.speedRequest; $('speed').textContent=coop?tr(state.speed===2?'SPEED: 2× · SET 1×':speedVote?(speedVote.requester===me()?'CANCEL 2× REQUEST':'2× VOTE PENDING'):'REQUEST 2×'):tr('SPEED: {speed}×',{speed:state.speed}); const ability=tr(abilityName(player?.skills)).toUpperCase(),needsEnemies=['assault','recon'].includes(player?.skills?.active); $('ability').textContent=!player?.skills?.active?tr('NO SKILL'):player?.cooldown>0?tr('{ability}: {seconds}s',{ability,seconds:Math.ceil(player.cooldown)}):tr('{ability} READY',{ability}); $('ability').disabled=state.ended||!player?.skills?.active||player.cooldown>0||(needsEnemies?!state.enemies.length:!state.running)||!menu.hidden||(!!coop&&!coopReady); $('speed').disabled=!menu.hidden||!!coop&&(!coopReady||state.ended||!state.running||!!speedVote&&speedVote.requester!==me());
    const speedEligible=!!speedVote&&speedVote.required.includes(me())&&!speedVote.approved.includes(me());$('speedRequest').hidden=!coop||!speedVote;$('speedRequestText').textContent=speedVote?tr('{name} requests 2× for wave {wave}. {approved}/{required} approved.',{name:state.players[speedVote.requester]?.name||tr('A player'),wave:speedVote.wave,approved:speedVote.approved.length,required:speedVote.required.length}):'';$('speedApprove').hidden=$('speedDecline').hidden=!speedEligible;$('speedApprove').disabled=$('speedDecline').disabled=!coopReady;
    const guest=!!coop&&!!state.hostId&&state.hostId!==me(),host=!!coop&&state.hostId===me(),pending=!!state.pendingWave;
    $('endRun').textContent=guest?(versus?tr('LEAVE MATCH'):tr('LEAVE CO-OP')):host&&(state.ended||(versus&&!coopReady))?tr('CLOSE PARTY'):tr('END RUN');$('endRun').disabled=(!coop&&state.ended)||!menu.hidden||(!!coop&&!coopReady&&!guest&&!state.ended&&!versus);
    $('waveRequest').hidden=!coop||!pending||state.ended;
    if(coop&&pending){$('waveRequestText').textContent=guest?tr('Host requests wave {wave}. Approve when ready.',{wave:state.pendingWave}):state.fourInfo?tr('Waiting for players to approve wave {wave} ({approved}/{required}).',{wave:state.pendingWave,approved:state.fourInfo.approved,required:state.fourInfo.required}):tr('Waiting for your {player} to approve wave {wave}.',{player:tr(versus?'opponent':'teammate'),wave:state.pendingWave});$('waveDecline').hidden=!guest;$('waveDecline').disabled=!coopReady;}
    $('start').textContent=state.ended?(coop?tr('MATCH ENDED'):tr('RESTART OPERATION')):state.running?tr('WAVE IN PROGRESS'):guest?(pending?tr('APPROVE WAVE'):state.fourInfo?.waitingForOthers?tr('WAIT FOR PLAYERS'):tr('WAIT FOR HOST')):host&&pending?tr('CANCEL REQUEST'):host&&versus&&state.waitingForRival?tr('WAIT FOR OPPONENT'):coop?(versus||Object.entries(state.players).some(([id,p])=>id!==state.hostId&&p.active!==false)?tr('REQUEST WAVE'):tr('START NEXT WAVE')):state.wave===0?tr('DEPLOY / START WAVE'):tr('START NEXT WAVE');
    $('start').disabled=(state.running&&!state.ended)||!!state.pendingPerk||!!state.pendingSector||!menu.hidden||(!!coop&&(!coopReady||state.ended||(!host&&!guest)||(guest&&!pending)||(versus&&host&&state.waitingForRival)||(teamMatch&&host&&state.fourInfo?.otherNotReady)));
    // The coach re-reads the field once per painted frame. That is what lets a gate
    // open without a callback (a tower already standing when the card came up) and
    // close again when the evidence disappears (the tower was sold).
    try{if(coach.isOpen()||coach.dismissed())coach.tick();}catch{/* A hint must never break the field. */}
    const coachRecall=$('coachRecall');if(coachRecall)coachRecall.hidden=!coach.dismissed();
  }
  function localizedBossSignal(signal){const labels={'shield-warning':'SHIELD RAISING · {seconds}s',shield:'SHIELD UP · DAMAGE REDUCED · {seconds}s','bomb-warning':'BOMB STRIKE IN · {seconds}s','repair-warning':'REPAIR IN · {seconds}s','rally-warning':'RALLY IN · {seconds}s',rally:'RALLY ACTIVE · {seconds}s','jam-warning':'JAM FIELD RISING · {seconds}s',jam:'JAM FIELD ACTIVE · {seconds}s','flood-warning':'FLOOD PULSE IN · {seconds}s',flood:'FLOOD PULSE ACTIVE · {seconds}s','rail-warning':'RAIL GUNS LOADING · {seconds}s',wire:'SIGNAL WIRE ACTIVE · WEAPON DAMAGE HALVED · {seconds}s',guns:'RAIL GUNS ACCELERATING · HOLD THE BUNKER · {seconds}s'};return labels[signal.key]?tr(labels[signal.key],{seconds:signal.seconds}):signal.text;}
  function waveSummary(wave){const counts={};for(const kind of waveFormation(wave)) counts[kind]=(counts[kind]||0)+1;return tr('Wave {wave}',{wave})+(wave%5===0?tr(' · BOSS WAVE'):'')+' · '+Object.entries(counts).map(([kind,n])=>`${n} ${tr(ENEMY_TYPES[kind].label)}`).join(' · ')+(bossForWave(wave)?` · ${tr(bossForWave(wave).description)}`:'');}
  $('speed').onclick=()=>{if(coop){const vote=state.speedRequest,command=state.speed===2?{type:'slowSpeed'}:vote?{type:'cancelSpeed',requestId:vote.id}:{type:'requestSpeed'};dispatch(command,result=>{notice(result.ok?(command.type==='requestSpeed'?'Speed request sent. Waiting for every other player.':command.type==='cancelSpeed'?'Speed request cancelled.':'Speed returned to 1×.'):result.reason);updateUI();});return;}state.speed=state.speed===1?2:state.speed===2?3:1;updateUI();};
  for(const [id,type] of [['speedApprove','approveSpeed'],['speedDecline','declineSpeed']])$(id).onclick=()=>{const vote=state.speedRequest;if(!coop||!vote)return;dispatch({type,requestId:vote.id},result=>{notice(result.ok?(type==='approveSpeed'?'Speed approved.':'Speed request declined.'):result.reason);updateUI();});};
  $('start').onclick=()=>{
    // A finished training contract turns into a normal endless run: the player
    // has already been handed on by the debrief, and pressing Deploy must not
    // silently replay the shortened contract.
    if(state.ended){if(!coop){if(activeTraining){activeTraining=false;activeMission=null;selectedMap=nextMapId(selectedMap);}reset(true);notice('New battlefield ready. Deploy when ready.');}return;}if(state.running)return;if(!coop)state.players.local.level=account.getLevel();
    const command=coop&&state.pendingWave?(state.hostId===me()?'cancelWave':'approveWave'):'startWave';
    dispatch(command==='startWave'?{type:command}:{type:command,requestId:state.waveRequestId},result=>{if(!result.ok){notice(result.reason);return;}coach.event('deploy');if(!coop)sound.play(state.wave%5===0?'boss':'wave');notice(!coop?tr('Wave {wave} incoming: {summary}.',{wave:state.wave,summary:waveSummary(state.wave)}):command==='cancelWave'?'Wave request cancelled.':result.waitingForGuest||result.waitingForPlayers?'Waiting for player approval.':command==='approveWave'?'Wave approved.':'Wave started.');updateUI();});
  };
  $('waveDecline').onclick=()=>dispatch({type:'declineWave',requestId:state.waveRequestId},result=>{notice(result.ok?'Wave postponed. The host can request again when ready.':result.reason);updateUI();});
  $('endRun').onclick=async()=>{
    const guest=!!coop&&!!state.hostId&&state.hostId!==me(),teamMatch=state.fourInfo?.mode==='two-vs-two';
    if(coop&&(state.ended||(state.mode==='versus'&&!coopReady))&&!guest){if(typeof leaveParty==='function'){if(!await leaveParty())return;}else await leaveCoop();onReturnToCommand();return;}
    if((state.ended&&!guest)||!menu.hidden||(coop&&!coopReady&&!guest))return;
    const session=coop,soloState=state,mapId=state.mapId;
    const confirmed=await confirmAction({title:guest?(state.mode==='versus'||teamMatch?'Leave match?':'Leave co-op?'):'End this run?',text:guest?(state.mode==='versus'||teamMatch?(coopReady?(teamMatch?'Leave this match? Your team forfeits and the other team wins. Completed-wave rewards are saved.':'Leave this match? You forfeit and the host wins. Completed-wave rewards are saved.'):'Leave while disconnected? Your opponent may not receive your forfeit; reconnect first if possible.'):coopReady?'Leave this co-op party? The host keeps playing. Completed-wave rewards are saved; the current unfinished wave earns no rewards.':'Leave while disconnected? Rewards not yet received from the host may require reconnecting. The host keeps playing.'):session?'This ends the shared run for all players. Completed-wave rewards are kept; the current unfinished wave earns no rewards. Battle continues until confirmed.':'End this run now? Completed-wave rewards are kept; the current unfinished wave earns no rewards.',accept:guest?(state.mode==='versus'||teamMatch?'LEAVE MATCH':'LEAVE CO-OP'):'END RUN'});
    if(!confirmed||!account.isReady()||coop!==session||(!guest&&state.ended)||state.mapId!==mapId||(!session&&state!==soloState)||(session&&!coopReady&&!guest))return;
    if(guest){
      // The host marks the guest inactive before the final reward snapshot is
      // delivered. This prevents a wave-clear race while leaving mid-battle.
      if(coopReady&&!state.ended){const result=await new Promise(resolve=>dispatch({type:'leaveRun'},resolve));if(coop!==session)return;if(!result.ok&&!state.ended){notice(result.reason);return;}}
      const resultSnapshot=state,resultReport=report,resultId=me(),wasDisconnected=!coopReady;if(typeof leaveParty==='function'){if(!await leaveParty())return;}else await leaveCoop();resultReport.left=true;resultReport.disconnected=wasDisconnected;finishReport(resultReport,resultSnapshot,resultId);onReturnToCommand();notice(teamMatch?'You left the match.':'You left co-op. The host can continue.');return;
    }
    dispatch({type:'endRun'},result=>{if(!result.ok){notice(result.reason);return;}keys.clear();notice(session?'Shared run ended. Completed-wave rewards are kept. Close the party to start a new run.':'Run ended. Completed-wave rewards are kept. Restart for a new battlefield.');updateUI();onReturnToCommand();});
  };
  $('ability').onclick=()=>{const solo=!coop,player=state.players[me()],targets=solo?state.enemies.map(e=>({...e})):[];dispatch({type:'airstrike'},result=>{if(!result.ok){notice(result.reason);return;}if(solo){combatFx.emit(player?.skills?.active||'assault',player,{enemies:targets});sound.play('ability');if(result.combos?.length){combatFx.emit('combo',{x:player.comboCue.x,y:player.comboCue.y,comboLabel:result.combos.join(' + ')},state);sound.play('combo');}}notice(()=>tr('{ability} deployed!',{ability:tr(abilityName(state.players[me()]?.skills))})+(result.combos?.length?tr(' {combos} combo!',{combos:result.combos.map(x=>tr(x)).join(' + ')}):''));updateUI();});};
  function sendDirection(){const x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),y=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(coop){const key=`${x},${y}`;if(key!==lastDirection){lastDirection=key;coopInput.direction({type:'direction',x,y});}}else applyCommand(state,'local',{type:'direction',x,y});}
  window.addEventListener('keydown', e=>{if(cinematic)return;if(!menu.hidden){if(e.key==='Escape'){closeMenu();state.selectedPad=null;updateUI();}return;}if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();keys.add(key);sendDirection();}});
  window.addEventListener('keyup', e=>{keys.delete(e.key.toLowerCase());sendDirection();});
  const focusPause=createFocusPause({window,document,onBlur:()=>{keys.clear();sendDirection();accumulator=0;},onChange:paused=>coop?.setFocusPaused?.(paused)});
  let tutorialStorage;try{tutorialStorage=window.localStorage;}catch{tutorialStorage=null;}
  // Practice steps drive the real dialogs. The sandbox comes from the account app,
  // which owns the write guard; without it the tutorial stays on mock screens.
  const tutorial=createTutorial({document,storage:tutorialStorage,
   // A finished tour hands the new soldier straight to the training contract.
   onFinish:id=>{if(trainingSeen(id,tutorialStorage))return;markTrainingSeen(id,tutorialStorage);window.setTimeout(()=>startTrainingRun(),400);},
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
  }});
  // The first-run coach runs ON TOP of the training run, without pausing it. This
  // is the "play first, read while you play" path; the modal tour above stays for
  // the replay button in Help.
  // Finishing the cards hands nothing on by itself: the run's own debrief (via
  // onTrainingComplete) owns the ending, so there is exactly one path into it.
  // The coach asks the engine where to point, because only the engine knows which
  // pads are free in the live match. A card that says "tap a build marker" without
  // a ring around one is a puzzle, not an explanation.
  const coach=createCoach({document,window,storage:tutorialStorage,resolveTarget:target=>{
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
  }});
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
  if(coachRecall)coachRecall.onclick=()=>{if(coach.reopen())updateUI()};
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
  let menuMode='actions',menuTowerKey=null,detailAvailability=null,detailContent=null;
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
  const towerKey=t=>t?`${t.id??''}:${t.type}:${t.level}`:'empty';
  function closeMenu(){selectionEpoch++;releaseReservation();menu.hidden=true;menuPad=null;menuTowerKey=null;detailAvailability=null;detailContent=null;}
  function showMenu(pad,mode='actions',refresh=false){
    const tower=state.towers.find(t=>t.pad===pad);menuPad=pad;menuMode=mode;state.selectedPad=tower?pad:null;
    if(!refresh){menuTowerKey=towerKey(tower);keys.clear();sendDirection();}
    const menuNotice=text=>{if(!refresh)notice(text);};
    const actions=[];
    if(!tower){
      const tutorialLock=trainingBuildLocked(state);
      types.forEach((type,i)=>actions.push({label:tr(type.name),price:type.cost,summary:tr(type.description)+(tutorialLock?tr(' · One tower, one upgrade in training'):''),unaffordable:supplies()<type.cost,locked:tutorialLock,description:tr('View {name}, {cost} supplies. {description}',{name:tr(type.name),cost:type.cost,description:tr(type.description)})+(tutorialLock?tr('. The training contract walks one tower and its upgrade first.'):'')+(supplies()<type.cost?tr('. Not enough supplies to build.'):'' ),run:()=>{
        showDetails(()=>tr(type.name),()=>tr('{description}. Base damage: {damage} per shot, firing interval: {interval} seconds, range: {range}. Damage varies by enemy type.',{description:tr(type.description),damage:type.damage,interval:type.interval,range:type.range}),type.cost,'BUILD',()=>{
          dispatch({type:'build',pad,towerType:i},result=>{if(!result.ok){$('towerDetailsCost').textContent=localizeGameMessage(result.reason,tr);return;}// The id is what makes the evidence check meaningful: the card later asks the
// field whether *this* tower still stands, so selling it takes the step back.
          const built=state.towers.find(t=>t.pad===pad);
          coach.event('build',{builtTowerId:built?built.id:null});if($('towerDetails').open)$('towerDetails').close();if(!coop){combatFx.emit('build',getMap(state.mapId).pads[pad],state);sound.play('build');}state.selectedPad=pad;closeMenu();notice(()=>tr('{name} built. Tap it to upgrade or sell.',{name:tr(type.name)}));updateUI();});
        });
      }}));
      menuNotice(coop?'Tap a tower for details. Grey options need more supplies. Battle continues in co-op.':'Tap a tower for details. Grey options need more supplies. Battle paused.');
    }else if(mode==='branches'){
      const cost=upgradeCost(tower.level),sharedUpgrade=state.individualSupplies&&tower.ownerId!==me()?tr(' You pay for this upgrade; any sale refund goes to {name}.',{name:state.players[tower.ownerId]?.name||tr('the builder')}):'';
      branches[tower.type].forEach((branch,i)=>{const required=i===2?5:i===3?10:0,locked=(state.players[me()]?.level||1)<required;actions.push({icon:'branch',price:cost,label:tr(branch.name),summary:tr(branch.description)+(locked?tr(' · LOCKED UNTIL LEVEL {level}',{level:required}):''),unaffordable:supplies()<cost,locked,lockLevel:required,description:tr('View {name}: {description}. {cost} supplies',{name:tr(branch.name),description:tr(branch.description),cost})+(locked?tr('. Unlocks at level {level}.',{level:required}):'')+(supplies()<cost?tr('. Not enough supplies.') :''),run:()=>showDetails(()=>tr(branch.name),()=>tr('{description}. Level 3 also increases the base damage multiplier before specialization and enemy modifiers. This specialization is permanent.',{description:tr(branch.description)})+(state.individualSupplies&&tower.ownerId!==me()?tr(' You pay for this upgrade; any sale refund goes to {name}.',{name:state.players[tower.ownerId]?.name||tr('the builder')}):''),cost,'UPGRADE',()=>upgrade(i),required)});});
      menuNotice(coop?'Tap a specialization to see its effects. Battle continues in co-op.':'Tap a specialization to see its effects. Battle paused.');
    }else if(mode==='confirmSell'){
      const ownerName=state.players[tower.ownerId]?.name||tr('tower owner'),mine=!state.individualSupplies||tower.ownerId===me();
      actions.push({label:mine?tr('Confirm sale · +{amount}',{amount:towerRefund(tower)}):tr('Confirm sale'),summary:mine?tr('Remove this tower and recover half of its total cost.'):tr('Remove this tower; {name} receives {amount} supplies.',{name:ownerName,amount:towerRefund(tower)}),description:mine?tr('Confirm sale for {amount} supplies',{amount:towerRefund(tower)}):tr('Confirm sale. {name} receives {amount} supplies',{name:ownerName,amount:towerRefund(tower)}),run:()=>{dispatch({type:'sell',pad,...(coop?{expectedTowerId:tower.id,expectedLevel:tower.level}:{})},result=>{if(!result.ok){notice(result.reason);return;}state.selectedPad=null;closeMenu();notice(result.refundTo&&result.refundTo!==me()?tr('Tower sold. {name} receives {amount} supplies.',{name:state.players[result.refundTo]?.name||tr('the owner'),amount:result.refund}):tr('Tower sold. +{amount} supplies.',{amount:result.refund}));updateUI();});}});
      actions.push({label:tr('Cancel'),summary:tr('Keep this tower.'),description:tr('Cancel sale'),run:()=>showMenu(pad)});
      menuNotice(coop?'Confirm sale for half the investment, or cancel. Battle continues in co-op.':'Confirm sale for half the investment, or cancel. Battle paused.');
    }else{
      const cost=upgradeCost(tower.level),max=cost===null,display=towerDisplay(tower.level),prestiging=display.level===MAX_TOWER_LEVEL,sharedUpgrade=state.individualSupplies&&tower.ownerId!==me()?tr(' You pay for this upgrade; any sale refund goes to {name}.',{name:state.players[tower.ownerId]?.name||tr('the builder')}):'';
      actions.push({icon:'upgrade',price:max?null:cost,unaffordable:!max&&supplies()<cost,label:max?tr('Upgrade unavailable'):tr(tower.level===2?'Choose specialization · {cost}':prestiging?'Prestige · {cost}':'Confirm upgrade · {cost}',{cost}),summary:max?tr('This tower cannot be upgraded further.'):tower.level===2?tr('Choose a permanent specialization.'):(prestiging?tr('Prestige {prestige}: level resets to 1; power and specialization stay, and damage increases.',{prestige:display.prestige+1}):tr('Confirm purchase: +0.3 damage multiplier.'))+sharedUpgrade,disabled:max,unaffordable:!max&&supplies()<cost,description:max?tr('Upgrade unavailable'):tr('Upgrade to level {level}, prestige {prestige}, {cost} supplies',{level:towerDisplay(tower.level+1).level,prestige:towerDisplay(tower.level+1).prestige,cost})+(supplies()<cost?tr('. Not enough supplies.'):''),run:()=>{if(tower.level===2)showMenu(pad,'branches');else if(supplies()>=cost)upgrade(0);else notice('Not enough supplies to upgrade.');}});
      const mine=!state.individualSupplies||tower.ownerId===me(),ownerName=state.players[tower.ownerId]?.name||tr('the owner');
      actions.push({icon:'sell',label:mine?tr('Sell · +{amount}',{amount:towerRefund(tower)}):tr('Sell tower'),summary:mine?tr('Recover half of build and upgrade costs.'):tr('Half the costs go to {name}.',{name:ownerName}),description:mine?tr('Sell tower for {amount} supplies',{amount:towerRefund(tower)}):tr('Sell tower; refund goes to {name}',{name:ownerName}), run:()=>showMenu(pad,'confirmSell')});
      const name=tower.branch!=null?branches[tower.type][tower.branch].name:types[tower.type].name;
      menuNotice(()=>tr(towerDisplay(tower.level).prestige?'{name} · level {level} · prestige {prestige} · range {range}. {battle}':'{name} · level {level} · range {range}. {battle}',{name:tr(name),level:towerDisplay(tower.level).level,prestige:towerDisplay(tower.level).prestige,range:Math.round(getTowerRange(tower)),battle:tr(coop?'Battle continues in co-op.':'Battle paused.')}));
    }
    function upgrade(branch){const next=towerDisplay(tower.level+1);dispatch({type:'upgrade',pad,branch,...(coop?{expectedTowerId:tower.id,expectedLevel:tower.level}:{})},result=>{if(!result.ok){if($('towerDetails').open)$('towerDetailsCost').textContent=localizeGameMessage(result.reason,tr);else notice(result.reason);return;}coach.event('upgrade',{builtTowerId:tower.id});if(!coop){combatFx.emit('upgrade',getMap(state.mapId).pads[pad],state);sound.play('upgrade');}notice(()=>next.level===1?tr('Tower reached prestige {prestige} · level 1.',{prestige:next.prestige}):tr(next.prestige?'Tower upgraded to level {level} · prestige {prestige}.':'Tower upgraded to level {level}.',{level:next.level,prestige:next.prestige}));if($('towerDetails').open)$('towerDetails').close();closeMenu();updateUI();});}
    menu.dataset.mode=tower?'actions':'build';
    $('sheetMode').textContent=tr(coop?'BATTLE CONTINUES':'BATTLE PAUSED');
    $('sheetTitle').textContent=!tower?tr('Build defense'):mode==='branches'?tr('Choose specialization'):mode==='confirmSell'?tr('Sell tower?'):tr(towerDisplay(tower.level).prestige?'{name} · Level {level} · Prestige {prestige}':'{name} · Level {level}',{name:tr(tower.branch!=null?branches[tower.type][tower.branch].name:types[tower.type].name),level:towerDisplay(tower.level).level,prestige:towerDisplay(tower.level).prestige});
    $('sheetHint').textContent=!tower?tr('Choose a tower to inspect.'):mode==='branches'?tr('This choice is permanent.'):mode==='confirmSell'?tr('Confirm or cancel the sale.'):tr('Range {range} · tap an action for details',{range:Math.round(getTowerRange(tower))});
    options.forEach((button,i)=>{const action=actions[i];button.hidden=!action;button.disabled=!action||!!action.disabled;if(action?.icon)button.dataset.icon=action.icon;else delete button.dataset.icon;button.classList.toggle('unaffordable',!!(action?.unaffordable||action?.locked));button.classList.toggle('locked',!!action?.locked);$('menuName'+i).textContent=action?action.label:'';const priceNode=$('menuPrice'+i);if(priceNode)priceNode.textContent=action?(action.locked?tr('Lv {level}',{level:action.lockLevel}):(action.price!=null?String(action.price):'')):'';$('menuDesc'+i).textContent=action?(action.summary||'')+(action.unaffordable?tr(' · Not enough supplies'):''):'';button.setAttribute('aria-label',action?action.description:'');button.onclick=action?()=>action.run():null;});
    menu.hidden=false;if(!refresh)updateUI();
  }
  function refreshDetails(){
    if(!$('towerDetails').open||!detailAvailability)return;
    const {cost,required}=detailAvailability;if(detailContent){$('towerDetailsTitle').textContent=detailContent.title();$('towerDetailsText').textContent=detailContent.text();$('towerDetailsConfirm').textContent=`${tr(detailContent.verb)} · ${cost}`;}const changed=menuPad===null||towerKey(state.towers.find(t=>t.pad===menuPad))!==menuTowerKey;
    const locked=(state.players[me()]?.level||1)<required,reason=changed?'Tower changed. Close and select it again.':locked?tr('Unlocks at soldier level {level}.',{level:required}):supplies()<cost?'Not enough supplies':'';
    $('towerDetailsCost').textContent=tr('Cost: {cost} supplies · Available: {available}',{cost,available:supplies()})+(reason?' · '+tr(reason):'');
    $('towerDetailsConfirm').disabled=changed||locked||supplies()<cost;
  }
  function refreshTowerMenu(){
    if(menu.hidden||menuPad===null)return;
    if(reservedPad!==null&&state.buildReservations?.[reservedPad]?.playerId!==me()){
      if(state.towers.some(t=>t.pad===reservedPad)){refreshDetails();return;}
      if($('towerDetails').open)$('towerDetails').close();closeMenu();state.selectedPad=null;notice('Build reservation expired. Select the spot again.');return;
    }
    if(reservedPad!==null&&performance.now()-lastReservationRefresh>20000){
      lastReservationRefresh=performance.now();const session=coop,input=coopInput,pad=reservedPad;
      if(session&&input)void reservationCommand(session,input,{type:'reserveBuild',pad});
    }
    if(towerKey(state.towers.find(t=>t.pad===menuPad))===menuTowerKey)showMenu(menuPad,menuMode,true);
    refreshDetails();
  }
  function showDetails(title,text,cost,verb,confirm,required=0){
    detailContent={title:typeof title==='function'?title:()=>title,text:typeof text==='function'?text:()=>text,verb};
    detailAvailability={cost,required};const button=$('towerDetailsConfirm');button.onclick=confirm;
    $('towerDetails').showModal();refreshDetails();
  }
  $('towerDetailsBack').onclick=()=>$('towerDetails').close();
  function dismissTower(){if($('towerDetails').open)$('towerDetails').close();closeMenu();state.selectedPad=null;notice('Tower menu closed.');updateUI();}
  $('radialClose').onclick=dismissTower;
  bindDialogBackdrop($('towerDetails'),dismissTower);
  $('towerDetails').addEventListener('cancel',event=>{event.preventDefault();dismissTower();});
  document.addEventListener('click',event=>{
    if(menu.hidden||$('towerDetails').open||document.querySelector('dialog[open]')||menu.contains(event.target))return;
    dismissTower();event.preventDefault();event.stopPropagation();
  },true);
  async function selectBattlePoint(x,y){
    if(battleViewport&&!menu.hidden){dismissTower();return;}
    selectionEpoch++;
    if(state.ended||(coop&&!coopReady))return;const rect=canvas.getBoundingClientRect(),map=getMap(state.mapId),view=battleViewport?.getViewport();
    if(state.mode==='versus'&&y>=540){notice('That is your opponent’s battlefield. Build and move on your own lane above.');return;}
    const radius=Math.min(56,Math.max(28,22*logicalWidth/rect.width/(view?.scale||1))),pads=map.pads;let index=-1,nearest=radius;
    pads.forEach((p,i)=>{const d=Math.hypot(p.x-x,p.y-y);if(d<nearest){index=i;nearest=d;}});
    if(index<0){closeMenu();state.selectedPad=null;dispatch({type:'move',x:Math.max(12,Math.min((map.width||960)-12,x)),y:Math.max(12,Math.min((map.height||540)-12,y))},result=>{if(result.ok){const p=state.players[me()];coach.event('move',{moveFrom:{x:p?.x,y:p?.y}});}notice(result.ok?'Hero moving to position.':result.reason);updateUI();});return;}
    const selected=index;
    if(coop&&!state.towers.some(t=>t.pad===selected)){
      closeMenu();state.selectedPad=null;const epoch=selectionEpoch,session=coop,input=coopInput;
      notice('Reserving build spot…');
      const cancelled=()=>epoch!==selectionEpoch||coop!==session||!coopReady;
      pendingClaims++;
      try{
        const result=await reservationCommand(session,input,{type:'reserveBuild',pad:selected},cancelled);
        if(cancelled())return;
        if(!result.ok){notice(result.reason||'Build spot could not be reserved.');return;}
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
    if(coop||focusPause.isSoloPaused()||state.ended||commandMenuOpen||missionBoardOpen||cinematic||!menu.hidden||tutorial.isOpen()||$('gameConfirm').open||!account.isReady()){accumulator=0;return;}
    accumulator+=dt*state.speed;
    while(accumulator>=STEP){
      accumulator-=STEP;
      for(const event of stepMatch(state)){
        if(event.type==='skillCombo'){combatFx.emit('combo',{x:event.x,y:event.y,comboLabel:event.name},state);sound.play('combo');}
        else if(event.type==='bossSpawn')coach.boss();
        else if(event.type==='bunkerHit'){sound.play('impact');combatFx.emit('bunkerHit',{x:900,y:400,comboLabel:`−${Math.round(event.damage*10)/10}`},state);notice(()=>tr('{enemy} reached the bunker! −{damage} health.',{enemy:tr(ENEMY_TYPES[event.kind]?.label||'Enemy'),damage:Math.round(event.damage*10)/10}));}
        else if(event.type==='lootDrop')notice(()=>tr('Supply cache found! +{count} supplies.',{count:event.supplies}));
        else if(event.type==='bossAbility'&&event.ability==='bomb'){sound.play('impact');combatFx.emit('bunkerHit',{x:900,y:400,comboLabel:`−${Math.round(event.damage*10)/10}`},state);notice(()=>tr('Bomber struck the bunker! −{damage} health.',{damage:Math.round(event.damage*10)/10}));}
        else if(event.type==='bossAbility'&&event.ability==='railgun'){sound.play('impact');combatFx.emit('bunkerHit',{x:900,y:400,comboLabel:`−${Math.round(event.damage*10)/10}`},state);notice(()=>tr('Rail guns struck the bunker! −{damage} health.',{damage:Math.round(event.damage*10)/10}));}
        else if(event.type==='rubbleCleared'){sound.play('impact');notice('Rubble cleared! Long-range shots are no longer weakened in that zone.');}
        else if(event.type==='iceBroken'){sound.play('ice');notice('Thin ice broke! Tanks slow down and take more damage.');}
        else if(event.type==='defeat'){sound.play('defeat');notice('Bunker lost. The operation has failed.');}
        else if(event.type==='waveCleared'){if(!activeMission)account.recordScore?.('solo',event.wave);sound.play('clear');const target=report;target.pending++;Promise.resolve(account.awardXP(event.xp,event.wave,!experimentalWorkshop?null:runReceipt())).then(detail=>{target.pending--;if(detail?.committed)addReward(target,detail);else target.failed=true;if(lastReport===target&&$('runResults').open)renderResults(target);renderCampaign();}).catch(()=>{target.pending--;target.failed=true;if(lastReport===target&&$('runResults').open)renderResults(target);});notice(event.wave%5===0?tr('Boss wave {wave} cleared! Choose a field upgrade. +{xp} XP.',{wave:event.wave,xp:event.xp}):tr('Wave cleared! +20 supplies and +{xp} XP. Prepare for the next wave.',{xp:event.xp}));}
      }
      // The boss of wave 5 ends the training contract: five cleared waves, and the
      // dog tag is handed over in the debrief. `trainingWon` waits for the boss to
      // actually die, so the run cannot end with the boss still standing.
      // The first run ends in the reward screen either way. Winning tops the run up
      // to FIRST_RUN_XP; losing still pays FIRST_RUN_DEFEAT_XP, and both reach
      // level 2 - the screens that follow teach equipment and skills, and a player
      // who bounced off wave five still has to be given something to equip and a
      // point to spend. This used to fire on `trainingWon` only, so a defeat ended
      // the run with the debrief and no dog tag at all.
      // However the training contract ends - abandoned, bunker lost, or the boss
      // down - the field coaching ends with it. Reported: the SHOW TASK pill
      // outlived a lost or abandoned tutorial and floated over the Command
      // Center (Game, Skills and Armory alike) with nothing left to recall.
      if(activeTraining&&state.ended&&!trainingDone&&state.endReason==='retired'){
       trainingDone=true;coach.stop();
      }
      if(activeTraining&&state.ended&&!trainingDone&&!state.endReason?.startsWith('training')){
       trainingDone=true;trainingBonusPaid=true;coach.complete();
       const xp=FIRST_RUN_DEFEAT_XP;
       // A replay pays nothing: the first run can be restarted from Settings, and a
       // reward that can be farmed by restarting the tutorial is not a reward.
       if(trainingRewards)Promise.resolve(account.awardXP(xp,Math.max(1,state.completedWave||1))).catch(()=>{});
       notice(()=>tr(trainingRewards?'Run over. {xp} XP for the attempt - the dog tag is yours anyway.':'Run over. This replay pays no XP - the first run already did.',{xp}));
      }
      if(activeTraining&&!state.ended&&trainingWon(state)&&!trainingDone){
       trainingDone=true;state.ended=true;state.running=false;state.endReason='training-complete';
       coach.complete();
       // The five waves pay 250 XP; the contract tops that up to 450 so the first
       // skill point is guaranteed with headroom. Credited once, with the last wave.
       const bonus=trainingBonusXP();
       if(trainingRewards&&bonus>0&&state.completedWave>=TRAINING_WAVES&&!trainingBonusPaid)Promise.resolve(account.awardXP(bonus,state.completedWave)).catch(()=>{});
       trainingBonusPaid=true;
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
       if(outcome){notice(()=>translateStoryDetail(outcome.message,tr));if(outcome.type==='stage')storyStageCard();if(outcome.type==='victory'){const target=report;target.storyMessage=outcome.message;target.campaign=activeMission;target.campaignSaved=null;target.pending++;finishReport(target,state,me(),false);showCinematic(activeMission,'ending',()=>{if(lastReport===target&&state===target.snapshot&&target.accountId===account.getUserId()){renderResults(target);if(!$('runResults').open)$('runResults').showModal();}});Promise.resolve(account.saveCampaign(activeMission.id)).then(result=>{target.pending--;target.campaignSaved=!!result?.committed&&campaignProgress(result.profile)>=CAMPAIGN.indexOf(target.campaign)+1;target.campaignReason=result?.reason||null;if(result?.profile){target.profile=result.profile;target.storyConfirmed=campaignProgress(result.profile);const finishedAct=actOf(target.campaign);if(finishedAct&&campaignProgress(result.profile)===actEndIndex(finishedAct)+1&&RELICS[finishedAct.relic])notice(tr('RELIC EARNED: {name}',{name:tr(RELICS[finishedAct.relic].name)}));}if(lastReport===target&&$('runResults').open)renderResults(target);renderCampaign();}).catch(()=>{target.pending--;target.campaignSaved=false;if(lastReport===target&&$('runResults').open)renderResults(target);});}else if(outcome.type==='failure'){report.storyMessage=outcome.message;sound.play('defeat');}}}
      if(state.ended){accumulator=0;updateUI();break;}
    }
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
    if(shakeAge>=0&&shakeAge<1&&!reducedMotion){const amp=4.5*(1-shakeAge);ctx.translate(amp*Math.sin(shakeAge*47),amp*Math.cos(shakeAge*39));}const visual=coop&&coopReady&&lastSnapshotAt?projectCoopMotion(state,(performance.now()-lastSnapshotAt)/1000*(state.speed===2?2:1)):state;
    // The first-run coach is NOT part of this list, by design: its card is a hint
    // over a live battlefield, and adding it here is what made the first run
    // unplayable on a phone.
    const paused=!!coop&&!coopReady||!coop&&(focusPause.isSoloPaused()||commandMenuOpen||missionBoardOpen||!!cinematic||!menu.hidden||tutorial.isOpen()||$('gameConfirm').open||!account.isReady())||state.ended;const poses=soldierMotion.sample(visual.players,performance.now()/1000,{reducedMotion,paused});
    function drawOwn(){drawCartoonBattle(ctx,visual,{path,pads,theme,types,me:me(),getTowerRange,effects:combatFx.active(),reducedMotion,soldierPoses:poses,storyMission:!coop?activeMission:null,storyStage:!coop&&!state.ended?activeMission?.stages[activeStory?.stage]:null,renderScale:renderScale*(battleViewport?.getViewport().scale||1),storyTime:performance.now()/1000,shotAge:coop&&lastSnapshotAt?Math.max(0,(performance.now()-lastSnapshotAt)/1000):0,artVersion,onSpritesReady,deco:map.deco,zones:map.zones,paths:map.paths,width:map.width,height:map.height,bunkerPosition:map.bunker,torches:map.torches,groundSeed:groundSeedOf(state.mapId)});

    if(activeStory&&!coop&&!state.ended){const objective=storyStatus(activeStory,state),point=objective.marker;if(point){ctx.save();ctx.beginPath();ctx.arc(point.x,point.y,36+(reducedMotion?0:2*Math.sin(performance.now()/400)),0,Math.PI*2);ctx.strokeStyle='#152118';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#b8d6c8';ctx.lineWidth=4;ctx.setLineDash([8,5]);ctx.lineDashOffset=reducedMotion?0:-performance.now()/120;ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#14221b';ctx.fillRect(point.x-48,point.y-61,96,20);ctx.fillStyle='#d8e9da';ctx.textAlign='center';ctx.font='bold 12px sans-serif';ctx.fillText(tr(point.type==='protect'?'PROTECT':'OBJECTIVE'),point.x,point.y-47);if(point.type==='protect'){ctx.fillStyle='#1c2b20';ctx.fillRect(point.x-25,point.y+43,50,7);ctx.fillStyle=activeStory.assetHealth<30?'#f28f73':'#b6dd8b';ctx.fillRect(point.x-24,point.y+44,48*Math.max(0,activeStory.assetHealth)/100,5);}ctx.restore();}}

    if(activeStory&&!coop&&!state.ended&&activeStory.mission.stages[activeStory.stage]?.type==='escort'){const hero=visual.players.local;if(hero){ctx.save();for(const offset of [-14,14]){ctx.beginPath();ctx.arc(hero.x+offset,hero.y+25,7,0,Math.PI*2);ctx.fillStyle='#bce6f1';ctx.fill();ctx.strokeStyle='#263c35';ctx.lineWidth=2;ctx.stroke();}ctx.restore();}}

    // Subtle corner brackets keep the selected pad visible over any terrain.
    const markerPad=menuPad??state.selectedPad;
    if(markerPad!==null&&!state.ended){const p=pads[markerPad];if(p){
      ctx.save();ctx.beginPath();for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ctx.moveTo(p.x+sx*32,p.y+sy*21);ctx.lineTo(p.x+sx*32,p.y+sy*28);ctx.lineTo(p.x+sx*24,p.y+sy*28);}
      ctx.lineJoin='round';ctx.strokeStyle='#172721';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#bad8ca';ctx.lineWidth=2;ctx.stroke();ctx.restore();
    }}
    }
    if(battleViewport)drawInBattleViewport(ctx,battleViewport.getViewport(),drawOwn);else drawOwn();
    if(state.mode==='versus'&&state.rival){ctx.save();ctx.fillStyle='#344b36';ctx.fillRect(0,540,960,20);ctx.fillStyle='#f1e7c4';ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr('{name} · OPPONENT BATTLEFIELD',{name:state.players[state.rivalId]?.name||tr('OPPONENT')}),480,555);ctx.translate(0,560);const rival=coopReady&&lastSnapshotAt?projectCoopMotion(state.rival,(performance.now()-lastSnapshotAt)/1000*(state.speed===2?2:1)):state.rival;drawCartoonBattle(ctx,rival,{path,pads,theme,types,me:state.rivalId,getTowerRange,effects:[],reducedMotion,soldierPoses:rivalMotion.sample(rival.players,performance.now()/1000,{reducedMotion,paused:!coopReady||state.ended}),renderScale,storyTime:performance.now()/1000,shotAge:coop&&lastSnapshotAt?Math.max(0,(performance.now()-lastSnapshotAt)/1000):0,deco:map.deco,zones:map.zones,paths:map.paths,width:map.width,height:map.height,bunkerPosition:map.bunker,torches:map.torches,groundSeed:groundSeedOf(state.mapId)});ctx.restore();}
  }
  $('coopControls').hidden=!coopUrl;
  function leaveCoop(){$('gameWorkspace').dataset.onlineReady='false';if(!coop)return Promise.resolve();const old=coop;coop=null;coopReady=false;coopHasBaseline=false;needStop=false;orphanReleases.clear();coopInput.setEnabled(false);coopInput=null;const stopping=old.stop();keys.clear();lastDirection='0,0';$('coopToggle').textContent=tr('JOIN CO-OP (TEST)');$('coopStatus').textContent=tr('SOLO');if(account.isReady())reset(true);return Promise.resolve(stopping);}
  function confirmParty(){return !(state.wave>0||state.towers.length)||confirmAction({title:'Leave solo operation?',text:'Joining co-op will end the current solo run.',accept:'JOIN CO-OP'});}
  function beginCoop(factory,onUpdate=()=>{},reportId=null){
    if(coop||!account.isReady())return false;
    $('gameWorkspace').dataset.onlineReady='false';$('onlineConnecting').textContent=tr('Connecting to the multiplayer battlefield…');hostFocusPaused=false;
    activeMission=null;activeStory=null;selectedMap=nextMapId(selectedMap);hasCoopSnapshot=false;report=newReport(reportId||'test');coopReports.set(report.id,report);
    closeMenu();keys.clear();lastDirection='0,0';seenCoopWaves=0;seenCoopCaches=0;coopHasBaseline=false;combatFx.clear();soldierMotion.reset();rivalMotion.reset();lastSnapshotAt=0;let client;
    try{
      client=factory({onState:value=>{if(coop!==client)return;$('coopStatus').textContent=value.toUpperCase();onUpdate(value);if(value==='error'||value==='duplicate')$('onlineConnecting').textContent=tr(value==='error'?'Multiplayer connection failed. Open Party to leave or retry.':'This party is already open in another tab. Close it and retry.');if(value==='error')notice('Multiplayer connection failed. If the host reloaded, use Resume as Host in a recovery trial; otherwise create a new party.');if(value==='duplicate')notice('This party is already open in another tab. Close it before joining here.');},onStatus:ready=>{if(coop!==client)return;coopReady=ready;coopInput.setEnabled(ready);if(!ready){closeMenu();state.selectedPad=null;if($('towerDetails').open)$('towerDetails').close();combatFx.clear();bossSignal=null;coopHasBaseline=false;needStop=true;keys.clear();lastDirection='0,0';if(!state.ended)notice(state.mode==='versus'?'1 vs 1 paused. Waiting for both players to reconnect.':state.mode==='two-vs-two'?'2 vs 2 paused. Waiting for all players to reconnect.':'Co-op connection interrupted. Waiting to reconnect.');}else if(needStop){needStop=false;sound.play('reconnect');coopInput.direction({type:'direction',x:0,y:0});}if(ready)reconcileOrphanReservations();updateUI();},onSnapshot:snapshot=>{if(coop!==client)return;if(snapshot?.match?.mode==='four-coop'||snapshot?.match?.mode==='two-vs-two'){try{snapshot=projectFourGameView(snapshot,me());}catch{notice('Invalid four-player match snapshot.');return;}}const wasHostPaused=hostFocusPaused;hostFocusPaused=snapshot.hostPaused===true;if(hostFocusPaused&&!wasHostPaused)notice('Match paused: the host left the game window.');else if(wasHostPaused&&!hostFocusPaused)notice(coopReady?'Host returned. The match has resumed.':'Host returned. Waiting for players to reconnect.');hasCoopSnapshot=true;$('gameWorkspace').dataset.onlineReady='true';const wasEnded=state.ended,oldWave=state.wave,wasRunning=state.running,oldPendingWave=state.pendingWave||0,wasIceBroken=!!state.iceBroken,wasRubbleCleared=!!state.rubbleCleared,oldBoss=state.enemies.find(e=>e.boss&&e.hp>0),oldImpact=state.bunkerImpact?.seq||0,hadSnapshot=coopReady&&coopHasBaseline,selectedPad=state.selectedPad;if(coopReady){for(const cue of combatFx.observe(snapshot.match,getMap(snapshot.match.mapId).pads))sound.play(cue);}else combatFx.clear();lastSnapshotAt=performance.now();state={...snapshot.match,selectedPad,speed:snapshot.speedControl?.speed===2?2:1,speedRequest:snapshot.speedControl?.request||null};if(coopReady)coopHasBaseline=true;if(hadSnapshot&&state.running&&state.wave!==oldWave)sound.play(state.wave%5===0?'boss':'wave');
      if(hadSnapshot&&(state.bunkerImpact?.seq||0)>oldImpact){const hit=state.bunkerImpact;notice(()=>tr('{enemy} hit the bunker! −{damage} health.',{enemy:tr(ENEMY_TYPES[hit.kind]?.label||'Enemy'),damage:Math.round(hit.damage*10)/10}));}
      const newBoss=state.enemies.find(e=>e.boss&&e.hp>0);
      if(hadSnapshot&&coopReady&&(newBoss?.boss==='bossBomber'||newBoss?.boss==='bossZugsmeister')&&newBoss.bossFlash>0&&oldBoss?.boss===newBoss.boss&&!(oldBoss.bossFlash>0)){sound.play('impact');notice(newBoss.boss==='bossZugsmeister'?'Rail guns struck the bunker!':'Bomber struck the bunker!');}
      if(hadSnapshot&&!oldPendingWave&&state.pendingWave){if(state.hostId!==me())sound.play('request');notice(state.hostId===me()?'Waiting for teammate approval.':tr('Host requests wave {wave}. Approve when ready.',{wave:state.pendingWave}));}
      if(hadSnapshot&&oldPendingWave&&!state.pendingWave&&!state.running&&!state.ended)notice('Wave request cancelled, declined or teammate disconnected.');
      if(hadSnapshot&&!wasRubbleCleared&&state.rubbleCleared){sound.play('impact');notice('Rubble cleared! Long-range shots are no longer weakened in that zone.');}
      if(hadSnapshot&&!wasIceBroken&&state.iceBroken){sound.play('ice');notice('Thin ice broke! Tanks slow down and take more damage.');}
      if(hadSnapshot&&wasRunning&&!state.running&&!state.ended){sound.play('clear');notice(state.pendingPerk?'Boss wave cleared! Choose a shared field upgrade.':'Wave cleared. Prepare for the next wave.');}
      if(hadSnapshot&&!wasEnded&&state.ended&&state.mode==='versus'){sound.play(state.winnerId===me()?'clear':'defeat');notice(state.winnerId?(state.winnerId===me()?'Victory! Your bunker survived.':'Defeat. Your opponent survived.'):'Both bunkers fell: draw.');}else if(hadSnapshot&&!wasEnded&&state.ended&&state.endReason!=='retired'){sound.play('defeat');notice('Bunker lost.');}
      if(state.ended&&!wasEnded&&state.endReason==='retired'){keys.clear();closeMenu();state.selectedPad=null;if($('towerDetails').open)$('towerDetails').close();notice('Shared run ended. Completed-wave rewards are kept. Close the party to start a new run.');}const completed=state.players[me()]?.completedWaveMask||0,caches=state.players[me()]?.lootCaches||0;if(caches>seenCoopCaches)notice('Supply cache found! Supplies added to your balance.');seenCoopCaches=caches;if(completed&~seenCoopWaves)notice('Wave completed! Saving co-op XP and loot…');seenCoopWaves|=completed;refreshTowerMenu();reconcileOrphanReservations();updateUI();},onEvents:events=>{if(coop!==client)return;for(const event of events){if(event.type==='bunkerHit')notice(()=>tr('{enemy} reached the bunker! −{damage} health.',{enemy:tr(ENEMY_TYPES[event.kind].label),damage:Math.round(event.damage*10)/10}));
        else if(event.type==='lootDrop')notice(()=>tr('Supply cache found! +{count} supplies.',{count:event.supplies}));else if(event.type==='iceBroken'){sound.play('ice');notice('Thin ice broke! Tanks slow down and take more damage.');}else if(event.type==='defeat'){sound.play('defeat');notice('Bunker lost.');}else if(event.type==='waveCleared'){if(!activeMission)account.recordScore?.('solo',event.wave);sound.play('clear');notice(event.wave%5===0?'Boss wave cleared! Choose a shared field upgrade.':'Wave cleared. Prepare for the next wave.');}}}});
      coop=client;coopInput=createCoopInput(client,message=>notice(message));coopReady=false;$('coopToggle').textContent=tr('LEAVE CO-OP');$('coopStatus').textContent=tr('CONNECTING');client.setFocusPaused?.(focusPause.isSoloPaused());client.start();updateUI();return true;
    }catch{if(coop===client)void leaveCoop();notice('Co-op could not be started.');return false;}
  }
  $('coopToggle').onclick=async()=>{if(coop){void leaveCoop();notice('Returned to solo.');return;}if(await confirmParty()&&account.isReady()&&!coop)beginCoop(callbacks=>clientFactory({url:coopUrl,getToken:()=>account.getToken(),...callbacks}));};
  account.onSessionChange(()=>{closeCinematic(false);missionBoardOpen=false;lastReport=null;coopReports.clear();$('viewResults').hidden=true;if($('runResults').open)$('runResults').close();leaveCoop();if($('towerDetails').open)$('towerDetails').close();closeMenu();tutorial.stop();keys.clear();if(account.isReady()){activeMission=null;$('campaignSelect').value='free';// The first-run tutorial is started by the account once a soldier exists.
  reset();if(!deferTutorial)tutorial.startIfNeeded(account.getUserId());}});
  // The first-run tutorial is started by the account once a soldier exists.
  reset();if(!deferTutorial)tutorial.startIfNeeded(account.getUserId());let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
  function setMenuOpen(open){commandMenuOpen=!!open;keys.clear();sendDirection();accumulator=0;}
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
  function startFirstRun(){
   const id=account.getUserId();
   if(!id)return false;
   if(!trainingSeen(id,tutorialStorage)){
    markTrainingSeen(id,tutorialStorage);
    return startTrainingRun();
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
   if(activeTraining&&!restart)return false;
   trainingRewards=rewards!==false;
   closeMenu();keys.clear();sendDirection();activeMission=null;activeStory=null;activeTraining=true;trainingDone=false;trainingBonusPaid=false;selectedMap=TRAINING_MAP;reset();onResumeBattle();
   notice(()=>tr('Training contract: five waves, boss in the last one. Enemies are weakened and your bunker is reinforced.'));
   // The welcome card waits for a field that is actually drawn: the card has no
   // meaning over an empty canvas, and the player must see the pads it points at.
   const id=account.getUserId();
   if(id&&!coachSeen(id,tutorialStorage)){
    const start=()=>coach.start(id);
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>requestAnimationFrame(start));
    else start();
   }
   return true;
  }
  async function chooseEndless(){const previous=activeMission?.id||'free';$('campaignSelect').value='free';renderCampaign();const loaded=await $('campaignLoad').onclick();if(!loaded){$('campaignSelect').value=previous;renderCampaign();}return loaded;}
  return {refreshLanguage:()=>{if(state)updateUI();if(lastNotice)$('message').textContent=lastNotice();tutorial.refreshLanguage?.();coach.refreshLanguage?.();renderViewportLabels();paintSound();$('soundToggle').textContent=tr(soundEnabled?'SOUND: ON':'SOUND: OFF');if(!menu.hidden&&menuPad!==null&&towerKey(state.towers.find(t=>t.pad===menuPad))===menuTowerKey){showMenu(menuPad,menuMode,true);refreshDetails();}if(cinematic)renderCinematic();if(radioTime>0&&storyRadioSource)storyRadio(storyRadioSource,true,storyRadioCard);if(lastReport&&$('runResults').open)renderResults(lastReport);},recordCoopReward,getMapId:()=>selectedMap,canEditSkills:()=>!coop&&((state.wave===0&&state.towers.length===0)||state.ended),resetSkills:reset,confirmParty,beginCoop,leaveCoop,setMenuOpen,chooseStory,chooseEndless,// "Field tutorial" from the Command Center and "Replay coaching" from the field
   // menu both need the SAME thing: the seven cards on the live field. They used to
   // get the retired 11-step modal tour instead, so an account that dismissed the
   // coach had no way back to it at all - the cards are a "seen it" marker.
   showTutorial:()=>{closeMenu();keys.clear();sendDirection();
    if(state&&!state.ended){coach.replay(account.getUserId());updateUI();return;}
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
  // Deliberately NOT cleared: the ending marker (dog tag, equip, skills, workshop).
  // Those steps write to the real profile - replaying them would hand out a second
  // dog tag and a second free point, so a replay teaches the field, not the economy.
  replayFirstRun:()=>{
   const id=account.getUserId();
   if(!id)return false;
   forgetTrainingSeen(id,tutorialStorage);
   coach.reset?.(id);
   closeMenu();keys.clear();sendDirection();
   return startTrainingRun({rewards:false,restart:true});
  },
  // The Settings dialog owns the controls, the game owns the effects. These two hooks
  // are the whole contract: no second copy of "is the sound on" or "are effects off"
  // exists outside this closure.
  setSoundEnabled:async value=>{soundEnabled=await sound.setEnabled(!!value);paintSound();return soundEnabled;},
  isSoundEnabled:()=>soundEnabled,
  setVolume:value=>{sound.setVolume(value);return sound.getVolume();},
  setReducedGraphics:applyGraphics,
  isReducedGraphics:()=>reducedMotion,
   // The training contract is a real deployment, not a mock: six weakened waves
   // that pay level 2. Called once by the account after the first-run tutorial.
   startTrainingRun,
  // The coach owns its own card; these let other modules (account.js) drive it.
  startCoach:id=>coach.start(id),stopCoach:()=>coach.stop(),isCoachOpen:()=>coach.isOpen(),replayCoach:()=>coach.replay(account.getUserId()),
   isTrainingRun:()=>activeTraining,getTrainingXP:trainingXP,
   getSoloMode:()=>activeTraining?'training':activeMission?'campaign':'endless',getRunSummary:()=>!state.ended&&(state.wave>0||state.towers.length||activeMission)?tr(activeTraining?'TRAINING CONTRACT':activeMission?.title||'ENDLESS'):null,isOnlineMatch:()=>!!coop};
}
