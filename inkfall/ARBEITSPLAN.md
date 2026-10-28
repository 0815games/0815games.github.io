# INKFALL – Arbeitsplan

Referenz: INKFALL – Heroes of the Last Tower, Game Design Grunddokument.
Stand: 2026-10-28.

## Arbeitsregeln

- Solo-Spielstände und Coop-Sitzungen strikt trennen.
- Keine neuen Klassen oder Karten vor einem funktionierenden Coop-Kern.
- Jedes Paket erhält Tests und konkrete Abnahmekriterien.
- Automatisierte Tests ersetzen keine Browser-/Zwei-Spieler-Abnahme.
- Firebase-Regeländerungen separat veröffentlichen und prüfen.
- Kein Paket allein aufgrund vorhandenen Codes als abgeschlossen markieren.

## A – Solo-Basis absichern

- [ ] A1: Solo-Kerntests ausführen und Fehler beheben.
- [ ] A2: Namen, Klassenwechsel, Reset und Speichern/Laden prüfen.
- [ ] Browser-Abnahme: vollständigen Solo-Run testen.

A1 prüft den Inline-Spielkern. Externe UI-, Kamera-, Grafik- und
Firebase-Module werden damit noch nicht integriert getestet.

## B – Coop-Sitzung und Start

- [ ] B1: Sitzungsmodell, Host-Zuständigkeit und Nachrichtenformat.
- [ ] B2: Gemeinsamer Start nach Bereitschaft beider Spieler.
- [ ] Doppelte Startversuche und veraltete Sitzungen abweisen.
- [ ] Private Solo-Spielstände bleiben unverändert.

Technischer Vorschlag: Der Host berechnet den verbindlichen Kampfzustand.
Der Gast übermittelt Aktionen. Beide stellen denselben Zustand dar.
Host-Abbruch pausiert oder beendet die Sitzung kontrolliert;
automatische Host-Migration gehört zunächst nicht zum Umfang.

## C – Coop-Bewegung und Kampf

- [ ] C1: Zwei benannte Helden und getrennte Bewegungsbefehle.
- [ ] C2: Wellen, Gegner, Fähigkeiten, Schaden und Bastionsleben.
- [ ] Wiederholte oder veraltete Aktionen nicht doppelt ausführen.
- [ ] Verbindungsabbruch und Wiederverbindung testen.

## D – Gemeinsame Wirtschaft

- [ ] Gemeinsamer Goldbestand mit individuellem Bau-Budget.
- [ ] Bauen und Verbessern nur nach bestätigter Aktion.
- [ ] Gleichzeitige Käufe ohne negative Bestände oder doppelte Türme.

## E – Duo-Mechanik

- [ ] Erste Ritter-/Magier-Synergie spezifizieren.
- [ ] Gemeinsame Auslösung und Cooldown synchronisieren.
- [ ] Solo-Spielbarkeit erhalten.

## F – Coop-Abnahme

- [ ] Mini-Boss und Coop-Skalierung abstimmen.
- [ ] Vollständigen Run mit zwei getrennten Accounts testen.
- [ ] Niederlage, Verlassen und erneuten Start prüfen.
- [ ] Danach Vertical-Slice-Plan aktualisieren.

## Aktueller Einstieg

A1 ist als Testcode angelegt, aber erst nach erfolgreichem Testlauf
abgenommen. Danach A2; anschließend B1.
