# INKFALL — Befund und Stand

Stand: 30.10.2026 · Branch `arena/8a25b3c4-0815games-github-io` (aufgesetzt auf `main` @ `f49fc32`)

> **Kurzfassung:** Anmelden und Account-Erstellen waren unmöglich, weil der Client
> drei Felder schrieb, die die veröffentlichten Regeln nicht kennen. Der Client
> schreibt jetzt genau das Schema, das die Regeln erlauben. Kein Regel-Deploy
> nötig, damit die Registrierung wieder läuft.

---

## 1. Der Fehler

Gemeldet:

```
@firebase/database: FIREBASE WARNING:
transaction at /usernames/hugo failed: permission_denied
```

Das war nur das erste von **drei** Feldern, die abgelehnt wurden. Die
veröffentlichten Regeln erlauben unter `users/{uid}` ausschließlich:

```
profile, schemaVersion, selectedClass, characters
```

und setzen `"$other": { ".validate": false }`. `$other` fängt jedes nicht
deklarierte Feld ab und lehnt es ab — **und zwar die gesamte Schreiboperation**,
nicht nur das eine Feld. Der Client schrieb:

| Feld | Wo | Von den Regeln erlaubt? |
|---|---|---|
| `save` | `startscreen.js`, Profil anlegen | ❌ nicht deklariert |
| `heroName` | `freshCharacter()` | ❌ nicht deklariert |
| `heroNameLocked` | `freshCharacter()` | ❌ nicht deklariert |
| `/usernames/{name}` | `reservePlayerName()` | ❌ Knoten existiert nicht |

### Warum daraus eine Sackgasse wurde

1. `createUserWithEmailAndPassword()` legt das **Auth-Konto** an ✔
2. `reservePlayerName()` → `usernames/` existiert nicht → `PERMISSION_DENIED`
3. Ausnahme → `prepareAccount()` bricht ab, **bevor** `users/{uid}` geschrieben wird
4. Konto existiert, hat aber kein Profil
5. Nächster Login: Profil fehlt → Name erneut abfragen → zurück zu Schritt 2

Ergebnis: Die Anmeldung funktioniert technisch, das Spiel ist aber nicht
erreichbar. Ein `signedIn: true` bei leerer `users/{uid}` ist genau dieses
Muster.

---

## 2. Warum es so weit kam

`main` wurde zurückgesetzt: **`f49fc32 reset: establish solo-only Firebase rules
and disable coop menu`** — 341 Zeilen Regeln entfernt (Social, Rooms, Usernames,
Legacy-`save`), dazu das Co-op-Menü in `index.html` deaktiviert.

Der Client wurde dabei **nicht** mitgezogen. Er schrieb weiter das alte Schema.

Zwei Nebeneffekte, die die Diagnose erschwert haben:

- Die `main`-Historie ist seit diesem Reset eine **orphan-Historie** (kein
  gemeinsamer Vorfahre mit dem alten Stand). Ein normaler Merge ist unmöglich.
- Meine erste Analyse ging davon aus, die Regeln aus `inkfall/config/` seien
  nicht deployt. Das war falsch — im Repo steht inzwischen genau das
  solo-only-Schema, das auch live gilt. Die Ursache lag im Client.

---

## 3. Was jetzt gilt

Der Client schreibt nur noch, was die Regeln zulassen:

```js
// startscreen.js – Profil anlegen
await reference.set({
  profile: { displayName: name, level: 1, createdAt: ServerValue.TIMESTAMP },
  selectedClass: "knight",
  schemaVersion: 2,
  characters: { knight: characterRecord("knight") }
});
```

`characterRecord()` in `firebase.js` ist das Gegenstück zu `freshCharacter()`:
es entfernt die reinen Client-Felder (`CLIENT_ONLY_CHARACTER_FIELDS`) vor dem
Schreiben. Die Heldennamen-Anzeige fällt dabei auf den Klassennamen zurück
(„Ritter", „Elementarmagier").

Zusätzlich:

- **Keine Namensreservierung mehr.** `usernames/` ist in den Regeln nicht
  vorhanden; der Versuch wäre ein garantierter Fehlschlag. Die Prüfung auf
  unzulässige Zeichen bleibt (`. # $ [ ] /`).
- **Klare Fehlermeldungen.** Scheitert das Profil trotzdem, nennt die Meldung die
  Datei, mit der die Regeln verglichen werden sollen — statt eines nackten
  `PERMISSION_DENIED`.
- **Diagnose.** `firebase.js` protokolliert jetzt, wenn der Browser den
  SDK-Speicher blockiert (siehe §5).

---

## 4. Was dadurch nicht mehr geht

| Funktion | Status | Nötig, um es zurückzuholen |
|---|---|---|
| Anmelden / Account / Spielen / Speichern | ✅ funktioniert | — |
| Eigene Heldennamen | ❌ abgelehnt | `heroName`, `heroNameLocked` in `characters/$classId` erlauben + deployen |
| Eindeutige Spielernamen | ❌ | `usernames/$name` in die Regeln + Reservierung im Client |
| Co-op | ❌ (bewusst deaktiviert) | `rooms/$code` in die Regeln + Menü wieder freigeben |
| Social (Freunde, Präsenz) | ❌ toter Code | 6 Dateien in `index.html` laden **und** Cloud Functions mit App Check betreiben |

Die Social-Schicht (`game/social/*`, ~1.100 Zeilen) wird in `index.html` nicht
geladen und von nichts referenziert. Sie ist derzeit reines Gewicht.

---

## 5. Nebenbefund: „Tracking Prevention blocked access to storage"

Diese Meldungen kommen vom Edge-Tracking-Schutz, nicht vom Spiel: das
Firebase-SDK wird von `www.gstatic.com` geladen und gilt als Drittanbieter,
deshalb wird sein IndexedDB-Zugriff blockiert. Folge: die Anmeldung wird nicht
persistiert, nach einem Neuladen ist der Spieler ausgeloggt.

`firebase.js` setzt die Persistenz jetzt explizit und protokolliert einen
Fehlschlag als Diagnose-Warnung. **Richtige Lösung:** das SDK selbst hosten
(`inkfall/vendor/firebase/`) — dann ist es eigene Quelle, der Speicher wird
nicht blockiert, und zwei externe Hosts fallen weg.

---

## 6. Tests

`tests/rules-schema.test.cjs` (neu) liest die echten Payload-Schlüssel aus dem
Client und vergleicht sie mit den Regeln:

- Felder aus `characterRecord()` ↔ `characters/$classId`
- Felder aus `freshRun()` und `saveGame().run` ↔ `characters/$classId/soloRun`
- Felder des Registrierungs-Payloads ↔ `users/{uid}`
- `save` darf nicht mehr vorkommen, `usernames/` darf nicht mehr beschrieben werden

Gegenprobe gemacht: mit dem alten Payload (`save`) schlägt der Test fehl.

Gesamt: **182 Tests, alle grün.**

---

## 7. Offene Baustellen (Weg B, unverändert gültig)

Der Spielkern ist gesund — 176 Tests, saubere Trennung von Logik und Rendering.
Der Rahmen ist es nicht:

1. **30 `<script>`-Tags, kein Bundler, kein Modul.** Ladereihenfolge ist die API;
   der Spielkern liegt als 362 Zeilen Inline-Code in `index.html`.
2. **Kein Offline-Speicher.** Kein `localStorage`, kein `indexedDB` — jeder
   Speichervorgang braucht Netz, F5 mitten in der Welle ist Fortschritt weg.
3. **Schema doppelt gepflegt.** Client-Payload in JS, Validierung in JSON. Der
   Test aus §6 ist ein Netz, aber die eigentliche Lösung ist eine Quelle.
4. **Toter Code.** `game/social/*`, `game/js/tower-art.js`, Co-op-Module ohne
   erreichbaren Einstieg.
5. **`main`-Historie ist orphan.** Jeder weitere Commit läuft Gefahr, denselben
   Reset-Fehler zu wiederholen, wenn Client und Regeln getrennt gepflegt werden.

Empfohlene Reihenfolge: SDK selbst hosten (§5) → Spielkern aus `index.html`
herauslösen → Offline-Spiegel → Schema aus einer Quelle.
