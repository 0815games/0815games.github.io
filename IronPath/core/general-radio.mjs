// General Vance radio controller for Block 6 · Interactive Tutorial.
//
// Manages the older General's German & English voice clips alongside live
// subtitles, a readable text fallback when muted or voice-over is disabled,
// volume synchronization with Settings, and safe audio cleanup on view/account
// transitions.

import {getLanguage} from '../language.mjs?v=20261123-blocke1';

export const GENERAL_NAME=Object.freeze({
  en:'GENERAL VANCE · SECTOR COMMAND',
  de:'GENERAL VANCE · SEKTORKOMMANDO',
});

export const GENERAL_RADIO_SCRIPTS=Object.freeze({
  'dossier-offer':{
    en:'Listen up, soldier. I am General Vance. Welcome to Field Headquarters. Before you deploy to the Valley, accept this training dossier and learn every weapon and station under your command.',
    de:'Hören Sie zu, Rekrut. Hier spricht General Vance. Willkommen im Hauptquartier. Bevor Sie ins Tal ausrücken, nehmen Sie diese Auftragsakte an und lernen Sie jede Stellung und jedes System kennen.',
  },
  'dossier-decline':{
    en:'Understood. Your dossier stays archived. Command Center is yours whenever you want to deploy, or return to Settings if you ever want the full field briefing.',
    de:'Verstanden. Ihre Akte wird archiviert. Das Kommandozentrum gehört Ihnen. Falls Sie die Einweisung später nachholen möchten, finden Sie sie jederzeit in den Einstellungen.',
  },
  'mission-welcome':{
    en:'Field link active. Seven short waves stand between us and the end of this exercise. Watch the road, protect the bunker, and build where your guns can cover the bends.',
    de:'Feldverbindung steht. Sieben kurze Wellen trennen uns vom Abschluss dieser Übung. Behalten Sie die Straße im Blick, schützen Sie den Bunker und bauen Sie in den Kurven.',
  },
  'mission-build':{
    en:'Tap a highlighted build pad, pick a turret, and confirm construction. Every gun fires automatically once built; your job is placement and supplies.',
    de:'Tippen Sie auf einen markierten Bauplatz, wählen Sie ein Geschütz und bestätigen Sie den Bau. Jeder Turm feuert selbstständig – Ihre Aufgabe sind Position und Vorräte.',
  },
  'mission-upgrade':{
    en:'Tap your turret and upgrade it to Rank two. One stronger gun outperforms two weak ones, and remember, selling a gun later returns half your supplies.',
    de:'Tippen Sie Ihren Turm an und rüsten Sie ihn auf Stufe zwei auf. Ein starkes Geschütz schlägt zwei schwache – und beim Verkauf erhalten Sie die Hälfte Ihrer Vorräte zurück.',
  },
  'mission-hero':{
    en:'Now move your soldier onto open ground near the bend. Unlike fixed turrets, your hero shifts wherever fire is needed most and fights automatically.',
    de:'Verlegen Sie jetzt Ihren Soldaten auf freies Gelände an der Biegung. Im Gegensatz zu Türmen ist Ihr Held beweglich und unterstützt dort, wo es brennt.',
  },
  'mission-supplies':{
    en:'Supplies only arrive when a wave falls. Spend wisely before pressing Deploy, and during calm stretches you can switch to double battle speed.',
    de:'Vorräte fließen nur nach geschafften Wellen. Planen Sie klug, bevor Sie auf Einsatz drücken – bei ruhiger Lage können Sie zudem auf doppeltes Tempo schalten.',
  },
  'mission-specialize':{
    en:'Heavier columns and fast scouts are moving in. Reach Rank three to pick a permanent turret specialization, and watch the field intel before aircraft arrive.',
    de:'Schwerere Kolonnen und schnelle Späher rücken vor. Ab Stufe drei wählen Sie für jeden Turm eine feste Spezialisierung – und behalten Sie vor Luftangriffen die Flak im Blick.',
  },
  'mission-air':{
    en:'Enemy aircraft inbound on the radar. Cover the sky with anti-air flak, and fire your active soldier ability whenever the charge is full.',
    de:'Feindliche Flugzeuge im Anflug! Sichern Sie den Luftraum mit Flak-Feuer und nutzen Sie Ihre aktive Soldatenfähigkeit, sobald sie geladen ist.',
  },
  'mission-boss':{
    en:'Here comes the Vanguard Boss. Heavy armor aimed straight at our bunker. Focus your upgraded turrets and hero fire before it closes the gap.',
    de:'Da kommt der Kommandoboss – schwere Panzerung direkt auf unseren Bunker zu! Konzentrieren Sie alle aufgerüsteten Türme und Ihr Heldenfeuer auf dieses Ziel!',
  },
  'mission-complete':{
    en:'Good work holding that sector. Report to the after-action debrief. Your soldier has reached Rank two, and Headquarters is ready for full inspection.',
    de:'Gute Arbeit in diesem Sektor. Prüfen Sie nun den Gefechtsbericht – Ihr Soldat hat Rang zwei erreicht, und ich führe Sie jetzt durch das gesamte Hauptquartier.',
  },
  'hq-dossier':{
    en:'This is your Soldier Dossier. Everything about your fighter lives here: rank insignia, portrait, equipment slots, and combat stats. Safe overview, zero risk to your account.',
    de:'Das ist Ihr Soldatendossier. Hier sehen Sie Dienstrang, Abzeichen, Porträt, angelegte Ausrüstung und Kampfwerte. Ein sicherer Überblick über Ihre Einsatzbereitschaft.',
  },
  'hq-armory':{
    en:'Open the Armory Equipment tab and put on the gear you earned. Unassigned gear sitting in your locker gives no combat bonus until worn.',
    de:'Öffnen Sie in der Waffenkammer den Bereich Ausrüstung und legen Sie Ihr gewonnenes Teil an. Ungenutzte Ausrüstung im Spind bringt im Gefecht keinen Bonus.',
  },
  'hq-skills':{
    en:'Welcome to Skills. At level two, choose one of six classes: Assault, Engineer, Logistics, Medic, Recon, or Air Defense. Each opens its own tree and tower path.',
    de:'Willkommen bei den Fähigkeiten. Ab Stufe zwei wählen Sie eine von sechs Klassen – Angriff, Pionier, Logistik, Sanitäter, Aufklärung oder Luftabwehr, jeweils mit eigenem Baum und Turmpfad.',
  },
  'hq-workshop':{
    en:'Switch inside the Armory to Workshop and Bunker. Forge new gear from wave scrap, salvage duplicates, and upgrade permanent bunker defenses.',
    de:'Schalten Sie in der Waffenkammer zwischen Werkstatt und Bunker um. Schmieden Sie aus Wellen-Schrott neue Teile, zerlegen Sie Doppelte und verstärken Sie den Bunker.',
  },
  'hq-operations':{
    en:'Here are your solo operations. Campaign takes you across five story acts and prestige; Endless lets you pick any battlefield map and push sectors as far as your line holds.',
    de:'Hier liegen die Solo-Einsätze. Die Kampagne führt Sie durch fünf Story-Akte samt Relikten und Prestige; im Endlos-Modus wählen Sie ein Schlachtfeld und halten Welle um Welle.',
  },
  'hq-online':{
    en:'Deploying with allies? Multiplayer connects two to four players by party code or friend invite, Friends tracks your squad, and High Scores logs your personal records.',
    de:'Gemeinsam ins Gefecht? Im Mehrspieler verbinden Sie vierstellige Gruppencodes für Koop oder Duell; unter Freunde verwalten Sie Ihren Trupp, und die Bestenliste hält Ihre Rekorde fest.',
  },
  'hq-settings-done':{
    en:'Check Field Notes for recent updates and Settings for audio, radio voice, graphics, or replaying this briefing anytime. Dismissed, soldier. The Valley is yours.',
    de:'In den Feldnotizen finden Sie aktuelle Updates, und in den Einstellungen regeln Sie Ton, Sprachausgabe, Grafik oder starten diese Einweisung neu. Ausbildung abgeschlossen, Soldat – das Tal gehört Ihnen.',
  },
});

export function tutorialVoicePath(clipId,lang=getLanguage()){
  if(!clipId)return null;
  const code=lang==='de'?'de':'en';
  return `assets/voice/${code}/tutorial/${clipId}.mp3`;
}

export function tutorialRadioSubtitle(clipId,lang=getLanguage()){
  const entry=GENERAL_RADIO_SCRIPTS[clipId];
  if(!entry)return '';
  return lang==='de'?entry.de:entry.en;
}

export function createGeneralRadio({AudioCtor=typeof Audio==='function'?Audio:null,featureEnabledFn=()=>true,initialPrefs={},onToggleVoiceOver=null,document=null}={}){
  let activeAudio=null,activeClip=null,activeText='';
  let voiceOver=initialPrefs.voiceOver!==false;
  let soundEnabled=initialPrefs.soundEnabled!==false;
  let volume=Number.isFinite(initialPrefs.volume)?Math.max(0,Math.min(1,initialPrefs.volume)):0.85;
  const subscribers=new Set();

  function effectiveVolume(){
    if(!featureEnabledFn('voiceOver')||!voiceOver||!soundEnabled)return 0;
    return Math.max(0,Math.min(1,volume));
  }

  function isAudible(){
    return effectiveVolume()>0.01;
  }

  function stopAudio(){
    if(activeAudio){
      try{activeAudio.muted=true;}catch{}
      try{activeAudio.volume=0;}catch{}
      try{activeAudio.pause?.();}catch{}
      try{activeAudio.currentTime=0;}catch{}
      activeAudio=null;
    }
  }

  function notify(){
    const snap=snapshot();
    syncBoundDom(snap);
    for(const fn of subscribers){
      try{fn(snap);}catch{}
    }
  }

  function syncBoundDom(snap){
    if(!document)return;
    const lang=getLanguage()==='de'?'de':'en';
    const speakerText=GENERAL_NAME[lang];
    const modeLabel=snap.audible
      ?(lang==='de'?'FUNK AKTIV':'RADIO LIVE')
      :(lang==='de'?'STUMM · TEXTMODUS':'MUTED · TEXT MODE');
    const muteLabel=snap.voiceOver
      ?(lang==='de'?'Stumm':'Mute')
      :(lang==='de'?'Ton an':'Unmute');
    for(const prefix of ['dossierRadio','coachRadio','guideRadio','menuTourRadio']){
      const speaker=document.getElementById(`${prefix}Speaker`);
      const subtitle=document.getElementById(`${prefix}Subtitle`);
      const badge=document.getElementById(`${prefix}Status`);
      const muteBtn=document.getElementById(`${prefix}Mute`);
      if(speaker)speaker.textContent=speakerText;
      if(subtitle){subtitle.textContent=snap.subtitle||'';subtitle.hidden=!snap.subtitle;}
      if(badge){badge.textContent=modeLabel;badge.dataset.audible=String(snap.audible);}
      if(muteBtn){
        muteBtn.textContent=muteLabel;
        muteBtn.setAttribute?.('aria-pressed',String(!snap.voiceOver));
      }
    }
  }

  function snapshot(){
    const lang=getLanguage()==='de'?'de':'en';
    return {
      clipId:activeClip,
      subtitle:activeText||(activeClip?tutorialRadioSubtitle(activeClip,lang):''),
      speaker:GENERAL_NAME[lang],
      voiceOver,
      soundEnabled,
      volume,
      audible:isAudible(),
      speaking:!!activeAudio,
      lang,
    };
  }

  function play(clipId,{subtitle='',speak=true}={}){
    const lang=getLanguage()==='de'?'de':'en';
    activeClip=clipId||null;
    activeText=subtitle||tutorialRadioSubtitle(clipId,lang)||'';
    stopAudio();
    if(!speak||!clipId||!isAudible()||typeof AudioCtor!=='function'){notify();return false;}
    const src=tutorialVoicePath(clipId,lang);
    if(!src){notify();return false;}
    try{
      const audio=new AudioCtor(src);
      audio.volume=effectiveVolume();
      const clearIfCurrent=()=>{if(activeAudio===audio){activeAudio=null;notify();}};
      audio.onerror=clearIfCurrent;
      audio.onended=clearIfCurrent;
      activeAudio=audio;
      const promise=audio.play?.();
      if(promise&&typeof promise.catch==='function')promise.catch(clearIfCurrent);
      notify();
      return true;
    }catch{
      activeAudio=null;
      notify();
      return false;
    }
  }

  function replay(){
    if(!activeClip)return false;
    return play(activeClip,{subtitle:activeText,speak:true});
  }

  function silence(){
    stopAudio();
    notify();
  }

  function stop(){
    stopAudio();
    activeClip=null;
    activeText='';
    notify();
  }

  function setPrefs(next={}){
    if(next.voiceOver!==undefined)voiceOver=!!next.voiceOver;
    if(next.soundEnabled!==undefined)soundEnabled=!!next.soundEnabled;
    if(Number.isFinite(next.volume))volume=Math.max(0,Math.min(1,next.volume));
    if(activeAudio){
      if(!isAudible())stopAudio();
      else activeAudio.volume=effectiveVolume();
    }
    notify();
  }

  function toggleMute(){
    const next=!voiceOver;
    setPrefs({voiceOver:next});
    try{onToggleVoiceOver?.(next);}catch{}
    if(next&&activeClip)replay();
    return next;
  }

  function refreshLanguage(){
    if(activeClip){
      const lang=getLanguage()==='de'?'de':'en';
      const localized=tutorialRadioSubtitle(activeClip,lang);
      if(localized)activeText=localized;
    }
    notify();
  }

  return Object.freeze({
    play,
    replay,
    silence,
    stop,
    setPrefs,
    toggleMute,
    refreshLanguage,
    snapshot,
    subscribe(fn){if(typeof fn==='function')subscribers.add(fn);return ()=>subscribers.delete(fn);},
    get isAudible(){return isAudible();},
  });
}
