# Zuwachs-Deckel für Fortschritts-Regeln veröffentlichen (AUSBAU-PLAN Punkt 2)

**Datei:** [`PROGRESSION-DELTA-CAPS-TO-PUBLISH.json`](PROGRESSION-DELTA-CAPS-TO-PUBLISH.json)
(= aktueller Live-Stand `ENDLESS-LAST-RUN-TO-PUBLISH.json` + exakt sieben
verschärfte `.validate`-Zeilen; Diff ist per Test gepinnt,
`IronPath/tests/progression-delta-rules.test.mjs`.)

## Was sich ändert — und was nicht

Die Fortschritts-Regeln begrenzten bisher nur Richtung (monoton) und
Obergrenze. Ein manipulierter Client konnte deshalb in **einer**
Schreibung springen: XP auf 10.000.000, Bestwelle auf 10.000, Endlos-
Zähler ans Limit, Scrap auf 10.000.000. Neu ist ein **Zuwachs-Deckel pro
Schreibung**, weit über allem, was der echte Client in einer Schreibung
verdienen kann:

| Feld | Deckel pro Schreibung | Ehrliches Maximum |
| --- | --- | --- |
| `players/$uid/xp` | +5.000 | 1.020 pro Welle (+ Boni) |
| `players/$uid/storyProgress` | +1 | 1 Mission pro Abschluss |
| `players/$uid/endlessRuns` | +1 | 1 Lauf pro Meldung |
| `players/$uid/endlessWaves` | +1.000 | Wellen eines ganzen Laufs |
| `players/$uid/endlessBosses` | +200 | Bosse eines ganzen Laufs |
| `players/$uid/armory/scrap` (nur Zuwachs) | +1.000 | 20 pro Boss; Ausgeben bleibt frei |
| `leaderboards/$mode/$uid/wave` | +500 (Erstwert ≤ 500) | Bestwelle wird beim Erreichen gemeldet |

Keine neuen Felder, keine geänderten Lese-/Schreibrechte, keine anderen
Zeilen. Monotonie und Obergrenzen bleiben.

## Veröffentlichen

1. Firebase Console → Realtime Database → Regeln.
2. Inhalt von `PROGRESSION-DELTA-CAPS-TO-PUBLISH.json` vollständig
   einfügen und veröffentlichen.
3. Kurz prüfen: Profil lädt, eine geschaffte Welle speichert XP wie
   bisher. Fertig — der Client braucht keine Änderung und keine neue
   Cache-Welle.

## Sicherheit

- Emulator-Beweis liegt in `rules-test/progression-delta-rules.test.mjs`
  (CI-Schritt `test:delta-caps`): ehrliche Schreibungen gehen durch,
  Sprünge ans Limit werden abgelehnt, Scrap-Ausgeben bleibt frei.
- Falls etwas klemmt: einfach die vorherige Datei
  (`ENDLESS-LAST-RUN-TO-PUBLISH.json`) wieder einfügen — die Änderung ist
  rein regelbasiert und jederzeit umkehrbar.
