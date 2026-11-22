// Command HQ Mission Dossier controller for Block 6 · Interactive Tutorial.
//
// Presented inside the Command Center (never skipping the HQ on character creation).
// Offers General Vance's field briefing dossier with rich painted artwork,
// bilingual copy, radio voice controls, and clear Accept / Decline / Resume /
// Replay-HQ-Only paths without ever triggering destructive account actions.

import {translateText as tr,getLanguage} from './language.mjs?v=20261122-battle1';
import {FIRST_RUN_XP} from './training-run.mjs?v=20261122-battle1';

export const DOSSIER_MODES=Object.freeze(['offer','resume','replay']);

export function createTutorialDossier({
  document,
  radio=null,
  onAccept=async()=>{},
  onDecline=async()=>{},
  onReplayMenuOnly=async()=>{},
  onClose=()=>{},
}={}){
  const $=id=>document?.getElementById?.(id)??null;
  const dialog=$('tutorialDossier');
  let activeMode='offer',alreadyRewarded=false,busy=false;

  const isOpen=()=>!!dialog?.open;

  function render(){
    if(!dialog)return;
    const lang=getLanguage()==='de'?'de':'en';
    dialog.dataset.mode=activeMode;
    dialog.dataset.rewarded=String(alreadyRewarded);

    const kicker=$('dossierKicker');
    const title=$('dossierTitle');
    const lead=$('dossierLead');
    const rewardNote=$('dossierRewardNote');
    const acceptBtn=$('dossierAccept');
    const menuOnlyBtn=$('dossierMenuTourOnly');
    const declineBtn=$('dossierDecline');
    const closeBtn=$('dossierClose');

    const titleText=activeMode==='resume'
      ?'Field briefing paused — resume operation?'
      :activeMode==='replay'
        ?'Command briefing & headquarters tour'
        :'Sector briefing: Valley defense & HQ orientation';
    const kickerText=activeMode==='resume'
      ?'ACTIVE BRIEFING · RESUME OR ARCHIVE'
      :activeMode==='replay'
        ?'REPLAY BRIEFING · NO SECOND REWARD'
        :'FIELD ORDERS · SECTOR COMMAND';
    const leadText=activeMode==='resume'
      ?'Your earlier training deployment was interrupted. Jump back into the seven-wave briefing mission or decline the briefing for this soldier.'
      :activeMode==='replay'
        ?'Replay the full seven-wave training mission with General Vance on radio, or tour every Command Headquarters screen interactively right now.'
        :'Before deploying to the Valley, accept this interactive briefing: hold a seven-wave defensive line with live General radio support, then inspect every station in Field Headquarters.';

    if(kicker)kicker.textContent=tr(kickerText);
    if(title)title.textContent=tr(titleText);
    if(lead)lead.textContent=tr(leadText);

    if(rewardNote){
      rewardNote.textContent=alreadyRewarded
        ?tr('Rewards already claimed for this soldier. Replays teach tactics and HQ systems without paying duplicate XP or gear.')
        :tr('Completing the training operation grants {xp} XP (Rank 2 + first skill point) and your first soldier gear once per character.',{xp:FIRST_RUN_XP});
    }

    if(acceptBtn){
      acceptBtn.textContent=tr(
        activeMode==='resume'
          ?'RESUME OPERATION →'
          :activeMode==='replay'
            ?'PLAY FULL MISSION + HQ TOUR'
            :'ACCEPT MISSION'
      );
      acceptBtn.disabled=busy;
    }

    if(menuOnlyBtn){
      menuOnlyBtn.hidden=activeMode!=='replay';
      menuOnlyBtn.textContent=tr('TOUR HEADQUARTERS MENUS ONLY');
      menuOnlyBtn.disabled=busy;
    }

    if(declineBtn){
      declineBtn.hidden=activeMode==='replay';
      declineBtn.textContent=tr('DECLINE PERMANENTLY');
      declineBtn.disabled=busy;
    }

    if(closeBtn){
      closeBtn.hidden=activeMode==='offer';
      closeBtn.textContent=tr(lang==='de'?'SCHLIESSEN':'CLOSE');
    }

    const missionTitle=$('dossierCardMissionTitle');
    const missionDesc=$('dossierCardMissionText');
    const hqTitle=$('dossierCardHqTitle');
    const hqDesc=$('dossierCardHqText');
    if(missionTitle)missionTitle.textContent=tr('01 · 7-Wave Combat Operation');
    if(missionDesc)missionDesc.textContent=tr('Build turrets, upgrade & specialize at rank 3, position your hero, counter fast scouts, aircraft and the Vanguard Boss.');
    if(hqTitle)hqTitle.textContent=tr('02 · Full Command HQ Tour');
    if(hqDesc)hqDesc.textContent=tr('Hands-on Armory equip & 6-class Skills choice, plus safe interactive stations for Soldier Dossier, Workshop, Campaign, Endless, Multiplayer, Friends, High Scores, Field Notes & Settings.');

    const muteBtn=$('dossierRadioMute');
    const replayAudioBtn=$('dossierRadioReplay');
    if(replayAudioBtn)replayAudioBtn.textContent=tr('Replay radio');
    if(muteBtn&&radio){
      const snap=radio.snapshot();
      muteBtn.textContent=tr(snap.voiceOver?'Mute':'Unmute');
      muteBtn.setAttribute?.('aria-pressed',String(!snap.voiceOver));
    }
  }

  function close(){
    if(!dialog)return;
    if(dialog.open){
      try{dialog.close();}catch{dialog.open=false;}
    }
    radio?.stop?.();
    try{onClose();}catch{}
  }

  async function runAction(fn){
    if(busy)return false;
    busy=true;
    render();
    try{
      const result=await fn();
      close();
      return result!==false;
    }finally{
      busy=false;
      if(isOpen())render();
    }
  }

  function open({mode='offer',rewarded=false,speak=true}={}){
    if(!dialog)return false;
    activeMode=DOSSIER_MODES.includes(mode)?mode:'offer';
    alreadyRewarded=!!rewarded;
    render();
    const resetScroll=()=>{
      dialog.scrollTop=0;
      const body=dialog.querySelector?.('.dossier-body');
      if(body)body.scrollTop=0;
    };
    resetScroll();
    if(!dialog.open){
      if(typeof dialog.showModal==='function')dialog.showModal();
      else dialog.open=true;
    }
    resetScroll();
    if(typeof dialog.focus==='function'){
      try{dialog.focus({preventScroll:true});}catch{try{dialog.focus();}catch{}}
    }
    radio?.play?.('dossier-offer',{speak});
    resetScroll();
    return true;
  }

  const accept=$('dossierAccept');
  if(accept)accept.onclick=()=>void runAction(()=>onAccept(activeMode));

  const menuOnly=$('dossierMenuTourOnly');
  if(menuOnly)menuOnly.onclick=()=>void runAction(()=>onReplayMenuOnly());

  const decline=$('dossierDecline');
  if(decline)decline.onclick=()=>void runAction(async()=>{
    radio?.play?.('dossier-decline',{speak:true});
    return await onDecline(activeMode);
  });

  const closeBtn=$('dossierClose');
  if(closeBtn)closeBtn.onclick=()=>close();

  const radioMute=$('dossierRadioMute');
  if(radioMute)radioMute.onclick=()=>radio?.toggleMute?.();

  const radioReplay=$('dossierRadioReplay');
  if(radioReplay)radioReplay.onclick=()=>radio?.replay?.();

  dialog?.addEventListener?.('cancel',event=>{
    if(activeMode==='offer'){event.preventDefault();return;}
    event.preventDefault();
    close();
  });

  return Object.freeze({
    open,
    close,
    render,
    isOpen,
    refreshLanguage:()=>{if(isOpen()){render();radio?.refreshLanguage?.();}},
    get mode(){return activeMode;},
  });
}
