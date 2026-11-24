# Tiny Tycoon Towns: Patch-Log

Einstiegspunkt für künftige Änderungen. Vorher lesen, danach fortschreiben. Der Ablauf
steht in [`PATCH-ABLAUF.md`](PATCH-ABLAUF.md), die Regeln in [`../AGENTS.md`](../AGENTS.md).
Kennungen `TTT-NNNN`, fortlaufend. Commits und PRs werden nur nach dem tatsächlichen
Ereignis ergänzt.

## TTT-0001 – Spielplan und spielbarer Vertical Slice

- Zeit / Quelle: Sitzung 2026-11-24 (UTC). Commit-Zeit aus Git.
- Block / Ziel: Nutzerwunsch: Spielplan als `docs/GAME_PLAN.md` speichern, einen passenden
  Ordner anlegen und mit dem Spiel beginnen. Umsetzung als statisches Browserspiel ohne
  Build, passend zur Struktur des Repos (GitHub Pages). Abweichung vom Plan: kein
  Vite/TypeScript/Pixi im ersten Schritt.
- Branch / Basis: `arena/7efbfaa5-0815games-github-io`, Basis `ee9daa4` (`main`).
- Änderungen / Dateien: `docs/GAME_PLAN.md` (Plan, unverändert übernommen), `data/*.json`
  (Balance), `src/domain/*.js` (Regeln), `src/main.js` (Oberfläche), `index.html`,
  `style.css`, `favicon.svg`, `tests/domain.test.mjs`, `README.md`.
- Prüfungen:
  - `node --test tests/domain.test.mjs`: 31 Tests, 31 pass, 0 fail, Exit 0 (Unit).
  - Browser-Prüfung: in dieser Sitzung nicht durchgeführt. Der Stand ist nur über
    Syntaxprüfung und Domain-Tests belegt.
- Git / PR / Veröffentlichung: Commit `3399cef` (Vorgänger-HEAD im Branch, vor dieser
  Sitzung). Ob er auf GitHub liegt, ist nicht geprüft. Kein PR. Nicht veröffentlicht.
- Offen / nächster Schritt: Cloud-Speicher (siehe TTT-0002).

## TTT-0002 – Konto (E-Mail), Cloud-Speicher, Regeln und Patch-Werkzeug

- Zeit / Quelle: Sitzung 2026-11-24 (UTC). Betreiber-Angaben zu Firebase: Realtime
  Database im Sperrmodus in `europe-west1`, E-Mail-Anmeldung aktiviert.
- Block / Ziel: Nutzerwunsch: Firebase anbinden (Konfiguration vom Betreiber), E-Mail-
  Registrierung und Anmeldung, Speicher als Web-App. Zusätzlich: Firebase-Regeln in einer
  Datei mit Link zum Veröffentlichen und den Patch-Ablauf von IronPath übernehmen.
  Abweichung vom Plan: Der Plan sieht Firestore vor, der Betreiber hat Realtime Database
  angelegt. Umgesetzt wurde RTDB.
- Branch / Basis: wie TTT-0001.
- Änderungen / Dateien:
  - `src/firebase-config.js` (öffentliche Web-Konfiguration)
  - `src/cloud.js` (Anmeldung, Laden, Speichern, Löschen, Fehlertexte)
  - `src/main.js` (Anmelde-Dialog, Laden nach Anmeldung, Speicherung lokal alle 5 s und
    in der Cloud höchstens alle 60 s, Abmelden, Feldnotizen, Stadt-Reset auch in der Cloud)
  - `src/domain/engine.js` (`hydrateTown`: RTDB verwirft leere Objekte, die werden
    beim Laden wiederhergestellt)
  - `firebase/database.rules.json`, `firebase.json`, `.firebaserc`
  - `scripts/check-rules.mjs` (Regelprüfung, Dry-Run gegen Live-Export)
  - `scripts/patch.mjs` (`check`, `bump`), `src/patch-notes.mjs` (Feldnotizen DE/EN)
  - `tests/hydrate.test.mjs`, `tests/rules.test.mjs`, `tests/patch-notes.test.mjs`,
    `tests/patch-tooling.test.mjs`
  - `package.json`, `release-version.json` (Welle `20261124-konto1`), `AGENTS.md`,
    `docs/PATCH-ABLAUF.md`, `docs/PATCH-BLOECKE.md`, `docs/FIREBASE.md`,
    `docs/patch-log-vorlage.md`, Cache-Welle (`?v=`) in `index.html` und `src/`.
- Prüfungen (lokal, Node 22.22.3):
  - `node --test tests/*.test.mjs`: 42 Tests, 42 pass, 0 fail, Exit 0 (Unit).
  - `npm run check:suite`: Exit 0, alle Blöcke grün (stempel, struktur, patchlog,
    geheimnisse, regeln, verträge+tests).
  - `node scripts/check-rules.mjs`: Regeln: OK.
  - Vorher rot und behoben: `scripts/patch.mjs` hatte ein `await` in einer nicht-async
    Funktion (Syntaxfehler), und der Geheimnis-Scan fand sich selbst. Suchmuster sind
    jetzt so geschrieben, dass der Text sie nicht wörtlich enthält. Der Scanner wurde
    mit einer Testzeile erneut geprüft.
  - Grenzen: Keine Verbindung zu Firebase aus der Sandbox möglich (nur GitHub, npm,
    PyPI erreichbar). Die Anmeldung und der Speicher sind **nicht** gegen das echte Projekt
    getestet. Kein Emulator (Java fehlt). Die Regeln sind nicht ausgeführt, nur geprüft.
- Git / PR / Veröffentlichung: Commit siehe Ereignis-Nachtrag unten. Kein PR. Nicht
  veröffentlicht. Die Regeln wurden nicht in Firebase eingespielt.
- Abweichung, offen: `scripts/patch.mjs` (180 Zeilen) und `scripts/check-rules.mjs`
  (112 Zeilen) sind eigene Umsetzungen nach dem Muster von IronPath
  (`IronPath/scripts/patch.mjs` 617 Zeilen, `rules-publish-dry-run.mjs` 132 Zeilen).
  Sie sind nicht identisch. Der Nutzer will den Ablauf „genau so“. Die Angleichung ist
  nicht erledigt.
- Offen / nächster Schritt:
  1. Betreiber: Regeln nach `docs/FIREBASE.md` veröffentlichen (Backup, Dry-Run, Konsole).
  2. Betreiber: Autorisierte Domains prüfen (`0815games.github.io`).
  3. Agent oder Betreiber: Anmeldung auf einem Gerät prüfen, Ergebnis als Nachtrag.
  4. Emulator-Tests einrichten, sobald Java verfügbar ist.

### Ereignis-Nachtrag zu TTT-0002

- Commit: lokaler Checkpoint-Commit auf `arena/7efbfaa5-0815games-github-io` (Hash siehe
  `git log -1`, wird nach dem Commit nicht im Log selbst eingetragen).
- Push, PR, Regelveröffentlichung: nicht erfolgt.

## TTT-0003 – Patch-Werkzeug nach IronPath-Muster nachgebaut (Welle `20261124-konto1`)

- Zeit / Quelle: Sitzung 2026-11-24 (UTC). Vorlage: `IronPath/scripts/patch.mjs` (617 Zeilen)
  und `IronPath/scripts/rules-publish-dry-run.mjs` (132 Zeilen), nur gelesen.
- Block / Ziel: Nutzerwunsch: Den IronPath-Ablauf „passend für dieses Projekt“ nachbauen.
  Gleiche Gliederung, gleiche Befehle (`check`, `check --fast`, `check --suite`, `bump`,
  Regel-Dry-Run), gleiche Prüfblöcke. Anker, Pfade und Kennungen sind die dieses Projekts.
  Bewusste Unterschiede:
  - Kennungen `TTT-NNNN` statt `IPL-NNNN`, Log-Archiv gleich (`docs/PATCH-LOG-ARCHIV.md`, 20 Einträge).
  - Keine Emulator-Suite wie bei IronPath (Java fehlt hier). Die Regeln bekommen dafür eine
    Sperrmodus-Prüfung im Dry-Run.
  - Die Regeldatei bleibt reines JSON, ohne Kommentare und ohne eingebetteten Link. Der
    Publish-Link steht in `docs/FIREBASE.md`, gleich wie bei IronPath, wo die Regel-JSONs
    ebenfalls keine Kommentare haben.
  - Anker: `release-version.json` (`build`), `index.html` (`ttt-build`-Meta und `build-stamp`),
    `src/main.js` (`BUILD`), `src/patch-notes.mjs` (`RELEASED_PATCHES[0].build`).
- Branch / Basis: `arena/7efbfaa5-0815games-github-io`, Basis `ee9daa4`. `origin/main` steht
  inzwischen bei `aa6bfb9`. Der Vergleich der Geheimnisse läuft gegen den Abzweigpunkt, nicht
  gegen die bewegliche Spitze von `main`.
- Änderungen / Dateien:
  - `scripts/patch.mjs` (neu, Nachbau), `scripts/rules-publish-dry-run.mjs` (neu, Nachbau mit
    Sperrmodus-Prüfung); `scripts/check-rules.mjs` entfernt.
  - `.github/workflows/tiny-tycoon-towns-patch.yml` (neu): `npm run check:suite` und
    `npm run rules:check` bei Änderungen unter `tiny-tycoon-towns/**`.
  - `release-version.json` (Schlüssel `build`), `index.html` (Meta und Build-Stempel),
    `src/main.js` (`BUILD`-Konstante), `src/patch-notes.mjs` (`token` → `build`), `style.css`.
  - `tests/patch-tooling.test.mjs` (2 Tests dazu: Bump auf einer Kopie, Bissfestigkeit).
  - `tests/rules.test.mjs` (Import umgestellt), `tests/patch-notes.test.mjs` (`build`).
  - `package.json` (`rules:check` zeigt auf den Dry-Run), `AGENTS.md`, `docs/PATCH-ABLAUF.md`,
    `docs/FIREBASE.md`.
- Fehler, die beim Nachbau gefunden und behoben wurden:
  1. `scripts/patch.mjs`: `await` in einer nicht-async Funktion (Syntaxfehler, Exit 1).
  2. Geheimnis-Scan: Suchmuster standen wörtlich im Werkzeug, der Scan fand sich selbst.
  3. Geheimnis-Scan: Ausgabe des Diffs über 1 MB ließ `execFileSync` abbrechen. Die Prüfung
     meldete dann „kein Diff“ statt zu prüfen. `maxBuffer` auf 512 MB gesetzt.
  4. Geheimnis-Scan lief gegen die bewegliche Spitze `origin/main`. Dateien, die `main` seit der
     Abzweigung entfernt hat, erschienen als neu. Jetzt Abzweigpunkt (`git merge-base`).
  5. Bump-Test prüfte den Anker zu früh: Die Feldnotizen-Zeile ist absichtlich erst nach dem
     neuen Eintrag grün. Der Test bildet das jetzt ab.
- Prüfungen (lokal, Node 22.22.3):
  - `npm test`: 44 Tests, 44 pass, 0 fail, Exit 0 (Unit, Vertrag, Werkzeug, Kopie-Bump).
  - `npm run check:suite`: Exit 0, „Kein Fehler, 1 Hinweis“ (der Hinweis: unkommittierte Änderungen).
  - Bump-Probe auf einer Kopie (`20261201-probe1`): Alle 5 Anker wandern; bleibt nur die
    Feldnotizen-Zeile zurück, schlägt die Prüfung korrekt fehl, bis der neue Eintrag steht.
  - `npm run rules:check` (ohne Export): „Regeln: OK“, Exit 0. Mit ungültiger Datei: Exit 2.
  - Nicht geprüft: die Workflow-Datei auf GitHub (sie ist nur als YAML-Struktur gesichtet, Lauf steht aus).
    Der Live-Vergleich der Regeln (`rules:check -- <export>`) ist nicht gelaufen, weil kein Export vorliegt.
  - Grenzen: Die Regeln sind nicht im Emulator getestet. Die Anmeldung ist nicht auf einem
    Gerät geprüft. Die Sandbox erreicht Firebase nicht.
- Git / PR / Veröffentlichung: Commit `c5ddda63` auf `arena/7efbfaa5-0815games-github-io` (lokal,
  Push und PR siehe Nachtrag). Nicht veröffentlicht. Die Abweichung „eigene Werkzeuge“ aus
  TTT-0002 ist damit behoben.
- Offen / nächster Schritt:
  1. Betreiber: Regeln veröffentlichen (`docs/FIREBASE.md`, Schritte 1 bis 5).
  2. Betreiber: Autorisierte Domains in Firebase Auth prüfen.
  3. Anmeldung auf einem Gerät prüfen, Ergebnis als Nachtrag.
  4. Entscheidung Standort RTDB (`europe-west1` angelegt, ADR-005 nannte Frankfurt).
  5. Emulator-Tests für die Regeln einrichten, sobald Java verfügbar ist.

### Ereignis-Nachtrag zu TTT-0003

- Commit: `c5ddda63` (siehe oben), lokal angelegt.
- Push: `git push origin arena/7efbfaa5-0815games-github-io` ausgeführt, Ausgabe
  `3399cef9..c5ddda63` (Fast-forward, Exit 0). Branch auf GitHub zeigt `c5ddda63`.
- PR: nicht erstellt. Veröffentlichung der Regeln: nicht erfolgt.
- CI-Lauf des neuen Workflows: noch nicht beobachtet.

## TTT-0004 – Branch mit `main` abgeglichen, veraltete Ordner entfernt (Welle `20261124-konto1`)

- Zeit / Quelle: Sitzung 2026-11-24 (UTC). Git-Stand vor und nach dem Merge.
- Block / Ziel: Nutzerfrage: „Was suchen wir im Verzeichnis `ufo/`?“ Antwort: Der Ordner
  gehört zu einem Spiel, das `main` in `d058e038` („UFO-Jagd und Neon Pong entfernt“) gelöscht
  hat. Der Branch trug ihn noch aus seiner Basis `ee9daa4`. Dort kamen die Geheimnis-Funde aus
  TTT-0003 her (Google-API-Schlüssel in alten Backup-Dateien). Ebenso fehlte `vendetta/`.
- Branch / Basis: `arena/7efbfaa5-0815games-github-io`. Basis war `ee9daa4`, `origin/main` jetzt `e4e2cb9e`.
- Änderungen: `git merge origin/main` (kein Rebase, keine Umschreibung der Historie). Merge-Commit
  `3fe9ed27`. Entfernt wurden durch den Merge `ufo/` (111 Dateien) und `vendetta/`. Unsere Dateien
  unter `tiny-tycoon-towns/` und `.github/workflows/tiny-tycoon-towns-patch.yml` waren von `main` nicht berührt.
- Prüfungen (lokal, Node 22.22.3):
  - `npm run check:suite`: Exit 0, „Kein Fehler, 0 Hinweis(e)“.
  - Geheimnisse: 4765 neue Zeilen gegen den Abzweigpunkt `e4e2cb9e` geprüft, kein Muster.
  - `npm test`: 44 pass, 0 fail (über die Suite belegt).
  - `npm run rules:check`: Regeln OK, Exit 0.
- Git / PR / Veröffentlichung: Push siehe Nachtrag. Kein PR. Nicht veröffentlicht.
- Offen: wie in TTT-0003 (Regeln veröffentlichen, Domains prüfen, Gerätetest, Standort, Emulator).

### Ereignis-Nachtrag zu TTT-0004

- Push: `git push origin arena/7efbfaa5-0815games-github-io`, Ausgabe `2efc81ce..82f7e906` (Fast-forward, Exit 0).
- PR: nicht erstellt.

## TTT-0005 – „Stadt wird geladen …“ hängt nicht mehr (Welle `20261124-konto2`)

- Zeit / Quelle: Sitzung 2026-11-24 (UTC). Meldung des Betreibers: Spiel startet, Erstellen und Anmelden
  funktionieren, danach bleibt der Bildschirm auf „Stadt wird geladen …“.
- Ursache (aus dem Code, nicht im Live-Projekt belegt): `onUser` wartete ohne Zeitlimit auf
  `cloud.loadTown`. Antwortete die Realtime Database nicht, blieb die Anzeige stehen, und der lokale
  Stand war nicht spielbar. Fehler beim Anzeigen wurden nur in der Konsole sichtbar.
- Änderungen:
  - `src/async-util.js` (neu): `withTimeout`, getestet mit `tests/async-util.test.mjs` (3 Tests).
  - `src/main.js`: Cloud-Lesen mit 10 s Zeitlimit. Ohne Antwort mit lokalem Stand weiterspielen,
    Speichern in die Cloud erst nach erfolgreichem Lesen (kein Überschreiben neuerer Stände).
    Ohne lokalen Stand: Meldung mit Grund und Knopf „Erneut versuchen“. Im Hintergrund wird die Cloud
    erneut gelesen; ein neuerer Cloud-Stand gewinnt. Fehler beim Anzeigen werden sichtbar.
    Unbehandelte Fehler erscheinen als Hinweis.
  - `src/cloud.js`: `onConnected` (`.info/connected`) für die Verbindungsanzeige.
  - Cache-Welle `20261124-konto2` (`bump --apply`), Feldnotizen-Eintrag ergänzt.
- Prüfungen (lokal, Node 22.22.3):
  - `npm test`: 47 Tests, 47 pass, 0 fail.
  - `npm run check:suite`: Exit 0.
  - Oberflächentest in jsdom (ad hoc, nicht im Repo): echte `index.html` und `src/main.js` mit
    `cloud.js`, Firebase-Module durch Stubs ersetzt.
    - Lesen hängt, kein lokaler Stand: nach 10 s Meldung „Zeitlimit“ und Knopf „Erneut versuchen“.
    - Lesen hängt, lokaler Stand vorhanden: Spiel läuft mit 100 Feldern weiter.
    - Lesen liefert nichts: Gründungsdialog erscheint, keine Fehler.
  - Rundlauf-Test Domäne (ad hoc): Stand mit Gebäuden und Verkaufsschalter durch RTDB-ähnliches
    Entfernen leerer Werte und `hydrateTown` ergibt 0 Abweichungen.
  - Grenzen: Die Stubs ersetzen Firebase. Ein echter Browser und das Live-Projekt sind nicht geprüft.
    Ob die Regeln im Live-Projekt veröffentlicht sind, ist nicht bekannt.
- Git / PR / Veröffentlichung: siehe Nachtrag. Nicht gemergt, nicht veröffentlicht.
- Offen: Regeln veröffentlichen (`docs/FIREBASE.md`), Domains prüfen, Test im echten Browser.

## TTT-0006 – Welt, Anmeldung, Versions-Gate, Tutorial (Welle `20261124-welt1`)

- Zeit / Quelle: Sitzung 2026-11-24 (UTC). Auftrag des Betreibers: Kachel-Optik ersetzen durch eine große,
  animierte Spielwelt; Anmeldung als erster Bildschirm; IronPath-Patch-Logik übernehmen; Pinch-Zoom am Handy;
  Abmelden mit Rückfrage; keine doppelte Anmeldung; Tutorial einmal pro Konto mit Hilfe-Übersicht; Neuerungen
  nach einem Update.
- Änderungen (Commits auf `arena/28851d80-0815games-github-io` bzw. `arena/4f82f7fb-0815games-github-io`):
  - PR #393 gemergt (`b5870ea1`): Canvas-Weltansicht (`src/world/`), Anmeldung mit animierter Insel
    (`src/world/login-scene.js`), Versions-Gate aus IronPath (`src/version-check.mjs`, `src/version-ui.mjs`,
    `src/bounded-json.mjs`), `release-version.json` im Format 1, ADR `docs/ADR-world-rendering.md`,
    `docs/ADR-update-gate.md`.
  - `5df987c`: Pinch-Zoom (zwei Finger) in `src/world/board.js`; Rückfrage beim Abmelden; Sperre gegen doppelte
    Anmeldung im selben Browser über `BroadcastChannel` (`ttt-session`).
  - `cc50336`: Tutorial (8 Schritte, `src/tutorial.js`), Fortschritt als `town.tutorialStep` mit dem Konto
    gespeichert, Aktion `setTutorialStep` in `src/domain/engine.js`; Hilfe-Button mit Übersicht aller Regeln.
  - `4a45967`: Cache-Welle `20261124-welt1` (`bump --apply`, 14 Dateien, 5 Anker); Neuerungen-Dialog einmal
    pro Browser und Version (`ttt:notes-seen`), danach das Tutorial; Feldnotizen-Eintrag DE/EN.
- Prüfungen (lokal, Node 22.22.3):
  - `node --test tests/*.test.mjs`: 57 Tests, 57 pass, 0 fail (neu: `version-check`, `tutorial`).
  - `node scripts/patch.mjs check --fast`: kein Fehler, Hinweise zu Branch und flachem Klon.
  - Oberflächenlauf in jsdom (ad hoc, nicht im Repo, Stand vor `4a45967`): Anmeldebildschirm sichtbar,
    Spiel nach Anmeldung klickbar, Auswahl per Klick und Pfeiltaste, keine Fehler.
- Grenzen, nicht geprüft:
  - Kein echter Browser. Pinch-Zoom, Anmeldung am Handy, Tutorial-Hervorhebung und Neuerungen-Dialog sind nur
    im Code und in Tests belegt, nicht gesehen.
  - Der Harness für den Oberflächenlauf ist nach dieser Sitzung nicht mehr vorhanden.
  - Anmeldung über Geräte hinweg (IronPath-Sitzungssperre in der Datenbank) fehlt. Dafür braucht es
    Datenbankregeln und eine Veröffentlichung.
  - Offline-Start wird vom Versions-Gate blockiert, wie bei IronPath. Entscheidung offen.
  - Regeln sind nicht veröffentlicht; ob sie im Live-Projekt liegen, ist unbekannt.
- Veröffentlichung: Code liegt auf dem Branch, nicht auf `main`. Kein Merge ohne Freigabe.
- Offen: Browser-Test der neuen Welle, Entscheidung zum Offline-Start, Regeln veröffentlichen
  (`docs/FIREBASE.md`), geräteübergreifende Sitzungssperre.

### Nachtrag TTT-0006 (vor Merge, Welle `20261124-welt1` unverändert)

- Zeit / Quelle: Sitzung 2026-11-24 (UTC). Auftrag des Betreibers: kein Offline-Start, Datenbankregeln
  bereitstellen, IronPath-Verweise aus den Spieltexten entfernen.
- Änderungen (Commit 304d798):
  - `src/main.js`: Ist der Cloud-Stand nicht lesbar, bleibt das Spiel gesperrt (Wiederholen-Knopf). Der
    lokale Stand wird nicht mehr gespielt, bleibt aber als Sicherung erhalten.
  - `src/patch-notes.mjs`, `index.html`, `style.css`, Kommentare: Verweise auf IronPath entfernt, die
    Spieltexte nennen IronPath nicht mehr.
  - Regeln (`firebase/database.rules.json`) unverändert. Geprüft: alle Felder des Spielstands sind erlaubt.
- Prüfungen: 57 Tests grün, `check --fast` ohne Fehler, `rules:check` ohne Live-Export: Struktur OK.
- Offen: Regeln in der Konsole oder per CLI veröffentlichen (`docs/FIREBASE.md`, Schritte 1 bis 5).

## TTT-0007 – Anmeldung über alle Geräte nur einmal (Welle `20261124-sitz1`)

- Zeit / Quelle: Sitzung 2026-11-24 (UTC). Auftrag des Betreibers: Doppelanmeldung auch über verschiedene
  Browser und Geräte verhindern, und die Regel dafür in den Firebase-Regeln absichern.
- Änderungen (Commit d8fd459):
  - `firebase/database.rules.json`: neuer Pfad `sessions/{uid}` (nur Inhaber, Felder `id` und `at`, unbekannte
    Felder abgewiesen).
  - `src/cloud.js`: `claimSession` (Transaktion, Ablauf nach 120 s ohne Herzschlag), `releaseSession`,
    `watchSession`.
  - `src/main.js`: Herzschlag alle 30 s. Ein zweites Fenster bekommt „Hier übernehmen“. Das bisherige Fenster
    speichert nichts mehr und bietet selbst „Hier übernehmen“ an. Kennung pro Tab in `sessionStorage`,
    damit Neuladen nicht sperrt. Der Browser-Kanal aus TTT-0006 ist ersetzt.
  - `scripts/rules-publish-dry-run.mjs`: kennt `sessions/{uid}` und prüft die Eigentümerregeln.
  - Welle `20261124-sitz1` (bump --apply, 14 Dateien), Neuerungen-Eintrag DE/EN, Hilfe-Text angepasst.
  - `docs/FIREBASE.md`: Hinweis, dass die Regeln vor der Welle veröffentlicht werden müssen.
- Prüfungen: 58 Tests grün. `rules:check` ohne Live-Export: OK, Struktur. `check --fast` ohne Fehler.
- Grenzen, nicht geprüft: kein echter Browser, kein Test über zwei Geräte. Die Sperre hängt an den
  Gerätezeiten (Zeitstempel vom Client). Eine Abweichung von mehreren Minuten kann die Sperre verkürzen.
- Vor dem Merge: Regeln in Firebase veröffentlichen. Ohne Regeln schlägt die Anmeldung fehl.

### Nachtrag TTT-0007 – App-Icon (vor Merge, Welle `20261124-sitz1`)

- Zeit / Quelle: Sitzung 2026-11-24 (UTC). Auftrag: sauberes Icon für iOS und andere Geräte, statt Haus-Symbol.
- Änderungen: `icons/` (Apple-Touch-Icon 180, 192, 512, Favicon 32, undurchsichtig), `manifest.webmanifest`,
  Icon- und Manifest-Verweise plus Apple-Web-App-Angaben in `index.html`. Das Quellbild (1024 px, 1,7 MB)
  liegt nicht im Repo.
- Prüfungen: 58 Tests grün, `check --fast` ohne Fehler. Auf dem iPhone noch nicht gesehen.

### Nachtrag TTT-0007 – Logo und Intro (vor Merge, Welle `20261124-sitz1`)

- Auftrag: Logo auf der Anmeldeseite und ein Intro (Animation), das bisher fehlte.
- Änderungen: `icons/logo.png` (512 px, Emblem ohne Schrift, Titel als Text), Intro in `index.html`
  (`#auth-intro`) und `style.css` (Keyframes, Reduce-Motion-Fallback), `playIntro()` in `src/main.js`
  (einmal pro Seitenaufruf, Klick oder Taste überspringt, ca. 3,6 s). Logo in der Anmeldekarte.
- Prüfungen: 58 Tests grün, `check --fast` ohne Fehler. Auf dem Bildschirm noch nicht gesehen.

### TTT-0008 – Fehler Hilfe und Tutorial (Welle `20261124-sitz2`)

- Befund: Nach dem Merge von #395 brach der Start mit `ReferenceError: showHelp is not defined` ab. Dadurch
  fehlten auch Intro und Anmeldung. Ursache: Beim Umbau der Sitzungssperre (TTT-0007) wurde ein zu großer
  Textblock ersetzt, in dem `showHelp`, `showTutorialStep` und `endTutorial` standen. Die Funktionen waren
  danach nicht mehr definiert.
- Behebung: Die drei Funktionen neu geschrieben. Tutorial-Fortschritt wird wieder über `setTutorialStep`
  gespeichert (der Import war vorhanden, der Aufruf fehlte).
- Prüfung: eslint `no-undef` über `src/` ohne Befund (vorher 4). 58 Tests grün. `check --fast` ohne Fehler.
- Lehre: Vor dem Merge alle Funktionsaufrufe mit `no-undef` prüfen. Das deckt diesen Fehler sofort auf.
- Im Browser noch nicht getestet. Offen für den Betreiber: Test auf dem Handy (Intro, Hilfe, Tutorial).

### TTT-0009 – Neues Logo (Welle `20261124-sitz3`)

- Auftrag: das bisherige Logo (eckiger Block) ersetzen. Gewünscht: Stadt im Hintergrund, Spielname darüber.
- Änderungen: `icons/logo.png` (640 px, abgerundetes Wappen, Stadtbild, Name „TINY TYCOON / TOWNS“ in DejaVu Sans Bold,
  erzeugt mit ImageMagick). Intro zeigt Logo und Untertitel, der Titel steht nicht mehr doppelt. Quelldateien
  nicht im Repo.
- Prüfungen: 58 Tests grün, `check` ohne Fehler, lint `no-undef` ohne Befund. Auf dem Bildschirm noch nicht gesehen.

### TTT-0010 – Logo ohne Kasten (Welle `20261124-sitz4`)

- Auftrag: kein eckiger Block mehr. Das Logo soll frei stehen und sich ins Bild einfügen.
- Änderungen: `icons/logo.png` (transparent, freigestellte Stadt mit Name darüber), `icons/town.png` (nur die Stadt,
  für die kleine Anmeldekarte). Quelldateien nicht im Repo.
- Prüfungen: 58 Tests grün, `check` ohne Fehler, lint `no-undef` ohne Befund.

### TTT-0011 – Oberfläche: Werte auf der Karte, Menü (Welle `20261124-sitz5`)

- Auftrag: Die Knöpfe oben stören. Ressourcen sollen als Anzeige auf der Karte stehen.
- Änderungen: Münzen, Stadtlevel und Stadtname schweben als Pillen auf dem Spielfeld. Hilfe, Feldnotizen,
  Neu beginnen und Abmelden liegen im Menü oben rechts (`#menu-btn`, `#menu-list`). Die Hilfe-Markierung im Tutorial
  zeigt jetzt auf das Menü.
- Prüfungen: 58 Tests grün, `check` ohne Fehler, lint `no-undef` ohne Befund. Im Browser noch nicht geprüft.

### TTT-0012 – Vollbild-Karte, Feld-Popup, Lager-Dialog (Welle `20261124-sitz6`)

- Auftrag: Karte füllt den Bildschirm. Lager und Geld raus aus der Karte. Nach dem Feldklick ein kleines Fenster mit
  durchblätterbaren Bauoptionen.
- Änderungen: Karte füllt den Container (`board.js` nutzt die volle Höhe). Feld-Popup (`#panel`, unten mittig) mit
  ‹ › für die Bauoptionen und ✕ zum Schließen, Escape schließt es. Lager, Münzen und Händler im Dialog `#stock-sheet`,
  geöffnet über `#stock-btn` (unten links). Tutorial-Ziele angepasst.
- Prüfungen: 58 Tests grün, `check` ohne Fehler, lint `no-undef` ohne Befund, alle statischen IDs in `main.js` vorhanden.
- Im Browser noch nicht geprüft. Offen: Verhalten auf schmalen Bildschirmen, Lesbarkeit der Pillen über der Karte.

### TTT-0013 – Betreiber-Bereich (Welle `20261124-sitz7`)

- Auftrag: Admin-Panel zum Kontrollieren des Spiels. Einbindung über die Anmeldeseite, eigene Anmeldemaske, Rechte
  nur für die angegebene UID. Optik wie das Spiel.
- Änderungen: `admin.html` und `src/admin.js` (Anmeldung, Spielerliste, Stadt-Editor: Stadt, Lager und Verkauf,
  Zeit vorspulen, Händler-Angebote, Gebäude je Feld, Speichern, Stadt löschen). `src/cloud.js`: `isAdmin`, `listSaves`.
  Login-Seite: Link „Betreiber-Anmeldung“. Regeln: `admins/{uid}` und Admin-Lese- und Schreibrechte auf `saves`.
- Regel-Trockenlauf kennt `admins`. Tests für Eigentümerprüfung von `admins` ergänzt. 59 Tests grün.
- Vor der Nutzung: Regeln veröffentlichen und den `admins`-Eintrag anlegen (siehe `docs/FIREBASE.md`).
- Im Browser noch nicht geprüft.
