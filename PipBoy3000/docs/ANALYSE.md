# Pip-Boy 3003 — Analyse und Umbau

Stand: 24.11.2026 · Branch `arena/2d96483a-0815games-github-io`

Dieses Dokument beantwortet die Ausgangsfrage „ist der Aufbau, die Mechanik und
alles veraltet?" mit Belegen aus dem Quellcode und beschreibt, was daraus
geworden ist. Es ist bewusst ehrlich über Fehler: ein früherer Durchgang dieser
Analyse behauptete vier Dinge, die sich bei genauerer Prüfung als falsch
erwiesen (siehe Abschnitt 7). Die Korrekturen stehen drin, weil eine Analyse,
die ihre eigenen Fehler verschweigt, nichts taugt.

---

## 1. Kurzfassung

| Frage | Antwort |
|---|---|
| Ist die **Mechanik** veraltet? | **Nein.** Die Spielsysteme sind vollständig und eigenständig: SPECIAL, Perks, V.A.T.S. mit drei Körperzonen, Permadeath, dreistufige Dungeons, Crafting, Camp mit Kochen, Shop mit Restock, Klinik, Quest-Ketten, prozedurale Welt. |
| Ist der **Unterbau** veraltet? | **Ja.** Firebase-compat 8.10.1, Tailwind über CDN, keine Module, kein Build, keine Tests, kein Bundle. |
| War das Spiel **kaputt**? | Nicht strukturell, aber an mehreren Stellen konkret: sieben Befunde, davon vier mit sichtbarer Wirkung im Spiel. Alle sind behoben. |

Der eigentliche Kern: **die Ladereihenfolge war die Architektur.** 26 Skripte
luden nacheinander, jedes durfte alles überschreiben. Sieben Methoden wurden
tatsächlich überschrieben — bei zwei davon war die verdeckte Fassung die
bessere. Das ist kein Alterungsproblem, sondern ein Strukturproblem, und es ist
mit diesem Umbau beseitigt.

---

## 2. Ausgangsbefund: Technik

| Ebene | Befund | Bewertung |
|---|---|---|
| Firebase | compat **8.10.1** von gstatic, Projekt `pipboy-rpg`, RTDB `europe-west1` | v8 ist Legacy; v9/v10 modular ist seit 2021 der Standard. Die compat-Schicht ist laut Google eine Übergangslösung, die in einer künftigen Hauptversion entfällt. |
| CSS | `cdn.tailwindcss.com` | offiziell „not for production": das CSS wird im Browser erzeugt, was den ersten Bildaufbau verzögert und flackert. |
| Ladesystem | 26 Skripte seriell über eine Promise-Kette in `index.html`, plus `document.write` für das Stylesheet | Die Reihenfolge war der Abhängigkeitsgraph, dokumentiert nur durch Kommentar „Reihenfolge ist wichtig!". Ein Fehler in einer Datei brach alles ab. |
| Cache | `?v=` + `Date.now()` an jedem Skript | **Kein Skript wurde jemals aus dem Cache geladen.** Bei jedem Aufruf 26 volle Requests. |
| Struktur | 7 Globals (`Game`, `UI`, `Combat`, `WorldGen`, `Network`, `MiniGames`, `Admin`), erweitert über 18 × `Object.assign` | Keine Kapselung, keine Typen, kein Import-Graph. |
| Prüfungen | keine `package.json`, keine Tests, keine CI | 53 Dateien ohne eine einzige automatische Prüfung. Der Ordner kam in den Repo-Tests nicht vor. |
| Version | `Version` = `13.37`, `readme.md` = `0.9.8`, `change.log` = `0.8.0`, Weltkarte = `PIP-OS V7.1.0` | Vier Stände gleichzeitig. |

---

## 3. Befunde mit Wirkung im Spiel

Alle folgenden Punkte waren im Quellcode nachweisbar und sind jetzt behoben.
Jeder hat einen Regressionstest in `tests/data-integrity.test.mjs`.

### B1 — Quest-Belohnungen gingen verloren *(behoben)*
`Game.addItem` wurde in `game_core.js:240` aufgerufen, war aber zum Zeitpunkt
des Aufrufs nicht definiert: die Datei `game_inv_logic.js`, die den Alias am
Ende setzt, wurde erst später geladen. Belohnungen mit Items (Leder, Stimpacks,
`radio_part`, `fusion_core`) verschwanden stillschweigend.

### B2 — Touch-Joystick erschien nie *(behoben)*
`UI.restoreOverlay` war zweimal definiert. Die Fassung in `ui_render_overlays.js`
gewinnt und legt `#joystick-base` nicht an; nur die verdeckte Fassung in
`ui_render_core.js` tat das. Damit blieb `UI.els.joyBase` dauerhaft `null` und
`showJoystick()` lief ins Leere. Auf Mobilgeräten war die Spielfigur nicht
bewegbar.

### B3 — Quest-Ansicht war nicht erreichbar *(behoben)*
Der Button AUFGABEN zeigte auf die View `journal`. Ein Template
`views/journal.html` gab es nie (die echte Ansicht heißt `quests.html`), also
lief der Klick in einen 404 und öffnete den Fehlerdialog. `switchView('quests')`
wurde im gesamten Code nicht aufgerufen.

### B4 — Sechs Item-IDs ohne Definition *(behoben)*
`data_monsters.js` droppt `bone`, `acid`, `poison_gland`, `gunpowder`,
`deathclaw_hand` und `titanium`. Keines davon stand im Item-Katalog. Folge:
`getStackLimit` liefert für unbekannte IDs 1, jeder Fund belegt einen eigenen
Slot, und `ui_view_inv.js` überspringt unbekannte IDs (`if(!item) return;`) —
der Gegenstand ist im Inventar **unsichtbar**, der Slot aber weg. Das ist genau
der offene Punkt „Items werden beim Aufsammeln nicht immer richtig angezeigt"
aus `to_do.log`.

### B5 — Fünf Monster im Spawn-Pool existierten nicht *(behoben)*
`startCombat` baute Gegner-Pools aus `Game.monsters.protectron`, `.sentryBot`,
`.mirelurk`, `.mutantRose` und `.yaoGuai`. Keines dieser Monster stand im
Katalog. Das Spiel fiel auf „Unbekanntes Monster" mit 20 HP zurück — im Sumpf
betraf das die Hälfte aller Begegnungen.

### B6 — Zwei Biome und zwei Zonen wurden nie erzeugt *(behoben)*
`game_char_logic.js` unterschied die Biome `city` und `jungle` sowie die Zonen
`Supermarkt` und `Höhle`. `game_world_gen.js` erzeugte nur `forest`, `swamp`,
`desert`, `mountain` und `wasteland`. Drei komplette Gegner-Pools waren damit
toter Code.

### B7 — Legendäre Waffen: zwei Fassungen, die schwächere gewann *(behoben)*
`Game.gambleLegendaryLoot` existierte zweimal. Die Fassung in
`game_inv_logic.js` enthielt das vollständige System: fünf Präfixe (Brutale,
Doppelschuss, Vampir, Atomare, Leichte), eigene UIDs, Werteänderungen. Die
Fassung in `game_char_logic.js` gewann durch die Ladereihenfolge und war eine
einfache Stufenabfrage. Das komplette Präfix-System war toter Code.

### B8 — Fehlende Funktionen *(behoben)*
`Game.getMaxHp()` wurde von Vampir-Waffen aufgerufen und war nirgends definiert
→ der Effekt heilte nie. `Game.deleteSave()` wurde beim Permadeath aufgerufen
und war ebenfalls nicht vorhanden; der Ersatzweg löschte `save_0`, `slot_0`,
`wasteland_save_0` und `vault_save_0` — Schlüssel, die das Spiel nie schreibt.

### B9 — Munition wurde nicht verbraucht *(offen, dokumentiert)*
`game_combat.js` fragt korrekt `ammoType` ab und verbraucht Munition — aber
**keine einzige Waffe im Katalog hat ein `ammoType`**. `getWeaponStats` liefert
deshalb immer `null`, und der Verbrauchspfad wird nie betreten. Das Feld
`usesAmmo: true` existiert in den Daten, wird aber von keiner Codezeile gelesen.
Der offene Punkt „kein munitionsverbrauch" aus `to_do.log` ist damit erklärt.

### B10 — Doppelt gepflegte Monsterdaten *(offen, dokumentiert)*
`data_monsters.js` **ersetzt** `GameData.monsters` vollständig, statt zu
ergänzen (`data_core.js` nutzt `Object.assign`, `data_monsters.js` eine direkte
Zuweisung). Änderungen an den Monstern in `data_core.js` wirken nicht. Der
Katalog ist derzeit in Ordnung, aber die Falle bleibt.

---

## 4. Was der Umbau geändert hat

### Struktur
```
PipBoy3000/
├─ src/
│  ├─ data/     5 Datenmodule (Items, Rezepte, Monster, Quests, Minigames)
│  ├─ game/     8 Spiellogikmodule
│  ├─ ui/      12 Oberflächenmodule
│  ├─ network.js
│  └─ admin.js
├─ shell/          Quellen der Hüllseiten (index.html, admin.html, style.css, Version)
├─ templates/      13 HTML-Templates (unverändert ausgeliefert)
├─ tests/          Bündel-, Daten-, Seiten- und Hygiene-Tests
├─ docs/           dieses Dokument, Spielerhandbuch, change.log, to_do.log
├─ entry.js        Einstiegspunkt Spiel
├─ entry-admin.js  Einstiegspunkt Verwaltung
├─ entries.mjs     Ladereihenfolge + erlaubte Überschreibungen
├─ build.mjs       Build
└─ index.html / admin.html / app.js / admin.js / app.css / build.json   erzeugt
```

### Warum kein `dist/`
GitHub Pages liefert dieses Repository aus der Wurzel aus (im Pages-Artefakt
steht `build_type: legacy`), und `arcade/tests/portals.test.cjs` verlangt, dass
`PipBoy3000/index.html` existiert. Ein `dist/` daneben würde nie ausgeliefert.
Der Build schreibt deshalb **in den Spielordner selbst**; die Quellen der
Hüllseiten liegen getrennt in `shell/`, damit erzeugte und geschriebene Dateien
nicht verwechselt werden können. Die erzeugten Dateien werden mit eingecheckt.

### Build
- **Ein Bündel statt 26 Einzeldateien**: `app.js` (~443 kB ungepackt,
  esbuild), Verwaltung separat als `admin.js`.
- **Tailwind zur Buildzeit** statt Play-CDN: ~74 kB erzeugtes CSS mit genau den
  verwendeten Klassen.
- **Echte Versionierung**: `?v=` kommt aus der Datei `Version`, nicht aus
  `Date.now()`. Damit greift der Browser-Cache wieder.
- **Reproduzierbar** und mit `--check` ohne Schreiben ausführbar (für CI).
- **CI vorhanden**: `.github/workflows/pipboy-verify.yml` baut bei Änderungen an
  `PipBoy3000/` oder `arcade/`, fährt die 31 Tests, prüft, dass der eingecheckte
  Build zum Quellstand passt, und ruft den Portal-Test des Dashboards auf.

### Überschreibungen sind jetzt eine Entscheidung, kein Zufall
`build.mjs` sammelt alle Doppel-Definitionen und **bricht den Build ab**, wenn
eine nicht in `entries.mjs` unter `KNOWN_OVERRIDES` begründet ist. Nach dem
Umbau sind es noch fünf bewusste Einträge; Ziel ist eine leere Liste.

### Tests
`npm test` prüft in jsdom gegen das **gebaute Bündel**, nicht gegen die Quellen.
Damit ist ein Build, der das Spiel kaputt macht, ein Testergebnis und nicht erst
ein Fund im Browser:

- `tests/bundle.test.mjs` — lädt `app.js`, prüft Datenkataloge, Kernfunktionen
  und dass sich ein Spielstand anlegen lässt.
- `tests/data-integrity.test.mjs` — zehn Regressionstests, je einer pro Befund
  aus Abschnitt 3 (plus Rezept- und Template-Vollständigkeit).
- `tests/page-boot.test.mjs` — führt die ausgelieferte `index.html` in jsdom aus
  und prüft die Boot-Sequenz bis „SYSTEM READY", die Versionsanzeige und die
  Template-Pfade. Dieser Test hat zwei echte Build-Fehler gefunden: eine
  abgeschnittene Ladekette (Syntaxfehler) und ein fehlendes `scriptsLoaded`,
  das die Boot-Sequenz dauerhaft warten ließ.
- `tests/repo-hygiene.test.mjs` — keine `.old`-Leichen, keine unerreichten
  Dateien in `src/`, begründete Überschreibungen, einheitlicher Versionsstempel.

### Behobene Befunde
Eine Nachlese nach dem Umbau steht in [BEFUNDE.md](BEFUNDE.md) — inklusive
eines Fehlers, den der Umbau selbst verursacht hat (Handbuch/Changelog 404).

B1–B8 behoben und durch Tests abgesichert. B9 und B10 sind bewusst offen: beide
sind Balancing- bzw. Datenpflege-Themen ohne Absturzfolge, und B9 braucht eine
Design-Entscheidung (welche Waffe verbraucht wie viel).

---

## 5. Was noch offen ist

| Punkt | Warum noch offen |
|---|---|
| **Munitionsverbrauch** (B9) | Braucht `ammoType`/`ammoCost` an den Fernkampfwaffen — eine Design-Entscheidung, keine Reparatur. |
| **Monsterdaten zusammenführen** (B10) | `data_monsters.js` sollte `Object.assign` nutzen wie die übrigen Datenmodule. Kleiner Eingriff, eigener Schritt. |
| **Firebase v9/v10 modular** | Der Umbau auf ES-Module ist die Voraussetzung; jetzt möglich, aber ein eigener Schritt mit eigenem Test (Auth-Fluss). |
| **Admin-Anmeldung** | `src/admin.js` enthält Klartext-Zugangsdaten. Auf GitHub Pages sind sie öffentlich abrufbar. Das muss raus aus dem Client — Firebase-Admin-Claim oder Cloud Function. **Dringendster offener Punkt.** |
| **Splitter-Duplikate** | `MiniGames.init`/`.end` gibt es absichtlich je Spielart; das ist kein Fehler, aber beim Modularisieren prüfen. |
| **`templates/radio.html`** | Hängt an einem `btn-radio`, den es in `index.html` nicht gibt. Entweder Button zurück oder Template löschen. |
| **Speichergröße** | `explored` wächst pro erkundetem Sektor um ~45 kB im Spielstand. Bei 10 Sektoren ~450 kB pro Speicherung. Kompaktere Ablage (Bitmap) wäre sinnvoll. |

---

## 6. Korrekturen an einem früheren Analysebericht

Vier Aussagen aus dem ersten Durchgang waren falsch. Sie stehen hier, weil sie
sonst als Tatsachen weitergetragen würden:

| Behauptung | Tatsächlich |
|---|---|
| „`Game.addItem` existiert nicht" | Existiert als Alias am Ende von `game_inv_logic.js`. Das Problem war nicht das Fehlen, sondern der **Zeitpunkt**: der Alias entstand erst nach dem Aufruf. |
| „`plastic` und `junk` sind nicht definiert" | `plastic` steht in `data_core.js`. Und `junk` ist dort ein **Typ**, keine ID — `data_core.js` definiert Items mit `type: "junk"`. |
| „Rezept-Outputs ohne Item-Definition: keine" | Falsch geprüft: `craft_ammo` erzeugt `'AMMO'` (Großschreibung), das `craftItem` als Sonderfall behandelt. |
| „Monster-Drops ohne Definition: sieben" | Die Liste war zu grob: `caps` ist Währung, keine Item-ID, und wird von `safeGiveItem` gesondert verbucht. Korrekt sind sechs IDs (B4). |

Die Lehre daraus: eine Textsuche über Quelldateien ist kein Beweis. Alle
verbliebenen Befunde wurden gegen das **tatsächlich geladene Bündel** in jsdom
geprüft, nicht gegen einzelne Dateien.
