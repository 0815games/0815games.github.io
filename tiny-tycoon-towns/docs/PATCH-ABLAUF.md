# Patch-Ablauf

Wie ein Update in `tiny-tycoon-towns/` läuft. Verbindlich ist
[`../AGENTS.md`](../AGENTS.md). Das Werkzeug ist `scripts/patch.mjs`, die Regeln
`scripts/rules-publish-dry-run.mjs`.

## Begriffe und Status

| Status | Bedeutung | Belegt durch |
| --- | --- | --- |
| `lokal/uncommittet` | nur im Arbeitsbaum | `git status` |
| `committet` | in einem lokalen Commit | Commit-Hash |
| `gepusht` | auf dem Arbeitszweig auf GitHub | `git log origin/<zweig>..HEAD` leer |
| `PR offen` | Pull Request existiert, nicht gemergt | PR-Nummer |
| `gemergt` | in `main` übernommen | Merge-Commit |
| `veröffentlicht` | Firebase-Regeln live bzw. Seite ausgeliefert | Konsole/Deploy-Ausgabe, Betreiberbestätigung |
| `abgenommen` | vom Betreiber auf einem Gerät geprüft | seine Aussage |

## 1. Vor der Arbeit

```sh
cd tiny-tycoon-towns
npm run check          # Vorprüfung: stempel, struktur, patchlog, geheimnisse, regeln
```

Patch-Log lesen (neueste Einträge zuerst beachten), offene Punkte aus dem letzten
Eintrag kennen. Ist die Vorprüfung rot, zuerst klären.

## 2. Während der Arbeit

- Ein logischer Schritt = ein Commit. Produktcode und sein Test zusammen.
- Jeden Wächter auf Bissfestigkeit prüfen: absichtlich kaputt machen, Test muss rot
  werden, Probe rückgängig. Ein Test, der nie rot war, belegt nichts.
- Nichts in die Spielwurzel, was der Browser nicht lädt. Code liegt in `src/`,
  Daten in `data/`, Tests und Werkzeuge in `tests/` und `scripts/`.
- Neue Importe in `src/` tragen die aktuelle Welle (`?v=`). Das setzt `bump` automatisch.

## 3. Nach der Änderung

```sh
npm test                  # Domain, Regeln, Stadtchronik, Werkzeug
npm run check:suite       # Vorprüfung plus alle Tests
```

Ins Log gehören die echten Zahlen: `tests / pass / fail` und der Exit-Code.

## 4. Cache-Welle

Jede Veröffentlichung trägt ein Token `20YYMMDD-name`, z. B. `20261124-konto1`.

```sh
node scripts/patch.mjs bump 20261201-name            # Trockenlauf
node scripts/patch.mjs bump 20261201-name --apply    # schreiben
```

Danach ist `check` **rot**, bis `src/patch-notes.mjs` einen neuen Eintrag ganz
oben in `RELEASED_PATCHES` mit genau diesem Token hat. Das ist Absicht.

## 5. Patch-Log

Vorlage: [`patch-log-vorlage.md`](patch-log-vorlage.md). Kennung `TTT-NNNN`,
fortlaufend ohne Lücke. `npm run check` prüft die Nummerierung und sucht nach
Firebase-Schlüsseln im Log.

## 6. Firebase-Regeln veröffentlichen

Vollständige Anleitung mit Konsolenlink: [`FIREBASE.md`](FIREBASE.md). Kurz:

1. Backup der Live-Regeln exportieren (lokal, nicht ins Repo).
2. `npm run rules:check -- <backup.json>`. Rot heißt: nicht veröffentlichen.
3. Veröffentlichen über die Konsole oder `npx firebase-tools deploy --only database`.
4. Den Test in FIREBASE.md durchführen und das Ergebnis ins Log eintragen.

## 7. Commit, Push, Pull Request

- Commit-Text: Ziel, Dateien, Prüfungen mit Zahlen, Grenzen.
- Push nur auf den Arbeitszweig dieser Sitzung.
- Ereignisse (Commit, Push, PR, Veröffentlichung) nach dem Ereignis ins Log.

## 8. Nach der Veröffentlichung

1. Stadtchronik in `src/patch-notes.mjs` ergänzen, DE und EN, veröffentlicht und offen getrennt.
2. `docs/PATCH-BLOECKE.md` aktualisieren, ohne offene Kriterien zu streichen.
3. Betreiber-Liste: was zu prüfen ist, mit erwartetem Ergebnis. Keine Geräteabnahme behaupten, die nicht stattfand.

## Was die Werkzeuge nicht tun

`check` liest und meldet. `bump` schreibt nur mit `--apply`. `rules-publish-dry-run` veröffentlicht
nichts und verbindet sich nicht mit Firebase. Kein Git-Hook erzwingt etwas: Ereignisse
außerhalb dieses Ablaufs muss man selbst nachtragen.
