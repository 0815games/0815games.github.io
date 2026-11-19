# Block 2 – Eindeutige Soldatennamen & Konfliktauflösung (Übergabe zur Freigabe)

**Stand: Client + `BLOCK2-RULES-TO-PUBLISH.json` fertig implementiert und im Trockenlauf / den Unit-Tests geprüft. Vor dem Live-Schalten in der Firebase Console ist die fertige Regeldatei `IronPath/firebase/BLOCK2-RULES-TO-PUBLISH.json` zu veröffentlichen.**

## Fertiges Publish-Artefakt

- Publish-Datei (baut streng additiv auf dem live laufenden `BLOCK9D-RULES-TO-PUBLISH.json` auf):
  **`IronPath/firebase/BLOCK2-RULES-TO-PUBLISH.json`**
- Generator: `node IronPath/firebase/block2-publish-candidate.mjs`
- Trockenlauf gegen die aktuell live geschaltete Baseline (`BLOCK9D-RULES-TO-PUBLISH.json`):
  `node IronPath/scripts/rules-publish-dry-run.mjs IronPath/firebase/BLOCK9D-RULES-TO-PUBLISH.json --candidate IronPath/firebase/BLOCK2-RULES-TO-PUBLISH.json`
  Ergebnis: **0 Blocker**, **6 neue Pfade** (`characterNames/**`, durch `MAINTENANCE_GATE` abgesichert), **1 geprüfte `OR`-Erweiterung** (`players/$uid/name['.validate']`).

Alle bestehenden Live-Regeln (`MAINTENANCE_GATE`, Block 9D `activeSessions`, Block 5 V2 `skills`, Block 4 Freundesporträts `avatar`/`gender`, `social-cleanup` inkl. `friendPrivate/$uid/searchKey` und `friendCodes/$code`, sowie alle Workshop-/Kampagnen-/Koop-Regeln) bleiben unverändert erhalten.

## Was Block 2 technisch umfasst

### 1. Einheitliches strenges Case-Folding (`NFC_CASEFOLD_V2`)

Client (`IronPath/character-name.mjs`) und Audit-Skript (`IronPath/scripts/audit-character-names.py`) teilen sich exakt eine gemeinsame Spezifikation (`NFC -> Unicode full casefold -> NFC`) ohne jede Abweichung:
- `Straße` == `STRASSE` == `STRAẞE`, `ﬁn` == `FIN`, `ΜΑΡΚΟΣ` == `μαρκοσ`.
- Alle 282.230 zugewiesenen Unicode-Codepoints sind zwischen Node.js und Python 100 % abgeglichen (`0` Abweichungen).
- Anzeigelänge bleibt **2–24 UTF-16-Codeunits**; der normalisierte Key in `characterNames/<key>` und `friendNames/<key>` akzeptiert bis zu **96 UTF-8-Bytes** (sodass auch 24-Zeichen-Namen mit Casefold-Expansion wie 24× `ß` gültig bleiben).

### 2. Server-Namensindex (`characterNames/<key>`)

- Felder exakt `{ uid, name, at }`, keine Gesamtauslesung (`.read: false` auf Root), Einzel-Key-Read/Write durch `MAINTENANCE_GATE` geschützt.
- Schreiben erlaubt für: freien Schlüssel, eigenen Inhaber (`uid === auth.uid`) oder verwaiste Reservierung (`at <= now - 21600000` **und** `!root.child('players').child(uid).exists()`).
- Bei Charakterlöschung (`account.js` + `character-deletion.mjs`) wird `characterNames/<key>` auch sitzungsübergreifend zuverlässig per `releaseNameKey`-Fallback atomar mitgelöscht.

### 3. Stille Bestandsmigration beim Login & Konflikt-Dialog (`#nameConflictDialog`)

Gemäß Betreiber-Entscheidung gibt es **keine allgemeine Umbenennungs-Schaltfläche** in den Einstellungen oder der Truppakte. Stattdessen greift beim Profil-Login automatisch `IronPath/character-name-conflict.mjs`:
1. **Freier Name (`claimed`):** Das bestehende Konto reserviert still im Hintergrund `characterNames/<key>` — ohne UI-Unterbrechung.
2. **Noch nicht veröffentlichte Regeln (`unsupported`):** Kein Fehler, keine Blockade — Client arbeitet normal weiter.
3. **Alt-Duplikat (`taken`):** Nur wenn ein anderer Account diesen Namen bereits reserviert hat, erscheint der blockierende Konflikt-Dialog `#nameConflictDialog` (Escape und Hintergrundklick gesperrt), sichert zu, dass **EP, Stufe, Ausrüstung, Fähigkeiten und Kampagne erhalten bleiben**, und führt nach Wahl eines eindeutigen neuen Namens den 5-stufigen atomaren Umzug über `createCharacterRename` (`character-rename.mjs`) aus:
   1. neuen Namen unter `characterNames/<neu>` reservieren
   2. altes Such-Listing `friendNames/<alt>/<uid>` aushängen
   3. `players/<uid>/name` ändern (erlaubt solange ungelistet)
   4. eigenen alten `characterNames/<alt>` nur dann löschen, wenn er diesem Account gehört (lässt den fremden Alt-Inhaber unberührt!)
   5. `friendPrivate/<uid>/searchKey`, `friendNames/<neu>/<uid>` und `friendCodes/<code>` aktualisieren.

## Vor dem Live-Schalten in der Firebase Console

1. Frischen Export der aktuellen Live-Regeln aus der Firebase Console sichern (außerhalb des Repos).
2. Vergleich gegen den Live-Export ausführen:
   ```sh
   node IronPath/scripts/rules-publish-dry-run.mjs /pfad/zu/live-export.json --candidate IronPath/firebase/BLOCK2-RULES-TO-PUBLISH.json
   ```
3. `IronPath/firebase/BLOCK2-RULES-TO-PUBLISH.json` in der Firebase Realtime Database Console veröffentlichen (bzw. falls der Live-Export seit `BLOCK9D` abweicht, mit `node IronPath/firebase/block2-rules-candidate.mjs /pfad/zu/live-export.json` direkt auf diesem Export neu bauen).
4. Optionalen Audit-Lauf gegen einen frischen Datenbank-Export zur Inventur bestehender Alt-Duplikate fahren:
   ```sh
   python3 IronPath/scripts/audit-character-names.py /pfad/zu/live-db-export.json
   ```
