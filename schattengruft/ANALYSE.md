# Analyse: Chroniken der Schattengruft

**Stand:** 2026-11-26 · **Analysierter Commit:** `f8a2ee0` (Branch `arena/42e2489c-0815games-github-io`, Basis `main`)
**Umfang:** Code- und Strukturanalyse. Es wurden **keine** Dateien im Spiel geändert.

> **Statusnachtrag:** Der in §4 beschriebene Ausfall ist behoben (drei Pfade in `index.html`
> zurück auf `js/…`), `keyboard-controls.mjs` ist korrigiert und zwei Regressionsschutz-Suiten
> (`html-assets.mjs`, `boot-smoke.mjs`) plus ein CI-Workflow sind ergänzt. Ergebnis: 21/21 Suiten grün.
> Die Befunde in §5–§7 bleiben unverändert gültig.

---

## 1. Kurzfazit

Das Spiel ist konzeptionell und im Code weit fortgeschritten (v0.10.2, 99 JS-Module, 19 Test-Suiten),
aber **die aktuell unter `https://0815games.github.io/schattengruft/` ausgelieferte Version startet nicht**.

`index.html` verweist auf `game/js/…`, dort liegt aber nur der alte v0.0.5-Prototyp. Die echte
v0.10.2-Engine (`js/main.js`) wird überhaupt nicht geladen. Zwei der drei referenzierten Dateien
existieren nicht (404), die dritte bricht beim Boot mit einer `TypeError` ab. Sichtbare Folge:
Der Intro-Screen erscheint (reines HTML/CSS), aber Klick/Enter tun nichts – der Spieler kommt nie
zum Login.

Das ist ein Regression aus dem Ordner-Refactoring vom **2026-10-29** und mit hoher Wahrscheinlichkeit
der Grund, warum seitdem niemand mehr etwas an `schattengruft/` committet hat.

| Kennzahl | Wert |
|---|---|
| Dateien / Größe | 132 / 1,1 MB |
| JS-Module | 99 (davon 82 in `js/`, 16 in `game/js/`) |
| Codezeilen `js/` | 7.282 |
| Codezeilen `game/js/` (Legacy) | 1.721 |
| CSS | 8 Dateien, 445 Zeilen |
| Tests | 19 Suiten, 1.195 Assertions, **18 grün / 1 rot** |
| `index.html` | 219 Zeilen, 76 Element-IDs |
| `change.log` | 100 KB, 103 Abschnitte |
| Version | 0.10.2 (an 6 Stellen manuell gepflegt) |

---

## 2. Was das Spiel ist

Ein Dark-Fantasy-Roguelite-Dungeon-Crawler im Browser, komplett ohne Build-Schritt (native ES-Module).

**Ablauf:** Intro → Firebase-Login → 4 Cloud-Speicherplätze → Klasse + Name wählen →
prozedurale Katakomben erkunden → rundenbasierter Kampf → Ebene tiefer → bei Tod Run-Verlust mit
Gold-Transfer ins Meta-Konto → Vorbereitungs-Shop → nächster Run.

**Inhalt im Code:**

- **3 Klassen:** Eisenbrecher (75 TP/15 MP/9 ATK/4 DEF), Arkanist (50/50/6/1), Schattenläufer (60/25/8/2)
- **9 Klassenfähigkeiten** (3 je Klasse) mit Mana- und Cooldown-Kosten, Buffs (`shield`, `block`, `evade`), DoT
- **12 Skilltree-Knoten** in 3 Zweigen (Krieg/Arkan/Schatten) mit Rang-Voraussetzungen
- **5 Welt-Themen:** Katakomben, Pilzwald, Frostgruft, Feuerschrein, Schattenarena
- **Prozedurale Karten:** 36–46 × 28–32 Felder, seeded (`mulberry32`), 12–17 Räume, Korridore, 3–5 Truhen
- **Gegner-Skalierung:** +24 % TP / +18 % ATK pro Ebene, EP +12 %, Gold +8 %; Boss alle 5 Ebenen,
  Elite-Roll 30 % ab Ebene 3; Treppe erst nach Clear
- **Inventar:** 15 Slots, Stacking, 6 Ausrüstungsplätze, Tränke, Rüstkammer, Ausrüstungsvergleich
- **Bossbeute:** 3 Wahloptionen, persistent mit `bossLoot`-Receipt und Retry-Pfad
- **Meta:** Ordensgold-Shop, Rangliste (Top 50 nach `bestDepth`), Tutorial, Audio (prozedural via WebAudio)
- **Grafik:** 2D-Canvas als Standard, optionales Three.js-3D (`?view=3d` oder Schalter), Phasen 1–4 umgesetzt
- **Steuerung:** WASD/Pfeile, Enter/Leertaste, 1–5 im Kampf, Q/E/R für Fähigkeiten, I/C/K/L/P;
  mobil Tippen/Wischen und Halte-Bewegung

**Reifegrad:** Die Spielmechanik ist erkennbar ausgereift und ungewöhnlich sorgfältig abgesichert
(siehe §6: Save-Migration, Run-Idempotenz, Session-Lock). Der schwache Punkt ist nicht das Spiel,
sondern die Verkabelung und die Prozessdisziplin drumherum.

---

## 3. Architektur – und das Kernproblem: zwei Bäume

Im Ordner liegen zwei parallele JavaScript-Bäume mit gleicher Struktur, aber völlig verschiedenem Stand:

```
schattengruft/
├── index.html            ← lädt aktuell game/js/…  ❌
├── js/                   ← echte v0.10.2-Engine (82 Module, 605 KB)
│   ├── main.js           (40 KB, 321 Zeilen)  ← wird NICHT geladen
│   ├── core/{state,version}.js
│   ├── data/{items,monsters}.js
│   ├── systems/          (61 Module)
│   ├── world/{map,render,dungeon-world,character,monster,world3d-*}.js
│   └── ui/uiManager.js
└── game/js/              ← alter v0.0.5-Prototyp (16 Module, 88 KB)  ← wird geladen
    ├── main.js           (3,4 KB, 85 Zeilen, EventBus-Bootstrap)
    └── core|data|systems|ui|world/  (nur 16 Dateien, alle mit „v0.0.5“ markiert)
```

### Was ist passiert

| Commit | Datum | Wirkung |
|---|---|---|
| `d838c6beb` | 2026-10-27 | Letzter bekannter guter Stand: `rpg/index.html` → `js/main.js` (v0.10.2) |
| `bcd78915d` | 2026-10-29 11:05 | `rpg/` → `schattengruft/` umbenannt. `index.html` bleibt korrekt auf `js/…` |
| `53b963a35` | 2026-10-29 11:07 | **Root-`js/`** (der alte v0.0.5-Prototyp) nach `schattengruft/game/js/` verschoben |
| `2d224664f` | 2026-10-29 11:13 | **`schattengruft/index.html`: `js/…` → `game/js/…` umgeschrieben** ← Bruch |

Die Commit-Meldung von `53b963a35` lautet „move shared js folder into game“ – gemeint war der
Root-Ordner `js/`, der in Wahrheit der v0.0.5-Prototyp war. Der Folge-Commit `2d224664f` hat dann
in `schattengruft/index.html` blind die Zeichenfolge `js/` durch `game/js/` ersetzt und damit die
Verbindung zur echten Engine gekappt.

Verifiziert gegen GitHub: `schattengruft/game/js/` existiert vor dem 2026-10-29 nicht, `rpg/js/main.js`
hat bereits am 2026-10-27 exakt 40.272 Bytes (identisch mit dem heutigen `schattengruft/js/main.js`).

---

## 4. Der Blocker im Detail

### 4.1 Ist-Zustand in `index.html`

```html
5:    <script src="game/js/startup-diagnostics.js?rev=1"></script>          <!-- 404 -->
216:  <script type="module" src="game/js/main.js?v=0.10.2"></script>        <!-- v0.0.5 -->
217:  <script type="module" src="game/js/systems/mobile.js?v=0.10.2"></script> <!-- 404 -->
```

### 4.2 Beweiskette

1. **Pfadprüfung gegen das Dateisystem** (Skript über `index.html`-Attribute):
   `game/js/startup-diagnostics.js` → fehlt, `game/js/systems/mobile.js` → fehlt,
   `game/js/main.js` → vorhanden. Alle 9 CSS-Dateien und `favicon.ico` sind vorhanden.
2. **Live-Gegenprobe:** `…/game/js/startup-diagnostics.js` und `…/game/js/systems/mobile.js` liefern
   auf GitHub Pages tatsächlich keinen Inhalt (Fetch-Fehler), `…/js/systems/mobile.js` liefert 200.
3. **Live-Gegenprobe Bootstrap:** `…/game/js/main.js` liefert live die 85-Zeilen-Datei mit Kopfzeile
   `// [2026-10-12 13:30] - js/main.js: v0.0.5 Spiel-Bootstrap mit IntroFlow`.
4. **DOM-Abgleich:** Der v0.0.5-Code holt 50 Element-IDs per `getElementById`. **Alle 50 fehlen** im
   aktuellen `index.html` (`boot-screen`, `title-screen`, `char-select-screen`, `game-app`, `act-attack`,
   `inventory-grid`, `stat-name`, `shop-box`, `combat-box`, `dpad-up` …).
5. **Nachgestellter Boot** (Node + DOM-Stub mit dem echten ID-Satz aus `index.html`):
   ```
   game/js/main.js ABBRUCH → TypeError: Cannot read properties of null (reading 'addEventListener')
   erste fehlende DOM-ID: act-attack
   ```
   Ausgelöst in `UIManager` → `initCombatEvents()`; `IntroFlow` wird danach nie erreicht.
6. **Wirkung im Browser:** Der Intro-Screen ist statisches HTML/CSS und bleibt sichtbar
   (`#intro-screen`, `z-index:60`, `fixed`). Der Fortschrittsbalken bleibt jedoch auf 0, weil
   `#intro-screen`-Klick, Enter-Handler, Intro-Timer, Login-Verdrahtung und Renderer **alle** in
   `js/main.js` liegen. Der Nutzer sieht ein hübsches Titelbild und kommt nicht weiter.
   Auch der Service Worker wird nicht registriert (steht ebenfalls in `js/main.js`).

> Wichtig für die Einordnung: Ein reiner HTML-Abruf der Seite sieht „in Ordnung“ aus – genau das macht
> den Fehler so leicht übersehbar. Der Ausfall zeigt sich erst beim Klick.

### 4.3 Fix (3 Zeilen, Rücksprung auf den letzten guten Stand)

```diff
--- a/schattengruft/index.html
+++ b/schattengruft/index.html
@@ -2,7 +2,7 @@
 <html lang="de" data-rpg-build="0.10.2">
 <head>
   <meta charset="UTF-8">
-  <script src="game/js/startup-diagnostics.js?rev=1"></script>
+  <script src="js/startup-diagnostics.js?rev=1"></script>
@@ -213,8 +213,8 @@
-  <script type="module" src="game/js/main.js?v=0.10.2"></script>
-  <script type="module" src="game/js/systems/mobile.js?v=0.10.2"></script>
+  <script type="module" src="js/main.js?v=0.10.2"></script>
+  <script type="module" src="js/systems/mobile.js?v=0.10.2"></script>
```

Das entspricht exakt dem Zustand von `d838c6beb` (v0.10.2-Release). Alle 68 IDs, die `js/main.js`
per `el(...)` anspricht, sind abgedeckt: 61 stehen direkt im HTML, `combat-buttons` wird von
`preparation-shop.js` aus der Klasse `.combat-buttons` zur ID befördert, `ability-bar` und
`levelup-choice-style` werden zur Laufzeit erzeugt, `music-volume*`/`sfx-volume*` sind
`if`-abgesichert (die Slider liegen im Audio-Dialog von `audio-settings.js`).

Nach dem Fix ist `game/js/` vollständig toter Code (16 Module, 88 KB) und kann entfernt werden –
das sollte aber ein eigener, separat geprüfter Schritt sein.

---

## 5. Weitere Befunde nach Schwere

### P1 – sollte vor dem nächsten Release behoben werden

**a) Kein Test prüft die Verkabelung von `index.html`.**
Alle 19 Suiten testen Module isoliert; keine einzige liest `index.html` und prüft, ob die
`src`/`href`-Pfade existieren. Genau dieser Smoke-Test hätte den Totalausfall verhindert.
→ Empfehlung: `tests/html-assets.mjs`, ~30 Zeilen, prüft jedes lokale `src`/`href` und die
Modul-Erreichbarkeit ab `index.html`.

**b) Toter Code in großem Umfang: 27 von 99 Modulen sind von keinem Einstiegspunkt erreichbar.**
- 16 Module in `game/js/` (v0.0.5-Prototyp, siehe §4)
- 11 Module in `js/`: `core/eventBus.js`, `core/input.js`, `data/quests.js`, `systems/combat.js`,
  `systems/quest.js`, `systems/shop.js`, `systems/storage.js`, `systems/run.js`,
  `systems/living-world.js`, `ui/introFlow.js`, `ui/uiManager.js`

Das sind teils divergierte Kopien gleichnamiger Legacy-Dateien (z. B. `js/systems/storage.js` 84 Zeilen
vs. `game/js/systems/storage.js` 69 Zeilen). Gefahr: Wer beim Suchen die falsche Datei erwischt,
ändert Code, der nie läuft.

**c) `keyboard-controls.mjs` ist rot – der Test ist veraltet, nicht der Code.**
Beim Lauf: `18 pass / 1 fail`, Abbruch bei `tests/keyboard-controls.mjs:58`:
```
expected: 1   actual: undefined
```
Der Test erwartet `press('5')` → `mana`-Button. Die Tastenbelegung wurde aber am 2026-10-20
absichtlich geändert: `4` = Manatrank, `5` = Flucht (`js/systems/keyboard.js:58`, Hilfetext Zeile 13,
`change.log` oben). Der Test wurde nicht mitgezogen.
→ Fix: in `keyboard-controls.mjs` Z. 58–60 `'5'` → `'4'` (bzw. `'5'` → `flee`) und die Erwartung
auf `mana.hits`/`flee.hits` abstimmen.

### P2 – strukturelle Risiken

**d) Implizite Modul-Reihenfolge durch Monkey-Patching.**
Die Systeme hängen sich per Seiten-Effekt an globale Objekte, gesteuert allein durch die
Importreihenfolge in `js/core/version.js`:

| Methode | Wrapper in |
|---|---|
| `cloud.saveSlot` | `session-integration`, `preparation-shop`, `leaderboard`, `boss-loot` (4×) |
| `cloud.loadAllSlots` | `session-integration`, `leaderboard`, `character-ui`, `delete-dialog`, `world-list-compat` (5×) |
| `WorldMap.prototype.generate` | `enemy-balance`, `floor-progress`, `new-items`, `boss-loot` (4×) |
| `WorldMap.prototype.ensureValid` | `enemy-balance`, `floor-progress`, `world-list-compat` (3×) |
| `Renderer.prototype.text` | `combat-number-feedback`, `combat-reward-feedback`, `combat-status-feedback` (3×) |

Das funktioniert, ist aber extrem fragil: Eine Umsortierung in `version.js` oder ein zusätzlicher
Import verändert das Spielverhalten, ohne dass es irgendwo sichtbar wird. Kein Test prüft die
Kombination der Wrapper.

**e) Versionsnummer an 6 Stellen manuell gepflegt**, ohne Build-Schritt:
`data-rpg-build` (HTML), Versions-Badge im Intro, `VERSION_LABEL` in `core/version.js`,
`?v=0.10.2` an HTML-/CSS-Referenzen, `?v=0.10.2` an ~31 Imports, `CACHE='schattengruft-v0.10.2'`
im Service Worker. Einziger Trost: Alle stehen aktuell konsistent auf 0.10.2.

**f) Doku ist teilweise veraltet oder widersprüchlich**
- `to-do.md` nennt Stand v0.6.0 / 2026-10-20, die Umsetzung ist bei v0.10.2
- `change.log` ist **nicht chronologisch**: oben die Einträge vom 2026-10-20, dann absteigend bis
  v0.2.0 – und am Dateiende (nach „Pflegevorgabe und offene Prüfgrenzen“) nochmal v0.7.1 bis v0.10.2
- 13 echte `rpg/`-Pfade zeigen auf den alten Ordnernamen: `to-do.md` (2), `3D_PLAN.md` (2),
  `apply-combat-finish-abilities.yml` (4), `verify-combat-finish-sequence.yml` (5)
- `3D_PLAN.md` nennt als Online-Test `/rpg/?view=3d` → heute `/schattengruft/?view=3d`

**g) Zwei GitHub-Workflows sind wirkungslos.**
`apply-combat-finish-abilities.yml` und `verify-combat-finish-sequence.yml` patchen und committen
`rpg/…`-Pfade (existiert nicht mehr) und sind zusätzlich per
`if: github.repository == 'pipboy3003/pipboy3003.github.io'` auf ein fremdes Repository festgenagelt –
in `0815games/0815games.github.io` laufen sie nie. Sie können gelöscht werden.

### P3 – kleinere Beobachtungen

- **`createSaveSnapshot()`** wird exportiert, aber nirgends aufgerufen; der Speicherpfad schreibt
  weiterhin das volle `state`-Objekt. Entweder nutzen oder entfernen.
- **`isGuest`** existiert in `state.js` und der Laufzeit-Key-Liste, wird aber von keiner Logik
  verwendet – es gibt keinen Gast-Modus.
- **`living-world.js` und `run.js`** sind abgelöste Vorstufen (v0.8.0 bzw. LocalStorage-Meta) und
  unreachable; `run.js` würde sogar noch `localStorage` statt Firebase nutzen.
- **3D-Abhängigkeit zur Laufzeit:** `world3d-phase1.js:170` lädt
  `https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js` dynamisch, ohne SRI/Integritätsprüfung.
  Damit hängt der 3D-Modus an einem Fremd-CDN; offline und bei CDN-Ausfall bleibt nur 2D
  (immerhin sauber abgefangen: Fallback, `webglcontextlost`-Handler, „3D erneut testen“).
- **Service Worker** ist solide gebaut (network-first, Scope-Begrenzung, Cache-Versionierung,
  Aufräumen alter Caches, 503-Fallback). Er würde allerdings im Fehlerfall auch den kaputten
  Zustand cachen.
- **2D-Renderer** pausiert korrekt bei verstecktem Tab und drosselt über `worldFrameInterval()`.

---

## 6. Was positiv auffällt

Deutlich über dem Niveau typischer Hobby-Browser-Spiele:

- **Save-Schema mit Migration:** `SAVE_SCHEMA_VERSION = 1`, `normalizeSaveSlot()` validiert jeden
  geladenen Slot, setzt fehlende Welt-/Karten-/Truhenfelder auf Defaults, erzwingt
  `inCombat: false` / `activeMonster: null` und sperrt ungültige Slots mit Konsolenwarnung.
- **Run-Idempotenz:** `runId` + `deathReceipt` verhindern doppelte Todesverarbeitung und doppelten
  Gold-Transfer (`run-lifecycle.js`). Der Bossbeute-Flow nutzt dasselbe Muster inkl. Retry.
- **Session-Sperre:** Login schreibt per Transaktion in `dark_rpg/sessions/{uid}` mit
  `expiresAt` (120 s) und Server-Zeitoffset – verhindert paralleles Spielen in zwei Tabs/Geräten,
  inklusive „Sitzung pausiert“-Overlay und sauberer Freigabe beim Logout.
- **Konsequente Guard-Prüfungen:** Praktisch jede Aktion (Kauf, Ausrüsten, Treppe, Bossbeute,
  Löschen) prüft `state.player`-Identität, `uid`, `slot`, `runId` und Fensterzustand **nach** jedem
  `await` gegen veraltete Asynchronität. Das ist genau die Stelle, an der solche Spiele sonst
  Duplikate und Item-Duplikation produzieren.
- **Atomare Inventaroperationen:** `tryAddItem`/`tryRemoveItem` validieren den kompletten Stack
  inklusive `stackLimit` und arbeiten auf einer Kopie, bevor sie schreiben.
- **Barrierefreiheit:** ARIA-Kurzbefehle an den Kampfbuttons, Fokusmanagement in Dialogen,
  `:focus-visible`-Styles, Tastatur-Hilfedialog, Fokus-Rückgabe beim Schließen.
- **Reduzierte Bewegung** wird in 2D- und 3D-Pfad respektiert.

---

## 7. Sicherheit und Datenschutz

| Punkt | Bewertung |
|---|---|
| Firebase-Web-Config im Code | Normal für Firebase (keine Secrets). Projekt `rpg01-793eb`, RTDB `europe-west1`. |
| **Fehlende Security-Regeln im Repo** | **Offen.** Die App nutzt `dark_rpg/saves`, `dark_rpg/leaderboard`, `dark_rpg/sessions`, es liegt aber **keine** `database.rules.json` mehr im Repository (der Root-Eintrag wurde beim Aufräumen am 2026-10-29 entfernt). Regeln sind damit nicht auditierbar. |
| **HTML-Injection über Heldnamen** | **Vorhanden, niedrig.** `index.html` begrenzt per `maxlength="16"`, aber `renderSlots()` (`js/main.js:52`) setzt `${p.name}` per `innerHTML` ein, ohne Escaping. Ein manipulierter Spielstand (Konsole/RTDB) könnte Markup einschleusen. `hud()` nutzt korrekt `textContent`. |
| Auth | Firebase E-Mail/Passwort v8.10.1, `Persistence.NONE` (kein „angemeldet bleiben“), Fehlermeldungen sauber gemappt. |
| Passwort-Mindestlänge | 6 Zeichen (Firebase-Default, schwach, aber bewusst). |
| Service Worker / Offline-Cache | Nur same-origin, nur statische Endungen. Kein Fremdinhalt im Cache. |
| Drittanbieter | `gstatic.com` (Firebase-SDK), `cdn.jsdelivr.net` (Three.js, optional). |

Kein Hinweis auf hartkodierte Zugangsdaten, Tokens oder Admin-Endpunkte im Spielordner.

---

## 8. Tests und Prüfstand

```
node --test schattengruft/tests/*.mjs
→ 19 Suiten, 1.195 Assertions, 18 pass, 1 fail, ~1,0 s Laufzeit
```

**Stil:** Die Suiten laden echten Quelltext per `readFile` und führen ihn in `vm.runInNewContext`
mit DOM-/Canvas-/Zustands-Doubles aus (9 Suiten), oder sie prüfen Hilfsfunktionen direkt.
Mehrere Suiten dokumentieren ihre Grenze selbst im Output, z. B.
`"scope": "... No browser or Firebase test."`

**Abdeckung:** Kampfabschluss (Standard/Fähigkeiten/Sequenz), Inventar (S01a mit 1.027 Assertions,
Details, Rollenwahl), Layout (Rüstkammer, Kampf, Vorbereitung), Tränke, Spielphasen, Tastatur,
Weltgrafik 0.8.0 und 3D-Phasen 1–4.

**Lücken:**
- kein Test für `index.html`-Verkabelung (siehe §5a) ← hätte den Ausfall verhindert
- kein Test für das Zusammenspiel der Patch-Kette (§5d)
- kein Test für `save-migration`/`run-lifecycle` als eigene Suiten, obwohl das die kritischsten Pfade sind
- kein Test für Firebase-Regeln, keine Browser-/WebGL-/Geräte-Abnahme
- `package.json` hat **kein** `schattengruft`-Skript und **keine** CI-Anbindung; die Suiten laufen nur,
  wenn man sie von Hand aufruft. (Die Root-Skripte `test:suite` etc. gehören zu IronPath.)

---

## 9. Empfohlene Reihenfolge

**Sofort (Minuten, behebt den Ausfall)**
1. Drei Pfade in `schattengruft/index.html` zurück auf `js/…` (§4.3).
2. `node --test schattengruft/tests/*.mjs` laufen lassen; `keyboard-controls.mjs` Z. 58 auf `'4'`/`flee`
   korrigieren (Test war falsch, nicht der Code).
3. Seite hart neu laden (Service Worker umgehen) und Intro → Login → Slot → Spiel einmal durchklicken.

**Kurzfristig (Stunden)**
4. `tests/html-assets.mjs` ergänzen: jedes lokale `src`/`href` in `index.html` muss existieren,
   `js/main.js` und `js/systems/mobile.js` müssen erreichbar sein. In `package.json` ein Skript
   `"test:schattengruft": "node --test schattengruft/tests/*.mjs"` plus ein minimaler CI-Workflow,
   der bei Änderungen unter `schattengruft/**` läuft.
5. `index.html` um `Content-Security-Policy`-Meta oder – besser – `_headers`/CSP ergänzen und
   `${p.name}` in `renderSlots()` escapen (oder auf `textContent` umstellen).

**Mittelfristig (Tage)**
6. `schattengruft/game/js/` (16 Module) und die 11 unreachable Module in `js/` löschen – nach einem
   `grep`-Nachweis, dass nichts mehr darauf zeigt. Vorher im `change.log` dokumentieren.
7. Firebase-Regeln für `dark_rpg/**` ins Repo legen (`schattengruft/firebase/database.rules.json`)
   und dokumentieren: `saves/{uid}` nur für `auth.uid === uid`, `leaderboard` lesbar/„write-once“-artig,
   `sessions` transaktional.
8. `change.log` chronologisch ordnen (neueste zuerst), `to-do.md` auf v0.10.2 ziehen,
   alle 13 `rpg/`-Verweise auf `schattengruft/` umstellen, die zwei toten Workflows löschen.
9. Patch-Kette in `version.js` durch explizite Registrierung ersetzen (z. B. `installX()`-Aufrufe in
   definierter Reihenfolge) oder mindestens die Reihenfolge kommentieren und testen.
10. Version zentralisieren: nur `core/version.js` als Quelle, Rest generieren oder zur Laufzeit setzen.

---

## 10. Grenzen dieser Analyse

- **Keine echte Browser-/Geräteabnahme.** Es stand kein Headless-Browser zur Verfügung; der
  Boot-Abbruch wurde über einen Node-DOM-Stub mit dem echten ID-Satz aus `index.html` nachgestellt.
  Das ist ein starkes, aber kein pixelgenaues Abbild (Canvas/WebGL/Firebase nicht abgedeckt).
- **Die Live-Auslieferung** wurde per Abruf von `index.html`, `game/js/main.js`, `js/main.js`,
  `js/systems/mobile.js` geprüft (GitHub Pages baut aus `main`, Status `built`). `http/tls`-Direktabruf
  aus der Sandbox scheiterte an TLS; die Abrufe erfolgten über den Seiten-Fetcher.
- **Firebase-Verhalten** (Regeln, Auth-Domain-Freigaben, tatsächliche Lese-/Schreibrechte) ist
  ungeprüft – ohne Regeln im Repo auch nicht statisch prüfbar.
- **Keine Aussage zur Balance** (Kurven wirken plausibel: +24 % TP/+18 % ATK pro Ebene, EP +12 %,
  Gold +8 %, Boss alle 5 Ebenen). Ohne Spieltests ist das nicht bewertbar.
- Es wurden **keine Dateien des Spiels verändert**; dieses Dokument ist die einzige neue Datei.
