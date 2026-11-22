# Patch-Ablauf

Wie ein Update oder Patch in diesem Repository läuft: welche Prüfungen **vor**
und **nach** der Änderung, wie getane Arbeit im Patch-Log festgehalten wird und
was erst nach einem belegten Ereignis eingetragen werden darf.

Verbindlich ist [`../../AGENTS.md`](../../AGENTS.md). Diese Datei macht dieselben
Regeln konkret und nennt die Werkzeuge, die sie prüfen. Bei Widerspruch gilt
`AGENTS.md`.

Werkzeuge: [`../scripts/patch-check.mjs`](../scripts/patch-check.mjs) (prüft,
schreibt nichts) und [`../scripts/patch-bump.mjs`](../scripts/patch-bump.mjs)
(schreibt die Cache-Welle). Struktur der Ordner:
[`../README.md`](../README.md).

---

## 0. Begriffe, die nicht austauschbar sind

| Status | Bedeutung | Belegt durch |
| --- | --- | --- |
| `lokal/uncommittet` | nur im Arbeitsbaum | `git status` |
| `committet` | in einem lokalen Commit | Commit-Hash |
| `gepusht` | auf dem Arbeitszweig auf GitHub | `git rev-list origin/main..HEAD` |
| `PR offen` | Pull Request exists, nicht gemergt | PR-Nummer |
| `gemergt` | in `main` übernommen | Merge-Commit-Hash |
| `ausgeliefert` | Pages-Build aus diesem Commit fertig | Build-Status + Inhalt auf `main` |
| `abgenommen` | vom Betreiber auf einem Gerät gesehen | seine Aussage |

**Nachweisgrad** getrennt nennen: Unit-Test, Emulator, Browser mit Test-Doubles,
echtes Gerät, produktiver Test. Ein Unit-Test ist keine Geräteabnahme, und ein
Emulatorergebnis ist kein Produktivnachweis.

---

## 1. Vor der Arbeit

```sh
node IronPath/scripts/patch-check.mjs          # Vorprüfung, wenige Sekunden
gh pr list --state open                        # liegt schon etwas in der Luft?
```

1. [`PATCH-LOG.md`](PATCH-LOG.md) lesen — die neuesten 20 Einträge; für ältere
   [`PATCH-LOG-ARCHIV.md`](PATCH-LOG-ARCHIV.md). Danach bei Bedarf
   [`PATCH-BLOECKE.md`](PATCH-BLOECKE.md) und [`DATENBLATT.md`](DATENBLATT.md).
2. Vorprüfung lesen. **Grün sein müssen** `stempel`, `struktur`, `patchlog`
   (Nummerierung) und `verträge`. Ein `git`-Hinweis auf uncommittete Änderungen
   ist normal, wenn fremde Arbeit im Baum liegt — sie gehört nicht überschrieben.
3. Ist etwas rot: zuerst klären. Auf einem roten Stand lässt sich kein grüner
   Patch nachweisen.

---

## 2. Während der Arbeit

- **Ein logischer Schritt = ein Commit**, Produktcode und sein Test zusammen.
- **Jeden Wächter auf Bissfestigkeit prüfen:** eine Probe anlegen, die den Test
  rot machen muss, Ergebnis notieren, Probe löschen. Ein Test, der noch nie rot
  war, belegt nichts.
- **Nichts in die Spielwurzel**, was der Browser nicht lädt: keine `.md`, keine
  Skripte, keine Module ohne Importeur. `tests/repo-structure.test.mjs` prüft
  das und nennt den Fund beim Namen.
- **Neue Datei ⇒ Harness-Listen prüfen.** 13 Testdateien ersetzen Modulnamen in
  einer festen Liste; fehlt ein neues Modul dort, fällt die Suite mit
  `ERR_UNSUPPORTED_RESOLVE_REQUEST` — 22 rote Tests, die nichts mit der Änderung
  zu tun haben (Passiert in PR #335, dokumentiert in `PATCH-LOG.md` IPL-0090).
- **`?v=`-Token:** neue Importe tragen die aktuelle Welle aus
  `release-version.json`.

---

## 3. Nach der Änderung, vor dem Commit

```sh
node IronPath/scripts/patch-check.mjs --suite   # Verträge + volle Suite, ~6 min
```

Bindend ist der Serienlauf **vom Repo-Root**, genau wie in CI:

```sh
node --test-reporter=tap --test IronPath/tests/*.test.mjs
```

Ins Log gehören die echten Zahlen: `tests / pass / skipped / fail` und der
Exit-Code. Nicht „Suite grün" ohne Zahlen.

Je nach Änderung zusätzlich:

| Änderung an | Prüfung |
| --- | --- |
| Simulation, Gefechtsfeld, Wellen | `node IronPath/stress-tests/run.mjs` |
| Dienst-Prototypen | `npm test --prefix IronPath/server` |
| RTDB-Regeln | `npm ci --prefix IronPath/firebase/rules-test` und dort `npm test` |
| Oberfläche, Layout, Kontofluss | Chromium-Fahrten aus `browser-tests/` (CI: `interface-browser-smoke`) |
| Kunst, Straße, Zeichnen | Render-Fuzz oder Fahrt mit Test-Doubles, Kostenmessung je Frame |
| Doku | Scan auf CJK-/Fullwidth-Zeichen in den geänderten Dateien |

---

## 4. Cache-Welle

Jede Veröffentlichung trägt ein Token `20YYMMDD-name`. Es steht an sieben
Stellen **außerhalb** der `?v=`-Importe (`release-version.json`, Meta-Tag und
zwei `build-stamp`-Elemente in `index.html`, `LOGIN_SCENE_VERSION`, zwei
`browser-tests`) und an mehreren hundert Importen.

```sh
node IronPath/scripts/patch-bump.mjs 20261122-neu1            # Trockenlauf
node IronPath/scripts/patch-bump.mjs 20261122-neu1 --apply    # schreiben
```

Der Trockenlauf nennt jede Zeile ohne `?v=`, die sich ändern würde. Das müssen
genau die bekannten Anker sein — eine unbekannte Zeile bricht den Bump ab, denn
dann ist das Token irgendwohin gewandert, wo es nichts zu suchen hat.

**Nicht umgeschrieben werden:** die `build:`-Felder und Protokollsätze in
`patch-notes.mjs` (sie sagen, was tatsächlich ausgeliefert wurde) und alles
Markdown. Ältere Token an unveränderter Kunst und an Multiplayer-Assets bleiben
ebenfalls stehen — das ist Vertrag, kein Fund.

Nach `--apply` ist `patch-check.mjs` **rot**, bis der neue Eintrag in
`patch-notes.mjs` existiert. Das ist Absicht: eine Welle ohne Feldnotizen
soll nicht durchrutschen.

---

## 5. Patch-Log

Vorlage: [`patch-log-vorlage.md`](patch-log-vorlage.md). Jeder in sich
abgeschlossene Schritt bekommt einen Eintrag mit Kennung `IPL-NNNN`:

- Ziel und Blockzuordnung, Branch und Basis
- betroffene Dateien und die **tatsächlichen** Änderungen
- Prüfungen: Befehl, Ergebnis mit Zahlen, Art des Tests, Grenzen
- Einschränkungen und offene Punkte — getrennt von dem, was erledigt ist

Git- und Betrieb-Ereignisse (Commit, Push, PR, CI, Merge, Pages) werden **erst
nach dem tatsächlichen Ereignis** mit belegbarer Kennung nachgetragen. Ein Commit
kann seinen eigenen Hash nicht enthalten, also bleibt der Nachtrag notfalls
uncommittet und muss als solcher erkennbar sein. Keine erfundenen PRs, Merges
oder Nutzerbestätigungen.

**Archiv-Regel:** `PATCH-LOG.md` führt die neuesten **20** Einträge, alles Ältere
steht in [`PATCH-LOG-ARCHIV.md`](PATCH-LOG-ARCHIV.md). Zusammen müssen sie
lückenlos und doppelfrei sein, und das Archiv darf nichts Neues enthalten als das
Log. `patch-check.mjs` meldet Lücken, Doppelte, Überlappung und Überlauf;
`tests/patch-log-archive.test.mjs` lässt ein Aufteilen nicht durch, bei dem
Einträge verloren gehen.

**Verschieben ist Handarbeit, ein Eintrag wandert immer vollständig.** Kommt ein
neuer Eintrag dazu, wird der älteste des Logs ans **Ende** des Archivs gehängt
und in beiden Köpfen die Kennungsgrenze nachgezogen (`IPL-0001 bis IPL-00xx`).
Ereignis-Nachträge bleiben bei ihrem Eintrag. Ein Teiler-Skript darf nur auf
einem Log laufen, das **alle** Einträge enthält: auf einem bereits geteilten Log
würde es das Archiv aus den 20 Einträgen neu schreiben und 72 Einträge
zerstören. Deshalb steht hier kein Werkzeug dafür, und `patch-check.mjs` meldet
den Überlauf, statt ihn selbst zu beheben.

Nicht ins Log: Passwörter, Token, UIDs, Freundes- oder Partycodes, private
Profile, Firebase-Schlüssel. `patch-check.mjs` prüft neue Zeilen auf
Schlüsselmuster.

---

## 6. Commit, Push, Pull Request

- Commit-Text: Ziel, Dateien, Prüfungen mit Zahlen, Grenzen.
- Push **nur auf den Arbeitszweig** dieser Sitzung, PR gegen `main`.
- CI beobachten: `gh pr checks <nummer>`. `--watch` bricht in dieser Umgebung
  gelegentlich ab; Polling mit `gh pr checks <nummer>` und `sleep` ist zuverlässig.
- **Rot ist nicht mergbar.** `game-regressions` war bei #335–#339 rot und wurde
  trotzdem gemergt; das ist der Grund für den Rückbau auf #334. Offen und nur vom
  Betreiber zu erledigen: `game-regressions` zum Pflicht-Check machen
  (`branches/main/protection` liefert dem Arbeitsraum `403`).

---

## 7. Nach dem Merge: Auslieferung belegen

```sh
node IronPath/scripts/patch-check.mjs --online --pr <nummer> --verify-main
```

Geprüft werden: PR-Status und Merge-Commit, die Checks des PR, der
Pages-Build-Status und `release-version.json` auf `main`. Für einzelne Dateien:

```sh
gh api repos/0815games/0815games.github.io/contents/IronPath/<pfad>?ref=main
```

**Grenze, die das Werkzeug selbst meldet:** Das belegt Repo-Inhalt auf `main` und
den Pages-Baustatus. Ein Abruf der live URL ist es nicht — dafür fehlt dieser
Umgebung der ausgehende Zugriff auf den Seiten-Host.

---

## 8. Nach der Veröffentlichung

1. **Feldnotizen** in [`../patch-notes.mjs`](../patch-notes.mjs): Release-Liste
   ergänzen, jede Zeile auf **Deutsch und Englisch**
   (`tests/patch-notes.test.mjs` lässt eine fehlende Sprache nicht durch),
   veröffentlichte Arbeit und offene Punkte getrennt, keine behauptete
   Geräteabnahme.
2. **Schnellübersicht** [`PATCH-BLOECKE.md`](PATCH-BLOECKE.md) aktualisieren,
   ohne offene Kriterien oder bereits gebaute Funktionen zu streichen.
3. **Betreiber-Liste** im Gespräch: was geändert wurde, welche konkreten Schritte
   er testen soll, welches Ergebnis erwartet wird — plus offene Punkte, Risiken
   und den tatsächlichen Live-/Wartungsstatus, getrennt davon.

---

## 9. Was die Werkzeuge nicht tun

`patch-check.mjs` liest und meldet; es committet, merged, deployed oder öffnet
keine Wartung. `patch-bump.mjs` schreibt ausschließlich Token und verlangt dafür
`--apply`. Kein Git-Hook erzwingt etwas: Wer außen am Repository arbeitet, muss
Ereignisse selbst nachtragen.

**Bekannte Fallen** (alle aus echter Arbeit in diesem Repository):

- Die Suite läuft **nur vom Repo-Root** grün. Aus `IronPath/` heraus war genau ein
  Test rot (`production-cors-probe`, Unterprozess ohne `cwd`) — gemessen:
  1242 Tests, 1 Fehler statt 0. Inzwischen behoben.
- Ein verschachtelter Prüflauf erbt `NODE_TEST_CONTEXT=child-v8` und schreibt sein
  TAP in den Elternkanal: leerer stdout, sieht aus wie ein Absturz.
  `patch-check.mjs` entfernt die Variable vor Unterprozessen.
- `-P 4` zählt anders als der Serienlauf (einmal 26 statt 25 Fehler). Aussagen
  nur aus dem Lauf, den auch CI fährt.
- Orthogonal-symmetrische Testdaten decken halbwinklige Formelfehler nicht: eine
  invertierte Tangentenformel war auf allen Spielkarten grün und nur auf einem
  Zickzack-Pfad rot. Nicht mit Toleranz überdecken.
- Ein Zweig- oder Arbeitsraumwechsel vernichtet nicht committete Arbeit. Befunde
  sofort committen; Ereignis-Kennungen nach dem Merge sofort ins Log und pushen.

---

## 10. Rückbau

Muster: `PATCH-LOG.md` IPL-0090 und PR #340 (Rückbau auf #334).

```sh
git checkout <guter Commit> -- IronPath/
git rm -f -q IronPath/<Dateien, die es damals nicht gab>
node IronPath/scripts/patch-bump.mjs <neue Welle> --apply
```

Danach: neuer Feldnotizen-Eintrag, Log-Eintrag mit den Grenzen des Rückbaus
(was dadurch **nicht** bewiesen ist), volle Suite, PR, Merge, Auslieferung
belegen. Ein Rückbau ist eine gewählte Maßnahme und kein belegter Fix, solange
die Ursache nicht nachgestellt ist.

---

## 11. Release-Checkliste zum Abhaken

Zum Kopieren in eine Arbeitsdatei oder einen PR-Kommentar. Jedes Kästchen verweist
auf den Abschnitt, der es erklärt - hier steht absichtlich keine zweite Fassung
der Regeln, damit nichts auseinanderlaufen kann. **Nichts abhaken, was nicht
belegt ist**; ein unbelegter Punkt bleibt offen und steht so im Log (§0).

```text
vor der Arbeit
[ ] Patch-Log gelesen, letzter Eintrag und dessen offene Punkte bekannt      §1
[ ] patch-check.mjs ohne Fehler; Hinweis "flacher Klon" beachtet             §1
[ ] offene PRs und CI-Status geprüft, Basis ist main                         §1

während der Arbeit
[ ] ein logischer Schritt = ein Commit, Ziel und Dateien im Text             §2
[ ] neue Wächter auf Bissfestigkeit geprüft (absichtlich kaputt gemacht)     §2
[ ] nichts Ungebrauchtes in die Spielwurzel gelegt                           §2
[ ] neue Dateien in Harness-Listen eingetragen, Suite grün                   §2

nach der Änderung
[ ] Serienlauf vom Repo-Root: tests/pass/fail/skipped notiert                §3
[ ] zusätzliche Prüfstände je Änderung (Tabelle) gefahren                    §3
[ ] patch-check.mjs: Stempel, Struktur, Log, Geheimnisse, Verträge           §3

Cache-Welle
[ ] patch-bump.mjs ohne --apply: Zahlen gegen die letzte Welle gerechnet     §4
[ ] --apply: Nicht-?v=-Zeilen im Diff sind genau die Anker                   §4
[ ] patch-notes.mjs: neuer RELEASED_PATCHES[0]-Eintrag, je Zeile DE und EN   §4
[ ] patch-check.mjs meldet alle Anker mit dem neuen Token                    §4

Patch-Log
[ ] neuer Eintrag aus der Vorlage, alle Pflichtfelder                        §5
[ ] Ereignisse erst nach dem tatsächlichen Ereignis, mit Kennung             §5
[ ] Log führt die neuesten 20, ältester Eintrag vollständig ins Archiv       §5
[ ] keine Zugangsdaten, Token, UIDs oder Schlüssel im Text                   §5

Merge und Auslieferung
[ ] CI grün; roter Check ist nicht mergbar                                   §6
[ ] Merge-Commit-Kennung notiert                                             §7
[ ] Pages-Build-Status und Inhalt auf main belegt                            §7
[ ] ehrliche Grenze genannt, falls die live URL nicht abgerufen wurde        §7

nach der Veröffentlichung
[ ] Feldnotizen DE und EN, getrennt nach veröffentlicht und offen            §8
[ ] Betreiber-Liste: was zu prüfen oder zu stellen ist                       §8
[ ] keine Geräteabnahme behauptet, die nicht stattfand                       §8
```

Rückbau ist kein Punkt dieser Liste, sondern ein eigener Vorgang mit eigener
Welle, eigenem Log-Eintrag und eigener Geräteabnahme: §10.
