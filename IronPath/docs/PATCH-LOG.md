# Iron Path – Patch-Log

Dieses Protokoll ist der dauerhafte Einstiegspunkt für zukünftige Änderungen.
Es ergänzt den [Patchplan](PATCH-BLOECKE.md) und das [Datenblatt](DATENBLATT.md),
aber ersetzt weder Git noch die GitHub-PR-Historie. Die dazugehörige
[Arbeitsanweisung](../../AGENTS.md) verlangt, dieses Log vor der Arbeit zu lesen
und nach jedem in sich abgeschlossenen Schritt fortzuschreiben.

Die Einträge IPL-0001 bis IPL-0108 stehen im
[Archiv](PATCH-LOG-ARCHIV.md); hier stehen die neuesten 20. Beide Dateien
zusammen sind lückenlos und doppelfrei - `../scripts/patch.mjs` (Unterbefehl `check`) und
`../tests/patch-log-archive.test.mjs` prüfen das.

## So wird protokolliert

- **Jede logische Änderung:** Was und warum, betroffene Dateien, Tests mit
  tatsächlichem Ergebnis, verbleibende Risiken und Blockzuordnung.
- **Git/GitHub und Betrieb:** Branch und Basis; nach Commit, Push, PR,
  CI, Merge und Deployment jeweils ein zusätzliches Ereignis mit Hash,
  PR-/Job-Link und belegtem Ergebnis. Keine vermuteten Ereignisse eintragen.
  Ein lokal geändertes Log ist nicht automatisch gepusht oder veröffentlicht.
- **Status genau benennen:** `lokal/uncommittet`, `committet`, `gepusht`,
  `PR offen`, `gemergt`, `ausgeliefert` oder `abgenommen`; diese Zustände sind
  nicht austauschbar. Bei ausstehenden oder fehlgeschlagenen Tests dies nennen.
- **Datierung:** Das vorgegebene Sitzungsdatum ist 2026-10-31 UTC. Die
  abgefragte Umgebungsuhr zeigte 2026-11-15 bzw. 2026-11-16 UTC und GitHub
  meldete eigene Zeitstempel. Diese abweichenden Quellen getrennt angeben; die
  Reihenfolge anhand von Commits/PRs prüfen. Ein Build-Token ist kein Nachweis
  für einen Releasetag.
- **Keine Geheimnisse oder privaten Daten:** Keine Passwörter, Tokens, UIDs,
  Freundes-/Partycodes, privaten Profile oder Firebase-Schlüssel protokollieren.
- Ein Commit kann seinen eigenen endgültigen Hash nicht im selben Commit
  enthalten. Nachträgliche Git-/PR-Ereignisse werden deshalb als neuer Eintrag
  ergänzt und bei einem später freigegebenen Commit mitgenommen. Kein Commit,
  Push, Merge oder Release wird allein durch diesen Hinweis beauftragt.
- Es gibt keinen automatisch installierten Git-Hook. Änderungen außerhalb
  dieses Arbeitsablaufs können fehlen und müssen bei Bedarf aus Git/GitHub
  nachgetragen werden.

### Vorlage für einen neuen Eintrag

Die Vorlage steht als einzige Quelle in
[patch-log-vorlage.md](patch-log-vorlage.md), zusammen mit der Erklärung, was in
jedes Feld gehört und was nicht hineindarf. Eine Kopie hier würde auseinanderlaufen.















## IPL-0116 – Sicherheit: Zuwachs-Deckel pro Schreibung in den Fortschritts-Regeln (Publish-Datei, Betreiber veröffentlicht)
- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber: „Dann nimm den mündlichen Teil raus aus deiner Prüfung und danach weiter." Der menschliche Balance-Eindruck ist damit aus der offenen Liste gestrichen (Block E gilt als abgeschlossen); danach Punkt 2 der Reihenfolge in `docs/AUSBAU-PLAN.md`.
- **Block / Ziel:** Sicherheit. Die Live-Regeln begrenzten Fortschritt nur über Monotonie und Obergrenze: Ein manipulierter Client konnte XP (→10.000.000), Bestenlisten-Welle (→10.000), Endlos-Zähler und Scrap in einer einzigen Schreibung ans Limit setzen.
- **Branch / Basis:** `arena/e1cf6356-0815games-github-io` ab `23225689dd9077fb9332248530bf739d5a8e8f43` (`main`, Merge PR `#377`).
- **Änderungen / Dateien:**
  - `IronPath/docs/AUSBAU-PLAN.md` / `PATCH-BLOECKE.md`: Menschlicher Balance-Teil aus den offenen Punkten entfernt (Betreiber-Entscheid; bleibt sein Eindruck im Spiel, kein Prüfposten). Block E damit abgeschlossen bis auf Emulator-Transportfälle.
  - `IronPath/firebase/progression-delta-candidate.mjs` (neu): `applyProgressionDeltaCaps` verschärft exakt sieben `.validate`-Zeilen und bricht bei jeder Abweichung vom geprüften Ausgangstext ab (Drift-Schutz). Deckel: XP +5.000 (ehrlich max. 1.020/Welle), `storyProgress` +1, `endlessRuns` +1, `endlessWaves` +1.000, `endlessBosses` +200, Scrap-Zuwachs +1.000 (Ausgeben frei), Bestenlisten-Welle +500 (Erstwert ≤ 500).
  - `IronPath/firebase/PROGRESSION-DELTA-CAPS-TO-PUBLISH.json` (neu): aus dem aktuellen Live-Stand (`ENDLESS-LAST-RUN-TO-PUBLISH.json`) generiert; Python-Diff beweist exakt 7 geänderte Blätter, keine neuen/entfernten Schlüssel. `WORKSHOP-RULES-TO-PUBLISH.json` unberührt.
  - `IronPath/firebase/PROGRESSION-DELTA-ROLLOUT.md` (neu): Publish-Anleitung mit Deckel-Tabelle und Rückfallweg.
  - `IronPath/tests/progression-delta-rules.test.mjs` (neu, 3 Tests): Publish-Datei = Basis + Kandidat (reproduzierbar), Deckel über ehrlichem Spiel und unter dem Ein-Schreibungs-Sprung, Drift-Abbruch.
  - `IronPath/firebase/rules-test/progression-delta-rules.test.mjs` (neu) + `firebase-delta.emulator.json` + npm-Skript `test:delta-caps` + CI-Schritt in `.github/workflows/ironpath-firebase-rules.yml`: Emulator-Beweis gegen die exakte Publish-Datei (ehrliche Schreibungen durch, Sprünge abgelehnt, Scrap-Ausgeben frei).
  - Log-Rotation `IPL-0096` ins Archiv (Haupt `IPL-0097…IPL-0116`, Archiv bis `IPL-0096`).
- **Prüfungen:** Pin-Test 3/3; `rules-publish-dry-run.mjs` gegen den Live-Stand mit Kandidat: 0 Blocker, exakt 7 Prüfpunkte (die sieben beabsichtigten Zeilen). Emulator-Beweis läuft in der CI (`database-rules`), lokal kein Java/Emulator. `patch.mjs check --fast`: 0 Fehler. Gesamtsuite 1310 Tests, 1309 bestanden + 1 bekannter Flachklon-Skip (`release-pages-site` nach Unshallow gezielt 6/6) – effektiv 1310/1310.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet`. Commit, Push, PR, CI und Merge werden nach tatsächlichem Ereignis nachgetragen. **Die Regeln selbst veröffentlicht der Betreiber** (Datei + Anleitung oben); erst seine Meldung macht den Schutz live.
- **Offen / nächster Schritt:** Betreiber-Publish der Delta-Datei. Danach Punkt 3: Sektor-Modifikatoren für Endlos-Identität.

## IPL-0117 – Sektor-Modifikatoren: Panzerkolonne, Luftherrschaft, Eisensturm (Welle `20261123-sector1`, PR `#379`)
- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber: „Regeln published, weiter geht's" – die Zuwachs-Deckel aus `IPL-0116` sind damit live (in `AUSBAU-PLAN.md` abgehakt), danach Punkt 3 der Reihenfolge.
- **Block / Ziel:** Endlos-Identität. Rückzugs-Sektoren unterschieden sich bisher nur über Kartengröße und Zahlen-Skalierung (+12 % Leben/+5 % Tempo je Stufe); jetzt hat jede Stufe einen erkennbaren Gegner-Schwerpunkt, auf den man sich beim Wiederaufbau einstellt.
- **Branch / Basis:** `arena/8b777781-0815games-github-io` ab `e627363b7949807ed28e47faa4509caae1b09552` (`main`, Merge PR `#378`).
- **Änderungen / Dateien:**
  - `IronPath/core/combat.mjs`: `SECTOR_MODIFIERS` (Sektor 2 `armor` „Armor Column", Sektor 3 `air` „Air Superiority", Sektor 4 `storm` „Iron Storm", jeweils mit Aufklärungs-Satz) und `sectorFormation(formation, sector)`: reine Ableitung aus der Sektorstufe – jede dritte leichte Einheit (Infanterie/Scout) wird zum Panzer (S2), jede dritte Bodeneinheit zum Flugzeug (S3), im Eisensturm abwechselnd Panzer/Flugzeug (S4). Bosse werden nie umgewandelt, Wellenlänge bleibt, Sektor 1 und alle Nicht-Sektor-Felder unverändert.
  - `IronPath/core/simulation.mjs`: Die Spawn-Formation läuft durch `sectorFormation`, aber nur im Solo-Feld (bei `individualSupplies`/`hostId` gilt Sektor 0) – Koop-/Versus-Balance bleibt unangetastet, die Sektor-Kette des Solo-Endlos trägt die Identität.
  - `IronPath/game.js` + `i18n/localization-battle-de.mjs`: Die Funk-Übertragung beim Sektor-Rückzug nennt jetzt den nächsten Sektor und die Gegenmaßnahme („Intel on the next sector: …"), DE vollständig.
  - `IronPath/tests/sector-modifiers.test.mjs` (neu, 4 Tests): Modifikator-Tabelle, Umwandlungsregeln (Boss/Länge unverändert), echte Spawn-Probe Sektor 1 vs. 2 (gleiche Wellengröße, mehr Panzer), Funk-Anker in `game.js`.
  - Cache-Welle `20261123-sector1` (79 Dateien), Feldnotizen `sector1` in `patch-notes.mjs`; Log-Rotation `IPL-0097` ins Archiv (Haupt `IPL-0098…IPL-0117`, Archiv bis `IPL-0097`).
- **Prüfungen:** `sector-modifiers` 4/4; Balance-Gegenprobe `balance-suite` + `coop-balance` + `endless` + `combat` 20/20 (die neuen Formationen kippen keine gesetzte Marke). `patch.mjs check --fast`: 0 Fehler. Gesamtsuite 1314 Tests, 1313 bestanden + 1 bekannter Flachklon-Skip (`release-pages-site` nach Unshallow 6/6) – effektiv 1314/1314.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet`. Commit, Push, PR `#379`, CI, Merge und Pages-Auslieferung werden als Ereignis nachgetragen.
- **Offen / nächster Schritt:** Punkt 4 der Reihenfolge: Scrap-Senke fürs Spätspiel und Kampagnen-NG+ über das vorhandene Druck-System.

## IPL-0118 – Scrap-Senke „Kriegsanstrengung" + Kampagnen-NG+ „Prestige" (Welle `20261123-prestige1`, PR `#380`)
- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber: „Weiter" – Punkt 4 der Reihenfolge in `AUSBAU-PLAN.md` (4a + 4b in einem Paket, weil beide dieselbe Regel-Veröffentlichung teilen).
- **Block / Ziel:** Langzeit-Fortschritt. (4a) Veteranen-Scrap wuchs nach 6×3 Armory-Rängen und vier Werkstatt-Rezepten nutzlos weiter; (4b) die Kampagne war nach dem Durchspielen nur noch unveränderte Wiederholung. Jetzt: Scrap als gespeichertes Spenden-Ziel mit Logistik-Belohnung, und abgeschlossene Missionen als Prestige-Wiederholung auf dem vorhandenen Bedrohungs-/Druck-System — ohne neue Währung.
- **Branch / Basis:** `arena/e1a82046-0815games-github-io` ab `1e35ad86cc08c32a71ba5441f4feba77d12989ae` (`main`, Merge PR `#379`).
- **Änderungen / Dateien:**
  - `IronPath/core/war-effort.mjs` (neu): `warEffort` auf dem Profil — Spenden à 250 Scrap (Transaktions-Reducer `donateWarEffort`, Obergrenze 1.000/Schreibung), Ziel 5.000 = 10 Stufen à 500, abgeleitete Belohnung +3 Startvorräte je Stufe (`warEffortBonus`, Vokabular wie Relikte). `solo-deployment.mjs` zahlt den Bonus auf beiden Solo-Pfaden (Legacy + Werkstatt); Mehrspieler bleibt unberührt.
  - `IronPath/core/campaign-pressure.mjs`: `prestigeScale(tier)` — Stufe 1–10: Gegner-Leben +15 %/Stufe, Bunkerschaden +10 %/Stufe, Ansturm +1/Stufe (max. 4), Wellenvertrag und Bunker unverändert. `solo-deployment.mjs` stapelt die Stufe auf den Missionsvertrag (`prestige`/`surgeBonus` im Vertrag; `match.mjs` wertet den Bonus nur an Ansturm-Wellen aus); Trainingsvertrag trägt nie Prestige.
  - `IronPath/core/campaign-prestige.mjs` (neu): Profil-Leiter `campaignPrestige` — `recordPrestigeClear` zählt nur die nächste Sprosse und zahlt 150–600 Bonus-Scrap in den Armory-Bestand.
  - Client: `account.js` — Armory-Karte „War Effort" (Stufe, Fundstand, Spenden-Button mit Bestätigung, Sandbox-fähig) plus zwei eigene Transaktionen (`saveWarEffortDonation`, `recordPrestigeRecord` nach dem `endlessLastRun`-Muster: eigene Schreibung, schaltet sich bei Regel-Ablehnung für die Sitzung ab, blockiert nie andere Speicherungen). `game.js` + `index.html`: Druck-Auswahl im Missions-Briefing (nur abgeschlossene Missionen, bis Leiter+1), Aufklärungs-Zeile im Schnellstatus, Prestige-Vermerk beim Sieg. DE-Texte in `localization-armory-de.mjs`/`localization-battle-de.mjs` vollständig.
  - Regeln (additiv, Betreiber veröffentlicht): `firebase/prestige-effort-candidate.mjs` erzeugt `PRESTIGE-EFFORT-TO-PUBLISH.json` aus dem live Stand `PROGRESSION-DELTA-CAPS-TO-PUBLISH.json` — Diff exakt zwei neue Profilfelder (`campaignPrestige`: monoton, +1/Schreibung, ≤10; `warEffort`: monoton, +1.000/Schreibung, ≤50.000), byte-genau reproduzierbar, Drift-Abbruch. Dazu `PRESTIGE-EFFORT-ROLLOUT.md`, Pin-Test, Emulator-Beweis (`rules-test/prestige-effort-rules.test.mjs`, `firebase-prestige.emulator.json`, npm-Skript `test:prestige-effort`, CI-Schritt in `database-rules`). `WORKSHOP-RULES-TO-PUBLISH.json` unberührt. Trockenlauf `rules-publish-dry-run.mjs`: 0 Blocker, exakt 2 neue Pfade.
  - Cache-Welle `20261123-prestige1` (81 Dateien), Feldnotizen `prestige1` in `patch-notes.mjs`; Log-Rotation `IPL-0098` ins Archiv (Haupt `IPL-0099…IPL-0118`, Archiv bis `IPL-0098`); `AUSBAU-PLAN.md`: Punkt 3 abgehakt, 4a/4b auf `[~]` (Publish offen).
- **Prüfungen:** `war-effort` 4/4, `campaign-prestige` 5/5, `prestige-effort-rules` 3/3 (Kern- und Pin-Tests; Emulator-Beweis läuft als CI-Schritt `test:prestige-effort`). Die 13 UI-Harnische bekamen die zwei neuen Modulpfade in ihre Umschreibe-Listen; der Cache-Token-Test verlangte für `armory.mjs` den etablierten `tagless1`-Token auch in den neuen Modulen. `patch.mjs check --fast`: 0 Fehler. Gesamtsuite 1326 Tests, 1325 bestanden + 1 bekannter Flachklon-Skip (`release-pages-site` nach Unshallow 6/6) – effektiv 1326/1326; darin die unveränderte Balance-Suite als Gegenprobe (Prestige/War-Effort steht bei Profilen ohne die Felder auf null).
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet`. Commit, Push, PR `#380`, CI, Merge und Pages-Auslieferung werden als Ereignis nachgetragen. Die Persistenz wird erst mit der Regel-Veröffentlichung durch den Betreiber live (Anleitung `PRESTIGE-EFFORT-ROLLOUT.md`, Rückfall = `PROGRESSION-DELTA-CAPS-TO-PUBLISH.json`).
- **Offen / nächster Schritt:** Betreiber veröffentlicht die Regeln; danach Punkt 5: 6-stellige Party-Codes.

## IPL-0119 – Sechsstellige Party-Codes (Welle `20261123-party6`, PR `#381`)
- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber: „Regeln sind [veröffentlicht], erklär mir aber bitte noch mal den Hintergrund …" — die Prestige-/War-Effort-Regeln aus `IPL-0118` sind damit live (in `AUSBAU-PLAN.md` abgehakt) — danach auf Nachfrage und ausdrücklichen Bauauftrag Punkt 5. Hintergrund: Der vierstellige Code-Raum (10.000) ist von jedem kostenlosen Konto in Sekunden aufgezählt (im eigenen `FOUR-DIGIT-STAGING.md` als ungelöste Missbrauchsfläche geführt; Regeln können nicht drosseln). Code-Kenntnis gibt keine Match-Rechte (Host-Freigabe bleibt das Tor), aber Spam-Anfragen an alle offenen Partys und triviale Kollisionen. Sechs Stellen = Faktor 100.
- **Block / Ziel:** Party-Einladungen. Erzeugung sechsstellig in beiden Lobbys, Beitritt und Freundes-Einladungen akzeptieren 4 oder 6 Stellen (Alt-Codes laufen mit ihrer Sitzung aus), Einladungs-Ablauf unverändert.
- **Branch / Basis:** `arena/c92634ee-0815games-github-io` ab `16105d049f50789c8ae2d94c25cca42b3160f9a2` (`main`, Merge PR `#380`) plus Doku-Commit „Punkt 4a/4b abgehakt".
- **Änderungen / Dateien:**
  - `IronPath/net/firebase-four-digit-lobby.mjs` + `firebase-four-lobby.mjs`: `code()` zieht aus 1.000.000 (ablehnungsbereinigt), `validCode` akzeptiert `4|6` Stellen; Erzeugung fällt bei verweigertem Sechs-Stellen-Schlüssel sitzungsweise auf vier Stellen zurück (endlessLastRun-Muster), statt die Party scheitern zu lassen — bis der Betreiber die neuen Regeln veröffentlicht. Dateinamen bleiben (historisch), Fehlertext heißt jetzt „Invalid party-code lobby".
  - `IronPath/core/coop-invites.mjs` (2 Stellen), `net/firebase-four-digit-panel.mjs`, `net/firebase-four-panel.mjs`, `core/tutorial.mjs`, `index.html` (beide Code-Eingaben `maxlength=6`, Hinweise „six-digit"), DE-Texte in `localization-de.mjs`/`localization-more-static-de.mjs`; Meldung beim Beitritt längenneutral („Enter the party code.").
  - Regeln (additiv, Betreiber veröffentlicht): `firebase/party-codes-six-candidate.mjs` erzeugt `PARTY-CODES-SIX-DIGIT-TO-PUBLISH.json` aus dem live Stand `PRESTIGE-EFFORT-TO-PUBLISH.json` — Diff exakt 17 Regeltexte (`/^[0-9]{4}$/` → `/^[0-9]{4}([0-9]{2})?$/`: `partyCodes`/`fourCodes` je 6, `inviteCode`-Validierungen auf `parties`/`fourParties` je 2, `coopInvites` 1), byte-genau reproduzierbar, Drift-Abbruch bei abweichender Stellenzahl. Dazu `PARTY-CODES-SIX-ROLLOUT.md`, Pin-Test, Emulator-Beweis (`rules-test/party-codes-six.test.mjs`, `firebase-party-six.emulator.json`, npm-Skript `test:party-six`, CI-Schritt in `database-rules`). `WORKSHOP-RULES-TO-PUBLISH.json` unberührt. Trockenlauf `rules-publish-dry-run.mjs`: 0 Blocker, 17 Review-Punkte = die beabsichtigten Weitungen.
  - Tests: `tests/party-code-six.test.mjs` (neu, 4 Tests: Erzeugung 6, Beitritt 4+6, 5/7 abgelehnt, Sitzungs-Rückfall unter verweigernden Regeln, Freundes-Einladungen), `tests/firebase-four-lobby.test.mjs` auf sechsstellig nachgezogen; `party-toggle` (Alt-Code `0123`) läuft über den Auslauf unverändert grün.
  - Cache-Welle `20261123-party6` (79 Dateien), Feldnotizen `party6` in `patch-notes.mjs`; Log-Rotation `IPL-0099` ins Archiv (Haupt `IPL-0100…IPL-0119`, Archiv bis `IPL-0099`); `AUSBAU-PLAN.md`: Punkt 4a/4b abgehakt, Punkt 5 auf `[~]` (Publish offen).
- **Prüfungen:** `party-code-six` 4/4, `party-codes-six-rules` 3/3, `firebase-four-lobby` + `party-toggle` grün (Emulator-Beweis läuft als CI-Schritt `test:party-six`). `patch.mjs check --fast`: 0 Fehler. Gesamtsuite 1333 Tests, 1332 bestanden + 1 bekannter Flachklon-Skip (`release-pages-site` nach Unshallow 6/6) – effektiv 1333/1333.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet`. Commit, Push, PR `#381`, CI, Merge und Pages-Auslieferung werden als Ereignis nachgetragen. Der sechsstellige Raum wird erst mit der Regel-Veröffentlichung durch den Betreiber voll wirksam (Anleitung `PARTY-CODES-SIX-ROLLOUT.md`, Rückfall = `PRESTIGE-EFFORT-TO-PUBLISH.json`); bis dahin greift der Client-Rückfall.
- **Offen / nächster Schritt:** Betreiber veröffentlicht die Regeln; danach Punkt 6: Start-Requests erst messen (Ladezeit/Netz), dann über Bundling entscheiden.

## IPL-0120 – Start-Requests vermessen, Bundling-Entscheidung: kein Umbau (keine Welle, kein Browser-Code)
- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber: „Is published" (Sechs-Stellen-Regeln live; Punkt 5 in `AUSBAU-PLAN.md` abgehakt, Doku-Commit auf diesem Branch), danach „Let's go" – Punkt 6 der Reihenfolge: erst messen, dann entscheiden, nicht vorschnell umbauen.
- **Block / Ziel:** Die ~180 Modul-Requests aus dem Rundum-Check mit realen Zahlen unterlegen und die Bundling-Frage an Daten statt Gefühl entscheiden.
- **Branch / Basis:** `arena/2c6e1584-0815games-github-io` ab `8360f7d49907f2b8d70302639297af91fd372a75` (`main`, Merge PR `#381`) plus Doku-Commit „Punkt 5 abgehakt".
- **Änderungen / Dateien:**
  - `IronPath/scripts/measure-startup.mjs` (neu): Statische Graph-Analyse ab `index.html` (der Graph, den der Browser läuft — jeder Import ist ein literaler Pfad mit Cache-Token). Phasen wie beim echten Start (drei Einstiegs-Skripte = Boot, dynamischer `account.js`-Import = App), eindeutige Module/Bytes/Gzip/Tiefe, Lazy-Kanten und unaufgelöste Imports als eigene Zeilen; `--json` für Rohdaten.
  - `IronPath/docs/START-REQUESTS-MESSUNG.md` (neu): Messbericht und Entscheidung. Gemessen: **191 Module, 1.932 KB roh / ~666 KB gzip, 1 HTML + 11 CSS (419 KB) + 191 Module = 203 Requests eigenem Host + 3 Firebase-CDN; Wasserfall-Tiefe 6 (91+80 Module auf den Stufen 2–3); Boot-Phase 34 Module / ~183 KB gzip; keine unaufgelösten Imports.** Entscheidung **kein Bundling**: GitHub Pages liefert HTTP/2 (flacher, paralleler Wasserfall), die Bytes dominieren die Request-Zahl, ein Bundle gewönne einstellige Prozente und baute dafür die pfadbasierten Test-Harnische, das Cache-Token-System und die Modulstruktur der Phasen 1–2 ab. Drei billigere Hebel (`patch-notes.mjs` lazy, Spiel-Graph nach Login, CSS zusammenlegen) sind dokumentiert, aber nicht gebaut.
  - `IronPath/tests/startup-measurement.test.mjs` (neu, 2 Tests): Invarianten der Messung (Graph löst vollständig auf, Phasen konsistent) plus bewusste Wachstums-Bänder (150–300 Module, 400–900 KB gzip, Tiefe 4–9) — gerissen wird die Bundling-Frage erneut gestellt.
  - `AUSBAU-PLAN.md`: Punkt 6 abgehakt mit Entscheidungsverweis. Kein Browser-Code, keine Feldnotizen, keine Cache-Welle (Werkzeug + Test + Doku wie bei `IPL-0115`).
  - Log-Rotation `IPL-0100` ins Archiv (Haupt `IPL-0101…IPL-0120`, Archiv bis `IPL-0100`).
- **Prüfungen:** `startup-measurement` 2/2; Messlauf selbst reproduzierbar per Skript. Schnelltor und Gesamtsuite folgen auf dem Commit-Stand.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet`. Commit, Push, PR `#382`, CI, Merge und Pages-Auslieferung (nur Doku/Werkzeug — die Live-Seite ändert sich für Spieler nicht) werden als Ereignis nachgetragen.
- **Offen / nächster Schritt:** Punkt 7: Block-Übersicht in `PATCH-BLOECKE.md` auf den echten Stand ziehen. Die Reihe ist danach vollständig; neue Punkte beschließt der Betreiber.

## IPL-0121 – Punkt 7: Block-Übersicht in `PATCH-BLOECKE.md` auf den echten Stand gezogen (keine Cache-Welle, kein Browser-Code)

- **Zeit / Quelle:** 2026-11-23 UTC; Punkt 7 der Reihenfolge in `AUSBAU-PLAN.md` (dort als Quick-Win geführt: die Übersicht zeigte Block E veraltet; bei jedem Block-Paket mitpflegen). Schließt die beschlossene Reihe ab.
- **Block / Ziel:** Kein Spiel-Block. Die ausführliche Block-Dokumentation `PATCH-BLOECKE.md` behauptete an mehreren Stellen einen alten Stand: Prozentwerte aus der Bauzeit, PR `#324`/`#325` als „offen“, Block 6 als „Abnahme ausstehend“, Block 7/E als „offen / ~70 %“ und Rückbau-Reste aus `#337`–`#339` als offene Punkte, obwohl der Betreiber sie bis auf die Boss-Ankündigung ausdrücklich fallen gelassen hatte.
- **Branch / Basis:** `arena/2c6e1584-0815games-github-io` ab `c40fd6df3bf7a2f4d1ad482c98e73b3ecaa4efc2` (`main`, Merge PR `#382`).
- **Änderungen / Dateien:**
  - `IronPath/docs/PATCH-BLOECKE.md`: Kopf (Reihe abgearbeitet; Geräteabnahmen sind Betreiber-Sache und keine offenen Punkte), Schnellübersicht (alle Blöcke „ausgeliefert“, Block 7/E „ausgeliefert (Scheibe 1 + 2)“, einzig technisch offene Punkte: Screenreader-Prüfung Block 2, Emulator-Transportfälle E5, D1-Datenmenge bewusst zurückgestellt), Reihenfolge-Tabelle (alle Zeilen auf ausgeliefert/merged), Abschnitts-Überschriften 6 und 7 plus Sprungmarken, Block-9f abgehakt (PR `#325` gemergt), Rückbau-Reste `#337`/`#339`/Mündungsblitz als per Betreiber-Entscheid fallengelassen markiert, Boss-Ankündigung als neu gelandet (`IPL-0104`) vermerkt, `game-regressions`-Pflicht-Check als Betreiber-Repo-Einstellung gekennzeichnet (keine Code-Aufgabe). Die ausführlichen Block-Kriterien und historischen Vermerke in den Abschnitten bleiben als Historie stehen.
  - `IronPath/docs/AUSBAU-PLAN.md`: Punkt 7 `[x]` mit Verweis auf diesen Eintrag.
  - `IronPath/docs/PATCH-LOG.md` + `PATCH-LOG-ARCHIV.md`: dieser Eintrag; Rotation `IPL-0101` ins Archiv (Haupt `IPL-0102…IPL-0121`, Archiv bis `IPL-0101`).
- **Prüfungen:** Schnelltor: „Kein Fehler, 3 Hinweis(e)“; `patch-log-archive` 5/5 (lückenlos/doppelfrei nach der Rotation). Gesamtsuite folgt auf dem Commit-Stand (nur Doku berührt).
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet`. Commit, Push, PR `#383`, CI, Merge und Pages-Auslieferung (nur Doku — die Live-Seite ändert sich für Spieler nicht) werden als Ereignis nachgetragen.
- **Offen / nächster Schritt:** Die beschlossene Reihe (Punkte 1–7) ist damit vollständig. Neue Punkte beschließt der Betreiber.

## IPL-0122 – Lebendiges Feld, Scheibe 1: Drehender MG-Turmkopf (geschichtet), Schadens-Rauch, Soldaten-Leben (Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber: „Ich hätte gern, dass das ganze Spiel ein wenig lebendiger wirkt. Türme sollen sich in Richtung der Gegner drehen …“ Auf Rückfrage wählte der Betreiber Bauart **B (geschichtet)**: gemalter Grundkörper bleibt, ein neuer, im Code gezeichneter Oberbau dreht sich frei 360° — Prototyp zuerst am MG-Turm, die anderen drei Typen nach seiner Sichtung. Gegner und Soldaten sollten im selben Paket mit lebendiger werden.
- **Block / Ziel:** Kein Spiel-Block; reine Darstellung. Keine Simulations-, Snapshot-, Protokoll- oder Regeländerung: Drehung ist Optik, keine Spielmechanik (Drehgeschwindigkeit begrenzt nur das Bild). Mehrspieler sieht aus demselben Snapshot dasselbe Bild.
- **Branch / Basis:** `arena/fd8d6466-0815games-github-io` ab `0dbada0209297fe873724bea654e6590cab7b1cb` (`main`, Merge PR `#383`).
- **Änderungen / Dateien:**
  - `IronPath/core/tower-aim.mjs` (neu): Renderer-seitiger Ziel-Tracker nach dem Muster von `soldier-motion.mjs`. Zielwahl spiegelt die Simulation (am weitesten vorgedrungener lebender Gegner in `getTowerRange`), Schwenk mit begrenzter Drehgeschwindigkeit (3,4 rad/s, kürzester Bogen), Rückstoß aus den Schuss-Folge-IDs (`state.shots`), erste Sichtung rastet ein, Pause/Lücken frieren ein, reduzierte Bewegung rastet ohne Rückstoß, ausgefallene/reparierende Türme halten die letzte Richtung.
  - `IronPath/core/cartoon-art.mjs`: `pad()` bekommt den Zielwinkel; für das MG (Typ 0) zeichnet `mgTurret()` Sandsackring (statisch) + drehenden Waffen-Kopf (Dreibein, Gehäuse, Lauf, Gurtkasten) in Tusche/Oliv auf der gemalten Stellung — die übrigen drei Typen behalten ihre Gemälde. Gegner: Fahrzeuge/Bosse unter 35 % Leben rauchen dunkel (Muster wie der Bunker), Infanterie wirbelt Schritt-Staub auf. `drawCartoonBattle` reicht `towerAims` durch.
  - `IronPath/core/soldier-motion.mjs`: stehende Soldaten atmen (langsames Bob), drehen sich nach dem Setzen zum nächsten Gegner, Rückstoß beim eigenen Schuss und Zucken bei Treffer (erkannt an Schuss-IDs bzw. Lebensabfall) — alles in die bestehende Pose (facing/bob/lean) gefaltet.
  - `IronPath/game.js`: zwei Tracker (eigenes + Rivalen-Feld), Verdrahtung in beiden `drawCartoonBattle`-Aufrufen, Resets an beiden Reset-Stellen.
  - 13 Test-Harnische führen `core/tower-aim.mjs` in ihren Import-Umschreibelisten (Erfahrung aus `IPL-0118`).
- **Prüfungen:** `tower-aim` 7/7 und `soldier-motion` 3/3 neu bzw. erweitert (Zielwahl, Drehbegrenzung, Rückstoß-Fenster, Reduzierte-Bewegung/Pause, Atmung, Bedrohungs-Facing); Schnelltor „Kein Fehler, 3 Hinweis(e)“; Gesamtsuite **1343 Tests, 1342 bestanden, 0 Fehler, 1 übersprungen**.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet`. Commit, Push, PR `#384`, danach Cache-Welle `20261123-aim1` mit Feldnotizen `aim1` als zweiter Commit (Muster `IPL-0104`), CI, Merge und Pages-Auslieferung werden als Ereignis nachgetragen. **Betreiber-Sichtung auf `20261123-aim1`:** MG-Turm muss Gegner sichtbar nachführen und beim Feuern zurückstoßen; danach Folgepaket für Kanone/Flak/Sniper entscheiden.
- **Offen / nächster Schritt:** Nach Betreiber-Sichtung: drehende Köpfe für Kanone, Flak und Scharfschütze (eigener Eintrag), ggf. Feinschliff an Drehgeschwindigkeit/Rückstoß über zwei Konstanten in `tower-aim.mjs`/`cartoon-art.mjs`.

## IPL-0123 – Lebendiges Feld, Scheibe 2: Drehende Köpfe für Kanone, Flak und Scharfschütze (Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber nach Sichtung von Scheibe 1: „Stark, der Stil gefällt mir. Mach die restlichen 3.“ — die drei übrigen Turmtypen bekommen dieselben geschichteten Köpfe wie das MG aus `IPL-0122`.
- **Block / Ziel:** Kein Spiel-Block; reine Darstellung wie Scheibe 1. Keine Simulations-, Snapshot-, Protokoll- oder Regeländerung: Die Köpfe lesen denselben Zielwinkel wie das MG (Zielwahl der Simulation, begrenzter Schwenk, Rückstoß aus den Schuss-Folge-IDs). Mehrspieler malt aus demselben Snapshot dasselbe Bild.
- **Branch / Basis:** `arena/c606d461-0815games-github-io` ab `56ed636f510aacf6bb8b95edc157a8572e9cf33a` (`main`, Merge PR `#384`).
- **Änderungen / Dateien:**
  - `IronPath/core/cartoon-art.mjs`: drei neue Maler im selben Tusche/Oliv-Stil und selben Koordinatenrahmen wie `mgTurret()` — `cannonTurret()` (Betonring statt Sandsäcke, Kastenschwanz, schwerer Lauf mit Mündungsbremse, Rückstoßweg 5), `flakTurret()` (Sandsackring + Munitionskisten als Bodenschmuck, Panzer-Schild, Doppellauf, Rückstoßweg 2), `sniperTurret()` (Tarn-Hügel statt Ring, Zweibein, langer dünner Lauf, Zielfernrohr, Rückstoßweg 1,5). `pad()` wählt den Maler nach `tower.type`, wenn ein Zielwinkel vorliegt; ohne Zielwinkel bleibt das gemalte Artwork (Fallback wie bisher).
  - `IronPath/core/tower-aim.mjs`: unverändert — der Tracker war bereits typ-agnostisch (Rückstoß über `kind === tower.type`); ein neuer Test pinnt das Typ-Keying.
  - `IronPath/tests/tower-heads.test.mjs` (neu): Feld-Zeichentest — alle vier Typen mit Zielwinkel tragen ihren gezeichneten Kopf (kein Turm-Artwork auf dem Feld), jeder Kopf schwenkt auf seinen Winkel und stößt entlang seiner Rohrlinie zurück (Rückstoßweg je Typ gepinnt), ohne Zielwinkel landet das Gemälde wie bisher.
- **Prüfungen:** `tower-heads` 4/4, `tower-aim` 8/8, `soldier-motion` 3/3; Schnelltor „Kein Fehler, 2 Hinweis(e)“; Gesamtsuite **1348 Tests, 1347 bestanden, 0 Fehler, 1 übersprungen**.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet`. Commit, Push, PR `#385`, danach Cache-Welle `20261123-aim2` mit Feldnotizen `aim2` als zweiter Commit (Muster `IPL-0104`), CI, Merge und Pages-Auslieferung werden als Ereignis nachgetragen. **Betreiber-Sichtung auf `20261123-aim2`:** alle vier Turmtypen auf einer Karte mit Gegnern aus mehreren Richtungen — jeder Kopf muss sichtbar nachführen und beim Feuern zurückstoßen.
- **Offen / nächster Schritt:** Die Ausbaureihe „Lebendiges Feld“ ist damit vollständig (Scheibe 1 + 2). Neue Punkte beschließt der Betreiber.

## IPL-0124 – Lebendiges Feld, Feinschliff: sanftes Einrasten, Rückstoß nur im Rohr (Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber nach Sichtung von Scheibe 2: „Erst Feinschliff, dann mehr Lebendigkeit.“ Dieses Paket ist der Feinschliff an den drehenden Köpfen aus `IPL-0122`/`IPL-0123`.
- **Block / Ziel:** Kein Spiel-Block; reine Darstellung. Keine Simulations-, Snapshot-, Protokoll- oder Regeländerung — Schwenk- und Rückstoßwerte sind Optik und reisen nie über das Netz.
- **Branch / Basis:** `arena/3c81a128-0815games-github-io` ab `62eabb03024079b00e613a10910a7b1f8f28b667` (`main`, Merge PR `#385`).
- **Änderungen / Dateien:**
  - `IronPath/core/tower-aim.mjs`: Drehgeschwindigkeit 3,4 → 3,0 rad/s (bewusster, weniger nervös), Rückstoß-Fenster 0,13 → 0,16 s (der Tritt ist lesbarer), und die letzte Strecke des Schwenks rastet weich ein (Easing unter 0,45 rad) statt hart zu knallen — volle Rate über das Feld, sanfte Landung aufs Ziel.
  - `IronPath/core/cartoon-art.mjs`: In allen vier Malern stößt jetzt nur die Waffengruppe zurück (Gehäuse/Lauf/Gurt bzw. Verschluss, Doppellauf, Gewehr) — Dreibein, Kastenschwanz, Sockel, Schild und Zweibein bleiben stehen, wie es eine echte Lafette tut. Das Höhenrad der Kanone bleibt bei der Lafette, das Visier fährt mit dem Rohr.
  - `IronPath/tests/tower-heads.test.mjs`: Rückstoß-Prüfung sucht jetzt das erste `translate` nach dem Schwenk (Lafette wird zuerst gezeichnet) — pinnt weiterhin Weg je Typ (MG 3,5 / Kanone 5 / Flak 2 / Sniper 1,5). `IronPath/tests/tower-aim.test.mjs`: Easing-Test (Teilweg, dann exaktes Einrasten).
- **Prüfungen:** `tower-heads` 4/4, `tower-aim` 9/9, `soldier-motion` 3/3; Schnelltor „Kein Fehler, 2 Hinweis(e)“; Gesamtsuite **1349 Tests, 1348 bestanden, 0 Fehler, 1 übersprungen**.
- **Git / PR / Release:** Zum Zeitpunkt dieses Eintrags `lokal/uncommittet`. Commit, Push, PR `#386`, danach Cache-Welle `20261123-aim3` mit Feldnotizen `aim3` als zweiter Commit (Muster `IPL-0104`), CI, Merge und Pages-Auslieferung werden als Ereignis nachgetragen. **Betreiber-Sichtung auf `20261123-aim3`:** Köpfe müssen weich einrasten und nur das Rohr darf zurückstoßen.
- **Offen / nächster Schritt:** `IPL-0125` „Mehr Lebendigkeit“ (Mündungsfeuer, Hülsen) folgt als eigener Eintrag.

## IPL-0125 – Lebendiges Feld, mehr Leben: Mündungsfeuer und Hülsen aus dem Rückstoß (Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber: „Erst Feinschliff, dann mehr Lebendigkeit.“ Dieses Paket ist der zweite Teil: Mündungsfeuer und Hülsenauswurf an den drehenden Köpfen aus `IPL-0122`–`IPL-0124`.
- **Block / Ziel:** Kein Spiel-Block; reine Darstellung. Keine Simulations-, Snapshot-, Protokoll- oder Regeländerung — Feuer und Hülsen werden aus dem Rückstoßwert gezeichnet, den der Tracker ohnehin liefert; kein neuer Zustand, keine Uhr, kein Netz.
- **Branch / Basis:** `arena/76a1f074-0815games-github-io` ab `44190a1f03c8c30903a3b912976dfa4c7df957c6` (`main`, Merge PR `#386`).
- **Änderungen / Dateien:**
  - `IronPath/core/cartoon-art.mjs`: Neuer Helfer `muzzleFx()` — Mündungsfeuer (zwei Sterne in der Emblem-Sprache: außen `#ff9a3c`, Kern `#ffd75c`, Deckkraft aus dem Rückstoß) an der Mündung, solange der Tritt frisch ist (Rückstoß > 0,5); Hülsenauswurf (Messing-Oval) aus der Auswurföffnung, der mit abklingendem Rückstoß nach oben-hinten fliegt und verblasst. Alle vier Maler rufen ihn mit ihren Mündungs- und Öffnungspositionen (Flak: zwei Mündungen). Reduzierte Bewegung sieht nichts davon, weil der Tracker dort Rückstoß 0 liefert.
  - `IronPath/tests/tower-heads.test.mjs`: Differential-Test — bei vollem Rückstoß kommen je Typ genau die FX-Striche dazu (MG/Kanone/Sniper +3, Flak +5 für zwei Mündungen), unter der Feuerschwelle fliegt nur die Hülse (+1).
- **Prüfungen:** `tower-heads` 5/5, `tower-aim` 9/9; Schnelltor „Kein Fehler, 2 Hinweis(e)“; Gesamtsuite **1350 Tests, 1349 bestanden, 0 Fehler, 1 übersprungen**.
- **Git / PR / Release:** Code-Commit + Push, PR `#387`; zweiter Commit: Cache-Welle `20261123-aim4` mit Feldnotizen `aim4` (79 Dateien, Muster `IPL-0104`). CI, Merge und Pages-Auslieferung werden als Ereignis nachgetragen. **Betreiber-Sichtung auf `20261123-aim4`:** Jeder Schuss muss am Rohr aufblitzen und eine Hülse auswerfen.
- **Offen / nächster Schritt:** Die Reihe „Lebendiges Feld“ ist damit vollständig (Scheibe 1 + 2, Feinschliff, mehr Leben). Neue Punkte beschließt der Betreiber.

## IPL-0126 – Lebendiges Feld, Ambiente: Wolkschatten, Windgut und Vogelschar (Cache-Welle folgt im selben PR)

- **Zeit / Quelle:** 2026-11-23 UTC; Betreiber nach Sichtung von `IPL-0125`: „Es können wir noch verbessern grafisch“ — als Paket gewählt: **Lebendiges Ambiente** (Wolkschatten, Windgut, aufscheuchende Vögel).
- **Block / Ziel:** Kein Spiel-Block; reine Darstellung. Keine Simulations-, Snapshot-, Protokoll- oder Regeländerung — die drei Ebenen werden aus Uhr und Schussliste gezeichnet, die jeder Betrachter ohnehin hat; kein neuer Zustand, kein neues Feld auf dem Draht.
- **Branch / Basis:** `arena/c8f23493-0815games-github-io` ab `ee9daa42eda08c220e3d9d93df56d3b8a914f00d` (`main`, Merge PR `#387`).
- **Änderungen / Dateien:**
  - `IronPath/core/cartoon-art.mjs`: Neuer Helfer `ambientAlarm()` (exportiert) — liest die Alarmlage aus der Schussliste (frischester Schuss nach derselben Rechnung wie der Tracer, Lebensdauer minus Snapshot-Alter, plus Schussdichte, geklemmt auf 0…1); ohne Schüsse 0, jede Ansicht startet zum selben Moment. Neue Funktion `ambientLife()`: zwei weiche Wolkschatten ziehen langsam übers Feld, Windgut (Heu/Blätter/Schnee je nach Biome) wirbelt tief übers Terrain, und eine Vogelschar aus sechs Vögeln kreuzt den Himmel — bei frischen Schüssen steigen sie und schlagen schneller (Höhe und Flügelschlag skaliert mit dem Alarm), bei Ruhe gleiten sie. Beides hinter dem bestehenden Wetter-Schalter (`weatherEffects`) und `reducedMotion`.
  - `IronPath/tests/ambient-life.test.mjs` (neu): `ambientAlarm`-Regel (keine Schüsse → 0, frischer Schuss > 0,5, gealterter Schuss → 0, klammert bei 1, dichtes Feld klammert, alternder Schuss wird leiser); Wolken/Windgut malen mit dem Wetter und schweigen bei Wetter aus und bei reduzierter Bewegung; die Schar steigt bei frischen Schüssen sichtbar (jeder Vogel höher als in der Ruhe-Szene) und die Malerei berührt die Schussliste nie.
- **Prüfungen:** `ambient-life` 3/3; Nachbar-Harnische (`battle-art-redesign`, `cartoon-art`, `field-visuals`, `tower-heads`, `soldier-motion`, `terrain`, `story-map-art`) 20/20; Schnelltor „Kein Fehler, 2 Hinweis(e)“; Gesamtsuite **1353 Tests, 1352 bestanden, 0 Fehler, 1 übersprungen**.
- **Git / PR / Release:** Code-Commit + Push, PR `#388`; zweiter Commit: Cache-Welle `20261123-aim5` mit Feldnotizen `aim5` (79 Dateien, Muster `IPL-0104`). CI, Merge und Pages-Auslieferung werden als Ereignis nachgetragen. **Betreiber-Sichtung auf `20261123-aim5`:** Wolkschatten müssen übers Feld ziehen, Windgut muss wirbeln, und beim Schuss muss die Vogelschar auffliegen.
- **Offen / nächster Schritt:** Reihe „Lebendiges Feld“ vollständig (Scheibe 1 + 2, Feinschliff, mehr Leben, Ambiente). Neue Punkte beschließt der Betreiber.

## IPL-0127 – Rückbau des entfernten Testprojekts `ironpathtest`

- **Zeit / Quelle:** 2026-11-24 UTC; Betreiber: „IronPathTest Sachen können entfernt werden, aber so das der Rest noch funktioniert.“ Vorausgegangen war die Feststellung, dass das Firebase-Projekt `ironpathtest` und das Vercel-Projekt `ironpath-release` gelöscht sind.
- **Block / Ziel:** Kein Spiel-Block, keine Spieländerung. Reiner Rückbau der isolierten Test-/Staging-Kette; das Spiel, `admin.html` und die Wartungsprobe bleiben unverändert auf `iron-path-dc727`.
- **Branch / Basis:** `arena/3ce6a172-0815games-github-io` ab `aa6bfb9` (`main`, Merge PR `#389`).
- **Änderungen / Dateien:**
  - Entfernt: `IronPath/release-tools/build-isolated-test-site.mjs`, `initialize-isolated-test.mjs`, `exercise-isolated-guard.mjs`, `IronPath/browser-tests/release-live-test.cjs`, `IronPath/tests/release-test-site.test.mjs`, `release-test-initialize.test.mjs`, `release-test-live-exercise.test.mjs`. Keine dieser Dateien wurde von einem Workflow, einem `npm`-Skript oder einem Produktions-Asset importiert; der Produktionsweg (`build-pages-site.mjs`, `pages-safety.mjs`, `stage-version.mjs` mit `production-public-config.json`) nutzte die Testkonfiguration nie.
  - `IronPath/release-tools/README.md`: Der Abschnitt „Using the existing test project“ ist durch einen Rückbau-Abschnitt ersetzt (was entfernt wurde und warum, was ein neuer Testlauf bräuchte); der verbliebene Rest ist ausdrücklich als Historie markiert.
  - `IronPath/docs/DATENBLATT.md`: Statusabsatz ergänzt; ältere Abschnitte ausdrücklich als Historie eingeordnet.
  - `IronPath/release-tools/PAGES-ROLLOUT.md`, `FIREBASE-PAGES-ROLLOUT.md`, `IronPath/firebase/FRIENDS-ROLLOUT.md`: Verweise präzisiert — das Projekt ist gelöscht, der Pfad entfernt.
- **Prüfungen:** Gesamtsuite **1342 Tests, 1341 bestanden, 0 Fehler, 1 übersprungen** nach dem Entfernen der drei Testdateien (vorher 1350/1349). `arcade/tests/portals.test.cjs` unverändert grün. Keine Referenz auf die gelöschten Dateien mehr außer der Rückbau-Dokumentation. Weder CI noch `package.json`-Skripte nannten die entfernten Dateien.
- **Betrieb (belegt):** Das Vercel-Projekt `ironpath-release` wurde am 2026-11-24 auf Anweisung des Betreibers gelöscht; Vercel bestätigte `deleted successfully`, das anschließende Projektlisting enthält nur noch `ironpath-live-session`. Damit sind die alten Deployments und der öffentliche Alias `https://ironpath-release.vercel.app/` weg. Keine Firebase- oder Rules-Änderung.
- **Git / PR / Release:** Commit und Push auf dem genannten Branch, PR folgt; Merge, CI-Ergebnis und Pages-Auslieferung werden als eigenes Ereignis nachgetragen. Keine Rules-, Daten- oder Vercel-Änderung in diesem Schritt.
- **Offen / nächster Schritt:** Ein isolierter Testlauf bräuchte eine **neue** Projekt-ID (Firebase sperrt gelöschte IDs dauerhaft) und neue öffentliche Web-Einstellungen; der Rules-Builder der Testkette fehlt dann ebenfalls. Projekt `ironpath-release` ist in Vercel pausiert, das Dienstkonto-Secret dort gelöscht; `ironpath-live-session` führt kein `IRONPATH_FIREBASE_SERVICE_ACCOUNT` mehr — ob der Session-Endpunkt deshalb antwortet, ist von hier aus nicht geprüft.

## IPL-0128 – Lebendiges Feld VI: Rückstoßrauch, Treffer-Flare, Staub, Spuren, Lull und Wetter (Welle `20261123-aim6`, PR `#405`)
- **Zeit / Quelle:** Sitzungsdatum 2026-11-21 UTC, Umgebungsuhr 2026-11-24 UTC (getrennt genannt); Betreiber-Auftrag 2026-11-23/24: „1-8 machen wir so“ — acht grafische Pakete, dazu Prestige-Glow umfärben (Betreiber-Wahl im Poll: Amethyst `#b48ce0`; wörtlich zur Farbe: „selbe Farbe wie Upgrade ist schwachsinnig“).
- **Block / Ziel:** Kein Spiel-Block; reine Darstellung. Kein neuer Zustand auf dem Draht; Treffer, Staub und Spuren werden aus Schussliste, Schussalter und Kettenabdrücken abgeleitet; Reduced-Motion und Wetter-Schalter bleiben harte Gates. Geräteabnahme macht der Betreiber selbst (Entscheid 2026-11-23).
- **Branch / Basis:** `arena/ae18598b-0815games-github-io` ab `2f736a2eff6e97cf43a54b582480bacc9b36ca78` (`main`, Merge PR `#388`).
- **Änderungen / Dateien:**
  - `IronPath/core/cartoon-art.mjs`: Mündungspulver in `muzzleFx` (Rauch-Loop je Mündung, Fenster = das der Hülle); Prestige-Block auf Amethyst (`shadowColor #b48ce0`, Pool/Ring/★ in der Amethyst-Familie); `pad()`-Signatur um `levelFx` (Abzeichen-Puls als letztes Argument) und `pads.forEach` leitet `upgrade|classUpgrade|build` positionsbasiert weiter; Reparatur-Funken bei `tower.repairing>0`; in `drawCartoonBattle` neu: `lull`, `hitMarks` (aus `shotsToDraw`/`shotTrace`, positionsbasiert, keine Enemy-IDs), `nowSec`; Bunker-Schlot-Wölkchen in der Lull; Schlacht-Spuren als gemalte Liste gegen die Canvas pro `me` (`scarList`, Deckel 30, Verblassung 14 s); Treffer-Flare und Wackeln in der Gegnerschleife; Fahrzeug-Staub aus frischen Kettenabdrücken, außerhalb des Artwork-Zweigs (der Puff malt auch am Marker); Wetter in `ambient()` (Regenfäden Marsch/Wald, Pfützen mit Schein) und Blitz-Doppelfenster vor dem Restore; Fahne als Vektor-Overlay in `bunker()` (Signatur um `time`/`motion`); Level-Up-Blitz in `drawAbility`; `enemy()`-Signatur um `dust`/`hit`.
  - `IronPath/tests/field-liveliness.test.mjs` (neu): 10 Pins — Amethyst-Halo vs. Upgrade-Gold, Mündungspulver (Kick/0/Reduced-Vertrag), Badge-Puls (Effekt/kein Effekt/Reduced/Tracer aus), Reparatur-Funken, Treffer-Flare positionsbasiert, Staub aus frischen vs. verwitterten Treads, Lull (Schlot, Fahne wellt/ruht), Schlacht-Spuren (Stempel, Dedup, Verblassung, Reduced, Tracer aus), Wetter (Regen/Pfützen/Blitz-Fenster/Schalter/Themes) und ein Kitchen-Sink-Draw.
  - `IronPath/tests/tower-heads.test.mjs`: beginPath-Kadenz um den Pulverrauch korrigiert — voll `{0:4,1:4,2:7,3:4}` (Hülse + N Rauche + 2N Flash-Sterne), halb `1+N`.
  - `IronPath/tests/tower-glow.test.mjs`: Shadow-Color-Pin `/^#b48ce0$/i` statt der alten Gold-/Gelb-Familie.
- **Prüfungen:** Vor dem Merge: **1363 Tests, 1362 bestanden, 0 Fehler, 1 übersprungen** (vorhandener Skip), Exit 0. Nach dem Merge von `origin/main` und Abschluss des Merge-Commits: **1352 Tests, 1352 bestanden, 0 Fehler, 0 übersprungen**, Exit 0 — der Flachklon-Effekt von `release-pages-site` lief im offenen Merge-Zustand einmal rot und danach 6/6; `npm run schnelltor`: „Kein Fehler, 2 Hinweis(e)“; `field-liveliness` 10/10; `patch-notes` + `patch-log-archive` 13/13. Nicht geprüft: Gerät/Emulator, Browser-Fahrten (kein lokaler Chromium) — laufen in der CI.
- **Git / PR / Release:** Feature-Commit `dc1e168` auf `arena/ae18598b-0815games-github-io`, Push, PR `#405` eröffnet (die Planung erwartete `#389`; inzwischen waren `#389`–`#404` auf main vergeben, GitHub vergab `#405` — beide Angaben getrennt). Zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung, AUSBAU-Zeile 13, Feldnotizen `aim6` mit `pr: 405`) und Cache-Welle `20261123-aim6` (`bump aim6 --from aim5 --apply`, 79 Dateien, 7/7 Anker). Nach grüner CI kam der Merge-Konflikt mit `origin/main` (dort inzwischen eigenes `IPL-0127`, Rückbau `ironpathtest`, PR `#389`): `origin/main` lokal eingemergt (Merge-Commit `a8fc2930`), beide Log-Einträge behalten, dieser Eintrag wegen der ID-Kollision auf `IPL-0128` umnummeriert, Rotation auf `IPL-0108` nachgezogen (Log wieder 20 Einträge, `IPL-0109`…`IPL-0128`). Nach CI-Isolation gemergt: `gh pr merge 445 --merge` → Merge-Commit `c40b64c`, alle 13 Checks pass; Pages und Betreiber-Sichtung folgen als Ereignis. **Betreiber-Sichtung auf `20261123-aim6`:** die acht Pakete gegen die Vorgabe, Amethyst-Halo sichtbar, Upgrade bleibt Gold.
- **Offen / nächster Schritt:** CI zu PR `#405`, Merge, Pages-Nachweis, Nachtragskommentar; danach Sichtung durch den Betreiber im Spiel.
## IPL-0129 – Balancing der Welle-11-Kante und verknüpftes Feld-Report-Werkzeug (Welle `20261124-aim7`, PR `#425`)
- **Zeit / Quelle:** Sitzungsdatum 2026-11-21 UTC, Umgebungsuhr 2026-11-24 UTC (getrennt genannt); Balancing-Auftrag des Betreibers aus der Auftragsnotiz, wörtlich: „die ersten zehn Wellen gehen Butter, weich durch und ab Welle elf sobald die Karte wechselt, wird es abnormal schwer" — verlangt: ordentlicher Test mit allen Klassenvarianten, Ausrüstungen, Skills und Turm-Szenarien plus Stress-Paket, und eine wiederverwendbare Auswertungsdatei, die alle Auswertungen verknüpft auswertet und Änderungen austauschbar/revertierbar hält (Formulierung „Barth Bankingpaket" in der Notiz unklar, als Balance-Testpaket umgesetzt).
- **Block / Ziel:** Kein Spiel-Block; Balancing + Prüfwerkzeug. Diagnose vor dem Fix: Kliff ab Welle 11 aus dem Stapel 60-%-Rücklage, gelöschte Türme, größere neue Karte, Sektor-2-Formation (jede dritte Bodeneinheit → Panzer) mit MG-0,4×-Panzer-Malus, Wellen-HP-Kurve `hp = Typ-HP × (1 + (Welle−1) · 0,23)` (Welle 11 = 3,3×) und Bunker-Patch auf 75 %; die Öffnung blieb beim Autopiloten ohne Schaden. Bewusst verworfen: frühe HP-Rampe für Wellen 6–10 (bis +20 %) — ein Nur-Bauer-Fixtures starb schon ab +4 % in Welle 10; die Messsäule (`early`) steht im Report, die Entscheidung bleibt Betreiber-Sache.
- **Branch / Basis:** `arena/e4e6ddef-0815games-github-io` ab `b2bf68e` (`main`, Merge PR `#410`).
- **Änderungen / Dateien:**
  - `IronPath/core/match.mjs`: `advanceSector` — Rücklage `.6` → `.8` (80 % der Tower- und Klassen-Investition), `state.sectorGraceWave = state.wave + 1`.
  - `IronPath/core/simulation.mjs`: Spawn-Gate `grace` — solange `wave <= sectorGraceWave` laufen Lean-Formation und `effectiveSector` auf Sektor 1 (kein Panzer-Lean, kein +12 % HP / +5 % Tempo); Layer-Reihenfolge Wellen-Kurve → Sektor-Bonus hält das 1,12-Verhältnis exakt; Notiz an der Stelle, an der künftig früher Endlos-Druck ansetzen würde.
  - `IronPath/tests/balance-harness.mjs` (nur additiv, Default-Pfade byte-identisch): `runSoloTrace` mit Wellen-Trace (HP/Vorrat/Türme/Level/Karte je Wellenstart, Wellenende, Advance-Ereignisse, Tick-Stempel); Trace-Lauf vor dem Piloten, damit Wellen-Enden sichtbar werden; `placementOrder` mit `coverage` (Default) / `roadside` / `bunker` / `spread`; `CLASS_VARIANTS` und `classGear` für Klassenvarianten-Läufe.
  - `IronPath/tests/balance-field-report.mjs` (neu): das verknüpfte Auswertungswerkzeug — Matrix (GEARS × Klassenvarianten × Turm-Placements × Endlos-/Sektorfelder + Coop-Reihen), Tabelle mit Cliff-/Grace-/Rebuild-/Butter-Säulen, `--write-baseline` (bewusster Tausch, in Git committen), `--check` (Exit 1 bei Regression), `--quick`, `--with-stress` (Stresspaket als Report-Sektion), schreibt `balance-report-latest.json` (ignoriert).
  - `IronPath/tests/balance-baseline.json` (neu): kommittete Baseline, 34 Szenarien — Differenz-Auswertung und revertierbarer Snapshot in einem.
  - `IronPath/tests/balance-transition.test.mjs` (neu): Grace-Pin (Welle 11 spawnt im alten Rhythmus, Welle 12 volle neue Bedrohung) und Überlebensfenster der Rookie-Retreat-Partie (`g3-0b9f45231`, Cliff-Schaden ≤ 12 HP, ≥ 10 Türme bis Welle 12, laufend bis 16).
  - Pins bewusst nachgezogen: `sector-campaign` 72 → 96 (80 % von 120), `tower-class-paths` `.6` → `.8`, `balance-suite` armory-Pin `<35` bei Cap 40 → `<45` bei Cap 60 (Vest-Ladung nach +80 % Rücklage und Grace gemessen tot in Welle 41; Ladung ohne Item weiter tot in Welle 30).
  - `.gitignore`: `IronPath/tests/balance-report-latest.json`.
- **Prüfungen:** `node --test tests/*.test.mjs` → **1354 Tests, 1353 bestanden, 1 übersprungen, 0 Fehler**, Exit 0. `npm run test:stress` → grün. `node IronPath/tests/balance-field-report.mjs --check --with-stress` → **34/34 ok**, Exit 0. Kanten-Nachweis aus dem Report: 16 Retreat-Läufe, mittlerer Cliff-Schaden (Grace + zwei Wellen) **0 HP**, Grace-Welle in allen Läufen 0 Schaden, Wiederaufbau 4 Türme in der Grace-Welle und 14 bis Welle 12. Nicht geprüft: Gerät/Emulator und manuelle Spielfahrt — Sichtprüfung macht der Betreiber.
- **Git / PR / Release:** Code-Commit `a0572fd` auf dem genannten Branch, Push, PR `#425`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0109`, AUSBAU-Zeile 14, Feldnotizen `aim7` mit `pr: 425`) und Cache-Welle `20261124-aim7` (`bump 20261124-aim7 --from 20261123-aim6 --apply`, 7/7 Anker). CI, Merge und Pages werden als Ereignis nachgetragen.
- **Offen / nächster Schritt:** CI zu PR `#425`, Merge, Pages-Nachweis, Nachtragskommentar; danach Sichtung durch den Betreiber (Welle 1–10 gegen Report-Säule `early`, Rückzug nach Welle 10 ohne HP-Abgrund). Offene Balancing-Entscheidung: früher Druck in Wellen 6–10 — Ein-Zeiler an der notierten Stelle in `simulation.mjs`, danach `balance-field-report --write-baseline` neu committen.
## IPL-0130 – Spielmap im Turm-Design: 38 Deko-Sprites, Zonen mit Tiefe, Totholz (Welle `20261124-aim8`, PR `#438`)
- **Zeit / Quelle:** Sitzungsdatum 2026-11-21 UTC; Betreiber-Auftrag 2026-11-21: „Das Turm Design fänd ich an sich ganz nice … nur die Spielmap, nicht das ganze Spiel"; danach „totes Leben … Maps voller wirken lassen, aber nicht aktiv voll" und „Eiswasser und Sumpf … teilweise einfach nur braun und hingemalt … es muss Tiefe haben".
- **Block / Ziel:** Kein Spiel-Block; reine Darstellung auf der Spielmap. Kein neuer Zustand auf dem Draht; Reduced-Motion und Wetter-Schalter unberührt. Sichtung macht der Betreiber („Mach alles Live, ich teste dann").
- **Branch / Basis:** `arena/4556e0a8-0815games-github-io` ab `1354372fa07b97d39e29bebd2c776eba45473b79` (`main`, Merge PR `#425`).
- **Änderungen / Dateien:**
  - `IronPath/assets/*-sprite.png`: 30 bestehende Deko-Sprites (Basis 9, Theme 10, Talwald 4, Landmarks 7) im Stil der Türme neu generiert – dicke Tusche-Konturen, gesättigte painterly Flächen, Erd-/Stein-Plinth wie der Sandsack-Ring der Türme, eingemalter Kontaktschatten, kein Magenta-Sticker-Rand; dazu 8 neue Clutter-Motive (`barrels, cart, crates, rocks, stump, logpile, fence, signpost`) → 38 Dateien. Ersatz unter den alten Namen; Cache-Busting `?v=20261121-towerdeco1` am Deko-Loader (`cartoon-art.mjs`) und erstmals auch am Landmark-Loader (`story-map-art.mjs`).
  - `IronPath/scripts/freistellen-sprites.py` (neu): Weiß→Alpha-Pipeline – wachsende Hintergrund-Maske ab den Rändern (Neutral-Hell, Luma > 206), globaler Neutral-Hell-Pass für helle Restflächen, Schatten-Ring-Pass von der Transparenzkante (Luma > 150, gestoppt von der Tusche-Kontur), Halo-Reinigung, Crop auf die Fußlinie.
  - `IronPath/core/cartoon-art.mjs`: Grounding-Ovals im Sprite-Zweig von `drawDeco` entfernt (Plinthe und Schatten stecken im Bild, die Ovals hätten verdoppelt); `ZONE_STYLES` mit Tiefe-Attributen (`deep/halo/shade/detail`); `zoneBlob` auf 18 Segmente; `drawZone` neu nach dem Fünf-Schicht-Rezept Halo → Radial-Verlauf → Ufer-Steppschatten → geklippes art-spezifisches Interieur → Randklumpen; `zoneInterior` mit Frost-Rissen, Schlammwirbeln und -blasen, Steinfugen, Blätter-Litter und Trockenrissen; `roadZone` mit Quer-Verlauf und gesunkener Mittelrinne (`deep` in `thinIce`, `bog`, `fieldZone`); Broken Ice als offenes Dunkelwasser mit Eissplittern; `DECO_ART`-Breiten und Vektor-Fallbacks für die acht Clutter-Kinds; Gradient-Guards für headless Canvas-Mocks.
  - `IronPath/core/maps.mjs`: `decoFor`-Clutter-Pass – Zielmenge `width*height/30000` (Deckel 64), dieselben Feldregeln wie Gebäude (≥ 40 zur Straße, ≥ 58 zu Pads, ≥ 95 zum Bunker, ≥ 42 zueinander, Bounds 26), reines Dressing ohne Game-State.
  - `.gitignore`: `IronPath/preview-sprites/` (Arbeitsschicht der Generierungen) angehängt, Altbestand unverändert.
- **Prüfungen:** `node --test tests/*.test.mjs` → **1354 Tests, 1353 bestanden, 1 übersprungen, 0 Fehler**. `npm run test:stress` grün. `npm run schnelltor` „Kein Fehler, 2 Hinweis(e)". Der Maps-Test pinnte die Clutter-Abstände nach die Feldregeln (58/40); die Zonen-Gradienten laufen mit Fallback gegen die Canvas-Mocks. Nicht geprüft: Gerät/Emulator und manuelle Spielfahrt – Sichtung macht der Betreiber.
- **Git / PR / Release:** Code-Commit `c6179d0` auf dem genannten Branch, Push, PR `#438`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0110`, AUSBAU-Zeile 15, Feldnotizen `aim8` mit `pr: 438`) und Cache-Welle `20261124-aim8` (`bump 20261124-aim8 --from 20261124-aim7 --apply`). CI, Merge und Pages werden als Ereignis nachgetragen.
- **Offen / nächster Schritt:** CI zu PR `#438`, Merge, Pages-Nachweis, Nachtragskommentar; danach Sichtung durch den Betreiber (Deko-Kontrast gegen den Boden, Zonentiefe auf Eis/Sumpf, Clutter-Dichte).
## IPL-0131 – Kontrast-Lifting: Silhouetten-Schatten und Bild-Boost (Welle `20261124-aim9`, PR `#445`)
- **Zeit / Quelle:** Sitzungsdatum 2026-11-21 UTC; Betreiber-Rückmeldung nach IPL-0130: „Gehen in. Dem Hintergrund immer noch irgendwie unter." Abstimmung: betroffen = alles gleichermaßen, Ansatz = Kombination, moderat.
- **Block / Ziel:** Kein Spiel-Block; reine Darstellung. Kein neuer Zustand; die Änderung liegt im Terrain-Cache (Schatten) und in den Bilddateien (Lifting). Sichtung macht der Betreiber.
- **Branch / Basis:** `arena/b7d772a2-0815games-github-io` ab `964ebf5021f53964ca5e10e91adb5fc8b153ad5c` (`main`).
- **Änderungen / Dateien:**
  - `IronPath/core/cartoon-art.mjs`: im Deko-Sprite-Zweig von `drawDeco` Silhouetten-Schatten über die **Canvas-Shadow-API** (`shadowColor='rgba(8,12,8,.42)'`, `shadowOffsetX=1/OffsetY=3/Blur=3`, Reset nach dem `drawImage`) um das Haupt-`drawImage`. Folgt der Tusche-Silhouette, wird einmalig in den Terrain-Cache gerendert. Erste Umsetzung mit `ctx.filter='drop-shadow(...)'` zerstörte die `party-finalization-browser`- und `interface-browser-smoke`-Checks in CI (drei Läufe identisch rot; ohne Schatten alles grün → Isolation per Leer-Commit) — die Shadow-API rendert dasselbe Motiv und ist in allen Browsern stabil.
  - `IronPath/assets/*-sprite.png` (38 Dateien, alle Deko- und Clutter-Sprites): PIL-Lifting `Contrast 1.12 / Color 1.10 / Brightness 1.05` auf dem RGBA-Kanal (Alpha unangetastet) — Tusche-Konturen und Freistellung bleiben unverändert.
- **Prüfungen:** `node --test tests/*.test.mjs` → **1354 Tests, 1353 bestanden, 1 übersprungen, 0 Fehler**. `npm run schnelltor` → kein Fehler, 1 Hinweis. Review-Boards auf Wald-Grün und Wüsten-Sand gesichtet: keine Verbrände, Konturen intakt. Nicht geprüft: Gerät/Emulator — Sichtung Betreiber.
- **Git / PR / Release:** Commit `2156873` auf dem genannten Branch, Push, PR `#445`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0111`, AUSBAU-Zeile 16, Feldnotizen `aim9` mit `pr: 445`) und Cache-Welle `20261124-aim9` (`bump 20261124-aim9 --from 20261124-aim8 --apply`). CI, Merge und Pages werden als Ereignis nachgetragen.
- **Offen / nächster Schritt:** CI zu PR `#445`, Merge, Pages-Nachweis, Nachtragskommentar; danach Sichtung durch den Betreiber (flache Karte vs. Abhebung).
## IPL-0132 – Einheiten im Tusche-Flach-Stil und Weg-Fahnen entlang der Gegnerroute (Welle `20261124-aim10`, PR `#451`)

**Problem (Betreiber-Meldung):** „Soldat und Gegner passen jetzt halt so gar nicht zum restlichen design mehr" – nach IPL-0130/0131 (dicke Tusche, satte Flächen bei Deko und Türmen) liefen die sieben Einheiten-Sprites noch in der alten, gedämpft-realistischen Malweise. Zweitens der Wunsch: „mehr Flaggen um den Weg, den die Gegner langlaufen" – am Weg stand bisher nur die Bunkerfahne (IPL-0128).

- **Sieben Einheiten-Sprites neu im verbindlichen Referenzstil (`mg2`/`cannon2`):** `hero2`, `infantry2`, `tank2`, `plane2`, `train2`, `bossheavy2`, `bossplane2` – erzeugt, Weiß→Alpha über die Freistellen-Pipeline, danach in die Canvas-Maße und Inhalts-Boxen der alten Dateien eingepasst (kein Layout-Shift, keine Verzerrung). Orientierungen exakt wie bisher: Hero und Boss-Panzer nach rechts, Infanterie, Panzer, Flugzeuge und Lokomotive nach links. Feindliche Einheiten tragen das rote Akzent der Bosse (Kragen/Armband bzw. Wimpel).
- **Weg-Fahnen als Vektorart im Terrain-Cache:** `drawPathFlags` (exportiert), aufgerufen nach den Zonen, vor dem Deko-Layer. Paare beidseitig, **36 px** vom geglätteten Mittelpunkt (Fahrbahn 30, Einheiten-Korridor ±14,1 – die Pole stehen auf der Schulter), alle **~125 px** Arclänge, `inset 70`/`outset 90` (Spawn und Bunker frei). Bunkerfahnen-Sprache: Holzmast, Kugel, rot/creme wechselnder Wimpel mit Tusche-Kontur; `roadHash`-deterministisch, **vollständig statisch** (Reduced-Motion- und Wetter-Vertrag intakt, kein Sim-State). Gilt für alle `paths` – jede Gegenspур inkl. Schiene, Story- und Vier-Spieler-Karten. Reihenfolge Zones → Flaggen → Deko: bei seltener Berührung liest sich die Tiefe korrekt. **Dichte `forest`: 22 Fahnen** (11 Marken × 2), vorher 0 am Weg.

**Prüfungen:** neu `IronPath/tests/path-flags.test.mjs` (3 Cases: Paare ±36 px mit exakter Arclength-Dichte und Leerpfad-Guard; Determinismus – zwei Läufe identisch – und rot/creme-Wechsel; echte Schulter-Distanzen auf `forest` 30–36,5 px). Suite **1357 pass / 1358, 0 fail**; `schnelltor` ohne Fehler. Sicht-Boards: `preview-sprites/review-units-board.png` (alt/neu je Einheit) und `preview-sprites/review-flags-forest.png` (Fahnen auf echter `buildRoadPath`-Geometrie mit Fahrbahn-Bändern und Einheiten-Korridor).

**Git / PR / Release:** Commit `f1f92cf` auf dem genannten Branch (7 Sprites, Fahnen-Code, Test), Push, PR `#451`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0112`, AUSBAU-Zeile 17, Feldnotizen `aim10` mit `pr: 451`) und Cache-Welle `20261124-aim10` (`bump ... --from 20261124-aim9 --apply`). Sprite-Cache-Token `?v=20261121-towerdeco1` → `?v=20261124-aim10`, damit die neuen Einheiten auch bei wiederkommenden Spielern landen. Nach grünem CI gemergt: `gh pr merge 451 --merge` → Merge-Commit `349e208`, alle 12 IronPath-Checks pass (der externe `Vercel – pipboy3003`-Check failte unabhängig von diesem PR); Pages `built`, Nachtragskommentar `#issuecomment-7154930760`.

## IPL-0133 – Toon-Boden: flache Platten mit Tusche-Nähten statt Öl-Mosaik (Welle `20261125-aim11`, PR `#454`)

**Problem (Betreiber-Meldung):** „Schaut ganz gut aus, jetzt passt aber der Hintergrund der Karte auch nemme ganz so…" – nach IPL-0130–0132 (Deko, Schatten, Einheiten im Tusche-Flach-Stil) wirkte der Boden gemutet: gefiedertes Öl-Mosaik, blasser Tint-Schleier, starker Oliv-Cast. Entscheidung per ask_user: **Toon-Boden (Neumalerei)** statt reiner Farbkorrektur.

- **Mosaik → flache Platten mit Tusche-Nähten:** `paintTileMosaic` clippt jeden Patch hart an der Blob-Kante (Federrand-`destination-in` raus) und stroke't dieselbe Path mit Sprite-Ink (2,4 px). Darunter pro Theme eine **gewichtete Flat-Platten-Palette** `GROUND_PLATES` (9 Themes, aus den `terrain3`-Platten per Median-Cut abgeleitet + Akzent-Slot: Rost/Warmweiß/Moos); hellste Farben am häufigsten, Dunkeltöne als Schattenplatten. Die gemalte Platte flüstert nur noch mit **α .32** – Textur ohne Collage.
- **Blasser Tint raus:** `GROUND_TINTS`-Waschschleier (5 Pastellfarben) komplett entfernt.
- **Oliv-Cast halbiert:** `.14 → .08`; Vignette bleibt (Rahmen-Tiefe).
- **Boden-Detailflecken in Tusche:** die großen Theme-Wasch-Ellipsen tragen jetzt eine Haarlinien-Kontur in Sprite-Ink (α .16–.24) – flache gemalte Bodenplatten statt nebeliger Schleier.

Nur Darstellung, kein Sim-State, kein Wire-Format, statisch im Terrain-Cache (Reduced-Motion/Wetter unberührt). Story-Maps behalten ihre eigene Story-Kunst (`drawStoryTerrain`); die Boden-Platten selbst blieben bilddatei-unverändert – der Unterschied entsteht komplett im Paint-Pfad.

**Prüfungen:** Suite **1357 pass / 1358, 0 fail** (alle visuellen Tests grün: field-visuals, battle-art, road-design, zone-interior, path-flags); `schnelltor` ohne Fehler. Sichtboard mit echter Weggeometrie, Straße, Fahne, Soldat, Panzer und Hütte: `preview-sprites/review-toon-ground.png` – drei Vorstufen (Foto-Mosaik-Stroke, Posterize-Bake) wurden verworfen, nur die flache Plattenvariante liest sich wie die Einheiten.

**Git / PR / Release:** Commit `224df68` auf dem genannten Branch (Paint-Pfad, Paletten, Test-Suite grün), Push, PR `#454`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0113`, AUSBAU-Zeile 18, Feldnotizen `aim11` mit `pr: 454`) und Cache-Welle `20261125-aim11` (`bump ... --from 20261124-aim10 --apply`). Nach grünem CI gemergt: `gh pr merge 454 --merge` → Merge-Commit `a4a0250`, alle 11 IronPath-Checks pass (der externe `Vercel – pipboy3003`-Check failte unabhängig von diesem PR); Nachtrags-PR `#457` → `0b4e75a`; Pages `built`, Nachtragskommentar `#issuecomment-7157433650`.

## IPL-0134 – Power-Governor: Frame-, DPR- und Effekt-Regelung gegen Hitze und Akku (Welle `20261125-aim12`, PR `#463`)

**Problem (Betreiber-Meldung):** „Gerät wird schon ganz schön heiß beim spielen. Bekommen wir das irgendwie reguliert?" – Bestandsaufnahme: der Toon-Boden wird einmal in den Terrain-Cache gemalt, die Dauerlast sitzt in der Render-Schleife, die bisher bei **jedem** rAF-Frame (60–120 Hz) das ganze Feld in voller Pixeldichte gemalt hat (Backing-Store bis DPR 3).

**Lösung – ein Governor, der nur die Darstellung drosselt (`core/power-governor.mjs` + vier Integrationsstellen in `game.js`):**
- **Drei Stufen:** `full` = unverändert; `eco` = Paint-Lücke ≥30 ms (~30 fps), DPR max 2; `max` = ≥40 ms (~20 fps), DPR max 1,5, Wetter-/Tracer-Effekte aus. Die **Simulation läuft bei jedem rAF weiter** (`update(dt)` vor dem Paint-Gate, Paint im Slot via `lastDrawAt`).
- **Frame-Signal:** EMA der rohen rAF-Lücke – >26 ms über 4 s → Stufe runter (5 s Mindestabstand), <18 ms über 20 s → Stufe hoch; ein einzelner Tab-Resume-Sprung zählt nicht. Die rohe Lücke (nicht die Paint-Dauer) kann durch das eigene Frameskippen nicht gefaked werden.
- **Akku-Signal** (`navigator.getBattery`, feature-detected): ohne Netz ≤30 % → mindestens `eco`, ≤15 % → `max`; am Netz frei. Fehlt die API, gilt nur das Frame-Signal.
- **Vertrag:** Spielereinstellungen (Grafik-Schalter, Wetter, Tracer) werden nie aufgeweicht, nur per UND gedrosselt (eigene + Gegner-Spur); jede Stufe kehrt von selbst zurück. Kein Sim-State, kein Wire-Format, Reduced-Motion unberührt; Wechsel per `console.debug('IronPath: power policy -> …')`.

**Prüfungen:** neu `tests/power-governor.test.mjs` (7 Cases: Policy-Tabelle, Slow-Hold → eco → max, Einzel-Spike, Erholung, Akku-Floor + Freigabe, defekter Probe); die 13 Game-UI-Test-Harnesses listen den neuen Import; `endless-retreat-viewport` prüft Paints mit 50-ms-Slots (die 50-ms-Wellen-Steps sind für den Governor ein kämpfendes Gerät – genau die Regelung, die bestätigt wird). Suite **1364 pass / 1365, 0 fail**; `schnelltor` ohne Fehler.

**Git / PR / Release:** Commits auf dem genannten Branch (Modul, Tests, game.js-Integration, Harness-Anpassungen), Push, PR `#463`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0114`, AUSBAU-Zeile 19, Feldnotizen `aim12` mit `pr: 463`) und Cache-Welle `20261125-aim12` (`bump ... --from 20261125-aim11 --apply`). Nach grünem CI gemergt: `gh pr merge 463 --merge` → Merge-Commit `e02dddc`, alle 11 IronPath-Checks pass (der externe `Vercel – pipboy3003`-Check failte unabhängig von diesem PR); Pages `built`, Nachtragskommentar `#issuecomment-7160341519`.

## IPL-0135 – Command Center kompakt: Field-Buttons in die Settings, Raster zentriert (Welle `20261125-aim13`, PR `#469`)

**Problem (Betreiber-Screenshot):** Auf dem Computer wirkte die Aufteilung auseinandergezogen – vier Utility-Buttons schwebten in leerer Fläche, die Spalten liefen über die volle Bildschirmbreite auseinander, „Choose an operation" hängt unten in seiner Spalte.

**Änderungen:**
1. **Utilities halbiert:** `FIELD NOTES` und `FIELD TUTORIAL` sitzen jetzt als Card „FIELD & HELP" im Settings-General-Panel (gleiche IDs → Handler, Tour-Inspects und Feature-Gates laufen weiter); FIELD TUTORIAL schließt die Settings vor dem Coach-Start. Im Hauptmenü bleiben nur **SETTINGS** und **SIGN OUT**. Der Confirm-Flow „PLAY THE FIRST RUN AGAIN" (`settingsTutorialReset`) bleibt in OPERATION & TRAINING.
2. **Desktop-Raster:** `#commandCenter` bekommt ab 860 px `max-width: 1240px; margin-inline: auto`; der nav-head steht `align-self: start` statt `end` (rechte Spalte beginnt direkt unter dem Hero).
3. **DE-Strings** für den neuen Card in `i18n/localization-settings-de.mjs` (`FIELD & HELP`, `Field Notes`, `Field Tutorial`).

**Verträge:** `menu-redesign` (Utilities = `[menuSettings, menuLogout]`, beide Feld-IDs im General-Panel), `patch-notes` (Position in `settingsPanelGeneral`), `settings` (IDS + beide Buttons), Browser-Smoke `command-center.cjs` (2 Utilities; FIELD NOTES/FIELD TUTORIAL sichtbar im General; die Restart-Flows öffnen erst die Settings; der Dossier-Flow klickt `#menuTutorial` von dort). Unverändert grün: `command-center`, `tutorial-dossier`, `first-run-layout`, `field-signout`, Tour-Inspects.

**Prüfungen:** Suite **1364 pass / 1365, 0 fail**; `schnelltor` ohne Fehler; Smoke-Fix nach zwei CI-Läufen grün (die Utility-Count- und Sichtbarkeits-Verträge mussten der beauftragten Bewegung folgen).

**Git / PR / Release:** Commits auf dem genannten Branch (index.html, menu-redesign.css, command-center.mjs, localization-settings-de, Tests, Browser-Smoke), Push, PR `#469`; zweiter Commit: Doku (dieser Eintrag, Archiv-Schiebung `IPL-0115`, AUSBAU-Zeile 20, Feldnotizen `aim13` mit `pr: 469`) und Cache-Welle `20261125-aim13` (`bump ... --from 20261125-aim12 --apply`). CI, Merge und Pages werden als Ereignis nachgetragen.

