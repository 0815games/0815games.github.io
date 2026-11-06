# First run v3 — play first, brief during play, dress last

Der Patchplan für den Umbau des Ersteinstiegs. Jeder Punkt sagt, **warum** er
nötig ist, **welche Datei** er anfasst und **wann** er als fertig gilt.

Ziel in einem Satz: Ein neuer Soldat landet nach dem Login direkt auf einem
gerenderten Spielfeld, spielt Wellen 1–5 mit einer Erste-Hilfe-Karte, die das
Spiel **nicht** anhält, gewinnt am Boss seine Hundemarke, zieht die Ausrüstung an
und verteilt danach seinen Skillpunkt.

---

## 0. Warum das Tutorial auf dem Handy unspielbar war

Drei Ursachen, alle im Code nachweisbar:

| # | Ursache | Beweis |
| - | ------- | ------ |
| 1 | **Das Tutorial pausiert den Kampf.** | `game.js:442` — `update()` kehrt sofort zurück, solange `tutorial.isOpen()` wahr ist; `game.js:466` setzt `paused` genauso. Läuft das Tutorial *über* der Schlacht, steht das Feld still und kein Tipp erreicht es. |
| 2 | **Das Popup ist modal.** | `#tutorialDialog` ist ein `<dialog>` mit `showModal()` (`tutorial.mjs:57`). Ein modaler Dialog fängt **alle** Zeigerereignisse. Solange er offen ist, ist „Feld aufgebaut, aber man kann nichts machen" genau das erwartete Verhalten. |
| 3 | **Das Popup ist zu hoch für ein Telefon.** | `style.css:12`: Inhalt ohne `overflow` (gemessen: Szene ≈ 143 px + 4-zeiliger Text ≈ 84 px + Status + „Übung überspringen" + Aktionszeile + „Einweisung überspringen" ≈ **451 px + 40 px Rahmen**) gegen `max-height: calc(100dvh - 28px)` = 636 px bei 390 × 664. Mit Tastaturzeile sind es ~620 px: das Popup füllt den Bildschirm, die Karte darunter ist weg. unter 380 px Höhe passt es gar nicht mehr. |

Dazu zwei kleinere Fehler, die im selben Zug wegfallen:

* `game.js:517` — `startTrainingRun()` beginnt mit `if(activeTraining||trainingDone)return false;`.
  `trainingDone` ist kein „schon gesehen"-Merker, sondern das **Sieg-Flag der aktuellen Runde**.
  Wer im Debrief über `#menuEndless` weitergeht, setzt `activeTraining=false` und
  `trainingDone` bleibt `true` → **erneut deployen ist unmöglich**, bis der Bunker
  neu aufgebaut wird. Das erklärt „nichts ging mehr" nach dem Match.
* `style.css:12` (u. a.) — `max-height` ohne `overflow`. Überläuft der Inhalt,
  wird er abgeschnitten statt zu scrollen (Telefon im Querformat).

---

## 1. Reihenfolge des Ersteinstiegs (neu)

```
Login (erster Account-Kontakt)
   │  Sprache ist bereits gewählt (Gate bleibt unverändert, Schritt 0)
   ▼
① Spielfeld aufbauen: Training-Vertrag, Wellen 1–5, Karte gerendert,
   Erste-Hilfe-Karte unten eingeblendet (NICHT modal, pausiert NICHT)
   ▼
② „Willkommen, Soldat" — erste Karte, sobald gerendert (Schritt 3)
   ▼
③ Der Spieler spielt selbst: bauen, upgrade, Held bewegen, Deploy, Welle 1 … 5
   (Karten begleiten die echte Aktion, keine Klickfolge über Screenshots)
   ▼
④ Boss-Welle 5 fällt → Hundemarke wird verliehen (Popup, das den Lauf beendet)
   ▼
⑤ Ausrüstung aus dem Boss-Kill anziehen (echter Armory-Dialog, echte Daten)
   ▼
⑥ Skillpunkt verteilen (echter Skills-Dialog, gespeichert, bleibt aktiv)
   ▼
⑦ Feldschule + Debrief: „wo geht es weiter"
```

Abweichungen zu heute: Punkte ③④⑤ sind neu beziehungsweise umgestellt
(Skills **nach** Ausrüstung), und der Lauf endet bei **Welle 5** statt 6.

---

## 2. Patch 1 — Der Lauf endet nach dem Boss von Welle 5, und zwar spielbar

**Warum:** Der Nutzer will „Wellen 1–5, nach dem Boss gibt es das erste Item".
Heute sind es 6 Wellen mit Boss in Welle 5; Welle 6 wird nur gespielt, damit die
330 XP für Level 2 zusammenkommen.

**Was:**

* `training-run.mjs`
  * `TRAINING_WAVES = 5` (Boss ist Welle 5, `bossForWave` gibt bei `wave%5===0` den Boss).
  * `trainingWon(state)` → `state.wave >= 5` **und** kein lebender Boss/keine lebenden
    Gegner mehr, statt „Welle 5 gezählt". Sonst endet der Lauf, während der Boss
    noch läuft.
  * `TRAINING_XP_BONUS`: die Differenz auf **genau 300 XP** (Level 2), damit der
    Skillpunkt auch mit 5 Wellen fällt. Rechnerisch 250 → Bonus 50. Der Bonus wird
    als eigene Zeile im Debrief ausgewiesen („Auftragsbonus"), nicht als stille
    Rundung.
* `game.js`
  * `startTrainingRun()`-Guard: `trainingDone` → `trainingDismissed` (nur für die
    laufende Runde) und bei `reset()` zurückgesetzt. Kein toter Deploy-Knopf mehr.
  * Beim Sieg: `endReason='training-complete'` erst **nach** dem Boss-Kill, nicht
    beim Betreten der Welle — das ist heute die Ursache dafür, dass die Runde
    gelegentlich mitten im Boss endet.
  * `trainingStatus()` zeigt ehrlich „Welle {n} / 5 · Boss" statt „5 / 6".

**Fertig wenn:** ein Headless-Lauf (wie `tests/…`-Simulation, Level 1) nach dem
Boss von Welle 5 `endReason==='training-complete'` hat, `trainingXP()===300`, und
`startTrainingRun()` nach dem Debrief ein zweites Mal `true` liefert.

---

## 3. Patch 2 — Die Karte ist nicht mehr modal und hält das Spiel nicht an

Das ist der Kern der Handy-Beschwerde.

**Was:**

* `index.html`: `#tutorialDialog` wird zu `#tutorialCoach` (`role="dialog"`,
  `aria-live="polite"`, **kein** `<dialog>`/`showModal`). Damit ist es kein
  Modal mehr und fängt keine Tipps auf die Karte ab. Position: fest unten über
  der Aktionsleiste, `max-height: 45dvh`, `overflow:auto`.
* `game.js`: `tutorial.isOpen()` **raus** aus beiden Pause-Bedingungen
  (`update()` Z. 442, `paused` Z. 466). Karten pausieren nie mehr das Feld;
  pausiert wird nur noch bei echtem Menü/Dialog (`gameConfirm`, `commandMenu`,
  `missionMenu`, `cinematic`).
* `game.js`: `update()` läuft weiter, auch wenn die Erste-Hilfe-Karte sichtbar ist.
  Achtung: `focusPause` und Koop bleiben, wie sie sind.
* Karten-Schritte haben **keine** „Weiter"-Pflicht mehr, wo sie nichts verlangen:
  Sie verschwinden, wenn die Aktion passiert ist, oder über „×".
  Ein „Weiter" bleibt nur bei den Karten, die auf eine Erklärung warten.

**Layout-Regeln (Telefon zuerst):**

* Breite `min(520px, calc(100vw - 16px))`, unten verankert, `env(safe-area-inset-bottom)`.
* Höhe `max 45dvh`, Inhalt scrollt (`overflow:auto`), Aktionen bleiben als
  Leiste unten stehen.
* Szene/Illustration entfällt auf Coaches (spart 143 px). Bilder gehören in die
  Debrief-Popups, nicht in die Karte, die das Feld freihalten muss.
* Bei `max-width:600px`: Schrift 13 px, Abstände 8 px, Knöpfe 44 px (Daumenregel).
* Querformat (`max-height:420px`): Karte wird zur Seitenspalte, nie über die Karte.
* `prefers-reduced-motion` beachtet, Tipp-Flächen ≥ 44 px.

**Fertig wenn:** bei 390 × 664 und 360 × 480 das Spielfeld zu **mindestens 50 %**
sichtbar bleibt, alle Knöpfe per Tipp erreichbar sind, und ein Tipp auf ein
Baufeld während offener Karte wirklich baut (Browser-Test, s. §8).

---

## 4. Patch 3 — „Willkommen" erst, wenn das Feld gerendert ist

**Warum:** Der Nutzer will das Popup **nach** dem Aufbau der Sandbox, nicht davor.

**Was:**

* `game.js`: `startTrainingRun()` meldet erst fertig, wenn der erste Frame
  gezeichnet ist (`requestAnimationFrame` nach `reset()` + `draw()`).
  Erst dann `onFieldReady()` → `tutorial.startCoach()`.
* `account.js`: `startFirstRunTutorial()` ruft `gameControl.startTutorialFlow()`
  statt `startTutorialIfNeeded()`. Der Aufruf bleibt verzögert, aber der Auslöser
  ist jetzt das gerenderte Feld.
* Ist der Training-Vertrag schon gesehen (alter Account), fällt der Fluss auf das
  alte Verhalten zurück: Karte über dem Command Center, ohne Match.

**Fertig wenn:** im Browser-Test ist `#tutorialCoach` sichtbar **und** das Canvas
hat `width>0` und der erste Frame ist gelaufen (`__soloFrames>0`), bevor die
Willkommenskarte erscheint.

---

## 5. Patch 4 — Die Hundemarke ist der Preis für Welle 5

**Warum:** „nach dem Boss von Welle 5 sein erstes Item erhält — die Dog Tag mit
Name, Geschlecht und Blutgruppe o. ä."

Status quo: Es gibt eine Hundemarke (`dog-tag.mjs`) — sie wird aber nur beim
Öffnen des Soldatenbildschirms gerendert und ist im Debrief nicht der Abschluss.

**Was:**

* `armory.mjs` / `rewardWave`: Boss-Wellen (`wave % 5 === 0`) zahlen heute nur
  Skrap. Neu: Die **erste** Boss-Welle eines Accounts vergibt zusätzlich das
  Item `identity-tag` (rein kosmetisch, `wave: 5`). Damit bekommt der Spieler
  „sein erstes Item" aus dem Boss — ohne das Kampfsystem zu ändern.
* **Blutgruppe**: Neues, abgeleitetes Feld in `dog-tag.mjs`:
  ```js
  export const BLOOD_TYPES = Object.freeze(['0 RH+','0 RH−','A RH+','A RH−','B RH+','B RH−','AB RH+','AB RH−']);
  export function dogTagBloodType(accountId){ /* deterministisch aus Serial-Hash: 8 Typen */ }
  ```
  Regel wie beim Serial: **nichts wird gespeichert**, dieselbe ID ergibt auf jedem
  Gerät dieselbe Blutgruppe. Das ist kein medizinischer Wert und wird im UI als
  „AUSWEIS / ERFUNDEN" gekennzeichnet, damit niemand denkt, es sei echt.
* `dog-tag.mjs`: Zeile „BLUTGRUPPE" ins SVG/HTML-Aussehen, gleiche Linienoptik wie
  die Armory-Icons. Name, Geschlechts-Piktogramm, Serial, Marke, Ausgabedatum
  bleiben.
* Debrief (Popups): Die Marke erscheint **groß** im Debrief-Modal als Belohnung
  („VERLIEHEN"), danach bleibt sie am Soldaten sichtbar (immer getragen, wie
  spezifiziert).

**Fertig wenn:** `dogTag({...}).bloodType` existiert, deterministisch ist, der
Test „nichts wird gespeichert" weiter grün ist, und im Debrief die Marke als
Belohnung erscheint.

---

## 6. Patch 5 — Erst Ausrüstung, dann Skillpunkt

**Warum:** „erst an das Anziehen der gewonnenen Boss-Ausrüstung, danach an das
Skill verteilen." Heute ist die Reihenfolge in `first-run-ending.mjs` umgekehrt
(`ENDING_STEPS = ['skills','tag','workshop']`).

**Was:**

* `first-run-ending.mjs`: `ENDING_STEPS = ['tag','equip','skills','workshop']`.
  * `tag` = Hundemarke verliehen (Popup, kein Dialogwechsel nötig).
  * `equip` = **echter** Armory-Dialog, gefiltert auf die Items, die der Lauf
    wirklich eingebracht hat; der Spieler zieht selbst an; Speichern passiert
    über den bestehenden `saveArmory`-Pfad (echte Daten, keine Sandbox).
  * `skills` = wie heute, echter Dialog, speichern, Build bleibt aktiv.
  * `workshop` = wie heute.
* `account.js`: `steps` neu verdrahten; `equip` nutzt den Armory-Dialog **ohne**
  Sandbox (`sandbox.leave()` ist der Normalzustand), weil es echte Belohnung ist.
* `ENDING_KEY` **von `v1` auf `v2`** heben: die Reihenfolge und die Hundemarke sind
  neuer Inhalt, und die alte Edition hat die Reihenfolge „Skills zuerst"
  abgeschlossen. Sonst sieht kein bestehender Account den neuen Abschluss.
  (Exakt der Fehler, der in `tutorial.mjs` die `TUTORIAL_EDITION` erzwungen hat.)
  Achtung: `tests/first-run-ending.test.mjs:57` prüft den Literal-Key → mitziehen.

**Fertig wenn:** ein Test die Reihenfolge als `['tag','equip','skills','workshop']`
prüft, ein Abbruch bei `equip` die Sequenz **nicht** als erledigt markiert
(bestehende Semantik), und `endingDone` für einen Account mit `v1`-Marker `false`
liefert.

---

## 7. Patch 6 — Optik: die Popups im Gleichschritt

**Warum:** „die ganzen Tutorial Popups und alles soll optisch überarbeitet werden
im gleich schritt."

Zwei Sorten Popup, zwei Aufgaben:

**A. Erste-Hilfe-Karte (während des Spiels)** — klein, ruhig, immer am selben
Platz unten, damit die Augen auf dem Feld bleiben:

* Ein Stil: dunkles Grün `#14251e`, 1 px Kante `#899b7b`, Radius 4 px, dieselbe
  Typo wie die Debrief-Panels; Kicker in Großbuchstaben, ein Satz, ein Hinweis.
* Eine sichtbare Nummer `1 / 5`, damit klar ist, wie viel noch kommt.
* **Kein** Bild, **kein** Portrait, **kein** Hintergrundfoto — nur Text + Icon.
* Animation: 120 ms einblenden, keine Schleifen (Akku, `prefers-reduced-motion`).
* Farbe/Bewegung nur da, wo eine Aktion verlangt ist (pulsierender Rahmen am
  Baufeld-Hinweis) — und nur solange die Aktion offen ist.

**B. Belohnungs-/Debrief-Popups (nach dem Lauf)** — groß, feierlich, dürfen
Fotos zeigen:

* Hundemarke in Übergröße, Prägung mit Lichtkante (nur CSS, kein neues Asset).
* Danach Ausrüstung, dann Skills: derselbe Kopf-Aufbau (Kicker · Titel · eine
  Zeile Erklärung), damit die Kette als **ein** Ablauf gelesen wird.
* Ein einziger „Weiter"-Knopf pro Schritt, Fortschritt `2 / 4` im Kicker.

**Technik:** Die Optik kommt in `interface-redesign.css` (ein Block je Sorte),
`style.css:12` und `style.css:102–106` werden entschärft (kein doppeltes Setzen
derselben Selektoren, `overflow:auto`), alte Demo-Klassen (`.tutorial-practice`,
`.tutorial-demo-*`) werden gelöscht — sie gehören zu den 11-Schritt-Panels, die
verschwinden.

**Fertig wenn:** im Browser-Test bei 390 × 664, 360 × 480 und 1280 × 800 kein
Popup die Seite scrollt (`document.documentElement.scrollHeight===clientHeight`),
kein Knopf aus dem Viewport ragt, und alle Popup-Knöpfe ≥ 44 px sind.

---

## 8. Patch 7 — Was mit den 11 Schritten passiert

Die alten `TUTORIAL_STEPS` sind eine **Klickfolge über Screenshots** (Build,
Upgrade, Held bewegen, Deploy, Karte, Multiplayer, Skills, Armory, Workshop,
Prestige). Genau das war „Popup über Popup", und deshalb steht dort auch
`Welle 5 / 6`.

**Vorschlag:** Ersetzen, nicht ausbauen.

| Alt (11 Schritte) | Neu |
| --- | --- |
| 1 Willkommen | Karte 1 „Willkommen" (nach dem ersten Frame) |
| 2 Build / 3 Upgrade | Karte 2 „Baue am leuchtenden Feld" + 3 „Werte auf oder verkaufe" |
| 4 Held bewegen | Karte „Tippe auf freies Feld" |
| 5 Welle starten | Karte „Deploy" (erste Welle) |
| 6 Karte / Terrain | entfällt → Feldintel ist im Spiel erklärt |
| 7 Multiplayer | entfällt → Feldschule nach dem Lauf |
| 8 Skills | bleibt als **echter** Schritt, aber nach Ausrüstung |
| 9 Armory | wird zu „Ausrüstung anziehen" (echte Belohnung) |
| 10 Workshop | bleibt als Feldschule-Punkt, nicht als Pflichtschritt |
| 11 Prestige | entfällt → kommt beim ersten Kampagnen-Abschluss |

Damit sind es **5 Karten im Spiel + 4 Schritte danach** statt 11 Popups
hintereinander. Die Inhalte (deutsche Strings, Sandbox-Hinweise) werden
übernommen, nicht neu erfunden.

**Wichtig:** `TUTORIAL_EDITION` bleibt bei 2 — die neue Karte ist eine
Weiterentwicklung derselben Edition; erst wenn ein Account sie **gesehen** hat,
soll er sie nicht erneut bekommen. Wer bereits `v2` hat, bekommt die Karten
**nicht** noch einmal; nur neue Accounts durchlaufen den v3-Fluss. Wenn du willst,
dass auch bestehende Accounts die neuen Popups sehen: `TUTORIAL_EDITION = 3`
(Entscheidung nötig, siehe §11).

---

## 9. Patch 8 — Testplan

Unit (`node --test IronPath/tests/*.test.mjs`, heute 391 grün):

* Welle 5 beendet den Vertrag, `trainingXP()===300`, Level 2 danach.
* `trainingUnitScale()` unverändert (Gegner bleiben geschwächt), Boss-Welle 5.
* Hundemarke: `bloodType` deterministisch, in `BLOOD_TYPES`, ohne Storage-Zugriff.
* `endingDone` mit `v1`-Marker → `false`; Reihenfolge `['tag','equip','skills','workshop']`.
* Cache-Token-Invariante (aus #161) bleibt grün; neue Dateien mit demselben Token.
* `tests/tutorial.test.mjs` wird auf den Coach umgeschrieben (keine `<dialog>`-API).

Browser (`browser-tests/command-center.cjs`, Playwright, läuft in CI):

* Erster Login → Training startet selbst, Canvas hat Frames, **dann** Karte 1.
* Während Karte offen: Tipp auf Baufeld baut (Karte nicht modal, Spiel läuft).
* Karten lassen sich wegtippen; Spiel pausiert nie.
* Boss Welle 5 → Debrief mit Hundemarke → Ausrüstung → Skills → gespeichert.
* Nach dem Debrief ist `Deploy` wieder benutzbar (Regression `trainingDone`).

Geräte (manuell, `FIRST-RUN-DEVICE-TEST.md` wird umgeschrieben):
390 × 664, 360 × 480 (klein), 844 × 390 (quer), Desktop. Gesucht: Popup verdeckt
die Karte nicht, jeder Knopf mit dem Daumen erreichbar, Hundemarke lesbar.

---

## 10. Reihenfolge der Umsetzung

1. **Patch 1** (Welle 5 + Guard) — kleine, testbare Änderung, entkoppelt vom UI.
2. **Patch 2** (Karte nicht modal, nicht pausierend) — die eigentliche Bugbehebung.
3. **Patch 3** (Willkommen nach dem ersten Frame).
4. **Patch 4** (Hundemarke + Blutgruppe + Item aus dem Boss).
5. **Patch 5** (Reihenfolge Ausrüstung → Skills, `ENDING_KEY` v2).
6. **Patch 6** (Optik beider Popup-Sorten).
7. **Patch 8** (Tests parallel zu 1–6, Gerätetest zuletzt).

Jeder Patch einzeln grün, einzeln committet, damit ein Rückbau möglich bleibt.

---

## 11. Entscheidungen, die ich brauche

1. **Alte Accounts:** Sollen sie den neuen Ablauf auch sehen (`TUTORIAL_EDITION = 3`),
   oder nur neue Accounts? Ich empfehle: **ja**, einmal — sie haben den
   „Wellen 1–5 + Hundemarke"-Fluss nie gesehen. Das ist derselbe Grund, aus dem
   wir die Edition überhaupt eingeführt haben.
2. **300 XP hart oder skalierend?** Ich empfehle, den Bonus so zu setzen, dass
   Level 2 **garantiert** erreicht wird (Auftragsbonus), damit der Skillpunkt
   nicht an einer Balancing-Änderung hängt.
3. **Blutgruppe** ist erfunden und deterministisch (nichts gespeichert). Wenn du
   sie lieber vom Spieler wählbar hättest, brauchen wir ein neues Profilfeld
   (Firebase + Rules + Migration) — deutlich größer. Empfehlung: abgeleitet, im
   UI als Markierung „AUSWEIS" gekennzeichnet.
4. **Boss-Item:** die Hundemarke als `armory.mjs`-Item (`wave: 5`) oder rein als
   Belohnung im Debrief? Empfehlung: **beides** — als Item sichtbar in der
   Armory („getragen, nie verkauft"), verdient in Welle 5.

---

## 12. Risiken

* **Tests, die den alten Ablauf festschreiben:** `training-run.test.mjs` (6 Wellen),
  `first-run-ending.test.mjs` (Reihenfolge), `tutorial.test.mjs` (11 Schritte),
  `browser-tests/command-center.cjs` (Klickpfad). Werden mitgezogen; das ist
  erwartete Arbeit, kein Kollateralschaden.
* **Koop:** Der Ersteinstieg darf nur solo greifen. `startTrainingRun()` prüft
  `coop` bereits indirekt über `onResumeBattle`; das bleibt so.
* **Balance:** Weniger Wellen = weniger Einkommen. Deshalb der Bonus; Skrap bleibt
  bei 5 × 10 + 1 Boss-Bonus und wird im Debrief ausgewiesen.
* **Kein Browser hier:** CI (`interface-browser-smoke`) ist der einzige Beweis für
  das Handy. Ich kann das nicht lokal nachstellen — der Gerätetest bleibt offen
  in `CHECKLIST.md`, bis du ihn gemacht hast.
