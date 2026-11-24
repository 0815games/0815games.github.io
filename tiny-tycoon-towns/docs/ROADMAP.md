# Fahrplan: Tiny Tycoon Towns

Stand: 2026-11-24, nach PR #424 (TTT-0024). Dieser Fahrplan ist die Datei, an der wir uns entlanghangeln.

## So wird diese Datei benutzt

- **Jetzt** ist die Reihenfolge der nächsten Schritte. Oben steht, was als Nächstes dran ist.
- **Offen** ist alles, was noch nicht fertig ist, nach Phasen gegliedert.
- **Entscheidungen** hält fest, was schon geklärt ist. Änderungen nur mit einer Zeile Begründung.
- **Erledigt** ist die Ablage. Ein Punkt wandert dorthin, sobald er fertig ist, mit TTT-Nummer. Ist er im Spiel veröffentlicht, steht er zusätzlich in `src/patch-notes.mjs`, damit die Stadtchronik ihn zeigt.
- Der Designplan mit allen Zahlen bleibt `docs/GAME_PLAN.md`. Dessen Abschnitt 12 (Technikstack TypeScript, Pixi, Firestore) ist überholt und wird nicht mehr abgehakt. Gebaut wird in Vanilla-JS mit Realtime Database und `node --test`.
- Einwände des Nutzers kommen direkt in **Offen** oder **Entscheidungen**, mit Datum.
- Die Ereignisse selbst (Commit, PR, Veröffentlichung) gehören ins Patch-Log, nicht hierher.

Zuständig: **N** = Nutzer (Geräte, Konsole, Entscheidungen), **A** = Agent (Code, Tests, Doku).

---

## Jetzt (in dieser Reihenfolge)

1. **[N]** Regeln `charters/$uid` aus `tiny-tycoon-towns/firebase/database.rules.json` veröffentlichen. Ohne das speichern Freibriefe nicht. (TTT-0024)
2. **[N]** Gerätetest Freunde auf zwei Geräten: Anfrage, Annahme, Besuch, Name und Code. (TTT-0018, TTT-0019)
3. **[N]** Gerätetest Freibriefe, Münzpille und Symbolkosten beim Bauen. (TTT-0024)
4. **[A]** Balance: Stadtlevel 5 auf 4 bis 8 h aktive Spielzeit. Entschieden am 2026-11-24. Die Werte fehlen noch (siehe Punkt 5).
5. **[N]** Balance-Kurve wählen. Alle XP-Schwellen gleichmäßig mit einem Faktor skalieren: Faktor 40 bringt Stadtlevel 5 auf 4,1 bis 8,5 h aktiver Zeit. Die Folge: Stadtlevel 8 und der erste Freibrief rücken in den Bereich von Monaten. Wir brauchen eine Entscheidung, ob der Freibrief dann anders gebaut wird. Messung: TTT-0027.
6. **[A]** Service Worker für schnelleres Laden, ohne Offline-Spiel (Entscheidung vom 2026-11-24, siehe Entscheidungen). Das Versions-Gate bleibt unverändert.
7. **[A]** Einstellungen: Sprache DE und EN, Ton, Bewegung reduzieren, Zahlenformat. (B4)
8. **[A]** Emulator-Tests für die Regeln einrichten. Braucht Java und `firebase-tools`. Vorher prüfen, ob die Umgebung das kann. (B2)
9. **[N]** Standort entscheiden: RTDB liegt in `europe-west1`, ADR-005 nannte Frankfurt. (B2)
10. **[N]** Autorisierte Domains in Firebase Auth prüfen. (B2)

## Offen

### Phase 1: Solo-Kern

- **[A]** Effekte, Animationen, SFX, Tagesfilter. (B4, GAME_PLAN 5.5)
- **[A]** Audio: Biom-Musik, Effekte. (GAME_PLAN 5.8)
- **[A]** Stadtlevel-Feinschliff. (B3)
- **[?]** Google-Verknüpfung, Export und Import als JSON. Im Plan für Woche 3 vorgesehen. Bisher nicht geprüft, ob das gebaut ist.
- **[A]** Ende-zu-Ende-Test für die Anmeldung bis zum Anmeldezustand (Browser). Mehr geht in der Sandbox nicht.
- **[A]** Balance-Simulation steht (`npm run simulate`, TTT-0026). Offen: Werte anpassen (Jetzt 4 und 5), Playtests. (GAME_PLAN 8.2, 8.3)
- **[N]** Playtests mit 5 Personen. (GAME_PLAN 8.3)
- **[N]** Onboarding messen: unter 5 Minuten. Das Tutorial mit Schritten existiert (`src/tutorial.js`), die Zeit wurde nie gemessen.
- **[A]** Ungenutzte Variable `RESOURCE_ORDER` in `src/admin.js` entfernen oder nutzen.
- **[?]** Im Plan steht „11 Gebäude“, im Spiel sind es 11 (`data/buildings.json`). Plan-Text anpassen oder nicht.

### Phase 3: Multiplayer (teilweise gebaut)

- **[N]** Freunde auf Geräten prüfen (siehe Jetzt 2).
- **[A]** Spieler-Handel, Konvois zwischen Spielern, serverseitige Validierung, Routenanfragen. (W9, W10)
- **[A]** Feature-Flag `mp_enabled` für stufenweises Ausrollen. (W10)
- **[N]** Sichtbarkeit von Münzen und Lager für Freunde: aktuell sichtbar, siehe Entscheidungen.

### Phase 2: Solo-Handel (später)

- NPC-Städte, Routen, Konvois, Kronen, Kosmetik, Push-Nachrichten. (GAME_PLAN Phase 2)
- Eilpost-Perk wirkt erst mit Konvois. (TTT-0024)

### Phase 4: Ausbau (später)

- Ligen, Saisonfest, Geisterstädte, App-Store-Builds, Monetarisierung, vollständige Englisch-Lokalisierung.

### Ohne Termin

- Name und Marke „Tiny Tycoon Towns“: Markenprüfung nötig, vor P1-W4. (GAME_PLAN 14)
- Werbung, native Strategie, Web-Zahlungen, Studio und Impressum: vor P4. (GAME_PLAN 14)

## Entscheidungen

- Stadtlevel 5: 4 bis 8 h aktive Spielzeit. (2026-11-24, Nutzerentscheidung. Die Werte sind noch nicht angepasst.)
- Offline-Start: Nein. Das Spiel startet nur mit Bestätigung vom Server (Netz nötig). Das Versions-Gate bleibt wie in ADR-update-gate. (2026-11-24, Nutzerentscheidung)
- Dialoge schließen beim Klick daneben. Ausnahmen: Sitzungsübernahme und Stadtgründung (erzwungene Entscheidungen).
- Keine browsernativen Popups. Alle Meldungen, Rückfragen und Scrollbars sind im Spiel. (TTT-0016)
- Freundescode: 6 Zeichen, Großbuchstaben und Ziffern, ohne 0, O, 1, I. Zufällig, bei Kollision neu. (TTT-0018)
- Stadtnamen sind eindeutig. (TTT-0018)
- Einladungen brauchen die Zustimmung des Empfängers. (TTT-0018)
- Besuch fremder Städte ist nur lesend. Die Zeit wird lokal fortgeschrieben, nichts wird zurückgeschrieben. (TTT-0019)
- Münzen und Lager sind für Freunde beim Besuch sichtbar. Die Regeln geben heute die ganze Stadt frei. Eine Änderung wäre eine neue Entscheidung. (Stand 2026-11-24)
- Doppelte Stadtnamen: Die ältere Stadt bekommt eine Nummer, nur nach Rückfrage. Nur umsetzen, wenn ein Duplikat entsteht. (TTT-0022)
- Admin-Änderung an einer gerade gespielten Stadt: Hinweis mit Neuladen-Knopf, nicht automatisch. (TTT-0013)
- Freibrief-Perks: Ertrag, Lagerhaus, Warenkenner, Gedächtnis und Startkapital wirken. Eilpost folgt mit P2. (TTT-0024)
- Freibrief-Gründung: Stadtlevel 8 und 100.000 Münzen Gesamtertrag in dieser Stadt. Die Stadt startet neu, Name und Freunde bleiben. (TTT-0023)
- Intro-Logo fliegt auf Größe und Position des Kartenlogos und bleibt dort. (TTT-0019, TTT-0020)
- Fremde Städte sind für andere nur lesbar. Schreiben nur Besitzer und Admin. (TTT-0017)
- Admin-Regeln sind live und vom Nutzer bestätigt. Nicht erneut fragen.
- Der Name im Menü ist „Stadtchronik“ (vorher „Feldnotizen“). (TTT-0025)

## Erledigt

- **P1 Kern, Spielfeld und Ablauf:** Raster, 4 Biome, 11 Gebäude, 8 Ressourcen, Verkauf, Händler, Stadtlevel, Offline-Fortschritt, Tutorial. (TTT-0001, TTT-0006)
- **Konto und Cloud-Speicher:** Anmeldung mit E-Mail, Speicher in der Realtime Database, Sitzungssperre: nur ein Gerät gleichzeitig. (TTT-0002, TTT-0007)
- **Patch-Werkzeug:** `check`, `bump`, Patch-Log, Patch-Notes. (TTT-0003)
- **Ladeproblem behoben:** „Stadt wird geladen“ hängt nicht mehr. (TTT-0005)
- **Oberfläche:** Logo, Intro, Vollbild-Karte, Feld-Popup, Lager-Dialog, Menü oben rechts, keine Browser-Dialoge. (TTT-0009 bis TTT-0016)
- **Betreiber-Bereich:** Admin-Panel, Hinweis mit Neuladen. (TTT-0013, TTT-0017)
- **Freunde und Besuch:** Freundescode, Einladungen, Besuch nur lesend, eindeutige Stadtnamen. (TTT-0018, TTT-0019)
- **Freibriefe:** Rechenregeln (TTT-0023), Gründung, Perk-Baum und Perk-Wirkung (TTT-0024).
- **Anzeige:** Münzpille auf der Karte, Baukosten als Symbole mit Vorrat. (TTT-0024)
- **Stadtchronik:** Umbenennung von „Feldnotizen“. (TTT-0025)
