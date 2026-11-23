// Interactive Block-9 Command Headquarters tour (`phase: 'menu'`).
//
// Walks the soldier through every Command HQ menu item, dialog, and game mode
// with painted artwork, General Vance radio voice & subtitles, live target ring
// highlighting, safe modal inspection, pause/recall (`SHOW TASK`), back/next
// navigation, and strict protection against destructive actions (Delete
// Character and Sign Out are never clickable or auto-triggered by the tour).

import {translateText as tr,getLanguage} from '../language.mjs?v=20261122-ring1';
import {mountOverlayPopover} from './popover-host.mjs?v=20261122-ring1';

export const FORBIDDEN_TOUR_TARGETS=Object.freeze([
  'menuDeleteCharacter',
  'menuLogout',
  'logout',
  'fieldLogout',
  'setupLogout',
  'errorLogout',
]);

export const SAFE_INSPECT_ACTIONS=Object.freeze({
  soldier:{trigger:'#menuSoldier',dialog:'#soldierDialog'},
  armory:{trigger:'#menuArmory',dialog:'#armoryDialog',tab:'#armoryWorkshopTab'},
  skills:{trigger:'#menuSkills',dialog:'#skillDialog'},
  endless:{trigger:'#menuEndless',dialog:'#endlessLaunch'},
  friends:{trigger:'#menuFriends',dialog:'#friendsDialog'},
  scores:{trigger:'#menuLeaderboard',dialog:'#leaderboardDialog'},
  notes:{trigger:'#menuPatchNotes',dialog:'#patchNotes'},
  settings:{trigger:'#menuSettings',dialog:'#settingsDialog',tab:'#settingsTabGeneral'},
});

export const TOUR_STATIONS=Object.freeze([
  Object.freeze({
    id:'soldier',
    title:'Soldier Dossier & Rank Insignia',
    caption:'HQ · 1 / 8 · SOLDIER PROFILE',
    text:'Your highlighted Soldier card opens the Field Dossier: rank insignia, portrait, active skill, equipped item, and combat stats. Leveling up promotes your soldier automatically.',
    detail:'Tap Open & Inspect to examine your Dossier safely, or review the card highlighted behind this guide.',
    target:'#menuSoldier',
    art:'assets/tutorial-soldier.jpg?v=20261122-ring1',
    voiceClip:'hq-dossier',
    inspect:'soldier',
  }),
  Object.freeze({
    id:'armory',
    title:'Armory, Workshop & Bunker Upgrades',
    caption:'HQ · 2 / 8 · ARMORY & WORKSHOP',
    text:'Equipment boosts hero stats when equipped. Salvage duplicates or spend wave scrap in the Workshop to forge new gear, upgrade Bunker armor, and review Service Medals.',
    detail:'Nothing here forces a purchase — switch freely between Equipment, Workshop, Bunker, and Service Record tabs.',
    target:'#menuArmory',
    art:'assets/arsenal-workbench.jpg?v=20261122-ring1',
    voiceClip:'hq-workshop',
    inspect:'armory',
  }),
  Object.freeze({
    id:'skills',
    title:'Six Soldier Classes & Tower Paths',
    caption:'HQ · 3 / 8 · SKILLS',
    text:'Choose one of six classes from Level 2: Assault, Engineer, Logistics, Medic, Recon, or Air Defense. Each grants an active battle ability and specialized class upgrades on your turrets.',
    detail:'Changes stay a reversible draft until you press Save Build.',
    target:'#menuSkills',
    art:'assets/skills-banner.jpg?v=20261122-ring1',
    voiceClip:'hq-skills',
    inspect:'skills',
  }),
  Object.freeze({
    id:'campaign',
    title:'Campaign: Five Acts & Prestige',
    caption:'HQ · 4 / 8 · CAMPAIGN',
    text:'Follow Ada, Voss, Ivo, Sera, and Nia across 50 missions in five acts. Clear missions to earn Act Relics, face Boss phases and tactical decisions, and unlock Prestige tiers.',
    detail:'Every operation lists its threat rating before deployment — tougher enemies, extra waves, or tightened bunker limits.',
    target:'#menuCampaign',
    art:'assets/tutorial-dossier-map.jpg?v=20261122-ring1',
    voiceClip:'hq-operations',
    inspect:null,
  }),
  Object.freeze({
    id:'endless',
    title:'Endless Mode & Sector Retreats',
    caption:'HQ · 5 / 8 · ENDLESS',
    text:'Pick Random or a specific valley battlefield in Endless. Every 10 waves clears a Sector, carrying a demolition refund into higher-threat terrain while logging your best wave and scrap.',
    detail:'Tap Open & Inspect to browse the battlefield carousel without starting a match.',
    target:'#menuEndless',
    art:'assets/tutorial-airstrike.jpg?v=20261122-ring1',
    voiceClip:null,
    inspect:'endless',
  }),
  Object.freeze({
    id:'multiplayer',
    title:'Multiplayer Parties & Squads',
    caption:'HQ · 6 / 8 · MULTIPLAYER',
    text:'Play 2–4 player Co-op or 1v1 / 2v2 survival races using a private 4-digit party code or friend invite. Waves and 2× speed advance by squad vote, with confirmed wave-by-wave saving.',
    detail:'Use Leave Party cleanly when finished, or Emergency Force-Close if a teammate drops offline during wrap-up.',
    target:'#menuMultiplayer',
    art:'assets/action-friends.jpg?v=20261122-ring1',
    voiceClip:'hq-online',
    inspect:null,
  }),
  Object.freeze({
    id:'friends_scores',
    title:'Friends & High Scores',
    caption:'HQ · 7 / 8 · SQUAD & RECORDS',
    text:'Search exact soldier names to add friends, view squad dossiers, and send party invites. High Scores tracks all-time solo and co-op waves plus a Friends-only filter.',
    detail:'Inspect Friends or open High Scores anytime without affecting active missions.',
    target:'#menuLeaderboard',
    art:'assets/action-scores.jpg?v=20261122-ring1',
    voiceClip:null,
    inspect:'scores',
    secondaryInspect:'friends',
  }),
  Object.freeze({
    id:'notes_settings',
    title:'Field Notes, Settings & Account Safety',
    caption:'HQ · 8 / 8 · BRIEFING COMPLETE',
    text:'Read Released & Upcoming updates in Field Notes. In Settings, adjust volume, mute General Vance radio voice, choose Reduced Graphics, or replay this tutorial anytime.',
    detail:'Safety notice: Account deletion and Sign Out inside Settings remain strictly manual — no briefing ever triggers them.',
    target:'#menuSettings',
    art:'assets/tutorial-hq-briefing.jpg?v=20261122-ring1',
    voiceClip:'hq-settings-done',
    inspect:'settings',
    secondaryInspect:'notes',
  }),
]);

export function createMenuTour({
  document,
  radio=null,
  resolve=selector=>document?.querySelector?.(selector)??null,
  onStepChange=()=>{},
  onComplete=()=>{},
  onStop=()=>{},
  onVisibilityChange=()=>{},
}={}){
  const $=id=>document?.getElementById?.(id)??null;
  const card=$('menuTour');
  let index=-1,activeUser=null,previewedDialogs=new Set();

  const step=()=>TOUR_STATIONS[index]||null;
  const isOpen=()=>!!card&&!card.hidden;
  const isActive=()=>index>=0&&activeUser!=null;
  const isDismissed=()=>!!card&&card.hidden&&isActive();

  function closePreviewDialogs(){
    for(const selector of previewedDialogs){
      try{
        const dlg=resolve(selector);
        if(dlg?.open)dlg.close?.();
      }catch{}
    }
    previewedDialogs.clear();
  }

  function assertSafeAction(inspectKey){
    const spec=SAFE_INSPECT_ACTIONS[inspectKey];
    if(!spec)return null;
    for(const forbidden of FORBIDDEN_TOUR_TARGETS){
      if(spec.trigger.includes(forbidden)||spec.dialog.includes(forbidden)){
        throw new Error(`Unsafe tutorial action blocked: ${forbidden}`);
      }
    }
    return spec;
  }

  function inspectStation(inspectKey){
    const spec=assertSafeAction(inspectKey);
    if(!spec)return false;
    closePreviewDialogs();
    try{
      const trigger=resolve(spec.trigger);
      trigger?.click?.();
      if(spec.tab){
        const tab=resolve(spec.tab);
        tab?.click?.();
      }
      const dlg=resolve(spec.dialog);
      if(dlg?.open)previewedDialogs.add(spec.dialog);
      raise();
      return true;
    }catch{
      return false;
    }
  }

  function ringTarget(current){
    const layer=$('coachHighlight'),ring=$('coachRing');
    if(!layer||!ring)return;
    try{
      const node=current?.target?resolve(current.target):null;
      const box=node?.getBoundingClientRect?.();
      if(!box||!box.width||!box.height){layer.hidden=true;return;}
      layer.hidden=false;
      ring.hidden=false;
      ring.style.width=`${Math.round(box.width+10)}px`;
      ring.style.height=`${Math.round(box.height+10)}px`;
      ring.style.left=`${Math.round(box.left-5)}px`;
      ring.style.top=`${Math.round(box.top-5)}px`;
      ring.style.borderRadius='8px';
    }catch{}
  }

  function raise(){
    if(!isOpen())return false;
    mountOverlayPopover(document,card,{visible:true});
    try{if(card.matches?.(':popover-open'))card.hidePopover?.();}catch{}
    try{card.showPopover?.();}catch{}
    return true;
  }

  function render({speak=true}={}){
    const current=step();
    if(!current||!card)return hide();
    const lang=getLanguage()==='de'?'de':'en';

    const stepNode=$('menuTourStep');
    const titleNode=$('menuTourTitle');
    const textNode=$('menuTourText');
    const detailNode=$('menuTourDetail');
    const captionNode=$('menuTourCaption');
    const artNode=$('menuTourArt');
    const backBtn=$('menuTourBack');
    const nextBtn=$('menuTourNext');
    const inspectBtn=$('menuTourInspect');
    const altInspectBtn=$('menuTourInspectAlt');
    const finishBtn=$('menuTourFinish');
    const muteBtn=$('menuTourRadioMute');
    const replayAudioBtn=$('menuTourRadioReplay');

    if(stepNode)stepNode.textContent=tr('COMMAND HQ · {step} / {total}',{step:index+1,total:TOUR_STATIONS.length});
    if(titleNode)titleNode.textContent=tr(current.title);
    if(textNode)textNode.textContent=tr(current.text);
    if(detailNode){detailNode.textContent=tr(current.detail||'');detailNode.hidden=!current.detail;}
    if(captionNode)captionNode.textContent=tr(current.caption);
    if(artNode){
      artNode.src=current.art;
      artNode.alt=tr(current.title);
    }

    if(backBtn){
      backBtn.disabled=index<=0;
      backBtn.textContent=tr('← BACK');
    }
    if(nextBtn){
      nextBtn.textContent=tr(index>=TOUR_STATIONS.length-1?'FINISH TOUR ✓':'NEXT →');
    }
    if(inspectBtn){
      inspectBtn.hidden=!current.inspect;
      inspectBtn.textContent=tr('OPEN & INSPECT');
    }
    if(altInspectBtn){
      altInspectBtn.hidden=!current.secondaryInspect;
      altInspectBtn.textContent=tr(current.secondaryInspect==='friends'?'OPEN FRIENDS':'OPEN FIELD NOTES');
    }
    if(finishBtn){
      finishBtn.hidden=index>=TOUR_STATIONS.length-1;
      finishBtn.textContent=tr('End tour');
    }
    const minLabel=$('menuTourClose')?.querySelector?.('.tour-min-label');
    if(minLabel)minLabel.textContent=tr('Minimize');
    if(replayAudioBtn)replayAudioBtn.hidden=false;
    if(replayAudioBtn)replayAudioBtn.textContent=tr('Replay radio');
    if(muteBtn&&radio){
      const snap=radio.snapshot();
      muteBtn.textContent=tr(snap.voiceOver?'Mute':'Unmute');
      muteBtn.setAttribute?.('aria-pressed',String(!snap.voiceOver));
    }

    card.hidden=false;
    card.dataset.step=current.id;
    const body=card.querySelector?.('.menu-tour-body');
    if(body)body.scrollTop=0;
    card.scrollTop=0;
    mountOverlayPopover(document,card,{visible:true});
    try{card.showPopover?.();}catch{}
    ringTarget(current);
    onVisibilityChange(true);

    if(speak&&current.voiceClip){
      radio?.play?.(current.voiceClip,{speak:true});
    }else if(radio&&current.voiceClip){
      radio?.play?.(current.voiceClip,{speak:false});
    }
    try{onStepChange(current,index);}catch{}
  }

  function hide(){
    try{if(card?.matches?.(':popover-open'))card.hidePopover?.();}catch{}
    if(card)card.hidden=true;
    mountOverlayPopover(document,card,{visible:false});
    const layer=$('coachHighlight');
    if(layer)layer.hidden=true;
    onVisibilityChange(false);
  }

  function start(uid,{startStep=0,speak=true}={}){
    if(!uid||!card)return false;
    activeUser=uid;
    const bounded=Number.isInteger(startStep)?Math.max(0,Math.min(TOUR_STATIONS.length-1,startStep)):0;
    index=bounded;
    render({speak});
    return true;
  }

  function next(){
    if(!isActive())return false;
    closePreviewDialogs();
    if(index>=TOUR_STATIONS.length-1){
      const completedUser=activeUser;
      hide();
      index=-1;
      activeUser=null;
      radio?.stop?.();
      try{onComplete(completedUser);}catch{}
      return false;
    }
    index++;
    render({speak:true});
    return true;
  }

  function back(){
    if(!isActive()||index<=0)return false;
    closePreviewDialogs();
    index--;
    render({speak:true});
    return true;
  }

  function dismiss(){
    if(!isOpen())return false;
    radio?.silence?.();
    hide();
    return true;
  }

  function reopen(){
    if(!isDismissed())return false;
    render({speak:false});
    return true;
  }

  function finishEarly(){
    const uid=activeUser;
    closePreviewDialogs();
    hide();
    index=-1;
    activeUser=null;
    radio?.stop?.();
    try{onComplete(uid);}catch{}
  }

  function stop(){
    closePreviewDialogs();
    hide();
    index=-1;
    activeUser=null;
    radio?.stop?.();
    try{onStop();}catch{}
  }

  const nextBtn=$('menuTourNext');
  if(nextBtn)nextBtn.onclick=()=>next();
  const backBtn=$('menuTourBack');
  if(backBtn)backBtn.onclick=()=>back();
  const inspectBtn=$('menuTourInspect');
  if(inspectBtn)inspectBtn.onclick=()=>{const cur=step();if(cur?.inspect)inspectStation(cur.inspect);};
  const altInspectBtn=$('menuTourInspectAlt');
  if(altInspectBtn)altInspectBtn.onclick=()=>{const cur=step();if(cur?.secondaryInspect)inspectStation(cur.secondaryInspect);};
  const closeBtn=$('menuTourClose');
  if(closeBtn)closeBtn.onclick=()=>dismiss();
  const finishBtn=$('menuTourFinish');
  if(finishBtn)finishBtn.onclick=()=>finishEarly();
  const muteBtn=$('menuTourRadioMute');
  if(muteBtn)muteBtn.onclick=()=>radio?.toggleMute?.();
  const replayBtn=$('menuTourRadioReplay');
  if(replayBtn)replayBtn.onclick=()=>radio?.replay?.();

  return Object.freeze({
    start,
    next,
    back,
    dismiss,
    reopen,
    finishEarly,
    stop,
    raise,
    inspectStation,
    isOpen,
    isActive,
    dismissed:isDismissed,
    step,
    index:()=>index,
    refreshLanguage:()=>{if(isOpen()){render({speak:false});radio?.refreshLanguage?.();}},
    stations:TOUR_STATIONS,
  });
}
