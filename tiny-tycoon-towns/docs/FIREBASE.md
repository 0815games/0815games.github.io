# Firebase: Konto, Speicher und Regeln

Projekt: `tiny-tycoon-towns`. Die Web-Konfiguration steht in
[`src/firebase-config.js`](../src/firebase-config.js). Sie ist öffentlich und kein
Geheimnis. Geschützt wird über Anmeldung und Regeln.

## Stand der Dienste (Betreiberangabe)

| Dienst | Zustand | Hinweis |
| --- | --- | --- |
| Realtime Database | Sperrmodus, Instanz `tiny-tycoon-towns-default-rtdb`, Region `europe-west1` | Der Standort ist nach dem Anlegen nicht änderbar. Der Plan (ADR-005) nannte `europe-west3` für Firestore. Das ist zu entscheiden und festzuhalten. |
| Authentication | E-Mail/Passwort aktiviert | Registrierung und Anmeldung sind im Code umgesetzt. |

**Autorisierte Domains prüfen:** In der Konsole unter Authentication → Settings →
Authorized domains muss der Host der Seite stehen (`0815games.github.io`). Für lokale
Tests zusätzlich `localhost`. Ohne Eintrag schlägt die Anmeldung fehl.

## Regeln

Datei: [`../firebase/database.rules.json`](../firebase/database.rules.json)

Zugriffsmodell:
- `saves/{uid}/town`: nur der angemeldete Nutzer mit dieser UID darf lesen und schreiben.
- Schema-Prüfung bei jedem Schreiben: Pflichtfelder, Wertebereiche, Biome, Terrain.
- Schema-Downgrade wird abgewiesen (`schemaVersion` darf nicht sinken).
- Unbekannte Felder im Stadtdokument werden abgewiesen.
- Die Wurzel bleibt geschlossen: alles außer `saves/{uid}/town` ist gesperrt.

**Bekannte Grenzen (ehrlich):**
- Ressourcen- und Kachel-Schlüssel werden nur auf Typ und Pflichtfelder geprüft, nicht
  gegen die Liste der 8 Ressourcen und das 10×10-Raster. Das ist für P1 vertretbar,
  weil die Regeln nur den eigenen Spielstand betreffen.
- Die Regeln sind nicht mit dem Emulator getestet (Java fehlt in der Sandbox). Das
  steht als offener Punkt in `src/patch-notes.mjs`.

## Veröffentlichen (Ablauf)

Die Regeln sind im Repo, aber **noch nicht in Firebase veröffentlicht**. Das macht
der Betreiber, nicht der Agent.

1. **Backup.** Konsole öffnen: <https://console.firebase.google.com/project/tiny-tycoon-towns/database/tiny-tycoon-towns-default-rtdb/rules>.
   Die aktuellen Live-Regeln kopieren oder exportieren und lokal als
   `firebase/backup/live-rules.json` speichern. Der Ordner ist in `.gitignore`.
2. **Trockenlauf.** Im Projektordner:
   ```sh
   npm run rules:check -- firebase/backup/live-rules.json
   ```
   Ergebnis `Regeln: OK` heißt: Nichts, was live existiert, fällt weg. Bei
   `würde entfernt: …` nicht veröffentlichen, sondern klären.
3. **Veröffentlichen.** Entweder in der Konsole den Inhalt von
   `firebase/database.rules.json` einfügen und veröffentlichen, oder per CLI:
   ```sh
   npx firebase-tools login
   npx firebase-tools deploy --only database --project tiny-tycoon-towns
   ```
   Die CLI nutzt `firebase.json` und `.firebaserc`. Anmeldedaten gehören nicht ins Repo.
4. **Test auf Live-Daten** (zwei Konten, zwei Browser oder ein privates Fenster):
   - Konto A meldet sich an, gründet eine Stadt, wartet bis zur Cloud-Speicherung.
   - Konto A meldet sich auf einem zweiten Gerät an: dieselbe Stadt erscheint.
   - Konto B versucht über die Konsole oder ein Skript, `saves/<UID von A>/town` zu
     lesen: muss mit `permission_denied` scheitern.
5. **Ergebnis ins Patch-Log** als Ereignis eintragen (Zeit, Schritte, Ergebnis).

## Zurückrollen

Das Backup aus Schritt 1 in der Konsole wieder veröffentlichen. Das ist eine
Betreiberaktion und dauert wenige Minuten.
