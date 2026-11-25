# Patch-Ablauf

Wie ein Update in `PipBoy3000/` läuft. Vorbild sind
[`IronPath/docs/PATCH-ABLAUF.md`](../../IronPath/docs/PATCH-ABLAUF.md) und
[`tiny-tycoon-towns/docs/PATCH-ABLAUF.md`](../../tiny-tycoon-towns/docs/PATCH-ABLAUF.md):
gleiche Gliederung, gleiche Begriffe, gleiche Werkzeuge. Das Werkzeug ist
`tools/patch.mjs`.

Was hier **anders** ist als in den beiden Vorlagen, und warum:

| | IronPath | Tiny Tycoon Towns | PipBoy3000 |
| --- | --- | --- | --- |
| Stempel | Wellen-Token `20261125-aim11` | Wellen-Token `20261125-zoom1` | Version `14.0.14` |
| Warum | Cache-Welle, Module tragen `?v=` | dito | Projektversion ist älter, steht in 184 Tests, `package.json` und Changelog. Ein zweites Format daneben wäre die Doppelung, die diese Runde abschafft. |

Ein Wellen-Token hat einen Vorteil, den die Version nicht hat: es sagt „diese
Datei wurde in dieser Welle gebaut", auch wenn sich die Versionsnummer nicht
ändert (Nachbesserung ohne Release). Wer das braucht, hängt
`<meta name="pipboy-build" content="14.0.14">` um einen Zusatz — aber dann
müssen `tools/patch.mjs` und `src/ui/ui_update.js` beide mitziehen, und das ist
eine bewusste Entscheidung, keine Nebenwirkung.

## Begriffe und Status

| Status | Bedeutung | Belegt durch |
| --- | --- | --- |
| `lokal/uncommittet` | nur im Arbeitsbaum | `git status` |
| `committet` | in einem lokalen Commit | Commit-Hash |
| `gepusht` | auf dem Arbeitszweig auf GitHub | `git log origin/<zweig>..HEAD` leer |
| `PR offen` | Pull Request existiert, nicht gemergt | PR-Nummer |
| `gemergt` | in `main` übernommen | Merge-Commit |
| `veröffentlicht` | Seite von GitHub Pages ausgeliefert | Pages-Build `built` |
| `abgenommen` | vom Betreiber auf einem Gerät geprüft | seine Aussage |

## 1. Vor der Arbeit

```sh
cd PipBoy3000
npm ci
node tools/patch.mjs check
```

`check` prüft vier Blöcke: **Stempel** (zehn Anker, alle dieselbe Version),
**Patch-Notizen** (oberster Eintrag = laufende Version, jeder Eintrag mit Titel
und Zeilen), **Geheimnisse** (nur hinzugefügte Zeilen im Diff) und **Struktur**
(Bündel vorhanden, `build.json` passt zu `shell/Version`). Ist ein Block rot,
zuerst klären — nicht „geht schon".

## 2. Während der Arbeit

- Ein logischer Schritt = ein Commit. Produktcode und sein Test zusammen.
- Jeden Wächter auf Bissfestigkeit prüfen: absichtlich kaputt machen, Test muss
  rot werden, Probe zurücknehmen. Ein Test, der nie rot war, belegt nichts.
- Quellen in `src/`, `shell/` und `templates/`. Was in der Wurzel liegt
  (`index.html`, `app.js`, `app.css`, `style.css`, `build.json`, `Version`), ist
  **erzeugt** — nie von Hand ändern, der nächste Build überschreibt es.

## 3. Nach der Änderung

```sh
npm run verify            # Build-Prüfung + 184 Tests
node tools/patch.mjs check --suite   # + Vertragstests
```

Ins Changelog gehören die echten Zahlen: `tests / pass / fail` und der Exit-Code.

## 4. Version erhöhen

```sh
node tools/patch.mjs bump              # Trockenlauf, zeigt jede betroffene Zeile
node tools/patch.mjs bump --apply      # schreiben
node build.mjs                         # erzeugt build.json, Version, index.html
```

`bump` schreibt **nur Quellen**: `shell/Version`, `package.json`,
`shell/index.html` (Meta-Stempel) und — falls nötig — `?v=`-Importe. Alles
andere erzeugt der Build. Danach ist `check` rot, bis zwei Dinge passiert sind:

1. `src/ui/ui_patch_notes.js` hat oben einen Eintrag mit genau dieser Version
   (Titel + Zeilen, was tatsächlich ausgeliefert wurde),
2. `docs/change.log` hat einen Abschnitt `## v<version>`.

Das ist Absicht: das Werkzeug kann keine Welle ausliefern, die niemand
dokumentiert hat. Der Spieler sieht diese Einträge im Fenster
**PATCH-NOTIZEN**.

## 5. Was der Spieler sieht

| Ort | Was | Wann |
| --- | --- | --- |
| Spielmenü → **PATCH-NOTIZEN** | zwei Reiter: veröffentlicht / noch offen, mit installiertem Build | jederzeit |
| Login-Bildschirm → **PATCH-NOTIZEN** | dasselbe Fenster | vor dem Anmelden |
| Balken unten | „NEUE VERSION X VERFÜGBAR" + JETZT LADEN | wenn der Server eine andere Version hat |
| Balken unten | „NEUE VERSION BEREIT — Dialog offen" | wenn gerade etwas offen ist |
| Balken unten | „NEUE VERSION X GELADEN" | nach dem Neuladen |
| Spielmenü → **NACH UPDATE SUCHEN** | prüft sofort von Hand | jederzeit |

Das Neuladen passiert **nicht**, solange ein Dialog offen ist, ein Kampf läuft
oder eine Speicherung aussteht (`src/ui/ui_update.js`, `updateBlockers()`).

## 6. Commit, Push, Pull Request, Merge

- Commit-Text: Ziel, Dateien, Prüfungen mit Zahlen, Grenzen.
- Push nur auf den Arbeitszweig dieser Sitzung.
- `gh pr checks <nr> --watch` abwarten, dann Squash-Merge.
- Nach dem Merge prüfen: Pages-Build `built`, und `build.json` im Netz nennt die
  neue Version.

## Was die Werkzeuge nicht tun

`check` liest und meldet, schreibt nichts, merged nichts, deployt nichts.
`bump` schreibt nur mit `--apply`, und nur Quellen. Kein Git-Hook erzwingt
etwas: Ereignisse außerhalb dieses Ablaufs muss man selbst nachtragen.
