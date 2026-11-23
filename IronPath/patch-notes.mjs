// Field notes: the patch log, readable inside the game.
//
// Why this file exists. The full protocol lives in docs/PATCH-LOG.md and the plan in
// docs/PATCH-BLOECKE.md - both are Markdown for the repository, not for a phone. The
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
//     merge and Pages run are proven - see docs/PATCH-LOG.md.

import {getLanguage} from './language.mjs?v=20261123-skill1';

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
// merge and Pages run are proven in docs/PATCH-LOG.md belong here; `build` is the
// value that shipped in release-version.json, or null when no manifest existed
// yet at that time (PR #286 predates it - verified against the repository).
export const RELEASED_PATCHES=Object.freeze([
  {
    id:'skill1',build:'20261123-skill1',pr:367,
    title:{en:'Ability Recharge Waits for the Next Wave',de:'Fähigkeits-Aufladung wartet auf die nächste Welle'},
    shipped:[
      {en:'The recharge of your action skill now only counts down while a wave is actually running. Once a wave is cleared, the timer waits - you can plan and build in peace, and the skill is exactly as far charged when the next wave starts as it was when the last one ended.',de:'Die Aufladung der Aktionsfähigkeit zählt jetzt nur noch herunter, solange eine Welle wirklich läuft. Ist eine Welle geschafft, wartet der Timer - in Ruhe planen und bauen, und beim Start der nächsten Welle ist die Fähigkeit genau so weit geladen wie am Ende der letzten.'},
      {en:'Moving your soldier and building between waves works as before; only the recharge was ticking when it should not have.',de:'Soldaten bewegen und zwischen den Wellen bauen geht wie bisher; nur die Aufladung ist weitergelaufen, obwohl sie es nicht sollte.'},
      {en:'Raised the cache wave to 20261123-skill1, because the battle core changed: no device should keep fighting under the old sky out of cache.',de:'Die Cache-Welle auf 20261123-skill1 erhöht, weil sich der Gefechtskern geändert hat: Kein Gerät soll mit dem alten Stand aus dem Zwischenspeicher weiterkämpfen.'},
    ],
    open:[
      {en:'Next work package: Block E, the shared life, attack and repair system for soldiers and towers across all modes.',de:'Nächstes Arbeitspaket: Block E, das gemeinsame Lebens-, Angriffs- und Reparatursystem für Soldaten und Türme in allen Modi.'},
    ]
  },
  {
    id:'boss1',build:'20261123-boss1',pr:366,
    title:{en:'Boss Banner · The Boss Is Announced in the Middle of the Field',de:'Boss-Banner · Der Boss wird mittig im Feld angekündigt'},
    shipped:[
      {en:'When a boss wave begins, a banner in the middle of the field announces the boss by name, with his intel below it. It stays for a few seconds and fades away on its own - the small boss plate at the top keeps the fight-long information as before.',de:'Wenn eine Boss-Welle beginnt, kündigt ein Banner mittig im Feld den Boss mit Namen an, darunter seine Intel. Es bleibt wenige Sekunden stehen und blendet von selbst aus - die kleine Boss-Plakette oben behält wie bisher die Informationen für den ganzen Kampf.'},
      {en:'The banner never takes a tap: you can keep building and fighting while it shows. With reduced motion it appears without animation.',de:'Das Banner nimmt keinen Tipp an: Während es steht, kann weiter gebaut und gekämpft werden. Bei reduzierter Bewegung erscheint es ohne Animation.'},
      {en:'Under the hood, a drawing error can no longer freeze the battlefield - the frame keeps running and reports the error once.',de:'Unter der Haube kann ein Zeichenfehler das Gefechtsfeld nicht mehr einfrieren - das Bild läuft weiter und meldet den Fehler einmalig.'},
      {en:'Raised the cache wave to 20261123-boss1, because the field announcement changed: no device should keep fighting under the old sky out of cache.',de:'Die Cache-Welle auf 20261123-boss1 erhöht, weil sich die Feld-Ankündigung geändert hat: Kein Gerät soll mit dem alten Stand aus dem Zwischenspeicher weiterkämpfen.'},
    ],
    open:[
      {en:'Visual check after loading: the stamp must read BUILD 20261123-boss1. Start a boss wave (wave 5): the banner must appear in the middle with the boss name, hold for a few seconds and fade; the small boss plate at the top must look as before.',de:'Sichtprüfung nach dem Laden: Der Stempel muss BUILD 20261123-boss1 zeigen. Eine Boss-Welle (Welle 5) starten: Das Banner muss mittig mit dem Boss-Namen erscheinen, wenige Sekunden stehen und ausblenden; die kleine Boss-Plakette oben muss aussehen wie bisher.'},
      {en:'No device acceptance yet: the banner has not been checked on an iPhone or iPad.',de:'Noch keine Geräteabnahme: Das Banner ist nicht auf einem iPhone oder iPad geprüft.'},
      {en:'Older visual checks are still open: the pulsing build-pad rings (20261122-ring1), BUILD 20261122-core1 (login scene, battles), the workshop and the German texts.',de:'Ältere Sichtprüfungen stehen weiter aus: die pulsierenden Bauplatz-Ringe (20261122-ring1), BUILD 20261122-core1 (Anmelde-Szene, Gefechte), die Werkstatt und die Deutsch-Texte.'},
    ]
  },
  {
    id:'ring1',build:'20261122-ring1',pr:364,
    title:{en:'Build Pads · Thicker, Pulsing Selection Rings',de:'Bauplätze · Dickere, pulsierende Auswahlringe'},
    shipped:[
      {en:'The ring around a selected build pad is thicker and breathes gently, so your current selection reads at a glance - on an empty pad and around the range circle of the tower standing on it.',de:'Der Ring um einen gewählten Bauplatz ist dicker und atmet sanft, damit die aktuelle Auswahl auf einen Blick lesbar ist - auf dem leeren Platz und um den Reichweiten-Kreis des Turms darauf.'},
      {en:'If you have reduced motion enabled, both rings stand still. Nothing else changes: no hover preview, no new texts, same game.',de:'Wer reduzierte Bewegung aktiviert hat, sieht beide Ringe ruhig stehen. Sonst ändert sich nichts: keine Hover-Vorschau, keine neuen Texte, gleiches Spiel.'},
      {en:'Raised the cache wave to 20261122-ring1, because the battlefield drawing changed: no device should keep painting the old thin ring out of cache.',de:'Die Cache-Welle auf 20261122-ring1 erhöht, weil sich die Gefechts-Zeichnung geändert hat: Kein Gerät soll weiter den alten dünnen Ring aus dem Zwischenspeicher malen.'},
    ],
    open:[
      {en:'Visual check after loading: the stamp must read BUILD 20261122-ring1. Select a build pad (empty and with a tower) - the ring must be clearly thicker than before and pulse gently; with reduced motion on, it must stand still.',de:'Sichtprüfung nach dem Laden: Der Stempel muss BUILD 20261122-ring1 zeigen. Einen Bauplatz wählen (leer und mit Turm) - der Ring muss deutlich dicker sein als vorher und sanft pulsieren; bei aktivierter reduzierter Bewegung muss er ruhig stehen.'},
      {en:'No device acceptance yet: the rings have not been checked on an iPhone or iPad.',de:'Noch keine Geräteabnahme: Die Ringe sind nicht auf einem iPhone oder iPad geprüft.'},
      {en:'Older visual checks are still open: BUILD 20261122-core1 (login scene, a solo battle and an online party), the workshop and the German texts.',de:'Ältere Sichtprüfungen stehen weiter aus: BUILD 20261122-core1 (Anmelde-Szene, ein Solo-Gefecht und eine Online-Party), die Werkstatt und die Deutsch-Texte.'},
    ]
  },
  {
    id:'core1',build:'20261122-core1',pr:358,
    title:{en:'Structure Move 6 · The Core Modules Now Live in core/ - the New Layout Is Complete',de:'Struktur-Umzug 6 · Die Kern-Module liegen jetzt in core/ - die neue Ordnung ist komplett'},
    shipped:[
      {en:'Nothing changes in the game itself: every battle, menu and online match behaves exactly as before. Only the addresses of the core files moved.',de:'Am Spiel selbst ändert sich nichts: Jedes Gefecht, Menü und Online-Spiel verhält sich genau wie vorher. Nur die Adressen der Kern-Dateien sind umgezogen.'},
      {en:'All 101 remaining game modules moved from the flat game folder into IronPath/core/. Only the entry points (account, game start, language) plus the pages and stylesheets stay in the top folder, next to the six domain folders battle/, core/, i18n/, net/, ui/ and workshop/.',de:'Alle 101 verbliebenen Spielmodule sind aus dem flachen Spielordner nach IronPath/core/ gezogen. Nur die Eintrittspunkte (Konto, Spielstart, Sprache) sowie Seiten und Stylesheets bleiben im Hauptordner, neben den sechs Fach-Ordnern battle/, core/, i18n/, net/, ui/ und workshop/.'},
      {en:'82 of the 101 modules are byte-identical to before; in the other 19 only the import paths point one folder up.',de:'82 der 101 Module sind bytegleich zu vorher; in den anderen 19 zeigen nur die Import-Pfade einen Ordner höher.'},
      {en:'Raised the cache wave to 20261122-core1, because the module addresses changed: no device should keep loading the core code from its old place out of cache.',de:'Die Cache-Welle auf 20261122-core1 erhöht, weil sich die Modul-Adressen geändert haben: Kein Gerät soll den Kern-Code weiter unter der alten Adresse aus dem Zwischenspeicher laden.'},
    ],
    open:[
      {en:'Visual check after loading: the stamp must read BUILD 20261122-core1. The honest test for this move is the whole game: the login scene, a solo battle and an online party must work exactly as before.',de:'Sichtprüfung nach dem Laden: Der Stempel muss BUILD 20261122-core1 zeigen. Der ehrliche Test für diesen Umzug ist das ganze Spiel: Anmelde-Szene, ein Solo-Gefecht und eine Online-Party müssen genau wie vorher funktionieren.'},
      {en:'No device acceptance yet: this move has not been checked on an iPhone or iPad.',de:'Noch keine Geräteabnahme: Dieser Umzug ist nicht auf einem iPhone oder iPad geprüft.'},
      {en:'Note for rollbacks: protected builds from before this release cannot be verified with the new file list - a rollback must point at builds from 20261122-core1 onward.',de:'Hinweis für Rollbacks: Geschützte Builds von vor diesem Stand lassen sich mit der neuen Dateiliste nicht mehr prüfen - ein Rollback muss auf Stände ab 20261122-core1 zeigen.'},
      {en:'Next: the three patch scripts merge into a single patch command (structure phase 3). Still parked: the thicker pulsing selection ring on build pads (without any hover preview), as its own game release.',de:'Als Nächstes: Die drei Patch-Skripte werden zu einem einzigen Patch-Befehl zusammengeführt (Struktur-Phase 3). Weiter geparkt: der dickere pulsierende Auswahlring auf Bauplätzen (ohne jede Hover-Vorschau), als eigener Spiel-Stand.'},
    ]
  },
  {
    id:'ui1',build:'20261122-ui1',pr:356,
    title:{en:'Structure Move 5 · The Interface Modules Now Live in ui/',de:'Struktur-Umzug 5 · Die Oberflächen-Module liegen jetzt in ui/'},
    shipped:[
      {en:'Nothing changes in the game itself: menus, dialogs and the heads-up display behave exactly as before. Only the addresses of the interface files moved.',de:'Am Spiel selbst ändert sich nichts: Menüs, Dialoge und die HUD-Anzeige verhalten sich genau wie vorher. Nur die Adressen der Oberflächen-Dateien sind umgezogen.'},
      {en:'All 25 interface modules (screens, menus, dialogs and HUD parts such as the login scene, the field menu and the ability HUD) moved from the flat game folder into IronPath/ui/.',de:'Alle 25 Oberflächen-Module (Bildschirme, Menüs, Dialoge und HUD-Teile wie die Anmelde-Szene, das Feldmenü und das Fähigkeits-HUD) sind aus dem flachen Spielordner nach IronPath/ui/ gezogen.'},
      {en:'12 of the 25 modules are byte-identical to before; in the other 13 only the import paths point one folder up.',de:'12 der 25 Module sind bytegleich zu vorher; in den anderen 13 zeigen nur die Import-Pfade einen Ordner höher.'},
      {en:'Raised the cache wave to 20261122-ui1, because the module addresses changed: no device should keep loading the interface code from its old place out of cache.',de:'Die Cache-Welle auf 20261122-ui1 erhöht, weil sich die Modul-Adressen geändert haben: Kein Gerät soll den Oberflächen-Code weiter unter der alten Adresse aus dem Zwischenspeicher laden.'},
    ],
    open:[
      {en:'Visual check after loading: the stamp must read BUILD 20261122-ui1. The honest test for this move is the interface itself: the login scene, menus and dialogs plus a battle with the HUD must work exactly as before.',de:'Sichtprüfung nach dem Laden: Der Stempel muss BUILD 20261122-ui1 zeigen. Der ehrliche Test für diesen Umzug ist die Oberfläche selbst: Anmelde-Szene, Menüs und Dialoge plus ein Gefecht mit HUD müssen genau wie vorher funktionieren.'},
      {en:'No device acceptance yet: this move has not been checked on an iPhone or iPad.',de:'Noch keine Geräteabnahme: Dieser Umzug ist nicht auf einem iPhone oder iPad geprüft.'},
      {en:'One structure move remains: core/. The dictionaries live in i18n/, the workshop in workshop/, the multiplayer client in net/, the battle modules in battle/.',de:'Ein Struktur-Umzug bleibt: core/. Die Wörterbücher liegen in i18n/, die Werkstatt in workshop/, der Mehrspieler-Client in net/, die Kampf-Module in battle/.'},
      {en:'Still parked until the structure is done: the thicker pulsing selection ring on build pads (without any hover preview), as its own game release.',de:'Bis die Struktur steht, bleibt geparkt: der dickere pulsierende Auswahlring auf Bauplätzen (ohne jede Hover-Vorschau), als eigener Spiel-Stand.'},
    ]
  },
  {
    id:'battle1',build:'20261122-battle1',pr:354,
    title:{en:'Structure Move 4 · The Battle Modules Now Live in battle/',de:'Struktur-Umzug 4 · Die Kampf-Module liegen jetzt in battle/'},
    shipped:[
      {en:'Nothing changes in the game itself: battles, sound and camera behave exactly as before. Only the addresses of the battle files moved.',de:'Am Spiel selbst ändert sich nichts: Gefechte, Klang und Kamera verhalten sich genau wie vorher. Nur die Adressen der Kampf-Dateien sind umgezogen.'},
      {en:'All 6 battle modules (battle-*.mjs: battle sound and music, the viewport camera and the XP heads-up display) moved from the flat game folder into IronPath/battle/.',de:'Alle 6 Kampf-Module (battle-*.mjs: Kampf-Klang und -Musik, die Viewport-Kamera und die XP-Anzeige) sind aus dem flachen Spielordner nach IronPath/battle/ gezogen.'},
      {en:'4 of the 6 modules are byte-identical to before; in the other 2 only a single import path points one folder up.',de:'4 der 6 Module sind bytegleich zu vorher; in den anderen 2 zeigt nur je ein Import-Pfad einen Ordner höher.'},
      {en:'Raised the cache wave to 20261122-battle1, because the module addresses changed: no device should keep loading the battle code from its old place out of cache.',de:'Die Cache-Welle auf 20261122-battle1 erhöht, weil sich die Modul-Adressen geändert haben: Kein Gerät soll den Kampf-Code weiter unter der alten Adresse aus dem Zwischenspeicher laden.'},
    ],
    open:[
      {en:'Visual check after loading: the stamp must read BUILD 20261122-battle1. The honest test for this move is a battle: sound, camera movement and the XP display must work exactly as before.',de:'Sichtprüfung nach dem Laden: Der Stempel muss BUILD 20261122-battle1 zeigen. Der ehrliche Test für diesen Umzug ist ein Gefecht: Klang, Kamera-Bewegung und XP-Anzeige müssen genau wie vorher funktionieren.'},
      {en:'No device acceptance yet: this move has not been checked on an iPhone or iPad.',de:'Noch keine Geräteabnahme: Dieser Umzug ist nicht auf einem iPhone oder iPad geprüft.'},
      {en:'Next structure moves, one folder per release: ui/ and core/. The dictionaries live in i18n/, the workshop in workshop/, the multiplayer client in net/.',de:'Die nächsten Struktur-Umzüge, je ein Ordner pro Stand: ui/ und core/. Die Wörterbücher liegen in i18n/, die Werkstatt in workshop/, der Mehrspieler-Client in net/.'},
      {en:'Still parked until the structure is done: the thicker pulsing selection ring on build pads (without any hover preview), as its own game release.',de:'Bis die Struktur steht, bleibt geparkt: der dickere pulsierende Auswahlring auf Bauplätzen (ohne jede Hover-Vorschau), als eigener Spiel-Stand.'},
    ]
  },
  {
    id:'net1',build:'20261122-net1',pr:352,
    title:{en:'Structure Move 3 · The Multiplayer Client Modules Now Live in net/',de:'Struktur-Umzug 3 · Die Mehrspieler-Clientmodule liegen jetzt in net/'},
    shipped:[
      {en:'Nothing changes in the game itself: lobbies, parties and online matches run exactly as before. Only the addresses of the network files moved.',de:'Am Spiel selbst ändert sich nichts: Lobbys, Partys und Online-Gefechte laufen genau wie vorher. Nur die Adressen der Netzwerk-Dateien sind umgezogen.'},
      {en:'All 15 Firebase client modules (firebase-*.mjs: party channel and sessions, four-player lobby, durable and recovery sessions) moved from the flat game folder into IronPath/net/. The firebase/ folder with the database rules stays where it is.',de:'Alle 15 Firebase-Clientmodule (firebase-*.mjs: Party-Kanal und -Sitzungen, Vierer-Lobby, Durable- und Recovery-Sitzungen) sind aus dem flachen Spielordner nach IronPath/net/ gezogen. Der Ordner firebase/ mit den Datenbank-Regeln bleibt, wo er ist.'},
      {en:'6 of the 15 modules are byte-identical to before; in the other 9 only the import paths point one folder up.',de:'6 der 15 Module sind bytegleich zu vorher; in den anderen 9 zeigen nur die Import-Pfade einen Ordner höher.'},
      {en:'Raised the cache wave to 20261122-net1, because the module addresses changed: no device should keep loading the network code from its old place out of cache.',de:'Die Cache-Welle auf 20261122-net1 erhöht, weil sich die Modul-Adressen geändert haben: Kein Gerät soll den Netzwerk-Code weiter unter der alten Adresse aus dem Zwischenspeicher laden.'},
    ],
    open:[
      {en:'Visual check after loading: the stamp must read BUILD 20261122-net1. The honest test for this move is online: create or join a party and start a match - the lobby must behave exactly as before.',de:'Sichtprüfung nach dem Laden: Der Stempel muss BUILD 20261122-net1 zeigen. Der ehrliche Test für diesen Umzug ist online: Party erstellen oder beitreten und ein Gefecht starten - die Lobby muss sich genau wie vorher verhalten.'},
      {en:'No device acceptance yet: this move has not been checked on an iPhone or iPad.',de:'Noch keine Geräteabnahme: Dieser Umzug ist nicht auf einem iPhone oder iPad geprüft.'},
      {en:'Next structure moves, one folder per release: battle/, ui/ and core/. The dictionaries live in i18n/, the workshop in workshop/.',de:'Die nächsten Struktur-Umzüge, je ein Ordner pro Stand: battle/, ui/ und core/. Die Wörterbücher liegen in i18n/, die Werkstatt in workshop/.'},
      {en:'Still parked until the structure is done: the thicker pulsing selection ring on build pads (without any hover preview), as its own game release.',de:'Bis die Struktur steht, bleibt geparkt: der dickere pulsierende Auswahlring auf Bauplätzen (ohne jede Hover-Vorschau), als eigener Spiel-Stand.'},
    ],
  },
  {
    id:'workshop1',build:'20261122-workshop1',pr:350,
    title:{en:'Structure Move 2 · The Workshop Modules Now Live in workshop/',de:'Struktur-Umzug 2 · Die Werkstatt-Module liegen jetzt in workshop/'},
    shipped:[
      {en:'Nothing changes in the game itself: the workshop opens, builds and saves exactly as before. Only the addresses of its files moved.',de:'Am Spiel selbst ändert sich nichts: Die Werkstatt öffnet, baut und speichert genau wie vorher. Nur die Adressen ihrer Dateien sind umgezogen.'},
      {en:'All 17 workshop modules (workshop-*.mjs) moved from the flat game folder into IronPath/workshop/. The workshop stylesheet stays in the game folder, like every stylesheet.',de:'Alle 17 Werkstatt-Module (workshop-*.mjs) sind aus dem flachen Spielordner nach IronPath/workshop/ gezogen. Das Werkstatt-Stylesheet bleibt wie jedes Stylesheet im Spielordner.'},
      {en:'7 of the 17 modules are byte-identical to before; in the other 10 only the import paths point one folder up.',de:'7 der 17 Module sind bytegleich zu vorher; in den anderen 10 zeigen nur die Import-Pfade einen Ordner höher.'},
      {en:'Raised the cache wave to 20261122-workshop1, because the module addresses changed: no device should keep loading the workshop from its old place out of cache.',de:'Die Cache-Welle auf 20261122-workshop1 erhöht, weil sich die Modul-Adressen geändert haben: Kein Gerät soll die Werkstatt weiter unter der alten Adresse aus dem Zwischenspeicher laden.'},
    ],
    open:[
      {en:'Visual check after loading: the stamp must read BUILD 20261122-workshop1, and the workshop must open with your items, scrap and equipped parts exactly as before.',de:'Sichtprüfung nach dem Laden: Der Stempel muss BUILD 20261122-workshop1 zeigen, und die Werkstatt muss mit deinen Gegenständen, Schrott und ausgerüsteten Teilen genau wie vorher öffnen.'},
      {en:'No device acceptance yet: this move has not been checked on an iPhone or iPad.',de:'Noch keine Geräteabnahme: Dieser Umzug ist nicht auf einem iPhone oder iPad geprüft.'},
      {en:'Next structure moves, one folder per release: net/ (multiplayer client modules), battle/, ui/ and core/. The dictionaries already live in i18n/.',de:'Die nächsten Struktur-Umzüge, je ein Ordner pro Stand: net/ (Mehrspieler-Clientmodule), battle/, ui/ und core/. Die Wörterbücher liegen bereits in i18n/.'},
      {en:'Still parked until the structure is done: the thicker pulsing selection ring on build pads (without any hover preview), as its own game release.',de:'Bis die Struktur steht, bleibt geparkt: der dickere pulsierende Auswahlring auf Bauplätzen (ohne jede Hover-Vorschau), als eigener Spiel-Stand.'},
    ],
  },
  {
    id:'i18n1',build:'20261122-i18n1',pr:348,
    title:{en:'Structure Move 1 · The German Dictionaries Now Live in i18n/',de:'Struktur-Umzug 1 · Die deutschen Wörterbücher liegen jetzt in i18n/'},
    shipped:[
      {en:'This release changes nothing you can see in the game: every text, every translation and every screen is exactly as before. What moved is where the files live.',de:'Dieser Stand ändert am sichtbaren Spiel nichts: Jeder Text, jede Übersetzung und jeder Bildschirm ist genau wie vorher. Geändert hat sich nur, wo die Dateien liegen.'},
      {en:'All 18 German dictionary files (localization-*-de.mjs) moved from the flat game folder into IronPath/i18n/, so the game folder stops being one long list of almost 200 modules.',de:'Alle 18 deutschen Wörterbuch-Dateien (localization-*-de.mjs) sind aus dem flachen Spielordner nach IronPath/i18n/ gezogen, damit der Spielordner nicht länger eine einzige Liste aus fast 200 Modulen ist.'},
      {en:'14 of the 18 dictionaries are byte-identical to before; in the other 4 only the import paths point one folder up. The language module in the game folder now loads its dictionaries from i18n/.',de:'14 der 18 Wörterbücher sind bytegleich zu vorher; in den anderen 4 zeigen nur die Import-Pfade einen Ordner höher. Das Sprachmodul im Spielordner lädt seine Wörterbücher jetzt aus i18n/.'},
      {en:'The release packager and the structure guards learned the new folder first (previous release), so the moved files are staged and checked exactly like the ones still in the game folder.',de:'Packager und Struktur-Wächter haben den neuen Ordner vorher gelernt (letzter Stand), sodass die umgezogenen Dateien genauso gestagt und geprüft werden wie die übrigen im Spielordner.'},
      {en:'Raised the cache wave to 20261122-i18n1, because the dictionary addresses changed: no device should keep loading them from the old place out of its cache.',de:'Die Cache-Welle auf 20261122-i18n1 erhöht, weil sich die Wörterbuch-Adressen geändert haben: Kein Gerät soll sie weiter unter der alten Adresse aus dem Zwischenspeicher laden.'},
    ],
    open:[
      {en:'Visual check after loading: the stamp must read BUILD 20261122-i18n1 in the loading scene and in settings, and switching the language to German must show German texts everywhere as before.',de:'Sichtprüfung nach dem Laden: Der Stempel muss in der Ladeszene und in den Einstellungen BUILD 20261122-i18n1 zeigen, und nach dem Umstellen auf Deutsch müssen überall wie bisher deutsche Texte stehen.'},
      {en:'No device acceptance yet: this move has not been checked on an iPhone or iPad.',de:'Noch keine Geräteabnahme: Dieser Umzug ist nicht auf einem iPhone oder iPad geprüft.'},
      {en:'The next structure moves follow one folder per release: workshop/, net/, battle/, ui/ and core/. Entry points, HTML and stylesheets stay in the game folder.',de:'Die nächsten Struktur-Umzüge folgen mit je einem Ordner pro Stand: workshop/, net/, battle/, ui/ und core/. Eintrittspunkte, HTML und Stylesheets bleiben im Spielordner.'},
      {en:'Still parked until the structure is done: the thicker pulsing selection ring on build pads (without any hover preview), as its own game release.',de:'Bis die Struktur steht, bleibt geparkt: der dickere pulsierende Auswahlring auf Bauplätzen (ohne jede Hover-Vorschau), als eigener Spiel-Stand.'},
    ],
  },
  {
    id:'order1',build:'20261121-order1',pr:342,
    title:{en:'Repository Housekeeping · Game Folder Separated from Working Material',de:'Ordnung im Repository · Spielordner von Arbeitsmaterial getrennt'},
    shipped:[
      {en:'This release changes nothing in the game: art, simulation, balance, saved progress and multiplayer are untouched. What was tidied is the repository, not the battlefield.',de:'Dieser Stand ändert am Spiel nichts: Grafik, Simulation, Balance, Speicherstände und Mehrspieler sind unverändert. Geräumt wurde das Repository, nicht das Gefechtsfeld.'},
      {en:'Documentation and development scripts no longer sit among the game files. They live in IronPath/docs/ and IronPath/scripts/, and the game folder itself now holds only what a browser actually loads.',de:'Dokumente und Entwicklungsskripte liegen nicht mehr zwischen den Spieldateien. Sie liegen in IronPath/docs/ und IronPath/scripts/, und im Spielordner selbst liegt nur noch, was ein Browser tatsächlich lädt.'},
      {en:'Three modules that nothing imported are out of the shipped package: they used to be copied into every release build without ever running.',de:'Drei Module, die nichts importierte, sind aus dem Auslieferungspaket heraus: sie wurden bisher in jeden Release-Build kopiert, ohne je zu laufen.'},
      {en:'New tools check the build stamp, the folder structure and the patch log before and after every patch, and they raise the stamp across all files in one pass. That used to be hand work over 79 files.',de:'Neue Werkzeuge prüfen die Baukennung, die Ordnerstruktur und das Patch-Log vor und nach jedem Patch und ziehen die Kennung in einem Zug über alle Dateien. Das war bisher Handarbeit über 79 Dateien.'},
      {en:'The patch log keeps the newest 20 entries and 71 older ones moved to an archive. A test proves both together are gapless and free of duplicates, so nothing was lost in the split.',de:'Das Patch-Log führt die neuesten 20 Einträge, 71 ältere wanderten in ein Archiv. Ein Test belegt, dass beide zusammen lückenlos und doppelfrei sind - beim Teilen ging also nichts verloren.'},
      {en:'A missing record was added: the proven events for #341 (CI runs, merge commit, Pages build, delivery check) existed only on a working branch and were absent from the log on main.',de:'Ein fehlender Beleg ist nachgetragen: die geprüften Ereignisse zu #341 (CI-Läufe, Merge-Commit, Pages-Build, Auslieferungsprüfung) standen nur in einem Arbeitszweig und fehlten im Log auf main.'},
      {en:'Raised the cache wave to 20261121-order1 across 79 files, so no device keeps serving the previous modules from its cache under an unchanged address.',de:'Die Cache-Welle in 79 Dateien auf 20261121-order1 erhöht, damit kein Gerät die vorherigen Module unter unveränderter Adresse weiter aus dem Zwischenspeicher liefert.'},
    ],
    open:[
      {en:'Visual check after loading: the stamp must read BUILD 20261121-order1 in the loading scene and in settings. An older stamp means cache, not code.',de:'Sichtprüfung nach dem Laden: Der Stempel muss in der Ladeszene und in den Einstellungen BUILD 20261121-order1 zeigen. Ein älterer Stempel bedeutet Zwischenspeicher, nicht Code.'},
      {en:'No device acceptance: this release has not been checked on an iPhone or iPad. Because nothing in the game changed, the freeze reported earlier is neither confirmed nor ruled out by it.',de:'Keine Geräteabnahme: Dieser Stand ist nicht auf einem iPhone oder iPad geprüft. Weil sich am Spiel nichts änderte, ist das früher gemeldete Einfrieren damit weder bestätigt noch widerlegt.'},
      {en:'Still open from earlier releases: accepting the road on real curves (#341) on a device, and part 2 - the thicker pulsing selection ring on build pads with a hover preview naming the wave and the next enemies, including the missing German entries for four literals.',de:'Weiter offen aus früheren Ständen: die Straße auf echten Kurven (#341) auf einem Gerät abzunehmen, und Teil 2 - der dickere pulsierende Auswahlring auf Bauplätzen mit Hover-Vorschau, die Welle und nächste Gegner nennt, einschließlich der fehlenden deutschen Einträge für vier Literale.'},
      {en:'GitHub Pages still publishes the whole tree: documentation and tests stay publicly reachable under /IronPath/docs/ and /IronPath/tests/, and the old addresses /IronPath/*.md no longer work. Keeping working material out of the delivery would need an Actions build - deliberately not chosen.',de:'GitHub Pages veröffentlicht weiterhin den ganzen Baum: Doku und Tests bleiben unter /IronPath/docs/ und /IronPath/tests/ öffentlich erreichbar, die alten Adressen /IronPath/*.md gelten nicht mehr. Arbeitsmaterial wirklich nicht auszuliefern bräuchte einen Actions-Build - bewusst nicht gewählt.'},
      {en:'game-regressions is still not a required check, and it was red for #335 through #339 while those were merged anyway. Only the repository owner can change that setting.',de:'game-regressions ist weiter kein Pflicht-Check und war bei #335 bis #339 jeweils rot, während diese trotzdem gemergt wurden. Nur der Betreiber kann das im Repository umstellen.'},
      {en:'Nothing was deleted, as decided: the three relocated modules and the one-byte file IronPath/empty stay in the tree, documented as unreferenced.',de:'Gelöscht wurde nichts, wie entschieden: die drei umgeräumten Module und die 1-Byte-Datei IronPath/empty bleiben im Baum und sind als unreferenziert dokumentiert.'},
    ],
  },
  {
    id:'road1',build:'20261121-road1',pr:341,
    title:{en:'Road and Rail Rebuilt on Real Curves · Ground Tracks Return',de:'Straße und Schiene auf echten Kurven neu gebaut · Bodenspuren zurück'},
    shipped:[
      {en:'Roads and rails are now painted from one smooth ribbon with genuinely rounded bends instead of straight bars butting into sharp corners. Wheel ruts no longer tear apart at every corner, the rails no longer cut across the bend, and sleepers, planks and kerb details run through the curve instead of stopping short of it.',de:'Straßen und Schienen werden jetzt aus einem durchgehenden glatten Band mit echten Rundungen gemalt statt aus geraden Balken, die an scharfen Ecken zusammenstoßen. Spurrillen reißen an keiner Ecke mehr auseinander, die Schienen schneiden nicht mehr über die Kurve, und Schwellen, Planken und Bordsteindetails laufen durch die Kurve statt davor zu enden.'},
      {en:'A short 30-pixel stretch in Pinewood Crossing used to vanish completely inside the bulges around it. It is now a clean S-bend you can actually see.',de:'Ein kurzes 30-Pixel-Stück in Pinewood Crossing verschwand vollständig in den Wülsten um es herum. Es ist jetzt ein sauberer S-Bogen, den man wirklich sieht.'},
      {en:'The road design comes back for eight biomes: kerb and gutter in the city, corduroy planks with twin guardrails in the marsh, drifts and ice cracks in the arctic, rock in the scrubland, undergrowth in the forest, lane markings and a dashed centre line on paved ground, plus a seamless road texture per biome.',de:'Das Straßendesign kommt für acht Biome zurück: Bordstein und Rinne in der Stadt, Bohlenweg mit zwei Guardrails im Marsch, Schneewehen und Eisrisse in der Arktis, Gestein in der Steppe, Unterholz im Wald, Fahrbahnmarkierungen und gestrichelte Mittellinie auf befestigtem Grund, dazu eine nahtlose Straßentextur je Biom.'},
      {en:'Ground tracks are back: boot prints behind soldiers, cleat marks behind tanks, wheel wear on rails. They fade within seconds and are painted over the cached battlefield, so they never bake into the map.',de:'Bodenspuren sind zurück: Stiefelabdrücke hinter Soldaten, Kettenabdrücke hinter Panzern, Spurverschleiß auf Schienen. Sie verblassen innerhalb weniger Sekunden und werden über das zwischengespeicherte Gefechtsfeld gemalt, backen also nie in die Karte ein.'},
      {en:'Fixed two faults the first version of the tracks had: in versus play both battlefields shared one recorder and cancelled each other out, so no footprint ever appeared, and tracks could survive a co-op reconnect into the next battle.',de:'Zwei Fehler der ersten Spur-Fassung behoben: Im Versus-Spiel teilten sich beide Gefechtsfelder einen Rekorder und hoben einander auf, sodass nie ein Abdruck erschien; außerdem konnten Spuren eine Koop-Neuverbindung in das nächste Gefecht überstehen.'},
      {en:'Raised the cache wave to 20261121-road1 across 79 files, so a phone cannot keep serving the previous modules from its cache under an unchanged address.',de:'Die Cache-Welle in 79 Dateien auf 20261121-road1 erhöht, damit ein Handy die vorherigen Module nicht unter unveränderter Adresse weiter aus dem Cache liefert.'},
    ],
    open:[
      {en:'Units still walk the exact angular path the simulation uses; only the picture is rounded. At a 90-degree bend the corner sits 14.1 pixels off the smoothed centre line, well inside the 30-pixel half-width of the driving surface, so a unit never leaves the asphalt - but it can look as though it clips the corner slightly. That bound is pinned by a test so a later change cannot quietly push units off the road.',de:'Einheiten laufen weiter exakt den eckigen Pfad der Simulation; gerundet ist nur das Bild. Bei einer 90-Grad-Ecke liegt die Ecke 14,1 Pixel neben der geglätteten Mittellinie, deutlich innerhalb der 30 Pixel Halbbreite der Fahrbahn - eine Einheit verlässt den Asphalt also nie, kann aber optisch die Kurve leicht schneiden. Diese Grenze ist per Test festgeschrieben, damit eine spätere Änderung nicht stillschweigend Einheiten von der Straße schiebt.'},
      {en:'No device acceptance yet: the new look has not been checked on an iPhone or iPad. The freeze reported earlier is neither confirmed nor ruled out by this patch - the one proven cause of it stays removed and is not reintroduced here.',de:'Noch keine Geräteabnahme: Die neue Optik ist nicht auf einem iPhone oder iPad geprüft. Das früher gemeldete Einfrieren ist durch diesen Patch weder bestätigt noch ausgeschlossen - die einzige belegte Ursache bleibt entfernt und wird hier nicht wieder eingeführt.'},
      {en:'Visual check after loading: the stamp must read BUILD 20261121-road1 in the loading scene and in settings. An older stamp means cache, not code.',de:'Sichtprüfung nach dem Laden: Der Stempel muss in der Ladeszene und in den Einstellungen BUILD 20261121-road1 zeigen. Ein älterer Stempel bedeutet Cache, nicht Code.'},
      {en:'Still to come, as its own release: the build-pad selection ring, thicker and pulsing, with a hover preview that names the wave and how many enemies are next - including the missing German entries for four literals.',de:'Kommt noch, als eigene Veröffentlichung: der Auswahlring auf Bauplätzen, dicker und pulsierend, mit Hover-Vorschau, die die Welle und die Anzahl der nächsten Gegner nennt - einschließlich der fehlenden deutschen Einträge für vier Literale.'},
    ],
  },
  {
    id:'rollback1',build:'20261121-rollback1',pr:340,
    title:{en:'Rollback to the Last Green Build · Battlefield Freeze Investigated',de:'Rückbau auf den letzten grünen Stand · Einfrieren des Gefechtsfelds untersucht'},
    shipped:[
      {en:'Rolled the whole game back to the state of pull request #334, the last build whose regression suite was green. Nothing else moved: the difference against that state is only the new cache wave, so gameplay, balance and saved progress stay untouched.',de:'Das gesamte Spiel auf den Stand von Pull-Request #334 zurückgesetzt — den letzten Build, dessen Regressionssuite grün war. Sonst ändert sich nichts: Die Differenz zu diesem Stand ist ausschließlich die neue Cache-Welle, Spiellogik, Balance und gespeicherter Fortschritt bleiben unberührt.'},
      {en:'Removed a crash that arrived afterwards: the boss announcement called a phase label that was never imported, which killed the frame loop and froze the battlefield from wave 5 onward. Reproduced against a real boss unit before the fix.',de:'Ein danach entstandener Absturz entfernt: Die Boss-Ankündigung rief eine Phasenbezeichnung auf, die nie importiert war. Das beendete die Bildschleife und ließ das Gefechtsfeld ab Welle 5 einfrieren. Vor dem Rückbau gegen eine echte Boss-Einheit nachgestellt.'},
      {en:'Also removed 22 broken test harnesses caused by a new ground module that was never registered in them: since that release no test checked whether the game script loads at all.',de:'Ebenfalls entfernt: 22 kaputte Test-Harnesses, weil ein neues Bodenmodul dort nie eingetragen war. Seit dieser Veröffentlichung prüfte kein Test mehr, ob das Spiel-Skript überhaupt lädt.'},
      {en:'Restored the project journal a later change had overwritten instead of extended: 3711 lines instead of 257, entries IPL-0001 through IPL-0089 are back and the numbering continues correctly.',de:'Das Projektjournal wiederhergestellt, das eine spätere Änderung ersetzt statt fortgeschrieben hatte: 3711 statt 257 Zeilen, die Einträge IPL-0001 bis IPL-0089 sind zurück und die Zählung läuft korrekt weiter.'},
      {en:'Raised the cache wave to 20261121-rollback1 across 79 files, because the five previous releases had kept the old stamp: a phone would otherwise keep serving the faulty modules from its cache under an unchanged address.',de:'Die Cache-Welle in 79 Dateien auf 20261121-rollback1 erhöht, weil die fünf vorherigen Veröffentlichungen den alten Stempel behalten hatten: Ein Handy liefert die fehlerhaften Module sonst unter unveränderter Adresse weiter aus dem Cache.'},
    ],
    open:[
      {en:'The reported freeze on iPhone/iPad Safari right at game start (first tower built or first wave started) could NOT be reproduced in any automated run, so this rollback is an unproven remedy, not a verified fix. Real device acceptance is outstanding.',de:'Das gemeldete Einfrieren auf iPhone/iPad Safari direkt ab Spielstart (erster Turmbau oder erste Welle) ließ sich in keinem automatisierten Lauf nachstellen. Dieser Rückbau ist deshalb eine unbewiesene Abhilfe, kein belegter Fix. Die echte Geräteabnahme steht aus.'},
      {en:'Visual check after loading: the stamp must read BUILD 20261121-rollback1 in the loading scene and in settings. An older stamp means cache, not code.',de:'Sichtprüfung nach dem Laden: Der Stempel muss in der Ladeszene und in den Einstellungen BUILD 20261121-rollback1 zeigen. Ein älterer Stempel bedeutet Cache, nicht Code.'},
      {en:'The rolled-back visual work is still wanted and returns one piece at a time, each with a green suite: ground tracks and road/rail layers, build-pad pulse, spawn-point marker, boss announcement, tower fallback colours.',de:'Die zurückgenommene Optik ist weiterhin gewollt und kommt Stück für Stück zurück, jeweils mit grüner Suite: Bodenspuren und Straßen-/Schienen-Ebenen, Puls der Bauplätze, Spawn-Punkt-Marker, Boss-Ankündigung, Turm-Ersatzfarben.'},
      {en:'Roads and rails lose their fresh ground tracks, build pads their thicker pulsing selection ring, and the map entrance its spawn-point marker with this rollback. That is intended, not a new bug.',de:'Straßen und Schienen verlieren mit diesem Rückbau ihre neuen Bodenspuren, Bauplätze ihren dickeren pulsierenden Auswahlring und der Karteneingang seinen Spawn-Punkt-Marker. Das ist Absicht, kein neuer Fehler.'},
    ],
  },
  {
    id:'endlessview1',build:'20261120-endlessview1',pr:334,
    title:{en:'Endless Sector Retreat · Full-Screen Portrait Battlefield & Smooth Zoom Transition',de:'Endlos-Sektorrückzug · Vollbild-Gefechtsfeld im Hochformat & nahtloser Zoom-Übergang'},
    shipped:[
      {en:'Enabled `fullBattle` full-viewport framing across solo `endless`, `training`, and active `campaign` battles whenever an oversized sector map (Sector 2/3/4 from wave 10 onward) uses `battleViewport`, eliminating the 1/3 horizontal portrait strip on phones while preserving `touchZoom` pinch/toggle zoom during waves 1–10.',de:'`fullBattle`-Vollbilddarstellung in `IronPath/game.js` für Solo-Endlos-, Trainings- und aktive Kampagnengefechte ab großen Sektorenkarten (Sektor 2/3/4 ab Welle 10) aktiviert: Nach dem Welle-10-Rückzug nutzt das Gefechtsfeld nun den gesamten Hochformat-Bildschirm statt auf ein Drittel der Höhe zu schrumpfen, während Wellen 1–10 weiterhin frei über `touchZoom` zoombar bleiben.'},
      {en:'Synced `#mapQuickZoom` (`FIT MAP` / `ZOOM MAP`) and `#mapZoom` in `IronPath/game.js`, added `ResizeObserver` portrait/landscape re-framing (`wasFilled` fill-scale preservation + `scrollTop = 0`), fixed `openZoom()` for desktop (`>=1×`) vs phone (`fillScale`), updated `selectedMap` on `#sectorAdvance`, and guarded `campaignPanel[data-board-open]` transitions.',de:'`#mapQuickZoom` (`GESAMT` / `ZOOM`) und `#mapZoom` synchronisiert, `ResizeObserver`-Neurahmung samt Hoch-/Querformat-Erhalt (`wasFilled` + `scrollTop = 0`) ergänzt, `openZoom()` sauber zwischen Desktop (`>=1×`) und Mobil-Vollbild getrennt, `selectedMap` beim `#sectorAdvance`-Rückzug aktualisiert und `#campaignPanel[data-board-open]` abgesichert.'},
    ],
    open:[
      {en:'Real phone Safari and desktop visual inspection on `20261120-endlessview1`.',de:'Echte Sichtprüfung am Handy (Safari) und Desktop auf `20261120-endlessview1`.'},
    ],
  },
  {
    id:'sellicon1',build:'20261120-sellicon1',pr:333,
    title:{en:'Tower Radial Menu · Confirm Sale & Cancel Icons, Contrast Discs & Refund Readout',de:'Turm-Radialmenü · Symbole, kontrastreiche Ringe & Erstattungsanzeige für Verkauf bestätigen'},
    shipped:[
      {en:'Added bespoke `icon-confirm-sell.svg` (gold supply coin with confirmation checkmark) and `icon-cancel.svg` artwork to `confirmSell` and `cancel` in `IronPath/game.js`, separating the refund `+amount` into `.sheet-price` on both `Sell tower` and `Confirm sale` so labels and supply totals never truncate.',de:'Eigene SVG-Symbole `icon-confirm-sell.svg` (Vorratsmünze mit grünem Bestätigungshaken) und `icon-cancel.svg` für `Verkauf bestätigen` und `Abbrechen` in `IronPath/game.js` ergänzt sowie die Erstattung `+Betrag` sauber in `.sheet-price` ausgegeben, damit Text und Betrag im Ring nicht mehr abgeschnitten werden.'},
      {en:'Styled dedicated brass-gold (`confirmSell`) and slate-iron (`cancel`) radial ring discs with `#radialMenu` specificity after the generic V3 stamped-iron button rule in `IronPath/interface-redesign.css`, plus 2-line German label wrapping on desktop and phone viewports.',de:'Dedizierte Messing-/Gold- (`confirmSell`) und Schiefer-Eisen-Kreisschaltflächen (`cancel`) in `IronPath/interface-redesign.css` mit `#radialMenu`-Spezifität hinter der allgemeinen V3-Button-Regel angelegt und zweizeiligen Umbruch für lange deutsche Beschriftungen ergänzt.'},
    ],
    open:[
      {en:'Real phone Safari and desktop visual inspection on `20261120-sellicon1`.',de:'Echte Sichtprüfung am Handy (Safari) und Desktop auf `20261120-sellicon1`.'},
    ],
  },
  {
    id:'audio3',build:'20261120-audio3',pr:332,
    title:{en:'Audio Update 7 · Warm Tactical Score, Seamless Weather Beds & Click-Free Synthesis',de:'Audio-Update 7 · Warmer Taktik-Soundtrack, nahtlose Wetter-Ambience & knackfreie Synthese'},
    shipped:[
      {en:'Rebuilt `battle-music.mjs` around warm D Natural Minor / Dorian 32-step progressions across `menu`, `prep`, `wave`, and `boss` (eliminating harsh raw sawtooth waves, chromatic clashes, phase-canceling detune beats on mono phone speakers, and metallic reverb tails in favor of sine/triangle voicings, subtle octave chimes, damped echo delay, and a dark 1.6 s hall impulse).',de:'`battle-music.mjs` grundlegend auf harmonische d-Moll-/dorische 32-Takt-Folgen für `menu`, `prep`, `wave` und `boss` umgebaut (ohne raue Sägezahnwellen, chromatische Reibungen, Phasen-Auslöschung auf Mono-Handylautsprechern und metallischen Hall – stattdessen warme Sinus-/Dreieckstimmen, dezente Glockenakzente, gedämpftes Echo und ein dunkler 1,6-s-Raumhall).'},
      {en:'Fixed envelope clicks (`initZeroGain` before scheduled ramps), separated weapon noise from a dedicated 4.0 s crossfaded weather noise buffer (`Q <= 0.55`, muted in Command HQ `menu`), preserved beat phase on minor scheduler jitter, and tuned `BUS_DEFAULTS.music` to `0.38` beneath SFX and General Vance radio.',de:'Hüllkurven-Knackser vor Rampenbeginn behoben (`initZeroGain`), ein nahtlos überblendetes 4,0-s-Wetter-Rauschen ohne Loop-Sprung und ohne Resonanz-Pfeifen (`Q <= 0,55`, im HQ-Menü stumm) von den Waffensamples getrennt, den Takt-Scheduler phasenstabil gehalten und `BUS_DEFAULTS.music` auf `0.38` unter Effekten und General-Vance-Funk eingepegelt.'},
    ],
    open:[
      {en:'Real iPhone Safari and desktop listening verification on `20261120-audio3`.',de:'Echte Hörprobe auf iPhone Safari und Desktop auf `20261120-audio3`.'},
    ],
  },
  {
    id:'audio2',build:'20261120-audio2',pr:331,
    title:{en:'Audio Update 5–6 & Mobile HQ/Guide Polish · Adaptive Music, Weather Beds, Split Mixer & Dialog Popovers',de:'Audio-Update 5–6 & Mobil-Guide-Feinschliff · Adaptive Musik, Wetter-Ambience, Mixer & Dialog-Overlays'},
    shipped:[
      {en:'Added `battle-music.mjs` (Option C Hybrid procedural Web Audio music engine + pink-noise `rain`, `arctic`, and `wind` weather beds + lazy 2.0 s stereo `ConvolverNode` room reverb) hosted by `battle-sound.mjs` with automatic menu/prep/wave/boss/pause/mute scene transitions.',de:'`battle-music.mjs` ergänzt (Option-C-Hybrid-Musiksynthese plus prozedurale Regen-, Arktis- und Wind-Wetterambience sowie trägem 2,0-s-Stereo-Raumhall-Bus) über `battle-sound.mjs` mit automatischen Übergängen zwischen Menü, Vorbereitung, Welle, Boss, Pause und Stummschaltung.'},
      {en:'Split the Settings audio controls into separate Effects Volume (`sfxVolume`), Music Volume (`musicVolume`), Sound toggle (`soundEnabled`), Music toggle (`musicEnabled`), and Voice-over toggle (`voiceOver`) with instant Safari/iOS Web Audio gesture unlock and complete teardown.',de:'Audio-Regler in den Einstellungen in getrennte Lautstärken für Effekte (`sfxVolume`) und Musik (`musicVolume`), Sound-/Musik-/Sprachausgabe-Schalter sowie verzögerungsfreien Safari-/iOS-Audio-Unlock und sauberes Freigeben getrennt.'},
      {en:'Fixed modal `<dialog>.showModal()` inertness via `popover-host.mjs` (`#firstRunGuide`, `#menuTour`, `#guideRecall` now lift into the active open dialog and return cleanly on close), added a visible `#guideMinimize` button and tour `#menuTourFinish` (`End tour`), muted General Vance immediately on minimize/mute, compacted mobile `#firstRunGuide` beneath `← COMMAND CENTER`, and hid redundant mobile `#fieldSchool` cards beneath the 4 bottom HQ thumb actions.',de:'Modal-Blockade unter `<dialog>.showModal()` über `popover-host.mjs` behoben (`#firstRunGuide`, `#menuTour` und `#guideRecall` hängen während offener Dialoge sauber im aktiven Dialog und kehren beim Schließen zurück), klaren `#guideMinimize`-Button sowie `#menuTourFinish` (`Tour beenden`) ergänzt, General Vance beim Minimieren/Stummschalten sofort stummgestellt, das mobile `#firstRunGuide` unterhalb von `← KOMMANDOZENTRALE` kompakter gemacht und doppelte mobile `#fieldSchool`-Karten unterhalb der 4 HQ-Funktionsbuttons ausgeblendet.'},
    ],
    open:[
      {en:'Real iPhone Safari and desktop listening + tutorial verification on `20261120-audio2`.',de:'Echte Hör- und Tutorial-Abnahme auf iPhone Safari und Desktop auf `20261120-audio2`.'},
    ],
  },
  {
    id:'audio1',build:'20261120-audio1',pr:330,
    title:{en:'Audio Update 1–4 · Tactical Web Audio Engine, Weapons, Construction, Abilities, Bosses & HQ Feedback',de:'Audio-Update 1–4 · Taktische Web-Audio-Engine, Waffen, Bau, Fähigkeiten, Bosse & HQ-Feedback'},
    shipped:[
      {en:'Upgraded `battle-sound.mjs` into a multi-bus tactical Web Audio synthesizer (`sfx`, `explosion`, `ui`, `music` buses, master limiter, 7-bucket stereo field panning, per-weapon polyphony & density throttling, plus automatic voice-over/cinematic ducking synced with `general-radio.mjs`).',de:'`battle-sound.mjs` zur taktischen Multi-Bus-Web-Audio-Engine ausgebaut (`sfx`-, `explosion`-, `ui`- und `music`-Bus, Master-Limiter, 7-stufiges Stereo-Panning über das Spielfeld, Pro-Waffe-Polyphonie-/Dichte-Drosselung sowie automatisches Ducking bei Funksprüchen über `general-radio.mjs`).'},
      {en:'Added dry realistic synthesis (`battle-sound-recipes.mjs`, `simulation.mjs`, `tower-specialization.mjs`) across all 5 weapon classes, level-3 specializations, class paths, soldier rifle/bunker fire, infantry/tank/plane/boss deaths, and solo/co-op shot & kill observation (excluding the 1v1 rival lane).',de:'Trocken-realistische Waffensynthese (`battle-sound-recipes.mjs`, `simulation.mjs`, `tower-specialization.mjs`) für alle 5 Turmtypen, Stufe-3-Zweige, Klassenpfade, Soldaten-Gewehr/Bunkergeschütz, Infanterie-/Panzer-/Flugzeug-/Boss-Tode sowie Solo-/Co-op-Gefechtsbeobachtung (ohne die 1-gegen-1-Rivalenspur) ergänzt.'},
      {en:'Wired bespoke tactical audio across Packages 2–4: tower build/upgrade/branch/prestige/class-path/sell, supply crates, boss bounties, field perks, sector retreat, bunker impacts, all 6 soldier abilities, combos, ice/rubble hazards, boss spawns/telegraphs/abilities, wave/victory/defeat cadences, co-op VHF radio pings, and restrained Armory/Workshop/Skills UI cues.',de:'Eigene taktische Sounds für die Pakete 2–4 integriert: Turmbau, Upgrade, Spezialisierung, Prestige, Klassenpfad, Verkauf, Versorgungskisten, Boss-Kopfgeld, Field Perks, Sektor-Rückzug, Bunker-Treffer, alle 6 Klassen-Fähigkeiten, Kombos, Eis-/Geröll-Gefahren, Boss-Spawns/Telegraphen/Fähigkeiten, Wellen-/Sieg-/Niederlage-Signale, Co-op-VHF-Funk sowie dezentes UI-Feedback in Waffenkammer und Skills.'},
    ],
    open:[
      {en:'Package 5 (adaptive ambient music & weather soundscape) and Package 6 (Settings split audio sliders & mobile audio unlock polish), followed by real phone/desktop listening verification on `20261120-audio1`.',de:'Paket 5 (dezente adaptive Hintergrundmusik & Wetter-Ambience), Paket 6 (getrennte Audio-Regler in den Einstellungen & Mobil-Unlock-Feinschliff) sowie echte Hörprobe auf Handy und Desktop auf `20261120-audio1`.'},
    ],
  },
  {
    id:'block6b',build:'20261119-block6b',pr:329,
    title:{en:'Block 6b · Tutorial Dossier, HQ Tour, Field Guide & General Vance Radio Polish',de:'Block 6b · Einsatz-Dossier, HQ-Tour, Nachgefechtshilfe & Funkleisten-Feinschliff'},
    shipped:[
      {en:'Rebuilt `#tutorialDossier` into a fixed 3-zone flex-column sheet (`100vw × 100dvh` full-screen on phones/tablets `< 860px`) with pinned header banner & footer actions, `tabindex="-1"` + `scrollTop = 0` reset on open, full-width responsive map artwork, side-by-side landscape actions, and unified HQ dark-pine/gold button styling.',de:'`#tutorialDossier` auf einen festen 3-Zonen-Aufbau (`100vw × 100dvh` Vollbild unter `860 px`) umgestellt: angepinnter General-Vance-Kopf und Fußzeile mit Aktionsknöpfen, `tabindex="-1"` samt `scrollTop = 0`-Zurücksetzung beim Öffnen, bildfüllende Einsatzkarte auf Mobilgeräten, nebeneinanderliegende Querformat-Knöpfe und abgestimmte Tannengrün-/Gold-Schaltflächen.'},
      {en:'Fixed `.general-radio-bar` CSS specificity (`Replay radio` / `Mute`), removed tight `36px`/`46px` transcript clipping in `#tutorialDossier`, `#menuTour`, and `#firstRunGuide`, added clean 2-column mobile radio buttons, and prevented `.coach-close` / `.coach-recall` / `#guideClose` from inheriting gray combat slab styling.',de:'CSS-Spezifität der Funkleiste (`.general-radio-bar`, `Funk wiederholen` / `Stumm`) korrigiert, das Abschneiden längerer Funksprüche in `#tutorialDossier`, `#menuTour` und `#firstRunGuide` beseitigt, mobile Funkknöpfe zweispaltig ausgerichtet sowie `.coach-close`, `.coach-recall` und `#guideClose` vom grauen Gefechts-Button-Stil befreit.'},
      {en:'Pinned headers and footers with dedicated scrollable middle bodies in `#menuTour` (`.menu-tour-body`) and `#firstRunGuide` (`.guide-body`) plus `scrollTop = 0` resets on station switches.',de:'Kopf- und Fußzeilen in `#menuTour` (`.menu-tour-body`) und `#firstRunGuide` (`.guide-body`) mit eigenem mittlerem Scrollbereich fixiert sowie die Scroll-Position bei Stationswechseln sauber auf `0` zurückgesetzt.'},
    ],
    open:[
      {en:'Real iPhone, tablet, and desktop verification of `#tutorialDossier`, General Vance transcripts, `#menuTour`, and `#firstRunGuide` on `20261119-block6b`.',de:'Echte iPhone-, Tablet- und Desktop-Abnahme von `#tutorialDossier`, General-Vance-Funkuntertiteln, `#menuTour` und `#firstRunGuide` auf `20261119-block6b`.'},
    ],
  },
  {
    id:'block6',build:'20261119-block6',pr:328,
    title:{en:'Block 6 · Full Voiced General Vance Briefing, 7-Wave Field Drill & Command HQ Tour',de:'Block 6 · Vertontes General-Vance-Briefing, 7-Wellen-Ausbildung & HQ-Menüführung'},
    shipped:[
      {en:'Added General Vance’s character-scoped Field Dossier (`#tutorialDossier`, `tutorial-dossier.mjs`) and per-character RTDB tutorial state sync (`tutorial-sync.mjs`, using live `players/$uid/tutorial` schema): new or re-enlisted soldiers get one non-pushy offer to Accept Commission, Tour HQ Only, or Decline for Now, while mid-mission exits resume right back at the field briefing or HQ tour.',de:'Charakterbezogenes Einsatz-Dossier von General Vance (`#tutorialDossier`, `tutorial-dossier.mjs`) und Pro-Charakter-Synchronisierung (`tutorial-sync.mjs` auf Basis der live geschalteten `players/$uid/tutorial`-Regeln) eingeführt: Neue oder neu eingestellte Soldaten erhalten einmalig ein faires Angebot (Auftrag annehmen, nur HQ-Tour oder ablehnen); ein Abbruch zwischendurch setzt sauber wieder am Gefecht oder an der HQ-Tour an.'},
      {en:'Expanded the training deployment (`training-run.mjs`, `first-run-coach.mjs`, `game.js`) into one continuous 7-wave drill (`180` starting supplies, `450` guaranteed total XP on completion / `330` on retreat) covering tower build locks, Rank 2/3 specialization & 6-class preview, hero movement, active battle skill, incoming supply crates, Flak air cover, and the Wave-7 convoy boss.',de:'Übungseinsatz (`training-run.mjs`, `first-run-coach.mjs`, `game.js`) zu einem zusammenhängenden 7-Wellen-Gefecht ausgebaut (`180` Startvorräte, garantierte `450` Gesamt-EP bei Sieg / `330` bei Niederlage) – inklusive Bausperre bis zur Wellenanweisung, Rang-2/3-Ausbau samt 6-Klassen-Überblick, Soldatenbewegung, aktiver Kampffähigkeit, Nachschubkisten, Flak-Luftabwehr und Welle-7-Konvoi-Boss.'},
      {en:'Wired full bilingual studio radio narration (`general-radio.mjs`, 36 pre-generated MP3 voiceovers across 18 EN and 18 DE cues by General Vance) with live captions, audible/subtitled status chip, Replay radio & Mute sync with Settings (`voiceOverToggle`), plus an interactive 8-station Command HQ Menu Tour (`#menuTour`, `menu-tour.mjs`) with safe inspection cards and strict guardrails forbidding character deletion or sign-out actions.',de:'Vollständige zweisprachige General-Vance-Funkvertonung integriert (`general-radio.mjs`, 36 fertige MP3-Sprachclips in 18 EN- und 18 DE-Funksprüchen) samt Live-Untertiteln, Statusanzeige, Wiederholen/Stumm-Schaltern und Synchronisierung mit den Einstellungen (`voiceOverToggle`), ergänzt durch eine interaktive 8-Stationen-HQ-Führung (`#menuTour`, `menu-tour.mjs`) mit sicherer Inspektion und striktem Schutz vor Löschen oder Abmelden.'},
      {en:'Delivered custom tutorial field artwork (`general-vance-portrait.jpg`, `tutorial-dossier-map.jpg`, `tutorial-hq-briefing.jpg`, `tutorial-airstrike.jpg`), safe Settings reset & non-reward replay entry (`menuTutorial`), and full German localization across dossier, radio captions, 8 coach cues, and HQ walkthrough.',de:'Maßgeschneiderte Tutorial-Artworks (`general-vance-portrait.jpg`, `tutorial-dossier-map.jpg`, `tutorial-hq-briefing.jpg`, `tutorial-airstrike.jpg`), Zurücksetzen in den Einstellungen, belohnungsfreie Wiederholung (`menuTutorial`) sowie vollständige deutsche Übersetzung aller Dossier-, Funk-, Coach- und Tourtexte ergänzt.'},
    ],
    open:[
      {en:'Real multi-device manual playtesting of General Vance’s voiceover pacing, captions, 7-wave field cadence, and 8-station HQ tour on phones, tablets, desktops, and screen readers (`20261119-block6`).',de:'Echte Mehrgeräte-Abnahme von General-Vance-Vertonung, Untertiteln, 7-Wellen-Gefechtstempo und 8-Stationen-HQ-Tour auf Handy, Tablet, Desktop und Screenreader (`20261119-block6`).'},
    ],
  },
  {
    id:'block2',build:'20261119-block2',pr:327,
    title:{en:'Block 2 · Global Soldier-Name Uniqueness & Block 1 · Force-Close / Beginner Balance',de:'Block 2 · Eindeutige Soldatennamen & Block 1 · Gruppen-Notabschluss / Einsteigerbalance'},
    shipped:[
      {en:'Upgraded soldier-name normalization across client (`character-name.mjs`, `NFC_CASEFOLD_V2`) and audit (`audit-character-names.py`) to full Unicode case folding (`0` discrepancies across all 282,230 Unicode characters: `Straße` == `STRASSE` == `STRAẞE`, `ﬁn` == `FIN`, `ΜΑΡΚΟΣ` == `μαρκοσ`) with 2–24 UTF-16 character limits and 96-byte normalized keys.',de:'Soldatennamen-Normalisierung in Client (`character-name.mjs`, `NFC_CASEFOLD_V2`) und Audit (`audit-character-names.py`) auf vollständiges Unicode-Case-Folding umgestellt (`0` Abweichungen über alle 282.230 Unicode-Zeichen: `Straße` == `STRASSE` == `STRAẞE`, `ﬁn` == `FIN`, `ΜΑΡΚΟΣ` == `μαρκοσ`) bei 2–24 Zeichen Anzeigelänge und 96-Byte-Indexschlüsseln.'},
      {en:'Wired silent login reservation backfill (`character-name-conflict.mjs`) + cross-session deletion release fallback (`account.js`) and a blocking duplicate conflict modal (`#nameConflictDialog`) with no public general rename control, letting affected legacy accounts rename atomically (`createCharacterRename`) without losing XP, gear, skills, or campaign progress.',de:'Stille Hintergrund-Reservierung beim Login (`character-name-conflict.mjs`), sitzungsübergreifende Löschfreigabe (`account.js`) sowie einen blockierenden Konflikt-Dialog (`#nameConflictDialog`) ohne allgemeine Umbenennungs-Schaltfläche integriert, sodass betroffene Alt-Konten sich per `createCharacterRename` umbenennen können – bei vollem Erhalt von EP, Ausrüstung, Fähigkeiten und Kampagne.'},
      {en:'Block 1 (`Grenzen des Abschlusses`): automatic party closing stays strictly gated on every roster member’s confirmation, while the host now sees named `(offline)` and `(left early)` waiting teammates and unlocks an explicit confirmed `FORCE CLOSE PARTY` path (`#fourPartyForceClose` & `#resultsForceCloseParty`) once local rewards and host receipt are verified.',de:'Block 1 (`Grenzen des Abschlusses`): Das automatische Schließen wartet weiterhin streng auf die Quittung aller Mitglieder; der Host sieht nun namentlich ausstehende Spieler mit Status `(offline)` bzw. `(frühzeitig verlassen)` und kann nach eigener Bestätigung eine ausdrücklich gewarnte Option `GRUPPE JETZT SCHLIESSEN` nutzen.'},
      {en:'Block 1 (`Einsteigerbalance C`): tuned 3-/4-player income & HP scaling (`60% / 1.75×` for 3 players, `55% / 2.0×` for 4 players), eased waves 1–10 sector pressure to Sector 1 in multiplayer (`MULTIPLAYER_SECTOR_START_WAVE = 11`, keeping solo endless and campaign unchanged), and replaced `g3-3f1bbcd88` with Sector-3 `g3-2f1bbcd88` in `SQUAD_MAP_POOL` so no-gear beginners clear Wave 10+ cleanly.',de:'Block 1 (`Einsteigerbalance C`): 3-/4-Spieler-Skalierung angepasst (`60 % / 1,75×` für 3 Spieler, `55 % / 2,0×` für 4 Spieler), Mehrspieler-Wellen 1–10 auf Sektor-1-Grundstärke angeglichen (`MULTIPLAYER_SECTOR_START_WAVE = 11`, Solo-Endlos und Kampagne unverändert) und `g3-3f1bbcd88` im Squad-Pool durch Sektor-3-Feld `g3-2f1bbcd88` ersetzt, damit frische Charaktere Welle 10+ bestehen.'},
      {en:'Built `BLOCK2-RULES-TO-PUBLISH.json` strictly additively on `BLOCK9D` (`MAINTENANCE_GATE`-protected `characterNames/$key` index + unlisted `players/$uid/name` rename permission, and pre-wired Block 6 per-character `players/$uid/tutorial` schema; published live in Firebase RTDB Console per operator confirmation), plus emulator and Chromium verification.',de:'`BLOCK2-RULES-TO-PUBLISH.json` streng additiv auf `BLOCK9D` aufgebaut (`characterNames/$key` mit `MAINTENANCE_GATE`-Schutz, Umbenennungsrecht für ungelistete Spieler sowie vorgezogenes Block-6-Schema `players/$uid/tutorial`; laut Betreiber live in der Firebase Console veröffentlicht) samt Emulator- und Chromium-Tests.'},
    ],
    open:[
      {en:'Real multi-device inspection and playtesting across legacy name-conflict handling, host force-close, beginner balance C, and network-switch scenarios on `20261119-block2`.',de:'Echte Mehrgeräte-Abnahme und Spieltests für Konflikt-Umbenennung, Gruppen-Notabschluss, Einsteigerbalance C und Netzwechsel auf `20261119-block2`.'},
    ],
  },
  {
    id:'block9g',build:'20261119-block9g',pr:326,
    title:{en:'Block 9g · Redesigned Soldier Card (Bottom EXP), Painted HQ Action Cards & Balanced Results Placement',de:'Block 9g · Überarbeitete Soldatenkarte (EXP unten), gestaltete HQ-Aktionskarten & ausgerichtete Ergebnis-Schaltfläche'},
    shipped:[
      {en:'Restructured `#menuSoldier` (`Your Soldier`) with an atmospheric workbench backdrop, clean portrait + inline `OPEN DOSSIER →` header row, level badge, and moved the `EXP` dock and golden progress bar to a recessed full-width footer at the bottom of the card.',de:'`#menuSoldier` (`Dein Soldat`) mit atmosphärischem Werkbank-Hintergrund, klar strukturiertem Porträt-/Namensbereich samt integriertem `DOSSIER ÖFFNEN →`-Chip und Level-Plakette neu aufgebaut sowie die komplette `EXP`-Anzeige samt goldenem Fortschrittsbalken sauber an die Unterkante der Karte verlegt.'},
      {en:'Upgraded `ARMORY`, `SKILLS`, `FRIENDS`, and `HIGH SCORES` (`.command-soldier-actions`) from flat blank rectangles into cohesive painted battlefield cards (`arsenal-workbench.jpg`, `skills-banner.jpg`, new borderless `action-friends.jpg` & `action-scores.jpg`) paired with crisp custom SVG tactical emblems.',de:'Die vier Schaltflächen `WAFFENKAMMER`, `FÄHIGKEITEN`, `FREUNDE` und `BESTENLISTE` (`.command-soldier-actions`) von leeren Rechtecken zu stimmigen gestalteten HQ-Karten (`arsenal-workbench.jpg`, `skills-banner.jpg` sowie den neuen randfreien Gemälden `action-friends.jpg` & `action-scores.jpg`) inklusive maßgeschneiderter taktischer SVG-Symbole aufgewertet.'},
      {en:'Refined desktop/tablet hero and mode-card vertical proportions so `VIEW LAST RESULTS` (`#menuResults`) remains visibly docked directly below the three operation cards (`Campaign`, `Endless`, `Multiplayer`), never above them.',de:'Vertikale Abstände von HQ-Kopf und Moduskarten auf Desktop und iPad ausbalanciert, sodass `LETZTES ERGEBNIS` (`#menuResults`) stets sichtbar und eindeutig direkt unterhalb der drei Spielmodi (`Kampagne`, `Endlos`, `Mehrspieler`) sitzt.'},
    ],
    open:[
      {en:'Real tablet, desktop, and mobile device inspection on `20261119-block9g` before starting Block 6.',de:'Echte Tablet-, Desktop- und Handy-Abnahme auf `20261119-block9g` vor Beginn von Block 6.'},
    ],
  },
  {
    id:'block9f',build:'20261119-block9f',pr:325,
    title:{en:'Block 9f · Redesigned Login Artwork & Card, Unified Operation Windows, Consistent Back Buttons & Locked Endless Card Heights',de:'Block 9f · Neues Login-Design & Artwork, einheitliche Modus-Breiten, konsistente Zurück-Buttons & feste Endlos-Kartenhöhen'},
    shipped:[
      {en:'Completely rebuilt the sign-in screen (`#authView`, four brand-new `1376x768` painterly valley artworks `login-bunker-watch`, `login-radio-rain`, `login-convoy-prep`, `login-tactical-map`) into a single-column hero dossier card and compacted `<header>` vertical clearance so the top Iron Path crest stays unclipped across tablets and phones.',de:'Anmeldebildschirm (`#authView`, vier nagelneue `1376x768`-Szenengemälde `login-bunker-watch`, `login-radio-rain`, `login-convoy-prep`, `login-tactical-map`) als einspaltige Hero-Karte komplett neu gestaltet und oberen Logo-Abstand so angepasst, dass das Iron-Path-Logo auf Tablet & Handy nicht mehr abschneidet.'},
      {en:'Unified desktop widths (`880px`) across Campaign, Endless, Multiplayer, and all Command HQ modals, standardized every `← COMMAND CENTER` / `← KOMMANDOZENTRALE` back button in the same top-left header slot (keeping in-battle `✕` close buttons top-right), fixed `#menuSoldier` XP progress overflow, and moved `#guideRecall` (`SHOW TASK`) clear of bottom-left HQ utilities.',de:'Desktop-Breiten (`880 px`) über Kampagne, Endlos, Mehrspieler und alle HQ-Modale vereinheitlicht, sämtliche `← COMMAND CENTER` / `← KOMMANDOZENTRALE`-Zurück-Buttons einheitlich oben links verankert (`✕` im Gefecht bleibt oben rechts), XP-Überlauf im Soldatenfeld korrigiert und `#guideRecall` (`AUFGABE ZEIGEN`) von den unteren HQ-Schaltflächen gelöst.'},
      {en:'Locked uniform card height across every Endless battlefield image (`256px` desktop / `176px` mobile) regardless of 1- vs 2-line titles and replaced basic arrows on `#endlessPrev` / `#endlessNext` with custom beveled Iron Path vector arrows.',de:'Feste einheitliche Höhe für alle Endlos-Schlachtfeld-Karten (`256 px` Desktop / `176 px` Mobil) unabhängig von 1- oder 2-zeiligen Titeln erzwungen und die einfachen Karussell-Pfeile durch maßgeschneiderte taktische Iron-Path-Vektorpfeile ersetzt.'},
    ],
    open:[
      {en:'Real tablet, desktop, and mobile device inspection on `20261119-block9f` before starting Block 6.',de:'Echte Tablet-, Desktop- und Handy-Abnahme auf `20261119-block9f` vor Beginn von Block 6.'},
    ],
  },
  {
    id:'block9e',build:'20261119-block9e',pr:324,
    title:{en:'Block 9e · Same-Browser Multi-Tab Session Lock, Rotating Sign-In Artwork, Unified HQ Back Navigation & Endless Carousel',de:'Block 9e · Mehrfenster-Sitzungsschutz, rotierende Login-Banner, einheitliche HQ-Navigation & Endlos-Karussell'},
    shipped:[
      {en:'Hardened single active-session protection (`active-session.mjs`, `account.js`): 10 s heartbeat (`45 s` RTDB lease matching published `BLOCK9D` rules), per-tab `createWindowSessionId()` + `createSameBrowserSessionMonitor()` (Web Locks + `BroadcastChannel`) so blocking/takeover in another browser tab leaves sibling Auth IndexedDB intact, `pagehide` release, and unchanged-UID manual re-activation.',de:'Einzelsitzungs-Schutz gehärtet (`active-session.mjs`, `account.js`): 10-s-Heartbeat (`45 s`-RTDB-Lease passend zu den veröffentlichten `BLOCK9D`-Regeln), Tab-spezifische `createWindowSessionId()` + `createSameBrowserSessionMonitor()` (Web Locks + `BroadcastChannel`) ohne Verlust der Auth-Sitzung im anderen Tab, `pagehide`-Freigabe sowie saubere Reaktivierung bei identischer UID.'},
      {en:'Upgraded the sign-in dossier (`login-scene.mjs`, four rotating `1376x768` painted scenes, `#authLanguageToggle` flag/code switch matching `#languageToggle` in Settings) and unified all nine Command HQ screens (`← COMMAND CENTER` / `← KOMMANDOZENTRALE` with field `✕` fallback outside HQ).',de:'Anmeldedossier (`login-scene.mjs`, vier rotierende `1376x768`-Szenenbilder, Flaggen-/Kürzelschalter `#authLanguageToggle` passend zu `#languageToggle` in den Einstellungen) modernisiert sowie alle neun HQ-Fenster einheitlich mit `← COMMAND CENTER` / `← KOMMANDOZENTRALE` (und kontextuellem `✕` im Gefecht) versehen.'},
      {en:'Refreshed the three Command HQ mode cards with bespoke `1376x768` artwork (`mode-campaign.jpg`, `mode-endless.jpg`, `mode-multiplayer.jpg`) and streamlined the Endless launcher (`endless-launcher.mjs`, `endless-random.jpg`) into a single-image terrain carousel opening on Random with `DEPLOY` above and `CANCEL` below.',de:'Drei HQ-Modus-Karten mit neuen `1376x768`-Motiven (`mode-campaign.jpg`, `mode-endless.jpg`, `mode-multiplayer.jpg`) ausgestattet und das Endlos-Menü (`endless-launcher.mjs`, `endless-random.jpg`) auf ein schlankes Einzelbild-Karussell (Start auf „Zufälliges Gefechtsfeld“, `EINSETZEN` darüber, `ABBRECHEN` darunter) umgebaut.'},
    ],
    open:[
      {en:'Real desktop and phone inspection on `20261119-block9e` before starting Block 6.',de:'Echte Desktop- und Handy-Sichtung auf `20261119-block9e` vor Beginn von Block 6.'},
    ],
  },
  {
    id:'block9d',build:'20261119-block9d',pr:323,
    title:{en:'Block 9d · Single Active-Session Lock, Cropped Artwork, Settings Language Control & Complete DE Localization',de:'Block 9d · Einzelsitzungs-Schutz, randfreie Gemälde, sichtbare Sprachauswahl & vollständige DE-Lokalisierung'},
    shipped:[
      {en:'Added single active-session protection (`active-session.mjs`, `activeSessions/$uid` lease with 15 s heartbeat, 45 s TTL, `onDisconnect` release, sign-in conflict check, optional session-takeover checkbox `#sessionTakeoverCheck`, instant takeover notice, and Firebase RTDB rules `BLOCK9D-RULES-TO-PUBLISH.json`, live-published in Firebase Console per operator confirmation).',de:'Einzelsitzungs-Schutz ergänzt (`active-session.mjs`, `activeSessions/$uid`-Lease mit 15-s-Heartbeat, 45-s-TTL, `onDisconnect`-Freigabe, Login-Konfliktprüfung, optionalem Sitzungsübernahme-Haken `#sessionTakeoverCheck`, sofortigem Übernahmehinweis sowie laut Betreiber live in der Firebase Console veröffentlichten RTDB-Regeln `BLOCK9D-RULES-TO-PUBLISH.json`).'},
      {en:'Removed white outer borders/frames from seven painted artworks (`story-tower.jpg`, `story-marsh.jpg`, `story-rook.jpg`, `story-sera.jpg`, `endless-frontline.jpg`, `class-medic.jpg`, `armory-kit.jpg`), added clipping on mode/theme/field-school cards, and moved `#menuResults` below `.mode-grid` in the Command HQ.',de:'Weiße Außenränder und Zierrahmen an sieben Gemälden entfernt (`story-tower.jpg`, `story-marsh.jpg`, `story-rook.jpg`, `story-sera.jpg`, `endless-frontline.jpg`, `class-medic.jpg`, `armory-kit.jpg`), Kartenbeschnitt (`overflow: hidden`) ergänzt und `#menuResults` unter `.mode-grid` platziert.'},
      {en:'Restored visibility and width on `#settingsDialog #languageSelect`, reset legacy entry label styling on `.session-takeover-field`, fixed `command.none` translation in `endless-launcher.mjs`, tagged remaining static HTML strings with `data-i18n-text`, refreshed `#enlistStamp` and open AFK dialogs on language changes, and translated friends/lobby error strings.',de:'Sichtbarkeit und Breite von `#languageSelect` in den Einstellungen wiederhergestellt, geerbte Label-Stile auf `.session-takeover-field` bereinigt, `command.none` in `endless-launcher.mjs` behoben, fehlende statische HTML-Texte per `data-i18n-text` ergänzt, `#enlistStamp`/AFK-Dialog beim Sprachwechsel aktualisiert sowie Freundes-/Lobby-Fehlermeldungen übersetzt.'},
    ],
    open:[
      {en:'Real desktop and phone inspection on `20261119-block9d` (including cross-window/device single-session behavior) before starting Block 6.',de:'Echte Desktop- und Handy-Sichtung auf `20261119-block9d` (inkl. Einzelsitzungs-Verhalten über mehrere Fenster/Geräte) vor Beginn von Block 6.'},
    ],
  },
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
      {en:'Modes, larger fields, request cards, party end, host force-close with offline/departed player reporting (`Grenzen des Abschlusses`), and 2–4p beginner balance (`Einsteigerbalance C`) are implemented.',de:'Modi, größere Felder, Anfragekarten, Gruppenabschluss, Host-Notabschluss mit Statusanzeige fehlender Spieler sowie Einsteigerbalance C für 2–4 Spieler sind umgesetzt.'},
    ],
    open:[
      {en:'Real multi-device tests under network changes and operator playtesting of force-close and beginner balance across 2–4 players.',de:'Echte Mehrgeräte-Tests unter Netzwechseln sowie Betreiber-Spieltests zu Notabschluss und Einsteigerbalance über 2–4 Spieler.'},
    ],
  },
  {
    id:'block2',status:'planned',
    title:{en:'Block 2 · Character and friends',de:'Block 2 · Charakter und Freunde'},
    shipped:[
      {en:'Character cleanup, sign-out afterwards, friendship, invitations, friend portraits & published portrait/social rules, plus strict `NFC_CASEFOLD_V2` soldier-name uniqueness, silent login backfill, conflict-only duplicate rename UI, and live-published `BLOCK2-RULES-TO-PUBLISH.json` (per operator confirmation).',de:'Charakterbereinigung, Abmeldung danach, Freundschaft, Einladungen, Freundesporträts samt Live-Rules sowie strenges `NFC_CASEFOLD_V2`-Namenssystem, stille Login-Reservierung, Konflikt-Dialog bei Alt-Duplikaten und laut Betreiber live veröffentlichtes `BLOCK2-RULES-TO-PUBLISH.json` umgesetzt.'},
    ],
    open:[
      {en:'Complete real multi-device verification and screenreader review across legacy name conflicts and sign-in.',de:'Screenreader-Prüfung sowie abschließende Mehrgeräte-Sichtung für Alt-Konflikte und Login auf echten Geräten.'},
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
    id:'block6',status:'planned',
    title:{en:'Block 6 · Tutorial',de:'Block 6 · Tutorial'},
    note:{
      en:'Implemented in build 20261119-block6 (#328); real multi-device playtesting remains open.',
      de:'In Build 20261119-block6 (#328) umgesetzt; echte Mehrgeräte-Abnahme steht noch aus.',
    },
    shipped:[
      {en:'General Vance Field Dossier (`tutorial-dossier.mjs`), per-character `players/$uid/tutorial` RTDB state sync (`tutorial-sync.mjs`), 7-wave field drill (`training-run.mjs`, `first-run-coach.mjs`), bilingual 36-clip EN/DE General Vance radio voiceover (`general-radio.mjs`), 8-station safe Command HQ Menu Tour (`menu-tour.mjs`), Settings reset & non-reward replay (`#328`, `20261119-block6`).',de:'General-Vance-Dossier (`tutorial-dossier.mjs`), charakterbezogener RTDB-Abgleich `players/$uid/tutorial` (`tutorial-sync.mjs`), 7-Wellen-Übungseinsatz (`training-run.mjs`, `first-run-coach.mjs`), zweisprachige 36-Clip-Funkvertonung (`general-radio.mjs`), sichere 8-Stationen-HQ-Führung (`menu-tour.mjs`), Zurücksetzen & belohnungsfreie Wiederholung (`#328`, `20261119-block6`).'},
    ],
    open:[
      {en:'Real multi-device manual playtesting of audio pacing, captions, 7-wave mission flow, and HQ tour on phones, tablets, laptops, and screen readers on `20261119-block6`.',de:'Echte Mehrgeräte-Abnahme von Audiotaktung, Untertiteln, 7-Wellen-Mission und HQ-Tour auf Handys, Tablets, Laptops und Screenreadern auf `20261119-block6`.'},
    ],
  },
  {
    id:'block7',status:'next',
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
