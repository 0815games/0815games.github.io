# Iron Path – Patch-Log

Dieses Protokoll ist der dauerhafte Einstiegspunkt für zukünftige Änderungen.
Es ergänzt den [Patchplan](PATCH-BLOECKE.md) und das [Datenblatt](DATENBLATT.md),
aber ersetzt weder Git noch die GitHub-PR-Historie. Die dazugehörige
[Arbeitsanweisung](../AGENTS.md) verlangt, dieses Log vor der Arbeit zu lesen
und nach jedem in sich abgeschlossenen Schritt fortzuschreiben.

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

```text
## IPL-NNNN – kurzer Titel
- Zeit / Quelle: … (oder nicht sicher)
- Block / Ziel: …
- Branch / Basis: …
- Änderungen / Dateien: …
- Prüfungen: Befehl oder CI-Link, Ergebnis, Art des Tests und Grenzen …
- Git / PR / Release: exakte belegte Kennungen und tatsächlicher Status …
- Offen / nächster Schritt: …
```

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
- **Portraits:** WESSEN Gesicht eine Karte zeigen darf, entscheidet der
  Aufrufer, nicht das Panel (`portraitFor`). Das eigene kommt aus dem schon
  gerenderten Portrait, das eines Mitspielers live aus genau den zwei
  Profilfeldern, die die Block-2-Regeln freigeben. Solange die nicht
  veröffentlicht sind, wird das Lesen verweigert und die Karte zeigt den
  neutralen Platzhalter – dieselbe ehrliche Antwort, die die Freundesliste
  heute schon gibt.
- **Befund beim Bauen (CSS):** `.four-party-list li` ist eine Klasse plus ein
  Element und gewinnt damit gegen ein nacktes `.party-card` – die Karte hätte
  die zentrierte Ausrichtung der Zeile geerbt. Die Regel heißt deshalb
  `.party-roster .party-card`.
- **Befund beim Bauen (Cache):** `style.css` ist per Test an die Release-Welle
  (`release-version.json`) genagelt. Eine Änderung mitten in der Welle würde
  ein zurückkehrendes Browserfenster mit neuem Markup und alter CSS treffen.
  Das Layout liegt darum in `interface-redesign.css`, das eine eigene
  Cache-Welle trägt.
- **Übersetzung:** „Team {letter}" war der einzige neue String; er liegt jetzt
  im deutschen Wörterbuch (der Wächter in `translation-coverage.test.mjs`
  bestand darauf, zu Recht).
- **Änderungen / Dateien:** `firebase-four-panel.mjs` (Karten,
  Portrait-Wachen), `account.js` (Anschluss der Portraits), `index.html`
  (Klasse am Roster und neue Cache-Welle für `interface-redesign.css`),
  `interface-redesign.css` (Kartenlayout), `localization-de.mjs` (ein String),
  `tests/four-panel.test.mjs` (fünf neue Fälle, zwei umgestellte) und
  `tests/party-end-panel-race.test.mjs` (Dokument-Double trägt die
  Eigenschaften, die eine Karte braucht).
- **Prüfungen:** 27/27 in `four-panel.test.mjs`; vollständiger serieller Lauf
  1031 bestanden, 0 fehlgeschlagen. Die Browserläufe in CI
  (`multiplayer-browser`, `social-cleanup-browser`) suchen den Namen im Roster
  weiterhin als Text – die Karte schreibt ihn genau einmal, damit diese Suche
  eindeutig bleibt.
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
- **Git / PR / Release (nachträglich):** Arbeitscommit `6b50c60` auf
  `arena/19598e48-0815games-github-io`, gepusht; PR
  [#300](https://github.com/0815games/0815games.github.io/pull/300)
  „Block 3 / B: bestätigte EP im Kampf-HUD“ mit **23/23 Checks grün**,
  gemergt 2026-11-17 04:53 UTC als `8672840`. Die Checks auf Main danach
  **14/14 grün**. Kein Deployment, keine produktiven Rules-/Datenänderung,
  kein Wartungsschalter. Die Veröffentlichung von Block 2 bleibt offen.
