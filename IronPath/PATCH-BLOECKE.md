# Iron Path – Patch-Blöcke und Arbeitsstand

Dieses Blatt führt die sechs vom Betreiber nachgereichten Originalblöcke und
unterscheidet **bereits Gebautes, historische Nutzerbestätigungen und noch
fehlende Anforderungen oder Nachweise**. Später genannte Wünsche werden in
A–E zugeordnet; das neue Lebens- und Angriffssystem ist als **zusätzlicher
Block 7** vorgeschlagen, nicht als weitere Originalnummer. Ein offener Test
bedeutet nicht automatisch, dass eine vorhandene Funktion kaputt ist.

**Korrektur der früheren Bestandsaufnahme:** Mehr als bloße Grundlagen sind
fertig: unter anderem der gezielte Turmmenü-Pointerfix, mehrere Tutorial-Fixes,
die freigegebene Avatar-Überarbeitung und das Turm-Kit-System. Diese Arbeiten
werden nicht erneut als ungebaut eingeplant. Neue oder weitergehende Kriterien
sind von ihnen getrennt aufgeführt. Bei der Prüfung wurden auch drei konkrete
Fehler in den vorhandenen Turmkits gefunden; zwei sind noch offen, der dritte
wurde mit #289 behoben – siehe Block 5.

**Quellen und Grenzen:** Der vollständige ältere Chat ist hier nicht direkt
verfügbar. Geprüft wurden die überlieferte Gesprächszusammenfassung, die
PR-Beschreibungen und Commit-Historie auf GitHub, der aktuelle Code und Tests.
Die nachstehend wörtlich angeführten Nutzerbestätigungen stehen in den
jeweiligen PR-Beschreibungen; es ist keine Behauptung, den gesamten alten Chat
gesehen zu haben. Die Git-Historie des aktuellen Standes wurde nachgeladen und
die Abstammung der genannten Änderungen vom veröffentlichten Merge
[PR #288](https://github.com/0815games/0815games.github.io/pull/288)
(`05542181c2`) geprüft; die Git-Historie war bei dieser damaligen Prüfung
vollständig nachgeladen (`git rev-parse --is-shallow-repository`: `false`).
Inzwischen wurde [PR #289](https://github.com/0815games/0815games.github.io/pull/289)
als Build `20261031-patch3` veröffentlicht; der öffentliche Wartungsstatus wurde
anschließend als `open` abgefragt. Ein Website-Release beweist weder die live
aktiven Firebase-Rules noch eine echte Mehrgeräte-Abnahme. Die lokalen Tests
beschreiben ihren jeweiligen Prüfzeitpunkt; die in IPL-0003–0027 dokumentierten
Spielcode-Änderungen wurden mit #289 ausgeliefert. Rules-Kandidaten sind dadurch
nicht produktiv freigegeben;
der aktuelle Nachtrag und die Testliste stehen in
[IPL-0028](PATCH-LOG.md#ipl-0028--veröffentlichung-wiederöffnung-und-testliste).

**Datierung:** GitHub führt die Merges unter anderem mit den Zeitstempeln
04.11.2026 für #136, 08.11. für #196, 11.11. für #249/#265, 12.11. für
#277–#280, 13.11. für #286 und 15.11. für #287 (UTC). Als aktuelles Datum ist
für die Sitzung der 31.10.2026 UTC vorgegeben; die abgefragte Umgebungsuhr
zeigte für lokale Arbeiten dagegen zunächst 15.11. und später 16.11.2026 UTC.
Diese abweichenden Quellen werden getrennt angegeben, die Reihenfolge anhand der
Commit-Abstammung geprüft. Build-IDs bleiben unverändert und belegen für sich
keinen Veröffentlichungstag.

**Legende:** [x] markiert den genau beschriebenen vorhandenen oder bestätigten
Teil – nicht automatisch den gesamten Block. [ ] bezeichnet einen noch fehlenden
Teil, einen nachgewiesenen Fehler oder eine ausstehende Abnahme. Simulatoren,
Emulatoren und Browser-Doubles sind keine echten Geräte oder Live-Partien.

**Priorität:** Zuerst Block 1 in kleinen, testbaren Schritten, dann Block 2;
danach Oberfläche (3), Avatare (4), Skills (5), anschließend das **einheitliche
Menü- und Command-HQ-Redesign (Block 9)** vor dem großen Tutorial (6), damit
die spätere Tutorial-Menüführung bereits auf dem endgültigen Menü aufsetzt. Das
zusätzliche Lebenssystem (7/E) bleibt ein eigenes Vorhaben danach; seine genaue
zeitliche Einordnung und mögliche Folgen für das Tutorial sind gesondert
abzustimmen. Der Betreiber wünscht nach jedem sinnvollen, geprüften Schritt eine
Veröffentlichung und die anschließende Öffnung zum Testen; Wartung soll nur für
den genannten Merge-/Commit-Vorgang laufen. Nach dem Release #289 wurde die
Wiederöffnung öffentlich bestätigt. Ob ein Schritt tatsächlich veröffentlicht
oder geöffnet ist, zeigen die nachgetragenen Ereignisse im Patch-Log und der
aktuelle Status.
Diese Bestandsaufnahme selbst ändert keine Firebase-Rules oder Produktionsdaten.

## Schnellübersicht – sechs Originalblöcke + nachgeordnete Ausbau-Blöcke

Die Statusangaben unterscheiden **bereits veröffentlichte Teilfunktionen** von
weiteren Wünschen und fehlender Abnahme. Die ausführlichen Kriterien stehen
unverändert in den nachfolgenden Abschnitten; kein Block ist allein wegen einer
grünen Testsuite vollständig erledigt.

| Block | Stand | Bereits vorhanden oder veröffentlicht | Noch offen |
| --- | --- | --- | --- |
| [**1 · Multiplayer**](#1-zuerst-multiplayer-wieder-vollständig-spielbar-machen--mehrere-fixes-bereits-umgesetzt) | **80 %** | Mehrspielermodi (2–4 Koop, 1v1, 2v2), größere Karten + Kamera, Turm-/Abstimmungsfixes (`B1`/`B2`), Anfragekarten, Abschluss/Recovery/Feldabmeldung, Veteranen-Preisfix, 70-%-Hinweis und Browser-/Handy-Tests des Betreibers (`[IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers)`). | Umgang mit dauerhaft fehlenden Mitgliedern beim Party-Abschluss sowie Einsteigerbalance-Messung/-Abstimmung ([C](#c--multiplayer-mit-anfangscharakteren)); gleichzeitige 2–4-Geräte-Netzwechsel und Firefox bei Bedarf gesondert prüfen. |
| [**2 · Charakter und Freunde**](#2-charakter-löschen-freunde-und-einladungen--wesentliche-teilfälle-bereits-umgesetzt) | **92 %** | Charakterbereinigung + Live-Social-Cleanup-Rules, Abmeldung danach (`A3`), Einladungs-/Freundesfixes, `.info/connected`-Suchindex-Wiederholung, Porträtanzeige inkl. veröffentlichter Freundes-`.read`-Rules (`IPL-0056`), strenges `NFC_CASEFOLD_V2`-Namenssystem (`0` Abweichungen Client/Audit), stiller Login-Backfill & Konflikt-Dialog (`#nameConflictDialog`), `BLOCK2-RULES-TO-PUBLISH.json`-Kandidat (`IPL-0078`) + Betreiber-Tests in Browser und Handy. | Veröffentlichung von `IronPath/firebase/BLOCK2-RULES-TO-PUBLISH.json` in der Firebase Console zur serverseitigen Aktivierung von `characterNames` sowie abschließende Mehrgeräte-Sichtung. |
| [**3 · Oberfläche**](#3-kampf--und-party-oberfläche--bericht-und-rangabzeichen-bereits-gebaut) | **95 %** | 4er-Party-Roster-Karten (`#299`/`#307`), schlanke Kampf-Stufenanzeige (`#300`/`#310`), Turmschimmer + Glow (`#301`/`#306`), After-Action-Report mit Rang/Beförderung + „What’s Next“ (`#302`), mittige Popups (`#303`), Fähigkeits-HUD rechts unten (`D2`, `#304`/`#306`/`#311`), animierte Schussspuren (`D1`, `#305`), Freundes-`.read`-Rules veröffentlicht (`IPL-0056`) + Betreiber-Abnahme in Browser und Handy. | Netz-Datenmenge der Schüsse (Simulationsthema in `D1` bewusst zurückgestellt) sowie nächster `account.js`-Build-Stempel für gecachte Browser. |
| [**4 · Avatare**](#4-charaktererstellung-und-avatare--genehmigte-überarbeitung-bereits-live) | **90 %** | Layer-Pipeline, `avatar-sync.mjs` (`#313`), `avatar['.validate']` & Freundes-`.read`-Rules live (`IPL-0056`); Block-4-Neubau (`Idee 1` + `Umsetzungsidee A`: 12 frontale Basisköpfe, 23 reine Haar-/Bart-Layer, 5 Farben, `◀ / ▶`-Stepper, Migration) via [PR #314](https://github.com/0815games/0815games.github.io/pull/314) (`20261031-patch5`) und `#versionNotice`-Layoutfix + Spielstil-Artwork via [PR #315](https://github.com/0815games/0815games.github.io/pull/315) (`20261031-patch6`, `IPL-0062`) live; Versions-Popup vom Betreiber bestätigt. | Echte Browser-/Handy-Abnahme der neuen Avatare auf `20261031-patch6`. |
| [**5 · Skills**](#5-skills-neu-strukturieren--bestehende-turm-spezialisierungen-bereits-implementiert) | **97 %** | V2-Klassenbau (`20261118-block5`, [PR #318](https://github.com/0815games/0815games.github.io/pull/318) auf `main` gemerged, `IPL-0066`) + [`firebase/BLOCK5-RULES-TO-PUBLISH.json`](firebase/BLOCK5-RULES-TO-PUBLISH.json) ([PR #319](https://github.com/0815games/0815games.github.io/pull/319), `782b46fa`): 6. Klasse **Air Defense / Luftabwehr** (`Flak Curtain`, `Interceptor`, `Iron Dome`), exklusive Klassenwahl ab Level 2, 14-Knoten-Klassenbaum mit 6 SVG-Klassenabzeichen, 6 Klassen-Artworks (`assets/class-*.jpg`), 12 Spezialisten-Effekte & Turm-Auren, getrennte 2-Stufen-Klassenturmwege ab Rang 2/3, einmalige `v2;none`-Migration + lokales Backup sowie vom Betreiber bestätigte Live-Veröffentlichung der Block-5-RTDB-Rules (`IPL-0068`). | Echte Mehrgeräte-Abnahme auf `20261118-block5`. |
| [**9 · Menü-Redesign**](#9-einheitliches-menü-layout--kommandotafeln-desktop--app-shell-mobile) | **99 %** | Vor Block 6 eingeschoben (Betreiberentscheid) und in [PR #320](https://github.com/0815games/0815games.github.io/pull/320) (`20261119-block9`), [PR #321](https://github.com/0815games/0815games.github.io/pull/321) (`20261119-block9b`), [PR #322](https://github.com/0815games/0815games.github.io/pull/322) (`20261119-block9c`), [PR #323](https://github.com/0815games/0815games.github.io/pull/323) (`20261119-block9d`) sowie [PR #324](https://github.com/0815games/0815games.github.io/pull/324) (`20261119-block9e`, offen) umgesetzt: konsolidierte Command-HQ-Ansicht, einheitliche 3-Zonen-Kartenbanner & Dialoge (`← COMMAND CENTER` / `← KOMMANDOZENTRALE`), rotierender Login-Banner + Flaggen-/Kürzelschalter, Einzelbild-Endlos-Karussell, eigene Modus-Artworks, Mehrfenster-Sitzungsschutz (`active-session.mjs`) & vom Betreiber bestätigte Live-Veröffentlichung von [`BLOCK9D-RULES-TO-PUBLISH.json`](firebase/BLOCK9D-RULES-TO-PUBLISH.json) (`IPL-0074`). | Echte Geräteabnahme (Desktop & Handy) vor Beginn von Block 6. |
| [**6 · Tutorial**](#6-tutorial-als-großer-zusammenhängender-einsatz--bisheriges-tutorial-gebaut-und-teilfix-bestätigt) | **25 %** | Fünf-Wellen-Einführung mit Feld-Coach, Wiederholung ohne Doppelbelohnung, Abbruch-/Lifecycle-Fixes (`#196`, `#278`–`#280`, `#289`) + Betreiber-Tests in Browser und Handy. | Charakterbezogenes Annehmen/Ablehnen nach Erstellung, große zusammenhängende Mission + komplette Menüführung auf dem neuen Block-9-Menü (ohne Löschen/Abmelden), vertonte Generalstimme (DE/EN + Untertitel) sowie Schutzlogik für die neue Mission. |
| [**7 · Leben & Gegenangriffe (E)**](#7-zusätzlich-vorgeschlagen-leben-und-gegenangriffe--offen) | **5 %** | Bunker besitzt bereits Lebenspunkte und bestehende Reparatureffekte. | Komplettes Lebens-, Angriffs-, Vorwarnungs- und Reparatursystem für Soldaten, Türme und Bunker in allen Spielmodi samt Simulation, Multiplayer-Sync und Balance. |
| [**8 · Sammelstelle & Nacharbeiten**](#8-was-nach-den-patches-ansteht--sammelstelle) | **80 %** | Mittige Popups + `#versionNotice` mit Artwork (`#306`, `#315` bestätigt), AFK-Pausebild + Rückkehr zum Login (`#306`), Feld-Minimalismus (`#308`–`#312`), einheitliche rechte Buttonspalte, Burger-Menü unten, Map-Titelkarte (`map-intro.mjs`), starker Turm-Glow (`#306`), Rules-Datei erstellt + Betreiber-Tests; `20261031-patch7` via [PR #316](https://github.com/0815games/0815games.github.io/pull/316) (`a69675bb`, CI 13/13, Pages `44316906495`, Main-CI `44316907201`) live; begrenzter Max-1-Retry in `party-finalization-browser` (`IPL-0065`). | Block-2-Namens-Rules/Audit (`CHARACTER-NAME-AUDIT.md`), Abschluss-Altsave-Check sowie echte Geräteabnahme von `20261031-patch7` / `20261031-patch8`. |

**Zusätzlich, nicht Teil der sechs Originalblöcke:** [Block 7/E](#7-zusätzlich-vorgeschlagen-leben-und-gegenangriffe--offen) schlägt ein
Lebens-, Angriffs- und Reparatursystem für Soldaten, Türme und Bunker vor. Auf
Wunsch des Betreibers ist es **als künftiger Patch nach Block 6 eingeplant**
([IPL-0030](PATCH-LOG.md#ipl-0030--feldnotizen-im-spiel-und-block-7-als-künftiger-patch)):
ein eigenes, noch nicht umgesetztes Vorhaben, an dem wir uns der Reihe nach
entlangarbeiten. Die Werte in Abschnitt E bleiben ungetestete Startvorschläge.
Die Zusatzwünsche A–D zu Namen/Freunden, Anfragen, Einsteigerbalance und
Schüssen/Fähigkeit sind unten ausdrücklich den Blöcken zugeordnet.

## Kommende Patches – Reihenfolge

Diese Liste ist die Arbeitsreihenfolge und dient als Haken, an dem die
nächsten Schritte hängen. Sie ist **kein Terminplan**: ein Patch gilt erst als
erledigt, wenn Code, Tests und die passenden echten Abnahmen vorliegen.

| # | Künftiger Patch | Inhalt (Kurzform) | Stand |
| --- | --- | --- | --- |
| 1 | [Block 1 · Multiplayer](#1-zuerst-multiplayer-wieder-vollständig-spielbar-machen--mehrere-fixes-bereits-umgesetzt) | Restpunkte: dauerhaft fehlende Mitglieder beim Abschluss, Einsteigerbalance (`C`). | **80 %** · In Arbeit (Browser-/Handy-Tests abgenommen) |
| 2 | [Block 2 · Charakter und Freunde](#2-charakter-löschen-freunde-und-einladungen--wesentliche-teilfälle-bereits-umgesetzt) | `NFC_CASEFOLD_V2`, stille Login-Reservierung, Konflikt-Dialog (`#nameConflictDialog`) & `BLOCK2-RULES-TO-PUBLISH.json` gebaut (`IPL-0078`); offen: Rules-Publish in Firebase Console & Mehrgeräteabnahme. | **92 %** · Code & Rules-Kandidat fertig (`20261119-block2`), Rules-Publish offen |
| 3 | [Block 3 · Oberfläche](#3-kampf--und-party-oberfläche--bericht-und-rangabzeichen-bereits-gebaut) | Gebaut und im Browser/Handy abgenommen; Porträt-Rules live; offen nur Netz-Datenmenge (`D1`) und Build-Stempel. | **95 %** · Abgenommen (bis auf Build-Stempel & D1-Datenmenge) |
| 4 | [Block 4 · Avatare](#4-charaktererstellung-und-avatare--genehmigte-überarbeitung-bereits-live) | Neubau (`Idee 1` + `Umsetzungsidee A`, PR #314) & `#versionNotice`-Layoutfix + Spielstil-Artwork (PR #315) live auf `20261031-patch6` (`IPL-0062`); Versions-Popup bestätigt, Avatar-Abnahme offen. | **90 %** · Live auf `20261031-patch6` (Popup bestätigt; Avatar-Abnahme offen) |
| 5 | [Block 5 · Skills](#5-skills-neu-strukturieren--bestehende-turm-spezialisierungen-bereits-implementiert) | V2-Klassenbau (`20261118-block5`, PR #318) & [`BLOCK5-RULES-TO-PUBLISH.json`](firebase/BLOCK5-RULES-TO-PUBLISH.json) (PR #319) gemergt; Betreiber bestätigte Live-Veröffentlichung der Block-5-RTDB-Rules (`IPL-0068`); offen: echte Geräteabnahme. | **97 %** · Spielcode & Rules live (`20261118-block5`), Geräteabnahme offen |
| 6 | [Block 9 · Menü-Redesign](#9-einheitliches-menü-layout--kommandotafeln-desktop--app-shell-mobile) | Einheitliche Command-HQ-Oberfläche (Desktop 2-Spalten-HQ / Mobile App-Shell mit Daumen-Leiste), 3-Zonen-Artwork-Dialoge, Terrain-Endloswahl, Settings-Account/Passwortänderung, Einzelsitzungs-Schutz (`activeSessions/$uid`) & live bestätigte `BLOCK9D`-Rules (`IPL-0074`) vor Block 6. | **99 %** · Spielcode (`20261119-block9d`) & Rules live, Geräteabnahme offen |
| 7 | [Block 6 · Tutorial](#6-tutorial-als-großer-zusammenhängender-einsatz--bisheriges-tutorial-gebaut-und-teilfix-bestätigt) | Charakter-Auftragsakte, große vertonte Mission mit Generalstimme und anschließender Menüführung auf Basis von Block 9. | **25 %** · Als Nächstes nach Block 9 |
| 8 | [Block 7 · Leben, Gegenangriffe und Reparaturen](#7-zusätzlich-vorgeschlagen-leben-und-gegenangriffe--offen) | Leben für Soldaten/Türme, Angriffe mit Vorwarnung, Reparatur statt Verlustspirale, gleiche Regeln in allen Modi. | **5 %** · Geplant (bleibt zuletzt) |
| 9 | [Block 8 · Nach den Patches](#8-was-nach-den-patches-ansteht--sammelstelle) | Sammelstelle: UI-Feinschliff (`#306`–`#315`) & `20261031-patch7` ([PR #316](https://github.com/0815games/0815games.github.io/pull/316), `a69675bb`) live; Max-1-Retry auf `party-finalization-browser` (`IPL-0065`); offen: Namens-Audit, Altsaves & Geräteabnahme. | **80 %** · Sammelstelle |

**Im Spiel sichtbar:** Unter **FELDNOTIZEN** in der Kommandozentrale zeigt eine
Ansicht dieselbe Einteilung – Reiter *Veröffentlicht* (was mit welchem Build
live ist) und Reiter *Was als Nächstes kommt* (die aktiven/geplanten Blöcke
einschließlich Block 9 vor Block 6 und Block 7 als letztem Schritt). Die Daten
liegen in `patch-notes.mjs`; die ausführlichen Kriterien bleiben in diesem
Blatt und im Patch-Log.

## Ursprünglicher Gameplan – vollständige Zuordnung

### 1. Zuerst: Multiplayer wieder vollständig spielbar machen – mehrere Fixes bereits umgesetzt

**Gemeldete Fälle:** In einer Dreierpartie öffneten eigene und fremde Türme
kein Menü; eine 2×-Anfrage in Welle 2 oder 3 zeigte keine sichtbare Reaktion.
Nach „Run beenden“ auf der Tutorialkarte blieb „Aufgabe zeigen“ im Hauptmenü
und Multiplayer sichtbar; genannt wurden ein Handy im Hochformat und Firefox
auf dem Laptop. Ob jeder Bericht vor oder nach dem jeweils einschlägigen Fix
entstand, ist nicht sicher belegt.

- [x] **Rückzugskarte gezielt repariert:**
  [PR #196](https://github.com/0815games/0815games.github.io/pull/196)
  adressierte die gemeldete iPhone-Verkleinerung und die konkurrierende
  Browser-Pinch-Geste. [PR #249](https://github.com/0815games/0815games.github.io/pull/249)
  ergänzte Leseskala, korrekt neu aufgebaute Kamera bei späteren Rückzügen und
  funktionierendes `MAP: LARGE` am Desktop. Laut #249 wurden Sektor 3 und 4 im
  Desktop-Browser mit rund 99 % Canvas-Abdeckung geprüft. Der Regressionstest
  `browser-tests/retreat-viewport.cjs` simuliert die entsprechenden Kartenwechsel
  mit lokalem Testkonto – keine echte Handy-Partie bis Welle 10.
- [x] **Große Mehrspielerkarten und Kamera veröffentlicht:**
  [PR #286](https://github.com/0815games/0815games.github.io/pull/286)
  brachte größere Zweierfelder, unverzerrte Vollbildfläche, Schwenken, Zoom und
  `FIT`. Chromium-Smokes mit Transport-Doubles prüfen u. a. Hoch-/Querformat,
  Bauplätze, Kamera und eigene/fremde Turmmenüs.
- [x] **Turmmenü-Pointerfix tatsächlich gebaut:** Derselbe PR #286 behandelt
  gezielt den Kompatibilitäts-`click` nach `pointerup`, der ein gerade geöffnetes
  Menü sofort wieder schließen konnte. Der Drei-Spieler-Browsertest öffnet
  eigene und fremde Turmmenüs mit Maus und Touch. Der mit #289 erweiterte Test
  führt auch je ein Upgrade aus und prüft die Belastung des eigenen Kontos;
  der Chromium-Test verwendet weiterhin einen künstlichen Transport und beweist
  nicht, dass jeder gemeldete Geräte- oder Netzwerkfehler erledigt ist.
- [x] **Drei-/Vierer-Browser mit lokalem Firebase:** Echte Spieloberflächen und
  SDKs bauten Bobs Turm, Alice verbesserte ihn; Cara baute und verbesserte den
  eigenen Turm. Alle Emulator-Ansichten und UI-Geldanzeigen stimmten. Auch die
  3-/4-SDK-Tests prüfen getrennte Konten. Die Browser emulieren Touch/Maus und
  verwenden synthetische Konten, keine echten Geräte oder produktiven Rules.
- [x] **Schneller Ausbau mit #289 abgesichert:** Nach bestätigtem Bau wird keine
  überflüssige Reservierungsfreigabe mehr gesendet. Ein ausdrücklich bewachter
  Upgrade-Klick kann kurz hinter Bewegung oder Reservierungsfreigabe warten;
  verändertes Menü, Turm, Spielfeld oder Verbindung verwerfen ihn. Der zuvor
  fehlgeschlagene Emulatorfall bestand danach erneut; die genaue Ursache des
  einzelnen Fehllaufs wurde nicht instrumentiert
  ([IPL-0013](PATCH-LOG.md#ipl-0013--block-1-schneller-turmausbau-nach-bau-oder-bewegung)).
- [x] **Unterschiedliche Weglängen mit #289 korrigiert:** Zielerfassung und
  Bunkerankunft verwenden jetzt wie die Bewegung den jeweiligen Gegnerweg.
  Ohne dies blieben Gegner auf kürzeren Nebenwegen teils stehen oder trafen auf
  längeren Wegen zu früh; Welle 1 auf allen Squad-Karten ist mit drei und vier
  Spielern simuliert geprüft ([IPL-0011](PATCH-LOG.md#ipl-0011--block-1-unterschiedliche-gegnerwege-und-echte-emulator-browser)).
- [x] **Betreiber-Tests im Browser und am Handy ohne Beanstandung ([IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers)):**
  Turm-Upgrade-Kette (Antippen → Menü → Upgrade → Übertragung), Kartenbedienung
  und Hoch-/Querformat wurden im Browser und mobil getestet; ein gezielter
  gleichzeitiger 3-/4-Geräte-Dreierfall inklusive Firefox und Endless-Rückzug
  bis Welle 10 kann bei Bedarf gesondert nachgezogen werden.
- [x] **Veteranen-Preisfehler mit #289 behoben:** Die Oberfläche verwendet beim
  Upgrade dieselbe Rabatt- und Rundungsfunktion wie die Simulation. DOM- und
  Transport-Doubles prüfen eigene/fremde Türme, 306 Vorräte und Prestige 383;
  der Fix ist mit #289 veröffentlicht, echte Geräte- und Live-Abnahme stehen aus.
  Einzelheiten stehen bei den [Turmkits](#konkrete-befunde-zur-bestehenden-turm-spezialisierung).
- [x] **2×-Abstimmung ist mehr als ein Konzept:**
  [PR #136](https://github.com/0815games/0815games.github.io/pull/136)
  implementierte Anfragen durch beliebige Spieler und einstimmige Zustimmung
  während aktiver Wellen, Rücksetzung bei Wellenende, Disconnect und Recovery
  sowie UI-/Protokoll-/Emulatortests für die vorhandenen Modi.
- [x] **2×-Regressionsfälle und Korrekturen mit #289:** Bei 2v2 zeigt die
  empfangende Gegenseite jetzt den Namen des Anfragenden statt „Ein Spieler“.
  Verzögerte und bereits eingereihte Tempo-Befehle werden bei Rosterwechsel
  quittiert und verworfen. Der neue Browser sendet außerdem die zuletzt gesehene
  Wellen-/Tempo-Anfragekennung; der Host verwirft damit neue Anfragen oder 1×,
  die auf einem überholten Stand beruhen. Ältere Clients ohne dieses optionale
  Feld sind davon nicht geschützt ([IPL-0012](PATCH-LOG.md#ipl-0012--block-1-verzögerte-neuanfragen-gegen-neuere-abstimmungen-absichern)).
  Chromium mit echtem Hostkern und simuliertem Transport prüft Gastanfrage in
  Welle 2, Ablehnung, Rücknahme, Wiederverbindung und Einstimmigkeit für alle
  fünf Modi/Größen.
- [x] **SDK-/Rules-Emulator lokal:** Der Gast-2×-Pfad wurde mit Firebase-SDK
  und synthetischen Teilnehmern in Welle 1 für alle fünf Modus-/Größenfälle
  geprüft; Zweierfälle auch gegen lokale Release-/Wartungs-Rules-Kandidaten.
- [x] **Browser-/Firebase-Emulator lokal:** Im Zweier-Koop spielte der Gast
  Welle 1 durch und fragte 2× in Welle 2 an; beide Profile erhielten EP. In
  Drei-/Vierer-Koop wurden Wellen 1 und 2 gespielt, alle EP serverseitig gelesen
  und Gast-2× in Welle 3 einstimmig bestätigt. Nach Offline/Reconnect wurde die
  alte Anfrage verworfen. Ein Reconnect-Klick hinter einem Bewegungs-Receipt
  wartet mit dem veröffentlichten Fix geschützt statt wirkungslos abgewiesen zu werden
  ([IPL-0010](PATCH-LOG.md#ipl-0010--block-1-reconnect-und-wartende-abstimmungsbefehle),
  [IPL-0011](PATCH-LOG.md#ipl-0011--block-1-unterschiedliche-gegnerwege-und-echte-emulator-browser)).
- [x] **Betreiber-Tests im Browser und am Handy ohne Beanstandung ([IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers)):**
  2×-/Wellen-Pfade und das mittige Anfragezentrum ([B2](#b2-anfragen-mittig-als-popup))
  wurden im Browser und am Handy ohne nötige Verbesserungen getestet; gezielte
  2–4-Geräte-Gleichzeittests unter realem Netzwechsel/Last bleiben als Grenznotiz vermerkt.
- [x] **Host und Party – vorhandene Teilpfade:** Ein ausdrückliches separates
  Schließen durch den Host schließt die Party; Gäste erhalten eine Meldung.
  Synchronisierter Einsatzabschluss und Teile der Belohnungslogik sind getestet.
- [x] **Absichtlicher Hostabschluss mit #289 umgesetzt:** Endeansicht und eigene
  serverbestätigte Rewards werden von jedem Teilnehmer quittiert; erst nach allen
  Quittungen löscht der Host Party und Code. Ein kurzer Disconnect gilt nicht
  als Absicht. Berichte bleiben offen, Gäste erhalten eine Schließmeldung.
  Zwei-, Drei- und Vierer-Koop sowie eine bewusst gewählte verzögerte
  Host-Abmeldung bestanden im lokalen Chromium-/Firebase-Emulator
  ([IPL-0015](PATCH-LOG.md#ipl-0015--block-1-sicherer-hostabschluss-und-abmeldung-lokaler-zwischenstand)).
- [x] **Weitere lokale Abschlussfälle:** Ein Rules-abgelehnter Reward-Write
  und Retry bestanden im Emulator ([IPL-0016](PATCH-LOG.md#ipl-0016--block-1-serverseitig-abgelehnter-reward-und-cache-nachlauf));
  1 gegen 1 und 2 gegen 2 bestanden einschließlich eines durch 1 Test-HP
  beschleunigten natürlichen Endes ([IPL-0017](PATCH-LOG.md#ipl-0017--block-1-duell-abschluss-und-bericht-im-hauptmenü)).
  Der Host kann ein wegen eines fehlenden Spielers pausiertes Duell jetzt
  absichtlich beenden, ohne Kampf-Ticks auszuführen; geschlossen wird erst nach
  dessen Rückkehr und Quittung. Recovery mit bereits laufendem Abschluss und
  alle drei Abmeldeentscheidungen aus dem Feld bestanden lokal im Emulator
  ([IPL-0018](PATCH-LOG.md#ipl-0018--block-1-feld-abmeldung-pausierte-duelle-und-recovery)).
  Ein vorhandener Reward zählt nach Recovery erst nach einem erneuten
  serverbestätigten Compare-and-Set; der Bericht bestätigt alle endgültigen
  Masken statt nur einer früheren Quittung ([IPL-0019](PATCH-LOG.md#ipl-0019--block-1-servernachweis-auch-bei-bereits-gespeicherten-rewards)).
- [ ] **Grenzen des Abschlusses:** Dauerhaft offline oder früher ausgetretene
  Teilnehmer können das sichere Schließen blockieren; sofortige oder erzwungene
  Abmeldung kann ohne Recovery eine gestartete Gruppe zurücklassen. Recovery
  für neue Partys ist opt-in. Echte Geräte, reale Netzwechsel und produktive
  Rules sind nicht abgenommen.
- [x] **Tutorialreste bereits gezielt bearbeitet und historisch bestätigt:**
  #196 stoppt den Feld-Coach beim Abbruch und beendet ihn bei Niederlage;
  [PR #278](https://github.com/0815games/0815games.github.io/pull/278)
  beendet den anschließenden Guide beim Schließen im Hauptmenü.
  [PR #279](https://github.com/0815games/0815games.github.io/pull/279)
  versteckt Karte, Pille, Ring und Pfeil beim Eintritt ins Menü, pausiert dabei
  aber den Coachzustand. [PR #280](https://github.com/0815games/0815games.github.io/pull/280)
  dokumentiert die Nutzerbestätigung **„Tutorial hört sauber auf“** für den
  damaligen Fall. Diese Fixes sind nicht erneut als ungebaut zu behandeln.
- [x] **Lifecycle mit #289 erweitert und lokal mit Doubles geprüft:** Charakterwechsel
  und Partybeitritt stoppen Tutorial und Coach statt nur die Anzeige zu parken.
  Ein verzögerter Coachstart wird nach Abbruch, Sitzungswechsel und Partybeitritt
  verworfen; Trainingsstatus wird nicht in die neue Sitzung oder Party übernommen.
  Ein offenes Lobby-/Mehrspielerspiel blockiert den verzögerten Trainingsstart.
- [x] **Betreiber-Tests der Übergänge im Browser und am Handy bestanden ([IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers));**
  der mit #289 veröffentlichte Fix wurde im Alltag ohne Beanstandung getestet.
- [x] **Wellenanfrage durch jeden Spieler mit #289 veröffentlicht:** Einstimmigkeit,
  Rücknahme, Ablehnung und Disconnect-Fencing sind für alle Modi gebaut und mit
  Hostkern, Transport-Doubles und Chromium geprüft ([B1](#b1-welle-von-jedem-anfragbar)).
- [x] **SDK-/Rules-Emulator lokal:** Gast-Wellenanfrage, Ablehnung, Rücknahme,
  Reconnect ohne alte Zustimmung und einstimmiger Start bestanden für alle fünf
  Modus-/Größenfälle mit synthetischen Teilnehmern ([IPL-0009](PATCH-LOG.md#ipl-0009--blöcke-12-lokale-firebase--und-browser-emulatorprüfungen)).
- [x] **B1-Bedienung im Browser und am Handy vom Betreiber getestet ([IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers)).**
- [ ] **Einsteigerbalance offen ([C](#c--multiplayer-mit-anfangscharakteren)):**
  systematische Baseline-Messungen mit frischen Charakteren und Anpassung pro
  Teamgröße stehen noch aus (bisherige Zweier-70-%-Korrektur ist in C dokumentiert).

**Fertig-Kriterium:** Bauen, Upgraden, Kartenbedienung, Anfragen und Verlassen
müssen auf echten Geräten zusammenspielen, ohne Geisterparty oder Tutorialreste.
Diese vollständige heutige Abnahme ist aus den gefundenen Nachweisen nicht
ableitbar; das nimmt den oben dokumentierten Fixes und Bestätigungen nichts weg.

**Nächste kleine Schritte:**

1. Drei-/Viererfall mit eigenen/fremden Turm-Upgrades und Übertragung auf echten
   Geräten abnehmen; SDK- sowie kombinierte Browser-/Firebase-Emulatortests sind
   lokal grün, beweisen aber keine Geräte- oder Produktionsnetz-Abnahme.
2. Gast-2× und Gast-Wellenanfrage mit 2–4 echten Geräten prüfen; lokal sind
   Zweier-Browser bis Welle 2 und Drei-/Vierer-Browser bis zur 2×-Freigabe in
   Welle 3 grün. Vollständige Welle 3, Duelle und tatsächliche Netzwechsel sind
   über diesen Emulator-Browserpfad noch offen.
3. Die veröffentlichten Host-Ende-/Abmelde- und Recoverypfade einschließlich
   fehlender Teilnehmer auf echten Geräten und mit realen Netzwechseln prüfen. Ohne
   Nachweis der Zustellung und Speicherung weiterhin nicht vorzeitig schließen;
   verwaiste Gruppen und vorzeitig ausgetretene Spieler bleiben ein offener Fall.
4. Tutorialübergänge, Karten- und Rückzugsbedienung auf echten Geräten abnehmen;
   lokale Regressionen samt Charakterwechsel/Partybeitritt sind grün.
5. Jeden Fix getrennt testen; nach einem sinnvollen geprüften Schritt
   veröffentlichen und das Spiel wieder zum Testen öffnen.

### 2. Charakter löschen, Freunde und Einladungen – wesentliche Teilfälle bereits umgesetzt

**Gemeldeter Suchfall:** Ein bestehendes Konto bekam nach Charakterlöschung
unter demselben Account einen neuen Charakter mit anderem Namen; die Suche
funktionierte nicht wie erwartet. Wann dieser Bericht im Verhältnis zu #287
entstand, ist nicht sicher belegt.

- [x] **Bekannte Daten und Neunamenfall gezielt bearbeitet:**
  [PR #263](https://github.com/0815games/0815games.github.io/pull/263)
  räumte Freundesdaten zunächst best effort auf;
  [PR #287](https://github.com/0815games/0815games.github.io/pull/287),
  insbesondere [Commit `7498664`](https://github.com/0815games/0815games.github.io/commit/749866453f003cea7bf4bae20a65222687199b4a),
  ersetzte dies durch serverbestätigte atomare Löschung der **auffindbaren**
  Profil-, Freundes- und Einladungsdaten. Der Auth-Account bleibt bestehen;
  ein Fehler gilt nicht als bestätigte Löschung. Für ältere unvollständige
  Löschungen kann der Client einen erhaltenen Freundescode und Suchschlüssel
  auf den neuen Namen umstellen.
- [x] **Suche und Hinzufügen unter neuem Namen im Emulator geprüft:**
  `firebase/rules-test/social-cleanup.test.mjs` prüft sowohl neue Registrierung
  mit neuem Code als auch den behaltenen Alt-Code: alter Suchschlüssel wird
  entfernt, Code/Name/Index passen zusammen, ein zweites Konto sucht den neuen
  Namen, sendet eine Anfrage und die Freundschaft wird angenommen. Der
  reale Firebase-SDK-Browserfall `social-cleanup-browser.cjs` nutzt zwei
  isolierte synthetische Konten und prüft nach Alice → Alicia Suche in der
  Gegenrichtung, Anfrage, Annahme, Einladung, Beitritt und Party-Verlassen.
  [Offizielle Emulator-CI](https://github.com/0815games/0815games.github.io/actions/runs/43570287668)
  bestand. Der Betreiber meldete die Rules-Veröffentlichung und einen passenden
  Hash; dieser authentifizierte Abruf wurde hier nicht unabhängig ausgeführt.
- [ ] Reale Altbestände, weitere vom Nutzer berichtete Freundeslistenprobleme,
  parallele Geräte und eine echte Mehrgeräte-Abnahme bleiben gesondert zu
  prüfen. Atomar sind nur die im Update tatsächlich erfassten Pfade; nicht alle
  verwaisten Altlasten oder konkurrierenden Clients sind damit garantiert erfasst.
- [x] **Abmelden und Meldung mit #289 veröffentlicht:** Nach bestätigter Löschung
  meldet sich das Konto ab und zeigt einmalig „Dein Charakter wurde aus dem
  Dienst entlassen. Bitte melde dich erneut an.“ Ein Abmeldefehler bietet einen
  eigenen Wiederholungsweg. Unit- und Chromium-Tests mit synthetischen Auth-/DB-
  Doubles decken Erfolg, Fehler und Sitzungswechsel sowie einen Guard-Dokument-
  wechsel ab. Zwei isolierte Chromium-Sitzungen mit echten Firebase-SDKs und
  lokalen Auth-/RTDB-Emulatoren bestanden den Offline-/Wiederanmeldepfad;
  echte Geräteabnahme bleibt offen ([IPL-0009](PATCH-LOG.md#ipl-0009--blöcke-12-lokale-firebase--und-browser-emulatorprüfungen)).
- [x] **Freundesfenster mit #289 angepasst:** Suche und Freunde bleiben sichtbar;
  leere Einladungs-, eingehende und gesendete Anfragebereiche werden verborgen,
  Ladefehler getrennt angezeigt. Unit- und Chromium-Tests mit Doubles sind grün;
  die Änderung wurde mit #289 veröffentlicht.
- [x] **Freundesporträt-Anzeige mit #289 veröffentlicht:** Liste und „Daten“ teilen sich dasselbe aus dem
  gespeicherten Avatar zusammengesetzte Bild. Fehlende, unlesbare oder ungültige
  Angaben erhalten einen neutralen Platzhalter; fremde lokale Spiegel werden
  nicht verwendet. Unit-, Chromium- und SDK-/Firebase-Emulatorfälle prüfen
  Bildwechsel, beide Freundschaftsrichtungen, alte Rules und fehlende Daten
  ([IPL-0021](PATCH-LOG.md#ipl-0021--block-2-freundschaftsabläufe-und-lokale-freundesporträts)).
  Unbekannte Layer-/Look-IDs und nicht eindeutig zuordenbare alte Comic-Formate
  bleiben ebenfalls neutral statt ein geratenes Gesicht zu zeigen
  ([IPL-0024](PATCH-LOG.md#ipl-0024--block-2-ungültige-freundesporträts-und-cache-testkette)).
  Der lokale Kandidat gibt nur `avatar` und `gender` für bestätigte Freunde zum
  Lesen frei, nicht das Gesamtprofil oder Schreibrechte.
- [x] **Porträt-Rules vom Betreiber veröffentlicht ([IPL-0056](PATCH-LOG.md#ipl-0056--block-4-rules-veröffentlicht-layer-geisterbild-im-avatar-baukasten-belegt)).**
  Bestätigte Freunde dürfen genau `gender` und `avatar` lesen (`players/$uid/{gender,avatar}`).
  Ein nur auf dem eigenen Gerät gespeichertes altes Gesicht benötigt für
  bestehende gecachte Browser noch den nächsten `account.js`-Build-Stempel.
- [x] **Einladung wegklicken ohne Löschen:** Das Schließen einer vorhandenen
  Benachrichtigung löscht die Einladung nicht; der gezielte Fix ist in
  [PR #162](https://github.com/0815games/0815games.github.io/pull/162),
  Commit `d44cffa`, dokumentiert und getestet.
- [x] **Mittige Einladungsanzeige mit #289 veröffentlicht:** Partyeinladungen und
  Beitrittsanfragen teilen sich das nichtmodale Anfragezentrum mit den
  Abstimmungen. Die Karte öffnet nur die Übersicht; „Später“ löscht oder
  beantwortet nichts. Freundschaftsanfragen bleiben beim vorhandenen Hinweis
  am Freunde-Menü. Die
  sichtbare Einladung wird beim Ablehnen oder nach einem Beitritt transaktiur die Übersicht; „Später“ löscht oder
  beantwortet nichts. Freundschaftsanfragen bleiben beim vorhandenen Hinweis
  am Freunde-Menü. Die
  sichtbare Einladung wird beim Ablehnen oder nach einem Beitritt transaktional
  mit der noch gespeicherten Fassung verglichen, damit eine zwischenzeitlich
  überschriebene Einladung nicht versehentlich gelöscht wird. Eine identische
  Neufassung ohne eindeutige Servergeneration bleibt eine Grenze; Details in
  [B2](#b2-anfragen-mittig-als-popup).
- [x] **Freundes-/Social-Oberfläche im Browser und am Handy vom Betreiber ohne Beanstandung getestet ([IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers)).**
- [x] **Block-2-Namenssystem & Altbestands-Konfliktauflösung (`20261119-block2`, [IPL-0078](PATCH-LOG.md#ipl-0078--block-2-20261119-block2-strenges-nfc_casefold_v2-stiller-login-backfill-konflikt-dialog--block2-rules-kandidat)):**
  `NFC_CASEFOLD_V2` (`Straße` == `STRASSE` == `STRAẞE`, `ﬁn` == `FIN`, `ΜΑΡΚΟΣ` == `μαρκοσ`, `0` Abweichungen zwischen Client & Python-Audit über 282.230 Unicode-Zeichen), stiller Login-Backfill für freie Namen, blockierender `#nameConflictDialog` nur bei Alt-Duplikaten ohne Fortschritts-/EP-/Ausrüstungsverlust (keine allgemeine Umbenennungs-Schaltfläche), sitzungsübergreifende Freigabe beim Charakterlöschen sowie auf das live laufende `BLOCK9D`-Regelwerk aufgesetztes [`firebase/BLOCK2-RULES-TO-PUBLISH.json`](firebase/BLOCK2-RULES-TO-PUBLISH.json) (inkl. vorgezogenem Block-6-`players/$uid/tutorial`-Schema für eine einzige RTDB-Veröffentlichung).
- [ ] **Offen in Block 2:** Einmalige Veröffentlichung von `IronPath/firebase/BLOCK2-RULES-TO-PUBLISH.json` in der Firebase-RTDB-Konsole zur Aktivierung von `characterNames` + `players/$uid/tutorial`, Screenreader-Prüfung sowie echte Mehrgeräte-Abnahme.

### 3. Kampf- und Party-Oberfläche – Bericht und Rangabzeichen bereits gebaut

- [x] Ein textbasiertes Party-Roster mit Host-, Team- und Bereitschaftsstatus
  sowie der After-Action Report mit bestätigten Belohnungen sind vorhanden
  ([PR #87](https://github.com/0815games/0815games.github.io/pull/87),
  [PR #153](https://github.com/0815games/0815games.github.io/pull/153)).
  XP-Fortschritt erscheint bereits im Menü/Dossier und Report. Der Betreiber
  lobte den Abschlussbericht ausdrücklich; die folgenden zusätzlichen
  Anforderungen bleiben davon getrennt offen ([IPL-0029](PATCH-LOG.md#ipl-0029--nutzerfeedback-und-übersicht-der-patchblöcke)).
- [x] [PR #284](https://github.com/0815games/0815games.github.io/pull/284)
  führte aus dem Level abgeleitete Rangabzeichen und Rangnamen im Menü,
  Soldatendossier und Kampfprofil ein. Dies ist kein eigener Rang im Report.
- [x] **Party-Roster:** Vier kompakte Karten mit Avatar, Name, Rang, Host/Team
  und Bereitschaft; 2×2, wo Platz ist. **Die Karten stehen bereits** – diese
  Zeile war veraltet, sie behauptete weiterhin eine Liste. Nachprüfbar seit
  [PR #307](https://github.com/0815games/0815games.github.io/pull/307)
  ([IPL-0049](PATCH-LOG.md#ipl-0049--bestandsaufnahme-block-3-ist-gebaut-was-fehlt-ist-abnahme)):
  `firebase-four-panel.mjs` baut je Slot eine Karte (Bild, Name,
  Rangabzeichen **und** Rangname, Host-/Team-Marke, Bereitschaft; ein leerer
  Slot bleibt als solcher benannt), `interface-redesign.css` legt das Raster an
  (`auto-fit, minmax(150px,1fr)` – so viele Spalten wie passen, also zwei, wo
  das Feldbrett breit genug ist, eine auf dem schmalen Telefon), und
  `tests/party-roster-layout.test.mjs` prüft genau das. **Kein Mensch hat die
  Karten gesehen.**
- [x] **Endless-Turmschimmer:** Nur freigeschaltete und tatsächlich bezahlbare
  Upgrades markieren; reduzierte Grafik erhält eine ruhige Markierung. Im
  vorhandenen Turmmenü gibt es bereits Preis- und Sperranzeigen, nicht aber
  diesen Schimmer auf dem Spielfeld. Gebaut mit
  [PR #301](https://github.com/0815games/0815games.github.io/pull/301)
  ([IPL-0041](PATCH-LOG.md#ipl-0041--block-3--c-endless-turmschimmer)): ein
  goldener Ring um jeden Turm, dessen nächster Schritt offen **und** bezahlt
  ist. Die einzige Sperre im Spiel ist die Spezialisierung (Veteran ab Stufe 5,
  Bossjäger ab 10) – die Frage stellt der Schimmer über dieselbe Regel, die das
  Protokoll durchsetzt. Bei reduzierter Grafik steht der Ring still.
- [x] **XP im Kampf-HUD:** Bestätigtes Level, aktuellen/benötigten XP-Wert,
  Balken und Restmenge während des Einsatzes zeigen. Vorhandene Menü-/Report-
  Balken erfüllen dies nicht; unbestätigte Saves dürfen keinen Levelaufstieg
  vortäuschen. Gebaut mit [PR #300](https://github.com/0815games/0815games.github.io/pull/300)
  ([IPL-0040](PATCH-LOG.md#ipl-0040--block-3--b-xp-im-kampf-hud)): die Kachel
  SOLDIER trägt Stufe, `aktuell / benötigt EP`, Balken und Restmenge; Quelle ist
  ausschließlich das bestätigte Profil, es gibt keinen Weg, ihr eine Welle
  zuzuflüstern.
- [x] **After-Action Report:** Rangname und Abzeichen neben dem Level, bei
  Beförderung den neuen Rang zeigen. „What’s Next“ in den aufklappbaren
  Reportbereich verschieben, wichtige Ergebnisse oben lassen. Gebaut mit
  [PR #302](https://github.com/0815games/0815games.github.io/pull/302)
  ([IPL-0042](PATCH-LOG.md#ipl-0042--block-3--d-after-action-report)): neben
  `LEVEL 6` steht eine Plakette mit Abzeichen und Rangname; bei einer echten
  Beförderung kommt ein Banner mit dem **neuen** Rang darüber. Eine Stufe ist
  noch keine Beförderung – erst eine überschrittene Schwelle
  (Rekrut 1, Gefreiter 3, Feldwebel 6, Leutnant 10, Hauptmann 15) zählt.
  „What’s Next“ liegt jetzt im aufklappbaren Bereich; die Ergebnisse, die dort
  standen (gewonnene Stufen, neue Freischaltungen), blieben oben bei den
  bestätigten Belohnungen.
- [x] **Zusatzwünsche:** Schussdarstellung und Fähigkeits-HUD weiter verbessern
  sowie Multiplayer-Anfragen mittig anzeigen (Details B2 und D). Vorhandene
  Schuss- und Fähigkeitsanzeigen sind dort gesondert aufgeführt. **Alle drei
  Unterpunkte sind gebaut** (mit
  [#303](https://github.com/0815games/0815games.github.io/pull/303),
  [#304](https://github.com/0815games/0815games.github.io/pull/304),
  [#305](https://github.com/0815games/0815games.github.io/pull/305)); was
  fehlt, ist ausschließlich die menschliche Abnahme.
  - [x] **Alle Popups mittig** – nicht nur die Mehrspieler-Anfragen, auf
    Betreiberwunsch ausdrücklich alle. Gebaut mit
    [PR #303](https://github.com/0815games/0815games.github.io/pull/303)
    ([IPL-0043](PATCH-LOG.md#ipl-0043--block-3--zusatzwünsche-teil-1-ein-ort-für-alle-popups)):
    eine einzige Datei (`popup-center.css`) legt fest, wo ein Popup erscheint.
    Umgezogen sind Partyeinladungen samt Beitritts- und Freundschaftsanfragen
    (vorher oben rechts), die Wellen- und 2×-Abstimmungen im Feld (vorher eine
    Leiste am unteren Rand) und die Feldentscheidung (vorher links unten).
    **Nicht** verschoben wurden Hinweisbänder (Versionsmeldung, Sandkasten),
    Bottom-Sheets (Turmblatt) und der Bauring: sie melden einen Zustand oder
    gehören zu dem Ding, an dem sie geöffnet wurden.
  - [x] **Fähigkeits-HUD (D2):** gebaut mit
    [PR #304](https://github.com/0815games/0815games.github.io/pull/304)
    ([IPL-0044](PATCH-LOG.md#ipl-0044--block-3--zusatzwünsche-teil-2-fähigkeits-hud)).
  - [x] **Schussdarstellung (D1):** gebaut mit
    [PR #305](https://github.com/0815games/0815games.github.io/pull/305)
    ([IPL-0045](PATCH-LOG.md#ipl-0045--block-3--d1-schüsse-als-spur-statt-als-linie)):
    statt der ganzen Linie eine kurze Spur, die läuft; jede Waffe mit eigener
    Handschrift; höchstens 24 Spuren gleichzeitig. Die **Datenmenge** der
    Schüsse blieb unangetastet – sie ist Sache der Simulation, nicht des Malers.

### 4. Charaktererstellung und Avatare – genehmigte Überarbeitung bereits live

- [x] **Avatarumbau genehmigt und eingeführt:**
  [PR #275](https://github.com/0815games/0815games.github.io/pull/275) und
  [#276](https://github.com/0815games/0815games.github.io/pull/276) bauten
  Layer-Vorschau und Auswahlparität. In
  [PR #277](https://github.com/0815games/0815games.github.io/pull/277) steht
  die ausdrückliche Freigabe **„Passt. bau es ein und lösche die preview seiten“**.
  Daraufhin wurden Gesicht, Haare und Bart in die echte Charaktererstellung
  integriert und die Vorschauseite entfernt. Das komponierte Porträt erscheint
  bereits im Hauptmenü und Soldatendossier; alte Einzel-Looks werden beim
  Lesen auf Kombinationen abgebildet. Die damalige Vorschau und Einführung sind
  also erledigt, nicht nur eine ungenutzte Grundlage.
- [x] **Schritt 1 – alle gemalten Gesichter wählbar, das Gesicht reist mit**
  ([IPL-0054](PATCH-LOG.md#ipl-0054--block-4-das-gesicht-reist-mit-13-porträts-wählbar-übergabe-an-den-server)):
  auf Wunsch des Betreibers („Vorhandene 13 Porträts freischalten“, „Alle
  Kombinationen erlauben“) sind statt fünf nun **alle 13** gemalten Porträts
  Gesichter – ohne neues Bildmaterial, mit gemessenen Gesichtsfeldern, weiter
  ausgeglichen (14 Kacheln je Geschlecht). Das Gesicht wird beim Laden des
  Profils **einmal je Sitzung** an den Server übergeben, wenn dort noch keins
  liegt; ein Wert auf dem Server gewinnt, eine abgelehnte Übergabe ist kein
  Fehler, und das Dossier zieht mit, wenn ein Gesicht während der Sitzung
  ankommt. Der Rules-Kandidat (`friend-portrait-candidate.mjs`) legt das Feld
  `players/$uid/avatar` jetzt auch dort an, wo die Regel es nie kannte –
  genau das ist der veröffentlichte Stand, der jeden Schreibversuch frisst.
  Prüfungen: 1130/0 lokal (1 absichtlich übersprungen), neuer Emulator-Fall „Regel ohne Gesicht“, neues
  Chromium-Gerätetest für die Übergabe. **Nicht veröffentlicht:** die Regeln;
  und `account.js` hängt am Stempel `20261031-patch4`, das Gesicht kommt also
  mit dem nächsten Stand in die Browser.
- [x] **Geisterbild-Fix & sauberer Neuaufbau des Avatar-Baukastens ([IPL-0057](PATCH-LOG.md#ipl-0057--block-4-avatar-neubau-idee-1-umsetzungsidee-a-lokal-umgesetzt-und-geprüft)):**
  Gemäß freigegebener **`Idee 1` + `Umsetzungsidee A`** lokal umgesetzt und
  getestet: 12 streng frontale, kahle/glattrasierte Basisköpfe (`f1..f6`,
  `m1..m6`), 9 Damen- und 8 Herrenfrisuren sowie 6 Herrenbärte als rein
  graustufig+alpha freigestellte Layer ohne Haut-/Augen-/Kragenreste,
  Laufzeit-LUT-Einfärbung in 5 gemeinsamen Haar-/Bartfarben, asynchroner
  Canvas-Race-Schutz in `composePortrait()`/`recruit-screen.mjs`, Migration
  sämtlicher `look:*`- und #313-`face:*`-Altsaves sowie kompakte
  On-Portrait-`◀ / ▶`-Stepper mit Farbpunktleiste ohne Kachelzeilen.
  *(Geräte-/Browser-Abnahme und anschließender Build-Stempel stehen noch aus.)*
- [ ] **Build-Stempel für geräteübergreifendes Teilen, `#versionNotice`-Layoutfix & Geräteabnahme:**
  Die Firebase-Rules (`gender.read` + `avatar.read` + `avatar['.validate']`)
  sind live veröffentlicht (`IPL-0056`), und [PR #314](https://github.com/0815games/0815games.github.io/pull/314)
  (`533d1dbf`, `20261031-patch5`) sowie [PR #315](https://github.com/0815games/0815games.github.io/pull/315)
  (`c5607827`, `20261031-patch6`, `#versionNotice`-Layoutfix + `assets/version-dispatch.jpg`)
  sind auf `main`/Pages live (`IPL-0062`). Das neue Versions-Popup wurde vom
  Betreiber bestätigt; die echte Geräteabnahme der neuen Avatare steht noch aus.
- [x] **Alte Auswahl erhalten, Fortschritt/XP/Ausrüstung unangetastet:**
  alte Einzel-Looks (`look:bob`, `g:m|look:beard`) und #313-`face:*`-Werte
  werden auf die neuen frontalen Basisköpfe abgebildet; Emulator-, Chromium-
  und Einheitentests wurden für den Block-4-Neubau aktualisiert und bestanden.
  *(Live-Abnahme des Umbaus unter `20261031-patch5` auf echten Geräten offen.)*

### 5. Skills neu strukturieren – bestehende Turm-Spezialisierungen bereits implementiert

- [x] Fünf bestehende Klassen und ihre Fähigkeiten sind vorhanden; sie sind
  nicht das gewünschte neue exklusive Klassensystem.
- [x] **Zehn Turm-Kits mit Rängen I–III sind im Spielcode eingebaut.**
  [PR #265](https://github.com/0815games/0815games.github.io/pull/265)
  heißt zwar „Konzept-Plan“, enthält aber auch den späteren
  [Implementierungscommit `624f643`](https://github.com/0815games/0815games.github.io/commit/624f6436c188d8b3b65b68de8d99d496169e0838).
  Dieser dokumentiert die Nutzerentscheidung, Stufen A+B zusammen zu bauen,
  einschließlich starker und universeller Kits. Der Zweig wird beim Upgrade
  auf Turmstufe 3 gewählt; zusätzliche Rank-II-/III-Mechaniken sind mit Stufe
  4/5 verknüpft und Rang III bleibt bei Prestige erhalten. Implementiert sind
  u. a. Unterdrückung, Flak-Kettenschaden und Veteranen-Rabatt samt Rank-UI.
  **Der PR-Titel allein und die Konzeptdatei geben den endgültigen Inhalt nicht
  vollständig wieder.** Drei konkret gefundene Ausnahmen stehen direkt unten.
- [x] **Entscheidung:** Luftabwehr als sechste Klasse mit eigener, auch
  außerhalb reiner Flugzeugwellen nützlicher Rolle. Mit dem ersten Punkt auf
  Spielerlevel 2 eine Klasse samt Hauptfähigkeit wählen; danach nur den eigenen
  übersichtlichen Spezialisierungsbaum anbieten. *(Spielcode & UI via PR #318 /
  `20261118-block5` auf `main` live; Block-5-RTDB-Rules gemäß
  Betreiberbestätigung in der Firebase Console veröffentlicht — `IPL-0068`;
  echte Geräteabnahme weiter offen.)*
- [x] Alle Grundtürme bleiben für alle baubar. **Zusätzliche durch den eigenen
  Skillbaum freigeschaltete** Ausbauwege, sechs Klassenbilder, klare Touchflächen
  und Kosten-/Wirkungsvorschauen sind von den bestehenden Turm-Kits zu trennen.
  *(Mit PR #318 über `tower-class-paths.mjs` & `assets/class-*.jpg` live;
  Geräteabnahme offen.)*
- [x] **Entscheidung:** Alte Skill-Builds einmalig vollständig zurücksetzen und
  bereits erhaltene Punkte – ausgegebene und noch freie – zur Neuwahl
  zurückgeben; Level, XP und Ausrüstung bleiben erhalten. Migration, Backup,
  Rules, doppelte Ausführung, alte/parallele Clients und Rollback prüfen.
  *(Client-Migration via PR #318 live; vollständige kopierfertige Rules in
  [`firebase/BLOCK5-RULES-TO-PUBLISH.json`](firebase/BLOCK5-RULES-TO-PUBLISH.json)
  erstellt, geprüft via PR #319 und vom Betreiber live veröffentlicht —
  `IPL-0068`.)*
- [ ] Solo-/Mehrspieler-Balance getrennt planen und testen; neue Skilldaten oder
  Rules nicht ohne frischen Abgleich und separate Freigabe einführen.
  *(Balance-/Stress-Suiten in PR #318 angepasst & Rules veröffentlicht; finale
  Live-Mehrgeräte-Abnahme auf `20261118-block5` offen.)*

#### Konkrete Befunde zur bestehenden Turm-Spezialisierung

Diese Befunde stammen aus der Code- und Simulationsprüfung. Die ersten beiden
sind für `20261031-patch8` ([IPL-0065](PATCH-LOG.md#ipl-0065--pr-316-live-kit-fixes-bossj%C3%A4ger-iii--doppel-mg-iii-ci-retry--cache-welle-20261031-patch8))
behoben; der dritte ist seit #289 veröffentlicht.
Sie machen das eingebaute System nicht zu einem bloßen Konzept, und die frühere
grüne Testsuite belegte nicht jede versprochene Wirkung.

1. [x] **Bossjäger III (`20261031-patch8`):** Der versprochene Bonus von 25 Vorräten
   für einen vom Turm erledigten Boss wird nun vor der `hp <= 0`-Rückkehr in
   `applyHitEffects` ([Code](tower-specialization.mjs)) mit `rewardTeam?.(state, 25, false)`
   ausgezahlt, sodass weder normale Wellen-/Plünderboni doppelt gezählt noch
   das `{type:'bounty'}`-Ereignis verschluckt werden. Der [Test](tests/tower-specialization.test.mjs)
   vergleicht jetzt Rang II (Stufe 4: +70, kein `bounty`-Event) strikt gegen
   Rang III (Stufe 5 mit `logistics: 3`: +98 inklusive exakt einem `bounty`-Event
   und `bountyPaid === true`).
2. [x] **Doppel-MG III (`20261031-patch8`):** `towerDamage` in [`combat.mjs`](combat.mjs)
   setzt für `type === 0 && branch === 0 && level >= 5 && baseKind === 'plane'`
   den Flugzeug-Faktor auf `1`, sodass Doppel-MG III gegen Flugzeuge und Luft-Bosse
   volle **22** (Stufe 6 Prestige **25**) Grundschaden statt 13,2 erzielt, während
   Schweres MG (`branch === 1`) bei 0,6 bleibt. Geprüft in
   [Tests](tests/tower-specialization.test.mjs) und der Endloskurve in
   [`balance-suite.test.mjs`](tests/balance-suite.test.mjs).
3. [x] **Veteranen-Rabatt in der UI – mit #289 korrigiert:** Bei einem Veteranenturm
   auf Stufe 5 verlangt die Simulation **306** statt 360 Vorräte. Vor dem Fix
   zeigte der UI-Test Preis 360 und blockierte den Kauf; danach sind Anzeige,
   Zahlung und Prestige-Rundung für eigene und fremde Türme mit Doubles geprüft.
   Das ist kein Beweis für die Ursache des gemeldeten Dreier-Turmmenüfehlers.

### 9. Einheitliches Menü-Layout & Kommandotafeln (Desktop & App-Shell Mobile)

**Eingeschoben vor Block 6** (Betreiberwunsch, [IPL-0068](PATCH-LOG.md#ipl-0068--block-5-rtdb-rules-live-best%C3%A4tigt-und-block-9-vor-block-6-eingeplant)),
für `20261119-block9` in [PR #320](https://github.com/0815games/0815games.github.io/pull/320)
umgesetzt, mit `20261119-block9b` in [PR #321](https://github.com/0815games/0815games.github.io/pull/321),
`20261119-block9c` in [PR #322](https://github.com/0815games/0815games.github.io/pull/322)
und `20261119-block9d` in [PR #323](https://github.com/0815games/0815games.github.io/pull/323)
feingeschliffen:
Die spätere Tutorial-Menüführung (Block 6) soll direkt über dem konsolidierten
Hauptmenü und den einheitlichen Dialogen aufbauen.

- [x] **Einheitliches Kommandozentralen-Layout (Desktop & Mobile App-Shell):**
  Desktop (`>= 860px`) mit festem 2-Spalten-HQ (Soldatenkarte + 4 Schnellzugriffe
  + Utilities links; große Einsatz-Karten rechts). Mobile (`< 860px`) als
  App-Shell mit kompakter Soldatenzeile oben, fokussierten Spielmodi in der
  Mitte und fester 4-Knopf-Daumenleiste (`Waffenkammer`, `Skills`, `Freunde`,
  `Bestenliste`) ganz unten. *(Echte Geräteabnahme offen.)*
- [x] **Durchgängige Designsprache & 3-Zonen-Kartenbanner über alle Dialoge:**
  Dunkles Tannengrün `#101b16` / `#182921`, ein warmer Goldakzent `#e4ca89`,
  einheitliche Radien (`6px`), klare Close-Buttons (`44×44px`), harmonisierte
  Feldschule-Karten, Musterungs-Header (`assets/field-recruiting.jpg`),
  Gefechts-Dialoge sowie Landschafts-Artworks (`assets/command-horizon.jpg`,
  `arsenal-workbench.jpg`, `skills-banner.jpg`, `endless-frontline.jpg`,
  `story-forest-convoy.jpg`, `story-act1-dawn.jpg`, `version-dispatch.jpg`,
  `story-voss.jpg`). *(Echte Geräteabnahme offen.)*
- [x] **Endlos-Schnellstart, Geländewahl & Kampagnen-Akte:**
  `#endlessLaunch` mit Schnellstart-Leiste oben, Panorama-Gemälden für alle
  sechs Gefechtsfelder (`endless-frontline.jpg`, `story-outpost.jpg`,
  `story-pinewood.jpg`, `story-city.jpg`, `story-ice.jpg`, `story-marsh.jpg`)
  und Endlos-Bilanz darunter; einheitliche Kommandotafeln für `#fourPartyPanel`
  und `#campaignPanel` (parallele „Bisherige Geschichte“ & illustrierte
  Akt-Relikte `story-act1..5-relic.jpg`, Akt-Banner `story-act1..5-title.jpg`).
  *(Echte Geräteabnahme offen.)*
- [x] **Einstellungen → Allgemein, Audio/FX & In-Game-Parität:**
  Gemeinsamer Einstellungs-Dialog (`settings.mjs`, `assets/settings-command.jpg`)
  mit einheitlichem Schalter für Soundeffekte, Master-Lautstärke,
  Missions-Sprachausgabe (`voiceOver`), Grafikvoreinstellung (`full`/`reduced`),
  Kamerawackeln (`screenShake`), Wetter-/Atmosphäreneffekten (`weatherEffects`),
  Kampfleuchtspuren (`combatTracers`), Fokus-Autopause (`autoPause`),
  Standard-Kartenansicht (`fit`/`large`), Vollbild-Umschalter und bestätigtem
  Zurücksetzen. Der doppelte `#soundToggle` im Feldmenü entfällt vollständig.
  *(Unit- & Logik-Tests grün; Browser-/Geräteabnahme offen.)*
- [x] **Einstellungen → Konto (Passwortänderung & geschützte Entlassung):**
  Angemeldete E-Mail-Adresse, In-App-Passwortänderung über `password-change.mjs`
  (`reauthenticateWithCredential` / `updatePassword` + Passwort-Reset-Fallback)
  sowie Gefahrenzone mit `#menuDeleteCharacter` (umgezogen aus der alten
  Utility-Zeile, Party-Sperre direkt im Konto-Abschnitt sichtbar, sicheres
  Schließen offener Dialoge beim Entlassen/Abmelden). *(Unit-, Browser-Smoke- & Emulator-Tests in PR #320 bestanden; echte Geräteabnahme offen.)*
- [x] **AFK-Schutzszene, Kopie-Korrekturen & visuelle Dialog-Harmonisierung:**
  `#afkRestDialog` nutzt die neue handgemalte Bunker-Szene (`assets/afk-rest.jpg`)
  statt der prozeduralen Leinwand (Canvas-Fallback im Code erhalten); alle
  verbleibenden Modale (`#languageGate`, `#tutorialDialog`, `#storyCinematic`,
  `#skillDialog`, `#runResults`, `#patchNotes`, `#socialPopup`, `#multiplayerPrompt`,
  `#versionNotice`) wurden auf gemeinsame `--hq-*`-Tokens, einheitliche
  `✕`-Schließen-Symbole und `<860px`-Vollbild-Sheets ohne `#versionNotice`-Kollisionen
  angeglichen. Fakten-/Textbereinigung (`18` → `50` Missionen, `three` → `five`
  Akte, Entfall redundanter Endlos-Abzweige `#endlessArmory`/`#endlessSkills`,
  lokalisierter Fallback-Hinweis). *(Unit- & Logik-Tests grün; Browser-/Geräteabnahme offen.)*
- [x] **Einzelsitzungs-Schutz (`20261119-block9d`), randfreie Artworks & Sprach-/Layout-Feinschliff:**
  Einzelner aktiver Login pro Account (`active-session.mjs`, `activeSessions/$uid`
  mit 15-s-Heartbeat, 45-s-TTL, `onDisconnect`-Freigabe, Login-Konfliktprüfung,
  optionaler Übernahme-Checkbox `#sessionTakeoverCheck` und sofortiger Abmeldung
  der Alt-Session bei Übernahme) samt Firebase-RTDB-Regelkandidat
  [`firebase/BLOCK9D-RULES-TO-PUBLISH.json`](firebase/BLOCK9D-RULES-TO-PUBLISH.json)
  und Rollout-Leitfaden [`firebase/BLOCK9D-SESSION-ROLLOUT.md`](firebase/BLOCK9D-SESSION-ROLLOUT.md).
  Zusätzlich weiße Ränder/Rahmen aus sieben Gemälden entfernt (`story-tower.jpg`,
  `story-marsh.jpg`, `story-rook.jpg`, `story-sera.jpg`, `endless-frontline.jpg`,
  `class-medic.jpg`, `armory-kit.jpg`), `#menuResults` unter `.mode-grid` gesetzt,
  `#settingsDialog #languageSelect` sichtbar geschaltet, `.session-takeover-field`-Layout
  und `<380px`-Mobilregeln korrigiert sowie fehlende DE-Texte/Fehlertexte
  vervollständigt (`endless-launcher.mjs`, `recruit-screen.mjs`, `localization-*-de.mjs`).
  *(Live-Veröffentlichung von `BLOCK9D-RULES-TO-PUBLISH.json` laut Betreiber in der Firebase Console bestätigt — `IPL-0074`; echte Geräteabnahme offen.)*
- [x] **Block 9e Feinschliff (`20261119-block9e`, [PR #324](https://github.com/0815games/0815games.github.io/pull/324)):**
  Mehrfenster-Sitzungssperre ohne Auth-Verlust zwischen Tabs desselben Browsers
  (`createWindowSessionId` + `createSameBrowserSessionMonitor`, `pagehide`-Freigabe,
  10-s-Heartbeat), rotierende Login-Banner (`login-scene.mjs`, `login-*.jpg`),
  einheitlicher Flaggen-/Sprachschalter (`#authLanguageToggle` & `#languageToggle`),
  einheitliche HQ-Zurück-Navigation (`← COMMAND CENTER` / `← KOMMANDOZENTRALE`
  bzw. `✕` im Gefecht), eigene `1376×768`-Modus-Artworks (`mode-*.jpg`) sowie
  schlankes Endlos-Einzelbild-Karussell (`endless-random.jpg`, `DEPLOY` oben,
  `CANCEL` direkt darunter). *(Gemergt mit `57ebfaf4e79ff67db09c06ec780344158a7e133f`; Geräteabnahme auf `20261119-block9e` ergab Nachbesserungen in Block 9f.)*
- [ ] **Block 9f Layout-, Hero- & Breitenabgleich (`20261119-block9f`, PR #325):**
  Einspaltiges Login-Dossier (`#authView`) mit vollbreiter oberer Key-Art-Bühne,
  unbeschnittenem Header-Logo und vier neuen zu `command-horizon.jpg` passenden
  `16:9`-Login-Gemälden (`login-*.jpg` + `LOGIN_SCENE_VERSION`), ausgerichtetes
  Command-Center-Grid (inkl. XP-Anzeige innerhalb `#menuSoldier`, `#guideRecall`
  getrennt von `.command-utilities`, bündiges `#backToCommand`), einheitliche
  Links-oben-Verankerung aller HQ-Zurück-Buttons, feste `256px`/`176px`
  Endlos-Karussellkarte mit eigenen SVG-Pfeilen sowie einheitliche
  `--hq-op-width`-Breite (`min(880px, calc(100vw - 48px))`) für Kampagne,
  Endlos und Mehrspieler. *(Lokale 259-Dateien-/1.163-Tests, Stress-Suite &
  561-Dateien-Syntaxprüfung grün; PR-CI-Browser-Check & Geräteabnahme offen.)*

### 6. Tutorial als großer zusammenhängender Einsatz – bisheriges Tutorial gebaut und Teilfix bestätigt

- [x] Die bisherige Einführung und eine echte, verkürzte **Fünf-Wellen-Mission**
  mit nichtmodalem Feld-Coach sind vorhanden
  ([PR #160](https://github.com/0815games/0815games.github.io/pull/160),
  [PR #162](https://github.com/0815games/0815games.github.io/pull/162)).
  Vorräte für den ersten Turm samt Upgrade und die Sicherung gegen einen zweiten
  Turm vor dem ersten Upgrade folgten in
  [#173](https://github.com/0815games/0815games.github.io/pull/173) und
  [#182](https://github.com/0815games/0815games.github.io/pull/182).
  Die Wiederholung dieser alten Übung ohne erneute Tutorialbelohnung ist getestet.
- [x] Die in Block 1 beschriebenen Abbruch-/Menü-Fixes #196 und #278–#279
  wurden gebaut; #280 hält die damalige Nutzerbestätigung „Tutorial hört sauber
  auf“ fest. Parken und vollständiges Zustandsende sind nicht dasselbe.
- [x] **Vorgezogene RTDB-Regel für charakterbezogenen Tutorialstatus (`players/$uid/tutorial`):**
  Bereits in [`firebase/BLOCK2-RULES-TO-PUBLISH.json`](firebase/BLOCK2-RULES-TO-PUBLISH.json)
  via [`firebase/block6-tutorial-candidate.mjs`](firebase/block6-tutorial-candidate.mjs)
  enthalten (`edition` `1..100` monoton, `status` `'offered'|'accepted'|'declined'|'completed'`,
  `rewarded` & `missionCompleted` monoton `true`, optionale `phase`/`step` zur
  Wiederaufnahme, atomare Löschung bei Charakterentlassung), damit vor dem
  eigentlichen Block-6-Clientbau kein zweiter Firebase-Rules-Deploy nötig wird.
- [ ] Nach jeder neuen Charaktererstellung zuerst Hauptmenü und eine Akte mit
  „Auftrag annehmen/ablehnen“ zeigen. Ablehnung dauerhaft respektieren und
  späteren Neustart in den Einstellungen ermöglichen. Der Status muss zum
  **Charakter**, nicht nur zum Konto oder Gerät gehören; bestehende lokale
  Marker sind an die Konto-ID gebunden.
- [ ] Eine große zusammenhängende Mission für Bewegung, Bauen, Upgrades, Wellen,
  Gegner und Fähigkeit samt Abschlussbericht. Danach Soldat/Dossier, Rang,
  Ausrüstung/Armory/Workshop, Skills, Kampagne, Endless, Party, Freunde,
  High Scores, Einstellungen und Hilfe erklären; Löschen/Abmelden nie auslösen.
- [ ] **Entscheidung:** Eine feste Funkstimme eines älteren Generals.
  **Vorschlag:** Deutsch und Englisch mit Untertiteln; dazu lesbare Alternative,
  Lautstärke und Stummschaltung. Die bestehenden Kampagnen-Sprachdateien sind
  nicht diese Tutorialvertonung.
- [ ] Auch für die neue Mission Abbruch, Wiederaufnahme, Wiederholung und
  einmalige Belohnungen sicher behandeln. Konzept kann parallel entstehen,
  Fertigstellung folgt nach Block 5.

### 7. Zusätzlich vorgeschlagen: Leben und Gegenangriffe – offen

**Eingeordnet als künftiger Patch Nr. 7 nach Block 6** (Wunsch des Betreibers,
[IPL-0030](PATCH-LOG.md#ipl-0030--feldnotizen-im-spiel-und-block-7-als-künftiger-patch));
in der [Reihenfolge](#kommende-patches--reihenfolge) und im Spiel unter
**FELDNOTIZEN** geführt. Es ist kein Originalblock und ändert alle Modi, deshalb
kommt es zuletzt.

- [x] Der Bunker besitzt bereits Lebenspunkte und bestehende Reparatureffekte.
- [ ] Das neue Lebens-, Angriffsschutz- und Reparatursystem für Soldaten,
  Türme und Bunker **in allen Spielmodi** entwickeln und balancieren; die
  Werte in Detail E sind ungetestete Startvorschläge. Kein dauerhafter Verlust
  von Charakterfortschritt oder Ausrüstung.
- [ ] Gemeinsame Simulation, Multiplayer-Synchronisierung, Tutorial, Solo,
  Kampagne, 2–4-Koop, 1v1 und 2v2 testen; danach Einsteigerbalance erneut prüfen.

**Aktuelle lokale Nachprüfungen:** Der vollständige serielle Node-Lauf nach
Porträt-, Namens-Audit- und Freundesanfrageänderungen bestand mit **994/994**,
ohne Überspringungen; Server **13/13**, Release-Service-Konfiguration **5/5**.
Er enthält auch das Staging des aktuellen Runtimes einschließlich der neuen
Module und Bilddatei. Der deterministische Stresstest bestand nach Korrektur
seiner Duell-Zählererwartung. 22 Rules-CI-Skripte liefen zuvor seriell im
Emulator erfolgreich, mit **320 bestandenen und 9 absichtlich übersprungenen**
wiederholten TAP-Fällen von 329; nach den späteren Social-Änderungen wurden die
betroffenen Rules und SDK-Browserfälle zusätzlich separat geprüft
([IPL-0020](PATCH-LOG.md#ipl-0020--block-1-abschlussregression-und-aktualisierte-sicherheitsverträge),
[IPL-0021](PATCH-LOG.md#ipl-0021--block-2-freundschaftsabläufe-und-lokale-freundesporträts),
[IPL-0025](PATCH-LOG.md#ipl-0025--block-2-kein-scheinerfolg-bei-konkurrierenden-freundesanfragen)).
Alle sieben Abschluss-Browserfälle bestanden lokal nach den ursprünglichen
Porträtänderungen, aber vor der späteren Social-Härtung; die Fälle mit Rules-
Ablehnung/Retry und Host-Recovery bestanden auf dem letzten Stand erneut
([IPL-0026](PATCH-LOG.md#ipl-0026--abschließende-lokale-regression-und-releaseprüfung)).
Einige TAP-Zähler fassen ganze Testdateien zusammen. Der Bossjäger-Test ist wie
oben beschrieben zu schwach; grün heißt nicht, dass sein 25-Vorräte-Bonus
funktioniert. Die geänderte CI bestand für
[PR #289](https://github.com/0815games/0815games.github.io/actions/runs/43830084162)
und auf [main](https://github.com/0815games/0815games.github.io/actions/runs/43831291548).
Diese Nachweise ersetzen keine Live-Mehrgerätepartie.

## Zusätzliche Wünsche – Zuordnung und Details

| Detail | Inhalt | Zugeordneter Block |
| --- | --- | --- |
| **A – Charakter & Freunde** | Eindeutige Charakternamen; Freundesliste und Einladungen untersuchen und reparieren. | Block 2; Daten- und Rules-Sicherheit zuerst klären. |
| **B – Multiplayer-Anfragen** | Jeder darf eine Welle anfragen; handlungsbedürftige Anfragen mittig anzeigen. | Zustandslogik in Block 1, Darstellung in Block 3. |
| **C – Einsteigerbalance** | Multiplayer mit neuen Charakteren fairer und verständlicher machen. | Block 1; bei Umsetzung von Block 7 erneut balancieren. |
| **D – Kampfgefühl & Fähigkeit** | Schüsse schöner und unterscheidbar; Soldatenfähigkeit sichtbar integrieren. | Darstellung in Block 3; Fähigkeiten und Klassenlogik in Block 5. |
| **E – Neu: Leben & Gegenangriffe** | Einheitliches Lebens-, Angriffs- und Reparatursystem für Soldaten, Türme und Bunker in allen Modi. | Zusätzlich vorgeschlagener Block 7; eigener Prototyp und gesonderter Rollout. |

## Bisheriger Stand – weitere überprüfbare Themen

Die folgende zusätzliche Bestandsaufnahme ergänzt die einzelnen Blöcke und
bewertet ihre unabhängig überprüfbaren Grundlagen.

- [x] **Multiplayer-Spielfeld:** Größere Zweier-Koop-/1v1-Felder und mobile
  Spielfeldansicht mit Schwenken/Zoom wurden mit PR #286 veröffentlicht.
- [ ] Echte Mehrgeräte-Partien mit Wellen, Reconnect und Belohnungen sind
  weiterhin nicht als bestanden dokumentiert.
- [x] **Mehrspieler:** Der Code für Partys mit zwei bis vier Spielern und die
  verschiedenen Koop-/Wettkampfvarianten ist veröffentlicht und mit Emulatoren
  und Browsern getestet.
- [ ] **Restpunkte Multiplayer:** Einsteigerbalance ([C](#c--multiplayer-mit-anfangscharakteren)) und gleichzeitige 2–4-Geräte-Netzwechsel unter Last stehen noch aus; Wellenanfragen durch jeden Spieler (`B1`) und das mittige Anfragezentrum (`B2`) wurden mit #289 veröffentlicht und vom Betreiber im Browser und am Handy getestet ([IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers)).
- [x] **Charakter und Social:** Serverseitig bestätigtes Löschen und Bereinigung
  bekannter Freundschafts-/Einladungsdaten wurden mit PR #287 veröffentlicht.
- [x] Abmeldung und Login-Meldung nach der Entlassung sind umgesetzt und
  mit zwei Chromium-Kontexten sowie Auth-/RTDB-Emulator geprüft; sie wurden
  mit #289 veröffentlicht.
- [ ] Kontoübergreifend eindeutige Namen (`A1`) und etwaige historische Altbestände
  bleiben zu prüfen; der konkrete Neunamenfall und die Browser-/Handy-Tests des
  Betreibers sind abgeschlossen, parallele Altdaten sind nicht vollständig abgedeckt.
- [x] **Wartung und Admin:** Wartungsanzeige und separater Admin-Bereich sind
  veröffentlicht; der Betreiber bestätigte Darstellung, Admin-Login und
  Wartungsstatus auf dem iPhone. Nach #289 wurde die Wartung beendet und der
  öffentliche Status `open` geprüft. Ein zuvor beobachteter Admin-Timeout im
  ersten Netz ist nicht abschließend erklärt.
- [x] **Live-Rules-Abgleich & Block-4-Veröffentlichung:** Der Betreiber legte seinen Live-Export vor (`WORKSHOP-RULES-TO-PUBLISH.json` + `social-cleanup` + `maintenance-rules.mjs`) und bestätigte in [IPL-0056](PATCH-LOG.md#ipl-0056--block-4-rules-veröffentlicht-layer-geisterbild-im-avatar-baukasten-belegt), dass `IronPath/browser-artifacts/firebase-rtdb-rules-ready.json` (`gender.read` + `avatar.read`) live veröffentlicht wurde *(kein unabhängiger Serverabruf aus der Arbeitsumgebung)*. Block-2-Namens-Rules bleiben gesondert offen.
- [x] **Version und AFK:** Versionsprüfung und sichere Updatezeitpunkte sowie
  die 30-Minuten-AFK-Abmeldung im sicheren Menü sind veröffentlicht und
  automatisiert getestet. Der Betreiber meldete für `20261031-update3` zwei
  stimmige Diagnosefelder auf dem iPhone.
- [ ] Ein vollständiger echter Mehrgeräte-Test über einen produktiven
  Versionswechsel und die Wiederöffnung steht aus. Die Versionskennung beweist
  keinen tatsächlich ausgeführten Code; alte, manipulierte oder offline
  Clients werden nicht lückenlos kontrolliert. Ohne Web Locks ist die
  automatische AFK-Abmeldung deaktiviert. Eine frühere automatisierte Diagnose
  meldete eine CSS-Abweichung, deren Ursache nicht geklärt ist; auf dem iPhone
  waren beide Felder stimmig und die erwarteten Regeln öffentlich vorhanden.
- [ ] Eine **automatische Versionsprüfung direkt auf dem Wartungsbildschirm**
  ist nicht implementiert. Ob sie dort zusätzlich eingebaut werden soll,
  bleibt abzustimmen.

**Während der Wartung:** Die frisch geöffnete Spielseite wartet zuerst am
Wartungsgate. „Erneut prüfen“ fragt den Wartungsstatus ab, nicht das
Versionsmanifest. Erst wenn der Status offen ist, wird die normale
Versionsprüfung vor der Spielanmeldung gestartet; bei einer Abweichung wird
unter den vorgesehenen Sicherheitsbedingungen neu geladen. Erkennt eine bereits
aktive Sitzung die Wartung, wird auch ihr Versionsmonitor gestoppt; nach der
Freigabe muss die Sitzung neu geladen werden. Die separate
[Versionsdiagnose](version.html) ist während der Wartung direkt erreichbar.

## A – Charakter und Freunde

### A1. Charaktername darf nicht doppelt vergeben werden

**Nutzerentscheidung:** Verschiedene Konten sollen nicht denselben Charakternamen erstellen können. Der bestehende Profil-Transaktionsschutz versucht bereits, ein zweites Profil unter derselben Konto-ID zu verhindern; er macht Namen über Konten hinweg nicht eindeutig. Die aktuelle Freundessuche lässt gleiche Namen ausdrücklich zu (`firebase/AUTOMATIC-FRIEND-SEARCH.md`).

- [x] **Namensregel festgelegt und umgesetzt (Vorschlag wie besprochen):** Anzeige bleibt wie eingegeben, verglichen wird nach Entfernen äußerer ECMAScript-Leerzeichen, Unicode-NFC und Kleinschreibung (`NFC_LOWERCASE_V1`). `Alex` und `alex` sind damit derselbe Name; `Álex` (zusammengesetzt) und `Álex` (vorkomponiert) ebenfalls. Ähnlich aussehende Zeichen aus anderen Schriftsystemen (`Ａ`/`A`) bleiben verschieden – eine strengere Zeichenregel wäre eine separate Entscheidung. Die Regel liegt in genau einem Modul (`character-name.mjs`) und wird von Freundessuche, Reservierung und dem Offline-Audit über gemeinsame Fälle (`firebase/name-policy-fixtures.json`) abgesichert, damit die drei nicht auseinanderlaufen; beide Prüfmaschinen behaupten ihre Seite ([IPL-0034](PATCH-LOG.md#ipl-0034--block-2-eindeutige-soldatennamen-für-neue-charaktere)). **Bekannte, gewollte Abweichung:** Das Audit-Skript vergleicht strenger (Unicode Default Case Folding) und meldet deshalb `Straße`/`STRASSE` als Konflikt, während das Spiel die beiden als verschiedene Namen zulässt. Das ist im Modul, in der Fixture-Datei und in der Audit-Anleitung dokumentiert und durch Tests festgenagelt; vor einer Migration ist es gesondert zu entscheiden.
- [x] **Reservierung gebaut (Durchsetzung erst mit den Rules):** `character-name-claim.mjs` reserviert `characterNames/<Schlüssel>` **vor** dem Profil und gibt den Namen wieder frei, wenn die Charaktererstellung danach scheitert oder der Charakter gelöscht wird. Zwei Konten, die denselben Namen gleichzeitig wählen, erhalten höchstens einen Gewinner; der Verlierer bekommt eine eigene Meldung („Dieser Soldatenname ist bereits vergeben“) statt eines kryptischen Fehlers. Ein eigener Namens-Retry nach verlorener Antwort gilt nicht als Konflikt, und ein Kontowechsel während des Vorgangs wird abgelehnt.
- [~] **Durchsetzung serverseitig: Regeln stehen bereit, Veröffentlichung offen.** Der veröffentlichbare Kandidat `workshop.complete.draft.rules.json` enthält den Index jetzt (streng additiv, Übergabe in [firebase/BLOCK2-RULES-HANDOVER.md](firebase/BLOCK2-RULES-HANDOVER.md), [IPL-0037](PATCH-LOG.md#ipl-0037--block-2-die-nötigen-neuen-regeln-vorbereitet-nicht-veröffentlicht)). **Veröffentlicht ist er nicht**: vorher sind frischer Export, Sicherung, Vergleich und die separate Freigabe nötig. Solange die Rules nicht veröffentlicht sind, kennt der Server den Pfad nicht. Der Client meldet das sauber als „nicht unterstützt“, die Charaktererstellung läuft weiter wie bisher, und als Rückfall wird der öffentliche Freundes-Suchindex gelesen (nur bestmöglich: er sieht nur Konten, die je eine Liste veröffentlicht haben). Erst mit veröffentlichten Rules ist die Eindeutigkeit gegen alte/manipulierte Clients abgesichert; parallele Tabs, Offline-Warteschlangen und Wiederholungen sind damit abgedeckt, Konfliktmigration noch nicht.
- [x] **Kein vollständiges Namensverzeichnis:** Der Index ist bewusst nicht als Ganzes lesbar, sondern nur Schlüssel für Schlüssel. Sonst könnte jedes angemeldete Konto die komplette Namensliste aller Spieler abrufen. Dass ein tieferes Leserecht trotz `false` darüber gilt, ist dieselbe Regel wie beim heutigen `friendNames`; der Emulatorlauf prüft beide Richtungen.
- [~] **Vertrauensgrenze: Kandidat vorbereitet, Veröffentlichung offen.** `firebase/character-name-candidate.mjs` baut aus der gepinnten Referenz einen Rules-Kandidaten: höchstens ein Eintrag pro Schlüssel, nur mit der eigenen UID, Löschen nur durch den Inhaber; gefälschte, zu kurze/lange und anonyme Einträge werden abgelehnt. Der Kandidat ist **nicht** in den veröffentlichbaren Kandidaten eingestellt (Verhaltensregel des Veröffentlichungsschutzes) und wird im Datenbank-Emulator in zwei Läufen geprüft – mit und ohne Index. **Beide Emulatorläufe sind in CI grün** ([PR #293](https://github.com/0815games/0815games.github.io/pull/293)). Drei Fehler am Kandidaten wurden dabei gefunden und behoben: ein Regex, den RE2 nicht kennt (blockierte alles, war aber nur mit einem Positivfall zu sehen), ein fehlendes `$other`, das Zusatzfelder durchließ, und ein `$other`, das mangels benannter `uid`/`name`-Knoten wieder alles blockierte. Der Emulator beantwortet die ersten Anfragen zudem vor dem Wirken der hochgeladenen Regeln; der Test wartet dieses Startfenster ab. Gemerkt: eine `assertFails`-Prüfung allein beweist nichts – sie besteht auch gegen eine Regel, die alles ablehnt. Firebase Rules können eine Unicode-Normalisierung nicht selbst nachbilden: Sie erzwingen den Schlüssel, nicht seine Ableitung. Alte oder manipulierte Clients sind damit erst mit veröffentlichten Rules abgedeckt, und auch dann nicht vollständig. Kein zusätzlicher kostenpflichtiger Dienst oder Abrechnungsplan ohne Freigabe.
- [x] **Offline-Vorprüfung vorbereitet:** Das lokale Skript `scripts/audit-character-names.py` zählt Konflikte aus einem explizit angegebenen Export einschließlich nicht indizierter Profile und gibt ohne optionalen vertraulichen Bericht keine Namen/IDs aus. Der Vergleich nach NFC und Unicode Default Case Folding ist ein nicht freigegebener Vorschlag; nur synthetische Fixtures wurden geprüft ([IPL-0022](PATCH-LOG.md#ipl-0022--block-2-datenschutzschonende-namens-vorprüfung), [Anleitung](firebase/CHARACTER-NAME-AUDIT.md)).
- [ ] **Bestandsdaten vor Änderung sichern und prüfen:** Eine autorisierte Bestandsaufnahme muss auch Konten erfassen, die nie einen Suchindex erstellt haben. Das Offline-Skript beweist nicht, dass ein Export vollständig oder aktuell ist. Mögliche Alt-Duplikate als Konflikte behandeln und den Namen für Neuanmeldungen sperren, bis sie geklärt sind. Keine stillschweigende Löschung, automatische Umbenennung oder Verlust von Fortschritt. Wer einen kollidierenden Namen behalten darf und wie die anderen einen neuen wählen, wird nach der Bestandsaufnahme gesondert abgestimmt. Solange Alt-Duplikate bestehen, ist globale Eindeutigkeit noch nicht erreicht.
- [~] **Lebenszyklus: Löschung und Altbestand geregelt.** Bei bestätigter Charakterlöschung wird eine in dieser Sitzung reservierte Reservierung mit derselben atomaren Schreiboperation freigegeben – bewusst nur dann, damit der Pfad unter den heutigen Rules die Löschung nicht blockiert. Freundes-Suchindex, Anzeigename und Bestenlisten bleiben unverändert.
- [~] **Verwaiste und unbestätigte Reservierungen: behandelt, Wirksamkeit erst mit den Rules.** Ein Eintrag, dessen Inhaber nie einen Charakter bekam (abgebrochene Erstellung) oder dessen Charakter in einer anderen Sitzung gelöscht wurde, würde den Namen sonst dauerhaft blockieren. Solche Einträge können nach einer Schutzfrist übernommen werden, aber **nur unter zwei Bedingungen gleichzeitig**: der Inhaber hat keinen Charakter **und** der Eintrag ist älter als die Schutzfrist. Die Schutzfrist gibt es aus einem einzigen Grund: der Charakter wird *nach* der Reservierung geschrieben, also sieht eine laufende Erstellung für Sekunden genauso aus wie eine abgebrochene. Ohne Frist könnte ein zweites Konto den Namen mitten in der Erstellung wegnehmen – und ihn damit teilen, genau das, was der Index verhindern soll. Beurteilt wird das mit der **Serveruhr** (`now`), nicht mit der des Clients; die Frist steht als eine Konstante in `character-name.mjs` und wird von dort in die Rules eingesetzt. **Vorschlag, nicht freigegeben:** sechs Stunden. Ein Eintrag ohne verwertbaren Zeitstempel bleibt geschützt, weil er nicht von einer laufenden Erstellung zu unterscheiden ist. Der Client kann fremde Profile nicht lesen (`players/<uid>` ist nur für den Inhaber lesbar), also rät er nicht: er versucht das Schreiben und meldet die Ablehnung als „vergeben“ – nicht als „nicht unterstützt“, was den Spieler in ein Duplikat schicken würde. Solange die Rules nicht veröffentlicht sind, bleibt ein verwaister Eintrag stehen: der Name ist blockiert, nicht doppelt vergeben – die sichere Richtung.
- [~] **Umbenennung: Mechanismus gebaut, Entscheidung weiter offen.** `character-rename.mjs` benennt einen Soldaten um und bewegt dabei **alle vier Stellen**, an denen der Name steht: Profil (`players/<uid>/name`), Suchindex (`friendNames/<Schlüssel>/<uid>` plus `friendPrivate/<uid>/searchKey`), Freundescode (`friendCodes/<Code>/name`) und Namensreservierung (`characterNames/<Schlüssel>`). **Warum es eine Folge von Schritten ist und kein einziger Schreibzug:** `root` in einer Regel ist der Stand **vor** dem Schreiben – eine Regel sieht nie, was ein Client im selben Mehrpfad-Zug mitbewegt (derselbe Umstand, auf dem die Charakterlöschung beruht: die Bestenlisten-Regeln brauchen den Spieler noch, während er im selben Zug gelöscht wird). Die Regeln können also **nicht** prüfen, dass die vier Stellen zueinander passen. Was sie prüfen können, ist die eine Bedingung, die keinen Widerspruch zulässt: **Ein Soldat, der im Suchindex steht, kann seinen Namen nicht ändern.** Das Modul nimmt ihn darum erst aus dem Index, benennt um und veröffentlicht ihn danach neu – jeder Schritt einzeln geprüft, jeder Zwischenzustand einer, den das Spiel kennt und beim nächsten Laden von selbst heilt (`friends.mjs`). Die Reihenfolge ist die Sicherheit: der neue Name wird **zuerst** reserviert (und das ist der Schritt, den die Regeln verweigern, wenn ein anderes Konto ihn hält), der alte Name wird **zuletzt** freigegeben – dazwischen könnte ihn sonst ein anderes Konto nehmen, und genau das soll der Index verhindern. Ohne die neuen Rules bleibt der Name unveränderlich; das Modul meldet dann „nicht unterstützt" und ändert **nichts**, statt in einen Namen zu wechseln, den niemand geprüft hat. Wer umbenennen darf, wann, wie oft und mit welchem Einstiegspunkt im Spiel, ist **deine Entscheidung nach der Bestandsaufnahme** und hier ausdrücklich nicht festgelegt – es gibt deshalb absichtlich noch keine Schaltfläche. Bekannte Grenzen: bestehende Freundschaften, offene Anfragen und Bestenlisten-Einträge behalten den Namen, den sie beim Schreiben hatten; ein Abbruch zwischen zwei Schritten lässt einen Soldaten vorübergehend **unauffindbar** – nie unter einem Namen findbar, der ihm nicht gehört.
- [ ] **Umbenennung: Freigabe und Veröffentlichung weiter offen – und an den Rules hängend:** Die veröffentlichten Rules erlauben eine Änderung des Anzeigenamens nicht (`players/<uid>/name` verlangt, dass ein bereits gesetzter Name unverändert bleibt); der Freundes-Suchindex prüft zusätzlich, dass sein Name dem Profilnamen entspricht. Eine Umbenennung ist damit eine eigene Rules-Änderung plus Anpassung von Suchindex, Reservierung und Anzeigename in einem Zug. Sie bleibt nach Freigabe der Index-Rules gesondert zu entscheiden; der Umgang mit Alt-Duplikaten ebenfalls.

**Abnahme:** Gleichzeitige Registrierung zweier Konten mit identischem beziehungsweise unterschiedlich geschriebenem gleichem Namen ergibt höchstens einen bestätigten Gewinner; der andere erhält eine verständliche Meldung. Bestehende Profile und Freundschaften bleiben erhalten. **Teilweise erbracht:** Reservierung, Meldung, Löschfreigabe und die Übernahme verwaister Einträge sind gebaut und lokal mit 13 Unit-Fällen geprüft (Gesamtlauf 1015 bestanden, 1 absichtlich übersprungen, 0 fehlgeschlagen); die Regeln des Kandidaten sind im Datenbank-Emulator grün; die serverseitige Durchsetzung wartet auf die Rules-Veröffentlichung, und die Bestandsaufnahme steht weiter aus. Emulator-/Rules-Tests decken auch manipulierte Schreibversuche, alte Clients, Offline/Retries, Konfliktmigration und Löschung ab. Die erforderliche komplette Rules-Änderung wird erst nach frischem Export, Backup, Vergleich und separater Freigabe veröffentlicht.

### A2. Freundesliste zuverlässig machen

**Nutzerhinweis:** Ein alter Account hatte nach Charakterlöschung und
Neuerstellung unter anderem Namen Probleme mit der Freundesuche. Der genaue
Zeitpunkt des Berichts und weitere Fehlerursachen sind nicht sicher belegt.

- [x] Für den Fall „gleicher Account, neuer Charakter und neuer Name“ wurden
  Code-/Suchindex-Reparatur sowie Suche, Anfrage und Annahme in synthetischen
  Emulatorfällen bereits gezielt implementiert und geprüft ([Block 2](#2-charakter-löschen-freunde-und-einladungen--wesentliche-teilfälle-bereits-umgesetzt)).
  Zwei echte Firebase-SDK-Browsersessions prüften außerdem Anfrage, Einladung
  und Beitritt in der anderen Suchrichtung. Das ist kein Beweis für alle
  produktiven Altbestände.
- [x] Ablehnung, erneute Anfrage trotz alter Sendermarkierung, Listenaktualisierung,
  Entfernen in beiden Richtungen und gleichzeitige Gegenanfragen sind mit
  synthetischen Firebase-Emulatorkonten geprüft; der Lebenszyklus wurde außerdem
  in zwei echten SDK-/Chromium-Sitzungen durchlaufen
  ([IPL-0021](PATCH-LOG.md#ipl-0021--block-2-freundschaftsabläufe-und-lokale-freundesporträts)).
- [x] Bei gleichzeitiger Anfrage zweier Tabs desselben Kontos meldet nur der
  serverbestätigte Write Erfolg. Eine unbestätigte Anfrage wird nicht aus einem
  danach sichtbaren Cachewert als gesendet abgeleitet; ein konkurrierender
  Zeiger wird nicht blind gelöscht. Unit-, Chromium-Double- und Firebase-
  Emulatortests bestanden ([IPL-0025](PATCH-LOG.md#ipl-0025--block-2-kein-scheinerfolg-bei-konkurrierenden-freundesanfragen)).
- [ ] Tatsächliche Geräte, reale alte Datensätze und zuvor fehlgeschlagene
  produktive Schreibvorgänge bleiben gesondert zu untersuchen.
- [~] **Online-/Offline-Status und fehlgeschlagene Suchindex-Erstellung: untersucht, eine Lücke geschlossen.** Befund: Eine fehlgeschlagene Veröffentlichung wird dreimal leise wiederholt (30 s, 60 s, 120 s) und erst danach gemeldet; die Meldung steht **im Freunde-Dialog**, damit sie nicht als Balken über dem Spiel hängt. Genau darin lag die Lücke: Wer den Dialog nie öffnet, sieht die Meldung nie — ein Gerät, das beim Synchronisieren offline war, blieb damit dauerhaft unauffindbar, und niemand sagte es ihm. Jetzt beobachtet der Client den Verbindungsstatus (`.info/connected`, dasselbe Muster wie bei der Anwesenheitsanzeige) und versucht es nach einem Fehlschlag **einmal** erneut, sobald die Verbindung zurück ist — nicht bei jedem Verbindungsereignis und nie während ein Versuch läuft, sonst würde jeder Tab bei jeder Rückkehr schreiben. Ein Erfolg vergisst den Fehlschlag; Abmelden und Charakterlöschung hängen den Beobachter ab. Einheitentests mit synthetischem SDK und DOM belegen Wiederholung nach Rückkehr, kein Schreibgewitter, keine Schreibvorgänge nach dem Abmelden; zusätzlich ist geprüft, dass die Tests ohne den Rückweg fehlschlagen. **Grenzen:** Synthetischer Verbindungswechsel ist kein echter Netzwechsel; die Firebase-Offline-Warteschlange, Zeitlimits und ein Wiedereinstieg mitten in einem laufenden Schreibvorgang sind damit nicht abgenommen.
- [~] **Mehrere Tabs, Kontowechsel, erneute Anmeldung:** Sitzungs- und Kontobezüge sind an Generationen und `auth.currentUser` gehängt; ein fremder oder überholter Rückruf verwirft sich. Gleichzeitige Anfragen zweier Tabs desselben Kontos melden nur den serverbestätigten Schreibvorgang als Erfolg. Offen bleibt die Prüfung mit **echten** parallelen Geräten und Tabs sowie mit Altbeständen.
- [ ] Online-/Offline-Status, Konto-/Charakterwechsel, erneute Anmeldung, Einladungen sowie abgebrochene und doppelt gesendete Anfragen weiter untersuchen und auf echten Geräten abnehmen. Namenskonflikte und deren Migration aus A1 einbeziehen.
- [ ] Klare Lade-, Offline-, Berechtigungs- und Wiederholungsmeldungen vorsehen; keine scheinbar erfolgreiche Aktion bei unbestätigtem Schreibvorgang. Keine vertraulichen Daten, Codes oder Zugangsdaten in Testberichte übernehmen.
- [ ] Reproduzierte Fehler einzeln dokumentieren, gezielt beheben und mit Emulator, Browser und anschließend – nach abgestimmter Möglichkeit – zwei echten Geräten/Konten prüfen. Umfang, Rules-Bedarf und verbleibende Grenzen hängen vom Befund ab.

### A3. Nach bestätigter Entlassung abmelden

**Ursprünglicher Block 2:** Nach erfolgreicher Charakterlöschung soll der
Account bestehen bleiben, aber die Sitzung abgemeldet werden. Die Loginseite
soll anzeigen: „Dein Charakter wurde aus dem Dienst entlassen. Bitte melde dich
erneut an.“ Der frühere Ausgangsstand blieb angemeldet und zeigte die
Charaktererstellung; die unten beschriebene Änderung ist mit #289 veröffentlicht.

- [x] Die bestehende Bereinigung auffindbarer Freundes-/Einladungsdaten und
  des Charakters wartet bereits auf Serverbestätigung; bei Fehler oder
  ungeklärter Antwort wird keine erfolgreiche Entlassung behauptet (PR #287).
- [x] Die Sitzung wird lokal nach bestätigter Löschung abgemeldet; die Meldung
  übersteht die Auth-Zustandsänderung beziehungsweise einen Guard-Dokumentwechsel.
  Bei Abmeldefehler bleibt ein separater Retry ohne neue Charaktererstellung.
  Die tablokale Einmalmarkierung enthält keine Konto-ID.
- [x] Chromium mit synthetischen Auth-/DB-Doubles prüft Erfolg, Lösch- und
  Abmeldefehler, Wiederholung, Sitzungswechsel und erneute Anmeldung; ein
  synthetischer Guard prüft zusätzlich den Dokumentwechsel.
- [x] Der angepasste Firebase-SDK-Browserfall bestand mit lokalem Auth-/RTDB-
  Emulator, absichtlich unterbrochener Verbindung und zwei synthetischen
  Accounts. Er ist kein Live- oder Mehrgeräte-Test.
- [ ] Reale Geräte, Altlasten und parallele Geräte bleiben gesondert
  abzunehmen; reale Tests nur nach Abstimmung.

## B – Multiplayer-Anfragen und Wellenfreigabe

**Ausgangsstand vor #289:** Bei Wellenfreigaben durfte nur der Host
anfragen; bei der 2×-Geschwindigkeitsabstimmung durfte bereits jeder Spieler
anfragen ([PR #136](https://github.com/0815games/0815games.github.io/pull/136)).
**Mit #289 veröffentlicht:** Die gesonderte Wellenfreigabe wurde wie folgt
umgesetzt. Lokale Firebase-SDK-/Rules-Emulatorfälle sind grün; echte Geräte-
und Live-Abnahme bleiben offen.

### B1. Welle von jedem anfragbar

- [x] **Veröffentlicht; lokal simuliert geprüft:** In 2er-, 3er- und 4er-Koop sowie 1v1 und 2v2 darf jeder teilnehmende Spieler die nächste Welle anfragen, auch die erste. Der Anfragende ist damit bereit; alle anderen müssen ausdrücklich bestätigen. Keine Mehrheit und kein stilles Ja nach Zeitablauf.
- [x] **Veröffentlicht; lokal simuliert geprüft:** Die Welle startet genau einmal und erst, wenn alle benötigten Zustimmungen für dieselbe Anfrage vorliegen und alle betroffenen Felder mit der vorherigen Welle und ihren Pflichtentscheidungen fertig sind. In 1v1 und 2v2 starten die getrennten Felder synchron. Solo erhält keine Mehrspieler-Abfrage.
- [x] **Veröffentlicht; lokal mit Chromium-Doubles geprüft:** Alle sehen Anfragenden, Welle und fehlende Zustimmungen; Ablehnung oder Rücknahme beendet die Anfrage. Gleichzeitige Anfragen, Doppeltipps, verspätete Antworten und Wiederholungen werden über eindeutige Anfrage-IDs geprüft.
- [x] **Veröffentlicht; lokal simuliert geprüft:** Verbindungsverlust verwirft offene Abstimmungen und nicht zugestellte alte Wellenbefehle; nach Rückkehr ist eine neue Abstimmung nötig. Die bestehenden Fortsetzungs-/Pausenregeln der Modi bleiben erhalten; Recovery übernimmt keine alte Zustimmung.
- [x] **Lokale SDK-/Rules-Emulatorprüfung:** Gastanfrage, Ablehnung, Rücknahme, Reconnect und Einstimmigkeit für alle fünf Modus-/Größenfälle bestanden; Zwei-Spieler-Gastpfade zusätzlich gegen lokale Guard-/Wartungskandidaten. Der SDK-Test ersetzt keine Browser- oder Gerätepartie.
- [x] **Kombinierte Browser-/Firebase-Emulatorprüfung:** Zweier-Koop bis zur Gast-2×-Freigabe in Welle 2; Drei-/Vierer-Koop nach durchgespielten Wellen 1 und 2 bis zur 2×-Freigabe in Welle 3. Offline/Reconnect ist im Drei-/Viererfall enthalten; Grenzen in [IPL-0011](PATCH-LOG.md#ipl-0011--block-1-unterschiedliche-gegnerwege-und-echte-emulator-browser).
- [x] **Abnahme (Browser & Handy):** Vom Betreiber im Browser und am Handy ohne
  Beanstandung getestet ([IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers));
  gleichzeitige 2–4-Geräte-Netzwechsel und Duelle unter Last bleiben bei Bedarf
  als Ergänzung vermerkt. Das einheitliche mittige Popup steht in [B2](#b2-anfragen-mittig-als-popup).

### B2. Anfragen mittig als Popup

- [x] **Mit #289 veröffentlicht:** Ein mittiges, nichtmodales Anfragezentrum zeigt
  Wellen- und 2×-Abstimmungen mit Absender, Welle, Zustimmungsstand und direkten
  Antworten. Der Anfragende sieht seinen Wartestreifen und eine Ergebnis- oder
  neutrale Statusmeldung. Eine verspätete Quittung darf einen bereits beendeten
  Antrag nicht wieder als wartend darstellen; eine übersprungene Generation
  wird nicht als Zustimmung ausgegeben.
- [x] **Social und Beitritt mit #289:** Partyeinladungen und
  Partybeitrittsanfragen stehen mit den Abstimmungen in derselben FIFO-Reihenfolge.
  Ihre Karten öffnen ausschließlich die jeweilige Übersicht; sie genehmigen,
  löschen oder versenden nichts. Freundschaftsanfragen behalten ihren bisherigen
  Menühinweis. Einladungen laufen nach 30 Minuten aus. Das vermeidet eine
  direkte Genehmigung mit veralteter Beitrittsanfrage: Eine Rücknahme und neue
  Anfrage derselben UID sind ohne serverseitige Generation nicht zuverlässig
  unterscheidbar. Beobachtete lokale Ersetzungen werden dennoch erkannt.
- [x] **Interaktion mit #289:** Bestehende Dialoge, Eingaben und sichtbare
  Feldentscheidungen verzögern die Karte. „Später“ und Escape beantworten
  nichts; veraltete oder zurückgezogene Abstimmungen sind nicht mehr ausführbar.
  Zustands-/Session- und Anfragekennungen sowie Doppelklickschutz werden erneut
  geprüft. Ist die Karte beiseitegelegt, bleiben die Kampfbefehle zugänglich.
  Die Online-Welle läuft während der Entscheidung weiter.
- [x] **Lokale Browserprüfung:** Zentrierung, Umbruch, 44-Pixel-Tasten,
  Tastatur-/Fokusverhalten, Deutsch/Englisch und reduzierte Animation wurden
  mit emulierten Hoch-/Querformaten und Desktop in Chromium geprüft. Das ist
  keine Screenreader- oder echte Geräteabnahme; die Sicht wird durch eine
  mittige Karte weiterhin teilweise verdeckt.
- [x] **Abnahme (Browser & Handy):** Vom Betreiber im Browser und am Handy
  positiv getestet ([IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers)).
  *(Screenreader, Firefox/Safari-Quertest und Mischversionen bleiben als
  technische Restnotiz dokumentiert.)*

## C – Multiplayer mit Anfangscharakteren

**Problem:** Der Nutzer empfindet Multiplayer mit frischen Charakteren als zu schwer. Das ist ein Spielgefühl-Bericht, noch keine isolierte Ursache.

- [x] Es gab bereits eine gezielte Anfänger-Entlastung für Zweiergruppen:
  [PR #192](https://github.com/0815games/0815games.github.io/pull/192) erhöhte
  den persönlichen Versorgungsanteil auf 70 % und dokumentiert einen gemessenen
  Bot-Vergleich. Das ist keine Abnahme der Balance mit echten Gruppen oder für
  drei und vier Spieler.

**Ausgangslage im Code:** Für ein gemeinsames Feld erhalten zwei aktive Spieler je **70 %** der Grund-Kill-/Wellen-Versorgung und Gegner erscheinen mit **1,5×** Leben; bei drei/vier aktiven Spielern sind es je **50 %/45 %** und **2×** Gegnerleben (`simulation.mjs`). Die Werte beziehen sich auf aktive Spieler auf diesem Feld; 1v1 hat getrennte Felder. Der veraltete 65-%-Hinweis wurde mit #289 in Englisch, Deutsch und Kommentaren auf den tatsächlichen Wert 70 % korrigiert und mit Konsistenz-/Balance-Tests geprüft; die Balance selbst blieb unverändert. Frische Spieler starten ohne gewählte aktive Fähigkeit, sofern sie noch keinen Punkt investiert haben.

- [ ] Baseline mit frischen Charakteren ohne Ausrüstung/Skills **und** mit abgeschlossener Einführung messen: Versorgung, Zeit bis zum ersten Ausbau, Bunkerschaden und erreichte Welle. Mehrere Karten, unterschiedliche Spielstile sowie Gruppen mit neuen und erfahrenen Spielern vergleichen; nicht nur eine idealisierte Bot-Strategie verwenden.
- [ ] Gegnerleben, Startversorgung und Belohnungen pro Teamgröße so abstimmen, dass eine Gruppe frischer Spieler die ersten Wellen und den ersten Boss mit verständlichen Entscheidungen bewältigen kann. Konkrete Werte erst nach Vergleich und Spieltests festlegen; keine versteckte Begünstigung eines Teams in 1v1/2v2.
- [ ] Vor und nach Block E getrennt messen: Zusätzliche Gegenangriffe dürfen die Entlastung für Anfänger nicht wieder aufheben. Belohnungen, Fortschritt und bestehende Ausrüstung nicht unbeabsichtigt entwerten.
- [ ] Koop mit 2, 3 und 4 Spielern, 1v1 und 2v2 auf Handy/Desktop und mit echten Mitspielern abnehmen; auch Ausfall/Rückkehr und gemischte Erfahrungsstände prüfen. Ergebnisse und Änderungen dokumentieren, statt eine feste Gewinnquote zu versprechen.

## D – Schüsse und aktive Soldatenfähigkeit

### D1. Schüsse lesbar und passend zum Spielstil

- [x] Es gibt bereits unterschiedliche Schussspuren, Mündungsblitze und
  Treffereffekte (`cartoon-art.mjs`) sowie gesonderte clientseitige Effekte;
  reduzierte Bewegung wird berücksichtigt. Die konkrete neue Lesbarkeits- und
  Qualitätsanforderung unten ist damit noch nicht vollständig abgenommen.
- [x] **Überarbeitet** (gebaut mit [PR #305](https://github.com/0815games/0815games.github.io/pull/305), [IPL-0045](PATCH-LOG.md#ipl-0045--block-3--d1-schüsse-als-spur-statt-als-linie)):
  statt der ganzen Linie eine **kurze Spur, die läuft**: sie verlässt den Lauf,
  läuft die Linie entlang und ist wieder weg. Jede Waffe hat ihre Handschrift:

  | Waffe | Spur | Gewicht | Timing | Einschlag |
  | --- | --- | --- | --- | --- |
  | MG | kurz, leicht | dünn | schnell | kleiner Ring |
  | Kanone | kurz, dick | schwer | langsam | schwerer, warmer Ring |
  | Flak | mittel | mittel | mittel | **platzt doppelt** in der Luft |
  | Scharfschütze | **lang, dünn** | hauchdünn | fast sofort | heller Ring mit Kreuz |
  | Soldat | kurz, hell | leicht | flink | kleiner Ring |

  Abgang und Einschlag sind **zwei Schläge**: der Mündungsblitz ist erloschen,
  bevor das Geschoss ankommt. Ein Prüfschritt erzwingt das – er hat den
  Scharfschützen erwischt, dessen Blitz noch brannte, wenn die Kugel längst saß.
- [x] **Verdecken begrenzt:** höchstens 24 Spuren gleichzeitig, die neuesten;
  die übrigen sind nicht gemalt, sie haben trotzdem getroffen. Die Spur bleibt
  beim Zoomen und auf dem kleinen Telefon sichtbar (Ausgleich, aber
  **begrenzt**, damit sie beim Herauszoomen nicht über das Feld wächst), und
  die Blitze sind gedimmt, damit ein volles Feld nicht blendet.
- [ ] **Datenmenge offen:** Wie viele Schüsse über das Netz gehen, ist Sache der
  Simulation, nicht des Malers – und hier sollte zunächst **nur die Darstellung**
  wechseln. Notiert, nicht angefasst.
- [x] **Nur Darstellung:** Treffer, Schaden, Reichweite, Schussfrequenz und
  Belohnungen sind unberührt; `shot-tracers.mjs` schreibt nichts in den
  Schuss zurück (Prüfschritt). Keine zusätzlichen und keine nachträglichen
  Treffer.
- [x] **Abnahme (Browser & Handy):** Alle Schussspuren wurden vom Betreiber im
  Browser und am Handy ohne Beanstandung getestet
  ([IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers)).

### D2. Fähigkeit als Teil des Gameflows

- [x] Der vorhandene Button zeigt schon den Fähigkeitsnamen, „bereit“, einen
  Cooldown in Sekunden oder „kein Skill“; auch Feld-Feedback existiert. Die
  gewünschte neue Position, Symbolik und Erklärung sind in der geforderten
  Form noch offen.
- [x] **Platzierung** (gebaut mit [PR #304](https://github.com/0815games/0815games.github.io/pull/304), [IPL-0044](PATCH-LOG.md#ipl-0044--block-3--zusatzwünsche-teil-2-fähigkeits-hud), **berichtigt** in [PR #306](https://github.com/0815games/0815games.github.io/pull/306) / [IPL-0047](PATCH-LOG.md#ipl-0047--korrektur-das-fähigkeits-hud-gehört-in-die-daumennähe-nicht-in-die-feldmitte)):
  der Knopf steht nicht mehr unten in den Kampfsteuerungen, sondern **im
  Kartenrahmen, unten rechts** – am Rand, in Daumennähe, über der
  Befehlsleiste und neben dem Funk. Er wandert nicht mit der Figur mit.
  **Zwischenstand war senkrecht mittig am rechten Rand** – von einem Menschen
  gesehen und abgelehnt: „Balken für Fähigkeiten … ist mittig im Bildschirm.
  Geht ja zum spielen quasi gar nicht?!“ Recht hatte er: die Mitte des Feldes
  ist dort, wo gekämpft wird.
- [x] **Symbol und Name:** Jede Fähigkeit trägt ihr eigenes gezeichnetes Zeichen
  (Luftschlag, Überlastung, Versorgungsabwurf, Feldreparatur, Unterdrückung)
  neben ihrem Namen. Zustände: `BEREIT`, `BEREIT IN {s}s`, `KEINE ZIELE`,
  `WELLE STARTEN`, `PANEL SCHLIESSEN`, `WARTEN`, `EINSATZ BEENDET` – in der
  Reihenfolge, in der ein Spieler sie sich fragt, nicht in der Reihenfolge des
  Codes. **Ohne** gewählte Fähigkeit steht `WÄHLEN UNTER FÄHIGKEITEN`, und der
  Funk nennt einmal, wo sie zu wählen ist – der Knopf bleibt in diesem Zustand
  deaktiviert und geht aus dem Treffertest heraus, damit er keine Drucke auf
  den Bauplatz darunter schluckt.
- [x] **Einmalige Einführung:** Beim ersten wirklich bereiten Zustand trägt der
  Knopf für einige Atemzüge einen Ring, und der Funk nennt ihn einmal. Ein Tap
  löst weiterhin direkt aus; ein laufendes Save kann ihn nicht ein zweites Mal
  auslösen (Pending-Sperre). Das Feld-Feedback pro Fähigkeitstyp war bereits
  vorhanden und bleibt unverändert.
- [x] **Touchziel:** mindestens 48 × 48 px, im echten Chromium in drei Fenstern
  nachgemessen (320×700, 390×844, 1440×900). Gemessen wird auch, dass das HUD
  **nicht auf dem `DEPLOY`-Knopf liegt** und dieser wirklich erreichbar bleibt:
  die erste Fassung stand im Befehlsfeld, und Chromium weigerte sich zu drücken
  ([IPL-0044](PATCH-LOG.md#ipl-0044--block-3--zusatzwünsche-teil-2-fähigkeits-hud)).
- [x] **Abnahme (Browser & Handy):** Positionierung unten rechts und Bedienung
  wurden vom Betreiber im Browser und auf dem Handy ohne Änderungswünsche
  positiv getestet ([IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers)).
  *(Screenreader und spätere Darstellung bei verletztem Soldaten aus Block E
  bleiben getrennt.)*

**Abnahme für D:** Mobil und Desktop, alle aktiven Fähigkeitstypen, ohne gewählten Skill, Cooldown, keine gültigen Ziele, aktive Dialoge und Multiplayer-Verzögerung prüfen. Darstellung darf die Simulation nicht verändern; Lesbarkeit und Spielgefühl zusätzlich auf echten Geräten beurteilen.

## E – Neues modusübergreifendes Lebens- und Angriffssystem

### Ziel und Leitplanken

Gegner sollen nicht nur zum Bunker laufen, sondern bei Gelegenheit Soldaten und Türme bedrohen. Das schafft Entscheidungen über Position, Schutz und Reparaturen, ohne Anfängern in den ersten Minuten eine unaufhaltsame Verlustspirale aufzuzwingen. **Kein dauerhafter Verlust von Charakterfortschritt, Ausrüstung oder Skillpunkten.** Alle folgenden Zahlen sind Startwerte für einen Prototyp, keine bereits ausbalancierten Versprechen.

Der Bunker hat heute bereits Leben und bestehende Reparatur-/Skill-Effekte; bei null endet normalerweise das jeweilige Feld (`simulation.mjs`). Turm- und Soldatenleben sind neu. Die gemeinsame Simulation bleibt die Quelle der Treffer und Zustände – die Animation ist nur Darstellung.

### E1. Was wird angegriffen?

| Ziel | Vorgeschlagenes Verhalten |
| --- | --- |
| **Bunker** | Bestehendes Leben, Verstärkungen, Reparatur und Niederlage weiterverwenden. Gegner verursachen beim Erreichen wie bisher Schaden; vorhandene Bossangriffe bleiben erhalten. Kein versehentlicher doppelter Schaden aus altem und neuem Trefferpfad. |
| **Soldat** | Startvorschlag: **100 Leben pro Spieler**. Gegner in Reichweite kündigen einen Angriff sichtbar an; wer ausweicht, kann ihn vermeiden. Bei null vorübergehend kampfunfähig, nicht sofort das Match verloren. Nach zunächst **8 Sekunden** Rückkehr mit vollem Leben an einem sicheren Punkt nahe dem eigenen Bunker und kurzem Schutz, z. B. **3 Sekunden**. Keine XP-/Itemstrafe; Ability-Cooldown nicht durch Ausfallen zurücksetzen. |
| **Turm** | Startvorschlag: **120 Leben auf Stufe 1**; spätere Typ-/Stufendifferenzierung nach Tests. Schaden bleibt bei einem Upgrade anteilig erhalten, damit Hochstufen kein kostenloser Vollheal ist. Bei null bleibt der Turm auf seinem Bauplatz, feuert nicht und kann repariert werden. Stufe, Spezialisierung und Besitzer bleiben erhalten. |

Die eigene Lebensanzeige ist im HUD sichtbar; bei Auswahl oder Beschädigung sind Turmleben und Reparaturkosten erkennbar. Bunker, eigener Soldat und beschädigte Türme bekommen gut unterscheidbare Zustände und kurze, lesbare Trefferhinweise – nicht nur rote Farbe oder Bildschirmblitzen. Soldaten- und Turmleben gelten für den jeweiligen Einsatz, nicht als dauerhafter Schaden im gespeicherten Charakterprofil.

### E2. Angriffe mit Gegenmaßnahmen

- [ ] Infanterie bedroht vor allem **Soldaten in Reichweite**, Panzer vor allem **nahe Türme**; schnelle Scouts bleiben vorrangig auf dem Weg zum Bunker. Flugzeuge und bestehende Bosse zunächst nicht zusätzlich mit neuen Dauerangriffen überladen. Konkrete Reichweiten, Schaden und Häufigkeit pro Gegnertyp müssen durch Tests festgelegt werden.
- [ ] Angriffe sind begrenzt, mit sichtbarer Vorwarnung und eigenem Abklingintervall. Ein Angriff trifft nur ein noch gültiges Ziel; tote Gegner schießen nicht weiter, Soldaten können aus der Reichweite ausweichen. Eine Obergrenze gleichzeitiger Angreifer pro Ziel und ein langsamer Einstieg in den ersten Wellen schützen vor unlesbarem Fokusfeuer.
- [ ] Gegner bleiben auf ihren vorhandenen Wegen und verfolgen Spieler nicht endlos über die Karte. Kein Friendly Fire und keine Angriffe auf das gegnerische Feld im Überlebens-Wettkampf. Vorhandene Bosswarnungen, Gelände und Flug-/Bodentypen bleiben nachvollziehbar.
- [ ] Neues Feedback erklärt, **wer** angegriffen wird und wie man reagiert. Im Tutorial wird das System sicher und verständlich eingeführt; der bestehende Fünf-Wellen-Vertrag und seine Abschluss-/Belohnungslogik dürfen nicht blockiert werden.

### E3. Reparatur statt harter Verlustspirale

- [ ] Ein beschädigter Turm kann über seine bestehende Auswahl repariert werden; der Preis ist vorher sichtbar und wird aus dem Vorrat des bestätigenden Spielers bezahlt. Startvorschlag: bis zu **50 Prozentpunkte** Leben wiederherstellen, höchstens bis zum Maximum, gegen etwa **20 % der bisherigen Turminvestition**; bei kleinerem tatsächlichem Heilbetrag weniger. Eine kurze Reparaturzeit und genaue Kosten/Mindest-/Höchstwerte werden getestet. Der Turm schießt während der Reparatur nicht; bei Abbruch vor der Wirkung werden reservierte Kosten eindeutig zurückgegeben.
- [ ] Nach einer überstandenen Welle erhalten Türme, die darunter liegen, kostenlos mindestens **25 %** Leben zurück; auch ein ausgefallener Turm kann so wieder eingesetzt werden. Das verhindert, dass eine Gruppe ohne Vorräte dauerhaft ohne Verteidigung festhängt. Mehrfach-Reparatur, gleichzeitige Klicks, Upgrade und Verkauf dürfen weder Geld noch Leben duplizieren; Verkaufserstattung und Reparaturpreis zusammen auf Umgehungsmöglichkeiten prüfen.
- [ ] **Vorschlag zu „Türme zurückstufen“:** zunächst **kein automatischer Stufenverlust**. Ein ausgeschalteter Turm erzeugt bereits spürbaren Druck, ohne erwirtschaftete Upgrades doppelt zu bestrafen. Eine spätere, klar angekündigte Zurückstufung höchstens für besondere späte Gegner/Schwierigkeitsvarianten nach eigenem Balancetest prüfen – niemals still oder dauerhaft im Charakterprofil.
- [ ] Der kampfunfähige Soldat bleibt Mitglied der Partie und darf nicht mit einem Netzwerk-Disconnect verwechselt werden; keine unbeabsichtigten Verluste von Teilnahme, Wellenzustimmung oder Belohnungen. Rückkehrschutz und sichere Position verhindern unmittelbare Wiederholungstreffer.

### E4. Gleiche Regeln, passende Spielfelder

| Modus | Anwendung |
| --- | --- |
| **Tutorial, Kampagne und Solo-Endlos** | Gleiche Lebens-/Trefferregeln mit sanfter Einführung beziehungsweise missionsspezifischer Balance. Bestehende Missionsziele, Bossmechaniken, Wellenabschluss und Endlos-Sektorwechsel bleiben funktionsfähig; Reparatur und Erstattung beim Rückzug ausdrücklich testen. |
| **Koop für 2–4** | Ein gemeinsamer Bunker und gemeinsame Türme; jeder Soldat hat eigenes Leben und eigenen Vorrat. Reparaturzahlung, Turmbesitz und Freigaben sind für alle klar. Ausfall eines Soldaten ist kein Disconnect und kein Ende der Partie. |
| **1v1** | Zwei getrennte Felder mit gleichen Grundregeln; eigene Treffer betreffen nur das eigene Feld. Wie bisher entscheidet der Bunker über Sieg/Niederlage, gleichzeitige Niederlagen bleiben ein Unentschieden. |
| **2v2** | Zwei getrennte Teamfelder; jedes Team schützt seinen Bunker und seine Türme, jeder Spieler seinen Soldaten. Keine Heilung oder Angriffe zwischen den gegnerischen Feldern; synchroner Wellenstart und gleichzeitige Niederlagen bleiben korrekt. |

### E5. Umsetzung und Abnahme

- [ ] Zunächst deterministischen Prototyp im gemeinsamen Fixed-Step-Kern bauen: Leben, Ziele, Angriffsvorwarnung, Treffer, Reparatur, Ausfall und Rückkehr sind Matchzustand. Zielwahl und gleichzeitige Treffer stabil auflösen; kein Schadensentscheid im Renderer oder pro Zuschauer.
- [ ] Online führt weiterhin der **Spieler-Host** die Simulation; neue Zustände und Befehle in Snapshots/Protokoll, Grenzen und Versionierung berücksichtigen. Reconnect und das **experimentelle** Host-Recovery gesondert prüfen; daraus keine neue Host-Migration oder manipulationssichere Serverautorität ableiten. Alte Clients/Checkpoints nicht still mit inkompatiblem Zustand mischen.
- [ ] Unit-/Replay- und Simulationsfälle für alle Ziele und Modi: Ausweichen, Tod vor Treffer, gleichzeitige Treffer, null/maximales Leben, Reparatur während Schaden, Konkurrenz um denselben Turm, Soldatenrückkehr, Wellenende, Bossangriffe und gleichzeitige Bunkerniederlage. Bestehende Saves, Fähigkeiten, Ausrüstung und Belohnungen regressionsprüfen.
- [ ] Multiplayer- und Emulatorfälle für 2–4 Clients, verzögerte/doppelte Befehle, Disconnect/Reconnect, Zuschauerzustand und Snapshot-Größen; keine Doppelzahlungen oder abweichenden Treffer. Browser-/Gerätetests für Lesbarkeit, FPS, Trefferwarnungen, Touch und reduzierte Bewegung. Erst danach gemeinsam mit Block C menschlich balancieren.

## 8. Was nach den Patches ansteht – Sammelstelle

Dieser Block ist **kein eigener Patch** und hat keine Reihenfolge. Er sammelt,
was erst sinnvoll wird, wenn die Blöcke 1–7 stehen – und alles, was beim
Arbeiten auffiel, aber nicht in einen laufenden Block gehört.

### Prüfstand: gelegentlich rote Browser-Tests

- [ ] **`test:party-recovery-browser` einmal rot, zweimal grün mit demselben
  Code.** Nach dem Merge von [PR #301](https://github.com/0815games/0815games.github.io/pull/301)
  (Endless-Turmschimmer, Main `749f58b`) schlug der Job
  `party-finalization-browser (test:party-recovery-browser)` im Lauf
  [44026363385](https://github.com/0815games/0815games.github.io/actions/runs/44026363385/job/133847546415)
  fehl – Ausstieg 1, Testschritt selbst, nach rund zwei Minuten, im
  Vier-Spieler-Szenario *Host-Reload, fenced Recovery, Receipt-Revalidierung*.
  Dieselben beiden Jobs liefen auf dem Branch zweimal grün
  ([44024819713](https://github.com/0815games/0815games.github.io/actions/runs/44024819713),
  [44024968901](https://github.com/0815games/0815games.github.io/actions/runs/44024968901))
  mit inhaltsgleichem Baum. **Einschätzung: Flake, nicht Regression – unbewiesen.**
  Der Schimmer berührt keine Netz-, Recovery- oder XP-Logik, und der Test prüft
  keine Bildinhalte.
- [ ] **Drei Wege, es zu beweisen, waren im Arbeitsraum versperrt.** Die
  Job-Logs liegen auf `blob.core.windows.net`, das außerhalb des Netzes des
  Arbeitsraums liegt; `gh run view --log` bricht mit `EOF` ab. Ein erneuter
  Start scheitert: `gh run rerun` lehnt den Lauf ab, `workflow_dispatch` gibt es
  nicht, und ein Re-Trigger würde einen Push auf `main` brauchen. Lokal
  nachstellen ließ es sich nicht (kein Java, keine Firebase-Emulatoren,
  Chromium-Download blockiert). **Nächster Versuch mit Menschenhand:** Log im
  Browser öffnen oder über einen belanglosen Folge-PR die Welle neu anstoßen.
- [x] **Begrenzte CI-Wiederholung beschlossen und umgesetzt (`20261031-patch8`, `IPL-0065`):**
  Auf Betreiber-Entscheidung führt die 8-Job-Browser-Matrix `party-finalization-browser`
  in `.github/workflows/ironpath-firebase-rules.yml` maximal **1** automatischen
  Wiederholungslauf aus (`timeout-minutes: 20`, zwei Versuche à `timeout 480`,
  zwischen Versuch 1 und 2 gezielte Bereinigung hängender Emulator-/Chromium-Prozesse
  samt `::warning`). Ursprünglicher Flake aus Lauf `44026363385` ist damit abgesichert.

### Popups

- [x] **Versions-Popups ebenfalls mittig.** Betreiberwunsch vom 2026-11-17,
  gebaut mit [PR #306](https://github.com/0815games/0815games.github.io/pull/306)
  ([IPL-0046](PATCH-LOG.md#ipl-0046--block-8--was-ein-element-tut-nicht-wie-es-heißt)).
  `#versionNotice` liegt nicht mehr oben rechts, sondern in der Mitte – es hat
  Knöpfe (`RETRY CHECK`, `DISMISS`) und unterbricht damit wie alle anderen.
  **Die Regel ist geschärft**, und zwar in `popup-center.css` selbst: nicht die
  Bezeichnung entscheidet, sondern was ein Element **tut**. Beim Schreiben
  kamen zwei Sätze hinzu, die vorher fehlten: es muss **schweben** (ein
  mitlaufendes Band wie die Sandkasten-Leiste ist Möbel, kein Popup), und über
  einer ohnehin leeren Fläche (Ladehinweis) kostet die Mitte nichts.
### Abmeldung nach Inaktivität

- [x] **Eine Karte statt einer Textzeile** (Betreiberwunsch vom 2026-11-17,
  gebaut mit [PR #306](https://github.com/0815games/0815games.github.io/pull/306),
  [IPL-0046](PATCH-LOG.md#ipl-0046--block-8--was-ein-element-tut-nicht-wie-es-heißt)):
  nach 30 Minuten ohne Eingabe schließt das Spiel die Sitzung und zeigte bisher
  einen schlichten Satz auf dem Anmeldebildschirm. Jetzt erscheint ein Dialog
  mit einem **eigenen Bild**: ein Soldat, der sich setzt – Munitionskiste,
  Gewehr angelehnt in Reichweite, Laterne an, Becher in der Hand, der Bunker
  dahinter. Geruht, nicht geschlagen: es hat niemanden getroffen.
- [x] **Gemalt vom Spiel selbst.** `afk-rest-scene.mjs` zeichnet die Szene mit
  denselben Tintenlinien, demselben Oliv und Gold und denselben Formen wie das
  Feld – kein fremdes Bild, kein zweiter Stil. Der Dampf über dem Becher
  entfällt bei reduzierter Bewegung.
- [x] **Wegklicken führt zur Anmeldung:** der Knopf schließt die Karte, löscht
  den Vermerk (sonst käme sie bei jedem Sprachwechsel wieder) und setzt den
  Zeiger ins Namensfeld. Der Anmeldebildschirm liegt ohnehin dahinter.
- [x] **Abnahme (Browser & Handy):** Vom Betreiber im Rahmen der
  Browser-/Handy-Tests ohne Beanstandung abgenommen
  ([IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers)).

### Sichtbarkeit im Feld

- [x] **Feldfunk minimiert starten.** Der Funkverkehr nimmt zu viel Platz ein.
  Gewünscht: ein kleines **Funkgerät** als Ausgangspunkt, das **minimiert**
  startet – erst ein Antippen öffnet die Nachrichten als Popup. Betroffen sind
  die Funkkarte `#storyRadio` (`.story-radio`, bis zu 370 px breit, liegt links
  unten im Kartenrahmen und hebt sich bei einer Feldentscheidung nach oben)
  **und** die Funkzeile `.battle-foot` mit `#message`; beide stehen heute
  dauerhaft im Bild.
  - [x] **Teil 1 – Warnungen haben ihre eigene Stimme** (Betreiberentscheidung
    vom 2026-11-17: *„Ins Popup wandern nur Meldungen, die eine Entscheidung
    oder eine Warnung sind. Der Rest bleibt in der Zeile, wie heute.“*). Gebaut
    mit [PR #308](https://github.com/0815games/0815games.github.io/pull/308) ([IPL-0050](PATCH-LOG.md#ipl-0050--block-8--der-funk-bekommt-eine-zweite-stimme-warnungen-statt-nur-meldungen)):
    Warnungen stehen auf einer eigenen Karte **über** dem Funk, bleiben stehen,
    bis sie weggeklickt werden, und stellen sich hinten an, statt sich
    gegenseitig zu überschreiben. Der gewöhnliche Funkverkehr bleibt in der
    Zeile. **Entscheidungen** (Wellen- und 2×-Abstimmung, Feldentscheidung)
    waren schon vorher mittige Popups.
  - [x] **Teil 2 – der Funk wird zum Funkgerät** (Betreiberentscheidung vom
    2026-11-17: **„Funkgerät“** – ein kleiner Handapparat, der **geschlossen
    startet**). Gebaut mit
    [PR #309](https://github.com/0815games/0815games.github.io/pull/309)
    ([IPL-0051](PATCH-LOG.md#ipl-0051--block-8-der-funk-wird-zum-funkgerät-er-startet-geschlossen)):
    der Handapparat steht in der Ecke, **zählt**, was dazugekommen ist, und
    öffnet auf Antippen die letzten zwölf Meldungen – ein Tipp aufs Feld oder
    die Escape-Taste schließt wieder. Die dauerhafte Funkzeile ist damit aus
    dem Bild; für Screenreader bleibt ein versteckter Live-Bereich (die Ansage
    bleibt, die Fläche nicht). Die **Kampagnen-Funkkarte** `#storyRadio` bleibt
    absichtlich, wie sie ist: sie erscheint für Sekunden und ist eher mit der
    Warnkarte verwandt. **Zurückgenommen** (gleicher Tag, Betreiber hat es auf
    dem Feld gesehen): der Schließen-Knopf stand zu weit über das Fenster, und
    Handapparat samt Fenster lagen über dem Kartennamen und den Spielmodi. Siehe
    [IPL-0052](PATCH-LOG.md#ipl-0052--block-8-ausgemistet--kein-funkgerät-keine-flagge-das-menü-nach-unten).
- [x] **Ausgemistet: kein Funkgerät, keine Flagge, das Menü nach unten**
  (Betreiber, 2026-11-17). Vier Entscheidungen, gebaut mit
  [PR #310](https://github.com/0815games/0815games.github.io/pull/310) /
  [IPL-0052](PATCH-LOG.md#ipl-0052--block-8-ausgemistet--kein-funkgerät-keine-flagge-das-menü-nach-unten):
  - [x] Das **Funkgerät ist weg** – Handapparat, Log und Zähler, *„minimalismus
    is fine“*. Was der Funk gesagt hat, wird nur noch für Screenreader
    gesprochen.
  - [x] **Eine Meldung bleibt, von oben:** was wichtig ist (Bosse, gebrochenes
    Eis, Trümmer, Schlamm, abgelehnte Anforderungen) flattert unter der
    Statusleiste herein, bleibt kurz und geht von selbst. Keine Tipps, kein
    Knopf.
  - [x] **Statusleiste:** Erfahrungsbalken, „10 / 300“ und „noch X bis Stufe Y“
    sind entfernt (*„Sieht wild aus“*); die Stufe bleibt.
  - [x] **Flagge und Next-Wave-Info** sind gänzlich entfernt (*„Man benutzt es
    eh nie“*).
  - [x] Der **Menü-Knopf** sitzt jetzt ganz unten in der Befehlsleiste zwischen
    TEMPO und EINSATZ BEENDEN – ausgeschrieben, und als Burger mit drei Strichen,
    wenn die Leiste zu eng wird.
- [x] **Einheitlich: eine Spalte rechts, ein Rahmen unten, der Kartenname als
  Überschrift** (Betreiber, 2026-11-17, auf dem Gerät gesehen). Drei
  Meldungen, gebaut mit [IPL-0053](PATCH-LOG.md#ipl-0053--block-9-einheitlich--der-kartenname-wird-einmal-zur-überschrift):
  - [x] *„Karte einpassen“ und der Fähigkeitsknopf sitzen ein bisschen
    aufeinander und haben verschiedene Optik – es sollte alles einheitlich
    sein.“* → eine Spalte am rechten Rand mit einem Abstand, ein Aussehen für
    alle drei Knöpfe (Upgrade-Hinweis, Zoom, Fähigkeit).
  - [x] *„Der Bürger-Button hat einen anderen Rahmen und sitzt anders als die
    Buttons drum herum.“* → Rahmen, Rundung und Schrift der Befehlsleiste
    gelten jetzt für den Burger genauso, und er füllt die Reihe.
  - [x] *„Unten links steht permanent der Kartenname. Ich möchte ihn einmal wie
    als Überschrift des Kampfes am Anfang, schön und prunkvoll, gerne auch mit
    Artwork im Ingame-Stil, mittig am Bildschirm haben, wenn die Karte geladen
    wird – und dann weggehen.“* → das Kästchen unten links ist entfernt; die
    Karte bekommt eine **Titelkarte** mit dem gemalten Feld, einmal, zentriert,
    ohne Knopf und ohne Tipps.
- [x] **Glow am Turm zu gering** (geklärt: **beides**, gebaut in
  [PR #306](https://github.com/0815games/0815games.github.io/pull/306) /
  [IPL-0048](PATCH-LOG.md#ipl-0048--block-8--der-turm-soll-leuchten-schimmer-und-prestige-schein)):
  der Betreiber wollte nicht wählen, sondern beides – erst den Schein der
  Turmgrafik deutlich stärker, danach den Schimmerring aus
  [IPL-0041](PATCH-LOG.md#ipl-0041--block-3--c-endless-turmschimmer)
  (vorher Radius 37 × 26 px, Deckkraft .42–.62) nachziehen. Beides ist
  gebaut, und beides bleibt **unter** dem Turm: ein Schein, der heller ist als
  das, was er zeigt, verdeckt es. Bei reduzierter Bewegung stehen beide still
  und sind etwas kräftiger als die bewegte Fassung. **Kein Mensch hat das
  Ergebnis gesehen.**

### Nachgelagert, weil es die Blöcke berührt

- [x] **Block-4-Porträt-Rules veröffentlicht ([IPL-0056](PATCH-LOG.md#ipl-0056--block-4-rules-veröffentlicht-layer-geisterbild-im-avatar-baukasten-belegt)); Block-2-Namens-Rules noch offen:**
  `gender.read` und `avatar.read` sind live; der Block-2-Namensindex
  (`characterNames` / Umbenennung) folgt erst nach der Bestandsaufnahme
  (`CHARACTER-NAME-AUDIT.md`) mit eigener Freigabe.
- [ ] **Altbestände und Alt-Geräte:** Kontoübergreifend eindeutige
  Charakternamen einschließlich Alt-Duplikaten, alte Clients, alte Saves und
  nächste Build-Stempel-Welle (`?v=`) für `account.js` prüfen bzw. ausrollen.
- [x] **Sichtungen im Browser und auf dem Handy nachgeholt:** Alle bisherigen
  sichtbaren UI- und Gameplay-Änderungen (inklusive Turmschimmer, Titelkarte,
  Notice, Burger-Menü, AFK-Karte, Popups, Schussspuren und Fähigkeits-HUD)
  wurden vom Betreiber im Browser und am Handy ohne Verbesserungsbedarf
  bestätigt ([IPL-0055](PATCH-LOG.md#ipl-0055--merge-313-block-4-rules-datei-und-browser-handy-abnahme-des-betreibers));
  das korrigierte `#versionNotice`-Popup mit Bild unter `20261031-patch6`
  ebenfalls (`IPL-0062`).

### Neue Spiel-/UI-Nacharbeiten (Wunschliste vom 2026-11-18, `IPL-0062` / lokal umgesetzt `IPL-0063`)

- [x] **Karten-Seeding links ↔ rechts statt halb leerer Endloskarten (`maps.mjs`):**
  Versionierte `g4-<sector><8-hex>`-Seeds in `IronPath/maps.mjs` legen Start
  konsequent auf die West- oder Ostkante (`W↔E`), den Bunker gegenüber (links
  oder rechts) und verteilen Bauplätze über beide Feldhälften (`1.600/1.600`
  Sektor-1–4-Seeds sowie `tests/maps.test.mjs` bestanden); Kampagnen- und
  Altsave-`g3-`-Seeds bleiben unverändert stabil. *(CI-/Geräteabnahme offen.)*
- [x] **Ingame-Feldmenü bereinigen und Abstände ordnen (`index.html`, `field-menu.mjs`, `field-command.css`):**
  **„Coaching wiederholen“** (`#fieldCoachReplay`) und **„Kommandozentrale“**
  (`#fieldBack`) aus `#fieldOps` und `field-menu.mjs` entfernt;
  **„Einstellungen“** (`#fieldSettings`) und **„Abmelden“** (`#fieldLogout`)
  in `.field-ops-footer` mit Trennlinie und `8px`-Abstand unten angeordnet.
  *(CI-/Geräteabnahme offen.)*
- [x] **Aktion-Skill-Button mit klarem `READY`-Signal (`field-command.css`, `game.js`, `localization-results-de.mjs`):**
  Dauerhafte Hervorhebung für `#ability[data-state="ready"]` (goldener Rahmen,
  leuchtendes Medaillon, kontrastreiches `READY`/`BEREIT`-Badge und sanfter
  Impuls mit `prefers-reduced-motion: reduce`), erneuter Aufmerksamkeitsring
  `.ability-hud--new` plus nicht-blockierende Feldmeldung `{ability} is ready!` /
  `{ability} ist bereit!` beim Bereitwerden sowie nach Abklingzeit.
  *(Unit-Tests inkl. Abklingzeit bestanden; CI-/Geräteabnahme offen.)*
- [x] **Admin-Login-Einstieg im Loginscreen (`index.html`, `interface-redesign.css`, `localization-more-static-de.mjs`, `release-tools/stage-version.mjs`):**
  Übersetzter Link `#adminLoginLink` (`Admin login` / `Admin-Login`) in
  `.dossier-bottom` außerhalb von `aria-hidden` auf `#authView` ergänzt; in
  isolierten geschützten Test-Builds (`stage-version.mjs`) wird `.dossier-admin`
  automatisch entfernt. *(Packaging-Tests bestanden; CI-/Geräteabnahme offen.)*

## Gemeinsame Freigabe

Neue Punkte bleiben offen, bis ihr jeweiliger Code, automatisierte Tests und passende Geräte-/Mehrspielertests abgeschlossen sind. Firebase-Tests verwenden zunächst Emulatoren und synthetische Daten. Produktive Rules und Migrationen benötigen einen aktuellen Sicherheits-, Kompatibilitäts- und Backup-Check. Nach sinnvollen geprüften Schritten soll die Website veröffentlicht und das Spiel wieder für Tests geöffnet werden; dieser Plan schaltet die Wartung nicht selbst.
twerden sowie nach Abklingzeit.
  *(Unit-Tests inkl. Abklingzeit bestanden; CI-/Geräteabnahme offen.)*
- [x] **Admin-Login-Einstieg im Loginscreen (`index.html`, `interface-redesign.css`, `localization-more-static-de.mjs`, `release-tools/stage-version.mjs`):**
  Übersetzter Link `#adminLoginLink` (`Admin login` / `Admin-Login`) in
  `.dossier-bottom` außerhalb von `aria-hidden` auf `#authView` ergänzt; in
  isolierten geschützten Test-Builds (`stage-version.mjs`) wird `.dossier-admin`
  automatisch entfernt. *(Packaging-Tests bestanden; CI-/Geräteabnahme offen.)*

## Gemeinsame Freigabe

Neue Punkte bleiben offen, bis ihr jeweiliger Code, automatisierte Tests und passende Geräte-/Mehrspielertests abgeschlossen sind. Firebase-Tests verwenden zunächst Emulatoren und synthetische Daten. Produktive Rules und Migrationen benötigen einen aktuellen Sicherheits-, Kompatibilitäts- und Backup-Check. Nach sinnvollen geprüften Schritten soll die Website veröffentlicht und das Spiel wieder für Tests geöffnet werden; dieser Plan schaltet die Wartung nicht selbst.
