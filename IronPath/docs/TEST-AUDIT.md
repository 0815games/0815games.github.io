# Test-Audit — sind 152 Dateien / 453 Tests noch angemessen?

Stand der Analyse: `main` @ `174c285` · alle Zahlen hier gemessen, nicht geschätzt.
Umgesetzt in den Commits `6430285`, `ba60d11`, `35f1006` · **Ergebnis: 141 Dateien / 448 Tests.**

Reproduzieren: `node --test IronPath/tests/*.test.mjs`

---

## 1. Kurzfassung

**Die Menge ist nicht das Problem — die Form ist es.**

- Es gibt **keine echte Doppelung**: 0 Testrümpfe mit Jaccard > 0,75, 373 `test()`-Titel, davon **kein einziger doppelt**, nur 6 assertete Strings, die wortgleich in zwei
  Dateien stehen.
- **Laufzeit ist kein Argument**: die komplette Suite läuft in **15,4 s**, kein Einzeltest über 2,7 s.
- **Aber**: 3 Testdateien (7 Ergebnisse) prüfen Module, die **kein Bildschirm mehr lädt** — das ist
  toter Ballast. Dazu kommt eine strukturelle Schwäche: **60 von 152 Dateien** haben gar keine
  `test()`-Umhüllung und melden sich im Fehlerfall nur als eine Zeile „Datei rot".

Empfehlung in einem Satz: **7 Ergebnisse löschen (Müll), ~12 Dateien zusammenlegen (Ordnung),
3 fehlende Zusicherungen ergänzen (echte Lücke) — und die 17 Cache-Token-Pins entschärfen, weil sie
jedes Release unnötig rot machen.**

---

## 2. Wie ich geprüft habe (drei unabhängige Messungen)

| Messung | Ergebnis |
|---|---|
| **Struktur** – Duplikate über Titel, Testrümpfe, assertete Strings, Import-Abdeckung | keine Kopien gefunden |
| **Mutationstests** – 28 gezielte Sabotagen in Produktionscode, jedes Mal die ganze Suite laufen lassen | 25 wurden gefangen, **3 nicht** |
| **Erreichbarkeit** – Importgraph ab `index.html` | 4 Module werden von niemandem geladen |

Mutationstests sind der harte Test: sie zeigen, ob ein Test einen Fehler *bemerkt*, nicht ob er
hübsch aussieht. Beispiele, die gefangen wurden:

| Sabotage | rote Dateien |
|---|---|
| Simulationstakt 1/30 → 1/31 | 4–6 |
| XP-Kurve 300 → 310 | 10 |
| `WAVE_COUNT` um 1 verringert | 6 |
| Turm-Upgrade-Sockel 450 → 460 | 2 |
| Volumen-Clamp 1 → 2 | 1 |
| `#languageGate` umbenannt | 3 |
| Cache-Token in `index.html` gebumpt | 2 |
| CSS-Breakpoint 520px entfernt | 2 |
| Logo-Header-Regel gelöscht | 1 |

---

## 3. Befund A — Tests für Code, den niemand lädt (löschen)

Der Importgraph ab `index.html` erreicht 133 Module. Vier werden von keiner Seite geladen:

| Modul | Zeilen | Testdateien | Ergebnisse | Urteil |
|---|---|---|---|---|
| `drag-tree.mjs` | 71 | `controls-stage1`, `tree-zoom` | 2 | **löschen** — Pan/Zoom am Skill-Baum gibt es nicht mehr; `--tree-size`/`--tree-zoom` stehen nur noch als CSS-Fallbacks herum |
| `workshop-economy.mjs` | 55 | `workshop-economy` | 5 | **löschen** — wird nur in einem *Kommentar* in `workshop-model.mjs` erwähnt, nie importiert |
| `workshop-server-account.mjs` | 34 | `workshop-server-account` | 4 | **behalten** — bewusst ungenutzter Dienst-Adapter (ID-Token, kein unsicherer Fallback); als Sicherheitsvertrag dokumentiert |
| `workshop-service-config.mjs` | 4 | — | 0 | kein Test, kein Aufrufer: bewusst „absichtlich unkonfiguriert", als Kommentar zu klein zum Löschen |

**Löschkandidat: 3 Dateien, 7 Ergebnisse (453 → 446).** `workshop-economy` ist der klare Fall
(Modul ohne Aufrufer), `drag-tree` der zweitklarste (Feature entfernt, Modul + 2 Testdateien + ~10
CSS-Zeilen blieben liegen).

---

## 4. Befund B — 63 Dateien melden sich nur als „Datei rot" (zusammenlegen / umhüllen)

- 60 von 152 Dateien haben **keine** `test()`-Umhüllung und erscheinen im TAP-Bericht als genau
  eine Zeile; 16 weitere haben genau einen `test()` und damit nur einen Fall. Fällt in so einer Datei der erste `assert` um, ist der Rest des Wissens
  unsichtbar — man sieht nur „Datei X rot" und muss selbst herausfinden, wie viel noch kaputt ist.
- 84 Dateien sind **kürzer als 25 Zeilen**, Median 23 Zeilen. Sehr viel Datei für sehr wenig Inhalt.

Das ist der Grund, warum die Suite *gefühlt* größer ist als sie ist: 152 Dateien lesen sich wie 152
Themen, tatsächlich sind es ~40 Themen, nur kleingeschnitten.

**Zusammenlegen ohne einen einzigen verlorenen `assert`** (Kandidaten aus dem Abdeckungs-Overlap):

| Zusammenlegen | Dateien | die dabei bleiben |
|---|---|---|
| Waffenkammer | `armory` + `expanded-armory` | 17 asserts |
| Skills | `skills` + `expanded-skills` | 40 asserts |
| Gelände | `terrain` + `terrain-expanded` | ~30 asserts |
| Partei-Host | `party-host` + `wave-approval` | 47 asserts |
| Werkstatt-Buchhaltung | `workshop-model` + `workshop-transactions` + `workshop-rewards` | 24 asserts |
| Vier-Spieler-Transport | `four-lobby` + `four-transport` + `four-motion` | 27 asserts |

152 → ~140 Dateien, 453 Tests unverändert. Für die 10 größten „nackten" Dateien (u. a. `coop-ui`
112 Z./54 asserts, `solo-smoke` 103 Z.) lohnt zusätzlich eine `test()`-Umhüllung — rein mechanisch,
aber danach sagt ein Fehlschlag *welcher* Fall gebrochen ist.

---

## 5. Befund C — die einzige echte Lücke (ergänzen, nicht streichen)

Drei Sabotagen liefen **komplett grün durch die ganze Suite**:

| Sabotage | was kaputt wäre | Fix |
|---|---|---|
| `TOWER_COSTS[3]` 75 → 76 | Sniper-Preis weicht ab, nur `[0]` ist gepinnt | 1 assert in `match.test.mjs`: alle vier Kosten |
| `DEFAULT_BUILD` → `…;engineer` | jeder Neueinsteiger startet mit der falschen Grundausbildung | 1 assert in `skills.test.mjs` |
| `FIRST_RUN_DEFEAT_XP` 330 → 331 | Trost-XP nach verlorener erster Runde (Spielerökonomie!) | 1 assert in `training-run.test.mjs` |

Das sind ~3 Zeilen. Sie schließen die einzigen Löcher, die die Mutationstests gefunden haben — und
es ist bezeichnend, dass ausgerechnet eine **Belohnungszahl** ungeprüft ist, obwohl die Suite sonst
jede Wellen- und XP-Formel doppelt und dreifach prüft.

---

## 6. Befund D — die Cache-Token-Pins (der eigentliche Wartungszoll)

9 Dateien pinnen den Cache-Token wörtlich, 11 Vorkommen insgesamt:

```
assert.match(html, /account\.js\?v=20261118-settings1/);
```

Jedes Release muss diese Literale von Hand mitziehen. Ich habe das in den letzten beiden Runden
selbst zweimal getroffen (PR #169: zwei Testdateien rot, nur wegen des Tokens). Der Token selbst
wird dadurch **nicht** sicherer geprüft — dass die Module wirklich laden, beweist der Browser-Job.

**Vorschlag**, überall `\?v=[\w-]+` statt des Literals: gleiche Absicht („es *gibt* einen Token"),
null Release-Arbeit. Betrifft `alpha-party-flag`, `four-panel`, `intro`, `language-gate`, `logo`,
`settings`, `story-map-art`, `tutorial`, `workshop-alpha-wiring`.

---

## 7. Befund E — CSS/HTML-Regex-Tests vs. Browser-Job

14 Dateien testen ausschließlich Quelltext per Regex, ohne ein Modul zu importieren. Sieben davon
sind reine CSS-/HTML-/JSON-Pins: `presentation`, `command-redesign`, `touch-layout`, `logo`,
`interface-redesign` sowie die drei Rules-Diffs (`online-rules-composition`,
`story-rules-composition`, `friend-stats-rules-diff`) — die sind wertvoll, weil sie beweisen, dass
eine neue Rules-Datei die vorherige *exakt* erhält statt sie zu überschreiben.

Sie funktionieren (siehe Mutationstabelle) — aber sie prüfen **Schreibweise, nicht Geometrie**, und
der Job `interface-browser-smoke` misst dieselben Dinge bereits am echten Chromium bei 390×844 und
Desktop. Beispiel: `touch-layout` pinnt `touch-action: manipulation;` als Text — der Browser-Job
prüft, dass die Flächen wirklich bedienbar sind. Und ein Teil davon ist bereits durch den
Browser-Job abgedeckt (z. B. die 520px-Breakpoints, die zwei Node-Tests rot machten: der
Browser-Job hätte sie als Layoutfehler gezeigt).

**Urteil: nicht löschen, aber nicht ausbauen.** `dom-contract` ist die Ausnahme und der stärkste
Test der Gruppe — es fängt `$('id')`-Tippfehler über `game.js` und `account.js` hinweg für 13 Zeilen
Code. Das darf nicht kleiner werden.

---

## 8. Konkreter Vorschlag

| Schritt | Wirkung | Risiko |
|---|---|---|
| 1. 3 Dateien löschen (`controls-stage1`, `tree-zoom`, `workshop-economy`) | −3 Dateien, −7 Ergebnisse | keins: kein Aufrufer im UI |
| 2. 6 Paare/Gruppen zusammenlegen (§4) | −12 Dateien, 453 Tests bleiben | keins: nur Dateigrenzen |
| 3. 3 asserts ergänzen (§5) | +3 asserts, 0 neue Dateien | keins |
| 4. Cache-Token-Pins auf Muster umstellen (§6) | 11 Stellen, 0 Release-Arbeit künftig | keins |
| 5. `test()`-Umhüllung für die 10 größten nackten Dateien | Fehlermeldungen werden lesbar | mechanisch, 1 Commit |

Ergebnis: **~137 Dateien statt 152, 446 statt 453 Ergebnisse, gleiche Abdeckung, besserer Bericht.**
Ich würde 1–4 in *einem* Commit machen und 5 getrennt, damit der Diff prüfbar bleibt.

## 9. Was ich bewusst nicht angefasst habe

- Den Browser-Job (`interface-smoke.cjs`, `command-center.cjs`, 708 Zeilen) — der ist teuer, aber er
  ist die einzige echte Layout-Absicherung; die Node-Tests können ihn nicht ersetzen.
- `server/test/*.mjs` (282 Zeilen, eigener CI-Schritt) und `stress-tests/`.
- Die offenen Produktpunkte (vier Klassenbeschreibungen nirgends sichtbar, fünf Pfade vs. „four
  paths" im Text) — das sind Feature-Lücken, keine Testfragen.

---

## 10. Was davon umgesetzt ist

| Schritt | Zustand | Ergebnis |
|---|---|---|
| 1. Tote Tests löschen | **erledigt** | `controls-stage1` (die beiden `confirmation`-Fälle wanderten vorher nach `confirmation-race`), `tree-zoom`, `workshop-economy` gelöscht, dazu die Module `drag-tree.mjs` und `workshop-economy.mjs` |
| 2. Gruppen zusammenlegen | **erledigt** | 6 Gruppen, 152 → 141 Dateien, alle 385 Assertions erhalten |
| 3. Drei Zusicherungen ergänzen | **erledigt** | `TOWER_COSTS`, `DEFAULT_BUILD`, `FIRST_RUN_DEFEAT_XP` — jede durch die Mutation geprüft, die sie gefunden hat |
| 4. Cache-Token-Pins | **erledigt** | Assertions prüfen das Muster statt des Werts (Token fehlt → rot, Token gebumpt → grün); die 4 Test-Importe leiten den Token über `tests/production-module.mjs` aus `game.js` ab |
| 5. `test()`-Umhüllung | **erledigt für die 10 größten** | 60 nackte Dateien → 52; die zusammengelegten Dateien melden je Herkunftsteil ein Ergebnis, deshalb **448** Tests statt 441 |

**Was beim Umsetzen beinahe schiefging** (steht hier, weil es für den nächsten Umbau zählt):

1. Ein naiver Umbenenner hat `p('a', …)` in `p('expandedA', …)` verwandelt — er traf
   String-Literale. Gelöst ohne jeden Rename: jeder Herkunftsteil bekommt einen eigenen
   Blockscope, damit kollidiert nichts.
2. `git checkout -- <datei>` nahm eine **noch nicht committete** Zusicherung (`DEFAULT_BUILD`)
   mit, als eine fehlgeschlagene Umhüllung zurückgesetzt werden musste. Aufgefallen ist das nur,
   weil die Mutation danach erneut lief — nicht am Diff.
3. Die 4 Token-Importe sind **nicht** kosmetisch: `language.mjs` hält die aktive Sprache, ein
   eigener Token hätte eine unkonfigurierte Kopie erzeugt. Deshalb Ableitung statt Marker.

**Bewusst offen gelassen:** die 52 noch nackten Dateien (klein genug, dass es jetzt Aufwand ohne
Gewinn wäre), der Browser-Job, `server/test/*.mjs` und `stress-tests/`.
