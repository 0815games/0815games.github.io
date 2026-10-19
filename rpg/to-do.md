# To-do – Chroniken der Schattengruft

## Inventarabschluss – Patch 2026-10-19
- [ ] Inventardetails und Vergleich im Codespace implementiert: Antippen ohne Aktion, Ausrüsten/Nutzen separat, grün/rot/neutrale Differenzen zum gleichen Platz. 23 Assertions mit DOM-/Aktions-Mocks und 1027 bestehende Inventarprüfungen bestanden; Syntaxprüfungen der drei Module und Diff-Prüfung ohne Fehler. Push und Deploy zum Prüfzeitpunkt sowie echte Geräte-/Speicherabnahme offen. Danach bestehende Planung fortsetzen; keine anderen Aufgaben damit abhaken.

Stand: 2026-10-16. Zentrale Arbeitsplanung und Masterplan. Offene Punkte nicht mit bestandener Geräteabnahme gleichsetzen.

## Arbeitsweise und Priorität
- Bei Unklarheit über den nächsten Schritt zuerst diese Datei lesen und den aktuellen Repository-Stand prüfen.
- S-Einträge = Stabilisierung; sie haben grundsätzlich höhere Priorität als T-Einträge.
- T-Einträge = Bugs und Wünsche. Bestehende IDs T01–T15 beibehalten; nicht umnummerieren oder durch S-Einträge ersetzen.
- Innerhalb einer Prioritätsstufe von einfach nach aufwendig arbeiten, soweit Abhängigkeiten und Datensicherheit dies zulassen. Schätzung vor Umsetzung am aktuellen Code prüfen; Abweichungen gemeinsam abstimmen.
- Ein akuter Startblocker, drohender Datenverlust oder Sicherheitsfehler darf die Reihenfolge unterbrechen. Grund, Umfang und Wiederaufnahme hier festhalten; keine stillschweigende Umpriorisierung.
- Pro Push ein klar begrenztes Thema; größere Aufgaben in a/b/c teilen. Kein Komplett-Neuschreiben auf Verdacht und keine pauschale Erfolgsgarantie.
- Manuell ergänzte Bugs nicht löschen oder stillschweigend umdeuten; gemeinsam klären. Widerlegte Erfolgsaussagen sichtbar berichtigen, Historie erhalten.
- Umsetzung, lokale Prüfung, Deploy und echte Browser-/Geräteabnahme unterscheiden. Nicht allein wegen eines Pushs abhaken.
- Diese Datei plant Aufgaben. rpg/change.log bleibt die einzige aktive RPG-Änderungshistorie. Keine neuen Changelog-Einzeldateien anlegen.
- Nach jeder Änderung, jedem Fix und Patch rpg/change.log detailliert ergänzen: Anlass, betroffene Dateien, tatsächliche Änderung, Version/Build bzw. Commitbezug, Tests und offene Grenzen. Keine erfundenen Tests oder Zeitstempel.
- Bei abgeschnittenen Dateiinhalten niemals eine unvollständige Datei zurückschreiben. Vollständigen Inhalt beschaffen oder den Dokumentationsblocker ausdrücklich melden; fehlende Historie nicht erfinden.
- Reine Planungs-/Dokumentationsänderungen erhöhen die Spielversion nicht. Dieser Masterplan setzt noch kein S-Paket um.

## Masterplan – verbindlicher Einstieg

### Ausgangspunkt und Rückkehrpunkt
- Backup-Branch: `Backup`, gesicherter Commit `4bf3a5f49c15da972b2ddbe1b71f9936d116dfe5`. Nicht für laufende Entwicklung verwenden oder automatisch mit main überschreiben.
- Zusätzliches Backup vor S01a: `Backup-vor-S01a-2026-10-16`, Commit `902410b88c7a2317cfbd7ef9e76b97f5d288a30c`.
- Backup umfasst versionierte Repository-Dateien und erreichbare Git-Historie, keine externen Firebase-Spielstände.
- Letzter hier berücksichtigter Spielcode-Fix: `42f7b3979d10bdc39bb1c9a128a4b224ddb20fc2` (S01b: Ausrüstungswechsel/Ablegen in main.js). Angezeigte Spielversion weiterhin v0.5.26; kein eindeutiger Build-Identifier implementiert.
- Auditbefunde sind Arbeitsgrundlage, keine Behauptung einer vollständigen Prüfung aller Dateien oder echten Browser-/Firebase-Abnahme. Vor jedem Teilfix konkreten aktiven Aufrufpfad und Befund erneut prüfen.

### Sofortiger Arbeitsstand
- [ ] Fehlende detaillierte Changelog-Einträge der letzten Änderungen nachtragen; vorhandene Historie unverändert erhalten. Insbesondere T02-Nachfixe, Changelog-Viewer, Startfehler/Syntaxkorrektur, schaltbare Diagnose, Bewegungsfix, S01a und Backup mit ihren tatsächlich belegten Prüfständen dokumentieren. Unbekannte Details offenlassen. Der S01b-Nachtrag ersetzt diese restliche Aufarbeitung nicht.
- T02-Nutzerabnahme am 2026-10-16 um 16:41 CEST eingegangen: Fix und Abstieg auf dem iPhone problemlos. Zuvor drei Ebenen einschließlich Boss ohne bemerkte Probleme. Desktop/Tastatur sowie Abbruch-/Sonderfälle nicht pauschal abgenommen.
- S01a ist veröffentlicht (`6370e26d1e62fb8e856457284591424e2978d2f8`); vollständige Aufruferprüfung, Dokumentation und spezielle Geräteabnahmen weiterhin offen.
- S01b-Code und Dokumentation abgeschlossen; echte Geräte-/Speicherabnahme und Entscheidung zur unbeabsichtigten CSS-Abweichung offen, siehe S01b. Kein vollständiges Abnahmehäkchen.
- Nächster Schritt: S01b-Handyprüfung voller/teilvoller Tasche und Speichern/Neuladen sowie CSS-Abweichung klären. Danach S01c-Regel für Truhen bei Platzmangel festlegen; vor weiterer Umsetzung offene S01a-/Dokumentationspunkte berücksichtigen.
- Standardreihenfolge: S01 → S02 → S03 → S04 → S05 → S06 → S07. Kleine notwendige Vorarbeiten ausdrücklich im jeweiligen Paket dokumentieren, nicht unbemerkt mehrere Pakete zusammen umbauen.
- T-Bugs bei sachlicher Überlappung im zugehörigen S-Paket mitprüfen; Wünsche/Erweiterungen erst nach den benötigten S-Abnahmen. S-Paketabschluss hakt verknüpfte T-Aufgaben nicht automatisch ab.

### Ablauf für jede Teilaufgabe
1. Diese Datei und den aktuellen Stand lesen; Ziel, Fehlernachweis, Abhängigkeiten und Risiken festhalten.
2. Engen Umfang und Abnahmekriterien bestimmen. Unklare Balance-, Speicher- oder Bedienregeln vorher abstimmen.
3. Fehler mit Test nachstellen; dabei aktive Integration und Aufrufer untersuchen, nicht nur eine isolierte Hilfsfunktion.
4. Kleinsten vollständigen Fix schreiben; keine konkurrierende zweite Implementierung daneben setzen. Ersetzte Altlogik samt Handlern wirklich entfernen.
5. Syntax-, Funktions- und relevante Integrationstests durchführen. Tests mit Mocks ausdrücklich so benennen.
6. Vollständigen konkreten Schreibumfang zur Freigabe vorlegen; erst nach Freigabe veröffentlichen.
7. Gepushten Inhalt/Commit prüfen; Deploy davon getrennt beurteilen. Changelog detailliert ergänzen und Aufgabe mit Ergebnis/Commit/Prüfstatus aktualisieren; bei separatem Schreibvorgang gesonderte Freigabe beachten.
8. Echte Abnahme mobile-first, danach Desktop. Bei fehlender Umgebung oder Gerätenutzung Grenzen nennen und Aufgabe als Abnahme offen führen.
9. Bei Regression stoppen: reproduzieren, eng begrenzt korrigieren oder gezielten Rückweg abstimmen. Backup nicht überschreiben und keine Spielstände löschen.

### Statusregeln
- `[ ]` = offen, in Arbeit oder noch nicht vollständig abgenommen; Status zusätzlich in Worten festhalten.
- `[x]` bei neuen S-Teilaufgaben erst nach erfüllten definierten Abnahmekriterien. Falls nur Code fertig: ausdrücklich `implementiert – Abnahme offen`, nicht als vollständig erledigt markieren.
- Bestehende historische T01-/T03-Häkchen bedeuten nur den damals dokumentierten Umsetzungsstand; die dort genannten offenen Geräteabnahmen bleiben offen.
- Pro Teilaufgabe dokumentieren: Status / aktueller Arbeitsschritt / Commit / lokale Tests / Deploy / Nutzerabnahme / Restfehler / nächster Schritt.

## S-Aufgaben – Stabilisierung mit höherer Priorität

### S01 – Inventar, Ausrüstungswechsel und Truhen atomar absichern
Status: teilweise implementiert, nicht vollständig abgenommen. Keine andere funktionale S-Abhängigkeit; bestehende Daten und Aufrufer zuerst prüfen.
- [ ] S01a – Inventarvertrag festlegen und absichern: positive ganzzahlige Mengen, bekannte Item-IDs, Stapel-/Platzgrenzen. Fehlgeschlagenes Hinzufügen/Entfernen darf keine Teiländerung hinterlassen; eindeutiges Ergebnis mit Fehlergrund. Sämtliche aktiven Aufrufer vor Vertragsänderung erfassen und kompatibel anpassen.
  - Implementierung veröffentlicht: `6370e26d1e62fb8e856457284591424e2978d2f8`; atomare Einzeloperationen, boolesche Rückgaben erhalten, detaillierte try-Funktionen und wiederholbarer Node-Test. Lokale integrierte Suite: 1027 Prüfungen mit Item-Fixtures bestanden; frühere größere Vergleichssuite separat, nicht addieren oder als Browserprüfung ausgeben. Vollständige Aufrufer-/Geräteprüfung und eigener Changelog-Nachtrag offen.
- [ ] S01b – Ausrüstungswechsel vollständig auf Kopie berechnen und erst als Ganzes übernehmen; volle Tasche und durch den Wechsel frei werdenden Slot berücksichtigen. Ablegen ebenso auf Erfolg prüfen. Kein verlorener oder duplizierter Gegenstand.
  - Status: implementiert und dokumentiert – echte Abnahme offen. Codecommit `42f7b3979d10bdc39bb1c9a128a4b224ddb20fc2`, veröffentlicht am 2026-10-16 16:55:10 CEST laut Git. Kein neuer Versionsstand; weiterhin v0.5.26.
  - Direkter Ersatz von equipItemFromInv()/unequipSlot() in rpg/js/main.js, keine neuen globalen Handler. Erst neue Ausrüstung auf Kopie entnehmen, dann bisherige zurücklegen; nur vollständiges Ergebnis übernehmen. Ablegen bei Fehler ohne Datenverlust abbrechen. Preise, Werte, Balance und Speicherablauf nicht geändert.
  - Tests: 31 lokale Prüfungen mit tatsächlichen Ersatzfunktionen und hashgeprüftem S01a-Code, aber Item-/Sound-/Log-/HUD-Stubs bestanden. Syntaxprüfung des vorbereiteten Gesamtcodes bestanden. Testannahme zur konstanten Taschenbelegung korrigiert: ein zuvor leerer Ausrüstungsplatz darf die Taschenbelegung verringern. Kein echter Browser-/Firebase-/Speicher-/Neuladetest; Deployment nicht separat geprüft.
  - Veröffentlichter Diff nachgelesen: zusätzlich unbeabsichtigt Fähigkeitenbutton-CSS in renderAbilities() von text-align:center auf text-align:left geändert. Tatsächlicher main.js-Blob `3a5ebae4bb457886048b9615f401bcd1deb1ea59`; vorher genannter Zielblob `14e7dfb4c1e52406a1fd38c85ec8b0c20528ee66` beschreibt nur den lokalen Zwei-Funktionen-Entwurf, nicht die veröffentlichte Gesamtdatei. AFK und Level-Up-Ausgabe unverändert. Rücknahme oder ausdrückliche Übernahme des CSS separat klären; keine versteckte Korrektur.
  - Changelog: detaillierter Eintrag unter v0.5.26 / S01b in rpg/change.log mit diesem Dokumentationspaket. Andere historische Lücken bleiben offen.
  - Noch erforderlich: bei voller Tasche tauschen, bei voller Tasche Ablegen ablehnen, mit Platz ablegen; Gegenstandsmengen und Werte prüfen, manuell speichern und neu laden; mobile-first, danach Desktop. Die frühere allgemeine Ingame-Rückmeldung des Nutzers liegt vor dem S01b-Push und zählt nicht als S01b-Abnahme.
- [ ] S01c – Truhenbelohnung ohne Verlust: bei Platzmangel Item erreichbar erhalten. Vorher festlegen, ob Gold separat entnommen werden darf oder gesamte Entnahme atomar ist. Truhe nicht nach fehlgeschlagener Vergabe unbemerkt verbrauchen.
Abnahme: leere/volle Tasche, Teilstapel, mehrere Stapel, Mengenfehler, unbekannte IDs, Ausrüstungstausch und Truhenentnahme; Fehlerzustand vor/nach Aktion unverändert, Erfolgsmengen exakt. Reale UI-Prüfung und Erhalt nach Speichern/Neuladen.
Bezug: T10/T11; keine Preis- oder Balanceänderung.

### S02 – Spielstandschema, Migration und kontrolliertes Laden
Status: offen. Nach S01; reine Analyse/Fixtures bei Bedarf vorher möglich.
- [ ] S02a – Persistente Daten, Laufzeit und UI trennen; Schema-Version und erlaubte Standardwerte definieren. Kampf-Speicherregel ausdrücklich klären, keine halb wiederherstellbaren Kämpfe.
- [ ] S02b – Geladene Spieler-, Inventar-, Ausrüstungs- und Weltdaten validieren; bekannte Altstände gezielt migrieren. Fehlend, leer, numerisch indiziert, dünn besetzt und beschädigt unterscheiden. Ungültige nicht leere Daten nicht als besiegte Ebene behandeln. Keine automatische Neuerzeugung/Löschung bestehender Fortschritte ohne abgestimmte Regel.
- [ ] S02c – Breites Object.assign(state, data) durch kontrollierten Aufbau ersetzen; Laufzeitreste bei Slotwechsel zurücksetzen. Defekten Slot verständlich sperren, übrige Slots weiter anzeigen. Unbekannte neuere Schemaversion nicht überschreiben.
Abnahme: neue und alte gültige Spielstände, fehlende Listen, Objektlisten, echte Array-Lücken/null-Einträge, ungültige Werte, Slotwechsel aus verschiedenen Zuständen, beschädigter Einzelslot. Migrationswiederholung darf Daten nicht weiter verändern.
Bezug: Bewegungsfix `4bf3a5f49c15da972b2ddbe1b71f9936d116dfe5`; Kompatibilitätswrapper erst entfernen, wenn sein Ersatz nachweislich greift.

### S03 – Tod, Vorbereitung und Neustart als explizite Übergänge
Status: offen. Benötigt S01/S02.
- [ ] S03a – Erlaubte Phasen und Übergänge definieren: Auswahl, Erkundung, Kampf, Abschluss/Belohnung, Tod, Vorbereitung, Ebenenwechsel. Sitzung/Verbindung als übergeordnete Sperre berücksichtigen. UI zeigt Zustand nur an.
- [ ] S03b – Todesverarbeitung aus Speicherwrapper/DOM-Sichtbarkeit lösen; Goldtransfer, Ausrüstungsverlust und Rücksetzungen genau einmal anwenden. Wiederholtes Speichern/Rendern darf Tod nicht erneut auslösen.
- [ ] S03c – Vorbereitung und Run-Start explizit abschließen; laufende Käufe beachten. Kaufzähler und Resetregeln unabhängig vom bloßen Bestand definieren; Neuladen setzt Run-Limits nicht zurück. Fehler erhält wiederaufnehmbaren Zustand.
Abnahme: Tod, Doppelauslösung, Abbruch/Neuladen während Vorbereitung, gespeicherter Kauf, Kauf-/Startfehler, Neustart ohne Kauf, Erhalt permanenter Werte, keine doppelte Goldübertragung.
Bezug: T01, T06, T10–T12; gewünschte Limits nicht stillschweigend ändern.

### S04 – Einheitlicher Speicherablauf und asynchrone Aktionskontexte
Status: offen. Nach S03; Schnittstellen mit S02/S03 abstimmen.
- [ ] S04a – Speicherzuständigkeit bündeln: definierter Snapshot, Validierung, Sitzungsprüfung, Schreiboperation, eindeutiges Ergebnis. Speichern erzeugt keine versteckten Spielaktionen. Wrapper schrittweise ersetzen, nicht blind löschen.
- [ ] S04b – Asynchrone Aktionen an Konto, Slot, Sitzungsgeneration und Vorgangs-ID binden. Schreibziel/Snapshot vorab festlegen; verspätete Ergebnisse nicht in anderen Helden übernehmen. Ein ignoriertes Ergebnis bedeutet nicht, dass ein bereits erfolgter Serverschreibvorgang rückgängig ist.
- [ ] S04c – Fehlermeldungen und Wiederholungen vereinheitlichen: Erfolg nur bei bestätigtem Erfolg, insbesondere AFK-Abmeldung. Käufe/Belohnungen vor doppelter Ausführung absichern; Firebase-Regeln und gegebenenfalls Transaktionen/atomare Updates für den konkreten RTDB-Pfad prüfen. Keine pauschale Anti-Cheat-Garantie.
Abnahme: Offline/Timeout, verweigerter Schreibzugriff, erneute Anmeldung, Slotwechsel/Logout während Kauf oder Belohnung, doppelte Eingabe, Wiederholung, normale Speicherung und Abmeldung. Keine falsche Erfolgsmeldung oder falscher Empfänger.
Bezug: Rangliste und Bossbeute als abhängige Abläufe; funktionierende Schutzmaßnahmen erhalten.

### S05 – Zentrale Dialog- und Eingabeverwaltung
Status: offen. Nach S04; akute Dialogblocker vorher eng begrenzt reparierbar.
- [ ] S05a – Ein Dialogbesitzer mit eindeutiger Priorität, Öffnen/Schließen, Unterbrechung und Fokus-Rückgabe. Pro Vorgang ein Dialog; Inhalte und Ergebnisse von Zustand/Steuerung trennen.
- [ ] S05b – Touch und Tastatur auf dieselben fachlichen Aktionen führen. Reihenfolge: Sitzungssperre → aktiver Dialog → Texteingabe → Menü → Kampf/Erkundung. Konkurrierende globale Handler schrittweise entfernen; kein Umgehen von Sperren über zweite Eingabepfade.
- [ ] S05c – Treppe, Changelog, Hilfe, Audio, Bossbeute, Level-Up, Rüstkammer und mobile Menüs gemeinsam testen. Escape, Tab/Shift+Tab, Enter/Leertaste, Zahlen und Fokus eindeutig; Chronik-/Questnavigation fachlich klären.
Abnahme: T02-Symbol-Dialog nur einmal, Abbrechen/erneutes Betreten, genau ein Ebenenwechsel, Changelog per Touch/Tastatur, Texteingaben ohne Spielaktion, keine Bewegung durch Dialoge, sichere Rückkehr zur Karte.
Bezug: T02, T05, T08; T07/T08-Erweiterungen bleiben gesonderte Wünsche.

### S06 – Kampfaktionen, Belohnungen und Darstellung entkoppeln
Status: offen. Benötigt S01–S05.
- [ ] S06a – Gemeinsame Aktionsberechtigung für Standardangriff, Zauber, Tränke, Flucht und Klassenfähigkeiten. Animationen dürfen keine unabhängige fachliche Zweitsperre erzeugen; ungültige Aktion kostet keinen Zug.
- [ ] S06b – Sieg, Tod, EP, Mehrfach-Level-Up und Bossbeute in eindeutigem Ablauf koordinieren; Effekte beobachten Ergebnisse statt Kampfhandler mehrfach zu ersetzen. Vor Änderungen Cooldown-Zählweise, Zugkosten und Abschlussdauer abstimmen.
- [ ] S06c – Tatsächliche statt nur theoretische Heil-/Manamengen melden; Buttons, Ressourcen, Cooldowns und Effekte aus demselben Ergebnis aktualisieren. Doppelklick und verspätete Effekte berücksichtigen.
Abnahme: alle Klassen und Aktionen, fehlendes Mana/Tränke, voller TP-/MP-Stand, Gift-Kill, Flucht, letzter Treffer, Boss-Sieg mit Level-Up, Tod während Aktion, Hintergrund/Resize. Keine Doppelaktion, überdeckte Auswahl oder unbemerkte Balanceänderung.
Bezug: T07, T08, T13; Manatrank-Zugkosten gesondert klären.

### S07 – Altmodule, Layout und reproduzierbare Gesamtprüfung bereinigen
Status: offen. Nach funktionaler Stabilisierung S01–S06; Inventarisierung vorher zulässig.
- [ ] S07a – Aktiven Importgraphen und Zuständigkeiten dokumentieren; Altmodule mit anderem Schema kennzeichnen. Entfernen erst nach Referenzprüfung und Regressionstests. Keine unbeteiligten Projekte im Repository anfassen.
- [ ] S07b – Responsive Regeln, Scrollbereiche und Fokusdarstellung bündeln; versteckte Animationen pausieren und große DOM-Beobachter durch gezielte Ereignisse ersetzen, wo ihr Ersatz abgesichert ist. Mobile-first, kleine Höhen und lange Texte.
- [ ] S07c – Wiederholbare Integrationstests, eindeutige Build-Kennung zusätzlich zur Spielversion, schaltbare Diagnose und detaillierte Changelog-Pflege als feste Arbeitsgrundlage. Gesamtabnahme auf Handy und Desktop; fehlende Umgebungen offen ausweisen.
Abnahme: reproduzierbarer Start, keine fehlenden Imports, Kernabläufe aus der Testmatrix, kein Verlust vorhandener Funktionen, nachvollziehbarer Build/Commit und keine behauptete Vollprüfung ununtersuchter Dateien.
Bezug: T04, T09, T14; T15-Grafikausbau erst danach und gesondert.

## Gemeinsame Regressionstest-Matrix
- Neuer Held → speichern → neu laden; bestehender Held → bewegen → Kampf → speichern → neu laden.
- Volle Tasche → Ausrüstung tauschen; volle Tasche → Truhe: kein Gegenstandsverlust.
- Letzter Gegner → ein Treppendialog → eine Ebene; Hier bleiben → weggehen → erneut betreten.
- Boss-Sieg mit Level-Up → genau eine korrekte Belohnung und alle Auswahlen erreichbar.
- Tod → Vorbereitung → Kauf → Neustart → Neuladen: Gold, Ausrüstung und permanente Werte korrekt.
- Netzwerkfehler beim Kauf/Speichern; Sitzungspause; Slotwechsel/Logout bei laufendem Vorgang.
- Changelog/Hilfe/Menüs per Touch und Tastatur; kleine Höhe, lange Namen, Hoch-/Querformat.
- Pro Paket relevante Zeilen durchführen; vollständige Matrix spätestens vor Abschluss S07/T14. Lokale Mocks, echter Browser, Firebase und Nutzergerät getrennt protokollieren.

## T-Aufgaben – Bugs und Wünsche

### Historisch umgesetzt, Geräteabnahme teilweise offen
- [x] ~~T01 – Kaufbestätigung unterscheiden: Heil-/Manatränke direkt kaufen; bei Ausrüstung weiterhin bestätigen. Doppelkäufe während laufender Speicherung verhindern.~~ — umgesetzt am 2026-10-16 12:16 CEST in v0.5.20, Commit `40ab45c0085504b5a2c8a7c49bc659535ef1e186`. Code-Push und 66 lokale Modellprüfungen bestanden; echte Browser-/Firebase-Abnahme noch offen.
- [x] ~~T03 – Desktop-Kampffenster verkleinern: sinnvolle Maximalmaße, weniger Leerraum, lange Inhalte weiterhin erreichbar.~~ — umgesetzt am 2026-10-16 12:31 CEST in v0.5.22, Commit `dc3bcc99a8091b58b874258e6e6106672b683655`. Entscheidung: maximale Kampffensterbreite 900 px; Desktop-Padding 16 px, Figuren 112 px, Aktions-/Fähigkeitenleiste maximal 720 px. Mobile und kompakte Höhendarstellung unverändert. Code-Push und Syntaxprüfung bestanden; echte Browser-/Firebase-Abnahme noch offen.

### T02 – Handyabstieg bestätigt; weitere Abnahmen offen, Historie erhalten
- [ ] T02 – Treppendialog: ausschließlich ein Fenster mit Symbolen. „⬇️ Absteigen“ zuerst und vorausgewählt, „🚪 Hier bleiben“ bricht ab. Alte symbollose Abfrage vollständig entfernen; mobiles Layout innerhalb des Sichtbereichs, keine rechts abgeschnittenen Inhalte. Ein bestätigter Abstieg löst genau einen Ebenenwechsel aus.
  - Ursprüngliche Aufgabe: Schaltflächen umgekehrt anordnen; vor Umsetzung klären, ob „Abstieg immer vorgewählt“ Wunsch oder Fehler ist. Entscheidung: Absteigen zuerst und vorausgewählt.
  - Historische Umsetzung 2026-10-16 12:25 CEST, v0.5.21, Commit `cb6a2b86450aecbf2eaad9799df4f4614aa838b0`; 21 lokale Modellprüfungen berichtet, echte Abnahme offen.
  - Historischer Nachfix 2026-10-16 12:45 CEST, v0.5.23, Commit `2a0d4ff5984ee04aaa6226654e156f34ed9c3fb1`. Damals dokumentierte Aussage „alte doppelte Treppenabfrage entfernt; nur der neue Dialog bleibt; mobiles Layout repariert“ wurde durch Nutzerprüfung widerlegt. Nicht als Erfolg weiterführen: alte Handler blieben aktiv, Entfernung im neuen Modul lag hinter vorzeitigem return.
  - Aktueller Codefix: Commit `d59d1b55175a0ce354c9d274f74807b6061456ab`. Alte Dialogerzeugung, Treppen-CSS und Handler aus journey-ui.js entfernt; alleiniger Symbol-Dialog und Ablauf in stair-confirm.js. Spielversion weiterhin v0.5.26.
  - Prüfstand: Syntax beider Dateien und 17 lokale DOM/API-Modellprüfungen bestanden. Keine vollständige Simulation aller anderen Eingabemodule, kein echter automatisierter Safari-/Firebase-/Layouttest. Nutzer bestätigt am 2026-10-16 16:41 CEST den Fix und problemlosen Abstieg auf dem iPhone. Desktop-/Tastaturintegration und gesonderte Abbruch-/Sonderfälle bleiben offen; Bezug S05.

### Offene T-Aufgaben – innerhalb der Stufe einfachere zuerst
- [ ] T04 – Helden-/Gegnerkarten im Begegnungsfenster dynamisch in der Höhe gestalten. Unnötiges Scrollen innerhalb dieses Bereichs vermeiden; lange Namen und kleine/querformatige Displays berücksichtigen. Problem anhand eines aktuellen Screenshots nachstellen.
- [ ] T05 – Enter und Leertaste konsistent: fokussierte Aktionen bestätigen; normaler Angriff im passenden Kampfkontext auch per Leertaste. Fokus auf anderen Buttons und Texteingaben respektieren, keine Doppelaktion.
- [ ] T06 – Trankangebot je Run absichern: Heil- und Manatränke bleiben fest verfügbar, jeweils drei kaufbar pro Run/Vorbereitung. Beim neuen Run zurücksetzen, nicht beim Neuladen. Vorhandenes Limit und seine Speicherung prüfen.
- [ ] T07 – Manatrank im Kampf ergänzen: eigener erreichbarer Zugang mit Bestand, tatsächlicher Mana-Wiederherstellung, Verbrauch und Leerzustand. An den Heiltrank-Ablauf anbinden; gewünschte Zugkosten vor Umsetzung festhalten.
- [ ] T08 – Tastaturbedienung vereinheitlichen: alle Kampfaktionen einschließlich Manatrank und Klassenfähigkeiten per eindeutig zugeordneten Zahlen erreichbar machen; Pfeiltasten zum Auswählen, sichtbarer Fokus, Enter/Leertaste zum Auslösen. Bewegung, Menüs und Dialoge klar trennen; Escape und deaktivierte Aktionen sauber behandeln.
- [ ] T09 – Fenster generell an Browsergröße anpassen: Resize, Zoom, Safe Areas, kleine Höhen und Hoch-/Querformat berücksichtigen. Keine abgeschnittenen Buttons; möglichst ein klarer Scrollbereich statt verschachtelter Scrollflächen.
- [ ] T10 – Rüstkammer vervollständigen: Heldenvorschau mit tatsächlich angelegter Ausrüstung; Gold, Angriff und Verteidigung klar getrennt anzeigen.
- [ ] T11 – Angebotsvergleich in der Rüstkammer: aktuelle und mögliche Werte vor dem Kauf zeigen; Bestätigung bei Ausrüstung direkt an der ausgewählten Karte. Gespeicherte Käufe, Fehler und Limits eindeutig darstellen.
- [ ] T12 – Mehr und wechselnde Ausrüstung in der Rüstkammer: größere Auswahl passend zu Klasse, Level und Werten; gekaufte Angebote verschwinden, folgende Runs erhalten Variation. Vor Umsetzung klären: Entfernung nur aus dem aktuellen Angebot oder auch Ausschluss aus dem nächsten Pool? Gekaufte Ausrüstung nicht versehentlich vor der vorgesehenen Expedition löschen; Angebot gegen Neuwürfeln durch Neuladen absichern. Tränke bleiben davon ausgenommen (T06).
- [ ] T13 – Kampfabschluss ausarbeiten: letzten Treffer, Gegner-Niederlage, EP und Sieg sauber zusammenführen. Keine nachlaufenden Kartenzahlen; Level-Up, Tod und Boss-Beute dürfen nicht überdeckt werden. Gewünschte Anzeigedauer vorab abstimmen, nicht unbemerkt den Kampftakt ändern.
- [ ] T14 – Echte visuelle Gesamt-Abnahme: Kampfzahlen und Effekte im Vordergrund, keine Duplikate, korrekte Positionen beim Scrollen/Resize; anschließend Sieg, Tod, Level-Up, Boss-Beute, Rüstkammer und Neustart auf Handy und Desktop durchspielen.
- [ ] T15 – Figurenanimationen ausbauen: gezielte Angriffs-, Ausweich- und Todesbewegungen für Helden/Gegner statt überwiegend zusätzlicher Effekt-Overlays. Eigenständiger Grafikausbau, getrennt von Fehlerkorrekturen.

Die bisherigen offenen Punkte 1–4 bleiben enthalten: vollständige Rüstkammer (T10–T12), Kampfabschluss (T13), Figurenanimationen (T15) und echte visuelle Abnahme (T14).

## Für jeden einzelnen S- und T-Punkt verpflichtend
- Mobile-first, danach Desktop; Touch- und Tastaturdarstellung bewusst unterscheiden. Desktop-Tastenkürzel nicht ungeprüft auf dem Handy anzeigen.
- Tutorial, Hilfe, sichtbare Tastenkürzel, Buttontexte und zugängliche Beschriftungen zusammen mit der jeweiligen Änderung aktualisieren.
- Kleine Höhe, lange Texte, Fokus, leere Tränke, fehlendes Mana, Cooldowns und relevante Dialogwechsel prüfen.
- Preise, Balance, Speicherung und Zuglogik nur ändern, wenn die jeweilige Aufgabe das ausdrücklich umfasst. Bestehende Fixes erhalten.
- Pro Aufgabe Ergebnis/Commit und Prüfstatus hier ergänzen; Umsetzung und Test nicht gleichsetzen. Changelog-Pflege ist Teil des Abschlusses, kein optionaler Nachtrag.

## Neue Bugs und Rückfragen
Hier können neue Einträge manuell ergänzt und anschließend gemeinsam eingeordnet werden. T = Bug/Wunsch; notwendige Stabilisierung dem passenden S-Paket zuordnen und Bezug erhalten.
- Datum / Gerät und Browser / betroffener Bereich / Schritte / erwartet / tatsächlich / Screenshot oder Diagnose / zugehörige ID.

## Übergabe bei jeder Arbeitsunterbrechung
- Aktiver Punkt und Teilaufgabe: S01b, implementiert und dokumentiert – Abnahme offen.
- Zuletzt geprüfter Codecommit: `42f7b3979d10bdc39bb1c9a128a4b224ddb20fc2`.
- Gesicherter Befund und Ziel: verlustfreier Ausrüstungswechsel/Ablegen, insbesondere bei voller Tasche.
- Bereits geändert/gepusht: S01a-Inventarmodul und S01b-Funktionen in main.js; kein S01c-Fix.
- Lokale Tests und Grenzen: 31 S01b-Prüfungen mit tatsächlichem S01a-Code und Item/UI-Stubs; keine echte Geräte-/Firebase-/Speicherabnahme.
- Deploy / echte Abnahme: Deploy nicht separat verifiziert; S01b-Abnahme ausstehend. T02-Handyabstieg vom Nutzer bestätigt.
- Changelog-Status: S01b detailliert nachgetragen; ältere Lücken einschließlich S01a separat offen.
- Blocker / offene Entscheidung: unbeabsichtigtes text-align:left der Fähigkeitenbuttons zurücknehmen oder ausdrücklich übernehmen; keine stillschweigende Korrektur.
- Exakt nächster Schritt: S01b-Geräteprüfung und CSS-Entscheidung; anschließend S01c-Truhenregel abstimmen.
