# Patch-Blöcke: Schnellübersicht

Die Reihenfolge folgt dem Spielplan (`GAME_PLAN.md`, Abschnitt 12). Der Plan selbst
ist die Quelle für Zahlen und Abnahmekriterien. Hier steht nur der Fortschritt.

| Block | Inhalt | Stand |
| --- | --- | --- |
| B1 Domain und Slice | Regeln, Formeln, Gelände, Händler, Offline, Spielfeld, Bauen, Verkauf | im Branch, Tests grün (31 Domain-Tests, siehe TTT-0001) |
| B2 Konto und Cloud | E-Mail-Anmeldung, Realtime Database, Regeln, Patch-Werkzeug | im Code, Regeln **nicht veröffentlicht**, Anmeldung **nicht auf Gerät geprüft** (TTT-0002) |
| B3 Fortschritt | Stadtlevel-Feinschliff, Freibrief und Perks, Onboarding (4 Schritte) | offen |
| B4 Ausbau | Einstellungen (DE/EN), Effekte, Audio, PWA-Manifest | offen |
| B5 Handel (P2) | NPC-Städte, Routen, Konvois, Kosmetik | offen, erst nach Abnahme von B1 bis B4 |

## Offene Kriterien (nicht streichen)

- Regeln in Firebase veröffentlichen und den Zugriffstest aus `FIREBASE.md` belegen.
- Emulator-Tests für die Regeln einrichten (braucht Java und `firebase-tools`).
- Anmeldung und Cloud-Speicher auf einem echten Gerät prüfen.
- Entscheidung zum Standort: RTDB `europe-west1` ist angelegt, ADR-005 nannte Frankfurt.
- Autorisierte Domains in Firebase Auth prüfen.
- Balance-Simulation (`GAME_PLAN.md` 8.2) und Playtests.
