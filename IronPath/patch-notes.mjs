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

import {getLanguage} from './language.mjs?v=20261119-block9c';

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
    id:'block9c',build:'20261119-block9c',pr:322,
    title:{en:'Block 9c · Unified Settings Console, AFK Bunker Art & Full Dialog Harmonization',de:'Block 9c · Einheitliche Einstellungen, AFK-Bunker-Gemälde & vollständige Dialog-Harmonisierung'},
    shipped:[
      {en:'Upgraded Settings (`settings.mjs`, `assets/settings-command.jpg`) with Sound Effects toggle, Master Volume, Mission Voice-Over, Graphics preset (automatically disabling FX toggles when Reduced is chosen), Screen Shake, Weather FX, Combat Tracers, Focus Auto-Pause, Default Battlefield View, Fullscreen, confirmed Restore Defaults, and removed the duplicate `#soundToggle` from `#fieldOps`.',de:'Einstellungen (`settings.mjs`, `assets/settings-command.jpg`) um Soundeffekte-Schalter, Gesamtlautstärke, Missions-Sprachausgabe, Grafikvoreinstellung (sperrt FX-Schalter automatisch bei „Reduziert“), Kamerawackeln, Wetter-FX, Kampfleuchtspuren, Fokus-Autopause, Standard-Kartenansicht, Vollbild und bestätigtes Zurücksetzen ausgebaut; doppelten `#soundToggle` im Feldmenü entfernt.'},
      {en:'Added the painted bunker scene (`assets/afk-rest.jpg`) to `#afkRestDialog` and `#afkSessionFailure`, harmonized all remaining dialogs and popups (`#languageGate`, `#tutorialDialog`, `#storyCinematic`, `#skillDialog`, `#runResults`, `#patchNotes`, `#socialPopup`, `#multiplayerPrompt`, `#versionNotice`, `#deploymentCheck`) on shared tokens and uniform `✕` close buttons, and eliminated `#versionNotice` overlaps in lobby and battle views.',de:'Handgemalte Bunker-Szene (`assets/afk-rest.jpg`) für `#afkRestDialog` und `#afkSessionFailure` ergänzt, sämtliche übrigen Modale und Popups (`#languageGate`, `#tutorialDialog`, `#storyCinematic`, `#skillDialog`, `#runResults`, `#patchNotes`, `#socialPopup`, `#multiplayerPrompt`, `#versionNotice`, `#deploymentCheck`) auf gemeinsame Tokens und einheitliche `✕`-Buttons abgestimmt sowie `#versionNotice`-Überlappungen behoben.'},
      {en:'Fixed campaign fact mismatches (`18` to `50` missions, `three` to `five` acts), dropped redundant Endless shortcuts (`#endlessArmory`/`#endlessSkills`), localized fallback notices without naming Firebase, renamed `#towerDetailsBack` to `CANCEL`, condensed lobby hints, and removed dead CSS.',de:'Kampagnenfakten (`18` auf `50` Missionen, `drei` auf `fünf` Akte) korrigiert, doppelte Endlos-Abzweige (`#endlessArmory`/`#endlessSkills`) gestrichen, Fallback-Hinweise zweisprachig ohne Firebase-Namen formuliert, `#towerDetailsBack` in `ABBRECHEN`/`CANCEL` umbenannt, Lobby-Hinweise gestrafft und totes CSS entfernt.'},
    ],
    open:[
      {en:'Real desktop and phone inspection on `20261119-block9c` before starting Block 6.',de:'Echte Desktop- und Handy-Sichtung auf `20261119-block9c` vor Beginn von Block 6.'},
    ],
  },
  {
    id:'block9b',build:'20261119-block9b',pr:321,
    title:{en:'Block 9b · Endless Quick-Deploy, Unified Campaign Dossier & Cohesive Artwork',de:'Block 9b · Endlos-Schnellstart, einheitliche Kampagnen-Akte & durchgängige Gemälde'},
    shipped:[
      {en:'Restructured the Endless launcher (`#endlessLaunch`) with a top Quick-Deploy bar (active battlefield readout, Armory/Skills shortcuts, Deploy/Cancel), six cohesive panoramic battlefield cards, and the Endless Record tucked cleanly below.',de:'Endlos-Starter (`#endlessLaunch`) umgebaut: Schnellstart-Leiste oben (gewähltes Gefechtsfeld, Waffenkammer/Skills, Einsatz starten/Abbrechen), sechs stimmige Panorama-Schlachtfelder in der Mitte und Endlos-Bilanz übersichtlich darunter.'},
      {en:'Unified the Campaign Dossier (`#campaignPanel`) with side-by-side Story So Far & painted Act Relic cards (`story-act1..5-relic.jpg`), Act detail banners (`story-act1..5-title.jpg`), Field School artwork cards, Recruiting header painting (`field-recruiting.jpg`), and matching tactical dialogs.',de:'Kampagnen-Akte (`#campaignPanel`) mit paralleler „Bisherige Geschichte“ und illustrierten Akt-Relikten (`story-act1..5-relic.jpg`), Akt-Bannern (`story-act1..5-title.jpg`), Feldschule-Karten, Musterungs-Banner (`field-recruiting.jpg`) sowie passenden Gefechts-Dialogen harmonisiert.'},
      {en:'Replaced flat ground tiles across the Command HQ and Endless Mode with hand-inked panoramic artwork (`endless-frontline.jpg` & biome paintings) and completed DE/EN labels.',de:'Flache Bodenkacheln in Kommandozentrale und Endlos-Modus durch handgezeichnete Panorama-Gemälde (`endless-frontline.jpg` & Biom-Gemälde) ersetzt und DE/EN-Texte ergänzt.'},
    ],
    open:[
      {en:'Real phone and desktop inspection across the updated Endless launcher, Campaign Dossier, Recruiting Office and Command HQ before starting Block 6.',de:'Echte Handy- und Desktop-Sichtung von Endlos-Starter, Kampagnen-Akte, Musterung und Kommando-HQ vor Beginn von Block 6.'},
    ],
  },
  {
    id:'block9',build:'20261119-block9',pr:320,
    title:{en:'Block 9 · Unified Command HQ, Dialog Banners, Endless Terrain & Settings Account',de:'Block 9 · Einheitliches Kommando-HQ, Dialogbanner, Endlos-Gelände & Einstellungen → Konto'},
    shipped:[
      {en:'Consolidated the Command HQ into a fixed desktop 2-column station (>= 860px) and mobile app shell (< 860px) with a compact soldier bar and fixed 4-button bottom navigation bar.',de:'Kommandozentrale als feste Desktop-2-Spalten-Station (>= 860px) und Mobile App-Shell (< 860px) mit kompakter Soldatenzeile und fester 4-Knopf-Daumenleiste vereinheitlicht.'},
      {en:'Applied a unified dark pine and gold palette, [open]-scoped fullscreen dialog sheets, uniform 44x44px close buttons, illustrated 3-zone dialog headers, terrain-illustrated Endless selector cards and matching party/campaign boards.',de:'Durchgängige Tannengrün-/Gold-Optik, [open]-gekoppelte Vollbild-Dialoge, einheitliche 44×44-px-Schließen-Knöpfe, illustrierte 3-Zonen-Dialogbanner, Endlos-Geländekarten sowie angeglichene Party- und Kampagnentafeln umgesetzt.'},
      {en:'Added General / Account tabs inside Settings with in-app password change and reset-email fallback (`password-change.mjs`), moved character discharge (`#menuDeleteCharacter`) into Settings -> Account, and refreshed DE/EN copy.',de:'Einstellungen um die Tabs Allgemein / Konto mit In-App-Passwortänderung und Reset-Mail-Fallback (`password-change.mjs`) erweitert, Charakterentlassung (`#menuDeleteCharacter`) in die Gefahrenzone verschoben und DE/EN-Texte ergänzt.'},
    ],
    open:[
      {en:'Real phone and desktop inspection across the redesigned Command HQ, dialog banners, terrain cards and Settings Account flow before starting Block 6.',de:'Echte Handy- und Desktop-Sichtung von Kommando-HQ, Dialogbannern, Geländekarten und Konto-Reiter vor Beginn von Block 6.'},
    ],
  },
  {
    id:'block5',build:'20261118-block5',pr:318,
    title:{en:'Block 5 · Exclusive 6-Class Skill Tree, Air Defense & Class Tower Paths',de:'Block 5 · Exklusiver 6-Klassen-Skillbaum, Luftabwehr & Klassenturmpfade'},
    shipped:[
      {en:'Added Air Defense as the sixth class (Sky Sweep active ability, aircraft/marked-target passive, two specialist branches, 14-node specialization tree and Skyburst Guidance class tower path).',de:'Luftabwehr als sechste Klasse ergänzt (Luftraumfeger, Luft-/Markierungs-Passiv, zwei Spezialfähigkeiten, 14-Knoten-Spezialisierungsbaum und Klassenturmpfad Flak-Zielsteuerung).'},
      {en:'Switched skills to exclusive level-2 class choice: pick one class at level 2 to unlock its focused 14-node tree, class tower upgrades (Tier I/II separate from level-3 tower kits) and safe Draft Reset before saving.',de:'Skillbaum auf exklusive Klassenwahl ab Stufe 2 umgestellt: Klassenwahl öffnet den fokussierten 14-Knoten-Baum, klassenexklusive Turmausbauwege (Stufe I/II unabhängig von Stufe-3-Turmkits) und sicheren Entwurf-Reset vor dem Speichern.'},
      {en:'Added one-time V1-to-V2 skill migration archiving previous builds locally and refunding all earned points, compact multiplayer wire snapshots, six custom class artworks and branched class trees, 12 specialist battlefield effects plus class tower halos, German/English UI copy, and Block 5 RTDB skills validation rules (`BLOCK5-RULES-TO-PUBLISH.json`, published in Firebase Console per operator confirmation).',de:'Einmalige V1-zu-V2-Migration mit lokalem Altsave-Backup und vollständiger Punkterückerstattung, kompakte Mehrspieler-Snapshots, sechs Klassen-Artworks mit verzweigten Klassenbäumen, zwölf Spezialisten-Kampfeffekte samt Turm-Auren, DE/EN-Übersetzungen sowie Block-5-RTDB-Skills-Regeln (`BLOCK5-RULES-TO-PUBLISH.json`, laut Betreiber in der Firebase Console veröffentlicht).'},
    ],
    open:[
      {en:'Verify all six classes, specialist skills, class tower upgrades and migration notice across real phones and desktop devices.',de:'Alle sechs Klassen, Spezialisten-Skills, Klassenturmpfade und den Migrationshinweis auf echten Handys und am Desktop prüfen.'},
    ],
  },
  {
    id:'patch8',build:'20261031-patch8',pr:317,
    title:{en:'Boss Hunter III & Twin MG III kit fixes + CI matrix retry',de:'Korrekturen für Bossjäger III & Doppel-MG III + CI-Wiederholung'},
    shipped:[
      {en:'Fixed Boss Hunter III (Rank III) so destroying a boss awards the promised +25 team supply bounty and emits the bounty notice without double-counting wave salvage bonuses.',de:'Bossjäger III (Rang III) korrigiert: ein vom Turm zerstörter Boss zahlt jetzt die versprochenen +25 Team-Vorräte samt Kopfgeld-Hinweis aus, ohne Wellen-/Plünderboni doppelt zu zählen.'},
      {en:'Fixed Twin MG III (Rank III) so the aircraft damage multiplier rises to 1.0 (full 22 base damage against planes and air bosses instead of 13.2), while leaving Heavy MG unchanged at 0.6.',de:'Doppel-MG III (Rang III) korrigiert: der Luftziel-Faktor steigt auf 1,0 (volle 22 Grundschaden gegen Flugzeuge und Luft-Bosse statt 13,2), während Schweres MG bei 0,6 bleibt.'},
      {en:'Added at most one automatic retry with child-process cleanup on the 8-job party-finalization-browser CI matrix.',de:'Maximal einen automatischen Wiederholungslauf samt Kindprozess-Bereinigung für die 8-Job-Browser-Matrix party-finalization-browser ergänzt.'},
    ],
    open:[
      {en:'PR #317 CI matrix confirmation, Pages rollout and Block 5 major class/skill overhaul (6th Air Defense class, exclusive level-2 class tree & safe point reset).',de:'PR-#317-CI-Prüfung, Pages-Ausrollung sowie der große Block-5-Klassen-/Skill-Umbau (6. Luftabwehrklasse, exklusive Klassenwahl ab Level 2 & sichere Punkterückgabe).'},
    ],
  },
  {
    id:'patch7',build:'20261031-patch7',pr:316,
    title:{en:'Cross-field maps, cleaner field menu, READY alert & admin link',de:'Durchgehende Karten, aufgeräumtes Feldmenü, READY-Signal & Admin-Login'},
    shipped:[
      {en:'Random endless and multiplayer battlefields (g4 seeds) now always march West↔East across the full width with pads in both halves, while keeping campaign and legacy seeds unchanged.',de:'Zufällige Endlos- und Mehrspieler-Karten (g4-Seeds) verlaufen jetzt immer quer über die volle Breite West↔Ost mit Bauplätzen in beiden Hälften, während Kampagnen- und Altsave-Seeds stabil bleiben.'},
      {en:'Removed redundant Replay Coaching and Command Center buttons from the in-match menu, placing Settings and Sign Out cleanly separated at the bottom.',de:'Unnötige Knöpfe „Coaching wiederholen“ und „Kommandozentrale“ aus dem Gefechtsmenü entfernt; Einstellungen und Abmelden sitzen sauber getrennt ganz unten.'},
      {en:'Added a glowing READY badge and pulse on the action skill button plus a non-blocking readiness alert banner when an ability first becomes ready or finishes recharging.',de:'Aktion-Skill-Knopf mit leuchtendem BEREIT-Abzeichen und Puls hervorgehoben sowie unaufdringliche Bereitschafts-Meldung beim ersten Bereitwerden und nach Abklingzeit ergänzt.'},
      {en:'Added a direct Admin login link inside the sign-in dossier while continuing to strip it from isolated guarded builds.',de:'Direkten Admin-Login-Link in der Anmelde-Akte ergänzt; in isolierten geschützten Test-Builds wird er weiterhin entfernt.'},
    ],
    open:[
      {en:'Real phone and desktop verification across sign-in, cross-field random maps, field menu and READY indicator (CI 13/13 & Pages live via PR #316).',de:'Echte Handy-/Desktop-Abnahme von Login, West↔Ost-Karten, Feldmenü und READY-Signal (CI 13/13 & Pages via PR #316 live).'},
    ],
  },
  {
    id:'patch6',build:'20261031-patch6',pr:315,
    title:{en:'Version dispatch card layout & artwork',de:'Versionshinweis-Layout & Felddepeschen-Motiv'},
    shipped:[
      {en:'Fixed the update dispatch popup with landscape field-dispatch artwork above the text and action row so long German notices never get crushed on narrow phones.',de:'Versionshinweis-Popup mit querformatigem Felddepeschen-Motiv über Text und Knöpfen korrigiert, damit lange deutsche Texte auf schmalen Handys sauber lesbar bleiben.'},
    ],
    open:[
      {en:'Final device acceptance of Block 4 avatars and remaining roadmap blocks.',de:'Abschließende Geräteabnahme der Block-4-Avatare sowie offene Roadmap-Blöcke.'},
    ],
  },
  {
    id:'patch5',build:'20261031-patch5',pr:314,
    title:{en:'Block 4 avatar rebuild & wave rollout',de:'Block-4-Avatar-Neubau & Rollout-Welle'},
    shipped:[
      {en:'Rebuilt avatar generator: 12 clean frontal base heads, 17 hairstyles, 6 beards and 5 shared hair/beard colors tinted at runtime.',de:'Neu aufgebauter Avatar-Baukasten: 12 frontale Basisköpfe, 17 Frisuren, 6 Bärte und 5 gemeinsame Haar-/Bartfarben mit Laufzeit-Färbung.'},
      {en:'Compact on-portrait ◀/▶ steppers with color dots, safe migration of older avatar saves, and matching friend/dossier portraits.',de:'Kompakte ◀/▶-Stepper direkt am Porträt mit Farbpunkten, sichere Migration älterer Avatar-Speicherstände sowie passende Freundes-/Dossier-Porträts.'},
      {en:'Published live friend/avatar database rules (gender/avatar reads and avatar format validation) and earlier interface polish (#299–#312).',de:'Freundes-/Avatar-Datenbankregeln (gender-/avatar-Reads und Avatar-Formatprüfung) sowie vorheriger Oberflächen-Feinschliff (#299–#312) veröffentlicht.'},
    ],
    open:[
      {en:'Real-device acceptance of the new avatars and earlier Block 5/6/7 roadmap items.',de:'Echte Geräteabnahme der neuen Avatare sowie die Punkte aus Block 5, 6 und 7.'},
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
    id:'block1',status:'planned',
    title:{en:'Block 1 · Multiplayer',de:'Block 1 · Mehrspieler'},
    shipped:[
      {en:'Modes, larger fields, request cards, party end and reports are live.',de:'Modi, größere Felder, Anfragekarten, Gruppenabschluss und Berichte sind live.'},
    ],
    open:[
      {en:'Device and network-change tests, longer matches, beginner balance, and what happens with members who never return.',de:'Geräte- und Netzwechseltests, längere Partien, Einsteigerbalance sowie der Umgang mit dauerhaft abwesenden Mitgliedern.'},
    ],
  },
  {
    id:'block2',status:'planned',
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
      {en:'Implemented the sixth Air Defense class, exclusive level-2 class selection, focused 14-node specialization trees, separate Tier I/II class tower upgrade paths, six class medallions, one-time skill refund migration and live-published RTDB skills validation rules (per operator confirmation).',de:'Sechste Luftabwehrklasse, exklusive Klassenwahl ab Stufe 2, fokussierte 14-Knoten-Bäume, getrennte Stufe-I/II-Klassenturmpfade, sechs Klassen-Medaillons, einmalige Punkterückgabe samt Backup sowie laut Betreiber live veröffentlichte RTDB-Skills-Regeln sind umgesetzt.'},
    ],
    open:[
      {en:'Final confirmation across real phones and desktop devices on 20261118-block5 for all six classes, tower upgrades and migration notice.',de:'Abschließende Bestätigung auf echten Handys und am Desktop für 20261118-block5 (alle sechs Klassen, Klassenturmpfade und Migrationshinweis).'},
    ],
  },
  {
    id:'block9',status:'planned',
    title:{en:'Block 9 · Unified Menu & Command HQ Redesign',de:'Block 9 · Einheitliches Menü & Kommando-HQ'},
    note:{
      en:'Shipped ahead of Block 6 so the guided tutorial walkthrough introduces the finished menu layout.',
      de:'Vor Block 6 ausgeliefert, damit die Tutorial-Menüführung direkt auf dem fertigen Menü aufbaut.',
    },
    shipped:[
      {en:'Unified Command HQ (desktop 2-column station & mobile thumb-bar app shell), illustrated 3-zone dialog headers, terrain-illustrated Endless cards, unified party/campaign boards and Settings Account tab (password change + protected character discharge) (#320, 20261119-block9).',de:'Einheitliches Kommando-HQ (Desktop 2-Spalten-Station & Mobile App-Shell mit unterer Daumenleiste), illustrierte 3-Zonen-Dialogbanner, Endlos-Geländekarten, angeglichene Party-/Kampagnentafeln sowie Einstellungen → Konto (#320, 20261119-block9).'},
    ],
    open:[
      {en:'Final confirmation on real phones and desktops ahead of Block 6.',de:'Abschließende Bestätigung auf echten Handys und am Desktop vor Block 6.'},
    ],
  },
  {
    id:'block6',status:'active',
    title:{en:'Block 6 · Tutorial',de:'Block 6 · Tutorial'},
    shipped:[
      {en:'The five-wave introduction, its replay and the confirmed cancel fixes exist.',de:'Die Fünf-Wellen-Einführung, ihre Wiederholung und die bestätigten Abbruchfixes sind vorhanden.'},
    ],
    open:[
      {en:'Character-related accept and decline, one large continuous mission, the general’s voice and the following menu guidance across the Block 9 Command HQ.',de:'Charakterbezogene Annahme und Ablehnung, eine große zusammenhängende Mission, die Generalstimme und die anschließende Menüführung durch das Block-9-HQ.'},
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
