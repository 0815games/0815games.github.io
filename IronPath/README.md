# Iron Path – Ordnerstruktur

Diese Datei trennt zwei Dinge, die früher vermischt waren: **was der Browser
lädt** und **was Menschen zur Arbeit brauchen**. Sie ist bewusst kurz; die
verbindliche Arbeitsanweisung steht in [`../AGENTS.md`](../AGENTS.md), das
Protokoll aller Schritte in [`docs/PATCH-LOG.md`](docs/PATCH-LOG.md).

## Was ausgeliefert wird

GitHub Pages baut dieses Repository mit `build_type: legacy` aus `main`,
Pfad `/`. **Der gesamte Repo-Baum ist damit öffentlich erreichbar**, es gibt
keinen Build-Schritt, der etwas aussortiert, und keinen Service Worker, der
etwas vorcacht. Das Spiel liegt unter `/IronPath/…`; diese URLs sind fest
(Lesezeichen, `assets/manifest.webmanifest`, alle relativen Importe).

Ausgeliefert wird also auch Arbeitsmaterial. Der Unterschied zwischen den
Bereichen unten ist deshalb **Struktur für die Arbeit**, nicht Sichtbarkeit.

## Die Spielwurzel `IronPath/` (ohne Unterordner)

Nur was der Browser tatsächlich lädt: `index.html`, `admin.html`,
`version.html`, `account.js`, `game.js`, die `.mjs`-Module, die `.css`-Dateien
und `release-version.json`.

Diese Wurzel ist zugleich das **Release-Inventar**:
`release-tools/stage-version.mjs` kopiert jede Datei der Wurzel mit den
Endungen `.mjs`, `.js` und `.css` in jeden gestagten Build. Was hier liegt,
wird mitveröffentlicht — auch wenn es kein Spieler je importiert. Deshalb gilt:

> In `IronPath/` (Wurzel) liegt keine Doku, kein Entwicklungsskript und kein
> Modul ohne Importeur. `IronPath/tests/repo-structure.test.mjs` prüft das.

## Modul-Ordner im Spiel (im Aufbau)

Die Spielmodule wandern schrittweise aus der flachen Wurzel in Fach-Ordner.
Verbindlich ist die Liste `GAME_MODULE_FOLDERS` in
`release-tools/stage-version.mjs` — der Packager kopiert genau diese Ordner
rekursiv in jeden Release-Build, und der Struktur-Wächter liest dieselbe Liste,
damit beide nie auseinanderlaufen:

| Ordner | Inhalt |
| --- | --- |
| `battle/` | Gefecht: Simulation, Kampf, Wellen, Türme im Feld |
| `core/` | Grundlagen: Sprache, Einstellungen, Version, gemeinsame Bausteine |
| `i18n/` | Deutsche Wörterbücher (`localization-*-de.mjs`) und Sprachlogik |
| `net/` | Firebase-/Mehrspieler-Clientmodule (`firebase-*`, Party, Freunde) |
| `ui/` | Oberfläche: HUD, Menüs, Dialoge, Bildschirme |
| `workshop/` | Werkstatt: Baupläne, Mods, Prestige |

Solange ein Ordner noch nicht existiert, ist das kein Fehler — die Gruppen
ziehen eine nach der anderen um, jeder Umzug als eigener Patch. In der Wurzel
bleiben dauerhaft die Eintrittspunkte (`index.html`, `admin.html`,
`version.html`, `account.js`, `game.js`, die `*-entry.mjs`), die `.css`-Dateien
und `release-version.json`. In einem Modul-Ordner liegt nur Code
(`.mjs`/`.js`/`.css`); alles andere lässt der Packager laut scheitern statt es
still zu verlieren.

## Arbeitsmaterial

| Ordner | Inhalt | Wird ausgeliefert? |
| --- | --- | --- |
| `docs/` | Protokoll und Pläne: `PATCH-LOG.md`, `PATCH-BLOECKE.md`, `DATENBLATT.md`, `CHECKLIST.md`, Test- und Release-Pläne | ja (Pages), aber nie Teil eines Release-Builds |
| `tests/` | Unit-/Vertragstests (`.test.mjs`), von `node --test` ausgeführt | ja (Pages), nicht im Release-Build |
| `browser-tests/` | Chromium-Fahrten (`.cjs`), in CI als `interface-browser-smoke` | ja (Pages), nicht im Release-Build |
| `stress-tests/` | `run.mjs`, Lastfahrt in CI | ja (Pages), nicht im Release-Build |
| `firebase/` | RTDB-Regelkandidaten, Übergaben, `rules-test/` (Emulator-Suite) | ja (Pages), nicht im Release-Build |
| `release-tools/` | Packager und Wächter für den isolierten Test-Build (Vercel) | teilweise: 13 Dateien gehören zu `CRITICAL_RELEASE_FILES` |
| `server/` | Nicht eingehängte Dienst-Prototypen (`npm test --prefix IronPath/server`) | ja (Pages), nicht im Release-Build |
| `scripts/` | Entwicklungswerkzeuge: Prüf- und Umbauskripte, Audit-Skripte, Module ohne Importeur | ja (Pages), nicht im Release-Build |
| `assets/` | Kunst, Audio, Video, Layer-Manifest | **ja, und zwar im Release-Build** |
| `browser-artifacts/` | Erzeugte Prüf-Artefakte (PNG) | ja (Pages), nicht im Release-Build |

## Prüfungen

Bindend ist der **Serienlauf vom Repo-Root** (Parallelität zählt falsch):

```sh
node --test-reporter=tap --test IronPath/tests/*.test.mjs
```

Dazu je nach Änderung: `node IronPath/stress-tests/run.mjs`,
`npm test --prefix IronPath/server`,
`npm ci --prefix IronPath/firebase/rules-test && npm test` dort, und die
Chromium-Fahrten aus `browser-tests/`. Welche Prüfung zu welchem Schritt
gehört und was vor und nach einem Patch zu tun ist, steht in
[`docs/PATCH-ABLAUF.md`](docs/PATCH-ABLAUF.md).

## Cache-Welle

Jede Veröffentlichung trägt ein Token der Form `20YYMMDD-name`
(`release-version.json`). Es steht in `index.html` (Meta-Tag und zwei
`build-stamp`-Elemente), in `login-scene.mjs`, in `release-version.json`, in
zwei `browser-tests` und als `?v=`-Suffix an praktisch jedem Import.
[`scripts/patch-bump.mjs`](scripts/patch-bump.mjs) ersetzt es im ganzen Baum, lässt die historischen
`build:`-Felder und Protokollsätze in `patch-notes.mjs` stehen und meldet jede
geänderte Zeile, die **kein** `?v=`-Import ist — das müssen genau die sieben
bekannten Stellen sein.
