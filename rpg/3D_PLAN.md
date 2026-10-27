# Schattengruft: 3D-Umsetzung in fünf Phasen

Sicherung: Branch 20261027bak.
Commit: 3b123e5f672b7590a0fb89a62b5f76a4fe6e18f3.
Das Backup enthält Repository-Dateien, keine Firebase-Spielstände.

## Phase 1 — v0.9.0: spielbare 3D-Grundlage
- [x] Zuschaltbaren 3D-Renderer für Katakomben implementiert.
- [x] Welt und Spielerzustand werden nur gelesen.
- [x] Feste schräge Kamera; Norden bleibt oben.
- [x] Räumliche Böden, Mauern, einfache Truhen und Treppen.
- [x] Vorhandene Figuren als Übergangs-Sprites.
- [x] 2D-Schalter und Fehler-Rückfall.
- [x] Automatische Tests mit Grafik-Doubles.
- [ ] Echtes WebGL, Desktop und Handy online prüfen.
- [ ] Bewegung, Sichtbarkeit, Kollision und Gegenstände prüfen.
- [ ] Treppenwechsel und Kampfstart prüfen.
- [ ] Speichern/Neuladen und Charakterwechsel prüfen.
- [ ] Nutzerfreigabe; erst danach Phase 2.

Online-Test: /rpg/?view=3d
Standard: /rpg/ bleibt zunächst 2D.
Andere Umgebungen bleiben in Phase 1 automatisch in 2D.
3D benötigt Internet zum Laden der gepinnten Three.js-Abhängigkeit.
Die bisherigen 2D-Weltpartikel werden noch nicht in 3D übertragen.

## Phase 2 — Material und Atmosphäre
- [ ] Stein-, Holz- und Metallmaterialien.
- [ ] Ausgewählte Lichter, Schatten und mobile Qualitätsstufen.
- [ ] Gegenstandsdetails und 3D-Ereigniseffekte.
- [ ] Online-Abnahme durch Nutzer.

## Phase 3 — Figuren
- [ ] 3D-Held, Klassenmerkmale und sichtbare Ausrüstung.
- [ ] Erste Gegner und passende Animationen.
- [ ] Online-Abnahme durch Nutzer.

## Phase 4 — weitere Umgebungen
- [ ] Pilzwald, Frostgruft, Feuerschrein und Schattenarena.
- [ ] Themen-/Ebenenwechsel und Leistung prüfen.
- [ ] Online-Abnahme durch Nutzer.

## Phase 5 — Kampf
- [ ] Gemeinsame 3D-Kampfbühne.
- [ ] Angriffe, Zauber, Treffer und Belohnungsübergänge.
- [ ] Mana 4 und Flucht 5 beibehalten.
- [ ] Vollständige Kampfreihenfolge und Online-Abnahme.
