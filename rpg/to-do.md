# To-do – Chroniken der Schattengruft

Stand: 2026-10-16. Entwurf: alle nachstehenden Punkte sind noch offen bzw. abzunehmen.

## Arbeitsweise
- Bei Unklarheit über den nächsten Schritt zuerst diese Datei lesen.
- Reihenfolge: grob von einfach nach aufwendig; Schätzung vor Umsetzung am aktuellen Code prüfen. Abhängigkeiten gemeinsam abstimmen.
- Pro Push ein klar begrenztes Thema; größere Aufgaben in a/b/c teilen. Keine pauschale Erfolgsgarantie.
- IDs beibehalten. Manuell ergänzte Bugs nicht löschen oder stillschweigend umdeuten; gemeinsam klären.
- Umsetzung, lokale Prüfung, Deploy und echte Browser-/Geräteabnahme unterscheiden. Nicht allein wegen eines Pushs abhaken.
- Diese Datei plant Aufgaben. rpg/change.log bleibt die Änderungshistorie; vorhandene andere Dateien bleiben unverändert.

## Umgesetzt

- [x] ~~T01 – Kaufbestätigung unterscheiden: Heil-/Manatränke direkt kaufen; bei Ausrüstung weiterhin bestätigen. Doppelkäufe während laufender Speicherung verhindern.~~ — umgesetzt am 2026-10-16 12:16 CEST in v0.5.20, Commit `40ab45c0085504b5a2c8a7c49bc659535ef1e186`. Code-Push und 66 lokale Modellprüfungen bestanden; echte Browser-/Firebase-Abnahme noch offen.
- [x] ~~T02 – Treppendialog: Schaltflächen umgekehrt anordnen. Vor Umsetzung klären: Ist „Abstieg immer vorgewählt“ gewünscht oder der gemeldete Fehler? Zielreihenfolge und Standardfokus ausdrücklich festlegen.~~ — umgesetzt am 2026-10-16 12:25 CEST in v0.5.21, Commit `cb6a2b86450aecbf2eaad9799df4f4614aa838b0`. Entscheidung: Bestätigungsdialog mit „⬇️ Absteigen“ zuerst und vorausgewählt; „🚪 Hier bleiben“ bricht ab. Code-Push und 21 lokale Modellprüfungen bestanden; echte Browser-/Firebase-Abnahme noch offen.

## Aufgaben – einfachere zuerst

- [ ] T03 – Desktop-Kampffenster verkleinern: sinnvolle Maximalmaße, weniger Leerraum, lange Inhalte weiterhin erreichbar.
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

Die bisherigen offenen Punkte 1–4 sind damit enthalten: vollständige Rüstkammer (T10–T12), Kampfabschluss (T13), Figurenanimationen (T15) und echte visuelle Abnahme (T14).

## Für jeden einzelnen Punkt verpflichtend
- Mobile-first, danach Desktop; Touch- und Tastaturdarstellung bewusst unterscheiden. Desktop-Tastenkürzel nicht ungeprüft auf dem Handy anzeigen.
- Tutorial, Hilfe, sichtbare Tastenkürzel, Buttontexte und zugängliche Beschriftungen zusammen mit der jeweiligen Änderung aktualisieren.
- Kleine Höhe, lange Texte, Fokus, leere Tränke, fehlendes Mana, Cooldowns und relevante Dialogwechsel prüfen.
- Preise, Balance, Speicherung und Zuglogik nur ändern, wenn die jeweilige Aufgabe das ausdrücklich umfasst. Bestehende Fixes erhalten.
- Pro Aufgabe Ergebnis/Commit und Prüfstatus hier ergänzen; Umsetzung und Test nicht gleichsetzen.

## Neue Bugs und Rückfragen
Hier können neue Einträge manuell ergänzt und anschließend gemeinsam eingeordnet werden.
- Datum / Gerät und Browser / betroffener Bereich / Schritte / erwartet / tatsächlich / Screenshot.
