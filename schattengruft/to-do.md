# To-do – Chroniken der Schattengruft

Stand: 2026-11-26 · Spielversion: v0.10.3  
Umgesetzte und veröffentlichte Funktionen sind nicht Teil dieser Liste. Die Änderungshistorie bleibt in `schattengruft/change.log`.

## Stabilisierung

### S03 – Tod, Vorbereitung und Neustart
- [ ] S03a: Spielphasen und Übergänge definieren.
- [ ] S03b: Tod genau einmal verarbeiten; Goldtransfer, Ausrüstungsverlust und Rücksetzungen absichern.
- [x] S03c: Vorbereitung und Run-Start als eindeutigen Ablauf abschließen; Kauf- und Neustartregeln prüfen.

### S04 – Speichern und asynchrone Aktionen
- [x] S04a: Speicherablauf bündeln: Snapshot, Validierung, Sitzungsprüfung, Schreibvorgang und eindeutiges Ergebnis.
- [ ] S04b: Asynchrone Aktionen an Konto, Slot, Sitzung und Vorgang binden; verspätete Ergebnisse abweisen.
- [x] S04c: Fehlermeldungen und Wiederholungen vereinheitlichen; doppelte Käufe oder Belohnungen verhindern.

### S05 – Dialoge und Eingaben
- [ ] S05a: Zentralen Dialogbesitzer mit Priorität, Öffnen/Schließen und Fokus-Rückgabe umsetzen.
- [ ] S05b: Touch und Tastatur auf dieselben fachlichen Aktionen führen; konkurrierende globale Handler bereinigen.
- [ ] S05c: Treppe, Changelog, Hilfe, Audio, Bossbeute, Level-Up, Rüstkammer und mobile Menüs gemeinsam verwalten.

### S06 – Kampf und Belohnungen
- [ ] S06a: Gemeinsame Aktionsberechtigung für Angriff, Zauber, Tränke, Flucht und Klassenfähigkeiten.
- [ ] S06b: Sieg, Tod, EP, Level-Up und Bossbeute in einem eindeutigen Ablauf koordinieren.
- [ ] S06c: Tatsächliche Heil-/Manamengen melden; Buttons, Ressourcen, Cooldowns und Effekte aus einem Ergebnis aktualisieren.

### S07 – Aufräumen und Gesamtprüfung
- [x] S07a: Aktive Importe und Zuständigkeiten dokumentieren; Altmodule kennzeichnen und erst nach Prüfung entfernen. (2026-11-26: Altmodule nach Import-Graph-Prüfung entfernt, alle 73 verbleibenden Module erreichbar.)
- [ ] S07b: Responsive Regeln, Scrollbereiche, Fokus und Pausierung versteckter Animationen bündeln.
- [ ] S07c: Wiederholbare Integrationstests, Build-Kennung, Diagnose und Changelog-Pflege festigen. (Verkabelungs- und Boot-Test sowie CI-Workflow vorhanden; Build-Kennung weiterhin an sechs Stellen manuell.)

## Offene Produktfragen

- [ ] Waffenprogression: Wie erhält der Spieler stärkere Waffen? Vergabewege, Werteentwicklung und Abhängigkeiten prüfen.
- [ ] Ausrüstungs-Upgrade: Soll identische Ausrüstung verbesserbar sein? Konzept, Kosten, Grenzen und Gegenstandserhalt vor Umsetzung klären.
- [ ] Gegenstandsverfügbarkeit: Prüfen, ob jeder definierte Gegenstand tatsächlich durch Fund, Belohnung oder Shop erreichbar ist.

## Sicherheit und Betrieb

- [ ] Firebase-Regeln für `dark_rpg/**` (saves, leaderboard, sessions) ins Repo legen und dokumentieren; aktuell nicht auditierbar.
- [ ] Migration auf Firebase Modular SDK v9+ prüfen (aktuell v8.10.1 per CDN).
- [ ] Version zentralisieren: `core/version.js` als einzige Quelle, Anzeigen und Cache-Parameter daraus ableiten.

## Arbeitsregeln

- S-Aufgaben haben Vorrang vor Produktwünschen; akute Datenverlust- oder Startblocker dürfen die Reihenfolge unterbrechen.
- Nach jeder Änderung `schattengruft/change.log` ergänzen; keine unvollständige Datei zurückschreiben.
- `[x]` erst nach abgeschlossener Umsetzung und Veröffentlichung setzen.
