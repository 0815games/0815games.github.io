# Changelog

## 2026-10-18 – 0.6.0-Vorbereitung: Dungeon-Tiefe, Textur-Prototyp

- Erster Teil des geplanten Grafik-Updates, noch kein vollständiges Release 0.6.0; Versionsnummer unverändert.
- Bestehenden living-world-Renderer erweitert: Wandkanten, Sockel und dezente Steinbeschädigungen; Bodenfugen, zusätzliche Risse und vereinzelte Feuchtstellen. Bestehende fünf Umgebungspaletten bleiben erhalten.
- Details entstehen nur beim Aufbau der gecachten 32-Pixel-Texturen, nicht als zusätzliche Zeichenpassage je Frame. Keine neuen Assets, Imports oder Animationsschleifen.
- Kacheltyp 2 bleibt unverändert. Kartenlayout, Kollisionen, Entdeckung, Licht/Nebel, Figuren, Kämpfe, Inventar, Käufe und Speicherung unverändert; noch keine neuen Säulen, Altäre oder Raumdekorationen.
- 120 isolierte Painter-Testfälle erfolgreich: fünf Umgebungen, drei Kacheltypen, acht Varianten. Determinismus, Kachelgrenzen, Canvas-Zustandswiederherstellung, unveränderte Paletten und unangetasteter Typ 2 geprüft. Kein echter Browser-Sichttest oder iPhone-Leistungstest durchgeführt.
- Nächster Prüfschritt: Sichtbarkeit der Wand-/Bodendetails, klare Laufwege und flüssige Bewegung auf dem iPhone; danach Umfang weiterer Dungeon-Dekoration festlegen.

## 2026-10-18 – Spieltests bestätigt: Datenbasis und Diagnose

### Behoben / vom Benutzer im Spiel bestätigt

- Diagnose-Zugriff funktioniert nach Fix 1; Benutzer bestätigt anschließend auch Inventar und Speichern als funktionierend.
- Fehlendes Inventar beim Laden: Fix 2 ergänzt fehlende Helden-Container. Der zuvor gemeldete Fehler bei inventory.length unterbrach HUD-Aktualisierungen bei Bewegung und Kampf.
- Tod und Todesübergang funktionieren nach Fix 2 laut Benutzertest wieder. Dafür war bislang kein separater Umbau der Todeslogik erforderlich.
- Gegenstände kaufen und den nächsten Run starten funktionieren nach Fix 2 laut Benutzertest wieder; kein zusätzlicher Kauf-Patch vorgenommen.
- Keine weiteren akuten Fehler im zuletzt bestätigten Teststand gemeldet. Dies ist eine Benutzerbestätigung, keine vollständige Browser-/Cloud-Testabdeckung.

### Offene Prüfpunkte / Grenzen

- Sonderfälle wie Verbindungsabbruch während Kauf/Speichern, Diagnose bei Sitzungspause und parallele Sitzungen sind durch diese Rückmeldung nicht einzeln bestätigt. Keine nachgewiesenen neuen Fehler.
- Bereits mit TP <= 0 gespeicherte Helden beim Laden sowie tatsächlich beschädigte statt nur fehlende Container bleiben gesonderte Prüffälle; Fix 2 ist keine vollständige Spielstandmigration oder Schema-Validierung.
- Die historischen Hinweise auf ausstehende Tests in den Einträgen zu Fix 1 und Fix 2 dokumentieren deren damaligen Stand; obige Benutzerbestätigung ergänzt sie.
- Grafik-Update 0.6.0 ist als nächstes Update vorgesehen, noch nicht implementiert oder veröffentlicht.

## 2026-10-18 – Fix 2: Datenbasis beim Laden von Helden

- state.player wird bei vollständiger Neuzuweisung normalisiert; dies umfasst Object.assign(state, data) im bestehenden Ladeweg, ohne main.js zu ändern.
- Fehlendes oder null-Inventar wird zu einem neuen leeren Array. Fehlende Ausrüstungsplätze sowie Skilltree, Buffs, Cooldowns und preparationBought werden ergänzt.
- Vorhandene Inventare, Gegenstände, Ausrüstung, Skills, Kaufstatus und sonstige Heldenwerte bleiben erhalten; Eingabedaten werden nicht durch Ergänzungen verändert.
- Unbekannte falsche Containerformate werden mit TypeError abgewiesen, statt Inhalte stillschweigend zu löschen; der bisherige state.player bleibt bei abgewiesener Zuweisung erhalten. Keine vollständige Spielstandvalidierung und keine Datenbankmigration.
- 34 isolierte Node-Testfälle erfolgreich, darunter fehlende/null-Felder, Erhalt belegter Daten, Object.assign-Ladeweg, JSON-Serialisierung, getrennte leere Inventare und abgewiesene Formate; zusätzlich 100 wiederholte Normalisierungen ohne Inhaltsänderung. Kein Browser-/iPhone- oder Firebase-End-to-End-Test durchgeführt.
- Kauf-, Speicher-, Diagnose- und Todeslogik unverändert. Negative TP werden nicht automatisch geheilt; Todesablauf und Käufe müssen nach diesem Datenbasis-Fix gesondert geprüft werden.
- to_do.log geprüft: kein eindeutiger Eintrag zu fehlenden Helden-Containern; bestehende Aufgaben unverändert.

## 2026-10-18 – Fix 1: Diagnose-Zugriff bei Eingabesperren

- Rüstkammer- und Sitzungs-Eingabehandler lassen Ereignisse aus dem vorhandenen startup-diagnostics-host passieren; composedPath berücksichtigt auch Bedienelemente im Shadow DOM.
- Ausnahme gilt ausschließlich für den Diagnose-Host. Andere Eingaben bleiben entsprechend Rüstkammer- und Sitzungszustand gesperrt.
- Kauf-, Gold-, Inventar-, Speicher- und Sitzungsprüfungslogik unverändert; Kaufreparatur folgt separat nach Benutzertest.
- 146 Fälle der Handler-Simulation erfolgreich: Klick, Pointer, Touch und Tastatur; Diagnose-Host und Shadow-DOM-Pfad; reguläre Eingaben; gültige, getrennte und pausierte Sitzung; fehlender Host und fehlendes composedPath. Kein echter Browser-/iPhone- oder Firebase-End-to-End-Test durchgeführt.
- to_do.log: kein passender Diagnose-Eintrag im zuletzt geprüften Stand; keine bestehenden Gameplay-Aufgaben als erledigt markiert.

## 2026-10-18 – Fix: Observer-Rückkopplung im Inventar

- Wiederholtes Setzen von hidden im Nutzen-Button konnte den Seiten-Observer erneut auslösen und eine Endlosschleife verursachen.
- hidden wird nur noch bei tatsächlicher Zustandsänderung gesetzt; der Seiten-Observer ignoriert Änderungen innerhalb der eigenen Button-Gruppe. Externe Menü- und Spielzustandsänderungen werden weiterhin verarbeitet.
- main.js, Wegwerfen-Dialog, Button-Farben, planDiscard und persistDiscard bleiben unverändert.
- Geprüft: Node-Syntaxprüfung sowie Regression im DOM-/Observer-Simulator. Alter Code läuft nach 30 Zustellungen weiter; Fix endet nach einer Zustellung. Zusätzlich 100 wiederholte Aktualisierungen, externe Sperrzustände, Ausrüstung, Nutzen, Wegwerfen-Auswahl und veraltete Auswahl geprüft.
- Kein echter iPhone-/Safari- oder Cloud-End-to-End-Test durchgeführt; Bestätigung des gemeldeten Handy-Freeze nach Veröffentlichung steht noch aus.
- to_do.log geprüft: kein passender Eintrag zu diesem Observer-Fehler, daher unverändert.

## 2026-10-18 – Inventar: Nutzen neben Wegwerfen

- Blauer Nutzen-Button links neben dem roten Wegwerfen-Button ergänzt.
- Auf schmalen Displays steht die gemeinsame Button-Gruppe unter dem Gegenstandstext; beide Buttons bleiben nebeneinander.
- Nutzen verwendet den bestehenden Klickhandler der Inventarzeile und damit die vorhandene useItem()-Logik; main.js bleibt unverändert. Optional kann installDiscard weiterhin eine useItem-Funktion entgegennehmen.
- Nutzen wird bei Ausrüstung ausgeblendet; Ausrüsten bleibt unverändert.
- Button-Klicks stoppen die Weiterleitung des ursprünglichen Ereignisses; Auswahl und Sperrzustand werden vor Nutzen erneut geprüft.
- Wegwerfen-Dialog, Mengenwahl, planDiscard und persistDiscard bleiben unverändert; weiterhin kein Gold und keine Bodenbeute.
- Geprüft: Node-Syntaxprüfung und isolierte Tests für Button-Reihenfolge, doppelte Dekoration, Nutzen-Fallback, Wegwerfen-Auswahl, Sperrzustände, veraltete Auswahl und ausgeblendeten Nutzen-Button bei Ausrüstung. Kein Browser- oder Cloud-End-to-End-Test durchgeführt.
- to_do.log geprüft: kein entsprechender Button-Eintrag vorhanden, daher unverändert.

## 2026-10-17 – Wiederherstellung nach fehlerhaften Inventar-Pushes

- Repository-Dateistand mit Wiederherstellungs-Commit 832b58a auf bb849fb68adc96c3f3d7dc981567cd1bd6d919a5 zurückgebracht.
- Benutzer bestätigt erfolgreichen Spieltest nach Wiederherstellung.

## v0.4.0 – Mobile Edition & Episches Intro

- Episches Fullscreen-Intro mit Lore, Glut-Atmosphäre und animiertem Titel.
- Mobile-First-Layout für Phones und Tablets.
- Virtuelles D-Pad entfernt.
- Bewegung direkt per Tap auf angrenzende Felder oder Swipe über die Karte.
- Auto-Lauf zu angetippten sichtbaren Zielen per Wegfindung.
- Kampf als eigenes, großes Fullscreen-Fenster.
- Kompakte HUD, Bottom-Sheet-Panels und größere Touch-Flächen.
- Sichere Randabstände für Notch und Home-Bar.

## v0.3.8 – Skilltree & Roguelite-Builds

- Skilltree mit 12 Skills in den Zweigen Krieg, Arkan und Schatten.
- Ein Skillpunkt pro Level-Up.
- Effekte für TP, MP, ATK, DEF, Krit, Ausweichen, Feuer, Heilung und Gold.
- Persistente Speicherung pro Recken.

## v0.3.7 – Level Design & Bewegbare Welt

- Größere, prozedural erzeugte Ebenen.
- Bewegbare Kamera.
- Fünf unterschiedliche Ebenen-Designs.
- Zufallsnamen, AFK-Logout und Speicher-Benachrichtigung.
