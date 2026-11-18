// Field notes: the patch log, readable inside the game.
//
// Why this file exists. The full protocol lives in PATCH-LOG.md and the plan in
// PATCH-BLOECKE.md - both are Markdown for the repository, not for a phone. The
// operator asked for exactly that content where he plays: what the last patches
// changed and which blocks are still ahead. So this module is the in-game view
// of the same two lists, and nothing else.
//
// Rules this module keeps:
//
//   * presentation only. No Firebase, no account write, no game state, no
//     network. If the game cannot load this file, nothing else breaks;
//   * every string is authored in BOTH languages. There is no English fallback
//     here: tests/patch-notes.test.mjs fails when an entry or a bullet is
//     missing its German, because a German client must never show raw English;
//   * released work and open work are separate lists, always. A green test
//     suite is not a device acceptance, and an emulator run is not a phone.
//     The wording below says so instead of implying a finished feature;
//   * entries are edited by hand after a real release. Nothing here is
//     generated from Git, so an entry is only true once the matching commit,
//     merge and Pages run are proven - see PATCH-LOG.md.

import {getLanguage} from './language.mjs?v=20261031-patch6';

// Status chips for the planned list. `active` is the block being worked on,
// `next` is the one after it, `planned` is agreed but not started.
export const PATCH_STATUS=Object.freeze({
  active:{en:'IN PROGRESS',de:'IN ARBEIT'},
  next:{en:'NEXT',de:'ALS NÄCHSTES'},
  planned:{en:'PLANNED',de:'GEPLANT'},
});

export const PATCH_LABELS=Object.freeze({
  live:{en:'LIVE',de:'LIVE'},
  build:{en:'INSTALLED BUILD',de:'INSTALLIERTER BUILD'},
  shipped:{en:'Shipped',de:'Veröffentlicht'},
  open:{en:'Still open',de:'Noch offen'},
  pr:{en:'Pull request',de:'Pull-Request'},
  withoutBuild:{en:'before the version manifest',de:'vor dem Versionsmanifest'},
});

// What is already on the website. Newest first. Only entries whose commit,
// merge and Pages run are proven in PATCH-LOG.md belong here; `build` is the
// value that shipped in release-version.json, or null when no manifest existed
// yet at that time (PR #286 predates it - verified against the repository).
export const RELEASED_PATCHES=Object.freeze([
  {
    id:'patch5',build:'20261031-patch6',pr:314,
    title:{en:'Block 4 avatar rebuild & wave rollout',de:'Block-4-Avatar-Neubau & Rollout-Welle'},
    shipped:[
      {en:'Rebuilt avatar generator: 12 clean frontal base heads, 17 hairstyles, 6 beards and 5 shared hair/beard colors tinted at runtime.',de:'Neu aufgebauter Avatar-Baukasten: 12 frontale Basisköpfe, 17 Frisuren, 6 Bärte und 5 gemeinsame Haar-/Bartfarben mit Laufzeit-Färbung.'},
      {en:'Compact on-portrait ◀/▶ steppers with color dots, safe migration of older avatar saves, and matching friend/dossier portraits.',de:'Kompakte ◀/▶-Stepper direkt am Porträt mit Farbpunkten, sichere Migration älterer Avatar-Speicherstände sowie passende Freundes-/Dossier-Porträts.'},
      {en:'Published live friend/avatar database rules (gender/avatar reads and avatar format validation) and earlier interface polish (#299–#312).',de:'Freundes-/Avatar-Datenbankregeln (gender-/avatar-Reads und Avatar-Formatprüfung) sowie vorheriger Oberflächen-Feinschliff (#299–#312) veröffentlicht.'},
    ],
    open:[
      {en:'Real-device acceptance of the new avatars and the redesigned version notice popup.',de:'Echte Geräteabnahme der neuen Avatare sowie des neu gestalteten Versionshinweis-Popups.'},
      {en:'Earlier network-traffic tuning for projectile visuals (D1) and Block 5/6/7 roadmap items.',de:'Frühere Netzdaten-Optimierung der Schussgrafik (D1) sowie die Punkte aus Block 5, 6 und 7.'},
    ],
  },
  {
    id:'patch3',build:'20261031-patch3',pr:289,
    title:{en:'Multiplayer fixes, party end and rewards',de:'Mehrspieler-Fixes, Gruppenabschluss und Belohnungen'},
    shipped:[
      {en:'Tower menu and upgrades inside a party: your own and other players’ towers open and improve reliably again.',de:'Türme und Upgrades in der Gruppe: eigene und fremde Türme öffnen und verbessern wieder zuverlässig.'},
      {en:'Wave and 2× requests show as cards in the middle of the field; “Later” no longer answers them.',de:'Wellen- und 2×-Anfragen erscheinen als Karten in der Feldmitte; „Später“ beantwortet sie nicht mehr.'},
      {en:'The host ends the operation; everyone receives the report and confirmed rewards.',de:'Der Host beendet den Einsatz; alle erhalten den Bericht und bestätigte Belohnungen.'},
      {en:'Signing out during a host party offers waiting, cancelling or immediate sign-out after a warning.',de:'Die Feldabmeldung während einer Hostpartie bietet Warten, Abbrechen oder sofortiges Abmelden nach Warnung.'},
      {en:'The veteran skill shows its real price again.',de:'Der Veteranen-Skill zeigt wieder seinen wirklichen Preis.'},
      {en:'Friend portraits show, with a neutral placeholder for unreadable or invalid images.',de:'Freundesporträts erscheinen, bei unlesbaren oder ungültigen Bildern ein neutraler Platzhalter.'},
    ],
    open:[
      {en:'Real device tests with two to four players, network changes and long matches are still missing.',de:'Echte Gerätetests mit zwei bis vier Spielern, Netzwechseln und langen Partien fehlen weiterhin.'},
      {en:'The portrait reads are only proven as a local rules candidate; without them the placeholder stays.',de:'Die Porträt-Reads sind nur als lokaler Rules-Kandidat geprüft; ohne sie bleibt der Platzhalter.'},
    ],
  },
  {
    id:'update3',build:'20261031-update3',pr:288,
    title:{en:'Mobile maintenance and admin design',de:'Mobile Wartungs- und Admin-Gestaltung'},
    shipped:[
      {en:'New maintenance screen and admin layout for phones.',de:'Neue Wartungsanzeige und neues Admin-Layout für Mobilgeräte.'},
      {en:'Confirmed on an iPhone: layout, both version checks and the admin sign-in with maintenance active.',de:'Auf dem iPhone bestätigt: Layout, beide Versionsprüfungen und der Admin-Login bei aktiver Wartung.'},
    ],
    open:[
      {en:'Earlier reported CSS and image delivery errors are not explained by these tests.',de:'Früher gemeldete CSS- und Bildauslieferungsfehler sind durch diese Tests nicht aufgeklärt.'},
    ],
  },
  {
    id:'update2',build:'20261031-update2',pr:287,
    title:{en:'Maintenance switch, version guard and social cleanup',de:'Wartungsschalter, Versionsschutz und Social-Bereinigung'},
    shipped:[
      {en:'A public status check holds the normal game start before Firebase loads; the screen is German and English.',de:'Eine öffentliche Statusprüfung hält den normalen Spielstart vor dem Laden von Firebase an; die Anzeige ist deutsch und englisch.'},
      {en:'Cleanup of abandoned social and character data, and the maintenance gate in the rules candidate.',de:'Bereinigung verwaister Social- und Charakterdaten sowie das Wartungs-Gate im Rules-Kandidaten.'},
    ],
    open:[
      {en:'Productive rules and data changes need a fresh comparison, tests and their own approval.',de:'Produktive Rules- und Datenänderungen brauchen frischen Abgleich, Tests und eigene Freigabe.'},
    ],
  },
  {
    id:'update1',build:null,pr:286,
    title:{en:'Large multiplayer fields, camera and tower menu pointer',de:'Große Mehrspielerfelder, Kamera und Turmmenü-Zeiger'},
    shipped:[
      {en:'The large multiplayer battlefields, the new camera and the fix for the tower menu pointer.',de:'Die großen Mehrspieler-Schlachtfelder, die neue Kamera und der Fix für den Turmmenü-Zeiger.'},
    ],
    open:[
      {en:'Older release: at that time the game had no version manifest yet.',de:'Ältere Veröffentlichung: Damals hatte das Spiel noch kein Versionsmanifest.'},
    ],
  },
]);

// The road ahead, in the agreed order. Block 7 is the life, counter-attack and
// repair system: agreed as an ADDITIONAL future patch, not one of the six
// original blocks, and deliberately last - it touches every mode.
export const PLANNED_PATCHES=Object.freeze([
  {
    id:'block1',status:'active',
    title:{en:'Block 1 · Multiplayer',de:'Block 1 · Mehrspieler'},
    shipped:[
      {en:'Modes, larger fields, request cards, party end and reports are live.',de:'Modi, größere Felder, Anfragekarten, Gruppenabschluss und Berichte sind live.'},
    ],
    open:[
      {en:'Device and network-change tests, longer matches, beginner balance, and what happens with members who never return.',de:'Geräte- und Netzwechseltests, längere Partien, Einsteigerbalance sowie der Umgang mit dauerhaft abwesenden Mitgliedern.'},
    ],
  },
  {
    id:'block2',status:'next',
    title:{en:'Block 2 · Character and friends',de:'Block 2 · Charakter und Freunde'},
    shipped:[
      {en:'Character cleanup, sign-out afterwards, friendship, invitations and further social fixes; portraits with a safe placeholder.',de:'Charakterbereinigung, Abmeldung danach, Freundschaft, Einladungen und weitere Social-Fixes; Porträts mit sicherem Platzhalter.'},
    ],
    open:[
      {en:'Globally unique names and legacy duplicates, released portrait rules, and a real multi-device acceptance.',de:'Global eindeutige Namen und Altbestände, freigegebene Porträt-Rules sowie eine echte Mehrgeräteabnahme.'},
    ],
  },
  {
    id:'block3',status:'planned',
    title:{en:'Block 3 · Interface',de:'Block 3 · Oberfläche'},
    shipped:[
      {en:'Party portrait cards, compact battle rank HUD, tower glow/shimmer, debrief rank & promotion, centered popups, lower-right ability HUD and shot tracers (#299–#312) are live and tested by the operator.',de:'Party-Porträtkarten, schlankes Kampf-Rang-HUD, Turm-Glow/Schimmer, Berichts-Rang & Beförderung, mittige Popups, Fähigkeits-HUD rechts unten und Schussspuren (#299–#312) sind live und vom Betreiber getestet.'},
    ],
    open:[
      {en:'Verify the fixed version-notice dispatch layout on real phones and decide later on projectile network traffic (D1).',de:'Korrigiertes Versionshinweis-Popup am echten Handy prüfen und später über die Netzdatenmenge der Schüsse (D1) entscheiden.'},
    ],
  },
  {
    id:'block4',status:'planned',
    title:{en:'Block 4 · Avatars',de:'Block 4 · Avatare'},
    shipped:[
      {en:'Rebuilt avatar generator (12 frontal base heads, 17 hairstyles, 6 beards, 5 colors, ◀/▶ steppers, legacy migration), server sync and published portrait rules (#313–#314) are live.',de:'Avatar-Neubau (12 frontale Basisköpfe, 17 Frisuren, 6 Bärte, 5 Farben, ◀/▶-Stepper, Altsave-Migration), Server-Abgleich und veröffentlichte Porträt-Rules (#313–#314) sind live.'},
    ],
    open:[
      {en:'Final operator confirmation on real devices across character creation, menu, dossier, friends and party.',de:'Abschließende Betreiber-Bestätigung auf echten Geräten in Charaktererstellung, Menü, Dossier, Freunden und Party.'},
    ],
  },
  {
    id:'block5',status:'planned',
    title:{en:'Block 5 · Skills',de:'Block 5 · Fähigkeiten'},
    shipped:[
      {en:'Five classes and ten tower kits with ranks I–III exist; the veteran price fix is live.',de:'Fünf Klassen und zehn Turm-Kits mit Rängen I–III existieren; der Veteranenpreis-Fix ist live.'},
    ],
    open:[
      {en:'Fix Boss Hunter III and Twin MG III, add the sixth anti-air class, exclusive class choice and a safe point refund.',de:'Bossjäger III und Doppel-MG III korrigieren, die sechste Luftabwehrklasse, exklusive Klassenauswahl und eine sichere Punkterückgabe.'},
    ],
  },
  {
    id:'block6',status:'planned',
    title:{en:'Block 6 · Tutorial',de:'Block 6 · Tutorial'},
    shipped:[
      {en:'The five-wave introduction, its replay and the confirmed cancel fixes exist.',de:'Die Fünf-Wellen-Einführung, ihre Wiederholung und die bestätigten Abbruchfixes sind vorhanden.'},
    ],
    open:[
      {en:'Character-related accept and decline, one large continuous mission, the general’s voice and the following menu guidance.',de:'Charakterbezogene Annahme und Ablehnung, eine große zusammenhängende Mission, die Generalstimme und die anschließende Menüführung.'},
    ],
  },
  {
    id:'block7',status:'planned',
    title:{en:'Block 7 · Life, counter-attacks and repairs',de:'Block 7 · Leben, Gegenangriffe und Reparaturen'},
    note:{
      en:'Added as an additional future patch; it comes after the six original blocks because it changes every mode.',
      de:'Als zusätzlicher künftiger Patch aufgenommen; er kommt nach den sechs Originalblöcken, weil er alle Modi verändert.',
    },
    shipped:[
      {en:'The bunker already has health points and existing repair effects.',de:'Der Bunker besitzt bereits Lebenspunkte und bestehende Reparatureffekte.'},
    ],
    open:[
      {en:'Life for soldiers and towers, so enemies can threaten them and not only walk to the bunker.',de:'Leben für Soldaten und Türme, damit Gegner sie bedrohen können und nicht nur zum Bunker laufen.'},
      {en:'Attacks with a visible warning and a cooldown, so a hit can be avoided and nobody is focus-fired unreadably.',de:'Angriffe mit sichtbarer Vorwarnung und Abklingzeit, damit man ausweichen kann und niemand unlesbar fokussiert wird.'},
      {en:'Repair instead of a loss spiral: damaged towers can be repaired for supplies, and every wave heals them for free.',de:'Reparatur statt Verlustspirale: beschädigte Türme lassen sich gegen Vorräte reparieren, jede Welle heilt sie kostenlos.'},
      {en:'The same rules in tutorial, campaign, solo, co-op, 1 vs 1 and 2 vs 2, with the shared simulation as the only source of hits.',de:'Dieselben Regeln in Tutorial, Kampagne, Solo, Koop, 1 gegen 1 und 2 gegen 2, mit der gemeinsamen Simulation als einziger Quelle der Treffer.'},
      {en:'All numbers are untested starting suggestions. No permanent loss of progress, equipment or skill points.',de:'Alle Zahlen sind ungetestete Startvorschläge. Kein dauerhafter Verlust von Fortschritt, Ausrüstung oder Skillpunkten.'},
    ],
  },
]);

const escapeHtml=text=>String(text??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

// `getLanguage()` is the game's single source for the active language; the data
// above is authored per language, so nothing here translates at runtime.
export function patchText(value,language=getLanguage()){
  if(!value)return '';
  if(typeof value==='string')return value;
  return language==='de'?(value.de??value.en??''):(value.en??value.de??'');
}

function renderList(items,language,className){
  if(!Array.isArray(items)||!items.length)return '';
  const rows=items.map(item=>`<li>${escapeHtml(patchText(item,language))}</li>`).join('');
  return `<ul class="patch-list ${className}">${rows}</ul>`;
}

export function renderPatchEntry(entry,kind,language,liveBuild=null){
  const language_=language||getLanguage();
  const status=kind==='planned'?PATCH_STATUS[entry.status]:null;
  const live=!!liveBuild&&entry.build===liveBuild;
  const head=kind==='planned'
    ? `${escapeHtml(patchText(status,language_))}`
    : `${escapeHtml(patchText(PATCH_LABELS.build,language_))}: ${escapeHtml(entry.build||patchText(PATCH_LABELS.withoutBuild,language_))} · ${escapeHtml(patchText(PATCH_LABELS.pr,language_))} #${escapeHtml(entry.pr)}`;
  const badge=live?`<span class="patch-badge">${escapeHtml(patchText(PATCH_LABELS.live,language_))}</span>`:'';
  const note=entry.note?`<p class="patch-entry-note">${escapeHtml(patchText(entry.note,language_))}</p>`:'';
  return `<article class="patch-entry" data-patch="${escapeHtml(entry.id||'')}" data-status="${escapeHtml(entry.status||'released')}"${live?' data-live="true"':''}>`
    +`<header class="patch-entry-head"><span class="patch-entry-meta">${head}</span>${badge}<h3>${escapeHtml(patchText(entry.title,language_))}</h3></header>`
    +note
    +`<p class="patch-entry-label">${escapeHtml(patchText(PATCH_LABELS.shipped,language_))}</p>`
    +renderList(entry.shipped,language_,'patch-list-done')
    +`<p class="patch-entry-label">${escapeHtml(patchText(PATCH_LABELS.open,language_))}</p>`
    +renderList(entry.open,language_,'patch-list-open')
    +`</article>`;
}

// The view. `document` is the real page; the panels are filled from the data
// above, so the markup in index.html stays small and the list stays testable.
export function createPatchNotes({document,build=null}={}){
  const $=id=>document.getElementById(id);
  const dialog=$('patchNotes');
  const released=$('patchNotesReleased');
  const planned=$('patchNotesPlanned');
  const buildLine=$('patchNotesBuild');
  const tabs=[{button:$('patchNotesTabLive'),panel:released},{button:$('patchNotesTabNext'),panel:planned}];
  // The build the player is actually running. Read from the page instead of
  // importing release-version.json: the meta tag ships with every release and
  // cannot drift from the files that were loaded.
  const running=build??document.querySelector?.('meta[name="ironpath-build"]')?.content??'';
  let tab='released';

  function paintTabs(){
    for(const {button,panel} of tabs){
      if(!button||!panel)continue;
      const selected=button.id==='patchNotesTabLive'?tab==='released':tab==='planned';
      button.setAttribute?.('aria-selected',String(selected));
      panel.hidden=!selected;
    }
  }

  function render(){
    const language=getLanguage();
    if(released)released.innerHTML=RELEASED_PATCHES.map(entry=>renderPatchEntry(entry,'released',language,running)).join('');
    if(planned)planned.innerHTML=PLANNED_PATCHES.map(entry=>renderPatchEntry(entry,'planned',language,running)).join('');
    if(buildLine)buildLine.textContent=running?`${patchText(PATCH_LABELS.build,language)}: ${running}`:'';
    paintTabs();
  }

  function setTab(next){
    tab=next==='planned'?'planned':'released';
    paintTabs();
  }

  function open(next=null){
    if(!dialog)return false;
    if(next)setTab(next);
    render();
    if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.open=true;}
    return true;
  }

  function close(){if(dialog?.open)dialog.close();}

  tabs[0].button?.addEventListener?.('click',()=>setTab('released'));
  tabs[1].button?.addEventListener?.('click',()=>setTab('planned'));
  $('patchNotesClose')?.addEventListener?.('click',close);
  dialog?.addEventListener?.('cancel',event=>{event.preventDefault();close();});

  render();
  return {open,close,render,setTab,get tab(){return tab;},get build(){return running;}};
}
