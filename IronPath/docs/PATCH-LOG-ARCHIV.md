# Iron Path – Patch-Log: Archiv

Ältere Einträge IPL-0001 bis IPL-0092. Die neuesten 20 stehen in
[PATCH-LOG.md](PATCH-LOG.md); die Regeln für beide Dateien dort und in
[`../../AGENTS.md`](../../AGENTS.md). Beim Verschieben wandert ein Eintrag immer
vollständig einschließlich seiner Ereignis-Nachträge.

## IPL-0001 – Übernommener Ausgangsstand vor Einführung des Logs

- **Quelle:** Frühere PR-Beschreibungen, Commit-Abstammung und die vorhandenen
  Arbeitsblätter. Dies ist eine Auswahl der für die sechs Blöcke relevanten
  Meilensteine, keine vollständige rückwirkende Liste sämtlicher älterer PRs.
- **Veröffentlichter Ausgangspunkt:** [PR #286](https://github.com/0815games/0815games.github.io/pull/286)
  lieferte große Mehrspielerfelder, Kamera und einen Turmmenü-Pointerfix;
  [#287](https://github.com/0815games/0815games.github.io/pull/287) brachte
  Wartungs-/Versionsschutz und Social-Bereinigung;
  [#288](https://github.com/0815games/0815games.github.io/pull/288) brachte
  die mobile Wartungs-/Admin-Gestaltung. Der veröffentlichte Merge ist
  `05542181c2c3df13cacc52010b7f190cc0ac1880`, gemeldeter Build
  `20261031-update3`. Der Betreiber bestätigte sein iPhone-Layout und die
  Versionsfelder. Der zuletzt abgefragte Wartungsstatus war `maintenance`.
- **Frühere Bausteine:** 2×-Abstimmung [#136](https://github.com/0815games/0815games.github.io/pull/136),
  Rückzugs-/Tutorial-Fixes [#196](https://github.com/0815games/0815games.github.io/pull/196)
  und [#249](https://github.com/0815games/0815games.github.io/pull/249),
  Turm-Kits [#265](https://github.com/0815games/0815games.github.io/pull/265),
  freigegebene Avatar-Erstellung [#277](https://github.com/0815games/0815games.github.io/pull/277),
  Tutorial-Fixes [#278](https://github.com/0815games/0815games.github.io/pull/278)
  und [#279](https://github.com/0815games/0815games.github.io/pull/279)
  mit der in [#280](https://github.com/0815games/0815games.github.io/pull/280)
  dokumentierten Nutzerbestätigung, Rangabzeichen
  [#284](https://github.com/0815games/0815games.github.io/pull/284).
- **Lokaler Stand vor dieser Sitzung:** `DATENBLATT.md` und
  `release-tools/FIREBASE-PAGES-ROLLOUT.md` geändert, `PATCH-BLOECKE.md` neu;
  diese Dokumentationsänderungen sind noch **nicht committet oder veröffentlicht**.
  Die Bestandsaufnahme unterscheidet historische Freigaben von neuen Wünschen.
- **Frühere Tests:** vollständiger Node-Lauf 804/804; weitere Details und
  Einschränkungen im Patchplan. Trotzdem wurden drei echte Probleme gefunden:
  Veteranenpreis in der UI, Bossjäger-III-Bonus und Doppel-MG-III-Flugschaden;
  der alte Bossjäger-Test war unzureichend. Eine echte Mehrgeräte-Abnahme des
  aktuellen Spielstands ist nicht nachgewiesen.
- **Sicherheit:** Der Betreiber meldete die Rules-Veröffentlichung und einen
  passenden Hash aus einem authentifizierten Abruf. Dieser Abruf wurde nicht
  unabhängig aus der Arbeitsumgebung ausgeführt. Wartung, produktive Rules und
  Daten nicht ohne gesonderte Freigabe ändern.

## IPL-0002 – Patch-Log und dauerhafte Arbeitsanweisung

- **Zeit / Quelle:** Aktuelle Sitzung; wegen abweichender gespeicherter GitHub-
  Zeitstempel keine unbestätigte Uhrzeit als Releasetag behauptet.
- **Block / Ziel:** Künftige Änderungen und tatsächliche Git-/PR-/Release-
  Ereignisse nachvollziehbar festhalten; Block 1 bleibt als Nächstes prioritär.
- **Branch / Basis:** `arena/63527f0d-0815games-github-io`, Ausgangs-HEAD
  `05542181c2c3df13cacc52010b7f190cc0ac1880`.
- **Änderungen / Dateien:** Dieses Log und `AGENTS.md` angelegt. Bestehende
  lokale Dokumentationsänderungen bleiben erhalten.
- **Prüfungen:** 11 lokale Markdown-Links und -Anker in Arbeitsanweisung, Log
  und Patchplan auf vorhandene Ziele geprüft; alle vorhanden. Dies ist keine
  Prüfung externer URLs.
- **Git / PR / Release:** Lokal und uncommittet; kein neuer Commit, Push, PR,
  Merge, Deployment, produktive Rules-/Datenänderung oder Wiederöffnung.
- **Offen / nächster Schritt:** Block 1 einzeln regressionsprüfen und belegte
  Fehler in kleinen Schritten mit Tests korrigieren. Die sechs Blöcke und ihre
  weiteren Anforderungen stehen im Patchplan; nicht als fertig markieren,
  solange ihre jeweiligen Kriterien und angemessenen Nachweise fehlen.

## IPL-0003 – Block 1: Veteranenpreis, Anleitung und Multiplayer-Regressionsfälle

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-15 UTC; GitHub-
  Zeitstempel werden getrennt als Metadaten geführt.
- **Block / Ziel:** Turm-Upgrade tatsächlich bedienbar machen, alte Feld-Coach-
  Zustände beim Übergang beenden und bestehende Mehrspielerpfade genauer prüfen.
- **Branch / Basis:** `arena/63527f0d-0815games-github-io`,
  `05542181c2c3df13cacc52010b7f190cc0ac1880`.
- **Änderungen:** `game.js` verwendet für Upgrade-Anzeige und Kauf dieselbe
  Veteranen-Rabattfunktion wie die Simulation. Bei Sitzungswechsel und nach
  erfolgreichem Multiplayer-Beitritt werden Tutorial/Coach samt Recall-Zustand
  gestoppt, ohne sie als abgeschlossen zu markieren; ein verzögert geplanter
  Coachstart prüft Einsatz und Sitzung erneut. `index.html`,
  `localization-more-static-de.mjs` und Simulationskommentare erklären den
  bestehenden 70-%-Zweier-Versorgungsanteil korrekt; die Balance selbst wurde
  nicht geändert.
- **Prüfungen:** `node --test IronPath/tests/coop-ui.test.mjs` 1/1: vor dem
  Fix reproduzierter Preis 360 statt 306, danach UI-Preis, Live-Kontostand,
  Kauf bei 306, Prestige-Rundung, fremder Turm und Coach-Handoff grün (DOM- und
  Transport-Doubles). `node --test IronPath/tests/four-firebase-game.test.mjs`
  1/1: bei drei und vier Spielern eigene und fremde Turm-Upgrades samt
  Kontoständen auf allen Ansichten sowie vorhandene 2×-Abstimmung über den
  echten Adapter mit In-Memory-Firebase-Double. `node --test
  IronPath/tests/coop-balance-copy.test.mjs IronPath/tests/coop-balance.test.mjs
  IronPath/tests/coop-supplies.test.mjs` 3/3. Keine echten Geräte/Live-Partie.
- **Offen:** Absichtliches Host-Ende schließt noch nicht automatisch: Die lokale
  Host-Quittung garantiert nicht, dass alle Gäste Endstand und Belohnungsmaske
  erhalten haben. Sofortiges Löschen der Party könnte beides verlieren; ein
  bestätigter Abschluss-/Retry-Mechanismus und Tests einschließlich Offline-
  Gästen sind erforderlich. Zum Zeitpunkt dieses Eintrags waren Gast-Wellen-
  anfrage und Cache-Verkettung noch offen; die spätere lokale Umsetzung steht
  in IPL-0006/0007. Mittige Popups, Geräteabnahme und weitergehende
  Erstspieler-Balance bleiben offen.
- **Git / PR / Release:** Nur lokal, uncommittet; kein neuer Commit, Push, PR,
  Merge, Deployment oder produktiver Eingriff.

## IPL-0004 – Block 1: verzögerter Coachstart und Browserregression

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-15 UTC; GitHub-
  Zeitstempel werden getrennt als Metadaten geführt.
- **Block / Ziel:** Verhindern, dass ein altes Tutorial in eine andere Sitzung,
  ein bereits beendetes Training oder eine Multiplayer-Party hinein startet.
- **Änderungen / Dateien:** `game.js` setzt den Trainingszustand bei
  Sitzungswechsel/Partybeitritt zurück und lässt einen ausstehenden
  Trainingsstart weder in einer offenen Lobby noch in einer Partie zu – auch im
  Guard ohne Versionsprüfung. `tests/coop-ui.test.mjs` hält die beiden geplanten
  Animationsframes an und prüft regulären Start, Abbruch, Sitzungswechsel,
  Partybeitritt und Lobby. Ein vorher reproduzierter übernommener Trainingszustand
  ist damit lokal korrigiert. `browser-tests/multiplayer-field.cjs` prüft jetzt
  darüber hinaus tatsächliche Maus-/Touch-Upgrades eigener und fremder Türme
  und die Zuordnung der Bezahlung.
- **Prüfungen:** `node --test IronPath/tests/coop-ui.test.mjs
  IronPath/tests/training-run.test.mjs IronPath/tests/tutorial.test.mjs
  IronPath/tests/first-run-replay.test.mjs
  IronPath/tests/release-game-teardown.test.mjs` 23/23. Chromium 141:
  `multiplayer-field.cjs` und `retreat-viewport.cjs` bestanden; zusätzlich
  `multiplayer-account-handoff.cjs` für Koop und Versus bestanden. Die Tests
  verwenden synthetische Konten und Transport-Doubles. Der Browser und seine
  Bibliotheken wurden temporär außerhalb des Repositories eingerichtet.
- **Git / PR / Release:** Lokal/uncommittet auf
  `arena/63527f0d-0815games-github-io`, Basis `05542181c2`; kein neuer Commit,
  Push, PR oder Release.
- **Offen:** Kein Beweis für eine echte Drei-Geräte-Partie oder zehn tatsächlich
  gespielte Wellen. Host-Abschluss mit sicherer Zustellung/Belohnungsbestätigung
  und echte Geräteabnahme bleiben offen. Die damals noch offene Gast-Wellen-
  anfrage wurde später lokal umgesetzt (IPL-0006).

## IPL-0005 – Block 2: leere Social-Bereiche und Entlassung

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-15 UTC.
- **Block / Ziel:** Leere Anfragen/Einladungen ausblenden und nach bestätigter
  Charakterlöschung sauber abmelden, ohne den Account zu löschen.
- **Änderungen / Dateien:** `friends-ui.mjs` und `index.html` blenden leere
  Einladungs-/Eingangs-/Ausgangsbereiche aus und zeigen Ladefehler getrennt.
  `account.js` und das neue `discharge-notice.mjs` trennen bestätigte Löschung
  und Abmeldung; bei Abmeldefehler gibt es einen Retry. Eine generische,
  nicht identifizierende Einmalmarkierung in `sessionStorage` trägt den Hinweis
  über den Guard-Dokumentwechsel. Die deutsche Meldung lautet: „Dein Charakter
  wurde aus dem Dienst entlassen. Bitte melde dich erneut an.“ Übersetzungen,
  Unit- und Browserfälle ergänzt. `social-cleanup-browser.cjs` an die neue
  Abmeldung angepasst; die CI-Konfiguration führt die zwei neuen Chromium-
  Doubletests bei zukünftigen Läufen aus.
- **Prüfungen:** `node --test IronPath/tests/social-notifications.test.mjs
  IronPath/tests/friends-index-notice.test.mjs` 6/6; `node --test
  IronPath/tests/discharge-notice.test.mjs
  IronPath/tests/character-deletion.test.mjs
  IronPath/tests/account-services.test.mjs` 16/16. Chromium 141:
  `friends-sections.cjs` in Hoch-/Querformat grün;
  `character-discharge.cjs` in fünf Szenarien grün (Erfolg, Abmeldefehler und
  Retry, Löschfehler, Sitzungswechsel, synthetischer Guard-Dokumentwechsel).
  Auth, Datenbank und Guard-Sitzung sind Doubles, keine produktiven Dienste.
- **Git / PR / Release:** Nur lokal/uncommittet; keine produktive Rules- oder
  Datenänderung, kein Commit, Push, PR, Merge, Deployment oder Wiederöffnung.
- **Zum damaligen Stand offen:** Der geänderte Test mit echten Firebase-SDKs
  und lokalen Emulatoren war noch nicht gelaufen. Der spätere Emulator- und
  Zwei-Browser-Lauf steht in IPL-0009. Reale Geräte, Altbestände und parallele
  Geräte sind damit weiterhin nicht abgenommen. Globale Namenseindeutigkeit und
  Freundesporträts bleiben offen. Die Cache-Kette steht in IPL-0007.

## IPL-0006 – Block 1: Wellenfreigabe durch alle Teilnehmer

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-15 UTC.
- **Block / Ziel:** B1: Jeder Spieler kann die nächste Welle anfragen; die
  anderen müssen derselben Anfrage ausdrücklich zustimmen.
- **Änderungen / Dateien:** `wave-consensus.mjs`, `match.mjs`, `four-modes.mjs`,
  `versus.mjs`, `protocol.mjs`, `party-host.mjs`, `four-game-view.mjs`,
  `game.js` und deutsche Texte vereinheitlichen Anfrage, Anzeige, Zustimmung,
  Ablehnung und Rücknahme. Zwei- bis Vierer-Koop, 1v1 und 2v2 besitzen
  monotone Anfrage-IDs; Solo startet weiterhin unmittelbar. Vor einem Start
  werden Teilnehmer und alle betroffenen Felder erneut geprüft. Recovery
  übernimmt keinen offenen Konsens, behält aber den ID-Zähler.
- **Ausfall und Reihenfolge:** `firebase-party-session.mjs` und der Durable-
  Client senden eine Roster-Generation. Verbindungsverlust verwirft sowohl
  offene Abstimmungen als auch eingereihte und verspätete Wellenbefehle; eine
  Abbruchquittung hält die nächste Sequenz nutzbar. Eine verzögerte komplette
  Ansicht wird erst beim Veröffentlichen erfasst und überschreibt daher keine
  neuere Senderquittung mit einem älteren `nextSeq`.
- **Prüfungen:** Vor der Korrektur reproduzierte Ausfall- und Snapshot-Rennen
  sind durch `tests/wave-consensus.test.mjs` und
  `tests/firebase-party-session.test.mjs` abgedeckt. Fokussierte Läufe nach den
  Änderungen: 51/51, 61/61 sowie 8/8 bestanden. Browser- und weitere aktuelle
  Gesamtergebnisse stehen unten; Firebase-Transport war dabei ein Double.
- **Git / PR / Release:** Branch `arena/63527f0d-0815games-github-io`, Basis
  `05542181c2c3df13cacc52010b7f190cc0ac1880`; lokal und uncommittet. Kein
  neuer Commit, Push, PR, Merge, Deployment oder produktiver Eingriff.
- **Offen:** Der ursprüngliche Hostabschluss darf nicht nach einer lokalen
  Receipt automatisch löschen: Weder Empfang des Endstands durch offline Gäste
  noch Abschluss ihrer asynchronen Reward-Transaktionen ist damit bestätigt.
  Popup-Neugestaltung und Mehrgeräteabnahme sowie Einsteigerbalance bleiben
  offen. Die spätere lokale Firebase-SDK-/Rules-Emulatorprüfung mit ihren
  Grenzen ist in IPL-0009 nachgetragen.

## IPL-0007 – Lokale Cache-Kette und Testvorbereitung

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-15 UTC.
- **Block / Ziel:** Geänderten Browsercode mitsamt seinen transitiven Importern
  konsistent laden, ohne gemeinsame Modul-Singletons durch verschiedene URLs
  zu duplizieren; die laufende Veröffentlichung nicht verändern.
- **Änderungen / Dateien:** `release-version.json`, sichtbarer Build und die
  transitiv betroffene Importkette nutzen lokal `20261031-patch1`.
  Unveränderte Kamera/CSS behalten ihre eigene Revision. Der Guard-Bootstrap
  im Chromium-Doubletest `character-discharge.cjs` liest den aktuellen Build;
  `social-cleanup-browser.cjs` bedient sein lokales `/test-landing` nach dem
  Guard-Dokumentwechsel. Der Emulator-Browserfall war zu diesem Zeitpunkt noch
  nicht gelaufen; das spätere Ergebnis steht in IPL-0009.
  `.github/workflows/ironpath-firebase-rules.yml` ergänzt zukünftige lokale
  Browser-Smokes; die geänderte CI wurde noch nicht ausgeführt.
- **Prüfungen:** Versions-/Cachekettentests 11/11; der Chromium-Test
  `browser-tests/cache-wave.cjs` füllt einen echten Browser-HTTP-Cache mit
  synthetischen alten Modulantworten und lädt anschließend Spiel, Sprache,
  Host und Online-/Recovery-Module unter dem neuen Token. Keine externe
  Verbindung, kein Service-Worker- oder Produktions-CDN-Test. Die vollständig
  nachgeladene lokale Git-Historie enthält in den erreichbaren Refs keinen
  Treffer für den neuen Token (`git log --all -S`); das ist keine Aussage über
  unbekannte externe Deployments. Die beiden gepinnten Pages-Artefakte wurden
  offline gebaut und geprüft: `release-pages-site.test.mjs` 6/6, kein Skip.
- **Git / PR / Release:** Nur lokal; mit Commit „Block 2: eindeutige Soldatennamen fuer neue Charaktere (A1)“ eingestellt und als PR #293 zur Abnahme vorgelegt. Kein neuer Commit, Push, PR,
  Merge, Deployment, produktive Rules-/Datenänderung oder Wiederöffnung; der
  zuletzt belegte öffentliche Build bleibt `20261031-update3`.
- **Offen:** Cache-, Mischversions- und Guard-Verhalten zusätzlich im echten
  Firebase-Emulator und auf Geräten prüfen; vor einer freigegebenen
  Veröffentlichung Build-ID und Release-Pins erneut gegen den dann aktuellen
  Stand kontrollieren.

## IPL-0008 – Block 1: 2×-Anfrage, Rosterwechsel und aktueller Teststand

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-15 UTC.
- **Block / Ziel:** Den gemeldeten Gast-2×-Pfad in einer aktiven zweiten Welle
  prüfen und reproduzierte Probleme beheben, ohne bestehende Einwilligungen
  auf neue Verbindungen zu übertragen.
- **Änderungen / Dateien:** `four-game-view.mjs` überträgt den öffentlichen
  Namen des 2v2-Anfragenden auch auf die gegnerische Feldansicht; `game.js`
  zeigt ihn statt des allgemeinen Platzhalters. `party-host.mjs` und
  `protocol.mjs` wenden die Roster-Generation nun auch auf sämtliche Tempo-
  Befehle an. Alte eingereihte und verspätete Anfragen, Antworten oder
  `slowSpeed` erhalten eine Abbruchquittung statt nach Reconnect einen neuen
  Vote zu erzeugen oder zu löschen. Tests in
  `tests/multiplayer-speed-disconnect.test.mjs`,
  `tests/firebase-party-session.test.mjs` und `four-game-view.test.mjs`.
  `firebase/rules-test/large-multiplayer-rules.test.mjs` wurde um Gast-Wellen-/
  Tempoanfrage und Ablehnung erweitert und war zu diesem Zeitpunkt noch nicht
  im Emulator ausgeführt; der spätere Lauf steht in IPL-0009.
- **Prüfungen:** Die neuen Regressionen zeigten vor dem Fix 19 Fehler in
  23 Tests; nach dem Fix bestanden gezielte Host-/Protokoll-/UI-Läufe 77/77
  und weitere Speed-/Adapter-/Recovery-Läufe 66/66. Vollständiger aktueller
  Lauf `node --test IronPath/tests/*.test.mjs`: **885 bestanden, 0 Fehler,
  0 Skips**. Chromium 141: `wave-consensus.cjs` bestand alle fünf
  Modus-/Spielerzahl-Kombinationen mit Gastanfrage, Ablehnung, Rücknahme,
  Wiederverbindung, Einstimmigkeit, Touch/Tastatur und Viewport-Geometrie;
  Welle 1 wird im Hostkern vorgespult, 2× in Welle 2 ausgelöst. Der Hostkern
  ist echt, Transport und Konten sind Doubles. Um die Eingabe bei mehreren
  Canvas-Fenstern auf zwei CPU-Kernen nicht auszuhungern, drosselt der letzte
  Browserlauf die Zeichenframes; er ist kein FPS-/Spielgefühltest. Eine ältere
  vollständige Browserrunde ohne Drosselung bestand ebenfalls; ein weiterer
  parallel zum Gesamtlauf gestarteter Durchgang lief nach vier Fällen ins
  Zeitlimit. Der gezielte Fall und der optimierte Gesamtlauf bestanden danach.
  `cache-wave.cjs`, `multiplayer-account-handoff.cjs` (Koop/Versus) und alle
  fünf `character-discharge.cjs`-Doubleszenarien bestanden erneut. Syntax,
  `git diff --check` sowie 11 lokale Markdown-Links/Anker sind geprüft.
- **Git / PR / Release:** Nur lokal/uncommittet; kein Commit, Push, PR, Merge,
  Deployment, produktive Rules-/Datenänderung oder Wiederöffnung. Wartung
  bleibt aktiv.
- **Offen:** Die jüngsten Emulator-SDK- und Browserfälle standen bei diesem
  Eintrag noch aus und wurden später in IPL-0009 nachgetragen; echte Geräte
  bleiben offen. Das einheitliche mittige Popup, sicherer automatischer
  Hostabschluss und die weiteren Blöcke bleiben eigenständige offene Aufgaben.

## IPL-0009 – Blöcke 1/2: lokale Firebase- und Browser-Emulatorprüfungen

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-15 UTC. Die Ergebnisse
  sind lokale Prüfergebnisse, keine Behauptung über den Veröffentlichungstag
  oder produktive Dienste.
- **Block / Ziel:** Gastanfragen im echten Firebase-SDK auf synthetischen
  Emulator-Daten prüfen und den geänderten Abmelde-/Socialpfad mit Auth- und
  Datenbank-Emulator sowie Browsern erneut durchlaufen.
- **Änderungen / Dateien:** `firebase/rules-test/unified-lobby.test.mjs` prüft
  jetzt für 2er-/3er-/4er-Koop, 1v1 und 2v2 eine Gast-Wellenanfrage,
  Ablehnung, Rücknahme, Disconnect, erneuten Beitritt ohne alte Zustimmung,
  einstimmigen Start und Gast-2× während Welle 1. In 3er-/4er-Koop prüfen die
  SDK-Fälle zusätzlich eigene und fremde Turm-Upgrades, alle Empfängeransichten
  und die getrennten Kontostände. Alle SDK-Sitzungen verwenden synthetische
  authentifizierte Testkontexte; sie starten nicht die Browseroberfläche.
  `large-multiplayer-rules.test.mjs` prüft Zweier-Gastpfade zusätzlich gegen
  verschiedene lokale Rules-Kandidaten.
- **Prüfungen:** Firebase CLI 13.35.1, Java 21 und RTDB-Emulator 4.11.2;
  Größe und MD5 des Emulator-JAR stimmen mit der angepinnten CLI überein, der
  SHA-256 mit offiziellen Firebase-Tools-Metadaten. `npm run test:unified`:
  7/7 und 2/2; `test:four`: 13/13, 3/3, 17/17; `test:recovery`: 21/21;
  `test:campaign`: 3/3, 7/7; `test:online`: 3/3, 7/7, 21/21;
  `test:story`: 2/2, 3/3, 7/7, 21/21. `test:publish`: 9/9, 2/2;
  `test:release-guard`: 7/7, 4/4, 3/3, 4/4; `test:maintenance`:
  7/7, 4/4, 14/14, 2/2, 4/6 (2 absichtlich modusbedingt übersprungen).
  `test:social-cleanup`: Referenz 2/5, Kandidat 3/5 und Guard 3/5, die jeweils
  übrigen Fälle sind für den betreffenden Rules-Modus gezielt übersprungen;
  insgesamt keine Fehler. `test:social-browser`: Zwei isolierte Chromium-
  Sitzungen mit echten Firebase-SDKs und lokalem Auth-/RTDB-Emulator bestanden
  die serverbestätigte Löschung mit Offline-Warten, Guard-Abmeldung, erneuter
  Anmeldung/Charaktererstellung sowie Freundschaft, Einladung, Beitritt,
  Verlassen und gegenseitig sichtbare Bereinigung. Die beiden Browser spielen
  Welle 1 durch; beide Serverprofile erhalten EP. Der Gast fragt Welle 2 und
  2× an, der Host stimmt zu und setzt auf 1× zurück. Rules sind lokale
  Referenz-/erzeugte Kandidaten, keine unabhängig geprüften Live-Rules.
- **Git / PR / Release:** Nur lokal/uncommittet auf dem aktuellen Branch; kein
  neuer Commit, Push, PR, Merge, Deployment, produktive Rules-/Datenänderung
  oder Wiederöffnung. Die Wartung bleibt aktiv.
- **Offen:** Zum Zeitpunkt dieses Eintrags war die kombinierte Drei-/Vierer-
  Browserprüfung noch unvollständig; die anschließenden Ergebnisse stehen in
  IPL-0010/0011. Tatsächliche Geräte, echte Netzwechsel und produktive Rules
  sind nicht damit nachgewiesen. Mittiges Popup und sicherer automatischer
  Hostabschluss bleiben offen.

## IPL-0010 – Block 1: Reconnect und wartende Abstimmungsbefehle

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-15 UTC; die folgenden
  Endprüfungen liefen teilweise nach Mitternacht der Umgebungsuhr.
- **Befund:** Im ersten Drei-Browser-/Firebase-Lauf wurde eine Gastanfrage
  beim Offlinegehen sichtbar verworfen. Direkt nach Reconnect war der Startknopf
  wieder aktiv, aber der erneute Klick meldete „Wait for the previous action.“;
  der Gesamtlauf scheiterte anschließend beim Warten auf das Host-Popup. Das
  allein beweist nicht, dass der Transport dauerhaft blockiert war oder dass
  dieser Ablauf jede gemeldete 2×-Störung erklärt.
- **Änderungen / Dateien:** `coop-input.mjs` hält höchstens eine ausdrücklich
  bewachte Wellen-/Tempoaktion kurz hinter einem laufenden Richtungsbefehl.
  Ein ausstehender Richtungswechsel, insbesondere das Stoppen, wird zuerst
  gesendet. Es gibt Rückmeldung und ein begrenztes Wartefenster; andere
  Einzelaktionen werden nicht automatisch wiederholt. `game.js` verwirft die
  wartende Aktion bei lokalem Disconnect, veränderter Roster-/Fokusgeneration,
  Welle oder beantworteter Anfrage. Die eigentliche Transportsequenz und ihre
  Receipt/Reconciliation werden nicht zurückgesetzt. Neue Texte und der Import
  von `coop-input.mjs` sind Teil der lokalen Cachewelle `20261031-patch1`.
- **Prüfungen:** `tests/coop-input-votes.test.mjs` hält den Bewegungs-Receipt
  deterministisch zurück und prüft Stop-Priorität, Doppeltipp, Disconnect,
  veränderte Anfrage, Timeout und Ausschluss anderer Aktionen.
  `tests/coop-ui.test.mjs` prüft den UI-Klick während des neutralen Reconnect-
  Befehls sowie Roster- und Anfragewechsel. Der nachfolgende Drei-Browserlauf
  bestand denselben Offline-/Reconnect-Pfad; Drei- und Vierer-Gesamtläufe sowie
  der erneute Cachetest stehen in IPL-0011.
- **Git / PR / Release:** Lokal und uncommittet; kein neuer Commit, Push, PR,
  Merge, Deployment oder produktiver Eingriff. Wartung bleibt aktiv.
- **Offen:** Kein Beweis für reale Geräte, alle Netzwechsel oder jede Ursache
  der ursprünglichen Meldung. Ein stiller Zustimmungserfolg oder das blinde
  Freigeben eines unquittierten Transportbefehls wurde nicht eingeführt.

## IPL-0011 – Block 1: unterschiedliche Gegnerwege und echte Emulator-Browser

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-16 UTC. Dies ist eine
  lokale Messung, kein GitHub-Zeitstempel oder Veröffentlichungstag.
- **Befund / Änderung:** Auf generierten Mehrspielerkarten besitzen die beiden
  Wege unterschiedlich viele Wegpunkte. `simulation.mjs` prüfte Bewegung
  bereits gegen den eigenen Weg, Zielerfassung und Bunkertreffer aber gegen
  die Länge des ersten Wegs: Gegner konnten am kürzeren zweiten Weg stehen
  bleiben oder auf dem längeren vorzeitig den Bunker treffen. Die lokalen
  Ziel- und Endpunktprüfungen verwenden nun den jeweiligen Gegnerweg. Zwei
  gezielte Regressionen waren vor dem Fix rot; zusätzlich prüfen
  `tests/squad-road-completion.test.mjs` Bunkergeschütz, Turm/Kettentreffer und
  das tatsächliche Ende von Welle 1 auf allen vier Squad-Karten mit drei und
  vier Teilnehmern. Dies ist ein eigenständiger Fund, keine nachgewiesene
  Ursache des gemeldeten Turmmenü- oder 2×-Fehlers.
- **Browser / Firebase:** `firebase/rules-test/multiplayer-browser.cjs` startet
  drei beziehungsweise vier isolierte Chromium-Kontexte mit echten Firebase-
  SDKs sowie lokalem Auth-/RTDB-Emulator und synthetischen Konten. Maus-/Touch-
  Bedienung baut und verbessert eigene und fremde Türme; die Ansichten und
  getrennten Kontostände werden geprüft. Eine Gastanfrage wird bei Offlinegehen
  verworfen, nach Reconnect neu gestellt und einstimmig bestätigt. Wellen 1 und
  2 laufen tatsächlich durch; für jeden Teilnehmer steigt die serverseitig
  gelesene EP nach jeder Welle. In Welle 3 beantragt der Gast 2×, alle übrigen
  stimmen zu, danach wird wieder 1× gesetzt. Die längeren Fälle wählen per
  regulärer Party-Neuanlage reproduzierbar `four-front`, manipulieren weder
  Spielzustand noch Zeit und drosseln nur die Zeichenframes. Welle 3 selbst
  wurde nicht bis zum Ende gespielt. Kein Leistungs-, Geräte- oder Live-Test.
- **Prüfungen:** `npm run test:multiplayer-browser` bestand für drei und vier
  Browser bis zur 2×-Freigabe in Welle 3; der kürzere Dreierfall auf zufälliger
  Squad-Karte bestand ebenfalls. `npm run test:social-browser` bestand erneut
  einschließlich Zweier-Welle 1, beider Server-EP und Gast-2× in Welle 2.
  `node --test IronPath/tests/*.test.mjs`: **902 bestanden, 0 Fehler, 0 Skips**.
  Der lokale Stresslauf prüfte 500 Karten, 18 kurze und sechs längere
  Spielabläufe sowie synthetische Dichte-/Reconnect-/Protokollfälle.
  Chromium-Smokes `wave-consensus.cjs` (alle fünf Modus-/Größenfälle mit
  Transport-Double), `multiplayer-field.cjs` und `cache-wave.cjs` bestanden;
  der Cachefall nutzt synthetische Altantworten. Die angepasste GitHub-CI und
  ihr längeres Browser-Zeitlimit wurden noch nicht auf GitHub ausgeführt.
- **Git / PR / Release:** Nur lokal/uncommittet auf
  `arena/63527f0d-0815games-github-io`, Basis `05542181c2`; kein neuer Commit,
  Push, PR, Merge, Deployment, produktive Rules-/Datenänderung oder Wiederöffnung.
- **Offen:** Echtes Netz und 2–4 Geräte einschließlich Firefox, produktive Rules,
  vollständige Welle 3 und die weiteren Modi über den vollständigen Firebase-
  Browserpfad sind nicht abgenommen. Sicheres automatisches Hostende, mittige
  Popups, Balance sowie die weiteren Patchblöcke bleiben offen.

## IPL-0012 – Block 1: verzögerte Neuanfragen gegen neuere Abstimmungen absichern

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; die abgefragte
  Umgebungsuhr zeigte 2026-11-16 UTC. Keine Aussage zum Veröffentlichungstag.
- **Befund:** Die bisherigen Anfrage-IDs schützen die Antworten; ein später
  eintreffendes `startWave` oder `requestSpeed` ohne ID konnte aber nach einer
  zwischenzeitlich gestellten und zurückgezogenen Anfrage eine neue Abstimmung
  erzeugen. Ein altes `slowSpeed` konnte eine neuere Tempoabstimmung beenden.
  Das sind gezielt konstruierte Verzögerungsfälle, keine nachgewiesene Ursache
  eines konkreten produktiven Fehlers.
- **Änderungen / Dateien:** `game.js` versieht neue Wellen-/Tempoanfragen und
  1×-Befehle mit der zuletzt gesehenen Anfragekennung. `protocol.mjs`,
  `match.mjs`, `versus.mjs`, `four-modes.mjs` und `multiplayer-speed.mjs`
  prüfen sie beim Host; ein überholter Befehl erhält ein negatives Ergebnis mit
  normaler Receipt-Sequenz. Die Viererprojektion behält die letzte Wellen-ID
  auch ohne offene Anfrage; die Tempoansicht veröffentlicht die letzte ID und
  bewahrt den Zähler bei Recovery. Auch die lokal wartende Eingabe verwirft
  einen Tap, wenn zwischenzeitlich eine Anfrage kam und wieder verschwand.
  `multiplayer-speed.mjs` gehört jetzt zur lokalen Cachewelle
  `20261031-patch1`.
- **Prüfungen:** `tests/vote-generation.test.mjs` prüft verspätete Neuanfragen
  und 1×-Befehle einschließlich idempotenter Receipt in allen fünf Modus- und
  Gruppenkonstellationen; zusätzliche UI-/Projektions- und Recoveryfälle prüfen
  die übernommenen Kennungen. Vor der Implementierung schlugen die neuen
  Hostfälle fehl; danach bestanden sie. Browser-/Firebase-Wiederholung und der
  vollständige Node-Lauf nach dem nächsten Schritt stehen in IPL-0013.
- **Grenze:** Das neue Feld ist zur Kompatibilität optional. Aktuelle lokale
  Browser senden es; ältere oder abweichende Clients ohne dieses Feld erhalten
  diesen zusätzlichen Schutz nicht. Die Versionsanzeige ist keine Sicherheits-
  oder vollständige Mischversionsgarantie.
- **Git / PR / Release:** Lokal/uncommittet, keine Veröffentlichung oder
  produktive Änderung. Mittige Popups und sichere automatische Partybeendigung
  sind dadurch nicht umgesetzt.

## IPL-0013 – Block 1: schneller Turmausbau nach Bau oder Bewegung

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; die abgefragte
  Umgebungsuhr zeigte 2026-11-16 UTC. Branch/Basis unverändert wie in IPL-0011.
- **Befund:** Ein erneuter Drei-Browser-/Firebase-Lauf, parallel zu weiteren
  Chromium-Smokes gestartet, scheiterte beim schnellen Ausbau des gerade selbst
  gebauten Turms mit „Wait for the previous action.“; die anderen Ansichten
  hatten den Bau bereits empfangen. Die konkret blockierende Aktion wurde im
  Fehllauf nicht instrumentiert. Ein gezielter DOM-Test reproduzierte danach
  eine überflüssige `releaseBuild`-Nachricht nach erfolgreichem Bau: Die
  autoritative Bauoperation hatte diese Reservierung bereits aufgehoben.
- **Änderungen / Dateien:** `game.js` sendet nach bestätigtem Bau keine solche
  redundante Freigabe mehr; fehlgeschlagene und ungeklärte Vorgänge behalten
  ihre bestehende Bereinigung. `coop-input.mjs` kann genau einen ausdrücklich
  bewachten Upgrade-Klick bis zu zwei Sekunden hinter einer Bewegungsquittung
  oder Reservierungsfreigabe halten. Richtungsfreigaben gehen vor; weder Kauf
  noch Verkauf werden automatisch in diese Warteschlange gelegt. Menüwechsel,
  Schließen oder Zurück, anderer Turm/Level, Feld/Welle, Roster-/Fokuswechsel,
  Disconnect oder Timeout verhindern ein veraltetes Senden. Der Host prüft
  weiterhin Turmkennung, Level und verfügbare Vorräte. UI-Rückmeldung ist auch
  auf Deutsch ergänzt.
- **Prüfungen:** Die neuen Tests für die überflüssige Freigabe und das Warten
  schlugen vor den jeweiligen Änderungen fehl. Danach bestanden gezielte
  Input-/DOM-/Reservierungs- und Abstimmungsfälle; sie prüfen auch Doppel-Taps,
  abgebrochene Details, Turmersatz und Richtungsfreigabe. Anschließend bestand
  `node --test IronPath/tests/*.test.mjs` mit **917/917, 0 Skips**.
  `npm run test:multiplayer-browser` bestand erneut mit drei und vier echten
  Chromium-Oberflächen, synthetischen Konten und lokalem Auth-/RTDB-Emulator:
  Wellen 1 und 2 durchgespielt, EP aller Profile geprüft, Welle 3 und Gast-2×
  einstimmig gestartet; Welle 3 nicht abgeschlossen. Der anschließende
  Zweier-`test:social-browser` bestand einschließlich Welle 1, Server-EP und
  Gast-2× in Welle 2. `wave-consensus.cjs` mit Transport-Double in allen fünf
  Konstellationen, `multiplayer-field.cjs` und der synthetische Cachetest mit
  altem `multiplayer-speed.mjs`-Key bestanden erneut. Die separate lokale
  Server-Suite bestand **13/13, 0 Skips**, einschließlich WebSocket-Reconnect;
  sie ist nicht der produktive Firebase-Transport. 27 lokale Markdown-Links
  und -Anker sowie `git diff --check` bestanden.
- **CI:** Der neue Fehler-Annotationsteil wurde lokal mit Prozentzeichen und
  Zeilenumbrüchen synthetisch ausgeführt; Python normalisiert beim Textlesen
  CR zu LF. GitHub Actions selbst und die Laufzeitgrenze des echten Jobs wurden
  nicht ausgeführt.
- **Git / PR / Release:** Alle Änderungen lokal und uncommittet; kein neuer
  Commit, Push, PR, Merge, Deployment, produktiver Eingriff oder Wiederöffnung.
- **Offen:** Der grüne Wiederholungslauf beweist keine eindeutige Ursache des
  ersten Fehlschlags und keine Sicherheit für jedes Netzwerk. Echte Geräte,
  reale Verbindungswechsel, produktive Rules und vollständige Welle 3 fehlen;
  Popup, Hostabschluss und weitere Blöcke bleiben offen.

## IPL-0014 – B2: einheitliches Anfragezentrum und frische Einladungen

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; die abgefragte
  Umgebungsuhr zeigte 2026-11-16 UTC. Dies ist kein Veröffentlichungsdatum.
- **Block / Ziel:** Blöcke 1–3, insbesondere [B2](PATCH-BLOECKE.md#b2-anfragen-mittig-als-popup):
  Wellen-, Tempo-, Partybeitritts- und Einladungshinweise sichtbar und sicher
  bedienbar machen, ohne die laufende Online-Welle oder andere Dialoge zu
  unterbrechen. Freundschaftsanfragen behalten ihren vorhandenen Menühinweis.
- **Branch / Basis:** `arena/63527f0d-0815games-github-io`, HEAD
  `05542181c2c3df13cacc52010b7f190cc0ac1880`; die Änderung ist lokal.
- **Anfragezentrum:** `multiplayer-prompts.mjs`, `multiplayer-prompts.css` und
  `index.html` stellen eine mittige, nichtmodale FIFO-Karte ohne automatischen
  Fokuswechsel bereit. „Später“ und Escape beantworten nichts; abgelaufene,
  entfernte oder ungültige Anfragen verschwinden. Offene Dialoge, Texteingaben
  und sichtbare Feldentscheidungen gehen vor. Doppelklickschutz, Fokus-Rückgabe,
  synchrones Fokus-Reentry, Session-Reset, versteckte Arbeitsbereiche und die
  Aktualisierung des HUD-Fallbacks sind gesondert geprüft. Texte werden als
  Textknoten eingesetzt, nicht als HTML.
- **Abstimmungen:** `game.js` veröffentlicht nur für berechtigte, noch nicht
  zustimmende Spieler Antwortkarten; Anfrage-ID, Session, Roster, Fokus und
  Verbindung werden vor einer Aktion erneut geprüft. Die Anfragenden behalten
  ihren Wartestreifen und erhalten eine Status- oder Ergebnisrückmeldung.
  Späte Erfolg-Quittungen werden mit dem neueren Snapshot abgeglichen; trifft
  die Quittung zuerst ein, wartet die Meldung auf den passenden Zähler. Bei
  übersprungenen Generationen oder einer bereits zurückgesetzten Geschwindigkeit
  wird keine konkrete Ursache oder fremde Zustimmung erfunden.
- **Social und Party:** `friends-ui.mjs`, `social-notifications.mjs` und
  `firebase-four-panel.mjs` integrieren Einladungen und Beitrittsanfragen in
  dieselbe Queue; ihre Karten öffnen nur Posteingang bzw. Partyübersicht.
  Einladungsanzeigen verfallen nach 30 Minuten. Ein fehlgeschlagener Löschversuch
  und anschließender Start desselben Kontos behalten bereits gesehene Hinweise.
  `coop-invites.mjs` vergleicht Senderpfad, Party-ID, Code, Name und Zeitstempel
  bei jedem Firebase-Transaktionsversuch; ein verspätetes Ablehnen oder ein
  Join-Cleanup darf keine erkennbar überschriebene Einladung löschen. Die
  Hinweiskennung enthält dieselben beobachteten Felder. `account.js` liefert
  das echte `runTransaction`-SDK; Übersetzungen, Build-/Cache-Vertrag und
  `release-version.json` verwenden den lokalen Schlüssel `20261031-patch2`.
- **Tests – Node/Server:** `node --test --test-concurrency=1 IronPath/tests/*.test.mjs`
  bestand mit **932/932, 0 Skips**; einzelne TAP-Zähler umfassen ganze Dateien.
  `npm test` in `IronPath/server` bestand mit **13/13, 0 Skips**. Neue Tests für
  Quittungsreihenfolge und unterschiedliche Einladungsidentitäten waren vor den
  Korrekturen rot und danach grün. Ein vorzeitig gestarteter Gesamtlauf wurde
  wegen der zwischenzeitlich absichtlich roten Regression verworfen.
- **Tests – lokale Firebase-Emulatoren:** `test:coop-invites` bestand mit
  **5/5**, die zugehörigen Freundes-/Suchtests mit **3/3 und 2/2**; `test:unified`
  bestand mit **7/7 und 2/2**, jeweils ohne Skips. Negative Rules-Fälle erzeugen
  erwartete `permission_denied`-Meldungen. `test:social-browser` bestand mit
  zwei isolierten Chromium-Sitzungen und Auth-/RTDB-Emulator, einschließlich
  einer überschriebenen Einladung, verzögertem altem Ablehnen, passendem
  Join-Cleanup, Welle 1, bestätigten EP und Gast-2× in Welle 2.
  `test:multiplayer-browser` bestand für drei und vier Sitzungen: eigene und
  fremde Upgrades, getrennte Kontostände, Wellen 1/2, Offline/Reconnect sowie
  Gast-2× in Welle 3. Welle 3 wurde nicht zu Ende gespielt.
- **Tests – Chromium und CI-Vorbereitung:** `wave-consensus.cjs` bestand mit
  echtem Hostkern und simuliertem Transport in allen fünf Modus-/Größenfällen,
  auch bei einer nach der Ablehnung eintreffenden 2×-Quittung.
  `multiplayer-prompt-layout.cjs` bestand auf sechs emulierten Ansichtsgrößen
  von 320×240 bis 1280×800 einschließlich Fokus, Tastatur, DE/EN, Text statt
  HTML, 44-Pixel-Tasten und reduzierter Animation. Der Cache-Smoke nutzte
  ausdrücklich **synthetische** Altantworten. Feld-, Rückzug-, Account-Handoff-,
  Freunde- und Entlassungs-Smokes bestanden. Die lokale Workflow-YAML wurde
  geparst und der neue Layouttest in die vorgesehene Browser-Jobkette aufgenommen;
  GitHub Actions selbst wurde nicht ausgeführt.
- **Grenzen / offen:** Dieselben vier Einladungsfelder einschließlich desselben
  Millisekunden-Zeitstempels sind keine eindeutige Servergeneration. Bei
  Beitrittsanfragen erkennt ein lokaler Token nur beobachtete Rücknahmen oder
  Ersetzungen; deshalb bietet die Karte keine direkte Genehmigung an. Echte
  Geräte, Screenreader, Firefox/Safari, Mischversionen, produktive Rules und
  vollständige Firebase-Browser-Duelle sind nicht abgenommen. Automatisches
  Partyschließen beim Host-Ende bleibt offen, bis Zustellung von Endansichten
  und Bestätigung der Belohnungen für Gäste sicher geklärt sind.
- **Git / PR / Release:** Lokal/uncommittet; kein neuer Commit, Push, PR, Merge,
  Deployment, produktiver Eingriff oder Wiederöffnung. Die Wartung bleibt aktiv.

## IPL-0015 – Block 1: sicherer Hostabschluss und Abmeldung (lokaler Zwischenstand)

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; die abgefragte
  Umgebungsuhr zeigte 2026-11-16 UTC. Dies ist kein Veröffentlichungsdatum.
- **Branch / Basis:** `arena/63527f0d-0815games-github-io`, HEAD
  `05542181c2c3df13cacc52010b7f190cc0ac1880`; alles lokal und uncommittet.
- **Änderungen / Dateien:** Ein absichtliches Host-Ende trägt eine eindeutige
  Endgeneration mit rostergebundenen Quittungen durch Protokoll, Views und
  Recovery-Checkpoint. Der Koordinator verlangt den eigenen fertigen Bericht,
  serverbestätigte eigene Rewardmasken und die Quittungen aller Mitglieder,
  bevor der Host Party und Code atomar löscht. `game.js`, `account.js`,
  `party-end-coordinator.mjs`, `coop-rewards.mjs`, `firebase-four-panel.mjs`
  und Übersetzungen binden Bericht, Speicherung, Anzeige und Lifecycle an die
  richtige Sitzung. Ein offener Bericht bleibt bei bestätigtem Schließen
  erhalten. Ein Disconnect ist kein Endwunsch; Zeitablauf, Sendung oder ein
  lediglich lokaler Host-Snapshot sind kein Zustell- und Speichernachweis.
- **Abmeldung / Cleanup:** In einer gestarteten Hostgruppe kann der Nutzer nun
  ausdrücklich „Beenden und warten“ wählen: Die spätere Abmeldung ist an die
  ursprüngliche Sitzung und das bestätigte Schließen gebunden. Sie lässt sich
  abbrechen, ohne ein bereits angefordertes Ende rückgängig zu machen. „Jetzt
  abmelden“ bleibt nach Warnung möglich und hält die geschützte Abmeldung nicht
  durch Netzwerk-Timeouts fest; dabei kann eine unbestätigte Gruppe offen
  bleiben. `party-signout.mjs`, `confirmation.mjs` und das Panel bewachen
  verspätete Aktionen und Kontowechsel. Nach bestätigter Serverlöschung hält
  ein fehlgeschlagenes oder hängendes lokales Transport-Cleanup das Panel nicht
  mehr fälschlich offen; ein fehlgeschlagener Delete behält es dagegen.
- **Prüfungen:** Die gezielte Node-/DOM-/Cache-Suite bestand **49/49**; zuvor
  waren die zwei neuen Panel-Cleanup-Races und die neue dritte Dialogoption
  reproduzierbar rot. Der echte Vier-Chromium-/Firebase-Emulatorfall folgt der
  sichtbaren Navigation über Bericht, Kommandozentrale und Abmeldung: Bei
  offline Gast und zurückgehaltener echter SDK-Rewardtransaktion blieb die
  gewählte Abmeldung aus; erst nach Reconnect, serverbestätigter Speicherung,
  allen Quittungen und Party-/Codelöschung erfolgte sie automatisch. Drei- und
  Vier-Spieler-Koop bestanden außerdem zuvor denselben Abschluss ohne Abmeldung,
  Zweier-Koop den Bericht-/Rewardpfad. Die Tests verwenden synthetische Konten
  und lokale Rules, keine echten Geräte oder produktiven Firebase-Dienste.
- **Cache:** Lokaler Schlüssel `20261031-patch3`; auch neue Dialog-, Sprach-
  und Koordinatormodule sind in den Cache-Vertrag einbezogen. Weitere vollständige
  Regressionen und der synthetische Browser-Cachetest nach diesem Eintrag
  stehen noch aus.
- **Grenzen / offen:** Die zurückgehaltene Transaktion simuliert noch keine
  serverseitige Ablehnung. Natürliches Ende, Duelle, Recovery und weitere
  Session-/Party-Races benötigen zusätzliche Prüfungen. Ein dauerhaft offline
  oder früher ausgetretener Spieler kann die sichere Auflösung blockieren; eine
  sofortige oder erzwungene Abmeldung kann ohne Recovery eine gestartete Party
  zurücklassen. Kein Timeout wird als Erfolg gewertet. GitHub-CI, echte Geräte,
  produktive Rules und Livebetrieb sind nicht geprüft.
- **Git / PR / Release:** Kein neuer Commit, Push, PR, Merge, Deployment,
  produktiver Eingriff oder Wiederöffnung. Die Wartung bleibt aktiv.

## IPL-0016 – Block 1: serverseitig abgelehnter Reward und Cache-Nachlauf

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; die
  Umgebungsuhr meldete 2026-11-16 UTC. Branch/Basis wie IPL-0015.
- **Ziel / Änderung:** Der neue Fall in `firebase/rules-test/multiplayer-browser.cjs`
  hält zunächst den echten SDK-Transaktionsaufruf eines Gastes zurück. Für den
  Fehlerfall ergänzt der Test-Wrapper vorübergehend ein ungültiges Profilfeld;
  die lokalen RTDB-Rules lehnen den tatsächlichen Write mit `permission_denied`
  ab. Danach entfernt der Test den Fehler und lässt die reguläre Reward-Queue
  erneut versuchen. `package.json` bietet separate Abschlusstests an.
- **Prüfungen:** `npm run test:party-end-rejection-browser` bestand lokal mit
  drei Chromium-Sitzungen und Auth-/RTDB-Emulator: Kein XP-/Receipt-Write,
  Fehler im Bericht, keine Gastquittung und keine Partyauflösung während der
  Ablehnung; nach einem tatsächlich bestätigten Retry wurden Reward und
  Bericht bestätigt und Party sowie Code geschlossen. Das ist eine echte
  Emulator-Rules-Ablehnung durch bewusst ungültige Testdaten, keine Messung
  eines realen Produktionsfehlers. Der Cache-Smoke mit synthetischen alten
  HTTP-Antworten bestand erneut, ebenso die separate fokussierte Node-Suite
  **44/44**. Der alte Schlüssel `20261031-finale1` verweist noch auf unveränderte
  Module; sein Restbestand und die Importkohärenz werden weiter geprüft.
- **Offen:** Natürliches Ende, kompetitive Modi, Recovery im Browser, weitere
  Races und Gesamtsuiten. Offline oder bereits ausgetretene Teilnehmer können
  die sichere Schließung weiter blockieren. Keine echte Geräte- oder Liveabnahme.
- **Git / PR / Release:** Lokal/uncommittet; kein neuer Commit, Push, PR,
  Deployment oder produktiver Eingriff; Wartung bleibt aktiv.

## IPL-0017 – Block 1: Duell-Abschluss und Bericht im Hauptmenü

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; die
  Umgebungsuhr meldete 2026-11-16 UTC. Branch/Basis wie IPL-0015.
- **Befund / Änderung:** Nach einem natürlichen Mehrspieler-Ende musste der
  Host den Bericht verlassen, um die Party ausdrücklich zu schließen. Der
  erhaltene Bericht war danach über die versteckte Spielfläche nicht mehr
  sinnvoll erreichbar. `command-center.mjs`, `game.js` und `index.html` bieten
  deshalb bei vorhandenem, kontogebundenem Bericht „Letztes Ergebnis“ direkt im
  Kommandozentrum. Ein Kontowechsel entfernt den Zugriff. Der neue Menütest war
  vor der Korrektur rot und ist danach grün; UI-/DOM-Suite **11/11**.
- **Prüfungen:** `npm run test:party-modes-browser` bestand mit echten lokalen
  Firebase-SDKs und zwei bzw. vier isolierten Chromium-Oberflächen: absichtlicher
  Hostabschluss in 1 gegen 1 und 2 gegen 2, bestätigte Berichte und Löschung von
  Party und Code. `npm run test:party-natural-browser` bestand für beide Modi:
  Ein echter Gegner beendete die Welle durch Bunkertreffer; Sieg und Niederlage
  erschienen auf den jeweiligen Seiten, das natürliche Ende löschte die Party
  nicht, erst der ausdrückliche Hostschluss und alle Quittungen. Der Host öffnete
  danach seinen Bericht aus dem Kommandozentrum erneut. **Testbeschleunigung:**
  Der Test setzt nur in der temporär gepackten Testkopie die Anfangs-HP einer
  Seite auf 1; es ist keine reguläre Balance- oder Langzeitpartie. Es gab dabei
  noch keine abgeschlossene belohnte Welle. Keine echten Geräte/Live-Dienste.
- **Grenzen / offen:** Ein kompetitives Spiel pausiert bei fehlendem Spieler;
  der aktuelle Hostkern verlangt dessen Rückkehr auch für eine Endanfrage.
  Frühzeitig ausgetretene Mitglieder und dauerhafte Offlinesituation können
  die sichere Auflösung weiterhin blockieren. Recovery mit bestehender
  Endgeneration und alle Gesamtsuiten sind noch nicht geprüft.
- **Git / PR / Release:** Lokal/uncommittet; kein neuer Commit, Push, PR,
  Deployment oder produktiver Eingriff; Wartung bleibt aktiv.

## IPL-0018 – Block 1: Feld-Abmeldung, pausierte Duelle und Recovery

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; die
  Umgebungsuhr meldete 2026-11-16 UTC. Branch/Basis wie IPL-0015; alle
  Änderungen sind lokal und uncommittet.
- **Feldmenü und Bedienung:** `index.html`/`field-menu.mjs` führen die
  Abmeldung aus dem sichtbaren Spielfeldmenü in denselben kontogebundenen
  Dialog wie im Kommandozentrum. `style.css` lässt die Dienstaktionen auch bei
  kleinem Querformat umbrechen; ein realer Chromium-Layouttest fand vorher
  einen horizontalen Überlauf und nach dem Fix nicht mehr. Die neue Feldtaste
  ist mindestens 44 Pixel hoch. Dialog, Tastatur und Feldtaste bestanden auf
  sechs emulierten Viewports von 320×240 bis 1280×800. Das ist keine Prüfung
  mit physischen Geräten oder Screenreadern.
- **Vier-Spieler-Abmeldung:** `test:party-signout-browser` bestand mit vier
  isolierten Chromium-Oberflächen und lokalen Auth-/RTDB-Emulatoren für alle
  drei Entscheidungen direkt aus der laufenden Partie: Bei „Beenden und
  warten“ blieb die Sitzung bis zur ausstehenden Gastquittung und bestätigtem
  Reward geöffnet; Abbrechen verhinderte die spätere automatische Abmeldung;
  „Jetzt abmelden“ beendete das Guard-Dokument ohne ein Ende zu erfinden und
  ließ die unbestätigte Party auf dem Emulator stehen. Ein erster kombinierter
  Wiederholungslauf scheiterte nur an doppelt angelegten synthetischen Auth-UIDs;
  der Test verwendet seitdem getrennte UIDs je Variante und bestand danach.
- **Pausiertes Duell:** `party-host.mjs`, `protocol.mjs`, `four-modes.mjs`, die
  Live-/Recovery-Sessionadapter und `game.js` erlauben dem verbundenen Host
  eine ausdrücklich gewählte Endanfrage auch bei fehlendem Gegner. Sie wird
  getrennt von der Kampfsimulation verarbeitet; während der Pause laufen keine
  Kampfschritte und spät eingetroffene Spielbefehle erhalten eine Stornierung.
  Nach dem Ende dürfen anwesende Mitglieder quittieren, der fehlende Gast wird
  nicht fingiert. Fokusverlust, eigener Verbindungsverlust, veraltete Recovery-
  Ansichten und nicht zum Host gehörende Endbefehle bleiben gesperrt.
- **Duellprüfung:** `test:party-offline-modes-browser` bestand für 1v1 und 2v2
  mit zwei bzw. vier Chromium-Sitzungen und lokalen Firebase-SDKs: Nach Start
  einer echten ersten Welle pausiert das Feld bei Gast-Offlinezeit, der Host
  beendet, anwesende Spieler quittieren, Party/Code bleiben bis zur Rückkehr
  des fehlenden Gasts erhalten und werden danach bestätigt geschlossen. Es
  wurde keine belohnte Welle abgeschlossen; dies ist kein Langzeit-/Live-Test.
  Kern-, Sequenz-, UI- und Recovery-Doubles decken außerdem Fokuswechsel,
  verspätete Befehle und einen Takeover mit bestehender Endgeneration ab.
- **Recovery-Browser:** `test:party-recovery-browser` bestand für drei
  Sitzungen mit zurückgehaltener echter SDK-Rewardtransaktion: Host-Neuladen,
  Wiederanmeldung, explizites „Resume as Host“, neue Lease-Generation und
  gleicher End-Tick mit bereits vorhandenen, aber ohne die fehlende Quittung;
  erst nach Gast-Reconnect und serverbestätigtem Reward wurden Party und Code
  gelöscht. Firebase-Emulator-Referenzen lassen beim REST-`toString()` den
  Namespace weg; der Test ergänzt deshalb ausschließlich für diesen lokalen
  Serverread den Demo-Namespace. Die temporäre Testkopie legt lediglich eine
  bereinigte Fehlermeldung offen; dies beweist keine produktive Recovery.
- **Weitere Tests:** Neue Kern-/Session-/UI-/Stamp-Fälle bestanden fokussiert
  **37/37**, Recovery-/Kontroll-Fencing **11/11**, neuer Panel-Teardown-Race
  **3/3**; ein verzögerter alter Watch/Teardown und ein alter Endnachweis
  löschen keine neu erstellte Party. Der synthetische HTTP-Altcache-Smoke und
  der separate Feld-Smoke bestanden. Gesamtsuite und erneute Emulator-Regression
  laufen bei diesem Eintrag noch; spätere Ergebnisse werden gesondert erfasst.
- **Grenzen:** Recovery bleibt für neue Gruppen opt-in (`?recovery=1`). Ein
  dauerhaft offline oder bereits ausgetretener Spieler kann die sichere
  Auflösung weiter blockieren; sofortige/erzwungene Abmeldung kann ohne
  Recovery eine gestartete Gruppe zurücklassen. Kein Timeout gilt als
  Zustellungs- oder Speichernachweis. Echte Geräte, reale Netzwechsel,
  Firefox/Safari, produktive Rules und GitHub-CI sind nicht geprüft.
- **Git / PR / Release:** Kein neuer Commit, Push, PR, Deployment, produktiver
  Eingriff oder Wiederöffnung; Wartung bleibt aktiv.

## IPL-0019 – Block 1: Servernachweis auch bei bereits gespeicherten Rewards

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; Umgebungsuhr
  2026-11-16 UTC. Branch/Basis wie IPL-0015; Änderungen lokal; mit Commit „Block 2: eindeutige Soldatennamen fuer neue Charaktere (A1)“ eingestellt und als PR #293 zur Abnahme vorgelegt.
- **Befund:** Die SDK-Version 10.14.1 kann beim `runTransaction`-Abbruch durch
  `undefined` sofort `committed: false` mit dem lokalen Eingabesnapshot liefern,
  ohne dass ein Server-Write stattgefunden hat. Eine darin schon enthaltene
  Rewardmaske durfte daher nicht als Serverbestätigung für den Abschluss gelten.
  Zwei neue Tests reproduzierten dies vor der Korrektur. Ein früherer erfolgreicher
  Write oder ein Cachewert allein beweist keine erneute Bestätigung nach Recovery.
- **Änderungen:** `coop-rewards.mjs` führt bei einer bereits gutgeschriebenen
  Maske einen unverändernden Compare-and-Set durch und akzeptiert den Beleg nur
  bei `committed: true` und passender Maske. Die Callback-Entscheidung wird bei
  jedem konkurrierenden Transaktionsretry neu bestimmt; XP und Loot werden bei
  vorhandener Maske nicht nochmals vergeben. Fehler und Abbruch halten die
  Queue ausstehend. `game.js` zeigt einen koordinierten Endbericht erst nach
  Bestätigung *aller* finalen Masken als vollständig gespeichert; eine einzelne
  ältere Quittung reicht nicht. `index.html` macht den bereits vorhandenen Text
  „In dieser Sitzung bestätigt“ sichtbar; nach Recovery erklärt der Bericht
  zusätzlich frühere, nicht erneut gezählte Rewards.
- **Prüfungen:** Unit- und UI-Regression für Abbruch, No-op, konkurrierenden
  Retry und Teilbestätigung bestanden **16/16**. Der echte Firebase-SDK-Test
  mit lokalen Rules bestand **20/20**: vorhandene Quittung bei Offline-Cache
  bleibt unbestätigt, nach Online-CAS wird sie ohne doppelte XP bestätigt; ein
  durch ein ungültiges Testfeld serverseitig abgelehnter No-op bestätigt nichts
  und der spätere Retry gelingt. Die Offlineprüfung lief für den Legacy- und
  den Workshop-Queuepfad; sie beweist keine Netzwerk- oder Produktionsabnahme.
  Der erste Emulatorlauf war **17/20**, weil die drei neuen Testfixtures ein
  Konto unzulässig mit XP > 0 erzeugten. Danach legt der Test das Null-XP-Konto
  regelkonform an und verdient die erste Welle durch die echte Reward-Queue.
- **Weitere Regression:** Der erste komplette Node-Lauf nach IPL-0018 meldete
  **971/973**: Zwei Duelltests nahmen fälschlich an, ein neuer ausdrücklich
  stornierter Befehl verbrauche keine Sequenz. `wave-consensus.test.mjs` prüft
  jetzt Stornierung, Sequenzverbrauch und identische Wiederzustellung; die
  fokussierte Abstimmungs-/Host-Suite bestand **66/66**. Kein Spielfix wurde
  für diese zwei veralteten Testerwartungen benötigt.
- **CI-Vorbereitung:** Der lokale Workflow enthält eine eigene Matrix mit sieben
  getrennten Chromium-/Firebase-Emulatorfällen für Abschluss, Ablehnung,
  Abmeldung, Duell, pausiertes Duell, natürliches Ende und Recovery. Jede Matrix-
  Instanz erhält einen eigenen Runner; das vermeidet Portkonflikte und belastet
  nicht den bestehenden Interface-Job. YAML und Scriptzuordnung wurden lokal
  geprüft, der neue CI-Vertragstest bestand **1/1**. GitHub-CI ist noch nicht
  auf diesem Arbeitsstand gelaufen.
- **Offen:** Die erneute serielle Gesamtsuite und weitere Emulator-/Browserläufe
  laufen noch. Der Recovery-Browsertest hält nun nach Host-Neuladen auch dessen
  erneute Rewardprüfung zurück und darf trotz aller älteren Quittungen vor deren
  Freigabe nicht schließen. Ergebnis folgt. Offline gebliebene/ausgetretene
  Teilnehmer, verwaiste Gruppen ohne Recovery, echte Geräte und produktive
  Regeln bleiben offene Grenzen; kein Timeout beweist eine Speicherung.
- **Git / PR / Release:** Kein Commit, Push, PR, Deployment, produktiver
  Eingriff oder Wiederöffnung; Wartung bleibt aktiv.

## IPL-0020 – Block 1: Abschlussregression und aktualisierte Sicherheitsverträge

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; Umgebungsuhr
  2026-11-16 UTC. Branch `arena/63527f0d-0815games-github-io`, Basis `05542181c2`;
  Änderungen lokal und uncommittet.
- **Gesamtsuite und Testkorrektur:** Der erste erneute serielle Node-Lauf nach
  IPL-0019 endete mit **976/978**. Zwei ältere Fälle in
  `tests/version-save-safety.test.mjs` werteten einen lokal abgebrochenen
  Reward-Write mit passendem Cache-Snapshot noch als bestätigt. Die Tests
  erwarten nun korrekt einen erneuten erfolgreichen Compare-and-Set; ein neuer
  Fall prüft den Abbruch nach Queue-Schließung. Die fokussierte Reward-/Bericht-/
  Versionssuite bestand danach **21/21**. Der nächste serielle Gesamtlauf
  bestand **979/979**; er wurde vor den später hinzugefügten Porträttests
  gestartet. Eine vollständige Wiederholung mit diesen Tests läuft separat.
- **Stresstest:** Ein älterer Lasttest erwartete bei Disconnect im 1v1 nur die
  Stornierung des fehlenden Spielers. Seit IPL-0018 pausieren beide kompetitiven
  Modi und stornieren alle eingereihten Spielbefehle; die Erwartung in
  `stress-tests/run.mjs` wurde entsprechend korrigiert. Der deterministische
  Lastlauf bestand anschließend einschließlich 40 Disconnect-/Reconnect-Zyklen
  je Modus. Ein erster Lauf war an der alten Zählererwartung gescheitert.
- **Firebase und Browser:** Alle **22** im Rules-CI-Job vorgesehenen lokalen
  Emulator-Skripte liefen sequenziell erfolgreich; ihre wiederholten TAP-Läufe
  zählten zusammen **320 bestanden, 0 fehlgeschlagen, 9 absichtlich übersprungen**
  von 329. Darunter sind Unified-/Recovery-/Guard-/Wartungs-, Workshop-, Social-
  und Reward-Rules. Die gesonderten Chromium-/Firebase-Läufe nach der Reward-
  Korrektur bestanden für Recovery mit zurückgehaltener Host-Neuprüfung,
  Rules-Ablehnung und Retry, pausiertes 1v1/2v2 sowie alle drei Abmeldeoptionen.
  Der Host-Reload meldete bereits früher bestätigte XP ohne Doppelauszahlung.
  Die vollständige Siebenfall-Browsermatrix wurde nach den Porträtänderungen
  separat durchlaufen; Details und spätere Nachprüfungen in
  [IPL-0026](#ipl-0026--abschließende-lokale-regression-und-releaseprüfung).
  GitHub-CI lief auf diesem Stand nicht.
- **Weitere Tests:** Server-Tests **13/13**, Release-Service-Konfigurations- und
  Laufzeit-Tests **5/5**, Syntax-/Whitespace-Checks grün. Die erste Release-
  Testausführung konnte `firebase-admin` nicht finden; nach `npm ci` im
  ignorierten lokalen `node_modules` bestanden die Tests. Keine Credentials
  wurden benötigt oder eingelesen.
- **Grenzen:** Wie IPL-0018/0019: Offline- oder ausgetretene Mitglieder können
  ein sicheres Auflösen blockieren; ohne Recovery kann eine gestartete Party
  zurückbleiben. Echte Geräte, Netzwechsel, produktive Rules und GitHub-CI sind
  keine durch Emulatorergebnisse ersetzten Nachweise.
- **Git / PR / Release:** Kein neuer Commit, Push, PR, Deployment, produktiver
  Eingriff oder Wiederöffnung; Wartung bleibt aktiv.

## IPL-0021 – Block 2: Freundschaftsabläufe und lokale Freundesporträts

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; Umgebungsuhr
  2026-11-16 UTC. Derselbe Branch/Basisstand; Änderungen lokal; mit Commit „Block 2: eindeutige Soldatennamen fuer neue Charaktere (A1)“ eingestellt und als PR #293 zur Abnahme vorgelegt.
- **Freundschaften:** Zusätzliche `friends.test.mjs`-Emulatorfälle prüfen
  Ablehnung mit verbliebener Sendermarkierung, erneute Anfrage, Annahme und
  Entfernen in beiden Richtungen sowie gleichzeitig ausgelöste Gegenanfragen:
  höchstens eine bestätigte Kante. Sie bestanden auch in den Search- und
  Coop-Invite-Rules-Varianten. Zwei Chromium-Oberflächen mit echten SDKs und
  lokalen Auth-/RTDB-Emulatoren bestanden dieselben Lebenszyklen, Einladung,
  Beitritt, späteren Partyabschluss und sichtbare Charakterbereinigung. Das
  prüft synthetische, keine historischen oder produktiven Konten.
- **Porträts:** `friend-portrait.mjs`, `friends-ui.mjs`, `index.html`, `style.css`
  und `assets/friend-placeholder.svg` zeigen für bestätigte Freunde in Liste
  und Datenfenster dasselbe aus dem gespeicherten Avatar zusammengesetzte Bild.
  Nur die Kinder `avatar` und `gender` werden abonniert; es wird kein fremdes
  Gesamtprofil und kein lokaler Avatar-Spiegel eines anderen Kontos gelesen.
  Fehlende, unlesbare oder ungültige Werte und fehlende Bilddateien erhalten ein
  neutrales Platzhalterbild. Accountwechsel, beendete Watches und verspätete
  Bildkompositionen können keine alten Bilder zurück in die Ansicht schreiben.
- **Lokaler Rules-Kandidat:** `firebase/friend-portrait-candidate.mjs` erweitert
  den hashgebundenen Social-Cleanup-Kandidaten ausschließlich um zwei
  freundschaftsgebundene Kind-Leserechte, analog zu bestehenden Statistik-
  freigaben. Elternprofile, andere Felder und Schreibrechte werden nicht
  freigegeben. Die alten Rules zeigen weiterhin den Platzhalter und lassen die
  übrigen Daten funktionieren. Der Kandidat ist **nicht** in die bestehenden
  Produktions-/Wartungs-Vorbereitungsskripte eingebaut und nicht veröffentlicht;
  vor jeder möglichen Freigabe muss er separat mit dem dann frisch exportierten
  vollständigen Produktionsstand abgeglichen und sicherheitsgeprüft werden.
- **Nachweise:** Struktureller Kandidaten- und Porträt-Unit-Test **5/5**;
  Firebase-Rules-Emulator **4/4 plus 1 fallbedingt übersprungen**, mit Release-
  Guard **5/5**. Zwei echte SDK-/Chromium-Sitzungen prüften die alten Rules mit
  Platzhalter, die neuen Kandidatenregeln, beide Leserichtungen, gespeicherte
  Layerbilder, identische Listen-/Datenansicht, Live-Wechsel, fehlenden Avatar
  und Entfernen; statische Layout-/DOM-Tests bestanden mit Browser-Doubles bei
  320×240, 390×844 und 844×390. Das sind keine physischen Geräte.
- **Grenzen:** Ein älterer Charakter, dessen Gesicht ausschließlich im eigenen
  lokalen Speicher liegt, hat serverseitig keinen teilbaren Avatar; Freunde
  sehen deshalb bewusst den Platzhalter. Kontoübergreifende Namenseindeutigkeit,
  autorisierte Altbestandsaufnahme und Konfliktregelung sowie echte Geräte- und
  Produktionsabnahme bleiben offen. Kein Produktionszugriff oder Rules-Deploy.
- **Git / PR / Release:** Kein neuer Commit, Push, PR, Deployment, produktiver
  Eingriff oder Wiederöffnung; Wartung bleibt aktiv.

## IPL-0022 – Block 2: Datenschutzschonende Namens-Vorprüfung

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; Umgebungsuhr
  2026-11-16 UTC. Branch/Basis wie IPL-0020; alles lokal; mit Commit „Block 2: eindeutige Soldatennamen fuer neue Charaktere (A1)“ eingestellt und als PR #293 zur Abnahme vorgelegt.
- **Ziel und Änderungen:** `scripts/audit-character-names.py` und
  `firebase/CHARACTER-NAME-AUDIT.md` bereiten eine spätere, separat genehmigte
  Bestandsaufnahme vor. Das Skript ist rein offline, liest einen ausdrücklich
  angegebenen JSON-Export mit `players`, ändert keine Daten und untersucht auch
  Profile ohne Suchindex. Standardausgabe enthält ausschließlich Gesamtzahlen.
  Ein optional angeforderter vertraulicher Bericht mit Namen und Konto-IDs wird
  außerhalb des Checkouts exklusiv mit höchstens Modus 0600 angelegt, niemals
  überschrieben; bestehende Symlinks und ins Repository aufgelöste Ziele werden
  abgelehnt. Es wurden ausschließlich synthetische Fixtures verwendet.
- **Vergleich:** Als ausdrücklich **vorläufiger** Vorschlag gelten äußere
  ECMAScript-Leerzeichen, NFC, Unicode Default Case Folding und erneut NFC;
  die Python-Unicode-Version wird mit ausgegeben. Dadurch kollidieren etwa
  `Straße`/`STRASSE` und gleichwertige zerlegte Akzente, nicht aber beliebige
  visuell ähnliche Schriftzeichen oder Kompatibilitätsformen. Diese Regel ist
  noch keine abgestimmte Produktentscheidung und unterscheidet sich von der
  bestehenden Freundessuche. Ungültige Profile und Keys werden ausgewiesen;
  nichtleere zu kurze/zu lange Namen bleiben in der Kollisionsprüfung.
- **Prüfung:** Sechs Node-Tests mit synthetischen lokalen Dateien bestanden;
  sie prüfen Normalisierung, nicht indizierte Konten, unbrauchbare Daten,
  doppelte JSON-Keys, Geheimhaltung der Konsolenausgabe, exklusive Dateierstellung,
  Symlinks, Längenbegrenzung und nicht blockierende Ablehnung einer FIFO-Datei.
  Der erste Testlauf war absichtlich rot; nach Härtung wurden auch ungültiges
  JSON-`NaN` und ungültige Konto-Keys korrekt behandelt.
- **Grenzen:** Eine Datei beweist keine Vollständigkeit oder Aktualität des
  Exports; `completeExportVerified` bleibt immer `false`. Der Entwurf inventarisiert
  keine verwaisten Reservierungen oder konkurrierenden Schreibvorgänge und
  trifft keine Entscheidung zu Alt-Duplikaten. Es existiert noch keine sichere
  kontoübergreifende Registrierung, Namensmigration oder Rules-Durchsetzung.
  Kein echter Export wurde angefordert, gelesen, gespeichert oder übertragen.
- **Git / PR / Release:** Kein neuer Commit, Push, PR, Deployment, produktiver
  Eingriff oder Wiederöffnung; Wartung bleibt aktiv.

## IPL-0023 – Regressionen: Einladungs-Test und deterministischer Timeout-Test

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; Umgebungsuhr
  2026-11-16 UTC. Branch/Basis wie IPL-0020; Änderungen lokal; mit Commit „Block 2: eindeutige Soldatennamen fuer neue Charaktere (A1)“ eingestellt und als PR #293 zur Abnahme vorgelegt.
- **Browsertest:** Der umfangreiche `browser-tests/command-center.cjs` traf im
  Training nach Einführung des mittigen Anfragezentrums nicht mehr den markierten
  Bauplatz: Eine nichtmodale Einladungskarte lag an dieser Stelle. Der ältere
  Test ging vom automatischen Verwerfen durch einen Außenklick aus. Er legt die
  Karte nun ausdrücklich mit „Später“ beiseite, prüft die weiterhin vorhandene
  Einladung und übt beim späteren Ablehnen den aktuellen transaktionalen
  Vergleich in seinem SDK-Double. Eine Tap-Diagnose nennt bei künftigem Fehler
  das getroffene Element und die Geometrie. Danach bestand der gesamte Chromium-
  Kommandozentrum-/Tutorial-Smoke mit synthetischem Konto. Die Karte kann einen
  Teil des Spielfelds überdecken, bis sie bewusst beiseitegelegt wird; sie
  beantwortet die Einladung dadurch nicht.
- **Session-Test:** Ein Gesamtlauf mit gleichzeitig laufenden Browser-Emulatoren
  endete **983/984**, weil eine Pause-/Quittungsprüfung unter Last vor ihrer
  erwarteten Antwort das künstlich kurze 15-ms-Timeout erreichte. In
  `tests/firebase-party-session.test.mjs` simuliert ein explizit fehlgeschlagener,
  später ausgelieferter Write die ungewisse Zustellung ohne diese Zeitannahme;
  ein separater kurzer Timeouttest prüft weiterhin gesperrte Sequenz, späte
  Quittung und Wiederfreigabe. Die Session-/Host-/Protokoll-/Abstimmungs-Fokus-
  suite bestand danach **58/58**. Es wurde kein Spielverhalten geändert. Der
  spätere komplette Testlauf ist in [IPL-0026](#ipl-0026--abschließende-lokale-regression-und-releaseprüfung) dokumentiert.
- **Git / PR / Release:** Kein neuer Commit, Push, PR, Deployment, produktiver
  Eingriff oder Wiederöffnung; Wartung bleibt aktiv.

## IPL-0024 – Block 2: Ungültige Freundesporträts und Cache-Testkette

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; abgefragte
  Umgebungsuhr 2026-11-16 UTC. Branch/Basis wie IPL-0020; lokal; mit Commit „Block 2: eindeutige Soldatennamen fuer neue Charaktere (A1)“ eingestellt und als PR #293 zur Abnahme vorgelegt.
- **Befund:** Der Decoder für das eigene Profil ersetzt bewusst unbekannte
  Avatarteile durch Standardwerte. Die neue Freundesansicht ließ zuvor auch
  unbekannte IDs, widersprüchliche Geschlechter und weitere ungültige Teile
  passieren; dadurch konnte sie ein geratenes Standardgesicht als tatsächliches
  Freundesporträt zeigen. Ein gezielter Unit-Test war zunächst rot.
- **Änderung:** `friend-portrait.mjs` akzeptiert nur tatsächlich erzeugte,
  bekannte Layer-Kombinationen oder bekannte Einzel-Looks der vorherigen
  Version. IDs werden gegen die vorhandenen Optionen geprüft, Geschlecht und
  gespeicherter Wert müssen zusammenpassen. Unbekannte, alte Comic- und
  zukünftige nicht unterstützte Formate bleiben beim neutralen Platzhalter;
  gültige Looks verwenden weiterhin denselben Decoder und Renderer wie zuvor.
  Dies ändert weder gespeicherte Avatare noch den Decoder des eigenen Profils.
- **Prüfung:** Porträt-, Avatar-, Rules-Diff- und Build-Stamp-Fokus **21/21**;
  er umfasst alle aktuell wählbaren Layerkombinationen und bekannten alten
  Einzel-Looks. Die Chromium-Freundesansicht mit In-Memory-Adapter prüft auch
  den Platzhalter bei unbekannter Face-ID in Liste und offenem Dossier.
  Bei der anschließenden Cacheprüfung fehlte im Testserver zunächst der Pfad
  zum tatsächlich importierten Layer-Manifest; `cache-wave.cjs` erlaubt diesen
  konkreten lokalen Pfad nun und prüft Decoder, Renderer und Manifest explizit.
  Der korrigierte Chromium-Cachetest bestand mit synthetisch gefülltem Altcache.
  Der echte Stagingtest wurde um die neuen Module, CSS und Platzhalterdatei
  ergänzt; der spätere Gesamtlauf bestand ([IPL-0026](#ipl-0026--abschließende-lokale-regression-und-releaseprüfung)).
- **Grenzen:** Alte rein lokale oder nicht eindeutig darstellbare Gesichter
  bleiben Platzhalter. Diese Korrektur ersetzt weder eine frische Rules-Prüfung
  noch Geräte-, Screenreader- oder Produktionsabnahme.
- **Git / PR / Release:** Kein neuer Commit, Push, PR, Deployment, produktiver
  Eingriff oder Wiederöffnung; Wartung bleibt aktiv.

## IPL-0025 – Block 2: Kein Scheinerfolg bei konkurrierenden Freundesanfragen

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; abgefragte
  Umgebungsuhr 2026-11-16 UTC. Branch/Basis wie IPL-0020; lokal; mit Commit „Block 2: eindeutige Soldatennamen fuer neue Charaktere (A1)“ eingestellt und als PR #293 zur Abnahme vorgelegt.
- **Reproduktion:** Zwei synthetische Tabs desselben Kontos lasen im Firebase-
  Emulator zunächst dieselbe freie Freundschaftskante und schrieben gleichzeitig.
  Die Rules bestätigten nur einen Schreibvorgang; der Client des anderen Tabs
  las anschließend die vorhandene Kante und meldete fälschlich ebenfalls Erfolg.
  Der neue Emulatortest war vor dem Fix rot: zwei Erfolgsmeldungen statt einer.
- **Änderung:** `friends.mjs` meldet einen vom SDK nicht bestätigten Write nicht
  mehr aufgrund einer danach sichtbaren Kante als Erfolg. Stattdessen erklärt
  eine DE-/EN-Meldung, dass die Anfrage nicht bestätigt ist und die gesendete
  Liste vor einem Retry geprüft werden soll. Der vorher geschriebene Zeiger wird
  nicht blind gelöscht, da er zur konkurrierenden Anfrage gehören kann. Session-
  Wechsel bleiben separat abgefangen. `friends-ui.mjs` und Cache-Vertrag laden
  das geänderte Modul über die lokale Buildwelle.
- **Prüfung:** Unit-/Sprach-/Porträt-/Build-Fokus **32/32**; lokaler Firebase-
  Emulator `test:friends` **5/5**, `test:friend-search` **3/3 + 5/5** und
  `test:coop-invites` **5/5 + 3/3 + 5/5**. Der Zwei-Tab-Fall prüft eine
  bestätigte Anfrage, eine unbestätigte Antwort und Erhalt von Kante/Zeiger.
  Eine echte Chromium-Oberfläche mit In-Memory-SDK zeigt bei künstlich
  abgelehntem Write den Fehler statt „Anfrage gesendet“. Der Cache-Smoke prüft
  zusätzlich einen synthetischen Altstand des Freundesmoduls.
- **Grenzen:** Die Anzeige ist bewusst „nicht bestätigt“, keine Aussage, ob
  eine andere Anfrage angekommen ist. Ein bestehender, aber leerer Zeiger kann
  weiterhin als inaktive Anfrage erscheinen und manuell bereinigt werden.
  Offline wartende SDK-Schreibvorgänge und weitere Tab-/Altbestand-Races sind
  damit nicht vollständig gelöst; echte Geräte und produktive Daten fehlen.
- **Git / PR / Release:** Kein neuer Commit, Push, PR, Deployment, produktiver
  Eingriff oder Wiederöffnung; Wartung bleibt aktiv.

## IPL-0026 – Abschließende lokale Regression und Releaseprüfung

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; abgefragte
  Umgebungsuhr 2026-11-16 UTC. Branch `arena/63527f0d-0815games-github-io`,
  Basis `05542181c2`; alles lokal; mit Commit „Block 2: eindeutige Soldatennamen fuer neue Charaktere (A1)“ eingestellt und als PR #293 zur Abnahme vorgelegt.
- **Spiel und Staging:** `node --test --test-concurrency=1
  IronPath/tests/*.test.mjs` bestand nach IPL-0025 mit **994/994**, ohne Skips;
  der Lauf enthält das reale lokale Staging des aktuellen Runtimes, die
  zusätzlichen Freundes-/Anfrage-/Abschlussmodule, das CSS und den Porträt-
  Platzhalter. Auch der isoliert erzeugte Guarded-Pages-Artefakt- und der
  bestehende Rules-Vorbereitungstest bestanden; es wurde nichts veröffentlicht.
  `npm test` in `IronPath/server` bestand **13/13**, die beiden Release-Service-
  Konfigurations-/Kompatibilitätssuiten bestanden **5/5**. Einzelne Node-TAP-
  Zähler stehen für ganze Dateien und sind nicht als Zahl der Assertions zu lesen.
- **Browser:** Auf dem letzten lokalen Stand bestanden acht Chromium-Smokes:
  Kommandozentrum/Tutorial, Freundesbereiche/Porträt und fehlgeschlagene Anfrage,
  Cachewelle, Anfrage-/Feldabmeldelayout, Mehrspielerfeld, Wellen-/2×-Konsens,
  Charakterentlassung und Rückzug. Sie nutzen synthetische Konten bzw. Transport-
  oder SDK-Doubles; der Cache enthält künstliche Altmodule, nicht produktive
  Browserverläufe. Das Layout wurde in sechs emulierten Größen getestet.
- **Multiplayer-Emulatoren:** Die sieben lokal definierten Abschluss-Matrixfälle
  liefen nach der ersten Porträtergänzung vollständig durch: Hostabschluss,
  Rules-Ablehnung/Retry, drei Abmeldeentscheidungen, 1v1/2v2, pausierte Duelle
  mit Rückkehr, beschleunigte natürliche Niederlage und Host-Recovery. Die
  natürliche Niederlage verwendet dafür künstlich ein Start-HP. Nach der
  anschließenden strengeren Porträtprüfung und dem Freundesanfrage-Fix wurden
  Rules-Ablehnung/Retry und Recovery erneut auf dem letzten Stand erfolgreich
  mit drei isolierten Chromium-UIs und lokalen Auth-/RTDB-Emulatoren geprüft.
  Sie beweisen keine Übertragung bei dauerhaft abwesendem Teilnehmer.
- **Social-Emulatoren:** Porträt-Rules **9 bestanden, 1 fallbedingt
  übersprungen** über unbewachten und Release-Guard-Lauf; `test:friends`,
  `test:friend-search`, `test:coop-invites`, `test:leaderboards` und
  `test:direct-invites` bestanden nach dem Zwei-Tab-Fix. Der Social-Browsertest
  bestand danach mit zwei SDK-/Chromium-Sitzungen und synthetischen Daten.
  Die zuvor in IPL-0020 genannten **320/9** stammen aus dem älteren Rules-
  Gesamtlauf vor diesen letzten Social-Änderungen, nicht aus einem neuen Lauf
  aller 22 Skripte. Negativtests erzeugen erwartete Berechtigungsfehler.
- **Releasegrenzen:** Die lokale Workflow-YAML ist parsebar und enthält sieben
  getrennte Matrixjobs; GitHub-CI wurde mit diesen Änderungen nicht gestartet.
  `git diff --check`, die Prüfung neuer Textdateien auf trailing whitespace und
  52 lokale Markdown-Verweise waren fehlerfrei. Der Porträt-Rules-Kandidat ist
  nicht Teil der bisherigen Produktions-/Wartungs-Vorbereitung und muss vor
  einer Freigabe anhand eines aktuellen Exports gesondert geprüft und integriert
  werden. Staging, ein Testmanifest und ein Emulator ersetzen keinen Live-Rules-,
  CDN-, Cache-, Geräte-, Screenreader- oder Produktionsnachweis.
- **Offen:** Block 1 benötigt insbesondere reale Geräte-/Netzwechsel- und
  Langzeitabnahme; dauerhaft abwesende bzw. früh ausgetretene Teilnehmer und
  verwaiste Partys bleiben ein Designfall. In Block 2 fehlen globale
  Namenseindeutigkeit, eine vereinbarte Vergleichs- und Altduplikatregel sowie
  eine autorisierte vollständige Bestandsaufnahme. Die weiteren Blöcke 3–6
  bleiben gemäß Patchplan offen. Gemeldete CSS-/JPEG-Auslieferungsfehler sind
  nicht durch diese lokalen Tests aufgeklärt.
- **Git / PR / Release:** Kein neuer Commit, Push, PR, GitHub-CI-Lauf,
  Deployment, produktiver Rules-/Dateneingriff oder Wiederöffnung; Wartung
  bleibt nach dem zuletzt belegten Status aktiv.

## IPL-0027 – Releasepfad: normaler Pages-Einstieg und Wartungs-Rules

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; abgefragte
  Umgebungsuhr 2026-11-16 UTC. Branch `arena/63527f0d-0815games-github-io`,
  Basis `05542181c2`; Stand dieses Eintrags lokal; mit Commit „Block 2: eindeutige Soldatennamen fuer neue Charaktere (A1)“ eingestellt und als PR #293 zur Abnahme vorgelegt.
- **Auftrag:** Der Betreiber wünscht nach jedem sinnvollen Schritt eine
  Veröffentlichung und die Wiederöffnung zum Testen. Die ältere Vorgabe einer
  separaten Öffnungsfreigabe wurde in Arbeitsanweisung, Plan, Datenblatt und
  Operatorplan entsprechend aktualisiert. Eine echte Schaltung erfordert
  weiterhin ein berechtigtes Firebase-Administratorkonto; Zugangsdaten gehören
  nicht ins Log oder in den Chat.
- **Prüflücke geschlossen:** Die bisherigen umfassenden Abschluss-Browserfälle
  benutzten den isolierten Custom-Token-Guard. `multiplayer-browser.cjs` kann
  jetzt zusätzlich den normalen Pages-Einstieg mit Passwort-Auth und dem
  Firebase-Wartungs-Monitor ausführen. Nur öffentliche Konfiguration, Probe und
  SDK-Endpunkte werden für den Test in den lokalen Emulator umgeleitet; das
  echte Spiel, seine Oberfläche und Firebase-SDK laufen sonst unverändert.
  Die Kandidaten-Rules entstehen lokal aus der gepinnten Repository-Referenz mit
  Social-Cleanup und Wartungs-Gate, nicht aus einem aktuellen Live-Export.
- **Ergebnis:** Mit drei und vier isolierten Chromium-UIs bestanden zweimal
  jeweils der echte Upgrade- und Abstimmungspfad, Offline/Reconnect sowie der
  Hostabschluss mit zurückgehaltener Gast-Belohnung und bestätigtem Partyende.
  Anschließend bestand auch der bestehende Guarded-Fall für Rules-Ablehnung und
  Retry. Ein früherer Start blieb einmal beim Laden des ersten Profils hängen;
  die Ursache ist nicht belegt. Danach bestanden ein diagnostischer Einzel- und
  zwei vollständige Drei-/Viererläufe ohne zusätzliche Verbindungsinstrumente.
  Dies sind synthetische Konten und lokale Emulatoren, keine echten Geräte oder
  produktive Authentifizierung, Rules, CORS-, Pages- oder Cacheprüfung.
- **CI/Cache:** `test:party-maintenance-browser` ergänzt die isolierte Matrix um
  einen achten Eintrag; der Workflow-Vertrag und fokussierte Build-/Staging- und
  Wartungstests bestanden **14/14**. Die YAML wurde mit acht Einträgen geparst.
  Die geänderten Runtime-Module wurden zusätzlich gegen ihre Import-URLs geprüft;
  das neu hinzugefügte Prompt-CSS hat eine eigene neue Revision. Danach bestand
  der vollständige serielle Spieltest erneut **994/994**, der Server **13/13**
  und die beiden Release-Service-Testdateien **5/5**. Ein zunächst verwendetes
  `npm test` im Release-Tools-Verzeichnis scheiterte, weil dort kein `test`-
  Skript definiert ist; der direkte `node --test`-Aufruf bestand. GitHub-CI ist
  zu diesem Zeitpunkt noch nicht gelaufen.
- **Grenzen:** Kein Firebase-Rules- oder Daten-Update. Insbesondere sind die
  zusätzlichen Porträt-Reads noch nicht produktiv belegt; ohne erlaubte Reads
  erscheint der neutrale Platzhalter. Langzeittests, Safari/Firefox, echte
  Geräte und dauerhaft offline Teilnehmer bleiben offen. Der zuletzt öffentlich
  belegte Zustand war `maintenance`; die Arbeitsumgebung hat keinen bestätigten
  produktiven Zugriff auf den Admin-Schalter.

## IPL-0028 – Veröffentlichung, Wiederöffnung und Testliste

- **Git und Pages:** Commit `c8991d4888d5189ba25d5584f3ea41804fa59454`
  wurde auf dem vorherigen Arbeitsbranch gepusht und mit
  [PR #289](https://github.com/0815games/0815games.github.io/pull/289) in den
  Merge-Commit `6c835f8a1e5cb8e9c836141324fb0ef699f5bfdd` übernommen. Der
  [Pages-Lauf 43831291036](https://github.com/0815games/0815games.github.io/actions/runs/43831291036)
  bestand; das öffentliche Manifest meldet `20261031-patch3`.
- **Prüfung und Wiederöffnung:** Der
  [PR-CI-Lauf 43830084162](https://github.com/0815games/0815games.github.io/actions/runs/43830084162)
  und der [Main-CI-Lauf 43831291548](https://github.com/0815games/0815games.github.io/actions/runs/43831291548)
  bestanden. Der Betreiber meldete, dass der Admin-Schalter über ein anderes
  Netz oder Gerät bedienbar war; danach zeigte der öffentliche Status `open`
  mit einem neuen Cutoff. Der zehnsekündige Timeout auf dem ersten Weg ist
  nicht abschließend erklärt. Eine echte Mehrgeräte- und Speicherabnahme steht
  noch aus.
  Für den Release wurden keine produktiven Firebase-Rules oder Spieldaten
  geändert; die Wiederöffnung änderte den vorgesehenen Wartungsstatus.
- **Zum Testen – Multiplayer:** Mit zwei bis vier Geräten eigene und fremde
  Türme bauen und verbessern, Preise/Vorräte vergleichen, Wellen durchspielen
  und Wellen- sowie 2×-Anfragen von Gästen annehmen und ablehnen. Das mittige
  Hinweisfenster soll Anfragen anzeigen; „Später“ beantwortet sie nicht. Nach
  einem Verbindungsabbruch alte Anfragen und die Wiederverbindung beobachten.
- **Zum Testen – Abschluss:** Nach abgeschlossenen Wellen soll der Host den
  Einsatz beenden; alle Spieler sollen ihren Bericht und bestätigte Rewards
  erhalten. Der Bericht lässt sich im Kommandozentrum erneut öffnen. Die
  Feldabmeldung bietet während einer Hostpartie Warten, Abbrechen oder nach
  Warnung sofortiges Abmelden. Sofortiges Abmelden kann eine unvollständige
  Gruppe und unbestätigte Belohnungen zurücklassen.
- **Zum Testen – Freunde und Tutorial:** Freundschaftsanfrage, Annahme,
  Einladung, Beitritt und Verlassen prüfen. Leere Anfragebereiche werden
  ausgeblendet; bei unlesbaren oder ungültigen Freundesbildern erscheint ein
  neutraler Platzhalter. Training abbrechen und einer Gruppe beitreten: Der
  alte Coach darf nicht in die Mehrspielerpartie hinein erscheinen.
- **Vorsicht / offen:** Charakterlöschung entfernt Fortschritt; nur mit einem
  entbehrlichen Testcharakter prüfen. Die Porträt-Reads sind nur als lokaler
  Rules-Kandidat geprüft und nicht produktiv freigegeben. Eindeutige Namen,
  die weiteren Blöcke und echte Geräte-/Langzeittests bleiben offen. Dauerhaft
  abwesende Mitglieder können das sichere Schließen der Party blockieren.
- **Protokollstand:** Dieser nachträgliche Dokumentationseintrag liegt auf dem
  neuen Arbeitsbranch zunächst lokal/uncommittet und ist noch nicht selbst
  öffentlich ausgeliefert. Frühere Angaben „lokal“ beschreiben ihren damaligen
  Stand; die zugehörigen Änderungen wurden mit PR #289 veröffentlicht.

## IPL-0029 – Nutzerfeedback und Übersicht der Patchblöcke

- **Feedback:** Der Betreiber lobte den Bericht am Schluss. Dieses positive
  Feedback ersetzt für sich genommen weder eine vollständige Geräte-,
  Mehrspieler- oder Speicherabnahme noch die noch offenen Erweiterungen des
  Berichts wie Rangabzeichen, Beförderung und „What’s Next“.
- **Übersicht:** Auf Wunsch des Betreibers enthält `PATCH-BLOECKE.md` eine
  Schnellübersicht über alle sechs Originalblöcke mit bereits veröffentlichten
  Teilfunktionen und konkreten offenen Anforderungen. Das zusätzliche Lebens- /
  Angriffssystem bleibt als separates vorgeschlagenes Vorhaben aufgeführt.
  Einzelne überholte Aussagen zu #289, Wartung und CI wurden korrigiert, ohne
  frühere Leistungen oder offene Kriterien zu streichen. `AGENTS.md` hält fest,
  dass die Übersicht bei Fortschritt und Nutzerfeedback aktuell bleiben soll.
- **Prüfung / Stand:** `git diff --check` bestand; 46 lokale Dateiziele und
  52 Markdown-Anker sowie die sechs Übersichtseinträge, Originalblöcke 1–6 und
  Zusätze A–E/7 wurden geprüft. Nur Dokumentation, kein Spielcode und keine
  produktive Schaltung. Die Änderungen liegen auf
  `arena/aada8412-0815games-github-io` lokal/uncommittet und sollen bei der
  nächsten sinnvollen Veröffentlichung mitgenommen werden; sie sind nicht
  schon öffentlich ausgeliefert.

## IPL-0030 – Feldnotizen im Spiel und Block 7 als künftiger Patch

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; abgefragte
  Umgebungsuhr 2026-11-16 UTC. Branch `arena/aada8412-0815games-github-io`,
  Basis `6c835f8a1e5cb8e9c836141324fb0ef699f5bfdd`; Stand dieses Eintrags
  lokal; mit Commit „Block 2: eindeutige Soldatennamen fuer neue Charaktere (A1)“ eingestellt und als PR #293 zur Abnahme vorgelegt.
- **Auftrag:** Der Betreiber möchte den Patchlog mit dem Spiel verknüpfen: „Dann
  könnte man es da anschauen was gemacht wurde und was noch ansteht in Zukunft.“
  Zusätzlich soll Block 7 (Leben, Gegenangriffe, Reparaturen) als künftiger
  Patch in den Plan aufgenommen werden, um daran entlangzuarbeiten.
- **Änderungen / Dateien:** Neu `patch-notes.mjs` (Daten und Ansicht),
  `patch-notes.css` (eigene Cache-Revision `20261031-notes1`) und
  `tests/patch-notes.test.mjs`. In `index.html` ein Dialog `#patchNotes` mit
  zwei Reitern (*Veröffentlicht*, *Was als Nächstes kommt*) sowie der Eintrag
  `FELDNOTIZEN` in der Utility-Zeile der Kommandozentrale. `account.js` baut die
  Ansicht, bindet Menüknopf, Backdrop und Sprachwechsel. `localization-de.mjs`
  erhielt sechs neue deutsche Zeichenketten. `tests/multiplayer-build-stamp.test.mjs`
  führt `patch-notes.mjs` in der Cache-Welle.
- **Inhalt der Ansicht:** Der Reiter *Veröffentlicht* listet die vier
  ausgelieferten Releases mit Build bzw. Pull-Request (#289 `20261031-patch3`,
  #288 `20261031-update3`, #287 `20261031-update2`, #286 ohne Manifest – die
  Datei existierte in diesem Commit nach GitHub-Abfrage noch nicht) und markiert
  den laufenden Build. Der Reiter *Was als Nächstes kommt* zeigt die Blöcke 1–6
  und neu **Block 7** in der vereinbarten Reihenfolge, jeweils mit bereits
  veröffentlichten und offenen Punkten. Der installierte Build wird aus dem
  `<meta name="ironpath-build">` der Seite gelesen, nicht geraten.
- **Block 7 im Plan:** `PATCH-BLOECKE.md` erhielt den Abschnitt
  „Kommende Patches – Reihenfolge“; Block 7 ist darin als künftiger Patch
  Nr. 7 nach Block 6 eingeplant und in Abschnitt 7 entsprechend überschrieben.
  Die Werte in Abschnitt E bleiben ausdrücklich ungetestete Startvorschläge,
  und es gilt weiterhin kein dauerhafter Verlust von Fortschritt, Ausrüstung
  oder Skillpunkten.
- **Prüfungen:** `node --test IronPath/tests/patch-notes.test.mjs` bestand
  **7/7**. Der vollständige serielle Lauf `node --test IronPath/tests/*.test.mjs`
  bestand **1000/1001** (1 absichtlich übersprungen, 0 fehlgeschlagen) nach den
  Änderungen. Gezielt erneut bestanden: `dom-contract`,
  `translation-coverage`, `multiplayer-build-stamp`, `command-center`,
  `command-redesign`, `release-stage-version`, `build-stamp`, `features`
  (**26/26**). Syntaxprüfung von `account.js` und `patch-notes.mjs` mit
  `node --check`; keine doppelten IDs in `index.html`; alle 17 echten
  `<dialog>`-Elemente geschlossen.
- **Grenzen:** Reine Leseansicht – kein Firebasezugriff, kein Spielzustand,
  keine produktive Schaltung, keine Rules- oder Datenänderung. Die Einträge
  werden von Hand gepflegt und sind nicht aus Git erzeugt. Die Playwright-/
  Chromium-Browserfälle wurden in dieser Umgebung **nicht** ausgeführt (kein
  Browser und keine Testabhängigkeiten vorhanden); die neue Oberfläche ist
  damit nicht im Browser abgenommen. Echte Geräteprüfung bleibt offen.
- **Git / PR / Release:** Kein neuer Commit, Push, PR, CI-Lauf, Merge,
  Deployment oder Wartungsschalter. Die Änderungen liegen lokal/uncommittet und
  sollen mit der nächsten sinnvollen Veröffentlichung mitgenommen werden.

## IPL-0031 – Nachtrag: offener Feldnotizen-Dialog blockierte das Spiel, CSS-Fix

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; abgefragte
  Umgebungsuhr 2026-11-16 UTC. Branch `arena/aada8412-0815games-github-io`.
- **Befund aus CI:** Nach dem Commit `231de4a1` schlugen in
  [PR #290](https://github.com/0815games/0815games.github.io/pull/290) alle neun
  Browserjobs fehl ([Lauf 43850674154](https://github.com/0815games/0815games.github.io/actions/runs/43850674154));
  `database-rules` und `game-regressions` bestanden. Die Meldung lautete, dass
  ein Unterelement des Dialogs `#patchNotes` Zeigerereignisse abfängt – der
  Dialog lag damit dauerhaft über dem Spiel.
- **Ursache:** Ein geschlossenes `<dialog>`-Element wird durch eine
  **Browserregel** (`display:none`) verborgen. Eine Autorenregel mit `display`
  überschreibt sie: `patch-notes.css` setzte `.patch-notes{…display:flex}`
  ohne Einschränkung, also auch im geschlossenen Zustand. Die lokale
  Node-Testsuite kann das nicht sehen; die Chromium-Fälle haben es gefunden.
- **Korrektur:** `display` gilt nur noch im offenen Zustand
  (`.patch-notes[open]{display:flex;flex-direction:column}`).
  `tests/patch-notes.test.mjs` erhielt einen Wächter (Fall 8/8): jede
  `display`-Regel, deren Ziel der Dialog selbst ist, muss auf `[open]` oder
  `::backdrop` eingeschränkt sein.
- **Grenzen:** Die Chromium-Fälle konnten in dieser Umgebung nicht lokal
  ausgeführt werden (kein Browser, keine Testabhängigkeiten); der Nachweis
  stammt ausschließlich aus der GitHub-CI. Die Korrektur wird daher erst nach
  einem grünen CI-Lauf als bestätigt dokumentiert.

## IPL-0032 – Merge #290, Pages-Auslieferung und ein roter Browserfall auf main

- **Veröffentlicht:** Commit `231de4a1` (Feldnotizen und Block 7) und Commit
  `dd99aa75` (CSS-Fix) wurden mit
  [PR #290](https://github.com/0815games/0815games.github.io/pull/290) in den
  Merge-Commit `e25ce9b919532d79624d1ad0d95b841ea1297183` übernommen. Die
  [PR-CI 43851953343](https://github.com/0815games/0815games.github.io/actions/runs/43851953343)
  bestand danach vollständig, alle neun Browserjobs eingeschlossen. Der
  [Pages-Lauf 43853201138](https://github.com/0815games/0815games.github.io/actions/runs/43853201138)
  war erfolgreich; das öffentliche Manifest meldet weiterhin `20261031-patch3`.
- **Roter Lauf auf main:** Der anschließende
  [Main-Lauf 43853202901](https://github.com/0815games/0815games.github.io/actions/runs/43853202901)
  schlug in genau einem Job fehl: `interface-browser-smoke` in
  `browser-tests/multiplayer-field.cjs`, Schritt „landscape still selects the
  correct tower“ – ein Tap auf einen Turmplatz direkt nach der Drehung des
  Fensters. Alle übrigen zehn Jobs bestanden, und derselbe Code hatte in den
  beiden Läufen des PR-Zweigs zuvor bestanden.
- **Einordnung:** Der Fall hängt an der Projektion eines Klicks auf die
  Leinwand, die nach einer Größenänderung einen Frame Zeit braucht. Er ist
  damit zeitabhängig, nicht durch die Feldnotizen verursacht: `patch-notes.css`
  und `patch-notes.mjs` werden in diesem Fall nicht geladen (das Skript
  entfernt alle `<script>`-Tags und lädt nur `game.js`).
- **Nachbesserung (lokal/uncommittet zum Zeitpunkt dieses Eintrags):**
  `tapPad` wartet jetzt zwei Frames und wiederholt die Messung und den Tap
  genau einmal, wenn sich das Turmmenü nicht öffnet. Ein echter
  Projektionsfehler fällt weiterhin auf, ein Messfehler beim Drehen nicht mehr.
  Der Nachweis steht und fällt mit der nächsten CI; in dieser Umgebung kann der
  Chromium-Fall nicht lokal ausgeführt werden.

## IPL-0033 – Veröffentlicht: Abschluss, öffentlicher Status und nächster Schritt

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; abgefragte
  Umgebungsuhr 2026-11-16 UTC. Branch `arena/aada8412-0815games-github-io`;
  dieser Nachtrag lag beim Schreiben lokal; mit Commit „Block 2: eindeutige Soldatennamen fuer neue Charaktere (A1)“ eingestellt und als PR #293 zur Abnahme vorgelegt.
- **Veröffentlicht:** [PR #291](https://github.com/0815games/0815games.github.io/pull/291)
  (Commit `959a2a86`, die Absicherung des Browserfalls) wurde in den Merge-Commit
  `17934f06da63e45cfc703f53572ca8fe21b07d39` übernommen. Die
  [PR-CI 43854588244](https://github.com/0815games/0815games.github.io/actions/runs/43854588244)
  bestand vollständig, der
  [Main-Lauf 43856176548](https://github.com/0815games/0815games.github.io/actions/runs/43856176548)
  bestand anschließend mit allen elf Jobs, und der
  [Pages-Lauf 43856175915](https://github.com/0815games/0815games.github.io/actions/runs/43856175915)
  war erfolgreich. Damit ist der in IPL-0032 beschriebene rote Lauf auf `main`
  durch eine grüne Wiederholung ersetzt, nicht nur beschwichtigt.
- **Öffentlich geprüft:** Das Manifest meldet weiterhin `20261031-patch3`, die
  neue Datei `patch-notes.mjs` wird über Pages ausgeliefert, und der
  Wartungsstatus wurde erneut als `open` mit unverändertem Cutoff abgefragt –
  ein Schaltvorgang war nicht beauftragt und hat nicht stattgefunden.
- **Zum Testen:** In der Kommandozentrale unten **FELDNOTIZEN** antippen. Im
  Reiter *Veröffentlicht* muss die Karte mit `20261031-patch3` als **LIVE**
  markiert sein; der Reiter *Was als Nächstes kommt* muss sieben Karten zeigen,
  beginnend mit „Block 1 · Mehrspieler / IN ARBEIT“ und endend mit „Block 7 ·
  Leben, Gegenangriffe und Reparaturen / GEPLANT“. Beim Wechsel der Sprache
  müssen alle Texte umschalten. Danach wie gewohnt prüfen, dass sich das Spiel
  wie vorher bedienen lässt: Karte, Türme, Wellen und Mehrspieler.
- **Offen:** Echte Geräte- und Mehrspielerabnahme weiterhin nicht erledigt; die
  Chromium-Fälle sind Emulator- und Testbrowser-Läufe. Block 7 bleibt ein
  künftiger Patch mit ungetesteten Startwerten. Die nächste fachliche Arbeit
  folgt der im Patchplan festgehaltenen Reihenfolge, also zuerst Block 1.

## IPL-0037 – Block 2: die nötigen neuen Regeln vorbereitet (nicht veröffentlicht)

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-16 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/75f7207f-0815games-github-io`,
  nach den Merges von #295 und #296 (Main `3c4a069`, danach #296).
- **Auftrag:** „Mach Block 2 fertig, dann die nötigen neuen regeln.“
  Übersetzung: erst die Restarbeit an Block 2, danach die Regeln, die Block 2
  braucht — **vorbereitet**, nicht veröffentlicht. Die Veröffentlichung bleibt
  an frischen Export, Sicherung, Vergleich und separate Freigabe gebunden.
- **Restarbeit an Block 2 (A2):** Der offene Untersuchungspunkt ist abgearbeitet.
  Befund: ein abgebrochener oder doppelt gesendeter Fall war bereits geprüft
  (kein Scheinerfolg, Markierung bleibt). Neu geprüft sind zwei Fälle der
  Ebene darüber (`tests/friends-session-changes.test.mjs`): Ein Kontowechsel
  mitten in einer laufenden Aktion behauptet keinen Erfolg und klemmt den
  Dialog nicht fest; ein verspäteter Rückruf des Kontos, das sich abgemeldet
  hat, kann die Anzeige des Kontos nicht überschreiben, das gekommen ist.
  Beide Gegenproben sind mitgeführt (ohne die Prüfung nach dem Schreiben
  behauptet der Dialog „angenommen“). **Kein Fehler gefunden** — die Fälle
  sind jetzt nur festgenagelt. Offen bleibt die Abnahme mit echten Geräten.
- **Die Regeln — Zusammensetzung:** `character-name-candidate.mjs` und
  `friend-portrait-candidate.mjs` geben ihre Regeln jetzt als
  `applyCharacterNameRules()` / `applyFriendPortraitRules()` heraus; neu ist
  `firebase/block2-rules-candidate.mjs`, das beides auf eine **übergebene**
  Basis anwendet. Damit gibt es eine Quelle pro Regelblock, und der Builder
  nimmt auch einen frischen Export statt des Repository-Standes.
- **Eingestellt:** `workshop.complete.draft.rules.json` enthält jetzt den
  Namensindex und die beiden Porträt-Leserechte. Streng additiv: 6 Pfade neu,
  4 um je ein Leserecht ergänzt, **nichts entfernt oder gelockert** (Vergleich
  mit `pre-block2.complete.draft.rules.json`, die den Stand davor bewahrt und
  als Basis für den Emulator-Lauf „ohne Index“ dient).
- **Warum die Basis ein Argument ist:** Zwei Regelwerke im Repository
  widersprechen sich in vier Pfaden (`friendCodes`, `friendOutgoing`,
  `friendPresence`, `friendPrivate`): die festgenagelte Referenz und der
  eingestellte Entwurf. Welcher live gilt, kann nur ein frischer Export sagen.
  Der Kandidat baut auf dem eingestellten Entwurf auf, weil er der jüngere
  Stand ist, und entfernt daraus nichts. Für die Veröffentlichung ist der Weg
  über `block2-rules-candidate.mjs <frischer Export>` vorgesehen.
- **Prüfungen:** vollständige lokale Testsuite 1021 bestanden, 0 fehlgeschlagen;
  Publish-Trockenlauf 9/9; die Emulatorläufe (`test:character-names` mit und
  ohne Index, `test:friend-portraits` gegen Referenz, Guard **und
  eingestellten Entwurf**) sind ergänzt bzw. umgestellt und werden in CI
  geprüft — lokal ist kein Emulator startbar (kein Java).
- **Übergabe:** `firebase/BLOCK2-RULES-HANDOVER.md` nennt die beiden Blöcke,
  die Prüfungen und die fünf Schritte vor dem Veröffentlichen.
- **Grenzen:** Nicht veröffentlicht. Ohne frischen Export ist **nicht**
  bewiesen, dass der Kandidat dem Live-Stand entspricht. Nach der
  Veröffentlichung bleiben Alt-Duplikate unberührt; eine Umbenennung braucht
  eine eigene Regeländerung (`players/$uid/name` ist heute unveränderlich).

## IPL-0035 – Block 2 / A1: verwaiste Reservierungen, Namensverzeichnis geschlossen

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-16 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/85658107-0815games-github-io`,
  nach dem Merge von PR #293 (Main `af64f27`).
- **Auftrag:** „Mergen und nächster Punkt.“ PR #293 wurde gemergt; als
  nächster offener Punkt aus A1 folgte der Lebenszyklus der Reservierung:
  verwaiste und unbestätigte Einträge.
- **Problem:** Eine Reservierung wird **vor** dem Charakter angelegt und nur
  dann zurückgegeben, wenn die Erstellung danach scheitert. Bricht die
  Erstellung ab (Tab geschlossen, Netz weg) oder wird der Charakter in einer
  **anderen Sitzung** gelöscht, bleibt der Eintrag stehen und blockiert den
  Namen dauerhaft – ohne dass irgendein Konto ihn noch freigeben könnte.
- **Entscheidung – zwei Bedingungen, nie eine allein:** Übernommen werden darf
  ein Eintrag erst, wenn der Inhaber **keinen Charakter** hat **und** der
  Eintrag **älter als die Schutzfrist** ist.
  - *Nur „kein Charakter“:* eine laufende Erstellung sieht für einige Sekunden
    genauso aus. Ein zweites Konto könnte den Namen mitten im Anlegen
    übernehmen, beide Profile entstehen – genau das Duplikat, das der Index
    verhindern soll.
  - *Nur „alt“:* ein Charakter, der seit Monaten spielt, ist nicht verwaist,
    egal wie alt sein Eintrag aussieht.
  Gemessen wird mit der **Serveruhr** (`now` in den Rules), nicht mit der des
  Clients. Die Frist steht als eine Konstante
  (`CHARACTER_NAME_RESERVATION_GRACE_MS`, **Vorschlag: 6 Stunden, nicht
  freigegeben**) in `character-name.mjs` und wird von dort in den
  Rules-Kandidaten eingesetzt; der Client hält keine eigene Kopie.
  Ein Eintrag **ohne verwertbaren Zeitstempel** bleibt geschützt: er ist nicht
  von einer laufenden Erstellung zu unterscheiden.
- **Wer entscheidet:** allein die Rules. `players/<uid>` ist nur für den
  Inhaber lesbar, ein fremder Client kann Verwaisung also nicht feststellen.
  Der Client versucht das Schreiben und liest die Antwort. Wichtig: eine
  Ablehnung an dieser Stelle heißt **„vergeben“**, nicht „nicht unterstützt“ –
  Letzteres hätte den Spieler in ein Duplikat geschickt. „Nicht unterstützt“
  bleibt dem Fall vorbehalten, dass schon das Lesen des Index scheitert.
- **Namensverzeichnis geschlossen (eigener Befund):** Der Kandidat erlaubte
  mit `.read: auth != null` am Wurzelknoten das Lesen des **kompletten**
  Verzeichnisses – jedes angemeldete Konto hätte alle Namen aller Spieler
  abrufen können. Jetzt ist nur ein einzelner Schlüssel lesbar; die Prüfung
  „einen Namen nachschlagen“ funktioniert weiter. Dass ein tieferes Leserecht
  trotz `false` darüber gilt, ist dieselbe Regel, auf der `friendNames` heute
  beruht. Der Emulatorlauf prüft **beide** Richtungen (ganzes Verzeichnis
  abgelehnt, ein Schlüssel erlaubt) – nur eine Richtung zu prüfen hätte den
  Fehler wieder verdeckt.
- **Vierte Lektion derselben Art (CI):** Nach dem Einführen des Pflichtfelds
  `at` schlugen die Bestandsfälle des Emulatortests fehl, weil sie noch ohne
  Zeitstempel schrieben — und die Ablehnungsfälle wären **grün geblieben**, nur
  eben aus dem falschen Grund („kein Zeitstempel" statt „gefälschte UID"). Die
  Nutzlasten tragen jetzt einen gültigen Zeitstempel, damit jeder Fall für den
  Grund scheitert, den sein Kommentar nennt; ein eigener Fall prüft „kein
  Zeitstempel" ausdrücklich. Gemerkt: nach jeder Verschärfung der
  Eintragsform sind die alten Ablehnungsfälle neu zu prüfen.
- **Nebenbei:** `refused()` erkennt jetzt auch die Formulierung der
  Client-Bibliothek für eine abgelehnte **Transaktion** („Client doesn't have
  permission to access the desired data.“); drei Schreibweisen sind durch Tests
  festgenagelt. Unbekannte Fehler bleiben Fehler.
- **Änderungen / Dateien:** `character-name.mjs` (Konstante),
  `character-name-claim.mjs` (Zeitstempel im Eintrag, Übernahmeversuch,
  Abrufergebnis `reclaimed`), `firebase/character-name-candidate.mjs`
  (`at`-Feld, Übernahmeregel, kein Lesen des Gesamtverzeichnisses),
  `tests/character-name.test.mjs`, `firebase/rules-test/character-name.test.mjs`.
  **Cache:** lokaler Schlüssel `20261031-patch3` → `20261031-patch4`, weil sich
  Browser-Module geändert haben (PR #293 hatte sie ohne Stempelwechsel
  ausgeliefert; ein alter Cache hätte die neuen Module sonst behalten).
- **Prüfungen:** `tests/character-name.test.mjs` 13/13; vollständiger serieller
  Lauf 1015 bestanden, 1 absichtlich übersprungen, 0 fehlgeschlagen;
  Versions-/Cachekettentests 19/19; Rules-Publish-Trockenlauf 9/9. Die
  Emulatorfälle (Übernahme verwaister/frischer/lebender Einträge, Eintrag ohne
  Zeitstempel, Gesamtverzeichnis) sind ergänzt und werden in CI geprüft.
- **Grenzen:** All dies wirkt erst mit veröffentlichten Rules. Bis dahin bleibt
  ein verwaister Eintrag stehen – der Name ist dann blockiert, nicht doppelt
  vergeben, das ist die sichere Richtung. Die Attrappe im Unit-Test bildet die
  Rules **nach**; sie beweist die Client-Logik, nicht die Regel. Die Schutzfrist
  ist ein Vorschlag. Umbenennung (eigene Rules-Änderung, weil
  `players/<uid>/name` heute unveränderlich ist) und Alt-Duplikate bleiben
  offen.

## IPL-0039 – Block 3 / A: Party-Roster als Karten

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/422699c8-0815games-github-io`,
  Basis `b3dd1a2` (Main nach dem Merge von #298).
- **Auftrag:** „Oke. Weiter." Block 2 ist bis auf die Veröffentlichung (die
  einen frischen Export braucht) und die Abnahme auf echten Geräten fertig,
  also der nächste Punkt der Reihe: Block 3 · Oberfläche.
- **Was gebaut wurde:** Das Party-Roster war eine Textzeile pro Soldat
  („Cara · Host · Team A · Bereit"). Es sind jetzt vier Karten: Portrait, Name,
  Rang mit Abzeichen, Rolle und Bereitschaft.
- **Rang:** Aus dem veröffentlichten Level abgeleitet und nie gespeichert
  (`rank-insignia.mjs`, PR #284). Ein fehlendes oder unlesbares Level zeigt den
  niedrigsten Rang und erfindet keinen.
- **Bereitschaft:** gefüllter Punkt für „bereit", hohler für „nicht bereit".
  Bewusst nicht über eine Farbe allein, damit die Aussage in beiden Themes und
  bei Farbfehlsichtigkeit erhalten bleibt.
- **Layout:** Zwei Spalten, wo das Panel breit genug ist, sonst eine
  (`repeat(auto-fit,minmax(150px,1fr))`). Leere Plätze bleiben als leerer Platz
  sichtbar und werden nicht als Soldat verkleidet.
- **Portraits:** WESSEN Gesicht eine Karte zeigen darf, entscheidet der Aufrufer,
  nicht das Panel (`portraitFor`). Das eigene kommt aus dem schon gerenderten
  Portrait, das eines Mitspielers live aus genau den zwei Profilfeldern, die die
  Block-2-Regeln freigeben. Solange die nicht veröffentlicht sind, wird das
  Lesen verweigert und die Karte zeigt den neutralen Platzhalter – dieselbe
  ehrliche Antwort, die die Freundesliste heute schon gibt.
- **Befund beim Bauen (CSS):** `.four-party-list li` ist eine Klasse plus ein
  Element und gewinnt damit gegen ein nacktes `.party-card` – die Karte hätte
  die zentrierte Ausrichtung der Zeile geerbt. Die Regel heißt deshalb
  `.party-roster .party-card`.
- **Befund beim Bauen (Cache):** `style.css` ist per Test an die
  Release-Welle (`release-version.json`) genagelt. Eine Änderung mitten in der
  Welle würde ein zurückkehrendes Browserfenster mit neuem Markup und alter CSS
  treffen. Das Layout liegt darum in `interface-redesign.css`, das eine eigene
  Cache-Welle trägt.
- **Übersetzung:** „Team {letter}" war der einzige neue String; er liegt jetzt
  im deutschen Wörterbuch (der Wächter in `translation-coverage.test.mjs`
  bestand darauf, zu Recht).
- **Änderungen / Dateien:** `firebase-four-panel.mjs` (Karten, Portrait-Wachen),
  `account.js` (Anschluss der Portraits), `index.html` (Klasse am Roster und
  neue Cache-Welle für `interface-redesign.css`), `interface-redesign.css`
  (Kartenlayout), `localization-de.mjs` (ein String),
  `tests/four-panel.test.mjs` (fünf neue Fälle, zwei umgestellte) und
  `tests/party-end-panel-race.test.mjs` (Dokument-Double trägt die
  Eigenschaften, die eine Karte braucht).
- **Prüfungen:** 27/27 in `four-panel.test.mjs`; vollständiger serieller Lauf
  1031 bestanden, 0 fehlgeschlagen. Die Browserläufe in CI (`multiplayer-browser`
  und `social-cleanup-browser`) suchen den Namen im Roster weiterhin als Text –
  die Karte schreibt ihn genau einmal, damit diese Suche eindeutig bleibt.
- **Grenzen:** Kein Mensch hat die Karten gesehen. Das Layout ist gerechnet,
  nicht geprüft; die Abnahme auf echten Geräten (Hochformat, kleine Displays)
  bleibt offen.

## IPL-0038 – Block 2 / A1: Umbenennung als Mechanismus (Regeln vorbereitet)

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/6fa854f3-0815games-github-io`,
  Basis `6fde2f8` (Main nach dem Merge von #297).
- **Auftrag:** „Export, lass uns Block 2 fertig machen. Bis auf meine Tests.“
  Ein Export lag nicht vor (keine Datei, kein Zugang), damit bleibt die
  Veröffentlichung, wo sie war. Der letzte Rest von Block 2, den ich bauen
  kann, war die Umbenennung.
- **Warum eine Umbenennung zu Block 2 gehört:** Sie ist der Ausweg aus dem
  Alt-Duplikat-Fall, den die Bestandsaufnahme zutage bringen wird: zwei Konten
  halten denselben Namen, eines behält ihn, das andere wählt neu. Ohne
  Mechanismus gäbe es nur „löschen und neu anlegen“ – mit Fortschrittsverlust.
- **Der Name steht an vier Stellen:** Profil (`players/<uid>/name`),
  Suchindex (`friendNames/<Schlüssel>/<uid>` plus
  `friendPrivate/<uid>/searchKey`), Freundescode (`friendCodes/<Code>/name`)
  und Namensreservierung (`characterNames/<Schlüssel>`).
- **Der Befund, der den Entwurf gekippt hat:** `root` in einer Regel ist der
  Datenstand **vor** dem Schreiben. Eine Regel sieht also nie, was ein Client
  im selben Mehrpfad-Zug mitbewegt. Bewiesen am eigenen Bestand: die
  Charakterlöschung schreibt Spieler und Bestenlisten in **einem** Zug, und die
  Bestenlisten-Regeln verlangen, dass der Spieler bei der Auswertung noch
  existiert – das funktioniert nur, wenn `root` der Stand davor ist.
  Entsprechend schreibt `friends.mjs` den Suchschlüssel und den Eintrag in
  **zwei** Schritten, nicht in einem.
- **Folge:** Die Regeln können nicht prüfen, dass die vier Stellen zueinander
  passen. Der erste Entwurf (ein Mehrpfad-Zug, Prüfung „der Eintrag unter dem
  aktuellen Suchschlüssel trägt schon den neuen Namen“) **hätte nie gegriffen**
  – er wäre immer abgelehnt worden. Verworfen, nicht abgeschwächt.
- **Was stattdessen gilt:** eine Bedingung, die keinen Widerspruch zulässt und
  die eine Regel prüfen KANN: **Ein Soldat, der im Suchindex steht, kann seinen
  Namen nicht ändern.** Also: erst aus dem Index nehmen, dann umbenennen, dann
  unter dem neuen Namen neu veröffentlichen. Jeder Schritt einzeln geprüft,
  jeder Zwischenzustand einer, den das Spiel heute schon erzeugt und beim
  nächsten Konto-Laden selbst heilt.
- **Reihenfolge ist die Sicherheit:** (1) neuer Name reservieren – das ist der
  Schritt, den die Regeln verweigern, wenn ein anderes Konto ihn hält;
  (2) alten Eintrag entfernen; (3) Profilnamen ändern; (4) alten Namen
  freigeben – **zuletzt**, weil ihn zwischen „freigegeben“ und „umbenannt“ ein
  anderes Konto nehmen könnte; (5) unter dem neuen Namen neu veröffentlichen
  (Suchschlüssel, Eintrag, Freundescode).
- **Drei Regelergänzungen, alle als ODER** (nichts, was heute erlaubt ist, wird
  verboten): `players/$uid/name` darf sich ändern, solange der Soldat nicht im
  Index steht; `friendPrivate/$uid/searchKey` darf mitziehen, solange unter dem
  alten Schlüssel kein Eintrag liegt (heute kann er überhaupt nur einmal
  geschrieben werden – ein umbenannter Soldat wäre nie mehr auffindbar
  gewesen); `friendCodes/$code` darf vom Inhaber auf den eigenen aktuellen
  Profilnamen aufgefrischt werden (heute nur erzeugbar, nie erneuerbar).
- **Sichere Richtung:** Ohne die neuen Regeln ist der Name unveränderlich. Das
  Modul meldet „nicht unterstützt“ und ändert **nichts** – statt in einen Namen
  zu wechseln, den niemand geprüft hat. Auch eine halbe Antwort des Index
  (lesbar, aber ohne Eintrag) gilt nicht als „frei“. Ein abgebrochener Schritt
  lässt den Soldaten unauffindbar, nie unter einem fremden Namen findbar; ein
  teilweise geglückter Ablauf wird als solcher gemeldet und nicht als Erfolg
  ausgegeben.
- **Bewusst offen:** wer umbenennen darf, wann, wie oft und über welchen
  Einstiegspunkt im Spiel, ist eine Nutzerentscheidung **nach** der
  Bestandsaufnahme. Darum hat das Modul absichtlich noch keine Schaltfläche.
- **Grenze, nicht still „repariert“:** bestehende Freundschaften, offene
  Anfragen und Bestenlisten-Einträge behalten den Namen vom Zeitpunkt ihres
  Schreibens. Ein manipulierter Client, der den Namen ändert, ohne vorher zu
  reservieren, bleibt möglich – die Regeln können nicht hashen; dieselbe
  Grenze, die der Index insgesamt hat.
- **Änderungen / Dateien:** neu `character-rename.mjs` (Ablauf statt eines
  Zugs) und `firebase/character-rename-candidate.mjs` (drei ODER-Regeln, jeder
  Wächter prüft die Referenzregel); `firebase/block2-rules-candidate.mjs`
  nimmt den Umbenenn-Block auf und hat eine eindeutige Kommandozeile (Basis und
  Ausgabe als Argumente, Standardbasis ist der Stand vor Block 2 – am schon
  zusammengesetzten Entwurf schlagen die Wächter zu Recht an); neu
  `tests/character-rename.test.mjs` (7 Fälle, prüft auch die Reihenfolge);
  Emulatorfälle für Umbenennung, Kollision, „nur im Index stehend verweigert“
  und „ohne die Regeln“ ergänzt; der eingestellte Entwurf neu gebaut.
- **Prüfungen:** 7/7 neue Einzelfälle, vollständiger serieller Lauf 1027
  bestanden, 0 fehlgeschlagen; Publish-Trockenlauf 9/9. Die Emulatorfälle sind
  der eigentliche Nachweis und laufen in CI.

## IPL-0036 – Block 2 / A2: Suchindex nach Rückkehr der Verbindung erneut versuchen

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-16 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Neuer Branch `arena/75f7207f-0815games-github-io`,
  Basis `af64f27` (Main nach dem Merge von PR #293). Die Arbeit aus PR #294
  (verwaiste Reservierungen) liegt auf dem vorherigen Branch und ist hier nicht
  enthalten.
- **Auftrag:** „Weiter, wann ist Block 2 fertig?“ Als nächster Punkt, den ich
  ohne Freigabe oder echte Geräte abarbeiten kann, folgte aus A2 das
  Untersuchungspaket: Online-/Offline-Status, mehrere Tabs, Konto-/
  Charakterwechsel, erneute Anmeldung, fehlgeschlagene Suchindex-Erstellung,
  Einladungen sowie abgebrochene und doppelt gesendete Anfragen.
- **Befund (Bestand):** Eine fehlgeschlagene Veröffentlichung des Suchindex wird
  dreimal leise wiederholt (30 s, 60 s, 120 s); erst danach erscheint eine
  Meldung, und die steht **im Freunde-Dialog** — bewusst, weil sie früher als
  Balken dauerhaft über Kommandozentrale und jedem Gefecht hing (gemeldet).
- **Lücke:** Genau diese Platzierung erzeugt einen blinden Fleck. Wer den
  Freunde-Dialog nie öffnet, sieht die Meldung nie. Ein Gerät, das beim
  Synchronisieren offline war, blieb damit dauerhaft unauffindbar — und nichts
  sagte es dem Spieler. Auch Öffnen des Dialogs heilt das nur, wenn der Spieler
  ihn öffnet.
- **Änderung:** Der Client beobachtet den Verbindungsstatus
  (`.info/connected`, dasselbe Muster wie in `friend-presence.mjs`) und
  wiederholt einen **fehlgeschlagenen** Versuch **einmal**, sobald die
  Verbindung zurück ist. Leitplanken: nur nach einem Fehlschlag, nie während
  ein Versuch läuft, und ein Erfolg vergisst den Fehlschlag — sonst würde jeder
  Tab bei jeder Rückkehr schreiben. Abmelden und Charakterlöschung hängen den
  Beobachter ab.
- **Änderungen / Dateien:** `friends-ui.mjs` (Beobachter, Fehlermerker,
  Abmelden) und `tests/friends-index-reconnect.test.mjs` (neu); die
  Quelltext-Prüfungen in `tests/friends-index-notice.test.mjs` sind um den
  Rückweg ergänzt. **Cache:** lokaler Schlüssel `20261031-patch3` →
  `20261031-patch4` (dieselben Zeilen wie in PR #294, damit beide Wege
  zusammengeführt werden können).
- **Prüfungen:** neue Fälle 3/3 und Quelltextfälle 2/2; vollständiger serieller
  Lauf 1015 bestanden, 1 absichtlich übersprungen, 0 fehlgeschlagen;
  Versions-/Cachekettentests 19/19. **Gegenprobe:** mit entferntem Rückweg
  schlagen die beiden neuen Fälle fehl — sie behaupten also etwas. Beim ersten
  Anlauf hängte die Suite statt zu scheitern, weil ein Anwesenheits-Intervall
  nach einer fehlgeschlagenen Prüfung weiterlief; das Aufräumen hängt jetzt an
  `t.after`.
- **Grenzen:** Der Verbindungswechsel ist synthetisch. Echte Netzwechsel, die
  Firebase-Offline-Warteschlange, Zeitlimits und ein Wiedereinstieg mitten in
  einem laufenden Schreibvorgang sind damit nicht abgenommen.

## IPL-0034 – Block 2: eindeutige Soldatennamen für neue Charaktere

Korrektur nach dem ersten CI-Lauf (PR #293):

- **Regulaerer Ausdruck war wirkungslos.** `characterNames` pruefte den Schluessel mit einer nicht erfassenden Gruppe `(?:...)`. Firebase wertet Regex mit RE2 aus, das diese Schreibweise nicht kennt; der Ausdruck passte auf nichts, also scheiterten **jeder** Lese- und Schreibzugriff. Die `assertFails`-Pruefungen liefen deshalb erfolgreich — aus dem falschen Grund. Behoben: dieselbe Schreibweise wie beim veroeffentlichten `friendNames` (`([a-f0-9]{2}){1,96}`), und der Emulatortest prueft jetzt den Positivfall (Schreiben als Alice) **vor** den Ablehnungsfaellen, damit eine Regel, die alles blockiert, auffaellt.
- **Eintrag nahm Zusatzfelder an.** `hasChildren(['uid','name'])` prueft nur, dass beide Felder vorhanden sind, nicht dass sonst nichts drinsteht. Der Emulator akzeptierte `xp: 999999`. Behoben mit `$other: {".validate": false}` — demselben Muster, das `players` im Referenzstand nutzt.
- **Dabei der naechste Fehler derselben Art:** `$other` trifft jedes **nicht benannte** Kind. `uid` und `name` standen nur in der `.validate`-Zeile des Elternknotens, waren also nicht benannt — `$other` blockierte damit wieder alles. Behoben, indem `uid` und `name` als eigene Knoten **vor** `$other` stehen, genau wie `name`/`gender`/`xp` bei `players`. Der Emulatortest prueft daher in jedem Anlauf zuerst ein Schreiben, das gelingen muss.
- **Der Emulator beantwortet die ersten Anfragen, bevor die hochgeladenen Regeln wirken.** In diesem Fenster wird **alles** abgelehnt — Lese- wie Schreibzugriffe. Das sah aus wie ein dritter Regelfehler, war aber keiner: Test 1 und 2 liefen in das Fenster, Test 3 danach war gruen. Behoben durch ein Startfenster-Warten in `before()`: gelesen wird ein Pfad, den **beide** Regelstaende erlauben (`players/<uid>` fuer das eigene Konto), und die Anzahl der Versuche steht im Protokoll. Ein Rueckfall, der „abgelehnt" als Regelfehler liest, waere hier in eine Endlosschleife gelaufen.
- Diagnose-Hilfen eingebaut: der Emulatortest protokolliert jeden Lese-, Schreib- und Transaktionszugriff mit Code und Meldung, bevor er vergleicht; der Workflow schreibt die vollstaendige Ausgabe in die Job-Zusammenfassung (der `gh`-Logabruf ist in der Sandbox nicht moeglich); `tests/character-name.test.mjs` nagelt die beiden Regelfehler fest.

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum 2026-10-31 UTC; abgefragte
  Umgebungsuhr 2026-11-16 UTC. Branch `arena/85658107-0815games-github-io`,
  Basis `0061441b3042195cd24bc1ba6e187bdc88f9b2e4`; Stand dieses Eintrags
  lokal; mit Commit „Block 2: eindeutige Soldatennamen fuer neue Charaktere (A1)“ eingestellt und als PR #293 zur Abnahme vorgelegt.
- **Auftrag:** „Weiter mit den Patch Blöcken. Soll mal was passieren.“ Die
  Reihenfolge im Plan nennt Block 2 als Nächstes; dort ist A1 (kein doppelter
  Charaktername) der am besten abgrenzbare Teil.
- **Namensregel (neu, eine Stelle):** `character-name.mjs` mit
  `NFC_LOWERCASE_V1`: äußere ECMAScript-Leerzeichen entfernen, NFC,
  Kleinschreibung, NFC. Anzeige bleibt wie eingegeben. Dieselbe Funktion
  erzeugt jetzt auch den Freundes-Suchschlüssel (`friends.mjs`), damit ein Name
  nicht unter einem Schlüssel gefunden und unter einem anderen reserviert wird.
- **Reservierung (neu):** `character-name-claim.mjs` reserviert
  `characterNames/<Schlüssel>` **vor** dem Profil und gibt frei, wenn die
  Erstellung danach scheitert oder der Charakter gelöscht wird. Zwei Konten,
  die gleichzeitig denselben Namen wählen, erhalten höchstens einen Gewinner;
  der andere liest „Dieser Soldatenname ist bereits vergeben“. Kontowechsel
  während des Vorgangs wird abgelehnt, ein eigener Wiederholversuch gilt nicht
  als Konflikt.
- **Wichtige Grenze:** Die begleitenden Rules sind **nicht veröffentlicht**. Der
  Server kennt den Pfad heute nicht, deshalb meldet der Client `unsupported`,
  die Charaktererstellung läuft weiter wie bisher und prüft als Rückfall nur
  lesend den öffentlichen Freundes-Suchindex (bestmöglich). Eindeutigkeit für
  **neue** Namen ist damit erst mit den Rules serverseitig wirksam.
- **Rules-Kandidat:** `firebase/character-name-candidate.mjs` baut aus der
  gepinnten Referenz einen Kandidaten (ein Eintrag pro Schlüssel, nur mit
  eigener UID, Löschen nur durch den Inhaber). Er ist bewusst **nicht** in den
  veröffentlichbaren Kandidaten eingestellt; der vorhandene
  Veröffentlichungsschutz (`tests/rules-publish-dry-run.test.mjs`) hat das
  beim ersten Versuch zu Recht als Lücke gemeldet.
- **Prüfungen:** `node --test IronPath/tests/character-name.test.mjs` **10/10**;
  vollständiger serieller Lauf `node --test IronPath/tests/*.test.mjs`
  **1012 bestanden, 1 absichtlich übersprungen, 0 fehlgeschlagen**. Neu ist
  außerdem der gemeinsame Fallkatalog `firebase/name-policy-fixtures.json`:
  Spiel und Audit-Skript behaupten jeweils ihre Seite, einschließlich der
  gewollten Abweichung `Straße`/`STRASSE` (Audit strenger).
  `firebase/rules-test/character-name.test.mjs` (Datenbank-Emulator, zwei
  Läufe mit und ohne Index) und die Workflow-Stufe
  `test:character-names` wurden ergänzt, konnten in dieser Umgebung aber
  **nicht lokal ausgeführt** werden (kein Java/Emulator vorhanden); ihr
  Nachweis ist der CI-Lauf.
- **Offen:** Rules-Veröffentlichung (separate Freigabe, frischer Export,
  Backup), autorisierte Bestandsaufnahme und Entscheidung zu Alt-Duplikaten,
  Porträt-Rules, echte Mehrgeräteabnahme.
- **Git / PR / Release:** Kein Commit, Push, PR, CI-Lauf, Merge, Deployment,
  keine produktiven Rules-/Datenänderung und kein Wartungsschalter zum
  Zeitpunkt dieses Eintrags.

## IPL-0040 – Block 3 / B: XP im Kampf-HUD

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 04:42 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/19598e48-0815games-github-io`,
  Basis `1f04744` (Main nach dem Merge von #299).
- **Auftrag:** Block 3 · Oberfläche, der nächste offene Punkt. Die Kachel
  SOLDIER zeigte bis dahin nur die nackte Stufenzahl, und die kam aus dem
  Match-State (`createPlayer`), in dem gar keine EP geführt werden.
- **Was gebaut wurde:** Die Kachel trägt jetzt Stufe, `aktuell / benötigt EP`,
  einen Balken und die Restmenge („Noch 330 EP bis Stufe 3“). Neues Modul
  `battle-xp-hud.mjs`; `game.js` ruft es dort auf, wo vorher die Stufe
  geschrieben wurde.
- **Die eigentliche Entscheidung – woher die Zahl kommt:** Das Modul hat
  **keinen** Parameter für „eine Welle hat gerade 120 EP gebracht“. Einzige
  Quelle ist das Profil, das das Konto bestätigt hat (`account.getProfile()`).
  Damit ist die geforderte Bedingung keine Zusicherung, sondern eine Folge der
  Bauart: Eine Welle, die noch speichert, kann den Balken nicht um ein Pixel
  bewegen und keine Stufe heben. Wer STUFE 4 auf dem Feld liest und STUFE 3 im
  Bericht findet, wurde belogen – das nimmt keine Wiederholungsschlange zurück.
  Alle EP-Schreibwege (`workshop-solo-credit.mjs`, `coop-rewards.mjs`) laufen
  ohnehin über `runTransaction` mit `applyLocally:false`, der Profil-Hörer sieht
  also nur vom Server Bestätigtes.
- **Ohne bestätigte Zahl:** kein Balken, keine Restmenge; die Kachel zeigt die
  Stufe, mit der der Soldat angetreten ist (`state.players[me()].level`), und
  behauptet nichts. Ebenso bei Sandbox/Übung, bevor der Hörer antwortet, oder
  bei unlesbarem Profil.
- **Befund beim Bauen (Layout):** Die Kachel wird breiter und höher. Die
  Statuszeile darf jetzt umbrechen (`flex-wrap:wrap`), und die Soldatenkachel
  bleibt unteilbar (`flex:0 0 auto`) – auf einem sehr schmalen Telefon fällt sie
  in eine zweite Zeile, statt über die Kartensteuerung zu wandern.
- **Befund beim Bauen (zwei Koordinatensysteme):** Die Boss-Warnung liegt im
  `.map-frame`, die Vertragskarte in `.battle`. `--hud-bottom` wird gegen
  `.battle` gemessen und hätte die Warnung um die Höhe des Kartenkopfs zu tief
  gesetzt. `measureHud()` veröffentlicht darum zusätzlich `--map-hud-bottom`
  (gegen die Map-Frame-Oberkante) und läuft jetzt in jedem Einsatz, nicht nur
  bei Kampagne/Training. Die Warnung folgt damit der gemessenen Zeile statt
  eines geratenen Versatzes – vorher stand sie starr auf 75/80 px, was mit der
  höheren Kachel kollidiert wäre.
- **Übersetzung:** Zwei neue Strings (`{current} / {required} XP`,
  `{amount} XP to level {level}`) liegen in `localization-battle-de.mjs`; der
  Wächter in `translation-coverage.test.mjs` verlangt sie.
- **Änderungen / Dateien:** `battle-xp-hud.mjs` (neu),
  `tests/battle-xp-hud.test.mjs` (neu, sieben Fälle), `index.html` (Kachel),
  `game.js` (Anschluss, `measureHud` ergänzt), `field-command.css` (Kachel,
  Umbruch, Boss-Warnung), `localization-battle-de.mjs` (zwei Strings),
  `PATCH-BLOECKE.md` (Punkt abgehakt). Acht Test-Harnesse, die `game.js` über
  eine Daten-URL laden, kennen das neue Modul jetzt in ihrer
  Umleitungsliste.
- **Prüfungen:** 7/7 in `battle-xp-hud.test.mjs`; vollständiger serieller Lauf
  `node --test IronPath/tests/*.test.mjs` **1039 bestanden, 0 fehlgeschlagen,
  1 absichtlich übersprungen**. 15/15 in `first-run-layout.test.mjs` (dort war
  das Prüffenster von 900 Zeichen zu knapp für die gewachsene `measureHud`,
  auf 1600 angehoben; die Aussage bleibt).
- **Grenzen:** Kein Mensch hat die Kachel gesehen. Maße sind gerechnet, nicht
  geprüft; die Abnahme auf echten Geräten – besonders im Hochformat, wo die
  Zeile umbrechen kann – bleibt offen. Der Balken hinkt einer Welle hinterher,
  weil er nur Bestätigtes zeigt; das ist die gewollte Antwort, der Feldreport
  meldet das Speichern separat.

## IPL-0041 – Block 3 / C: Endless-Turmschimmer

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/e813b4d8-0815games-github-io`,
  Basis `8672840` (Main nach dem Merge von #300).
- **Abnahme durch den Betreiber (erste menschliche Sichtung der Kachel von
  IPL-0040):** „zum jetzigen Zeitpunkt passt die Zeile im VW Modus beim Handy
  ganz gut“ – die Statuszeile mit der EP-Kachel passt auf dem Telefon. Damit ist
  die größte offene Frage aus IPL-0040 (Umbruch auf schmalen Displays) erstmals
  von einem Menschen gesehen und für gut befunden, wenn auch nur in dieser einen
  Ansicht.
- **Auftrag:** „dann weiter mit dem nächsten Punkt“ – Block 3, der nächste
  offene Punkt: der Endless-Turmschimmer.
- **Was gebaut wurde:** Ein goldener Ring um jeden Turm, dessen nächster Schritt
  offen **und** bezahlt ist (Radius 37 × 26 um die Bauplatte). Der Ring atmet
  leicht; bei reduzierter Grafik steht er still und etwas kräftiger da. Ein
  beendeter Einsatz lädt zu nichts mehr ein, und der Turm, dessen eigenes Blatt
  offen ist, tritt zurück – das Blatt nennt den Preis bereits.
- **Die Bedingung:** Ein Ring an einem Turm, den der Soldat nicht bezahlen
  kann, verspricht ein Upgrade, das das Menü dann verweigert. `supplies()` ist
  die Zahl, die sich in jedem Bild bewegt, also wird die Antwort jeden Frame neu
  aus der Geldbörse gerechnet und nie gemerkt (`tower-upgrade-cue.mjs`). Der
  Veteran-Rabatt von 15 % gilt auch hier: der Ring erscheint beim Preis, den das
  Menü wirklich abrechnet, nicht beim Grundpreis.
- **„Freigeschaltet“ – eine Regel, ein Ort:** Die einzige Sperre im Spiel ist
  die Spezialisierung (Veteran ab Soldatenstufe 5, Bossjäger ab 10). Vorher
  standen die Schwellen an zwei Stellen (Protokoll in `match.mjs`, Menü in
  `game.js`); mit dem Schimmer wären es drei gewesen. Sie liegen jetzt einmal in
  `tower-specialization.mjs` (`branchUnlockLevel`, `branchUnlocked`,
  `anyBranchUnlocked`), und das Protokoll und das Menü fragen dieselbe Regel –
  die Wortlaute der Ablehnung sind unverändert (`tests/tower-specialization.test.mjs`
  prüft die Ablehnung bei Stufe 4 und 9 durch `applyCommand`).
- **Ehrliche Einordnung der Sperre:** Die ersten beiden Zweige sind von Anfang
  an offen, darum ist die Stufe-2-Stufe praktisch immer freigegeben – der
  Geldbeutel entscheidet fast immer. Der Schimmer stellt die Frage trotzdem,
  damit er bei einer späteren Regeländerung nicht plötzlich auf eine
  verschlossene Tür zeigt.
- **Prüfungen:** `tests/tower-upgrade-cue.test.mjs` 7/7 und
  `tests/tower-shimmer.test.mjs` 3/3 (neu). Der zweite Test fährt das echte
  `game.js` gegen eine Stub-Leinwand und liest die Striche zurück: nach dem
  Bauen eines MG (50 von 125, nächste Stufe 70) liegt genau ein Ring auf der
  Bauplatte; nach einem zweiten Turm (25 übrig) ist das Feld still. Für
  „ruhige Markierung“ wird `performance.now()` festgehalten: bei reduzierter
  Grafik ist der Ring in zwei Bildern identisch, mit voller Grafik atmet er.
  Vollständiger serieller Lauf 1049 bestanden, 0 fehlgeschlagen,
  1 absichtlich übersprungen.
- **Änderungen / Dateien:** `tower-upgrade-cue.mjs` (neu),
  `tests/tower-upgrade-cue.test.mjs` und `tests/tower-shimmer.test.mjs` (neu),
  `game.js` (Ring, Menü fragt die gemeinsame Regel), `match.mjs` (Protokoll
  fragt sie ebenfalls), `tower-specialization.mjs` (Regel),
  `tests/tower-specialization.test.mjs` (Regel + Ablehnungsschwellen),
  `PATCH-BLOECKE.md` (Punkt abgehakt). Acht Test-Harnesse, die `game.js` über
  eine Daten-URL laden, kennen das neue Modul in ihrer Umleitungsliste.
- **Grenzen:** Kein Mensch hat den Ring gesehen. Die Maschine sieht die Striche,
  aber nicht, ob er auf dem Feld gut aussieht – besonders nicht, wenn im späten
  Endless-Lauf viele Türme gleichzeitig bezahlbar sind und entsprechend viele
  Ringe leuchten. Das ist die offene Frage dieses Schritts.

## IPL-0042 – Block 3 / D: After-Action Report mit Rang und Beförderung

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/4546501e-0815games-github-io`,
  Basis `749f58b` (Main nach dem Merge von #301).
- **Auftrag:** „Schreib es in Block 8 / to do after patches“ und „mach mir Block
  3 weiter“. Der erste Teil legte **Block 8** in `PATCH-BLOECKE.md` neu an – als
  Sammelstelle, nicht als achten Patch. Erster Eintrag dort: der nach dem Merge
  von #301 einmal rote Job `test:party-recovery-browser`, den ich weder lesen
  (Logs liegen außerhalb des Netzes des Arbeitsraums) noch erneut starten
  (`gh run rerun` verweigert, kein `workflow_dispatch`) noch lokal nachstellen
  konnte (kein Java, keine Emulatoren, Chromium blockiert). Derselbe Code war
  auf dem Branch zweimal grün – **Einschätzung Flake, unbewiesen**. Der zweite
  Teil ist dieser Eintrag: Block 3 / D.
- **Was gebaut wurde:** Im After-Action Report steht neben `LEVEL 6` eine
  Plakette mit Abzeichen und Rangname. Hat der Einsatz eine Schwelle
  überschritten, erscheint darüber ein Banner: `BEFÖRDERT`, das Abzeichen, der
  neue Rang und „Zuvor Gefreiter“. „What’s Next“ liegt jetzt im aufklappbaren
  Bereich; was dort an **Ergebnissen** stand, blieb oben.
- **Die Regel:** Ein Rang ist abgeleitet, nie gespeichert, nie verliehen – er
  wird aus der Stufe gelesen, genau wie im Menü, im Dossier und im
  Vier-Spieler-Panel. Für die Beförderung zählen ausschließlich **bestätigte**
  Zahlen: die EP-Summe des gespeicherten Profils und die Stufen aus den Deltas
  der abge schlossenen Saves dieses Berichts. Ein laufendes, noch nicht
  bestätigtes Save kann niemanden befördern – dieselbe Disziplin wie die
  EP-Kachel aus [IPL-0040](#ipl-0040--block-3--b-xp-im-kampf-hud).
- **Eine Stufe ist noch keine Beförderung.** Von Stufe 4 auf 5 bleibt der
  Soldat Gefreiter; der Bericht schweigt dann zum Rang, statt etwas zu feiern.
  Erst eine überschrittene Schwelle zählt (Rekrut 1, Gefreiter 3, Feldwebel 6,
  Leutnant 10, Hauptmann 15). Über dem letzten Rang wird kein nächster
  angeboten.
- **Umbau am Bericht:** Die Freischaltzeile („1 Stufe gewonnen · 1 neuer
  Fähigkeitspunkt“, „Neue Verbesserungen: …“) war ein **Ergebnis**, kein
  Ausblick – sie steht jetzt bei den bestätigten Belohnungen über dem
  aufklappbaren Teil. Unten im aufklappbaren Bereich bleibt nur der Ausblick
  (`nextSteps`): nächster Fähigkeitspunkt, nächste Ausrüstung, bezahlbare
  Waffenkammer-Upgrades.
- **Prüfungen:** `tests/report-rank.test.mjs` 5/5 (neu). Der mittlere Test
  rendert den echten Bericht über das echte `game.js`: Bericht mit Profil von
  3000 EP (Stufe 6) **ohne** Stufengewinn ⇒ `Sergeant` neben der Stufe, kein
  Banner; derselbe Bericht **mit** einer gewonnenen Stufe ⇒ Banner sichtbar,
  „Zuvor Private.“; Bericht mit 2900 EP (Stufe 5) und einer Stufe ⇒ `Private`,
  Banner bleibt aus. Der letzte Test liest `index.html` und prüft die
  Umstellung: „What’s Next“ im `<details>`, Freischaltungen, Fortschritt und
  Beförderung davor. Vollständiger serieller Lauf **1055 bestanden,
  0 fehlgeschlagen, 1 absichtlich übersprungen**.
- **Änderungen / Dateien:** `report-promotion.mjs` und
  `tests/report-rank.test.mjs` (neu), `game.js` (Rangzeile und Banner),
  `index.html` (Bericht umgestellt), `results-debrief.css` (Plakette, Banner,
  Freischaltzeile; Banner auch in der Regel für reduzierte Bewegung),
  `localization-results-de.mjs` (`BEFÖRDERT`, `Zuvor {rank}.`) mit angehobener
  Cache-Welle in `language.mjs`, `PATCH-BLOECKE.md` (Block 3 / D abgehakt,
  Block 8 neu). Neun Test-Harnesse, die `game.js` über eine Daten-URL laden,
  kennen `report-promotion.mjs` und `rank-insignia.mjs` in ihrer Liste.
- **Grenzen:** Kein Mensch hat es gesehen, und diesmal fehlt mehr als der
  Blick: die Plakette sitzt in einer Zeile, die auf dem Telefon schon mit
  „SOLDATEN-FORTSCHRITT“ und „STUFE 6“ gefüllt ist. Dass sie dort gut umbricht,
  ist geraten, nicht geprüft – im Gegensatz zur Zeilenprüfung des Betreibers
  bei IPL-0040.

## IPL-0043 – Block 3 / Zusatzwünsche, Teil 1: ein Ort für alle Popups

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/2a294859-0815games-github-io`,
  Basis `ca03c10` (Main nach dem Merge von #302).
- **Auftrag, zweigeteilt:** „Dann bitte Rest von Block 3. nicht nur Multiplayer
  Anfragen mittig, allgemein alle Popups bitte.“ Und: „Füge zu Block 8 bitte
  hinzu: Feldfunk minimiert starten …; glow am Turm zu gering muss stärker
  werden.“
- **Block 8 (nur notiert, nicht gebaut):** Zwei neue Einträge unter
  **Sichtbarkeit im Feld**. Beim Lesen des Codes fielen zwei Fragen auf, die vor
  dem Bau geklärt werden sollten: (1) Beim **Feldfunk** sind es *zwei* Flächen –
  die Funkkarte `#storyRadio` (bis zu 370 px breit, links unten im Kartenrahmen)
  und die Funkzeile `.battle-foot` mit `#message`; außerdem ist offen, welche
  Nachrichten im Popup bleiben (Verlauf?) und wie ein Ungelesen-Hinweis zählt.
  (2) Beim **Glow am Turm** ist unklar, welcher Schein gemeint ist: der
  Schimmerring aus IPL-0041 (ruhig gebaut, Deckkraft .42–.62) oder der Schein
  der Turmgrafik in `cartoon-art.mjs`. Beides ist messbar verschieden – notiert
  samt der Warnung, dass ein zu heller Schimmer den Turm selbst verdeckt.
- **Was gebaut wurde:** Eine einzige Datei, `popup-center.css`, legt fest, wo
  ein Popup erscheint: **in der Mitte**. Drei Popups zogen um –
  - Partyeinladungen, Beitritts- und Freundschaftsanfragen (`.social-popup`),
    vorher oben rechts;
  - Wellen- und 2×-Abstimmungen im Feld (`#waveRequest`, `#speedRequest`),
    vorher eine Leiste am unteren Rand bzw. auf dem Handy fest am Bildschirmrand;
  - die Feldentscheidung mit ihren zwei Wahlknöpfen (`#storyDecision`), vorher
    links unten.
- **Die Regel dahinter:** Ein Popup ist kein Hinweisband und kein Sheet. Ein
  Hinweisband (Versionsmeldung, Sandkasten-Hinweis) meldet einen Zustand und
  bleibt in der Ecke; ein Sheet (Turmblatt, Bauring) gehört zu dem Ding, an dem
  es geöffnet wurde – es zu verschieben hieße, den Finger zu verschieben.
  Ein Popup **unterbricht** und verlangt eine Entscheidung; darum kommt es
  dorthin, wo der Blick ohnehin ist. Genau das tat das mittige Anfragezentrum aus
  [IPL-0014](PATCH-LOG.md#ipl-0014--b2-einheitliches-anfragezentrum-und-frische-einladungen) schon; der Auftrag war, daraus eine
  Regel zu machen statt einer Ausnahme.
- **Nur Versatz, nie Position:** Die Regeln setzen ausschließlich
  `left/top/transform` und lösen `right/bottom`. Farben, Rahmen, Ebenenreihenfolge
  und die Handy-Verankerung bleiben in den Stylesheets, die sie erklären. Ein
  Popup behält also sein Aussehen und seinen Bezugsrahmen (Feld oder Ansicht) –
  es steht nur in dessen Mitte statt an dessen Rand.
- **Prüfungen:** `tests/popup-centering.test.mjs` 4/4 (neu): alle drei Popups
  sind zentriert und geben ihre alten Kanten frei; **jeder Selektor trifft ein
  wirkliches Element** (eine Regel, die nichts trifft, ist schlimmer als keine,
  weil sie aussieht als wäre die Arbeit getan); die Datei ist nach
  `style.css` und `field-command.css` eingebunden, sonst würden ihre Versätze
  verpuffen. Dazu `browser-tests/interface-smoke.cjs`: die vier Popups werden im
  echten Chromium in drei Fenstern (320×700, 390×844, 1440×900) gegen ihren
  **tatsächlichen Bezugsrahmen** gemessen – Ansicht bei `fixed`, nächstgelegener
  positionierter Vorfahr bei `absolute` – und dürfen höchstens 2 px von der
  Mitte abweichen. Vollständiger serieller Lauf **1059 bestanden,
  0 fehlgeschlagen, 1 absichtlich übersprungen**.
- **Änderungen / Dateien:** `popup-center.css` (neu, mit eigener Cache-Welle),
  `index.html` (Einbindung), `field-command.css` (drei überholte
  Radio-Anhebungen entfernt – sie galten nur, solange die Feldentscheidung links
  unten stand), `tests/popup-centering.test.mjs` (neu),
  `browser-tests/interface-smoke.cjs`, `PATCH-BLOECKE.md` (Punkt angereichert,
  Block 8 ergänzt).
- **Grenzen:** Die Chromium-Prüfung läuft erst im Prüfstand; im Arbeitsraum
  fehlt Playwright samt Browser, und ihre Log-Dateien kann ich nicht lesen
  (siehe Block 8). Sollte die Prüfung rot werden, ist die Messung zu prüfen,
  nicht die Zentrierung. Und wie zuvor: **kein Mensch hat die Popups auf einem
  echten Gerät gesehen.** Insbesondere die Feldentscheidung liegt jetzt über dem
  Spielfeld, wo vorher der untere Rand frei blieb – das ist gewollt, aber es ist
  eine Entscheidung über Sicht, die ich nur aus dem Auftrag abgeleitet habe.

## IPL-0044 – Block 3 / Zusatzwünsche, Teil 2: Fähigkeits-HUD

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/423312cc-0815games-github-io`,
  Basis `010db2c` (Main nach dem Merge von #303).
- **Auftrag:** „Versions popups auch mittig. Trag es in Block 8 ein.“ und
  „Mach jetzt weiter.“ Der erste Teil steht als Eintrag in **Block 8**
  (`### Popups`): `#versionNotice` liegt oben rechts, hat aber Knöpfe, und
  darum gehört auch es in die Mitte. Notiert wurde zugleich die **Schärfe der
  Regel**: nicht die Bezeichnung entscheidet („Hinweisband“), sondern ob ein
  Element eine Handlung verlangt. Der Kopfkommentar von `popup-center.css` sagt
  heute noch das Gegenteil und ist beim Bau mitzuberichtigen. Der zweite Teil
  ist dieser Eintrag: D2.
- **Was gebaut wurde:** Der Fähigkeitsknopf steht nicht mehr unten in den
  Kampfsteuerungen, sondern **im Kartenrahmen** – am rechten Rand, senkrecht
  mittig. Er trägt das gezeichnete Zeichen seiner Fähigkeit, deren Namen und
  einen Zustand.
- **Die Reihenfolge der Gründe.** Vorher gab es eine einzige Wahrheit: „geht
  nicht“. Jetzt wird die Frage beantwortet, die ein Spieler wirklich stellt, und
  zwar in der Reihenfolge, in der er sie stellen würde: Einsatz vorbei → nichts
  gewählt → ein Panel steht im Weg → lädt noch auf → Gruppe nicht vollständig →
  Welle läuft nicht → nichts zu treffen. Bei `EINSATZ BEENDET` gewinnt immer der
  erste Grund – da gibt es nichts mehr zu warten.
- **Kein scheinbar defekter Knopf.** Ohne gewählte Fähigkeit steht
  `WÄHLEN UNTER FÄHIGKEITEN` statt `NO SKILL`, und ein Antippen wiederholt den
  Hinweis (`Wähle eine Fähigkeit unter FÄHIGKEITEN in der Kommandozentrale.`)
  statt nichts zu tun.
- **Einmalige Einführung:** Beim ersten wirklich bereiten Zustand trägt der
  Knopf für einige Atemzüge einen Ring, und der Funk nennt ihn einmal. Bei
  reduzierter Bewegung bleibt der Ring einfach stehen.
- **Ein Tap, keine doppelte Auslösung:** Der Knopf löst weiterhin direkt aus.
  Eine Pending-Sperre verhindert, dass eine langsame Verbindung denselben Befehl
  ein zweites Mal sendet; erst das Ergebnis gibt den Knopf frei (bei Ablehnung
  sofort, bei Erfolg über den Cooldown).
- **Was sich beim Bauen zeigte:** `field-command.css` hängt an der **Kamera-
  Welle**. `tests/multiplayer-build-stamp.test.mjs` verlangt, dass
  `battle-viewport.mjs`, `battle-viewport-controller.mjs` und das Feld-Layout
  dieselbe Revision nennen – damit drei Routen nie alte und neue Dateien
  mischen. Das Anheben des Feld-Layouts allein machte die Prüfung rot; die
  Kamera-Welle musste mit. Gemerkt für die nächsten Schritte.
- **Prüfungen:** `tests/ability-hud.test.mjs` 6/6 (die reine Regel: jeder Grund,
  seine Reihenfolge, gezielte Fähigkeiten warten auf Ziele, ganze Sekunden,
  unlesbare Eingabe ergibt einen stillen Knopf, fünf unterscheidbare Zeichen)
  und `tests/ability-hud-ui.test.mjs` 3/3 (der echte Bericht aus dem echten
  `game.js`: Name, Zeichen und `WELLE STARTEN` vor der Welle; `BEREIT` samt
  Einführungsring und Funkspruch, sobald Gegner im Feld stehen;
  `WÄHLEN UNTER FÄHIGKEITEN` ohne Fähigkeit samt Hinweis beim Antippen;
  `BEREIT IN {s}s` nach dem Einsatz). Dazu `browser-tests/interface-smoke.cjs`:
  das HUD wird im echten Chromium in drei Fenstern nachgemessen – mindestens
  44 × 44 px, ganz im Bild, auf der rechten Hälfte. Vollständiger serieller Lauf
  **1068 bestanden, 0 fehlgeschlagen, 1 absichtlich übersprungen**.
- **Änderungen / Dateien:** `ability-hud.mjs`,
  `tests/ability-hud.test.mjs`, `tests/ability-hud-ui.test.mjs` (neu);
  `game.js` (HUD, Gründe, Einführung, Pending-Sperre); `index.html` (Knopf aus
  der Befehlsleiste in den Kartenrahmen, mit Zeichen, Name und Zustand);
  `field-command.css` (HUD, Ring, reduzierte Bewegung) samt angehobener
  Kamera-Welle in `game.js` und `battle-viewport-controller.mjs`;
  `localization-results-de.mjs` (zwölf neue Zeichenketten);
  `browser-tests/interface-smoke.cjs`; `PATCH-BLOECKE.md` (D2 abgehakt,
  Abnahme offengelassen, Block 8 ergänzt). Dreizehn Test-Harnesse kennen das
  neue Modul in ihrer Umleitungsliste.
- **Grenzen:** **Niemand hat den Knopf gesehen.** Die Platzierung am rechten
  Rand ist gerechnet: sie kollidiert mit keinem bekannten Element, aber ob sie
  auf dem Telefon wirklich in Daumennähe liegt, weiß erst ein Mensch. Das Feld
  hinter dem Knopf wird teilweise verdeckt – das ist bei jedem HUD so, hier aber
  ungeprüft. Die Chromium-Messung läuft erst im Prüfstand; ihre Log-Dateien
  kann ich nicht lesen (siehe Block 8).
- **Korrektur nach dem ersten Prüflauf (derselbe Tag).** Der Knopf stand im
  Kartenrahmen – aber als Kind des **Befehlsfelds**, das selbst `position:
  absolute` trägt. `absolute` rechnet gegen den nächsten positionierten Vor-
  fahren, nicht gegen den Rahmen: der Knopf landete **auf** `DEPLOY / START
  WAVE`. Chromium hat es gefunden, nicht ich: `command-center.cjs` wollte
  `#start` drücken und meldete „subtree intercepts pointer events“ – ein
  deaktivierter Knopf antwortet dem Treffertest weiterhin, er schluckt den
  Druck bloß. Zwei Lehren:
  - Die **Lage im Dokument** ist Teil der Regel, nicht Beiwerk. Wer ein Element
    mit `absolute` setzt, muss sagen, gegen welche Box es rechnet.
    `tests/ability-hud-placement.test.mjs` prüft das jetzt ohne Browser: der
    Knopf ist Kind des Rahmens, kein offenes Tag dazwischen, und der Rahmen
    ist `position:relative`. Der Test fällt, sowie man den Knopf zurück in das
    Befehlsfeld schiebt – nachgemessen, nicht behauptet.
  - Ein HUD, das nicht benutzt werden kann, gehört **aus dem Treffertest
    heraus** (`pointer-events:none`). Sonst schluckt es den Druck auf den Bau-
    punkt darunter – und das ausgerechnet im Zustand, den ein neuer Spieler als
    erstes sieht: keine Fähigkeit gewählt. Darum bleibt der Knopf in diesem
    Zustand deaktiviert, statt ihn zum Antippen freizugeben; was er zu sagen
    hat, sagt er von selbst – einmal, über den Funk.
  - Der Prüfstand ist nicht stumm. Die Workflow-Datei schreibt das Ende des
    Protokolls als Annotation (`::error title=Browser smoke::`), und die ist
    über die API lesbar, obwohl ich die Log-Datei selbst nicht herunterladen
    kann. Das ist der Weg, wie die Prüfliste zu mir spricht.

## IPL-0045 – Block 3 / D1: Schüsse als Spur statt als Linie

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/423312cc-0815games-github-io`,
  Basis `010db2c` (Main; PR #304 mit D2 davor).
- **Auftrag:** „Und weiter geht's.“ – der Rest von Block 3, hier D1: Schüsse
  lesbar und passend zum Spielstil.
- **Was vorher gemalt wurde:** die **ganze Linie** vom Lauf bis zum Ziel, in
  voller Länge, für das ganze Leben des Schusses, ohne Ausblenden. Zwanzig
  feuernde Türme ergaben zwanzig Linien, die ein Viertelsekunde lang über dem
  Feld lagen. Gegner, Wege und Warnungen verschwanden dahinter – genau die
  Beschwerde, deretwegen der Block geschrieben wurde.
- **Was jetzt gemalt wird:** eine **kurze Spur, die läuft**. Sie verlässt den
  Lauf, wandert die Linie entlang und ist wieder weg. Der Mündungsblitz und der
  Einschlag sind zwei Schläge, nicht ein Brei: der Blitz ist erloschen, bevor
  das Geschoss ankommt.
- **Fünf Handschriften** (Zahlen in `shot-tracers.mjs`, Weltmaß):

  | Waffe | Reisezeit | Spurlänge | Kern / Kontur | Einschlag |
  | --- | --- | --- | --- | --- |
  | MG | 42 % des Lebens | 44 | 1,7 / 3,4 | Ring, klein |
  | Kanone | 72 % | 26 | 3,2 / 5,6 | Ring, warm und schwer |
  | Flak | 52 % | 32 | 2,1 / 4,2 | **doppelt**, platzt in der Luft |
  | Scharfschütze | 18 % | 130 | 1,3 / 2,8 | heller Ring mit Kreuz |
  | Soldat | 34 % | 36 | 1,8 / 3,4 | Ring, klein |

  Drei Achsen, auf denen sich die Waffen unterscheiden: Länge, Gewicht, Tempo –
  und dazu die Form des Einschlags.
- **Was der Prüfschritt fand:** Der Scharfschütze hatte seinen Mündungsblitz
  auf 26 % des Lebens gesetzt, brauchte für den Weg aber nur 18 %: der Blitz
  brannte noch, wenn die Kugel längst saß. Der Prüfschritt „der Blitz ist aus,
  bevor das Geschoss ankommt“ schlug an – bei der Waffe, bei der man es am
  wenigsten erwartet, weil alles so schnell geht. Auf 12 % gesetzt.
- **Verdecken:** höchstens 24 Spuren gleichzeitig, und zwar die **neuesten**;
  die älteren werden nicht gemalt – sie haben trotzdem getroffen. Die Spur
  behält ihr Gewicht auf dem Schirm, wenn herausgezoomt wird, aber der Ausgleich
  ist **begrenzt** (auf 0,6…1,6-fach): eine Spur, die beim Zoomen über das Feld
  wächst, verdeckt genau das, was sie nicht verdecken darf. Blitze sind
  gedimmt (0,9 / 0,85), damit ein volles Feld blendfrei bleibt.
- **Nur Darstellung:** `shot-tracers.mjs` rechnet nur; es schrebt nichts in den
  Schuss zurück (Prüfschritt). Treffer, Schaden, Reichweite, Schussfrequenz und
  Belohnungen sind unberührt; es entstehen keine zusätzlichen und keine
  nachträglichen Treffer.
- **Was offen bleibt:** die **Datenmenge**. Wie viele Schüsse über das Netz
  gehen, bestimmt die Simulation, nicht der Maler – und für D1 sollte zunächst
  nur die Darstellung wechseln. Notiert, nicht angefasst.
- **Prüfungen:** `tests/shot-tracers.test.mjs` **10/10** – die Spur deckt nie
  die ganze Linie ab, sie wandert und hält am Ziel, jede Waffe trägt ihre eigene
  Handschrift, der Blitz ist vor dem Einschlag aus, reduzierte Bewegung behält
  die Spur und lässt das Theater weg, der Zoom-Ausgleich bleibt bescheiden,
  unlesbare Schüsse malen nichts statt Unsinn, das Lesen schreibt nicht zurück,
  und der Maler lässt den Überschuss tatsächlich weg (ein Schuss mehr als 24
  kostet **keinen** einzigen Strich mehr). Vollständiger serieller Lauf
  **1080 bestanden, 0 fehlgeschlagen, 1 absichtlich übersprungen**.
- **Änderungen / Dateien:** `shot-tracers.mjs`,
  `tests/shot-tracers.test.mjs` (neu); `cartoon-art.mjs` (Maler und Obergrenze);
  `PATCH-BLOECKE.md` (D1 abgehakt, Datenmenge und Abnahme offengelassen).
- **Grenzen:** **Niemand hat es gesehen.** Alles hier ist gerechnet und
  geprüft, nicht beurteilt. Ob die Kanone „schwer“ aussieht und die Flak
  „platzt“, entscheidet erst ein Mensch auf dem Schirm.
## IPL-0046 – Block 8: was ein Element tut, nicht wie es heißt

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/9e0009e7-0815games-github-io`,
  Basis `dfaaed4` (Main nach dem Merge von #304).
- **Auftrag:** „New Version update popup mittig – wir hatten ja gesagt alle
  nachrichten mittig. Bei popups“ und, als eigener Punkt: „Zu Block 8 *Du
  wurdest nach 30 Minuten Inaktivität abgemeldet*: Hier brauchen wir ein
  schönes Popup mit Ingame-Art. Soldat der Pause macht oder sonst was. Nach
  wegklicken kommt man wieder zum Loginbildschirm.“
- **Das Versions-Popup** liegt jetzt in der Mitte. Es stand – mit zwei Knöpfen,
  `RETRY CHECK` und `DISMISS` – oben rechts, und zwar aus einem einzigen Grund:
  es hieß *Hinweisband*. Damit ist der eigentliche Fehler benannt, und er steht
  jetzt als Regel im Kopf von `popup-center.css`: **nicht die Bezeichnung
  entscheidet, sondern was ein Element tut.** Beim Aufschreiben kamen zwei
  Sätze hinzu, die gefehlt hatten:
  - Es muss **schweben** (`fixed`/`absolute`). Die Sandkasten-Leiste ist
    *sticky* und läuft mit, solange ein Modus an ist: das ist Möbel, kein
    Popup, und Möbel gehört an den Rand.
  - Über einer ohnehin **leeren Fläche** (der Ladehinweis) kostet die Mitte
    nichts, weil dort nichts im Weg steht.
  Verlangt ein Element eine Handlung und schwebt es, gehört es in die Mitte;
  meldet es nur einen Zustand, während weitergespielt wird, bleibt es in der
  Ecke.
- **Die Abmelde-Karte.** Bisher stand nach der halben Stunde ein schlichter
  Satz auf dem Anmeldebildschirm. Jetzt kommt ein Dialog mit einem eigenen
  Bild: ein Soldat, der sich auf eine Munitionskiste setzt, das Gewehr
  angelehnt in Reichweite, die Laterne brennt, der Becher dampft, der Bunker am
  Horizont. **Geruht, nicht geschlagen** – es hat niemanden getroffen, der
  Soldat hat nur einen Moment hingehalten. Gemalt wird das nicht von einem
  fremden Bild, sondern vom Spiel selbst: `afk-rest-scene.mjs` zeichnet mit
  denselben Tintenlinien, demselben Oliv und Gold und denselben Formen, aus
  denen das Feld besteht. Bei reduzierter Bewegung bleibt der Dampf weg, der
  Soldat bleibt.
- **Wegklicken** schließt die Karte, löscht den Vermerk – sonst wäre sie bei
  jedem Sprachwechsel wiedergekommen – und setzt den Zeiger ins Namensfeld.
  Der Anmeldebildschirm liegt dahinter; es wird nichts anderes daraus.
- **Prüfungen:** `tests/afk-rest.test.mjs` **5/5** – die Szene malt und liefert
  keine einzige unendliche Zahl an die Leinwand, sie überlebt eine Leinwand
  ohne Farbverläufe, bei reduzierter Bewegung ist sie leiser (und nicht leer),
  jede Nummer der Karte kommt in `account.js` wirklich vor, beide Sprachen
  stehen dort, und das Wegklicken löscht den Vermerk nachweislich. Dazu
  `tests/popup-centering.test.mjs` (jetzt **vier** Einträge, das
  Versions-Popup ist benannt) und `interface-smoke.cjs`, das die Meldung im
  echten Chromium in drei Fenstern nachmisst. Vollständiger serieller Lauf
  **1075 bestanden, 0 fehlgeschlagen, 1 absichtlich übersprungen**.
- **Änderungen / Dateien:** `afk-rest-scene.mjs`,
  `tests/afk-rest.test.mjs` (neu); `index.html` (Karte, gemessen);
  `style.css` (Rahmen der Karte); `account.js` (Karte zeigen, übersetzen,
  wegklicken, Vermerk löschen); `popup-center.css` (Versionsmeldung und die
  geschärfte Regel, neue Welle); `tests/popup-centering.test.mjs`;
  `browser-tests/interface-smoke.cjs`; `PATCH-BLOECKE.md` (Block 8: Popups
  abgehakt, Abmeldung aufgenommen).
- **Grenzen – und eine, die ich offenlegen muss:** **Ich kann keine Bilder
  sehen.** Die Szene ist Geometrie, die ich gerechnet habe: Kiste auf dem
  Boden, Figur darauf, Gewehr schräg angelehnt, Bunker am Horizont, Laterne
  rechts. Ob der Soldat **wie ein Soldat aussieht**, kann ich nicht beurteilen
  – das ist die einzige Stelle in diesem Projekt, an der ich blind gearbeitet
  habe. Bitte ansehen; die Zeichnung ist so gebaut, dass sie sich leicht
  korrigieren lässt (ein Modul, eine Funktion, lauter benannte Zahlen).

## IPL-0047 – Korrektur: das Fähigkeits-HUD gehört in die Daumennähe, nicht in die Feldmitte

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/9e0009e7-0815games-github-io`.
- **Der Befund, von Menschenhand:** „Balken für Fähigkeiten geht über die
  komplette Breite und ist mittig im Bildschirm. Geht ja zum spielen quasi gar
  nicht?! Was könnte hier sinnvoll sein.“
- **Was ich gebaut hatte** ([IPL-0044](PATCH-LOG.md#ipl-0044--block-3--zusatzwünsche-teil-2-fähigkeits-hud)):
  der Knopf am **rechten Rand, senkrecht mittig**. Die Anforderung im Block
  hieß: *innerhalb des Rahmens, auf dem Handy am Rand in Daumennähe statt unter
  dem Feld*. Ich hatte „am Rand“ gelesen und „in Daumennähe“ überlesen – und die
  Mitte des Feldes ist kein Rand, sondern **der Ort, an dem gekämpft wird**. Ein
  HUD in der Feldmitte verdeckt genau das, was es bedienen soll.
- **Was jetzt gilt:** der Knopf sitzt **unten rechts im Kartenrahmen**, über der
  Befehlsleiste und oberhalb des Funkbands, das links bleibt. Die zwei
 Bedien­elemente, die dort schon standen (`ZOOM MAP` und „Feld-Upgrade wählen“),
  steigen eine Etage höher; wenn das Upgrade-Feld erscheint, steigt der Zoom
  noch eine weitere. Unten rechts heißt: am Rand **und** in Daumennähe.
- **Und die Breite:** der Knopf hat jetzt eine **feste Breite** (höchstens
  196 px, auf schmalen Feldern weniger) statt nur einer Obergrenze, und Name
  wie Zustand werden abgeschnitten. Damit kann ihn kein Fähigkeitsname – in
  keiner Sprache, auch nicht „VERSORGUNGSABWURF“ – in die Breite ziehen. Nebenbei
  springt der Knopf nicht mehr, wenn aus `BEREIT` ein `BEREIT IN 12s` wird; das
  war unter dem Daumen ohnehin störend.
- **Was sich beim Prüfen zeigte (und was mich gelehrt hat):** die Maschine
  hatte die Mitte **nicht** beanstandet. Drei Fenster gemessen, Touchziel
  geprüft, `#start` nicht verdeckt – alles grün. Was kein Prüfschritt fragte:
  *liegt das Ding dort, wo gespielt wird?* Ein Prüfschritt kann eine
  Daumenspitze nicht ersetzen. Nachgezogen sind jetzt zwei Messungen: der Knopf
  liegt im unteren Teil des Feldes und ist schmaler als zwei Drittel der Breite,
  und er darf das Funkband nicht überdecken.
- **Ein zweiter Fehler, wieder nur vom Telefon:** mit fester Breite von 196 px
  greift der Knopf auf einem 360 px breiten Bildschirm in die linke untere Ecke
  – dorthin, wo die Funkzeile steht. Der Prüfstand hat das gemessen. Die Breite
  ist deshalb **höchstens die halbe Bildschirmbreite minus Ränder**: die
  Funkzeile besitzt links unten bis zu 45 vw, also kann der Knopf ihr bei jeder
  Höhe und jedem Text aus dem Weg bleiben.
- **Prüfungen:** `tests/ability-hud-placement.test.mjs` verlangt jetzt `bottom`
  statt `top:50%`, verbietet die Feldmitte ausdrücklich und besteht auf der
  festen Breite und der Halbe-Bildschirm-Regel; `interface-smoke.cjs` misst im
  echten Chromium nach: untere Hälfte, schmaler als 65 % der Breite, kein
  Überlappen mit der Funkzeile. Vollständiger serieller Lauf **1079 bestanden,
  0 fehlgeschlagen**.
- **Änderungen / Dateien:** `field-command.css` (Lage, feste Breite,
  Kürzen der Texte, die zwei Nachbarn eine Etage höher); `game.js` und
  `localization-results-de.mjs` (der Funkspruch nennt jetzt „unten rechts“);
  `tests/ability-hud-placement.test.mjs`, `tests/ability-hud-ui.test.mjs`,
  `browser-tests/interface-smoke.cjs`; `PATCH-BLOECKE.md` (D2 berichtigt).
- **Grenzen:** wieder **gerechnet, nicht gesehen**. Die neue Lage ist
  kollisionsfrei gegen jede bekannte Box gerechnet und wird im Prüfstand
  nachgemessen – ob sie bequem ist, entscheidet der Daumen.

## IPL-0048 – Block 8: Der Turm soll leuchten (Schimmer und Prestige-Schein)

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/9e0009e7-0815games-github-io`.
- **Auftrag:** „Glow am Turm zu gering“ – der Schein müsse **deutlich stärker**
  werden. Auf die Frage, welcher Schein gemeint sei – der ruhige Schimmerring
  aus [IPL-0041](PATCH-LOG.md#ipl-0041--block-3--c-endless-turmschimmer) oder
  der Schein der Turmgrafik – kam die Antwort: **beides**. Erst die Grafik,
  dann den Ring nachziehen.
- **Der Prestige-Schein** (`cartoon-art.mjs`): bisher ein einziger matter Ring
  (`shadowBlur` 15, Füllung `.12`). Jetzt liegt unter dem Turm ein **Lichtteich**
  (radialer Verlauf, 58 × 46 px, gold, Deckkraft .36 innen bis 0 außen), dazu
  ein kräftigerer Ring (`shadowBlur` 26) und ein feiner Außenring. Das Ganze
  wird **vor** dem Turm gemalt – der Turm selbst landt obenauf. Genau das ist
  die Regel, die in [IPL-0041](PATCH-LOG.md#ipl-0041--block-3--c-endless-turmschimmer)
  als Warnung steht: *ein zu heller Schimmer verdeckt den Turm selbst*. Heller
  machen heißt hier: mehr Licht **um** den Turm, nicht **auf** ihm.
- **Der Schimmerring** (`game.js`): Radius 37 × 26 auf **40 × 28**, Linie 2 auf
  **3 px**, Deckkraft von .42–.62 auf **.58–.78**, und der Strich führt jetzt
  einen eigenen Schein (`shadowBlur`). Bei reduzierter Bewegung: Deckkraft
  **.82** statt .72, Linie 3,5 px.
- **Prüfungen:** `tests/tower-shimmer.test.mjs` besteht weiter (ein Ring auf der
  bezahlbaren Bauplatte, still bei reduzierter Grafik, atmet sonst) und prüft
  jetzt auch, dass der Ring nie unter .38 Deckraft fällt und mindestens 3 px
  dick ist – ein Haarlineal ist eine Einladung, die man suchen muss.
  `tests/tower-glow.test.mjs` ist neu (3/3): ein gewöhnlicher Turm verlangt kein
  Licht, ein Prestige-Turm verlangt welches und zwar mindestens 20 px
  Zerstreuung; das Licht liegt laut Quelltext **unter** dem Turm; beides gilt
  mit und ohne reduzierte Bewegung. Vollständiger serieller Lauf **1079
  bestanden, 0 fehlgeschlagen**.
- **Was mich der Cache-Test gelehrt hat:** ich hatte `cartoon-art.mjs` auf eine
  eigene Welle `20261117-towerglow1` gesetzt. Der Bestandstest
  `multiplayer-build-stamp` hat das abgelehnt, und zu Recht: ein Modul, das das
  Spiel einmal hält, darf nicht in zwei Fassungen nebeneinander im Cache
  liegen. Es bleibt beim Veröffentlichungsstempel `20261031-patch4` – der Schein
  kommt also mit dem nächsten Stand, nicht vor ihm.
- **Änderungen / Dateien:** `cartoon-art.mjs` (Lichtteich, Ringe),
  `game.js` (Schimmerring), `tests/tower-glow.test.mjs` (neu),
  `tests/tower-shimmer.test.mjs`, `PATCH-BLOECKE.md` (Punkt abgehakt).
- **Grenzen:** **Kein Mensch hat es gesehen.** Die Maschine liest die
  Pinselstriche, nicht das Bild. Ob der Schein jetzt stark genug ist – und ob
  er bei vielen bezahlbaren Türmen im späten Endless-Lauf das Feld zumatscht –
  entscheidet ein Blick, den ich nicht habe.

## IPL-0049 – Bestandsaufnahme: Block 3 ist gebaut, was fehlt, ist Abnahme

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/9e0009e7-0815games-github-io`.
- **Anlass:** Der Betreiber bat, **alles zu mergen** und die Protokolle nicht zu
  vergessen – und danach weiterzumachen, falls in einem Block noch etwas offen
  ist. Beim Nachtragen fiel auf, dass die Bestandsaufnahme an zwei Stellen
  hinter dem Code herlief.
- **Gemerged (beides grün, 13 von 13 Prüfungen):**
  - [PR #305](https://github.com/0815games/0815games.github.io/pull/305) –
    Block 3 / D1: Schüsse als Spur statt als Linie
    ([IPL-0045](PATCH-LOG.md#ipl-0045--block-3--d1-schüsse-als-spur-statt-als-linie)).
  - [PR #306](https://github.com/0815games/0815games.github.io/pull/306) –
    Versions-Popup mittig, Karte für die Pause, Fähigkeits-HUD aus der Feldmitte
    in die Daumennähe, stärkerer Turmschein
    ([IPL-0046](PATCH-LOG.md#ipl-0046--block-8--was-ein-element-tut-nicht-wie-es-heißt),
    [IPL-0047](PATCH-LOG.md#ipl-0047--korrektur-das-fähigkeits-hud-gehört-in-die-daumennähe-nicht-in-die-feldmitte),
    [IPL-0048](PATCH-LOG.md#ipl-0048--block-8--der-turm-soll-leuchten-schimmer-und-prestige-schein)).
    Vor dem Merge auf Main nach dem #305-Merge umgestellt (Aufholen), weil beide
    Zweige an dieselbe Stelle des Protokolls schrieben; der Zusammenstoß war
    zwei überschriebene Zeilen, keine verlorene Aussage.
- **Erster Befund – eine veraltete Zeile:** Der Punkt **Party-Roster** stand
  offen mit der Begründung „Die aktuelle Darstellung ist eine Liste“. Sie ist
  keine: `firebase-four-panel.mjs` baut seit dem Umbau des Online-Panels eine
  Karte je Slot, `interface-redesign.css` legt sie ins Raster. Die Zeile ist
  jetzt abgehakt **und belegt** – nicht einfach durchgestrichen.
- **Zweiter Befund – ein erledigter Sammelpunkt:** Die **Zusatzwünsche**
  (Popups mittig, Fähigkeits-HUD, Schussdarstellung) sind alle drei gebaut; der
  übergeordnete Punkt stand dennoch offen. Auch das ist jetzt berichtigt.
- **Neue Prüfung:** `tests/party-roster-layout.test.mjs` (3/3) macht die
  Behauptung nachprüfbar: das Raster ist `repeat(auto-fit,minmax(150px,1fr))`
  und **nicht** ein starres `repeat(2,…)`, das auf dem Telefon nicht
  zusammenklappen könnte; die Karte trägt Bild, Namen, Rangabzeichen **und**
  Rangnamen, Host-/Team-Marke und Bereitschaft; ein leerer Slot bleibt als
  leerer Slot benannt; und die Karte malt **keine eigene Farbe**, sondern trägt,
  was das jeweils aktive Thema einer Zeile gibt – sonst sähe sie nach dem
  nächsten Themenwechsel falsch aus. Vollständiger serieller Lauf **1092
  bestanden, 0 fehlgeschlagen**.
- **Was jetzt offen ist, ehrlich gesagt:** In Block 3 ist **nichts mehr zu
  bauen**. Offen ist ausschließlich Abnahme von Menschenhand: die Karten, der
  Schimmer, die Spuren, das HUD – alles gerechnet und gemessen, nichts gesehen.
  In [Block 8](PATCH-BLOECKE.md#8-was-nach-den-patches-ansteht--sammelstelle)
  steht noch der Punkt **Feldmeldungen als Popup**, und der hat offene
  Baufragen, die ich nicht allein beantworten sollte (welche Meldungen bleiben
  im Popup, wie zählt der Ungelesen-Hinweis, was passiert bei reduzierter
  Bewegung). Der gelegentlich rote Browser-Job braucht ein Menschenauge auf dem
  Protokoll; ich kann ihn weder lesen noch neu anstoßen.
- **Änderungen / Dateien:** `PATCH-BLOECKE.md` (zwei Punkte berichtigt),
  `tests/party-roster-layout.test.mjs` (neu), `PATCH-LOG.md` (dieser Eintrag).
- **Grenzen:** Ich habe nur die zwei Punkte berichtigt, die ich mit Code und
  Prüfung belegen konnte. Die übrigen offenen Punkte sind mit Absicht offen
  geblieben: sie verlangen echte Geräte, produktive Dienste oder Altbestände –
  nichts davon liegt in diesem Arbeitsraum.

## IPL-0050 – Block 8: Der Funk bekommt eine zweite Stimme (Warnungen statt nur Meldungen)

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/8763f0d7-0815games-github-io`,
  Basis `4ce014d4` (Main nach den Merges von #305, #306 und #307).
- **Auftrag:** „Feldmeldungen als Popup“, auf die Rückfrage **eingeschränkt auf
  das Wichtige**: *„Ins Popup wandern nur Meldungen, die eine Entscheidung oder
  eine Warnung sind. Der Rest bleibt in der Zeile, wie heute.“*
- **Erste Feststellung:** die **Entscheidungen** sind längst Popups. Wellen- und
  2×-Abstimmungen sowie die Feldentscheidung stehen mittig
  ([IPL-0043](PATCH-LOG.md#ipl-0043--block-3--zusatzwünsche-teil-1-ein-ort-für-alle-popups),
  [IPL-0046](PATCH-LOG.md#ipl-0046--block-8--was-ein-element-tut-nicht-wie-es-heißt)).
  Zu bauen blieben also die **Warnungen**.
- **Was eine Warnung ist, in einem Satz:** der Spieler hat um etwas gebeten und
  es nicht bekommen, oder auf dem Feld ist etwas schiefgegangen. Also: jede
  Ablehnung der Simulation (`result.reason`), eine unmögliche oder abgelaufene
  Handlung (keine Fähigkeit gewählt, nicht genug Vorräte, Bauplatz belegt oder
  verfallen, fremde Lane, offener Kampagnenspeicher) und Schaden am Bunker,
  brechendes Eis, verlorener Einsatz. Der Rest – „Held bewegt sich“,
  „Welle gestartet“, Funde, Belohnungen – bleibt Funkverkehr in der Zeile.
- **Zwei Entwürfe, und der erste war falsch.** Zuerst nahm die Warnung den Platz
  des Funkkastens selbst ein. Das hat zwei Prüfungen zerschlagen, und beide
  hatten recht: eine Warnung, die stehen bleibt, **verdeckt den laufenden Funk**
  – „Einsatz beendet“ verschwand hinter „Wähle eine Fähigkeit“. Jetzt hat die
  Warnung **ihre eigene Karte über dem Funk**: dieselbe Breite, wächst nach oben,
  und die Zeile darunter redet weiter.
- **Der zweite Fehler war die Schlange.** Sie war falsch herum: die **älteste**
  Warnung stand vorn, die neueste wartete dahinter – ausgerechnet die Meldung,
  die sagt, was gerade schiefging. Jetzt steht die **neueste** auf der Karte und
  die verdrängte wartet einen Tipp dahinter (`+N`); dreimal tippen führt durch
  die letzten drei. Ein Bunkertreffer geht also nicht verloren, nur weil danach
  ein Upgrade abgelehnt wurde.
- **Warum nicht mittig:** eine Warnung unterbricht das Spiel nicht, sie meldet
  nur etwas. Die Mitte des Feldes ist der Ort, an dem gekämpft wird – der
  Betreiber hat das beim Fähigkeits-HUD deutlich gesagt
  ([IPL-0047](PATCH-LOG.md#ipl-0047--korrektur-das-fähigkeits-hud-gehört-in-die-daumennähe-nicht-in-die-feldmitte)).
  Die Karte liegt in der Ecke, in die das Auge ohnehin geht, und sie teilt die
  Breite des Funkkastens – also genau die Geometrie, gegen die der
  Fähigkeitsknopf und die Zoomspalte schon vermessen sind.
- **Ehrliche Grenzen:** (1) **Kein Mensch hat es gesehen.** (2) Die Karte wird
  **nicht** weggeklickt, und sie hat **keinen Knopf**. Sie ist eine
  Bildunterschrift wie der Funk darunter: jeder Tipp geht durch sie hindurch aufs
  Feld. Chromium hat das in zwei Schritten erzwungen – erst antwortete der Knopf
  nicht (der Funkkasten ist mit Absicht durchlässig), dann, zum Antworten
  gebracht, schluckte er einen Tipp, der einem Bauplatz galt. Ein Knopf über dem
  Schlachtfeld ist eine Wand, egal wie klein. Stattdessen zeigt jede Warnung sich
  acht Sekunden, dann folgt die nächste. (3) Ein Screenreader wird beim
  Erscheinen **nicht** unterbrochen (`aria-live` bleibt `polite`); die Karte
  bleibt stehen, also geht nichts verloren. (4) Die Warnung wird nicht
  gespeichert und nicht übertragen: sie gilt für genau einen Bildschirm.
- **Prüfungen:** `tests/field-alert.test.mjs` neu (8/8): die Karte erscheint und
  bleibt; die neueste steht vorn und die verdrängte einen Tipp dahinter; die
  Historie ist kurz (drei); Sprachwechsel liest neu; ein Feld ohne Karte ist kein
  kaputtes Feld; und die **Liste der Warnungen ist festgenagelt** – samt der
  Zusage, dass gewöhnlicher Funkverkehr in der Zeile bleibt. Drei Bestandstests
  (`coop-ui`, `solo-smoke`, `ability-hud-ui`) lesen ihre Ablehnungen jetzt von
  der Karte statt aus der Zeile – nicht abgeschwächt, sondern auf das neue
  Ziel gerichtet. `interface-smoke.cjs` misst im echten Chromium nach, dass die
  Karte über dem Funk liegt, dessen Breite hält, im Rahmen bleibt, dem
  Fähigkeitsknopf aus dem Weg geht und erreichbar ist. Vollständiger serieller
  Lauf **1099 bestanden, 0 fehlgeschlagen**.
- **Änderungen / Dateien:** `field-alert.mjs` (neu), `index.html` (Karte),
  `field-command.css` (Karte und ihr Gesicht), `game.js` (`warn()` neben
  `notice()`, Einordnung der Meldungen, Aufräumen bei Einsatzende und neuem
  Lauf), `localization-de.mjs` und `localization-battle-de.mjs` (WARNUNG,
  SCHLIESSEN, „+N weitere“), `tests/field-alert.test.mjs` (neu), elf
  Test-Harnesse (das neue Modul in ihrer Umleitungsliste),
  `PATCH-BLOECKE.md` (Punkt geteilt, Teil 1 abgehakt).
- **Offen geblieben:** Ob der Funk künftig **minimiert** startet, ist nicht
  entschieden. Das ist eine Frage an den Betreiber, keine, die ich mir selbst
  beantworten sollte.

## IPL-0051 – Block 8: Der Funk wird zum Funkgerät (er startet geschlossen)

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-11-17 UTC; vorgegebenes
  Sitzungsdatum 2026-10-31 UTC. Branch `arena/095361b2-0815games-github-io`,
  Basis `b5e5054` (Main nach dem Merge von #308).
- **Auftrag:** „Feldmeldungen als Popup“ – Teil 1 (nur das Wichtige als eigene
  Warnkarte) war mit
  [IPL-0050](PATCH-LOG.md#ipl-0050--block-8--der-funk-bekommt-eine-zweite-stimme-warnungen-statt-nur-meldungen)
  gebaut. Auf die Rückfrage, ob der Funkverkehr künftig **minimiert** starten
  soll, kam die Entscheidung: **Funkgerät** – ein kleiner Handapparat, der
  geschlossen startet, die Nachrichten auf Antippen öffnet und zählt, was
  dazugekommen ist.
- **Was jetzt im Feld steht:** ein Handapparat (`RADIO`/`FUNK`) in der Ecke, in
  der vorher die Funkzeile lag. Er **startet geschlossen**. Ein Zähler zeigt,
  wie viele Meldungen seit dem letzten Öffnen eingegangen sind. Antippen öffnet
  das **Log** darüber: die letzten zwölf Meldungen, älteste oben, neueste unten
  und fett. Ein Antippen aufs Feld oder die Taste `Escape` schließt es wieder –
  der Kampf läuft weiter, während es offen ist, also darf es nicht erst per
  Knopf verschwinden.
- **Was nicht mehr im Bild ist:** die dauerhafte Zeile. Die Worte stehen jetzt
  im Log, und für Screenreader bleibt ein versteckter Live-Bereich
  (`#message`, per `clip-path` aus dem Bild genommen) – die Ansage bleibt, die
  Fläche nicht.
- **Warum die Ecke und nicht die Mitte:** der Spieler öffnet das Log, um zu
  lesen, während der Kampf weiterläuft. Die Mitte des Feldes ist der Ort, an dem
  gekämpft wird – die Lektion aus
  [IPL-0047](PATCH-LOG.md#ipl-0047--korrektur-das-fähigkeits-hud-gehört-in-die-daumennähe-nicht-in-die-feldmitte)
  gilt auch hier.
- **Was es nicht darf, und wie das geprüft ist:** keine Meldung verlieren, nur
  weil das Log geschlossen war (das Log führt sie alle, zwölf lang); den Zähler
  beim **Öffnen** löschen und nicht schon beim Eintreffen; keine Tipps vom Feld
  nehmen, solange es geschlossen ist (`pointer-events:none` am Kasten, `auto`
  nur am Handapparat und am offenen Log); und mit einem neuen Lauf leer
  starten.
- **Prüfungen:** `tests/field-radio.test.mjs` neu (**12/12**). Der Prüfstand im
  echten Chromium (`interface-smoke.cjs`) misst dazu: der Handapparat ist klein
  (höchstens 40 % der Breite), mindestens 24 px hoch und **antwortet einem
  Tipp**; das ausgelieferte Markup **startet geschlossen** (Log versteckt,
  `aria-expanded="false"`, kein Zähler); und das geöffnete Log steht in der Ecke,
  nicht über der Mitte, bleibt im Rahmen und sein Kreuz ist ein erreichbares
  Ziel. `wave-consensus.cjs` liest den Kampfstatus aus dem Log statt aus der
  alten Zeile und schließt es im laufenden Spiel per Kreuz und per Escape.
  Vollständiger serieller Lauf **1112 bestanden, 0 fehlgeschlagen**.
- **Nachtrag (gleicher Block):** das Funkgerät verkabelt sich jetzt **selbst**
  (Handapparat, Kreuz, Tipp aufs Feld, Escape) statt durch `game.js`. Der Grund
  ist ein Fund im Prüfstand: `interface-smoke.cjs` sperrt Skripte absichtlich,
  damit nur CSS und Markup gemessen werden – ein Tipptest auf das Öffnen war dort
  **nicht ehrlich zu gewinnen**, weil die Verdrahtung in `game.js` gar nicht
  läuft. Das Schließen gehört nun zum Gerät und ist damit im seriellen Test
  fahrbar (Kreuz, Feld-Tipp, Escape, und `destroy()` nimmt die Hände wieder vom
  Dokument). Keine Prüfung wurde dafür abgeschwächt.
- **Was Chromium in drei Runden gefunden hat (PR #309):**
  1. `interface-smoke.cjs` **sperrt Skripte absichtlich** – es misst Markup und
     CSS. Ein Tipptest auf „der Handapparat öffnet das Log“ war dort ehrlich
     nicht zu gewinnen: die Verdrahtung läuft in dieser Prüfung gar nicht. Der
     Prüfstand misst dort jetzt das **ausgelieferte** Aussehen (geschlossen,
     `aria-expanded="false"`, kein Zähler) und die Geometrie des geöffneten Logs.
     Das Öffnen und Schließen selbst prüfen `wave-consensus.cjs` im laufenden
     Spiel (Tipp öffnet, Kreuz schließt, Escape schließt) und
     `tests/field-radio.test.mjs` seriell.
  2. `wave-consensus.cjs` las das Log, während es längst geschlossen war: jeder
     Tipp aufs Feld schließt das Funkgerät – auch der auf die Tempo-Taste. Das
     Log wird nur im offenen Zustand gezeichnet, folglich stand dort eine
     veraltete Liste. Der Prüfstand **öffnet den Handapparat jetzt vor jedem
     Lesen** (`readRadio`), so wie ein Spieler es tut – und bewusst ohne auf
     laufende Wellen-Operationen zu warten, weil der Test genau so eine in der
     Luft hält.
  3. `multiplayer-field.cjs` hat **Marken und einen Wächter** bekommen: der
     Prüfling schreibt nur am Ende, ein Hänger schrieb gar nichts, und die
     Pipeline beschuldigte das falsche Skript. Jede Marke nennt den letzten
     Stand.
- **Änderungen / Dateien:** `field-radio.mjs` (neu), `index.html`,
  `field-command.css`, `game.js`, `localization-de.mjs` (FUNK, Funkverkehr
  öffnen/schließen), `tests/field-radio.test.mjs` (neu), elf Test-Harnesse (das
  neue Modul in ihrer Umleitungsliste), `browser-tests/interface-smoke.cjs`,
  `browser-tests/wave-consensus.cjs`, `PATCH-BLOECKE.md` (Punkt abgehakt).
- **Grenzen:** **Kein Mensch hat es gesehen.** Die **Kampagnen-Funkkarte**
  (`#storyRadio`) bleibt unangetastet: sie erscheint für Sekunden und ist eher
  mit der Warnkarte verwandt. Wer die letzte Meldung im Vorbeigehen lesen
  wollte, verliert sie jetzt aus dem Blick – das ist der Preis des Wunsches, und
  der Zähler ist der Ersatz dafür.

## IPL-0053 – Block 9: Einheitlich – der Kartenname wird einmal zur Überschrift

Der Betreiber hat auf dem Gerät drei Dinge gesehen und gemeldet:

- **„Karte einpassen“ und der Fähigkeitsknopf sitzen ein bisschen aufeinander
  und haben verschiedene Optik – es sollte alles einheitlich sein.“**
- **„Der Bürger-Button hat einen anderen Rahmen und sitzt anders als die Buttons
  drum herum.“**
- **„Unten links steht permanent der Kartenname. Ich möchte ihn einmal wie als
  Überschrift des Kampfes am Anfang, schön und prunkvoll, gerne auch mit Artwork
  im Ingame-Stil, mittig am Bildschirm haben, wenn die Karte geladen wird – und
  dann weggehen; dann brauche ich keine Information mehr über die Karte selbst.“**

Gebaut:

- **Eine Spalte am rechten Rand.** Der Hinweis auf das Feld-Upgrade, „Karte
  einpassen“ und der Fähigkeitsknopf lagen jeder für sich absolut im Rahmen –
  drei Schätzungen, die sich auf dem Telefon getroffen haben (der Upgrade-Hinweis
  und die Zoom-Taste standen beide auf 156 px). Jetzt teilen sie eine
  `flex`-Spalte mit **einem** Abstand (8 px), unten verankert, wo der Daumen
  liegt: die Fähigkeit bleibt ganz unten auf 100 px, darüber die Zoom-Taste,
  darüber der Upgrade-Hinweis. Weil sie eine Spalte sind, können sie sich nicht
  mehr überlagern, egal wie lang einer von ihnen wird.
- **Ein Aussehen für alle drei** – das Aussehen, das der Fähigkeitsknopf immer
  hatte: dunkle Platte, Haarlinien-Rand, gleiche Rundung (8 px), gleicher
  Schatten, gleiche Schriftgröße. Der Rahmen der drei ist jetzt **eine**
  Regel, nicht drei Kopien, die auseinanderlaufen können.
- **Eine Familie in der Befehlsleiste.** Der Burger ist ein `<summary>`, kein
  `<button>`, und wurde bisher **neben** den Knöpfen gestylt: eckig, wo die
  Knöpfe gerundet sind (`4px 7px 5px 4px` kommt aus `style.css`), und mit einer
  Box, die nur auf ihre eigenen 46 px kam – deshalb saß er höher als seine
  Nachbarn, sobald ein Text umbrach. Rahmen, Schrift und Rundung stehen jetzt in
  **derselben** Regel für beide Arten von Kind, und das Menü ist selbst eine
  Flexbox, damit sein Knopf die Reihe füllt.
- **Der Kartenname ist kein Dauerelement mehr.** Das Kästchen unten links ist
  **weg** (es war der Rahmen des Kartennamens – mit nur noch „FREIES SPIEL“
  darin hätte es auf dem Telefon leer gestanden). Dafür bekommt die Karte ihre
  **Titelkarte**: mittig, das Feld in der **eigenen Grafik des Spiels** gemalt
  (Boden der Karte, Straßen, Baupunkte, Bunker – aus der Kartengeometrie und dem
  Kartensamen, also dasselbe Bild, das Sekunden später das Feld ist), darüber der
  Modus, darunter der Name in Black Ops One mit Goldlinie. Sie kommt **einmal**,
  wenn die Karte geladen wird, hält 2,6 s, blendet aus und ist weg – **kein
  Knopf, keine Tipps** (`pointer-events:none`), bei reduzierter Bewegung ohne
  Animation.

- **Was Chromium beim ersten Lauf gefunden hat:** eine Klassenregel reicht nicht.
  „Karte einpassen“ und der Upgrade-Hinweis sahen nicht nur anders aus, weil sie
  eigene Regeln hatten – sie erbten den **gestanzten Eisenknopf** aus
  `interface-redesign.css` (`button:not(.primary):not([disabled]):not(.mode-card):not(.act-node)`,
  Spezifität **0-3-1**): Farbverlauf statt dunkler Platte, Silberkante statt
  Haarlinie. Eine Regel `.field-controls>button` (0-1-1) verliert dagegen, egal
  in welcher Datei sie steht. Die gemeinsame Regel trägt deshalb eine **ID**
  (`#gameView .field-controls>button:not(.ability-hud)`) und lässt die Fähigkeit
  draußen, damit deren eigene Maße – vor allem die Breite `min(196px, 50vw -
  20px)` – nicht überschrieben werden. `tests/ability-hud-placement.test.mjs`
  hält das fest, samt Wächter, dass die Eisenregel, die es zu überstimmen gilt,
  noch existiert.
- **Was Chromium nach dem Zusammenführen auf `main` gefunden hat:** die Karte
  darf den Namen nicht selbst schreiben. `#mapName` ist jetzt der **einzige**
  Ort, an dem die Karte benannt wird (die Ecke ist weg), und das Feld schreibt
  dort „Kartenname · SEKTOR 4“ – der Rückzugs-Ablauf liest den Sektor daraus
  wieder heraus. Die Titelkarte setzte den Knoten aus ihrer eigenen Geometrie
  neu und fraß dabei den Sektor: „Urban Ruin & Industrial Complex“ statt
  „… · SEKTOR 4“. Der Name kommt deshalb vom Aufrufer
  (`mapIntro.show(id,{label,name})`); die Karte benennt sich nur noch selbst,
  wenn ihr niemand einen Namen gibt. `tests/map-name-title.test.mjs` (2) fährt
  das Spiel mit einem Sektor-4-Feld hoch und prüft, dass der Sektor steht und
  die Karte genau den Text des Feldes zeigt – der Test schlägt fehl, wenn man
  den Namen wieder weglässt.
- **Warum die Titelkarte keine Tipps nimmt:** sie liegt über einem Feld, auf dem
  der Spieler vielleicht schon baut. Eine Karte, die einen Tipp schluckt, ist
  eine Wand – dieselbe Lektion, die die Warnkarte zweimal im Chromium gelernt
  hat.
- **Prüfungen:** `tests/map-intro.test.mjs` neu **9/9** (Turnus mit gehaltener
  Uhr, Ausblenden, Ende des Laufs räumt sie weg, keine Taste, keine
  `pointer-events`, das Bild wird aus der Kartengeometrie gemalt, **jede** Karte
  im Spiel malt sich – feste wie erzeugte –, dieselbe Karte malt dasselbe Bild,
  zwei Karten malen verschiedene, und ein kaputtes Canvas kostet den Titel
  nicht). `tests/ability-hud-placement.test.mjs` umgeschrieben: die Fähigkeit
  misst nicht mehr selbst gegen den Rahmen, sondern hängt an der Spalte – die
  Spalte ist Kind des Rahmens, die Fähigkeit Kind der Spalte, und **nie** ein
  Kind der Befehlsleiste. Der Prüfstand im echten Chromium
  (`interface-smoke.cjs`) misst neu, auf allen drei Breiten: die vier Leisten
  (EINSATZ, TEMPO, MENÜ, EINSATZ BEENDEN) haben **dieselbe Rundung, dieselbe
  Rahmendicke, dieselbe Schriftart und -größe**, beginnen und enden auf
  derselben Linie und überlappen nicht; die drei Feldknöpfe am rechten Rand
  haben dieselbe Rundung, denselben Rahmen, dieselbe Platte, dieselbe
  Abschlusskante, sitzen **untereinander statt aufeinander** und bleiben über
  der Befehlsleiste; die Titelkarte ist zentriert, enthält das Artwork, hat
  keinen Knopf und lässt jeden Tipp durch; und der Kartenname kommt im Feld nur
  **einmal** vor. Vollständiger serieller Lauf **1109 bestanden, 0
  fehlgeschlagen**.
- **Änderungen / Dateien:** `map-intro.mjs` (neu),
  `tests/map-intro.test.mjs` (neu), `index.html`, `field-command.css`,
  `game.js`, `cartoon-art.mjs` (`themeGroundColor` ausgezogen, damit die
  Titelgrafik dieselbe Palette benutzt wie das Feld),
  `tests/ability-hud-placement.test.mjs`, `tests/map-name-title.test.mjs` (neu),
  elf Test-Harnesse (neues Modul in der Import-Liste),
  `browser-tests/interface-smoke.cjs`.
- **Grenzen:** **Kein Mensch hat das Ergebnis gesehen.** Ich habe kein Augenlicht
  und kann die Titelgrafik nicht beurteilen – `browser-artifacts/map-title-card.png`
  zeigt drei nachgebaute Karten (Feldgrafik aus echter Kartengeometrie, gerendert
  mit `@napi-rs/canvas`), damit ein Mensch sie ansehen kann. Die Maschine hat
  gemessen, dass jede Karte ein Bild malt (150+ Farben, nie eine Fläche) und dass
  die Karte zentriert ist – ob sie „prunkvoll“ aussieht, entscheidet erst der
  Blick des Betreibers.

## IPL-0052 – Block 8: Ausgemistet – kein Funkgerät, keine Flagge, das Menü nach unten

Der Betreiber hat das Feld gesehen und vier Dinge entschieden, nachdem
[IPL-0051](PATCH-LOG.md#ipl-0051--block-8-der-funk-wird-zum-funkgerät-er-startet-geschlossen)
das Funkgerät gebaut hatte:

- **Das Funkgerät ist weg** – Handapparat, Log und Ungelesen-Zähler, das ganze
  in [IPL-0051](PATCH-LOG.md#ipl-0051--block-8-der-funk-wird-zum-funkgerät-er-startet-geschlossen)
  gebaute Menü. Begründung des Betreibers: der Schließen-Knopf stand zu weit
  über das Fenster hinaus, und Handapparat samt Fenster lagen über dem
  Kartennamen und den Spielmodi. *„Wir entfernen den Radio button und das gerade
  gebaute Menü gänzlich – minimalismus is fine.“*
- **Eine Meldung bleibt, von oben.** Was wichtig ist, flattert **unter der
  Statusleiste** herein, bleibt kurz und geht von selbst wieder: Bosse, die den
  Bunker treffen, gebrochenes Eis, beseitigte Trümmer, Schlamm – und alles, was
  der Spieler angefordert und nicht bekommen hat. Sie nimmt **keine Tipps an**
  (`pointer-events:none`) und hat keinen Knopf; ihre eigene Uhr (6 s) und eine
  kurze Warteschlange (drei, „+N mehr“) bewegen sie weiter. Damit ist die alte
  Warnkarte oben angekommen und die dauerhafte Funkzeile verschwunden.
- **Die Statusleiste ist aufgeräumt:** der Erfahrungsbalken, das „10 / 300“ und
  das „noch 290 bis Stufe 3“ sind weg – *„Sieht wild aus.“* Die Stufe selbst
  bleibt stehen: eine Zahl, kein Charakterbogen. (Balken und Zahlen stehen
  weiter in der Kommandozentrale und im Bericht, wo Platz dafür ist.)
- **Die Flagge ist weg**, samt Popover „NEXT WAVE“: *„Man benutzt es eh nie.“*
- **Der Menü-Knopf ist nach unten gewandert** in die Befehlsleiste, zwischen
  TEMPO und EINSATZ BEENDEN, wo die anderen Bedienelemente sind – vorher saß er
  oben rechts unter der Flagge, wo ihn niemand gesucht hat. Ausgeschrieben
  „MENÜ“, wo die Leiste Platz hat; wird es eng (≤ 430 px, gemessen im Browser),
  bleiben drei Striche übereinander. Das Panel öffnet sich nach **oben**, damit
  es nicht unter dem eigenen Daumen sitzt.
- **Warum die Meldung von oben und nicht in eine Ecke:** die unteren Ecken
  gehören dem Fähigkeitsknopf, der Zoom-Spalte und der Befehlsleiste, und die
  Mitte des Feldes ist der Ort, an dem gekämpft wird. `top` folgt der gemessenen
  Unterkante der Statusleiste (`--map-hud-bottom`), damit die Meldung nie über
  sie kriecht; die Boss-Karte rückt dafür um 28 px nach unten.
- **Prüfungen:** `field-alert.mjs` → **`field-notice.mjs`** (die Karten-Ids
  heißen `#fieldNotice*`); `tests/field-notice.test.mjs` **8/8** (Turnus mit
  gehaltener Uhr, kein Knopf, Warteschlange neueste zuerst, Sprachwechsel,
  fehlende Knoten, und die Vertragsliste: für genau diese Meldungen wird eine
  Meldung erhoben). `tests/battle-xp-hud.test.mjs` neu geschrieben **5/5** – die
  Stufe bleibt, die XP-Möbel sind weg, inklusive Wächter, dass sie nicht
  zurückkommen. Der Prüfstand im echten Chromium (`interface-smoke.cjs`) misst
  neu: Flagge, XP-Balken, Handapparat und Log sind **nicht mehr im Dokument**;
  die Meldung hängt unter der Statusleiste, bleibt im Rahmen, ist eine Karte und
  keine Fahne, ist zentriert und **lässt jeden Tipp durch**; der Menü-Knopf
  sitzt zwischen TEMPO und EINSATZ BEENDEN, ist ein 44-px-Ziel, zeigt auf dem
  Telefon den Burger (drei Striche) und auf dem Schreibtisch das Wort, und sein
  Panel öffnet nach oben und bleibt im Rahmen. `wave-consensus.cjs` liest den
  Kampfstatus wieder aus dem Live-Bereich (`textContent`, nicht `innerText` –
  der Bereich ist mit Absicht unsichtbar), `multiplayer-fullscreen.cjs` wartet
  auf `#fieldNoticeText`. Vollständiger serieller Lauf **1098 bestanden, 0
  fehlgeschlagen**.
- **Änderungen / Dateien:** `field-notice.mjs` (aus `field-alert.mjs`),
  `field-radio.mjs` und `tests/field-radio.test.mjs` **entfernt**,
  `index.html`, `field-command.css`, `style.css`, `interface-redesign.css`,
  `game.js`, `battle-xp-hud.mjs`, `localization-de.mjs`,
  `localization-static-de.mjs`, `tests/field-notice.test.mjs` (aus
  `field-alert.test.mjs`), `tests/battle-xp-hud.test.mjs`,
  `tests/ability-hud-placement.test.mjs`, `tests/ability-hud-ui.test.mjs`,
  `tests/coop-ui.test.mjs`, `tests/solo-smoke.test.mjs`, elf Test-Harnesse,
  `browser-tests/interface-smoke.cjs`, `browser-tests/wave-consensus.cjs`,
  `browser-tests/multiplayer-fullscreen.cjs`,
  `browser-tests/command-center.cjs`, `browser-tests/multiplayer-field.cjs`.
- **Grenzen:** **Kein Mensch hat das Ergebnis gesehen.** Wer eine Meldung
  verpasst, weil er gerade nicht hinschaut, hat keine zweite Chance mehr – es
  gibt kein Log, in dem sie stünde. Das ist gewollt („minimalismus is fine“);
  falls es zu wenig ist, ist der Zähler aus IPL-0051 die erste Idee, die wieder
  hervorgeholt werden sollte.

## IPL-0054 – Block 4: Das Gesicht reist mit (13 Porträts wählbar, Übergabe an den Server)

Der Betreiber hat Block 4 aufgerufen („Patch Block 4, lets gooo“) und die drei
offenen Fragen vorab entschieden:

- **„Vorhandene 13 Porträts freischalten“** – kein neues Bildmaterial, sondern
  das, was gemalt ist, auswählbar machen.
- **„Alle Kombinationen erlauben“** – Haar- und Bart-Layer dürfen auf **jedes**
  Gesicht, auch auf eines, das schon eine Frisur trägt; eigene Haare, die unter
  einem Layer hervorschauen, sind kein Fehler.
- **„Ja, vorbereiten“** – der Rules-Kandidat für das Gesicht gehört in diesen
  Block. Das Veröffentlichen bleibt seine Sache.

Gebaut:

- **Alle 13 gemalten Porträts sind Gesichter.** Bisher waren es fünf: drei
  weibliche (`crop`, `bun`, `slick`) und zwei männliche (`buzz`, `short`). Der
  Generator `tools/build-layers.mjs` trägt jetzt alle 13 Dateien aus
  `assets/portraits/` als Gesichter ein, nummeriert sie selbst
  (`Gesicht 1 … 7` / `Gesicht 1 … 6`) und misst zu jeder das Gesichtsfeld mit
  demselben pico.js-Detektor, den die Layer schon nutzen – die Layer richten
  sich darüber selbst aus, deshalb passen die vorhandenen zwölf Overlays ohne
  Nacharbeit auf jedes neue Gesicht. Der neue Durchlauf hat alle zwölf Overlays
  **Bit für Bit identisch** wieder erzeugt; geändert hat sich nur das Manifest.
  Die Reihenfolge bleibt vorn bei `crop` bzw. `buzz`, weil das der Schnitt ist,
  den jeder Haar-Layer überdeckt und den „BASIS-FRISUR“ zeigt. Die Auswahl ist
  weiter ausgeglichen: **14 Kacheln je Geschlecht**.
- **Das Gesicht kommt auf den Server.** Bisher lag es – außer bei ganz neuen
  Soldaten, deren Schreiben von den veröffentlichten Regeln abgelehnt wird – im
  localStorage-Spiegel und sonst nirgends: kein zweites Gerät, keine
  Freundesliste, keine Party konnte es je zeigen. Neu ist `avatar-sync.mjs`:
  beim Laden des Profils entscheidet es am **ersten Schnappschuss der Sitzung**
  einmalig, ob ein Gesicht fehlt, und übergibt es dann – verschwindet ein
  Gesicht später in derselben Sitzung (etwa bei Bereinigung), wird es nicht
  still zurückgeschrieben. Ein Wert auf dem Server gewinnt immer (ein anderes
  Gerät darf neuer sein); eine abgelehnte Übergabe ist **kein Fehler**, sondern
  der heutige Zustand – der Spiegel behält das Gesicht, und die nächste Sitzung
  versucht es wieder. Sobald die Regeln das Feld kennen, folgt das Gesicht
  jedem zurückkehrenden Soldaten, ohne ein weiteres Client-Update.
- **Das Dossier zieht mit.** Kam ein Gesicht während der Sitzung an (die
  Übergabe, ein anderes Gerät), blieb das alte Bild bis zum Neuladen stehen.
  Der Profil-Horchposten lässt das Porträt jetzt neu zusammensetzen – und zwar
  **bevor** das Menü neu zeichnet, damit die Kommandozentrale das neue Gesicht
  zeigt und nicht das vorige.
- **Der Rules-Kandidat kann das Feld auch anlegen.** `friend-portrait-candidate.mjs`
  war reine Lese-Erlaubnis: er setzte `.read` auf `gender` und `avatar` und
  lehnte eine Basis ohne `avatar` ab. Genau eine solche Basis ist aber
  veröffentlicht – deshalb frisst die Auffangregel (`$other`, `.validate:false`)
  jeden Schreibversuch, und `account.js` muss ihn verschlucken. Der Kandidat
  legt das Feld jetzt **an**, mit derselben Prüfung, die die Referenz, der
  Block-2-Entwurf und der Staging-Entwurf tragen (Zeichenkette, 8–64 Zeichen),
  und lehnt eine Basis, die schon eine **andere** Avatar- oder
  Freundes-Regel hat, weiterhin laut ab – zwei Schreibweisen derselben
  Erlaubnis sind, wie ein Ruleset auseinanderläuft.

Prüfungen:

- Vollständiger serieller Lauf `node --test IronPath/tests/*.test.mjs`:
  **1130 bestanden, 0 fehlgeschlagen, 1 absichtlich übersprungen**.
- `tests/avatar-layers.test.mjs` **6/6** – 13 Gesichter (7 weiblich, 6 männlich),
  gleiche Kachelzahl je Geschlecht, und ein neuer Prüfschritt vergleicht den
  Porträtordner mit dem Manifest: **kein gemaltes Porträt bleibt liegen**.
- `tests/avatar-sync.test.mjs` neu **13/13** – Spiegel wird übergeben, ohne
  Spiegel kommt die Vorgabe des Geschlechts (nie ein anderes Gesicht als das
  gezeigte), ein Serverwert wird nie überschrieben, ein erst im Lauf derselben
  Sitzung entferntes Gesicht wird nicht still zurückgeschrieben, genau ein
  Versuch je Sitzung, eine abgelehnte Übergabe ist kein Fehler, Abmeldung und
  Charakterlöschung starten die nächste Sitzung sauber, und drei
  Quelltext-Verträge nageln die Verdrahtung in `account.js` fest.
- `tests/friend-portrait-rules.test.mjs` **5/5** – der Kandidat ändert an der
  Referenz weiterhin nur die zwei Lese-Rechte; eine Basis ohne Feld bekommt
  genau Feld plus Lese-Recht und sonst nichts; die Prüfzeile stimmt byteweise
  mit Referenz, Block-2-Entwurf und Staging-Entwurf überein; doppeltes Anwenden
  und abweichende Basen werden abgelehnt; und **jedes** Gesicht, das der Client
  erzeugen kann (Vorgaben und 80 Zufallswürfe), liegt innerhalb der Grenzen.
- `firebase/rules-test/friend-portrait.test.mjs` (Emulator, CI): zwei neue
  Prüfungen – der Besitzer darf das Gesicht speichern und nichts anderes (zu
  kurz, zu lang, kein Text, Löschen, fremde und abgemeldete Schreiber werden
  abgelehnt) und jede vom Client erzeugte Kombination wird angenommen. Dazu
  eine **vierte Basis** `FRIEND_PORTRAIT_NOFIELD=1`: eine Regel, die das Gesicht
  nie kannte. Nur sie beweist, dass das angelegte Feld wirklich schreibbar ist.
- `tests/browser-doubles.test.mjs` neu **3/3** – jeder Firebase-Double in
  `browser-tests/` wird so geparst wie der Browser es tut (siehe unten).
- `browser-tests/avatar-handover.cjs` neu (Chromium, CI): das echte Konto mit
  einem Profil **ohne** Gesicht und einem Spiegel im Speicher. Geprüft wird: das
  Konto startet in beiden Fällen; die Übergabe kommt **genau einmal** und mit
  dem Gesicht, das dieses Gerät zeigt; sie rührt den Namen nicht an; und das
  Soldatendossier zeigt in beiden Fällen das **zusammengesetzte** Gesicht
  (`data:image/png`), nicht die Platzhalter-Datei des Geschlechts – auch dann,
  wenn die Regel das Schreiben ablehnt.
- **Grenzen:** Die Emulator- und Chromium-Prüfungen laufen erst in der CI; lokal
  fehlt die Java-Laufzeit für den Datenbank-Emulator und Chromium. Dieser
  Eintrag wird nach dem CI-Lauf um das belegte Ergebnis ergänzt.

Änderungen / Dateien: `tools/build-layers.mjs` und
`IronPath/assets/layers/manifest.mjs` (13 Gesichter, neue Layer-Welle
`20261118-faces13`); `IronPath/avatar-sync.mjs` (neu) samt
`tests/avatar-sync.test.mjs` (neu) und `tests/browser-doubles.test.mjs` (neu); `account.js` (Übergabe im
Profil-Horchposten, Porträt vor dem Neuzeichnen); `localization-de.mjs`
(`Gesicht 4`–`Gesicht 7`); `firebase/friend-portrait-candidate.mjs` (Feld
anlegen, einheitliche Freundes-Bedingung) samt
`tests/friend-portrait-rules.test.mjs` und
`firebase/rules-test/friend-portrait.test.mjs`; `browser-tests/avatar-handover.cjs`
(neu) und `.github/workflows/ironpath-firebase-rules.yml`;
`tests/avatar-layers.test.mjs`, `tests/avatar.test.mjs`
(tiefster Wurf landet auf dem letzten Gesicht), `tests/recruit-screen.test.mjs`
(sieben Gesichter; die deutschen Beschriftungen werden jetzt aus dem Manifest
abgeleitet statt aufgeschrieben), `tests/workshop-alpha-wiring.test.mjs`,
`browser-tests/cache-wave.cjs` und `firebase/rules-test/social-cleanup-browser.cjs`
(neue Welle der Porträtmodule).

Was mich der Cache-Test wieder gelehrt hat: `avatar.mjs`, `avatar-layers.mjs`
und das Manifest liegen nicht auf der Veröffentlichungswelle, deshalb durften
sie auf eine eigene Welle – aber **alle** ihre Importeure mussten mit
(`account.js`, `recruit-screen.mjs`, `friend-portrait.mjs`, `avatar.mjs` selbst,
die neue Übergabe und die beiden Prüfstände), damit nirgends zwei Fassungen
nebeneinander im Cache liegen. `account.js` selbst hängt dagegen am Stempel
`20261031-patch4`: ihn auf eine eigene Welle zu setzen, lehnt
`tests/multiplayer-build-stamp.test.mjs` ab – dieselbe Lektion wie bei
`cartoon-art.mjs` in IPL-0051. **Die Übergabe und die neuen Gesichter kommen
also erst mit dem nächsten Stempel in die Browser**, nicht vorher; der Code
selbst ist fertig und geprüft.

Grenzen / Offen:

- **Kein Mensch hat die neuen Gesichter gesehen.** Ich habe kein Augenlicht. Der
  Kontaktbogen `IronPath/browser-artifacts/avatar-faces.png` zeigt alle 13
  Gesichter in einer Zeile je Gesicht: ganz links der eigene Schnitt, daneben
  jeder Haar-Layer, daneben jeder Bart. Die Maschine hat gemessen, dass alle 13
  Bilder quadratisch sind und dass die Gesichtsfelder zwischen 34,6 % und
  46,2 % Bildbreite liegen (die größte Abweichung ist der weibliche Dutt mit
  43,6 % Mitte) – ob die Kombinationen „hochwertig und stimmig“ sind,
  entscheidet erst der Blick des Betreibers.
- **Die Regeln sind nicht veröffentlicht.** Kandidat und Prüfungen stehen; bis
  zur Veröffentlichung bleibt das Gesicht ein Gerät pro Soldat. Der Betreiber
  veröffentlicht.
- **Die Qualitätsfrage ist damit nicht beantwortet**, nur die Grundlage
  verbreitert: 13 statt 5 Gesichtern, gleiche Auswahl für beide Geschlechter.
  Der Punkt „6–10 hochwertige, stimmige Looks“ bleibt offen, bis ein Mensch den
  Bogen beurteilt hat.
- **Die FELDNOTIZEN im Spiel bleiben unberührt.** Sie zeigen Spielern, was live
  ist. Von diesem Schritt ist nichts live – nicht bevor die Regeln veröffentlicht
  sind und der nächste Stempel ausgeliefert wird –, darum steht dort auch
  weiterhin nur der alte Punkt. Das ist Absicht und kein Vergessen.

## IPL-0055 – Merge #313, Block-4-Rules-Datei und Browser-/Handy-Abnahme des Betreibers

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum `2026-10-31 UTC`;
  GitHub-Ereignisse zu PR #313 mit Zeitstempel `2026-11-18T06:31:26Z`.
- **Block / Ziel:** Nachtrag zum in `IPL-0054` noch offenen CI-/Merge-Ergebnis
  von PR #313, Abgleich gegen die live exportierten Firebase-RTDB-Rules samt
  Erstellung der kopierfertigen Block-4-Rules-Datei sowie Fortschreibung der
  Abnahmen und Fortschrittsübersicht in `PATCH-BLOECKE.md`.
- **Branch / Basis:** `arena/7aff6629-0815games-github-io`, Basis
  `9e26739792ff9ca1c427abe9b7218705b299b343` (`main` nach Merge von PR #313).
- **Git / PR / Deployment zu #313:** [PR #313](https://github.com/0815games/0815games.github.io/pull/313)
  (Head `be9d1a4`) bestand alle 23 Check-Runs (`success`) und wurde am
  `2026-11-18T06:31:26Z` auf `main` unter
  `9e26739792ff9ca1c427abe9b7218705b299b343` gemergt. Die anschließenden
  `main`-Workflows `pages build and deployment` (`44251965579`) und
  `Iron Path Firebase party rules` (`44251966623`) bestanden alle 14
  Check-Runs (`success`). *(Nachtrag zu `IPL-0054`.)*
- **Live-Rules-Abgleich & kopierfertige Rules-Datei:** Der Betreiber legte den
  Live-Export seiner aktiven Firebase-RTDB-Rules vor. Bestätigt live vorhanden
  sind `firebase/WORKSHOP-RULES-TO-PUBLISH.json` (inklusive
  `players/$uid/avatar['.validate']`), alle 5 `.write`-Ausdrücke aus
  `firebase/social-cleanup-candidate.mjs` sowie das Wartungs-Gate aus
  `release-tools/maintenance-rules.mjs` mit der konfigurierten Betreiber-Admin-UID
  (UID hier gemäß Protokollregel nicht abgedruckt). Darauf aufbauend wurde
  lokal (untracked, außerhalb von Git)
  `IronPath/browser-artifacts/firebase-rtdb-rules-ready.json` über
  `buildMaintenanceRulesCandidate(buildFriendPortraitCandidate(WORKSHOP-RULES-TO-PUBLISH.json), ...)`
  erzeugt. Gegenüber dem rekonstruierten Live-Modell ergänzt die Datei exakt
  zwei friend-scoped `.read`-Regeln (`players/$uid/gender['.read']` und
  `players/$uid/avatar['.read']`, jeweils mit `MAINTENANCE_GATE`). `characterNames`
  bleibt bewusst ausgeklammert, weil `character-name-claim.mjs` bei aktivem
  `characterNames`-Pfad den `friendNames`-Fallback überspringt und dafür zuerst
  die Bestandsaufnahme nach `firebase/CHARACTER-NAME-AUDIT.md` nötig ist.
- **Betreiber-Abnahme (Browser & Mobil):** Der Betreiber bestätigte nach eigenen
  Tests im Browser und auf dem Handy, dass bislang keine Verbesserungen nötig
  waren und alle seine Tests gut liefen. Die entsprechenden
  Browser-/Handy-Sichtungs- und Bedienpunkte in `PATCH-BLOECKE.md` wurden
  als vom Betreiber getestet abgehakt (`[x]`); ungebauter Funktionsumfang
  (insbesondere Block 5, 6, 7 sowie `C`-Einsteigerbalance und dauerhaft
  fehlende Gruppenmitglieder in Block 1), Altbestands-/Namens-Audit (`A1`),
  CI-Wiederholungspolitik (`Block 8`) und ausstehende Veröffentlichungen
  bleiben getrennt als offen geführt.
- **Änderungen / Dateien:** `IronPath/PATCH-LOG.md` (doppelten Abschnitt
  `IPL-0039` entfernt, `IPL-0055` ergänzt), `IronPath/PATCH-BLOECKE.md`
  (Schnellübersicht, Prozent-/Standangaben und Betreiber-Abnahme-Haken
  aktualisiert), `IronPath/browser-artifacts/firebase-rtdb-rules-ready.json`
  (untracked Auslieferungsartefakt für die Firebase Console). `patch-notes.mjs`
  bleibt unverändert auf Stempel `20261031-patch4`, solange kein neuer
  Build-Stempel ausgerollt wird (`IPL-0054`).
- **Prüfungen:**
  - Struktur-/Diff-Prüfung auf `firebase-rtdb-rules-ready.json`: gültiges JSON,
    kein `(?:...)` (RE2), `compareRules` gegen das rekonstruierte Live-Modell
    `0` Blocker / `0` Warnungen / `0` fehlende Pfade; exakter symmetrischer Diff
    nur `rules.players.$uid.gender..read` und `rules.players.$uid.avatar..read`;
    `compareRepoDrafts` deckt 15/15 `*.complete.draft.rules.json`-Entwürfe ab.
  - `node --test`: **27/27 bestanden** (`friend-portrait-rules.test.mjs`,
    `social-cleanup-rules.test.mjs`, `publish-rules-contract.test.mjs`,
    `maintenance-check.test.mjs`, `maintenance-rules-prep.test.mjs`,
    `multiplayer-build-stamp.test.mjs`, `module-syntax.test.mjs`,
    `release-site-packaging.test.mjs`) sowie zuvor **44/44 bestanden** inkl.
    `character-name.test.mjs`, `character-rename.test.mjs`,
    `release-production-rules-prep.test.mjs` und `release-rules-candidate.test.mjs`.
  - Grenzen: Der vollständige `IronPath/tests/*.test.mjs`-Glob lief im
    120s-Bash-Timeout nicht bis zum Ende durch; lokale Emulator-/Chromium-Läufe
    benötigen Java/Chromium und liefen in der CI auf `main` (`9e26739`) grün.
- **Git / PR / Release:** `lokal/uncommittet` auf
  `arena/7aff6629-0815games-github-io` (`firebase-rtdb-rules-ready.json` bleibt
  absichtlich untracked). Veröffentlichung der Rules-Datei in der Firebase
  Console und ein künftiger Build-Stempel-Release für `account.js` liegen
  weiter beim Betreiber.
- **Offen / nächster Schritt:** Rules-Datei in der Firebase Console veröffentlichen
  (vorher aktuelles Live-Backup sichern), danach für gecachte Browser bei
  Bedarf neuen Build-Stempel ausrollen, fehlende Restpunkte aus Blöcken 1–2
  entscheiden (dauerhaft abwesende Party-Mitglieder, Einsteigerbalance `C`,
  `CHARACTER-NAME-AUDIT.md`) und anschließend gemäß Reihenfolge Block 5 starten.

## IPL-0056 – Block-4-Rules veröffentlicht; Layer-Geisterbild im Avatar-Baukasten belegt

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum `2026-10-31 UTC`;
  Betreiberrückmeldung aus dieser Sitzung.
- **Block / Ziel:** Live-Veröffentlichung der vorbereiteten Firebase-RTDB-Rules
  protokollieren und die Ursache für das gemeldete Durchscheinen alter
  Figuren in der Charaktererstellung anhand der tatsächlichen Asset-Dateien
  festhalten.
- **Branch / Basis:** `arena/7aff6629-0815games-github-io`, Basis
  `9e26739792ff9ca1c427abe9b7218705b299b343`.
- **Live-Rules-Status:** Der Betreiber bestätigte, dass die neuen Rules
  (auf Basis von `IronPath/browser-artifacts/firebase-rtdb-rules-ready.json`,
  inklusive `players/$uid/gender['.read']` und `players/$uid/avatar['.read']`)
  jetzt live in Firebase **veröffentlicht** sind. *(Kein unabhängiger
  authentifizierter Abruf aus der Arbeitsumgebung.)*
- **Befund am Avatar-System (visuelle Bildprüfung von 12 Layer-PNGs & 13 Porträts):**
  1. **Alle 12 Layer-PNGs in `IronPath/assets/layers/*.png` enthalten Teile der
     Ursprungsfigur (`f-crop` / `m-buzz`):** Der grobe Pixel-Diff in
     `tools/build-layers.mjs` (`d > 48` innerhalb des großen Rechtecks) hat
     Leucht-/Schattierungs- und Positionsabweichungen der KI-Edits im Gesicht,
     an Augen, Brauen, Nasen, Lippen, Ohren, Hals und Uniformkragen als
     Deckpixel übernommen. Bei Wahl eines anderen Basiskopfes malt der Layer
     dadurch fleckig die alte Figur über das neue Gesicht.
  2. **Ungeeignete Basisköpfe seit #313:** Langhaar-/Bart- und 3/4-Porträts
     (`f-long`, `f-braid`, `f-bob`, `f-ponytail`, `f-bun`, `m-beard`,
     `m-medium`, `m-stubble`) als Basiskopf unter fremden Haaren/Bärten
     lassen alte Haare oder verdrehte Kopfkonturen dahinter stehen.
  3. **Fehlender Render-Abbruch bei schnellen Klicks:** `recruit-screen.mjs`
     (`paintAvatar`) und `avatar-layers.mjs` (`composePortrait`) prüfen bei
     asynchronem Laden keine Render-Generation, sodass ein langsamerer älterer
     Lauf ein neueres Canvas-Bild übermalen kann.
- **Änderungen / Dateien:** `IronPath/PATCH-LOG.md` (`IPL-0056`),
  `IronPath/PATCH-BLOECKE.md` (Block-2-Porträt-Rules auf `[x]`, Block 2 auf
  80 %, Block 4 auf 65 % mit offenem Umbau-Punkt nach Rücksprache).
- **Prüfungen:** Direkte visuelle Sichtung aller 13 `IronPath/assets/portraits/*.jpg`,
  aller 12 `IronPath/assets/layers/*.png` und zweier `tools/raw-edits/*.jpg`
  sowie Code-Inspektion von `tools/build-layers.mjs`, `avatar-layers.mjs` und
  `recruit-screen.mjs`.
- **Git / PR / Release:** `lokal/uncommittet` auf
  `arena/7aff6629-0815games-github-io`.
- **Offen / nächster Schritt:** Entscheidung des Betreibers über die
  Neustrukturierung (reine frontale Basisköpfe ohne störende Haare/Bärte +
  strikt freigestellte Frisuren/Bärte vs. kuratierte fertige Komplettporträts).

## IPL-0057 – Block-4-Avatar-Neubau (Idee 1, Umsetzungsidee A) lokal umgesetzt und geprüft

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum `2026-10-31 UTC`; Uhrzeit der
  Sandbox-Umgebung `2026-11-18`.
- **Block / Ziel:** Block 4 – Vollständige Behebung des Layer-Geisterbilds,
  sauberer Neubau aller Basisköpfe/Haar-/Bart-Layer mit 5 gemeinsamen Farben
  und Umstellung der Charaktererstellung auf direkte `◀ / ▶`-Stepper am Porträt.
- **Branch / Basis:** `arena/7aff6629-0815games-github-io`, Basis
  `9e26739792ff9ca1c427abe9b7218705b299b343`.
- **Änderungen / Dateien:**
  - `tools/raw-edits/*` & `tools/build-layers.mjs`: 35 neue einheitliche
    Quell-Assets aufgebaut (je 6 streng frontale, kahle/glattrasierte
    Basisköpfe `f1..f6` und `m1..m6` mit einheitlichem Comic-Ink-Shading,
    9 silbergraue Damenfrisuren, 8 silbergraue Herrenfrisuren und 6
    silbergraue Herrenbärte inkl. weicher Stubble-Alpha-Extraktion).
    Sicherheitshärtung in `build-layers.mjs`, sodass alte Outputs erst nach
    vollständiger Validierung im Speicher ersetzt werden.
  - `IronPath/assets/portraits/*.jpg` (12 × 512 px), `IronPath/assets/layers/*.png`
    (23 × 512 px saubere Graustufen+Alpha-Masken ohne Gesicht/Augen/Kragen)
    und `IronPath/assets/layers/manifest.mjs` (`LAYER_TOKEN = '20261119-avatar3'`,
    5 `HAIR_COLORS`: `black`, `brown`, `auburn`, `blonde`, `silver`).
  - `IronPath/avatar-layers.mjs`: Laufzeit-LUT-Einfärbung (`tintTone` /
    `stopsForColor`) mit Offscreen-Canvas-Cache und asynchronem
    Render-Token-Schutz (`canvasRenderTokens`) gegen Überholen bei schnellen Klicks.
  - `IronPath/avatar.mjs`: Kodierung inkl. `color:<id>` innerhalb der
    RTDB-Schranke (`11..51` Zeichen bei erlaubten `8..64`), Altsave-Migration
    für sämtliche `look:*`- und #313-`face:*`-Kennungen auf die neuen
    frontalen Basisköpfe (`LEGACY_FACES` / `LEGACY_COMBINATIONS`) sowie
    `randomAvatar()` über alle Farben.
  - `IronPath/friend-portrait.mjs`: `knownAvatar()` erkennt Altbestände und
    neue `color:<id>`-Strings für gemeinsame Freundesporträts.
  - `IronPath/index.html`, `IronPath/style.css`, `IronPath/recruit-screen.mjs`,
    `IronPath/localization-de.mjs`: Kompaktes Layout `Umsetzungsidee A`
    (Geschlechtswahl oben, zentriertes Porträt mit direkten `◀ / ▶`-Pfeilen
    auf Stirn-, Gesichts- und Kinnhöhe, Live-Statusleiste und 5-Punkte-Farbleiste
    ohne Kachelzeilen; vollständige deutsche Lokalisierung).
  - Cache-Welle `?v=20261119-avatar3` auf `avatar*.mjs`, `manifest.mjs`,
    `localization-de.mjs`, `browser-tests/cache-wave.cjs`,
    `browser-tests/avatar-handover.cjs` und `firebase/rules-test/social-cleanup-browser.cjs`
    (der gemeinsame App-Stempel `20261031-patch4` auf `account.js` etc. bleibt
    bis zum eigentlichen Release-Bump konsistent).
  - Tests aktualisiert und erweitert: `IronPath/tests/avatar.test.mjs`,
    `avatar-layers.test.mjs`, `avatar-sync.test.mjs`, `friend-portrait.test.mjs`,
    `recruit-screen.test.mjs`.
- **Prüfungen:**
  - Visuelles Kontaktblatt (`tools/verify-roster.png`, nach Prüfung entfernt):
    alle 12 Köpfe, 17 Frisuren, 6 Bärte und 5 Farben über helle und dunkle
    Hauttöne ohne Geisterbild, Doppelbrauen oder Kragenreste bestätigt.
  - `node tools/build-layers.mjs`: alle 12 `pico.js`-Gesichtschecks + 23 Masken
    bestanden (`manifest.mjs` mit 12 Köpfen, 17 Haaren, 6 Bärten).
  - Unit-/Integrationsläufe `IronPath/tests/*.test.mjs`: alle geprüften Dateien
    bestanden (gezielter Lauf der geänderten/betroffenen Suiten: 157/157 pass,
    0 fail, 1 erwarteter Skip in `release-pages-site.test.mjs`;
    `translation-coverage.test.mjs` ohne fehlende oder doppelte Keys).
  - **Grenzen:** Kein Live-Chromium/Firebase-Emulator-Browsertest im
    Sandbox-Lauf mangels lokal installiertem Playwright-Browser; visuelle
    Browser-Stichprobe von `recruit-screen` steht beim Review aus.
- **Git / PR / Release:** `lokal/uncommittet` auf
  `arena/7aff6629-0815games-github-io`.
- **Offen / nächster Schritt:** Browser-/Geräteabnahme des neuen
  Rekrutierungsbildschirms und anschließender Release-Build-Stempel (damit
  `account.js` die neue Schicht in bestehende Browser ausrollt), danach
  Block 5 (Skills) bzw. Block 1-Restpunkte.

## IPL-0058 – Block-4-Build-Stempel 20261031-patch5 und vollständige Vor-PR-Prüfung

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum `2026-10-31 UTC`; Uhrzeit der
  Sandbox-Umgebung `2026-11-18`. Betreiberfreigabe über Rückfrage („Block 4
  fertigstellen: Stempel + Commit/PR").
- **Block / Ziel:** Gemeinsamen App-Build-Stempel von `20261031-patch4` auf
  `20261031-patch5` anheben, damit zurückkehrende gecachte Browser `index.html`,
  `style.css`, `account.js`, `recruit-screen.mjs`, `friend-portrait.mjs` und
  die damit verbundene `?v=20261119-avatar3`-Schicht konsistent neu laden;
  anschließende Vollprüfung vor Commit und PR-Eröffnung.
- **Branch / Basis:** `arena/7aff6629-0815games-github-io`, Basis
  `9e26739792ff9ca1c427abe9b7218705b299b343`.
- **Änderungen / Dateien:**
  - `IronPath/release-version.json` (`20261031-patch5`), `IronPath/index.html`
    (`meta[name="ironpath-build"]`, beide `BUILD`-Stempel, `style.css`,
    `friend-placeholder.svg`, `intro.mjs`, `account-entry.mjs`),
    `IronPath/account-entry.mjs`, `IronPath/account.js` sowie alle 41 weiteren
    Module derselben gemeinsamen Cache-Welle auf `?v=20261031-patch5` gehoben.
  - `IronPath/patch-notes.mjs` (`language.mjs?v=20261031-patch5` sowie
    `RELEASED_PATCHES[0].build = '20261031-patch5'`, ohne ungemergten PR
    vorwegzunehmen) und `IronPath/tests/patch-notes.test.mjs`.
  - `IronPath/browser-tests/avatar-handover.cjs` (`account.js?v=20261031-patch5`)
    und `IronPath/browser-tests/cache-wave.cjs` (`20261031-patch4`-URLs in
    `oldUrls` ergänzt).
  - `IronPath/PATCH-BLOECKE.md`: Schnellübersicht und Block-4-Abschnitt auf
    den `20261031-patch5`-Stand nachgezogen. (`IronPath/browser-artifacts/firebase-rtdb-rules-ready.json`
    bleibt bewusst lokal untracked und wird nicht mitcommittet.)
- **Prüfungen (nach dem Stempel-Bump ausgeführt):**
  - Gezielte Wave-/Avatar-/UI-/Packaging-Suite (**97 / 97 bestanden**, `0`
    Fehler, inkl. `multiplayer-build-stamp`, `build-stamp`, `patch-notes`,
    `version-check`, `version-ui`, `loading-scene`, `dom-contract`,
    `browser-doubles`, `workshop-alpha-wiring`, `translation-coverage`,
    `module-syntax` über `227` Module, `release-stage-version`,
    `release-site-packaging`, `avatar*`, `recruit-screen`, `friend-portrait`).
  - Vollständiger Lauf aller **252 Testdateien** in `IronPath/tests/*.test.mjs`
    in drei Batches (`[a-l]`, `[m-r]`, `[s-z]`): alle `252` Dateien bestanden
    (`0` Fehler).
  - `node IronPath/stress-tests/run.mjs`: alle Solo-/Koop-/Versus-/3er-/4er-/
    2v2-/Dichte-/Karten- und Protokoll-Workloads bestanden (`500` Karten,
    `40..200` Reconnect-Zyklen).
  - **Grenzen:** `IronPath/release-tools/runtime-compatibility.test.mjs` &
    `session-config.test.mjs` benötigen dort nicht lokal installierte
    `firebase-admin`-Abhängigkeiten (`npm ci --prefix IronPath/release-tools`
    läuft in CI); Chromium-/Firebase-Emulator-Tests laufen mangels lokalem
    Browser/Java anschließend in der GitHub-Actions-PR-CI.
- **Git / PR / Release:** Commit- und PR-Vorbereitung abgeschlossen (`lokal
  vor Commit`).
- **Offen / nächster Schritt:** Commit & Push auf
  `arena/7aff6629-0815games-github-io`, PR gegen `main` eröffnen, CI-Läufe
  beobachten und nach Merge/Pages-Rollout echte Geräteabnahme im Browser und am
  Handy durchführen (danach `patch-notes.mjs` um den belegten Block-4-Release
  ergänzen).

## IPL-0059 – PR #314 eröffnet; CI-Befund an version.html (#r2) behoben

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum `2026-10-31 UTC`;
  GitHub-Ereignisse zu PR #314 am `2026-11-18`.
- **Block / Ziel:** Nachtrag zum tatsächlichen Commit/Push/PR #314 sowie
  Behebung des in CI (`interface-browser-smoke`) festgestellten Fehlers an
  `IronPath/version.html`.
- **Branch / PR / Commit:** `arena/7aff6629-0815games-github-io`, Commit
  `c5d0cb6` gepusht und [PR #314](https://github.com/0815games/0815games.github.io/pull/314)
  gegen `main` eröffnet.
- **Erster CI-Lauf (`44292094881`):**
  - **Bestanden:** `database-rules`, `game-regressions`, alle 8 Jobs der
    `party-finalization-browser`-Matrix sowie die Vercel-Preview-Prüfung. In
    `interface-browser-smoke` bestanden u. a. `interface-smoke.cjs`,
    `command-center.cjs`, `cache-wave.cjs`, `friends-sections.cjs`,
    `character-discharge.cjs` und `avatar-handover.cjs` (`synced` + `refused`).
  - **Fehlgeschlagen:** `release-gates.cjs:308` meldete Timeout auf `#r2.ok`
    in `IronPath/version.html`: die Diagnoseseite prüfte noch die alte
    CSS-Regel `.recruit-look canvas` statt der neuen `.recruit-stage`-,
    `.recruit-step`- und `.recruit-color-dot`-Klassen von `Umsetzungsidee A`.
- **Änderungen / Dateien:** `IronPath/version.html` (`#r2` prüft jetzt
  `.recruit-showcase`, `.recruit-stage`, `.recruit-step` und
  `.recruit-color-dot`), `IronPath/tests/recruit-screen.test.mjs` (Regressionstest
  gegen veraltete Selektoren in `version.html`) sowie `IronPath/PATCH-LOG.md`
  (`IPL-0059`).
- **Prüfungen:** `node --test IronPath/tests/recruit-screen.test.mjs` und
  relevante Regressionssuiten nach der Anpassung ausgeführt (siehe erneuter
  PR-Push); vollständige Chromium-Suite läuft im Anschluss in PR-#314-CI.
- **Offen / nächster Schritt:** Fix-Commit auf `arena/7aff6629-0815games-github-io`
  pushen, grünen Abschluss aller CI-Checks auf PR #314 bestätigen und an
  den Betreiber zum Merge/Testen übergeben.

## IPL-0060 – PR #314 gemerged (20261031-patch5); Live-Befund am #versionNotice-Popup

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum `2026-10-31 UTC`;
  GitHub-/Live-Ereignisse am `2026-11-18`.
- **Block / Ziel:** Nachvollziehbarer Nachtrag zu Commit `c0a5041`, PR-#314-Merge
  und Live-Pages-Deployment sowie Dokumentation des beim Live-Test von
  `20261031-patch5` gemeldeten Layoutfehlers am `#versionNotice`-Popup.
- **Git / CI / Live-Status:**
  - Commit `c0a5041` auf `arena/7aff6629-0815games-github-io` brachte alle 13
    PR-Checks (Run `44293352808`) zum Bestehen.
  - [PR #314](https://github.com/0815games/0815games.github.io/pull/314) wurde
    als Merge-Commit [`533d1dbf`](https://github.com/0815games/0815games.github.io/commit/533d1dbfc6155f8b998075319cc70e0d044e85cf)
    in `main` übernommen; `pages-build-deployment` (Run `44295548602`) sowie
    die anschließende `main`-CI (Run `44295549826`, alle `11 / 11` Jobs inkl.
    `interface-browser-smoke`, `database-rules`, `game-regressions` und der
    8er-`party-finalization-browser`-Matrix) liefen vollständig grün durch.
- **Gemeldeter Live-Befund (`20261031-patch5`):**
  - Auf dem Live-Screenshot von `20261031-patch5` erschien das mittig
    positionierte `#versionNotice`-Popup („New version 20261031-patch5 loaded.“)
    mit Wort-für-Wort vertikal umgebrochenem Text (`New / ve... / 20... /
    patch5 / loaded.`), einem nach rechts überlaufenden/überlappenden
    `DISMISS`-Button und horizontalem Scrollbalken.
  - Ursache im CSS-Kaskadenaufbau: `IronPath/style.css:1` setzte global
    `button,select{width:100%;margin-bottom:8px}`, und `.version-notice button`
    (`flex:none`, ohne `width:auto;margin:0`) zwang `#versionNoticeDismiss`
    innerhalb der einzeiligen `.version-notice`-Flexbox auf volle Kartenbreite,
    wodurch `#versionNoticeText` auf wenige Pixel zusammengedrückt wurde.
    Zudem vergaß `body:has(#gameWorkspace:not([hidden])) .version-notice` ein
    `transform:none` gegen das `translate(-50%,-50%)` aus `popup-center.css`.
  - Wunsch des Betreibers: Popup-Rahmengröße beibehalten, Überlappung /
    vertikales Zerbrechen / Scrollbalken beseitigen und eine zum Thema „neue
    Version“ passende Iron-Path-Spielstil-Artwork einfügen.
- **Offen:** Fix umsetzen, testen, als neue Cache-Welle bereitstellen und auf
  echtem Gerät verifizieren.

## IPL-0061 – version-notice Layoutfix und Dispatch-Artwork 20261031-patch6 lokal

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum `2026-10-31 UTC`;
  Arbeitsbranch `arena/881f3e73-0815games-github-io` ab `main` (`533d1dbf`).
- **Block / Ziel:** Behebung des in `IPL-0060` dokumentierten `#versionNotice`-
  Layoutfehlers, Integration einer passenden Iron-Path-Artwork sowie
  Synchronisierung von `patch-notes.mjs` und Cache-Welle `20261031-patch6`,
  damit Live-Nutzer von `20261031-patch5` automatisch frisches CSS, Bild und
  die sichtbare „Neue Version … geladen“-Meldung im korrigierten Layout erhalten.
- **Änderungen / Dateien:**
  - `IronPath/assets/version-dispatch.jpg`: neue `1376×768`-JPG-Illustration im
    Iron-Path-Comic-Ink-Stil (Ausguck über das Nebeltal mit Bunker bei
    Sonnenaufgang, leuchtender Laterne, Feldfunkgerät, Karte und Feldakte,
    ohne eingebetteten Text).
  - `IronPath/index.html`: `#versionNotice` um `.version-notice-art` (`img` +
    übersetzter Gold-Kicker `data-i18n-text="FIELD DISPATCH"`),
    `.version-notice-body` und `.version-notice-actions` erweitert; alle
    bisherigen IDs (`#versionNotice`, `#versionNoticeText`,
    `#versionNoticeRetry`, `#versionNoticeDismiss`) bleiben unverändert.
  - `IronPath/localization-more-static-de.mjs`: deutscher Eintrag
    `"FIELD DISPATCH": "FELDDEPESCHE"` ergänzt.
  - `IronPath/style.css`: vertikaler Kartenaufbau für `.version-notice`
    (`flex-direction:column`, Rahmengröße `min(460px, calc(100vw - 24px))`
    aus `popup-center.css` unverändert erhalten ohne dessen 4-Regel-Vertrag zu
    verletzen), `16/7`-Banner-Crop (`border-radius:7px 7px 0 0`), volle
    Textbreite für `#versionNoticeText` (`overflow-wrap:anywhere`),
    `.version-notice-actions`-Ausblendung ohne sichtbare Buttons,
    `width:auto;margin:0;min-height:44px` für die Aktionsbuttons samt goldenem
    `.primary`-Stil für `#versionNoticeDismiss`, Mobilregeln (`<=480px`) sowie
    Kompakt-Streifen im aktiven Kampf (`#gameWorkspace:not([hidden])`:
    `transform:none`, ausgeblendete Artwork, saubere Eckenpositionierung).
  - `IronPath/tests/version-ui.test.mjs` &
    `IronPath/browser-tests/interface-smoke.cjs`: Regressionstests gegen
    horizontales Überlaufen, gequetschte Textbreite, Button-Überlappung und
    Artwork-Laden ergänzt.
  - `IronPath/patch-notes.mjs`, `IronPath/PATCH-BLOECKE.md`,
    `IronPath/release-version.json` und Cache-Welle: belegten PR-#314-Eintrag
    samt aktuellem Block-3-/Block-4-Status in `FELDNOTIZEN` eingetragen und
    die Cache-Welle über 48 Dateien von `20261031-patch5` auf
    `20261031-patch6` angehoben (`cache-wave.cjs` um `patch5`-`oldUrls`
    erweitert).
- **Prüfungen (lokal auf `arena/881f3e73-0815games-github-io`):**
  - Gezielte Tests (`popup-centering`, `version-ui`, `translation-coverage`,
    `dom-contract`, `build-stamp`, `multiplayer-build-stamp`, `patch-notes`,
    `recruit-screen`, `release-stage-version`, `release-site-packaging`):
    **45 / 45 bestanden** (`0` Fehler).
  - Vollständige Testsuite `IronPath/tests/*.test.mjs` in alphabetischen
    Teilbatches (`[a-f]`, `[g-l]`, `[m-r]`, `[s-z]`): alle Läufe ohne
    Fehlschläge bestanden (in `[m-r]` `332 / 333` + 1 absichtlich
    übersprungener Rules-Test; `[g-l]` `55 / 55`; `[s-z]` `315 / 315`; `[a-f]`
    vollständig bestanden).
  - `node IronPath/stress-tests/run.mjs`: alle Solo-/Koop-/Versus-/3er-/4er-/
    2v2-/Dichte-/Karten- (`500`) und Protokoll-Workloads bestanden.
  - **Grenzen:** Kein lokaler Chromium-Browser / Java-Emulator in der Sandbox;
    die echten Chromium-Renderings (`interface-smoke.cjs` inkl.
    `*-version-notice.png` bei `320px`, `390px` und `1440px`) laufen im
    anschließenden PR-CI-Lauf, echte Handy-Abnahme erfolgt danach durch den
    Betreiber.
- **Git / PR / Release:** Lokal umgesetzt und geprüft; bereit für Commit, Push
  und PR gegen `main` (inkl. `IronPath/browser-artifacts/firebase-rtdb-rules-ready.json`
  weiterhin bewusst ausgeschlossen).

## IPL-0062 – PR #315 gemerged, #versionNotice bestätigt und neue Block-8-Punkte aufgenommen

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum `2026-10-31 UTC`;
  GitHub-/Pages-Ereignisse am `2026-11-18` und Rückmeldung des Betreibers auf
  Branch `arena/df03e963-0815games-github-io`.
- **Block / Ziel:** Nachtrag zum Merge von PR #315 (`20261031-patch6`),
  Bestätigung des `#versionNotice`-Dispatch-Popups durch den Betreiber sowie
  Aufnahme der neuen Block-8-Wünsche in `IronPath/PATCH-BLOECKE.md`.
- **Git / CI / Live-Status:**
  - [PR #315](https://github.com/0815games/0815games.github.io/pull/315)
    lief vor dem Merge komplett grün durch (Run `44298787512`: `13 / 13` Checks
    bestanden inkl. `interface-browser-smoke` über `320px`, `390px` und
    `1440px`, `database-rules`, `game-regressions`, 8× `party-finalization-browser`
    und Vercel-Preview).
  - Merge in `main` als Commit [`c5607827`](https://github.com/0815games/0815games.github.io/commit/c5607827c136da9ff766512d48caca94a74213f3);
    `pages-build-deployment` (Run `44300670501`) sowie Post-Merge-CI auf `main`
    (Run `44300672349`, alle `11 / 11` Jobs) schlossen mit `success` ab.
- **Rückmeldung und neue Punkte des Betreibers:**
  - `#versionNotice`-Artwork/Layout unter `20261031-patch6` vom Betreiber
    bestätigt (*„Das mit dem Bild hat gepasst zwecks neuer Verison.“*); die
    Punkte AFK-Popup mit Soldat-Artwork, Rückkehr zum Loginscreen und mittiges
    Versions-Popup waren bereits in Block 8 eingebaut und bestätigt.
  - Neu in Block 8 von `IronPath/PATCH-BLOECKE.md` aufgenommen (`lokal vor
    Implementierung`): (1) Karten-Seeding konsequent links ↔ rechts ohne halb
    leere Endloskarten, (2) Ingame-Feldmenü ohne Coaching/Kommandozentrale
    samt Einstellungen & Abmelden sauber mit Abstand unten, (3) sichtbares
    Bereitschafts-/Benachrichtigungssignal am Aktion-Skill-Button bei `READY`,
    (4) Admin-Login-Einstieg direkt im Loginscreen.
- **Offen:** Prioritätsentscheidung des Betreibers (Block-8-Feinschliff
  vorziehen oder Block 5 Skills beginnen) sowie abschließende
  Handy-Abnahme der Block-4-Avatare.

## IPL-0063 – Block-8-Zwischenpatch 20261031-patch7 (g4-Seeding, Feldmenü, READY-Signal, Admin-Link) lokal

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum `2026-10-31 UTC` (Arbeitsstand auf
  Branch `arena/df03e963-0815games-github-io`, nach Freigabe *„Block 8 go“*).
- **Block / Ziel:** Umsetzung der vier unter `IPL-0062` aufgenommenen
  Block-8-Nacharbeiten vor Start von Block 5 (Skills), inklusive vollständiger
  Cache-Welle `20261031-patch7`, Feldnotizen-Synchronisierung und automatisierter
  Tests.
- **Umsetzung im Detail:**
  - **1 · Durchgehendes West↔Ost-Karten-Seeding (`IronPath/maps.mjs`):**
    Versioniertes Seed-Präfix `g4-<sector><8-hex>` ergänzt (`isMapId` /
    `sectorOf` erkennen `g[34]-`; `createRandomMapId()` erzeugt `g4-`); in
    `buildGridMap(id, {crossField: true})` starten alle Straßen auf `W` oder
    `E`, marschieren quer über die gesamte Karte zum gegenüberliegenden Bunker
    (`cols - 4..cols - 3` bzw. `2..3`) und verteilen Bauplätze auf beide
    Hälften; bestehende Kampagnen-, Story- und Legacy-`g3-`-Seeds bleiben
    unverändert. Abhängige Tests/Browser-Checks angepasst
    (`IronPath/tests/maps.test.mjs` inkl. 4×120-Sektortest für `g4-`,
    `IronPath/tests/large-multiplayer.test.mjs`,
    `IronPath/browser-tests/multiplayer-account-handoff.cjs`).
  - **2 · Bereinigtes Ingame-Feldmenü (`IronPath/index.html`, `IronPath/field-menu.mjs`, `IronPath/field-command.css`):**
    `#fieldCoachReplay` („Coaching wiederholen“) und `#fieldBack`
    („Kommandozentrale“) aus `#fieldOps` und `field-menu.mjs` entfernt;
    `#fieldSettings` („Einstellungen“) und `#fieldLogout` („Abmelden“) liegen
    in `.field-ops-footer` mit Trennlinie und `8px`-Abstand sauber unten
    (`min-height: 44px`). Zugehörige Tests/Skripte aktualisiert
    (`IronPath/tests/field-signout.test.mjs` korrigiert verschachteltes
    `</details>`-Slicing, `IronPath/tests/first-run-layout.test.mjs`,
    `IronPath/browser-tests/{command-center,release-gates}.cjs`).
  - **3 · Deutliches `READY`-Signal am Aktion-Skill (`IronPath/field-command.css`, `IronPath/game.js`, `IronPath/localization-results-de.mjs`):**
    `#ability[data-state="ready"]` erhält goldenen Rahmen, beleuchtetes
    Icon-Medaillon, kontrastreiches `READY`/`BEREIT`-Badge und sanften Puls
    (`@keyframes ability-hud-ready`, unter `prefers-reduced-motion: reduce`
    deaktiviert). `game.js` verfolgt `wasAbilityReady` / `abilityReadyNotified`
    (Zurücksetzen bei Reset, Koop-Start und `cooldown`) und löst sowohl beim
    ersten Bereitwerden als auch nach Ablauf der Abklingzeit `.ability-hud--new`
    plus eine nicht-blockierende `#fieldNotice`-Meldung (`{ability} is ready!` /
    `{ability} ist bereit!`) aus (`IronPath/tests/ability-hud-ui.test.mjs` um
    Abklingzeit-Rückkehr erweitert).
  - **4 · Admin-Login-Link im Loginscreen (`IronPath/index.html`, `IronPath/interface-redesign.css`, `IronPath/localization-more-static-de.mjs`, `IronPath/release-tools/stage-version.mjs`):**
    `<a id="adminLoginLink" href="admin.html">` innerhalb von `.dossier-bottom`
    (außerhalb `aria-hidden`, `min-height: 44px`) in `index.html` verankert und
    auf Deutsch (`Admin-Login`) übersetzt; `stage-version.mjs` entfernt
    `.dossier-admin` in isolierten geschützten Builds (`tests/release-site-packaging.test.mjs`
    und `browser-tests/interface-smoke.cjs` um `#adminLoginLink` ergänzt).
  - **5 · Cache-Welle & Dokumentation:** Build-Stempel (`20261031-patch7`),
    `maps.mjs`, `localization-results-de.mjs`, `interface-redesign.css`,
    `field-command.css`, `battle-viewport*.mjs`, `release-version.json`,
    `patch-notes.mjs`, `tests/multiplayer-build-stamp.test.mjs`,
    `tests/patch-notes.test.mjs`, `browser-tests/cache-wave.cjs` und
    `PATCH-BLOECKE.md` (Block 8 auf `75 %`) aktualisiert.
- **Prüfung (Rechnerstand):**
  - `g4-`-Generator-Prüfung über `1.600 / 1.600` Zufalls-Seeds (je 400 in
    Sektor 1–4): `edges=E,W`, `minSpan >= 78%`, `multi=400/400` in Sektor 3–4,
    `badPads=0`.
  - `node -c` auf den fünf geänderten `.cjs`-Browser-Skripten bestanden.
  - `node --test IronPath/tests/*.test.mjs`: `1132 / 1133` bestanden (`0` Fehler,
    `1` bekannter übersprungener Rules-Test ohne lokalen Java-Emulator).
  - `node IronPath/stress-tests/run.mjs`: alle 18 Solo-/Koop-/Versus-/3er-/
    4er-/2v2-Durchläufe, 6 Langläufe bis Welle 30, 500 Karten-Stichproben,
    Dichte- und Protokoll-Tests bestanden.
  - **Grenzen:** Kein lokaler Chromium-Browser / Java-Emulator in dieser
    Sandbox; Playwright- und Emulator-Läufe laufen über den PR-CI-Workflow,
    anschließend folgt echte Geräteabnahme durch den Betreiber.
- **Git / PR / Status:** Commit `cabf5c1` auf PR `#316` gegen `main` eröffnet.

## IPL-0064 – PR-#316-CI-Analyse & Korrektur in `command-center.cjs`

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-10-31 UTC (PR `#316`, Lauf `44310262159`, Job `134822247816`).
- **Befund:** In Lauf `44310262159` bestanden `12 / 13` Checks (`interface-smoke.cjs` in allen drei Viewports grün); `command-center.cjs:627` scheiterte (`visible('#game') === false`). Durch den Abbau des entfernten `#fieldCoachReplay`-Klicks (der zuvor unbemerkt `forgetTrainingSeen` ausgelöst hatte, sodass `tutorial.onFinish` nach 400 ms den Übungseinsatz erneut über `#commandCenter` startete) blieb `#gameWorkspace` nach `#resultsDone` verborgen, obwohl `#tutorialReplay` als Feld-Tour getestet wurde.
- **Änderung:** `IronPath/browser-tests/command-center.cjs` öffnet vor dem `#tutorialReplay`-Block explizit ein Endlos-Schlachtfeld (`#menuEndless` → `#endlessDeploy`), merkt sich `#mapName` (`preTourMap`) und bestätigt nach Tour-Abschluss zusätzlich zur unveränderten `trainingMarker === 'done'`-Prüfung, dass `#mapName === preTourMap` erhalten bleibt und `#game` sichtbar sowie `#commandCenter` verborgen bleibt, bevor `#backToCommand` zurückwechselt.
- **Prüfung:** `node -c IronPath/browser-tests/command-center.cjs` und `node --test IronPath/tests/*.test.mjs` bestanden; anschließend Push auf PR `#316` für erneute Chromium-CI-Prüfung (`interface-browser-smoke`).

## IPL-0065 – PR #316 live, Kit-Fixes (Bossjäger III & Doppel-MG III), CI-Retry & Cache-Welle `20261031-patch8`

- **Zeit / Quelle:** Abgefragte Umgebungsuhr 2026-10-31 UTC (Merge von PR `#316` als `a69675bb60b5c6c4a95be4d2dcea53d9fbae33f4`, neuer Arbeitsstand `20261031-patch8`).
- **Veröffentlicht (`PR #316`, `20261031-patch7`):**
  - PR `#316` nach grünem CI (`13 / 13` Checks inklusive `interface-browser-smoke` auf `518700d`) per Merge-Commit `a69675bb` auf `main` gemergt.
  - GitHub Pages (`44316906495`) und `main`-CI (`44316907201`, `11 / 11` Checks) grün abgeschlossen.
- **Umfang & Betreiber-Entscheidungen für `20261031-patch8` + Block 5:**
  - Vorgehen bestätigt: erst die korrigierten Rang-III-Turmkits samt Cache-Welle `20261031-patch8` und der CI-Wiederholung ausliefern, danach den großen Block-5-Klassen-/Skill-Umbau (6. Luftabwehrklasse `Air Defense`, exklusive Klassenwahl ab Level 2, klassenabhängige Ausbauwege zusätzlich zu den Grundtürmen, 6 Icons, einmalige Punkterückgabe unter Erhalt von XP/Level/Ausrüstung, Balance & getesteter RTDB-Rules-Kandidat ohne automatisches Überschreiben der Live-Rules).
- **Änderungen (`20261031-patch8`):**
  - **Bossjäger III (`IronPath/tower-specialization.mjs`):** `applyHitEffects` prüft die Rang-III-Kopfgeldbedingung (`isKit(tower, undefined, 3, 3) && target.boss && !target.bountyPaid && target.hp <= 0`) jetzt **vor** `if (target.hp <= 0) return;` und ruft `rewardTeam?.(state, 25, false)` auf, damit die versprochenen +25 Team-Vorräte samt `{type: 'bounty'}`-Hinweis gezahlt werden, ohne `logistics`/Wellen-Boni doppelt zu verrechnen.
  - **Doppel-MG III (`IronPath/combat.mjs`):** `towerDamage` setzt für `type === 0 && branch === 0 && level >= 5 && baseKind === 'plane'` den Multiplikator auf `1` (volle **22** auf Stufe 5, **25** bei Prestige Stufe 6 statt 13,2 gegen Flugzeuge und Luft-Bosse); Schweres MG (`branch === 1`) bleibt bei `0.6`.
  - **Tests (`IronPath/tests/tower-specialization.test.mjs`, `IronPath/tests/balance-suite.test.mjs`):** Strenge Rang-II-vs.-Rang-III-Prüfung (inkl. `logistics: 3`, `bounty`-Event und `bountyPaid`), explizite Doppel-MG-III-Schadens- und Simulationsprüfungen sowie Anpassung des Forest-Endloskurven-Laufs auf 55 Wellen (`MIXED_KIT` fällt mit gefixtem Doppel-MG III auf Welle 50 statt 49).
  - **CI-Matrix-Wiederholung (`.github/workflows/ironpath-firebase-rules.yml`):** `party-finalization-browser` auf `timeout-minutes: 20` mit maximal 1 automatischem Wiederholungsversuch (`timeout 480` pro Versuch, `::warning` und gezielter Bereinigung von `java .*emulator|firebase-tools|chrome-headless|headless_shell|chromium` nach einem fehlgeschlagenen ersten Versuch).
  - **Cache-Welle `20261031-patch8` (`IronPath/release-version.json`, `IronPath/index.html`, `IronPath/patch-notes.mjs`, Stammmodule, `IronPath/tests/multiplayer-build-stamp.test.mjs`, `IronPath/browser-tests/cache-wave.cjs`):** Sämtliche Browser-Importer von `20261031-patch7`, `combat.mjs?v=20261031-finale1`, `tower-specialization.mjs?v=20261112-kits1` und `tower-upgrade-cue.mjs?v=20261117-shimmer1` auf `?v=20261031-patch8` gehoben und im Build-Stamp- und Cache-Wave-Test fest verankert.

## IPL-0066 – Block 5: 6-Klassen-System (`Air Defense`), Klassenturmwege, V2-Migration, RTDB-Rules-Kandidat & Cache-Welle `20261118-block5` (lokal)

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum `2026-10-31 UTC` (Arbeitsstand auf
  Branch `arena/8eb7d0fe-0815games-github-io` ausgehend von `main` Commit
  `e3954cd0efeed20faa2e0f984b5f96da9cf363e0`, nach Merge von PR `#317`).
- **Block / Ziel:** Vollständige Umsetzung von Block 5 (Skills & exklusive
  Klassen) inklusive sechster Luftabwehrklasse `Air Defense`, zweiphasigem
  14-Knoten-Klassenbaum, getrennten Klassenturmwegen, einmaliger V1→V2-Migration
  mit lokalem Altbuild-Backup, Protokollverdichtung, Cache-Welle `20261118-block5`
  sowie additivem RTDB-Rules-Kandidat ohne automatisches Überschreiben der
  Live-Produktionsregeln.
- **Umfang im Detail:**
  - **1 · V2-Skillsystem & 6. Klasse `Air Defense` (`IronPath/skills.mjs`,
    `IronPath/skill-combos.mjs`, `IronPath/simulation.mjs`, `IronPath/combat.mjs`,
    `IronPath/match.mjs`, `IronPath/ability-hud.mjs`, `IronPath/combat-fx.mjs`,
    `IronPath/first-run-guide.mjs`):**
    V2-Format `v2;<classId>;<rank>;<variant>;<14-bit-web>` mit `DEFAULT_BUILD = 'v2;none'`
    und `MAX_CLASS_POINTS = 17`; exklusive Klassenwahl ab Level 2; neue Klasse
    `airDefense` (*Luftabwehr*: aktive Hauptfähigkeit *Flak Curtain*,
    Spezialistenvarianten *Interceptor* & *Iron Dome*, Air-Defense-Markierung
    `markedByAirDefense` und Klassen-Capstone *Sky Sovereign*); sämtliche sechs
    Klassen mit je 2 Spezialisten-Aktiven, 4 Doktrinen, 5 Meisterschaften inkl.
    Capstone und 3 Kombos im fokussierten 14-Knoten-Baum (`development-ui.mjs`,
    `skill-planner.mjs`, `skill-menu.css`, sechs SVG-Klassenabzeichen).
  - **2 · Klassenturmwege getrennt von Level-3-Turmkits (`IronPath/tower-class-paths.mjs`,
    `IronPath/match.mjs`, `IronPath/protocol.mjs`, `IronPath/game.js`,
    `IronPath/cartoon-art.mjs`):**
    Alle Grundtürme bleiben für jeden baubar; ab Klassenrang 2 (Stufe I) bzw. 3
    (Stufe II) schaltet jeder Turm des Spielers den klassenspezifischen 2-Stufen-
    Ausbauweg (`classUpgrade` mit `classPath` / `classTier`, proportionaler
    Erstattung bei Verkauf und Sektorwechsel) zusätzlich und getrennt von den
    zehn universellen Stufe-3-Turmkits (`tower-specialization.mjs`) frei.
    `protocol.mjs` (`compactSkills` / `compactViewMatch`) verdichtet ausgehende
    Multiplayer-Snapshots unter Beibehaltung von `classPath`, `classTier` und
    `markedByAirDefense`.
  - **3 · Einmalige V1→V2-Migration, UI & DE-Lokalisierung (`IronPath/skills-migration.mjs`,
    `IronPath/account.js`, `IronPath/skill-summary-localization.mjs`,
    `IronPath/localization-{de,skills-de,advanced-skills-de,towers-de,results-de,firstrun-de,game-errors-de}.mjs`):**
    Atomare `runTransaction`-Migration in `account.js` überführt Altbuilds
    einmalig auf `v2;none` (Sicherung unter `ironpath:skills-legacy-backup:<uid>`),
    erstattet sämtliche verdienten Punkte bis `MAX_CLASS_POINTS` unter Erhalt
    von XP, Level und Ausrüstung und blendet `#skillMigrationNotice` in EN/DE ein.
  - **4 · Additiver RTDB-Rules-Kandidat (`IronPath/firebase/{block5-skills-candidate.mjs,block5.complete.draft.rules.json,firebase-block5.emulator.json,BLOCK5-SKILLS-ROLLOUT.md}` & `.github/workflows/ironpath-firebase-rules.yml`):**
    Generiert ausgehend vom unveränderten Basis-Artefakt `WORKSHOP-RULES-TO-PUBLISH.json`
    ausschließlich die drei `skills/.validate`-Pfade (`players/$uid/skills`,
    `parties/$party/profiles/$uid/skills`, `fourParties/$party/profiles/$uid/skills`)
    für V1 + V2 und ergänzt Emulator-Regeltests (`block5-skills-rules.test.mjs`,
    `rules-test/block5-skills.test.mjs`). Keine automatische Änderung an
    produktiven Firebase-Rules.
  - **5 · Cache-Welle `20261118-block5`, Patch-Notes & Tests (`IronPath/release-version.json`,
    `IronPath/index.html`, `IronPath/patch-notes.mjs`, `IronPath/tests/*.test.mjs`,
    `IronPath/tests/balance-harness.mjs`, `IronPath/stress-tests/run.mjs`,
    `IronPath/browser-tests/{command-center,friends-sections,interface-smoke,cache-wave}.cjs`):**
    Alle Browser-Importer einheitlich auf `?v=20261118-block5` gehoben (`progression.mjs`
    unverändert auf `20261105-prestige1`); sämtliche Testsuiten, Balance-Suiten,
    Stresstests und Browser-Skripte auf V2 aktualisiert und um dedizierte Unit-Tests
    `skills-migration.test.mjs`, `tower-class-paths.test.mjs` und
    `block5-skills-rules.test.mjs` ergänzt.
  - **6 · Klassen-Artworks, verzweigte Klassenbäume & Spezialisten-/Turmpfad-Effekte
    (`IronPath/assets/class-*.jpg`, `IronPath/development-ui.mjs`, `IronPath/skill-menu.css`,
    `IronPath/account.js`, `IronPath/combat-fx.mjs`, `IronPath/cartoon-art.mjs`,
    `IronPath/ability-hud.mjs`, `IronPath/game.js`, `IronPath/localization-{skills,towers}-de.mjs`):**
    Sechs optimierte `512x512`-Klassen-Embleme erstellt, Klassenwahlkarten und
    fokussierte Klassen-Hero-Banner gestaltet, den Klassenbaum pro Klasse in
    Kern-Stamm, parallele Spezialisierungs-/Doktrin-Äste (Pfad A/B mit
    Verbindungslinien), Meisterschaft/Capstone und Klassen-Kombos gegliedert
    sowie `towerClassIcon` klassenspezifisch ausgeprägt und mobile
    Scroll-Erhaltung in `account.js` auf `.skills-workspace` ergänzt. Im Kampf
    propagiert `combat-fx.mjs` `variant`, `recon`-Ziele und eigene
    `engineer`-Türme; `cartoon-art.mjs` zeichnet individuelle Canvas-Effekte für
    alle zwölf Spezialisten-Varianten sowie klassenfarbene Boden-Auren,
    Klassen-Medaillons und Rang-I/II-Krönchen an Türmen; `ability-hud.mjs` und
    `game.js` kennzeichnen Spezialisten-Varianten direkt im HUD-Symbol.
- **Prüfungen & Grenzen (gemessen):**
  - `node --test IronPath/tests/*.test.mjs` (über alle **255** Testdateien in 11
    Teil-Batches): **1.140 bestanden**, `0` fehlgeschlagen, `1` bekannter
    übersprungener Emulator-Lauf ohne lokales Java (`rules-publish-dry-run` /
    Emulator-Suite). Darin enthalten: `balance-suite` (`17/17`), `squad-maps`
    (`5/5`), die neuen Block-5-Suiten (`block5-skills-rules` `25/25` über 7
    Rules-Hilfssuiten, `skills-migration` `2/2`, `tower-class-paths` `3/3`) sowie
    erweiterte Tests in `development-ui.test.mjs`, `combat-fx.test.mjs`,
    `cartoon-art.test.mjs` und `ability-hud.test.mjs`.
  - `node IronPath/stress-tests/run.mjs`: alle 18 8-Wellen-Durchläufe
    (Solo, Koop, Versus, 3er-Koop, 4er-Koop, 2v2), 6 Langläufe bis Welle 30,
    500 Karten-Stichproben, 4er-/2v2-Dichte- sowie Protokoll-Tests bestanden.
  - `node -c` über sämtliche Skripte in `IronPath/browser-tests/*.cjs`
    bestanden (`command-center.cjs`, `friends-sections.cjs`, `interface-smoke.cjs`
    und `cache-wave.cjs` auf V2 bzw. `20261118-block5` aktualisiert).
  - `stageVersion({ sourceDir: './IronPath', outputDir: <tmp>, build: '20261118-block5' })`:
    **634** Dateien fehlerfrei gestagt (`index.html`, `release-version.json`
    `20261118-block5`, 6 `assets/class-*.jpg`, `skills-migration.mjs`,
    `tower-class-paths.mjs`, `localization-results-de.mjs`,
    `localization-game-errors-de.mjs`).
  - **Grenzen:** Kein lokales `chromium` / `java` in dieser Sandbox; echte
    Playwright-Chromium-Läufe, Firebase-Emulator-CI-Läufe, die separate
    Produktionsveröffentlichung des RTDB-Rules-Kandidaten sowie echte
    Mehrgeräte-Abnahme folgen gesondert.
- **Git / PR / Status:** Auf `main` via [PR #318](https://github.com/0815games/0815games.github.io/pull/318)
  (`2f178552e33628c72a54e33f2bd0c5462944c290`, CI `44377902051` komplett grün,
  Pages `44379946422` `success`, `main`-Rules-CI `44379948396` `success`)
  veröffentlicht; siehe Nachtrag in `IPL-0067`.

## IPL-0067 – Block 5: Merge-Nachtrag #318 & kopierfertige Firebase-RTDB-Rules (`BLOCK5-RULES-TO-PUBLISH.json`)

- **Zeit / Quelle:** Vorgegebenes Sitzungsdatum `2026-10-31 UTC`;
  GitHub-Merge von PR #318 am `2026-11-18T19:23:02Z`.
- **Branch / Basis:** `arena/f7425bf7-0815games-github-io`, Basis
  `2f178552e33628c72a54e33f2bd0c5462944c290` (`main`).
- **Nachtrag zu PR #318 (`IPL-0066`):**
  - [PR #318](https://github.com/0815games/0815games.github.io/pull/318)
    (inkl. Korrekturen `8997786`, `4c755d4` und `abed2c9` in
    `IronPath/browser-tests/command-center.cjs`) bestand sämtliche CI-Läufe in
    Run `44377902051` (`database-rules`, `game-regressions`,
    `interface-browser-smoke`, alle 8 `party-finalization-browser`-Jobs sowie
    Vercel-Checks) und wurde am `2026-11-18T19:23:02Z` unter
    `2f178552e33628c72a54e33f2bd0c5462944c290` auf `main` gemergt.
  - Die anschließenden `main`-Workflows `pages-build-deployment` (`44379946422`)
    und `Iron Path Firebase party rules` (`44379948396`) schlossen jeweils mit
    `success` ab. Damit ist der Block-5-Spielcode (`20261118-block5`) auf
    GitHub Pages live.
- **Live-Rules-Abgleich & kopierfertige Block-5-Rules-Datei:**
  - Der Betreiber wählte ausdrücklich den bisherigen manuellen Console-Ablauf
    ohne automatische GitHub-Actions-Rules-Ausrollung und stellte dafür den
    vollständigen Live-Export seiner Firebase-RTDB-Rules bereit.
  - Ein struktureller Diff bestätigte ohne Abweichungen, dass der Live-Stand
    exakt `buildMaintenanceRulesCandidate(buildFriendPortraitCandidate(WORKSHOP-RULES-TO-PUBLISH.json), ...)`
    entspricht (inkl. `social-cleanup`, `players/$uid/gender['.read']`,
    `players/$uid/avatar['.read']`, `MAINTENANCE_GATE` sowie `_ironpathMaintenance`
    / `_ironpathMaintenanceAdminAccess` mit konfigurierter Betreiber-Admin-UID —
    UID hier gemäß `AGENTS.md` nicht abgedruckt). Alle drei
    `skills['.validate']`-Ausdrücke standen live noch auf dem alten V1-Regex.
  - Daraus wurde über `IronPath/firebase/block5-skills-candidate.mjs` die
    vollständige, direkt kopierbare Console-Datei
    `IronPath/firebase/BLOCK5-RULES-TO-PUBLISH.json` erzeugt. `diff -u` und
    `compareRules` belegen, dass **ausschließlich**
    `/rules/players/$uid/skills/.validate`,
    `/rules/parties/$partyId/profiles/$uid/skills/.validate` und
    `/rules/fourParties/$partyId/profiles/$uid/skills/.validate` auf
    `BLOCK5_SKILLS_VALIDATE` (V2 + V1) erweitert wurden und keine Block-4- oder
    Wartungsregeln verloren gehen. `WORKSHOP-RULES-TO-PUBLISH.json` sowie
    `block5.complete.draft.rules.json` bleiben unverändert.
- **Änderungen / Dateien:**
  - `IronPath/firebase/BLOCK5-RULES-TO-PUBLISH.json` (neu: vollständige
    kopierfertige RTDB-Rules für die Firebase Console)
  - `IronPath/firebase/BLOCK5-SKILLS-ROLLOUT.md` (Dokumentation für
    `BLOCK5-RULES-TO-PUBLISH.json` & Hinweis gegen direktes Kopieren von
    `block5.complete.draft.rules.json`)
  - `IronPath/tests/block5-skills-rules.test.mjs` (Vertragsprüfung für
    `BLOCK5-RULES-TO-PUBLISH.json`: kein RE2-inkompatibles `(?:`, `0` Blocker,
    exakt die 3 `skills/.validate`-Änderungen, Abdeckung aller 16
    `*.complete.draft.rules.json`)
  - `IronPath/firebase/rules-test/block5-publish-rules.test.mjs` &
    `IronPath/firebase/rules-test/package.json` (Emulator-Test für
    `BLOCK5-RULES-TO-PUBLISH.json` inkl. V2-Builds aller 6 Klassen,
    V1→V2-Migration, Block-4-Freundes-Reads/Cleanup & `MAINTENANCE_GATE`)
  - `IronPath/PATCH-BLOECKE.md` & `IronPath/PATCH-LOG.md` (`IPL-0067`)
- **Prüfungen & Grenzen (lokal vor Push):**
  - `compareRules` & `compareRepoDrafts` über `BLOCK5-RULES-TO-PUBLISH.json`
    gegen den Live-Export: `0` Blocker, `0` fehlende Pfade, `16/16` Entwürfe
    abgedeckt, ausschließlich 3 `skills/.validate`-Warnungen.
  - `node --test IronPath/tests/*.test.mjs`: **1.141 bestanden**, `0` fehlgeschlagen,
    `1` bekannter übersprungener Emulator-Lauf ohne lokales Java; `git diff --check`
    bestanden; anschließender PR-CI-Emulatorlauf (`test:block5` in
    `Iron Path Firebase party rules`) wird nach Push geprüft.
  - **Grenzen:** Kein lokales Java/Chromium in der Sandbox; Emulator-Beweis
    für `BLOCK5-RULES-TO-PUBLISH.json` liefert der GitHub-CI-Lauf (`test:block5`).
    Live-Veröffentlichung der Rules bleibt ein manueller Schritt des Betreibers
    in der Firebase Console; echte Mehrgeräte-Abnahme von `20261118-block5`
    bleibt offen.

## IPL-0068 – Block-5-RTDB-Rules live bestätigt und Block 9 vor Block 6 eingeplant
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); GitHub-Merge-Zeitpunkt von [PR #319](https://github.com/0815games/0815games.github.io/pull/319) (`782b46fa4d521f7a07801f49301576f02a288e6a` auf `main`): `2026-11-19T05:38:35Z` (alle 13/13 PR-Checks und anschließende `main`-Workflows bestanden).
- **Block / Ziel:** Block-5-RTDB-Rules-Abschluss protokollieren; **Block 9 (Einheitliches Menü-Layout & Kommandotafeln)** vor Block 6 (Tutorial) einschieben, damit Block 6 direkt auf der neuen Menüführung aufbaut. Block 7 bleibt unverändert der letzte Ausbau-Block.
- **Branch / Basis:** `arena/66c63134-0815games-github-io`, Ausgangs-HEAD `782b46fa4d521f7a07801f49301576f02a288e6a`.
- **Betreiberbestätigung (ohne unabhängigen Serverabruf aus der Sandbox):** Der Betreiber bestätigte, dass die in [`IronPath/firebase/BLOCK5-RULES-TO-PUBLISH.json`](../firebase/BLOCK5-RULES-TO-PUBLISH.json) bereitgestellten Block-5-RTDB-Rules live in der Firebase Console veröffentlicht wurden.
- **Änderungen / Dateien:**
  - `IronPath/PATCH-BLOECKE.md` (Block-5-Rules als vom Betreiber live bestätigt markiert, Block 9 in Übersicht, Reihenfolge & Abschnitt `### 9.` vor Block 6 eingeordnet)
  - `IronPath/patch-notes.mjs` & `IronPath/tests/patch-notes.test.mjs` (`block9` als `active` direkt vor `block6` / `next` in `PLANNED_PATCHES`, `block7` unverändert zuletzt; Block-5-Text aktualisiert)
  - `IronPath/PATCH-LOG.md` (`IPL-0068`)
- **Prüfungen:** Werden gemeinsam mit der lokalen Umsetzung von Block 9 (`node --test IronPath/tests/*.test.mjs`) nachgetragen.
- **Git / PR / Release:** `lokal/uncommittet` auf `arena/66c63134-0815games-github-io`. `IronPath/release-version.json` bleibt bis zum abgestimmten Release unverändert auf `20261118-block5` (keine erfundenen `RELEASED_PATCHES`-Einträge).
- **Offen / nächster Schritt:** Umsetzung der Block-9-Oberfläche (`menu-redesign.css`, `password-change.mjs`, `index.html`, Dialog-Banner, Mobile App-Shell / Desktop 2-Spalten-HQ, Endless-Geländekarten, Settings → Konto) inkl. Testnachweisen und anschließende CI-/Geräteabnahme.

## IPL-0069 – Block 9: Einheitliches Kommando-HQ, Dialog-Banner, Endlos-Gelände & Settings → Konto (lokal umgesetzt)
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); lokale Arbeitskopie auf Branch `arena/66c63134-0815games-github-io` ab `782b46fa4d521f7a07801f49301576f02a288e6a`.
- **Block / Ziel:** Block 9 vollständig lokal umsetzen: einheitliche Farb- und Kartensprache (`menu-redesign.css`), 2-Spalten-Desktop-HQ & mobile 4-Knopf-App-Shell, 3-Zonen-Dialog-Banner über alle Menüs, illustrierte Endlos-Geländekarten (`data-theme`) sowie Tabs *Allgemein* / *Konto* in `#settingsDialog` mit Passwortänderung (`password-change.mjs`) und umgezogener Gefahrenzone (`#menuDeleteCharacter`).
- **Änderungen / Dateien:**
  - `IronPath/menu-redesign.css` (neu, als letzte CSS-Ebene in `index.html` eingebunden): Tannengrün-/Gold-Palette, Desktop-2-Spalten-HQ (`>= 860px`), mobile App-Shell mit fester Daumenleiste unten (`< 860px`), strikt `[open]`-gekoppelte Dialog-Rahmen/Fullscreen-Mobile-Sheets inkl. Single-Scroll-Fix für `#skillDialog`, 3-Zonen-Banner, Endlos-Geländekarten (`assets/endless-ground.jpg` & `assets/terrain3-*.jpg`) sowie `#settingsDialog`-Tabs/Passwortformular/Gefahrenzone.
  - `IronPath/password-change.mjs` (neu): `createPasswordChange` für E-Mail-Anzeige, Client-Validierung, Lazy-Import von `EmailAuthProvider.credential` / `reauthenticateWithCredential` / `updatePassword` (Firebase Auth `10.14.1`), Passwort-Reset-E-Mail-Auslösung, Pending-Sperre, Statusmeldungen & `retranslate()`.
  - `IronPath/settings.mjs` (`?v=20261119-block9`): Tab-Umschaltung `general` / `account` (`setTab`, Standard `general` beim normalen `open()`) sowie `onOpen`/`onClose`-Hooks.
  - `IronPath/endless-launcher.mjs`: `data-theme` (`random`, `scrub`, `forest`, `urban`, `arctic`, `marsh`) per `setAttribute` an den Geländekarten in `#endlessThemes`.
  - `IronPath/index.html`: Einbindung `menu-redesign.css?v=20261119-block9`, `.dialog-banner`-Header auf `#settingsDialog`, `#patchNotes`, `#endlessLaunch`, `#friendsDialog`, `#friendStatsDialog`, `#leaderboardDialog` (unter Erhalt direkter `<header>`-Elternbeziehung zu den Close-Buttons), `Allgemein`/`Konto`-Tabs mit Passwortformular & Gefahrenzone (`#menuDeleteCharacter` aus `.command-utilities` entfernt).
  - `IronPath/account.js`: Verdrahtung von `settings.mjs?v=20261119-block9`, `password-change.mjs?v=20261119-block9`, `bindDialogBackdrop` auf `#settingsDialog` & `#endlessLaunch`, `closeMenuDialogs()` beim Verlassen des Spielbildschirms / Auth-Wechsel / Löschen (explizite Menü-ID-Liste unter Aussparung von `afkRestDialog` / `afkSessionFailure` / `maintenanceGate` / `gameConfirm`) sowie Anzeige der Party-Sperrwarnung auch in `#settingsAccountStatus` unter Erhalt der literal geprüften Zeile `$('menuDeleteCharacter').onclick=deleteCharacter;`.
  - `IronPath/language.mjs`, `IronPath/localization-settings-de.mjs` (`?v=20261119-block9`), `IronPath/localization-account-de.mjs`: vollständige deutsche Übersetzungen für neue Settings-/Konto- und Passwort-Texte ohne doppelte Schlüssel oder englische Füllwörter.
  - `IronPath/tests/menu-redesign.test.mjs` (neu), `IronPath/tests/password-change.test.mjs` (neu), `IronPath/tests/settings.test.mjs`, `IronPath/browser-tests/{character-discharge,avatar-handover,command-center}.cjs`, `IronPath/firebase/rules-test/social-cleanup-browser.cjs`: Unit- und Browser-Testverträge an das neue Konto-Menü & mobile Fullscreen-Sheets angepasst.
- **Prüfungen (verifiziert in lokaler Node-Umgebung):**
  - `node --test IronPath/tests/*.test.mjs`: **1.150 bestanden**, **0 fehlgeschlagen**, `1` bekannter Skip (`release-pages-site.test.mjs`: gepinnte Vorgänger-Commits benötigen vollen Checkout); umfasst u. a. `menu-redesign.test.mjs`, `password-change.test.mjs` (4/4), `settings.test.mjs` (8/8), `patch-notes.test.mjs` (8/8), `translation-coverage.test.mjs`, `multiplayer-build-stamp.test.mjs`, `browser-doubles.test.mjs`, `afk-rest.test.mjs` und `release-stage-version.test.mjs`.
  - `node IronPath/stress-tests/run.mjs`: deterministische Solo-/Koop-/Versus-/3er-/4er-/500-Karten-Stressläufe bestanden.
  - `node --check` über sämtliche `IronPath/browser-tests/*.cjs` und `IronPath/firebase/rules-test/*.cjs` sowie `git diff --check`: fehlerfrei.

## IPL-0070 – PR #320 (CI 13/13 grün) & synchronisierte Cache-/Build-Welle `20261119-block9` vor Merge auf `main`
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); PR [#320](https://github.com/0815games/0815games.github.io/pull/320) auf Branch `arena/66c63134-0815games-github-io` (`ae82722` → `4441e4e`, CI-Run `44476510057`).
- **Block / Ziel:** Nach vollständig grünem PR-#320-CI-Nachweis (`4441e4e`) sämtliche Build-Manifeste, HTML-Stempel, `?v=`-Cache-Imports, Feldnotizen (`RELEASED_PATCHES[0]`) und Cache-Wave-Prüfungen auf den einheitlichen Release-Stempel **`20261119-block9`** heben, damit wiederkehrende Spieler beim anschließenden Merge auf `main` / GitHub Pages keine gemischten `20261118-block5`-Module aus dem HTTP-Cache laden.
- **Änderungen / Dateien:**
  - `IronPath/browser-tests/command-center.cjs` (`4441e4e`): Mock-User um `email: 'soldier@example.test'` für den Settings → Konto-Passworttest ergänzt und E-Mail-Anzeige mitgeprüft.
  - `IronPath/release-version.json`, `IronPath/index.html` (`<meta name="ironpath-build">`, duale `BUILD`-Stempel, Stylesheets & Entry-Skript), `IronPath/tests/multiplayer-build-stamp.test.mjs` (inkl. `settings.mjs`, `password-change.mjs`, `localization-settings-de.mjs`) und alle 68 importierenden `.js`/`.mjs`-Dateien unter `IronPath/`: geschlossen von `?v=20261118-block5` auf `?v=20261119-block9` gehoben.
  - `IronPath/browser-tests/{cache-wave,avatar-handover,interface-smoke}.cjs`: `20261118-block5`-Stale-URLs im synthetischen HTTP-Cache-Bypass ergänzt sowie `settings.mjs`, `password-change.mjs`, `endless-launcher.mjs`, `patch-notes.mjs`, `localization-settings-de.mjs` und `localization-account-de.mjs` unter `?v=20261119-block9` abgesichert.
  - `IronPath/patch-notes.mjs`, `IronPath/tests/patch-notes.test.mjs` & `IronPath/PATCH-BLOECKE.md`: `block9` (`20261119-block9`, `pr: 320`) als neuesten Eintrag in `RELEASED_PATCHES[0]` dokumentiert, Block 9 in `PLANNED_PATCHES` auf `planned` (offene Geräteabnahme) gesetzt und `block6` als `active` nachgeführt.
- **Prüfungen (belegt):**
  - GitHub CI Run [`44476510057`](https://github.com/0815games/0815games.github.io/actions/runs/44476510057) auf `4441e4e`: **13/13 Checks bestanden** (`game-regressions`, `database-rules`, `interface-browser-smoke` inkl. aller 16 statischen Chromium-Smokes, `test:release-tabs`, `test:social-browser`, `test:multiplayer-browser`, alle 8 `party-finalization-browser`-Emulator-Jobs sowie Vercel).
  - Lokale Nachprüfung der Build-/Patch-Notes-/Cache-Wave-Stempel vor dem finalen Push und CI-Lauf.
- **Git / PR / Release:** Commit + Push auf `arena/66c63134-0815games-github-io` für [PR #320](https://github.com/0815games/0815games.github.io/pull/320) und abschließender CI-Check sowie Merge auf `main` laufen nach Abschluss dieses Commits.
- **Offen:** Finalen CI-Lauf auf dem Release-Commit abwarten, PR #320 in `main` mergen (`pages-build-deployment`) und anschließend echte Desktop-/Handy-Sichtung auf `20261119-block9` durchführen.
- **Grenzen / Offen:**
  - Kein Chromium und kein Java in dieser Sandbox; alle Playwright-Browser-Smokes (`interface-smoke.cjs`, `command-center.cjs`, `character-discharge.cjs`, `avatar-handover.cjs`, `friends-sections.cjs`, `release-gates.cjs` usw.) und Firebase-RTDB-Emulator-Tests (`social-cleanup-browser.cjs` u. a.) sowie `IronPath/server` / `release-tools` Tests mit `npm`-Abhängigkeiten sind noch **nicht** gelaufen und werden über GitHub-CI geprüft.
  - `IronPath/release-version.json` bleibt bis zum eigentlichen Build/Release unverändert auf `20261118-block5`; keine ungeprüfte Geräte- oder Produktionsabnahme behauptet (`patch-notes.mjs` führt Block 9 weiterhin unter `PLANNED_PATCHES` als `active`).
- **Git / PR / Release:** `lokal/uncommittet` auf `arena/66c63134-0815games-github-io`. Kein neuer Commit, Push, PR oder Deployment.

## IPL-0071 – Block 9b (`20261119-block9b`, PR #321): Endlos-Schnellstart, Kampagnen-Akte & durchgängige Gemälde
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); Branch `arena/271d41c0-0815games-github-io` ab `c640712` (`main`), [PR #321](https://github.com/0815games/0815games.github.io/pull/321) (CI-Run `44487622595` auf `2f4fdb9` 13/13 grün).
- **Block / Ziel:** Feinschliff des Block-9-Menüs vor der Geräteabnahme: Endlos-Starter (`#endlessLaunch`) sofort einsatzbereit mit Schnellstartleiste oben & Bilanz darunter, alle verbliebenen Kacheln/Flächen (`#menuEndless`, `#endlessThemes`, `#campaignPanel` mit Akt-Bannern & Relikten, `#fieldSchool`, Musterung, Gefechts-Dialoge) mit stimmigen handgezeichneten Gemälden harmonisieren und über Cache-Welle `20261119-block9b` ausliefern.
- **Änderungen / Dateien:**
  - `IronPath/assets/{endless-frontline,story-act2-relic,story-act3-relic,story-act4-relic,story-act5-relic,field-recruiting}.jpg`: 6 neue randlose `1376×768`-Gemälde im Iron-Path-Stil erzeugt und beschnitten.
  - `IronPath/index.html`, `IronPath/endless-launcher.mjs` (`syncSelectedSummary` für `#endlessSelectedTheme`), `IronPath/menu-redesign.css`: `#endlessLaunch` mit `.endless-quick-start` oben, Panorama-Gemälden (`endless-frontline.jpg`, `story-outpost.jpg`, `story-pinewood.jpg`, `story-city.jpg`, `story-ice.jpg`, `story-marsh.jpg`) in der Mitte und `.endless-record-panel` unten; flache `endless-ground.jpg` / `terrain3-*.jpg` vollständig ersetzt.
  - `IronPath/index.html`, `IronPath/game.js`, `IronPath/menu-redesign.css`: `#campaignPanel` mit `.campaign-dossier-records` (parallele „Bisherige Geschichte“ & „Akt-Relikte“), `data-act` auf `.act-detail-head` (`story-act1..5-title.jpg`), illustrierten `.relic-slot`-Karten (`story-act1..5-relic.jpg`, `VERDIENT`/`GESPERRT`/`BEVORSTEHEND`), `#fieldSchool`-Kartenbildern, Musterungs-Banner (`field-recruiting.jpg`) sowie angepassten `#gameConfirm`/`#towerDetails`.
  - `IronPath/localization-campaign-de.mjs`, `IronPath/localization-more-static-de.mjs`, `IronPath/language.mjs`: deutsche Übersetzungen (`EARNED`, `UPCOMING`, `BATTLEFIELD`, `YOUR ENDLESS RECORD`).
  - `IronPath/tests/{menu-redesign,endless-launcher,campaign-ui,multiplayer-build-stamp}.test.mjs`, `IronPath/browser-tests/{cache-wave,avatar-handover,interface-smoke}.cjs`, `IronPath/release-version.json`, `IronPath/patch-notes.mjs` (`block9b`, `pr: 321`) & gesamte `?v=20261119-block9b`-Cache-Welle.
- **Prüfungen:**
  - Lokale `IronPath/tests/*.test.mjs` (inkl. `menu-redesign`, `endless-launcher`, `campaign-ui`, `patch-notes`, `build-stamp`, `multiplayer-build-stamp`, `translation-coverage`) + `node IronPath/stress-tests/run.mjs`.
  - GitHub CI Run `44487622595` auf PR #321 (`2f4fdb9`): **13/13 Checks bestanden** (`database-rules`, `game-regressions`, `interface-browser-smoke` inkl. Chromium `interface-smoke.cjs` & `command-center.cjs`, alle 8 `party-finalization-browser`-Jobs, Vercel). Finaler Release-CI-Lauf auf `20261119-block9b` unmittelbar vor Merge auf `main`.
- **Offen:** Echte Desktop- und Handy-Sichtung auf `20261119-block9b`.

## IPL-0072 – Block 9c (`20261119-block9c`, PR #322): Einheitliche Einstellungen, AFK-Artwork, Kopie-Korrekturen & vollständige Dialog-Harmonisierung
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); Arbeitsbranch `arena/cd3317c7-0815games-github-io` ab `0e26018634033c37b9baf5a1c4fae07c668345ba` (`main`), PR #322.
- **Block / Ziel:** Verbleibende UI-/Einstellungs- und Textlücken in Block 9 schließen: Einstellungs-Konsole (`#settingsDialog`) mit vollständigen Audio-, Grafik-, FX-, Kamera- und Autopause-Reglern für Kommandozentrale und Gefecht vereinheitlichen, doppelten Feldmenü-Sound-Schalter entfernen, `#afkRestDialog` / `#afkSessionFailure` mit handgemalter Bunker-Szene aufwerten, sämtliche Rest-Modale/Popups auf gemeinsame Tokens, einheitliche `✕`-Schließsymbole und kollisionsfreie `#versionNotice`-Positionierung abstimmen sowie veraltete Fakten (`18` → `50` Missionen, `three` → `five` Akte, redundante Endlos-Links) bereinigen.
- **Änderungen / Dateien:**
  - `IronPath/assets/{afk-rest,settings-command}.jpg`: zwei neue text- und randlose `1376×768`-Gemälde erzeugt und beschnitten.
  - `IronPath/settings.mjs`, `IronPath/localization-settings-de.mjs`, `IronPath/tests/settings.test.mjs`: `soundEnabled`, `voiceOver`, `screenShake`, `weatherEffects`, `combatTracers`, `autoPause`, `mapZoom`, `snapshot()`, bestätigter Reset (`#settingsRestoreDefaults`) und automatische Sub-Toggle-Sperre bei `reduced`-Grafik ergänzt; DE-Schlüssel & Unit-Tests vervollständigt.
  - `IronPath/game.js`, `IronPath/cartoon-art.mjs`, `IronPath/account.js`: `initialSettings` / `applySettings` live verdrahtet (`voiceOver`, `screenShake`, `weatherEffects`, `combatTracers`, `autoPause`, `mapZoom`, Audio-Gesten-Entsperrung), Solo-Pause während `#settingsDialog.open`, `#soundToggle` entfernt und `#afkRestArt` auf `assets/afk-rest.jpg` (mit `<canvas>`-Fallback-Schutz) umgestellt.
  - `IronPath/endless-launcher.mjs`, `IronPath/tests/endless-launcher.test.mjs`, `IronPath/index.html`: `#endlessArmory` / `#endlessSkills` entfernt, `50 MISSIONS` / `five acts` korrigiert, `OPEN DOSSIER →` & Lade-Fallback zweisprachig gemacht, Lobby-Hinweise gestrafft, einheitliche `✕`-Close-Buttons gesetzt und `#towerDetailsBack` auf `CANCEL` vereinheitlicht.
  - `IronPath/localization-{static,more-static,}-de.mjs`, `IronPath/language.mjs`: deutsche Übersetzungen (`50 MISSIONEN`, `fünf Akte`, `AKTE ÖFFNEN →`, gestraffte Lobby-Hilfe) synchronisiert und Cache-Import `localization-static-de.mjs` nachgezogen.
  - `IronPath/menu-redesign.css`, `IronPath/style.css`, `IronPath/interface-redesign.css`: `#settingsDialog`-Banner/Karten/Schalter/Slider, `#afkRestDialog` / `#afkSessionFailure`, Harmonisierung von `#languageGate`/`#tutorialDialog`/`#storyCinematic`/`#runResults`/`#patchNotes`/`#skillDialog`/`#socialPopup`/`#multiplayerPrompt`/`#versionNotice`/`#deploymentCheck`, `<860px`-Vollbild-Sheets, `#versionNotice`-Lobby-/Kampf-Kollisionsschutz, tote CSS-Regeln entfernt (`#soundToggle`, `.danger-utility`, `.endless-loadout-links`).
  - `IronPath/tests/{menu-redesign,endless-launcher,multiplayer-build-stamp}.test.mjs`, `IronPath/browser-tests/{command-center,interface-smoke,cache-wave,avatar-handover}.cjs`, `IronPath/release-version.json`, `IronPath/patch-notes.mjs` (`block9c`, `pr: 322`) & gesamte `?v=20261119-block9c`-Cache-Welle.
- **Prüfungen:**
  - `node --test IronPath/tests/*.test.mjs` & `node IronPath/stress-tests/run.mjs`: alle Unit-Suiten (inkl. `multiplayer-build-stamp`, `patch-notes`, `settings`, `afk-rest`, `menu-redesign`, `endless-launcher`, `campaign-ui`, `translation-coverage`, `dom-contract`) und Stressläufe **grün** (`release-pages-site` erwarteter Checkout-Skip).
  - GitHub CI Run `44499916298` auf PR #322 (`dffbd20`, vor Cache-Stamp-Welle): **13/13 Checks bestanden** (`database-rules`, `game-regressions`, `interface-browser-smoke` inkl. Chromium `interface-smoke.cjs` & `command-center.cjs`, alle 8 `party-finalization-browser`-Jobs, Vercel). Finaler Release-Lauf auf PR #322 (`583a1c7a`) gemergt und über Pages (`44504375079`) live gestellt.
- **Offen:** Echte Desktop- und Handy-Sichtung; im Folgeschritt `20261119-block9d` (PR #323) erweitert.
- **Git / PR / Release:** PR #322 gemergt (`583a1c7a`) auf `main`.

## IPL-0073 – Block 9d (`20261119-block9d`, PR #323): Einzelsitzungs-Schutz (`activeSessions`), randfreie Gemälde, UI-/Sprachauswahl-Fixes & DE-Lokalisierung
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); Arbeitsbranch `arena/92c6a81f-0815games-github-io` ab `583a1c7a53e499d5d2e7effb81906f607762b7a1` (`main`), PR #323.
- **Block / Ziel:** Vier Arbeitspakete auf Block-9-Basis umsetzen: (1) verhindern, dass derselbe Account in zwei Browser-Fenstern/Geräten gleichzeitig aktiv bleibt (`activeSessions/$uid`-Lease + Übernahme-Option & RTDB-Regelkandidat), (2) weiße Außenränder/Zierrahmen an Gemälden sauber beschneiden und `#menuResults` unter den Spielmodi anordnen, (3) unsichtbares `#languageSelect` in den Einstellungen, `.session-takeover-field`-Vererbung, Desktop-Dialog-Scroll & Mobile-`<380px`-Layouts beheben, (4) verbleibende unübersetzte Texte (`endless-launcher.mjs` `command.none`, statische HTML-Knoten, `#enlistStamp`, offener AFK-Dialog, Freundes-/Lobby-Fehler) zweisprachig schließen.
- **Änderungen / Dateien:**
  - **Paket 1 (Single-Session & Rules):** `IronPath/active-session.mjs`, `IronPath/account.js`, `IronPath/index.html` (`#sessionTakeoverField`/`#sessionTakeoverCheck`), `IronPath/localization-account-de.mjs`, `IronPath/firebase/{block9d-session-candidate.mjs,firebase-block9d.emulator.json,BLOCK9D-SESSION-ROLLOUT.md,BLOCK9D-RULES-TO-PUBLISH.json}`, `IronPath/tests/active-session.test.mjs`, `IronPath/firebase/rules-test/{active-session.test.mjs,active-session-browser.cjs,package.json}`, `.github/workflows/ironpath-firebase-rules.yml`.
  - **Paket 2 (Artwork & Command-Layout):** `IronPath/assets/{story-tower,story-marsh,story-rook,story-sera,endless-frontline,class-medic,armory-kit}.jpg` rand-/rahmenfrei beschnitten und per Lanczos auf Zielmaß skaliert; `IronPath/index.html` (`#menuResults` nach `.mode-grid`); `IronPath/menu-redesign.css` (Desktop-Grid-Zeilen, `.command-results`-Balken, `overflow: hidden; background-clip: padding-box` auf Modus-/Endlos-/Feldschule-Karten).
  - **Paket 3 (UI- & Layout-Fixes):** `IronPath/menu-redesign.css` (`#settingsDialog .language-flag-control`/`.flag-icon`/`select`-Reset auf `position: static; opacity: 1`, `.session-takeover-field`-Reset, Desktop-Dialog-`overflow-y: auto`, Mobile `#skillDialog[open] .skills-header` & `@media (max-width: 380px)`).
  - **Paket 4 (DE-Lokalisierung):** `IronPath/endless-launcher.mjs` (`translate('command.none')`), `IronPath/tests/endless-launcher.test.mjs`, `IronPath/recruit-screen.mjs` (`refresh()` aktualisiert `#enlistStamp`), `IronPath/account.js` (`recruitScreen.refresh()` & `paintAfkRestCard()` bei Sprachwechsel), `IronPath/index.html` (`data-i18n-text`-Attribute ergänzt), `IronPath/localization-more-static-de.mjs` & `IronPath/localization-account-de.mjs` vervollständigt.
  - **Cache-Welle & Tests:** `IronPath/tests/{menu-redesign,multiplayer-build-stamp}.test.mjs`, `IronPath/browser-tests/{interface-smoke,command-center,cache-wave,avatar-handover}.cjs`, `IronPath/release-version.json`, `IronPath/patch-notes.mjs` (`block9d`, `pr: 323`) & gesamte `?v=20261119-block9d`-Cache-Welle.
- **Prüfungen:**
  - `node --test IronPath/tests/*.test.mjs` (über alle 258 Dateien: **1.159 bestanden, 0 fehlgeschlagen, 1 übersprungen**), `node IronPath/stress-tests/run.mjs` sowie GitHub CI Run `44518821803` (**13/13 Checks bestanden**, inkl. `database-rules` mit `test:block9d` und `interface-browser-smoke` mit `active-session-browser.cjs`).
  - Nach Merge auf `main` (`6e634551`, `2026-11-19T12:06:00Z`): `pages-build-deployment` (`44520734267`) und `Iron Path Firebase party rules` (`44520735878`, **11/11 Jobs**) komplett **grün**.
- **Git / PR / Release:** PR #323 gemergt (`6e634551`) auf `main`; `20261119-block9d` auf GitHub Pages live.


## IPL-0074 – Block-9d-RTDB-Rules live bestätigt (`BLOCK9D-RULES-TO-PUBLISH.json`)
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); nach Merge von [PR #323](https://github.com/0815games/0815games.github.io/pull/323) (`6e634551830de16ab6fcd690144b4c0a929e5f08`).
- **Branch / Basis:** `arena/f7cdd26a-0815games-github-io` ab `6e634551830de16ab6fcd690144b4c0a929e5f08` (`main`).
- **Betreiberbestätigung (ohne unabhängigen Serverabruf aus der Sandbox):** Der Betreiber bestätigte, dass die in [`IronPath/firebase/BLOCK9D-RULES-TO-PUBLISH.json`](../firebase/BLOCK9D-RULES-TO-PUBLISH.json) bereitgestellten Block-9d-RTDB-Rules (inkl. `/rules/activeSessions/$uid`) live in der Firebase Console veröffentlicht wurden.
- **Änderungen / Dateien:**
  - `IronPath/PATCH-BLOECKE.md`, `IronPath/PATCH-LOG.md` (`IPL-0073` Merge/Deploy nachgetragen + `IPL-0074` protokolliert), `IronPath/patch-notes.mjs` (`block9d`-Eintrag aktualisiert: `BLOCK9D-RULES-TO-PUBLISH.json` als vom Betreiber veröffentlicht dokumentiert, verbleibender offener Punkt auf echte Desktop-/Handy-Sichtung vor Block 6 bereinigt).
- **Offen:** Echte Desktop- und Handy-Sichtung auf `20261119-block9d` (inkl. Einzelsitzungs-Schutz über mehrere Fenster/Geräte) vor Beginn von Block 6.


## IPL-0075 – Block 9e (`20261119-block9e`, PR #324): Mehrfenster-Sitzungsschutz, rotierende Login-Banner, HQ-Zurück-Navigation & Endlos-Karussell
- **Zeit / Quelle:** 2026-10-31 UTC (Sitzungsvorgabe); Branch `arena/f7cdd26a-0815games-github-io` ab `6e634551830de16ab6fcd690144b4c0a929e5f08` (`main`), PR #324 offen.
- **Block / Ziel:** Vier Nachbesserungen aus der ersten Block-9d-Sichtung umsetzen: (1) parallele Anmeldung im selben Browser/Gerät zuverlässig über zwei Tabs sperren, ohne beim Blockieren oder Übernehmen das geteilte Auth-IndexedDB des anderen Tabs zu invalidieren, (2) Login-Dossier mit vier rotierenden Szenenbildern & identischem EN/DE-Flaggen-Schalter wie in den Einstellungen aufwerten, (3) alle neun Command-HQ-Dialoge mit einheitlichen `← COMMAND CENTER` / `← KOMMANDOZENTRALE`-Buttons (kontextuelles `✕` im laufenden Gefecht) und dedizierten `1376×768`-Moduskarten (`mode-campaign.jpg`, `mode-endless.jpg`, `mode-multiplayer.jpg`) versehen, (4) Endlos-Auswahl (`#endlessLaunch`) auf ein einzelnes Karussell (Standard `Random`, `DEPLOY` oben, `CANCEL` unten) mit neuem `endless-random.jpg` verschlanken.
- **Änderungen / Dateien:**
  - **Paket 1 (Mehrfenster-Sitzungssperre):** `IronPath/active-session.mjs`, `IronPath/account.js`, `IronPath/firebase/rules-test/active-session-browser.cjs` (Schritte `1b`–`1c`), `IronPath/tests/active-session.test.mjs`: ephemerer Pro-Tab-`createWindowSessionId()` + `createSameBrowserSessionMonitor()` (Web Locks + `BroadcastChannel`), Verzicht auf `accountServices.logout()` bei blockiertem/übernommenem Tab im selben Browser, `occupiedHolder`-Erfassung im RTDB-`runTransaction`, saubere Re-Aktivierung bei identischer UID, `pagehide`-Freigabe & 10-s-Heartbeat.
  - **Paket 2–4 (Login-Szene, Sprache, HQ-Navigation & Endlos-Karussell):** `IronPath/login-scene.mjs`, `IronPath/language.mjs` (`#languageToggle` & `#authLanguageToggle` plus `#languageSelect`-Fallback für Mock-Tests), `IronPath/auth-form.mjs`, `IronPath/command-center.mjs` (`onViewChange`), `IronPath/settings.mjs`, `IronPath/endless-launcher.mjs`, `IronPath/account.js` (`syncContextBackButtons`, Sprachwechsel-Refresh für Auth-Form & Endlos-Karussell), `IronPath/localization-{settings,more-static}-de.mjs`.
  - **Artworks (`IronPath/assets/`, alle `1376×768` text-/randfreie JPEGs):** `login-bunker-watch.jpg`, `login-radio-rain.jpg`, `login-convoy-prep.jpg`, `login-tactical-map.jpg`, `mode-campaign.jpg`, `mode-endless.jpg`, `mode-multiplayer.jpg`, `endless-random.jpg`.
  - **Markup, Styling & Tests:** `IronPath/index.html`, `IronPath/style.css`, `IronPath/menu-redesign.css` (inkl. `flex-wrap: nowrap` auf Freunde-/Bestenlisten-Header für 320px-EN/DE-Breite), `IronPath/tests/{login-scene,first-run-layout,settings,endless-launcher,menu-redesign,multiplayer-build-stamp,skill-draft-ui}.test.mjs`, `IronPath/browser-tests/{interface-smoke,command-center,multiplayer-prompt-layout,wave-consensus}.cjs`, `IronPath/release-version.json`, `IronPath/patch-notes.mjs` (`block9e`, `pr: 324`) & vollständige `?v=20261119-block9e`-Cache-Welle.
- **Prüfungen:**
  - `node --test IronPath/tests/*.test.mjs` (**1.163 bestanden, 0 fehlgeschlagen, 1 erwarteter Ancestor-Skip** in `release-pages-site.test.mjs`), `node IronPath/stress-tests/run.mjs` und Syntaxprüfung (`node --check`) vor Commit ausgeführt.
  - GitHub CI Run `44533883836` auf `4f7d7cd` (PR #324): **13/13 Checks bestanden** (`database-rules` inkl. `test:block9d`, `game-regressions`, `interface-browser-smoke` inkl. Chromium `active-session-browser.cjs` Schritte `1b`–`1c`, `interface-smoke.cjs` EN/DE auf `320/390/1440px`, `command-center.cjs`, `wave-consensus.cjs`, `multiplayer-prompt-layout.cjs`, alle 8 `party-finalization-browser`-Jobs sowie Vercel-Preview).
- **Git / PR / Release:** Commit `689f1a6` + `4f7d7cd` + `c73c107` auf `arena/f7cdd26a-0815games-github-io` gepusht; **PR #324 gemergt** (`57ebfaf4e79ff67db09c06ec780344158a7e133f`, CI `44535397077` 13/13 grün; Deploy `pages-build-deployment` `44544569708` & main CI `44544571418` 11/11 grün). `20261119-block9e` auf GitHub Pages live.
- **Offen:** Geräteabnahme führte direkt zur UI-Korrekturwelle **Block 9f (`IPL-0076`)**.


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
