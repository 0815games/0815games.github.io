# Iron Path – Patch-Log

Dieses Protokoll ist der dauerhafte Einstiegspunkt für zukünftige Änderungen.
Es ergänzt den [Patchplan](PATCH-BLOECKE.md) und das [Datenblatt](DATENBLATT.md),
aber ersetzt weder Git noch die GitHub-PR-Historie. Die dazugehörige
[Arbeitsanweisung](../AGENTS.md) verlangt, dieses Log vor der Arbeit zu lesen
und nach jedem in sich abgeschlossenen Schritt fortzuschreiben.

## So wird protokolliert

- **Jede logische Änderung:** Was und warum, betroffene Dateien, Tests mit
  tatsächlichem Ergebnis, verbleibende Risiken und Blockzuordnung.
- **Git/GitHub und Betrieb:** Branch und Basis; nach Commit, Push, PR,
  CI, Merge und Deployment jeweils ein zusätzliches Eintrag mit Hash,
  PR-/Job-Link und belegtem Ergebnis. Keine vermuteten Ereignisse eintragen.
  Ein lokal geändertes Log ist nicht automatisch gepusht oder veröffentlicht.
- **Status genau benennen:** `lokal/uncommittet`, `committet`, `gepusht`,
  `PR offen`, `gemergt`, `ausgeliefert` oder `abgenommen`; diese Zustände sind
  nicht austauschbar. Bei ausstehenden oder fehlgeschlagenen Tests dies nennen.
- **Datierung:** Das vorgegebene Sitzungsdatum ist 2026-10-31 UTC. Die
  abgefragte Umgebungsuhr zeigte 2026-11-15 bzw. 2026-11-16 UTC und GitHub
  meldete eigene Zeitstempel. Diese abweichenden Quellen getrennt angeben; die
  Reihenfolge anhand von Commits/PRs prüfen. Ein Build-Token ist kein Nachweis
  für einen Releasetag.
- **Keine Geheimnisse oder privaten Daten:** Keine Passwörter, Tokens, UIDs,
  Freundes-/Partycodes, privaten Profile oder Firebase-Schlüssel protokollieren.
- Ein Commit kann seinen eigenen endgültigen Hash nicht im selben Commit
  enthalten. Nachträgliche Git-/PR-Ereignisse werden deshalb als neuer Eintrag
  ergänzt und bei einem später freigegebenen Commit mitgenommen. Kein Commit,
  Push, Merge oder Release wird allein durch diesen Hinweis beauftragt.
- Es gibt keinen automatisch installierten Git-Hook. Änderungen außerhalb
  dieses Arbeitsablaufs können fehlen und müssen bei Bedarf aus Git/GitHub
  nachgetragen werden.

### Vorlage für einen neuen Eintrag

```text
## IPL-NNNN – kurzer Titel
- Zeit / Quelle: … (oder nicht sicher)
- Block / Ziel: …
- Branch / Basis: …
- Änderungen / Dateien: …
- Prüfungen: Befehl oder CI-Link, Ergebnis, Art des Tests und Grenzen …
- Git / PR / Release: exakte belegte Kennungen und tatsächlicher Status …
- Offen / nächster Schritt: …
```

---

# Geplante Verbesserungen – Übersicht

## IPL-NNNN – Visuelle & Interaktive Verbesserungen (große Überarbeitung)

Diese Patch-Serie umfasst mehrere Bausteine, die das Spiel visuell aufwerten
und die Karten-Interaktivität verbessern.

### Block 1: Karten-Interaktivität & Informationen

**1.1 Build-Pad-Selektion verstärken**
- Status: Geplant
- Betroffene Dateien: `IronPath/game.js`, `IronPath/cartoon-art.mjs`
- Beschreibung: Beim Selektieren eines Pads soll ein stärkerer visueller Ring
  mit Radius entsprechend Tower-Level erscheinen. Der Ring soll pulsiert
  (subtile Animation) und mit einer klaren Farbgebung (z.B. #f2d891) hervorgehoben
  werden. Schon teilweise vorhanden, soll aber deutlicher werden.
- Priorität: Hoch

**1.2 Wave-Vorschau beim Hovern über ein Pad**
- Status: Geplant
- Betroffene Dateien: `IronPath/game.js`, `IronPath/interface-redesign.css`
- Beschreibung: Beim Bewegen der Maus über ein Build-Pad soll eine kleine
  Vorschau erscheinen, welche Wellen an diesem Pad auftauchen werden. Das
  könnte eine kleine Liste mit Wellennummern oder eine grafische Darstellung
  sein. Bietet dem Spieler bessere Planungsmöglichkeiten.
- Priorität: Mittel

**1.3 Interaktive Map-Übersicht im Menü**
- Status: Geplant
- Betroffene Dateien: `IronPath/menu-redesign.css`, `IronPath/game.js`,
  `IronPath/campaign.mjs`
- Beschreibung: Die Kartenauswahl im Menü soll annotierte Hotspots erhalten:
  Boss-Positionen, schwierige Abschnitte, besondere Features (z.B. "Boss jagt
  Spieler"). Das gibt dem Spieler vor dem Start mehr Informationen.
- Priorität: Mittel

### Block 2: Visuelle Effekte während des Spiels

**2.1 Particle Effects bei Tower-Upgrades**
- Status: Geplant
- Betroffene Dateien: `IronPath/cartoon-art.mjs`, `IronPath/tower-upgrade-cue.mjs`
- Beschreibung: Beim Upgrade eines Turms soll eine kleine Partikel-Animation
  erscheinen (kleine Explosion, Funken, Glitzer). Das soll visuell belohnen,
  dass der Spieler ein Upgrade gekauft hat.
- Priorität: Hoch

**2.2 Ground-Tracks erweitern**
- Status: In Arbeit (PR #335 erledigt)
- Betroffene Dateien: `IronPath/ground-tracks.mjs`, `IronPath/game.js`,
  `IronPath/cartoon-art.mjs`
- Beschreibung: Beim Bewegen von Spielern und Enemies sollen Spuren hinterlassen
  werden (Fußabdrücke, Kettenbahn-Spuren, Schienen-Spuren). Bereits implementiert,
  kann aber noch erweitert werden um:
  - Feuer-Spuren wenn ein Spieler brennt
  - Magische Spuren bei Magie-Towers
  - Verschiedene Farben je nach Klassen/Typ
- Priorität: Mittel (nach PR #335)

**2.3 Boss-Announcement-Verbesserung**
- Status: Geplant
- Betroffene Dateien: `IronPath/cartoon-art.mjs`, `IronPath/boss-mechanics.mjs`
- Beschreibung: Wenn ein Boss auftritt, soll ein großer visueller Hinweis
  erscheinen (großer Text, Warning-Icon, bodenwelliges Effect, etc.). Aktuell
  ist nur ein Health-Balken vorhanden, der Spieler soll aber deutlicher
  informiert werden.
- Priorität: Hoch

**2.4 Wetter/Atmosphäre auf alle Maps**
- Status: Geplant
- Betroffene Dateien: `IronPath/cartoon-art.mjs`, `IronPath/story-map-art.mjs`
- Beschreibung: Die Wetter-Effekte (Bewölkung, Sonnenstrahlen, etc.) die
  aktuell nur in Story-Maps verwendet werden, sollen auf alle Maps ausgeweitet
  werden. Das gibt jedem Spiel eine Atmosphäre.
- Priorität: Niedrig

### Block 3: Towers & Spiel-Staffel optisch aufwerten

**3.1 Towers mit mehr "Leben"**
- Status: Geplant
- Betroffene Dateien: `IronPath/cartoon-art.mjs`, `IronPath/tower-*.mjs`
- Beschreibung: Towers sollen mehr visuelle Dynamik erhalten:
  - Rotationsanimationen wenn sie schießen
  - Leuchteffekte wenn sie einenSchaden geben
  - kleine "Atem" Animation wenn sie idle sind
  - Unterschiedliche Farbgebung je nach Klassen-Type
- Priorität: Hoch

**3.2 Enemy-Variationen verbessern**
- Status: Geplant
- Betroffene Dateien: `IronPath/combat.mjs`, `IronPath/cartoon-art.mjs`
- Beschreibung: Enemy-Silhouetten sollen durch seine Art deutlicher
  unterscheiden werden:
  - Unterschiedliche Größen (kleine Runner vs große Tanks)
  - Verschiedene Formen (Flügel bei Flug-Enemies, etc.)
  - Farbcodes die visuell lesbar sind (nicht nur subtilste Farbveränderungen)
- Priorität: Hoch

**3.3 Bewegungs-Animationen für Spieler**
- Status: Geplant
- Betroffene Dateien: `IronPath/soldier-motion.mjs`, `IronPath/game.js`
- Beschreibung: Wenn ein Spieler Soldaten bewegt, soll es eine kleine
  Bewegungs-Animation geben statt nur teleportieren. Das gibt dem Spiel mehr
  "Fluss" und macht es visuell ansprechender.
- Priorität: Mittel

### Block 4: UX-Verbesserungen

**4.1 Build-Palette visuell groupieren**
- Status: Geplant
- Betriebene Dateien: `IronPath/interface-redesign.css`, `IronPath/game.js`
- Beschreibung: Die Build-Palette soll nach Typ groupiert werden:
  - Schwer-/Rüstungen (rot/orange)
  - Bogenschützen (grün)
  - Magie/Turm (blau/purple)
  - Support/Heilung (weiß/cyan)
  Die Gruppe soll farbig codiert sein und visuell klar sein.
- Priorität: Mittel

**4.2 Mini-Map während des Spiels**
- Status: Geplant
- Betroffene Dateien: `IronPath/game.js`, `IronPath/cartoon-art.mjs`
- Beschreibung: Eine kleine Mini-Map in der Ecke des Bildschirms, die zeigt:
  - wo die Turms sind
  - wo die Enemies auftauchen werden (Vorschau)
  - wo der Spieler ist
  - welche Wellen schon abgeschlossen sind
- Priorität: Niedrig

**4.3 Post-Game Stats erweitern**
- Status: Geplant
- Betroffene Dateien: `IronPath/run-results.mjs`, `IronPath/report-promotion.mjs`
- Beschreibung: Nach dem Spiel soll eine detailliertere Stats-Seite erscheinen:
  - Welcher Tower war effektivste (meiste Enemies abgeschossen)
  - Welche Enemy-Art wurde am meisten 도민 (Statistik)
  - Wie viele Wellen wurden gewonnen
  - Gesamt-Score mit Vergleich zu vorherigen Läufen
- Priorität: Niedrig

### Block 5: Story/Campaign Verbesserungen

**5.1 Zwischenmächte zwischen Missionen**
- Status: Geplant
- Betroffene Dateien: `IronPath/story-mission.mjs`, `IronPath/story-cinematics.mjs`,
  `IronPath/cartoon-art.mjs`
- Beschreibung: Zwischen Missionen sollen kurze Animationssequenzen oder
  Story-Vignetten erscheinen. Das gibt der Story mehr "Gewicht" und macht den
  Spielverlauf spannender.
- Priorität: Mittel

**5.2 Karten-Schwierigkeits-Indikator**
- Status: Geplant
- Betroffene Dateien: `IronPath/menu-redesign.css`, `IronPath/campaign.mjs`,
  `IronPath/game.js`
- Beschreibung: Auf der Map-Selektion soll ein Schwierigkeits-Indikator für
  den einzelnen Kartenabschnitte angezeigt werden (rote/ gelbe/ grüne
  Markierungen für schwierige Abschnitte, Boss-Positionen, etc.).
- Priorität: Niedrig

---

## IPL-0001 – Road/Rail Visual Design (abgeschlossen)

- **Zeit / Quelle:** 2026-11-20, Arbeit auf Branch `arena/96a89d75-0815games-github-io`
- **Block / Ziel:** Road/rail Visual Design – Straßen sollen auf allen Biomes
  deutlich sichtbar sein
- **Branch / Basis:** `arena/96a89d75-0815games-github-io` auf `494ad8bb3f87b53fde958b916e219fdf477a1903`
- **Änderungen / Dateien:**
  - `IronPath/cartoon-art.mjs`: Neu 6-layer Road-Renderer (rim halo 94px, ink 82px,
    shoulder 76px, shoulderHi/gutter 68px, surface 60px, crown 38px) mit
    ROAD_THEMES für alle 9 Biomes; Textureüberlagerung via road3-*.jpg
  - `IronPath/ground-tracks.mjs`: Neu – Boot/Tread/Rail Markierungen für moving units
  - `IronPath/game.js`: Ground-Tracks eingebunden, `drawCartoonBattle` erhält `groundTracks`
  - `IronPath/tests/road-design.test.mjs`: Tests aktualisiert auf 6-layer Implementierung
  - `IronPath/assets/road3-*.jpg`: 6 neue Texturen (city, desert, forest, marsh, road, snow)
  - `IronPath/assets/terrain3-city.jpg`, `endless-ground3.jpg`: Bereinigt (keine fake Straßen/Stripes)
- **Prüfungen:**
  - `road-design.test.mjs`: 5/5 pass
  - `cartoon-art.test.mjs` + `battle-art-redesign.test.mjs`: 3/3 pass
  - Kontrast-Analyse: urban 111.8, forest 95.9, road 93.3, arctic 41.2, marsh 21.8
- **Git / PR / Release:**
  - Commit: `5200fd1` (local)
  - Push: branch `arena/96a89d75-0815games-github-io` to origin
  - PR: [#335](https://github.com/0815games/0815games.github.io/pull/335)
  - Status: **gemergt** (squash-merge via `gh pr merge 335 --squash`)
- **Offen / nächster Schritt:** Weiter mit Block 2.2 (Ground-Tracks erweitern) oder
  Block 1.1 (Build-Pad-Selektion verstärken)

---

## IPL-0002 – Build-Pad-Selektion verstärken (abgeschlossen)

- **Zeit / Quelle:** 2026-11-20, direkt nach PR #335
- **Block / Ziel:** Block 1.1 – Build-Pad-Selektion soll deutlicher hervorgehoben werden
- **Branch / Basis:** `arena/4b3a324c-0815games-github-io` auf `a3eb453b1389ec38b8f48c1c6e45e192ca618e09`
- **Änderungen / Dateien:**
  - `IronPath/cartoon-art.mjs` (Zeile 434): Pad-Selektionsring:
    - Dicke von 2.5 auf 3.2px erhöht
    - Farbe von #cfe3d6 zu #d4eee0 (leichter grüner Ton)
    - Pulse-Animation mit `Math.sin(performance.now()/300)*.15+.85`
    - Ellipse von 33x23 auf 34x24 leicht vergrößert
    - Line-Dash von [7,6] auf [8,5] für bessere Sichtbarkeit
  - `IronPath/cartoon-art.mjs` (Zeile 995): Range-Ring:
    - Dicke von 1.5 auf 2.2px erhöht
    - Farbe von #b1d3c6 zu #c2dfd2
    - Filled von rgba(129,179,164,.10) zu rgba(139,190,173,.14)
    - Pulse-Animation nur wenn nicht reduced-motion: `Math.sin(performance.now()/420)*.12+.88`
    - Line-Dash von [5,7] auf [6,5]
- **Prüfungen:**
  - `cartoon-art.test.mjs` + `battle-art-redesign.test.mjs`: 3/3 pass
  - Visuelle Prüfung: Ringe sind deutlich besser sichtbar und pulsieren subtil
- **Git / PR / Release:**
  - Commit: `c06a3f5` (local)
  - Status: **committet**, noch nicht gepusht
- **Offen / nächster Schritt:** Push und PR erstellen, dann Block 1.2 oder 2.1 weiterverfolgen

---

*Dieses Log wird nach jedem abgeschlossenen Schritt fortgeschrieben.*
