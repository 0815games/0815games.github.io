# Pip-Boy 3003

Ödland-RPG im Browser. Kein Build nötig, um es zu spielen — die Seite wird als
fertiger Stand ausgeliefert. Dieses Dokument beschreibt die Entwicklung.

- **Spielerhandbuch:** [docs/README.md](docs/README.md) *(die frühere readme.md,
  inhaltlich unverändert)*
- **Analyse und Umbau:** [docs/ANALYSE.md](docs/ANALYSE.md)
- **Änderungen:** [docs/change.log](docs/change.log)
- **Offene Punkte:** [docs/to_do.log](docs/to_do.log)

## Aufbau

```
src/data/      Datenmodule  — Items, Rezepte, Monster, Quests, Minigames
src/game/      Spiellogik   — Kern, Karte, Rendering, Kampf, Inventar, Welt
src/ui/        Oberfläche   — Views, Renderer, Eingabe, Overlays
src/network.js Firebase     — Auth, Spielstände, Bestenliste
src/admin.js   Verwaltung   — eigene Seite (admin.html)

shell/         Quellen der Hüllseiten: index.html, admin.html, style.css, Version
templates/     13 HTML-Templates, die zur Laufzeit per fetch geladen werden
tests/         Bündel-, Daten-, Seiten- und Hygiene-Tests
entries.mjs    Ladereihenfolge und erlaubte Überschreibungen
build.mjs      Build direkt in den Spielordner
```

Der Build schreibt **in diesen Ordner**, nicht nach `dist/`: GitHub Pages
liefert das Repository aus der Wurzel aus (`build_type: legacy`), und der
Portal-Test des Dashboards verlangt `PipBoy3000/index.html`. Die Quellen der
Hüllseiten liegen deshalb in `shell/`; `index.html`, `admin.html`, `app.js`,
`admin.js`, `app.css` und `build.json` sind erzeugte Dateien.

## Befehle

```bash
npm install          # einmalig
npm run build        # baut in den Spielordner (Bündel, CSS, Hüllseiten)
npm run build:check  # prüft nur, schreibt nichts — für CI
npm test             # jsdom-Tests gegen das gebaute Bündel
npm run verify       # build:check + test
```

`npm test` prüft das **gebaute Bündel**, nicht `src/`. Vor dem Test muss also
gebaut worden sein — `npm run verify` macht beides in der richtigen Reihenfolge.

## Ladereihenfolge ist Vertrag

Die Dateien in `src/` sind keine ES-Module mit Exporten, sondern Skripte, die
globale Objekte erweitern. **Die Reihenfolge in `entries.mjs` ist deshalb
bedeutungstragend** und steht an genau einer Stelle; `entry.js` und
`entry-admin.js` importieren entsprechend dieser Liste.

Der Build bricht ab, wenn:

- zwei Dateien dieselbe Methode auf demselben Objekt definieren und die
  Überschreibung nicht in `KNOWN_OVERRIDES` begründet ist,
- `KNOWN_OVERRIDES` eine Überschreibung nennt, die es nicht mehr gibt,
- `entry.js` und `ORDER` auseinanderlaufen,
- eine Datei in `src/` von keiner Ladereihenfolge erreicht wird (toter Code).

Das ist die Absicherung gegen den Fehler, der dieses Projekt vorher
gekennzeichnet hat: sieben Methoden wurden stillschweigend überschrieben, bei
zwei davon war die verdeckte Fassung die bessere. Ein neuer Eintrag in
`KNOWN_OVERRIDES` ist immer eine Entscheidung, die begründet werden muss.

## Tests

| Datei | Prüft |
|---|---|
| `bundle.test.mjs` | Bündel lädt, globale Objekte vollständig |
| `data-integrity.test.mjs` | Item-, Rezept- und Monsterverweise, Loot-IDs, Biome |
| `page-boot.test.mjs` | echte `index.html` in jsdom bis „SYSTEM READY" |
| `repo-hygiene.test.mjs` | keine `.old`-Leichen, keine unerreichten Dateien, Versionsstempel |

`page-boot.test.mjs` ist der Test, der die Boot-Sequenz absichert: er führt die
ausgelieferte Seite aus und prüft, dass sie bis zur Anmeldung kommt.

## Auslieferung

Der gebaute Stand wird mit eingecheckt, weil Pages ihn direkt ausliefert. Nach
Änderungen an `src/`, `shell/` oder `templates/` also `npm run verify` laufen
lassen und die erzeugten Dateien mit committen. `build.json` hält Version,
Größen und Prüfsummen fest, damit sich ein Stand zuordnen lässt.
