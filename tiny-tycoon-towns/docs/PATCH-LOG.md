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

### Ereignis-Nachtrag: PR und Merge (TTT-0003 bis TTT-0004)

- PR: #392 von `arena/7efbfaa5-0815games-github-io` nach `main`, erstellt.
- Checks vor dem Merge: `patch-check` (GitHub Actions) pass, Vercel-Preview pass, Mergestatus CLEAN.
- Merge: `gh pr merge 392 --merge`, Merge-Commit `e631efac`, Zeit 2026-11-24 07:31:38 UTC.
- Pages-Build für `e631efac`: Status `built`. Ein Abruf von `https://0815games.github.io/tiny-tycoon-towns/`
  war aus der Sandbox nicht möglich (keine Verbindung zu github.io), also nicht im Browser geprüft.
- Nicht geprüft: Oberfläche im Browser (kein Browser in der Sandbox). Regeln nicht veröffentlicht.
