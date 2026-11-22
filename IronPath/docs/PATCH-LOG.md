# Iron Path – Patch-Log

Dieses Protokoll ist der dauerhafte Einstiegspunkt für zukünftige Änderungen.
Es ergänzt den [Patchplan](PATCH-BLOECKE.md) und das [Datenblatt](DATENBLATT.md),
aber ersetzt weder Git noch die GitHub-PR-Historie. Die dazugehörige
[Arbeitsanweisung](../../AGENTS.md) verlangt, dieses Log vor der Arbeit zu lesen
und nach jedem in sich abgeschlossenen Schritt fortzuschreiben.

Die Einträge IPL-0001 bis IPL-0075 stehen im
[Archiv](PATCH-LOG-ARCHIV.md); hier stehen die neuesten 20. Beide Dateien
zusammen sind lückenlos und doppelfrei - `../scripts/patch-check.mjs` und
`../tests/patch-log-archive.test.mjs` prüfen das.

## So wird protokolliert

- **Jede logische Änderung:** Was und warum, betroffene Dateien, Tests mit
  tatsächlichem Ergebnis, verbleibende Risiken und Blockzuordnung.
- **Git/GitHub und Betrieb:** Branch und Basis; nach Commit, Push, PR,
  CI, Merge und Deployment jeweils ein zusätzliches Ereignis mit Hash,
  PR-/Job-Link und belegtem Ergebnis. Keine vermuteten Ereignisse eintragen.
  Ein lokal geändertes Log ist nicht automatisch gepusht oder veröffentlicht.
- **Status genau benennen:** `lokal/uncommittet`, `committet`, `gepusht`,
  `PR offen`, `gemergt`, `ausgeliefert` oder `abgenommen`; diese Zustände sind
  nicht austauschbar. Bei ausstehenden oder fehlgeschlagenen Tests dies nennen.
- **Datierung:** Das vorgegebene Sitzungsdatum ist 2026-10-31 UTC. Die
  abgefragte Umgebungsuhr zeigte 2026-11-15 bzw. 2026-11-16 UTC und GitHub
  meldete eigene Zeitstempel. Diese abweichenden Quellen getrennt angeben; die
  Reihenfolge anhand von Commits/PRs prüfen. Ein Build-Token ist kein Nachweis
  für einen Releasetag.
- **Keine Geheimnisse oder privaten Daten:** Keine Passwörter, Tokens, UIDs,
  Freundes-/Partycodes, privaten Profile oder Firebase-Schlüssel protokollieren.
- Ein Commit kann seinen eigenen endgültigen Hash nicht im selben Commit
  enthalten. Nachträgliche Git-/PR-Ereignisse werden deshalb als neuer Eintrag
  ergänzt und bei einem später freigegebenen Commit mitgenommen. Kein Commit,
  Push, Merge oder Release wird allein durch diesen Hinweis beauftragt.
- Es gibt keinen automatisch installierten Git-Hook. Änderungen außerhalb
  dieses Arbeitsablaufs können fehlen und müssen bei Bedarf aus Git/GitHub
  nachgetragen werden.

### Vorlage für einen neuen Eintrag

Die Vorlage steht als einzige Quelle in
[patch-log-vorlage.md](patch-log-vorlage.md), zusammen mit der Erklärung, was in
jedes Feld gehört und was nicht hineindarf. Eine Kopie hier würde auseinanderlaufen.

## IPL-0076 – Block 9f (`20261119-block9f`, PR #325): iPad-/Desktop-Login, Command-HQ-Ausrichtung, Endlos-Karussell & einheitliche Operationsbreiten
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe nach iPad-/Desktop-Gerätesichtung von `20261119-block9e`); Branch `arena/21544492-0815games-github-io` ab `57ebfaf4e79ff67db09c06ec780344158a7e133f` (`main`).
- **Block / Ziel:** Alle Rückmeldungen der `20261119-block9e`-Sichtung beheben: (1) Login-Dossier (`#authView`) auf ein einspaltiges Karten-Layout mit vollbreiter oberer Key-Art-Bühne, unbeschnittenem oberen Iron-Path-Logo, harmonisierten gemalten Login-Bannern (`login-*.jpg` passend zu `command-horizon.jpg`) und sauber darunter ausgerichtetem Formular umbauen, (2) Command Center (`#commandCenter`) auf Desktop & iPad ausrichten (`24px` Seitenabstand ohne Linksanschlag, XP-Wert vollständig innerhalb `#menuSoldier`, bündige `← COMMAND CENTER` / `← KOMMANDOZENTRALE`-Ausrichtung in Kampagne & Mehrspieler, gleiche Moduskartenhöhe, `SHOW TASK` / `#guideRecall` getrennt von `.command-utilities`), (3) alle Nicht-Gefechts-Dialoge (`Settings`, `Field Notes`, `Endless`, `Soldier`, `Armory`, `Skills`, `Friends`, `High Scores`, `Results`) oben links am Zurück-Button verankern, (4) Endlos-Auswahl (`#endlessLaunch`) auf feste Kartenhöhe (`256px` Desktop / `176px` Mobil) mit maßgeschneiderten SVG-Pfeilen bringen und Kampagne, Endlos sowie Mehrspieler auf gemeinsame Breite `--hq-op-width: min(880px, calc(100vw - 48px))` angleichen.
- **Änderungen / Dateien:**
  - **Login-Artworks & Szenenwechsel (`IronPath/assets/login-{bunker-watch,radio-rain,convoy-prep,tactical-map}.jpg`, `IronPath/login-scene.mjs`):** Vier neue text-/randfreie `16:9`-Key-Art-Gemälde passend zur dunklen Kiefer-/Bernstein-Farbpalette von `command-horizon.jpg`; `LOGIN_SCENE_VERSION = '20261119-block9f'` hängt `?v=20261119-block9f` in `applyLoginScene()` dynamisch an `#authSceneImg.src`, während `LOGIN_SCENES` saubere Dateipfade auf der Platte belässt.
  - **Markup (`IronPath/index.html`):** `#authView` auf `.dossier-hero-stage` (`#authSceneImg`, `.dossier-topbar` mit Kicker + `#authLanguageToggle`, `.dossier-hero-meta`) über einspaltigem `.dossier-body` (inkl. `.dossier-aux` mit `#forgot` + `.dossier-admin` / `#adminLoginLink`) umgebaut; `#endlessPrev` / `#endlessNext` auf `<svg class="endless-arrow-icon">` umgestellt.
  - **Stylesheet (`IronPath/menu-redesign.css`):** Einheitliches `--hq-op-width: min(880px, calc(100vw - 48px))` für `#endlessLaunch`, `#campaignPanel`, `#fourPartyPanel` und primäre HQ-Dialoge (mit `100%`-Reset `< 860px`); symmetrisches `24px`-Desktop-`<main>`-Padding; `.command-soldier-xp`-Grid + `336px` `.command-nav` + `.mode-card > span:last-child`-Zeilenausgleich + `#guideRecall.coach-recall` unten rechts; einheitliche Links-oben-Verankerung aller HQ-Zurück-Buttons (`#runResults .debrief-close[data-context="field"]` im Gefecht weiterhin `44×44` rechts oben); `#authView`-Einspalten-Hero-Layout; feste `256px` / `176px` `#endlessThemeCard`-Höhe & SVG-Chevron-Stile; `.dossier-admin`-Ausrichtung innerhalb `.dossier-aux` (Kompatibilität mit `stage-version.mjs` erhalten).
  - **Tests & Cache-Welle (`20261119-block9f`):** `IronPath/tests/menu-redesign.test.mjs`, `IronPath/browser-tests/interface-smoke.cjs` (inkl. `#authView`-, `#menuXp`-, `#guideRecall`-, 6-Theme-Karussell-, EN/DE-Top-Left-Gap- und `>=860px`-Breitenabgleich-Checks), `IronPath/release-version.json`, `IronPath/patch-notes.mjs` (`block9f`, `pr: 325`) & vollständige `?v=20261119-block9f`-Cache-Welle über HTML/Module/Tests.
- **Prüfungen:**
  - `node --test IronPath/tests/*.test.mjs` (**259 Testdateien: 1.163 bestanden, 0 fehlgeschlagen, 1 erwarteter Ancestor-Skip** in `release-pages-site.test.mjs`, inkl. `release-site-packaging.test.mjs`, `menu-redesign.test.mjs`, `login-scene.test.mjs`, `patch-notes.test.mjs`, `multiplayer-build-stamp.test.mjs` & `translation-coverage.test.mjs`).
  - `node IronPath/stress-tests/run.mjs` & `node --check` über alle **561** `.js`/`.mjs`/`.cjs`-Dateien bestanden; `menu-redesign.css` nach Final-Edit zusätzlich gegen `tests/menu-redesign.test.mjs` geprüft.
- **Git / PR / Release:** Commit `63bd0064d4fd4c1f948104436559c11deb9112e6` auf `arena/21544492-0815games-github-io` gepusht; **PR #325 gemergt** (`55037d704bc82cc51ed760503deb7cbcbb83263e`, PR-CI `44568037203` 13/13 grün; Pages Deploy `44569992725` & main CI `44569994188` 11/11 grün). `20261119-block9f` auf GitHub Pages live.
- **Offen:** iPad-Gerätesichtung führte direkt zur Command-Center-Überarbeitung **Block 9g (`IPL-0077`)**.

## IPL-0077 – Block 9g (`20261119-block9g`): Command-Center-Soldatenkarte (EXP unten), gestaltete HQ-Aktionskarten & Ergebnis-Positionierung
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe nach iPad-Safari-Screenshot von `20261119-block9f`); Branch `arena/5073637d-0815games-github-io` ab `55037d704bc82cc51ed760503deb7cbcbb83263e` (`main`).
- **Block / Ziel:** Vier Rückmeldungen am Command Center beheben: (1) `EXP`-Balken und Anzeige (`#menuXpBar` / `#menuXp`) neben dem Porträt weg und ganz nach unten innerhalb der `YOUR SOLDIER`-Karte (`#menuSoldier`) verlegen, (2) die `YOUR SOLDIER`-Karte grafisch und strukturell klar neu aufbauen, (3) die vier Aktionsbuttons `ARMORY`, `SKILLS`, `FRIENDS` und `HIGH SCORES` (`.command-soldier-actions`) von leeren grünen Rechtecken in stimmige gestaltete Iron-Path-Karten mit Artwork & Vektor-Symbolen umwandeln, (4) sicherstellen, dass `VIEW LAST RESULTS` (`#menuResults`) auf Desktop, iPad und Handy sichtbar **unterhalb** der 3 Spielmodi (`Campaign`, `Endless`, `Multiplayer`) sitzt und niemals darüber.
- **Änderungen / Dateien:**
  - **Artworks (`IronPath/assets/`):** Zwei neue text-/randfreie `16:9`-Öl-/Taktik-Gemälde `action-friends.jpg` und `action-scores.jpg` passend zu `arsenal-workbench.jpg` (`ARMORY`) und `skills-banner.jpg` (`SKILLS`).
  - **Markup (`IronPath/index.html`):** `#menuSoldier` klar in `.command-soldier-main` (Porträt + Rank-Abzeichen, Header-Zeile mit Kicker & `OPEN DOSSIER →`-Chip, Soldatenname, Level-Badge) und vollbreite untere `.command-soldier-xp`-Leiste (`EXP` + `#menuXp` über golden gestyltem `#menuXpBar`) gegliedert; `#menuArmory`, `#menuSkills`, `#menuFriends`, `#menuLeaderboard` mit maßgeschneiderten SVG-Symbolen (`.action-card-icon`) und geschütztem `<span class="action-card-label" data-i18n="...">` versehen.
  - **Stylesheet (`IronPath/menu-redesign.css`):** `#menuSoldier` mit atmosphärischem `soldier-workbench.jpg`-Hintergrund, vertieftem goldenem Bottom-EXP-Dock (`::-webkit-progress-value` / `::-moz-progress-bar` im Messingverlauf) und voller responsiver Struktur `< 860px` / `>= 860px`; gemalte Hintergründe + SVG-Rahmen auf `.command-soldier-actions` ohne Hover-Verschiebung; optimierte iPad-/Desktop-Proportionen (`min-height: 118px` `.command-hero`, `min-height: 268px` `.mode-card`) mit `grid-row: 5` für `#menuResults` strikt unter `.mode-grid`.
  - **Tests & Cache-Welle (`20261119-block9g`):** `IronPath/tests/menu-redesign.test.mjs`, `IronPath/browser-tests/interface-smoke.cjs` (DOM-, Hover-Crop-, Portrait-vs-EXP-Vertikalcheck und `#menuResults`-Position mit/ohne `#menuResume`), `IronPath/release-version.json`, `IronPath/patch-notes.mjs` (`block9g`, `pr: 326`) & Cache-Welle `?v=20261119-block9g`.
- **Prüfungen:** Lokal verifiziert via `node --test`, `node IronPath/stress-tests/run.mjs` und `node --check`; vollständiger Playwright-Desktop-/Mobile-Check nach Push via GitHub CI.
- **Git / PR / Release:** Commit `4108f8d` auf `arena/5073637d-0815games-github-io` gepusht; **PR #326 gemergt** (`25b8c332358889e5694a425672f83ac7b023ee15`, Pages `44579416364` & Main-CI `44579419185` 11/11 grün). `20261119-block9g` auf GitHub Pages live.
- **Offen:** Echte Geräteabnahme führte anschließend zur Block-2-Fertigstellung (`IPL-0078`).

## IPL-0078 – Block 2 (`20261119-block2`): Strenges `NFC_CASEFOLD_V2`, stiller Login-Backfill, Konflikt-Dialog & `BLOCK2`-Rules-Kandidat
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); Arbeitsbranch `arena/ef607625-0815games-github-io` ab `25b8c332358889e5694a425672f83ac7b023ee15` (`main`), Status: `lokal/uncommittet`.
- **Block / Ziel:** Block 2 (eindeutige globale Soldatennamen & Alt-Duplikate) gemäß Betreiberentscheid fertigstellen: (1) vollständiges Unicode-Case-Folding (`NFC_CASEFOLD_V2`) ohne Abweichung zwischen Spielclient (`character-name.mjs`) und Audit (`audit-character-names.py`), (2) stille Login-Reservierung in `characterNames/<key>` bei freien Namen, (3) ausschließlich bei Alt-Duplikaten (`taken`) ein blockierender Umbenennungs-Dialog (`#nameConflictDialog`) ohne allgemeine Umbenennungs-Schaltfläche und ohne Verlust von EP/Ausrüstung/Skills/Kampagne, (4) sichere sitzungsübergreifende Namensfreigabe beim Löschen, (5) streng additiver Publish-Kandidat [`firebase/BLOCK2-RULES-TO-PUBLISH.json`](../firebase/BLOCK2-RULES-TO-PUBLISH.json) direkt auf Basis des live laufenden [`firebase/BLOCK9D-RULES-TO-PUBLISH.json`](../firebase/BLOCK9D-RULES-TO-PUBLISH.json).
- **Änderungen / Dateien:**
  - **Namens-Normalisierung & Claim-Sicherheit:** `IronPath/character-name.mjs` (`NFC_CASEFOLD_V2`, 101-teilige Casefold-Tabelle + Cherokee-Mapping + zweistufige NFC-Normalisierung; unabhängige 2–24 UTF-16-Grenze / 96-Byte-UTF-8-Schlüssellänge), `IronPath/character-name-claim.mjs` (`reducerCalled`-Prüfung liefert `unsupported` statt fälschlichem `taken` bei unaufgerufenen synthetischen `runTransaction`-Mocks), `IronPath/firebase/name-policy-fixtures.json` (`version: 2`, `same === casefoldSame`), `IronPath/scripts/audit-character-names.py`, `IronPath/firebase/CHARACTER-NAME-AUDIT.md`.
  - **Stiller Login-Backfill & Konflikt-UI:** `IronPath/character-name-conflict.mjs`, `IronPath/account.js` (`nameConflictHandler.reconcile`, Cross-Session-`releaseNameKey`-Prüfung per `get` in `deleteCharacter`, `isReady`-/`normalReleaseSafety`-Schutz), `IronPath/index.html` (`#nameConflictDialog`), `IronPath/menu-redesign.css`, `IronPath/localization-account-de.mjs`.
  - **RTDB-Rules-Kandidat & CI:** `IronPath/firebase/{character-name-candidate,character-rename-candidate,block2-rules-candidate,block6-tutorial-candidate,block2-publish-candidate}.mjs`, `IronPath/firebase/{BLOCK2-RULES-TO-PUBLISH.json,firebase-block2.emulator.json,BLOCK2-RULES-HANDOVER.md}`, `IronPath/scripts/rules-publish-dry-run.mjs` (`--candidate`), `IronPath/firebase/rules-test/{block2-publish-rules.test.mjs,package.json}` (`test:block2`), `.github/workflows/ironpath-firebase-rules.yml`.
  - **Tests & Build-Welle (`20261119-block2`):** `IronPath/tests/{character-name,block6-tutorial-rules,name-audit,multiplayer-build-stamp}.test.mjs`, `IronPath/browser-tests/{name-conflict,cache-wave}.cjs`, `IronPath/release-version.json`, `IronPath/patch-notes.mjs`, `IronPath/PATCH-BLOECKE.md`, `IronPath/PATCH-LOG.md`, `IronPath/DATENBLATT.md` & Cache-Welle `?v=20261119-block2`.
- **Prüfungen & Nachtrag (vorgezogenes Block-6-Tutorial-Schema auf PR #327):**
  - Python-/Node-Vollvergleich über alle **282.230** zugewiesenen Unicode-Codepoints: **0 Abweichungen**; `node IronPath/scripts/rules-publish-dry-run.mjs IronPath/firebase/BLOCK9D-RULES-TO-PUBLISH.json --candidate IronPath/firebase/BLOCK2-RULES-TO-PUBLISH.json`: **0 Blocker**, **14 neue Pfade** (`characterNames/**` + `players/$uid/tutorial/**` aus `block6-tutorial-candidate.mjs`), 2 erwartete Review-Punkte (`/players/$uid['.validate']` & `/players/$uid/name['.validate']`).
  - Alle anderen noch offenen Blöcke (Block 1 Rest/Balance `C`, Block 3 `D1`, Block 7 `E` Leben & Gegenangriffe, Block 8) benötigen **keine** weiteren RTDB-Regeländerungen (`views/$uid`, `inputs/$uid`, `checkpoint` & Host-Löschung decken alles ohne Profilschaden ab).
  - Nach Push `d5ebb49` auf PR #327 bestanden in GitHub Actions Run `44618642845` alle **13/13 CI-Checks**; die anschließende Ergänzung von `players/$uid/tutorial` (inkl. Emulator-Tests in `block2-publish-rules.test.mjs` & Unit-Test `tests/block6-tutorial-rules.test.mjs`) wird direkt danach im gleichen offenen PR #327 über CI geprüft.
- **Offen:** Erneuter CI-Durchlauf nach Push der Block-6-Tutorial-Rules auf PR #327 sowie anschließende einmalige Veröffentlichung von `IronPath/firebase/BLOCK2-RULES-TO-PUBLISH.json` in der Firebase-RTDB-Konsole durch den Betreiber.

## IPL-0079 – Block 1 Rest (`Grenzen des Abschlusses` + `Einsteigerbalance C`) auf PR #327 (`20261119-block2`)
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); Arbeitsbranch `arena/ef607625-0815games-github-io` ab `25b8c332358889e5694a425672f83ac7b023ee15` (`main`, PR #327 nach Block 2 / `890034e`), Status: `lokal/uncommittet`.
- **Block / Ziel:** Verbleibende Block-1-Offenpunkte direkt auf PR #327 abschließen, ohne Firebase-RTDB-Regeln anzufassen (`BLOCK2-RULES-TO-PUBLISH.json` bleibt unverändert): (1) Teil 1 *Grenzen des Abschlusses* – Host sieht namentlich, welche Spieler noch nicht quittiert haben (`(offline)` / `(frühzeitig verlassen)`), kann die Gruppe nach Warnung explizit zwangsweise schließen (`FORCE CLOSE PARTY`), während das automatische Schließen weiterhin streng auf alle Quittungen wartet und bereits gespeicherte Belohnungen unangetastet bleiben; (2) Teil 2 *Einsteigerbalance C* – anhand gemessener Multi-Playstyle-Sweeps (inkl. Level-1-Anfänger ohne Skills/Relikte) 2p/3p/4p-Koop, 1v1 und 2v2 so abstimmen, dass Anfänger sauber durch Boss 1 (Welle 10+) kommen, ohne Solo-Endlos oder Kampagne zu verändern.
- **Änderungen / Dateien:**
  - **Teil 1 (`Grenzen des Abschlusses`):** `IronPath/match.mjs`, `IronPath/four-modes.mjs`, `IronPath/protocol.mjs`, `IronPath/versus.mjs`, `IronPath/four-game-view.mjs` (Setzen/Bereinigen von `departed`, Top-Level-`memberStates` im `versusView` & `fourInfo.memberStates`), `IronPath/party-end-coordinator.mjs` (`missingIds`, `departedIds`, `offlineIds`, `canForceClose`, strukturierter `detail`-Callback bei unverändert strengem `canClose`), `IronPath/firebase-four-panel.mjs` (`confirmForceClose` vor `busy`-Lock gegen Racing mit regulärem Abschluss, `#fourPartyForceClose`, Live-Sprachwechsel für fehlende Namen), `IronPath/game.js` (`#resultsForceCloseParty`, Wartetext in `#resultsSave`, `setPartyFinalizationState`, `memberStates`-Durchreichung), `IronPath/account.js` (`confirmForceClose`, `nameFor`, `hostPartySignOut?.completed` bei `forced`), `IronPath/index.html`, `IronPath/results-debrief.css`, `IronPath/menu-redesign.css`, `IronPath/localization-battle-de.mjs`.
  - **Teil 2 (`Einsteigerbalance C`):** `IronPath/simulation.mjs` (`COOP_THREE_REWARD_RATE = 0.6`, `COOP_THREE_ENEMY_HEALTH = 1.75`, `COOP_FOUR_REWARD_RATE = 0.55`, `COOP_FOUR_ENEMY_HEALTH = 2`, `MULTIPLAYER_SECTOR_START_WAVE = 11`, `effectiveSector = 1` für Wellen 1–10 bei `individualSupplies || hostId`), `IronPath/four-modes.mjs` (`SQUAD_MAP_POOL[2]`: `'g3-3f1bbcd88'` -> `'g3-2f1bbcd88'`).
  - **Tests & Doku:** `IronPath/tests/party-end-force-close.test.mjs`, `IronPath/tests/coop-balance.test.mjs`, `IronPath/tests/four-game-view.test.mjs`, `IronPath/tests/squad-maps.test.mjs`, `IronPath/patch-notes.mjs`, `IronPath/PATCH-BLOECKE.md`, `IronPath/PATCH-LOG.md`, `IronPath/DATENBLATT.md`.
- **Prüfungen:**
  - `node --test IronPath/tests/*.test.mjs`: **1.173 bestanden, 0 fehlgeschlagen, 1 erwarteter Ancestor-Skip** (`release-pages-site.test.mjs`), inkl. neuem `tests/party-end-force-close.test.mjs` sowie erweiterten `coop-balance`, `four-game-view`, `squad-maps`, `balance-suite`, `party-end-*`, `translation-coverage`, `patch-notes`, `menu-redesign` und `multiplayer-build-stamp`.
  - `node IronPath/stress-tests/run.mjs`: **grün** über alle Modi (`solo` W30, `coop` W18, `versus` W30, `three-coop` W30, `four-coop` W30, `two-vs-two` W30; maximale View-Größe `16.383` B / `30.966` B weit unter RTDB-`262.144`-B-Grenze).
  - `node IronPath/scripts/rules-publish-dry-run.mjs IronPath/firebase/BLOCK9D-RULES-TO-PUBLISH.json --candidate IronPath/firebase/BLOCK2-RULES-TO-PUBLISH.json`: **0 Blocker** (`BLOCK2-RULES-TO-PUBLISH.json` unverändert mit SHA-256 `914981b62198dbbff3651ab294834ff453d4eaf46450c062a9239149303915ee`).
  - `IronPath/server` & `IronPath/release-tools` (`node_modules` lokal nicht vorinstalliert) sowie alle 8 Emulator-/Chromium-Jobs liefen im Push-CI auf PR #327 (`37a2103`, GitHub Actions Run [`44645842343`](https://github.com/0815games/0815games.github.io/actions/runs/44645842343)): **13/13 Checks bestanden** (`database-rules`, `game-regressions` inkl. `server` & `release-tools`, `interface-browser-smoke`, alle 8 `party-finalization-browser`-Jobs sowie Vercel).
- **Git / PR / Release:** Committet als `37a2103` und auf `arena/ef607625-0815games-github-io` (PR #327, `pr_open`) gepusht.

## IPL-0080 – Block-2- & vorgezogene Block-6-RTDB-Rules live bestätigt (`BLOCK2-RULES-TO-PUBLISH.json`)
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); auf PR #327 (`arena/ef607625-0815games-github-io`, nach `37a2103`).
- **Branch / Basis:** `arena/ef607625-0815games-github-io`, Ausgangs-HEAD `37a2103` (`25b8c3323` auf `main`).
- **Betreiberbestätigung (ohne unabhängigen Serverabruf aus der Sandbox):** Der Betreiber bestätigte, dass die in [`IronPath/firebase/BLOCK2-RULES-TO-PUBLISH.json`](../firebase/BLOCK2-RULES-TO-PUBLISH.json) (SHA-256 `914981b62198dbbff3651ab294834ff453d4eaf46450c062a9239149303915ee`) bereitgestellten Block-2-RTDB-Rules (`characterNames/$key` mit `MAINTENANCE_GATE`, ungelistetes Umbenennungsrecht auf `players/$uid/name`) inklusive des vorgezogenen Block-6-Schemas (`players/$uid/tutorial`) live in der Firebase Console veröffentlicht wurden.
- **Änderungen / Dateien:**
  - `IronPath/PATCH-BLOECKE.md` (Block-2-Rules-Veröffentlichung inkl. vorgezogenem Block-6-`players/$uid/tutorial`-Schema als vom Betreiber live bestätigt markiert, offene Punkte auf Screenreader & echte Mehrgeräte-Abnahme aktualisiert)
  - `IronPath/patch-notes.mjs` (`RELEASED_PATCHES[0]` `block2` sowie `PLANNED_PATCHES` `block2`/`block6`: `BLOCK2-RULES-TO-PUBLISH.json` als vom Betreiber live bestätigt eingetragen, offene Hinweise auf Geräteabnahme bereinigt)
  - `IronPath/DATENBLATT.md` (`Rollout-Protokoll` um `37a2103` / CI `44645842343` & `IPL-0080` ergänzt)
  - `IronPath/PATCH-LOG.md` (`IPL-0079` CI-Ergebnis nachgetragen + `IPL-0080` protokolliert)
- **Git / PR / Release:** `lokal/uncommittet` auf `arena/ef607625-0815games-github-io` (PR #327).
- **Offen:** Finaler CI-Durchlauf des Dokumentations-/Feldnotizen-Nachtrags, Merge von PR #327 auf `main` (nach Freigabe bzw. Geräte-Sichtung auf `20261119-block2`) sowie echte Mehrgeräte-Abnahme (Namenskonflikt-Migration, Host-Notabschluss `FORCE CLOSE PARTY` & Einsteigerbalance C) vor Start der Block-6-Client-Umsetzung.

## IPL-0081 – Block 6 (`Tutorial`): Charakter-Dossier, 7-Wellen-Vertrag, General-Vance-Funk & 8-Stationen-HQ-Führung (Code & Tests lokal gebaut; Audio-Rest ausstehend)
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); Arbeitsbranch `arena/0b12995a-0815games-github-io` ab `61de91d37b266d74f243dcb08f83321775515b38` (`main`), Status: `lokal/uncommittet`.
- **Block / Ziel:** Block 6 auf Basis des Block-9-Menüs (`new_characters_only`, großer 7-Wellen-Einsatz, komplette interaktive HQ-Führung ohne Auslösen von Löschen/Abmelden, General Vances Funkstimme DE/EN mit Untertiteln/Stummschaltung sowie charakterbezogener RTDB-Speicherung und Anti-Farm-Schutz in `players/$uid/tutorial`) umsetzen.
- **Änderungen / Dateien:**
  - **Charakter-Sync & Anti-Farm-Transaktion:** `IronPath/tutorial-sync.mjs` (`initialOfferedTutorial`, `shouldAutoPresentTutorial`, `tutorialResumeTarget`, `shouldPayTutorialReward`, `applyTutorialRewardProfile`, `createTutorialSync`), `IronPath/account.js` (`startFirstRunTutorial`, `openTutorialDossierDialog`, `ensureTutorialDossier`, `ensureMenuTour`, `replayFirstRun` mit `data-screen="training"`).
  - **Dossier, 8-Stationen-HQ-Rundgang & Funk:** `IronPath/tutorial-dossier.mjs`, `IronPath/menu-tour.mjs` (8 HQ-Stationen, sichere Inspect-Aktionen, `FORBIDDEN_TOUR_TARGETS` für Account-Löschen/Abmelden), `IronPath/general-radio.mjs` (`GENERAL_RADIO_CLIPS` für 18 Szenen DE/EN, Untertitel, `voiceOver`-Stummschaltung, Lautstärkekopplung an `settings.mjs`), `IronPath/command-center.mjs` (optionaler `onTutorial`-Hook für `#menuTutorial`), `IronPath/index.html`, `IronPath/interface-redesign.css`, `IronPath/menu-redesign.css`.
  - **7-Wellen-Vertrag, 8-Schritt-Coach & DE-Texte:** `IronPath/training-run.mjs` (`TRAINING_WAVES = 7`, `TRAINING_BOSS_EVERY = 7`, `TRAINING_SUPPLIES = 180`, `FIRST_RUN_XP = 450` / `330`, `trainingWaveRadioCue`), `IronPath/solo-deployment.mjs`, `IronPath/first-run-coach.mjs` (8 Karten inkl. `specialize`, `#coachArt`, `voiceClip`, `onStepChange`), `IronPath/first-run-guide.mjs`, `IronPath/game.js` (`arguments[0]?.waveFloor`, `trainingWaveRadioCue`, Anti-Farm-XP-Gate), `IronPath/localization-firstrun-de.mjs`, `IronPath/localization-de.mjs`.
  - **Artworks & Tests:** `IronPath/assets/{general-vance-portrait,tutorial-dossier-map,tutorial-hq-briefing,tutorial-airstrike}.jpg`, 10 erste EN-MP3-Dateien unter `IronPath/assets/voice/en/tutorial/`, neue Testdateien `IronPath/tests/{tutorial-sync,general-radio,tutorial-dossier,menu-tour}.test.mjs`, aktualisierte Suiten `IronPath/tests/{training-run,first-run-coach,first-run-german,first-run-layout,first-run-device-test}.test.mjs`, `IronPath/FIRST-RUN-DEVICE-TEST.md`, `IronPath/browser-tests/command-center.cjs`, `IronPath/PATCH-BLOECKE.md`.
- **Prüfungen:**
  - Gesamtlauf über alle **265** Testdateien (`IronPath/tests/[a-b]`, `[c-f]`, `[g-m]`, `[n-r]`, `[s-z]`): **1.185 bestanden, 0 fehlgeschlagen, 1 erwarteter Ancestor-Skip** (`release-pages-site.test.mjs`).
  - `node --check` über alle **576** `.js`/`.mjs`/`.cjs`-Dateien: **0 Fehler**.
  - `node IronPath/stress-tests/run.mjs`: **bestanden** über alle Modi; `rules-publish-dry-run.mjs`: **0 Blocker**.
  - `browser-tests/command-center.cjs` lokal nicht ausgeführt (kein Chromium/Playwright in der Sandbox vorinstalliert).
- **Git / PR / Release:** `lokal/uncommittet` auf `arena/0b12995a-0815games-github-io`; Build-Stempel (`release-version.json` / `<meta name="ironpath-build">` / `patch-notes.mjs`) bewusst noch auf `20261119-block2` belassen, bis die Vertonung vollständig ist.
- **Offen:** (1) In den folgenden Zügen restliche 8 EN-Clips + einheitliche Neuerzeugung aller 18 EN-Clips mit `voice-11` unter `IronPath/assets/voice/en/tutorial/` sowie alle 18 DE-Clips mit `voice-10` unter `IronPath/assets/voice/de/tutorial/` synthetisieren (pro Runde maximal 10 `generate_speech`-Clips), (2) `general-radio.test.mjs` anschließend auf alle 18 EN + 18 DE-Audiodateien ausweiten, (3) Cache-Stempel auf `20261119-block6` heben, committen/pushen & CI-Browser-Tests sowie echte Mehrgeräte-Abnahme durchführen.

## IPL-0082 – Block 6 (`Tutorial`): Vollständige zweisprachige General-Vance-Funkvertonung (18 EN + 18 DE MP3s) & Gesamtprüfung
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); Arbeitsbranch `arena/0b12995a-0815games-github-io` ab `61de91d37b266d74f243dcb08f83321775515b38` (`main`), Status: `lokal/uncommittet`.
- **Block / Ziel:** Sämtliche **36** zweisprachigen General-Vance-Sprachdateien für Dossier, 7-Wellen-Feldmission und 8-Stationen-HQ-Führung fertigstellen und automatisiert gegen `GENERAL_RADIO_SCRIPTS` absichern.
- **Änderungen / Dateien:**
  - `IronPath/assets/voice/en/tutorial/` (alle **18** EN-MP3-Dateien einheitlich mit General Vance EN-Stimme `voice-11` neu bzw. vollständig erzeugt: `dossier-{offer,decline}.mp3`, `mission-{welcome,build,upgrade,hero,supplies,specialize,air,boss,complete}.mp3`, `hq-{dossier,armory,skills,workshop,operations,online,settings-done}.mp3`).
  - `IronPath/assets/voice/de/tutorial/` (alle **18** DE-MP3-Dateien einheitlich mit General Vance DE-Stimme `voice-10` erzeugt: identische 18 Clip-IDs wortgleich zu `GENERAL_RADIO_SCRIPTS`).
  - `IronPath/tests/general-radio.test.mjs` (Prüfung auf alle **18 EN + 18 DE = 36** MP3-Dateien mit `size > 2000` ausgeweitet).
  - `IronPath/PATCH-BLOECKE.md`, `IronPath/PATCH-LOG.md` (Block 6 auf **95 %** aktualisiert: Implementierung & Vertonung lokal komplett; Release-Build-Stempel, CI & echte Geräteabnahme offen).
- **Prüfungen:**
  - Schwerpunktlauf über 20 relevante Testsuiten (`general-radio`, `tutorial-sync`, `tutorial-dossier`, `menu-tour`, `command-center`, `tutorial`, `first-run-*`, `training-run`, `patch-notes`, `menu-redesign`, `version-check`, `multiplayer-build-stamp`, `translation-coverage`, `language`, `settings`): **139 bestanden, 0 fehlgeschlagen** (nach vollständigem 265-Dateien-/1.185-Tests-Gesamtlauf sowie `node --check` über **576** Dateien & `stress-tests/run.mjs`).
- **Git / PR / Release:** `lokal/uncommittet` auf `arena/0b12995a-0815games-github-io`.
- **Offen:** Finaler Release-Build-Stempel (`20261119-block6` in `release-version.json`, `index.html`, `patch-notes.mjs` & Modul-Importen), Commit/Push/PR-CI-Durchlauf (inkl. Chromium `interface-smoke` & `command-center`) sowie echte Browser-/Handy-Abnahme durch den Betreiber.

## IPL-0083 – Block 6 (`Release 20261119-block6`, PR `#328`): Cache-Welle, Feldnotizen & Chromium-Smoke vorbereitet
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); Arbeitsbranch `arena/0b12995a-0815games-github-io` ab `61de91d3` (`main`), Ziel-PR `#328`.
- **Block / Ziel:** Alle Laufzeit-, Test-, Feldnotizen-, CSS- und Browser-Cache-Bestandteile von Block 6 einheitlich auf den Release-Build **`20261119-block6`** heben, damit `0815games.github.io/IronPath/` nach Merge sauber ausgeliefert werden kann.
- **Änderungen / Dateien:**
  - `IronPath/release-version.json` (`20261119-block6`), `IronPath/index.html` (`<meta name="ironpath-build">`, beide `BUILD`-Stempel, Stylesheets/Skripte/Assets auf `?v=20261119-block6`), sowie alle **77** Cache-Wellen-Dateien inkl. `training-run.mjs?v=20261119-block6` in `game.js`, `solo-deployment.mjs` & `tutorial-dossier.mjs`.
  - `IronPath/tests/multiplayer-build-stamp.test.mjs` (`general-radio.mjs`, `menu-tour.mjs`, `training-run.mjs`, `tutorial-dossier.mjs`, `tutorial-sync.mjs` in die gemeinsame Cache-Wave-Prüfung aufgenommen).
  - `IronPath/browser-tests/cache-wave.cjs` (`20261119-block2` & `training-run.mjs?v=20261112-tagless1` als synthetische Altcache-URLs ergänzt; Import-Prüfung aller neuen Block-6-Module bei `?v=20261119-block6`).
  - `IronPath/menu-redesign.css` (`box-sizing: border-box` auf `dialog#tutorialDossier[open]` & `#menuTour.menu-tour`), `IronPath/browser-tests/interface-smoke.cjs` (Sicht-, Überlauf- & Bildprüfungen für `#tutorialDossier` + `#menuTour`).
  - `IronPath/patch-notes.mjs` & `IronPath/tests/patch-notes.test.mjs` (`block6` / `20261119-block6` / PR `#328` an die Spitze von `RELEASED_PATCHES` gesetzt; Block 7 in `PLANNED_PATCHES` auf `next`), `IronPath/PATCH-BLOECKE.md`, `IronPath/DATENBLATT.md`, `IronPath/PATCH-LOG.md`.
- **Prüfungen:** Vollständige lokale Verifikation (Syntaxcheck, alle 265 Node-Testsuiten, Stresstest, Rules-Dry-Run & Release-Staging) sowie GitHub-Actions-CI auf PR `#328` und isolierte Testbereitstellung.
- **Offen:** Echte Geräteabnahme der General-Vance-Vertonung, 7-Wellen-Ausbildung & 8-Stationen-HQ-Führung nach Veröffentlichung auf `main`.

## IPL-0084 – Block 6b (`20261119-block6b`): Tutorial-Dossier, HQ-Tour, Nachgefechtshilfe & Funkleisten-Feinschliff
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); Arbeitsbranch `arena/18035b51-0815games-github-io` ab `03867e999cd545c4ca52c39e71b29eefb9b83ca5` (`main`, PR `#328`), Ziel-PR `#329`.
- **Block / Ziel:** Nach der ersten iPhone-Sichtung auf `20261119-block6` (nach oben abgeschnittener Dossier-Banner, schmales Einsatzkarten-Bild, graue Stanz-Buttons in `.general-radio-bar` und zu knapp geklippte `.general-radio-sub`-Untertitel) alle Block-6-Oberflächen (`#tutorialDossier`, `#menuTour`, `#firstRunGuide`, `#firstRunCoach`, `.general-radio-bar`) sauber auf den Block-9-Sheet- und Token-Standard angleichen.
- **Änderungen / Dateien:**
  - `IronPath/index.html`, `IronPath/tutorial-dossier.mjs`, `IronPath/menu-redesign.css`: `#tutorialDossier` auf ein 3-Zonen-Flex-Layout umgestellt (`100vw × 100dvh` Vollbild unter `860 px`), angepinnter `.dossier-banner` + `.dossier-actions`-Footer außerhalb `.dossier-body`, `tabindex="-1"` + `scrollTop = 0`-Reset + `focus({ preventScroll: true })`, bildfüllende Einsatzkarte auf `<= 600 px`, zweispaltige mobile Funkknöpfe, `--hq-gold`-`.primary`-Aktionen sowie kompakte Querformat-Fußzeile (`max-height: 520px`).
  - `IronPath/index.html`, `IronPath/menu-tour.mjs`, `IronPath/menu-redesign.css`: `#menuTour` um `.menu-tour-body` (eigenständiger Scrollbereich bei angepinntem Kopf/Fuß) ergänzt, `scrollTop = 0`-Reset bei Stationswechsel, klare `:disabled`- und `.primary`-Stile sowie unbeschnittene Untertitel.
  - `IronPath/index.html`, `IronPath/interface-redesign.css`: `.guide-body` für `#firstRunGuide` ergänzt; `.general-radio-bar button.general-radio-btn:not(.primary):not([disabled])` (`(0,5,1)`), `#firstRunGuide .guide-foot button.guide-close...`, `#firstRunCoach .coach-head button.coach-close...` und `button.coach-recall` gegen das globale `(0,4,1)`-Stanz-Button-Muster abgesichert; `36px`/`46px`-Untertitel-Clamp außerhalb von `.first-run-coach` entfernt (kompaktes `min(30dvh,174px)`-Gefechts-Coach-Layout im Hochformat erhalten).
  - **Tests & Cache-Welle `20261119-block6b`:** `IronPath/tests/{tutorial-dossier,menu-tour,first-run-guide}.test.mjs`, `IronPath/browser-tests/interface-smoke.cjs` (inkl. `844×390`-Querformatprüfung), `IronPath/browser-tests/cache-wave.cjs` (`20261119-block6` in `oldUrls`), `IronPath/release-version.json`, `IronPath/patch-notes.mjs` (`RELEASED_PATCHES[0]` `block6b` / PR `#329`) sowie alle **78** Versions-Stempel auf `20261119-block6b`.
- **Prüfungen:** Targeted Node-Tests, vollständiger Syntax-/Test- und CI-Chromium-Screenshot-Lauf (siehe nachfolgende Ereignisse).
- **Offen:** Echte Geräte-Nachprüfung auf `20261119-block6b` nach Veröffentlichung.

## IPL-0085 – Audio-Überarbeitung Paket 1–4 (`20261120-audio1`, PR `#330`): Taktische Web-Audio-Engine, Bau-, Fähigkeits-, Boss- & HQ-Feedback
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); Arbeitsbranch `arena/ca11d4b2-0815games-github-io` ab `08bc4ad2f106be05c8341b545d11c0d24b131883` (`main`, PR `#329`), Ziel-PR `#330`.
- **Block / Ziel:** Pakete 1–4 der IronPath-Audio-Überarbeitung sauber auf `main` ausliefern, bevor Paket 5 (Musik & Wetter-Ambience) und Paket 6 (Einstellungen & Feinschliff) folgen.
- **Änderungen / Dateien:**
  - `IronPath/battle-sound.mjs` & `IronPath/battle-sound-recipes.mjs`: Multi-Bus-Web-Audio-Engine (`sfx`, `explosion`, `ui`, `music`, Master-Limiter), 7-Bucket-Stereo-Panning (`panForX`), Pro-Waffe-Polyphonie-/Dichte-Drosselung, Voice-Ducking synchron mit `IronPath/general-radio.mjs` (`musicDuck = 0.32`, `combatDuck = 0.78`, `ui` ungeduckt) sowie trocken-realistische Waffensynthese (5 Turmtypen, Lv3-Spezialisierungen inkl. `Twin Flak II`-`'chain'`-FX, Klassenpfade, Soldaten-Gewehr/Bunkergeschütz, Todessounds, Bau/Upgrade/Zweig/Prestige/Verkauf/Beute/Perk/Sektor/Gefahr/Bunker/Fähigkeit/Kombo/Boss/Wave/UI).
  - `IronPath/simulation.mjs`, `IronPath/tower-specialization.mjs`, `IronPath/general-radio.mjs`, `IronPath/game.js`, `IronPath/account.js`: Monotone Schuss-/Tod-IDs & `pop.kind`, `observeCombat`-Schleife über Solo- & Co-op-Snapshots (ohne Rivalenspur in `1v1`), Co-op-Event-Diffing (`build`, `upgrade`, `branch`, `prestige`, `sell`, `loot`, `perk`, `sector`, `rubble`, `boss`, `bossAbility`, `abilityReady`), `gameControl.playCue` sowie Workshop-/Armory-/Skills-UI-Signale.
  - `IronPath/tests/{battle-sound,general-radio,multiplayer-build-stamp,party-end-force-close}.test.mjs`, `IronPath/browser-tests/{cache-wave,interface-smoke,avatar-handover}.cjs`, `IronPath/release-version.json`, `IronPath/patch-notes.mjs` (`RELEASED_PATCHES[0]` `audio1` / PR `#330`) & **78** Version-Stamps auf `20261120-audio1`.
- **Prüfungen:** Syntaxprüfung, vollständige Node-Testsuite (`1.191` Tests) & PR-`#330`-CI vor Merge auf `main`.
- **Offen:** Paket 5 (Option C: prozedurale adaptive Web-Audio-Musik & Wetter-Ambience mit Raum-Hall-Bus) & Paket 6 (Audio-Mixer in `#settingsDialog` & Mobil-Unlock-Feinschliff) direkt im Anschluss auf diesem Arbeitsbranch.

## IPL-0086 – Audio-Überarbeitung Paket 5–6 & Mobile Guide/HQ-Feinschliff (`20261120-audio2`, PR `#331`)
- **Zeit / Quelle:** 2026-10-31 UTC; Arbeitsbranch `arena/c1cd5359-0815games-github-io` ab `c3dbb9e9d60f6335b7052e3d05b8243204fbb69b` (`main`, PR `#330`), Ziel-PR `#331`.
- **Block / Ziel:** Paket 5 (Option-C-Hybrid-Musiksynthese & Wetter-Ambience mit Raum-Hall), Paket 6 (getrennte `#sfxVolume`/`#musicVolume`/`#musicEnabled`-Regler, iOS-/Safari-Audio-Unlock & Teardown) sowie die auf iPhone gemeldeten Bedienungsfehler in `#firstRunGuide`, `#menuTour` und mobilem `#fieldSchool` schließen.
- **Änderungen / Dateien:**
  - `IronPath/battle-music.mjs`, `IronPath/battle-sound.mjs`, `IronPath/settings.mjs`, `IronPath/localization-settings-de.mjs`, `IronPath/index.html`, `IronPath/game.js`, `IronPath/account.js`: Prozedurale Web-Audio-Hintergrundmusik (`menu`, `prep`, `wave`, `boss`, `silent`), Regen-/Arktis-/Wind-Wetterambience, getrennter SFX-/Musik-Mixer, capture-seitiger `pointerdown`/`keydown`-Unlock samt Teardown sowie vollständige Szenen-Synchronisation über Kommandozentrale, Solo, Training und Co-op.
  - `IronPath/popover-host.mjs`, `IronPath/general-radio.mjs`, `IronPath/first-run-guide.mjs`, `IronPath/menu-tour.mjs`, `IronPath/interface-redesign.css`, `IronPath/menu-redesign.css`, `IronPath/localization-firstrun-de.mjs`: Aktive `popover="manual"`-Overlays (`#firstRunGuide`, `#menuTour`, `#guideRecall`) werden während offener Modaldialoge in den obersten `dialog[open]` gehängt und beim Schließen automatisch zurückgesetzt; `#guideMinimize` + `#menuTourFinish` (`Tour beenden`) klar sichtbar geschaltet; `generalRadio.silence()` & `stopAudio()` schalten WebKit-Audio beim Minimieren/Stummschalten sofort aus; mobiles `#firstRunGuide` sitzt kompakt unter `← KOMMANDOZENTRALE` ohne doppelten Funkuntertitel; mobiles `#fieldSchool` unter `860 px` zugunsten der 4 unteren HQ-Aktionsbuttons ausgeblendet.
  - **Tests & Cache-Welle `20261120-audio2`:** Neue `IronPath/tests/popover-host.test.mjs`, Erweiterungen in `tests/{battle-sound,settings,first-run-guide,menu-tour,general-radio,first-run-ending,multiplayer-build-stamp}.test.mjs`, `browser-tests/{interface-smoke,cache-wave}.cjs`, `release-version.json` & `patch-notes.mjs` (`PR #331`) sowie alle Cache-Stempel auf `20261120-audio2`.
- **Offen:** Echte iPhone-Safari- und Desktop-Abnahme auf `20261120-audio2` nach Veröffentlichung auf `main`.

## IPL-0087 – Warmer Taktik-Soundtrack & knackfreie Audio-Synthese (`20261120-audio3`, PR `#332`)
- **Zeit / Quelle:** 2026-10-31 UTC (Nutzerrückmeldung „Ingame Musik ist absolut grausam…“); Arbeitsbranch `arena/8968243d-0815games-github-io` ab `95811ff7dc80111c06606872669ac23d7ba66cc6` (`main`, PR `#331`), Ziel-PR `#332`.
- **Ursachenanalyse (gemessen im Web-Audio-Graph & DSP-Simulator):**
  1. Alte `sawtooth`-Wellen bis `2100 Hz` samt chromatisch reibenden Intervallen (`Eb3/D3`, `Eb4/A3`, Tritonus) im `boss`/`wave`-Pattern klangen schrill und ermüdend; im HQ-Menü lief zusätzlich ein `Q=1,9`-gefiltertes Windrauschen bei `440 Hz` (hörbares Pfeifen).
  2. `weatherBuffer` nutzte fälschlich den unüberblendeten 1,5-s-Waffen-`pinkBuffer` mit hartem Loop-Sprung alle 1,5 s; Hüllkurven-`GainNode`s starteten bei Standardwert `1.0` vor `setValueAtTime`, was messbare Einzel-Sample-Klicks (`maxStepSlew = 0.465`) auslöste.
  3. `BUS_DEFAULTS.music = 0.55` saß zu laut neben Gefechtseffekten und General-Vance-Sprachausgabe.
- **Änderungen / Dateien:**
  - `IronPath/battle-music.mjs`: Kompletter Neuaufbau mit konsonanten d-Moll-/dorischen 32-Takt-Mustern (`Dm`, `Fmaj7`/`Bb`, `Gm7`, `Am7`/`Asus4`), warmem Sinus-/Dreieck-Subbass, weich gefilterten Glocken-Plucks, phasenstabilen 3-stimmigen Dreieck-Pads ohne Mono-Schwebung, gedämpftem Echo-Delay, dunklem 1,6-s-Raumhall (`roomSend = 0.14`), knackfrei gerampten Hüllkurven (`initZeroGain`), phasenfestem Lookahead-Scheduler sowie eigenem 4,0-s-Crossfade-Wetterrauschen (`Q <= 0.55`, im Menü stumm).
  - `IronPath/battle-sound.mjs`: `BUS_DEFAULTS.music` auf `0.38` eingepegelt.
  - **Tests & Cache-Welle `20261120-audio3`:** Erweiterte Musik-/DSP-/Schleifen-Checks in `IronPath/tests/battle-sound.test.mjs`, `IronPath/browser-tests/cache-wave.cjs` (`20261120-audio2` in `oldUrls`), `IronPath/release-version.json`, `IronPath/patch-notes.mjs` (`RELEASED_PATCHES[0]` `audio3` / PR `#332`) sowie alle **78** Cache-Stempel auf `20261120-audio3`.
- **Prüfungen:** Numerischer 44,1-kHz-DSP-Check (`maxStepSlew` von `0.4651` auf `<= 0.0086`, Peak `<= 0.2589`, `0` Sawtooth-Oszillatoren), `node --check`, vollständige Node-Testsuite & `stress-tests/run.mjs`.
- **Offen:** Echte Hörprobe auf iPhone Safari und Desktop auf `20261120-audio3` nach Merge.

## IPL-0088 – Turm-Radialmenü: Optik, SVG-Symbole & Erstattungsanzeige für `Confirm sale` / `Cancel` (`20261120-sellicon1`, Ziel-PR `#333`)
- **Zeit / Quelle:** 2026-10-31 UTC (Nutzerrückmeldung: „Confirm sale im Turm Menu hat keine Optik, bzw. kein Bild oder sonst was. Prüfen und reparieren“); Arbeitsbranch `arena/cd53c79d-0815games-github-io` ab `77831bd55f243f0c9b1cbd7a3dbb0768495b3ddc` (`main`, PR `#332`). Status aktuell: `lokal/uncommittet`.
- **Ursachenanalyse (`IronPath/game.js:1063–1115` & `IronPath/interface-redesign.css:788–835`):**
  1. Im Gegensatz zu `upgrade`, `sell`, `branch` und `classUpgrade` setzten die Aktionen im Modus `confirmSell` (`Confirm sale` und `Cancel`) kein `icon`-Feld. Dadurch entfernte `showMenu` `button.dataset.icon` und leerte `#menuArt*`, sodass die zentralen 34×34-px-Symbolflächen der runden Radial-Buttons komplett leer blieben.
  2. Zusätzlich hängte `Confirm sale` den Erstattungsbetrag (`· +{amount}`) direkt an den 26 Zeichen langen deutschen Button-Text (`Verkauf bestätigen · +XX`), der in der 72–78 px breiten Rundfläche abgeschnitten wurde, während `.sheet-price` leer blieb; außerdem überschrieb die allgemeine V3-Button-Regel (`(0,4,1)`) in `interface-redesign.css` klassenbasierte `.sheet-option`-Hintergründe (`(0,3,0)`).
- **Änderungen / Dateien:**
  - `IronPath/assets/icon-confirm-sell.svg`, `IronPath/assets/icon-cancel.svg`: Neue 32×32-Vektorsymbole (Gold-Vorratsmünze mit grünem Bestätigungshaken bzw. Eisenring mit korallrotem Abbrechen-Kreuz).
  - `IronPath/game.js`: `confirmSell` vergibt `icon: 'confirmSell'`, separates `price: mine ? \`+${refund}\` : null` und `label: tr('Confirm sale')` bzw. `icon: 'cancel'` auf `Cancel`; im normalen Turmmenü (`sell`) nutzt `Sell tower` ebenfalls das einheitliche goldene `.sheet-price`-Feld.
  - `IronPath/interface-redesign.css`: `[data-icon="confirmSell"]`/`.[data-icon="cancel"]`-SVG-Mappings, zweizeiliger Textumbruch für lange deutsche Beschriftungen (Desktop & `<=600px`) sowie höher-spezifische `#radialMenu.tower-radial .sheet-option[data-icon="confirmSell"|"cancel"]`-Ringe (Messing/Gold bzw. kühles Eisen) hinter der V3-Button-Regel.
  - **Tests & Cache-Welle `20261120-sellicon1`:** Ausgebaute Assertions in `IronPath/tests/tower-ring.test.mjs`, `IronPath/tests/solo-smoke.test.mjs` (EN & DE inkl. `data-icon` & `+60`-Erstattung), `IronPath/browser-tests/interface-smoke.cjs` (`confirm-sell-ring.png`), `IronPath/browser-tests/command-center.cjs` (echter Klickpfad `Turm -> Sell -> confirmSell -> Cancel`), `IronPath/browser-tests/cache-wave.cjs`, `IronPath/release-version.json`, `IronPath/patch-notes.mjs` sowie Cache-Wave-Stempel `20261120-sellicon1`.
- **Status:** `gemergt` auf `main` (`a8df4534e360f1f78358df2570cbe6fc9b14c807`, PR `#333`, CI `44737997344` & Pages-Deploy `44739899987` grün).
- **Offen:** Echte Geräteprüfung auf iPhone/Desktop nach Merge.

## IPL-0089 – Endlos-Sektorrückzug: Vollbild-Gefechtsfeld im Hochformat & Zoom-Übergang (`20261120-endlessview1`, Ziel-PR `#334`)
- **Zeit / Quelle:** 2026-10-31 UTC (Nutzerrückmeldung: auf dem Handy füllen Wellen 1–10 den gesamten Hochformat-Bildschirm beim Zoomen; ab Welle 10 / neuem Sektor schrumpft das Feld auf rund ein Drittel der Bildschirmhöhe und verweigert Vollbild-Zoom); Arbeitsbranch `arena/6782c8ab-0815games-github-io` ab `a8df4534e360f1f78358df2570cbe6fc9b14c807` (`main`, PR `#333`). Status aktuell: `lokal/uncommittet`.
- **Ursachenanalyse (`IronPath/game.js:783–786` & `IronPath/field-command.css:238`):**
  1. Wellen 1–10 nutzen in Sektor 1 (`960×540`) `touchZoom` (`createMapZoom`), das die CSS-Breite hochskaliert und damit im Hochformat vertikal den Bildschirm nutzt. Ab Welle 10 wechselt `advanceSector` auf Sektor 2 (`1320×720`, später `1680×960` / `2040×1140`), wodurch `wantsBattleViewport` auf `createBattleViewportController` umschaltet.
  2. In `updateUI()` war `fullBattle` jedoch auf `!!coop && screen==='online'` beschränkt. Dadurch blieb `canvas.dataset.fullBattle='false'`, `logicalHeight` blieb hart bei `540` und `<canvas>` schrumpfte im `390×844`-Hochformat auf eine `390×219 px`-Horizontalzeile (`~1/3` Höhe), weil `battleViewport` innerhalb des starren `540`-Rahmens zoomte statt `100% × 100%` des Viewports zu nutzen.
  3. Zusätzlich blieben `#mapQuickZoom`-Beschriftung beim Erstaufbau, `ResizeObserver`-Neurahmungen bei Größenwechsel/Drehung sowie `selectedMap` nach `#sectorAdvance` teils unaktualisiert, und `setMissionBoard` aktualisierte `updateUI()` noch nicht beim Öffnen des Missionsboards.
- **Änderungen / Dateien:**
  - `IronPath/game.js`: `fullBattle` gilt nun für aktive Solo-Gefechte (`endless`, `training`, `campaign` mit `boardOpen !== 'true'`) sobald `wantsBattleViewport(map, versus, false)` greift und `#mapViewport` sichtbare Maße besitzt; `wantsBattleViewport` und `fullBattle` koerzieren strikt auf `Boolean` (so bleibt `canvas.dataset.fullBattle` bei klassischen Karten ohne `fourPlayer` wie `'road'` auch mit `experimentalFourViewport` sauber `'false'` statt `'undefined'`); `ResizeObserver` und `setMissionBoard` synchronisieren `updateUI()`; `syncBattleViewport` resetted `scrollTop`, nutzt `Math.max(fillScale, 1)` für Solo-Einzelkarten (`fillScale` im Co-op/4P), behält Füllhöhe bei Drehung (`wasFilled`) und restauriert `touchZoom` bei Rückkehr auf `960×540`; `renderViewportLabels` synchronisiert `#mapQuickZoom`; `$('sectorAdvance').onclick` übernimmt `selectedMap = state.mapId`.
  - `IronPath/battle-music.mjs`: `makeWeatherNoise` glättet die Schleifennaht des 4-s-Wetterrauschens über eine 16-Sample-Brücke zwischen Pufferende und -anfang (`data[0] === data[length - 1]`), sodass kein ungefilterter Weißrausch-Sprung am Loop-Übergang entsteht (behob zugleich die sporadische ~5-%-Abweichung in `battle-sound.test.mjs:541` bei CI-Run `44752320532`).
  - **Tests & Cache-Welle `20261120-endlessview1`:** Neue Node-Testsuite `IronPath/tests/endless-retreat-viewport.test.mjs` (echter Welle-1..10-Durchlauf + `#sectorAdvance`-Klick auf `390×844` Hochformat, Schwenk-und-Tap-Absicherung für beliebige Sektor-2-Karten, Querformat-Drehung, Sektor 3, Neustart auf Sektor 1, striktes `'false'` auf `'road'` trotz `experimentalFourViewport: true`, Desktop `1280×800`, versteckter Workspace & Kampagnenboard); erweiterte Assertions in `IronPath/browser-tests/retreat-viewport.cjs` und `IronPath/browser-tests/multiplayer-field.cjs` (`four-front` behält im Solo-Fallback `fullBattle='true'`, klassisches `'road'` setzt wieder `fullBattle='false'`); `IronPath/browser-tests/cache-wave.cjs`, `IronPath/release-version.json`, `IronPath/patch-notes.mjs` (`RELEASED_PATCHES[0]` `endlessview1` / PR `#334`) sowie Cache-Stempel `20261120-endlessview1`.
- **Verlauf / Prüfungen:** PR `#334` eröffnet (`1f5ea6d`); CI-Run `44751131383` zeigte `multiplayer-field.cjs:191` (`dataset.fullBattle === 'undefined'` nach Rückkehr auf `'road'`), behoben in `f623037` (CI-Run `44752320532`: 12/13 grün inkl. `interface-browser-smoke`, `database-rules` und aller 8 Emulator-Suites; `game-regressions` traf den ~5-%-Zufallstreffer in `battle-sound.test.mjs:541`). Lokal nach Fix: `battle-sound.test.mjs` `50/50`, `endless-retreat-viewport.test.mjs` `10/10`, gesamte Node-Testsuite unter `--test-concurrency=8` (`0` Fehler) und `stress-tests/run.mjs` bestanden.
- **Offen:** Finaler CI-Durchlauf auf PR `#334` sowie echte Geräteprüfung auf Handy Safari/Chrome nach Merge.


## IPL-0090 – Rückbau auf PR `#334`: spielbarer Stand wiederhergestellt, Cache-Welle `20261121-rollback1`

- **Zeit / Quelle:** 2026-11-21 UTC. Nutzerrückmeldung: Das Spiel bricht direkt ab Spielstart zusammen,
  sobald der erste Turm gebaut oder die Welle gestartet wird. Auf Rückfrage präzisiert: **das Gefechtsfeld
  friert ein** (Karte bleibt sichtbar, nichts bewegt sich mehr, Eingaben laufen ins Leere). Gerät
  **iPhone/iPad Safari**, **mit Konto angemeldet**, geprüft auf `https://0815games.github.io/IronPath/`.
  Vom Betreiber gewählter Lösungsweg: Rückbau auf den letzten Stand mit grüner Regressionssuite.
  Arbeitsbranch `arena/d4bf56ea-0815games-github-io` ab `7c2dba6576a8acb44091dd96bd18d4f02656b0a0`
  (`main`, PR `#339`). Status aktuell: `lokal/uncommittet`.
- **Ausgangslage auf `main` (`7c2dba65`) — zugleich die Pages-Auslieferung:** letzter Pages-Build
  `1390619326`, `built` 2026-11-21T18:24:36Z, aus genau diesem Commit. Die Seite war also **nicht**
  veraltet; der Betreiber hat exakt diesen Code geprüft.
  - `node --test-reporter=tap --test IronPath/tests/*.test.mjs` (Repo-Wurzel, CI-identisch):
    **1198 Tests, 1172 pass, 25 fail, exit 1**.
  - Zusammensetzung der 25: **22×** `ERR_UNSUPPORTED_RESOLVE_REQUEST` — `ground-tracks.mjs` (neu in
    `#335`) fehlte in 13 Harness-Ersetzungslisten; **1×** `endless-retreat-viewport` =
    `bossPhaseLabel is not defined`; **1×** `tower-glow`; **1×** `translation-coverage`.
  - **Belegter Produktfehler (P0, aus PR `#338`):** `IronPath/cartoon-art.mjs:1101` ruft
    `bossPhaseLabel(boss)` auf, ohne es zu importieren — Zeile 6 importiert nur `bossPhase`, der Export
    liegt in `boss-mechanics.mjs:41`. Der Aufruf steht **vor** der Auswertung
    `if(label&&phase!=='normal')`. Nachgestellt mit echtem Boss (`makeEnemy(bossForWave(5).kind,5)`):
    `ReferenceError: bossPhaseLabel is not defined at drawCartoonBattle (cartoon-art.mjs:1101:19)`.
    Da `IronPath/game.js:1501–1506` (`frame()`) keinen Fang um `draw()` hat, stirbt die
    `requestAnimationFrame`-Kette und das Feld friert ein — **derselbe sichtbare Effekt wie die
    Nutzermeldung**. Ehrliche Einschränkung: dieser Pfad braucht einen Boss auf dem Feld (Solo Welle
    5/10, Trainingsvertrag Welle 7) und erklärt damit **nicht** einen Abbruch beim allerersten Turm.
  - **`tower-glow`:** Test veraltet, Code korrekt. Der Test sucht das Literal
    `fallbackMarker(ctx,x,y-6,['MG','C','AA','S']`, das `#339` in `drawTowerVectorFallback(...)`
    umbenannt hat; `indexOf` liefert `-1`, die Assertion `glow<fallback` scheitert. Die Reihenfolge im
    Code (Schein wird vor dem Turm gemalt) stimmt weiterhin.
  - **`translation-coverage`:** 4 neue Literale ohne deutschen Eintrag (`SPAWN-PUNKT`,
    `WELLE {wave} · {count} FEINDLICHE`, `WELLE {wave}`, `NÄCHSTE: {count} ENEMIES`) aus `#336`/`#337`.
  - **`game-regressions` war in `#335`, `#336`, `#337`, `#338` und `#339` rot und wurde jeweils
    trotzdem gemergt** (kein Pflicht-Check; `branches/main/protection` liefert `403`). `#334` war der
    letzte PR mit grünem `game-regressions` (Run `44761316601`).
- **Nicht reproduziert — Nachweisgrad ehrlich:** Der gemeldete Einfrier-Fehler ließ sich gegen `main`
  **nicht** nachstellen, obwohl browser-treuer geprüft wurde, als die vorhandenen Tests es tun:
  - **483.840** `drawCartoonBattle`-Aufrufe über alle 3 Karten × Wellen 1–12 (inkl. eingespritzter
    Bosse) × 32 Einstellungskombinationen (`reducedMotion`, `weatherEffects`, `combatTracers`, Sprites
    geladen/ausstehend, `renderScale` 1/2) → **0 Fehler**.
  - Komplettes `game.js` über `startGame()` mit **browser-striktem** Canvas-Stub (wirft `IndexSizeError`
    bei negativem Radius, `InvalidStateError` bei leerem Bild, `TypeError` bei nicht-finiten Werten)
    **und** Web-Audio-Fake mit echten Wurfregeln (`NotSupportedError` bei `createBuffer` mit Länge 0,
    `InvalidStateError` bei doppeltem `start()`, `RangeError` bei `exponentialRamp`): Turmbau, Upgrade,
    Spezialisierung, Wellenstart, **900 Frames**, 937 Audio-Nodes → **0 Fehler**.
  - Alle **540** Import-Spezifizierer des Produktcodes lösen auf (auf Platte **und** in `git HEAD`); die
    einzigen 4 Lücken liegen in `release-tools/` und sind build-generiert.
  - Geprüft und ausgeschlossen: `roundRect`, `createConicGradient` und andere neuere Canvas-APIs kommen
    nicht vor. Die in `#335`–`#339` neu hinzugefügten Zeilen enthalten außer `performance.now()` (18×),
    `shadowBlur` (2×) und `.filter` (1×) keine browserkritische API.
- **Zusatzbefund, unabhängig vom Rückbau gültig** (in `#338`/`#339` eingeführt, mit dem Rückbau
  entfernt): Der Mündungsblitz in `pad()` ist **toter Code** und latent absturzgefährdet.
  `state.shots.find(s=>s&&s.tx===x&&s.ty===y)` vergleicht `tx/ty` (= Zielposition des Gegners laut
  `simulation.mjs:167`) mit der **Pad**-Position; ein Treffer ist damit praktisch ausgeschlossen. Käme
  es zu einem Treffer, folgte ein Absturz: `age=performance.now()-(shot.time||0)` mischt
  Seiten-Millisekunden mit einem Schussobjekt, das **kein** `time` trägt. Daraus wird `muzzleFlash` groß
  negativ und `ctx.arc(x,y+6,8+muzzleFlash*12,…)` erhielte einen **negativen Radius** → `IndexSizeError`.
  Korrekt wäre `s.x===x&&s.y===y` sowie eine Normalisierung über `shot.life`/`shot.duration` ohne
  `performance.now()`.
- **Leistungsmessung** (Canvas-Operationen pro Frame, `#334` → `main`, identische Zustände): erstes
  Frame mit Vektor-Fallback — also bevor Sprites dekodiert sind, am Handy genau der Startzeitpunkt —
  **970 → 1911 (+97 %)**; 10 Türme vor der Welle **527 → 609 (+16 %)**; Welle 1 mit 4 Gegnern und 1
  Schuss **623 → 708 (+14 %)**; ausgebaute Türme im Kampf **710 → 795 (+12 %)**. Operationen mit
  `shadowBlur>0` pro Frame: **0** in jedem Szenario. Der Prestige-Schein (`shadowBlur=26`, PR `#308` /
  `ab7e546c`, 2026-11-17) zeichnet nur für Prestige-Türme ab Stufe 13 und war damit **nicht** der
  Kostentreiber; die messbare Verteuerung stammt aus den geschichteten Straßen-/Schienen-Ebenen von
  `#335`. Die vom Betreiber vermutete „Tower-Glow"-Erhöhung ist somit als Ursache **widerlegt**, ein
  Rückbau bis dorthin (30 Merges, Verlust von Audio 1–7, Blöcke 9b–9g/2+1/6/6b, `sellicon1`,
  `endlessview1`) war nicht nötig.
- **Änderungen / Dateien:**
  - `IronPath/` inhaltlich vollständig auf `494ad8bb` (PR `#334`) zurückgesetzt:
    `git checkout 494ad8bb -- IronPath/`.
  - Danach die erst nach `#334` hinzugekommenen Dateien entfernt (`git checkout` löscht solche Dateien
    **nicht**): `IronPath/ground-tracks.mjs`, `IronPath/assets/road3-city.jpg`, `-desert.jpg`,
    `-forest.jpg`, `-marsh.jpg`, `-road.jpg`, `-snow.jpg` (zusammen 2,3 MB).
  - Zurückgenommen damit: `IronPath/cartoon-art.mjs` (659 Zeilen Differenz), `IronPath/game.js` (29),
    `IronPath/assets/endless-ground3.jpg`, `IronPath/assets/terrain3-city.jpg`,
    `IronPath/tests/road-design.test.mjs`.
  - **`IronPath/PATCH-LOG.md` wiederhergestellt: 3711 statt 257 Zeilen.** `#336` hatte dieses Log
    **ersetzt** statt fortgeschrieben und die Zählung auf `IPL-0001` zurückgesetzt; dabei gingen
    `IPL-0001`…`IPL-0089` verloren, und `#337`–`#339` wurden gar nicht protokolliert. Mit dem Rückbau
    ist die Historie wieder da; dieser Eintrag führt die Zählung korrekt als `IPL-0090` fort.
  - **Cache-Welle `20261120-endlessview1` → `20261121-rollback1`** in **79 Dateien / 534 `?v=`-Zeilen**.
    Das ist zwingend, weil `#335`–`#339` den Stempel **nicht** erhöht hatten: ein iPhone behält die
    fehlerhaften Module sonst unter unveränderter URL aus dem Cache, und der Rückbau käme nie an.
    Geändert: `IronPath/release-version.json`, `IronPath/index.html`
    (`<meta name="ironpath-build">` plus beide sichtbaren `build-stamp`-Ausgaben),
    `IronPath/login-scene.mjs` (`LOGIN_SCENE_VERSION`, Cache-Buster der Login-Szenen-Bilder) sowie
    `IronPath/browser-tests/avatar-handover.cjs` und `interface-smoke.cjs` (Fallback bzw. Fixture).
  - **Bewusst nicht gebumpt** (historische Daten, keine Cache-Referenz): `IronPath/patch-notes.mjs` —
    `RELEASED_PATCHES[0]` (`endlessview1`, PR `#334`) behält `build:'20261120-endlessview1'` und seine
    Zeile zur echten Geräteabnahme auf diesem Stand. Ein globaler Ersatz hatte beide Stellen zunächst
    verfälscht, was die Liste einen nie ausgelieferten Stand hätte behaupten lassen; das ist korrigiert.
- **Verifikation des Rückbaus:** `git diff 494ad8bb -- IronPath` enthält **ausschließlich** die
  Cache-Welle — 534 `?v=`-Zeilen plus 8 Zeilen für Meta-Tag, die zwei sichtbaren Stempel,
  `LOGIN_SCENE_VERSION`, `release-version.json` und die zwei Browser-Test-Fixtures. **Keine einzige
  Produktlogik-Zeile weicht von `#334` ab.**
- **Prüfungen:**
  - Stempel- und Versionsverträge einzeln (`build-stamp`, `multiplayer-build-stamp`, `version-check`,
    `version-ui`, `patch-notes`): **29/29 pass**, darunter `the release manifest, displayed build and
    cache-busted entry points agree` und `changed browser modules and their importers share one cache
    wave without splitting singleton services`.
  - Vergleichsmessung des Zielstandes in einem aus `494ad8bb` extrahierten Baum: 1198 Tests,
    **1190 pass, 7 fail**. Alle 7 waren Artefakte des Extrakts — `.github/workflows/` fehlte (`ENOENT`)
    und `.git` fehlte (`git rev-parse HEAD` scheitert). Nach Ergänzung beider Verzeichnisse: **0 echte
    Fehler**. Der Zielstand ist also nachweislich grün.
  - **Gesamtsuite nach Rückbau, CI-identisch von der Repo-Wurzel:**
    `node --test-reporter=tap --test IronPath/tests/*.test.mjs` → **1198 Tests, 1198 pass, 0 fail,
    0 skipped, exit 0** (324 s). Zum Vergleich: `main`/`7c2dba65` stand bei **1172 pass / 25 fail,
    exit 1**. Ein Zwischenlauf vor dem Feldnotiz-Eintrag zeigte 1196 pass / 2 fail — beide
    `patch-notes.test.mjs`, weil der Test den Eintrag zur laufenden Welle verlangt (siehe Punkt 3
    unter „Offen").
- **Git / PR / Release:** Commit `0338c5814a0001b6405c93bd79a4689a08b142af` auf
  `arena/d4bf56ea-0815games-github-io`, gepusht auf `origin`; PR
  [`#340`](https://github.com/0815games/0815games.github.io/pull/340) gegen `main` eröffnet.
  **Merge, CI-Ergebnis und Pages-Build stehen aus** und werden nach dem tatsächlichen Ereignis mit
  Kennung nachgetragen — nichts davon wird hier vorweggenommen.
- **Offen / nächster Schritt:**
  1. Commit → Push → PR. Merge **erst nach Freigabe des Betreibers**. Danach den Pages-Build abwarten
     und `https://0815games.github.io/IronPath/` prüfen: der sichtbare Stempel muss
     `BUILD 20261121-rollback1` zeigen — das trennt Cache von Code.
  2. **Geräteabnahme fehlt:** iPhone/iPad Safari mit angemeldetem Konto, exakt der gemeldete Pfad
     (Spielstart → erster Turm → Welle starten). Ein grüner Node-Testlauf ist keine Geräteabnahme.
  3. **Abweichung von der ursprünglich geplanten Reihenfolge, begründet:** Der Feldnotiz-Eintrag
     `rollback1` in `IronPath/patch-notes.mjs` konnte **nicht** bis nach dem Merge warten.
     `IronPath/tests/patch-notes.test.mjs` verlangt `RELEASED_PATCHES[0].build === release-version.json`
     (`the newest note is the build the site is running`) sowie genau eine als laufend markierte Karte;
     ohne den Eintrag blieben genau 2 Tests rot. Er liegt deshalb in diesem PR, mit `pr:340`, vier
     `shipped`- und vier `open`-Zeilen in DE **und** EN, und führt die ausstehende Geräteabnahme sowie
     den Status „unbewiesene Abhilfe, kein belegter Fix" ausdrücklich als offenen Punkt — entsprechend
     handelte schon `IPL-0089` für `#334`. Nach belegtem Merge und Pages-Lauf sind nur noch die
     Git-/CI-/Release-Ereignisse im Punkt darüber nachzutragen.
  4. `game-regressions` zum **Pflicht-Check** machen. Ohne diese Lücke wären `#335`–`#339` nicht
     gemergt worden.
  5. Die zurückgenommenen Arbeiten bleiben inhaltlich gewollt und müssen **einzeln** neu landen, jeweils
     mit grüner Suite, eigenem Stempel und Harness-Eintrag für neue Module: Bodenspuren plus
     Straßen-/Schienen-Optik (`#335`), Pad-Selektions-Puls (`#336`), Spawn-Punkt-Marker (`#337`),
     Boss-Ankündigung (`#338`, dann **mit** `bossPhaseLabel`-Import und Fang um `draw()`),
     Vektor-Fallback-Farben (`#339`). Beim Neu-Landen von `#335` zwingend `ground-tracks.mjs` in die 13
     Ersetzungslisten der Test-Harnesses aufnehmen.
  6. Unabhängig vom Rückbau offen: der tote und latent abstürzende Mündungsblitz (Zusatzbefund oben),
     die 4 Literale ohne DE-Eintrag, die `tower-glow`-Literalprüfung sowie die **fail-closed**-Gatter —
     `maintenance-check.mjs` beendet die Seite bei jeder Abweichung von `_ironpathMaintenance`
     (`halt('unavailable')` → `stopAccountForRelease()` blendet `gameView` **und** `entry` aus), und
     `version-ui.mjs:125` liefert `Promise.resolve(false)`, sobald der Koordinator nicht initialisiert
     ist, wodurch Deploy und Turmbau **stillschweigend** nichts tun. Beide sind nur mit echtem Konto und
     Netz sichtbar, deshalb headless nicht prüfbar, und bleiben als mögliche Ursache des gemeldeten
     Einfrierens stehen, falls der Rückbau nicht hilft.


## IPL-0091 – Straße und Schiene auf echten Kurven neu gebaut, Bodenspuren zurück (`20261121-road1`, PR `#341`)

- **Zeit / Quelle:** 2026-11-21 UTC. Auftrag des Betreibers nach dem Rückbau (`IPL-0090`), zwei Teile
  mit von ihm festgelegter Reihenfolge: **Teil 1** `#335` neu aufsetzen, „diesmal die Kurven auch
  sauber hinbekommen" und „eine durchgehend sauber gestaltete Straße"; **Teil 2** `#336` komplett neu
  implementiert. Drei abgefragte Entscheidungen, bindend: Kurvenstil = **echte Rundungen (sichtbar
  kurvig)**, Umfang = **alles aus `#335`** (Geometrie + Bodenspuren + Texturen), Lieferung = **zwei
  getrennte PRs, `#335` zuerst**. Dieser Eintrag ist Teil 1; Teil 2 folgt als eigener PR.
- **Block / Ziel:** Block 8, Abschnitt „Zurückgenommen und neu zu landen". Die zurückgenommene Arbeit
  war inhaltlich gewollt, aber bloßes Wiedereinschieben des alten `#335`-Codes hätte den Auftrag nicht
  erfüllt: die Kurven waren der Grund der Rücknahme, nicht die Lagen.
- **Branch / Basis:** `arena/d5645359-0815games-github-io` ab
  `394ce04ba630e459371c0a5b070a3da265044fd0` (`main`, Merge von PR `#340`).
- **Ursachenanalyse (gemessen an den echten Kartendaten, Offset-Formeln 1:1 aus dem alten Maler):**
  Alle drei Karten sind orthogonale Zickzack-Polygone (`road` 8 Punkte/6 Ecken, `forest` 10/8,
  `outpost` 10/8, jede Ecke exakt 90°). Der Maler versetzte und dekorierte **jedes Segment einzeln**:

  | Fehler je 90°-Ecke | Ausmaß | Ursache |
  |---|---|---|
  | Spurrillen reißen ab | **21,2 px** Lücke (`road` 6 Ecken = 255 px, `forest`/`outpost` 8 = 339 px) | Offset mit eigener Normalen je Segment, getrennte Teilpfade (= 15·√2) |
  | Schienen schneiden die Ecke | **13,0 px** Eckfehler (156/208 px gesamt) | Polylinie durch `b+n₁·13` statt Gehrungspunkt `b+(n₁+n₂)·13` |
  | Schwellen fehlen im Bogen | **13 px** Lücke | Schleife `s=9 … len-4`, Schritt 17 |
  | Kies/Schutt fehlt im Bogen | **38 px** Lücke | Schleife `s=26 … len-12`, Schritt 44 |
  | Straßenkörper wird zur Wurst | Viertelkreis-Bogen **Radius 43 px** | `lineWidth=86` + `lineJoin='round'` auf eckiger Polylinie |

  Härtester Einzelfund: `forest` hat ein **30 px** kurzes Segment zwischen zwei Ecken – kürzer als die
  Straße breit ist. Es verschwand vollständig in den beiden Eckbögen.
- **Änderungen / Dateien (28 Dateien, +1738/−147 vor der Cache-Welle):**
  - **Neu `IronPath/road-geometry.mjs`** – reines Präsentations-Geometriemodul, kennt keinen
    Simulationszustand. Beschreibt die Straße **einmal** als tangentenstetige Folge aus Geraden und
    Kreis-Fillets: `buildRoadPath(points,{radius})` mit `DEFAULT_CORNER_RADIUS=34`, Klemmung
    `min(gewünscht, (kürzeres Nachbarsegment/2)/tan(δ/2))`, damit zwei Fillets auf einem kurzen
    Segment sich tangential in seiner Mitte treffen (der `forest`-Stummel wird zu einem S-Bogen aus
    zwei 15-px-Bögen statt zu einem Blob); `offset(d)` als Parallelkurve (Gerade → parallele Gerade,
    Bogen → **konzentrischer** Bogen); `at(s)`/`walk(step,visit,{inset,outset})` für echte Bogenlänge
    und echte Tangente; `emit(ctx)` legt Bögen als `arc()`-Befehle an (eine Kurve je Bogen statt vieler
    Kurzsegmente); `cornerDeviation(r,δ)=r·(1/cos(δ/2)−1)` und `maxCentrelineDeviation(points)` als
    geschlossene Formel für den Abstand Polygon-Ecke ↔ geglättete Mittellinie.
  - **`IronPath/cartoon-art.mjs` (+356/−94):** `drawRoad`/`drawRail` vollständig auf dieses Modul
    umgebaut, mit dem `#335`-Lagendesign – `ROAD_THEMES` (8 Biome: `urban`, `outpost`, `arctic`,
    `marsh`, `scrub`, `forest`, `talwald`, `road`), Lagenstapel 94/82/76/(66 Gutter | 68 lichte
    Schulter)/60, Textur via `createPattern` + `DOMMatrix().scale()`, Krone, Schulter-Haarlinie,
    Spurlinie (Offset 23), Mittellinien-Dash `[16,14]`, Marsh-Planken (Schritt 11) mit zwei
    Guardrails (Offset 25), Bordsteinkerben (Offset 35), Schneewehen, Gestein, Unterholz,
    Panzer-Cleats, Stiefelabdrücke; dazu `drawBootStamp`, `drawTankTreadStamp`, `roadImages` +
    `getRoadImage`, `export drawGroundTracks`. Ganze Lagen = **ein** Pfad-Stroke, parallele Lagen =
    exakte Offsetkurve, diskrete Deko = `walk()` über Bogenlänge. `drawTerrain` holt `roadImg` und
    gibt es weiter; `drawCartoonBattle` bekommt `groundTracks=[]` und malt sie **nach** `brokenIce`,
    also über der gecachten Terrain-Ebene.
  - **`IronPath/game.js` (+14/−5):** Import `createGroundTracks`, zwei Rekorder, `sample()` in beiden
    Ansichten, Übergabe an `drawCartoonBattle`, `reset()` an **beiden** Stellen.
  - **`IronPath/ground-tracks.mjs` (124 Zeilen) und 8 Platten** (`road3-{city,desert,forest,marsh,road,snow}.jpg`,
    `endless-ground3.jpg`, `terrain3-city.jpg`; 2,3 MB) aus dem gemergten `#335`-Baum
    (`a3eb453b1389ec38b8f48c1c6e45e192ca618e09`) wiederhergestellt; alle 8 JPGs auf gültige
    SOI/EOI/SOF-Header geprüft.
  - **13 Ersetzungslisten der Test-Harnesses** gepflegt (`ability-hud-ui`, `campaign-ui`, `coop-ui`,
    `endless-launcher`, `four-viewport-integration`, `map-name-title`, `party-end-force-close`,
    `party-end-ui`, `release-game-teardown`, `report-rank`, `solo-smoke`, `solo-wave-receipt-ui`,
    `tower-shimmer`) – genau die Bedingung, die `IPL-0090` als zwingend notiert hatte.
- **Drei Geometriefehler, die die eigenen Tests beim Schreiben des Moduls gefunden haben** (alle drei
  waren im neuen Code, nicht im alten; jeder ist jetzt per Test gepinnt):
  1. Tangentenlänge stand als `r/tan(δ/2)` statt **`r·tan(δ/2)`**. Beide Formeln sind **nur bei δ=90°
     identisch** – jede ausgelieferte Karte wäre grün geblieben, während das Modul bei schrägen Ecken
     um bis zu **31 px** danebenlag. Aufgefallen nur, weil der Test absichtlich ein nicht-orthogonales
     Zickzack (74,1/84,8/86,6°) fährt, das auch `tests/road-design.test.mjs` verwendet.
  2. Ein Versatz breiter als die Kurve wurde durch eine **Sehne** ersetzt und riss **1,75 px** – in
     einem Modul, das Risse beenden soll. Jetzt die exakte, sich selbst kreuzende Kreisbahn
     (Radius `|r−d·turn|`, Winkel um π gedreht), als `cusp` gekennzeichnet.
  3. Ein Versatz **exakt** durch das Kurvenzentrum erzwang einen Mindestradius `0.75` und erfand einen
     0,75-px-Sprung, wo geometrisch ein Punkt steht; der Bogen entartet jetzt und fällt weg, beide
     Nachbarlinien treffen sich dort exakt.
- **Zwei Verdrahtungsfehler aus `#335` korrigiert statt kopiert:**
  1. **Ein gemeinsamer Rekorder für beide Gefechtsfelder.** `sample()` löscht Tracker von Spielern, die
     der übergebene Zustand nicht enthält; eigene und gegnerische Ansicht wechselten sich pro Frame ab
     und löschten einander damit **jeden Frame** die Tracker. Da ein neu angelegter Tracker nur Peilung
     nimmt und keine Marke legt, entstand im Versus-Spiel **nie** eine Spur. Jetzt eigener Rekorder je
     Ansicht (`groundTracks`, `rivalGroundTracks`).
  2. **Nur eine von zwei Reset-Stellen** räumte den Rekorder auf; Spuren bluteten über eine
     Koop-Neuverbindung in das nächste Gefecht. Jetzt beide.
- **Prüfungen:** `node --test-reporter=tap --test IronPath/tests/*.test.mjs` (Repo-Wurzel, CI-identisch,
  Serienlauf – `-P 4` zählt Falsch-Fails) auf Commit `e83454c`: **1235 Tests, 1234 pass, 0 fail,
  exit 0**. Vor der Harness-Pflege derselbe Lauf: **1219 Tests, 22 fail**, alle 22
  `ERR_UNSUPPORTED_RESOLVE_REQUEST` auf `./ground-tracks.mjs?v=…` aus den `data:`-URL-Harnesses –
  dieselbe Zahl und dieselbe Signatur wie auf `main` vor dem Rückbau.
  - **Neu `tests/road-geometry.test.mjs` (14):** Tangentenstetigkeit (Lücke < 1e-9) über alle drei
    Karten **und** das Zickzack; Start/Ende bleiben exakt die Simulations-Endpunkte; Klemmung auf die
    Hälfte des kürzeren Nachbarn; Fillet berührt **beide** Segmente und die Tangentenpunkte liegen
    **innerhalb** ihrer Segmente (Regressionsschutz für Fehler 1); Offset-Kontinuität bei allen in der
    Grafik verwendeten Abständen (13/15/21/23/24,5/25/35, beide Seiten); konzentrische Bögen mit
    `r−d·turn`; exakte Offset-Bogenlänge; Sampling ohne Sprünge; Tangente dreht ≤ 0,05° je halbem
    Pixel; Deko erreicht **jeden** Bogen; Spitze bei übersetztem Versatz stetig; Abweichung
    Mittellinie↔Polygon geschlossen **und** gegen Messung geprüft; Radius 0 reproduziert das
    Rohpolygon exakt; defekte Eingänge werfen nicht.
  - **`tests/road-design.test.mjs` umgeschrieben (12)** – von einem Farb- zu einem **Geometrie**vertrag:
    höchstens **ein** `moveTo` je Stroke (nichts wird mehr segmentweise gemalt), echte `arc`-Befehle,
    **einer je Ecke** in jeder Lage ≥ 56 px, Lagenstapel absteigend, Spurrillen als je eine
    Offsetkurve pro Seite, Schwellen und Planken **gemessen** durch die Bogenmittelpunkte (Abstand zum
    Segment, nicht zu seinen Endpunkten), Schienen halten ihr 13-px-Maß ab dem ersten Meter,
    Guardrails je Bogen, Dash wird zurückgesetzt, Textur liegt **über** der Fahrbahn, alle Karten malen
    ohne Wurf, der `forest`-Stummel bleibt Teil der Straße, `junction` malt keine Straßenlagen.
  - **Neu `tests/ground-tracks.test.mjs` (16):** misst die zwei Behauptungen, die das Modul bisher nur
    im Kommentar hatte – es schreibt **nie** in den übergebenen Zustand (geprüft gegen ein
    `Object.freeze`-tiefgefrorenes Objekt, byte-identisch danach; ausgegebene Marken sind Kopien) und
    Marken verblassen wirklich (`alpha` 1 → 0,5 → Verfall). Dazu Schrittmaße je Einheitstyp
    (13/13/14/9,5/12 px), Übertrag des Restwegs, Boss schwerer als Panzer, Bomber und Flieger spurlos,
    Schiene statt Stiefel auf `junction`, Teleport ab 70 px ohne Schmier, **4** Marken Obergrenze pro
    Sample, Klon-Zuordnung bis 45 px, Pause altert nichts, rückwärts laufende Uhr setzt zurück, Cap mit
    Untergrenze, `reset()`, defekte Eingänge, Maler-Kontextbilanz (`save`/`restore`), Themen-Paletten
    mit Rückfall, und ein **Verdrahtungsschutz auf `game.js`** (zwei Rekorder, beide Reset-Stellen,
    `sample` in Sekunden mit `paused` und `theme`).
  - **Kosten gemessen:** Pfadaufbau + 7 Offsets + 3 Deko-Durchläufe = **29 µs** auf der längsten Karte
    (0,17 % eines 16,7-ms-Frames); `drawTerrain` cachet die gemalte Ebene je Karte
    (`terrainCache`, feste Rasterauflösung), fällt also einmal pro Gefechtsfeld an, nicht pro Frame.
    Die alte Messung „970 → 1911 Canvas-Operationen (+97 %)" bezog sich auf den **Erstbau** der Ebene.
- **Cache-Welle `20261121-road1`:** Token `20261121-rollback1` → `20261121-road1` in **79 Dateien,
  276 Token**. Geprüft: im Diff gegen die Basis bleiben genau **7 Nicht-`?v=`-Zeilen**
  (`index.html:7` Meta, `:213` und `:326` die zwei `class="build-stamp"`, `release-version.json:3`,
  `login-scene.mjs:5`, `browser-tests/avatar-handover.cjs:109`,
  `browser-tests/interface-smoke.cjs:132`) – null Produktlogik. Die drei **historischen** Aussagen in
  `patch-notes.mjs` (Zeilen 48, 55, 59 zum Stand `rollback1`) sind absichtlich **unverändert**; der
  neue Feldnotiz-Eintrag trägt die neue Welle und wird damit automatisch zur `data-live`-Karte.
- **Grenzen – Nachweisgrad ehrlich:**
  - **Die Simulation läuft weiter exakt auf dem eckigen Polygon** (`PATH[e.segment]` in
    `simulation.mjs`); geglättet wird ausschließlich die Darstellung. Bei 90° und Radius 34 weicht die
    Polygon-Ecke um **14,08 px** von der geglätteten Mittellinie ab. Die Fahrbahn ist 60 px breit
    (Halbbreite **30 px**), ein Gegner steht also immer auf Asphalt – dieser Abstand ist per Test
    gepinnt (`cornerDeviation(34,90°) < 60/2`), damit ein späterer größerer Radius nicht
    stillschweigend Einheiten von der Straße schiebt. Optisch kann ein Gegner die Kurve minimal
    schneiden; messbar, innerhalb der Fahrbahn, und dem Betreiber vor der Entscheidung genannt.
  - **Keine Geräteabnahme.** Kein automatisierter Lauf bestätigt die Optik auf einem iPhone/iPad;
    dieser PR behauptet das nicht. Sichtprüfung nach dem Laden: der Stempel muss **BUILD
    20261121-road1** zeigen – ein älterer Stempel bedeutet Cache, nicht Code.
  - Der in `IPL-0090` gemeldete Einfrier-Fehler wird durch diesen PR **weder bestätigt noch
    widerlegt**. Die einzige belegte Freeze-Ursache (`bossPhaseLabel` ohne Import, PR `#338`) bleibt
    entfernt und wird hier nicht wieder eingeführt; `game.js frame()` hat weiterhin **kein** `try/catch`
    um `draw()`.
  - Simulation, Balance, Multiplayer-Protokoll und Speicherstände sind nicht berührt.
- **Git / PR / Release:** Commits `dd3f01fd00a70a9ce88e09819fd9b9287512050b` (Geometriemodul +
  14 Tests), `4bb603b68ca607de48a5a4939b332dd9269e92ba` (Maler + umgeschriebener Straßenvertrag),
  `e83454c63143f938b25a306ea867ae518b365dfb` (Bodenspuren + 13 Harness-Listen + 16 Tests).
  PR **`#341`** eröffnet auf `main`. Cache-Welle und Feldnotizen folgen als eigener Commit, sobald die
  PR-Nummer belegt ist.
- **Offen / nächster Schritt:** CI-Ergebnis auf dem Endstand, Merge, Pages-Build und Auslieferung
  prüfen und als Ereignis nachtragen; echte Geräteabnahme durch den Betreiber. Danach **Teil 2**:
  `#336` komplett neu implementiert (dickerer pulsierender Auswahlring auf Bauplätzen + Hover-Vorschau
  mit Wellennummer und Anzahl nächster Gegner) **einschließlich** der fehlenden deutschen Einträge der
  4 Literale, als eigener PR, ohne die Log-Zerstörung aus `#336` zu wiederholen.

### Ereignis-Nachtrag zu IPL-0091 – Veröffentlichung belegt (nachträglich, 2026-11-21 UTC)

- **CI auf dem Endstand `bde6a7e1d7d69aad378c57664a8651083093e45d`:** Run `44962270748`,
  **alle Prüfungen `success`**, darunter `game-regressions` — derselbe Check, der in `#335`, `#336`,
  `#337`, `#338` und `#339` jeweils rot war und trotzdem gemergt wurde. Der vorangegangene Push
  (`e83454c`, vor der Cache-Welle) lief als Run `44962265422` ebenfalls vollständig `success`.
  `gh pr checks 341`: **13/13 pass**.
- **Merge:** PR `#341` `state=MERGED`, `mergedAt=2026-11-21T23:42:42Z`,
  Merge-Commit `b056ca3c68b9ddfdb675e1b80a5e7c975d7f0f95`. `main` steht auf genau diesem Commit
  (`gh api …/commits/main` → `b056ca3c…`).
- **Pages:** Build aus `b056ca3c68b9ddfdb675e1b80a5e7c975d7f0f95`, `status=built`,
  `duration=44626 ms`, kein Fehler. `build_type=legacy`, Quelle `main`/`/` — Auslieferung ist also
  der Repo-Stand ohne Build-Schritt.
- **Auslieferung geprüft** über `gh api …/contents/<pfad>?ref=main`: `road-geometry.mjs` 16041 Byte,
  `ground-tracks.mjs` 5032 Byte, `assets/road3-forest.jpg` 499339 Byte, `release-version.json`
  47 Byte; `index.html` trägt `<meta name="ironpath-build" content="20261121-road1">`.
  **Ehrliche Grenze:** die live URL `https://0815games.github.io/IronPath/` wurde aus diesem
  Arbeitsraum **nicht** abgerufen (kein ausgehender Zugriff auf diesen Host); der Nachweis führt über
  den Repo-Inhalt auf `main` und den Pages-Build-Status, nicht über eine HTTP-Antwort der Seite.
- **Weiter offen:** echte Geräteabnahme durch den Betreiber (iPhone/iPad Safari) — Optik der Kurven,
  Lesbarkeit der Straße, Bodenspuren, und Sichtprüfung des Stempels **BUILD 20261121-road1** in
  Ladeszene und Einstellungen. Der gemeldete Einfrier-Fehler bleibt durch diesen Stand weder
  bestätigt noch widerlegt.
- **Herkunft dieses Nachtrags:** Er stand bereits im Patch-Log des Vorzweigs
  `arena/d5645359-0815games-github-io`, Commit `a4d093ef` („IronPath: record the
  proven release events for PR #341 (IPL-0091)"), der nur auf diesem Zweig lag und
  nie nach `main` kam. Beim Aufräumen übernommen; die Kennungen (Run-IDs,
  Merge-Commit, Pages-Build) sind dieselben. Die Übernahme läuft als eigener
  Commit dieses Zweigs; dessen Kennung kann ein Commit nicht selbst enthalten,
  sie steht im Eintrag `IPL-0092`.
## IPL-0092 – Ordnung im Repository: Spielwurzel von Arbeitsmaterial getrennt, Patch-Ablauf als Werkzeug, Patch-Log geteilt (`20261121-order1`, PR `#342`)

- **Zeit / Quelle:** 2026-11-21 UTC. Auftrag des Betreibers, wörtlich: „Lass uns das repo mal
  anschauen und Ordnung reinbringen. Saubere Struktur für jedes neues Update / patch inkl Handhabung
  für getane Arbeiten im patchlog und Prüfungen vor und nach den patches. Struktur der Ordner und
  alles. Sauber was zum Arbeiten benutzt wird trennen von Game Dateien." Vier abgefragte
  Entscheidungen, bindend: Trennung = **A, Spielwurzel entrümpeln** (kein Umbau der CI-Pfade, kein
  Wechsel des Pages-Builds); Prozess = **Doku + Skripte** (kein CI-Job, der es erzwingt); Patch-Log =
  **neueste 20 Einträge + Archiv**; Ballast = **nichts löschen, nur umräumen**.
- **Block / Ziel:** kein Spiel-Block. Ziel ist die Arbeitsfähigkeit des Repositorys selbst: was der
  Browser lädt von dem trennen, womit gearbeitet wird, und den Patch-Ablauf wiederholbar machen. Am
  Spiel ändert sich nichts - Grafik, Simulation, Balance, Speicherstände und Mehrspieler sind
  unverändert.
- **Branch / Basis:** `arena/f49da0c2-0815games-github-io` ab
  `b056ca3c68b9ddfdb675e1b80a5e7c975d7f0f95` (`main`, Merge von PR `#341`).
- **Änderungen / Dateien:** zehn Commits, je ein logischer Schritt.
  1. `e895087e` - 26 Markdown-Dateien aus der Spielwurzel nach `docs/` (34 relative Links
     umgeschrieben, 8 externe Referenzstellen nachgezogen: `../../AGENTS.md`, `patch-notes.mjs`, zwei
     Tests, `tower-specialization.mjs`, zwei READMEs); neu `README.md` als Strukturkarte; neu
     `tests/repo-structure.test.mjs`.
  2. `f88a4c53` - drei Module ohne Importeur nach `scripts/`: `map-review-render.mjs`,
     `workshop-server-account.mjs`, `workshop-service-config.mjs`. **Release-Inventar der Spielwurzel
     204 → 201 Dateien**, weil `release-tools/stage-version.mjs` jede `.mjs/.js/.css` der Wurzel in
     jeden gestagten Build kopiert. Drei Pfade im Skript korrigiert, darunter der Ausgabeordner, der
     nach dem Umzug sonst ins Repository geschrieben hätte. Struktur-Test um drei Wächter erweitert.
  3. `da58f519` - `tests/production-cors-probe.test.mjs` startet seinen Unterprozess mit `cwd` =
     Repo-Root; vorher lief die Suite nur vom Repo-Root grün.
  4. `7216229a` - neu `scripts/patch-lib.mjs`, `scripts/patch-check.mjs` (Vor-/Nachprüfung),
     `scripts/patch-bump.mjs` (Cache-Welle, Trockenlauf als Standard), `tests/patch-tooling.test.mjs`
     (11 Tests gegen ein Miniatur-Repository mit echtem `git init`).
  5. `4662afbe` - der PEM-Kopf in der Fixture wird zur Laufzeit zusammengesetzt, damit die eigene
     Geheimnis-Prüfung nicht die Testdatei selbst flaggt.
  6. `5b8f3a68` - Ereignis-Nachtrag zu `IPL-0091` übernommen. Das ist der Commit, dessen Kennung der
     Nachtrag selbst nicht nennen kann; sie steht hier.
  7. `ca38e70f` - Log geteilt: `docs/PATCH-LOG.md` 4040 → 610 Zeilen (neueste 20), neu
     `docs/PATCH-LOG-ARCHIV.md` 3441 Zeilen (`IPL-0001`…`IPL-0071`), neu
     `tests/patch-log-archive.test.mjs`.
  8. `e6d6c4ff` - neu `docs/PATCH-ABLAUF.md` und `docs/patch-log-vorlage.md`; die Vorlage im Log wird
     zum Verweis, damit sie nicht an zwei Stellen auseinanderläuft.
  9. `b8cf92aa` - Cache-Welle `20261121-road1` → `20261121-order1` über 79 Dateien per
     `scripts/patch-bump.mjs --apply`, Feldnotizen-Eintrag `order1` in `patch-notes.mjs`, dieser
     Log-Eintrag, `IPL-0072` ins Archiv verschoben.
  10. dieser Commit - `docs/PATCH-ABLAUF.md` bekommt §11, eine Release-Checkliste mit **25 Kästchen**
     zum Kopieren. Bisher waren §3, §7 und §8 Prosa und es gab im ganzen Arbeitsmaterial keinen
     einzigen abhakbaren Punkt; unter Zeitdruck musste die Reihenfolge jedes Mal neu zusammengesucht
     werden. Jedes Kästchen ist eine Zeile mit Zeiger auf den erklärenden Abschnitt, absichtlich keine
     zweite Fassung der Regeln, damit nichts auseinanderlaufen kann - derselbe Grund, aus dem die
     Log-Vorlage nur noch an einer Stelle steht.
- **Prüfungen:** volle Suite vom Repo-Root im Serienlauf, genau wie CI, über dem gepushten Stand
  `e6d6c4ff`: **1258 tests / 1258 pass / 0 fail / 0 skipped, EXIT=0** (Log `/tmp/suite-docs-tools.log`
  des Arbeitsraums, nicht Teil des Repositorys). Nochmals über dem kompletten Endbaum **einschließlich
  dieses Eintrags, der Cache-Welle und der Feldnotizen**: **1258 / 1258 / 0 fail / 0 skipped, EXIT=0**
  (`/tmp/suite-final.log`). Zwischenstände: 1253/1253/0 nach Schritt 5,
  1242/1241/0 mit **1 skipped** nach Schritt 2. Vor diesem Auftrag: 1242 tests / 1241 pass / 1 fail /
  1 skipped. Isoliert: `repo-structure` 7/7, `patch-tooling` 11/11, `patch-log-archive` 5/5,
  Verträge 7 Dateien / 28 Tests, Feldnotizen- und Stempelverträge zusammen 44/44.
  Link-Prüfung über alle Markdown-Dateien unter `IronPath/`: 52 Dateien, 0 tote Links. Scan auf CJK-,
  kyrillische und Fullwidth-Zeichen über alle neuen und geänderten Dateien: 0 Treffer.
  Bissfestigkeit der Wächter geprüft, nicht angenommen: ein absichtlich in die Spielwurzel gelegtes
  Modul ohne Importeur ließ Wächter 4 und 5 anschlagen (Probe angelegt und wieder gelöscht, 0 Reste).
  Die Cache-Welle wurde zuerst als Trockenlauf gefahren und gegen die Handarbeit aus `IPL-0091`
  gerechnet: identisch 79 Dateien, 276 Token-Vorkommen, 7 Anker-Zeilen, 3 geschützte Historien-Zeilen
  in `patch-notes.mjs`. Im Diff der Welle stehen exakt 14 Nicht-`?v=`-Zeilen = die 7 Anker alt/neu.
- **Git / PR / Release:** PR `#342`, geöffnet aus diesem Zweig gegen `main`. Zum Zeitpunkt dieses
  Eintrags **offen**: kein CI-Ergebnis, kein Merge, kein Pages-Build, keine Auslieferung. Der Stempel
  `20261121-order1` ist im Arbeitszweig gesetzt, nicht veröffentlicht.
- **Grenzen, ehrlich:**
  - **Kein Spieler sieht eine Änderung.** Nur die Cache-Welle macht sich bemerkbar: ein Gerät lädt die
    Module einmal neu.
  - Pages baut weiter mit `build_type: legacy` aus `main`, Pfad `/`: der ganze Baum bleibt öffentlich
    erreichbar. Dieser Auftrag trennt Arbeitsmaterial **strukturell**, er nimmt nichts aus der
    Auslieferung heraus. Die alten Doku-Adressen `/IronPath/*.md` gelten nicht mehr, sie liegen unter
    `/IronPath/docs/*.md`. Wer Doku und Tests wirklich nicht ausliefern will, bräuchte einen
    Actions-Build (Variante C, bewusst nicht gewählt).
  - Gelöscht wurde nichts, wie entschieden. Die drei umgeräumten Module sind weiter unreferenziert
    (`workshop-server-account.mjs` hat einen Test, die anderen beiden nicht), und die 1-Byte-Datei
    `IronPath/empty` liegt weiter in der Spielwurzel.
  - Kein CI-Job erzwingt den neuen Ablauf. `patch-check.mjs` meldet, es verhindert nichts.
  - **Keine Geräteabnahme** und kein Abruf der live URL. `--verify-main` belegt Repo-Inhalt auf `main`
    plus Pages-Baustatus, nicht die Auslieferung im Browser.
- **Nebenfund, nicht angefasst:** `docs/PATCH-BLOECKE.md` endet mit einem **doppelt angehängten
  Schlussblock** (23 Zeilen, 2132 Zeichen, ab Zeichen 128141): `## Gemeinsame Freigabe` steht zweimal,
  ebenso der Admin-Login-Absatz, und die Wiederholung beginnt mit dem abgeschnittenen Wortfragment
  `twerden sowie nach Abklingzeit.`. Gemessen gegen `main` (`b056ca3c`): beide Fassungen sind dort
  identisch 1392 Zeilen, also **ist der Fehler älter als dieser Auftrag** und nicht durch das Umräumen
  entstanden. Der Diff `main` → dieser Stand zeigt 27 geänderte Zeilen, und alle 27 sind reine
  Link-Umschriebe (`firebase/…` → `../firebase/…`); keine Unicode-Schädigung. Inhaltlich ist der Block
  einmal vorhanden, deshalb wurde nichts gelöscht - die Entscheidung liegt beim Betreiber.
- **Offen / nächster Schritt:** CI-Ergebnis, Merge und Pages-Build zu PR `#342` prüfen und als
  Ereignis nachtragen, sobald sie tatsächlich eingetreten sind. Vom Betreiber zu stellen:
  `game-regressions` als Pflicht-Check (dieser Arbeitsraum bekommt auf `branches/main/protection` ein
  `403`), die Geräteabnahme der Straße aus `#341` auf iPhone/iPad Safari, und die Entscheidung über den
  doppelten Schlussblock in `PATCH-BLOECKE.md`. Danach Teil 2 des Auftrags aus `IPL-0091`: `#336`
  komplett neu implementiert (dickerer pulsierender Auswahlring, Hover-Vorschau mit Welle und Anzahl
  nächster Gegner, einschließlich der fehlenden deutschen Einträge für vier Literale).
### Ereignis-Nachtrag zu IPL-0092 – Veröffentlichung belegt (nachträglich, 2026-11-22 UTC)

Die folgenden Ereignisse sind eingetreten und geprüft; sie stehen hier, weil sie
zur Zeit des Eintrags oben noch offen waren. Jede Zeile nennt die Kennung, mit der
sie geprüft wurde.

- **CI auf dem PR-Kopf:** `gh pr checks 342` = **13 von 13 pass, 0 fail**. Run
  `44971539781` mit den Jobs `game-regressions` (`.../job/137052198313`) und
  `database-rules` (`.../job/137052198482`), dazu `interface-browser-smoke`, acht
  `party-finalization-browser`-Varianten und zwei Vercel-Checks. `game-regressions`
  war damit zum dritten Mal in Folge grün (`#340`, `#341`, `#342`, je 13 von 13);
  bei `#335` bis `#339` war derselbe Check jeweils rot (`#335` und `#339`
  stichprobenartig nachgeprüft: `fail`) und wurde trotzdem gemergt.
- **PR:** `gh pr view 342 --json state,mergedAt,mergeCommit` =
  `state=MERGED mergedAt=2026-11-22T01:37:31Z`, Merge-Commit
  `d9a02461b6c3921f45e4dbabb3a9a22cf61ac979` in `main`.
- **Pages:** Workflow-Run `44972324714` (`pages build and deployment`)
  `completed/success`; `gh api repos/.../pages/builds/latest` =
  `status=built duration_ms=45446 commit=d9a02461b6c3921f45e4dbabb3a9a22cf61ac979
  created=2026-11-22T01:37:32Z`.
- **Auslieferung, über `gh api repos/.../contents/<pfad>?ref=main` belegt.** Neu
  auf `main` vorhanden: `IronPath/docs/PATCH-ABLAUF.md` (13670 B),
  `IronPath/docs/PATCH-LOG-ARCHIV.md` (259052 B), `IronPath/docs/PATCH-LOG.md`
  (94065 B), `IronPath/scripts/patch-check.mjs` (18746 B),
  `IronPath/scripts/patch-bump.mjs` (6709 B), `IronPath/scripts/patch-lib.mjs`
  (5786 B), `IronPath/tests/patch-log-archive.test.mjs` (5034 B),
  `IronPath/tests/patch-tooling.test.mjs` (16244 B), `IronPath/README.md`
  (3956 B). Alte Pfade liefern `404`: `IronPath/PATCH-ABLAUF.md`,
  `IronPath/PATCH-LOG.md`, `IronPath/map-review-render.mjs`,
  `IronPath/workshop-service-config.mjs`. Stempel auf `main`:
  `release-version.json` `"build": "20261121-order1"`, `index.html:7`
  `<meta name="ironpath-build" content="20261121-order1">` und `index.html:213`
  `BUILD 20261121-order1`. `IronPath/empty` liegt weiter mit 1 B in der
  Spielwurzel - wie entschieden wurde nichts gelöscht.
- **Ehrliche Grenzen.** Die live URL wurde **nicht** abgerufen; belegt ist der
  Inhalt auf `main` und der fertige Pages-Build, nicht was ein Browser lädt.
  **Keine Geräteabnahme** auf iPhone oder iPad. `game-regressions` ist weiter
  **kein Pflicht-Check**: `branches/main/protection` liefert diesem Arbeitsraum
  `403`, stellen kann das nur der Betreiber. Der doppelte Schlussblock in
  `docs/PATCH-BLOECKE.md` ist weiter vorhanden und unentschieden.
- **Herkunft dieses Nachtrags.** Er steht als eigener Commit auf dem Arbeitszweig
  `arena/f49da0c2-0815games-github-io`, der mit PR `#342` gemergt wurde; die
  Kennung des Commits und des PR, die **diesen Nachtrag** nach `main` bringen,
  kann er nicht selbst enthalten - sie steht im PR-Text und in Git. Genau dieser
  Umstand war bei `IPL-0091` der Grund, warum dessen Nachtrag auf `main` fehlte:
  er lag nur im Vorzweig `a4d093ef` und wurde erst mit `5b8f3a68` übernommen.

## IPL-0093 – Doppelblock im Patchplan repariert und `IronPath/empty` gelöscht (keine Spieländerung, keine Cache-Welle)

- **Zeit / Quelle:** Betreiberauftrag in dieser Sitzung, wörtlich: „Mach die 2 punkte bitte fertig.“ Grundlage sind die zuvor getroffenen Entscheidungen: doppelten Schlussblock in `docs/PATCH-BLOECKE.md` reparieren und `IronPath/empty` jetzt doch löschen.
- **Block / Ziel:** Kein Spiel-Block. Ziel ist nur, die zwei offenen Aufräumpunkte aus der Repository-Ordnung abzuschließen, ohne Spieldateien, Balance, Speicherstände oder Mehrspieler zu ändern.
- **Branch / Basis:** `arena/f3b31c90-0815games-github-io` ab `4e26e00995a957f0e325f212ff19e5a9e3e989d5` (`main`, Merge von PR `#343`).
- **Änderungen / Dateien:**
  - `IronPath/docs/PATCH-BLOECKE.md`: Die doppelte Wiederholung am Dateiende entfernt (Zeilen 1381–1391, 1.066 Zeichen). Vor dem Schnitt wurde zeichenweise geprüft: Der entfernte Teil ist nur die Wiederholung des schon vorhandenen Schlusses und beginnt mitten im Wort (`twerden sowie nach Abklingzeit.`); die vollständige Fassung mit Admin-Login-Punkt und `## Gemeinsame Freigabe` bleibt genau einmal stehen. Marker danach: `## Gemeinsame Freigabe` 1×, Admin-Login-Punkt 1×.
  - `IronPath/empty`: Die unreferenzierte 1-Byte-Datei (nur Zeilenumbruch) gelöscht. Im Baum gibt es keinen Code-Verweis auf diese Datei; `release-tools/stage-version.mjs` kopiert aus der Spielwurzel nur `.mjs`/`.js`/`.css`, daher war `empty` auch nicht Teil des Release-Inventars. Die frühere Entscheidung „nichts löschen“ ist für diese eine Datei durch den ausdrücklichen Betreiberwunsch aufgehoben; der historische Feldnotizen-Satz zu PR `#342` bleibt als damaliger Stand unverändert und wird durch diesen Eintrag für die Gegenwart abgelöst.
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0073` vollständig ans Ende des Archivs verschoben, die Kennungsgrenzen in beiden Köpfen auf `IPL-0001` bis `IPL-0073` nachgezogen und dieser Eintrag als neuester angehängt. Das Log führt damit weiter die neuesten 20 Einträge (`IPL-0074` bis `IPL-0093`).
- **Prüfungen:**
  - Zieltests vor der Log-Rotation: `node --test IronPath/tests/repo-structure.test.mjs IronPath/tests/patch-log-archive.test.mjs IronPath/tests/patch-tooling.test.mjs` = **23 Tests, 23 bestanden, 0 fehlgeschlagen, 0 übersprungen**.
  - Gesamtsuite im zunächst flachen Klon: `node --test IronPath/tests/*.test.mjs` = **1.258 Tests, 1.257 bestanden, 0 fehlgeschlagen, 1 übersprungen**. Der eine übersprungene Test war `release-pages-site` wegen fehlender Vorfahren-Commits im flachen Klon; nach `git fetch --unshallow origin` lief `node --test IronPath/tests/release-pages-site.test.mjs` mit **6/6 bestanden, 0 übersprungen** nach.
  - Nach der Log-Rotation: `node --test IronPath/tests/patch-log-archive.test.mjs IronPath/tests/repo-structure.test.mjs` = **12 Tests, 12 bestanden, 0 fehlgeschlagen, 0 übersprungen**; `node IronPath/scripts/patch-check.mjs` = **93 Einträge `IPL-0001` bis `IPL-0093` lückenlos (Log 20 + Archiv 73), 0 Fehler, 1 Hinweis** (zum Prüfzeitpunkt noch uncommittete Änderungen).
  - Keine Geräte- oder Browserabnahme: Es wurde keine Datei geändert, die der Browser lädt. Der Build-Stempel bleibt unverändert `20261121-order1`; eine Cache-Welle ist für diese Doku-/Aufräumänderung nicht nötig.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet` auf `arena/f3b31c90-0815games-github-io`. Commit, Push, PR, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen.
- **Offen / nächster Schritt:** PR für diese zwei Punkte öffnen, CI abwarten und erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Danach getrennt angehen: Spielwurzel-Struktur der vielen JavaScript-/Moduldateien ordnen und anschließend die Patch-Skripte auf Zusammenlegung/Vereinfachung prüfen.

### Ereignis-Nachtrag zu IPL-0093

- **Commit / PR:** Der Arbeitscommit ist `0f2e1e4d14aa5c1151e10219232408800969620c` auf `arena/f3b31c90-0815games-github-io`; Pull-Request `#344` („Doppelblock reparieren und IronPath/empty löschen“) wurde mit diesem Stand geöffnet.
- **CI:** `gh pr checks 344` endete mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend**. Belegt im Actions-Run `44975676529`, darunter `game-regressions` (Job `137064918377`), `database-rules` (Job `137064918320`) und `interface-browser-smoke` (Job `137064918143`), dazu die acht `party-finalization-browser`-Varianten und zwei Vercel-Checks.
- **Merge:** `gh pr view 344 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-22T02:31:00Z`, Merge-Commit `3e6aeb1f093aab2dc88abef4bc5bd4582f34d9dd` in `main`.
- **Pages:** Der Workflow `pages build and deployment` lief als Run `44976460159` auf dem Merge-Commit mit `completed/success`; `gh api repos/0815games/0815games.github.io/pages/builds/latest` meldete danach `status=built`, `duration=46284` ms, `commit=3e6aeb1f093aab2dc88abef4bc5bd4582f34d9dd`.
- **Auslieferung auf `main` belegt:** `IronPath/docs/PATCH-BLOECKE.md` ist per Contents-API vorhanden (131262 B, SHA `3cef02715916a0388685f5758a3d716823bc11e8`), `IronPath/docs/PATCH-LOG.md` ebenfalls (97407 B, SHA `041c0a59348550fd91c9290dbb54b2c2b741c425`), `IronPath/docs/PATCH-LOG-ARCHIV.md` ist vorhanden, und `IronPath/empty` liefert auf `main` **404** – die Datei ist also auch ausgeliefert entfernt.
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Repository-Inhalt auf `main` und der fertige Pages-Build, nicht eine Sichtprüfung im Browser. Eine Geräteabnahme war für diese Änderung nicht vorgesehen, weil keine browsergeladene Datei geändert wurde. Ob `game-regressions` inzwischen Pflicht-Check ist, wurde für diesen Nachtrag nicht erneut geprüft.
- **Herkunft dieses Nachtrags:** Er steht als eigener Commit auf demselben Arbeitszweig nach dem Merge von `#344`; Commit- und PR-Kennung dieses Nachtrags selbst stehen deshalb nicht hier, sondern in Git und im PR-Text.


## IPL-0094 – Wegbereiter für Modul-Ordner: Packager und Wächter lernen `GAME_MODULE_FOLDERS` (keine Datei verschoben, keine Cache-Welle)

- **Zeit / Quelle:** Betreiberauftrag in dieser Sitzung: „Schlag mir was gutes vor mit Verbesserungen zu allem.“ Vier abgefragte Entscheidungen, alle bindend: Struktur = **Gruppen in Unterordner** (Eintrittspunkte, HTML und CSS bleiben in der Wurzel); Gruppierung = **nach Fachgebiet**; Tempo = **scheibenweise, ein PR pro Gruppe**; Patch-Skripte = später **ein Befehl `patch.mjs`**. Dieser Eintrag ist Phase 1 (Wegbereiter); es wandert noch keine einzige Spieldatei.
- **Block / Ziel:** Kein Spiel-Block. Ziel ist, den späteren Umzug der 187 flach liegenden `.mjs`-Module sicher zu machen, bevor er beginnt: `release-tools/stage-version.mjs` kopierte bisher nur Wurzel-`.mjs`/`.js`/`.css` in gestagte Builds — ein Modul in einem Unterordner wäre dort still verschwunden. Jetzt versteht der Packager die künftigen Fach-Ordner, und die Wächter schauen in dieselben Ordner.
- **Branch / Basis:** `arena/5ae9c8c6-0815games-github-io` ab `8b9ee57b89eb154b8585b7aa14336f4763e909f9` (`main`, Merge von PR `#345`).
- **Änderungen / Dateien:**
  - `IronPath/release-tools/stage-version.mjs`: Neue exportierte Liste `GAME_MODULE_FOLDERS` (`battle`, `core`, `i18n`, `net`, `ui`, `workshop`) als einzige Quelle der Wahrheit. Der Packager kopiert diese Ordner — wo sie existieren — rekursiv unter ihren relativen Pfaden und nur Code (`.mjs`/`.js`/`.css`); Symlinks und Nicht-Code-Dateien in einem Modul-Ordner lassen das Staging laut scheitern, statt still verloren zu gehen oder still mitzufahren. Fehlende Ordner werden übersprungen, damit eine Gruppe erst umziehen kann, nachdem der Packager sie versteht.
  - `IronPath/tests/release-stage-version.test.mjs`: Fixture um `i18n/demo.mjs`, `i18n/nested/deep.mjs` und `ui/panel.css` erweitert (Dateizahl und Inventar geprüft); neuer Test, dass Nicht-Code und Symlinks in Modul-Ordnern abgelehnt werden; der Echtbaum-Test prüft jetzt für jeden vorhandenen Modul-Ordner, dass jede Code-Datei gestagt wird.
  - `IronPath/tests/repo-structure.test.mjs`: Der Spielgraph wird jetzt pfadgenau aufgelöst (ein `../core/x.mjs` aus `i18n/` ist dasselbe Ziel wie `./core/x.mjs` aus der Wurzel) statt nur Dateinamen zu vergleichen; das Release-Inventar umfasst Wurzel plus Modul-Ordner rekursiv; erlaubte Ordner sind `assets/`, `release-tools/` und die `GAME_MODULE_FOLDERS`; neuer Wächter, dass die Liste sortiert, doppelfrei und disjunkt zu allen Arbeitsordnern ist. Importiert wird dieselbe Liste aus `stage-version.mjs`, damit Packager und Wächter nicht auseinanderlaufen können.
  - `IronPath/tests/translation-coverage.test.mjs`: Modul- und Wörterbuch-Scan laufen rekursiv über Wurzel plus Modul-Ordner (vorher nur `readdirSync(root)` — nach einem Umzug hätte der Test die Hälfte des Spiels still nicht mehr gesehen und trotzdem volle Abdeckung gemeldet).
  - `IronPath/tests/multiplayer-build-stamp.test.mjs`: Der Importeur-Scan läuft rekursiv, und das Import-Muster erkennt jetzt auch Ordnerpfade (`./i18n/x.mjs?v=…`) statt nur `./x.mjs`.
  - `IronPath/README.md` und `IronPath/docs/PATCH-ABLAUF.md`: Die sechs Fach-Ordner mit Inhaltstabelle bzw. Arbeitsregel dokumentiert (neues Modul ⇒ Fach-Ordner; Umzug heißt Importe nachziehen, Staging-Inventar vergleichen, eigene Cache-Welle).
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0074` vollständig ans Ende des Archivs verschoben, Kennungsgrenzen auf `IPL-0001` bis `IPL-0074` nachgezogen; das Log führt die neuesten 20 (`IPL-0075` bis `IPL-0094`).
- **Prüfungen:**
  - Staging-Vergleich vorher/nachher mit identischem Build-Namen: `node IronPath/release-tools/stage-version.mjs IronPath /tmp/stage-before 20990101-baseline1` (vor der Änderung) und danach in `/tmp/stage-after` — **711 gestagte Dateien, Inventar inklusive aller SHA-256-Hashes identisch**. Am ausgelieferten Spiel ändert sich also nichts.
  - Bissprobe: Eine verwaiste Probe-Datei `IronPath/i18n/zz-probe.mjs` ließ `repo-structure` wie vorgesehen rot werden (7 bestanden, 1 fehlgeschlagen, Fund beim Namen genannt); Probe und Ordner danach entfernt, Test wieder 8/8 grün. Die Probe ist nicht Teil des Baums.
  - Gesamtsuite im vollständigen Klon (nach `git fetch --unshallow origin`): `node --test IronPath/tests/*.test.mjs` = **1.260 Tests, 1.260 bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0** (vorher 1.258; +2 neue Tests aus dieser Phase).
  - `node IronPath/scripts/patch-check.mjs` vor dem Log-Eintrag: **0 Fehler**; die sieben Vertragsdateien liefen mit **30 Tests, 30 grün** (vorher 28; die zwei neuen Tests zählen mit).
  - Nach der Log-Rotation: `node --test IronPath/tests/patch-log-archive.test.mjs IronPath/tests/repo-structure.test.mjs` = **13 Tests, 13 bestanden, 0 fehlgeschlagen**; `patch-check` danach **0 Fehler, 1 Hinweis** (die noch uncommitteten Änderungen dieser Phase selbst).
  - Keine Geräte- oder Browserabnahme: Es wurde keine Datei geändert, die der Browser lädt. Der Build-Stempel bleibt unverändert `20261121-order1`; eine Cache-Welle ist für diesen Wegbereiter nicht nötig.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet` auf `arena/5ae9c8c6-0815games-github-io`. Commit, Push, PR, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen.
- **Offen / nächster Schritt:** PR für Phase 1 öffnen und erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Danach Phase 2 scheibenweise, je ein eigener PR: zuerst `i18n/` (18 `localization-*`-Module), dann `workshop/`, `net/`, `battle/`, `ui/`, `core/`; jede Scheibe mit Import-Codemod, Staging-Vergleich, voller Suite, eigener Cache-Welle und Feldnotizen DE+EN. Phase 3 danach: die drei Patch-Skripte zu einem `patch.mjs` mit Unterbefehlen zusammenführen. Der Bauplatz-Auswahlring aus PR `#336` (ohne Hover-Vorschau) bleibt geparkt und kommt als eigener Spiel-PR nach der Struktur, damit er nicht zweimal angefasst wird.

### Ereignis-Nachtrag zu IPL-0094

- **Commit / PR:** Arbeitscommit `d79ff31c` auf `arena/5ae9c8c6-0815games-github-io`; Pull-Request `#346` („Phase 1: Wegbereiter für Modul-Ordner (Packager und Wächter)“) wurde mit diesem Stand geöffnet.
- **CI:** `gh pr checks 346` endete mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend**. Belegt im Actions-Run `44978489674`, darunter `game-regressions` (Job `137073600434`), `database-rules` (Job `137073600432`) und `interface-browser-smoke` (Job `137073600131`), dazu die acht `party-finalization-browser`-Varianten und zwei Vercel-Checks.
- **Merge:** `gh pr view 346 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-22T03:09:08Z`, Merge-Commit `49b530f7ba3c290b9ab247af0e7211d3963869e9` in `main`.
- **Pages:** Der Workflow `pages build and deployment` lief als Run `44979304520` auf dem Merge-Commit mit `completed/success`; `pages/builds/latest` meldete danach `status=built`, Dauer 46.544 ms, Commit `49b530f7ba3c290b9ab247af0e7211d3963869e9`.
- **Auslieferung auf `main` belegt:** `IronPath/release-tools/stage-version.mjs` ist per Contents-API in der neuen Fassung vorhanden (14.386 B, SHA `efcbf0aae4d89bc416ffbb22634b28300ea585d2`). Die Modul-Ordner `IronPath/i18n`, `IronPath/battle` und `IronPath/ui` liefern weiter **404** — korrekt, denn in Phase 1 ist noch keine Datei umgezogen; die Ordner entstehen erst mit ihren Gruppen in Phase 2.
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Inhalt auf `main` und der fertige Pages-Build. Keine Geräteabnahme, weil keine browsergeladene Datei geändert wurde und sich keine Modul-Adresse geändert hat.
- **Herkunft dieses Nachtrags:** Er steht als eigener Commit auf demselben Arbeitszweig nach dem Merge von `#346`; seine eigene Commit- und PR-Kennung steht deshalb nicht hier, sondern in Git und im PR-Text.


## IPL-0095 – Phase 2, Scheibe 1: Die 18 deutschen Wörterbücher ziehen nach `i18n/` (eigene Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** Betreiberauftrag in dieser Sitzung, wörtlich: „Phase 2, Go“. Grundlage sind die vier Entscheidungen aus `IPL-0094`: Gruppen in Unterordner, nach Fachgebiet, scheibenweise mit einem PR pro Gruppe, Eintrittspunkte/HTML/CSS bleiben in der Wurzel.
- **Block / Ziel:** Kein Spiel-Block. Erster echter Umzug der neuen Struktur: alle 18 `localization-*-de.mjs` liegen künftig in `IronPath/i18n/`. Am Spielverhalten ändert sich nichts — dieselben Wörterbücher, dieselben Texte; nur ihre Adressen ändern sich, deshalb trägt derselbe PR eine eigene Cache-Welle (Feldnotizen-Eintrag und Stempel-Anhebung folgen als zweiter Commit, sobald die PR-Nummer existiert).
- **Branch / Basis:** `arena/a72010f0-0815games-github-io` ab `40323f869f2789391450bc5b432fe36408ae47b0` (`main`, Merge von PR `#347`).
- **Änderungen / Dateien:**
  - 18 Dateien per `git mv` nach `IronPath/i18n/` verschoben. 14 davon sind inhaltlich bytegleich; in 4 Dateien (`localization-advanced-skills-de.mjs`, `localization-campaign-de.mjs`, `localization-cinematics-de.mjs`, `localization-events-de.mjs`) zeigen die Importe auf Wurzel-Module jetzt eine Ebene hoch (`../skills.mjs` usw.); Geschwister-Importe innerhalb von `i18n/` bleiben `./`.
  - `IronPath/language.mjs`: alle 18 Wörterbuch-Importe zeigen auf `./i18n/localization-*-de.mjs`. `language.mjs` selbst bleibt als Eintrittspunkt der Sprachlogik in der Wurzel.
  - Tests nachgezogen: `../localization-…` → `../i18n/localization-…` in 11 Testdateien; die zwei Regex-Behauptungen über `language.mjs` (`first-run-german`, `story-events-german`) auf den neuen Pfad; die `read()`-Pfade in `character-name` und `patch-notes`. Die historischen Wellen-Listen in `browser-tests/cache-wave.cjs` bleiben unverändert — sie beschreiben alte Stempel, keine heutigen Pfade.
  - Zwei Wurzel-Scans, die erst diese Scheibe als Schrumpf-Gefahr entlarvt hat, ordnerfest gemacht: `tests/recruit-screen.test.mjs` las die Wörterbücher per `readdirSync(root)` und fand nach dem Umzug keine mehr (die volle Suite meldete das als fehlende deutsche Labels); `tests/tutorial.test.mjs` prüfte Token-Einigkeit nur an `./`-Importen der Wurzel und löst Spezifizierer jetzt gegen das Verzeichnis des Importeurs auf. Beide lesen jetzt Wurzel plus `GAME_MODULE_FOLDERS`.
  - `IronPath/docs/PATCH-BLOECKE.md`: Die zwei Markdown-Links auf `../localization-…` zeigen auf `../i18n/…` (der Link-Wächter in `repo-structure` meldete sie sonst als tot).
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0075` vollständig ins Archiv verschoben, Grenzen auf `IPL-0001` bis `IPL-0075` nachgezogen; das Log führt die neuesten 20 (`IPL-0076` bis `IPL-0095`).
- **Prüfungen:**
  - Betroffene Tests gezielt: 17 Dateien (u. a. `language`, `translation-coverage`, `repo-structure`, `multiplayer-build-stamp`, `release-stage-version`, `first-run-german`, `story-events-german`, `character-name`, `patch-notes`) = **123 Tests, 123 bestanden** — nach zwei Korrekturen am eigenen Codemod (die zwei Regex-Behauptungen und die `PATCH-BLOECKE`-Links waren im ersten Lauf rot und sind oben als Korrekturen benannt).
  - Staging-Vergleich gegen den `main`-Stand (Baseline per `git worktree` auf `40323f86` neu erzeugt, weil `/tmp` der Vorsitzung nicht überlebt): **711 gestagte Dateien vorher und nachher**; 18 neue `i18n/`-Adressen, 18 alte Wurzel-Adressen weg, 14 Wörterbücher mit identischem SHA-256, dazu `language.mjs` als einzige Datei mit gleicher Adresse und neuem Inhalt.
  - Gesamtsuite im vollständigen Klon: erster Lauf **1.259/1.260** (der oben genannte `recruit-screen`-Scan), nach dem Fix `node --test IronPath/tests/*.test.mjs` = **1.260 Tests, 1.260 bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0**. `patch-check` vor dem Log-Eintrag: **0 Fehler**, Verträge 30/30.
  - **Korrektur nach dem ersten CI-Lauf von PR `#348`:** `interface-browser-smoke` wurde rot, weil der Test-Server in `IronPath/browser-tests/cache-wave.cjs` per Regex nur Wurzel-Module auslieferte und `i18n/…` mit 404 beantwortete — der dynamische Import von `language.mjs` scheiterte im Chromium-Lauf daran, dass seine Wörterbücher nicht kamen. Die Regex kennt jetzt dieselben sechs Fach-Ordner wie `GAME_MODULE_FOLDERS`; die übrigen Browser-Fahrten arbeiten mit Basisnamen und waren nicht betroffen. Der zweite CI-Lauf fand danach die zweite Hälfte desselben Funds: Die Erwartungsliste derselben Fahrt prüfte die Wörterbücher noch unter ihren alten Wurzel-Adressen (`requests.includes('localization-…?v=…')`) und bekam jetzt `i18n/localization-…` — die drei Einträge zeigen auf die neuen Pfade. Beide Fixes sind Teil dieses PR; die lokale Node-Suite konnte sie nicht finden, weil sie keinen Browser startet.
  - Cache-Welle als zweiter Commit desselben PR: Feldnotizen-Eintrag `i18n1` (DE+EN, `pr: 348`) an `RELEASED_PATCHES[0]` in `patch-notes.mjs` angelegt, danach `node IronPath/scripts/patch-bump.mjs 20261122-i18n1 --apply` — Trockenlauf nannte vorab exakt **79 Dateien, 276 Token-Vorkommen, die 7 bekannten Anker-Zeilen und 3 geschützte Historien-Zeilen** in `patch-notes.mjs`; `--apply` schrieb 79 Dateien, und die Anker-Prüfung meldete danach alle 7 Anker auf `20261122-i18n1`. `patch-check` auf der neuen Welle: **0 Fehler**, Verträge 30/30, `IPL-0095` nennt die aktuelle Welle.
- **Git / PR / Release:** Erster Commit `bb20f8d1` auf `arena/a72010f0-0815games-github-io`, Pull-Request `#348` („Phase 2 (i18n): Deutsche Wörterbücher ziehen nach IronPath/i18n“) damit eröffnet. Der Wellen-Commit folgt in demselben PR; CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen. Keine Geräteabnahme bisher; die Sichtprüfung lautet nach der Veröffentlichung auf `BUILD 20261122-i18n1`.
- **Offen / nächster Schritt:** PR öffnen, Wellen-Commit mit der PR-Nummer nachschieben, CI abwarten, erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Danach die nächsten Scheiben je eigenem PR: `workshop/`, `net/`, `battle/`, `ui/`, `core/`. Der Bauplatz-Auswahlring aus PR `#336` (ohne Hover-Vorschau) bleibt geparkt, bis die Struktur steht.
