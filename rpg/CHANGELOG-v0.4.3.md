# v0.4.3 – Zauberstab und Tastatur

- Neuer Gegenstand arcane_staff (5 ATK) und Startwaffe des Arkanisten, registriert vor main.js über staff.js.
- Eigene Zauberstabdarstellung mit Holzschaft und Kristall; alte gespeicherte Waffen werden nicht automatisch ersetzt.
- Kampf: 1 Angriff, 2 Feuerball, 3 Heiltrank, 4 Flucht; Tab-Fokus bleibt im Kampf; Enter/Leertaste bestätigen.
- Esc im Kampf öffnet eine Hilfe ohne Spielzug; kein kostenloses Verlassen.
- I Inventar, C Ausrüstung, K Skills, L Chronik, P Speichern, Esc zurück zur Karte.
- Leere Recken-Slots und Inventareinträge fokussierbar; Enter/Leertaste aktivieren sie.
- Sichtbarer Fokusrahmen, Fokuswechsel bei Bildschirmwechseln und nach Kampfende.
- Intro-Observer schreibt Klassen nur bei tatsächlichem Bedarf und wird nach Betreten getrennt; Endlosschleifenrisiko korrigiert. Der bestehende main.js-Ladetimer bleibt als Kompatibilitätslösung bestehen.
- Hauptspiellogik und Mobile-Fixes bleiben erhalten.

Nicht durchgeführt: Browser-/Safari-/Firebase-End-to-End-Test. HTML-Fallback-Version und Service-Worker-Cachename bleiben unverändert; Laufzeit-Version ist v0.4.3.
