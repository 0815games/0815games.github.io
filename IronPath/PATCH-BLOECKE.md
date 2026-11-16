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
danach Oberfläche (3), Avatare (4), Skills (5) und zuletzt das große Tutorial
(6). Das zusätzliche Lebenssystem (7/E) ist ein eigenes Vorhaben; seine genaue
zeitliche Einordnung und mögliche Folgen für das Tutorial sind gesondert
abzustimmen. Der Betreiber wünscht nach jedem sinnvollen, geprüften Schritt eine
Veröffentlichung und die anschließende Öffnung zum Testen; Wartung soll nur für
den genannten Merge-/Commit-Vorgang laufen. Nach dem Release #289 wurde die
Wiederöffnung öffentlich bestätigt. Ob ein Schritt tatsächlich veröffentlicht
oder geöffnet ist, zeigen die nachgetragenen Ereignisse im Patch-Log und der
aktuelle Status.
Diese Bestandsaufnahme selbst ändert keine Firebase-Rules oder Produktionsdaten.

## Schnellübersicht – sechs Originalblöcke

Die Statusangaben unterscheiden **bereits veröffentlichte Teilfunktionen** von
weiteren Wünschen und fehlender Abnahme. Die ausführlichen Kriterien stehen
unverändert in den nachfolgenden Abschnitten; kein Block ist allein wegen einer
grünen Testsuite vollständig erledigt.

| Block | Bereits vorhanden oder veröffentlicht | Noch offen |
| --- | --- | --- |
| [**1 · Multiplayer**](#1-zuerst-multiplayer-wieder-vollständig-spielbar-machen--mehrere-fixes-bereits-umgesetzt) | Mehrspielermodi, größere Karten und mit #289 Turm-/Abstimmungsfixes, Anfragekarten, Abschluss und Berichte. | Echte Geräte und Netzwechsel, längere Partien, Einsteigerbalance sowie der Umgang mit dauerhaft fehlenden Mitgliedern. |
| [**2 · Charakter und Freunde**](#2-charakter-löschen-freunde-und-einladungen--wesentliche-teilfälle-bereits-umgesetzt) | Charakterbereinigung, Abmeldung danach, Freundschaft, Einladungen und weitere Social-Fixes; Porträtanzeige mit sicherem Platzhalter; Namensregel und Reservierung für **neue** Charaktere. | Serverseitige Durchsetzung der Eindeutigkeit (Rules noch nicht veröffentlicht), globale Namenseindeutigkeit für Altbestände, Porträt-Rules und reale Mehrgeräteabnahme. |
| [**3 · Oberfläche**](#3-kampf--und-party-oberfläche--bericht-und-rangabzeichen-bereits-gebaut) | Party-Liste, Bericht und Rangabzeichen im Profil sind vorhanden; der Betreiber lobte den Abschlussbericht. | Party-Porträtkarten, Kampf-HUD mit EP, Rang/Beförderung im Bericht, „What’s Next“, bezahlbarer Turmschimmer sowie Schuss-/Fähigkeitsdarstellung. |
| [**4 · Avatare**](#4-charaktererstellung-und-avatare--genehmigte-überarbeitung-bereits-live) | Die zuvor ausdrücklich freigegebene Layer-Vorschau ist bereits in Charaktererstellung, Menü und Dossier eingebaut. | Gewünschte zusätzliche Looks und konsistente, sichere Darstellung/Speicherung auf verschiedenen Geräten, in Freunde- und Partyansicht. |
| [**5 · Skills**](#5-skills-neu-strukturieren--bestehende-turm-spezialisierungen-bereits-implementiert) | Fünf Klassen und zehn Turm-Kits mit Rängen I–III existieren; der Veteranen-UI-Preisfix ist veröffentlicht. | Bossjäger III und Doppel-MG III korrigieren; sechste Luftabwehrklasse, exklusive Klassenauswahl und sichere Punkterückgabe/Migration. |
| [**6 · Tutorial**](#6-tutorial-als-großer-zusammenhängender-einsatz--bisheriges-tutorial-gebaut-und-teilfix-bestätigt) | Die bisherige Fünf-Wellen-Einführung, Wiederholung und bestätigte Abbruchfixes sind vorhanden. | Charakterbezogene Annahme/Ablehnung, große zusammenhängende Mission, Generalstimme und anschließende Menüführung. |

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
| 1 | [Block 1 · Multiplayer](#1-zuerst-multiplayer-wieder-vollständig-spielbar-machen--mehrere-fixes-bereits-umgesetzt) | Geräte-, Netzwechsel- und Langzeitabnahme; Umgang mit dauerhaft fehlenden Mitgliedern. | In Arbeit |
| 2 | [Block 2 · Charakter und Freunde](#2-charakter-löschen-freunde-und-einladungen--wesentliche-teilfälle-bereits-umgesetzt) | Namensregel und Reservierung stehen ([A1](#a1-charaktername-darf-nicht-doppelt-vergeben-werden)); offen: Rules-Veröffentlichung, Altbestände, Porträt-Rules, Mehrgeräteabnahme. | In Arbeit |
| 3 | [Block 3 · Oberfläche](#3-kampf--und-party-oberfläche--bericht-und-rangabzeichen-bereits-gebaut) | Party-Karten, Kampf-HUD, Bericht mit Rang/Beförderung, „What’s Next“. | Geplant |
| 4 | [Block 4 · Avatare](#4-charaktererstellung-und-avatare--genehmigte-überarbeitung-bereits-live) | Weitere Looks, einheitliche Anzeige und Speicherung auf allen Geräten. | Geplant |
| 5 | [Block 5 · Skills](#5-skills-neu-strukturieren--bestehende-turm-spezialisierungen-bereits-implementiert) | Bossjäger III/Doppel-MG III korrigieren, Luftabwehrklasse, Punkterückgabe. | Geplant |
| 6 | [Block 6 · Tutorial](#6-tutorial-als-großer-zusammenhängender-einsatz--bisheriges-tutorial-gebaut-und-teilfix-bestätigt) | Große vertonte Mission mit Generalstimme und anschließender Menüführung. | Geplant |
| 7 | [Block 7 · Leben, Gegenangriffe und Reparaturen](#7-zusätzlich-vorgeschlagen-leben-und-gegenangriffe--offen) | Leben für Soldaten/Türme, Angriffe mit Vorwarnung, Reparatur statt Verlustspirale, gleiche Regeln in allen Modi. | Geplant (neu aufgenommen) |

**Im Spiel sichtbar:** Unter **FELDNOTIZEN** in der Kommandozentrale zeigt eine
Ansicht dieselbe Einteilung – Reiter *Veröffentlicht* (was mit welchem Build
live ist) und Reiter *Was als Nächstes kommt* (die Blöcke 1–7 mit bereits
vorhandenen und offenen Punkten). Die Daten liegen in `patch-notes.mjs`; die
ausführlichen Kriterien bleiben in diesem Blatt und im Patch-Log.

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
- [ ] Host und Gast müssen eigene und fremde Türme über die gesamte Kette
  Antippen → Menü → Upgrade → Übertragung zuverlässig aufwerten können. Den
  Dreierfall und Kartenbedienung mit echten Geräten einschließlich Firefox,
  Hoch-/Querformat und realem Endless-Rückzug bis Welle 10 erneut abnehmen.
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
- [ ] Den Pfad mit 2–4 echten Geräten und realen Verbindungswechseln abnehmen.
  Die Änderungen wurden mit #289 veröffentlicht; Welle 3 wurde in diesem
  Emulatorfall nicht fertiggespielt, längere Drei-/Vierertests nutzen `four-front`.
  Produktive Rules und vollständige Browser-/Firebase-Duelle sind nicht
  abschließend abgenommen. Das mittige Anfragezentrum ist ebenfalls mit #289
  veröffentlicht; seine Grenzen stehen in [B2](#b2-anfragen-mittig-als-popup).
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
- [ ] Weitere Übergänge und tatsächliche Bedienung auf Geräten prüfen; der mit
  #289 veröffentlichte Fix ersetzt keine vollständige Abnahme.
- [x] **Wellenanfrage durch jeden Spieler mit #289 veröffentlicht:** Einstimmigkeit,
  Rücknahme, Ablehnung und Disconnect-Fencing sind für alle Modi gebaut und mit
  Hostkern, Transport-Doubles und Chromium geprüft ([B1](#b1-welle-von-jedem-anfragbar)).
- [x] **SDK-/Rules-Emulator lokal:** Gast-Wellenanfrage, Ablehnung, Rücknahme,
  Reconnect ohne alte Zustimmung und einstimmiger Start bestanden für alle fünf
  Modus-/Größenfälle mit synthetischen Teilnehmern ([IPL-0009](PATCH-LOG.md#ipl-0009--blöcke-12-lokale-firebase--und-browser-emulatorprüfungen)).
- [ ] Echte Geräteabnahme für B1 sowie weitere Messung und Verbesserung der
  Einsteigerbalance ([C](#c--multiplayer-mit-anfangscharakteren)). Bereits
  vorhandene Zweier-Balance ist in C dokumentiert.

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
- [ ] Für die Porträts bleiben Rules-Abgleich, separate Freigabe und
  Veröffentlichung sowie Geräte-/Produktionsabnahme offen. Ein nur auf dem
  eigenen Gerät gespeichertes altes Gesicht ist für Freunde nicht verfügbar;
  dann erscheint der Platzhalter. Die vorhandenen Produktions-Rules-Skripte
  enthalten den neuen Kandidaten noch nicht.
- [x] **Einladung wegklicken ohne Löschen:** Das Schließen einer vorhandenen
  Benachrichtigung löscht die Einladung nicht; der gezielte Fix ist in
  [PR #162](https://github.com/0815games/0815games.github.io/pull/162),
  Commit `d44cffa`, dokumentiert und getestet.
- [x] **Mittige Einladungsanzeige mit #289 veröffentlicht:** Partyeinladungen und
  Beitrittsanfragen teilen sich das nichtmodale Anfragezentrum mit den
  Abstimmungen. Die Karte öffnet nur die Übersicht; „Später“ löscht oder
  beantwortet nichts. Freundschaftsanfragen bleiben beim vorhandenen Hinweis
  am Freunde-Menü. Die
  sichtbare Einladung wird beim Ablehnen oder nach einem Beitritt transaktional
  mit der noch gespeicherten Fassung verglichen, damit eine zwischenzeitlich
  überschriebene Einladung nicht versehentlich gelöscht wird. Eine identische
  Neufassung ohne eindeutige Servergeneration bleibt eine Grenze; Details in
  [B2](#b2-anfragen-mittig-als-popup).
- [ ] Echte Geräte, Screenreader, produktive Dienste und Altbestände prüfen.
  Kontoübergreifend eindeutige Charakternamen einschließlich Parallelvergabe
  und Alt-Duplikaten bleiben ebenfalls offen
  ([A1](#a1-charaktername-darf-nicht-doppelt-vergeben-werden)).

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
- [ ] **Party-Roster:** Vier kompakte Karten mit Avatar, Name, Rang, Host/Team
  und Bereitschaft; 2×2, wo Platz ist. Die aktuelle Darstellung ist eine Liste.
- [ ] **Endless-Turmschimmer:** Nur freigeschaltete und tatsächlich bezahlbare
  Upgrades markieren; reduzierte Grafik erhält eine ruhige Markierung. Im
  vorhandenen Turmmenü gibt es bereits Preis- und Sperranzeigen, nicht aber
  diesen Schimmer auf dem Spielfeld.
- [ ] **XP im Kampf-HUD:** Bestätigtes Level, aktuellen/benötigten XP-Wert,
  Balken und Restmenge während des Einsatzes zeigen. Vorhandene Menü-/Report-
  Balken erfüllen dies nicht; unbestätigte Saves dürfen keinen Levelaufstieg
  vortäuschen.
- [ ] **After-Action Report:** Rangname und Abzeichen neben dem Level, bei
  Beförderung den neuen Rang zeigen. „What’s Next“ in den aufklappbaren
  Reportbereich verschieben, wichtige Ergebnisse oben lassen.
- [ ] **Zusatzwünsche:** Schussdarstellung und Fähigkeits-HUD weiter verbessern
  sowie Multiplayer-Anfragen mittig anzeigen (Details B2 und D). Vorhandene
  Schuss- und Fähigkeitsanzeigen sind dort gesondert aufgeführt.

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
- [ ] **Gewünschte Qualität:** 6–10 hochwertige, stimmige Looks im glaubwürdigen
  Spiel-/Militärstil mit einigen sauber kombinierbaren Details, ohne
  durchscheinende fremde Gesichts- oder Uniformteile, sind gegenüber der
  vorhandenen Layer-Lösung erneut zu prüfen bzw. gezielt weiterzuentwickeln.
- [ ] Vorschau, gespeicherter Avatar, Dossier, Freunde und Party-Roster müssen
  zusammenpassen; Fehl-/Altwerte erhalten sichere Platzhalter bzw. Neuauswahl.
  Freunde/Party übertragen den Avatar derzeit nicht überall; ein lokaler
  Speicher-Fallback ist kein Nachweis sicherer geräteübergreifender Speicherung.
- [ ] Passende alte Auswahl übernehmen, sonst Neuauswahl anbieten. Fortschritt,
  XP und Ausrüstung erhalten; gezielte Rules-, Geräte- und Darstellungstests.
  Block 2/3 können bis dahin sichere Platzhalter verwenden.

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
- [ ] **Entscheidung:** Luftabwehr als sechste Klasse mit eigener, auch
  außerhalb reiner Flugzeugwellen nützlicher Rolle. Mit dem ersten Punkt auf
  Spielerlevel 2 eine Klasse samt Hauptfähigkeit wählen; danach nur den eigenen
  übersichtlichen Spezialisierungsbaum anbieten.
- [ ] Alle Grundtürme bleiben für alle baubar. **Zusätzliche durch den eigenen
  Skillbaum freigeschaltete** Ausbauwege, sechs Klassenbilder, klare Touchflächen
  und Kosten-/Wirkungsvorschauen sind von den bestehenden Turm-Kits zu trennen.
- [ ] **Entscheidung:** Alte Skill-Builds einmalig vollständig zurücksetzen und
  bereits erhaltene Punkte – ausgegebene und noch freie – zur Neuwahl
  zurückgeben; Level, XP und Ausrüstung bleiben erhalten. Migration, Backup,
  Rules, doppelte Ausführung, alte/parallele Clients und Rollback prüfen.
- [ ] Solo-/Mehrspieler-Balance getrennt planen und testen; neue Skilldaten oder
  Rules nicht ohne frischen Abgleich und separate Freigabe einführen.

#### Konkrete Befunde zur bestehenden Turm-Spezialisierung

Diese Befunde stammen aus der Code- und Simulationsprüfung. Die ersten beiden
sind noch offen; der dritte ist behoben, getestet und mit #289 veröffentlicht.
Sie machen das eingebaute System nicht zu einem bloßen Konzept, und die frühere
grüne Testsuite belegte nicht jede versprochene Wirkung.

1. **Bossjäger III:** Der versprochene Bonus von 25 Vorräten für einen vom Turm
   erledigten Boss wird nicht erreicht: `applyHitEffects` kehrt bei `hp <= 0`
   zurück, bevor der spätere Bonuszweig mit genau dieser Bedingung läuft
   ([Code](tower-specialization.mjs)). Im synthetischen Simulationsvergleich
   erhielten Turmlevel 4 und 5 jeweils +70: 50 Grundbelohnung plus 20 für die
   Welle; weder `bountyPaid` noch ein `bounty`-Event erschien. Der vorhandene
   [Test](tests/tower-specialization.test.mjs) verlangt nur mindestens +25 und
   ist damit wegen der normalen Belohnung trotzdem grün.
2. **Doppel-MG III:** Die Oberfläche verspricht vollen Schaden gegen Flugzeuge;
   im neutralen Simulationstest blieb der Flugzeug-Faktor auch auf Turmlevel 5
   bei 0,6: 13,2 statt 22 Grundschaden. Die Stufenerhöhung wirkt, der angekündigte
   zusätzliche Rank-III-Effekt aber nicht.
3. **Veteranen-Rabatt in der UI – mit #289 korrigiert:** Bei einem Veteranenturm
   auf Stufe 5 verlangt die Simulation **306** statt 360 Vorräte. Vor dem Fix
   zeigte der UI-Test Preis 360 und blockierte den Kauf; danach sind Anzeige,
   Zahlung und Prestige-Rundung für eigene und fremde Türme mit Doubles geprüft.
   Das ist kein Beweis für die Ursache des gemeldeten Dreier-Turmmenüfehlers.

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
- [ ] Vollständige Firebase-/Geräteabnahme aller Größen/Modi und weitere
  Einsteigerbalance stehen aus. Wellenanfragen durch jeden Spieler und das
  mittige Anfragezentrum wurden mit #289 veröffentlicht, aber noch nicht auf
  echten Geräten vollständig abgenommen.
- [x] **Charakter und Social:** Serverseitig bestätigtes Löschen und Bereinigung
  bekannter Freundschafts-/Einladungsdaten wurden mit PR #287 veröffentlicht.
- [x] Abmeldung und Login-Meldung nach der Entlassung sind umgesetzt und
  mit zwei Chromium-Kontexten sowie Auth-/RTDB-Emulator geprüft; sie wurden
  mit #289 veröffentlicht.
- [ ] Kontoübergreifend eindeutige Namen und die vom Betreiber gemeldeten
  weiteren Freundeslistenprobleme bleiben zu prüfen; der konkrete Neunamenfall
  wurde bereits gezielt adressiert und im Emulator geprüft. Eine reale
  Mehrgeräte-Abnahme steht aus; alte Daten und parallele Geräte sind nicht
  vollständig durch die lokale Bereinigung abgedeckt.
- [x] **Wartung und Admin:** Wartungsanzeige und separater Admin-Bereich sind
  veröffentlicht; der Betreiber bestätigte Darstellung, Admin-Login und
  Wartungsstatus auf dem iPhone. Nach #289 wurde die Wartung beendet und der
  öffentliche Status `open` geprüft. Ein zuvor beobachteter Admin-Timeout im
  ersten Netz ist nicht abschließend erklärt.
- [ ] Der authentifizierte Rules-Abgleich beruht auf der Betreiberangabe, nicht
  auf einem unabhängigen Abruf hier; für spätere Änderungen erneut prüfen.
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
- [ ] **Durchsetzung serverseitig wirksam:** Solange die begleitenden Rules **nicht veröffentlicht** sind, kennt der Server den Pfad nicht. Der Client meldet das sauber als „nicht unterstützt“, die Charaktererstellung läuft weiter wie bisher, und als Rückfall wird der öffentliche Freundes-Suchindex gelesen (nur bestmöglich: er sieht nur Konten, die je eine Liste veröffentlicht haben). Erst mit veröffentlichten Rules ist die Eindeutigkeit gegen alte/manipulierte Clients abgesichert; parallele Tabs, Offline-Warteschlangen und Wiederholungen sind damit abgedeckt, Konfliktmigration noch nicht.
- [~] **Vertrauensgrenze: Kandidat vorbereitet, Veröffentlichung offen.** `firebase/character-name-candidate.mjs` baut aus der gepinnten Referenz einen Rules-Kandidaten: höchstens ein Eintrag pro Schlüssel, nur mit der eigenen UID, Löschen nur durch den Inhaber; gefälschte, zu kurze/lange und anonyme Einträge werden abgelehnt. Der Kandidat ist **nicht** in den veröffentlichbaren Kandidaten eingestellt (Verhaltensregel des Veröffentlichungsschutzes) und wird im Datenbank-Emulator in zwei Läufen geprüft – mit und ohne Index. **Beide Emulatorläufe sind in CI grün** ([PR #293](https://github.com/0815games/0815games.github.io/pull/293)). Drei Fehler am Kandidaten wurden dabei gefunden und behoben: ein Regex, den RE2 nicht kennt (blockierte alles, war aber nur mit einem Positivfall zu sehen), ein fehlendes `$other`, das Zusatzfelder durchließ, und ein `$other`, das mangels benannter `uid`/`name`-Knoten wieder alles blockierte. Der Emulator beantwortet die ersten Anfragen zudem vor dem Wirken der hochgeladenen Regeln; der Test wartet dieses Startfenster ab. Gemerkt: eine `assertFails`-Prüfung allein beweist nichts – sie besteht auch gegen eine Regel, die alles ablehnt. Firebase Rules können eine Unicode-Normalisierung nicht selbst nachbilden: Sie erzwingen den Schlüssel, nicht seine Ableitung. Alte oder manipulierte Clients sind damit erst mit veröffentlichten Rules abgedeckt, und auch dann nicht vollständig. Kein zusätzlicher kostenpflichtiger Dienst oder Abrechnungsplan ohne Freigabe.
- [x] **Offline-Vorprüfung vorbereitet:** Das lokale Skript `scripts/audit-character-names.py` zählt Konflikte aus einem explizit angegebenen Export einschließlich nicht indizierter Profile und gibt ohne optionalen vertraulichen Bericht keine Namen/IDs aus. Der Vergleich nach NFC und Unicode Default Case Folding ist ein nicht freigegebener Vorschlag; nur synthetische Fixtures wurden geprüft ([IPL-0022](PATCH-LOG.md#ipl-0022--block-2-datenschutzschonende-namens-vorprüfung), [Anleitung](firebase/CHARACTER-NAME-AUDIT.md)).
- [ ] **Bestandsdaten vor Änderung sichern und prüfen:** Eine autorisierte Bestandsaufnahme muss auch Konten erfassen, die nie einen Suchindex erstellt haben. Das Offline-Skript beweist nicht, dass ein Export vollständig oder aktuell ist. Mögliche Alt-Duplikate als Konflikte behandeln und den Namen für Neuanmeldungen sperren, bis sie geklärt sind. Keine stillschweigende Löschung, automatische Umbenennung oder Verlust von Fortschritt. Wer einen kollidierenden Namen behalten darf und wie die anderen einen neuen wählen, wird nach der Bestandsaufnahme gesondert abgestimmt. Solange Alt-Duplikate bestehen, ist globale Eindeutigkeit noch nicht erreicht.
- [~] **Lebenszyklus: Löschung ist verdrahtet, Altbestand weiter offen.** Bei bestätigter Charakterlöschung wird eine in dieser Sitzung reservierte Reservierung mit derselben atomaren Schreiboperation freigegeben – bewusst nur dann, damit der Pfad unter den heutigen Rules die Löschung nicht blockiert. Freundes-Suchindex, Anzeigename und Bestenlisten bleiben unverändert. Eine nötige Umbenennung, die Behandlung verwaist/unbestätigter Reservierungen und der Umgang mit Alt-Duplikaten bleiben offen.

**Abnahme:** Gleichzeitige Registrierung zweier Konten mit identischem beziehungsweise unterschiedlich geschriebenem gleichem Namen ergibt höchstens einen bestätigten Gewinner; der andere erhält eine verständliche Meldung. Bestehende Profile und Freundschaften bleiben erhalten. **Teilweise erbracht:** Reservierung, Meldung und Löschfreigabe sind gebaut und lokal mit 10 Unit-Fällen geprüft (Gesamtlauf 1012 bestanden, 1 absichtlich übersprungen, 0 fehlgeschlagen); die Regeln des Kandidaten sind im Datenbank-Emulator grün; die serverseitige Durchsetzung wartet auf die Rules-Veröffentlichung, und die Bestandsaufnahme steht weiter aus. Emulator-/Rules-Tests decken auch manipulierte Schreibversuche, alte Clients, Offline/Retries, Konfliktmigration und Löschung ab. Die erforderliche komplette Rules-Änderung wird erst nach frischem Export, Backup, Vergleich und separater Freigabe veröffentlicht.

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
- [ ] **Abnahme:** Echte 2–4 Geräte, tatsächliche Netzwechsel, vollständige Welle 3 sowie Duelle im kombinierten Browser-/Firebase-Pfad prüfen. Das einheitliche mittige Popup ist veröffentlicht; seine eigene Abnahme bleibt in B2 offen.

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
- [ ] **Abnahme:** Host und Gäste auf 2–4 echten Geräten und mit tatsächlichen
  Verbindungswechseln testen; Screenreader und Firefox/Safari separat prüfen.
  Vollständige Firebase-Browser-Duelle, Mischversionen und produktive Dienste
  sind nicht abgenommen. Die Implementierung ist mit #289 veröffentlicht.

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
- [ ] Soldaten- und Turmschüsse visuell überarbeiten: kürzere, gerichtete Spuren statt dominanter Dauerlinien, gut erkennbare Mündungsblitze und Treffer. MG, Kanone, Flak und Scharfschütze sollen sich in Form/Timing nachvollziehbar unterscheiden und zum bestehenden illustrierten Stil passen.
- [ ] Viele gleichzeitige Schüsse dürfen Gegner, Wege und Warnungen nicht verdecken. Bei Zoom, auf kleinen Handys und im Mehrspieler-Snapshot sollen sie konsistent sichtbar bleiben; Effekte begrenzen, damit Bildrate und Datenmenge nicht ausufern. Reduzierte Bewegung, Blendung und Kontrast beachten.
- [ ] Zunächst **nur Darstellung** ändern: Treffer, Schaden, Reichweite, Schussfrequenz und Belohnungen bleiben unverändert. Die Darstellung darf keine zusätzlichen oder nachträglichen Treffer erzeugen.

### D2. Fähigkeit als Teil des Gameflows

- [x] Der vorhandene Button zeigt schon den Fähigkeitsnamen, „bereit“, einen
  Cooldown in Sekunden oder „kein Skill“; auch Feld-Feedback existiert. Die
  gewünschte neue Position, Symbolik und Erklärung sind in der geforderten
  Form noch offen.
- [ ] Den derzeit unten in den Kampfsteuerungen stehenden Fähigkeitsbutton als gut erreichbares HUD-Element **innerhalb des sichtbaren Spielfeldrahmens** platzieren, auf dem Handy am Rand in Daumennähe statt unter dem Feld. Nicht an der beweglichen Figur „mitwandern“ und weder Karteingaben noch Wellenanfragen verdecken.
- [ ] Symbol **und** Name der gewählten Fähigkeit; klarer Zustand „bereit“, sichtbarer Cooldown mit Sekunden und eine verständliche Ursache für „nicht nutzbar“. Ohne gewählte Fähigkeit erklären, wo sie freigeschaltet/ausgewählt wird, statt einen scheinbar defekten Button zu zeigen.
- [ ] Eine dezente, einmalige Einführung beim ersten sinnvollen Einsatz und ein kurzes, zum Fähigkeitstyp passendes Feedback auf dem Feld. Ein Tap löst weiterhin direkt den bestehenden Befehl aus; keine zusätzliche störende Bestätigung, keine Mehrfachauslösung bei Netzverzögerung.
- [ ] Touchziel mindestens 44 × 44 px, sichere Geräteabstände, Tastatur/Fokus, Screenreader, Übersetzungen und reduzierte Bewegung. Bei verletztem/ausgefallenem Soldaten muss Block E den Zustand eindeutig anzeigen.

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

## Gemeinsame Freigabe

Neue Punkte bleiben offen, bis ihr jeweiliger Code, automatisierte Tests und passende Geräte-/Mehrspielertests abgeschlossen sind. Firebase-Tests verwenden zunächst Emulatoren und synthetische Daten. Produktive Rules und Migrationen benötigen einen aktuellen Sicherheits-, Kompatibilitäts- und Backup-Check. Nach sinnvollen geprüften Schritten soll die Website veröffentlicht und das Spiel wieder für Tests geöffnet werden; dieser Plan schaltet die Wartung nicht selbst.
