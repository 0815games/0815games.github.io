# Iron Path – Patch-Log

Dieses Protokoll ist der dauerhafte Einstiegspunkt für zukünftige Änderungen.
Es ergänzt den [Patchplan](PATCH-BLOECKE.md) und das [Datenblatt](DATENBLATT.md),
aber ersetzt weder Git noch die GitHub-PR-Historie. Die dazugehörige
[Arbeitsanweisung](../../AGENTS.md) verlangt, dieses Log vor der Arbeit zu lesen
und nach jedem in sich abgeschlossenen Schritt fortzuschreiben.

Die Einträge IPL-0001 bis IPL-0090 stehen im
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






## IPL-0091 – Straße und Schiene auf echten Kurven neu gebaut, Bodenspuren zurück (`20261121-road1`, PR `#341`)

- **Zeit / Quelle:** 2026-11-21 UTC. Auftrag des Betreibers nach dem Rückbau (`IPL-0090`), zwei Teile
  mit von ihm festgelegter Reihenfolge: **Teil 1** `#335` neu aufsetzen, „diesmal die Kurven auch
  sauber hinbekommen" und „eine durchgehend sauber gestaltete Straße"; **Teil 2** `#336` komplett neu
  implementiert. Drei abgefragte Entscheidungen, bindend: Kurvenstil = **echte Rundungen (sichtbar
  kurvig)**, Umfang = **alles aus `#335`** (Geometrie + Bodenspuren + Texturen), Lieferung = **zwei
  getrennte PRs, `#335` zuerst**. Dieser Eintrag ist Teil 1; Teil 2 folgt als eigener PR.
- **Block / Ziel:** Block 8, Abschnitt „Zurückgenommen und neu zu landen". Die zurückgenommene Arbeit
  war inhaltlich gewollt, aber bloßes Wiedereinschieben des alten `#335`-Codes hätte den Auftrag nicht
  erfüllt: die Kurven waren der Grund der Rücknahme, nicht die Lagen.
- **Branch / Basis:** `arena/d5645359-0815games-github-io` ab
  `394ce04ba630e459371c0a5b070a3da265044fd0` (`main`, Merge von PR `#340`).
- **Ursachenanalyse (gemessen an den echten Kartendaten, Offset-Formeln 1:1 aus dem alten Maler):**
  Alle drei Karten sind orthogonale Zickzack-Polygone (`road` 8 Punkte/6 Ecken, `forest` 10/8,
  `outpost` 10/8, jede Ecke exakt 90°). Der Maler versetzte und dekorierte **jedes Segment einzeln**:

  | Fehler je 90°-Ecke | Ausmaß | Ursache |
  |---|---|---|
  | Spurrillen reißen ab | **21,2 px** Lücke (`road` 6 Ecken = 255 px, `forest`/`outpost` 8 = 339 px) | Offset mit eigener Normalen je Segment, getrennte Teilpfade (= 15·√2) |
  | Schienen schneiden die Ecke | **13,0 px** Eckfehler (156/208 px gesamt) | Polylinie durch `b+n₁·13` statt Gehrungspunkt `b+(n₁+n₂)·13` |
  | Schwellen fehlen im Bogen | **13 px** Lücke | Schleife `s=9 … len-4`, Schritt 17 |
  | Kies/Schutt fehlt im Bogen | **38 px** Lücke | Schleife `s=26 … len-12`, Schritt 44 |
  | Straßenkörper wird zur Wurst | Viertelkreis-Bogen **Radius 43 px** | `lineWidth=86` + `lineJoin='round'` auf eckiger Polylinie |

  Härtester Einzelfund: `forest` hat ein **30 px** kurzes Segment zwischen zwei Ecken – kürzer als die
  Straße breit ist. Es verschwand vollständig in den beiden Eckbögen.
- **Änderungen / Dateien (28 Dateien, +1738/−147 vor der Cache-Welle):**
  - **Neu `IronPath/road-geometry.mjs`** – reines Präsentations-Geometriemodul, kennt keinen
    Simulationszustand. Beschreibt die Straße **einmal** als tangentenstetige Folge aus Geraden und
    Kreis-Fillets: `buildRoadPath(points,{radius})` mit `DEFAULT_CORNER_RADIUS=34`, Klemmung
    `min(gewünscht, (kürzeres Nachbarsegment/2)/tan(δ/2))`, damit zwei Fillets auf einem kurzen
    Segment sich tangential in seiner Mitte treffen (der `forest`-Stummel wird zu einem S-Bogen aus
    zwei 15-px-Bögen statt zu einem Blob); `offset(d)` als Parallelkurve (Gerade → parallele Gerade,
    Bogen → **konzentrischer** Bogen); `at(s)`/`walk(step,visit,{inset,outset})` für echte Bogenlänge
    und echte Tangente; `emit(ctx)` legt Bögen als `arc()`-Befehle an (eine Kurve je Bogen statt vieler
    Kurzsegmente); `cornerDeviation(r,δ)=r·(1/cos(δ/2)−1)` und `maxCentrelineDeviation(points)` als
    geschlossene Formel für den Abstand Polygon-Ecke ↔ geglättete Mittellinie.
  - **`IronPath/cartoon-art.mjs` (+356/−94):** `drawRoad`/`drawRail` vollständig auf dieses Modul
    umgebaut, mit dem `#335`-Lagendesign – `ROAD_THEMES` (8 Biome: `urban`, `outpost`, `arctic`,
    `marsh`, `scrub`, `forest`, `talwald`, `road`), Lagenstapel 94/82/76/(66 Gutter | 68 lichte
    Schulter)/60, Textur via `createPattern` + `DOMMatrix().scale()`, Krone, Schulter-Haarlinie,
    Spurlinie (Offset 23), Mittellinien-Dash `[16,14]`, Marsh-Planken (Schritt 11) mit zwei
    Guardrails (Offset 25), Bordsteinkerben (Offset 35), Schneewehen, Gestein, Unterholz,
    Panzer-Cleats, Stiefelabdrücke; dazu `drawBootStamp`, `drawTankTreadStamp`, `roadImages` +
    `getRoadImage`, `export drawGroundTracks`. Ganze Lagen = **ein** Pfad-Stroke, parallele Lagen =
    exakte Offsetkurve, diskrete Deko = `walk()` über Bogenlänge. `drawTerrain` holt `roadImg` und
    gibt es weiter; `drawCartoonBattle` bekommt `groundTracks=[]` und malt sie **nach** `brokenIce`,
    also über der gecachten Terrain-Ebene.
  - **`IronPath/game.js` (+14/−5):** Import `createGroundTracks`, zwei Rekorder, `sample()` in beiden
    Ansichten, Übergabe an `drawCartoonBattle`, `reset()` an **beiden** Stellen.
  - **`IronPath/ground-tracks.mjs` (124 Zeilen) und 8 Platten** (`road3-{city,desert,forest,marsh,road,snow}.jpg`,
    `endless-ground3.jpg`, `terrain3-city.jpg`; 2,3 MB) aus dem gemergten `#335`-Baum
    (`a3eb453b1389ec38b8f48c1c6e45e192ca618e09`) wiederhergestellt; alle 8 JPGs auf gültige
    SOI/EOI/SOF-Header geprüft.
  - **13 Ersetzungslisten der Test-Harnesses** gepflegt (`ability-hud-ui`, `campaign-ui`, `coop-ui`,
    `endless-launcher`, `four-viewport-integration`, `map-name-title`, `party-end-force-close`,
    `party-end-ui`, `release-game-teardown`, `report-rank`, `solo-smoke`, `solo-wave-receipt-ui`,
    `tower-shimmer`) – genau die Bedingung, die `IPL-0090` als zwingend notiert hatte.
- **Drei Geometriefehler, die die eigenen Tests beim Schreiben des Moduls gefunden haben** (alle drei
  waren im neuen Code, nicht im alten; jeder ist jetzt per Test gepinnt):
  1. Tangentenlänge stand als `r/tan(δ/2)` statt **`r·tan(δ/2)`**. Beide Formeln sind **nur bei δ=90°
     identisch** – jede ausgelieferte Karte wäre grün geblieben, während das Modul bei schrägen Ecken
     um bis zu **31 px** danebenlag. Aufgefallen nur, weil der Test absichtlich ein nicht-orthogonales
     Zickzack (74,1/84,8/86,6°) fährt, das auch `tests/road-design.test.mjs` verwendet.
  2. Ein Versatz breiter als die Kurve wurde durch eine **Sehne** ersetzt und riss **1,75 px** – in
     einem Modul, das Risse beenden soll. Jetzt die exakte, sich selbst kreuzende Kreisbahn
     (Radius `|r−d·turn|`, Winkel um π gedreht), als `cusp` gekennzeichnet.
  3. Ein Versatz **exakt** durch das Kurvenzentrum erzwang einen Mindestradius `0.75` und erfand einen
     0,75-px-Sprung, wo geometrisch ein Punkt steht; der Bogen entartet jetzt und fällt weg, beide
     Nachbarlinien treffen sich dort exakt.
- **Zwei Verdrahtungsfehler aus `#335` korrigiert statt kopiert:**
  1. **Ein gemeinsamer Rekorder für beide Gefechtsfelder.** `sample()` löscht Tracker von Spielern, die
     der übergebene Zustand nicht enthält; eigene und gegnerische Ansicht wechselten sich pro Frame ab
     und löschten einander damit **jeden Frame** die Tracker. Da ein neu angelegter Tracker nur Peilung
     nimmt und keine Marke legt, entstand im Versus-Spiel **nie** eine Spur. Jetzt eigener Rekorder je
     Ansicht (`groundTracks`, `rivalGroundTracks`).
  2. **Nur eine von zwei Reset-Stellen** räumte den Rekorder auf; Spuren bluteten über eine
     Koop-Neuverbindung in das nächste Gefecht. Jetzt beide.
- **Prüfungen:** `node --test-reporter=tap --test IronPath/tests/*.test.mjs` (Repo-Wurzel, CI-identisch,
  Serienlauf – `-P 4` zählt Falsch-Fails) auf Commit `e83454c`: **1235 Tests, 1234 pass, 0 fail,
  exit 0**. Vor der Harness-Pflege derselbe Lauf: **1219 Tests, 22 fail**, alle 22
  `ERR_UNSUPPORTED_RESOLVE_REQUEST` auf `./ground-tracks.mjs?v=…` aus den `data:`-URL-Harnesses –
  dieselbe Zahl und dieselbe Signatur wie auf `main` vor dem Rückbau.
  - **Neu `tests/road-geometry.test.mjs` (14):** Tangentenstetigkeit (Lücke < 1e-9) über alle drei
    Karten **und** das Zickzack; Start/Ende bleiben exakt die Simulations-Endpunkte; Klemmung auf die
    Hälfte des kürzeren Nachbarn; Fillet berührt **beide** Segmente und die Tangentenpunkte liegen
    **innerhalb** ihrer Segmente (Regressionsschutz für Fehler 1); Offset-Kontinuität bei allen in der
    Grafik verwendeten Abständen (13/15/21/23/24,5/25/35, beide Seiten); konzentrische Bögen mit
    `r−d·turn`; exakte Offset-Bogenlänge; Sampling ohne Sprünge; Tangente dreht ≤ 0,05° je halbem
    Pixel; Deko erreicht **jeden** Bogen; Spitze bei übersetztem Versatz stetig; Abweichung
    Mittellinie↔Polygon geschlossen **und** gegen Messung geprüft; Radius 0 reproduziert das
    Rohpolygon exakt; defekte Eingänge werfen nicht.
  - **`tests/road-design.test.mjs` umgeschrieben (12)** – von einem Farb- zu einem **Geometrie**vertrag:
    höchstens **ein** `moveTo` je Stroke (nichts wird mehr segmentweise gemalt), echte `arc`-Befehle,
    **einer je Ecke** in jeder Lage ≥ 56 px, Lagenstapel absteigend, Spurrillen als je eine
    Offsetkurve pro Seite, Schwellen und Planken **gemessen** durch die Bogenmittelpunkte (Abstand zum
    Segment, nicht zu seinen Endpunkten), Schienen halten ihr 13-px-Maß ab dem ersten Meter,
    Guardrails je Bogen, Dash wird zurückgesetzt, Textur liegt **über** der Fahrbahn, alle Karten malen
    ohne Wurf, der `forest`-Stummel bleibt Teil der Straße, `junction` malt keine Straßenlagen.
  - **Neu `tests/ground-tracks.test.mjs` (16):** misst die zwei Behauptungen, die das Modul bisher nur
    im Kommentar hatte – es schreibt **nie** in den übergebenen Zustand (geprüft gegen ein
    `Object.freeze`-tiefgefrorenes Objekt, byte-identisch danach; ausgegebene Marken sind Kopien) und
    Marken verblassen wirklich (`alpha` 1 → 0,5 → Verfall). Dazu Schrittmaße je Einheitstyp
    (13/13/14/9,5/12 px), Übertrag des Restwegs, Boss schwerer als Panzer, Bomber und Flieger spurlos,
    Schiene statt Stiefel auf `junction`, Teleport ab 70 px ohne Schmier, **4** Marken Obergrenze pro
    Sample, Klon-Zuordnung bis 45 px, Pause altert nichts, rückwärts laufende Uhr setzt zurück, Cap mit
    Untergrenze, `reset()`, defekte Eingänge, Maler-Kontextbilanz (`save`/`restore`), Themen-Paletten
    mit Rückfall, und ein **Verdrahtungsschutz auf `game.js`** (zwei Rekorder, beide Reset-Stellen,
    `sample` in Sekunden mit `paused` und `theme`).
  - **Kosten gemessen:** Pfadaufbau + 7 Offsets + 3 Deko-Durchläufe = **29 µs** auf der längsten Karte
    (0,17 % eines 16,7-ms-Frames); `drawTerrain` cachet die gemalte Ebene je Karte
    (`terrainCache`, feste Rasterauflösung), fällt also einmal pro Gefechtsfeld an, nicht pro Frame.
    Die alte Messung „970 → 1911 Canvas-Operationen (+97 %)" bezog sich auf den **Erstbau** der Ebene.
- **Cache-Welle `20261121-road1`:** Token `20261121-rollback1` → `20261121-road1` in **79 Dateien,
  276 Token**. Geprüft: im Diff gegen die Basis bleiben genau **7 Nicht-`?v=`-Zeilen**
  (`index.html:7` Meta, `:213` und `:326` die zwei `class="build-stamp"`, `release-version.json:3`,
  `login-scene.mjs:5`, `browser-tests/avatar-handover.cjs:109`,
  `browser-tests/interface-smoke.cjs:132`) – null Produktlogik. Die drei **historischen** Aussagen in
  `patch-notes.mjs` (Zeilen 48, 55, 59 zum Stand `rollback1`) sind absichtlich **unverändert**; der
  neue Feldnotiz-Eintrag trägt die neue Welle und wird damit automatisch zur `data-live`-Karte.
- **Grenzen – Nachweisgrad ehrlich:**
  - **Die Simulation läuft weiter exakt auf dem eckigen Polygon** (`PATH[e.segment]` in
    `simulation.mjs`); geglättet wird ausschließlich die Darstellung. Bei 90° und Radius 34 weicht die
    Polygon-Ecke um **14,08 px** von der geglätteten Mittellinie ab. Die Fahrbahn ist 60 px breit
    (Halbbreite **30 px**), ein Gegner steht also immer auf Asphalt – dieser Abstand ist per Test
    gepinnt (`cornerDeviation(34,90°) < 60/2`), damit ein späterer größerer Radius nicht
    stillschweigend Einheiten von der Straße schiebt. Optisch kann ein Gegner die Kurve minimal
    schneiden; messbar, innerhalb der Fahrbahn, und dem Betreiber vor der Entscheidung genannt.
  - **Keine Geräteabnahme.** Kein automatisierter Lauf bestätigt die Optik auf einem iPhone/iPad;
    dieser PR behauptet das nicht. Sichtprüfung nach dem Laden: der Stempel muss **BUILD
    20261121-road1** zeigen – ein älterer Stempel bedeutet Cache, nicht Code.
  - Der in `IPL-0090` gemeldete Einfrier-Fehler wird durch diesen PR **weder bestätigt noch
    widerlegt**. Die einzige belegte Freeze-Ursache (`bossPhaseLabel` ohne Import, PR `#338`) bleibt
    entfernt und wird hier nicht wieder eingeführt; `game.js frame()` hat weiterhin **kein** `try/catch`
    um `draw()`.
  - Simulation, Balance, Multiplayer-Protokoll und Speicherstände sind nicht berührt.
- **Git / PR / Release:** Commits `dd3f01fd00a70a9ce88e09819fd9b9287512050b` (Geometriemodul +
  14 Tests), `4bb603b68ca607de48a5a4939b332dd9269e92ba` (Maler + umgeschriebener Straßenvertrag),
  `e83454c63143f938b25a306ea867ae518b365dfb` (Bodenspuren + 13 Harness-Listen + 16 Tests).
  PR **`#341`** eröffnet auf `main`. Cache-Welle und Feldnotizen folgen als eigener Commit, sobald die
  PR-Nummer belegt ist.
- **Offen / nächster Schritt:** CI-Ergebnis auf dem Endstand, Merge, Pages-Build und Auslieferung
  prüfen und als Ereignis nachtragen; echte Geräteabnahme durch den Betreiber. Danach **Teil 2**:
  `#336` komplett neu implementiert (dickerer pulsierender Auswahlring auf Bauplätzen + Hover-Vorschau
  mit Wellennummer und Anzahl nächster Gegner) **einschließlich** der fehlenden deutschen Einträge der
  4 Literale, als eigener PR, ohne die Log-Zerstörung aus `#336` zu wiederholen.

### Ereignis-Nachtrag zu IPL-0091 – Veröffentlichung belegt (nachträglich, 2026-11-21 UTC)

- **CI auf dem Endstand `bde6a7e1d7d69aad378c57664a8651083093e45d`:** Run `44962270748`,
  **alle Prüfungen `success`**, darunter `game-regressions` — derselbe Check, der in `#335`, `#336`,
  `#337`, `#338` und `#339` jeweils rot war und trotzdem gemergt wurde. Der vorangegangene Push
  (`e83454c`, vor der Cache-Welle) lief als Run `44962265422` ebenfalls vollständig `success`.
  `gh pr checks 341`: **13/13 pass**.
- **Merge:** PR `#341` `state=MERGED`, `mergedAt=2026-11-21T23:42:42Z`,
  Merge-Commit `b056ca3c68b9ddfdb675e1b80a5e7c975d7f0f95`. `main` steht auf genau diesem Commit
  (`gh api …/commits/main` → `b056ca3c…`).
- **Pages:** Build aus `b056ca3c68b9ddfdb675e1b80a5e7c975d7f0f95`, `status=built`,
  `duration=44626 ms`, kein Fehler. `build_type=legacy`, Quelle `main`/`/` — Auslieferung ist also
  der Repo-Stand ohne Build-Schritt.
- **Auslieferung geprüft** über `gh api …/contents/<pfad>?ref=main`: `road-geometry.mjs` 16041 Byte,
  `ground-tracks.mjs` 5032 Byte, `assets/road3-forest.jpg` 499339 Byte, `release-version.json`
  47 Byte; `index.html` trägt `<meta name="ironpath-build" content="20261121-road1">`.
  **Ehrliche Grenze:** die live URL `https://0815games.github.io/IronPath/` wurde aus diesem
  Arbeitsraum **nicht** abgerufen (kein ausgehender Zugriff auf diesen Host); der Nachweis führt über
  den Repo-Inhalt auf `main` und den Pages-Build-Status, nicht über eine HTTP-Antwort der Seite.
- **Weiter offen:** echte Geräteabnahme durch den Betreiber (iPhone/iPad Safari) — Optik der Kurven,
  Lesbarkeit der Straße, Bodenspuren, und Sichtprüfung des Stempels **BUILD 20261121-road1** in
  Ladeszene und Einstellungen. Der gemeldete Einfrier-Fehler bleibt durch diesen Stand weder
  bestätigt noch widerlegt.
- **Herkunft dieses Nachtrags:** Er stand bereits im Patch-Log des Vorzweigs
  `arena/d5645359-0815games-github-io`, Commit `a4d093ef` („IronPath: record the
  proven release events for PR #341 (IPL-0091)"), der nur auf diesem Zweig lag und
  nie nach `main` kam. Beim Aufräumen übernommen; die Kennungen (Run-IDs,
  Merge-Commit, Pages-Build) sind dieselben. Die Übernahme läuft als eigener
  Commit dieses Zweigs; dessen Kennung kann ein Commit nicht selbst enthalten,
  sie steht im Eintrag `IPL-0092`.
## IPL-0092 – Ordnung im Repository: Spielwurzel von Arbeitsmaterial getrennt, Patch-Ablauf als Werkzeug, Patch-Log geteilt (`20261121-order1`, PR `#342`)

- **Zeit / Quelle:** 2026-11-21 UTC. Auftrag des Betreibers, wörtlich: „Lass uns das repo mal
  anschauen und Ordnung reinbringen. Saubere Struktur für jedes neues Update / patch inkl Handhabung
  für getane Arbeiten im patchlog und Prüfungen vor und nach den patches. Struktur der Ordner und
  alles. Sauber was zum Arbeiten benutzt wird trennen von Game Dateien." Vier abgefragte
  Entscheidungen, bindend: Trennung = **A, Spielwurzel entrümpeln** (kein Umbau der CI-Pfade, kein
  Wechsel des Pages-Builds); Prozess = **Doku + Skripte** (kein CI-Job, der es erzwingt); Patch-Log =
  **neueste 20 Einträge + Archiv**; Ballast = **nichts löschen, nur umräumen**.
- **Block / Ziel:** kein Spiel-Block. Ziel ist die Arbeitsfähigkeit des Repositorys selbst: was der
  Browser lädt von dem trennen, womit gearbeitet wird, und den Patch-Ablauf wiederholbar machen. Am
  Spiel ändert sich nichts - Grafik, Simulation, Balance, Speicherstände und Mehrspieler sind
  unverändert.
- **Branch / Basis:** `arena/f49da0c2-0815games-github-io` ab
  `b056ca3c68b9ddfdb675e1b80a5e7c975d7f0f95` (`main`, Merge von PR `#341`).
- **Änderungen / Dateien:** zehn Commits, je ein logischer Schritt.
  1. `e895087e` - 26 Markdown-Dateien aus der Spielwurzel nach `docs/` (34 relative Links
     umgeschrieben, 8 externe Referenzstellen nachgezogen: `../../AGENTS.md`, `patch-notes.mjs`, zwei
     Tests, `tower-specialization.mjs`, zwei READMEs); neu `README.md` als Strukturkarte; neu
     `tests/repo-structure.test.mjs`.
  2. `f88a4c53` - drei Module ohne Importeur nach `scripts/`: `map-review-render.mjs`,
     `workshop-server-account.mjs`, `workshop-service-config.mjs`. **Release-Inventar der Spielwurzel
     204 → 201 Dateien**, weil `release-tools/stage-version.mjs` jede `.mjs/.js/.css` der Wurzel in
     jeden gestagten Build kopiert. Drei Pfade im Skript korrigiert, darunter der Ausgabeordner, der
     nach dem Umzug sonst ins Repository geschrieben hätte. Struktur-Test um drei Wächter erweitert.
  3. `da58f519` - `tests/production-cors-probe.test.mjs` startet seinen Unterprozess mit `cwd` =
     Repo-Root; vorher lief die Suite nur vom Repo-Root grün.
  4. `7216229a` - neu `scripts/patch-lib.mjs`, `scripts/patch-check.mjs` (Vor-/Nachprüfung),
     `scripts/patch-bump.mjs` (Cache-Welle, Trockenlauf als Standard), `tests/patch-tooling.test.mjs`
     (11 Tests gegen ein Miniatur-Repository mit echtem `git init`).
  5. `4662afbe` - der PEM-Kopf in der Fixture wird zur Laufzeit zusammengesetzt, damit die eigene
     Geheimnis-Prüfung nicht die Testdatei selbst flaggt.
  6. `5b8f3a68` - Ereignis-Nachtrag zu `IPL-0091` übernommen. Das ist der Commit, dessen Kennung der
     Nachtrag selbst nicht nennen kann; sie steht hier.
  7. `ca38e70f` - Log geteilt: `docs/PATCH-LOG.md` 4040 → 610 Zeilen (neueste 20), neu
     `docs/PATCH-LOG-ARCHIV.md` 3441 Zeilen (`IPL-0001`…`IPL-0071`), neu
     `tests/patch-log-archive.test.mjs`.
  8. `e6d6c4ff` - neu `docs/PATCH-ABLAUF.md` und `docs/patch-log-vorlage.md`; die Vorlage im Log wird
     zum Verweis, damit sie nicht an zwei Stellen auseinanderläuft.
  9. `b8cf92aa` - Cache-Welle `20261121-road1` → `20261121-order1` über 79 Dateien per
     `scripts/patch-bump.mjs --apply`, Feldnotizen-Eintrag `order1` in `patch-notes.mjs`, dieser
     Log-Eintrag, `IPL-0072` ins Archiv verschoben.
  10. dieser Commit - `docs/PATCH-ABLAUF.md` bekommt §11, eine Release-Checkliste mit **25 Kästchen**
     zum Kopieren. Bisher waren §3, §7 und §8 Prosa und es gab im ganzen Arbeitsmaterial keinen
     einzigen abhakbaren Punkt; unter Zeitdruck musste die Reihenfolge jedes Mal neu zusammengesucht
     werden. Jedes Kästchen ist eine Zeile mit Zeiger auf den erklärenden Abschnitt, absichtlich keine
     zweite Fassung der Regeln, damit nichts auseinanderlaufen kann - derselbe Grund, aus dem die
     Log-Vorlage nur noch an einer Stelle steht.
- **Prüfungen:** volle Suite vom Repo-Root im Serienlauf, genau wie CI, über dem gepushten Stand
  `e6d6c4ff`: **1258 tests / 1258 pass / 0 fail / 0 skipped, EXIT=0** (Log `/tmp/suite-docs-tools.log`
  des Arbeitsraums, nicht Teil des Repositorys). Nochmals über dem kompletten Endbaum **einschließlich
  dieses Eintrags, der Cache-Welle und der Feldnotizen**: **1258 / 1258 / 0 fail / 0 skipped, EXIT=0**
  (`/tmp/suite-final.log`). Zwischenstände: 1253/1253/0 nach Schritt 5,
  1242/1241/0 mit **1 skipped** nach Schritt 2. Vor diesem Auftrag: 1242 tests / 1241 pass / 1 fail /
  1 skipped. Isoliert: `repo-structure` 7/7, `patch-tooling` 11/11, `patch-log-archive` 5/5,
  Verträge 7 Dateien / 28 Tests, Feldnotizen- und Stempelverträge zusammen 44/44.
  Link-Prüfung über alle Markdown-Dateien unter `IronPath/`: 52 Dateien, 0 tote Links. Scan auf CJK-,
  kyrillische und Fullwidth-Zeichen über alle neuen und geänderten Dateien: 0 Treffer.
  Bissfestigkeit der Wächter geprüft, nicht angenommen: ein absichtlich in die Spielwurzel gelegtes
  Modul ohne Importeur ließ Wächter 4 und 5 anschlagen (Probe angelegt und wieder gelöscht, 0 Reste).
  Die Cache-Welle wurde zuerst als Trockenlauf gefahren und gegen die Handarbeit aus `IPL-0091`
  gerechnet: identisch 79 Dateien, 276 Token-Vorkommen, 7 Anker-Zeilen, 3 geschützte Historien-Zeilen
  in `patch-notes.mjs`. Im Diff der Welle stehen exakt 14 Nicht-`?v=`-Zeilen = die 7 Anker alt/neu.
- **Git / PR / Release:** PR `#342`, geöffnet aus diesem Zweig gegen `main`. Zum Zeitpunkt dieses
  Eintrags **offen**: kein CI-Ergebnis, kein Merge, kein Pages-Build, keine Auslieferung. Der Stempel
  `20261121-order1` ist im Arbeitszweig gesetzt, nicht veröffentlicht.
- **Grenzen, ehrlich:**
  - **Kein Spieler sieht eine Änderung.** Nur die Cache-Welle macht sich bemerkbar: ein Gerät lädt die
    Module einmal neu.
  - Pages baut weiter mit `build_type: legacy` aus `main`, Pfad `/`: der ganze Baum bleibt öffentlich
    erreichbar. Dieser Auftrag trennt Arbeitsmaterial **strukturell**, er nimmt nichts aus der
    Auslieferung heraus. Die alten Doku-Adressen `/IronPath/*.md` gelten nicht mehr, sie liegen unter
    `/IronPath/docs/*.md`. Wer Doku und Tests wirklich nicht ausliefern will, bräuchte einen
    Actions-Build (Variante C, bewusst nicht gewählt).
  - Gelöscht wurde nichts, wie entschieden. Die drei umgeräumten Module sind weiter unreferenziert
    (`workshop-server-account.mjs` hat einen Test, die anderen beiden nicht), und die 1-Byte-Datei
    `IronPath/empty` liegt weiter in der Spielwurzel.
  - Kein CI-Job erzwingt den neuen Ablauf. `patch-check.mjs` meldet, es verhindert nichts.
  - **Keine Geräteabnahme** und kein Abruf der live URL. `--verify-main` belegt Repo-Inhalt auf `main`
    plus Pages-Baustatus, nicht die Auslieferung im Browser.
- **Nebenfund, nicht angefasst:** `docs/PATCH-BLOECKE.md` endet mit einem **doppelt angehängten
  Schlussblock** (23 Zeilen, 2132 Zeichen, ab Zeichen 128141): `## Gemeinsame Freigabe` steht zweimal,
  ebenso der Admin-Login-Absatz, und die Wiederholung beginnt mit dem abgeschnittenen Wortfragment
  `twerden sowie nach Abklingzeit.`. Gemessen gegen `main` (`b056ca3c`): beide Fassungen sind dort
  identisch 1392 Zeilen, also **ist der Fehler älter als dieser Auftrag** und nicht durch das Umräumen
  entstanden. Der Diff `main` → dieser Stand zeigt 27 geänderte Zeilen, und alle 27 sind reine
  Link-Umschriebe (`firebase/…` → `../firebase/…`); keine Unicode-Schädigung. Inhaltlich ist der Block
  einmal vorhanden, deshalb wurde nichts gelöscht - die Entscheidung liegt beim Betreiber.
- **Offen / nächster Schritt:** CI-Ergebnis, Merge und Pages-Build zu PR `#342` prüfen und als
  Ereignis nachtragen, sobald sie tatsächlich eingetreten sind. Vom Betreiber zu stellen:
  `game-regressions` als Pflicht-Check (dieser Arbeitsraum bekommt auf `branches/main/protection` ein
  `403`), die Geräteabnahme der Straße aus `#341` auf iPhone/iPad Safari, und die Entscheidung über den
  doppelten Schlussblock in `PATCH-BLOECKE.md`. Danach Teil 2 des Auftrags aus `IPL-0091`: `#336`
  komplett neu implementiert (dickerer pulsierender Auswahlring, Hover-Vorschau mit Welle und Anzahl
  nächster Gegner, einschließlich der fehlenden deutschen Einträge für vier Literale).
### Ereignis-Nachtrag zu IPL-0092 – Veröffentlichung belegt (nachträglich, 2026-11-22 UTC)

Die folgenden Ereignisse sind eingetreten und geprüft; sie stehen hier, weil sie
zur Zeit des Eintrags oben noch offen waren. Jede Zeile nennt die Kennung, mit der
sie geprüft wurde.

- **CI auf dem PR-Kopf:** `gh pr checks 342` = **13 von 13 pass, 0 fail**. Run
  `44971539781` mit den Jobs `game-regressions` (`.../job/137052198313`) und
  `database-rules` (`.../job/137052198482`), dazu `interface-browser-smoke`, acht
  `party-finalization-browser`-Varianten und zwei Vercel-Checks. `game-regressions`
  war damit zum dritten Mal in Folge grün (`#340`, `#341`, `#342`, je 13 von 13);
  bei `#335` bis `#339` war derselbe Check jeweils rot (`#335` und `#339`
  stichprobenartig nachgeprüft: `fail`) und wurde trotzdem gemergt.
- **PR:** `gh pr view 342 --json state,mergedAt,mergeCommit` =
  `state=MERGED mergedAt=2026-11-22T01:37:31Z`, Merge-Commit
  `d9a02461b6c3921f45e4dbabb3a9a22cf61ac979` in `main`.
- **Pages:** Workflow-Run `44972324714` (`pages build and deployment`)
  `completed/success`; `gh api repos/.../pages/builds/latest` =
  `status=built duration_ms=45446 commit=d9a02461b6c3921f45e4dbabb3a9a22cf61ac979
  created=2026-11-22T01:37:32Z`.
- **Auslieferung, über `gh api repos/.../contents/<pfad>?ref=main` belegt.** Neu
  auf `main` vorhanden: `IronPath/docs/PATCH-ABLAUF.md` (13670 B),
  `IronPath/docs/PATCH-LOG-ARCHIV.md` (259052 B), `IronPath/docs/PATCH-LOG.md`
  (94065 B), `IronPath/scripts/patch-check.mjs` (18746 B),
  `IronPath/scripts/patch-bump.mjs` (6709 B), `IronPath/scripts/patch-lib.mjs`
  (5786 B), `IronPath/tests/patch-log-archive.test.mjs` (5034 B),
  `IronPath/tests/patch-tooling.test.mjs` (16244 B), `IronPath/README.md`
  (3956 B). Alte Pfade liefern `404`: `IronPath/PATCH-ABLAUF.md`,
  `IronPath/PATCH-LOG.md`, `IronPath/map-review-render.mjs`,
  `IronPath/workshop-service-config.mjs`. Stempel auf `main`:
  `release-version.json` `"build": "20261121-order1"`, `index.html:7`
  `<meta name="ironpath-build" content="20261121-order1">` und `index.html:213`
  `BUILD 20261121-order1`. `IronPath/empty` liegt weiter mit 1 B in der
  Spielwurzel - wie entschieden wurde nichts gelöscht.
- **Ehrliche Grenzen.** Die live URL wurde **nicht** abgerufen; belegt ist der
  Inhalt auf `main` und der fertige Pages-Build, nicht was ein Browser lädt.
  **Keine Geräteabnahme** auf iPhone oder iPad. `game-regressions` ist weiter
  **kein Pflicht-Check**: `branches/main/protection` liefert diesem Arbeitsraum
  `403`, stellen kann das nur der Betreiber. Der doppelte Schlussblock in
  `docs/PATCH-BLOECKE.md` ist weiter vorhanden und unentschieden.
- **Herkunft dieses Nachtrags.** Er steht als eigener Commit auf dem Arbeitszweig
  `arena/f49da0c2-0815games-github-io`, der mit PR `#342` gemergt wurde; die
  Kennung des Commits und des PR, die **diesen Nachtrag** nach `main` bringen,
  kann er nicht selbst enthalten - sie steht im PR-Text und in Git. Genau dieser
  Umstand war bei `IPL-0091` der Grund, warum dessen Nachtrag auf `main` fehlte:
  er lag nur im Vorzweig `a4d093ef` und wurde erst mit `5b8f3a68` übernommen.

## IPL-0093 – Doppelblock im Patchplan repariert und `IronPath/empty` gelöscht (keine Spieländerung, keine Cache-Welle)

- **Zeit / Quelle:** Betreiberauftrag in dieser Sitzung, wörtlich: „Mach die 2 punkte bitte fertig.“ Grundlage sind die zuvor getroffenen Entscheidungen: doppelten Schlussblock in `docs/PATCH-BLOECKE.md` reparieren und `IronPath/empty` jetzt doch löschen.
- **Block / Ziel:** Kein Spiel-Block. Ziel ist nur, die zwei offenen Aufräumpunkte aus der Repository-Ordnung abzuschließen, ohne Spieldateien, Balance, Speicherstände oder Mehrspieler zu ändern.
- **Branch / Basis:** `arena/f3b31c90-0815games-github-io` ab `4e26e00995a957f0e325f212ff19e5a9e3e989d5` (`main`, Merge von PR `#343`).
- **Änderungen / Dateien:**
  - `IronPath/docs/PATCH-BLOECKE.md`: Die doppelte Wiederholung am Dateiende entfernt (Zeilen 1381–1391, 1.066 Zeichen). Vor dem Schnitt wurde zeichenweise geprüft: Der entfernte Teil ist nur die Wiederholung des schon vorhandenen Schlusses und beginnt mitten im Wort (`twerden sowie nach Abklingzeit.`); die vollständige Fassung mit Admin-Login-Punkt und `## Gemeinsame Freigabe` bleibt genau einmal stehen. Marker danach: `## Gemeinsame Freigabe` 1×, Admin-Login-Punkt 1×.
  - `IronPath/empty`: Die unreferenzierte 1-Byte-Datei (nur Zeilenumbruch) gelöscht. Im Baum gibt es keinen Code-Verweis auf diese Datei; `release-tools/stage-version.mjs` kopiert aus der Spielwurzel nur `.mjs`/`.js`/`.css`, daher war `empty` auch nicht Teil des Release-Inventars. Die frühere Entscheidung „nichts löschen“ ist für diese eine Datei durch den ausdrücklichen Betreiberwunsch aufgehoben; der historische Feldnotizen-Satz zu PR `#342` bleibt als damaliger Stand unverändert und wird durch diesen Eintrag für die Gegenwart abgelöst.
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0073` vollständig ans Ende des Archivs verschoben, die Kennungsgrenzen in beiden Köpfen auf `IPL-0001` bis `IPL-0073` nachgezogen und dieser Eintrag als neuester angehängt. Das Log führt damit weiter die neuesten 20 Einträge (`IPL-0074` bis `IPL-0093`).
- **Prüfungen:**
  - Zieltests vor der Log-Rotation: `node --test IronPath/tests/repo-structure.test.mjs IronPath/tests/patch-log-archive.test.mjs IronPath/tests/patch-tooling.test.mjs` = **23 Tests, 23 bestanden, 0 fehlgeschlagen, 0 übersprungen**.
  - Gesamtsuite im zunächst flachen Klon: `node --test IronPath/tests/*.test.mjs` = **1.258 Tests, 1.257 bestanden, 0 fehlgeschlagen, 1 übersprungen**. Der eine übersprungene Test war `release-pages-site` wegen fehlender Vorfahren-Commits im flachen Klon; nach `git fetch --unshallow origin` lief `node --test IronPath/tests/release-pages-site.test.mjs` mit **6/6 bestanden, 0 übersprungen** nach.
  - Nach der Log-Rotation: `node --test IronPath/tests/patch-log-archive.test.mjs IronPath/tests/repo-structure.test.mjs` = **12 Tests, 12 bestanden, 0 fehlgeschlagen, 0 übersprungen**; `node IronPath/scripts/patch-check.mjs` = **93 Einträge `IPL-0001` bis `IPL-0093` lückenlos (Log 20 + Archiv 73), 0 Fehler, 1 Hinweis** (zum Prüfzeitpunkt noch uncommittete Änderungen).
  - Keine Geräte- oder Browserabnahme: Es wurde keine Datei geändert, die der Browser lädt. Der Build-Stempel bleibt unverändert `20261121-order1`; eine Cache-Welle ist für diese Doku-/Aufräumänderung nicht nötig.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet` auf `arena/f3b31c90-0815games-github-io`. Commit, Push, PR, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen.
- **Offen / nächster Schritt:** PR für diese zwei Punkte öffnen, CI abwarten und erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Danach getrennt angehen: Spielwurzel-Struktur der vielen JavaScript-/Moduldateien ordnen und anschließend die Patch-Skripte auf Zusammenlegung/Vereinfachung prüfen.

### Ereignis-Nachtrag zu IPL-0093

- **Commit / PR:** Der Arbeitscommit ist `0f2e1e4d14aa5c1151e10219232408800969620c` auf `arena/f3b31c90-0815games-github-io`; Pull-Request `#344` („Doppelblock reparieren und IronPath/empty löschen“) wurde mit diesem Stand geöffnet.
- **CI:** `gh pr checks 344` endete mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend**. Belegt im Actions-Run `44975676529`, darunter `game-regressions` (Job `137064918377`), `database-rules` (Job `137064918320`) und `interface-browser-smoke` (Job `137064918143`), dazu die acht `party-finalization-browser`-Varianten und zwei Vercel-Checks.
- **Merge:** `gh pr view 344 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-22T02:31:00Z`, Merge-Commit `3e6aeb1f093aab2dc88abef4bc5bd4582f34d9dd` in `main`.
- **Pages:** Der Workflow `pages build and deployment` lief als Run `44976460159` auf dem Merge-Commit mit `completed/success`; `gh api repos/0815games/0815games.github.io/pages/builds/latest` meldete danach `status=built`, `duration=46284` ms, `commit=3e6aeb1f093aab2dc88abef4bc5bd4582f34d9dd`.
- **Auslieferung auf `main` belegt:** `IronPath/docs/PATCH-BLOECKE.md` ist per Contents-API vorhanden (131262 B, SHA `3cef02715916a0388685f5758a3d716823bc11e8`), `IronPath/docs/PATCH-LOG.md` ebenfalls (97407 B, SHA `041c0a59348550fd91c9290dbb54b2c2b741c425`), `IronPath/docs/PATCH-LOG-ARCHIV.md` ist vorhanden, und `IronPath/empty` liefert auf `main` **404** – die Datei ist also auch ausgeliefert entfernt.
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Repository-Inhalt auf `main` und der fertige Pages-Build, nicht eine Sichtprüfung im Browser. Eine Geräteabnahme war für diese Änderung nicht vorgesehen, weil keine browsergeladene Datei geändert wurde. Ob `game-regressions` inzwischen Pflicht-Check ist, wurde für diesen Nachtrag nicht erneut geprüft.
- **Herkunft dieses Nachtrags:** Er steht als eigener Commit auf demselben Arbeitszweig nach dem Merge von `#344`; Commit- und PR-Kennung dieses Nachtrags selbst stehen deshalb nicht hier, sondern in Git und im PR-Text.


## IPL-0094 – Wegbereiter für Modul-Ordner: Packager und Wächter lernen `GAME_MODULE_FOLDERS` (keine Datei verschoben, keine Cache-Welle)

- **Zeit / Quelle:** Betreiberauftrag in dieser Sitzung: „Schlag mir was gutes vor mit Verbesserungen zu allem.“ Vier abgefragte Entscheidungen, alle bindend: Struktur = **Gruppen in Unterordner** (Eintrittspunkte, HTML und CSS bleiben in der Wurzel); Gruppierung = **nach Fachgebiet**; Tempo = **scheibenweise, ein PR pro Gruppe**; Patch-Skripte = später **ein Befehl `patch.mjs`**. Dieser Eintrag ist Phase 1 (Wegbereiter); es wandert noch keine einzige Spieldatei.
- **Block / Ziel:** Kein Spiel-Block. Ziel ist, den späteren Umzug der 187 flach liegenden `.mjs`-Module sicher zu machen, bevor er beginnt: `release-tools/stage-version.mjs` kopierte bisher nur Wurzel-`.mjs`/`.js`/`.css` in gestagte Builds — ein Modul in einem Unterordner wäre dort still verschwunden. Jetzt versteht der Packager die künftigen Fach-Ordner, und die Wächter schauen in dieselben Ordner.
- **Branch / Basis:** `arena/5ae9c8c6-0815games-github-io` ab `8b9ee57b89eb154b8585b7aa14336f4763e909f9` (`main`, Merge von PR `#345`).
- **Änderungen / Dateien:**
  - `IronPath/release-tools/stage-version.mjs`: Neue exportierte Liste `GAME_MODULE_FOLDERS` (`battle`, `core`, `i18n`, `net`, `ui`, `workshop`) als einzige Quelle der Wahrheit. Der Packager kopiert diese Ordner — wo sie existieren — rekursiv unter ihren relativen Pfaden und nur Code (`.mjs`/`.js`/`.css`); Symlinks und Nicht-Code-Dateien in einem Modul-Ordner lassen das Staging laut scheitern, statt still verloren zu gehen oder still mitzufahren. Fehlende Ordner werden übersprungen, damit eine Gruppe erst umziehen kann, nachdem der Packager sie versteht.
  - `IronPath/tests/release-stage-version.test.mjs`: Fixture um `i18n/demo.mjs`, `i18n/nested/deep.mjs` und `ui/panel.css` erweitert (Dateizahl und Inventar geprüft); neuer Test, dass Nicht-Code und Symlinks in Modul-Ordnern abgelehnt werden; der Echtbaum-Test prüft jetzt für jeden vorhandenen Modul-Ordner, dass jede Code-Datei gestagt wird.
  - `IronPath/tests/repo-structure.test.mjs`: Der Spielgraph wird jetzt pfadgenau aufgelöst (ein `../core/x.mjs` aus `i18n/` ist dasselbe Ziel wie `./core/x.mjs` aus der Wurzel) statt nur Dateinamen zu vergleichen; das Release-Inventar umfasst Wurzel plus Modul-Ordner rekursiv; erlaubte Ordner sind `assets/`, `release-tools/` und die `GAME_MODULE_FOLDERS`; neuer Wächter, dass die Liste sortiert, doppelfrei und disjunkt zu allen Arbeitsordnern ist. Importiert wird dieselbe Liste aus `stage-version.mjs`, damit Packager und Wächter nicht auseinanderlaufen können.
  - `IronPath/tests/translation-coverage.test.mjs`: Modul- und Wörterbuch-Scan laufen rekursiv über Wurzel plus Modul-Ordner (vorher nur `readdirSync(root)` — nach einem Umzug hätte der Test die Hälfte des Spiels still nicht mehr gesehen und trotzdem volle Abdeckung gemeldet).
  - `IronPath/tests/multiplayer-build-stamp.test.mjs`: Der Importeur-Scan läuft rekursiv, und das Import-Muster erkennt jetzt auch Ordnerpfade (`./i18n/x.mjs?v=…`) statt nur `./x.mjs`.
  - `IronPath/README.md` und `IronPath/docs/PATCH-ABLAUF.md`: Die sechs Fach-Ordner mit Inhaltstabelle bzw. Arbeitsregel dokumentiert (neues Modul ⇒ Fach-Ordner; Umzug heißt Importe nachziehen, Staging-Inventar vergleichen, eigene Cache-Welle).
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0074` vollständig ans Ende des Archivs verschoben, Kennungsgrenzen auf `IPL-0001` bis `IPL-0074` nachgezogen; das Log führt die neuesten 20 (`IPL-0075` bis `IPL-0094`).
- **Prüfungen:**
  - Staging-Vergleich vorher/nachher mit identischem Build-Namen: `node IronPath/release-tools/stage-version.mjs IronPath /tmp/stage-before 20990101-baseline1` (vor der Änderung) und danach in `/tmp/stage-after` — **711 gestagte Dateien, Inventar inklusive aller SHA-256-Hashes identisch**. Am ausgelieferten Spiel ändert sich also nichts.
  - Bissprobe: Eine verwaiste Probe-Datei `IronPath/i18n/zz-probe.mjs` ließ `repo-structure` wie vorgesehen rot werden (7 bestanden, 1 fehlgeschlagen, Fund beim Namen genannt); Probe und Ordner danach entfernt, Test wieder 8/8 grün. Die Probe ist nicht Teil des Baums.
  - Gesamtsuite im vollständigen Klon (nach `git fetch --unshallow origin`): `node --test IronPath/tests/*.test.mjs` = **1.260 Tests, 1.260 bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0** (vorher 1.258; +2 neue Tests aus dieser Phase).
  - `node IronPath/scripts/patch-check.mjs` vor dem Log-Eintrag: **0 Fehler**; die sieben Vertragsdateien liefen mit **30 Tests, 30 grün** (vorher 28; die zwei neuen Tests zählen mit).
  - Nach der Log-Rotation: `node --test IronPath/tests/patch-log-archive.test.mjs IronPath/tests/repo-structure.test.mjs` = **13 Tests, 13 bestanden, 0 fehlgeschlagen**; `patch-check` danach **0 Fehler, 1 Hinweis** (die noch uncommitteten Änderungen dieser Phase selbst).
  - Keine Geräte- oder Browserabnahme: Es wurde keine Datei geändert, die der Browser lädt. Der Build-Stempel bleibt unverändert `20261121-order1`; eine Cache-Welle ist für diesen Wegbereiter nicht nötig.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet` auf `arena/5ae9c8c6-0815games-github-io`. Commit, Push, PR, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen.
- **Offen / nächster Schritt:** PR für Phase 1 öffnen und erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Danach Phase 2 scheibenweise, je ein eigener PR: zuerst `i18n/` (18 `localization-*`-Module), dann `workshop/`, `net/`, `battle/`, `ui/`, `core/`; jede Scheibe mit Import-Codemod, Staging-Vergleich, voller Suite, eigener Cache-Welle und Feldnotizen DE+EN. Phase 3 danach: die drei Patch-Skripte zu einem `patch.mjs` mit Unterbefehlen zusammenführen. Der Bauplatz-Auswahlring aus PR `#336` (ohne Hover-Vorschau) bleibt geparkt und kommt als eigener Spiel-PR nach der Struktur, damit er nicht zweimal angefasst wird.

### Ereignis-Nachtrag zu IPL-0094

- **Commit / PR:** Arbeitscommit `d79ff31c` auf `arena/5ae9c8c6-0815games-github-io`; Pull-Request `#346` („Phase 1: Wegbereiter für Modul-Ordner (Packager und Wächter)“) wurde mit diesem Stand geöffnet.
- **CI:** `gh pr checks 346` endete mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend**. Belegt im Actions-Run `44978489674`, darunter `game-regressions` (Job `137073600434`), `database-rules` (Job `137073600432`) und `interface-browser-smoke` (Job `137073600131`), dazu die acht `party-finalization-browser`-Varianten und zwei Vercel-Checks.
- **Merge:** `gh pr view 346 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-22T03:09:08Z`, Merge-Commit `49b530f7ba3c290b9ab247af0e7211d3963869e9` in `main`.
- **Pages:** Der Workflow `pages build and deployment` lief als Run `44979304520` auf dem Merge-Commit mit `completed/success`; `pages/builds/latest` meldete danach `status=built`, Dauer 46.544 ms, Commit `49b530f7ba3c290b9ab247af0e7211d3963869e9`.
- **Auslieferung auf `main` belegt:** `IronPath/release-tools/stage-version.mjs` ist per Contents-API in der neuen Fassung vorhanden (14.386 B, SHA `efcbf0aae4d89bc416ffbb22634b28300ea585d2`). Die Modul-Ordner `IronPath/i18n`, `IronPath/battle` und `IronPath/ui` liefern weiter **404** — korrekt, denn in Phase 1 ist noch keine Datei umgezogen; die Ordner entstehen erst mit ihren Gruppen in Phase 2.
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Inhalt auf `main` und der fertige Pages-Build. Keine Geräteabnahme, weil keine browsergeladene Datei geändert wurde und sich keine Modul-Adresse geändert hat.
- **Herkunft dieses Nachtrags:** Er steht als eigener Commit auf demselben Arbeitszweig nach dem Merge von `#346`; seine eigene Commit- und PR-Kennung steht deshalb nicht hier, sondern in Git und im PR-Text.


## IPL-0095 – Phase 2, Scheibe 1: Die 18 deutschen Wörterbücher ziehen nach `i18n/` (eigene Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** Betreiberauftrag in dieser Sitzung, wörtlich: „Phase 2, Go“. Grundlage sind die vier Entscheidungen aus `IPL-0094`: Gruppen in Unterordner, nach Fachgebiet, scheibenweise mit einem PR pro Gruppe, Eintrittspunkte/HTML/CSS bleiben in der Wurzel.
- **Block / Ziel:** Kein Spiel-Block. Erster echter Umzug der neuen Struktur: alle 18 `localization-*-de.mjs` liegen künftig in `IronPath/i18n/`. Am Spielverhalten ändert sich nichts — dieselben Wörterbücher, dieselben Texte; nur ihre Adressen ändern sich, deshalb trägt derselbe PR eine eigene Cache-Welle (Feldnotizen-Eintrag und Stempel-Anhebung folgen als zweiter Commit, sobald die PR-Nummer existiert).
- **Branch / Basis:** `arena/a72010f0-0815games-github-io` ab `40323f869f2789391450bc5b432fe36408ae47b0` (`main`, Merge von PR `#347`).
- **Änderungen / Dateien:**
  - 18 Dateien per `git mv` nach `IronPath/i18n/` verschoben. 14 davon sind inhaltlich bytegleich; in 4 Dateien (`localization-advanced-skills-de.mjs`, `localization-campaign-de.mjs`, `localization-cinematics-de.mjs`, `localization-events-de.mjs`) zeigen die Importe auf Wurzel-Module jetzt eine Ebene hoch (`../skills.mjs` usw.); Geschwister-Importe innerhalb von `i18n/` bleiben `./`.
  - `IronPath/language.mjs`: alle 18 Wörterbuch-Importe zeigen auf `./i18n/localization-*-de.mjs`. `language.mjs` selbst bleibt als Eintrittspunkt der Sprachlogik in der Wurzel.
  - Tests nachgezogen: `../localization-…` → `../i18n/localization-…` in 11 Testdateien; die zwei Regex-Behauptungen über `language.mjs` (`first-run-german`, `story-events-german`) auf den neuen Pfad; die `read()`-Pfade in `character-name` und `patch-notes`. Die historischen Wellen-Listen in `browser-tests/cache-wave.cjs` bleiben unverändert — sie beschreiben alte Stempel, keine heutigen Pfade.
  - Zwei Wurzel-Scans, die erst diese Scheibe als Schrumpf-Gefahr entlarvt hat, ordnerfest gemacht: `tests/recruit-screen.test.mjs` las die Wörterbücher per `readdirSync(root)` und fand nach dem Umzug keine mehr (die volle Suite meldete das als fehlende deutsche Labels); `tests/tutorial.test.mjs` prüfte Token-Einigkeit nur an `./`-Importen der Wurzel und löst Spezifizierer jetzt gegen das Verzeichnis des Importeurs auf. Beide lesen jetzt Wurzel plus `GAME_MODULE_FOLDERS`.
  - `IronPath/docs/PATCH-BLOECKE.md`: Die zwei Markdown-Links auf `../localization-…` zeigen auf `../i18n/…` (der Link-Wächter in `repo-structure` meldete sie sonst als tot).
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0075` vollständig ins Archiv verschoben, Grenzen auf `IPL-0001` bis `IPL-0075` nachgezogen; das Log führt die neuesten 20 (`IPL-0076` bis `IPL-0095`).
- **Prüfungen:**
  - Betroffene Tests gezielt: 17 Dateien (u. a. `language`, `translation-coverage`, `repo-structure`, `multiplayer-build-stamp`, `release-stage-version`, `first-run-german`, `story-events-german`, `character-name`, `patch-notes`) = **123 Tests, 123 bestanden** — nach zwei Korrekturen am eigenen Codemod (die zwei Regex-Behauptungen und die `PATCH-BLOECKE`-Links waren im ersten Lauf rot und sind oben als Korrekturen benannt).
  - Staging-Vergleich gegen den `main`-Stand (Baseline per `git worktree` auf `40323f86` neu erzeugt, weil `/tmp` der Vorsitzung nicht überlebt): **711 gestagte Dateien vorher und nachher**; 18 neue `i18n/`-Adressen, 18 alte Wurzel-Adressen weg, 14 Wörterbücher mit identischem SHA-256, dazu `language.mjs` als einzige Datei mit gleicher Adresse und neuem Inhalt.
  - Gesamtsuite im vollständigen Klon: erster Lauf **1.259/1.260** (der oben genannte `recruit-screen`-Scan), nach dem Fix `node --test IronPath/tests/*.test.mjs` = **1.260 Tests, 1.260 bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0**. `patch-check` vor dem Log-Eintrag: **0 Fehler**, Verträge 30/30.
  - **Korrektur nach dem ersten CI-Lauf von PR `#348`:** `interface-browser-smoke` wurde rot, weil der Test-Server in `IronPath/browser-tests/cache-wave.cjs` per Regex nur Wurzel-Module auslieferte und `i18n/…` mit 404 beantwortete — der dynamische Import von `language.mjs` scheiterte im Chromium-Lauf daran, dass seine Wörterbücher nicht kamen. Die Regex kennt jetzt dieselben sechs Fach-Ordner wie `GAME_MODULE_FOLDERS`; die übrigen Browser-Fahrten arbeiten mit Basisnamen und waren nicht betroffen. Der zweite CI-Lauf fand danach die zweite Hälfte desselben Funds: Die Erwartungsliste derselben Fahrt prüfte die Wörterbücher noch unter ihren alten Wurzel-Adressen (`requests.includes('localization-…?v=…')`) und bekam jetzt `i18n/localization-…` — die drei Einträge zeigen auf die neuen Pfade. Beide Fixes sind Teil dieses PR; die lokale Node-Suite konnte sie nicht finden, weil sie keinen Browser startet.
  - **Korrektur nach dem ersten CI-Lauf von PR `#352`:** Die Fahrt `party-finalization-browser (test:party-natural-browser)` wurde rot, weil `IronPath/firebase/rules-test/multiplayer-browser.cjs` die gestagten Dateien unter ihren alten Wurzel-Pfaden patcht (`mp-browser-1/firebase-party-game.mjs`); sie liegen jetzt unter `mp-browser-1/net/…`. Nachgezogen wurden beide Pfade in zwei Fix-Commits — der erste enthielt versehentlich nur die Recovery-Stelle, weil eine der beiden Datei-Edits nicht im Commit landete; `git show --stat` gegen den Commit-Text hat das sichtbar gemacht, bevor die CI erneut lief. Die lokale Node-Suite startet diese Emulator-/Browser-Fahrt nicht, deshalb fand erst die CI die Stelle. Zwei rote Läufe von `interface-browser-smoke` ließen sich über die Check-Run-Annotationen aufklären (das Job-Protokoll selbst antwortete wiederholt mit einem Übertragungsfehler): Der per Basisname ausgelieferte Test-Ersatz für `firebase-party-game.mjs` in `IronPath/browser-tests/multiplayer-account-handoff.cjs` importierte `./simulation.mjs`, `./match.mjs` und `./versus.mjs` relativ zur Modul-Adresse — seit dem Umzug zeigt das auf `net/simulation.mjs` ins Leere, der Konto-Handoff blieb hängen und der Menüpunkt Mehrspieler erschien nie. Die drei Importe zeigen jetzt eine Ebene höher (`../`). Merksatz für die restlichen Scheiben: Auch eingespielte Mock-Texte lösen ihre Importe gegen die neue Ordner-Adresse der ersetzten Datei auf — nur der Basisname bleibt gleich, nicht die relative Tiefe.
  - Cache-Welle als zweiter Commit desselben PR: Feldnotizen-Eintrag `i18n1` (DE+EN, `pr: 348`) an `RELEASED_PATCHES[0]` in `patch-notes.mjs` angelegt, danach `node IronPath/scripts/patch-bump.mjs 20261122-i18n1 --apply` — Trockenlauf nannte vorab exakt **79 Dateien, 276 Token-Vorkommen, die 7 bekannten Anker-Zeilen und 3 geschützte Historien-Zeilen** in `patch-notes.mjs`; `--apply` schrieb 79 Dateien, und die Anker-Prüfung meldete danach alle 7 Anker auf `20261122-i18n1`. `patch-check` auf der neuen Welle: **0 Fehler**, Verträge 30/30, `IPL-0095` nennt die aktuelle Welle.
- **Git / PR / Release:** Erster Commit `bb20f8d1` auf `arena/a72010f0-0815games-github-io`, Pull-Request `#348` („Phase 2 (i18n): Deutsche Wörterbücher ziehen nach IronPath/i18n“) damit eröffnet. Der Wellen-Commit folgt in demselben PR; CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen. Keine Geräteabnahme bisher; die Sichtprüfung lautet nach der Veröffentlichung auf `BUILD 20261122-i18n1`.
- **Offen / nächster Schritt:** PR öffnen, Wellen-Commit mit der PR-Nummer nachschieben, CI abwarten, erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Danach die nächsten Scheiben je eigenem PR: `workshop/`, `net/`, `battle/`, `ui/`, `core/`. Der Bauplatz-Auswahlring aus PR `#336` (ohne Hover-Vorschau) bleibt geparkt, bis die Struktur steht.

### Ereignis-Nachtrag zu IPL-0095

- **Commits / PR:** Umzug `bb20f8d1`, Cache-Welle `3b037ecd`, dazu die zwei Korrekturen aus den CI-Läufen (`ac96378d` Test-Server-Regex, `f6690ad9` Erwartungsliste) auf `arena/a72010f0-0815games-github-io`; Pull-Request `#348` („Phase 2 (i18n): Deutsche Wörterbücher ziehen nach IronPath/i18n“).
- **CI:** Die ersten zwei Läufe wurden an `interface-browser-smoke` rot — beide Male dieselbe Fahrt (`cache-wave.cjs`), beide Funde sind als Korrekturen im Eintrag oben festgehalten. Der dritte Lauf endete mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend** (Actions-Run `44982679791`; `game-regressions` Job `137086408969`, `database-rules` Job `137086408998`, `interface-browser-smoke` Job `137086408842`).
- **Merge:** `gh pr view 348 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-22T04:04:02Z`, Merge-Commit `523b35986bd36582d7263719facd8eb3e6c2f4ce` in `main`.
- **Pages:** `pages/builds/latest` meldete danach `status=built`, Dauer 39.224 ms, Commit `523b35986bd36582d7263719facd8eb3e6c2f4ce`.
- **Auslieferung auf `main` belegt:** `IronPath/i18n/localization-de.mjs` und `IronPath/i18n/localization-firstrun-de.mjs` sind per Contents-API vorhanden (HTTP 200), die alte Adresse `IronPath/localization-de.mjs` liefert **404**, und `release-version.json` auf `main` trägt `"build": "20261122-i18n1"`. Die 14 inhaltlich unveränderten Wörterbücher haben im Staging-Vergleich vor dem Merge denselben SHA-256 wie vorher.
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Inhalt auf `main` und der fertige Pages-Build. **Keine Geräteabnahme:** Ob ein iPhone die Wörterbücher unter den neuen Adressen lädt und der Stempel `BUILD 20261122-i18n1` angezeigt wird, ist Sache der Betreiber-Sichtprüfung (Sprache auf Deutsch stellen und prüfen, dass überall deutsche Texte stehen).
- **Herkunft dieses Nachtrags:** Er steht als eigener Commit auf demselben Arbeitszweig nach dem Merge von `#348`; seine eigene Commit- und PR-Kennung steht deshalb nicht hier, sondern in Git und im PR-Text.


## IPL-0096 – Phase 2, Scheibe 2: Die 17 Werkstatt-Module ziehen nach `workshop/` (eigene Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** Betreiber: „Let's go“ zur nächsten Scheibe nach `IPL-0095`. Grundlage bleiben die vier Entscheidungen aus `IPL-0094` (Gruppen nach Fachgebiet, scheibenweise, ein PR pro Gruppe).
- **Block / Ziel:** Kein Spiel-Block. Alle 17 `workshop-*.mjs` der Spielwurzel liegen künftig in `IronPath/workshop/`. Spielverhalten, Werkstatt-Regeln, Speicherstände und Mehrspieler bleiben unverändert; nur die Modul-Adressen ändern sich, deshalb trägt derselbe PR wieder eine eigene Cache-Welle (zweiter Commit, sobald die PR-Nummer existiert). Die `workshop-view.css` bleibt als Stylesheet in der Wurzel, wie für CSS entschieden.
- **Branch / Basis:** `arena/de0dad79-0815games-github-io` ab `2ab2b1127fb3ffc0fb946633d58f9721e027f4d4` (`main`, Merge von PR `#349`).
- **Änderungen / Dateien:**
  - 17 Dateien per `git mv` nach `IronPath/workshop/` verschoben. 7 davon sind inhaltlich bytegleich; in 10 Dateien zeigen Importe auf Wurzel-Module jetzt eine Ebene hoch; Geschwister-Importe innerhalb von `workshop/` bleiben `./`.
  - 9 Wurzel-Dateien zeigen auf `./workshop/workshop-…` (`account.js`, `game.js`, `match.mjs`, `simulation.mjs`, `solo-deployment.mjs`, `coop-motion.mjs`, `coop-rewards.mjs`, `firebase-party-game.mjs`, `firebase-recoverable-game.mjs`).
  - Mitgezogen: `IronPath/server/` (3 Dateien importieren `../workshop/workshop-…`), `IronPath/firebase/rules-test/` (4 Dateien, `../../workshop/workshop-…`), 21 Testdateien (`../workshop/workshop-…`), der Stempel-Test-Schlüssel `workshop/workshop-multiplayer-game.mjs` in `multiplayer-build-stamp` (dessen Abhängigkeits-Karte liest die Datei unter diesem Pfad) und der dynamische Import in `browser-tests/command-center.cjs` (`./workshop/workshop-view.mjs`, `./workshop/workshop-wire.mjs`; das Stylesheet `workshop-view.css` bleibt an der Wurzel).
  - 13 Harness-Listen führen den Eintrag jetzt als `workshop/workshop-run-receipt.mjs`, weil die Harnische den Pfad so ersetzen, wie er im Import von `game.js` steht und die Datei relativ zur Spielwurzel laden.
  - `IronPath/tests/endless-retreat-viewport.test.mjs`: Die generische Ersetzungs-Regex dieses Harness kannte keine Schrägstriche (`[\w.-]+`) und hätte das umgezogene Modul nicht ersetzt — der erste Gesamtlauf wurde daran rot (`ERR_UNSUPPORTED_RESOLVE_REQUEST` im data:-Import, 3 Tests). Die Zeichenklasse umfasst jetzt auch `/`; es war die einzige Stelle mit diesem generischen Muster.
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0076` vollständig ins Archiv, Grenzen auf `IPL-0001` bis `IPL-0076` nachgezogen; das Log führt die neuesten 20 (`IPL-0077` bis `IPL-0096`).
- **Prüfungen:**
  - Betroffene Tests gezielt vorab: 147 Tests über alle `workshop-*`-Suiten, die 13 Harnische und die Verträge — ein Fund (`multiplayer-build-stamp` las die verschobene Datei unter altem Pfad), danach grün.
  - Staging-Vergleich gegen den `main`-Stand (Baseline per `git worktree` auf `2ab2b112`): **711 gestagte Dateien vorher und nachher**; 17 neue `workshop/`-Adressen, 7 Module mit identischem SHA-256, 9 Wurzel-Dateien mit gleicher Adresse und neuem Inhalt (nur Import-Pfade).
  - Gesamtsuite im vollständigen Klon: erster Lauf **1.257/1.260** (der oben genannte `endless-retreat-viewport`-Harness), nach dem Fix `node --test IronPath/tests/*.test.mjs` = **1.260 Tests, 1.260 bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0**. `patch-check` vor dem Log-Eintrag: **0 Fehler**.
  - Cache-Welle als zweiter Commit desselben PR: Feldnotizen-Eintrag `workshop1` (DE+EN, `pr: 350`) in `patch-notes.mjs` angelegt, danach `patch-bump 20261122-workshop1 --apply` — Trockenlauf nannte vorab exakt **79 Dateien, 276 Token-Vorkommen und die 7 bekannten Anker-Zeilen**; die Anker-Prüfung meldete danach alle 7 Anker auf `20261122-workshop1`.
- **Git / PR / Release:** Erster Commit `79564fbf` auf `arena/de0dad79-0815games-github-io`, Pull-Request `#350` („Phase 2 (workshop): Werkstatt-Module ziehen nach IronPath/workshop“) damit eröffnet. Der Wellen-Commit folgt in demselben PR; CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen. Keine Geräteabnahme bisher; die Sichtprüfung lautet auf `BUILD 20261122-workshop1` und eine unverändert öffnende Werkstatt.
- **Offen / nächster Schritt:** PR öffnen, Wellen-Commit nachschieben, CI abwarten, erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Danach `net/`, `battle/`, `ui/`, `core/` je eigenem PR. Der Bauplatz-Auswahlring aus PR `#336` (ohne Hover-Vorschau) bleibt geparkt, bis die Struktur steht.

### Ereignis-Nachtrag zu IPL-0096

- **Commits / PR:** Umzug `79564fbf` und Cache-Welle `01a9d171` auf `arena/de0dad79-0815games-github-io`; Pull-Request `#350` („Phase 2 (workshop): Werkstatt-Module ziehen nach IronPath/workshop“).
- **CI:** `gh pr checks 350` endete im ersten Lauf mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend** (Actions-Run `44986235379`; `game-regressions` Job `137097298394`, `database-rules` Job `137097298142`, `interface-browser-smoke` Job `137097298434`). Anders als bei der `i18n`-Scheibe musste kein Browser-Test nachgezogen werden — der `cache-wave`-Testserver kannte den Ordner `workshop/` bereits aus dem Wegbereiter.
- **Merge:** `gh pr view 350 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-22T04:52:24Z`, Merge-Commit `930b4e38a16991518d74d4c49a3d1e1d278be8b4` in `main`.
- **Pages:** `pages/builds/latest` meldete danach `status=built`, Dauer 40.588 ms, Commit `930b4e38a16991518d74d4c49a3d1e1d278be8b4`.
- **Auslieferung auf `main` belegt:** `IronPath/workshop/workshop-wire.mjs` und `IronPath/workshop/workshop-view.mjs` sind per Contents-API vorhanden (HTTP 200), die alte Adresse `IronPath/workshop-wire.mjs` liefert **404**, und `release-version.json` auf `main` trägt `"build": "20261122-workshop1"`.
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Inhalt auf `main` und der fertige Pages-Build. **Keine Geräteabnahme:** Stempel `BUILD 20261122-workshop1` und die unverändert öffnende Werkstatt (Gegenstände, Schrott, ausgerüstete Teile) sind Sache der Betreiber-Sichtprüfung.
- **Herkunft dieses Nachtrags:** Er steht als eigener Commit auf demselben Arbeitszweig nach dem Merge von `#350`; seine eigene Commit- und PR-Kennung steht deshalb nicht hier, sondern in Git und im PR-Text.


## IPL-0097 – Phase 2, Scheibe 3: Die 15 Firebase-Clientmodule ziehen nach `net/` (eigene Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** Betreiber: „top, ging und weiter“ — Freigabe und Fortsetzung nach der `workshop/`-Scheibe (`IPL-0096`). Grundlage bleiben die vier Entscheidungen aus `IPL-0094`.
- **Block / Ziel:** Kein Spiel-Block. Alle 15 `firebase-*.mjs` der Spielwurzel (Party-Kanal und -Sitzungen, Four-Lobby, Durable-/Recovery-Sitzungen) liegen künftig in `IronPath/net/`. Spielverhalten, Mehrspieler-Protokoll, Speicherstände und die Firebase-Regeln im Ordner `firebase/` bleiben unverändert; nur die Modul-Adressen ändern sich, deshalb trägt derselbe PR wieder eine eigene Cache-Welle (zweiter Commit, sobald die PR-Nummer existiert).
- **Branch / Basis:** `arena/c1f67000-0815games-github-io` ab `af8241a4fb566bed112fa95bc403960163dc4adf` (`main`, Merge von PR `#351`).
- **Änderungen / Dateien:**
  - 15 Dateien per `git mv` nach `IronPath/net/` verschoben. 6 davon sind inhaltlich bytegleich; in 9 Dateien zeigen Importe auf Wurzel-Module jetzt eine Ebene hoch; Geschwister-Importe innerhalb von `net/` bleiben `./`.
  - Einziger Wurzel-Importeur ist `IronPath/account.js` (7 Importe auf `./net/firebase-…` umgestellt).
  - Mitgezogen: 22 Testdateien (`../net/firebase-…`), 13 Dateien in `IronPath/firebase/rules-test/` (`../../net/firebase-…`), der Lesepfad `net/firebase-party-game.mjs` in `language.test` und fünf Abhängigkeits-Schlüssel in `multiplayer-build-stamp` (`net/firebase-…`, weil diese Karte die Dateien unter ihrem Pfad liest).
  - `IronPath/browser-tests/cache-wave.cjs`: Die zwei absoluten Importe zeigen auf `/IronPath/net/firebase-party-game.mjs` bzw. `net/firebase-recoverable-game.mjs`, und die Erwartungsliste führt die drei Netz-Module mit `net/`-Präfix. Der Test-Server kannte den Ordner bereits aus dem Wegbereiter (`IPL-0094`).
  - **Korrektur am eigenen Codemod, vom Struktur-Wächter gefunden:** Zwei bereits umgezogene Querverweise (`./workshop/workshop-multiplayer-game.mjs` und `./workshop/workshop-match-validation.mjs` in `firebase-party-game` und `firebase-recoverable-game`) zeigten nach dem Umzug auf `net/workshop/…` ins Leere — der erste Codemod-Lauf erkannte nur einfache Dateinamen, keine Ordnerpfade. Der Wächter meldete beide Module als verwaist; die vier Importe zeigen jetzt auf `../workshop/…`. Merksatz für die restlichen Scheiben: Importe, die bereits in einen Fach-Ordner zeigen, brauchen beim Umzug des Importeurs ebenfalls ein `../` davor.
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0077` vollständig ins Archiv, Grenzen auf `IPL-0001` bis `IPL-0077` nachgezogen; das Log führt die neuesten 20 (`IPL-0078` bis `IPL-0097`).
- **Prüfungen:**
  - Betroffene Tests gezielt: 44 Vertrags-/Strukturtests (ein Fund: die oben genannten verwaisten Querverweise) und **263 Netz-Tests** (`durable-*`, `firebase-*`, `four-*`, `party-*`, `coop-*`, `friends*`, `social-*`, `multiplayer-*`, Konto-Suiten) — alle bestanden.
  - Staging-Vergleich gegen den `main`-Stand (Baseline per `git worktree` auf `af8241a4`): **711 gestagte Dateien vorher und nachher**; 15 neue `net/`-Adressen, 6 Module mit identischem SHA-256, `account.js` als einzige Datei mit gleicher Adresse und neuem Inhalt.
  - Gesamtsuite im vollständigen Klon: `node --test IronPath/tests/*.test.mjs` = **1.260 Tests, 1.260 bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0**. `patch-check` vor dem Log-Eintrag: **0 Fehler**.
  - Cache-Welle als zweiter Commit desselben PR: Feldnotizen-Eintrag `net1` (DE+EN, `pr: 352`) in `patch-notes.mjs` angelegt, danach `patch-bump 20261122-net1 --apply` — Trockenlauf nannte vorab exakt **79 Dateien, 276 Token-Vorkommen und die 7 bekannten Anker-Zeilen**; die Anker-Prüfung meldete danach alle 7 Anker auf `20261122-net1`.
- **Git / PR / Release:** Erster Commit `30e9161c` auf `arena/c1f67000-0815games-github-io`, Pull-Request `#352` („Phase 2 (net): Firebase-Clientmodule ziehen nach IronPath/net“) damit eröffnet. Der Wellen-Commit folgt in demselben PR; CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen. Keine Geräteabnahme bisher; die Sichtprüfung lautet auf `BUILD 20261122-net1` und einen unveränderten Party-Beitritt.
- **Offen / nächster Schritt:** PR öffnen, Wellen-Commit nachschieben, CI abwarten, erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Danach `battle/`, `ui/`, `core/` je eigenem PR. Der Bauplatz-Auswahlring aus PR `#336` (ohne Hover-Vorschau) bleibt geparkt, bis die Struktur steht.

### Ereignis-Nachtrag zu IPL-0097

- **Commits / PR:** Umzug `30e9161c`, Cache-Welle `6c15eefc`, zwei Pfad-Fixe am Emulator-Test (`02a05354`, `7c0b5e05`), Log-Präzisierung `fef167b6` und Mock-Fix `7b4c3aa3` auf `arena/c1f67000-0815games-github-io`; Pull-Request `#352` („Phase 2 (net): Firebase-Clientmodule ziehen nach IronPath/net“).
- **CI-Verlauf:** Lauf 1 rot an `party-finalization-browser (test:party-natural-browser)` (gestagter Pfad im Emulator-Test), Lauf 2 rot an `interface-browser-smoke` (Mock-Tiefe im Handoff-Test), Lauf 3 mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend** (Actions-Run `44994855244`, `interface-browser-smoke` Job `137123578756`). Die Ursachen und Merksätze stehen in den Korrektur-Punkten oben.
- **Merge:** `gh pr view 352 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-22T06:54:33Z`, Merge-Commit `9f4bb8143ea81244150629efd68a44baa0e0c4f9` in `main`.
- **Pages:** `pages/builds` meldete danach `status=built`, Dauer 47.330 ms, Commit `9f4bb814`.
- **Auslieferung auf `main` belegt:** `IronPath/net/firebase-party-game.mjs` ist per Contents-API vorhanden (HTTP 200), die alte Adresse `IronPath/firebase-party-game.mjs` liefert **404**, und `release-version.json` auf `main` trägt `"build": "20261122-net1"`.
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Inhalt auf `main` und der fertige Pages-Build. **Keine Geräteabnahme:** Stempel `BUILD 20261122-net1` und eine Party erstellen/beitreten (Kampf startet wie bisher) sind Sache der Betreiber-Sichtprüfung; auch die `workshop1`- und Deutsch-Sichtprüfungen der vorigen Scheiben stehen noch aus.
- **Herkunft dieses Nachtrags:** Er steht als eigener Commit auf demselben Arbeitszweig nach dem Merge von `#352`; seine eigene Commit- und PR-Kennung steht deshalb nicht hier, sondern in Git und im PR-Text.

## IPL-0098 – Phase 2, Scheibe 4: Die 6 Kampf-Module ziehen nach `battle/` (eigene Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** Betreiber: „und weiter“ — Fortsetzung der Phase 2 nach der `net/`-Scheibe (`IPL-0097`). Grundlage bleiben die vier Entscheidungen aus `IPL-0094`.
- **Block / Ziel:** Kein Spiel-Block. Alle 6 `battle-*.mjs` der Spielwurzel (Kampf-Klang und -Musik, Kamera-Viewport, XP-HUD) liegen künftig in `IronPath/battle/`. Spielverhalten bleibt unverändert; nur die Modul-Adressen ändern sich, deshalb trägt derselbe PR wieder eine eigene Cache-Welle (zweiter Commit, sobald die PR-Nummer existiert).
- **Branch / Basis:** `arena/c1f67000-0815games-github-io` ab `dbdcdb8577b97852b8d5d489090a3c9b65905ef3` (`main`, Merge von PR `#353`).
- **Änderungen / Dateien:**
  - 6 Dateien per `git mv` nach `IronPath/battle/` verschoben. 4 davon sind inhaltlich bytegleich; `battle-sound.mjs` und `battle-xp-hud.mjs` zeigen mit je einem Import (`../story-map-art.mjs`, `../progression.mjs`) eine Ebene hoch; Geschwister-Importe innerhalb von `battle/` bleiben `./`.
  - Wurzel-Importeur: `IronPath/game.js` (4 Importe auf `./battle/…` umgestellt). `settings.mjs` nennt `battle-sound.mjs` nur in einem erklärenden Kommentar; `patch-notes.mjs` nennt die Module nur in alten Feldnotizen-Texten — beides unverändert.
  - Mitgezogen: 19 Testdateien (`../battle/battle-…`), davon der echte Lesezugriff `battle/battle-viewport-controller.mjs` in `tests/multiplayer-build-stamp.test.mjs`; die zwei absoluten Importe (`/IronPath/battle/battle-sound.mjs`, `/IronPath/battle/battle-music.mjs`) und die fünf Namen der aktuellen Erwartungsliste in `IronPath/browser-tests/cache-wave.cjs` — die historischen Wellenlisten derselben Datei bleiben unangetastet; die Seiten-Importe in `browser-tests/multiplayer-field.cjs` (4×), `browser-tests/multiplayer-fullscreen.cjs` (2×) und `firebase/rules-test/multiplayer-browser.cjs` (1×) zeigen jetzt auf `./battle/battle-viewport.mjs`.
  - **Bewusst nicht angefasst:** Der instrumentierte Ersatz in `multiplayer-fullscreen.cjs` importiert `./battle-viewport-controller.mjs?instrumented=1` relativ zur Adresse der ersetzten Datei selbst; diese Adresse liegt jetzt in `battle/`, also bleibt das `./` dort korrekt (Gegenstück zum `net/`-Mock-Fund aus `IPL-0097`: gleiche Regel, umgekehrtes Ergebnis).
  - **Korrektur am eigenen Test-Umbau:** Der Stempel-Test `multiplayer-build-stamp` prüft seine 90er-Fixture über **Basisnamen** (der Scan-Regex kennt keine Ordner); mein Codemod hatte die fünf `battle/`-Namen zunächst mit Ordner in diese Liste geschrieben (Fixture-Assertion rot) und beim Zurückdrehen versehentlich auch den echten Lesezugriff auf Basisname gesetzt (ENOENT rot). Endstand: Fixture bleibt bei Basisnamen — wie die `firebase-…`- und `localization-…`-Einträge dort auch — und nur der Lesezugriff trägt `battle/`. Beide Rot-Funde kamen aus der lokalen gezielten Testrunde, nicht aus der CI.
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0078` vollständig ins Archiv, Grenzen auf `IPL-0001` bis `IPL-0078` nachgezogen; das Log führt die neuesten 20 (`IPL-0079` bis `IPL-0098`).
- **Prüfungen:**
  - Betroffene Tests gezielt: 45 Vertrags-, Struktur- und Kampf-Tests in 8 Dateien — nach den zwei oben benannten Korrekturen **alle bestanden**.
  - Staging-Vergleich gegen den `main`-Stand (Baseline per `git worktree` auf `dbdcdb85`, gleiche Build-ID `20990101-baseline1`): **712 gestagte Dateien vorher und nachher**; 6 neue `battle/`-Adressen, 4 Module mit identischem SHA-256, `game.js` als einzige Datei mit gleicher Adresse und neuem Inhalt; das `release-manifest.json` unterscheidet sich nur durch die neuen Adressen.
  - Gesamtsuite im vollständigen Klon: `node --test IronPath/tests/*.test.mjs` = **1.260 Tests, 1.260 bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0**. `patch-check` vor dem Log-Eintrag: **0 Fehler** (1 Hinweis).
  - Cache-Welle als zweiter Commit desselben PR: Feldnotizen-Eintrag `battle1` (DE+EN, `pr: 354`) in `patch-notes.mjs` angelegt, danach `patch-bump 20261122-battle1 --apply` — Trockenlauf nannte vorab exakt **79 Dateien, 276 Token-Vorkommen und die 7 bekannten Anker-Zeilen**; die Anker-Prüfung meldete danach alle 7 Anker auf `20261122-battle1`, und die Gesamtsuite lief auf der neuen Welle erneut **1.260/1.260** (Exit 0).
- **Git / PR / Release:** Der erste Commit entsteht auf `arena/c1f67000-0815games-github-io`; PR-Nummer, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen. Keine Geräteabnahme bisher; die Sichtprüfung des Betreibers lautet auf `BUILD 20261122-battle1` und einen unveränderten Kampf (Klang, Kamera, XP-Anzeige).
- **Offen / nächster Schritt:** PR öffnen, Wellen-Commit nachschieben, CI abwarten, erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Danach `ui/` und `core/` je eigenem PR. Der Bauplatz-Auswahlring aus PR `#336` (ohne Hover-Vorschau) bleibt geparkt, bis die Struktur steht. Die Sichtprüfungen zu `net1` (Party-Beitritt), `workshop1` (Werkstatt) und den Deutsch-Texten stehen ebenfalls noch aus.

### Ereignis-Nachtrag zu IPL-0098

- **Commits / PR:** Umzug `e52074d5` und Cache-Welle `aa09f3c4` auf `arena/c1f67000-0815games-github-io`; Pull-Request `#354` („Phase 2 (battle): Kampf-Module ziehen nach IronPath/battle“).
- **CI:** `gh pr checks 354` endete im ersten Lauf mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend** — zum ersten Mal in Phase 2 ohne nachgezogene Browser- oder Emulator-Fahrt; die zwei bekannten Fallen (Seiten-Importe der Smoke-Fahrten, pfad-patchender Emulator-Test) waren diesmal vorab mitgezogen.
- **Merge:** `gh pr view 354 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-22T07:46:29Z`, Merge-Commit `a282f1a1bea95c80b7794862c324867390d99046` in `main`.
- **Pages:** `pages/builds` meldete danach `status=built`, Dauer 52.106 ms, Commit `a282f1a1`.
- **Auslieferung auf `main` belegt:** `IronPath/battle/battle-sound.mjs` ist per Contents-API vorhanden (HTTP 200), die alte Adresse `IronPath/battle-sound.mjs` liefert **404**, und `release-version.json` auf `main` trägt `"build": "20261122-battle1"`.
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Inhalt auf `main` und der fertige Pages-Build. **Keine Geräteabnahme:** Stempel `BUILD 20261122-battle1` und ein unverändertes Gefecht (Klang, Kamera, XP-Anzeige) sind Sache der Betreiber-Sichtprüfung; auch die Sichtprüfungen zu `net1` (Party-Beitritt), `workshop1` (Werkstatt) und den Deutsch-Texten stehen noch aus.
- **Herkunft dieses Nachtrags:** Er steht als eigener Commit auf demselben Arbeitszweig nach dem Merge von `#354`; seine eigene Commit- und PR-Kennung steht deshalb nicht hier, sondern in Git und im PR-Text.

## IPL-0099 – Phase 2, Scheibe 5: Die 25 Oberflächen-Module ziehen nach `ui/` (eigene Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** Betreiber-Vorgabe „und weiter“ plus ausdrückliche Umfangswahl für diese Scheibe: Zuschnitt „Eng“ (25 Dateien) statt der breiten Variante (~45) oder nur der Suffix-Dateien (10). Grundlage bleiben die vier Entscheidungen aus `IPL-0094`.
- **Block / Ziel:** Kein Spiel-Block. Alle `*-ui`-, `*-screen`-, `*-hud`- und `*-indicator`-Module plus die reinen Szenen-/Menü-/Overlay-Module (25 Dateien) liegen künftig in `IronPath/ui/`. Grenzfälle mit eigener Logik (`settings`, `command-center`, `friends`, `tutorial`) bleiben für die letzte Scheibe `core/`. Spielverhalten bleibt unverändert; nur die Modul-Adressen ändern sich, deshalb trägt derselbe PR wieder eine eigene Cache-Welle (zweiter Commit, sobald die PR-Nummer existiert).
- **Branch / Basis:** `arena/00013c21-0815games-github-io` ab `3a58a104f026ae658f36ae633daa3aeb1e21b593` (`main`, Merge von PR `#355`).
- **Änderungen / Dateien:**
  - 25 Dateien per `git mv` nach `IronPath/ui/` verschoben. 12 davon sind inhaltlich bytegleich; in 13 zeigen Importe auf Wurzel-Module jetzt eine Ebene hoch; Geschwister-Importe innerhalb von `ui/` (z. B. `dialog-dismiss`, `popover-host`, `friend-indicator`) bleiben `./`.
  - Wurzel-Importeure: `IronPath/account.js` (19 Importe), `IronPath/game.js` (6), `maintenance-bootstrap.mjs` und `tutorial.mjs` (je 1) zeigen auf `./ui/…`; `IronPath/index.html` lädt das Intro jetzt als `ui/intro.mjs` (das HTML selbst bleibt in der Wurzel).
  - **Die Anker-Datei der Patch-Werkzeuge zieht mit:** `login-scene.mjs` ist einer der sieben Stempel-Anker (`LOGIN_SCENE_VERSION`). `scripts/patch-lib.mjs`, `scripts/patch-bump.mjs` und `scripts/patch-check.mjs` führen sie jetzt als `ui/login-scene.mjs`; die Miniatur-Fixture in `tests/patch-tooling.test.mjs` legt sie entsprechend unter `ui/` an (mit `../language.mjs`-Import wie im echten Baum).
  - Mitgezogen: 35 Testdateien (Importe und Lesezugriffe `../ui/…`), der Lesepfad und die Import-Regex in `tests/first-run-german.test.mjs` (`../language.mjs` aus `ui/`), drei aktive Datei-Links in `docs/PATCH-BLOECKE.md`, die Ersetzungslisten von 13 UI-Testdateien sowie einzelne Lesezugriffe in `tests/first-run-layout.test.mjs`, `tests/settings.test.mjs` und `tests/tutorial.test.mjs`.
  - Browser-Fahrten: `cache-wave.cjs` (vier absolute Importe und sechs Namen der aktuellen Erwartungsliste auf `ui/…`; historische Wellenlisten unverändert) und die Seiten-Importe in `friends-sections.cjs` und `multiplayer-prompt-layout.cjs`. Die `friends-ui`-Ersatztexte in `avatar-handover.cjs`, `character-discharge.cjs` und `name-conflict.cjs` werden per Basisname eingespielt und enthalten keine Importe — sie bleiben unverändert (Regel aus `IPL-0097`).
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0079` vollständig ins Archiv, Grenzen auf `IPL-0001` bis `IPL-0079` nachgezogen; das Log führt die neuesten 20 (`IPL-0080` bis `IPL-0099`).
- **Korrekturen an den eigenen Umbauten, alle lokal gefunden:**
  - Die erste gezielte Runde fing vier Stellen: die Werkzeug-Fixture (oben), den `first-run-german`-Lesepfad samt Regex und die drei `PATCH-BLOECKE`-Links, die der Markdown-Link-Wächter als ziellos meldete.
  - Die erste Gesamtsuite meldete **27 Fehler in 13 UI-Testdateien**: Deren Harness baut aus einer Liste nackter Dateinamen die echten Modul-URLs und schreibt damit die Importe von `game.js` um; die sechs Oberflächen-Namen standen dort noch ohne Ordner (Muster wie `battle/…` in denselben Listen). Die Listen führen jetzt `ui/…`; danach war die Suite grün. Merksatz für `core/`: Solche Ersetzungslisten müssen bei jedem Umzug mit durchsucht werden — sie enthalten keine Importe und fallen in der Referenz-Inventur nicht auf.
  - Ein übersprungener Test im selben Lauf betraf nicht den Umbau: Der frische Zweig war flach geklont; nach `git fetch --unshallow origin` lief er mit (Endstand 0 übersprungen).
- **Prüfungen:**
  - Betroffene Tests gezielt: 58 Vertrags-/Struktur-Tests und 69 UI-Harness-Tests — nach den oben benannten Korrekturen **alle bestanden**.
  - Staging-Vergleich gegen den `main`-Stand (Baseline per `git worktree` auf `3a58a104`, gleiche Build-ID `20990101-baseline1`): **712 gestagte Dateien vorher und nachher**; 25 neue `ui/`-Adressen, 12 Module mit identischem SHA-256; mit gleicher Adresse und neuem Inhalt nur `account.js`, `game.js`, `index.html`, `maintenance-bootstrap.mjs` und `tutorial.mjs`; das `release-manifest.json` unterscheidet sich nur durch die neuen Adressen.
  - Gesamtsuite im vollständigen Klon: `node --test IronPath/tests/*.test.mjs` = **1.260 Tests, 1.260 bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0**. `patch-check` vor dem Log-Eintrag: **0 Fehler** (2 Hinweise).
  - Cache-Welle als zweiter Commit desselben PR: Feldnotizen-Eintrag `ui1` (DE+EN, `pr: 356`) in `patch-notes.mjs` angelegt, danach `patch-bump 20261122-ui1 --apply` — Trockenlauf nannte vorab exakt **79 Dateien, 276 Token-Vorkommen und die 7 bekannten Anker-Zeilen** (darunter erstmals `ui/login-scene.mjs`); die Anker-Prüfung meldete danach alle 7 Anker auf `20261122-ui1`, und die Gesamtsuite lief auf der neuen Welle erneut **1.260/1.260** (Exit 0).
- **Git / PR / Release:** Der erste Commit entsteht auf `arena/00013c21-0815games-github-io`; PR-Nummer, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen. Keine Geräteabnahme bisher; die Sichtprüfung des Betreibers lautet auf `BUILD 20261122-ui1`, die Anmelde-Szene und ein Gefecht mit HUD und Feldmenü.
- **Offen / nächster Schritt:** PR öffnen, Wellen-Commit nachschieben, CI abwarten, erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Danach bleibt in Phase 2 nur `core/`; anschließend Phase 3 (Patch-CLI). Der Bauplatz-Auswahlring aus PR `#336` (ohne Hover-Vorschau) bleibt geparkt, bis die Struktur steht. Die Sichtprüfungen zu `battle1` (Gefecht), `net1` (Party), `workshop1` (Werkstatt) und den Deutsch-Texten stehen ebenfalls noch aus.

### Ereignis-Nachtrag zu IPL-0099

- **Commits / PR:** Umzug `4e85e50c` und Cache-Welle `7392f0d5` auf `arena/00013c21-0815games-github-io`; Pull-Request `#356` („Phase 2 (ui): Oberflächen-Module ziehen nach IronPath/ui“).
- **CI:** `gh pr checks 356` endete im ersten Lauf mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend**. Die zwei Rot-Runden dieser Scheibe (Werkzeug-Fixture, Harness-Ersetzungslisten) fing die lokale Suite vor dem ersten Push; die drei Fallen der vorigen Scheiben waren vorab geprüft.
- **Merge:** `gh pr view 356 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-22T11:40:50Z`, Merge-Commit `728c59e968b0f576e81b9004c3f15e2f175a2a87` in `main`.
- **Pages:** `pages/builds` meldete danach `status=built`, Dauer 40.964 ms, Commit `728c59e9`.
- **Auslieferung auf `main` belegt:** `IronPath/ui/intro.mjs` und `IronPath/ui/login-scene.mjs` sind per Contents-API vorhanden (HTTP 200), die alte Adresse `IronPath/intro.mjs` liefert **404**, und `release-version.json` auf `main` trägt `"build": "20261122-ui1"`.
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Inhalt auf `main` und der fertige Pages-Build. **Keine Geräteabnahme:** Stempel `BUILD 20261122-ui1`, die Anmelde-Szene und ein Gefecht mit HUD und Feldmenü sind Sache der Betreiber-Sichtprüfung; auch die Sichtprüfungen zu `battle1` (Gefecht), `net1` (Party), `workshop1` (Werkstatt) und den Deutsch-Texten stehen noch aus.
- **Herkunft dieses Nachtrags:** Er steht als eigener Commit auf demselben Arbeitszweig nach dem Merge von `#356`; seine eigene Commit- und PR-Kennung steht deshalb nicht hier, sondern in Git und im PR-Text.

## IPL-0100 – Phase 2, Scheibe 6: Die 101 Kern-Module ziehen nach `core/` – die Fach-Ordnung ist komplett (eigene Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** Betreiber-Vorgabe „und weiter“ plus ausdrückliche Umfangswahl für diese Scheibe: Zuschnitt „Alles außer Eintritt“ statt zweier Schritte oder nur des Spiellogik-Kerns. Grundlage bleiben die vier Entscheidungen aus `IPL-0094`.
- **Block / Ziel:** Kein Spiel-Block. Alle 101 verbleibenden Spielmodule der Wurzel liegen künftig in `IronPath/core/`. In der Wurzel bleiben nur die Eintrittspunkte `account-entry.mjs`, `admin-entry.mjs`, `account.js`, `game.js`, `language.mjs`, `language-gate.mjs` und `patch-notes.mjs` neben `index.html` und den Stylesheets. Spielverhalten, Protokoll und Speicherstände ändern sich nicht; nur die Modul-Adressen wandern, deshalb trägt derselbe PR wieder eine eigene Cache-Welle (dritter Commit, sobald die PR-Nummer existiert).
- **Branch / Basis:** `arena/c2c8e808-0815games-github-io` ab `ce5129216f609ef321331f2778efeb2faf3b53ca` (`main`, Merge von PR `#357`). Erster Commit `c6dc99d2` (341 Dateien).
- **Änderungen / Dateien:**
  - 101 Dateien per `git mv` nach `IronPath/core/` verschoben. **82 davon sind inhaltlich bytegleich**; in den übrigen 19 zeigen Importe eine Ebene hoch (`../language.mjs`, `../game.js`) oder auf Geschwister/Ordner der anderen Fachgebiete.
  - Mitgezogen: die fünf verbleibenden Wurzel-Dateien (43 Importe in `account.js`, 39 in `game.js`), alle Fachordner (`i18n/`, `net/`, `ui/`, `workshop/`, `battle/`: `../core/…`), `server/`, die `firebase/`-Kandidaten, `stress-tests/`, `scripts/map-review-render.mjs`, über 100 Testdateien und sechs aktive Datei-Links in `docs/PATCH-BLOECKE.md`.
  - **Die Release-Werkzeuge führen den neuen Ort der kritischen Datei:** `verify-staged-build.mjs` verlangt im Inventar jetzt `core/account-services.mjs`, und `stage-version.mjs` prüft den Registry-Import in beiden Formen (`./core/account-services.mjs` aus `account.js`, `../core/account-services.mjs` aus dem Guard-Einstieg). Die Inventar- und Guard-Fixtures der Tests (`release-stage-version`, `release-site-packaging`, Miniatur in `patch-tooling`) bilden den neuen Ort nach.
  - Browser-Fahrten: aktive absolute Importe und Erwartungsliste in `cache-wave.cjs`, die Seiten-Importe in sieben Smoke-Fahrten und die Tiefe des `partyGame`-Ersatzes in `multiplayer-account-handoff.cjs` (`../core/simulation.mjs` – derselbe Mock wie in `IPL-0097`, dessen Ziele jetzt in `core/` liegen). Die gestagten Patch-Ziele der Emulator-Fahrten (`net/…`-Dateien, Code-Inhalte statt Pfade) bleiben unverändert gültig.
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0080` vollständig ins Archiv, Grenzen auf `IPL-0001` bis `IPL-0080` nachgezogen; das Log führt die neuesten 20 (`IPL-0081` bis `IPL-0100`).
- **Korrekturen an den eigenen Umbauten, alle lokal gefunden:**
  - Der erste Codemod hob in `core/` auch Geschwister-Importe auf `../` an (er verglich Modulnamen inklusive `?v=`-Token): Der Struktur-Wächter meldete neun scheinbar verwaiste Module; 43 Dateien auf die `./`-Form zurückgesetzt.
  - Der geänderte Guard-Regex in `stage-version.mjs` trug kurz ein unmaskiertes `/` vor `core` (Syntaxfehler); die Ersetzung läuft jetzt zeichen- statt anzeigegestützt, weil die Werkzeug-Anzeige Backslashes verdoppelt.
  - Drei Rot-Runden der Gesamtsuite (34 → 6 → 0 Fehler): Harness-Ersetzungslisten von 14 UI-Testdateien führen jetzt `core/…` (eine Listen-Automatik schrieb versehentlich auch die Basisnamen-Fixture des Stempel-Tests um und wurde dort von Hand zurückgeführt), dazu die `skills`-Sonder-Ersetzung, verstreute Lesezugriffe (`menu-redesign`, `language`, `character-name`, `tutorial`, `story-events-german`) und die Token-Zielangabe `core/tutorial.mjs`.
  - **Zwischenstand-Effekt, kein Defekt:** Der Pages-Artefakt-Test pinnt die Spielrevision auf `HEAD`; solange der Umzug uncommittet war, verlangte die neue kritische-Dateien-Liste `core/account-services.mjs` von einem alten Baum („Incomplete build inventory“). Nach dem ersten Commit läuft er grün (Endstand der Suite unten). **Ehrliche Grenze desselben Schnitts:** Gepinnte Builds von vor `core1` lassen sich mit der neuen Liste nicht mehr als geschütztes Spiel verifizieren – ein Rollback muss auf Stände ab `20261122-core1` zeigen.
- **Prüfungen:**
  - Betroffene Tests gezielt: 39 Vertrags-/Struktur-Tests (Staging, Guards, Struktur-Wächter, Stempel) und alle Korrektur-Runden oben – am Ende **alle bestanden**; `patch-check`: **0 Fehler** (1 Hinweis).
  - Staging-Vergleich gegen den `main`-Stand (Baseline per `git worktree` auf `ce512921`, gleiche Build-ID `20990101-baseline1`): **712 gestagte Dateien vorher und nachher**; 101 neue `core/`-Adressen, 82 Module mit identischem SHA-256; mit gleicher Adresse und neuem Inhalt nur die Import-Umbauten der anderen Ordner und Eintrittspunkte; das `release-manifest.json` unterscheidet sich nur durch die neuen Adressen.
  - Gesamtsuite im vollständigen Klon nach dem Umzug-Commit: `node --test IronPath/tests/*.test.mjs` = **1.260 Tests, 1.260 bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0**.
  - Cache-Welle als dritter Commit desselben PR: Feldnotizen-Eintrag `core1` (DE+EN, `pr: 358`) in `patch-notes.mjs` angelegt, danach `patch-bump 20261122-core1 --apply` — Trockenlauf nannte vorab exakt **79 Dateien, 276 Token-Vorkommen und die 7 bekannten Anker-Zeilen**; die Anker-Prüfung meldete danach alle 7 Anker auf `20261122-core1`, und die Gesamtsuite lief auf der neuen Welle erneut **1.260/1.260** (Exit 0).
  - **Korrektur nach dem ersten CI-Lauf von PR `#358`:** Alle Actions-Jobs wurden rot, weil die Verweise aus zwei Ebenen Tiefe (`../../…`) in `firebase/rules-test/*.test.mjs` (24 Dateien), `server/test/*.test.mjs` (4) und der Node-Seite von `browser-tests/wave-consensus.cjs` noch auf die alten Wurzel-Adressen zeigten – die Referenz-Inventur dieser Scheibe erkannte nur `./` und `../`, weshalb diese Klasse lokal unsichtbar blieb (`node --test IronPath/tests/*.test.mjs` deckt sie nicht ab). Nachgezogen wurden die Importe auf `../../core/…`, die Guard-Bootstrap-Texte in vier Emulator-/Browser-Fahrten auf `./core/account-services.mjs` (sonst entstünde eine zweite Registry-Instanz neben `account.js`), sowie ein doppeltes `core/core/` in `multiplayer-browser.cjs`, das ein früherer Codemod-Durchlauf an einer bereits umgeschriebenen Zeile erzeugt hatte. Lokal nachgeholte CI-Schritte danach: Server-Tests 13/13 und Release-Tools-Tests 5/5 grün (jeweils nach `npm ci` wie in der CI), Stress-Workloads laufen durch; die Emulator-Fahrten selbst brauchen Java und sind hier nicht fahrbar.
  - **Zweite Korrektur im selben PR:** Der Party-Endlauf meldete danach `Cannot find module '…/IronPath/four-modes.mjs'` – dynamische Node-Importe und Lesezugriffe über `path.join(root,'…')` in `multiplayer-browser.cjs` (`four-modes`, `maps`) und `afk-session-browser.cjs` (`afk-session`) trugen noch die Wurzel-Form. Ein Basisnamen-Scan über den ganzen Baum (101 Namen ohne Ordner-Präfix) fand außer diesen drei Stellen nur Kommentare, Prosa und die absichtlich basisnamenförmigen historischen Wellenlisten in `cache-wave.cjs`.
  - **Dritte Korrektur im selben PR:** Der Interface-Smoke blieb als letzter Job rot, weil der Test-Server in `afk-session-browser.cjs` die manipulierte AFK-Quelle noch unter `/IronPath/afk-session.mjs` abfing; der Browser fragt längst `/IronPath/core/afk-session.mjs` an, lief also mit der echten Uhr und meldete nie Abwesenheit. Abfangpfad auf die neue Adresse gezogen; ein Scan über alle `/IronPath/…`-Literale und Pfad-Vergleiche fand keine weitere Stelle.
  - **Vierte Korrektur im selben PR:** Der letzte rote Job meldete danach in `cache-wave.cjs` „the portrait reuses the existing avatar decoder“ — die Fahrt erwartet die angefragten Cache-Schlüssel wörtlich und führte `avatar.mjs`/`avatar-layers.mjs` noch ohne Ordner; die Schlüssel lauten jetzt `core/avatar.mjs` und `core/avatar-layers.mjs` (Welle `20261119-avatar3` unverändert). Die große Erwartungsliste derselben Fahrt war bereits umgeformt; diese zwei Einzel-Prüfungen standen weiter unten.
- **Git / PR / Release:** Umzug-Commit `c6dc99d2` und dieser Log-Commit liegen auf `arena/c2c8e808-0815games-github-io`; PR-Nummer, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen. Keine Geräteabnahme bisher; die Sichtprüfung des Betreibers lautet auf `BUILD 20261122-core1`, die Anmelde-Szene und ein Gefecht (Solo wie Mehrspieler).
- **Offen / nächster Schritt:** PR öffnen, Wellen-Commit nachschieben, CI abwarten, erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Damit ist Phase 2 abgeschlossen; es folgt Phase 3 (die drei Patch-Skripte zu einem `patch.mjs`-Befehl zusammenführen, plus `--fast` für `game-regressions` und Doku). Der Bauplatz-Auswahlring aus PR `#336` (ohne Hover-Vorschau) bleibt geparkt, bis die Struktur steht. Die Sichtprüfungen zu `ui1` (Anmeldung/HUD), `battle1` (Gefecht), `net1` (Party), `workshop1` (Werkstatt) und den Deutsch-Texten stehen ebenfalls noch aus.

### Ereignis-Nachtrag zu IPL-0100

- **Commits / PR:** Umzug `c6dc99d2`, Patch-Log `a7a25792`, Cache-Welle `f945d3f7` sowie die vier Korrekturen `0d2c08f2`, `1a00ac1b`, `f94dd020` und `2a41cfa2` auf `arena/c2c8e808-0815games-github-io`; Pull-Request `#358` („Phase 2 (core): Kern-Module ziehen nach IronPath/core (Abschluss)“).
- **CI:** Der erste Lauf wurde in allen elf Actions-Jobs rot (Zwei-Ebenen-Verweise in Rules-/Server-Tests); nach den im Haupteintrag dokumentierten vier Korrektur-Runden endete `gh pr checks 358` mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend**.
- **Merge:** `gh pr view 358 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-22T18:11:10Z`, Merge-Commit `14a1b0896a579664bb6de8979bba10f37dce8dd0` in `main`.
- **Pages:** `pages/builds` meldete danach `status=built`, Dauer 39.881 ms, Commit `14a1b089`.
- **Auslieferung auf `main` belegt:** `IronPath/core/match.mjs` und `IronPath/core/account-services.mjs` sind per Contents-API vorhanden (HTTP 200), die alten Adressen `IronPath/match.mjs` und `IronPath/account-services.mjs` liefern **404**, `IronPath/core/` listet 101 Einträge, und `release-version.json` auf `main` trägt `"build": "20261122-core1"`.
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Inhalt auf `main` und der fertige Pages-Build. **Keine Geräteabnahme:** Stempel `BUILD 20261122-core1`, die Anmelde-Szene und ein Gefecht (Solo wie Mehrspieler) sind Sache der Betreiber-Sichtprüfung; auch die Sichtprüfungen zu `ui1` (Anmeldung/HUD), `battle1` (Gefecht), `net1` (Party), `workshop1` (Werkstatt) und den Deutsch-Texten stehen noch aus.
- **Herkunft dieses Nachtrags:** Er steht als eigener PR auf einem neuen Arbeitszweig nach dem Merge von `#358`; seine eigene Commit- und PR-Kennung steht deshalb nicht hier, sondern in Git und im PR-Text. Mit dieser Scheibe ist Phase 2 abgeschlossen; es folgt Phase 3 (Patch-CLI `scripts/patch.mjs`, `--fast` für `game-regressions`, Doku).

## IPL-0101 – Phase 3: Ein Patch-Befehl `patch.mjs`, ein Schnelltor für `game-regressions` (keine Cache-Welle)

- **Zeit / Quelle:** Abschluss des in `IPL-0094` beschlossenen Strukturprogramms: Nach den sechs Fach-Ordnern (Phase 2, `IPL-0095` bis `IPL-0100`) führt Phase 3 die drei Patch-Skripte zu einem Befehl zusammen. Die zwei Ausgestaltungsfragen (Bedeutung von `--fast`, Umgang mit den alten Einstiegspunkten) stellte der Betreiber zurück („nimm das, was am meisten Sinn macht“); die getroffenen Entscheidungen stehen unten begründet.
- **Block / Ziel:** Kein Spiel-Block und kein ausgelieferter Code: Geändert werden nur Entwickler-Werkzeug, Tests, CI und Doku. Der Build-Stempel bleibt `20261122-core1`; eine Cache-Welle ist nicht nötig, weil `scripts/` nicht ins Spiel gestagt wird (Staging-Beweis unten: 712 = 712 Dateien, null Unterschiede).
- **Branch / Basis:** `arena/524d2b6c-0815games-github-io` ab `37ac8200ea418aeb132ec6c718e003a118607ab2` (`main`, Merge von PR `#359`).
- **Entscheidungen:**
  - **Sauberer Schnitt statt Weiterleitungs-Stubs:** `patch-lib.mjs`, `patch-check.mjs` und `patch-bump.mjs` sind gelöscht; `scripts/patch.mjs` ist die einzige Implementierung. Stubs wären drei weitere Dateien, die bei jeder Verhaltensänderung ehrlich mitgepflegt werden müssten; wer den alten Befehl aufruft, scheitert sichtbar, statt still einen Umweg zu laufen.
  - **`--fast` als Schnelltor, nicht als schwächeres Gatter:** `patch.mjs check --fast` fährt Stempel, Wellen, Struktur, Log, Git-Vergleich, Geheimnis-Scan und die sieben Vertragsdateien – ausdrücklich ohne die volle Suite. Der `game-regressions`-Job führt ihn als ersten Schritt aus (davor `git fetch origin main`, damit Basisvergleich und Geheimnis-Scan in CI einen Maßstab haben), damit Stempel-/Log-Disziplin erstmals maschinell statt nur lokal geprüft wird. Alle bisherigen Schritte (volle Suite, Stress, Server, Release-Tools) bleiben unverändert; ein manueller Schnell-Modus per `workflow_dispatch` wurde verworfen, weil dieselbe Workflow-Datei 13 Checks beherbergt und ein Dispatch sie alle auslösen würde.
- **Änderungen / Dateien:**
  - `IronPath/scripts/patch.mjs` (neu, 616 Zeilen): die drei bisherigen Dateien mechanisch zusammengeführt – gemeinsame Definitionen (Token, Anker, Baumlauf), `bump` (planen, schreiben, verifizieren) und `check` (neun Prüfschritte inkl. Online-Bericht) als Unterbefehle `patch.mjs check` / `patch.mjs bump`; alle bisherigen Exporte bleiben unter einem Dach, der Import des Moduls startet weiterhin keinen CLI-Lauf. Neu ist nur die Dispatch-Schicht plus `--fast` (Widerspruch `--fast` + `--suite` endet mit Exit 2 statt stiller Deutung).
  - `IronPath/tests/patch-tooling.test.mjs`: Importe auf `patch.mjs` umgehängt, Fixture-Datei mitgezogen, dazu ein neuer CLI-Test, der den Dispatcher als Unterprozess fährt (kein Unterbefehl und Unbekanntes = Exit 2 mit Gebrauchsanweisung; `check --fast` auf der Fixture = Exit 0; `bump`-Trockenlauf schreibt nichts). `IronPath/tests/patch-log-archive.test.mjs` importiert `patchLogState` jetzt aus `patch.mjs`.
  - Doku: `docs/PATCH-ABLAUF.md` (19 Stellen: Werkzeugliste, Befehle in §1/§4/§7, Verantwortung in §8/§9, Checkliste; neuer Absatz zum Schnelltor in §6), `README.md` und `docs/patch-log-vorlage.md` zeigen auf `patch.mjs`; der Kopf von `docs/PATCH-LOG.md` ebenfalls. Historische Einträge in Log, Archiv und `PATCH-BLOECKE.md` bleiben als Geschichtsquelle unverändert.
  - `.github/workflows/ironpath-firebase-rules.yml`: `game-regressions` beginnt mit dem Schritt „Fast patch gate (stamp, log, secrets, contracts)“; kein bestehender Schritt wurde entfernt oder entschärft.
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0081` vollständig ins Archiv, Grenzen auf `IPL-0001` bis `IPL-0081` nachgezogen; das Log führt die neuesten 20 (`IPL-0082` bis `IPL-0101`).
- **Prüfungen:**
  - `patch-tooling.test.mjs` + `patch-log-archive.test.mjs`: **17 Tests, 17 bestanden** (12 Werkzeug-Vertragstests inkl. neuem CLI-Test, 5 Archiv-Tests). `patch.mjs check --fast` am echten Baum: **0 Fehler** — 7 Anker auf `20261122-core1`, Log `IPL-0001…IPL-0100` lückenlos, 7 Vertragsdateien mit 30 Tests grün; die zwei Hinweise betreffen den uncommitteten Baum und den anfangs flachen Klon dieser Sitzung.
  - Staging gegen Basis `37ac8200` (Baseline per `git worktree`, gleiche Build-ID `20990101-baseline1`): **712 = 712 Dateien, `diff -rq` ohne eine Zeile** — das ausgelieferte Spiel ist bytegleich, `scripts/` fährt nicht mit.
  - Gesamtsuite im vollständigen Klon (nach `git fetch --unshallow origin`): `node --test IronPath/tests/*.test.mjs` = **1.261 Tests, 1.261 bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0** (vorher 1.260; +1 CLI-Test).
  - Keine Geräteabnahme vorgesehen und keine nötig: Es wurde keine Datei geändert, die der Browser lädt. Der Build-Stempel bleibt `20261122-core1`.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags uncommittet auf `arena/524d2b6c-0815games-github-io`. Commit, Push, PR, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen. Der neue `game-regressions`-Schritt beweist sich erst im CI-Lauf dieses PR selbst.
- **Offen / nächster Schritt:** PR öffnen, CI abwarten (beweist das Schnelltor), erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen; Ereignis-Nachtrag danach als eigener PR. Damit ist das Strukturprogramm aus `IPL-0094` (Phasen 1–3) vollständig. Als nächstes größeres Stück bleibt der Bauplatz-Auswahlring aus PR `#336` (ohne Hover-Vorschau) als eigener Spiel-PR. Die Betreiber-Sichtprüfungen (`BUILD 20261122-core1`, Anmeldung, Solo-/Mehrspieler-Gefecht, dazu `ui1`- bis `workshop1`-Punkte und Deutsch-Texte) stehen weiterhin aus.

### Ereignis-Nachtrag zu IPL-0101

- **Commit / PR:** Arbeitscommit `1e340893` auf `arena/524d2b6c-0815games-github-io`; Pull-Request `#360` („Phase 3: Patch-CLI patch.mjs und Schnelltor für game-regressions“).
- **CI:** `gh pr checks 360` endete im ersten Lauf mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend**. Das neue Schnelltor lief dabei belegt als Schritt 4 des `game-regressions`-Jobs (`Fast patch gate (stamp, log, secrets, contracts)` -> success), der Job insgesamt 2 min 52 s.
- **Merge:** `gh pr view 360 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-22T20:03:32Z`, Merge-Commit `24be5a823c36bcd0bb96fd121cf47392f716b16f` in `main`.
- **Pages:** `pages/builds` meldete danach `status=built`, Dauer 39.266 ms, Commit `24be5a82`.
- **Auslieferung auf `main` belegt:** `IronPath/scripts/patch.mjs` ist per Contents-API vorhanden (HTTP 200); die drei alten Dateien `patch-check.mjs`, `patch-bump.mjs` und `patch-lib.mjs` liefern **404**. `release-version.json` auf `main` trägt unverändert `"build": "20261122-core1"` — keine neue Welle, weil `scripts/` nicht ins Spiel gestagt wird (Staging-Beweis im Haupteintrag: 712 = 712 Dateien, null Unterschiede).
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Inhalt auf `main` und der fertige Pages-Build. Keine Geräteabnahme, weil keine browsergeladene Datei geändert wurde. Die Betreiber-Sichtprüfungen (`BUILD 20261122-core1`, Anmeldung, Solo-/Mehrspieler-Gefecht, `ui1`- bis `workshop1`-Punkte, Deutsch-Texte) stehen weiterhin aus.
- **Herkunft dieses Nachtrags:** Er steht als eigener PR auf einem neuen Arbeitszweig nach dem Merge von `#360`; seine eigene Commit- und PR-Kennung steht deshalb nicht hier, sondern in Git und im PR-Text. Mit `IPL-0101` samt Nachtrag ist das Strukturprogramm aus `IPL-0094` (Phasen 1–3) vollständig abgeschlossen.

## IPL-0102 – Referenz-Wächter für die Harness-Ordner und ein npm-Einstieg an der Wurzel (keine Cache-Welle)

- **Zeit / Quelle:** Nach Abschluss des Strukturprogramms zeigte die Übersicht der offen gebliebenen Verbesserungspunkte vier Kandidaten; der Betreiber gab mit „Go“ die empfohlene Klein-Scheibe frei (Punkt 1 Referenz-Wächter, Punkt 2 npm-Einstieg). Die Punkte 3 (gemeinsamer Harness-Helfer für 15 Testdateien) und 4 (gemeinsamer Test-Server für 11 Browser-/Emulator-Fahrten) bleiben dokumentierte Kandidaten für spätere Scheiben.
- **Block / Ziel:** Kein Spiel-Block, kein ausgelieferter Spielcode. Der Build-Stempel bleibt `20261122-core1`; `tests/`, `scripts/` und die neue Wurzel-`package.json` fahren nicht ins gestagte Spiel (Staging-Beweis unten: 712 = 712, null Unterschiede).
- **Branch / Basis:** `arena/aae695cf-0815games-github-io` ab `275ea1de0ed45d85fe8df929472903c4d637c73a` (`main`, Merge von PR `#361`).
- **Änderungen / Dateien:**
  - `IronPath/tests/reference-resolution.test.mjs` (neu): statischer Wächter, der in den Node-ausgeführten Harness-Ordnern (`browser-tests/`, `firebase/`, `server/`, `stress-tests/`) drei Verweis-Formen auflöst: relative Import-/Require-Literale (eine wie zwei Ebenen), dynamische Importe über `path.join(root,'…')` und `/IronPath/…`-Pfade, die Test-Server abfangen. Browser-seitige Modul-Texte werden unter `/IronPath/` bedient, deshalb gilt ein `./`-Verweis als aufgelöst, wenn er neben der Harness-Datei **oder** gegen die IronPath-Wurzel aufgeht — beides sind in diesen Dateien reale Auflösungs-Kontexte, und ein Umbenennen bricht beide. Synthetische Routen und zur Laufzeit kopierte SDK-Module (sieben Stellen) stehen mit Begründung in einer offenen Ausnahmeliste, statt den Scan zu verwässern; ein Biss-Test mit Fixture beweist, dass der Wächter alle drei Formen findet.
  - `IronPath/scripts/patch.mjs`: `reference-resolution` ist achte Vertragsdatei in `CONTRACT_TESTS` — der Wächter läuft damit im Schnelltor (`check --fast`, CI-Schritt 4 von `game-regressions`) wie lokal mit.
  - `package.json` an der Repo-Wurzel (neu, ohne Abhängigkeiten und ohne `type`-Feld, damit sich an der Modul-Deutung des Baums nichts ändert): `schnelltor`, `pruefung`, `test:suite`, `test:stress`, `test:server`, `test:release`, `setup` (npm-ci der zwei Unterpakete) und `ci-lokal` als Spiegel der `game-regressions`-Schritte. Emulator- und Browser-Fahrten bleiben bewusst draußen (Java/Chromium) und CI-Sache.
  - `IronPath/docs/PATCH-ABLAUF.md`: Die Kurzformen sind in §1 dokumentiert.
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0082` vollständig ins Archiv, Grenzen auf `IPL-0001` bis `IPL-0082`; das Log führt die neuesten 20 (`IPL-0083` bis `IPL-0102`).
- **Prüfungen:**
  - `reference-resolution.test.mjs`: **2/2** — echter Baum ohne einen Fund, Biss-Fixture findet genau die drei absichtlich gebrochenen Formen (vor der Ausnahmelisten-Schärfung meldete der Scan nur die zwei Query-String-Schlüssel falsch; auf die bereinigte Form normalisiert).
  - `npm run schnelltor` (neuer Einstieg, echter Baum): **0 Fehler** — 8 Vertragsdateien, 32 Tests grün (vorher 7 Dateien/30 Tests); die zwei Hinweise betreffen den uncommitteten Baum und den anfangs flachen Klon.
  - Gesamtsuite im vollständigen Klon (nach `git fetch --unshallow origin`): `node --test IronPath/tests/*.test.mjs` = **1.263 Tests, 1.263 bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0** (vorher 1.261; +2 Wächter-Tests). Im flachen Anfangszustand meldete dieselbe Suite 1 übersprungenen Test — wieder der bekannte Klon-Effekt, kein Befund.
  - Staging gegen Basis `275ea1de` (gleiche Build-ID `20990101-baseline1`): **712 = 712 Dateien, `diff -rq` ohne eine Zeile**.
  - Keine Geräteabnahme vorgesehen oder nötig: Es wurde keine Datei geändert, die der Browser lädt.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags uncommittet auf `arena/aae695cf-0815games-github-io`. Commit, Push, PR, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen. Zu beobachten im CI-Lauf: die zwei Vercel-Checks an der neuen Wurzel-`package.json` (bewusst ohne Abhängigkeiten und Build-Skript angelegt).
- **Offen / nächster Schritt:** PR öffnen, CI abwarten, erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen; Ereignis-Nachtrag danach als eigener PR. Kandidaten Punkt 3 und 4 (Harness-Helfer, Test-Server) bleiben zurückgestellt; als nächstes größeres Stück steht der Bauplatz-Auswahlring aus PR `#336` (ohne Hover-Vorschau). Die Betreiber-Sichtprüfungen (`BUILD 20261122-core1`, Anmeldung, Solo-/Mehrspieler-Gefecht, `ui1`- bis `workshop1`-Punkte, Deutsch-Texte) stehen weiterhin aus.

### Ereignis-Nachtrag zu IPL-0102

- **Commit / PR:** Arbeitscommit `ed8cf0e6` auf `arena/aae695cf-0815games-github-io`; Pull-Request `#362` („Referenz-Wächter für Harness-Ordner und npm-Einstieg an der Wurzel“).
- **CI:** `gh pr checks 362` endete im ersten Lauf mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend** — darunter beide Vercel-Checks an der neuen Wurzel-`package.json`. Im `game-regressions`-Job des Runs `45068026435` lief der Schritt `Fast patch gate (stamp, log, secrets, contracts)` belegt erfolgreich; der Referenz-Wächter fuhr darin als achte Vertragsdatei erstmals in CI mit.
- **Merge:** `gh pr view 362 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-22T20:57:24Z`, Merge-Commit `12a4ab359a542c9859729e82813bd13deec23e7d` in `main`.
- **Pages:** `pages/builds` meldete danach `status=built`, Dauer 45.896 ms, Commit `12a4ab35`.
- **Auslieferung auf `main` belegt:** `package.json` an der Repo-Wurzel und `IronPath/tests/reference-resolution.test.mjs` sind per Contents-API vorhanden (HTTP 200); `release-version.json` auf `main` trägt unverändert `"build": "20261122-core1"` — keine neue Welle, weil weder Tests noch `scripts/`-Listen noch die Wurzel-`package.json` ins gestagte Spiel fahren (Staging-Beweis im Haupteintrag: 712 = 712 Dateien, null Unterschiede).
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Inhalt auf `main` und der fertige Pages-Build. Keine Geräteabnahme, weil keine browsergeladene Datei geändert wurde. Die Betreiber-Sichtprüfungen (`BUILD 20261122-core1`, Anmeldung, Solo-/Mehrspieler-Gefecht, `ui1`- bis `workshop1`-Punkte, Deutsch-Texte) stehen weiterhin aus.
- **Herkunft dieses Nachtrags:** Er steht als eigener PR auf einem neuen Arbeitszweig nach dem Merge von `#362`; seine eigene Commit- und PR-Kennung steht deshalb nicht hier, sondern in Git und im PR-Text. Zurückgestellt bleiben die Kandidaten 3 und 4 der Vorschlagsliste aus `IPL-0102` (gemeinsamer Harness-Helfer, gemeinsamer Test-Server); als nächstes größeres Stück steht der Bauplatz-Auswahlring aus PR `#336` (ohne Hover-Vorschau).

## IPL-0103 – Bauplatz-Auswahlringe: dicker und pulsierend, ohne Hover-Vorschau (eigene Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** Der Bauplatz-Ring aus PR `#336` lag seit dem Rückbau auf `#334` geparkt; der Betreiber gab ihn jetzt mit ausdrücklicher Eingrenzung frei: „Nur Bauplatz Ring, kein hover over oder sonst was.“ Die Hover-Wellen-Vorschau, die `#336` in `game.js` gebracht hatte (`mousemove`, `hoveredPadIndex`, Literale `WELLE {wave}` / `NÄCHSTE: {count} ENEMIES`), wird **nicht** neu gelandet.
- **Block / Ziel:** Auswahl-Feedback auf dem Gefechtsfeld (`core/cartoon-art.mjs`). Spielregeln, Simulation und Protokoll ändern sich nicht; nur die zwei Auswahlringe werden stärker und atmen. Weil eine browsergeladene Datei ihr Zeichenverhalten ändert, trägt derselbe PR eine eigene Cache-Welle (`20261122-ring1`, dritter Commit mit Feldnotizen DE+EN, sobald die PR-Nummer existiert).
- **Branch / Basis:** `arena/112aa9ab-0815games-github-io` ab `0074f202cfff13f622aabdcbaa963838e4f6f95e` (`main`, Merge von PR `#363`). Erster Commit `18fe6e6` (2 Dateien).
- **Änderungen / Dateien:**
  - `IronPath/core/cartoon-art.mjs`: Pad-Ring auf leerem Bauplatz — Ellipse 34×24 statt 33×23, `lineWidth` 3.2 statt 2.5, Farbe `#d4eee0`, Dash `[8,5]`, Puls über `globalAlpha` (`.85+.15·sin(storyTime/.3)`). Reichweiten-Ring des Turms auf dem gewählten Pad — `lineWidth` 2.2 statt 1.5, `#c2dfd2`, Dash `[6,5]`, Füllung `.14`, Puls `.88+.12·sin(storyTime/.42)` nur auf dem Strich, in `save/restore` gekapselt. `pad()` erhält die Puls-Alpha als Parameter (voreingestellt 1), damit die Zeichenfunktion rein aus ihren Argumenten bestimmbar bleibt.
  - Bewusste Abweichungen zur zurückgenommenen `#336`-Fassung: Der Puls folgt der `storyTime`-Konvention der Datei (Sekunden, von beiden Aufrufstellen in `game.js` jeden Frame geliefert) statt `performance.now()`, und `reducedMotion` stellt **beide** Ringe ruhig (`#336` tat das nur für den Reichweiten-Ring). Keine neuen Text-Literale — die Übersetzungs-Abdeckung bleibt unberührt, die `PATCH-BLOECKE`-Warnung zu `#336` betraf nur die Hover-Texte.
  - `IronPath/tests/cartoon-art.test.mjs`: Neuer Block zeichnet mit aufzeichnendem Canvas bei festen `storyTime`-Werten: Pad-Ring 34×24 mit Stärke 3.2 und Alpha `.85` bei Zeit 0, steigend mit der Zeit, fest `1` bei reduzierter Bewegung; Reichweiten-Ring mit Stärke 2.2 und Alpha `.88` bei Zeit 0, sonst gleich; ohne Auswahl (`selectedPad=null`) entsteht keiner der beiden Ringe.
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0083` vollständig ins Archiv, Grenzen auf `IPL-0001` bis `IPL-0083`; das Log führt die neuesten 20 (`IPL-0084` bis `IPL-0103`).
- **Korrekturen an der eigenen Arbeit:** Zwei parallele Dateibearbeitungen an `cartoon-art.mjs` überschrieben sich gegenseitig (Signatur und Aufrufstelle fielen zweimal dem jeweils anderen Edit zum Opfer, `ReferenceError: pulse is not defined` bzw. fehlender Puls am Aufruf); nacheinander wiederholt und per Test belegt. Keine weiteren Dateien betroffen.
- **Prüfungen:**
  - `cartoon-art.test.mjs` (mit neuem Ring-Block): **bestanden**; der Block meldet „Selection rings: thicker, pulsing with storyTime, still under reduced motion.“ Gezielte Prüfung vor der Cache-Welle; die Gesamtsuite folgt auf der neuen Welle im Wellen-Commit.
  - Cache-Welle als dritter Commit desselben PR: Feldnotizen-Eintrag `ring1` (DE+EN, `pr: 364`) in `patch-notes.mjs` angelegt, danach `patch.mjs bump 20261122-ring1 --apply` — Trockenlauf nannte vorab exakt **79 Dateien, 276 Token-Vorkommen und die 7 bekannten Anker-Zeilen**; die Anker-Prüfung meldete danach alle 7 Anker auf `20261122-ring1`.
  - Kein Geräte- oder Browser-Beweis lokal möglich (kein Chromium hier): Die Browser-Fahrten laufen in CI; die Betreiber-Sichtprüfung lautet auf `BUILD 20261122-ring1` und einen gewählten Bauplatz (leer wie mit Turm) im Gefecht.
- **Git / PR / Release:** Feature-Commit `18fe6e6` und dieser Log-Commit liegen auf `arena/112aa9ab-0815games-github-io`; PR-Nummer, Cache-Welle, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen. Der offene `PATCH-BLOECKE`-Punkt „Pad-Selektion: dickere Ringe und Puls (PR #336)“ ist mit dieser Scheibe inhaltlich erledigt; seine Hover-Literal-Notiz entfällt, weil kein Hover landet.
- **Offen / nächster Schritt:** PR öffnen, Wellen-Commit nachschieben, Gesamtsuite auf `ring1`, CI abwarten, erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen; Ereignis-Nachtrag danach als eigener PR. Die Kandidaten 3 und 4 aus `IPL-0102` bleiben zurückgestellt; die Betreiber-Sichtprüfungen (`BUILD 20261122-core1` und ältere Punkte, künftig `ring1`) stehen weiterhin aus.

### Ereignis-Nachtrag zu IPL-0103

- **Commits / PR:** Feature `18fe6e6`, Patch-Log `6f44bb1` und Cache-Welle `86de4e11` auf `arena/112aa9ab-0815games-github-io`; Pull-Request `#364` („Bauplatz-Auswahlringe: dicker und pulsierend (ohne Hover)“).
- **CI:** `gh pr checks 364` endete im ersten Lauf mit **13 von 13 bestandenen Checks, 0 fehlgeschlagen, 0 ausstehend** — inklusive aller Browser-Fahrten über das Gefechtsfeld mit den neuen Ringen; die Gesamtsuite lief lokal auf der Welle `ring1` vorher mit **1.263 Tests, 1.263 bestanden, 0 übersprungen, Exit 0**.
- **Merge:** `gh pr view 364 --json state,mergedAt,mergeCommit` ergab `state=MERGED`, `mergedAt=2026-11-23T03:53:31Z`, Merge-Commit `19de5f0be6c86608bc61f35bc8891b5007d2b6a2` in `main`.
- **Pages:** `pages/builds` meldete danach `status=built`, Dauer 47.402 ms, Commit `19de5f0b`.
- **Auslieferung auf `main` belegt:** `IronPath/core/cartoon-art.mjs` ist per Contents-API in der neuen Fassung vorhanden (HTTP 200), und `release-version.json` auf `main` trägt `"build": "20261122-ring1"`. Die Hover-Vorschau aus `#336` ist nicht Teil des ausgelieferten Stands — im Diff des PR steht keine Zeile `mousemove`/`hoveredPadIndex` und kein neues Text-Literal.
- **Plan-Doku:** Der offene `PATCH-BLOECKE`-Punkt „Pad-Selektion: dickere Ringe und Puls (PR #336)“ ist mit dieser Auslieferung abgehakt; seine Hover-Literal-Notiz entfällt gegenstandslos.
- **Ehrliche Grenzen:** Die Live-URL wurde nicht abgerufen; belegt sind Inhalt auf `main` und der fertige Pages-Build. **Keine Geräteabnahme:** Stempel `BUILD 20261122-ring1`, ein gewählter Bauplatz (leer wie mit Turm, Puls; bei reduzierter Bewegung Ruhe) ist Sache der Betreiber-Sichtprüfung; auch die Sichtprüfungen zu `core1` (Anmeldung, Solo-/Mehrspieler-Gefecht), `ui1`, `battle1`, `net1`, `workshop1` und den Deutsch-Texten stehen noch aus.
- **Herkunft dieses Nachtrags:** Er steht als eigener PR auf einem neuen Arbeitszweig nach dem Merge von `#364`; seine eigene Commit- und PR-Kennung steht deshalb nicht hier, sondern in Git und im PR-Text. Zurückgestellt bleiben die Kandidaten 3 und 4 aus `IPL-0102` (gemeinsamer Harness-Helfer, gemeinsamer Test-Server).

## IPL-0104 – Boss-Banner: mittige Ankündigung im Spiel-Design (eigene Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** Von den nach dem Rückbau offenen Punkten gab der Betreiber nur die Boss-Ankündigung aus PR `#338` frei („vergiss bitte die restlichen offenen Punkte bis auf die Boss Ankündigung“) und legte die Form fest: „ein passendes zum Spiel Design Banner, welches den Boss angekündigt mittig“. Alle übrigen Rückbau-Punkte (#337, #338-Reste, #339, Mündungsblitz) bleiben damit ausdrücklich liegen.
- **Block / Ziel:** Ankündigung auf dem Gefechtsfeld. Wenn eine Boss-Welle startet, steht der Boss für wenige Sekunden mit Name und Intel mittig im Spielfeld — als Titelkarte im Rahmen der Karten-Intro, in den Farben der kleinen Boss-Plakette. Die Plakette selbst (ankommend, Phasen, Lebensbalken) bleibt unverändert; Spielregeln und Simulation ändern sich nicht. Weil browsergeladene Dateien (HTML, CSS, `game.js`, ein neues UI-Modul) ihr Verhalten ändern, trägt derselbe PR eine eigene Cache-Welle (`20261123-boss1`, dritter Commit mit Feldnotizen DE+EN, sobald die PR-Nummer existiert).
- **Branch / Basis:** `arena/68cb4000-0815games-github-io` ab `3025aea930f8d84f05edbbc9357aabb5f6cd85c2` (`main`, Merge von PR `#365`). Erster Commit `487365e` (7 Dateien).
- **Änderungen / Dateien:**
  - `IronPath/ui/boss-banner.mjs` (neu): `createBossBanner` nach dem `createMapIntro`-Muster — injizierte Uhr, Zwei-Schritt-Gehen (halten 4 s, ausblenden 600 ms), ein Boss gleich eine Ankündigung (Schlüssel `Welle:Art`; das Angebot jeden Frames ist ein No-op), `reset()` vergisst den Schlüssel fürs nächste Gefecht, fehlende Knoten kosten nur die Dekoration. Das Modul ist DOM und zustandslos gegenüber dem Spiel — ausdrücklich anders als die zurückgenommene `#338`-Fassung (rote Blink-Box oben links im Canvas-Maler, Aufruf ohne Import).
  - `IronPath/index.html` und `IronPath/field-command.css`: `#bossBanner` im `#gameView`, zentriert wie die Karten-Intro (`left/top 50%`, Messing-Doppelrahmen, `Black Ops One`), in Boss-Farben (`#4a2320`-Verlauf, `#e1bf84`, `#ef9d60`); `pointer-events:none`, `aria-hidden` (die Ansage für Screenreader bleibt die vorhandene `bossAnnouncement`-Live-Region), bei `prefers-reduced-motion` keine Animation.
  - `IronPath/game.js`: Ankündigung aus dem bestehenden Boss-Block — ankommend `BOSS INCOMING`, auf dem Feld `BOSS ON THE FIELD`, dazu Name und Beschreibung des Bosses; `hide()` am Laufende, `reset()` im `reset()`. Plus der `draw()`-Fang aus der `PATCH-BLOECKE`-Reparaturanweisung zu `#338`: Die Frame-Schleife fängt Zeichenfehler, meldet den ersten und hält die `requestAnimationFrame`-Kette am Leben, statt das Feld einzufrieren.
  - `IronPath/i18n/localization-battle-de.mjs`: zwei neue Literale (`BOSS INCOMING` → `BOSS IM ANMARSCH`, `BOSS ON THE FIELD` → `BOSS AUF DEM FELD`, im Ton der vorhandenen `BOSS IM ANMARSCH · {name}`-Zeile).
  - `IronPath/tests/boss-banner.test.mjs` (neu, 7 Tests: einmal pro Boss inkl. Haltezeit ab erster Ankündigung, Ausblenden auf der Uhr, neuer Boss, `reset`, `hide`, fehlende Knoten, Validierung) und `IronPath/tests/cartoon-art.test.mjs`: Echt-Boss-Block — `makeEnemy(bossForWave(5).kind,5)` durch den echten Maler, volle wie reduzierte Bewegung, Spielzustand unverändert. Damit ist die Stub-Lücke geschlossen, hinter der `#338` seinen `ReferenceError` versteckte.
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0084` vollständig ins Archiv, Grenzen auf `IPL-0001` bis `IPL-0084`; das Log führt die neuesten 20 (`IPL-0085` bis `IPL-0104`).
- **Prüfungen:**
  - `boss-banner.test.mjs` 7/7, `cartoon-art.test.mjs` mit Echt-Boss-Block bestanden („Real catalog boss: drawn at full and reduced motion, state untouched.“), Übersetzungs-Abdeckung grün; `patch.mjs check --fast` am echten Baum: **0 Fehler**.
  - Cache-Welle als dritter Commit desselben PR: Feldnotizen-Eintrag `boss1` (DE+EN, `pr: 366`) in `patch-notes.mjs` angelegt, danach `patch.mjs bump 20261123-boss1 --apply` (79 Dateien, 277 Token-Vorkommen, alle 7 Anker tragen `20261123-boss1`). Die erste Gesamtsuite auf der Welle zeigte 22 rote Tests in 13 Harness-Dateien: Ihre handgeführten Ersetzungslisten für `game.js`-Importe kannten `./ui/boss-banner.mjs?v=…` noch nicht (`Failed to resolve module specifier` aus dem `data:`-Import). Alle 13 Listen führen jetzt `ui/boss-banner.mjs` neben `ui/map-intro.mjs`; die 13 Dateien laufen danach 40/40 grün, die Gesamtsuite auf der Welle danach **1.270/1.270, Exit 0, 0 ausgelassen** (nach `git fetch --unshallow origin`). Browser-Fahrten laufen in CI, lokal ist kein Chromium verfügbar. Die Betreiber-Sichtprüfung lautet auf `BUILD 20261123-boss1`: Boss-Welle (Welle 5) starten — das Banner muss mittig mit Boss-Namen erscheinen, ~4 s stehen und ausblenden; die kleine Boss-Plakette oben bleibt wie bisher.
- **Git / PR / Release:** Feature-Commit `487365e` und dieser Log-Commit liegen auf `arena/68cb4000-0815games-github-io`; PR-Nummer, Cache-Welle, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen. Der `PATCH-BLOECKE`-Punkt zur Boss-Ankündigung (`#338`-Reparatur) ist mit dieser Scheibe inhaltlich erledigt; die übrigen Rückbau-Punkte bleiben auf Betreiber-Weisung liegen.
- **Offen / nächster Schritt:** PR öffnen, Wellen-Commit nachschieben, Gesamtsuite auf `boss1`, CI abwarten, erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen; Ereignis-Nachtrag danach als eigener PR. Auf Betreiber-Auftrag folgt im selben Arbeitsgang eine Bestandsaufnahme aller je aufgeführten offenen Patch-Punkte über alle Dateien; ihr Ergebnis steht im PR-Gespräch und wird hier nicht vorweggenommen. Die Betreiber-Sichtprüfungen (`BUILD 20261122-ring1`, `core1` und ältere Punkte) stehen weiterhin aus.

## IPL-0105 – Fähigkeits-Abklingzeit pausiert zwischen den Wellen (eigene Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** Betreiber-Befund und -Weisung vom 2026-11-23: „Die Action Skills Zeit läuft auch zwischen den Wellen weiter, also wenn die Welle beendet ist und bis zu dem Zeitpunkt, wo man die neue Welle startet, läuft aktuell der Timer vom Skill runter. Das sollte nicht sein. Die Zeiten sollte nur ablaufen während dem auch aktiv gespielt wird.“ Zugleich: Alle übrigen je aufgeführten offenen Punkte außer Block E sind zu vergessen; Geräteabnahmen erfolgen generell durch den Betreiber und werden nicht mehr als offene Punkte aufgeführt. Nach dieser Scheibe folgt Block E.
- **Block / Ziel:** Gefechtskern. Die gemeinsame Simulation (`core/simulation.mjs`, `stepMatch`) läuft zwischen den Wellen weiter, damit Soldaten sich bewegen und gebaut werden kann — dabei lief bisher auch die Fähigkeits-Abklingzeit (`p.cooldown`) herunter. Sie tickt jetzt nur noch, solange eine Welle aktiv läuft (`state.running`). Spielregeln, Fähigkeitswerte und Wirkungsdauern (z. B. Overdrive) ändern sich nicht. Weil sich das Verhalten einer browsergeladenen Kerndatei ändert, trägt derselbe PR eine eigene Cache-Welle (`20261123-skill1`, dritter Commit mit Feldnotizen DE+EN, sobald die PR-Nummer existiert).
- **Branch / Basis:** `arena/fb0b581a-0815games-github-io` ab `680c69b46cb9a91ac14c9623f0b0fe8c7fd6785b` (`main`, Merge von PR `#366`).
- **Änderungen / Dateien:**
  - `IronPath/core/simulation.mjs`: eine Zeile — `if(!jamField&&state.running)p.cooldown=Math.max(0,p.cooldown-dt);`. Das Störfeld des Bosses Riegel friert die Aufladung wie bisher zusätzlich ein; die Soldatenbewegung in der Bauphase bleibt unverändert möglich.
  - `IronPath/tests/ability-cooldown-wave-pause.test.mjs` (neu, 4 Tests: keine Aufladung in der Bauphase, Bewegung zwischen den Wellen bleibt möglich, Aufladung nur während laufender Welle und erneutes Einfrieren am Wellenende, nie unter null).
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0085` vollständig ins Archiv, Grenzen auf `IPL-0001` bis `IPL-0085`; das Log führt die neuesten 20 (`IPL-0086` bis `IPL-0105`).
- **Prüfungen:**
  - Neuer Test 4/4; `boss-personality.test.mjs` (Störfeld friert die Aufladung ein — dort läuft die Welle), `ability-hud.test.mjs` und `ability-hud-ui.test.mjs` („Let the 30s cooldown finish inside the running wave“) grün.
  - Cache-Welle als dritter Commit desselben PR: Feldnotizen-Eintrag `skill1` (DE+EN, `pr: 367`) in `patch-notes.mjs`, danach `patch.mjs bump 20261123-skill1 --apply` (79 Dateien, alle 7 Anker tragen `20261123-skill1`). Seine `open`-Liste nennt auf Betreiber-Weisung keine Geräteabnahme, sondern nur das nächste Arbeitspaket Block E. Gesamtsuite auf der neuen Welle: **1.274/1.274, Exit 0, 0 ausgelassen** (nach `git fetch --unshallow origin`; im flachen Klon wurde ein Test übersprungen). Browser-Fahrten in CI, lokal ist kein Chromium verfügbar.
- **Git / PR / Release:** Feature- und dieser Log-Commit liegen auf `arena/fb0b581a-0815games-github-io`; PR-Nummer, Cache-Welle, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen.
- **Offen / nächster Schritt:** PR öffnen, Wellen-Commit nachschieben, Gesamtsuite auf `skill1`, CI abwarten, erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Danach Block E als nächstes Arbeitspaket.

## IPL-0106 – Block E, Scheibe 1: Lebens-, Angriffs- und Reparatursystem im Simulationskern (eigene Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** Betreiber-Auftrag vom 2026-11-23: Nach der Abklingzeit-Scheibe (`IPL-0105`) ist Block E das einzige verbliebene Arbeitspaket („Danach Block E“, auf dem neuen Zweig: „lets do this shit“). Grundlage ist die Spezifikation in `PATCH-BLOECKE.md` Abschnitt E mit ihren Startwerten; alle übrigen je aufgeführten Punkte sind auf Betreiber-Weisung vergessen, Geräteabnahmen werden nicht mehr als offene Punkte geführt.
- **Block / Ziel:** Neues modusübergreifendes Lebens- und Angriffssystem, Scheibe 1 = deterministischer Prototyp im gemeinsamen Fixed-Step-Kern plus die minimale Sichtbarkeit, damit das System spielbar ist: Soldaten und Türme haben eigenes Leben, Infanterie bedroht Soldaten in Reichweite, Panzer bedrohen nahe Türme, jeder Angriff wird vorher angekündigt, beschädigte Türme sind über ihre Auswahl reparierbar, ausgefallene Soldaten kehren geschützt zurück. Kein dauerhafter Verlust von Charakterfortschritt, Ausrüstung oder Skillpunkten; alle Zustände sind Matchzustand in der gemeinsamen Simulation, der Renderer liest sie nur.
- **Branch / Basis:** `arena/ace0b707-0815games-github-io` ab `620776c22c9c029db9f8282eeecbae579d471292` (`main`, Merge von PR `#367`).
- **Änderungen / Dateien:**
  - `IronPath/core/combat.mjs`: Block-E-Konstanten und -Helfer — Soldat 100 Leben, Rückkehr nach 8 s mit 3 s Schutz; Turm 160 Leben auf Stufe 1 plus 45 je Stufe (`towerMaxHp`), `repairQuote` (bis zu 50 Prozentpunkte); `ENEMY_ATTACKS` (Infanterie → Soldat: Reichweite 60, 3 Schaden, 0,6 s Vorwarnung, 3,5 s Abklingzeit; Panzer → Turm: Reichweite 90, 4 Schaden, 0,9 s Vorwarnung, 5 s Abklingzeit), Angriffe erst ab Welle 3, höchstens 2 gleichzeitige Angreifer pro Ziel.
  - `IronPath/core/simulation.mjs`: Gegnerangriffe als Matchzustand (`windup` mit Ziel und Restzeit am Gegner): Der Schlag prüft beim Landen erneut, ob das Ziel noch gültig und in Reichweite ist — Ausweichen wirkt; die Vorwarnung bremst den Vormarsch nicht (sonst werden Panzer zu Kugelschwämmen, die den Boss abschirmen — so an `white-noise` gemessen und verworfen). Soldat bei 0 kampfunfähig (`downed`): keine Bewegung, kein Schuss, keine Fähigkeit, Fähigkeits-Abklingzeit wird nicht zurückgesetzt; Rückkehr mit vollem Leben nahe dem eigenen Bunker plus Schutz, Ereignisse `soldierDown`/`soldierReturn`. Turm bei 0 bleibt dunkel auf seinem Bauplatz und feuert nicht (`towerDisabled`); Reparatur läuft 2 s im Simulationsschritt und heilt beim Landen (`towerRepaired`); nach jeder überstandenen Welle erhalten beschädigte Türme kostenlos 25 % ihres Lebens zurück, auch ausgefallene kehren so zurück. Soldaten-Maximum ist eine Konstante und wird nicht im Zustand mitgespeichert (Snapshot-Budget, `multiplayer-lag`).
  - `IronPath/core/match.mjs`: `createPlayer` startet mit vollem Soldatenleben; Bau setzt Turmleben, Upgrade erhält den Schaden anteilig (kein kostenloser Vollheal), Verkauf während einer laufenden Reparatur erstattet den reservierten Reparaturpreis; neuer Befehl `repairTower` mit vorher quotiertem Preis (`repairOffer`: 20 % der Gesamtinvestition für das volle 50-Prozentpunkte-Angebot, anteilig weniger; der bestätigende Spieler zahlt); Fähigkeit ist kampfunfähig nicht einsetzbar; neue deutsche Fehlertexte in `i18n/localization-game-errors-de.mjs`.
  - `IronPath/core/protocol.mjs`: `repairTower` in der Befehlstabelle (`pad`, `expectedTowerId`); Versus- und Vierer-Wege delegieren an `applyCommand` und führen die Reparatur damit auf dem eigenen Feld aus. Snapshots tragen die neuen Felder als Teil des Matchzustands ohne Formatänderung.
  - `IronPath/core/cartoon-art.mjs`: nur lesende Darstellung — Lebensbalken über beschädigten Türmen und Soldaten, ausgefallene Türme dunkel, Reparatur-Marke, orangefarbene Warnringe um angreifenden Gegner und sein Ziel, Rückkehr-Zähler über dem kampfunfähigen Soldaten.
  - `IronPath/game.js` und `IronPath/i18n/localization-towers-de.mjs`: Reparatur-Aktion in der bestehenden Turm-Ansicht — Angebot mit Preis und Heilbetrag vor der Bestätigung (`REPAIR`), laufende Reparatur als gesperrte Aktion; deutsche Texte für alle neuen Zeilen.
  - `IronPath/tests/block-e-core.test.mjs` (neu, 12 Tests: Leben bei Bau/Start, Telegraf und Treffer, keine Angriffe in den Öffnungswellen, Ausweichen, Angreifer-Obergrenze, Ausfall und geschützte Rückkehr ohne Cooldown-Reset, Panzer gegen Türme, deaktivierter Turm feuert nicht, Reparatur-Angebot/-Ablauf/-Sperren, Verkauf erstattet Reparaturpreis, Upgrade erhält Schadensanteil, Wellenende-Reparatur, Protokoll-Annahme und Feld-Schmuggel-Ablehnung).
  - `IronPath/docs/PATCH-LOG.md` und `IronPath/docs/PATCH-LOG-ARCHIV.md`: `IPL-0086` vollständig ins Archiv, Grenzen auf `IPL-0001` bis `IPL-0086`; das Log führt die neuesten 20 (`IPL-0087` bis `IPL-0106`). In `PATCH-BLOECKE.md` sind die mit dieser Scheibe gelieferten E2-/E3-/E5-Punkte abgehakt; offen bleiben dort nur E2-Feedback/Tutorial, E5-Host-/Emulator-Prüfung im Detail und die menschliche Balance mit Block C.
- **Prüfungen:**
  - `block-e-core.test.mjs` 12/12; Gesamtsuite auf dem Arbeitsstand **1.286/1.286, Exit 0, 0 ausgelassen** (nach `git fetch --unshallow origin`); `patch.mjs check --fast`: 0 Fehler.
  - Balance-Nachmessung (Block-C-Anweisung „vor und nach Block E getrennt messen“): Die erste Tuning-Runde (Soldat 6 / Turm 10 Schaden, Gegner halten in der Vorwarnung an) ließ das kalibrierte Koop-Paar auf Welle 10 und die Elite-Mission `white-noise` kippen — vermessen mit dem Balance-Harness und einem Wegwerf-Debug-Harness (Leck- und Turmleben-Protokoll je Welle; Basislinien-Vergleich im Wegwerf-Worktree). Endwerte wie oben; damit halten die gesetzten Marken: Solo-Rookie `road` Welle 45, Koop-Rookie-Paar `road` Welle 40 (Pin ≥ 30), `white-noise` für Autopilot und Misch-Kit gewinnbar, Misch-Kit `forest` fällt bei Welle 50 (Pin < 55); die volle `balance-suite` läuft grün. Die menschliche Balance mit Block C bleibt der offene Block-E-Rest.
  - Cache-Welle als dritter Commit desselben PR: Feldnotizen-Eintrag `blocke1` (DE+EN, `pr: 368`) in `patch-notes.mjs`, danach `patch.mjs bump 20261123-blocke1 --apply` (79 Dateien, alle 7 Anker tragen `20261123-blocke1`); Gesamtsuite auf der neuen Welle: **1.286/1.286, Exit 0, 0 ausgelassen**; Browser-Fahrten in CI, lokal ist kein Chromium verfügbar.
- **Git / PR / Release:** Feature- und Log-Commit `7f7daa1` liegen auf `arena/ace0b707-0815games-github-io`, PR `#368` ist eröffnet; Cache-Welle, CI, Merge und Pages-Auslieferung sind noch nicht erfolgt und werden erst nach dem tatsächlichen Ereignis mit Kennung nachgetragen.
- **Offen / nächster Schritt:** PR öffnen, Wellen-Commit nachschieben, Gesamtsuite auf `blocke1`, CI abwarten, erst nach belegtem Merge/Pages-Stand als ausgeliefert bezeichnen. Danach Block E Scheibe 2 (Treffer-Feedback und Tutorial-Einführung, Host-/Reconnect-Prüfung im Detail) als eigenes Arbeitspaket.

## IPL-0107 – Endless-Start: Bühne statt Karussell, Records als Medaillentafel (Welle `20261123-endless1`, PR `#369`)
- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber-Vorgabe mit Screenshot des Endless-Dialogs (sinngemäß: Cancel-Button komplett entfernen, Deploy-Button und komplettes Battlefield-Feld oben entfernen, Pfeile und Deploy ins Kartenbild integrieren, ganzer mittlerer Bildbereich als Deploy-Klickfläche, Endless Records optisch aufwerten).
- **Block / Ziel:** Menü-Umbau außerhalb der Blöcke A–E; der „← COMMAND CENTER“-Button oben bleibt der einzige Schließweg.
- **Branch / Basis:** `arena/198513f8-0815games-github-io` ab `3983d9dc72572cff4dc3d67f5f15786cb069efdd` (`main`, Merge PR `#368`). Feature-Commit `df57f411` gepusht, PR `#369` eröffnet; Cache-Welle `20261123-endless1` mit Feldnotizen (`patch-notes.mjs`, `RELEASED_PATCHES[0]` = `endless1`, PR `#369`) und allen 7 Ankern in 79 Dateien.
- **Änderungen / Dateien:**
  - `IronPath/index.html`: `#endlessLaunch` neu aufgebaut – `.endless-deploy-top` samt `#endlessLoadout` und die `.endless-cancel-row` mit `#endlessCancel` ersatzlos entfernt; neue `.endless-stage` mit der einen großen Themenkarte, `#endlessPrev`/`#endlessNext` und `#endlessDeploy` liegen als Elemente auf dem Bild; der Kartentitel `#endlessSelectedTheme` bleibt unten am Bild.
  - `IronPath/core/endless-launcher.mjs`: Klick auf das Kartenbild startet den Einsatz wie der DEPLOY-Button, Enter/Leertaste auf der fokussierten Karte ebenfalls; Pfeiltasten blättern weiter; Cancel- und Loadout-Anbindung entfernt.
  - `IronPath/menu-redesign.css` (Abschnitt 6 neu geschrieben): Bühne 352 px hoch (mobil 248 px), Pfeile innen an den Bildrändern (46×76 px, mobil 40×62 px), DEPLOY mittig unten auf dem Bild (mind. 210 px breit), Endless Records als gerahmte Medaillentafel: Übersschrift zwischen zwei Messing-Linien, sechs Kacheln, BEST WAVE in Gold und größer hervorgehoben, „Last run“-Zeile kursiv und zentriert darunter.
  - Tests mitgezogen: `IronPath/tests/menu-redesign.test.mjs` (Layout-Anker neu: Bühne mit integrierten Pfeilen/DEPLOY, kein Cancel/Loadout mehr, Bühnenhöhe), `IronPath/tests/endless-launcher.test.mjs` (Cancel-/Loadout-Erwartungen entfernt, neuer Test: Bild-Klick und Enter starten), `IronPath/browser-tests/command-center.cjs` (kein `#endlessLoadout`, kein `#endlessCancel`), `IronPath/browser-tests/interface-smoke.cjs` (Geometrie neu: DEPLOY/Pfeile innerhalb des Bildes, DEPLOY zentriert im unteren Bildbereich, keine Cancel-Zeile).
- **Prüfungen:** `node --test IronPath/tests/*.test.mjs`: tests 1287 / pass 1286 / skipped 1 / fail 0, Exit 0; der eine ausgelassene Test ist der bekannte Flachklon-Effekt in `release-pages-site.test.mjs` („Pinned ancestor commits require a full Git checkout“) – nach `git fetch --unshallow origin` läuft diese Datei 6/6, die Suite ist damit effektiv vollständig grün. `node IronPath/scripts/patch.mjs check --fast`: 0 Fehler, 2 Hinweise (Stand vor der Cache-Welle). Kein lokaler Chromium: Browser-Fahrten (`command-center`, `interface-smoke`) laufen erst in der CI.
- **Git / PR / Release:** Ereignis-Nachtrag zu `IPL-0106`: PR `#368` am 2026-11-23 als `3983d9dc72572cff4dc3d67f5f15786cb069efdd` gemergt, Pages-Build `built`, `release-version.json` auf `main` trägt `20261123-blocke1` (Auslieferung im PR-Text belegt). Dieser Eintrag wird mit Welle und PR-Nummer fortgeschrieben.
- **Offen / nächster Schritt:** Gesamtsuite auf der Welle, CI zu PR `#369`, Merge und Pages-Nachweis. Aus Block E bleibt Scheibe 2 (Treffer-Feedback/Tutorial, Host-/Reconnect-Prüfung im Detail, menschliche Balance mit Block C) ein eigenes späteres Paket.

## IPL-0108 – Endless-Bühne Feinschliff: Name oben, Stencil-DEPLOY mit Glow-Rahmen, Militär-Pfeile, zentriertes Fragezeichen (Welle `20261123-endless2`, PR `#370`)
- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber-Rückmeldung zum ausgelieferten `IPL-0107` (DEPLOY liegt über dem Kartennamen, Fragezeichen im Zufallsbild teilweise abgeschnitten, Pfeile optisch unpassend) plus Vorgabe „Deploy als Military Schrift mit Glow rahmen … Oder erstell ein bild“ und „Lets gooooooo“.
- **Block / Ziel:** Feinschliff am Endless-Startdialog, kein Block-Thema.
- **Branch / Basis:** `arena/4748275f-0815games-github-io` ab `007bb594f120aeb1b4025c526a1a356dfa2f57ad` (`main`, Merge PR `#369`). Feature-Commit `b24da2b81b8998d41c7ce5fdcb2cd0caade6eb78` gepusht, PR `#370` eröffnet; Cache-Welle `20261123-endless2` mit Feldnotizen (`patch-notes.mjs`, `RELEASED_PATCHES[0]` = `endless2`, PR `#370`).
- **Änderungen / Dateien:**
  - `IronPath/menu-redesign.css`: Kartenname `#endlessSelectedTheme` sitzt jetzt oben am Bild (`.endless-theme-card` mit `align-items:flex-start`, Lichtkante aller 6 Themen-Verläufe nach oben gedreht) – DEPLOY besitzt die Bildunterkante allein. `#endlessDeploy` als Militär-Stencil: dunkle Oliv-Platte, 2-px-Messing-Rahmen mit Außen- und Innen-Glow (`0 0 18px`/`44px`), Schrift in „Arial Black“/Impact mit 0.22em Laufweite und eigenem Buchstaben-Glow, dazu leuchtende Ziel-Ecken oben links/unten rechts. Neue `.endless-arrow`-Platten: olivgrüne Panzerplatte mit vier Nieten (radial-gradient), gefüllte Messing-Doppel-Chevrons als SVG mit Drop-Shadow, Hover mit Glow-Rand.
  - `IronPath/index.html`: Pfeil-SVGs durch gefüllte Doppel-Chevrons (`viewBox 0 0 48 48`) ersetzt.
  - `IronPath/assets/endless-random.jpg`: Artwork neu erzeugt – das rostige Messing-Fragezeichen sitzt jetzt exakt im Bildzentrum; bei `background-size:cover` + `center` bleibt es damit auf jeder Bühnengröße zentriert und wird nie angeschnitten.
  - Tests: `IronPath/tests/menu-redesign.test.mjs` (Anker: Name oben, Stencil-Glow-DEPLOY, 48er-Chevron-SVGs), `IronPath/browser-tests/interface-smoke.cjs` (Geometrie: Name in der oberen Bildhälfte und immer oberhalb von DEPLOY).
- **Prüfungen:** `node --test IronPath/tests/menu-redesign.test.mjs IronPath/tests/endless-launcher.test.mjs`: 18/18. `patch.mjs check --fast`: 0 Fehler (2 Hinweise vor der Welle). Sichtprüfung über lokale Live-Vorschau durch den Betreiber möglich; Browser-Fahrten laufen mangels lokalem Chromium in der CI. Gesamtsuite folgt auf der Cache-Welle.
- **Git / PR / Release:** Wird mit Welle und PR-Nummer fortgeschrieben.
- **Offen / nächster Schritt:** Cache-Welle `20261123-endless2` inkl. Feldnotizen, PR, CI, Merge, Pages-Nachweis. Block E Scheibe 2 bleibt eigenes Paket.

## IPL-0109 – Endless-Bühne: Standard-Pfeile in Militär-Optik zurück, DEPLOY nur schriftbreit (Welle `20261123-endless3`, PR `#371`)
- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber-Rückmeldung zu `IPL-0108`: „Die Pfeilge fallen mit optisch gar nicht. Wir gehen wieder zu standart Pfeilen in Militär optik über.“ und „Deploy button soweit sogut. Aber wieso über die gesamte breite? Reicht doch fix in der mitte so breit wie die schrift selbst.“
- **Block / Ziel:** Feinschliff am Endless-Startdialog, kein Block-Thema.
- **Branch / Basis:** `arena/1b685ae1-0815games-github-io` ab `483dbd74cd81c6bfa644c707e5bb1a978d7a1335` (`main`, Merge PR `#370`). Feature-Commit `0506cbeb5fbdfac1692551308124f36533ab14a1` gepusht, PR `#371` eröffnet; Cache-Welle `20261123-endless3` mit Feldnotizen (`patch-notes.mjs`, `RELEASED_PATCHES[0]` = `endless3`, PR `#371`).
- **Änderungen / Dateien:**
  - `IronPath/index.html`: Pfeil-SVGs zurück auf die klassischen schlanken Linien-Chevrons (`viewBox 0 0 28 48`, Doppelstrich mit Tragstrich) statt der gefüllten 48er-Doppel-Chevrons aus `IPL-0108`.
  - `IronPath/menu-redesign.css`: Pfeil-Buttons zurück auf das schlanke Standardmaß (46×76 px, mobil 40×62 px) mit dunklem Oliv-Verlauf, Messing-Rand und Messing-Chevron – also Standard-Pfeile in Militär-Optik; die genietete Panzerplatte aus `IPL-0108` ist entfernt. `#endlessDeploy` verliert seine Mindestbreite (220 px Desktop / 180 px mobil) und ist jetzt nur so breit wie die Stencil-Schrift plus Innenabstand, weiterhin mittig unten auf dem Bild mit Glow-Rahmen.
  - Tests: `IronPath/tests/menu-redesign.test.mjs` (Anker: 28er-Standard-Chevrons; DEPLOY ohne `min-width`).
- **Prüfungen:** `node --test IronPath/tests/menu-redesign.test.mjs IronPath/tests/endless-launcher.test.mjs`: 18/18. `patch.mjs check --fast`: 0 Fehler (2 Hinweise vor der Welle). Browser-Geometrie (Pfeil-/DEPLOY-Lage im Bild) ist durch die unveränderten Anker in `interface-smoke.cjs` weiter gedeckt und läuft in der CI; Sichtprüfung über die lokale Live-Vorschau.
- **Git / PR / Release:** Wird mit Welle und PR-Nummer fortgeschrieben.
- **Offen / nächster Schritt:** Cache-Welle `20261123-endless3` inkl. Feldnotizen, PR, CI, Merge, Pages-Nachweis. Block E Scheibe 2 bleibt eigenes Paket.

## IPL-0110 – Endless-Bühne: DEPLOY wirklich schriftbreit, Ruhe-Glow gedämpft, Bühne höhenresponsiv
- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber-Rückmeldung zu `IPL-0109`: „Deploy button immer noch komplett breit wie das Bild fenster. Außerdem ist der Glow ohne Mous over zu viel.“ und „Gerne darf das Bild auch Höher sein und sich an der Höhe der jeweilgien bildschirme orientieren“.
- **Block / Ziel:** Feinschliff am Endless-Startdialog, kein Block-Thema.
- **Branch / Basis:** `arena/39231886-0815games-github-io` ab `2ba35cd193906638416c69008b78963acaf627af` (`main`, Merge PR `#371`). Status: lokal umgesetzt, Commit/PR folgen.
- **Ursachenanalyse:** Die globale Regel `button,select{width:100%}` in `IronPath/style.css` griff weiter, weil `#endlessDeploy` keine eigene Breite setzte – das Entfernen der Mindestbreite in `IPL-0109` allein konnte daran nichts ändern. Erst ein ausdrückliches `width:fit-content` in der feldspezifischen Regel schlägt die Basisregel.
- **Änderungen / Dateien:**
  - `IronPath/menu-redesign.css`: `#endlessDeploy` mit `width:fit-content`, `max-width:calc(100% - 32px)` und `text-align:center` – jetzt exakt schriftbreit plus Innenabstand. Ruhe-Glow gedämpft (äußerer Schein `0 0 10px/0.35` + `0 0 24px/0.14`, Buchstaben-Glow halbiert); der starke Schein (`0 0 26px`/`58px`) kommt erst bei Hover. Bühne `.endless-stage` höhenresponsiv: Desktop `clamp(320px, 48vh, 520px)`, mobil `clamp(230px, 36vh, 340px)` (jeweils auch als `dvh`-Variante) statt fixer 352/248 px.
  - Tests: `IronPath/tests/menu-redesign.test.mjs` (Anker: `fit-content`, ruhiger Ruhe-Glow, Hover-Glow, höhenresponsive Bühne), `IronPath/browser-tests/interface-smoke.cjs` (neue Geometrie-Wache: DEPLOY höchstens 70 % der Bühnenbreite).
- **Prüfungen:** `node --test IronPath/tests/menu-redesign.test.mjs IronPath/tests/endless-launcher.test.mjs`: 18/18. `patch.mjs check --fast`: 0 Fehler (2 Hinweise vor der Welle). Browser-Geometrie läuft in der CI; Sichtprüfung über die lokale Live-Vorschau.
- **Git / PR / Release:** Wird mit Welle und PR-Nummer fortgeschrieben.
- **Offen / nächster Schritt:** Cache-Welle `20261123-endless4` inkl. Feldnotizen, PR, CI, Merge, Pages-Nachweis. Block E Scheibe 2 bleibt eigenes Paket.
