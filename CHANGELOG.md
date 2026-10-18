# Changelog

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
