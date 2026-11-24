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
