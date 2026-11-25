# Arbeitsanweisung für Tiny Tycoon Towns

Gilt für alle Änderungen in `tiny-tycoon-towns/`, einschließlich Firebase-Regeln,
Tests und Patches. Sie folgt dem Muster von IronPath (`IronPath/scripts/patch.mjs`, `rules-publish-dry-run.mjs`). Der Ablauf steht
in [`docs/PATCH-ABLAUF.md`](docs/PATCH-ABLAUF.md).

1. Vor der Arbeit `docs/ROADMAP.md` (Fahrplan) und `docs/PATCH-LOG.md` lesen, danach bei Bedarf `docs/PATCH-BLOECKE.md`
   und `docs/FIREBASE.md`. Vorhandene Arbeit, den aktuellen Branch und uncommittete
   Änderungen berücksichtigen.
2. Jeden in sich abgeschlossenen Schritt im Patch-Log festhalten: Ziel, Dateien,
   tatsächliche Änderungen, Tests mit Zahlen, Grenzen und offene Punkte. Eine lokale
   Änderung ausdrücklich als lokal kennzeichnen.
3. Commit, Push, PR, Merge, Regel-Veröffentlichung oder Deployment erst nach dem
   tatsächlichen Ereignis mit belegbarer Kennung als neues Log-Ereignis ergänzen.
   Keine Hashes, PRs, Freigaben oder Nutzerbestätigungen erfinden.
4. Nachweisgrad ehrlich angeben: Unit-Test, Emulator, Browser mit Test-Doubles,
   echtes Gerät, produktiver Test. Keine Zugangsdaten, Tokens, UIDs oder
   privaten Schlüssel in Log, Doku oder Code.
5. Reihenfolge der Blöcke in `docs/PATCH-BLOECKE.md` einhalten. Regeln nur mit
   Dry-Run (`npm run rules:check -- <export.json>`) und Backup veröffentlichen.
6. Nach jeder Veröffentlichung eine verständliche Liste für den Betreiber schreiben:
   was geändert wurde, welche Schritte er testen soll, welches Ergebnis erwartet
   wird, offene Punkte und der tatsächliche Live-Status. Die Stadtchronik
   (`src/patch-notes.mjs`) fortschreiben. Jede Zeile braucht DE und EN.

## Regel-Änderungen melden (Pflicht)

Ändert ein Schritt `firebase/database.rules.json`, endet die Antwort mit einem deutlichen
**!** und dem Raw-Link zur Datei auf dem aktuellen Arbeitszweig, zum Kopieren und Einfügen in
die Firebase-Konsole. Form des Links:
`https://raw.githubusercontent.com/0815games/0815games.github.io/<Zweig>/tiny-tycoon-towns/firebase/database.rules.json`
Der Link zeigt nur auf den Stand, der auf GitHub liegt. Vorher pushen.
