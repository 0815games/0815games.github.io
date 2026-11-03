import {cinematicFrames,cinematicScene} from './story-cinematics.mjs?v=20261103-cinematic2';
import {CAMPAIGN,campaignProgress,campaignMission,campaignAvailable} from './campaign.mjs?v=20261103-cinematic1';
import {createStoryMission,storyStatus,stepStory} from './story-mission.mjs?v=20261103-cinematic1';
import {projectFourGameView} from './four-game-view.mjs?v=20261103-online1';
import {createBattleViewportController} from './battle-viewport-controller.mjs?v=20261102-fourviewport2';
import {drawInBattleViewport} from './battle-viewport.mjs?v=20261102-fourviewport2';
import {waveRewardSummary,nextSteps} from './run-results.mjs?v=20261102-results1';
import {projectCoopMotion} from './coop-motion.mjs?v=20261102-fourbase2';
import {bossPhaseLabel,bossTelegraph} from './boss-mechanics.mjs?v=20261102-battle2';
import {createBattleSound} from './battle-sound.mjs?v=20261102-battle2';
import {RUN_PERKS,perkOffers} from './run-perks.mjs?v=20261102-terrain4';
import {TERRAIN_BRIEFINGS,terrainFor} from './terrain.mjs?v=20261102-terrain4';
import {getMap,createRandomMapId} from './maps.mjs?v=20261102-fourbase1';
import {createCombatEffects} from './combat-fx.mjs?v=20261102-battle2';
import {drawCartoonBattle} from './cartoon-art.mjs?v=20261103-storymaps1';
import {abilityName} from './skills.mjs?v=20261102-results1';
import { COOP_SERVER_URL } from './coop-config.mjs?v=20261031-coopui1';
import { createCoopClient } from './coop-client.mjs?v=20261031-coopui1';
import { createCoopInput } from './coop-input.mjs?v=20261031-coopui1';
import { createTutorial } from './tutorial.mjs?v=20261102-planner1';
import { createMatch, stepMatch, getTowerRange, STEP } from './simulation.mjs?v=20261102-fourbase1';
import { createPlayer, applyCommand, towerRefund, getSupplies, TOWER_COSTS } from './match.mjs?v=20261102-fourbase1';
import { ENEMY_TYPES, BOSSES,waveFormation,bossForWave,countFieldThreats } from './combat.mjs?v=20261102-battle2';
import { MAX_TOWER_LEVEL, upgradeCost } from './progression.mjs?v=20261102-terrain4';
export function startGame(account, {coopUrl=COOP_SERVER_URL, clientFactory=createCoopClient, confirmAction=async()=>false, leaveParty=null, nextMapId=createRandomMapId, experimentalFourViewport=false,deferTutorial=false}={}) {
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sound=createBattleSound(window.AudioContext||window.webkitAudioContext);let soundEnabled=false;
  $('soundToggle').onclick=async()=>{soundEnabled=await sound.setEnabled(!soundEnabled);$('soundToggle').textContent=soundEnabled?'SOUND: ON':'SOUND: OFF';$('soundToggle').setAttribute('aria-pressed',String(soundEnabled));if(soundEnabled)sound.play('clear');};
  const combatFx=createCombatEffects({reducedMotion});let lastSnapshotAt=0;
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
  let state, selectedMap=nextMapId(), activeMission=null, activeStory=null, accumulator=0, menuPad=null, coop=null, coopInput=null, coopReady=false, lastDirection='0,0', needStop=false,seenCoopWaves=0,seenCoopCaches=0,coopHasBaseline=false,bossSignal=null;
  let cinematic=null,radioTime=0,commandMenuOpen=false;
  function closeCinematic(continueScene=true){if(!cinematic)return;const callback=cinematic.done;cinematic=null;if($('storyCinematic').open)$('storyCinematic').close();keys.clear();accumulator=0;if(continueScene&&callback)callback();}
  function showCinematic(mission,kind,done=null,finishLabel=null){
    const frames=cinematicFrames(mission,kind);if(!frames.length){if(done)done();return;}closeCinematic(false);keys.clear();sendDirection();accumulator=0;cinematic={mission,kind,frames,index:0,done,finishLabel};const scene=cinematicScene(mission,kind);$('storyCinematic').dataset.location=scene?.art||'valley';$('storyCinematic').dataset.weather=scene?.weather||'mist';$('cinematicLocation').textContent=scene?.place||'';$('storyCinematic').dataset.act=mission.act.includes('ACT III')?'3':mission.act.includes('ACT II')?'2':'1';renderCinematic();$('storyCinematic').showModal();
  }
  function renderCinematic(){const {mission,kind,frames,index,finishLabel}=cinematic,frame=frames[index];$('cinematicProgress').max=frames.length;$('cinematicProgress').value=index+1;$('cinematicAct').textContent=`${mission.act} / ${kind==='intro'?'BRIEFING':'DEBRIEF'} · ${cinematicScene(mission,kind)?.place||''}`;$('cinematicCount').textContent=`${index+1} / ${frames.length}`;$('cinematicTitle').textContent=mission.title;$('cinematicSpeaker').textContent=frame.speaker==='NARRATOR'?'FIELD REPORT':frame.speaker;$('cinematicText').textContent=frame.text;$('cinematicInitial').textContent=frame.speaker==='NARRATOR'?'◆':frame.speaker[0];$('storyCinematic').dataset.speaker=frame.speaker.toLowerCase();$('cinematicPrevious').disabled=index===0;$('cinematicNext').textContent=index===frames.length-1?(finishLabel||(kind==='intro'?'DEPLOY':'VIEW RESULTS')):'NEXT →';}
  $('cinematicPrevious').onclick=()=>{if(cinematic&&cinematic.index>0){cinematic.index--;renderCinematic();}};
  $('cinematicNext').onclick=()=>{if(!cinematic)return;if(cinematic.index+1<cinematic.frames.length){cinematic.index++;renderCinematic();}else closeCinematic();};
  $('cinematicSkip').onclick=()=>closeCinematic();$('storyCinematic').addEventListener('cancel',e=>{e.preventDefault();closeCinematic();});
  const me=()=>coop?account.getUserId():'local';
  let report=null,lastReport=null,hasCoopSnapshot=false;const coopReports=new Map();
  function newReport(id=null){return {id,mode:id?'coop':'solo',xp:0,scrap:0,items:[],levels:0,unlocks:[],pending:0,failed:false,confirmedEarlier:false,finished:false,snapshot:null,playerId:null};}
  function addReward(target,detail){if(!target||!detail?.delta)return;const d=detail.delta;target.xp+=d.xp;target.scrap+=d.scrap;target.levels+=d.levels;target.items.push(...d.items);target.unlocks.push(...(d.unlocks||[]));if(!target.profile||(detail.profile?.xp||0)>=(target.profile.xp||0))target.profile=detail.profile;}
  function recordCoopReward(id,status,detail,block=0){const target=coopReports.get(id);if(!target)return;const errors=target.errors||(target.errors=new Set());if(status==='saved'){addReward(target,detail);errors.delete(block);}else if(status==='error')errors.add(block);else if(status==='confirmed'){target.confirmedEarlier=true;errors.delete(block);}target.failed=errors.size>0;if(lastReport===target&&$('runResults').open)renderResults(target);}
  const storyProfile=target=>({...account.getProfile(),storyProgress:Math.max(campaignProgress(account.getProfile()),campaignProgress(target?.profile),target?.storyConfirmed||0)});
  function renderResults(target){
    const snapshot=target.snapshot;if(!snapshot)return;const waves=waveRewardSummary(snapshot,target.playerId),p=snapshot.players?.[target.playerId],damage=p?.towerDamage||[],combos=Object.entries(p?.comboCounts||{}).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
    $('resultsTitle').textContent=snapshot.fourInfo?.mode==='two-vs-two'?(snapshot.fourInfo.winnerTeam===null?'Match ended in a draw':snapshot.fourInfo.winnerTeam===snapshot.fourInfo.team?'Victory!':'Defeat'):snapshot.mode==='versus'?(snapshot.winnerId?(snapshot.winnerId===target.playerId?'Victory!':'Defeat'):'Match ended'):(target.left?'You left the operation':snapshot.endReason==='retired'?'Operation ended':snapshot.endReason==='campaign-victory'?'Mission complete!':snapshot.endReason==='story-failure'?'Mission failed':'Bunker lost');
    $('resultsOutcome').textContent=snapshot.fourInfo?.mode==='two-vs-two'?'2 VS 2 · SURVIVAL':snapshot.fourInfo?.mode==='four-coop'?'FOUR-PLAYER CO-OP':snapshot.mode==='versus'?'1 VS 1 · SURVIVAL':target.mode==='coop'?'CO-OP OPERATION':target.soloMission?`CAMPAIGN · ${target.soloMission.title.toUpperCase()}`:'SOLO OPERATION';
    $('resultsWaves').textContent=`${waves.count} wave${waves.count===1?'':'s'} completed · reached wave ${snapshot.wave||0}\nWave reward value: ${waves.xp} XP\n${snapshot.lootKills||0} enemies defeated ${target.mode==='coop'&&snapshot.mode!=='versus'?'(team)':''}`;
    $('resultsRewards').textContent=`Confirmed during this session: +${target.xp} XP · +${target.scrap} scrap${target.items.length?'\nNew equipment: '+target.items.join(', '):''}`;
    $('storyReplayEnding').hidden=!target.campaign||snapshot.endReason!=='campaign-victory';$('resultsStory').hidden=!target.storyMessage;if(target.storyMessage)$('resultsStory').textContent=target.storyMessage;
    $('resultsCampaign').hidden=!target.campaign;$('campaignRetry').hidden=!target.campaign||target.campaignSaved!==false;
    if(target.campaign)$('resultsCampaign').textContent=target.campaignSaved===true?'Mission progress saved.':target.campaignSaved===false?'Mission progress could not be confirmed. Retry saving before leaving.':'Saving mission progress…';
    $('resultsSave').textContent=target.failed?'Some rewards could not be confirmed. Check your connection and save status.':target.pending?'Saving rewards…':target.disconnected?'This uses the last received snapshot. Reconnect to confirm any missing rewards.':target.confirmedEarlier?'Some earlier rewards were already saved before this report; they are not counted twice.':target.mode==='coop'?'Rewards may still be saving or may have been saved before reconnecting.':'Only confirmed saves are counted above.';
    $('resultsDamage').textContent=damage.some(n=>n>0)?damage.map((n,i)=>`${types[i].name}: ${Math.round(n||0)}`).join(' · '):'No tower damage recorded.';
    $('resultsCombos').textContent=combos.length?'Skill activity: '+combos.map(([name,n])=>`${name} ×${n}`).join(' · '):'No skill combos or capstones activated.';
    $('resultsUnlocks').textContent=(target.levels?`${target.levels} level${target.levels===1?'':'s'} gained · ${target.levels} new skill point${target.levels===1?'':'s'}.`:'No new level confirmed during this session.')+(target.unlocks.length?'\nNew upgrades: '+target.unlocks.join(' · '):'');
    $('resultsNext').textContent=nextSteps(target.profile||account.getProfile());
    const mission=target.soloMission,index=CAMPAIGN.indexOf(mission),next=CAMPAIGN[index+1],eligible=!!mission&&target.mode==='solo'&&!coop&&state===snapshot&&state.ended&&target.accountId===account.getUserId()&&(typeof account.canChooseSolo!=='function'||account.canChooseSolo());
    const safe=eligible&&!target.pending&&(!target.campaign||target.campaignSaved===true);
    $('resultsReplayMission').hidden=!eligible;$('resultsReplayMission').disabled=!safe;
    $('resultsNextMission').hidden=!eligible||!next||!target.campaign;$('resultsNextMission').disabled=!safe||!next||!campaignAvailable(storyProfile(target),next.id);
    if(next)$('resultsNextMission').textContent=`NEXT: ${next.title.toUpperCase()}`;

  }
  function finishReport(target,snapshot,id,open=true){if(!target||!snapshot)return;target.finished=true;closeMenu();keys.clear();if($('towerDetails').open)$('towerDetails').close();target.snapshot=snapshot;target.playerId=id;lastReport=target;$('viewResults').hidden=false;renderResults(target);if(open&&!$('runResults').open)$('runResults').showModal();}
  $('campaignRetry').onclick=async()=>{const target=lastReport;if(!target?.campaign||target.campaignSaved!==false||target.accountId!==account.getUserId()||typeof account.saveCampaign!=='function')return;target.campaignSaved=null;renderResults(target);const result=await account.saveCampaign(target.campaign.id);target.campaignSaved=!!result?.committed&&campaignProgress(result.profile)>=CAMPAIGN.indexOf(target.campaign)+1;if(result?.profile){target.profile=result.profile;target.storyConfirmed=campaignProgress(result.profile);}if(lastReport===target&&$('runResults').open)renderResults(target);renderCampaign();};
  function loadResultMission(next=false){
    const target=lastReport,mission=target?.soloMission,index=CAMPAIGN.indexOf(mission),destination=next?CAMPAIGN[index+1]:mission;
    if(!target||!mission||!destination||target.mode!=='solo'||coop||state!==target.snapshot||!state.ended||target.accountId!==account.getUserId()||target.pending||(target.campaign&&target.campaignSaved!==true)||(next&&!target.campaign)||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo())||!campaignAvailable(storyProfile(target),destination.id))return;
    activeMission=destination;selectedMap=destination.mapId;$('campaignSelect').value=destination.id;reset();notice(destination.stages[0].dialogue);showCinematic(destination,'intro');
  }
  $('storyReplayEnding').onclick=()=>{const target=lastReport;if(!target?.campaign||target.snapshot?.endReason!=='campaign-victory')return;$('runResults').close();showCinematic(target.campaign,'ending',()=>{if(lastReport===target&&target.accountId===account.getUserId()){renderResults(target);$('runResults').showModal();}});};
  $('resultsReplayMission').onclick=()=>loadResultMission();$('resultsNextMission').onclick=()=>loadResultMission(true);
  $('resultsClose').onclick=$('resultsDone').onclick=()=>$('runResults').close();$('viewResults').onclick=()=>{if(lastReport){renderResults(lastReport);$('runResults').showModal();}};

  const supplies=()=>getSupplies(state,me());
  // A large, horizontally scrollable map is the default in portrait on phones.
  const mapViewport=$('mapViewport'), zoomButton=$('mapZoom');
  const portrait=window.matchMedia('(max-width: 850px) and (orientation: portrait)');
  let largeMap=portrait.matches, battleViewport=null, savedLargeMap=false;
  function setMapZoom(large){largeMap=large;mapViewport.classList.toggle('map-large',large);zoomButton.setAttribute('aria-pressed',String(large));zoomButton.textContent=large?'MAP: LARGE':'MAP: FIT';$('mapHint').textContent=large?'Swipe the map left or right to see the battlefield. Tap to build or move.':'Full map view. Tap MAP: FIT to enlarge it.';}
  setMapZoom(largeMap);
  zoomButton.addEventListener('click',()=>{if(battleViewport){const v=battleViewport.getViewport(),fit=Math.min(v.width/v.worldWidth,v.height/v.worldHeight);if(v.scale>fit+1e-8)battleViewport.reset();else battleViewport.zoom(2);return;}const middle=(mapViewport.scrollLeft+mapViewport.clientWidth/2)/mapViewport.scrollWidth;setMapZoom(!largeMap);mapViewport.scrollLeft=middle*mapViewport.scrollWidth-mapViewport.clientWidth/2;});
  $('mapEntry').addEventListener('click',()=>battleViewport?battleViewport.pan(1e6,0):mapViewport.scrollTo({left:0,behavior:'smooth'}));
  $('mapBunker').addEventListener('click',()=>battleViewport?battleViewport.pan(-1e6,0):mapViewport.scrollTo({left:mapViewport.scrollWidth,behavior:'smooth'}));
  portrait.addEventListener('change',e=>{if(!battleViewport)setMapZoom(e.matches);});
  function syncBattleViewport(map,versus){
    const wanted=experimentalFourViewport&&map.fourPlayer&&!versus;
    if(wanted&&!battleViewport){savedLargeMap=largeMap;setMapZoom(false);mapViewport.scrollLeft=0;battleViewport=createBattleViewportController({canvas,worldWidth:map.width,worldHeight:map.height,onTap:point=>selectBattlePoint(point.x,point.y),onChange:v=>{closeMenu();if(state)state.selectedPad=null;const fit=Math.min(v.width/v.worldWidth,v.height/v.worldHeight),zoomed=v.scale>fit+1e-8;zoomButton.setAttribute('aria-pressed',String(zoomed));zoomButton.textContent=zoomed?'MAP: FIT':'MAP: ZOOM';}});$('mapHint').textContent='Drag to pan, pinch or use the mouse wheel to zoom. Tap to build or move.';zoomButton.textContent='MAP: ZOOM';}
    else if(!wanted&&battleViewport){battleViewport.destroy();battleViewport=null;setMapZoom(savedLargeMap);}
  }
  $('campaignSelect').value='free';
  function renderCampaign(){
    const profile=account.getProfile(),progress=campaignProgress(profile),selection=$('campaignSelect').value,mission=campaignMission(selection);
    CAMPAIGN.forEach((m,i)=>{$(`campaignOption${i}`).disabled=i>progress;});
    const journal=progress?CAMPAIGN.slice(0,progress).map(m=>`${m.act} · ${m.title}\n${m.success}`).join('\n\n'):'No transmissions recorded yet. Start The Silent Signal to begin the story.';if($('storyJournal').textContent!==journal)$('storyJournal').textContent=journal;
    const blocked=!!coop||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo());
    $('storyReplayDebrief').hidden=!mission||CAMPAIGN.indexOf(mission)>=progress;$('storyReplayDebrief').disabled=blocked;$('storyReplayIntro').hidden=!mission;$('storyReplayIntro').disabled=blocked||!mission||!campaignAvailable(profile,mission.id);$('campaignSelect').disabled=blocked;$('campaignLoad').disabled=blocked||!!mission&&!campaignAvailable(profile,mission.id);
    $('campaignBriefing').textContent=blocked?'Leave your party before changing solo operations.':mission?`${mission.act} · ${mission.title} — ${mission.briefing}${CAMPAIGN.indexOf(mission)>0&&campaignAvailable(profile,mission.id)?` Previously: ${CAMPAIGN[CAMPAIGN.indexOf(mission)-1].success}`:''} ${campaignAvailable(profile,mission.id)?'Available.':'Complete the previous mission first.'}`:`Free play: random map and endless waves. Campaign: ${progress} / ${CAMPAIGN.length} operations complete.`;
  }
  $('campaignSelect').onchange=renderCampaign;
  $('storyReplayDebrief').onclick=()=>{const mission=campaignMission($('campaignSelect').value);if(!coop&&mission&&CAMPAIGN.indexOf(mission)<campaignProgress(account.getProfile())&&(typeof account.canChooseSolo!=='function'||account.canChooseSolo()))showCinematic(mission,'ending',null,'CLOSE');};
  $('storyReplayIntro').onclick=()=>{const mission=campaignMission($('campaignSelect').value);if(!coop&&mission&&campaignAvailable(account.getProfile(),mission.id)&&(typeof account.canChooseSolo!=='function'||account.canChooseSolo()))showCinematic(mission,'intro',null,'CLOSE');};
  $('campaignLoad').onclick=async()=>{
    if(coop||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo()))return false;
    const id=$('campaignSelect').value,mission=id==='free'?null:campaignMission(id),currentState=state,currentUser=account.getUserId();if(id!=='free'&&(!mission||!campaignAvailable(account.getProfile(),id)))return false;
    if(!state.ended&&(state.wave>0||state.towers.length)&&!await confirmAction({title:'Change operation?',text:'This ends your current solo run. Completed-wave rewards remain saved.',accept:'CHANGE OPERATION'}))return false;
    if(coop||state!==currentState||account.getUserId()!==currentUser||(typeof account.canChooseSolo==='function'&&!account.canChooseSolo())||(mission&&!campaignAvailable(account.getProfile(),id)))return false;
    activeMission=mission;selectedMap=mission?mission.mapId:nextMapId(selectedMap);reset();notice(mission?mission.stages[0].dialogue:'Free play ready.');if(mission)showCinematic(mission,'intro');return true;
  };
  function reset(freshMap=false){closeCinematic(false);radioTime=0;$('storyRadio').hidden=true;if($('runResults').open)$('runResults').close();report=newReport();report.soloMission=activeMission;report.accountId=account.getUserId();activeStory=activeMission?createStoryMission(activeMission):null;if(canvas.height!==540)canvas.height=540;if(freshMap&&!activeMission)selectedMap=nextMapId(selectedMap);combatFx.clear();lastSnapshotAt=0;bossSignal=null;state=createMatch([createPlayer('local',{...account.getProfile(),level:account.getLevel()})],selectedMap);Object.assign(state,{speed:1,selectedPad:null});accumulator=0;keys.clear();closeMenu();updateUI();}
  function dispatch(command,done){
    if(!coop){done(applyCommand(state,'local',command));return;}
    const active=coop;
    coopInput.execute(command).then(result=>{if(coop===active)done(result);});
  }
  function notice(text){$('message').textContent=text;}
  function storyRadio(text){const match=text.match(/^([A-Z]+):\s*(.*)$/);$('storyRadio').dataset.speaker=match?match[1].toLowerCase():'narrator';$('storyRadioSpeaker').textContent=match?`${match[1]} / RADIO`:'FIELD REPORT';$('storyRadioText').textContent=match?match[2]:text;$('storyRadio').hidden=false;radioTime=7;sound.play('request');}
  for(let i=0;i<3;i++)if($(`runPerk${i}`))$(`runPerk${i}`).onclick=()=>dispatch({type:'choosePerk',index:i},result=>{notice(result.ok?`${result.perk} acquired for this operation.`:result.reason);updateUI();});
  function updateUI(){
    renderCampaign();
    const showObjective=!!activeMission&&!coop;$('soloObjective').hidden=!showObjective;
    if(showObjective){const status=storyStatus(activeStory,state);$('soloObjectiveTitle').textContent=`${activeMission.act} · ${activeMission.title}`;$('soloObjectiveProgress').textContent=`OBJECTIVE ${Math.min(activeStory.stage+1,activeMission.stages.length)} / ${activeMission.stages.length}: ${status.label}`;$('soloObjectiveBar').max=status.max;$('soloObjectiveBar').value=status.progress;$('soloObjectiveHint').textContent=`${status.detail} ${status.dialogue||''}`;}
    if(state.ended&&(!coop||hasCoopSnapshot)&&report&&!report.finished)finishReport(report,state,me());else if(state.ended&&report?.finished&&report.snapshot!==state){report.snapshot=state;if(lastReport===report&&$('runResults').open)renderResults(report);}
    const map=getMap(state.mapId),terrain=terrainFor(map),versus=state.mode==='versus',teamMatch=state.fourInfo?.mode==='two-vs-two';$('battleLabel').textContent=coop?'MULTIPLAYER':activeMission?`STORY MISSION ${CAMPAIGN.indexOf(activeMission)+1}`:'FREE PLAY';$('mapName').textContent=versus?`${map.name} · 1 VS 1`:map.name;
    const canvasHeight=versus?1100:540;if(canvas.height!==canvasHeight)canvas.height=canvasHeight;syncBattleViewport(map,versus);
    $('versusStatus').hidden=!versus&&!teamMatch;if(teamMatch){const info=state.fourInfo;$('versusTitle').textContent=state.ended?(info.winnerTeam===null?'DRAW / MATCH ENDED':info.winnerTeam===info.team?'VICTORY':'DEFEAT'):`2 VS 2 · TEAM ${info.team?'B':'A'}`;$('versusInfo').textContent=`YOUR BUNKER ${Math.max(0,Math.ceil(state.hp))} · OTHER BUNKER ${Math.max(0,Math.ceil(info.otherHealth))}`;}if(versus){$('versusTitle').textContent=state.ended?(state.winnerId?(state.winnerId===me()?'VICTORY':'DEFEAT'):'DRAW / MATCH ENDED'):'1 VS 1 · SURVIVAL';$('versusInfo').textContent=`YOUR BUNKER ${Math.max(0,Math.ceil(state.hp))} · ${state.players[state.rivalId]?.name||'OPPONENT'} ${Math.max(0,Math.ceil(state.rival.hp))}${state.waitingForRival&&!state.ended?' · WAITING FOR OPPONENT':''}`;}
    if($('terrainBriefing')){$('terrainBriefing').hidden=!terrain;if(terrain&&$('terrainTitle'))$('terrainTitle').textContent=`${map.name} · Terrain effects`;if(terrain){const text=TERRAIN_BRIEFINGS[terrain]+(terrain==='urban'?(state.rubbleCleared?' Rubble is cleared.':` Rubble remaining: ${Math.max(0,Math.ceil(200-(state.rubbleDamage||0)))} / 200.`):'');if($('terrainDescription').textContent!==text)$('terrainDescription').textContent=text;}}
    if($('runPerksStatus')){const ranks=state.runPerks||{},acquired=RUN_PERKS.filter(perk=>ranks[perk.key]);$('runPerksStatus').hidden=!acquired.length;const text=acquired.map(perk=>`${perk.name} ×${ranks[perk.key]}`).join(' · ');if($('runPerksList').textContent!==text)$('runPerksList').textContent=text;}
    if($('runPerkPanel')){
      $('runPerkPanel').hidden=state.ended||!state.pendingPerk;if($('runPerkIntro'))$('runPerkIntro').textContent=state.mode==='versus'?'Choose a field upgrade for your own battlefield.':'One shared upgrade for this operation. Either player may choose.';
      if(state.pendingPerk){const offers=perkOffers(state.mapId,state.pendingPerk);for(let i=0;i<3;i++){const button=$(`runPerk${i}`),perk=RUN_PERKS[offers[i]];const content=`${perk.rare?'★ RARE · ':''}${perk.name}<small>${perk.description}</small>`;if(button.innerHTML!==content)button.innerHTML=content;button.disabled=!!coop&&!coopReady;}}
    }
    if($('bossAlert')){
      const boss=state.enemies.find(e=>e.boss&&e.hp>0),incoming=state.running&&state.wave%5===0&&state.spawnLeft>0?bossForWave(state.wave):null,info=boss?BOSSES.find(b=>b.kind===boss.boss):incoming;
      $('bossAlert').hidden=!info||state.ended;
      if(info){const signal=boss?bossTelegraph(boss):null,key=boss?`${boss.boss}:${signal?.key||'normal'}`:null;if(signal?.warning&&bossSignal?.startsWith(`${boss.boss}:`)&&bossSignal!==key){sound.play('warning');$('bossAnnouncement').textContent=`${info.label}: ${signal.text}`;}bossSignal=key;$('bossAlert').classList.toggle('is-warning',!!signal?.warning);$('bossAlertTitle').textContent=boss?`BOSS · ${info.label}`:`BOSS INCOMING · ${info.label}`;$('bossAlertInfo').textContent=signal?.text||(boss&&bossPhaseLabel(boss))||info.description;$('bossHealth').hidden=!boss;if(boss)$('bossHealthFill').style.width=`${Math.max(0,Math.min(100,100*boss.hp/boss.maxHp))}%`;}else bossSignal=null;
    }
    const threats=countFieldThreats(state.enemies);for(const [kind,id] of [['infantry','threatInfantry'],['runner','threatRunner'],['tank','threatTank'],['plane','threatPlane']])$(id).textContent=String(threats[kind]);const summary=Object.entries(threats).filter(([,n])=>n).map(([kind,n])=>`${ENEMY_TYPES[kind].label} ${n}`).join(' · ');$('threatSummary').textContent=summary||'No enemies on field';
    const preview=state.ended?(coop?'Run ended. Close the party to start a new operation.':'Run ended. Restart to play again.'):'Next: '+waveSummary(state.wave+1); if($('wavePreview').textContent!==preview)$('wavePreview').textContent=preview;
    $('wave').textContent=`${state.wave} / ∞`; $('health').textContent=Math.max(0,Math.ceil(state.hp)); $('money').textContent=supplies();if($('moneyLabel'))$('moneyLabel').textContent=coop?'YOUR SUPPLIES':'SUPPLIES'; $('enemies').textContent=state.enemies.length+state.spawnLeft;
    const player=state.players[me()]; $('speed').textContent=coop?'SPEED: 1×':`SPEED: ${state.speed}×`; const ability=abilityName(player?.skills).toUpperCase(),needsEnemies=['assault','recon'].includes(player?.skills?.active); $('ability').textContent=!player?.skills?.active?'NO SKILL':player?.cooldown>0?`${ability}: ${Math.ceil(player.cooldown)}s`:`${ability} READY`; $('ability').disabled=state.ended||!player?.skills?.active||player.cooldown>0||(needsEnemies?!state.enemies.length:!state.running)||!menu.hidden||(!!coop&&!coopReady); $('speed').disabled=!!coop||!menu.hidden;
    const guest=!!coop&&!!state.hostId&&state.hostId!==me(),host=!!coop&&state.hostId===me(),pending=!!state.pendingWave;
    $('endRun').textContent=guest?(versus?'LEAVE MATCH':'LEAVE CO-OP'):host&&(state.ended||(versus&&!coopReady))?'CLOSE PARTY':'END RUN';$('endRun').disabled=(!coop&&state.ended)||!menu.hidden||(!!coop&&!coopReady&&!guest&&!state.ended&&!versus);
    $('waveRequest').hidden=!coop||!pending||state.ended;
    if(coop&&pending){$('waveRequestText').textContent=guest?`Host requests wave ${state.pendingWave}. Approve when ready.`:state.fourInfo?`Waiting for players to approve wave ${state.pendingWave} (${state.fourInfo.approved}/${state.fourInfo.required}).`:`Waiting for your ${versus?'opponent':'teammate'} to approve wave ${state.pendingWave}.`;$('waveDecline').hidden=!guest;$('waveDecline').disabled=!coopReady;}
    $('start').textContent=state.ended?(coop?'MATCH ENDED':'RESTART OPERATION'):state.running?'WAVE IN PROGRESS':guest?(pending?'APPROVE WAVE':state.fourInfo?.waitingForOthers?'WAIT FOR PLAYERS':'WAIT FOR HOST'):host&&pending?'CANCEL REQUEST':host&&versus&&state.waitingForRival?'WAIT FOR OPPONENT':coop?(versus||Object.entries(state.players).some(([id,p])=>id!==state.hostId&&p.active!==false)?'REQUEST WAVE':'START NEXT WAVE'):state.wave===0?'DEPLOY / START WAVE':'START NEXT WAVE';
    $('start').disabled=(state.running&&!state.ended)||!!state.pendingPerk||!menu.hidden||(!!coop&&(!coopReady||state.ended||(!host&&!guest)||(guest&&!pending)||(versus&&host&&state.waitingForRival)||(teamMatch&&host&&state.fourInfo?.otherNotReady)));
  }
  function waveSummary(wave){const counts={};for(const kind of waveFormation(wave)) counts[kind]=(counts[kind]||0)+1;return `Wave ${wave}${wave%5===0?' · BOSS WAVE':''} · `+Object.entries(counts).map(([kind,n])=>`${n} ${ENEMY_TYPES[kind].label}`).join(' · ')+(bossForWave(wave)?` · ${bossForWave(wave).description}`:'');}
  $('speed').onclick=()=>{state.speed=state.speed===1?2:state.speed===2?3:1;updateUI();};
  $('start').onclick=()=>{if(state.ended){if(!coop){reset(true);notice('New battlefield ready. Deploy when ready.');}return;}if(state.running)return;if(!coop)state.players.local.level=account.getLevel();
    const command=coop&&state.pendingWave?(state.hostId===me()?'cancelWave':'approveWave'):'startWave';
    dispatch(command==='startWave'?{type:command}:{type:command,requestId:state.waveRequestId},result=>{if(!result.ok){notice(result.reason);return;}if(!coop)sound.play(state.wave%5===0?'boss':'wave');notice(!coop?`Wave ${state.wave} incoming: ${waveSummary(state.wave)}.`:command==='cancelWave'?'Wave request cancelled.':result.waitingForGuest||result.waitingForPlayers?'Waiting for player approval.':command==='approveWave'?'Wave approved.':'Wave started.');updateUI();});
  };
  $('waveDecline').onclick=()=>dispatch({type:'declineWave',requestId:state.waveRequestId},result=>{notice(result.ok?'Wave postponed. The host can request again when ready.':result.reason);updateUI();});
  $('endRun').onclick=async()=>{
    const guest=!!coop&&!!state.hostId&&state.hostId!==me(),teamMatch=state.fourInfo?.mode==='two-vs-two';
    if(coop&&(state.ended||(state.mode==='versus'&&!coopReady))&&!guest){if(typeof leaveParty==='function')await leaveParty();else await leaveCoop();return;}
    if((state.ended&&!guest)||!menu.hidden||(coop&&!coopReady&&!guest))return;
    const session=coop,soloState=state,mapId=state.mapId;
    const confirmed=await confirmAction({title:guest?(state.mode==='versus'||teamMatch?'Leave match?':'Leave co-op?'):'End this run?',text:guest?(state.mode==='versus'||teamMatch?(coopReady?(teamMatch?'Leave this match? Your team forfeits and the other team wins. Completed-wave rewards are saved.':'Leave this match? You forfeit and the host wins. Completed-wave rewards are saved.'):'Leave while disconnected? Your opponent may not receive your forfeit; reconnect first if possible.'):coopReady?'Leave this co-op party? The host keeps playing. Completed-wave rewards are saved; the current unfinished wave earns no rewards.':'Leave while disconnected? Rewards not yet received from the host may require reconnecting. The host keeps playing.'):session?'This ends the shared run for all players. Completed-wave rewards are kept; the current unfinished wave earns no rewards. Battle continues until confirmed.':'End this run now? Completed-wave rewards are kept; the current unfinished wave earns no rewards.',accept:guest?(state.mode==='versus'||teamMatch?'LEAVE MATCH':'LEAVE CO-OP'):'END RUN'});
    if(!confirmed||!account.isReady()||coop!==session||(!guest&&state.ended)||state.mapId!==mapId||(!session&&state!==soloState)||(session&&!coopReady&&!guest))return;
    if(guest){
      // The host marks the guest inactive before the final reward snapshot is
      // delivered. This prevents a wave-clear race while leaving mid-battle.
      if(coopReady&&!state.ended){const result=await new Promise(resolve=>dispatch({type:'leaveRun'},resolve));if(coop!==session)return;if(!result.ok&&!state.ended){notice(result.reason);return;}}
      const resultSnapshot=state,resultReport=report,resultId=me(),wasDisconnected=!coopReady;if(typeof leaveParty==='function'){if(!await leaveParty())return;}else await leaveCoop();resultReport.left=true;resultReport.disconnected=wasDisconnected;finishReport(resultReport,resultSnapshot,resultId);notice(teamMatch?'You left the match.':'You left co-op. The host can continue.');return;
    }
    dispatch({type:'endRun'},result=>{if(!result.ok){notice(result.reason);return;}keys.clear();notice(session?'Shared run ended. Completed-wave rewards are kept. Close the party to start a new run.':'Run ended. Completed-wave rewards are kept. Restart for a new battlefield.');updateUI();});
  };
  $('ability').onclick=()=>{const solo=!coop,player=state.players[me()],targets=solo?state.enemies.map(e=>({...e})):[];dispatch({type:'airstrike'},result=>{if(!result.ok){notice(result.reason);return;}if(solo){combatFx.emit(player?.skills?.active||'assault',player,{enemies:targets});sound.play('ability');if(result.combos?.length){combatFx.emit('combo',{x:player.comboCue.x,y:player.comboCue.y,comboLabel:result.combos.join(' + ')},state);sound.play('combo');}}notice(`${abilityName(state.players[me()]?.skills)} deployed!${result.combos?.length?' '+result.combos.join(' + ')+' combo!':''}`);updateUI();});};
  function sendDirection(){const x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),y=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(coop){const key=`${x},${y}`;if(key!==lastDirection){lastDirection=key;coopInput.direction({type:'direction',x,y});}}else applyCommand(state,'local',{type:'direction',x,y});}
  window.addEventListener('keydown', e=>{if(cinematic)return;if(!menu.hidden){if(e.key==='Escape'){closeMenu();state.selectedPad=null;updateUI();}return;}if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();keys.add(key);sendDirection();}});
  window.addEventListener('keyup', e=>{keys.delete(e.key.toLowerCase());sendDirection();});
  window.addEventListener('blur',()=>{keys.clear();sendDirection();});
  let tutorialStorage;try{tutorialStorage=window.localStorage;}catch{tutorialStorage=null;}
  const tutorial=createTutorial({document,storage:tutorialStorage});
  $('tutorialReplay').onclick=()=>{closeMenu();state.selectedPad=null;keys.clear();sendDirection();tutorial.replay(account.getUserId());updateUI();};
  const menu=$('radialMenu');
  const options=[0,1,2,3].map(i=>$('radial'+i));
  function closeMenu(){menu.hidden=true;menuPad=null;}
  function showMenu(pad,mode='actions'){
    const tower=state.towers.find(t=>t.pad===pad);menuPad=pad;state.selectedPad=tower?pad:null;
    keys.clear();sendDirection();
    const actions=[];
    if(!tower){
      types.forEach((type,i)=>actions.push({label:`${type.name} · ${type.cost}`,summary:type.description,unaffordable:supplies()<type.cost,description:`View ${type.name}, ${type.cost} supplies. ${type.description}${supplies()<type.cost?'. Not enough supplies to build.':''}`,run:()=>{
        showDetails(type.name,`${type.description}. Base damage: ${type.damage} per shot, firing interval: ${type.interval} seconds, range: ${type.range}. Damage varies by enemy type.`,type.cost,'BUILD',()=>{
          dispatch({type:'build',pad,towerType:i},result=>{if(!result.ok){$('towerDetailsCost').textContent=result.reason;return;}if($('towerDetails').open)$('towerDetails').close();if(!coop){combatFx.emit('build',getMap(state.mapId).pads[pad],state);sound.play('build');}state.selectedPad=pad;closeMenu();notice(`${type.name} built. Tap it to upgrade or sell.`);updateUI();});
        });
      }}));
      notice(`Tap a tower for details. Grey options need more supplies. ${coop?'Battle continues in co-op.':'Battle paused.'}`);
    }else if(mode==='branches'){
      const cost=upgradeCost(tower.level),sharedUpgrade=state.individualSupplies&&tower.ownerId!==me()?` You pay for this upgrade; any sale refund goes to ${state.players[tower.ownerId]?.name||'the builder'}.`:'';
      branches[tower.type].forEach((branch,i)=>{const required=i===2?5:i===3?10:0,locked=(state.players[me()]?.level||1)<required;actions.push({label:`${branch.name} · ${cost}`,summary:branch.description+(locked?` · LOCKED UNTIL LEVEL ${required}`:''),unaffordable:supplies()<cost,description:`View ${branch.name}: ${branch.description}. ${cost} supplies${locked?`. Unlocks at level ${required}.`:''}${supplies()<cost?'. Not enough supplies.':''}`,run:()=>showDetails(branch.name,`${branch.description}. Level 3 also increases the base damage multiplier before specialization and enemy modifiers. This specialization is permanent.${sharedUpgrade}`,cost,'UPGRADE',()=>upgrade(i),locked?`Unlocks at soldier level ${required}.`:'')});});
      notice(`Tap a specialization to see its effects. ${coop?'Battle continues in co-op.':'Battle paused.'}`);
    }else if(mode==='confirmSell'){
      const ownerName=state.players[tower.ownerId]?.name||'tower owner',mine=!state.individualSupplies||tower.ownerId===me();
      actions.push({label:mine?`Confirm sale · +${towerRefund(tower)}`:'Confirm sale',summary:mine?'Remove this tower and recover half of its total cost.':`Remove this tower; ${ownerName} receives ${towerRefund(tower)} supplies.`,description:mine?`Confirm sale for ${towerRefund(tower)} supplies`:`Confirm sale. ${ownerName} receives ${towerRefund(tower)} supplies`,run:()=>{dispatch({type:'sell',pad,...(coop?{expectedTowerId:tower.id,expectedLevel:tower.level}:{})},result=>{if(!result.ok){notice(result.reason);return;}state.selectedPad=null;closeMenu();notice(result.refundTo&&result.refundTo!==me()?`Tower sold. ${state.players[result.refundTo]?.name||'The owner'} receives ${result.refund} supplies.`:`Tower sold. +${result.refund} supplies.`);updateUI();});}});
      actions.push({label:'Cancel',summary:'Keep this tower.',description:'Cancel sale',run:()=>showMenu(pad)});
      notice(`Confirm sale for half the investment, or cancel. ${coop?'Battle continues in co-op.':'Battle paused.'}`);
    }else{
      const cost=upgradeCost(tower.level),max=tower.level>=MAX_TOWER_LEVEL,sharedUpgrade=state.individualSupplies&&tower.ownerId!==me()?` You pay for this upgrade; any sale refund goes to ${state.players[tower.ownerId]?.name||'the builder'}.`:'';
      actions.push({label:max?'Max level':tower.level===2?`Choose specialization · ${cost}`:`Confirm upgrade · ${cost}`,summary:max?'This tower is fully upgraded.':tower.level===2?'Choose a permanent specialization.':`Confirm purchase: +0.3 damage multiplier.${sharedUpgrade}`,disabled:max,unaffordable:!max&&supplies()<cost,description:max?'Maximum level':`View upgrade to level ${tower.level+1}, ${cost} supplies${supplies()<cost?'. Not enough supplies.':''}`,run:()=>{if(tower.level===2)showMenu(pad,'branches');else if(supplies()>=cost)upgrade(0);else notice('Not enough supplies to upgrade.');}});
      const mine=!state.individualSupplies||tower.ownerId===me(),ownerName=state.players[tower.ownerId]?.name||'the owner';
      actions.push({label:mine?`Sell · +${towerRefund(tower)}`:'Sell tower',summary:mine?'Recover half of build and upgrade costs.':`Half the costs go to ${ownerName}.`,description:mine?`Sell tower for ${towerRefund(tower)} supplies`:`Sell tower; refund goes to ${ownerName}`, run:()=>showMenu(pad,'confirmSell')});
      const name=tower.branch!=null?branches[tower.type][tower.branch].name:types[tower.type].name;
      notice(`${name} · level ${tower.level} · range ${Math.round(getTowerRange(tower))}. ${coop?"Battle continues in co-op.":"Battle paused."}`);
    }
    function upgrade(branch){dispatch({type:'upgrade',pad,branch,...(coop?{expectedTowerId:tower.id,expectedLevel:tower.level}:{})},result=>{if(!result.ok){if($('towerDetails').open)$('towerDetailsCost').textContent=result.reason;else notice(result.reason);return;}if(!coop){combatFx.emit('upgrade',getMap(state.mapId).pads[pad],state);sound.play('upgrade');}notice(`Tower upgraded to level ${tower.level+(coop?1:0)}.`);if($('towerDetails').open)$('towerDetails').close();closeMenu();updateUI();});}
    $('sheetMode').textContent=coop?'BATTLE CONTINUES':'BATTLE PAUSED';
    $('sheetTitle').textContent=!tower?'Build defense':mode==='branches'?'Choose specialization':mode==='confirmSell'?'Sell tower?':`${tower.branch!=null?branches[tower.type][tower.branch].name:types[tower.type].name} · Level ${tower.level}`;
    $('sheetHint').textContent=!tower?'Choose a tower to inspect.':mode==='branches'?'This choice is permanent.':mode==='confirmSell'?'Confirm or cancel the sale.':`Range ${Math.round(getTowerRange(tower))} · tap an action for details`;
    options.forEach((button,i)=>{const action=actions[i];button.hidden=!action;button.disabled=!action||!!action.disabled;button.classList.toggle('unaffordable',!!action?.unaffordable);$('menuName'+i).textContent=action?action.label:'';$('menuDesc'+i).textContent=action?(action.summary||'')+(action.unaffordable?' · Not enough supplies':''):'';button.setAttribute('aria-label',action?action.description:'');button.onclick=action?()=>action.run():null;});
    menu.hidden=false;updateUI();
  }
  function showDetails(title,text,cost,verb,confirm,lockedReason=''){
    $('towerDetailsTitle').textContent=title;$('towerDetailsText').textContent=text;
    $('towerDetailsCost').textContent=`Cost: ${cost} supplies · Available: ${supplies()}${lockedReason?' · '+lockedReason:supplies()<cost?' · Not enough supplies':''}`;
    const button=$('towerDetailsConfirm');button.textContent=`${verb} · ${cost}`;button.disabled=!!lockedReason||supplies()<cost;button.onclick=confirm;
    $('towerDetails').showModal();
  }
  $('towerDetailsBack').onclick=()=>$('towerDetails').close();
  $('radialClose').onclick=()=>{closeMenu();state.selectedPad=null;notice('Tower menu closed.');updateUI();};
  function selectBattlePoint(x,y){
    if(state.ended||(coop&&!coopReady))return;const rect=canvas.getBoundingClientRect(),map=getMap(state.mapId),view=battleViewport?.getViewport();
    if(state.mode==='versus'&&y>=540){notice('That is your opponent’s battlefield. Build and move on your own lane above.');return;}
    const radius=Math.min(56,Math.max(28,22*canvas.width/rect.width/(view?.scale||1))),pads=map.pads;let index=-1,nearest=radius;
    pads.forEach((p,i)=>{const d=Math.hypot(p.x-x,p.y-y);if(d<nearest){index=i;nearest=d;}});
    if(index<0){closeMenu();state.selectedPad=null;dispatch({type:'move',x:Math.max(12,Math.min((map.width||960)-12,x)),y:Math.max(12,Math.min((map.height||540)-12,y))},result=>{notice(result.ok?'Hero moving to position.':result.reason);updateUI();});return;}
    showMenu(index);
    if(window.innerWidth<=850){
      const screenY=view?(pads[index].y-view.y)*view.scale:pads[index].y;
      const spotY=rect.top+screenY*rect.height/canvas.height;
      const margin=48*(view?.scale||1)*rect.height/canvas.height+12;
      const overlap=spotY+margin-menu.getBoundingClientRect().top;
      if(overlap>0)window.scrollBy({top:overlap,behavior:'auto'});
    }
  }
  canvas.addEventListener('click',e=>{if(battleViewport)return;const rect=canvas.getBoundingClientRect();selectBattlePoint((e.clientX-rect.left)*canvas.width/rect.width,(e.clientY-rect.top)*canvas.height/rect.height);});
  let uiElapsed=0;
  function update(dt){
    if(radioTime>0&&!cinematic){radioTime=Math.max(0,radioTime-dt);if(!radioTime)$('storyRadio').hidden=true;}
    if(coop||state.ended||commandMenuOpen||cinematic||!menu.hidden||tutorial.isOpen()||$('gameConfirm').open||!account.isReady()){accumulator=0;return;}
    accumulator+=dt*state.speed;
    while(accumulator>=STEP){
      accumulator-=STEP;
      for(const event of stepMatch(state)){
        if(event.type==='skillCombo'){combatFx.emit('combo',{x:event.x,y:event.y,comboLabel:event.name},state);sound.play('combo');}
        else if(event.type==='bunkerHit'){sound.play('impact');combatFx.emit('bunkerHit',{x:900,y:400,comboLabel:`−${Math.round(event.damage*10)/10}`},state);notice(`${ENEMY_TYPES[event.kind]?.label||'Enemy'} reached the bunker! −${Math.round(event.damage*10)/10} health.`);}
        else if(event.type==='lootDrop')notice(`Supply cache found! +${event.supplies} supplies.`);
        else if(event.type==='bossAbility'&&event.ability==='bomb'){sound.play('impact');combatFx.emit('bunkerHit',{x:900,y:400,comboLabel:`−${Math.round(event.damage*10)/10}`},state);notice(`Bomber struck the bunker! −${Math.round(event.damage*10)/10} health.`);}
        else if(event.type==='rubbleCleared'){sound.play('impact');notice('Rubble cleared! Long-range shots are no longer weakened in that zone.');}
        else if(event.type==='iceBroken'){sound.play('ice');notice('Thin ice broke! Tanks slow down and take more damage.');}
        else if(event.type==='defeat'){sound.play('defeat');notice('Bunker lost. The operation has failed.');}
        else if(event.type==='waveCleared'){sound.play('clear');const target=report;target.pending++;Promise.resolve(account.awardXP(event.xp,event.wave)).then(detail=>{target.pending--;if(detail?.committed)addReward(target,detail);else target.failed=true;if(lastReport===target&&$('runResults').open)renderResults(target);renderCampaign();}).catch(()=>{target.pending--;target.failed=true;if(lastReport===target&&$('runResults').open)renderResults(target);});notice(event.wave%5===0?`Boss wave ${event.wave} cleared! Choose a field upgrade. +${event.xp} XP.`:`Wave cleared! +20 supplies and +${event.xp} XP. Prepare for the next wave.`);}
      }
      if(activeStory&&!state.ended){const outcome=stepStory(activeStory,state,STEP);if(outcome){notice(outcome.message);if(outcome.type==='stage')storyRadio(outcome.message);if(outcome.type==='victory'){const target=report;target.storyMessage=outcome.message;target.campaign=activeMission;target.campaignSaved=null;target.pending++;finishReport(target,state,me(),false);showCinematic(activeMission,'ending',()=>{if(lastReport===target&&state===target.snapshot&&target.accountId===account.getUserId()){renderResults(target);if(!$('runResults').open)$('runResults').showModal();}});Promise.resolve(account.saveCampaign(activeMission.id)).then(result=>{target.pending--;target.campaignSaved=!!result?.committed&&campaignProgress(result.profile)>=CAMPAIGN.indexOf(target.campaign)+1;if(result?.profile){target.profile=result.profile;target.storyConfirmed=campaignProgress(result.profile);}if(lastReport===target&&$('runResults').open)renderResults(target);renderCampaign();}).catch(()=>{target.pending--;target.campaignSaved=false;if(lastReport===target&&$('runResults').open)renderResults(target);});}else if(outcome.type==='failure'){report.storyMessage=outcome.message;sound.play('defeat');}}}
      if(state.ended){accumulator=0;updateUI();break;}
    }
    uiElapsed+=dt;if(uiElapsed>=.12){uiElapsed=0;updateUI();}
  }
  function draw(){const map=getMap(state.mapId),{path,pads,theme}=map;ctx.clearRect(0,0,canvas.width,canvas.height);const visual=coop&&coopReady&&lastSnapshotAt?projectCoopMotion(state,(performance.now()-lastSnapshotAt)/1000):state;
    function drawOwn(){drawCartoonBattle(ctx,visual,{path,pads,theme,types,me:me(),getTowerRange,effects:combatFx.active(),reducedMotion,storyMission:!coop?activeMission:null,storyStage:!coop&&!state.ended?activeMission?.stages[activeStory?.stage]:null,storyTime:performance.now()/1000,shotAge:coop&&lastSnapshotAt?Math.max(0,(performance.now()-lastSnapshotAt)/1000):0,...(battleViewport?{paths:map.paths,width:map.width,height:map.height,bunkerPosition:map.bunker}:{})});

    if(activeStory&&!coop&&!state.ended){const objective=storyStatus(activeStory,state),point=objective.marker;if(point){ctx.save();ctx.beginPath();ctx.arc(point.x,point.y,36+(reducedMotion?0:2*Math.sin(performance.now()/400)),0,Math.PI*2);ctx.strokeStyle='#152118';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#ffe17b';ctx.lineWidth=4;ctx.setLineDash([8,5]);ctx.lineDashOffset=reducedMotion?0:-performance.now()/120;ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#14221b';ctx.fillRect(point.x-48,point.y-61,96,20);ctx.fillStyle='#ffe17b';ctx.textAlign='center';ctx.font='bold 12px sans-serif';ctx.fillText(point.type==='protect'?'PROTECT':'OBJECTIVE',point.x,point.y-47);if(point.type==='protect'){ctx.fillStyle='#1c2b20';ctx.fillRect(point.x-25,point.y+43,50,7);ctx.fillStyle=activeStory.assetHealth<30?'#f28f73':'#b6dd8b';ctx.fillRect(point.x-24,point.y+44,48*Math.max(0,activeStory.assetHealth)/100,5);}ctx.restore();}}

    if(activeStory&&!coop&&!state.ended&&activeStory.mission.stages[activeStory.stage]?.type==='escort'){const hero=visual.players.local;if(hero){ctx.save();for(const offset of [-14,14]){ctx.beginPath();ctx.arc(hero.x+offset,hero.y+25,7,0,Math.PI*2);ctx.fillStyle='#bce6f1';ctx.fill();ctx.strokeStyle='#263c35';ctx.lineWidth=2;ctx.stroke();}ctx.restore();}}

    // Draw selection above units and effects, including an empty pad while its
    // build menu is open. A dark border keeps the bright marker legible on roads.
    const markerPad=menuPad??state.selectedPad;
    if(markerPad!==null&&!state.ended){
      const p=pads[markerPad];
      if(p){
        ctx.beginPath();ctx.arc(p.x,p.y,35,0,Math.PI*2);
        ctx.strokeStyle='#172016';ctx.lineWidth=10;ctx.stroke();
        ctx.strokeStyle='#ffed70';ctx.lineWidth=5;ctx.stroke();
        ctx.beginPath();
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ctx.moveTo(p.x+dx*40,p.y+dy*40);ctx.lineTo(p.x+dx*49,p.y+dy*49);}
        ctx.strokeStyle='#172016';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#fff6ac';ctx.lineWidth=4;ctx.stroke();
      }
    }
    }
    if(battleViewport)drawInBattleViewport(ctx,battleViewport.getViewport(),drawOwn);else drawOwn();
    if(state.mode==='versus'&&state.rival){ctx.save();ctx.fillStyle='#344b36';ctx.fillRect(0,540,960,20);ctx.fillStyle='#f1e7c4';ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(`${state.players[state.rivalId]?.name||'OPPONENT'} · OPPONENT BATTLEFIELD`,480,555);ctx.translate(0,560);const rival=coopReady&&lastSnapshotAt?projectCoopMotion(state.rival,(performance.now()-lastSnapshotAt)/1000):state.rival;drawCartoonBattle(ctx,rival,{path,pads,theme,types,me:state.rivalId,getTowerRange,effects:[],reducedMotion,shotAge:coop&&lastSnapshotAt?Math.max(0,(performance.now()-lastSnapshotAt)/1000):0});ctx.restore();}
  }
  $('coopControls').hidden=!coopUrl;
  function leaveCoop(){if(!coop)return Promise.resolve();const old=coop;coop=null;coopReady=false;coopHasBaseline=false;needStop=false;coopInput.setEnabled(false);coopInput=null;const stopping=old.stop();keys.clear();lastDirection='0,0';$('coopToggle').textContent='JOIN CO-OP (TEST)';$('coopStatus').textContent='SOLO';if(account.isReady())reset(true);return Promise.resolve(stopping);}
  function confirmParty(){return !(state.wave>0||state.towers.length)||confirmAction({title:'Leave solo operation?',text:'Joining co-op will end the current solo run.',accept:'JOIN CO-OP'});}
  function beginCoop(factory,onUpdate=()=>{},reportId=null){
    if(coop||!account.isReady())return false;
    activeMission=null;activeStory=null;selectedMap=nextMapId(selectedMap);hasCoopSnapshot=false;report=newReport(reportId||'test');coopReports.set(report.id,report);
    closeMenu();keys.clear();lastDirection='0,0';seenCoopWaves=0;seenCoopCaches=0;coopHasBaseline=false;combatFx.clear();lastSnapshotAt=0;let client;
    try{
      client=factory({onState:value=>{if(coop!==client)return;$('coopStatus').textContent=value.toUpperCase();onUpdate(value);if(value==='error')notice('Multiplayer connection failed. If the host reloaded, use Resume as Host in a recovery trial; otherwise create a new party.');if(value==='duplicate')notice('This party is already open in another tab. Close it before joining here.');},onStatus:ready=>{if(coop!==client)return;coopReady=ready;coopInput.setEnabled(ready);if(!ready){combatFx.clear();bossSignal=null;coopHasBaseline=false;needStop=true;keys.clear();lastDirection='0,0';if(!state.ended)notice(state.mode==='versus'?'1 vs 1 paused. Waiting for both players to reconnect.':state.mode==='two-vs-two'?'2 vs 2 paused. Waiting for all players to reconnect.':'Co-op connection interrupted. Waiting to reconnect.');}else if(needStop){needStop=false;sound.play('reconnect');coopInput.direction({type:'direction',x:0,y:0});}updateUI();},onSnapshot:snapshot=>{if(coop!==client)return;if(snapshot?.match?.mode==='four-coop'||snapshot?.match?.mode==='two-vs-two'){try{snapshot=projectFourGameView(snapshot,me());}catch{notice('Invalid four-player match snapshot.');return;}}hasCoopSnapshot=true;const wasEnded=state.ended,oldWave=state.wave,wasRunning=state.running,oldPendingWave=state.pendingWave||0,wasIceBroken=!!state.iceBroken,wasRubbleCleared=!!state.rubbleCleared,oldBoss=state.enemies.find(e=>e.boss&&e.hp>0),oldImpact=state.bunkerImpact?.seq||0,hadSnapshot=coopReady&&coopHasBaseline,selectedPad=state.selectedPad;if(coopReady){for(const cue of combatFx.observe(snapshot.match,getMap(snapshot.match.mapId).pads))sound.play(cue);}else combatFx.clear();lastSnapshotAt=performance.now();state={...snapshot.match,selectedPad,speed:1};if(coopReady)coopHasBaseline=true;if(hadSnapshot&&state.running&&state.wave!==oldWave)sound.play(state.wave%5===0?'boss':'wave');
      if(hadSnapshot&&(state.bunkerImpact?.seq||0)>oldImpact){const hit=state.bunkerImpact;notice(`${ENEMY_TYPES[hit.kind]?.label||'Enemy'} hit the bunker! −${Math.round(hit.damage*10)/10} health.`);}
      const newBoss=state.enemies.find(e=>e.boss&&e.hp>0);
      if(hadSnapshot&&coopReady&&newBoss?.boss==='bossBomber'&&newBoss.bossFlash>0&&oldBoss?.boss===newBoss.boss&&!(oldBoss.bossFlash>0)){sound.play('impact');notice('Bomber struck the bunker!');}
      if(hadSnapshot&&!oldPendingWave&&state.pendingWave){if(state.hostId!==me())sound.play('request');notice(state.hostId===me()?'Waiting for teammate approval.':`Host requests wave ${state.pendingWave}. Approve when ready.`);}
      if(hadSnapshot&&oldPendingWave&&!state.pendingWave&&!state.running&&!state.ended)notice('Wave request cancelled, declined or teammate disconnected.');
      if(hadSnapshot&&!wasRubbleCleared&&state.rubbleCleared){sound.play('impact');notice('Rubble cleared! Long-range shots are no longer weakened in that zone.');}
      if(hadSnapshot&&!wasIceBroken&&state.iceBroken){sound.play('ice');notice('Thin ice broke! Tanks slow down and take more damage.');}
      if(hadSnapshot&&wasRunning&&!state.running&&!state.ended){sound.play('clear');notice(state.pendingPerk?'Boss wave cleared! Choose a shared field upgrade.':'Wave cleared. Prepare for the next wave.');}
      if(hadSnapshot&&!wasEnded&&state.ended&&state.mode==='versus'){sound.play(state.winnerId===me()?'clear':'defeat');notice(state.winnerId?(state.winnerId===me()?'Victory! Your bunker survived.':'Defeat. Your opponent survived.'):'Both bunkers fell: draw.');}else if(hadSnapshot&&!wasEnded&&state.ended&&state.endReason!=='retired'){sound.play('defeat');notice('Bunker lost.');}
      if(state.ended&&!wasEnded&&state.endReason==='retired'){keys.clear();closeMenu();state.selectedPad=null;if($('towerDetails').open)$('towerDetails').close();notice('Shared run ended. Completed-wave rewards are kept. Close the party to start a new run.');}const completed=state.players[me()]?.completedWaveMask||0,caches=state.players[me()]?.lootCaches||0;if(caches>seenCoopCaches)notice('Supply cache found! Supplies added to your balance.');seenCoopCaches=caches;if(completed&~seenCoopWaves)notice('Wave completed! Saving co-op XP and loot…');seenCoopWaves|=completed;updateUI();},onEvents:events=>{if(coop!==client)return;for(const event of events){if(event.type==='bunkerHit')notice(`${ENEMY_TYPES[event.kind].label} reached the bunker! −${Math.round(event.damage*10)/10} health.`);
        else if(event.type==='lootDrop')notice(`Supply cache found! +${event.supplies} supplies.`);else if(event.type==='iceBroken'){sound.play('ice');notice('Thin ice broke! Tanks slow down and take more damage.');}else if(event.type==='defeat'){sound.play('defeat');notice('Bunker lost.');}else if(event.type==='waveCleared'){sound.play('clear');notice(event.wave%5===0?'Boss wave cleared! Choose a shared field upgrade.':'Wave cleared. Prepare for the next wave.');}}}});
      coop=client;coopInput=createCoopInput(client,message=>notice(message));coopReady=false;$('coopToggle').textContent='LEAVE CO-OP';$('coopStatus').textContent='CONNECTING';client.start();updateUI();return true;
    }catch{if(coop===client)void leaveCoop();notice('Co-op could not be started.');return false;}
  }
  $('coopToggle').onclick=async()=>{if(coop){void leaveCoop();notice('Returned to solo.');return;}if(await confirmParty()&&account.isReady()&&!coop)beginCoop(callbacks=>clientFactory({url:coopUrl,getToken:()=>account.getToken(),...callbacks}));};
  account.onSessionChange(()=>{closeCinematic(false);lastReport=null;coopReports.clear();$('viewResults').hidden=true;if($('runResults').open)$('runResults').close();leaveCoop();if($('towerDetails').open)$('towerDetails').close();closeMenu();tutorial.stop();keys.clear();if(account.isReady()){activeMission=null;$('campaignSelect').value='free';reset();if(!deferTutorial)tutorial.startIfNeeded(account.getUserId());}});
  reset();if(!deferTutorial)tutorial.startIfNeeded(account.getUserId());let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
  function setMenuOpen(open){commandMenuOpen=!!open;keys.clear();sendDirection();accumulator=0;}
  function chooseStory(){const progress=campaignProgress(account.getProfile()),mission=CAMPAIGN[Math.min(progress,CAMPAIGN.length-1)];$('campaignSelect').value=mission.id;renderCampaign();$('campaignSelect').focus?.();}
  async function chooseEndless(){const previous=activeMission?.id||'free';$('campaignSelect').value='free';renderCampaign();const loaded=await $('campaignLoad').onclick();if(!loaded){$('campaignSelect').value=previous;renderCampaign();}return loaded;}
  return {recordCoopReward,getMapId:()=>selectedMap,canEditSkills:()=>!coop&&((state.wave===0&&state.towers.length===0)||state.ended),resetSkills:reset,confirmParty,beginCoop,leaveCoop,setMenuOpen,chooseStory,chooseEndless,showTutorial:()=>{closeMenu();keys.clear();sendDirection();tutorial.replay(account.getUserId());},getRunSummary:()=>!state.ended&&(state.wave>0||state.towers.length||activeMission)?(activeMission?.title||'ENDLESS'):null,isOnlineMatch:()=>!!coop};
}
