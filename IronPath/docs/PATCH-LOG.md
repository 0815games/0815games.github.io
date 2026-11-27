# Iron Path – Patch-Log

Dieses Protokoll ist der dauerhafte Einstiegspunkt für zukünftige Änderungen.
Es ergänzt den [Patchplan](PATCH-BLOECKE.md) und das [Datenblatt](DATENBLATT.md),
aber ersetzt weder Git noch die GitHub-PR-Historie. Die dazugehörige
[Arbeitsanweisung](../../AGENTS.md) verlangt, dieses Log vor der Arbeit zu lesen
und nach jedem in sich abgeschlossenen Schritt fortzuschreiben.

Die Einträge IPL-0001 bis IPL-0128 stehen im
[Archiv](PATCH-LOG-ARCHIV.md); hier stehen die neuesten 20. Beide Dateien
zusammen sind lückenlos und doppelfrei - `../scripts/patch.mjs` (Unterbefehl `check`) und
`../tests/patch-log-archive.test.mjs` prüfen das.

## So wird protokolliert

- **Jede logische Änderung:** Was und warum, betroffene Dateien, Tests mit
  tatsächlichem Ergebnis, verbleibende Risiken und Blockzuordnung.
- **Git/GitHub und Betrieb:** Branch und Basis; nach Commit, Push, PR,
  CI, Merge und Deployment jeweils ein zusätzliches Ereignis mit Hash,
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

Die Vorlage steht als einzige Quelle in
[patch-log-vorlage.md](patch-log-vorlage.md), zusammen mit der Erklärung, was in
jedes Feld gehört und was nicht hineindarf. Eine Kopie hier würde auseinanderlaufen.
























## IPL-0129 – Balancing der Welle-11-Kante und verknüpftes Feld-Report-Werkzeug (Welle `20261124-aim7`, PR `#425`)
- **Zeit / Quelle:** Sitzungsdatum 2026-11-21 UTC, Umgebungsuhr 2026-11-24 UTC (getrennt genannt); Balancing-Auftrag des Betreibers aus der Auftragsnotiz, wörtlich: „die ersten zehn Wellen gehen Butter, weich durch und ab Welle elf sobald die Karte wechselt, wird es abnormal schwer" — verlangt: ordentlicher Test mit allen Klassenvarianten, Ausrüstungen, Skills und Turm-Szenarien plus Stress-Paket, und eine wiederverwendbare Auswertungsdatei, die alle Auswertungen verknüpft auswertet und Änderungen austauschbar/revertierbar hält (Formulierung „Barth Bankingpaket" in der Notiz unklar, als Balance-Testpaket umgesetzt).
- **Block / Ziel:** Kein Spiel-Block; Balancing + Prüfwerkzeug. Diagnose vor dem Fix: Kliff ab Welle 11 aus dem Stapel 60-%-Rücklage, gelöschte Türme, größere neue Karte, Sektor-2-Formation (jede dritte Bodeneinheit → Panzer) mit MG-0,4×-Panzer-Malus, Wellen-HP-Kurve `hp = Typ-HP × (1 + (Welle−1) · 0,23)` (Welle 11 = 3,3×) und Bunker-Patch auf 75 %; die Öffnung blieb beim Autopiloten ohne Schaden. Bewusst verworfen: frühe HP-Rampe für Wellen 6–10 (bis +20 %) — ein Nur-Bauer-Fixtures starb schon ab +4 % in Welle 10; die Messsäule (`early`) steht im Report, die Entscheidung bleibt Betreiber-Sache.
- **Branch / Basis:** `arena/e4e6ddef-0815games-github-io` ab `b2bf68e` (`main`, Merge PR `#410`).
- **Änderungen / Dateien:**
  - `IronPath/core/match.mjs`: `advanceSector` — Rücklage `.6` → `.8` (80 % der Tower- und Klassen-Investition), `state.sectorGraceWave = state.wave + 1`.
  - `IronPath/core/simulation.mjs`: Spawn-Gate `grace` — solange `wave <= sectorGraceWave` laufen Lean-Formation und `effectiveSector` auf Sektor 1 (kein Panzer-Lean, kein +12 % HP / +5 % Tempo); Layer-Reihenfolge Wellen-Kurve → Sektor-Bonus hält das 1,12-Verhältnis exakt; Notiz an der Stelle, an der künftig früher Endlos-Druck ansetzen würde.
  - `IronPath/tests/balance-harness.mjs` (nur additiv, Default-Pfade byte-identisch): `runSoloTrace` mit Wellen-Trace (HP/Vorrat/Türme/Level/Karte je Wellenstart, Wellenende, Advance-Ereignisse, Tick-Stempel); Trace-Lauf vor dem Piloten, damit Wellen-Enden sichtbar werden; `placementOrder` mit `coverage` (Default) / `roadside` / `bunker` / `spread`; `CLASS_VARIANTS` und `classGear` für Klassenvarianten-Läufe.
  - `IronPath/tests/balance-field-report.mjs` (neu): das verknüpfte Auswertungswerkzeug — Matrix (GEARS × Klassenvarianten × Turm-Placements × Endlos-/Sektorfelder + Coop-Reihen), Tabelle mit Cliff-/Grace-/Rebuild-/Butter-Säulen, `--write-baseline` (bewusster Tausch, in Git committen), `--check` (Exit 1 bei Regression), `--quick`, `--with-stress` (Stresspaket als Report-Sektion), schreibt `balance-report-latest.json` (ignoriert).
  - `IronPath/tests/balance-baseline.json` (neu): kommittete Baseline, 34 Szenarien — Differenz-Auswertung und revertierbarer Snapshot in einem.
  - `IronPath/tests/balance-transition.test.mjs` (neu): Grace-Pin (Welle 11 spawnt im alten Rhythmus, Welle 12 volle neue Bedrohung) und Überlebensfenster der Rookie-Retreat-Partie (`g3-0b9f45231`, Cliff-Schaden ≤ 12 HP, ≥ 10 Türme bis Welle 12, laufend bis 16).
  - Pins bewusst nachgezogen: `sector-campaign` 72 → 96 (80 % von 120), `tower-class-paths` `.6` → `.8`, `balance-suite` armory-Pin `<35` bei Cap 40 → `<45` bei Cap 60 (Vest-Ladung nach +80 % Rücklage und Grace gemessen tot in Welle 41; Ladung ohne Item weiter tot in Welle 30).
  - `.gitignore`: `IronPath/tests/balance-report-latest.json`.
- **Prüfungen:** `node --test tests/*.test.mjs` → **1354 Tests, 1353 bestanden, 1 übersprungen, 0 Fehler**, Exit 0. `npm run test:stress` → grün. `node IronPath/tests/balance-field-report.mjs --check --with-stress` → **34/34 ok**, Exit 0. Kanten-Nachweis aus dem Report: 16 Retreat-Läufe, mittlerer Cliff-Schaden (Grace + zwei Wellen) **0 HP**, Grace-Welle in allen Läufen 0 Schaden, Wiederaufbau 4 Türme in der Grace-Welle und 14 bis Welle 12. Nicht geprüft: Gerät/Emulator und manuelle Spielfahrt — Sichtprüfung macht der Betreiber.
- **Git / PR / Release:** Code-Commit `a0572fd` auf dem genannten Branch, Push, PR `#425`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0109`, AUSBAU-Zeile 14, Feldnotizen `aim7` mit `pr: 425`) und Cache-Welle `20261124-aim7` (`bump 20261124-aim7 --from 20261123-aim6 --apply`, 7/7 Anker). CI, Merge und Pages werden als Ereignis nachgetragen.
- **Offen / nächster Schritt:** CI zu PR `#425`, Merge, Pages-Nachweis, Nachtragskommentar; danach Sichtung durch den Betreiber (Welle 1–10 gegen Report-Säule `early`, Rückzug nach Welle 10 ohne HP-Abgrund). Offene Balancing-Entscheidung: früher Druck in Wellen 6–10 — Ein-Zeiler an der notierten Stelle in `simulation.mjs`, danach `balance-field-report --write-baseline` neu committen.
## IPL-0130 – Spielmap im Turm-Design: 38 Deko-Sprites, Zonen mit Tiefe, Totholz (Welle `20261124-aim8`, PR `#438`)
- **Zeit / Quelle:** Sitzungsdatum 2026-11-21 UTC; Betreiber-Auftrag 2026-11-21: „Das Turm Design fänd ich an sich ganz nice … nur die Spielmap, nicht das ganze Spiel"; danach „totes Leben … Maps voller wirken lassen, aber nicht aktiv voll" und „Eiswasser und Sumpf … teilweise einfach nur braun und hingemalt … es muss Tiefe haben".
- **Block / Ziel:** Kein Spiel-Block; reine Darstellung auf der Spielmap. Kein neuer Zustand auf dem Draht; Reduced-Motion und Wetter-Schalter unberührt. Sichtung macht der Betreiber („Mach alles Live, ich teste dann").
- **Branch / Basis:** `arena/4556e0a8-0815games-github-io` ab `1354372fa07b97d39e29bebd2c776eba45473b79` (`main`, Merge PR `#425`).
- **Änderungen / Dateien:**
  - `IronPath/assets/*-sprite.png`: 30 bestehende Deko-Sprites (Basis 9, Theme 10, Talwald 4, Landmarks 7) im Stil der Türme neu generiert – dicke Tusche-Konturen, gesättigte painterly Flächen, Erd-/Stein-Plinth wie der Sandsack-Ring der Türme, eingemalter Kontaktschatten, kein Magenta-Sticker-Rand; dazu 8 neue Clutter-Motive (`barrels, cart, crates, rocks, stump, logpile, fence, signpost`) → 38 Dateien. Ersatz unter den alten Namen; Cache-Busting `?v=20261121-towerdeco1` am Deko-Loader (`cartoon-art.mjs`) und erstmals auch am Landmark-Loader (`story-map-art.mjs`).
  - `IronPath/scripts/freistellen-sprites.py` (neu): Weiß→Alpha-Pipeline – wachsende Hintergrund-Maske ab den Rändern (Neutral-Hell, Luma > 206), globaler Neutral-Hell-Pass für helle Restflächen, Schatten-Ring-Pass von der Transparenzkante (Luma > 150, gestoppt von der Tusche-Kontur), Halo-Reinigung, Crop auf die Fußlinie.
  - `IronPath/core/cartoon-art.mjs`: Grounding-Ovals im Sprite-Zweig von `drawDeco` entfernt (Plinthe und Schatten stecken im Bild, die Ovals hätten verdoppelt); `ZONE_STYLES` mit Tiefe-Attributen (`deep/halo/shade/detail`); `zoneBlob` auf 18 Segmente; `drawZone` neu nach dem Fünf-Schicht-Rezept Halo → Radial-Verlauf → Ufer-Steppschatten → geklippes art-spezifisches Interieur → Randklumpen; `zoneInterior` mit Frost-Rissen, Schlammwirbeln und -blasen, Steinfugen, Blätter-Litter und Trockenrissen; `roadZone` mit Quer-Verlauf und gesunkener Mittelrinne (`deep` in `thinIce`, `bog`, `fieldZone`); Broken Ice als offenes Dunkelwasser mit Eissplittern; `DECO_ART`-Breiten und Vektor-Fallbacks für die acht Clutter-Kinds; Gradient-Guards für headless Canvas-Mocks.
  - `IronPath/core/maps.mjs`: `decoFor`-Clutter-Pass – Zielmenge `width*height/30000` (Deckel 64), dieselben Feldregeln wie Gebäude (≥ 40 zur Straße, ≥ 58 zu Pads, ≥ 95 zum Bunker, ≥ 42 zueinander, Bounds 26), reines Dressing ohne Game-State.
  - `.gitignore`: `IronPath/preview-sprites/` (Arbeitsschicht der Generierungen) angehängt, Altbestand unverändert.
- **Prüfungen:** `node --test tests/*.test.mjs` → **1354 Tests, 1353 bestanden, 1 übersprungen, 0 Fehler**. `npm run test:stress` grün. `npm run schnelltor` „Kein Fehler, 2 Hinweis(e)". Der Maps-Test pinnte die Clutter-Abstände nach die Feldregeln (58/40); die Zonen-Gradienten laufen mit Fallback gegen die Canvas-Mocks. Nicht geprüft: Gerät/Emulator und manuelle Spielfahrt – Sichtung macht der Betreiber.
- **Git / PR / Release:** Code-Commit `c6179d0` auf dem genannten Branch, Push, PR `#438`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0110`, AUSBAU-Zeile 15, Feldnotizen `aim8` mit `pr: 438`) und Cache-Welle `20261124-aim8` (`bump 20261124-aim8 --from 20261124-aim7 --apply`). CI, Merge und Pages werden als Ereignis nachgetragen.
- **Offen / nächster Schritt:** CI zu PR `#438`, Merge, Pages-Nachweis, Nachtragskommentar; danach Sichtung durch den Betreiber (Deko-Kontrast gegen den Boden, Zonentiefe auf Eis/Sumpf, Clutter-Dichte).
## IPL-0131 – Kontrast-Lifting: Silhouetten-Schatten und Bild-Boost (Welle `20261124-aim9`, PR `#445`)
- **Zeit / Quelle:** Sitzungsdatum 2026-11-21 UTC; Betreiber-Rückmeldung nach IPL-0130: „Gehen in. Dem Hintergrund immer noch irgendwie unter." Abstimmung: betroffen = alles gleichermaßen, Ansatz = Kombination, moderat.
- **Block / Ziel:** Kein Spiel-Block; reine Darstellung. Kein neuer Zustand; die Änderung liegt im Terrain-Cache (Schatten) und in den Bilddateien (Lifting). Sichtung macht der Betreiber.
- **Branch / Basis:** `arena/b7d772a2-0815games-github-io` ab `964ebf5021f53964ca5e10e91adb5fc8b153ad5c` (`main`).
- **Änderungen / Dateien:**
  - `IronPath/core/cartoon-art.mjs`: im Deko-Sprite-Zweig von `drawDeco` Silhouetten-Schatten über die **Canvas-Shadow-API** (`shadowColor='rgba(8,12,8,.42)'`, `shadowOffsetX=1/OffsetY=3/Blur=3`, Reset nach dem `drawImage`) um das Haupt-`drawImage`. Folgt der Tusche-Silhouette, wird einmalig in den Terrain-Cache gerendert. Erste Umsetzung mit `ctx.filter='drop-shadow(...)'` zerstörte die `party-finalization-browser`- und `interface-browser-smoke`-Checks in CI (drei Läufe identisch rot; ohne Schatten alles grün → Isolation per Leer-Commit) — die Shadow-API rendert dasselbe Motiv und ist in allen Browsern stabil.
  - `IronPath/assets/*-sprite.png` (38 Dateien, alle Deko- und Clutter-Sprites): PIL-Lifting `Contrast 1.12 / Color 1.10 / Brightness 1.05` auf dem RGBA-Kanal (Alpha unangetastet) — Tusche-Konturen und Freistellung bleiben unverändert.
- **Prüfungen:** `node --test tests/*.test.mjs` → **1354 Tests, 1353 bestanden, 1 übersprungen, 0 Fehler**. `npm run schnelltor` → kein Fehler, 1 Hinweis. Review-Boards auf Wald-Grün und Wüsten-Sand gesichtet: keine Verbrände, Konturen intakt. Nicht geprüft: Gerät/Emulator — Sichtung Betreiber.
- **Git / PR / Release:** Commit `2156873` auf dem genannten Branch, Push, PR `#445`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0111`, AUSBAU-Zeile 16, Feldnotizen `aim9` mit `pr: 445`) und Cache-Welle `20261124-aim9` (`bump 20261124-aim9 --from 20261124-aim8 --apply`). CI, Merge und Pages werden als Ereignis nachgetragen.
- **Offen / nächster Schritt:** CI zu PR `#445`, Merge, Pages-Nachweis, Nachtragskommentar; danach Sichtung durch den Betreiber (flache Karte vs. Abhebung).
## IPL-0132 – Einheiten im Tusche-Flach-Stil und Weg-Fahnen entlang der Gegnerroute (Welle `20261124-aim10`, PR `#451`)

**Problem (Betreiber-Meldung):** „Soldat und Gegner passen jetzt halt so gar nicht zum restlichen design mehr" – nach IPL-0130/0131 (dicke Tusche, satte Flächen bei Deko und Türmen) liefen die sieben Einheiten-Sprites noch in der alten, gedämpft-realistischen Malweise. Zweitens der Wunsch: „mehr Flaggen um den Weg, den die Gegner langlaufen" – am Weg stand bisher nur die Bunkerfahne (IPL-0128).

- **Sieben Einheiten-Sprites neu im verbindlichen Referenzstil (`mg2`/`cannon2`):** `hero2`, `infantry2`, `tank2`, `plane2`, `train2`, `bossheavy2`, `bossplane2` – erzeugt, Weiß→Alpha über die Freistellen-Pipeline, danach in die Canvas-Maße und Inhalts-Boxen der alten Dateien eingepasst (kein Layout-Shift, keine Verzerrung). Orientierungen exakt wie bisher: Hero und Boss-Panzer nach rechts, Infanterie, Panzer, Flugzeuge und Lokomotive nach links. Feindliche Einheiten tragen das rote Akzent der Bosse (Kragen/Armband bzw. Wimpel).
- **Weg-Fahnen als Vektorart im Terrain-Cache:** `drawPathFlags` (exportiert), aufgerufen nach den Zonen, vor dem Deko-Layer. Paare beidseitig, **36 px** vom geglätteten Mittelpunkt (Fahrbahn 30, Einheiten-Korridor ±14,1 – die Pole stehen auf der Schulter), alle **~125 px** Arclänge, `inset 70`/`outset 90` (Spawn und Bunker frei). Bunkerfahnen-Sprache: Holzmast, Kugel, rot/creme wechselnder Wimpel mit Tusche-Kontur; `roadHash`-deterministisch, **vollständig statisch** (Reduced-Motion- und Wetter-Vertrag intakt, kein Sim-State). Gilt für alle `paths` – jede Gegenspур inkl. Schiene, Story- und Vier-Spieler-Karten. Reihenfolge Zones → Flaggen → Deko: bei seltener Berührung liest sich die Tiefe korrekt. **Dichte `forest`: 22 Fahnen** (11 Marken × 2), vorher 0 am Weg.

**Prüfungen:** neu `IronPath/tests/path-flags.test.mjs` (3 Cases: Paare ±36 px mit exakter Arclength-Dichte und Leerpfad-Guard; Determinismus – zwei Läufe identisch – und rot/creme-Wechsel; echte Schulter-Distanzen auf `forest` 30–36,5 px). Suite **1357 pass / 1358, 0 fail**; `schnelltor` ohne Fehler. Sicht-Boards: `preview-sprites/review-units-board.png` (alt/neu je Einheit) und `preview-sprites/review-flags-forest.png` (Fahnen auf echter `buildRoadPath`-Geometrie mit Fahrbahn-Bändern und Einheiten-Korridor).

**Git / PR / Release:** Commit `f1f92cf` auf dem genannten Branch (7 Sprites, Fahnen-Code, Test), Push, PR `#451`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0112`, AUSBAU-Zeile 17, Feldnotizen `aim10` mit `pr: 451`) und Cache-Welle `20261124-aim10` (`bump ... --from 20261124-aim9 --apply`). Sprite-Cache-Token `?v=20261121-towerdeco1` → `?v=20261124-aim10`, damit die neuen Einheiten auch bei wiederkommenden Spielern landen. Nach grünem CI gemergt: `gh pr merge 451 --merge` → Merge-Commit `349e208`, alle 12 IronPath-Checks pass (der externe `Vercel – pipboy3003`-Check failte unabhängig von diesem PR); Pages `built`, Nachtragskommentar `#issuecomment-7154930760`.

## IPL-0133 – Toon-Boden: flache Platten mit Tusche-Nähten statt Öl-Mosaik (Welle `20261125-aim11`, PR `#454`)

**Problem (Betreiber-Meldung):** „Schaut ganz gut aus, jetzt passt aber der Hintergrund der Karte auch nemme ganz so…" – nach IPL-0130–0132 (Deko, Schatten, Einheiten im Tusche-Flach-Stil) wirkte der Boden gemutet: gefiedertes Öl-Mosaik, blasser Tint-Schleier, starker Oliv-Cast. Entscheidung per ask_user: **Toon-Boden (Neumalerei)** statt reiner Farbkorrektur.

- **Mosaik → flache Platten mit Tusche-Nähten:** `paintTileMosaic` clippt jeden Patch hart an der Blob-Kante (Federrand-`destination-in` raus) und stroke't dieselbe Path mit Sprite-Ink (2,4 px). Darunter pro Theme eine **gewichtete Flat-Platten-Palette** `GROUND_PLATES` (9 Themes, aus den `terrain3`-Platten per Median-Cut abgeleitet + Akzent-Slot: Rost/Warmweiß/Moos); hellste Farben am häufigsten, Dunkeltöne als Schattenplatten. Die gemalte Platte flüstert nur noch mit **α .32** – Textur ohne Collage.
- **Blasser Tint raus:** `GROUND_TINTS`-Waschschleier (5 Pastellfarben) komplett entfernt.
- **Oliv-Cast halbiert:** `.14 → .08`; Vignette bleibt (Rahmen-Tiefe).
- **Boden-Detailflecken in Tusche:** die großen Theme-Wasch-Ellipsen tragen jetzt eine Haarlinien-Kontur in Sprite-Ink (α .16–.24) – flache gemalte Bodenplatten statt nebeliger Schleier.

Nur Darstellung, kein Sim-State, kein Wire-Format, statisch im Terrain-Cache (Reduced-Motion/Wetter unberührt). Story-Maps behalten ihre eigene Story-Kunst (`drawStoryTerrain`); die Boden-Platten selbst blieben bilddatei-unverändert – der Unterschied entsteht komplett im Paint-Pfad.

**Prüfungen:** Suite **1357 pass / 1358, 0 fail** (alle visuellen Tests grün: field-visuals, battle-art, road-design, zone-interior, path-flags); `schnelltor` ohne Fehler. Sichtboard mit echter Weggeometrie, Straße, Fahne, Soldat, Panzer und Hütte: `preview-sprites/review-toon-ground.png` – drei Vorstufen (Foto-Mosaik-Stroke, Posterize-Bake) wurden verworfen, nur die flache Plattenvariante liest sich wie die Einheiten.

**Git / PR / Release:** Commit `224df68` auf dem genannten Branch (Paint-Pfad, Paletten, Test-Suite grün), Push, PR `#454`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0113`, AUSBAU-Zeile 18, Feldnotizen `aim11` mit `pr: 454`) und Cache-Welle `20261125-aim11` (`bump ... --from 20261124-aim10 --apply`). Nach grünem CI gemergt: `gh pr merge 454 --merge` → Merge-Commit `a4a0250`, alle 11 IronPath-Checks pass (der externe `Vercel – pipboy3003`-Check failte unabhängig von diesem PR); Nachtrags-PR `#457` → `0b4e75a`; Pages `built`, Nachtragskommentar `#issuecomment-7157433650`.

## IPL-0134 – Power-Governor: Frame-, DPR- und Effekt-Regelung gegen Hitze und Akku (Welle `20261125-aim12`, PR `#463`)

**Problem (Betreiber-Meldung):** „Gerät wird schon ganz schön heiß beim spielen. Bekommen wir das irgendwie reguliert?" – Bestandsaufnahme: der Toon-Boden wird einmal in den Terrain-Cache gemalt, die Dauerlast sitzt in der Render-Schleife, die bisher bei **jedem** rAF-Frame (60–120 Hz) das ganze Feld in voller Pixeldichte gemalt hat (Backing-Store bis DPR 3).

**Lösung – ein Governor, der nur die Darstellung drosselt (`core/power-governor.mjs` + vier Integrationsstellen in `game.js`):**
- **Drei Stufen:** `full` = unverändert; `eco` = Paint-Lücke ≥30 ms (~30 fps), DPR max 2; `max` = ≥40 ms (~20 fps), DPR max 1,5, Wetter-/Tracer-Effekte aus. Die **Simulation läuft bei jedem rAF weiter** (`update(dt)` vor dem Paint-Gate, Paint im Slot via `lastDrawAt`).
- **Frame-Signal:** EMA der rohen rAF-Lücke – >26 ms über 4 s → Stufe runter (5 s Mindestabstand), <18 ms über 20 s → Stufe hoch; ein einzelner Tab-Resume-Sprung zählt nicht. Die rohe Lücke (nicht die Paint-Dauer) kann durch das eigene Frameskippen nicht gefaked werden.
- **Akku-Signal** (`navigator.getBattery`, feature-detected): ohne Netz ≤30 % → mindestens `eco`, ≤15 % → `max`; am Netz frei. Fehlt die API, gilt nur das Frame-Signal.
- **Vertrag:** Spielereinstellungen (Grafik-Schalter, Wetter, Tracer) werden nie aufgeweicht, nur per UND gedrosselt (eigene + Gegner-Spur); jede Stufe kehrt von selbst zurück. Kein Sim-State, kein Wire-Format, Reduced-Motion unberührt; Wechsel per `console.debug('IronPath: power policy -> …')`.

**Prüfungen:** neu `tests/power-governor.test.mjs` (7 Cases: Policy-Tabelle, Slow-Hold → eco → max, Einzel-Spike, Erholung, Akku-Floor + Freigabe, defekter Probe); die 13 Game-UI-Test-Harnesses listen den neuen Import; `endless-retreat-viewport` prüft Paints mit 50-ms-Slots (die 50-ms-Wellen-Steps sind für den Governor ein kämpfendes Gerät – genau die Regelung, die bestätigt wird). Suite **1364 pass / 1365, 0 fail**; `schnelltor` ohne Fehler.

**Git / PR / Release:** Commits auf dem genannten Branch (Modul, Tests, game.js-Integration, Harness-Anpassungen), Push, PR `#463`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0114`, AUSBAU-Zeile 19, Feldnotizen `aim12` mit `pr: 463`) und Cache-Welle `20261125-aim12` (`bump ... --from 20261125-aim11 --apply`). Nach grünem CI gemergt: `gh pr merge 463 --merge` → Merge-Commit `e02dddc`, alle 11 IronPath-Checks pass (der externe `Vercel – pipboy3003`-Check failte unabhängig von diesem PR); Pages `built`, Nachtragskommentar `#issuecomment-7160341519`.

## IPL-0135 – Command Center kompakt: Field-Buttons in die Settings, Raster zentriert (Welle `20261125-aim13`, PR `#469`)

**Problem (Betreiber-Screenshot):** Auf dem Computer wirkte die Aufteilung auseinandergezogen – vier Utility-Buttons schwebten in leerer Fläche, die Spalten liefen über die volle Bildschirmbreite auseinander, „Choose an operation" hängt unten in seiner Spalte.

**Änderungen:**
- **Utilities halbiert:** `FIELD NOTES` und `FIELD TUTORIAL` sitzen jetzt als Card „FIELD & HELP" im Settings-General-Panel (gleiche IDs → Handler, Tour-Inspects und Feature-Gates laufen weiter); FIELD TUTORIAL schließt die Settings vor dem Coach-Start. Im Hauptmenü bleiben nur **SETTINGS** und **SIGN OUT**. Der Confirm-Flow „PLAY THE FIRST RUN AGAIN" (`settingsTutorialReset`) bleibt in OPERATION & TRAINING.
- **Desktop-Raster:** `#commandCenter` bekommt ab 860 px `max-width: 1240px; margin-inline: auto`; der nav-head steht `align-self: start` statt `end` (rechte Spalte beginnt direkt unter dem Hero).
- **DE-Strings** für den neuen Card in `i18n/localization-settings-de.mjs` (`FIELD & HELP`, `Field Notes`, `Field Tutorial`).

**Verträge:** `menu-redesign` (Utilities = `[menuSettings, menuLogout]`, beide Feld-IDs im General-Panel), `patch-notes` (Position in `settingsPanelGeneral`), `settings` (IDS + beide Buttons), Browser-Smoke `command-center.cjs` (2 Utilities; FIELD NOTES/FIELD TUTORIAL sichtbar im General; die Restart-Flows öffnen erst die Settings; der Dossier-Flow klickt `#menuTutorial` von dort). Unverändert grün: `command-center`, `tutorial-dossier`, `first-run-layout`, `field-signout`, Tour-Inspects.

**Prüfungen:** Suite **1364 pass / 1365, 0 fail**; `schnelltor` ohne Fehler; Smoke-Fix nach zwei CI-Läufen grün (die Utility-Count- und Sichtbarkeits-Verträge mussten der beauftragten Bewegung folgen).

**Git / PR / Release:** Commits auf dem genannten Branch (index.html, menu-redesign.css, command-center.mjs, localization-settings-de, Tests, Browser-Smoke), Push, PR `#469`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0115`, AUSBAU-Zeile 20, Feldnotizen `aim13` mit `pr: 469`) und Cache-Welle `20261125-aim13` (`bump ... --from 20261125-aim12 --apply`). CI, Merge und Pages werden als Ereignis nachgetragen.

## IPL-0136 – Character Hub: Paper-Doll mit drei Slot-Karten im Dossier (Welle `20261125-aim14`, PR `#479`)

**Auftrag (Betreiber-Entscheidungen per Rückfrage):** Dossier ausbauen (nicht neuer Screen) · Darstellung „Figur + Slot-Karten drumherum" · Reihenfolge **Hub → Fund → Optik** · Fund-System als Wellen-Belohnung mit Item-Chance (kommt in Welle B).

**Änderungen:**
- **Panel01 „Current equipment (ONE SLOT)" → „FIELD LOADOUT (3 SLOTS)":** das Porträt steht als Figur in der Mitte der Paper-Doll, GEAR links, WEAPON rechts, GADGET unten – jede Slot-Karte nennt das getragene Stück und seinen Effekt (Workshop-Catalog/Preistrophy/Legacy-ITEMS). Identitäts-Rail behält Name/Rang/XP/Skill, nur das Porträt wandert in die Doll.
- **Inline-Picker:** Klick/Enter auf eine Karte öffnet die owned-Liste des Slots mit EQUIP/UNEQUIP; jede Änderung läuft über den bestehenden Workshop-Service (`workshopService.command({type:'equip'})` → `onProfile`), Statuszeile wie im Armory (Saving…/Saved/locked). Ohne vorbereitetes Workshop zeigt der Picker den Armory-Hinweis.
- **Legacy-Note:** das alte One-Slot-Stück wird benannt („still counts in your combat profile"); Collection-Panel03 unverändert.
- **`slotOf`** exportiert aus `workshop/workshop-model.mjs`; neue DE-Strings für alle Oberflächenliterale (translation-coverage grün).

**Verträge:** `soldier-screen.test` neu (5 Tests inkl. Equip-Flow mit Fake-Service und Wire-String-Fixture `encodeWorkshop`); Browser-Smoke `command-center.cjs` liest `#soldierSlotWeaponName`/`#soldierSlotGearName` statt `#soldierEquipped`; ID-Liste im Markup-Test um Doll-/Slot-/Picker-IDs aktualisiert; CSS-Test pinnt den Doll-Stack im Phone-Layout.

**Prüfungen:** Suite **1365 pass / 1366, 0 fail**; `schnelltor` ohne Fehler; alle 11 IronPath-Checks grün (der externe `Vercel – pipboy3003`-Check failt unabhängig).

**Git / PR / Release:** Commits auf dem genannten Branch (index.html, soldier-screen.css, soldier-screen.mjs, account.js, workshop-model, localization-de, Tests, Smoke), Push, PR `#479`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0116`, AUSBAU-Zeile 21, Feldnotizen `aim14` mit `pr: 479`) und Cache-Welle `20261125-aim14` (`bump ... --from 20261125-aim13 --apply`). CI, Merge und Pages werden als Ereignis nachgetragen.

## IPL-0137 – Alles gleichzeitig: equipped wird die Taken-Liste, kein Slot-Wettbewerb mehr (Welle `20261125-aim15`, PR `#483`)

**Auftrag (Betreiber-Rückfrage `slot-system` = „alles gleichzeitig", verbindlich):** Jedes angelegte Stück zählt gleichzeitig; nichts assert etwas (Weste + Schuhe + Radio + Waffe parallel), Boni stapeln. Toggle (an/aus) bleibt; kein Slot-Ersatz mehr. Auslöser: Betreiber meldete „Veste legt Schuhe ab" – Analyse zeigte Slot-Konkurrenz (legacySlots teilen `gear`), keinen Defekt.

**Änderungen:**
- **`workshop-model` v2:** `equipped` ist die Taken-Liste (Array). `migrateWorkshop` zieht beim Erst-Read alles, was das Konto besitzt; `craftWorkshop` nimmt Frisch-Crafts sofort; `toggleEquipped` ersetzt den Slot-Equip (Slot-Argument wird ignoriert, alte Aufrufer harmlos); `unlockPrestige` ergänzt owned+equipped.
- **`workshop-wire` v2:** encodet `[2,components,owned,taken,mods]`, liest das alte Drei-Slot-v1 weiter und migriert es zu „alles anziehen"; Profil-Reducer behalten ihre Signaturen; `meltWorkshop`/`meltPrestige`/`completeStoryMission` laufen auf der Liste; Match-Loadout-Encoder/Decoder bei `protocol` 2.
- **Effects/Coop:** `captureWorkshopLoadout`/`workshopEffects` akzeptieren beliebige, eindeutige Item-Mengen `{id,mod}` (kein Slot-Feld mehr); `workshop-multiplayer` `protocol=2`, Lock/Verify wie gehabt.
- **UI:** Dossier-Picker und Armory-Werkstatt sind TAKE/TAKEN/TAKE-OFF-Toggles (Command `{type:'equip',item}`); die Figurenkarten zeigen jedes getragene Stück ihrer Kategorie (`NOTHING TAKEN` ohne); Armory-Sektion „Taken right now" statt Slot-Karten; neue DE-Strings.
- **Profil-Stats:** `core/soldier-profile.mjs` und die HERO-DAMAGE-Zeilen in `account.js` lesen die Taken-Liste über dieselben `workshopEffects` wie der Match (Fallback: alter Ein-Slot-Index), die Collection-Flags folgen der Liste.
- **Cache-Welle** `20261125-aim15` (`patch.mjs bump ... --from 20261125-aim14 --apply`,79 Dateien); patch-notes-Welle `aim15` (`pr: 483`).

**Verträge:** `workshop-{model,wire,effects,multiplayer,solo,view,account,transactions}` und `prestige-campaign`, `relics`, `balance-suite`, `soldier-*`, `solo-deployment`, `progression-service` auf v2 umgeschrieben; Emulator-Regeltests `workshop-storage`/`workshop-draft` folgen der Taken-Liste (auto-take + Toggle); Smoke `command-center.cjs` pinnt `NOTHING TAKEN` und den TAKEN-Toggle der Werkstatt.

**Prüfungen:** Suite **1365 pass / 1366, 0 fail**; `schnelltor` „Kein Fehler, 2 Hinweis(e)" ohne Zugangsdaten-Muster; Stress grün; alle 11 IronPath-Checks grün (der externe `Vercel – pipboy3003`-Check failt unabhängig).

**Git / PR / Release:** Branch `arena/4f288910-0815games-github-io` ab `cf1d0ca`; Commits `cd8a8c9` (Kern+Tests), `f544854` (patch-notes pr:483), `eaf8d5c`/`fefbdbc` (Emulator-Regeltests); Push, PR `#483`. Während der CI-Phase war GitHub-API-instabil (502/500 auf Mutationen, tote Push-Events); Close/Reopen brachte PR-Head und Checks auf den finalen Commit. CI: 11/11 grün, Merge `3c33b982` (2026-11-25 16:30:54Z). Pages und Betreiber-Kommentar werden als Ereignis nachgetragen.

**Offen / nächster Schritt:** Pages-Lauf + Kommentar nachtragen; dann Welle B (Fund-System „FOUND"), danach Welle C (Armory-Optik).

## IPL-0138 – Fund-System „FOUND" im Bericht: jede Welle würfelt, der Bericht bietet Anziehen oder Lager (Welle `20261121-fund1`, PR `#487`)

- **Was:** Aus dem `ask_user` zwei verbindliche Antworten. (a) **Jede Welle**: ab Welle 1 würfeln alle abgeschlossenen Wellen mit **15 %** auf ein zufällig noch nicht besessenes der zehn Legacy-Teile – die Anker-Wellen 2/4/…/20 sind abgeschafft, und die Welle bleibt die einzige Item-Quelle (kein Kistensystem, keine Doppelquelle). (b) **Wahl im Bericht**: FOUND zeigt die Funde mit [TAKE] (anlegen über den Workshop-Service) und [STORE] (Einlagern-Vermerk) – nichts zieht sich still selbst an; getragen bleibt die Toggle-Liste aus IPL-0137.
- **Mechanik:** `rewardWave(value, wave, rng)` würfelt gegen den Pool der fehlenden Bits (`FIND_CHANCE = 0.15`; Chance und Auswahl laufen über `rng`, damit Tests deterministisch bleiben). Die Doppel-Fund-Regel (+10 Extra) ist entfallen, `+10` Schrott pro Welle bleibt. `rewardDelta` liefert neben `items` (Namen) jetzt `foundIds` (`legacy-N`) für die Buttons; Solo- und Coop-Credit reichen `rng` durch. Erwartete Wellen bis alle zehn: H10 / 0,15 ≈ 20 – derselbe Horizont wie der alte Ankerplan.
- **Prüfung:** Suite **1368 pass / 1369, 0 fail** – neu `fund-system.test.mjs` (kein Ankerplan, keine Duplikate, der Fund zieht nie allein an, der Delta nennt die Fund-ID), Anker-Tests auf den neuen Würfel umgestellt, UI-Harness-Listen kennen `armory`/`workshop-wire`, DOM-Stubs guarden die Fund-Zeilen; `schnelltor` „Kein Fehler, 2 Hinweis(e)".
- **Git / PR / Release:** Branch `arena/3a67c99d-0815games-github-io` ab `ebb73c33`; Commits `2cb832d` (Fund + Report-Wahl), `b93f731` (Amend), `a223fb9` (Cache-Welle `20261121-fund1`, 88 Dateien, Doku), `2b3f15ab` (einheitlicher `armory`-Token), Test-Fixes `30df04f`…`3d26d416` (Emulator-Pins folgen dem Fund: Doppel-Bonus raus, Cold-Roll-Rng, Log-Capture für die Workshop-Steps); Push, PR `#487`, CI grün (externes Vercel-Rate-Limit ohne Einfluss), Merge `5f1d5ab`. Pages und Betreiber-Kommentar werden als Ereignis nachgetragen.
- **Offen / nächster Schritt:** Pages-Lauf + Kommentar nachtragen; dann Welle C (Armory-Optik), danach Skills-Optik.

## IPL-0139 – Dossier: RPG-Plätze für die Waffen + gemaltes Item-Artwork (Welle `20261121-dossier1`, PR `#491`)

- **Was:** Aus dem `ask_user` zur Betreiber-Sichtung auf #487 („das sieht Scheiße aus… richtige Plätze… gerne Bilder… ARTE"). Nur das Dossier, nicht die Werkstatt: Die Figurenkarten sind jetzt ein klassisches RPG-Ladeout-Board um die Figur – Waffe in der Hand, Weste auf der Brust, Schuhe an den Füßen, Rest-Ausrüstung an der Hüfte, Gadgets am Gurt. Jeder Platz zeigt das Artwork des getragenen Stücks, die Picker und die Sammlungsliste ebenfalls.
- **Artwork:** Alle 26 Stücke haben gemaltes Item-Artwork im Armory-Stil (painterly, Olive/Sand, gewebter Grund wie `armory-kit.jpg`): zehn Legacy-Fundstücke (Scope, Vest, Boots, Binoculars, Field Radio, Satchel, Pouch, Manual, Badge, Tank Kit), vier Craft-Stücke (Marksman Rifle, Mechanic Kit, Tactical Radio, Field Boots) und zwölf Prestige-Stücke — in drei Batches über `#491`, `#493` und den Abschluss-PR nachgeliefert (Bildkontingent pro Turn).
- **Mechanik unangetastet:** `slotOf` bleibt die drei Slots weapon/gear/gadget, Toggle-Ausrüstung (IPL-0137) und Fund (IPL-0138) unverändert – die Platz-Aufteilung ist reine Darstellung (`placeOf`: boots=`legacy-3`/`boots`, vest=`legacy-2`/`prestige-convoy-plate`, der Rest gear). Neue Platz-IDs `soldierSlotVest`/`soldierSlotBoots` neben den bestehenden; i18n `VEST`/`BOOTS`/`5 PLACES`; Cache-Welle `20261121-dossier1` auf Screen, CSS, Workshop-De und Patch-Notes.
- **Prüfung:** Suite 1368 pass / 1 skipped (Shallow-Checkout-Skip, lokal ohne vollen Git-Checkout), 0 fail; `soldier-screen.test.mjs` pinnt die fünf Plätze und den Boots-Platz; Browser-Pins (`soldierSlot*Name`, Sammlungsliste) unverändert grün; `schnelltor` „Kein Fehler".
- **Git / PR / Release:** Branch `arena/d9f74ff0-0815games-github-io` ab `3fb0923`; Commits `f16c0eb` (Plätze + Artwork, 109 Dateien mit den zehn Legacy-Bildern), `e2d0ea2` (PR-Nummer), Merge-Basis `cdb84850` nach Parallel-Merge #489 (der erste CI-Lauf scheiterte am verschobenen `origin/main`-Basisvergleich), Push, PR `#491`, CI grün, Merge `2c3115c2`. Nachlauf `#493` (Craft + sechs Prestige, Merge `07dc2ea4`) und Abschluss-PR (letzte sechs Prestige) komplettieren die 26 Bilder.
- **Offen / nächster Schritt:** Craft- und Prestige-Artwork nachliefern; danach die Skills-Optik.

## IPL-0140 – Inventar-Look: EQUIPMENT-Plätze, INVENTORY-Raster, ITEM DETAILS in Dossier und Werkstatt (Welle `20261121-inventory1`, PR `#499`)

- **Was:** Aus dem `ask_user` drei verbindliche Antworten zum Referenz-Board (Desktop + Mobile): **Scope = Dossier + Werkstatt**, **voll interaktiv** (Kategorie-Tabs filtern echt, Suche filtert nach Namen, Zellenklick öffnet ITEM DETAILS mit großem Bild, Typ, Effekt und ANZIEHEN/ANGEZOGEN-Toggle über den bestehenden Workshop-Service), **alle 26 Stücke als Fortschrittsraster** (besessen gefüllt, fehlend gestrichelt mit Herkunfts-Hinweis: Welle/Werkstatt/Mission).
- **Dossier:** Die fünf Plätze werden zu runden Messing-Slots mit Nummern-Badges (1–5) um die Figur; Panel 03 wird zum INVENTORY mit Tab-Leiste (ALLE/WAFFE/AUSRÜSTUNG/GERÄT), Suchfeld, Zellenraster und ITEM-DETAILS-Panel darunter. Dialogbreite `min(1180px,95vw)`, Desktop zweispaltig (Last-Loadout+Profil links, Inventar rechts), Phone weiter gestapelt. Namens-Captions unter den Plätzen bleiben, Effekt zieht mit in die Details.
- **Werkstatt:** Gleiche Panel-Sprache – geschraubte Panels, DIN-Header, Messingrahmen, gemaltes Artwork auf Karten (gemeinsames `ui/item-art.mjs`), grüne EQUIP-Buttons; alle gepinnten Texte/Buttons (PREPARE/CRAFT/TAKE/MODIFY/INSTALLED/RETRY) bleiben.
- **Mechanik unangetastet:** `slotOf`, Toggle (0137), Fund (0138), Craft-Bestätigungen, alter Ein-Slot-Armory-Pfad – nur Darstellung.
- **Prüfung:** Suite **1370 pass / 0 fail / 1 skip** (Shallow-Checkout-Skip lokal; zwei Fails nur am `pr:0`-Platzhalter bis zur PR-Nummer) – neu: Filter-/Details-Tests im `soldier-screen.test.mjs` (Tabs, Suche, Herkunfts-Hinweise, Toggle über den Service), Browser-Pins zeigen26 Zellen + `.is-owned` + Details; `workshop-view.test.mjs` unverändert grün; `schnelltor` ohne Fehler (gleicher Platzhalter).
- **Git / PR / Release:** Branch `arena/2f95b5e0-0815games-github-io` ab `4871272d`; Commits `9d89a5e` (102 Dateien: Ringe, Raster, Details, Werkstatt-Restyle, `item-art.mjs`), `bdbcc20` (PR-Nummer), `f82457d` (Wallet-Case-Fix nach dem roten `interface-browser-smoke`: `text-transform:uppercase` machte `50 scrap` zu `50 SCRAP`), Push, PR `#499`, CI grün, Merge `f179f195`.
- **Offen / nächster Schritt:** Skills-Optik.

## IPL-0141 – Skills-Optik: das Fortschrittsfenster im Brett-Look von Dossier und Werkstatt (Welle `20261121-skills1`, PR `#506`)

- **Was:** Letzte Stufe der Optik-Leiter nach dem `go` des Betreibers: `skill-menu.css` wird vollständig in die Referenz-Sprache gebracht — Dialograhmen wie die Feldakte, Hero-Leiste, geschraubte Messing-Platte für die Punktanzeige, eckige Messing-Tabs (ASSAULT…ALL), geschraubte Panels für Inspector und Build-Zusammenfassung, grüner Feldknopf für die Klassen-/Freischalt-Aktion, DIN-Header in den Gruppenüberschriften, dunklere Plattflächen für alle Skill-Karten. Reines CSS: kein DOM-Eingriff, keine Mechanik (Entwurf/Reset/Save, Draft-Status), keine neuen Strings.
- **Zustände bleiben lesbar:** `is-unlocked`/`is-active`/`is-selected`/Capstone behalten Farbe UND Textlabel; Legend unverändert. Bewusst kein `text-transform` auf `.skill-card-name`, `#skillDetailText` und `#skillStatus` — diese Texte pinnen Browser-Tests per `innerText` (Lesson aus IPL-0140 „50 SCRAP").
- **Prüfung:** Suite 1372+2 pr-Platzhalter/1 (Skill-Gruppe 20/0 inkl. neuem Style-Pin), Schnelltor nur pr-Platzhalter; neuer Pin `skill-menu-style.test.mjs` (Platte/Schrauben/Brass/Field-Button + kein `text-transform` auf `.skill-card-name`/`#skillDetailText`/`#skillStatus` + Mobile-Scroll-Architektur).
- **Git / PR / Release:** Branch `arena/dfa2a3b8-0815games-github-io` ab `418933be`; Push, **PR `#506`**, Suite 1372+2 pr-Platzhalter, CI (`game-regressions`/`interface-browser-smoke`/`database-rules`/party-finalization) — alle Checks grün, **Merge `61565fbd` auf `main`**. Doku-PR im Anschluss.
- **Offen / nächster Schritt:** Optik-Leiter vollständig (Command Center · Dossier · Werkstatt · Skills).

## IPL-0142 – PWA-Manifest: Home-Screen-Icon öffnet das Spiel statt `assets/index.html` (Welle `20261121-pwa1`, PR `#514`)

- **Was:** Der Bericht des Betreibers — beim Speichern von IronPath als Web-App am Home-Bildschirm entsteht immer `https://0815games.github.io/IronPath/assets/index.html`, obwohl nur `/IronPath/` aufgerufen wird. Ursache: `assets/manifest.webmanifest` hatte `"start_url": "./index.html"` (und kein `scope`); relative URLs im Manifest werden gegen die Manifest-URL aufgelöst, also `…/IronPath/assets/index.html`. iOS (16.4+) speichert genau diese aufgelöste start_url am Icon. **Fix:** `start_url` und `scope` = `/IronPath/` — dieselben Werte, die `release-tools/stage-version.mjs` für gestagte Builds schon schreibt (die Quelle, die GitHub Pages direkt ausliefert, war nie repariert).
- **Cache:** Alle vier Asset-Links (favicon.svg/ico, apple-touch-icon, manifest) auf `?v=20261121-pwa1` — iOS cached Manifests hart; ohne Stempel bleibt das alte Manifest im Cache. `loading-scene.test.mjs` trägt denselben Wellen-Token.
- **Prüfung:** Neuer Pin `pwa-manifest.test.mjs` (löst start_url/scope wie ein Browser gegen die Manifest-URL auf und fällt bei jedem Rücksprung unter `/IronPath/assets/`; vier Asset-Links teilen einen Token); Pin-Gruppe 17/0, Suite 1374+2 pr-Platzhalter/1, Schnelltor nur pr-Platzhalter.
- **Git / PR / Release:** Branch `arena/32003763-0815games-github-io` ab `998e234`; Push, **PR `#514`**, Suite 1374+2 pr-Platzhalter, CI (`game-regressions`/`interface-browser-smoke`/`database-rules`/party-finalization) — alle Checks grün, **Merge `9d5527ec` auf `main`**. Doku-PR im Anschluss.
- **Offen / nächster Schritt:** Nach dem Deploy das alte Home-Screen-Icon einmal entfernen und neu hinzufügen — iOS hält die am Icon gespeicherte URL fest.

## IPL-0143 – Skills-Hierarchie: nummerierte Kapitel, Pfad-A/B-Spaltenköpfe, Fortschritts-Chips (Welle `20261121-skills2`, PR `#518`)

- **Was:** Rückmeldung des Betreibers nach IPL-0141 — „Skills sieht immer noch sehr unübersichtlich aus, vorallem die Unterkategorien in den Hauptkategorien." Struktur-Redesign des Klassenbaums (Phase 2) in `ui/development-ui.mjs` + `skill-menu.css`, **Mechanik unangetastet** (Entwurf/Save/Reset, `parseBuild`, Tabs/Filter, Zustands-Semantik + Legend, Daten-Attribute `data-path`/`data-rank`/`data-phase`/`data-lane`/`data-tier` bleiben):
  1. **Jede Unterkategorie wird ein nummeriertes Kapitel** im eigenen vertieften Panel (Pfad-Kante am Panel): 01 Training · 02 Spezialistenpfade · 03 Meisterschaft · 04 Klassenkombos — Messing-Nummernplakette, Zweck-Zeile linksbündig unter dem DIN-Titel, Fortschritts-Chip (`2/3`, nur Zahlen, keine neuen Strings).
  2. **Spezialisten-Pfade bekommen echte Spaltenköpfe** `PFAD A` / `PFAD B` (+ Spezialisten-Name) über den jeweiligen Spalten — Doktrinen hängen sichtbar unter ihrem Pfad statt zwischen den Pfaden zu schweben (Karten bleiben direkte Grid-Kinder, Connectoren/`data-lane`-Pins der Tests unverändert).
  3. Klassenwähler (Phase 1) nutzt dieselbe Titel-Box ohne Nummer/Chip.
- **i18n:** keine neuen Strings (Pfad A/B, Kapiteltitel, Untertitel existieren in `localization-skills-de.mjs`; `'ACTIVE ABILITY'` liegt in `localization-de.mjs`, `'MASTERY / CAPSTONE'` in `localization-advanced-skills-de.mjs`).
- **Prüfung:** `development-ui.test.mjs` um Kapitel-/Lane-Struktur ergänzt (17-Buttons-Pin bestätigt weiter) · `skill-menu-style.test.mjs` pinnt Plakette/Panel/Lane-Kopf · Pin-Gruppe 7/0, Suite 1375+2 pr-Platzhalter/1, Schnelltor nur pr-Platzhalter.
- **Git / PR / Release:** Branch `arena/c694b6c4-0815games-github-io` ab `bbc9f7e5`; Push, **PR `#518`**, Suite 1375+2 pr-Platzhalter, CI (`game-regressions`/`interface-browser-smoke`/`database-rules`/party-finalization) — alle Checks grün, **Merge `1b18fb2f` auf `main`**. Doku-PR im Anschluss.
- **Offen / nächster Schritt:** Sichtung durch den Betreiber; bei Bedarf Folge-Feinlesen (z. B. Klappbarkeit).

## IPL-0144 – Skills pro Klasse: klasseneigenes Chrome + Auswahlreihe verschwindet nach der Wahl (Welle `20261121-skills3`, PR `#525`)

- **Was:** Rückmeldung des Betreibers nach IPL-0143 („Optisch sieht das schon mal ganz geil aus"): (1) nach der Klassenwahl soll das Skill-Fenster **pro Klasse optisch eigen** sein, (2) die **Auswahlreihe oben** (Klassen-Tabs) soll **komplett verschwinden**, sobald eine Klasse feststeht — „lässt das ganze sauberer wirken".
  1. **`is-class-themed`-Modus** (nur Phase 2, gesetzt von `renderSkillTree` über `container.closest('#skillDialog')`): Akzent-Band am Header (`inset 0 4px 0` in der Klassenfarbe), Kopfverlauf mit `color-mix`-Tönung, Kicker in Klassenfarbe, Rahmen des Fensters und Haarlinie der Aktionsleiste getönt — dazu der schon vorhandene Klassen-Hero, pfadfarbene Kapitel-Panels, Spaltenköpfe und Kartenkanten. **Phase 1 (vor der Wahl) bleibt pixel-identisch** (`--skill-accent`-Default `#d8c596`, themed-Regeln greifen nur unter `.is-class-themed`).
  2. **`renderSkills` setzt `hidden` auf `.skills-tabs`**, sobald `classId` gesetzt ist (neben der bestehenden Button-Logik); CSS-Sicherung `#skillDialog .skills-tabs[hidden]{display:none}` (display:flex schlägt sonst die UA-Regel). Nach Reset/Abwahl erscheint die Reihe wieder.
- **Mechanik unangetastet:** Draft/Save/Reset, `parseBuild`, Filter (`#skillFilter` bleibt), aria-Pressed-Logik der Buttons bleibt (Browser-Pins `[data-skill-path]` getAttribute/isHidden laufen weiter — versteckter Vorfahre erfüllt `isHidden`), Zustände + Legend, Mobile-Scroll-Fixes.
- **i18n:** keine neuen Strings.
- **Prüfung:** `skill-menu-style.test.mjs` pinnt Default-Akzent, Header-Band/-Tönung, Rahmen-Mix, Aktions-Haarlinie, Kicker, themed-only-Opt-in und `[hidden]`-Guard; Pin-Gruppe 8/0, Suite 1376+2 pr-Platzhalter/1, Schnelltor nur pr-Platzhalter.
- **Git / PR / Release:** Branch `arena/02764ced-0815games-github-io` ab `d3ab5029`; Push, **PR `#525`**, Suite 1376+2 pr-Platzhalter, CI (`game-regressions`/`interface-browser-smoke`/`database-rules`/party-finalization) — alle Checks grün (ein Flake in `party-offline-modes` des ersten Laufes, Gegenlauf grün), **Merge `9b8c7041` auf `main`**. Doku-PR im Anschluss.
- **Offen / nächster Schritt:** Sichtung; auf Wunsch Intensität der Klassentönung nachjustieren.

## IPL-0145 – Skills Desktop-Lesbarkeit: Wörter brechen statt abschneiden, Sidebar stapelt unter 1100px (Welle `20261121-skills4`, PR `#529`)

- **Was:** Rückmeldung des Betreibers (Screenshot-Batch zeigte kein Skills-Fenster): „auf der Desktop anwendung sind schriften abgeschnitten und nach rechts und links kann man nicht alles lesen wenn die fähigkeiten von links nach rechts ausgebaut werden". Zwei Ursachen in `skill-menu.css`:
  1. **Lange deutsche Komposita laufen über die Spalte** — `overflow-wrap:break-word` jetzt auf `.skill-card-name`, `.skill-card-description`, `.skill-card-requirement`, `.skill-card-tag`/`.skill-card-state`, `.skill-group-heading p`, `.skill-chapter-title` und `.skill-lane-head span` (Spaltenkopf bricht statt Ellipsis-Schnitt). Nicht betroffen: `#skillDetailText`/`#skillStatus`/`.skill-card-name` bleiben ohne `text-transform` (innerText-Pins).
  2. **Die 285px-Sidebar drückt unter 1100px die Trunk-/Komboreihen in unlesbare Spalten** — neuer `@media(max-width:1100px)`-Block (bewusst VOR dem ≤700-Block platziert): `.skills-workspace` wird Flex-Spalte, `.skills-sidebar` statisch/vollbreit — dieselbe gebilligte Mobil-Anordnung; ≤700px gewinnt weiterhin mit identischen Werten.
- **Mechanik unangetastet:** nur Layout/CSS; Draft/Save/Reset, Badges, Zustände, aria-Pins, Mobile-Scroll-Fixes unverändert.
- **Zweite Meldung (offen):** „wieso steht überall 'Freigeschaltet' in grau wenn ich die Fähigkeit nicht habe?" — Badge+Button laut Betreiber betroffen; Übersetzungen geprüft (UNLOCKED→FREIGESCHALTET, AVAILABLE→VERFÜGBAR, LOCKED→GESPERRT, Merge-Reihenfolge sauber), Auto-Spend/Regex/Migration geprüft, **frisch gewählter Render zeigt korrekt GESPERRT/VERFÜGBAR** — Nachweis-Screenshot steht aus, eigenes Ticket/Wellen-Nachtrag.
- **Prüfung:** `skill-menu-style.test.mjs` pinnt Umbruch-Regeln (alle selektierten Selektoren), Lane-Head-Umbruch und Stack-Block vor Phone-Block; Pin-Gruppe 9/0, Suite 1377+2 pr-Platzhalter/1, Schnelltor nur pr-Platzhalter.
- **Git / PR / Release:** Branch `arena/a1f52e38-0815games-github-io` ab `f9ca23e6`; Push, **PR `#529`**, Suite 1377+2 pr-Platzhalter, CI (`game-regressions`/`interface-browser-smoke`/`database-rules`/party-finalization) — alle Checks grün, **Merge `4c594e3a` auf `main`**. Doku-PR im Anschluss.
- **Offen / nächster Schritt:** Betreiber-Screenshot zur „Freigeschaltet"-Frage abwarten.

## IPL-0146 – Skills Badge-Farbe: „Freigeschaltet" in klarem Feldgrün statt Oliv-Grau (Welle `20261121-skills5`, PR `#531`)

- **Was:** Screenshot des Betreibers (Logistik Rang 3/3, Stufe 11, 0 Punkte): „wieso steht überall 'Freigeschaltet' in grau wenn ich die Fähigkeit nicht habe?" Analyse:
  - **Daten korrekt, kein Auto-Grant:** Stufe 11 = `min(17, 10)` = 10 Punkte gesamt; 0 übrig + Rang 3 → **7 Knoten gesetzt**. Schreib-Pfade geprüft: nur die drei Inspector-Buttons (`account.js` UPGRADE/UNLOCK/UNLOCK&SELECT) und der Klassenwahl-Click (`v2;…;1;0;…`) ändern Rang/Bits; Migration schreibt ausschließlich `v2;none`; V2-Regex streng; Tutorial gibt den ersten Punkt bewusst selbst aus (`first-run-ending.mjs`).
  - **Der echte Fehler war die Farbe:** `UNLOCKED`-Badge nutzte `#456b49`/`#e8f7df` — gedämpftes Oliv-Grau, das wie „deaktiviert/nicht meins" las. **Fix:** Badge `background:#3f7a33;color:#f4ffec` (klar grün, Kontrast ≈4,9:1). Grau bleibt den echten Nicht-Besitz-Zuständen: `GESPERRT` (`#35443b/#c2cdc1`) und `VERFÜGBAR` (Basis `#2a3a32/#d5e3d6`); `✓ AUSGERÜSTET` teal bleibt.
- **Mechanik unangetastet:** Texte (`FREIGESCHALTET`), Draft/Save/Reset, Punktelogik, Pins.
- **Desktop-Schnitt (Rückmeldung1):** Fix via IPL-0145 (`20261121-skills4`) live — Wortumbruch + Sidebar-Stapelung ≤1100px; Betreiber soll hart neu laden (Screenshot zeigt Stand mit Scroll-Fold unter der Aktionsleiste).
- **Prüfung:** Style-Pin (owned=grün, locked=grau, Oliv-Grau weg); Pin-Gruppe 10/0, Suite 1378+2 pr-Platzhalter/1, Schnelltor nur pr-Platzhalter.
- **Git / PR / Release:** Branch `arena/ea2bdfd4-0815games-github-io` ab `cd2f5d06`; Push, **PR `#531`**, Suite 1378+2 pr-Platzhalter, CI (`game-regressions`/`interface-browser-smoke`/`database-rules`/party-finalization) — alle Checks grün, **Merge `c9309f27` auf `main`**. Doku-PR im Anschluss.
- **Offen / nächster Schritt:** Bestätigung nach hartem Neu-Laden, dass die skills4-Desktop-Fixes sichtbar sind.

## IPL-0147 – Hauptmenü: aufgeräumtes Zwei-Spalten-HQ, echte Lücke über den Einstellungen (Welle `20261121-menu1`, PR `#533`)

- **Was:** Rückmeldung des Betreibers („Hauptmenü passt immer noch nicht ! WICHTIG. Alles sauber hinrücken. Viel platz über den 3 Spielmodi, lücke unter waffen freunde bestenliste zu einstellungen buttons hin."):
  1. **Linke Schiene als eigene Spalte:** SOLDAT-Karte, Schnellaktionen (Waffen/Fähigkeiten/Freunde/Bestenliste), SETTINGS/SIGN OUT und die Speicherzeilen stecken jetzt in `.command-home-side` (eigene Flex-Spalte, `grid-row:1/span 12`) — die alte zeilenfeste Platzierung (`utilities=row4`) kippte, sobald Resume/Ergebnis/Feldschule zusätzliche Zeilen belegten.
  2. **Feste Lücke:** `.command-utilities{margin-top:24px}` — der Abstand Waffen/Freunde/Bestenliste → Einstellungen ist deterministic, unabhängig vom Right-Column-Inhalt.
  3. **Platz über den Modi:** Einsatz-Kopf `margin-bottom:12→22px` (+4px Top), `.command-home-layout{margin-top:16→22px}`.
  4. Rechte Spalte (Kopf/Resume/Modi/Ergebnis/Feldschule) räumt automatisch in Spalte2 ein — keine expliziten `grid-row` mehr. Mobil (≤859px) behält den Flex-Stapel (Reihenfolge: Soldat → Aktionen → Einstellungen → Einsatzkopf → Modi).
- **Pins respektiert:** `command-home-layout` bleibt `minmax(0,1fr)` (Test „single column - no side dossier"), Dokumentreihenfolge `card<actions<head<modes` ✓, Utilities-Content `[menuSettings,menuLogout]` ✓ (Test), Resume<Modi<Results ✓, SHOW-TASK-Pille bleibt rechts (kein Overlap) ✓, Handler/IDs unverändert.
- **Prüfung:** neue Struktur-/Abstands-Pins (Side-Reihenfolge, Flex-Spalte,24px-Lücke,22px-Headroom, kein fixes `grid-template-rows`) · Suite **1381 grün /0 rot /1 übersprungen** · Schnelltor 32/32 grün · `check --fast` ohne Fehler (nur pr-Platzhalter).
- **Git / PR / Release:** Branch `arena/e8c58d12-0815games-github-io` ab `716dc9d6`; Commits `c0c1635` (Surgery/CSS/Bump) + Struktur-Rebuild, **PR `#533`**, CI-Lauf `46027978321` grün (alle Browser-Jobs nach; der erste Lauf `46022163078` war durch eine defekte Seitenstruktur rot — Kopf außerhalb der Section, Side-Wrapper spannte über `</section>` — Logs nicht abrufbar, lokal rebuildet), **Merge `487a1b03`**, Pages `46029435252` success.
- **Offen / nächster Schritt:** Betreiber-Backlog danach: Build-Pad-Optik, AFK-Popup/Logout-Meldung, Admin-Integration.

## IPL-0148 – Build-Pads: Geschützstellungs-Platte im Turm-Stil neu ausgestattet (Welle `20261121-padart1`, PR `#538`)

- **Zeit / Quelle:** Sitzungsdatum 2026-11-21 UTC; Betreiber-Auftrag (4-Punkte-Nachricht): „Optik anpassen beim rest - Build Pads".
- **Block / Ziel:** Kein Spiel-Block; reine Darstellung auf der Spielmap. Kein neuer Zustand auf dem Draht; Reduced-Motion- und Wetter-Schalter unberührt; keine Mechanik- oder Handler-Änderung. Sichtung macht der Betreiber („Mach alles Live, ich teste dann").
- **Branch / Basis:** `arena/840f9060-0815games-github-io` ab `f8de8cfb` (`main`, Merge PR `#537`).
- **Änderungen / Dateien:**
  - `IronPath/assets/gunpit-sprite.png`: die Platte unter jedem Turm war das letzte größere Feldbild, das die Turm-Stil-Welle `towerdeco1` (IPL-0130,38 Deko-Sprites) ausgelassen hatte - Türme, Bunker und Dressing waren längst neu, der Build Pad trug noch das V2-Bild. Neu erzeugt in derselben Sprache: dicke Tusche-Konturen, malerische Betonplatten, Erd-/Stein-Plinth mit Sandsäcken, dunkler Schützengraben. Freistellung über `scripts/freistellen-sprites.py` (Weiß→Alpha); das graue Schattenband am Fuß wurde nachgemessen (luma ~137, unter der Schwelle des Shadow-Ring-Passes) und im Ingame-Maßstab (62 px Breite) sub-pixel bewusst belassen, statt mit einem aggressiven Zusatzpass Beton zu fressen. Ersatz unter demselben Dateinamen (1023×666, Seitenverhältnis ~1,54; die Draw-Box `62×38` bleibt unverändert - die Abweichung liegt im Rahmen der bisherigen Dehnung).
  - `IronPath/patch-notes.mjs`: Eintrag `padart1` an die Spitze von `RELEASED_PATCHES` (pr-Platzhalter bis zur PR-Nummer); die Open-Zeile von `menu1` nennt jetzt nur noch die Admin-Integration.
  - Cache-Welle `20261121-padart1` (`bump … --from 20261121-menu1 --apply`,96 Dateien,7/7 Anker) - der `sprite()`-Loader in `cartoon-art.mjs` hängt am Token, damit auch wiederkommende Spieler die neue Platte laden.
- **Prüfung:** Suite und Schnelltor vor dem PR: **1379 grün /2 rot (nur pr:0-Platzhalter) /1 übersprungen**; die Pins `fillText('BUILD')` und das Verbot von `#ffed70` laufen unverändert weiter (kein Zeichen-Code angefasst). Endstand nach PR-Nummer wird nachgetragen.
- **Git / PR / Release:** Branch `arena/840f9060-0815games-github-io` ab `f8de8cfb`; Push, **PR `#538`**, CI, Merge – wird nachgetragen.
- **Offen / nächster Schritt:** Betreiber-Sichtprüfung der neuen Platte auf allen fünf Boden-Themen nach hartem Neu-Laden; danach Backlog-Punkte AFK-Popup/„ausgeloggt"-Meldung und Admin-Panel-Vollintegration.
